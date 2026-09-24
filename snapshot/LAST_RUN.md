# LAST RUN
## ONE-PAGE Z80 COMPUTER / SHINO-80

Updated: 2026-09-24T16:50:00+09:00

## Task

Prepare SHINO-80 for substantial code growth by separating modular development source from the standalone one-page distribution artifact.

## Result

Candidate repository model:

```text
src/      -> edit here
scripts/  -> build here
tests/    -> verify here
deploy/   -> distribute from here
```

The current reviewed v0.0.2 standalone HTML content is preserved unchanged, but its canonical path moves from repository root to:

`deploy/one_page_shino80_v0.0.2_ui_foundation.html`

## Build

```bash
npm run build
```

now writes to `deploy/`.

## Runtime

No CPU / bus / UI runtime behavior changed.

## Next

After Human accepts this repository layout, begin Z80 Instruction Architecture work in modular `src/cpu/z80/`.
