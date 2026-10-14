// Service worker for the installable MAGO app. It deliberately caches nothing: every request goes to
// the network, so prices, stock and the cart are always current. Its presence makes the site installable.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {
  // Network passthrough (no respondWith): the browser handles the request normally.
});
