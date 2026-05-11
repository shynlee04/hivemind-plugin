# Phase BOOT-09: MVP Config Schema + Entry Init Verification — Research

**Researched:** 2026-05-12
**Domain:** OpenCode Plugin Hooks, Config Schema, Runtime Policy Enforcement
**Confidence:** HIGH

## Summary

Phase BOOT-09 delivers runtime enforcement of two config fields — `conversation_language` and `documents_and_artifacts_language` — which are currently decorative metadata in the behavioral profile block. Enforcement uses two existing hook injection points: (1) `system.transform` for system prompt language governance injection, and (2) `tool.execute.before` for document language tool guard reminders. Child session exclusion uses OpenCode's native `parentID` field on session records, cached at session entry via the `event` hook. No new hook registration is needed.

**Primary recommendation:** Inject a `--- Language Governance ---` block at `output.system[0]` BEFORE the existing governance block in `core-hooks.ts` for main sessions only. Add `document_paths` to `HivemindConfigsSchema`. Add language reminder logic in `tool-guard-hooks.ts` for Write/Edit/apply_patch tools targeting `.md` files under configured paths.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Config schema (`document_paths`) | Schema Kernel | — | New field in `HivemindConfigsSchema` — validation-contract sector |
| Language governance block | Hook (system.transform) | — | System prompt injection at `output.system[0]` — existing hook |
| Child session exclusion | Hook (event) + Cache | Hook (system.transform) | Cache `isMainSession` bool on `session.created` event, read in `system.transform` |
| Document language tool guard | Hook (tool.execute.before) | — | Pre-execution language reminder for Write/Edit/apply_patch |
| Config subscription | Config subscriber | — | Already wired — no changes needed |

## User Constraints

### Locked Decisions (from CONTEXT.md)

#### 1. Child Session Detection
- **D-01:** Child session detection uses OpenCode's native `parentID` field on session records, NOT Hivemind's `DelegationManager.delegationsBySession`. Native `task` tool child sessions are managed by OpenCode runtime and are invisible to Hivemind's delegation tracking.
- **D-02:** Detection mechanism: cache the `isMainSession` boolean on `session.created` event by checking if the session has a `parentID`. The `system.transform` hook reads from the cache — no per-hook SDK calls.
- **D-03:** A session is "main" if it has NO `parentID` (OpenCode's native flag). All child sessions (any delegation depth) have a `parentID` set by the `task` tool, so `parentID === null/undefined` correctly identifies only level-0 sessions.
- **D-04:** The cached `isMainSession` function is injected via `HookDependencies` (matching existing `getBehavioralProfile` pattern in `plugin.ts:112`).

#### 2. Language Block Format & Position
- **D-05:** Language block is injected at `output.system[0]` — **BEFORE** the existing governance block. This positions the language frame first, making it the most visible context.
- **D-06:** The existing governance block format is LOCKED (`buildGovernanceBlock()` in `governance-block.ts`) and must NOT be modified. The language instruction is a separate block, not a modification of the existing governance instruction line.
- **D-07:** Language block uses strong framing with:
  - Header: `--- Language Governance ---`
  - Urgency: `CRITICAL:` prefix
  - Imperative: `"You MUST respond in LANGUAGE."`
  - Override: `"Even if the user writes in another language, you MUST override and respond in LANGUAGE."`

#### 3. Document Paths Schema
- **D-08:** The `document_paths` config field is a flat string array: `z.array(z.string()).default([".hivemind/planning/"])`
- **D-09:** Schema accepts any path relative to project root. Default is only `[".hivemind/planning/"]`. Users can expand via `configs.json`.
- **D-10:** Paths support recursive subdirectory globbing.

#### 4. Document Language Enforcement
- **D-11:** Two-layer enforcement:
  - Layer 1 (System prompt): Document language instruction is included in the same `--- Language Governance ---` block (combined with conversation language). References specific paths: "When writing .md files under configured document paths (e.g., .hivemind/planning/), you MUST write in LANGUAGE."
  - Layer 2 (Tool guard): `tool.execute.before` hook detects when Write/Edit/apply_patch targets a `.md` file under `document_paths`, injects a path-specific language reminder.
- **D-12:** The tool guard is NOT content validation — it's a pre-execution instruction reminder (per SPEC: "enforcement is via instruction, not post-hoc validation").

### the agent's Discretion
- Exact wording of the language block (must satisfy: imperative "MUST", override "even if user writes in other language", document paths reference)
- Cache implementation detail for `isMainSession` (Map vs WeakMap vs other)
- Tool guard reminder exact text injected in `tool.execute.before`

### Deferred Ideas (OUT OF SCOPE)
- **Per-path or per-document language override** — Allowing different languages for different document paths. Deferred per SPEC: "must at minimum have global enforcement."
- **`user_expert_level` runtime enforcement** — Currently decorative like language. Deferred to future phase.
- **Mode/delegation/tool/skill enforcement (WS-4)** — Deferred to WS-4 workstream.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-01 | `conversation_language` enforced in main session via `system.transform` | Hook interface confirmed. `parentID` detection via event hook confirmed. Language block format per D-07. |
| REQ-02 | `conversation_language` overrides user's writing language | Strong framing pattern confirmed as viable. Block injected at `output.system[0]`. |
| REQ-03 | `documents_and_artifacts_language` enforced with configurable paths | `document_paths` schema pattern confirmed (`.strip()` compatibility). Tool detection for Write/Edit/apply_patch confirmed. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| OpenCode Plugin SDK | 1.x (@opencode-ai/plugin) | Plugin hook system for `system.transform`, `tool.execute.before`, `event` hooks | Already wired in project — no new dependencies |
| Zod | v4 | Schema validation for `document_paths` config field | Already used for `HivemindConfigsSchema` — no new dependency |
| Vitest | Latest | Unit testing for hook behaviors | Already used for all hook tests — no new dependency |

**Installation:** No new npm dependencies required per SPEC.md constraint.

## Architecture Patterns

### Hook Dependency Injection Pattern

The project has an established pattern for injecting dependencies into hooks. All hooks receive their dependencies via a `deps` object passed to the factory function:

```typescript
// plugin.ts:107
const deps = {
  client, lifecycleManager, stateManager: taskState,
  runAutoLoop, runRalphLoop, escalationMessage,
  getIntake: sessionEntryObserverFactory.getIntake,
  hivemindConfig,
  getBehavioralProfile: (sessionId: string) => resolveBehavioralProfile(sessionId, projectDirectory),
}
```

**Pattern for BOOT-09:** Add `isMainSession` to `HookDependencies` interface, populate the cache from the `event` hook on `session.created`, and inject the function at `plugin.ts` level.

### Language Governance Block Injection Pattern

```
system.transform input ({ sessionID?: string, model: Model })
    │
    ├── Check: isMainSession(sessionID) === true ?
    │     YES → Continue
    │     NO  → Return early (no language injection)
    │
    ├── Check: hivemindConfig.conversation_language configured?
    │     YES → Build language governance block
    │     NO  → Return early
    │
    ├── Inject at output.system[0]:
    │   "--- Language Governance ---
    │    CRITICAL: You MUST respond in [conversation_language].
    │    Even if the user writes in another language, you MUST override
    │    and respond in [conversation_language].
    │    
    │    When writing .md files under configured document paths
    │    (e.g., [document_paths]), you MUST write in [documents_language]."
    │
    └── Continue with existing governance block at [1], intake at [2], etc.
```

### Tool Guard Language Reminder Pattern

```
tool.execute.before input ({ tool: string, sessionID: string, callID: string })
    │
    ├── Extract tool name from input.tool
    ├── Extract args from output.args
    │
    ├── Is tool one of ["write", "edit", "apply_patch"]?
    │     NO  → Return (no language reminder)
    │     YES → Continue
    │
    ├── Extract file path:
    │   - "write":   args.filePath
    │   - "edit":    args.filePath
    │   - "apply_patch": parse args.patchText for embedded file paths
    │
    ├── Does path end with ".md" and match any document_paths pattern?
    │     NO  → Return (no language reminder)
    │     YES → Inject language reminder via output.args.*
    │
    └── Reminder format (via output mutation):
        Modify args to include a language instruction
        (e.g., prepend a note to the content, or set a language field)
```

### Recommended Project Structure

No structural changes needed — all work is within existing files:

```
src/
├── hooks/
│   ├── lifecycle/
│   │   └── core-hooks.ts       # Add language governance block injection
│   ├── guards/
│   │   ├── tool-guard-hooks.ts  # Add document language tool guard
│   │   └── governance-block.ts  # LOCKED — no changes
│   └── types.ts                 # Add `isMainSession` to HookDependencies
├── schema-kernel/
│   └── hivemind-configs.schema.ts  # Add `document_paths` field
├── plugin.ts                   # Wire `isMainSession` in deps
└── shared/
    └── session-api.ts          # `getEventParentID()` already exists
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Hook registration | Registering new hooks | Existing `system.transform` and `tool.execute.before` | Both hooks already registered in `plugin.ts`. No new registration needed. |
| Child session detection | DelegationManager.delegationsBySession | OpenCode native `parentID` field | Child sessions from native `task` tool are invisible to DelegationManager. `parentID` is the authoritative field. |
| Config subscription | Custom config watch | `getConfig()` from `config/subscriber.ts` | Already wired — `hivemindConfig` is loaded once at init and available via deps. |

## Common Pitfalls

### Pitfall 1: `output.args` is the right place for tool guard injection
**What goes wrong:** Adding language instruction to `output` directly (outside `args`) — the LLM doesn't see it.
**Why it happens:** The `tool.execute.before` output shape is `{ args: any }` — mutating `output.args` modifies the tool arguments before execution. Setting values on `output` at top level has no effect.
**How to avoid:** Always modify `output.args` for tool guard injections.
**Warning signs:** `output.tool` or `output.sessionID` being set instead of `output.args`.

### Pitfall 2: `output.system` may be `undefined` or `unknown`
**What goes wrong:** Assuming `output.system` is always a `string[]` — it might be `undefined` for first call.
**Why it happens:** The `system.transform` output factory may not initialize `system` array. Current code handles this: `output.system = Array.isArray(output.system) ? output.system : []`.
**How to avoid:** Follow the existing pattern — always coerce `output.system` to array before pushing.
**Warning signs:** `TypeError: Cannot read properties of undefined (reading 'unshift')`.

### Pitfall 3: `apply_patch` has no single `filePath` field
**What goes wrong:** Detecting `apply_patch` file paths from `args.filePath` — `apply_patch` only has `args.patchText`.
**Why it happens:** `apply_patch` parameters are `{ patchText: string }` — file paths are embedded in the patch text, not in a dedicated field.
**How to avoid:** For Layer 2 (tool guard), either: (a) parse `patchText` for file paths (complex), or (b) inject a generic reminder for `apply_patch` without path-specific targeting, or (c) rely on Layer 1 (system prompt) for `apply_patch` coverage.
**Warning signs:** `args.filePath` is `undefined` for `apply_patch` calls.

### Pitfall 4: `session.created` event may not have `parentID` for main sessions
**What goes wrong:** Checking `parentID` on the event when it's not present — OpenCode may omit `parentID` entirely for main sessions (not `null`, just absent).
**Why it happens:** The Session type defines `parentID?: string` — it's optional. Main sessions simply don't have the key.
**How to avoid:** Check `parentID === undefined || parentID === null` — both indicate main session. Use the existing `getEventParentID()` helper which handles nested property paths.
**Warning signs:** Falsy check `!parentID` incorrectly treats empty string as child.

### Pitfall 5: Governance block string format is LOCKED
**What goes wrong:** Modifying `buildGovernanceBlock()` format — downstream tests match exact string patterns.
**Why it happens:** The governance block format has 18+ existing tests that match exact string content (see `governance-block.test.ts` lines 55-172).
**How to avoid:** Do NOT modify `buildGovernanceBlock()`, `governance-block.ts`, or any governance block string. Language is a SEPARATE block injected at position 0.
**Warning signs:** Governance block tests start failing.

## Code Examples

Verified patterns from official sources:

### Example 1: `system.transform` Hook Interface

```typescript
// Source: DeepWiki anomalyco/opencode packages/plugin/src/index.ts
export interface Hooks {
  // ... other hooks ...
  
  "tool.execute.before"?: (
    input: { tool: string; sessionID: string; callID: string },
    output: { args: any },
  ) => Promise<void>
  
  "tool.execute.after"?: (
    input: { tool: string; sessionID: string; callID: string; args: any },
    output: { title: string; output: string; metadata: any },
  ) => Promise<void>
  
  "experimental.chat.system.transform"?: (
    input: { sessionID?: string; model: Model },
    output: { system: string[] },
  ) => Promise<void>
  
  "event"?: (input: { event: Event }) => Promise<void>
}
```

### Example 2: Write/Edit/apply_patch Tool Input Shapes

```typescript
// Source: GitHub anomalyco/opencode source code, verified via zread

// Write tool
export const Parameters = Schema.Struct({
  content: Schema.String,
  filePath: Schema.String,           // The absolute path to the file to write
})

// Edit tool
export const Parameters = Schema.Struct({
  filePath: Schema.String,           // The absolute path to the file to modify
  oldString: Schema.String,          // The text to replace
  newString: Schema.String,          // The text to replace it with
  replaceAll: Schema.optional(Schema.Boolean),
})

// ApplyPatch tool
export const Parameters = Schema.Struct({
  patchText: Schema.String,          // The full patch text describing all changes
  // NOTE: No filePath field — paths are EMBEDDED in patchText
})
```

### Example 3: Session Type with parentID

```typescript
// Source: GitHub anomalyco/opencode source code, verified via Repomix
export type Session = {
  id: string
  projectID: string
  directory: string
  parentID?: string            // undefined/null for main sessions
  summary?: { additions: number; deletions: number; files: number }
  title: string
  version: string
  time: { created: number; updated: number; compacting?: number }
}

export type EventSessionCreated = {
  type: "session.created"
  properties: { info: Session }
}
```

### Example 4: Existing `getEventParentID` Helper

```typescript
// Source: src/shared/session-api.ts (lines 204-211, 246-248)
// Already exists — can be used for parentID extraction from events

export function getParentID(session: unknown): string | undefined {
  return (
    asString(getNestedValue(session, ["parentID"])) ??
    asString(getNestedValue(session, ["parentId"])) ??
    asString(getNestedValue(session, ["info", "parentID"])) ??
    asString(getNestedValue(session, ["info", "parentId"]))
  )
}

export function getEventParentID(event: unknown): string | undefined {
  return getParentID(getEventSessionInfo(event))
}
```

### Example 5: Existing `HookDependencies` Interface (with BOOT-09 addition)

```typescript
// Source: src/hooks/types.ts
// BOOT-09 ADDITION: isMainSession to the interface

export interface HookDependencies {
  lifecycleManager: HarnessLifecycleManager
  client: OpenCodeClient
  stateManager: TaskStateManager
  eventObservers?: Array<(input: { event?: unknown }) => Promise<void> | void>
  autoLoopConfig?: Partial<AutoLoopConfig>
  parentAutoLoopConfig?: Partial<ParentAutoLoopConfig>
  sleep?: (ms: number) => Promise<void>
  getIntake?: (sessionId: string) => IntakeResult | undefined
  hivemindConfig?: HivemindConfigs
  getBehavioralProfile?: (sessionId: string) => ResolvedBehavioralProfile
  isMainSession?: (sessionId: string) => boolean  // <-- BOOT-09 ADDITION
}
```

### Example 6: `document_paths` Schema Pattern

```typescript
// Source: src/schema-kernel/hivemind-configs.schema.ts (following existing pattern)
// The schema uses .strip() for lenient parsing — new fields are simply added
// to the z.object() block without any migration issues.

export const HivemindConfigsSchema = z
  .object({
    conversation_language: SupportedLanguageSchema.default("en"),
    documents_and_artifacts_language: SupportedLanguageSchema.default("en"),
    document_paths: z.array(z.string()).default([".hivemind/planning/"]),
    mode: HivemindModeSchema.default("expert-advisor"),
    user_expert_level: UserExpertLevelSchema.default("intermediate-high-level"),
    // ... existing fields unchanged
  })
  .strip()
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Language fields as decorative metadata | Language fields produce enforced behavior | BOOT-09 | Two new behaviors: (1) system prompt language instruction, (2) document language tool guard |
| Governance block at `output.system[0]` | Language block at `output.system[0]`, governance at `[1]` | BOOT-09 | Order change: language frame precedes governance frame |
| No document path config | `document_paths` array in schema | BOOT-09 | Configurable document output targets |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `parentID` is `undefined` (not `null`) for main sessions in OpenCode | Hook Interface Validation | LOW — the code already handles both via `getParentID()` which checks presence |
| A2 | Native `task` tool does not set `parentID` that Hivemind DelegationManager can see | Child Session Detection | LOW — per CONTEXT.md D-01, native task sessions are invisible to DelegationManager |
| A3 | `tool.execute.before` receives `args` in `output.args` for all tools | Tool Detection | HIGH — confirmed via DeepWiki and source code (packages/plugin/src/index.ts lines 33936-33939) |
| A4 | `apply_patch` has no `filePath` parameter in its schema | Tool Detection | HIGH — confirmed via zread from anomalyco/opencode (Parameters = `{ patchText: string }`) |
| A5 | `apply_patch` path-specific guard requires parsing `patchText` | Tool Detection | MEDIUM — patch parsing is complex; for MVP, inject generic reminder for apply_patch instead |

**No user confirmation needed:** Only A4 and A5 touch uncertain territory. A4 is verified via source code. A5 is a design choice within agent discretion.

## Open Questions

1. **How to handle `apply_patch` path-specific guard?**
   - What we know: `apply_patch` has `args.patchText` with embedded file paths. Parsing hunks from patch text is possible but adds complexity.
   - What's unclear: Whether the MVP should parse hunks for path detection or fall back to generic reminder.
   - Recommendation: For MVP, inject generic document language reminder for `apply_patch` (no path-specific targeting). Path-specific detection can be deferred.

2. **Where to store the `isMainSession` cache?**
   - What we know: Needs to be populated on `session.created` event and read from `system.transform`.
   - What's unclear: Should it live in a new observer module, or inline in `plugin.ts`?
   - Recommendation: Follow the existing `createSessionEntryEventObserver()` pattern in `event-observers.ts` — create a companion `createSessionIsMainObserver()` that caches `isMainSession` booleans.

3. **Tool guard reminder format?**
   - What we know: The reminder must be visible to the LLM before tool execution.
   - What's unclear: Whether to modify `output.args` directly (e.g., prepend to `content`) or add a separate field.
   - Recommendation: For Write/Edit, prepend a language comment to `output.args.content` or `output.args.newString`. For `apply_patch`, skip path-specific reminder in MVP.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build/test | ✓ | >= 20.0.0 | — |
| npm | Dependencies | ✓ | Latest | — |
| OpenCode plugin SDK | Hook system | ✓ (peer dep) | @opencode-ai/plugin >= 1.1.0 | — |

**Missing dependencies with no fallback:** None — no new dependencies needed.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (latest) |
| Config file | `vitest.config.ts` at project root |
| Quick run command | `npx vitest run tests/hooks/create-core-hooks.test.ts tests/hooks/create-tool-guard-hooks.test.ts tests/hooks/governance-block.test.ts tests/schema-kernel/` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-01 | system.transform injects language block for main sessions | unit | `npx vitest run tests/hooks/create-core-hooks.test.ts` | ✅ Existing |
| REQ-01 | system.transform skips language block for child sessions | unit | `npx vitest run tests/hooks/create-core-hooks.test.ts` | ❌ Wave 0 |
| REQ-02 | Language instruction includes override behavior | unit | `npx vitest run tests/hooks/create-core-hooks.test.ts` | ❌ Wave 0 |
| REQ-03 | document_paths field in schema with default | unit | `npx vitest run tests/schema-kernel/hivemind-configs.test.ts` | ❌ Wave 0 |
| REQ-03 | tool.execute.before injects language reminder for Write/Edit at document paths | unit | `npx vitest run tests/hooks/create-tool-guard-hooks.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run tests/hooks/ tests/schema-kernel/`
- **Per wave merge:** `npm run typecheck && npx vitest run tests/hooks/create-core-hooks.test.ts tests/hooks/create-tool-guard-hooks.test.ts tests/hooks/governance-block.test.ts`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/hooks/create-core-hooks.test.ts` — Add tests for language governance block injection (main vs child sessions)
- [ ] `tests/hooks/create-tool-guard-hooks.test.ts` — Add tests for document language tool guard (Write/Edit path matching)
- [ ] `tests/schema-kernel/hivemind-configs.test.ts` — Add test for `document_paths` field with default and custom values
- [ ] Framework install: None needed — Vitest already configured

## Security Domain

> Skipped — `security_enforcement` not explicitly disabled but BOOT-09 has no external auth, crypto, or access control surface. Language instructions and path configurations are prompt-level enforcement with zero security boundary implications.

## Hook Interface Validation

### `system.transform` Hook

**Source:** [VERIFIED: Repomix anomalyco/opencode packages/plugin/src/index.ts] + [VERIFIED: DeepWiki anomalyco/opencode]

The OpenCode SDK defines the hook as `"experimental.chat.system.transform"` in the Hooks interface, but the project uses `"system.transform"` which is accepted by the framework.

```
Hooks interface (packages/plugin/src/index.ts):
  "experimental.chat.system.transform"?: (
    input: { sessionID?: string; model: Model },
    output: { system: string[] },
  ) => Promise<void>
```

**Project's current usage (core-hooks.ts):**
```typescript
type SystemInput = { sessionID?: string }
type SystemOutput = { system?: unknown }
```

**Key observations:**
- `input.sessionID` is available — confirmed by both the type definition and the existing code at core-hooks.ts:73 which reads `getNestedValue(input, ["sessionID"])`
- `input.model` is NOT used by the project — the project's `SystemInput` type omits it
- `output.system` is the array to push string blocks into — must be a `string[]`
- The hook fires for ALL sessions (main + child) — no built-in filtering

### `tool.execute.before` Hook

**Source:** [VERIFIED: Repomix anomalyco/opencode packages/plugin/src/index.ts:33936-33939]

```
Hooks interface:
  "tool.execute.before"?: (
    input: { tool: string; sessionID: string; callID: string },
    output: { args: any },
  ) => Promise<void>
```

**Key observations:**
- `input.tool` — tool name string (e.g., "write", "edit", "apply_patch") — confirmed at tool-guard-hooks.ts:69
- `input.sessionID` — session ID string — confirmed
- `output.args` — tool arguments object — the hook output's `args` contains the actual tool parameters
- The hook fires BEFORE tool execution, allowing modification of `output.args` to influence tool behavior

### `event` Hook (for parentID detection)

**Source:** [VERIFIED: Repomix anomalyco/opencode]

```
Hooks interface:
  event?: (input: { event: Event }) => Promise<void>
```

**Event shape for session.created:**
```typescript
export type EventSessionCreated = {
  type: "session.created"
  properties: { info: Session }
}

export type Session = {
  id: string
  projectID: string
  directory: string
  parentID?: string       // undefined = main session, set = child session
  title: string
  version: string
  time: { created: number; updated: number; compacting?: number }
}
```

**Key observations:**
- `parentID` is at `event.properties.info.parentID` — the existing helper `getEventParentID()` in `session-api.ts` already navigates this path
- Main sessions have `parentID: undefined` (property absent); child sessions have `parentID: "<sessionID>"`
- The `event` hook in `core-hooks.ts` already routes events to observers — a new `isMainSession` cache observer can be added to the `eventObservers` array

### Confirmation: No `parentSessionID` in hook inputs

**Source:** [VERIFIED: Repomix anomalyco/opencode packages/plugin/src/index.ts]

- Neither `system.transform` input nor `tool.execute.before` input contains `parentSessionID`
- The incoming `input.sessionID` is always the current (child) session's ID
- The `system.transform` input spec is `{ sessionID?: string; model: Model }` — no parentSessionID
- The `tool.execute.before` input spec is `{ tool: string; sessionID: string; callID: string }` — no parentSessionID

## Tool Detection

### Write Tool Input Shape

**Source:** [VERIFIED: zread anomalyco/opencode packages/opencode/src/tool/write.ts]

```typescript
export const Parameters = Schema.Struct({
  content: Schema.String,           // "The content to write to the file"
  filePath: Schema.String,          // "The absolute path to the file to write (must be absolute, not relative)"
})
```

**Detection in `tool.execute.before`:** `output.args.filePath` contains the target file path.

### Edit Tool Input Shape

**Source:** [VERIFIED: zread anomalyco/opencode packages/opencode/src/tool/edit.ts]

```typescript
export const Parameters = Schema.Struct({
  filePath: Schema.String,          // "The absolute path to the file to modify"
  oldString: Schema.String,         // "The text to replace"
  newString: Schema.String,         // "The text to replace it with (must be different from oldString)"
  replaceAll: Schema.optional(Schema.Boolean), // "Replace all occurrences of oldString (default false)"
})
```

**Detection in `tool.execute.before`:** `output.args.filePath` contains the target file path.

### apply_patch Tool Input Shape

**Source:** [VERIFIED: zread anomalyco/opencode packages/opencode/src/tool/apply_patch.ts]

```typescript
export const Parameters = Schema.Struct({
  patchText: Schema.String,         // "The full patch text that describes all changes to be made"
})
```

**Detection in `tool.execute.before`:** NO `filePath` field. File paths are embedded in `patchText` as hunks. The tool parses hunks via `Patch.parsePatch(params.patchText)` which extracts `hunk.path` for each hunk.

**Implication for BOOT-09:** Path-specific language reminders cannot use a simple `output.args.filePath` check for `apply_patch`. Options:
1. Parse `patchText` for file paths (adds dependency on patch parsing)
2. Skip path-specific check and inject generic reminder for `apply_patch` (simpler MVP)
3. Rely on Layer 1 (system prompt) for `apply_patch` coverage

## Session Hierarchy

### `parentID` Field

**Source:** [VERIFIED: Repomix anomalyco/opencode + src/shared/session-api.ts]

The `parentID` field on `Session` records is the authoritative indicator of session hierarchy:

| Session Type | `parentID` Value | Detection |
|-------------|------------------|-----------|
| Main (level-0) | `undefined` | `parentID === undefined` (property absent) |
| Child (delegated) | `"ses_<id>"` (parent's session ID) | `typeof parentID === "string"` |

**Existing Code:** The `src/shared/session-api.ts` already has the helpers needed:
- `getParentID(session)` — extracts parentID from a session object (line 204)
- `getEventParentID(event)` — extracts parentID from an event object (line 246)
- `getEventSessionInfo(event)` — extracts `event.properties.info` (line 213)

**Caching Strategy (per D-02):**
1. Add a new observer in `event-observers.ts` that fires on `session.created`
2. In the observer, extract `getEventParentID(event)` — if undefined, session is main
3. Store `isMainSession` boolean in a `Map<string, boolean>`
4. Expose `isMainSession: (sessionId: string) => boolean` via the observer factory
5. Wire into `HookDependencies` via `plugin.ts`

### No Hivemind DelegationManager Involvement

Per D-01, native `task` tool child sessions are managed by OpenCode runtime and are invisible to Hivemind's DelegationManager. The `delegate-task` tool (Hivemind custom tool) creates sessions via DelegationManager, but native `task` does not. Using `parentID` avoids this distinction entirely — both delegation methods set `parentID` on child sessions.

## Schema Design

### `document_paths` Addition

Following the existing schema pattern in `hivemind-configs.schema.ts`:

```typescript
// New field to add inside the z.object({...}).strip() block
document_paths: z.array(z.string()).default([".hivemind/planning/"]),
```

**Pattern details:**
- The schema uses `.strip()` (line 277) — unknown fields are stripped, new field is simply added to the object
- All existing fields have `.default()` values — the new field follows the same pattern
- No migration needed for existing config files — `.strip()` + `.default()` ensures backward compatibility
- The `LEGACY_KEY_MAP` (line 213) maps camelCase to snake_case — add `documentPaths` → `document_paths` mapping if needed
- The `readConfigs()` function (line 333) silently falls back to defaults on missing files — new field inherits default

### Field Consumer Pattern

For the config fields already existing:
- `conversation_language`: consumed by `resolveBehavioralProfile()` → injected as `language.conversation` in behavioral profile
- `documents_and_artifacts_language`: consumed by `resolveBehavioralProfile()` → injected as `language.documents` in behavioral profile
- `document_paths` (to be added): consumed by `system.transform` handler for Layer 1, and `tool.execute.before` handler for Layer 2

## Test Patterns

### Existing Test Pattern: `create-core-hooks.test.ts`

**File:** `tests/hooks/create-core-hooks.test.ts` (796 lines)

**Pattern:** Factory-based test with fake dependencies
```typescript
function createFakeLifecycleManager() {
  return { handleEvent: vi.fn(), replayPendingNotificationsForEvent: vi.fn() }
}

function createFakeBehavioralProfile(): ResolvedBehavioralProfile { /* ... */ }
function createFakeIntake(): IntakeResult { /* ... */ }

function createHivemindConfig(overrides?) {
  return HivemindConfigsSchema.parse({ mode: "expert-advisor", ...overrides })
}

function buildDepsWithConfig(hivemindConfig?) {
  return {
    lifecycleManager: createFakeLifecycleManager() as HookDependencies["lifecycleManager"],
    getIntake: () => createFakeIntake(),
    getBehavioralProfile: () => createFakeBehavioralProfile(),
    hivemindConfig,
  }
}
```

**System transform test pattern:**
```typescript
it("injects language governance block for main sessions", async () => {
  const hooks = createCoreHooks(deps as HookDependencies)
  const output: Record<string, unknown> = { system: [] }
  await hooks["system.transform"]({ sessionID: "ses_test" }, output)
  
  const system = output.system as string[]
  expect(system[0]).toContain("--- Language Governance ---")
  expect(system[0]).toContain("MUST respond in")
})
```

### Existing Test Pattern: `create-tool-guard-hooks.test.ts`

**File:** `tests/hooks/create-tool-guard-hooks.test.ts` (209 lines)

**Pattern:** In-memory state manager factory
```typescript
function createFakeStateManager() {
  const stats = new Map<string, { total: number; byTool: Record<string, number>; ... }>()
  return {
    ensureStats(sessionID: string) { /* ... */ },
    getStats(sessionID: string) { /* ... */ },
    addWarning: vi.fn(),
    hasStats: vi.fn().mockReturnValue(false),
  }
}
```

**Tool before test pattern:**
```typescript
it("injects document language reminder for write tool at document path", async () => {
  const hooks = createToolGuardHooks({ stateManager: fakeStateManager as never })
  const output: Record<string, unknown> = { args: { filePath: "/project/.hivemind/planning/notes.md", content: "..." } }
  
  await hooks["tool.execute.before"](
    { sessionID: "ses_001", tool: "write", callID: "call_001" },
    output
  )
  
  // Verify args were modified
  expect(output.args).toHaveProperty("content")
  expect((output.args as Record<string, string>).content).toContain("LANGUAGE:")
})
```

## Implementation Guidance

### Injection Order Changes

**Current order at `output.system`:**
```
[0] Governance block
[1] Intake context
[2] Behavioral profile
```

**Target order:**
```
[0] Language Governance block (new)
[1] Governance block (shifted, same content)
[2] Intake context
[3] Behavioral profile
```

**Code change in `core-hooks.ts`:** Before the existing governance block push, use `unshift()` instead of `push()` for the language block:

```typescript
"system.transform": async (input, output) => {
  const sessionID = asString(getNestedValue(input, ["sessionID"]))
  if (!sessionID) return

  output.system = Array.isArray(output.system) ? output.system : []

  // BOOT-09: Language governance block (position 0 — BEFORE governance)
  if (deps.hivemindConfig && deps.isMainSession?.(sessionID)) {
    const langBlock = buildLanguageBlock(deps.hivemindConfig)
    ;(output.system as string[]).unshift(langBlock)  // inject at position 0
  }

  // Existing governance block push remains at position after language
  if (deps.hivemindConfig) {
    // ...existing code...
    ;(output.system as string[]).push(governanceBlock)
  }
  // ... rest of existing handler unchanged ...
}
```

### `isMainSession` Wiring

**New observer factory pattern (in `event-observers.ts`):**

```typescript
export function createSessionIsMainObserver(): {
  observer: (input: { event?: unknown }) => Promise<void>
  isMainSession: (sessionId: string) => boolean
} {
  const mainSessionSet = new Set<string>()

  const observer = async ({ event }: { event?: unknown }): Promise<void> => {
    const eventType = asString(getNestedValue(event, ["type"]))
    const sessionId = getEventSessionID(event)
    if (eventType !== "session.created" || !sessionId) return

    const parentID = getEventParentID(event)
    if (!parentID) {
      mainSessionSet.add(sessionId)  // No parentID = main session
    }
  }

  return {
    observer,
    isMainSession: (sessionId: string) => mainSessionSet.has(sessionId),
  }
}
```

### Tool Guard Key Implementation Points

1. **Write tool:** Check `input.tool === "write"`, read `output.args.filePath`, check if ends with `.md` and matches any `document_paths` prefix. If match, prepend language instruction to `output.args.content`.

2. **Edit tool:** Check `input.tool === "edit"`, same path check. Prepend language instruction to `output.args.newString`.

3. **apply_patch:** Check `input.tool === "apply_patch"`. For MVP: inject generic language reminder (no path-specific targeting since paths are embedded in `patchText`). Optionally, skip `apply_patch` tool guard in MVP and rely on Layer 1 system prompt.

### Files to Modify

| File | Change | LOC Impact |
|------|--------|------------|
| `src/schema-kernel/hivemind-configs.schema.ts` | Add `document_paths: z.array(z.string()).default([".hivemind/planning/"])` | +1 line |
| `src/hooks/types.ts` | Add `isMainSession?: (sessionId: string) => boolean` to `HookDependencies` | +1 line |
| `src/hooks/lifecycle/core-hooks.ts` | Add language governance block injection before governance block | ~20 lines |
| `src/hooks/guards/tool-guard-hooks.ts` | Add document language tool guard logic | ~25 lines |
| `src/hooks/observers/event-observers.ts` | Add `createSessionIsMainObserver()` factory | ~20 lines |
| `src/plugin.ts` | Wire `isMainSession` into `deps` | ~3 lines |
| `tests/hooks/create-core-hooks.test.ts` | Add language block injection tests | ~50 lines |
| `tests/hooks/create-tool-guard-hooks.test.ts` | Add tool guard tests | ~40 lines |
| `tests/schema-kernel/` | Add `document_paths` schema test | ~15 lines |

## Sources

### Primary (HIGH confidence)
- **OpenCode Plugin SDK Hooks interface** — [VERIFIED: Repomix anomalyco/opencode packages/plugin/src/index.ts] — Full `Hooks` interface with all hook signatures (lines 33893-33980)
- **Write tool schema** — [VERIFIED: zread anomalyco/opencode packages/opencode/src/tool/write.ts] — Parameters = `{ content, filePath }`
- **Edit tool schema** — [VERIFIED: zread anomalyco/opencode packages/opencode/src/tool/edit.ts] — Parameters = `{ filePath, oldString, newString, replaceAll? }`
- **apply_patch tool schema** — [VERIFIED: zread anomalyco/opencode packages/opencode/src/tool/apply_patch.ts] — Parameters = `{ patchText }`
- **Session + EventSessionCreated types** — [VERIFIED: Repomix anomalyco/opencode] — `parentID?: string` on Session
- **Existing project source** — [VERIFIED: src/ files read] — Full codebase context read

### Secondary (MEDIUM confidence)
- **DeepWiki anomalyco/opencode** — Hook interface descriptions and behavioral semantics
- **Context7 OpenCode Plugins docs** — Plugin hook documentation at opencode.ai/docs/plugins

### Tertiary (LOW confidence)
- None — all claims verified against live source or codebase.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — No new libraries; existing stack already verified
- Architecture: HIGH — Hook injection patterns confirmed via source + SPEC
- Pitfalls: HIGH — All pitfalls verified against actual tool shapes and code patterns

**Research date:** 2026-05-12
**Valid until:** 2026-06-12 (stable project)
