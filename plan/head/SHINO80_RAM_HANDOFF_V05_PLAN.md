# SHINO-80 RAM handoff v0.5 plan

2026-09-26T11:25:00+09:00  
Branch `feature/shino80-ram-handoff-v05-20260926`  
Parent `9fd087b` / pageable firmware v0.4 PR #29.

## Goal

Prove the complete firmware-to-operating-system transition that future CP/M and
BASIC boot will depend on: prepare lower RAM while ROM remains visible, enter a
high-RAM trampoline, page the firmware out, and continue execution from a
64-KiB all-RAM map without fetching another instruction from ROM.

## Adopted boot contract

- add a stable `RAM_HANDOFF` BIOS entry
- input: `HL=entry address` in 4000h–FFFFh; `A=memory-control value` with
  `LOW_RAM=1`
- service copies a minimal `OUT (00h),A / JP (HL)` trampoline to F800h and
  transfers control to it
- the caller must load its RAM image and prepare page zero before handoff
- handoff never returns; RESET is the recovery path
- add Monitor `B` as a visible proof using an original built-in demo payload
- the demo prepares page-zero shadow RAM, enters full-RAM mode, writes a success
  signature and message without calling ROM BIOS, then HALTs

## Scope

- firmware API, relocated trampoline and Monitor boot-test command
- exact unit/integration tests proving instruction fetch after page-out comes
  from RAM, page-zero visibility, memory-control state, signature and HALT
- Monitor/manual help, memory/device observer text where necessary
- deterministic one-page and Technical Manual artifacts
- v0.5 spec, worklog and restart snapshot

## Non-goals

- no FDD/FDC or disk-image format yet
- no CP/M, CP/Mish, BBC BASIC or third-party binary/source import
- no warm boot, filesystem, CBIOS, ROM filesystem or general executable format
- no automatic extension-ROM application discovery
- no CPU core/decoder/flags, CG-ROM or display-rendering changes
- no merge or public deployment

## Accuracy and risks

The transition is instruction-accurate under the existing Bus model, not
electrical bus-cycle timing. The critical hazard is paging ROM out while the CPU
still needs to fetch the next instruction from it. The trampoline therefore
lives in high RAM before `OUT (00h),A`. Entry validation must reject lower-RAM
addresses rather than entering an unrecoverable fetch path.

The demo may write visible VRAM directly after page-out, but must not call any
ROM BIOS service. RESET must restore ROM-visible bank 0 and reboot MON.

## Verification

- test invalid lower entry is rejected without changing mapping
- trace exact RAM writes for the F800h trampoline
- prove shadow page-zero bytes remain hidden until LOW_RAM is set
- execute the real CPU through `OUT`, `JP (HL)`, demo payload and HALT
- assert final control value, page-zero vector, PC/HALT, RAM signature, VRAM
  text, and post-RESET return to the ROM Monitor
- run all existing CPU, firmware, UI and manual package stages
- offline Chrome desktop/mobile: run `B`, observe RAM boot result, inspect full
  RAM mapping, RESET and confirm ordinary MON returns
- `git diff --check` and non-target source review

## Success

The one-page machine visibly and reproducibly crosses from ROM-visible firmware
to an all-RAM program, continues without ROM services, and returns to the
normal ROM Monitor after RESET. The result is a reusable boot ABI for the next
virtual-disk/CBIOS phase, delivered as one logical commit and stacked PR.

## Completion — 2026-09-26

The handoff ABI, Monitor B proof, exact Bus/mapping tests, documentation and
license research are complete. Every package stage passes. Installed Chrome
desktop 1440×1000 and mobile 390×844 both show the RAM-only success display,
page zero `C3 00 80`, FULL RAM / control 01h, and RESET recovery to Boot ROM.
The Technical Manual BIOS chapter passes both viewports. Console warnings and
errors, external network requests and document overflow are all zero. Commit,
push and stacked PR are the remaining delivery steps; merge is not authorized.
