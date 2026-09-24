# tests

Current automated coverage:

- `z80_core_v0.0.1.test.cjs` — RESET/NOP/PC/R/T-state/bus-trace regression
- `v0.0.2_static.test.cjs` — source JavaScript syntax
- `v0.0.2_artifact.test.cjs` — generated one-page markers, inline JS syntax, safe-area, reduced-motion, external dependency checks
- `browser_smoke_v0.0.2.py` — optional Chromium/Playwright adaptive runtime smoke

Run dependency-free core/static suite:

```bash
npm test
```

Optional adaptive browser smoke requires Python Playwright and a Chromium executable:

```bash
CHROMIUM_PATH=/usr/bin/chromium python tests/browser_smoke_v0.0.2.py
```

Human real-device review remains the final UI gate.
