# PHASE 1I — DDCB/FDCB

2026-09-26 JST. Human authorized continuation. Parent e01d5ed / PR #24,
clean aligned local branch. Branch feature/shino80-z80-indexed-cb-20260926.
Single writer, no automatic merges.

Implement 256 final-byte encodings per IX/IY family: memory rotate/shift,
BIT, RES, SET; undocumented register-copy forms use real B/C/D/E/H/L/A.
BIT aliases must neither write memory nor copy to registers. Signed
displacement and effective-address wrap; memory stays behind Bus/ROM guards.
The last opcode byte is not M1: only index prefix and CB increment R.
One retirement and EI boundary; total timing 20 BIT / 23 read-modify-write,
plus 4 for each redundant index prefix. Keep inherited prefix-loop host guard.

Sources: Zilog UM008011-0816 https://www.zilog.com/docs/z80/um0080.pdf;
Sean Young v0.90 https://datasheets.chipdb.org/Zilog/Z80/z80-documented-0.90.pdf;
SingleStepTests/z80 (MIT), ebe1875d48f374bcfd4b505d8eb8ee751568b5f7.
No third-party implementation copied. Continue F/F' D7 / architectural state
and total T-states policy; X/Y/WZ/P/Q/pin waveforms excluded. Interrupt
dispatch and broader precision remain PHASE1J, not part of this candidate.

Risks: accidental third R increment, displacement/opcode ordering, BIT copies,
H/L vs index-half destinations, address recomputation after register write,
ROM write behavior, prefix timing. No BIOS/MON/CG-ROM/Bus/pacing changes.

QA: independent all encodings/all operand bytes/both carry values; address
wrap, all displacements, repeated prefixes, PC/R wrap, flags, write/no-write,
register-copy destinations, bus order and ROM. External DDCB/FDCB 256k each,
all prior families 1,092k recheck with source/fixture hashes. Full package,
reproducible build, PC/mobile-sized Chrome STEP. Record spec/worklog/snapshots,
then one logical commit/push and stacked PR only after PASS.

## Outcome

2026-09-26: all planned checks PASS. New512k external and prior1,092k
recheck PASS, zero failures;262,144 exhaustive units and displacement/ROM
checks PASS. Browser PC/compact STEP and reproducible build PASS. Proceed
to the planned commit/stacked-PR checkpoint; PHASE1J remains next.
