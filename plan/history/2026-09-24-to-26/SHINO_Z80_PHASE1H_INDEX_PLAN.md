# PHASE 1H — DD/FD index execution

2026-09-26 JST. Resume after Human power-event report; local bb0daeb clean
and aligned with origin after fetch. Parent PR #23 remains unmerged.
Branch feature/shino80-z80-index-20260926. One writer, no automatic merges.

Implement IX/IY pairs, index halves, signed indexed memory and unaffected
BASE fallback, repeated prefixes (last wins), ignored index before ED.
Keep real H/L for LD H/L,(index+d) and LD (index+d),H/L; EX DE,HL and EXX
are unaffected. DD/FD CB remains explicit unsupported PHASE1I; do not silently
execute ordinary CB semantics. Prefixes consume M1/R and time but retire one
instruction; prefixed EI must preserve its own inhibition boundary.

Sources: Zilog UM008011-0816 https://www.zilog.com/docs/z80/um0080.pdf;
Sean Young v0.90 https://datasheets.chipdb.org/Zilog/Z80/z80-documented-0.90.pdf
(index substitution exceptions and prefix behavior); SingleStepTests/z80 MIT,
pinned ebe1875d48f374bcfd4b505d8eb8ee751568b5f7. No external code copied.

Risks: incorrect H/L substitution, displacement ordering/sign/wrap, added
prefix timing for conditional paths, stack byte order, accidental state swap,
EI delay, repeated prefix handling. Use explicit operand access, not temporary
HL/index register swapping. Keep all memory traffic through Bus and ROM guards.

Accuracy remains architectural state, F/F' D7 and total T-states; X/Y/WZ/P/Q,
interrupt dispatch and pin waveforms deferred. No BIOS, CG-ROM, Bus, pacing,
MON enhancements, or indexed-CB implementation this phase.

QA: focused independent units across pair/half/displacement/exception paths,
all 252 non-prefix terminal bytes for each family, prefix-chain and EI checks;
external DD/FD 252,000 each if inventory matches; BASE/CB/ED 588,000 recheck.
All package stages, reproducible one-page build, browser STEP smoke and
truthful capability text. Record per-opcode/source/fixture hashes and exclusions.
After PASS: spec/worklog/snapshots, one logical commit/push and stacked PR.

## Outcome

2026-09-26: scope implemented. DD/FD 504,000 and BASE/CB/ED 588,000 external
cases PASS, zero failures. Focused units, all package stages, source hashes,
reproducible build, diff check and PC/compact Chrome STEP smoke PASS.
Proceed to planned single-commit/stacked-PR checkpoint. Next PHASE1I.
