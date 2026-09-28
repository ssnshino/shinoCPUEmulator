# SHINO-80 Disk Subsystem Roadmap v0.1

Status: CURRENT DESIGN ROADMAP
Updated: 2026-09-28 JST
Author: 戸澤 / ChatGPT

## Purpose

Define the bounded path from the current SHINO-80 removable disk implementation
to a daily-use CP/M development environment.

**Disk Subsystem completion is PHASE 5.**
Features after that line are Advanced Storage and are not allowed to keep the
base disk project permanently unfinished.

Guiding rule:

**ROM is the machine. DISK is the software culture.**

## PHASE 0 — DRIVE A removable media lifecycle — RELEASED

Issue #46 / PR #47.

- A: EJECT / REINSERT SAME MEDIA
- exact page-local shelf retention
- POWER-OFF-only replacement
- A: no-media ROM MON fallback
- S80B v2 A: autoboot retained

## PHASE 1 — A:/B: Dual Drive — IMPLEMENTED / REVIEWED

Issue #54 / PR #55. Human merge status must be read from live Git.

Architecture:

- one block controller on 30h–36h
- DRIVE 32h: 0=A:, 1=B:
- A: = BOOT / SYSTEM / TOOLS
- B: = USER / WORK / INTERCHANGE
- A and B initially use the same CLASSIC 256,256-byte geometry
- A only is a ROM autoboot source
- B starts as a blank writable work disk
- DPH_A / DPH_B
- shared DPB and FD00h DIRBUF
- independent CSV / ALV
- A/B independent POWER-OFF EJECT / REINSERT shelves
- WBOOT preserves B: current-drive state
- UI RESET re-enters ROM autoboot on A:

Completion criterion:

`A> -> B: -> B> -> write/read files -> A/B isolation -> WBOOT/RESET/media-cycle persistence`

## PHASE 2 — Whole Disk IMPORT + EXPORT — NEXT

IMPORT and EXPORT are one bounded host-media feature, not separate implementation
phases.

Goal:

- save a canonical whole medium to a user-owned host file
- later import the whole medium and continue work
- support the A/B dual-drive model without bypassing guest I/O

Design topics to resolve in PHASE 2 only:

- A/B target selection
- POWER-OFF safety rule
- inserted/ejected shelf ownership semantics
- exact filename / extension
- transactional import validation
- replacement confirmation
- browser/mobile save behavior

Baseline direction:

- standard browser File API / Blob mechanisms
- invalid import must be atomic no-op
- host actions must not fabricate Bus I/O
- no File System Access API dependency for the baseline

The superseded EXPORT-only PLAN/basic/detailed design are archived under
`*/history/2026-09-28/`. Their useful browser-download research remains
available as input, not as an active implementation contract.

## PHASE 3 — Practical Work Media / Multi-profile

Keep CLASSIC 256,256-byte media supported and add one practical larger work
profile.

Current leading candidate:

- CLASSIC: 256,256 bytes
- WORK: 720 KiB class

This phase owns:

- final larger-media geometry
- drive/media-profile responsibility split
- profile/header/container decisions
- mixed-profile A/B behavior

Do not add 2HD/1.2 MB merely to make the matrix look complete.

## PHASE 4 — CP/M Compatibility + Filesystem Regression

Turn compatibility into an explicit quality gate.

Targets:

- standard 8080/Z80 CP/M .COM software through normal CP/M APIs
- Page Zero / FCB / BIOS compatibility where practical
- A/B cross-drive operations
- USER areas
- extent and allocation-boundary tests
- disk-full behavior
- host-side directory/extent/allocation inspection
- selected known legacy CP/M media profiles

Foreign-machine hardware pokes and foreign BIOS/system-disk boot are not the
general compatibility target.

## PHASE 5 — Daily Development Environment — DISK SUBSYSTEM COMPLETE

Provide a practical development workflow.

A: system/tools side:

- CP/M
- editor
- assembler/compiler
- linker
- debugger
- required utilities

B: work side:

- source
- object
- COM
- data
- tests

Completion experience:

`EDIT -> ASSEMBLE/COMPILE -> LINK -> RUN -> EXPORT -> later IMPORT -> continue`

When this works reliably, the base SHINO-80 Disk Subsystem is complete.

## Advanced Storage — AFTER PHASE 5

Not completion blockers:

- IndexedDB browser persistence
- media library / recent disks
- factory restore / blank-disk wizard
- additional C:/D: drives
- 2HD profiles
- HDD / RAM disk
- host individual-file bridge
- network drive
- optional File System Access API integrations

## Cross-phase invariants

- guest I/O remains CPU -> Bus -> device
- A: remains the boot-system role unless a later explicit design changes it
- host media management never shortcuts guest RAM/filesystem execution
- Debugger remains observer-side
- `src/` remains authoring source
- generated `deploy/*.html` is never hand-edited
- one implementation PHASE at a time
- unresolved future items stay in the lounge, not in active repository contracts
- Human controls merge/publication

## Phase operating rule

For each PHASE:

1. lounge discussion and external research
2. detailed design for that PHASE only
3. one implementation Issue
4. Codex implementation + tests + PR
5. PM/PL/SE review
6. Human merge
7. only then design the next PHASE

## Update history

- 2026-09-28 — replaced obsolete R1–R6 split with PHASE 0–5 completion roadmap
- 2026-09-28 — PHASE 1 A:/B: Dual Drive reviewed in Issue #54 / PR #55
- 2026-09-28 — EXPORT-only Issue #51 / PR #52 superseded; IMPORT+EXPORT unified as PHASE 2
- 2026-09-27 — DRIVE A EJECT / REINSERT SAME MEDIA released
