import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import WaterForm from '../components/WaterForm'
import { waterService } from '../services/waterService'
import { useAuth } from '../../../context/AuthContext'
import { getMyProfile } from '../../users/services/userService'
import {
  WATER_TYPE_LABEL,
  WATER_TYPE_ICON,
  type WaterSource,
  type WaterSourceInput,
} from '../../../model/water'

export default function WaterUpsertPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuth()
  const [initial, setInitial] = useState<WaterSource | undefined>()
  const [esAdministrador, setEsAdministrador] = useState(false)
  const [cargando, setCargando] = useState(Boolean(id))
  const [error, setError] = useState('')

  useEffect(() => {
    let vivo = true
    if (!id) return
    waterService
      .get(id)
      .then((r) => { if (vivo) { setInitial(r); setCargando(false) } })
      .catch((e) => { console.error(e); if (vivo) setCargando(false) })
    return () => { vivo = false }
  }, [id])

  useEffect(() => {
    let vivo = true
    if (!user?.id) { setEsAdministrador(false); return }
    getMyProfile()
      .then((p) => { if (vivo) setEsAdministrador(p?.role === 'admin') })
      .catch(() => { if (vivo) setEsAdministrador(false) })
    return () => { vivo = false }
  }, [user?.id])

  async function handleSubmit(data: WaterSourceInput) {
    setError('')
    if (id) {
      const guardado = await waterService.update(id, data)
      if (!guardado) {
        setError('No se pudo guardar: esta fuente la registró otro agricultor.')
        return
      }
    } else {
      await waterService.create(data)
    }
    navigate('/agua')
  }

  if (cargando) return <p className="text-gray-500">Cargando…</p>

  if (id && !initial) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-1">Fuente de agua</h1>
        <p className="text-gray-600">No se encontró la fuente que buscas.</p>
      </div>
    )
  }

  const esAjena = Boolean(id && initial && user?.id && initial.userId !== user.id)
  const soloLectura = esAjena && !esAdministrador

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">
        {!id ? 'Registrar una fuente de agua' : soloLectura ? 'Fuente de agua' : 'Editar fuente de agua'}
      </h1>
      <p className="text-sm text-gray-600 mb-5 max-w-2xl">
        {soloLectura
          ? 'Esta fuente la registró otro agricultor de la comunidad. Puedes consultarla, pero solo quien la registró puede modificarla.'
          : 'Señala dónde está la fuente de agua que conoces. Aparecerá como un punto azul en el mapa de la comunidad.'}
      </p>

      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {soloLectura && initial ? (
        <div className="rounded-xl border border-gray-200 p-4">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm text-gray-500">Nombre</dt>
              <dd className="text-gray-900">{initial.name}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Tipo de fuente</dt>
              <dd className="text-gray-900">
                {WATER_TYPE_ICON[initial.sourceType]} {WATER_TYPE_LABEL[initial.sourceType]}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Ubicación</dt>
              <dd className="text-gray-900">
                {initial.lat.toFixed(5)}, {initial.lng.toFixed(5)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Registrada el</dt>
              <dd className="text-gray-900">
                {new Date(initial.createdAt).toLocaleDateString('es-GT', {
                  day: '2-digit', month: 'long', year: 'numeric',
                })}
              </dd>
            </div>
          </dl>
          <div className="mt-6">
            <Link to="/mapa" className="px-4 py-2 rounded-lg border">Volver al mapa</Link>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 p-4">
          <WaterForm initial={initial} onSubmit={handleSubmit} onCancel={() => navigate('/agua')} />
        </div>
      )}
    </div>
  )
}
