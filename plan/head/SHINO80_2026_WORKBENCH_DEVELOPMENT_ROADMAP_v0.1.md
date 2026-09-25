# SHINO-80 2026 WORKBENCH DEVELOPMENT ROADMAP v0.1

Created: 2026-09-25T10:26:00+09:00  
Status: **FUTURE ROADMAP / NOT CURRENT IMPLEMENTATION**  
Related: `docs/head/VIRTUAL_MICROCOMPUTER_LAB_VISION_v0.1.md`

この文書は、SHINO-80を「Z80マシンそのもの」と「2026年のブラウザ開発環境」に明確に分離し、
両者を同一画面から自然に利用できる将来構想を保存する。

---

## 1. Core idea

SHINO-80のCPU / Bus / Memory / Deviceは、仮想マイクロコンピュータとして独立して動く。

ブラウザ側は、その外側に置かれた2026年の開発・観測ワークベンチとする。

> **Machine is retro. Workbench is modern.**

> **CPUは本物。周辺機器は俺たちが設計する。**

> **開発環境は2026年。実行環境は8bit。**

ブラウザ便利機能のために、Z80へ架空のJavaScript専用命令を追加しない。

---

## 2. Normal mode

通常時はDM-80とSHINO-80そのものを主役にする。

```text
SHINO-80
└ DM-80 DISPLAY

SHINO-80 IPL
VIDEO OK
MON
*
```

IDEやDebuggerを常時画面へ貼り付けない。

必要な時だけ呼び出す。

---

## 3. 2026 WORKBENCH surfaces

将来候補:

```text
[ EDITOR ]
[ ASM ]
[ DEBUG ]
[ MEMORY ]
[ I/O ]
[ DISK ]
[ REFERENCE ]
[ MACHINE ]
```

各機能はsheet / drawer / pane等で「しゅっ」と出し、
閉じれば再びSHINO-80本体が主役になる。

UI方針は既存の

- Modern Shell / Retro Machine
- DISPLAY FIRST
- OBSERVER SECOND
- Progressive Disclosure

を維持する。

---

## 4. MACHINE LANGUAGE REFERENCE

HELP / REFERENCEからZ80命令リファレンスを呼び出せるようにする。

検索軸候補:

- mnemonic
- opcode
- instruction family
- flag behavior
- T-state
- prefix family

表示例:

```text
D6  SUB n

Operation
A <- A - n

Bytes
D6 nn

Length
2 bytes

Timing
7 T-states

Flags
S Z H P/V N C
* * *  *  1 *

Example
LD A,20h
SUB 05h
```

将来:

```text
BASE
CB
ED
DD
FD
DDCB
FDCB
```

を切り替え可能なOpcode Mapを持つ。

---

## 5. Reference metadata policy

CPU命令実装完成後、decoder / instruction metadataからReference UIへ情報を供給できる構造を検討する。

候補metadata:

```js
{
  opcode: 0xD6,
  mnemonic: "SUB n",
  family: "ALU",
  length: 2,
  tStates: 7,
  operation: "A <- A - n"
}
```

ただし現在のZ80 PHASE 1Eを、この将来UIのために過剰抽象化しない。

まずCPUを完成させる。

---

## 6. Browser source editor

ブラウザ側にZ80 Assembly Source Editorを持てる。

例:

```asm
        ORG 8000h

START:
        LD A,41h
        LD (0C000h),A
        HALT
```

EditorはSHINO-80 CPU内部機能ではない。

---

## 7. Browser assembler

Assemblerも2026 WORKBENCH側へ配置できる。

```text
ASSEMBLE
0 ERROR
6 BYTES

8000  3E 41
8002  32 00 C0
8005  76
```

出力machine codeを開発用ロード経路でRAMへ投入可能にする。

重要:

- development load / debugger poke
- actual CPU memory read/write
- future disk/FDC I/O

を混同しない。

開発注入は必ず「外部ワークベンチ操作」として観測可能にする。

---

## 8. TRY THIS IN MONITOR

Referenceのsampleから即座に実験できる導線を将来候補とする。

```text
REFERENCE
  ↓
TRY THIS IN MONITOR
  ↓
ASSEMBLE
  ↓
LOAD TO RAM
  ↓
MONITOR / DEBUG
```

Z80命令学習環境として使える。

---

## 9. Debugger is an observer

DebuggerはCPU実行経路を汚染しない。

将来表示例:

```text
PC    OPCODE      ASM             T
8032  3E 41       LD A,41h        7
8034  32 00 C0    LD (C000h),A   13
8037  3C          INC A           4
8038  C3 34 80    JP 8034h       10
```

Register / Flags / Bus / Memory / Device stateも観測できる。

これは「CPU内部の便利命令」ではなく、外からロジアナ・ICE・debug probeを接続している思想で扱う。

---

## 10. FLOPPY changes everything

将来FDD / FDCが実装されると、SHINO-80自身の永続ストレージが成立する。

候補:

```text
FD-80
SHINOMIYA FLOPPY DRIVE

DRIVE A:
DRIVE B:
```

FDCはSHINO-80オリジナル設計とする。

例として以下のようなI/O register群を設計候補にできるが、port割当は未確定。

```text
STATUS
TRACK
SECTOR
DATA
COMMAND
```

Z80側softwareはIN / OUTでFDCへアクセスする。

---

## 11. Disk image / persistence

ブラウザ側では仮想媒体をfile / IndexedDB等へ保持できる。

将来イメージ:

```text
SHINO80_SYSTEM.D80
SOURCE.D80
PROGRAMS.D80
GAMES.D80
```

ワークフロー:

```text
EDIT
↓
ASSEMBLE
↓
LOAD / TEST
↓
SAVE TO FLOPPY
↓
POWER OFF
↓
POWER ON
↓
INSERT FLOPPY
↓
LOAD
```

ここで初めて、SHINO-80は本格的な日常開発環境へ進む。

---

## 12. Two development worlds

### Host development

2026 Browser Workbench:

- modern editor
- instant assembler
- reference
- debugger
- memory inspector
- disk image manager

### Native development

SHINO-80 itself:

- SHINO MONITOR
- future SHINO ASM
- future TEXT EDITOR
- future SHINO-DOS

最終的には両方を共存させる。

---

## 13. Self-hosting path

```text
SHINO-80
↓
TEXT EDITOR
↓
SHINO ASM
↓
SOURCE.ASM
↓
PROGRAM
↓
SAVE TO FLOPPY
↓
RUN
```

2026 Workbenchが存在しても、自機内開発の価値は残す。

---

## 14. Suggested workbench roadmap

### W0 — Z80 CPU completion
- BASE oracle verification
- CB
- ED
- DD / FD
- DDCB / FDCB
- interrupt / HALT / EI accuracy
- later undocumented precision

### W1 — Reference
- HELP entry point
- mnemonic search
- opcode search
- instruction detail
- opcode map
- sample code

### W2 — Host Editor / Assembler
- source editor
- assembler
- diagnostics
- machine code listing
- explicit development RAM loader

### W3 — Debug Workbench
- disassembler
- step / breakpoint
- register / flags
- memory
- bus trace
- device register inspector

### W4 — FDD / FDC
- original controller contract
- virtual drive
- disk image
- CPU-visible IN / OUT
- timing / interrupt behavior

### W5 — Filesystem / Native tools
- SHINO disk format
- SHINO-DOS candidate
- native loader
- native editor
- native assembler

### W6 — Integrated development culture
- source disks
- utilities
- games
- demos
- sample programs
- programming manual

### W7 — Second CPU research
SHINO-80完成後に、実働コードから共通部分を抽出する。

---

## 15. VIRTUAL MICROCOMPUTER LAB extension

SHINO-80を雛形にできるもの:

- browser shell
- workbench navigation
- debugger UX
- memory viewer UX
- bus/event visualization concepts
- device-dock concepts
- persistence UI
- reference/manual framework
- build/test/document workflow

CPU固有部分は差し替える。

---

## 16. Future CPU family candidates

既存Visionの候補に加え、x86系も研究対象になり得る。

```text
Z80
↓
8086 / 8088
↓
80286
↓
80386
↓
Pentium-class x86
```

ただし、SHINO-80完成前にGeneric CPU Framework化しない。

特にx86系はZ80より大幅にmachine architectureが複雑になるため、
「同じUIへCPU coreを差すだけ」と考えない。

---

## 17. What can be reused for x86

比較的再利用しやすい:

- Modern Shell
- Reference UI
- Source editor
- debugger framework concept
- bus trace presentation
- memory viewer
- device inspector
- disk manager
- build/test infrastructure
- machine/device separation philosophy

CPU / motherboard側は各世代固有設計とする。

---

## 18. Core phrases

> **本物の仮想8bitコンピュータに、2026年の開発環境を外付けする。**

> **開発環境は現代。実行環境は当時のCPU仕様。**

> **石は石として動く。外から最高の測定器を当てる。**

> **通常時はコンピュータ。必要な時だけ開発室が「しゅっ」と出る。**

> **SHINO-80をまず完成させる。二台目から共通基盤を発見する。**

---

## Update History

- 2026-09-25T10:26:00+09:00 — ChatGPT — Initial roadmap. 2026 Browser Workbench、Reference、Editor/Assembler、Debugger、FDD persistence、self-hosting、Virtual Microcomputer Lab / x86-family future pathを記録。
