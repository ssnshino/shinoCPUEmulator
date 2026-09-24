# SHINO-80 PHASE 2A — MINIMUM VIDEO + IPL RESEARCH NOTE

Created: 2026-09-24

## Purpose

Make the first visible pixels produced by the SHINO-80 machine itself.

The browser must not print the boot banner directly.

The required causal chain is:

```text
Z80
 -> SYSTEM ROM / IPL
 -> CPU memory write
 -> TEXT VRAM
 -> TEXT VIDEO DEVICE
 -> CG-ROM
 -> CRT pixels
```

## Memory / device draft used in PHASE 2A

- SYSTEM ROM: 0000h-1FFFh / 8 KiB
- TEXT VRAM start: C000h
- text geometry: 80 x 25
- visible text cells: 2000 bytes / C000h-C7CFh
- CG-ROM: 256 glyphs x 16 bytes = 4096 bytes
- glyph geometry: 8 x 16

CG-ROM is outside the Z80 CPU address space in this phase.

## ROM semantics

`bus.load()` is treated as the external ROM programmer / machine construction path.

CPU writes into 0000h-1FFFh are blocked and traced as:

`ROM_WRITE_BLOCKED`

Debugger POKE remains an external observer/programmer operation.

## CG-ROM

PHASE 2A carries an original SHINO-80 5x7 bring-up font expanded to 8x16.

The fixed CG-ROM contains uppercase Latin letters, digits and basic monitor punctuation.

No existing commercial-machine font ROM is used.

## VIDEO scan model

The VIDEO DEVICE reads TEXT VRAM through observer-style memory access and does not yet generate bus contention or VIDEO_READ events.

This is deliberate PHASE 2A scope control.

Later accuracy work may model:
- video fetch cycles
- contention / wait states
- attribute VRAM
- cursor hardware
- programmable character RAM

## IPL bring-up banner

The ROM program executes real currently-supported Z80 opcodes and writes:

```text
SHINO-80 IPL
VIDEO OK
MON
*
```

Then enters a self-jump monitor placeholder loop.

The star prompt is visible but keyboard command processing is not implemented yet.
