# deploy

Generated standalone SHINO-80 distribution artifacts. Do not hand-edit files
in this directory.

## Current artifacts

- `one_page_shino80_v0.0.9_z80_base_complete.html` — current integrated
  SHINO-80 machine
- `shino80_technical_manual_v0.1.html` — current standalone Technical Manual

The machine filename is retained for compatibility. Its contents have advanced
beyond the historical PHASE 1E milestone through all Z80 instruction families,
BIOS/MON v0.3, DM-80, pageable RAM, Virtual Disk A, CBIOS/WBOOT and writable
CP/M 2.2 starter filesystem.

## Build

```bash
npm run build
npm run build:manual
```

Authoring source lives under `src/`; tooling lives under `scripts/`. A fix made
only in generated HTML is incomplete and must not be merged.

Older one-page files are retained as milestone artifacts, not current release
candidates.
