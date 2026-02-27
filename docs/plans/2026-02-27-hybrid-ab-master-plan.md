# HYBRID-A+B Master Plan: Command Chaining + SOT Planning Layer

> **Date**: 2026-02-27
> **Direction**: Hybrid A+B (User-confirmed)
> **Output Style**: Architecture/Planning
> **Version**: 2.8.5 → 2.9.0 target
> **Branch**: v-2.9-harness-dev
> **Baseline**: 210/210 tests, 0 tsc errors, 1363 PASS / 0 FAIL / 0 WARN framework validation

---

## Executive Summary

This plan interleaves two parallel tracks across 6 waves:

- **Track A** (Command→Workflow Chaining): Wire 32 unchained commands with `execution_context`, `required_templates`, and `required_references/prompts`. Create missing workflow YAMLs and templates. This directly addresses THE-ZERO-EVENT's #1 priority.
- **Track B** (SOT Planning Layer): Build `.hivemind/project/planning/` GSD-style hierarchy, implement auto-session mechanism, and connect context lifecycle memory classification. This addresses SYSTEM-DIRECTIVES §1-§4.

Tracks converge at **Wave 3** where commands route INTO the planning layer, completing the full chain: `command → workflow → skill → agent → planning artifact`.

---

## Current State (Evidence-Based)

| Domain | Score | Evidence |
|--------|-------|----------|
| Source Code | 10/10 | 210/210 tests, 0 tsc errors, 139 TS files |
| Framework Validator | 10/10 | 1363 PASS / 0 FAIL / 0 WARN |
| Agents | 9/10 | 8/8 hardened, mode/tools/permissions proper |
| Skills Registry | 9/10 | 33 skills, 7 bundles, L0-L3, registry.yaml SOT |
| Workflows | 9/10 | 20/20 v2 compliant with skill_bundles |
| Profiles | 10/10 | 4/4 manifests (core/balanced/full/legacy-compat) |
| Init Flow | 9/10 | Brownfield-validated, wizard functional |
| Command→Asset Chaining | 3/10 | 27% workflow-chained, 0% reference/prompt-chained |
| SOT Planning Layer | 0/10 | `.hivemind/project/planning/` MISSING |
| Code Intelligence | 1/10 | codemap+codewiki manifests EMPTY |
| Progressive Disclosure | 0/10 | Wave D not started — no runtime loader |
| Observability | 0/10 | Wave E not started — no chain traces |

---

## 5 Validated Gaps

### GAP-1: Command Chaining Is Broken (CRITICAL)
- 32/44 commands (73%) have no `execution_context` workflow routing
- 0/44 commands reference `prompts/` or `references/` directories
- HiveFiver module (18 commands) has ZERO workflow chaining
- Wired pattern: `kind: router` + `execution_context: workflows/*.yaml` + `required_templates: [...]`

### GAP-2: SOT Planning Layer Doesn't Exist (CRITICAL)
- `.hivemind/project/planning/` directory does not exist
- GSD-style hierarchy (PROJECT.md, REQUIREMENTS.md, ROADMAP.md, STATE.md, phases/) unbuilt
- "Auto-parsed-into mechanism" described in SYSTEM-DIRECTIVES as "game-changing-and-measurable-factor" is unbuilt

### GAP-3: Progressive Disclosure Loader (HIGH)
- Plan v2 Wave D: bundle-scoped, disclosure-level-controlled loading — none exists in runtime
- Skills load all-or-nothing via skill tool
- No per-knot token budgets

### GAP-4: Code Intelligence Is Hollow (MEDIUM)
- Codemap: `nodes: []`
- Codewiki: `articles: []`
- Three SOT pillars (Codewiki, Codemap, Code-Intel) structurally present but functionally empty

### GAP-5: Auto-Session + Context Lifecycle (MEDIUM)
- No mechanism to auto-classify session events
- No auto-routing of new sessions
- No auto-purge of temporary context
- No project-scoped persistent STATE.md equivalent

---

## Architecture: Schema Contracts

### Command Wired Pattern (Target)

```yaml
# REQUIRED for all commands post-refactoring
name: <command-name>
description: <description>
owner_agent: <agent>
kind: router                              # NOT alias/utility
execution_context: workflows/<name>.yaml  # REQUIRED: workflow routing
required_skills:
  - <skill-1>
  - <skill-2>
required_templates:
  - templates/<template>.md
required_references:                      # NEW FIELD
  - references/<reference>.md
required_prompts:                         # NEW FIELD  
  - prompts/<prompt>.md
chain_group: <group>
group: <group>
entry_gate: session_declared
```

### Workflow v2 Contract (Two Tiers)

**Tier 1 — Orchestration** (hiveminder workflows):
- Full schema: domains, hierarchy, gatekeeping, result_handling, timeouts
- 7-10 steps with required_output, validation, on_failure, await_result

**Tier 2 — Persona/Utility** (hivefiver, hiveq, hiverd workflows):
- Minimal schema: steps with name/tool/wave/skill_bundles/args/entry_criteria/exit_criteria + guards
- 4-6 steps

### Planning Layer Schema (GSD-Mapped)

```
.hivemind/project/planning/
├── PROJECT.md              # ← trajectory.intent (always loaded)
├── REQUIREMENTS.md         # ← hierarchy nodes with IDs + phase traceability
├── ROADMAP.md              # ← hierarchy tree with status tracking
├── STATE.md                # ← anchors + mems (project-scoped persistent state) [NEW]
├── config.json             # ← .hivemind/config.json projection
├── MILESTONES.md           # ← completed trajectory archive
├── research/               # ← mems(shelf=research) materialized
│   ├── architecture/
│   ├── patterns/
│   ├── pitfalls/
│   ├── stacks/
│   └── summary/
├── todos/
│   ├── pending/            # ← hivemind_session_memory(todo_pending)
│   └── done/               # ← completed TODO items
├── debug/
│   ├── active/             # ← active debug sessions
│   └── resolved/           # ← archived debug sessions
├── codebase/               # ← brownfield scan output
│   ├── STACK.md
│   ├── ARCHITECTURE.md
│   ├── CONVENTIONS.md
│   └── CONCERNS.md
└── phases/
    └── XX-phase-name/
        ├── XX-YY-PLAN.md       # ← task execution plan
        ├── XX-YY-SUMMARY.md    # ← execution outcomes
        ├── CONTEXT.md          # ← implementation preferences
        ├── RESEARCH.md         # ← phase-specific research
        └── VERIFICATION.md    # ← post-execution verification
```

---

## Execution Waves

### Wave 1: Foundation Wiring (Track A + Track B in parallel)

#### Wave 1A: Command Schema Upgrade (Track A)
**Scope**: Add `required_references`, `required_prompts` fields to command contract schema. Update `validate-framework.sh` to validate these new fields.

| Knot | Task | Files | Agent |
|------|------|-------|-------|
| 1A.1 | Add `required_references` and `required_prompts` to command contract validation in `validate-framework.sh` | `scripts/validate-framework.sh` | hivemaker |
| 1A.2 | Update 12 already-wired commands (hiverd-*, hiveq-*) to add `required_references` and `required_prompts` where applicable | `commands/hiverd-*.md`, `commands/hiveq-*.md` | hivemaker |
| 1A.3 | Verify: `bash scripts/validate-framework.sh` passes with new fields | — | hiveq |

**Acceptance Criteria**:
- `validate-framework.sh` checks `required_references` and `required_prompts` on `kind: router` commands
- 12 wired commands updated with reference/prompt wiring
- Framework validation: 0 FAIL

#### Wave 1B: Planning Directory Bootstrap (Track B)
**Scope**: Create `.hivemind/project/planning/` directory structure and initial files. Wire into init flow.

| Knot | Task | Files | Agent |
|------|------|-------|-------|
| 1B.1 | Create planning directory structure with empty template files | `.hivemind/project/planning/**` | hivemaker |
| 1B.2 | Add planning directory creation to `src/cli/init.ts` init flow | `src/cli/init.ts` | hivemaker |
| 1B.3 | Create `src/schemas/planning.ts` with Zod schemas for PROJECT, REQUIREMENTS, ROADMAP, STATE | `src/schemas/planning.ts` | hivemaker |
| 1B.4 | Create `src/lib/planning-fs.ts` functions for reading/writing planning artifacts | `src/lib/planning-fs.ts` (update existing) | hivemaker |
| 1B.5 | Add tests for planning schema + planning-fs | `tests/planning.test.ts` | hivemaker |
| 1B.6 | Verify: `npm test` + `npx tsc --noEmit` pass | — | hiveq |

**Acceptance Criteria**:
- `npm exec hivemind-context-governance` creates `.hivemind/project/planning/` with template files
- Zod schemas validate planning artifact structure
- Planning-fs can read/write PROJECT.md, STATE.md, ROADMAP.md
- All tests pass

---

### Wave 2: Bulk Command Wiring (Track A) + Auto-Session Foundation (Track B)

#### Wave 2A: Wire HiveFiver Commands (Track A)
**Scope**: Create workflow YAMLs for unchained hivefiver commands. Update command frontmatter to `kind: router` with `execution_context`.

| Knot | Task | Files | Agent |
|------|------|-------|-------|
| 2A.1 | Create `workflows/hivefiver-init.yaml` (Tier 2 persona workflow) | `workflows/hivefiver-init.yaml` | hivemaker |
| 2A.2 | Create `workflows/hivefiver-build.yaml` (Tier 2, TDD-gated) | `workflows/hivefiver-build.yaml` | hivemaker |
| 2A.3 | Create `workflows/hivefiver-spec.yaml` (Tier 2, spec-distillation) | `workflows/hivefiver-spec.yaml` | hivemaker |
| 2A.4 | Create `workflows/hivefiver-deploy.yaml` (Tier 2, deploy-gated) | `workflows/hivefiver-deploy.yaml` | hivemaker |
| 2A.5 | Create `workflows/hivefiver-ideate.yaml` (Tier 2, Q.U.A.N.T. matrix) | `workflows/hivefiver-ideate.yaml` | hivemaker |
| 2A.6 | Create `workflows/hivefiver-audit-workflow.yaml` (Tier 2, audit pipeline) | `workflows/hivefiver-audit-workflow.yaml` | hivemaker |
| 2A.7 | Create `workflows/hivefiver-research-workflow.yaml` (Tier 2, MCP research) | `workflows/hivefiver-research-workflow.yaml` | hivemaker |
| 2A.8 | Create `workflows/hivefiver-validate-workflow.yaml` (Tier 2, validation) | `workflows/hivefiver-validate-workflow.yaml` | hivemaker |
| 2A.9 | Create remaining hivefiver workflow YAMLs (tutor, workflow) | `workflows/hivefiver-tutor.yaml`, `workflows/hivefiver-workflow-workflow.yaml` | hivemaker |
| 2A.10 | Update all hivefiver command frontmatter: `kind: router`, `execution_context`, `required_templates`, `required_references`, `required_prompts` | `commands/hivefiver-*.md` (14 files) | hivemaker |
| 2A.11 | Create missing templates for hivefiver commands | `templates/hivefiver-*.md` | hivemaker |
| 2A.12 | Verify: `validate-framework.sh` passes, parity sync clean | — | hiveq |

**Acceptance Criteria**:
- All 14 hivefiver commands have `kind: router` + `execution_context`
- All new workflows have `contract_version: 2` + `skill_bundles` per step
- Framework validation: 0 FAIL
- Parity sync: `.opencode/` matches root

#### Wave 2B: Wire Hiveminder Commands (Track A)
**Scope**: Create workflow YAMLs for unchained hiveminder commands.

| Knot | Task | Files | Agent |
|------|------|-------|-------|
| 2B.1 | Create `workflows/hiveminder-orchestrate.yaml` (Tier 1, full orchestration) | `workflows/hiveminder-orchestrate.yaml` | hivemaker |
| 2B.2 | Create `workflows/hiveminder-delegate.yaml` (Tier 1, delegation) | `workflows/hiveminder-delegate.yaml` | hivemaker |
| 2B.3 | Create `workflows/hiveminder-context.yaml` (Tier 2, context management) | `workflows/hiveminder-context.yaml` | hivemaker |
| 2B.4 | Create `workflows/hiveminder-scan.yaml` (Tier 2, inspection) | `workflows/hiveminder-scan.yaml` | hivemaker |
| 2B.5 | Create `workflows/hiveminder-status.yaml` (Tier 2, status reporting) | `workflows/hiveminder-status.yaml` | hivemaker |
| 2B.6 | Create remaining hiveminder workflow YAMLs (compact, lint, clarify, pre-stop, dashboard) | `workflows/hiveminder-*.yaml` | hivemaker |
| 2B.7 | Update all hiveminder command frontmatter | `commands/hiveminder-*.md`, `commands/hivemind-*.md` (10 files) | hivemaker |
| 2B.8 | Create missing templates for hiveminder commands | `templates/hiveminder-*.md` | hivemaker |
| 2B.9 | Verify: `validate-framework.sh` + parity | — | hiveq |

**Acceptance Criteria**:
- All 10 hiveminder commands have `kind: router` + `execution_context`
- Tier 1 orchestration workflows include domains, hierarchy, gatekeeping
- Framework validation: 0 FAIL

#### Wave 2C: Auto-Session Foundation (Track B)
**Scope**: Implement session auto-classification and planning artifact materialization.

| Knot | Task | Files | Agent |
|------|------|-------|-------|
| 2C.1 | Create `src/lib/planning-materializer.ts` — converts session trajectory/mems/anchors to planning artifacts (PROJECT.md, STATE.md, ROADMAP.md) | `src/lib/planning-materializer.ts` | hivemaker |
| 2C.2 | Create `src/lib/session-classifier.ts` — classifies session intent into planning categories (discovery, research, planning, implementing, debug, testing) | `src/lib/session-classifier.ts` | hivemaker |
| 2C.3 | Wire planning materialization into `compact_session` tool — on session close, materialize trajectory→planning artifacts | `src/tools/hivemind-session.ts` | hivemaker |
| 2C.4 | Add STATE.md persistence — project-scoped cross-session state that survives compaction | `src/lib/planning-fs.ts` | hivemaker |
| 2C.5 | Add tests for materializer + classifier + STATE.md | `tests/planning-materializer.test.ts`, `tests/session-classifier.test.ts` | hivemaker |
| 2C.6 | Verify: `npm test` + `npx tsc --noEmit` pass | — | hiveq |

**Acceptance Criteria**:
- `compact_session` materializes trajectory→PROJECT.md and anchors→STATE.md
- Session classifier categorizes intent into 6 categories
- STATE.md persists across sessions (survives compaction)
- All tests pass

---

### Wave 3: Convergence (Track A + Track B merge)

**Scope**: Commands now route INTO the planning layer. Workflows read/write planning artifacts. This is the convergence point.

| Knot | Task | Files | Agent |
|------|------|-------|-------|
| 3.1 | Wire debug commands (debug-trigger, debug-verify, dashboard) with execution_context + planning | `commands/hivemind-debug-*.md`, `workflows/debug-*.yaml` | hivemaker |
| 3.2 | Wire compat commands (doctor, gsd-bridge, ralph-bridge) with execution_context | `commands/hivefiver-*.md`, `workflows/compat-*.yaml` | hivemaker |
| 3.3 | Add planning artifact read/write to workflow step actions — workflows can now `read STATE.md`, `update ROADMAP.md`, `create phases/XX-YY-PLAN.md` | `src/lib/planning-fs.ts` | hivemaker |
| 3.4 | Wire `hiveminder-orchestrate` workflow to create phase plans in `.hivemind/project/planning/phases/` | `workflows/hiveminder-orchestrate.yaml` | hivemaker |
| 3.5 | Add planning awareness to `session-lifecycle.ts` hook — inject planning context on session start | `src/hooks/session-lifecycle.ts` | hivemaker |
| 3.6 | Parity sync: rsync all root assets → `.opencode/` | root → `.opencode/` | hivemaker |
| 3.7 | Full verification: `npm test` + `npx tsc --noEmit` + `validate-framework.sh` | — | hiveq |

**Acceptance Criteria**:
- 44/44 commands have `kind: router` + `execution_context` (100% chaining)
- All workflows v2 compliant
- Planning artifacts readable/writable from workflow steps
- Session lifecycle injects planning context
- Framework validation: 0 FAIL
- All tests pass

---

### Wave 4: Progressive Disclosure (Gap 3)

**Scope**: Implement local-first skill selection with bundle-scoped, disclosure-level-controlled loading.

| Knot | Task | Files | Agent |
|------|------|-------|-------|
| 4.1 | Create `src/lib/skill-loader.ts` — local-first skill resolver with bundle + disclosure level + token budget | `src/lib/skill-loader.ts` | hivemaker |
| 4.2 | Create `src/schemas/execution-knot.ts` — micro-laser execution unit with token budget, gate commands, required evidence | `src/schemas/execution-knot.ts` | hivemaker |
| 4.3 | Wire skill loader into workflow step execution — steps declare `skill_bundles` + `disclosure_level` | `src/hooks/session-lifecycle.ts` | hivemaker |
| 4.4 | Implement L0 bootstrap-minimal loading — only governance-core L0 skills on first turn | `src/hooks/session-lifecycle.ts` | hivemaker |
| 4.5 | Implement L1-L3 escalation path — load deeper skills only when triggered | `src/lib/skill-loader.ts` | hivemaker |
| 4.6 | Add token budget enforcement — downgrade/escalation on budget breach | `src/lib/skill-loader.ts` | hivemaker |
| 4.7 | Add tests for skill loader + execution knot | `tests/skill-loader.test.ts`, `tests/execution-knot.test.ts` | hivemaker |
| 4.8 | Verify: `npm test` + `npx tsc --noEmit` + `validate-framework.sh` | — | hiveq |

**Acceptance Criteria**:
- Skill loading is bundle-scoped and disclosure-level-controlled
- First-turn bootstrap loads only L0 governance-core
- Token budget enforced per execution knot
- Escalation path works for L1→L3
- All tests pass

---

### Wave 5: Code Intelligence (Gap 4)

**Scope**: Populate codemap and codewiki. Connect to planning layer.

| Knot | Task | Files | Agent |
|------|------|-------|-------|
| 5.1 | Implement codemap auto-scan — populate `codemap/manifest.json` with file/module/dependency nodes | `src/tools/hivemind-codemap.ts` | hivemaker |
| 5.2 | Implement codewiki auto-generation — populate `codewiki/manifest.json` with documentation articles | `src/tools/hivemind-codemap.ts` | hivemaker |
| 5.3 | Wire codemap scan into brownfield workflow — `map-codebase` produces `codebase/STACK.md` etc | `workflows/hivemind-brownfield-bootstrap.yaml` | hivemaker |
| 5.4 | Wire code intelligence into planning — codebase mapping populates `.hivemind/project/planning/codebase/` | `src/lib/planning-materializer.ts` | hivemaker |
| 5.5 | Add tests for codemap population + codewiki generation | `tests/codemap-population.test.ts` | hivemaker |
| 5.6 | Verify | — | hiveq |

**Acceptance Criteria**:
- `codemap/manifest.json` populated with file nodes
- `codewiki/manifest.json` populated with articles
- Brownfield workflow produces codebase analysis
- All tests pass

---

### Wave 6: Observability + Hardening (Gap 5 + Final)

**Scope**: Add chain traces, context lifecycle automation, and final hardening.

| Knot | Task | Files | Agent |
|------|------|-------|-------|
| 6.1 | Add command→workflow→skill chain trace logging | `src/lib/chain-trace.ts` (new) | hivemaker |
| 6.2 | Add context lifecycle memory auto-classification (temporary→consolidated→purged) | `src/lib/memory-lifecycle.ts` (new) | hivemaker |
| 6.3 | Add auto-session routing — new sessions auto-classified into planning categories | `src/lib/session-classifier.ts` | hivemaker |
| 6.4 | Add failure signatures for context poisoning patterns | `src/lib/chain-trace.ts` | hivemaker |
| 6.5 | Gate deployment on zero ambiguous route collisions | `scripts/validate-framework.sh` | hivemaker |
| 6.6 | Update agent definitions with `references` field for hiveminder + hivefiver | `agents/hiveminder.md`, `agents/hivefiver.md` | hivemaker |
| 6.7 | Full regression: `npm test` + `npx tsc --noEmit` + `validate-framework.sh` + parity sync | — | hiveq |
| 6.8 | Merge candidate skill review (3 skills: gsd-compat, parallel-debugging, sequential-orchestration) | `skills/registry.yaml` | hiverd |

**Acceptance Criteria**:
- Chain trace logs command→workflow→skill→agent path
- Memory lifecycle auto-classifies and auto-purges
- Zero ambiguous route collisions
- All merge candidate skills resolved
- Full regression green

---

## Dependency Graph

```
Wave 1A ─────┐
             ├──→ Wave 2A ──→ Wave 2B ──┐
Wave 1B ─────┤                           ├──→ Wave 3 ──→ Wave 4 ──→ Wave 5 ──→ Wave 6
             └──→ Wave 2C ──────────────┘
```

- **Wave 1A + 1B**: Independent, parallel
- **Wave 2A + 2B**: Sequential (A before B, since hivefiver has more commands)
- **Wave 2C**: Parallel with 2A/2B (different file surfaces)
- **Wave 3**: Depends on 2A + 2B + 2C (convergence)
- **Wave 4-6**: Sequential (each builds on previous)

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Workflow YAML count explosion (~30 new files) | HIGH | MEDIUM | Use Tier 2 minimal schema; template-generate |
| Breaking existing wired commands during schema upgrade | LOW | HIGH | Test each group independently; regression gate |
| Planning materializer complexity | MEDIUM | HIGH | Start with PROJECT.md + STATE.md only; phase REQUIREMENTS/ROADMAP |
| Token budget enforcement breaking existing flows | MEDIUM | MEDIUM | Default budget = unlimited; opt-in enforcement |
| Parity sync drift during multi-wave changes | HIGH | LOW | Parity sync step in every wave |

---

## Success Metrics (End State)

| Metric | Current | Target |
|--------|---------|--------|
| Command→Workflow chaining | 27% (12/44) | 100% (44/44) |
| Command→Reference/Prompt wiring | 0% | 100% |
| Workflow v2 compliance | 100% (20/20) | 100% (50+/50+) |
| `.hivemind/project/planning/` | MISSING | COMPLETE with auto-materialization |
| Progressive disclosure | NONE | L0-L3 with token budgets |
| Code intelligence population | EMPTY | File nodes + articles |
| Chain trace observability | NONE | Full command→agent trace |
| Auto-session classification | NONE | 6-category auto-routing |
| Framework validation | 1363 PASS | 1800+ PASS / 0 FAIL |
| Tests | 210 | 260+ |

---

## Decision Locks

1. Root assets stay SOT; `.opencode` is deploy mirror only.
2. All commands MUST have `kind: router` + `execution_context` (no more standalone alias/utility commands for core functions).
3. Planning layer lives at `.hivemind/project/planning/` — never at root or `.opencode`.
4. Workflow Tier 1 (orchestration) only for hiveminder; Tier 2 (minimal) for all others.
5. Progressive disclosure defaults to L0 bootstrap; L1+ requires explicit trigger.
6. STATE.md is project-scoped persistent state — survives compaction and session boundaries.
7. Each wave has independent verification gate (`npm test` + `npx tsc --noEmit` + `validate-framework.sh`).
8. Parity sync runs at end of every wave.

---

## Assumptions

1. Sector-1 runtime code (`src/`) is stable (210/210 tests, 0 tsc errors) — no architectural changes needed.
2. Existing 20 workflows remain valid; new workflows follow same v2 contract.
3. skill-loader is a new module, not a modification of existing skill resolution.
4. Planning materializer is additive — no modifications to existing session/compact flow except the materialization hook.
5. Dashboard-v2 work remains separate from this plan.
6. Each wave is an independent deployment unit — can be released incrementally.

---

## Execution Protocol

1. Each wave starts with `declare_intent` + `map_context(tactic)`.
2. Each knot is a delegation to hivemaker with explicit scope, constraints, and acceptance criteria.
3. Each wave ends with hiveq verification + parity sync + `compact_session`.
4. User authorization required between waves.
5. Framework validation must be GREEN (0 FAIL) at every wave boundary.
