# tests

Current automated coverage:

## CPU

- `z80_core_v0.0.1.test.cjs` — RESET / NOP regression
- `z80_phase1a_ld.test.cjs` — PHASE 1A decoder + LD instruction family

PHASE 1A currently verifies:

- all 7 `LD r,n` register forms
- 49 register-only `LD r,r'` combinations
- all 4 `LD dd,nn` register pairs
- `(HL)` read/write/immediate forms
- BC/DE indirect accumulator forms
- absolute `(nn)` accumulator forms
- flags preserved
- R increments on opcode fetch only
- PC / total T-state accounting
- intentional HALT-not-implemented fault

## Source / deploy

- `v0.0.3_static.test.cjs` — source JavaScript syntax
- `v0.0.3_artifact.test.cjs` — generated one-page build markers / inline JS / no external runtime dependency
- `browser_smoke_v0.0.3.py` — Chromium teaching-program smoke

Run dependency-free suite:

```bash
npm test
```

Optional browser smoke:

```bash
CHROMIUM_PATH=/usr/bin/chromium python tests/browser_smoke_v0.0.3.py
```

Human real-device review remains the final deploy-artifact gate.
