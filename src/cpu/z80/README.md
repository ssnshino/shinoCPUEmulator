# src/cpu/z80

Current stacked candidate: **PHASE 1C CONTROL FLOW**

```text
z80/
├ z80-core.js
├ z80-decoder.js
└ z80-flags.js
```

Current responsibilities:

- decoder: BASE opcode recognition
- flags: documented INC/DEC flag behavior
- core: state, fetch, execution, dynamic branch timing, bus access

PHASE 1C adds:
- JP nn
- JR e
- JR NZ/Z/NC/C,e
- DJNZ e
- branch outcome metadata

CPU code remains independent from DOM/UI.

Next natural implementation pressure is likely:
- CALL/RET + stack
- or general ALU

Do not split a new module until one of those scopes creates a real boundary.
