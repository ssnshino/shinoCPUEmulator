# PHASE 1J — Interrupt and accuracy closeout

Created: 2026-09-26T09:10:24+09:00
Parent: d8d30bc / PR #25. Human requested completion; merge remains Human-only.

## Goal / acceptance

Finish the instruction-level CPU milestone: all existing instruction families,
full F (including X/Y), NMI and maskable INT in IM0/1/2, HALT exit, EI delay,
refresh increments and observable interrupt bus transactions. Validate all
1,604,000 pinned external instruction cases with FF rather than D7, plus an
independent interrupt/sequence matrix. WZ/Q state is implemented and verified
where required to make multi-instruction flag behavior reliable.

## Sources

- Zilog UM008011-0816: https://www.zilog.com/docs/z80/um0080.pdf
- Hardware findings: https://github.com/hoglet67/Z80Decoder/wiki/Undocumented-Flags
- https://github.com/hoglet67/Z80Decoder/wiki/NMI-during-EI-Anomaly
- SingleStepTests/z80, pinned ebe1875d48f374bcfd4b505d8eb8ee751568b5f7.
  Fixtures only, no external emulator implementation copied.

## Scope / accuracy / exclusions

Core, flags, Bus interrupt interface, oracle harness, tests, capability wording,
generated standalone HTML and restart records. No BIOS/MON command expansion.
Instruction boundary interrupt input and M-cycle abstract bus events; NOT
pin/cycle-perfect silicon. WAIT/BUSRQ arbitration, electrical edge timing,
manufacturer-specific variants and daisy-chain peripheral hardware are separate
future accuracy work. IM0 injects the acknowledge opcode; operands come from
memory. A multi-byte device-supplied instruction stream is not supported.

## Risks / QA

Old tests may encode the intentionally approximate X/Y policy; replace those
expectations with independently calculated results, never mask new failures.
Exercise flag-writing vs preserving instructions, WZ history, prefixes,
interrupt priority/hold/edges, EI sequences, nesting, stack/vector wrap, ROM
protection, timings and return notifications. Re-run every package stage, all
seven external oracle families, deterministic build and desktop/mobile Chrome
standalone boot/MON/CPU smoke. Record source hashes and explicit exclusions.

## Completion gate

No failing applicable check; reviewable single logical commit + stacked PR,
updated worklog/snapshot and standalone HTML. No automatic merge. The milestone
means functional/flags/interrupt/total-T-state completion, not cycle perfection.

## Result — 2026-09-26

Completed as review candidate. Comparison expanded beyond minimum: WZ/P/Q
also verified across all seven external families. 1,604,000 full-state cases
PASS; interrupt748 and XY589,824 checks PASS. Package regressions/build,
standalone Chrome390x844/1440x1000 and source-hash validation PASS. No merge.
See matching WORKLOG for evidence and explicit limits.
