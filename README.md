# shinoCPUEmulator

**ONE-PAGE Z80 COMPUTER / SHINO-80**

ブラウザ上で動作する、完全オリジナル設計のZ80ベース8bitコンピュータ研究開発プロジェクト。

PC-88 / MSX / ZX Spectrum等の既存機を再現するのではなく、

> **もし2026年にZ80を使って新しい8bit PCを設計するなら？**

を出発点に、CPU・メモリ・BIOS・VIDEO・FDD・RS-232C・Printer・Timer・Debugger・Bus Monitorまで含めた「透明な8bitコンピュータ」を作る。

## Status

- Repository bootstrap: STARTED
- Emulator implementation: NOT STARTED
- Current machine: **SHINO-80**
- Current phase: architecture / Z80 research
- Default branch: `main`

本格的な実装前に、Z80仕様調査、machine architecture、memory map、I/O map、CPU core設計、MVPを固める。

## Core phrases

> PCをエミュレートするのではない。PCを設計する。

> CPUは本物。周辺機器は俺たちが設計する。

> 古いCPUを、当時存在しなかった最高の観測装置で見る。

> 最終形はエミュレータではない。**VIRTUAL MICROCOMPUTER LAB.**
