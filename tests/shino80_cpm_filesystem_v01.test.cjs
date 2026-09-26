'use strict';

const assert=require('node:assert/strict');
const {Shino80Memory,MEMORY_CONTROL_LOW_RAM}=require('../src/machine/shino80/shino80-memory.js');
const {Shino80Bus}=require('../src/machine/shino80/shino80-bus.js');
const {Shino80Keyboard}=require('../src/devices/shino80/shino80-keyboard.js');
const {Shino80BlockDevice,createBlankBlockImage,BLOCK_IMAGE_SIZE,BLOCK_BLANK_BYTE}=require('../src/devices/shino80/shino80-block-device.js');
const {Z80Core}=require('../src/cpu/z80/z80-core.js');
const filesystem=require('../src/firmware/shino80/shino80-cpm-filesystem.js');
const starter=require('../src/firmware/shino80/shino80-cpm-starter-files.js');
const {buildSystemDisk}=require('../src/firmware/shino80/shino80-system-disk.js');
const {buildSystemRom,TEXT_VRAM_BASE}=require('../src/firmware/shino80/shino80-system-rom.js');
const cbios=require('../src/firmware/shino80/shino80-cbios.js').buildCbios();

assert.equal(filesystem.CPM_BLOCK_SIZE,1024);assert.equal(filesystem.CPM_DIRECTORY_ENTRIES,64);
assert.equal(filesystem.CPM_DIRECTORY_BLOCKS,2);assert.equal(filesystem.CPM_FIRST_DATA_BLOCK,2);
assert.equal(filesystem.CPM_TOTAL_BLOCKS,243);assert.equal(filesystem.CPM_FILESYSTEM_OFFSET,6656);
assert.deepEqual(filesystem.normalizeName('welcome.txt'),{name:'WELCOME',extension:'TXT',full:'WELCOME.TXT'});
for(const name of ['', 'TOO-LONG9.TXT','OK.LONG','BAD?.TXT','A.B.C'])assert.throws(()=>filesystem.normalizeName(name));

// Packing preserves system tracks, owns blocks once and supports multiple extents.
{
  const blank=createBlankBlockImage();blank.fill(0x5A,0,filesystem.CPM_FILESYSTEM_OFFSET);
  const large=Uint8Array.from({length:16385},(_,index)=>index&255);
  const volume=filesystem.buildFilesystem(blank,[{name:'BIG.BIN',bytes:large,padding:0}]);
  assert(volume.image.slice(0,filesystem.CPM_FILESYSTEM_OFFSET).every(byte=>byte===0x5A));
  const entries=filesystem.readDirectory(volume.image);assert.equal(entries.length,2);
  assert.deepEqual(entries.map(entry=>[entry.name,entry.extent,entry.records]),[['BIG.BIN',0,128],['BIG.BIN',1,1]]);
  assert.deepEqual(entries[0].blocks,Array.from({length:16},(_,index)=>index+2));assert.deepEqual(entries[1].blocks,[18]);
  assert.deepEqual(volume.image.slice(filesystem.dataOffset(2),filesystem.dataOffset(2)+large.length),large);
  assert.equal(volume.image[filesystem.dataOffset(18)+1],0);
  assert.equal(volume.image[filesystem.CPM_FILESYSTEM_OFFSET+64],BLOCK_BLANK_BYTE);
  assert.throws(()=>filesystem.buildFilesystem(blank,[{name:'A.TXT',bytes:[]},{name:'a.txt',bytes:[]}]));
  assert.throws(()=>filesystem.buildFilesystem(blank,[{name:'A.TXT',bytes:[],user:16}]));
  assert.throws(()=>filesystem.buildFilesystem(blank,Array.from({length:65},(_,index)=>({name:`F${String(index).padStart(7,'0')}.BIN`,bytes:[]}))),/directory is full/);
  assert.throws(()=>filesystem.buildFilesystem(blank,[{name:'FULL.BIN',bytes:new Uint8Array((filesystem.CPM_TOTAL_BLOCKS-filesystem.CPM_FIRST_DATA_BLOCK)*filesystem.CPM_BLOCK_SIZE+1)}]),/disk is full/);
  assert.throws(()=>filesystem.buildFilesystem(new Uint8Array(1),[]));
}

const systemDisk=buildSystemDisk(),rom=buildSystemRom();
assert.deepEqual(buildSystemDisk().image,systemDisk.image,'deterministic starter disk');
assert.equal(systemDisk.image.length,BLOCK_IMAGE_SIZE);assert.equal(systemDisk.meta.fileCount,3);
assert.deepEqual(systemDisk.files.map(file=>[file.name,file.records,file.blocks]),[
  ['WELCOME.TXT',2,[2]],['HELLO.COM',1,[3]],['S80INFO.COM',1,[4]]
]);
assert.deepEqual(filesystem.readDirectory(systemDisk.image).map(entry=>entry.name),['WELCOME.TXT','HELLO.COM','S80INFO.COM']);
const starterByName=Object.fromEntries(starter.buildStarterFiles().map(file=>[file.name,file.bytes]));
for(const file of systemDisk.files){
  const offset=filesystem.dataOffset(file.blocks[0]);
  assert.deepEqual(systemDisk.image.slice(offset,offset+starterByName[file.name].length),starterByName[file.name]);
}

function machine(){
  const keyboard=new Shino80Keyboard({capacity:256}),disk=new Shino80BlockDevice({image:systemDisk.image});
  const memory=new Shino80Memory();memory.loadFirmware(rom.bytes);
  const bus=new Shino80Bus({traceLimit:300000,memoryDevice:memory,ioDevices:[keyboard,disk]});
  const cpu=new Z80Core(bus);cpu.reset();return {keyboard,disk,memory,bus,cpu};
}
function until(m,predicate,limit=4000000){let count=0;while(!predicate()&&count++<limit)m.cpu.step();assert(count<limit,`CP/M filesystem timeout PC=${m.cpu.state.pc.toString(16)}`);}
function input(m,text){for(const char of text)m.keyboard.enqueueByte(char.charCodeAt(0));}
function screen(m){return String.fromCharCode(...m.memory.ram.slice(TEXT_VRAM_BASE,TEXT_VRAM_BASE+2000)).replaceAll('\0',' ');}
function command(m,text){input(m,text+'\r');m.cpu.step();until(m,()=>m.keyboard.depth===0&&m.cpu.state.pc===cbios.labels.CBIOS_CONIN_WAIT);}
function boot(m){m.cpu.runInstructions(rom.meta.instructionsBeforeLoop);input(m,'O\r');until(m,()=>m.cpu.state.pc===cbios.labels.CBIOS_CONIN_WAIT&&screen(m).includes('A>'));}

// The actual CCP/BDOS reads and executes every starter file through CBIOS.
{
  const m=machine();boot(m);assert.equal(m.memory.control,MEMORY_CONTROL_LOW_RAM);
  command(m,'DIR');assert.match(screen(m),/WELCOME\s+TXT/);assert.match(screen(m),/HELLO\s+COM/);assert.match(screen(m),/S80INFO\s+COM/);
  command(m,'TYPE WELCOMX\bE.TXT');assert.match(screen(m),/SHINO-80 CP\/M 2\.2 STARTER DISK/);assert.match(screen(m),/DIR  TYPE  ERA  REN  SAVE  USER/);
  command(m,'HELLO');assert.match(screen(m),/HELLO FROM SHINO-80!/);
  command(m,'S80INFO');assert.match(screen(m),/44K TPA \/ 243K A: \/ CBIOS FA00H/);

  // CCP SAVE writes directory/data records through CBIOS and the file survives WBOOT.
  m.bus.clearTrace();command(m,'SAVE 1 COPY.COM');
  assert(m.bus.trace.filter(event=>event.space==='IO'&&event.operation==='WRITE'&&(event.address&255)===0x31&&event.data===2).length>=2);
  assert(filesystem.readDirectory(m.disk.exportImage()).some(entry=>entry.name==='COPY.COM'&&entry.records===2));
  Object.assign(m.cpu.state,{pc:0,halted:false});until(m,()=>m.cpu.state.pc===cbios.labels.CBIOS_CONIN_WAIT&&screen(m).includes('A>'));
  command(m,'DIR');assert.match(screen(m),/COPY\s+COM/);command(m,'COPY');assert.match(screen(m),/SHINO-80 \/ CP\/M 2\.2/);
  command(m,'ERA COPY.COM');assert(!filesystem.readDirectory(m.disk.exportImage()).some(entry=>entry.name==='COPY.COM'));
}

console.log('SHINO-80 CP/M FILESYSTEM v0.1: 8.3 DIRECTORY + EXTENTS + STARTER FILES + SAVE/WBOOT PASS');
