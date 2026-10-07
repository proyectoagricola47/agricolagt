import { supabase } from '../../../api/supabaseClient'
import type { WaterSource, WaterSourceInput } from '../../../model/water'

function mapRow(row: any): WaterSource {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    sourceType: row.source_type,
    lat: row.lat,
    lng: row.lng,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

const SELECT = 'id, user_id, name, source_type, lat, lng, created_at, updated_at'

export const waterService = {
  /** Fuentes registradas por el agricultor que tiene la sesión abierta. */
  async list(): Promise<WaterSource[]> {
    const { data: auth } = await supabase.auth.getUser()
    const uid = auth.user?.id
    if (!uid) throw new Error('No autenticado')

    const { data, error } = await supabase
      .from('water_sources')
      .select(SELECT)
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map(mapRow)
  },

  /** Todas las fuentes de la comunidad, para el mapa. */
  async listAll(): Promise<WaterSource[]> {
    const { data, error } = await supabase
      .from('water_sources')
      .select(SELECT)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map(mapRow)
  },

  async get(id: string): Promise<WaterSource | undefined> {
    const { data, error } = await supabase
      .from('water_sources')
      .select(SELECT)
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    return data ? mapRow(data) : undefined
  },

  async create(input: WaterSourceInput): Promise<WaterSource> {
    const { data: auth } = await supabase.auth.getUser()
    const uid = auth.user?.id
    if (!uid) throw new Error('No autenticado')

    const { data, error } = await supabase
      .from('water_sources')
      .insert({
        user_id: uid,
        name: input.name,
        source_type: input.sourceType,
        lat: input.lat,
        lng: input.lng,
      })
      .select(SELECT)
      .single()
    if (error) throw error
    return mapRow(data)
  },

  async update(id: string, input: Partial<WaterSourceInput>): Promise<WaterSource | undefined> {
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (input.name !== undefined) patch.name = input.name
    if (input.sourceType !== undefined) patch.source_type = input.sourceType
    if (input.lat !== undefined) patch.lat = input.lat
    if (input.lng !== undefined) patch.lng = input.lng

    const { data, error } = await supabase
      .from('water_sources')
      .update(patch)
      .eq('id', id)
      .select(SELECT)
      .maybeSingle()
    if (error) throw error
    return data ? mapRow(data) : undefined
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('water_sources').delete().eq('id', id)
    if (error) throw error
  },
}
