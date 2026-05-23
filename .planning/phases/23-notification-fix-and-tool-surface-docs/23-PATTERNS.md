# Phase 23: Notification Fix + Tool Surface Docs — Pattern Map

**Mapped:** 2026-05-23
**Files analyzed:** 4 source edits/creates + 16 skills (14 rewrites + 2 new)
**Analogs found:** 16/20 (80%)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/coordination/completion/notification-handler.ts` | utility | event-driven | N/A (self-edit) | exact |
| `src/shared/session-api.ts` | utility | request-response | N/A (self-edit) | exact |
| `tests/lib/coordination/completion/notification-handler.test.ts` | test | unit | `tests/lib/coordination/completion/detector-v2.test.ts` | exact |
| `.opencode/skills/hm-l3-tool-surface-documentation/SKILL.md` | skill | reference | `.opencode/skills/hm-l3-tool-capability-matrix/SKILL.md` | role-match |
| `.opencode/skills/hm-l3-injection-delivery-patterns/SKILL.md` | skill | reference | `.opencode/skills/hm-l3-hivemind-engine-contracts/SKILL.md` | role-match |

### Wave 3 Skill Classification by Pattern Type

| Skill | Pattern Type | Current State | Role | Layer |
|---|---|---|---|---|
| `hm-l2-coordinating-loop` | ORCHESTRATION | EXISTS (448 lines, BROKEN refs) | coordinator | L2 |
| `hm-l2-gate-orchestrator` | ORCHESTRATION | EXISTS (221 lines) | domain-execution | L2 |
| `hm-l2-phase-execution` | ORCHESTRATION | EXISTS (190 lines) | orchestrator | L1 |
| `hm-l2-phase-loop` | ORCHESTRATION | EXISTS (158 lines) | domain-execution | L2 |
| `hm-l2-completion-looping` | ORCHESTRATION | EXISTS (149 lines) | domain-execution | L2 |
| `hivemind-power-on` | ORCHESTRATION | EXISTS (236 lines, needs trim) | governance | — |
| `hm-l3-hivemind-engine-contracts` | REFERENCE | EXISTS (451 lines) | reference | L3 |
| `hm-l3-hivemind-state-reference` | REFERENCE | EXISTS (414 lines) | reference | L3 |
| `hm-l3-integration-contracts` | REFERENCE | EXISTS (447 lines) | integration-contracts | L3 |
| `hm-l3-tool-capability-matrix` | REFERENCE | EXISTS (577 lines) | reference | L3 |
| `hm-l3-tool-surface-documentation` | REFERENCE | NEW | reference | L3 |
| `hm-l3-injection-delivery-patterns` | REFERENCE | NEW | reference | L3 |
| `hm-l3-subagent-delegation-patterns` | WORKFLOW | EXISTS (290 lines, L3 only) | domain-execution | L3 |
| `hm-l2-user-intent-interactive-loop` | WORKFLOW | EXISTS (446 lines) | front-agent | L1 |
| `hm-l2-cross-cutting-change` | WORKFLOW | EXISTS (330 lines) | domain-execution | L2 |
| `hm-l2-debug` | WORKFLOW | EXISTS (194 lines) | domain-execution | L2 |

---

## Wave 1: Code Pattern Assignments

### `src/coordination/completion/notification-handler.ts` (edit — utility, event-driven)

**Analog:** Self — this file already exists at 244 lines. Edit in place.

**Change 1: Add `synthetic: true` to parts** — line 181 + line 231

Current pattern (line 179-185):
```typescript
// In notifyParentSession()
const body = {
  noReply: true,
  parts: [{ type: "text", text: message }],
}
await sendPrompt(client, parentSessionID, body)
```

Current pattern (line 231):
```typescript
// In notifyDelegationTerminal() — inline
await sendPrompt(client, delegation.parentSessionId, { noReply: true, parts: [{ type: "text", text: message }] })
```

**Change target:** Add `synthetic: true` inside both `parts` array objects:
```typescript
parts: [{ type: "text", text: message, synthetic: true }]
```

**Pattern reference for `synthetic`:** The OpenCode SDK prompt body structure accepts `synthetic: boolean` on parts. No new imports needed — `synthetic` is a passive property on the text part object.

**Change 2: Expose `noReply` as parameter** — see session-api.ts pattern below.

**Error handling pattern** (lines 230-241):
```typescript
try {
  await sendPrompt(client, delegation.parentSessionId, { ... })
} catch (error) {
  queuePendingNotification(delegation.parentSessionId, task)
  void client.app?.log?.({
    body: {
      service: "delegation",
      level: "error",
      message: `[Harness] Failed to notify parent session ...: ${error instanceof Error ? error.message : String(error)}`,
    },
  })
}
```

---

### `src/shared/session-api.ts` (edit — utility, request-response, 311 lines)

**Analog:** Self — 311 lines. Edit in place.

**Current `sendPrompt` signature** (lines 145-174):
```typescript
export async function sendPrompt(
  client: OpenCodeClient,
  sessionID: string,
  body: unknown
): Promise<unknown> {
```

**Change: Expose a typed `noReply` parameter.** Two approaches possible:

**Option A — Add explicit `noReply` parameter (PREFERRED):**
```typescript
export async function sendPrompt(
  client: OpenCodeClient,
  sessionID: string,
  body: unknown,
  noReply?: boolean
): Promise<unknown> {
  // If noReply, use sendPromptAsync instead of sendPrompt
  const validSessionID = assertValidSessionID(sessionID)
  if (noReply) {
    await sendPromptAsync(client, validSessionID, body)
    return { delivered: true }
  }
  // ... existing logic
```

**Option B — Expose `noReply` in the body type** — the body already passes through as `SessionPromptRequest["body"]`. The SDK prompt body interface already accepts `noReply`. Current notification-handler already inlines it. The change could simply be documenting it in the TypeScript interface (add `noReply?: boolean` to the body type constraint).

**Import pattern** (lines 1-5):
```typescript
import type { createOpencodeClient } from "@opencode-ai/sdk"
import { asString, getNestedValue, unwrapData } from "./helpers.js"
import type { ResolvedBehavioralProfile } from "../routing/behavioral-profile/types.js"
import { resolveBehavioralProfile } from "../routing/behavioral-profile/resolve-behavioral-profile.js"
```

**SDK type pattern** (lines 10-14):
```typescript
type OpenCodeClient = ReturnType<typeof createOpencodeClient>
type SessionRecord = Record<string, unknown>
type SessionCreateRequest = Parameters<OpenCodeClient["session"]["create"]>[0]
type SessionPromptRequest = Parameters<OpenCodeClient["session"]["prompt"]>[0]
```

---

### `tests/lib/coordination/completion/notification-handler.test.ts` (NEW — test, unit)

**Analog:** `tests/lib/coordination/completion/detector-v2.test.ts` (100 lines)

**Import pattern** (from detector-v2.test.ts lines 1-4):
```typescript
import { vi } from "vitest"
import { CompletionDetector } from "../../../../src/coordination/completion/detector.js"
```

**Test structure pattern:**
```typescript
describe("NotificationHandler WaiterModel notification delivery", () => {
  it("delivers notification with noReply and synthetic parts", async () => {
    const mockClient = { session: { prompt: vi.fn() } } as unknown as OpenCodeClient
    // ... test logic
    expect(mockSendPrompt).toHaveBeenCalledWith(
      expect.any(Object),
      "parent-session-id",
      expect.objectContaining({
        noReply: true,
        parts: [{ type: "text", text: expect.any(String), synthetic: true }],
      }),
    )
  })
})
```

**Error handling test pattern** (from detector-v2.test.ts expect pattern):
```typescript
it("queues notification on delivery failure and retries", async () => {
  // Arrange: mock sendPrompt to throw
  // Act: call notifyDelegationTerminal
  // Assert: queuePendingNotification was called
  // Assert: client.app?.log?. was called with [Harness] prefix
})
```

**File location pattern:** `tests/lib/coordination/completion/notification-handler.test.ts` — mirrors source path under `tests/lib/`.

---

## Wave 2: NEW Skill Templates

### `.opencode/skills/hm-l3-tool-surface-documentation/SKILL.md` (NEW — reference, L3)

**Template:** `.opencode/skills/hm-l3-tool-capability-matrix/SKILL.md` (577 lines, REFERENCE type)

**Required sections to copy:**
1. **YAML frontmatter** — `allowed-tools: [Read, Grep, Glob]` pattern from tool-capability-matrix (lines 1-24)
2. **Overview** — scope statement, what this skill documents, NOT for (lines 1-25 of matrix)
3. **IRON CLAW block** — copy standard 5-step validation chain (lines 27-148 of matrix)
4. **Tool differentiation taxonomy** — what distinguishes tools by surface (new content for this skill)
5. **Navigation table** — references/ file map (like matrix lines 38-43)
6. **Self-Correction** — standard 4-mode pattern

**Allowed-tools needed:** `- Read - Grep - Glob`

**Reference files to ship:** `references/tool-surface-classification.md`, `references/surface-diffusion-matrix.md`

**Distinction from tool-capability-matrix:** This skill documents HOW tools present their surfaces (parameters, descriptions, execute signatures) and patterns for differentiation — NOT which tools exist or their permission levels.

---

### `.opencode/skills/hm-l3-injection-delivery-patterns/SKILL.md` (NEW — reference, L3)

**Template:** `.opencode/skills/hm-l3-hivemind-engine-contracts/SKILL.md` (451 lines, REFERENCE type)

**Required sections to copy:**
1. **YAML frontmatter** — pattern from engine-contracts lines 1-16 (add `context-bomb: true`, `requires:`, `allowed-tools: [Read, Grep, Glob, Bash]`)
2. **IRON CLAW block** — complete with 5-step validation chain
3. **Overview** — purpose and scope
4. **Injection pattern catalog** — factory injection, constructor injection, dependency injection approaches
5. **Delivery mechanism reference** — inject via factory parameter, via plugin deps, via tool context
6. **Self-Correction** — standard pattern

**Allowed-tools needed:** `- Read - Grep - Glob - Bash`

**Reference files to ship:** `references/injection-patterns-catalog.md`, `references/delivery-mechanisms.md`

---

## Wave 3: Skill Rewrite Templates by Type

### ORCHESTRATION (6 skills)

**Template:** `.opencode/skills/hm-l2-phase-execution/SKILL.md` (190 lines)

**Required sections (all ORCHESTRATION skills must have):**

| Section | Source Template | Lines |
|---|---|---|
| YAML frontmatter with `allowed-tools` | phase-execution | 1-24 |
| Overview (1 paragraph) | phase-execution | 26-33 |
| The Iron Law (1-line enforcement) | phase-execution | 31-34 |
| Protocol steps (numbered) | phase-execution | 57-114 |
| Anti-Patterns table | phase-execution | 148-155 |
| Self-Correction (4 modes) | phase-execution | 157-173 |
| Cross-References table | phase-execution | 183-190 |

**Allowed-tools (ORCHESTRATION standard):**
```yaml
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Task
  - todowrite
  - skill
  - execute-slash-command
  - hivemind-command-engine
```

**Skill-specific patterns:**

| Skill | Specific Pattern | Key Difference |
|---|---|---|
| `hm-l2-coordinating-loop` | Must fix ALL broken reference paths (lines 34-41: `hm-coordinating-loop` → `hm-l2-coordinating-loop`). Must add `delegate-task`, `execute-slash-command` to allowed-tools. | Coordinator role, needs subagent dispatch tools |
| `hm-l2-gate-orchestrator` | Keep `routes-to:` metadata referencing 3 gate skills. Keep HMQUAL compliance table. | Routes to gate-* skills, not direct execution |
| `hm-l2-phase-execution` | Keep wave protocol + checkpoint recovery references. File-backed state machine pattern. | Wave-based parallelism, state machine artifacts |
| `hm-l2-phase-loop` | Keep durable cursor + termination predicates. Loop definition with iteration counter. | Iteration loop management, stall detection |
| `hm-l2-completion-looping` | Keep 3-gate verification (Output/Quality/Scope). Keep durable cursor fields. | Verification guardrails, self-verifying subagents |
| `hivemind-power-on` | **TRIM** — reduce from 236 to ~150 lines. Compress tool catalog (lines 166-188: 18 tools → 6-line table). Keep Short Version (lines 204-214). Remove redundant reference links. | Session governance core, tool capability reference |

---

### REFERENCE (6 skills)

**Template:** `.opencode/skills/hm-l3-hivemind-engine-contracts/SKILL.md` (451 lines)

**Required sections (all REFERENCE skills must have):**

| Section | Source Template | Lines |
|---|---|---|
| YAML frontmatter with `context-bomb: true` | engine-contracts | 1-16 |
| Overview (2 paragraphs) | engine-contracts | 18-22 |
| IRON CLAW (5-step validation chain) | engine-contracts | 24-90 |
| Contract/documentation tables | engine-contracts | 124-137 |
| Cross-references | engine-contracts | 449-451 |
| Self-Correction (4 modes) | engine-contracts | 409-445 |

**Allowed-tools (REFERENCE standard):**
```yaml
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
```

**Skill-specific patterns:**

| Skill | Specific Pattern | Key Difference |
|---|---|---|
| `hm-l3-hivemind-engine-contracts` | Rewrite to verify contracts against current src/plugin.ts (engine-contracts:93-106 — plugin load order may have changed since "2026-04-30" verification). | Plugin load order, tool registration, hook composition |
| `hm-l3-hivemind-state-reference` | Verify `.hivemind/` structure matches current filesystem. Update section references. | State root navigation, file format documentation |
| `hm-l3-integration-contracts` | Verify bidirectional agent↔skill bindings match current `.opencode/agents/*` and `.opencode/skills/*`. | Agent-skill binding maps, lineage contracts |
| `hm-l3-tool-capability-matrix` | Verify tool list matches current `src/plugin.ts` tool registration. Update permission levels. | Complete tool catalog, permission levels, lineage rules |
| `hm-l3-tool-surface-documentation` | **NEW** — Use matrix as template. Document tool surface patterns (parameters, execute signature, description conventions). | Tool surface patterns, differentiation taxonomy |
| `hm-l3-injection-delivery-patterns` | **NEW** — Use engine-contracts as template. Document injection patterns across the codebase. | Dependency injection patterns, factory patterns |

---

### WORKFLOW (4 skills)

**Template:** `.opencode/skills/hm-l2-debug/SKILL.md` (194 lines)

**Required sections (all WORKFLOW skills must have):**

| Section | Source Template | Lines |
|---|---|---|
| YAML frontmatter | debug | 1-24 |
| Overview (1 paragraph) | debug | 26-29 |
| The Iron Law (1-line enforcement) | debug | 31-34 |
| Step-by-step protocol | debug | 42-115 |
| Anti-Patterns table | debug | 146-153 |
| Self-Correction (4 modes) | debug | 162-186 |
| Cross-References | debug | 188-194 |

**Allowed-tools (WORKFLOW standard):**
```yaml
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
```

**Note on `hm-l3-subagent-delegation-patterns`:** This skill currently exists at L3 but the task specifies `hm-l2-subagent-delegation-patterns` (L2). Two approaches:
- **Approach A:** Create new `hm-l2-subagent-delegation-patterns` from scratch at L2, leave existing L3 as-is
- **Approach B:** Downgrade existing L3 → L2 by moving file and updating frontmatter

**Recommendation:** Approach A — create L2 version as the active workflow skill, keep L3 as legacy reference.

**Skill-specific patterns:**

| Skill | Specific Pattern | Key Difference |
|---|---|---|
| `hm-l3-subagent-delegation-patterns` | **OR** create new `hm-l2-subagent-delegation-patterns`. Use debug + cross-cutting-change as template hybrids. | Delegation envelopes, checkpoint protocols, wave execution |
| `hm-l2-user-intent-interactive-loop` | Keep hard gates (Question Tool Cap, 6 PROBE conditions). Add durable cursor from phase-loop pattern. | Interactive probing, user intent clarification |
| `hm-l2-cross-cutting-change` | Keep 7-phase workflow (Scan → Classify → Impact → Red-First → Implement → Verify → Handoff). Keep pan classification taxonomy. | Cross-pane modification governance |
| `hm-l2-debug` | Keep debug state machine (Reproduce → Isolate → Hypothesize → Test → Fix → Guard). Keep 5-evidence entry gate. | Systematic debugging protocol |

---

## P0 Fix Pattern Analysis

### Fix 1: coordinating-loop broken reference paths

**Location:** `hm-l2-coordinating-loop/SKILL.md` lines 34-41

**Broken paths (CURRENT):**
```
.opencode/skills/hm-coordinating-loop/references/01-handoff-protocols.md
.opencode/skills/hm-coordinating-loop/references/02-sequential-vs-parallel.md
.opencode/skills/hm-coordinating-loop/references/03-parent-child-cycles.md
.opencode/skills/hm-coordinating-loop/references/04-ralph-loop-integration.md
.opencode/skills/hm-coordinating-loop/references/05-edge-guardrails.md
.opencode/get-shit-done/references/thinking-models-execution.md
```

**Fix:** Change all `hm-coordinating-loop` → `hm-l2-coordinating-loop`. The last reference `.opencode/get-shit-done/references/` also likely does not exist — verify with `glob` and either fix path or remove reference.

**Also broken:** `scripts/` references (lines 52, 56, 86, 149, 150, 151, 166, 167, ... and all gate scripts). These scripts (e.g., `scripts/init-session.sh`, `scripts/check-gate.sh`) may not exist at the paths referenced. During rewrite, either:
- Create the scripts directory with these scripts
- Remove the script references and use inline commands

### Fix 2: coordinating-loop allowed-tools gap

**Location:** `hm-l2-coordinating-loop/SKILL.md` line 8

**Current:** `allowed-tools: Bash Read Write Edit Glob Grep todowrite skill`

**Required additions for coordinator role:**
```
- delegate-task
- execute-slash-command
- hivemind-command-engine
- hivemind-doc
- session-tracker
- session-hierarchy
- session-context
```

### Fix 3: hivemind-power-on trim

**Location:** `hivemind-power-on/SKILL.md` — 236 lines total

**Trim plan:**

| Section | Lines | Action |
|---|---|---|
| Frontmatter | 1-35 | Keep as-is (consumed-by, allowed-tools) |
| Overview | 37-43 | Keep (30-second read) |
| Real Tools | 45-100 | Compress — remove per-action descriptions, keep tool/action table only |
| Resuming Sessions | 111-147 | Keep (critical caveat content) |
| Jump Links | 149-162 | Keep (5-line table is fine) |
| Tool Catalog | 164-188 | **COMPRESS** — 23 lines for 18 tools → reduce to 6-line summary table or remove (tools already documented in tool-capability-matrix) |
| Quality Gates | 190-202 | Keep (6 lines) |
| Short Version | 204-214 | Keep |
| Load Timing | 216-227 | Keep |
| Escalation | 228-236 | Keep |

**Target size:** ~150 lines (from 236)

---

## Inter-Phase Pattern Compliance

### Phase 22 (Status/Error Unification) Conflicts

| Pattern | Phase 22 | Phase 23 | Conflict? |
|---|---|---|---|
| Notification delivery | Status routed through unified completion pipeline | Notification adds `synthetic: true` to parts | NO — different concerns. Phase 22 owns status routing; Phase 23 owns notification format. |
| Session API signatures | Possibly changed in Phase 22 | Exposing `noReply` parameter | YES — verify Phase 22 didn't already add `noReply` type. If it did, Phase 23 only needs the notification-handler change. |
| Error log format | Unified error logging established | `[Harness] Failed to notify` pattern in catch blocks | NO — backward compatible |

**Recommendation:** Read Phase 22's PLAN.md and affected files before implementing notification-handler.ts changes to verify no double-work.

### Phase 14 (Delegation) Conflicts

| Pattern | Phase 14 | Phase 23 | Conflict? |
|---|---|---|---|
| WaiterModel dispatch | Established dual-signal completion | Notification handler uses completion detector | NO — established in Phase 14, consumed by Phase 23 |
| Delegation records | Persistence established | `notifyDelegationTerminal()` reads delegation records | NO — backward compatible |
| Subagent delegation patterns | Delegation protocol defined | `hm-l2-subagent-delegation-patterns` rewrite | YES — verify Phase 23 references match Phase 14 delegation protocol (WaiterModel, dual-signal, depth limits) |
| Notify parent session pattern | notifyParentSession established in Phase 14 | Adding `synthetic: true` to parts | NO — additive change only |

**Recommendation:** The `hm-l3-subagent-delegation-patterns` rewrite must reference `MAX_DELEGATION_DEPTH = 3`, `MAX_DESCENDANTS_PER_ROOT = 10`, and WaiterModel dispatch from Phase 14's constants (originally in `src/lib/types.ts`).

---

## No Analog Found

| File | Pattern Type | Reason |
|---|---|---|
| `hm-l3-tool-surface-documentation` | REFERENCE | No existing skill documents tool surface differentiation — tool-capability-matrix is closest role-match |
| `hm-l3-injection-delivery-patterns` | REFERENCE | No existing skill documents injection patterns — engine-contracts is closest structure-match |
| `hm-l2-subagent-delegation-patterns` | WORKFLOW | No existing L2 delegation workflow skill — only L3 exists. Use L3 as seed template but restructure for L2 workflow pattern |

---

## Metadata

**Analog search scope:** `src/coordination/completion/`, `src/shared/`, `tests/lib/coordination/completion/`, `.opencode/skills/`
**Skills scanned:** 4 stack/gate reference + 4 HM reference + 10 HM existing rewrite-target skills = 18 files
**Source code scanned:** notification-handler.ts (244 lines), session-api.ts (311 lines), detector-v2.test.ts (100 lines)
**Pattern extraction date:** 2026-05-23
