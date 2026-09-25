# SHINO-80 MINIMUM BIOS + MONITOR FOUNDATION WORKLOG

Date: 2026-09-25
Status: INTEGRATION CANDIDATE COMPLETE

## Source of truth

- reviewed `main`: `d46de4e460a148c2d52a3024cc0767e48e5a1d64`
- parallel CG-ROM / DM-80 branch:
  `feature/shino80-cgrom-native8x16-dm80-20260925`
- stacked base:
  `52edcafa9a76702b8b22fcd69a26a527488959d0`
- BIOS branch:
  `feature/shino80-minimum-bios-monitor-20260925`

The BIOS branch was intentionally stacked on the supplied CG-ROM / DM-80 head
because that branch already updates the PHASE 2A.1 regression and generated
artifact. No BIOS PR is opened until the CG-ROM / DM-80 branch reaches `main`.

## Implemented

- added an internal SYSTEM ROM label/fixup builder
- moved executable IPL code to `0200h`
- installed RESET, RST, IM1-reserved, and NMI-reserved vectors
- installed the BIOS v0.1 jump table at `0100h`
- implemented `RST 08h` PUTCHAR
- implemented NEWLINE at `0103h`
- implemented CLS at `0106h`
- implemented zero-terminated PRINT_STRING at `0109h`
- reserved `E000h-E002h` as the minimum BIOS cursor work area
- routed the IPL clear and boot banner through BIOS public entries
- retained the existing A-H full-screen VRAM diagnostic
- retained the visible four-line IPL result
- retained a non-interactive Monitor `*` prompt and wait loop

## Key decisions

- reserved future vectors return through an explicit stub; they do not claim
  device support
- the public CALL table uses fixed three-byte JP slots so implementations can
  move within ROM
- PUTCHAR and NEWLINE wrap after `C7CFh`
- CLS clears the existing eight-page range `C000h-C7FFh`
- BIOS output remains real Z80 -> Bus -> TEXT VRAM activity
- no CPU, Bus, CG-ROM, video, UI, CSS, or deploy source was changed

## Verification

PASS:

- `node --check src/firmware/shino80/shino80-system-rom.js`
- `node --check tests/shino80_minimum_bios_monitor.test.cjs`
- Z80 NOP and PHASE 1A-1E regression tests
- PHASE 2A VIDEO + IPL regression
- PHASE 2A.1 POWER / RESET / CRT / DISPLAY regression
- minimum BIOS vector / call / register / stack / cursor unit tests
- source static syntax test
- stacked-base artifact static test
- in-memory one-page composition and eight inline-script syntax checks
- Chrome in-memory one-page boot to `MONITOR_LOOP=0220h`
- `git diff --check`

Observed deterministic boot state:

```text
instructions before Monitor loop: 13,976
PC: 0220h
SP: F000h
boot display:
SHINO-80 IPL
VIDEO OK
MON
*
```

## Final integration — 2026-09-25

CG-ROM / DM-80 PR #14 merged first as required.

- reviewed CG-ROM / DM-80 head:
  `e04a951183fa6eb429cf61bcfd3d9655bea883b2`
- CG-ROM / DM-80 merge commit:
  `6d46743d6efac93a66ad79a61515e6adfc6e8ff1`
- BIOS branch updated from that `main`: PASS / no conflict
- BIOS test added to the package test chain
- browser smoke Monitor target updated from legacy `009Ch` to `0220h`
- canonical one-page artifact regenerated with final CG-ROM and BIOS
- generated artifact SHA-256:
  `a059110e7599e7252ec5b419dee1d2c2c31d84d1b4e0e59002043d260e78d33c`
- repeat build produced the same artifact SHA-256
- final Chrome smoke reached `PC=0220h` with DM-80 AA mode active

Root README and restart snapshots remain a post-merge closeout item so they can
record the exact reviewed `main` commit.

## Remaining work

- merge review of the v0.1 BIOS ABI
- keyboard device and GETCHAR design
- interactive Monitor command PLAN
- device BIOS services after their hardware contracts exist
- interrupt/NMI services after CPU interrupt closeout
