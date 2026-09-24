# Z80 INSTRUCTION COVERAGE MATRIX v0.4

Created: 2026-09-24T20:35:00+09:00

Legend:
- ✅ executable
- ◐ recognized/reserved
- ⬜ pending

| Family | Status | Coverage |
| --- | --- | --- |
| NOP | ✅ | 00h |
| LD subset | ✅ | 81 encodings |
| INC/DEC 8-bit + (HL) | ✅ | 16 encodings |
| JP nn | ✅ | C3h |
| JR e | ✅ | 18h |
| JR NZ/Z/NC/C,e | ✅ | 20h/28h/30h/38h |
| DJNZ e | ✅ | 10h |
| CALL nn | ✅ | CDh |
| RET | ✅ | C9h |
| HALT | ◐ | 76h recognized, execution pending |
| conditional CALL/RET | ⬜ | pending |
| PUSH / POP | ⬜ | pending |
| RST | ⬜ | pending |
| General 8-bit ALU | ⬜ | pending |
| Prefix CB/ED/DD/FD | ⬜ | pending |

## Executable BASE count

- LD: 81
- INC/DEC: 16
- PHASE 1C control flow: 7
- PHASE 1D CALL/RET: 2
- NOP: 1
- **total: 107**
