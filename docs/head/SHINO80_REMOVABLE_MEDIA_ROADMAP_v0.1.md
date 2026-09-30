# SHINO-80 Disk Subsystem Roadmap v0.1

Status: CURRENT DESIGN ROADMAP
Updated: 2026-09-29 JST
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

## PHASE 2 — Whole Disk IMPORT + EXPORT — IMPLEMENTED / REVIEWED

IMPORT and EXPORT are one bounded host-media feature, not separate implementation
phases.

Goal:

- save a canonical whole medium to a user-owned host file
- later import the whole medium and continue work
- support the A/B dual-drive model without bypassing guest I/O

Issue #56 candidate resolves the PHASE 2 contract:

- A/B `.s80d` payload is raw 256,256 bytes with no wrapper/compression
- both INSERTED and EJECTED canonical owners can export byte-exact copies
- IMPORT is POWER-OFF-only and uses read -> validate -> pending -> confirm
- one workbench-wide pending import; the other drive remains usable except for
  starting another import
- confirm revalidates target ownership and commits only once
- invalid/read-failed/canceled/changed/powered transactions are atomic no-ops
- standard File/Blob/object-URL browser mechanisms; no File System Access API
- host actions do not fabricate Bus I/O
- A remains the only autoboot source; imported A media is not host-validated

The superseded EXPORT-only PLAN/basic/detailed design are archived under
`*/history/2026-09-28/`. Their useful browser-download research remains
available as input, not as an active implementation contract.

## PHASE 3 — Multi-Profile FDD — IMPLEMENTED / REVIEWED

Issue #59 / `feature/shino80-multi-profile-fdd-phase3-20260929`.

Normative contract:
`docs/head/SHINO80_PHASE3_MULTI_PROFILE_FDD_SPEC_v1.md`.

The earlier 720 KiB-only candidate is superseded. PHASE 3 now keeps CLASSIC as
a permanent compatibility profile and adds a real-FDD-oriented native profile
architecture:

- 00h CLASSIC — 77/1/26/128
- 01h 2HD-JP — 77/2/8/1024
- 02h 2DD-720 — 80/2/9/512
- 03h 2HD-AT-1200 — 80/2/15/512
- 04h 2HD-1440 — 80/2/18/512

A:/B: both become multi-profile. Boot acceptance is required for CLASSIC and
2HD-JP; all five are native data/work media. CP/M keeps 128-byte logical
records and CBIOS owns blocking/deblocking.

The pre-implementation review froze the five DPBs, ports 30h–38h semantics,
S80B v3 header, high-RAM map, host profile UX and profile-aware SELDSK
contract. Checkpoint A, the contract fixture gate and Checkpoint B multi-profile
controller I/O are implemented; CBIOS/filesystem/host runtime work has not started.

D88/DCP/FDI and foreign CP/M compatibility remain PHASE 4.

## PHASE 4 — CP/M Compatibility + Foreign Media Bridge — ACTIVE

Issue #63. Purpose branch: `feature/shino80-phase4-cpm-compat-foreign-media-20260930`.

Design is frozen and implementation-ready.

Turn compatibility into an explicit quality gate while keeping the PHASE 3 native runtime unchanged.

Targets:

- standard 8080/Z80 CP/M .COM software through normal CP/M APIs
- Page Zero / FCB / BIOS compatibility where practical
- A/B cross-drive operations
- USER areas
- extent and allocation-boundary tests
- disk-full behavior
- host-side directory/extent/allocation inspection
- selected known legacy CP/M media profiles
- D88 / FDI / DCP/DCU read-only parsing
- exact F000 IBM3740 and F001 Sinclair 720 foreign profiles
- file extraction and conversion into fresh SHINO native .s80d

Foreign-machine hardware pokes and foreign BIOS/system-disk boot are not the general compatibility target. Foreign disks are not directly mounted into A:/B:.

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

- 2026-09-30 — Human selected PHASE 4; Issue #63 / purpose branch / normative PLAN-spec-QA created

- 2026-09-30 — Issue #59 / PR #60 PHASE 3 Multi-Profile FDD merged after Human Review
- 2026-09-30 — PR #61 reproducible CLASSIC demo software disk merged

- 2026-09-29 — Issue #59 PHASE 3 Checkpoint A + DPB/header/RAM fixtures implemented
- 2026-09-29 — Issue #59 PHASE 3 Checkpoint B controller multi-profile I/O implemented and verified
- 2026-09-29 — Issue #59 PHASE 3 contract frozen after pre-implementation review

- 2026-09-28 — replaced obsolete R1–R6 split with PHASE 0–5 completion roadmap
- 2026-09-28 — PHASE 1 A:/B: Dual Drive reviewed in Issue #54 / PR #55
- 2026-09-28 — EXPORT-only Issue #51 / PR #52 superseded; IMPORT+EXPORT unified as PHASE 2
- 2026-09-29 — Issue #56 PHASE 2 implementation candidate completed for Human Review
- 2026-09-27 — DRIVE A EJECT / REINSERT SAME MEDIA released
