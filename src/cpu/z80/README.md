# src/cpu/z80

Z80 CPU implementation.

Current implementation remains intentionally small.

## Current

- `z80-core.js` — first-heartbeat core

## Expected natural split as the core grows

```text
z80/
├ z80-core.js
├ decoder.js
├ flags.js
├ alu.js
├ timing.js
├ interrupt.js
└ opcode/
   ├ base.js
   ├ cb.js
   ├ ed.js
   ├ dd.js
   └ fd.js
```

This is a direction, not a mandate to create empty abstractions.

Split only when implementation pressure makes the boundary useful.

The CPU domain must stay independent from DOM/UI code.
