# Skill Revamp Architecture

**Last updated:** 2026-03-19  
**Status:** REVISED — See MASTER-PLAN for complete revision

> **IMPORTANT UPDATE (2026-03-19):** Previous implementation of `context-intelligence` was BLOATED (6 references, L1-L4 escalation). The revised architecture has context-intelligence as a **THIN P1 router** that routes to P2/P3 branches. See MASTER-PLAN.md for full details.

## 1. Mission

The revamp needs a skill-pack architecture that handles:

- front-facing entry complexity
- delegated subagent scope
- long-session drift
- context rot and governance pollution
- mixed platform surfaces such as `.opencode`, `.claude`, `.codex`, `.agent`, and others

without turning the pack system into another bloated governance layer.

## 2. Three-Pattern Model

### Pattern 1: High-Level Routing

| Property | Decision |
|----------|----------|
| Role | Must-load entry frame |
| Current pack | `context-intelligence` |
| Shape | Thin `SKILL.md`, deeper references only on demand |

Pattern 1 decides what kind of session this is before deeper packs load.

### Pattern 2: Domain And Classification

| Property | Decision |
|----------|----------|
| Role | Narrow the work once the situation is known |
| Example branches | delegation, workflow coordination, AGENTS maintenance |
| Shape | Mid-depth references, templates, and bounded guidance |

### Pattern 3: Specialist Depth

| Property | Decision |
|----------|----------|
| Role | Deep expertise for fragile situations |
| Example branches | recovery, pack migration, audit harnesses |
| Shape | Specialist guidance only after Pattern 1 or 2 has narrowed the problem |

## 3. Session Taxonomy

| Session | Why it matters |
|---------|----------------|
| Fresh | Entry should stay broad and simple |
| Resumed | Prior state may be stale or incomplete |
| Delegated | Scope must be explicit and bounded |
| Degraded | Drift or context loss is already visible |
| Interrupted | Partial actions or incomplete thought chains may exist |
| Recovered | Rebuilt state must be re-anchored before specialist depth loads |

## 4. Context Rot Architecture

Context rot is treated as a structural risk, not a stylistic one.

### Rot Dimensions

| Dimension | Meaning |
|-----------|---------|
| Governance ambiguity | Multiple surfaces competing as authority |
| Deterministic enforcement | Tests, scripts, hooks, or configs pushing wrong behavior |
| Load pressure | Auto-loaded or apparently mandatory surfaces |
| Action enablement | Ability of bad context to trigger wrong writes or delegation |
| Propagation breadth | How many layers inherit the bad signal |
| Freshness and time conflict | Same-level entities disagree and one may be stale |

### Response Posture

- Low-risk sessions stay broad and lightweight.
- Suspect sessions load recovery references before specialist packs.
- High-risk sessions favor stop-and-confirm for high-impact actions.

## 5. Degree Of Freedom

| Level | When to use it | Example |
|-------|----------------|---------|
| High | Multiple paths are valid | entry framing, principle-driven routing |
| Medium | Preferred patterns exist but adaptation is normal | workflow and delegation branches |
| Low | Fragile or high-cost errors | naming rules, evaluation rules, packaging rules |

## 6. Pack Boundary

| Pack | Boundary |
|------|----------|
| `context-intelligence` | must-load entry defense and routing only |
| companion pack | authoring, auditing, packaging, and later migration control |

The companion pack should help create and assess HiveMind packs, but it should not replace Pack 1.

## 7. Package Shape

```text
skill-name/
├── SKILL.md
├── references/
├── scripts/
├── templates/ or assets/ when justified
└── optional examples only when they reduce ambiguity
```

### Rules

- `SKILL.md` carries the broad workflow and selection logic.
- `references/` holds the depth.
- `scripts/` should default to discovery and exploration.
- reference depth stays one level from `SKILL.md`.

## 8. Cross-Framework Stance

- `.opencode` is primary for this project but not the only surface agents may see.
- `.hivemind` and `dist` are generated or runtime surfaces, not authoring truth.
- Root and nested governance docs should be judged by scope, freshness, and real authority.
- Cross-framework references are inputs, not automatic instructions.

## 9. Anti-Patterns

- one giant master skill
- duplicated pack roles
- entry packs that become procedural ceremonies
- specialist packs loaded by default
- references that chain into other references

## 10. External Pattern Anchors

This architecture intentionally draws on live skill-authoring patterns validated during planning:

- Vercel Labs `skill-creator`
- Softaworks `skill-judge`
- Obra `writing-skills`
- Anthropic `skill-creator`

These guide the architecture, but HiveMind-specific boundaries remain local.
