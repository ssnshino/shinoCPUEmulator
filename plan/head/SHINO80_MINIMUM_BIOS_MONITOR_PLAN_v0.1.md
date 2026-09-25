# SHINO-80 MINIMUM BIOS + MONITOR FOUNDATION PLAN v0.1

Created: 2026-09-25T21:45:00+09:00
Status: IMPLEMENTATION CANDIDATE

## Goal

Replace the PHASE 2A inline boot-message writer with the first original
SHINO-80 BIOS calling convention while preserving the visible IPL result.

The Z80 must execute every BIOS routine through SYSTEM ROM and write every
character through the existing Bus -> TEXT VRAM path.

## Baseline

- reviewed `main`: `d46de4e460a148c2d52a3024cc0767e48e5a1d64`
- stacked integration base: CG-ROM / DM-80 candidate
  `52edcafa9a76702b8b22fcd69a26a527488959d0`
- SYSTEM ROM: `0000h-1FFFh`, CPU write protected
- TEXT VRAM: `C000h-C7CFh`, 80 x 25
- SYSTEM RAM candidate: `E000h-FFFFh`

## ROM layout

```text
0000  RESET vector -> IPL entry
0008  RST 08 -> BIOS PUTCHAR
0010  GETCHAR reserved
0018  DISK READ reserved
0020  DISK WRITE reserved
0028  SERIAL I/O reserved
0030  PRINTER OUTPUT reserved
0038  IM1 reserved
0066  NMI reserved

0100  BIOS jump table
      +00 PUTCHAR
      +03 NEWLINE
      +06 CLS
      +09 PRINT_STRING

0200  IPL implementation
```

Reserved vectors return without pretending that their future device function
already exists.

## BIOS work area

```text
E000-E001  cursor TEXT VRAM pointer
E002       cursor column, 0-79
```

This is a provisional three-byte SYSTEM RAM ABI owned by the minimum BIOS.

## Initial BIOS calls

### PUTCHAR

- input: `A` = character
- printable bytes write to the current TEXT VRAM cursor and advance it
- `0Dh` performs carriage return
- `0Ah` advances to the next row
- the cursor wraps from `C7CFh` to `C000h`
- preserves `AF`, `BC`, and `HL`

### NEWLINE

- advances to the first column of the next row
- wraps after row 24
- preserves `AF`, `BC`, and `HL`

### CLS

- clears `C000h-C7FFh`, including the current reserved tail
- resets the cursor to `C000h`, column 0
- preserves `AF`, `BC`, and `HL`

### PRINT_STRING

- input: `HL` = zero-terminated byte string
- emits each byte through `RST 08h`
- returns with `HL` at the terminator
- clobbers `AF` and `HL`; preserves `BC` and `DE`

## IPL / Monitor behavior

The existing display-page diagnostic remains.

After the diagnostic hold, IPL calls BIOS `CLS` and `PRINT_STRING` to produce:

```text
SHINO-80 IPL
VIDEO OK
MON
*
```

Execution then enters a non-interactive Monitor wait loop. Keyboard input and
command parsing remain future work.

## Change scope

- `src/firmware/shino80/shino80-system-rom.js`
- new BIOS-focused unit test
- existing IPL tests only where ROM addresses or execution counts changed
- BIOS SPEC and WORKLOG

## Non-goals

- CG-ROM glyphs or generation
- DM-80 renderer, antialiasing, phosphor, CSS, or UI
- generated `deploy/*.html`
- README, snapshot, or package-script integration
- keyboard device or `GETCHAR`
- interactive Monitor commands
- FDD, serial, printer, interrupt, or NMI implementation
- CPU core, decoder, flags, Bus, or memory-map implementation changes

## Accuracy level

- functional BIOS ABI
- real Z80 instruction execution
- real CPU Bus writes into TEXT VRAM
- instruction-level deterministic tests
- no claim of cycle-perfect firmware or final hardware ABI

## Regression risks

- moving RESET/IPL code changes ROM labels and instruction count metadata
- a wrong jump-table address could silently break future callers
- cursor arithmetic could write into reserved VRAM or outside the screen
- BIOS stack use must return SP to its caller-visible value

## QA

1. verify vector and jump-table bytes
2. execute each BIOS call from RAM through the Z80 core
3. verify register preservation and stack restoration
4. verify TEXT VRAM writes are CPU Bus events
5. verify row advance and screen wrap
6. run PHASE 2A / 2A.1 regressions
7. run the full existing Node regression set
8. confirm CG-ROM, video, UI, CPU, Bus, and deploy files are unchanged by the
   BIOS commit relative to the stacked base

## Success conditions

- IPL reaches the Monitor wait loop and preserves the existing four-line boot
  display
- the display was produced through BIOS calls, not JavaScript UI writes
- PUTCHAR / NEWLINE / CLS / PRINT_STRING pass unit tests
- reserved vectors remain explicitly unimplemented
- all existing source-level regressions pass
- the BIOS diff does not overlap the CG-ROM / DM-80 implementation files

## Commit point

Commit and push one logical BIOS foundation change only after implementation,
SPEC, WORKLOG, and all source-level regressions pass. Do not open the BIOS PR
until the stacked CG-ROM / DM-80 branch has merged into `main`.
