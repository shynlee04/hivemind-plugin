# Domain Pitfalls: Runtime Taxonomy for Agent Harnesses

**Domain:** Agent harness runtime classification
**Researched:** 2026-04-25

## Critical Pitfalls

### Pitfall 1: Conflating Model-Routing Categories with Project Context
**What goes wrong:** Building project-type detection (monorepo, library, CLI) into the harness runtime, then trying to route agents differently based on project type
**Why it happens:** Feels natural — "a monorepo needs different agents than a library"
**Consequences:** 
  - Harness becomes project-aware when it should be project-agnostic
  - Every new project type requires a code change
  - OMO, GSD, and OpenCode ALL avoid this — for good reason
**Prevention:** Two-layer architecture: harness handles model-routing, instruction layer handles project context
**Detection:** If you're adding project-type logic to delegation-manager.ts, you're in the wrong layer

### Pitfall 2: Over-Classifying Categories
**What goes wrong:** Creating 20+ categories trying to cover every task type
**Why it happens:** Confusion between "category" (model-routing) and "task type" (workflow phase)
**Consequences:** Configuration complexity explodes. OMO's 8 categories already have 8 prompt appends, 8 model configs, 8 fallback chains. At 20+, nobody can configure it correctly.
**Prevention:** Keep categories to 6-10. Map task types to categories via the orchestrator, not via separate enums.
**Detection:** If you're creating a matrix of category × task-type × project-type, stop.

### Pitfall 3: Building Language/Framework Detection
**What goes wrong:** Adding language detection to the harness to "optimize" agent behavior
**Why it happens:** "TypeScript projects need different tool configs than Python"
**Consequences:** Harness becomes opinionated about tech stack. Users of niche languages are excluded. Maintenance burden of keeping language configs current.
**Prevention:** OpenCode's approach is correct: `/init` generates AGENTS.md with project conventions. The harness is language-agnostic.
**Detection:** If you're adding `language?: "ts" | "py" | "go"` to DelegationCategory, you're reinventing instruction files.

## Moderate Pitfalls

### Pitfall 4: Missing Category Prompt Appends
**What goes wrong:** Categories determine model but not behavioral hints
**Prevention:** Add CATEGORY_PROMPT_APPENDS (OMO pattern) — each category gets a system prompt addition that guides behavior

### Pitfall 5: No Session-Category Tracking
**What goes wrong:** Runtime hooks can't look up which category a session belongs to
**Prevention:** OMO's SessionCategoryRegistry pattern — simple Map<sessionID, category>. Hivemind already has this via continuity.metadata.category.

### Pitfall 6: Hardcoding Fallback Models
**What goes wrong:** Single model per category — if model is unavailable, delegation fails
**Prevention:** OMO's fallback chain pattern — each category has a primary + fallback models

## Minor Pitfalls

### Pitfall 7: Category as Free-Form String
**What goes wrong:** Allowing any string as category without validation
**Prevention:** Hivemind already has VALID_DELEGATION_CATEGORIES — keep it as const array

### Pitfall 8: Forgetting to Register Category in Session
**What goes wrong:** Category is set on delegation but not persisted to session metadata
**Prevention:** Ensure delegation-manager writes category to continuity.metadata

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Adding `plan` category | Might overlap with `research` | Clear prompt append distinguishing planning vs research behavior |
| Category prompt appends | Prompt bloat if too verbose | Keep each append under 200 tokens |
| Project-type context | Temptation to detect in harness | Document AGENTS.md templates instead |
| Fallback chains | Over-engineering before needed | Start with primary model only, add fallbacks when users report failures |

## Sources

- OMO category-resolver.ts, categories.ts, session-category-registry.ts (source code verified)
- OpenCode agent system documentation (DeepWiki verified)
- OpenAI Harness Engineering (2026 blog post)
- Vercel AI SDK findings on tool reduction (cited in Preprints survey)
