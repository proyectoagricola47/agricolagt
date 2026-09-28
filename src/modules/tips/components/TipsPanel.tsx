import { useEffect, useState } from 'react'
import { consejosParaHoy, type Tip } from '../services/recommendationService'

type Props = {
  /** Alertas ya calculadas por el módulo de clima. */
  alertas: { title: string }[]
  maximo?: number
}

/**
 * Consejos escogidos según el clima vigente y los cultivos del
 * agricultor. Si no hay sesión abierta, muestra los generales.
 */
export default function TipsPanel({ alertas, maximo = 4 }: Props) {
  const [tips, setTips] = useState<Tip[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let vivo = true
    consejosParaHoy(alertas, maximo)
      .then((r) => { if (vivo) { setTips(r); setCargando(false) } })
      .catch((e) => { console.error(e); if (vivo) { setTips([]); setCargando(false) } })
    return () => { vivo = false }
  }, [alertas, maximo])

  if (cargando || tips.length === 0) return null

  return (
    <section className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
      <h2 className="font-bold text-emerald-900 flex items-center gap-2">
        <span aria-hidden>🌾</span> Consejos para hoy
      </h2>
      <p className="text-xs text-emerald-800/80 mt-0.5 mb-3">
        Según el clima de estos días y los cultivos que llevas registrados.
      </p>

      <ul className="space-y-3">
        {tips.map((t) => (
          <li key={t.id} className="rounded-xl bg-white border border-emerald-100 p-3">
            <p className="font-semibold text-gray-900 text-sm">{t.title}</p>
            <p className="text-sm text-gray-700 mt-1">{t.body}</p>
            {t.motivo && <p className="text-xs text-emerald-700 mt-2">{t.motivo}</p>}
          </li>
        ))}
      </ul>
    </section>
  )
}
