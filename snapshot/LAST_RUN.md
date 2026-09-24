# LAST RUN
## ONE-PAGE Z80 COMPUTER / SHINO-80

Updated: 2026-09-24T15:13:07+09:00

## Task

Research modern UI best practices for the future SHINO-80 single-page computer and translate them into a project-specific UI architecture.

Human specifically requested strong consideration of Apple UI thinking.

## Research completed

Reviewed current official guidance from:

- Apple WWDC26 design principles
- Apple HIG Split Views
- Apple HIG Toolbars
- Apple HIG Materials / Liquid Glass
- Apple HIG Color / Branding
- Apple HIG Motion
- Apple Dynamic Type / Labels / Safe Area references
- Android Adaptive Apps canonical layouts
- Android Supporting Pane layout
- Android Window Size Classes
- VS Code UX Overview / Views / Sidebars / Panel

## Project synthesis

Main UI principles:

- Modern Shell / Retro Machine
- DISPLAY FIRST
- OBSERVER SECOND
- ADAPT, DON'T SHRINK
- BIG TOUCH, SMALL DATA
- MOTION = INFORMATION

## Deliverables

Created:

- `research/ui/SHINO_80_UI_RESEARCH_2026-09-24.md`
- `docs/head/SHINO_80_UI_DESIGN_STANDARD_v0.1.md`
- `docs/head/SHINO_80_UI_LAYOUT_BLUEPRINTS_v0.1.md`
- `plan/head/SHINO_80_UI_FOUNDATION_v0.1_PLAN.md`
- `working-logs/head/SHINO_80_UI_RESEARCH_WORKLOG_v0.1.md`
- `code/head/SHINO_80_UI_RESEARCH_QA_v0.1.json`

## Code / runtime

No emulator/UI runtime source modified in this branch.

Browser QA: N/A for this document-only research task.

## Next action

Human reviews the design standard and blueprints.

After approval, implement the v0.0.2 UI shell in a separate branch against the latest accepted CPU baseline.
