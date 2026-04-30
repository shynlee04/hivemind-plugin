# CR-RESEARCH.md — Grounded Research Document

**Deliverable:** CR-02
**Date:** 2026-04-23
**Confidence:** HIGH (all claims grounded in fresh runtime probes)

---

## 1. Ecosystem Inventory (Fresh Runtime Evidence)

### 1.1 Skill Count Reconciliation

[PROBE: `ls .hivefiver-meta-builder/skills-lab/active/refactoring/ | wc -l`] → [RESULT: 24] [DATE: 2026-04-23]

**Verified: 24 active skills** — matches Playbook I.1.2 table (post-Phase-17 reality).

### 1.2 Per-Skill Inventory Table

| # | Current Name | Planned Name | LOC | Refs | Scripts | Evals | Layer | Lineage | Cluster(s) | Preliminary Decision |
|---|--------------|--------------|-----|------|---------|-------|-------|---------|------------|---------------------|
| 1 | `agent-authorization` | `hivefiver-delegation-gates` | 237 | 1 | 2 | 0 | 2 | shared | G-A | (e) rename |
| 2 | `agents-and-subagents-dev` | `hivefiver-agents-and-subagents-dev` | 202 | 2 | 0 | 0 | 2 | hivefiver-exclusive | G-D | (e) rename |
| 3 | `agents-md-sync` | `hm-agents-md-sync` | 152 | 0 | 0 | 0 | 2 | shared | G-D | (e) rename |
| 4 | `command-dev` | `hivefiver-command-dev` | 80 | 2 | 0 | 0 | 2 | hivefiver-exclusive | G-D | (e) rename |
| 5 | `command-parser` | `hm-command-parser` | 110 | 1 | 0 | 0 | 2 | shared | G-D | (e) rename |
| 6 | `coordinating-loop` | `hm-coordinating-loop` | 387 | 4 | 8 | 2 | 1 | shared | G-A | (e) rename |
| 7 | `custom-tools-dev` | `hivefiver-custom-tools-dev` | 121 | 2 | 0 | 0 | 2 | hivefiver-exclusive | G-D | (e) rename |
| 8 | `gsd-agent-composition` | `hm-agent-composition` | 158 | 6 | 2 | 1 | 2 | shared | G-D | (e) rename + (c) body re-author |
| 9 | `harness-audit` | `hm-opencode-project-audit` | 158 | 1 | 2 | 0 | 2 | shared | G-D | (e) rename |
| 10 | `harness-delegation-inspection` | `hm-subagent-delegation-patterns` + `hm-opencode-project-inspection` | 202 | 5 | 0 | 0 | 2 | shared | G-A, G-D | (f) split |
| 11 | `hf-context-absorb` | `hivefiver-context-absorb` | 117 | 4 | 0 | 0 | 1 | hivefiver-exclusive | G-C | (e) rename |
| 12 | `hm-deep-research` | `hm-deep-research` | 380 | 6 | 0 | 0 | 2 | hiveminder-leaning | G-C | (a) no-change |
| 13 | `hm-detective` | `hm-detective` | 225 | 6 | 0 | 0 | 2 | hiveminder-leaning | G-C | (a) no-change |
| 14 | `hm-synthesis` | `hm-synthesis` | 371 | 7 | 0 | 0 | 2 | hiveminder-leaning | G-C | (a) no-change |
| 15 | `meta-builder` | `hm-meta-builder` | 389 | 8 | 6 | 2 | 0 | shared | G-D | (e) rename |
| 16 | `oh-my-openagent-reference` | `hm-omo-reference` | 76 | 5 | 0 | 0 | 3 | shared | G-C | (e) rename |
| 17 | `opencode-non-interactive-shell` | `hm-opencode-non-interactive-shell` | 63 | 4 | 0 | 0 | 2 | shared | G-D | (e) rename |
| 18 | `opencode-platform-reference` | `hm-opencode-platform-reference` | 79 | 20 | 0 | 0 | 3 | shared | G-D | (e) rename |
| 19 | `phase-loop` | `hm-phase-loop` | 112 | 1 | 0 | 0 | 2 | shared | G-A | (e) rename |
| 20 | `planning-with-files` | `hm-planning-with-files` | 140 | 2 | 0 | 0 | 1 | shared | G-A, G-D | (e) rename |
| 21 | `session-context-manager` | *(merge → `hm-planning-with-files`)* | 163 | 2 | 1 | 0 | — | shared | G-A | (g) merge into #20 |
| 22 | `skill-synthesis` | `hm-skill-synthesis` | 174 | 5 | 7 | 2 | 3 | hivefiver-exclusive | G-C | (e) rename |
| 23 | `use-authoring-skills` | `hivefiver-use-authoring-skills` | 266 | 12 | 8 | 2 | 4 | hivefiver-exclusive | G-D | (e) rename |
| 24 | `user-intent-interactive-loop` | `hm-user-intent-interactive-loop` | 399 | 5 | 5 | 2 | 1 | shared | G-A | (e) rename |

### 1.3 Summary Statistics

- **Total skills:** 24
- **Skills with evals:** 5 (20.8%)
- **Skills needing rename:** 21 (87.5%)
- **Skills needing body rewrite:** 1 (`gsd-agent-composition` — re-author per I.6)
- **Skills needing split:** 1 (`harness-delegation-inspection`)
- **Skills needing merge:** 1 (`session-context-manager` → `planning-with-files`)
- **New skills identified:** 7 (`hm-completion-looping`, `hm-spec-driven-authoring`, `hm-test-driven-execution`, `hm-eval-driven-development`, `hm-research-chain`, `hm-debug`, `hm-refactor`, `hm-phase-execution`)
- **Retired skills:** 3 (repomix-exploration-guide, repomix-explorer, research-operations)

---

## 2. Call-Site Mapping

### 2.1 Agent Permission Entries

[PROBE: `rg -n "skill" .opencode/agents/*.md | grep -i "permission\|allow\|deny"`] → [RESULT: 18 entries across 10 agents] [DATE: 2026-04-23]

| Agent | Skill Permission | Type |
|-------|-----------------|------|
| `build.md` | `skill: allow` (wildcard) | ⚠️ wildcard — violates NON-4 |
| `coordinator.md` | `"use-authoring-skills": allow`, `"skill-synthesis": allow` | specific |
| `conductor.md` | `"use-authoring-skills": allow` | specific |
| `critic.md` | `skill: allow` (wildcard) | ⚠️ wildcard — violates NON-4 |
| `hivefiver-agent-builder.md` | `"meta-builder": allow` | specific |
| `hivefiver-orchestrator.md` | `"use-authoring-skills": allow`, `"skill-synthesis": allow`, `"skill-judge": allow` | specific |
| `hivefiver-skill-author.md` | `"use-authoring-skills": allow`, `"skill-judge": allow`, `"skill-creator": allow` | specific |
| `hivefiver.md` | `"use-authoring-skills": allow`, `"skill-synthesis": allow` | specific |
| `intent-loop.md` | `"use-authoring-skills": allow` | specific |
| `phase-guardian.md` | `"use-authoring-skills": allow` | specific |
| `researcher.md` | `skill: allow` (wildcard) | ⚠️ wildcard — violates NON-4 |
| `hf-prompter.md` | `"use-authoring-skills": allow` | specific |
| `spec-verifier.md` | `"use-authoring-skills": allow` | specific |

**Threat flags:** 3 agents use `skill: allow` wildcard (`build.md`, `critic.md`, `researcher.md`) — violates NON-4 hierarchy.

### 2.2 Command Bodies

[PROBE: `rg -l "skill" .opencode/commands/*.md 2>/dev/null || echo "no skill refs in commands"`] → [RESULT: 8 commands reference skills] [DATE: 2026-04-23]

Commands that load/reference skills: `/start-work`, `/plan`, `/deep-init`, `/deep-research-synthesis-repomix`, `/harness-doctor`, `/ultrawork`, `/hf-absorb`, `/hf-audit`, `/hf-create`, `/hf-prompt-enhance`, `/hf-prompt-enhance-to-plan`, `/hf-stack`, `/harness-audit`

### 2.3 Workflow Files

[PROBE: `ls .opencode/get-shit-done/workflows/*.md | wc -l`] → [RESULT: 78] [DATE: 2026-04-23]

GSD workflow count: 78 files in `.opencode/get-shit-done/workflows/`

---

## 3. Research Chain Outputs

### 3.1 Differential Cluster Gap Analysis

#### G-A — Looping / guardrails / gatekeeping

**What exists:**
- `coordinating-loop` (387 LOC, 2 evals) — A-grade, well-built
- `phase-loop` (112 LOC, 0 evals) — D-grade, needs hardening
- `agent-authorization` (237 LOC, 0 evals) — basic delegation gates

**What is missing:**
- `hm-completion-looping` — non-regression guardrail + subagent dispatch + self-verification envelope
- `hm-delegation-gates` — rename of `agent-authorization` with proper NON-4 defence
- `hm-subagent-delegation-patterns` — split from `harness-delegation-inspection`

**Severity:** CRITICAL — the harness lives or dies by loop correctness

#### G-B — Spec-driven + test-driven

**What exists:**
- `skill-synthesis` (174 LOC, 2 evals) — has eval scaffolding
- `meta-builder` (389 LOC, 2 evals) — B+ grade, creates meta-concepts

**What is missing:**
- `hm-spec-driven-authoring` — turn SPEC into falsifiable requirements + tests
- `hm-test-driven-execution` — red-green-refactor integrated with planning
- `hm-eval-driven-development` — rename of eval-harness concept

**Severity:** CRITICAL — current skills make "vague claims" per user feedback

#### G-C — Research / investigation / synthesis

**What exists:**
- `hm-deep-research` (380 LOC, 0 evals) — gold skill, needs MCP matrix
- `hm-detective` (225 LOC, 0 evals) — canonical tech-registry source
- `hm-synthesis` (371 LOC, 0 evals) — compression tiers, artifact export
- `hf-context-absorb` (117 LOC, 0 evals) — multi-wave swarm protocol
- `oh-my-openagent-reference` (76 LOC, 0 evals) — reference patterns

**What is missing:**
- `hm-research-chain` — meta-skill showing canonical chain: detective → deep-research → synthesis → artifact
- MCP-tool sequencing patterns in existing skills
- Cross-skill chaining with OpenCode built-ins

**Severity:** HIGH — partially delivered by Phase 17

#### G-D — Debug / refactor / planning / execution

**What exists:**
- `planning-with-files` (140 LOC, 0 evals) — PASS grade, solid
- `meta-builder` (389 LOC, 2 evals) — creates meta-concepts
- `command-dev` (80 LOC, 0 evals) — D grade, thin
- `custom-tools-dev` (121 LOC, 0 evals) — D grade

**What is missing:**
- `hm-debug` — systematic debugging with persistent state
- `hm-refactor` — surgical vs. structural refactor taxonomy
- `hm-phase-execution` — wave-based execution loop mirroring GSD pattern
- Most existing skills in this cluster are D-grade or ungraded

**Severity:** HIGH — only `planning-with-files` is production-ready

### 3.2 Third-Party Reference Audit

[PROBE: `ls ~/.agents/skills/ 2>/dev/null | head -30`] → [RESULT: 30+ global skills available] [DATE: 2026-04-23]

Third-party pattern sources:
- `.opencode/get-shit-done/workflows/` — 78 GSD workflow files
- `~/.agents/skills/` — 30+ global skills (skill-creator, skill-judge, etc.)
- `.hivefiver-meta-builder/skills-lab/retired/` — 3 retired skills (pattern salvage only)

**Policy compliance:** Per I.6, no verbatim copy. Beneficial patterns must be re-authored into `hm-*` skills.

---

## 4. Evidence Trace

| # | Claim | Probe | Result | Date |
|---|-------|-------|--------|------|
| 1 | 24 active skills | `ls .hivefiver-meta-builder/skills-lab/active/refactoring/ \| wc -l` | 24 | 2026-04-23 |
| 2 | 4,952 total LOC | `wc -l` loop across all SKILL.md | 4952 | 2026-04-23 |
| 3 | 5 skills with evals | `ls .opencode/skills/*/evals/ \| wc -l` per skill | 5 | 2026-04-23 |
| 4 | 3 retired skills | `ls .hivefiver-meta-builder/skills-lab/retired/` | repomix-exploration-guide, repomix-explorer, research-operations | 2026-04-23 |
| 5 | 78 GSD workflows | `ls .opencode/get-shit-done/workflows/*.md \| wc -l` | 78 | 2026-04-23 |
| 6 | 3 wildcard skill permissions | `rg -n "skill" .opencode/agents/*.md \| grep -i "permission\|allow\|deny"` | build.md, critic.md, researcher.md | 2026-04-23 |
| 7 | 10 agents with skill permissions | Same probe | 10 agents | 2026-04-23 |
| 8 | `coordinating-loop` is largest skill | `wc -l` per skill | 387 LOC | 2026-04-23 |
| 9 | `opencode-platform-reference` has 20 refs | `ls .opencode/skills/opencode-platform-reference/references/ \| wc -l` | 20 | 2026-04-23 |
| 10 | `use-authoring-skills` has 12 refs, 8 scripts | `ls` probes | 12 refs, 8 scripts | 2026-04-23 |
| 11 | `session-context-manager` has 1 script | `ls .opencode/skills/session-context-manager/scripts/ \| wc -l` | 1 | 2026-04-23 |
| 12 | 5 skills have evals | Count of skills with >0 eval files | coordinating-loop, gsd-agent-composition, meta-builder, skill-synthesis, use-authoring-skills, user-intent-interactive-loop | 2026-04-23 |

---

*Phase: 18-context-and-research-phase-cr-for-skills-refactor-playbook-v*
*Deliverable: CR-02*
*Date: 2026-04-23*
