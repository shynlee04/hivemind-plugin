# GSD Agent Architecture — Deep Analysis

> **Source:** GSD Repomix output `5875fd23ec62fc70` — docs/AGENTS.md, docs/ARCHITECTURE.md §Agent Model, docs/INVENTORY.md §Agents (33 shipped)
> **Date:** 2026-05-23
> **Evidence Level:** L3 (documented observation from GSD docs)
> **Audience:** Hivemind engineers seeking to improve agent architecture

---

## 1. OVERVIEW

GSD ships **33 agents** stored as `agents/gsd-*.md` files. They are organized into 13 functional categories with **no hierarchical depth** — there is no L0/L1/L2 taxonomy. Every agent is a peer. The orchestration hierarchy comes from the workflow files, not the agent definitions. [L29950-L29952]

GSD's architecture is fundamentally different from Hivemind's:

```
GSD:        Workflow (orchestrator) → Agent (specialist) → Agent (specialist) → ...
Hivemind:   L0 Orchestrator → L1 Coordinator → L2 Specialist → L3 Skill
```

GSD's flat model trades hierarchical depth for simplicity. Every agent gets a fresh context window (up to 200K tokens). [L22032-L22036]

---

## 2. AGENT CATEGORIES (13 groups, 33 agents)

### 2.1 Researchers (4 agents)

| Agent | Spawned by | Parallelism | Tools | Model | Produces |
|-------|-----------|-------------|-------|-------|----------|
| project-researcher | /gsd-new-project, /gsd-new-milestone | 4 parallel (stack, features, arch, pitfalls) | Read, Write, Bash, Grep, Glob, WebSearch, WebFetch, MCP | Sonnet | research/STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md |
| phase-researcher | /gsd-plan-phase | 4 parallel | same as above | Sonnet | {phase}-RESEARCH.md |
| ui-researcher | /gsd-ui-phase | Single | same + MCP | Sonnet | {phase}-UI-SPEC.md |
| advisor-researcher | discuss-phase (advisor mode) | Multiple (one per gray area) | Read, Bash, Grep, Glob, WebSearch, WebFetch, MCP | Sonnet | 5-column comparison table |

[L21228-L21290]

**Key insight:** Researchers are the ONLY agents with WebSearch + WebFetch + MCP access. This is by design — research happens in a controlled phase before execution, and web access is restricted to prevent hallucinated dependencies from entering the execution pipeline. [L21946-L21956]

### 2.2 Analyzers (2 agents)

| Agent | Spawned by | Parallelism | Tools | Model | Produces |
|-------|-----------|-------------|-------|-------|----------|
| assumptions-analyzer | discuss-phase (assumptions mode) | Single | Read, Bash, Grep, Glob (NO Write, NO Web) | Sonnet | Structured assumptions with evidence, confidence levels |
| advisor-researcher | discuss-phase (advisor mode) | Multiple | Read, Bash, Grep, Glob, WebSearch, WebFetch, MCP | Sonnet | 5-column comparison table |

[L21258-L21290]

**gsd-assumptions-analyzer** is a uniquely GSD pattern: it reads the codebase BEFORE interacting with the user, forms assumptions with file:line evidence, and surfaces them for confirmation. This is the "codebase-first" approach vs Hivemind's "ask questions first" approach.

Key behaviors:
- Reads 5-15 most relevant source files
- Classifies confidence: Confident / Likely / Unclear
- Output calibrated by tier: full_maturity (3-5 areas), standard (3-4), minimal_decisive (2-3)

[L21265-L21280]

### 2.3 Synthesizers (1 agent)

| Agent | Spawned by | Tools | Model | Produces |
|-------|-----------|-------|-------|----------|
| research-synthesizer | /gsd-new-project | Read, Write, Bash | Sonnet | research/SUMMARY.md |

[L21292-L21300]

This is notable for having RESTRICTED tools (no Grep, no Glob, no Web) — it only reads the 4 research outputs and writes the summary. Principle of least privilege enforced. [L21946-L21956]

### 2.4 Planners (2 agents)

| Agent | Spawned by | Tools | Model | Produces |
|-------|-----------|-------|-------|----------|
| planner | /gsd-plan-phase, /gsd-quick | Read, Write, Bash, Glob, Grep, WebFetch, MCP | **Opus** | {phase}-{N}-PLAN.md |
| roadmapper | /gsd-new-project | Read, Write, Bash, Glob, Grep | Sonnet | ROADMAP.md |

[L21302-L21320]

**Critical insight:** The planner uses Opus (highest-quality model) while all others use Sonnet. GSD reserves the most expensive model for the most cognitively demanding task: decomposing requirements into executable plans. This is a deliberate cost/quality tradeoff.

Key planner behaviors:
- Creates 2-3 atomic task plans sized for single context windows
- Uses XML structure with `<task>` elements
- Groups plans into dependency waves
- Performs reachability check (v1.32): validates plan steps reference accessible files and APIs
- Reads PROJECT.md + REQUIREMENTS.md + CONTEXT.md + RESEARCH.md

[L21305-L21316]

### 2.5 Executors (1 agent)

| Agent | Spawned by | Parallelism | Tools | Model | Produces |
|-------|-----------|-------------|-------|-------|----------|
| executor | /gsd-execute-phase, /gsd-quick | Multiple (parallel within waves) | Read, Write, Edit, Bash, Grep, Glob (NO Web) | Sonnet | Code changes, git commits, SUMMARY.md |

[L21322-L21334]

Key behaviors:
- Fresh 200K context window per plan
- Follows XML task instructions precisely
- Atomic git commit per completed task
- Handles checkpoint types: auto, human-verify, decision, human-action
- Reports deviations in SUMMARY.md
- Invokes node repair on verification failure

The executor has Edit access (unlike researchers/checkers) but NO web access — consistent with the security principle that code modification agents should not have network access. [L21946-L21956]

### 2.6 Checkers (3 agents, all read-only)

| Agent | Spawned by | Tools | Model | Produces |
|-------|-----------|-------|-------|----------|
| plan-checker | /gsd-plan-phase | Read, Bash, Glob, Grep | Sonnet | PASS/FAIL with feedback |
| integration-checker | /gsd-audit-milestone | Read, Bash, Glob, Grep | Sonnet | Integration report |
| ui-checker | /gsd-ui-phase | Read, Bash, Glob, Grep | Sonnet | BLOCK/FLAG/PASS |

[L21336-L21358]

**Critical pattern:** All checkers are Read-Only (no Write, no Edit). They evaluate but never modify. This is the principle of least privilege enforced consistently. [L21946-L21956]

### 2.7 Verifiers (1 agent)

| Agent | Spawned by | Tools | Model | Produces |
|-------|-----------|-------|-------|----------|
| verifier | /gsd-execute-phase | Read, Write, Bash, Grep, Glob | Sonnet | {phase}-VERIFICATION.md |

[L21360-L21380]

**This agent does more than just "check."** It performs goal-backward analysis — checking the codebase against phase goals, not just that tasks completed. 

Unique capabilities:
- **Milestone scope filtering**: gaps addressed in later phases are marked as "deferred", not failures (v1.32)
- **Test quality audit** (v1.32): verifies tests prove what they claim by checking:
  1. Disabled/skipped tests on requirements
  2. Circular test patterns (system generating its own expected values)
  3. Assertion strength (existence vs. value vs. behavioral)
  4. Expected value provenance

[L21372-L21380]

### 2.8 Auditors (3 agents)

| Agent | Spawned by | Tools | Model | Produces |
|-------|-----------|-------|-------|----------|
| nyquist-auditor | /gsd-validate-phase | Read, Write, Edit, Bash, Grep, Glob | Sonnet | Test files, VALIDATION.md |
| ui-auditor | /gsd-ui-review | Read, Write, Bash, Grep, Glob | Sonnet | {phase}-UI-REVIEW.md |
| security-auditor | /gsd-secure-phase | Read, Write, Edit, Bash, Grep, Glob | Sonnet | {phase}-SECURITY.md |

[L21382-L21414]

Notable: nyquist-auditor and security-auditor have Edit access (to generate test files). ui-auditor does NOT have Edit. This is a deliberate distinction.

### 2.9 Mappers (1 agent)

| Agent | Spawned by | Parallelism | Tools | Model | Produces |
|-------|-----------|-------------|-------|-------|----------|
| codebase-mapper | /gsd-map-codebase | 4 parallel (tech, arch, quality, concerns) | Read, Bash, Grep, Glob, Write | **Haiku** | .planning/codebase/*.md |

[L21416-L21432]

**Key insight:** Uses Haiku (cheapest model) because the task is "pattern extraction from file contents" — no reasoning required. This is a cost optimization: expensive models don't add value for mechanical tasks.

### 2.10 Debuggers (1 agent)

| Agent | Spawned by | Tools | Model | Produces |
|-------|-----------|-------|-------|----------|
| debugger | /gsd-debug, /gsd-verify-work | Read, Write, Edit, Bash, Grep, Glob, **WebSearch** | Sonnet | .planning/debug/*.md |

[L21434-L21446]

**Debug Session Lifecycle:** `gathering → investigating → fixing → verifying → awaiting_human_verify → resolved`

Note: The debugger has WebSearch (unlike executors) — it needs current information for bug investigation. It also has Edit for applying fixes.

### 2.11 Doc Writers (2 agents)

| Agent | Spawned by | Tools | Model | Produces |
|-------|-----------|-------|-------|----------|
| doc-writer | /gsd-docs-update | Read, Write, Bash, Grep, Glob | Sonnet | Project docs |
| doc-verifier | /gsd-docs-update | Read, Write, Bash, Grep, Glob | Sonnet | JSON verification results |

[L21448-L21470]

Doc-writer supports 6 modes: create, update, supplement, fix + monorepo-aware. Fix mode accepts failure objects from doc-verifier for targeted corrections.

### 2.12 Profilers (1 agent)

| Agent | Spawned by | Tools | Model | Produces |
|-------|-----------|-------|-------|----------|
| user-profiler | /gsd-profile-user | **Read ONLY** | Sonnet | USER-PROFILE.md |

[L21472-L21486]

Most restricted agent in the entire roster. Read-only. Analyzes session data, never modifies files.

### 2.13 Advanced & Specialized Agents (12 agents, stub coverage)

| Agent | Spawned by | Key characteristic |
|-------|-----------|-------------------|
| pattern-mapper | /gsd-plan-phase | Read-only codebase analysis → PATTERNS.md |
| debug-session-manager | /gsd-debug | Runs debug loop in isolated context |
| code-reviewer | /gsd-code-review | Produces REVIEW.md with severity-classified findings |
| code-fixer | /gsd-code-review --fix | One atomic commit per fix |
| ai-researcher | /gsd-ai-integration-phase | Distills framework docs into AI-SPEC.md §3-4b |
| domain-researcher | /gsd-ai-integration-phase | Surfaces evaluation criteria for AI systems |
| eval-planner | /gsd-ai-integration-phase | Designs evaluation strategy for AI phases |
| eval-auditor | /gsd-eval-review | Scores eval coverage: COVERED/PARTIAL/MISSING |
| framework-selector | /gsd-ai-integration-phase | Interactive ≤6-question decision matrix |
| intel-updater | /gsd-map-codebase --query | Writes .planning/intel/*.json |
| doc-classifier | /gsd-ingest-docs | Classifies docs as ADR/PRD/SPEC/DOC/UNKNOWN |
| doc-synthesizer | /gsd-ingest-docs | Conflict detection + consolidation |

[L21682-L21940]

---

## 3. WAVE EXECUTION MODEL

GSD's parallelization strategy is fundamentally different from Hivemind's:

```python
# GSD Wave Model
wave_1 = [plan_01, plan_02]      # No deps → parallel
wave_2 = [plan_03, plan_04]      # Depends on wave_1 → sequential after wave_1
wave_3 = [plan_05]               # Depends on wave_2 → sequential after wave_2
```

[L22304-L22310]

**Key properties:**
- Plans within a wave execute in parallel (one executor agent per plan)
- Waves execute sequentially (wave 2 waits for all wave 1 plans to complete)
- Each executor gets a FRESH 200K context window
- Number of parallel executors is configurable: `parallelization.max_concurrent_agents` (default 3)

**Parallel commit safety mechanisms:**
1. `--no-verify` commits — Parallel agents skip pre-commit hooks to avoid lock contention
2. `STATE.md.lock` — Lockfile-based mutual exclusion (O_EXCL atomic creation, 10s timeout, spin-wait with jitter)
3. Orchestrator runs `git hook run pre-commit` once after each wave completes

[L22352-L22356]

---

## 4. ADAPTIVE CONTEXT ENRICHMENT

When the context window is 500K+ tokens (1M-class models like Opus 4.6), GSD automatically enriches subagent prompts:

**Standard 200K windows:**
- Executor: PLAN.md + project context only
- Verifier: SUMMARY.md files only

**500K+ windows (adaptive):**
- Executor: Prior wave SUMMARY.md + CONTEXT.md + RESEARCH.md → cross-plan awareness
- Verifier: ALL PLAN.md + SUMMARY.md + CONTEXT.md + REQUIREMENTS.md → history-aware verification

[L22340-L22350]

The orchestrator reads `context_window` from config (`gsd-sdk query config-get context_window`) and conditionally includes richer context when `>= 500000`.

---

## 5. MODEL RESOLUTION

GSD has a multi-layered model resolution system:

```
1. model_profile (top level): quality / balanced / budget / adaptive / inherit
2. model_overrides: Per-agent exceptions to the profile
3. models.<phase_type>: Per-phase-type overrides (planning, discuss, research, execution, verification, completion)
4. dynamic_routing: Failure-tier escalation
5. runtime: Per-runtime native model ID resolution
```

[L25040-L25100]

**Resolution order:** `model_overrides` > `models.<phase_type>` > `model_profile` > runtime defaults

**Dynamic routing** (v1.40, `dynamic_routing.enabled`):
- Agent tries `tier_models[default_tier]` (e.g., sonnet)
- If orchestrator detects soft failure, agent escalates one tier (e.g., sonnet → opus)
- `max_escalations` caps retries
- `escalate_on_failure: false` disables escalation

[L25080-L25100]

---

## 6. TOOL PERMISSION MATRIX (Principle of Least Privilege)

This table is GSD's most important security innovation:

| Permission | Who has it | Who does NOT |
|-----------|-----------|-------------|
| **WebSearch** | Researchers only | Executors, Checkers, Verifiers |
| **WebFetch** | Researchers + Planner | Executors, Debuggers |
| **MCP (context7)** | Researchers + Planner | All others |
| **Edit** | Executors, Nyquist-auditor, Security-auditor, Debugger | Researchers, Checkers, Verifiers |
| **Write** | Most agents (researchers, planners, executors, verifiers) | Checkers (read-only) |
| **Read-Only** | Checkers, user-profiler | — |

[L21946-L21956]

**Security invariant:** No agent that modifies code (Edit) has network access (WebSearch/WebFetch). This prevents data exfiltration and hallucinated dependency injection.

---

## 7. COMPARISON WITH HIVEMIND AGENT ARCHITECTURE

| Dimension | GSD | Hivemind | Advantage |
|-----------|-----|----------|-----------|
| **Hierarchy depth** | Flat (all peers) | L0-L1-L2-L3 | Hivemind (better decomposition) |
| **Agent count** | 33 | 89 | Hivemind (more specialization) |
| **Evidence contracts** | None | L1-L5 hierarchy, file:line requirements | Hivemind (better quality control) |
| **Fresh context per agent** | Yes (200K window) | Yes (per subagent) | Equal |
| **Parallel wave execution** | Wave model with dependency grouping | hm-l2-phase-execution implements this | Equal |
| **Adaptive context enrichment** | 500K+ windows get richer prompts | None | GSD |
| **Model resolution** | Multi-layered: profile→override→phase-type→runtime→dynamic | Baked into agent frontmatter | GSD (more flexible) |
| **Tool permissions** | Binary (listed/not listed) | Granular (allow/ask/ask) with per-tool glob support | Hivemind (more secure) |
| **Agent color coding** | Yes (terminal output) | Limited | GSD (UI polish) |
| **Read-only checker pattern** | Checkers have no Write/Edit | hm-l2-critic, hm-l2-reviewer are read-only | Equal |
| **Delegation mechanism** | Native Task()/SubAgent() | WaiterModel + dual-signal + session-stacking + delegations.json | Hivemind (more flexible, auditable) |
| **Evidence tagging** | None (PASS/FAIL binary) | L1-L5 with file:line references | Hivemind (more rigorous) |

---

## 8. ACTIONABLE RECOMMENDATIONS FOR HIVEMIND

### RECOMMENDATION A: Adaptive Context Enrichment (MEDIUM IMPACT)

**Problem:** Hivemind dispatches the same prompt structure regardless of model context window size.

**Solution:** Add a `context_window` check to orchestrator workflows:
- If model supports ≥ 500K tokens: include prior wave SUMMARY.md + cross-plan context
- If standard 200K: use truncated prompts with cache-friendly ordering

```typescript
// In hm-l2-coordinating-loop or hm-l2-phase-execution
const contextWindow = await getConfig('context_window', 200000);
const isEnriched = contextWindow >= 500000;
if (isEnriched) {
  prompt.enrichWith('priorWaveSummaries', summaries);
  prompt.enrichWith('crossPlanContext', context);
}
```

### RECOMMENDATION B: Wave-Based Parallelization with STATE.md.lock (MEDIUM IMPACT)

**Problem:** Hivemind's `hm-l2-phase-execution` implements wave execution but lacks shared-state lock protection for parallel agents.

**Solution:** Adopt GSD's `STATE.md.lock` pattern:
```typescript
// O_EXCL atomic file creation
fs.openSync(lockPath, fs.constants.O_CREAT | fs.constants.O_EXCL);
// Spin-wait with jitter (10s timeout)
while (lockAttempts < MAX_RETRIES) {
  try { acquireLock(); break; } catch {
    sleep(jitteredDelay());
    lockAttempts++;
  }
}
```

### RECOMMENDATION C: Read-Only Checker Agent Pattern (LOW IMPACT)

**Problem:** Hivemind's `hm-l2-critic` and `hm-l2-reviewer` are read-only but this is not enforced in their agent definitions.

**Solution:** Ensure all checker agents STRICTLY enforce Read-Only in their tool lists — no Write, no Edit. GSD's principle is: "Checkers evaluate, they never modify."

### RECOMMENDATION D: Tool Permission by Agent Role (HIGH IMPACT)

**Problem:** Hivemind's tool permission model is granular but not role-consistent. An executor could theoretically have web access.

**Solution:** Enforce GSD's invariant at the agent definition level:
- **Researchers:** Web access (WebSearch, WebFetch, MCP) → they need current ecosystem info
- **Planners:** Read + Write (no Edit, no Web) → they design, don't build
- **Executors:** Edit + Write (no Web) → they build, don't research
- **Checkers:** Read-Only → they evaluate, don't modify
- **Auditors:** Read + Write + possibly Edit (tests only) → they verify but don't patch production code
- **Profilers:** Read-Only (strictest) → data analysis only

### RECOMMENDATION E: Agent Role Color Scheme (LOW IMPACT)

GSD assigns distinct terminal colors per agent role:
- Researchers: default (no color)
- Planner: Green
- Executor: Yellow  
- Checker: Green
- Debugger: Orange
- Doc Writer: Purple
- UI roles: Fuchsia (#E879F9), Cyan (#22D3EE), Pink (#F472B6)
- Security: Red (#EF4444)

Hivemind could adopt a consistent color scheme for L2 specialist agents.

---

## 9. KEY TAKEAWAYS

1. **GSD's flat agent hierarchy is simpler** but Hivemind's L0-L2 hierarchy enables more sophisticated task decomposition. **Keep Hivemind's hierarchy.**
2. **GSD's tool permission by role** (no Web for code-modifying agents) is a security invariant Hivemind should enforce.
3. **Wave execution with STATE.md.lock** is directly adoptable for shared-state parallel execution.
4. **Adaptive context enrichment** based on model window size is a zero-cost optimization — implement it.
5. **GSD's read-only checker pattern** aligns with Hivemind's `hm-l2-critic` — formalize the invariant.
6. **Model resolution at spawn time** (vs baked into frontmatter) gives GSD more flexibility. Hivemind could add a `resolve-model` SDK call.
