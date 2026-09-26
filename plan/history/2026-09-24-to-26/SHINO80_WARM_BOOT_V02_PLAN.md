# SHINO-80 Warm Boot v0.2 PLAN

Date: 2026-09-26

Branch: `feature/shino80-warm-boot-v02-20260926`

Parent: System Disk / Loader v0.1 `4d5e81a` / PR #33

## Purpose

Turn the installed page-zero vector into a real disk-backed restart path:

```text
program -> JP 0000h -> CBIOS WBOOT at FA03h
        -> A: track 0 sector 2 -> reload 8000h
        -> original system payload -> CBIOS console -> HALT
```

This closes the warm-boot mechanism using only original SHINO-80 content before
any CP/M-family binary is imported.

## Contract

CBIOS WBOOT will:

1. initialize private CBIOS state;
2. select A:, track 0, sector 2 and DMA 8000h;
3. call the existing public READ path;
4. jump to 8000h on success;
5. print `WBOOT DISK ERROR` through CBIOS CONOUT and HALT on failure.

The page-zero vector remains `JP FA03h`. BOOT remains initialize-and-return so
the cold-loaded original payload can explicitly initialize CBIOS.

## Verification

- cold boot through MON O and confirm the v0.1 baseline
- overwrite the loaded 8000h payload and clear its signature
- enter through CPU-visible address 0000h
- prove one READ command and exactly 128 DATA reads restore sector 2
- prove the restored payload executes and recreates `DSK!` and the banner
- prove no ROM fetch occurs during warm boot
- eject A:, enter 0000h and prove visible error plus stable HALT
- prove RESET still returns to ROM MON
- update exact image/header/CBIOS length tests and offline documentation
- run all package and desktop/mobile Chrome regression

## Non-goals

- No CCP, BDOS, filesystem, directory, CP/M image or BASIC.
- No 0005h BDOS vector or transient-program return convention yet.
- No retry UI, alternate drive, host persistence, FDC mechanics or DMA.
- No CPU, mapper, block protocol, CG-ROM or DM-80 semantic changes.
- No merge or deployment.
