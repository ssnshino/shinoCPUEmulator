# SHINO Z80 CORE v0.0.1 — FIRST HEARTBEAT SPEC

Created: 2026-09-24T13:42:12+09:00
Status: CANDIDATE SPEC

## Identity

Artifact: `one_page_shino_z80_core_v0.0.1.html`

Purpose: first visible Z80 CPU test bench for SHINO-80.

## Implemented CPU behavior

- complete register container for future expansion
- RESET documented subset
- `00h NOP`
- PC increment on opcode fetch
- R lower-seven increment with bit7 preservation
- 4 T-state NOP accounting
- instruction counter

## Register state exposed

- A F B C D E H L
- A' F' B' C' D' E' H' L'
- IX IY SP PC
- I R
- IFF1 IFF2 IM
- HALT / INT / NMI / WAIT state placeholders

## Bus model

Bench memory: 64 KiB `Uint8Array`.

CPU APIs emit trace.
Debugger `debugPeek/debugPoke` do not emit CPU traffic.

Current trace events:

- `OPCODE_FETCH`
- `MEMORY_REFRESH`

Trace precision: `M_CYCLE_ABSTRACT`.

## UI

The first panel intentionally resembles a front-panel computer rather than a finished PC.

- 16-bit Address LEDs
- 8-bit Data LEDs
- signal lamps
- register bit LEDs + exact hex values
- F bit LEDs including dim Y/X undocumented positions
- current instruction display
- bus trace
- memory hex monitor
- self-test badge

Controls:

- RESET
- STEP
- RUN VISUAL
- PAUSE
- BURST x256
- CLEAR TRACE

`RUN VISUAL` is intentionally slow and is NOT claimed to be realtime 4 MHz execution.

## Build

Source is split for testability.

`scripts/build-one-page.cjs` embeds CSS + bus + CPU + app into the single standalone HTML.

No runtime network/file dependency is required by the generated HTML.

Repository convenience commands:

```bash
npm test
npm run build
```

## Known limitations

- NOP only
- no exact T-state pin waveform
- refresh A7 not modeled
- no WAIT
- no HALT execution
- no INT/NMI behavior
- no SHINO-80 peripherals
- no ROM protection/memory map yet
