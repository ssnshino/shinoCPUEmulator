(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.SHINO_MEDIA_PROFILES=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const MEDIA_PROFILE_CLASSIC=0x00;
  const MEDIA_PROFILE_2HD_JP=0x01;
  const MEDIA_PROFILE_2DD_720=0x02;
  const MEDIA_PROFILE_2HD_AT_1200=0x03;
  const MEDIA_PROFILE_2HD_1440=0x04;
  const MEDIA_PROFILE_NONE=0xFF;
  const LOGICAL_RECORD_SIZE=128;

  function integer(name,value,{minimum=0}={}){
    if(!Number.isInteger(value)||value<minimum)throw new RangeError(`${name} must be an integer >= ${minimum}`);
    return value;
  }

  function calculateMediaProfile(definition){
    const id=integer('id',definition.id),cylinders=integer('cylinders',definition.cylinders,{minimum:1});
    const heads=integer('heads',definition.heads,{minimum:1});
    const physicalSectorsPerTrack=integer('physicalSectorsPerTrack',definition.physicalSectorsPerTrack,{minimum:1});
    const physicalSectorSize=integer('physicalSectorSize',definition.physicalSectorSize,{minimum:LOGICAL_RECORD_SIZE});
    const allocationBlockSize=integer('allocationBlockSize',definition.allocationBlockSize,{minimum:1024});
    const drm=integer('drm',definition.drm),off=integer('off',definition.off);
    const al0=integer('al0',definition.al0),al1=integer('al1',definition.al1);
    if(id>0xFE)throw new RangeError('id must fit the mounted profile range');
    if(physicalSectorSize%LOGICAL_RECORD_SIZE!==0)throw new RangeError('physicalSectorSize must be a multiple of 128');
    if(allocationBlockSize%LOGICAL_RECORD_SIZE!==0)throw new RangeError('allocationBlockSize must be a multiple of 128');
    const recordsPerBlock=allocationBlockSize/LOGICAL_RECORD_SIZE,bsh=Math.log2(recordsPerBlock);
    if(!Number.isInteger(bsh))throw new RangeError('allocationBlockSize / 128 must be a power of two');
    const logicalTracks=cylinders*heads;
    const logicalSectorsPerTrack=physicalSectorsPerTrack*(physicalSectorSize/LOGICAL_RECORD_SIZE);
    const trackBytes=logicalSectorsPerTrack*LOGICAL_RECORD_SIZE;
    const imageBytes=logicalTracks*trackBytes;
    const reservedSystemBytes=off*trackBytes;
    const allocationBlocks=Math.floor((imageBytes-reservedSystemBytes)/allocationBlockSize);
    const directoryBytes=(drm+1)*32,directoryBlocks=Math.ceil(directoryBytes/allocationBlockSize);
    if(allocationBlocks<=directoryBlocks)throw new RangeError('profile has no filesystem data blocks');
    const dsm=allocationBlocks-1;
    if(dsm>=256)throw new RangeError('PHASE 3 native profiles require one-byte allocation block numbers');
    const dpb=Object.freeze({
      spt:logicalSectorsPerTrack,bsh,blm:recordsPerBlock-1,exm:allocationBlockSize/1024-1,
      dsm,drm,al0,al1,cks:(drm+1)/4,off
    });
    if(!Number.isInteger(dpb.exm)||!Number.isInteger(dpb.cks))throw new RangeError('DPB extent/checksum values must be integral');
    return Object.freeze({
      id,name:String(definition.name),cylinders,heads,physicalSectorsPerTrack,physicalSectorSize,
      imageBytes,logicalTracks,logicalSectorsPerTrack,trackBytes,allocationBlockSize,
      allocationBlocks,directoryBytes,directoryBlocks,reservedSystemBytes,
      filesystemUsableBytes:(allocationBlocks-directoryBlocks)*allocationBlockSize,dpb
    });
  }

  const MEDIA_PROFILES=Object.freeze([
    calculateMediaProfile({id:MEDIA_PROFILE_CLASSIC,name:'CLASSIC',cylinders:77,heads:1,physicalSectorsPerTrack:26,physicalSectorSize:128,allocationBlockSize:1024,drm:63,al0:0xC0,al1:0,off:2}),
    calculateMediaProfile({id:MEDIA_PROFILE_2HD_JP,name:'2HD-JP',cylinders:77,heads:2,physicalSectorsPerTrack:8,physicalSectorSize:1024,allocationBlockSize:8192,drm:255,al0:0x80,al1:0,off:1}),
    calculateMediaProfile({id:MEDIA_PROFILE_2DD_720,name:'2DD-720',cylinders:80,heads:2,physicalSectorsPerTrack:9,physicalSectorSize:512,allocationBlockSize:4096,drm:127,al0:0x80,al1:0,off:2}),
    calculateMediaProfile({id:MEDIA_PROFILE_2HD_AT_1200,name:'2HD-AT-1200',cylinders:80,heads:2,physicalSectorsPerTrack:15,physicalSectorSize:512,allocationBlockSize:8192,drm:255,al0:0x80,al1:0,off:1}),
    calculateMediaProfile({id:MEDIA_PROFILE_2HD_1440,name:'2HD-1440',cylinders:80,heads:2,physicalSectorsPerTrack:18,physicalSectorSize:512,allocationBlockSize:8192,drm:255,al0:0x80,al1:0,off:1})
  ]);
  const profileById=new Map(MEDIA_PROFILES.map(profile=>[profile.id,profile]));

  function mediaProfileById(id){return profileById.get(Number(id))||null;}
  function mediaProfilesForImageLength(length){return MEDIA_PROFILES.filter(profile=>profile.imageBytes===Number(length));}
  function mediaProfileForImageLength(length){const matches=mediaProfilesForImageLength(length);return matches.length===1?matches[0]:null;}
  function createBlankMediaImage(profileId,{fill=0xE5}={}){
    const profile=mediaProfileById(profileId);if(!profile)throw new RangeError(`Unknown media profile ${profileId}`);
    const image=new Uint8Array(profile.imageBytes);image.fill(Number(fill)&0xFF);return image;
  }

  return {
    MEDIA_PROFILE_CLASSIC,MEDIA_PROFILE_2HD_JP,MEDIA_PROFILE_2DD_720,MEDIA_PROFILE_2HD_AT_1200,MEDIA_PROFILE_2HD_1440,MEDIA_PROFILE_NONE,
    LOGICAL_RECORD_SIZE,MEDIA_PROFILES,calculateMediaProfile,mediaProfileById,mediaProfilesForImageLength,mediaProfileForImageLength,createBlankMediaImage
  };
});
