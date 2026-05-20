# Phase 19 Historical Trace: Original Intent Classification

**Date:** 2026-05-21
**Purpose:** Trace every file deleted/modified in Phase 19 (Plans 01-03) back to its original design intent, wiring status, and classification as truly dead vs. intended-but-unwired vs. wired-but-broken.
**Method:** Git history analysis (`--all --follow`), planning doc search (`.planning/` archive, research documents, phase specs), REQUIREMENTS.md cross-reference, and legacy concept catalog mapping.

---

## Overall Classification Summary

| # | File | Action | Classification | Confidence |
|---|------|--------|---------------|------------|
| 1 | `permission.schema.ts` | DELETED | **CORRECT_DELETION** — prototype, superseded by `shared/types.ts` | HIGH |
| 2 | `skill-metadata.schema.ts` | PRESERVED | **PRESERVED** — 3 runtime consumers exist | HIGH |
| 3 | `tool-definition.schema.ts` | MIGRATED → `tool.schema.ts` | **CORRECT_DELETION** (content preserved) | HIGH |
| 4 | `session-classification-hook.ts` | DELETED | **INTENDED_BUT_UNWIRED** — spec existed (CP-ST-05), function was real, never wired to plugin.ts | HIGH |
| 5 | `schema-normalizer.ts` | DELETED | **INTENDED_BUT_UNWIRED** — REQ-ST-12 was real requirement, part of unwired session-tracker | HIGH |
| 6 | `delegation-packet.ts` | DELETED | **INTENDED_BUT_UNWIRED** — P2 priority, PENDING status, never wired (delegation compiler gap) | HIGH |
| 7 | `prompt-packet/index.ts` | DELETED | **CORRECT_DELETION** — zero-consumer barrel | HIGH |
| 8 | `concurrency-key.ts` | DELETED (inlined) | **CORRECT_DELETION** — 1:1 wrapper, correctly inlined | HIGH |
| 9 | `resolve-behavioral-profile.ts` deprecated methods | DELETED | **CORRECT_DELETION** — already `@deprecated` no-ops | HIGH |
| 10 | `core-hooks.ts messages.transform` | DELETED | **CORRECT_DELETION** — no-op shell from Phase 35 | HIGH |

---

## Detailed Per-Item Analysis

---

### Item 1: permission.schema.ts — DELETED

| Field | Value |
|-------|-------|
| **Original path** | `src/schema-kernel/permission.schema.ts` |
| **Creation commit** | `cf27bebf` (2026-04-25) — "phase 16.5 cycle 1: add Zod schema foundation for all OpenCode primitives" |
| **Last modification** | `b324e91c` (2026-04-25) — "feat(16.5-06): implement resilient schemas with dual-mode validation" — softened PermissionKeySchema from `z.enum(14)` to `z.string().min(1)` |
| **Deleted in** | `07be038e` (2026-05-21) — Phase 19-01 |
| **LOC** | 168 |

**Original Intent:**
The file was one of 7 Zod schema files created in phase 16.5 to define the OpenCode permission model:
- `PermissionActionSchema` — 3-state enum: `allow`, `ask`, `deny` (note: NOT `auto` — the runtime type had diverged)
- `PermissionKeySchema` — 14 recognized OpenCode permission keys (read, edit, glob, grep, bash, task, skill, etc.)
- `PermissionRuleSchema` — structured permission rules (permission + action + pattern)
- `PatternBasedPermissionSchema` — glob-pattern → action mapping per key
- `PermissionRulesetSchema` — composite ruleset with allow/deny lists

**Legacy Origin:**
The legacy concept catalog maps this to the **Z2 (Config Schema)** lineage and **H3 (Tool Gate Hook)** — role-based tool access with tier classification (universal/workflow/deterministic). The gap matrix (2026-05-05) lists REGISTRY-02 ("Permission matrix with runtime enforcement") as **MISSING**.

**Wiring Status:**
- Re-exported from `schema-kernel/index.ts` barrel
- **ZERO** runtime consumers beyond the barrel — `rg "PermissionActionSchema|PermissionRuleSchema|PermissionRulesetSchema" src/ --type ts` (excluding schema file and barrel) → **zero hits**
- Runtime `PermissionAction`/`PermissionRule` types live in `src/shared/types.ts` independently — completely separate definition
- The enum bug (`["allow", "ask", "ask"]` instead of `["allow", "ask", "auto"]`) existed but was never triggered because nothing consumed the schemas

**Classification: CORRECT_DELETION**
- The schemas were a prototype never wired to runtime enforcement
- The runtime types had already evolved independently in `shared/types.ts`
- **Debt note:** REGISTRY-02 (permission matrix with runtime enforcement) remains **MISSING** in REQUIREMENTS.md. If this feature is implemented in the future, it should build from `shared/types.ts` runtime types, not from a resurrected schema file.

**Requirement reference:** REGISTRY-02 (MISSING)

**Bridging info:** `shared/types.ts` lines 29-35 define `PermissionAction`, `PermissionRule` types. These are the living runtime types. `runtime-pressure/authority-matrix.ts` has the tool authority matrix. `category-gates.ts` has partial gate decisions. Any future permission enforcement should connect these.

---

### Item 2: skill-metadata.schema.ts — PRESERVED (NOT DELETED)

| Field | Value |
|-------|-------|
| **Original path** | `src/schema-kernel/skill-metadata.schema.ts` |
| **Creation commit** | `cf27bebf` (2026-04-25) — same phase 16.5 schema foundation |
| **Last modification** | `7841f870` (2026-04-28) — "feat(50): make OpenCode primitive restart validation passable" |

**Original Intent:**
Defined Zod schemas for the OpenCode skill ecosystem:
- `SkillNameSchema` — kebab-case validation (1-64 chars, hyphen-separated)
- `SkillFrontmatterSchema` — YAML frontmatter fields (name, description, license, compatibility, metadata)
- `SkillFileSchema` — complete SKILL.md representation (frontmatter + body + directoryName + skillPath), with `.refine()` ensuring frontmatter.name matches directoryName
- `SkillDiscoveryLocationSchema` — ordered discovery: project, global, claude, claude-global

**Wiring Status:**
- Initially flagged as "dead" in Phase 19 research (same as permission.schema.ts)
- BUT discovered to have **3 active runtime consumers**:
  1. `features/bootstrap/compiler.ts` — imports `SkillFrontmatterSchema`, `SkillFile`
  2. `features/bootstrap/cross-primitive-validator.ts` — imports `SkillFile` type
  3. `features/bootstrap/primitive-loader.ts` — imports `SkillFile` type
- All three import through the `schema-kernel/index.ts` barrel

**Classification: CORRECTLY PRESERVED**
- The Phase 19 execution correctly detected this deviation and restored the file and its barrel re-exports
- Deviation was caught at execution time (not planning time), documented in 19-SUMMARY.md

**Legacy origin:** Z9 (Skill Registry Schema) — progressive disclosure levels (L0-L3), skill bundles, skill status tracking. This legacy concept is still partially missing.

---

### Item 3: tool-definition.schema.ts — MIGRATED to tool.schema.ts

| Field | Value |
|-------|-------|
| **Original path** | `src/schema-kernel/tool-definition.schema.ts` |
| **Creation commit** | `cf27bebf` (2026-04-25) — phase 16.5 |
| **Content fate** | Content COPIED to `src/schema-kernel/tool.schema.ts` |
| **Barrel re-export** | Updated from `"./tool-definition.schema.js"` to `"./tool.schema.js"` |

**Original Intent:**
Defined `ToolNameSchema`, `ToolDefinitionSchema`, and `ToolFileSchema` — the schema definition for custom OpenCode tools. The lenient variants (`ToolDefinitionSchemaLenient`, `ToolFileSchemaLenient`) strip unknown fields for resilient loading.

**Wiring Status:**
- Had active consumers through the barrel:
  - `features/bootstrap/primitive-loader.ts` — imports `ToolFile` type
  - `features/bootstrap/cross-primitive-validator.ts` — imports `ToolFile` type
  - `tests/schema-kernel/opencode-config.schemas.test.ts` — directly imports schemas
- These consumers remain unchanged because the content was migrated to a surviving file

**Classification: CORRECT_DELETION (with content preserved)**
- Content migrated to `tool.schema.ts` with JSDoc attribution
- All imports preserved through the barrel
- Net zero change for consumers

---

### Item 4: session-classification-hook.ts — DELETED

| Field | Value |
|-------|-------|
| **Original path** | `src/features/session-tracker/hooks/session-classification-hook.ts` |
| **Creation commit** | `6920449c` (2026-05-15) — "feat(CP-ST-05-01): BEFORE-THE-FACT classification + immediate .json write" |
| **Deletion commit** | `27bb6228` (2026-05-21) — Phase 19-02 |
| **LOC** | 76 |
| **Spec** | CP-ST-05-SPEC.md requirement R-CP05-01 |

**Original Intent:**
Create a PreToolUse hook that intercepts Task tool dispatches and records classification intent in a `PendingDispatchRegistry` **BEFORE** the child session is created. This was designed to fix a critical race condition:

> *"Task tool fires → Session created → SDK parentID chưa có sẵn (race với task tool completion) → hierarchyIndex chưa được populate → Cả 3 gates FAIL → Child bị classify là MAIN → MẤT VĨNH VIỄN session history"*

The function exported `createSessionClassificationHook(deps)` which:
- Checked if `toolName === "Task"`
- Recorded `subagentType`, `description`, and `delegationDepth` in the `pendingRegistry`
- Used `Date.now()` + random suffix for callID
- Marked as best-effort with try/catch/logWarn

**Wiring Status:**
- The hook was **wired to other session-tracker modules**: it consumed `PendingDispatchRegistry` from `persistence/pending-dispatch-registry.ts`, and `event-capture.ts` was updated to check the registry
- Tests existed: `session-classification-hook.test.ts` (114 LOC), `event-capture-classification-first.test.ts` (154 LOC)
- **BUT the entire session-tracker feature was NEVER wired to the plugin composition root** (`plugin.ts`)
- The CP-ST-05 phase had 3 plans: only CP-ST-05-01 was executed. Plans 02-03 were never implemented
- The spec requirement R-CP05-01 was real and well-documented (Vietnamese comments in the spec show deep domain understanding)

**Classification: INTENDED_BUT_UNWIRED**
- This is NOT dead code in the sense of "nobody ever intended to use it"
- It was a critical fix for a session data loss bug (CP-ST-05 was triggered by a user report of lost session journeys)
- The spec was real, the architecture was designed, the implementation was partially wired to other session-tracker modules
- The root problem: session-tracker as a whole was never wired to `plugin.ts`

**Debt/Gap:**
The underlying requirement remains MISSING:
- **f-04c** (Workflow router / intent classification) — REQUIREMENTS.md shows this as MISSING
- **S4 (Session Intent Classifier)** — legacy concept catalog lists this as one of the top 5 missing patterns
- `session-entry/purpose-classifier.ts` (195 LOC) is also unwired in the same session-entry/ directory
- If session classification and routing are ever implemented, this BEFORE-THE-FACT classification pattern should be revisited

**How to rebuild (if needed):**
1. The `PendingDispatchRegistry` class still exists in `src/features/session-tracker/persistence/`
2. `event-capture.ts` still has Gate 3 logic for checking the registry
3. BUT the PreToolUse hook registration needs to happen in `plugin.ts` via OpenCode's `hooks.PreToolUse` SDK surface
4. The race condition analysis in CP-ST-05-CONTEXT.md (Vietnamese documentation) is still valid and should be required reading

---

### Item 5: schema-normalizer.ts — DELETED

| Field | Value |
|-------|-------|
| **Original path** | `src/features/session-tracker/transform/schema-normalizer.ts` |
| **Creation commit** | `dccf127a` (2026-05-11) — "feat(session-tracker): add capture handlers and transforms with TDD" |
| **Deletion commit** | `a2413a63` (2026-05-21) — Phase 19-02 |
| **LOC** | 155 |
| **Requirement** | REQ-ST-12 |

**Original Intent:**
Convert SDK snake_case field names to camelCase for internal consumption. The JSDoc explains:
- `toCamelCase("session_id")` → `"sessionId"`
- `toCamelCase("parent_session_id")` → `"parentSessionId"`
- `toCamelCase("sessionID")` → `"sessionId"` (normalizes PascalCase mix too)
- `normalizeSessionRecord()` — fills in defaults for missing required fields
- `normalizeChildSessionRecord()` — same for child records

Also handled complex edge cases like `delegated_by` → `delegatedBy` with `model` field.

**Wiring Status:**
- Consumed by `event-capture.ts` in the session-tracker system
- The 11 `schema-normalizer.test.ts` tests passed
- BUT the same problem as session-classification-hook: the entire session-tracker was never wired to plugin.ts

**Classification: INTENDED_BUT_UNWIRED**
- REQ-ST-12 was a legitimate requirement: "SchemaNormalizer converts SDK snake_case to camelCase"
- The code worked and was tested (11 tests)
- It was consumed by event-capture.ts which was also unwired from the runtime
- The SDK integration pattern (snake_case → camelCase normalization) is still needed for any proper session tracking

**Debt/Gap:**
If session-tracker is ever wired:
1. A schema normalizer will be needed again
2. The pattern (`toCamelCase`, recursive key normalization, default value filling) is well-understood
3. The deleted code can serve as a reference implementation
4. Alternatively, this could be replaced with a lightweight utility rather than a full 155 LOC module

---

### Item 6: delegation-packet.ts — DELETED

| Field | Value |
|-------|-------|
| **Original path** | `src/features/prompt-packet/delegation-packet.ts` |
| **Creation commit** | `d9a7847f` (2026-05-03) — "commit for new dev" (earliest git trace) |
| **Deletion commit** | `5d333c06` (2026-05-21) — Phase 19-02 |
| **LOC** | 73 |
| **Phase origin** | Phase 70 (prompt-packet-compiler), P2 priority, PENDING status |

**Original Intent:**
From the archived Phase 70 context document:
> *"Implement the prompt packet compiler that produces hivemind-delegation-packets for sub-sessions with compaction-safe context preservation."*

Requirement PPC-02:
> *"hivemind-delegation-packet for sub-sessions: adds parent_session_id, delegation_inheritance, todo_authority, return_contract"*

The module was designed to build structured delegation instructions for sub-session agents, including:
- `DelegationPacket` type with constraints
- `DelegationEvidenceItem`, `DelegationScope`, `DelegationFailurePolicy`
- Compilation of agent-work-contracts into delegation instructions

**Wiring Status:**
- **ZERO** runtime consumers — not imported by any source file beyond its own barrel (`index.ts`)
- The barrel (`index.ts`) ALSO had zero consumers — `session-hooks.ts` imports from `compaction-preservation.ts` and `kernel-packet.ts` **directly**
- The GAP-MATRIX (2026-05-05) explicitly listed prompt-packet as DEAD/UNWIRED:
  > *"Only compaction-preservation.ts is imported. Zero plugin.ts or tool consumers."*
  > *"F-09a (long-haul compaction survival) is completely blocked"*

**Classification: INTENDED_BUT_UNWIRED**
- This was NOT dead code from the start — it was part of a planned feature (Phase 70, prompt-packet compiler)
- The feature was assigned P2 priority but never advanced beyond PENDING status
- The prompt-packet concept was identified in the legacy concept catalog as **Z12 (Delegation Packet Schema)** — one of 12 schema concepts
- The underlying requirement (delegation packet compilation for agent-work-contracts integration) was real

**Debt/Gap:**
F-09a (long-haul compaction survival) is still MISSING per the REQUIREMENTS.md:
> *"330 LOC of dead code ready to wire. Without this, all sessions lose context on compaction."*

The surviving files (`compaction-preservation.ts` and `kernel-packet.ts`) provide the compaction-safe context preservation foundation. The delegation-packet.ts file was the "compilation" layer that would connect agent-work-contracts to prompt packets. This gap remains open.

**How to rebuild (if needed):**
1. Design delegation packet schema in `shared/types.ts`
2. Connect `agent-work-contracts/operations.ts` to the packet compiler
3. Hook into session creation lifecycle to compile packets
4. The surviving `kernel-packet.ts` provides the main-session packet pattern

---

### Item 7: prompt-packet/index.ts — DELETED

| Field | Value |
|-------|-------|
| **Original path** | `src/features/prompt-packet/index.ts` |
| **Creation** | Same era as delegation-packet.ts |
| **Deletion** | Phase 19-02 |

**Original Intent:**
Barrel file re-exporting all prompt-packet modules: `compaction-preservation.ts`, `kernel-packet.ts`, `delegation-packet.ts`. Standard pattern for module surface management.

**Wiring Status:**
- **ZERO** consumers — `session-hooks.ts` imports directly from `compaction-preservation.js` and `kernel-packet.js` (sub-module level)
- This barrel was the only thing making the module appear "alive" — without it, the dead modules are exposed

**Classification: CORRECT_DELETION**
- Barrel with zero consumers
- The surviving files still work through direct imports

---

### Item 8: concurrency-key.ts — DELETED (inlined)

| Field | Value |
|-------|-------|
| **Original path** | `src/coordination/spawner/concurrency-key.ts` |
| **Creation commit** | `619797d6` (2026-05-02) — "feat(16-background-delegation-revamp-pty-integration-rebuild-backgro-03): add canonical spawner key helpers" |
| **Deletion commit** | `9cadbb2b` (2026-05-21) — Phase 19-03 |
| **LOC** | 12 |
| **Consumer** | `manager-runtime.ts` — single import at line 16 |

**Original content (before deletion):**
```typescript
import { buildDelegationQueueKey } from "../concurrency/queue.js"

type DelegationConcurrencyKeyArgs = {
  provider?: string
  model?: string
  agent?: string
}

// Runtime adoption of this shared key flow happens in plan 16-04.
export function resolveDelegationConcurrencyKey(args: DelegationConcurrencyKeyArgs): string {
  return buildDelegationQueueKey(args)
}
```

**Original Intent:**
A transitional wrapper. The comment explicitly says: "Runtime adoption of this shared key flow happens in plan 16-04." It was created as a thin abstraction layer between `manager-runtime.ts` and `concurrency/queue.ts` during the delegation revamp. Once the revamp was complete, the abstraction was no longer needed.

**Wiring Status:**
- WIRED — actively consumed by `manager-runtime.ts`
- Imported by test file (`delegation-manager.test.ts`)

**Classification: CORRECT_DELETION (with inlining)**
- The wrapper was a 1:1 pass-through with zero added logic
- The delegation revamp (plan 16-04) is complete — the abstraction is no longer transitional
- The one caller in `manager-runtime.ts` now directly calls `buildDelegationQueueKey()`
- Test imports updated to remove the module dependency

---

### Item 9: resolve-behavioral-profile.ts deprecated methods — DELETED

| Field | Value |
|-------|-------|
| **File** | `src/routing/behavioral-profile/resolve-behavioral-profile.ts` |
| **Deprecated methods** | `invalidateBehavioralProfile(_sessionId)` and `clearAllBehavioralProfiles()` |
| **Created in** | `2d32a193` (2026-05-06) — "feat(CA-02-01): add behavioral profile core module" |
| **Made no-op in** | `c58c5e1b` (2026-05-12) — "fix(BOOT-09): remove stale behavioral profile cache" |
| **Deleted in** | `169891f9` (2026-05-21) — Phase 19-03 |

**Original Intent:**
When the behavioral profile was first implemented in CA-02-01, it cached per-session profiling results. `invalidateBehavioralProfile` would clear a specific session's cache entry, and `clearAllBehavioralProfiles` would reset the entire cache.

**Why they became no-ops:**
BOOT-09 changed behavioral profile resolution to read fresh config from disk on every call (eliminating the caching layer). As the JSDoc explains:
> *"The behavioral profile no longer caches per-session results. Each resolution reads fresh config from disk. This function is a no-op, kept for backward compatibility."*

**Wiring Status:**
- Were marked `@deprecated` in JSDoc
- Were re-exported from `behavioral-profile/index.ts` barrel
- Had tests (15+ references in test file)
- The barrel itself had **zero runtime consumers** — all imports go to individual files directly

**Classification: CORRECT_DELETION**
- Already `@deprecated` with clear documentation
- No-ops that existed only for backward compatibility
- No runtime behavior change from deletion

---

### Item 10: core-hooks.ts messages.transform — DELETED

| Field | Value |
|-------|-------|
| **File** | `src/hooks/lifecycle/core-hooks.ts` |
| **Hook entry** | `"messages.transform"` in the `CoreHooks` interface + factory return |
| **Created in** | Early plugin architecture (before Phase 35) |
| **Stripped in** | Phase 35 (actual messages-transform.ts module deleted) |
| **Interface stub removed in** | `76751785` (2026-05-21) — Phase 19-03 |

**Original Intent:**
The `messages.transform` hook was part of the original hook architecture (see core-hooks.ts file-level JSDoc: "Produces the event, messages.transform, and shell.env hooks"). It was designed to transform message content between the agent and the LLM — potentially injecting clarification prompts, intent capture, or context anchoring.

The legacy Legacy Concept Catalog confirms this with **H6 (Messages Transform Hook)**:
> *"Transforms outgoing messages to inject clarification prompts, intent capture, and context anchoring."*

**Why it became a no-op:**
Phase 35 deleted the actual `messages-transform.ts` module (92 LOC) as dead code "not wired." The commit said:
> *"phase-35: event-tracker fix + dead code cleanup — restores green build"*
> *"Delete src/hooks/messages-transform.ts (92 LOC dead code, not wired)"*

After Phase 35, only a no-op shell remained:
```typescript
"messages.transform": async (input, output) => {
  classifyHookEffect("messages.transform")
  output.messages = input.messages ?? []
}
```
This simply echoed messages through without any transformation.

**Wiring Status:**
- The interface entry existed but never transformed anything after Phase 35
- `system.transform` was also noted as a duplicate of `experimental.chat.system.transform` (SDK only dispatches the latter)
- Decision: Option B (keep `system.transform` for test compatibility with deprecation note)

**Classification: CORRECT_DELETION**
- No-op shell from Phase 35
- The underlying messages transformation concept (H6) was never wired to the runtime
- The `system.transform` duplicate was correctly kept for test backward compatibility

**Debt note:** If messages transformation is ever needed (for intent injection, context anchoring, etc.), it should:
1. Be implemented as a new module (not resurrecting the old stub)
2. Use the `experimental.chat.system.transform` SDK hook (which the SDK actually dispatches)
3. Follow the injection orchestration pattern from the legacy C3 concept

---

## Cross-Cutting Observations

### Pattern: Unwired Session-Tracker Subsystem

Items 4 and 5 (`session-classification-hook.ts` and `schema-normalizer.ts`) are part of a larger unwired subsystem: the **session-tracker feature** (Feature 3 / CP-ST-* series). The GAP-MATRIX from 2026-05-05 identified this:

| Unwired Module | LOC | Gap Description |
|---------------|-----|-----------------|
| `session-entry/` (5 files) | 644 | Intake pipeline dead — not wired to plugin.ts |
| `session-tracker/` (partial) | ~200 | Never connected to runtime |
| `prompt-packet/` (partial) | 330 | Only compaction-preservation + kernel-packet survive |

**Total unwired session infrastructure: ~1,174 LOC** — all deleted in Phase 19 or still sitting unwired.

### Pattern: Abandoned Phase 70 (Prompt Packet Compiler)

Item 6 (`delegation-packet.ts`) traces back to Phase 70 (P2 priority, PENDING status). The prompt-packet compiler was designed to produce:
- `hivemind-kernel-packet` for main sessions (33 normalized fields)
- `hivemind-delegation-packet` for sub-sessions (adds parent_session_id, delegation_inheritance, return_contract)
- Compaction-safe context preservation

Only the "core" layer (kernel-packet.ts + compaction-preservation.ts) was partially implemented. The "compiler" layer was never built. Phase 70 depended on Phase 60 (session-entry intake) which was also never completed.

### Requirement Gap Map

| Deleted File | Maps To Requirement | Status in REQUIREMENTS.md |
|-------------|-------------------|--------------------------|
| permission.schema.ts | REGISTRY-02 (permission matrix) | **MISSING** |
| session-classification-hook.ts | f-04c (workflow router) / S4 (Session Intent Classifier) | **MISSING** |
| schema-normalizer.ts | REQ-ST-12 (SDK schema normalization) | Partial / Unwired |
| delegation-packet.ts | F-09a (long-haul compaction survival) | **MISSING** — only compaction-preservation survives |
| concurrency-key.ts | F-06 (delegation revamp) | **PARTIAL** — delegation infrastructure is mature |

---

## Threat Assessment

### Are any of these deletions actually risky to restore?

| Item | Risk of Re-introduction |
|------|------------------------|
| permission.schema.ts | **LOW** — would need to be rewritten against `shared/types.ts` runtime types |
| session-classification-hook.ts | **MEDIUM** — the BEFORE-THE-FACT classification pattern is architecturally sound but needs full session-tracker wiring |
| schema-normalizer.ts | **LOW** — 155 LOC is easily recreated; the snake_case→camelCase pattern is straightforward |
| delegation-packet.ts | **MEDIUM** — the delegation packet schema design is correct but the compiler layer was never built; would need re-architecting anyway |

### Are any Phase 19 decisions that should be reversed?

**None.** All 1-10 classifications hold up under historical analysis:
- Items classified as CORRECT_DELETION were genuinely dead or properly inlined/migrated
- Items classified as INTENDED_BUT_UNWIRED were correct to delete in the context of non-destructive remediation — they were not wired, they were not going to be wired in the current phase, and their underlying requirements remain gaps to be filled separately
- The preserved items (skill-metadata.schema.ts, compaction-preservation.ts, kernel-packet.ts) were correctly kept

---

## Research Sources

### Git Commit Analysis
- All git log commands used `--all --follow --oneline` for full history coverage
- Commit messages read for original intent, creator phase, and rationale
- File content at creation analyzed via `git show <commit>:<path>`

### Planning Documents
- `.planning/REQUIREMENTS.md` — requirement status mapping
- `.planning/PROJECT.md` — project context and active items
- `.planning/phases/19-non-destructive-remediation/19-RESEARCH.md` — Phase 19 dead code research
- `.planning/phases/CP-ST-05-session-data-loss-investigation/CP-ST-05-SPEC.md` — session classification spec
- `.planning/phases/CP-ST-05-session-data-loss-investigation/CP-ST-05-CONTEXT.md` — session data loss context
- `.planning/archive/2026-05-07/workstreams/milestone/phases/70-prompt-packet-compiler/CONTEXT.md` — prompt-packet compiler plan

### Research Archives
- `.planning/archive/2026-05-07/research/GAP-MATRIX-2026-05-05.md` — feature gap analysis (lists prompt-packet as DEAD, session-entry as UNWIRED)
- `.planning/archive/2026-05-07/research/legacy-concept-catalog-2026-05-05.md` — 84 legacy concepts mapped (Z12 delegation-packet schema, S4 session intent classifier, H6 messages transform, H3 tool gate, Z2 config schema)

### Code Evidence
- Git show of each file at creation/last modification
- `rg` import analysis for wiring status
- Barrel re-export verification
- Test file dependency analysis
