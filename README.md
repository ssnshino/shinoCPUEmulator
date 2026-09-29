# shinoCPUEmulator / SHINO-80

ブラウザだけで動く、完全オリジナル設計のZ80ベース8bitコンピュータ。CPU、Bus、Memory、Firmware、DM-80表示、Keyboard、Virtual Disk、Debuggerを分離し、CPUから出力までの因果を観測できる「透明な8bitコンピュータ」を目指す。

## まずここから再開する

別のAI・別セッション・別環境へ渡す時は、最初にこの`README.md`を読ませる。ここから先の正規順序は次のとおり。

1. `README.md` — 現在地、正本、次の入口
2. `AGENTS.md` — 開発・Human review・生成物の規則
3. `snapshot/CURRENT_SNAPSHOT.md` — 現在の完成状態
4. `snapshot/LAST_RUN.md` — 直近作業と検証
5. `snapshot/NEXT_CHAT_PROMPT.txt` — そのまま渡せる再開指示
6. `snapshot/SNAPSHOT_MANIFEST.md` — 今回読むべき現行文書一覧

作業開始時には必ずGitHubをfetchし、branch、HEAD、dirty state、open PRを確認する。snapshotに書かれたSHAは記録時点の証拠であり、live Git状態を上書きしない。

完了済みフェーズのPLAN、SPEC、QA、worklog、旧snapshotは`*/history/`に保存している。通常再開時には読まない。

## 現在のリリース基準

- GitHub repository: `ssnshino/shinoCPUEmulator`
- reviewed default branch: `main`
- latest reviewed storage implementation: Issue #56 / PR #57（`main` merge `8c3e1896db4c68cfc1746ed2ebca38d624ef4dc1`）
- development source of truth: `src/`
- generated standalone machine: `deploy/one_page_shino80_v0.0.9_z80_base_complete.html`
- generated standalone manual: `deploy/shino80_technical_manual_v0.1.html`
- generated filesは手編集しない。`src/`またはbuild scriptを修正して再生成する。

配布ファイル名の`v0.0.9_z80_base_complete`は互換性のため維持している。中身はBASE命令段階ではなく、下記の統合済みSHINO-80である。

## 現在できること

- Z80 instruction-level milestone完了
  - BASE / CB / ED / DD / FD / DDCB / FDCB
  - documented/undocumented flags、WZ/P/Q、NMI、INT IM 0/1/2、EI delay、HALT return
  - pinned external full-state oracle: `1,604,000 / 1,604,000 PASS`, Failure 0
- 4 MHz設計クロックのREALTIME / TURBO / VISUAL実行
- 64 KiB RAMとRESET-visible pageable firmware
- DM-80 80×25 text display、native 8×16 CG-ROM、640×400 logical raster
- Keyboard、ROM BIOS、interactive Monitor、Memory/Bus/Device inspector
- Virtual Disk A/B、SHINO CBIOS、WBOOT、licensed CP/M 2.2
- mounted valid S80B v2 mediaのPOWER → RUN / RESET autoboot、失敗時ROM MON fallback、manual `MON O`
- POWER OFF時のDRIVE A/B `EJECT` / `INSERT EJECTED DISK`、independent exact-medium shelves、compact/desktop両UI対応
- A/B whole-disk `.s80d` IMPORT / EXPORT、transactional confirmation、INSERTED/EJECTED round-trip
- writable starter filesystem
  - `WELCOME.TXT`
  - `HELLO.COM`
  - `S80INFO.COM`
- CP/M CCP操作: `DIR`, `TYPE`, `SAVE`, `ERA`, `REN`, `USER`とCOM実行
- non-destructive cursor、Bus-visible one-bit BEEP
- standalone Technical Manual、Z80 machine-code reference、system wiring diagram

Human iPhone/Edge QAでは、従来の手動boot経路で起動、DIR、TYPE、HELLO、
S80INFO、Backspace/Delete、80×25 scrolling、SAVE、複製COM実行、ERA、
mobile keyboard layoutを確認済み。PR #42のautomatic POWER → RUN / RESET
autobootはCodex in-app previewでHuman確認済みだが、physical iPhone/Edgeでの
autoboot再確認は未記録。PR #47のPOWER-OFF EJECT → no-media MON fallback →同一medium再挿入 → CP/M復帰はHuman interactive QAでPASS。Issue #54 / PR #55ではA:/B: dual-drive、B filesystem、WBOOT B>維持、実UI RESET A>復帰、A/B media lifecycleをautomated/browser QAで確認済み。

## 公開プレビュー

篠宮大飯店content repositoryから、メニュー非掲載・noindexのunlisted previewとして公開している。

- machine: `https://shinomiya-daihanten.wos.ktsys.jp/works/lab/programs/shino80-preview.html`
- manual: `https://shinomiya-daihanten.wos.ktsys.jp/works/lab/programs/shino80-reference.html`
- notices: `https://shinomiya-daihanten.wos.ktsys.jp/works/lab/programs/shino80-notices.txt`

公開正本は`ssnshino/shinomiya-daihanten-content`のreview済み`master`。SHINO-80側で生成物を更新しただけでは公開されない。content側へ正確なsource commitとhashを記録して取り込み、Human-authorized merge後に自動デプロイとpublic smokeを確認する。

## 現行文書

- current integrated machine: `docs/head/SHINO80_CURRENT_SYSTEM_SPEC.md`
- CP/M command reference: `docs/head/SHINO80_CPM_COMMAND_REFERENCE_v0.1.md`
- Technical Manual contract: `docs/head/SHINO80_TECHNICAL_MANUAL_v0.1.md`
- source/deploy layout: `docs/head/SHINO_80_SOURCE_DEPLOY_LAYOUT_STANDARD_v0.1.md`
- UI design: `docs/head/SHINO_80_UI_DESIGN_STANDARD_v0.1.md`
- project concept: `docs/head/ONE_PAGE_Z80_COMPUTER_PROJECT_CONCEPT_v0.1.md`
- long-term lab vision: `docs/head/VIRTUAL_MICROCOMPUTER_LAB_VISION_v0.1.md`

`plan/head/`には実行中のPLANだけを置く。現在activeなimplementation PLANはない。完了したPHASE 2 PLAN/worklogは`*/history/2026-09-29/`へ閉じている。

## 開発と検証

```bash
pnpm test
pnpm run build
pnpm run build:manual
git diff --check
```

### Codex desktop runtime

このMacのCodex shellでは通常PATHに`node` / `npm`がないことがある。
毎回探索や手動test loopを作らず、最初からCodex同梱Node/pnpmを使う。

```bash
export PATH="/Users/shino/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:/Users/shino/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback:$PATH"
node --version
pnpm --version
pnpm test
```

このrepositoryの標準package managerは`pnpm@11.19.0`。総合test scriptも
`pnpm run`で連鎖するため、`npm`コマンドは不要。Codex runtimeの配置が変わった
場合だけworkspace dependency locatorで新しいpathを確認し、この節を更新する。

UI変更ではPC/mobile、console、horizontal overflow、操作系を実ブラウザでも確認する。CPU変更では画面表示だけを根拠にせず、unit/oracle/interrupt/timing regressionを実行する。

実Chrome smokeはPython版Playwrightを探さず、同梱Node packageを使う。

```bash
export NODE_PATH="/Users/shino/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules"
export CHROMIUM_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
pnpm run test:browser
```

## 次の候補

Disk SubsystemはPHASE 0–5で完成ラインを固定している。

1. PHASE 3: CLASSIC + practical larger WORK media / multi-profile
2. PHASE 4: CP/M compatibility + filesystem regression
3. PHASE 5: daily development environment
4. PHASE 5以降: Advanced Storage

EXPORT-only / IMPORT-onlyへ再分割しない。未決事項は談話室で揉み、実装単位が
固まるまでrepositoryへ小刻みな設計PRを作らない。

一度に一つの環境・一人のwriter・一つのpurpose branchだけを使う。CPU semanticsを
変える場合は新しいaccuracy phaseと対応する検証証拠を必須とする。

## プロジェクト境界

- 既存PCのROM/BIOS dumpや市販software imageを取り込まない。
- Z80 behaviorは実CPUへ近づけるが、SHINO-80のmemory map、I/O、BIOS、peripheralsはオリジナル設計。
- Debuggerはobserver。CPU read/write/executeとpeek/pokeを混同しない。
- CPUからMemory/DeviceへはBus境界を通す。
- virtual machine timeは可能な限りT-stateから導出する。
- SHINO/400、PC-9801 emulatorとは別プロジェクトとして扱う。

## Git workflow

`main → purpose branch → plan/implement/test/document → one logical commit → Pull Request → Human Review → merge`

AIは`main`へ直接pushせず、Humanの明示指示なしにPRをmergeしない。
