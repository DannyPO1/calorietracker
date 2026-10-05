const CACHE='calorietracker-current';
const ASSETS=['./','./index.html','./manifest.webmanifest','./favicon-64.png','./apple-touch-icon.png','./icon-192.png','./icon-512.png','./meal-breakfast-food.png','./meal-breakfast-icon.png','./meal-dinner-food.png','./meal-dinner-icon.png','./meal-lunch-food.png','./meal-lunch-icon.png','./meal-snacks-food.png','./meal-snacks-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('calorietracker-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('message',e=>{if(e.data==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r}).catch(()=>cached))) });
