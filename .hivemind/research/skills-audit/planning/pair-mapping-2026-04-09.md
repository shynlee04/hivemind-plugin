# Cycle 2 — Pair Mapping + Agent ↔ Skill Matrix (2026-04-09)

> **Source:** Cycle 1 aggregate findings + 4 inventory scans (1,707 lines total across 20 skills)
> **Status:** CYCLE 2 COMPLETE
> **Mode:** Orchestrator direct production (background delegation non-functional on this platform — `builtin-process` submode silently fails)

---

## 1. Pair-of-3 Configurations (Front-Facing Agent Skill Sets)

A **Pair-of-3** is the maximum loading stack before hitting the `max-3-skills` rule from `coordinating-loop`. These triples are valid front-facing agent configurations.

---

### Triple 1: `orchestration-core`

| Element | Value |
|---------|-------|
| **Skills** | `coordinating-loop` + `user-intent-interactive-loop` + `planning-with-files` |
| **Trigger** | User asks to "plan this", "break down", "organize tasks", or any multi-step project requiring parent-child agent delegation |
| **Synergy** | `user-intent-interactive-loop` captures and clarifies intent, `planning-with-files` structures the task (3-file system), `coordinating-loop` executes the delegation and monitors child agents. Intent → Plan → Execute pipeline. |

---

### Triple 2: `meta-routing-stack`

| Element | Value |
|---------|-------|
| **Skills** | `coordinating-loop` + `user-intent-interactive-loop` + `meta-builder` |
| **Trigger** | User asks to "create a skill", "build an agent", "set up a command", "configure OpenCode", or any meta-concept request that needs routing to the right specialist |
| **Synergy** | `user-intent-interactive-loop` captures the intent ("create a skill"), `meta-builder` routes to the correct authoring skill and enforces the MINDNETWORK graph hierarchy. `coordinating-loop` handles the child-agent execution of the authoring work. |

---

### Triple 3: `quality-assurance`

| Element | Value |
|---------|-------|
| **Skills** | `use-authoring-skills` + `skill-synthesis` + `meta-builder` |
| **Trigger** | "Audit this skill", "check skill quality", "score skill quality", "doctor agent skills", "fix frontmatter", "refactor skills" |
| **Synergy** | `meta-builder` provides the routing and graph validation (which skills exist, what category), `use-authoring-skills` provides the quality matrix (5-dimension scoring), `skill-synthesis` provides the evaluation framework (trigger-queries.json, grading rubrics). Full author-review-eval pipeline. |

---

### Triple 4: `deep-research-stack`

| Element | Value |
|---------|-------|
| **Skills** | `hm-deep-research` + `coordinating-loop` + `harness-delegation-inspection` |
| **Trigger** | "Deep research", "comprehensive analysis", "research report", "analyze trends", or any multi-source investigation requiring parallel subagents |
| **Synergy** | `hm-deep-research` runs the 4-stage research pipeline (framing → domain → cross-tech → synthesis), `coordinating-loop` manages wave-based parallel subagent dispatch, `harness-delegation-inspection` provides the GSD execution patterns and session continuity context to prevent the delegation failures seen in this audit. |

---

### Triple 5: `harness-audit-stack`

| Element | Value |
|---------|-------|
| **Skills** | `harness-audit` + `use-authoring-skills` + `opencode-platform-reference` |
| **Trigger** | "Audit my OpenCode project", "check boundaries", "verify architecture", "full harness audit", "validate opencode setup" |
| **Synergy** | `harness-audit` runs the 7-phase audit (skills → commands → tools → permissions → agents → subagents → synthesis), `use-authoring-skills` provides the quality rubric for evaluating each artifact, `opencode-platform-reference` provides the platform reality (what agents, tools, permissions actually exist vs. what the skill claims). |

---

### Triple 6: `bundle-authoring`

| Element | Value |
|---------|-------|
| **Skills** | `use-authoring-skills` + `meta-builder` + `command-dev` |
| **Trigger** | "Create a command", "write a custom command", "update a command", "configure command agent", or any slash command development task |
| **Synergy** | `meta-builder` routes to the command creation flow, `use-authoring-skills` provides skill authoring infrastructure (TDD workflow, quality matrix), `command-dev` provides the command-specific anatomy and non-interactive shell safety patterns. |

---

## 2. Pair-of-2 Configurations (Subagent Skill Sets)

Pairs are for specialist subagents who need exactly 2 complementary skills. These are the only valid subagent pairs.

---

### Pair 1: `authoring-quality`

| Element | Value |
|---------|-------|
| **Skills** | `use-authoring-skills` + `meta-builder` |
| **Trigger** | Subagent tasked with "write a new skill", "edit an existing skill", "fix skill frontmatter", "create skill templates" |
| **Synergy** | `meta-builder` handles MINDNETWORK routing and hierarchy verification (which skills exist, what layer), `use-authoring-skills` handles the actual authoring (TDD workflow, quality scoring, pattern selection). Split at the routing/authoring boundary. |

---

### Pair 2: `delegation-governance`

| Element | Value |
|---------|-------|
| **Skills** | `agent-authorization` + `agents-and-subagents-dev` |
| **Trigger** | Subagent tasked with "define specialist agent profile", "set up authorization checkpoints", "checkpoint gate for agents", "configure agent permissions" |
| **Synergy** | `agent-authorization` provides the gate architecture (4 gates, specialist profiles, capability matrix), `agents-and-subagents-dev` provides the delegation protocol (envelope pattern, status handling, worktree isolation). Together they cover "who can do what under what conditions." |

---

### Pair 3: `platform-inspection`

| Element | Value |
|---------|-------|
| **Skills** | `harness-delegation-inspection` + `opencode-platform-reference` |
| **Trigger** | Subagent tasked with "understand GSD execution patterns", "inspect OpenCode project state", "how does GSD work", "session continuity", "MCP server usage for inspection" |
| **Synergy** | `harness-delegation-inspection` provides the GSD-specific execution patterns (checkpoint protocol, wave-based execution, fail-resume), `opencode-platform-reference` provides the platform reality (what the agent/SDK/tools API actually supports). Both are reference-heavy; together they cover platform theory + practice. |

---

### Pair 4: `command-shell-safety`

| Element | Value |
|---------|-------|
| **Skills** | `command-dev` + `opencode-non-interactive-shell` |
| **Trigger** | Subagent tasked with "create a command with bash injection", "configure command agent", "validate non-interactive flags" |
| **Synergy** | `command-dev` provides the command anatomy and frontmatter template, `opencode-non-interactive-shell` provides the safety patterns (banned commands, CI=true behavior, shell environment variables). Both needed because command-dev's references/non-interactive-shell.md overlaps with the standalone skill. |

---

### Pair 5: `evaluation-driven`

| Element | Value |
|---------|-------|
| **Skills** | `use-authoring-skills` + `eval-harness` |
| **Trigger** | Subagent tasked with "run evals", "benchmark skill performance", "measure skill quality", "generate evals for a skill" |
| **Synergy** | `eval-harness` provides the EDD framework (define → run → grade → improve → repeat), `use-authoring-skills` provides the eval lifecycle guide and trigger-queries.json format. Note: `eval-harness` is F-grade (bare SKILL.md, no bundle) — this pair may produce unreliable results until eval-harness is rebuilt. |

---

### Pair 6: `deep-investigation`

| Element | Value |
|---------|-------|
| **Skills** | `hm-deep-research` + `opencode-platform-reference` |
| **Trigger** | Subagent tasked with "investigate this codebase", "analyze architecture", "compare X vs Y" for a technology question |
| **Synergy** | `hm-deep-research` provides the 4-stage research methodology (framing → domain → cross-tech → synthesis), `opencode-platform-reference` provides the OpenCode-specific technology context. The `hm-deep-research` skill's Stage 3 requires `coordinating-loop` for multi-agent waves — if used standalone, subagent must handle wave dispatch manually. |

---

### Pair 7: `oh-my-openagent-omo-reference`

| Element | Value |
|---------|-------|
| **Skills** | `oh-my-openagent-reference` + `opencode-platform-reference` |
| **Trigger** | Subagent tasked with "compare harness to OMO", "plugin system design", "hook system patterns", "circuit breaker design", "session continuity patterns" |
| **Synergy** | `oh-my-openagent-reference` provides the OMO architecture patterns (276K+ lines of packed source), `opencode-platform-reference` provides the OpenCode equivalent. Together they enable A/B comparison of the same architectural concepts in both systems. Note: omo-ref has phantom `tech-stack.md` and empty `project-structure.md` — subagent should use `files.md` for content. |

---

## 3. Agent ↔ Skill Assignment Matrix

### 6 Known Agents × Skill Loading Profile

| Agent | Required Skills (Always Load) | Optional Skills (Load Conditionally) | Forbidden Skills (Never Load) |
|-------|------------------------------|-----------------------------------|---------------------------|
| **coordinator** | `coordinating-loop`, `user-intent-interactive-loop`, `planning-with-files` | `meta-builder` (for meta-concept routing), `harness-delegation-inspection` (for session continuity), `opencode-platform-reference` (for platform context) | `eval-harness` (F-grade, unimplemented), `skill-synthesis` (only for skill creation workflows, not general coordination) |
| **conductor** | `agents-and-subagents-dev`, `agent-authorization` | `coordinating-loop` (for wave-based execution), `opencode-non-interactive-shell` (when delegating shell work), `harness-delegation-inspection` (for session continuity) | `hm-deep-research` (wrong domain), `eval-harness` (F-grade) |
| **researcher** | `hm-deep-research`, `harness-delegation-inspection` | `opencode-platform-reference` (for tool reference), `coordinating-loop` (for multi-agent waves), `oh-my-openagent-reference` (for architecture comparison) | `use-authoring-skills` (wrong domain), `command-dev` (wrong domain), `custom-tools-dev` (wrong domain) |
| **builder** | `command-dev`, `custom-tools-dev`, `agents-and-subagents-dev` | `meta-builder` (for routing to meta-concepts), `use-authoring-skills` (for quality rubric), `opencode-non-interactive-shell` (for shell safety enforcement) | `hm-deep-research` (wrong domain), `eval-harness` (F-grade) |
| **critic** | `use-authoring-skills`, `skill-synthesis` | `meta-builder` (for routing to authoring skills), `harness-audit` (for 7-phase audit context), `opencode-platform-reference` (for platform standards) | `hm-deep-research` (wrong domain), `phase-loop` (D-grade, no enforcement) |
| **explore** | `opencode-platform-reference`, `oh-my-openagent-reference` | `harness-delegation-inspection` (for GSD patterns), `hm-deep-research` (for investigation methodology), `opencode-non-interactive-shell` (for safe shell probing) | `use-authoring-skills` (wrong phase), `command-dev` (wrong phase), `agent-authorization` (wrong phase) |

### Layer 1/2/3 Skill Loading Recommendations

| Layer | Skills | Default Loading | Notes |
|-------|--------|---------------|-------|
| **Layer 1** (intent + session) | `user-intent-interactive-loop`, `planning-with-files` | Always for any front-facing agent | Captures intent + persists state |
| **Layer 2** (orchestration + delegation) | `coordinating-loop`, `agents-and-subagents-dev`, `agent-authorization`, `phase-loop` | Only when multi-agent coordination needed | Phase-loop is D-grade — prefer `coordinating-loop` for loop enforcement |
| **Layer 3** (meta + authoring) | `meta-builder`, `use-authoring-skills`, `skill-synthesis`, `harness-audit` | Only when authoring or auditing meta-concepts | `eval-harness` is F-grade — avoid |
| **Reference (Layer 3)** | `opencode-platform-reference`, `oh-my-openagent-reference`, `harness-delegation-inspection`, `hm-deep-research` | Load on-demand per reference lookup need | `hm-deep-research` needs `coordinating-loop` for wave dispatch |

---

## 4. Red Fail Cases

These are cases where skill combinations produce **wrong output** (not just degraded quality — actively incorrect results).

---

### Red Fail #1

**Trigger:** `skill-synthesis` → `validate-gate.sh synthesize` → guaranteed script failure

**Mechanism:** `skill-synthesis/SKILL.md` line 31 calls:
```bash
bash scripts/validate-gate.sh synthesize "<user-request>" <output-dir>
```
But `validate-gate.sh` only supports `create | edit | audit` actions. Running with `synthesize` exits with code 1 and message `"Unknown action 'synthesize'"`.

**Impact:** Any agent using `skill-synthesis` for the "synthesize from GitHub" workflow will fail at the first gate validation. The bug is a one-line fix in SKILL.md (change `synthesize` → `create`) or adding `synthesize` to the script's case statement.

**Correct pair:** `skill-synthesis` + `use-authoring-skills` (where `use-authoring-skills` is the authority on what actions `validate-gate.sh` supports — it uses `create` not `synthesize`)

---

### Red Fail #2

**Trigger:** `meta-builder` + any skill requiring depth references → agent finds empty stubs

**Mechanism:** `meta-builder` references 4 depth files (`depth-built-in-tools.md` at 17L, `depth-repo-analysis.md` at 13L, `depth-github-stacks.md` at 12L, `depth-skill-synthesis.md` at 13L) that contain only "Content to be filled in" placeholders. SKILL.md line 366-373 claims these contain "Detailed guides for..." but agents loading them find nothing actionable.

**Impact:** If a `meta-builder`-routed subagent follows the skill's instructions to load a depth reference for tool patterns, repo analysis, GitHub stacks, or skill synthesis — it gets empty files. The routing decision is made on false premises.

**Correct pair:** `meta-builder` + `opencode-platform-reference` (use opencode-platform reference files for tool patterns instead of the stub depth files), OR remove the 4 stub references from `meta-builder/SKILL.md` until real content is written.

---

### Red Fail #3

**Trigger:** `oh-my-openagent-reference` + any task requiring project structure navigation → blind search through 276K lines

**Mechanism:** `oh-my-openagent-reference/references/summary.md` references `tech-stack.md` (file does not exist — phantom). `project-structure.md` is 4 lines showing only the repomix output filename, not the OMO directory tree. The only substantive reference is `files.md` (276,602 lines).

**Impact:** An agent trying to navigate the OMO codebase structure (e.g., "find the circuit breaker implementation") cannot use `project-structure.md` as a map. It must search through 276K lines of packed source. This is a catastrophic UX failure for a reference skill.

**Correct pair:** `oh-my-openagent-reference` + `opencode-platform-reference` (use the OpenCode platform reference for navigation patterns, use omo-ref only for the actual OMO source via `files.md` grep search)

---

### Red Fail #4

**Trigger:** `phase-loop` + any scenario requiring loop enforcement → skill is all theory, no enforcement

**Mechanism:** `phase-loop` (D-grade, 117L) defines loop semantics in `references/revision-loop.md` (stall detection, max 3 iterations, check-revise-escalate pseudocode) but has **zero scripts** to implement any of it. The skill relies entirely on the agent reading the pseudocode and implementing it mentally. No `init-loop.sh`, `check-stall.sh`, `enforce-max-iterations.sh` exists.

**Impact:** An agent following `phase-loop` will never actually enforce iteration caps or detect stalls programmatically. If it attempts to implement the pseudocode from memory, it may do so incorrectly. This is a quality gap that looks like a capability but isn't.

**Correct pair:** `phase-loop` + `coordinating-loop` (use `coordinating-loop`'s `run-ralph-loop.sh` and `loop-status.sh` for actual enforcement; `phase-loop` provides only the conceptual framework)

---

### Red Fail #5

**Trigger:** `eval-harness` + any eval task → skill is unimplemented, no eval commands exist

**Mechanism:** `eval-harness` SKILL.md (270L) references `/eval define`, `/eval check`, `/eval report` commands as integration points. These slash commands do not exist in `.opencode/commands/`. The skill is a design document for EDD but has no actual implementation. No `scripts/` directory, no `evals/` directory.

**Impact:** An agent tasked with "run evals" or "benchmark skill quality" loading `eval-harness` will follow the EDD framework described in SKILL.md but have no actual `/eval` commands to invoke. All evaluation must be done manually via LLM self-assessment — not programmatically verifiable.

**Correct pair:** `use-authoring-skills` + `skill-synthesis` (these have actual `evals/` directories with `trigger-queries.json` and `evals.json` that can be run via `bash scripts/run-trigger-evals.sh`)

---

### Red Fail #6

**Trigger:** `planning-with-files` + `coordinating-loop` simultaneously → file naming collision on `task_plan.md`, `findings.md`, `progress.md`

**Mechanism:** `planning-with-files` writes `task_plan.md`, `findings.md`, `progress.md` to **project root**. `coordinating-loop` writes the same filenames to **`.coordination/<session>/`**. When both skills are active in the same session (intended layer stack: intent → plan → coordinate), the agent must manage two sets of identically-named files in different locations. The relationship is implicit, not enforced.

**Impact:** An agent may accidentally read the wrong file (project root vs session subdirectory) when both skills are loaded. This causes goal drift — the `coordinating-loop` reads its own copies, `planning-with-files` reads its own copies, and they diverge. No script exists to validate or sync them.

**Correct pair:** Load only one planning file skill at a time: either `planning-with-files` (agent does manual 3-file management) OR `coordinating-loop` (agent uses `.coordination/<session>/` subdirectory). Do not load both simultaneously unless a `sync-planning-files.sh` script is added.

---

### Red Fail #7

**Trigger:** `user-intent-interactive-loop` → `first-action.sh` not called from SKILL.md → orphaned automation

**Mechanism:** `user-intent-interactive-loop` has `scripts/first-action.sh` (174L) that automates 6 steps: hierarchy verification, skill registration, state directory creation, tracking file initialization, platform skill checks. SKILL.md lines 82-111 describe these same steps **manually** rather than calling the script. The script is orphaned — it exists and works but is never invoked.

**Impact:** Two execution paths exist: (a) agent follows SKILL.md and does 6 steps manually, (b) agent discovers `first-action.sh` and runs it directly. Path (b) is faster but bypasses the SKILL.md workflow that `use-authoring-skills` would expect to see. An agent following `user-intent-interactive-loop`'s own procedure and an agent using the script directly produce different session state layouts.

**Correct pair:** Always follow SKILL.md procedural steps exactly; `first-action.sh` should either be called from SKILL.md (add `bash scripts/first-action.sh` to FIRST ACTION section) or removed from the bundle to prevent confusion.

---

### Red Fail #8

**Trigger:** `agent-authorization` + overlap detection → `check-overlaps.sh` always exits 0, cannot block

**Mechanism:** `agent-authorization`'s `scripts/check-overlaps.sh` (131L) exits with code 0 (success) even when warnings are found (line 130: `exit 0`). The `use-authoring-skills` version exits 1 on overlaps (blocking). `agent-authorization`'s overlap detection is **advisory only**.

**Impact:** If an agent uses `agent-authorization`'s `check-overlaps.sh` as a gate (expecting it to block on conflicts), it won't. The overlap check passes silently even with dangerous duplications. This violates the agentskills.io "Validate before done" principle.

**Correct pair:** Use `use-authoring-skills`'s `check-overlaps.sh` (exits 1 on overlaps, blocking) for authorization overlap checks, not `agent-authorization`'s advisory version.

---

## 5. Domain Coverage Map

### 20 Skills by Domain

| Domain | Skills | Coverage | Quality |
|--------|--------|----------|---------|
| **Skill Authoring / Quality** | `use-authoring-skills`, `meta-builder`, `skill-synthesis` | ✅ Strong (3 skills) | A–B |
| **Multi-Agent Orchestration / Delegation** | `coordinating-loop`, `user-intent-interactive-loop`, `agents-and-subagents-dev`, `phase-loop` | ✅ Strong (4 skills) | A–D (phase-loop is D) |
| **Agent Authorization / Governance** | `agent-authorization` | ⚠️ Thin (1 skill) | C (scripts not integrated) |
| **Platform Reference (OpenCode)** | `opencode-platform-reference`, `opencode-non-interactive-shell` | ✅ Strong (2 skills) | C+–A |
| **External Codebase Reference** | `oh-my-openagent-reference` | ⚠️ Broken (D-grade, phantom refs) | D |
| **Deep Research Methodology** | `hm-deep-research` | ✅ Strong (1 skill) | C+ |
| **Harness Self-Auditing** | `harness-audit`, `harness-delegation-inspection` | ✅ Adequate (2 skills) | B–C |
| **Eval / Benchmarking** | `eval-harness` | ❌ Absent (F-grade, unimplemented) | F |
| **Command Development** | `command-dev`, `command-parser` | ⚠️ Thin (2 skills, no scripts) | D–C |
| **Custom Tool Development** | `custom-tools-dev` | ⚠️ Thin (1 skill, no scripts) | D |
| **Session/Planning Persistence** | `planning-with-files` | ⚠️ Thin (D-grade, zero bundle) | D |
| **Skill Synthesis (Remote)** | `skill-synthesis` | ✅ Adequate (has bug) | C+ (bug blocks use) |

### Uncovered Domain Gaps

| Gap | Impact | Severity |
|-----|--------|----------|
| **Eval Execution** — No skill can programmatically run evals against a skill's `trigger-queries.json`. The `eval-harness` design exists but is unimplemented. | Cannot automatically measure skill trigger accuracy | **HIGH** |
| **Permission Enforcement** — No skill programmatically enforces OpenCode permission boundaries. `harness-audit` audits them; nothing validates or blocks on them at runtime. | Permission violations can reach production | **HIGH** |
| **Hook/Event System** — No skill addresses the OpenCode plugin hook system (`tool.execute.before`, `tool.execute.after`, `event` hooks) for building reactive agent behaviors. | Agents can't build event-driven patterns | **MEDIUM** |
| **Context Compaction** — `harness-delegation-inspection` mentions compaction but doesn't provide a compaction protocol or script. | Long sessions accumulate junk context | **MEDIUM** |
| **Skill Dependency Resolution** — No skill maps which skills depend on which other skills (beyond the Layer 1/2/3 hierarchy). A dependency graph with version constraints would enable smarter loading. | May load incompatible skill versions | **LOW** |
| **Agent Lifecycle Events** — No skill covers the 6 lifecycle events for subagents (spawn, inherit, progress, complete, fail, timeout). `harness-delegation-inspection` touches this but doesn't provide a protocol. | Subagent failures cascade silently | **MEDIUM** |
| **Non-OpenCode Platform Skills** — Skills for Claude Code, Codex, Cursor are mentioned in `use-authoring-skills/references/06-cross-platform-activation.md` but no dedicated skill exists for multi-platform deployment | Skills may not activate on all platforms | **LOW** |

### Quality Spread (Cycle 1 Grades)

| Grade | Skills | Count |
|-------|--------|-------|
| **A** | `coordinating-loop`, `user-intent-interactive-loop` | 2 |
| **B+** | `meta-builder` | 1 |
| **B** | `use-authoring-skills` | 1 |
| **B-** | `harness-audit` | 1 |
| **C+** | `skill-synthesis`, `hm-deep-research`, `opencode-platform-reference` | 3 |
| **C** | `harness-delegation-inspection`, `agent-authorization`, `opencode-non-interactive-shell`, `command-parser` | 4 |
| **D** | `phase-loop`, `oh-my-openagent-reference`, `planning-with-files`, `command-dev`, `custom-tools-dev`, `agents-and-subagents-dev` | 6 |
| **F** | `eval-harness` | 1 |
| **REMOVED** | `session-context-manager` | 1 |

**Average grade: C** — The skill set is functional but uneven. 8 of 20 skills are D/F grade. The A-grade skills (orchestration core) are production-ready; the D/F skills need significant work before they can reliably execute their stated purpose.

---

## 6. Conflict Registry (Complete)

| Conflict | Skills Involved | Type | Resolution |
|----------|----------------|------|------------|
| `verify-hierarchy.sh` (295L × 2) | coordinating-loop ↔ user-intent-interactive-loop | Byte-identical duplicate | Extract to shared `.claude/shared-scripts/` or keep duplicated for standalone operation |
| `register-skill.sh` (122L × 2) | coordinating-loop ↔ user-intent-interactive-loop | Byte-identical duplicate | Same — intentional for standalone |
| `validate-skill.sh` (187L × 2) | use-authoring-skills ↔ skill-synthesis | Identical copy | Must sync manually on any change |
| `check-overlaps.sh` (203L × 2) | use-authoring-skills ↔ skill-synthesis | Identical copy | Must sync manually |
| `validate-gate.sh` (118L × 2) | use-authoring-skills ↔ skill-synthesis | Identical copy + bug | Must sync; skill-synthesis SKILL.md uses wrong action `synthesize` |
| `validate-skill.sh` (generic vs domain) | use-authoring-skills ↔ agent-authorization | Different implementations | No sync needed — different validation philosophies |
| `check-overlaps.sh` (generic vs gate-specific) | use-authoring-skills ↔ agent-authorization | Different implementations | No sync needed |
| `register-skill.sh` (read-only vs write) | meta-builder ↔ use-authoring-skills | Different implementations | No sync needed — different purposes |
| `non-interactive-shell.md` | command-dev refs ↔ opencode-non-interactive-shell skill | Topic overlap | Merge into single authoritative source |
| `task_plan.md` / `progress.md` / `findings.md` | planning-with-files (root) ↔ coordinating-loop (`.coordination/<session>/`) | Naming collision, different dirs | Document the directory distinction explicitly |
| `files.md` + `oh-my-openagent-full.xml` | oh-my-openagent-reference internal | 553K redundant lines | Remove `files.md`, keep XML for repomix tools |

---

_Cycle 2 Complete: 2026-04-09_
_Producer: Orchestrator direct (background delegation non-functional — `builtin-process` submode silently fails)_
