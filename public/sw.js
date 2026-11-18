const CACHE='foodrescue-offline-v1';
const OFFLINE=['/offline.html','/pwa.css'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(OFFLINE))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('foodrescue-offline-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin)return;
 // Never cache live inventory, account data, authentication or reservations.
 if(request.mode==='navigate')event.respondWith(fetch(request).catch(()=>caches.match('/offline.html')));
 else if(OFFLINE.includes(url.pathname))event.respondWith(fetch(request).catch(()=>caches.match(url.pathname)));
});
