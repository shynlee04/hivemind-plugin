---
phase: BOOT-09-mvp-config-schema-entry-init
plan: 03
subsystem: hooks
tags: tool-guard, document-language, config-enforcement, tdd

# Dependency graph
requires:
  - phase: BOOT-09-01
    provides: HivemindConfigsSchema with documents_and_artifacts_language and document_paths
  - phase: BOOT-09-02
    provides: HivemindConfigs type import path
provides:
  - Document language tool guard in tool.execute.before (Layer 2 enforcement)
  - hivemindConfig in ToolGuardDependencies
  - Language reminder injection for Write/Edit/apply_patch at document_paths
affects:
  - BOOT-09-04: Future language enforcement extensions
  - plugin.ts: ToolGuardDependencies composition with hivemindConfig

# Tech tracking
tech-stack:
  added: []
  patterns: Pre-execution instruction reminder (not content validation)

key-files:
  created: []
  modified:
    - src/hooks/guards/tool-guard-hooks.ts
    - tests/hooks/create-tool-guard-hooks.test.ts

key-decisions:
  - "Tool guard is pre-execution instruction reminder, NOT content validation (D-12)"
  - "Path matching uses .includes() prefix matching on absolute paths"
  - "apply_patch gets generic _languageReminder without path-specific targeting (MVP scope)"
  - "Tool guard fires for ALL sessions including child (Layer 2 is a reminder, not main-session-only)"
  - "Non-.md files under document_paths get NO reminder"

patterns-established:
  - Pattern 1: Tool guard logic follows circuit breaker in tool.execute.before handler
  - Pattern 2: New dependency fields follow existing injection pattern via ToolGuardDependencies

requirements-completed: [REQ-03]

# Metrics
duration: 5min
completed: 2026-05-12
---

# Phase BOOT-09 Plan 03: Document Language Tool Guard Summary

**TDD: Language reminder injection in tool.execute.before for Write/Edit/apply_patch at configured document_paths**

## Performance

- **Duration:** 5 min
- **Started:** 2026-05-12T05:04:00Z
- **Completed:** 2026-05-12T05:09:00Z
- **Tasks:** 1 (RED + GREEN)
- **Files modified:** 2

## Accomplishments

- Added `hivemindConfig?: HivemindConfigs` to `ToolGuardDependencies` interface
- Implemented document language tool guard in `tool.execute.before` handler:
  - Write tool at `.md` files under `document_paths` gets language reminder prepended to `content`
  - Edit tool at `.md` files under `document_paths` gets language reminder prepended to `newString`
  - Write/Edit at `.md` files outside `document_paths` gets NO reminder
  - Non-`.md` files under `document_paths` get NO reminder
  - `apply_patch` gets generic `_languageReminder` without path-specific targeting (MVP scope)
  - Defensive: no-op when `hivemindConfig` is undefined
  - Existing circuit-breaker behavior unaffected
- Written 12 new tests following TDD (RED → GREEN), all passing

## Task Commits

Each task was committed atomically:

1. **Task 1 (RED): Test file** - `fb5d9fe0` (test)
2. **Task 1 (GREEN): Implementation** - `45f34285` (feat)

## Files Created/Modified
- `src/hooks/guards/tool-guard-hooks.ts` - Added `hivemindConfig` to `ToolGuardDependencies`, added document language tool guard logic in `tool.execute.before`
- `tests/hooks/create-tool-guard-hooks.test.ts` - Added 12 new test cases covering all document language scenarios

## Decisions Made
- Followed D-12: tool guard is pre-execution instruction reminder, not post-hoc content validation
- `.includes()` prefix matching on absolute paths (config paths are relative, matched via substring containment)
- `apply_patch` gets generic `_languageReminder` only — no file path detection (MVP scope per RESEARCH.md Pitfall 3)
- Tool guard fires for ALL sessions including child sessions (Layer 2 is a pre-execution reminder, not main-session-only)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- `HivemindConfigsSchema` defaults mean `documents_and_artifacts_language` always has a value (defaults to `"en"`). The defensive test for "undefined language" uses `hivemindConfig: undefined` instead of partial config.

## Next Phase Readiness
- Document language tool guard is complete for MVP
- Ready for BOOT-09-04 or next BOOT-09 plan in wave 2
- All existing tests pass (2 pre-existing unrelated failures in steering-engine and plugin-lifecycle)

---

*Phase: BOOT-09-mvp-config-schema-entry-init*
*Completed: 2026-05-12*
