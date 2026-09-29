/*
 * Recepción de notificaciones enviadas desde el proceso programado.
 *
 * Este archivo se añade al trabajador de servicio que genera la herramienta de
 * compilación. Se ejecuta aunque la aplicación esté cerrada, que es lo que
 * permite que el agricultor reciba el aviso con el teléfono guardado.
 */

self.addEventListener('push', function (evento) {
  let datos = {}
  try {
    datos = evento.data ? evento.data.json() : {}
  } catch (e) {
    datos = { title: 'AgrícolaGT', body: evento.data ? evento.data.text() : '' }
  }

  const titulo = datos.title || 'AgrícolaGT'
  const opciones = {
    body: datos.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: datos.tag || titulo,
    renotify: true,
    data: { url: datos.url || '/notificaciones' },
  }

  evento.waitUntil(self.registration.showNotification(titulo, opciones))
})

self.addEventListener('notificationclick', function (evento) {
  evento.notification.close()
  const destino = (evento.notification.data && evento.notification.data.url) || '/notificaciones'

  evento.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (ventanas) {
      for (const ventana of ventanas) {
        if ('focus' in ventana) {
          ventana.navigate(destino)
          return ventana.focus()
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(destino)
    }),
  )
})
