# SHINO-80 PHASE 1 A:/B: Dual Drive Implementation Worklog

Date: 2026-09-28 JST

Issue: `#54 SHINO-80 PHASE 1: A:/B: Dual Drive — CP/M two-drive work environment`

Purpose branch: `feature/shino80-dual-drive-phase1-20260928`

Live `main` baseline: `511e6344c10690ae340e6310c572326ce8e3a53f`

## Result

Implemented one SHINO block controller with two independent removable-media
slots on the existing I/O 30h–36h interface.

- drive selector 0 accesses A:, selector 1 accesses B:, and selector >=2
  reports `BLOCK_ERROR_BAD_DRIVE`
- A: retains the deterministic S80B v2 CP/M system disk and remains the only
  ROM autoboot / `MON O` source
- B: starts as an independent writable 256,256-byte CLASSIC work disk filled
  with E5h and is never probed as a boot source
- controller transfer state remains shared; media bytes and write-protect
  state are per slot
- controller reset returns selection to A: without discarding either medium
- POWER-OFF A/B EJECT and REINSERT use independent host shelves and explicitly
  target the selected UI slot without fabricating Bus trace events

## CBIOS and CP/M

- added exact 16-byte DPH_A and DPH_B structures
- both DPHs share the existing DPB and the FD00h–FD7Fh DIRBUF
- CSV and ALV storage is independent for A and B
- SELDSK returns DPH_A for C=0, DPH_B for C=1, and 0000h for C>=2
- READ/WRITE continues through the real CBIOS -> Bus -> block-controller path
- CBIOS image is **657 / 768 bytes**
- S80B v2 system payload is **128 / 128 bytes**
- WBOOT reloads the system from A: and derives the returning CCP drive from
  Page Zero 0004h, so WBOOT from B: returns to `B>`
- the ROM A-only boot handoff explicitly initializes Page Zero 0004h to A:, so
  POWER / UI RESET / `MON O` enter `A>` while CBIOS WBOOT alone preserves `B>`
- UI RESET retains B: media bytes without clearing RAM

## UI and browser acceptance

The Device view now presents active `VIRTUAL DISK A` and `VIRTUAL DISK B`
rows. The existing desktop and compact inspectors share one parameterized
renderer/action path. A presents system/autoboot information; B presents its
work/interchange role and non-bootable status. Both expose disabled media
controls while POWER is ON and retain independent POWER-OFF media shelves.

Chromium acceptance exercised 390x844, 1280x900, and 900x400 viewports using
the generated standalone page. It verified:

- A autoboot and normal `A>` prompt
- real CCP switch to `B>`
- blank B `DIR`, `SAVE 1 WORK.COM`, and subsequent `DIR`
- A/B filesystem isolation
- B file persistence across WBOOT, UI RESET, and B EJECT/REINSERT
- actual compact More -> RESET control returns `B>` to ROM-autobooted `A>`,
  after which switching back to B still finds `WORK.COM`
- A EJECTED + B INSERTED reaches ROM MON and does not boot B
- POWER-ON disabled controls plus forced-dispatch handler guard
- no synthetic Bus events, page errors, network requests, or horizontal
  overflow

## Verification evidence

All commands used the repository-documented Codex Node/pnpm runtime.

PR #55 review follow-up replaced the original false-positive RESET test, which
had cleared all RAM before reset, with the actual machine reset sequence. The
browser regression also operates the compact More -> RESET control directly.

- `pnpm run test:block` — PASS
- `pnpm run test:cbios` — PASS
- `pnpm run test:system-disk` — PASS
- `pnpm run test:wboot` — PASS
- `pnpm run test:cpm22` — PASS
- `pnpm run test:cpmfs` — PASS
- implementation-head `pnpm run build:manual` — PASS; 1,780 encodings / 2,004,889 bytes
- PM closeout GitHub Actions run `36429294794` — PASS: build:manual / test:manual / `pnpm test` / Chromium browser regression / `git diff --check`
- `pnpm test` — PASS, including all CPU, firmware, device, CP/M, build,
  artifact, and deterministic technical-manual regressions
- `pnpm run test:browser` — PASS
- `git diff --check` — PASS

Generated artifacts:

- `deploy/one_page_shino80_v0.0.9_z80_base_complete.html`
  - 239,980 bytes
  - SHA-256 `8fcd8a1bfbc30aadbbbe66d8a63200fa64237e85ef36c822aedde1320caa72e1`
- `deploy/shino80_technical_manual_v0.1.html`
  - 2,005,665 bytes
  - SHA-256 `a05a580c20444a27f78ac866b2a10990a640c92bb87c94df2583215652faa329`

## Boundaries

The final logical commit does not change the CPU core, decoder, flag
implementation, port range, S80B v2 layout, reserved CBIOS sector count, media
geometry, B boot path, import/export UI, browser persistence or public
deployment. It combines the reviewed implementation with the PM/PL/SE-authored
current-document, generated Technical Manual and restart-snapshot closeout.
Human review controls merge.

## PM/PL/SE documentation closeout

Before Human merge, the PM/PL/SE side synchronized the current documentation to
the reviewed PHASE 1 state without changing implementation behavior:

- README current capability / next-phase entry
- Current Integrated System Specification
- Disk Subsystem PHASE 0–5 roadmap
- FDD / DISK design notes
- Technical Manual authoring source and generated offline/online artifact
- restart snapshot set
- active-plan marker
- superseded EXPORT-only PLAN/basic/detailed design moved from head to history

The implementation test evidence above is from the reviewed code head. The
documentation/manual closeout did not change implementation source files.

Post-closeout Technical Manual validation:

- generated runtime JS is byte-for-byte identical to `src/manual/manual.js`
- manual source, manual test and generated runtime JS all parse successfully
- generated MANUAL_DATA reports CBIOS 657 bytes and system payload 128 bytes
- generated manual contains A:/B:, DRIVE 0/1, PHASE 1 media and WBOOT/RESET text
- stale "B: drive is future" wording is absent
- final generated manual: 2,005,665 bytes
- SHA-256 `a05a580c20444a27f78ac866b2a10990a640c92bb87c94df2583215652faa329`
- GitHub Actions closeout run `36429294794` completed SUCCESS

The Daihanten public/unlisted copy remains a separate post-merge publication
step so its provenance can reference the final merged source commit.
