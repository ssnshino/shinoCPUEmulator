'use strict';

const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

const source={
  template:'src/app/shino80-workbench-v0.0.2.template.html',
  css:'src/ui/shino80-workbench-v0.0.2.css',
  bus:'src/machine/shino80/shino80-bus.js',
  cpu:'src/cpu/z80/z80-core.js',
  app:'src/app/shino80-workbench-v0.0.2.js'
};

const deployDir=path.join(root,'deploy');
const outputName='one_page_shino80_v0.0.2_ui_foundation.html';
const outputPath=path.join(deployDir,outputName);

let html=read(source.template);
html=html
  .replace('/*__CSS__*/',read(source.css))
  .replace('/*__BUS__*/',read(source.bus))
  .replace('/*__CPU__*/',read(source.cpu))
  .replace('/*__APP__*/',read(source.app));

fs.mkdirSync(deployDir,{recursive:true});
fs.writeFileSync(outputPath,html);

console.log(`built deploy/${outputName} (${Buffer.byteLength(html)} bytes)`);
