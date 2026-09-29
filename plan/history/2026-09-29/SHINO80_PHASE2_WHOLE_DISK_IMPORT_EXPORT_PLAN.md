# SHINO-80 PHASE 2 Whole Disk IMPORT + EXPORT PLAN

Issue: #56
Purpose branch: `feature/shino80-whole-disk-import-export-phase2-20260929`
Live main baseline: `ff04df719e19d517faeea26e09cfbc912bb2cd18`

Status: COMPLETED / REVIEWED / MERGED

## Purpose

SHINO-80のA:/B:両driveについて、CLASSIC whole-disk mediumをhost fileへbyte-exactにEXPORTし、そのfileを後からIMPORTして安全に復元できるようにする。

PHASE 1で確立したdual-drive、removable-media lifecycle、A-only autoboot、guest I/O boundaryを維持しながら、portable whole-medium interchangeを追加する。

IMPORTとEXPORTは同一media I/O境界を扱うため、一つのbounded implementationとして完成させる。

## Source of Truth

実装開始時のsource of truthはGitHub reviewed `main`。Issue/branch作成直前のlive mainは `ff04df719e19d517faeea26e09cfbc912bb2cd18`。

設計根拠はGD上のPHASE 2 基本設計 v0.1、詳細設計 v0.1、QA設計 v0.1、確定候補 v1。

repository再開時は `README.md → AGENTS.md → snapshot/CURRENT_SNAPSHOT.md → snapshot/LAST_RUN.md → snapshot/NEXT_CHAT_PROMPT.txt → snapshot/SNAPSHOT_MANIFEST.md` の順序を維持する。

## Scope

- A:/B:両driveのSHINO-80 CLASSIC whole-disk EXPORT
- INSERTED / EJECTED両状態からのEXPORT
- A:/B:両driveのSHINO-80 `.s80d` IMPORT
- transactional IMPORT confirmation
- POWER OFF only guard
- A/B canonical medium ownership維持
- shared desktop/compact Disk Inspector UI
- browser automated QAとHuman device QAの更新

## Non-targets

- EXPORT-only / IMPORT-onlyへの再分割
- POWER ON hot swap / live snapshot
- IndexedDB / browser reload persistence
- server-side DISK CABINET / media library
- factory restore / recent disks
- 720 KiB等large-media profile / multi-profile container
- C:/D:追加
- individual CP/M file bridge
- foreign legacy CP/M raw image auto-detection、geometry/profile chooser、foreign boot compatibility
- CPU / Bus / ROM / CBIOS / CP/M semantics変更
- 公開サイト反映

## Host File Contract

- extension: `.s80d`
- payload: raw 256,256 bytes
- wrapper / JSON / Base64 / compressionなし
- MIME: `application/octet-stream`
- IMPORT validation: read成功 + `byteLength === 256256`
- filename / extension / MIMEだけではvalidationしない
- EXPORT suggested filename:
  - `SHINO80_DRIVE_A.s80d`
  - `SHINO80_DRIVE_B.s80d`

## Media Ownership Contract

各driveは一つだけcanonical mediumを所有する。

- INSERTED: block device slotがcanonical owner
- EJECTED: drive固有shelfがcanonical owner
- IMPORTはlibrary entry追加ではなくcanonical medium置換
- INSERTEDへIMPORT後もINSERTED
- EJECTED+shelfへIMPORT後もEJECTED
- 真EMPTY時のみIMPORT imageをINSERTEDとして装着するが、EMPTYを通常UI modeとして新設しない

## IMPORT Transaction Contract

`target drive固定 → file chooser → full read → validate → pending → CONFIRM → commit` の順。

- CONFIRM前は既存canonical mediumを変更しない
- commit前にPOWER OFF、target、expected ownership state、byte lengthを再検証する
- invalid file / read error / CANCEL / ownership change / POWER ONではatomic no-op
- POWER ONへ遷移したらpending importを即破棄し、POWER OFFへ戻っても復元しない

## Single Pending Rule

pending importはworkbench全体で同時に1件のみ。

- A: pending中でもB:のEJECT / REINSERT / EXPORTは許可
- B: pending中でもA:のEJECT / REINSERT / EXPORTは許可
- pending対象drive自身のEJECT / REINSERTはUI・handler双方で禁止
- pending存在中の新規IMPORT開始は別driveを含め禁止
- CONFIRM / CANCEL / POWER ON破棄後に次IMPORTを許可

## UI Plan

既存 `diskInspectorHtml(drive)` とshared inspector action pathを拡張する。

- `EXPORT DISK IMAGE`
- `IMPORT / REPLACE DISK IMAGE`
- `IMPORT PENDING`
- `CONFIRM IMPORT`
- `CANCEL`

新major paneや `window.confirm` は追加しない。

A: pending時のみbootability未検証warningを表示する。

hidden file inputはtemplateに一つだけ追加する。

## Expected Source Changes

- `src/app/shino80-workbench-v0.0.2.js`
- `src/app/shino80-workbench-v0.0.2.template.html`
- 必要最小限のworkbench CSS
- `tests/browser_smoke_v0.0.9.cjs`
- 必要に応じてcurrent spec / technical manual / snapshot / worklog等のrepo文書

block device APIは既存 `mountImage / exportImage / eject` で足りる見込み。

deploy generated filesはsrc/buildから再生成し、手編集しない。

## Implementation Steps

1. live mainとrepository cockpitを再確認する
2. Implementation Issue #56をsource contractとして使う
3. purpose branch `feature/shino80-whole-disk-import-export-phase2-20260929` で作業する
4. active PLANを `plan/head` に維持する
5. host media state/helperとDisk Inspector actionを実装する
6. hidden file inputとIMPORT async pathを実装する
7. EXPORT download pathを実装する
8. pending confirmation / error message / POWER cancellationを実装する
9. automated browser regressionを拡張する
10. unit/build/browser testを実行する
11. current docs / snapshot / worklogを実装結果に同期する
12. final branch historyをmain基点のone logical commitへ整えてPRを作成し、Human Review待ちで停止する

## Accuracy / Boundary Requirements

- host actionはsynthetic Bus I/Oを生成しない
- A:のみautoboot source。B: never autobootを維持
- A:へのIMPORTではbootability / filesystemをhost側で検証・修復しない
- boot不可なら既存ROMがMON fallback
- SHINO-80 `.s80d` round-tripとforeign legacy CP/M ingestionを混同しない
- Debugger/Inspectorはobserver/host controlでありguest execution pathを迂回しない

## Risks

- async file read中のPOWER/state変化による誤commit
- A/B target取り違え
- INSERTEDとEJECTED shelfのownership二重化
- object URL revoke timingによるdownload failure
- mobile/iOS save/shareとdesktop downloadの挙動差
- Disk Inspector拡張によるcompact overflow
- 既存boot/CP/M regressionの見落とし

single pending、commit再検証、defensive copy、responsive QA、guest-visible round-tripで抑える。

## QA

```bash
pnpm test
pnpm run build
pnpm run build:manual
pnpm run test:browser
git diff --check
```

Automated browserで以下を確認する。

- A/B byte-exact EXPORT
- INSERTED/EJECTED source
- IMPORT pending/confirm/cancel
- invalid-size atomic no-op
- POWER guard
- single pending
- A/B isolation
- Bus trace不変
- B: WORK.COM guest round-trip
- A: normal boot restore
- A: nonbootable → MON fallback
- 390x844 / 1280x900 / 900x400 responsive QA

Human QAではiPhone/Safariとdesktop/Edgeの実ファイルflowを確認対象にする。

## Success Criteria

- A/B両driveでwhole-disk EXPORT/IMPORTが動く
- EXPORT bytesがcanonical mediumと完全一致
- IMPORTはCONFIRM前に既存mediumを変更せず、失敗時atomic no-op
- POWER OFF guardがUIとhandler双方にある
- canonical ownershipが崩れない
- Bus boundaryを破らない
- A-only autoboot / B never autobootを維持
- 全regression PASS
- repo cockpitが次セッションからREADME正規順で現在地を復元できる

## Git / Human Authority

- mainへ直接pushしない
- one environment / one writer / one purpose branch
- final PR branch historyはone logical commitを原則とする
- PR作成後はHuman Review待ちで停止
- Humanの明示指示なしにmergeしない
- 篠宮大飯店preview/publicationは別repository・別Human GO

## Closeout

- PR #57 merged by explicit Human GO
- reviewed main merge: `8c3e1896db4c68cfc1746ed2ebca38d624ef4dc1`
- Issue #56 closed completed
- active PLAN archived on 2026-09-29
