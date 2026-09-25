# PHASE 1H DD/FD worklog

2026-09-26 JST. Human authorized resume after a reported power interruption.
Fetched origin; bb0daeb local/remote alignment and clean tree confirmed.
Branch feature/shino80-z80-index-20260926, stacked on PR #23. Single writer.

## Work

Plan first: SHINO_Z80_PHASE1H_INDEX_PLAN.md. Spec: SHINO_Z80_PHASE1H_INDEX_SPEC.md.
Added index descriptor and explicit pair/half/displacement execution. Prefix
loop handles last-index-wins and ignored-before-ED with correct total timing,
R and EI retirement. Indexed CB intentionally remains explicit unsupported.
CPU Inspector truthfully reports DD/FD terminals and remaining indexed CB.
No BIOS/MON, CG-ROM, Bus, flags-helper or pacing-source changes.

## QA

- Focused units: 504 terminal slots, 20,480 signed displacement cases across
  address boundaries, exhaustive byte INC/DEC index halves, unaffected BASE
  equivalence for both flag conditions, pair/stack order, H/L exceptions,
  prefix chains, ignored-before-ED, HALT, EI, ROM and prefix-loop guard PASS.
- Initial test harness had false-versus-zero comparison from adding 0 to
  boolean fields. Corrected reference comparison; no CPU change needed.
- First external DD and FD runs: 252,000 each PASS, zero failures.
- Final source: DD252k + FD252k + BASE252k + CB256k + ED80k = 1,092,000
  external cases PASS, zero failures. Re-runs not double-counted as unique.
  Reports code/head/SHINO_Z80_PHASE1H_{DD,FD,BASE,CB,ED}_QA.json include hashes.
- Full package stages via bundled Node (npm absent from shell PATH) PASS:
  CPU phases through1H, machine, BIOS/MON, keyboard, pacing, trace, source,
  build and artifact. Independent old arithmetic/nibble exhaustive tests retained.
- Browser plugin not available; installed Chrome via Node Playwright fallback.
  /tmp/shino80-index-browser.cjs runs standalone deploy file at 390x844 and
  1440x1000. Title/URL, self-test, MON boot, no blank/error overlay, console
  and horizontal overflow PASS. Four actual STEP clicks execute LD IX,4001;
  LD (IX-1),5A; LD IY,3FFF; LD H,(IY+1). Memory4000=5A, H=5A, IX/IY intact,
  PC200F, R8 and 66T verified. Register/mnemonic/capability display PASS.
  Screenshots /tmp/shino80-index-390.png and /tmp/shino80-index-1440.png inspected.
  Physical iPhone/Edge not tested this run.

## Closeout

Review removed an unnecessary second BASE decode on the ordinary instruction
path; then reran full package, all five oracle families and browser smoke PASS.
Final source-hash/reproducibility/diff checks PASS. One logical commit follows.
Handoff: SHINO80_INDEX_QA_20260926.html (144838 bytes).
SHA-256: 19e35160cc3cc4a4f2aab1e122c4162ab0e13eb379b58e4637bb249e4e1a51d3.
Push/stacked PR, no merge.

## Next

PHASE1I DDCB/FDCB, then PHASE1J interrupt/accuracy. MON remains paused.
Do not call the full CPU finished. Integration of predecessor PRs needs Human
GO; no merge has been performed. Resume from this branch and current Git state.

## Update History

- 2026-09-26 — DD/FD implementation, oracle regression, browser and restart record.
