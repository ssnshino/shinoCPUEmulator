# SHINO-80 PHASE 4 — CP/M Compatibility + Foreign Media Bridge Specification v1

Status: NORMATIVE / IMPLEMENTED CANDIDATE / HUMAN REVIEW PENDING
Updated: 2026-09-30 JST
Issue: #63
Baseline: `830f6a30c9b2a22dbdef3b0e400ff863c14e6654`

## 1. Scope

PHASE 4 adds:
1. an explicit CP/M 2.2 software/filesystem compatibility regression gate;
2. a host-side read-only foreign-media bridge that extracts files from exact supported foreign CP/M formats and repacks them into a fresh SHINO native medium.

Foreign media does not become a native A:/B: medium.

## 2. Immutable PHASE 3 boundary

- native media IDs remain 00h–04h
- ports 30h–38h retain PHASE 3 semantics
- S80B v2/v3 retain reviewed behavior
- A: is the only autoboot source
- B: never autoboots
- guest disk I/O remains CPU -> Bus -> block controller
- foreign IDs are host-only and never returned by port 38h
- foreign source media is never directly mounted into the guest controller
- native whole-disk host transactions remain the canonical replacement path
- foreign parsing/inspection/conversion/download emits no synthetic guest Bus I/O

## 3. Layers

- Compatibility Test Layer
- Foreign Container Layer
- Foreign CP/M Profile Layer
- Foreign Filesystem Reader
- Native Bridge Layer

Container parsing and filesystem interpretation are separate.

## 4. Normalized foreign model

```
ForeignContainer { type, fileName, sourceBytes, disks[], warnings[] }
ForeignDisk { index, name, writeProtected, comment, tracks[], structuralWarnings[] }
ForeignTrack { cylinder, head, ordinal, sectors[] }
ForeignSector { cylinder, head, sectorId, sizeCode, byteLength, status, data, sourceOffset }
```

Source/container/track/sector data is immutable from the caller's perspective. Physical sectors are located by explicit sectorId, never by array ordinal.

## 5. Container detection

Extension is a hint only. Structural validation decides.

- 0 matches -> UNSUPPORTED_CONTAINER
- 1 match -> use parser
- >1 matches -> AMBIGUOUS_CONTAINER

## 6. D88 reader

Read-only. Parse:
- 0x2B0-byte disk header
- disk name/write protect/media type/disk size
- track offset table
- per-sector C/H/R/N and payload metadata
- zero track offsets
- non-sequential sector IDs
- concatenated multi-disk images

Validate declared sizes, offsets, sector headers and payload bounds.

Preserve irregularities with warnings where possible:
- duplicate sector IDs
- missing expected sectors
- variable sector sizes
- deleted/status markers

Conversion is disabled if exact profile mapping is unsafe.

## 7. FDI reader

Fields:
- 00h reserved
- 04h FDDType
- 08h HeaderSize
- 0Ch DataSize
- 10h BytesPerSector
- 14h SectorsPerTrack
- 18h Heads
- 1Ch Cylinders

Require:
- HeaderSize >= 32
- HeaderSize <= file length
- HeaderSize + DataSize == file length
- positive geometry
- geometry product == DataSize

Data order is C/H/S linear.

## 8. DCP/DCU reader

Read-only. PHASE 4 v1 follows the verified interpretation used by `o-p-a/fdimageid` commit `80f970af5a7fa8f916d849a722e5ae2e1ea5103c`, rather than treating the contradictory "all cylinders stored flag" wording in older format notes as authoritative.

### 8.1 Header and track-vector layout

- header size: exactly 162 bytes = 0xA2
- offset 0x00: 1-byte media type
- offsets 0x01..0xA1 inclusive: 161 bytes, each byte must be 0 or 1
- there is no separately parsed all-cylinders-stored flag in the v1 contract
- payload begins at offset 0xA2

The 161-byte vector contains zero or more track-present flags followed by a terminal sentinel:

- find the last byte equal to 1 in the 161-byte vector
- that last 1 is the end sentinel and has no corresponding track payload
- bytes before the sentinel are actual per-track presence flags
- flag 1 means the corresponding track payload is stored
- flag 0 means the corresponding track payload is absent
- no sentinel -> malformed DCP/DCU

The sentinel index may not exceed the geometry's maximum track count. For exact CP/M profile conversion, every track required by that descriptor must be present after layout resolution.

### 8.2 Full-layout versus sparse-layout resolution

Let `HEADER_SIZE = 162`.

For the selected media type, calculate the full geometry payload size.

- if `fileLength == HEADER_SIZE + fullGeometryPayloadBytes`, treat the image as a full-layout image: all geometry tracks are stored, regardless of zero entries in the track vector
- otherwise treat it as sparse-layout: stored payload bytes must equal the sum of track sizes for the pre-sentinel flags whose value is 1
- any other file length is malformed

This file-length rule replaces the previously assumed all-cylinders flag.

Payload tracks are stored in increasing logical track order. For ordinary two-head geometries:

- `cylinder = floor(trackIndex / heads)`
- `head = trackIndex % heads`

Within each stored track, sector payload is sequential sector IDs 1..sectorsPerTrack.

Absent sparse tracks remain explicitly absent in the normalized model; they are not silently converted into real sectors for exact-profile conversion.

### 8.3 Supported media-type mappings

PHASE 4 v1 recognizes these DCP/DCU media values:

- 01h: 77×2×8×1024 = 1,261,568 bytes
- 02h: 80×2×15×512 = 1,228,800 bytes
- 03h: 80×2×18×512 = 1,474,560 bytes
- 04h: 80×2×8×512 = 655,360 bytes
- 05h: 80×2×9×512 = 737,280 bytes
- 08h: 80×2×9×1024 = 1,474,560 bytes
- 11h: 77×2×26, track 0 uses 128-byte sectors and later tracks use 256-byte sectors; total payload 1,021,696 bytes
- 19h: 80×2×16×256 = 655,360 bytes
- 21h: 80×2×26×256 = 1,064,960 bytes

Unknown media values are not guessed and are rejected as unsupported for v1 parsing/conversion.

Only an exact foreign CP/M descriptor may enable filesystem conversion. A recognized DCP/DCU geometry without F000/F001 compatibility remains inspection-only.

Reference basis:
- https://www.pc98.org/project/doc/dcp.html
- https://github.com/o-p-a/fdimageid/blob/80f970af5a7fa8f916d849a722e5ae2e1ea5103c/fdimageid

## 9. Foreign namespace

Host-only:
- F000 IBM3740-CPM22
- F001 SINCLAIR-PLUS3-CPM22-720

These are not port-38h MEDIA_PROFILE IDs.

## 10. F000 IBM3740-CPM22

Physical:
- 77 tracks
- 1 head
- 26 sectors/track
- 128 bytes/sector
- 256,256 bytes

DPB:
- SPT26 BSH3 BLM7 EXM0 DSM242 DRM63
- AL0 C0h AL1 00h CKS16 OFF2
- 1024-byte blocks
- 1-byte allocation pointers

XLT:
`1,7,13,19,25,5,11,17,23,3,9,15,21,2,8,14,20,26,6,12,18,24,4,10,16,22`

F000 is distinct from SHINO CLASSIC because F000 requires foreign sector translation.

## 11. F001 SINCLAIR-PLUS3-CPM22-720

Physical:
- 80 cylinders
- 2 heads
- 9 sectors/track
- 512 bytes/sector
- 160 logical tracks
- 737,280 bytes

DPB:
- SPT36 BSH4 BLM15 EXM0 DSM356 DRM255
- AL0 F0h AL1 00h CKS64 OFF1
- 2048-byte blocks
- 2-byte little-endian allocation pointers

Logical track order:
C0/H0,C0/H1,C1/H0,C1/H1...

Sector order is identity.

F001 is distinct from SHINO native 2DD-720 despite identical image size. SHINO native 2DD-720 uses OFF2, 4096-byte blocks, DRM127, DSM176 and 8-bit allocation pointers.

## 12. Descriptor selection and exact-match contract

D88/FDI/DCP/DCU do not carry a normative CP/M DPB/XLT identity that is sufficient to distinguish every filesystem sharing the same physical geometry. Therefore PHASE 4 v1 does not auto-assert a filesystem profile from container geometry.

### 12.1 Candidate discovery

After structural container parsing, the host may compute a list of structurally compatible foreign descriptors using only descriptor predicates such as:

- allowed container type
- exact cylinder/head/track requirements
- exact required sector IDs per track
- exact physical sector byte lengths
- required track completeness
- descriptor-specific ordering constraints

This candidate list is advisory only.

- zero compatible descriptors -> `UNKNOWN_CPM_PROFILE`
- more than one compatible descriptor -> display all compatible candidates; do not choose automatically
- exactly one compatible descriptor -> it may be shown as the sole candidate, but it is still not conversion-authorized automatically

Directory plausibility, filename contents, extension, and source filename never promote a candidate to an exact match.

### 12.2 Human explicit selection

PHASE 4 v1 requires an explicit Human profile selection before filesystem inspection/conversion.

The Foreign Bridge UI starts with no committed foreign profile. The user selects F000 or F001 from the compatible-candidate list.

Programmatic tests use the same explicit descriptor ID parameter.

No sidecar manifest schema is part of PHASE 4 v1.

### 12.3 Descriptor validation after selection

After explicit selection, the descriptor validator must re-check the entire parsed disk against the selected descriptor.

F000 requires:

- exactly 77 required logical tracks, one head
- for every required track, exactly one usable sector for each sector ID 1..26
- every required sector is exactly 128 bytes
- no missing/duplicate required sector ID
- selected descriptor XLT is the frozen F000 XLT

F001 requires:

- exactly 80 cylinders × 2 heads = 160 required logical tracks
- C/H logical order C0/H0,C0/H1,C1/H0,C1/H1...
- for every required track, exactly one usable sector for each sector ID 1..9
- every required sector is exactly 512 bytes
- no missing/duplicate required sector ID
- identity sector order

Extra/irregular sectors that make required-sector identity ambiguous reject conversion.

Only after this validation succeeds does state become `PROFILE_MATCHED`.

A Human selecting a descriptor is permission to validate it, not permission to bypass validation.

Inspection of container structure may continue without a selected filesystem descriptor.

## 13. Logical records

All CP/M logical records are 128 bytes.

Read path:
1. logicalTrack -> C/H via descriptor
2. logical sector -> physical sector ID via XLT/order
3. locate sector by sectorId
4. ratio = physicalSectorSize / 128
5. derive record offset
6. return exactly 128 bytes

Reject missing required sectors, invalid ratios and out-of-range records.

## 14. Directory

Starts after OFF logical tracks.

Directory bytes = (DRM+1)*32.

Entry:
- 0 user
- 1..8 name
- 9..11 ext
- 12 EX
- 13 S1
- 14 S2
- 15 RC
- 16..31 allocations

E5h entries are deleted. Users 0..15 are normal. High attribute bits must not corrupt the base 8.3 name.

Allocation decoding:
- F000: sixteen uint8 entries
- F001: eight uint16 LE entries

Blocks outside 0..DSM are malformed.

## 15. Extents/files

Grouping key: USER + normalized 8.3 name.

Extent = `(S2 << 5) | (EX & 1Fh)`.

Sort ascending. Duplicate/gapped/malformed structures are surfaced and conversion is refused when reconstruction is unsafe.

Raw extraction is record-based. PHASE 4 does not infer exact last-byte length beyond CP/M record semantics. 0x1A is not trimmed during raw extraction/conversion. Text-view-only UI may hide trailing 0x1A for display.

## 16. Native conversion

Destination can be any existing native profile.

Use existing blank/media/filesystem builders.

Preserve:
- USER
- normalized 8.3 filename
- reconstructed raw record bytes

Do not preserve:
- foreign allocation block numbers
- foreign physical placement
- boot/system tracks
- container metadata
- unsupported attributes

Output is a fresh medium. Source and canonical A:/B: remain unchanged.

## 17. Capacity preflight

Before BUILD compute:
- selected files
- logical records
- extents
- directory entries
- allocation blocks
- destination capacity

Any failure disables/rejects BUILD. Partial conversion is forbidden.

## 18. Host UX

Native IMPORT remains separate.

`OPEN FOREIGN IMAGE -> inspection -> disk selector -> exact profile status -> warnings -> directory/file list -> USER filter -> selection -> destination -> capacity -> BUILD SHINO DISK`

After BUILD:
- DOWNLOAD .s80d
- SEND TO NATIVE IMPORT

SEND TO NATIVE IMPORT feeds generated native bytes/profile ID into the existing PHASE 3 pending transaction. Canonical media remains unchanged until CONFIRM IMPORT.

## 19. State machine

IDLE -> READING -> PARSED -> PROFILE_MATCHED -> SELECTING -> READY_TO_BUILD -> BUILT
with FAILED as recoverable failure state.

Failures do not mutate A:/B:.

## 20. CP/M compatibility gate

Repository-original fixtures cover:

Transient ABI:
- 0100h entry
- CALL 0005h
- CCP return
- WBOOT
- stack behavior

BDOS console:
- 01h / 02h / 06h / 09h / 0Bh

FCB/disk:
- OPEN/CLOSE
- SEARCH FIRST/NEXT
- DELETE
- READ/WRITE SEQ
- MAKE/RENAME
- RANDOM READ/WRITE
- SET DMA
- SELECT DISK
- GET CURRENT DISK
- RESET DISK
- GET/SET USER

Boundary:
- 0/1/127/128/129 records
- allocation boundaries
- multi-extent
- delete/reuse
- USER 0/1/15
- same-name A/B isolation
- directory full
- disk full

## 21. Fixture policy

Repository fixtures are generated and legally clean.

Do not commit third-party copyrighted software images, proprietary system disks, ROM dumps or commercial executables.

## 22. Non-goals

- direct foreign guest mount
- foreign boot
- foreign writer
- copy-protection emulation
- arbitrary heuristic CP/M detection
- CP/M 3
- timestamp extension preservation
- third-party executable redistribution

## 23. Workflow contract

Codex implements this frozen specification; it does not re-review/redesign it as a separate task.

A -> F proceeds continuously. Routine checkpoint reports must not stop implementation.

Only a real spec ambiguity/contradiction permits an Issue #63 question and stop.

One final PR is created at closeout. Human controls merge. Publication remains separate.

## Update History

- 2026-09-30T14:50:37+09:00 — Codex — Clarified contract implemented on purpose branch. See PHASE 4 worklog for verification and artifact hashes. Normative requirements remain unchanged; merge approval is not implied.

- 2026-09-30T16:53:59+09:00 — Codex — Replaced logical-track formula hard breaks with a list; normative semantics unchanged.
