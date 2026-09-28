import { supabase } from '../../../api/supabaseClient'
import type { PestReport, PestReportInput } from '../../../model/pest'

const BUCKET = 'pest-photos'

function mapRow(row: any): PestReport {
  return {
    id: row.id,
    userId: row.user_id,
    cropId: row.crop_id ?? undefined,
    cropName: row.crop?.name ?? undefined,
    pestType: row.pest_type,
    severity: row.severity,
    detectedAt: row.detected_at
      ? new Date(row.detected_at).toISOString().slice(0, 10)
      : '',
    status: row.status ?? 'activa',
    location: row.location ?? undefined,
    lat: row.lat ?? undefined,
    lng: row.lng ?? undefined,
    photoUrl: row.photo_url ?? undefined,
    treatment: row.treatment ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

const SELECT = `
  id, user_id, crop_id, pest_type, severity, detected_at, status,
  location, lat, lng, photo_url, treatment, notes, created_at, updated_at,
  crop:crops(id,name)
`

function extensionDeTipo(type: string): 'png' | 'webp' | 'jpg' {
  if (type === 'image/png') return 'png'
  if (type === 'image/webp') return 'webp'
  return 'jpg'
}

/** Sube la fotografía del reporte y devuelve su dirección pública. */
export async function subirFotografia(file: File): Promise<string> {
  const { data: auth } = await supabase.auth.getUser()
  const uid = auth.user?.id
  if (!uid) throw new Error('No autenticado')

  const ext = extensionDeTipo(file.type)
  const nombre =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const ruta = `${uid}/${nombre}.${ext}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(ruta, file, { upsert: false, contentType: file.type || `image/${ext}`, cacheControl: '3600' })
  if (error) throw error

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(ruta)
  return data.publicUrl
}

export const pestService = {
  /** Reportes del agricultor que tiene la sesión abierta. */
  async list(): Promise<PestReport[]> {
    const { data: auth } = await supabase.auth.getUser()
    const uid = auth.user?.id
    if (!uid) throw new Error('No autenticado')

    const { data, error } = await supabase
      .from('pest_reports')
      .select(SELECT)
      .eq('user_id', uid)
      .order('detected_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map(mapRow)
  },

  async get(id: string): Promise<PestReport | undefined> {
    const { data, error } = await supabase
      .from('pest_reports')
      .select(SELECT)
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    return data ? mapRow(data) : undefined
  },

  /** Reportes asociados a un cultivo concreto. */
  async listByCrop(cropId: string): Promise<PestReport[]> {
    const { data, error } = await supabase
      .from('pest_reports')
      .select(SELECT)
      .eq('crop_id', cropId)
      .order('detected_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map(mapRow)
  },

  async create(input: PestReportInput): Promise<PestReport> {
    const { data: auth } = await supabase.auth.getUser()
    const uid = auth.user?.id
    if (!uid) throw new Error('No autenticado')

    const payload = {
      user_id: uid,
      crop_id: input.cropId || null,
      pest_type: input.pestType,
      severity: input.severity,
      detected_at: input.detectedAt,
      status: input.status,
      location: input.location || null,
      lat: input.lat ?? null,
      lng: input.lng ?? null,
      photo_url: input.photoUrl || null,
      treatment: input.treatment || null,
      notes: input.notes || null,
    }
    const { data, error } = await supabase
      .from('pest_reports')
      .insert(payload)
      .select(SELECT)
      .single()
    if (error) throw error
    return mapRow(data)
  },

  async update(id: string, input: Partial<PestReportInput>): Promise<PestReport | undefined> {
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (input.cropId !== undefined) patch.crop_id = input.cropId || null
    if (input.pestType !== undefined) patch.pest_type = input.pestType
    if (input.severity !== undefined) patch.severity = input.severity
    if (input.detectedAt !== undefined) patch.detected_at = input.detectedAt
    if (input.status !== undefined) patch.status = input.status
    if (input.location !== undefined) patch.location = input.location || null
    if (input.lat !== undefined) patch.lat = input.lat ?? null
    if (input.lng !== undefined) patch.lng = input.lng ?? null
    if (input.photoUrl !== undefined) patch.photo_url = input.photoUrl || null
    if (input.treatment !== undefined) patch.treatment = input.treatment || null
    if (input.notes !== undefined) patch.notes = input.notes || null

    const { data, error } = await supabase
      .from('pest_reports')
      .update(patch)
      .eq('id', id)
      .select(SELECT)
      .maybeSingle()
    if (error) throw error
    return data ? mapRow(data) : undefined
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('pest_reports').delete().eq('id', id)
    if (error) throw error
  },
}
