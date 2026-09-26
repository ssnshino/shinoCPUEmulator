# SHINO-80 Cursor / BEEP v0.1

Date: 2026-09-26

## Result

The DM-80 console has a visible blinking underline cursor and SHINO-80 has an
original one-bit beeper device. Both features follow machine state rather than
being painted as unrelated DOM decoration.

## Cursor contract

- glyph cell: 8 x 16 pixels
- cursor shape: bottom two rows of the current cell
- blink: 0.5 seconds on / 0.5 seconds off at the 4 MHz design clock
- ROM mode pointer: BIOS work word at E000h
- all-RAM mode pointer: generated `CBIOS_CURSOR` address
- paused CPU: blink phase freezes with CPU T-state time
- VRAM: never modified by the cursor overlay

The renderer restores the previous cell before moving or hiding the cursor, so
no underline is left behind. Power-off and out-of-range pointers hide it.

## Beeper contract

| Item | Value |
|---|---|
| low I/O port | 40h |
| trigger | any OUT to 40h |
| firmware control code | ASCII BEL 07h |
| browser presentation | 880 Hz square wave, about 80 ms |
| observable state | last value, trigger count, sequence |

ROM BIOS PUTCHAR and RAM CBIOS CONOUT detect BEL before VRAM output and issue
`OUT (40h),A`. The Bus records the write and the device increments its count.
The browser observes the sequence and attempts Web Audio only after the POWER
gesture. Missing, blocked or failing audio APIs do not affect the CPU or device.

Physical-keyboard Ctrl+G enqueues BEL to the guest. More -> BEEP TEST directly
exercises the beeper for touch-only devices; it is explicitly a panel hardware
test, not guest program execution.

More -> REFERENCE opens the separately published SHINO-80 Technical Manual at
the hidden Shinomiya Daihanten preview route. The machine remains one-file and
offline-capable; no manual resource is fetched until the user follows the link.

## System disk layout adjustment

BEL support grows CBIOS to 645 bytes at FA00h-FC84h. S80B v2 therefore uses:

- track 0 sector 1: header
- track 0 sector 2: 98-byte loader
- track 0 sectors 3-8: six CBIOS sectors
- track 0 sectors 9-26 and track 1 sectors 1-26: 44 CP/M sectors

This still fits exactly inside the two tracks reserved by DPB `OFF=2`; CCP,
BDOS, directory and data semantics are unchanged.

## Limits

- this is a one-bit event beeper, not a programmable sound generator
- browser tone volume and audibility depend on host audio policy and hardware
- there is no keyboard click, mixer, melody or sampled/mechanical speaker model
- cursor timing is instruction-time presentation, not CRT beam timing
