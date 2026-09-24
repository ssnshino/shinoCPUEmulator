# tests

CPU regression chain:

- z80_core_v0.0.1.test.cjs — RESET/NOP
- z80_phase1a_ld.test.cjs — LD
- z80_phase1b_inc_dec_flags.test.cjs — INC/DEC + flags
- z80_phase1c_control_flow.test.cjs — JP/JR/DJNZ

PHASE 1C verifies signed relative addressing, conditional taken/not-taken timing, DJNZ flags preservation and non-linear teaching-program PC sequence.

Current artifact tests:
- v0.0.5_static.test.cjs
- v0.0.5_artifact.test.cjs
- browser_smoke_v0.0.5.py

Run:

```bash
npm test
```
