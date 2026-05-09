---
feature: agent-steering-engine
phase: 02-Schema-And-Policy-Design
artifact: SPEC
created: 2026-05-09
status: draft
resolves:
  - O2 (versioning → semver field on SteeringPolicy)
  - O4 (format → Zod schemas, validated at runtime)
depends_on: 01-Research-And-Architecture/RESEARCH.md
traceability: REQ-01 through REQ-06 → schema fields below
---

# Agent Steering Engine — Phase 02 Specification

> Schema and policy design. Defines WHAT schemas exist, WHAT fields they
> contain, and WHAT constraints they enforce. No implementation code.

---

## 1. Steering Policy Schema

Schema format: **Zod** (TypeScript-first), matching project standard and
`src/schema-kernel/` convention. Resolves O4.

### 1.1 Condition Types (Discriminated Union)

Each REQ-01 condition maps to a union variant:

```typescript
import { z } from "zod"

const HierarchyConditionSchema = z.object({
  type: z.literal("hierarchy"),
  match: z.enum(["front-facing", "subagent"]),
})

const DepthConditionSchema = z.object({
  type: z.literal("depth"),
  match: z.enum(["L0", "L1", "L2", "L3"]),
})

const LineageConditionSchema = z.object({
  type: z.literal("lineage"),
  match: z.enum(["hm", "hf"]), // gsd excluded (C3)
})

const TurnsSinceConditionSchema = z.object({
  type: z.literal("turns_since_last"),
  minimum: z.number().int().min(0),
})

const PhaseConditionSchema = z.object({
  type: z.literal("workflow_phase"),
  match: z.enum(["research", "plan", "execute", "verify"]),
})

const CompactionConditionSchema = z.object({
  type: z.literal("compaction_event"),
  match: z.literal(true),
})

const TaskBoundaryConditionSchema = z.object({
  type: z.literal("task_boundary"),
  match: z.literal(true),
})

const SteeringConditionSchema = z.discriminatedUnion("type", [
  HierarchyConditionSchema, DepthConditionSchema, LineageConditionSchema,
  TurnsSinceConditionSchema, PhaseConditionSchema,
  CompactionConditionSchema, TaskBoundaryConditionSchema,
])
```

### 1.2 Injection Surface Enum

```typescript
const InjectionSurfaceSchema = z.enum([
  "messages.transform",    // REQ-02: conditional <system_reminder>
  "session.compacting",    // REQ-03: full context recovery
  "system.transform",      // REQ-04: minimal role marker
])
```

### 1.3 SteeringPolicy (Top-Level)

```typescript
const SteeringPolicySchema = z.object({
  id: z.string().min(1).max(64).regex(/^[a-z0-9][a-z0-9-]*$/),
  name: z.string().min(1).max(128),
  version: z.string().regex(/^\d+\.\d+\.\d+$/).default("1.0.0"), // O2
  conditions: z.array(SteeringConditionSchema).min(0),            // AND logic
  surface: InjectionSurfaceSchema,
  content: SteeringContentSchema,                                  // §3.1
  priority: z.number().int().min(0).max(100).default(50),
  enabled: z.boolean().default(true),
  min_turn_interval: z.number().int().min(0).default(3),          // C5
  max_token_budget: z.number().int().min(0).default(600),
})

type SteeringPolicy = z.infer<typeof SteeringPolicySchema>
```

**Invariants:** AND logic on conditions, semver on version, lineage excludes gsd (C3), cadence ≥ 0 (C5).

---

## 2. Primitive Registration Schema

REQ-06: Dynamic registration reads YAML frontmatter from `.md` files under
`.opencode/` subdirs. RESEARCH.md §2 validated the discovery mechanism.

### 2.1 RegisteredPrimitive Schema

```typescript
const PrimitiveTypeSchema = z.enum(["agent", "skill", "command", "tool", "plugin"])

const RegisteredPrimitiveSchema = z.object({
  type: PrimitiveTypeSchema,
  name: z.string().min(1).max(64),
  description: z.string().optional(),
  mode: z.enum(["subagent"]).optional(),
  lineage: z.enum(["hm", "hf"]).optional(),       // §2.2 inference
  hierarchy: z.enum(["L0", "L1", "L2", "L3"]).optional(), // §2.3 inference
  tools: z.record(z.unknown()).optional(),
  temperature: z.number().min(0).max(2).optional(),
  source_path: z.string(),
  scope: z.enum(["project", "global"]),
})

type RegisteredPrimitive = z.infer<typeof RegisteredPrimitiveSchema>
```

### 2.2 Lineage Inference (from filename prefix)

| Pattern | Result |
|---------|--------|
| `hm-*` | `hm` |
| `hf-*` | `hf` |
| `gsd-*` | **EXCLUDED** at scan time (C3) |
| Other | `undefined` (third-party) |

### 2.3 Hierarchy Inference (agents only)

| Filename contains | Hierarchy |
|-------------------|-----------|
| `l0` or `orchestrator` | `L0` |
| `l1` or `coordinator` | `L1` |
| `l2` | `L2` |
| `l3` | `L3` |
| None matched | `undefined` (front-facing default) |

### 2.4 Discovery Paths (C7: singular + plural dirs)

```typescript
const DISCOVERY_PATHS = {
  agent: [".opencode/agent/", ".opencode/agents/"],
  skill: [".opencode/skills/"],
  command: [".opencode/commands/"],
} as const
```

---

## 3. Injection Content Templates

### 3.1 SteeringContentSchema (union by surface)

```typescript
const MessageTransformContentSchema = z.object({
  template: z.string().max(2000),
  estimated_tokens: z.number().int().min(0).max(200),   // §4.4
})

const SessionCompactingContentSchema = z.object({
  template: z.string().max(4000),
  estimated_tokens: z.number().int().min(0).max(800),    // §4.4
})

const SystemTransformContentSchema = z.object({
  template: z.string().max(200),
  estimated_tokens: z.number().int().min(0).max(50),     // §4.4
})

const SteeringContentSchema = z.union([
  MessageTransformContentSchema,
  SessionCompactingContentSchema,
  SystemTransformContentSchema,
])
```

### 3.2 Template Variables

All templates use `{{variable}}` interpolation.

| Variable | Available on | Source |
|----------|-------------|--------|
| `{{role}}`, `{{hierarchy}}`, `{{depth}}`, `{{lineage}}` | all surfaces | PrimitiveRegistry |
| `{{workflow_phase}}`, `{{active_skills}}`, `{{delegation_chain}}`, `{{parent_agent}}` | messages, compacting | Runtime state |
| `{{task_boundary}}`, `{{turn_number}}` | messages | Delegation/counter |
| `{{max_token_budget}}` | all | Policy field |

### 3.3 Surface-Specific Requirements

**REQ-02 (messages.transform):** `<system_reminder>` block with role + delegation chain. Budget ≤200 tokens. Cadence: every N turns via `min_turn_interval`. MUST NOT mutate existing messages (REQ-02 constraint).

**REQ-03 (session.compacting):** Full context packet (role + hierarchy + workflow phase + delegation chain + active skills). Budget ≤800 tokens. Fires ONLY on compaction event. Pushed to `output.context[]`, not `output.prompt`.

**REQ-04 (system.transform):** Single-line `[role: {hierarchy}-{depth} | lineage: {lineage}]`. Budget ≤50 tokens. Fires on session start. Appends to `output.system[]` — never replaces (C6).

---

## 4. Policy Resolution Algorithm

```
1. Collect enabled policies targeting this surface
2. Sort by priority DESC
3. For each policy:
   a. Evaluate conditions (AND logic)
   b. Check cadence: turns_since_last >= min_turn_interval
   c. Check budget: estimated_tokens <= remaining_budget
   d. If all pass → queue for injection
4. Deduplicate (same rendered content → keep first)
5. Render templates with runtime variables
6. Inject into output surface
```

**Cadence defaults (evidence: RESEARCH.md §5.2):**

| Parameter | Default | Rationale |
|-----------|---------|-----------|
| `min_turn_interval` | 3 | Every 10-15 tool calls ≈ 3-5 turns |
| Compaction recovery | Always fires | Critical — no cadence limit |
| System marker | Always fires | <50 tokens, no fatigue risk |
| Token threshold | 50K tokens | Degradation measurable at ~50K |

**Token budget per invocation:**

| Surface | Budget | Source |
|---------|--------|--------|
| `messages.transform` | 200 tokens | RESEARCH.md §4.4 |
| `session.compacting` | 800 tokens | RESEARCH.md §4.4 |
| `system.transform` | 50 tokens | RESEARCH.md §4.4 |

---

## 5. CQRS Boundary Specification

**Hooks READ** (in-memory, synchronous): session state, registered primitives,
turn counter, active skills, delegation chain, behavioral profile.

**Hooks NEVER write:** no `fs.writeFile`, no `.hivemind/state/` mutation,
no delegation record changes (C4, A9).

**Turn counter lifecycle:**
- Read by hooks (in-memory) → decide injection
- Incremented by `tool.execute.after` (in-memory only)
- Persisted by continuity module during normal save cycle

---

## 6. Versioning and Compatibility

Resolves O2. Schema version is semver (`"1.0.0"` default).

| Change type | Example | Migration required? |
|-------------|---------|-------------------|
| Patch (1.0.x) | New condition types | No — additive |
| Minor (1.x.0) | New fields with defaults | No — additive |
| Major (x.0.0) | Breaking field changes | Yes — migration function |

**Backward compatibility:** Policies without `version` default to `"1.0.0"`.
Missing optional fields use schema defaults. New condition types are opt-in.

---

## 7. Configuration Surface

### 7.1 User Config Format

```typescript
// opencode.json → harness config key
interface HarnessConfig {
  steering?: {
    policies?: SteeringPolicy[]       // merged with defaults
    defaults?: {
      min_turn_interval?: number       // global override
      max_token_budget?: number        // global override
      enabled?: boolean                // global kill switch
    }
  }
}
```

### 7.2 Override Rules

| Operation | Behavior |
|-----------|----------|
| Add policy | Unique `id` → merged with defaults |
| Override default | Same `id` as shipped default → user wins |
| Disable default | Same `id`, `enabled: false` |
| Global disable | `steering.defaults.enabled = false` |

### 7.3 Default Shipped Policies

| ID | Surface | Conditions | Pri | REQ |
|----|---------|-----------|-----|-----|
| `hm-role-reminder` | messages.transform | turns≥3 + subagent | 50 | REQ-02 |
| `hm-compaction-recovery` | session.compacting | compaction=true | 60 | REQ-03 |
| `hm-role-marker` | system.transform | (always) | 40 | REQ-04 |
| `hm-delegation-awareness` | system.transform | subagent | 55 | REQ-05 |

### 7.4 Validation at Load Time

```typescript
const SteeringConfigSchema = z.object({
  policies: z.array(SteeringPolicySchema),
  defaults: z.object({
    min_turn_interval: z.number().int().min(0).default(3),
    max_token_budget: z.number().int().min(0).default(600),
    enabled: z.boolean().default(true),
  }).default({}),
}).default({})
```

Invalid user policies → validation error at load time. No silent ignore.

---

## Traceability

### REQ → Schema Fields

| REQ | Schema field(s) | § |
|-----|-----------------|---|
| REQ-01 | `SteeringPolicySchema.conditions` (7 condition types) | §1.1 |
| REQ-02 | `InjectionSurfaceSchema`="messages.transform", `MessageTransformContentSchema` | §3.1, §3.3 |
| REQ-03 | `InjectionSurfaceSchema`="session.compacting", `SessionCompactingContentSchema` | §3.1, §3.3 |
| REQ-04 | `InjectionSurfaceSchema`="system.transform", `SystemTransformContentSchema` | §3.1, §3.3 |
| REQ-05 | `HierarchyConditionSchema`(subagent), `hm-delegation-awareness` default | §1.1, §7.3 |
| REQ-06 | `RegisteredPrimitiveSchema`, `DISCOVERY_PATHS`, inference rules | §2 |

### Constraints → Design Decisions

| Constraint | How addressed | § |
|------------|--------------|---|
| C1 (src/ only) | Schemas compile into `src/schema-kernel/` or `src/features/steering/` | All |
| C2 (schema-driven) | All policies are Zod-validated data, no hardcoded logic | §1, §7 |
| C3 (gsd excluded) | Lineage enum `["hm","hf"]`; scanner filters gsd-* | §2.2 |
| C4 (CQRS read-only) | Hooks read in-memory; tools own writes | §5 |
| C5 (no fatigue) | `min_turn_interval`, cadence, token budgets | §4 |
| C6 (no hook conflicts) | Templates append, never replace | §3.3 |
| C7 (YAML frontmatter) | Discovery paths scan `.opencode/` subdirs | §2.4 |
| C8 (nothing final) | `status: draft` | Frontmatter |
| C9 (phase artifacts) | This is Phase 02 SPEC.md | Frontmatter |

### Open Questions Resolved

| ID | Resolution |
|----|-----------|
| O2 | Semver field on `SteeringPolicySchema.version` with tiered migration (§6) |
| O4 | Zod (TypeScript-first) — project standard, runtime-validated (§1) |
