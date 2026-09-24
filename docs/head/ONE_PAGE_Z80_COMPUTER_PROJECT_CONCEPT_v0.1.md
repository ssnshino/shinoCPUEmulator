# ONE-PAGE Z80 COMPUTER — PROJECT CONCEPT v0.1

Created: 2026-09-24T13:20:14+09:00
Status: **PROJECT CONCEPT / CURRENT INTENT**
Machine codename: **SHINO-80**

この文書は、チャットで定義されたONE-PAGE Z80 COMPUTER / SHINO-80の初期企画をRepository用に整理した正本資料である。

---

## 1. PROJECT CONCEPT

HTML / CSS / JavaScript を基本として、ブラウザ上で動作する、新規設計のZ80コンピュータを作る。

目的はPC-88、MSX、Spectrum等の既存機を再現することではない。

Z80 CPUの機能・命令・レジスタ・割り込み・I/O・メモリアクセス等をエミュレートし、その上に、

> **もし今、Z80を使って新しい8bit PCを設計するなら？**

という発想で完全オリジナルのコンピュータを構築する。

単なるCPUエミュレータではなく、CPU / RAM / ROM / BIOS / VRAM / Keyboard / Floppy Disk / RS-232C / Printer Port / Timer / Sound / Virtual Disk / Debugger / Memory Monitor / Bus Monitorまで含めた、**透明な8bitコンピュータ**を目指す。

---

## 2. CORE IDEA

1980年代のPCを再現するのではなく、**1980年代に存在していそうな新しいPCを2026年に作る。**

内部CPUはZ80。

周辺回路、BIOS、OS、メモリマップ、I/Oポート、表示装置などは自由に設計する。

候補:

```text
SHINO-80 COMPUTER
CPU       Z80 @ 4 MHz
RAM       64 KB
ROM       BIOS / MONITOR
VIDEO     TEXT + BITMAP
FLOPPY    DRIVE A: / B:
SERIAL    RS-232C
PRINTER   PARALLEL
TIMER     SYSTEM TIMER
SOUND     PSG
```

仕様は研究しながら決定する。

---

## 3. MOST IMPORTANT PRINCIPLE

このプロジェクトの特徴は、**コンピュータ内部をリアルタイムで見えるようにすること。**

SHINO-80では、

```text
仮想PC画面
+
CPU Inspector
+
Memory Inspector
+
Disassembler
+
Bus Analyzer
+
Device Monitor
```

を同時表示できるようにする。

つまり、CPUの中を透視しながらPCを操作できる。

---

## 4. Z80 CPU CORE

主要register:

- A / F
- B / C
- D / E
- H / L
- AF'
- BC'
- DE'
- HL'
- IX
- IY
- SP
- PC
- I
- R

Flags:

- S
- Z
- H
- P/V
- N
- C

必要に応じてundocumented flagsも研究対象。

CPU State:

- IFF1
- IFF2
- IM 0
- IM 1
- IM 2
- HALT
- INT
- NMI

最初はinstruction accuracyを優先し、その後必要に応じてT-state / M-cycle / bus timing精度を高める。

---

## 5. CPU DEBUGGER

画面横に常時表示する。

例:

```text
CPU
AF  12F0
BC  0020
DE  C000
HL  8042
IX  0000
IY  0000
SP  FE80
PC  013A
AF' 0000
BC' 0000
DE' 0000
HL' 0000
I   00
R   3A

FLAGS
S Z H P/V N C
0 1 0  0  0 1

INTERRUPT
IFF1 1
IFF2 1
IM   1

CLOCK
4.000 MHz
T-STATES 001928371
```

---

## 6. DISASSEMBLER

現在PC周辺をリアルタイム表示する。

```text
0134  3E 41      LD A,41h
0136  21 00 C0   LD HL,C000h
0139  77         LD (HL),A
>013A 23         INC HL
013B  D3 20      OUT (20h),A
013D  18 FA      JR 0139h
```

現在実行命令を強調表示する。

将来:

- breakpoint
- step
- step over
- run until
- watchpoint
- execute trace

---

## 7. MEMORY MONITOR

64KBメモリを表示する。

CPUがアクセスしたアドレスをREAD / WRITE / EXECUTEで一瞬光らせる。

候補memory map:

```text
0000 ┌─────────────┐
     │ BIOS ROM    │
2000 ├─────────────┤
     │ SYSTEM RAM  │
8000 ├─────────────┤
     │ USER RAM    │
C000 ├─────────────┤
     │ VRAM        │
E000 ├─────────────┤
     │ WORK AREA   │
FFFF └─────────────┘
```

この構成自体は今後設計する。

---

## 8. BUS MONITOR

候補signal:

- MREQ
- IORQ
- RD
- WR
- M1
- RFSH
- WAIT
- HALT
- INT
- NMI

例:

```text
T1  MREQ RD    013A -> 23
T2
T3  MREQ RD    013B -> D3
T4  MREQ RD    013C -> 20
T5  IORQ WR    0020 <- 48
```

CPU命令とbus動作の関係を視覚化する。

---

## 9. CONTROL PANEL

最低限:

- RUN
- PAUSE
- STEP
- STEP OVER
- RESET
- IRQ
- NMI

候補CLOCK SPEED:

- x0.1
- x1
- x10
- MAX

実時間動作と高速実行を切り替える。

---

## 10. BIOS / ROM

既存PC ROMを使わず、完全オリジナルBIOSを設計する。

起動例:

```text
SHINO-80 BIOS REV 0.01
RAM TEST ........ 64K OK
VIDEO ........... OK
FDC ............. READY
SERIAL .......... READY
PRINTER ......... ONLINE
SHINO-80 READY
A>
```

BIOS API候補:

```text
RST 08h  PUTCHAR
RST 10h  GETCHAR
RST 18h  DISK READ
RST 20h  DISK WRITE
RST 28h  SERIAL I/O
RST 30h  PRINTER OUTPUT
```

Z80文化・既存8bit機の設計を調べた上で、SHINO-80として美しい構成を考える。

---

## 11. VIDEO SYSTEM

最初はTEXT MODE。

候補:

- 80 x 25
- ASCII / 独自CHAR ROM
- 16 colors
- cursor
- blink

VRAMをMemory Inspectorから確認できるようにする。

CPUがVRAMへ文字を書いた瞬間、

```text
C000 ← 48
```

とMemory Monitorで光り、画面には `H` が出る。

将来候補:

- Bitmap mode
- PCG
- Sprite
- Palette RAM

v0.1ではText Video優先。

---

## 12. KEYBOARD

ブラウザキーボードを仮想Keyboard Controllerへ接続する。

Z80側からmemory mapped I/OまたはI/O portとして読む。

実PCらしいKEY MATRIX方式も研究候補。

---

## 13. FLOPPY DISK INTERFACE

DRIVE A: / B: を持つ仮想FDD。

disk imageはArrayBuffer / Uint8Arrayとして保持する。

候補geometry:

```text
80 tracks
2 sides
9 sectors
512 bytes / sector
```

FDC register候補:

```text
30h COMMAND
31h STATUS
32h TRACK
33h SECTOR
34h DATA
```

Device Monitor候補:

```text
FLOPPY DRIVE A:
MOTOR   ON
TRACK   10
SIDE    0
SECTOR  03
COMMAND READ
STATUS  BUSY
```

WebAudioでmotor / head seek / track step音も出したい。

---

## 14. RS-232C

仮想UART / RS-232C。

候補:

```text
40h SERIAL DATA
41h SERIAL STATUS
42h SERIAL CONTROL
```

状態候補:

- RX READY
- TX EMPTY
- CTS
- DSR
- DCD

Monitor例:

```text
RS-232C MONITOR
9600,N,8,1
TX
41 54 44 54 0D
ASCII
ATDT.
```

---

## 15. VIRTUAL MODEM

RS-232Cの接続先候補:

- LOCAL TERMINAL
- NULL MODEM
- VIRTUAL MODEM
- WEBRTC

将来ONE-PAGE IMPと接続する。

```text
SHINO-80
   │
UART
   │
VIRTUAL RS-232C
   │
VIRTUAL MODEM
   │
WebRTC
   │
REMOTE SHINO-80
```

Z80自身はWebRTCを知らない。

---

## 16. PRINTER PORT

仮想parallel printer port。

候補:

```text
50h PRINTER DATA
51h PRINTER STATUS
52h PRINTER CONTROL
```

Z80側:

```asm
LD A,'H'
OUT (50h),A
```

仮想プリンタ側:

```text
SHINO DOT MATRIX PRINTER
ONLINE
HELLO WORLD
```

WebAudioでドットインパクト音と紙送りを再現する。

将来:

- save text
- save PNG
- browser print

---

## 17. SOUND

初期は不要。

将来候補:

- PSG
- AY-3-8910系思想
- simple square wave
- noise
- beeper

---

## 18. TIMER / INTERRUPT

定周期Timer候補:

```text
100 Hz SYSTEM TIMER
```

Timer IRQ用途:

- clock
- keyboard scan
- OS scheduler
- cursor blink

NMIもUIから発生可能にする。

---

## 19. STORAGE

Browser側候補:

- IndexedDB
- File API
- ArrayBuffer
- Uint8Array

機能候補:

- IMPORT DISK IMAGE
- EXPORT DISK IMAGE
- SAVE MACHINE STATE
- LOAD MACHINE STATE

---

## 20. FUTURE SOFTWARE

候補:

- SHINO MONITOR
- SHINO BIOS
- SHINO BASIC
- SHINO-DOS
- ASSEMBLER
- DEBUGGER
- EDITOR

例:

```text
A> BASIC
SHINO BASIC 1.0
READY
10 PRINT "HELLO WORLD"
20 LPRINT "PRINTER TEST"
RUN
```

---

## 21. NOT AN EXISTING MACHINE EMULATOR

PC-88 / MSX / Spectrum / CP/M machine等の完全互換を最初から目指さない。

参考にはするが、既存機互換性という制約から自由になる。

- Z80は本物
- 周辺機器はSHINO-80として合理的かつ楽しく設計
- emulator compatibility hellを避ける
- proprietary ROM問題を避ける
- 特殊chip完全再現を避ける

---

## 22. COPYRIGHT / ROM POLICY

既存PCのBIOS ROMや市販ソフトROMをprojectへ組み込まない。

必要なROM codeは完全オリジナルで作る。

既存Z80資料・datasheet・技術資料は仕様研究の参考にする。

---

## 23. ONE-PAGE POLICY

基本的には、一枚HTMLで動作するコンピュータを目指す。

HTML内部にEmulator / BIOS binary / Video / Device emulation / Debugger / UIを内包可能。

必要なら開発段階では分割し、最終的にone-page buildを生成する。

---

## 24. DEVELOPMENT PHASES

### PHASE 1 — Z80 CORE

- register
- flags
- memory
- instruction decode
- execution
- PC / SP
- basic timing
- RESET
- HALT
- IRQ / NMI

CPU unit tests重視。

### PHASE 2 — DEBUG MACHINE

- register viewer
- memory monitor
- disassembler
- step
- run
- breakpoint

PCとして未完成でよい。

### PHASE 3 — MINIMUM COMPUTER

- ROM
- RAM
- text VRAM
- keyboard
- timer

`SHINO-80 READY >` が出るところまで。

### PHASE 4 — STORAGE

- floppy controller
- virtual floppy image
- BIOS disk API
- boot disk

### PHASE 5 — I/O WORLD

- RS-232C
- Printer
- sound
- device monitors

### PHASE 6 — SOFTWARE

- Monitor
- BASIC
- DOS
- assembler
- editor

### PHASE 7 — NETWORK

ONE-PAGE IMPと接続。

```text
Z80
↓
UART
↓
Virtual Modem
↓
WebRTC
```

---

## 25. REALTIME MONITOR PHILOSOPHY

PCを使うだけでなく、PCが動く様子を見る。

文字表示:

```text
CPU executes
↓
BUS WRITE
↓
VIDEO / VRAM CHANGE
↓
PIXEL / CHARACTER DISPLAY
```

disk read:

```text
BIOS CALL
↓
FDC COMMAND
↓
TRACK SEEK
↓
SECTOR READ
↓
RAM transfer
```

**観賞できるコンピュータ**でもある。

---

## 26. VISUAL DESIGN

仮想PC画面とInspectorを分ける。

```text
┌──────────── SHINO-80 DISPLAY ─────────────┐
│                                            │
│ A>                                         │
│                                            │
└────────────────────────────────────────────┘
CPU             MEMORY
REGISTERS       HEX VIEW
BUS             DISASSEMBLER
MREQ            CURRENT PC
IORQ
FLOPPY          SERIAL
TRACK           TX/RX
PRINTER         TIMER
ONLINE          IRQ
```

一気に全部表示してごちゃごちゃさせず、折りたたみやInspector modeを研究する。

---

## 27. PERFORMANCE

Z80 CPU実行よりDOM更新 / memory monitor全更新 / bus log大量表示 / disassembler / debugger UIの方が重くなる可能性がある。

CPU実行と可視化UIの更新頻度を分離する。

候補:

```text
Z80 execution   4 MHz equivalent
Debugger UI     30 / 60 Hz
Memory highlight event-based
```

---

## 28. RESEARCH POLICY

実装前にWeb検索を行う。

優先:

- Zilog / Z80 official documentation
- instruction timings
- interrupt behavior
- flags
- refresh register
- existing open-source emulator implementations
- browser emulator architecture
- floppy controller architecture
- UART / RS-232C
- Centronics parallel printer interface
- CP/M style BIOS concepts
- 1980s microcomputer architecture

既存コードを無批判にコピーしない。

---

## 29. ACCURACY POLICY

```text
Level 1  instruction functional accuracy
Level 2  flags / interrupts accuracy
Level 3  T-state timing
Level 4  bus-cycle visibility
Level 5  cycle-sensitive device behavior
```

最初からcycle-perfectを要求して開発を止めない。

---

## 30. CURRENT STATUS

アイデア / Research準備段階。

まず専用Repositoryで、

1. Z80仕様調査
2. Machine architecture
3. memory map
4. I/O map
5. CPU core design
6. MVP design

を行う。

---

## 31. FIRST ACTION

最初にWeb検索を行い、

- Z80 CPU official documentation
- instruction set
- registers
- interrupts
- bus signals
- T-state / M-cycle
- browser Z80 emulator implementations
- emulator testing methodology

を調査する。

その上で `SHINO-80 Architecture Draft` を検証・更新する。

最初に決める候補:

- CPU clock
- memory map
- ROM size
- RAM size
- VRAM
- text mode
- I/O port map
- interrupt structure
- timer
- keyboard
- floppy interface

その後PHASE 1へ進む。

---

## 32. CORE PHRASES

> PC-88を再現するんじゃない。

> Z80を使った新しいPCを作る。

> CPUは本物。周辺機器は俺たちが設計する。

> 1980年代のコンピュータを、2026年のデバッガで透視する。

> フロッピーは回る。RS-232Cは喋る。プリンタはガガガガ鳴る。

> そして全部ブラウザの中。

**ONE-PAGE Z80 COMPUTER / SHINO-80**
