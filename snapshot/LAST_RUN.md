# LAST RUN — 2026-09-26 documentation cockpit closeout

## Goal

Make `README.md` the sufficient first entry for another AI/session and remove
completed candidate chronology from the normal restart path.

## Baseline verified before editing

- local `main` matched `origin/main` at `e75d8c0506a7b1bb711b54c352c8b04580cdddaf`
- working tree was clean
- open pull requests: none
- content publication was already deployed from content master `743b603`
- content Action `36224728565`: SUCCESS, exact SHA, local/public SHINO routes PASS

## Documentation changes

- replaced the accumulated root status timeline with a concise restart cockpit
- reduced CURRENT/LAST/NEXT to current facts and explicit resume instructions
- introduced one consolidated current-system specification
- moved completed plans, phase worklogs, superseded phase specs and dated
  snapshots out of the default scan into history
- updated module/deploy READMEs and Technical Manual release metadata
- retained historical wording unchanged inside history files
- documented the known Codex Node/pnpm PATH and changed the aggregate package
  script to pnpm chaining so `pnpm test` works without an npm executable

## Runtime scope

No CPU, decoder, flag, firmware, disk, CG-ROM, display or application behavior
was intentionally changed. The generated Technical Manual may change only to
reflect corrected release/provenance metadata.

## Known local runtime

Codex desktop uses the bundled Node and pnpm paths recorded in `README.md`.
The normal shell may not expose `node` or `npm`; this is known and must not be
rediscovered on every run. Use `pnpm test`, not a hand-written per-script loop.

## Delivery

Work is prepared on purpose branch `docs/restart-cockpit-20260926`. Check live
Git/PR state before deciding whether delivery is still pending or already
merged. Human merge authority remains in force.
