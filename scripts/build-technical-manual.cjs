'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const dec=require('../src/cpu/z80/z80-decoder.js'),{describe}=require('../src/manual/instruction-notes.cjs');
const {Shino80Bus}=require('../src/machine/shino80/shino80-bus.js');
const {Z80Core}=require('../src/cpu/z80/z80-core.js');
const rom=require('../src/firmware/shino80/shino80-system-rom.js'),cg=require('../src/firmware/shino80/shino80-cgrom.js');
const memory=require('../src/machine/shino80/shino80-memory.js');
const video=require('../src/machine/shino80/shino80-video.js'),keyboard=require('../src/devices/shino80/shino80-keyboard.js');
const block=require('../src/devices/shino80/shino80-block-device.js');
const cbios=require('../src/firmware/shino80/shino80-cbios.js');
const systemDisk=require('../src/firmware/shino80/shino80-system-disk.js');
const hex=v=>v.toString(16).toUpperCase().padStart(2,'0');
const families=['BASE','CB','ED','DD','FD','DDCB','FDCB'];
function classify(d,f,op){
 if(f==='ED')return [0x63,0x6B].includes(op)?'alias':d.classification==='defined'?'official':d.classification;
 if(f==='DD'||f==='FD')return !d.affected?'ignored':/I[XY][HL]/.test(d.mnemonic)?'undocumented':'official';
 if(f==='DDCB'||f==='FDCB')return d.kind==='CB_BIT'&&d.targetCode!==6?'alias':d.targetCode!==6||d.rotate==='SLL'&&d.kind==='CB_ROTATE'?'undocumented':'official';
 return d.kind==='CB_ROTATE'&&d.rotate==='SLL'?'undocumented':'official';
}
function pattern(d,f,op){
 let bytes=f==='BASE'?[hex(op)]:f==='DDCB'||f==='FDCB'?[f.slice(0,2),'CB','d',hex(op)]:[f,hex(op)];
 if(d.indexedMemory)bytes.push('d');
 if(/\bnn\b/.test(d.mnemonic))bytes.push('lo','hi');
 else if(/\bn\b/.test(d.mnemonic))bytes.push('n');
 else if(/\be\b/.test(d.mnemonic))bytes.push('e');
 if(bytes.length!==d.length)throw Error(`Encoding length ${f} ${op} ${bytes}`);
 return bytes;
}
function example(tokens){
 const bytes=tokens.map(t=>({n:0x42,d:2,e:2,lo:0,hi:0x40})[t]??parseInt(t,16));
 const bus=new Shino80Bus({traceLimit:64}),cpu=new Z80Core(bus);
 Object.assign(cpu.state,{pc:0x2000,sp:0x9000,a:0x42,f:1,b:2,c:0x10,d:0x50,e:0,h:0x40,l:0,ix:0x4000,iy:0x4000,i:0x80,r:0,iff1:true,iff2:true});
 bus.load(bytes,0x2000);bus.load([0x81,0x28,0x55],0x4000);bus.load([0x34,0x12],0x9000);bus.clearTrace();
 const before={...cpu.state},memory=bus.memory.slice(),instruction=cpu.step();
 const keys=['a','f','b','c','d','e','h','l','aAlt','fAlt','bAlt','cAlt','dAlt','eAlt','hAlt','lAlt','ix','iy','pc','sp','i','r','iff1','iff2','im','eiDelay','halted','wz','q','p'];
 return {bytes,mnemonic:instruction.mnemonic,tStates:instruction.tStates,
  before:Object.fromEntries(keys.map(k=>[k,before[k]])),after:Object.fromEntries(keys.map(k=>[k,cpu.state[k]])),
  memory:bus.trace.filter(e=>e.space==='MEMORY'&&e.operation==='WRITE').map(e=>({address:e.address,before:memory[e.address],after:e.data})),
  ports:bus.trace.filter(e=>e.space==='IO').map(e=>({operation:e.operation,address:e.address,data:e.data}))};
}
function buildData(){
 const instructions=[];
 for(const family of families)for(let opcode=0;opcode<256;opcode++){
  if(['BASE','DD','FD'].includes(family)&&[0xCB,0xDD,0xED,0xFD].includes(opcode))continue;
  const d=family==='BASE'?dec.decodeBase(opcode):family==='CB'?dec.decodeCB(opcode):family==='ED'?dec.decodeED(opcode):family==='DD'||family==='FD'?dec.decodeIndex(opcode,family==='DD'?'IX':'IY'):dec.decodeIndexedCB(opcode,family==='DDCB'?'IX':'IY');
  const tokens=pattern(d,family,opcode),timing=d.kind==='ED_BLOCK'&&d.repeat?'継続 21 / 終了 16':d.tStates!==undefined?String(d.tStates):`成立 ${d.tStatesTaken} / 不成立 ${d.tStatesNotTaken}`;
  instructions.push({id:family+'-'+hex(opcode),family,opcode,kind:d.kind,mnemonic:d.mnemonic,tokens,length:d.length,timing,classification:classify(d,family,opcode),...describe(d),example:example(tokens)});
 }
 const cbiosImage=cbios.buildCbios();
 const diskImage=systemDisk.buildSystemDisk();
 const files=['src/cpu/z80/z80-core.js','src/cpu/z80/z80-decoder.js','src/cpu/z80/z80-flags.js','src/machine/shino80/shino80-bus.js','src/machine/shino80/shino80-memory.js','src/machine/shino80/shino80-video.js','src/firmware/shino80/shino80-system-rom.js','src/firmware/shino80/shino80-cgrom.js','src/firmware/shino80/shino80-cbios.js','src/firmware/shino80/shino80-system-disk.js','src/devices/shino80/shino80-keyboard.js','src/devices/shino80/shino80-block-device.js'];
 return {version:'0.1',baseline:'BIOS/MON v0.3 + pageable firmware v0.4 + RAM handoff v0.5 + block device/CBIOS/system disk v0.1 candidates',revision:'feature/shino80-system-disk-loader-v01-20260926',families,instructions,
  sources:Object.fromEntries(files.map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex')])),
  machine:{romSize:rom.ROM_SIZE,bootRomSize:memory.BOOT_ROM_SIZE,extensionRomSize:memory.EXTENSION_ROM_SIZE,memoryControlPort:memory.MEMORY_CONTROL_PORT,vramBase:video.TEXT_VRAM_BASE,vramCells:video.CELL_COUNT,width:video.SCREEN_W,height:video.SCREEN_H,cols:video.COLS,rows:video.ROWS,
   keyData:keyboard.KEY_DATA_PORT,keyStatus:keyboard.KEY_STATUS_PORT,fifoCapacity:keyboard.DEFAULT_FIFO_CAPACITY,
   blockStatus:block.BLOCK_STATUS_PORT,blockCommand:block.BLOCK_COMMAND_PORT,blockDrive:block.BLOCK_DRIVE_PORT,blockTrack:block.BLOCK_TRACK_PORT,blockSector:block.BLOCK_SECTOR_PORT,blockData:block.BLOCK_DATA_PORT,blockError:block.BLOCK_ERROR_PORT,
   blockTracks:block.BLOCK_TRACKS,blockSectors:block.BLOCK_SECTORS_PER_TRACK,blockSectorSize:block.BLOCK_SECTOR_SIZE,blockImageSize:block.BLOCK_IMAGE_SIZE,labels:rom.buildSystemRom().labels,
   cbiosOrigin:cbiosImage.origin,cbiosEnd:cbiosImage.end,cbiosBytes:cbiosImage.bytes.length,cbiosEntries:cbios.CBIOS_ENTRY_NAMES.map(name=>({name,address:cbiosImage.labels['CBIOS_API_'+name]})),cbiosDpb:cbios.DPB,
   systemDiskMagic:systemDisk.SYSTEM_DISK_MAGIC,systemDiskVersion:systemDisk.SYSTEM_DISK_VERSION,systemDiskEntry:systemDisk.SYSTEM_ENTRY,systemDiskPayloadBytes:diskImage.payload.length,systemDiskHeader:Array.from(diskImage.header.slice(0,17)),
   ramHandoffTrampoline:rom.RAM_HANDOFF_TRAMPOLINE,ramHandoffDemoEntry:rom.RAM_HANDOFF_DEMO_ENTRY,ramHandoffSignature:rom.RAM_HANDOFF_SIGNATURE,
   cgBytes:Array.from(cg.CG_ROM_IMAGE),cgHash:cg.ROM_SHA256,cgCRC:cg.ROM_CRC32}};
}
function build(){
 const data=buildData(),read=f=>fs.readFileSync(path.join(root,'src/manual',f),'utf8');
 let html=read('index.html').replace('/* MANUAL_CSS */',()=>read('manual.css')).replace('/* MANUAL_DATA */',()=>'window.MANUAL_DATA='+JSON.stringify(data).replace(/</g,'\\u003c')+';').replace('/* MANUAL_JS */',()=>read('manual.js'));
 fs.writeFileSync(path.join(root,'deploy/shino80_technical_manual_v0.1.html'),html);
 console.log(`Technical Manual: ${data.instructions.length} encodings / ${Buffer.byteLength(html)} bytes`);
 return html;
}
if(require.main===module)build();
module.exports={buildData,build,classify,pattern};
