# src/cpu/z80

Z80 CPU implementation.

## Current: PHASE 1A

```text
z80/
├ z80-decoder.js
└ z80-core.js
```

### z80-decoder.js

Z80-specific BASE opcode recognition and descriptor generation.

Current executable subset:
- NOP
- core LD families described in the PHASE 1A spec

### z80-core.js

Owns:
- architectural state
- opcode/operand fetch
- register/pair helpers
- execution of current descriptors
- timing totals
- bus access

CPU code remains independent from DOM/UI.

## Natural next split

When real implementation pressure appears:

```text
z80/
├ z80-core.js
├ z80-decoder.js
├ z80-flags.js
├ z80-alu.js
├ z80-timing.js
├ z80-interrupt.js
└ opcode/
   ├ cb.js
   ├ ed.js
   ├ dd.js
   └ fd.js
```

Do not create these merely to fill the tree. The first real split was Decoder because PHASE 1A made it necessary.
