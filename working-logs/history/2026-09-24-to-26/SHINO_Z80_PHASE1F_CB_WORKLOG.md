# PHASE 1F CB worklog

2026-09-26 JST. Human chose CPU completion before MON expansion.
Branch feature/shino80-z80-cb-20260926 on eea8dfc / PR #21. Single writer.
Historical phase1f remote branch inspected: only efcdd08 BASE checkpoint,
no CB implementation to recover. No merges performed.

Plan/spec: SHINO_Z80_PHASE1F_CB_PLAN.md / SHINO_Z80_PHASE1F_CB_SPEC.md.
Added CB decoder, rotate/shift and BIT helpers, CB execution with two M1/R
increments and one instruction/EI-delay retirement. BASE behavior preserved.
UI capability text now explicitly distinguishes completed CB from remaining
ED/DD/FD/indexed CB; displays both opcode bytes. BIOS/Bus/CG-ROM unchanged.

## Verification

- Independent unit formulas across 256 encodings × 256 inputs × 2 carries:
  131,072 PASS. Timing, bus ordering, write/no-write, R wrap, PC wrap and ROM
  protection included. RES/SET full flag preservation checked.
- External pinned SingleStepTests revision ebe1875d48f374bcfd4b505d8eb8ee751568b5f7:
  CB 256 files / 256,000 cases PASS; BASE 252 files / 252,000 cases PASS.
  Failure 0. D7 documented-state comparison policy, not full-silicon accuracy.
  Unique baseline coverage in this candidate: 508,000 cases. Repeated runner
  executions (including initial CB pass) do not add unique coverage.
- Per-opcode counts and fixture/source hashes saved in
  code/head/SHINO_Z80_PHASE1F_CB_ORACLE_QA.json and
  code/head/SHINO_Z80_PHASE1F_BASE_RECHECK_QA.json.
- All package stages ran via bundled Node: BASE phases, CB, machine/BIOS/MON,
  scheduler, ring, syntax/build/artifact PASS. npm unavailable in shell.
- Browser plugin not available; Node Playwright + installed Chrome fallback.
  /tmp/shino80-cb-browser.cjs: standalone file boot/self-test, PC and compact
  widths 1440x1000 / 390x844. Injected CB 00 at RAM 2000h, B=80h; user STEP
  produced B=01h, C=1, PC=2002h, R=2 and 8 T-states. Visible register update,
  capability text and full instruction bytes confirmed. Console/page errors
  zero; no horizontal overflow; screenshots inspected.
- Screenshot /tmp/shino80-cb-1440.png and /tmp/shino80-cb-390.png.
- Final full package-stage rerun, source/artifact checks, syntax, build
  reproducibility and diff check PASS. Oracle report source hashes match.
  HTML handoff: SHINO80_CB_QA_20260926.html.
  SHA-256: 9bf0fd52fbcfdb3c01b45cf4c77905e5f65eb35d2db600e62f9c66fad945077b.

## Resume

PHASE 1F functional/documented-state scope closed as candidate; Human review
and predecessor integration pending. Next implementation is PHASE 1G ED with
its own plan and oracle coverage. Do not resume MON expansion yet. Remaining
DD/FD/indexed CB, interrupts, WZ/X/Y and pin precision remain explicitly open.
This commit is one logical rollback unit. Never hand-edit generated HTML.

## Update History

- 2026-09-26 — CB implementation, exhaustive units and external validation.
