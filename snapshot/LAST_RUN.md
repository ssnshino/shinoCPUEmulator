# LAST RUN — 2026-09-26 FDD / DISK design handoff

## Goal

Close the day with a repository-backed design note and restart snapshot for the
next SHINO-80 disk-media phase, without starting implementation.

## Live baseline checked

- source repository: `ssnshino/shinoCPUEmulator`
- reviewed main:
  `22a197e301fe57fa0947a19e3e061fdc7004231d`
- PR #39: merged
- open PRs before this handoff branch: none
- last implementation-bearing main:
  `e75d8c0506a7b1bb711b54c352c8b04580cdddaf`
- content repository master:
  `69868569a15b207ea8d657c25a697f1b155b1673`
- content PR #12: merged
- publication Action `36227667207`: SUCCESS

The local Mac working tree is outside this connector environment; its clean
state was supplied by the Human/previous handoff and was not independently
re-read from the local filesystem here.

## Design discussion recorded

Added:

- `docs/head/SHINO80_FDD_DISK_DESIGN_NOTES_v0.1.md`

The note records:

- FDD/drive versus removable DISK/media separation
- the real motivation: loading/swapping larger tools such as editor, assembler
  and compiler
- desired POWER ON autoboot when a bootable A: medium is inserted
- MON fallback when media is missing or non-bootable
- retention of manual `MON O`
- Device Inspector INSERT/EJECT direction
- host-side persistence/image import/export boundary
- future A: tools / B: work-disk model
- later individual CP/M file exchange as host tooling
- PLAN FIRST before any implementation

## Runtime scope

No CPU, decoder, Bus, memory, firmware, CBIOS, disk-device implementation,
CG-ROM, display, app runtime or generated standalone artifact is intentionally
changed by this handoff.

No implementation PLAN is activated by these notes.

## Delivery

Purpose branch:

`docs/shino80-fdd-disk-notes-20260926`

The documentation/snapshot change is intended as one logical commit and one PR
to `main`.

Human merge authority remains in force. Do not merge automatically.

## Next session

Start from the root README and live Git state. Read the FDD/DISK design note,
then create a fresh PLAN for a bounded first media-system phase before touching
runtime code.
