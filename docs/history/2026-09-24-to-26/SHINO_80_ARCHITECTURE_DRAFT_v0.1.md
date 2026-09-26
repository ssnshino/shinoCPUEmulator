# SHINO-80 Architecture Draft v0.1

Created: 2026-09-24T13:20:14+09:00
Status: **DRAFT / RESEARCH CANDIDATE — NOT FROZEN**

この文書はチャット上で出た初期Architecture案を保存する。
PHASE 0 researchで公式Z80資料・test suite・既存実装を確認し、採用/修正/破棄する。

---

## 1. Proposed machine baseline

| Item | Draft |
| --- | --- |
| CPU | Z80 compatible core |
| Clock | 4.000 MHz |
| Address bus | 16-bit |
| Data bus | 8-bit |
| ROM | 8 KiB candidate |
| RAM | 48 KiB candidate |
| VRAM | 8 KiB candidate |
| Video | 80x25 text first |
| Timer | 100 Hz candidate |
| Keyboard | matrix candidate |
| FDD | A:/B:, 720 KiB-class candidate |
| Serial | UART / RS-232C |
| Printer | Centronics-inspired parallel |
| Sound | reserved in first MVP |

### Why RAM is not fixed at 64 KiB yet

CPU address space itself is 64 KiB. If ROM and memory-mapped VRAM are always visible, a literal 64 KiB RAM requires overlay/bank design.

PHASE 0でbank switchingを入れる必要性を検討する。
v0.1候補では単純さを優先し、ROM + RAM + VRAMを64 KiB空間へ明示配置する案を持つ。

---

## 2. Candidate memory map

```text
0000 ┌────────────────┐
     │ BIOS ROM  8K   │
2000 ├────────────────┤
     │                │
     │ USER RAM 40K   │
     │                │
C000 ├────────────────┤
     │ TEXT VRAM 4K   │
D000 ├────────────────┤
     │ ATTR VRAM 4K   │
E000 ├────────────────┤
     │ SYSTEM RAM 8K  │
FFFF └────────────────┘
```

合計:

- ROM 8 KiB
- RAM 48 KiB
- VRAM 8 KiB

**未確定。**

---

## 3. Text video candidate

80 x 25 = 2000 cells.

```text
C000-C7CF  Character Code
C7D0-CFFF  Reserved

D000-D7CF  Attribute
D7D0-DFFF  Reserved
```

Attribute candidate:

```text
7       BLINK
6-4     BACKGROUND 0-7
3-0     FOREGROUND 0-15
```

目標観測:

```text
CPU:    LD (HL),A
BUS:    MREQ WR C000 <- 48
MEMORY: C000 [48] flash
VIDEO:  H
```

---

## 4. Candidate I/O map

```text
00-0F  SYSTEM / IRQ / TIMER
10-1F  VIDEO CONTROL
20-2F  KEYBOARD
30-3F  FLOPPY
40-4F  UART / RS-232C
50-5F  PRINTER
60-6F  SOUND reserved
70-7F  SYSTEM EXPANSION
80-FF  EXPANSION BUS
```

Candidate registers:

```text
02 IRQ_STATUS
03 IRQ_MASK
04 IRQ_ACK

10 VIDEO_MODE
11 CURSOR_X
12 CURSOR_Y
13 CURSOR_CONTROL

20 KEY_ROW
21 KEY_COLUMN

30 FDC_COMMAND
31 FDC_STATUS
32 FDC_TRACK
33 FDC_SECTOR
34 FDC_DATA
35 FDC_DRIVE

40 UART_DATA
41 UART_STATUS
42 UART_CONTROL
43 UART_BAUD

50 PRINTER_DATA
51 PRINTER_STATUS
52 PRINTER_CONTROL
```

I/O address width / decode behaviorはZ80仕様確認後に確定する。

---

## 5. BIOS vector candidate

```text
0000 RESET / COLD BOOT

0008 RST 08  PUTCHAR
0010 RST 10  GETCHAR
0018 RST 18  DISK READ
0020 RST 20  DISK WRITE
0028 RST 28  SERIAL I/O
0030 RST 30  PRINTER OUTPUT

0038 IM1 INTERRUPT
0066 NMI
```

候補として0038hはIM1用に空ける。

NMIは将来「BREAK INTO MONITOR」に利用する案。

---

## 6. CPU state design candidates

Visible architectural state:

- primary / alternate registers
- IX / IY
- SP / PC
- I / R
- flags
- IFF1 / IFF2
- interrupt mode
- HALT state

Internal future-compatible slotsを検討:

- prefix state
- EI delay
- internal temporary state
- undocumented/internal state required by high-accuracy tests

最初から全てを正確に実装するのではなく、後からaccuracyを上げられるstate modelにする。

---

## 7. BUS FIRST

CPU Coreから直接DOMやdevice UIを呼ばない。

Concept:

```text
CPU
 ↓
BUS / MACHINE FABRIC
 ├ MEMORY SPACE
 │  ├ ROM
 │  ├ RAM
 │  └ VRAM
 ├ I/O SPACE
 │  └ Devices
 ├ SIGNALS
 │  ├ INT
 │  ├ NMI
 │  └ WAIT
 └ TIMING
```

### CPU access vs Debug access

区別する:

- CPU READ
- CPU WRITE
- CPU EXECUTE/FETCH
- DEBUG PEEK
- DEBUG POKE (if enabled)

Memory Inspector / Disassemblerが覗いたことをCPU bus eventとして記録しない。

---

## 8. Trace event candidate

将来CPU familyでも使える可能性のある観測event例:

```text
time
cpu
space
operation
address
data
width
signals
purpose
```

例:

```text
TIME       184932
CPU        Z80
SPACE      MEMORY
OP         READ
ADDRESS    013A
DATA       23
SIGNALS    M1 MREQ RD
PURPOSE    OPCODE_FETCH
```

共通化は候補であり、Z80固有signalを失う形にはしない。

---

## 9. FDD behavior candidate

一瞬でsectorをRAMへcopyする高レベルFDDから始めるのではなく、将来的に状態遷移を観測可能にする。

```text
COMMAND
↓
MOTOR ON
↓
HEAD SEEK
↓
BUSY
↓
DRQ
↓
DATA transfers
↓
IRQ
```

最初の実装ではPIOを優先し、DMAはfuture candidate。

Audioはactual virtual device stateと同期させる。

---

## 10. Timer / virtual time candidate

4 MHz / 100 Hzなら単純計算上は1 tickあたり40,000 T-state。

ただし正確なscheduler設計はPHASE 0で検証する。

原則:

- machine timeはCPU timing由来
- browser `performance.now()` はrun budget決定に使用
- Timer/FDD/UART等を独立したwall-clock intervalへしない
- PAUSEはmachine time全体を止める

---

## 11. Debug Lab boundary

```text
┌──────── MACHINE : SHINO-80 ────────┐
│ Z80 + BUS + MEMORY + DEVICES        │
└─────────────────────────────────────┘
                 ↓ trace/state
┌──────────── DEBUG LAB ──────────────┐
│ CPU / DISASM / MEMORY / BUS / DEVICE│
└─────────────────────────────────────┘
```

Debuggerはmachineを観測する側。

---

## 12. First heartbeat target

最初のCPU実装success image:

```text
RESET
↓
PC = 0000
↓
opcode fetch
↓
NOP
↓
PC = 0001
↓
timing advances
↓
refresh/register behavior advances as specified
↓
Bus Traceに観測可能
↓
Inspectorに反映
```

この時点ではVideo/FDD/OSは不要。

---

## 13. Research sources to verify

PHASE 0でWeb検索・一次資料確認を行う。

Candidate sources:

- Zilog Z80 CPU User Manual / official documentation
- Z80 instruction/timing references
- SingleStepTests/z80
- Patrik Rak z80test
- ZEXDOC / ZEXALL background
- multiple open-source emulator implementations for comparative reading

外部実装を正解と決め打ちしない。

---

## 14. Architecture decisions still OPEN

- exact Z80 variant / compatibility target
- ROM 8 KiB vs other size
- RAM 48 KiB vs overlay/bank scheme
- VRAM layout
- text character encoding / character ROM
- I/O decode width
- interrupt controller
- timer programming model
- keyboard matrix
- FDC model
- UART model
- printer handshake model
- exact bus-trace granularity
- one-page build architecture

PHASE 0で閉じるものと、MVP後までOPENにするものを分ける。
