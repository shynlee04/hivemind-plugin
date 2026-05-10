# Hivemind Skills Refactor Playbook

**Version:** 2.0
**Date:** 2026-04-23 (revised post-GSD Phase 17)
**Supersedes:** v1.0 (2026-04-23) — same day, same worktree, structural revision driven by user-issued corrections captured in `.hivefiver-hm-meta-builder/SKILLS-REFACTORING-REVAMP.md` plus the executed reality of GSD Phase 17 (`.planning/phases/17-hivemind-skills-refactor/`).
**Audience:** Hivefiver orchestrators, skill-authors, agent-builders, and any Devin/OpenCode session operating on the `feature/harness-implementation` (or equivalent) worktree.
**Purpose:** Canonical reference for the skill-improvement and refactoring cycle. Synthesises the Hivemind philosophy (`docs/draft/HIVEMIND-*`), the OpenCode meta-concepts stack, the 3-level-depth coordination model, the validated-only constitution, the skills-audit research artifacts, and the GSD-aligned execution pattern proven in Phase 17 into one actionable playbook.
**Scope:** Skills, agents, commands, rules, permissions, tools, hooks, plugins, MCP servers, LSP, GitHub, and the Hivefiver lab → `.opencode/` → TS-runtime shipping pipeline.

### v2.0 Revision Drivers (what changed vs. v1.0)

1. **Lineage inversion corrected (I.1, I.3).** v1.0 miscast the hivefiver / hiveminder boundary as "hm-meta-builder vs. project-builder — do not touch the other". The corrected model treats **hiveminder** as the runtime consumer of the built-in Hivemind harness plus end-user-authored OpenCode meta-concepts, and **hivefiver** as the hm-meta-builder module whose *exclusive* skills are the hm-meta-builder-group (skill/agent/command/custom-tool authoring, audit, doctor). The rest of the skill catalogue is **cross-over / shared** between both lineages.
2. **Hard-harness truth (I.3).** The current `.md` skill/agent/command files are **pre-runtime drafts**, not a permanent "soft harness". Once the delegation engine stabilises and `refactor/product-detox-concerns` is merged back, they migrate to **code files with Zod schema + SDK** — i.e., a hard harness with TS types. The playbook now treats soft-meta artifacts as **staging** for runtime integration, not an end-state.
3. **6-NON systemic failure modes (I.5).** New mandatory section capturing the six audit-absence patterns that produced the current fragmented skill ecosystem. Every future phase must explicitly show how it defuses all six.
4. **Third-party framework policy (I.6).** `gsd-*`, `superpower-*`, `bmad-*`, `speckit-*` and similar are **reference material, not built-ins**. Beneficial patterns must be re-authored into hm-* skills. Long-term, Hivemind will expose a **bridge-over selector** letting end-users pick one spec-driven framework as a secondary lineage.
5. **Differential skill groups (V.3).** v1.0's "cover everything" mindset is replaced with a **differential target set** — only four group axes demonstrably make the difference (looping/guardrails, spec/TDD, research/investigation/synthesis, debug/refactor/planning/execution). All other skill work is secondary.
6. **hm-\* naming mandate (V.8).** All project-lineage skills adopt the `hm-` prefix, matching the `gsd-` convention. Meta-builder-group skills retain `hivefiver-*` agent names but their underlying skills also carry the `hm-` prefix when they are cross-over. Scheduled for GSD Phase 18.
7. **Phase 0 completion reconciliation (VI.0).** GSD Phase 17 = Playbook Phase 0 is **complete** (C1–C5 resolved, tech-registry schema unified). v2.0 records the delta from the plan-v1.0 table.
8. **CONTEXT-AND-RESEARCH phase (VI.CR).** A new mandatory phase inserted between Phase 0 and Phase 1, designed per the `SKILLS-REFACTORING-REVAMP.md` spec. Every downstream phase depends on its deliverables.
9. **GSD-aligned execution pattern (Part IX).** The CONTEXT → RESEARCH → PLAN → EXECUTE → VERIFICATION → REVIEW loop proven by `.planning/phases/17-hivemind-skills-refactor/` is now the mandated shape for Phases 1–6.
10. **Runtime-integration preparation (VI.6).** A new Phase 6 seals the loop: translate validated skills into Zod config schema + SDK hooks so end-users can compose them at runtime without forking the harness.

---

## How to Read This Playbook

- **Part I — Constitution** is non-negotiable. Read before any write-side action.
- **Part II — Philosophy** is the *why*. Skim on first load; re-read before architectural decisions.
- **Part III — 3-level-depth coordination** is the *who*. Load whenever you delegate.
- **Part IV — OpenCode meta-concepts** is the *what*. Load when composing skills/agents/commands.
- **Part V — Skills Pipeline** is the *how*. Load for every skill write/audit.
- **Part VI — Refactor plan** is the *when*. Drives phase selection. v2.0 records Phase 0 as complete and inserts a CONTEXT-AND-RESEARCH phase before Phase 1.
- **Part VII — Tool usage** is the *with what*. Drives `skill-creator` / `skill-judge` / `skill-writing` invocations.
- **Part VIII — Routing, workflow, iron laws** is the *must-not*. Load on every subagent dispatch.
- **Part IX — GSD-aligned execution pattern** (new in v2.0) is the *execution loop shape*. Every Phase 1–6 plan must mirror it.

Every statement in this playbook is cross-referenced with an evidence file path inside `/home/ubuntu/repos/hivemind-plugin/` (or the user's equivalent worktree). If a statement is not grounded, it is marked `⚠️ synthesised`.

---

# PART I — THE NON-NEGOTIABLE CONSTITUTION

## I.1 Validated-Skills Constitution (MUST)

> **Do NOT assume the end-user has referenced, loaded, or installed any skill unless that skill is physically present in `.hivefiver-hm-meta-builder/skills-lab/active/refactoring/`.**

- Source of truth for *in-flight* skills: `.hivefiver-hm-meta-builder/skills-lab/active/refactoring/` (symlinked into `.opencode/skills/`).
- Source of truth for *global* skill tooling: `~/.agents/skills/skill-creator/` and `~/.agents/skills/skill-judge/` — referenced by `hivefiver-skill-author.md` via the `permission.skill` allow-list and **must be probed at runtime**, never assumed live.
- Source of truth for *retired* skills: `.hivefiver-hm-meta-builder/skills-lab/retired/` — **never load these for runtime work**; they exist only as historical context.

### I.1.1 Runtime probe before any skill reference

Before any agent or orchestrator invokes, stacks, or references a skill by name, it must execute:

```bash
ls .hivefiver-hm-meta-builder/skills-lab/active/refactoring/<skill-name>/SKILL.md 2>/dev/null \
  || echo "FAIL: skill not validated in refactoring lab — do not invoke"
```

If the probe fails, the agent must **either** (a) route the user request to `hivefiver-skill-author` via the hm-meta-builder routing table to create/adopt the skill, **or** (b) decline the stack and report the gap. Silent fall-through to a sibling skill is forbidden.

### I.1.2 The 24-skill inventory (post-Phase-17 reality, 2026-04-23)

The following skills are currently in `.hivefiver-hm-meta-builder/skills-lab/active/refactoring/` and symlinked into `.opencode/skills/` on the `feature/harness-implementation` branch. The "Phase 17 Δ" column records the delta from GSD Phase 17 (= Playbook Phase 0 = C1–C5 + tech-registry unification):

| # | Current Name | Planned Name (Phase 18) | Lineage | Layer | v1.0 Grade | Phase 17 Δ | Target Grade |
|---|--------------|-------------------------|---------|-------|------------|-------------|--------------|
| 1 | `hm-meta-builder` | `hm-hm-meta-builder` | shared | 0 | B+ | +4 depth refs filled (166/125/144/217 LOC) + registered in Ref Map (17-03) | A- |
| 2 | `hivefiver-use-authoring-skills` | `hivefiver-hivefiver-use-authoring-skills` | **hivefiver-exclusive** | 4 | B | — | A |
| 3 | `hivefiver-agents-and-subagents-dev` | `hivefiver-hivefiver-agents-and-subagents-dev` | **hivefiver-exclusive** | 2 | D | — | B |
| 4 | `hivefiver-command-dev` | `hivefiver-hivefiver-command-dev` | **hivefiver-exclusive** | 2 | D (PASS) | — | B |
| 5 | `hivefiver-custom-tools-dev` | `hivefiver-hivefiver-custom-tools-dev` | **hivefiver-exclusive** | 2 | D (PASS) | — | B |
| 6 | `hm-coordinating-loop` | `hm-hm-coordinating-loop` | shared | 1 | A | — | A |
| 7 | `hm-phase-loop` | `hm-hm-phase-loop` | shared | 2 | D | — | B |
| 8 | `hm-planning-with-files` | `hm-hm-planning-with-files` | shared | 1 | PASS | — | A |
| 9 | `hm-user-intent-interactive-loop` | `hm-hm-user-intent-interactive-loop` | shared | 1 | A | — | A |
| 10 | `hm-opencode-platform-reference` | `hm-hm-opencode-platform-reference` | shared | 3 | C+ | — | B |
| 11 | `hm-opencode-non-interactive-shell` | `hm-hm-opencode-non-interactive-shell` | shared | 2 | C (PASS / gold) | — | A |
| 12 | `hm-omo-reference` | `hm-omo-reference` | shared | 3 | D | +tech-stack.md (81 LOC) generated; 0 dead refs verified; C4 resolved at 674 LOC (17-04) | B |
| 13 | `hm-deep-research` | `hm-deep-research` | hiveminder-leaning (shared) | 2 | C+ (gold) | +Version-Matched Context7 Research section + `research-patterns.md` pattern (17-05) | A |
| 14 | `hm-detective` | `hm-detective` | hiveminder-leaning (shared) | 2 | — | +SCAN (Tech Stack) 4th reading mode; canonical `.tech-registry.json` schema source (17-05) | B |
| 15 | `hm-synthesis` | `hm-synthesis` | hiveminder-leaning (shared) | 2 | — | +Tech-Stack Detection section; `artifact-export.md` unified to hm-detective schema (17-05) | B |
| 16 | `hivefiver-context-absorb` | `hivefiver-context-absorb` | **hivefiver-exclusive** | 1 | — | — | B |
| 17 | `hm-opencode-project-audit` | `hm-opencode-project-audit` | shared | 2 | — | — | B *(rename)* |
| 18 | `harness-delegation-inspection` | `hm-subagent-delegation-patterns` + `hm-opencode-project-inspection` | shared | 2 | — | — | *(split)* |
| 19 | `hivefiver-delegation-gates` | `hivefiver-delegation-gates` | **hivefiver-exclusive** | 2 | — | — | B *(rename)* |
| 20 | `hm-agent-composition` | `hm-agent-composition` *(re-authored, see I.6)* | shared | 2 | — | — | B |
| 21 | `hm-command-parser` | `hm-hm-command-parser` | shared | 2 | C (PASS) | — | A |
| 22 | `hm-agents-md-sync` | `hm-hm-agents-md-sync` | shared | 2 | — | — | — |
| 23 | `session-context-manager` | *(merge → `hm-hm-planning-with-files`)* | shared | — | FAIL | — | *(merge)* |
| 24 | `hm-skill-synthesis` | `hm-hm-skill-synthesis` | **hivefiver-exclusive** | 3 | *(was retired)* | **RESTORED** from `retired/` → `active/refactoring/` (17-01); 174 LOC SKILL.md, 5 refs, 7 scripts, 2 evals, 2 templates | B |

**Retired (partially salvageable per user policy — see I.6):** `repomix-exploration-guide`, `repomix-explorer`, `research-operations`. These are broken-but-usable archives; beneficial patterns must be re-authored into hm-* skills, not restored verbatim.

Source: `.hivemind/research/skills-audit/planning/target-architecture-2026-04-09.md`, `.hivemind/research/skills-audit/planning/master-revamp-plan-2026-04-09.md`, `.planning/phases/17-hivemind-skills-refactor/` (execution reality).

> ⚠️ **Runtime verification required.** Count, names, and grades drift. The *current state* is always determined by `ls .hivefiver-hm-meta-builder/skills-lab/active/refactoring/` + fresh `skill-judge` grading, not by this table.

### I.1.3 Phase 17 Completion Snapshot (what Phase 0 actually delivered)

From `.planning/phases/17-hivemind-skills-refactor/17-VERIFICATION.md` (status: PASS):

| Critical | Resolution | Commit(s) |
|----------|-----------|-----------|
| C1 — `validate-gate.sh synthesize` pointed to a retired skill | `hm-skill-synthesis` moved from `retired/` → `active/refactoring/`; `.opencode/skills/hm-skill-synthesis` resolves; `hm-meta-builder` routing table line 323 still references it | `5a8299a3` |
| C2 — 4 hm-meta-builder depth references were 12–18-LOC stubs | All filled with 125–217 LOC of real content + registered in the SKILL.md Reference Map with loading triggers | `50044c41` |
| C3 — phantom `tech-stack.md` in `hm-omo-reference` | `references/tech-stack.md` generated (81 LOC) from packed repo metadata; `SKILL.md` updated with Tech Stack Quick Reference + table entry | `(in 17-04)` |
| C4 — "empty" `project-structure.md` | Verified **already resolved** — file is 674 LOC, not a stub. Marked closed. | `(no-op)` |
| C5 — duplicate skills across `.claude/` and `.opencode/` | `.claude/skills/` confirmed absent. IDE sync artifacts (`.trae/`, `.windsurf/`, `.codex/`, `.github/skills/`) gitignored; `AGENTS.md` documents `.opencode/skills/` as the only canonical project location. | `06c30332` |
| **BONUS** — `.tech-registry.json` schema drift between `hm-detective` and `hm-synthesis` | Unified on the `hm-detective` schema (`project`/`last_updated`/`stack`/`concerns`/`modules`); `hm-synthesis/references/artifact-export.md` migrated; `hm-deep-research` consumer pattern documented; `hm-detective` SCAN mode added | `1e3bde8d` |

**Phase 17 hard constraints respected:** zero `src/` code changes, zero agent/command refactors, zero IDE-directory modifications. Only soft meta-concept edits. This is the template for Phases 1–6.

## I.2 Iron Laws (from `.hivefiver-hm-meta-builder/AGENTS.md`)

1. **NO DIRECT CREATION WITHOUT DELEGATION** — primary coordinators never write SKILL.md / agent / command files directly. Route to specialists.
2. **NO STACK WITHOUT A REASON** — max 3 skills per agent turn. Explain why each is needed.
3. **NO SUBAGENT WITHOUT CONSTRUCTED CONTEXT** — full task text + scene-setting + scope. **Never** pass session history.
4. **NO SKILL WITHOUT TRIGGER PHRASES** — the `description` frontmatter field is the only thing agents see at runtime. Without trigger phrases, the skill is dead on arrival.
5. **EVERY COMMAND SURVIVES `CI=true`** — no TTY-dependent operations. Non-interactive shell safety.
6. **NO DEAD REFERENCES** — every file path, script, skill, or command referenced from a SKILL.md body must exist.
7. **NO BIG-BANG REWRITES** — one skill/agent/command at a time. Validate. Commit. Move on.

## I.3 The Two-Halves Boundary (corrected in v2.0)

### I.3.1 Hard Harness vs. Staging Meta-Concepts

| Half | What | Where | Mutability |
|------|------|-------|------------|
| **Hard Harness** (current) | npm package `opencode-harness`: tools (write-side CQRS), hooks (read-side CQRS), plugin assembly, shared leaf modules, Zod schemas | `src/` → `dist/` | Versioned, ships via npm. Agents DO NOT edit except through dedicated phase work. |
| **Staging Meta-Concepts** (today) | skills, agents, commands, rules, permissions authored as `.md` files | `.hivefiver-hm-meta-builder/*-lab/active/refactoring/` → symlinked into `.opencode/` | Lab → symlink → live OpenCode testing → commit. These are **pre-runtime drafts**. |
| **Hard Harness** (post-migration) | The same skills/agents/commands expressed as TS modules with Zod-validated config + SDK hooks exposed to end-users | `src/hivefiver/*`, `src/hiveminder/*` (planned) | Shipped as typed API. Users configure via JSON/TS, not by editing `.md`. |

> **v1.0 called Half 2 "Soft Meta-Concepts" and implied `.md` files were the end-state. That is wrong.** The `.md` files are **staging** for runtime integration. When the delegation engine stabilises and `refactor/product-detox-concerns` is merged back, the validated skill/agent/command bodies become **code files with Zod schema + SDK**, giving end-users a typed configuration surface instead of free-form markdown editing. Everything in this playbook is written to make that migration mechanical, not a rewrite.

### I.3.2 Lineage Truth: hivefiver vs. hiveminder vs. shared

The two "lineages" are **not two parallel product modules that must never touch each other**. They are two *consumption modes* over a shared catalogue:

| Lineage | Consumer | Exclusive skill/agent groups |
|---------|----------|------------------------------|
| **hivefiver** (hm-meta-builder module) | End-user sessions asking Hivemind to *configure, customise, stack, doctor, or chain* OpenCode meta-concept primitives — without forking the harness. | Meta-builder-group only: skill authoring / agent+subagent authoring / command authoring / custom-tool authoring + the audit & doctor skills that police them (e.g. `hivefiver-skill-author`, `hivefiver-agent-builder`, `hivefiver-command-builder`, `hivefiver-hivefiver-use-authoring-skills`, `hivefiver-delegation-gates`, `hivefiver-context-absorb`). |
| **hiveminder** (project-builder module) | End-user sessions building real projects on top of the Hivemind harness (NextJS apps, data pipelines, plugins, etc.). Consumes the built-in Hivemind harness plus the meta-concept primitives produced via hivefiver. | None exclusively — hiveminder leans on the shared catalogue plus the harness-native runtime. |
| **shared / cross-over** | Both lineages. This is the majority of the catalogue. | Everything else: routing, coordination, planning, research, detection, synthesis, audit, platform references, non-interactive shell, etc. |

**Why the v1.0 framing confused us:** we are currently *using the harness to build itself*, so hivefiver-exclusive skills get invoked during harness development too. That is a **temporary operational reality**, not a permanent lineage claim. Once the harness ships its SDK, end-users will still invoke hivefiver when customising meta-concepts and hiveminder when building products, with the shared catalogue serving both.

**Operational rule:**
1. Any skill in the **hm-meta-builder-group** must be picked **only by hivefiver orchestrators / subagents**. A hiveminder project-builder session picking `hivefiver-skill-author` is a routing bug.
2. Any skill in the **shared catalogue** must be pickable by both — with identical behaviour — or it is mis-scoped and needs splitting.
3. No skill may silently assume it is running under a specific lineage. Lineage context arrives through the delegation envelope, not through implicit state.

## I.4 The Skills-Lab → `.opencode/` → TS-runtime Pipeline

```
.hivefiver-hm-meta-builder/**-lab/active/refactoring/     ← EDIT HERE (source of truth, staging)
        ↓ (symlinks, instant)
.opencode/{agents,commands,skills,hivefiver}/          ← LIVE TEST (OpenCode reads here)
        ↓ (when validated + graded)
TS runtime builder (opencode-harness npm package)      ← FINAL SHIP as Zod-typed SDK
        ↓ (when end-user configures)
User's opencode.json / opencode-harness.config.ts       ← RUNTIME COMPOSITION by end-users
```

- Never edit files inside `.opencode/` directly — they are symlinks.
- Every edit lands in the lab; every commit covers lab + any harness-code changes together.
- The TS-runtime packer is the responsibility of `hivefiver-tool-builder` + `builder`, not `hivefiver-skill-author`.
- Phase 6 (new in v2.0) is where validated skills flow from stage 2 → stage 3 (code + SDK).

## I.5 The 6-NON Systemic Failure Modes (why v1.0 produced fragmented skills)

Every skill built without explicit defences against the following six "NON-" modes will regress toward incomplete / conflicting / overlapping / context-poisoning behaviour. Every future phase must document, per skill, how it defuses **all six** before the skill can be graded ≥ B.

| ID | Failure Mode | What it looks like in a skill | Defence |
|----|--------------|-------------------------------|---------|
| **NON-1** | **Non-audit** — skill written without systematically auditing parent → child → state → stage across the 3-level-depth delegation model | Generic SKILL.md body with no evidence that the author walked the coordination tree; body repeats what the agent already knows | Mandatory pre-authoring audit pass (see Phase CR) that produces a `skill-audit-<name>.md` note with the parent/child/state/stage map. Skill body cites it. |
| **NON-2** | **Non-mapping** — no classification / grouping against the actual complex-project reality; skill exists in isolation from the skill ecosystem | SKILL.md has no "stacks with / clashes with" section; description is interchangeable with a sibling | Every skill must fill the delta-map (what it adds vs. nearest sibling) and register its stack-compatibility in `check-overlaps.sh`. |
| **NON-3** | **Non-starting-pipelines / non-cycles** — the skill teaches a monolithic procedure instead of placing itself inside a pipeline with explicit starts and cycles | "Do step 1, step 2, step 3" with no entry gate, no exit gate, no loop-back | Skill body must include: entry trigger, exit criterion, loop-back path for `DONE_WITH_CONCERNS`/`BLOCKED`, handoff envelope for the next stage. |
| **NON-4** | **Non-hierarchy** — skill has no opinion on which hierarchy layer picks it; ends up picked by both front-facing orchestrators and level-3 task-completers, producing opposite behaviour | `metadata.layer` missing or set incorrectly; description contains triggers that fire for both "plan X" and "do X" | Frontmatter must declare `metadata.layer` and `metadata.role`; description must contain at least one exclusion (`NOT for …`) that prevents cross-layer pickup. |
| **NON-5** | **Non-ecosystem-evaluation** — skill passes `validate-skill.sh` in isolation but was never evaluated as part of a stacked workflow | Skill works in trigger-query evals, fails the moment it is loaded with `hm-coordinating-loop` + `hm-planning-with-files` | Eval suite must include at least one *stacked* scenario reflecting a real GSD phase, not just isolated prompts. |
| **NON-6** | **Non-systematic pattern choice** — P1 / P2 / P3 picked ad-hoc; scripts bundled without edge-case coverage; references written without progressive disclosure | SKILL.md is 800 LOC of prose, or 40 LOC shell with 12 unused reference files | Pattern decision must be documented in `task_plan.md` with the four axes: size of body, number of decision branches, whether scripts are deterministic, whether reference loading needs progressive disclosure. |

> **Every phase deliverable must include a 6-NON defence table.** A skill that cannot show its defences in writing is not accepted, regardless of `skill-judge` grade.

## I.6 Third-Party Framework Policy (re-author, do not adopt)

Skills and agents prefixed with `gsd-*`, `superpower-*`, `bmad-*`, `speckit-*`, and similar third-party spec-driven frameworks are **reference material, not Hivemind built-ins**. They currently live in `.opencode/get-shit-done/` (for GSD) and in retired archives (for superpower patterns).

**Policy:**
1. **Do not restore third-party skills verbatim.** If a pattern is beneficial, re-author it into an `hm-*` skill with the pattern rebuilt on Hivemind primitives (hm-coordinating-loop, hm-planning-with-files, hm-detective, hm-synthesis, etc.).
2. **`hm-agent-composition` is the one surviving exception** in the current catalogue; Phase 19 will re-author it as `hm-agent-composition` and retire the `gsd-` name (the harness ships its own agent-composition skill; users who still want the GSD flavour keep it as a sidecar in `.opencode/get-shit-done/`).
3. **Retired skills in `.hivefiver-hm-meta-builder/skills-lab/retired/`** are "broken-but-usable archives". Salvage patterns, do not restore files. The one exception already executed was `hm-skill-synthesis` in Phase 17 (17-01), which was salvaged because its integration points were still live and its structure was intact.
4. **Long-term bridge-over.** Once the harness ships (Phase 6 + beyond), end-users will be able to select one spec-driven framework (GSD, BMAD, Speckit, any future compatible one) as a **secondary lineage** via `opencode-harness.config.ts`. That selector is the only sanctioned place for `gsd-*` / `bmad-*` / `speckit-*` names to leak into a running project. It is explicitly **not** implemented as more skills — it is implemented as a runtime-config switch that mounts the chosen framework's own SKILL.md tree under a namespaced path.

**Anti-pattern to reject on sight:** any PR that adds a new skill with `gsd-`, `superpower-`, `bmad-`, or `speckit-` prefix to `.hivefiver-hm-meta-builder/skills-lab/active/refactoring/` or `.opencode/skills/`.

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
| Soft Meta — permissions (`opencode.json`) | Access | Per-agent tool/skill/command allow/ask. |

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

This section defines the canonical agent classification for Hivemind-on-OpenCode. It synthesises the user-prompted `3-level-depth coordination` model, the `orchestrator / specialist / subagent` hierarchy from `HIVEMIND-AGENTS-2026-04-10.md` §1, and the `hivefiver-orchestrator → specialist → subagent` dispatch protocol from `.hivefiver-hm-meta-builder/AGENTS.md`.

## III.1 The Four Classifications

### Level 1 — Primary Coordinator

| Attribute | Value |
|-----------|-------|
| Role | Front-facing almighty strategist. The user talks to this agent via `Tab`. |
| Examples | `coordinator`, `conductor`, `hivefiver-orchestrator` |
| File location | `.hivefiver-hm-meta-builder/agents-lab/active/refactoring/{coordinator,conductor,hivefiver-orchestrator}.md` |
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
| Examples | An OMO-style `call-omo-agent` pattern; a `hivefiver-skill-author` orchestrating its own `critic` + `researcher` subagents; a wave coordinator inside `hm-coordinating-loop`. |
| File location | `.hivefiver-hm-meta-builder/agents-lab/active/refactoring/{hivefiver-skill-author,hivefiver-agent-builder,hivefiver-command-builder}.md` |
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
| Examples | `explore` (fast codebase scan); `gsd-codebase-mapper`, `gsd-phase-researcher`, `gsd-plan-checker`; the parallel fan-out inside `hivefiver-context-absorb` waves 1 & 2. |
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
| `hivefiver-skill-author` | read, glob, grep, webfetch | edit, write (SKILL.md + bundles) | bash (ask; explicit allow-list for git/ls/find/cat/grep/rm/mkdir/cp) | task: ask; skill: `hivefiver-use-authoring-skills`, `skill-judge`, `skill-creator`, `hm-opencode-platform-reference` only |
| `hivefiver-agent-builder` | same as skill-author | edit, write (agent .md) | same | task: ask |
| `hivefiver-command-builder` | same | edit, write (commands) | same | task: ask |

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
| Agents | `/agents/`, `/config/`, `/rules/` | `.hivefiver-hm-meta-builder/agents-lab/active/refactoring/` |
| Commands | `/commands/`, `/commands/#prompt-config`, `/commands/#shell-output`, `/commands/#agent`, `/commands/#subtask` | `.hivefiver-hm-meta-builder/commands-lab/active/refactoring/` |
| Skills | `/skills/` | `.hivefiver-hm-meta-builder/skills-lab/active/refactoring/` |
| Tools | `/tools/` | `src/tools/` (hard harness) + `hivefiver-custom-tools-dev` skill (user-authored) |
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
- `task: ask` for level-3 task-completers; `task: allow` only for level-1/level-2.
- `skill: "*": ask` + explicit allow-list of skill names. Never `"*": allow`.

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

Skills that *require* Hivemind primitives (e.g., `hivefiver-context-absorb`, `hm-coordinating-loop`) must declare this in their frontmatter `metadata.requires-harness: true` and gate themselves with a runtime probe.

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

### V.3.1 The two axes (retained from v1.0)

| Group | Character | Example skills | Failure mode |
|-------|-----------|----------------|---------------|
| **Group 1 — How-to-Process** | Coordination, orchestration, verification, gatekeeping, iterative loops, review cycles. Must teach **validation conditions**. | `hm-hm-coordinating-loop`, `hm-hm-phase-loop`, `hm-hm-user-intent-interactive-loop`, `hm-hm-planning-with-files`, `hm-hm-meta-builder`, `hivefiver-hivefiver-use-authoring-skills`, `hivefiver-delegation-gates`, `hm-opencode-project-audit` | Generic language; no edge cases; mechanical-feeling; does not stack with hierarchy skills |
| **Group 2 — How-to-Implement** | Tactical/expert tasks with specific tech patterns. Advanced patterns applied in depth. | `hivefiver-hivefiver-command-dev`, `hivefiver-hivefiver-custom-tools-dev`, `hivefiver-hivefiver-agents-and-subagents-dev`, `hm-deep-research`, `hm-detective`, `hm-synthesis`, `hm-hm-opencode-non-interactive-shell`, `hm-hm-command-parser`, `hm-hm-skill-synthesis`, `hm-eval-driven-development` | Generic AI-written tone; throws document links instead of showing steps; no stacking guidance |

### V.3.2 The differential target set (new in v2.0 — do not try to "cover" everything)

v1.0 treated every gap in the catalogue as equally worth filling. The user audit after Phase 17 was explicit: **only four clusters demonstrably make the difference between a harness that works and one that regresses**. Phases 1–5 prioritise these; the rest is secondary debt.

| Cluster | Why it matters | What the catalogue must deliver (hm-* names) | Current state |
|---------|---------------|-----------------------------------------------|---------------|
| **G-A — Looping / guardrails / gatekeeping / self-verification / subagent delegation** | The harness lives or dies by its ability to loop until completion without regressions. This is the cluster v1.0 most aggressively underbuilt. | `hm-hm-coordinating-loop` (exists — needs hardening); `hm-hm-phase-loop` (D → B); `hm-completion-looping` (**NEW** — non-regression guardrail + subagent dispatch + self-verification envelope); `hm-delegation-gates` (rename of `hivefiver-delegation-gates`); `hm-subagent-delegation-patterns` (split from `harness-delegation-inspection`) | Partial — core skills exist as placeholders; completion-looping skill missing entirely |
| **G-B — Spec-driven + test-driven development** | Current skills make vague claims about "spec compliance" and "TDD" with no integration to planning artifacts or real test commands. The user called these "full of lies". | `hm-spec-driven-authoring` (**NEW** — turn a SPEC into falsifiable requirements + tests); `hm-test-driven-execution` (**NEW** — red-green-refactor integrated with `hm-hm-planning-with-files` + `hm-hm-phase-loop`); `hm-eval-driven-development` (rename of `eval-harness`) | Mostly absent — eval-driven has a scaffold; spec-driven and test-driven need to be authored from scratch |
| **G-C — Research / investigation / synthesis** | Fragmented today: three skills (`hm-deep-research`, `hm-detective`, `hm-synthesis`) share a tech-registry but do not teach MCP-tool sequencing or cross-skill chaining with OpenCode built-ins (`webfetch`, `glob`, `grep`, `skill`, `todowrite`). | `hm-deep-research` (gold → A, plus MCP matrix); `hm-detective` (add chaining patterns with OpenCode built-ins); `hm-synthesis` (add compression tiers × tool matrix); `hm-research-chain` (**NEW** — short meta-skill showing the canonical chain: detective → deep-research → synthesis → artifact) | Integration partially delivered by Phase 17 (shared schema); chaining + MCP patterns still missing |
| **G-D — Debug / refactor / planning / execution** | Everything outside GSD's own `gsd-*` tree is, in the user's words, "trash". Hivemind must have its own opinionated debug/refactor/planning/execution skills native to the harness. | `hm-debug` (**NEW** — systematic debugging with persistent state); `hm-refactor` (**NEW** — surgical vs. structural refactor taxonomy); `hm-hm-planning-with-files` (existing; raise to A); `hm-phase-execution` (**NEW** — wave-based execution loop mirroring GSD's pattern but native) | Mostly absent — only `hm-hm-planning-with-files` exists. All others need to be authored against GSD's pattern and re-expressed in Hivemind's primitives (per I.6 third-party policy) |

**Prioritisation rule:** a phase is not allowed to deliver Group-B / Group-2 work on shared skills if any **G-A / G-B / G-C / G-D** critical gap remains open. Exceptions require explicit user approval and a `deferred-<phase>.md` note.

**Coverage banned (reject on sight):** phases titled "broad skill-quality sweep", "description rewrite for all skills", "100% eval coverage" that do not prioritise the four differential clusters first. v1.0's "Description Rewrite Sprint" is allowed **only** for skills inside the differential clusters; the rest are parked.

### V.3.3 Banned keywords in descriptions

(Retained from v1.0, applies to all clusters.)

**Banned in description** (immediate fail): "grep", "glob", "quick-search" keywords. These produce false keyword-matches and are a common deception vector. (`SKILL-CRITERIA-SHORT.md` sidebar.) Also banned: "This skill should be used when …" openers, any internal harness vocabulary (`OMO`, `GSD`, `/hf-*`, `hivefiver-*` as trigger, `harness`).

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
| 0 | Router / dispatcher — only picked by level-1 primary | `hm-meta-builder` |
| 1 | Orchestration methodology — picked by primary OR pure-orchestrators | `hm-coordinating-loop`, `hm-user-intent-interactive-loop`, `hm-planning-with-files`, `hivefiver-context-absorb` |
| 2 | Domain execution — picked by pure-orchestrators OR level-3 task-completers | `hivefiver-command-dev`, `hivefiver-custom-tools-dev`, `hm-detective`, `hm-synthesis`, `hm-deep-research`, `hm-phase-loop`, `hm-skill-synthesis`, `hm-opencode-non-interactive-shell` |
| 3 | Reference — read-only knowledge; any layer may reference | `hm-opencode-platform-reference`, `hm-omo-reference` |
| 4 | Meta-authoring — used exclusively by `hivefiver-skill-author` | `hivefiver-use-authoring-skills` |

Hierarchy mismatch = Gate 5 failure. Cross-batch synthesis (2026-04-09) flagged `hm-phase-loop` (claims L2, used as L1), `session-context-manager` (claims L2, is sub-component), `harness-delegation-inspection` (claims L1, covers 4 concerns → split).

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

- **hm-meta-builder** — "Route OpenCode meta-concept requests to specialist authoring skills. Use when creating, auditing, stacking, or configuring skills, agents, commands, or tools. NOT for direct implementation."
- **hivefiver-use-authoring-skills** — "Author, audit, and score OpenCode skills using TDD workflow and quality rubrics. Use when writing a new skill, fixing frontmatter, checking skill quality, or running evals. NOT for agent or command authoring."
- **delegation-gates** (renamed from `hivefiver-delegation-gates`) — "Enforce pre-delegation authorization gates before agent dispatch. Use when setting up checkpoint gates, defining capability matrices, or validating agent permissions. NOT for orchestration execution."
- **opencode-project-audit** (renamed from `hm-opencode-project-audit`) — "Audit OpenCode projects across skills, commands, tools, permissions, agents, and subagents. Use when checking boundaries, verifying architecture, or validating setup. NOT for code review."
- **eval-driven-development** (renamed from `eval-harness`) — "Implement eval-driven development with define-run-grade-improve cycles. Use when writing evals, benchmarking skill quality, or measuring trigger accuracy. NOT for general testing."

## V.8 The `hm-*` Naming Mandate (new in v2.0)

**Decision (user-locked for Phase 18):** every project-lineage and shared skill adopts the `hm-*` prefix, matching the `gsd-*` convention used by the GSD reference tree. The hm-meta-builder-group (hivefiver-exclusive) skills instead adopt the `hivefiver-*` prefix. Final catalogue names are listed in the "Planned Name (Phase 18)" column of I.1.2.

### V.8.1 Prefix policy

| Prefix | Scope | Example |
|--------|-------|---------|
| `hm-*` | Project / shared catalogue (hiveminder-facing + cross-over) | `hm-hm-coordinating-loop`, `hm-deep-research`, `hm-detective`, `hm-hm-planning-with-files`, `hm-hm-phase-loop` |
| `hivefiver-*` | Meta-builder-group (hivefiver-exclusive) | `hivefiver-skill-author`, `hivefiver-agent-builder`, `hivefiver-command-builder`, `hivefiver-hivefiver-use-authoring-skills`, `hivefiver-delegation-gates` |
| `gsd-*` | **Reserved for reference only** — do NOT use for new Hivemind skills (see I.6) | `hm-agent-composition` (to be re-authored as `hm-agent-composition`) |
| `bmad-*`, `speckit-*`, `superpower-*`, etc. | Forbidden as Hivemind skill names. Only legal inside third-party sidecars under `.opencode/<framework>/`. | — |

### V.8.2 Why prefix at all

1. **Runtime discoverability.** Users typing `skill hm-` in OpenCode get a clean list of Hivemind skills; `skill hivefiver-` reveals the hm-meta-builder surface; nothing else leaks.
2. **Authoring discipline.** Every new skill must make a lineage decision *up front*. The prefix is the cheapest lineage-declaration mechanism.
3. **Phase 6 migration clarity.** When skills become TS modules, the namespace falls out naturally: `src/hivemind/skills/hm-coordinating-loop.ts`, `src/hivefiver/skills/skill-author.ts`.

### V.8.3 Rename plan guardrails

- Renames happen in **Phase 18 (= GSD Phase 18 = Playbook Phase 1)** only. Never during Phases 2–5.
- Rename = directory move + symlink regeneration + update every call-site (routing table, `.opencode/agents/*.md` permission lists, `.opencode/get-shit-done/workflows/*` references, documentation).
- Every rename is its own atomic commit. The 24 current skills rename into at most 24 commits.
- A rename MUST preserve the `description` trigger phrases (description-rewrite sprint is a later phase). If triggers need updating, that is a separate commit per skill.
- `check-overlaps.sh` must run after every rename to detect stale trigger collisions.

### V.8.4 Exceptions

- `hm-meta-builder` → `hm-hm-meta-builder` loses the 3-word-kebab constraint if it grows to 4 tokens. Accepted because this is the Layer-0 router and its name ships in the routing table.
- Already `hm-*`-prefixed skills (`hm-deep-research`, `hm-detective`, `hm-synthesis`) are unchanged. Already implicitly `hivefiver-*`-prefixed skills (`hivefiver-context-absorb`) get a single rename to the full prefix.

---

# PART VI — THE REFACTORING PROGRAM (v2.0 — supersedes v1.0 VI.1–VI.7)

Source: `.hivemind/research/skills-audit/planning/master-revamp-plan-2026-04-09.md`, `.hivemind/research/skills-audit/planning/target-architecture-2026-04-09.md`, `.hivemind/research/skills-audit/synthesis/cross-batch-findings-2026-04-09.md`, `.planning/phases/17-hivemind-skills-refactor/` (execution evidence), `SKILLS-REFACTORING-REVAMP.md` (v2.0 14-section spec for the Context & Research phase).

## VI.0 Phase 0 — Critical Fixes (STATUS: COMPLETE — delivered as GSD Phase 17)

Phase 0 is **closed**. It was executed in five sub-phases 17-01 through 17-05 on the `feature/harness-implementation` branch and verified in `.planning/phases/17-hivemind-skills-refactor/17-VERIFICATION.md` (status: PASS; review `.../17-REVIEW.md` status: 0 critical / 0 warning / 0 info findings across 33 files).

### VI.0.1 Critical issues resolved

| ID | Original Issue | Resolution | Sub-phase | Commit |
|----|-----------------|------------|-----------|--------|
| C1 | `validate-gate.sh synthesize` pointed at retired skill | `hm-skill-synthesis` restored from `retired/` → `active/refactoring/`; 174 LOC SKILL.md + 5 refs + 7 scripts + 2 evals + 2 templates intact; `.opencode/skills/hm-skill-synthesis` resolves; `hm-meta-builder` routing table line 323 still reaches it | 17-01 | `5a8299a3` |
| C2 | 4 hm-meta-builder depth references were 12–18-LOC stubs | `depth-repo-analysis.md` (166 LOC), `depth-github-stacks.md` (125 LOC), `depth-built-in-tools.md` (144 LOC), `depth-hm-skill-synthesis.md` (217 LOC) authored with real procedural content, loading triggers, edge cases; Reference Map entries added | 17-03 | `50044c41` |
| C3 | Phantom `tech-stack.md` in `hm-omo-reference` | `references/tech-stack.md` generated (81 LOC) from packed repo metadata; Tech Stack Quick Reference section added to SKILL.md; reference table updated; link now resolves | 17-04 | *(17-04 commit)* |
| C4 | "Empty" `project-structure.md` (4 LOC) | Verified already resolved — file is 674 LOC, not a stub. Closed as no-op. | 17-04 | *(no-op)* |
| C5 | Duplicate skills across `.claude/` vs `.opencode/` | `.claude/skills/` confirmed absent. IDE sync artifacts (`.trae/`, `.windsurf/`, `.codex/`, `.github/skills/`) added to `.gitignore`; `AGENTS.md` declares `.opencode/skills/` as the only canonical project location | 17-02 | `06c30332` |
| **BONUS — B1** | `.tech-registry.json` schema drift across `hm-detective`, `hm-synthesis`, `hm-deep-research` | Unified on the `hm-detective` schema (`project` / `last_updated` / `stack` / `concerns` / `modules`). `hm-synthesis/references/artifact-export.md` migrated. `hm-deep-research` received a `research-patterns.md` Version-Matched Context7 Research Pattern. `hm-detective` received a SCAN (Tech Stack) reading mode. | 17-05 | `1e3bde8d` |

### VI.0.2 Phase 0 execution metrics (= template for Phases 1–5)

| Metric | Target | Actual |
|--------|--------|--------|
| Plans executed | 5 | 5/5 |
| Commits per sub-phase | 1 atomic | 1 atomic each (5 total) |
| `src/` changes | 0 | 0 |
| Agent / command refactors | 0 | 0 |
| IDE-dir modifications | 0 | 0 |
| Code-review findings | 0 critical | 0/0/0 |
| UAT criteria met | 100% | 100% (all REQ-17-0x met, all D-01..D-16 covered) |

**Lesson locked for all downstream phases:** the discipline that made Phase 0 land cleanly — atomic-per-plan commits, zero-src-changes constraint, explicit sub-phase SUMMARYs, and a verification doc enumerating every decision — is mandatory for Phases 1–5. See Part IX for the required loop.

## VI.CR Phase CR — CONTEXT & RESEARCH (new, mandatory, must complete before Phase 1)

Per `SKILLS-REFACTORING-REVAMP.md`, the 14 sections below form the required contract for Phase CR. The phase exists to prevent the 6-NON failures (I.5) from regressing the downstream phases. Phase CR does **not** refactor skills; it produces the evidence base and audit posture that Phases 1–5 consume.

### VI.CR.1 Phase Purpose
Provide a single source of truth for (a) the current skill ecosystem's real state, (b) the deltas required per differential cluster (V.3.2), (c) the third-party patterns that will be re-authored into `hm-*` (per I.6), and (d) the runtime-integration readiness for Phase 6.

### VI.CR.2 Position in the Program
Between Phase 0 (complete) and Phase 1. No Phase 1 plan may be written until Phase CR's deliverables are merged.

### VI.CR.3 Scope
**In:** every active skill (`.hivefiver-hm-meta-builder/skills-lab/active/refactoring/`), every retired skill partial (archive review), every third-party reference tree (`.opencode/get-shit-done/`, any superpower/bmad/speckit trees present), every call-site of each skill (routing table + agent permission lists + workflow files + command bodies).
**Out:** `src/` code changes; agent/command refactors; new skill authoring. Those belong to later phases.

### VI.CR.4 Core Principles
1. Every claim must be grounded in a fresh runtime probe (`ls`, `grep`, `wc -l`), not in cached memory or v1.0 tables.
2. Every finding must map to at least one 6-NON failure mode (I.5) or to one differential cluster (V.3.2). Unmapped findings are noise, reject them.
3. No third-party content is copied verbatim — patterns are abstracted and attributed.
4. Evidence is file-and-line-cite, not prose.

### VI.CR.5 Context Model (what counts as "context")
The 3-level delegation hierarchy (front-facing orchestrator → pure-orchestrator → task-completer) times the 6-NON axes times the 4 differential clusters. Any finding that does not place itself on this grid is under-specified.

### VI.CR.6 Research Model (how research is conducted)
Canonical chain: `hm-detective` (SCAN) → `hm-deep-research` (version-matched + MCP matrix) → `hm-synthesis` (compression + artifact export) → `hm-hm-skill-synthesis` (pattern extraction if needed). Each skill writes to the unified `.tech-registry.json` established in 17-05. No research is performed with ad-hoc grep-and-read outside this chain.

### VI.CR.7 Skills-First Priorities
1. G-A (looping / guardrails / gatekeeping) — highest priority. Missing entirely.
2. G-B (spec-driven + test-driven) — highest priority. Currently dishonest.
3. G-C (research / investigation / synthesis) — high priority. Partially delivered by 17-05.
4. G-D (debug / refactor / planning / execution) — high priority. Mostly absent.
5. Description-rewrite sprint + eval coverage expansion — secondary. Parked unless inside a G-A..G-D skill.

### VI.CR.8 Hivefiver vs Hiveminder Impact Mapping
Every Phase CR finding must declare its impact as one of: `hivefiver-exclusive` (hm-meta-builder-group only), `hiveminder-primary` (project-builder-leaning), `shared`. Findings that affect multiple lineages must list them all. Findings without a lineage label are rejected.

### VI.CR.9 Tooling Decision Framework
For every skill in a differential cluster, Phase CR must decide whether the skill needs: (a) no change, (b) description-only rewrite, (c) body rewrite, (d) bundle expansion (new references/scripts/evals), (e) rename (Phase 1), (f) split, (g) merge, (h) creation, (i) retirement. Decisions are recorded in `.planning/phases/CR-context-and-research/CR-DECISIONS.md` with evidence citations.

### VI.CR.10 Deliverables
1. `CR-CONTEXT.md` — the phase-level context envelope mirroring 17-CONTEXT.md.
2. `CR-RESEARCH.md` — the grounded research document consuming the detective→deep-research→synthesis chain.
3. `CR-AUDIT-ECOSYSTEM.md` — per-skill 6-NON defence posture (audit grid).
4. `CR-GAP-MAP.md` — one row per differential-cluster gap, with owning phase + severity.
5. `CR-THIRD-PARTY-HARVEST.md` — patterns salvaged from `gsd-*` / `superpower-*` / retired skills, re-authored into hm-* pseudocode (no files written yet).
6. `CR-RUNTIME-READINESS.md` — maps every soft meta-concept to its post-migration TS-runtime target (per I.3.1 stage 3), flagging anything that cannot yet be expressed as a Zod-typed SDK surface.
7. `CR-DECISIONS.md` — the Tooling Decision Framework table (VI.CR.9) fully populated.
8. `CR-VERIFICATION.md` — verification report mirroring 17-VERIFICATION.md.

### VI.CR.11 Exit Criteria
- All 8 deliverables committed under `.planning/phases/CR-context-and-research/`.
- `check-overlaps.sh` run against the current catalogue and the results attached.
- At least one stacked-workflow eval run (e.g. `hm-hm-coordinating-loop` + `hm-hm-planning-with-files` + `hm-hm-phase-loop`) reporting coverage per V.3.2.
- User signs off in `CR-DISCUSSION-LOG.md`.

### VI.CR.12 Failure Signals (abort and redesign if any appear)
1. Any finding that cannot be mapped to a 6-NON mode **and** a differential cluster.
2. Any deliverable that restores a third-party skill verbatim (I.6 violation).
3. Any deliverable that assumes `.md` staging is the final form (I.3 violation).
4. A decision table with more than 20% "no change" rows (indicates audit was shallow).

### VI.CR.13 Next Phases
Phase CR's `CR-GAP-MAP.md` feeds directly into Phase 1's rename sprint and Phase 2's structural work. Phases 3–5 consume the cluster priorities from VI.CR.7.

### VI.CR.14 Immediate Application (day-1 backlog)
1. Run `ls .hivefiver-hm-meta-builder/skills-lab/active/refactoring/ | wc -l` and reconcile against I.1.2's count.
2. Run `check-overlaps.sh` across the catalogue.
3. Pull the live call-site set: `rg -n "skill: \"" .opencode/agents/ .opencode/commands/ .opencode/get-shit-done/workflows/`.
4. Open a worktree-isolated branch for Phase CR.

## VI.1 Phase 1 — Rename Sprint (hm-*/hivefiver-* namespace migration)

**Entry gate:** Phase CR exit criteria all met.
**Deliverable:** every skill in I.1.2 moved from current name → Planned Name. One atomic commit per skill.
**Non-goals:** body edits, description edits, bundle changes, eval changes. If a skill needs any of those, they are deferred to Phase 3/5.
**Verification:** `check-overlaps.sh` passes; every routing-table / agent-permission call-site updated; `validate-skill.sh` green for every renamed skill.
**Call-site update matrix:**

| Call-site | File(s) to touch |
|-----------|------------------|
| Routing table | `.hivefiver-hm-meta-builder/skills-lab/active/refactoring/hm-meta-builder/SKILL.md` + its workflow files |
| Agent permissions | `.opencode/agents/*.md` every `permission.skill` block |
| GSD workflows (if any reference hm-*) | `.opencode/get-shit-done/workflows/*.md` |
| Command bodies | `.opencode/commands/*.md` |
| Documentation | `AGENTS.md`, `.hivefiver-hm-meta-builder/AGENTS.md`, this playbook |

## VI.2 Phase 2 — Structural Changes (merge / split / targeted creation)

**Entry gate:** Phase 1 complete on the main development worktree.
**Deliverable:**
- Merge `session-context-manager` → `hm-hm-planning-with-files`.
- Split `harness-delegation-inspection` → `hm-subagent-delegation-patterns` + `hm-opencode-project-inspection`.
- Create **G-A differential skills** — `hm-completion-looping`, `hm-subagent-delegation-patterns` (from split).
- Create **G-B differential skills** — `hm-spec-driven-authoring`, `hm-test-driven-execution`.
- Create **G-C differential skill** — `hm-research-chain`.
- Create **G-D differential skills** — `hm-debug`, `hm-refactor`, `hm-phase-execution`.

Every creation follows Phase 17's template: SKILL.md ≤500 LOC, references ≥100 LOC each, scripts with non-zero-exit on failure, evals including at least one stacked-workflow scenario, 6-NON defence table at the top.

**Verification:** `skill-judge` ≥ B for every new skill; stacked-workflow eval passes; call-sites wired.

## VI.3 Phase 3 — Description Rewrite Sprint (differential-cluster skills only)

**Entry gate:** Phase 2 complete.
**Deliverable:** every skill inside G-A / G-B / G-C / G-D gets its description rewritten against V.7 template (active verb, ≤10 words for "what it does", 5–8 natural triggers, 1–2 "NOT for" exclusions, no banned keywords, no internal vocabulary). Skills outside differential clusters are parked.
**Verification:** `run-trigger-evals.sh` per skill; trigger-accuracy ≥ 80% on the new trigger-queries dataset.

## VI.4 Phase 4 — Script Dependency Hardening + 6-NON Defence Pass

**Entry gate:** Phase 3 complete.
**Deliverable:**
1. Every `bash …/scripts/…` call in every differential-cluster SKILL.md has an inline fallback procedure so the skill still works if the script is missing.
2. Every differential-cluster skill grows a **6-NON Defence Table** at the top of its SKILL.md, documenting how it defuses each of NON-1..NON-6.
3. Cross-skill stacking evals (G-A ∪ G-B, G-C ∪ G-D) added to the eval suites.

**Verification:** running the skill with `chmod -x scripts/*.sh` still produces correct agent behaviour; 6-NON defence grid ≥ 5/6 per skill.

## VI.5 Phase 5 — Body Quality + Eval Expansion (differential clusters only)

**Entry gate:** Phase 4 complete.
**Deliverable:** raise body quality (progressive disclosure, TOC, reference loading guidance, edge-case coverage) for every differential-cluster skill to `skill-judge` ≥ A−. Eval coverage for differential clusters ≥ 75%. Non-differential skills stay at Phase 0 levels.
**Verification:** `skill-judge --grade` per skill; eval coverage report committed; stacked-workflow evals green.

## VI.6 Phase 6 — Runtime Integration Preparation (new in v2.0)

**Entry gate:** Phase 5 complete; `refactor/product-detox-concerns` branch surveyed and ready to merge back.
**Goal:** move validated skills/agents/commands from **stage 2 (staging markdown)** to **stage 3 (Zod-typed TS modules with SDK)** per I.3.1.

**Sub-phases (each its own GSD phase):**
1. **VI.6.1 — Typed schema extraction.** For every differential-cluster skill, author a Zod schema in `src/hivefiver/skills/<name>.schema.ts` that captures: frontmatter (name, description, triggers, metadata.layer, pattern, allowed-tools), bundle contract (references[], scripts[], evals[], templates[]), and activation config.
2. **VI.6.2 — SDK surface.** Expose `defineSkill()`, `defineAgent()`, `defineCommand()` factories in `src/hivefiver/index.ts`, mirroring the style of `src/lib/delegation-manager.ts` — leaf-first, no governance, no circular deps.
3. **VI.6.3 — Skill body migration.** The validated SKILL.md body becomes a long-string export (for now); later phases can chunk into typed sections once the SDK is stable. Migration is mechanical — body text is not rewritten, only wrapped.
4. **VI.6.4 — End-user config surface.** Extend `opencode-harness.config.ts` schema so end-users can enable/disable/stack skills and select a third-party spec-driven framework (I.6) as a sidecar lineage.
5. **VI.6.5 — Deprecation markers.** The old `.md`-only skills stay in the lab (symlinked for transitional compat) but flip to `status: legacy` in frontmatter. Removal is a post-v2.0 decision.

**Verification:** `npm run build` + `npm run test` + `npm run typecheck` all green; at least three end-to-end scenarios run entirely off the TS SDK with no `.md` fallbacks; public API documented in `docs/runtime-sdk.md`.

**Non-goals:** rewriting validated skill bodies, re-grading skills, opening new features. Phase 6 is a wrapping phase, not a rewriting phase.

## VI.7 GSD-to-Playbook Phase Mapping (source: `.planning/ROADMAP.md`)

| Playbook Phase | GSD Phase | Status |
|----------------|-----------|--------|
| Phase 0 — Critical Fixes | GSD Phase 17 | **COMPLETE** |
| Phase CR — Context & Research | GSD Phase 18 (was: Rename Sprint — now CR inserted) | PENDING |
| Phase 1 — Rename Sprint | GSD Phase 19 | PENDING |
| Phase 2 — Structural Changes | GSD Phase 20 | PENDING |
| Phase 3 — Description Rewrite | GSD Phase 21 | PENDING |
| Phase 4 — Script Hardening + 6-NON | GSD Phase 22 | PENDING |
| Phase 5 — Body + Eval Expansion | GSD Phase 23 | PENDING |
| Phase 6 — Runtime Integration | GSD Phases 24–28 (one per sub-phase) | PENDING |

`.planning/ROADMAP.md` must be updated by the next GSD roadmap touch to reflect this re-mapping (the insertion of Phase CR shifts every downstream GSD phase by one).

## VI.8 Uncovered Domains (post-program gaps, parked)

Even after the 8-phase program completes, the following remain parked for a subsequent cycle. They are explicitly **not** part of Phases CR..6:

| Gap | Severity | Recommendation |
|-----|----------|----------------|
| Permission enforcement (runtime validation skill) | High | New skill after Phase 6 once the SDK supports permission introspection |
| Hook/event system patterns | Medium | Extension of `hm-hm-opencode-platform-reference` |
| Context compaction protocol | Medium | Extension of `hm-hm-planning-with-files` |
| Non-OpenCode platform activation | Low | Extension of `hivefiver-hivefiver-use-authoring-skills/06-cross-platform-activation.md` |

## VI.9 Gold-Standard Templates (retained from v1.0, renamed)

Use these as copy-start templates for new skills:

| Template for | Use this skill | Why |
|--------------|----------------|-----|
| Reference skills | `hm-hm-opencode-platform-reference` | Key patterns section, TOC, progressive disclosure |
| Tactical skills | `hivefiver-hivefiver-command-dev` | Lean 80 LOC, Iron Law, clear anatomy |
| Methodology skills | `hm-deep-research` | Stage gates, tool matrix, anti-patterns, "when NOT to" |
| Behavioural skills | `hm-hm-opencode-non-interactive-shell` | BAD/GOOD examples, self-contained, no background deps |
| Planning skills | `hm-hm-planning-with-files` | Complete schemas, tiered response, subagent envelope |
| Differential G-A skills | `hm-hm-coordinating-loop` + Phase 17 sub-phases as execution template | 3-level hierarchy, loop structure, gatekeeping |
| Differential G-C skills | `hm-detective` (post-17-05) | SCAN + reading modes, unified tech-registry, stacked with deep-research and synthesis |

---

# PART VII — USING `skill-creator`, `skill-judge`, AND `skill-writing`

These are the three authoring primitives the refactor relies on. **They are separate tools/skills** — not a single pipeline. Always invoke in the order: `skill-creator` → `skill-writing` → `skill-judge`.

## VII.1 The Three Primitives

| Primitive | Location | Type | Purpose |
|-----------|----------|------|---------|
| `skill-creator` | Global: `~/.agents/skills/skill-creator/` | Platform-agnostic skill | Create a *new* skill from a prompt, a document, or an extracted pattern. Emits a scaffolded SKILL.md + bundle. |
| `skill-writing` (in-repo alias = `hivefiver-use-authoring-skills`) | `.hivefiver-hm-meta-builder/skills-lab/active/refactoring/hivefiver-use-authoring-skills/` | Hivefiver meta skill (L4) | Author, audit, and refactor skills **inside** the Hivefiver lab. Enforces the Iron Law, agentskills.io principles, 6 criterion gates, and bundle standard. |
| `skill-judge` | Global: `~/.agents/skills/skill-judge/` | Platform-agnostic skill | Grade a skill against quality rubrics. Returns PASS / NEEDS_REFACTOR / FAIL with per-dimension scores. |

All three are declared in `hivefiver-skill-author.md` via:

```yaml
permission:
  skill:
    "*": ask
    "hivefiver-use-authoring-skills": allow
    "skill-judge": allow      # global skill at ~/.agents/skills/skill-judge/
    "skill-creator": allow    # global skill at ~/.agents/skills/skill-creator/
    "hm-opencode-platform-reference": allow
```

**Before invoking any of the three**, run the validated-skills probe (I.1.1) to confirm the skill exists in its expected location. Do not silently fall through to a sibling.

## VII.2 Invocation Pattern: Creating a New Skill

1. **Primary coordinator** receives the request ("create a skill that …"). Intent classification routes to the `hm-meta-builder` skill.
2. `hm-meta-builder` routes to `hivefiver-skill-author` specialist (pure-orchestrator, level 2).
3. `hivefiver-skill-author` runs its mandatory first step:

   ```bash
   # Load the in-repo authoring skill
   ls .hivefiver-hm-meta-builder/skills-lab/active/refactoring/hivefiver-use-authoring-skills/references/
   ```

4. **Gate 0** — preflight:

   ```bash
   bash .hivefiver-hm-meta-builder/skills-lab/active/refactoring/hivefiver-use-authoring-skills/scripts/validate-gate.sh \
     create "<user's exact request>" <target-skill-dir>
   ```

   Must exit 0. If non-zero → fix and re-run.

5. **Step 1 — invoke `skill-creator`** (global). Pass: (a) the user's intent, (b) the extracted real task (from hands-on conversation or synthesised project artifacts per agentskills.io), (c) the target skill directory. `skill-creator` emits a scaffolded bundle.

6. **Step 2 — invoke `skill-writing`** (`hivefiver-use-authoring-skills` in the lab). Responsibilities:
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

1. Route to `hivefiver-skill-author` via `hm-meta-builder`.
2. **Gate 0:** `validate-gate.sh audit "<request>" <skill-dir>` must exit 0.
3. Invoke `skill-writing` (`hivefiver-use-authoring-skills`) with the doctor path: load `references/05-skill-quality-matrix.md`.
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
| Phase 1 | 60s | Context: read `.hivefiver-hm-meta-builder/AGENTS.md`; read git-workflow protocol; check lab dirs; verify symlinks; read planning files. |
| Phase 2 | 30s | Skill activation (max 3): mandatory = `hm-meta-builder` + `hm-opencode-platform-reference` + `hm-coordinating-loop`. Conditional per trigger. |
| Phase 3 | 15s | Intent classification via routing table (VIII.2). |
| Phase 4 | — | Execution protocol per workflow type (VIII.3). |
| Phase 5 | — | Quality gates (VIII.4). |
| Phase 6 | — | Session recovery (if interrupted) via git + planning files. |

## VIII.2 Routing Table (v2.0 — uses planned hm-*/hivefiver-* names per V.8)

Skill names shown as **current / planned**; use current until Phase 1 rename sprint (VI.1) lands, then switch to planned atomically.

| User says | Route to (skill) | Dispatch to (specialist) |
|-----------|-----------------|---------------------------|
| "create a skill" | `hivefiver-use-authoring-skills` → `hivefiver-hivefiver-use-authoring-skills` | `hivefiver-skill-author` |
| "audit this skill" / "review skill" | `hivefiver-use-authoring-skills` (doctor) → `hivefiver-hivefiver-use-authoring-skills` | `hivefiver-skill-author` |
| "refactor skill X" | `hivefiver-use-authoring-skills` (iterative) → `hivefiver-hivefiver-use-authoring-skills` | `hivefiver-skill-author` |
| "create an agent" | `hivefiver-agents-and-subagents-dev` → `hivefiver-hivefiver-agents-and-subagents-dev` | `hivefiver-agent-builder` |
| "set up a command" | `hivefiver-command-dev` → `hivefiver-hivefiver-command-dev` | `hivefiver-command-builder` |
| "build a custom tool" | `hivefiver-custom-tools-dev` → `hivefiver-hivefiver-custom-tools-dev` | `hivefiver-tool-builder` |
| "stack skills" | `hm-meta-builder` → `hm-hm-meta-builder` + targets | self (orchestrate) |
| "configure OpenCode" | `hm-opencode-platform-reference` → `hm-hm-opencode-platform-reference` | self (research + report) |
| "audit my project" | `hm-opencode-project-audit` → `hm-opencode-project-audit` | self + `critic` subagent |
| "inspect delegation" | `harness-delegation-inspection` → `hm-subagent-delegation-patterns` (split) | self |
| "set up delegation gates" | `hivefiver-delegation-gates` → `hivefiver-delegation-gates` | self |
| "write an eval" | *(N/A)* → `hm-eval-driven-development` (Phase 2 creation) | self |
| **[NEW — G-A]** "loop until done" / "guardrail my workflow" | *(N/A)* → `hm-completion-looping` (Phase 2 creation) | self + delegated subagent |
| **[NEW — G-B]** "lock a spec" / "turn spec into tests" | *(N/A)* → `hm-spec-driven-authoring` (Phase 2 creation) | self |
| **[NEW — G-B]** "write tests first" / "TDD this phase" | *(N/A)* → `hm-test-driven-execution` (Phase 2 creation) | self |
| **[NEW — G-C]** "detect → research → synthesise" | *(N/A)* → `hm-research-chain` (Phase 2 creation) | self |
| **[NEW — G-D]** "debug this" / "root-cause this" | *(N/A)* → `hm-debug` (Phase 2 creation) | self |
| **[NEW — G-D]** "refactor this module" | *(N/A)* → `hm-refactor` (Phase 2 creation) | self |
| **[NEW — G-D]** "execute this phase" | *(N/A)* → `hm-phase-execution` (Phase 2 creation) | self |
| **[Retained]** research / investigation / synthesis | `hm-deep-research` / `hm-detective` / `hm-synthesis` | self (chained via `hm-research-chain` once created) |

## VIII.3 Execution Protocols

### Meta-concept creation

1. Load routing skill → `hm-meta-builder`.
2. Classify intent → match routing table.
3. Dispatch to specialist via `task` tool with the dispatch envelope (III.3).
4. Collect output → check status.
5. Two-stage review → spec compliance first, then quality.
6. Commit → `git add` + atomic commit.
7. Report → what was created, where it lives, how to test.

### Meta-concept auditing

1. Load audit skill → `hivefiver-use-authoring-skills` (doctor path).
2. Scan target.
3. Run validators.
4. Generate findings report with file:line evidence.
5. Propose fixes (prioritised).
6. **Wait for approval. Do NOT fix without user confirmation.**

### Meta-concept stacking

1. Load `hm-coordinating-loop`.
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

# PART IX — THE GSD-ALIGNED EXECUTION PATTERN (new in v2.0)

Phase 17's success was not an accident. The loop the sub-phases followed is the loop every Phase CR..6 must follow. This part codifies that loop as a mandatory shape for every sub-phase plan.

## IX.1 The Required Loop

```
CONTEXT  →  RESEARCH  →  PLAN  →  EXECUTE  →  VERIFICATION  →  REVIEW  →  (next sub-phase)
   ↑                                                                          │
   └──────────────── feedback if REVIEW opens concerns ───────────────────────┘
```

Each stage has a required deliverable, a required gate, and a required owner. No stage may be skipped. No sub-phase may commit execution code before the prior stage's deliverable lands.

## IX.2 Stage-by-Stage Contract

| # | Stage | Deliverable (file) | Gate (must pass before next stage) | Owner |
|---|-------|--------------------|-------------------------------------|-------|
| 1 | **CONTEXT** | `<phase-id>-CONTEXT.md` — domain boundary, in/out of scope, decisions D-01..D-N, requirements REQ-<phase>-0x | User sign-off; 6-NON grid declared per target skill | Front-facing orchestrator + user |
| 2 | **RESEARCH** | `<phase-id>-RESEARCH.md` — grounded evidence via `hm-detective` → `hm-deep-research` → `hm-synthesis`; citations to source files; resolution options per finding | Every D-0x decision has at least one evidence citation | `researcher` subagent or pure-orchestrator using research chain |
| 3 | **PLAN** | `<phase-id>-NN-PLAN.md` per sub-phase — tasks, acceptance criteria, verification steps, rollback procedure, expected commit | PLAN covers every D-0x and REQ-<phase>-0x relevant to the sub-phase | Front-facing orchestrator or planning specialist |
| 4 | **EXECUTE** | Git commits (one atomic per sub-phase), plus `<phase-id>-NN-SUMMARY.md` noting files touched + verification evidence | All tasks ticked off; no `src/` or agent/command drift unless authorised; `validate-skill.sh` green | `builder` subagent / `hivefiver-skill-author` |
| 5 | **VERIFICATION** | `<phase-id>-VERIFICATION.md` — enumerate every D-0x and REQ with PASS/FAIL + evidence; wave structure confirmed; plan quality scored | Status = PASS; any FAIL loops back to PLAN (step 3) | `critic` subagent |
| 6 | **REVIEW** | `<phase-id>-REVIEW.md` — code review across files touched; 0/0/0 critical/warning/info target; list any dead refs | 0 critical findings; warnings triaged | `critic` subagent |
| 7 | **DISCUSSION-LOG** | `<phase-id>-DISCUSSION-LOG.md` — append-only record of user-facing options presented + selections made | User's last selection recorded before execution starts | Front-facing orchestrator |

**Evidence from Phase 17:** every one of these seven files exists in `.planning/phases/17-hivemind-skills-refactor/` with the exact names above (substitute `17` for `<phase-id>`). The pattern is not theoretical.

## IX.3 Decision & Requirement Numbering

- Decisions: `D-01`, `D-02`, ... `D-NN` per phase. Never shared across phases. Each decision is a discrete yes/no or multi-choice the user made in DISCUSSION-LOG, with an option set (`O-A`, `O-B`, `O-C`, ...) for traceability.
- Requirements: `REQ-<phase-id>-01`, `REQ-<phase-id>-02`, ... Mirrors the decisions but expressed as testable assertions. VERIFICATION.md must list every `REQ-*` with PASS/FAIL + one-line evidence.

## IX.4 Wave Structure for Multi-Plan Sub-Phases

When a phase has N > 1 sub-phases (like Phase 17 had 5), sub-phases are either **waves** (parallelisable; no ordering constraint) or **dependent** (sequential; later wave consumes earlier wave's artefacts). Every PLAN must declare its wave membership (`Wave: 1`, `Wave: 2/depends:17-01`). VERIFICATION.md must confirm wave ordering held.

## IX.5 Commit Discipline

- One atomic commit per sub-phase. Commit message format: `phase: <phase-id>-<NN> — <one-line summary>`. Example from Phase 17: `phase: 17-01 — restore hm-skill-synthesis from retired to active`.
- Never batch sub-phases. Never amend. Never force-push after verification passes.
- `src/` changes and agent/command refactors are **forbidden** inside a soft-meta phase commit. If they are needed, open a separate phase.

## IX.6 Sub-Agent Delegation Envelope

When the front-facing orchestrator dispatches a builder/critic/researcher subagent, the dispatch envelope must contain:
1. **Task text** (full, verbatim — never "read the plan file").
2. **Scene-setting** (where this fits in the phase, the 6-NON axis it defends, the differential cluster it serves).
3. **Scope** (include paths, exclude paths).
4. **Status output contract** (one of `DONE`, `DONE_WITH_CONCERNS`, `NEEDS_CONTEXT`, `BLOCKED` with specific output requirements).
5. **Gate reminder** (which `validate-*.sh` scripts must pass before reporting DONE).

This matches `.hivefiver-hm-meta-builder/AGENTS.md` §Delegation Protocol. No session history. No implicit state.

## IX.7 Loop-Back Triggers

The loop returns to PLAN (not CONTEXT) when:
- VERIFICATION returns FAIL on any REQ-*.
- REVIEW returns critical findings.
- A subagent returns `DONE_WITH_CONCERNS` that the orchestrator judges to be correctness concerns (not observations).

The loop returns to CONTEXT (restart the phase) only when:
- A D-0x decision is invalidated by research evidence (rare).
- Scope expands enough that the in/out-of-scope list no longer reflects reality.

## IX.8 Verification Against Part IX

Before marking any Phase CR..6 complete, run this checklist:
- [ ] All 7 stage files exist with the expected names.
- [ ] `<phase-id>-VERIFICATION.md` status = PASS.
- [ ] `<phase-id>-REVIEW.md` critical count = 0.
- [ ] Every D-0x has a DISCUSSION-LOG entry.
- [ ] Every REQ-* has a VERIFICATION evidence line.
- [ ] Every sub-phase has an atomic commit with the `phase: <id>-<NN> —` prefix.
- [ ] Every dispatched subagent received a full envelope (no session-history leaks).
- [ ] `.planning/ROADMAP.md` and `.planning/STATE.md` updated to reflect the phase's completion.

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
| Hivefiver root AGENTS | `.hivefiver-hm-meta-builder/AGENTS.md` |
| Onboarding protocol | `.hivefiver-hm-meta-builder/ONBOARDING-WORKFLOW-PROTOCOL.md` |
| Skill criteria | `.hivefiver-hm-meta-builder/SKILL-CRITERIA-SHORT.md` |
| Skills-audit master plan | `.hivemind/research/skills-audit/planning/master-revamp-plan-2026-04-09.md` |
| Target architecture | `.hivemind/research/skills-audit/planning/target-architecture-2026-04-09.md` |
| Cross-batch findings | `.hivemind/research/skills-audit/synthesis/cross-batch-findings-2026-04-09.md` |
| Skills lab (canonical) | `.hivefiver-hm-meta-builder/skills-lab/active/refactoring/` |
| Agents lab (canonical) | `.hivefiver-hm-meta-builder/agents-lab/active/refactoring/` |
| Commands lab (canonical) | `.hivefiver-hm-meta-builder/commands-lab/active/refactoring/` |
| Workflows lab | `.hivefiver-hm-meta-builder/workflows-lab/active/refactoring/` |
| References lab | `.hivefiver-hm-meta-builder/references-lab/active/refactoring/` |
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
  task: ask                       # level-3 task-completer = ask; level-2 pure-orchestrator = allow
  skill:
    "*": ask
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
[ ] 4. ARCHITECTURE FIT — belongs to one lineage (hm-meta-builder OR project) and one task group (Group 1 OR Group 2)
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
for d in .hivefiver-hm-meta-builder/skills-lab/active/refactoring/*/; do
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

# APPENDIX F — Differential Skill Groups and hm-* Naming Inventory (new in v2.0)

## F.1 Differential Cluster Roster

Cross-reference to V.3.2. Existing skills listed with current name; planned creations tagged `[NEW]`.

### F.1.1 G-A — Looping / Guardrails / Gatekeeping / Self-verification / Subagent Delegation

| Status | Planned Name | Current Name | Role in Cluster |
|--------|--------------|--------------|-----------------|
| Exists (harden) | `hm-hm-coordinating-loop` | `hm-coordinating-loop` | 3-level coordination hierarchy + handoff protocols |
| Exists (raise grade) | `hm-hm-phase-loop` | `hm-phase-loop` | Revision loop scaffold for phase-bound work |
| [NEW] | `hm-completion-looping` | — | Non-regression guardrail + subagent dispatch + self-verification envelope. Authors must embed explicit loop-back triggers. |
| Rename | `hivefiver-delegation-gates` | `hivefiver-delegation-gates` | Pre-delegation authorization gates + capability matrix |
| Split | `hm-subagent-delegation-patterns` | `harness-delegation-inspection` (split half) | Delegation patterns for subagent dispatch — envelope templates + status protocols |

### F.1.2 G-B — Spec-driven + Test-driven Development

| Status | Planned Name | Current Name | Role in Cluster |
|--------|--------------|--------------|-----------------|
| [NEW] | `hm-spec-driven-authoring` | — | Turn a SPEC into falsifiable REQ-* assertions + acceptance tests. Integrates with CONTEXT.md authoring from Part IX. |
| [NEW] | `hm-test-driven-execution` | — | Red-green-refactor loop integrated with `hm-hm-planning-with-files` + `hm-hm-phase-loop`. Never claim test coverage without running the tests. |
| Rename | `hm-eval-driven-development` | (N/A — gap) | Define-run-grade-improve cycles for eval quality. Consumes the existing `hivefiver-use-authoring-skills` eval templates. |

### F.1.3 G-C — Research / Investigation / Synthesis

| Status | Planned Name | Current Name | Role in Cluster |
|--------|--------------|--------------|-----------------|
| Exists (A target) | `hm-deep-research` | `hm-deep-research` | Version-matched Context7 research + MCP tool matrix. Post-17-05 includes `research-patterns.md`. |
| Exists (B target) | `hm-detective` | `hm-detective` | Primary investigator. SCAN (Tech Stack), READ, SCAN (Repo), DEEP modes. Canonical `.tech-registry.json` schema source. |
| Exists (B target) | `hm-synthesis` | `hm-synthesis` | Compression tiers + artifact export. Post-17-05 uses unified hm-detective schema. |
| [NEW] | `hm-research-chain` | — | Short meta-skill documenting the canonical chain: `hm-detective` (SCAN) → `hm-deep-research` (version-matched) → `hm-synthesis` (compression + artefact) → optional `hm-hm-skill-synthesis` (pattern extraction). |

### F.1.4 G-D — Debug / Refactor / Planning / Execution

| Status | Planned Name | Current Name | Role in Cluster |
|--------|--------------|--------------|-----------------|
| [NEW] | `hm-debug` | — | Systematic debugging with persistent state across context resets. Re-authored from GSD's `/gsd-debug` pattern (I.6). |
| [NEW] | `hm-refactor` | — | Surgical vs. structural refactor taxonomy. Decision tree for scope + safety + rollback. |
| Exists (A target) | `hm-hm-planning-with-files` | `hm-planning-with-files` | Planning schemas + tiered response + subagent envelope. Gold-standard template. |
| [NEW] | `hm-phase-execution` | — | Wave-based execution loop mirroring GSD's pattern but native to Hivemind primitives. Matches Part IX stage 4. |

## F.2 Complete hm-* / hivefiver-* Rename Inventory

Full source-of-truth table. Used by Phase 1 (VI.1) rename sprint. Any skill not listed here is either (a) out of scope for the program, (b) scheduled for retirement, or (c) will be created new by Phase 2.

| # | Current Name | Planned Name | Rename Action | Notes |
|---|--------------|--------------|---------------|-------|
| 1 | `hm-meta-builder` | `hm-hm-meta-builder` | Move + update routing table | L0 router; highest-touch call-site count |
| 2 | `hivefiver-use-authoring-skills` | `hivefiver-hivefiver-use-authoring-skills` | Move + update `hivefiver-skill-author` permissions | L4 authoring — hivefiver-exclusive |
| 3 | `hivefiver-agents-and-subagents-dev` | `hivefiver-hivefiver-agents-and-subagents-dev` | Move + update permissions | hivefiver-exclusive |
| 4 | `hivefiver-command-dev` | `hivefiver-hivefiver-command-dev` | Move + update permissions | hivefiver-exclusive |
| 5 | `hivefiver-custom-tools-dev` | `hivefiver-hivefiver-custom-tools-dev` | Move + update permissions | hivefiver-exclusive |
| 6 | `hm-coordinating-loop` | `hm-hm-coordinating-loop` | Move + update routing | shared — G-A |
| 7 | `hm-phase-loop` | `hm-hm-phase-loop` | Move + update routing | shared — G-A |
| 8 | `hm-planning-with-files` | `hm-hm-planning-with-files` | Move + update routing | shared — G-D + gold template |
| 9 | `hm-user-intent-interactive-loop` | `hm-hm-user-intent-interactive-loop` | Move + update routing | shared |
| 10 | `hm-opencode-platform-reference` | `hm-hm-opencode-platform-reference` | Move + update routing | shared — L3 reference |
| 11 | `hm-opencode-non-interactive-shell` | `hm-hm-opencode-non-interactive-shell` | Move + update routing | shared — gold template |
| 12 | `hm-omo-reference` | `hm-omo-reference` | Move + update routing | shared — L3 reference |
| 13 | `hm-deep-research` | `hm-deep-research` | No-op (already prefixed) | G-C |
| 14 | `hm-detective` | `hm-detective` | No-op (already prefixed) | G-C |
| 15 | `hm-synthesis` | `hm-synthesis` | No-op (already prefixed) | G-C |
| 16 | `hivefiver-context-absorb` | `hivefiver-context-absorb` | Move (full prefix) + update permissions | hivefiver-exclusive |
| 17 | `hm-opencode-project-audit` | `hm-opencode-project-audit` | Move + rename (compound) | shared |
| 18 | `harness-delegation-inspection` | `hm-subagent-delegation-patterns` + `hm-opencode-project-inspection` | Split (Phase 2, not Phase 1) | shared |
| 19 | `hivefiver-delegation-gates` | `hivefiver-delegation-gates` | Move + rename | hivefiver-exclusive — G-A |
| 20 | `hm-agent-composition` | `hm-agent-composition` | Move + re-author per I.6 (not just rename) | shared — I.6 exception |
| 21 | `hm-command-parser` | `hm-hm-command-parser` | Move + update routing | shared |
| 22 | `hm-agents-md-sync` | `hm-hm-agents-md-sync` | Move + update routing | shared |
| 23 | `session-context-manager` | *(merge → `hm-hm-planning-with-files`)* | Merge (Phase 2, not Phase 1) | FAIL-grade — drop |
| 24 | `hm-skill-synthesis` | `hm-hm-skill-synthesis` | Move + update routing | hivefiver-exclusive — restored by 17-01 |

**Phase-2 creations (no current name, born `hm-*`/`hivefiver-*`):**
`hm-completion-looping`, `hm-spec-driven-authoring`, `hm-test-driven-execution`, `hm-eval-driven-development`, `hm-research-chain`, `hm-debug`, `hm-refactor`, `hm-phase-execution`, `hm-opencode-project-inspection` (split sibling).

## F.3 Agent Rename (downstream of Phase 1)

Agent frontmatter `permission.skill:` blocks must be updated in lock-step with Phase 1. Specifically:

| Agent | Pre-rename permission | Post-rename permission |
|-------|------------------------|-------------------------|
| `hivefiver-skill-author` | `hivefiver-use-authoring-skills: allow`, `skill-judge: allow`, `skill-creator: allow`, `hm-opencode-platform-reference: allow` | `hivefiver-hivefiver-use-authoring-skills: allow` + unchanged globals + `hm-hm-opencode-platform-reference: allow` |
| `hivefiver-agent-builder` | `hivefiver-agents-and-subagents-dev: allow`, `hm-opencode-platform-reference: allow` | `hivefiver-hivefiver-agents-and-subagents-dev: allow`, `hm-hm-opencode-platform-reference: allow` |
| `hivefiver-command-builder` | `hivefiver-command-dev: allow`, `hm-opencode-non-interactive-shell: allow` | `hivefiver-hivefiver-command-dev: allow`, `hm-hm-opencode-non-interactive-shell: allow` |
| Every front-facing orchestrator | `hm-meta-builder: allow`, `hm-coordinating-loop: allow`, `hm-planning-with-files: allow` | `hm-hm-meta-builder: allow`, `hm-hm-coordinating-loop: allow`, `hm-hm-planning-with-files: allow` |

## F.4 Ordering Contract for the Rename Sprint

1. Rename the skill directory under `.hivefiver-hm-meta-builder/skills-lab/active/refactoring/`.
2. Regenerate the symlink inside `.opencode/skills/`.
3. Update routing-table entries in `hm-hm-meta-builder`'s SKILL.md + workflow files.
4. Update every agent `permission.skill` block that references the old name.
5. Update every workflow file under `.opencode/get-shit-done/workflows/` and every command body under `.opencode/commands/` that references the old name.
6. Update this playbook's internal references (Appendix F.2 marks the source of truth).
7. Run `validate-skill.sh` + `check-overlaps.sh` across the full catalogue.
8. Commit atomically with message `phase: <gsd-phase>-<NN> — rename <old> → <new>`.

No step may be skipped. No two skills may be renamed in one commit.

---

**End of Playbook (v2.0).**

*This document is itself a meta-artifact. Treat it as a reference, not a skill — it does not ship into `.opencode/skills/`. Keep it in `.hivefiver-hm-meta-builder/` and update it as the refactor progresses. Every change to this file that affects a skill call-site or phase contract must be accompanied by a matching `.planning/ROADMAP.md` + `.planning/STATE.md` update.*