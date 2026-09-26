# SHINO-80 SOURCE / DEPLOY RESTRUCTURE PLAN v0.1

Created: 2026-09-24T16:50:00+09:00
Status: IMPLEMENTED CANDIDATE

## Purpose

Move SHINO-80 from a one-page-as-source workflow to a modular-source / one-page-build workflow before CPU instruction implementation expands significantly.

## Change

Before:

```text
one_page_shino80_v0.0.2_ui_foundation.html  ← visible root artifact
src/...
```

After:

```text
src/       ← development source of truth
scripts/   ← build
tests/     ← QA
deploy/    ← generated standalone HTML
```

## Preserve

- exact v0.0.2 runtime behavior
- one-page standalone promise
- smartphone local execution
- current CPU/bus/UI source
- current test coverage

## Non-goals

- no CPU instruction changes
- no UI redesign
- no peripheral implementation
- no bundler/framework dependency
- no npm third-party dependency

## Success

- root one-page artifact removed
- identical artifact available under `deploy/`
- build writes only to `deploy/`
- artifact tests read `deploy/`
- browser smoke reads `deploy/`
- source layout documented
