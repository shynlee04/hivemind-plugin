---
phase: CP-PTY-02-sdk-session-delegation-integration
status: ready
created: 2026-05-08
evidence_level_required: L2-L3 minimum, L1 preferred for E2E
depends_on:
  - CP-PTY-01-background-shell-control-plane-mvp
  - BOOT-08
allowed_surfaces_when_authorized:
  - src/lib/delegation-manager.ts
  - src/lib/sdk-delegation.ts
  - src/lib/session-api.ts
  - src/lib/spawner/spawn-request-builder.ts
  - src/lib/spawner/spawner-types.ts
  - src/lib/spawner/session-creator.ts
  - tests/lib/delegation-manager.test.ts
  - tests/lib/sdk-delegation.test.ts
  - tests/lib/session-api.test.ts
  - tests/integration/sdk-delegation-integration.test.ts
forbidden_surfaces:
  - src/plugin.ts (composition root — no changes unless wiring new modules)
  - .opencode/** (primitive mutation)
  - .hivemind/** (state mutation from plan tasks)
---

# CP-PTY-02 SDK Session Delegation Integration Plan

## Status

READY — depends on CP-PTY-01 and BOOT-08 completion. All tasks are additive; no existing behavior is broken.

## Intended Goal

Enrich SDK child-session delegation with full OpenCode SDK capability surface: system prompt injection, file reference injection, slash command execution, and comprehensive integration/recovery/concurrency tests. Currently, delegation dispatches a flat text prompt via `sendPromptAsync` — this phase unlocks the unused high-value SDK APIs.

## Current State (Codebase Truth)

### What exists today

| Component | File | Status |
|-----------|------|--------|
| DelegationManager dispatch | `src/lib/delegation-manager.ts:163-260` | Working — creates child session, sends prompt via `sendPromptAsync` |
| Prompt body construction | `src/lib/delegation-manager.ts:234-238` | Minimal — `{ parts: [{ type: "text", text: params.prompt }], agent, tools }` |
| SDK delegation handler | `src/lib/sdk-delegation.ts` | Working — stability polling, dual-signal completion, recovery |
| Session API wrappers | `src/lib/session-api.ts` | Working — `createSession`, `sendPrompt`, `sendPromptAsync`, `getSessionMessages` |
| Spawner subsystem | `src/lib/spawner/` | Working — session creation, permission profiles, concurrency keys |
| Completion detector | `src/lib/completion-detector.ts` | Working — dual-signal (session.idle + stability timer) |
| Delegation persistence | `src/lib/delegation-persistence.ts` | Working — JSON file persistence to `.hivemind/state/` |
| Delegation types | `src/lib/delegation-types.ts` | Complete — Delegation, DelegationResult, CommandDelegationParams |
| Unit tests | `tests/lib/delegation-manager.test.ts` | Comprehensive — 1386+ lines covering dispatch, dual-signal, lifecycle, persistence |

### What is MISSING (this phase fills)

| Gap | SDK API Available | Current State |
|-----|-------------------|---------------|
| System prompt injection | `session.prompt` body `system` field | NOT USED — child sessions get no system prompt override |
| File reference injection | `session.prompt` body `parts` array with `FilePartInput` | NOT USED — only text parts sent |
| Slash command execution | `session.command` | NOT WIRED — no delegation path uses it |
| Shell command execution | `session.shell` | NOT WIRED — no delegation path uses it |
| Child session listing | `session.children` | NOT WIRED — no visibility into child sessions |
| Integration tests | — | MISSING — no create→prompt→poll→harvest E2E test |
| Recovery flow tests | — | MISSING — no restart simulation, RECOVERY_UNVERIFIED_ERROR tests |
| Concurrent dispatch tests | — | MISSING — no concurrent dispatch + category gate denial tests |

## SDK API Surface (Unused High-Value)

Based on `@opencode-ai/sdk` type signatures observed in `src/lib/session-api.ts`:

```typescript
// session.prompt body supports:
{
  parts: Array<TextPartInput | FilePartInput>,  // FilePartInput = { type: "file", url: string, filename?: string, mediaType?: string }
  agent?: string,
  tools?: Record<string, boolean>,
  system?: string,  // Per-message system prompt override
}

// session.command — execute slash commands in child sessions
client.session.command({ path: { id: sessionId }, body: { command: "/plan", args: [...] } })

// session.shell — run shell commands within session context
client.session.shell({ path: { id: sessionId }, body: { command: "ls", args: ["-la"] } })

// session.children — list child sessions
client.session.children({ path: { id: parentSessionId } })
```

## Tasks

### CPPTY02-T01: Enhance Context Injection — System Prompt Field

**Goal:** Use the `system` field in `session.prompt` body to inject task boundary metadata into child sessions.

**Files to modify:**
- `src/lib/spawner/spawn-request-builder.ts` — extend `DelegateParams` and `DelegationSpawnRequest` with optional `systemPrompt` field
- `src/lib/spawner/spawner-types.ts` — add `systemPrompt?: string` to `DelegationSpawnRequest`
- `src/lib/delegation-manager.ts` — include `systemPrompt` in the prompt body sent to child session

**Implementation details:**

1. Add `systemPrompt?: string` to `DelegateParams` type in `spawn-request-builder.ts:16-27`.
2. Add `systemPrompt?: string` to `DelegationSpawnRequest` in `spawner-types.ts:44-61`.
3. Thread `systemPrompt` through `buildSdkSpawnRequest()` in `spawn-request-builder.ts:39-54`.
4. In `delegation-manager.ts:234-238`, extend the prompt body construction:
   ```typescript
   const promptBody: Record<string, unknown> = {
     parts: [{ type: "text", text: params.prompt }],
     agent: agent.name,
     tools: buildDelegationPromptTools(child.allowedTools),
   }
   if (params.systemPrompt) {
     promptBody.system = params.systemPrompt
   }
   ```
5. Add unit test: dispatch with `systemPrompt` verifies `client.session.promptAsync` body includes `system` field.
6. Add unit test: dispatch without `systemPrompt` verifies body does NOT include `system` field.

**Acceptance criteria:**
- Given a dispatch with `systemPrompt: "You are a code reviewer"`, when `promptAsync` is called, then the body includes `system: "You are a code reviewer"`.
- Given a dispatch without `systemPrompt`, when `promptAsync` is called, then the body does NOT include a `system` field.
- Typecheck passes.
- Existing tests pass.

**Verification:** `npx vitest run tests/lib/delegation-manager.test.ts`

---

### CPPTY02-T02: Add File Reference Injection via FilePartInput

**Goal:** Enable file reference injection in delegation prompts using the SDK's `FilePartInput` type in the `parts` array.

**Files to modify:**
- `src/lib/spawner/spawn-request-builder.ts` — extend `DelegateParams` with `fileReferences?: Array<{ url: string; filename?: string; mediaType?: string }>`
- `src/lib/spawner/spawner-types.ts` — add `fileReferences` to `DelegationSpawnRequest`
- `src/lib/delegation-manager.ts` — construct `parts` array with both text and file parts

**Implementation details:**

1. Add to `DelegateParams` in `spawn-request-builder.ts`:
   ```typescript
   fileReferences?: Array<{ url: string; filename?: string; mediaType?: string }>
   ```
2. Add to `DelegationSpawnRequest` in `spawner-types.ts`:
   ```typescript
   fileReferences?: Array<{ url: string; filename?: string; mediaType?: string }>
   ```
3. Thread through `buildSdkSpawnRequest()`.
4. In `delegation-manager.ts:234-238`, construct parts array dynamically:
   ```typescript
   const parts: Array<Record<string, unknown>> = [{ type: "text", text: params.prompt }]
   if (params.fileReferences) {
     for (const ref of params.fileReferences) {
       parts.push({ type: "file", url: ref.url, ...(ref.filename ? { filename: ref.filename } : {}), ...(ref.mediaType ? { mediaType: ref.mediaType } : {}) })
     }
   }
   const promptBody = { parts, agent: agent.name, tools: buildDelegationPromptTools(child.allowedTools) }
   ```
5. Add unit test: dispatch with `fileReferences` verifies `promptAsync` body `parts` array contains both text and file entries.
6. Add unit test: dispatch with empty `fileReferences` verifies only text part present.
7. Add unit test: dispatch without `fileReferences` verifies only text part present.

**Acceptance criteria:**
- Given a dispatch with `fileReferences: [{ url: "file:///path/to/file.ts", filename: "file.ts" }]`, when `promptAsync` is called, then `body.parts` contains `[{ type: "text", text: "..." }, { type: "file", url: "file:///path/to/file.ts", filename: "file.ts" }]`.
- Given a dispatch without `fileReferences`, when `promptAsync` is called, then `body.parts` contains only the text part.
- Typecheck passes.
- Existing tests pass.

**Verification:** `npx vitest run tests/lib/delegation-manager.test.ts`

---

### CPPTY02-T03: Wire `session.command` Capability for Child Session Slash Command Execution

**Goal:** Add a new `dispatchCommand` variant that executes slash commands in existing child sessions via `session.command`.

**Files to modify:**
- `src/lib/session-api.ts` — add `sendCommand()` wrapper for `client.session.command()`
- `src/lib/sdk-delegation.ts` — add `executeSlashCommand()` method
- `src/lib/delegation-manager.ts` — add `dispatchSlashCommand()` public method
- `src/lib/delegation-types.ts` — add `SlashCommandParams` type

**Implementation details:**

1. Add to `session-api.ts`:
   ```typescript
   export async function sendCommand(
     client: OpenCodeClient,
     sessionID: string,
     command: string,
     args?: string[],
   ): Promise<unknown> {
     const validSessionID = assertValidSessionID(sessionID)
     return unwrapData(await client.session.command({
       path: { id: validSessionID },
       body: { command, ...(args ? { args } : {}) },
     }))
   }
   ```

2. Add to `delegation-types.ts`:
   ```typescript
   export type SlashCommandParams = {
     delegationId: string
     command: string
     args?: string[]
   }
   ```

3. Add to `delegation-manager.ts`:
   ```typescript
   async dispatchSlashCommand(params: SlashCommandParams): Promise<DelegationResult> {
     const delegation = this.state.get(params.delegationId)
     if (!delegation) throw new Error(`[Harness] Delegation not found: ${params.delegationId}`)
     if (delegation.status !== "running") throw new Error(`[Harness] Delegation not running: ${delegation.status}`)
     if (delegation.executionMode !== "sdk") throw new Error(`[Harness] Slash commands only supported for SDK delegations`)
     await sendCommand(this.client, delegation.childSessionId, params.command, params.args)
     return buildDelegationResult(delegation)
   }
   ```

4. Add unit test: `dispatchSlashCommand` calls `client.session.command` with correct path and body.
5. Add unit test: `dispatchSlashCommand` throws for non-existent delegation.
6. Add unit test: `dispatchSlashCommand` throws for non-running delegation.
7. Add unit test: `dispatchSlashCommand` throws for non-SDK delegation.

**Acceptance criteria:**
- Given a running SDK delegation, when `dispatchSlashCommand({ delegationId, command: "/plan", args: ["arg1"] })` is called, then `client.session.command` is called with `{ path: { id: childSessionId }, body: { command: "/plan", args: ["arg1"] } }`.
- Given a non-existent delegation ID, when `dispatchSlashCommand` is called, then it throws `[Harness] Delegation not found`.
- Given a completed delegation, when `dispatchSlashCommand` is called, then it throws `[Harness] Delegation not running`.
- Typecheck passes.
- Existing tests pass.

**Verification:** `npx vitest run tests/lib/delegation-manager.test.ts`

---

### CPPTY02-T04: Add SDK Delegation Integration Test

**Goal:** Create a comprehensive integration test that exercises the full SDK delegation lifecycle: create → prompt → poll → harvest.

**Files to create:**
- `tests/integration/sdk-delegation-integration.test.ts`

**Implementation details:**

1. Create `tests/integration/` directory if not exists (with `.gitkeep`).
2. Create `tests/integration/sdk-delegation-integration.test.ts` with:
   - Mock client that simulates realistic SDK behavior (session.create returns ID, promptAsync returns 204, messages returns incrementally).
   - Test: Full lifecycle — dispatch → handleSessionIdle → stability polls → completion → result extraction.
   - Test: Dispatch with systemPrompt → verify prompt body includes system field.
   - Test: Dispatch with fileReferences → verify prompt body parts array.
   - Test: Dispatch with both systemPrompt and fileReferences → verify both present.
   - Test: Safety ceiling fires when child never completes.
   - Test: Session deletion during running state → error transition.
   - Test: Result extraction from multi-message assistant output.

3. Use the existing mock patterns from `tests/lib/delegation-manager.test.ts` (createMockClient, flushMicrotasks, fake timers).

**Acceptance criteria:**
- All integration tests pass.
- Tests exercise the full create→prompt→poll→harvest path.
- Tests verify prompt body construction with new fields.
- Typecheck passes.

**Verification:** `npx vitest run tests/integration/sdk-delegation-integration.test.ts`

---

### CPPTY02-T05: Add Recovery Flow Tests

**Goal:** Test the recovery path: restart simulation, RECOVERY_UNVERIFIED_ERROR handling, and recovery retry behavior.

**Files to create:**
- `tests/lib/sdk-delegation-recovery.test.ts`

**Implementation details:**

1. Create `tests/lib/sdk-delegation-recovery.test.ts` with:
   - Test: `recoverSdkDelegation` with idle session → calls `onSessionIdle`.
   - Test: `recoverSdkDelegation` with busy session → schedules safety ceiling.
   - Test: `recoverSdkDelegation` with missing session → sets `RECOVERY_UNVERIFIED_ERROR`, schedules safety ceiling.
   - Test: `recoverSdkDelegation` with timeout on status fetch → sets `RECOVERY_UNVERIFIED_ERROR`.
   - Test: `clearStaleRecoveryError` removes the recovery error marker.
   - Test: `recoverPending` iterates persisted delegations and recovers SDK ones.
   - Test: `recoverPending` marks headless command delegations as `non-resumable-after-restart`.
   - Test: `recoverPending` recovers PTY delegations via `commandHandler.recoverPtyDelegation`.

2. Use the existing mock patterns and `SdkDelegationHandler` directly for focused testing.

**Acceptance criteria:**
- All recovery tests pass.
- RECOVERY_UNVERIFIED_ERROR is correctly set and cleared.
- Headless delegations are marked non-resumable after restart.
- Typecheck passes.

**Verification:** `npx vitest run tests/lib/sdk-delegation-recovery.test.ts`

---

### CPPTY02-T06: Add Concurrent Dispatch and Category Gate Denial Tests

**Goal:** Test concurrent dispatch behavior and category gate denial scenarios.

**Files to create:**
- `tests/lib/delegation-concurrency.test.ts`

**Implementation details:**

1. Create `tests/lib/delegation-concurrency.test.ts` with:
   - Test: Concurrent dispatch calls produce independent delegations with unique IDs (already exists, but expand).
   - Test: Concurrent dispatch respects concurrency limit — excess calls queue.
   - Test: Parallelization toggle off → forces sequential dispatch (limit 1).
   - Test: Category gate denies unknown category before session create.
   - Test: Category gate denies review category with write-capable tools.
   - Test: Category gate allows command-process category.
   - Test: Category gate denial records audit entry via `recordCategoryGateDeny`.
   - Test: Nesting depth exceeded → throws `[Harness] Maximum delegation nesting depth`.
   - Test: Agent validation failure → throws `[Harness] Invalid agent`.
   - Test: Agent validation graceful degradation when SDK returns agents with missing fields.

2. Use the existing mock patterns from `tests/lib/delegation-manager.test.ts`.

**Acceptance criteria:**
- All concurrency and gate tests pass.
- Category gate denial is tested for all boundary cases.
- Nesting depth enforcement is verified.
- Typecheck passes.

**Verification:** `npx vitest run tests/lib/delegation-concurrency.test.ts`

---

### CPPTY02-T07: Create VERIFICATION.md

**Goal:** Document verification evidence for CP-PTY-02 completion.

**Files to create:**
- `.planning/phases/CP-PTY-02-sdk-session-delegation-integration/VERIFICATION.md`

**Implementation details:**

1. Document all task completion evidence (commit hashes, test output).
2. Document typecheck results.
3. Document test coverage for new code.
4. Document any deviations from plan.
5. Document evidence level classification (L2 for unit tests, L3 if integration tests run against real SDK).

**Acceptance criteria:**
- VERIFICATION.md exists with task completion table.
- All commit hashes recorded.
- Typecheck and test output captured.

---

## Dependency Graph

```
CPPTY02-T01 (system prompt) ──┐
CPPTY02-T02 (file references) ─┼── CPPTY02-T04 (integration test)
CPPTY02-T03 (slash commands) ──┘         │
                                          ├── CPPTY02-T07 (verification)
CPPTY02-T05 (recovery tests) ────────────┤
CPPTY02-T06 (concurrency tests) ─────────┘
```

T01, T02, T03 are independent and can be executed in parallel.
T04 depends on T01-T03 (tests the new prompt body construction).
T05, T06 are independent of T01-T03.
T07 depends on all previous tasks.

## Wave Execution Plan

| Wave | Tasks | Parallel? |
|------|-------|-----------|
| Wave 1 | T01, T02, T03, T05, T06 | Yes — all independent |
| Wave 2 | T04 | No — depends on T01-T03 |
| Wave 3 | T07 | No — depends on all |

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| SDK `system` field not supported in current version | Low | High | Test with mock first; verify against SDK types |
| SDK `FilePartInput` type mismatch | Low | Medium | Use SDK type imports, not manual type construction |
| `session.command` API signature differs from assumption | Medium | Medium | Verify against SDK source before implementation |
| Integration test requires real SDK client | Medium | Low | Use mock client for unit tests; document L3 evidence gap |

## Evidence Requirements

| Evidence Type | Level | Source |
|---------------|-------|--------|
| Unit tests pass | L2 | `npx vitest run tests/lib/delegation-manager.test.ts` |
| Typecheck passes | L2 | `npm run typecheck` |
| Integration tests pass | L2 | `npx vitest run tests/integration/sdk-delegation-integration.test.ts` |
| Recovery tests pass | L2 | `npx vitest run tests/lib/sdk-delegation-recovery.test.ts` |
| Concurrency tests pass | L2 | `npx vitest run tests/lib/delegation-concurrency.test.ts` |
| Full test suite passes | L2 | `npm test` |
