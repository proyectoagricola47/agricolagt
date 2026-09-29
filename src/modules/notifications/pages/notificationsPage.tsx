import { useEffect, useState } from 'react'
import type { AppNotification } from '../../../model/notification'
import {
  listarMisNotificaciones,
  marcarComoLeida,
  marcarTodasComoLeidas,
  estadoDelPermiso,
  pedirPermisoDesdeBoton,
  enviarPruebaDeNotificacion,
} from '../services/notificationService'
import {
  soportaPush,
  estaSuscrito,
  suscribirDispositivo,
  desuscribirDispositivo,
  modoDemoActivo,
  cambiarModoDemo,
} from '../services/pushService'

function formatoFecha(iso: string): string {
  try {
    return new Date(iso).toLocaleString('es-GT', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

const ESTILO_SEVERIDAD: Record<string, string> = {
  high: 'border-red-300 bg-red-50',
  medium: 'border-amber-300 bg-amber-50',
  low: 'border-emerald-300 bg-emerald-50',
}

const ICONO_SEVERIDAD: Record<string, string> = {
  high: '⚠️',
  medium: '🟡',
  low: '✅',
}

export default function NotificationsPage() {
  const [items, setItems] = useState<AppNotification[]>([])
  const [cargando, setCargando] = useState(true)
  const [permiso, setPermiso] = useState(estadoDelPermiso())

  async function cargar() {
    setCargando(true)
    try {
      setItems(await listarMisNotificaciones())
    } catch (e) {
      console.error(e)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargar() }, [])

  async function activarPermiso() {
    const r = await pedirPermisoDesdeBoton()
    setPermiso(r)
  }

  // --- Verificación del módulo ---
  const [enviando, setEnviando] = useState(false)
  const [avisoPrueba, setAvisoPrueba] = useState<string | null>(null)
  const [repetir, setRepetir] = useState(false)

  async function enviarPrueba() {
    setEnviando(true)
    setAvisoPrueba(null)
    try {
      // El permiso se solicita aquí porque este código nace de un toque del
      // usuario, que es lo que exigen los navegadores móviles.
      const r = await pedirPermisoDesdeBoton()
      setPermiso(r)
      const cuerpo = await enviarPruebaDeNotificacion()
      setAvisoPrueba(cuerpo)
      await cargar()
    } catch (e: any) {
      console.error(e)
      setAvisoPrueba(e?.message ?? 'No se pudo enviar la notificación de prueba.')
    } finally {
      setEnviando(false)
    }
  }

  // --- Avisos con la aplicación cerrada ---
  const [suscrito, setSuscrito] = useState(false)
  const [ocupadoPush, setOcupadoPush] = useState(false)
  const [errorPush, setErrorPush] = useState<string | null>(null)

  useEffect(() => {
    if (!soportaPush()) return
    estaSuscrito().then(setSuscrito).catch(() => setSuscrito(false))
    modoDemoActivo().then(setRepetir).catch(() => setRepetir(false))
  }, [])

  async function alternarSuscripcion() {
    setOcupadoPush(true)
    setErrorPush(null)
    try {
      if (suscrito) {
        await desuscribirDispositivo()
        setSuscrito(false)
        setRepetir(false)
      } else {
        await suscribirDispositivo()
        setSuscrito(true)
        setPermiso(estadoDelPermiso())
      }
    } catch (e: any) {
      console.error(e)
      setErrorPush(e?.message ?? 'No se pudo registrar el dispositivo.')
    } finally {
      setOcupadoPush(false)
    }
  }

  async function alternarDemo(activo: boolean) {
    setOcupadoPush(true)
    setErrorPush(null)
    try {
      await cambiarModoDemo(activo)
      setRepetir(activo)
      if (activo) setSuscrito(true)
    } catch (e: any) {
      console.error(e)
      setErrorPush(e?.message ?? 'No se pudo cambiar el modo de demostración.')
    } finally {
      setOcupadoPush(false)
    }
  }

  async function leerTodas() {
    await marcarTodasComoLeidas().catch(console.error)
    cargar()
  }

  async function leerUna(id: string) {
    await marcarComoLeida(id).catch(console.error)
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const noLeidas = items.filter((n) => !n.read).length

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold">Notificaciones</h1>
          <p className="text-sm text-gray-600">
            {noLeidas > 0 ? `Tienes ${noLeidas} sin leer` : 'No tienes notificaciones sin leer'}
          </p>
        </div>
        {noLeidas > 0 && (
          <button
            onClick={leerTodas}
            className="px-3 py-2 rounded-lg border border-primary-500 text-primary-700 hover:bg-primary-50 text-sm"
          >
            Marcar todas como leídas
          </button>
        )}
      </div>

      {permiso === 'default' && (
        <div className="mb-6 rounded-xl border border-primary-200 bg-primary-50 p-4">
          <p className="text-sm text-gray-800">
            Activa las notificaciones para recibir los avisos de sequía, lluvia intensa y
            ola de calor aunque no tengas la aplicación abierta.
          </p>
          <button
            onClick={activarPermiso}
            className="mt-3 px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 text-sm"
          >
            Activar notificaciones
          </button>
        </div>
      )}

      {/* Verificación del módulo de notificaciones */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="font-semibold text-gray-900">Verificar el funcionamiento</h2>
        <p className="mt-1 text-sm text-gray-600">
          Envía una notificación con el estado actual del clima de Atescatempa. Sirve para
          comprobar que el permiso está concedido y que el historial registra correctamente,
          sin esperar a que se presente una condición climática adversa.
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            onClick={enviarPrueba}
            disabled={enviando}
            className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 text-sm disabled:opacity-60"
          >
            {enviando ? 'Enviando…' : 'Enviar notificación de prueba'}
          </button>

        </div>

        {soportaPush() ? (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm font-medium text-gray-900">Avisos con la aplicación cerrada</p>
            <p className="mt-1 text-sm text-gray-600">
              Registra este dispositivo para recibir las alertas aunque la aplicación y el
              navegador estén cerrados.
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                onClick={alternarSuscripcion}
                disabled={ocupadoPush}
                className={`px-4 py-2 rounded-lg text-sm disabled:opacity-60 ${
                  suscrito
                    ? 'border border-gray-300 hover:bg-gray-50'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}
              >
                {suscrito ? 'Quitar este dispositivo' : 'Registrar este dispositivo'}
              </button>

              {suscrito && (
                <span className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Dispositivo registrado
                </span>
              )}
            </div>

            <label className="mt-3 flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={repetir}
                disabled={ocupadoPush}
                onChange={(e) => alternarDemo(e.target.checked)}
              />
              Enviar una verificación cada 5 minutos
            </label>

            {repetir && (
              <p className="mt-2 text-xs text-amber-700">
                Activo. Seguirá llegando aunque cierres la aplicación, hasta que desmarques
                esta casilla.
              </p>
            )}

            {errorPush && (
              <p className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {errorPush}
              </p>
            )}
          </div>
        ) : (
          <p className="mt-3 text-xs text-gray-500">
            Este navegador no admite avisos con la aplicación cerrada.
          </p>
        )}

        {avisoPrueba && (
          <p className="mt-3 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
            {avisoPrueba}
          </p>
        )}
      </div>

      {permiso === 'denied' && (
        <div className="mb-6 rounded-xl border border-gray-300 bg-gray-50 p-4 text-sm text-gray-700">
          Bloqueaste las notificaciones en este navegador. Puedes volver a permitirlas desde
          la configuración del sitio. Mientras tanto, las alertas siguen apareciendo en esta pantalla.
        </div>
      )}

      {cargando ? (
        <p className="text-gray-500">Cargando…</p>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-8 text-center text-gray-500">
          Todavía no hay alertas registradas. Consulta el clima para que el sistema evalúe
          las condiciones de tu ubicación.
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((n) => (
            <li
              key={n.id}
              className={`rounded-xl border p-4 ${ESTILO_SEVERIDAD[n.severity ?? 'low'] ?? 'border-gray-200 bg-white'} ${n.read ? 'opacity-70' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                  <span aria-hidden>{ICONO_SEVERIDAD[n.severity ?? 'low'] ?? '•'}</span>
                  <div>
                    <h2 className="font-semibold text-gray-900">{n.title}</h2>
                    {n.body && <p className="mt-1 text-sm text-gray-700">{n.body}</p>}
                    <p className="mt-2 text-xs text-gray-500">{formatoFecha(n.createdAt)}</p>
                  </div>
                </div>
                {!n.read && (
                  <button
                    onClick={() => leerUna(n.id)}
                    className="text-xs text-primary-700 hover:text-primary-800 underline whitespace-nowrap"
                  >
                    Marcar leída
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
