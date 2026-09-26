# SHINO Z80 CORE PHASE 1C WORKLOG

Created: 2026-09-24T20:12:00+09:00

## Research

Verified from Zilog UM0080:

- JR signed relative semantics
- JR cc taken/not-taken timing
- DJNZ B decrement and conditional branch
- DJNZ flags unaffected
- JP nn absolute jump

## Architecture change

Earlier phases assumed one fixed T-state total per decoder descriptor.

PHASE 1C introduces actual execution timing because conditional branches differ according to branch outcome.

Branch execution now records:

- taken/not taken
- target
- fall-through
- condition
- actual T-states

## Exact semantic checks

PASS:

```text
JP 1234h        -> PC=1234h / 10T
JR +5           -> PC=0007h / 12T
JR -2 @0100h    -> PC=0100h / 12T
JR NZ taken     -> 12T
JR NZ not       -> 7T
DJNZ taken      -> 13T
DJNZ not        -> 8T
```

DJNZ operand read is observed at T+5 in the current abstract trace.

## Teaching-program PC sequence

```text
0002 0004 0005 0004 0005 0004 0005 0004 0005 0007
0009 000A 000C 0010 0012 0016 0018 001C 001D
```

Final state:

```text
A=82h
B=00h
C=00h
D=22h
E=44h
F=50h
PC=001Dh
R=13h
T=147
instructions=19
```

## Artifact integrity

Generated exact artifact:
- 5 inline scripts
- HTML terminator present
- no external runtime dependencies
- no prompt()
- CONTROL FLOW banner present
