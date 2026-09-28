import {
  SEVERITY_COLOR,
  SEVERITY_LABEL,
  STATUS_LABEL,
  type PestReport,
} from '../../../model/pest'

type Props = {
  report: PestReport
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

function formatoFecha(iso: string): string {
  if (!iso) return ''
  try {
    return new Date(`${iso}T00:00:00`).toLocaleDateString('es-GT', {
      day: '2-digit', month: 'long', year: 'numeric',
    })
  } catch {
    return iso
  }
}

const ESTILO_SITUACION: Record<string, string> = {
  activa: 'bg-red-50 text-red-700 border-red-200',
  controlada: 'bg-amber-50 text-amber-700 border-amber-200',
  erradicada: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

export default function PestCard({ report, onEdit, onDelete }: Props) {
  const color = SEVERITY_COLOR[report.severity]

  return (
    <article className="rounded-xl border border-gray-200 bg-white overflow-hidden flex flex-col">
      {report.photoUrl && (
        <img
          src={report.photoUrl}
          alt={`Fotografía de ${report.pestType}`}
          className="w-full h-40 object-cover"
          loading="lazy"
        />
      )}

      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-gray-900 leading-snug">{report.pestType}</h3>
          <span
            className="shrink-0 text-xs px-2 py-0.5 rounded-full text-white font-medium"
            style={{ backgroundColor: color }}
            title={`Severidad ${SEVERITY_LABEL[report.severity]}`}
          >
            {SEVERITY_LABEL[report.severity]}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <span className={`px-2 py-0.5 rounded-full border ${ESTILO_SITUACION[report.status] ?? 'border-gray-300 text-gray-600'}`}>
            {STATUS_LABEL[report.status]}
          </span>
          {report.cropName && (
            <span className="px-2 py-0.5 rounded-full border border-gray-300 text-gray-600">
              🌱 {report.cropName}
            </span>
          )}
          {report.lat != null && report.lng != null && (
            <span className="px-2 py-0.5 rounded-full border border-gray-300 text-gray-600">
              📍 Ubicada
            </span>
          )}
        </div>

        <p className="text-sm text-gray-600">Detectada el {formatoFecha(report.detectedAt)}</p>

        {report.location && <p className="text-sm text-gray-600">{report.location}</p>}

        {report.treatment && (
          <p className="text-sm text-gray-700">
            <span className="text-gray-500">Tratamiento: </span>{report.treatment}
          </p>
        )}

        {report.notes && <p className="text-sm text-gray-700 line-clamp-3">{report.notes}</p>}

        {(onEdit || onDelete) && (
          <div className="mt-auto pt-3 border-t border-gray-100 flex justify-end gap-2 text-sm">
            {onEdit && (
              <button
                onClick={() => onEdit(report.id)}
                className="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50"
              >
                Editar
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(report.id)}
                className="px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50"
              >
                Eliminar
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  )
}
