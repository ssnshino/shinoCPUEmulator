# src

SHINO-80 implementation source.

## Current candidate: v0.0.2 UI FOUNDATION

```text
src/
├ cpu/
│  └ z80/
│     └ z80-core.js
├ machine/
│  └ shino80/
│     └ shino80-bus.js
├ app/
│  ├ shino80-workbench-v0.0.2.template.html
│  └ shino80-workbench-v0.0.2.js
└ ui/
   └ shino80-workbench-v0.0.2.css
```

The CPU implementation remains intentionally tiny: documented RESET subset + opcode fetch + `00h NOP` + PC/R/T-state accounting + abstract M1/refresh trace.

The v0.0.2 change is primarily the **Modern Shell / Retro Machine** adaptive workbench.

Do not add BIOS/FDD/UART/Printer behavior merely to populate UI placeholders.
