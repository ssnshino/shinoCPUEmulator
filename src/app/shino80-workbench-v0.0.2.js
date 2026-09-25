(function(){
  'use strict';
  const {Shino80Bus}=globalThis.SHINO_BUS;
  const {Shino80Keyboard}=globalThis.SHINO_KEYBOARD;
  const {Z80Core,flagState}=globalThis.SHINO_Z80;
  const {Shino80TextVideo,TEXT_VRAM_BASE}=globalThis.SHINO_VIDEO;
  const {buildSystemRom}=globalThis.SHINO_SYSTEM_ROM;
  const keyboard=new Shino80Keyboard();
  const bus=new Shino80Bus({traceLimit:512,romRanges:[[0x0000,0x1FFF]],ioDevices:[keyboard]});
  const cpu=new Z80Core(bus);
  const systemRom=buildSystemRom();
  bus.load(systemRom.bytes,0x0000);
  cpu.reset();

  const queryOne=s=>document.querySelector(s);
  const queryAll=s=>[...document.querySelectorAll(s)];
  const video=new Shino80TextVideo(bus,queryOne('#crtCanvas'));
  video.setPower(false);
  function syncDisplayGeometry(){
    const signal=video.signal;
    const crt=queryOne('#crtViewport'),displayCanvas=queryOne('#crtCanvas');
    if(crt)crt.style.aspectRatio=`${signal.width} / ${signal.height}`;

    let renderMode='AA';
    if(crt&&displayCanvas){
      const rect=displayCanvas.getBoundingClientRect();
      const sx=rect.width/signal.width,sy=rect.height/signal.height;
      const nearInteger=v=>v>=1&&Math.abs(v-Math.round(v))<.015;
      const pixelPerfect=nearInteger(sx)&&nearInteger(sy);
      renderMode=pixelPerfect?'PIXEL':'AA';
      crt.classList.toggle('pixelPerfect',pixelPerfect);
      crt.classList.toggle('dm80AA',!pixelPerfect);
      crt.dataset.renderMode=renderMode;
    }

    const status=queryOne('#statusVideo');
    if(status)status.textContent=`VIDEO ${signal.width}×${signal.height} ${signal.interface.replace('_',' ')} / ${renderMode}`;
  }
  const hex=(v,w=2)=>(Number(v)>>>0).toString(16).toUpperCase().padStart(w,'0');
  const bits=(v,width)=>Array.from({length:width},(_,i)=>Boolean(v&(1<<(width-1-i))));

  const ui={view:'display',running:false,powered:false,paceIndex:0,traceOpen:matchMedia('(min-width:1200px)').matches,selectedDevice:'display',dirty:true,lastFetchAddress:0,pulseUntil:0,activeSignals:new Set()};
  const paces=[{label:'VISUAL',mode:'interval',ms:125,batch:1},{label:'FAST',mode:'interval',ms:16,batch:8},{label:'MAX',mode:'raf',ms:0,batch:256}];
  let runTimer=null;
  let morePreviousFocus=null;

  const devices=[
    {id:'video',icon:'VB',name:'TEXT VIDEO BOARD',desc:'80×25 / 640×400 DIGITAL MONO',state:'ONLINE'},
    {id:'display',icon:'DM',name:'DM-80',desc:'SHINOMIYA Green Monochrome Digital Display',state:'ONLINE'},
    {id:'keyboard',icon:'KB',name:'SHINO KEYBOARD',desc:'ASCII FIFO / I/O 20h–21h',state:'ONLINE'},
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
    const root=queryOne('#deviceList');root.innerHTML='';devices.forEach(d=>{const state=(d.id==='video'||d.id==='display'||d.id==='keyboard')&&!ui.powered?'OFF':d.state;const row=document.createElement('div');row.className='device-row'+(ui.selectedDevice===d.id?' selected':'');row.dataset.device=d.id;row.innerHTML=`<div class="device-icon">${d.icon}</div><div><div class="device-name">${d.name}</div><div class="device-desc">${d.desc}</div></div><div class="device-state ${state.toLowerCase()}">${state}</div>`;row.addEventListener('click',()=>{ui.selectedDevice=d.id;renderDevices();renderInspector();});root.appendChild(row);});
  }

  function setView(view){
    ui.view=view;queryAll('[data-view-panel]').forEach(e=>e.classList.toggle('active',e.dataset.viewPanel===view));queryAll('[data-view]').forEach(e=>e.setAttribute('aria-selected',String(e.dataset.view===view)));ui.dirty=true;renderInspector();
  }

  function updateRegisters(){
    const s=cpu.state;queryAll('#regGrid .regrow').forEach(row=>{const width=Number(row.dataset.width),v=s[row.dataset.key];row.querySelector('.reghex').textContent=hex(v,width===16?4:2);setLeds(row.querySelector('.leds'),v,width);});
    const f=flagState(s.f);queryAll('#flagGrid .flag').forEach(e=>e.querySelector('.led').classList.toggle('on',!!f[e.dataset.flag]));
    queryOne('#iff1').textContent=s.iff1?'1':'0';queryOne('#iff2').textContent=s.iff2?'1':'0';queryOne('#im').textContent=String(s.im);queryOne('#tstates').textContent=String(s.tStates);queryOne('#icount').textContent=String(s.instructions);
    queryOne('#statusPc').textContent=hex(s.pc,4);queryOne('#statusR').textContent=hex(s.r,2);queryOne('#statusT').textContent=String(s.tStates);
    queryOne('#statusLast').textContent=cpu.lastInstruction?cpu.lastInstruction.mnemonic:'RESET';
  }

  function lastFetch(){return [...bus.trace].reverse().find(e=>e.purpose==='OPCODE_FETCH')||null;}
  function updateBusLeds(){const f=lastFetch();if(f){ui.lastFetchAddress=f.address;setLeds(queryOne('#addrLeds'),f.address,16);setLeds(queryOne('#dataLeds'),f.data,8);queryOne('#addrHex').textContent=hex(f.address,4);queryOne('#dataHex').textContent=hex(f.data,2);queryOne('#busLastAddr').textContent=hex(f.address,4);queryOne('#busLastData').textContent=hex(f.data,2);}}
  function updateSignalLamps(){const now=performance.now(),active=now<ui.pulseUntil?ui.activeSignals:new Set();queryAll('[data-signal]').forEach(e=>{const lamp=e.querySelector('.led');if(lamp)lamp.classList.toggle('on',active.has(e.dataset.signal));});}

  function traceHtml(events){return events.map(t=>{const addr=t.address==null?'----':hex(t.address,4),data=t.data==null?'--':hex(t.data,2);return `<div class="trace-line"><span class="t">T+${t.tState}</span><span class="kind">${t.purpose}</span><span class="addr">${addr}:${data}</span><span class="sig">${(t.signals||[]).join(' ')}</span></div>`;}).join('');}
  function updateTrace(){const rows=bus.trace.slice(-120);queryOne('#busTrace').innerHTML=traceHtml(rows);queryOne('#tracePanelBody').innerHTML=traceHtml(rows.slice(-40));queryOne('#traceSummary').textContent=`${bus.trace.length} events`;}

  const memoryView={address:0,follow:''};
  function selectMemoryAddress(address){
    memoryView.address=address&0xFFFF;memoryView.follow='';
    queryOne('#memoryFollow').value='';queryOne('#memoryAddress').value=hex(memoryView.address,4);
    queryOne('#memoryMessage').textContent='';ui.dirty=true;
  }
  function updateMemory(){
    if(ui.view!=='memory')return;
    if(memoryView.follow==='pc')memoryView.address=cpu.state.pc;
    if(memoryView.follow==='sp')memoryView.address=cpu.state.sp;
    if(memoryView.follow==='hl')memoryView.address=(cpu.state.h<<8)|cpu.state.l;
    if(memoryView.follow==='cursor')memoryView.address=bus.debugPeek(0xE000)|(bus.debugPeek(0xE001)<<8);
    const start=memoryView.address&0xFF00,columns=matchMedia('(max-width:719px)').matches?8:16;
    const root=queryOne('#memoryGrid');root.style.setProperty('--memory-columns',columns);
    queryOne('#memoryRange').textContent=`${hex(start,4)}h–${hex(start+255,4)}h · PAGE ${start/256+1}/256 · ${columns} bytes/row`;
    queryOne('#memoryPrev').disabled=start===0;queryOne('#memoryNext').disabled=start===0xFF00;
    if(document.activeElement!==queryOne('#memoryAddress'))queryOne('#memoryAddress').value=hex(memoryView.address,4);
    const marks={};
    for(const event of bus.trace){
      if(event.actor!=='CPU'||event.space!=='MEMORY')continue;
      if(event.purpose==='OPCODE_FETCH')marks.fetch=event.address;
      else if(event.operation==='READ')marks.read=event.address;
      else if(event.operation==='WRITE')marks.write=event.address;
    }
    const fragment=document.createDocumentFragment();
    for(let base=start;base<start+256;base+=columns){
      const row=document.createElement('div');row.className='memline';
      const label=document.createElement('span');label.className='memaddr';label.textContent=hex(base,4);
      const bytes=document.createElement('span');bytes.className='membytes';
      const ascii=document.createElement('span');ascii.className='memascii';let text='';
      for(let i=0;i<columns;i++){
        const address=base+i,value=bus.debugPeek(address),cell=document.createElement('span');
        cell.textContent=hex(value);cell.dataset.address=hex(address,4);
        cell.classList.toggle('mem-selected',address===memoryView.address);
        const kinds=Object.keys(marks).filter(kind=>marks[kind]===address);
        for(const kind of kinds)cell.classList.add('mem-'+kind);
        cell.title=`${hex(address,4)}h${kinds.length?' · '+kinds.join(' / ').toUpperCase():''}`;
        bytes.appendChild(cell);text+=value>=32&&value<=126?String.fromCharCode(value):'.';
      }
      ascii.textContent=text;row.append(label,bytes,ascii);fragment.appendChild(row);
    }
    root.replaceChildren(fragment);
  }

  function renderInspector(){
    const s=cpu.state,root=queryOne('#inspectorContent');let html=`<div class="inspector-head"><h2>${ui.view.toUpperCase()} INSPECTOR</h2><span class="eyebrow">context</span></div>`;
    if(ui.view==='display')html+=`<div class="inspector-section"><div class="inspector-chip"><span class="dot ${ui.powered?'ok':''}"></span>${ui.powered?'CPU POWERED':'CPU OFF'}</div><div class="inspector-chip"><span class="dot ${ui.powered?'ok':''}"></span>${ui.powered?'TEXT VIDEO ONLINE':'TEXT VIDEO OFF'}</div></div><div class="inspector-section"><div class="inspector-kv"><span>PC</span><b>${hex(s.pc,4)}h</b></div><div class="inspector-kv"><span>R</span><b>${hex(s.r,2)}h</b></div><div class="inspector-kv"><span>T-states</span><b>${s.tStates}</b></div><div class="inspector-kv"><span>TEXT VRAM</span><b>C000h–C7CFh</b></div><div class="inspector-kv"><span>CG-ROM</span><b>4 KiB / NATIVE 8×16</b></div></div><div class="inspector-section inspector-note">CRT pixels come from TEXT VRAM + CG-ROM. JavaScript does not print the IPL banner directly.</div>`;
    if(ui.view==='cpu'){const li=cpu.lastInstruction;const current=li?`${hex(li.opcode,2)}h ${li.mnemonic}`:'-- RESET';const flow=li&&li.branchTaken!==null?`${li.branchTaken?'TAKEN':'NOT TAKEN'} → ${hex(li.branchTaken?li.branchTarget:li.fallThrough,4)}h`:'—';const stack=li&&li.stackBefore!==null?`${hex(li.stackBefore,4)}h → ${hex(li.stackAfter,4)}h`:'—';html+=`<div class="inspector-section"><div class="inspector-kv"><span>Current instruction</span><b>${current}</b></div><div class="inspector-kv"><span>Flow</span><b>${flow}</b></div><div class="inspector-kv"><span>Stack</span><b>${stack}</b></div><div class="inspector-kv"><span>Decoder</span><b>BASE 252/252 ONLINE · PREFIXES NEXT</b></div><div class="inspector-kv"><span>Accuracy</span><b>Level 1</b></div><div class="inspector-kv"><span>Bus trace</span><b>M-cycle abstract</b></div></div><div class="inspector-section inspector-note">PHASE 1E completes all 252 non-prefix BASE opcodes. CB/DD/ED/FD are recognized prefix entry points and are the next completion target.</div>`;}
    if(ui.view==='memory')html+=`<div class="inspector-section"><div class="inspector-kv"><span>Address space</span><b>64 KiB bench</b></div><div class="inspector-kv"><span>Last fetch</span><b>${hex(ui.lastFetchAddress,4)}h</b></div></div><div class="inspector-section inspector-note">Memory Inspector uses DEBUG PEEK and does not create CPU MREQ/RD trace events.</div>`;
    if(ui.view==='bus')html+=`<div class="inspector-section"><div class="inspector-kv"><span>Events retained</span><b>${bus.trace.length}</b></div><div class="inspector-kv"><span>Precision</span><b>M_CYCLE_ABSTRACT</b></div></div><div class="inspector-section inspector-note">Pin-perfect T-state waveforms are not implemented in v0.0.2.</div>`;
    if(ui.view==='devices'){
      const d=devices.find(x=>x.id===ui.selectedDevice)||devices[0],signal=video.signal;
      const state=(d.id==='video'||d.id==='display'||d.id==='keyboard')&&!ui.powered?'OFF':d.state;
      html+=`<div class="inspector-section"><div class="inspector-kv"><span>Selected</span><b>${d.name}</b></div><div class="inspector-kv"><span>Status</span><b>${state}</b></div></div>`;
      if(d.id==='video')html+=`<div class="inspector-section"><div class="inspector-kv"><span>Output</span><b>${signal.interface.replace('_',' ')}</b></div><div class="inspector-kv"><span>Raster</span><b>${signal.width}×${signal.height}</b></div><div class="inspector-kv"><span>Text mode</span><b>${signal.textColumns}×${signal.textRows}</b></div></div><div class="inspector-section inspector-note">VIDEO BOARD owns the logical raster and signal format.</div>`;
      else if(d.id==='display')html+=`<div class="inspector-section"><div class="inspector-kv"><span>Model</span><b>DM-80</b></div><div class="inspector-kv"><span>Maker</span><b>SHINOMIYA</b></div><div class="inspector-kv"><span>Input</span><b>DIGITAL MONO</b></div><div class="inspector-kv"><span>Raster</span><b>${signal.width}×${signal.height}</b></div></div><div class="inspector-section inspector-note">Monitor controls reserved: BRIGHTNESS / CONTRAST / H-POS / V-POS / H-SIZE / V-SIZE.</div>`;
      else if(d.id==='keyboard')html+=`<div class="inspector-section"><div class="inspector-kv"><span>DATA</span><b>20h</b></div><div class="inspector-kv"><span>STATUS</span><b>21h</b></div><div class="inspector-kv"><span>FIFO</span><b>${keyboard.depth} / ${keyboard.capacity}</b></div><div class="inspector-kv"><span>Overrun</span><b>${keyboard.overrun?'YES':'NO'}</b></div></div><div class="inspector-section inspector-note">Tap the DM-80 or use More → KEYBOARD to type into the ROM Monitor.</div>`;
      else html+=`<div class="inspector-section inspector-note">Reserved device slot; behavior not implemented yet.</div>`;
    }
    root.innerHTML=html;
  }

  function render(){
    syncDisplayGeometry();video.render();updateRegisters();updateBusLeds();updateSignalLamps();updateTrace();updateMemory();renderInspector();
    const state=!ui.powered?'POWER OFF':(ui.running?'RUNNING':'READY');
    queryOne('#machineState').textContent=state;queryOne('#statusRun').textContent=state;
    queryOne('#runPauseLabel').textContent=ui.running?'PAUSE':'RUN';queryOne('#runPauseBtn').classList.toggle('running',ui.running);
    queryOne('#powerBtn').classList.toggle('on',ui.powered);queryOne('#powerBtn').setAttribute('aria-pressed',String(ui.powered));
    queryOne('#app').classList.toggle('power-off',!ui.powered);
    queryOne('#crtViewport').classList.toggle('keyboard-ready',ui.powered);
    queryOne('#crtViewport').setAttribute('aria-disabled',String(!ui.powered));
    queryOne('#runPauseBtn').disabled=!ui.powered;queryOne('#stepBtn').disabled=!ui.powered;queryOne('#resetBtn').disabled=!ui.powered;
    queryOne('#paceLabel').textContent=paces[ui.paceIndex].label;syncMoreSheet();
    queryOne('#tracePanel').classList.toggle('closed',!ui.traceOpen);queryOne('#tracePanel').classList.toggle('open',ui.traceOpen);queryOne('#traceToggleBtn').textContent=ui.traceOpen?'▲':'▼';ui.dirty=false;
  }
  function markSignals(events){ui.activeSignals=new Set(events.flatMap(e=>e.signals||[]));ui.pulseUntil=performance.now()+180;}
  function stepBatch(count){
    if(!ui.powered)return;
    const before=bus.trace.length;
    try{cpu.runInstructions(count);markSignals(bus.trace.slice(before));ui.dirty=true;}
    catch(err){stopRun();queryOne('#machineState').textContent='FAULT';queryOne('#statusRun').textContent='FAULT';console.error(err);}
  }
  function stepOne(){stepBatch(1);}
  function visualBatch(){
    const pc=cpu.state.pc&0xFFFF;
    if(pc===systemRom.labels.VRAM_TEST_LOOP)return systemRom.meta.testPageInstructions;
    if(pc===systemRom.labels.VRAM_TEST_HOLD_LOOP)return 32;
    if(pc===systemRom.labels.BIOS_CLS_LOOP)return systemRom.meta.clearPageInstructions;
    if(pc===systemRom.labels.MONITOR_LOOP||pc===systemRom.labels.BIOS_GETCHAR_WAIT)return 32;
    return 1;
  }
  function scheduleRun(){
    clearRunHandle();if(!ui.running||!ui.powered)return;const p=paces[ui.paceIndex];
    if(p.mode==='interval')runTimer=setInterval(()=>stepBatch(ui.paceIndex===0?visualBatch():p.batch),p.ms);
    else{const loop=()=>{if(!ui.running||!ui.powered)return;stepBatch(p.batch);runTimer=requestAnimationFrame(loop);};runTimer=requestAnimationFrame(loop);}
  }
  function clearRunHandle(){if(runTimer==null)return;clearInterval(runTimer);cancelAnimationFrame(runTimer);runTimer=null;}
  function startRun(){if(!ui.powered)return;ui.running=true;scheduleRun();ui.dirty=true;}
  function stopRun(){ui.running=false;clearRunHandle();ui.dirty=true;}
  function toggleRun(){if(!ui.powered)return;ui.running?stopRun():startRun();}
  function resetCpu(){
    if(!ui.powered)return;
    stopRun();keyboard.reset();queryOne('#keyboardCapture').value='';cpu.reset();ui.lastFetchAddress=0;ui.activeSignals=new Set();ui.pulseUntil=0;ui.dirty=true;
  }
  function powerOn(){
    if(ui.powered)return;
    stopRun();bus.clearWritableMemory(0);keyboard.reset();queryOne('#keyboardCapture').value='';cpu.reset();video.setPower(true);ui.powered=true;
    ui.lastFetchAddress=0;ui.activeSignals=new Set();ui.pulseUntil=0;renderDevices();ui.dirty=true;
  }
  function powerOff(){
    if(!ui.powered)return;
    stopRun();ui.powered=false;keyboard.reset();queryOne('#keyboardCapture').value='';queryOne('#keyboardCapture').blur();bus.clearWritableMemory(0);video.setPower(false);bus.clearTrace();
    ui.lastFetchAddress=0;ui.activeSignals=new Set();ui.pulseUntil=0;renderDevices();ui.dirty=true;
  }
  function togglePower(){ui.powered?powerOff():powerOn();}
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

  function closeMore({restoreFocus=true}={}){
    const menu=queryOne('#moreMenu');
    if(!menu||menu.hidden)return;
    menu.classList.remove('open');
    menu.setAttribute('aria-hidden','true');
    setTimeout(()=>{menu.hidden=true;},180);
    if(restoreFocus&&morePreviousFocus&&typeof morePreviousFocus.focus==='function')morePreviousFocus.focus({preventScroll:true});
  }

  function syncKeyboardViewport(){
    const app=queryOne('#app');
    if(!app.classList.contains('keyboard-mode'))return;
    const height=globalThis.visualViewport?globalThis.visualViewport.height:innerHeight;
    app.style.setProperty('--keyboard-viewport-height',`${Math.round(height)}px`);
    ui.dirty=true;
  }

  function setKeyboardMode(active){
    const app=queryOne('#app');
    app.classList.toggle('keyboard-mode',active);
    if(active){syncKeyboardViewport();requestAnimationFrame(syncKeyboardViewport);}
    else app.style.removeProperty('--keyboard-viewport-height');
    ui.dirty=true;
  }

  function activateKeyboard(){
    if(!ui.powered)return;
    closeMore({restoreFocus:false});
    setView('display');
    const input=queryOne('#keyboardCapture');
    input.value='';
    input.focus({preventScroll:true});
  }

  function hostKeyByte(key){
    if(key==='Enter'||key==='\n'||key==='\r')return 0x0D;
    if(key==='Backspace')return 0x08;
    if(typeof key==='string'&&key.length===1){const code=key.charCodeAt(0);if(code>=0x20&&code<=0x7E)return code;}
    return null;
  }

  function enqueueHostKey(key){
    if(!ui.powered)return false;
    const byte=hostKeyByte(key);
    if(byte===null)return false;
    keyboard.enqueueByte(byte);ui.dirty=true;return true;
  }

  function moreAction(action){
    if(action==='keyboard'){activateKeyboard();return;}
    if(action==='reset')resetCpu();
    if(action==='burst')stepBatch(256);
    if(action==='clear'){bus.clearTrace();ui.dirty=true;}
    if(action==='pace')cyclePace();
    syncMoreSheet();
    if(action!=='pace')closeMore();
  }

  function bind(){
    queryOne('#memoryAddressForm').addEventListener('submit',event=>{
      event.preventDefault();
      const value=queryOne('#memoryAddress').value.trim().replace(/^0x/i,'').replace(/h$/i,'');
      if(!/^[0-9a-f]{1,4}$/i.test(value)){queryOne('#memoryMessage').textContent='Enter a hex address from 0000 to FFFF.';return;}
      selectMemoryAddress(parseInt(value,16));
    });
    queryOne('#memoryPrev').addEventListener('click',()=>selectMemoryAddress(Math.max(0,(memoryView.address&0xFF00)-256)));
    queryOne('#memoryNext').addEventListener('click',()=>selectMemoryAddress(Math.min(0xFF00,(memoryView.address&0xFF00)+256)));
    queryOne('#memoryJump').addEventListener('change',event=>{if(event.target.value)selectMemoryAddress(parseInt(event.target.value,16));event.target.value='';});
    queryOne('#memoryFollow').addEventListener('change',event=>{memoryView.follow=event.target.value;ui.dirty=true;});
    queryAll('[data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
    queryOne('#powerBtn').addEventListener('click',togglePower);
    queryOne('#runPauseBtn').addEventListener('click',toggleRun);
    queryOne('#stepBtn').addEventListener('click',stepOne);
    queryOne('#paceBtn').addEventListener('click',cyclePace);
    queryOne('#resetBtn').addEventListener('click',resetCpu);
    queryOne('#moreBtn').addEventListener('click',openMore);
    queryOne('#moreCloseBtn').addEventListener('click',closeMore);
    queryOne('#moreBackdrop').addEventListener('click',()=>closeMore());
    queryAll('[data-more-action]').forEach(b=>b.addEventListener('click',()=>moreAction(b.dataset.moreAction)));
    queryOne('#burstBtn').addEventListener('click',()=>stepBatch(256));
    queryOne('#clearTraceBtn').addEventListener('click',()=>{bus.clearTrace();ui.dirty=true;});
    queryOne('#traceToggleBtn').addEventListener('click',toggleTrace);
    addEventListener('resize',()=>{ui.dirty=true;});
    const keyboardCapture=queryOne('#keyboardCapture'),crt=queryOne('#crtViewport');
    crt.addEventListener('click',activateKeyboard);
    crt.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activateKeyboard();}});
    keyboardCapture.addEventListener('beforeinput',e=>{
      if(e.inputType==='insertLineBreak'){e.preventDefault();enqueueHostKey('Enter');}
      if(e.inputType==='deleteContentBackward'){e.preventDefault();enqueueHostKey('Backspace');}
    });
    keyboardCapture.addEventListener('input',()=>{
      const text=keyboardCapture.value;keyboardCapture.value='';
      for(const char of text)enqueueHostKey(char==='\n'?'Enter':char);
    });
    keyboardCapture.addEventListener('focus',()=>setKeyboardMode(true));
    keyboardCapture.addEventListener('blur',()=>setKeyboardMode(false));
    if(globalThis.visualViewport)globalThis.visualViewport.addEventListener('resize',syncKeyboardViewport);
    addEventListener('keydown',e=>{
      if(e.key==='Escape'){closeMore();return;}
      if(e.defaultPrevented||e.target===keyboardCapture||e.target.closest('input,textarea,select,button,[contenteditable="true"]')||e.metaKey||e.ctrlKey||e.altKey||e.repeat)return;
      if(enqueueHostKey(e.key))e.preventDefault();
    });
  }

  function selfTest(){
    const tb=new Shino80Bus({romRanges:[[0x0000,0x1FFF]]}),tc=new Z80Core(tb),rom=buildSystemRom();
    tb.load(rom.bytes,0);tb.clearWritableMemory(0xA5);tc.reset();tb.clearTrace();
    tc.runInstructions(rom.meta.instructionsBeforeLoop);
    const firstChar=tb.debugPeek(TEXT_VRAM_BASE),lastClear=tb.debugPeek(TEXT_VRAM_BASE+0x7FF);
    const romByte=tb.debugPeek(0);tb.cpuWrite(0,0x00,{purpose:'SELFTEST_ROM_WRITE'});
    return firstChar===0x53&&lastClear===0x00&&tc.state.pc===rom.labels.MONITOR_LOOP&&
      tb.debugPeek(0)===romByte&&tb.trace.some(e=>e.purpose==='ROM_WRITE_BLOCKED');
  }
  function observerLoop(){if(ui.dirty||performance.now()<ui.pulseUntil)render();requestAnimationFrame(observerLoop);}

  buildStaticUi();bind();const ok=selfTest();queryOne('#selfTest').textContent=ok?'PHASE 2A.1 SELF TEST PASS':'SELF TEST FAIL';setView('display');powerOff();render();requestAnimationFrame(observerLoop);
})();
