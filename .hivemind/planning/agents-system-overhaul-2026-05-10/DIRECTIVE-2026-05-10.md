# STRATEGIC DIRECTIVE — Agents System Overhaul

**Date:** 2026-05-10 | **Origin:** User directive | **Authority:** HIGHEST — supersedes all prior planning
**Status:** ACTIVE — governs all work until explicitly superseded

---

## 1. Core Mandate

Complete overhaul of the Hivemind primitive system (agents, skills, commands, tools) to achieve:
- HARNESS ENGINEERING grade quality
- Spec-driven, test-driven, context engineering workflows
- Multi-level delegation loops (L0→L1→L2→L3) with strict guardrails
- Industry-standard body content (not just grep/glob/edit keywords)
- Runtime lifecycle integration with OpenCode platform primitives

## 2. Non-Negotiable Constraints

### 2.1 Dead Fields Policy
YAML frontmatter fields that exist only via `StructWithRest` catch-all into `options` WITHOUT being wired to actual harness code (actors, consumers, CRUD, lifecycle) are **DEAD FIELDS**. Examples:
- `depth` — must be wired to delegation hierarchy enforcement
- `lineage` — must be wired to cross-lineage gating
- `domain` — must be wired to task routing
- `skills` — NOT a valid frontmatter field (skills loaded at runtime)
- `instruction`/`instructions` — NOT valid OpenCode fields (use `prompt` or body)

Fields are only valid if they contribute as actors, consumers, or make interactions over CRUD/query operations in agent workflows. After `npm run build`, if fields don't appear in `dist/` as functional code, they are dead.

### 2.2 No .opencode/ Development
- `.opencode/` files are symlinks/project tooling — NOT the shipped product
- Development must be CODE-BASE (`src/`) — the npm package
- End-user projects get their own `.opencode/` which is dynamically registered
- AGENTS.md at end-user space is NOT what we govern — only this development environment's AGENTS.md

### 2.3 OpenCode Schema Compliance
- All YAML frontmatter fields must comply to OpenCode SDK interfaces and allowed field values
- Internal Hivemind fields must FIRST exist in a registry, be wired to workflows/governance, registered with allowed schema, and integrated into Hivemind harness lifecycle
- Do NOT randomly make new fields

### 2.4 gate-* and stack-* Reclassification
- `gate-*` and `stack-*` are NOT shipped primitives
- They are project-internal governance utilities
- They should become available through `hf-*` workflows when users formalize their planning
- Users init with PROJECT.md, VISIONS, CONCEPTS, PRD, REQUIREMENTS, STACKS, ARCHITECTURE.md, CONVENTIONS.md
- `gate-*` and `stack-*` skills are generated dynamically by `hf-*` lineage based on user's specific stack and quality gates

### 2.5 All Past Docs Are Non-Trusted
- Everything before this directive must be re-verified against live online sources
- AGENTS.md only valid if date-stamped and diff-verified
- No trusting cached skill content or previous research without re-validation

## 3. Strategic Approach

### 3.1 Phase-Based Long-Haul
- Progressive development with checkpoints
- Each phase under `.hivemind/planning/{feature-master}/{PH##-descriptive-naming}/`
- Root docs (ROADMAP, STATE, REQUIREMENTS) are NON-DATED with schema management, updated every turn
- Context, Research, Spec, Patterns accompany each phase
- Each phase has 3-4 atomic plans implemented with e2e, test-driven, spec-driven validation

### 3.2 Inventory-First
Before any implementation:
1. Complete inventory of all primitives by type, name, level, lineage
2. Delegation mapping (who delegates to whom)
3. Lifecycle mapping (when does each primitive activate)
4. Dead field identification
5. Missing primitive identification
6. Conflict detection

### 3.3 Priority Order
1. **Agents system first** — skeleton, actors, naming, levels, lineage
2. **Skills system second** — quality, integration contracts, routing
3. **Commands third** — workflow parsing, references, templates
4. **Tools and features** — after primitives are solid

### 3.4 RICH Body Standard
Per-unit synthesis from GSD + OMO + industry standards. Must include:
- Harness engineering patterns
- Spec-driven workflows
- Test-driven validation
- Context engineering
- Orchestration logic
- Multi-level loop facilitation
- Integration with pathings, engines, hooks, features

### 3.5 Output Everything to Disk
- Every investigation, audit, research must persist artifacts
- Nothing lives only in conversation
- References must be read before applying edit or patch

## 4. Root Document Management

### 4.1 Root Documents (non-dated, schema-managed)
Located at `.hivemind/planning/agents-system-overhaul-2026-05-10/`:

| Document | Purpose | Update Frequency |
|----------|---------|-----------------|
| `ROADMAP.md` | Phases, dependencies, status | Every turn |
| `STATE.md` | Current position, blockers, decisions | Every turn |
| `REQUIREMENTS.md` | Validated requirements with acceptance criteria | Every turn |
| `CONTEXT.md` | Session context and decision history | Every turn |

### 4.2 Phase Documents (under phase subdirectories)
- `CONTEXT.md` — Phase-specific context
- `RESEARCH.md` — Phase research findings
- `SPEC.md` — Phase specification
- `PATTERNS.md` — Patterns discovered
- `PLAN.md` — Atomic implementation plans

### 4.3 Coordination Documents (dated, reference)
- Coordination artifacts, research reports, audit outputs
- Cross-referenced from root docs

## 5. Key Realizations

1. **Current hm-*/hf-* agents are shallow** — lacking harness engineering, spec-driven, test-driven, context engineering depth
2. **Naming is inconsistent** — L0/L1/L2/L3 classification unclear, lineage crossing ambiguous
3. **gate-* and stack-* misclassified** — treated as shipped skills but they're governance utilities
4. **Dead fields everywhere** — `depth`, `lineage`, `domain` not wired to runtime
5. **No dynamic registration** — everything hardcoded in .opencode/, not dynamically registered from harness code
6. **Skills body quality poor** — keyword-level (grep/glob/edit) not harness-engineering-grade
7. **Cross-lineage confusion** — hm→hf vs hf→hm rules unclear at code level
8. **No lifecycle integration** — primitives don't participate in Hivemind lifecycle phases

## 6. Research Sources (Verified)

| Source | Purpose | URL |
|--------|---------|-----|
| OpenCode Platform | Agent/skill/command schema | `anomalyco/opencode` (NOT opencode-ai/opencode — archived) |
| GSD Framework | Agent/skill/command patterns, planning discipline | Agent tooling patterns |
| OMO (oh-my-openagent) | Harness engineering patterns, plugin architecture | Harness reference architecture |
| `.hivemind/STACKS-REFERENCES.md` | Correct repo links for all dependencies | Local reference |

## 7. Governance Rules

1. No implementation without plan
2. No plan without research
3. No research without validated sources
4. All artifacts committed atomically with context
5. Phase gates enforced at every transition
6. Progressive adjustment allowed — nothing is final until e2e validated
7. Strategic traversal — don't try to complete everything at once

---

## 8. Current Status

- WAVE-0A (OpenCode schema verification): COMPLETED — 11/15 CONFIRMED, 4 MODIFIED, 0 DENIED
- Permission Schema Gate research: FOUNDATION SOUND but needs classification updates
- Next: Build complete primitive inventory before any agent modifications

## 9. Amendment Log

| Date | Amendment | Reason |
|------|-----------|--------|
| 2026-05-10 | Initial directive | User strategic reset |
