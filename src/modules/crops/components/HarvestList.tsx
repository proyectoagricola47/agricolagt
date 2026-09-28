import { QUALITY_LABEL, type Harvest } from '../../../model/harvest'
import { AREA_UNIT_LABEL, type AreaUnit } from '../../../model/crop'

type Props = {
  items: Harvest[]
  /** Área del cultivo, para calcular el rendimiento por unidad de superficie. */
  area?: number
  areaUnit?: AreaUnit
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

export default function HarvestList({ items, area, areaUnit, onDelete }: Props) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-8 text-center text-gray-500">
        Todavía no hay cosechas registradas para este cultivo.
      </div>
    )
  }

  const mejor = items.reduce((a, b) => (b.quantity > a.quantity ? b : a), items[0])

  return (
    <ul className="space-y-3">
      {items.map((h) => {
        const rendimiento = area && area > 0 ? h.quantity / area : undefined
        return (
          <li key={h.id} className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-gray-900">{h.season}</p>
                  {h.id === mejor.id && items.length > 1 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Mejor temporada
                    </span>
                  )}
                  {h.quality && (
                    <span className="text-xs px-2 py-0.5 rounded-full border border-gray-300 text-gray-600">
                      Calidad {QUALITY_LABEL[h.quality]}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">Cosechada el {formatoFecha(h.harvestDate)}</p>
              </div>

              <div className="text-right">
                <p className="text-xl font-bold text-gray-900">
                  {h.quantity} <span className="text-sm font-normal text-gray-600">{h.unit}</span>
                </p>
                {rendimiento !== undefined && areaUnit && (
                  <p className="text-xs text-gray-500">
                    {rendimiento.toFixed(2)} {h.unit} por {AREA_UNIT_LABEL[areaUnit]}
                  </p>
                )}
              </div>
            </div>

            {h.income != null && (
              <p className="mt-2 text-sm text-gray-700">Ingreso: Q{h.income.toFixed(2)}</p>
            )}
            {h.notes && <p className="mt-1 text-sm text-gray-700">{h.notes}</p>}

            {onDelete && (
              <div className="mt-2 flex justify-end">
                <button
                  onClick={() => onDelete(h.id)}
                  className="text-xs text-gray-500 hover:text-red-600 underline"
                >
                  Eliminar
                </button>
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
