# SHINO-80 Technical Manual v0.1

2026-09-26 · CPU/firmware baseline `fa73816` (PR #26 candidate, not reviewed main).

## Deliverable / authority

`deploy/shino80_technical_manual_v0.1.html` is a separate standalone manual,
not a replacement emulator and not a publicly hosted site. Open in a modern
browser; search, diagram and glyph rendering work offline. Only explicit
external source links use the network. No font/CDN/runtime dependency.

Authoring: `src/manual/` plus `scripts/build-technical-manual.cjs`.
Build: `npm run build:manual`; checks: `npm run test:manual` (also in `npm test`).
Do not edit generated HTML. When CPU/firmware changes, review authored facts,
baseline labels and tests as well as rebuilding: decoder generation alone
does not automatically update explanatory prose or validate CPU correctness.

## Content

- Searchable BASE252 / CB256 / ED256 / DD252 / FD252 / DDCB256 / FDCB256:
  **1,780 encodings**, including alias/unused/ignored-prefix entries.
- Mnemonic, bytes in fetch order, length, conditional/repeat T-states,
  Japanese semantics, documented flags and X/Y behavior.
- One-instruction examples generated in a separate CPU/Bus, with register
  (including alternate), memory and I/O changes. These are implementation
  demonstrations, not independent oracle results. Repeating instructions
  show one iteration; arbitrary prefix strings are not enumerated.
- Clickable logical system diagram; text alternatives; diagram back link.
- Memory/I/O map, current BIOS jump table and MON H/?/C/D xxxx.
- Actual 4096-byte CG-ROM atlas: 256 glyphs × 16 rows, bit7 leftmost.
- Source hashes, official/research links and accuracy boundaries.

Hash routes: `#reference/BASE-3E`, `#system/cgrom`, `#cgrom/41`.
Search accepts mnemonics, purpose text, byte patterns and full example bytes
(e.g. `3E42` matches `3E n`). Family/classification filters and paging combine.
Searching does not implicitly change the selected instruction; choose a row
to change the details. Query/filter state survives chapter navigation in-session.

## Important boundaries

The 1,780 inventory is not the 1,604,000-case historical PHASE1J oracle suite.
That suite has ED80k and other family counts described in the accuracy log.
The manual's generated examples do not rerun that external dataset.

VRAM is part of RAM; video observes it via debugPeek, not emulated DMA. CG-ROM
is renderer-local, not CPU-mapped. DIGITAL_MONO is a logical rendering contract,
not physical DisplayPort. FDD/serial/printer/physical video interfaces are
future/unimplemented; no I/O addresses invented. Reserved BIOS vectors are
RET stubs, not drivers or valid interrupt handlers. No FPGA implementation.

CPU milestone remains instruction-level, not electrical/pin-cycle-perfect.
WAIT/BUSRQ, hardware races and multi-byte device-fed IM0 are outside its scope.
See `SHINO_Z80_PHASE1J_ACCURACY_SPEC.md` for authoritative CPU limits.

## Design / QA

Modern dark documentation shell, readable Japanese sans + monospace data,
desktop list/detail and stacked mobile layout. Actual CG bitmap/SVG diagram,
not a generated illustration pretending to be wiring. No CPU or emulator UI edit.

ImageGen concept attempt was blocked by authentication401; no raster reference
or fidelity score exists. Existing SHINO visual language and browser screenshots
are the documented fallback. Browser plugin not available; regular Playwright
with installed Chrome, no dependency installation, used for offline QA.
Desktop 1440×1000 / mobile-sized 390×844 tested; real iPhone review remains.
