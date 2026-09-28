# SHINO-80 FDD / DISK Design Notes v0.1

Status: CURRENT DESIGN NOTES
Updated: 2026-09-28 JST

## Purpose

Record the storage architecture that is already implemented/reviewed and the
boundary to later disk phases.

## 1. Drive and medium are separate

SHINO-80 separates the installed controller/drive concept from removable media.

Current machine:

```text
Z80 / CP/M
   |
   v
Bus
   |
   v
SHINO block controller · I/O 30h–36h
   |
   +-- selector 0 -> DRIVE A: -> removable medium
   |
   +-- selector 1 -> DRIVE B: -> removable medium
```

The UI may call these virtual disk drives. This does not mean seek timing,
rotation latency, DMA or a historical physical FDC chip are emulated.

## 2. Current PHASE 1 baseline

Both drives currently use CLASSIC media:

- 77 tracks
- 26 sectors/track
- 128 bytes/sector
- 256,256 bytes
- writable
- atomic complete-sector writes
- controller RESET preserves mounted media

A:

- BOOT / SYSTEM / TOOLS
- deterministic S80B v2
- only ROM autoboot / MON O source

B:

- USER / WORK / INTERCHANGE
- blank E5h CLASSIC medium at page construction
- no boot payload
- never probed by ROM IPL

## 3. Controller contract

Existing ports remain authoritative:

- 30h STATUS
- 31h COMMAND
- 32h DRIVE: 0=A:, 1=B:
- 33h TRACK
- 34h SECTOR
- 35h DATA
- 36h ERROR

One controller owns shared register/transfer state and two independent media
slots. Attaching two devices that both claim 30h–36h is not the architecture.

## 4. CP/M disk tables

A and B use:

- separate DPH_A / DPH_B
- shared DPB because media geometry is identical
- shared DIRBUF at FD00h–FD7Fh
- separate CSV_A / CSV_B
- separate ALV_A / ALV_B

The CBIOS remains inside the unchanged S80B v2 six-sector reservation.

## 5. Boot and warm boot

ROM boot always selects A:.

- POWER -> RUN -> A:
- UI RESET -> ROM autoboot -> A:
- MON O -> A:
- A absent/invalid -> MON, even if B is inserted

CP/M WBOOT is different: it reloads system code from A: but preserves the
current drive from Page Zero 0004h, so WBOOT from B: returns to B:.

## 6. Removable-media host lifecycle

A and B each have an independent page-local ejected-media shelf.

POWER OFF:

- EJECT target medium
- exact bytes retained
- INSERT EJECTED DISK restores the same bytes

POWER ON:

- controls disabled
- handler guard rejects replacement

Host actions do not synthesize guest Bus transactions.

## 7. Browser persistence boundary

The medium remains the canonical machine-facing object.

```text
guest CPU / Bus / controller / media
----------------------------------- guest-host boundary
host shelf / import-export / persistence
```

Browser reload persistence is not yet implemented.

## 8. Next phase

PHASE 2 combines whole-disk IMPORT and EXPORT. Do not revive the old
EXPORT-only implementation split.

Larger work-media profiles belong to PHASE 3.

## 9. Design invariants

- CPU -> Bus -> device remains the guest execution path
- A is the boot/system role in the current architecture
- B is the work/interchange role
- host tooling does not shortcut guest filesystem execution
- generated HTML is never hand-edited
- future undecided items stay outside active implementation contracts
