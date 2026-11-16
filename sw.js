// Z93 Hot Sheet service worker. All paths are relative, so it works at / or under /z93-hot-sheet/.
// HTML and JSON: network-first (fresh sheet every morning), cached copy only when offline.
// Icons/manifest: cache-first. Big -audio.json and MP3s are left to the app (IndexedDB) / browser.
const CACHE='z93-hot-sheet-v21';
const SHELL=['./','index.html','z93-hot-sheet.html','manifest.webmanifest','icon.svg','sheets.json','latest-hot-sheet.json','days.json','sponsors.json','countdowns.json','radar-base.svg','z93-logo.png','radar-overlay.svg','apple-touch-icon.png','icon-192.png','icon-512.png','icon-maskable-192.png','icon-maskable-512.png','favicon-32.png'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>Promise.all(SHELL.map(u=>c.add(u).catch(()=>{})))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const url=new URL(e.request.url);
  if(e.request.method!=='GET' || url.origin!==location.origin) return;
  if(/-audio\.json$/.test(url.pathname) || /\.(mp3|m4a|wav|aac|ogg)$/i.test(url.pathname)) return;
  const key=url.origin+url.pathname;               // ignore ?t= cache-busters
  const isFresh = e.request.mode==='navigate' || /\.(json|html)$/.test(url.pathname) || url.pathname.endsWith('/');
  if(isFresh){
    e.respondWith(fetch(e.request).then(r=>{
      if(r.ok){ const c=r.clone(); caches.open(CACHE).then(cc=>cc.put(key,c)); }
      return r;
    }).catch(()=>caches.match(key).then(hit=>hit||new Response('offline',{status:503}))));
    return;
  }
  e.respondWith(caches.match(key).then(hit=>hit||fetch(e.request).then(r=>{
    if(r.ok){ const c=r.clone(); caches.open(CACHE).then(cc=>cc.put(key,c)); } return r; })));
});
