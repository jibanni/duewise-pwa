/* Due₱oint push-only worker: no fetch interception and no changes to app storage. */
self.addEventListener('push', (event) => {
  let payload = {}
  try { payload = event.data ? event.data.json() : {} } catch (_) { /* Use safe defaults */ }
  const title = typeof payload.title === 'string' ? payload.title : 'Due₱oint reminder'
  const body = typeof payload.body === 'string' ? payload.body : 'You have upcoming payments.'
  event.waitUntil(self.registration.showNotification(title, {
    body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: 'duepoint-payment-reminders',
    renotify: false,
    data: { url: '/' },
  }))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil((async () => {
    const target = new URL('/', self.location.origin).href
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    const existing = all.find((client) => client.url.startsWith(self.location.origin))
    if (existing) return existing.focus()
    return self.clients.openWindow(target)
  })())
})
