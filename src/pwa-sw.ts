import { registerSW } from 'virtual:pwa-register'

type Listener = (needsRefresh: boolean) => void
let listeners: Listener[] = []

export function onPWAUpdate(listener: Listener) {
  listeners.push(listener)
  return () => {
    listeners = listeners.filter((l) => l !== listener)
  }
}

function notify(needs: boolean) {
  for (const l of listeners) l(needs)
}

// La función devuelta permite forzar el reload aplicando la nueva versión del SW
export const applySWUpdate = registerSW({
  immediate: true,
  onNeedRefresh() {
    notify(true)
  },
  onOfflineReady() {
    // podemos notificar si queremos mostrar un toast de "Listo para usar offline"
  },
})
