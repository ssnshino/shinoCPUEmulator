'use strict';
const fs=require('node:fs'),vm=require('node:vm');
const f='deploy/one_page_shino80_v0.0.3_z80_phase1a.html',h=fs.readFileSync(f,'utf8');
for(const m of ['/*__CSS__*/','/*__BUS__*/','/*__DECODER__*/','/*__CPU__*/','/*__APP__*/'])if(h.includes(m))throw Error('unresolved '+m);
for(const id of ['runPauseBtn','stepBtn','displayInst','regGrid','memoryGrid','busTrace','moreMenu','moreBackdrop','moreCloseBtn','morePaceValue'])if(!h.includes(`id="${id}"`))throw Error('missing '+id);
if(/<script[^>]+src=|<link[^>]+href=/i.test(h))throw Error('external runtime dependency');
if(/\bprompt\s*\(/.test(h))throw Error('browser prompt() must not be used for machine controls');
[...h.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].forEach((m,i)=>new vm.Script(m[1],{filename:'inline-'+i}));
console.log('v0.0.3 artifact static PASS',Buffer.byteLength(h),'bytes');
