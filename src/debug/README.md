# SHINO-80 observer and debugger code

Implemented observer surfaces include disassembly support, bounded Bus trace,
CPU/Memory/Bus/Device inspectors and related adapters.

The debugger is an observer:

- it must not become the CPU execution path;
- peek/poke must remain distinct from CPU read/write/execute;
- hidden UI must not reset machine or device state;
- high-frequency machine events must not become one DOM update per event.

Future breakpoints/watchpoints belong here only when their execution boundary
and non-observing side effects are explicitly designed and tested.
