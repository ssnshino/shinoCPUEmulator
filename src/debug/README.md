# src/debug

Future machine-observer implementation lives here.

Candidate responsibilities:

- disassembler
- trace processing
- breakpoints/watchpoints
- memory inspector helpers
- CPU inspector adapters

Debugger code observes the machine. It must not become the machine's execution path.
