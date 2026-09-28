import { ACTIVITY_ICON, ACTIVITY_LABEL, type CropActivity } from '../../../model/activity'

type Props = {
  items: CropActivity[]
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

/** Bitácora del cultivo en orden cronológico inverso. */
export default function ActivityTimeline({ items, onDelete }: Props) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-8 text-center text-gray-500">
        Todavía no hay labores registradas para este cultivo.
      </div>
    )
  }

  return (
    <ol className="relative border-l-2 border-gray-200 ml-3 space-y-5">
      {items.map((a) => (
        <li key={a.id} className="ml-5">
          <span
            className="absolute -left-[13px] grid place-items-center w-6 h-6 rounded-full bg-white border-2 border-gray-200 text-xs"
            aria-hidden
          >
            {ACTIVITY_ICON[a.activityType]}
          </span>

          <div className="rounded-xl border border-gray-200 bg-white p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-gray-900">{ACTIVITY_LABEL[a.activityType]}</p>
                <p className="text-xs text-gray-500">{formatoFecha(a.performedAt)}</p>
              </div>
              {onDelete && (
                <button
                  onClick={() => onDelete(a.id)}
                  className="text-xs text-gray-500 hover:text-red-600 underline whitespace-nowrap"
                >
                  Eliminar
                </button>
              )}
            </div>

            {(a.inputName || a.quantity != null) && (
              <p className="mt-2 text-sm text-gray-700">
                {a.inputName}
                {a.quantity != null && (
                  <span className="text-gray-600">
                    {a.inputName ? ' · ' : ''}{a.quantity}{a.unit ? ` ${a.unit}` : ''}
                  </span>
                )}
              </p>
            )}

            {a.cost != null && (
              <p className="text-sm text-gray-600">Costo: Q{a.cost.toFixed(2)}</p>
            )}

            {a.notes && <p className="mt-1 text-sm text-gray-700">{a.notes}</p>}
          </div>
        </li>
      ))}
    </ol>
  )
}
