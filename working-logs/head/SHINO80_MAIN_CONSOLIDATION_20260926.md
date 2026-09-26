# SHINO-80 Main Consolidation and Publication Worklog

Date: 2026-09-26  
Branch: `docs/shino80-cpm-reference-closeout-20260926`  
Status: closeout in progress

## Integrated repository baseline

- PRs #18 through #37 were merged sequentially to `main`.
- Pre-closeout main SHA:
  `5e4091e655f173bb7eb724c5f523a24718808aa4`
- Local main matched `origin/main` and was clean after integration.
- No SHINO-80 pull requests remained open before this closeout branch.

The merge includes Memory Inspector, interactive MON, realtime pacing and
observer optimization, all Z80 instruction families and PHASE 1J precision,
the Technical Manual, BIOS/MON v0.3, pageable firmware, RAM handoff, Virtual
Disk A, CBIOS, system loader, WBOOT, CP/M 2.2, cursor/beeper and CP/M starter
filesystem.

## Human acceptance

Real iPhone/Edge testing confirms:

- `DIR`, `TYPE WELCOME.TXT`, `HELLO`, `S80INFO`
- Backspace/Delete line editing
- 80 x 25 text scrolling
- `SAVE 1 COPY.COM`
- copied COM execution through `COPY`
- `ERA COPY.COM` and its disappearance from `DIR`
- a second save as `COPY2.COM`

## Closeout scope

This branch adds an offline CP/M command reference to the Technical Manual,
records the Human results, refreshes the restart snapshot and prepares the
ChatGPT handoff. It does not change CPU, decoder, flags, ROM, CBIOS, disk,
CG-ROM, display or application behavior.

## Publication target

After repository QA and merge, publish the generated one-page machine and
Technical Manual to the existing unlisted/noindex Shinomiya Daihanten routes:

- `/works/lab/programs/shino80-preview.html`
- `/works/lab/programs/shino80-reference.html`
- `/works/lab/programs/shino80-notices.txt`

Only the Daihanten content repository should auto-deploy. Verify its exact
merged SHA in GitHub Actions and then perform public route smoke checks.

## Next development candidates

1. Browser-reload disk persistence and explicit disk image import/export.
2. Original SHINO file-management utility or license-audited CP/M utilities.
3. B: drive only after a documented device/media contract.
4. License-audited BASIC after storage behavior is stable.

Use one active environment and one writer. Do not modify CPU semantics without
a new precision phase and matching oracle evidence.
