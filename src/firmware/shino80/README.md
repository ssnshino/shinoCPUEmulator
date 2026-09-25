# src/firmware/shino80

Firmware and ROM images owned by SHINO-80.

## Current firmware

- `shino80-system-rom.js` — 8 KiB SYSTEM ROM builder with RESET/IPL,
  BIOS v0.1 vectors and jump table, and the non-interactive Monitor wait loop
- `shino80-cgrom.js` — fixed 4 KiB character-generator ROM

The minimum BIOS currently provides:

- `RST 08h` PUTCHAR
- NEWLINE
- CLS
- zero-terminated PRINT_STRING

GETCHAR, interactive Monitor commands, disk, serial, printer, interrupts, and
NMI services remain reserved and unimplemented.

No external commercial ROM image is embedded.

The current CG-ROM is an original SHINO-80 bring-up font.
