import { supabase } from '../../../api/supabaseClient'
import type { Harvest, HarvestInput } from '../../../model/harvest'

function mapRow(row: any): Harvest {
  return {
    id: row.id,
    cropId: row.crop_id,
    cropName: row.crop?.name ?? undefined,
    userId: row.user_id,
    season: row.season,
    harvestDate: row.harvest_date
      ? new Date(row.harvest_date).toISOString().slice(0, 10)
      : '',
    quantity: Number(row.quantity),
    unit: row.unit,
    quality: row.quality ?? undefined,
    income: row.income != null ? Number(row.income) : undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
  }
}

const SELECT = `
  id, crop_id, user_id, season, harvest_date, quantity, unit,
  quality, income, notes, created_at,
  crop:crops(id,name,type,species_name)
`

export const harvestService = {
  /** Historial de cosechas de un cultivo, de la más reciente a la más antigua. */
  async listByCrop(cropId: string): Promise<Harvest[]> {
    const { data, error } = await supabase
      .from('harvests')
      .select(SELECT)
      .eq('crop_id', cropId)
      .order('harvest_date', { ascending: false })
    if (error) throw error
    return (data ?? []).map(mapRow)
  },

  /** Todas las cosechas de la comunidad, para los reportes municipales. */
  async listAll(): Promise<Harvest[]> {
    const { data, error } = await supabase
      .from('harvests')
      .select(SELECT)
      .order('harvest_date', { ascending: false })
    if (error) throw error
    return (data ?? []).map(mapRow)
  },

  /** Todas las cosechas del agricultor, para los reportes. */
  async listMine(): Promise<Harvest[]> {
    const { data: auth } = await supabase.auth.getUser()
    const uid = auth.user?.id
    if (!uid) return []

    const { data, error } = await supabase
      .from('harvests')
      .select(SELECT)
      .eq('user_id', uid)
      .order('harvest_date', { ascending: false })
    if (error) throw error
    return (data ?? []).map(mapRow)
  },

  async create(input: HarvestInput): Promise<Harvest> {
    const { data: auth } = await supabase.auth.getUser()
    const uid = auth.user?.id
    if (!uid) throw new Error('No autenticado')

    const payload = {
      crop_id: input.cropId,
      user_id: uid,
      season: input.season,
      harvest_date: input.harvestDate,
      quantity: input.quantity,
      unit: input.unit,
      quality: input.quality ?? null,
      income: input.income ?? null,
      notes: input.notes || null,
    }
    const { data, error } = await supabase
      .from('harvests')
      .insert(payload)
      .select(SELECT)
      .single()
    if (error) throw error
    return mapRow(data)
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('harvests').delete().eq('id', id)
    if (error) throw error
  },
}
