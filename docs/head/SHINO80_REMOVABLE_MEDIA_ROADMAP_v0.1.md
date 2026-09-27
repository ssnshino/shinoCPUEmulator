# SHINO-80 Removable Media Roadmap v0.1

Status: CURRENT DESIGN ROADMAP
Updated: 2026-09-27 JST
Author: 戸澤 / ChatGPT

## Purpose

Define the cross-phase plan for turning Virtual Disk A from a permanently
page-local mounted image into a safe removable-software-media workflow.

This is a roadmap, not one implementation contract. Only one bounded slice is
active at a time.

Research basis:

- `research/shino80/SHINO80_REMOVABLE_MEDIA_ENGINEERING_RESEARCH_20260927.md`
- `docs/head/SHINO80_FDD_DISK_DESIGN_NOTES_v0.1.md`

## Guiding rule

**ROM is the machine. DISK is the software culture.**

Browser conveniences must remain outside the guest hardware boundary.

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
portable image I/O
browser persistence
```

## Phase R1 — DRIVE A media lifecycle v0.1

Goal:

Prove that DRIVE A and its inserted medium are separate objects in the actual
workbench.

Functions:

- EJECT inserted medium
- retain exact ejected bytes in a host-side temporary shelf
- INSERT EJECTED DISK
- media changes only while POWER OFF

Required behavior:

- no data is lost by an EJECT -> REINSERT round trip
- POWER ON with no medium reaches ROM MON through the released autoboot fallback
- reinserting the same valid medium restores normal autoboot
- controller / CPU / firmware contracts do not change

Explicitly excluded:

- file import
- file export
- factory restore
- IndexedDB
- B:
- hot swap while powered

## Phase R2 — whole-disk EXPORT v0.1

Goal:

Allow the Human to take a defensive copy of the current removable medium out of
the browser as one portable image.

Direction:

- raw 256,256-byte image remains the portable boundary
- Blob / blob URL / download path
- no File System Access API dependency
- export is read-only and must not alter mounted/ejected state
- filename/extension is fixed by that phase's PLAN

This phase should come before destructive replacement operations so a Human has
a portable backup path.

## Phase R3 — whole-disk IMPORT v0.1

Goal:

Allow a Human-selected local disk image to become removable media.

Direction:

- baseline picker: `<input type="file">`
- read with `Blob.arrayBuffer()`
- never trust filename extension or `accept` alone
- exact image-length validation is mandatory
- S80B boot-header validation policy is fixed by that phase's PLAN
- invalid input must not mutate the current medium or shelf

No persistence is implied.

## Phase R4 — factory media v0.1

Goal:

Create a fresh deterministic SHINO-80 factory system medium on explicit Human
request.

Safety direction:

- do not silently overwrite an existing inserted/ejected working medium
- require an explicit state transition chosen by the Human
- use the existing deterministic system-disk builder
- this is media creation/replacement, not RESET

Exact confirmation UX is deferred to the phase PLAN.

## Phase R5 — browser persistence v0.1

Goal:

Restore removable-media state after browser reload where the host environment
supports it.

Direction:

- IndexedDB is the primary candidate
- persistence lives outside the guest device
- failure or unavailability degrades to non-persistent operation
- do not depend on `unload` as the only save point
- exact origin / `file://` behavior must be tested and documented
- portable image export remains the durable user-controlled escape hatch

## Phase R6 — development media expansion

Future candidates after A: media usability stabilizes:

- B: drive
- system/tools disk vs work disk
- host-side CP/M file workshop
- editor / assembler / linker / compiler selection
- multiple removable media inventory
- write-protect UX
- optional richer host filesystem integration

None are current commitments.

## Cross-phase invariants

- guest I/O remains CPU -> Bus -> device
- host media management never writes directly into guest RAM
- Debugger remains observer-side
- `src/` remains authoring source
- `deploy/*.html` remains generated
- CPU semantics do not change for host media features
- one active implementation PLAN
- one purpose branch
- one logical behavior change per PR where practical
- tests ship with the behavior they validate
- Human controls merge/publication

## Why the phases are intentionally small

The project prefers fault localization over apparent throughput. A failure after
a media lifecycle PR should implicate media lifecycle code; a later import bug
should not force simultaneous investigation of IndexedDB, file-picker,
factory-reset and B: behavior.

This is both a debugging policy and a delivery policy.

## Update History

- 2026-09-27 — 戸澤 / ChatGPT — Initial removable-media roadmap based on
  current SHINO-80 device contract and current Web engineering research.
