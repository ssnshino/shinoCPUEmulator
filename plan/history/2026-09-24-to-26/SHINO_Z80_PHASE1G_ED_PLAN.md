# PHASE 1G — ED execution

2026-09-26 JST. User approved continuing CPU completion. Single writer.
Branch feature/shino80-z80-ed-20260926, parent 42d04f7 / PR #22 (unmerged).

## Scope and sources

Implement defined ED instructions, aliases, block transfer/search/I/O,
16-bit ADC/SBC, interrupt-mode/return instructions and I/R transfers.
Classify unused encodings separately as 8-T-state two-byte NOPs, not as
documented instructions. External fixture inventory has 80 ED files
(40..7F plus A0..A3/A8..AB/B0..B3/B8..BB); never claim 256 external files.

References: Zilog UM008011-0816 https://www.zilog.com/docs/z80/um0080.pdf;
SingleStepTests/z80 pinned ebe1875d48f374bcfd4b505d8eb8ee751568b5f7 (MIT);
Sean Young https://www.z80.info/zip/z80-documented.pdf;
David Banks original hardware findings:
https://github.com/hoglet67/Z80Decoder/wiki/Undocumented-Flags.
No external emulator implementation copied.

## Accuracy / risks

Keep F mask D7 and total-T-state policy; X/Y, WZ/P/Q and pin precision remain
excluded. Block repeats execute one iteration per step, PC rewinds by two
when continuing, 21 vs 16 T-states. Repeating I/O has extra H/PV behavior
even under D7; implement against research and external cases. Bus owns all
data/I/O reads and writes, including ROM protection. RETI/RETN restore IFF1
from IFF2, but interrupt dispatch and peripheral daisy-chain remain Phase1J.
Risks: BASE/CB regression, B pre/post-decrement port address, memory wrap,
repeat conditions, carry/overflow, LD A,R fetch increments, duplicate retire.

## Changes / non-goals

CPU decoder/core/flags, focused tests, oracle runner, capability text,
generated HTML and records only. No BIOS/MON/CG-ROM/Bus/pacing changes.
DD/FD/indexed CB and interrupt dispatch are not part of this candidate.

## QA / commit point

Independent units for arithmetic edges, aliases, memory/port order, repeat
and termination, wrap, R/IFF/EI, flags, unused classification and ROM.
Run 80,000 external ED cases, BASE 252,000 and CB 256,000 regressions; save
per-opcode results and source/fixture hashes. All package stages, reproducible
build and standalone browser smoke. On success update spec/worklog/snapshot,
commit one logical change, push and open stacked PR. Never auto-merge.

## Outcome

2026-09-26: implementation and all planned QA PASS. External ED 80,000 and
BASE/CB 508,000; unused NOPs separately classified. Source/hash/reproducible
build and PC/compact Chrome STEP checks PASS. See PHASE1G_ED worklog/spec.
Proceed to the planned one-commit/stacked-PR checkpoint; next phase is DD/FD.
