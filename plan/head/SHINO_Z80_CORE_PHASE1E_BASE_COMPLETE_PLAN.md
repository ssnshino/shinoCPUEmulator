# SHINO Z80 CORE PHASE 1E — COMPLETE BASE OPCODES PLAN

Created: 2026-09-24T23:55:00+09:00
Status: IMPLEMENTED CANDIDATE
Version: v0.0.9

## Objective

Finish every non-prefix opcode in the Z80 BASE 00h-FFh table.

## Coverage target

- BASE decode slots: 256 / 256
- executable non-prefix BASE opcodes: 252 / 252
- recognized prefix introducers: CB / DD / ED / FD

## Added families

- 16-bit INC / DEC
- ADD HL,ss
- RLCA / RRCA / RLA / RRA
- DAA / CPL / SCF / CCF
- LD (nn),HL / LD HL,(nn) / LD SP,HL
- full 8-bit ALU register/(HL)/immediate forms
- EX AF,AF' / EXX / EX DE,HL / EX (SP),HL
- all 8 JP cc
- all 8 CALL cc
- all 8 RET cc
- PUSH / POP
- all 8 RST vectors
- IN A,(n) / OUT (n),A
- HALT functional state
- DI / EI functional IFF state

## Bus extension

Add a distinct 16-bit I/O port space to SHINO-80 bus:

- cpuIoRead()
- cpuIoWrite()
- debugIoPeek()
- debugIoPoke()

Immediate IN/OUT use A as high port-address byte and immediate n as low byte.

## QA gates

1. every BASE slot decodes
2. every non-prefix opcode executes once without exception
3. family-specific semantic tests
4. documented flag boundary tests
5. conditional timing tests
6. stack and I/O tests
7. HALT repeated-cycle test
8. independent SingleStepTests representative oracle
9. existing SHINO-80 IPL/video browser regression
