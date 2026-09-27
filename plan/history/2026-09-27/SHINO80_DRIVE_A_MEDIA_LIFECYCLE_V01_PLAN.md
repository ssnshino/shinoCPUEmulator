# SHINO-80 DRIVE A Media Lifecycle v0.1 PLAN

Date: 2026-09-27 JST

Planned branch:
`feature/shino80-drive-a-media-lifecycle-v01-20260927`

Baseline:
Use live `main` after Disk Autoboot post-merge closeout. Before implementation,
fetch GitHub and record the exact main SHA in the implementation worklog.

## Purpose

Implement one bounded removable-media behavior:

**EJECT / REINSERT SAME MEDIA for DRIVE A while POWER is OFF.**

This is the first implementation slice from the removable-media roadmap. It
proves that the drive and inserted medium are separate objects without adding
file APIs or persistence.

## Sources

Repository design:

- `docs/head/SHINO80_FDD_DISK_DESIGN_NOTES_v0.1.md`
- `docs/head/SHINO80_REMOVABLE_MEDIA_ROADMAP_v0.1.md`
- `docs/head/SHINO80_DRIVE_A_MEDIA_LIFECYCLE_BASIC_DESIGN_v0.1.md`
- `docs/head/SHINO80_DRIVE_A_MEDIA_LIFECYCLE_DETAILED_DESIGN_v0.1.md`

Research:

- `research/shino80/SHINO80_REMOVABLE_MEDIA_ENGINEERING_RESEARCH_20260927.md`

## Required behavior

- DRIVE A initially contains the normal factory system medium.
- While POWER OFF, Human can EJECT that medium.
- EJECT stores the exact returned bytes in one host-side temporary media shelf.
- With A: empty, POWER ON -> RUN uses the already-released no-media autoboot
  fallback and reaches ROM MON.
- After POWER OFF, Human can INSERT EJECTED DISK.
- Reinsertion mounts the exact same bytes; it does not rebuild factory media.
- POWER ON -> RUN then boots normal CP/M again.
- Media-changing controls are disabled while POWER is ON.
- Action handlers independently enforce the same guard.

## Changes

Expected:

- host-side ejected-media state in workbench
- Disk A selected-device controls and runtime media status
- existing right-side Inspector path for desktop/ordinary medium layouts
- inline selected-device inspector inside the DEVICES major pane for compact
  and compact-height layouts where the global Inspector is currently hidden
- dynamic READY / EMPTY device state while powered
- minimal template/CSS needed for the compact Human-visible operation path
- device-contract round-trip regression
- user-visible browser smoke for eject/no-media/reinsert/autoboot
- normal generated one-page artifact rebuild
- implementation worklog produced by the coding agent

## Non-goals

- host image import
- host image export
- file picker
- Blob download
- factory restore/new media
- IndexedDB
- StorageManager
- persistence across reload
- B:
- media library
- hot swap while powered
- write-protect UI
- guest-level eject
- CPU / ROM / CBIOS / CP/M changes
- unrelated refactor
- public deployment

## Accuracy level

Host media-lifecycle functional accuracy.

No new mechanical FDD timing is modeled. Guest-visible disk I/O accuracy remains
the released block-device / CBIOS contract.

## Regression risks

- EJECT accidentally discards modified medium bytes.
- Reinsertion mounts a fresh factory image instead of the ejected medium.
- Host shelf and drive both retain canonical writable copies.
- media actions remain clickable while POWER ON.
- no-media state accidentally bypasses existing ROM fallback.
- inspector rerender duplicates event listeners.
- desktop and compact inspectors diverge in media state or action behavior.
- hidden desktop inspector is accidentally treated as compact acceptance.
- Disk A still displays READY/ONLINE while powered with no media.
- inline compact detail violates the one-major-pane rule or creates horizontal
  overflow.
- host actions accidentally create Bus traffic or alter CPU state.

## QA

### Device contract

- exact EJECT -> mount round trip preserves modified bytes
- device reports no media while ejected
- existing reset/media-preservation tests remain green

### Browser

User-visible Playwright sequence:

```text
POWER OFF
DEVICES -> VIRTUAL DISK A
EJECT
POWER ON -> RUN
ROM MON fallback
POWER OFF
INSERT EJECTED DISK
POWER ON -> RUN
SHINO-80 CP/M 2.2
A>
```

Also verify:

- compact/mobile operation uses controls that are actually visible to a Human
- desktop right-side Inspector also exposes the same actions/state
- button enabled/disabled states match between layout families
- compact no-horizontal-overflow
- no page errors
- no unexpected network requests

### Regression

- `pnpm test`
- `pnpm run test:browser`
- `git diff --check`

## Success criteria

- the exact same medium survives EJECT -> REINSERT
- A: empty state is observable in Device UI
- existing ROM no-media fallback is exercised rather than replaced
- existing CP/M autoboot returns after reinsertion
- no forbidden scope expansion
- one logical implementation commit
- PR is created and left unmerged for Human review

## Coding-agent execution rule

The coding agent is the implementation contractor.

It should not redesign the roadmap, rewrite project snapshots, reorganize
documentation or search for an alternate product direction.

If the detailed design conflicts with live code in a way that blocks correct
implementation, comment on the Issue with the exact conflict and stop.

Otherwise implement, test, create one logical commit, open the PR and stop.
