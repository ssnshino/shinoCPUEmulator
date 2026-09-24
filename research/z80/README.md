# Z80 Research

Current CPU research area for SHINO-80.

## Questions

- Z80 architectural stateの正確な最小集合は何か
- documented / undocumented flagsをどのaccuracy levelで扱うか
- prefix decodeをどう構造化するか
- R register / refreshをどの段階で正確化するか
- HALT / EI / interrupt edge caseをどうtestするか
- T-state / M-cycle / bus signal visibilityをどう表現するか
- official documentationと実機テスト由来suiteの差異をどう扱うか
- browser/Node双方で同一core testを走らせられるか

## Source policy

一次資料優先。

External implementationは比較資料であり、単独で正解扱いしない。

Research noteには可能な限り:

- source URL
- document title/version
- access date
- claim being supported
- uncertainty
- license if code/test data is reused

を残す。

## Candidate references to verify

- Zilog Z80 CPU official manuals
- SingleStepTests/z80
- raxoft/z80test
- ZEXDOC / ZEXALL lineage

ここにraw ROM dump / proprietary BIOS / copyrighted software imageを置かない。
