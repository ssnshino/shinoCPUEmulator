# SHINO Z80 CORE v0.0.3 — PHASE 1A SPEC

Created: 2026-09-24T16:58:00+09:00
Status: CANDIDATE SPEC

## Source

```text
src/cpu/z80/
├ z80-decoder.js
└ z80-core.js
```

## Decoder

`z80-decoder.js` currently recognizes the first BASE-table subset and returns instruction descriptors.

Descriptor fields may include:

- kind
- family
- mnemonic
- register codes
- pair code
- length
- tStates

It is Z80-specific. It is not a generic multi-CPU decoder framework.

## Implemented base opcode encodings

81 LD encodings plus NOP are executable in the current subset.

Breakdown:

- LD r,r' register-only: 49
- LD r,(HL): 7
- LD (HL),r: 7
- LD r,n: 7
- LD (HL),n: 1
- LD dd,nn: 4
- BC/DE accumulator indirect load/store: 4
- absolute A/(nn) load/store: 2
- NOP: 1

Total executable base encodings in this candidate: 82.

Opcode 76h HALT is recognized but intentionally not implemented.

## Operand model

Opcode fetch:
- M1 / MREQ / RD
- increments PC
- increments R
- emits refresh observation

Immediate/data memory cycles:
- MREQ / RD or WR
- increment PC only for instruction-stream operands
- do not increment R

## Timing

Current total timing for implemented forms follows the official documented totals used by PHASE 1A.

Trace precision remains:
`M_CYCLE_ABSTRACT`

## Flags

All implemented LD forms preserve F exactly.

No flag-generation engine is introduced yet.

## One-page artifact

`deploy/one_page_shino80_v0.0.3_z80_phase1a.html`

The UI foundation is preserved.

CPU Inspector now shows the last executed mnemonic dynamically.

The default teaching program visibly changes A/B/C/HL/DE and memory.

## Next likely phase

PHASE 1B candidate:

- INC / DEC
- first flags engine
- then 8-bit ALU

Control flow may alternatively precede ALU after review.
