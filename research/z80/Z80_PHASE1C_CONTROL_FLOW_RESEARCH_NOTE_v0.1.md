# Z80 PHASE 1C — CONTROL FLOW Research Note v0.1

Created: 2026-09-24T20:12:00+09:00
Status: IMPLEMENTATION BASIS

## Primary source

Zilog Z80 CPU User Manual, UM0080:
https://www.zilog.com/docs/z80/UM0080.pdf

## Implemented instructions

- JP nn
- JR e
- JR NZ,e
- JR Z,e
- JR NC,e
- JR C,e
- DJNZ e

## Relative displacement

JR/DJNZ use an 8-bit signed two's-complement displacement.

The displacement is applied to the PC after the two-byte instruction has been fetched.

Examples:

```text
JR +5 from 0000h -> 0007h
JR -2 from 0100h -> 0100h
```

16-bit wrap-around is preserved.

## Timing

```text
JP nn          10T
JR e           12T
JR cc,e taken  12T
JR cc,e not     7T
DJNZ taken     13T
DJNZ not        8T
```

The official manual documents conditional relative jumps as 12T when taken and 7T when not taken.

DJNZ decrements B and branches when B remains nonzero. It does not alter flags.

## Conditions

```text
NZ -> Z flag = 0
Z  -> Z flag = 1
NC -> C flag = 0
C  -> C flag = 1
```

This phase makes the high-level idea of boolean control flow visible as real flag-bit tests.

## Teaching program

The v0.0.5 artifact intentionally creates a visible loop and both branch outcomes:

```asm
LD B,04h
LD A,7Eh

LOOP:
INC A
DJNZ LOOP

LD C,FFh
INC C          ; Z = 1
JR NZ,SKIP1    ; not taken
JR Z,PATH_Z    ; taken

SKIP1:
LD D,11h       ; skipped

PATH_Z:
LD D,22h
JR NEXT
LD E,33h       ; skipped

NEXT:
LD E,44h
JP DONE
NOP            ; skipped

DONE:
NOP
```

## Observation value

Expected PC sequence begins:

```text
0002
0004
0005
0004
0005
0004
0005
0004
0005
0007
```

This is the first SHINO-80 phase where ADDRESS observation becomes visibly non-linear.

## Accuracy boundary

Current bus trace remains M_CYCLE_ABSTRACT.

This phase implements instruction semantics and documented total timing, not pin-perfect internal cycles.
