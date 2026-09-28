import { SEVERITY_COLOR, SEVERITY_LABEL, type PestSeverity } from '../../../model/pest'
import type { PlagaPorTipo } from '../services/reportService'

type Props = {
  porTipo: PlagaPorTipo[]
  porSeveridad: Record<PestSeverity, number>
}

const SEVERIDADES: PestSeverity[] = ['baja', 'media', 'alta']

/** Incidencia de plagas por tipo, con el desglose de severidad dentro de cada barra. */
export default function PestSummary({ porTipo, porSeveridad }: Props) {
  if (porTipo.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-8 text-center text-gray-500">
        No hay plagas reportadas todavía.
      </div>
    )
  }

  const totalGeneral = SEVERIDADES.reduce((s, k) => s + porSeveridad[k], 0)
  const maximo = Math.max(...porTipo.map((p) => p.total))

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        {SEVERIDADES.map((s) => (
          <div key={s} className="rounded-xl border border-gray-200 bg-white p-3">
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: SEVERITY_COLOR[s] }} />
              <p className="text-xs text-gray-600">Severidad {SEVERITY_LABEL[s]}</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-1">{porSeveridad[s]}</p>
            {totalGeneral > 0 && (
              <p className="text-xs text-gray-500">
                {Math.round((porSeveridad[s] / totalGeneral) * 100)}% del total
              </p>
            )}
          </div>
        ))}
      </div>

      <ul className="space-y-3">
        {porTipo.map((p) => {
          const ancho = maximo > 0 ? Math.max(6, (p.total / maximo) * 100) : 0
          return (
            <li key={p.tipo}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="font-medium text-gray-900">{p.tipo}</span>
                <span className="text-gray-600">
                  {p.total} {p.total === 1 ? 'reporte' : 'reportes'}
                </span>
              </div>
              <div
                className="mt-1 h-5 rounded-md bg-gray-100 overflow-hidden flex"
                style={{ width: `${ancho}%` }}
                role="img"
                aria-label={`${p.tipo}: ${p.baja} de severidad baja, ${p.media} media, ${p.alta} alta`}
              >
                {SEVERIDADES.map((s) =>
                  p[s] > 0 ? (
                    <div
                      key={s}
                      style={{
                        backgroundColor: SEVERITY_COLOR[s],
                        width: `${(p[s] / p.total) * 100}%`,
                      }}
                      title={`${SEVERITY_LABEL[s]}: ${p[s]}`}
                    />
                  ) : null,
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
