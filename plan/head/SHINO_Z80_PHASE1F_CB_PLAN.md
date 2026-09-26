# PHASE 1F — CB 256

2026-09-26 JST. User authorized CPU completion before MON expansion.
Branch feature/shino80-z80-cb-20260926 on eea8dfc / PR #21. Historical
origin/feature/z80-phase1f-cb-complete-20260924 is only efcdd08 checkpoint,
not an implemented CB candidate. Single writer; no main merge.

Implement decode/execute all 256 CB second bytes: eight rotate/shift groups
(including SLL), BIT, RES, SET, registers and (HL). Correct flags under existing
documented mask D7, PC, two M1 fetches/R increments, one instruction/EI-delay
retirement, total 8/12/15 T-states, memory accesses through Bus. X/Y and WZ/P/Q
remain PHASE 1J precision scope; do not silently claim full silicon accuracy.

Sources: Zilog UM008011-0816, https://www.zilog.com/docs/z80/um0080.pdf;
SingleStepTests/z80 pinned ebe1875d48f374bcfd4b505d8eb8ee751568b5f7, MIT
https://github.com/SingleStepTests/z80. SLL behavior independently oracle tested.

Risks: BASE regression, BIT accidental writes, refresh/timing under prefixes,
H/L destination changing effective address, EI delay retired twice. Verify
unit/exhaustive flags, all encodings, PC/R wrap, bus ordering/ROM protection,
full old suite, external CB 256,000 and BASE 252,000 baseline if available.
Retain reproducible oracle runner + per-opcode summary, not raw third-party data.
Build standalone and browser smoke; update truthful capability labels/docs.
Commit/push one logical candidate after verification, stacked PR; no merge.
MON expansion, ED/DD/FD/DDCB/FDCB, interrupt dispatch and precision work deferred.
