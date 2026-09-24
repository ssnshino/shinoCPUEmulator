# tests

CPU regression chain:

- z80_core_v0.0.1.test.cjs — RESET/NOP
- z80_phase1a_ld.test.cjs — LD
- z80_phase1b_inc_dec_flags.test.cjs — INC/DEC + flags
- z80_phase1c_control_flow.test.cjs — JP/JR/DJNZ
- z80_phase1d_call_ret_stack.test.cjs — CALL/RET + nested stack

Current source/artifact QA:
- v0.0.6_static.test.cjs
- v0.0.6_artifact.test.cjs
- browser_smoke_v0.0.6.py

Run:
```bash
npm test
```

Optional Chromium smoke:
```bash
CHROMIUM_PATH=/usr/bin/chromium python tests/browser_smoke_v0.0.6.py
```
