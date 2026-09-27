# SHINO-80 Technical Manual v0.1

Status: CURRENT / RELEASED
Updated: 2026-09-27 JST
Implementation baseline: `47f2d6e1870c21c7ac55ec47620594b4adb02217` / PR #47

## Deliverable and authority

`deploy/shino80_technical_manual_v0.1.html` is the generated standalone manual.
It works offline without font, CDN or runtime network dependencies. It is also
published as an unlisted/noindex page by the Shinomiya Daihanten content repository.

Authoring sources: `src/manual/` and `scripts/build-technical-manual.cjs`.

Build and verification:

```bash
pnpm run build:manual
pnpm run test:manual
```

Do not hand-edit the generated HTML.

## Current content

- 1,780 Z80 encoding reference with examples and accuracy boundaries
- system wiring, memory/I/O maps, ROM BIOS/MON and pageable firmware
- DM-80 / native CG-ROM
- Virtual Disk A ports 30h–36h and POWER-OFF EJECT / REINSERT SAME MEDIA
- desktop right Inspector and compact DEVICES inline Inspector media controls
- S80B v2 canonical boot layout, SHINO CBIOS/WBOOT, CP/M 2.2 and writable A:
- CP/M DIR / TYPE / ERA / REN / SAVE / USER and bundled COM programs
- source hashes and external references

## Accuracy and implementation boundaries

- CPU external full-state baseline: `1,604,000 / 1,604,000 PASS`
- instruction-level, not electrical/pin-cycle-perfect
- Virtual Disk A is PIO, not a mechanical FDD/FDC
- POWER-OFF EJECT / REINSERT is page-local host media management
- guest eject, browser-reload persistence, whole-disk import/export,
  factory-media restore, B:, UART and printer remain NOT IMPLEMENTED / future
- reserved BIOS vectors are not implemented drivers or interrupt handlers

## Software Division contract

Google Drive `40_SHINO80_SOFTWARE_LAB/02_specs` contains draft
cross-department contracts for the synchronization matrix, Programmer’s
Reference and S80B v2 Boot Disk Image Format.

The standalone Technical Manual is the product-facing online/offline reference.
The Software Division documents are the deeper development contract. Both must
describe the same implemented / reserved / not-implemented boundary.

## Publication

Publication in `ssnshino/shinomiya-daihanten-content` is a separate,
Human-authorized step and records the exact source commit and artifact SHA-256.
