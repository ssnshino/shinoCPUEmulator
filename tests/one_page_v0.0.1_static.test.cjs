'use strict';
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const file=path.join(root,'one_page_shino_z80_core_v0.0.1.html');
const html=fs.readFileSync(file,'utf8');
for(const marker of ['/*__CSS__*/','/*__BUS__*/','/*__CPU__*/','/*__APP__*/']){
  if(html.includes(marker))throw new Error(`unresolved build marker: ${marker}`);
}
for(const id of ['resetBtn','stepBtn','runBtn','pauseBtn','burstBtn','trace','memory','addrLeds','dataLeds','regGrid','selfTest']){
  if(!html.includes(`id="${id}"`))throw new Error(`missing DOM id: ${id}`);
}
if(/<script[^>]+src=|<link[^>]+href=/i.test(html))throw new Error('one-page artifact must not require external runtime files');
console.log(`SHINO Z80 CORE v0.0.1: STATIC ONE-PAGE CHECK PASS (${Buffer.byteLength(html)} bytes)`);
