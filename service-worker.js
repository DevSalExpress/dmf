const CACHE_NAME = "pwa-cache-v1";
const urlsToCache = [
    "/solistica_projeto/",
    "/solistica_projeto/index.html",
    "/solistica_projeto/css/styles.css",
    "/solistica_projeto/js/index.js",
    "/solistica_projeto/img/icon-192x192.png",
    "/solistica_projeto/img/icon-512x512.png"
];

// Instala o service worker e faz o cache dos arquivos essenciais
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log("Arquivos em cache");
            return cache.addAll(urlsToCache);
        })
    );
});

// Ativa o service worker e remove caches antigos
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log("Removendo cache antigo:", cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Intercepta as solicitações de rede e responde com os arquivos em cache
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});
