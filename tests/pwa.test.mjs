import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const handlers={};let online=true;
const context={URL,Promise,fetch:async()=>{if(!online)throw Error('Offline');return 'live'},caches:{match:async path=>'cached:'+path},self:{location:{origin:'https://foodrescuelink.org'},addEventListener:(type,fn)=>handlers[type]=fn}};
vm.runInNewContext(readFileSync('public/sw.js','utf8'),context);
async function request(path,mode='cors',method='GET'){let response;handlers.fetch({request:{url:'https://foodrescuelink.org'+path,mode,method},respondWith:p=>response=p});return response}
assert.equal(await request('/browse','navigate'),'live');online=false;
assert.equal(await request('/browse','navigate'),'cached:/offline.html');
assert.equal(await request('/api/public'),undefined);
assert.equal(await request('/auth/config'),undefined);
assert.equal(await request('/api/reservations','cors','POST'),undefined);
assert.equal(await request('/media/foodrescue-demo-en.mp4'),undefined);
const manifest=JSON.parse(readFileSync('public/manifest.webmanifest','utf8'));
assert.equal(manifest.display,'standalone');assert.equal(manifest.start_url,'/browse#food');
for(const icon of manifest.icons)assert.ok(readFileSync('public'+icon.src).length>100);
console.log('Passed: navigation fallback, no API/auth/media caching, manifest and icons.');
