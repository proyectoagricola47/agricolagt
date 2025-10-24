import { supabase } from '../../../api/supabaseClient'
import type { Post } from '../../../model/post'

export type PostCreateInput = {
  title: string
  excerpt?: string
  content?: string
  images?: string[]
  categories?: string[]
  badge?: string
}

function fileExtensionFromType(type: string): 'png' | 'webp' | 'jpg' {
  if (type === 'image/png') return 'png'
  if (type === 'image/webp') return 'webp'
  return 'jpg'
}

export async function uploadPostImages(files: File[]): Promise<string[]> {
  if (!files?.length) return []
  const { data: auth } = await supabase.auth.getUser()
  const uid = auth.user?.id
  if (!uid) throw new Error('No autenticado')

  const urls: string[] = []
  for (const f of files) {
    const ext = fileExtensionFromType(f.type)
    const filename = (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`) + `.${ext}`
    const path = `${uid}/${filename}`
    const { error } = await supabase.storage
      .from('post-images')
      .upload(path, f, { upsert: false, contentType: f.type || `image/${ext}`, cacheControl: '3600' })
    if (error) throw error
    const { data } = supabase.storage.from('post-images').getPublicUrl(path)
    urls.push(data.publicUrl)
  }
  return urls
}

export async function createPost(input: PostCreateInput): Promise<Post> {
  const { data: auth } = await supabase.auth.getUser()
  const uid = auth.user?.id
  if (!uid) throw new Error('No autenticado')

  const payload = {
    author_id: uid,
    title: input.title,
    excerpt: input.excerpt ?? null,
    content: input.content ?? null,
    images: input.images ?? [],
    categories: input.categories ?? [],
    badge: input.badge ?? null,
  }

  const { data, error } = await supabase
    .from('posts')
    .insert(payload)
    .select('id, created_at, updated_at')
    .single()
  if (error) throw error

  return {
    id: data.id,
    title: input.title,
    excerpt: input.excerpt,
    content: input.content,
    images: input.images,
    categories: input.categories,
    badge: input.badge,
    commentsCount: 0,
    author: { id: uid, name: '' },
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

function mapRowToPost(row: any): Post {
  return {
    id: row.id,
    title: row.title,
    excerpt: row.excerpt ?? undefined,
    content: row.content ?? undefined,
    images: Array.isArray(row.images) ? row.images : [],
    categories: Array.isArray(row.categories) ? row.categories : [],
    badge: row.badge ?? undefined,
    commentsCount: row.comments_count ?? 0,
    status: row.status ?? undefined,
    author: {
      id: row.author?.id ?? row.author_id,
      name: row.author?.name ?? '',
      avatarUrl: row.author?.avatar_url ?? undefined,
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getPostById(id: string): Promise<Post | null> {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      id, title, excerpt, content, images, categories, badge,
      comments_count, created_at, updated_at, author_id,
      author:users(id,name,avatar_url)
    `)
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data ? mapRowToPost(data) : null
}

export async function listPosts(
  page: number,
  pageSize = 10,
  status: 'published' | 'draft' | 'all' = 'published'
): Promise<{ items: Post[]; hasMore: boolean }> {
  const from = page * pageSize
  // Pedimos una fila extra para saber si hay más (range es inclusivo)
  const to = from + pageSize
  let req = supabase
    .from('posts')
    .select(`
      id, title, excerpt, content, images, categories, badge,
      comments_count, status, created_at, updated_at, author_id,
      author:users(id,name,avatar_url)
    `)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (status !== 'all') {
    req = req.eq('status', status) as any
  }

  const { data, error } = await req

  if (error) throw error
  const items = (data ?? []).slice(0, pageSize).map(mapRowToPost)
  const hasMore = (data ?? []).length > pageSize
  return { items, hasMore }
}

export async function listMyPosts(
  status: 'published' | 'draft' | 'all' = 'all',
  query?: string
): Promise<Post[]> {
  const { data: auth } = await supabase.auth.getUser()
  const uid = auth.user?.id
  if (!uid) throw new Error('No autenticado')

  let req = supabase
    .from('posts')
    .select(`
      id, title, excerpt, content, images, categories, badge,
      comments_count, status, created_at, updated_at, author_id
    `)
    .eq('author_id', uid)
    .order('created_at', { ascending: false })

  if (status !== 'all') {
    req = req.eq('status', status)
  }
  if (query && query.trim()) {
    // Búsqueda simple por título o extracto (si hay extensiones de texto instaladas, usar ilike)
    req = req.or(
      `title.ilike.%${query}%,excerpt.ilike.%${query}%`
    ) as any
  }

  const { data, error } = await req
  if (error) throw error
  return (data ?? []).map(mapRowToPost)
}

export async function setPostStatus(id: string, status: 'published' | 'draft'): Promise<void> {
  const { error } = await supabase
    .from('posts')
    .update({ status })
    .eq('id', id)
    .select('id')
    .single()
  if (error) throw error
}