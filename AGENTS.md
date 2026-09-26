# AGENTS.md
# ONE-PAGE Z80 COMPUTER / SHINO-80 — AI DEVELOPMENT RULES

このファイルはChatGPT / Codex / その他AI開発者向けの共通ルール。

## 1. Start order

作業開始前に以下を確認する。

1. `README.md`
2. `snapshot/CURRENT_SNAPSHOT.md`
3. `snapshot/LAST_RUN.md`
4. `snapshot/NEXT_CHAT_PROMPT.txt`
5. `snapshot/SNAPSHOT_MANIFEST.md`
6. manifestが指定するCurrent SPEC / worklog
7. active実装がある場合だけ`plan/head/`のCurrent PLAN
8. UI変更なら`docs/head/SHINO_80_UI_DESIGN_STANDARD_v0.1.md`
9. 必要に応じて`research/` / `code/head/`

通常の開始時にhistory全体を走査しない。historyは過去仕様比較、regression、廃止方式確認など理由がある場合だけ読む。

## 2. Source of truth

GitHubのreview済み `main` を正本とする。

Active candidateがある場合は `snapshot/CURRENT_SNAPSHOT.md` に記録する。

SHINO-80実装が始まった後、Current one-page HTMLまたはCurrent source/buildがsnapshotで指定された場合、それを基準実装とする。

## 2.1 Codex desktop Node / pnpm runtime

MacのCodex shellでは通常PATHに`node` / `npm`がないことがある。既知の環境差分
なので毎回探索せず、root `README.md`の`Codex desktop runtime`に記載した
同梱Node/pnpmを使う。このrepositoryの標準package managerはpnpmであり、
`pnpm test`を実行する。手動でtest script一覧を再構成しない。

## 3. Project boundary

このプロジェクトは既存PC互換機の再現を主目的としない。

- Z80 CPU behaviorは可能な範囲で実CPU仕様へ寄せる。
- SHINO-80のmemory map / I/O map / BIOS / peripheralsはオリジナル設計。
- PC-88 / MSX / Spectrum等のROMを組み込まない。
- 市販ROM / BIOS dump / proprietary firmwareをRepositoryへ入れない。

## 4. Most important design principles

### Transparent computer

CPU → Bus → Memory / Device → Output の因果を観測可能にする。

### Debugger is an observer

Debugger / InspectorがCPU実行経路を汚染しない。

CPUのread/write/executeと、Debuggerのpeek/pokeを区別する。

### Bus is a first-class concept

CPU CoreからMemory/Deviceへ無秩序に直アクセスしない。

少なくとも将来bus traceを生成できる境界を維持する。

### Virtual time is machine time

CPU / Timer / FDC / UART / Printer等の仮想時間は、可能な範囲でCPU timing / T-state側から導出する。

ブラウザwall clockを仮想機器の正本にしない。

### Do not over-abstract

将来6502 / 6809 / 68000対応を理由に、Z80初号機をGeneric CPU Framework化しない。

共通化はSHINO-80完成後、二台目を作る時に実働コードから抽出する。

## 5. Accuracy policy

段階的に精度を上げる。

1. instruction functional accuracy
2. flags / interrupts accuracy
3. T-state timing
4. bus-cycle visibility
5. cycle-sensitive device behavior

最初からcycle-perfectを要求して開発を止めない。

ただし「未実装」と「実装済みだが近似」は明示する。

## 6. Research before implementation

Z80の挙動を決める時は、推測より一次資料・再現可能なテストを優先する。

優先情報源:

- Zilog / Z80 official documentation
- documented instruction timings
- interrupt behavior
- flags
- refresh register behavior
- bus signals / M-cycle / T-state
- reputable emulator test suites
- existing open-source implementations（仕様比較用）

外部コードはライセンスを確認し、無批判にコピーしない。

## 7. PLAN FIRST

積み上がる改修は実装前に `plan/head/` へPLANを作成する。

PLANには最低限:

- 目的
- 根拠 / source
- 変更対象
- 非対象
- Accuracy level
- Regression risk
- QA
- 成功条件

を記載する。

## 8. Test policy

CPU Coreではunit testを最優先する。

対象候補:

- instruction state transition
- flags
- PC / SP
- alternate registers
- prefixes
- HALT
- EI delay
- INT / NMI
- IM 0 / 1 / 2
- R / refresh behavior
- T-state
- bus trace

「画面が動いた」だけをCPU正当性の証拠にしない。

## 9. One-page policy

最終的にはHTML/CSS/JavaScriptを一枚HTMLへbuildできる構成を目指す。

ただし開発中は必要に応じてsourceを分割してよい。

One-page化のために、テスト性やCPU Coreの独立性を壊さない。

## 10. Source / deploy build policy

Development source of truth is `src/`.

Generated standalone distribution artifacts live in `deploy/`.

Rules:

- Do not hand-edit `deploy/*.html`.
- Fix code in `src/`, then run the build.
- `scripts/` owns build/tooling logic.
- `tests/` validates both modular source and generated artifacts.
- The one-page HTML remains a required deliverable, but it is not the authoring format.
- A diagnostic emergency patch to a generated artifact must be back-ported into `src/` before merge.
- CPU code must not import DOM/UI code.
- Devices must not directly manipulate UI.
- Future source should split by real responsibility (decoder, ALU, devices, debugger, firmware) when boundaries become useful; do not create abstraction for its own sake.

Canonical detail:

`docs/head/SHINO_80_SOURCE_DEPLOY_LAYOUT_STANDARD_v0.1.md`

## 11. UI design policy

UI変更前に必ず以下を読む。

- `docs/head/SHINO_80_UI_DESIGN_STANDARD_v0.1.md`
- `docs/head/SHINO80_CURRENT_SYSTEM_SPEC.md`
- 必要に応じて `research/ui/SHINO_80_UI_RESEARCH_2026-09-24.md`

Core rules:

- **Modern Shell / Retro Machine**
- **DISPLAY FIRST**
- **OBSERVER SECOND**
- **ADAPT, DON'T SHRINK**
- **BIG TOUCH, SMALL DATA**
- **MOTION = INFORMATION**

Additional rules:

- viewport sizeでlayoutを決め、User-Agent/device-nameで固定しない。
- Compactでは複数paneを横に詰め込まず、原則1 major pane。
- future peripheralは原則DEVICES配下。勝手にtop-level tabを増やさない。
- layout変更でCPU stateやdevice stateをresetしない。
- mobile safe-areaを考慮する。
- touch controlは約44 CSS px級のhit targetを候補基準とする。
- statusを色だけで伝えない。
- high-frequency CPU eventをDOMへ1 event = 1 animationで流さない。
- `prefers-reduced-motion` を尊重する。
- shell navigation/controlをretro terminal fontだけで作らない。
- Current Altair-style LED panelは捨てず、Debug Lab / CPU Inspectorとして活かす。

未合意のpixel値・breakpoint・pane比率を永続仕様として固定しない。Human real-device QAを優先する。

## 12. GitHub / Pull Request workflow

`main` はHuman Review済みの安定正本。

AI Agentは原則 `main` へ直接pushしない。

推奨branch prefix:

- `feature/`
- `fix/`
- `chore/`
- `research/`
- `refactor/`

標準:

```text
main
 ↓
purpose branch
 ↓
research / plan / implement / test / document
 ↓
1 logical commit
 ↓
Pull Request
 ↓
Human Review
 ↓
merge
```

### Empty repository exception

完全空Repositoryではbranchの親commitが存在しないため、初回bootstrapに限り最小の初期commitを `main` に作成してよい。

それ以降は通常workflowへ移行する。

### Commit policy

原則 **1 PR = 1 logical commit**。

Contents API等で細かいcommitが生まれた場合、PR前に可能な範囲でblob/tree/commitを使って論理commitへ整理する。

### Human merge authority

AI AgentはPR作成後に勝手にmergeしない。

明示的なmerge依頼があった場合だけmergeする。

## 13. Documentation policy

Current資料:

- `plan/head/`
- `docs/head/`
- `working-logs/head/`
- `code/head/`

版付き文書には原則ISO 8601 JST timestampを入れる。

固定正本文書は末尾にappend-onlyの `Update History` を持つ。

## 14. Reference / asset policy

GitHubに置く:

- source
- tests
- plans / specs / reports
- small text research notes
- original SHINO firmware source
- QA JSON

慎重に扱う:

- third-party PDFs
- ROM dump
- proprietary firmware
- copyrighted software images
- large binaries

外部資料はURL・書誌情報・要約で管理し、権利状態が不明なraw binaryを無断でcommitしない。

## 15. Human authority

最終的なマシン仕様、UI/UX、架空PC文化、命名、機能採否はHumanが決める。

AIは調査・設計・実装・QAを支援するが、未合意の候補を確定仕様へ昇格させない。

## Update History

- 2026-09-24T13:20:14+09:00 — ChatGPT — Initial AI development rules created for SHINO-80 repository bootstrap.
- 2026-09-24T15:13:07+09:00 — ChatGPT — UI Design Standard参照、adaptive layout、safe area、touch/motion/color/Device Dockの開発ルールを追加。

- 2026-09-24T16:50:00+09:00 — ChatGPT — srcを開発正本、deployをgenerated one-page配布物とするbuild policyを追加。
