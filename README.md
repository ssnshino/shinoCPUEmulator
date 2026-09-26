# shinoCPUEmulator

## ONE-PAGE Z80 COMPUTER / SHINO-80

ブラウザ上で動作する、完全オリジナル設計のZ80ベース8bitコンピュータ研究開発プロジェクト。

PC-88 / MSX / ZX Spectrum / CP/M machine等の既存機をそのまま再現するのではなく、

> **もし2026年にZ80を使って新しい8bit PCを設計するなら？**

を出発点に、CPU / RAM / ROM / BIOS / VRAM / Keyboard / Floppy Disk / RS-232C / Printer / Timer / Sound / Debugger / Memory Monitor / Bus Monitorまで含めた「透明な8bitコンピュータ」を作る。

## Current status

### Active candidate — 2026-09-26

LATEST: `feature/shino80-ram-handoff-v05-20260926`, parent `9fd087b` / PR #29.
RAM handoff v0.5 adds BIOS entry 011Eh and Monitor `B`: firmware prepares a
shadow page-zero vector, copies a three-byte trampoline to F800h, pages ROM out,
continues from an original payload at 8000h, writes directly to VRAM and HALTs.
Bus tests prove the first post-pageout opcode fetch is RAM and no later ROM read
occurs; RESET restores bank-0 firmware and MON. This is the boot ABI foundation
for the adopted virtual disk → SHINO CBIOS → license-audited CP/M → Z80 BBC
BASIC roadmap. No disk or third-party code is included yet. See the matching
v0.5 plan/spec/license research/worklog. Full package and offline Chrome
desktop/mobile QA pass; commit/PR delivery remains pending. No merge or public
deploy. Older entries below are history.

LATEST: `feature/shino80-pageable-firmware-v04-20260926`, parent `d3f223e`.
SHINO-80 now has 64 KiB physical RAM with a RESET-visible 16 KiB firmware
overlay: fixed Boot/Recovery ROM at 0000h–1FFFh and selectable Extension ROM at
2000h–3FFFh. Low I/O port 00h controls full lower RAM, shadow writes and bank
selection; RESET restores bank 0 ROM visibility. BIOS/MON v0.3 behavior is
preserved and its large disassembler tables now occupy Extension bank 0. See
`docs/head/SHINO80_PAGEABLE_FIRMWARE_v0.4.md`, matching plan/research/worklog.
No BASIC, CP/M, disk loader, CPU semantic or CG-ROM/display change. Full package
and browser evidence must pass before review; no merge or public deploy.
Older candidate entries below are history.

LATEST: `feature/shino80-bios-monitor-v03-20260926`, parent `af6c933`.
ROM-resident BIOS/MON v0.3 adds bounded `D start end`, diagnostic `R`, and
seven-family `U start [end]`; legacy H/?/C/D remains compatible. New BIOS calls
are PARSE_HEX16 at 0118h and DISASM_ONE at 011Bh. The full 1,780-encoding
decoder agreement suite, package regression and offline Chrome desktop/mobile
smoke pass. SYSTEM ROM ends at 1FF6h with nine trailing bytes: further firmware
growth needs an explicit layout decision. See
`docs/head/SHINO80_BIOS_MONITOR_v0.3.md` and matching plan/worklog. CPU/Bus/
CG-ROM/UI behavior is unchanged. Human review/merge remains; no public deploy.
Older candidate entries below are history.

LATEST: `feature/shino80-technical-manual-20260926`, parent `fa73816` / PR #27.
Standalone Japanese **Technical Manual v0.1**: 1,780 searchable Z80 encodings,
bytes/timing/flags/execution examples, clickable system concept diagram,
memory/I/O and BIOS/MON guide, actual 256-glyph CG-ROM atlas.
Open [the offline manual](deploy/shino80_technical_manual_v0.1.html) in a browser.
Build `npm run build:manual`; validate `npm run test:manual` (in `npm test`).
See [manual spec](docs/head/SHINO80_TECHNICAL_MANUAL_v0.1.md) and matching
plan/worklog. CPU/firmware/emulator artifact unchanged. Real iPhone review and
Human PR-stack review remain. No public hosting or merges performed.
CPU status below is the unchanged parent candidate; older entries are history.

CURRENT: `feature/shino80-z80-accuracy-closeout-20260926`, parent `d8d30bc` / PR #25.
PHASE1J closes the **instruction-level CPU milestone**: all instruction families,
full F including X/Y, WZ/P/Q, NMI and INT IM0/1/2, EI delay and HALT return.
External full-state baseline: **1,604,000 / 1,604,000 PASS**, zero failures.
Independent interrupt/sequence suite: 748 cases +589,824 XY checks PASS.
Not pin/cycle-perfect: WAIT/BUSRQ, electrical timing, peripheral daisy-chain
and multi-byte external IM0 streams remain outside this milestone.
See `docs/head/SHINO_Z80_PHASE1J_ACCURACY_SPEC.md`, matching plan/worklog and
`code/head/SHINO_Z80_PHASE1J_*_QA.json`. Standalone deploy filename remains
v0.0.9 for compatibility. Human review/merge and iPhone QA remain; next feature
candidate is MON range/disassembly/register support. No merges performed.
Everything below is historical candidate context, not unfinished CPU phase work.

LATEST: `feature/shino80-z80-indexed-cb-20260926`, parent `e01d5ed` / PR #24.
DDCB/FDCB256 each now execute. All7 families externally checked:
1,604,000 PASS, zero failures under D7 policy. See PHASE1I_INDEXED_CB docs.
Instruction-family implementation is present, but interrupt dispatch and
precision remain PHASE1J. Full Z80 NOT complete. MON paused; no merges.
Earlier candidate status below is historical.

CURRENT: `feature/shino80-z80-index-20260926`, parent `bb0daeb` / PR #23.
DD/FD 252 terminal opcodes each execute (85 affected + 167 ignored-prefix).
External BASE/CB/ED/DD/FD: 1,092,000 PASS, zero failures under D7 policy.
Read PHASE1H_INDEX plan/spec/worklog. Next PHASE1I indexed CB; not implemented
yet. Interrupt/precision closeout also remains. MON paused; no merges.
The following entries are historical candidate records.

Current CPU candidate: `feature/shino80-z80-ed-20260926`, parent `42d04f7` /
PR #22. PHASE 1G ED: 78 active encodings plus 178 unused NOP slots. External
ED 80,000 + BASE 252,000 + CB 256,000 PASS, failure 0 under D7 policy.
See PHASE1G_ED plan/spec/worklog. Next PHASE 1H DD/FD; MON expansion paused.
No automatic merges. Earlier candidate records below are historical.

Latest CPU candidate: `feature/shino80-z80-cb-20260926` on `eea8dfc` / PR #21.
PHASE 1F: CB 256/256 execute; external CB 256,000 + BASE 252,000 PASS, failure 0
under documented-state policy. See PHASE1F_CB plan/spec/worklog in head dirs.
MON expansion is paused. Next is PHASE 1G ED; DD/FD, indexed CB, interrupt and
undocumented precision work remain open. Earlier UI candidates follow.

Newest: `perf/shino80-trace-observer-20260926` on `3f4f90d` / PR #20.
Bus ring storage and visible-only observers; CPU/firmware unchanged. Local
Chrome comparison reached ~4.00 MHz versus ~0.70–0.75 before; iPhone QA pending.
Current plan/spec/worklog: `SHINO80_TRACE_OBSERVER_PERF_PLAN.md`,
`SHINO80_TRACE_OBSERVER_PERF_v0.1.md`, `SHINO80_TRACE_OBSERVER_PERF_WORKLOG.md`.
The previous candidate history follows; all merges require Human GO.

Latest: `feature/shino80-realtime-pace-20260926`, stacked on MON v0.2
`6707ace` / PR #19 (Human functional PASS). Default REALTIME replaces MAX;
VISUAL and TURBO remain selectable. 4 MHz is a target, measured MHz is shown.
Current plan/spec/worklog: `SHINO80_REALTIME_PACE_PLAN.md`,
`SHINO80_EXECUTION_PACE_v0.1.md`, `SHINO80_REALTIME_PACE_WORKLOG.md` in head
directories. Speed candidate mobile QA and all merges remain pending.
The following bullets describe the parent candidate.

- Reviewed keyboard/MON baseline: PR #17, main `f6444c6`.
- 64 KiB Memory Inspector: PR #18, `f0903e0`; Human iPhone/Edge QA PASS.
- Active branch: `feature/shino80-monitor-lines-dump-20260926`, stacked on PR #18.
- BIOS GETLINE / Backspace / scroll / hex output and MON `D xxxx` implemented.
- **All MON commands require Enter in this candidate**, including H and C.
- Current plan: `plan/head/SHINO80_MONITOR_CONSOLE_V2_PLAN.md`.
- Current spec: `docs/head/SHINO80_MONITOR_CONSOLE_v0.2.md`.
- Current worklog: `working-logs/head/SHINO80_MONITOR_CONSOLE_V2_WORKLOG.md`.
- Main merge and real-device review of this candidate remain pending.

The status below is the historical BIOS-foundation closeout, not the candidate.

- Repository: `ssnshino/shinoCPUEmulator`
- Default branch: `main`
- Current machine: **SHINO-80**
- Current development source: `src/`
- Current distribution artifact: `deploy/one_page_shino80_v0.0.9_z80_base_complete.html`
- Z80 PHASE 1E: **MERGED / BASE 252 of 252 non-prefix opcodes**
- External BASE oracle: **252,000 / 252,000 PASS / Failure 0**
- Native CG-ROM / DM-80 refinement: **MERGED via PR #14 / Human visual PASS**
- Minimum SHINO BIOS + Monitor foundation: **MERGED via PR #15**
- BIOS services: PUTCHAR / NEWLINE / CLS / PRINT_STRING
- Current Monitor: non-interactive `*` prompt and wait loop at `0220h`

The next implementation target is intentionally not auto-selected. Resume with
one active environment and one branch only, then choose either Z80 PHASE 1F CB
completion or keyboard / interactive Monitor design through PLAN FIRST.

## UI core direction

SHINO-80 UI has two layers:

> **Modern Shell / Retro Machine**

The machine itself can look and feel like a believable 1980s computer.

The surrounding navigation, inspector, adaptive layout, accessibility, and controls use modern 2026 UI practice.

Two core rules:

> **DISPLAY FIRST.**

> **OBSERVER SECOND.**

Future CPU / Memory / Bus / FDD / UART / Printer / Sound panels must not become a permanent wall of cards.

## Start here

1. `README.md`
2. `AGENTS.md`
3. `snapshot/CURRENT_SNAPSHOT.md`
4. `snapshot/LAST_RUN.md`
5. `snapshot/NEXT_CHAT_PROMPT.txt`
6. `plan/head/SHINO80_BIOS_MONITOR_V03_PLAN.md`
7. `docs/head/SHINO80_BIOS_MONITOR_v0.3.md`
8. `working-logs/head/SHINO80_BIOS_MONITOR_V03_WORKLOG.md`
9. `docs/head/SHINO80_TECHNICAL_MANUAL_v0.1.md`
10. `working-logs/head/SHINO80_TECHNICAL_MANUAL_WORKLOG.md`

## Core concept

通常のエミュレータは「仮想PC画面」を見せる。

SHINO-80では、

```text
SHINO-80 DISPLAY
+
CPU Inspector
+
Memory Inspector
+
Disassembler
+
Bus Analyzer
+
Device Monitor
```

を同時または状況に応じて切り替えて観測できるようにする。

重要なのは「全部を常時見せる」ことではなく、CPU → Bus → Device / VRAM → Outputの因果を、画面サイズに応じて理解しやすく見せること。

## Development workflow

```text
RESEARCH
↓
PLAN
↓
IMPLEMENT
↓
TEST
↓
WORKLOG
↓
SPEC
↓
SNAPSHOT
```

SHINO-80をまず一台完成させる。将来の6502 / 6809 / 68000等を理由に、最初から過剰抽象化しない。

## Repository layout

```text
.
├ README.md
├ AGENTS.md
├ snapshot/
├ plan/
│  └ head/
├ docs/
│  └ head/
├ working-logs/
│  └ head/
├ code/
│  └ head/
├ research/
│  ├ z80/
│  └ ui/
├ references/
├ src/        # development source of truth
├ scripts/    # build tooling
├ tests/      # source + artifact QA
└ deploy/     # generated one-page distribution
```

`head/` は現行開発資料。過去系列が発生したら各categoryの `history/` へ退避する。

### Source / deploy rule

> **One-page is the distribution format, not the development source format.**

通常の開発は `src/` を編集し、`npm run build` で `deploy/` に単一HTMLを生成する。`deploy/*.html` は手編集しない。

## Development phases

1. **PHASE 0 — Research / Architecture**
2. **PHASE 1 — Z80 CORE**
3. **PHASE 2 — DEBUG MACHINE**
4. **PHASE 3 — MINIMUM COMPUTER**
5. **PHASE 4 — STORAGE**
6. **PHASE 5 — I/O WORLD**
7. **PHASE 6 — SOFTWARE**
8. **PHASE 7 — NETWORK**

CPU accuracyは段階的に上げる。

```text
Level 1  instruction functional accuracy
Level 2  flags / interrupts accuracy
Level 3  T-state timing
Level 4  bus-cycle visibility
Level 5  cycle-sensitive device behavior
```

## Copyright / ROM policy

既存PCのBIOS ROMや市販ソフトROMは組み込まない。

SHINO-80のROM / BIOS / Monitor / OSはオリジナル実装を基本とする。Z80 datasheet、技術資料、既存オープンソース実装は仕様理解・テスト方法研究の参考に使うが、コードを無批判にコピーしない。

## Long-term vision

SHINO-80完成後は、CPUやデバイスを交換可能な **VIRTUAL MICROCOMPUTER LAB** へ育てる可能性がある。

```text
VIRTUAL MICROCOMPUTER LAB
│
├ CPU CORE LIBRARY
├ VIRTUAL MOTHERBOARD
├ DEVICE LIBRARY
├ DEBUG LAB
└ MACHINE FAMILY
   ├ SHINO-80
   ├ SHINO-65
   ├ SHINO-09
   └ SHINO-68K
```

ただし当面は **Z80 + SHINO-80だけを見る**。

## Core phrases

> PCをエミュレートするのではない。PCを設計する。

> CPUは本物。周辺機器は俺たちが設計する。

> 1980年代のコンピュータを、2026年のデバッガで透視する。

> WebRTCをZ80に見せない。Z80にはモデムだけ見せる。

> 存在しなかった8bit文化圏を、いま作る。

> 古いCPUを、当時存在しなかった最高の観測装置で見る。

> 最終形はエミュレータではない。**VIRTUAL MICROCOMPUTER LAB.**

## Update History

- 2026-09-24T13:20:14+09:00 — ChatGPT — Repository bootstrap。企画資料、将来構想、研究PLAN、snapshot運用、AI開発ルールの入口を追加。
- 2026-09-24T15:13:07+09:00 — ChatGPT — Modern Shell / Retro Machine、DISPLAY FIRST / OBSERVER SECONDを軸とするUI研究・設計標準の入口を追加。

- 2026-09-24T15:36:00+09:00 — ChatGPT — v0.0.2 UI FOUNDATION candidateを追加。Display/CPU/Memory/Bus/Devicesのadaptive workbench、Desktop/Tablet/Phone layout、Device Dock placeholder、runtime smokeを追加。

- 2026-09-24T16:50:00+09:00 — ChatGPT — 開発正本を `src/`、配布生成物を `deploy/` とするsource/deploy分離を追加。

- 2026-09-24T17:18:00+09:00 — ChatGPT — Z80 PHASE 1A candidateを追加。Decoder分離とLD命令群81 encodingを実装し、v0.0.3 teaching artifactを追加。

- 2026-09-24T18:22:00+09:00 — ChatGPT — PHASE 1B candidateを追加。INC/DEC 16 encodingと初のFlags Engineを実装し、v0.0.4 teaching artifactを追加。

- 2026-09-24T20:18:00+09:00 — ChatGPT — PHASE 1C candidateを追加。JP/JR/JR cc/DJNZとdynamic branch timingを実装し、PC/ADDRESSの非線形挙動を可視化。

- 2026-09-24 — ChatGPT — PHASE 2A candidate: 8 KiB SYSTEM ROM, IPL, 80x25 TEXT VIDEO, 4 KiB CG-ROM and real CRT canvas.

- 2026-09-24 — ChatGPT — PHASE 2A.1 candidate: POWER state, warm RESET, IPL VRAM clear and CRT safe margin.

- 2026-09-24T23:55:00+09:00 — ChatGPT — PHASE 1E: all 252 non-prefix BASE opcodes executable; BASE 256/256 decode coverage; representative SingleStepTests oracle 23,000/23,000 PASS.
- 2026-09-25 — Codex — PHASE 1E external oracle closeout: 252 non-prefix opcodes / 252,000 unique cases PASS, Failure 0.
- 2026-09-25 — ChatGPT / Human QA / Codex — Native 8x16 CG-ROM and adaptive DM-80 rendering merged via PR #14.
- 2026-09-25 — Codex — Minimum SHINO BIOS + Monitor foundation merged via PR #15; IPL now prints through BIOS and waits at `0220h`.
