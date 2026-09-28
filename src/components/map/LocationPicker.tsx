import 'leaflet/dist/leaflet.css'
import { useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, useMapEvents } from 'react-leaflet'

type Coords = { lat: number; lng: number }
type MapClickEvent = { latlng: Coords }

type Props = {
  value?: Coords
  onChange: (coords: Coords | undefined) => void
  /** Centro que se usa mientras no haya un punto elegido. */
  fallbackCenter?: Coords
  height?: number
}

/** Centro por omisión: Atescatempa, Jutiapa. */
const CENTRO_POR_OMISION: Coords = { lat: 14.2333, lng: -89.7333 }

function CapturadorDeClic({ onPick }: { onPick: (c: Coords) => void }) {
  useMapEvents({
    click(e: MapClickEvent) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })
  return null
}

/**
 * Permite señalar un punto en el mapa, ya sea tocándolo o tomando
 * la ubicación del dispositivo. Se usa en el registro de cultivos y
 * en el de plagas para alimentar el mapa general.
 */
export default function LocationPicker({ value, onChange, fallbackCenter, height = 260 }: Props) {
  const [buscando, setBuscando] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)

  const centro = value ?? fallbackCenter ?? CENTRO_POR_OMISION

  const MapC = MapContainer as any
  const TL = TileLayer as any
  const Punto = CircleMarker as any

  function usarMiUbicacion() {
    if (!('geolocation' in navigator)) {
      setAviso('Este dispositivo no permite obtener la ubicación.')
      return
    }
    setBuscando(true)
    setAviso(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setBuscando(false)
      },
      () => {
        setAviso('No se pudo obtener la ubicación. Puedes señalarla tocando el mapa.')
        setBuscando(false)
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-gray-200 overflow-hidden" style={{ height }}>
        <MapC
          center={[centro.lat, centro.lng]}
          zoom={value ? 15 : 12}
          style={{ height: '100%', width: '100%' }}
        >
          <TL
            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <CapturadorDeClic onPick={onChange} />
          {value && (
            <Punto
              center={[value.lat, value.lng]}
              radius={10}
              pathOptions={{ color: '#047857', fillColor: '#10b981', fillOpacity: 0.7 }}
            />
          )}
        </MapC>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <button
          type="button"
          onClick={usarMiUbicacion}
          disabled={buscando}
          className="px-3 py-1.5 rounded-lg border border-primary-500 text-primary-700 hover:bg-primary-50 disabled:opacity-60"
        >
          {buscando ? 'Obteniendo…' : 'Usar mi ubicación'}
        </button>

        {value ? (
          <>
            <span className="text-gray-600">
              {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
            </span>
            <button
              type="button"
              onClick={() => onChange(undefined)}
              className="text-gray-500 hover:text-red-600 underline"
            >
              Quitar
            </button>
          </>
        ) : (
          <span className="text-gray-500">Toca el mapa para señalar el lugar.</span>
        )}
      </div>

      {aviso && <p className="text-sm text-amber-700">{aviso}</p>}
    </div>
  )
}
