# SHINO-80 PHASE 2A — MINIMUM VIDEO + IPL PLAN

Status: CANDIDATE
Version: v0.0.7

## Gate

Produce the first CRT output caused entirely by Z80 execution.

## Hardware

1. 8 KiB SYSTEM ROM at 0000h-1FFFh
2. 80x25 TEXT VRAM at C000h
3. 4 KiB 8x16 CG-ROM
4. TEXT VIDEO renderer
5. real CRT canvas replacing the placeholder display

## IPL

RESET starts at 0000h.

IPL:
- initializes SP to F000h
- writes fixed bring-up strings to TEXT VRAM
- enters MONITOR_LOOP

## Non-goals

- keyboard input
- interactive monitor commands
- BIOS PUTCHAR routine
- attribute VRAM / color
- cursor hardware
- video bus contention
- FDD boot

## Human test

Open v0.0.7.

At VISUAL pace press RUN and watch the IPL text appear from blank VRAM.

CPU, BUS and MEMORY views remain available for observation.
