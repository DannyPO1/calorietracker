const CACHE='calorietracker-6.0.3';
const ASSETS=[
  './',
  './index.html',
  './manifest.webmanifest',
  './favicon-64.png',
  './apple-touch-icon.png',
  './icon-192.png',
  './icon-512.png',
  './meal-breakfast-food.png',
  './meal-breakfast-icon.png',
  './meal-dinner-food.png',
  './meal-dinner-icon.png',
  './meal-lunch-food.png',
  './meal-lunch-icon.png',
  './meal-snacks-food.png',
  './meal-snacks-icon.png'
];

self.addEventListener('install', event=>{
  event.waitUntil(
    caches.open(CACHE)
      .then(cache=>cache.addAll(ASSETS))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate', event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(
        keys
          .filter(key=>key.startsWith('calorietracker-') && key!==CACHE)
          .map(key=>caches.delete(key))
      ))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('message', event=>{
  if(event.data==='SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event=>{
  if(event.request.method!=='GET') return;

  const url=new URL(event.request.url);
  const sameOrigin=url.origin===self.location.origin;
  const isAppDocument=sameOrigin && (
    url.pathname.endsWith('/') ||
    url.pathname.endsWith('/index.html')
  );
  const isUpdateCheck=sameOrigin && url.searchParams.has('updateCheck');

  // Always go to the network first for the HTML document and explicit
  // version checks. This prevents an old cached index.html from masking
  // a newly deployed GitHub Pages release.
  if(isAppDocument || isUpdateCheck){
    event.respondWith(
      fetch(event.request,{cache:'no-store'})
        .then(response=>{
          if(response && response.ok){
            const copy=response.clone();
            caches.open(CACHE)
              .then(cache=>cache.put('./index.html',copy))
              .catch(()=>{});
          }
          return response;
        })
        .catch(()=>{
          return caches.match(event.request)
            .then(cached=>cached || caches.match('./index.html'));
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cached=>{
        if(cached) return cached;
        return fetch(event.request)
          .then(response=>{
            if(response && response.ok){
              const copy=response.clone();
              caches.open(CACHE)
                .then(cache=>cache.put(event.request,copy))
                .catch(()=>{});
            }
            return response;
          })
          .catch(()=>cached);
      })
  );
});
