# SHINO-80 CBIOS v0.1 worklog

## Scope

Branch `feature/shino80-cbios-v01-20260926`, parent Virtual Disk A v0.1
`128f031` / PR #31. Implement the hardware-facing CBIOS contract with original
code and fixtures before any CP/M-family import.

## Research decision

The Digital Research CP/M 2.2 Alteration Guide defines a 17-JP BIOS vector and
the console/disk call conventions. SHINO CBIOS follows that public ABI and the
standard single-density disk table values already adopted by Virtual Disk A.
No sample CBIOS source was copied.

The image is placed at FA00h. This leaves the one-shot RAM handoff trampoline
at F800h untouched and provides 1,536 bytes through FFFFh; the implemented
image ends at FC35h and uses 566 bytes.

## Implementation

- added original RAM-resident CBIOS image builder
- emitted all 17 standard three-byte JP slots from FA00h through FA30h
- added non-consuming CONST and blocking 7-bit CONIN on Keyboard ports 20h/21h
- added RAM-only CONOUT with Text VRAM cursor, CR/LF, 80-column and screen wrap
- added HOME/SELDSK/SETTRK/SETSEC/SETDMA/READ/WRITE/SECTRAN
- added exact DPH/DPB, 128-byte DIRBUF, 16-byte CSV and 31-byte ALV
- implemented READ/WRITE as exact 128-byte INIR/OTIR transfers on DATA 35h
- mapped Virtual Disk errors to CP/M BIOS zero/nonzero return convention
- left LIST/PUNCH harmless and READER at Ctrl-Z
- left BOOT/WBOOT as explicit initialize-and-return candidates; no false CP/M
  startup implementation
- updated source inventory and offline Technical Manual BIOS chapter

## Verification

The CBIOS suite verifies:

- contiguous ordered 17-entry vector and exact JP targets
- exact little-endian DPH/DPB bytes and internal pointers
- image size/end boundary below 10000h
- BOOT initialization, Keyboard CONST/CONIN and VRAM CONOUT
- A:/invalid SELDSK, HOME, identity/table SECTRAN, LISTST and READER
- first-sector READ and final-sector WRITE through real Z80/Bus/device paths
- 128 DATA reads plus 128 DATA writes in Bus trace
- write-protected error mapping
- original sector-1 payload read to 8000h, executed in all-RAM mode and writing
  `CBI!` without any Boot/Extension ROM access

All 21 package stages pass: PHASE1A–1J, PHASE2A/2A.1, BIOS/MON, keyboard,
pageable firmware, RAM handoff, execution pace, trace, block device, CBIOS,
source, one-page artifact and Technical Manual.

Generated artifacts:

- one-page remains 191,394 bytes / SHA-256
  `1587f96e2f575e37343388332f09fa4356f04b9d8b605dfe1e9ac3da1ab19ce2`
- Technical Manual is 1,996,159 bytes / 1,780 encodings / SHA-256
  `f72e1fdba82e767c34641c9cb8899da3f2b41f74e60981a0b177051e94daaf8a`
- CBIOS source SHA-256
  `e57c7c90e582d043486f3d9ade839ac94b654a92041927fdd9aabb729b608d59`

Browser plugin was absent, so bundled Node Playwright drove installed Chrome.
The Technical Manual system/map/BIOS routes passed at 1440×1000 and 390×844;
the CBIOS heading, FA00h–FC35h range, 566-byte size, entry table and explicit
not-yet-CP/M warning were present. Console warnings/errors: 0; page errors: 0;
network requests: 0; document overflow: 0. Screenshots were visually inspected.

`git diff --check` passes. The runtime one-page source, CPU, System ROM, mapper,
block device, CG-ROM and DM-80 CSS have no CBIOS-phase diff.

## Boundary / next phase

The ordinary one-page startup does not inject CBIOS into RAM. No CCP, BDOS,
filesystem or system-track image is present. BOOT/WBOOT do not reload or enter
CP/M. The next phase is an explicit cold/warm loader plus original multi-sector
system-image proof, followed only then by the existing CP/M license audit gate.
