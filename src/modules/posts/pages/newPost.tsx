import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

type ImageItem = {
  file: File
  url: string
}

const CATEGORIES = ['Plagas', 'Fertilizantes', 'Maíz', 'Sequía', 'Cosecha', 'Suelos', 'Clima', 'Irrigación']

function classNames(...arr: Array<string | false | null | undefined>) {
  return arr.filter(Boolean).join(' ')
}

function getExcerpt(text: string, max = 180) {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  return clean.slice(0, max).trimEnd() + '…'
}

export default function NewPostPage() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [images, setImages] = useState<ImageItem[]>([])
  const [dragging, setDragging] = useState(false)
  const [selectedCats, setSelectedCats] = useState<string[]>(['Maíz', 'Sequía'])
  const [saving, setSaving] = useState(false)

  const inputRef = useRef<HTMLInputElement | null>(null)

  // cleanup object URLs
  useEffect(() => {
    return () => images.forEach(i => URL.revokeObjectURL(i.url))
  }, [images])

  const preview = useMemo(() => {
    return {
      title: title || 'Innovaciones en el Cultivo de Maíz para Zonas Áridas',
      excerpt:
        getExcerpt(
          content ||
            'La agricultura moderna se enfrenta al desafío de la escasez hídrica, especialmente en regiones áridas. Investigaciones recientes han demostrado que la implementación de híbridos de maíz tolerantes a la sequía, combinados con técnicas avanzadas de irrigación de precisión, …',
        ),
      date: new Date(),
      imageUrl:
        images[0]?.url ||
        'data:image/svg+xml;utf8,' +
          encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450"><defs><linearGradient id="g" x1="0" x2="1"><stop stop-color="#e6f4ea"/><stop offset="1" stop-color="#c7ecd3"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#2a7a39" font-family="Arial" font-size="24">Vista previa</text></svg>`
          ),
      badge: selectedCats[0] || 'Clima',
    }
  }, [title, content, images, selectedCats])

  function onFilesSelected(files: FileList | null) {
    if (!files?.length) return
    const arr = Array.from(files)
      .slice(0, 6)
      .map((file) => ({ file, url: URL.createObjectURL(file) }))
    setImages((prev) => [...prev, ...arr].slice(0, 6))
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    setDragging(false)
    onFilesSelected(e.dataTransfer.files)
  }

  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    setDragging(true)
  }

  function onDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    setDragging(false)
  }

  function toggleCat(cat: string) {
    setSelectedCats((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    )
  }

  async function handlePublish() {
    if (!title.trim() || !content.trim()) {
      alert('Título y contenido son obligatorios')
      return
    }
    setSaving(true)
    try {
      const { uploadPostImages, createPost } = await import('../services/postService')
      // Subir imágenes seleccionadas (si hay)
      const urls = await uploadPostImages(images.map(i => i.file))
      const excerpt = getExcerpt(content)
      const post = await createPost({
        title,
        content,
        excerpt,
        images: urls,
        categories: selectedCats,
      })
      // Navegar al detalle del post
      navigate(`/posts/${post.id}`)
    } catch (e) {
      console.error(e)
      alert('No se pudo publicar el post')
    } finally {
      setSaving(false)
    }
  }

  function handleDraft() {
    console.log('Guardar borrador', { title, content, categories: selectedCats, images })
    alert('Borrador guardado localmente (demo).')
  }

  return (
    <div className="pb-16">
      <h1 className="text-2xl md:text-3xl font-extrabold mb-6">Editar Publicación</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda: formulario */}
        <div className="lg:col-span-2 space-y-6">
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título de la publicación</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Escribe un título conciso y descriptivo"
              className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </div>

           {/* Categorías */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Categorías</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => {
                const active = selectedCats.includes(c)
                return (
                  <button
                    type="button"
                    key={c}
                    onClick={() => toggleCat(c)}
                    className={classNames(
                      'text-xs px-3 py-1.5 rounded-full border transition-colors',
                      active
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    )}
                  >
                    {c}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Contenido */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contenido principal</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              placeholder="Desarrolla el contenido de tu publicación aquí…"
              className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </div>

          {/* Imágenes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Imágenes</label>
            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              className={classNames(
                'rounded-xl border-2 border-dashed border-gray-300 bg-white p-6 transition-all',
                dragging && 'ring-2 ring-primary-300'
              )}
            >
              <div className="aspect-[16/9] w-full max-w-xl mx-auto grid place-items-center bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-center px-4 py-8 text-sm text-gray-500">
                  Arrastra y suelta imágenes aquí, o haz clic para subir
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                {images.map((img, idx) => (
                  <div key={idx} className="w-24 h-24 rounded-lg overflow-hidden border border-gray-200">
                    <img src={img.url} alt={`preview-${idx}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <button
                  onClick={() => inputRef.current?.click()}
                  type="button"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                >
                  <span>📷</span>
                  Seleccionar imágenes
                </button>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => onFilesSelected(e.target.files)}
                />
              </div>
            </div>
          </div>

         

          {/* Acciones */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handlePublish}
              disabled={saving}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-primary-600 text-white hover:bg-primary-700 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? 'Publicando…' : 'Publicar'}
            </button>
            <button
              onClick={handleDraft}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
            >
              Guardar borrador
            </button>
          </div>
        </div>

        {/* Columna derecha: vista previa */}
        <aside className="lg:col-span-1">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Vista Previa</h3>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="aspect-[16/9] w-full overflow-hidden bg-gray-100">
              <img src={preview.imageUrl} alt="previsualización" className="w-full h-full object-cover" />
            </div>
            <div className="p-4 space-y-2">
              <h4 className="font-semibold text-gray-900 leading-snug">{preview.title}</h4>
              <p className="text-sm text-gray-600 line-clamp-4">{preview.excerpt}</p>
              <div className="text-xs text-gray-500 flex items-center gap-1 pt-1">
                <span>📅</span>
                <span>
                  {preview.date.toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
