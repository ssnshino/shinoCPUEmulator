# src/firmware/shino80

Firmware and ROM images owned by SHINO-80.

## Current firmware

- `shino80-system-rom.js` — 16 KiB firmware builder: fixed 8 KiB Boot/Recovery
  ROM plus 8 KiB Extension bank 0, with RESET/IPL, BIOS and Monitor
- `shino80-cgrom.js` — fixed 4 KiB character-generator ROM

The minimum BIOS currently provides:

- `RST 08h` PUTCHAR
- `RST 10h` GETCHAR
- NEWLINE
- CLS
- zero-terminated PRINT_STRING

Monitor v0.3 accepts `H` / `?`, `C`, bounded `D start [end]`, diagnostic `R`,
seven-family `U start [end]`, and v0.5 `B` RAM-handoff proof. Disk, serial, printer, application GO/BREAK,
and interrupt/NMI service bodies remain reserved or unimplemented.

The current BIOS/MON executable remains in fixed ROM. Its compressed
disassembler tables live in Extension bank 0 at 2000h. The machine provides
64 KiB physical RAM beneath the ROM overlay; low I/O port 00h selects lower
RAM, shadow writes and the extension bank. RESET restores control 00h.

BIOS jump-table entry 011Eh copies a three-byte handoff trampoline to F800h,
pages firmware out and continues at an entry in 4000h–FFFFh. Success does not
return. F800h–F802h is reserved during handoff; RESET restores the recovery ROM.

No external commercial ROM image is embedded.

The current CG-ROM is an original SHINO-80 bring-up font.
