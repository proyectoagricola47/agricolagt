import { useEffect, useState } from 'react'
import { listArticles } from '../services/articleService'
import type { Article } from '../../../model'
import { Link } from 'react-router-dom'
import { getWeatherAtescatempa, type WeatherBundle, deriveInsights, type Insight } from '../../weathers/services/openWeatherService'

// Iconos livianos en SVG para el panel de clima/alertas
const IconCloudSun = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
    <path d="M12 3v2M4.93 4.93l1.41 1.41M3 12h2M4.93 19.07l1.41-1.41M12 19v2M17.66 6.34A4.5 4.5 0 0 1 22 10.5c0 .17-.01.34-.03.5h-.97a4 4 0 0 0-7.15-2.31 5 5 0 1 0-1.79 9.78H18a4 4 0 0 0 0-8c-.11 0-.22 0-.33.01a4.5 4.5 0 0 1-.01-3.44z"/>
  </svg>
)
const IconDroplet = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
    <path d="M12 2s6 6.5 6 11a6 6 0 1 1-12 0c0-4.5 6-11 6-11z"/>
  </svg>
)
const IconWind = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
    <path d="M3 8h10a3 3 0 1 0-3-3"/>
    <path d="M3 12h14a3 3 0 1 1-3 3"/>
  </svg>
)
const IconSun = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
    <circle cx="12" cy="12" r="4"/>
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
  </svg>
)
const IconDot = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}><circle cx="12" cy="12" r="6"/></svg>
)
const IconCheck = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><path d="M20 6L9 17l-5-5"/></svg>
)

export default function ArticlesListPage() {
  const [items, setItems] = useState<Article[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)

  // Weather
  const [weather, setWeather] = useState<WeatherBundle | null>(null)
  const [insights, setInsights] = useState<Insight[]>([])
  const [wLoading, setWLoading] = useState(false)

  async function load(p = page) {
    if (loading) return
    setLoading(true)
    try {
      const { items, hasMore } = await listArticles(p, 10, 'published')
      setItems((prev) => (p === 0 ? items : [...prev, ...items]))
      setHasMore(hasMore)
      setPage(p)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // cargar clima para el panel lateral
    ;(async () => {
      try {
        setWLoading(true)
        const bundle = await getWeatherAtescatempa()
        setWeather(bundle)
        setInsights(deriveInsights(bundle).slice(0, 3))
      } catch (e) {
        // noop: el panel mostrará estado vacío
      } finally {
        setWLoading(false)
      }
    })()
  }, [])

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Artículos</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Columna principal: tarjetas */}
        <div className="lg:col-span-2">
          {/* Grid de tarjetas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {items.map((a) => {
          const cover = a.images?.[0]
          const when = a.publishedAt || a.createdAt
          const dateLabel = when
            ? new Date(when).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
            : ''

          return (
            <Link
              key={a.id}
              to={`/articles/${a.slug || a.id}`}
              className="group block overflow-hidden rounded-2xl border bg-white shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
            >
              {/* Portada */}
              <div className="relative w-full aspect-[16/9] bg-gray-100">
                {cover ? (
                  <img
                    src={cover}
                    alt={`Portada de ${a.title}`}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-end">
                    <div className="p-3 text-emerald-700/80 text-xs">Sin portada</div>
                  </div>
                )}
              </div>

              {/* Contenido */}
              <div className="p-4">
                <h2 className="text-base font-semibold text-gray-900 group-hover:text-emerald-700">
                  {a.title}
                </h2>
                {dateLabel && <p className="mt-1 text-xs text-gray-500">{dateLabel}</p>}
                {a.excerpt && (
                  <p className="mt-2 text-sm text-gray-600">{a.excerpt}</p>
                )}
              </div>
            </Link>
          )
        })}
          </div>
        </div>

        {/* Sidebar clima */}
        <aside className="lg:col-span-1 space-y-4">
          {/* Tarjeta Clima - estilo suave */}
          <div className="rounded-2xl border border-emerald-200 bg-gradient-to-b from-emerald-50 to-white shadow-sm p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white border text-emerald-600">
                  <IconCloudSun className="h-5 w-5" />
                </span>
                <p className="text-sm font-semibold text-gray-800">Clima Actual</p>
              </div>
              {weather && (
                <p className="text-3xl font-extrabold text-gray-900">{Math.round(weather.current.tempC)}°C</p>
              )}
            </div>

            {weather ? (
              <>
                <p className="mt-1 text-sm text-gray-700">{weather.current.summary}</p>
                <hr className="my-3 border-emerald-100" />
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col items-center gap-1 rounded-xl bg-emerald-50 text-emerald-700 py-2">
                    <IconDroplet className="h-5 w-5" />
                    <div className="text-xs">
                      <span className="font-semibold">{weather.current.humidity}%</span>
                      <span className="block text-emerald-700/70">Humedad</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1 rounded-xl bg-emerald-50 text-emerald-700 py-2">
                    <IconWind className="h-5 w-5" />
                    <div className="text-xs">
                      <span className="font-semibold">{weather.current.windKmh} km/h</span>
                      <span className="block text-emerald-700/70">Viento</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1 rounded-xl bg-emerald-50 text-emerald-700 py-2">
                    <IconSun className="h-5 w-5" />
                    <div className="text-xs">
                      <span className="font-semibold">{weather.current.uvi ?? '—'}</span>
                      <span className="block text-emerald-700/70">Índice UV</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-500 mt-3">{wLoading ? 'Cargando clima…' : 'No disponible'}</p>
            )}
          </div>

          {/* Alertas rápidas */}
          <div className="rounded-2xl border border-emerald-200 bg-white shadow-sm p-4">
            <p className="text-sm font-semibold text-gray-800 mb-2">Alertas rápidas</p>
            {insights.length ? (
              <ul className="space-y-3">
                {insights.map((i, idx) => (
                  <li
                    key={idx}
                    className={`rounded-xl p-3 border ${
                      i.severity === 'high'
                        ? 'bg-amber-50/60 border-amber-300'
                        : i.severity === 'medium'
                        ? 'bg-amber-50/50 border-amber-300'
                        : 'bg-emerald-50/60 border-emerald-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {i.severity === 'high' || i.severity === 'medium' ? (
                          <span className="inline-flex h-5 w-5 items-center justify-center">
                            <IconDot className="h-3 w-3 text-amber-500" />
                          </span>
                        ) : (
                          <span className="inline-flex h-5 w-5 items-center justify-center text-emerald-600">
                            <IconCheck className="h-4 w-4" />
                          </span>
                        )}
                        <p className="text-sm font-semibold text-gray-900">{i.title}</p>
                      </div>
                      {i.tags?.[0] && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-white border text-gray-600">{i.tags[0]}</span>
                      )}
                    </div>
                    {i.description && <p className="mt-1 text-xs text-gray-700">{i.description}</p>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">{wLoading ? 'Analizando…' : 'Sin alertas por ahora'}</p>
            )}
          </div>
        </aside>
      </div>

      {hasMore && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => load(page + 1)}
            disabled={loading}
            className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? 'Cargando…' : 'Cargar más'}
          </button>
        </div>
      )}
    </div>
  )
}
