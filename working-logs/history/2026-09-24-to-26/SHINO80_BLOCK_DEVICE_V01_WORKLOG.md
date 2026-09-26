# SHINO-80 Virtual Block Device v0.1 worklog

## Scope

Branch `feature/shino80-block-device-v01-20260926`, parent RAM handoff v0.5
`a2a6430` / PR #30. Build one observable A: sector device before any CBIOS,
CP/M or BASIC import.

## Research decision

The Digital Research CP/M 2.2 Alteration Guide defines the relevant BIOS
boundary as drive/track/sector/DMA plus 128-byte READ/WRITE and gives a standard
single-density example with 26 sectors per track, 1 KiB blocks, 243 blocks,
64 directory entries and two reserved tracks. SHINO-80 adopts the matching
77 × 26 × 128-byte physical image (256,256 bytes), while explicitly treating
CP/M disk formats as machine-specific.

## Implementation

- added independent `Shino80BlockDevice` module
- added low-byte-decoded STATUS/COMMAND/DRIVE/TRACK/SECTOR/DATA/ERROR ports
  at 30h–36h
- added READ 01h, WRITE 02h and RESET/CANCEL 7Fh
- added deterministic READY/DRQ/write-protect/error status and seven error
  outcomes including success
- made WRITE atomic at byte 128; partial transfer cancel leaves media intact
- made debug DATA peek non-consuming and trace-free
- clone-on-mount/export prevents retained host arrays mutating the medium
- controller RESET/POWER preserves mounted media and write-protect state
- attached a blank writable A: image to the normal first-class I/O Bus
- promoted A: from reserved UI row to online Virtual Disk A with inspector
- added one-page build integration and updated Technical Manual diagram/map
- added source, artifact, browser and exact device regression coverage

## Verification

All 20 package stages pass: PHASE1A–1J, PHASE2A/2A.1, BIOS/MON, keyboard,
pageable firmware, RAM handoff, execution pace, trace, block device, source,
one-page build/artifact and Technical Manual.

Block-device tests cover exact geometry, first/last sector, every defined error,
write protect, partial-write rollback, reset/media preservation, defensive
image copies, low-byte aliases, observer semantics and Bus trace attribution.
A real Z80 program writes and reads a sector with OTIR/INIR through the Bus.

Deterministic outputs:

- one-page: 191,394 bytes; SHA-256
  `1587f96e2f575e37343388332f09fa4356f04b9d8b605dfe1e9ac3da1ab19ce2`
- Technical Manual: 1,994,437 bytes / 1,780 encodings; SHA-256
  `8afb43404a8e93977dba7345bb48aba5056e9749c72cd4d6e9eb4930044a1ef4`

Browser plugin was absent. The existing Python smoke could not start because
the bundled Python runtime has no `playwright` module, so the already-bundled
Node Playwright drove installed Google Chrome without dependency changes.
At 1440×1000 and 390×844, the app powered on, opened I/O, selected A:, and
showed ONLINE, 77×26×128, 256,256 bytes, ports 30h–36h, A:0/1 and IDLE. The
manual system/map routes showed the new device and port table. Console
warnings/errors: 0; page errors: 0; network requests: 0; document overflow: 0.
Screenshots were visually inspected and the Device Dock remains legible at both
sizes.

`git diff --check` passes. CPU core/decoder/flags, System ROM, CG-ROM and DM-80
CSS have no diff.

## Accuracy boundary / next phase

Command/DRQ behavior is instruction-boundary functional accuracy. BUSY remains
clear; seek, rotation, WAIT, DMA, interrupt and persistence are not modeled.
There is no CBIOS, CP/M filesystem/system image or BASIC. The next phase is a
SHINO CBIOS sector adapter using these ports, first proven with original test
payloads before any license-audited CP/M import.
