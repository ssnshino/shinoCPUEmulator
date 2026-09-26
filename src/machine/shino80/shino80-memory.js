(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.SHINO_MEMORY=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const ADDRESS_MASK=0xFFFF;
  const BOOT_ROM_SIZE=0x2000;
  const EXTENSION_ROM_BASE=0x2000;
  const EXTENSION_ROM_SIZE=0x2000;
  const FIRMWARE_SIZE=BOOT_ROM_SIZE+EXTENSION_ROM_SIZE;
  const MEMORY_CONTROL_PORT=0x00;
  const MEMORY_CONTROL_LOW_RAM=0x01;
  const MEMORY_CONTROL_SHADOW_WRITE=0x02;
  const MEMORY_CONTROL_BANK_MASK=0xF0;
  const MEMORY_CONTROL_VALID_MASK=MEMORY_CONTROL_LOW_RAM|MEMORY_CONTROL_SHADOW_WRITE|MEMORY_CONTROL_BANK_MASK;

  class Shino80Memory {
    constructor({extensionBankCount=1}={}){
      const count=Number(extensionBankCount);
      if(!Number.isInteger(count)||count<1||count>16)throw new RangeError('extensionBankCount must be 1..16');
      this.id='SHINO80_MEMORY_CONTROL';
      this.ram=new Uint8Array(0x10000);
      this.bootRom=new Uint8Array(BOOT_ROM_SIZE);this.bootRom.fill(0xFF);
      this.extensionRomBanks=Array.from({length:count},()=>{const bank=new Uint8Array(EXTENSION_ROM_SIZE);bank.fill(0xFF);return bank;});
      this.control=0;
    }

    normalizeAddress(address){return Number(address)&ADDRESS_MASK;}
    normalizeData(value){return Number(value)&0xFF;}
    lowPort(port){return Number(port)&0xFF;}
    handlesPort(port){return this.lowPort(port)===MEMORY_CONTROL_PORT;}
    get lowRamEnabled(){return Boolean(this.control&MEMORY_CONTROL_LOW_RAM);}
    get shadowWriteEnabled(){return Boolean(this.control&MEMORY_CONTROL_SHADOW_WRITE);}
    get extensionBank(){return (this.control&MEMORY_CONTROL_BANK_MASK)>>4;}

    reset(){this.control=0;}
    readPort(){return this.control;}
    writePort(port,value){
      if(this.handlesPort(port))this.control=this.normalizeData(value)&MEMORY_CONTROL_VALID_MASK;
    }
    debugPeekPort(){return this.control;}
    debugPokePort(port,value){this.writePort(port,value);}

    isRomVisibleAddress(address){
      const addr=this.normalizeAddress(address);
      return !this.lowRamEnabled&&addr<FIRMWARE_SIZE;
    }
    describeAddress(address){
      const addr=this.normalizeAddress(address);
      if(this.lowRamEnabled||addr>=FIRMWARE_SIZE)return {memorySource:'RAM',mapping:'RAM'};
      if(addr<BOOT_ROM_SIZE)return {memorySource:'BOOT_ROM',mapping:'ROM_OVERLAY'};
      return {memorySource:'EXTENSION_ROM',mapping:'ROM_OVERLAY',extensionBank:this.extensionBank};
    }
    read(address){
      const addr=this.normalizeAddress(address);
      if(this.lowRamEnabled||addr>=FIRMWARE_SIZE)return this.ram[addr];
      if(addr<BOOT_ROM_SIZE)return this.bootRom[addr];
      const bank=this.extensionRomBanks[this.extensionBank];
      return bank?bank[addr-EXTENSION_ROM_BASE]:0xFF;
    }
    write(address,value){
      const addr=this.normalizeAddress(address),data=this.normalizeData(value);
      if(this.isRomVisibleAddress(addr)){
        if(!this.shadowWriteEnabled)return {operation:'WRITE_BLOCKED',purpose:'ROM_WRITE_BLOCKED',memorySource:'ROM_OVERLAY'};
        this.ram[addr]=data;
        return {operation:'WRITE_SHADOW',memorySource:'RAM_UNDER_ROM',mapping:'ROM_OVERLAY'};
      }
      this.ram[addr]=data;
      return {operation:'WRITE',memorySource:'RAM',mapping:'RAM'};
    }

    debugPeek(address){return this.read(address);}
    debugPeekRam(address){return this.ram[this.normalizeAddress(address)];}
    debugPoke(address,value){this.ram[this.normalizeAddress(address)]=this.normalizeData(value);}
    clearRam(value=0){this.ram.fill(this.normalizeData(value));}
    loadRam(bytes,start=0){
      const base=this.normalizeAddress(start);
      for(let n=0;n<bytes.length;n++)this.ram[(base+n)&ADDRESS_MASK]=this.normalizeData(bytes[n]);
    }
    loadBootRom(bytes){
      if(bytes.length>BOOT_ROM_SIZE)throw new RangeError('Boot ROM exceeds 8 KiB');
      this.bootRom.fill(0xFF);this.bootRom.set(bytes);
    }
    loadExtensionBank(index,bytes){
      const bankIndex=Number(index);
      if(!Number.isInteger(bankIndex)||bankIndex<0||bankIndex>=this.extensionRomBanks.length)throw new RangeError('Extension ROM bank is not installed');
      if(bytes.length>EXTENSION_ROM_SIZE)throw new RangeError('Extension ROM bank exceeds 8 KiB');
      const bank=this.extensionRomBanks[bankIndex];bank.fill(0xFF);bank.set(bytes);
    }
    loadFirmware(bytes){
      if(bytes.length>FIRMWARE_SIZE)throw new RangeError('Firmware image exceeds 16 KiB');
      this.loadBootRom(bytes.slice(0,BOOT_ROM_SIZE));
      this.loadExtensionBank(0,bytes.slice(BOOT_ROM_SIZE,FIRMWARE_SIZE));
    }
  }

  return {
    Shino80Memory,
    BOOT_ROM_SIZE,EXTENSION_ROM_BASE,EXTENSION_ROM_SIZE,FIRMWARE_SIZE,
    MEMORY_CONTROL_PORT,MEMORY_CONTROL_LOW_RAM,MEMORY_CONTROL_SHADOW_WRITE,MEMORY_CONTROL_BANK_MASK
  };
});
