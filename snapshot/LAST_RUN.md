# LAST RUN
## ONE-PAGE Z80 COMPUTER / SHINO-80

Updated: 2026-09-24T20:18:00+09:00

## Task

Implement first non-linear Z80 control flow.

## Result

PASS:

- JP nn
- JR signed displacement
- JR NZ/Z/NC/C
- DJNZ
- conditional dynamic timing
- DJNZ F preservation
- 16-bit PC wrap
- non-linear teaching-program PC sequence

## Teaching program

First visible loop:

```text
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

Later:
- JR NZ not taken
- JR Z taken
- JR unconditional taken
- JP absolute taken

Final:
- PC=001Dh
- R=13h
- T=147
- 19 instructions

## Artifact

Generated v0.0.5 artifact has:
- 5 inline scripts
- complete HTML terminator
- no external runtime dependency
- no browser prompt

Human review pending.
