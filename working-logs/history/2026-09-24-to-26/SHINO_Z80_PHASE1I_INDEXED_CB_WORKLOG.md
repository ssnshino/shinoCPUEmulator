# PHASE 1I indexed CB worklog

2026-09-26 JST. Human authorized continuation. Parent e01d5ed / PR #24.
Branch feature/shino80-z80-indexed-cb-20260926. One writer, no merge.
Plan first: SHINO_Z80_PHASE1I_INDEXED_CB_PLAN.md. Spec: corresponding SPEC.md.

## Changes

Decoder/executor for 256 DDCB and256 FDCB encodings. Non-M1 final opcode read,
signed addressing, real-register copies, no BIT writes/copies, ROM-preserving
computed-result copy. Existing CB flags helpers reused without changes.
Previously unsupported-prefix tests now assert execution. UI capability
shows all families but explicitly leaves interrupt/internal precision open.
No BIOS/MON, CG-ROM, Bus, flags-helper or scheduler source changes.

## Verification

- 262,144 independent exhaustive cases: both families x256 encodings x256
  values x2 carries. Results, all real registers, indices, D7/full-RES-SET F,
  20/23 timing, EI retirement, R, bytes, M1/refresh and ordered Bus events PASS.
- 1,536 displacement/wrap cases; all512 encodings under ROM protection;
  BIT aliases, repeated prefixes, four-byte PC wrap and self-overlapping
  final opcode memory PASS.
- Initial external DDCB256k + FDCB256k PASS; no failures.
- Final all-family external: 1,604,000 PASS, zero failures. Per-opcode QA
  JSONs in code/head/SHINO_Z80_PHASE1I_{DDCB,FDCB,DD,FD,BASE,CB,ED}_QA.json.
  Fixture/source hashes retained; source hashes verified against final files.
  D7 comparison exclusions explicit; repeated runs not double-counted.
- All package stages via bundled Node PASS (npm absent shell PATH), including
  all old CPU, machine/BIOS/MON/keyboard, pacing/ring, source/build/artifact.
- Browser plugin not available; installed Chrome + Node Playwright fallback.
  /tmp/shino80-indexed-cb-browser.cjs opens standalone deploy file at390x844
  and1440x1000. URL/title/self-test/MON boot PASS; no blank/error overlay,
  console errors/warnings or horizontal overflow. CPU pane then3 STEP clicks:
  RLC (IX-1),B -> memory/B=01; BIT0 alias -> no writes/H/L copies;
  RES0 (IY+1),L -> memory/L=00; indices unchanged, PC200C, R6,66T PASS.
  Visible registers/capability/mnemonic PASS. Screenshots inspected:
  /tmp/shino80-indexed-cb-390.png, /tmp/shino80-indexed-cb-1440.png.
  Physical iPhone/Edge has not been retested in this run.
- Syntax, diff review/check and reproducible build PASS. HTML146395 bytes,
  SHA-256 a59e02464fbe4c93e819a42acdb6261855494875aae491c715085787f18add6b.
  Handoff filename SHINO80_INDEXED_CB_QA_20260926.html.

## Closeout / next

One logical commit and stacked PR after QA; no automatic merge. Plan/spec
and restart docs updated. Next PHASE1J, beginning with a bounded interrupt
plan (NMI/INT, EI/HALT, IM0/1/2) before precision expansion. Do not claim full
Z80 completion or resume MON expansion automatically. Predecessor PRs need
Human integration authorization. Inspect actual branch/HEAD on resumption.

## Update History

- 2026-09-26 — Indexed CB implementation, full external regression and browser QA.
