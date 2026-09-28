import { Link } from 'react-router-dom'
import type { Listing } from '../services/marketService'

function formatoFecha(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return iso
  }
}

export default function ListingCard({ listing }: { listing: Listing }) {
  const portada = listing.images?.[0]
  const etiquetas = listing.categories.filter((c) => c !== 'Comercial')

  return (
    <article className="rounded-xl border border-gray-200 bg-white overflow-hidden flex flex-col">
      {portada && (
        <img
          src={portada}
          alt={listing.title}
          className="w-full h-44 object-cover"
          loading="lazy"
        />
      )}

      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex flex-wrap gap-2">
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary-50 border border-primary-200 text-primary-700">
            En venta
          </span>
          {etiquetas.map((t) => (
            <span key={t} className="text-xs px-2 py-0.5 rounded-full border border-gray-300 text-gray-600">
              {t}
            </span>
          ))}
        </div>

        <h3 className="font-semibold text-gray-900 leading-snug">
          <Link to={`/posts/${listing.id}`} className="hover:text-primary-700">
            {listing.title}
          </Link>
        </h3>

        {listing.excerpt && (
          <p className="text-sm text-gray-700 line-clamp-3">{listing.excerpt}</p>
        )}

        <div className="mt-auto pt-3 border-t border-gray-100 text-sm">
          <p className="font-medium text-gray-900">{listing.author.name}</p>
          {listing.author.location && (
            <p className="text-gray-600 text-xs">📍 {listing.author.location}</p>
          )}
          {listing.author.phone ? (
            <p className="mt-1 text-gray-800">
              📞 <span className="select-all font-medium">{listing.author.phone}</span>
            </p>
          ) : (
            <p className="mt-1 text-xs text-gray-500">
              Este agricultor aún no registró su teléfono de contacto.
            </p>
          )}
          <p className="mt-2 text-xs text-gray-500">Publicado el {formatoFecha(listing.createdAt)}</p>
        </div>
      </div>
    </article>
  )
}
