# Z80 PHASE 1E — SingleStepTests Oracle Checkpoint 01

Updated: 2026-09-25T08:40:00+09:00

External oracle:
- repository: SingleStepTests/z80
- dataset: v1
- each selected opcode file contains 1000 generated single-step cases

## Comparison scope

Compared:
- A/B/C/D/E/H/L
- IX/IY
- SP/PC
- I/R
- IFF1/IFF2
- IM
- alternate AF/BC/DE/HL
- documented F bits: S/Z/H/PV/N/C
- final RAM bytes
- I/O write ports where applicable
- total T-state count from oracle cycle count

Deliberately not compared yet:
- undocumented F bits Y/X
- WZ internal register
- P/Q internal oracle state
- pin-by-pin cycle waveform

## Checkpoint result

| Opcode | Instruction | Cases | Result |
| --- | --- | ---: | --- |
| 07 | RLCA | 1000 | PASS |
| 09 | ADD HL,BC | 1000 | PASS |
| 22 | LD (nn),HL | 1000 | PASS |
| 27 | DAA | 1000 | PASS |
| 2A | LD HL,(nn) | 1000 | PASS |
| 2F | CPL | 1000 | PASS |
| 3F | CCF | 1000 | PASS |
| C0 | RET NZ | 1000 | PASS |
| C4 | CALL NZ,nn | 1000 | PASS |
| C6 | ADD A,n | 1000 | PASS |
| C7 | RST 00h | 1000 | PASS |
| CE | ADC A,n | 1000 | PASS |
| D3 | OUT (n),A | 1000 | PASS |
| D6 | SUB n | 1000 | PASS |
| DB | IN A,(n) | 1000 | PASS |
| DE | SBC A,n | 1000 | PASS |
| E3 | EX (SP),HL | 1000 | PASS |
| E6 | AND n | 1000 | PASS |
| EE | XOR n | 1000 | PASS |
| F1 | POP AF | 1000 | PASS |
| F5 | PUSH AF | 1000 | PASS |
| F6 | OR n | 1000 | PASS |
| FE | CP n | 1000 | PASS |

**Total: 23,000 / 23,000 PASS**

## Interpretation

This is a strong functional checkpoint for the current BASE implementation, but it is not yet a claim of full Z80 cycle-perfect accuracy.

Next oracle batches should target:
- exchange/control instructions
- JR/DJNZ conditions
- all register/memory ALU forms
- remaining stack/control forms
- HALT and interrupt-control edge semantics
