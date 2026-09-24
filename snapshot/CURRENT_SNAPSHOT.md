# CURRENT SNAPSHOT
## ONE-PAGE Z80 COMPUTER / SHINO-80

Last updated: 2026-09-24T15:36:00+09:00

## Reviewed baseline

- Repository: `ssnshino/shinoCPUEmulator`
- Default branch: `main`
- UI Design Standard v0.1 / PR #3: MERGED
- CPU PR #2: OPEN / UNMERGED

## Active candidate

- Branch: `feature/ui-foundation-v0.0.2-20260924`
- Candidate: **SHINO-80 v0.0.2 UI FOUNDATION**
- Artifact: `one_page_shino80_v0.0.2_ui_foundation.html`
- Automated adaptive browser QA: PASS
- Human real-device review: PENDING

## Candidate scope

CPU behavior remains the first heartbeat:

- RESET documented subset
- `00h NOP`
- PC/R/T-state
- abstract M1/refresh trace

UI foundation adds:

- DISPLAY / CPU / MEMORY / BUS / DEVICES
- Modern Shell / Retro Machine
- Expanded / Medium / Compact
- compact-height phone landscape
- contextual inspector
- Device Dock placeholders
- trace panel
- safe-area / reduced-motion
- state preservation across layout changes

## Important branch relationship

v0.0.2 contains the CPU heartbeat code that also exists in PR #2.

If v0.0.2 is accepted and merged, PR #2 may become superseded. Do not close or merge PR #2 without Human decision.

## Next gate

Human opens v0.0.2 on phone/desktop and gives visual/interaction feedback.

No new peripheral implementation until the shell is accepted.
