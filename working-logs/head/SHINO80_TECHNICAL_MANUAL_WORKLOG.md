# SHINO-80 Technical Manual — worklog

2026-09-26 · branch `feature/shino80-technical-manual-20260926`
Parent `fa73816baaac9121fb14f3b832d1a2f1305e0031` / PR #26.

## Request / scope

Human approved an online-style machine-language reference and CPU/peripheral
concept diagram. Implemented as independent, offline standalone HTML, with
Japanese explanation and smartphone layout. No FPGA, CPU/ROM/device changes,
emulator redesign, merge or public deployment.

## Delivered

`src/manual/{index.html,manual.css,manual.js,instruction-notes.cjs}`,
`scripts/build-technical-manual.cjs`, generated
`deploy/shino80_technical_manual_v0.1.html`, new tests and package scripts.
Matching PLAN/spec plus README/restart entry updates are one logical unit.

1,780 encoding records, all7 families, official/unofficial/alias/unused/ignored
classification, fetch-order bytes, conditional and repetition timing, flags,
fixed-state execution examples including alternate registers and memory/I/O.
Examples are implementation demonstrations, explicitly not independent oracles.
Search/filter/page/reset/deep-links; connection diagram with component details
and return link; exact memory/keyboard map; current BIOS/MON guide; actual
4096-byte CG atlas; official/research references and source hashes.

## Decisions / corrections

- CG-ROM renderer-local, VRAM in RAM; debugPeek observer is not CPU DMA.
- Future FDD/interfaces dashed and explicitly unimplemented; no invented ports.
- Current MON only H/?/C/D xxxx. Reserved vectors do not imply working drivers.
- Generated HTML separated from emulator HTML; works without server/CDN/font.
- ImageGen concept call failed authentication401; no credential troubleshooting
  or alternate API used. Existing SHINO palette/native SVG fallback recorded.
  No accepted raster concept or fidelity score claimed.
- Browser plugin not available. Existing Playwright1.62.1 + installed Chrome,
  no dependency install, used against file URL in offline mode.
- Visual inspection led to smaller diagram desktop footprint, larger SVG type,
  label background stroke, direct scroll to selected component and return link.
- Early browser harness reads raced hashchange; fixed harness to wait for
  rendered target state, then reran both sizes successfully.

## Verification

- Full package stage chain executed with bundled Node (npm absent from PATH):
  NOP, phases1A–1J,2A/2A.1, BIOS/keyboard/MON, pacing/trace, source syntax,
  emulator build/artifact, manual — all PASS.
- Manual: 1780 unique IDs, family counts, all byte lengths, allowed classes,
  all example T-states in descriptor bounds, fixed/preserved flag agreement,
  independent encoding/result/flag fixtures, machine constants/CG hash,
  no external assets, inline-JS parsing and deterministic repeated build PASS.
- Historical external1,604,000 oracle count quoted with its source scope;
  no external oracle rerun needed or claimed for this documentation-only change.
- Offline real Chrome1440×1000 and390×844: identity/nonblank/no overlay,
  search3E42→LD A,n, empty/XSS-shaped query, reset, DDCB alias56 filter,
  pagination, chapter state retention, direct LDIR/NOP links and browser back,
  CG-ROM component/details/back, memory/BIOS content,256 glyphs/37h selection,
  actual canvas pixels. Runtime/console errors/warnings0; HTTP requests0;
  document horizontal overflow0. Visually inspected both sizes.
- Temporary harness/screenshots outside repo:
  `/tmp/shino80-manual-qa.FBAyLc/` (ephemeral; screenshots not source assets).
  `reference-1440.png`, `reference-390.png`, `system-1440.png`,
  `system-390.png`, `cgrom-1440.png`, `cgrom-390.png`.
- CPU/firmware/device/machine/app/UI source and old emulator deploy diff empty.

## Handoff / rollback

Build with `npm run build:manual`; test with `npm run test:manual` or `npm test`.
One logical feature commit with this plan/spec/log, then stacked PR against
`feature/shino80-z80-accuracy-closeout-20260926`. No main merge authorized.
Rollback this single manual commit; underlying emulator is unchanged.
Remaining: Human iPhone/browser review, PR-stack review and explicit integration
authorization. Future CPU/BIOS changes require checking authored manual facts
and baseline labels, not just regenerating descriptor data.
