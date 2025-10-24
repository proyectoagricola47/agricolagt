import 'leaflet/dist/leaflet.css'

type MapClickEvent = { latlng: { lat: number; lng: number } }
import { MapContainer, TileLayer, LayersControl, useMapEvents } from 'react-leaflet'

const API_KEY = import.meta.env.VITE_OPENWEATHER_KEY as string

type Props = {
  center: { lat: number; lon: number }
  zoom?: number
  onSelectLocation?: (coords: { lat: number; lon: number }) => void
  overlayOpacity?: number
}

function ClickHandler({ onSelect }: { onSelect?: (coords: { lat: number; lon: number }) => void }) {
  useMapEvents({
    click(e: MapClickEvent) {
      onSelect?.({ lat: e.latlng.lat, lon: e.latlng.lng })
    },
  })
  return null
}

export default function WeatherMap({ center, zoom = 10, onSelectLocation, overlayOpacity = 0.8 }: Props) {
  const MapC: any = MapContainer as any
  const Layers: any = LayersControl as any
  const TL: any = TileLayer as any
  const { BaseLayer, Overlay } = Layers
  const owm = (layer: string) => `https://tile.openweathermap.org/map/${layer}/{z}/{x}/{y}.png?appid=${API_KEY}`

  return (
    <section className="rounded-2xl border border-gray-200 overflow-hidden">
      <div className="h-[360px]">
        <MapC center={[center.lat, center.lon]} zoom={zoom} style={{ height: '100%', width: '100%' }}>
          <ClickHandler onSelect={onSelectLocation} />
          <Layers position="topright">
            <BaseLayer checked name="Mapa base (OSM)">
              <TL
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
            </BaseLayer>

            <Overlay checked name="Precipitación">
              <TL url={owm('precipitation_new')} opacity={overlayOpacity} />
            </Overlay>
            <Overlay name="Temperatura">
              <TL url={owm('temp_new')} opacity={overlayOpacity} />
            </Overlay>
            <Overlay name="Nubes">
              <TL url={owm('clouds_new')} opacity={overlayOpacity} />
            </Overlay>
            <Overlay name="Viento">
              <TL url={owm('wind_new')} opacity={overlayOpacity} />
            </Overlay>
            <Overlay name="Presión">
              <TL url={owm('pressure_new')} opacity={overlayOpacity} />
            </Overlay>
          </Layers>
        </MapC>
      </div>
    </section>
  )
}
