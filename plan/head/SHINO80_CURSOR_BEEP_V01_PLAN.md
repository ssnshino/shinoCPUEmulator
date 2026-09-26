# SHINO-80 Cursor / BEEP v0.1 PLAN

Date: 2026-09-26
Parent: CP/M 2.2 boot v0.1 `4084d0e` / PR #35

## Goal

Make the ROM Monitor and CP/M console feel like a complete terminal by showing
the current text cursor on DM-80 and sounding an audible short BEEP for ASCII
BEL (`07h`). Keep both features observable through existing machine state and
the I/O Bus instead of hiding terminal behavior in DOM-only shortcuts.

## Design

### Cursor

- Render a non-destructive 8×2-pixel underline inside the current 80×25 cell.
- ROM mode reads the existing BIOS cursor pointer at E000h–E001h.
- all-RAM/CP/M mode reads the loaded CBIOS cursor pointer from its generated
  label address.
- blink phase derives from CPU T-states at the 4 MHz design clock: 0.5 second
  on / 0.5 second off. Pausing the virtual CPU freezes the phase.
- the cursor is a DM-80 presentation overlay and never writes into text VRAM.

### BEEP

- Reserve low I/O port `40h` for an original SHINO one-bit beeper trigger.
- ROM BIOS PUTCHAR and RAM CBIOS CONOUT route BEL (`07h`) to `OUT (40h),A`
  without placing the control code in VRAM.
- A small Bus device records trigger count, last value and active state.
- The browser presentation observes the device and generates a short 880 Hz
  square-wave envelope through Web Audio after the user's POWER gesture.
- More exposes a BEEP TEST hardware check so touch-only devices can trigger
  the same beeper without requiring a physical Control key.
- More exposes an explicit REFERENCE link to the separately published manual.
- Audio unavailability must not affect CPU/device execution or boot.

## Scope

- text-video cursor presentation and exact redraw behavior
- beeper I/O device, ROM/CBIOS BEL routing and Bus trace
- one-page integration, Device inspector and Technical Manual updates
- cursor/beeper unit, firmware, CP/M and browser regressions

## Non-goals

- no PSG, melody, volume UI, sampled audio or mechanical speaker emulation
- no keyboard click and no automatic error tones not emitted by firmware/CP/M
- no CPU, decoder, flag, disk format, CCP or BDOS semantic changes
- no merge or public deployment

## Risks

- stale cursor pixels when the address or blink phase changes
- browser autoplay restrictions and missing AudioContext
- CBIOS growth beyond five reserved sectors
- changing fixed ROM addresses or system-track offsets

CBIOS may grow into a sixth 128-byte sector. If so, S80B v2 will use sectors
3–8 for CBIOS and sectors 9–26 plus track 1 sectors 1–26 for the 44 CP/M
sectors; the existing DPB `OFF=2` still reserves the exact two tracks.

## QA

- cursor draws, moves, blinks and restores the old cell without VRAM mutation
- BEL creates one Bus-visible write to beeper port and no visible glyph
- ROM BIOS and CBIOS preserve their documented register contracts
- cold CP/M boot, `DIR`, direct BEL and destructive WBOOT remain functional
- deterministic source/standalone/manual builds
- installed Chrome desktop/mobile: visible cursor, audio trigger state,
  console health, no network request and no horizontal overflow

## Success

At MON `*` and CP/M `A>` the next input position has a visible blinking
underline. Emitting BEL through either console path triggers the SHINO beeper
port and, where browser audio is available, one short audible tone.
