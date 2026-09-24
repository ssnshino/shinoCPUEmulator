# tests

CPU Core / Machine / Device tests.

## Current

- `z80_core_v0.0.1.test.cjs` — RESET/NOP/PC/R/T-state/trace/unimplemented-opcode regression
- `one_page_v0.0.1_static.test.cjs` — generated one-page build markers, required DOM IDs, external runtime dependency check

Run:

```bash
npm test
```

CPU implementation uses unit tests before UI claims.

Future coverage candidates:

- broader instruction execution
- flags
- PC/SP
- prefix decode
- interrupt
- HALT/EI edge cases
- R/refresh
- T-state accounting
- bus trace
- memory/I/O boundary
- ROM/RAM protection
- device register behavior

External test vectors must record license/provenance.
