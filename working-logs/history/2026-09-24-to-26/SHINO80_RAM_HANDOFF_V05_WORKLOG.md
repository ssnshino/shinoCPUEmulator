# SHINO-80 RAM handoff v0.5 worklog

## Scope

Branch `feature/shino80-ram-handoff-v05-20260926`, parent `9fd087b` / PR #29.
Prove firmware-to-all-RAM execution before designing FDD or importing CP/M/BASIC.

## Implementation

- added stable BIOS jump-table entry 011Eh `RAM_HANDOFF`
- added validated, non-returning F800h trampoline
- added Monitor `B` diagnostic using shadow page-zero construction
- added original RAM-only payload at 8000h, `R80!` signature and direct VRAM
  status display
- added tests for rejected entry, exact post-pageout opcode fetch, absence of
  later ROM fetches, full demo state and RESET recovery
- documented the adopted CP/M/BBC BASIC licensing direction without importing
  third-party material

## Verification

Every package stage passes: PHASE1A–1J, PHASE2A/2A.1, BIOS/MON, keyboard,
pageable firmware, RAM handoff, execution pace, trace, source, artifact and
Technical Manual. Deterministic outputs: one-page 182,679 bytes; Technical
Manual 1,992,877 bytes / 1,780 encodings.

Browser plugin was unavailable, so installed Google Chrome was driven using
the bundled Playwright without installing dependencies. At 1440×1000 and
390×844, the browser flow powered on, typed B through the real keyboard FIFO,
rendered `SHINO-80 RAM BOOT` / `ALL 64K RAM ONLINE`, showed page zero
`C3 00 80`, FULL RAM and control 01h, then Reset restored BOOT + EXT ROM and
control 00h. The Technical Manual BIOS/RAM_HANDOFF content passed both sizes.
Console errors/warnings: 0; network requests: 0; document overflow: 0.

Screenshots were visually inspected. Desktop and mobile RAM-boot displays and
the mobile page-zero Memory Inspector are legible. `git diff --check` passes;
CPU core/decoder/flags, CG-ROM and display CSS have no diff.

## Boundaries / next phase

No disk, CP/M, BASIC or CBIOS is present. F800h–F802h is transient reserved
boot scratch. The next implementation phase starts with a virtual block-device
contract and disk geometry, not with third-party software import.
