# SHINO Z80 CORE PHASE 1D WORKLOG

Created: 2026-09-24T20:35:00+09:00

## Human input

PHASE 1C real-device review passed; non-linear PC/address behavior was visibly confirmed.

## Research

Checked Zilog UM0080 CALL semantics and timing.

Implemented RET as the matching stack return operation.

## Implementation

Added:
- CALL nn decoder
- RET decoder
- pushWord()
- popWord()
- STACK_WRITE bus purpose
- STACK_READ bus purpose
- stackBefore / stackAfter / returnAddress metadata
- nested CALL teaching program
- v0.0.6 banner/self-test

## Exact semantic verification

Single CALL/RET:

```text
CALL 0010h
SP F000 -> EFFE
[EFFF] = 00
[EFFE] = 03
17T

RET
SP EFFE -> F000
PC 0010 -> 0003
10T
```

Flags remained A5h.

Nested teaching sequence:

```text
F000 -> EFFE -> EFFC -> EFFE -> F000
```

Final:
- A=13h
- B=55h
- C=77h
- SP=F000h
- PC=0033h
- R=13
- T=111

Stack residue:
- EFFC=14h
- EFFD=00h
- EFFE=08h
- EFFF=00h
