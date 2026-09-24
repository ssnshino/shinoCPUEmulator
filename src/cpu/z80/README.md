# src/cpu/z80

Current stacked candidate: PHASE 1D

```text
z80/
├ z80-core.js
├ z80-decoder.js
└ z80-flags.js
```

Current responsibilities:

- decoder: BASE instruction recognition
- flags: current documented INC/DEC flags
- core: CPU state, memory/bus access, control flow and stack semantics

PHASE 1D adds internal `pushWord()` / `popWord()` because CALL/RET now require a real stack.

These helpers use normal bus memory traffic and are intended to support later PUSH/POP, RST and interrupt work.

Do not split into a separate stack module unless future implementation pressure justifies it.
