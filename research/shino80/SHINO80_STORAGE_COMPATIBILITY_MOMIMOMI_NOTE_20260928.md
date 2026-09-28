# SHINO-80 Storage / CP/M Compatibility — 仕様もみもみノート

Date: 2026-09-28 JST
Author: 戸澤 / ChatGPT
Status: WORKING NOTE / NOT AN IMPLEMENTATION CONTRACT
Baseline main: `511e6344c10690ae340e6310c572326ce8e3a53f`

## Purpose

仕様検討中の決定事項・方向性・未決事項・再検討対象を分離して記録する。

このノートは PLAN / Basic Design / Detailed Design の代わりではない。
未決事項を「暗黙に決定済み」と扱わないことを最優先する。

## 1. 決定済み / 強い合意

### CP/M compatibility principle

SHINO-80 は独自8bit PCだが、標準的な CP/M-80 application ABI/API を第一級互換仕様として扱う。

- 標準的な 8080 / Z80 CP/M `.COM` program は原則無改造実行を目標とする。
- SHINO 固有の上位機能は加算的拡張とし、標準 CP/M program の動作を妨げない。
- 特定実機の I/O port / VRAM / proprietary hardware を直接叩く software の互換は原則対象外。
- 他機種固有 BIOS を含む system disk の直接 boot 互換は要求しない。
- 既知の legacy CP/M media format は profile 単位で読み書き互換を増やしていく方向とする。

### Drive role principle

- DRIVE A / CP/M A: は SHINO-80 の BOOT / SYSTEM / TOOLS 系を基本役割とする。
- DRIVE B / CP/M B: は USER / WORK / INTERCHANGE 系を基本役割とする。
- POWER -> RUN の autoboot 対象は A: のみ。
- B: の挿入状態・媒体内容は boot sequence に影響させない。
- A/B は別設計の専用デバイスにせず、同一 Block Device design / class を使う方向とする。
- 外部 CP/M image の最初の受け入れ口は B: を基本とする。

### Development-process principle

- 実装 commit を不必要に細切れにするのではなく、実装前の仕様判断を小刻みに進める。
- IMPORT / EXPORT は同じ media I/O 境界を触るため、次回実装では一つの bounded feature として扱う方向。
- Codex は設計済み契約をまとめて実装し、PM/PL/SE 側は事前仕様・受入条件・reviewを担当する。

## 2. 調査済みだが採否未決

### Multi-profile removable media

CP/M / BIOS / DPB の構造上、複数 media geometry / profile を扱うことは可能。
SHINO-80 でも DRIVE と MEDIA PROFILE を分離する設計は有力候補。

候補例:

- current CLASSIC: 77 tracks x 26 sectors x 128 bytes = 256,256 bytes
- 2D-class
- 2DD-class / 720 KiB-class
- 2HD-class / 1.2 MiB-class

ただし profile 名・正確な geometry・header version は未決。

### Legacy CP/M image compatibility

raw CP/M image は一般に self-describing ではないため、拡張子や byte length だけでは format を安全に識別できない。

候補方針:

- SHINO native media は自己記述 profile/header を持つ。
- legacy image は known profile registry から明示選択または安全な auto-detect を行う。
- cpmtools 的な external format definition を参考にする。

採用方式は未決。

## 3. 未決事項 — 必ず後で決める

### DRIVE B initial state

まだ決めていない:

- 起動時から B: に factory work disk を挿すか。
- B: を empty で起動するか。
- blank disk を自動生成するか、Human操作で作成するか。

### B: standard media capacity

まだ決めていない:

- current 256,256-byte CLASSIC を A/B 共通標準とするか。
- B: の標準 work media を 720 KiB-class 等へ拡大するか。
- A: と B: で初期 profile を分けるか。

### Media profile / header contract

まだ決めていない:

- S80B の役割を boot profile magic のまま維持するか。
- whole-disk host container/header を別に持つか。
- media profile ID / geometry / filesystem parameters / checksum をどこに置くか。
- raw image と wrapped image を両方扱うか。

### IMPORT / EXPORT integrated contract

未決:

- IMPORT/EXPORT v0.1 の対象 drive: B only / A+B。
- POWER OFF 限定を両方に課すか。
- INSERTED / EJECTED shelf のどちらを import/export source/target とするか。
- overwrite / replace confirmation rule。
- invalid import の atomic rejection rule の詳細。
- download filename rule。
- file extension rule。
- browser file input UI placement。
- mobile save/share UX の受入条件。

### Legacy image import policy

未決:

- 最初に対応する legacy CP/M format。
- AUTO detection を v0.1 に入れるか。
- format chooser を必須にするか。
- unknown image を read-only mount する案の採否。
- geometry/profile mismatch の error contract。

### CP/M compatibility test corpus

未決:

- どの classic `.COM` program を公式互換試験に使うか。
- 8080-only / Z80-specific の両方をどこまで含めるか。
- BIOS direct-call program をどこまで対象にするか。
- WordStar / MBASIC / assembler / compiler 等の具体的な採用順序。
- licensing / redistribution 条件をどう扱うか。

### TPA compatibility target

未決:

- SHINO-80 が何K CP/M machine を名乗るか。
- 現在の TPA 0100h-93FFh が classic software corpus に十分か。
- compatibility のために memory map / CCP / BDOS placement を将来調整するか。

### Filesystem regression scope

未決:

- directory / extent / allocation block / RC / EX / S1/S2 の host-side inspection depth。
- disk-full / multi-extent / cross-drive / USER 0-15 の test matrix。
- external exported image を host parser で検証する正式フロー。
- B: work disk を Software Division の regression fixture にする方式。

### B: low-level device contract

未決:

- B: の I/O port allocation。
- A/B selectionを controller-level にまとめるか、deviceを2台にするか。
- BIOS SELDSK / DPH / DPB の具体配置。
- A/B media profile が異なる場合の DPH/DPB切替方式。

## 4. 既存資料との再検討ポイント

現在の roadmap / EXPORT research には以下の旧分割が残っている:

- R2 = EXPORT
- R3 = IMPORT

今回の合意では IMPORT + EXPORT を同じ bounded implementation として扱う方向へ変わった。

したがって次に正式設計へ進む前に:

1. roadmap の R2/R3 を統合するか決める。
2. existing EXPORT-only PLAN / design を再利用する部分と破棄する部分を仕分ける。
3. B: introduction を IMPORT/EXPORT と同一PRに含めるか、直前/直後の別featureにするか決める。

まだこのノートでは roadmap を書き換えない。

## 5. 次に揉む候補

次の一歩として最優先候補:

**B: の標準媒体方針**

具体的には:

- A/B とも current CLASSIC 256,256 bytes から始めるか。
- B: を最初から 720 KiB-class work media にするか。
- compatibility と実装単純性をどう優先するか。

ここを決めると、IMPORT/EXPORT、media profile、DPB、filesystem regression の前提が揃う。

## Rule

このノートで「未決」と書いた項目は、PLAN / Issue / implementation に勝手に流し込まない。
Human + ChatGPT が明示的に仕様決定してから正式資料へ昇格する。
