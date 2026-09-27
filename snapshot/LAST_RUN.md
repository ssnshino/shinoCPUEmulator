# LAST RUN — 2026-09-27 DISK AUTOBOOT

## Goal

Implement Issue #41 as the first bounded FDD/DISK usability slice: automatic
boot of the mounted factory S80B v2 medium after POWER → RUN and on RESET,
without removing ROM Monitor recovery or manual `MON O`.

## Live baseline

- reviewed main: `12350d28b1dfddb344f2a6d0224debaa7b571d04`
- purpose branch: `feature/shino80-disk-autoboot-20260927`
- open PR: #42
- PR creation head: `f12459d8828426751847050b7eda41928fcfd570`
- active plan: `plan/head/SHINO80_DISK_AUTOBOOT_PLAN.md`
- active worklog: `working-logs/head/SHINO80_DISK_AUTOBOOT_WORKLOG.md`

## Implemented

- shared ROM boot-attempt core used by IPL and `MON O`
- quiet pre-page-out MON fallback for no/invalid/unreadable media
- automatic valid-media cold boot without keyboard injection
- RESET autoboot with mounted media retained
- guest-side `SHINO-80 CP/M 2.2` title in the 124-byte sector-2 payload
- explicit automatic, fallback, fault-injection and manual retry regressions
- one-page UI and Technical Manual source wording updated

CPU semantics, CBIOS ABI, S80B version, persistence and removable-media UI are
unchanged.

## Verification

The focused regression, aggregate `pnpm test`, generated artifacts, Technical
Manual checks and real Chrome mobile/desktop smoke pass. Human also confirmed
POWER → RUN autoboot to CP/M in the Codex in-app preview. The browser test uses
the bundled Node Playwright path documented in README.

PR #42 review accepted the runtime design and requested restart/spec alignment
plus direct unsupported-version/layout fixtures. Those follow-ups are applied;
physical iPhone/Edge recheck and Human merge remain pending.

## Authority

Do not merge or publish without explicit Human instruction.
