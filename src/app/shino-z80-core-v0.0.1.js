(function(){
  'use strict';
  const {Shino80Bus}=globalThis.SHINO_BUS;
  const {Z80Core,flagState}=globalThis.SHINO_Z80;
  const bus=new Shino80Bus({traceLimit:192});
  const cpu=new Z80Core(bus);
  bus.load(new Uint8Array(0x10000).fill(0x00));
  cpu.reset();

  const $=s=>document.querySelector(s);
  const $$=s=>[...document.querySelectorAll(s)];
  let timer=null;
  let runningVisual=false;
  let lastFetchAddress=0;
  let pulseTimer=null;

  function hex(v,w=2){return (Number(v)>>>0).toString(16).toUpperCase().padStart(w,'0');}
  function bits(v,width){return Array.from({length:width},(_,i)=>Boolean(v&(1<<(width-1-i))));}

  function makeLeds(container,width,color='green'){
    container.innerHTML='';
    for(let i=0;i<width;i++){
      const e=document.createElement('span');
      e.className=`led ${color}`;
      e.dataset.bit=String(width-1-i);
      container.appendChild(e);
    }
  }

  function setLeds(container,value,width){
    const a=bits(value,width);
    [...container.children].forEach((e,i)=>e.classList.toggle('on',a[i]));
  }

  function createRegRow(name,width){
    const row=document.createElement('div');row.className='regRow';row.dataset.reg=name;
    row.innerHTML=`<div class="regName">${name}</div><div class="regHex">0000</div><div class="leds"></div>`;
    makeLeds(row.querySelector('.leds'),width,width===16?'amber':'green');
    return row;
  }

  const regDefs=[
    ['A',8,'a'],['F',8,'f'],['B',8,'b'],['C',8,'c'],['D',8,'d'],['E',8,'e'],['H',8,'h'],['L',8,'l'],
    ["A'",8,'aAlt'],["F'",8,'fAlt'],["B'",8,'bAlt'],["C'",8,'cAlt'],["D'",8,'dAlt'],["E'",8,'eAlt'],["H'",8,'hAlt'],["L'",8,'lAlt'],
    ['IX',16,'ix'],['IY',16,'iy'],['SP',16,'sp'],['PC',16,'pc'],['I',8,'i'],['R',8,'r']
  ];
  const regGrid=$('#regGrid');
  for(const [label,width,key] of regDefs){const row=createRegRow(label,width);row.dataset.key=key;regGrid.appendChild(row);}

  makeLeds($('#addrLeds'),16,'amber');
  makeLeds($('#dataLeds'),8,'green');

  function updateRegisters(){
    const s=cpu.state;
    for(const row of $$('#regGrid .regRow')){
      const def=regDefs.find(d=>d[2]===row.dataset.key); if(!def)continue;
      const width=def[1],v=s[row.dataset.key];
      row.querySelector('.regHex').textContent=hex(v,width===16?4:2);
      setLeds(row.querySelector('.leds'),v,width);
    }
    const flags=flagState(s.f);
    for(const e of $$('.flag')){
      e.querySelector('.led').classList.toggle('on',!!flags[e.dataset.flag]);
    }
    $('#iff1').textContent=s.iff1?'1':'0';
    $('#iff2').textContent=s.iff2?'1':'0';
    $('#im').textContent=String(s.im);
    $('#tstates').textContent=String(s.tStates).padStart(9,'0');
    $('#icount').textContent=String(s.instructions).padStart(7,'0');
  }

  function updateInstruction(){
    const i=cpu.lastInstruction;
    if(!i){$('#instPc').textContent='0000';$('#instMnemonic').textContent='RESET';$('#instOpcode').textContent='--';return;}
    $('#instPc').textContent=hex(i.address,4);
    $('#instMnemonic').textContent=i.mnemonic;
    $('#instOpcode').textContent=hex(i.opcode,2);
  }

  function updateBus(){
    const trace=bus.trace.filter(e=>e.operation!=='RESET');
    const fetch=[...trace].reverse().find(e=>e.purpose==='OPCODE_FETCH');
    if(fetch){
      lastFetchAddress=fetch.address;
      setLeds($('#addrLeds'),fetch.address,16);$('#addrHex').textContent=hex(fetch.address,4);
      setLeds($('#dataLeds'),fetch.data,8);$('#dataHex').textContent=hex(fetch.data,2);
    }
  }

  function pulseSignals(events){
    const active=new Set(events.flatMap(e=>e.signals||[]));
    if(cpu.state.halted)active.add('HALT');
    if(cpu.state.intLine)active.add('INT');
    if(cpu.state.nmiLine)active.add('NMI');
    if(cpu.state.waitLine)active.add('WAIT');
    for(const e of $$('.signal'))e.querySelector('.led').classList.toggle('on',active.has(e.dataset.signal));
    clearTimeout(pulseTimer);
    pulseTimer=setTimeout(()=>{for(const e of $$('.signal .led'))e.classList.remove('on');},180);
  }

  function updateTrace(){
    const e=$('#trace');e.innerHTML='';
    const rows=bus.trace.slice(-24);
    for(const t of rows){
      const div=document.createElement('div');div.className='traceLine';
      const addr=t.address===null?'----':hex(t.address,4);
      const data=t.data===null?'--':hex(t.data,2);
      div.innerHTML=`<span class="t">T+${t.tState}</span><span class="kind">${t.purpose}</span><span class="addr">${addr}:${data}</span><span class="sig">${(t.signals||[]).join(' ')}</span>`;
      e.appendChild(div);
    }
    e.scrollTop=e.scrollHeight;
  }

  function updateMemory(){
    const root=$('#memory');root.innerHTML='';
    for(let base=0;base<64;base+=16){
      const line=document.createElement('div');line.className='memLine';
      const cells=[];
      for(let i=0;i<16;i++){
        const a=base+i,v=bus.debugPeek(a);
        cells.push(`<span class="${a===lastFetchAddress?'hot':''}">${hex(v,2)}</span>`);
      }
      line.innerHTML=`<span class="memAddr">${hex(base,4)}</span><span class="memBytes">${cells.join(' ')}</span>`;
      root.appendChild(line);
    }
  }

  function render(){updateRegisters();updateInstruction();updateBus();updateTrace();updateMemory();}

  function stepOne(){
    const before=bus.trace.length;
    try{
      cpu.step();
      const events=bus.trace.slice(before);
      pulseSignals(events);
      $('#runState').textContent=runningVisual?'VISUAL RUN':'READY';$('#runState').style.color='var(--green)';
      render();
    }catch(err){
      stop();
      $('#runState').textContent='FAULT';$('#runState').style.color='var(--red)';
      $('#fault').textContent=String(err.message||err);
    }
  }

  function run(){if(timer)return;runningVisual=true;$('#runState').textContent='VISUAL RUN';timer=setInterval(stepOne,125);}
  function stop(){runningVisual=false;if(timer){clearInterval(timer);timer=null;}$('#runState').textContent='READY';}
  function reset(){stop();cpu.reset();bus.clearTrace();lastFetchAddress=0;$('#fault').textContent='';render();pulseSignals([{signals:['RESET']}]);}
  function burst(){
    stop();
    const before=bus.trace.length;
    try{
      cpu.runInstructions(256);
      pulseSignals(bus.trace.slice(before));
      $('#runState').textContent='READY';$('#runState').style.color='var(--green)';
      render();
    }catch(err){
      $('#runState').textContent='FAULT';$('#runState').style.color='var(--red)';
      $('#fault').textContent=String(err.message||err);
    }
  }
  function clearTrace(){bus.clearTrace();render();}

  $('#resetBtn').addEventListener('click',reset);
  $('#stepBtn').addEventListener('click',stepOne);
  $('#runBtn').addEventListener('click',run);
  $('#pauseBtn').addEventListener('click',stop);
  $('#burstBtn').addEventListener('click',burst);
  $('#clearBtn').addEventListener('click',clearTrace);

  function selfTest(){
    const tBus=new Shino80Bus();const tCpu=new Z80Core(tBus);tBus.load([0x00]);tCpu.reset();tBus.clearTrace();
    const r=tCpu.step();
    return r.mnemonic==='NOP'&&tCpu.state.pc===1&&tCpu.state.r===1&&tCpu.state.tStates===4&&tBus.trace.length===2;
  }
  const ok=selfTest();$('#selfTest').textContent=ok?'NOP SELF TEST PASS':'SELF TEST FAIL';$('#selfTest').classList.toggle('warn',!ok);
  render();
})();
