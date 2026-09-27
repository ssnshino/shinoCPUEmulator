# LAST RUN — 2026-09-27 DISK AUTOBOOT POST-MERGE CLOSEOUT

## Goal

Promote the merged Issue #41 / PR #42 disk-autoboot result to the released
baseline and close its completed PLAN/worklog out of the ordinary restart set.

## Live baseline

- released main: `01c5d4433f06f5c41254c2d0b4137606d8990be5`
- merged implementation PR: #42
- completed Issue: #41
- active implementation PLAN: none
- open implementation PR: none at closeout start

## Released implementation

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

PR #42 review accepted the runtime design and its requested restart/spec
alignment plus direct unsupported-version/layout fixtures were merged. Physical
iPhone/Edge autoboot recheck remains not recorded; it is not inferred from the
earlier mobile QA.

## Closeout

- promoted PR #42 merge SHA to the released baseline in current docs
- archived the completed Disk Autoboot PLAN and WORKLOG under dated history
- removed completed implementation records from the current restart set
- left the next implementation unselected
- retained the FDD/DISK design note as the entry point for future media work

## Authority

Human review still controls merge and publication. This closeout changes no
runtime source or generated deploy artifact.
