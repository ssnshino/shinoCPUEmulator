'use strict';
const assert=require('node:assert/strict');
const {
  Shino80Memory,BOOT_ROM_SIZE,EXTENSION_ROM_BASE,EXTENSION_ROM_SIZE,FIRMWARE_SIZE,
  MEMORY_CONTROL_PORT,MEMORY_CONTROL_LOW_RAM,MEMORY_CONTROL_SHADOW_WRITE
}=require('../src/machine/shino80/shino80-memory.js');
const {Shino80Bus}=require('../src/machine/shino80/shino80-bus.js');
const {Z80Core}=require('../src/cpu/z80/z80-core.js');
const {buildSystemRom}=require('../src/firmware/shino80/shino80-system-rom.js');

assert.equal(BOOT_ROM_SIZE,0x2000);assert.equal(EXTENSION_ROM_BASE,0x2000);
assert.equal(EXTENSION_ROM_SIZE,0x2000);assert.equal(FIRMWARE_SIZE,0x4000);assert.equal(MEMORY_CONTROL_PORT,0);

const memory=new Shino80Memory({extensionBankCount:2});
const image=new Uint8Array(FIRMWARE_SIZE);image.fill(0xFF);image[0]=0xC3;image[0x1FFF]=0x11;image[0x2000]=0x22;image[0x3FFF]=0x33;
memory.loadFirmware(image);memory.loadExtensionBank(1,Uint8Array.from({length:EXTENSION_ROM_SIZE},(_,i)=>i===0?0x44:0xEE));
const bus=new Shino80Bus({traceLimit:64,memoryDevice:memory});

// RESET-visible map: fixed boot ROM, extension bank 0, then RAM.
assert.equal(memory.control,0);assert.equal(bus.debugPeek(0),0xC3);assert.equal(bus.debugPeek(0x1FFF),0x11);
assert.equal(bus.debugPeek(0x2000),0x22);assert.equal(bus.debugPeek(0x3FFF),0x33);assert.equal(bus.debugPeek(0x4000),0);
bus.clearTrace();assert.equal(bus.cpuRead(0x0000),0xC3);assert.equal(bus.trace.at(-1).meta.memorySource,'BOOT_ROM');
assert.equal(bus.cpuRead(0x2000),0x22);assert.deepEqual({source:bus.trace.at(-1).meta.memorySource,bank:bus.trace.at(-1).meta.extensionBank},{source:'EXTENSION_ROM',bank:0});

// Protected writes are blocked until shadow mode is explicit.
bus.cpuWrite(0x0100,0xA5,{purpose:'PROBE'});assert.equal(bus.debugPeek(0x0100),0xFF);assert.equal(bus.debugPeekRam(0x0100),0);
assert.equal(bus.trace.at(-1).operation,'WRITE_BLOCKED');assert.equal(bus.trace.at(-1).purpose,'ROM_WRITE_BLOCKED');
bus.cpuIoWrite(0xAB00,MEMORY_CONTROL_SHADOW_WRITE);assert.equal(memory.control,MEMORY_CONTROL_SHADOW_WRITE);
bus.cpuWrite(0x0100,0xA5,{purpose:'SHADOW_LOAD'});assert.equal(bus.debugPeek(0x0100),0xFF);assert.equal(bus.debugPeekRam(0x0100),0xA5);
assert.equal(bus.trace.at(-1).operation,'WRITE_SHADOW');assert.equal(bus.trace.at(-1).meta.memorySource,'RAM_UNDER_ROM');

// Full-RAM mode exposes the underlay; ordinary writes then remain ordinary RAM.
bus.cpuIoWrite(0x0000,MEMORY_CONTROL_LOW_RAM);assert(memory.lowRamEnabled);assert.equal(bus.debugPeek(0x0100),0xA5);
bus.cpuWrite(0x0100,0x5A);assert.equal(bus.debugPeek(0x0100),0x5A);assert.equal(bus.trace.at(-1).operation,'WRITE');
assert.equal(bus.trace.at(-1).meta.memorySource,'RAM');

// Extension selection leaves fixed boot ROM unchanged and absent banks read FF.
bus.cpuIoWrite(0x1200,0x10);assert.equal(memory.extensionBank,1);assert.equal(bus.debugPeek(0),0xC3);assert.equal(bus.debugPeek(0x2000),0x44);
bus.cpuIoWrite(0x0000,0x30);assert.equal(memory.extensionBank,3);assert.equal(bus.debugPeek(0x2000),0xFF);
bus.resetIoDevices();assert.equal(memory.control,0);assert.equal(bus.debugPeek(0x2000),0x22);

// Clearing physical RAM never alters either ROM half.
bus.debugPoke(0x0000,0x66);bus.debugPoke(0x4000,0x77);bus.clearWritableMemory(0xCC);
assert.equal(bus.debugPeek(0),0xC3);assert.equal(bus.debugPeek(0x2000),0x22);assert.equal(bus.debugPeekRam(0),0xCC);assert.equal(bus.debugPeek(0x4000),0xCC);

// Production firmware is a 16 KiB image with large tables in extension bank 0.
const rom=buildSystemRom();assert.equal(rom.bytes.length,FIRMWARE_SIZE);
assert(rom.labels.DA_INDEX_AFFECTED_BITS>=EXTENSION_ROM_BASE);assert(rom.labels.DA_INDEX_AFFECTED_BITS<FIRMWARE_SIZE);
const systemMemory=new Shino80Memory();systemMemory.loadFirmware(rom.bytes);
const systemBus=new Shino80Bus({traceLimit:0,memoryDevice:systemMemory});const cpu=new Z80Core(systemBus);cpu.reset();cpu.runInstructions(rom.meta.instructionsBeforeLoop);
assert.equal(cpu.state.pc,rom.labels.MONITOR_LOOP);assert.equal(systemMemory.control,0);assert.equal(systemBus.debugPeek(EXTENSION_ROM_BASE),rom.bytes[EXTENSION_ROM_BASE]);

console.log('SHINO-80 PAGEABLE FIRMWARE v0.4: BOOT/EXT ROM + SHADOW/FULL-RAM MAP PASS');
