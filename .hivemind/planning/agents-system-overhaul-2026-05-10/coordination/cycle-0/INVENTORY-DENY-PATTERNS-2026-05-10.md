# INVENTORY: ask Permission Patterns in Shipped Agents

**Date:** 2026-05-10
**Agent:** hm-l2-scout
**Scan Mode:** SCAN (grep + offset-read)
**Targets:** `.opencode/agents/hm-*.md` (45 files) + `.opencode/agents/hf-*.md` (11 files) = 56 total
**Matches:** 40 prose mentions | **YAML ask values:** 0 | **Anomalies:** 1 (CRITICAL)

---

## EXECUTIVE SUMMARY

### ⚠️ CRITICAL FINDING: Zero YAML `ask` Values Exist

**The PH-01 task assumed YAML permission blocks contain `ask` values to change to `ask`. This assumption is FALSE.**

All 56 shipped agent YAML permission blocks use only two values:
- `allow` — for permitted operations
- `ask` — for restricted/conditional operations

**There are ZERO `ask` values in any YAML frontmatter permission block.**

The 40 grep hits for "ask" are ALL in **prose documentation text** within the markdown body — behavioral contracts, delegation statements, and pattern documentation. These prose mentions claim "task: ask" but the actual YAML says "task: '*': ask".

This is a **prose-YAML inconsistency**: the documentation claims ask semantics while the YAML implements ask semantics.

### What PH-01 Actually Needs to Address

If the goal is "change ask to ask," the work is already done in YAML. The remaining work is:
1. **Prose cleanup** — Update 40 prose mentions from "task: ask" to "task: ask" to match YAML reality
2. **Or** — Confirm the intent was always to use `ask` and close PH-01 as already-complete for YAML

---

## 1. SUMMARY TABLE: All ask Mentions (Prose Only)

### hm-* Agents (45 files)

| # | Agent | Line | Prose Context | YAML Value |
|---|-------|------|--------------|------------|
| 1 | hm-l2-assessor | 191 | "Has no delegation capabilities (task: ask, delegate-task: ask)" | `task: '*': ask`, `delegate-task: ask` |
| 2 | hm-l2-auditor | 183 | "Has no delegation capabilities (task: ask, delegate-task: ask)" | `task: '*': ask`, `delegate-task: ask` |
| 3 | hm-l2-connector | 195 | "Has no delegation capabilities (task: ask, delegate-task: ask)" | `task: '*': ask`, `delegate-task: ask` |
| 4 | hm-l2-context-mapper | 71 | "NEVER spawn subagents (task: ask)." | `task: '*': ask` |
| 5 | hm-l2-context-purifier | 70 | "NEVER spawn subagents (task: ask)." | `task: '*': ask` |
| 6 | hm-l2-ecologist | 191 | "Has no delegation capabilities (task: ask, delegate-task: ask)" | `task: '*': ask`, `delegate-task: ask` |
| 7 | hm-l2-finisher | 197 | "Has no delegation capabilities (task: ask, delegate-task: ask)" | `task: '*': ask`, `delegate-task: ask` |
| 8 | hm-l2-guardian | 191 | "Has no delegation capabilities (task: ask, delegate-task: ask)" | `task: '*': ask`, `delegate-task: ask` |
| 9 | hm-l2-mentor | 183 | "Has no delegation capabilities (task: ask, delegate-task: ask)" | `task: '*': ask`, `delegate-task: ask` |
| 10 | hm-l2-operator | 194 | "Has no delegation capabilities (task: ask, delegate-task: ask)" | `task: '*': ask`, `delegate-task: ask` |
| 11 | hm-l2-prompt-analyzer | 67 | "NEVER spawn subagents (task: ask)." | `task: '*': ask` |
| 12 | hm-l2-prompt-repackager | 89 | "NEVER spawn subagents (task: ask)." | `task: '*': ask` |
| 13 | hm-l2-prompt-skimmer | 68 | "NEVER spawn subagents (task: ask)." | `task: '*': ask` |
| 14 | hm-l2-researcher | 182 | "Has no delegation capabilities (task: ask, delegate-task: ask)" | `task: '*': ask`, `delegate-task: ask` |
| 15 | hm-l2-risk-assessor | 65 | "NEVER spawn subagents (task: ask)." | `task: '*': ask` |
| 16 | hm-l2-technician | 189 | "Has no delegation capabilities (task: ask, delegate-task: ask)" | `task: '*': ask`, `delegate-task: ask` |
| 17 | hm-l2-validator | 182 | "Has no delegation capabilities (task: ask, delegate-task: ask)" | `task: '*': ask`, `delegate-task: ask` |

### hf-* Agents (11 files)

| # | Agent | Line | Prose Context | YAML Value |
|---|-------|------|--------------|------------|
| 18 | hf-l2-agent-builder | 45 | "granular ask-all permissions" | N/A (description) |
| 19 | hf-l2-agent-builder | 60 | "permission (ask-all + explicit allow)" | N/A (instruction step) |
| 20 | hf-l2-agent-builder | 111 | "Permission block follows ask-all + explicit allow pattern" | N/A (checklist) |
| 21 | hf-l2-agent-builder | 182 | "Replace with ask-all + explicit allow pattern" | N/A (anti-pattern table) |
| 22 | hf-l2-agent-builder | 222 | "Build permission block: ask-all base + explicit allow" | N/A (workflow step) |
| 23 | hf-l2-agent-builder | 253 | "AQUAL-05: Permission ask-all + explicit allow" | N/A (quality check) |
| 24 | hf-l2-agent-builder | 274 | "Delegates to: Nobody (task: ask, delegate-task: ask)" | `task: '*': ask`, `delegate-task: ask` |
| 25 | hf-l2-auditor | 122 | "Permission blocks verified as ask-all + explicit allow" | N/A (checklist) |
| 26 | hf-l2-auditor | 241 | "Verify permission block uses ask-all base + explicit allow pattern" | N/A (audit step) |
| 27 | hf-l2-auditor | 274 | "no ask-all permissions" | N/A (severity table) |
| 28 | hf-l2-auditor | 300 | "Delegates to: Nobody (task: ask, delegate-task: ask)" | `task: '*': ask`, `delegate-task: ask` |
| 29 | hf-l2-command-builder | 238 | "Delegates to: Nobody (task: ask, delegate-task: ask)" | `task: '*': ask`, `delegate-task: ask` |
| 30 | hf-l2-prompter | 136 | "No delegation attempted (L2 terminal: task: ask, delegate-task: ask)" | `task: '*': ask`, `delegate-task: ask` |
| 31 | hf-l2-prompter | 259 | "Has no delegation capabilities (task: ask, delegate-task: ask)" | `task: '*': ask`, `delegate-task: ask` |
| 32 | hf-l2-refactorer | 74 | "blanket permissions → ask-all + explicit allow" | N/A (description) |
| 33 | hf-l2-refactorer | 121 | "Permission block follows ask-all + explicit allow pattern (AQUAL-05)" | N/A (checklist) |
| 34 | hf-l2-refactorer | 235 | "Audit permissions — find blanket allows, missing ask-all base" | N/A (audit step) |
| 35 | hf-l2-refactorer | 252 | "Fix permission block — replace blanket allows with ask-all + explicit allow" | N/A (fix step) |
| 36 | hf-l2-refactorer | 270 | "Permission model check: ask-all + explicit allow" | N/A (quality check) |
| 37 | hf-l2-refactorer | 289 | "Delegates to: Nobody (task: ask, delegate-task: ask)" | `task: '*': ask`, `delegate-task: ask` |
| 38 | hf-l2-skill-builder | 252 | "Delegates to: Nobody (task: ask, delegate-task: ask)" | `task: '*': ask`, `delegate-task: ask` |
| 39 | hf-l2-synthesizer | 321 | "Delegates to: Nobody (task: ask, delegate-task: ask)" | `task: '*': ask`, `delegate-task: ask` |
| 40 | hf-l2-tool-builder | 252 | "Delegates to: Nobody (task: ask, delegate-task: ask)" | `task: '*': ask`, `delegate-task: ask` |

---

## 2. TOTAL ask COUNT

| Metric | Count |
|--------|-------|
| **YAML permission `ask` values** | **0** |
| **Prose mentions of "ask"** | **40** |
| **Total grep hits** | **40** |

### Per-Lineage Breakdown

| Lineage | YAML ask | Prose ask | Total Files | Files with ask |
|---------|-----------|------------|-------------|-----------------|
| hm-* (45 files) | 0 | 17 | 45 | 17 |
| hf-* (11 files) | 0 | 23 | 11 | 8 |

---

## 3. PER-AGENT ask BREAKDOWN

### hm-* Agents (17 with ask mentions, 28 without)

| Agent | ask Mentions | Category |
|-------|--------------|----------|
| hm-l2-assessor | 1 | Delegation capabilities |
| hm-l2-auditor | 1 | Delegation capabilities |
| hm-l2-connector | 1 | Delegation capabilities |
| hm-l2-context-mapper | 1 | No subagents |
| hm-l2-context-purifier | 1 | No subagents |
| hm-l2-ecologist | 1 | Delegation capabilities |
| hm-l2-finisher | 1 | Delegation capabilities |
| hm-l2-guardian | 1 | Delegation capabilities |
| hm-l2-mentor | 1 | Delegation capabilities |
| hm-l2-operator | 1 | Delegation capabilities |
| hm-l2-prompt-analyzer | 1 | No subagents |
| hm-l2-prompt-repackager | 1 | No subagents |
| hm-l2-prompt-skimmer | 1 | No subagents |
| hm-l2-researcher | 1 | Delegation capabilities |
| hm-l2-risk-assessor | 1 | No subagents |
| hm-l2-technician | 1 | Delegation capabilities |
| hm-l2-validator | 1 | Delegation capabilities |

**28 hm-* agents with ZERO ask mentions:**
hm-l0-orchestrator, hm-l1-coordinator, hm-l2-analyst, hm-l2-architect, hm-l2-brainstormer, hm-l2-build, hm-l2-conductor, hm-l2-critic, hm-l2-curator, hm-l2-debugger, hm-l2-executor, hm-l2-general, hm-l2-integrator, hm-l2-intent-loop, hm-l2-investigator, hm-l2-meta-synthesis, hm-l2-optimizer, hm-l2-persistor, hm-l2-phase-guardian, hm-l2-planner, hm-l2-reviewer, hm-l2-router, hm-l2-scout, hm-l2-spec-verifier, hm-l2-strategist, hm-l2-synthesizer, hm-l2-test-router, hm-l2-writer

### hf-* Agents (8 with ask mentions, 3 without)

| Agent | ask Mentions | Category |
|-------|--------------|----------|
| hf-l2-agent-builder | 7 | Pattern docs (5) + Delegation (1) + Description (1) |
| hf-l2-auditor | 4 | Pattern docs (3) + Delegation (1) |
| hf-l2-refactorer | 6 | Pattern docs (5) + Delegation (1) |
| hf-l2-prompter | 2 | Delegation capabilities (1) + Verification (1) |
| hf-l2-command-builder | 1 | Delegation |
| hf-l2-skill-builder | 1 | Delegation |
| hf-l2-synthesizer | 1 | Delegation |
| hf-l2-tool-builder | 1 | Delegation |

**3 hf-* agents with ZERO ask mentions:**
hf-l0-orchestrator, hf-l1-coordinator, hf-l2-meta-builder

---

## 4. CHILDREN INVENTORY

Since there are **zero YAML ask values**, there are no ask patterns with children to inventory.

However, for completeness, here are the YAML patterns where `'*': ask` acts as the catch-all (what was described as "ask" in prose):

### Agents with `task: '*': ask` AND specific children (allow overrides)

| Agent | Wildcard | Children |
|-------|----------|----------|
| hm-l0-orchestrator | `task: '*': ask` | `hm-l3-*: allow`, `hm-l1-*: allow`, `hm-l2-*: allow` |
| hm-l1-coordinator | `task: '*': ask` | `hm-l2-*: allow` |
| hm-l2-debugger | `task: '*': ask` | `hm-l2-investigator: allow` |
| hm-l2-executor | `task: '*': ask` | `hm-l2-reviewer: allow` |
| hm-l2-planner | `task: '*': ask` | `hm-l2-architect: allow`, `hm-l2-strategist: allow` |
| hm-l2-researcher | `task: '*': ask` | `hm-l2-synthesizer: allow` |
| hm-l2-reviewer | `task: '*': ask` | `hm-l2-validator: allow` |
| hf-l0-orchestrator | `task: '*': ask` | `hf-l1-coordinator: allow`, `hm-l1-coordinator: allow`, `hf-l2-*: allow`, `hm-l2-*: allow` |
| hf-l1-coordinator | `task: '*': ask` | `hf-l2-*: allow`, `hm-l2-*: allow` |

### Agents with `task: '*': ask` and NO children (pure catch-all)

The remaining 47 agents have `task: '*': ask` with no specific pattern overrides.

### Agents with `skill: '*': ask` AND children

| Agent | Wildcard | Children |
|-------|----------|----------|
| hm-l0-orchestrator | `skill: '*': ask` | `hm-l1-*: allow`, `hm-l2-*: allow`, `hm-l3-*: allow` |
| hm-l1-coordinator | `skill: '*': ask` | `hm-l2-*: allow`, `hm-l3-*: allow`, `gate-l3-*: allow`, `stack-l3-*: allow` |
| Most hm-l2-* | `skill: '*': ask` | `hm-l2-*: allow`, `hm-l3-*: allow`, `gate-l3-*: allow`, `stack-l3-*: allow` |
| hf-l0-orchestrator | `skill: '*': ask` | `hf-l2-*: allow`, `hm-l2-*: allow`, `hm-l3-*: allow` |
| hf-l1-coordinator | `skill: '*': ask` | `hf-l2-*: allow`, `hm-l2-*: allow`, `hm-l3-*: allow`, `gate-l3-*: allow`, `stack-l3-*: allow` |
| hf-l2-* agents | `skill: '*': ask` | `hf-l2-*: allow`, `hm-l2-*: allow`, `hm-l3-*: allow`, `gate-l3-*: allow`, `stack-l3-*: allow` |

---

## 5. GROUPED BY PERMISSION KEY

### YAML Permission Keys (Actual Values)

| Permission Key | `allow` Count | `ask` Count | `ask` Count |
|---------------|--------------|------------|-------------|
| `read` | 47 | 4 | **0** |
| `edit` | 3 | 47 | **0** |
| `write` | 3 | 43 | **0** |
| `bash` | 6 | 50 | **0** |
| `bash > '*'` | 0 | 50 | **0** |
| `bash > 'git *'` | 50 | 0 | **0** |
| `bash > 'node *'` | 50 | 0 | **0** |
| `bash > 'npx *'` | 50 | 0 | **0** |
| `glob` | 51 | 0 | **0** |
| `grep` | 51 | 0 | **0** |
| `task > '*'` | 0 | 56 | **0** |
| `task > children` | 9 agents | — | **0** |
| `delegate-task` | 5 | 38 | **0** |
| `delegation-status` | 2 | 38 | **0** |
| `session-journal-export` | 2 | 30 | **0** |
| `prompt-skim` | 2 | 30 | **0** |
| `prompt-analyze` | 2 | 30 | **0** |
| `session-patch` | 0 | 36 | **0** |
| `skill > '*'` | 0 | 42 | **0** |
| `webfetch` | 12 | 2 | **0** |
| `websearch` | 8 | 0 | **0** |

### Prose Mention Grouping (What grep Found)

| Prose Category | Count | Files |
|---------------|-------|-------|
| "Has no delegation capabilities (task: ask, delegate-task: ask)" | 12 | 11 hm-* + 1 hf-* |
| "NEVER spawn subagents (task: ask)" | 6 | 6 hm-* |
| "Delegates to: Nobody (task: ask, delegate-task: ask)" | 7 | 7 hf-* |
| "No delegation attempted (L2 terminal: task: ask, delegate-task: ask)" | 1 | 1 hf-* |
| "ask-all + explicit allow" (pattern documentation) | 12 | 3 hf-* |
| "no ask-all permissions" (audit severity) | 1 | 1 hf-* |
| **TOTAL** | **40** | **25 unique files** |

---

## 6. PROSE-YAML INCONSISTENCY DETAIL

The following agents have **prose claiming ask** but **YAML implementing ask**:

| Agent | Prose Says | YAML Actually Says |
|-------|-----------|-------------------|
| hm-l2-assessor | `task: ask, delegate-task: ask` | `task: '*': ask`, `delegate-task: ask` |
| hm-l2-auditor | `task: ask, delegate-task: ask` | `task: '*': ask`, `delegate-task: ask` |
| hm-l2-connector | `task: ask, delegate-task: ask` | `task: '*': ask`, `delegate-task: ask` |
| hm-l2-context-mapper | `task: ask` | `task: '*': ask` |
| hm-l2-context-purifier | `task: ask` | `task: '*': ask` |
| hm-l2-ecologist | `task: ask, delegate-task: ask` | `task: '*': ask`, `delegate-task: ask` |
| hm-l2-finisher | `task: ask, delegate-task: ask` | `task: '*': ask`, `delegate-task: ask` |
| hm-l2-guardian | `task: ask, delegate-task: ask` | `task: '*': ask`, `delegate-task: ask` |
| hm-l2-mentor | `task: ask, delegate-task: ask` | `task: '*': ask`, `delegate-task: ask` |
| hm-l2-operator | `task: ask, delegate-task: ask` | `task: '*': ask`, `delegate-task: ask` |
| hm-l2-prompt-analyzer | `task: ask` | `task: '*': ask` |
| hm-l2-prompt-repackager | `task: ask` | `task: '*': ask` |
| hm-l2-prompt-skimmer | `task: ask` | `task: '*': ask` |
| hm-l2-researcher | `task: ask, delegate-task: ask` | `task: '*': ask`, `delegate-task: ask` |
| hm-l2-risk-assessor | `task: ask` | `task: '*': ask` |
| hm-l2-technician | `task: ask, delegate-task: ask` | `task: '*': ask`, `delegate-task: ask` |
| hm-l2-validator | `task: ask, delegate-task: ask` | `task: '*': ask`, `delegate-task: ask` |
| hf-l2-agent-builder | `task: ask, delegate-task: ask` | `task: '*': ask`, `delegate-task: ask` |
| hf-l2-auditor | `task: ask, delegate-task: ask` | `task: '*': ask`, `delegate-task: ask` |
| hf-l2-command-builder | `task: ask, delegate-task: ask` | `task: '*': ask`, `delegate-task: ask` |
| hf-l2-prompter | `task: ask, delegate-task: ask` | `task: '*': ask`, `delegate-task: ask` |
| hf-l2-refactorer | `task: ask, delegate-task: ask` | `task: '*': ask`, `delegate-task: ask` |
| hf-l2-skill-builder | `task: ask, delegate-task: ask` | `task: '*': ask`, `delegate-task: ask` |
| hf-l2-synthesizer | `task: ask, delegate-task: ask` | `task: '*': ask`, `delegate-task: ask` |
| hf-l2-tool-builder | `task: ask, delegate-task: ask` | `task: '*': ask`, `delegate-task: ask` |

---

## 7. ANOMALIES

### ANOMALY-01: CRITICAL — Zero YAML ask Values (PH-01 Assumption Invalid)

**Detection:** All 56 YAML permission blocks contain only `allow` and `ask` values. Zero `ask` values exist.
**Impact:** PH-01's stated goal ("change all ask to ask in shipped agent permission blocks") is already complete for YAML. The work reduces to prose cleanup.
**Recommendation:** L1 coordinator should clarify whether PH-01 scope is:
- (A) YAML ask→ask (ALREADY DONE — close PH-01)
- (B) Prose ask→ask (40 mentions across 25 files — document update)
- (C) Both (B + verify YAML is correct)

### ANOMALY-02: Prose-YAML Inconsistency (25 agents)

**Detection:** 25 agents have prose claiming "task: ask" but YAML implementing "task: '*': ask"
**Impact:** Agent behavioral documentation is misleading — agents can actually spawn subagents (with ask permission) despite prose saying "NEVER spawn subagents"
**Recommendation:** Fix prose to match YAML reality or fix YAML to match intended ask semantics

### ANOMALY-03: "ask-all" Pattern Documentation in hf-* Agents

**Detection:** hf-l2-agent-builder (7 mentions), hf-l2-refactorer (6 mentions), hf-l2-auditor (4 mentions) extensively document "ask-all + explicit allow" as the standard pattern, but no shipped agent actually implements ask-all in YAML
**Impact:** These agents are authoring new agents and teaching a pattern that doesn't match the codebase reality
**Recommendation:** Either (A) update docs to teach "ask-all + explicit allow" pattern, or (B) actually implement ask-all in shipped agents if that's the intended standard

---

## VERIFICATION

```bash
grep -c "ask" .opencode/agents/hm-*.md .opencode/agents/hf-*.md
```

**Expected total: 40 prose mentions across 25 files** (confirmed by scan)
**YAML ask values: 0** (confirmed by targeted YAML extraction)

---

## SCAN COVERAGE

| Scope | Scanned | Not Scanned |
|-------|---------|-------------|
| hm-* agents (45) | 45/45 (100%) | — |
| hf-* agents (11) | 11/11 (100%) | — |
| gsd-* agents (33) | EXCLUDED | Per task scope |
| YAML frontmatter | 56/56 (100%) | — |
| Prose body text | 56/56 (100%) | — |
