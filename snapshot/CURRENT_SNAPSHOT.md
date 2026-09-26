# CURRENT SNAPSHOT
## ONE-PAGE Z80 COMPUTER / SHINO-80

Latest override 2026-09-26: feature/shino80-realtime-pace-20260926, parent
6707ace / PR #19 (MON Human PASS). REALTIME default / VISUAL / TURBO, actual
MHz, bounded host slices and hidden-page suspension. See REALTIME_PACE plan
and worklog, EXECUTION_PACE_v0.1 spec. No CPU/Bus/ROM changes. Speed candidate
mobile QA pending; PR #18/#19 remain unmerged. Older overrides follow.

## Active candidate override — 2026-09-26T01:45:00+09:00

Current branch: `feature/shino80-monitor-lines-dump-20260926`.
Parent: Memory Inspector `f0903e0`, PR #18 (unmerged, Human mobile PASS).
Reviewed main includes keyboard PR #17 at `f6444c6`.
Current plan/spec/worklog: `SHINO80_MONITOR_CONSOLE_V2_PLAN.md`,
`SHINO80_MONITOR_CONSOLE_v0.2.md`, `SHINO80_MONITOR_CONSOLE_V2_WORKLOG.md`
in their respective head directories. GETLINE, Backspace, scroll and D xxxx
are implemented; every command now needs Enter. CPU and CG-ROM unchanged.
Next: Human mobile QA, then explicit merge authorization; do not merge by default.
Remaining text below records the earlier foundation baseline.

Last updated: 2026-09-25T23:58:41+09:00

## Reviewed runtime baseline

- runtime baseline before this documentation closeout:
  `b5b0aa8f73a772e27f86960bb24fb058057bb77d`
- CG-ROM / DM-80: merged via PR #14
- Minimum BIOS / Monitor foundation: merged via PR #15
- canonical source: reviewed GitHub `main`
- canonical artifact:
  `deploy/one_page_shino80_v0.0.9_z80_base_complete.html`

## CPU status

```text
BASE decode slots       256 / 256
BASE non-prefix execute 252 / 252
External oracle         252 / 252 opcodes
Unique oracle cases     252,000 / 252,000 PASS
Failure                 0
Prefix entry points     CB DD ED FD
```

PHASE 1F CB execution is not implemented yet.

## Display status

- original native 8 x 16 CG-ROM
- 4096 bytes / 256 glyphs x 16 bytes
- CG-ROM SHA-256:
  `78ad2a69fce15801f07766b05f1f9cd9179eb7e974fb22d7f83e22e2d34dd194`
- CG-ROM CRC32: `659A7798`
- native / integer enlargement: pixel-perfect
- reduction / non-integer scaling: gentle AA
- scanline / phosphor: DM-80 presentation layer
- Human visual QA: PASS

## Firmware status

- SYSTEM ROM: `0000h-1FFFh`, 8 KiB, CPU write protected
- RESET: `0000h` -> IPL at `0200h`
- `RST 08h`: PUTCHAR
- BIOS jump table: `0100h`
- implemented: PUTCHAR / NEWLINE / CLS / PRINT_STRING
- BIOS work area: `E000h-E002h`
- Monitor loop: `0220h`
- Monitor interaction: not implemented

Reserved and unimplemented:

- GETCHAR / keyboard input
- disk / serial / printer BIOS
- interrupt / NMI service bodies
- interactive Monitor commands

## Final integration QA

- full Z80 PHASE 1A-1E regression: PASS
- PHASE 2A / 2A.1 regression: PASS
- minimum BIOS unit test: PASS
- source syntax / build / artifact test: PASS
- generated artifact reproducibility: PASS
- final Chrome CG-ROM + DM-80 + BIOS smoke: PASS
- final Monitor PC: `0220h`

## Operating decision

Do not resume concurrent implementation on multiple environments.

Choose one next task and one active environment, then keep a single writer until
that branch is complete and merged.

Candidate next tasks:

1. Z80 PHASE 1F — all 256 CB second-byte encodings
2. Keyboard device + GETCHAR + interactive Monitor PLAN

Neither candidate is automatically authorized by this snapshot.
