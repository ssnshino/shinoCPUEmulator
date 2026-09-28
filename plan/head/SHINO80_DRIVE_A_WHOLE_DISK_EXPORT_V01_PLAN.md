# SHINO-80 DRIVE A Whole-Disk EXPORT v0.1 PLAN

Date: 2026-09-28 JST
Status: ACTIVE AFTER DESIGN PACKAGE MERGE

Planned branch:
`feature/shino80-drive-a-export-v01-20260928`

## Goal

Allow the Human to download an exact defensive copy of the current DRIVE A
medium as `SHINO80_DRIVE_A.s80d` while POWER is OFF.

## Required behavior

- POWER OFF + inserted -> EXPORT IMAGE enabled
- POWER OFF + ejected shelf -> EXPORT IMAGE enabled
- POWER ON -> EXPORT disabled
- handler independently guards invalid/powered calls
- inserted source uses defensive `diskA.exportImage()`
- ejected source uses defensive shelf copy
- payload exactly 256,256 raw bytes
- MIME `application/octet-stream`
- suggested filename `SHINO80_DRIVE_A.s80d`
- Blob + object URL + temporary anchor
- no File System Access API
- export does not change ownership or Bus trace
- desktop and compact share the same state/action path

## Sources

- `research/shino80/SHINO80_WHOLE_DISK_EXPORT_ENGINEERING_RESEARCH_20260928.md`
- `docs/head/SHINO80_DRIVE_A_WHOLE_DISK_EXPORT_BASIC_DESIGN_v0.1.md`
- `docs/head/SHINO80_DRIVE_A_WHOLE_DISK_EXPORT_DETAILED_DESIGN_v0.1.md`
- `docs/head/SHINO80_REMOVABLE_MEDIA_ROADMAP_v0.1.md`

## Expected production changes

Primary:

- `src/app/shino80-workbench-v0.0.2.js`
- `tests/browser_smoke_v0.0.9.cjs`
- generated standalone machine

Possible only if required:

- small local CSS change
- focused Technical Manual source/test update

Not expected:

- template
- block device
- CPU / Bus / ROM / CBIOS / CP/M

## Required QA

Compact 390x844:
- visible EXPORT
- exact browser download
- inserted/ejected payload equality
- ownership unchanged
- Bus trace unchanged
- POWER guard
- existing MON fallback/reinsert/CPM recovery remains green

Desktop 1280x900:
- visible right-Inspector EXPORT and guard

Compact-height 900x400:
- visible inline EXPORT, no overflow

General:
- no page errors
- no unexpected network requests

## Verification

```bash
export PATH="/Users/shino/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:/Users/shino/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback:$PATH"
export NODE_PATH="/Users/shino/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules"
export CHROMIUM_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

pnpm test
pnpm run test:browser
git diff --check
```

## Non-goals

IMPORT, persistence, factory restore, B:, media library, individual host-file
exchange, POWER ON export, write-protect UI, guest export, public deployment,
unrelated refactor.

## Coding-agent rule

Codex is implementation contractor only. It may inspect live code for blocking
contradictions, but must not redesign the feature, research alternatives,
rewrite project planning, merge or publish.

Implement -> test -> build -> worklog -> PR -> STOP.

## Stop condition

Open implementation PR and stop for Human review.
