# Validation Decisions — 2026-04-25

**Status:** ALL 6 DECIDED — Ready for REQUIREMENTS.md and PROJECT.md updates
**Purpose:** Locked user decisions from 6-question validation gate. These feed into REQUIREMENTS.md and PROJECT.md updates.

---

## Q1: Runtime Taxonomy — Should the harness detect project type / language / framework?

**Decision: HYBRID + Spec-Driven Automated Runtime Detection**

### What the user decided:

NOT simple "detect and expose metadata." The direction is:

1. **GSD approach to spec-driven and test-driven** — follow https://github.com/gsd-build/get-shit-done/blob/main/docs/ARCHITECTURE.md patterns
2. **Automate intent and command/workflow routing** — not manual classification
3. **Improve in-session and cross-session collaborative context continuity** based on spec dependencies
4. **Project frameworks, languages, complexity detected through:**
   - Required deep codemap and codescan
   - Skill to deep-research and generate tech stacks, libraries, SDKs, frameworks at runtime
   - Through MCP tools and official stack skills synthesis
5. **Dependencies graph + file watching** — programmatic routine runs for updates when:
   - Versions change
   - New registries added (package.json etc.)

### Architectural implications:

| Component | Role | Layer |
|-----------|------|-------|
| DelegationCategory (6 current) | Model-routing | Harness Layer 1 |
| Category prompt appends | Behavioral hints per category | Harness Layer 1 |
| Deep codemap/codescan | Detect project type, language, framework, complexity | Harness Layer 2 (runtime) |
| MCP tools + stack skills | Research and synthesize tech stack at runtime | Harness Layer 2 (runtime) |
| Dependencies graph | Track and update when versions change | Harness Layer 2 (runtime) |
| File watching | Trigger re-scan on package.json etc. changes | Harness Layer 2 (runtime) |
| AGENTS.md | Project conventions (existing OpenCode pattern) | Instruction Layer |

### Spec-drive verification requirements:

- Test: Given a new project, harness performs deep codemap → detects language/framework → generates context
- Test: Given package.json change, file watcher triggers dependency graph update
- Test: Given category dispatch, correct model + prompt append is selected
- Test: Cross-session continuity preserves detected project context

### Sources consulted:

- OMO: 8 categories for model-routing only, no project detection
- GSD: No runtime classification, workflow-driven, spec-driven architecture
- OpenCode: AGENTS.md instruction layer, /init command
- Hivemind current: 6 VALID_DELEGATION_CATEGORIES, framework-detector.ts for conflicts
- Research files: GSD-ARCHITECTURE-DEEP-DIVE-2026-04-25.md, OMO-ARCHITECTURE-DEEP-DIVE.md

---

## Q2: Sidecar Monitoring/GUI Approach

**Decision: ARTIFACT-FOCUSED SIDECAR — NOT delegation monitoring**

### What the user decided:

The sidecar is NOT for monitoring delegation tasks. Delegation is behind-the-scenes. The sidecar focuses on:

1. **Artifact interaction** — users interact with generated artifacts (plans, specs, reviews, research reports) through a visual UI
2. **On-the-fly UI generation via `@json-render/react`** (https://github.com/vercel-labs/json-render) — dashboard UI dynamically generated from JSON specs
3. **OpenCode SDK client-server API** — sidecar communicates with OpenCode's local HTTP server (https://opencode.ai/docs/server) for interacting with sessions, tools, and configuration
4. **Existing codebase to migrate concept from:** product-detox `apps/side-car/` (Next.js 15 + React 19, partially built)

### Architecture:

```
OpenCode Local HTTP Server (https://opencode.ai/docs/server)
       ↕ REST API
Sidecar (Next.js 15 + @json-render/react)
  ├── Reads: artifacts from .hivemind/ and .planning/
  ├── Renders: JSON-spec-driven dashboard tabs
  ├── Interacts: OpenCode SDK API for config, settings, sessions
  └── Constraint: READ-ONLY for canonical state (Phase 16.4 locked)
```

### Product-detox sidecar files (concept source, NOT code copy):

- `apps/side-car/app/api/{config,contracts,dashboard,events,sessions,settings}/` — API routes
- `apps/side-car/lib/` — client libraries
- `apps/side-car/components/{shell,tab-panel}.tsx` — layout components
- Known bugs: F-01 (spec not written), F-02 (empty actions), F-03 (untyped props) — must NOT repeat

### Spec-drive verification requirements:

- Test: Sidecar reads artifact JSON → renders correct dashboard tab
- Test: Sidecar calls OpenCode SDK API → receives valid response
- Test: Sidecar CANNOT write to canonical state (enforcement test)
- Test: JSON spec change → dashboard re-renders without code change

### Sources consulted:

- OMO: Tmux for dev monitoring, not user-facing GUI
- Product-detox: Sidecar built but broken at write-side pipeline
- OpenCode docs: Server API at https://opencode.ai/docs/server
- json-render: https://github.com/vercel-labs/json-render
- Industry 2026: hooks → event relay → SSE → browser pattern

## Q3: Session Journal ↔ Continuity Relationship

**Decision: COMPLEMENT + TIME-MACHINE FOUNDATION**

### What the user decided:

Session Journal is **A: Complement** to continuity.ts, but with significant expansion:

1. **continuity.ts stays as-is** — proven crash-recovery CRUD store, no changes
2. **Session Journal adds as a NEW module** — append-only event timeline, independent of continuity
3. **Programmatic time-machine** — journal enables querying past session states, replaying events, investigating what happened
4. **Future memory engine foundation** — after MVP, journal connects to:
   - On-disk graph-based memory (vector/graph memory)
   - Stateful event-driven hooks (hooks that react to journal events)
   - Tools that facilitate complex cross-session investigation
   - Long-term retrieval of context for agents/workflows
5. **Investigation agent support** — agents can query journal to understand what happened in previous sessions, recover context, trace decisions

### Architecture:

```
continuity.ts (410 LOC, UNCHANGED)
  └── Current-state CRUD store, crash recovery

session-journal.ts (NEW)
  ├── Append-only event timeline per session
  ├── Query API: by session, by event type, by time range
  ├── Time-machine: reconstruct past state from event replay
  └── Foundation for future: graph memory, event-driven hooks, investigation tools

Future (post-MVP):
  ├── On-disk graph-based memory → reads journal events
  ├── Stateful event-driven hooks → subscribe to journal events
  ├── Investigation tools → query journal for cross-session analysis
  └── Long-term context retrieval → semantic search over journal history
```

### Spec-drive verification requirements:

- Test: continuity.ts passes all existing tests unchanged
- Test: journal records events without affecting continuity
- Test: journal query returns correct events for session + time range
- Test: time-machine reconstructs past state from event replay
- Test: journal survives crash (append-only files are crash-safe)

### Sources consulted:

- continuity.ts: 410 LOC, snapshot-based, deep-clone-on-read
- Product-detox: journey-events with per-session JSON files
- OMO: compaction hooks for state preservation across resets
- GSD: continuity.json with cross-session state
- Phase 16.4: D-21 (session journal) + D-22 (lineage bridge)

## Q4: 8-Category Memory Taxonomy — MVP vs Post-MVP

**Decision: MVP = 5 of 8 (2 new + 3 existing), Post-MVP = 3 with gates**

### What the user decided:

Accept the recommended split:

**MVP (build now / already works):**

| # | Category | Status | Action |
|---|----------|--------|--------|
| 1 | episodic/session memory | NEW code | Built as part of Session Journal (Q3 P0) |
| 2 | workflow memory | Already works | `.planning/` GSD format — no new code |
| 3 | delegation evidence | Already works | `delegation-persistence.ts` + DelegationManager — no new code |
| 4 | human-readable journal | NEW code | Built as part of Session Journal (Q3 P0) |
| 5 | architecture decisions | Already locked | 16.4 baseline + decision register — no new code |

**Post-MVP (defer with explicit gates):**

| # | Category | Gate |
|---|----------|------|
| 6 | long-term concept memory | When migration planner needs it |
| 7 | graph-query projections | After journal has enough events to justify graph queries |
| 8 | optional local vector memory | After schema, privacy, rebuild plan exists (per P16.4-12) |

### Architectural implications:

- Session Journal (Phase 25) must implement categories 1+4 as a single unified module
- Categories 2, 3, 5 require ZERO new code — they are acknowledgements of existing working systems
- Categories 6, 7, 8 remain future/optional per Phase 16.4 baseline
- Product-detox evidence (empty graph, no task bindings, no vector code) confirms post-MVP is correct

### Sources consulted:

- Phase 16.4 architecture baseline: 8-category taxonomy (lines 156-167)
- Product-detox MEMORY-ARCHITECTURE-V2.9.5.md: graph always empty, vector never implemented
- Q3 decision: Session Journal is P0 foundation
- HM-SKILLS-AND-ARCHITECTURE-REPORT: 12 of 25 hm-* skills are THIN, 2 HOLLOW — no capacity for complex memory

## Q5: RICH Gate MVP Threshold — Full RICH, No Compromise

**Decision: Option C — Keep current RICH gate unchanged. Ship with honest quality status.**

### What the user decided:

The RICH gate is NOT a threshold to lower. It is a quality process that is ongoing work:

1. **Full RICH gate required** — every hm-* skill must pass Pattern 1/2/3 third-party synthesis:
   - Pattern 1: Ingest top 3 third-party skills from skills.sh → transform-improve-adopt into hm-* versions
   - Pattern 2: Horizontal integration across domains and ecosystem
   - Pattern 3: Vertical routing across other "how-to-process" and hierarchy skill groups
2. **Skills must be crafted individually** — each one requires dedicated synthesis, not batch lowering
3. **Research is substantially complete** — phases 27-30 have RICH-THIRD-PARTY-RESEARCH.md files ready for synthesis
4. **Expected gaps documented but NOT used to lower the bar:**
   - Skills lacking to fill mesh matrix
   - Meta concepts lacking (agents, workflows, commands, CLI tools)
   - Custom-tools, plugins, hard harness still in build phase
5. **Use skill-development, skill-creator, and skill-judge** for the crafting knowledge

### Architectural implications:

- 0 of 25 skills pass RICH today — this is honest status, not a problem to lower-bar away
- Phase 27-30 research artifacts are the input for synthesis
- The RICH process itself is the deliverable quality assurance, not a gate to bypass
- Gaps will be documented for future gap planning without disrupting auto loops

### Research artifacts ready for synthesis:

- `27-RICH-THIRD-PARTY-RESEARCH.md`, `27-RICH-REPAIR-EVIDENCE-2026-04-25.md`, `27-RICH-GATE-CORRECTION.md`
- `28-RICH-THIRD-PARTY-RESEARCH.md`, `28-STATE.md`
- `29-RICH-THIRD-PARTY-RESEARCH.md`, `29-STATE.md`
- `30-RICH-THIRD-PARTY-RESEARCH.md`, `30-RICH-GATE-BASELINE.md`, `30-HM-RICH-COVERAGE-MATRIX.md`, `30-CROSS-PHASE-RICH-VERIFICATION-2026-04-25.md`, `30-FIRST-HARDENING-EVIDENCE-2026-04-25.md`

## Q6: `.hivemind/` State Root Timing — Switch Writers Now

**Decision: Option C — Session Journal writes directly to `.hivemind/`. Begin migration from `.opencode/state/`.**

### What the user decided:

1. **All Hivemind internal deep modules MUST write to `.hivemind/`** at project root — not `.opencode/`
2. **`.opencode/` is dangerous** for internal state — other plugins and users' dependencies can overwrite/delete files there
3. **Only OpenCode primitives meta-concepts** (agents, commands, skills) belong in `.opencode/`
4. **Even skills in `.opencode/` are temporary** — they will eventually become compiled code at runtime when users run CLI installation
5. **This rule applies to ALL future Hivemind internal deep modules**, not just Session Journal

### Architectural implications:

| Write Surface | Location | Rationale |
|---------------|----------|-----------|
| Session Journal | `.hivemind/journal/` | Internal deep module — must be in `.hivemind/` |
| Continuity store | `.hivemind/state/session-continuity.json` | Migrate from `.opencode/state/opencode-harness/` |
| Delegation records | `.hivemind/state/delegations.json` | Migrate from `.opencode/state/opencode-harness/` |
| Future graph projections | `.hivemind/graph/` | Internal deep module |
| Future vector memory | `.hivemind/vector/` | Internal deep module |
| Skills (OpenCode primitives) | `.opencode/skills/` | Temporary until compiled at runtime |
| Agents (OpenCode primitives) | `.opencode/agents/` | Temporary until compiled at runtime |
| Commands (OpenCode primitives) | `.opencode/commands/` | Temporary until compiled at runtime |

### Migration requirements:

- **Compatibility bridge:** Existing `.opencode/state/opencode-harness/` must remain readable during transition
- **Sync direction:** `.opencode/state/` → `.hivemind/` (one-way migration, no dual-write)
- **Category markers:** Each `.hivemind/` category declares canonical-vs-projection per D-15
- **Writer gate:** New writers target `.hivemind/` exclusively. Migration gate for existing writers.
- **gitignore:** `.hivemind/` may need selective ignore rules (runtime state vs committed config)

### Safety constraint:

> **NOTICE:** Nothing should be manifested or controlled under `.opencode/` unless they are OpenCode primitives (agents, commands, skills). Even those are temporary — they will later become compiled code at runtime via CLI installation. All internal deep module state MUST live in `.hivemind/` to prevent corruption by other plugins or user dependencies.

### Sources consulted:

- Phase 16.4 baseline: D-11 through D-16 (state ownership model)
- Product-detox: `.hivemind/` 6-subsystem structure with empty graph/vector
- User constraint: `.opencode/` overwrite risk from other plugins
