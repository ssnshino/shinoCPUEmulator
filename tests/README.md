# tests

CPU Core / Machine / Device testの予定地。

## Priority

CPU implementation開始後はUIより先にunit testを作る。

候補:

- register/state transition
- instruction execution
- flags
- PC/SP
- prefix decode
- interrupt
- HALT/EI edge cases
- R/refresh
- T-state accounting
- bus trace
- memory/I/O boundary
- ROM/RAM protection
- device register behavior

External test vectorを取り込む場合はlicense/provenanceを記録する。
