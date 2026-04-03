# HIVEMIND V3 — Architecture Proposal

**Date**: 2026-04-04
**Status**: Mindset Document — Defines what HIVEMIND IS before any code is written
**Authority**: This document overrides all prior architecture docs. It is the source of truth for what HIVEMIND V3 should be.

---

## 0. What HIVEMIND Actually Is

HIVEMIND is **not a codebase**. It is a **runtime composition engine** for OpenCode that enables agents to build, modify, and orchestrate other agents through a clean loop of:

```
User Intent → Runtime Build → Execution → Validation → Learn
```

It has **two halves** that must never be confused:

### Half 1: The Hard Harness (npm package — distributed via `@hivemind/hivemind-plugin`)
- **Tools** (write-side, CQRS): 5 core tools with Zod schemas that mutate state
- **Hooks** (read-side, CQRS): Event observers that inject context, never mutate
- **Plugin** (assembly, <100 LOC): Wires tools + hooks into OpenCode, zero business logic
- **Shared** (leaf module): Pure utilities, no dependencies on anything above

### Half 2: The Soft Meta-Concepts (user-configurable, `.opencode/` project space)
- **Skills** (SKILL.md + scripts): Portable instructions, the refactoring target
- **Agents**: OpenCode agent definitions with permission profiles
- **Commands**: Reusable command bundles with YAML frontmatter
- **Rules**: Behavioral constraints
- **Permissions**: Tool/skill/command access control
- **Custom Tools**: User-authored tools with Zod schemas

**The meta-builder** (Half 2's orchestrator) teaches agents how to author, audit, evaluate, and doctor Half 2 concepts. It is the bridge between user intent and runtime construction.

---

## 1. The Target Endpoint — Runtime Features

HIVEMIND V3 must deliver these runtime features (synthesized from oh-my-openagent, GSD, and original research):

| Feature | What It Does | Why It Matters |
|---------|-------------|----------------|
| **Background agents** | Run agents in background, continue working, retrieve results when ready | Parallel execution > sequential blocking |
| **Auto-loop / Ralph-loop** | Self-referential dev loop that runs until task completion | Agents persist through failures without user babysitting |
| **Delegation chain with task persistence** | Tasks persist across sessions via planning triplet | Work survives session boundaries |
| **Task queuing (full autonomy)** | Agents queue tasks, manage their own execution order | True autonomy, not just delegation |
| **Category system** | Agent configuration presets optimized for domains (visual-engineering, deep, quick, ultrabrain, etc.) | Domain-optimized > single generalist |
| **Session recovery** | Automatic recovery from tool failures, thinking block violations, empty messages, context overflow | Resilience in long-horizon work |

**These are the endpoint.** Everything else exists to enable these 6 features.

---

## 2. What Product-Detox Got Wrong (The Poison)

The product-detox branch (~15,000 LOC) is the anti-pattern. Here's what poisoned the context:

### 2.1 Feature Bloat
- `agent-work-contract/` — 30 files for one concept (should be 3)
- `runtime-entry/` — 20 files for session initialization (should be 5)
- `doc-intelligence/` — 10 files of redundant file reading (should be 0, use OpenCode native)
- Context renderer decomposed into 6 files (should be 1)
- 3 competing "runtime-status" modules (should be 1)

### 2.2 Script Poisoning
- **22 governance scripts** that block, judge, and dictate — instead of reporting facts
- **12 hardcoded absolute paths** that break on different install locations
- **3 state-mutation scripts** that create shadow state competing with OpenCode's runtime truth
- `hm-verify.cjs` (1,014 LOC) — Full governance suite baked into a skill script
- `context-harness-init.cjs` (514 LOC) — State management + rot scoring in a script

### 2.3 Skill Proliferation
- **235 SKILL.md files** across 7+ directories (target: ~20)
- `.developing-skills/` — 19 exact script copies with divergent SKILL.md
- `.codexdisabled/` — 44 disabled skills
- Platform copies (qwen/roo/opencode) — 43 duplicates
- **91% reduction needed**

### 2.4 Agent Triplication
- Root `agents/` (13 canonical) + `.opencode/agents0/` (14 copies) + `.opencode/agents-test-eval/` (14 copies) + `.opencode/agents-disabled/` (16 copies) = **57 agent files**
- Target: 13 canonical (77% reduction)

### 2.5 The Core Mistake
**Product-detox treats skills as the product.** It's not. Skills are the **instruction surface** — the user-facing documentation that tells agents how to use the harness. The harness IS the npm package (tools + hooks + plugin). Skills teach; the harness executes.

---

## 3. What harness-experiment Got Right (The Clean Prototype)

The harness-experiment branch (~2,547 LOC) is the clean architecture prototype:

### 3.1 What's Clean
- Single `plugin.ts` (447 LOC) as composition root — can be reduced to <100
- Clear module boundaries, no circular dependencies
- `tool.schema` (Zod) for all tool args
- `ToolContext` (sessionID, agent, directory, worktree, abort)
- 3 specialist agents with explicit permission profiles
- State machine for task transitions (7 states, validated transitions)
- Concurrency control via keyed semaphore
- `continuity.ts` (638 LOC) — durable JSON persistence

### 3.2 What Needs Work
- Only 1 tool (`delegate-task`) — needs 5 total
- Scripts embedded in skills need remediation (22 of 31 need conversion to report-only)
- No CLI substrate yet (bin/hivemind-tools.cjs proposed)
- No runtime composition engine yet (build-on-demand)
- No category system or session recovery

### 3.3 The Script Rule (From Deep Audit)

**A script should REPORT FACTS and LEAVE JUDGMENT TO THE AGENT.**

| ✅ OK (Pure Helpers) | ❌ BAN (Governance) |
|---------------------|---------------------|
| `init-session.sh` — creates skeleton files | `verify-hierarchy.sh` — exits 1 to block |
| `loop-status.sh` — reports status (exit 0) | `check-gate.sh` — 5 blocking gates |
| `session-checkpoint.sh` — saves snapshot | `preflight.sh` — GROUP scoring algorithm |
| `score-confidence.sh` — pure computation | `intent-verify.sh` — 11 blocking conditions |
| `hm-codescan.sh` — read-only scanning | `register-skill.sh` — state mutation |

---

## 4. The Meta-Builder — What It Actually Does

The meta-builder (`.hivefiver-meta-builder/`) is the **orchestrator skill system** that enables users to:

1. **Create** — Author new skills, agents, commands, tools, workflows
2. **Audit** — Validate existing concepts against quality standards
3. **Evaluate** — Test concepts against real scenarios
4. **Doctor** — Fix, improve, and optimize broken concepts

It operates through a **hierarchical relational graph** (MINDNETWORK) where:

- **GROUP 1 skills** (implementation): `user-intent-interactive-loop`, `coordinating-loop`, `planning-with-files`, `tech-to-feature-synthesis`, `deep-investigation`, TDD
- **GROUP 2 skills** (domain-exclusive): `use-authoring-skill` — bridges to all other packages
- **Custom tools**: User-authored tools with Zod schemas, session context, multi-language support
- **Hooks**: Event subscribers that observe and inject context

The meta-builder's job is to **teach skills to teach skills** — enabling users to stack OpenCode soft concepts (agents + skills + commands + tools + permissions + rules) into custom workflows for their specific needs.

**Constraints on meta-builder scripts:**
- All scripts must be recoded per the audit (`docs/project/codebase-audit/audit-scripts-in-skills-2026-04-04.md`)
- No governance scripts — only pure helpers (report facts, exit 0)
- No hardcoded absolute paths — use env vars or relative paths
- No state mutation — state belongs to tools (CQRS write-side)

---

## 5. The Architecture — Clean Module Structure

```
src/
├── plugin/              # Assembly (<100 LOC) — wires tools + hooks
│   └── opencode-plugin.ts
│
├── tools/               # 5 tools (~500 LOC total, write-side CQRS)
│   ├── runtime/         # hivemind_runtime_status + hivemind_runtime_command
│   ├── delegation/      # hivemind_delegation (create/export/handoff packets)
│   ├── trajectory/      # hivemind_trajectory (manage trajectory records)
│   ├── task/            # hivemind_task (track tasks within workflows)
│   └── doc/             # hivemind_doc (documentation operations)
│
├── hooks/               # Event handlers (~800 LOC, read-side CQRS)
│   ├── event-handler.ts # Main event router
│   ├── start-work/      # Session initialization hooks
│   ├── soft-governance.ts # Context injection (read-only)
│   └── sdk-context.ts   # SDK context enrichment
│
├── lifecycle/           # Session management (~400 LOC)
│   ├── session-manager.ts
│   ├── session-state.ts
│   └── session-events.ts
│
├── delegation/          # Delegation logic (~400 LOC)
│   ├── delegation-router.ts
│   ├── delegation-packet.ts
│   └── delegation-store.ts
│
├── continuity/          # State persistence (~400 LOC)
│   ├── state-store.ts
│   ├── trajectory-store.ts
│   └── workflow-store.ts
│
├── cli/                 # CLI substrate (~500 LOC)
│   ├── hivemind-tools.cjs  # Central router (modeled after gsd-tools.cjs)
│   ├── lib/
│   │   ├── core.cjs        # Core utilities
│   │   ├── state.cjs       # State management
│   │   ├── skill.cjs       # Skill discovery/validation
│   │   ├── eval.cjs        # Eval harness
│   │   ├── scaffold.cjs    # Project scaffolding
│   │   └── config.cjs      # Configuration management
│   └── commands/        # CLI commands
│
├── control-plane/       # Control primitives (~400 LOC)
│   ├── primitives.ts
│   ├── intake.ts
│   └── runtime.ts
│
└── shared/              # Utilities (~800 LOC, leaf module)
    ├── paths.ts
    ├── tool-helpers.ts
    ├── opencode-agent-registry.ts
    └── errors.ts
```

### Dependency Rules (NON-NEGOTIABLE)
- `shared/` is leaf — depends on nothing
- `plugin/` depends on everything (assembly)
- `tools/`, `hooks/`, `cli/`, `control-plane/` depend on `lifecycle/`, `delegation/`, `continuity/`, `shared/`
- `lifecycle/`, `delegation/`, `continuity/` depend on `shared/` only
- **No circular dependencies** — enforced by boundary check
- **Max module size: 500 LOC** — enforced by lint:boundary

---

## 6. The 6 Runtime Features — How They Map to Code

| Feature | Implementation Location | How It Works |
|---------|----------------------|--------------|
| **Background agents** | `cli/lib/core.cjs` + `lifecycle/session-manager.ts` | Spawn subagent in background (tmux or async), track via `continuity/state-store.ts`, retrieve via `hivemind_runtime_status` tool |
| **Auto-loop / Ralph-loop** | `cli/lib/core.cjs` + `delegation/delegation-router.ts` | Self-referential loop: dispatch → validate → if fail, retry with context → repeat until `<promise>DONE</promise>` or max iterations |
| **Delegation chain with task persistence** | `delegation/delegation-store.ts` + `continuity/state-store.ts` | Every delegation writes to durable JSON store. Tasks persist across sessions. Planning triplet (task_plan.md, progress.md, findings.md) is the user-facing projection. |
| **Task queuing (full autonomy)** | `delegation/delegation-router.ts` + `lib/concurrency.ts` | Keyed semaphore manages concurrency. Agents queue tasks, process in order, re-queue on failure. No user intervention needed. |
| **Category system** | `cli/lib/config.cjs` + `shared/opencode-agent-registry.ts` | Agent profiles with model, temperature, prompt mindset presets. Categories: visual-engineering, deep, quick, ultrabrain, artistry, writing, unspecified-low, unspecified-high. |
| **Session recovery** | `lifecycle/session-manager.ts` + `continuity/state-store.ts` | On session resume, reconstruct state from continuity store. Handle: missing tool results, thinking block violations, empty messages, context overflow, JSON parse errors. |

---

## 7. What Scripts Should Exist (And What Shouldn't)

### In Skills (Soft Meta-Concepts)
Scripts in SKILL.md packs must be **pure helpers only**:

| Function | Example | Why OK |
|----------|---------|--------|
| File creation | `init-session.sh` creates planning templates | No judgment, pure scaffolding |
| Status reporting | `loop-status.sh` reports phase/gate status | Always exits 0, information only |
| Validation reporting | `validate-skill.sh` reports frontmatter issues | Reports errors, doesn't block |
| Scoring/analysis | `score-confidence.sh` computes from inputs | Pure computation, no I/O judgment |
| Code scanning | `hm-codescan.sh` reads and reports structure | Read-only, outputs findings |
| Checkpointing | `session-checkpoint.sh` saves state snapshot | Information gathering |

### In CLI Substrate (Hard Harness)
The CLI (`bin/hivemind-tools.cjs`) replaces scattered bash scripts:

| Command | Replaces | What It Does |
|---------|----------|--------------|
| `hivemind-tools eval run` | Python eval_runner.py | Run eval harness, report results |
| `hivemind-tools scaffold init` | init-session.sh × N | Create project scaffolding |
| `hivemind-tools skill validate` | validate-skill.sh | Validate SKILL.md against contract |
| `hivemind-tools skill discover` | (new) | Discover installed skills |
| `hivemind-tools state show` | (new) | Show current state (JSON) |
| `hivemind-tools state reset` | (new) | Reset state to clean |

**All governance logic moves to:**
- SKILL.md instructions (agent reads conditions, decides)
- Tool implementations (CQRS write-side, with Zod validation)
- Hook implementations (CQRS read-side, context injection)

**Nothing stays in scripts.** Scripts are dumb helpers that report facts.

---

## 8. Success Metrics

| Metric | Product-Detox (Current) | HIVEMIND V3 (Target) | Reduction |
|--------|----------------------|---------------------|-----------|
| Total LOC | ~15,000 | ~4,000-5,000 | 67% |
| Core Modules | 50+ directories | 8-10 modules | 80% |
| Custom Tools | 11 | 5 | 55% |
| Plugin LOC | 269 | <100 | 63% |
| SKILL.md files | 235 | ~20 | 91% |
| Agent files | 57 | 13 | 77% |
| Governance scripts | 22 | 0 | 100% |
| Max module LOC | Unlimited | 500 | Enforced |

---

## 9. Migration Path (What Happens Next)

### Phase 1: Mindset (DONE — this document)
- [x] Define what HIVEMIND IS
- [x] Document what product-detox got wrong
- [x] Document what harness-experiment got right
- [x] Establish script rules (report facts, leave judgment to agent)
- [x] Map 6 runtime features to code locations

### Phase 2: Planning (Next)
- [ ] Load breakdown-feature-prd + breakdown-plan skills
- [ ] Archive violated scripts to `.archive/` with replacement references
- [ ] Extract valid practices from audit plan + PRD
- [ ] Create phase-by-phase execution plan with PRDs and epics
- [ ] Reference archived materials, NOT bring them forward

### Phase 3: Runtime Harness Synthesis
- [ ] PRD: On-demand runtime construction
- [ ] PRD: Full autonomy features (OMO synthesis)
- [ ] Epic: Deep synthesis & reflection on trash/failed attempts
- [ ] Validate: Plugin layer <100 LOC, Tools (5 core), Hooks (read-only), Shared (leaf)

### Phase 4: Master Plan & Checkpoint
- [ ] Comprehensive master plan with file tracking
- [ ] Document synthesis learnings
- [ ] Commit checkpoint with detailed report
- [ ] Readiness assessment for product-detox migration

### Phase 5: Implementation (BLOCKED until Phases 2-4 complete)
- [ ] CLI substrate (bin/hivemind-tools.cjs + bin/lib/)
- [ ] Runtime composition engine
- [ ] Category system + session recovery
- [ ] Eval harness + dual packaging

### Phase 6: Migration (BLOCKED until Phase 5 complete)
- [ ] Port validated skills to new architecture
- [ ] Eliminate product-detox bloat (67% reduction)
- [ ] Final validation + release v3.0.0

---

## 10. The Meta-Builder — Team Composition

The meta-builder is not a single skill. It's a **team of orchestrators and subagents**:

| Role | Skill | Purpose |
|------|-------|---------|
| **Hivefiver** (Orchestrator) | `the-meta-builder.md` | Architect, synthesize, orchestrate multi-agent workflows |
| **Intent Clarifier** | `user-intent-interactive-loop` | Elicit ideas, brainstorm, research, maintain control |
| **Coordinator** | `coordinating-loop` | Hand-offs, parallel/sequential dispatch, ralph-loop |
| **Planner** | `planning-with-files` | Template-rich planning, prevent hallucination |
| **Researcher** | `tech-to-feature-synthesis` + `deep-investigation` | Domain research, long-memory, progressive planning |
| **Author** | `use-authoring-skill` | Create → Audit → Evaluate → Doctor cycle |
| **Custom Tools** | User-authored with Zod schemas | Extend beyond built-in capabilities |
| **Hooks** | Event subscribers | Observe, inject context, never mutate |

**The constraint**: All scripts in these skill packs must follow the audit rules (pure helpers, no governance, no hardcoded paths, no state mutation).

---

## 11. Evidence Trail

| Source | What It Contributed |
|--------|-------------------|
| `docs/project/codebase-audit/audit-scripts-in-skills-2026-04-04.md` | Script classification (22 governance, 15 helpers, 3 banned) |
| `docs/draft/architecture-proposal-hivemind-v3.md` | Module structure, tool rationalization, migration plan |
| `.hivefiver-meta-builder/plans/the-meta-builder.md` | Meta-builder role definition, GROUP 1/2 skills |
| `.hivefiver-meta-builder/plans/skills-to-build-meta.md` | Meta-builder skill system architecture |
| `AGENTS.md` (root) | THE LOOP, runtime principles, coordinator mandate |
| Deep research (interaction_id: `trun_ce9a95e2e6c5494d911fa1b86fc53ae1`) | GSD CLI, OMO features, npm best practices |
| OMO features.md | 6 runtime features (background agents, ralph-loop, categories, etc.) |

---

**Status**: ✅ Mindset Document Complete
**Next**: Phase 2 — Planning (load breakdown skills, archive scripts, extract valid practices)
**Owner**: HIVEMIND V3 Architecture Team
