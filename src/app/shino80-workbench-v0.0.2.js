(function(){
  'use strict';
  const {Shino80Bus}=globalThis.SHINO_BUS;
  const {Z80Core,flagState}=globalThis.SHINO_Z80;
  const bus=new Shino80Bus({traceLimit:512});
  const cpu=new Z80Core(bus);
  bus.load(new Uint8Array(0x10000).fill(0x00));
  const teachingProgram=new Uint8Array([
    0x3E,0x41,
    0x06,0x22,
    0x21,0x80,0x00,
    0x77,
    0x4E,
    0x11,0x90,0x00,
    0x12,
    0x3A,0x90,0x00,
    0x00
  ]);
  bus.load(teachingProgram,0x0000);
  cpu.reset();

  const queryOne=s=>document.querySelector(s);
  const queryAll=s=>[...document.querySelectorAll(s)];
  const hex=(v,w=2)=>(Number(v)>>>0).toString(16).toUpperCase().padStart(w,'0');
  const bits=(v,width)=>Array.from({length:width},(_,i)=>Boolean(v&(1<<(width-1-i))));

  const ui={view:'display',running:false,paceIndex:0,traceOpen:matchMedia('(min-width:1200px)').matches,selectedDevice:'fdd-a',dirty:true,lastFetchAddress:0,pulseUntil:0,activeSignals:new Set()};
  const paces=[{label:'VISUAL',mode:'interval',ms:125,batch:1},{label:'FAST',mode:'interval',ms:16,batch:8},{label:'MAX',mode:'raf',ms:0,batch:256}];
  let runTimer=null;
  let morePreviousFocus=null;

  const devices=[
    {id:'fdd-a',icon:'A:',name:'FDD A',desc:'Floppy Disk Drive',state:'RESERVED'},
    {id:'fdd-b',icon:'B:',name:'FDD B',desc:'Floppy Disk Drive',state:'RESERVED'},
    {id:'uart',icon:'⇄',name:'RS-232C',desc:'UART / Virtual Modem',state:'RESERVED'},
    {id:'printer',icon:'PR',name:'PRINTER',desc:'Parallel printer interface',state:'RESERVED'},
    {id:'timer',icon:'T',name:'TIMER',desc:'System timer',state:'RESERVED'},
    {id:'psg',icon:'♪',name:'PSG',desc:'Sound generator slot',state:'RESERVED'}
  ];

  function makeLeds(container,width,color='green'){
    container.innerHTML='';
    for(let i=0;i<width;i++){const e=document.createElement('span');e.className=`led ${color}`;container.appendChild(e);}
  }
  function setLeds(container,value,width){const b=bits(value,width);[...container.children].forEach((e,i)=>e.classList.toggle('on',b[i]));}

  const regDefs=[['A',8,'a'],['F',8,'f'],['B',8,'b'],['C',8,'c'],['D',8,'d'],['E',8,'e'],['H',8,'h'],['L',8,'l'],["A'",8,'aAlt'],["F'",8,'fAlt'],["B'",8,'bAlt'],["C'",8,'cAlt'],["D'",8,'dAlt'],["E'",8,'eAlt'],["H'",8,'hAlt'],["L'",8,'lAlt'],['IX',16,'ix'],['IY',16,'iy'],['SP',16,'sp'],['PC',16,'pc'],['I',8,'i'],['R',8,'r']];
  const flagDefs=['S','Z','Y','H','X','PV','N','C'];

  function buildStaticUi(){
    makeLeds(queryOne('#addrLeds'),16,'amber');makeLeds(queryOne('#dataLeds'),8,'green');
    const rg=queryOne('#regGrid');
    regDefs.forEach(([label,width,key])=>{const row=document.createElement('div');row.className='regrow';row.dataset.key=key;row.dataset.width=width;row.innerHTML=`<span class="regname">${label}</span><span class="reghex">${'0'.repeat(width===16?4:2)}</span><span class="leds"></span>`;makeLeds(row.querySelector('.leds'),width,width===16?'amber':'green');rg.appendChild(row);});
    const fg=queryOne('#flagGrid');flagDefs.forEach(name=>{const e=document.createElement('div');e.className='flag';e.dataset.flag=name;e.innerHTML=`<span class="led green"></span>${name==='PV'?'P/V':name}`;fg.appendChild(e);});
    const bsg=queryOne('#busSignalGrid');['M1','MREQ','IORQ','RD','WR','RFSH','HALT','WAIT','INT','NMI'].forEach(name=>{const color=name==='RFSH'?'blue':(['HALT','WAIT','INT','NMI'].includes(name)?'amber':'green');const e=document.createElement('div');e.className='signal';e.dataset.signal=name;e.innerHTML=`<span class="led ${color}"></span>${name}`;bsg.appendChild(e);});
    renderDevices();
  }

  function renderDevices(){
    const root=queryOne('#deviceList');root.innerHTML='';devices.forEach(d=>{const row=document.createElement('div');row.className='device-row'+(ui.selectedDevice===d.id?' selected':'');row.dataset.device=d.id;row.innerHTML=`<div class="device-icon">${d.icon}</div><div><div class="device-name">${d.name}</div><div class="device-desc">${d.desc}</div></div><div class="device-state reserved">${d.state}</div>`;row.addEventListener('click',()=>{ui.selectedDevice=d.id;renderDevices();renderInspector();});root.appendChild(row);});
  }

  function setView(view){
    ui.view=view;queryAll('[data-view-panel]').forEach(e=>e.classList.toggle('active',e.dataset.viewPanel===view));queryAll('[data-view]').forEach(e=>e.setAttribute('aria-selected',String(e.dataset.view===view)));ui.dirty=true;renderInspector();
  }

  function updateRegisters(){
    const s=cpu.state;queryAll('#regGrid .regrow').forEach(row=>{const width=Number(row.dataset.width),v=s[row.dataset.key];row.querySelector('.reghex').textContent=hex(v,width===16?4:2);setLeds(row.querySelector('.leds'),v,width);});
    const f=flagState(s.f);queryAll('#flagGrid .flag').forEach(e=>e.querySelector('.led').classList.toggle('on',!!f[e.dataset.flag]));
    queryOne('#iff1').textContent=s.iff1?'1':'0';queryOne('#iff2').textContent=s.iff2?'1':'0';queryOne('#im').textContent=String(s.im);queryOne('#tstates').textContent=String(s.tStates);queryOne('#icount').textContent=String(s.instructions);
    queryOne('#displayPc').textContent=hex(s.pc,4);queryOne('#displayR').textContent=hex(s.r,2);queryOne('#displayT').textContent=String(s.tStates);queryOne('#displayInst').textContent=cpu.lastInstruction?cpu.lastInstruction.mnemonic:'RESET';
    queryOne('#statusPc').textContent=hex(s.pc,4);queryOne('#statusR').textContent=hex(s.r,2);queryOne('#statusT').textContent=String(s.tStates);
  }

  function lastFetch(){return [...bus.trace].reverse().find(e=>e.purpose==='OPCODE_FETCH')||null;}
  function updateBusLeds(){const f=lastFetch();if(f){ui.lastFetchAddress=f.address;setLeds(queryOne('#addrLeds'),f.address,16);setLeds(queryOne('#dataLeds'),f.data,8);queryOne('#addrHex').textContent=hex(f.address,4);queryOne('#dataHex').textContent=hex(f.data,2);queryOne('#busLastAddr').textContent=hex(f.address,4);queryOne('#busLastData').textContent=hex(f.data,2);}}
  function updateSignalLamps(){const now=performance.now(),active=now<ui.pulseUntil?ui.activeSignals:new Set();queryAll('[data-signal]').forEach(e=>{const lamp=e.querySelector('.led');if(lamp)lamp.classList.toggle('on',active.has(e.dataset.signal));});}

  function traceHtml(events){return events.map(t=>{const addr=t.address==null?'----':hex(t.address,4),data=t.data==null?'--':hex(t.data,2);return `<div class="trace-line"><span class="t">T+${t.tState}</span><span class="kind">${t.purpose}</span><span class="addr">${addr}:${data}</span><span class="sig">${(t.signals||[]).join(' ')}</span></div>`;}).join('');}
  function updateTrace(){const rows=bus.trace.slice(-120);queryOne('#busTrace').innerHTML=traceHtml(rows);queryOne('#tracePanelBody').innerHTML=traceHtml(rows.slice(-40));queryOne('#traceSummary').textContent=`${bus.trace.length} events`;}

  function updateMemory(){const root=queryOne('#memoryGrid');let html='';for(let base=0;base<0x100;base+=16){const cells=[];for(let i=0;i<16;i++){const a=base+i,v=bus.debugPeek(a);cells.push(`<span class="${a===ui.lastFetchAddress?'hot':''}">${hex(v,2)}</span>`);}html+=`<div class="memline"><span class="memaddr">${hex(base,4)}</span><span class="membytes">${cells.join(' ')}</span></div>`;}root.innerHTML=html;}

  function renderInspector(){
    const s=cpu.state,root=queryOne('#inspectorContent');let html=`<div class="inspector-head"><h2>${ui.view.toUpperCase()} INSPECTOR</h2><span class="eyebrow">context</span></div>`;
    if(ui.view==='display')html+=`<div class="inspector-section"><div class="inspector-chip"><span class="dot ok"></span>CPU HEARTBEAT</div><div class="inspector-chip"><span class="dot info"></span>VIDEO RESERVED</div></div><div class="inspector-section"><div class="inspector-kv"><span>PC</span><b>${hex(s.pc,4)}h</b></div><div class="inspector-kv"><span>R</span><b>${hex(s.r,2)}h</b></div><div class="inspector-kv"><span>T-states</span><b>${s.tStates}</b></div></div><div class="inspector-section inspector-note">DISPLAY is the future primary human interface to SHINO-80. This placeholder is intentionally separate from CPU/Bus observation tools.</div>`;
    if(ui.view==='cpu'){const li=cpu.lastInstruction;const current=li?`${hex(li.opcode,2)}h ${li.mnemonic}`:'-- RESET';html+=`<div class="inspector-section"><div class="inspector-kv"><span>Current instruction</span><b>${current}</b></div><div class="inspector-kv"><span>Decoder</span><b>BASE / LD ONLINE</b></div><div class="inspector-kv"><span>Accuracy</span><b>Level 1</b></div><div class="inspector-kv"><span>Bus trace</span><b>M-cycle abstract</b></div></div><div class="inspector-section inspector-note">PHASE 1A implements the first real load-instruction paths: register, immediate, indirect and absolute memory forms.</div>`;}
    if(ui.view==='memory')html+=`<div class="inspector-section"><div class="inspector-kv"><span>Address space</span><b>64 KiB bench</b></div><div class="inspector-kv"><span>Last fetch</span><b>${hex(ui.lastFetchAddress,4)}h</b></div></div><div class="inspector-section inspector-note">Memory Inspector uses DEBUG PEEK and does not create CPU MREQ/RD trace events.</div>`;
    if(ui.view==='bus')html+=`<div class="inspector-section"><div class="inspector-kv"><span>Events retained</span><b>${bus.trace.length}</b></div><div class="inspector-kv"><span>Precision</span><b>M_CYCLE_ABSTRACT</b></div></div><div class="inspector-section inspector-note">Pin-perfect T-state waveforms are not implemented in v0.0.2.</div>`;
    if(ui.view==='devices'){const d=devices.find(x=>x.id===ui.selectedDevice)||devices[0];html+=`<div class="inspector-section"><div class="inspector-kv"><span>Selected</span><b>${d.name}</b></div><div class="inspector-kv"><span>Status</span><b>${d.state}</b></div></div><div class="inspector-section inspector-note">The Device Dock reserves information architecture only. No FDD/UART/Printer behavior is implemented yet.</div>`;}
    root.innerHTML=html;
  }

  function render(){updateRegisters();updateBusLeds();updateSignalLamps();updateTrace();updateMemory();renderInspector();queryOne('#machineState').textContent=ui.running?'RUNNING':'READY';queryOne('#statusRun').textContent=ui.running?'RUNNING':'READY';queryOne('#runPauseLabel').textContent=ui.running?'PAUSE':'RUN';queryOne('#runPauseBtn').classList.toggle('running',ui.running);queryOne('#paceLabel').textContent=paces[ui.paceIndex].label;syncMoreSheet();queryOne('#tracePanel').classList.toggle('closed',!ui.traceOpen);queryOne('#tracePanel').classList.toggle('open',ui.traceOpen);queryOne('#traceToggleBtn').textContent=ui.traceOpen?'▲':'▼';ui.dirty=false;}
  function markSignals(events){ui.activeSignals=new Set(events.flatMap(e=>e.signals||[]));ui.pulseUntil=performance.now()+180;}
  function stepBatch(count){const before=bus.trace.length;try{cpu.runInstructions(count);markSignals(bus.trace.slice(before));ui.dirty=true;}catch(err){stopRun();queryOne('#machineState').textContent='FAULT';queryOne('#statusRun').textContent='FAULT';console.error(err);}}
  function stepOne(){stepBatch(1);}
  function scheduleRun(){clearRunHandle();if(!ui.running)return;const p=paces[ui.paceIndex];if(p.mode==='interval')runTimer=setInterval(()=>stepBatch(p.batch),p.ms);else{const loop=()=>{if(!ui.running)return;stepBatch(p.batch);runTimer=requestAnimationFrame(loop);};runTimer=requestAnimationFrame(loop);}}
  function clearRunHandle(){if(runTimer==null)return;clearInterval(runTimer);cancelAnimationFrame(runTimer);runTimer=null;}
  function startRun(){ui.running=true;scheduleRun();ui.dirty=true;}
  function stopRun(){ui.running=false;clearRunHandle();ui.dirty=true;}
  function toggleRun(){ui.running?stopRun():startRun();}
  function resetCpu(){stopRun();cpu.reset();bus.clearTrace();ui.lastFetchAddress=0;ui.activeSignals=new Set();ui.pulseUntil=0;ui.dirty=true;}
  function cyclePace(){const was=ui.running;stopRun();ui.paceIndex=(ui.paceIndex+1)%paces.length;if(was)startRun();ui.dirty=true;}
  function toggleTrace(){ui.traceOpen=!ui.traceOpen;ui.dirty=true;}

  function syncMoreSheet(){
    const menu=queryOne('#moreMenu');
    if(!menu)return;
    queryOne('#morePaceValue').textContent=paces[ui.paceIndex].label;
  }

  function openMore(){
    const menu=queryOne('#moreMenu');
    if(!menu)return;
    morePreviousFocus=document.activeElement;
    syncMoreSheet();
    menu.hidden=false;
    menu.setAttribute('aria-hidden','false');
    requestAnimationFrame(()=>menu.classList.add('open'));
    const close=queryOne('#moreCloseBtn');
    if(close)close.focus({preventScroll:true});
  }

  function closeMore(){
    const menu=queryOne('#moreMenu');
    if(!menu||menu.hidden)return;
    menu.classList.remove('open');
    menu.setAttribute('aria-hidden','true');
    setTimeout(()=>{menu.hidden=true;},180);
    if(morePreviousFocus&&typeof morePreviousFocus.focus==='function')morePreviousFocus.focus({preventScroll:true});
  }

  function moreAction(action){
    if(action==='reset')resetCpu();
    if(action==='burst')stepBatch(256);
    if(action==='clear'){bus.clearTrace();ui.dirty=true;}
    if(action==='pace')cyclePace();
    syncMoreSheet();
    if(action!=='pace')closeMore();
  }

  function bind(){
    queryAll('[data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
    queryOne('#runPauseBtn').addEventListener('click',toggleRun);
    queryOne('#stepBtn').addEventListener('click',stepOne);
    queryOne('#paceBtn').addEventListener('click',cyclePace);
    queryOne('#resetBtn').addEventListener('click',resetCpu);
    queryOne('#moreBtn').addEventListener('click',openMore);
    queryOne('#moreCloseBtn').addEventListener('click',closeMore);
    queryOne('#moreBackdrop').addEventListener('click',closeMore);
    queryAll('[data-more-action]').forEach(b=>b.addEventListener('click',()=>moreAction(b.dataset.moreAction)));
    queryOne('#burstBtn').addEventListener('click',()=>stepBatch(256));
    queryOne('#clearTraceBtn').addEventListener('click',()=>{bus.clearTrace();ui.dirty=true;});
    queryOne('#traceToggleBtn').addEventListener('click',toggleTrace);
    addEventListener('resize',()=>{ui.dirty=true;});
    addEventListener('keydown',e=>{if(e.key==='Escape')closeMore();});
  }

  function selfTest(){const tb=new Shino80Bus(),tc=new Z80Core(tb);tb.load([0x00]);tc.reset();tb.clearTrace();const r=tc.step();return r.mnemonic==='NOP'&&tc.state.pc===1&&tc.state.r===1&&tc.state.tStates===4&&tb.trace.length===2;}
  function observerLoop(){if(ui.dirty||performance.now()<ui.pulseUntil)render();requestAnimationFrame(observerLoop);}

  buildStaticUi();bind();const ok=selfTest();queryOne('#selfTest').textContent=ok?'PHASE 1A SELF TEST PASS':'SELF TEST FAIL';setView('display');render();requestAnimationFrame(observerLoop);
})();
