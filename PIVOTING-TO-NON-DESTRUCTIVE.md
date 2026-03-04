## Objective (Meta-Builder “Healer” Refactor)

Refactor and harden the **`hivefiver`** module into a reliable “healer” for the project lineage team—i.e., a **meta-builder orchestrator** that can diagnose, refactor, debug, validate, and evolve the framework **without poisoning runtime context**—while also functioning as a self-consistent dev-kit engine/meta-framework for its own operation.

This work must prioritize **correct boundaries**, **deterministic behavior**, and **context-rot / context-pollution defense** across agent chains, tools, plugins, hooks, and scripts.

---

## Project Context (Authoritative History You Must Respect)

- Phases 1–5 are complete (investigation + architecture + artifact review completed previously).
- Use these documents as authoritative inputs (treat them as SOT for current architecture + entity relationships + exploration findings):
    - `docs/plans/SPEC-COMPACT-SUPERIORITY-ARCHITECTURE-2026-03-03.md`
    - `docs/plans/ENTITY-RELATIONAL-MAP-2026-03-03.md`
    - `docs/plans/EXPLORE1-ARCH-STRUCTURE-2026-03-03.md`
- Additional consolidation tasks already exist (phase tracking + master synthesis):
    - Subtask P6: Strategic Landscape Phasing
    - Subtask P7: Phase Tracking and Status Documentation
    - Subtask P8: Final Compact Superiority Design Package (Master Synthesis)
- **Terminology correction requirement (hard rule):**
    - **OpenCode terminology is canonical** in project-facing artifacts.
    - Any “Kilocode mode names” (if they appear) are **internal-only delegation mechanics** and must not leak into project docs/config/schema naming.

---

## Core Entities & Modules (Must Be Kept Distinct)

### `hivefiver` (IN SCOPE NOW)

A meta-builder module that includes an orchestrator and a team of agents/subagents:

- `hivemaker` (builder/implementer)
- `hiveplanner` (planner)
- `hivexplorer` (codebase investigator)
- `hiverd` (R&D → knowledge synthesis)
- `hivehealer` (refactor/fix/debug)
- `hiveq` (quality gatekeeper/governor)
- `hitea` (tests conductor)

`hivefiver` must maximize advanced usage of OpenCode concepts: chaining, stacking, plugins, custom tools, progressive/atomic planning, and “smart-on-runtime domain-specific valid context engineering”—with explicit defenses against context drift/pollution.

### `hiveminder` (OUT OF SCOPE FOR IMPLEMENTATION NOW; IN SCOPE FOR COMPATIBILITY)

A project-based orchestrator to be used later to build user projects (including this project once healed). It is **not active right now**, but the **agent profiles and downstream subagents are shared** between `hivefiver` and `hiveminder`, so refactors must keep future compatibility in mind.

---

## Hard Constraints (Non-Negotiable)

1. **Work inside `.opencode/` only for now.**
    
    Treat `.opencode/` as an isolated, decoupled module designed to defend against context poisoning.
    
    Only after it works holistically should anything be “shipped over” elsewhere.
    
2. **Do not drift into OpenCode SDK/server-side refactors.**
    
    `hivefiver` must focus on advanced OpenCode meta concepts + plugins/custom tools, and must not entangle itself with SDK/server internals.
    
3. Avoid “surface-level refactors.”
    
    The real culprits are often **auto/deterministic directive emitters**:
    
    - hooks
    - scripts / bash one-shots
    - hidden entrypoints
    - CLI/dist entry paths that inject context or trigger workflows
    - tool/plugin permission mechanisms
    - governance “enforcers” that silently steer chains
4. Expect that **some phases require platform restarts** to take effect. Continuing without restart can create false test outcomes and poisoned state.
5. Use **git-atomic** approaches not only for code, but also for context-engineering artifacts. Keep commits small, reversible, and evidence-based.

---

## Key Problem Statement (What’s Currently Failing)

The system is suffering from:

- Intertwined, unregulated domains and ambiguous hierarchies/relationships
- Overlapping/conflicting hooks and injections that steer agent behavior
- Run-time pruning leading to coordinator drift off-role
- Planning artifacts/workflows/synthesis artifacts colliding under `.hivemind/`
- Deterministic scripts + metrics/governance counters that generate noise, zombie logic, and misleading signals → causing hallucinations and regression

You must assume “context poisoning” is real, systemic, and often introduced by tools that **appear** to be governance/quality but actually emit false directives.

---

## Focus Areas (Where to Look First)

### A) Runtime Entries & Session Types (Must Be Modeled Explicitly)

Different “entries” into runtime chains must be distinguished and supported:

- user-facing main sessions vs delegated sub-sessions
- new sessions vs post-compaction sessions
- long-haul multi-stop sessions requiring progressive disclosure and revalidation loops

### B) Profile Refactor Scope

Refactor agent profiles consistently across:

- project configuration JSON
- `.md` profiles (YAML header + body)
Ensure the same agent identity/behavior remains coherent across `hivefiver` and future `hiveminder`.

### C) The True Context-Poisoning Hotspots

Investigate and isolate:

- `.opencode/plugins/`
- `.opencode/tools/`
- any entrypoints that route into `src/`
- `dist/`, `cli/`, `script/` (and any subfolders)
These often contain the worst injection/hook/script behavior.

### D) `.hivemind/` Artifacts Must Be Partitioned

Traversal, node-targeting, pivoting, and hierarchical planning require **separate, non-colliding paths** for:

- planning artifacts
- workflow definitions
- synthesis artifacts
- state/schema SOT and state-control data

### E) Metrics / Governance Schema That Produces Noise

Treat the existing metrics/governance counters/state logs as suspect until proven useful. Examples of suspicious fields include (not limited to):

- drift/health scores that contradict reality
- “evidence_pressure”, “ignored”, “acknowledged: false” style counters
- tool call counts that look “perfect” while outcomes degrade
You must propose a schema that is measurable, falsifiable, and does not itself become a hallucination amplifier.

---

## Required Methodology (How You Must Operate)

Use a **strategic hierarchical planning** model with “progressive disclosure design patterns”:

1. **Zoom-out framing:** outline the landscape, isolate noisy regions, define hypotheses.
2. **Targeted investigation:** traverse node-by-node (graph mindset), prioritize directive emitters.
3. **Iterative synthesis:** ingest → contrast → compare → document rationales.
4. **Decision points:** pivot/traverse/branch with explicit justification and rollback plan.
5. **Atomic implementation:** small changes, validated immediately (tests + gates).
6. **Gatekeeping:** quality validation must be deterministic and non-overlapping.
7. **Restart-aware execution:** explicitly mark steps that require restart before validation.
8. **Return-point marking:** explicitly mark known gaps that must be revisited later.

---

## What You Must Produce (Deliverables)

### 1) “Healer Refactor Blueprint” (Primary Output)

A structured blueprint that defines:

- responsibilities and boundaries: `hivefiver` vs `hiveminder`
- runtime entry types and how context is injected/guarded per type
- directory + artifact partitioning rules for `.opencode/` and `.hivemind/`
- the agent/subagent contract and profile schema (JSON + MD/YAML consistency)
- tooling/plugins/hooks policy (what is allowed to inject context, when, and how)

### 2) “Directive Emitter Audit Plan”

A prioritized audit checklist that specifically targets:

- hooks/scripts/CLI/dist entrypoints
- hidden context injection points
- overlapping triggers and permission mismatches
- deterministic mechanisms that can silently steer chains

Include:

- how to detect each emitter (signals + files to inspect)
- how to neutralize or sandbox it
- how to verify it no longer poisons context

### 3) “Metrics & Governance Detox Proposal”

- Identify which metrics/counters are misleading/zombie logic.
- Propose a smaller, falsifiable, operator-friendly metrics set.
- Define how metrics are computed, when reset, and what actions they trigger (if any).
- Ensure metrics cannot become a self-fulfilling hallucination driver.

### 4) “Atomic Execution Plan”

A git-atomic sequence of implementation steps:

- each step includes intent, touched areas, restart requirement, and validation method
- no overlapping triggers
- rollback-safe

---

## Output Format Requirements

- Use clear headings and numbered lists.
- Be precise and implementation-oriented (avoid vague governance language).
- Explicitly call out:
    - assumptions
    - risks
    - restart-required steps
    - return points / known gaps
- Keep OpenCode terms canonical in all project-facing naming.

---

# 

# The non destructive approaches   - hivefiver module

- The non-destructive advanced approach to OPENCODE’s utilization innate meta concepts : /Users/apple/hivemind-plugin/docs/OPENCODE-ADVANCED-NON-DESTRUCTIVE-META-BUILD.md
- Understand of SKILL anatomy → loading this skill-creator skill npx skills add https://github.com/vercel-labs/agent-browser --skill skill-creator → learn about `freedom to entry` + `the 3 patterns` + the anatomy
- understand the how to write a skill in meticulous approach →  npx skills add https://github.com/anthropics/skills --skill skill-creator sharing the same name of above but different
- understand and validate skill or other concept → npx skills add https://github.com/softaworks/agent-toolkit --skill skill-judge `skill-judge`
- understand the `find-skill` skill is to look up both in-store and online skill of specific

## General knowledge that must all-the-time embrace

- The 2 linage - hivefiver = meta builder module ; hiveminder = project module → the both agents are orchestrator front-facing agents
- Context-engineering through The schematic approach + smart-context-on-demand + progressive-disclosure patterns → requiring strict relationships, highly hierarchical in structured output **WHILE STILL MAINTAINING** readability and semantic knowledge - requiring consistent, deterministic and programatic approach and conventions in naming and format in all of these entities:
    - hierarchical pathing
    - naming id and prefixes conventions - of documents and artifacts
    - the content formats hierarchy and styling
- Success rate and autonomy of agents workflows through spec-driven + test-drive → requiring strict, non-gap - measurable requirements validating and various gatekeeping and incremental verification through check points (simply put everything into surfacing clearly (for example help with brainstorming and ideating) → investigation/discussion (checking the the contracts to codebase for example) → research → synthesis → validation/gatekeeping works → iterative loops → pass → incremental integration and gatekeeping → sign-off or pivot, routing, traversal → though simplify as so the granularity approach by  breakdown  master → phase-based → sub → atomic involve other inside workfows and tasks to  which means these must be way to approach and improve the accuracy through programatic methods and practices:
    - delegation workflows of hand-offs
    - agents participate in such workflows articulate through the 2-level hierarchy
    
    → of which no matter which point or turn the precision of which agents must do what following what-step are essential
    

## Strategy to approach:

Generally we use `skills` to handle improvement of skills through audit activities → archiving the noise, while expanding the network and connection toward `agents` and drill down to path-specific granularity of  workflow

1. Assessing Workflow vs. Session entry → Next stop possible rot and prune in context  || working out the efforts vs. risk vs. coverage horizontally → we will handle the `skills` vs. `agents` first - while opportunistically handle the `commands` if we see fit (those that are not highly connected with yaml schema nor body with instruction scripts of less than 3
- commands are user initiated → but once strike automatically they are the 100% shot initiator and chain starter - check if bashing with script or automation through delegation work?
1. Audit  the broad to isolate entry → documenting the entry → put under .archive of both root and .opencode → turn of the emit false test of synchronization 
    1. notice - skills of expertise of very narrow freedom → need more careful assessments
2. approach the `hivefiver` specific skill → the freedom at load make only 1  → adjusting both header and body content  currently I place it under this name `.opencode/agents/hivefiver-reserved.md` and the current-using one is custom-made for your using in this highly polluted environment → one the entry is tightly developed
3. broaden to each then all other agents 

## Think  on end users use cases + edge cases → and then propose your approach

1. at any entry point session, regardless of workflow - it must know it is meta builder and that it has ready-to-dive-in what Opencode conept or combinations of them
2. though coordinator there are 2 linage of hiveminder vs hivefiver
3. the agents and subagents are shared between the 2 linage → the pathing and state control files are at different locations are the obvious
4. the workflows require monitor of handoff work and activate validation channel differently
5. for example though spec-drive planning but this is a phase-planning and of the meta builder is different than that of the project (which can be building a landing page project)
6. then for phase-planning the after validating there are handoff from knowledge synthesis output to indicated folders -> hiveminder delegate `hiveplanner` -> when `hiveplanner` return which what so called valid `phase-planning`  → the `hiveminder` does not need to know or understand about the format → the skill makes it delegate next to `hiveq` - and the validation workflow of such must b e fully awared and known from hiveq to an extend that it will not validate phase-planning as sub or atomic planning - and since the atomic plannings are incremental approaches - if being delegated for verification, it must follow the constituion of `incremental integration gatekeeping`