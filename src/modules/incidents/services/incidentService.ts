import { supabase } from '../../../api/supabaseClient'
import type { Incident, IncidentInput, IncidentStatus } from '../../../model/incident'

function mapRow(row: any): Incident {
  return {
    id: row.id,
    userId: row.user_id,
    authorName: row.author?.name ?? undefined,
    authorPhone: row.author?.phone ?? undefined,
    cropId: row.crop_id ?? undefined,
    cropName: row.crop?.name ?? undefined,
    type: row.type,
    subject: row.subject,
    description: row.description,
    status: row.status,
    assignedTo: row.assigned_to ?? undefined,
    assignedName: row.assigned?.name ?? undefined,
    response: row.response ?? undefined,
    respondedAt: row.responded_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

const SELECT = `
  id, user_id, crop_id, type, subject, description, status,
  assigned_to, response, responded_at, created_at, updated_at,
  author:users!incidents_user_id_fkey(id,name,phone),
  assigned:users!incidents_assigned_to_fkey(id,name),
  crop:crops(id,name)
`

export const incidentService = {
  /** Incidencias reportadas por quien tiene la sesión abierta. */
  async listMine(): Promise<Incident[]> {
    const { data: auth } = await supabase.auth.getUser()
    const uid = auth.user?.id
    if (!uid) return []

    const { data, error } = await supabase
      .from('incidents')
      .select(SELECT)
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map(mapRow)
  },

  /**
   * Bandeja del personal técnico. Las políticas de la base ya limitan
   * el resultado: un agricultor solo recibe las suyas.
   */
  async listAll(estado?: IncidentStatus): Promise<Incident[]> {
    let req = supabase
      .from('incidents')
      .select(SELECT)
      .order('created_at', { ascending: false })
    if (estado) req = req.eq('status', estado)

    const { data, error } = await req
    if (error) throw error
    return (data ?? []).map(mapRow)
  },

  async create(input: IncidentInput): Promise<Incident> {
    const { data: auth } = await supabase.auth.getUser()
    const uid = auth.user?.id
    if (!uid) throw new Error('No autenticado')

    const payload = {
      user_id: uid,
      crop_id: input.cropId || null,
      type: input.type,
      subject: input.subject,
      description: input.description,
      status: 'abierta',
    }
    const { data, error } = await supabase
      .from('incidents')
      .insert(payload)
      .select(SELECT)
      .single()
    if (error) throw error
    return mapRow(data)
  },

  /** El técnico toma la incidencia y queda como responsable. */
  async tomar(id: string): Promise<Incident | undefined> {
    const { data: auth } = await supabase.auth.getUser()
    const uid = auth.user?.id
    if (!uid) throw new Error('No autenticado')

    const { data, error } = await supabase
      .from('incidents')
      .update({ status: 'en_proceso', assigned_to: uid, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(SELECT)
      .maybeSingle()
    if (error) throw error
    return data ? mapRow(data) : undefined
  },

  /**
   * Guarda la respuesta del técnico y avisa al agricultor mediante
   * una notificación en su historial.
   */
  async responder(id: string, respuesta: string, cerrar: boolean): Promise<Incident | undefined> {
    const { data, error } = await supabase
      .from('incidents')
      .update({
        response: respuesta,
        responded_at: new Date().toISOString(),
        status: cerrar ? 'cerrada' : 'en_proceso',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(SELECT)
      .maybeSingle()
    if (error) throw error
    if (!data) return undefined

    const incidencia = mapRow(data)

    // El aviso es complementario: si falla, la respuesta ya quedó guardada.
    try {
      await supabase.from('notifications').insert({
        user_id: incidencia.userId,
        title: 'Respondieron tu solicitud de asistencia',
        body: `${incidencia.subject}: ${respuesta.slice(0, 160)}`,
        type: 'incidencia',
        severity: 'medium',
      })
    } catch (e) {
      console.error('No se pudo notificar al agricultor', e)
    }

    return incidencia
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('incidents').delete().eq('id', id)
    if (error) throw error
  },
}
