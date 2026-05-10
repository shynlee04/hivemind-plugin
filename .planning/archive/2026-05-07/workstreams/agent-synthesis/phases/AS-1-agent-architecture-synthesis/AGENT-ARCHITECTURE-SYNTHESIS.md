---
phase: AS-1
plan: agent-architecture-synthesis
created: 2026-04-29
status: COMPLETE
workstream: agent-synthesis
depends_on:
  - AS-0
locked_decisions:
  - D-AD-04 (XML tagged sections are the standard)
  - D-05 (Agent body content must match GSD quality)
  - D-06 (hivefiver-* → hf-* lineage)
  - D-07 (core agents → hm-* lineage)
---

# Agent Architecture Synthesis

> **AS-1 Deliverable** — Comparative analysis of GSD XML, Hivefiver Markdown, OMO, and Enriched Hybrid agent architectures. Best-of-both synthesis with unified body template, permission model standard, quality baseline, anti-pattern catalog, and migration map.

---

## 1. Pattern Comparison

### 1.1 GSD XML Pattern

**Found in:** 32 GSD agents (all but `gsd-intel-updater`), plus `general.md` and `meta-synthesis-agent.md`

**Frontmatter:**
```yaml
name: gsd-planner
description: Creates executable phase plans with task breakdown...
mode: subagent
```

**Body Structure:** Entirely XML-tagged sections. Tags vary by agent role but common tags include:

| Tag | Required | Purpose | Example |
|-----|----------|---------|---------|
| `<role>` | Yes | Identity and responsibilities | "You are a GSD planner..." |
| `<documentation_lookup>` | No | How to look up library docs | Context7 MCP / CLI fallback |
| `<project_context>` | No | How to load project context | Read AGENTS.md, load skills |
| `<philosophy>` | No | Design principles and rules | "Plans Are Prompts" |
| `<execution_flow>` | Yes (when present) | Deterministic step sequence | `<step name="load_state">` |
| `<step>` | Child of `<execution_flow>` | Single workflow step | Priority, action, verification |
| `<critical_rules>` | No | Non-negotiable constraints | "No re-reads", "Stop on sufficient evidence" |
| `<success_criteria>` | Yes | Checklist for completion | Phase planning complete when... |
| `<structured_returns>` | No | Output format templates | "## PLANNING COMPLETE" markdown |

5 of 33 GSD agents use explicit `<step>` tags within `<execution_flow>`: gsd-planner (22 steps), gsd-debugger, gsd-executor, gsd-code-fixer, gsd-codebase-mapper.

**Tag Inventory (gsd-planner — the canonical example):** `<role>`, `<documentation_lookup>`, `<project_context>`, `<context_fidelity>`, `<scope_reduction_prohibition>`, `<planner_authority_limits>`, `<philosophy>`, `<discovery_levels>`, `<task_breakdown>`, `<dependency_graph>`, `<scope_estimation>`, `<plan_format>`, `<goal_backward>`, `<tdd_integration>`, `<checkpoints>`, `<gap_closure_mode>`, `<revision_mode>`, `<reviews_mode>`, `<execution_flow>` (with 22 `<step>` children), `<structured_returns>`, `<critical_rules>`, `<success_criteria>`

**What Makes gsd-planner a Quality Benchmark (1248 lines / 22 steps):**
1. Exhaustive tag inventory: 22 distinct XML tags cover every aspect of the agent's role
2. Deterministic execution: 22 sequential steps leave no ambiguity about what to do next
3. Behavioral contracts: `<context_fidelity>` enforces user decision fidelity; `<scope_reduction_prohibition>` prevents scope creep
4. Structured returns: Every output format is templated — the agent never invents a response structure
5. Self-documenting: Reading the tag hierarchy reveals the full workflow without reading prose
6. Guardrails: `<critical_rules>` prevents common agent errors (re-reads, context waste, heredoc writes)
7. No ambiguity: Every step has a name, priority, and action — no "figure it out" moments

**Strengths:**
- **Machine-parseable:** Tags can be extracted programmatically for documentation, auditing, and validation
- **Self-documenting:** Tag hierarchy IS the table of contents — skimming tags reveals the full agent structure
- **Execution flow clarity:** `<step>` tags create deterministic workflows that prevent agent deviation
- **Scope creep prevention:** Behavioral contracts (`<scope_reduction_prohibition>`, `<context_fidelity>`) are embedded in the body
- **Traceable completeness:** `<success_criteria>` with checklists provides verifiable completion gates

**Weaknesses:**
- **Verbose:** gsd-planner at 1248 lines exceeds AQUAL-06 (500 LOC) — though this is an internal build tool, not a shipped agent
- **Rigid structure:** Adding a new concern requires a new XML tag — templates can't easily adapt
- **No permission model in frontmatter:** All GSD agents omit `permission` — tools are unrestricted at runtime
- **No temperature specification:** All GSD agents omit `temperature` — reliance on runtime defaults
- **Harder to write casually:** XML syntax requires discipline and familiarity with the tag schema

---

### 1.2 Hivefiver Markdown Pattern

**Found in:** 6 `hivefiver-*` agents + `hf-prompter.md`

**Frontmatter:**
```yaml
name: "hivefiver-agent-builder"
description: "Creates, audits, and repairs OpenCode agent definitions..."
mode: subagent
temperature: 0.15
instruction: [.opencode/rules/*.md]
permission:
  read: allow
  edit: allow
  write: allow
  bash:
    "*": ask
    "git status*": allow
  task: ask
  skill:
    "*": ask
    "hf-agents-and-subagents-dev": allow
  glob: allow
  grep: allow
```

**Body Structure:** Markdown sections with H2 headings. Common sections:

| Section | Required | Pattern |
|---------|----------|---------|
| Identity | Yes | One-line role statement |
| The Iron Law | Yes | ALL-CAPS non-negotiable rule |
| Frontmatter Schema | No (agent-builder only) | Detailed field reference |
| Routing Table | No (orchestrator only) | Intent → Skill → Agent mapping |
| Real Delegation Protocol | No (orchestrator only) | How to use Task tool |
| Execution Flow | No | Numbered steps |
| Anti-Patterns | Yes (orchestrator) | Table with detection/correction |
| Output Contract | Yes | Structured return format |

**Section Inventory (hivefiver-orchestrator — 255 lines):** Identity, The Iron Law, Routing Table, Real Delegation Protocol, Status Protocol, Two-Stage Review, Execution Flow (6 steps), Configuration Intent Detection, Executing the Prompt-Enhance Pipeline, Anti-Patterns (7 entries), Output Contract

**Strengths:**
- **Granular permission model:** `permission` record with ask-all base and explicit allow per tool + pattern-matching — this is the gold standard
- **Low temperature:** All hivefiver agents set temperature 0.15–0.2 for deterministic behavior
- **Skill routing:** `skill:` permission block explicitly allows specific skills (preventing skill abuse)
- **Iron Law pattern:** Single ALL-CAPS non-negotiable rule prevents the most common agent failures
- **Familiar to writers:** Markdown is universally understood — lower barrier to entry for authoring
- **Anti-Pattern catalog:** Detection + correction table prevents known failure modes

**Weaknesses:**
- **Not machine-parseable:** Markdown sections have no structural markup — tools can't extract permissions, verify completeness, or audit structure
- **Inconsistent section naming:** No enforced section schema — `## Identity` vs `## Role` vs `## Who You Are`
- **No execution flow tags:** Steps are described in prose, not structured — agents can interpret differently
- **Permission sprawl risk:** Pattern-matched permissions can become complex and hard to audit
- **No depth/lineage in body:** Depth and lineage are implicit from naming, not explicit in body content

---

### 1.3 OMO (oh-my-openagent) Patterns

**Source:** `oh-my-openagent-reference` skill — external reference architecture

**Relevant patterns (for reference only, not direct adoption):**

| Pattern | OMO Implementation | Relevance to Hivemind | Verdict |
|---------|-------------------|----------------------|---------|
| **Hook Lifecycle** | PreToolUse, PostToolUse, PreSkillLoad hooks | Similar to our gate triad (lifecycle → spec → evidence) | ADAPT — rename `Hook` → `Gate` |
| **Circuit Breaker** | Keyed semaphore with failure thresholds | Already implemented in `src/lib/concurrency.ts` | ADOPT — already in harness |
| **Category Routing** | Agent dispatch by intent category | Relevant for agent classification (hm-* product vs hf-* meta) | ADAPT — category becomes lineage |
| **Session Continuity** | Durable JSON persistence | Already implemented in `src/lib/continuity.ts` | ADOPT — already in harness |
| **Skill Loader** | Dynamic skill discovery and injection | Already in `src/lib/session-api.ts` via OpenCode SDK | ADOPT — already in harness |

**Verdict:** OMO confirms our architectural direction but adds no novel patterns we don't already have in the harness. Reference only.

---

### 1.4 Enriched Hybrid Pattern (Target Format)

**Found in:** `orchestrator.md` (69 lines), `general.md` (49 lines) — AS-0 enriched agents

**Frontmatter:**
```yaml
name: orchestrator
description: "Front-facing orchestrator for the Hivemind harness..."
mode: primary
temperature: 0.25
permission:
  read:
    "*": ask
    "*.md": allow
    "*.json": allow
    "*.ts": allow
  edit:
    "*": ask
  write:
    "*": ask
  bash:
    "*": ask
    "git status*": allow
    "git diff*": allow
    "git log*": allow
  task: allow
  delegate-task: allow
  skill:
    "*": ask
    "hm-*": allow
    "hf-*": allow
  glob: allow
  grep: allow
```

**Body Structure:** XML tags in a markdown file:

```xml
<role>Front-facing orchestrator for the Hivemind harness...</role>
<depth>L0 Orchestrator</depth>
<lineage>hm-*</lineage>
<task>Receive user requests, classify intent, delegate...</task>
<scope>Delegation, routing, gatekeeping...</scope>
<context>Understands project structure...</context>
<expected_output>Delegated work results, verified through 3-gate completion...</expected_output>
<verification>All delegated tasks returned with evidence...</verification>
```

**This is the target format** — the best of all three worlds:
1. **GSD's XML structure** for machine-parseability and execution flow clarity
2. **Hivefiver's granular permissions** for ask-all + explicit allow security
3. **Compact size** — 50-200 lines, well within AQUAL-06 (500 LOC)

---

## 2. Best-of-Both Synthesis

### Verdict Matrix

| Pattern Element | Source | Verdict | Rationale |
|----------------|--------|---------|-----------|
| XML-tagged body sections | GSD | **ADOPT** | Machine-parseable, self-documenting, D-AD-04 locked |
| Granular permissions (ask-all) | Hivefiver | **ADOPT** | Security baseline; prevents tool abuse |
| Low temperature (0.0–0.3) | Hivefiver | **ADOPT** | Deterministic behavior for agents |
| Depth + Lineage in body | Enriched | **ADOPT** | Explicit classification in body (not just naming) |
| Execution flow with `<step>` tags | GSD | **ADAPT** | Required for L0/L1 agents; optional for L2 |
| Iron Law pattern | Hivefiver | **ADAPT** | Rename to `<iron_law>` XML tag |
| Anti-Pattern catalog | Hivefiver | **ADOPT** | Detect + correction table — universal |
| Output Contract | Hivefiver | **ADOPT** | Structured return format |
| Full tag inventory (22 tags) | GSD | **ADAPT** | 10 required tags, 6 optional — not 22 |
| Markdown content within XML | GSD | **ADOPT** | Lists, tables, code blocks within `<context>`, `<scope>` |
| Skill routing (skill: allow) | Hivefiver | **ADOPT** | Explicit skill allow-list per agent |
| OMO circuit breaker | OMO | **ADOPT** | Already in harness — no body change needed |
| OMO hook lifecycle | OMO | **ADAPT** | Our gate triad already covers this |
| Behavior contracts embedded | GSD | **ADAPT** | `<behavioral_contract>` as optional tag |

### What We Keep From Each

**From GSD (structure, rigor, execution):**
1. XML-tagged sections as the primary body structure
2. `<execution_flow>` with `<step>` children for L0/L1 agents
3. Self-documenting tag hierarchy (reading tags = understanding the agent)
4. `<success_criteria>` with checklists for verifiable completion
5. Behavioral contracts as `<behavioral_contract>` (optional tag)

**From Hivefiver (security, determinism, routing):**
1. `permission:` record with ask-all base — the gold standard
2. `temperature:` in frontmatter — explicit, not runtime-default (L0: 0.2–0.3, L1: 0.1–0.2, L2: 0.0–0.15)
3. Iron Law → `<iron_law>` XML tag — single non-negotiable constraint
4. Anti-Pattern catalog → `<anti_patterns>` XML section
5. Output Contract → `<output_contract>` XML section

**From OMO (confirmations, not additions):**
1. Circuit breaker already implemented — no agent body change needed
2. Session continuity already implemented — no agent body change needed
3. Hook lifecycle adapted into our gate triad

**Our Additions (Hivemind-specific):**
1. `<depth>` and `<lineage>` as required XML tags for explicit classification
2. `<workflow_awareness>` optional tag: which workstreams and phases this agent knows about
3. `<session_continuity>` optional tag: instructions for resume-ability
4. Behavioral contract template: what this agent MUST, MUST NOT, and SHOULD do

---

## 3. Unified Body Template (D-AD-04 Confirmed)

### Required Tags (10)

Every hm-* and hf-* agent MUST include these 10 XML sections:

```xml
<role>
[Identity statement: who this agent is, what it does, who spawns it]
</role>

<depth>
[One of: L0 Orchestrator | L1 Coordinator | L2 Specialist]
</depth>

<lineage>
[One of: hm-* | hf-*]
</lineage>

<task>
[Concrete task description: what this agent accomplishes]
</task>

<scope>
[Boundaries: what this agent does AND what it does NOT do]
</scope>

<context>
[What this agent knows: project structure, workstreams, locked decisions.
May contain markdown lists, tables, and code blocks.]
</context>

<expected_output>
[What the agent returns: format, structure, evidence requirements]
</expected_output>

<verification>
[How to verify this agent completed its work: checks, commands, evidence]
</verification>

<iron_law>
[A single ALL-CAPS non-negotiable rule. One sentence. The ONE thing this agent must never violate.]
</iron_law>

<output_contract>
[Structured return format: markdown template with variable placeholders]
</output_contract>
```

### Optional Tags (6)

Add these when the agent's role requires them:

```xml
<behavioral_contract>
[MUST / MUST NOT / SHOULD clauses for behavioral guardrails]
</behavioral_contract>

<anti_patterns>
| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| [Name] | [How to detect] | [How to fix] |
</anti_patterns>

<execution_flow>
  <step name="[step_name]" priority="[first|normal|last]">
  [Step action — what to do]
  </step>
  <!-- Required for L0/L1 agents, optional for L2 specialists -->
</execution_flow>

<delegation_boundary>
[When this agent should spawn subagents vs. when it should handle work directly]
</delegation_boundary>

<skill_loading>
[List of skills this agent should load, categorized by workflow phase.
Format: skill-name — purpose — when to load]
</skill_loading>

<session_continuity>
[Instructions for resuming after interruption: which files to read, what state to recover]
</session_continuity>
```

### Markdown-Allowed Zones

The following XML tag content areas support markdown formatting:
- `<context>` — tables, lists, code blocks, emphasis
- `<scope>` — bullet lists for boundaries
- `<task>` — inline formatting for emphasis
- `<expected_output>` — markdown code blocks for templates
- `<output_contract>` — markdown templates
- `<anti_patterns>` — markdown tables
- `<behavioral_contract>` — bullet lists

### Example: Minimal hm-* Specialist Agent (~50 lines)

```markdown
---
name: hm-researcher
description: "Terminal repository investigator for read-only codebase research. Use when investigating bugs, tracing patterns, or gathering codebase evidence."
mode: subagent
temperature: 0.05
permission:
  read: allow
  edit:
    "*": ask
  write:
    "*": ask
  bash:
    "*": ask
    "git *": allow
  glob: allow
  grep: allow
  task:
    "*": ask
  skill:
    "*": ask
    "hm-detective": allow
    "hm-deep-research": allow
---

# hm-researcher

<role>
Terminal repository investigator for read-only codebase research. Spawned by L1 coordinators for codebase investigation tasks. NEVER mutates files.
</role>

<depth>
L2 Specialist
</depth>

<lineage>
hm-*
</lineage>

<task>
Conduct read-only codebase research: find definitions, trace patterns, gather evidence, and produce structured findings. No file mutations.
</task>

<scope>
Read, grep, glob, bash (git only), and skill loading (hm-detective, hm-deep-research). NOT for editing, writing, or file creation. If the task requires code changes, escalate to the coordinator.
</scope>

<context>
Understands project structure (src/, .opencode/, .hivemind/). Can navigate any file in the repository. Uses hm-detective for SCAN/DEEP reading. Uses hm-deep-research for external library investigation.
</context>

<expected_output>
Structured findings with file:line references. No opinions — only evidence. If nothing found, report search paths and queries used.
</expected_output>

<verification>
All findings have file:line references. No claims without evidence. Output matches requested format.
</verification>

<iron_law>
READ-ONLY. NEVER MUTATE FILES. NEVER EDIT OR WRITE.
</iron_law>

<output_contract>
## Research Findings

**Question:** [what was asked]
**Files Examined:** [count]
**Key Finding:** [answer-first summary]

### Evidence
- `path/to/file.ts:123` — [finding]
- `path/to/file.ts:456` — [finding]
</output_contract>
```

---

## 4. Permission Model Standard

### Principle: ask-All, Allow-Explicit

Every agent's `permission:` block follows this structure:

```yaml
permission:
  # Native OpenCode tools
  read: allow | ask | { pattern: value }
  edit: allow | ask | { pattern: value }
  write: allow | ask | { pattern: value }
  bash: allow | ask | { pattern: value }
  glob: allow | ask
  grep: allow | ask

  # Hivemind custom tools
  task: allow | ask | { pattern: value }
  delegate-task: allow | ask
  delegation-status: allow | ask
  session-journal-export: allow | ask
  prompt-skim: allow | ask
  prompt-analyze: allow | ask
  session-patch: allow | ask

  # MCP / External tools
  webfetch: allow | ask
  websearch: allow | ask
  {mcp_tool_name}: allow | ask

  # Skill loading
  skill:
    "*": ask
    "hm-*": allow
    "hf-*": allow
    # Or explicit per-skill:
    "hm-detective": allow
```

### Tool Categories

| Category | Tools | Default for L0 | Default for L1 | Default for L2 |
|----------|-------|---------------|---------------|---------------|
| **Read** | read, glob, grep | allow | allow | allow |
| **Write** | edit, write | ask | ask | allow (scope-bound) |
| **Shell** | bash | ask (git only) | ask (git only) | ask (git only) |
| **Delegate** | task, delegate-task | allow | allow | ask |
| **Skill** | skill | allow (hm-*, hf-*) | allow (specific) | allow (specific) |
| **Web** | webfetch, websearch | allow | allow | ask |
| **Prompt** | prompt-skim, prompt-analyze | allow | ask | ask |

### Permission Inheritance Rules

1. L2 specialists inherit default permissions from their L1 coordinator
2. Explicit permission always overrides inherited
3. Pattern-matched permissions follow glob semantics
4. `"*": ask` is the base for all permission categories — no implicit access

---

## 5. Quality Baseline

### What Makes an Agent HIGH Quality

| Criterion | Threshold | Measurement |
|-----------|-----------|-------------|
| **Body LOC** | ≥ 200 (target), ≥ 50 (minimum) | `wc -l` minus YAML frontmatter |
| **XML Tags** | All 10 required tags present | grep for `</role>`, `</depth>`, etc. |
| **Behavioral Contract** | `<behavioral_contract>` or `<iron_law>` present | At least one guardrail tag |
| **Permission Model** | `permission:` block with ask-all base | YAML validation |
| **Temperature** | Explicitly set in frontmatter | YAML field check |
| **Mode** | `primary` or `subagent` declared | YAML field check |
| **Lineage** | `<lineage>` tag matches filename prefix | hm-* → `hm-*`, hf-* → `hf-*` |
| **Depth** | `<depth>` tag present | L0, L1, or L2 |
| **Output Contract** | `<output_contract>` with template | Non-empty tag content |
| **Anti-Patterns** | `<anti_patterns>` with ≥ 2 entries | Table with Detection + Correction |

**Quality Tiers:**

| Tier | Criteria | Example |
|------|----------|---------|
| **HIGH** | ≥ 200 LOC, all 10 tags, behavioral contract, validated permissions | gsd-planner (1248L), hivefiver-agent-builder (361L) |
| **MEDIUM** | 50-200 LOC, 7+ tags, permissions present, iron law present | coordinator.md (205L), critic.md (121L) |
| **LOW** | < 50 LOC or missing 4+ required tags | build.md (51L, flat), test-router.md (30L, stub) |
| **NONE** | Missing file entirely | explore (ghost) |

---

## 6. Anti-Pattern Catalog

| # | Anti-Pattern | Detection | Correction | Severity |
|---|-------------|-----------|------------|----------|
| **AP-01** | **Premature Done** — Agent declares task complete without verifying output | `DONE` claim but output file missing or empty | Always verify fresh: run the verification command AFTER completion, not before. Output must exist and be non-empty. | HIGH |
| **AP-02** | **Infinite Loop** — Agent keeps retrying without changing approach | Same error repeated 3+ times without strategy change | Max 3 retry attempts. After 3 failures, escalate with evidence. Never retry without parameter change. | HIGH |
| **AP-03** | **Silent Fix** — Agent edits files without telling the coordinator what changed | File modification without commit or report | Always declare what was changed, why, and commit atomically after each fix. | MEDIUM |
| **AP-04** | **Skipped Gate** — Agent bypasses verification/quality gate | No evidence of gate execution in output | Gates are mandatory. Lifecycle → Spec → Evidence triad must execute in order. Never skip. | CRITICAL |
| **AP-05** | **Blanket Permission** — Agent has `read: allow` without `"*": ask` base | Permission block has `allow` without ask default | Always start with `"*": ask`, then allow specific patterns. | HIGH |
| **AP-06** | **Undocumented Role** — Agent body has no `<role>` tag | Missing `<role>` tag | Every agent must declare its identity. Who am I? Why do I exist? Who spawns me? | MEDIUM |
| **AP-07** | **Context Pollution** — Agent passes full conversation history to subagents | Subagent prompt includes "earlier in this conversation" or lengthy context dumps | Construct fresh context: task text + scene-setting + scope + output format. Let subagent read files itself. | MEDIUM |

---

## 7. Migration Map

### 7.1 GSD → hm-* Mapping (33 agents)

GSD agents are internal-only build tools. They are NOT shipped but serve as quality benchmarks for hm-* agent authoring.

| # | Current (gsd-*) | Target (hm-*) | Depth | Notes |
|---|-----------------|---------------|-------|-------|
| 1 | gsd-advisor-researcher | hm-advisor-researcher | L2 | Research synthesis specialist |
| 2 | gsd-ai-researcher | hm-ai-researcher | L2 | AI framework research |
| 3 | gsd-assumptions-analyzer | hm-assumptions-analyzer | L2 | Assumption validation |
| 4 | gsd-code-fixer | hm-code-fixer | L2 | Automated fix application |
| 5 | gsd-code-reviewer | hm-code-reviewer | L2 | Code quality review |
| 6 | gsd-codebase-mapper | hm-codebase-mapper | L2 | Codebase exploration + mapping |
| 7 | gsd-debug-session-manager | hm-debug-session-manager | L1 | Debug session coordination |
| 8 | gsd-debugger | hm-debugger | L2 | Systematic debugging |
| 9 | gsd-doc-classifier | hm-doc-classifier | L2 | Document classification |
| 10 | gsd-doc-synthesizer | hm-doc-synthesizer | L2 | Document synthesis |
| 11 | gsd-doc-verifier | hm-doc-verifier | L2 | Document verification |
| 12 | gsd-doc-writer | hm-doc-writer | L2 | Documentation authoring |
| 13 | gsd-domain-researcher | hm-domain-researcher | L2 | Domain research |
| 14 | gsd-eval-auditor | hm-eval-auditor | L2 | Evaluation auditing |
| 15 | gsd-eval-planner | hm-eval-planner | L2 | Evaluation planning |
| 16 | gsd-executor | hm-executor | L2 | Plan execution |
| 17 | gsd-framework-selector | hm-framework-selector | L2 | Framework selection |
| 18 | gsd-integration-checker | hm-integration-checker | L2 | Integration verification |
| 19 | gsd-intel-updater | hm-intel-updater | L2 | Intel file maintenance |
| 20 | gsd-nyquist-auditor | hm-nyquist-auditor | L2 | Test coverage auditing |
| 21 | gsd-pattern-mapper | hm-pattern-mapper | L2 | Pattern analysis |
| 22 | gsd-phase-researcher | hm-phase-researcher | L2 | Phase research |
| 23 | gsd-plan-checker | hm-plan-checker | L2 | Plan quality verification |
| 24 | gsd-planner | hm-planner | L2 | Phase planning |
| 25 | gsd-project-researcher | hm-project-researcher | L2 | Project research |
| 26 | gsd-research-synthesizer | hm-research-synthesizer | L2 | Research synthesis |
| 27 | gsd-roadmapper | hm-roadmapper | L2 | Roadmap creation |
| 28 | gsd-security-auditor | hm-security-auditor | L2 | Security auditing |
| 29 | gsd-ui-auditor | hm-ui-auditor | L2 | UI quality auditing |
| 30 | gsd-ui-checker | hm-ui-checker | L2 | UI spec validation |
| 31 | gsd-ui-researcher | hm-ui-researcher | L2 | UI research |
| 32 | gsd-user-profiler | hm-user-profiler | L2 | Developer profiling |
| 33 | gsd-verifier | hm-verifier | L2 | Phase goal verification |

**Note:** These agents are the GSD build system, not the shipped product. The hm-* equivalents will be authored from scratch (AS-3 through AS-5) using the GSD agents as quality benchmarks. The migration is conceptual — the actual agent files are NOT copied; they serve as templates for content quality.

### 7.2 Hivefiver → hf-* Mapping (6 agents)

| # | Current (hivefiver-*) | Target (hf-*) | Depth | Notes |
|---|---------------------|---------------|-------|-------|
| 1 | hivefiver | hf-orchestrator | L0 | Meta-builder root orchestrator |
| 2 | hivefiver-agent-builder | hf-agent-builder | L2 | Agent creation specialist |
| 3 | hivefiver-command-builder | hf-command-builder | L2 | Command creation specialist |
| 4 | hivefiver-orchestrator | (merged into hf-orchestrator) | L0 | Orchestrator logic absorbed |
| 5 | hivefiver-skill-author | hf-skill-author | L2 | Skill creation specialist |
| 6 | hivefiver-tool-builder | hf-tool-builder | L2 | Tool creation specialist |

### 7.3 Core → hm-* Mapping (18 agents)

| # | Current (unprefixed) | Target (hm-*) | Depth | Notes |
|---|---------------------|---------------|-------|-------|
| 1 | build | hm-build | L2 | Build execution specialist |
| 2 | conductor | hm-conductor | L0 | Primary session orchestrator |
| 3 | context-mapper | hm-context-mapper | L2 | Context grounding |
| 4 | context-purifier | hm-context-purifier | L2 | Context distillation |
| 5 | coordinator | hm-coordinator | L1 | Delegation coordinator |
| 6 | critic | hm-critic | L2 | Code review + validation |
| 7 | general | hm-general | L2 | Fallback subagent |
| 8 | intent-loop | hm-intent-loop | L1 | Intent clarification |
| 9 | meta-synthesis-agent | hm-meta-synthesis | L2 | Meta-concept synthesis |
| 10 | orchestrator | hm-orchestrator | L0 | Front-facing orchestrator |
| 11 | phase-guardian | hm-phase-guardian | L1 | Phase loop enforcement |
| 12 | prompt-analyzer | hm-prompt-analyzer | L2 | Prompt analysis lane |
| 13 | prompt-repackager | hm-prompt-repackager | L2 | Prompt repackaging lane |
| 14 | prompt-skimmer | hm-prompt-skimmer | L2 | Prompt skimming lane |
| 15 | researcher | hm-researcher | L2 | Codebase research |
| 16 | risk-assessor | hm-risk-assessor | L2 | Risk assessment lane |
| 17 | spec-verifier | hm-spec-verifier | L2 | Spec verification |
| 18 | test-router | hm-test-router | L2 | Test routing |

**Ghost Agent:**
| # | Ghost | Target | Depth | Notes |
|---|-------|--------|-------|-------|
| 1 | explore (missing) | hm-explore | L2 | Codebase exploration — file must be created |

### 7.4 Unchanged Agents (1 agent)

| # | Current | Target | Depth | Notes |
|---|---------|--------|-------|-------|
| 1 | hf-prompter | hf-prompter | L0 | Already in hf-* lineage |

### Migration Summary

| Source | Count | Target Lineage | Action |
|--------|-------|---------------|--------|
| gsd-* | 33 | hm-* | Author from scratch using GSD body content as quality benchmark |
| hivefiver-* | 6 | hf-* | Rename + enrich with XML tags + add missing permissions |
| Core (unprefixed) | 18 | hm-* | Rename + enrich with XML tags + add permissions |
| Ghost | 1 | hm-* | Create new file |
| Unchanged | 1 | hf-* | Already correct lineage |
| **Total** | **59** | — | — |

---

## 8. Temperature Ranges by Depth

| Depth | Temperature Range | Rationale | Example Agents |
|-------|------------------|-----------|----------------|
| **L0 Orchestrator** | 0.2 – 0.3 | Needs some flexibility for routing decisions and user intent classification. Too low → brittle routing. Too high → unpredictable delegation. | hm-orchestrator, hf-orchestrator, hm-conductor |
| **L1 Coordinator** | 0.1 – 0.2 | Balances structured workflow management with adaptive problem-solving. Must follow procedures precisely but adapt to edge cases. | hm-coordinator, hm-intent-loop, hm-phase-guardian |
| **L2 Specialist** | 0.0 – 0.15 | Maximum determinism. These agents execute well-defined tasks with clear inputs/outputs. No creativity needed — precision and reliability are paramount. | hm-planner, hm-executor, hm-critic, hm-researcher, hm-code-reviewer |

**Guidelines:**
- L2 agents performing creative work (documentation, UI design) may use 0.15–0.25
- All temperatures must be explicitly set in YAML frontmatter — no runtime default reliance
- Temperature is a tool for reliability, not creativity — lower = more predictable

---

## Appendix A: Comparison at a Glance

| Dimension | GSD XML | Hivefiver MD | Enriched Hybrid | Target Standard |
|-----------|---------|-------------|-----------------|-----------------|
| **Body format** | XML tags | Markdown H2 | XML tags in MD | XML tags in MD |
| **Frontmatter richness** | Minimal (3 fields) | Rich (6+ fields) | Rich (6+ fields) | Rich (6+ fields) |
| **Permission model** | None | ask-all granular | ask-all granular | ask-all granular |
| **Temperature** | Not set (runtime) | 0.15–0.2 | 0.2–0.25 | Set by depth: 0.0–0.3 |
| **Execution flow** | `<step>` tags (5/33 agents) | Numbered steps | Prose | `<step>` tags for L0/L1 |
| **Behavioral contracts** | Embedded in XML | `## The Iron Law` | `<iron_law>` | `<iron_law>` + `<behavioral_contract>` |
| **Anti-patterns** | Implicit in tags | Explicit table | Not present | `<anti_patterns>` table |
| **Output contract** | `<structured_returns>` | `## Output Contract` | `<output_contract>` | `<output_contract>` |
| **Typical LOC** | 200–1200 | 80–360 | 49–69 | 50–300 (target) |
| **Machine-parseable** | Yes | No | Yes | Yes |
| **Authoring barrier** | High | Low | Medium | Medium |

---

## Appendix B: Tag Reference

| Tag | Required | Applies To | Purpose |
|-----|----------|-----------|---------|
| `<role>` | ✅ Required | All | Agent identity and responsibilities |
| `<depth>` | ✅ Required | All | L0 / L1 / L2 classification |
| `<lineage>` | ✅ Required | All | hm-* or hf-* |
| `<task>` | ✅ Required | All | Concrete task description |
| `<scope>` | ✅ Required | All | Boundaries (can + cannot do) |
| `<context>` | ✅ Required | All | What the agent knows |
| `<expected_output>` | ✅ Required | All | Return format and evidence requirements |
| `<verification>` | ✅ Required | All | How to verify completion |
| `<iron_law>` | ✅ Required | All | Single non-negotiable rule |
| `<output_contract>` | ✅ Required | All | Structured return template |
| `<behavioral_contract>` | Optional | L0, L1 | MUST / MUST NOT / SHOULD clauses |
| `<anti_patterns>` | Optional | All | Failure mode detection + correction |
| `<execution_flow>` | Required (L0, L1) | L0, L1 | Deterministic step sequence |
| `<step>` | Child of `<execution_flow>` | L0, L1 | Single workflow step |
| `<delegation_boundary>` | Optional | L0, L1 | When to delegate vs. self-execute |
| `<skill_loading>` | Optional | All | Skills to load by workflow phase |
| `<session_continuity>` | Optional | All | Resume-after-interruption instructions |
