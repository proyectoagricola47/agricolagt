import { supabase } from '../../../api/supabaseClient'
import type { Crop, CropInput } from '../../../model/crop'

function mapRowToCrop(row: any): Crop {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    type: row.type,
    speciesId: row.species_id ?? undefined,
    speciesName: row.species_name ?? undefined,
    area: typeof row.area === 'number' ? row.area : parseFloat(row.area),
    areaUnit: row.area_unit,
    status: row.status,
    sowingDate: row.sowing_date ? new Date(row.sowing_date).toISOString().slice(0, 10) : undefined,
    expectedHarvestDate: row.expected_harvest_date ? new Date(row.expected_harvest_date).toISOString().slice(0, 10) : undefined,
    location: row.location ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export const cropsService = {
  async list(): Promise<Crop[]> {
    const { data: auth } = await supabase.auth.getUser()
    const uid = auth.user?.id
    if (!uid) throw new Error('No autenticado')
    const { data, error } = await supabase
      .from('crops')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map(mapRowToCrop)
  },
  async get(id: string): Promise<Crop | undefined> {
    const { data, error } = await supabase
      .from('crops')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    return data ? mapRowToCrop(data) : undefined
  },
  async create(input: CropInput): Promise<Crop> {
    const { data: auth } = await supabase.auth.getUser()
    const uid = auth.user?.id
    if (!uid) throw new Error('No autenticado')

    const payload = {
      user_id: uid,
      name: input.name,
      type: input.type,
      species_id: input.speciesId ?? null,
      species_name: input.speciesName ?? null,
      area: input.area,
      area_unit: input.areaUnit,
      status: input.status,
      sowing_date: input.sowingDate ?? null,
      expected_harvest_date: input.expectedHarvestDate ?? null,
      location: input.location ?? null,
      notes: input.notes ?? null,
    }
    const { data, error } = await supabase
      .from('crops')
      .insert(payload)
      .select('*')
      .single()
    if (error) throw error
    return mapRowToCrop(data)
  },
  async update(id: string, input: Partial<CropInput>): Promise<Crop | undefined> {
    const patch: any = {}
    if (input.name !== undefined) patch.name = input.name
    if (input.type !== undefined) patch.type = input.type
    if (input.speciesId !== undefined) patch.species_id = input.speciesId
    if (input.speciesName !== undefined) patch.species_name = input.speciesName
    if (input.area !== undefined) patch.area = input.area
    if (input.areaUnit !== undefined) patch.area_unit = input.areaUnit
    if (input.status !== undefined) patch.status = input.status
    if (input.sowingDate !== undefined) patch.sowing_date = input.sowingDate || null
    if (input.expectedHarvestDate !== undefined) patch.expected_harvest_date = input.expectedHarvestDate || null
    if (input.location !== undefined) patch.location = input.location || null
    if (input.notes !== undefined) patch.notes = input.notes || null

    const { data, error } = await supabase
      .from('crops')
      .update(patch)
      .eq('id', id)
      .select('*')
      .maybeSingle()
    if (error) throw error
    return data ? mapRowToCrop(data) : undefined
  },
  async remove(id: string): Promise<void> {
    const { error } = await supabase
      .from('crops')
      .delete()
      .eq('id', id)
    if (error) throw error
  },
}
