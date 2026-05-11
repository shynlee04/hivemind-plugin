# Phase BOOT-09: MVP Config Schema + Entry Init Verification — Context

**Gathered:** 2026-05-12
**Status:** Ready for planning

<domain>
## Phase Boundary

BOOT-09 delivers runtime enforcement of two config fields — `conversation_language` and `documents_and_artifacts_language` — which are currently decorative metadata only. Enforcement uses a two-layer approach: (1) system prompt injection via `system.transform` hook, and (2) tool guard enforcement via `tool.execute.before` for file-writing tools at configured document paths.

</domain>

<spec_lock>
## Requirements (locked via SPEC.md)

**3 requirements are locked.** See `BOOT-09-SPEC.md` for full requirements, boundaries, and acceptance criteria.

Downstream agents MUST read `BOOT-09-SPEC.md` before planning or implementing. Requirements are not duplicated here.

**In scope (from SPEC.md):**
- `conversation_language` → imperative instruction injected via `system.transform` hook — main sessions only
- `documents_and_artifacts_language` → language instruction for document writing at configured paths (system prompt + tool guard)
- `document_paths` schema field (`z.array(z.string()).default([".hivemind/planning/"])`) in HivemindConfigsSchema
- Child session exclusion logic via OpenCode native `parentID` (cached at session entry) — NOT via DelegationManager
- Language block injected at `output.system[0]` before governance block
- Tool guard layer: `tool.execute.before` language reminder for Write/Edit/apply_patch at `document_paths`
- Integration with existing `system.transform` handler and `tool.execute.before` hook

**Out of scope (from SPEC.md):**
- Mode enforcement (`delegationMode`, `guardrailLevel`, `toolAccessPattern`, `skillFilter`) — deferred to WS-4
- `user_expert_level` enforcement — deferred to future phase
- Translation services or NLU language detection — language enforcement is prompt-level, not ML-level
- Output content validation (verifying agent actually complied) — enforcement is via instruction, not post-hoc validation
- All other config fields (parallelization, atomic_commit, workflow toggles, delegation_systems) — unchanged
- Session tracker or event tracker integration — handled by Phase 12 team
- Runtime policy changes — existing policy handling is unchanged

</spec_lock>

<decisions>
## Implementation Decisions

### 1. Child Session Detection

- **D-01:** Child session detection uses OpenCode's native `parentID` field on session records, NOT Hivemind's `DelegationManager.delegationsBySession`. Native `task` tool child sessions are managed by OpenCode runtime and are invisible to Hivemind's delegation tracking.
- **D-02:** Detection mechanism: cache the `isMainSession` boolean on `session.created` event by checking if the session has a `parentID`. The `system.transform` hook reads from the cache — no per-hook SDK calls.
- **D-03:** A session is "main" if it has NO `parentID` (OpenCode's native flag). All child sessions (any delegation depth) have a `parentID` set by the `task` tool, so `parentID === null/undefined` correctly identifies only level-0 sessions.
- **D-04:** The cached `isMainSession` function is injected via `HookDependencies` (matching existing `getBehavioralProfile` pattern in `plugin.ts:112`).

### 2. Language Block Format & Position

- **D-05:** Language block is injected at `output.system[0]` — **BEFORE** the existing governance block. This positions the language frame first, making it the most visible context.
- **D-06:** The existing governance block format is LOCKED (`buildGovernanceBlock()` in `governance-block.ts`) and must NOT be modified. The language instruction is a separate block, not a modification of the existing governance instruction line.
- **D-07:** Language block uses strong framing with:
  - Header: `--- Language Governance ---`
  - Urgency: `CRITICAL:` prefix
  - Imperative: `"You MUST respond in LANGUAGE."`
  - Override: `"Even if the user writes in another language, you MUST override and respond in LANGUAGE."`

### 3. Document Paths Schema

- **D-08:** The `document_paths` config field is a flat string array: `z.array(z.string()).default([".hivemind/planning/"])`
- **D-09:** Schema accepts any path relative to project root. Default is only `[".hivemind/planning/"]`. Users can expand via `configs.json`.
- **D-10:** Paths support recursive subdirectory globbing.

### 4. Document Language Enforcement

- **D-11:** Two-layer enforcement:
  - **Layer 1 (System prompt):** Document language instruction is included in the same `--- Language Governance ---` block (combined with conversation language). References specific paths: "When writing .md files under configured document paths (e.g., .hivemind/planning/), you MUST write in LANGUAGE."
  - **Layer 2 (Tool guard):** `tool.execute.before` hook detects when Write/Edit/apply_patch targets a `.md` file under `document_paths`, injects a path-specific language reminder.
- **D-12:** The tool guard is NOT content validation — it's a pre-execution instruction reminder (per SPEC: "enforcement is via instruction, not post-hoc validation").

### the agent's Discretion
- Exact wording of the language block (must satisfy: imperative "MUST", override "even if user writes in other language", document paths reference)
- Cache implementation detail for `isMainSession` (Map vs WeakMap vs other)
- Tool guard reminder exact text injected in `tool.execute.before`

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase SPEC (locked requirements)
- `.planning/phases/BOOT-09-mvp-config-schema-entry-init/BOOT-09-SPEC.md` — Locked requirements, acceptance criteria, boundaries, constraints (MUST read)

### Prior BOOT Phase Context
- `.planning/phases/BOOT-08-agent-skill-integration/BOOT-08-CONTEXT.md` — BOOT-08 governance constitution context
- `.planning/phases/BOOT-02-cli-framework-entry-point/BOOT-02-CONTEXT.md` — BOOT-02 init wizard context (D-02: language fields already wired in init)

### Config Schema
- `src/schema-kernel/hivemind-configs.schema.ts` — Current schema with `conversation_language` and `documents_and_artifacts_language` fields (lines 267-268); `document_paths` to be added
- `.planning/config/hivemind-config-contract-2026-05-07.md` — Config contract, field consumers, schema version 2.0.0

### Hook Implementation
- `src/hooks/lifecycle/core-hooks.ts` — `system.transform` handler (lines 69-134), injection point for language governance block
- `src/hooks/guards/governance-block.ts` — Existing governance block builder (LOCKED format — must not modify)
- `src/hooks/guards/tool-guard-hooks.ts` — `tool.execute.before` handler (lines 66-111), injection point for document language tool guard
- `src/plugin.ts` — HookDependencies composition (line 112), tool guard registration (line 164)

### Session Hierarchy (OpenCode native)
- OpenCode session `parentID` field — used for child session detection. Main sessions have `parentID: null/undefined`, child/delegated sessions have `parentID` set by `TaskTool.execute` via `sessions.create({ parentID: ctx.sessionID })`

### Project State
- `.planning/STATE.md` — Project state, current phase status
- `.planning/ROADMAP.md` — BOOT workstream, evidence level requirements
- `.planning/PROJECT.md` — Project overview, architecture decisions

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`src/hooks/lifecycle/core-hooks.ts:69-134`** — `system.transform` handler. Currently injects governance block (pos 0), intake context, and behavioral profile. Language block will be injected at `output.system[0]` before governance block.
- **`src/hooks/guards/tool-guard-hooks.ts:66-111`** — `tool.execute.before` handler. Currently enforces circuit breaker and tool budget. Document language reminder will be added here.
- **`src/hooks/guards/governance-block.ts`** — `buildGovernanceBlock()` produces governance string. LOCKED — must NOT modify.
- **`src/schema-kernel/hivemind-configs.schema.ts:265-277`** — `HivemindConfigsSchema`. `document_paths` field to be added. Uses `.strip()` for forward compatibility.
- **`src/plugin.ts:112`** — `deps` object where `isMainSession` function should be injected.

### Established Patterns
- **HookDependencies injection:** Dependencies injected via `deps` object in `plugin.ts:112`. `getBehavioralProfile`, `getIntake`, `hivemindConfig` are existing examples. `isMainSession` follows the same pattern.
- **CQRS boundaries:** Hooks are read-side — they inject instructions but do not perform durable writes.
- **Module cap:** 500 LOC per file. `core-hooks.ts` at 166 LOC, `tool-guard-hooks.ts` at 156 LOC — both have room for BOOT-09 changes.

### Integration Points
- **`system.transform` handler** (`core-hooks.ts:69`): Add language governance block injection BEFORE the existing governance block push (line 84).
- **`tool.execute.before` handler** (`tool-guard-hooks.ts:66`): Add file path check and language reminder injection.
- **`HivemindConfigsSchema`** (`hivemind-configs.schema.ts:265`): Add `document_paths: z.array(z.string()).default([".hivemind/planning/"])`.
- **HookDependencies type** (`src/hooks/types.ts` or `core-hooks.ts`): Add `isMainSession: (sessionId: string) => boolean` to the deps interface.

</code_context>

<specifics>
## Specific Ideas

- The Language Governance block injection must handle the edge case where `output.system` is either `string[]` or `unknown` (current code at line 77-78 casts it).
- The `isMainSession` cache should be populated from the `session.created` hook (via `event` observer with event type `"session.created"` or equivalent).
- OpenCode file-writing tools: `Write` (`{ filePath, content }`), `Edit` (`{ filePath, oldString, newString }`), `apply_patch` (`{ patchText }` with embedded paths). All governed by `edit` permission.
- Document language tool guard: check `tool.execute.before` input for tool name and args path; if tool is write/edit/apply_patch and path matches `document_paths` pattern, inject reminder.

</specifics>

<deferred>
## Deferred Ideas

- **Per-path or per-document language override** — Allowing different languages for different document paths. Deferred per SPEC: "must at minimum have global enforcement."
- **`user_expert_level` runtime enforcement** — Currently decorative like language. Deferred to future phase.
- **Mode/delegation/tool/skill enforcement (WS-4)** — Deferred to WS-4 workstream.

</deferred>

---

*Phase: BOOT-09-mvp-config-schema-entry-init*
*Context gathered: 2026-05-12*
