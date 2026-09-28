# SHINO-80 Whole-Disk EXPORT v0.1 — Engineering Research Note

Date: 2026-09-28 JST
Author: 戸澤 / ChatGPT
Status: Research / implementation-design input
Baseline: `d2f9610144d6b164dd572f5ae84011f471eec28e`

## Purpose

Fix the smallest browser-side contract for exporting the current DRIVE A medium
without changing guest-machine behavior or removable-media ownership.

## Current repository facts

The released block device already provides the machine-facing primitive needed
for EXPORT:

- `Shino80BlockDevice.exportImage()` returns a defensive `Uint8Array`
- exact image size is 256,256 bytes
- complete sector writes are atomic
- R1 separates DRIVE A and removable medium
- R1 keeps one canonical medium owner:
  - inserted: disk owns the bytes, shelf is null
  - ejected: drive is empty, `driveAEjectedMedia` owns the bytes
- desktop and compact Disk A inspectors share one render/action path
- host media actions do not create synthetic Bus traffic

Therefore R2 must not add a block-device command, I/O port, guest service, ROM
path, CBIOS service or CP/M change.

## Browser mechanism

Use the ordinary generated-file path:

```text
Uint8Array
  -> Blob
  -> URL.createObjectURL()
  -> temporary <a download>
  -> browser download/save flow
```

Do not use File System Access API as the canonical path. SHINO-80 remains a
standalone/offline one-page machine and must not require a server or secure
origin.

The object URL must be revoked after the user agent has had time to consume it,
not synchronously before download startup.

## Adopted safety policy

R2 EXPORT is POWER-OFF-only.

Although export is read-only, the v0.1 contract intentionally avoids defining a
snapshot taken during an active guest PIO transfer. This keeps all host media
management conservative and makes the exported bytes unambiguously committed
medium state.

## Exportable ownership states

POWER OFF + INSERTED:
- source is `diskA.exportImage()`
- drive remains inserted
- shelf remains null

POWER OFF + EJECTED:
- source is a fresh copy of `driveAEjectedMedia`
- drive remains empty
- shelf retains the canonical medium

POWER ON:
- EXPORT disabled
- handler rejects direct dispatch too

## Host file contract

Suggested filename:

`SHINO80_DRIVE_A.s80d`

`.s80d` means SHINO-80 whole-disk host image. It does not mean S80B.
S80B v2 is an internal boot-profile magic/layout; a future non-bootable SHINO-80
medium can still be a valid `.s80d` image.

Payload remains exactly 256,256 raw bytes with no host wrapper, JSON, base64 or
compression.

MIME:

`application/octet-stream`

## QA conclusion

Chromium automation should verify the actual download event, suggested filename,
downloaded byte length and byte equality to the expected current medium.

Physical iPhone/Edge Human QA remains useful for the browser-specific save/share
presentation and final filename handling.

## Boundary

R2 is backup/export only. IMPORT, persistence, factory restore, B:, individual
CP/M file exchange and powered hot swap remain separate phases.
