# SHINO-80 DRIVE A Media Lifecycle v0.1 — Basic Design

Status: IMPLEMENTATION-READY DESIGN
Updated: 2026-09-27 JST
Author: 戸澤 / ChatGPT

## 1. Purpose

Add the first real removable-media lifecycle to DRIVE A without adding host
file I/O or persistence.

The Human can:

- POWER OFF
- EJECT the currently inserted A: medium
- keep that exact medium outside the drive in a host-side temporary shelf
- REINSERT the same medium
- POWER ON and boot it again

This phase exists to prove the architecture boundary, not to complete the
entire disk-management feature set.

## 2. Existing contracts reused unchanged

Machine-facing block-device API:

- `Shino80BlockDevice.mountImage(image, options)`
- `Shino80BlockDevice.eject()`
- `Shino80BlockDevice.exportImage()`
- `Shino80BlockDevice.mounted`

Existing guarantees:

- mount accepts only exact-size `Uint8Array`
- mount makes a defensive copy
- eject returns a defensive copy
- reset does not eject media
- complete sector writes are atomic
- guest accesses the medium only through Bus-visible block-device I/O

No new I/O ports or block-device commands are required.

## 3. Ownership model

The workbench adds one host-side variable representing a temporarily ejected
medium.

Conceptual name:

`driveAEjectedMedia`

It is either:

- `null`, or
- one exact 256,256-byte `Uint8Array`

Canonical ownership invariant:

### INSERTED

```text
diskA.mounted === true
driveAEjectedMedia === null
```

### EJECTED

```text
diskA.mounted === false
driveAEjectedMedia instanceof Uint8Array
```

The normal UI flow must never intentionally keep both as canonical writable
copies.

## 4. State transitions

```text
                POWER OFF only
     +-----------------------------------+
     |                                   |
     v                                   |
[ INSERTED ] -- EJECT --> [ EJECTED ] -- INSERT EJECTED --> [ INSERTED ]
```

POWER ON does not change media ownership.

RESET does not change media ownership.

WBOOT does not change media ownership.

Browser reload remains current behavior: a fresh factory system disk is created
and inserted. Durable persistence is a later phase.

## 5. Safety policy

Media-changing actions are permitted only while `ui.powered === false`.

Safety is enforced twice:

1. visible controls are disabled when an action is not allowed
2. action handlers independently reject the operation when POWER is ON or the
   media state does not match

UI disabled state is not treated as the security/correctness boundary.

Hot swap is explicitly not implemented.

## 6. User interface placement

Controls remain under the existing DEVICES destination. Do not add a new
top-level navigation destination.

The current live UI has two layout families relevant to this phase:

- desktop / ordinary medium layouts: the persistent right-side Inspector is
  Human-visible
- compact phone and compact-height layouts: the global `.inspector` is hidden
  by the existing CSS, so the current right-side Inspector is not Human-visible

Therefore the v0.1 contract is:

### Desktop / ordinary medium

`DEVICES -> VIRTUAL DISK A -> right-side Inspector`

### Compact / compact-height

`I/O (DEVICES) -> VIRTUAL DISK A -> inline selected-device inspector inside
the DEVICES major pane`

The compact path preserves the existing UI standard:

- one major pane at a time
- no desktop three-pane squeeze
- selected device remains contextual supporting information
- Disk A controls remain Human-visible

The desktop and compact surfaces must present the same Disk A media state and
the same EJECT / INSERT EJECTED DISK actions from one shared state model.

The selected-device inspector shows at minimum:

- DRIVE A
- Media state: INSERTED or EJECTED
- Geometry
- Image size
- current controller selection / transfer / error
- EJECT button
- INSERT EJECTED DISK button

Button state:

| Machine/media state | EJECT | INSERT EJECTED DISK |
|---|---:|---:|
| POWER OFF + inserted | enabled | disabled |
| POWER OFF + ejected | disabled | enabled |
| POWER ON + inserted | disabled | disabled |
| POWER ON + ejected | disabled | disabled |

Existing SHINO UI rule remains: touch targets approximately 44 CSS px or larger.

## 7. Device-list state

For `disk-a`:

- POWER OFF -> `OFF`
- POWER ON + mounted -> `READY`
- POWER ON + no media -> `EMPTY`

The inspector carries the more precise removable-media state even while POWER
is OFF.

## 8. Expected machine behavior

### No medium

After Human ejects the medium while POWER OFF:

- POWER ON
- RUN
- released ROM autoboot attempts A:
- no-media path falls back to ROM MON
- machine remains responsive

No new fallback logic is added in this phase.

### Reinserted medium

After Human powers off and reinserts the same valid medium:

- POWER ON
- RUN
- released ROM autoboot succeeds
- disk-side `SHINO-80 CP/M 2.2`
- `A>`

No new loader logic is added.

## 9. Data-preservation requirement

A medium modified before EJECT must contain the same bytes after
EJECT -> REINSERT.

This phase must never rebuild the factory disk during ordinary reinsertion.

The deterministic factory builder remains responsible only for initial page
construction in this phase.

## 10. Non-goals

- IMPORT IMAGE
- EXPORT IMAGE
- INSERT FACTORY DISK / factory restore
- IndexedDB or other persistence
- multiple media inventory
- B:
- write-protect UI
- powered hot swap
- guest eject command
- CP/M disk-change semantics
- CPU / decoder / flags changes
- ROM / CBIOS / BDOS changes
- new block-device I/O commands
- public deployment

## 11. Acceptance summary

This design is complete when:

- desktop and compact/mobile both provide a Human-visible Disk A operation path
- a Human can visibly remove A:'s medium
- POWER ON -> RUN with A: empty reaches ROM MON fallback
- the same medium can be reinserted and boot CP/M again
- byte preservation is verified by automated tests
- compact UI retains no horizontal overflow and remains one-major-pane
