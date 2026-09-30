# SHINO-80 PHASE 3 — Multi-Profile FDD Normative Specification v1

Status: SPECIFICATION FROZEN / CHECKPOINTS A–E IMPLEMENTED + VERIFIED / CHECKPOINT F CLOSEOUT
Issue: #59
Purpose branch: `feature/shino80-multi-profile-fdd-phase3-20260929`
Baseline main: `c6e0e041370bd20b2a32fa10c218f4212c051fdf`
Updated: 2026-09-30 JST

This file is the normative repository contract for PHASE 3. Google Drive is
design history only; implementation must be possible from this repository
without consulting Drive.

## Compatibility invariants

- CLASSIC 256,256-byte media remains byte-for-byte compatible.
- CLASSIC S80B v2 parse/load path remains unchanged.
- CLASSIC ports 30h–36h semantics remain unchanged.
- A: is the only autoboot source; B: never autoboots.
- WBOOT reloads from A: and preserves the current CP/M drive, including B: -> B>.
- existing CLASSIC `.s80d` filenames and byte-exact round-trip remain.
- PHASE 2 canonical ownership/pending-import semantics remain.
- host actions never fabricate guest Bus I/O.
- media replacement/import confirmation remains POWER-OFF-only.

## 1. Native profiles and final DPB

Mechanical formulas:

```
logicalTracks = cylinders * heads
logicalSPT = physicalSectorsPerTrack * (physicalSectorSize / 128)
trackBytes = logicalSPT * 128
reservedSystemBytes = OFF * trackBytes
allocationBlocks = floor((imageBytes - reservedSystemBytes) / allocationBlockSize)
DSM = allocationBlocks - 1
directoryBytes = (DRM + 1) * 32
directoryBlocks = ceil(directoryBytes / allocationBlockSize)
filesystemUsableBytes = (allocationBlocks - directoryBlocks) * allocationBlockSize
BSH = log2(allocationBlockSize / 128)
BLM = 2^BSH - 1
EXM = allocationBlockSize / 1024 - 1   // all five DSM values are < 256
CKS = (DRM + 1) / 4
```

| ID | Profile | Cyl | Heads | Phys S/T | Phys bytes | Image bytes | CP/M SPT | BSH | BLM | EXM | DSM | DRM | AL0 | AL1 | CKS | OFF | Block bytes | Dir bytes | Reserved system bytes | File usable bytes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 00h | CLASSIC | 77 | 1 | 26 | 128 | 256,256 | 26 | 3 | 7 | 0 | 242 | 63 | C0h | 00h | 16 | 2 | 1,024 | 2,048 | 6,656 | 246,784 |
| 01h | 2HD-JP | 77 | 2 | 8 | 1,024 | 1,261,568 | 64 | 6 | 63 | 7 | 152 | 255 | 80h | 00h | 64 | 1 | 8,192 | 8,192 | 8,192 | 1,245,184 |
| 02h | 2DD-720 | 80 | 2 | 9 | 512 | 737,280 | 36 | 5 | 31 | 3 | 176 | 127 | 80h | 00h | 32 | 2 | 4,096 | 4,096 | 9,216 | 720,896 |
| 03h | 2HD-AT-1200 | 80 | 2 | 15 | 512 | 1,228,800 | 60 | 6 | 63 | 7 | 148 | 255 | 80h | 00h | 64 | 1 | 8,192 | 8,192 | 7,680 | 1,212,416 |
| 04h | 2HD-1440 | 80 | 2 | 18 | 512 | 1,474,560 | 72 | 6 | 63 | 7 | 177 | 255 | 80h | 00h | 64 | 1 | 8,192 | 8,192 | 9,216 | 1,449,984 |

Directory reservation is two allocation blocks only for CLASSIC (AL0=C0h);
all other profiles reserve one allocation block (AL0=80h). AL1=00h for all
profiles.

Logical track to physical order is fixed for all profiles:

```
cylinder = floor(logicalTrack / heads)
head     = logicalTrack % heads
```

Thus two-head media enumerate C0/H0, C0/H1, C1/H0, C1/H1 ... . CLASSIC reduces
to Cn/H0.

A DPB calculator fixture must reproduce every field and derived byte count above
exactly before Checkpoint B/C/D code is accepted.

## 2. Controller ports 30h–38h

STATUS bits at 30h remain:

- 01h READY
- 02h BUSY (defined but not asserted by current implementation)
- 04h DRQ
- 40h WRITE_PROTECT
- 80h ERROR

| Port | Name | Access | Full-device reset state | Contract |
| --- | --- | --- | --- | --- |
| 30h | STATUS | R | derived; normal writable mounted A: => 01h | READY=selected mounted medium, DRQ=active transfer, WP=selected medium, ERROR=(error!=0) |
| 31h | COMMAND | R/W | 00h | 01h READ, 02h WRITE, 7Fh command-level reset; any other value => PROTOCOL |
| 32h | DRIVE | R/W | 00h | raw 8-bit latch; 0=A, 1=B valid; >=2 fails command validation with BAD_DRIVE |
| 33h | CYLINDER / legacy TRACK | R/W | 00h | CLASSIC retains TRACK semantics; command-time range 0..cylinders-1 |
| 34h | SECTOR | R/W | 01h | command-time range 1..physical sectors/track |
| 35h | DATA | R/W | none | transfers exactly physicalSectorSize bytes |
| 36h | ERROR | R; W=00h clear | 00h | read current code; write 00h clears; nonzero writes ignored |
| 37h | HEAD | R/W | 00h | command-time range 0..heads-1; CLASSIC only 0 |
| 38h | MEDIA_PROFILE | R | derived | valid mounted selected drive => 00h..04h; no media or invalid DRIVE => FFh; writes ignored without affecting transfer/state |

### Register and transfer state rules

Writes to DRIVE, CYLINDER, SECTOR or HEAD abort an active transfer immediately
without setting a new error. This extends the existing 32h/33h/34h behavior.
DRIVE changes preserve the raw C/H/S values.

A COMMAND write aborts any current transfer, clears the previous error, latches
the new command, then validates/starts it. COMMAND 7Fh clears transfer/error but
preserves DRIVE/C/H/S. A full device reset sets DRIVE=0, C=0, H=0, S=1,
COMMAND=0, ERROR=0 and no active transfer.

POWER-OFF EJECT/REINSERT follows the existing mount/eject full-reset behavior,
therefore controller registers return to the full-reset state. Shelf media bytes,
profile ID and write-protect ownership remain intact.

READ/WRITE DATA byte counts:

- profile 00h: 128
- profiles 02h/03h/04h: 512
- profile 01h: 1024

After exactly that many DATA bytes the transfer closes. DATA over-read after
closure returns FFh and sets PROTOCOL. DATA over-write after closure is
discarded and sets PROTOCOL. Issuing another COMMAND mid-transfer aborts the old
transfer and begins validation of the new command.

READ/WRITE validation order is fixed:

`BAD_DRIVE -> NO_MEDIA -> BAD_CYLINDER -> BAD_HEAD -> BAD_SECTOR -> WRITE_PROTECTED`
(the last check applies to WRITE only).

Final error codes:

| Code | Name | Meaning |
| ---: | --- | --- |
| 00h | NONE | no error |
| 01h | NO_MEDIA | valid selected drive has no medium |
| 02h | BAD_DRIVE | DRIVE is not 0 or 1 |
| 03h | BAD_CYLINDER | cylinder outside profile; legacy `BAD_TRACK` remains an alias for code 03h |
| 04h | BAD_SECTOR | sector outside 1..physical sectors/track |
| 05h | WRITE_PROTECTED | WRITE to protected medium |
| 06h | PROTOCOL | invalid command or DATA access without matching transfer |
| 07h | BAD_HEAD | head outside selected profile |

Reading 38h on no-media/invalid-drive returns FFh without mutating ERROR.

## 3. S80B v3 exact header

S80B v3 is the PHASE 3 system format only for profile 01h 2HD-JP. All
multi-byte fields are little-endian.

| Offset | Bytes | Field | Required value / rule |
| ---: | ---: | --- | --- |
| 00h | 4 | magic | ASCII `S80B` |
| 04h | 1 | version | 03h |
| 05h | 1 | headerLength | 40h |
| 06h | 1 | mediaProfileId | 01h |
| 07h | 1 | flags | 00h |
| 08h | 4 | systemAreaLength | 00002000h |
| 0Ch | 4 | filesystemOffset | 00002000h |
| 10h | 4 | loaderOffset | 00000040h |
| 14h | 2 | loaderLength | 0080h |
| 16h | 2 | loaderLoadAddress | 8000h |
| 18h | 2 | loaderEntryAddress | 8000h |
| 1Ah | 4 | cbiosOffset | 00000100h |
| 1Eh | 2 | cbiosLength | 0900h |
| 20h | 2 | cbiosLoadAddress | F400h |
| 22h | 2 | cbiosEntryAddress | F400h |
| 24h | 4 | ccpOffset | 00000A00h |
| 28h | 2 | ccpLength | 0800h |
| 2Ah | 2 | ccpLoadAddress | 9400h |
| 2Ch | 4 | bdosOffset | 00001200h |
| 30h | 2 | bdosLength | 0E00h |
| 32h | 2 | bdosLoadAddress | 9C00h |
| 34h | 11 | reserved | all 00h |
| 3Fh | 1 | checksum8 | sum(bytes 00h..3Eh) mod 256; checksum byte excluded |

Fixed C0/H0 system-area packing:

- 0000h–003Fh: header
- 0040h–00BFh: 128-byte loader
- 00C0h–00FFh: zero-filled reserved padding
- 0100h–09FFh: padded 2304-byte CBIOS v3 resident image
- 0A00h–11FFh: CCP, 2048 bytes
- 1200h–1FFFh: BDOS, 3584 bytes
- 2000h: filesystem start = C0/H1

The fixed header fixture is:

```
53 38 30 42 03 40 01 00 00 20 00 00 00 20 00 00
40 00 00 00 80 00 00 80 00 80 00 01 00 00 00 09
00 F4 00 F4 00 0A 00 00 00 08 00 94 00 12 00 00
00 0E 00 9C 00 00 00 00 00 00 00 00 00 00 00 95
```

For that byte sequence checksum8 is 95h.

### ROM v3 rejection/fallback

Before page-out, ROM must reject and return to MON on:

- bad magic, version, headerLength, mediaProfileId, flags or reserved bytes
- bad checksum
- selected A: profile not 01h
- systemAreaLength/filesystemOffset not exactly 2000h
- any fixed offset/length/load/entry mismatch
- integer/range overflow
- any header/loader/CBIOS/CCP/BDOS range outside 0000h–1FFFh
- overlap among header/loader/CBIOS/CCP/BDOS
- unsupported version
- controller read failure

Profile 01h mount/import validation already requires exact image length
1,261,568 bytes.

CLASSIC profile 00h remains on the existing S80B v2 parser/loader unchanged.

## 4. Exact high-RAM map

| Start | End inclusive | Bytes | Owner | Lifetime |
| --- | --- | ---: | --- | --- |
| E800h | EBFFh | 1024 | shared physical-sector scratch | CBIOS runtime |
| EC00h | EFFFh | 1024 | loader private stack region, SP=F000h and grows downward | boot only |
| F000h | F3FFh | 1024 | reserved guard | unused in PHASE 3 |
| F400h | FA7Fh | 1664 | CBIOS v3 executable code | resident |
| FA80h | FA9Fh | 32 | DPH_A + DPH_B, 16 bytes each | resident |
| FAA0h | FAEFh | 80 | five 16-byte DPB slots, profile 00h..04h | resident |
| FAF0h | FB2Fh | 64 | CSV_A, max CKS=64 | resident |
| FB30h | FB6Fh | 64 | CSV_B, max CKS=64 | resident |
| FB70h | FB8Fh | 32 | ALV_A | resident |
| FB90h | FBAFh | 32 | ALV_B | resident |
| FBB0h | FBCFh | 32 | deblock state A | resident |
| FBD0h | FBEFh | 32 | deblock state B | resident |
| FBF0h | FC0Fh | 32 | shared immediate-RMW state | resident |
| FC10h | FCFFh | 240 | zero-filled CBIOS v3 reserved tail | resident |
| FD00h | FD7Fh | 128 | existing shared DIRBUF | resident |

The complete padded CBIOS v3 image is F400h–FCFFh = 2304 bytes, matching
S80B v3 cbiosLength=0900h. Executable code must end <=FA7Fh. Fixed tables/state
must stay in their assigned ranges. The padded resident image ends FCFFh<FD00h.

The memory-overlap fixture must assert:

- every listed interval is pairwise disjoint
- scratch/stack/CBIOS/DIRBUF are outside TPA 0100h–93FFh, CCP 9400h–9BFFh and
  BDOS 9C00h–A9FFh
- stack SP begins F000h and may not descend below EC00h
- no runtime range overlaps Page Zero or default DMA 0080h
- CBIOS executable does not cross FA80h
- complete CBIOS resident image ends before FD00h
- CLASSIC S80B v2 CBIOS remains at FA00h and is not relocated

## 5. Host profile UX and raw .s80d

Length-to-profile is exact:

| Image bytes | Profile |
| ---: | --- |
| 256,256 | 00h CLASSIC |
| 1,261,568 | 01h 2HD-JP |
| 737,280 | 02h 2DD-720 |
| 1,228,800 | 03h 2HD-AT-1200 |
| 1,474,560 | 04h 2HD-1440 |

IMPORT reads the full file first, then maps exact length to one profile. Unknown
length is rejected before pending state with:

`IMPORT REJECTED — UNSUPPORTED MEDIA SIZE: <bytes> BYTES`

If a future profile table has duplicate lengths, that length must not be
auto-guessed. Reject it with:

`IMPORT REJECTED — AMBIGUOUS MEDIA SIZE: <bytes> BYTES`

until a future explicit-profile/container contract exists.

Pending IMPORT displays:

- target drive
- file name
- byte length
- profile ID and canonical name
- cylinders / heads / sectors-per-track / physical-sector bytes

Inspector displays:

- profile ID
- profile name
- cylinders
- heads
- sectors/track
- physical-sector bytes
- image bytes
- current C/H/S

EXPORT filenames remain exactly `SHINO80_DRIVE_A.s80d` and
`SHINO80_DRIVE_B.s80d` for every profile. No profile suffix is introduced.

PHASE 3 adds no host `NEW BLANK` action. Blank native media are created by
profile-aware source/test/builder APIs. Existing page defaults remain A:
CLASSIC system and B: CLASSIC blank unless replaced/imported.

EJECT/REINSERT preserves `bytes + profileId + writeProtected` as one canonical
medium. Pending target-drive EJECT/REINSERT remains disabled in UI and rejected
by handlers. The other drive remains independently usable except that a second
IMPORT cannot start while one pending transaction exists. Host actions generate
no synthetic Bus events.

## 6. Profile-aware CBIOS / SELDSK

### Discovery and drive state

SELDSK C=0/1:

1. writes selected drive to 32h through the Bus
2. reads 38h MEDIA_PROFILE through the Bus on every SELDSK call
3. stores the returned ID in that drive's deblock-state slot
4. chooses the matching fixed DPB slot
5. returns the fixed DPH_A or DPH_B pointer

C>=2, FFh (no media/invalid drive), or unsupported profile returns HL=0000h.

DPH_A and DPH_B remain fixed and distinct. Their DPB pointer is selected from
the five fixed DPB slots at successful SELDSK. A/B CSV, ALV and deblock
metadata are independent. The 1024-byte physical-sector scratch is shared
because PHASE 3 has no dirty/write-back cache.

### Logical-to-physical conversion

```
cylinder = floor(logicalTrack / heads)
head = logicalTrack % heads
ratio = physicalSectorSize / 128
recordIndex = logicalSector - 1
physicalSector = floor(recordIndex / ratio) + 1
recordOffset = (recordIndex % ratio) * 128
```

READ always transfers the complete physical sector through controller DATA into
E800h–EBFFh, then copies exactly 128 bytes at recordOffset to DMA.

WRITE C=0 normal, C=1 directory and C=2 unallocated all use the same immediate
read-modify-write path. PHASE 3 intentionally does not implement CP/M's
unallocated-write optimization. The CBIOS pre-reads the physical sector,
replaces only the target 128-byte record from DMA, then writes the entire
physical sector. Pre-read failure means no write is issued. Adjacent logical
records are preserved byte-for-byte.

### HOME / SETTRK / SETSEC / SECTRAN

- HOME stores logical track 0.
- SETTRK stores the full 16-bit CP/M logical track.
- SETSEC stores the 1-based logical record sector.
- SECTRAN preserves current SHINO-80 semantics: with no table it returns BC+1;
  a table result is likewise converted into the 1-based logical-sector contract.
- physical C/H/S mapping occurs only inside READ/WRITE.

### WBOOT / boot role

WBOOT re-detects A:'s profile before system reload and always reloads system
content from A:. Page Zero current-drive state remains preserved, so WBOOT
initiated while B: is current returns to B:. When BDOS/CCP reselects B:,
SELDSK re-reads B:'s profile. A: remains the sole ROM autoboot source. B: is
never probed for boot.

## Pre-implementation fixture gate

Before Checkpoint B/C/D source implementation begins, tests/fixtures must encode:

1. DPB calculator reproducing the five-profile table exactly
2. S80B v3 64-byte header fixture including checksum 95h
3. memory-overlap fixture covering every fixed range in the high-RAM map

Checkpoint A, the three contract fixtures and Checkpoint B controller multi-profile I/O are implemented and regression-tested. C/D remain unstarted and sequenced behind a separate Human instruction and their focused regression gates.

## PHASE 3 / PHASE 4 boundary

PHASE 3 supports native raw SHINO media using real FDD geometries.
D88/DCP/FDI parsing, foreign CP/M filesystem compatibility, ambiguity/container
handling and foreign system-disk boot remain PHASE 4.
