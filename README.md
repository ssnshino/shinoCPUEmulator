# shinoCPUEmulator

## ONE-PAGE Z80 COMPUTER / SHINO-80

ブラウザ上で動作する、完全オリジナル設計のZ80ベース8bitコンピュータ研究開発プロジェクト。

PC-88 / MSX / ZX Spectrum / CP/M machine等の既存機をそのまま再現するのではなく、

> **もし2026年にZ80を使って新しい8bit PCを設計するなら？**

を出発点に、CPU / RAM / ROM / BIOS / VRAM / Keyboard / Floppy Disk / RS-232C / Printer / Timer / Sound / Debugger / Memory Monitor / Bus Monitorまで含めた「透明な8bitコンピュータ」を作る。

## Current status

- Repository: `ssnshino/shinoCPUEmulator`
- Default branch: `main`
- Current machine: **SHINO-80**
- Reviewed baseline: repository bootstrap PR #1 merged
- CPU implementation candidate: **PR #2 — SHINO Z80 CORE v0.0.1 FIRST HEARTBEAT**
- CPU Human status: smartphone one-page execution confirmed; PR #2 remains unmerged
- UI research candidate: `research/ui-design-standard-v0.1-20260924`
- Current UI design stage: **modern shell architecture / no UI code change in this research branch**

PHASE 0 research remains active. CPU implementation and UI architecture are advanced in small, reviewable steps.

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
6. `docs/head/SHINO_80_UI_DESIGN_STANDARD_v0.1.md`
7. `docs/head/SHINO_80_UI_LAYOUT_BLUEPRINTS_v0.1.md`
8. `plan/head/SHINO_80_UI_FOUNDATION_v0.1_PLAN.md`
9. `research/ui/SHINO_80_UI_RESEARCH_2026-09-24.md`
10. `plan/head/SHINO_80_PHASE0_RESEARCH_PLAN_v0.1.md`
11. `docs/head/ONE_PAGE_Z80_COMPUTER_PROJECT_CONCEPT_v0.1.md`
12. `docs/head/SHINO_80_ARCHITECTURE_DRAFT_v0.1.md`
13. `docs/head/VIRTUAL_MICROCOMPUTER_LAB_VISION_v0.1.md`

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
├ src/
└ tests/
```

`head/` は現行開発資料。過去系列が発生したら各categoryの `history/` へ退避する。

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
