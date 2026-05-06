# Architecture Patterns: Runtime Taxonomy for Agent Harnesses

**Domain:** Agent harness runtime classification
**Researched:** 2026-04-25

## Recommended Architecture: Two-Layer Classification

```
┌─────────────────────────────────────────────────────┐
│ Layer 1: HARNESS (model-routing)                    │
│                                                      │
│  category: string → model + temperature + tools      │
│  e.g., "deep" → claude-opus-4-6, temp=0.3            │
│  e.g., "quick" → claude-haiku-4-5, temp=0.5          │
│                                                      │
│  Concern: Which model handles this delegation?        │
│  NOT: What type of project is this?                   │
│  NOT: What language/framework is in use?              │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│ Layer 2: INSTRUCTION (project-context)               │
│                                                      │
│  AGENTS.md → project type, conventions, structure    │
│  opencode.json → permissions, skills, commands       │
│  skills/ → domain-specific behavior                  │
│                                                      │
│  Concern: How should the agent behave in THIS repo?  │
│  This is user-configurable, not harness-enforced.    │
└─────────────────────────────────────────────────────┘
```

### Component Boundaries

| Component | Responsibility | Belongs To |
|-----------|---------------|------------|
| DelegationCategory | Model-routing + prompt append | Harness (Layer 1) |
| Category prompt appends | Behavioral hints per category | Harness (Layer 1) |
| Session category registry | Track category per session | Harness (Layer 1) |
| Project type | Detect monorepo/library/CLI/... | Instruction (Layer 2) |
| Task type | research/plan/implement/review | Emergent from workflow |
| Language/framework | TypeScript, Python, React, ... | Instruction (Layer 2) |

### Data Flow

```
User request → Orchestrator
  ├─ Determines category (model-routing)
  ├─ Builds prompt (injects AGENTS.md context)
  ├─ Dispatches to agent with category + context
  └─ Agent operates with both model config + project context
```

## Patterns to Follow

### Pattern 1: Category-First Dispatch (from OMO)
**What:** Category string determines model, temperature, tools, and prompt append
**When:** Every delegation needs model selection
**Example (OMO's approach, simplified):**
```typescript
const DEFAULT_CATEGORIES: Record<string, CategoryConfig> = {
  ultrabrain: { model: "openai/gpt-5.4", variant: "xhigh" },
  deep:       { model: "openai/gpt-5.3-codex", variant: "medium" },
  plan:       { model: "anthropic/claude-opus-4-6", variant: "max" },
  quick:      { model: "anthropic/claude-haiku-4-5" },
}
```

### Pattern 2: Instruction-Layer Project Context (from OpenCode)
**What:** AGENTS.md + opencode.json define project-specific behavior
**When:** Always — agents read these at session start
**Key insight:** OpenCode's `/init` command scans the repo and generates AGENTS.md. The harness doesn't need to detect project type — it just needs to ensure agents have access to instruction files.

### Pattern 3: Workflow-Driven Task Types (from GSD)
**What:** Task type emerges from workflow phase, not a classification system
**When:** Planning, implementing, reviewing
**Example:** GSD uses phase names (discuss, plan, execute, verify). These ARE the task types. No separate taxonomy needed.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Project-Type Detection in Harness
**What:** Building project-type detection (monorepo/library/CLI) into the harness runtime
**Why bad:** Violates separation of concerns. Harness routes to models; project context belongs in instruction layer. Every project is different, and hardcoding types creates maintenance burden.
**Instead:** Document AGENTS.md patterns for common project types. Let users declare their project type.

### Anti-Pattern 2: Task-Type Enum in Harness
**What:** Adding `taskType: "research" | "plan" | "implement" | "review"` to delegation metadata
**Why bad:** Category already serves this purpose for model-routing. Adding a parallel dimension creates confusion about which to use. GSD proves task types emerge naturally from workflow phases.
**Instead:** Use category for model-routing. Let workflow phases define task types declaratively.

### Anti-Pattern 3: Language/Framework Dimension in Harness
**What:** Adding `language: "typescript" | "python"` to delegation dispatch
**Why bad:** This is instruction-layer context, not routing logic. The model doesn't change based on language — the agent's instructions do.
**Instead:** Ensure AGENTS.md captures language/framework conventions. Agents read this at session start.

## Scalability Considerations

| Concern | At 5 categories | At 20 categories | At 50 categories |
|---------|----------------|------------------|------------------|
| Model routing | Simple map | Needs grouping | Needs hierarchy |
| Prompt appends | Static file | Configurable | User-overridable |
| Fallback chains | Manual | Per-category | Auto-generated |

**Recommendation:** Stay at 6-8 categories. Don't scale to 50. OMO's 8 is the practical maximum before the system becomes harder to configure than to use.

## Sources

- OMO source code (verified via repomix reference)
- OpenCode DeepWiki (verified)
- OpenAI Harness Engineering blog (2026)
- Agent Harness Survey (Preprints.org, 2026)
- ICIR 2026 Workshop on Agents in the Wild
