# VIRTUAL MICROCOMPUTER LAB — LONG-TERM VISION v0.1

Created: 2026-09-24T13:20:14+09:00
Status: **FUTURE VISION / NOT CURRENT IMPLEMENTATION**

この文書はSHINO-80完成後の将来拡張構想を保存する。現在のPHASE 0/1でこれを理由に過剰抽象化しない。

---

## 33. FUTURE EXPANSION — CPU FAMILY

SHINO-80でZ80 CPU coreが完成した後、単一CPU専用エミュレータで終わらせない。

候補:

```text
CPU CORE
 ├─ Z80
 ├─ Intel 8080
 ├─ MOS 6502
 ├─ Motorola 6809
 ├─ Motorola 68000
 ├─ Intel 8086
 └─ その他
```

Z80実装で得られたCPU execution architecture / memory access abstraction / I/O abstraction / interrupt handling / debugger / disassembler / bus monitor / timing / device connectionを、可能な範囲で共通基盤化する。

ただし、

> CPUごとの違いを無理に共通化して個性を失わせない。

共通なのは「仮想マシン基盤」。CPU coreそのものは各CPU固有設計を尊重する。

---

## 34. MACHINE FAMILY CONCEPT

候補:

```text
SHINO-80   Z80
SHINO-65   MOS 6502
SHINO-09   Motorola 6809
SHINO-68K  Motorola 68000
```

既存PCのコピーではない。

> **そのCPUを使って、今あらためて新しいマイクロコンピュータを設計したらどうなるか**

CPU特性によってmemory map / interrupt architecture / video / I/O / OS / firmware / programming cultureまで変化してよい。

---

## 35. VIRTUAL MOTHERBOARD

最終的にはブラウザ上の仮想マザーボード設計環境へ発展する可能性がある。

```text
CPU SLOT
[ Z80 ▼ ]

CLOCK
[ 4.000 MHz ]

RAM
[ 64 KB ▼ ]

ROM
[ 16 KB ▼ ]

VIDEO
[ TEXT 80x25 ▼ ]

FLOPPY
[ ENABLED ]

SERIAL
[ ENABLED ]

PRINTER
[ ENABLED ]

SOUND
[ PSG ]

NETWORK
[ NONE ]
```

ただし最初からGUI machine builderは作らない。まずSHINO-80一台を完成させ、再利用可能な境界を実装から発見する。

---

## 36. BUS-BASED ARCHITECTURE

```text
CPU
 │
SYSTEM BUS
 │
 ├─ RAM
 ├─ ROM
 ├─ VIDEO
 ├─ TIMER
 ├─ FDC
 ├─ UART
 ├─ PRINTER
 ├─ SOUND
 └─ NETWORK
```

各deviceはmemory mapped / I/O mapped / interrupt source / DMA candidate / clocked peripheral等の性質を持つ。

CPUとdeviceの接続そのものを設計対象にする。

---

## 37. DEVICE PLUG-IN CONCEPT

候補:

```text
VIDEO
 ├ TEXT CRT
 ├ BITMAP CRT
 ├ TILE VIDEO
 └ CUSTOM GPU

STORAGE
 ├ FLOPPY
 ├ RAM DISK
 ├ HARD DISK
 └ ROM CARTRIDGE

SERIAL
 ├ UART
 ├ NULL MODEM
 ├ VIRTUAL MODEM
 └ NETWORK MODEM

SOUND
 ├ BEEPER
 ├ PSG
 ├ FM
 └ PCM
```

プラグイン構造のために最初から過剰抽象化しない。

---

## 38. ONE-PAGE IMP INTEGRATION

Z80側へWebRTCを直接見せない。

```text
SHINO-80
   │
   │ RS-232C
   ▼
VIRTUAL UART
   │
   ▼
VIRTUAL MODEM
   │
   ▼
ONE-PAGE IMP
   │
   ▼
WebRTC
   │
   ▼
REMOTE NODE
```

Z80から見ればRS-232C接続のモデムに過ぎない。

裏側ではWebRTC / ICE / STUN / Peer Directory / Gossip / P2Pが動いてよい。

---

## 39. VIRTUAL MODEM

AT command風interface候補:

```text
A> MODEM

AT
OK

ATDT SHINO02
CONNECT 9600
```

Z80側appは `ATDT SHINO02` しか知らない。

bandwidth候補:

- 300
- 1200
- 2400
- 9600
- 19200

2026年ネットワーク上で1980年代風通信を体験する。

---

## 40. SHINO-NET

架空network service候補:

```text
A> MODEM
ATDT SHINO-NET

CONNECT 9600

SHINO-NET NODE 02
LOGIN:
```

service候補:

- terminal login
- BBS
- chat
- file transfer
- remote shell
- multiplayer text game
- network printer
- remote disk
- mail

全てZ80 application側から利用し、browserはtransportのみ担当する。

---

## 41. NETWORKED SHINO COMPUTERS

```text
SHINO-80 A
     │
 WebRTC
     │
SHINO-80 B
```

さらにSHINO-80 / SHINO-65 / SHINO-09 / SHINO-68Kのような異CPU機同士でも、RS-232C protocolが共通なら通信できる。

> **CPUが違っても通信規格で会話できる。**

---

## 42. OPERATING SYSTEM

候補名:

```text
SHINO-DOS
```

要素候補:

- BIOS abstraction
- console
- filesystem
- disk access
- command shell
- program loader
- memory management
- device I/O
- serial
- printer
- clock

小さく起動して少しずつ育てる。

---

## 43. DEVELOPMENT SOFTWARE

候補:

```text
SHINO MONITOR
SHINO ASM
SHINO BASIC
TEXT EDITOR
DEBUGGER
SHINO C (future research)
```

ブラウザ外でbinaryを作るだけでなく、SHINO-80自身の中でも開発できることを目指す。

---

## 44. SELF-HOSTING DREAM

```text
SHINO-80
↓
EDITOR
↓
ASSEMBLER
↓
SOURCE.ASM
↓
PROGRAM.COM
↓
RUN
```

さらにRS-232Cで別SHINO-80へ自作programを転送する。

---

## 45. 8BIT SOFTWARE CULTURE

単なるemulatorではなく、架空の8bit computer文化圏そのものを作る可能性がある。

- SHINO BASIC programs
- SHINO-DOS utilities
- disk images
- network tools
- terminal software
- games
- graphics demos
- sound demos
- printer software

> 「昔こんなPCあった気がする」

くらいまで世界観を作る。

---

## 46. MULTI-MACHINE TIMELINE

悪ノリ候補:

```text
1981 SHINO-80
     Z80 / 4MHz / 64KB

1983 SHINO-80II
     improved video / floppy

1985 SHINO-80NET
     modem / networking

1986 SHINO-09
     6809 architecture

1988 SHINO-68K
     68000 / GUI experiment
```

実際には2026年にブラウザで動いている。

---

## 47. CROSS-MACHINE SOFTWARE

CPUが違ってもfile format / serial protocol / disk filesystem / network protocolを共通化できる可能性がある。

候補:

```text
SHINO COMMON DISK FORMAT
SHINO SERIAL PROTOCOL
SHINO-NET PROTOCOL
```

---

## 48. REAL HARDWARE POSSIBILITY

将来、FPGAや実Z80でSHINO-80互換機を作れる可能性を残す。

そのため可能な範囲で、

- memory map
- I/O map
- interrupt
- timing
- device specification

を明文化する。

現時点で実機制作は必須ではない。

---

## 49. WHY THIS PROJECT MATTERS

本質は懐古ではない。

> **コンピュータがどう動いているのかを、現代の計算能力を使って丸ごと可視化すること。**

1980年代当時には難しかったCPU内部表示 / realtime disassembly / memory heatmap / bus tracing / device state / instant snapshot / rewind / artificial slowdown等を同時に実現する。

> **古いCPUを、当時存在しなかった最高の観測装置で見る。**

---

## 50. FINAL LONG-TERM VISION

```text
VIRTUAL MICROCOMPUTER LAB
│
├ CPU CORE LIBRARY
│  ├ Z80
│  ├ 6502
│  ├ 6809
│  └ 68000
│
├ VIRTUAL MOTHERBOARD
│
├ DEVICE LIBRARY
│  ├ VIDEO
│  ├ FLOPPY
│  ├ UART
│  ├ PRINTER
│  ├ SOUND
│  └ NETWORK
│
├ DEBUG LAB
│  ├ CPU
│  ├ MEMORY
│  ├ BUS
│  └ DEVICE
│
└ MACHINE FAMILY
   ├ SHINO-80
   ├ SHINO-65
   ├ SHINO-09
   └ SHINO-68K
```

> **ブラウザ上の仮想コンピュータ設計工房。**

---

## 51. IMPORTANT DEVELOPMENT ORDER

```text
まずZ80を動かす
↓
SHINO-80を一台完成させる
↓
BIOSを動かす
↓
周辺機器を増やす
↓
OSを動かす
↓
通信させる
↓
そこから共通構造を抽出
↓
第二CPUへ進む
```

最初から「将来6502にも対応するから全部抽象化しよう」と考えすぎない。

**実働する一台から学ぶ。**

---

## 52. EXPANSION CORE PHRASES

> Z80が完成したら、次のCPUが見えてくる。

> PCをエミュレートするのではない。PCを設計する。

> CPUを差し替える。周辺機器を差し替える。新しいコンピュータが生まれる。

> WebRTCをZ80に見せない。Z80にはモデムだけ見せる。

> 1980年代のPCが、2026年のP2Pネットワークで会話する。

> 存在しなかった8bit文化圏を、いま作る。

> 古いCPUを、当時存在しなかった最高の観測装置で見る。

> 最終形はエミュレータではない。

**VIRTUAL MICROCOMPUTER LAB.**
