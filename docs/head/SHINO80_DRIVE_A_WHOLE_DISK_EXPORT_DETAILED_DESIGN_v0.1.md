# SHINO-80 DRIVE A Whole-Disk EXPORT v0.1 — Detailed Design

Status: IMPLEMENTATION-READY DESIGN
Updated: 2026-09-28 JST
Author: 戸澤 / ChatGPT
Baseline: `d2f9610144d6b164dd572f5ae84011f471eec28e`

## 1. Expected code boundary

Primary expected changes:

- `src/app/shino80-workbench-v0.0.2.js`
- `tests/browser_smoke_v0.0.9.cjs`
- generated standalone machine

CSS may change only if the third action needs a small local adjustment.

Not expected:

- template change
- block-device code change
- CPU / decoder / memory / Bus change
- ROM / CBIOS / CP/M change
- I/O allocation change

Stop if any of those become necessary.

## 2. Constants

Recommended host-layer constants:

```js
const DRIVE_A_EXPORT_FILENAME='SHINO80_DRIVE_A.s80d';
const DRIVE_A_EXPORT_MIME='application/octet-stream';
const DRIVE_A_EXPORT_REVOKE_MS=60000;
```

## 3. Source helper

Implement one helper that returns a new defensive copy of the current canonical
medium.

Conceptually:

```js
function driveAExportImage(){
  const inserted=diskA.mounted && driveAEjectedMedia===null;
  const ejected=!diskA.mounted && driveAEjectedMedia instanceof Uint8Array;

  if(inserted)return diskA.exportImage();
  if(ejected)return driveAEjectedMedia.slice();
  return null;
}
```

If ownership is inconsistent, return null. Do not guess.

## 4. Exportability

Conceptually:

```js
const inserted=diskA.mounted && driveAEjectedMedia===null;
const ejected=!diskA.mounted && driveAEjectedMedia instanceof Uint8Array;
const canExport=!ui.powered && (inserted || ejected);
```

## 5. Download helper

Conceptual implementation:

```js
function exportDriveA(){
  if(ui.powered)return false;

  const image=driveAExportImage();
  if(!(image instanceof Uint8Array) || image.length!==256256)return false;
  if(typeof Blob!=='function')return false;
  if(!URL?.createObjectURL || !URL?.revokeObjectURL)return false;

  const blob=new Blob([image],{type:DRIVE_A_EXPORT_MIME});
  const url=URL.createObjectURL(blob);
  const link=document.createElement('a');
  link.href=url;
  link.download=DRIVE_A_EXPORT_FILENAME;
  link.hidden=true;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),DRIVE_A_EXPORT_REVOKE_MS);
  return true;
}
```

The download click must occur synchronously on the Human button-event path.

## 6. Event path

Extend the current stable delegated action path:

```text
eject
insert-ejected
export-image
```

Keep delegation on the stable `#app` root. Do not bind handlers to transient
Inspector button nodes.

## 7. Inspector

Shared Disk A action group becomes:

```text
[ EJECT ]
[ INSERT EJECTED DISK ]
[ EXPORT IMAGE ]
```

Button matrix:

| State | EJECT | INSERT EJECTED DISK | EXPORT IMAGE |
|---|---:|---:|---:|
| POWER OFF + INSERTED | enabled | disabled | enabled |
| POWER OFF + EJECTED | disabled | enabled | enabled |
| POWER ON + INSERTED | disabled | disabled | disabled |
| POWER ON + EJECTED | disabled | disabled | disabled |

The note should explicitly state that EXPORT is read-only but POWER-OFF-only in
v0.1.

## 8. Browser regression

Extend the existing visible compact scenario.

Initial POWER OFF + INSERTED:

1. open DEVICES -> VIRTUAL DISK A
2. assert compact Inspector visible
3. assert EXPORT IMAGE visible/enabled
4. record Bus trace summary
5. wait for Playwright `download` event
6. click EXPORT IMAGE
7. assert suggested filename `SHINO80_DRIVE_A.s80d`
8. read downloaded file
9. assert 256,256 bytes
10. compare bytes to deterministic factory image
11. assert still INSERTED
12. assert Bus trace unchanged

Then:

13. EJECT
14. assert EJECTED
15. assert EXPORT remains enabled
16. export again
17. second payload byte-equals first
18. state remains EJECTED
19. INSERT EJECTED DISK still enabled
20. Bus trace unchanged

Then POWER ON while EJECTED:

21. EXPORT disabled
22. direct dispatch against disabled EXPORT must produce no download/state change
23. continue existing ROM MON fallback
24. POWER OFF / reinsert
25. POWER ON / RUN
26. CP/M title and A> return

Desktop 1280x900:

- right Inspector visibly contains EXPORT IMAGE
- powered guard matches compact

Compact-height 900x400:

- inline EXPORT visible
- no horizontal overflow

General:

- no page errors
- no unexpected network requests

## 9. Expected bytes in browser test

It is acceptable for the test to import the deterministic factory image builder
to obtain expected bytes. This is test-only comparison data; the action itself
must still be executed through the visible EXPORT button.

Do not call workbench internals from the test.

## 10. Object URL lifecycle

Revoke with an explicit delayed callback. Do not revoke synchronously after
`click()`.

Do not store the blob URL as disk or machine state.

## 11. Documentation scope

Feature PR may update focused Technical Manual authored wording/assertions if
needed for current user-visible behavior.

README/Snapshot/post-merge baseline closeout remains PM/SE work after merge.

## 12. Stop conditions

Stop and report instead of expanding scope if:

- exact bytes require block-device semantic changes
- browser path needs File System Access API or a server
- compact UI requires broad redesign
- CPU/ROM/CBIOS/CPM changes appear necessary
- R2 starts absorbing IMPORT/persistence/factory restore

## 13. PR contract

Implementation PR:

- one R2 behavior
- visible desktop + compact action
- browser download regression
- normal generated artifact
- implementation worklog/evidence
- one logical commit
- leave unmerged for Human review
