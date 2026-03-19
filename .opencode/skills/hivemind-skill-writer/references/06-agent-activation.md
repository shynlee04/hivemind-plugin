# Agent Activation Reference

## Purpose

Agent and sub-agent command activation patterns for domain interconnectedness in HiveMind skill operations.

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

## Domain Interconnectedness Map

```
context-intelligence (Pack 1)│├── Session detection → hivemind-skill-writer routing
├── Delegation detection → subagent spawn decision
└── Context rot detection → recovery skill activationhivemind-skill-writer (Companion Pack)
    │
    ├── skill-audit-hivemind (P3 Specialist)
    │   └── Quality validation for HiveMind skills
    │
    ├── skill-migration-hivemind (P3 Specialist)
    │   └── Cross-pack and cross-framework migration
    │
    └── context-intelligence (P1 integration check)
        └── Verify pack consistency before operations
```

### Integration Points

| Pack | Integrates With | Activation |
|------|----------------|------------|
| context-intelligence | All packs | P1 entry, stacking: 1 |
| hivemind-skill-writer | context-intelligence | Companion, stacking: 0 |
| skill-audit-hivemind | hivemind-skill-writer | P3 specialist on demand |
| skill-migration-hivemind | hivemind-skill-writer | P3 specialist when migrating |

---

## Subagent Spawn Decision Tree

```
Is task single-domain?
├── YES → Primary execution
│└── Execute within current agent context
│
└── NO → Check domain count
    │
    ├── domains == 2
    │   └── Subagent for secondary domain
    │       └── Primary agent handles primary domain
    │           └── Subagent result merged back
    │
    └── domains >= 3└── Multi-agent orchestration
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
└── Stack budget (max3 skills)
```

### When skill-writer Consults context-intelligence

- **Before skill operations**: Check entry state and trust
- **During cross-pack work**: Verify pack consistency
- **After completion**: Validate integration integrity

### Stacking Rules

```
skill-writer (stacking: 0) does NOT count against stackcontext-intelligence (stacking: 1) counts as1 slot
Subagent (stacking: 1) counts as 1 slot

Maximum stack: 3 skills
```

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
User: "Migrate this skill from .claude to .opencode"1. context-intelligence detects migration + cross-framework
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