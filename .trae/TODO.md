# TODO:

All items below have been resolved in the current codebase. This file is kept
as a historical log. New TODO items should be created as GitHub Issues.

## Resolved

- [x] fix_parse_coordinator_priority_mode: Fix ParseCoordinator priority mode test - 'All parsing strategies failed' error at line 261
  - Resolved: All 2965 tests now pass; parse-coordinator.test.ts passes 42/42.
- [x] debug_parse_engine_result_handling: Debug ParseEngine parseWithStrategy method - string strategy works but result not being handled correctly
  - Resolved: `parseWithStrategy` (src/core/parsing/parse-engine.ts:255-313) correctly
    uses `isParseSuccess(result)` to handle both success and error paths.
- [x] fix_parse_coordinator_metrics: Fix ParseCoordinator metrics test - expects 20 totalParses but receives 0 at line 578
  - Resolved: Concurrent parse test at parse-coordinator.test.ts:578 now passes
    (results.length === 20, all ZonedDateTime instances).
