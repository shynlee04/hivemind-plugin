# Hivemind Skills Refactor Playbook

**Version:** 1.0
**Date:** 2026-04-23
**Audience:** Hivefiver orchestrators, skill-authors, agent-builders, and any Devin/OpenCode session operating on the `feature/harness-implementation` (or equivalent) worktree
**Purpose:** Canonical reference for the upcoming skill-improvement and refactoring cycle. Synthesises the Hivemind philosophy (`docs/draft/HIVEMIND-*`), the OpenCode meta-concepts stack, the 3-level-depth coordination model, the validated-only constitution, and the existing skills-audit research artifacts into one actionable playbook.
**Scope:** Skills, agents, commands, rules, permissions, tools, hooks, plugins, MCP servers, LSP, GitHub, and the Hivefiver lab → `.opencode/` → TS-runtime shipping pipeline.

---

## How to Read This Playbook

- **Part I — Constitution** is non-negotiable. Read before any write-side action.
- **Part II — Philosophy** is the *why*. Skim on first load; re-read before architectural decisions.
- **Part III — 3-level-depth coordination** is the *who*. Load whenever you delegate.
- **Part IV — OpenCode meta-concepts** is the *what*. Load when composing skills/agents/commands.
- **Part V — Skills Pipeline** is the *how*. Load for every skill write/audit.
- **Part VI — Refactor plan** is the *when*. Drives phase selection.
- **Part VII — Tool usage** is the *with what*. Drives `skill-creator` / `skill-judge` / `skill-writing` invocations.
- **Part VIII — Iron laws** is the *must-not*. Load on every subagent dispatch.

Every statement in this playbook is cross-referenced with an evidence file path inside `/home/ubuntu/repos/hivemind-plugin/` (or the user's equivalent worktree). If a statement is not grounded, it is marked `⚠️ synthesised`.

---

# PART I — THE NON-NEGOTIABLE CONSTITUTION

## I.1 Validated-Skills Constitution (MUST)

> **Do NOT assume the end-user has referenced, loaded, or installed any skill unless that skill is physically present in `.hivefiver-meta-builder/skills-lab/active/refactoring/`.**

- Source of truth for *in-flight* skills: `.hivefiver-meta-builder/skills-lab/active/refactoring/` (symlinked into `.opencode/skills/`).
- Source of truth for *global* skill tooling: `~/.agents/skills/skill-creator/` and `~/.agents/skills/skill-judge/` — referenced by `hivefiver-skill-author.md` via the `permission.skill` allow-list and **must be probed at runtime**, never assumed live.
- Source of truth for *retired* skills: `.hivefiver-meta-builder/skills-lab/retired/` — **never load these for runtime work**; they exist only as historical context.

### I.1.1 Runtime probe before any skill reference

Before any agent or orchestrator invokes, stacks, or references a skill by name, it must execute:

```bash
ls .hivefiver-meta-builder/skills-lab/active/refactoring/<skill-name>/SKILL.md 2>/dev/null \
  || echo "FAIL: skill not validated in refactoring lab — do not invoke"
```

If the probe fails, the agent must **either** (a) route the user request to `hivefiver-skill-author` via the meta-builder routing table to create/adopt the skill, **or** (b) decline the stack and report the gap. Silent fall-through to a sibling skill is forbidden.

### I.1.2 The 20-skill validated inventory (as of 2026-04-09 audit)

The following skills are present in `.hivefiver-meta-builder/skills-lab/active/refactoring/` (and therefore symlinked into `.opencode/skills/`) on the `feature/harness-implementation` branch. Anything outside this list is **not** considered referenceable by end-users:

| # | Skill | Layer | Audit Grade | Target Grade |
|---|-------|-------|-------------|--------------|
| 1 | `meta-builder` | 0 — router | B+ | A- |
| 2 | `use-authoring-skills` | 4 — domain-execution | B | A |
| 3 | `agents-and-subagents-dev` | 2 | D | B |
| 4 | `command-dev` | 2 | D (PASS) | B |
| 5 | `custom-tools-dev` | 2 | D (PASS) | B |
| 6 | `coordinating-loop` | 1 | A | A |
| 7 | `phase-loop` | 2 | D | B |
| 8 | `planning-with-files` | 1 | PASS | A |
| 9 | `user-intent-interactive-loop` | 1 | A | A |
| 10 | `opencode-platform-reference` | 3 — reference | C+ | B |
| 11 | `opencode-non-interactive-shell` | 2 | C (PASS / gold) | A |
| 12 | `oh-my-openagent-reference` | 3 | D | B |
| 13 | `hm-deep-research` | 2 | C+ (gold) | A |
| 14 | `hm-detective` | 2 | — | B |
| 15 | `hm-synthesis` | 2 | — | B |
| 16 | `hf-context-absorb` | 1 | — | B |
| 17 | `harness-audit` | 2 | — | B *(rename → `opencode-project-audit`)* |
| 18 | `harness-delegation-inspection` | 2 | — | *(split → `subagent-delegation-patterns` + `opencode-project-inspection`)* |
| 19 | `agent-authorization` | 2 | — | B *(rename → `delegation-gates`)* |
| 20 | `gsd-agent-composition` | 2 | — | B |
| 21 | `command-parser` | 2 | C (PASS) | A |
| 22 | `agents-md-sync` | 2 | — | — |
| 23 | `session-context-manager` | — | FAIL | *(merge → `planning-with-files`)* |

Source: `.hivemind/research/skills-audit/planning/target-architecture-2026-04-09.md`, `.hivemind/research/skills-audit/planning/master-revamp-plan-2026-04-09.md`.

> ⚠️ **Runtime verification required.** Count and names can drift. The *current state* is always determined by `ls .hivefiver-meta-builder/skills-lab/active/refactoring/`, not by this table.

## I.2 Iron Laws (from `.hivefiver-meta-builder/AGENTS.md`)

1. **NO DIRECT CREATION WITHOUT DELEGATION** — primary coordinators never write SKILL.md / agent / command files directly. Route to specialists.
2. **NO STACK WITHOUT A REASON** — max 3 skills per agent turn. Explain why each is needed.
3. **NO SUBAGENT WITHOUT CONSTRUCTED CONTEXT** — full task text + scene-setting + scope. **Never** pass session history.
4. **NO SKILL WITHOUT TRIGGER PHRASES** — the `description` frontmatter field is the only thing agents see at runtime. Without trigger phrases, the skill is dead on arrival.
5. **EVERY COMMAND SURVIVES `CI=true`** — no TTY-dependent operations. Non-interactive shell safety.
6. **NO DEAD REFERENCES** — every file path, script, skill, or command referenced from a SKILL.md body must exist.
7. **NO BIG-BANG REWRITES** — one skill/agent/command at a time. Validate. Commit. Move on.

## I.3 The Two-Halves Boundary (never confuse)

| Half | What | Where | Mutability |
|------|------|-------|------------|
| **Hard Harness** | npm package `opencode-harness`: tools (write-side CQRS), hooks (read-side CQRS), plugin assembly, shared leaf modules | `src/` → `dist/` | Versioned, ships via npm. Agents DO NOT edit. |
| **Soft Meta-Concepts** | skills, agents, commands, rules, permissions | `.hivefiver-meta-builder/*-lab/active/refactoring/` → symlinked into `.opencode/` | User-configurable, committed to repo, lab → symlink → live testing → ship. |

- Hivefiver's entire remit is **Half 2** (Soft Meta-Concepts). It does **not** touch `src/`.
- Hiveminder's remit is project-builder work (NextJS apps etc.). **Do not confuse Hivefiver with Hiveminder** (`.hivefiver-meta-builder/AGENTS.md` line 16).

## I.4 The Skills-Lab → `.opencode/` → TS-runtime Pipeline

```
.hivefiver-meta-builder/**-lab/active/refactoring/     ← EDIT HERE (source of truth)
        ↓ (symlinks, instant)
.opencode/{agents,commands,skills,hivefiver}/          ← LIVE TEST (OpenCode reads here)
        ↓ (when validated)
TS runtime builder (opencode-harness npm package)      ← FINAL SHIP
```

- Never edit files inside `.opencode/` directly — they are symlinks.
- Every edit lands in the lab; every commit covers lab + any harness-code changes together.
- The TS-runtime packer is the responsibility of `hivefiver-tool-builder` + `builder`, not `hivefiver-skill-author`.

---

# PART II — HIVEMIND PHILOSOPHY SYNTHESIS

## II.1 The Thesis

> **Agent intelligence is not a property of the model — it is a property of the architecture surrounding the model.**
> (`docs/draft/HIVEMIND-PHILOSOPHY-2026-04-10.md` §1)

- **HIVE** = structure: hierarchical file trees, delegation protocols, domain boundaries, guardrails.
- **MIND** = memory: accumulated per-session / per-project intelligence, organised knowledge, retrievable synthesis.
- **HIVE + MIND = intelligence that compounds over time.**

Hivemind is a **runtime composition engine**, not a framework. It hosts GSD phase-gated workflows, BMAD constraints, or OMO autonomous agents without forcing any one methodology.

## II.2 The Two Halves (architectural re-statement of I.3)

| Half | CQRS side | Purpose |
|------|-----------|---------|
| Hard Harness — tools (`src/tools/`) | Write | Mutate continuity store, create sessions, dispatch delegations. Zod-validated. |
| Hard Harness — hooks (`src/hooks/`) | Read | Observe events, inject context, never mutate. |
| Hard Harness — plugin (`src/plugin.ts`) | Assembly (57 LOC target) | Zero business logic. DI + registration only. |
| Hard Harness — shared (`src/lib/`) | Leaf | Pure utilities, no upward deps. `types.ts` is the terminal leaf. |
| Soft Meta — skills (`.opencode/skills/`) | Knowledge | Teach agents how to approach task classes. |
| Soft Meta — agents (`.opencode/agents/`) | Role | Permission profiles + system prompt. |
| Soft Meta — commands (`.opencode/commands/`) | Entry | YAML-frontmatter slash commands. |
| Soft Meta — rules (`.opencode/rules/`) | Constraint | Hard boundaries (e.g., max 500 LOC per module). |
| Soft Meta — permissions (`opencode.json`) | Access | Per-agent tool/skill/command allow/deny. |

## II.3 The 5 Pillars (condensed)

| # | Pillar | Practical enforcement |
|---|--------|----------------------|
| 1 | **Hierarchical Superiority** | Dependency-satisfaction-first. `types.ts` is leaf; `plugin.ts` is root. No circular imports. Every delegation carries a return contract. |
| 2 | **Collaborative Domains** | Bounded autonomy via permissions. Bidirectional reporting (findings up the chain, context down). Shared long-term knowledge base (MIND). |
| 3 | **Strategically Measurable** | 2-end-extreme metrics: programmatic/E2E-testable AND scale-measurable. Incremental gates, not monolithic end-gates. |
| 4 | **Iteratively Granular** | ≤300 LOC per file, ≤10 interface fields, chain-breaking functions. Loop until correct. Perfect = iterative, not one-pass. |
| 5 | **Open Architecture / Runtime Composition** | Hosts GSD / BMAD / OMO patterns. Engine stays stable; mind adapts. No forking the harness to extend behaviour. |

## II.4 Why This Matters to Skill Design

- Skills that contradict a pillar are **systemically broken** — no amount of description tuning fixes them.
- Example failures the refactor must catch:
  - Skills that *dictate* governance (violates Pillar 2 — governance belongs to the hard harness, not skills).
  - Skills that hold 800+ lines of body content (violates Pillar 4 — not granular).
  - Skills that assume session history (violates Pillar 3 — not strategically measurable across sessions).
  - Skills that collide with siblings on trigger phrases (violates Pillar 1 — no hierarchical discrimination at runtime).

---

# PART III — THE 3-LEVEL-DEPTH COORDINATION STRUCTURE

This section defines the canonical agent classification for Hivemind-on-OpenCode. It synthesises the user-prompted `3-level-depth coordination` model, the `orchestrator / specialist / subagent` hierarchy from `HIVEMIND-AGENTS-2026-04-10.md` §1, and the `hivefiver-orchestrator → specialist → subagent` dispatch protocol from `.hivefiver-meta-builder/AGENTS.md`.

## III.1 The Four Classifications

### Level 1 — Primary Coordinator

| Attribute | Value |
|-----------|-------|
| Role | Front-facing almighty strategist. The user talks to this agent via `Tab`. |
| Examples | `coordinator`, `conductor`, `hivefiver-orchestrator` |
| File location | `.hivefiver-meta-builder/agents-lab/active/refactoring/{coordinator,conductor,hivefiver-orchestrator}.md` |
| Primary tools | `task` (builtin delegation), `read`, `glob`, `grep`, `question` |
| Forbidden tools | `edit`, `write`, `bash(mutating)` — **orchestrators never implement** |
| Depth | 0 (root) |
| Session | Owns the root session; passes `DelegationMeta.rootID` down to children |
| Announcement (every turn) | "I am the front-facing orchestrator. I will delegate and verify; I will not implement." |

**Hard rule (from `AGENTS.md` NOTICE BOARD):** use the built-in `task` tool for delegation; `delegate-task` is on maintenance and must not be used unless explicitly requested by the user.

### Level 2 — Pure Orchestrators

| Attribute | Value |
|-----------|-------|
| Role | Delegated sub-coordinators. Spawned in their own session ID by the primary coordinator. Coordinate their own child task-completers. |
| Examples | An OMO-style `call-omo-agent` pattern; a `hivefiver-skill-author` orchestrating its own `critic` + `researcher` subagents; a wave coordinator inside `coordinating-loop`. |
| File location | `.hivefiver-meta-builder/agents-lab/active/refactoring/{hivefiver-skill-author,hivefiver-agent-builder,hivefiver-command-builder}.md` |
| Primary tools | `task`, `read`, `glob`, `grep` — and conditionally `edit`/`write` if the specialist role requires it (e.g., `hivefiver-skill-author` does produce SKILL.md) |
| Depth | 1 (child of primary) |
| Delegation | Allowed — but only to level-3 task-completers and level-3 pure-swarms. **Never** back up to a level-1 primary. |
| Session | New session spawned by `task`; parent chain recorded in `DelegationMeta.parentChain`. |
| Announcement | "I am the subagent `<name>`, role `<role>`, delegated by `<parent>`. I must fulfil my work; I will delegate only to my allowed list." |

### Level 3 — Task-Completers

| Attribute | Value |
|-----------|-------|
| Role | Deep-domain workers. Produce **artifacts** — source files, markdown reports, verifications, plans. Single-purpose. |
| Canonical specialist types | `researcher`, `builder`, `critic`, `planner`, `verifier`, `writer`, `prompt-skimmer`, `prompt-analyzer`, `context-mapper`, `risk-assessor`, `context-purifier`, `prompt-repackager` |
| DelegationCategory mapping | `research` → `researcher`; `implementation` → `builder`; `review` → `critic`; `visual-engineering` → `builder (frontend)`; `deep`/`quick` → router chooses |
| Primary tools | Role-specific. See III.2 below. |
| Depth | 2 or 3 (child of a level-2 pure-orchestrator, or direct child of a level-1 primary for simple one-hop tasks) |
| Delegation | **Conditional** — may call another task-completer **only if** the workflow explicitly allows it (via an `allowed list of agents` in the delegation packet). Otherwise must either finish, or hand back with `NEEDS_CONTEXT` / `BLOCKED`. |
| Session | New session; their output is the delegation artifact. |
| Announcement | "I am subagent `<name>`, role `<role>`. I cannot delegate further unless the packet explicitly allows it. I must fulfil my work. If verification is needed, I return that in the handoff report." |

### Cross-cutting — Pure Swarms

| Attribute | Value |
|-----------|-------|
| Role | Quick-search, read-only, massively parallel context synthesis. Hidden from the user. |
| Examples | `explore` (fast codebase scan); `gsd-codebase-mapper`, `gsd-phase-researcher`, `gsd-plan-checker`; the parallel fan-out inside `hf-context-absorb` waves 1 & 2. |
| Primary tools | `read`, `glob`, `grep`, `webfetch` — **never** `edit`, `write`, `bash(mutating)`, `task` |
| Depth | Any (1, 2, or 3). Callable by all three levels above. |
| Delegation | **Forbidden** — pure-swarms do not delegate. They fan out in parallel; results aggregate at the caller. |
| Session | Usually ephemeral child sessions; results returned via structured findings. |

## III.2 Permission Profile by Role (Level 3 task-completers)

Source: `docs/draft/HIVEMIND-AGENTS-2026-04-10.md` §2.

| Specialist | Read-side | Write-side | Shell | Delegation |
|------------|-----------|-----------|-------|------------|
| `researcher` | read, glob, grep, webfetch | — | — | — |
| `builder` | read, glob, grep | edit, write | bash (scoped) | — |
| `critic` | read, glob, grep | — | bash (tests only) | — |
| `general` | read, glob, grep | — | — | — |
| `explore` (swarm) | read, glob, grep | — | — | — |
| `hivefiver-skill-author` | read, glob, grep, webfetch | edit, write (SKILL.md + bundles) | bash (ask; explicit allow-list for git/ls/find/cat/grep/rm/mkdir/cp) | task: deny; skill: `use-authoring-skills`, `skill-judge`, `skill-creator`, `opencode-platform-reference` only |
| `hivefiver-agent-builder` | same as skill-author | edit, write (agent .md) | same | task: deny |
| `hivefiver-command-builder` | same | edit, write (commands) | same | task: deny |

## III.3 The Dispatch Envelope (canonical subagent prompt)

Every dispatch from a primary or pure-orchestrator MUST use this envelope. Copy it into the `task` tool's `prompt` parameter verbatim (no session history leakage):

```
You are <subagent-role-name>, delegated by <parent-role-name>.

## Identity Announcement
I am subagent <name>, role <role>. I will not delegate further unless this packet
explicitly allows it. I will return findings in the handoff report below.

## Your Task
<FULL TASK TEXT — paste, do not reference>

## Scene-Setting
<Where this fits in the larger project; why it matters; what came before.>

## Scope
- Include: <specific files/paths/concerns>
- Exclude: <what NOT to touch>

## Allowed Delegations (if any)
- <list of agent names, empty if none>

## Output Format
- Status: DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED
- Artifacts: <paths>
- Findings: <structured list, each with file:line evidence>
- Next-step handoff (if DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED)
```

### Status protocol

| Status | Meaning | Parent action |
|--------|---------|----------------|
| DONE | Complete, verified against scope | Proceed |
| DONE_WITH_CONCERNS | Complete but doubts surfaced | Parse concerns; if correctness → address; if observation → note in brain |
| NEEDS_CONTEXT | Knowledge gap blocks completion | Provide missing context, re-dispatch |
| BLOCKED | Cannot proceed under current permissions/scope | Escalate up the chain; reconsider plan |

## III.4 Two-Stage Review (every subagent return)

Primary and pure-orchestrators must run both stages before accepting:

1. **Stage 1 — Spec Compliance.** Does the output match the task envelope? Nothing extra, nothing missing? If no → bounce back with NEEDS_CONTEXT.
2. **Stage 2 — Quality.** Well-constructed? Follows patterns? Passes the skill/agent/command validators? If no → bounce back with DONE_WITH_CONCERNS.

**Stage 1 must pass before Stage 2 is considered.**

## III.5 Depth Limits and Budget

- Hard-harness `DelegationMeta` enforces **max depth = 3**. This is a structural invariant, not a convention.
- `budgetUsed` per session is tracked; primary coordinator owns the root budget envelope.
- A level-3 task-completer calling another level-3 task-completer pushes depth to 4 only if the orchestrator explicitly allows it; otherwise it will be rejected by the hard harness.

---

# PART IV — OPENCODE META-CONCEPTS STACK

This section indexes OpenCode's built-in primitives and explains how Hivemind stacks them without disrupting platform semantics. Primary source: <https://opencode.ai/docs/> index as captured in the user's prompt.

## IV.1 Meta-concept inventory

| Concept | OpenCode doc | Hivefiver lab location |
|---------|--------------|------------------------|
| Agents | `/agents/`, `/config/`, `/rules/` | `.hivefiver-meta-builder/agents-lab/active/refactoring/` |
| Commands | `/commands/`, `/commands/#prompt-config`, `/commands/#shell-output`, `/commands/#agent`, `/commands/#subtask` | `.hivefiver-meta-builder/commands-lab/active/refactoring/` |
| Skills | `/skills/` | `.hivefiver-meta-builder/skills-lab/active/refactoring/` |
| Tools | `/tools/` | `src/tools/` (hard harness) + `custom-tools-dev` skill (user-authored) |
| Permissions | `/permissions/` | `opencode.json` + per-agent `permission:` frontmatter |
| Rules | `/rules/` | `.opencode/rules/` |
| MCP servers | `/mcp-servers/` | `opencode.json` + `.opencode/` config |
| LSP | `/lsp/` | Handled by OpenCode runtime |
| GitHub | `/github/` | `opencode.json` + GitHub App |
| Plugins | SDK / API | `src/plugin.ts` (`opencode-harness` npm) |

## IV.2 Stacking Pattern (Safe Composition)

Hivefiver's stacking guarantee: **every stack of 2–3 concepts is validated, deterministic, and reversible.**

### Agent ← Skill stacking

1. Agent `permission.skill` allow-list declares every skill the agent may load.
2. Agent body references one **mandatory** skill stack (≤3 skills) in its execution flow.
3. Skills' `metadata.layer` must be compatible: a L0 router may pair with L1 orchestrator + L2 domain-execution; a L2 may not pair with another L2 unless one is a reference.
4. Loading order is fixed in the agent body — not inferred at runtime.

### Command ← Agent ← Skill stacking

1. Command frontmatter declares `agent:` (the target agent).
2. Command declares `tools:` — the tool-access subset the agent gets for this invocation.
3. `$ARGUMENTS` inject user params into the agent prompt.
4. `!bash` injections (output-only) provide pre-turn facts without TTY interaction.
5. Skill loading is the agent's responsibility, not the command's. Command only passes intent.

### Permission gating (non-negotiable)

- Every agent frontmatter must declare `permission:` explicitly — no defaults inferred.
- `bash:` must default to `ask` with an explicit allow-list of read-only commands.
- `task: deny` for level-3 task-completers; `task: allow` only for level-1/level-2.
- `skill: "*": deny` + explicit allow-list of skill names. Never `"*": allow`.

### MCP servers (read-side augmentation)

- MCP servers provide read-only context (docs, wikis, third-party APIs) — they are **not** a substitute for custom tools.
- Register in `opencode.json` and cite in agent/skill references.
- Never grant MCP servers write permissions without an explicit user-approved policy update.

### Rules layer

- `.opencode/rules/*.md` is injected via agent frontmatter `instruction: [.opencode/rules/*.md]`.
- Rules are **hard boundaries** (Pillar 2). Skills show the *how*; rules define the *must-never*.

---

# PART V — THE SKILLS PIPELINE

## V.1 Dual Mandate: Platform-Agnostic Core + 100% Hivemind Boost

Every skill authored under Hivefiver MUST satisfy both contracts simultaneously:

1. **Platform-agnostic core (agentskills.io compliance).** The skill loads and runs correctly on any `skills-compatible` platform (Claude Code, OpenCode, Codex, Cursor, Gemini CLI, Aider, etc.) without Hivemind-specific vocabulary or primitives in its public surface.
2. **Hivemind 100% boost (optional activation).** When the skill runs *inside* the Hivemind harness, it transparently activates additional capabilities — stacking with other skills, dispatching via `task`, writing to the continuity store, registering with the session brain — via optional runtime probes, never via hard assumptions.

### Probe-don't-assume pattern

```bash
# SKILL.md body pseudo-code
if [ -f .opencode/state/opencode-harness/session-continuity.json ]; then
  # Hivemind boost available — use delegation envelope, update brain
else
  # Platform-agnostic path — inline workflow, self-contained
fi
```

Skills that *require* Hivemind primitives (e.g., `hf-context-absorb`, `coordinating-loop`) must declare this in their frontmatter `metadata.requires-harness: true` and gate themselves with a runtime probe.

## V.2 The Six-Criterion Gate (from `SKILL-CRITERIA-SHORT.md`)

Skills pass through six sequential gates. Fail any gate = refactor debt (tracked as skills-lab inventory item, not shipped).

| # | Gate | Pass condition |
|---|------|-----------------|
| 1 | **Name downstream** | Name does not collide with sibling skills in semantic meaning. |
| 2 | **Anatomy + description rules** | `SKILL.md` with YAML frontmatter (`name`, `description` required). Bundled resources in `scripts/`, `references/`, `assets/`. |
| 3 | **Description quality** | ≥90% runtime pick-rate at the right moment. No internal vocabulary (no `harness`, `OMO`, `GSD`, `/hf-*`, `hivefiver-*`). Unique opening. Active voice. Max ~40 words. Contains 5+ natural trigger phrases. Contains 1–2 explicit NOT-for exclusions. |
| 4 | **Architecture fit** | Belongs to exactly one of: (a) Meta-builder-module lineage, (b) Project-specific lineage. Belongs to exactly one of the two task-orientation groups (see V.3). |
| 5 | **Hierarchy fit** | Belongs to exactly one of: (i) Higher coordinator/orchestrator — picked by front-facing agents only, (ii) Sub-session level — picked by delegated agents only. Never both. |
| 6 | **Body quality** | ≤500 LOC body. Progressive disclosure. References for >200 LOC detail. TOC for >300 LOC references. No fragmented steps. No shallow routing-only bodies. No governance dictation. |

## V.3 Task-Orientation Groups

| Group | Character | Example skills | Failure mode |
|-------|-----------|----------------|---------------|
| **Group 1 — How-to-Process** | Coordination, orchestration, verification, gatekeeping, iterative loops, review cycles. Must teach **validation conditions**. | `coordinating-loop`, `phase-loop`, `user-intent-interactive-loop`, `planning-with-files`, `meta-builder`, `use-authoring-skills`, `delegation-gates`, `opencode-project-audit` | Generic language; no edge cases; mechanical-feeling; does not stack with hierarchy skills |
| **Group 2 — How-to-Implement** | Tactical/expert tasks with specific tech patterns. Advanced patterns applied in depth. | `command-dev`, `custom-tools-dev`, `agents-and-subagents-dev`, `hm-deep-research`, `hm-detective`, `hm-synthesis`, `opencode-non-interactive-shell`, `command-parser`, `skill-synthesis`, `eval-driven-development` | Generic AI-written tone; throws document links instead of showing steps; no stacking guidance |

**Banned in description** (immediate fail): "grep", "glob", "quick-search" keywords. These produce false keyword-matches and are a common deception vector. (`SKILL-CRITERIA-SHORT.md` sidebar.)

## V.4 Bundle Standard (every shipped skill)

| Component | Required | Notes |
|-----------|:--------:|------|
| `SKILL.md` | Yes | ≤500 LOC body; push detail to `references/` |
| YAML frontmatter | Yes | `name` (kebab-case, ≤3 words, matches directory), `description` (≤40 words, 5+ triggers, no internal vocab), `metadata.layer` (0/1/2/3), `metadata.role` (routing/orchestrator/domain-execution/reference), `metadata.pattern` (P1/P2/P3), `allowed-tools` |
| `references/` | Yes if body >200 LOC | Progressive disclosure. Each ≥100 LOC of real content; stubs are forbidden. |
| `scripts/` | Conditional | Real validation logic; non-zero exit on failure; inline fallback procedure in `SKILL.md` body for every script call. |
| `evals/` | Yes | Trigger queries + evaluation datasets. Coverage target: 60%+ of skills have evals. |
| `assets/` | Optional | Templates, icons, fonts used in output. |
| `hooks/` | Optional | OpenCode hook definitions if the skill wires into runtime events. |
| `templates/` | Optional | Scaffolding outputs for `P1-router` and `P2-hybrid` skills. |

### Pattern selection

| Pattern | Use for | SKILL.md size | References |
|---------|---------|---------------|-----------|
| **P1 — Router** | Thin dispatcher to other skills | 100–200 lines | 2–3 |
| **P2 — Hybrid** | Balanced depth — most skills | 200–400 lines | 4–8 |
| **P3 — Comprehensive** | Deep domain (authoring, debugging, synthesis) | 400–800 lines | 8–12 |

Rule: *match specificity to fragility*. Prescriptive for fragile (YAML, file formats); flexible for creative (body prose, examples).

## V.5 Layer Metadata (mandatory)

Every `SKILL.md` frontmatter must declare `metadata.layer`:

| Layer | Meaning | Example skills |
|-------|---------|----------------|
| 0 | Router / dispatcher — only picked by level-1 primary | `meta-builder` |
| 1 | Orchestration methodology — picked by primary OR pure-orchestrators | `coordinating-loop`, `user-intent-interactive-loop`, `planning-with-files`, `hf-context-absorb` |
| 2 | Domain execution — picked by pure-orchestrators OR level-3 task-completers | `command-dev`, `custom-tools-dev`, `hm-detective`, `hm-synthesis`, `hm-deep-research`, `phase-loop`, `skill-synthesis`, `opencode-non-interactive-shell` |
| 3 | Reference — read-only knowledge; any layer may reference | `opencode-platform-reference`, `oh-my-openagent-reference` |
| 4 | Meta-authoring — used exclusively by `hivefiver-skill-author` | `use-authoring-skills` |

Hierarchy mismatch = Gate 5 failure. Cross-batch synthesis (2026-04-09) flagged `phase-loop` (claims L2, used as L1), `session-context-manager` (claims L2, is sub-component), `harness-delegation-inspection` (claims L1, covers 4 concerns → split).

## V.6 Chaining Rules

1. **Max 3 skills** stacked simultaneously. If a 4th would help, you are not stacking — you are hoarding.
2. **Loading order is fixed**: `background → routing → intent → planning → coordination → domain`. (Source: `ONBOARDING-WORKFLOW-PROTOCOL.md` Phase 4.)
3. **Layer compatibility**: L0 + L1 + L2 is valid; L0 + L0 is invalid (two routers); L2 + L2 is valid only if one is a reference.
4. **No circular dependencies**: a skill's `references/` may point to another skill's reference path, but SKILL.md → SKILL.md direct loading is forbidden.
5. **Standalone contract**: every skill must run standalone. If skill A *requires* skill B, then A is a chapter, not a skill.

## V.7 Description Template (universal, from `target-architecture-2026-04-09.md` §6)

```
<active verb> <what it does in ≤10 words>. Use when <5–8 natural trigger phrases>. NOT for <1–2 explicit exclusions>.
```

### Worked examples (from the audit's proposed descriptions)

- **meta-builder** — "Route OpenCode meta-concept requests to specialist authoring skills. Use when creating, auditing, stacking, or configuring skills, agents, commands, or tools. NOT for direct implementation."
- **use-authoring-skills** — "Author, audit, and score OpenCode skills using TDD workflow and quality rubrics. Use when writing a new skill, fixing frontmatter, checking skill quality, or running evals. NOT for agent or command authoring."
- **delegation-gates** (renamed from `agent-authorization`) — "Enforce pre-delegation authorization gates before agent dispatch. Use when setting up checkpoint gates, defining capability matrices, or validating agent permissions. NOT for orchestration execution."
- **opencode-project-audit** (renamed from `harness-audit`) — "Audit OpenCode projects across skills, commands, tools, permissions, agents, and subagents. Use when checking boundaries, verifying architecture, or validating setup. NOT for code review."
- **eval-driven-development** (renamed from `eval-harness`) — "Implement eval-driven development with define-run-grade-improve cycles. Use when writing evals, benchmarking skill quality, or measuring trigger accuracy. NOT for general testing."

---

# PART VI — THE REFACTORING PLAN (SYNTHESISED)

Source: `.hivemind/research/skills-audit/planning/master-revamp-plan-2026-04-09.md`, `.hivemind/research/skills-audit/planning/target-architecture-2026-04-09.md`, `.hivemind/research/skills-audit/synthesis/cross-batch-findings-2026-04-09.md`.

## VI.1 Current vs Target State

| Metric | Current | Target |
|--------|---------|--------|
| Live skills count | 19 | ~20 |
| Average grade | C | B+ |
| PASS-grade skills | 8 | 15+ |
| Critical bugs | 4 | 0 |
| Vocabulary leaks | 7 | 0 |
| Eval coverage | 25% | 60%+ |
| Formulaic descriptions | 5 | 0 |
| `.claude/` vs `.opencode/` duplicates | 5+ | 0 (single canonical location) |

## VI.2 Critical Issues (Phase 0 — must fix before any other work)

| ID | Issue | Skill | Fix |
|----|-------|-------|-----|
| C1 | `validate-gate.sh synthesize` → guaranteed failure | `skill-synthesis` | Add `synthesize` action OR change SKILL.md to use `create` |
| C2 | 4 depth references are stubs | `meta-builder` | Write real content or remove references |
| C3 | Phantom `tech-stack.md` reference | `oh-my-openagent-reference` | Generate file or remove from `summary.md` |
| C4 | Empty `project-structure.md` (4 lines) | `oh-my-openagent-reference` | Regenerate with actual directory tree |
| C5 | Duplicate skills across `.claude/` and `.opencode/` | 5 skills | Determine canonical, delete duplicates |

## VI.3 Systemic Issues (Phases 3–4)

| ID | Issue | Affected | Severity | Fix |
|----|-------|----------|----------|-----|
| S1 | Internal vocabulary leak in descriptions | 7 skills | Critical | Description rewrite with universal triggers |
| S2 | Formulaic "This skill should be used when..." | 5 skills | High | Active-voice, unique opening per skill |
| S3 | Source-of-truth duplication (`.claude/` vs `.opencode/`) | 5+ skills | Critical | Choose canonical (`.claude/skills/`); merge unique content; delete the other |
| S4 | Script deps without fallbacks | 6 skills | Medium | Inline fallback procedure in body for every script call |

## VI.4 Structural Changes (Phase 2)

### Merges (−1)

| Source | Into | Rationale |
|--------|------|-----------|
| `session-context-manager` (FAIL) | `planning-with-files` | Functional overlap — one cross-session persistence system |

### Splits (+1)

| Source | Result A | Result B |
|--------|----------|----------|
| `harness-delegation-inspection` | `subagent-delegation-patterns` | `opencode-project-inspection` |

### Renames (0 net)

| Current | Target |
|---------|--------|
| `eval-harness` | `eval-driven-development` |
| `harness-audit` | `opencode-project-audit` |
| `agent-authorization` | `delegation-gates` |

### Creations (+2)

| New skill | Domain | Template |
|-----------|--------|----------|
| `eval-execution` | Eval / benchmarking | `hm-deep-research` (methodology pattern) |
| `agent-lifecycle-events` | Subagent management | `command-dev` (lean pattern) |

Net delta: 19 → 20 skills.

## VI.5 Phase Order (dependency-first)

```
Phase 0 — Critical Fixes (C1–C5)
    ↓
Phase 1 — Canonical Location + Duplicate Resolution (S3)
    ↓
Phase 2 — Structural Changes (merge/split/rename/create)
    ↓
Phase 3 — Description Rewrite Sprint (S1 + S2) — 11 skills
    ↓
Phase 4 — Script Dependency Hardening (S4) — 6 skills
    ↓
Phase 5 — Body Quality + Eval Expansion — 3–5 skills
```

Every phase requires **explicit user authorisation** before execution. Within each phase, the Hivefiver routing table (see VIII.2) determines which specialist is dispatched.

## VI.6 Uncovered Domains (Post-Revamp Gaps)

Even after the 6-phase revamp, these gaps remain and should be addressed in a subsequent cycle:

| Gap | Severity | Recommendation |
|-----|----------|----------------|
| Permission enforcement (no runtime validation skill) | High | `agent-lifecycle-events` with permission hooks |
| Hook/event system (no reactive-agent patterns) | Medium | Expand `opencode-platform-reference` with a new hook section |
| Context compaction protocol (no shrink procedure) | Medium | Extend `planning-with-files` with a compaction schema |
| Non-OpenCode platforms (multi-platform deployment) | Low | Expand `use-authoring-skills/06-cross-platform-activation.md` |

## VI.7 Gold-Standard Templates

Use these as copy-start templates for new skills (per cross-batch synthesis):

| Template for | Use this skill | Why |
|--------------|----------------|-----|
| Reference skills | `opencode-platform-reference` | Key patterns section, TOC, progressive disclosure |
| Tactical skills | `command-dev` | Lean 80 LOC, Iron Law, clear anatomy |
| Methodology skills | `hm-deep-research` | Stage gates, tool matrix, anti-patterns, "when NOT to" |
| Behavioural skills | `opencode-non-interactive-shell` | BAD/GOOD examples, self-contained, no background deps |
| Planning skills | `planning-with-files` | Complete schemas, tiered response, subagent envelope |

---

# PART VII — USING `skill-creator`, `skill-judge`, AND `skill-writing`

These are the three authoring primitives the refactor relies on. **They are separate tools/skills** — not a single pipeline. Always invoke in the order: `skill-creator` → `skill-writing` → `skill-judge`.

## VII.1 The Three Primitives

| Primitive | Location | Type | Purpose |
|-----------|----------|------|---------|
| `skill-creator` | Global: `~/.agents/skills/skill-creator/` | Platform-agnostic skill | Create a *new* skill from a prompt, a document, or an extracted pattern. Emits a scaffolded SKILL.md + bundle. |
| `skill-writing` (in-repo alias = `use-authoring-skills`) | `.hivefiver-meta-builder/skills-lab/active/refactoring/use-authoring-skills/` | Hivefiver meta skill (L4) | Author, audit, and refactor skills **inside** the Hivefiver lab. Enforces the Iron Law, agentskills.io principles, 6 criterion gates, and bundle standard. |
| `skill-judge` | Global: `~/.agents/skills/skill-judge/` | Platform-agnostic skill | Grade a skill against quality rubrics. Returns PASS / NEEDS_REFACTOR / FAIL with per-dimension scores. |

All three are declared in `hivefiver-skill-author.md` via:

```yaml
permission:
  skill:
    "*": deny
    "use-authoring-skills": allow
    "skill-judge": allow      # global skill at ~/.agents/skills/skill-judge/
    "skill-creator": allow    # global skill at ~/.agents/skills/skill-creator/
    "opencode-platform-reference": allow
```

**Before invoking any of the three**, run the validated-skills probe (I.1.1) to confirm the skill exists in its expected location. Do not silently fall through to a sibling.

## VII.2 Invocation Pattern: Creating a New Skill

1. **Primary coordinator** receives the request ("create a skill that …"). Intent classification routes to the `meta-builder` skill.
2. `meta-builder` routes to `hivefiver-skill-author` specialist (pure-orchestrator, level 2).
3. `hivefiver-skill-author` runs its mandatory first step:

   ```bash
   # Load the in-repo authoring skill
   ls .hivefiver-meta-builder/skills-lab/active/refactoring/use-authoring-skills/references/
   ```

4. **Gate 0** — preflight:

   ```bash
   bash .hivefiver-meta-builder/skills-lab/active/refactoring/use-authoring-skills/scripts/validate-gate.sh \
     create "<user's exact request>" <target-skill-dir>
   ```

   Must exit 0. If non-zero → fix and re-run.

5. **Step 1 — invoke `skill-creator`** (global). Pass: (a) the user's intent, (b) the extracted real task (from hands-on conversation or synthesised project artifacts per agentskills.io), (c) the target skill directory. `skill-creator` emits a scaffolded bundle.

6. **Step 2 — invoke `skill-writing`** (`use-authoring-skills` in the lab). Responsibilities:
   - Pick the pattern (P1/P2/P3).
   - Fill the body per agentskills.io principles: procedures over declarations, defaults not menus, checklists for 3+ step workflows, validation loops, anti-patterns table.
   - Write `references/` with substantive content (≥100 LOC each, no stubs).
   - Write `scripts/` with real validation (not always-exit-0 stubs).
   - Write `evals/` with trigger queries.

7. **Step 3 — validate:**

   ```bash
   bash scripts/validate-skill.sh <skill-dir>
   bash scripts/check-overlaps.sh <skill-dir>
   ```

   Repeat until both exit 0.

8. **Step 4 — invoke `skill-judge`** (global). Dispatches a `critic` subagent under the hood. Returns per-dimension grade:
   - Name quality
   - Description pick-rate (trigger-phrase fitness)
   - Anatomy compliance
   - Architecture fit (lineage + task-group)
   - Hierarchy fit (layer + picking-party match)
   - Body quality
   - References quality
   - Scripts quality
   - Eval coverage

   If any dimension < B → return to Step 2 (skill-writing) with the grader's findings. Loop until Stage 1 + Stage 2 review (III.4) passes.

9. **Step 5 — final gate:**

   ```bash
   bash scripts/validate-gate.sh create "<user's exact request>" <skill-dir>
   ```

   Must exit 0.

10. **Step 6 — commit** (atomic, per skill): `phase: skill-created <name> — <why it matters>`.

11. **Step 7 — report** up the chain with status `DONE`, artifact path, and a one-paragraph summary of what the skill teaches.

## VII.3 Invocation Pattern: Auditing an Existing Skill

1. Route to `hivefiver-skill-author` via `meta-builder`.
2. **Gate 0:** `validate-gate.sh audit "<request>" <skill-dir>` must exit 0.
3. Invoke `skill-writing` (`use-authoring-skills`) with the doctor path: load `references/05-skill-quality-matrix.md`.
4. Invoke `skill-judge` to generate the per-dimension grade.
5. Produce a findings report with file:line evidence. **Do not fix without user confirmation** (ONBOARDING-WORKFLOW-PROTOCOL Phase 4 §2 step 6).
6. Upon approval, route fixes through the refactor path (VII.4).

## VII.4 Invocation Pattern: Refactoring an Existing Skill

This is the main path the upcoming 6-phase revamp will use.

1. Load plan: `cat .hivemind/research/skills-audit/planning/master-revamp-plan-2026-04-09.md`.
2. Identify the phase (0–5) and the target skill.
3. Route to `hivefiver-skill-author`.
4. **Gate 0:** `validate-gate.sh edit "<request>" <skill-dir>` must exit 0.
5. Invoke `skill-writing` with the iterative refinement path (`references/07-iterative-refinement.md`).
6. If the refactor is a rename or split: invoke `skill-writing` with the conflict-detection path (`references/08-conflict-detection.md`) first to confirm no trigger-phrase collisions with siblings.
7. Run `validate-skill.sh` + `check-overlaps.sh`.
8. Invoke `skill-judge` for re-grade. Must match or exceed the target grade (see I.1.2 inventory).
9. If grade regresses → bounce back to step 5 with grader findings.
10. **Commit atomically** per skill. Never batch refactors across skills in one commit.

## VII.5 Common Failure Modes and Their Correction

| Failure | Detection | Correction |
|---------|-----------|------------|
| **The Hollow Stub** | `skill-judge` flags a script that exits 0 unconditionally | Rewrite with real validation logic; remove if no logic exists |
| **The Description Echo** | `skill-judge` flags trigger-phrase collision with a sibling | Rewrite description with differentiated triggers; add NOT-for exclusion |
| **The Internal Vocabulary Leak** | Description contains `harness`, `OMO`, `GSD`, `/hf-*`, `hivefiver-*` | Universal trigger phrases only; implementation terms go in body |
| **The Formulaic Opener** | First 6 words of description = "This skill should be used when" | Active-voice lead with unique verb |
| **The Dead Reference** | `references/xyz.md` referenced in SKILL.md but file is missing or <5 LOC | Generate real content or remove the reference |
| **The 801-Line Body** | SKILL.md exceeds 800 LOC | Split into hybrid: SKILL.md shell + richer references |
| **The Hierarchy Mismatch** | `metadata.layer: "2"` but skill is picked by front-facing only | Update metadata to match actual runtime use |
| **The Grep-Keyword Trap** | Description contains "grep", "glob", "quick-search" | Remove; rely on semantic pick-rate |

## VII.6 When NOT to Use These Tools

- Do **not** use `skill-creator` to produce a one-off prompt. If the knowledge is not reusable across sessions, it is not a skill.
- Do **not** use `skill-writing` to edit an agent or command definition. Route to `hivefiver-agent-builder` or `hivefiver-command-builder` instead.
- Do **not** invoke `skill-judge` on a skill that has not passed `validate-skill.sh` — the judge expects structurally valid input.
- Do **not** run any of these tools inside a level-3 task-completer session. They are gated to level-2 pure-orchestrators and `hivefiver-skill-author` specifically.

---

# PART VIII — HIVEFIVER ROUTING TABLE AND WORKFLOW

## VIII.1 The 6-Phase Onboarding (every new session)

| Phase | Duration | Action |
|-------|----------|--------|
| Phase 0 | 30s | Memory load: `git log --oneline -10`, `git branch -a`, `git log --grep="skill\|agent\|command" --oneline`. L2: lab files (`progress.md`, `findings.md`). L3: episodic memory. |
| Phase 1 | 60s | Context: read `.hivefiver-meta-builder/AGENTS.md`; read git-workflow protocol; check lab dirs; verify symlinks; read planning files. |
| Phase 2 | 30s | Skill activation (max 3): mandatory = `meta-builder` + `opencode-platform-reference` + `coordinating-loop`. Conditional per trigger. |
| Phase 3 | 15s | Intent classification via routing table (VIII.2). |
| Phase 4 | — | Execution protocol per workflow type (VIII.3). |
| Phase 5 | — | Quality gates (VIII.4). |
| Phase 6 | — | Session recovery (if interrupted) via git + planning files. |

## VIII.2 Routing Table

| User says | Route to (skill) | Dispatch to (specialist) |
|-----------|-----------------|---------------------------|
| "create a skill" | `use-authoring-skills` | `hivefiver-skill-author` |
| "audit this skill" / "review skill" | `use-authoring-skills` (doctor) | `hivefiver-skill-author` |
| "refactor skill X" | `use-authoring-skills` (iterative) | `hivefiver-skill-author` |
| "create an agent" | `agents-and-subagents-dev` | `hivefiver-agent-builder` |
| "set up a command" | `command-dev` | `hivefiver-command-builder` |
| "build a custom tool" | `custom-tools-dev` | `hivefiver-tool-builder` |
| "stack skills" | `meta-builder` + targets | self (orchestrate) |
| "configure OpenCode" | `opencode-platform-reference` | self (research + report) |
| "audit my project" | `opencode-project-audit` (post-rename) | self + `critic` subagent |
| "inspect delegation" | `subagent-delegation-patterns` (post-split) | self |
| "set up delegation gates" | `delegation-gates` (post-rename) | self |
| "write an eval" | `eval-driven-development` (post-rename) | self |

## VIII.3 Execution Protocols

### Meta-concept creation

1. Load routing skill → `meta-builder`.
2. Classify intent → match routing table.
3. Dispatch to specialist via `task` tool with the dispatch envelope (III.3).
4. Collect output → check status.
5. Two-stage review → spec compliance first, then quality.
6. Commit → `git add` + atomic commit.
7. Report → what was created, where it lives, how to test.

### Meta-concept auditing

1. Load audit skill → `use-authoring-skills` (doctor path).
2. Scan target.
3. Run validators.
4. Generate findings report with file:line evidence.
5. Propose fixes (prioritised).
6. **Wait for approval. Do NOT fix without user confirmation.**

### Meta-concept stacking

1. Load `coordinating-loop`.
2. Validate compatibility — max 3, no circular deps, layer compatibility.
3. Determine loading order: background → routing → intent → planning → coordination → domain.
4. Produce stack config with rationale per skill.
5. Test stack — verify load + triggers.

## VIII.4 Quality Gates (before declaring any task complete)

- [ ] Output matches requirements (nothing extra, nothing missing)
- [ ] All validators pass (`validate-skill.sh`, `check-overlaps.sh`, `validate-gate.sh`)
- [ ] No dead references
- [ ] No stub scripts
- [ ] Trigger phrases present (for skills)
- [ ] Non-interactive shell safe (for commands)
- [ ] Permissions explicit (for agents)
- [ ] Committed to git with descriptive message

## VIII.5 Anti-Patterns (memorise; reject on sight)

| Anti-Pattern | Detection | Correction |
|--------------|-----------|------------|
| **The Executor** | Primary coordinator writing SKILL.md directly | STOP. Delegate to specialist. |
| **The Hoarder** | 4+ skills loaded | Max 3. Explain why each is needed. |
| **The Improviser** | Ignored routing table, task failed | Trust the table. Fix the table if wrong. |
| **The Context Polluter** | Subagent prompt includes "earlier in conversation" | Construct fresh context: task text + scene + scope. |
| **The File Referrer** | Subagent told to "read the plan file" | Paste full task text into the prompt. Always. |
| **The Hallucinator** | Architectural assumption without evidence | Ground in lineage. Read session exports. Verify with grep. |
| **The Session-History Leaker** | Passing chat log into delegation envelope | Full task text only. Never history. |
| **The Governance Dictator** | Skill tries to enforce policy (belongs to rules/permissions) | Move enforcement to `.opencode/rules/` or permission frontmatter. |

---

# APPENDIX A — Canonical File Map

| Purpose | Path (relative to repo root) |
|---------|------------------------------|
| Philosophy (EN) | `docs/draft/HIVEMIND-PHILOSOPHY-2026-04-10.md` |
| Philosophy (VI) | `docs/draft/HIVEMIND-PHILOSOPHY-VI-2026-04-10.md` |
| Architecture | `docs/draft/HIVEMIND-ARCHITECTURE-2026-04-10.md` |
| Agents ecosystem | `docs/draft/HIVEMIND-AGENTS-2026-04-10.md` |
| Current situation | `docs/draft/CURRENT-SITUATIONS-2026-04-10.md` |
| Current state | `docs/draft/hivemind-current-state.md` |
| Migration strategy | `docs/draft/migration-strategy-2026-04-03.md` |
| Hivefiver root AGENTS | `.hivefiver-meta-builder/AGENTS.md` |
| Onboarding protocol | `.hivefiver-meta-builder/ONBOARDING-WORKFLOW-PROTOCOL.md` |
| Skill criteria | `.hivefiver-meta-builder/SKILL-CRITERIA-SHORT.md` |
| Skills-audit master plan | `.hivemind/research/skills-audit/planning/master-revamp-plan-2026-04-09.md` |
| Target architecture | `.hivemind/research/skills-audit/planning/target-architecture-2026-04-09.md` |
| Cross-batch findings | `.hivemind/research/skills-audit/synthesis/cross-batch-findings-2026-04-09.md` |
| Skills lab (canonical) | `.hivefiver-meta-builder/skills-lab/active/refactoring/` |
| Agents lab (canonical) | `.hivefiver-meta-builder/agents-lab/active/refactoring/` |
| Commands lab (canonical) | `.hivefiver-meta-builder/commands-lab/active/refactoring/` |
| Workflows lab | `.hivefiver-meta-builder/workflows-lab/active/refactoring/` |
| References lab | `.hivefiver-meta-builder/references-lab/active/refactoring/` |
| Hard-harness source | `src/` (tools, hooks, plugin, lib, shared, schema-kernel) |
| Live symlinks | `.opencode/{agents,commands,skills,hivefiver}/` |

---

# APPENDIX B — Dispatch Envelope Copy-Paste

```
You are <SUBAGENT-NAME>, delegated by <PARENT-NAME>.

## Identity Announcement
I am subagent <NAME>, role <ROLE>. I will not delegate further unless this packet
explicitly allows it. I will return findings in the handoff report below.

## Your Task
<FULL TASK TEXT — paste verbatim; do not reference>

## Scene-Setting
<Where this fits; why it matters; what came before.>

## Scope
- Include: <paths/concerns>
- Exclude: <what NOT to touch>

## Allowed Delegations
- <agent names, or "none">

## Output Format
- Status: DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED
- Artifacts: <paths>
- Findings: <structured; each with file:line evidence>
- Next-step handoff (if not DONE)
```

---

# APPENDIX C — Frontmatter Templates

## C.1 Agent frontmatter (level 2 pure-orchestrator)

```yaml
---
name: "<kebab-case-name>"
description: "<third-person description with trigger phrases>. Spawned by <parent> for <purpose>."
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
    "git diff*": allow
    "git log*": allow
    "ls*": allow
    "find*": allow
    "cat*": allow
    "grep*": allow
  task: deny                       # level-3 task-completer = deny; level-2 pure-orchestrator = allow
  skill:
    "*": deny
    "<allow-list of skill names>": allow
  glob: allow
  grep: allow
  webfetch: allow
---
```

## C.2 Skill frontmatter (L2 domain-execution, P2 hybrid)

```yaml
---
name: <kebab-case-name>
description: <active verb> <what it does in ≤10 words>. Use when <5–8 natural triggers>. NOT for <1–2 exclusions>.
metadata:
  layer: "2"
  role: "domain-execution"
  pattern: P2-hybrid
  requires-harness: false    # true only if skill cannot run on platform-agnostic core
allowed-tools: Read Write Edit Bash Glob Grep
---
```

## C.3 Command frontmatter (thin shell → agent)

```yaml
---
description: <when to use this command>
argument-hint: "<positional and --flag patterns>"
agent: <target-agent-name>
tools:
  read: true
  write: true
  bash: true
  glob: true
  grep: true
  task: true
  question: true
  webfetch: true
---
```

---

# APPENDIX D — The 6-Criterion Self-Audit Checklist

Print this at the top of every `task_plan.md` you open while authoring or refactoring a skill. Tick off each item in order. Any un-ticked item blocks the commit.

```
[ ] 1. NAME — kebab-case, ≤3 words, matches directory, no collision with siblings, no internal vocabulary
[ ] 2. ANATOMY — SKILL.md present; frontmatter has name + description; bundle dirs exist (scripts/, references/, evals/)
[ ] 3. DESCRIPTION — ≤40 words, 5+ trigger phrases, 1–2 NOT-for exclusions, active voice, unique opening,
       no "This skill should be used when…", no "grep"/"glob"/"quick-search", no internal vocabulary
[ ] 4. ARCHITECTURE FIT — belongs to one lineage (meta-builder OR project) and one task group (Group 1 OR Group 2)
[ ] 5. HIERARCHY FIT — metadata.layer declared; picked by only one party (front-facing OR delegated, not both)
[ ] 6. BODY QUALITY — ≤500 LOC body; procedures not declarations; checklists for 3+ steps; validation loops;
       anti-patterns table with detection + correction; references ≥100 LOC each; scripts have real logic;
       evals have trigger queries; no dead references; stacking guidance present
```

---

# APPENDIX E — Living Skill Inventory Self-Test

Run this in any session to regenerate the current validated inventory:

```bash
cd "$(git rev-parse --show-toplevel)" && \
for d in .hivefiver-meta-builder/skills-lab/active/refactoring/*/; do
  name=$(basename "$d")
  skill_md="$d/SKILL.md"
  if [ -f "$skill_md" ]; then
    layer=$(grep -E '^\s*layer:' "$skill_md" | head -1 | sed 's/.*: *//' | tr -d '"')
    role=$(grep -E '^\s*role:' "$skill_md" | head -1 | sed 's/.*: *//' | tr -d '"')
    echo "$name  L$layer  $role"
  else
    echo "$name  (NO SKILL.md)"
  fi
done
```

Cross-check the output against the target inventory in I.1.2. Any divergence is tracked as refactor debt.

---

**End of Playbook.**

*This document is itself a meta-artifact. Treat it as a reference, not a skill — it does not ship into `.opencode/skills/`. Keep it in `docs/playbooks/` (or wherever your project conventions place reference docs) and update it as the refactor progresses.*
