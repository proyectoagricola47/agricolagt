import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import CommentsList from '../components/comments/CommentsList'
import { getPostById } from '../services/postService'
import type { Post } from '../../../model/post'
import { useAuth } from '../../../context/AuthContext'
import { addComment, fetchComments, deleteComment } from '../services/commentService'

export default function PostDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Comentarios UI
  type UIComment = { id: string; authorId?: string; author: string; avatar: string; date: string; text: string; canDelete?: boolean }
  const [comments, setComments] = useState<UIComment[]>([])
  const [cPage, setCPage] = useState(0)
  const [cHasMore, setCHasMore] = useState(true)
  const [cLoading, setCLoading] = useState(false)
  const [cInput, setCInput] = useState('')
  const [cSubmitting, setCSubmitting] = useState(false)

  useEffect(() => {
    let alive = true
    async function load() {
      if (!id) return
      try {
        const p = await getPostById(id)
        if (alive) setPost(p)
      } catch (e: any) {
        console.error(e)
        if (alive) setError('No se pudo cargar la publicación')
      } finally {
        if (alive) setLoading(false)
      }
    }
    load()
    return () => {
      alive = false
    }
  }, [id])

  // Cargar comentarios
  useEffect(() => {
    let alive = true
    async function loadFirstPage() {
      if (!id) return
      try {
        setCLoading(true)
        const { items, hasMore } = await fetchComments(id, 0, 10)
        if (!alive) return
        setComments(items.map(rowToUIComment))
        setCPage(0)
        setCHasMore(hasMore)
      } catch (e) {
        console.error(e)
      } finally {
        if (alive) setCLoading(false)
      }
    }
    loadFirstPage()
    return () => { alive = false }
  }, [id])

  function rowToUIComment(c: { id: string; author: { id?: string; name?: string; avatarUrl?: string }; createdAt: string; text: string }): UIComment {
    const avatar = c.author?.avatarUrl || 'https://i.pravatar.cc/80?u=' + (c.author?.name || 'anon')
    const author = c.author?.name || 'Anónimo'
    const date = new Date(c.createdAt).toLocaleString('es-ES', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    const authorId = c.author?.id
    const canDelete = !!(user?.id && authorId && user.id === authorId)
    return { id: c.id, authorId, author, avatar, date, text: c.text, canDelete }
  }

  async function loadMoreComments() {
    if (!id || cLoading || !cHasMore) return
    try {
      setCLoading(true)
      const nextPage = cPage + 1
      const { items, hasMore } = await fetchComments(id, nextPage, 10)
      setComments((prev) => [...prev, ...items.map(rowToUIComment)])
      setCPage(nextPage)
      setCHasMore(hasMore)
    } catch (e) {
      console.error(e)
    } finally {
      setCLoading(false)
    }
  }

  async function handleSubmitComment() {
    if (!user || !id) return
    const text = cInput.trim()
    if (!text) return
    try {
      setCSubmitting(true)
      const created = await addComment(id, text)
      // Comentarios están ordenados ascendente; agregamos al final
      setComments((prev) => [...prev, rowToUIComment({ id: created.id, author: created.author, createdAt: created.createdAt, text: created.text })])
      setCInput('')
    } catch (e: any) {
      console.error(e)
      alert(e?.message || 'No se pudo enviar el comentario')
    } finally {
      setCSubmitting(false)
    }
  }

  async function handleDeleteComment(cid: string) {
    if (!id) return
    try {
      await deleteComment(cid)
      setComments(prev => prev.filter(c => c.id !== cid))
    } catch (e: any) {
      console.error(e)
      alert(e?.message || 'No se pudo eliminar el comentario')
    }
  }

  const hero = useMemo(() => post?.images?.[0], [post])
  const gallery = useMemo(() => (post?.images ?? []).slice(1), [post])
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)

  function openViewer(i: number) {
    setViewerIndex(i)
    setViewerOpen(true)
  }
  function closeViewer() { setViewerOpen(false) }
  function prevImage() { setViewerIndex((i) => (i - 1 + gallery.length) % gallery.length) }
  function nextImage() { setViewerIndex((i) => (i + 1) % gallery.length) }

  useEffect(() => {
    if (!viewerOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeViewer()
      else if (e.key === 'ArrowLeft') prevImage()
      else if (e.key === 'ArrowRight') nextImage()
    }
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [viewerOpen])

  if (loading) {
    return <div className="pb-16 max-w-5xl mx-auto px-4">Cargando…</div>
  }
  if (error || !post) {
    return <div className="pb-16 max-w-5xl mx-auto px-4 text-red-600">{error || 'Publicación no encontrada'}</div>
  }

  return (
    <div className="pb-16 max-w-5xl mx-auto px-4">
      {/* Hero */}
      <div className="aspect-[21/9] w-full overflow-hidden rounded-2xl bg-gray-100">
        {hero ? (
          <img className="w-full h-full object-cover" src={hero} alt={post.title} />
        ) : (
          <div className="w-full h-full grid place-items-center text-gray-400">Sin imagen</div>
        )}
      </div>

      {/* Title + meta */}
      <header className="mt-6">
        <div className="mt-3 flex items-center flex-wrap gap-4 md:gap-6 text-sm text-gray-500">
          <span className="inline-flex items-center gap-2">
            <img src={post.author.avatarUrl || 'https://i.pravatar.cc/80?u='+post.author.id} alt={post.author.name || 'Autor'} className="w-8 h-8 rounded-full ring-2 ring-emerald-100 object-cover" />
            <span className="text-gray-800 font-medium">{post.author.name || 'Autor'}</span>
          </span>
          {post.categories && post.categories[0] && (
            <span className="inline-flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary-600" /> {post.categories[0]}
            </span>
          )}
          {post.createdAt && (
            <span className="inline-flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gray-400" /> {new Date(post.createdAt).toLocaleString('es-ES', { day:'2-digit', month:'long', year:'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </header>

      {/* Content */}
      <article className="prose prose-neutral mt-6">
        {post.content ? (
          <div dangerouslySetInnerHTML={{ __html: post.content }} />
        ) : (
          <p className="text-gray-600">Sin contenido.</p>
        )}
      </article>

      {/* Gallery */}
      {gallery.length > 0 && (
        <section className="mt-10">
          <h3 className="text-xl font-semibold mb-4">Galería de imágenes</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {gallery.map((src, i) => (
              <figure key={i} className="rounded-xl overflow-hidden border border-gray-200 cursor-zoom-in" onClick={() => openViewer(i)}>
                <img src={src} alt={"galería-" + i} className="w-full h-40 object-cover" />
              </figure>
            ))}
          </div>
          {viewerOpen && gallery[viewerIndex] && (
            <div className="fixed inset-0 z-50">
              <div className="absolute inset-0 bg-black/80" onClick={closeViewer} />
              <div className="absolute inset-0 flex items-center justify-center p-4 select-none">
                {/* Controles */}
                <button aria-label="Cerrar" onClick={closeViewer} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow grid place-items-center">✕</button>
                {gallery.length > 1 && (
                  <>
                    <button aria-label="Anterior" onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow grid place-items-center">‹</button>
                    <button aria-label="Siguiente" onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow grid place-items-center">›</button>
                  </>
                )}
                {/* Imagen */}
                <img src={gallery[viewerIndex]} alt={`vista-${viewerIndex + 1}`} className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl" />
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/90 text-xs bg-black/30 px-2 py-1 rounded">
                  {viewerIndex + 1} / {gallery.length}
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Comments */}
      <section className="mt-10">
        <h3 className="text-xl font-semibold mb-4">Comentarios</h3>

        {/* Composer solo para usuarios autenticados */}
        {user ? (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
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
              >{cSubmitting ? 'Enviando…' : 'Enviar'}</button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-amber-200 bg-amber-50 text-amber-900 p-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm">Inicia sesión para poder comentar en esta publicación.</p>
            <button onClick={() => navigate('/login')} className="px-3 py-1.5 rounded-lg border border-amber-300 bg-white hover:bg-amber-100 text-sm">Iniciar sesión</button>
          </div>
        )}

        {/* Lista de comentarios (solo lectura) */}
        <div className="mt-4">
          <CommentsList comments={comments} onDelete={handleDeleteComment} />
          {cHasMore && (
            <div className="mt-4 flex justify-center">
              <button onClick={loadMoreComments} disabled={cLoading} className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50">
                {cLoading ? 'Cargando…' : 'Cargar más'}
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
