# SHINO-80 Demo Software Disk Worklog

Updated: 2026-09-30T01:39:56+09:00

## Result

Built an original SHINO-80 CP/M data disk containing BALLS.COM, MONX.COM,
BEEP.COM, ABOUT.COM, README.TXT, BALLS.ASM and MONX.ASM.

## Compatibility investigation

The first 2HD-1440 prototype passed automated execution with an S80B v3 A: system.
On the public preview's default S80B v2 / CLASSIC A:, the image mounted at the host level but
the guest returned `NO FILE`. Repacking the same files as CLASSIC aligned the host medium and
guest DPB. Physical iPhone / Edge QA then passed.

## Automated evidence

- deterministic `.s80d` rebuild: PASS
- committed image byte comparison: PASS
- directory/readback: 7 files PASS
- B: / DIR / TYPE / ABOUT: PASS
- BALLS movement: PASS
- BALLS `C` stop → B: prompt: PASS
- MONX D/E/F/M/S/G/Q: PASS
- BEEP port 40h ×3: PASS
- `pnpm test`: PASS
- `pnpm run build:manual`: PASS
- `git diff --check`: PASS

## Human evidence

- CLASSIC image import/insert: PASS
- all files visible from B: DIR: PASS
- BALLS moving display: PASS
- C stop: PASS
- MONX help: PASS
- README display/scroll: PASS

## Artifact

```text
software/demo-disk/SHINO80_DEMOS_CLASSIC_256K.s80d
bytes   256256
sha256  f1612300700d4a959b18a7bbe3dcd52d157ef8901b53010a712d873202ab56f1
```

## Boundary

No CPU, Bus, BIOS, CBIOS, BDOS, CCP, UI, generated one-page HTML or default media code changed.
No deployment or publication was performed.
