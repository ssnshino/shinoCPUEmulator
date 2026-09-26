# SHINO-80 UI FOUNDATION PLAN v0.1

Created: 2026-09-24T15:13:07+09:00
Status: **PLANNED / NO CODE IN THIS RESEARCH PR**

## Purpose

Define a scalable shell before SHINO-80 gains a real display, FDD, UART, printer, sound, and network devices.

The goal is not to beautify v0.0.1.

The goal is to create an information architecture that can survive the full machine roadmap.

## Inputs

- Apple Human Interface Guidelines / WWDC26 design principles
- Android adaptive layout guidance
- VS Code developer-tool UX guidance
- SHINO Z80 CORE v0.0.1 Human mobile feedback

## Deliverables in this plan stage

- UI research note
- SHINO-80 UI Design Standard v0.1
- Expanded / Medium / Compact layout blueprints
- implementation boundary for v0.0.2

## v0.0.2 implementation target

Refactor the existing first-heartbeat UI into a workbench shell:

1. global toolbar
2. destination navigation
3. primary content area
4. supporting inspector
5. trace panel model
6. device dock placeholder
7. adaptive layout families
8. safe area handling
9. larger touch controls
10. shell/telemetry typography separation
11. semantic status tokens
12. reduced-motion support

## Reuse from v0.0.1

Do not rewrite the working CPU just to redesign the shell.

Preserve:

- `Z80Core`
- `Shino80Bus`
- NOP tests
- RESET behavior
- CPU/debug peek separation
- current trace data
- LED concept
- register inspector concept

## Non-goals

v0.0.2 UI foundation must NOT add:

- new Z80 opcodes merely for UI demo
- BIOS
- text video implementation
- FDD behavior
- UART behavior
- printer behavior
- networking
- drag-anywhere docking
- user-customizable workspace persistence
- skin/theme marketplace

Use placeholders where future hardware does not yet exist.

## Regression risks

- breaking currently working smartphone execution
- hiding core state behind too many taps
- shrinking telemetry until unreadable
- adding too much DOM update work
- layout resize resetting CPU
- touch controls becoming smaller than v0.0.1
- turning retro machine character into generic glass dashboard

## QA

### Static

- no horizontal root overflow in target widths
- unique navigation/control IDs
- no dependency on external runtime assets
- reduced-motion CSS path exists
- safe-area variables exist

### Runtime

Test at minimum:

- wide desktop
- medium/tablet-like width
- smartphone portrait
- smartphone landscape

While CPU is running:

- switch destinations
- resize viewport
- open/close inspector
- open/close trace

CPU state must continue correctly.

### Human

Human visual review is required before merge.

## Success condition

A user can understand:

1. where the SHINO computer itself is
2. where global controls are
3. how to inspect CPU / memory / bus / devices
4. how the same machine reorganizes on phone versus desktop

without seeing every subsystem simultaneously.
