# SHINO-80 Demo Software Disk v0.1

Updated: 2026-09-30T01:39:56+09:00

## 1. Purpose

SHINO-80が「CP/Mを表示できるmachine」から「diskから独立したCOM applicationを
loadして実行できるmachine」へ到達したことを、配布可能かつ再現可能な形で残す。

成果物は次の3点を一体として扱う。

1. original COM programs
2. ready-to-import CLASSIC `.s80d` image
3. imageをbyte-exactに再生成し、実CPU pathで検証するbuilder/test

## 2. Development history

2026-09-30、mobileの公開preview上で実行できるsoftware diskとして、次を試作した。

- 複数のglyphが画面端で反射する`BALLS.COM`
- memory dump/edit/fill/move/search/goを備える`MONX.COM`
- one-bit beeperを鳴らす`BEEP.COM`
- disk案内の`ABOUT.COM`

最初の試作imageは2HD-1440 profileで生成した。image自体は正しく、S80B v3
2HD-JP systemをA:にmountしたautomated testでは全fileとCOM実行がPASSした。

一方、公開previewのdefault A:は互換性維持のためS80B v2 / CLASSIC CBIOSである。
この状態ではhost UIが2HD-1440 B:をmountできても、guest CBIOS/BDOSはCLASSIC
DPBでdirectoryを解釈する。そのため、次の順で現象を切り分けた。

1. B:がEJECTEDのままアクセスされ、`Bdos Err On B: Bad Sector`
2. INSERT後はcontroller errorが消えたが、`DIR`は`NO FILE`
3. host media mountとguest filesystem interpretationを分離して確認
4. default S80B v2に合わせて同一filesをCLASSIC 256,256-byte imageへ再pack
5. physical iPhone / Edgeの公開previewでDIR、BALLS、C終了、MONX、READMEをHuman確認

この経緯から、v0.1の正式配布物はdefault machineで追加system diskを要求しない
CLASSIC data diskとした。2HD版はS80B v3起動環境用の検証物であり、repositoryの
v0.1配布物には含めない。

## 3. Disk contract

|Item|Value|
|---|---|
|Profile|CLASSIC / ID 00h|
|Geometry|77 tracks × 1 head × 26 sectors|
|Sector size|128 bytes|
|Image size|256,256 bytes|
|Role|B: USER / WORK / INTERCHANGE|
|Boot|nonbootable data disk|
|Filesystem|SHINO-80 CP/M 2.2 CLASSIC DPB|
|Write protect|OFF|

The image is intentionally a B: data disk. It does not duplicate S80B, CCP, BDOS or CBIOS.
A: remains the only autoboot source.

## 4. Program behavior

### BALLS.COM

- COM origin: `0100h`
- display: direct write to 80×25 VRAM `C000h–C7CFh`
- input: keyboard DATA `20h`, STATUS `21h`
- six independent `(x,y,dx,dy)` states
- horizontal bounds: columns 0–79
- vertical bounds: rows 2–24; rows 0–1 are reserved for the heading
- exit: `C` / `c`, clear VRAM, restore active CBIOS cursor, re-enter CCP on current drive

The animation is guest code. JavaScript does not move the glyphs.

### MONX.COM

MONX uses CP/M BDOS entry `0005h` for console I/O. Its parser accepts fixed-width
hex operands and implements:

- `D` — 128-byte dump
- `E` — single-byte edit
- `F` — inclusive range fill
- `M` — forward range move
- `S` — byte search with matching addresses
- `G` — transfer control to an address
- `C`, `H`, `Q` — clear, help, quit

`G` deliberately performs no sandboxing. This matches a machine monitor's role and is clearly
marked as dangerous in both host documentation and the disk's `README.TXT`.

### BEEP.COM / ABOUT.COM

`BEEP.COM` writes to the SHINO-80 one-bit beeper port `40h` three times with guest-side delay.
`ABOUT.COM` uses BDOS function 09h to identify the disk and its main commands.

## 5. Reproducible image construction

`software/demo-disk/build-demo-disk.cjs` is the source of truth.

Build stages:

1. resolve labels and absolute/relative fixups for each COM program
2. produce raw `.COM` byte arrays at origin `0100h`
3. create a blank CLASSIC medium through `createBlankBlockImage()`
4. pack COM/text files through `buildFilesystem()`
5. write exactly 256,256 bytes

No external assembler, host font, third-party executable, ROM dump or downloaded CP/M program
is required.

```bash
pnpm run build:demo-disk
pnpm run test:demo-disk
```

The test rebuilds to a temporary path and compares every byte with the committed image before
booting the actual SHINO-80 ROM/CPU/Bus/CBIOS/BDOS/CCP stack.

## 6. Verification record

Automated on 2026-09-30:

- deterministic builder output: PASS
- directory/readback: 7 files PASS
- B: login / DIR / TYPE / ABOUT: PASS
- BALLS frame movement: PASS
- BALLS `C` stop and B: return: PASS
- MONX D/E/F/M/S/G/Q: PASS
- BEEP port 40h, 3 triggers: PASS

Human physical-device QA on iPhone / Edge:

- CLASSIC image import and insertion: PASS
- B: DIR lists all files: PASS
- BALLS display and movement: PASS
- C stop and B: prompt return: PASS
- MONX help display: PASS
- README.TXT display/scroll: PASS

Committed artifact:

```text
software/demo-disk/SHINO80_DEMOS_CLASSIC_256K.s80d
bytes   256256
sha256  f1612300700d4a959b18a7bbe3dcd52d157ef8901b53010a712d873202ab56f1
```

## 7. Non-goals

- changing CPU, Bus, BIOS, CBIOS, BDOS or CCP behavior
- changing the default A:/B: media
- shipping the experimental 2HD-1440 data image in v0.1
- adding foreign CP/M software or proprietary ROMs
- making MONX safe against destructive operator commands
- publishing the disk automatically to the Shinomiya Daihanten site

## Update History

- 2026-09-30T01:39:56+09:00 — Codex — Initial v0.1: development history, disk/program contract, reproducible build and QA evidence.
