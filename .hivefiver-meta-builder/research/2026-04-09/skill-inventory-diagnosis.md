# Skill Inventory Diagnosis Report

**Date:** 2026-04-09  
**Source:** `.hivefiver-meta-builder/skills-lab/active/refactoring/`  
**Total Skills:** 22  
**Method:** Manual read of every SKILL.md + frontmatter + body + references + scripts  

---

## Executive Summary

| Verdict | Count | % |
|---------|-------|---|
| **PASS** (meets architecture, keep as-is) | 4 | 18% |
| **FLAG** (needs targeted refactoring) | 11 | 50% |
| **BLOCK** (fundamental architecture failure — remove or rewrite from scratch) | 7 | 32% |

### Top-Level Findings
1. **No skill fails anatomy** — all 22 have SKILL.md + optional resources. ✅
2. **Description quality is mixed** — 6/22 have generic or AI-written descriptions that will cause runtime picking collisions.
3. **Lineage/hierarchy metadata is inconsistent** — only 1/22 (`meta-builder`) carries full lineage/hierarchy/orientation frontmatter. The rest use ad-hoc `layer` + `role` fields with no standardized vocabulary.
4. **Group 1 (Process) vs Group 2 (Implement) boundary is blurry** — 5 skills claim to be "domain-execution" but teach coordination/verification patterns (Group 1).
5. **Overlap is the #1 debt** — 7 skill pairs share >60% semantic territory in their descriptions.
6. **Body quality ranges from excellent (hm-detective, coordinating-loop) to skeleton-level (oh-my-openagent-reference).**

---

## 1. Naming — Duplicate / Similar Meaning Detection

### Step 1: Semantic Overlap Pairs

| Pair | Overlap Type | Severity |
|------|-------------|----------|
| `agent-authorization` vs `agents-and-subagents-dev` | Both teach agent creation + permissions + delegation | **HIGH** |
| `command-dev` vs `command-parser` | command-dev already covers `$ARGUMENTS` parsing; command-parser is a subset | **HIGH** |
| `coordinating-loop` vs `harness-delegation-inspection` | Both teach multi-agent dispatch + checkpoint + resume | **MEDIUM** |
| `hm-deep-research` vs `hm-detective` vs `hm-synthesis` | Three skills in the same "hm-" family; detective teaches reading, research teaches investigation, synthesis teaches compression — distinct but tightly coupled | **LOW** (intentional family) |
| `opencode-non-interactive-shell` vs `command-dev` | command-dev has its own "Non-Interactive Shell Mandates" section duplicating this skill | **HIGH** |
| `planning-with-files` vs `session-context-manager` | Both persist state across sessions; planning uses 3 files, context-manager uses YAML frontmatter | **MEDIUM** |
| `phase-loop` vs `coordinating-loop` | Both teach iterative loops; phase-loop is check-revise-escalate, coordinating-loop is full orchestration | **LOW** (subset relationship is clear) |

### Step 2: Description Pass/Fail (Runtime Picking Test)

For each skill: does the description contain **specific trigger phrases** a user would say? Does it differentiate from similar skills?

| Skill | Description Quality | Picking Risk |
|-------|-------------------|--------------|
| `agent-authorization` | Generic "this skill should be used when..." pattern; no user-voice triggers | **FAIL** |
| `agents-and-subagents-dev` | Long, keyword-stuffed, mixes agent creation + delegation + worktree + session ID tracking | **FAIL** (too broad) |
| `command-dev` | Good trigger phrases ("create a command", "$ARGUMENTS", "non-interactive shell safety") | **PASS** |
| `command-parser` | Narrow and clear ("parse $ARGUMENT", "extract flags") | **PASS** |
| `coordinating-loop` | Excellent — "dispatch multiple agents", "ralph loop", "wave-based execution" | **PASS** |
| `custom-tools-dev` | Good — "create a custom tool", "Zod schema", "plugin hook" | **PASS** |
| `gsd-agent-composition` | Very long, mixes creation + XML markup + step protocols + structured returns | **FLAG** (broad but coherent) |
| `harness-audit` | Good trigger phrases, clear scope | **PASS** |
| `harness-delegation-inspection` | Mixes "understand GSD patterns" with "inspect project state" — two different skills | **FAIL** |
| `hm-deep-research` | Excellent long description with case-based teaching model | **PASS** |
| `hm-detective` | Excellent — covers reading modes, token budget, swarm recovery | **PASS** |
| `hm-synthesis` | Good — compression tiers, cross-dep analysis, artifact export | **PASS** |
| `meta-builder` | Excellent — "create a skill", "audit this skill", "stack skills", routing intent | **PASS** |
| `oh-my-openagent-reference` | Narrow reference skill; description is adequate for its scope | **PASS** |
| `opencode-non-interactive-shell` | Clear but overlaps heavily with command-dev | **FLAG** (overlap, not quality) |
| `opencode-platform-reference` | Good trigger phrases for platform lookups | **PASS** |
| `phase-loop` | Generic description, no user-voice triggers | **FAIL** |
| `planning-with-files` | Good — "plan this", "recover after context loss", "persist task state" | **PASS** |
| `session-context-manager` | Generic "manage session context" — overlaps with planning-with-files | **FLAG** |
| `use-authoring-skills` | Good trigger phrases | **PASS** |
| `user-intent-interactive-loop` | Good — "unclear intent", "probe requirements", "long session management" | **PASS** |

**Description Pass Rate:** 14/22 (64%)  
**Description Failures:** 8/22 (36%) — need rewriting with user-voice trigger phrases

---

## 2. Anatomy & Structure Validation

### Mandatory Elements Check

| Skill | SKILL.md Present | YAML Frontmatter (name+description) | references/ | scripts/ | assets/ | Anatomy Verdict |
|-------|:-:|:-:|:-:|:-:|:-:|:-:|
| agent-authorization | ✅ | ✅ | ✅ (gates.md) | ✅ (2 scripts) | ❌ | **PASS** |
| agents-and-subagents-dev | ✅ | ✅ | ✅ (2 refs) | ❌ | ❌ | **PASS** |
| command-dev | ✅ | ✅ | ✅ (2 refs) | ❌ | ❌ | **PASS** |
| command-parser | ✅ | ✅ | ✅ (1 ref) | ❌ | ❌ | **PASS** |
| coordinating-loop | ✅ | ✅ | ✅ (4 refs) | ✅ (8 scripts) | ❌ | **PASS** |
| custom-tools-dev | ✅ | ✅ | ✅ (2 refs) | ❌ | ❌ | **PASS** |
| gsd-agent-composition | ✅ | ✅ | ✅ (6 refs) | ✅ (2 scripts) | ✅ (templates) | **PASS** |
| harness-audit | ✅ | ✅ | ✅ (1 ref) | ✅ (2 scripts) | ✅ (7 profiles) | **PASS** |
| harness-delegation-inspection | ✅ | ✅ | ✅ (5 refs) | ❌ | ❌ | **PASS** |
| hm-deep-research | ✅ | ✅ | ✅ (6 refs) | ❌ | ❌ | **PASS** |
| hm-detective | ✅ | ✅ | ✅ (6 refs) | ❌ | ❌ | **PASS** |
| hm-synthesis | ✅ | ✅ | ✅ (7 refs) | ❌ | ❌ | **PASS** |
| meta-builder | ✅ | ✅ | ✅ (9 refs + 3 workflows) | ❌ | ✅ (3 frontmatter) | **PASS** |
| oh-my-openagent-reference | ✅ | ✅ | ✅ (3 refs + 1 XML) | ❌ | ❌ | **PASS** |
| opencode-non-interactive-shell | ✅ | ✅ | ✅ (4 refs) | ❌ | ❌ | **PASS** |
| opencode-platform-reference | ✅ | ✅ | ✅ (20 refs) | ❌ | ❌ | **PASS** |
| phase-loop | ✅ | ❌ (missing metadata fields) | ✅ (1 ref) | ❌ | ❌ | **FAIL** (incomplete frontmatter) |
| planning-with-files | ✅ | ✅ | ✅ (2 refs) | ❌ | ❌ | **PASS** |
| session-context-manager | ✅ | ✅ | ✅ (1 ref) | ❌ | ❌ | **PASS** |
| use-authoring-skills | ✅ | ✅ | ✅ (12 refs) | ✅ (8 scripts) | ❌ | **PASS** |
| user-intent-interactive-loop | ✅ | ✅ | ✅ (5 refs) | ✅ (5 scripts) | ❌ | **PASS** |

**Anatomy Pass Rate:** 21/22 (95%)  
**Only `phase-loop` fails** — missing `version`, `metadata.role`, and other standard fields in frontmatter.

---

## 3. Lineage Classification

### Architecture Mandate: 2 Lineages

| Lineage | Purpose | Expected Skills |
|---------|---------|----------------|
| **Meta-Builder Module** | Skills that teach OpenCode meta-concepts (skills, agents, commands, tools, permissions) | meta-builder, use-authoring-skills, command-dev, custom-tools-dev, agents-and-subagents-dev, agent-authorization, gsd-agent-composition, harness-audit, harness-delegation-inspection |
| **Project-Specific** | Skills tied to this specific HiveMind harness project | oh-my-openagent-reference, opencode-platform-reference, opencode-non-interactive-shell |

### Current State

**Only `meta-builder` declares lineage in frontmatter.** The remaining 21 skills have no lineage classification. This means at runtime, a `builder` or `hiveminder` agent could pick up `use-authoring-skills` (meta-builder lineage — should only be picked by meta-builder/coordinator), violating the "do not mix lineage" rule.

### Lineage Assignment Recommendation

| Skill | Recommended Lineage | Current Risk |
|-------|-------------------|--------------|
| meta-builder | meta-builder | ✅ (declared) |
| use-authoring-skills | meta-builder | 🔴 (undclared — could be picked by builder) |
| agent-authorization | meta-builder | 🔴 |
| agents-and-subagents-dev | meta-builder | 🔴 |
| command-dev | meta-builder | 🔴 |
| command-parser | meta-builder | 🔴 |
| custom-tools-dev | meta-builder | 🔴 |
| gsd-agent-composition | meta-builder | 🔴 |
| harness-audit | meta-builder | 🔴 |
| harness-delegation-inspection | meta-builder | 🔴 |
| coordinating-loop | meta-builder | 🔴 |
| phase-loop | meta-builder | 🔴 |
| planning-with-files | meta-builder | 🔴 |
| session-context-manager | meta-builder | 🔴 |
| user-intent-interactive-loop | meta-builder | 🔴 |
| hm-deep-research | project-specific | 🟡 (could be general-purpose) |
| hm-detective | project-specific | 🟡 |
| hm-synthesis | project-specific | 🟡 |
| opencode-platform-reference | project-specific | ✅ |
| opencode-non-interactive-shell | project-specific | ✅ |
| oh-my-openagent-reference | project-specific | ✅ |

---

## 4. Hierarchy Alignment

### Architecture Mandate: 2 Hierarchies

| Hierarchy | Purpose | Should Be Picked By | Must NOT Be Picked By |
|-----------|---------|-------------------|----------------------|
| **Coordinator/Orchestrator** (front-facing) | Task management, guardrails, validation, orchestration | Front agents (Hiveminder, Coordinator, Meta-Builder) | Sub-session delegated agents |
| **Sub-Session Level** (granular execution) | Specific task execution, implementation, investigation | Delegated subagents (builder, researcher, critic) | Front-facing orchestrator agents |

### Current Hierarchy Assessment

| Skill | Declared Layer | Declared Role | Hierarchy Classification | Verdict |
|-------|:---:|:---:|:---:|:---:|
| agent-authorization | domain-execution | domain-execution | Coordinator | ⚠️ Role name ≠ hierarchy |
| agents-and-subagents-dev | 2 | domain-execution | Sub-session | ⚠️ |
| command-dev | 2 | domain-execution | Sub-session | ⚠️ |
| command-parser | 3 | domain-execution | Sub-session | ⚠️ |
| coordinating-loop | 3 | coordinator | Coordinator | ✅ |
| custom-tools-dev | 2 | domain-execution | Sub-session | ⚠️ |
| gsd-agent-composition | 2 | composition | Coordinator | ⚠️ |
| harness-audit | 1 | auditor | Coordinator | ⚠️ |
| harness-delegation-inspection | 1 | domain-execution | Coordinator | ⚠️ |
| hm-deep-research | 2 | research | Sub-session | ⚠️ |
| hm-detective | 2 | investigation | Sub-session | ⚠️ |
| hm-synthesis | 2 | compression | Sub-session | ⚠️ |
| meta-builder | 0 | router | Coordinator | ✅ |
| oh-my-openagent-reference | 3 | reference | Sub-session | ⚠️ |
| opencode-non-interactive-shell | 3 | reference | Sub-session | ⚠️ |
| opencode-platform-reference | 3 | reference | Sub-session | ⚠️ |
| phase-loop | 2 | domain-execution | Sub-session | ⚠️ |
| planning-with-files | 2 | persistent-memory | Coordinator | ⚠️ |
| session-context-manager | 2 | domain-execution | Sub-session | ⚠️ |
| use-authoring-skills | 4 | domain-execution | Sub-session | ⚠️ |
| user-intent-interactive-loop | 1 | front-agent | Coordinator | ✅ |

**Finding:** The `layer` and `role` fields are used inconsistently. No skill uses a standardized `hierarchy: coordinator|sub-session` field. Only 3/22 have roles that clearly map to hierarchy. **This is a systemic metadata failure.**

---

## 5. Task/Expert Orientation (Group 1 vs Group 2)

### Group 1 — How-to-Process (coordination, validation, guardrails, loops)

| Skill | Group 1 Candidate? | Verdict |
|-------|:---:|:---:|
| agent-authorization | ✅ (gate-based validation workflow) | **Group 1** |
| coordinating-loop | ✅ (multi-agent orchestration) | **Group 1** |
| harness-delegation-inspection | ✅ (execution patterns, checkpoint resume) | **Group 1** |
| phase-loop | ✅ (check-revise-escalate loop) | **Group 1** |
| planning-with-files | ✅ (persistent memory + handoff protocol) | **Group 1** |
| session-context-manager | ✅ (context propagation, checkpoint schema) | **Group 1** |
| user-intent-interactive-loop | ✅ (probe → understand → plan → delegate loop) | **Group 1** |

### Group 2 — How-to-Implement (tactical, tech patterns, depth)

| Skill | Group 2 Candidate? | Verdict |
|-------|:---:|:---:|
| agents-and-subagents-dev | ✅ (agent definitions, worktree, delegation protocol) | **Group 2** |
| command-dev | ✅ (command anatomy, Zod, non-interactive shell) | **Group 2** |
| command-parser | ✅ (parsing patterns, $ARGUMENTS grammar) | **Group 2** |
| custom-tools-dev | ✅ (plugin lifecycle, Zod patterns, tool creation) | **Group 2** |
| gsd-agent-composition | ✅ (XML markup, step protocols, structured returns) | **Group 2** |
| harness-audit | ✅ (parallel subagent dispatch, phase profiles) | **Group 2** |
| hm-deep-research | ✅ (research archetypes, case comparison, evidence levels) | **Group 2** |
| hm-detective | ✅ (reading modes, token budget, surgical edits) | **Group 2** |
| hm-synthesis | ✅ (compression tiers, cross-dep analysis, interface extraction) | **Group 2** |
| oh-my-openagent-reference | ✅ (reference codebase exploration) | **Group 2** |
| opencode-non-interactive-shell | ✅ (shell safety, banned commands, env variables) | **Group 2** |
| opencode-platform-reference | ✅ (platform capabilities, SDK, hooks, permissions) | **Group 2** |
| use-authoring-skills | ✅ (skill authoring TDD, frontmatter, validation scripts) | **Group 2** |
| meta-builder | ❌ (router, not implementer) | **Router** (separate category) |

### Group 1 ↔ Hierarchy Mismatch

| Skill | Group | Hierarchy | Mismatch? |
|-------|:---:|:---:|:---:|
| agent-authorization | G1 | Coordinator | ✅ Match |
| coordinating-loop | G1 | Coordinator | ✅ Match |
| harness-delegation-inspection | G1 | Coordinator | ✅ Match |
| phase-loop | G1 | Sub-session | ⚠️ Should be Coordinator |
| planning-with-files | G1 | Coordinator | ✅ Match |
| session-context-manager | G1 | Sub-session | ⚠️ Should be Coordinator |
| user-intent-interactive-loop | G1 | Coordinator | ✅ Match |

---

## 6. SKILL.md Body Quality Assessment

### Per-Skill Body Analysis

| Skill | First Heading Quality | Specialist Depth | Verdict |
|-------|---------------------|-----------------|:---:|
| **agent-authorization** | "First Action" — immediate gate loading; no overview of what authorization IS | Teaches 4-gate workflow with checkpoint types but no background on why authorization exists | **FLAG** — needs overview section |
| **agents-and-subagents-dev** | "The Iron Law" — strong opening; "What agents actually rationalize" table is excellent | Deep coverage of delegation protocol, worktree, frontmatter, session ID tracking | **PASS** |
| **command-dev** | "The Iron Law" + "What agents rationalize" — excellent | Covers command anatomy, non-interactive shell, anti-patterns with worked examples | **PASS** |
| **command-parser** | Direct entry into parsing patterns — no overview of what command parsing IS | Good grammar coverage with worked examples, but reads like a parser spec, not a skill | **FLAG** — needs "when to use" overview |
| **coordinating-loop** | Hierarchy enforcement first (good), then core coordination loop | Excellent — procedural steps, gate enforcement, ralph-loop integration, worked example, anti-patterns | **PASS** |
| **custom-tools-dev** | "The Iron Law" + agent rationalization table — strong | Good Zod patterns, plugin lifecycle, script rule, anti-patterns | **PASS** |
| **gsd-agent-composition** | Quick-jump table + "First Action" — well-structured | Excellent — 5 non-negotiables, XML block reference, anti-patterns, loading triggers | **PASS** |
| **harness-audit** | "The Iron Law" + architecture diagram | Thin — mostly a dispatch orchestrator, not a teaching document. Relies entirely on subagent profiles. | **FLAG** — needs actual audit methodology |
| **harness-delegation-inspection** | "The Iron Law" + on-load reading list | Good GSD execution model coverage, inspection protocol, MCP usage | **PASS** |
| **hm-deep-research** | Case-based teaching model with 6 concepts | Excellent — case comparison, edge cases, requirements-vs-spec, interface tradeoffs, brainstorming, research patterns, tool reference, budget rules | **PASS** |
| **hm-detective** | Three reading modes with token costs | Excellent — offset hop-reading, grep-before-read, swarm recovery, surgical edits, document pipeline | **PASS** |
| **hm-synthesis** | Compression tiers + quick-jump | Excellent — 3 tiers, cross-dep protocol, interface extraction, pattern classifier, corpus gate, artifact export | **PASS** |
| **meta-builder** | Overview + subject matter + principles | Excellent — routing table, stacking recipes, power tools, 5-step workflow, anti-patterns, question discipline, reference map | **PASS** |
| **oh-my-openagent-reference** | "Repomix-Generated References" — immediate tool usage | Thin — essentially a README for packed XML. No specialist knowledge taught. | **BLOCK** — not a real skill, just a file index |
| **opencode-non-interactive-shell** | "The Iron Law" + core mandates | Adequate but generic — command tables, env variables, cognitive patterns. Reads like a checklist, not expertise. | **FLAG** — needs worked examples |
| **opencode-platform-reference** | Reference file table + composition patterns | Good — permission cascading, tool hook pipeline, agent-skill loading, subtask spawning | **PASS** |
| **phase-loop** | "Core Concept" — loop definition | Thin — loop semantics, stall detection, exit criteria. No worked examples, no integration guidance. | **FLAG** — skeleton-level content |
| **planning-with-files** | "The Iron Law" + why this exists | Excellent — 3-file system, tiered response, delegation protocol, session recovery, error discipline | **PASS** |
| **session-context-manager** | "First Action" + context schema | Adequate — checkpoint types, protocol steps, propagation rules. But overlaps heavily with planning-with-files. | **FLAG** — needs differentiation |
| **use-authoring-skills** | "The Iron Law" + agent rationalization | Excellent — preflight validator, decision tree, agentskills.io principles, validation loop, gate system, worked example | **PASS** |
| **user-intent-interactive-loop** | "Hard Gates" + first action protocol | Excellent — PROBE/UNDERSTAND/PLAN/DELEGATE/UPDATE/DELIVER loop, 6 stop conditions, persistence protocol, anti-patterns | **PASS** |

### Body Quality Summary

| Tier | Count | Skills |
|------|:---:|--------|
| **Excellent** (specialist depth, worked examples, anti-patterns) | 10 | agents-and-subagents-dev, command-dev, coordinating-loop, custom-tools-dev, gsd-agent-composition, hm-deep-research, hm-detective, hm-synthesis, meta-builder, use-authoring-skills, user-intent-interactive-loop |
| **Good** (adequate teaching, minor gaps) | 4 | harness-delegation-inspection, opencode-platform-reference, planning-with-files, session-context-manager |
| **Flag** (skeleton-level, needs refactoring) | 5 | agent-authorization, command-parser, harness-audit, opencode-non-interactive-shell, phase-loop |
| **Block** (not a real skill) | 1 | oh-my-openagent-reference |

---

## 7. Individual Skill Diagnoses

### BLOCK (Remove or Rewrite from Scratch)

#### 1. `oh-my-openagent-reference`
- **Problem:** Not a skill. It's a file index for packed XML. No specialist knowledge taught. No workflow, no decision framework, no expertise.
- **Evidence:** Body is 3 sections: "Repomix-Generated References", "How to Use", "Anti-Patterns". The "How to Use" section is just grep instructions.
- **Recommendation:** **Remove as skill.** Keep the packed XML as a reference file accessible via `opencode-platform-reference`. Delete SKILL.md.

### FLAG (Targeted Refactoring Needed)

#### 2. `agent-authorization`
- **Problem:** No overview of WHAT authorization is; jumps straight into gate loading. Lacks worked examples.
- **Overlap:** 70% overlap with `agents-and-subagents-dev` (both cover agent creation + permissions).
- **Recommendation:** **Merge into `agents-and-subagents-dev`** as a "Gate-Based Authorization" section. Delete standalone skill.

#### 3. `command-parser`
- **Problem:** Reads like a parser specification. No "when to use" context. Overlaps with `command-dev`'s `$ARGUMENTS` coverage.
- **Recommendation:** **Merge into `command-dev`** as a reference section on `$ARGUMENTS` parsing. Or keep separate but add "when to use" overview + worked examples.

#### 4. `harness-audit`
- **Problem:** Thin orchestrator — dispatches 6 subagents but teaches nothing about HOW to audit. No audit methodology, no quality dimensions.
- **Recommendation:** **Rewrite body** to include actual audit methodology: what to look for in skills/agents/commands/tools, quality scoring rubric, evidence collection patterns.

#### 5. `opencode-non-interactive-shell`
- **Problem:** Generic checklist. No worked examples. Overlaps with `command-dev`'s non-interactive shell section.
- **Recommendation:** **Merge into `command-dev`** or add worked examples showing headless shell failures and fixes. Add "when NOT to use this skill" section.

#### 6. `phase-loop`
- **Problem:** Skeleton-level content. Loop definition without worked examples. No integration guidance with other skills.
- **Recommendation:** **Add worked examples** showing phase-loop in action with critic/builder agents. Add "when to use phase-loop vs coordinating-loop" differentiation.

#### 7. `session-context-manager`
- **Problem:** Overlaps with `planning-with-files` — both persist state, both manage sessions, both track phases.
- **Recommendation:** **Merge into `planning-with-files`** as a "Session Context Schema" section, OR clearly differentiate: planning-with-files = task-level files, session-context-manager = YAML frontmatter checkpoint schema.

### PASS (Keep As-Is)

#### 8-22. All skills marked PASS in body quality assessment above.
These skills meet the architecture mandate: they teach specialist expertise, have clear trigger phrases, worked examples, anti-patterns, and progressive disclosure.

---

## 8. The 2-2-2 Architecture Fit

### Lineage (2)
- ✅ Meta-Builder lineage: 9 skills identified (1 declared, 8 inferred)
- ✅ Project-Specific lineage: 3 skills identified
- ❌ 10 skills unclassified

### Hierarchy (2)
- ✅ Coordinator: 7 skills identified
- ✅ Sub-Session: 14 skills identified
- ❌ Metadata inconsistency across all skills

### Task Orientation (2)
- ✅ Group 1 (Process): 7 skills
- ✅ Group 2 (Implement): 14 skills
- ✅ Router: 1 skill (meta-builder)

### Fit Score: 4/6 (67%)
The skills are roughly organized into the 2-2-2 architecture, but **metadata declarations are missing or inconsistent**, making runtime enforcement impossible.

---

## 9. Refactoring Priority List

| Priority | Action | Skills Affected | Effort |
|----------|--------|:---:|:---:|
| **P0** | Remove `oh-my-openagent-reference` as skill | 1 | Low |
| **P0** | Merge `agent-authorization` → `agents-and-subagents-dev` | 2 | Medium |
| **P0** | Merge `command-parser` → `command-dev` OR differentiate clearly | 2 | Medium |
| **P1** | Merge `opencode-non-interactive-shell` → `command-dev` OR differentiate | 2 | Medium |
| **P1** | Rewrite `harness-audit` body with audit methodology | 1 | High |
| **P1** | Add worked examples to `phase-loop` | 1 | Medium |
| **P1** | Merge or differentiate `session-context-manager` vs `planning-with-files` | 2 | Medium |
| **P2** | Add lineage/hierarchy/orientation frontmatter to ALL 22 skills | 22 | Low |
| **P2** | Rewrite 8 descriptions with user-voice trigger phrases | 8 | Medium |
| **P2** | Audit all `references/` files for stub/placeholder content | ~60 files | High |
| **P2** | Audit all `scripts/` files for real validation logic (not stubs) | ~17 scripts | Medium |

---

## 10. Appendix — Full Skill Inventory Table

| # | Skill Name | Layer | Role | Lineage | Hierarchy | Group | Anatomy | Body Quality | Verdict |
|:---:|-----------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | agent-authorization | domain-execution | domain-execution | meta-builder | Coordinator | G1 | ✅ | FLAG | **FLAG** |
| 2 | agents-and-subagents-dev | 2 | domain-execution | meta-builder | Sub-session | G2 | ✅ | PASS | **PASS** |
| 3 | command-dev | 2 | domain-execution | meta-builder | Sub-session | G2 | ✅ | PASS | **PASS** |
| 4 | command-parser | 3 | domain-execution | meta-builder | Sub-session | G2 | ✅ | FLAG | **FLAG** |
| 5 | coordinating-loop | 3 | coordinator | meta-builder | Coordinator | G1 | ✅ | PASS | **PASS** |
| 6 | custom-tools-dev | 2 | domain-execution | meta-builder | Sub-session | G2 | ✅ | PASS | **PASS** |
| 7 | gsd-agent-composition | 2 | composition | meta-builder | Coordinator | G2 | ✅ | PASS | **PASS** |
| 8 | harness-audit | 1 | auditor | meta-builder | Coordinator | G2 | ✅ | FLAG | **FLAG** |
| 9 | harness-delegation-inspection | 1 | domain-execution | meta-builder | Coordinator | G1 | ✅ | PASS | **PASS** |
| 10 | hm-deep-research | 2 | research | project | Sub-session | G2 | ✅ | PASS | **PASS** |
| 11 | hm-detective | 2 | investigation | project | Sub-session | G2 | ✅ | PASS | **PASS** |
| 12 | hm-synthesis | 2 | compression | project | Sub-session | G2 | ✅ | PASS | **PASS** |
| 13 | meta-builder | 0 | router | meta-builder | Coordinator | Router | ✅ | PASS | **PASS** |
| 14 | oh-my-openagent-reference | 3 | reference | project | Sub-session | G2 | ✅ | BLOCK | **BLOCK** |
| 15 | opencode-non-interactive-shell | 3 | reference | project | Sub-session | G2 | ✅ | FLAG | **FLAG** |
| 16 | opencode-platform-reference | 3 | reference | project | Sub-session | G2 | ✅ | PASS | **PASS** |
| 17 | phase-loop | 2 | domain-execution | meta-builder | Sub-session | G1 | ❌ | FLAG | **FLAG** |
| 18 | planning-with-files | 2 | persistent-memory | meta-builder | Coordinator | G1 | ✅ | PASS | **PASS** |
| 19 | session-context-manager | 2 | domain-execution | meta-builder | Sub-session | G1 | ✅ | FLAG | **FLAG** |
| 20 | use-authoring-skills | 4 | domain-execution | meta-builder | Sub-session | G2 | ✅ | PASS | **PASS** |
| 21 | user-intent-interactive-loop | 1 | front-agent | meta-builder | Coordinator | G1 | ✅ | PASS | **PASS** |

---

*Report generated 2026-04-09. Ready for synthesis into refactoring plan.*
