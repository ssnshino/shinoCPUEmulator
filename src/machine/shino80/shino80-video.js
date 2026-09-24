(function(root,factory){
  const cgApi=(typeof module==='object'&&module.exports)?require('../../firmware/shino80/shino80-cgrom.js'):root.SHINO_CGROM;
  const api=factory(cgApi);
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.SHINO_VIDEO=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(cgApi){
  'use strict';
  if(!cgApi||!cgApi.CG_ROM_IMAGE)throw new Error('SHINO VIDEO: CG-ROM missing');

  const TEXT_VRAM_BASE=0xC000,COLS=80,ROWS=25,CELL_COUNT=COLS*ROWS;
  const GW=cgApi.GLYPH_WIDTH,GH=cgApi.GLYPH_HEIGHT;
  const SCREEN_W=COLS*GW,SCREEN_H=ROWS*GH;
  const VIDEO_SIGNAL=Object.freeze({
    interface:'DIGITAL_MONO',
    width:SCREEN_W,
    height:SCREEN_H,
    pixelAspect:1,
    textColumns:COLS,
    textRows:ROWS
  });

  class Shino80TextVideo{
    constructor(bus,canvas,{vramBase=TEXT_VRAM_BASE,cgRom=cgApi.CG_ROM_IMAGE}={}){
      if(!bus)throw new TypeError('Shino80TextVideo requires bus');
      if(!canvas||typeof canvas.getContext!=='function')throw new TypeError('Shino80TextVideo requires canvas');
      this.bus=bus;this.canvas=canvas;this.vramBase=vramBase&0xFFFF;this.cgRom=cgRom;this.signal=VIDEO_SIGNAL;
      canvas.width=SCREEN_W;canvas.height=SCREEN_H;
      this.ctx=canvas.getContext('2d',{alpha:false});
      this.ctx.imageSmoothingEnabled=false;
      this.lastCells=new Uint8Array(CELL_COUNT);
      this.powered=false;
      this.clearScreen();
    }
    clearScreen(){
      this.ctx.fillStyle='#06100A';
      this.ctx.fillRect(0,0,SCREEN_W,SCREEN_H);
      this.lastCells.fill(0);
    }
    setPower(on){
      this.powered=!!on;
      this.clearScreen();
      return this.powered;
    }
    drawCell(index,code){
      const col=index%COLS,row=Math.floor(index/COLS),x0=col*GW,y0=row*GH;
      this.ctx.fillStyle='#06100A';
      this.ctx.fillRect(x0,y0,GW,GH);
      const base=(code&0xFF)*GH;
      this.ctx.fillStyle='#8FFFAE';
      for(let y=0;y<GH;y++){
        const bits=this.cgRom[base+y];
        if(!bits)continue;
        for(let x=0;x<GW;x++)if(bits&(0x80>>x))this.ctx.fillRect(x0+x,y0+y,1,1);
      }
    }
    render(){
      if(!this.powered)return 0;
      let changed=0;
      for(let i=0;i<CELL_COUNT;i++){
        const code=this.bus.debugPeek(this.vramBase+i);
        if(code===this.lastCells[i])continue;
        this.lastCells[i]=code;
        this.drawCell(i,code);
        changed++;
      }
      return changed;
    }
    readRow(row){
      const r=Math.max(0,Math.min(ROWS-1,Number(row)|0));
      let out='';
      for(let c=0;c<COLS;c++){
        const code=this.bus.debugPeek(this.vramBase+r*COLS+c);
        out+=code>=32&&code<=126?String.fromCharCode(code):' ';
      }
      return out;
    }
  }

  return {Shino80TextVideo,TEXT_VRAM_BASE,COLS,ROWS,CELL_COUNT,SCREEN_W,SCREEN_H,VIDEO_SIGNAL};
});