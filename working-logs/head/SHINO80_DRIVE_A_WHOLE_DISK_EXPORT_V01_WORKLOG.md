# SHINO-80 DRIVE A Whole-Disk EXPORT v0.1 — Implementation Worklog

Date: 2026-09-28 JST
Observed: 2026-09-28T11:56:11+09:00
Status: IMPLEMENTED / PR READY
Issue: #51
Branch: `feature/shino80-drive-a-export-v01-20260928`
Baseline main: `511e6344c10690ae340e6310c572326ce8e3a53f`

## Source of truth

- `plan/head/SHINO80_DRIVE_A_WHOLE_DISK_EXPORT_V01_PLAN.md`
- `docs/head/SHINO80_DRIVE_A_WHOLE_DISK_EXPORT_BASIC_DESIGN_v0.1.md`
- `docs/head/SHINO80_DRIVE_A_WHOLE_DISK_EXPORT_DETAILED_DESIGN_v0.1.md`
- Issue #51

## Scope delivered

- Added Human-visible `EXPORT IMAGE` to the shared desktop / compact DRIVE A
  Inspector action path.
- Enabled export only for POWER OFF with one canonical inserted or ejected
  medium owner.
- Added an independent powered/invalid-state guard in the delegated action
  handler path.
- Used `diskA.exportImage()` for inserted media and `driveAEjectedMedia.slice()`
  for the ejected shelf.
- Generated a raw 256,256-byte `application/octet-stream` Blob with suggested
  filename `SHINO80_DRIVE_A.s80d`.
- Used a temporary download anchor and delayed blob-URL revocation.
- Preserved inserted/ejected ownership, the reinsertion shelf, controller
  state, guest state and Bus trace.
- Regenerated the standalone one-page machine through the normal build.

No CSS, template, block-device, CPU, Bus, ROM, CBIOS, CP/M, port-map or disk
format changes were required. IMPORT, persistence, factory restore, B: and
public deployment remain outside this work.

## Automated evidence

### Aggregate regression

Using the repository-documented Codex Node/pnpm runtime:

```text
pnpm test
PASS
```

The aggregate includes CPU families, interrupt/flag accuracy, video/IPL,
power/reset, BIOS/MON, keyboard, block device, CBIOS, system disk, WBOOT,
CP/M, filesystem, cursor/beeper, source syntax, one-page build, artifact and
Technical Manual regression.

### Real Chrome browser regression

```text
pnpm run test:browser
v0.0.9 Chromium DRIVE A export + CP/M machine regression PASS
```

The generated standalone HTML and visible controls prove:

- compact 390x844 POWER OFF + INSERTED exposes enabled `EXPORT IMAGE`;
- an actual Playwright download is named `SHINO80_DRIVE_A.s80d`;
- the Blob MIME is `application/octet-stream` and the URL is not revoked
  synchronously;
- the first payload is exactly 256,256 bytes and byte-equals the deterministic
  current factory medium;
- export leaves the medium INSERTED and Bus trace unchanged;
- after EJECT, export remains enabled and the second payload byte-equals the
  first;
- ejected ownership and reinsertion availability remain intact;
- POWER ON disables export and direct delegated dispatch produces no download,
  ownership mutation or Bus event;
- no-media ROM MON fallback and reinsertion -> normal CP/M / `A>` recovery
  remain green;
- desktop 1280x900 visibly contains the disabled powered export action and
  POWER-OFF-only note;
- compact-height 900x400 visibly contains the inline action without horizontal
  overflow;
- no page errors or unexpected network requests occur.

### Hygiene

```text
node --check src/app/shino80-workbench-v0.0.2.js
PASS

node --check tests/browser_smoke_v0.0.9.cjs
PASS

git diff --check
PASS
```

## Generated artifacts

Standalone machine SHA-256:

```text
5b314948c51416c2c72124501b9f38ce4dbffa8ccb91dabc24d8449902b7a64a
deploy/one_page_shino80_v0.0.9_z80_base_complete.html
```

`pnpm test` also regenerated the standalone Technical Manual because its
integrity metadata embeds the SHA-256 of the changed workbench source. No
Technical Manual authored content changed.

```text
63773f4a45ec8fa9d41f08dab5167e7da0ed044f28f6affff80eeff285915a9b
deploy/shino80_technical_manual_v0.1.html
```

## Remaining gate

- Open one implementation PR and stop for Human review.
- Human browser save/share presentation and final filename handling may be
  checked separately on physical iPhone/Edge.
- Do not merge or publish from this implementation task.
