# SHINO Z80 CORE PHASE 1B — INC / DEC + FLAGS ENGINE PLAN

Created: 2026-09-24T18:18:00+09:00
Status: IMPLEMENTED CANDIDATE
Candidate version: v0.0.4

## Purpose

Introduce the first real flag-generation subsystem and make the CPU Debug Lab's FLAGS lamps reflect instruction semantics.

## New source boundary

```text
src/cpu/z80/
├ z80-core.js
├ z80-decoder.js
└ z80-flags.js
```

`z80-flags.js` exists because a real implementation need has appeared; it is not speculative abstraction.

## Implement

### Decoder

- INC r
- INC (HL)
- DEC r
- DEC (HL)

### Flags Engine

Documented:
- S
- Z
- H
- P/V
- N
- C unaffected

Policy:
- Y/X preserved until separately researched

### Timing

- INC r / DEC r: 4T
- INC (HL) / DEC (HL): 11T
- memory forms trace read at +4 and write at +8

## Teaching program

```asm
LD A,7Fh
INC A
LD B,FFh
INC B
LD C,80h
DEC C
LD D,00h
DEC D
LD HL,0080h
LD (HL),7Fh
INC (HL)
DEC (HL)
NOP
```

Expected visible lessons:

- 7F -> 80 lights S/H/PV
- FF -> 00 lights Z/H
- 80 -> 7F lights H/PV/N
- 00 -> FF lights S/H/N
- memory location 0080h participates in read-modify-write

## QA

- direct flags helper boundary tests
- all seven register INC forms
- all seven register DEC forms
- INC/DEC (HL)
- Carry preserved
- Y/X preserved by current policy
- total T-state checks
- memory bus event offsets
- PHASE 1A regression
- one-page inline syntax
- More sheet regression
- Chromium flags-lamp smoke

## Non-goals

- no general ALU yet
- no 16-bit INC/DEC yet
- no control flow
- no prefixes
- no interrupts
