# Z80 INSTRUCTION COVERAGE MATRIX v0.3

Created: 2026-09-24T20:12:00+09:00

Legend:
- ✅ executable
- ◐ decoded / reserved but not executable
- ⬜ not yet implemented

| Family | Status | Coverage |
| --- | --- | --- |
| NOP | ✅ | 00h |
| LD subset | ✅ | 81 encodings |
| INC/DEC 8-bit + (HL) | ✅ | 16 encodings |
| JP nn | ✅ | C3h |
| JR e | ✅ | 18h |
| JR NZ/Z/NC/C,e | ✅ | 20h/28h/30h/38h |
| DJNZ e | ✅ | 10h |
| HALT | ◐ | 76h recognized, execution pending |
| JP cc | ⬜ | pending |
| CALL / RET / RST | ⬜ | pending |
| PUSH / POP | ⬜ | pending |
| General 8-bit ALU | ⬜ | pending |
| Prefix CB/ED/DD/FD | ⬜ | pending |

## Executable BASE count

- LD: 81
- INC/DEC: 16
- control flow PHASE 1C: 7
- NOP: 1
- **total: 105**
