# src/cpu/z80

Current candidate: **PHASE 1G — BASE + CB + ED (documented-state policy)**

```text
z80/
├ z80-core.js
├ z80-decoder.js
└ z80-flags.js
```

## Current coverage

- BASE first-byte decode: 256 / 256
- executable non-prefix BASE opcodes: 252 / 252
- prefix entry points recognized: CB / DD / ED / FD
- executable CB second-byte encodings: 256 / 256 (includes SLL)
- ED: 78 active encodings and 178 classified unused NOPs
- external oracle: BASE 252,000 + CB 256,000 + ED 80,000 PASS at this candidate
- ED external inventory includes 2 unused NOPs; other unused slots have units only

## Responsibilities

### z80-decoder.js
- complete BASE opcode recognition
- instruction descriptors
- prefix-family entry recognition

### z80-flags.js
- documented BASE arithmetic/logic flags
- INC/DEC
- general ALU
- 16-bit ADD HL flags
- accumulator rotates
- DAA

Undocumented X/Y remains a later accuracy target.

### z80-core.js
- architectural state
- execution
- memory / I/O bus transactions
- stack
- control flow
- HALT functional cycling
- DI/EI functional state

## Next

Next PHASE 1H adds DD/FD execution. Indexed CB remains unimplemented.
Interrupt dispatch, undocumented X/Y and pin-level precision remain later work.

Do not create a generic multi-CPU abstraction while finishing Z80.
