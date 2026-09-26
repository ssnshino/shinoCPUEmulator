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
- last implementation-bearing main: `e75d8c0506a7b1bb711b54c352c8b04580cdddaf`（PR #38）
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
- Virtual Disk A、SHINO CBIOS、WBOOT、licensed CP/M 2.2
- writable starter filesystem
  - `WELCOME.TXT`
  - `HELLO.COM`
  - `S80INFO.COM`
- CP/M CCP操作: `DIR`, `TYPE`, `SAVE`, `ERA`, `REN`, `USER`とCOM実行
- non-destructive cursor、Bus-visible one-bit BEEP
- standalone Technical Manual、Z80 machine-code reference、system wiring diagram

Human iPhone/Edge QAでは、起動、DIR、TYPE、HELLO、S80INFO、Backspace/Delete、80×25 scrolling、SAVE、複製COM実行、ERA、mobile keyboard layoutを確認済み。

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

`plan/head/`は次の実装を始めるまで空に保つ。新しい実装はPLAN FIRSTで開始し、完了後は対応するPLAN/SPEC/worklogをhistoryへ閉じる。

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

## 次の候補

次の実装はまだ固定しない。候補は以下。

1. Virtual Diskのbrowser reload永続化と明示的image import/export
2. original SHINO file-management utility、またはライセンス確認済みCP/M utility
3. B: driveを追加する前のdevice/media contract
4. storage安定後のライセンス確認済みBASIC
5. 拡張slot、FDD、UART、printer、soundなどの周辺機器

一度に一つの環境・一人のwriter・一つのpurpose branchだけを使う。CPU semanticsを変える場合は新しいaccuracy phaseと対応する検証証拠を必須とする。

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
