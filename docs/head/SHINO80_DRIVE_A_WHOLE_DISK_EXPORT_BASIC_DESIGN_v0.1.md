# SHINO-80 DRIVE A Whole-Disk EXPORT v0.1 — Basic Design

Status: IMPLEMENTATION-READY DESIGN
Updated: 2026-09-28 JST
Author: 戸澤 / ChatGPT
Baseline: `d2f9610144d6b164dd572f5ae84011f471eec28e`

## 1. Goal

Add one bounded host-side capability:

**save an exact defensive copy of the current DRIVE A medium as a portable
256,256-byte SHINO-80 disk image.**

R2 intentionally comes before IMPORT so the Human has a backup path before later
phases can replace removable media.

## 2. UI

Under:

`DEVICES -> VIRTUAL DISK A`

add a third action:

`EXPORT IMAGE`

The action must be Human-visible in both existing presentation families:

- desktop right-side Inspector
- compact / compact-height inline DEVICES Inspector

No new top-level navigation destination is introduced.

## 3. POWER policy

EXPORT is enabled only while POWER is OFF.

The handler independently enforces the rule; disabled UI state is not the only
correctness boundary.

## 4. Ownership states

### POWER OFF + INSERTED

EXPORT enabled.

Source: defensive `diskA.exportImage()`.

State after export:
- still INSERTED
- shelf still empty
- controller state unchanged

### POWER OFF + EJECTED

EXPORT enabled.

Source: defensive copy of `driveAEjectedMedia`.

State after export:
- still EJECTED
- shelf still retains the same canonical medium
- INSERT EJECTED DISK remains available

### POWER ON

EXPORT disabled regardless of inserted/ejected state.

### Invalid/no canonical owner

EXPORT disabled or safely rejected.

## 5. Portable image

- raw bytes only
- exact size 256,256
- filename `SHINO80_DRIVE_A.s80d`
- MIME `application/octet-stream`
- no wrapper/header added by host
- no factory rebuild
- no format conversion

## 6. Browser path

```text
current medium defensive copy
        |
        v
Blob
        |
        v
blob URL
        |
        v
temporary download anchor
        |
        v
browser save/download UI
```

No File System Access API and no network round trip.

## 7. Invariants

EXPORT must not change:

- `diskA.mounted`
- `driveAEjectedMedia`
- medium bytes
- write-protect state
- track / sector / command / transfer / error
- CPU state
- guest RAM
- Bus trace

EXPORT must not call guest I/O.

## 8. Non-goals

- IMPORT
- persistence
- factory restore
- B:
- media library
- individual CP/M file transfer
- powered export
- hot swap
- guest export command
- checksum/hash UI
- CPU / Bus / ROM / CBIOS / CP/M changes
- public deployment

## 9. Acceptance

Complete when:

- desktop and compact visibly expose EXPORT IMAGE
- inserted and ejected states both export exact current bytes while POWER OFF
- POWER ON disables and handler-rejects export
- download is exactly 256,256 bytes
- suggested filename is `SHINO80_DRIVE_A.s80d`
- export preserves ownership and Bus trace
- existing no-media fallback and reinsertion/CPM behavior remain green
- no page errors, unexpected network requests or horizontal overflow
