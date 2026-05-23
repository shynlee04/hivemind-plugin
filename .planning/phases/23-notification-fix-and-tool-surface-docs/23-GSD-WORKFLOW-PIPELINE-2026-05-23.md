# GSD Workflow Pipeline — Deep Analysis

> **Source:** GSD Repomix output `5875fd23ec62fc70` — docs/FEATURES.md, docs/ARCHITECTURE.md §Data Flow, docs/USER-GUIDE.md, docs/workflow-discuss-mode.md, docs/STATE-MD-LIFECYCLE.md
> **Date:** 2026-05-23
> **Evidence Level:** L3 (documented observation from GSD docs)
> **Audience:** Hivemind engineers building phase execution pipeline

---

## 1. THE COMPLETE PIPELINE

GSD's end-to-end pipeline:

```
new-project → discuss-phase → [ui-phase] → plan-phase → execute-phase → verify-work → [ui-review] → ship
```

[L22407-L22420]

Each stage produces artifacts consumed by the next:

```
PROJECT.md ─────────────────────────────────────► All agents
REQUIREMENTS.md ────────────────────────────────► Planner, Verifier, Auditor
ROADMAP.md ─────────────────────────────────────► Orchestrators
STATE.md ───────────────────────────────────────► All agents (decisions, blockers)
CONTEXT.md (per phase) ─────────────────────────► Researcher, Planner, Executor
RESEARCH.md (per phase) ────────────────────────► Planner, Plan Checker
PLAN.md (per plan) ─────────────────────────────► Executor, Plan Checker
SUMMARY.md (per plan) ──────────────────────────► Verifier, State tracking
UI-SPEC.md (per phase) ─────────────────────────► Executor, UI Auditor
```

[L22410-L22420]

---

## 2. STAGE 1: PROJECT INITIALIZATION (`/gsd-new-project`)

**Purpose:** Transform an idea into structured project with research, requirements, and roadmap.

**Process:**
1. **Adaptive questioning** — Guided by "dream extraction" philosophy (not requirements gathering). Questions surface what the user wants to build, who the user is, tech preferences
2. **4 parallel researcher agents** — Investigate stack, features, architecture, and pitfalls simultaneously
3. **Research synthesis** — `gsd-research-synthesizer` combines into SUMMARY.md
4. **Requirements extraction** — Categorized into v1 (must-have), v2 (future), out-of-scope
5. **Roadmap generation** — Phase breakdown mapped to requirements with granularity control
6. **User approval** — User must approve before any code is written

[L26337-L26550]

**Produced artifacts:**
| Artifact | Description |
|----------|-------------|
| PROJECT.md | Project vision, constraints, decisions, evolution rules |
| REQUIREMENTS.md | Scoped requirements with unique IDs (REQ-XX) |
| ROADMAP.md | Phase breakdown with status + requirement mapping |
| STATE.md | Initial state: position, decisions, metrics |
| config.json | Workflow configuration |
| research/SUMMARY.md | Synthesized domain research |

[L26520-L26530]

**Granularity** controls phase count:
- `coarse`: 3-5 phases
- `standard`: 5-8 phases  
- `fine`: 8-12 phases

[L25040-L25050]

---

## 3. STAGE 2: PHASE DISCUSSION (`/gsd-discuss-phase`)

GSD has TWO modes for gathering implementation context before planning:

### 3.1 Mode 1: `discuss` (interview-style, default)

The original flow: Claude identifies gray areas in the phase, presents them for selection, then asks ~4 questions per area. Good for early phases, strong user opinions, conversational context gathering. [L34244-L34250]

### 3.2 Mode 2: `assumptions` (codebase-first)

Claude deeply analyzes the codebase first (reading 5-15 files via subagent), forms assumptions with file:line evidence, and presents them for confirmation or correction. Good for established codebases, experienced users, faster context gathering (~2-4 interactions vs ~15-20). [L34252-L34260]

**How assumptions mode works:**
1. **Init** — Load prior context, scout codebase, check todos
2. **Deep analysis** — Subagent reads 5-15 codebase files related to the phase
3. **Surface assumptions** — Each includes: what Claude would do + why (citing file paths), what goes wrong if incorrect, confidence level (Confident / Likely / Unclear)
4. **Confirm or correct** — User reviews, selects items needing change
5. **Write CONTEXT.md** — Identical output to interview mode

[L34274-L34284]

### 3.3 Both modes produce identical CONTEXT.md format:

```markdown
<domain> — Phase boundary
<decisions> — Locked implementation decisions  
<canonical_refs> — Specs/docs downstream agents must read
<code_context> — Reusable assets, patterns, integration points
<specifics> — User references and preferences
<deferred> — Ideas noted for future phases
```

[L34288-L34297]

**Flag compatibility:**

| Flag | discuss mode | assumptions mode |
|------|-------------|-----------------|
| --all | Discuss all gray areas | N/A |
| --auto | Auto-select defaults | Skips confirm gate |
| --batch | Batch intake | N/A (already batched) |
| --power | File-based answers | N/A |
| --assumptions | N/A | Surface assumptions |
| --analyze | Trade-off tables | N/A (assumptions include evidence) |

---

## 4. STAGE 3: PHASE PLANNING (`/gsd-plan-phase`)

This is the most complex stage with multiple sub-steps and gates:

```
plan-phase:
  1. Research gate: blocks if RESEARCH.md has unresolved questions
  2. Phase Researcher → RESEARCH.md
     └── Package Legitimacy Gate: slopcheck on every package
  3. Planner (with reachability check) → PLAN.md files
     └── checkpoint:human-verify for [ASSUMED]/[SUS] installs
  4. Plan Checker → Verify loop (max 3 iterations)
  5. Requirements coverage gate (REQ-IDs → plans)
  6. Decision coverage gate (CONTEXT.md decisions → plans, BLOCKING)
  └── → state planned-phase → STATE.md updated
```

[L22407-L22420]

### 4.1 Research Gate (v1.32)

Blocks planning if RESEARCH.md has unresolved open questions. Ensures the planner has enough information before creating plans. Without this gate, the planner would make assumptions based on incomplete research. [L26627-L26678]

### 4.2 Package Legitimacy Gate (v1.42.1)

Three-layer supply-chain security gate:

| Layer | Component | Action |
|-------|-----------|--------|
| Research | gsd-phase-researcher | Runs `slopcheck install <pkgs> --json`; writes `## Package Legitimacy Audit` table to RESEARCH.md; strips `[SLOP]` packages entirely |
| Planning | gsd-planner | Reads Audit table; inserts `checkpoint:human-verify` before `[ASSUMED]`/`[SUS]` install tasks; adds `T-{phase}-SC` STRIDE supply-chain row |
| Execution | gsd-executor | RULE 3 excludes package installation from auto-fix scope; failed installs surface as checkpoints, never silent substitutions |

[L22680-L22720]

**Provenance system:** Package names sourced from WebSearch are tagged `[ASSUMED]` (not `[VERIFIED]`). `[ASSUMED]` always generates a checkpoint. Three verdicts:
- `[SLOP]` — removed from RESEARCH.md entirely, never reaches planner
- `[SUS]` — flagged; planner inserts `checkpoint:human-verify`
- `[OK]` — approved; no checkpoint

**Ecosystem coverage:** Uses registry-specific commands — `npm view` (Node), `pip index versions` (Python), `cargo search` (Rust). Graceful degradation: if `slopcheck` unavailable, every package tagged `[ASSUMED]`. [L22710-L22720]

### 4.3 Planner Reachability Check (v1.32)

Validates that every plan step references accessible files and APIs. Checks that file paths exist, module names resolve, and no steps reference things that don't exist. This prevents "plan against nothing" bugs. [L21314-L21316]

### 4.4 Plan Checker (8 Verification Dimensions)

Max 3 iterations. Checks each PLAN.md against:

| Dimension | Description |
|-----------|-------------|
| 1. Requirement coverage | Every REQ-ID maps to at least one plan |
| 2. Task atomicity | Each task is single-purpose, self-contained |
| 3. Dependency ordering | Plans respect declared dependency ordering |
| 4. File scope | Files to be modified are within declared scope |
| 5. Verification commands | Plans include how to verify completion |
| 6. Context fit | Plan fits in a single context window |
| 7. Gap detection | Detects gaps between requirements and tasks |
| 8. Nyquist compliance | When enabled, test coverage requirements are met |

[L21338-L21360]

### 4.5 Requirements Coverage Gate

Verifies that every REQ-ID in REQUIREMENTS.md maps to at least one plan. If a requirement has no plan, the gate blocks. This is enforced at planning time, not after execution. [L22407-L22420]

### 4.6 Decision Coverage Gate (v1.32, BLOCKING in plan-phase)

Verifies that every `<decision>` in CONTEXT.md is reflected in at least one plan. This prevents the scenario where a user-specified decision is silently dropped during planning. The same gate runs NON-BLOCKING in execute-phase (shipped artifacts should reflect decisions, but missing decisions are not a blocker). [L22410-L22415]

---

## 5. STAGE 4: PHASE EXECUTION (`/gsd-execute-phase`)

```
execute-phase:
  1. Context reduction: truncated prompts, cache-friendly ordering
  2. Wave analysis: dependency grouping
  3. Executor per plan → code + atomic commits
  4. SUMMARY.md per plan
  5. Verifier → VERIFICATION.md
     └── Decision coverage gate (NON-BLOCKING)
  6. Codebase drift gate: compare last_mapped_commit..HEAD
```

[L22407-L22420]

### 5.1 Wave Analysis

Plans are grouped into dependency waves:

```
Plan 01 (no deps): served in Wave 1
Plan 02 (no deps): served in Wave 1 (parallel with Plan 01)
Plan 03 (depends: 01): served in Wave 2 (waits for Wave 1)
Plan 04 (depends: 02): served in Wave 2 (parallel with Plan 03)
Plan 05 (depends: 03,04): served in Wave 3 (waits for Wave 2)
```

[L22304-L22310]

### 5.2 Post-Execute Codebase Drift Gate (v1.39, #2003)

After the last wave commits, GSD compares `last_mapped_commit..HEAD` against `.planning/codebase/STRUCTURE.md` and counts structural elements:

1. New directories outside mapped paths
2. New barrel exports at `(packages|apps)/<name>/src/index.*`
3. New migration files
4. New route modules under `routes/` or `api/`

If count ≥ `workflow.drift_threshold` (default 3):
- **warn** (default): prints suggested `/gsd-map-codebase --paths …` command
- **auto-remap**: spawns `gsd-codebase-mapper` scoped to affected paths

[L22538-L22548]

`last_mapped_commit` lives in YAML frontmatter at the top of each `.planning/codebase/*.md` file. `bin/lib/drift.cjs` provides `readMappedCommit` and `writeMappedCommit` round-trip helpers.

### 5.3 Parallel Commit Safety

When multiple executors run:
1. `--no-verify` commits (paralysis agents skip hooks to avoid build lock contention)
2. `STATE.md.lock` (O_EXCL atomic creation, 10s timeout, spin-wait with jitter)
3. Orchestrator runs `git hook run pre-commit` once after each wave

[L22352-L22356]

---

## 6. STAGE 5: WORK VERIFICATION (`/gsd-verify-work`)

**Purpose:** Validate built features through conversational UAT with auto-diagnosis.

**Process:**
1. GSD loads the phase CONTEXT.md, PLAN.md, SUMMARY.md, VERIFICATION.md
2. Presents the user with a summary of what was built
3. User tests the feature, reports findings
4. On failure, GSD spawns parallel debug agents for auto-diagnosis
5. Produces UAT.md with pass/fail results and fix plans

**Auto-diagnosis:** `diagnose-issues.md` workflow orchestrates parallel debug agents to investigate UAT gaps and find root causes — without the user having to describe the problem in technical detail. [L28452-L28462]

---

## 7. STAGE 6: SHIP (`/gsd-ship`)

**Purpose:** Create PR, run review, and prepare for merge after verification passes.

The ship workflow:
1. Creates a clean PR branch (filtering .planning/ commits via `/gsd-pr-branch`)
2. Runs code review via `/gsd-code-review`  
3. Auto-fixes issues via `/gsd-code-review --fix`
4. Creates the PR with structured body sections
5. Marks the phase complete in STATE.md + ROADMAP.md

[L30130-L30134]

---

## 8. CROSS-PHASE REGRESSION GATE

When a new phase is planned, GSD checks that the phase changes don't break prior phases. This is enforced by the integration-checker during milestone audits. [L26627-L26678]

---

## 9. STATE MD LIFECYCLE INTEGRATION

GSD's STATE.md has four lifecycle fields that the status-line reads on every render:

```yaml
active_phase: "4.5"        # Set when orchestrator is in flight
next_action: "execute-phase" # Set when idle with a recommendation
next_phases: ["4.5"]        # Phases the recommendation applies to
progress:
  total_phases: 17
  completed_phases: 10
  percent: 59              # !!! Only percent triggers the progress bar
```

[L32402-L32465]

**Status-line rendering scenes (4 scenes):**

| Scene | Trigger | Display |
|-------|---------|---------|
| 1. Phase active | `active_phase` populated | `v2.0 [██░░░] X% · Phase 4.5 executing` |
| 2. Idle, next recommended | `next_action` + `next_phases` | `v2.0 [██░░░] X% · next execute-phase 4.5` |
| 3. Milestone complete | `percent: 100` | `v2.0 [██████████] 100% · milestone complete` |
| 4. Default | None of above | `v1.9 Code Quality · executing · ph (1/5)` |

[L32450-L32465]

**Important:** `progress.percent` represents phase completion (`completed_phases / total_phases`), NOT plan completion. Plan-dimension (`completed_plans / total_plans`) trends optimistic because future phases haven't been planned yet — denominator is structurally smaller. [L32435-L32442]

**Stage labels** when Scene 1 is active:

| Command | `status` value |
|---------|---------------|
| /gsd-discuss-phase | `discussing` |
| /gsd-plan-phase | `planning` |
| /gsd-execute-phase | `executing` |
| /gsd-verify-work | `verifying` |

---

## 10. COMPARISON WITH HIVEMIND PHASE PIPELINE

| Stage | GSD | Hivemind | Advantage |
|-------|-----|----------|-----------|
| **Init** | /gsd-new-project with 4 parallel researchers + synthesis | hm-l2-brainstorm + hm-l2-product-validation | GSD (more structured, parallel research) |
| **Discuss** | 2 modes: interview + assumptions. Both produce same CONTEXT.md | hm-l2-user-intent-interactive-loop + hm-l2-requirements-analysis | GSD (assumptions mode is unique) |
| **Plan** | Research gate, Package Legitimacy Gate, Plan Checker (8 dims), 2 coverage gates | hm-l2-spec-driven-authoring + hm-l2-phase-execution | GSD (more gates) |
| **Execute** | Wave parallelization, STATE.md.lock, node repair | hm-l2-phase-execution wave model | Similar |
| **Verify** | Conversational UAT, auto-diagnosis, goal-backward analysis | hm-l2-completion-looping + hm-l2-test-driven-execution | Different approaches |
| **Quality** | Plan checker, verifier, Nyquist auditor, security auditor, codebase drift gate | Gate triad (lifecycle→spec→evidence) | Different (Hivemind is more rigorous on evidence) |
| **Ship** | /gsd-ship: PR + review + merge | Not formalized | GSD |
| **State tracking** | STATE.md with lifecycle fields, 4 scene rendering | session-tracker with rich queries | Hivemind (more powerful queries) |
| **Continuity** | /gsd-pause-work + /gsd-resume-work | Session journal + delegation persistence | Hivemind (more durable) |

---

## 11. ACTIONABLE RECOMMENDATIONS FOR HIVEMIND

### RECOMMENDATION A: Research Gate (HIGH IMPACT)

**Problem:** Hivemind's phase planning has no formal gate that blocks on unresolved research questions.

**Solution:** Add a `researchGate` check to `hm-l2-phase-loop`:

```markdown
## Research Gate Check

Before entering planning:
1. Read all RESEARCH.md files for phase
2. Identify unresolved open questions (marked with `[UNRESOLVED]`)
3. IF unresolved questions exist → BLOCK planning → return to research phase
4. ELSE → proceed to planning
```

### RECOMMENDATION B: Package Legitimacy Gate (HIGH IMPACT)

**Problem:** Hivemind's agents can innocently recommend hallucinated packages (slopsquatting). The `hm-l3-deep-research` skill has no supply-chain gate.

**Solution:** Add a Package Legitimacy Gate to `hm-l3-deep-research`:

```markdown
## Package Legitimacy Gate (NEW)

When RESEARCH.md recommends external packages:
1. For each package, run registry-specific verification:
   - npm: `npm view <pkg>` → check age, downloads, source repo
   - pip: `pip index versions <pkg>` → check PyPI metadata
   - cargo: `cargo search <pkg>` → check crates.io
2. Tag each package: [VERIFIED] / [ASSUMED] / [SUS] / [SLOP]
3. [SLOP] → remove from recommendations entirely  
4. [ASSUMED]/[SUS] → add checkpoint:human-verify to plan
5. [VERIFIED] → no checkpoint needed
```

### RECOMMENDATION C: Codebase Drift Gate (MEDIUM IMPACT)

**Problem:** After Hivemind's phase execution, there is no check that the codebase structure has drifted from expectations.

**Solution:** Implement a drift gate that compares `last_mapped_commit..HEAD`:

```
After executor completes, before claiming phase done:
1. Read last_mapped_commit from .planning/codebase/*.md frontmatter
2. git diff --name-only last_mapped_commit..HEAD
3. Check for: new directories, new barrel exports, new route modules
4. If ≥ threshold (default 3): WARN with suggested remap command
```

### RECOMMENDATION D: Assumptions Mode for Discuss (MEDIUM IMPACT)

**Problem:** Hivemind's hm-l2-brainstorm is pure question-asking. There's no "codebase-first" mode.

**Solution:** Add an assumptions flag to hm-l2-user-intent-interactive-loop:

```
--assumptions: Instead of asking questions, analyze the codebase first
1. Read 5-15 files related to the task
2. Form assumptions with file:line evidence
3. Present for confirmation/correction
4. Output: structured assumptions with confidence levels
```

### RECOMMENDATION E: Pipeline Standardization (HIGH IMPACT)

**Problem:** Hivemind has the component skills (brainstorm → spec → execute → loop) but no standardized pipeline that connects them.

**Solution:** Create a formal pipeline document that specifies:

```
Phase N Pipeline:
1. [hm-l2-brainstorm or hm-l2-user-intent-interactive-loop] → CONTEXT.md
2. [Research Gate] → checks for unresolved questions
3. [hm-l2-spec-driven-authoring] → SPEC.md with acceptance criteria
4. [hm-l2-phase-execution] → code + tests
5. [hm-l2-completion-looping or hm-l2-validator] → verification
6. [Codebase Drift Gate] → structural change check
```

---

## 12. KEY TAKEAWAYS

1. **GSD's pipeline has 5+ formal gates** that Hivemind lacks entirely: research gate, package legitimacy gate, requirements coverage gate, decision coverage gate, codebase drift gate.
2. **GSD's discuss-phase with assumptions mode** is a unique innovation — codebase-first context gathering. Hivemind should adopt this.
3. **GSD's 3-layer Package Legitimacy Gate** is essential for any AI coding agent that recommends dependencies.
4. **GSD's conversational UAT with auto-diagnosis** is more user-friendly than Hivemind's test-only verification.
5. **Hivemind's evidence hierarchy + gate triad is more rigorous** than GSD's binary PASS/FAIL. Never regress on this.
6. **GSD's STATE.md lifecycle fields** (active_phase, next_action, progress) provide a clear "what's next" signal that Hivemind's session-tracker lacks.
