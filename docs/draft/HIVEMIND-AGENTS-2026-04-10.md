# The HiveMind Agent Ecosystem: Team Architecture and Context Pipelines

**Document**: HIVEMIND-AGENTS-2026-04-10.md  
**Role**: Document 3 of 3 — Agent Ecosystem and Context Pipelines  
**Status**: Complete  
**Date**: 2026-04-10

---

## Executive Summary

HiveMind V3 implements a **team-based agent architecture** that fundamentally shifts from monolithic single-agent systems to orchestrated specialist teams. Rather than relying on one general-purpose agent to research, plan, implement, and verify, HiveMind decomposes work across distinct agent types—orchestrator, specialist, and subagent—each with bounded capabilities, controlled permissions, and explicit context contracts.

The core insight driving this architecture is the **specialist principle**: no single agent can excel at everything. A researcher optimized for exhaustive investigation thinks differently than a builder optimized for precise code changes, which differently again from a critic optimized for ruthless verification. HiveMind's orchestration layer routes work to the right specialist at the right time, propagates context across delegation boundaries, and accumulates intelligence into a persistent session brain that grows smarter across sessions.

The ecosystem has two non-negotiable halves: the **Hard Harness** (an npm package of TypeScript tools, hooks, and a plugin assembly) and the **Soft Meta-Concepts** (user-configurable skills, agents, commands, and rules in `.opencode/`). The harness executes; the meta-concepts teach. This separation ensures the runtime engine stays lean (~4,000–5,000 LOC target) while the instruction surface remains flexible and user-owned.

---

## 1. The Team Architecture Model

### The Fundamental Shift: From Single Agent to Agent Team

Traditional AI coding assistants operate as **monolithic agents**: one model receives a task, thinks end-to-end, and produces a solution. This works for simple tasks but collapses under complexity because:

- **Context overflow**: A single agent accumulating all context loses track of what matters
- **Skill mismatch**: Code generation and exhaustive research require different cognitive modes
- **No recovery**: When a monolithic agent fails mid-task, the entire context is lost
- **No checkpoints**: No mechanism to resume from a specific phase

HiveMind replaces this with a **team architecture** where multiple agents, each with bounded responsibility, coordinate through a shared context pipeline and persistent state.

### The Orchestrator / Specialist / Subagent Hierarchy

HiveMind defines a three-tier delegation hierarchy:

| Tier | Role | What It Does | Example Agents |
|------|------|-------------|---------------|
| **Orchestrator** | Routing, gatekeeping, delegation | Receives user intent, classifies it, delegates to specialists, never implements directly | `coordinator`, `conductor`, `orchestrator` |
| **Specialist** | Deep domain work | Executes bounded tasks within their domain (research, build, review) with full access to domain tools | `researcher`, `builder`, `critic`, `general` |
| **Subagent** | Focused task execution | spawned for specific investigative or analytical tasks within a specialist's scope; reads files, runs searches, produces structured findings | `gsd-phase-researcher`, `gsd-codebase-mapper`, `gsd-plan-checker` |

**The critical rule**: Orchestrators **never implement**. They route, delegate, verify, and track. When a coordinator catches itself editing source files, it stops immediately and delegates instead.

### How Domains Map to Agent Types

The system uses a **DelegationCategory** to route work:

```typescript
const VALID_DELEGATION_CATEGORIES = [
  "research",        // Investigation, pattern discovery
  "implementation",  // Code writing, refactoring
  "review",          // Verification, compliance checking
  "visual-engineering",
  "deep",            // High-complexity, low-time-pressure
  "quick",           // Low-complexity, high-time-pressure
] as const
```

Each category maps to a recommended agent type, model, and temperature profile. The `specialist-router.ts` resolves the effective agent based on the requested category and any explicit overrides.

### Real-World Analogy: A Research Team vs. a Solo Researcher

Consider preparing a comprehensive technical due diligence report on a 500,000-line codebase:

- **Solo researcher** (monolithic agent): Reads everything, forgets what mattered, produces a generic report, cannot recover from context overflow
- **Research team** (HiveMind team): Project manager (orchestrator) breaks the codebase into modules; specialist A investigates the auth layer; specialist B maps data flow; specialist C reviews security patterns; each files a bounded report; the manager synthesizes into one coherent document

The orchestrator never reads a single line of auth code. The researcher never writes a line of the report. The critic never proposes fixes—only verifies. Each role is strict by design.

---

## 2. The Agent Type Spectrum

### Orchestrator: Routing, Delegation, Gatekeeping

Orchestrators are the **front-facing coordinators** of HiveMind. Their responsibilities are:

1. **Receive** user intent and classify it into a delegation category
2. **Route** work to the correct specialist agent using the `delegate-task` tool
3. **Track** delegation state through the continuity system
4. **Verify** specialist output before reporting to the human
5. **Maintain** institutional memory via the session brain (`session-context-prompt.md`)

Orchestrators are explicitly **not allowed** to edit source files, write implementation code, or directly execute bash commands for file mutation. They use bash for inspection only (`git status`, `ls`, `git diff`).

**Example orchestrator**: `coordinator.md` operates with `mode: primary`, `temperature: 0.2`, and a permission matrix that explicitly denies `edit` and `write` globally while allowing read access to `*.md` and `*.json` files.

### Specialist: Deep Domain Expertise

Specialists are **terminal agents** that perform bounded work within their domain. They are spawned via the `delegate-task` tool with explicit permission profiles:

| Specialist | Tool Access | What They Do | Forbidden Tools |
|-----------|-------------|-------------|-----------------|
| `researcher` | read, glob, grep, webfetch | Exhaustive investigation, codebase archaeology, evidence collection | edit, write, bash, task |
| `builder` | read, glob, grep, edit, write, bash | Code implementation, precise atomic changes | task |
| `critic` | read, glob, grep, bash (tests) | Quality verification, compliance checking, test execution | edit, write, task |
| `general` | read, glob, grep | Read-only analysis | task |

The `researcher` agent (`researcher.md`) is particularly instructive: its operating principle is ** grounded evidence**—every claim must cite a file path and line number. It never recommends implementation approaches; it reports findings only.

The `critic` agent (`critic.md`) operates at `temperature: 0.05` (near-deterministic) and follows a strict 6-step review process: understand the contract → read the diff → verify acceptance criteria → correctness check → security check → performance check.

### How These Types Compose in Practice

A typical HiveMind workflow involves the orchestrator delegating a research task to a `researcher`, who spawns subagents (e.g., `gsd-codebase-mapper`) for focused investigation. The researcher's findings are then handed to a `builder` for implementation. The builder's changes are then routed to a `critic` for verification. Only after the critic's approval does the result flow back to the orchestrator for synthesis and reporting.

This pipeline is enforced by the **delegation chain**: each hop records its context in the continuity system, enabling recovery at any point.

---

## 3. The Skills Layer

### What a Skill Is

A skill in HiveMind is **compressed expert knowledge**—not a prompt template, not a set of instructions, but a structured bundle of operational knowledge that teaches an agent *how* to approach a class of tasks. Skills live in `.opencode/skills/<name>/SKILL.md` and optionally include:

- **References/** — Detailed operational documents (e.g., `token-budget.md`, `swarm-recovery.md`)
- **Scripts/** — Pure helper scripts that report facts and exit 0 (never governance blockers)
- **Evals/** — Trigger queries and evaluation datasets for quality assessment

### The Skill Ecosystem

The HiveMind ecosystem contains approximately **20 skills** organized in two layers:

**Layer 1 (Foundation)**: Skills that provide platform-level knowledge
- `opencode-platform-reference` — Platform internals, SDK, permissions, configs
- `opencode-non-interactive-shell` — CI-safe shell patterns, banned commands
- `harness-delegation-inspection` — GSD execution patterns, MCP server realities

**Layer 2 (Domain Execution)**: Skills that teach domain-specific investigation and synthesis
- `hf-context-absorb` — Multi-wave swarm protocol for building session brains
- `hm-detective` — Strategic codebase investigation with SKIM/SCAN/DEEP reading modes
- `hm-synthesis` — Cross-dependency analysis, compression tiers, artifact generation
- `hm-deep-research` — URL extraction, research patterns, multi-source synthesis
- `user-intent-interactive-loop` — Intent clarification through iterative questioning
- `planning-with-files` — Three-file external memory (task_plan.md, findings.md, progress.md)
- `coordinating-loop` — Wave-based parallel execution, delegation orchestration
- `phase-loop` — Phase guardrails, loop termination, revision cycles
- `agents-and-subagents-dev` — Agent definition authoring, permission profiles
- `command-dev` — Command creation with YAML frontmatter, non-interactive safety
- `custom-tools-dev` — Tool building with Zod schemas, hook patterns

**Layer 3 (Meta-Building)**: Skills for authoring other skills
- `meta-builder` — Teaches agents how to author, audit, evaluate, and doctor skills
- `skill-creator` / `skill-judge` / `use-authoring-skills` — The meta-builder chain

### Skill Composition

Skills compose through **loading precedence**: when an agent loads a skill, its instructions become part of the agent's operating context. A `gsd-planner` agent loading `planning-with-files` gains the three-file memory discipline; loading `hm-detective` gains SKIM/SCAN/DEEP reading mode discipline.

The **hf-context-absorb** skill is the most sophisticated example of composition: it loads `hm-detective` (for file reading), `hm-synthesis` (for compression), and `hm-deep-research` (for URL extraction) as prerequisites, then orchestrates a 4-wave parallel subagent swarm.

### Key Skills: Deep Dive

**hf-context-absorb** (`hf-context-absorb/SKILL.md`): A 4-wave swarm protocol for absorbing dense context into `.hivemind/state/session-context-prompt.md`. Waves:
- **Wave 0** (sequential): State load — reads existing file, computes delta vs new input
- **Wave 1** (parallel, 3 subagents): Outline formation — Parser categorizes elements, Matcher detects overlaps, Scanner reads disk files
- **Wave 2** (parallel, 2–3 subagents): Deep processing — URL extraction, narrative synthesis, cross-reference analysis
- **Wave 3** (conditional): Clarification — resolves ambiguities via AskUserQuestion (max 5 questions)
- **Wave 4** (sequential): Assemble & Append — YAML merge, XML assembly, append to session brain

The session brain grows through the `absorb_history` array in YAML frontmatter, tracking `dates_active`, `sessions_count`, `actors`, `domains`, and complexity scores.

**hm-detective** (`hm-detective/SKILL.md`): Strategic investigation with three reading modes:
- **SKIM** (~5% tokens): "What files exist?" / "What is this project?" — glob, ls, frontmatter-only, grep -c
- **SCAN** (~15% tokens): "Where is function X defined?" — grep -n, offset reads ±20 lines
- **DEEP** (100%): "How does this algorithm work?" — Read full file only after SKIM + SCAN confirm relevance

**hm-synthesis** (`hm-synthesis/SKILL.md`): Three compression tiers for codebase analysis:
- **Snapshot** (0% reduction): Full source — for security reviews, legal compliance
- **Focused** (~50% reduction): Tree-sitter signatures + key implementations — for dependency analysis, onboarding
- **Signature** (~70% reduction): Types/interfaces/exports only — for architecture planning, API contracts

---

## 4. The Command System

### Slash Commands as Entry Points

Commands in HiveMind are **reusable command bundles** with YAML frontmatter that define how they route to agents and skills. They live in `.opencode/command/` and are invoked via slash commands (e.g., `/gsd-plan-phase`, `/gsd-verify-work`).

A command file specifies:
- `description`: When to use this command
- `argument-hint`: Expected argument patterns
- `agent`: The agent type to invoke
- `tools`: Which tools the agent may use
- `<objective>`: The task definition
- `<execution_context>`: References to workflow files and supporting documents
- `<process>`: How to execute

### Commands as Composition Primitives

Commands compose the system because they bundle intent, routing, and execution context into a single reusable artifact. The same command can be invoked from different orchestrators with consistent results.

**Example**: `gsd-plan-phase.md` defines the plan-phase workflow:

```yaml
---
description: Create detailed phase plan (PLAN.md) with verification loop
argument-hint: "[phase] [--auto] [--research] [--skip-research] [--gaps] [--skip-verify] [--prd <file>] [--reviews] [--text]"
agent: gsd-planner
tools:
  read: true
  write: true
  bash: true
  glob: true
  grep: true
  task: true
  question: true
  webfetch: true
  mcp__context7__*: true
---
```

It references `@/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/get-shit-done/workflows/plan-phase.md` as its execution context, which is a 1,075-line workflow orchestrating research → plan → verify → revision loop.

### Key Commands

| Command | Agent | Purpose |
|---------|-------|---------|
| `/gsd-plan-phase` | gsd-planner | Create detailed phase plans with integrated research and verification loop |
| `/gsd-execute-phase` | gsd-executor | Execute phase plans with atomic commits, deviation handling, checkpoint protocols |
| `/gsd-verify-work` | gsd-verifier | Goal-backward verification: does codebase deliver what phase promised? |
| `/gsd-code-review` | gsd-code-reviewer | Structured code review producing REVIEW.md with severity-classified findings |
| `/gsd-new-project` | gsd-roadmapper | Initialize new projects with deep context gathering and PROJECT.md |
| `/gsd-audit-milestone` | — | Cross-phase audit of all outstanding UAT and verification items |
| `/gsd-discuss-phase` | — | Gather phase context through adaptive questioning before planning |
| `/gsd-autonomous` | — | Run all remaining phases autonomously: discuss → plan → execute per phase |

---

## 5. The Delegation Chain

### Step-by-Step: User → Orchestrator → Specialist → Subagent

The delegation chain is the **operational core** of HiveMind's team architecture. Every work item flows through this chain:

```
Human → Orchestrator (classifies intent, loads skills, delegates)
       → Specialist (executes bounded task, may spawn subagents)
           → Subagent (focused investigation or analysis, returns structured findings)
       ← Specialist (synthesizes subagent results, produces delegation artifact)
       ← Orchestrator (verifies output, tracks in continuity, reports to human)
```

The `delegate-task` tool (in `src/tools/delegate-task.ts`) is the mechanical implementation: it creates a **restricted child session** for the specialist with:
- Bounded permission rules (agent-type-specific `mustNot` tool lists)
- Explicit `DelegationCategory` and `SpecialistAgent` type
- Parent chain tracking for depth limit enforcement (max depth = 3)
- Continuity metadata for cross-session recovery

### Context Propagation: What Context Travels with Each Delegation

Context does **not** accumulate naively. Each delegation carries a structured **DelegationPacket**:

```typescript
type DelegationPacket = {
  id: string                    // Unique delegation ID
  spec: string                  // Task specification
  plan: string | null           // Plan file path (if exists)
  artifacts: string[]            // Output artifact paths
  commits: string[]              // Git commits made
  parentChain: readonly string[] // Parent delegation IDs
  status: DelegationPacketStatus // pending | running | completed | failed
  createdAt: number
  updatedAt: number
}
```

The `DelegationMeta` attached to each session tracks:

```typescript
type DelegationMeta = {
  rootID: string              // Root orchestrator session ID
  depth: number               // Distance from root (max 3)
  budgetUsed: number          // Tool call budget consumed
  agent: SpecialistAgent      // researcher | builder | critic | general
  category?: DelegationCategory
  model?: string
  queueKey: string            // Concurrency control key
  runtimePolicyOverride?: SessionPolicyOverride
}
```

### Return Path: Subagent → Specialist → Orchestrator → Human

Results flow back up the chain:
1. **Subagent** returns structured findings in a defined format (e.g., REVIEW.md, findings.md, VERIFICATION.md)
2. **Specialist** synthesizes subagent outputs, produces a delegation artifact, updates `DelegationPacket.status`
3. **Orchestrator** verifies the artifact against the original intent, records checkpoint in continuity, reports to human
4. **Continuity system** persists delegation state to `.opencode/state/opencode-harness/session-continuity.json`

### Checkpointing at Each Step

The `continuity.ts` module (635 LOC) implements **durable JSON persistence** with deep-clone-on-read to prevent mutation aliasing. Every delegation state transition is recorded:

```typescript
// State transitions: created → queued → dispatching → running → completed/failed
type SessionLifecyclePhase = 
  | "created" | "queued" | "dispatching" | "running" | "completed" | "failed"
```

The `CompletionDetector` class implements **two-signal completion detection**: session.idle + stability timer. This ensures tasks are truly complete before the parent is notified, avoiding false-success failures.

---

## 6. The Context Pipeline: How the Brain is Built

### The hf-context-absorb System

HiveMind's session intelligence accumulates through the **hf-context-absorb** skill—the system's mechanism for building and maintaining the **session brain** (`.hivemind/state/session-context-prompt.md`).

The session brain is not a simple conversation log. It is a **structured, versioned, YAML-frontmattered document** that grows through a disciplined multi-wave protocol.

### Wave 0: State Load and Delta Computation

The orchestrator (or any agent invoking `hf-context-absorb`) begins by reading the existing `session-context-prompt.md` and computing a **delta report**:
- Counts new vs. duplicate elements
- Categorizes input elements (URLs, file paths, actors, events, domains, narrative segments)
- Computes `existing_state` snapshot (dates_active, actors, domains, line_count)

If no existing file exists, a **clean slate flag** is set and the YAML structure is initialized.

### Wave 1: Content Parsing + Context Matching + File Scanning (Parallel, 3 Subagents)

Three subagents operate in parallel:
- **Content Parser**: Categorizes every input element (type classification: url/file_path/actor_name/event_date/domain_term/narrative_segment/unknown)
- **Context Matcher**: Detects overlaps with existing session brain content (similarity scoring, overlap type: identical/superset/subset/related)
- **Disk File Scanner**: Escalates from SKIM to SCAN to DEEP as needed, extracts entities, domain terms, relationships

Wave 1→2 gate: ≥80% of input elements must be categorized. If failed, retries (max 2).

### Wave 2: Deep Processing + Narrative Synthesis + Cross-Reference Analysis (Parallel, 2–3 Subagents)

- **URL Deep Extract**: Uses `tavily_extract` (batch 20), `context7` for library docs, `deepwiki_ask_question` for GitHub repos
- **Narrative Synthesis**: Weaves elements into coherent story arcs with actor motivations and temporal anchors
- **Cross-Reference Analysis**: Identifies shared entities across disk and URLs, conflicting claims, complementary information

Wave 2→3 gate: Every URL must be extracted or flagged failed. If >5 unresolved → Wave 3. Else skip to Wave 4.

### Wave 3: Clarification (Conditional)

If ambiguities remain after Wave 2, Wave 3 uses `AskUserQuestion` (max 5 questions) to resolve:
- Which interpretation of a claim is correct?
- What is the relationship between X and Y?
- Is Z still relevant given the new information?

### Wave 4: YAML Merge + XML Assembly + Append (Sequential)

Final assembly follows strict merge rules:

| Field | Operation |
|-------|-----------|
| `dates_active` | APPEND today if absent |
| `actors` | MERGE-APPEND (case-insensitive deduplication) |
| `domains` | APPEND if new |
| `sessions_count` | INCREMENT |
| `last_updated` | OVERWRITE with current timestamp |
| `complexity` | RECOMPUTE: `max(existing, new)`, cap at 10 |
| `absorb_history` | APPEND new entry |

Content appends as structured XML:

```xml
<absorb-session date="YYYY-MM-DD" wave_count="N">
  <sources>...</sources>
  <narrative>...</narrative>
  <entities>...</entities>
  <timeline>...</timeline>
  <insights>...</insights>
  <questions_open>...</questions_open>
</absorb-session>
```

### The Session Brain Fields

The session brain's YAML frontmatter tracks:

```yaml
version: 3.0
pipeline: prompt-enhance-repackaged
complexity_before: 8
complexity_after: 5
confidence: high
phases_completed: [skim, bridge, investigation, clarification]
sessions_count: 2
complexity: 9
actors:                    # All actors seen across sessions
domains: [runtime-harness, delegation-chain, ...]  # All domains touched
absorb_history:           # Every absorb event logged
```

---

## 7. The Session Export System

### What Session Exports Are

Session exports are **full session records** captured at key moments (phase completion, significant findings, session end) and stored as `*session*` or `*ses*` files in `.hivemind/research/`.

These are not conversation summaries—they are **complete chronological records** of what happened, including:
- All delegation packets created and their statuses
- All subagent findings and artifacts
- All checkpoint decisions and their rationale
- All context absorption events

### Why They're Lengthy

A session export might span 50+ pages because it records the **full reasoning trajectory**—not just what was decided, but what options were considered, what evidence was weighed, what failed and why. This makes them invaluable for:
- **Forensic analysis**: Understanding why a decision was made months later
- **Onboarding**: New team members reading the full context of past decisions
- **Audit**: Compliance reviewers tracing every decision to its evidence base

### How They Contribute to MEMS-BRAIN

The fifth pillar of HiveMind's philosophy is **Growing MEMS-BRAIN**—long-term intelligence collected by the HIVE (agent collective) and shared toward MIND (the human's strategic intelligence). Session exports are the **raw material** for this growth: crawled across worktrees, distilled through `hm-synthesis`, and incorporated into future session contexts.

---

## 8. Cross-Session Memory Architecture

### The Dual-Layer Model

HiveMind maintains two distinct memory systems:

| Layer | What It Stores | Where | Lifespan |
|-------|---------------|-------|----------|
| **Continuity** (state) | Delegation packets, session lifecycle, tool budgets, permission overrides | `.opencode/state/opencode-harness/session-continuity.json` | Session + resume |
| **Memory** (intelligence) | Session brain, actor registry, domain knowledge, artifact corpus | `.hivemind/state/session-context-prompt.md` + research files | Cross-session |

Continuity is about **resuming work**; memory is about **getting smarter**.

### The 5-Layer Memory Architecture

The architecture proposal defines a 5-tier memory hierarchy:

| Layer | Name | Content | Access |
|-------|------|---------|--------|
| **Hot** | Session brain | `session-context-prompt.md` (current session) | Always in context |
| **Warm** | Recent artifacts | Last 5 delegation artifacts | Loaded on demand |
| **Cold** | Historical sessions | `*session*` / `*ses*` exports | Crawled via hf-context-absorb |
| **Archive** | Long-term records | Phase summaries, milestone archives | Infrequently accessed |
| **Cloud** | External knowledge | Notion, GitHub, web research | Via MCP tools |

### The memoryScope Field

Delegation packets carry a `memoryScope` field that acts as the **hook point** for cross-session intelligence:

```typescript
// What's implemented in DelegationMeta:
type DelegationMeta = {
  // ...
  /** Per-session runtime-policy override from trusted continuity/delegation metadata. */
  runtimePolicyOverride?: SessionPolicyOverride
}
```

The `runtimePolicyOverride` is the current implementation of per-session memory hooks. The full `memoryScope` concept (which would allow delegations to declare which memory layers they need access to) is **planned but not fully implemented**.

### The Gap: "Persistence Without Intelligence"

A key insight from the session brain analysis: **persistence is not intelligence**. The system currently persists state very well (continuity.ts, 635 LOC) but has limited **query and retrieval** capability across sessions. The MEMS-BRAIN (Tier 5) is acknowledged as the gap to close—session exports exist but are not systematically incorporated into future sessions.

---

## 9. The Agent-Skill-Command Workflow Matrix

### Example 1: "Audit a Skill" Workflow

**Trigger**: `/hf-audit skill <skill-name>` or "audit my skill"

**Chain**:
1. User invokes command → routes to `meta-builder` orchestrator
2. `meta-builder` loads `skill-judge` and `use-authoring-skills`
3. `skill-judge` (subagent) evaluates the SKILL.md against 8 dimensions (120 points max):
   - Trigger accuracy, Instruction clarity, Reference coherence, Script safety, Naming consistency, Evals presence, Layer/role/pattern correctness, Documentation completeness
4. `use-authoring-skills` (subagent) checks for overlaps with existing skills
5. Results synthesized into `SKILL-AUDIT.md` with per-dimension scores
6. Orchestrator presents findings: MET (≥80%) or NOT MET with specific gaps

**Agents used**: `meta-synthesis-agent`, `use-authoring-skills`  
**Skills used**: `skill-judge`, `use-authoring-skills`, `hm-detective` (for reading files)  
**Artifacts produced**: `SKILL-AUDIT.md`

### Example 2: "Deep Research" Workflow

**Trigger**: `/gsd-deep-research` or "research this thoroughly"

**Chain**:
1. Orchestrator (`coordinator`) receives intent, classifies as `research`
2. Delegates to `researcher` specialist with `DelegationCategory: research`
3. Researcher loads `hm-detective` (reading modes), `hm-deep-research` (URL extraction), `hm-synthesis` (compression)
4. Researcher spawns 3 parallel subagents:
   - `gsd-codebase-mapper`: Maps codebase structure via SKIM→SCAN→DEEP
   - `gsd-phase-researcher`: Investigates technical approaches for the research question
   - `hm-deep-research` URL subagent: Extracts from relevant web sources
5. Each subagent returns structured findings
6. Researcher synthesizes: narrative, entities, timeline, open questions
7. Orchestrator verifies completeness, updates session brain via `hf-context-absorb`

**Agents used**: `coordinator`, `researcher`, `gsd-codebase-mapper`, `gsd-phase-researcher`  
**Skills used**: `hm-detective`, `hm-deep-research`, `hm-synthesis`, `hf-context-absorb`  
**Artifacts produced**: `RESEARCH.md`, `session-context-prompt.md` (updated)

### Example 3: "Absorb New Context" Workflow

**Trigger**: User pastes a large dump of URLs, files, narrative text

**Chain**:
1. Coordinator receives dense input, recognizes `hf-context-absorb` trigger
2. Loads `hf-context-absorb` skill + `hm-detective` + `hm-synthesis` + `hm-deep-research`
3. **Wave 0**: Reads `session-context-prompt.md`, computes delta
4. **Wave 1** (parallel, 3 subagents): Parse content, match overlaps, scan disk
5. **Wave 2** (parallel, 3 subagents): Extract URLs, synthesize narrative, cross-reference
6. **Wave 3** (conditional): AskUserQuestion for unresolved ambiguities (max 5)
7. **Wave 4**: YAML merge + XML append to session brain
8. Orchestrator confirms append with line count delta verification

**Agents used**: `coordinator` (orchestrator only), 6 subagents across waves  
**Skills used**: `hf-context-absorb`, `hm-detective`, `hm-synthesis`, `hm-deep-research`  
**Artifacts produced**: Updated `session-context-prompt.md` with new `<absorb-session>` block

---

## 10. Quality Assurance in Multi-Agent Systems

### The Critic Agent Role

The `critic` agent (`critic.md`) is the **last line of defense** before code reaches the user. It operates at `temperature: 0.05` (near-deterministic) and follows a strict review contract:

**The 6-step process**:
1. **Understand the contract** — Read original task requirements or acceptance criteria; identify every explicit and implicit requirement
2. **Read the diff** — Run `git diff` or `git diff --staged`; read every changed file in full, not just the diff
3. **Acceptance criteria verification** — Check each criterion against actual code; mark MET or NOT MET with file:line evidence
4. **Correctness check** — Logic errors, type mismatches, edge cases (empty/null/concurrent/large inputs)
5. **Security check** — Injection vulnerabilities, auth bypasses, secret exposure, unsafe defaults
6. **Performance check** — Algorithmic complexity, N+1 queries, unnecessary iterations

### Verification Gates

HiveMind enforces **verification gates** at every handoff:

| Gate | What It Checks | Who Runs It |
|------|----------------|-------------|
| Post-research | Findings are grounded with file:line citations | Researcher (self-check) |
| Pre-build | Plan meets acceptance criteria, no YAGNI | Planner (gsd-plan-checker) |
| Post-build | Changes match plan spec | Builder (self-check) |
| Pre-commit | Critic review passes (no CRITICAL findings) | Critic |
| Post-phase | Phase goal achieved (goal-backward from PLAN.md) | gsd-verifier |

The orchestrator **never lets unverified work pass**. If verification fails, the work loops back to the responsible agent with specific feedback.

### "Evidence Before Assertions" in Practice

HiveMind's most important quality rule: **never claim work is complete without running verification and showing output**. This is enforced through:

- **Verification commands**: `npm test`, `npm run typecheck`, `npm run coverage`
- **Evidence collection**: File:line citations, git diffs, test output logs
- **Structured artifacts**: REVIEW.md, VERIFICATION.md with per-criterion MET/NOT MET status

---

## 11. Open Questions

### Skill Gaps

The system acknowledges missing skills that would extend its capabilities:

| Gap | Impact | Priority |
|-----|--------|----------|
| **TDD skill** | No systematic test-driven development workflow | High |
| **Spec-driven skill** | No formal spec-to-implementation verification | High |
| **Planning skill** | `planning-with-files` exists but lacks full strategic decomposition | Medium |
| **Quality-playbook** | No automated spec-traced functional test generation | Medium |

### The LOC Budget Question

The architecture proposal targets **~4,000–5,000 LOC** total for the Hard Harness, but the current `src/` measures approximately **~8,100 LOC** across 52 TypeScript files. Three orphan modules exist on disk (`governance-engine.ts`, `specialist-router.ts`, `injection-engine.ts`) that are absent from the architecture proposal.

**Resolution needed**: Either the LOC target needs upward revision, or significant cleanup and module consolidation is required to meet the original specification.

### Worktree Consolidation Strategy

Seven worktrees currently contain different evolution stages of the project:
- `harness-experiment` — Clean prototype (current focus)
- `product-detox` — Anti-pattern reference (15,000 LOC, to be abandoned)
- `hivefiver-packs`, `hivefiver-v2` — Appear to be duplicates
- `session-journal-minimal` — Built version with `dist/`
- `harness-mainline`, `main-wip` — Other evolution stages

**The merge/consolidation plan is undefined.** The architecture proposal references "selective migration from product-detox" but the broader consolidation strategy requires a formal decision.

### MEMS-BRAIN Implementation Roadmap

The fifth pillar (Growing MEMS-BRAIN) is **philosophically defined but operationally incomplete**:

- Session exports (`*session*` / `*ses*` files) exist as raw records
- `hf-context-absorb` can incorporate historical context via Waves 1–4
- But there is **no systematic crawling** of historical sessions into future session contexts
- The `memoryScope` hook point in delegation packets is planned but not implemented

**What is needed**: A Tier 5 implementation that:
1. Crawls session exports across worktrees on a schedule
2. Classifies and compresses via `hm-synthesis` FOCUSED tier
3. Maintains a warm memory layer of recent artifacts
4. Allows delegations to declare `memoryScope` requirements
5. Uses the session brain's `absorb_history` to track intelligence growth

---

## Appendix: Key Source Files Reference

| File | Purpose |
|------|---------|
| `src/plugin.ts` (57 LOC) | Composition root — wires tools + hooks, zero business logic |
| `src/tools/delegate-task.ts` | The delegation tool factory with agent permission profiles |
| `src/lib/continuity.ts` (~635 LOC) | Durable JSON persistence, deep-clone, session state |
| `src/lib/lifecycle-manager.ts` (~500 LOC) | Session lifecycle state machine: create→queue→dispatch→run→complete/error |
| `src/lib/session-api.ts` | Typed OpenCode SDK wrappers: createSession, getSession, abortSession, sendPrompt |
| `src/lib/types.ts` | Shared types: VALID_AGENTS, DelegationPacket, TaskStatus, SessionLifecyclePhase |
| `src/lib/task-status.ts` | 7-state task type system with transition guards |
| `src/lib/completion-detector.ts` | Two-signal completion: session.idle + stability timer |
| `src/lib/concurrency.ts` | Keyed semaphore (FIFO queue per model+agent+category) |
| `src/lib/state.ts` | In-memory Maps: sessionStats, rootBudgets, sessionDelegationMeta |
| `.opencode/skills/hf-context-absorb/SKILL.md` | 4-wave session brain building protocol |
| `.opencode/skills/hm-detective/SKILL.md` | SKIM/SCAN/DEEP reading modes for investigation |
| `.opencode/skills/hm-synthesis/SKILL.md` | Snapshot/Focused/Signature compression tiers |
| `.hivemind/state/session-context-prompt.md` | The living session brain (754 lines) |
| `.opencode/agents/coordinator.md` | Primary orchestrator with universal-rules permission matrix |
| `.opencode/agents/researcher.md` | Terminal investigator — grounded evidence, no implementation |
| `.opencode/agents/critic.md` | Ruthless verifier — 6-step review process, near-deterministic |
| `.opencode/command/gsd-plan-phase.md` | Phase planning command (1,075-line workflow reference) |

---

*Document 3 of 3 — HiveMind Ecosystem Documentation Set*  
*Produced: 2026-04-10*
