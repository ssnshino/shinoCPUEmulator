(function(root,factory){
  const profiles=(typeof module==='object'&&module.exports)?require('./shino80-media-profiles.js'):root.SHINO_MEDIA_PROFILES;
  const api=factory(profiles);
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.SHINO_BLOCK_DEVICE=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(profiles){
  'use strict';

  const BLOCK_STATUS_PORT=0x30;
  const BLOCK_COMMAND_PORT=0x31;
  const BLOCK_DRIVE_PORT=0x32;
  const BLOCK_TRACK_PORT=0x33;
  const BLOCK_CYLINDER_PORT=BLOCK_TRACK_PORT;
  const BLOCK_SECTOR_PORT=0x34;
  const BLOCK_DATA_PORT=0x35;
  const BLOCK_ERROR_PORT=0x36;
  const BLOCK_HEAD_PORT=0x37;
  const BLOCK_MEDIA_PROFILE_PORT=0x38;

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
  const BLOCK_ERROR_BAD_CYLINDER=BLOCK_ERROR_BAD_TRACK;
  const BLOCK_ERROR_BAD_SECTOR=4;
  const BLOCK_ERROR_WRITE_PROTECTED=5;
  const BLOCK_ERROR_PROTOCOL=6;
  const BLOCK_ERROR_BAD_HEAD=7;

  const CLASSIC_PROFILE=profiles.mediaProfileById(profiles.MEDIA_PROFILE_CLASSIC);
  const BLOCK_TRACKS=CLASSIC_PROFILE.cylinders;
  const BLOCK_SECTORS_PER_TRACK=CLASSIC_PROFILE.physicalSectorsPerTrack;
  const BLOCK_SECTOR_SIZE=CLASSIC_PROFILE.physicalSectorSize;
  const BLOCK_IMAGE_SIZE=CLASSIC_PROFILE.imageBytes;
  const BLOCK_BLANK_BYTE=0xE5;
  const BLOCK_DRIVE_COUNT=2;

  function createBlankBlockImage(fill=BLOCK_BLANK_BYTE){
    return profiles.createBlankMediaImage(profiles.MEDIA_PROFILE_CLASSIC,{fill});
  }

  class Shino80BlockDevice {
    constructor({image=null,writeProtected=false}={}){
      this.id='SHINO80_BLOCK_DEVICE_A';
      this.slots=Array.from({length:BLOCK_DRIVE_COUNT},()=>({medium:null,profileId:profiles.MEDIA_PROFILE_NONE,writeProtected:false}));
      this.drive=0;
      this.track=0;
      this.head=0;
      this.sector=1;
      this.command=0;
      this.error=BLOCK_ERROR_NONE;
      this.transferMode=null;
      this.transferIndex=0;
      this.transferBuffer=null;
      if(image!==null)this.mountImage(image,{drive:0,writeProtected});
    }

    lowPort(port){return Number(port)&0xFF;}
    handlesPort(port){const low=this.lowPort(port);return low>=BLOCK_STATUS_PORT&&low<=BLOCK_MEDIA_PROFILE_PORT;}

    validDrive(drive){return Number.isInteger(drive)&&drive>=0&&drive<BLOCK_DRIVE_COUNT;}
    slotAt(drive){return this.validDrive(drive)?this.slots[drive]:null;}
    selectedSlot(){return this.slotAt(this.drive);}
    profileAt(drive){const slot=this.slotAt(drive);return slot?.medium?profiles.mediaProfileById(slot.profileId):null;}
    selectedProfile(){return this.profileAt(this.drive);}
    mediaProfileIdAt(drive){return this.profileAt(drive)?.id??profiles.MEDIA_PROFILE_NONE;}

    mountImage(image,{drive=0,writeProtected=false,profileId=null}={}){
      if(!(image instanceof Uint8Array))throw new TypeError('Block image must be a Uint8Array');
      const slot=this.slotAt(drive);
      if(!slot)throw new RangeError(`Block drive must be from 0 to ${BLOCK_DRIVE_COUNT-1}`);
      const matches=profiles.mediaProfilesForImageLength(image.length);
      let profile;
      if(profileId===null){
        if(matches.length===0)throw new RangeError(`Unsupported block image size ${image.length} bytes`);
        if(matches.length!==1)throw new RangeError(`Ambiguous block image size ${image.length} bytes`);
        profile=matches[0];
      }else{
        profile=profiles.mediaProfileById(profileId);
        if(!profile)throw new RangeError(`Unknown media profile ${profileId}`);
        if(profile.imageBytes!==image.length)throw new RangeError(`Profile ${profile.name} requires exactly ${profile.imageBytes} bytes`);
      }
      slot.medium=new Uint8Array(image);
      slot.profileId=profile.id;
      slot.writeProtected=Boolean(writeProtected);
      this.reset();
      return this;
    }

    eject({drive=0}={}){
      const slot=this.slotAt(drive);
      if(!slot)return null;
      const image=slot.medium?new Uint8Array(slot.medium):null;
      slot.medium=null;
      slot.profileId=profiles.MEDIA_PROFILE_NONE;
      slot.writeProtected=false;
      this.reset();
      return image;
    }

    exportImage({drive=0}={}){const slot=this.slotAt(drive);return slot?.medium?new Uint8Array(slot.medium):null;}
    mountedAt(drive){return Boolean(this.slotAt(drive)?.medium);}
    writeProtectedAt(drive){return Boolean(this.slotAt(drive)?.writeProtected);}
    get medium(){return this.slotAt(0).medium;}
    get writeProtected(){return this.writeProtectedAt(0);}
    get mounted(){return this.mountedAt(0);}
    get transferRemaining(){return this.transferMode&&this.transferBuffer?this.transferBuffer.length-this.transferIndex:0;}

    status(){
      return (this.mountedAt(this.drive)?BLOCK_STATUS_READY:0)|
        (this.transferMode?BLOCK_STATUS_DRQ:0)|
        (this.mountedAt(this.drive)&&this.writeProtectedAt(this.drive)?BLOCK_STATUS_WRITE_PROTECT:0)|
        (this.error!==BLOCK_ERROR_NONE?BLOCK_STATUS_ERROR:0);
    }

    sectorOffset(){
      const profile=this.selectedProfile();if(!profile)return null;
      return (((this.track*profile.heads)+this.head)*profile.physicalSectorsPerTrack+(this.sector-1))*profile.physicalSectorSize;
    }

    clearTransfer(){
      this.transferMode=null;
      this.transferIndex=0;
      this.transferBuffer=null;
    }

    fail(code){this.clearTransfer();this.error=code;}

    validateSelection({write=false}={}){
      if(!this.validDrive(this.drive))return BLOCK_ERROR_BAD_DRIVE;
      if(!this.mountedAt(this.drive))return BLOCK_ERROR_NO_MEDIA;
      const profile=this.selectedProfile();
      if(this.track<0||this.track>=profile.cylinders)return BLOCK_ERROR_BAD_CYLINDER;
      if(this.head<0||this.head>=profile.heads)return BLOCK_ERROR_BAD_HEAD;
      if(this.sector<1||this.sector>profile.physicalSectorsPerTrack)return BLOCK_ERROR_BAD_SECTOR;
      if(write&&this.writeProtectedAt(this.drive))return BLOCK_ERROR_WRITE_PROTECTED;
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
      this.transferBuffer=new Uint8Array(this.selectedProfile().physicalSectorSize);
      if(this.transferMode==='read'){
        const offset=this.sectorOffset(),slot=this.selectedSlot();
        this.transferBuffer.set(slot.medium.subarray(offset,offset+this.transferBuffer.length));
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
        if(this.transferIndex===this.transferBuffer.length)this.clearTransfer();
      }
      return value;
    }

    writeData(value){
      if(this.transferMode!=='write'||!this.transferBuffer){this.fail(BLOCK_ERROR_PROTOCOL);return;}
      this.transferBuffer[this.transferIndex++]=Number(value)&0xFF;
      if(this.transferIndex===this.transferBuffer.length){
        this.selectedSlot().medium.set(this.transferBuffer,this.sectorOffset());
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
      if(low===BLOCK_HEAD_PORT)return this.head;
      if(low===BLOCK_MEDIA_PROFILE_PORT)return this.mediaProfileIdAt(this.drive);
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
      if(low===BLOCK_HEAD_PORT){this.clearTransfer();this.head=data;}
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
      else if(low===BLOCK_HEAD_PORT)this.head=data;
    }

    reset(){
      this.drive=0;
      this.track=0;
      this.head=0;
      this.sector=1;
      this.command=0;
      this.error=BLOCK_ERROR_NONE;
      this.clearTransfer();
    }
  }

  return {
    Shino80BlockDevice,createBlankBlockImage,
    BLOCK_STATUS_PORT,BLOCK_COMMAND_PORT,BLOCK_DRIVE_PORT,BLOCK_TRACK_PORT,BLOCK_CYLINDER_PORT,BLOCK_SECTOR_PORT,BLOCK_DATA_PORT,BLOCK_ERROR_PORT,BLOCK_HEAD_PORT,BLOCK_MEDIA_PROFILE_PORT,
    BLOCK_COMMAND_READ,BLOCK_COMMAND_WRITE,BLOCK_COMMAND_RESET,
    BLOCK_STATUS_READY,BLOCK_STATUS_BUSY,BLOCK_STATUS_DRQ,BLOCK_STATUS_WRITE_PROTECT,BLOCK_STATUS_ERROR,
    BLOCK_ERROR_NONE,BLOCK_ERROR_NO_MEDIA,BLOCK_ERROR_BAD_DRIVE,BLOCK_ERROR_BAD_TRACK,BLOCK_ERROR_BAD_CYLINDER,BLOCK_ERROR_BAD_SECTOR,BLOCK_ERROR_WRITE_PROTECTED,BLOCK_ERROR_PROTOCOL,BLOCK_ERROR_BAD_HEAD,
    BLOCK_TRACKS,BLOCK_SECTORS_PER_TRACK,BLOCK_SECTOR_SIZE,BLOCK_IMAGE_SIZE,BLOCK_BLANK_BYTE,BLOCK_DRIVE_COUNT,
    BLOCK_MEDIA_PROFILE_ID:profiles.MEDIA_PROFILE_CLASSIC
  };
});
