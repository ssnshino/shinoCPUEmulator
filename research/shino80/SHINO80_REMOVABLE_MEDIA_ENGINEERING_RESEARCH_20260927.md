# SHINO-80 Removable Media Engineering Research Note

Date: 2026-09-27 JST
Author: 戸澤 / ChatGPT
Status: Research / design input

## Question

How should SHINO-80 evolve from one mounted writable A: system image into a
safe removable-media workflow while preserving the project's one-page
distribution, browser portability, causal machine boundary and small-change
development process?

This note distinguishes:

- current SHINO-80 repository facts
- external engineering guidance researched on 2026-09-27
- design conclusions adopted for SHINO-80

## Current repository facts

The current block device already provides the machine-facing primitives needed
for media lifecycle work:

- `mountImage(Uint8Array)`
- `eject()`
- `exportImage()`
- exact image size validation at 256,256 bytes
- defensive copies on mount/export/eject
- controller reset that preserves inserted media
- atomic complete-sector writes
- Bus-visible guest I/O through ports 30h-36h

The current browser workbench creates one deterministic factory system disk and
mounts it in DRIVE A at page construction time.

The existing FDD/DISK design note already separates:

- DRIVE / controller
- removable DISK / MEDIA
- browser host services outside the guest-machine boundary

The next work should therefore build on the existing block-device contract, not
add a second host shortcut into Z80 RAM or CP/M.

## External engineering findings

### 1. Small batches are the right default

Google Engineering Practices recommends one self-contained change per CL,
including its related tests, and explicitly advises erring on the side of a
change being too small rather than too large. Small changes are easier to
review, reason about, merge and roll back.

Source:
<https://google.github.io/eng-practices/review/developer/small-cls.html>

DORA likewise recommends reducing batch size because smaller changes are easier
to reason about and recover from. Its current small-batches guidance explicitly
notes that this becomes more important with generative AI because AI can
increase delivery instability when velocity rises faster than control.

Sources:
<https://dora.dev/capabilities/working-in-small-batches/>
<https://dora.dev/guides/dora-metrics/>

### 2. Portable file import should prefer the baseline File API

`<input type="file">` is broadly available across modern browsers. The
`accept` attribute is only a chooser hint, not validation, so imported media
must still be validated in application code.

`File` is a `Blob`, and `Blob.arrayBuffer()` is a widely available,
Promise-based way to obtain binary content.

Sources:
<https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/file>
<https://developer.mozilla.org/en-US/docs/Web/API/File>
<https://developer.mozilla.org/en-US/docs/Web/API/Blob/arrayBuffer>
<https://www.w3.org/TR/FileAPI/>

Design implication: a later SHINO-80 image-import phase should use an ordinary
file input plus explicit byte-length / format validation as the compatibility
baseline.

### 3. File System Access API should not be the primary SHINO-80 path

`showOpenFilePicker()` remains limited-availability, experimental and
secure-context dependent. It also requires transient user activation.

Source:
<https://developer.mozilla.org/en-US/docs/Web/API/Window/showOpenFilePicker>

SHINO-80 intentionally supports a standalone one-page artifact and may be used
from `file://`. Therefore File System Access API can only be a future optional
enhancement, not the canonical import/export contract.

### 4. Portable export can use Blob URLs and the download attribute

Blob URLs are widely available and intended to represent generated in-memory
binary resources. The HTML `download` attribute can request download behavior
for `blob:` URLs and suggest a filename.

Sources:
<https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Schemes/blob>
<https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/a>

Design implication: a later read-only export slice can be implemented without
File System Access API or server participation.

### 5. Browser persistence is a different problem from removable media

IndexedDB is designed for significant structured client-side data and supports
values that use the structured clone algorithm, including binary data types.
It is asynchronous and transactional.

Sources:
<https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API>
<https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB>
<https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm>

However browser storage is origin-scoped and best-effort by default. Quotas and
eviction behavior vary by browser. Persistent storage can be requested, but it
is browser-controlled.

Sources:
<https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria>
<https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist>

Modern browsers also commonly treat `file://` resources as opaque origins,
with implementation-dependent behavior.

Source:
<https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Same-origin_policy>

Design implication: browser persistence must be a later, host-side convenience
layer. It must never become required for the machine to boot or for raw image
import/export to work.

### 6. Do not rely on unload to save media

MDN recommends avoiding `unload`; it is especially unreliable on mobile and
can also interfere with the back/forward cache. `visibilitychange` is a better
lifecycle signal, though no page-lifecycle signal should be treated as a
substitute for committing important state as it changes.

Sources:
<https://developer.mozilla.org/en-US/docs/Web/API/Window/unload_event>
<https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event>
<https://developer.mozilla.org/en-US/docs/Web/API/Window/pagehide_event>

Design implication: when persistence is implemented, media writes should drive
persistence state. Page exit should not be the only save point.

### 7. Browser QA should test user-visible behavior

Playwright recommends testing user-visible behavior, isolated test state,
user-facing locators and web-first assertions. It directly supports file input
testing, download observation and mobile/touch emulation.

Sources:
<https://playwright.dev/docs/best-practices>
<https://playwright.dev/docs/locators>
<https://playwright.dev/docs/input>
<https://playwright.dev/docs/downloads>
<https://playwright.dev/docs/emulation>

Design implication: SHINO-80 browser QA should click the same EJECT/INSERT
controls the Human sees, then verify machine-visible outcomes such as MON
fallback and CP/M autoboot, rather than calling hidden implementation helpers.

### 8. Media controls remain touch-sized controls

WCAG 2.2 defines 24 by 24 CSS px as the Level AA minimum target size, while the
existing SHINO-80 UI standard intentionally targets approximately 44 CSS px for
touch controls.

Source:
<https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum>

The SHINO-80 44px candidate remains the stronger local design rule.

## Adopted decomposition

Do not implement removable-media usability as one large change.

Adopt these bounded slices:

1. DRIVE A media lifecycle v0.1
   - EJECT currently inserted media
   - retain that exact medium in a host-side temporary shelf
   - REINSERT that exact medium
   - POWER OFF only
2. whole-disk EXPORT v0.1
   - read-only portable image extraction
3. whole-disk IMPORT v0.1
   - file input, exact length and selected format validation
4. factory-media creation / restore v0.1
   - explicit creation of a fresh deterministic factory medium
5. browser persistence v0.1
   - IndexedDB or separately selected host storage
   - persistence failure must not block machine operation
6. future B: / media library / individual CP/M file tools

Each slice must remain independently testable and leave main in a usable state.

## Immediate adopted slice

The next implementation should be only:

**DRIVE A removable-media lifecycle v0.1 — EJECT / REINSERT SAME MEDIA**

It does not perform file import, file export, factory replacement or durable
storage.

The key invariant is ownership:

```text
INSERTED
  diskA.medium = canonical bytes
  host shelf   = empty

EJECT
  diskA.eject()
      |
      v

EJECTED
  diskA.medium = null
  host shelf   = canonical bytes

REINSERT
  diskA.mountImage(host shelf)
      |
      v

INSERTED
  diskA.medium = canonical bytes
  host shelf   = empty
```

There must never be two independently writable canonical copies of the same
medium.

## Why this slice is first

- It proves DRIVE and MEDIA are genuinely separate concepts.
- It exercises already-existing device APIs instead of inventing storage APIs.
- It makes no browser-storage assumption.
- It makes no filesystem-picker assumption.
- It creates the exact state boundary that later import/export/persistence can
  attach to.
- It can be tested through user-visible behavior.
- Its failure surface is small enough to diagnose from one PR.

## Original-design boundary

External sources were used for engineering practice and Web platform behavior,
not for copying third-party emulator or firmware code. SHINO-80 machine design,
media state model, UI integration and test contracts remain original project
work.
