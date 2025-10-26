import { supabase } from '../../../api/supabaseClient'
import type { Comment as ModelComment } from '../../../model/comment'

function mapRowToComment(row: any): ModelComment {
  return {
    id: row.id,
    postId: row.article_id,
    text: row.text,
    createdAt: row.created_at,
    author: {
      id: row.author?.id ?? row.author_id,
      name: row.author?.name ?? '',
      avatarUrl: row.author?.avatar_url ?? undefined,
    },
  }
}

export async function fetchArticleComments(
  articleId: string,
  page = 0,
  pageSize = 10
): Promise<{ items: ModelComment[]; hasMore: boolean }> {
  const from = page * pageSize
  const to = from + pageSize
  const { data, error } = await supabase
    .from('article_comments')
    .select(`
      id, article_id, text, created_at, author_id,
      author:users(id,name,avatar_url)
    `)
    .eq('article_id', articleId)
    .order('created_at', { ascending: true })
    .range(from, to)
  if (error) throw error
  const items = (data ?? []).slice(0, pageSize).map(mapRowToComment)
  const hasMore = (data ?? []).length > pageSize
  return { items, hasMore }
}

export async function addArticleComment(articleId: string, text: string): Promise<ModelComment> {
  if (!text || !text.trim()) {
    throw new Error('El comentario no puede estar vacío')
  }
  const { data: auth } = await supabase.auth.getUser()
  const uid = auth.user?.id
  if (!uid) throw new Error('No autenticado')

  const payload = {
    article_id: articleId,
    author_id: uid,
    text,
  }
  const { data, error } = await supabase
    .from('article_comments')
    .insert(payload)
    .select(`
      id, article_id, text, created_at, author_id,
      author:users(id,name,avatar_url)
    `)
    .single()
  if (error) throw error
  return mapRowToComment(data)
}

export async function deleteArticleComment(commentId: string): Promise<void> {
  const { data: auth } = await supabase.auth.getUser()
  const uid = auth.user?.id
  if (!uid) throw new Error('No autenticado')
  const { error } = await supabase
    .from('article_comments')
    .delete()
    .eq('id', commentId)
    .eq('author_id', uid)
  if (error) throw error
}
