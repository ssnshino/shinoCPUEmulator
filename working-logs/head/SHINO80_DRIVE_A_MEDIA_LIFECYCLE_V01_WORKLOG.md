# SHINO-80 DRIVE A Media Lifecycle v0.1 — Implementation Worklog

Date: 2026-09-27 JST
Status: IMPLEMENTED / PR REVIEW PENDING
Issue: #46
Branch: `feature/shino80-drive-a-media-lifecycle-v01-20260927`
Baseline main: `97ff1d2882bc8ab9b3371fac03153e5cc85f7815`

## Scope delivered

- Added one host-side temporary shelf for the exact medium returned by
  `diskA.eject()`.
- Added POWER-OFF-only EJECT and INSERT EJECTED DISK transitions.
- Kept the shelf until `mountImage()` succeeds, then cleared it.
- Derived DRIVE A device-list state as OFF, READY or EMPTY from power/media
  state.
- Added shared Disk A inspector markup and action logic for:
  - desktop / ordinary medium right-side Inspector
  - compact / compact-height inline selected-device Inspector inside DEVICES
- Added stable delegated handling for regenerated media-control buttons.
- Regenerated the standalone one-page HTML through the normal build.

No CPU, decoder, flags, memory, Bus, ROM, CBIOS, CP/M payload, device-port or
disk-format semantics changed.

## Automated evidence

### Device contract

`tests/shino80_block_device_v01.test.cjs` now performs a complete sector write,
ejects the medium, verifies the drive is empty, remounts the returned bytes and
proves the complete image and written sector are unchanged.

Result:

```text
pnpm run test:block
SHINO-80 VIRTUAL BLOCK DEVICE v0.1: ALL TESTS PASS
```

### Aggregate regression

```text
pnpm test
PASS
```

This included CPU families, interrupt/flag accuracy, video/IPL, power/reset,
BIOS/MON, keyboard, block device, CBIOS, system-disk autoboot, WBOOT, CP/M,
filesystem, cursor/beeper, source syntax, one-page build, artifact assertions
and Technical Manual regression.

### Real Chrome browser acceptance

```text
pnpm run test:browser
v0.0.9 Chromium CP/M autoboot + filesystem + cursor + beeper machine regression PASS
```

The browser test uses the generated standalone HTML and actual visible controls
to prove:

- 390 x 844 compact Disk A Inspector is visible and operable.
- EJECT changes media state from INSERTED to EJECTED.
- Media actions do not add synthetic Bus trace events.
- POWER ON disables both media controls.
- Direct event dispatch through the disabled controls is still rejected by the
  handler guard.
- RUN with A: empty reaches ROM MON without the CP/M title.
- POWER OFF enables reinsertion of the retained medium.
- REINSERT returns the state to INSERTED without creating a factory disk.
- POWER ON -> RUN returns to `SHINO-80 CP/M 2.2` and `A>`.
- Desktop 1280 x 900 exposes the same state/actions in the right Inspector.
- Compact-height 900 x 400 hides the desktop Inspector and exposes the inline
  DEVICES Inspector.
- No page error, unexpected network request or horizontal page overflow occurs.

## Rendered visual QA

Regular Playwright with the repository-documented bundled runtime and real
Google Chrome was used because the Browser plugin was not available in this
session.

Checked viewports:

- 390 x 844 mobile portrait
- 1280 x 900 desktop
- 900 x 400 compact-height browser regression

Observed:

- intended page title and meaningful UI rendered
- no framework/error overlay
- compact inline Inspector visible without desktop pane squeeze
- desktop right Inspector visible without duplicate compact presentation
- no console warning/error
- no horizontal page overflow
- controls remain readable and at least 44 CSS px high

## Artifact and hygiene

```text
node --check src/app/shino80-workbench-v0.0.2.js
PASS

git diff --check
PASS

SHA-256 deploy/one_page_shino80_v0.0.9_z80_base_complete.html
80cb6f98656918c59d29463cc9df637d7a2feb129b7c4adf7d8cc5158e2c83d9
```

## Remaining authority

- Human review controls PR merge.
- Public deployment is outside Issue #46.
- Import, export, factory media, durable persistence, B:, write-protect UI and
  powered hot swap remain outside this implementation.
