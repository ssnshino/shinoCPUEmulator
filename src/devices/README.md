# src/devices

SHINO-80 peripheral implementations live here.

Current devices:

- `shino80/shino80-keyboard.js` — low-byte-decoded `20h` DATA / `21h`
  STATUS ports with a 64-byte host-input FIFO
- `shino80/shino80-block-device.js` — one 77 × 26 × 128-byte A: medium,
  transferred through low-byte-decoded PIO ports `30h`–`36h`

Planned domains include:

- video
- physical/mechanical floppy controller
- uart
- printer
- timer
- sound

Create a device directory when that device enters an approved implementation PLAN.
