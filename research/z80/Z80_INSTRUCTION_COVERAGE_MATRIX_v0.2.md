# Z80 INSTRUCTION COVERAGE MATRIX v0.2

Created: 2026-09-24T18:18:00+09:00

Legend:
- ✅ executable
- ◐ decoded / reserved but not executable
- ⬜ not yet implemented

## Base table

| Family | Status | Current coverage |
| --- | --- | --- |
| NOP | ✅ | 00h |
| LD r,r' | ✅ | 49 register-only encodings |
| LD r,(HL) | ✅ | 7 encodings |
| LD (HL),r | ✅ | 7 encodings |
| LD r,n | ✅ | 7 encodings |
| LD (HL),n | ✅ | 36h |
| LD dd,nn | ✅ | BC / DE / HL / SP |
| LD A,(BC)/(DE) | ✅ | 0Ah / 1Ah |
| LD (BC)/(DE),A | ✅ | 02h / 12h |
| LD A,(nn) | ✅ | 3Ah |
| LD (nn),A | ✅ | 32h |
| INC r | ✅ | B/C/D/E/H/L/A |
| INC (HL) | ✅ | 34h |
| DEC r | ✅ | B/C/D/E/H/L/A |
| DEC (HL) | ✅ | 35h |
| HALT | ◐ | 76h recognized; execution intentionally pending |
| 16-bit INC / DEC | ⬜ | pending |
| ALU | ⬜ | pending |
| JP / JR / DJNZ | ⬜ | pending |
| CALL / RET / RST | ⬜ | pending |
| PUSH / POP / EX | ⬜ | pending |

## Prefix families

| Prefix | Status |
| --- | --- |
| CB | ⬜ |
| ED | ⬜ |
| DD | ⬜ |
| FD | ⬜ |
| DDCB | ⬜ |
| FDCB | ⬜ |

## Current executable count

- LD: **81**
- INC/DEC 8-bit + (HL): **16**
- NOP: **1**
- total executable BASE encodings: **98**

This count is opcode encodings, not unique mnemonic names.
