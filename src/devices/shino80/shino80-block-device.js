(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.SHINO_BLOCK_DEVICE=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const BLOCK_STATUS_PORT=0x30;
  const BLOCK_COMMAND_PORT=0x31;
  const BLOCK_DRIVE_PORT=0x32;
  const BLOCK_TRACK_PORT=0x33;
  const BLOCK_SECTOR_PORT=0x34;
  const BLOCK_DATA_PORT=0x35;
  const BLOCK_ERROR_PORT=0x36;

  const BLOCK_COMMAND_READ=0x01;
  const BLOCK_COMMAND_WRITE=0x02;
  const BLOCK_COMMAND_RESET=0x7F;

  const BLOCK_STATUS_READY=0x01;
  const BLOCK_STATUS_BUSY=0x02;
  const BLOCK_STATUS_DRQ=0x04;
  const BLOCK_STATUS_WRITE_PROTECT=0x40;
  const BLOCK_STATUS_ERROR=0x80;

  const BLOCK_ERROR_NONE=0;
  const BLOCK_ERROR_NO_MEDIA=1;
  const BLOCK_ERROR_BAD_DRIVE=2;
  const BLOCK_ERROR_BAD_TRACK=3;
  const BLOCK_ERROR_BAD_SECTOR=4;
  const BLOCK_ERROR_WRITE_PROTECTED=5;
  const BLOCK_ERROR_PROTOCOL=6;

  const BLOCK_TRACKS=77;
  const BLOCK_SECTORS_PER_TRACK=26;
  const BLOCK_SECTOR_SIZE=128;
  const BLOCK_IMAGE_SIZE=BLOCK_TRACKS*BLOCK_SECTORS_PER_TRACK*BLOCK_SECTOR_SIZE;
  const BLOCK_BLANK_BYTE=0xE5;

  function createBlankBlockImage(fill=BLOCK_BLANK_BYTE){
    const image=new Uint8Array(BLOCK_IMAGE_SIZE);
    image.fill(Number(fill)&0xFF);
    return image;
  }

  class Shino80BlockDevice {
    constructor({image=null,writeProtected=false}={}){
      this.id='SHINO80_BLOCK_DEVICE_A';
      this.medium=null;
      this.writeProtected=false;
      this.drive=0;
      this.track=0;
      this.sector=1;
      this.command=0;
      this.error=BLOCK_ERROR_NONE;
      this.transferMode=null;
      this.transferIndex=0;
      this.transferBuffer=null;
      if(image!==null)this.mountImage(image,{writeProtected});
    }

    lowPort(port){return Number(port)&0xFF;}
    handlesPort(port){const low=this.lowPort(port);return low>=BLOCK_STATUS_PORT&&low<=BLOCK_ERROR_PORT;}

    mountImage(image,{writeProtected=false}={}){
      if(!(image instanceof Uint8Array))throw new TypeError('Block image must be a Uint8Array');
      if(image.length!==BLOCK_IMAGE_SIZE)throw new RangeError(`Block image must be exactly ${BLOCK_IMAGE_SIZE} bytes`);
      this.medium=new Uint8Array(image);
      this.writeProtected=Boolean(writeProtected);
      this.reset();
      return this;
    }

    eject(){
      const image=this.medium?new Uint8Array(this.medium):null;
      this.medium=null;
      this.writeProtected=false;
      this.reset();
      return image;
    }

    exportImage(){return this.medium?new Uint8Array(this.medium):null;}
    get mounted(){return this.medium!==null;}
    get transferRemaining(){return this.transferMode?BLOCK_SECTOR_SIZE-this.transferIndex:0;}

    status(){
      return (this.mounted?BLOCK_STATUS_READY:0)|
        (this.transferMode?BLOCK_STATUS_DRQ:0)|
        (this.mounted&&this.writeProtected?BLOCK_STATUS_WRITE_PROTECT:0)|
        (this.error!==BLOCK_ERROR_NONE?BLOCK_STATUS_ERROR:0);
    }

    sectorOffset(){return (this.track*BLOCK_SECTORS_PER_TRACK+(this.sector-1))*BLOCK_SECTOR_SIZE;}

    clearTransfer(){
      this.transferMode=null;
      this.transferIndex=0;
      this.transferBuffer=null;
    }

    fail(code){this.clearTransfer();this.error=code;}

    validateSelection({write=false}={}){
      if(this.drive!==0)return BLOCK_ERROR_BAD_DRIVE;
      if(!this.mounted)return BLOCK_ERROR_NO_MEDIA;
      if(this.track<0||this.track>=BLOCK_TRACKS)return BLOCK_ERROR_BAD_TRACK;
      if(this.sector<1||this.sector>BLOCK_SECTORS_PER_TRACK)return BLOCK_ERROR_BAD_SECTOR;
      if(write&&this.writeProtected)return BLOCK_ERROR_WRITE_PROTECTED;
      return BLOCK_ERROR_NONE;
    }

    issueCommand(value){
      const command=Number(value)&0xFF;
      this.command=command;
      this.clearTransfer();
      this.error=BLOCK_ERROR_NONE;
      if(command===BLOCK_COMMAND_RESET)return;
      if(command!==BLOCK_COMMAND_READ&&command!==BLOCK_COMMAND_WRITE){this.fail(BLOCK_ERROR_PROTOCOL);return;}
      const error=this.validateSelection({write:command===BLOCK_COMMAND_WRITE});
      if(error!==BLOCK_ERROR_NONE){this.fail(error);return;}
      this.transferMode=command===BLOCK_COMMAND_READ?'read':'write';
      this.transferBuffer=new Uint8Array(BLOCK_SECTOR_SIZE);
      if(this.transferMode==='read'){
        const offset=this.sectorOffset();
        this.transferBuffer.set(this.medium.subarray(offset,offset+BLOCK_SECTOR_SIZE));
      }
    }

    readData({consume=true}={}){
      if(this.transferMode!=='read'||!this.transferBuffer){
        if(consume)this.fail(BLOCK_ERROR_PROTOCOL);
        return 0xFF;
      }
      const value=this.transferBuffer[this.transferIndex];
      if(consume){
        this.transferIndex++;
        if(this.transferIndex===BLOCK_SECTOR_SIZE)this.clearTransfer();
      }
      return value;
    }

    writeData(value){
      if(this.transferMode!=='write'||!this.transferBuffer){this.fail(BLOCK_ERROR_PROTOCOL);return;}
      this.transferBuffer[this.transferIndex++]=Number(value)&0xFF;
      if(this.transferIndex===BLOCK_SECTOR_SIZE){
        this.medium.set(this.transferBuffer,this.sectorOffset());
        this.clearTransfer();
      }
    }

    readPort(port){
      const low=this.lowPort(port);
      if(low===BLOCK_STATUS_PORT)return this.status();
      if(low===BLOCK_COMMAND_PORT)return this.command;
      if(low===BLOCK_DRIVE_PORT)return this.drive;
      if(low===BLOCK_TRACK_PORT)return this.track;
      if(low===BLOCK_SECTOR_PORT)return this.sector;
      if(low===BLOCK_DATA_PORT)return this.readData();
      if(low===BLOCK_ERROR_PORT)return this.error;
      return 0xFF;
    }

    writePort(port,value){
      const low=this.lowPort(port),data=Number(value)&0xFF;
      if(low===BLOCK_COMMAND_PORT){this.issueCommand(data);return;}
      if(low===BLOCK_DRIVE_PORT){this.clearTransfer();this.drive=data;return;}
      if(low===BLOCK_TRACK_PORT){this.clearTransfer();this.track=data;return;}
      if(low===BLOCK_SECTOR_PORT){this.clearTransfer();this.sector=data;return;}
      if(low===BLOCK_DATA_PORT){this.writeData(data);return;}
      if(low===BLOCK_ERROR_PORT&&data===0)this.error=BLOCK_ERROR_NONE;
    }

    debugPeekPort(port){
      const low=this.lowPort(port);
      if(low===BLOCK_DATA_PORT)return this.readData({consume:false});
      return this.readPort(low);
    }

    debugPokePort(port,value){
      const low=this.lowPort(port),data=Number(value)&0xFF;
      if(low===BLOCK_DRIVE_PORT)this.drive=data;
      else if(low===BLOCK_TRACK_PORT)this.track=data;
      else if(low===BLOCK_SECTOR_PORT)this.sector=data;
      else if(low===BLOCK_ERROR_PORT)this.error=data;
    }

    reset(){
      this.drive=0;
      this.track=0;
      this.sector=1;
      this.command=0;
      this.error=BLOCK_ERROR_NONE;
      this.clearTransfer();
    }
  }

  return {
    Shino80BlockDevice,createBlankBlockImage,
    BLOCK_STATUS_PORT,BLOCK_COMMAND_PORT,BLOCK_DRIVE_PORT,BLOCK_TRACK_PORT,BLOCK_SECTOR_PORT,BLOCK_DATA_PORT,BLOCK_ERROR_PORT,
    BLOCK_COMMAND_READ,BLOCK_COMMAND_WRITE,BLOCK_COMMAND_RESET,
    BLOCK_STATUS_READY,BLOCK_STATUS_BUSY,BLOCK_STATUS_DRQ,BLOCK_STATUS_WRITE_PROTECT,BLOCK_STATUS_ERROR,
    BLOCK_ERROR_NONE,BLOCK_ERROR_NO_MEDIA,BLOCK_ERROR_BAD_DRIVE,BLOCK_ERROR_BAD_TRACK,BLOCK_ERROR_BAD_SECTOR,BLOCK_ERROR_WRITE_PROTECTED,BLOCK_ERROR_PROTOCOL,
    BLOCK_TRACKS,BLOCK_SECTORS_PER_TRACK,BLOCK_SECTOR_SIZE,BLOCK_IMAGE_SIZE,BLOCK_BLANK_BYTE
  };
});
