import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import RichTextEditor from '../../../components/editor/RichTextEditor'
import { createArticle, getArticleById, updateArticle, uploadArticleImages } from '../services/articleService'
import { getMyProfile } from '../../users/services/userService'

export default function ArticleUpsertPage() {
  const params = useParams()
  const navigate = useNavigate()
  const articleId = params.id as string | undefined
  const isEdit = Boolean(articleId)

  const [role, setRole] = useState<'admin' | 'editor' | 'user' | undefined>()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [contentHtml, setContentHtml] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [status, setStatus] = useState<'published' | 'draft'>('published')
  const [autoSlug] = useState(true)
  const [autoExcerpt] = useState(true)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    let mounted = true
    async function init() {
      try {
        const me = await getMyProfile()
        if (mounted) setRole((me?.role as any) || 'user')
        if (isEdit && articleId) {
          const a = await getArticleById(articleId)
          if (a && mounted) {
            setTitle(a.title || '')
            setSlug(a.slug || '')
            setExcerpt(a.excerpt || '')
            setContentHtml(a.contentHtml || '')
            setImages(a.images || [])
            setStatus((a.status as any) || 'published')
          }
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }
    init()
    return () => { mounted = false }
  }, [isEdit, articleId])

  const canEdit = useMemo(() => role === 'admin' || role === 'editor', [role])

  function slugify(s: string) {
    return (s || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // quita acentos
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
  }

  function summarizeHtml(html: string, max = 160) {
    const tmp = document.createElement('div')
    tmp.innerHTML = html || ''
    const text = (tmp.textContent || tmp.innerText || '').trim().replace(/\s+/g, ' ')
    return text.length > max ? text.slice(0, max - 1) + '…' : text
  }

  useEffect(() => {
    if (autoSlug) setSlug(slugify(title))
  }, [title])

  useEffect(() => {
    if (autoExcerpt && contentHtml && !excerpt) {
      setExcerpt(summarizeHtml(contentHtml))
    }
  }, [contentHtml])

  async function handleUploadImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files ? Array.from(e.target.files) : []
    if (!files.length) return
    try {
      const urls = await uploadArticleImages(files)
      // Usaremos la primera como portada
      setImages((prev) => (prev.length ? [urls[0], ...prev.filter((u) => u !== urls[0])] : [urls[0]]))
    } catch (e: any) {
      alert(e?.message || 'No se pudieron subir las imágenes')
    }
  }

  function handleDrop(ev: React.DragEvent<HTMLDivElement>) {
    ev.preventDefault()
    setDragOver(false)
    const files = Array.from(ev.dataTransfer.files || []).filter((f) => f.type.startsWith('image/'))
    if (!files.length) return
    const input = { target: { files } } as unknown as React.ChangeEvent<HTMLInputElement>
    handleUploadImages(input)
  }

  async function handleSave() {
    try {
      setSaving(true)
      if (isEdit && articleId) {
        const updated = await updateArticle(articleId, { title, slug, excerpt, contentHtml, images, status })
        navigate(`/articles/${updated.slug || updated.id}`)
      } else {
        const created = await createArticle({ title, slug, excerpt, contentHtml, images, status })
        navigate(`/articles/${created.slug || created.id}`)
      }
    } catch (e: any) {
      alert(e?.message || 'No se pudo guardar el artículo')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="p-4">Cargando…</p>
  if (!canEdit) return <p className="p-4">No tienes permisos para gestionar artículos.</p>

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">{isEdit ? 'Editar artículo' : 'Nuevo artículo'}</h1>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="md:col-span-2 space-y-6">
          {/* Título y slug */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6">
            <label className="block text-sm font-medium mb-1">Título</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Ingresa un título llamativo"
            />
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              <div>
                <label className="block text-sm font-medium mb-1">Estado</label>
                <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="border rounded-lg px-3 py-2 w-full">
                  <option value="published">Publicado</option>
                  <option value="draft">Borrador</option>
                </select>
              </div>
            </div>
          </div>

          {/* Extracto y contenido */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 space-y-4">
            

            <div>
              <label className="block text-sm font-medium mb-1">Contenido</label>
              <RichTextEditor value={contentHtml} onChange={setContentHtml} />
              
            </div>
          </div>
        </div>

        {/* Columna lateral */}
        <div className="space-y-6">
          {/* Portada */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Imagen de portada</h3>
              <button
                type="button"
                className="text-sm px-3 py-1.5 rounded-lg border"
                onClick={() => fileInputRef.current?.click()}
              >Cambiar</button>
            </div>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`aspect-video rounded-xl border-dashed border-2 grid place-items-center overflow-hidden ${dragOver ? 'border-primary-500 bg-primary-50' : 'border-gray-300 bg-gray-50'}`}
            >
              {images[0] ? (
                <img src={images[0]} alt="portada" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center text-sm text-gray-500 p-6">
                  Arrastra una imagen aquí o usa el botón "Cambiar"
                </div>
              )}
            </div>
            {images[0] && (
              <div className="mt-2 flex justify-between text-xs text-gray-600">
                <span>Usaremos esta imagen como portada</span>
                <button className="underline" onClick={() => setImages([])}>Quitar</button>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUploadImages} />
          </div>

          {/* Acciones */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6">
            <div className="flex gap-2 justify-end">
              <button onClick={() => navigate(-1)} className="px-4 py-2 rounded-lg border">Cancelar</button>
              <button onClick={handleSave} disabled={saving || !title || !contentHtml} className="px-4 py-2 rounded-lg bg-primary-600 text-white disabled:opacity-50">
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500">Se requiere título y contenido.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
 
