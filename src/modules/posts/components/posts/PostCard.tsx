import { useNavigate } from 'react-router-dom'

type Props = {
  // Nuevo: múltiples imágenes tipo red social
  images?: string[]
  // Compatibilidad: permitir "image" y convertirla a images[0]
  image?: string
  title: string
  excerpt: string
  badge?: string // p.ej. 8 min
  commentsCount?: number
  author?: { name: string; avatar?: string }
  variant?: 'default' | 'large'
  categories?: string[]
  createdAt?: string
  onOpen?: () => void
  onReadMore?: () => void // compat
}

function ChatIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a8 8 0 0 1-8 8H7l-4 3 1.5-5A8 8 0 1 1 21 12z" />
    </svg>
  )
}

function formatPublishedEs(dateIso?: string) {
  if (!dateIso) return ''
  const d = new Date(dateIso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMin / 60)
  if (diffMin < 1) return 'ahora'
  if (diffMin < 60) return `hace ${diffMin} ${diffMin === 1 ? 'minuto' : 'minutos'}`
  if (diffHr === 1) return 'hace 1 hora'
  // >= 2 horas: fecha y hora completas
  const fecha = d.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
  const hora = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  return `${fecha}, ${hora}`
}

export default function PostCard({ images, image, title, excerpt, commentsCount = 0, author, variant = 'default', categories = [], createdAt, onOpen, onReadMore }: Props) {
  const navigate = useNavigate()
  const imgs = images && images.length > 0 ? images : image ? [image] : []
  const handleOpen = onOpen ?? onReadMore ?? (() => navigate('/posts/1'))
  const publishedLabel = formatPublishedEs(createdAt)

  // Layout de galería: 1, 2, 3, 4+ imágenes
  function Gallery() {
    if (imgs.length <= 1) {
      return (
        <div className={variant === 'large' ? 'aspect-[21/9] w-full overflow-hidden' : 'aspect-[16/9] w-full overflow-hidden'}>
          <img src={imgs[0]} alt={title} className="w-full h-full object-cover" />
        </div>
      )
    }
    if (imgs.length === 2) {
      return (
        <div className={variant === 'large' ? 'aspect-[21/9] grid grid-cols-2 gap-1' : 'aspect-[16/9] grid grid-cols-2 gap-1'}>
          {imgs.slice(0, 2).map((src, i) => (
            <img key={i} src={src} alt={`${title}-${i + 1}`} className="w-full h-full object-cover" />
          ))}
        </div>
      )
    }
    if (imgs.length === 3) {
      return (
        <div className={variant === 'large' ? 'aspect-[21/9] grid grid-cols-2 gap-1' : 'aspect-[16/9] grid grid-cols-2 gap-1'}>
          <img src={imgs[0]} alt={`${title}-1`} className="w-full h-full object-cover col-span-1 row-span-2" />
          <img src={imgs[1]} alt={`${title}-2`} className="w-full h-full object-cover" />
          <img src={imgs[2]} alt={`${title}-3`} className="w-full h-full object-cover" />
        </div>
      )
    }
    // 4 o más
    const extra = imgs.length - 4
    return (
      <div className={variant === 'large' ? 'aspect-[21/9] grid grid-cols-2 grid-rows-2 gap-1' : 'aspect-[16/9] grid grid-cols-2 grid-rows-2 gap-1'}>
        {imgs.slice(0, 4).map((src, i) => (
          <div key={i} className="relative">
            <img src={src} alt={`${title}-${i + 1}`} className="w-full h-full object-cover" />
            {i === 3 && extra > 0 && (
              <div className="absolute inset-0 bg-black/40 text-white text-lg font-semibold grid place-items-center">+{extra}</div>
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <article
      onClick={handleOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleOpen()}
      className="group cursor-pointer bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-primary-300 flex flex-col"
    >
      <Gallery />
      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Autor */}
        {author && (
          <div className="flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2 min-w-0">
              {author.avatar ? (
                <img src={author.avatar} alt={author.name} className="w-8 h-8 rounded-full object-cover border" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-200 grid place-items-center text-gray-500 border">👤</div>
              )}
              <span className="text-gray-800 font-medium truncate">{author.name}</span>
            </div>

            {publishedLabel && (
              <span className="shrink-0 inline-flex items-center gap-1 text-xs text-gray-500">
                <span className="w-2 h-2 rounded-full bg-primary-500" />
                {publishedLabel}
              </span>
            )}
          </div>
        )}
        <p className={variant === 'large' ? 'text-sm text-gray-600 line-clamp-4' : 'text-sm text-gray-600 line-clamp-3'}>{excerpt}</p>

        {/* Categorías de la publicación */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {categories.slice(0, 3).map((c) => (
              <span key={c} className="text-xs px-2 py-0.5 rounded-full border border-primary-300 bg-primary-100 text-gray-700">{c}</span>
            ))}
            {categories.length > 3 && (
              <span className="text-xs px-2 py-0.5 rounded-full border border-gray-200 bg-gray-50 text-gray-600">+{categories.length - 3}</span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 text-sm text-gray-600 mt-auto">
          <div className="inline-flex items-center gap-1">
            <ChatIcon className="w-4 h-4 text-gray-500" />
            <span>{commentsCount}</span>
            <span className="text-gray-400">comentarios</span>
          </div>
          <div className="inline-flex items-center gap-3">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-primary-700 text-xs">Abrir publicación →</span>
          </div>
        </div>
      </div>
    </article>
  )
}
