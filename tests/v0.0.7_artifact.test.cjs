'use strict';
const fs=require('node:fs'),vm=require('node:vm');
const f='deploy/one_page_shino80_v0.0.7_phase2a_video_ipl.html',h=fs.readFileSync(f,'utf8');
for(const m of ['/*__CSS__*/','/*__BUS__*/','/*__FLAGS__*/','/*__DECODER__*/','/*__CPU__*/','/*__CGROM__*/','/*__SYSTEM_ROM__*/','/*__VIDEO__*/','/*__APP__*/'])if(h.includes(m))throw Error('unresolved '+m);
for(const id of ['crtCanvas','displayPc','displayR','displayT','displayInst','runPauseBtn','stepBtn','moreMenu'])if(!h.includes(`id="${id}"`))throw Error('missing DOM id '+id);
if(!h.includes('PHASE 2A v0.0.7'))throw Error('phase banner missing');
if(/<script[^>]+src=|<link[^>]+href=/i.test(h))throw Error('external runtime dependency');
if(/\bprompt\s*\(/.test(h))throw Error('browser prompt() must not be used');
const scripts=[...h.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
assertCount(scripts.length,8,'inline script count');
scripts.forEach((m,i)=>new vm.Script(m[1],{filename:'inline-'+i}));
if(!h.trimEnd().endsWith('</html>'))throw Error('truncated html');
console.log('v0.0.7 artifact static PASS',Buffer.byteLength(h),'bytes');
function assertCount(actual,expected,label){if(actual!==expected)throw Error(label+': '+actual+' != '+expected);}
