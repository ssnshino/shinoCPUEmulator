# SHINO-80 Disk Autoboot Plan

Status: ACTIVE / ISSUE #41
Created: 2026-09-27 JST
Baseline: `12350d28b1dfddb344f2a6d0224debaa7b571d04`
Issue: <https://github.com/ssnshino/shinoCPUEmulator/issues/41>

## Goal

After the Human powers the machine and starts CPU execution, automatically boot
the mounted bootable S80B v2 medium in A: without requiring `MON O`. Preserve a
safe ROM Monitor fallback and the existing manual `MON O` path.

## Adopted decisions

- POWER does not automatically start CPU execution; the existing RUN control
  remains.
- POWER and machine RESET both enter the ROM IPL and autoboot a valid A: medium.
- WBOOT remains RAM/CBIOS-resident and does not return to ROM autoboot.
- Manual `MON O` remains executable and covered by an explicit automated
  fixture. Human access to MON with the factory disk mounted is deferred to the
  removable-media phase.
- MON fallback is guaranteed only before firmware page-out: no media, header
  read error, invalid header, payload read error and CBIOS read error.
- A CCP/BDOS read failure after page-out retains the existing CBIOS error/HALT
  behavior and is a separate recovery design.
- S80B remains version 2. Header/layout validation remains the current fixed v2
  contract; payload, CBIOS and CCP/BDOS integrity checks are deferred.

## Current path

```text
POWER -> RUN -> ROM IPL -> MON -> O
  -> ROM reads/validates sector 1
  -> ROM reads sector 2 payload and sectors 3-8 CBIOS
  -> page-out / RAM handoff
  -> disk payload reads CCP/BDOS through CBIOS
  -> CCP -> A>
```

The ROM currently keeps parser validation and boot mechanics inside
`MONITOR_DISK_BOOT`. The implementation will split a shared boot-attempt core
from the manual-command wrapper.

## Target path

```text
POWER -> RUN -> ROM IPL -> shared disk boot attempt
  valid A: -> page-out -> disk payload title -> CCP -> A>
  invalid/no A: -> ROM MON -> *

RESET -> ROM IPL -> same shared disk boot attempt
MON O -> parser wrapper -> same shared disk boot attempt
```

## Autoboot entry and common path

After display initialization and the fixed ROM IPL banner, IPL calls a shared
ROM disk-boot attempt routine. The routine owns S80B header validation and the
seven pre-page-out sector reads. Success performs the existing RAM handoff and
does not return. Failure returns to its caller with ROM still visible.

- IPL caller: prints the normal `MON` prompt without an alarming disk error.
- `MON O` caller: preserves the existing visible `DISK BOOT ERROR` behavior.

This keeps the machine boot path common while allowing automatic and explicit
boot attempts to present appropriate failure messages.

## TITLE responsibility

Compared candidates:

1. **Sector 2 disk loader** — medium-owned, runs only on cold disk boot, can
   vary with future bootable media, and leaves the stable CBIOS API unchanged.
2. **CBIOS cold BOOT** — semantically plausible, but the current loader does
   not call it and adding identity text to CBIOS couples a removable medium's
   title to the machine BIOS image.

Adopt sector 2. It will print `SHINO-80 CP/M 2.2\r\n` through the already loaded
CBIOS guest console path immediately before entering CCP. The string and call
must fit inside the existing 128-byte payload sector. CCP then supplies its own
startup output and `A>`.

JavaScript and the presentation layer must not write the title or prompt.

## Failure contract

| Failure point | Expected result |
| --- | --- |
| no medium | ROM visible, controller idle, `MON` and `*`, keyboard usable |
| header read error | same MON fallback |
| invalid magic/version/layout/header checksum | same MON fallback |
| payload sector read error | same MON fallback; partial RAM is never executed |
| CBIOS sector read error | same MON fallback; partial RAM is never executed |
| CCP/BDOS read error after page-out | existing `WBOOT DISK ERROR` and HALT; explicitly outside this phase |

Autoboot fallback must not write page zero or change the memory mapper before
all seven ROM-owned sector reads pass. Manual retry must use the same core.

## Test fixtures

- `autoboot`: bootable S80B mounted before reset; no keyboard bytes injected.
- `monitor`: no medium or invalid header; run IPL until MON.
- `manual O`: reach MON without media, mount a valid S80B image, then enter O.

Existing tests that intentionally exercise Monitor, RAM handoff or pageable
firmware must retain their original meaning by using a monitor fixture. Do not
weaken them merely to accommodate the new default disk behavior.

## Implementation scope

- ROM IPL autoboot entry and common boot core
- sector 2 guest-side startup title
- POWER/RESET autoboot regression
- no-media/invalid-header/pre-page-out read-error fallback regression
- manual `MON O`, WBOOT and filesystem regression
- browser smoke updated to require no O input
- modular source, generated machine/manual, current docs, snapshot and worklog

## Non-goals

- POWER button auto-RUN
- boot-inhibit key or BOOT TO MON UI
- INSERT/EJECT UI or hot swap
- browser persistence or IndexedDB
- image import/export or S80B version change
- payload/CBIOS/CCP/BDOS CRC
- post-page-out ROM recovery
- B: drive, mechanical FDD timing or unrelated CPU changes

## Risks

- Existing tests often use MON arrival as a fixture; careless updates could
  reduce Monitor coverage.
- The disk payload is limited to one 128-byte sector.
- ROM boot failure must preserve carry/error flow without accidentally paging
  firmware out.
- RESET autoboot changes a Human-visible behavior and needs browser QA.

## Verification

Focused tests must prove:

1. valid mounted S80B reaches the guest title and `A>` with no keyboard input;
2. RESET repeats autoboot while preserving mounted media;
3. no media and invalid header reach responsive MON;
4. injected header/payload/CBIOS read failures reach responsive MON;
5. manual `MON O` uses the same core and still reaches `A>`;
6. WBOOT, SAVE/ERA and disk Bus traffic remain valid;
7. title bytes originate from guest execution, not host DOM code;
8. PC and compact browser smoke pass with no console error or overflow.

Final commands:

```bash
export PATH="/Users/shino/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:/Users/shino/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback:$PATH"
node --version
pnpm --version
pnpm test
pnpm run build
pnpm run build:manual
git diff --check
```

## Delivery

Update the current system specification, active worklog and restart snapshots.
Deliver one logical commit and a PR linked to Issue #41. Do not merge without
explicit Human authorization.
