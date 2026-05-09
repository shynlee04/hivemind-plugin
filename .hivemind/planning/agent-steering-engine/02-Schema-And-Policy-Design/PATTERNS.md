---
feature: agent-steering-engine
phase: 02-Schema-And-Policy-Design
artifact: PATTERNS
created: 2026-05-09
status: draft
---

# Agent Steering Engine — Phase 02 Design Patterns

> This document establishes the design patterns, code organization, and
> integration conventions that guide implementation in Phases 03–08.
> Every pattern references existing harness code it builds upon.

---

## 1. Module Organization

### Pattern: Feature-module under `src/features/steering-engine/`

The steering engine is a standalone feature module, following the same
convention as existing features (`bootstrap/`, `background-command/`,
`doc-intelligence/`, `prompt-packet/`, `runtime-pressure/`,
`sdk-supervisor/`, `agent-work-contracts/`).

**Directory layout:**

```
src/features/steering-engine/
├── index.ts                          # Barrel export
├── policy-evaluator.ts               # REQ-01: conditional evaluation engine
├── injection-builder.ts              # REQ-02/03/04: content template rendering
├── primitive-scanner.ts              # REQ-06: YAML frontmatter discovery
├── steering-state.ts                 # Turn counter + event detection (CQRS read-side)
├── types.ts                          # SteeringEngine-specific types
├── templates/
│   ├── reminder-template.ts          # messages.transform injection content
│   ├── compaction-template.ts        # session.compacting recovery content
│   └── marker-template.ts            # system.transform role marker
├── conditions/
│   ├── hierarchy-condition.ts        # Front-facing vs subagent
│   ├── lineage-condition.ts          # hm-*/hf-*/gate-*/stack-*
│   ├── depth-condition.ts            # L0/L1/L2/L3
│   ├── turn-count-condition.ts       # Turns-since-last-injection
│   └── compaction-condition.ts       # Post-compaction event flag
└── schema/
    └── steering-policy.schema.ts     # Zod schema for policy validation
```

**Why this pattern:** Existing features follow this exact layout — `src/features/{name}/index.ts` as barrel, with domain modules, types, and sub-directories for cohesive groups. Evidence: `src/features/bootstrap/`, `src/features/background-command/`.

**Module boundaries:**

| Module | Responsibility | Reads from | Writes to |
|--------|---------------|-----------|----------|
| `policy-evaluator` | Evaluates conditions, decides injection | `steering-state`, `primitive-scanner` | Returns decision (no side effects) |
| `injection-builder` | Renders template content from decision | `policy-evaluator` output, `primitive-scanner` inventory | Returns string content (no side effects) |
| `primitive-scanner` | Scans `.opencode/` for primitives | Filesystem (`.opencode/`) | Internal cache only |
| `steering-state` | Tracks turns, compaction flags, task boundaries | `.hivemind/state/` via tools (CQRS read-side) | No durable writes from hooks |

**Wiring to harness:** Steering modules are imported by hook factories via `HookDependencies` extension — not by `plugin.ts` directly. The hook factory calls steering modules; the modules never call hooks. Evidence: `src/hooks/types.ts:25-44` shows the dependency injection pattern.

---

## 2. Hook Integration

### Pattern: Extend existing hooks, do not replace

The steering engine hooks into the SAME three surfaces already used by
`core-hooks.ts` and `session-hooks.ts`. It does NOT create new hook
registrations — it extends the existing handler bodies.

**Registration point:** `src/plugin.ts:122-127` already spread-merges
`createCoreHooks(...)` and `sessionReadHooks`. The steering engine adds
its logic INSIDE these existing factories, not as a parallel registration.

### Hook registration order (existing, verified from source):

```
plugin.ts returns {
  ...createCoreHooks(deps),          // event, system.transform, messages.transform, shell.env
  ...sessionReadHooks,               // session.compacting, session.created, session.deleted
  ...toolGuardHooks,                 // tool.execute.after
  tool: { ... },                     // tool registrations
  "tool.execute.after": async ...    // post-tool hook
}
```

**Conflict avoidance strategy:**

1. **`system.transform`** (core-hooks.ts:69-133): Existing blocks push
   governance → intake → behavioral profile. Steering adds a FOURTH
   push — a single-line role marker — AFTER behavioral profile.
   No reordering needed. The marker appends, never replaces.

2. **`messages.transform`** (core-hooks.ts:143-150): Currently a
   pass-through that sets `output.messages = input.messages ?? []`.
   Steering reactivates this by adding conditional injection AFTER
   the pass-through, wrapping steering content in a system message.

3. **`session.compacting`** (session-hooks.ts:222-338): Already pushes
   lifecycle context, continuity snapshot, and compaction packet.
   Steering appends ADDITIONAL context lines for role + workflow +
   TODO recovery. Does not modify existing pushes.

### Pattern for extending hooks without replacing:

```typescript
// INSIDE createCoreHooks — extend, don't replace
"messages.transform": async (input, output) => {
  // Existing behavior (pass-through)
  output.messages = input.messages ?? []

  // Steering extension: conditional injection
  const decision = deps.evaluateSteeringPolicy?.(sessionID)
  if (decision.shouldInject) {
    const content = deps.buildSteeringContent?.(decision)
    output.messages.push({ role: "system", content })
  }
}
```

**Why this pattern:** CQRS boundary enforcement. Hooks READ state from
injected dependencies but never perform durable writes. The `deps` object
carries steering functions — hooks call them, steering modules own the logic.
Evidence: `src/hooks/composition/cqrs-boundary.ts` classifies hook effects.

---

## 3. Policy Evaluation

### Pattern: Strategy composition with priority cascade

The policy evaluator uses the **Strategy pattern** — each condition type
is a standalone evaluator that returns `true | false | "unknown"`.
Conditions compose via AND/OR/NOT combinators.

**Condition interface:**

```typescript
interface SteeringCondition {
  readonly type: "hierarchy" | "lineage" | "depth" | "turn-count" | "compaction" | "phase"
  evaluate(context: SteeringContext): boolean
}
```

**Composition:**

```typescript
// AND: all conditions must match
// OR: any condition matches
// NOT: invert a condition
type ConditionCombinator =
  | { and: SteeringCondition[] }
  | { or: SteeringCondition[] }
  | { not: SteeringCondition }
```

**Priority cascade for conflicting policies:**

```
1. Compaction-recovery policies  (highest — session just lost context)
2. Delegation-start policies     (child session first turn)
3. Turn-count reminder policies  (periodic reinforcement)
4. Phase-shift policies          (workflow state change)
5. Default passthrough           (no injection)
```

When multiple policies match, the HIGHEST priority wins. Lower-priority
policies are suppressed for that turn to avoid injection stacking.

**Turn/token counting:**

- Turn counter is maintained by `steering-state.ts` which reads from
  tool-call events observed by hooks.
- Threshold is configurable: default 10-15 tool calls between reminders
  (evidence: Phase 01 RESEARCH §5.2, item 3).
- Token budget per injection: reminder ≤100 tokens, compaction ≤600 tokens,
  marker ≤40 tokens (evidence: Phase 01 RESEARCH §4.4).

**Why this pattern:** The existing harness uses strategy-like evaluation
for behavioral profiles (`src/routing/behavioral-profile/resolve-behavioral-profile.ts`)
and runtime policy (`src/shared/runtime-policy.ts`). The steering evaluator
follows the same convention — pure functions, injected context, no globals.

---

## 4. Dynamic Registration

### Pattern: Filesystem scan with YAML frontmatter parsing

Primitive discovery scans `.opencode/` subdirectories for `.md` files,
parses their YAML frontmatter, and builds an in-memory inventory.

**Scan algorithm:**

```
1. Resolve scan roots:
   - Project:  {projectRoot}/.opencode/
   - Global:   ~/.config/opencode/   (if accessible)
2. For each primitive type (agents, skills, commands, tools, plugins):
   a. Check both singular and plural directory names:
      - .opencode/agents/ and .opencode/agent/
      - .opencode/skills/ and .opencode/skill/
      - .opencode/commands/ and .opencode/command/
   b. For each .md file found:
      - Parse YAML frontmatter (between --- delimiters)
      - Extract: name, description, mode, tools, metadata
      - Agent name = filename minus .md extension
      - Skill name = SKILL.md frontmatter `name` field
3. Build PrimitiveInventory map keyed by name
```

**YAML frontmatter parsing:**

Use the same pattern OpenCode uses internally — `gray-matter` or equivalent
lightweight parser that extracts YAML between `---` delimiters. The steering
engine does NOT need to understand the full markdown body — only the
frontmatter metadata fields.

**Caching strategy:**

- Scan runs once at plugin initialization (eager) with lazy refresh.
- Cache stored in `primitive-scanner.ts` as an in-memory `Map<string, PrimitiveMeta>`.
- Cache invalidation: file-system watcher or manual refresh via tool call.
- Cache is read-only from hooks' perspective (CQRS compliant).

**Handling singular/plural dirs:**

OpenCode supports both `.opencode/agents/` and `.opencode/agent/`.
The scanner checks BOTH and deduplicates by primitive name.
Evidence: Phase 01 RESEARCH §2.1 confirms both are scanned.

**Why this pattern:** OpenCode's own `ConfigAgent.load(dir)` does exactly
this (DeepWiki anomalyco/opencode source). The steering engine mirrors
the platform's discovery mechanism rather than inventing a new one.

---

## 5. Injection Content Building

### Pattern: Template resolution with token budget enforcement

Each injection surface has a dedicated template builder that receives
a `SteeringContext` and produces token-budgeted string content.

**Template variable resolution:**

```
Available variables (from SteeringContext):
  {role}         — e.g., "orchestrator", "researcher", "writer"
  {hierarchy}    — "front-facing" | "subagent"
  {depth}        — L0, L1, L2, L3
  {lineage}      — hm, hf, gate, stack
  {turns}        — current turn count
  {lastReminder} — turns since last injection
  {activeSkills} — loaded skills for this agent
  {delegationChain} — parent → child chain
  {taskBoundary}  — current task scope description
```

Resolution is simple string interpolation — not a full template engine.
This avoids runtime dependencies and keeps templates auditable.

**Token budget enforcement:**

```typescript
const TOKEN_BUDGETS = {
  reminder: 100,    // REQ-02: lightweight nudge
  compaction: 600,  // REQ-03: full recovery packet
  marker: 40,       // REQ-04: single-line identifier
} as const
```

Each template builder estimates token count (rough heuristic: 1 token ≈ 4
chars for English text) and truncates content to fit the budget. Templates
prioritize the MOST important information first (U-shaped attention —
critical rules at start AND end of block).

**Surface-specific rendering:**

Same `SteeringContext` produces different content for different surfaces:

| Surface | Content | Budget | Cadence |
|---------|---------|--------|---------|
| `messages.transform` | Full reminder block with constraints | ≤100 tokens | Conditional (every N turns) |
| `session.compacting` | Full context packet (role + workflow + TODO + delegation) | ≤600 tokens | Every compaction event |
| `system.transform` | Single-line marker `[role: {h} | lineage: {l} | depth: {d}]` | ≤40 tokens | Every system prompt |

**Why this pattern:** The existing compaction hook (session-hooks.ts:263-338)
already builds context strings from lifecycle + continuity data. The steering
builder follows the same "collect data → format lines → push to output"
pattern with the addition of token budgeting.

---

## 6. State Tracking (CQRS)

### Pattern: Tools write, hooks read

State tracking follows the existing CQRS boundary strictly:
hooks observe events and read cached state; tools perform durable writes.

**Turn counting:**

```
Write path:
  tool.execute.after hook (plugin.ts:150-183) observes every tool call
  → tool-call fact includes sessionID and tool name
  → steering-state.incrementTurnCount(sessionID) updates in-memory counter
  → Periodic persistence: tool writes to .hivemind/state/steering/{sessionId}.json

Read path:
  messages.transform hook reads steering-state.getTurnCount(sessionID)
  → Returns cached count (no filesystem read in hook path)
```

**Compaction event detection:**

```
Write path:
  session.compacting hook fires → steering-state.markCompaction(sessionID)
  → Sets in-memory flag for this session
  → Flag persists in .hivemind/state/steering/{sessionId}.json

Read path:
  messages.transform hook reads steering-state.wasCompacted(sessionID)
  → If true, policy evaluator escalates priority for next injection
  → Flag cleared after successful post-compaction injection
```

**Task boundary detection:**

```
Write path:
  session-patch tool or delegate-task tool updates continuity metadata
  → Continuity change includes task boundary shift
  → steering-state.markTaskBoundary(sessionID) records the shift

Read path:
  messages.transform hook reads steering-state.hasTaskBoundaryShift(sessionID)
  → If true, policy evaluator triggers phase-aware reinjection
```

**State persistence location:**

Per Q6 architecture decision, all durable state lives under `.hivemind/`:

```
.hivemind/
└── state/
    └── steering/
        └── {sessionId}.json    # Per-session steering state
```

**Why this pattern:** The existing harness already uses this exact CQRS
split: hooks in `core-hooks.ts` and `session-hooks.ts` read from
`getSessionContinuity()` and `lifecycleManager.getLifecycleSnapshot()`
without writing; tools in `src/tools/` perform the actual mutations.
Evidence: `src/hooks/composition/cqrs-boundary.ts` enforces this boundary.

---

## 7. Testing Strategy

### Pattern: Layered testing with mock hook surfaces

Three testing layers, each isolated from OpenCode runtime:

### 7.1 Unit Tests — Policy Evaluation

Test each condition evaluator in isolation with a crafted `SteeringContext`:

```typescript
// Test: hierarchy condition fires for subagent
const condition = new HierarchyCondition({ expected: "subagent" })
const ctx: SteeringContext = { hierarchy: "subagent", ... }
expect(condition.evaluate(ctx)).toBe(true)

// Test: turn-count condition respects threshold
const turnCondition = new TurnCountCondition({ threshold: 10 })
expect(turnCondition.evaluate({ turnsSinceLastInjection: 9 })).toBe(false)
expect(turnCondition.evaluate({ turnsSinceLastInjection: 10 })).toBe(true)
```

### 7.2 Unit Tests — Injection Builder

Test template rendering with mocked context:

```typescript
const builder = new ReminderBuilder()
const content = builder.build({
  role: "researcher",
  hierarchy: "subagent",
  depth: "L2",
  lineage: "hm",
  turns: 12,
})
expect(content).toContain("subagent")
expect(content).toContain("researcher")
expect(estimateTokens(content)).toBeLessThanOrEqual(100)
```

### 7.3 Integration Tests — Hook Wiring

Test hooks WITHOUT real OpenCode runtime using mock input/output:

```typescript
// Mock the hook input/output shapes
const mockInput = { sessionID: "test-session", messages: [] }
const mockOutput = { messages: [] as Array<{role: string; content: string}> }

// Create hooks with mock deps
const deps = { ...mockDeps, evaluateSteeringPolicy: mockEvaluator }
const hooks = createCoreHooks(deps)

// Exercise the hook
await hooks["messages.transform"](mockInput, mockOutput)

// Verify: passthrough when policy says no injection
expect(mockOutput.messages).toHaveLength(0)

// Verify: injection when policy says yes
mockEvaluator.shouldInject = true
await hooks["messages.transform"](mockInput, mockOutput)
expect(mockOutput.messages).toHaveLength(1)
expect(mockOutput.messages[0].role).toBe("system")
```

**Test file locations (following project conventions):**

```
tests/features/steering-engine/
├── policy-evaluator.test.ts
├── injection-builder.test.ts
├── primitive-scanner.test.ts
├── steering-state.test.ts
└── integration/
    └── steering-hooks.test.ts
```

**Why this pattern:** Existing hook tests in `tests/hooks/` use this exact
mock-input/mock-output approach. The harness does not spin up a real OpenCode
runtime for hook tests — it verifies the hook's response to shaped inputs.
Evidence: `tests/lib/` and `tests/tools/` conventions in TESTING.md.

---

## 8. Configuration Surface

### Pattern: Schema-validated user extension via `opencode.json`

Users extend default steering policies through the existing Hivemind config
system (`src/schema-kernel/hivemind-configs.schema.ts`).

**Config location:** `opencode.json` at project root, under a new
`steering` key:

```json
{
  "steering": {
    "enabled": true,
    "reminderInterval": 12,
    "policies": [
      {
        "name": "researcher-artifact-persistence",
        "condition": { "and": [
          { "lineage": "hm" },
          { "role": "researcher" },
          { "turnCount": { "gte": 8 } }
        ]},
        "injection": "artifact-persistence-reminder",
        "priority": 3
      }
    ]
  }
}
```

**Schema validation:**

The `steering-policy.schema.ts` file defines Zod schemas for the config
shape. Validation occurs at plugin init via `getConfig()` — the same path
used for existing Hivemind configs. Invalid policies are rejected with
a clear error message, never silently ignored.

**Default policies (shipped with the harness):**

Default policies are defined in `src/features/steering-engine/defaults.ts`
and are merged with user-provided policies at startup. User policies
override defaults with the same name; defaults provide baseline coverage
when no user config exists.

**Extension pattern:**

1. User adds `"steering"` key to `opencode.json`
2. Plugin init validates schema via Zod
3. Valid policies merge with defaults (user overrides win)
4. Invalid config logs a warning and falls back to defaults only
5. No restart required for config changes (lazy re-read)

**Why this pattern:** The existing config system (`src/config/subscriber.ts`,
`src/schema-kernel/hivemind-configs.schema.ts`) already validates and caches
user config at plugin init. The steering engine extends this same mechanism
rather than introducing a separate config path.

---

## 9. Cross-Reference to Requirements

| Pattern Section | Requirements Covered | Key Decisions |
|----------------|---------------------|---------------|
| Module Organization | REQ-01, REQ-06 | Feature-module layout under `src/features/steering-engine/` |
| Hook Integration | REQ-02, REQ-03, REQ-04 | Extend existing hooks, never replace; CQRS compliant |
| Policy Evaluation | REQ-01 | Strategy pattern with priority cascade |
| Dynamic Registration | REQ-06 | Filesystem scan + YAML frontmatter, cached |
| Injection Content | REQ-02, REQ-03, REQ-04 | Template resolution with token budgets |
| State Tracking | REQ-01, REQ-03, REQ-05 | CQRS: tools write, hooks read; `.hivemind/state/steering/` |
| Testing Strategy | All P0 | Layered: unit (isolated) + integration (mock hooks) |
| Configuration | REQ-01, C2 | Zod-validated extension via `opencode.json` |

### Requirement-to-Pattern Traceability

| Requirement | Primary Pattern | Secondary Pattern |
|-------------|----------------|-------------------|
| REQ-01 (Policy Engine) | §3 Policy Evaluation | §6 State Tracking, §8 Configuration |
| REQ-02 (messages.transform) | §2 Hook Integration | §5 Injection Content |
| REQ-03 (session.compacting) | §2 Hook Integration | §5 Injection Content, §6 State Tracking |
| REQ-04 (system.transform) | §2 Hook Integration | §5 Injection Content |
| REQ-05 (Subagent Awareness) | §6 State Tracking | §2 Hook Integration, §5 Injection Content |
| REQ-06 (Dynamic Registration) | §4 Dynamic Registration | §1 Module Organization |

---

## 10. Pattern Conventions

### Naming

- Module files: `kebab-case.ts` (project convention)
- Schema files: `steering-policy.schema.ts` (matches `src/schema-kernel/` pattern)
- Test files: `*.test.ts` under `tests/features/steering-engine/`
- Types: `SteeringContext`, `SteeringCondition`, `SteeringDecision` — prefixed with `Steering` to avoid collision

### Module Size

- Target: ≤400 LOC per module (under the 500 LOC hard cap)
- Policy evaluator: estimated ~250 LOC
- Injection builder: estimated ~200 LOC
- Primitive scanner: estimated ~150 LOC
- Steering state: estimated ~100 LOC

### Barrel Export

`src/features/steering-engine/index.ts` exports the public surface:
`evaluateSteeringPolicy`, `buildSteeringContent`, `scanPrimitives`,
`getSteeringState`, and all types. Hook factories import from the barrel.

### Dependency Direction

```
plugin.ts
  └→ hooks/types.ts (HookDependencies extension)
       └→ features/steering-engine/index.ts (barrel)
            ├→ policy-evaluator.ts (pure logic)
            ├→ injection-builder.ts (pure rendering)
            ├→ primitive-scanner.ts (filesystem read + cache)
            └→ steering-state.ts (CQRS read-side cache)
```

No circular imports. Steering modules never import from hooks or plugin.
