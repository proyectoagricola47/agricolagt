import { supabase } from '../../../api/supabaseClient'
import type { UserProfile } from '../../../model/user'

export type ProfileUpdateInput = {
  name?: string
  location?: string
  avatarUrl?: string
}

function mapRowToProfile(row: any): UserProfile {
  return {
    id: row.id,
    email: row.email ?? undefined,
    name: row.name,
    avatarUrl: row.avatar_url ?? undefined,
    location: row.location ?? undefined,
    role: row.role ?? 'user',
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
  }
}

export async function getMyProfile(): Promise<UserProfile | null> {
  const { data: auth } = await supabase.auth.getUser()
  const uid = auth.user?.id
  if (!uid) return null

  const { data, error } = await supabase
    .from('users')
  .select('id,email,name,avatar_url,role,location,profile_complete,created_at,updated_at')
    .eq('id', uid)
    .maybeSingle()
  if (error) throw error
  return data ? mapRowToProfile(data) : null
}

export async function updateMyProfile(input: ProfileUpdateInput): Promise<UserProfile> {
  const { data: auth } = await supabase.auth.getUser()
  const uid = auth.user?.id
  if (!uid) throw new Error('No autenticado')

  const { data: current, error: errCur } = await supabase
    .from('users')
    .select('id, name, location, avatar_url, email, role, created_at, updated_at')
    .eq('id', uid)
    .single()
  if (errCur) throw errCur

  const next = {
    name: input.name ?? current.name,
    location: input.location ?? current.location,
    avatar_url: input.avatarUrl ?? current.avatar_url,
  }

  const profile_complete = Boolean(next.avatar_url && next.location)

  const { data, error } = await supabase
    .from('users')
    .update({ ...next, profile_complete })
    .eq('id', uid)
    .select('id,email,name,avatar_url,role,location,created_at,updated_at')
    .single()
  if (error) throw error
  return mapRowToProfile(data)
}

export async function uploadMyAvatar(file: File): Promise<string> {
  const { data: auth } = await supabase.auth.getUser()
  const uid = auth.user?.id
  if (!uid) throw new Error('No autenticado')

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${uid}/avatar.${ext}`

  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type, cacheControl: '3600' })
  if (error) throw error

  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  return data.publicUrl
}
