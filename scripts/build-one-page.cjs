'use strict';
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
let html=read('src/app/shino-z80-core-v0.0.1.template.html');
html=html
  .replace('/*__CSS__*/',read('src/ui/shino-z80-panel.css'))
  .replace('/*__BUS__*/',read('src/machine/shino80/shino80-bus.js'))
  .replace('/*__CPU__*/',read('src/cpu/z80/z80-core.js'))
  .replace('/*__APP__*/',read('src/app/shino-z80-core-v0.0.1.js'));
const out=path.join(root,'one_page_shino_z80_core_v0.0.1.html');
fs.writeFileSync(out,html);
console.log(`built ${out} (${Buffer.byteLength(html)} bytes)`);
