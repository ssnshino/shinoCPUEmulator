# src

SHINO-80 implementation source.

## Current candidate

SHINO Z80 CORE v0.0.1 — FIRST HEARTBEAT

```text
src/
├ cpu/
│  └ z80/
│     └ z80-core.js
├ machine/
│  └ shino80/
│     └ shino80-bus.js
├ app/
│  ├ shino-z80-core-v0.0.1.js
│  └ shino-z80-core-v0.0.1.template.html
└ ui/
   └ shino-z80-panel.css
```

Current implementation boundary is intentionally tiny: RESET subset + opcode fetch + `00h NOP` + PC/R/T-state accounting + abstract M1/refresh trace.

PHASE 0 is still active. Do not expand this into a generic multi-CPU framework or jump to BIOS/devices without PLAN/research/test coverage.
