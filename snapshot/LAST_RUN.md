# LAST RUN
## SHINO-80 PHASE 2A

Implemented and semantically verified:

- ROM write protection
- 8 KiB SYSTEM ROM
- original SHINO-80 4 KiB CG-ROM
- 80x25 text VRAM
- 8x16 text video device
- real CRT canvas
- IPL writes boot text using Z80 instructions
- monitor placeholder loop

Verified before UI:

```text
C000  SHINO-80 IPL
C050  VIDEO OK
C0A0  MON
C0F0  *
PC    007Bh
SP    F000h
```

CPU write to 0000h produced ROM_WRITE_BLOCKED.

Artifact source assembly:
- 8 inline scripts
- complete </html>
- no external runtime dependency
- no prompt()
