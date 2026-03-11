# Sector H: Skills

> Deep scan of `.opencode/skills/` — 12 skills, 51 files total

## Skill Inventory

| Skill | Purpose | Triggers | Dependencies |
|-------|---------|----------|--------------|
| **entry-resolution** | Universal 6-step entry protocol for session routing | Session start, post-compaction, user pivots | planning-protocol, tdd-gate, spawning-guard, persona-routing, domain-routing, language-adaptation |
| **delegation-framework** | Orchestrates subagent dispatch and validation | Before delegating, parallel vs sequential decisions | spawning-guard (shared with entry-resolution) |
| **platform-adapter** | Maps universal concepts to platform-specific mechanics | When skills reference platform tools, unknown platform | opencode-mechanics, agentic-platforms, editor-platforms |
| **verification-methodology** | Goal-backward analysis for acceptance criteria | Verifying deliverables, phase completion | gate-types |
| **research-methodology** | Structured multi-source investigation | Research tasks, evidence grading | mcp-provider-research (conditional) |
| **meta-builder-governance** | Framework asset evolution rules | Changing agents/commands/skills, compatibility deprecations | skill-audit-protocol |
| **agent-role-boundary** | Diamond role separation enforcement | Defining agent profiles, delegation recursion risk | role-platform-mapping |
| **context-integrity** | Context loss detection and repair | Post-compaction, session gaps, drift signals | repair-checklist |
| **evidence-discipline** | Proof-before-claim enforcement | Completion claims, conflicting instructions, subagent validation | evidence-catalogue |
| **wrong-start-resolver** | Session misroute detection and restart | Wrong lineage/domain/tool, user says "wrong agent" | wrong-start-signals |
| **spec-distillation** | Noisy requirements → structured specs | Contradictory requirements, complex intent routing | ambiguity-taxonomy |
| **ralph-tasking** | Specs → Ralph PRD JSON and beads graphs | Ralph-compatible output needed | prd-json-rules |

## Skill Structure Pattern

Every skill follows a consistent structure:

```
skills/{name}/
├── SKILL.md              # Entry point with frontmatter + core protocol
├── references/           # Conditional-load deep dives
│   ├── {topic}.md        # Loaded when triggered by protocol
│   └── ...
├── templates/            # Fill-in output templates
│   ├── {output}.md       # Copy-paste templates for results
│   └── ...
└── scripts/              # Automation helpers
    ├── {tool}.sh         # Bash scripts
    └── {tool}.mjs        # Node.js scripts
```

### Frontmatter Schema

```yaml
---
name: "skill-name"
description: "When to use and what it provides"
---
```

### Content Structure

1. **Core principle** — One-liner philosophy
2. **When to Use** — Explicit trigger conditions
3. **Platform Adaptation** (if applicable) — Universal vs platform-specific
4. **Protocol/Workflow** — Decision tree or step-by-step
5. **Anti-Patterns** — What NOT to do
6. **Bundled Resources** — Conditional reference loading table

## Entry Resolution Skill (CRITICAL)

> This is the most important skill. It gates ALL session work.

### The 6-Step Conditional Protocol

```
STEP 1: Detect Session State
    Fresh → Full protocol from Step 2
    Ongoing → Skip to Step 3
    Recovery → Re-anchor, then Step 2
    Continuation → Load handoff, Step 3
    Separation → Full protocol from Step 2

STEP 2: Resolve Lineage
    Framework signals → hivefiver
    Product signals → hiveminder
    Unclear → Ask ONE question

STEP 3: Classify Intent
    Framework-meta → hivefiver confirmed
    Product impl → hiveminder confirmed
    Research → Current + research skills
    Ambiguous → Clarify BEFORE routing

    CONDITIONAL LOADS:
    - Complex intent → planning-protocol.md
    - Delegation needed → spawning-guard.md
    - First session → persona-routing.md
    - Cross-domain → domain-routing.md

STEP 4: Assess Clarity
    Clear → Step 5
    Mostly clear → Proceed, document assumptions
    Unclear → Ask ONE question
    Contradictory → Present to user

    Non-English → language-adaptation.md

STEP 5: Route to Orchestrator
    Lineage matches → Proceed
    Mismatch → wrong-start-resolver

STEP 6: Gate Delegation Readiness
    [ ] Intent classified
    [ ] Lineage confirmed
    [ ] Complexity assessed
    [ ] Session continuity checked
    [ ] Delegation packet ready
    [ ] Intelligence export planned
```

### Why Entry-Resolution Is Critical

1. **Prevents wrong-starts** — Catches lineage mismatches before work begins
2. **Optimizes context** — Only loads triggered references
3. **Enforces discipline** — Forces clarity before action
4. **Routes persona** — Connects user type to governance level
5. **Maps to PLAN.md** — Activates at Step 1 (Expand)

## Delegation Framework

### Pre-Delegation Readiness Guard

ALL must be confirmed before delegating:

1. Intent classified (not assumed)
2. Lineage confirmed (not defaulted)
3. Complexity assessed (independent? dependent? unknown?)
4. Session continuity checked
5. Packet complete (objective, scope, constraints, criteria, format)
6. Intelligence export planned

### Parallel vs Sequential Decision

```
Default: SEQUENTIAL

Can subtask N succeed without M's output?
├── YES for ALL → PARALLEL allowed (if no shared state mutation)
└── NO for ANY → SEQUENTIAL required
```

### Delegation Packet Schema

| Field | Required | Description |
|-------|----------|-------------|
| Objective | ✅ | WHAT to accomplish (not HOW) |
| Scope | ✅ | Explicit boundaries (in/out) |
| Constraints | ✅ | Time, token, file, architecture limits |
| Acceptance Criteria | ✅ | How to verify success |
| Output Format | ✅ | Expected result structure |
| Context Payload | ⚠️ | Decisions, prior art, risks |
| Anti-Constraints | ⚠️ | What NOT to do |

### Post-Return Validation

```
Subagent returns
├── Contains failure signals? → Record FAILURE
├── Result is vague? → Request specifics
└── Can verify? → Run verification → Record outcome
```

## Platform Adapter

### Platform Detection

```
Task() or skill() available?
  → OpenCode → load opencode-mechanics.md

run_command + view_file + browser_subagent?
  → Antigravity → load agentic-platforms.md

run_command + view_file + task_boundary (no browser_subagent)?
  → Claude Code → load agentic-platforms.md

run_command + view_file (no task_boundary)?
  → Codex → load agentic-platforms.md

IDE integration detected?
  → Cursor/Windsurf/Kilo Code → load editor-platforms.md
```

### Universal Concepts (Platform-Independent)

| Concept | Meaning |
|---------|---------|
| Load a skill | Read and follow instructions |
| Delegate | Hand off subtask to another agent |
| Execute | Run command or modification |
| Verify | Prove work with evidence |
| Persist state | Save info across sessions |
| Search | Find files or content |

### Philosophy Regulation Layer

When platform mechanics conflict with framework philosophy, **philosophy wins:**

| Conflict | Resolution |
|----------|------------|
| Auto-execute | Gate first |
| Skip verification | Always verify |
| Bypass delegation guard | Guard before spawn |
| Override user intent | Clarify, don't infer |

## Verification Methodology

### Goal-Backward Analysis

Traditional: "What was done?"
Goal-backward: "What SHOULD be true?" → trace backward

### Process

1. Extract acceptance criteria from planning artifact
2. Define evidence for each criterion (command output, file existence, pattern)
3. Collect evidence by running commands
4. Map evidence to criteria
5. Produce verdict: PASS | FAIL | INCONCLUSIVE

### The Five Gates (from PLAN.md §9)

| Gate | Question |
|------|----------|
| Runtime Authority | Is owner the ONLY active authority? |
| Donor | Does logic work WITHOUT .opencode dependency? |
| Drift | Do src and dist agree on behavior? |
| State | Are .hivemind stores correctly classified? |
| Regression | Do boundary tests still hold? |

## Research Methodology

### Question Framing

1. Identify core knowledge gap
2. Decompose into 3-5 sub-questions
3. Define satisfactory answer for each
4. Identify source type: code | docs | web

### Evidence Collection Order

```
1. Repomix (code)        → ground truth
2. Context7 (docs)       → intended behavior
3. Tavily/Exa (web)      → corroboration
```

### Confidence Scoring

| Level | Meaning |
|-------|---------|
| High | Multiple corroborating sources, recent, direct |
| Partial | Single reliable source or strong inference |
| Low | Inference without direct evidence, stale sources |

### Retry Contract

- Up to 10 iterations for contradiction resolution
- At iteration 10: force explicit caveat block

## Meta-Builder Governance

### Authority Hierarchy

```
skills/              ← SOURCE OF TRUTH (root)
  ↓ mirrors to
.opencode/skills/    ← PLATFORM MIRROR (overwritten on init)
  ↓ adapts to
.agent/skills/       ← ADAPTER SURFACE (Claude Code/Antigravity)
.agents/skills/      ← ADAPTER SURFACE (Codex)
```

### Rules

1. **Root authority** — Changes start in root, mirrors follow
2. **No phantom entries** — Every registry entry must have SKILL.md
3. **Mirror vulnerability** — .opencode/skills is overwritten on init
4. **Adapter freedom** — Platform dirs may have adaptations

### Compatibility Window Protocol

| Phase | Duration | Action |
|-------|----------|--------|
| Announce | Immediate | Add deprecation notice |
| Dual support | 1 full cycle | Old AND new work |
| Migration | During dual | Consumers update |
| Remove | After cycle | Old contract removed |

### Framework-Only Boundary

Meta-builders work on: ✅ Skills, agents, commands, workflows, governance
Meta-builders NEVER work on: ❌ Product features, bug fixes, configuration

## Skill Activation Flow

### PLAN.md Protocol → Skill Activation Map

| Step | Phase | Primary Skill | Supporting |
|:---:|---|---|---|
| 1 | Expand | entry-resolution | platform-adapter |
| 2 | Investigate | research-methodology | context-integrity |
| 3 | Research Detail | research-methodology | evidence-discipline |
| 4 | Decision | agent-role-boundary | spec-distillation |
| 5 | Sub-Plan | delegation-framework | ralph-tasking |
| 6 | Authorize | — (human gate) | wrong-start-resolver |
| 7 | Execute | delegation-framework | agent-role-boundary, evidence-discipline |
| 8 | Gatekeeping | verification-methodology | evidence-discipline |
| 9 | Atomic Commit | evidence-discipline | context-integrity |

### Skill Ladder Architecture

```
┌─────────────────────────────────────────────┐
│  External Skill Ladder (loaded progressively) │
│  using-superpowers → brainstorming → spec...  │
├─────────────────────────────────────────────┤
│  Root Governance Layer (always active)        │
│  entry-resolution, agent-role-boundary,       │
│  delegation-framework, evidence-discipline,   │
│  verification-methodology, context-integrity, │
│  platform-adapter, wrong-start-resolver       │
├─────────────────────────────────────────────┤
│  Domain Skills (loaded by lineage/intent)     │
│  meta-builder-governance, spec-distillation,  │
│  ralph-tasking, research-methodology          │
└─────────────────────────────────────────────┘
```

## Cross-Sector Dependencies

### Skills → Commands

- Skills may be invoked by slash commands
- Commands provide user-facing entry points
- Skills provide the protocol implementation

### Skills → Agents

- `entry-resolution` routes to correct orchestrator lineage
- `agent-role-boundary` defines what each agent type can do
- `delegation-framework` governs subagent dispatch

### Skills → Tools

- `platform-adapter` maps concepts to platform tools
- Scripts in skills/ provide automation helpers
- MCP providers used by `research-methodology`

### Skills → Governance Documents

- PLAN.md defines the 9-step protocol
- Skills implement each protocol step
- Registry.yaml provides skill discovery

## Knowledge Gaps

### What's Clear

1. **Entry resolution flow** — 6-step conditional protocol is well-documented
2. **Delegation framework** — Packet schema, parallel/sequential, validation
3. **Platform adaptation** — Detection and mechanic mapping
4. **Verification gates** — 5 gate types, goal-backward analysis
5. **Role boundaries** — Diamond model, permissions matrix

### What's Unclear

1. **Skill loading mechanism** — How does `skill("name")` actually resolve? Is there a registry?
2. **Conditional loading implementation** — How are references loaded "conditionally"? Manual read?
3. **Spawning guard duplication** — entry-resolution and delegation-framework both reference spawning-guard.md
4. **Persona routing storage** — Where is the resolved lane cached?
5. **Export cycle implementation** — How does `export_cycle()` actually work?
6. **Registry.yaml location** — Referenced but not found in scanned files

### Recommended Follow-ups

1. Scan for `registry.yaml` to understand skill discovery
2. Check `.opencode/config.json` for platform configuration
3. Look for `export_cycle` implementation in tools
4. Verify persona routing caching mechanism
5. Map skill dependencies to actual file references

## File Statistics

| Category | Count |
|----------|-------|
| SKILL.md files | 12 |
| Reference files | 18 |
| Template files | 9 |
| Script files | 4 |
| **Total** | **51** |

## Appendix: Skill File Tree

```
.opencode/skills/
├── agent-role-boundary/
│   ├── SKILL.md
│   ├── references/role-platform-mapping.md
│   └── templates/role-declaration.md
├── context-integrity/
│   ├── SKILL.md
│   ├── references/repair-checklist.md
│   └── templates/context-recovery-report.md
├── delegation-framework/
│   ├── SKILL.md
│   ├── references/spawning-guard.md
│   └── templates/delegation-packet.md
├── entry-resolution/
│   ├── SKILL.md
│   ├── references/
│   │   ├── domain-routing.md
│   │   ├── language-adaptation.md
│   │   ├── persona-routing.md
│   │   ├── plan-protocol-map.md
│   │   ├── planning-protocol.md
│   │   ├── spawning-guard.md
│   │   └── tdd-gate.md
│   └── templates/entry-resolution-output.md
├── evidence-discipline/
│   ├── SKILL.md
│   ├── references/evidence-catalogue.md
│   └── templates/evidence-report.md
├── meta-builder-governance/
│   ├── SKILL.md
│   ├── references/
│   │   ├── audit-checklist.md
│   │   ├── skill-audit-protocol.md
│   │   └── skill-source-links.md
│   ├── scripts/audit-skill-coverage.sh
│   └── templates/skill-audit-report.md
├── platform-adapter/
│   ├── SKILL.md
│   └── references/
│       ├── agentic-platforms.md
│       ├── editor-platforms.md
│       └── opencode-mechanics.md
├── ralph-tasking/
│   ├── SKILL.md
│   ├── references/prd-json-rules.md
│   ├── scripts/
│   │   ├── todo-to-prd-json.mjs
│   │   └── validate-prd-json.mjs
│   └── templates/prd-json-flat.md
├── research-methodology/
│   ├── SKILL.md
│   ├── references/
│   │   ├── mcp-provider-research.md
│   │   └── provider-matrix.md
│   ├── scripts/
│   │   ├── check-mcp-readiness.mjs
│   │   └── score-confidence.sh
│   └── templates/evidence-table.md
├── spec-distillation/
│   ├── SKILL.md
│   ├── references/ambiguity-taxonomy.md
│   ├── scripts/extract-requirements.sh
│   └── templates/spec-candidate.md
├── verification-methodology/
│   ├── SKILL.md
│   ├── references/gate-types.md
│   └── templates/verification-report.md
└── wrong-start-resolver/
    ├── SKILL.md
    ├── references/wrong-start-signals.md
    └── templates/restart-message.md
```

---

*Deep scan completed: 2024-01-XX*
*Files scanned: 51*
*Skills catalogued: 12*
