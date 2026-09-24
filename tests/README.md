# tests

## CPU regression

- `z80_core_v0.0.1.test.cjs` — RESET/NOP
- `z80_phase1a_ld.test.cjs` — Decoder + LD
- `z80_phase1b_inc_dec_flags.test.cjs` — INC/DEC + Flags Engine

PHASE 1B includes boundary-value flag tests, all register forms, (HL) read-modify-write, carry preservation and timing.

## Source / deploy

- `v0.0.4_static.test.cjs`
- `v0.0.4_artifact.test.cjs`
- `browser_smoke_v0.0.4.py`

Run:

```bash
npm test
```

Optional Chromium smoke:

```bash
CHROMIUM_PATH=/usr/bin/chromium python tests/browser_smoke_v0.0.4.py
```
