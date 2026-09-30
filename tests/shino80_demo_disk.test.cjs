'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const repo=path.resolve(__dirname,'..');
const {Shino80Memory}=require(path.join(repo,'src/machine/shino80/shino80-memory.js'));
const {Shino80Bus}=require(path.join(repo,'src/machine/shino80/shino80-bus.js'));
const {Shino80Keyboard}=require(path.join(repo,'src/devices/shino80/shino80-keyboard.js'));
const {Shino80BlockDevice}=require(path.join(repo,'src/devices/shino80/shino80-block-device.js'));
const {Shino80Beeper}=require(path.join(repo,'src/devices/shino80/shino80-beeper.js'));
const {Z80Core}=require(path.join(repo,'src/cpu/z80/z80-core.js'));
const cbios=require(path.join(repo,'src/firmware/shino80/shino80-cbios.js'));
const {buildSystemDisk}=require(path.join(repo,'src/firmware/shino80/shino80-system-disk.js'));
const {readDirectory}=require(path.join(repo,'src/firmware/shino80/shino80-cpm-filesystem.js'));
const {buildSystemRom,TEXT_VRAM_BASE}=require(path.join(repo,'src/firmware/shino80/shino80-system-rom.js'));

const demoPath=path.join(repo,'software/demo-disk/SHINO80_DEMOS_CLASSIC_256K.s80d');
const generatedPath=path.join(os.tmpdir(),`SHINO80_DEMOS_CLASSIC_256K-${process.pid}.s80d`);
const build=spawnSync(process.execPath,[path.join(repo,'software/demo-disk/build-demo-disk.cjs'),generatedPath],{encoding:'utf8'});
assert.equal(build.status,0,build.stderr||build.stdout);
const demo=Uint8Array.from(fs.readFileSync(demoPath)),generated=Uint8Array.from(fs.readFileSync(generatedPath));fs.unlinkSync(generatedPath);
assert.deepEqual(generated,demo,'committed demo disk must be byte-exact reproducible');
const names=readDirectory(demo).map(entry=>entry.name);
assert.deepEqual(names,['README.TXT','BALLS.COM','MONX.COM','BEEP.COM','ABOUT.COM','BALLS.ASM','MONX.ASM']);

const keyboard=new Shino80Keyboard({capacity:512});
const beeper=new Shino80Beeper();
const disk=new Shino80BlockDevice();
disk.mountImage(buildSystemDisk().image,{drive:0});
disk.mountImage(demo,{drive:1});
const memory=new Shino80Memory();memory.loadFirmware(buildSystemRom().bytes);
const bus=new Shino80Bus({traceLimit:20000,memoryDevice:memory,ioDevices:[keyboard,disk,beeper]});
const cpu=new Z80Core(bus);cpu.reset();
function screen(){return String.fromCharCode(...memory.ram.slice(TEXT_VRAM_BASE,TEXT_VRAM_BASE+2000)).replaceAll('\0',' ');}
function until(predicate,limit=8000000,label='timeout'){let count=0;while(!predicate()&&count++<limit)cpu.step();assert(count<limit,`${label}: PC=${cpu.state.pc.toString(16)} screen=${JSON.stringify(screen().slice(-240))}`);return count;}
function input(text){for(const char of text)assert(keyboard.enqueueByte(char.charCodeAt(0)),`keyboard overflow at ${char}`);}
const activeCbios=cbios.buildCbios();
function command(text,fragment){process.stderr.write(`RUN ${text}\n`);input(text+'\r');cpu.step();return until(()=>keyboard.depth===0&&cpu.state.pc===activeCbios.labels.CBIOS_CONIN_WAIT&&screen().includes(fragment),8000000,`command ${text}`);}

const waitPc=activeCbios.labels.CBIOS_CONIN_WAIT;
process.stderr.write('BOOT\n');until(()=>cpu.state.pc===waitPc&&screen().includes('A>'),8000000,'boot');
command('B:','B>');
command('DIR','BALLS');
command('TYPE README.TXT','MONX COMMANDS');
command('ABOUT','SHINO-80 DEMO DISK 1.0');

process.stderr.write('RUN BALLS\n');input('BALLS\r');cpu.step();
until(()=>screen().startsWith('SHINO-80 BALLS DEMO - PRESS C TO STOP'),8000000,'BALLS start');
const first=screen();
for(let i=0;i<350000;i++)cpu.step();
const second=screen();
assert.notEqual(first,second,'BALLS frame must animate');
assert(/[Oo*@+#]/.test(second.slice(160)),'BALLS glyphs must appear below heading');
input('c');
until(()=>cpu.state.pc===waitPc&&screen().includes('B>'),8000000,'BALLS C warm boot');

process.stderr.write('RUN MONX\n');input('MONX\r');cpu.step();
until(()=>cpu.state.pc===waitPc&&screen().includes('MONX>'),8000000,'MONX start');
command('E 6000 5A','OK');assert.equal(memory.ram[0x6000],0x5A);
command('F 6010 601F AA','OK');assert.deepEqual([...memory.ram.slice(0x6010,0x6020)],Array(16).fill(0xAA));
command('M 6010 601F 6020','OK');assert.deepEqual([...memory.ram.slice(0x6020,0x6030)],Array(16).fill(0xAA));
command('S 6020 602F AA','6020');
command('D 6000','6000: 5A');
process.stderr.write('RUN Q\n');input('Q\r');cpu.step();until(()=>cpu.state.pc===waitPc&&screen().includes('RETURN TO CP/M'),8000000,'MONX quit');

process.stderr.write('RUN MONX / G SAFE RET\n');input('MONX\r');cpu.step();until(()=>cpu.state.pc===waitPc&&screen().includes('MONX>'),8000000,'MONX restart');
command('E 6100 C9','OK');
input('G 6100\r');cpu.step();until(()=>cpu.state.pc===waitPc&&screen().includes('B>'),8000000,'MONX G safe RET');

command('BEEP','B>');
assert.equal(beeper.triggerCount,3,'BEEP must trigger three tones on port 40h');

process.stdout.write(JSON.stringify({directory:names,profile:'CLASSIC',imageBytes:demo.length,system:'S80B v2 CLASSIC',ballsAnimated:true,ballsStoppedWithC:true,monx:{edit:true,fill:true,move:true,search:true,dump:true,go:true,quit:true},beepPort40:true},null,2)+'\n');
