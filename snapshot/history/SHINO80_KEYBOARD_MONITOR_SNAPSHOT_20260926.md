# SHINO-80 KEYBOARD + INTERACTIVE MONITOR SNAPSHOT — 2026-09-26

Status: IMPLEMENTATION CANDIDATE COMPLETE / HUMAN MOBILE QA PASS

## Resume goal

Local implementation and Human QA are complete. Resume by verifying the branch
HEAD and clean state, then prepare push / PR only when authorized.

## Source of truth

- reviewed base: `main` at `d86b5d07cf6222c7618a46323ddbe520a1a39e39`
- active branch: `feature/shino80-keyboard-monitor-20260926`
- plan: `plan/head/SHINO80_KEYBOARD_INTERACTIVE_MONITOR_PLAN_v0.1.md`
- spec: `docs/head/SHINO80_KEYBOARD_INTERACTIVE_MONITOR_SPEC_v0.1.md`
- worklog: `working-logs/head/SHINO80_KEYBOARD_INTERACTIVE_MONITOR_WORKLOG.md`
- artifact: `deploy/one_page_shino80_v0.0.9_z80_base_complete.html`

## Completed

- Keyboard FIFO and I/O ports `20h` / `21h`
- Bus-attached device routing with debugger-safe peek
- BIOS GETCHAR at RST `10h` and jump-table `010Ch`
- interactive ROM Monitor commands `H` / `?`, `C`, CR and unknown
- physical and soft-keyboard browser transport
- compact Keyboard Mode centers the complete DM-80 in the Visual Viewport
- desktop and compact real-Chrome automation
- complete source / CPU / machine / BIOS / artifact regression
- reproducible artifact SHA-256:
  `dd2ccd28baa2c382e4fbc5b7559f13b6ad36cea17b3916676477f761293f631f`

## Human QA status

- soft keyboard appearance: PASS
- ROM Monitor `h` input and HELP output: PASS
- revised Keyboard Mode layout: PASS

Human final result:

> **PASS — 「okいけた!!」**

## Critical rules

- use one active writer and this branch only
- do not change CPU core, decoder or flags
- do not hand-edit `deploy/*.html`; rebuild from source
- browser JavaScript transports bytes only; command behavior stays in ROM
- do not update global merged status until review / merge

## Remaining

- push / PR when explicitly authorized
