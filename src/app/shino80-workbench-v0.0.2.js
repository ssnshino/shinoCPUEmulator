(function(){
  'use strict';
  const {Shino80Memory}=globalThis.SHINO_MEMORY;
  const {Shino80Bus}=globalThis.SHINO_BUS;
  const {Shino80Keyboard}=globalThis.SHINO_KEYBOARD;
  const {Shino80Beeper,BEEPER_PORT}=globalThis.SHINO_BEEPER;
  const {Shino80BlockDevice}=globalThis.SHINO_BLOCK_DEVICE;
  const {buildSystemDisk}=globalThis.SHINO_SYSTEM_DISK;
  const {Z80Core,flagState}=globalThis.SHINO_Z80;
  const {Shino80TextVideo,TEXT_VRAM_BASE}=globalThis.SHINO_VIDEO;
  const {buildSystemRom}=globalThis.SHINO_SYSTEM_ROM;
  const keyboard=new Shino80Keyboard();
  const beeper=new Shino80Beeper();
  const systemDisk=buildSystemDisk();
  const diskA=new Shino80BlockDevice({image:systemDisk.image});
  const systemRom=buildSystemRom();
  const memory=new Shino80Memory();memory.loadFirmware(systemRom.bytes);
  const bus=new Shino80Bus({traceLimit:512,memoryDevice:memory,ioDevices:[keyboard,diskA,beeper]});
  const cpu=new Z80Core(bus);
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

  const ui={view:'display',running:false,powered:false,paceIndex:1,traceOpen:matchMedia('(min-width:1200px)').matches,selectedDevice:'display',dirty:true,lastFetchAddress:0,pulseUntil:0,activeSignals:new Set()};
  const paces=[{label:'VISUAL',mode:'interval',ms:125},{label:'REALTIME',mode:'raf'},{label:'TURBO',mode:'raf'}];
  const executionPace=new globalThis.SHINO_PACE.ExecutionPace(cpu);
  let runTimer=null;
  let morePreviousFocus=null;
  let audioContext=null,lastBeepSequence=0;

  const devices=[
    {id:'video',icon:'VB',name:'TEXT VIDEO BOARD',desc:'80×25 / 640×400 DIGITAL MONO',state:'ONLINE'},
    {id:'display',icon:'DM',name:'DM-80',desc:'SHINOMIYA Green Monochrome Digital Display',state:'ONLINE'},
    {id:'keyboard',icon:'KB',name:'SHINO KEYBOARD',desc:'ASCII FIFO / I/O 20h–21h',state:'ONLINE'},
    {id:'beeper',icon:'♪',name:'ONE-BIT BEEPER',desc:'BEL / I/O 40h · 880 Hz',state:'ONLINE'},
    {id:'memory',icon:'MM',name:'MEMORY CONTROL',desc:'BOOT 8K + EXT 8K / I/O 00h',state:'ONLINE'},
    {id:'disk-a',icon:'A:',name:'VIRTUAL DISK A',desc:'CP/M 2.2 · S80B v2 · 77×26×128',state:'ONLINE'},
    {id:'fdd-b',icon:'B:',name:'FDD B',desc:'Floppy Disk Drive',state:'RESERVED'},
    {id:'uart',icon:'⇄',name:'RS-232C',desc:'UART / Virtual Modem',state:'RESERVED'},
    {id:'printer',icon:'PR',name:'PRINTER',desc:'Parallel printer interface',state:'RESERVED'},
    {id:'timer',icon:'T',name:'TIMER',desc:'System timer',state:'RESERVED'},
    {id:'psg',icon:'♪',name:'PSG',desc:'Sound generator slot',state:'RESERVED'}
  ];
  const powerSensitiveDevices=new Set(['video','display','keyboard','beeper','disk-a']);
  function deviceState(device){return powerSensitiveDevices.has(device.id)&&!ui.powered?'OFF':device.state;}

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
    const root=queryOne('#deviceList');root.innerHTML='';devices.forEach(d=>{const state=deviceState(d);const row=document.createElement('div');row.className='device-row'+(ui.selectedDevice===d.id?' selected':'');row.dataset.device=d.id;row.innerHTML=`<div class="device-icon">${d.icon}</div><div><div class="device-name">${d.name}</div><div class="device-desc">${d.desc}</div></div><div class="device-state ${state.toLowerCase()}">${state}</div>`;row.addEventListener('click',()=>{ui.selectedDevice=d.id;renderDevices();renderInspector();});root.appendChild(row);});
  }

  function setView(view){
    ui.view=view;queryAll('[data-view-panel]').forEach(e=>e.classList.toggle('active',e.dataset.viewPanel===view));queryAll('[data-view]').forEach(e=>e.setAttribute('aria-selected',String(e.dataset.view===view)));ui.dirty=true;renderInspector();
  }

  function updateRegisters(){
    const s=cpu.state;
    if(ui.view==='cpu'){
      queryAll('#regGrid .regrow').forEach(row=>{const width=Number(row.dataset.width),v=s[row.dataset.key];row.querySelector('.reghex').textContent=hex(v,width===16?4:2);setLeds(row.querySelector('.leds'),v,width);});
      const f=flagState(s.f);queryAll('#flagGrid .flag').forEach(e=>e.querySelector('.led').classList.toggle('on',!!f[e.dataset.flag]));
      queryOne('#iff1').textContent=s.iff1?'1':'0';queryOne('#iff2').textContent=s.iff2?'1':'0';queryOne('#im').textContent=String(s.im);queryOne('#tstates').textContent=String(s.tStates);queryOne('#icount').textContent=String(s.instructions);
    }
    queryOne('#statusPc').textContent=hex(s.pc,4);queryOne('#statusR').textContent=hex(s.r,2);queryOne('#statusT').textContent=String(s.tStates);
    queryOne('#statusLast').textContent=cpu.lastInstruction?cpu.lastInstruction.mnemonic:'RESET';
  }

  function lastFetch(){const events=bus.trace;for(let i=events.length-1;i>=0;i--)if(events[i].purpose==='OPCODE_FETCH')return events[i];return null;}
  function updateBusLeds(){const f=lastFetch();if(f){ui.lastFetchAddress=f.address;setLeds(queryOne('#addrLeds'),f.address,16);setLeds(queryOne('#dataLeds'),f.data,8);queryOne('#addrHex').textContent=hex(f.address,4);queryOne('#dataHex').textContent=hex(f.data,2);queryOne('#busLastAddr').textContent=hex(f.address,4);queryOne('#busLastData').textContent=hex(f.data,2);}}
  function updateSignalLamps(){const now=performance.now(),active=now<ui.pulseUntil?ui.activeSignals:new Set();queryAll('[data-signal]').forEach(e=>{const lamp=e.querySelector('.led');if(lamp)lamp.classList.toggle('on',active.has(e.dataset.signal));});}

  function traceHtml(events){return events.map(t=>{const addr=t.address==null?'----':hex(t.address,4),data=t.data==null?'--':hex(t.data,2);return `<div class="trace-line"><span class="t">T+${t.tState}</span><span class="kind">${t.purpose}</span><span class="addr">${addr}:${data}</span><span class="sig">${(t.signals||[]).join(' ')}</span></div>`;}).join('');}
  function updateTrace(){
    const panelVisible=ui.traceOpen&&matchMedia('(min-width:720px)').matches;
    if(ui.view==='bus'||panelVisible){
      const rows=bus.trace.slice(-120);
      if(ui.view==='bus')queryOne('#busTrace').innerHTML=traceHtml(rows);
      if(panelVisible)queryOne('#tracePanelBody').innerHTML=traceHtml(rows.slice(-40));
    }
    queryOne('#traceSummary').textContent=`${bus.traceCount} events`;
  }

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
    const mapping=memory.describeAddress(start),mapLabel=mapping.memorySource==='EXTENSION_ROM'?`EXT ROM BANK ${mapping.extensionBank}`:mapping.memorySource.replaceAll('_',' ');
    queryOne('#memoryRange').textContent=`${hex(start,4)}h–${hex(start+255,4)}h · ${mapLabel} · PAGE ${start/256+1}/256 · ${columns} bytes/row`;
    queryOne('#memoryPrev').disabled=start===0;queryOne('#memoryNext').disabled=start===0xFF00;
    if(document.activeElement!==queryOne('#memoryAddress'))queryOne('#memoryAddress').value=hex(memoryView.address,4);
    const marks={};
    for(const event of bus.trace){
      if(event.actor!=='CPU'||event.space!=='MEMORY')continue;
      if(event.purpose==='OPCODE_FETCH')marks.fetch=event.address;
      else if(event.operation==='READ')marks.read=event.address;
      else if(event.operation==='WRITE'||event.operation==='WRITE_SHADOW')marks.write=event.address;
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
    if(ui.view==='cpu'){const li=cpu.lastInstruction;const current=li?`${li.bytes.length?li.bytes.map(b=>hex(b,2)).join(' ')+'h ':''}${li.mnemonic}`:'-- RESET';const flow=li&&li.branchTaken!==null?`${li.branchTaken?'TAKEN':'NOT TAKEN'} → ${hex(li.branchTaken?li.branchTarget:li.fallThrough,4)}h`:'—';const stack=li&&li.stackBefore!==null?`${hex(li.stackBefore,4)}h → ${hex(li.stackAfter,4)}h`:'—';html+=`<div class="inspector-section"><div class="inspector-kv"><span>Current instruction</span><b>${current}</b></div><div class="inspector-kv"><span>Flow</span><b>${flow}</b></div><div class="inspector-kv"><span>Stack</span><b>${stack}</b></div><div class="inspector-kv"><span>Decoder</span><b>BASE 252/252 ONLINE · CB 256/256 ONLINE</b></div><div class="inspector-kv"><span>ED</span><b>78 active · 178 unused NOP</b></div><div class="inspector-kv"><span>DD / FD</span><b>252 + 252 terminal opcodes ONLINE</b></div><div class="inspector-kv"><span>DDCB / FDCB</span><b>256 + 256 encodings ONLINE</b></div><div class="inspector-kv"><span>Interrupts</span><b>NMI · INT IM0 / IM1 / IM2</b></div><div class="inspector-kv"><span>Accuracy</span><b>Full F / WZ / P / Q / total T-states</b></div><div class="inspector-kv"><span>Bus trace</span><b>M-cycle abstract</b></div></div><div class="inspector-section inspector-note">Instruction-level CPU milestone: all families, full flags and interrupt dispatch. Oracle: 1,604,000 cases (ED: 80 encodings). Not pin/cycle-perfect; WAIT/BUSRQ and multi-byte device-supplied IM0 streams are not modeled.</div>`;}
    if(ui.view==='memory')html+=`<div class="inspector-section"><div class="inspector-kv"><span>Physical RAM</span><b>64 KiB</b></div><div class="inspector-kv"><span>Lower mapping</span><b>${memory.lowRamEnabled?'FULL RAM':'BOOT + EXT ROM'}</b></div><div class="inspector-kv"><span>Extension bank</span><b>${memory.extensionBank}</b></div><div class="inspector-kv"><span>Control port</span><b>00h = ${hex(memory.control)}</b></div><div class="inspector-kv"><span>Last fetch</span><b>${hex(ui.lastFetchAddress,4)}h</b></div></div><div class="inspector-section inspector-note">Memory Inspector shows the currently visible mapping with DEBUG PEEK and creates no CPU Bus events. RAM exists underneath the lower ROM overlay.</div>`;
    if(ui.view==='bus')html+=`<div class="inspector-section"><div class="inspector-kv"><span>Events retained</span><b>${bus.traceCount}</b></div><div class="inspector-kv"><span>Precision</span><b>M_CYCLE_ABSTRACT</b></div></div><div class="inspector-section inspector-note">Pin-perfect T-state waveforms are not implemented in v0.0.2.</div>`;
    if(ui.view==='devices'){
      const d=devices.find(x=>x.id===ui.selectedDevice)||devices[0],signal=video.signal;
      const state=deviceState(d);
      html+=`<div class="inspector-section"><div class="inspector-kv"><span>Selected</span><b>${d.name}</b></div><div class="inspector-kv"><span>Status</span><b>${state}</b></div></div>`;
      if(d.id==='video')html+=`<div class="inspector-section"><div class="inspector-kv"><span>Output</span><b>${signal.interface.replace('_',' ')}</b></div><div class="inspector-kv"><span>Raster</span><b>${signal.width}×${signal.height}</b></div><div class="inspector-kv"><span>Text mode</span><b>${signal.textColumns}×${signal.textRows}</b></div></div><div class="inspector-section inspector-note">VIDEO BOARD owns the logical raster and signal format.</div>`;
      else if(d.id==='display')html+=`<div class="inspector-section"><div class="inspector-kv"><span>Model</span><b>DM-80</b></div><div class="inspector-kv"><span>Maker</span><b>SHINOMIYA</b></div><div class="inspector-kv"><span>Input</span><b>DIGITAL MONO</b></div><div class="inspector-kv"><span>Raster</span><b>${signal.width}×${signal.height}</b></div></div><div class="inspector-section inspector-note">Monitor controls reserved: BRIGHTNESS / CONTRAST / H-POS / V-POS / H-SIZE / V-SIZE.</div>`;
      else if(d.id==='keyboard')html+=`<div class="inspector-section"><div class="inspector-kv"><span>DATA</span><b>20h</b></div><div class="inspector-kv"><span>STATUS</span><b>21h</b></div><div class="inspector-kv"><span>FIFO</span><b>${keyboard.depth} / ${keyboard.capacity}</b></div><div class="inspector-kv"><span>Overrun</span><b>${keyboard.overrun?'YES':'NO'}</b></div></div><div class="inspector-section inspector-note">Tap the DM-80 or use More → KEYBOARD to type into the ROM Monitor.</div>`;
      else if(d.id==='beeper')html+=`<div class="inspector-section"><div class="inspector-kv"><span>Trigger</span><b>I/O 40h</b></div><div class="inspector-kv"><span>Count</span><b>${beeper.triggerCount}</b></div><div class="inspector-kv"><span>Last value</span><b>${hex(beeper.lastValue)}h</b></div><div class="inspector-kv"><span>Output</span><b>880 Hz · 80 ms</b></div></div><div class="inspector-section inspector-note">ROM BIOS and CBIOS route ASCII BEL 07h through the Bus. Browser audio is presentation only and requires the POWER gesture.</div>`;
      else if(d.id==='memory')html+=`<div class="inspector-section"><div class="inspector-kv"><span>BOOT ROM</span><b>0000h–1FFFh</b></div><div class="inspector-kv"><span>EXT ROM</span><b>2000h–3FFFh · BANK ${memory.extensionBank}</b></div><div class="inspector-kv"><span>RAM</span><b>64 KiB UNDERLAY</b></div><div class="inspector-kv"><span>MODE</span><b>${memory.lowRamEnabled?'FULL RAM':'ROM VISIBLE'}</b></div></div><div class="inspector-section inspector-note">I/O 00h controls page-out, shadow writes and the extension bank. RESET restores ROM-visible bank 0.</div>`;
      else if(d.id==='disk-a')html+=`<div class="inspector-section"><div class="inspector-kv"><span>Media</span><b>${systemDisk.meta.magic} v${systemDisk.meta.version} · CP/M 2.2</b></div><div class="inspector-kv"><span>Geometry</span><b>77 TRACKS × 26 SECTORS</b></div><div class="inspector-kv"><span>Sector</span><b>128 BYTES</b></div><div class="inspector-kv"><span>Image</span><b>256,256 BYTES</b></div><div class="inspector-kv"><span>System</span><b>CCP 9400h · BDOS 9C00h</b></div><div class="inspector-kv"><span>Ports</span><b>30h–36h</b></div><div class="inspector-kv"><span>Selection</span><b>A:${diskA.track}/${diskA.sector}</b></div><div class="inspector-kv"><span>Transfer</span><b>${diskA.transferMode?diskA.transferMode.toUpperCase()+' '+diskA.transferRemaining+' B':'IDLE'}</b></div><div class="inspector-kv"><span>Write protect</span><b>${diskA.writeProtected?'ON':'OFF'}</b></div><div class="inspector-kv"><span>Error</span><b>${diskA.error}</b></div></div><div class="inspector-section inspector-note">MON O loads the SHINO loader and CBIOS; the RAM loader reads 44 CCP/BDOS sectors. JP 0000h performs a disk-backed warm boot. Media stays mounted across RESET and POWER.</div>`;
      else html+=`<div class="inspector-section inspector-note">Reserved device slot; behavior not implemented yet.</div>`;
    }
    root.innerHTML=html;
  }

  function render(){
    if(ui.view==='display'){
      syncDisplayGeometry();
      const pointer=memory.lowRamEnabled?systemDisk.cbios.labels.CBIOS_CURSOR:systemRom.meta.biosWorkCursor;
      const cursorAddress=bus.debugPeek(pointer)|(bus.debugPeek(pointer+1)<<8);
      const cursorVisible=ui.powered&&(Math.floor(cpu.state.tStates/2000000)&1)===0;
      video.render({cursorAddress,cursorVisible});
    }
    updateRegisters();
    if(ui.view==='cpu'||ui.view==='bus'){updateBusLeds();updateSignalLamps();}
    else{const fetch=lastFetch();if(fetch)ui.lastFetchAddress=fetch.address;}
    updateTrace();
    if(ui.view==='memory')updateMemory();
    if(matchMedia('(min-width:720px)').matches)renderInspector();
    const state=!ui.powered?'POWER OFF':(ui.running?'RUNNING':'READY');
    queryOne('#machineState').textContent=state;queryOne('#statusRun').textContent=state;
    queryOne('#runPauseLabel').textContent=ui.running?'PAUSE':'RUN';queryOne('#runPauseBtn').classList.toggle('running',ui.running);
    queryOne('#powerBtn').classList.toggle('on',ui.powered);queryOne('#powerBtn').setAttribute('aria-pressed',String(ui.powered));
    queryOne('#app').classList.toggle('power-off',!ui.powered);
    queryOne('#crtViewport').classList.toggle('keyboard-ready',ui.powered);
    queryOne('#crtViewport').setAttribute('aria-disabled',String(!ui.powered));
    queryOne('#runPauseBtn').disabled=!ui.powered;queryOne('#stepBtn').disabled=!ui.powered;queryOne('#resetBtn').disabled=!ui.powered;
    queryOne('#paceLabel').textContent=paces[ui.paceIndex].label;syncMoreSheet();
    queryOne('#actualClock').textContent=`ACTUAL ${ui.running&&!document.hidden?executionPace.mhz.toFixed(2):'0.00'} MHz`;
    queryOne('#tracePanel').classList.toggle('closed',!ui.traceOpen);queryOne('#tracePanel').classList.toggle('open',ui.traceOpen);queryOne('#traceToggleBtn').textContent=ui.traceOpen?'▲':'▼';ui.dirty=false;
  }
  function markSignals(events){ui.activeSignals=new Set(events.flatMap(e=>e.signals||[]));ui.pulseUntil=performance.now()+180;}
  function stepBatch(count){
    if(!ui.powered)return;
    const before=bus.sequence;
    try{cpu.runInstructions(count);markSignals(bus.trace.filter(e=>e.seq>before));ui.dirty=true;}
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
    clearRunHandle();executionPace.reset();
    if(!ui.running||!ui.powered||document.hidden)return;const p=paces[ui.paceIndex];
    if(p.mode==='interval')runTimer=setInterval(()=>{stepBatch(visualBatch());executionPace.sample();},p.ms);
    else{
      const loop=at=>{
        if(!ui.running||!ui.powered||document.hidden)return;
        const before=bus.sequence;
        try{executionPace.advance(at,p.label);markSignals(bus.trace.filter(e=>e.seq>before));ui.dirty=true;}
        catch(err){stopRun();queryOne('#machineState').textContent='FAULT';queryOne('#statusRun').textContent='FAULT';console.error(err);return;}
        runTimer=requestAnimationFrame(loop);
      };
      runTimer=requestAnimationFrame(loop);
    }
  }
  function clearRunHandle(){if(runTimer==null)return;clearInterval(runTimer);cancelAnimationFrame(runTimer);runTimer=null;}
  function startRun(){if(!ui.powered)return;ui.running=true;scheduleRun();ui.dirty=true;}
  function stopRun(){ui.running=false;clearRunHandle();ui.dirty=true;}
  function toggleRun(){if(!ui.powered)return;ui.running?stopRun():startRun();}
  function resetCpu(){
    if(!ui.powered)return;
    stopRun();bus.resetIoDevices();lastBeepSequence=0;queryOne('#keyboardCapture').value='';cpu.reset();ui.lastFetchAddress=0;ui.activeSignals=new Set();ui.pulseUntil=0;ui.dirty=true;
  }
  function unlockAudio(){
    const AudioContextClass=globalThis.AudioContext||globalThis.webkitAudioContext;
    if(!AudioContextClass)return null;
    try{
      if(!audioContext)audioContext=new AudioContextClass();
      if(audioContext.state==='suspended')audioContext.resume().catch(()=>{});
    }catch(_error){return null;}
    return audioContext;
  }
  function playPendingBeep(){
    if(beeper.sequence===lastBeepSequence)return;
    lastBeepSequence=beeper.sequence;
    if(!ui.powered)return;
    const context=unlockAudio();if(!context)return;
    try{
      const now=context.currentTime,oscillator=context.createOscillator(),gain=context.createGain();
      oscillator.type='square';oscillator.frequency.setValueAtTime(880,now);
      gain.gain.setValueAtTime(0.0001,now);gain.gain.exponentialRampToValueAtTime(0.045,now+0.005);gain.gain.exponentialRampToValueAtTime(0.0001,now+0.08);
      oscillator.connect(gain);gain.connect(context.destination);oscillator.start(now);oscillator.stop(now+0.09);
    }catch(_error){}
  }
  function powerOn(){
    if(ui.powered)return;
    stopRun();bus.clearWritableMemory(0);bus.resetIoDevices();lastBeepSequence=0;unlockAudio();queryOne('#keyboardCapture').value='';cpu.reset();video.setPower(true);ui.powered=true;
    ui.lastFetchAddress=0;ui.activeSignals=new Set();ui.pulseUntil=0;renderDevices();ui.dirty=true;
  }
  function powerOff(){
    if(!ui.powered)return;
    stopRun();ui.powered=false;bus.resetIoDevices();lastBeepSequence=0;queryOne('#keyboardCapture').value='';queryOne('#keyboardCapture').blur();bus.clearWritableMemory(0);video.setPower(false);bus.clearTrace();
    ui.lastFetchAddress=0;ui.activeSignals=new Set();ui.pulseUntil=0;renderDevices();ui.dirty=true;
  }
  function togglePower(){ui.powered?powerOff():powerOn();}
  function cyclePace(){const was=ui.running;stopRun();ui.paceIndex=(ui.paceIndex+1)%paces.length;if(was)startRun();ui.dirty=true;}
  function toggleTrace(){ui.traceOpen=!ui.traceOpen;ui.dirty=true;}

  function syncMoreSheet(){
    const menu=queryOne('#moreMenu');
    if(!menu)return;
    queryOne('#morePaceValue').textContent=`${paces[ui.paceIndex].label} · ${ui.running&&!document.hidden?executionPace.mhz.toFixed(2):'0.00'} MHz`;
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
    if(action==='beep'){beeper.writePort(BEEPER_PORT,0x07);ui.dirty=true;}
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
    document.addEventListener('visibilitychange',()=>{scheduleRun();ui.dirty=true;});
    const keyboardCapture=queryOne('#keyboardCapture'),crt=queryOne('#crtViewport');
    crt.addEventListener('click',activateKeyboard);
    crt.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activateKeyboard();}});
    keyboardCapture.addEventListener('keydown',e=>{
      if(!e.isComposing&&e.ctrlKey&&!e.metaKey&&!e.altKey&&e.key.toLowerCase()==='g'){
        e.preventDefault();keyboard.enqueueByte(0x07);ui.dirty=true;return;
      }
      if(!e.isComposing&&!e.metaKey&&!e.ctrlKey&&!e.altKey&&(e.key==='Enter'||e.key==='Backspace')){
        e.preventDefault();enqueueHostKey(e.key);
      }
    });
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
    const rom=buildSystemRom(),tm=new Shino80Memory();tm.loadFirmware(rom.bytes);
    const tb=new Shino80Bus({memoryDevice:tm}),tc=new Z80Core(tb);
    tb.clearWritableMemory(0xA5);tb.resetIoDevices();tc.reset();tb.clearTrace();
    tc.runInstructions(rom.meta.instructionsBeforeLoop);
    const firstChar=tb.debugPeek(TEXT_VRAM_BASE),lastClear=tb.debugPeek(TEXT_VRAM_BASE+0x7FF);
    const romByte=tb.debugPeek(0);tb.cpuWrite(0,0x00,{purpose:'SELFTEST_ROM_WRITE'});
    return firstChar===0x53&&lastClear===0x00&&tc.state.pc===rom.labels.MONITOR_LOOP&&
      tb.debugPeek(0)===romByte&&tb.debugPeek(0x2000)===rom.bytes[0x2000]&&tb.trace.some(e=>e.purpose==='ROM_WRITE_BLOCKED');
  }
  function observerLoop(){playPendingBeep();if(ui.dirty||performance.now()<ui.pulseUntil)render();requestAnimationFrame(observerLoop);}

  buildStaticUi();bind();const ok=selfTest();queryOne('#selfTest').textContent=ok?'PHASE 2A.1 SELF TEST PASS':'SELF TEST FAIL';setView('display');powerOff();render();requestAnimationFrame(observerLoop);
})();
