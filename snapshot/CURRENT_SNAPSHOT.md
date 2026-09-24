# CURRENT SNAPSHOT
## ONE-PAGE Z80 COMPUTER / SHINO-80

Last updated: 2026-09-24T20:35:00+09:00

## Stacked development

- PR #6 PHASE 1A — LD / Human smartphone PASS
- PR #7 PHASE 1B — INC/DEC + Flags
- PR #8 PHASE 1C — Control Flow / Human smartphone PASS
- PHASE 1D stacked on PHASE 1C

## Active candidate

- Branch: `feature/z80-phase1d-call-ret-stack-20260924`
- Candidate: **SHINO Z80 CORE v0.0.6 — PHASE 1D**
- Scope: CALL / RET + stack
- Artifact: `deploy/one_page_shino80_v0.0.6_z80_phase1d.html`
- Human real-device review: PENDING

## Executable BASE count

**107**

## New visible behavior

Nested subroutines:

```text
PC 0005 -> 0010 -> 0011 -> 0020 -> 0021 -> 0014 -> 0015 -> 0008
SP F000 -> EFFE -> EFFC -> EFFE -> F000
```

Stack bytes remain observable in RAM after return.

## Video status

No video device or BIOS exists yet.

Writes to future text VRAM are currently ordinary memory writes and produce no display output.
