# SHINO-80 KEYBOARD + INTERACTIVE MONITOR FOUNDATION WORKLOG

Date: 2026-09-26
Status: IMPLEMENTATION CANDIDATE COMPLETE / HUMAN MOBILE QA PASS

## Source of truth

- reviewed base `main`: `d86b5d07cf6222c7618a46323ddbe520a1a39e39`
- branch: `feature/shino80-keyboard-monitor-20260926`
- PLAN: `plan/head/SHINO80_KEYBOARD_INTERACTIVE_MONITOR_PLAN_v0.1.md`

## Implemented

- dedicated 64-byte SHINO Keyboard FIFO
- low-byte-decoded KEY_DATA `20h` and KEY_STATUS `21h`
- READY and OVERRUN status
- debugger-safe non-consuming port peek
- generic but narrow Bus I/O-device attachment boundary
- `RST 10h` and `CALL 010Ch` BIOS GETCHAR
- real Z80 polling through `IN A,(n)`
- ROM Monitor `H` / `?`, `C`, CR and unknown-command paths
- lower-case `h` / `c` normalization
- desktop physical-keyboard transport
- More-sheet KEYBOARD action and tappable DM-80 input activation
- mobile-capable dedicated text input transport
- compact Keyboard Mode driven by input focus and Visual Viewport height
- automatic toolbar / bottom-navigation restoration on input blur
- Keyboard entry in Device Dock / Inspector
- self-contained data favicon to keep HTTP preview console clean
- one-page builder integration and regenerated artifact

## Architecture decisions

- JavaScript may enqueue host bytes but never executes Monitor commands.
- CPU I/O reads are the only consuming Keyboard path.
- Debugger observation does not consume queued input.
- The controller decodes the low port byte while Bus trace preserves the full
  16-bit Z80 I/O address.
- Unclaimed I/O ports retain the PHASE 1E latch behavior.
- The initial Monitor uses immediate commands so the first vertical slice stays
  deterministic; line editing and address parsing are deferred.
- CPU core, decoder and flags are unchanged.

## Verification

PASS:

- source syntax for Bus, Keyboard, firmware, app and tests
- FIFO order / empty / overrun / reset
- non-consuming debugger peek
- `AB20h` low-byte decode with full-address trace
- unclaimed I/O port regression
- BIOS GETCHAR wait and return ABI
- Monitor `H`, `C`, unknown and CR integration through TEXT VRAM
- Z80 NOP and PHASE 1A-1E regression
- PHASE 2A / PHASE 2A.1 regression
- existing Minimum BIOS regression
- v0.0.9 source static test
- one-page build and artifact static test
- generated artifact reproducibility
- Python browser-smoke syntax
- `git diff --check`

Real Chrome QA:

- desktop viewport: 1440x900 PASS
- compact viewport: 390x844 PASS
- keyboard Visual Viewport: 390x560 PASS
- DM-80 bounds in Keyboard Mode: x=13 / y=138.5 / 364x283, fully visible
- toolbar / bottom navigation hidden on focus: PASS
- toolbar / bottom navigation restored on blur: PASS
- POWER / MAX boot to GETCHAR polling PASS
- More -> KEYBOARD focus PASS
- `h` -> DM-80 HELP rendering PASS
- horizontal overflow: none
- console errors: 0
- console warnings: 0

Generated artifact SHA-256:

`dd2ccd28baa2c382e4fbc5b7559f13b6ad36cea17b3916676477f761293f631f`

## Environment note

The bundled Codex runtime contains Node and pnpm but no npm executable.
`pnpm test` therefore reached the repository's internal `npm run` chain and
stopped before tests. The same package scripts were executed individually in
the exact declared order through `pnpm run`, with the bundled Node added to
PATH; all passed. No package script was changed for this host-only condition.

## Human mobile QA

Initial iPhone QA: **PASS**. Human confirmed that the soft keyboard appears and
the ROM Monitor accepts input.

Human screenshots then showed that ordinary shell controls consumed useful
space above the keyboard. A follow-up Keyboard Mode now hides those controls
and centers the complete DM-80, matching the Human-proposed second screenshot.

Final real-device result on the same iPhone / Microsoft Edge path:

> **PASS — 「okいけた!!」**

The soft keyboard, ROM Monitor input, Keyboard Mode layout, complete DM-80
visibility, and ordinary-shell restoration are Human-approved.

The implementation may now be closed as one logical local commit. Push / PR /
merge remain separate Human-authorized steps.
