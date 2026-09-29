import { supabase } from '../../../api/supabaseClient'
import type { CropActivity, CropActivityInput } from '../../../model/activity'

function mapRow(row: any): CropActivity {
  return {
    id: row.id,
    cropId: row.crop_id,
    userId: row.user_id,
    activityType: row.activity_type,
    performedAt: row.performed_at
      ? new Date(row.performed_at).toISOString().slice(0, 10)
      : '',
    inputName: row.input_name ?? undefined,
    quantity: row.quantity != null ? Number(row.quantity) : undefined,
    unit: row.unit ?? undefined,
    cost: row.cost != null ? Number(row.cost) : undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
  }
}

const SELECT = 'id, crop_id, user_id, activity_type, performed_at, input_name, quantity, unit, cost, notes, created_at'

export const activityService = {
  /** Bitácora de un cultivo, de la labor más reciente a la más antigua. */
  async listByCrop(cropId: string): Promise<CropActivity[]> {
    const { data, error } = await supabase
      .from('crop_activities')
      .select(SELECT)
      .eq('crop_id', cropId)
      .order('performed_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map(mapRow)
  },

  /** Labores de toda la comunidad, para los reportes municipales. */
  async listAllRecent(limite = 2000): Promise<CropActivity[]> {
    const { data, error } = await supabase
      .from('crop_activities')
      .select(SELECT)
      .order('performed_at', { ascending: false })
      .limit(limite)
    if (error) throw error
    return (data ?? []).map(mapRow)
  },

  /** Últimas labores del agricultor, sin importar el cultivo. */
  async listRecent(limite = 20): Promise<CropActivity[]> {
    const { data: auth } = await supabase.auth.getUser()
    const uid = auth.user?.id
    if (!uid) return []

    const { data, error } = await supabase
      .from('crop_activities')
      .select(SELECT)
      .eq('user_id', uid)
      .order('performed_at', { ascending: false })
      .limit(limite)
    if (error) throw error
    return (data ?? []).map(mapRow)
  },

  async create(input: CropActivityInput): Promise<CropActivity> {
    const { data: auth } = await supabase.auth.getUser()
    const uid = auth.user?.id
    if (!uid) throw new Error('No autenticado')

    const payload = {
      crop_id: input.cropId,
      user_id: uid,
      activity_type: input.activityType,
      performed_at: input.performedAt,
      input_name: input.inputName || null,
      quantity: input.quantity ?? null,
      unit: input.unit || null,
      cost: input.cost ?? null,
      notes: input.notes || null,
    }
    const { data, error } = await supabase
      .from('crop_activities')
      .insert(payload)
      .select(SELECT)
      .single()
    if (error) throw error
    return mapRow(data)
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('crop_activities').delete().eq('id', id)
    if (error) throw error
  },
}
