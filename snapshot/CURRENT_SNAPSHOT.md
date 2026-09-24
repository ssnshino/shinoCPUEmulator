# CURRENT SNAPSHOT
## ONE-PAGE Z80 COMPUTER / SHINO-80

Last updated: 2026-09-24T16:42:00+09:00

## Reviewed baseline

- Repository: `ssnshino/shinoCPUEmulator`
- Default branch: `main`
- UI Design Standard v0.1 / PR #3: MERGED
- CPU PR #2: OPEN / UNMERGED

## Active candidate

- PR: #4
- Branch: `feature/ui-foundation-v0.0.2-20260924`
- Candidate: **SHINO-80 v0.0.2 UI FOUNDATION**
- Artifact: `one_page_shino80_v0.0.2_ui_foundation.html`
- Automated adaptive browser QA: PASS
- Human smartphone real-device QA: **PASS**
- Human verdict: **大満足 / 非の打ち所が無い**
- Merge: PENDING EXPLICIT HUMAN MERGE AUTHORIZATION

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

## Human recording evidence

Standalone one-page artifact confirmed on smartphone through Edge external-file.

Observed:

- DISPLAY
- CPU Debug Lab
- RUN / PAUSE
- live CPU/LED activity
- destination switching

## Important branch relationship

v0.0.2 contains the CPU heartbeat code that also exists in PR #2.

If v0.0.2 is explicitly authorized and merged, PR #2 may become superseded. Do not close or merge PR #2 without Human decision.

## Next technical direction

UI foundation is accepted.

Primary development focus can now move inward:

1. Z80 instruction architecture
2. flag correctness
3. prefix groups
4. control flow / stack
5. HALT / EI delay
6. INT / NMI / IM0-2
7. timing / bus-cycle refinement
8. broader test-suite integration

Peripheral implementation remains later.
