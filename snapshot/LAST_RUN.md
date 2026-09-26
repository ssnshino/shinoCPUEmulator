# LAST RUN

LATEST 2026-09-26: Technical Manual v0.1 candidate on fa73816 / PR #26.
Branch feature/shino80-technical-manual-20260926. All package stages PASS;
1,780 encoding/flags/timing/example invariants and deterministic build PASS.
Offline installed Chrome desktop1440×1000/mobile390×844 interactions PASS,
no runtime/console warnings or errors, network requests or document overflow.
See working-logs/head/SHINO80_TECHNICAL_MANUAL_WORKLOG.md.
CPU/firmware/workbench and old deploy artifact unchanged. ImageGen401 fallback
documented; no public hosting/merge. Human iPhone QA and stack review remain.
Previous runs below are historical.

CURRENT 2026-09-26: PHASE1J instruction-level CPU completion candidate,
feature/shino80-z80-accuracy-closeout-20260926 on d8d30bc / PR #25.
Full F/WZ/P/Q oracle1,604,000 PASS; interrupt748 +XY589,824 checks PASS.
All package checks, deterministic build and desktop/mobile Chrome smoke PASS.
See working-logs/head/SHINO_Z80_PHASE1J_ACCURACY_WORKLOG.md for evidence,
limits and rollback. Human iPhone QA / stack review remain; no merge.
Prior entries below are historical.

CURRENT: PHASE1I indexed CB, feature/shino80-z80-indexed-cb-20260926.
Parent e01d5ed / PR #24; all7 external families1,604,000 PASS, failure0.
See SHINO_Z80_PHASE1I_INDEXED_CB_WORKLOG.md. Next interrupts/precision; no merge.

LATEST: PHASE1H DD/FD candidate 2026-09-26, feature/shino80-z80-index-20260926.
Parent bb0daeb / PR #23. External baseline 1,092,000 PASS, zero failures.
See SHINO_Z80_PHASE1H_INDEX_WORKLOG.md. Next indexed CB. No merge.

CURRENT: PHASE 1G ED candidate 2026-09-26, feature/shino80-z80-ed-20260926.
Parent 42d04f7 / PR #22. External ED/BASE/CB: 588,000 PASS, no failures.
See working-logs/head/SHINO_Z80_PHASE1G_ED_WORKLOG.md. Next DD/FD; no merges.
The entries below describe earlier work.

Latest: PHASE 1F CB candidate 2026-09-26, feature/shino80-z80-cb-20260926.
See working-logs/head/SHINO_Z80_PHASE1F_CB_WORKLOG.md. External CB and BASE
recheck PASS; MON expansion paused; next ED. No main merge performed.

Newest: 2026-09-26 trace/observer optimization. See
working-logs/head/SHINO80_TRACE_OBSERVER_PERF_WORKLOG.md. Current branch
perf/shino80-trace-observer-20260926 on 3f4f90d / PR #20. iPhone QA pending.

Latest override: 2026-09-26 REALTIME pacing candidate. Read
working-logs/head/SHINO80_REALTIME_PACE_WORKLOG.md. Branch
feature/shino80-realtime-pace-20260926, stacked on 6707ace / PR #19.
MON Human PASS; speed update requires mobile review. No merges performed.

Latest: 2026-09-26 BIOS console / Monitor v0.2 candidate. See
`working-logs/head/SHINO80_MONITOR_CONSOLE_V2_WORKLOG.md` and the active
candidate override in CURRENT_SNAPSHOT.md. PR #18 stays unmerged; this branch
is stacked on its reviewed-by-Human mobile result. Earlier closeout follows.
## CG-ROM / DM-80 + MINIMUM BIOS INTEGRATION CLOSEOUT

Updated: 2026-09-25T23:58:41+09:00

Completed sequentially:

1. verified frozen CG-ROM / DM-80 head
   `e04a951183fa6eb429cf61bcfd3d9655bea883b2`
2. merged CG-ROM / DM-80 through PR #14
3. updated the BIOS branch from reviewed `main`
4. regenerated the one-page artifact once with final display and BIOS source
5. ran all CPU, machine, BIOS, build, artifact, and Chrome regressions
6. merged Minimum BIOS / Monitor foundation through PR #15

Final runtime integration baseline before documentation closeout:

`b5b0aa8f73a772e27f86960bb24fb058057bb77d`

Key results:

```text
BASE oracle                252,000 / 252,000 PASS
Native CG-ROM              4096 bytes / integrity PASS
DM-80 adaptive rendering   PASS
BIOS PUTCHAR               PASS
BIOS NEWLINE               PASS
BIOS CLS                   PASS
BIOS PRINT_STRING          PASS
IPL -> Monitor 0220h       PASS
Chrome integration smoke   PASS
```

No next implementation phase was started.

The next session must choose one active environment and one branch. Do not run
parallel writers against this repository.
