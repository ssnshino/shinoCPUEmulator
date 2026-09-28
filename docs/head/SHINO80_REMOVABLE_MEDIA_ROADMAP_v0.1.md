# SHINO-80 Removable Media Roadmap v0.1

Status: CURRENT DESIGN ROADMAP
Updated: 2026-09-28 JST
Author: 戸澤 / ChatGPT

## Purpose

Define the cross-phase plan for turning Virtual Disk A from a page-local writable
image into a safe removable-software-media workflow.

Only one bounded implementation slice is active at a time.

## Guiding rule

**ROM is the machine. DISK is the software culture.**

Browser conveniences remain outside the guest hardware boundary.

```text
Z80 / CP/M
   |
   v
Bus
   |
   v
DRIVE A controller
   |
   v
removable DISK MEDIA
--------------------------- guest / host boundary
host media shelf
portable whole-disk I/O
browser persistence
```

## Phase R1 — DRIVE A media lifecycle v0.1 — RELEASED

Released by Issue #46 / PR #47.

- EJECT current medium
- retain exact ejected bytes in one host-side shelf
- INSERT EJECTED DISK
- POWER-OFF-only media replacement
- no-media autoboot reuses ROM MON fallback
- reinsertion restores CP/M boot

## Phase R2 — whole-disk EXPORT v0.1 — SELECTED / DESIGN READY

Goal:

Allow the Human to save an exact defensive copy of the current canonical DRIVE A
medium outside the browser.

Contract:

- POWER OFF only in v0.1
- works from INSERTED or EJECTED canonical ownership state
- raw 256,256-byte payload
- Blob -> blob URL -> anchor download
- no File System Access API
- suggested filename: `SHINO80_DRIVE_A.s80d`
- `.s80d` means SHINO-80 whole-disk host image
- S80B remains a boot-profile magic/layout inside media
- export is read-only and preserves ownership
- actual Chromium download bytes are regression-tested

Active PLAN:

- `plan/head/SHINO80_DRIVE_A_WHOLE_DISK_EXPORT_V01_PLAN.md`

Design:

- `docs/head/SHINO80_DRIVE_A_WHOLE_DISK_EXPORT_BASIC_DESIGN_v0.1.md`
- `docs/head/SHINO80_DRIVE_A_WHOLE_DISK_EXPORT_DETAILED_DESIGN_v0.1.md`

Research:

- `research/shino80/SHINO80_WHOLE_DISK_EXPORT_ENGINEERING_RESEARCH_20260928.md`

## Phase R3 — whole-disk IMPORT v0.1

Goal:

Allow a Human-selected local disk image to become removable media.

Direction:

- ordinary `<input type="file">`
- read with `Blob.arrayBuffer()`
- exact image-length validation
- do not trust extension / accept hint alone
- invalid input must not mutate current disk or shelf
- imported-image validation policy is fixed by the R3 PLAN

R3 is also the runtime-acceptance gate for Software Division-generated prototype
whole-disk images.

## Phase R4 — factory media v0.1

Create a fresh deterministic SHINO-80 factory medium only on explicit Human
request.

Do not silently overwrite inserted or ejected working media.

## Phase R5 — browser persistence v0.1

Restore removable-media state across browser reload where supported.

- host-side only
- IndexedDB remains the primary candidate
- failure degrades to non-persistent machine operation
- do not depend on unload as the only save point
- portable whole-disk export remains the Human-controlled escape hatch

## Phase R6 — development media expansion

Future candidates:

- B: drive
- system/tools disk and user/work disk split
- host-side CP/M file workshop
- assembler / linker / editor / compiler
- multiple removable-media inventory
- write-protect UX

None are current commitments.

## Cross-phase invariants

- guest I/O remains CPU -> Bus -> device
- host media management never writes guest RAM
- Debugger remains observer-side
- `src/` remains authoring source
- `deploy/*.html` remains generated
- CPU semantics do not change for host-media features
- one active implementation PLAN
- one purpose branch
- one logical behavior change per PR
- tests ship with behavior
- Human controls merge/publication

## Update History

- 2026-09-28 — 戸澤 / ChatGPT — R2 whole-disk EXPORT selected and designed;
  POWER-OFF-only contract and `.s80d` host extension fixed.
- 2026-09-27 — 戸澤 / ChatGPT — R1 EJECT / REINSERT SAME MEDIA released.
- 2026-09-27 — 戸澤 / ChatGPT — Initial roadmap.
