# CURRENT SNAPSHOT — SHINO-80

Updated: 2026-09-26 JST

## Current completed state

- repository: `ssnshino/shinoCPUEmulator`
- reviewed branch: `main`
- current reviewed main at design-handoff start:
  `22a197e301fe57fa0947a19e3e061fdc7004231d` / PR #39
- last implementation-bearing main:
  `e75d8c0506a7b1bb711b54c352c8b04580cdddaf` / PR #38
- open implementation work: none at snapshot time
- active implementation PLAN: none
- CPU instruction-level milestone: complete
- external full-state oracle: `1,604,000 / 1,604,000 PASS`, Failure 0
- integrated machine: BIOS/MON v0.3, pageable 64 KiB RAM, DM-80, Keyboard,
  Virtual Disk A, SHINO CBIOS/WBOOT, licensed CP/M 2.2, writable starter
  filesystem
- Human mobile QA: DIR/TYPE/HELLO/S80INFO/Backspace/scroll/SAVE/copied COM/ERA
  PASS

The implementation artifact retains the filename
`deploy/one_page_shino80_v0.0.9_z80_base_complete.html` for compatibility; the
machine inside is the full integrated baseline above.

## Current design handoff

Human selected FDD/DISK usability as the next design focus because SHINO-80
needs practical removable software media before larger development tools such
as a text editor, assembler and compiler become useful.

Current design note:

- `docs/head/SHINO80_FDD_DISK_DESIGN_NOTES_v0.1.md`

Key direction:

- drive/controller and removable disk medium are separate concepts
- DRIVE A: should expose INSERT/EJECT-style media operations
- bootable media should automatically boot on POWER ON
- no/invalid/non-bootable media should fall back to ROM MON
- existing `MON O` manual disk boot remains
- browser persistence and image import/export belong outside the guest-machine
  hardware boundary
- future B: may separate tools/system media from user/work media
- next implementation must start with a fresh PLAN; no implementation has been
  authorized by this documentation handoff

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

Read `docs/head/SHINO80_FDD_DISK_DESIGN_NOTES_v0.1.md`, inspect the live
Virtual Disk A / CBIOS / WBOOT / system-disk / one-page boundaries, then create
one fresh PLAN in `plan/head/` before implementation.

The first PLAN should explicitly decide the bounded scope for removable media,
POWER ON autoboot, persistence and disk-image import/export. B: drive,
assembler/compiler/editor selection and individual host-file transfer remain
later work unless Human explicitly expands the phase.
