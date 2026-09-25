'use strict';
const fs=require('node:fs'),vm=require('node:vm');
for(const f of [
  'src/machine/shino80/shino80-bus.js',
  'src/devices/shino80/shino80-keyboard.js',
  'src/cpu/z80/z80-flags.js',
  'src/cpu/z80/z80-decoder.js',
  'src/cpu/z80/z80-core.js',
  'src/firmware/shino80/shino80-cgrom.js',
  'src/firmware/shino80/shino80-system-rom.js',
  'src/machine/shino80/shino80-video.js',
  'src/app/shino80-workbench-v0.0.2.js',
  'src/app/shino80-execution-pace.js'
])new vm.Script(fs.readFileSync(f,'utf8'),{filename:f});
console.log('v0.0.9 source syntax PASS');
