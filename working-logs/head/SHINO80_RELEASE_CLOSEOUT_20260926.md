# SHINO-80 Released Baseline and Restart-Cockpit Closeout

Date: 2026-09-26 JST
Purpose branch: `docs/restart-cockpit-20260926`
Implementation baseline: `e75d8c0506a7b1bb711b54c352c8b04580cdddaf`

## Result before this documentation change

PRs #18–#38 were integrated into reviewed `main`. The machine includes the
complete instruction-level Z80 milestone, BIOS/MON v0.3, pageable 64 KiB RAM,
DM-80, Virtual Disk A, SHINO CBIOS/WBOOT, licensed CP/M 2.2, writable starter
filesystem, cursor and beeper.

Human iPhone/Edge acceptance covered DIR, TYPE, HELLO, S80INFO, Backspace,
80×25 scroll, SAVE, copied COM execution and ERA. CPU full-state oracle remains
`1,604,000 / 1,604,000 PASS`, Failure 0.

## Publication evidence

- content repository: `ssnshino/shinomiya-daihanten-content`
- content PR: #11
- deployed master: `743b6038b4a40b8db32463e22ba864855776e152`
- GitHub Actions run: `36224728565` / SUCCESS
- runner reported exact deployed SHA: PASS
- shared local/public routes: PASS
- SHINO machine/manual/notices local/public routes: PASS
- container rebuild/restart: not required for content-only publication

## Documentation closeout

- root README is now the sole first-entry cockpit
- CURRENT, LAST, NEXT and manifest contain only actionable current state
- one consolidated current system spec replaces incremental specs in the
  normal restart scan
- completed phase plans/worklogs/specs and dated snapshots moved to history
- Technical Manual release/provenance wording updated and regenerated
- module and deploy READMEs updated to reflect implemented code
- Codex bundled Node/pnpm path recorded; aggregate tests now chain through
  pnpm so the documented `pnpm test` command is directly reproducible

Historical files were moved without rewriting their then-current claims. Git
history plus the history directories preserve the original evidence.

## Runtime boundary

No CPU, decoder, flag, firmware, disk, CG-ROM, display or application behavior
is changed by this closeout. Any generated manual delta is documentation and
provenance only.

## Restart rule

Tell the next worker: “Read README.md.” Follow its sequence, fetch GitHub, and
prefer live Git state when it is newer than a recorded SHA.
