# src

**Development source of truth for SHINO-80.**

The standalone one-page HTML is now a build artifact under `deploy/`; it is not the primary editing surface.

## Current source

```text
src/
├ app/
│  ├ shino80-workbench-v0.0.2.template.html
│  └ shino80-workbench-v0.0.2.js
├ cpu/
│  └ z80/
│     └ z80-core.js
├ machine/
│  └ shino80/
│     └ shino80-bus.js
└ ui/
   └ shino80-workbench-v0.0.2.css
```

Future implementation domains are documented in:

`docs/head/SHINO_80_SOURCE_DEPLOY_LAYOUT_STANDARD_v0.1.md`

Do not create speculative abstractions merely to populate planned folders.

As CPU code grows, split by responsibility when a boundary becomes real: decoder, ALU/flags, prefix handling, timing, interrupts, etc.
