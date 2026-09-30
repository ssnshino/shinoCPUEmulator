# SHINO-80 Technical Manual v0.1

Status: CURRENT INTEGRATION REFERENCE
Updated: 2026-09-30 JST
Reviewed baseline: PHASE 3 and demo disk / main `830f6a30c9b2a22dbdef3b0e400ff863c14e6654`
Active candidate: Issue #63 / PHASE 4 Foreign Media Bridge

## Deliverable and authority

`deploy/shino80_technical_manual_v0.1.html` is the generated standalone manual.
It works offline without font, CDN or runtime network dependencies.

Authoring sources:

- `src/manual/`
- `scripts/build-technical-manual.cjs`

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
- one Virtual Disk controller on 30h–38h with A:/B: multi-profile media slots
- DRIVE 32h selector: 0=A:, 1=B:
- A: BOOT / SYSTEM / TOOLS with compatible S80B v2 and 2HD-JP S80B v3 autoboot
- B: USER / WORK / INTERCHANGE with any native profile
- independent POWER-OFF A/B EJECT / REINSERT SAME MEDIA
- shared desktop/compact disk inspector/action path
- DPH_A / DPH_B, five fixed DPBs / FD00h DIRBUF, independent CSV / ALV / profile state
- CBIOS v3 exact 2,304-byte F400h–FCFFh resident image
- WBOOT B: preservation versus ROM/UI RESET A: initialization
- A/B raw `.s80d` IMPORT / EXPORT for all five exact native image sizes
- transactional POWER-OFF IMPORT with single pending confirmation and atomic no-op failures
- pending target EJECT / REINSERT disabled in both UI and handlers
- CP/M DIR / TYPE / ERA / REN / SAVE / USER and bundled A: programs
- source hashes and external references
- PHASE 4 host foreign bridge operation, explicit F000/F001 selection and native pending confirmation

## Accuracy and implementation boundaries

- CPU external full-state baseline: `1,604,000 / 1,604,000 PASS`
- instruction-level, not electrical/pin-cycle-perfect
- block controller is PIO, not a mechanical FDD/FDC
- B: is implemented but is not a boot source in PHASE 1
- browser-reload persistence and factory-media restore are not implemented
- foreign/container parsing is host-side only; CP/M filesystem identity is never auto-selected from geometry
- UART and printer remain future work
- reserved BIOS vectors are not implemented drivers or interrupt handlers

## Storage roadmap relationship

PHASE 1–3 are reviewed native foundations. Issue #63 is the active PHASE 4
compatibility/foreign bridge candidate; publication remains separate.

See `docs/head/SHINO80_REMOVABLE_MEDIA_ROADMAP_v0.1.md`.

## Publication

Publication in `ssnshino/shinomiya-daihanten-content` is a separate,
Human-authorized step and records the exact source commit and artifact SHA-256.
Updating this repository's generated manual does not itself publish the
Daihanten unlisted reference page.

## Update History

- 2026-09-30T14:42:19+09:00 — Codex — Synchronized manual candidate status and offline Foreign Media Bridge guide.
