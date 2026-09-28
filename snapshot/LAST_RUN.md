# LAST RUN — 2026-09-28 PHASE 1 A:/B: DUAL DRIVE REVIEW

## Implementation

Issue #54 / PR #55 implements SHINO-80 Disk Subsystem PHASE 1.

Reviewed implementation commit:

`3d492559c4765186e232cabefafa8c43a9ff814d`

Human merge status must be checked from live Git.

## Reviewed behavior

- one controller / two removable-media slots
- 32h drive selector: 0=A:, 1=B:
- A: S80B v2 BOOT / SYSTEM / TOOLS
- B: blank CLASSIC USER / WORK / INTERCHANGE
- A-only ROM autoboot
- A/B DPH with shared DPB and FD00h DIRBUF
- independent CSV/ALV
- CBIOS 657 / 768 bytes
- system payload 128 / 128 bytes
- B: real CCP filesystem create/read
- A/B filesystem isolation
- WBOOT from B -> B>
- actual UI RESET -> A>, B bytes preserved
- A/B EJECT / REINSERT SAME MEDIA
- A absent + B inserted -> ROM MON

## Review correction

Initial PR tests falsely modeled UI RESET with a full RAM clear. PM/PL/SE review
caught the mismatch. The implementation was corrected so ROM A-only boot
explicitly initializes Page Zero 0004h, and the tests now exercise the actual
reset path and real browser RESET control.

## Verification

- `pnpm run test:block` PASS
- `pnpm run test:cbios` PASS
- `pnpm run test:system-disk` PASS
- `pnpm run test:wboot` PASS
- `pnpm run test:cpm22` PASS
- `pnpm run test:cpmfs` PASS
- `pnpm test` PASS
- `pnpm run test:browser` PASS
- `git diff --check` PASS
- browser QA: 390×844 / 1280×900 / 900×400

## Documentation closeout

Current spec, removable-media roadmap, FDD notes, Technical Manual source,
online/offline generated manual and restart snapshot set are synchronized to
the PHASE 1 reviewed state before Human merge.

Superseded EXPORT-only PLAN/basic/detailed design are archived under
`*/history/2026-09-28/`.

## Next

After Human merge, PHASE 2 is Whole Disk IMPORT + EXPORT as one bounded feature.
