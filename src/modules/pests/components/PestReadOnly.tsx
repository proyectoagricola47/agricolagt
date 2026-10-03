import { Link } from 'react-router-dom'
import {
  SEVERITY_LABEL,
  SEVERITY_COLOR,
  STATUS_LABEL,
  type PestReport,
} from '../../../model/pest'

/**
 * Ficha de consulta de un reporte de plaga ajeno. El mapa es comunitario,
 * de modo que cualquier agricultor puede ver lo que reportaron los demás,
 * pero solo quien lo creó —o un administrador— puede modificarlo.
 */
export default function PestReadOnly({ reporte }: { reporte: PestReport }) {
  const fecha = reporte.detectedAt
    ? new Date(reporte.detectedAt).toLocaleDateString('es-GT', {
        day: '2-digit', month: 'long', year: 'numeric',
      })
    : '—'

  const datos: { etiqueta: string; valor: string }[] = [
    { etiqueta: 'Plaga o enfermedad', valor: reporte.pestType },
    { etiqueta: 'Cultivo afectado', valor: reporte.cropName || 'Sin asociar a un cultivo' },
    { etiqueta: 'Severidad', valor: SEVERITY_LABEL[reporte.severity] },
    { etiqueta: 'Situación', valor: STATUS_LABEL[reporte.status] },
    { etiqueta: 'Fecha en que se detectó', valor: fecha },
    { etiqueta: 'Lugar', valor: reporte.location || 'No indicado' },
  ]

  return (
    <div className="rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-4">
        <span
          className="inline-block w-3 h-3 rounded-full"
          style={{ backgroundColor: SEVERITY_COLOR[reporte.severity] }}
          aria-hidden
        />
        <p className="text-sm text-gray-600">
          Severidad {SEVERITY_LABEL[reporte.severity].toLowerCase()} · {STATUS_LABEL[reporte.status]}
        </p>
      </div>

      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {datos.map((d) => (
          <div key={d.etiqueta}>
            <dt className="text-sm text-gray-500">{d.etiqueta}</dt>
            <dd className="text-gray-900">{d.valor}</dd>
          </div>
        ))}
      </dl>

      {reporte.treatment && (
        <div className="mt-4">
          <dt className="text-sm text-gray-500">Tratamiento aplicado</dt>
          <dd className="text-gray-900 whitespace-pre-line">{reporte.treatment}</dd>
        </div>
      )}

      {reporte.notes && (
        <div className="mt-4">
          <dt className="text-sm text-gray-500">Notas</dt>
          <dd className="text-gray-900 whitespace-pre-line">{reporte.notes}</dd>
        </div>
      )}

      {reporte.photoUrl && (
        <div className="mt-4">
          <dt className="text-sm text-gray-500 mb-1">Fotografía</dt>
          <img
            src={reporte.photoUrl}
            alt={`Fotografía del reporte de ${reporte.pestType}`}
            className="max-h-72 rounded-lg border border-gray-200"
          />
        </div>
      )}

      <div className="mt-6 flex gap-2">
        <Link to="/mapa" className="px-4 py-2 rounded-lg border">Volver al mapa</Link>
      </div>
    </div>
  )
}
