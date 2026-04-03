# HiveMind v3 Compatibility

How the meta-builder skill aligns with the HiveMind v3 clean architecture. This document maps meta-builder concepts to HiveMind's architectural principles and identifies bridging points.

---

## HiveMind v3 Architecture Overview

HiveMind v3 is a clean, modular architecture for multi-agent coding platforms. It consolidates patterns from harness-experiment (~2,300 LOC) with features from product-detox (~15,000 LOC), targeting ~4,000-5,000 LOC total.

**Key architectural principles:**
- Code vs configuration boundary
- CQRS enforcement (tools = write, hooks = read)
- Single source of truth per concern
- Max module size: 500 LOC
- Plugin entry: <100 LOC (assembly only)
- No circular dependencies

---

## Alignment Matrix

### 1. Skills as Configuration

**HiveMind Principle:** "CAN BE CONFIGURATION: Skill definitions (markdown in `skills/`)"

**meta-builder Implementation:**
- All skills are pure markdown (SKILL.md + references/)
- No runtime dependencies — no TypeScript, no compiled code
- Skills are declarative instructions, not executable logic
- Frontmatter provides machine-readable metadata for discovery

**Bridge Point:** Skills in meta-builder can be placed in any of the supported locations:
- `.opencode/skills/<name>/SKILL.md` (OpenCode native)
- `.agents/skills/<name>/SKILL.md` (universal)
- `.claude/skills/<name>/SKILL.md` (Claude Code compatible)

### 2. Tools as Write Side

**HiveMind Principle:** "Tools (Write Side): Create/update/delete state, Execute commands, Trigger workflows"

**meta-builder Implementation:**
- meta-builder itself does NOT execute — it routes and delegates
- When skills guide tool usage, they guide the write side
- Custom tools (`.opencode/tools/`) are the actual write-side implementation
- Skills provide the methodology; tools perform the mutation

**Bridge Point:** The `use-authoring-tools` skill (future) will bridge skill authoring with custom tool creation, ensuring tools follow the same quality gates as skills.

### 3. Hooks as Read Side

**HiveMind Principle:** "Hooks (Read Side): Inject context into messages, Observe tool execution, Track session events"

**meta-builder Implementation:**
- Skills instruct the Agent on what to observe and when
- The `planning-with-files` skill's cross-platform hooks demonstrate this pattern
- Hooks inject skill state into context (e.g., current phase from `task_plan.md`)
- Skills define the observation rules; hooks implement them

**Bridge Point:** Skills can reference hook configurations in their `references/` files, providing the read-side implementation guidance.

### 4. CQRS Enforcement

**HiveMind Principle:** Clear separation between Command (write) and Query (read) operations.

**meta-builder Implementation:**

| CQRS Layer | meta-builder Role |
|------------|-------------------|
| **Command (Write)** | Skills guide what to write; tools execute the write |
| **Query (Read)** | Skills guide what to observe; hooks implement the observation |
| **Assembly** | meta-builder routes between command and query skills |

**Example Flow:**
```
User: "Create a skill and audit existing ones"
  → meta-builder routes to:
    Command: use-authoring-skills (creates new skill)
    Query: use-authoring-skills audit mode (reads existing skills)
  → coordinating-loop manages parallel execution
  → planning-with-files persists state
```

### 5. Code vs Configuration Boundary

**HiveMind Principle:** "MUST BE CODE: Plugin assembly, Tool execution, State persistence. CAN BE CONFIGURATION: Agent definitions, Command bundles, Workflow templates, Skill definitions."

**meta-builder Implementation:**
- meta-builder is 100% configuration (markdown + shell scripts)
- Shell scripts are validation utilities, not business logic
- Business logic lives in the HiveMind TypeScript modules
- Skills reference the code modules but do not duplicate them

**Boundary Enforcement:**
```
meta-builder (configuration)
  ├── SKILL.md → routing instructions (markdown)
  ├── references/ → concept documentation (markdown)
  └── scripts/ → validation utilities (bash)

HiveMind (code)
  ├── src/tools/ → tool implementations (TypeScript)
  ├── src/hooks/ → hook implementations (TypeScript)
  └── src/plugin/ → assembly (<100 LOC)
```

---

## Module Mapping

How meta-builder skills map to HiveMind v3 modules:

| meta-builder Skill | HiveMind Module | Relationship |
|--------------------|-----------------|-------------|
| `meta-builder` | `src/control-plane/primitives.ts` | Both are routing/orchestration layers |
| `use-authoring-skills` | `src/shared/opencode-skill-registry.ts` | Skill creation ↔ skill registry |
| `user-intent-interactive-loop` | `src/hooks/start-work/` | Intent capture ↔ session entry |
| `coordinating-loop` | `src/delegation/delegation-router.ts` | Coordination ↔ delegation routing |
| `planning-with-files` | `src/continuity/state-store.ts` | Persistent memory ↔ state persistence |

---

## Dependency Graph Alignment

### HiveMind v3 Dependency Graph

```
plugin (assembly)
  ├── tools (write side)
  ├── hooks (read side)
  ├── cli (command interface)
  └── control-plane (primitives)
       ├── lifecycle (session management)
       ├── delegation (routing & packets)
       └── continuity (state persistence)
            └── shared (leaf module)
```

### meta-builder Dependency Graph

```
meta-builder (orchestrator)
  ├── GROUP 1: Implementation skills
  │   ├── user-intent-interactive-loop
  │   ├── coordinating-loop
  │   └── planning-with-files
  ├── GROUP 2: Domain authoring skills
  │   ├── use-authoring-skills
  │   └── [future: agents, commands, tools, workflows]
  └── GROUP 3: Shared concepts (OpenCode meta concepts)
```

**Alignment:** Both graphs follow the same pattern — a thin orchestrator layer that delegates to specialized modules, with shared concepts at the leaf level.

---

## Non-Breaking Change Strategy

meta-builder is designed for additive, non-breaking evolution:

### Additive Changes (Safe)
- Adding new GROUP 2 skills (agents, commands, tools, workflows)
- Adding new reference files to `references/`
- Adding new OpenCode concept mappings
- Adding new stacking patterns

### Non-Breaking by Design
- Skills are discovered by name — adding a new skill doesn't affect existing ones
- Reference files are independent — adding a new reference doesn't break existing links
- Stacking rules are permissive — new patterns don't invalidate old ones
- Routing is adaptive — new trigger phrases don't break existing classifications

### Breaking Changes (Require Migration)
- Renaming an existing skill (breaks references)
- Changing frontmatter schema (breaks discovery)
- Removing a reference file (breaks links)
- Changing terminology mandate (breaks consistency)

---

## Migration Path

For projects transitioning from harness-experiment to HiveMind v3:

### Phase 1: Deploy Skills First
- Deploy meta-builder and GROUP 1/2 skills as markdown
- No TypeScript changes needed — skills work independently
- Validate skill loading and routing

### Phase 2: Align Tool Definitions
- Ensure custom tools follow HiveMind's `tool()` helper pattern
- Map existing tool budgets to HiveMind's permission system
- Validate tool execution through HiveMind's write-side hooks

### Phase 3: Integrate Hooks
- Configure hooks to inject skill state into context
- Map skill observation rules to hook implementations
- Validate read-side behavior through HiveMind's hooks

### Phase 4: Full Integration
- Deploy HiveMind v3 TypeScript modules
- Skills reference HiveMind modules for deep implementation details
- Validate end-to-end: skill routing → tool execution → hook observation

---

## Compatibility Checklist

Before declaring meta-builder compatible with HiveMind v3:

| Check | Status | Notes |
|-------|--------|-------|
| Skills are pure markdown | ✅ | No runtime dependencies |
| Shell scripts are validation-only | ✅ | No business logic |
| Terminology is universal | ✅ | "Agent" not "Claude" |
| No platform-specific commands | ✅ | OpenCode is reference, not requirement |
| Frontmatter is spec-compliant | ✅ | name + description only |
| No `compatibility` field | ✅ | User explicitly banned it |
| Reference files exist | ✅ | All 4 references present |
| No circular dependencies | ✅ | Skills reference downward only |
| Scripts are portable | ✅ | Pure bash, no platform-specific features |

---

## Cross-References

| Reference | Relationship |
|-----------|-------------|
| `references/01-routing-logic.md` | How routing maps to HiveMind's delegation router |
| `references/02-opencode-concepts.md` | How OpenCode concepts map to HiveMind modules |
| `references/03-stacking-rules.md` | How stacking aligns with HiveMind's CQRS pattern |
| `SKILL.md` (parent) | The HiveMind alignment summary |
| `docs/draft/architecture-proposal-hivemind-v3.md` | Full HiveMind v3 architecture specification |
