// Z93 Hot Sheet service worker. All paths are relative, so it works at / or under /z93-hot-sheet/.
// HTML and JSON: network-first with no-store (bypass GitHub Pages max-age=600), cached copy only when offline.
// Icons/manifest: cache-first. Big -audio.json and MP3s are left to the app (IndexedDB) / browser.
const CACHE='z93-hot-sheet-v59k';
const SHELL=['./','index.html','z93-hot-sheet.html','manifest.webmanifest','icon.svg','sheets.json','latest-hot-sheet.json','days.json','sponsors.json','countdowns.json','station-reads.json','giveaways.json','guests.json','ticker.json','pools.json','songs.json','station.json','song-db.json','curation.json','scores-context.json','events.json','concerts.json','tours.json','radar-base.svg','z93-logo.png','radar-overlay.svg','apple-touch-icon.png','icon-192.png','icon-512.png','icon-maskable-192.png','icon-maskable-512.png','favicon-32.png'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>Promise.all(SHELL.map(u=>c.add(u).catch(()=>{})))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('message',e=>{ if(e.data && e.data.type==='SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('fetch',e=>{
  const url=new URL(e.request.url);
  if(e.request.method!=='GET' || url.origin!==location.origin) return;
  // Never intercept audio/media or HTTP Range requests. A cached 206 stalls mid-clip
  // on Android Chrome. The app preloads complete files and plays them from a blob.
  const dest=e.request.destination;
  const accept=(e.request.headers.get('accept')||'').toLowerCase();
  const isAudio=dest==='audio'||dest==='video'||accept.includes('audio/')||/\.(mp3|m4a|wav|aac|ogg)$/i.test(url.pathname);
  const isRange=e.request.headers.has('Range')||e.request.headers.has('range');
  if(isAudio || isRange || /-audio\.json$/.test(url.pathname)) return;
  const key=url.origin+url.pathname;               // ignore ?t= cache-busters
  const isFresh = e.request.mode==='navigate' || /\.(json|html)$/.test(url.pathname) || url.pathname.endsWith('/');
  if(isFresh){
    e.respondWith(fetch(e.request, {cache:'no-store'}).then(r=>{
      if(r.ok){ const c=r.clone(); caches.open(CACHE).then(cc=>cc.put(key,c)); }
      return r;
    }).catch(()=>caches.match(key).then(hit=>hit||new Response('offline',{status:503}))));
    return;
  }
  e.respondWith(caches.match(key).then(hit=>hit||fetch(e.request).then(r=>{
    if(r.ok){ const c=r.clone(); caches.open(CACHE).then(cc=>cc.put(key,c)); } return r; })));
});
