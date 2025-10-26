import PostCard from '../components/posts/PostCard'
import CurrentWeatherCard from '../../weathers/components/CurrentWeatherCard'
import AlertsList from '../../weathers/components/AlertsList'
import type { Alert } from '../../../model/weather'
import { useEffect, useMemo, useRef, useState } from 'react'
import { listPosts } from '../services/postService'
import type { Post } from '../../../model/post'
import { supabase } from '../../../api/supabaseClient'
import { deriveInsights, getWeatherAtescatempa, getWeatherByCoords, type WeatherBundle } from '../../weathers/services/openWeatherService'


import { useNavigate } from 'react-router-dom'

export default function FeedPage() {
  const navigate = useNavigate()
  const [posts, setPosts] = useState<Post[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  // Clima (usa última ubicación guardada o Atescatempa)
  const [bundle, setBundle] = useState<WeatherBundle | null>(null)
  const [wLoading, setWLoading] = useState(false)
  const alerts = useMemo<Alert[]>(() => (bundle ? (deriveInsights(bundle) as unknown as Alert[]) : []), [bundle])

  useEffect(() => {
    let alive = true
    async function load(p: number) {
      setLoading(true)
      try {
        const { items, hasMore } = await listPosts(p, 10)
        if (!alive) return
        setPosts(prev => p === 0 ? items : [...prev, ...items])
        setHasMore(hasMore)
      } catch (e) {
        console.error(e)
      } finally {
        if (alive) setLoading(false)
      }
    }
    load(0)
    return () => { alive = false }
  }, [])

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setWLoading(true)
        const saved = typeof window !== 'undefined' ? localStorage.getItem('weather:lastLocation') : null
        if (saved) {
          try {
            const p = JSON.parse(saved) as { lat: number; lon: number }
            const b = await getWeatherByCoords(p.lat, p.lon)
            if (alive) setBundle(b)
          } catch {
            const b = await getWeatherAtescatempa()
            if (alive) setBundle(b)
          }
        } else {
          const b = await getWeatherAtescatempa()
          if (alive) setBundle(b)
        }
      } catch (e) {
        console.error(e)
      } finally {
        if (alive) setWLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  useEffect(() => {
    if (!sentinelRef.current) return
    const el = sentinelRef.current
    const io = new IntersectionObserver((entries) => {
      const first = entries[0]
      if (first.isIntersecting && !loading && hasMore) {
        const next = page + 1
        setPage(next)
        ;(async () => {
          try {
            const { items, hasMore } = await listPosts(next, 10)
            setPosts(prev => [...prev, ...items])
            setHasMore(hasMore)
          } catch (e) {
            console.error(e)
          }
        })()
      }
    }, { rootMargin: '200px' })
    io.observe(el)
    return () => io.disconnect()
  }, [page, hasMore, loading])

  // Suscripción Realtime post
  useEffect(() => {
    const channel = supabase
      .channel('posts-insert')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, async (payload) => {
        try {
          const id = (payload.new as any)?.id
          if (!id) return
          const { getPostById } = await import('../services/postService')
          const p = await getPostById(id)
          if (!p) return
          setPosts((prev) => {
            if (prev.some(x => x.id === p.id)) return prev
            return [p, ...prev]
          })
        } catch (e) {
          console.error(e)
        }
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])
  return (
    <div>
      {/* Encabezado */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-bold">Publicaciones Recientes</h1>
      </div>

      {/* Layout: contenido + barra derecha sticky */}
      <div className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-6">
        {/* Contenido principal */}
        <div>
          {/* Lista de posts (más recientes primero), 10 por página con infinito */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {posts.map((p) => (
              <PostCard
                key={p.id}
                images={p.images}
                title={p.title}
                excerpt={p.excerpt || ''}
                commentsCount={p.commentsCount || 0}
                author={{ name: p.author?.name || 'Autor', avatar: p.author?.avatarUrl }}
                categories={p.categories || []}
                createdAt={p.createdAt}
                variant="large"
                onOpen={() => navigate(`/posts/${p.id}`)}
              />
            ))}
          </div>
          <div ref={sentinelRef} className="h-10 flex items-center justify-center text-sm text-gray-500">
            {loading ? 'Cargando…' : hasMore ? ' ' : posts.length === 0 ? 'Sin publicaciones' : 'No hay más resultados'}
          </div>
        </div>

        {/* Barra derecha sticky */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-4">
            {/* Búsqueda y acciones */}
           {/*  <div className="flex items-center gap-2">
              <input
                type="search"
                placeholder="Buscar artículos, guías..."
                className="h-10 flex-1 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button className="h-10 px-3 rounded-lg border border-gray-300 text-sm">Filtros</button>
              <button className="h-10 px-3 rounded-lg border border-gray-300 text-sm">Ordenar</button>
            </div> */}

            {/* Clima (datos en vivo) */}
            {bundle ? (
              <CurrentWeatherCard
                tempC={bundle.current.tempC}
                summary={bundle.current.summary}
                details={[
                  { label: 'Humedad', value: `${bundle.current.humidity}%`, icon: 'humidity' },
                  { label: 'Viento', value: `${bundle.current.windKmh} km/h`, icon: 'wind' },
                  { label: 'Índice UV', value: bundle.current.uvi ? String(bundle.current.uvi) : '—', icon: 'uv' },
                ]}
                variant="compact"
              />
            ) : (
              <section className="rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-500">
                {wLoading ? 'Cargando clima…' : 'Clima no disponible'}
              </section>
            )}

            {/* Alertas */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Alertas rápidas</h3>
              <AlertsList alerts={alerts} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
