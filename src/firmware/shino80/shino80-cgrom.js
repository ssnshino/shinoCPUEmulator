(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.SHINO_CGROM=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const GLYPH_WIDTH=8,GLYPH_HEIGHT=16,GLYPH_COUNT=256,CG_ROM_BYTES=GLYPH_HEIGHT*GLYPH_COUNT;

  // Original SHINO-80 5x7 bring-up font, expanded to 8x16 at ROM-build time.
  const G={
    ' ':[0,0,0,0,0,0,0],
    'A':[14,17,17,31,17,17,17],'B':[30,17,17,30,17,17,30],
    'C':[14,17,16,16,16,17,14],'D':[30,17,17,17,17,17,30],
    'E':[31,16,16,30,16,16,31],'F':[31,16,16,30,16,16,16],
    'G':[14,17,16,23,17,17,15],'H':[17,17,17,31,17,17,17],
    'I':[14,4,4,4,4,4,14],'J':[7,2,2,2,18,18,12],
    'K':[17,18,20,24,20,18,17],'L':[16,16,16,16,16,16,31],
    'M':[17,27,21,21,17,17,17],'N':[17,25,21,19,17,17,17],
    'O':[14,17,17,17,17,17,14],'P':[30,17,17,30,16,16,16],
    'Q':[14,17,17,17,21,18,13],'R':[30,17,17,30,20,18,17],
    'S':[15,16,16,14,1,1,30],'T':[31,4,4,4,4,4,4],
    'U':[17,17,17,17,17,17,14],'V':[17,17,17,17,17,10,4],
    'W':[17,17,17,21,21,21,10],'X':[17,17,10,4,10,17,17],
    'Y':[17,17,10,4,4,4,4],'Z':[31,1,2,4,8,16,31],
    '0':[14,17,19,21,25,17,14],'1':[4,12,4,4,4,4,14],
    '2':[14,17,1,2,4,8,31],'3':[30,1,1,14,1,1,30],
    '4':[2,6,10,18,31,2,2],'5':[31,16,16,30,1,1,30],
    '6':[14,16,16,30,17,17,14],'7':[31,1,2,4,8,8,8],
    '8':[14,17,17,14,17,17,14],'9':[14,17,17,15,1,1,14],
    '-':[0,0,0,31,0,0,0],'*':[0,21,14,31,14,21,0],
    ':':[0,4,4,0,4,4,0],'.':[0,0,0,0,0,12,12],
    '>':[16,8,4,2,4,8,16],'<':[1,2,4,8,4,2,1],
    '/':[1,2,2,4,8,8,16],'?':[14,17,1,2,4,0,4],
    '!':[4,4,4,4,4,0,4],'_':[0,0,0,0,0,0,31]
  };

  function buildCgRom(){
    const rom=new Uint8Array(CG_ROM_BYTES);
    for(const [ch,rows] of Object.entries(G)){
      const code=ch.charCodeAt(0)&0xFF,base=code*GLYPH_HEIGHT;
      for(let r=0;r<7;r++){
        const bits=(rows[r]&0x1F)<<1;
        const y=1+r*2;
        rom[base+y]=bits;
        rom[base+y+1]=bits;
      }
    }
    return rom;
  }

  const CG_ROM_IMAGE=buildCgRom();
  return {GLYPH_WIDTH,GLYPH_HEIGHT,GLYPH_COUNT,CG_ROM_BYTES,CG_ROM_IMAGE,buildCgRom};
});