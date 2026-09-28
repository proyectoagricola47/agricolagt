import { supabase } from '../../../api/supabaseClient'

export type Tip = {
  id: string
  cropType?: string
  condition?: string
  title: string
  body: string
  source?: string
  /** Por qué se le muestra este consejo al agricultor. */
  motivo?: string
}

/**
 * Traducción del título de la alerta del clima a la condición con la
 * que están clasificados los consejos en la base de datos.
 */
const CONDICION_POR_ALERTA: Record<string, string> = {
  'Riesgo de lluvias intensas': 'lluvia_intensa',
  'Ola de calor probable': 'ola_calor',
  'Índice UV alto': 'uv_alto',
  'Rachas de viento': 'viento',
  'Humedad ambiental baja': 'humedad_baja',
  'Sequía probable': 'sequia',
}

export function condicionDeAlerta(titulo: string): string | undefined {
  return CONDICION_POR_ALERTA[titulo]
}

function mapRow(row: any): Tip {
  return {
    id: row.id,
    cropType: row.crop_type ?? undefined,
    condition: row.condition ?? undefined,
    title: row.title,
    body: row.body,
    source: row.source ?? undefined,
  }
}

/** Tipos y especies de los cultivos registrados por el agricultor. */
async function misTiposDeCultivo(): Promise<string[]> {
  const { data: auth } = await supabase.auth.getUser()
  const uid = auth.user?.id
  if (!uid) return []

  const { data, error } = await supabase
    .from('crops')
    .select('type, species_name')
    .eq('user_id', uid)
  if (error) return []

  const tipos = new Set<string>()
  for (const fila of data ?? []) {
    if (fila.type) tipos.add(String(fila.type))
    if (fila.species_name) tipos.add(String(fila.species_name))
  }
  return Array.from(tipos)
}

/**
 * Escoge entre dos y cuatro consejos cruzando las alertas del clima
 * vigentes con los cultivos que el agricultor tiene registrados.
 *
 * El orden de preferencia es: consejo que coincide con la condición
 * del clima y con un cultivo suyo, luego el que solo coincide con la
 * condición, y al final los consejos generales.
 */
export async function consejosParaHoy(
  alertas: { title: string }[],
  maximo = 4,
): Promise<Tip[]> {
  const { data, error } = await supabase
    .from('tips')
    .select('id, crop_type, condition, title, body, source')
  if (error) throw error

  const todos = (data ?? []).map(mapRow)
  if (todos.length === 0) return []

  const condiciones = new Set(
    alertas.map((a) => condicionDeAlerta(a.title)).filter(Boolean) as string[],
  )
  const misTipos = await misTiposDeCultivo()
  const tengoCultivos = misTipos.length > 0

  const coincideCultivo = (t: Tip) => Boolean(t.cropType && misTipos.includes(t.cropType))

  const prioritarios: Tip[] = []
  const porClima: Tip[] = []
  const generales: Tip[] = []

  for (const t of todos) {
    const climaCoincide = Boolean(t.condition && condiciones.has(t.condition))

    if (climaCoincide && coincideCultivo(t)) {
      prioritarios.push({ ...t, motivo: `Por el clima de estos días y tu cultivo de ${t.cropType}` })
    } else if (climaCoincide && !t.cropType) {
      porClima.push({ ...t, motivo: 'Por las condiciones del clima de estos días' })
    } else if (t.condition === 'general' && coincideCultivo(t)) {
      generales.push({ ...t, motivo: `Por tu cultivo de ${t.cropType}` })
    } else if (t.condition === 'general' && !t.cropType) {
      generales.push({ ...t, motivo: tengoCultivos ? 'Recomendación general' : 'Para empezar' })
    }
  }

  return [...prioritarios, ...porClima, ...generales].slice(0, maximo)
}
