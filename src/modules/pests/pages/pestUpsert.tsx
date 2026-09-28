import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PestForm from '../components/PestForm'
import { pestService } from '../services/pestService'
import type { PestReport, PestReportInput } from '../../../model/pest'

export default function PestUpsertPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [initial, setInitial] = useState<PestReport | undefined>()
  const [cargando, setCargando] = useState(Boolean(id))

  useEffect(() => {
    let vivo = true
    if (!id) return
    pestService
      .get(id)
      .then((r) => { if (vivo) { setInitial(r); setCargando(false) } })
      .catch((e) => { console.error(e); if (vivo) setCargando(false) })
    return () => { vivo = false }
  }, [id])

  async function handleSubmit(data: PestReportInput) {
    if (id) await pestService.update(id, data)
    else await pestService.create(data)
    navigate('/plagas')
  }

  if (cargando) return <p className="text-gray-500">Cargando…</p>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">
        {id ? 'Editar reporte de plaga' : 'Reportar una plaga'}
      </h1>
      <p className="text-sm text-gray-600 mb-5 max-w-2xl">
        Registra la plaga o enfermedad que encontraste, su severidad y el lugar.
        Los reportes ubicados en el mapa alimentan el mapa de distribución.
      </p>

      <div className="rounded-xl border border-gray-200 p-4">
        <PestForm initial={initial} onSubmit={handleSubmit} onCancel={() => navigate('/plagas')} />
      </div>
    </div>
  )
}
