# Knot 1 Phase Plan: Context Constitution

Date: 2026-02-24
Scope: v2.9 domain-knot execution (Knot 1)
Status: ✅ COMPLETE - All 10 tasks executed. Closeout: docs/plans/2026-02-24-knot-1-closeout.md

## 1) Overview

Knot 1 defines the constitutional context layer that is injected on every turn, so governance is deterministic instead of advisory drift. It is first because all downstream knots (schema expansion, state unification, hook reorganization, and lifecycle commands) depend on stable turn-level context contracts.

What Knot 1 delivers:
- Typed constitutional rule model (schema-first, runtime-validated).
- Deterministic system-instruction compiler for sticky rules.
- Entity checklist contract (anchors/mems/hierarchy/session prerequisites) used by hook pipeline.
- Hook wiring contract across `experimental.chat.system.transform` and `experimental.chat.messages.transform` with explicit responsibilities.

Why first:
- Current system already injects governance text, but as a large static string in `src/lib/governance-instruction.ts` with no typed rule model.
- Current message transform combines first-turn prompt transformation, context packer injection, auto-realign reminders, and pre-stop checklist in one large file.
- Hook execution is functional but implicit-order coupled; constitutional behavior needs an explicit contract before adding more tool/command surfaces.

What depends on Knot 1:
- Knot 2 compaction/state continuity: requires stable checklist + constitutional identity in compacted context.
- Knot 3+ tool/hook expansion: requires hard governance invariants and typed prerequisites.
- Framework lifecycle commands: requires enforceable per-turn constitutional baseline.

SDK grounding applied in this plan:
- `experimental.chat.system.transform`: inject sticky constitutional rules each turn.
- `experimental.chat.messages.transform`: enforce entity checklist and context augmentation before LLM call.
- `experimental.session.compacting`: preserve constitutional continuity marker and summary payload (dependency note for Knot 2).
- Constraint alignment: plugin `ctx.client` exposes full `@opencode-ai/sdk` capability for controlled lifecycle actions (`session.create()`, `session.prompt()`, `session.messages()`, `tui.showToast()`); `skill` outputs are protected from pruning; tool context includes `sessionID`, `messageID`, `agent`, `directory`, `worktree`, and abort signal.

> **CORRECTED (2026-02-24):** Earlier guidance that plugin hooks lacked session lifecycle APIs was false. HiveMind uses a hybrid 4-layer architecture where `ctx.client` provides full `@opencode-ai/sdk` access, so Auto New Session is feasible from plugin hooks when policy-gated and tool-audited.

## 2) Issue Mapping (Audit Trace)

Knot 1 directly addresses or de-risks the following validated issues from `docs/plans/2026-02-24-v29-domain-audit.md`:

| Issue ID | Status in Audit | Knot 1 Relevance | Planned Resolution in Knot 1 |
|---|---|---|---|
| CF-D5-01 | CONFIRMED | Governance remains advisory and non-enforceable at context level | Introduce typed constitutional rule model and checklist-driven enforcement signals in system/messages transforms |
| CF-D5-02 | REVISED | First-turn behavior duplicated across paths | Define explicit split: system hook owns constitutional instruction; messages hook owns user-turn transformation + checklist only |
| CF-D5-03 | REVISED | `session_coherence` wiring exists but registration path ambiguity persists | Consolidate first-turn pathway under one contract and document registration/ownership boundary |
| CF-D5-07 | CONFIRMED | No explicit hook ordering/priority mechanism | Introduce hook wiring contract section and deterministic precedence policy |
| CF-D5-NEW-01 | NEW | `createMainSessionStartHook` dead path risk | Remove dead-path dependence by folding required behavior into canonical registered hooks |
| CF-D2-03 | CONFIRMED | 3-level vs 6-level hierarchy model mismatch | Entity checklist includes explicit hierarchy bridge presence checks to prevent silent mismatch |
| CF-D2-08 | CONFIRMED | No validation on `state/` reads | Checklist evaluator to treat unvalidated reads as degraded context and emit repair directives |
| CF-D2-NEW-01 | NEW | `safeParse` not used on state load boundaries | Add acceptance criteria requiring safeParse-backed checklist inputs where constitutional decisions depend on state |
| CF-D6-01 | CONFIRMED | Framework vision incomplete | Knot 1 adds executable constitutional contract slice to reduce ambiguity while broader lifecycle spec remains in later knot |

## 3) File Inventory (Create vs Refactor)

| File | Action | Current LOC | Planned Change |
|---|---|---:|---|
| `src/schemas/governance-constitution.ts` | Create | 0 | New Zod schemas for `GovernanceInstruction`, `ConstitutionalRule`, `EntityChecklist` |
| `src/lib/entity-checklist.ts` | Create | 0 | Deterministic evaluator for must-have entities and readiness status |
| `src/lib/governance-instruction.ts` | Refactor | 88 | Replace monolithic raw string with schema-driven compiler + marker contract |
| `src/hooks/session-lifecycle.ts` | Refactor | 178 | System hook reads compiled constitutional instruction and checklist summary |
| `src/hooks/messages-transform.ts` | Refactor | 542 | Isolate first-turn transform path, checklist reminder injection, and ordering guarantees |
| `src/hooks/soft-governance.ts` | Refactor | 570 | Align acknowledgment/violation counters with constitutional checklist events |
| `src/lib/cognitive-packer.ts` | Refactor | 522 | Add constitutional summary metadata to packed context and deterministic checklist projection |
| `src/index.ts` | Refactor | 166 (`wc -l`) | Keep canonical hook registration; annotate/verify wiring contract in-code |
| `src/schemas/graph-nodes.ts` | Reference-only | 233 | Reuse UUID/FK patterns and timestamp conventions for new constitutional schemas |
| `docs/plans/2026-02-24-knot-1-context-constitution-phase-plan.md` | Create | 0 | This implementation plan artifact |

Notes from current-source analysis:
- `session-lifecycle` already prepends governance instruction with dedupe marker and composes budget-capped sections.
- `messages-transform` currently centralizes many responsibilities (first-turn coherence, packer injection, anchor/header, pre-stop checks), making constitutional behavior harder to reason about.
- `governance-instruction.ts` currently exports one static string constant, not a typed rule set.

## 4) Schema Definitions (Draft)

```ts
import { z } from "zod"

export const ConstitutionalRuleSchema = z.object({
  id: z.string().uuid(),
  key: z.string().regex(/^[a-z0-9._-]+$/),
  priority: z.enum(["critical", "high", "medium", "low"]),
  scope: z.enum(["global", "session", "turn", "hook", "tool"]),
  applies_to_roles: z.array(z.enum(["front_agent", "builder_agent", "review_agent", "any"])).default(["any"]),
  content: z.string().min(1),
  rationale: z.string().min(1),
  source: z.enum(["builtin", "project", "session"]),
  enabled: z.boolean().default(true),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export const EntityChecklistItemSchema = z.object({
  key: z.enum([
    "hivemind_config",
    "planning_sot",
    "hierarchy_chain",
    "anchors_presence",
    "mems_presence",
    "active_action",
    "state_validation_ready",
  ]),
  required: z.boolean().default(true),
  status: z.enum(["pass", "warn", "fail", "unknown"]),
  message: z.string().min(1),
  evidence_ref: z.string().min(1),
})

export const EntityChecklistSchema = z.object({
  id: z.string().uuid(),
  session_id: z.string().uuid(),
  turn_id: z.string().min(1),
  items: z.array(EntityChecklistItemSchema).min(1),
  passed: z.boolean(),
  generated_at: z.string().datetime(),
})

export const GovernanceInstructionSchema = z.object({
  id: z.string().uuid(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  marker: z.string().min(1),
  title: z.string().min(1),
  rules: z.array(ConstitutionalRuleSchema).min(1),
  checklist: EntityChecklistSchema.optional(),
  checksum: z.string().min(8),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export type ConstitutionalRule = z.infer<typeof ConstitutionalRuleSchema>
export type EntityChecklist = z.infer<typeof EntityChecklistSchema>
export type GovernanceInstruction = z.infer<typeof GovernanceInstructionSchema>
```

## 5) Hook Wiring Plan

### A. Constitutional Injection Hook
- SDK hook type: `experimental.chat.system.transform`
- Reads:
  - Compiled governance instruction (schema-backed)
  - Brain/hierarchy snapshot from state manager
  - Checklist summary from evaluator lib
- Outputs:
  - `system[]` with one deduplicated constitutional block
  - Optional strict reminder block when checklist fails
- Current implementation analysis:
  - Exists in `createSessionLifecycleHook` and already prepends `HIVE_MASTER_GOVERNANCE_INSTRUCTION`.
  - Needed change: replace static text-only source with typed compiler and policy-aware sections.

### B. Message Context + Checklist Hook
- SDK hook type: `experimental.chat.messages.transform`
- Reads:
  - Latest user message
  - State/hierarchy/task manifests
  - Packed cognitive XML from packer
  - Auto-realign decision from integration lib
- Outputs:
  - Synthetic prepend for anchor + packed context + auto-realign guidance
  - Synthetic append for pre-stop checklist and pending tasks
- Current implementation analysis:
  - Functionally rich but overloaded (first-turn transform, checklist, context packer, pending tasks).
  - Needed change: establish deterministic order and isolate first-turn coherence as an internal module with one owner path.

### C. Compaction Continuity Hook (Dependency Edge)
- SDK hook type: `experimental.session.compacting`
- Reads:
  - Active constitutional marker/checklist outcome
  - Session hierarchy summary
- Outputs:
  - `context[]` preserving constitutional continuity metadata
  - Optional compact prompt note when unresolved checklist failures exist
- Current implementation analysis:
  - Hook is registered in `src/index.ts` via `createCompactionHook`.
  - Knot 1 only defines continuity contract; implementation extension is coordinated with Knot 2.

## 6) Lib Changes

### `src/lib/governance-instruction.ts`
Current:
- Single static instruction string with dedupe marker export.

Planned:
- Add compiler API:
  - `buildGovernanceInstruction(input: GovernanceInstruction): string`
  - `getGovernanceMarker(): string`
  - `renderChecklistSummary(checklist: EntityChecklist): string`
- Ensure deterministic ordering by rule priority then key.
- Keep marker stable for backward compatibility with existing dedupe checks.

### `src/lib/cognitive-packer.ts`
Current:
- Packs trajectory/plan/tasks/mems/anchors + summary into XML.
- Handles budget-based mem dropping and anti-pattern section.

Planned:
- Add constitutional projection fields into `<context_summary>` (e.g., checklist pass/fail + missing essentials count).
- Remove non-deterministic fallback IDs from pack-path where constitutional decisions depend on identity.
- Ensure packer can export a small checklist digest without inflating budget guarantees.

## 7) Task Breakdown

1. **K1-T01 - Evidence Baseline and Contract Draft**
   - Files: `docs/plans/2026-02-24-knot-1-context-constitution-phase-plan.md`
   - Dependencies: none
   - Acceptance criteria: issue mapping references validated CF entries; hook contracts documented for all three SDK hook points.
   - Complexity: S

2. **K1-T02 - Add Constitutional Schemas**
   - Files: `src/schemas/governance-constitution.ts`, `src/schemas/index.ts`
   - Dependencies: K1-T01
   - Acceptance criteria: Zod schemas compile; exported types available; schema tests include valid+invalid cases.
   - Complexity: M

3. **K1-T03 - Add Entity Checklist Evaluator**
   - Files: `src/lib/entity-checklist.ts`
   - Dependencies: K1-T02
   - Acceptance criteria: evaluator returns deterministic item order and statuses for all required keys; missing/invalid files return `fail` or `warn` entries (never throw); each item includes non-empty `evidence_ref`.
   - Complexity: M

4. **K1-T04 - Refactor Governance Instruction Compiler**
   - Files: `src/lib/governance-instruction.ts`
   - Dependencies: K1-T02, K1-T03
   - Acceptance criteria: system instruction generated from typed rule model; dedupe marker unchanged; unit tests for ordering and rendering.
   - Complexity: M

5. **K1-T05 - Wire System Transform to Typed Constitution**
   - Files: `src/hooks/session-lifecycle.ts`
   - Dependencies: K1-T04
   - Acceptance criteria: hook injects compiled constitution once; checklist failure appends deterministic system reminder; no duplicate injection across turns.
   - Complexity: M

6. **K1-T06 - Refactor Messages Transform Ownership Boundaries**
   - Files: `src/hooks/messages-transform.ts`
   - Dependencies: K1-T03, K1-T05
   - Acceptance criteria: first-turn coherence, packer prepend, and checklist append execute in explicit order; no duplicate first-turn path.
   - Complexity: L

7. **K1-T07 - Align Soft Governance Counters with Checklist Events**
   - Files: `src/hooks/soft-governance.ts`
   - Dependencies: K1-T03, K1-T06
   - Acceptance criteria: for each `tool.execute.after` invocation (one tool cycle), checklist `fail` increments `governance_counters.out_of_order` or `governance_counters.evidence_pressure` at most once; on `map_context` or `hivemind_session(update)`, `governance_counters.acknowledged=true` and ignored escalation is reset/downgraded per policy; existing drift and ignored-cycle behavior remains unchanged in regression tests.
   - Complexity: M

8. **K1-T08 - Add Constitutional Digest to Cognitive Packer**
   - Files: `src/lib/cognitive-packer.ts`
   - Dependencies: K1-T03
   - Acceptance criteria: packed XML includes `<context_summary>` digest fields `checklist_passed`, `checklist_fail_count`, `checklist_warn_count`, and `checklist_missing_keys`; output respects `budget` override and default dynamic budget (`floor(contextWindow * budgetPercentage)`); identical input snapshot produces byte-stable XML.
   - Complexity: M

9. **K1-T09 - Verify Plugin Wiring and Regression Surface**
   - Files: `src/index.ts`, tests under `tests/hooks/*` and `tests/lib/*`
   - Dependencies: K1-T05, K1-T06, K1-T07, K1-T08
   - Acceptance criteria: hook registration unchanged in capability but updated in contract comments/tests; no dead path to unregistered first-turn hook remains.
   - Complexity: M

10. **K1-T10 - Knot Exit Validation + Audit Trace Update**
    - Files: `docs/plans/*` (knot closeout), test snapshots as needed
    - Dependencies: K1-T09
    - Acceptance criteria: closeout artifact lists each mapped issue with `resolved|partial|deferred` plus file:line evidence; captures validation outputs for `npx tsc --noEmit` and `npm test`; documents unresolved items with explicit follow-up owner.
    - Complexity: S

## 8) Dependency Graph

```text
K1-T01
  -> K1-T02
    -> K1-T03
      -> K1-T04
        -> K1-T05
          -> K1-T06
            -> K1-T07
      -> K1-T08
K1-T06 + K1-T07 + K1-T08
  -> K1-T09
    -> K1-T10
```

## 9) Quality Gates

Knot 1 completion requires all gates:

1. Type safety
   - `npx tsc --noEmit` passes.

2. Behavioral tests
   - Hook tests cover:
     - system instruction dedupe behavior
     - first-turn transformation single-owner path
     - checklist injection ordering
     - pending-task/pre-stop reminders still functioning
   - Lib tests cover:
     - governance instruction compile ordering
     - checklist evaluator deterministic outputs
     - cognitive packer constitutional digest behavior

3. Regression and contract checks
   - No removal of registered canonical hooks in `src/index.ts`.
   - Existing marker compatibility preserved for in-flight sessions.
   - No new dead/unregistered hook path.

4. Evidence gate
   - Mapping evidence retained for addressed issues: CF-D5-01, CF-D5-02, CF-D5-03, CF-D5-07, CF-D5-NEW-01 (plus D2/D6 dependencies listed above).

## 10) Risks and Mitigations

1. **Risk:** Over-coupling constitutional logic into one hook recreates current monolith.
   - **Mitigation:** Keep system hook as instruction compiler owner; messages hook as checklist/prompt augmentation owner.

2. **Risk:** Rule strictness blocks legitimate workflows.
   - **Mitigation:** Severity tiers in checklist (`pass/warn/fail`) and controlled escalation path before hard-block behavior.

3. **Risk:** Checklist computation increases latency.
   - **Mitigation:** Deterministic, bounded checks only; reuse loaded state; avoid deep scans on every turn.

4. **Risk:** Backward compatibility break due to marker/schema migration.
   - **Mitigation:** Preserve existing governance marker string and support dual-read transition for one release window.

5. **Risk:** Context budget overflow after adding constitutional digest.
   - **Mitigation:** Keep digest compact, place it in summary region, and preserve existing budget truncation policy.

6. **Risk:** SDK lifecycle usage drifts from governance boundaries.
   - **Mitigation:** Require policy-gated plugin lifecycle triggers (`ctx.client.session.create()` etc.) with tool-owned persistence/audit updates and deterministic guard checks.
