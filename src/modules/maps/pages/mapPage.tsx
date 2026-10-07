import 'leaflet/dist/leaflet.css'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import { cropsService } from '../../crops/services/cropsService'
import { pestService } from '../../pests/services/pestService'
import { waterService } from '../../water/services/waterService'
import type { Crop } from '../../../model/crop'
import { SEVERITY_COLOR, SEVERITY_LABEL, type PestReport } from '../../../model/pest'
import {
  WATER_COLOR,
  WATER_TYPE_LABEL,
  WATER_TYPE_ICON,
  type WaterSource,
} from '../../../model/water'

/** Centro por omisión: Atescatempa, Jutiapa. */
const CENTRO: [number, number] = [14.2333, -89.7333]

const COLOR_CULTIVO = '#0f766e'

function formatoFecha(iso: string): string {
  if (!iso) return ''
  try {
    return new Date(`${iso}T00:00:00`).toLocaleDateString('es-GT', {
      day: '2-digit', month: 'short', year: 'numeric',
    })
  } catch {
    return iso
  }
}

export default function MapPage() {
  const [crops, setCrops] = useState<Crop[]>([])
  const [plagas, setPlagas] = useState<PestReport[]>([])
  const [aguas, setAguas] = useState<WaterSource[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [verCultivos, setVerCultivos] = useState(true)
  const [verPlagas, setVerPlagas] = useState(true)
  const [verAgua, setVerAgua] = useState(true)
  const [tipoPlaga, setTipoPlaga] = useState('')

  useEffect(() => {
    let vivo = true
    ;(async () => {
      try {
        const [c, p, a] = await Promise.all([
          cropsService.listAll(),
          pestService.listAll(),
          waterService.listAll(),
        ])
        if (!vivo) return
        setCrops(c)
        setPlagas(p)
        setAguas(a)
      } catch (e) {
        console.error(e)
        if (vivo) setError('No se pudieron cargar los datos del mapa.')
      } finally {
        if (vivo) setCargando(false)
      }
    })()
    return () => { vivo = false }
  }, [])

  const cultivosUbicados = useMemo(
    () => crops.filter((c) => c.lat != null && c.lng != null),
    [crops],
  )

  const plagasUbicadas = useMemo(
    () => plagas.filter((p) => p.lat != null && p.lng != null),
    [plagas],
  )

  const tiposDePlaga = useMemo(
    () => Array.from(new Set(plagasUbicadas.map((p) => p.pestType))).sort(),
    [plagasUbicadas],
  )

  const plagasVisibles = useMemo(
    () => (tipoPlaga ? plagasUbicadas.filter((p) => p.pestType === tipoPlaga) : plagasUbicadas),
    [plagasUbicadas, tipoPlaga],
  )

  /** El mapa se centra en el primer punto disponible del agricultor. */
  const centro = useMemo<[number, number]>(() => {
    const primero = cultivosUbicados[0] ?? plagasUbicadas[0]
    if (primero?.lat != null && primero?.lng != null) return [primero.lat, primero.lng]
    return CENTRO
  }, [cultivosUbicados, plagasUbicadas])

  const MapC = MapContainer as any
  const TL = TileLayer as any
  const Punto = CircleMarker as any
  const Globo = Popup as any

  const sinDatos =
    cultivosUbicados.length === 0 && plagasUbicadas.length === 0 && aguas.length === 0

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl md:text-3xl font-extrabold">Mapa de cultivos, plagas y agua</h1>
        <p className="text-sm text-gray-600 mt-1 max-w-2xl">
          Muestra la distribución de los cultivos, los focos de plaga y las fuentes de agua
          registradas en la comunidad. El color del punto de plaga corresponde a su severidad
          y los puntos azules son las fuentes de agua.
        </p>
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex flex-wrap items-center gap-4 mb-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={verCultivos} onChange={(e) => setVerCultivos(e.target.checked)} />
          <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: COLOR_CULTIVO }} />
          Cultivos ({cultivosUbicados.length})
        </label>

        <label className="flex items-center gap-2">
          <input type="checkbox" checked={verPlagas} onChange={(e) => setVerPlagas(e.target.checked)} />
          Plagas ({plagasUbicadas.length})
        </label>

        <label className="flex items-center gap-2">
          <input type="checkbox" checked={verAgua} onChange={(e) => setVerAgua(e.target.checked)} />
          <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: WATER_COLOR }} />
          Fuentes de agua ({aguas.length})
        </label>

        {tiposDePlaga.length > 0 && (
          <select
            value={tipoPlaga}
            onChange={(e) => setTipoPlaga(e.target.value)}
            className="h-9 px-3 rounded-lg border border-gray-300 bg-white"
          >
            <option value="">Todas las plagas</option>
            {tiposDePlaga.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        )}

        <span className="flex items-center gap-3 text-xs text-gray-600">
          {(['baja', 'media', 'alta'] as const).map((s) => (
            <span key={s} className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: SEVERITY_COLOR[s] }} />
              {SEVERITY_LABEL[s]}
            </span>
          ))}
        </span>
      </div>

      {cargando ? (
        <p className="text-gray-500">Cargando mapa…</p>
      ) : (
        <>
          <div className="rounded-2xl border border-gray-200 overflow-hidden">
            <div className="h-[460px]">
              <MapC center={centro} zoom={sinDatos ? 11 : 14} style={{ height: '100%', width: '100%' }}>
                <TL
                  attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {verCultivos && cultivosUbicados.map((c) => (
                  <Punto
                    key={`cultivo-${c.id}`}
                    center={[c.lat as number, c.lng as number]}
                    radius={9}
                    pathOptions={{ color: COLOR_CULTIVO, fillColor: COLOR_CULTIVO, fillOpacity: 0.55, weight: 2 }}
                  >
                    <Globo>
                      <div className="text-sm">
                        <p className="font-semibold">{c.name}</p>
                        <p className="text-gray-600">
                          {c.speciesName ? `${c.speciesName} · ` : ''}{c.type}
                        </p>
                        <p className="text-gray-600">Estado: {c.status}</p>
                        <Link to={`/crops/${c.id}`} className="text-primary-700 underline">Ver ficha</Link>
                      </div>
                    </Globo>
                  </Punto>
                ))}

                {verPlagas && plagasVisibles.map((p) => (
                  <Punto
                    key={`plaga-${p.id}`}
                    center={[p.lat as number, p.lng as number]}
                    radius={p.severity === 'alta' ? 13 : p.severity === 'media' ? 10 : 8}
                    pathOptions={{
                      color: SEVERITY_COLOR[p.severity],
                      fillColor: SEVERITY_COLOR[p.severity],
                      fillOpacity: 0.6,
                      weight: 2,
                    }}
                  >
                    <Globo>
                      <div className="text-sm">
                        <p className="font-semibold">{p.pestType}</p>
                        <p className="text-gray-600">Severidad {SEVERITY_LABEL[p.severity]}</p>
                        <p className="text-gray-600">Detectada el {formatoFecha(p.detectedAt)}</p>
                        {p.cropName && <p className="text-gray-600">Cultivo: {p.cropName}</p>}
                        <Link to={`/plagas/${p.id}/editar`} className="text-primary-700 underline">Ver reporte</Link>
                      </div>
                    </Globo>
                  </Punto>
                ))}

                {verAgua && aguas.map((f) => (
                  <Punto
                    key={`agua-${f.id}`}
                    center={[f.lat, f.lng]}
                    radius={9}
                    pathOptions={{
                      color: WATER_COLOR,
                      fillColor: WATER_COLOR,
                      fillOpacity: 0.55,
                      weight: 2,
                    }}
                  >
                    <Globo>
                      <div className="text-sm">
                        <p className="font-semibold">
                          {WATER_TYPE_ICON[f.sourceType]} {f.name}
                        </p>
                        <p className="text-gray-600">{WATER_TYPE_LABEL[f.sourceType]}</p>
                        <p className="text-gray-600">
                          {f.lat.toFixed(5)}, {f.lng.toFixed(5)}
                        </p>
                        <Link to={`/agua/${f.id}/editar`} className="text-primary-700 underline">
                          Ver fuente
                        </Link>
                      </div>
                    </Globo>
                  </Punto>
                ))}
              </MapC>
            </div>
          </div>

          {sinDatos && (
            <p className="mt-4 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-3">
              Todavía no hay nada ubicado en el mapa. Al registrar un cultivo o reportar una plaga,
              señala el lugar con el selector de ubicación y aparecerá aquí.
            </p>
          )}
        </>
      )}
    </div>
  )
}
