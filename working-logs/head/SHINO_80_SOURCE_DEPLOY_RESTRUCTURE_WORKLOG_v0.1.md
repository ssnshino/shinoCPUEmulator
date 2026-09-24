# SHINO-80 SOURCE / DEPLOY RESTRUCTURE WORKLOG v0.1

Created: 2026-09-24T16:50:00+09:00

## Reason

Human identified that SHINO-80 will grow substantially and requested a development layout where source remains modular under `src/` while distribution HTML is generated into `deploy/`.

## Changes

- created `deploy/README.md`
- moved current standalone artifact path to `deploy/`
- changed build output from repository root to `deploy/`
- updated deploy artifact test path
- updated Chromium smoke path
- added source/deploy architecture standard
- added source-domain README placeholders for devices/debug/firmware/Z80
- documented no-hand-edit policy for generated HTML

## Behavior

No CPU/UI runtime behavior changed.

The deploy artifact uses the same existing blob content as the previously reviewed root artifact.

## Result

Repository now distinguishes:

- authoring
- building
- testing
- distribution

without abandoning the one-page deliverable.
