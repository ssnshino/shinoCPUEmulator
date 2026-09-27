# CURRENT SNAPSHOT — SHINO-80

Updated: 2026-09-27 JST

## Current completed state

- repository: `ssnshino/shinoCPUEmulator`
- reviewed branch: `main`
- current reviewed main at implementation start:
  `12350d28b1dfddb344f2a6d0224debaa7b571d04` / PR #40
- active branch: `feature/shino80-disk-autoboot-20260927`
- active Issue: #41
- open PR: #42
- PR creation head: `f12459d8828426751847050b7eda41928fcfd570`
- active implementation PLAN: `plan/head/SHINO80_DISK_AUTOBOOT_PLAN.md`
- CPU instruction-level milestone: complete
- external full-state oracle: `1,604,000 / 1,604,000 PASS`, Failure 0
- integrated machine: BIOS/MON v0.3, pageable 64 KiB RAM, DM-80, Keyboard,
  Virtual Disk A, SHINO CBIOS/WBOOT, licensed CP/M 2.2, writable starter
  filesystem
- Human mobile QA: DIR/TYPE/HELLO/S80INFO/Backspace/scroll/SAVE/copied COM/ERA
  PASS
- Human Codex in-app preview QA: POWER → RUN autoboot to CP/M PASS
- physical iPhone/Edge autoboot recheck: pending

The implementation artifact retains the filename
`deploy/one_page_shino80_v0.0.9_z80_base_complete.html` for compatibility; the
machine inside is the full integrated baseline above.

## Current implementation

The first bounded FDD/DISK usability slice now implements POWER → RUN / RESET
autoboot for a mounted valid S80B v2 A: medium.

Current design note:

- `docs/head/SHINO80_FDD_DISK_DESIGN_NOTES_v0.1.md`

Key direction:

- drive/controller and removable disk medium are separate concepts
- DRIVE A: should expose INSERT/EJECT-style media operations
- bootable media automatically boots after POWER → RUN and on RESET
- no/invalid/non-bootable media should fall back to ROM MON
- existing `MON O` manual disk boot remains
- browser persistence and image import/export belong outside the guest-machine
  hardware boundary
- future B: may separate tools/system media from user/work media
- guest title is printed by the sector-2 payload through CBIOS
- pre-page-out read/validation failures return to ROM MON
- INSERT/EJECT, persistence and import/export remain future work

## Published copy

The SHINO-80 machine, manual and notices are published as unlisted/noindex
content by `ssnshino/shinomiya-daihanten-content`.

Live publication closeout recorded during this session:

- content master:
  `69868569a15b207ea8d657c25a697f1b155b1673` / PR #12
- deploy action: `36227667207` / SUCCESS

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

- CPU semantics are not part of the FDD/DISK usability work.
- Current Virtual Disk A / CBIOS / WBOOT behavior is the regression baseline.
- `src/` is authoring source; `deploy/*.html` is generated.
- Human review controls merge and publication.
- One environment, one active writer, one purpose branch.
- Completed history must not be restored as current work.

## Next

PR #42 is open with verification complete and review follow-up applied. Human
physical-device QA and merge remain pending. Do not merge automatically. After
Human merge, promote the merge SHA to the released baseline, archive the
completed PLAN/worklog during closeout and select the next media phase.
