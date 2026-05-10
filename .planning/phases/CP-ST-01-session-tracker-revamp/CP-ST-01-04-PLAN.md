---
phase: CP-ST-01-session-tracker-revamp
plan: 04
type: execute
wave: 4
depends_on:
  - CP-ST-01-01
  - CP-ST-01-02
  - CP-ST-01-03
files_modified:
  - src/features/session-tracker/capture/event-capture.ts
  - src/features/session-tracker/capture/message-capture.ts
  - src/features/session-tracker/capture/tool-capture.ts
  - src/features/session-tracker/persistence/atomic-write.ts
  - tests/features/session-tracker/integration/concurrency.test.ts
  - tests/features/session-tracker/integration/recovery-integration.test.ts
  - tests/features/session-tracker/integration/e2e-verification.test.ts
autonomous: false
requirements:
  - REQ-ST-01
  - REQ-ST-02
  - REQ-ST-03
  - REQ-ST-04
  - REQ-ST-05
  - REQ-ST-06
  - REQ-ST-07
  - REQ-ST-08
  - REQ-ST-09
  - REQ-ST-10
  - REQ-ST-11
  - REQ-ST-12
  - REQ-ST-13
must_haves:
  truths:
    - "Path traversal prevented: all sessionIDs sanitized, all paths validated (security)"
    - "Hook payloads validated before processing (security)"
    - "6 concurrent sessions write without corruption (REQ-ST-09)"
    - "Recovery test: disconnect → reconnect → context rebuilt (REQ-ST-10)"
    - "All 13 REQs verified via end-to-end test suite"
    - "npm run typecheck passes"
    - "npm test passes (full suite — regression check)"
    - "npx vitest run tests/features/session-tracker/ passes"
  artifacts:
    - path: "tests/features/session-tracker/integration/concurrency.test.ts"
      provides: "6-session concurrent write verification"
      min_lines: 50
    - path: "tests/features/session-tracker/integration/recovery-integration.test.ts"
      provides: "Disconnection recovery verification"
      min_lines: 40
    - path: "tests/features/session-tracker/integration/e2e-verification.test.ts"
      provides: "End-to-end verification of all 13 REQs"
      min_lines: 80
  key_links:
    - from: "tests/features/session-tracker/integration/e2e-verification.test.ts"
    - to: "src/features/session-tracker/index.ts"
    - via: "import"
    - pattern: "import.*SessionTracker.*from.*session-tracker"
---

<objective>
Harden session tracker with security validation and verify all 13 REQs via end-to-end tests.

Purpose: Final hardening pass ensures path safety, payload validation, and concurrent write isolation. End-to-end verification proves all requirements are met with L2-L3 evidence.

Output: Hardened capture handlers, concurrency tests, recovery tests, E2E verification suite.
</objective>

<execution_context>
@/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/get-shit-done/workflows/execute-plan.md
@/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/CP-ST-01-session-tracker-revamp/01-SPEC.md
@.planning/phases/CP-ST-01-session-tracker-revamp/01-CONTEXT.md
@.planning/phases/CP-ST-01-session-tracker-revamp/01-RESEARCH.md
@.planning/phases/CP-ST-01-session-tracker-revamp/CP-ST-01-01-SUMMARY.md
@.planning/phases/CP-ST-01-session-tracker-revamp/CP-ST-01-02-SUMMARY.md
@.planning/phases/CP-ST-01-session-tracker-revamp/CP-ST-01-03-SUMMARY.md

<interfaces>
<!-- From Plan 01-03 — all implemented modules -->

From src/features/session-tracker/index.ts:
```typescript
export class SessionTracker {
  constructor(private deps: { client: OpenCodeClient; projectRoot: string }) {}
  async handleSessionEvent(event: { eventType: string; sessionID: string; event: unknown }): Promise<void>
  async handleChatMessage(input: unknown, output: unknown): Promise<void>
  async handleToolExecuteAfter(input: unknown, output: unknown): Promise<void>
  async initialize(): Promise<void>
  async cleanup(): Promise<void>
}
```

From src/features/session-tracker/persistence/atomic-write.ts:
```typescript
export function sanitizeSessionID(sessionID: string): string
export function safeSessionPath(projectRoot: string, sessionID: string, filename: string): string
export async function atomicWriteJson(filePath: string, data: unknown): Promise<void>
export async function atomicAppendMarkdown(filePath: string, content: string): Promise<void>
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Threat Model + Hardening</name>
  <files>
    src/features/session-tracker/capture/event-capture.ts,
    src/features/session-tracker/capture/message-capture.ts,
    src/features/session-tracker/capture/tool-capture.ts,
    src/features/session-tracker/persistence/atomic-write.ts
  </files>
  <action>
    Harden all capture handlers with security validations:

    1. **Path safety in atomic-write.ts:**
       - Verify `safeSessionPath()` rejects any sessionID containing `/`, `\`, or `..`
       - Verify resolved path starts with `SESSION_TRACKER_ROOT`
       - Add unit tests for edge cases: empty string, single char, very long string, unicode, path separators

    2. **Hook payload validation in event-capture.ts:**
       - Validate `event.sessionID` is string and matches `sanitizeSessionID()` output
       - Validate `event.eventType` is one of expected types (session.created, session.idle, session.deleted, session.error)
       - Log warning and return early on invalid payload

    3. **Hook payload validation in message-capture.ts:**
       - Validate `input.sessionID` is string
       - Validate `output.message.role` is "user" or "assistant"
       - Validate `output.parts` is array
       - Log warning and return early on invalid payload

    4. **Hook payload validation in tool-capture.ts:**
       - Validate `input.sessionID` is string
       - Validate `input.tool` is string
       - Validate `input.args` is object (not null, not array)
       - For task tool: validate `output.task_id` is string before creating child file
       - Log warning and return early on invalid payload

    5. **Sensitive output pruning:**
       - For unknown tools: capture only tool name and callID, NOT output
       - For read tool: NEVER capture file content (already handled in Plan 02, verify)
       - For skill tool: capture only first header line (already handled in Plan 02, verify)

    6. **Concurrent write safety verification:**
       - Verify project-index-writer.ts serial queue works correctly
       - Verify per-session writes are isolated (no cross-session file locks needed)
       - Add stress test for 6 concurrent sessions

    Verify all hardening with existing tests + new edge case tests.
  </action>
  <verify>
    <automated>npm run typecheck && npx vitest run tests/features/session-tracker/</automated>
  </verify>
  <done>
    - Path traversal prevented on all sessionID usage
    - Hook payloads validated before processing
    - Sensitive output pruned correctly
    - Concurrent write safety verified
    - All existing tests still pass
    - typecheck passes
  </done>
</task>

<task type="auto">
  <name>Task 2: End-to-End Verification</name>
  <files>
    tests/features/session-tracker/integration/concurrency.test.ts,
    tests/features/session-tracker/integration/recovery-integration.test.ts,
    tests/features/session-tracker/integration/e2e-verification.test.ts
  </files>
  <action>
    Create comprehensive end-to-end verification test suite:

    Create `tests/features/session-tracker/integration/concurrency.test.ts`:
    - Test 6 concurrent sessions writing simultaneously to same project root
    - Verify no file corruption or cross-contamination
    - Verify project-continuity.json integrity after concurrent writes
    - Verify session-continuity.json integrity per session
    - Use `Promise.all()` with 6 mock sessions firing events in parallel

    Create `tests/features/session-tracker/integration/recovery-integration.test.ts`:
    - Test full recovery flow: create session → simulate crash → restart → verify context rebuilt
    - Test reconsumption: create session → miss some messages → call reconsumeSession() → verify gaps filled
    - Test incomplete file handling: write truncated .md → verify isSessionFileParseable() returns false
    - Test missing index handling: delete project-continuity.json → verify initialize() returns empty map

    Create `tests/features/session-tracker/integration/e2e-verification.test.ts`:
    - **REQ-ST-01**: Create root session → verify subdir + .md created. Create child session → verify no subdir.
    - **REQ-ST-02**: Fire 3 user messages → verify turn counter 1, 2, 3 in .md
    - **REQ-ST-03**: Fire assistant message → verify main_l0_agent block with name, model, thinking_duration
    - **REQ-ST-04**: Fire skill tool → verify name + 1 header line captured
    - **REQ-ST-05**: Fire read tool → verify path captured, no file content
    - **REQ-ST-06**: Fire task tool → verify child .json created + indices updated
    - **REQ-ST-07**: Create child session → verify ##USER transformed to main_l0_agent
    - **REQ-ST-08**: Create session with children → verify both indices correct
    - **REQ-ST-09**: 6 concurrent sessions → verify no corruption
    - **REQ-ST-10**: Simulate disconnect → verify reconsumption works
    - **REQ-ST-11**: Verify no fs.writeFileSync in hook callbacks (code review assertion)
    - **REQ-ST-12**: Verify all output fields use camelCase
    - **REQ-ST-13**: Verify old state files removed, source code preserved

    Run full verification:
    - `npm run typecheck`
    - `npm test` (full suite — regression check)
    - `npx vitest run tests/features/session-tracker/` (all session tracker tests)
  </action>
  <verify>
    <automated>npm run typecheck && npm test && npx vitest run tests/features/session-tracker/</automated>
  </verify>
  <done>
    - All 13 REQs verified via E2E tests
    - Concurrency test passes (6 sessions)
    - Recovery test passes (disconnect → reconnect)
    - Full test suite passes (regression check)
    - typecheck passes
    - L2-L3 evidence collected
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Session tracker module with 13 requirements implemented, hardened, and verified.</what-built>
  <how-to-verify>
    1. Run `npm run typecheck` — should pass
    2. Run `npm test` — full suite should pass (no regressions)
    3. Run `npx vitest run tests/features/session-tracker/` — all session tracker tests pass
    4. Check `.hivemind/session-tracker/` directory exists after plugin init
    5. Verify old `.hivemind/event-tracker/` state files are cleaned
    6. Verify `src/task-management/journal/event-tracker/` source code still exists
  </how-to-verify>
  <resume-signal>Type "approved" or describe issues</resume-signal>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Hook payload → Module | Malformed hook input (missing sessionID, unexpected types) |
| Module → Filesystem | All writes constrained to `.hivemind/session-tracker/` root |
| Tool input → Module | Agent-provided tool input validated via Zod schema |
| Concurrent writes | Multiple sessions writing to shared index files |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-ST04-01 | Tampering | all capture handlers | mitigate | Path traversal validation on all sessionID usage; sanitizeSessionID() rejects invalid chars |
| T-ST04-02 | Information Disclosure | tool-capture.ts | mitigate | Read tool never captures file content; skill output pruned to 1 header line; unknown tools capture metadata only |
| T-ST04-03 | Denial of Service | project-index-writer.ts | mitigate | Serial queue prevents concurrent write corruption; per-session isolation |
| T-ST04-04 | Spoofing | event-capture.ts | mitigate | SessionID validated via sanitizeSessionID() before use; eventType validated against known types |
| T-ST04-05 | Repudiation | session-writer.ts | mitigate | All writes are atomic (write-to-temp + rename); no partial writes possible |
</threat_model>

<verification>
- `npm run typecheck` passes
- `npm test` passes (full suite — regression check)
- `npx vitest run tests/features/session-tracker/` passes (all session tracker tests)
- All 13 REQs verified via E2E tests
- Concurrency test passes (6 sessions)
- Recovery test passes (disconnect → reconnect)
- Path traversal prevented (security tests)
- Hook payload validation working (malformed input tests)
</verification>

<success_criteria>
- All 13 REQs from SPEC.md verified with L2-L3 evidence
- Security hardening complete (path safety, payload validation, output pruning)
- Concurrent write safety proven (6 sessions)
- Recovery/reconsumption proven
- Full test suite passes (no regressions)
- typecheck passes
</success_criteria>

<output>
After completion, create `.planning/phases/CP-ST-01-session-tracker-revamp/CP-ST-01-04-SUMMARY.md`
</output>
