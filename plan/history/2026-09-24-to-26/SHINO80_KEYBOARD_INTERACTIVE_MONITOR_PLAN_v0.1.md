# SHINO-80 KEYBOARD + INTERACTIVE MONITOR FOUNDATION PLAN v0.1

Created: 2026-09-26T00:33:38+09:00
Status: IMPLEMENTED / HUMAN MOBILE QA PASS

## Goal

Turn the existing non-interactive `MON` prompt into the first end-to-end
interactive SHINO-80 console.

The completed path must be:

```text
Browser keyboard / mobile soft keyboard
  -> SHINO-80 Keyboard Controller
  -> Z80 I/O Bus
  -> BIOS GETCHAR
  -> ROM Monitor command loop
  -> BIOS PUTCHAR
  -> TEXT VRAM
  -> DM-80
```

No JavaScript command handler may print Monitor output directly.

## Baseline

- reviewed `main`: `d86b5d07cf6222c7618a46323ddbe520a1a39e39`
- distribution artifact:
  `deploy/one_page_shino80_v0.0.9_z80_base_complete.html`
- BIOS `RST 10h`: reserved for GETCHAR
- Monitor wait loop: `0220h`
- I/O range `20h-2Fh`: reserved for Keyboard
- Z80 BASE `IN A,(n)` implementation: available

## Keyboard controller v0.1

Implement a dedicated device in `src/devices/shino80/` with a bounded byte
FIFO. Browser code may enqueue host input, but only Z80 I/O reads may consume
it.

Low-byte-decoded ports:

| Port | Name | Read behavior |
|---:|---|---|
| `20h` | `KEY_DATA` | pop the oldest byte; return `00h` when empty |
| `21h` | `KEY_STATUS` | bit 0 = RX READY; bit 7 = FIFO OVERRUN |

The device decodes the low eight address bits because Z80 immediate I/O places
register A on the high address byte. The Bus trace continues to record the full
16-bit address driven by the CPU.

FIFO rules:

- capacity: 64 bytes
- deterministic first-in, first-out ordering
- reject a new byte when full and latch OVERRUN
- reset / power transitions clear FIFO and OVERRUN
- debugger peek never consumes a byte

## Bus device boundary

Extend the Bus with an explicit I/O-device attachment boundary.

- CPU `IN` / `OUT` may reach an attached device.
- Unclaimed ports retain the existing latch-backed behavior used by CPU tests.
- Debugger reads use an optional non-consuming device peek.
- Every CPU device access remains visible as an `IO` Bus trace event.
- CPU core does not import or know the Keyboard device.

## BIOS GETCHAR v0.1

- `RST 10h` jumps to executable GETCHAR.
- Add an ordinary CALL entry after the existing BIOS v0.1 jump-table entries.
- Poll `KEY_STATUS` until RX READY.
- Read and return one byte from `KEY_DATA` in A.
- Preserve BC, DE, HL, IX, IY and caller-visible SP.
- F is unspecified because polling changes flags.
- Waiting is deterministic Z80 instruction execution, not a JavaScript pause.

## Interactive Monitor v0.1

Use an immediate one-byte command loop. This is a foundation, not the final
Monitor language.

| Input | Behavior |
|---|---|
| `H` or `?` | print command help and a new `*` prompt |
| `C` | clear the screen and print `MON` plus a new `*` prompt |
| `CR` | print a newline and a new `*` prompt |
| lower-case `h` / `c` | normalize to upper-case and execute |
| any other printable byte | print `?` and a new `*` prompt |

Input is echoed by ROM through BIOS PUTCHAR. JavaScript only translates host
input to bytes and enqueues those bytes.

## Browser and mobile input

- Desktop hardware-keyboard input supports printable ASCII, Enter and
  Backspace.
- Browser shortcuts using Command / Control / Alt are not captured.
- The DM-80 display can be tapped to request keyboard focus.
- The More sheet exposes a 44 CSS px-class `KEYBOARD` action.
- A dedicated input capture element summons the mobile soft keyboard and
  converts text input to controller bytes.
- While that input has focus on a compact viewport, Keyboard Mode hides shell
  controls and centers the complete DM-80 inside the live Visual Viewport.
- Leaving input focus restores the normal toolbar and bottom navigation.
- Input is accepted only while machine power is on.
- Power off and RESET clear pending host input.

## Change scope

- `src/devices/shino80/shino80-keyboard.js`
- `src/machine/shino80/shino80-bus.js`
- `src/firmware/shino80/shino80-system-rom.js`
- `src/app/shino80-workbench-v0.0.2.template.html`
- `src/app/shino80-workbench-v0.0.2.js`
- `src/ui/shino80-workbench-v0.0.2.css`
- `scripts/build-one-page.cjs`
- focused Keyboard / BIOS / Monitor / browser regression tests
- SPEC, WORKLOG and restart documentation after implementation passes
- generated `deploy/*.html` only through `npm run build`

## Non-goals

- keyboard matrix electrical simulation
- interrupt-driven keyboard input
- locale IME composition or non-ASCII character encoding
- line editing, command history or key-repeat policy
- memory dump/edit, register edit, GO, breakpoint or load/save commands
- final Monitor command grammar
- changes to CPU core, decoder or flags
- CB/DD/ED/FD prefix implementation
- CG-ROM glyph or DM-80 rendering changes

## Accuracy level

- functional byte-oriented keyboard controller
- real Z80 I/O instructions and Bus trace
- polling BIOS ABI
- ROM-resident command dispatch
- deterministic unit and integration tests
- no claim of physical keyboard scan timing or interrupt accuracy

## Regression risks

- attached device routing could change unclaimed I/O behavior used by CPU tests
- GETCHAR polling could make run pacing or browser rendering unresponsive
- host and mobile event paths could enqueue the same key twice
- hidden input focus could interfere with machine shortcuts or More-sheet focus
- ROM growth could overlap IPL data or invalidate fixed test counts
- keyboard capture must not alter CPU state directly

## QA

1. unit-test FIFO order, empty reads, full/overrun and reset
2. verify debugger peek does not consume input
3. verify full-address Bus trace with low-byte device decode
4. rerun all BASE CPU and existing I/O regressions
5. execute GETCHAR from RAM and verify ABI/register preservation
6. verify GETCHAR remains in its polling loop when no input exists
7. boot to Monitor, enqueue each command and verify TEXT VRAM output
8. verify RESET and power transitions clear pending input
9. run source syntax, full `npm test`, build and artifact tests
10. run real Chromium desktop and 390x844 mobile smoke
11. confirm no horizontal overflow and no browser console errors
12. verify generated artifact reproducibility and `git diff --check`

## Success conditions

- Human can type into MON on desktop and iPhone-class touch layout
- every accepted byte is consumed by Z80 `IN`, not by JavaScript firmware logic
- `H` / `?`, `C`, CR and unknown-command behavior work through ROM
- Monitor output is observable as CPU Bus writes to TEXT VRAM
- existing CPU, CG-ROM, DM-80, BIOS and one-page tests remain green
- CPU core, decoder and flags remain unchanged

## Commit point

Commit one logical implementation only after source, tests, generated artifact,
SPEC, WORKLOG and snapshots agree and the complete regression suite passes.
Push / PR / merge remain separate Human-authorized steps.
