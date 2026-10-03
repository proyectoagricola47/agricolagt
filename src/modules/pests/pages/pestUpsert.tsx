import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PestForm from '../components/PestForm'
import PestReadOnly from '../components/PestReadOnly'
import { pestService } from '../services/pestService'
import { useAuth } from '../../../context/AuthContext'
import { getMyProfile } from '../../users/services/userService'
import type { PestReport, PestReportInput } from '../../../model/pest'

export default function PestUpsertPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuth()
  const [initial, setInitial] = useState<PestReport | undefined>()
  const [esAdministrador, setEsAdministrador] = useState(false)
  const [cargando, setCargando] = useState(Boolean(id))
  const [error, setError] = useState('')

  useEffect(() => {
    let vivo = true
    if (!id) return
    pestService
      .get(id)
      .then((r) => { if (vivo) { setInitial(r); setCargando(false) } })
      .catch((e) => { console.error(e); if (vivo) setCargando(false) })
    return () => { vivo = false }
  }, [id])

  // El administrador puede corregir cualquier reporte de la comunidad.
  useEffect(() => {
    let vivo = true
    if (!user?.id) { setEsAdministrador(false); return }
    getMyProfile()
      .then((p) => { if (vivo) setEsAdministrador(p?.role === 'admin') })
      .catch(() => { if (vivo) setEsAdministrador(false) })
    return () => { vivo = false }
  }, [user?.id])

  async function handleSubmit(data: PestReportInput) {
    setError('')
    try {
      if (id) {
        const guardado = await pestService.update(id, data)
        // La base de datos solo deja modificar los reportes propios. Si no
        // devuelve la fila, el cambio no se aplicó y no hay que fingir que sí.
        if (!guardado) {
          setError('No se pudo guardar: este reporte pertenece a otro agricultor.')
          return
        }
      } else {
        await pestService.create(data)
      }
      navigate('/plagas')
    } catch (e) {
      console.error(e)
      setError('No se pudo guardar el reporte. Intenta de nuevo.')
    }
  }

  if (cargando) return <p className="text-gray-500">Cargando…</p>

  // Un reporte ajeno se consulta, no se edita.
  const esAjeno = Boolean(id && initial && user?.id && initial.userId !== user.id)
  const soloLectura = esAjeno && !esAdministrador

  if (id && !initial) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-1">Reporte de plaga</h1>
        <p className="text-gray-600">No se encontró el reporte que buscas.</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">
        {!id ? 'Reportar una plaga' : soloLectura ? 'Reporte de plaga' : 'Editar reporte de plaga'}
      </h1>
      <p className="text-sm text-gray-600 mb-5 max-w-2xl">
        {soloLectura
          ? 'Este reporte lo registró otro agricultor de la comunidad. Puedes consultarlo, pero solo quien lo creó puede modificarlo.'
          : 'Registra la plaga o enfermedad que encontraste, su severidad y el lugar. Los reportes ubicados en el mapa alimentan el mapa de distribución.'}
      </p>

      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {soloLectura ? (
        <PestReadOnly reporte={initial as PestReport} />
      ) : (
        <div className="rounded-xl border border-gray-200 p-4">
          <PestForm initial={initial} onSubmit={handleSubmit} onCancel={() => navigate('/plagas')} />
        </div>
      )}
    </div>
  )
}
