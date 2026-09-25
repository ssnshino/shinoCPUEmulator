# tests

## CPU regression

- z80_core_v0.0.1.test.cjs
- z80_phase1a_ld.test.cjs
- z80_phase1b_inc_dec_flags.test.cjs
- z80_phase1c_control_flow.test.cjs
- z80_phase1d_call_ret_stack.test.cjs
- z80_phase1e_base_complete.test.cjs

PHASE 1E exhaustively checks:
- 256/256 BASE decode slots
- 252/252 non-prefix one-step execution
- ALU / DAA / 16-bit arithmetic
- exchange / stack / conditional flow
- RST / I/O / HALT / DI/EI

## Machine regression

- shino80_phase2a_video_ipl.test.cjs
- shino80_phase2a1_power_reset.test.cjs

## Current artifact QA

- v0.0.9_static.test.cjs
- v0.0.9_artifact.test.cjs
- browser_smoke_v0.0.9.py

Run:
```bash
npm test
```
