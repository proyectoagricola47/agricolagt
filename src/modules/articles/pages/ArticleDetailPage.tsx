import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import DOMPurify from 'dompurify'
import { getArticleById, getArticleBySlug } from '../services/articleService'
import type { Article } from '../../../model'
import CommentsList from '../../posts/components/comments/CommentsList'
import { addArticleComment, deleteArticleComment, fetchArticleComments } from '../services/articleCommentsService'
import { useAuth } from '../../../context/AuthContext'

export default function ArticleDetailPage() {
  const params = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const idOrSlug = params.id as string
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)

  // Comentarios UI state
  const [comments, setComments] = useState<any[]>([])
  const [cPage, setCPage] = useState(0)
  const [cHasMore, setCHasMore] = useState(true)
  const [cInput, setCInput] = useState('')
  const [cSubmitting, setCSubmitting] = useState(false)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        // si es UUID o no: intentamos slug primero y si no, por id
        const bySlug = await getArticleBySlug(idOrSlug)
        const a = bySlug ?? (await getArticleById(idOrSlug))
        if (mounted) setArticle(a)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [idOrSlug])

  const sanitizedHtml = useMemo(() => {
    if (!article?.contentHtml) return ''
    return DOMPurify.sanitize(article.contentHtml, { USE_PROFILES: { html: true } })
  }, [article?.contentHtml])

  async function loadComments(p = cPage) {
    if (!article) return
    const { items, hasMore } = await fetchArticleComments(article.id, p, 10)
    setComments((prev) => (p === 0 ? items.map(rowToUIComment) : [...prev, ...items.map(rowToUIComment)]))
    setCHasMore(hasMore)
    setCPage(p)
  }

  function rowToUIComment(c: any) {
    const authorId: string | undefined = c.author?.id
    const canDelete = !!(user?.id && authorId && user.id === authorId)
    return {
      id: c.id,
      author: c.author?.name || 'Usuario',
      avatar: c.author?.avatarUrl || `https://api.dicebear.com/9.x/identicon/svg?seed=${c.author?.id || 'u'}`,
      date: new Date(c.createdAt).toLocaleString(),
      text: c.text,
      canDelete,
    }
  }

  useEffect(() => {
    if (!article) return
    loadComments(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [article?.id])

  async function handleSubmitComment() {
    if (!article || !user) return
    const text = cInput.trim()
    if (!text) return
    try {
      setCSubmitting(true)
      const created = await addArticleComment(article.id, text)
      setComments((prev) => [...prev, rowToUIComment(created)])
      setCInput('')
    } catch (e: any) {
      alert(e?.message || 'No se pudo enviar el comentario')
    } finally {
      setCSubmitting(false)
    }
  }

  async function handleDeleteComment(cid: string) {
    if (!article) return
    try {
      await deleteArticleComment(cid)
      setComments((prev) => prev.filter((c) => c.id !== cid))
    } catch (e: any) {
      alert(e?.message || 'No se pudo eliminar el comentario')
    }
  }

  if (loading) return <p className="p-4">Cargando…</p>
  if (!article) return <p className="p-4">No encontrado</p>

  const cover = article.images?.[0]
  const created = article.createdAt ? new Date(article.createdAt) : null
  const formattedDate = created ? created.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : ''
  const authorName = article.author?.name || 'Autor'
  const authorAvatar = article.author?.avatarUrl || `https://api.dicebear.com/9.x/identicon/svg?seed=${article.author?.id || 'u'}`

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-3xl md:text-4xl font-extrabold leading-tight text-gray-900">{article.title}</h1>

        <div className="mt-4 flex items-center gap-3">
          <img src={authorAvatar} alt={authorName} className="w-10 h-10 rounded-full border" />
          <div className="text-sm">
            <p className="font-medium text-gray-900">{authorName}</p>
            {formattedDate && <p className="text-gray-500">{formattedDate}</p>}
          </div>
        </div>
      </header>

      {/* Cover */}
      {cover && (
        <figure className="mb-8">
          <img src={cover} alt="Imagen de portada" className="w-full rounded-2xl border object-cover max-h-[480px]" />
        </figure>
      )}

      {/* Content */}
      <article className="prose prose-lg max-w-none prose-headings:scroll-mt-20">
        <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
      </article>

      {/* Comentarios */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold">Comentarios</h2>
        {/* Composer solo para usuarios autenticados */}
        {user ? (
          <div className="mt-4 bg-white rounded-xl border border-gray-200 overflow-hidden">
            <textarea
              className="w-full p-4 outline-none resize-none min-h-28"
              placeholder="Escribe un comentario..."
              value={cInput}
              onChange={(e) => setCInput(e.target.value)}
              disabled={cSubmitting}
            />
            <div className="p-3 border-t flex justify-end">
              <button
                onClick={handleSubmitComment}
                disabled={!cInput.trim() || cSubmitting}
                className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cSubmitting ? 'Enviando…' : 'Enviar'}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 p-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm">Inicia sesión para poder comentar en este artículo.</p>
            <button onClick={() => navigate('/login')} className="px-3 py-1.5 rounded-lg border border-amber-300 bg-white hover:bg-amber-100 text-sm">Iniciar sesión</button>
          </div>
        )}

        <CommentsList comments={comments} onDelete={handleDeleteComment} />

        {cHasMore && (
          <div className="mt-4 flex justify-center">
            <button
              className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50"
              onClick={() => loadComments(cPage + 1)}
            >
              Cargar más
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
