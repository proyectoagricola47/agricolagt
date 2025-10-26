import { supabase } from '../../../api/supabaseClient'
import type { Article } from '../../../model'

export type ArticleCreateInput = {
  title: string
  slug?: string
  excerpt?: string
  contentHtml: string
  images?: string[]
  categories?: string[]
  status?: 'published' | 'draft'
}

function fileExtensionFromType(type: string): 'png' | 'webp' | 'jpg' | 'svg' {
  if (type === 'image/png') return 'png'
  if (type === 'image/webp') return 'webp'
  if (type === 'image/svg+xml') return 'svg'
  return 'jpg'
}

export async function uploadArticleImages(files: File[]): Promise<string[]> {
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
      .from('article-images')
      .upload(path, f, { upsert: false, contentType: f.type || `image/${ext}`, cacheControl: '3600' })
    if (error) throw error
    const { data } = supabase.storage.from('article-images').getPublicUrl(path)
    urls.push(data.publicUrl)
  }
  return urls
}

function mapRowToArticle(row: any): Article {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug ?? undefined,
    excerpt: row.excerpt ?? undefined,
    contentHtml: row.content_html,
    images: Array.isArray(row.images) ? row.images : [],
    categories: Array.isArray(row.categories) ? row.categories : [],
    status: row.status ?? undefined,
    commentsCount: row.comments_count ?? 0,
    author: {
      id: row.author?.id ?? row.author_id,
      name: row.author?.name ?? '',
      avatarUrl: row.author?.avatar_url ?? undefined,
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at ?? null,
  }
}

export async function createArticle(input: ArticleCreateInput): Promise<Article> {
  const { data: auth } = await supabase.auth.getUser()
  const uid = auth.user?.id
  if (!uid) throw new Error('No autenticado')

  const payload = {
    author_id: uid,
    title: input.title,
    slug: input.slug ?? null,
    excerpt: input.excerpt ?? null,
    content_html: input.contentHtml,
    images: input.images ?? [],
    categories: input.categories ?? [],
    status: input.status ?? 'published',
  }
  const { data, error } = await supabase
    .from('articles')
    .insert(payload)
    .select(`
      id, title, slug, excerpt, content_html, images, categories, status, comments_count,
      author_id, created_at, updated_at, published_at,
      author:users(id,name,avatar_url)
    `)
    .single()
  if (error) throw error
  return mapRowToArticle(data)
}

export async function updateArticle(id: string, patch: Partial<ArticleCreateInput>): Promise<Article> {
  const { data, error } = await supabase
    .from('articles')
    .update({
      title: patch.title,
      slug: patch.slug,
      excerpt: patch.excerpt,
      content_html: patch.contentHtml,
      images: patch.images,
      categories: patch.categories,
      status: patch.status,
    })
    .eq('id', id)
    .select(`
      id, title, slug, excerpt, content_html, images, categories, status, comments_count,
      author_id, created_at, updated_at, published_at,
      author:users(id,name,avatar_url)
    `)
    .single()
  if (error) throw error
  return mapRowToArticle(data)
}

export async function getArticleById(id: string): Promise<Article | null> {
  const { data, error } = await supabase
    .from('articles')
    .select(`
      id, title, slug, excerpt, content_html, images, categories, status, comments_count,
      author_id, created_at, updated_at, published_at,
      author:users(id,name,avatar_url)
    `)
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data ? mapRowToArticle(data) : null
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const { data, error } = await supabase
    .from('articles')
    .select(`
      id, title, slug, excerpt, content_html, images, categories, status, comments_count,
      author_id, created_at, updated_at, published_at,
      author:users(id,name,avatar_url)
    `)
    .eq('slug', slug)
    .maybeSingle()
  if (error) throw error
  return data ? mapRowToArticle(data) : null
}

export async function listArticles(
  page: number,
  pageSize = 10,
  status: 'published' | 'draft' | 'all' = 'published'
): Promise<{ items: Article[]; hasMore: boolean }> {
  const from = page * pageSize
  const to = from + pageSize
  let req = supabase
    .from('articles')
    .select(`
      id, title, slug, excerpt, content_html, images, categories, status, comments_count,
      author_id, created_at, updated_at, published_at,
      author:users(id,name,avatar_url)
    `)
    .order('created_at', { ascending: false })
    .range(from, to)
  if (status !== 'all') {
    req = req.eq('status', status) as any
  }
  const { data, error } = await req
  if (error) throw error
  const items = (data ?? []).slice(0, pageSize).map(mapRowToArticle)
  const hasMore = (data ?? []).length > pageSize
  return { items, hasMore }
}
