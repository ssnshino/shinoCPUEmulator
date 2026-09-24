# SHINO-80 UI RESEARCH WORKLOG v0.1

Created: 2026-09-24T15:13:07+09:00

## Trigger

After SHINO Z80 CORE v0.0.1 successfully ran on smartphone, Human requested that the page be redesigned with future display and peripheral expansion in mind, using modern UI best practices and especially Apple UI thinking as research input.

## Research performed

Reviewed current guidance from:

- Apple design principles / WWDC26
- Apple Split Views
- Apple Toolbars
- Apple Materials / Liquid Glass
- Apple Color / Branding
- Apple Motion
- Apple typography / Dynamic Type references
- Apple Safe Area documentation
- Android Adaptive Apps canonical layouts
- Android Supporting Pane guidance
- Android Window Size Classes
- VS Code UX architecture
- VS Code Views / Sidebars / Panel guidance

## Main findings

Cross-source convergence:

- primary content should remain dominant
- navigation and actions should not be conflated
- supporting details belong in contextual panes
- compact layouts should not squeeze desktop multi-pane UI
- state should survive viewport adaptation
- color and motion should be restrained and meaningful
- developer tools benefit from explicit regions rather than a flat card wall

## SHINO decisions proposed

- DISPLAY FIRST
- OBSERVER SECOND
- Modern Shell / Retro Machine
- Compact = one major pane at a time
- Medium = primary + one supporting pane
- Expanded = navigation + primary + inspector + optional trace
- peripherals live under Device Dock
- current Altair-style panel becomes a Debug Lab view
- raw MHz activity is visually aggregated
- 44px-class touch target goal
- safe-area support
- system sans shell + monospace telemetry

## Files created

- `research/ui/SHINO_80_UI_RESEARCH_2026-09-24.md`
- `docs/head/SHINO_80_UI_DESIGN_STANDARD_v0.1.md`
- `docs/head/SHINO_80_UI_LAYOUT_BLUEPRINTS_v0.1.md`
- `plan/head/SHINO_80_UI_FOUNDATION_v0.1_PLAN.md`
- `code/head/SHINO_80_UI_RESEARCH_QA_v0.1.json`

## Implementation status

No UI runtime code changed in this research branch.

Next code change should be a dedicated v0.0.2 UI foundation branch after Human review / merge decision for these design documents.
