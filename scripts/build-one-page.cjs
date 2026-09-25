'use strict';
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const source={
  template:'src/app/shino80-workbench-v0.0.2.template.html',
  css:'src/ui/shino80-workbench-v0.0.2.css',
  bus:'src/machine/shino80/shino80-bus.js',
  keyboard:'src/devices/shino80/shino80-keyboard.js',
  flags:'src/cpu/z80/z80-flags.js',
  decoder:'src/cpu/z80/z80-decoder.js',
  cpu:'src/cpu/z80/z80-core.js',
  cgrom:'src/firmware/shino80/shino80-cgrom.js',
  systemRom:'src/firmware/shino80/shino80-system-rom.js',
  video:'src/machine/shino80/shino80-video.js',
  app:'src/app/shino80-workbench-v0.0.2.js'
};
let html=read(source.template)
  .replace('/*__CSS__*/',read(source.css))
  .replace('/*__BUS__*/',read(source.bus))
  .replace('/*__KEYBOARD__*/',read(source.keyboard))
  .replace('/*__FLAGS__*/',read(source.flags))
  .replace('/*__DECODER__*/',read(source.decoder))
  .replace('/*__CPU__*/',read(source.cpu))
  .replace('/*__CGROM__*/',read(source.cgrom))
  .replace('/*__SYSTEM_ROM__*/',read(source.systemRom))
  .replace('/*__VIDEO__*/',read(source.video))
  .replace('/*__APP__*/',read(source.app));
const dir=path.join(root,'deploy');fs.mkdirSync(dir,{recursive:true});
const out=path.join(dir,'one_page_shino80_v0.0.9_z80_base_complete.html');
fs.writeFileSync(out,html);
console.log(`built ${out} (${Buffer.byteLength(html)} bytes)`);
