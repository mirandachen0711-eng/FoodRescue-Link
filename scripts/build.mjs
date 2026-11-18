import {build} from 'esbuild';
await build({entryPoints:['src/auth-client.js'],outfile:'public/auth.bundle.js',bundle:true,minify:true,format:'iife',target:['es2022'],legalComments:'none'});
console.log('Built email authentication client.');
