# src/firmware/shino80

Firmware and ROM images owned by SHINO-80.

## Current firmware

- `shino80-system-rom.js` — 16 KiB firmware builder: fixed 8 KiB Boot/Recovery
  ROM plus 8 KiB Extension bank 0, with RESET/IPL, BIOS and Monitor
- `shino80-cgrom.js` — fixed 4 KiB character-generator ROM
- `shino80-cbios.js` — original RAM-resident CBIOS/WBOOT v0.2 image builder
- `shino80-cpm22.js` — pinned license-audited CP/M 2.2 44K CCP/BDOS image
- `shino80-system-disk.js` — original S80B v2 CP/M system-disk image builder

The minimum BIOS currently provides:

- `RST 08h` PUTCHAR
- `RST 10h` GETCHAR
- NEWLINE
- CLS
- zero-terminated PRINT_STRING

Monitor v0.3 accepts `H` / `?`, `C`, bounded `D start [end]`, diagnostic `R`,
seven-family `U start [end]`, v0.5 `B` RAM-handoff proof and `O` System Disk
boot. `O` validates sector 1, loads the original payload from sector 2 to 8000h
and CBIOS from sectors 3–8 to FA00h, then enters all-RAM mode. Serial, printer, application
GO/BREAK and interrupt/NMI service bodies remain reserved or unimplemented.

ROM BIOS PUTCHAR and RAM CBIOS CONOUT route ASCII BEL 07h to the original
one-bit beeper at I/O 40h. The DM-80 cursor is a non-destructive presentation
overlay over the existing ROM/CBIOS cursor pointer; it never changes VRAM.

CBIOS v0.2 WBOOT at FA03h reloads A: track 0 sector 2 to 8000h through its
ordinary READ path and jumps to the restored payload. Failure is reported by
the loaded CBIOS itself and HALTs. The restored payload reads the 44 CCP/BDOS
system sectors and returns to the CP/M command processor.

The current BIOS/MON executable remains in fixed ROM. Its compressed
disassembler tables live in Extension bank 0 at 2000h. The machine provides
64 KiB physical RAM beneath the ROM overlay; low I/O port 00h selects lower
RAM, shadow writes and the extension bank. RESET restores control 00h.

BIOS jump-table entry 011Eh copies a three-byte handoff trampoline to F800h,
pages firmware out and continues at an entry in 4000h–FFFFh. Success does not
return. F800h–F802h is reserved during handoff; RESET restores the recovery ROM.

No external commercial ROM image is embedded. The bundled CP/M 2.2 CCP/BDOS
comes from the pinned, licensed source recorded under `third_party/cpm22/`;
SHINO's loader, disk envelope and CBIOS remain original machine components.

The current CG-ROM is an original SHINO-80 bring-up font.
