# SHINO-80 KEYBOARD + INTERACTIVE MONITOR FOUNDATION SPEC v0.1

Status: IMPLEMENTATION CANDIDATE / HUMAN MOBILE QA PASS
Date: 2026-09-26

## Scope

This specification defines the first byte-oriented SHINO-80 Keyboard
Controller, executable BIOS GETCHAR service, and ROM-resident interactive
Monitor command loop.

## Keyboard Controller

The controller owns a 64-byte FIFO. Host input is enqueued by the application;
only CPU I/O reads consume bytes.

| Low port | Register | Read |
|---:|---|---|
| `20h` | KEY_DATA | consume the oldest byte, or `00h` if empty |
| `21h` | KEY_STATUS | bit 0 RX READY, bit 7 OVERRUN |

The controller uses low-eight-bit decode. An access to `AB20h`, for example,
reaches KEY_DATA while the Bus trace records address `AB20h` exactly.

The FIFO rejects new input when full and latches OVERRUN. Reset and power
transitions clear both FIFO and OVERRUN. Debugger peek returns the next byte
without consuming it.

## Bus integration

`Shino80Bus` accepts attached I/O devices through a narrow device boundary:

- `handlesPort(port)` selects the device
- `readPort(port)` and `writePort(port,value)` serve CPU access
- `debugPeekPort(port)` optionally observes without device side effects
- `reset()` participates in explicit device reset

Unclaimed ports preserve the existing latch-backed 64 Ki-entry I/O behavior.
CPU device accesses remain ordinary `IO READ` / `IO WRITE` trace events and
include the selected device identity in event metadata.

## BIOS GETCHAR

Public entries:

- `RST 10h`
- `CALL 010Ch`

GETCHAR polls KEY_STATUS through Z80 `IN A,(21h)` until RX READY, then reads
KEY_DATA through `IN A,(20h)` and returns the byte in A.

Preserved:

- BC, DE, HL, IX, IY
- caller-visible SP

F is unspecified. Waiting is real ROM execution and appears in Bus trace; no
JavaScript promise, callback, or direct CPU-state mutation implements GETCHAR.

## Monitor command loop

The Monitor begins at `0220h` and accepts immediate one-byte commands.

| Byte | Result |
|---|---|
| `H`, `h`, `?` | echo and print `H HELP  C CLEAR`, then prompt |
| `C`, `c` | echo, clear TEXT VRAM, print `MON`, then prompt |
| CR (`0Dh`) | newline and prompt |
| other printable byte | echo, print `?`, then prompt |

Every echo and response passes through BIOS PUTCHAR / PRINT_STRING and CPU Bus
writes to TEXT VRAM. Browser JavaScript does not implement command semantics or
write Monitor output.

## Host input

Desktop input accepts printable ASCII, Enter and Backspace while power is on.
Command / Control / Alt browser shortcuts and repeated keydown events are not
captured.

For touch devices, the More sheet provides `KEYBOARD / TYPE INTO MON`; tapping
the DM-80 also requests the dedicated input capture element. This element is a
transport into the Keyboard FIFO, not an alternate terminal implementation.

On compact viewports, input focus activates Keyboard Mode. The toolbar and
bottom navigation temporarily leave the layout, the application tracks the
live Visual Viewport height, and the complete DM-80 is centered in the space
above the soft keyboard. Blurring the input restores the ordinary shell.

## Current limitations

- immediate commands only; no line editor or arguments
- Backspace can be transported but is not interpreted by Monitor v0.1
- no keyboard matrix, scan timing, interrupt or key-repeat model
- printable ASCII only; no IME composition contract
- no dump/edit/register/GO/load/save Monitor commands yet
- exact Visual Viewport behavior may vary across mobile browser versions

## Integration evidence

- controller and Bus unit coverage: PASS
- GETCHAR wait/return/register tests: PASS
- ROM H/C/unknown/CR command tests: PASS
- full BASE and machine regressions: PASS
- generated artifact static QA: PASS
- real Chrome 1440x900 and 390x844: PASS
- compact Keyboard Mode at simulated 390x560 Visual Viewport: PASS
- complete DM-80 within Keyboard Mode viewport: PASS
- shell control restore on input blur: PASS
- real iPhone / Microsoft Edge Keyboard Mode: Human PASS
- console errors/warnings: 0 / 0
- horizontal overflow: none at both tested viewports
