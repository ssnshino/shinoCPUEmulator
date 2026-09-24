# src/cpu/z80

Z80 CPU implementation.

## Current stacked candidate: PHASE 1B

```text
z80/
├ z80-core.js
├ z80-decoder.js
└ z80-flags.js
```

### z80-decoder.js

Recognizes current BASE opcode subset:
- NOP
- PHASE 1A LD
- PHASE 1B INC/DEC

### z80-flags.js

First real flags subsystem.

Current responsibility:
- documented INC/DEC flags
- carry preservation
- temporary PHASE 1B policy to preserve undocumented Y/X

### z80-core.js

Owns:
- architectural state
- fetch / operand access
- execution
- timing totals
- bus access

CPU code remains independent from DOM/UI.

## Next natural pressure

Likely next files/areas:

- ALU helpers when ADD/SUB/etc arrive
- control-flow helpers when JP/JR/CALL/RET arrive
- prefix modules when CB/ED/DD/FD arrive

Do not split further until implementation pressure justifies it.
