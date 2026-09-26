# SHINO Z80 CORE PHASE 1D — CALL / RET + STACK PLAN

Created: 2026-09-24T20:35:00+09:00
Candidate version: v0.0.6

## Goal

Add subroutine control flow and make the downward-growing Z80 stack visible.

## Instructions

- CALL nn
- RET

## CPU helpers

- pushWord()
- popWord()

These use the ordinary SHINO-80 memory bus. There is no special invisible stack store.

## Execution metadata

CALL/RET extend instruction metadata with:

- stackBefore
- stackAfter
- returnAddress

Existing branch metadata remains.

## Teaching program

```asm
0000  LD SP,F000h
0003  LD A,10h
0005  CALL 0010h
0008  LD B,55h
000A  JP 0030h

0010  INC A
0011  CALL 0020h
0014  INC A
0015  RET

0020  INC A
0021  RET

0030  LD C,77h
0032  NOP
```

Expected SP path:

`F000 -> EFFE -> EFFC -> EFFE -> F000`

Expected final state:

- A=13h
- B=55h
- C=77h
- SP=F000h
- PC=0033h
- 13 instructions
- 111 T-states

## QA

- CALL byte order
- stack write order
- RET pop order
- flags unchanged
- CALL 17T
- RET 10T
- stack wrap at 0000h
- nested calls
- source/artifact syntax
- Chromium mobile smoke
