import type { RendimientoTemporada } from '../services/reportService'

type Props = {
  datos: RendimientoTemporada[]
}

/**
 * Barras de rendimiento por temporada. Se dibuja con elementos de la
 * propia página y no con una biblioteca de gráficas, para no agregar
 * peso a la aplicación ni depender de archivos externos sin conexión.
 *
 * Las cosechas se agrupan por unidad de medida, porque sumar quintales
 * con cajas daría un número sin sentido.
 */
export default function SeasonChart({ datos }: Props) {
  if (datos.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-8 text-center text-gray-500">
        No hay cosechas registradas todavía. Regístralas desde la ficha de cada cultivo.
      </div>
    )
  }

  const porUnidad = new Map<string, RendimientoTemporada[]>()
  for (const d of datos) {
    porUnidad.set(d.unidad, [...(porUnidad.get(d.unidad) ?? []), d])
  }

  return (
    <div className="space-y-6">
      {Array.from(porUnidad.entries()).map(([unidad, filas]) => {
        const maximo = Math.max(...filas.map((f) => f.total))
        return (
          <div key={unidad}>
            <p className="text-sm font-medium text-gray-700 mb-3">
              Producción en {unidad}
            </p>
            <ul className="space-y-3">
              {filas.map((f) => {
                const ancho = maximo > 0 ? Math.max(4, (f.total / maximo) * 100) : 0
                return (
                  <li key={`${f.temporada}-${f.unidad}`}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="font-medium text-gray-900">{f.temporada}</span>
                      <span className="text-gray-700">
                        {f.total.toLocaleString('es-GT')} {unidad}
                        <span className="text-gray-500 text-xs">
                          {' '}· {f.cosechas} {f.cosechas === 1 ? 'registro' : 'registros'}
                          {f.ingreso > 0 ? ` · Q${f.ingreso.toFixed(2)}` : ''}
                        </span>
                      </span>
                    </div>
                    <div
                      className="mt-1 h-5 rounded-md bg-gray-100 overflow-hidden"
                      role="img"
                      aria-label={`${f.temporada}: ${f.total} ${unidad}`}
                    >
                      <div
                        className="h-full bg-primary-600 rounded-md transition-all"
                        style={{ width: `${ancho}%` }}
                      />
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
