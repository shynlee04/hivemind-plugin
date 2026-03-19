# Agent Activation Reference

## Purpose

Agent and sub-agent command activation patterns for domain interconnectedness in HiveMind skill operations. This reference documents the booster/harness meta-concepts that enable non-breaking intelligence augmentation without governance conflict.

---

## Booster Pattern

### Definition

A **Booster** is a meta-skill that augments agent intelligence without creating governance burden or breaking existing context flows.

### Characteristics

| Property | Value |
|----------|-------|
| **Stacking** | 0 (does not count against 3-skill budget) |
| **Governance Impact** | None (advisory only) |
| **Breaking Change Risk** | None |
| **Activation Overhead** | Minimal |

### Booster Types

| Type | Purpose | Example |
|------|---------|---------|
| Intelligence Booster | Enhances reasoning without changing behavior | `context-rot-recovery` |
| Routing Booster | Improves decision accuracy | `hivemind-skill-writer` |
| Quality Booster | Elevates output standards | `skill-audit-hivemind` |

### Non-Breaking Principles

1. **Advisory, not imperative** — Booster suggestions can be ignored
2. **No hard-state changes** — Booster operations do not mutate persistent state
3. **Opt-in stacking** — Booster patterns explicitly declare 0 stacking cost
4. **No governance conflicts** — Booster output does not override existing governance rules

---

## Harness Pattern

### Definition

A **Harness** provides context enhancement without hard-state architectures. It offers a structured approach to investigation and introspection that can be safely used without permanent side effects.

### Characteristics

| Property | Value |
|----------|-------|
| **Stacking** | 0 for meta-skills, 1 for specialist skills |
| **Context Access** | Read-only inspection |
| **State Mutation** | None |
| **Breaking Change Risk** | None |

### Harness Types

| Type | Purpose | Example |
|------|---------|---------|
| Investigation Harness | Trace and inspect ecosystem state | `hivemind-tools.cjs trace-paths` |
| Session Harness | Inspect session state without mutation | `hivemind-tools.cjs inspect sessions` |
| Integration Harness | Validate cross-pack connections | `hivemind-tools.cjs ecosystem-check` |

### Investigation Harness Integration

The `hivemind-tools.cjs` canonical surface provides deterministic introspection:

#### trace-paths

Trace HiveMind, OpenCode, and runtime paths:

```bash
node bin/hivemind-tools.cjs trace-paths [dir]
```

**Use cases:**
- Discover all HiveMind-related paths in a workspace
- Verify plugin registration and file integrity
- Map runtime dependencies

#### ecosystem-check

Validate skill-pack ecosystem chain:

```bash
node bin/hivemind-tools.cjs ecosystem-check [dir]
```

**Validates:**
- Install integrity
- Init completion
- Config validity
- Brain state
- Hook registration
- Tool availability

#### inspect sessions

Inspect sessions without mutation:

```bash
node bin/hivemind-tools.cjs inspect sessions [dir]
```

**Returns:**
- Session list with status
- Entry state (fresh, resumed, delegated, degraded)
- Trust scores

---

## Stacking Discipline

### Budget Rules

At entry, max **3 skills** may load:

```
context-intelligence (1 slot) — always active
├─ hivemind-skill-writer (0 slots) — meta skill, no cost
├─ delegation-scope (1 slot) — if delegated
└─ workflow-hierarchy (1 slot) — if workflow
    └─ Available: 0-2 slots for specialists
```

### Stacking Matrix

| Skill | Type | Stacking Cost |
|-------|------|---------------|
| `context-intelligence` | P1 Entry | 1 |
| `hivemind-skill-writer` | Meta | 0 |
| `skill-audit-hivemind` | P3 Specialist | 1 |
| `skill-migration-hivemind` | P3 Specialist | 1 |
| `context-rot-recovery` | P3 Specialist | 1 |

### Context Budget Heuristic

```
IF context_depth > 70% → DO NOT LOAD additional skills
IF stack_budget_exhausted → Wait for slot
IF session_degraded → Defer to recovery first
```

---

## Cross-Pack Integration Matrix

| Pack | Integrates With | Activation | Stacking |
|------|----------------|------------|----------|
| `context-intelligence` | All packs | P1 entry | 1 |
| `hivemind-skill-writer` | context-intelligence | Companion | 0 |
| `skill-audit-hivemind` | hivemind-skill-writer | P3 specialist | 1 |
| `skill-migration-hivemind` | hivemind-skill-writer | P3 specialist | 1 |

### Integration Flow

```
context-intelligence (Pack 1)
├── Session detection → hivemind-skill-writer routing
├── Delegation detection → subagent spawn decision
└── Context rot detection → recovery skill activation

hivemind-skill-writer (Companion Pack, stacking: 0)
├── skill-audit-hivemind (P3 Specialist)
│   └── Quality validation for HiveMind skills
├── skill-migration-hivemind (P3 Specialist)
│   └── Cross-pack and cross-framework migration
└── context-intelligence (P1 integration check)
    └── Verify pack consistency before operations
```

---

## Agent Activation Matrix

| Domain | Agent Type | When to Activate | Reason |
|--------|-----------|------------------|--------|
| Skill Quality | Primary | Direct execution, no delegation | Single-domain audit doesn't need subagent |
| Cross-Pack Integration | Subagent | When Pack 1 context-intelligence needed | Requires consultation with entry pack |
| Multi-Framework Audit | Subagent | When .claude/.codex/.cursor surfaces detected | Cross-framework expertise required |
| Skill Migration | Subagent | When refactor affects multiple packs | Coordination across pack boundaries |

---

## Command Activation Patterns

### Pattern: `/gsd-` Commands

```
/gsd-execute-phase → GSD workflow integration
/gsd-plan → Planning workflow activation
/gsd-status → Status check without skill loading
```

**Activation Rules:**
- GSD commands have priority over skill activation
- GSD workflows are session-scoped
- GSD agents may spawn subagents for parallel execution

### Pattern: `/hivemind-` Commands

```
/hm-init → Runtime initialization
/hm-doctor → Health check and diagnostics
/hm-harness → Runtime harness attachment
```

**Activation Rules:**
- HiveMind commands integrate with context-intelligence
- Commands may trigger stacking-safe skill loading
- Commands respect context-intelligence entry state

### Pattern: `/skill-` Commands

```
/skill-audit → Quality evaluation
/skill-create → New skill authoring
/skill-migrate → Cross-pack migration
/skill-package → Pack packaging
```

**Activation Rules:**
- Skill commands route through hivemind-skill-writer
- Create/audit trigger primary execution
- Migrate may trigger subagent for framework detection

---

## Subagent Spawn Decision Tree

```
Is task single-domain?
├── YES → Primary execution
│   └── Execute within current agent context
│
└── NO → Check domain count
    │
    ├── domains == 2
    │   └── Subagent for secondary domain
    │       └── Primary agent handles primary domain
    │           └── Subagent result merged back
    │
    └── domains >= 3
        └── Multi-agent orchestration
            └── Evaluate delegation scope
                └── Spawn appropriate subagent(s)
                    └── Aggregate results
```

### Decision Criteria

| Criterion | Primary Execution | Subagent Required |
|-----------|-------------------|-------------------|
| Domain count | 1 domain | 2+ domains |
| Framework count | 1 framework | 2+ frameworks |
| Pack boundaries | Single pack | Cross-pack operation |
| Context complexity | Low | High |

---

## Command Routing Table

| Command Pattern | Primary Agent | Subagent? | Subagent Type |
|-----------------|--------------|-----------|---------------|
| `skill create` | hivemind-skill-writer | No | N/A |
| `skill audit` | hivemind-skill-writer | Optional | If cross-pack audit needed |
| `skill migrate` | hivemind-skill-writer | Yes | Framework detection subagent |
| `skill package` | hivemind-skill-writer | No | N/A |
| `skill quality` | hivemind-skill-writer | No | N/A |
| `skill refactor` | hivemind-skill-writer | Optional | If affects multiple packs |

---

## Integration with context-intelligence

### How Pack 1 Detects skill-writer Activation

```
context-intelligence monitors:
├── Trigger keywords (write skill, audit skill, etc.)
├── Task domain (skill authoring, quality, migration)
├── Session state (fresh, resumed, delegated, degraded)
└── Stack budget (max 3 skills)
```

### When skill-writer Consults context-intelligence

- **Before skill operations**: Check entry state and trust
- **During cross-pack work**: Verify pack consistency
- **After completion**: Validate integration integrity

---

## Activation Examples

### Example 1: Single-Domain Skill Creation

```
User: "Create a new skill for PDF processing"

1. context-intelligence detects skill authoring intent
2. hivemind-skill-writer activates (stacking: 0)
3. Primary execution - no subagent needed
4. Route to references/01-skill-anatomy.md
5. Follow TDD workflow from references/04-tdd-workflow.md
```

### Example 2: Cross-Pack Migration

```
User: "Migrate this skill from .claude to .opencode"

1. context-intelligence detects migration + cross-framework
2. hivemind-skill-writer activates (stacking: 0)
3. Spawn subagent for framework detection
4. Primary agent handles migration logic
5. Subagent reports framework surface details
6. Consolidate results and validate
```

### Example 3: Multi-Framework Audit

```
User: "Audit skills across .claude, .cursor, and .opencode"

1. context-intelligence detects multi-framework
2. hivemind-skill-writer activates (stacking: 0)
3. Spawn subagent for each framework surface
4. Aggregate audit findings
5. Cross-reference findings
6. Produce consolidated report
```

---

## NO-LOAD Rules

A P1 router must often decide NOT to activate. This is a success case, not a miss.

### DO NOT Activate When

- Context depth exceeds 70% — skill operations will exhaust remaining context
- Session state is "degraded" or "interrupted" — defer to context-rot-recovery first
- Task is trivial (e.g., "fix typo in skill") — no specialist depth needed
- Another hivemind-skill-writer instance is already running — prevent duplicate activation
- Stack budget is exhausted (3 skills already loaded) — wait for slot

### FAIL Signals — Stop Immediately When

- Entry state is "unknown" — cannot safely route without context-intelligence
- Trust score below threshold — skill work may cause harm
- Context rot severity ≥ 7 — degradation will corrupt skill output
- Cross-framework conflict detected — .claude/.codex collision without clear authority

---

## NEVER Do

- **NEVER** spawn subagent for single-domain tasks
- **NEVER** exceed 3-skill stack limit
- **NEVER** bypass context-intelligence check
- **NEVER** ignore entry state before skill operations
- **NEVER** activate P3 specialist without P1/P2 context

## See Also

- `references/03-three-patterns.md` — P1/P2/P3 pattern system
- `references/01-skill-anatomy.md` — Skill structure template
- `../context-intelligence/SKILL.md` — Pack 1 entry routing
