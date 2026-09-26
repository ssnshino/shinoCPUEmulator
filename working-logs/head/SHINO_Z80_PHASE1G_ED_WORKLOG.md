# PHASE 1G ED worklog

2026-09-26 JST. Human authorized continuing CPU completion before MON expansion.
Branch feature/shino80-z80-ed-20260926 on 42d04f7 / PR #22. Single writer.
No merges, no production deployment. One logical rollback commit after QA.

## Changes

Plan first: SHINO_Z80_PHASE1G_ED_PLAN.md. Spec: SHINO_Z80_PHASE1G_ED_SPEC.md.
Decoder classifies 58 defined, 18 alias, 2 undocumented I/O, 178 unused slots.
Core executes ED via Bus; arithmetic/flag helpers include repeat-I/O H/PV.
RETI/RETN CPU-state behavior exists, not peripheral daisy-chain/interrupt dispatch.
UI capability row now reports 78 active / 178 unused NOP and oracle 80 files.
BIOS, Monitor, CG-ROM, Bus and host scheduler source untouched.

## Verified

- All 256 ED slots exercised; unused-NOP classification and state preservation.
- Independent 16-bit arithmetic: 1,572,864 cases; RRD/RLD: 131,072 cases PASS.
- NEG full byte-domain aliases; I/R, IFF, IM, EI-delay, stack and prefix wrap,
  register port capture, block iteration/termination, I/O order and ROM guards PASS.
- ED initial oracle run 80,000/80,000 PASS, no failing cases.
- Final pinned oracle run ED 80,000 + BASE 252,000 + CB 256,000 PASS; zero failures.
  588,000 unique baseline cases at this candidate. The initial ED rerun is not
  added again. Final reports: code/head/SHINO_Z80_PHASE1G_ED_ORACLE_QA.json,
  SHINO_Z80_PHASE1G_BASE_RECHECK_QA.json, SHINO_Z80_PHASE1G_CB_RECHECK_QA.json.
  Source and fixture SHA-256 hashes included. Flags mask D7, explicit exclusions.
- All package test stages via bundled Node PASS (npm not in shell PATH):
  BASE/CB/ED, machine, BIOS/MON, keyboard, pacing, trace-ring, source and artifact.
- Browser plugin not available; installed Chrome via Node Playwright fallback.
  /tmp/shino80-ed-browser.cjs at file:///.../deploy/one_page_shino80_v0.0.9_z80_base_complete.html.
  Viewports 390x844 / 1440x1000. Page title/URL, self-test and MON boot PASS.
  CPU pane -> injected RAM ED B0 LDIR -> STEP twice -> byte copy 12/34,
  BC 2->1->0, PC 2000->2000->2002, R 0->2->4, T 0->21->37 PASS.
  Visible register updates, desktop mnemonic/capability/NOT TAKEN state PASS.
  No console/page errors, blank screen, error overlay or horizontal overflow.
  Screenshots /tmp/shino80-ed-390.png and /tmp/shino80-ed-1440.png inspected.
  This is mobile-sized Chrome, not physical iPhone/Edge verification.

## Closeout checks

Final source-hash validation, syntax, focused unit rerun, build reproducibility
and diff check PASS. Scope review confirms no firmware/Bus/scheduler changes.
Handoff HTML: SHINO80_ED_QA_20260926.html (139176 bytes).
SHA-256: 44ac42d3275776eab45f996b447aa74857b49662d9eec671b1e28114efd07d33.
Commit/push and stacked PR follow; no merge authorized.

## Resume

PHASE 1G candidate complete within documented-state/total-T scope; Human review
and predecessor integration pending. Next PHASE 1H DD/FD; create its own plan.
Then indexed CB, interrupt/precision closeout. Do not resume MON expansion or
merge PRs without the appropriate Human instruction. Review actual Git state.

## Update History

- 2026-09-26 — ED implementation, external verification, browser smoke and handoff.
