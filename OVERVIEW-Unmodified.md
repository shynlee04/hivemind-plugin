The Hivemind framework is designed to integrate everything necessary for agentic coding and the harness of context, tools, Opencode plugins and SDK, deterministic approaches, and specialist factors through the engines and libraries of other dependencies, enabling agents to use features that are not built into any single platform. At the MVP stage we implement the concepts in Opencode, then identify footprints for other platforms such as Claude Code, Codex of OpenAI, Cursor, Kilocode, Antigravity, Gemini, etc. To avoid simplistic classifications we split the approach into three tiers and map the concepts to each group.


## 3.0 Core Concepts

### 3.1 Concept A: Granularity Atoms

All task types are mapped to atomic units with enforced constraints:

| Rule | Limit |
|------|-------|
| Code LOC per file | ≤300 |
| Interface fields | ≤10 |
| Function complexity | Chain-breaking |

**Principles:**
- No god components, no god functions, no dead code, no zombies
- Minimal regression surface through chain-breaking design
- CRUD operations map to atomic create/read/update/delete units

### 3.2 Concept B: 2-End-Extreme Metrics

Gate criteria for Granularity Atoms — two extremes that bound acceptable behavior:

**Programmatic/E2E Testable:**
- Every metric has an automated verification mechanism
- No metric relies solely on human judgment

**Scale-Measurable:**
- Metrics can be quantified numerically
- Progression is trackable over time

**Scope-Aware:**
- Metrics respect bounded context
- Cross-boundary metrics require explicit mapping

**Responsibility-Centric:**
- Each agent owns specific metrics
- Metrics map to agent hierarchy roles

**Integration-Aware:**
- Metrics account for dependency chains
- Sequential blocking is measured

**Anti-Pattern Excluded:**
- Baseline passing of unrelated unit tests does NOT satisfy any metric

### 3.3 Concept C: Ecosystem

The complete HiveMind runtime environment:

```
Graph (dependency tracking)
  + Trajectory (execution ledger)
  + Tools (7 hivemind_* tools)
  + Engines (event-tracker, agent-work-contract, session-journal)
  + .hivemind/*.*/ (runtime state)
```

### 3.4 Concept D: Strategic Lens

**Conceptual framework for viewing A+B+C at scale.**

- NOT buildable — this is an abstract overlay for human review
- Provides strategic view of the entire ecosystem
- Human verification only — cannot be automated

### 3.5 Concept E: Harness

Agents + Tools + Workflows resolving ALL entry points:

**Entry Kernel:**
- `runtime-attachment.json` — active runtime configuration
- `entry-kernel-state.json` — kernel state at session start

**Agents:** 13+ specialist agents with defined roles
**Tools:** 7 hivemind_* tools + SDK tools
**Workflows:** Executable patterns resolving entry to exit

### 3.6 Cross-Concept Dependencies

```
A → B (Granularity enables Metrics)
B → A (Metrics gate Granularity)
A + B → C (Atomic units with metrics form Ecosystem)
A + B + C → D (Ecosystem viewed through Strategic Lens)
A + B + C + D → E (Complete system wrapped in Harness)
```

---

## 4.0 Tier Architecture

### 4.1 Tier 1: Hard Harness (Non-Negotiable)

Core SDK dependencies that cannot be replaced:

| Component | Version/Location | Purpose |
|-----------|------------------|---------|
| @opencode-ai/plugin | >=1.1.0 | Plugin SDK |
| @opencode-ai/sdk | Current | Client/server interfaces |
| Trajectory Ledger | src/core/trajectory/ | Execution state |
| Workflow Authority | src/core/workflow-management/ | Task lifecycle |
| Schema Kernel | src/schema-kernel/ | Contract authority |

### 4.2 Tier 2: OpenCode-Dependable

Built on OpenCode SDK patterns:

| Component | Count | Status |
|-----------|-------|--------|
| HiveMindPlugin | 1 | Active |
| Plugin Hooks | 16 | Active |
| Command Bundles | 10 | Active |
| Tools | 9+ | Active |
| Agents | 13+ | Active |

### 4.3 Tier 3: Skills

Extensible capability packages:

| Component | Count | Status |
|-----------|-------|--------|
| Skill Packages | 19+ | Active |
| Registry | registry-internal.yaml | Active |

**[GAP]:** `npx skills add` NOT implemented — skill installation requires manual configuration

### 4.4 Tier Boundaries

Dependency direction enforced:
- Tier 1 cannot depend on Tier 2 or Tier 3
- Tier 2 can depend on Tier 1 only
- Tier 3 can depend on Tier 1 and Tier 2

---

## 5.0 Agent Hierarchy

### 5.1 Orchestrator Layer

**hiveminder:**
- Coordinates all work
- Delegates to specialists
- Never implements directly
- Owns workflow authority

### 5.2 Governance Layer

**hiveq:**
- Verification specialist
- PASS/FAIL verdicts
- Validates implementations against specs

**code-skeptic:**
- Challenge assumptions
- Detect anti-patterns
- Question claims without evidence

### 5.3 Specialist Layer

| Agent | Role |
|-------|------|
| architect | System design and architecture decisions |
| hiveplanner | Planning and requirement distillation |
| hivemaker | Implementation execution |
| hivehealer | Debug and repair |
| hivexplorer | Codebase investigation |
| explore | General exploration |
| explore-small | Targeted investigation |
| hiverd | Research synthesis |
| hitea | Tea-time闲聊 agent |
| hivefiver | Vibe coding specialist |
| general | General purpose |

### 5.4 Delegation Rules & Interface Contracts

Every delegation carries:
- Explicit scope
- Constraints
- Return contract
- Return gate

Sequential by default. Parallel only when slices are isolated and merge-safe.

# SKILLS and The Hivemind 3-Tier Set Up
---

## Tier 1

The “Hard Harness”, requires a setup that matches the full complexity of Hivemind‑only. It involves installing additional npm packages, employing deterministic and programmatic methods, and meeting the requirements of the OpenCode SDK. 

## Tier 2

The “Opencode‑Dependable” setup, includes tools, plugins, hooks, commands, agents, sub‑agents, rules, prompts, workflows, permissions, shell commands, and other elements that work only under Opencode. Although they share naming conventions with other agentic coding platforms, they are configured and chained in a way that optimizes autonomous, multi‑role agent workflows.

## Tier 3 

The “SKILLS” tier, is a flexible, fail‑safe harness that enhances but does not disrupt or pollute the system; it provides depth, breadth, and coverage for diverse use cases and projects across multiple development industries in any context.

In developing skills, each must satisfy a set of absolute criteria that must pass a 100 % vertical and horizontal assessment and survive all stress‑tests and real‑life failure patterns. These characteristics are:

Framework and platform agnostic: terminology must be usable with Hivemind, strictly regulated to the entities, workflows, agents, sub‑agents, and task orientations; it must provide fallbacks and reference paths to other frameworks such as GSD, Spec‑kit, BMAD, Superpower, Oh‑my‑openagents, Open‑spec, and to platforms like Claude Code, Codex, Cursor, Kilocode, Antigravity, Gemini, etc.  
Hierarchy, domain‑specificity, intelligence, gatekeeping, delegation, and context integrity must be governed by strict rules: a parent must exist for a child to act, a chain cannot proceed until all dependencies are satisfied, and deterministic smart‑workflow routing is enforced. Front‑facing agents must know they are human‑facing, blind, the brain, and the highest hierarchy, and they must maintain an overview of progress, dependencies, contracts, and skill declarations. They must govern context, retrieve git commit information, understand git worktree and branch structures, and delegate sub‑agents to commit work in atomic batches with classification formats for retrieval. They must coordinate sequential, parallel, or batched tasks, set clear constraints and success metrics, and avoid hallucination or chain‑breaking behaviors.  

Skills must respect the unity and consistency of the framework: assets and references must be meticulously written, templates must provide detailed guidance without confusion, and the writing style must be human‑like with progressive disclosure.  
