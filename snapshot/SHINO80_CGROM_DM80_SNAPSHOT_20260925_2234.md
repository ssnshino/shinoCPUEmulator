# SHINO-80 CG-ROM / DM-80 SNAPSHOT — 2026-09-25 22:34 JST

This is a branch-specific checkpoint for the ChatGPT-side CG-ROM / DM-80 work.
It intentionally does **not** replace `snapshot/CURRENT_SNAPSHOT.md`, because shared snapshot files are reserved for later integration with the parallel BIOS / Monitor branch.

## Repository checkpoint

- Repository: `ssnshino/shinoCPUEmulator`
- Base main at branch start: `d46de4e460a148c2d52a3024cc0767e48e5a1d64`
- Branch: `feature/shino80-cgrom-native8x16-dm80-20260925`
- Implementation head before this snapshot: `52edcafa9a76702b8b22fcd69a26a527488959d0`

## Scope

This branch is display-side only.

### Owned here

- native SHINO-80 CG-ROM
- CG-ROM bitmap design / storage
- DM-80 scaling behavior
- CRT / AA / scanline / phosphor presentation
- display-side regression tests
- generated one-page artifact for branch-local visual validation

### Explicitly not owned here

- SYSTEM ROM / BIOS / Monitor ABI
- Keyboard / GETCHAR
- FDD / Disk BIOS
- Serial / Printer
- CPU core / prefix instruction implementation

## Parallel Codex work boundary

Parallel branch planned by Codex:

`feature/shino80-minimum-bios-monitor-20260925`

Codex owns:

- `src/firmware/shino80/shino80-system-rom.js`
- BIOS / Monitor PLAN / SPEC / test / worklog
- BIOS vectors and memory layout
- PUTCHAR / NEWLINE / CLS / PRINT_STRING
- minimum SHINO MONITOR entry
- CPU-through-VRAM BIOS output verification

This CG-ROM branch does **not** modify `src/firmware/shino80/shino80-system-rom.js`.

Codex side does not modify:

- `src/firmware/shino80/shino80-cgrom.js`
- `src/machine/shino80/shino80-video.js`
- CRT / rendering files

Shared files such as README, global snapshots, package.json and final deploy artifacts should be reconciled after both branches are ready.

## CG-ROM decision history

The initial repository CG-ROM was a 5x7 bring-up font expanded vertically into an 8x16 cell.

Local visual studies explored:

- native 8x16 bitmap generation
- hand-tuned SHINOMIYA printable ASCII
- 7-segment-style digits
- full 0-9 family redesign
- reference-informed 4 / 7 studies using classic 8x16 bitmap-font design principles

Human visual review rejected candidates where 4 / 7 looked like foreign glyphs or where digit 4 appeared vertically smaller.

Final branch candidate selected for integration:

- family basis: accepted native SHINOMIYA 8x16 set
- 4 / 7: v0.5 **A / conservative family-fit**
- digit 1: left unchanged from the accepted family
- digit 4 vertical active bounds: y=2..13
- digit 7 vertical active bounds: y=2..13

## Native CG-ROM format

- size: **4096 bytes**
- glyph count: **256**
- glyph cell: **8x16**
- bytes per glyph: **16**
- address rule: `code * 16`
- row format: one byte per raster row
- bit7: leftmost pixel
- unused/reserved glyphs: zero-filled
- browser-font runtime dependency: **none**

ROM integrity:

- SHA-256: `78ad2a69fce15801f07766b05f1f9cd9179eb7e974fb22d7f83e22e2d34dd194`
- CRC32: `659A7798`

The source representation is now a reviewable per-glyph HEX table in:

`src/firmware/shino80/shino80-cgrom.js`

The temporary base64 source representation was discarded after validation exposed an embedding-length mismatch.

## DM-80 rendering decision

Logical VIDEO BOARD raster remains:

`80 x 25 characters = 640 x 400 pixels`

Previous behavior:

- forced `image-rendering: pixelated / crisp-edges` at all displayed sizes

Current branch behavior:

- native-size / integer enlargement: **pixel-perfect**
- reduction / non-integer scaling: **gentle browser AA**
- scanline / phosphor / glass treatment: DM-80 presentation layer only
- CG-ROM bitmap source itself remains strict 1-bit data

Runtime render mode is exposed on `#crtViewport` as:

- `PIXEL`
- `AA`

## Changed files on this branch

Display implementation:

- `src/firmware/shino80/shino80-cgrom.js`
- `src/ui/shino80-workbench-v0.0.2.css`
- `src/app/shino80-workbench-v0.0.2.js`

Regression / validation:

- `tests/shino80_phase2a1_power_reset.test.cjs`
- `tests/browser_smoke_v0.0.9.py`

Branch-local generated / documentation:

- `deploy/one_page_shino80_v0.0.9_z80_base_complete.html`
- `working-logs/head/SHINO80_CGROM_DM80_REFINEMENT_WORKLOG.md`

## Protected files confirmed unchanged

No branch diff exists under:

- `src/cpu/z80/z80-core.js`
- `src/cpu/z80/z80-decoder.js`
- `src/cpu/z80/z80-flags.js`

Also intentionally unchanged:

- `src/firmware/shino80/shino80-system-rom.js`

## Validation completed

Custom in-session execution of the repository display/machine regression files against the branch sources:

- PHASE 2A VIDEO + IPL: **PASS**
- PHASE 2A.1 POWER / RESET / CRT / DISPLAY: **PASS**
- CG-ROM size: **4096 bytes PASS**
- glyph 4 vertical bounds: **[2,13] PASS**
- glyph 7 vertical bounds: **[2,13] PASS**

Locked selected digit bytes:

- digit 1: accepted unchanged family form
- digit 4: selected conservative family-fit form
- digit 7: selected conservative family-fit form

## Final validation status — 2026-09-25 23:46 JST

Completed on GitHub Actions run `36148649953` at QA head
`560e62e3be982d2c5eed6bc7d4bb32ba5d229474`:

- full repository `npm test`: **PASS**
- source syntax: **PASS**
- PHASE 2A: **PASS**
- PHASE 2A.1: **PASS**
- build: **PASS**
- artifact test: **PASS**
- real Chromium browser smoke: **PASS**
- actual mobile / desktop DM-80 render capture: **PASS**
- actual branch CG-ROM glyph QA render: **PASS**
- `git diff --check`: **PASS**
- generated artifact reproducibility: **PASS**
- tracked working tree clean after rebuild: **PASS**

Human visual approval against the actual Chrome-rendered DM-80 and glyph-QA
screenshots:

> **PASS — 「OK 表示がきれいになった！」**

Display-side work is complete and ready for integration.

Still pending by design:

- integration test after BIOS / Monitor branch merge

## Integration note

Do not hand-edit the final distribution artifact during integration.

Repository rule remains:

> One-page is the distribution format, not the development source format.

After CG-ROM / DM-80 and BIOS / Monitor branches are reconciled:

1. merge source changes
2. reconcile shared tests / docs
3. rebuild with `npm run build`
4. run complete test suite
5. update global snapshot / README if appropriate
6. perform human display verification

## Completion / freeze rule

After the final cleanup commit, this branch is frozen for Codex integration review.
Do not add further pushes after reporting the final head SHA unless Human explicitly
reopens the display work.

## Resume point

If work resumes from this snapshot:

1. read repository `README.md`
2. read `AGENTS.md`
3. read global snapshot files
4. read this branch-specific snapshot
5. inspect the parallel BIOS / Monitor branch state
6. do not modify CPU core during display-only work
7. do not modify SYSTEM ROM while Codex owns BIOS / Monitor work

ごっごっごっごっ♪
