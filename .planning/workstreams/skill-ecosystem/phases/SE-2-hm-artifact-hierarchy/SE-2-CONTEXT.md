# Phase SE-2: Planning Pipeline Backbone — CONTEXT

**Workstream:** skill-ecosystem
**Phase:** SE-2
**Created:** 2026-04-28
**Status:** AUTHORIZED — ready for planning
**Depends on:** SE-1 (renames complete, references clean)

## Authorized Decisions (from discuss-phase)

### D-01: Architecture — .hivemind/ native
All planning artifacts persist to `.hivemind/state/planning/` per Q6 decision (.hivemind/ is internal state root). NOT `.planning/` (GSD's structure). Existing hm-phase-execution already reads `.planning/phases/` — this will be updated to read `.hivemind/state/planning/` as canonical, with `.planning/` as mirror.

### D-02: Scope — Backbone Only
SE-2 creates the planning pipeline BACKBONE (persistence + plan generation + reference fixes). NOT all 8 pipeline skills. Other gaps (brainstorming, requirements, cross-cutting, tech-context, research enhancement, gate orchestration, meta-builder) are SE-3 through SE-7.

### D-03: Prefix — All hm-*
All new planning skills use hm-* prefix. They are product/runtime skills (shipped with Hivemind), not internal project tools. Internal gate-* skills (gate-evidence-truth, gate-lifecycle-integration, gate-spec-compliance) are THIS PROJECT ONLY and not shipped.

### D-04: Coordinating Loop — Soft Boundary
Remove hard dependency on planning-with-files from hm-coordinating-loop. Replace `verify-hierarchy.sh` check with graceful fallback: if persistence skill not loaded, use in-memory state with warning. No blocking prerequisite.

### D-05: Internal vs Shipped Separation
- **Shipped (hm-*):** Planning pipeline skills are product skills — they help end users build their projects
- **Internal (gate-*):** Quality gate skills are THIS PROJECT ONLY — not shipped
- **SE-5.5** handles internal gate hardening separately

### D-06: Downstream Phase Scaffolding
The existing ROADMAP.md phases SE-3 through SE-7 already cover the remaining gaps. SE-2 focuses on the backbone that unblocks them:
- **SE-3** → Pre-gate skills (hm-brainstorm, hm-requirements-analysis, hm-cross-cutting-change, hm-tech-context-compliance)
- **SE-4** → Research pipeline (hm-tech-stack-ingest + research chain bidirectional fixes)
- **SE-5** → Gate orchestration + lineage routing
- **SE-5.5** → Internal gate hardening
- **SE-6** → Meta-builder enhancement
- **SE-7** → Integration verification

## Phase SE-2 Scope — What We Build

### 1. hm-planning-persistence (NEW — replaces disabled hm-planning-with-files)
- Creates `.hivemind/state/planning/<session-id>/` directory structure
- task_plan.md — Goal + phases + decisions
- findings.md — Research + technical discoveries
- progress.md — Session log + errors + handoffs
- Language-agnostic, framework-independent
- Full RICH-1 through RICH-8 compliance
- Fallback: if `.hivemind/` not available (non-Hivemind project), uses local `.session/` dir

### 2. Fix 11 Broken References
Update boundary rules in ALL skills referencing `hm-planning-with-files`:
- hm-coordinating-loop (CRITICAL — remove HIERARCHY ENFORCEMENT script dependency)
- hm-user-intent-interactive-loop
- hm-spec-driven-authoring
- hm-test-driven-execution
- hm-completion-looping
- hm-subagent-delegation-patterns
- hm-phase-execution
- hm-phase-loop
- hm-debug
- hm-refactor
- hm-meta-builder
All references → `hm-planning-persistence` with path: `.hivemind/state/planning/`

### 3. Archive Disabled Skill
- Move `donotusethis-hm-planning-with-files` to `.opencode/retired/`
- Add deprecation note referencing `hm-planning-persistence` as replacement

## NOT in SE-2 Scope
- New skill creation beyond hm-planning-persistence
- Pre-gate skills (brainstorm, requirements, etc.) → SE-3
- Tech stack ingestion → SE-4
- Gate orchestration → SE-5
- Internal gate hardening → SE-5.5
- Meta-builder enhancement → SE-6
- Integration verification → SE-7
- Changing existing skill behavior (only reference updates allowed)

## Code Context
- All skill directories: `.opencode/skills/`
- All agent directories: `.opencode/agents/`
- State root: `.hivemind/` (Q6)
- Existing continuity: `.hivemind/state/session-continuity.json` (already exists)
- Existing delegations: `.hivemind/state/delegations.json` (already exists)

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Skill Quality Criteria (MANDATORY for ALL phases)
- `.hivefiver-meta-builder/SKILL-CRITERIA-SHORT.md` — Definitive skill quality criteria. EVERY new skill created in SE-2 through SE-7 must pass these gates:
  - [ ] Belongs to one of: domain expertise, new capabilities, repeatable workflows, interoperability
  - [ ] Correct lineage (hm-* = shipped, hf-* = meta-builder, gate-* = THIS PROJECT ONLY)
  - [ ] Correct hierarchy (coordinator/orchestrator for front-facing vs sub-session for delegated)
  - [ ] Correct task group (how-to-process vs how-to-implement)
  - [ ] Description lands 90% pick rate — concise, real-world, non-generic
  - [ ] SKILL.md ≤ 500 lines (progressive disclosure)
  - [ ] Bundled resources: references/, scripts/, assets/ as needed
  - [ ] NOT generic AI-written — synthesized from real patterns
  - [ ] For "rich" skills: ingest → transform → improve → adopt from top 3 third-party skills on skills.sh

### Planning Pipeline Architecture
- `.hivemind/state/session-continuity.json` — Existing state persistence (extends for planning/)
- `.opencode/skills/donotusethis-hm-planning-with-files/SKILL-DISABLED.md` — Disabled skill being replaced

## Constraints
- Language-agnostic, framework-independent
- hm-* prefix (shipped with Hivemind product)
- Must not depend on GSD, OMO, or Superpowers frameworks
- Progressive disclosure: SKILL.md + bundled references/ assets

---

## Supplementary Decisions (SE-2 Expansion)

### D-07: GSD Workflow Coverage — Gradual Replacement Model

SE-2 does NOT replace all 80+ GSD workflows in one phase. The single persistence skill built here forms the foundation that later phases build upon. GSD workflows are classified into 5 coverage tiers:

- **Tier 1 — SE-2 IMMEDIATE:** Persistence backbone only (1 skill: `hm-planning-persistence`). This is the foundation all other pipeline skills consume.
- **Tier 2 — SE-3/4:** Spec + research pipeline skills that consume the persistence backbone (brainstorm, requirements, plan-generator, tech-context).
- **Tier 3 — SE-5:** Quality gate skills that consume all prior pipeline stages (code-review, uat-verify, ship, autonomous-driver).
- **Tier 4 — SE-6:** Auxiliary/documentation skills (docs-generator, spike-to-skill, meta-builder enhancement).
- **Tier 5 — UNMAPPED:** 48 GSD workflows with no planned hm-* replacement (gap analysis deferred to SE-8+).

**Rationale:** Building the full replacement pipeline in one phase would exceed 500 LOC per skill rule and create untestable monoliths. Each phase delivers a cohesive set of contract-compliant skills the next phase consumes.

### D-08: Research-Before-Creation Mandate

Every SE-2 skill must complete structured research before SKILL.md is written. Research must include:

1. **Third-party skill synthesis:** Use `find-skill` on skills.sh to locate equivalent skills for pattern analysis
2. **GSD workflow deep-read:** Read the corresponding GSD skill's SKILL.md + all bundled references for pattern extraction
3. **Existing hm-* skill audit:** Review existing hm-* skills that will integrate with the new skill for contract compatibility
4. **Research writeup:** Bundled as `research/design-decisions.md` in the skill directory

**Rationale:** Without research, skills risk reinventing patterns already proven in GSD or third-party ecosystems. Research writeups are the evidence that design choices are informed, not arbitrary.

### D-09: Pipeline Skill Integration Contracts

Every pipeline skill must declare explicit integration contracts in its SKILL.md frontmatter:

```yaml
pipeline:
  stage: <init|roadmap|persistence|plan|execute|review|verify|ship>
  reads: [<artifact paths relative to .hivemind/>]
  writes: [<artifact paths relative to .hivemind/>]
  upstream: [<skill names that produce inputs>]
  downstream: [<skill names that consume outputs>]
```

**Rationale:** Explicit contracts prevent implicit coupling. A skill author can verify backward compatibility by checking that upstream skills still produce the declared inputs.

### D-10: Broken Reference Priority — hm-coordinating-loop First

The 11 broken references to `hm-planning-with-files` must be fixed in priority order. `hm-coordinating-loop` is the critical blocker because its HIERARCHY ENFORCEMENT script (`verify-hierarchy.sh`) causes hard failures when `hm-planning-with-files` is not loaded. D-04 already defines the fix approach: replace with graceful fallback. The remaining 10 skills (degraded, not hard-blocked) can be fixed in parallel after the persistence skill is created.

**Fix order (locked):**
1. Create `hm-planning-persistence` first (replacement target)
2. Fix `hm-coordinating-loop` (CRITICAL — remove HIERARCHY ENFORCEMENT script dependency)
3. Fix remaining 9 degraded skills in parallel
4. Fix `hm-meta-builder` routing table
5. Archive `donotusethis-hm-planning-with-files` to `.opencode/retired/`

---

## Complete GSD Workflow Replacement Map

Every GSD workflow is mapped to its hm-* replacement status. This map is the single source of truth for coverage tracking across all phases (SE-2 through SE-8+).

**Legend:**
- ✅ **ALREADY EXISTS** — hm-* skill is shipped and functional
- 🔨 **CREATED IN SE-2** — new skill built in this phase (hm-planning-persistence)
- 📋 **DEFERRED TO SE-X** — pipeline design exists, creation in later phase
- 🔀 **COVERED BY COMBINATION** — multiple existing hm-* skills cover this workflow
- ❌ **NOT COVERED** — no hm-* replacement planned (gap)
- 🚫 **NOT APPLICABLE** — workflow doesn't translate to hm-* ecosystem

### INIT (Project Initialization)

| GSD Workflow | hm-* Replacement | Status | Notes |
|---|---|---|---|
| `gsd-new-project` | (no direct equivalent) | ❌ NOT COVERED | SE-3 hm-brainstorm + hm-requirements-analysis partially cover |
| `gsd-new-milestone` | (no direct equivalent) | ❌ NOT COVERED | Not yet replicated in hm-* ecosystem |
| `gsd-map-codebase` | `hm-detective` (SCAN mode) | 🔀 COVERED BY COMBINATION | Parallel mapper agents not replicated; single-file only |
| `gsd-scan` | `hm-detective` (SCAN mode) | 🔀 COVERED BY COMBINATION | Lightweight codebase assessment |

### SPEC (Specification)

| GSD Workflow | hm-* Replacement | Status | Notes |
|---|---|---|---|
| `gsd-spec-phase` | `hm-spec-driven-authoring` | ✅ ALREADY EXISTS | Socratic spec refinement → falsifiable requirements |
| `gsd-ui-phase` | (no direct equivalent) | ❌ NOT COVERED | UI design contracts out of scope for hm-* pipeline |
| `gsd-ai-integration-phase` | (no direct equivalent) | ❌ NOT COVERED | AI framework selection + eval; separate workstream |

### DISCUSS (Intent Clarification)

| GSD Workflow | hm-* Replacement | Status | Notes |
|---|---|---|---|
| `gsd-discuss-phase` (advisor) | `hm-user-intent-interactive-loop` | ✅ ALREADY EXISTS | 3-mode interactive QA |
| `gsd-discuss-phase` (assumptions) | (not mapped) | ❌ NOT COVERED | GSD assumptions-analyzer agent not replicated |
| `gsd-discuss-phase` (auto) | (not mapped) | ❌ NOT COVERED | --auto flag skips interactive questions |
| `gsd-discuss-phase` (chain) | (not mapped) | ❌ NOT COVERED | discuss → plan → execute as single command |
| `gsd-discuss-phase` (power) | (not mapped) | ❌ NOT COVERED | Bulk question generation for file-based UI |
| `gsd-discuss-phase` (default) | `hm-user-intent-interactive-loop` | ✅ ALREADY EXISTS | Covered by existing skill |

### RESEARCH (Domain & Implementation)

| GSD Workflow | hm-* Replacement | Status | Notes |
|---|---|---|---|
| `gsd-research-phase` | `hm-research-chain` | ✅ ALREADY EXISTS | detect → research → synthesize → artifact |
| `gsd-project-researcher` | `hm-deep-research` | ✅ ALREADY EXISTS | Domain ecosystem research |
| `gsd-research-synthesizer` | `hm-synthesis` | ✅ ALREADY EXISTS | Compress findings into actionable artifacts |
| `gsd-domain-researcher` | (not mapped) | ❌ NOT COVERED | Business domain + real-world context research |
| `gsd-phase-researcher` | `hm-research-chain` | ✅ ALREADY EXISTS | Phase-level research before planning |
| `gsd-framework-selector` | (not mapped) | ❌ NOT COVERED | AI framework decision matrix; separate workstream |

### PLAN (Phase Planning)

| GSD Workflow | hm-* Replacement | Status | Notes |
|---|---|---|---|
| `gsd-plan-phase` | (not mapped) | 📋 DEFERRED TO SE-3 | Plan generation with tasks, waves, dependencies |
| `gsd-plan-milestone-gaps` | (not mapped) | ❌ NOT COVERED | Gap detection between milestones |
| `gsd-pattern-mapper` | (not mapped) | ❌ NOT COVERED | Pattern analysis for plan alignment |
| `gsd-analyze-dependencies` | (not mapped) | ❌ NOT COVERED | Dependency analysis for phase ordering |

### EXECUTE (Implementation)

| GSD Workflow | hm-* Replacement | Status | Notes |
|---|---|---|---|
| `gsd-execute-phase` | `hm-phase-execution` + `hm-coordinating-loop` | 🔀 COVERED BY COMBINATION | Wave-based parallelization + coordination gates |
| `gsd-fast` | (not mapped) | ❌ NOT COVERED | Trivial task inline execution without subagents |
| `gsd-quick` | (not mapped) | ❌ NOT COVERED | Quick task with atomic commits, no optional agents |

### QUALITY (Code Review & Verification)

| GSD Workflow | hm-* Replacement | Status | Notes |
|---|---|---|---|
| `gsd-code-review` | (not mapped) | 📋 DEFERRED TO SE-5 | Review changed files, structured findings |
| `gsd-code-review-fix` | (not mapped) | ❌ NOT COVERED | Auto-fix code review findings |
| `gsd-verify-work` | (not mapped) | 📋 DEFERRED TO SE-5 | User-facing acceptance testing |
| `gsd-validate-phase` | (not mapped) | ❌ NOT COVERED | Nyquist validation gap checking |
| `gsd-secure-phase` | (not mapped) | ❌ NOT COVERED | Threat mitigation verification |
| `gsd-eval-review` | (not mapped) | ❌ NOT COVERED | AI evaluation coverage audit |
| `gsd-ui-review` | (not mapped) | ❌ NOT COVERED | 6-pillar visual audit of frontend |

### SHIP (Deployment & Release)

| GSD Workflow | hm-* Replacement | Status | Notes |
|---|---|---|---|
| `gsd-ship` | (not mapped) | 📋 DEFERRED TO SE-5 | Create PR, run review, prepare for merge |
| `gsd-pr-branch` | (not mapped) | 📋 DEFERRED TO SE-5 | Clean PR branch filtered from planning commits |

### ORCHESTRATE (Coordination)

| GSD Workflow | hm-* Replacement | Status | Notes |
|---|---|---|---|
| `gsd-autonomous` | (not mapped) | 📋 DEFERRED TO SE-5 | Run remaining phases autonomously |
| `gsd-manager` | (not mapped) | ❌ NOT COVERED | Interactive command center for multi-phase management |
| `gsd-next` | (not mapped) | ❌ NOT COVERED | Auto-advance to next workflow step |
| `gsd-progress` | (not mapped) | ❌ NOT COVERED | Project progress display + next-action routing |
| `gsd-do` | (not mapped) | ❌ NOT COVERED | Freeform text routing to commands |

### LIFECYCLE (Phase/Milestone Management)

| GSD Workflow | hm-* Replacement | Status | Notes |
|---|---|---|---|
| `gsd-add-phase` | (not mapped) | ❌ NOT COVERED | Add phase to end of current milestone |
| `gsd-insert-phase` | (not mapped) | ❌ NOT COVERED | Insert urgent work as decimal phase |
| `gsd-remove-phase` | (not mapped) | ❌ NOT COVERED | Remove future phase + renumber |
| `gsd-complete-milestone` | (not mapped) | ❌ NOT COVERED | Archive completed milestone |
| `gsd-audit-milestone` | (not mapped) | ❌ NOT COVERED | Audit milestone against original intent |
| `gsd-audit-uat` | (not mapped) | ❌ NOT COVERED | Cross-phase audit of UAT items |
| `gsd-cleanup` | (not mapped) | ❌ NOT COVERED | Archive accumulated phase directories |
| `gsd-new-workspace` | (not mapped) | ❌ NOT COVERED | Isolated workspace with repo copies |
| `gsd-remove-workspace` | (not mapped) | ❌ NOT COVERED | Remove workspace + clean up worktrees |
| `gsd-list-workspaces` | (not mapped) | ❌ NOT COVERED | List active workspaces |

### AUXILIARY (Supporting Workflows)

| GSD Workflow | hm-* Replacement | Status | Notes |
|---|---|---|---|
| `gsd-docs-update` | (not mapped) | 📋 DEFERRED TO SE-6 | Documentation generation + verification |
| `gsd-explore` | (not mapped) | ❌ NOT COVERED | Socratic ideation and idea routing |
| `gsd-spike` | (not mapped) | ❌ NOT COVERED | Experiential exploration |
| `gsd-sketch` | (not mapped) | ❌ NOT COVERED | Throwaway HTML/CSS mockup sketching |
| `gsd-debug` | `hm-debug` | ✅ ALREADY EXISTS | Systematic debugging with persistent state |
| `gsd-profile-user` | (not mapped) | ❌ NOT COVERED | Developer behavioral profile |
| `gsd-session-report` | (not mapped) | ❌ NOT COVERED | Session report with token usage |
| `gsd-extract_learnings` | (not mapped) | ❌ NOT COVERED | Extract decisions/patterns from phase artifacts |
| `gsd-forensics` | (not mapped) | ❌ NOT COVERED | Post-mortem failed GSD run investigation |
| `gsd-health` | (not mapped) | ❌ NOT COVERED | Planning directory health diagnosis |
| `gsd-stats` | (not mapped) | ❌ NOT COVERED | Project statistics display |
| `gsd-graphify` | (not mapped) | ❌ NOT COVERED | Knowledge graph build + query |
| `gsd-intel` | (not mapped) | ❌ NOT COVERED | Codebase intelligence file inspection |
| `gsd-ingest-docs` | (not mapped) | ❌ NOT COVERED | Scan + classify + merge docs |
| `gsd-import` | (not mapped) | ❌ NOT COVERED | External plan ingestion with conflict detection |
| `gsd-inbox` | (not mapped) | ❌ NOT COVERED | Triage + review open issues/PRs |
| `gsd-plant-seed` | (not mapped) | ❌ NOT COVERED | Forward-looking idea with trigger conditions |
| `gsd-thread` | (not mapped) | ❌ NOT COVERED | Persistent cross-session context threads |
| `gsd-workstreams` | (not mapped) | ❌ NOT COVERED | Parallel workstream management |
| `gsd-check-todos` | (not mapped) | ❌ NOT COVERED | Pending todo listing |
| `gsd-add-todo` | (not mapped) | ❌ NOT COVERED | Idea/task capture from conversation |
| `gsd-add-backlog` | (not mapped) | ❌ NOT COVERED | Backlog parking lot |
| `gsd-review-backlog` | (not mapped) | ❌ NOT COVERED | Backlog review + promotion |
| `gsd-add-tests` | `hm-test-driven-execution` | ✅ ALREADY EXISTS | RED/GREEN/REFACTOR covers test generation |
| `gsd-update` | 🚫 NOT APPLICABLE | — | GSD-specific version update |
| `gsd-settings` | 🚫 NOT APPLICABLE | — | GSD-specific config toggles |
| `gsd-set-profile` | 🚫 NOT APPLICABLE | — | GSD-specific model profile switching |
| `gsd-help` | 🚫 NOT APPLICABLE | — | GSD-specific command listing |
| `gsd-join-discord` | 🚫 NOT APPLICABLE | — | Social/invite link |
| `gsd-reapply-patches` | 🚫 NOT APPLICABLE | — | GSD update reapply patches |

### GATE (Internal Quality — Not Shipped)

| GSD Workflow | hm-* Replacement | Status | Notes |
|---|---|---|---|
| `gate-spec-compliance` | N/A (internal-only) | 🔒 INTERNAL USE | Bidirectional traceability + gap detection |
| `gate-lifecycle-integration` | N/A (internal-only) | 🔒 INTERNAL USE | CQRS boundary + actor hierarchy checks |
| `gate-evidence-truth` | N/A (internal-only) | 🔒 INTERNAL USE | Evidence hierarchy verification |

### Summary Coverage

| Tier | Count | Coverage |
|---|---|---|
| ✅ Already Exists | 12 workflows | 15% |
| 🔨 Created in SE-2 | 1 workflow (hm-planning-persistence) | 1% |
| 📋 Deferred to SE-3–SE-6 | 5 workflows | 6% |
| 🔀 Covered by Combination | 3 workflows | 4% |
| ❌ Not Covered | 48 workflows | 60% |
| 🚫 Not Applicable | 8 workflows | 10% |
| 🔒 Internal Use | 3 workflows | 4% |
| **Total** | **80** | **100%** |

> **Note:** "Not Covered" does not mean "never." The 48 unmapped workflows represent future phases (SE-3 through SE-8+) and separate workstreams. This map is a living document updated at each phase boundary.

---

## Pipeline Skills Deferred Map

Of the 8+ pipeline skills across the full GSD replacement pipeline, SE-2 creates only `hm-planning-persistence`. The remaining skills are designed in later phases. This section clarifies exactly what is deferred and why.

### SE-2 IMMEDIATE (Build Now — Persistence Backbone)

| Skill | Phase | Reason for SE-2 |
|---|---|---|
| `hm-planning-persistence` | **SE-2** | **Blocking dependency for all other pipeline skills.** Every downstream skill reads task state from `.hivemind/state/planning/`. Must exist before any other pipeline skill can be built or tested. Also the replacement target for 11 broken references across 10 skills + hm-meta-builder. |

### SE-2 DEFERRED (Design in SE-3 through SE-7)

| Skill | Deferred To | Reason |
|---|---|---|
| `hm-brainstorm` | **SE-3** | Consumes hm-planning-persistence for brainstorm artifact storage. SE-3 is the pre-gate skills phase. |
| `hm-requirements-analysis` | **SE-3** | Consumes hm-planning-persistence. SE-3 pairs with brainstorm for the intent → requirements handoff. |
| `hm-cross-cutting-change` | **SE-3** | Cross-dependency design for feature ecosystem. SE-3 scope. |
| `hm-tech-context-compliance` | **SE-3** | Tech stack context for planning. SE-3 scope. |
| `hm-plan-generator` | **SE-3** | Depends on hm-planning-persistence for task state I/O. Also depends on hm-spec-driven-authoring (existing) and hm-research-chain (existing). SE-3 is the natural home because it pairs with brainstorm → requirements handoff skills. |
| `hm-tech-stack-ingest` | **SE-4** | Research pipeline enhancement. SE-4 scope. |
| `hm-code-review` | **SE-5** | Depends on hm-planning-persistence for findings storage. SE-5 is the quality gate phase — code-review, uat-verify, ship built as cohesive pipeline. |
| `hm-uat-verify` | **SE-5** | Depends on SE-5 code-review producing passable findings. SE-5 builds UAT as second quality gate stage. |
| `hm-ship` | **SE-5** | Depends on SE-5 uat-verify pass result. SE-5 builds ship as terminal quality gate stage. |
| `hm-autonomous-driver` | **SE-5** | Consumes all preceding pipeline skills. SE-5 is natural home for auto-mode engine. |
| `hm-docs-generator` | **SE-6** | Documentation generation is auxiliary, not core pipeline. SE-6 is the documentation + meta phase. |
| `hm-meta-builder` enhancements | **SE-6** | Meta-builder enhancement for pipeline skill authoring. SE-6 scope. |
| Internal gate-* hardening | **SE-5.5** | gate-evidence-truth, gate-lifecycle-integration, gate-spec-compliance hardening. Internal only. |
| Integration verification | **SE-7** | Full pipeline integration testing across all phases. |

### Not Required (Already Covered)

| Workflow | Covered By | Notes |
|---|---|---|
| Phase orchestration | `hm-phase-execution` + `hm-coordinating-loop` | Existing skills handle wave-based execution + coordination gates |
| Research pipeline | `hm-research-chain` → `hm-deep-research` → `hm-synthesis` | Complete and working. No changes needed in SE-2 |
| Spec locking | `hm-spec-driven-authoring` | Complete and working. Only needs reference fix |
| TDD execution | `hm-test-driven-execution` | Complete and working. Only needs reference fix |
| Refactoring | `hm-refactor` | Complete and working. Only needs reference fix |
| Debugging | `hm-debug` | Complete and working. Only needs reference fix |
| Completion guardrail | `hm-completion-looping` | Complete and working. Only needs reference fix |
| Delegation patterns | `hm-subagent-delegation-patterns` | Complete and working. Only needs reference fix |
| Phase iteration | `hm-phase-loop` | Complete and working. Only needs reference fix |

---

## Intensive Research Requirements

Every SE-2 skill must complete structured research before SKILL.md authoring. This section defines the research scope for `hm-planning-persistence`, the sole new skill created in this phase.

### Research Protocol (hm-planning-persistence)

The skill must produce `research/design-decisions.md` in its directory covering:

1. **Pattern Analysis:** What patterns exist in GSD equivalents? What works, what doesn't?
2. **Third-Party Comparison:** What do equivalent skills on skills.sh / repomix do differently?
3. **Integration Surface:** What exact artifacts does this skill read/write? What format?
4. **Error Modes:** What happens when upstream artifacts are missing or malformed?
5. **Rejected Alternatives:** What approaches were considered and why were they rejected?

### Third-Party Skills to Synthesize

- Search [skills.sh](https://skills.sh) for "planning", "task-tracking", "persistence", "file-based-planning" patterns
- Search [repomix](https://repomix.com) for equivalent project planning tools
- Analyze `obsidian-tasks`, `todo-tree`, and other file-based task management tools for conventions
- Analyze Manus-style `planning-with-files` implementations for task_plan.md/progress.md patterns

### GSD Workflows to Deep-Read

| GSD Workflow | What to Extract |
|---|---|
| `gsd-planning-with-files` (disabled skill at `donotusethis-hm-planning-with-files/`) | SKILL.md + references/ for task_plan.md, findings.md, progress.md patterns. Why was it disabled? What patterns are worth keeping? |
| `gsd-execute-phase` | How does GSD track plan execution state across waves? What checkpoints does it use? |
| `gsd-pause-work` | How does GSD serialize mid-phase state for later resume? What data must be preserved? |
| `gsd-resume-work` | How does GSD reconstruct context from serialized state? What's the minimal restoration set? |
| `gsd-plan-phase` | Plan file format conventions, task breakdown structure, dependency notation |

### Bundled Resources to Create

| Resource | Content |
|---|---|
| `references/metadata-schema.json` | JSON Schema for session metadata format |
| `references/state-transitions.md` | Valid state transitions for task lifecycle |
| `references/file-formats.md` | Canonical format definitions for task_plan.md, findings.md, progress.md |
| `templates/task_plan.md` | Template with goal + phases + decisions structure |
| `templates/findings.md` | Template with research + technical discoveries sections |
| `templates/progress.md` | Template with session log + errors + handoffs structure |

### Key Design Questions

The research phase must answer these questions before SKILL.md is written:

1. **Storage location:** `.hivemind/state/planning/<session-id>/` vs flat `.hivemind/state/planning/` — session-isolated or flat?
2. **File format:** Should state be structured (YAML frontmatter) or freeform (markdown)? What did GSD get right/wrong?
3. **Concurrency:** How does persistence handle concurrent writes? (Advisory locks? Single-writer assumption? O_CLOEXEC?)
4. **Cleanup strategy:** Manual? TTL-based archival? Explicit `hm-planning-persistence --cleanup`?
5. **Fallback path:** When `.hivemind/` doesn't exist (non-Hivemind project), use `.session/` — what's the exact behavior?
6. **RICH compliance:** What do RICH-1 through RICH-8 require for this skill? Which are achievable in SE-2?
7. **Language-agnostic:** Must not embed TypeScript, Python, or any language-specific assumptions — how is this validated?

---

## Phase Integration Handoff (SE-2 → SE-3 through SE-7)

Explicit handoff contracts between SE-2 and subsequent phases. Each downstream phase documents what it consumes from SE-2 and what it must validate before proceeding.

### SE-2 Produces (Deliverables for Downstream)

| Artifact | Consumer(s) | Format |
|---|---|---|
| `hm-planning-persistence` SKILL.md + references/ | SE-3, SE-4, SE-5, SE-6 | Skill with pipeline contract frontmatter |
| `.hivemind/state/planning/<session-id>/` directory structure | SE-3, SE-4, SE-5, SE-6 | Structured directories with task_plan.md, findings.md, progress.md |
| Broken reference fixes (11 in 10 skills + hm-meta-builder) | All existing hm-* skills | Updated references from `hm-planning-with-files` → `hm-planning-persistence` |
| D-04: hm-coordinating-loop soft boundary (CRITICAL) | All coordination workflows | Remove HIERARCHY ENFORCEMENT hard block |
| Archived disabled skill (`donotusethis-hm-planning-with-files` → `.opencode/retired/`) | SE-7 (verification) | Deprecation note referencing replacement |
| `research/design-decisions.md` for hm-planning-persistence | SE-3, SE-5 | Design rationale evidence |

### SE-3 Consumes (Brainstorm → Requirements → Plan)

| SE-2 Artifact | How SE-3 Uses It |
|---|---|
| `hm-planning-persistence` contract | SE-3 pre-gate skills (hm-brainstorm, hm-requirements-analysis, hm-plan-generator) read/write through persistence |
| `.hivemind/state/planning/` structure | SE-3 writes brainstorm artifacts and plan.md to planning directory |
| Fixed references in hm-spec-driven-authoring | SE-3 plan-generator reads spec-locked requirements through corrected persistence path |

**SE-3 Validation Gate:** Before SE-3 starts, verify:
- [ ] `hm-planning-persistence` is functional and produces valid directory structure
- [ ] All 11 broken references are fixed (hm-coordinating-loop is fully unblocked)
- [ ] `hm-user-intent-interactive-loop` → `hm-planning-persistence` integration chain works

### SE-4 Consumes (Research Pipeline)

| SE-2 Artifact | How SE-4 Uses It |
|---|---|
| `hm-planning-persistence` contract | SE-4 research skills (hm-tech-stack-ingest, hm-research-chain) persist findings |
| `.hivemind/state/planning/findings.md` | SE-4 writes technical research discoveries |

**SE-4 Validation Gate:** Before SE-4 starts, verify:
- [ ] SE-3 pre-gate skills are functional
- [ ] Research pipeline (hm-research-chain, hm-deep-research, hm-synthesis) works end-to-end with new persistence

### SE-5 Consumes (Quality Gate Pipeline)

| SE-2 Artifact | How SE-5 Uses It |
|---|---|
| `hm-planning-persistence` contract | SE-5 quality skills (hm-code-review, hm-uat-verify, hm-ship, hm-autonomous-driver) read/write through persistence |
| `.hivemind/state/planning/progress.md` | SE-5 tracks quality gate status in progress log |

**SE-5 Validation Gate:** Before SE-5 starts, verify:
- [ ] All pipeline stages from SE-2, SE-3, and SE-4 are functional
- [ ] `.hivemind/state/planning/` has valid entries from at least one complete pipeline run
- [ ] `hm-planning-persistence` handles concurrent quality gate writes correctly

### SE-6 Consumes (Documentation + Meta-Builder)

| SE-2 Artifact | How SE-6 Uses It |
|---|---|
| `hm-planning-persistence` contract | SE-6 hm-docs-generator reads planning artifacts for documentation generation |
| `.hivemind/state/planning/` artifacts | SE-6 extracts project context from task_plan.md + findings.md for README/API docs |
| Fixed hm-meta-builder routing table | SE-6 meta-builder routes to correct pipeline entry points |

**SE-6 Validation Gate:** Before SE-6 starts, verify:
- [ ] Full pipeline (init → roadmap → plan → execute → review → verify → ship) completes at least once
- [ ] All pipeline skills produce the artifacts declared in their contracts

### SE-7 Consumes (Integration Verification)

| SE-2 Artifact | How SE-7 Uses It |
|---|---|
| `hm-planning-persistence` SKILL.md | SE-7 reauthorizes against RICH gate standards |
| Broken reference fixes | SE-7 verifies all references are correct post-fix |
| `.hivemind/state/planning/` directory structure | SE-7 validates Q6 compliance (no .opencode/ state leakage) |
| Archived disabled skill | SE-7 confirms archival + deprecation note |

**SE-7 Validation Gate:** Before SE-7 starts, verify:
- [ ] SE-2 through SE-6 are fully complete
- [ ] 0 of N skills currently pass RICH — SE-7 measures improvement, not perfection

### Integration Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| SE-3 pre-gate skills need different persistence schema than SE-2 defines | Medium | High — requires SE-2 rollback | D-09 pipeline contracts; SE-3 authors must validate SE-2 contracts before building |
| SE-5 quality skills can't read SE-2 persistence format | Medium | Medium — quality gates blocked | Schema validation; SE-2 produces migration guide if format evolves |
| Existing hm-* skills reject new `.hivemind/state/planning/` structure | Low | Medium — integration breaks | SE-2 fixes all references; integration test: run hm-research-chain with new persistence |
| `.hivemind/state/planning/` directory bloat | High | Low — cleanup is manual | Session-isolated directories make cleanup trivial; SE-5 may add TTL-based archival |
- **ALL new skills MUST pass SKILL-CRITERIA-SHORT.md gate before ship**
