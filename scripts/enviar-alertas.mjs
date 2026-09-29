/**
 * AgrícolaGT · Envío programado de alertas
 *
 * Consulta el pronóstico de Atescatempa, evalúa las mismas condiciones que la
 * aplicación y envía un aviso a cada dispositivo registrado. Se ejecuta de
 * forma automática, por lo que el agricultor recibe la alerta aunque tenga la
 * aplicación y el navegador cerrados.
 *
 * Variables de entorno necesarias:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENWEATHER_KEY,
 *   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY
 */
import webpush from 'web-push'

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  OPENWEATHER_KEY,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY,
} = process.env

const faltantes = Object.entries({
  SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENWEATHER_KEY, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY,
}).filter(([, v]) => !v).map(([k]) => k)

if (faltantes.length) {
  console.error('Faltan variables de entorno:', faltantes.join(', '))
  process.exit(1)
}

webpush.setVapidDetails('mailto:proyectoagricola47@gmail.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

/** Identificador de Atescatempa, Jutiapa, en el servicio de datos climáticos. */
const ID_ATESCATEMPA = 3599633

// ------------------------------------------------------------------
// Acceso a la base de datos mediante la interfaz REST
// ------------------------------------------------------------------
const cabeceras = {
  apikey: SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
}

async function consultar(ruta) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${ruta}`, { headers: cabeceras })
  if (!res.ok) throw new Error(`Consulta fallida (${res.status}): ${await res.text()}`)
  return res.json()
}

async function insertarNotificacion(fila) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/notifications`, {
    method: 'POST',
    headers: { ...cabeceras, Prefer: 'return=minimal' },
    body: JSON.stringify(fila),
  })
  if (res.status === 409) return false          // ya existía: la clave de repetición actuó
  if (!res.ok) throw new Error(`Inserción fallida (${res.status}): ${await res.text()}`)
  return true
}

async function borrarSuscripcion(endpoint) {
  await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(endpoint)}`,
    { method: 'DELETE', headers: cabeceras })
}

// ------------------------------------------------------------------
// Clima y evaluación de condiciones
// ------------------------------------------------------------------
async function obtenerPronostico() {
  const url = `https://api.openweathermap.org/data/2.5/forecast?id=${ID_ATESCATEMPA}&appid=${OPENWEATHER_KEY}&units=metric&lang=es`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Clima no disponible (${res.status})`)
  return res.json()
}

/**
 * Evalúa las mismas seis condiciones que la aplicación, sobre la ventana de
 * pronóstico disponible. El índice ultravioleta no se incluye porque este
 * servicio no lo provee; esa alerta se sigue generando en la aplicación.
 */
function derivarAlertas(pronostico) {
  const lista = pronostico.list ?? []
  if (!lista.length) return []

  const ahora = Date.now()
  const dentroDe = (horas) => lista.filter((e) => e.dt * 1000 <= ahora + horas * 3600 * 1000)

  const alertas = []

  const tresDias = dentroDe(72)
  const popMax = Math.max(0, ...tresDias.map((e) => e.pop ?? 0))
  const lluviaDosDias = dentroDe(48).reduce((s, e) => s + (e.rain?.['3h'] ?? 0), 0)
  if (popMax >= 0.7 || lluviaDosDias >= 20) {
    alertas.push({
      titulo: 'Riesgo de lluvias intensas',
      cuerpo: 'Alta probabilidad de lluvias en los próximos días. Considera proteger cultivos y revisar drenajes.',
      severidad: popMax >= 0.85 || lluviaDosDias >= 35 ? 'high' : 'medium',
    })
  }

  const cincoDias = dentroDe(120)
  const tempMax = Math.max(...cincoDias.map((e) => e.main?.temp_max ?? -99))
  if (tempMax >= 32) {
    alertas.push({
      titulo: 'Ola de calor probable',
      cuerpo: 'Temperaturas elevadas previstas. Vigila riego y estrés hídrico; evitar labores en horas de máximo sol.',
      severidad: tempMax >= 36 ? 'high' : 'medium',
    })
  }

  const rachaMax = Math.max(0, ...cincoDias.map((e) => (e.wind?.gust ?? 0) * 3.6))
  if (rachaMax >= 35) {
    alertas.push({
      titulo: 'Rachas de viento',
      cuerpo: 'Rachas considerables previstas. Evita aspersiones y labores que dependan de baja deriva.',
      severidad: rachaMax >= 50 ? 'high' : 'medium',
    })
  }

  const humedadMin = Math.min(100, ...cincoDias.map((e) => e.main?.humidity ?? 100))
  if (humedadMin <= 35) {
    alertas.push({
      titulo: 'Humedad ambiental baja',
      cuerpo: 'Ambiente seco. Refuerza riego y monitorea estrés hídrico en cultivos sensibles.',
      severidad: 'medium',
    })
  }

  // Días sin lluvia dentro de la ventana disponible
  const porDia = new Map()
  for (const e of cincoDias) {
    const dia = new Date(e.dt * 1000).toISOString().slice(0, 10)
    const actual = porDia.get(dia) ?? { lluvia: 0, pop: 0 }
    actual.lluvia += e.rain?.['3h'] ?? 0
    actual.pop = Math.max(actual.pop, e.pop ?? 0)
    porDia.set(dia, actual)
  }
  const diasSecos = [...porDia.values()].filter((d) => d.lluvia < 1 && d.pop < 0.2).length
  if (diasSecos >= 4) {
    alertas.push({
      titulo: 'Sequía probable',
      cuerpo: 'Poca o nula precipitación en los próximos días. Planifica riego y conserva humedad del suelo.',
      severidad: 'medium',
    })
  }

  return alertas
}

/** Fecha local de Guatemala, para que la clave de repetición cambie a medianoche. */
function fechaLocalGuatemala() {
  const d = new Date(Date.now() - 6 * 3600 * 1000)
  return d.toISOString().slice(0, 10)
}

// ------------------------------------------------------------------
// Envío
// ------------------------------------------------------------------
async function enviar(suscripcion, carga) {
  try {
    await webpush.sendNotification(
      {
        endpoint: suscripcion.endpoint,
        keys: { p256dh: suscripcion.p256dh, auth: suscripcion.auth },
      },
      JSON.stringify(carga),
    )
    return true
  } catch (e) {
    // 404 y 410 significan que el navegador ya descartó esa credencial
    if (e.statusCode === 404 || e.statusCode === 410) {
      console.log('  credencial caducada, se elimina')
      await borrarSuscripcion(suscripcion.endpoint)
    } else {
      console.error('  fallo de envío:', e.statusCode, e.body ?? e.message)
    }
    return false
  }
}

async function principal() {
  const suscripciones = await consultar('push_subscriptions?select=user_id,endpoint,p256dh,auth,modo_demo')
  console.log(`Dispositivos registrados: ${suscripciones.length}`)
  if (!suscripciones.length) return

  const pronostico = await obtenerPronostico()
  const alertas = derivarAlertas(pronostico)
  const actual = pronostico.list?.[0]
  console.log(`Condiciones evaluadas. Alertas vigentes: ${alertas.length || 'ninguna'}`)

  const hoy = fechaLocalGuatemala()
  let enviados = 0

  for (const s of suscripciones) {
    // Alertas reales: una vez al día por título y usuario
    for (const a of alertas) {
      if (a.severidad !== 'high' && a.severidad !== 'medium') continue
      const nueva = await insertarNotificacion({
        user_id: s.user_id,
        title: a.titulo,
        body: a.cuerpo,
        type: 'clima',
        severity: a.severidad,
        dedup_key: `${a.titulo}|${hoy}`,
      })
      if (nueva && a.severidad === 'high') {
        if (await enviar(s, { title: a.titulo, body: a.cuerpo, tag: a.titulo })) enviados++
      }
    }

    // Verificación periódica, solo para los dispositivos en modo de demostración
    if (s.modo_demo) {
      const hora = new Date(Date.now() - 6 * 3600 * 1000).toISOString().slice(11, 16)
      const temp = actual?.main?.temp != null ? `${Math.round(actual.main.temp)} °C` : 'sin dato'
      const desc = actual?.weather?.[0]?.description ?? 'sin dato'
      const cuerpo = `Atescatempa: ${desc}, ${temp}. Enviada a las ${hora}.`
      await insertarNotificacion({
        user_id: s.user_id,
        title: 'Verificación del sistema de notificaciones',
        body: cuerpo,
        type: 'prueba',
        severity: 'low',
        dedup_key: null,
      })
      if (await enviar(s, {
        title: 'Verificación del sistema de notificaciones',
        body: cuerpo,
        tag: 'verificacion',
      })) enviados++
    }
  }

  console.log(`Avisos enviados: ${enviados}`)
}

principal().catch((e) => {
  console.error(e)
  process.exit(1)
})
