# CURRENT SNAPSHOT
## ONE-PAGE Z80 COMPUTER / SHINO-80

LATEST 2026-09-26T11:34:31+09:00: RAM handoff v0.5 candidate on
`feature/shino80-ram-handoff-v05-20260926`, parent `9fd087b` / PR #29. Read the
matching plan/spec/license research/worklog. BIOS 011Eh copies an
`OUT (00h),A / JP (HL)` trampoline to F800h and performs a non-returning switch
to all-RAM execution. MON B prepares shadow page zero, runs an original payload
at 8000h, displays RAM BOOT / ALL 64K RAM ONLINE without ROM BIOS and HALTs.
RESET restores ROM-visible bank 0 and MON. Full package plus offline Chrome
desktop/mobile app/manual QA PASS. No disk, CBIOS, CP/M or BASIC is included;
next phase is virtual block-device contract and geometry. CPU core/decoder/
flags, CG-ROM and display CSS unchanged. Commit/push/stacked PR remain. No merge
or public deploy. Older snapshots below are historical.

LATEST 2026-09-26T11:05:32+09:00: pageable firmware v0.4 candidate on
`feature/shino80-pageable-firmware-v04-20260926`, parent `d3f223e`. Read the
matching plan/spec/research/worklog. Physical RAM is 64 KiB; RESET exposes fixed
Boot ROM 0000h–1FFFh plus Extension ROM bank 0 at 2000h–3FFFh. Low I/O port 00h
controls LOW_RAM, SHADOW_WRITE and EXT_BANK; RESET restores 00h. BIOS/MON v0.3
behavior is preserved and its compressed disassembler tables moved to extension
ROM. Full package and offline Chrome desktop/mobile QA PASS. No CPU semantics,
CG-ROM or display rendering changed. No BASIC/CP/M/FDD/loader, public deploy or
merge. Commit/push/stacked PR are the remaining delivery steps. Older snapshots
below are historical.

LATEST 2026-09-26: feature/shino80-bios-monitor-v03-20260926, parent af6c933.
Read SHINO80_BIOS_MONITOR_V03 plan/worklog and BIOS_MONITOR_v0.3 spec. ROM MON
now supports D start [end], R and full-family U start [end], with bounded visible
limits. BIOS adds PARSE_HEX16 0118h and DISASM_ONE 011Bh. All1,780 standard
forms, package regression and offline Chrome desktop/mobile PASS. CPU/Bus/
CG-ROM/UI unchanged. ROM ends1FF6h, only nine trailing bytes; decide layout
before further BIOS growth. Human review and explicit merge GO remain. No public
deployment. Older snapshots below are historical.

LATEST 2026-09-26: feature/shino80-technical-manual-20260926,
parent fa73816 / PR #27. Separate standalone manual, no CPU/ROM changes.
Read SHINO80_TECHNICAL_MANUAL plan/spec/worklog. Open
deploy/shino80_technical_manual_v0.1.html; all package stages and offline Chrome
1440×1000 /390×844 interactions PASS. 1,780 encoding inventory, logical diagram,
maps/BIOS/MON,256-glyph atlas. No public hosting, no merge. Real iPhone QA and
Human review of PR stack remain; next implementation can resume MON expansion
only after scope agreement. Older snapshots below are historical.

CURRENT 2026-09-26T09:10:24+09:00: feature/shino80-z80-accuracy-closeout-20260926,
parent d8d30bc / PR #25. PHASE1J instruction-level CPU completion candidate.
Read PHASE1J_ACCURACY plan/spec/worklog and seven QA reports. Full F, WZ/P/Q,
all instruction families: 1,604,000 external PASS. Interrupt matrix748 and
589,824 XY checks PASS. NMI/INT IM0/1/2, EI/HALT, R and Bus events implemented.
M-cycle abstract, NOT pin/cycle-perfect; see explicit limits in the spec.
Current source src/, generated deploy remains the v0.0.9 standalone filename.
Next: Human review/mobile QA and authorized stack integration; then resume MON
range/disassembly/register plan. Do not restart PHASE1F–1J. No merges authorized.
The earlier snapshots below are historical.

CURRENT 2026-09-26: feature/shino80-z80-indexed-cb-20260926, parent e01d5ed /
PR #24. DDCB/FDCB256 each; all7 families 1,604,000 external cases PASS.
Read PHASE1I_INDEXED_CB plan/spec/worklog and QA JSONs. Next PHASE1J interrupt
and precision work; full Z80 NOT finished. MON paused; no merge performed.
Earlier snapshots below are historical.

LATEST 2026-09-26: feature/shino80-z80-index-20260926, parent bb0daeb / PR #23.
DD/FD252 each; external BASE/CB/ED/DD/FD 1,092,000 PASS. See PHASE1H_INDEX
plan/spec/worklog and QA reports. Next PHASE1I indexed CB, then interrupts.
MON paused; no merges; earlier snapshots below are historical.

CURRENT 2026-09-26: feature/shino80-z80-ed-20260926 on 42d04f7 / PR #22.
PHASE 1G ED candidate: 78 active + 178 unused NOP slots. External ED 80,000,
BASE 252,000, CB 256,000 PASS. Read PHASE1G_ED plan/spec/worklog and QA JSONs.
Next PHASE 1H DD/FD; MON paused; no merge. Full Z80 still incomplete.
All earlier overrides below are historical, not the current resume target.

Latest override 2026-09-26: feature/shino80-z80-cb-20260926 on eea8dfc / PR #21.
CB 256/256 implemented; external CB 256,000 and BASE 252,000 PASS (D7 policy).
Read PHASE1F_CB plan/spec/worklog. MON expansion paused; next PHASE 1G ED.
DD/FD/indexed CB and interrupt/precision work still incomplete. No merge.

Newest override 2026-09-26: perf/shino80-trace-observer-20260926 on 3f4f90d /
PR #20. Read TRACE_OBSERVER_PERF plan/spec/worklog. Ring storage and lazy
observers; exact CPU/Bus equivalence tested. Chrome ~4 MHz, phone QA pending.
No CPU/firmware/pacing changes; no merges. Earlier candidates follow.

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
