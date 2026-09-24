# Z80 PHASE 1E — SingleStepTests Oracle Checkpoint 02

Updated: 2026-09-25T09:10:00+09:00

External oracle: SingleStepTests/z80 v1

## Current total

- opcode files checked: **50**
- cases per opcode: **1000**
- total cases: **50,000**
- failures: **0**

## Comparison scope

Compared:
- A/B/C/D/E/H/L
- IX/IY
- SP/PC
- I/R
- IFF1/IFF2
- IM
- alternate AF/BC/DE/HL
- documented F bits S/Z/H/PV/N/C
- final RAM bytes
- I/O writes where applicable
- total T-state count
- EI internal delay state for FB

Excluded for later precision work:
- undocumented Y/X
- WZ
- oracle P/Q internals
- pin-perfect waveform

## Opcode files checked

01 03 04 05 07 08 09 0B 0F 10
17 18 20 22 27 28 2A 2F 30 34
35 37 38 3F 76
C0 C3 C4 C6 C7 C9 CD CE
D3 D6 D9 DB DE
E3 E6 E9 EB EE
F1 F3 F5 F6 F9 FB FE

## Coverage represented

- 8/16-bit loads
- memory word load/store
- INC/DEC register and (HL)
- 16-bit INC/DEC
- 16-bit ADD HL
- DAA/CPL/SCF/CCF
- accumulator rotates
- JR/DJNZ
- JP/CALL/RET
- conditional CALL/RET
- RST
- exchange family
- PUSH/POP AF
- immediate ALU family
- IN/OUT immediate ports
- HALT
- DI/EI including EI delay
- JP (HL)
- LD SP,HL

## Interpretation

PHASE 1E BASE remains a functional candidate, not a cycle-perfect Z80 claim.
The current result is strong evidence that the shared execution helpers are aligned with an independent oracle for documented architectural behavior.
