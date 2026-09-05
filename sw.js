/* Multipay — service worker : l'application reste utilisable hors connexion.
   À chaque nouvelle version du fichier index.html, changez le numéro ci-dessous. */
const VERSION = 'multipay-v31';
const FICHIERS = [
  './', './index.html', './manifest.webmanifest',
  './icon-192.png', './icon-512.png', './icon-maskable-512.png',
  './apple-touch-icon.png', './favicon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FICHIERS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Les appels au script Google ne sont jamais mis en cache : ils doivent toujours partir sur le réseau.
  if (url.hostname.indexOf('google') !== -1) return;
  if (e.request.method !== 'GET') return;

  // Réseau d'abord pour la page elle-même, cache en secours.
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then(r => {
        const copie = r.clone();
        caches.open(VERSION).then(c => c.put(e.request, copie));
        return r;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
