import { useEffect, useState } from 'react'
import { applySWUpdate, onPWAUpdate } from '../pwa-sw'

export default function PWAUpdateBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    return onPWAUpdate((needs) => setShow(needs))
  }, [])

  if (!show) return null

  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-4 z-50 max-w-[90vw]">
      <div className="flex items-center gap-3 rounded-xl bg-gray-900/90 text-white px-4 py-3 shadow-lg">
        <span className="text-sm">Nueva versión disponible</span>
        <button
          onClick={() => applySWUpdate(true)}
          className="ml-auto inline-flex items-center rounded-lg bg-primary-600 hover:bg-primary-700 px-3 py-1 text-sm"
        >
          Actualizar
        </button>
        <button
          onClick={() => setShow(false)}
          className="inline-flex items-center rounded-lg bg-gray-700 hover:bg-gray-600 px-3 py-1 text-sm"
        >
          Luego
        </button>
      </div>
    </div>
  )
}
