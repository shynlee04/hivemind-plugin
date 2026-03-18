# HiveMind Skill Module Architecture

**Last updated:** 2026-03-19  
**Status:** Planning architecture  
**Planning posture:** Broad at entry, conditional in branching, specialist only when justified

## 1. Mission

HiveMind needs a skill-pack architecture that improves context reliability across front-facing agents, delegated subagents, mixed platform surfaces, and long-running sessions without recreating the rigid, noisy governance patterns that were previously denoised.

The architecture must therefore do two things at once:

1. protect agents and users from context rot, polluted governance, false authority, and framework collisions
2. preserve enough flexibility that the pack system still works across different model families, workflows, and IDE environments

## 2. Design Drivers

The architecture in this module is driven by five constraints surfaced across the draft notes and audit work:

- Entry is not a single moment; it includes fresh starts, resumed sessions, mid-session continuation, post-cancel continuation, and delegated subagent starts.
- Context degradation grows as the session accumulates tools, outputs, interruptions, and delegation.
- Multiple platform surfaces can all look authoritative even when they are only mirrors, projections, or stale donors.
- Pack loading has a real budget; the entry layer cannot consume the whole context window.
- The skill system must remain non-breaking for user workflows and project packaging.

## 3. Three-Pattern Pack Model

### Pattern 1: High-Level Routing Pack

| Property | Decision |
|----------|----------|
| Role | Must-load entry router and context-defense frame |
| Scope | Broad, shallow, session-aware |
| Current pack | `context-intelligence` |
| Allowed depth | Thin `SKILL.md`, with heavier content deferred to references/scripts/templates |

Pattern 1 exists to classify the session before any specialist branch is loaded. It answers questions such as:

- what kind of entry is this
- is the agent delegated
- is the context clean, degraded, or polluted
- which authority surface is most trustworthy
- is a second or third pack justified yet

### Pattern 2: Domain And Classification Packs

| Property | Decision |
|----------|----------|
| Role | Narrow the active domain, workflow, or context class |
| Scope | Mid-depth branch packs |
| Typical outputs | Checklists, templates, references, bounded scripts |
| Example branches | delegation intelligence, workflow coordination, AGENTS maintenance, research synthesis |

Pattern 2 exists when the session is no longer asking “what kind of situation am I in?” and is instead asking “what kind of work am I already doing?”

### Pattern 3: Vertical Specialist Packs

| Property | Decision |
|----------|----------|
| Role | Handle fragile or expert-only specialist work |
| Scope | Deep but narrow |
| Typical outputs | Specialist procedures, evaluation harnesses, migration protocols |
| Example branches | skill auditing, pack migration, framework-specific maintenance |

Pattern 3 should load only after Pattern 1 or Pattern 2 has narrowed the problem enough that the specialist depth will not overwhelm the session.

## 4. Pack Hierarchy

| Layer | Purpose | Current intent |
|-------|---------|----------------|
| Entry layer | Context defense and routing | `context-intelligence` |
| Coordination layer | Delegation, workflow, artifact, and hierarchy coordination | later Pattern 2 branches |
| Specialist layer | Meta-builder, audit, migration, evaluation | later Pattern 3 packs |

The architecture assumes the entry layer stays load-attractive and load-cheap. If it becomes too ceremonial, users and agents will avoid it, which defeats Pack 1’s purpose.

## 5. Session Taxonomy

| Session situation | Meaning | Architecture response |
|-------------------|---------|-----------------------|
| Fresh | First meaningful entry in a clean session | Load Pattern 1 only |
| Resumed | Session continues after a gap or compaction | Load Pattern 1, verify continuity, then decide on deeper load |
| Delegated | Agent is a child of another session | Load Pattern 1 with delegated-aware branch posture |
| Degraded | Context gaps or drift are visible | Load Pattern 1, then context-rot branch if required |
| Interrupted | User cancelled or the session stopped mid-flow | Reconstruct from latest trusted human request plus stable authority surfaces |
| Recovered | Session has been rebuilt after disruption | Keep Pattern 1 active until the situation is stable again |

## 6. Context Rot Architecture

The pack system treats context failure as an architecture problem, not just a writing-quality problem.

### Rot Dimensions

| Dimension | What it measures |
|-----------|------------------|
| Governance ambiguity | Conflicting or nested instructions competing for authority |
| Deterministic enforcement risk | Tests, scripts, hooks, or configs that can force wrong behavior |
| Load pressure | Surfaces that auto-load or look like they must be obeyed |
| Action enablement | Ability of bad context to trigger wrong edits, deletion, or delegation |
| Propagation breadth | How many layers inherit the bad signal |
| Freshness and time conflict | Whether same-level entities disagree and one may be stale |

### Rot Response Posture

- Clean or low-risk situations should keep the entry pack broad and concise.
- Suspect or degraded situations should load recovery references before specialist packs.
- Polluted or poisoned situations should favor stop-and-confirm behavior for high-impact actions.

## 7. Degree Of Freedom Model

The pack system should use different levels of guidance strength depending on fragility.

| Freedom level | When to use it | Example in this module |
|---------------|----------------|------------------------|
| High | Multiple valid approaches exist | broad entry guidance, principle-driven reading |
| Medium | Preferred patterns exist but adaptation is normal | workflow or delegation branches |
| Low | The path is fragile and must be predictable | naming rules, evaluation protocol, non-breaking packaging rules |

This model keeps Pack 1 readable while still allowing stricter control where mistakes are expensive.

## 8. Skill-Package Shape

Every future pack in this module should assume the same shape unless there is a strong reason to differ:

```text
skill-name/
├── SKILL.md
├── references/
├── scripts/
├── templates/ or assets/ when justified
└── optional examples or diagrams only when they materially reduce ambiguity
```

### Shape Rules

- `SKILL.md` should carry the broad workflow and selection logic.
- `references/` should hold the conditional depth.
- `scripts/` should default to discovery and exploration, not mutation.
- `templates/` or `assets/` should exist only when the pack needs deterministic reusable structure.

## 9. Companion Pack Boundary

The companion pack is intentionally separate from `context-intelligence`.

| Pack | Why it exists |
|------|---------------|
| `context-intelligence` | must-load entry routing and context defense |
| `meta-builder-hivemind` / `hivemind-skill-writer` | authoring, auditing, refactoring, packaging, and later migration control for HiveMind-specific skills |

The companion pack should bundle:

- Context-Intelligence framing as required background
- skill-writing guidance
- skill-audit guidance
- HiveMind-specific packaging and conflict-avoidance rules
- evaluation readiness and TDD lane references

It should not replace the entry pack.

## 10. Cross-Framework Surface Model

The architecture explicitly expects mixed platform surfaces.

| Surface family | Architecture stance |
|----------------|---------------------|
| `.opencode` | Primary local ecosystem, but not automatically the only context source |
| `.agent`, `.claude`, `.codex`, `.qwen`, `.roo`, `.cursor`, `.gemini`, others | Detect as variants and compatibility surfaces |
| `.hivemind`, `dist` | Generated or runtime surfaces, not direct authoring authority |
| Root and nested governance docs | Evaluate by scope, freshness, and real authority, not mere presence |

The architecture must teach agents to recognize these surfaces without over-trusting them.

## 11. Non-Breaking Operational Rules

- Prefer stable names once accepted.
- Keep frontmatter non-breaking.
- Keep references one level deep from the main `SKILL.md`.
- Use TOCs and jump links for long references.
- Prefer regex and pattern families over hardcoded paths.
- Prefer read-only discovery scripts first.
- Treat time and date as part of authority resolution, not decoration.
- Favor atomic commits and worktree isolation when the work later turns executable.

## 12. Anti-Patterns

- One giant master skill that tries to own every pack, branch, and specialist path
- Cross-framework copying without adaptation
- Entry packs that force deep protocol every single turn
- Branch packs that repeat entry-level instructions instead of assuming Pack 1 is already loaded
- Evaluation rules that are impossible to run or too vague to score
- Specialist packs that implicitly change project authority just by existing

## 13. External Pattern Anchors

This architecture is informed by four live skill-authoring references validated on 2026-03-19:

- Vercel Labs `skill-creator` for progressive disclosure and degree-of-freedom framing
- Softaworks `skill-judge` for knowledge-delta and anti-pattern scoring
- Obra `writing-skills` for TDD-style baseline-versus-with-skill evaluation
- Anthropic `skill-creator` for iterative draft -> eval -> refine discipline

These references are inputs, not authorities. HiveMind keeps OpenCode-first and project-specific boundaries.
