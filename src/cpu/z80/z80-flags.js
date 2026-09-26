(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.SHINO_Z80_FLAGS=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const FLAG_BITS=Object.freeze({S:7,Z:6,Y:5,H:4,X:3,PV:2,N:1,C:0});
  const FLAG_MASK=Object.freeze({
    S:0x80,Z:0x40,Y:0x20,H:0x10,X:0x08,PV:0x04,N:0x02,C:0x01
  });
  const YX_MASK=FLAG_MASK.Y|FLAG_MASK.X;

  function flagState(f){
    const v=Number(f)&0xFF;
    return Object.fromEntries(Object.entries(FLAG_BITS).map(([name,bit])=>[name,!!(v&(1<<bit))]));
  }
  function parityEven(value){
    let v=Number(value)&0xFF,p=0;
    for(let i=0;i<8;i++){p^=v&1;v>>=1;}
    return p===0;
  }
  function preserveYX(oldF){return Number(oldF)&YX_MASK;}
  function sz(oldF,result){
    const r=Number(result)&0xFF;
    let f=preserveYX(oldF);
    if(r&0x80)f|=FLAG_MASK.S;
    if(r===0)f|=FLAG_MASK.Z;
    return f;
  }

  function inc8(oldF,value){
    const before=Number(value)&0xFF,result=(before+1)&0xFF;
    let f=preserveYX(oldF)|(Number(oldF)&FLAG_MASK.C);
    if(result&0x80)f|=FLAG_MASK.S;
    if(result===0)f|=FLAG_MASK.Z;
    if((before&0x0F)===0x0F)f|=FLAG_MASK.H;
    if(before===0x7F)f|=FLAG_MASK.PV;
    return {result,f};
  }
  function dec8(oldF,value){
    const before=Number(value)&0xFF,result=(before-1)&0xFF;
    let f=preserveYX(oldF)|(Number(oldF)&FLAG_MASK.C)|FLAG_MASK.N;
    if(result&0x80)f|=FLAG_MASK.S;
    if(result===0)f|=FLAG_MASK.Z;
    if((before&0x0F)===0x00)f|=FLAG_MASK.H;
    if(before===0x80)f|=FLAG_MASK.PV;
    return {result,f};
  }

  function add8(oldF,a,b,carry=0){
    const av=Number(a)&0xFF,bv=Number(b)&0xFF,c=carry?1:0;
    const sum=av+bv+c,result=sum&0xFF;
    let f=sz(oldF,result);
    if(((av&0x0F)+(bv&0x0F)+c)>0x0F)f|=FLAG_MASK.H;
    if((~(av^bv)&(av^result)&0x80)!==0)f|=FLAG_MASK.PV;
    if(sum>0xFF)f|=FLAG_MASK.C;
    return {result,f};
  }
  function sub8(oldF,a,b,carry=0){
    const av=Number(a)&0xFF,bv=Number(b)&0xFF,c=carry?1:0;
    const diff=av-bv-c,result=diff&0xFF;
    let f=sz(oldF,result)|FLAG_MASK.N;
    if(((av&0x0F)-(bv&0x0F)-c)<0)f|=FLAG_MASK.H;
    if(((av^bv)&(av^result)&0x80)!==0)f|=FLAG_MASK.PV;
    if(diff<0)f|=FLAG_MASK.C;
    return {result,f};
  }
  function logicFlags(oldF,result,h){
    const r=Number(result)&0xFF;
    let f=sz(oldF,r);
    if(h)f|=FLAG_MASK.H;
    if(parityEven(r))f|=FLAG_MASK.PV;
    return f;
  }
  function and8(oldF,a,b){const result=(Number(a)&Number(b))&0xFF;return {result,f:logicFlags(oldF,result,true)};}
  function xor8(oldF,a,b){const result=(Number(a)^Number(b))&0xFF;return {result,f:logicFlags(oldF,result,false)};}
  function or8(oldF,a,b){const result=(Number(a)|Number(b))&0xFF;return {result,f:logicFlags(oldF,result,false)};}
  function cp8(oldF,a,b){return sub8(oldF,a,b,0);}

  function add16HL(oldF,a,b){
    const av=Number(a)&0xFFFF,bv=Number(b)&0xFFFF,sum=av+bv,result=sum&0xFFFF;
    let f=Number(oldF)&(FLAG_MASK.S|FLAG_MASK.Z|FLAG_MASK.PV|YX_MASK);
    if(((av&0x0FFF)+(bv&0x0FFF))>0x0FFF)f|=FLAG_MASK.H;
    if(sum>0xFFFF)f|=FLAG_MASK.C;
    return {result,f};
  }

  function rotateAccumulator(oldF,a,kind){
    const av=Number(a)&0xFF,oldC=(Number(oldF)&FLAG_MASK.C)?1:0;
    let result=av,carry=0;
    switch(kind){
      case 'RLCA':carry=(av>>7)&1;result=((av<<1)|carry)&0xFF;break;
      case 'RRCA':carry=av&1;result=((carry<<7)|(av>>1))&0xFF;break;
      case 'RLA':carry=(av>>7)&1;result=((av<<1)|oldC)&0xFF;break;
      case 'RRA':carry=av&1;result=((oldC<<7)|(av>>1))&0xFF;break;
      default:throw new Error('UNKNOWN ACC ROTATE '+kind);
    }
    let f=Number(oldF)&(FLAG_MASK.S|FLAG_MASK.Z|FLAG_MASK.PV|YX_MASK);
    if(carry)f|=FLAG_MASK.C;
    return {result,f};
  }

  function daa8(oldF,a){
    const av=Number(a)&0xFF;
    const n=!!(oldF&FLAG_MASK.N),oldC=!!(oldF&FLAG_MASK.C),oldH=!!(oldF&FLAG_MASK.H);
    let correction=0,carry=oldC;
    // Z80 DAA correction selection is driven by the current digits plus H/C.
    // N selects whether that correction is added or subtracted.
    if(oldH||(av&0x0F)>9)correction|=0x06;
    if(oldC||av>0x99){correction|=0x60;carry=true;}
    const result=(n?av-correction:av+correction)&0xFF;
    let f=preserveYX(oldF);
    if(result&0x80)f|=FLAG_MASK.S;
    if(result===0)f|=FLAG_MASK.Z;
    if(((av^result)&0x10)!==0)f|=FLAG_MASK.H;
    if(parityEven(result))f|=FLAG_MASK.PV;
    if(n)f|=FLAG_MASK.N;
    if(carry)f|=FLAG_MASK.C;
    return {result,f};
  }

  function rotateShift8(oldF,value,kind){
    const v=Number(value)&255,c=oldF&1;let result,carry;
    switch(kind){
      case 'RLC':carry=v>>>7;result=((v<<1)|carry)&255;break;
      case 'RRC':carry=v&1;result=(v>>>1)|(carry<<7);break;
      case 'RL':carry=v>>>7;result=((v<<1)|c)&255;break;
      case 'RR':carry=v&1;result=(v>>>1)|(c<<7);break;
      case 'SLA':carry=v>>>7;result=(v<<1)&255;break;
      case 'SRA':carry=v&1;result=(v>>>1)|(v&128);break;
      case 'SLL':carry=v>>>7;result=((v<<1)|1)&255;break;
      case 'SRL':carry=v&1;result=v>>>1;break;
      default:throw new Error('UNKNOWN CB ROTATE '+kind);
    }
    return {result,f:logicFlags(oldF,result,false)|carry};
  }
  function bitTest8(oldF,value,bit){
    const set=(value&(1<<bit))!==0;
    return preserveYX(oldF)|(oldF&FLAG_MASK.C)|FLAG_MASK.H|
      (set?0:FLAG_MASK.Z|FLAG_MASK.PV)|(bit===7&&set?FLAG_MASK.S:0);
  }

  function carryArithmetic16(oldF,a,b,subtract){
    const av=a&65535,bv=b&65535,c=oldF&1,total=subtract?av-bv-c:av+bv+c,result=total&65535;
    let f=preserveYX(oldF)|(result&0x8000?0x80:0)|(result===0?0x40:0)|(subtract?2:0);
    if((av^bv^result)&0x1000)f|=0x10;
    if((subtract?(av^bv)&(av^result):~(av^bv)&(av^result))&0x8000)f|=4;
    if(total<0||total>65535)f|=1;
    return {result,f};
  }

  function blockIoFlags(oldF,b,value,sum,repeating){
    let f=sz(oldF,b)|(value&128?2:0)|(sum>255?0x11:0);
    let parity=parityEven((sum&7)^b);
    // Extra repeat cycles alter H/PV: David Banks hardware findings.
    if(repeating){
      const carry=sum>255,negative=!!(value&128);
      const adjusted=carry?b+(negative?-1:1):b;
      parity=parity===parityEven(adjusted&7);
      if(carry)f=(f&~0x10)|((b&15)===(negative?0:15)?0x10:0);
    }
    return f|(parity?4:0);
  }

  return {
    carryArithmetic16,blockIoFlags,logicFlags,
    rotateShift8,bitTest8,
    FLAG_BITS,FLAG_MASK,flagState,parityEven,
    inc8,dec8,add8,sub8,and8,xor8,or8,cp8,
    add16HL,rotateAccumulator,daa8
  };
});
