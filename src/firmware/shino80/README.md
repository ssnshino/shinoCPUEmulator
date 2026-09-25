# src/firmware/shino80

Firmware and ROM images owned by SHINO-80.

## Current firmware

- `shino80-system-rom.js` — 8 KiB SYSTEM ROM builder with RESET/IPL,
  BIOS vectors and jump table, polling GETCHAR, and the interactive Monitor
- `shino80-cgrom.js` — fixed 4 KiB character-generator ROM

The minimum BIOS currently provides:

- `RST 08h` PUTCHAR
- `RST 10h` GETCHAR
- NEWLINE
- CLS
- zero-terminated PRINT_STRING

The first Monitor command loop accepts `H` / `?` for help, `C` for clear, and
carriage return for a new prompt. Memory/register commands, disk, serial,
printer, interrupts, and NMI services remain reserved and unimplemented.

No external commercial ROM image is embedded.

The current CG-ROM is an original SHINO-80 bring-up font.
