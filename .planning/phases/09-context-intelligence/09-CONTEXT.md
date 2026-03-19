# Phase 9: Context-Intelligence Skills Package - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning
**Source:** User discussion and session history

---

<domain>

## Phase Boundary

This phase restructures `context-intelligence-entry` from ONE GIANT SKILL into a PACKAGE of multiple small skills with conditional triggering.

**What this phase delivers:**
1. A package structure for context-intelligence (not a single skill)
2. 6 small skills with conditional triggering (hierarchy → session → task → workflow → intent → rot)
3. Each skill small, focused, returns one thing
4. Horizontal coverage across domains
5. User intent detection skill

**What this phase does NOT deliver:**
- Deep analysis on every run (that's conditional)
- Scanning all filesystem (that's expensive)
- Giant token-heavy skill files
- Backwards compatibility with old skill (clean replacement)

---

</domain>

<decisions>

## Implementation Decisions

### Architecture: Package Structure

**Decision:** `context-intelligence/` is a PACKAGE containing 6 SKILLS, not one giant SKILL.md

**Structure:**
```
context-intelligence/           # PACKAGE directory
├── hierarchy-check/
│   ├── SKILL.md               # <100 lines
│   └── references/            # 1-2 files max
├── session-check/
│   ├── SKILL.md
│   └── references/
├── task-check/
│   ├── SKILL.md
│   └── references/
├── workflow-context/
│   ├── SKILL.md
│   └── references/
├── user-intent/
│   ├── SKILL.md
│   └── references/
├── rot-check/
│   ├── SKILL.md
│   └── references/
└── scripts/                   # Shared scripts at package root
    └── context-harness-init.cjs
```

**Rationale:** Based on skill-creator pattern - domain-specific organization with shared scripts.

### Script Organization

**Decision:** One dispatcher script with flags, shared lib modules

**Pattern reference:** GSD's `gsd-tools.cjs` + `lib/` pattern
- `scripts/context-harness-init.cjs` - dispatcher entry
- Could have `scripts/lib/` for focused modules
- Skills invoke with `--mode` flags: `--quick`, `--rot`, `--full`

**Rationale:** GSD pattern works well - single entry point with focused modules. Skills call dispatcher with different flags.

### Skill Cross-Calling

**Decision:** Explicit `skill({ name: "next-skill" })` calls for conditional chain

**Trigger chain:**
```
hierarchy-check → if (no plan found) → skill({ name: "session-check" })
session-check → if (no session found) → skill({ name: "task-check" })
task-check → if (no task found) → skill({ name: "workflow-context" })
workflow-context → if (unclear) → skill({ name: "user-intent" })
user-intent → if (still unclear) → skill({ name: "rot-check" })
rot-check → returns action gates
```

**Rationale:** OpenCode uses on-demand skill loading via `skill()` tool. Explicit calls keep chain clear and discoverable.

### Reference Distribution

**Decision:** Domain-specific, 1-2 references per skill, shared scripts at package root

**Pattern:** Based on skill-creator Pattern 2:
- Each skill owns its references (no sharing)
- References co-located with the skill that needs them
- Package root has shared scripts/ dispatcher
- Max 1-2 reference files per skill

**Rationale:** Progressive disclosure - references loaded only when needed. Domain organization prevents loading irrelevant context.

### Backwards Compatibility

**Decision:** Clean removal - old skill deleted, no deprecation period

**Action:** DELETE `skills/context-intelligence-entry/` entirely, create new `skills/context-intelligence/` package

**Rationale:** All skills are "the same thing" - complete replacement, no migration needed.

### Feature Redesign

**Decision:** ALL feature aspects need redesign:

1. **Check implementations** - Redesign what each skill actually detects
2. **Skill descriptions** - Rewrite trigger descriptions based on skill-creator pattern (description = triggers only, NOT workflow)
3. **Output format** - Redesign JSON output structure
4. **Trigger chain logic** - Redesign conditional chain

**Current implementation issues:**
- Checks are not correct as features
- Skill descriptions may cause under-triggering
- Output format needs alignment with new package structure

### Skill Size Constraint

**Decision:** <100 lines body per SKILL.md

**Pattern:** Progressive disclosure
- Metadata (~100 words) - Always in context
- SKILL.md body (<500 lines ideal, <100 lines target) - In context when triggered
- References - Loaded as needed

### Progressive Disclosure

**Decision:** Three-level loading from skill-creator pattern:
1. **Metadata** (name + description) - Always visible (~100 words)
2. **SKILL.md body** - Loaded when skill triggers (<100 lines)
3. **References** - Loaded as needed by skill

**Key insight from session-ses_2fb9.md:**
- "description = triggers only, NOT workflow"
- Descriptions that summarize workflow cause agents to skip reading the skill body
- Keep descriptions focused on "when to use" symptoms

---

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Skill Creation Pattern
- `skills/skill-creator/SKILL.md` — Skill anatomy, progressive disclosure, domain organization
- `/Users/apple/.agents/skills/skill-creator/SKILL.md` — Full pattern for creating proper skill bundles

### Current Wrong Structure (to replace)
- `skills/context-intelligence-entry/SKILL.md` — Current giant skill (TOO BIG, wrong structure)
- `skills/context-intelligence-entry/scripts/context-harness-init.cjs` — Current detection script
- `skills/context-intelligence-entry/references/` — 5 reference files (to be redistributed)

### Project Context
- `.planning/ROADMAP.md` — Phase 9 definition and dependencies
- `AGENTS.md` — Governance authority for HiveMind

### Session History
- `session-ses_2fb9.md` — Previous attempt patterns, hard stops, skill-creator pattern discovery

---

</canonical_refs>

<code_context>

## Existing Code Insights

### Current Skill Structure (WRONG - to be replaced)
```
skills/context-intelligence-entry/
├── SKILL.md (270 lines - TOO BIG)
├── scripts/
│   └── context-harness-init.cjs (1900 lines)
├── schemas/
│   └── output.schema.ts
└── references/
    ├── context-rot-taxonomy.md
    ├── entry-state-matrix.md
    ├── delegation-scope.md
    ├── trust-matrix.md
    └── platform-surface.md
```

### Issues with Current Implementation
1. **Single giant skill** - Takes too many tokens, no conditional execution
2. **Flat references** - All loaded together, no domain separation
3. **Description issues** - May summarize workflow instead of focusing on triggers
4. **Check implementations** - "Not correct as features" - need redesign

### Skill-Creator Pattern (CORRECT - to follow)
```
skill-name/
├── SKILL.md (<500 lines, frontmatter + body)
└── references/
    ├── domain-a.md (loaded when needed)
    └── domain-b.md (loaded when needed)
```

### GSD Pattern (for scripts)
```
bin/
├── gsd-tools.cjs (dispatcher entry)
└── lib/
    ├── phase.cjs (focused module)
    ├── state.cjs (focused module)
    └── ...
```

### Integration Points
- `skills/context-intelligence-entry/` — TO BE DELETED
- `skills/context-intelligence/` — TO BE CREATED
- OpenCode skill loading — Uses `skill({ name: "skill-name" })` tool
- Progressive disclosure — Three-level loading (metadata → body → references)

---

</code_context>

<specifics>

## Specific Ideas

- Description must be "pushy" - "Make sure to use this skill whenever X" not just "How to X"
- Keep SKILL.md body under 100 lines
- Each skill returns ONE focused thing, not deep analysis
- Conditional chain: only check what's missing (don't run deep if high-level exists)
- Session files belong in `.hivemind/sessions/`, not project root (token bomb prevention)

---

</specifics>

<deferred>

## Deferred Ideas

- Phase 10 integration (related but separate)
- Session file cleanup utility (belongs in separate housekeeping task)
- Document flood cleanup (belongs in separate housekeeping task)
- Detailed check implementations (specified during planning/implementation)

---

</deferred>

---

*Phase: 09-context-intelligence*
*Context gathered: 2026-03-19*