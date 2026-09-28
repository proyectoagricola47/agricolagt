import { supabase } from '../../../api/supabaseClient'

/** Publicación del mercado: una oferta de producto de un agricultor. */
export type Listing = {
  id: string
  title: string
  excerpt?: string
  content?: string
  images: string[]
  categories: string[]
  createdAt: string
  author: {
    id: string
    name: string
    avatarUrl?: string
    phone?: string
    location?: string
  }
}

/** Categoría con la que se marca una publicación como oferta comercial. */
export const CATEGORIA_COMERCIAL = 'Comercial'

function mapRow(row: any): Listing {
  return {
    id: row.id,
    title: row.title,
    excerpt: row.excerpt ?? undefined,
    content: row.content ?? undefined,
    images: Array.isArray(row.images) ? row.images : [],
    categories: Array.isArray(row.categories) ? row.categories : [],
    createdAt: row.created_at,
    author: {
      id: row.author?.id ?? row.author_id,
      name: row.author?.name ?? 'Agricultor',
      avatarUrl: row.author?.avatar_url ?? undefined,
      phone: row.author?.phone ?? undefined,
      location: row.author?.location ?? undefined,
    },
  }
}

/**
 * Lista las ofertas del mercado. Reutiliza la tabla de publicaciones
 * filtrando las que el agricultor marcó como comerciales.
 */
export async function listarOfertas(busqueda?: string): Promise<Listing[]> {
  let req = supabase
    .from('posts')
    .select(`
      id, title, excerpt, content, images, categories, status,
      created_at, author_id,
      author:users(id,name,avatar_url,phone,location)
    `)
    .contains('categories', [CATEGORIA_COMERCIAL])
    .order('created_at', { ascending: false })
    .limit(60)

  if (busqueda && busqueda.trim()) {
    const q = busqueda.trim()
    req = req.or(`title.ilike.%${q}%,excerpt.ilike.%${q}%,content.ilike.%${q}%`) as any
  }

  const { data, error } = await req
  if (error) throw error

  return (data ?? [])
    .filter((r: any) => !r.status || r.status === 'published')
    .map(mapRow)
}

/** Ofertas publicadas por la persona que tiene la sesión abierta. */
export async function listarMisOfertas(): Promise<Listing[]> {
  const { data: auth } = await supabase.auth.getUser()
  const uid = auth.user?.id
  if (!uid) return []

  const { data, error } = await supabase
    .from('posts')
    .select(`
      id, title, excerpt, content, images, categories,
      created_at, author_id,
      author:users(id,name,avatar_url,phone,location)
    `)
    .eq('author_id', uid)
    .contains('categories', [CATEGORIA_COMERCIAL])
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(mapRow)
}
