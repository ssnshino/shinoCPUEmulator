# src/cpu/z80

Current candidate: **PHASE 1E — BASE COMPLETE**

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

PHASE 1F adds CB execution.

Do not create a generic multi-CPU abstraction while finishing Z80.
