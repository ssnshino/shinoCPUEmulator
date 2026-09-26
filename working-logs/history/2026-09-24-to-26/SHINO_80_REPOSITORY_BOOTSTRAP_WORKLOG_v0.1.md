# SHINO-80 Repository Bootstrap WORKLOG v0.1

Created: 2026-09-24T13:20:14+09:00

## Goal

空の `ssnshino/shinoCPUEmulator` を、SHINO-80研究を継続できるproject repositoryへ整備する。

## Reference repositories reviewed

### ssnshino/vectorRally

取り入れた考え方:

- READMEからの明確なstart order
- `AGENTS.md`
- `snapshot/`
- `plan/head/`
- `docs/head/`
- `working-logs/head/`
- `code/head/`
- PLAN → IMPLEMENT → TEST → WORKLOG → SPEC → SNAPSHOT
- PR-first
- 1 PR = 1 logical commit
- Human merge authority
- head/history navigation

### ssnshino/shinomiya-daihanten-infra

取り入れた考え方:

- source of truthをGitHub branchに固定
- candidate / deployed baselineの明示
- snapshot manifest
- operating boundaryを文書化
- Human authorized merge

## Bootstrap decisions

- default branchは既存Repository設定に合わせて `main`
- 完全空repoのため、branch parent作成用にREADMEだけmainへ初期commit
- 以後は `chore/repository-bootstrap-20260924` で1 logical commitを作成
- emulator codeはまだ書かない
- user-provided project conceptとfuture visionを別文書として保存
- assistant-generated Architecture DraftはDRAFTとして隔離
- Z80 researchをPHASE 0として追加
- 6502等future CPUを理由に過剰抽象化しないルールをAGENTSへ記載

## Result

Repository structure candidate created.

Runtime implementation/testはまだ存在しない。

Next: PHASE 0 Z80 research.
