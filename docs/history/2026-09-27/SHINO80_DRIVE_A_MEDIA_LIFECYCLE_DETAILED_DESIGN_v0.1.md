# SHINO-80 DRIVE A Media Lifecycle v0.1 — Detailed Design

Status: IMPLEMENTATION-READY DESIGN
Updated: 2026-09-27 JST
Author: 戸澤 / ChatGPT

## 1. Implementation boundary

Expected production changes are limited primarily to the browser workbench and
its UI styling/tests.

Expected files:

- `src/app/shino80-workbench-v0.0.2.js`
- `src/app/shino80-workbench-v0.0.2.template.html`
- `src/ui/shino80-workbench-v0.0.2.css`
- `tests/shino80_block_device_v01.test.cjs` or one focused new lifecycle test
- `tests/browser_smoke_v0.0.9.cjs`
- source/artifact/manual assertions only where required by existing build
  contracts

Do not change CPU, decoder, memory, ROM, CBIOS, CP/M payload or device port
allocation unless a blocking defect proves the existing contract cannot support
the design. If that occurs, stop and report the blocker instead of silently
expanding scope.

## 2. Host-side state

Add workbench state outside `Shino80BlockDevice`:

```js
let driveAEjectedMedia = null;
```

This is host/media-management state, not a guest device register.

Do not place DOM references or browser file APIs inside the block-device class.

## 3. Lifecycle helpers

Implement small host-layer helpers with the following behavior.

### ejectDriveA()

Preconditions:

- `ui.powered === false`
- `diskA.mounted === true`
- `driveAEjectedMedia === null`

Action:

1. call `diskA.eject()`
2. require a non-null returned `Uint8Array`
3. assign that returned medium to `driveAEjectedMedia`
4. mark UI dirty
5. refresh Device list / inspector as required by current rendering model

Postconditions:

- `diskA.mounted === false`
- `driveAEjectedMedia` contains the exact ejected bytes

No factory disk is generated.

### insertEjectedDriveA()

Preconditions:

- `ui.powered === false`
- `diskA.mounted === false`
- `driveAEjectedMedia instanceof Uint8Array`

Action:

1. copy local reference from `driveAEjectedMedia`
2. call `diskA.mountImage(media)`
3. only after successful mount, set `driveAEjectedMedia = null`
4. mark UI dirty
5. refresh Device list / inspector as required

Postconditions:

- `diskA.mounted === true`
- `driveAEjectedMedia === null`

Important: clear the shelf only after `mountImage()` succeeds. This prevents
loss of the host-held medium if a future validation error is introduced.

## 4. Guard behavior

Both helpers must be safe when called in an invalid state.

Preferred behavior for this phase:

- return without mutation
- do not throw for ordinary UI misuse
- do not power-cycle or reset the machine
- leave media/controller state unchanged

Tests should prove the powered-state guard through the actual UI controls.

## 5. Device state derivation

Update device-state presentation so Disk A does not claim `ONLINE` while
powered with no medium.

Conceptual logic:

```text
if power-sensitive and POWER OFF -> OFF
else if disk-a and mounted       -> READY
else if disk-a and !mounted      -> EMPTY
else                               existing state
```

Use a single-token state such as `EMPTY`; do not create state strings with
spaces that become accidental multiple CSS class names.

Status must not be communicated by color alone.

## 6. Inspector markup and compact visibility

Live-code constraint confirmed before implementation:

- the current compact CSS hides `.navrail,.inspector,.tracepanel`
- the DEVICES major pane remains Human-visible
- the current browser smoke can read hidden inspector text, which is not proof
  of a Human-visible mobile operation path

The v0.1 design therefore requires two presentation targets backed by the same
selected-device state:

### Desktop / ordinary medium target

Existing stable root:

`#inspectorContent`

### Compact / compact-height target

Add one dedicated selected-device detail container inside the existing
`data-view-panel="devices"` major pane.

Conceptual id:

`#compactDeviceInspector`

It is hidden in layouts where the normal right-side Inspector is visible and is
shown in the same compact / compact-height layout families that hide the global
Inspector.

Do not unhide the desktop Inspector on compact. Do not add a second major pane.

For Disk A, derive media presentation from runtime state rather than assuming
the factory image is always inserted.

Required visible labels:

- `MEDIA`
- `INSERTED` or `EJECTED`
- geometry `77 TRACKS × 26 SECTORS`
- `256,256 BYTES`
- ports `30h–36h`
- transfer state
- write-protect state
- error state

Required buttons:

```text
EJECT
INSERT EJECTED DISK
```

Each button:

- semantic `<button>`
- accessible text name
- disabled property reflecting current state
- touch target approximately 44 CSS px minimum per local UI standard

Do not add IMPORT / EXPORT / FACTORY buttons in this phase.

## 7. Shared rendering and event binding

The desktop and compact selected-device surfaces must not implement separate
Disk A state logic.

Preferred structure:

1. extract the selected-device inspector markup generation into one shared
   render/build path
2. render that result into the Human-visible target(s) appropriate to the
   current layout
3. keep Disk A media-state decisions in JavaScript state, not CSS

The implementation may render equivalent markup into both
`#inspectorContent` and `#compactDeviceInspector`, provided only the
layout-appropriate target is Human-visible.

Because inspector HTML is replaced during rerender, do not attach persistent
handlers to ephemeral button nodes.

Use stable-root event delegation for both presentation roots, or delegate from
one stable common ancestor such as the workbench/main shell.

- use `closest('[data-disk-action]')`
- dispatch only known action values such as `eject` and `insert-ejected`
- do not accumulate duplicate handlers across rerenders

The event path must behave identically for desktop and compact controls.

## 8. Rendering / observer rule

Media controls are host operations. They must not fabricate CPU Bus events.

EJECT / REINSERT should not:

- call CPU I/O methods
- write guest RAM
- synthesize block read/write commands
- modify Bus trace

Subsequent guest boot naturally produces normal Bus-visible disk I/O.

## 9. POWER / RESET interactions

Existing semantics remain:

### POWER OFF

- CPU stops
- writable RAM clears per current workbench behavior
- controller reset occurs
- inserted medium remains inserted

New addition:

- if medium is already ejected, POWER OFF does not recreate or reinsert it

### POWER ON

- does not automatically change media ownership
- if A: is empty, later RUN follows existing no-media MON fallback

### RESET

No media-management action.

Do not interpret RESET as factory-disk insertion.

## 10. Unit / contract tests

Extend device-level coverage to prove the round trip that the host layer relies
on:

1. create writable test image
2. modify known bytes through a complete block WRITE path
3. `eject()`
4. verify device reports no media
5. `mountImage(ejected)`
6. read/export and verify modified bytes are preserved exactly

Do not add a new device API only to simplify this test.

## 11. Browser acceptance test

Use user-visible behavior in Playwright.

The current compact smoke must not treat hidden `#inspectorContent` text as
proof that a Human can operate Disk A.

### Compact/mobile required scenario

Use the existing 390 x 844 class compact viewport or equivalent.

1. load generated standalone HTML
2. assert POWER OFF
3. open I/O / DEVICES
4. select VIRTUAL DISK A
5. assert the compact selected-device inspector is actually visible
6. locate EJECT / INSERT EJECTED DISK by role/name where practical
7. assert EJECT enabled and INSERT EJECTED DISK disabled
8. click EJECT
9. assert visible media state EJECTED
10. assert EJECT disabled / INSERT enabled
11. POWER ON
12. assert both media-change buttons disabled
13. RUN
14. wait for ROM MON fallback and confirm CP/M prompt is not reached
15. POWER OFF
16. return to I/O / Disk A if needed
17. click INSERT EJECTED DISK
18. assert visible media state INSERTED
19. POWER ON
20. RUN
21. wait for disk title and `A>`
22. assert no page error, no unexpected network request and no horizontal
    overflow

Visibility must be checked with Playwright visibility assertions / user-visible
locators, not only `innerText()` on hidden DOM.

### Desktop required control-state check

At desktop viewport:

- select DEVICES -> VIRTUAL DISK A
- verify the ordinary right-side Inspector is visible
- verify the same media state and EJECT / INSERT actions are Human-visible
- verify POWER guard state matches compact behavior

A full second CP/M boot sequence is optional if the compact scenario already
covers machine behavior and the shared state/action path is exercised.

Prefer Playwright role/text locators and web-first waits over implementation-
detail CSS chains.

## 12. Regression suite

Required before PR:

```bash
export PATH="/Users/shino/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:/Users/shino/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback:$PATH"
export NODE_PATH="/Users/shino/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules"
export CHROMIUM_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

pnpm test
pnpm run test:browser
git diff --check
```

If the package scripts change, that requires explicit justification in the PR.

## 13. Artifact rule

Make source changes under `src/` and rebuild.

Never hand-edit:

- `deploy/one_page_shino80_v0.0.9_z80_base_complete.html`
- generated Technical Manual HTML

Generated artifact differences must be explained by source/build changes.

## 14. Failure and stop conditions

Stop implementation and comment on the Issue instead of improvising if any of
these become true:

- existing `mountImage/eject` semantics cannot preserve the same medium
- POWER-OFF-only media change cannot be enforced without changing machine
  semantics
- adding the compact inline selected-device detail would require a broad
  navigation/layout refactor rather than the local DEVICES-pane addition
- required behavior needs CP/M, ROM or CPU semantic changes
- a broad unrelated refactor appears necessary

Do not solve those by expanding the PR.

## 15. PR delivery contract

The implementation PR should contain:

- one bounded media-lifecycle behavior
- related tests
- regenerated artifacts required by normal build
- implementation worklog/evidence produced by Codex
- no unrelated documentation reorganization
- no import/export/persistence/factory/B: work

PR creation is the stop point. Human review controls merge.
