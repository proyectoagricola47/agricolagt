import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import ListingCard from '../components/ListingCard'
import { listarOfertas, type Listing } from '../services/marketService'

export default function MarketPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<Listing[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function cargar(q?: string) {
    setCargando(true)
    setError(null)
    try {
      setItems(await listarOfertas(q))
    } catch (e) {
      console.error(e)
      setError('No se pudieron cargar las ofertas. Revisa tu conexión.')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargar() }, [])

  function buscar(e: React.FormEvent) {
    e.preventDefault()
    cargar(busqueda)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold">Mercado</h1>
          <p className="text-sm text-gray-600 mt-1 max-w-2xl">
            Ofertas publicadas por agricultores del municipio. El contacto se muestra
            directamente, sin intermediarios.
          </p>
        </div>
        {user && (
          <Link
            to="/posts/new"
            className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 text-sm whitespace-nowrap"
          >
            Publicar una oferta
          </Link>
        )}
      </div>

      <form onSubmit={buscar} className="my-5 flex gap-2">
        <input
          id="market-search"
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar maíz, frijol, café…"
          className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-lg border border-primary-500 text-primary-700 hover:bg-primary-50"
        >
          Buscar
        </button>
      </form>

      {error && (
        <p className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      {cargando ? (
        <p className="text-gray-500">Cargando ofertas…</p>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-8 text-center">
          <p className="text-gray-600">No hay ofertas publicadas por el momento.</p>
          {user && (
            <p className="mt-2 text-sm text-gray-500">
              Para publicar una, crea una publicación y márcala con el tipo{' '}
              <span className="font-medium">Comercial</span>.
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      )}
    </div>
  )
}
