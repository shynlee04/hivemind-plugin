---
phase: P44-tool-intelligence-capability-layer
plan: 02
subsystem: capability-gate
tags: [tool-intelligence, capability-gate, native-task, seed-profiles, vitest]

requires:
  - phase: P44-01
    provides: CapabilityGate module and baseline TOOL_CAPABILITY_MAP
provides:
  - Native OpenCode task classified as ToolCategory.Delegate in TOOL_CAPABILITY_MAP
  - Programmatic Hivemind capability seed profiles independent of OpenCode permission metadata
  - Tests proving seed profile validity and zero orphaned capability-map tools
affects: [P44-03, P44-04, P44-05, P44-06, tool-intelligence-engine]

tech-stack:
  added: []
  patterns:
    - Static Hivemind seed profile map
    - Profile-based capability resolution
    - Capability-map coverage tests

key-files:
  created:
    - src/features/capability-gate/agent-capability-profiles.ts
  modified:
    - src/features/capability-gate/index.ts
    - src/features/capability-gate/types.ts
    - tests/features/capability-gate/capability-map.test.ts

key-decisions:
  - "Native OpenCode task is represented as a built-in Delegate capability but is not added to WRITE_CAPABLE_TOOLS."
  - "Hivemind seed profiles are programmatic bootstrap hints; they do not use OpenCode permission or deprecated tools frontmatter as authority."
  - "Unknown agents retain the read/glob/grep fallback until runtime intelligence grants more context."

patterns-established:
  - "CapabilityGate resolves baseline tools through Hivemind seed profiles instead of hardcoded role branches."
  - "Coverage tests expand seed profile categories against TOOL_CAPABILITY_MAP to catch orphaned tools."

requirements-completed: [REQ-P44-02, REQ-P44-03]

duration: 18min
completed: 2026-05-31T21:04:24Z
---

# Phase P44 Plan 02: Tool Intelligence Capability Seed Summary

**Native task delegation with programmatic Hivemind seed profiles and zero orphaned capability-map tools**

## Performance

- **Duration:** 18 min
- **Started:** 2026-05-31T20:46:00Z
- **Completed:** 2026-05-31T21:04:24Z
- **Tasks:** 3 completed
- **Files modified:** 4

## Accomplishments

- Added native OpenCode `task` to `TOOL_CAPABILITY_MAP` as a `ToolCategory.Delegate` built-in capability.
- Added `agent-capability-profiles.ts` with Hivemind-owned static seed profiles for orchestration, implementation, verification, research/docs/planning, HF meta-builder, and unknown fallback roles.
- Replaced `CapabilityGate.resolveToolsForAgent()` hardcoded role branching with profile-based resolution.
- Added tests for native `task`, profile tool validity, every capability-map tool being covered by at least one seed profile, and unknown-agent read-only fallback.

## Task Commits

1. **Tasks 1-3: Native task map, seed profiles, and zero-orphan tests** - `33b6123b` (`feat(P44-02): seed capability profiles for tool intelligence`)

## Files Created/Modified

- `src/features/capability-gate/agent-capability-profiles.ts` - Defines static Hivemind seed profiles and helper resolution functions.
- `src/features/capability-gate/index.ts` - Adds native `task`, exports profile helpers, and resolves tools through seed profiles.
- `src/features/capability-gate/types.ts` - Adds typed profile and matcher shapes.
- `tests/features/capability-gate/capability-map.test.ts` - Verifies native `task`, profile validity, coverage, and unknown fallback behavior.

## Decisions Made

- Native `task` remains outside `WRITE_CAPABLE_TOOLS`; P44-02 classifies it only, while recursive/JIT runtime enforcement remains downstream P44-04/P44-05 work.
- Seed profiles use role/name matchers and tool categories as bootstrap hints only. They do not read or encode OpenCode `permission: allow`, `permission: ask`, `permission: deny`, or deprecated agent `tools:` frontmatter.
- HF meta-builder matching is prioritized before generic L2 matching so `hf-l2-*` agents receive Config baseline tools.

## Deviations from Plan

None - plan executed within the requested P44-02 surfaces. No `.opencode/agents/**`, `.hivefiver-meta-builder/**`, spawner, or P44-03 files were modified.

## Verification

| Command | Result | Evidence |
|---------|--------|----------|
| `npx vitest run tests/features/capability-gate/capability-map.test.ts --reporter=verbose` | PASS | 1 test file passed, 11 tests passed |
| `npm run typecheck` | PASS | `tsc --noEmit` exited successfully |

## Known Stubs

None found in the created/modified capability-gate files.

## Threat Flags

None. P44-02 adds static in-memory capability metadata and tests only; it does not add network endpoints, file access surfaces, auth paths, schema changes, or runtime enforcement side effects.

## Issues Encountered

- TDD RED passed as expected: the updated test initially failed because `agent-capability-profiles.ts` did not exist yet.
- During implementation, `hf-l2-command-builder` initially matched the generic L2 profile before the HF meta-builder profile. Profile ordering was corrected so HF roles get Config capability seeds.
- Pre-existing unrelated working-tree changes remained present outside the P44-02 scope and were not staged or modified by this plan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- P44-03/P44-04 can consume `AGENT_CAPABILITY_PROFILES`, `resolveSeedProfileForAgent()`, and `resolveToolsForSeedProfile()` as the static bootstrap layer.
- Runtime correctness is still intentionally deferred to the P44-04/P44-05 ToolIntelligenceEngine and hook enforcement work.

## Self-Check: PASSED

- Found `src/features/capability-gate/agent-capability-profiles.ts`.
- Found `src/features/capability-gate/index.ts` with native `task` in `TOOL_CAPABILITY_MAP`.
- Found `tests/features/capability-gate/capability-map.test.ts` coverage for native `task` and seed profile coverage.
- Found implementation commit `33b6123b`.

---
*Phase: P44-tool-intelligence-capability-layer*
*Completed: 2026-05-31T21:04:24Z*
