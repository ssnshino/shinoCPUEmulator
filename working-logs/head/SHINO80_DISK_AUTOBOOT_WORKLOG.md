# SHINO-80 Disk Autoboot Worklog

Date: 2026-09-27 JST
Issue: <https://github.com/ssnshino/shinoCPUEmulator/issues/41>
Branch: `feature/shino80-disk-autoboot-20260927`
Baseline: `12350d28b1dfddb344f2a6d0224debaa7b571d04`
PR: <https://github.com/ssnshino/shinoCPUEmulator/pull/42>
PR creation head: `f12459d8828426751847050b7eda41928fcfd570`

## Result

- POWER still requires the Human to press RUN.
- ROM IPL automatically attempts the mounted A: S80B v2 medium.
- Machine RESET enters the same automatic cold-boot path.
- The IPL and manual `MON O` paths share one ROM boot routine.
- A successful boot prints `SHINO-80 CP/M 2.2` from the sector-2 guest loader
  through CBIOS, then enters CCP at `A>`.
- Missing/invalid media and injected header, payload and CBIOS read failures
  return to a responsive ROM Monitor before page-out.
- Manual `MON O` remains covered by reaching MON without media, mounting the
  valid image, and retrying.
- WBOOT remains RAM/CBIOS-resident. Its post-page-out error/HALT behavior is
  unchanged.

## Implementation notes

The original 98-byte sector-2 payload grew to 124 bytes. It remains inside one
128-byte sector with four bytes spare. The fixed S80B v2 header now records the
124-byte payload and checksum 203. No media-format version change was made.

The ROM does not shadow page zero or page firmware out until all seven
ROM-owned data-sector reads have succeeded. Automatic failure is quiet and
prints `MON` / `*`; explicit `MON O` failure retains `DISK BOOT ERROR`.

The JavaScript presentation layer does not synthesize the startup title or CCP
prompt.

## Verification

- focused autoboot/CP/M/WBOOT/filesystem/POWER-RESET tests: PASS (5 files)
  - direct invalid magic, unsupported version, invalid layout and checksum
    fixtures all fall back before page-out
- aggregate `pnpm test`: PASS, including build and artifact/manual tests
- real Chrome mobile smoke through bundled Node Playwright: PASS
  - no `O` input before CP/M
  - guest keyboard `DIR`
  - cursor, beeper, memory, CPU/device inspector and no horizontal overflow
- `git diff --check`: PASS
- Human Codex in-app preview: POWER → RUN autoboot to CP/M PASS
- physical iPhone/Edge autoboot recheck: pending

The current browser smoke was migrated from Python Playwright to the bundled
Node Playwright package because the standard Codex runtime ships the latter.
`README.md` and `tests/README.md` now contain the exact reusable command and
paths, so future sessions must not rediscover or work around this dependency.

PR review confirmed the runtime implementation and requested only snapshot/spec
alignment plus direct version/layout rejection evidence. Those follow-ups are
included in the same logical commit by amend; Human merge remains authoritative.

## Boundaries

- CPU core, decoder and flags are unchanged.
- S80B remains v2 with header-only integrity validation.
- No boot-inhibit control, INSERT/EJECT UI, persistence, import/export, B:
  drive, payload CRC or post-page-out ROM recovery is added.
- Human review controls PR merge and publication.
