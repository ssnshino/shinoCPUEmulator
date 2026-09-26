(function(root,factory){
  const block=(typeof module==='object'&&module.exports)?require('../../devices/shino80/shino80-block-device.js'):root.SHINO_BLOCK_DEVICE;
  const cbios=(typeof module==='object'&&module.exports)?require('./shino80-cbios.js'):root.SHINO_CBIOS;
  const api=factory(block,cbios);
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.SHINO_CPM_FILESYSTEM=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(block,cbios){
  'use strict';

  const CPM_DIRECTORY_ENTRY_SIZE=32;
  const CPM_RECORD_SIZE=128;
  const CPM_EXTENT_RECORDS=128;
  const CPM_TEXT_EOF=0x1A;
  const CPM_USER_DEFAULT=0;
  const dpb=cbios.DPB;
  const CPM_BLOCK_SIZE=CPM_RECORD_SIZE*(1<<dpb.bsh);
  const CPM_DIRECTORY_ENTRIES=dpb.drm+1;
  const CPM_DIRECTORY_BYTES=CPM_DIRECTORY_ENTRIES*CPM_DIRECTORY_ENTRY_SIZE;
  const CPM_DIRECTORY_BLOCKS=Math.ceil(CPM_DIRECTORY_BYTES/CPM_BLOCK_SIZE);
  const CPM_FIRST_DATA_BLOCK=CPM_DIRECTORY_BLOCKS;
  const CPM_TOTAL_BLOCKS=dpb.dsm+1;
  const CPM_FILESYSTEM_OFFSET=dpb.off*dpb.spt*block.BLOCK_SECTOR_SIZE;
  const allowedPart=/^[A-Z0-9$#@!%&'()\-^_{}~]+$/;

  function normalizeName(value){
    const source=String(value??'').trim().toUpperCase();
    const pieces=source.split('.');
    if(pieces.length>2||!pieces[0]||pieces[0].length>8||(pieces[1]||'').length>3)throw new RangeError(`Invalid CP/M 8.3 name: ${value}`);
    const name=pieces[0],extension=pieces[1]||'';
    if(!allowedPart.test(name)||(extension&&!allowedPart.test(extension)))throw new RangeError(`Invalid CP/M filename characters: ${value}`);
    return {name,extension,full:extension?`${name}.${extension}`:name};
  }

  function bytesOf(value){
    if(value instanceof Uint8Array)return new Uint8Array(value);
    if(Array.isArray(value))return Uint8Array.from(value);
    if(typeof value==='string')return Uint8Array.from([...value].map(char=>{
      const code=char.charCodeAt(0);if(code>0x7F)throw new RangeError('CP/M starter text must be 7-bit ASCII');return code;
    }));
    throw new TypeError('CP/M file bytes must be Uint8Array, array or ASCII string');
  }

  function dataOffset(allocationBlock){
    const number=Number(allocationBlock);
    if(!Number.isInteger(number)||number<0||number>=CPM_TOTAL_BLOCKS)throw new RangeError(`Invalid CP/M allocation block ${allocationBlock}`);
    return CPM_FILESYSTEM_OFFSET+number*CPM_BLOCK_SIZE;
  }

  function writeName(entry,normalized){
    entry.fill(0x20,1,12);
    for(let index=0;index<normalized.name.length;index++)entry[1+index]=normalized.name.charCodeAt(index);
    for(let index=0;index<normalized.extension.length;index++)entry[9+index]=normalized.extension.charCodeAt(index);
  }

  function buildFilesystem(image,files){
    if(!(image instanceof Uint8Array)||image.length!==block.BLOCK_IMAGE_SIZE)throw new RangeError(`CP/M image must be ${block.BLOCK_IMAGE_SIZE} bytes`);
    if(!Array.isArray(files))throw new TypeError('CP/M files must be an array');
    const output=new Uint8Array(image);output.fill(block.BLOCK_BLANK_BYTE,CPM_FILESYSTEM_OFFSET);
    let directoryIndex=0,nextBlock=CPM_FIRST_DATA_BLOCK;
    const installed=[],seen=new Set();
    for(const source of files){
      const normalized=normalizeName(source.name);
      if(seen.has(normalized.full))throw new RangeError(`Duplicate CP/M filename ${normalized.full}`);seen.add(normalized.full);
      const bytes=bytesOf(source.bytes),padding=source.padding===undefined?CPM_TEXT_EOF:Number(source.padding)&0xFF;
      const records=Math.ceil(bytes.length/CPM_RECORD_SIZE),extentCount=Math.max(1,Math.ceil(records/CPM_EXTENT_RECORDS));
      const fileBlocks=[];
      for(let extentNumber=0;extentNumber<extentCount;extentNumber++){
        if(directoryIndex>=CPM_DIRECTORY_ENTRIES)throw new RangeError('CP/M directory is full');
        const firstRecord=extentNumber*CPM_EXTENT_RECORDS;
        const extentRecords=Math.min(CPM_EXTENT_RECORDS,Math.max(0,records-firstRecord));
        const blockCount=Math.ceil(extentRecords/(CPM_BLOCK_SIZE/CPM_RECORD_SIZE));
        if(nextBlock+blockCount>CPM_TOTAL_BLOCKS)throw new RangeError(`CP/M disk is full while adding ${normalized.full}`);
        const entry=new Uint8Array(CPM_DIRECTORY_ENTRY_SIZE),user=source.user===undefined?CPM_USER_DEFAULT:Number(source.user);
        if(!Number.isInteger(user)||user<0||user>15)throw new RangeError(`Invalid CP/M user for ${normalized.full}`);entry[0]=user;
        writeName(entry,normalized);entry[12]=extentNumber&0x1F;entry[13]=0;entry[14]=(extentNumber>>5)&0x3F;entry[15]=extentRecords;
        for(let index=0;index<blockCount;index++){
          const allocationBlock=nextBlock++;entry[16+index]=allocationBlock;fileBlocks.push(allocationBlock);
          const target=dataOffset(allocationBlock);output.fill(padding,target,target+CPM_BLOCK_SIZE);
          const sourceOffset=(firstRecord*CPM_RECORD_SIZE)+(index*CPM_BLOCK_SIZE);
          output.set(bytes.slice(sourceOffset,sourceOffset+CPM_BLOCK_SIZE),target);
        }
        output.set(entry,CPM_FILESYSTEM_OFFSET+directoryIndex*CPM_DIRECTORY_ENTRY_SIZE);directoryIndex++;
      }
      installed.push(Object.freeze({name:normalized.full,user:source.user??CPM_USER_DEFAULT,size:bytes.length,records,blocks:Object.freeze(fileBlocks),extents:extentCount}));
    }
    return {image:output,files:Object.freeze(installed),directoryEntries:directoryIndex,nextFreeBlock:nextBlock};
  }

  function readDirectory(image){
    if(!(image instanceof Uint8Array)||image.length!==block.BLOCK_IMAGE_SIZE)throw new RangeError(`CP/M image must be ${block.BLOCK_IMAGE_SIZE} bytes`);
    const entries=[];
    for(let index=0;index<CPM_DIRECTORY_ENTRIES;index++){
      const offset=CPM_FILESYSTEM_OFFSET+index*CPM_DIRECTORY_ENTRY_SIZE,user=image[offset];if(user===block.BLOCK_BLANK_BYTE)continue;
      const clean=(start,length)=>String.fromCharCode(...image.slice(offset+start,offset+start+length).map(value=>value&0x7F)).trimEnd();
      const name=clean(1,8),extension=clean(9,3),blocks=[];
      for(let pointer=0;pointer<16;pointer++){const value=image[offset+16+pointer];if(value)blocks.push(value);}
      entries.push(Object.freeze({index,user,name:extension?`${name}.${extension}`:name,extent:(image[offset+14]<<5)|(image[offset+12]&0x1F),records:image[offset+15],blocks:Object.freeze(blocks)}));
    }
    return Object.freeze(entries);
  }

  return {
    CPM_DIRECTORY_ENTRY_SIZE,CPM_RECORD_SIZE,CPM_EXTENT_RECORDS,CPM_TEXT_EOF,CPM_USER_DEFAULT,
    CPM_BLOCK_SIZE,CPM_DIRECTORY_ENTRIES,CPM_DIRECTORY_BYTES,CPM_DIRECTORY_BLOCKS,CPM_FIRST_DATA_BLOCK,CPM_TOTAL_BLOCKS,CPM_FILESYSTEM_OFFSET,
    normalizeName,dataOffset,buildFilesystem,readDirectory
  };
});
