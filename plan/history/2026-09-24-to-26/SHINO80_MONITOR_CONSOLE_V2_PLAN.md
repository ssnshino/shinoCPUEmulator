# BIOS console / Monitor v0.2

2026-09-26 JST. Based on Memory Inspector candidate f0903e0, PR #18.
Implement ROM GETLINE (HL writable buffer, B max 1..63 bytes, nul terminated;
A length, preserve BC/DE/HL), Backspace/delete editing, upward one-row scroll,
PRINT_HEX8/16, and line commands H/?/C/D xxxx. Enter submits all commands.
D requires exactly four hex digits and prints 8 rows of 8 bytes, wrapping
16-bit addresses. Dumps use CPU reads; browser does not parse commands.
Buffer E100–E13F reserved. Existing BIOS API addresses remain stable.
CPU core and CG-ROM untouched. No memory modification/GO this phase.

QA: GETLINE limits, empty BS, CR, invalid commands, lowercase hex, FFFF wrap,
register/stack preservation, screen scroll and ROM guards, existing regression,
desktop and compact real browser input including memory inspector isolation.
Rebuild standalone HTML; publish mobile QA copy. One logical commit after tests,
leave PR review/merge to Human.
