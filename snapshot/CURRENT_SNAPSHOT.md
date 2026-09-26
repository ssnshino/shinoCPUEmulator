# CURRENT SNAPSHOT — SHINO-80

Updated: 2026-09-26 JST

## Current completed state

- repository: `ssnshino/shinoCPUEmulator`
- reviewed branch: `main`
- last implementation-bearing main: `e75d8c0506a7b1bb711b54c352c8b04580cdddaf` / PR #38
- open implementation work: none at snapshot time
- CPU instruction-level milestone: complete
- external full-state oracle: `1,604,000 / 1,604,000 PASS`, Failure 0
- integrated machine: BIOS/MON v0.3, pageable 64 KiB RAM, DM-80, Keyboard, Virtual Disk A, SHINO CBIOS/WBOOT, licensed CP/M 2.2, writable starter filesystem
- Human mobile QA: DIR/TYPE/HELLO/S80INFO/Backspace/scroll/SAVE/copied COM/ERA PASS

The implementation artifact retains the filename
`deploy/one_page_shino80_v0.0.9_z80_base_complete.html` for compatibility; the
machine inside is the full integrated baseline above.

## Published copy

The reviewed machine, manual and notices are published as unlisted/noindex
content by `ssnshino/shinomiya-daihanten-content`.

- content master: `743b6038b4a40b8db32463e22ba864855776e152` / PR #11
- deploy action: `36224728565` / SUCCESS
- exact deployed SHA: `743b6038b4a40b8db32463e22ba864855776e152`
- local and public machine/manual/notices smoke: PASS

## Resume contract

Read in this order:

1. `README.md`
2. `AGENTS.md`
3. this file
4. `snapshot/LAST_RUN.md`
5. `snapshot/NEXT_CHAT_PROMPT.txt`
6. `snapshot/SNAPSHOT_MANIFEST.md`

Then fetch GitHub and compare branch, HEAD, dirty state and open PRs. Git live
state wins when it is newer than this record.

## Current boundaries

- CPU, firmware and public artifacts are stable; do not change them as part of
  unrelated documentation or UI work.
- `src/` is authoring source; `deploy/*.html` is generated.
- Human review controls merge and publication.
- One environment, one active writer, one purpose branch.

## Next

No implementation target is preselected. Choose one bounded next milestone
from `README.md`, create a fresh `plan/head/` PLAN, and preserve the current
baseline with matching tests before implementation.
