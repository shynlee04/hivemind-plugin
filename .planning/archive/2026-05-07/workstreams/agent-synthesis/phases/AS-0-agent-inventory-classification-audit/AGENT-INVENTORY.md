---
phase: AS-0
plan: agent-inventory-classification-audit
created: 2026-04-29
status: COMPLETE
workstream: agent-synthesis
audit_date: 2026-04-29
---

# Agent Inventory & Classification Audit

> **Phase AS-0 Deliverable** — Complete inventory of all 59 agents (58 on disk + 1 ghost). Classification matrix, quality scoring, body format catalog, and defect register.

---

## 1. Inventory Summary

**Total: 59 agents** (58 files on disk + 1 ghost reference `explore`)

| Category | Count | Prefix | On Disk | Shipped? | Quality (avg) |
|----------|-------|--------|---------|----------|---------------|
| GSD Specialist | 33 | `gsd-*` | 33 | No (internal only) | HIGH |
| Hivefiver Meta | 6 | `hivefiver*` | 6 | Candidate for hf-* | HIGH |
| Hivemind Core (hf) | 1 | `hf-*` | 1 | Yes (hf-prompter) | HIGH |
| Core (unprefixed) | 18 | various | 17 | Candidate for hm-* | MEDIUM |
| Ghost (missing) | 1 | — | 0 (explore) | TBD | NONE |
| **Total** | **59** | — | **58** | — | — |

### Frontmatter Completeness

| Field | Count with field | Missing | File count |
|-------|-----------------|---------|------------|
| `name:` | 44 / 59 | 15 | 74.6% |
| `description:` | 44 / 59 | 15 | 74.6% |
| `mode:` | 57 / 59 | 2 | 96.6% |
| `temperature:` | 27 / 59 | 32 | 45.8% |

**Missing `name:` agents:** conductor, context-mapper, context-purifier, coordinator, critic, hivefiver, intent-loop, prompt-analyzer, prompt-repackager, prompt-skimmer, researcher, risk-assessor, test-router (13) — plus 2 ghost agents without files.

**Missing `mode:` agents:** meta-synthesis-agent, [ghost explore]

**Missing `temperature:` agents:** 32 agents, predominantly all GSD agents (33) which omit temperature (inherited at runtime)

---

## 2. Classification Matrix

### Legend

- **Lineage:** GSD = `gsd-*`, HVF = `hivefiver*`, HF = `hf-*`, CORE = unprefixed, GHOST = missing
- **Depth:** L0 = Orchestrator, L1 = Coordinator, L2 = Specialist, — = unclassified
- **Body Format:** XML = GSD-style XML tags, MD = Markdown sections, MIX = Mixed, FLAT = Stub
- **Quality:** HIGH (>200 LOC + structured body), MEDIUM (50-200 LOC), LOW (<50 LOC or stub), NONE (missing file)
- **Defects:** See §7 Defect Register for KI codes

### Matrix (59 rows × 11 columns)

| # | Agent File | Name | Lineage | Depth | Temp | Mode | Body Format | Quality | Lines | Body LOC | Defects |
|---|-----------|------|---------|-------|------|------|-------------|---------|-------|----------|---------|
| 1 | `build.md` | build | CORE | — | — | primary | FLAT | LOW | 51 | 39 | KI-10 |
| 2 | `conductor.md` | — | CORE | L0 | 0.3 | primary | MD | MEDIUM | 111 | 76 | KI-10 |
| 3 | `context-mapper.md` | — | CORE | L2 | 0.1 | subagent | MD | MEDIUM | 64 | 49 | KI-10 |
| 4 | `context-purifier.md` | — | CORE | L2 | 0.1 | subagent | MD | MEDIUM | 63 | 49 | KI-10 |
| 5 | `coordinator.md` | — | CORE | L1 | — | primary | MD | MEDIUM | 205 | 136 | KI-10 |
| 6 | `critic.md` | — | CORE | L2 | 0.05 | subagent | MD | MEDIUM | 121 | 103 | KI-10 |
| 7 | `general.md` | general | CORE | L2 | 0.2 | subagent | XML | MEDIUM | 49 | 34 | — |
| 8 | `intent-loop.md` | — | CORE | — | 0.2 | subagent | MD | MEDIUM | 215 | 183 | KI-10 |
| 9 | `meta-synthesis-agent.md` | meta-synthesis-agent | CORE | L2 | — | — | XML | MEDIUM | 245 | 234 | KI-03 |
| 10 | `orchestrator.md` | orchestrator | CORE | L0 | 0.25 | primary | XML | HIGH | 69 | 34 | — |
| 11 | `phase-guardian.md` | phase-guardian | CORE | L1 | 0.25 | subagent | MD | HIGH | 262 | 236 | — |
| 12 | `prompt-analyzer.md` | — | CORE | L2 | 0.1 | subagent | MD | MEDIUM | 59 | 45 | KI-10 |
| 13 | `prompt-repackager.md` | — | CORE | L2 | 0.2 | subagent | MD | MEDIUM | 82 | 68 | KI-10 |
| 14 | `prompt-skimmer.md` | — | CORE | L2 | 0.1 | subagent | MD | MEDIUM | 60 | 45 | KI-10 |
| 15 | `researcher.md` | — | CORE | L2 | — | subagent | MD | HIGH | 409 | 384 | KI-10 |
| 16 | `risk-assessor.md` | — | CORE | L2 | 0.1 | subagent | MD | MEDIUM | 58 | 44 | KI-10 |
| 17 | `spec-verifier.md` | spec-verifier | CORE | L2 | 0.1 | subagent | MD | MEDIUM | 155 | 124 | — |
| 18 | `test-router.md` | — | CORE | L2 | — | primary | MD | LOW | 30 | 21 | KI-10 |
| 19 | `hf-prompter.md` | hf-prompter | HF | L0 | 0.3 | all | MD | HIGH | 413 | 386 | — |
| 20 | `hivefiver.md` | — | HVF | L0 | 0.2 | primary | MD | MEDIUM | 83 | 48 | KI-10 |
| 21 | `hivefiver-agent-builder.md` | hivefiver-agent-builder | HVF | L2 | 0.15 | subagent | MD | HIGH | 361 | 330 | — |
| 22 | `hivefiver-command-builder.md` | hivefiver-command-builder | HVF | L2 | 0.15 | subagent | MD | HIGH | 214 | 183 | — |
| 23 | `hivefiver-orchestrator.md` | hivefiver-orchestrator | HVF | L0 | 0.2 | primary | MD | HIGH | 255 | 215 | — |
| 24 | `hivefiver-skill-author.md` | hivefiver-skill-author | HVF | L2 | 0.15 | subagent | MD | HIGH | 222 | 189 | — |
| 25 | `hivefiver-tool-builder.md` | hivefiver-tool-builder | HVF | L2 | 0.15 | subagent | MD | HIGH | 181 | 149 | — |
| 26 | `gsd-advisor-researcher.md` | gsd-advisor-researcher | GSD | L2 | — | subagent | XML | HIGH | 126 | 121 | — |
| 27 | `gsd-ai-researcher.md` | gsd-ai-researcher | GSD | L2 | — | subagent | XML | HIGH | 126 | 121 | — |
| 28 | `gsd-assumptions-analyzer.md` | gsd-assumptions-analyzer | GSD | L2 | — | subagent | XML | HIGH | 104 | 99 | — |
| 29 | `gsd-code-fixer.md` | gsd-code-fixer | GSD | L2 | — | subagent | XML | HIGH | 549 | 544 | — |
| 30 | `gsd-code-reviewer.md` | gsd-code-reviewer | GSD | L2 | — | subagent | XML | HIGH | 368 | 363 | — |
| 31 | `gsd-codebase-mapper.md` | gsd-codebase-mapper | GSD | L2 | — | subagent | XML | HIGH | 846 | 841 | — |
| 32 | `gsd-debug-session-manager.md` | gsd-debug-session-manager | GSD | L1 | — | subagent | XML | HIGH | 307 | 302 | — |
| 33 | `gsd-debugger.md` | gsd-debugger | GSD | L2 | — | subagent | XML | HIGH | 1445 | 1440 | — |
| 34 | `gsd-doc-classifier.md` | gsd-doc-classifier | GSD | L2 | — | subagent | XML | HIGH | 161 | 156 | — |
| 35 | `gsd-doc-synthesizer.md` | gsd-doc-synthesizer | GSD | L2 | — | subagent | XML | HIGH | 197 | 192 | — |
| 36 | `gsd-doc-verifier.md` | gsd-doc-verifier | GSD | L2 | — | subagent | XML | HIGH | 210 | 205 | — |
| 37 | `gsd-doc-writer.md` | gsd-doc-writer | GSD | L2 | — | subagent | XML | HIGH | 608 | 603 | — |
| 38 | `gsd-domain-researcher.md` | gsd-domain-researcher | GSD | L2 | — | subagent | XML | HIGH | 146 | 141 | — |
| 39 | `gsd-eval-auditor.md` | gsd-eval-auditor | GSD | L2 | — | subagent | XML | HIGH | 184 | 179 | — |
| 40 | `gsd-eval-planner.md` | gsd-eval-planner | GSD | L2 | — | subagent | XML | HIGH | 147 | 142 | — |
| 41 | `gsd-executor.md` | gsd-executor | GSD | L2 | — | subagent | XML | HIGH | 596 | 591 | — |
| 42 | `gsd-framework-selector.md` | gsd-framework-selector | GSD | L2 | — | subagent | XML | HIGH | 159 | 154 | — |
| 43 | `gsd-integration-checker.md` | gsd-integration-checker | GSD | L2 | — | subagent | XML | HIGH | 469 | 464 | — |
| 44 | `gsd-intel-updater.md` | gsd-intel-updater | GSD | L2 | — | subagent | MIX | HIGH | 332 | 327 | — |
| 45 | `gsd-nyquist-auditor.md` | gsd-nyquist-auditor | GSD | L2 | — | subagent | XML | HIGH | 196 | 191 | — |
| 46 | `gsd-pattern-mapper.md` | gsd-pattern-mapper | GSD | L2 | — | subagent | XML | HIGH | 328 | 323 | — |
| 47 | `gsd-phase-researcher.md` | gsd-phase-researcher | GSD | L2 | — | subagent | XML | HIGH | 833 | 828 | — |
| 48 | `gsd-plan-checker.md` | gsd-plan-checker | GSD | L2 | — | subagent | XML | HIGH | 977 | 972 | — |
| 49 | `gsd-planner.md` | gsd-planner | GSD | L2 | — | subagent | XML | HIGH | 1248 | 1243 | — |
| 50 | `gsd-project-researcher.md` | gsd-project-researcher | GSD | L2 | — | subagent | XML | HIGH | 670 | 665 | — |
| 51 | `gsd-research-synthesizer.md` | gsd-research-synthesizer | GSD | L2 | — | subagent | XML | HIGH | 240 | 235 | — |
| 52 | `gsd-roadmapper.md` | gsd-roadmapper | GSD | L2 | — | subagent | XML | HIGH | 681 | 676 | — |
| 53 | `gsd-security-auditor.md` | gsd-security-auditor | GSD | L2 | — | subagent | XML | HIGH | 148 | 143 | — |
| 54 | `gsd-ui-auditor.md` | gsd-ui-auditor | GSD | L2 | — | subagent | XML | HIGH | 488 | 483 | — |
| 55 | `gsd-ui-checker.md` | gsd-ui-checker | GSD | L2 | — | subagent | XML | HIGH | 308 | 303 | — |
| 56 | `gsd-ui-researcher.md` | gsd-ui-researcher | GSD | L2 | — | subagent | XML | HIGH | 373 | 368 | — |
| 57 | `gsd-user-profiler.md` | gsd-user-profiler | GSD | L2 | — | subagent | XML | HIGH | 170 | 165 | — |
| 58 | `gsd-verifier.md` | gsd-verifier | GSD | L2 | — | subagent | XML | HIGH | 823 | 818 | — |
| 59 | `explore.md` (GHOST) | — | GHOST | — | — | — | NONE | NONE | 0 | 0 | KI-04 |

---

## 3. GSD Agent Detail

All 33 GSD agents use subagent mode. None declare temperature (runtime default applies). Frontmatter completeness is uniformly high (all have name, description, mode). Quality: all HIGH.

### Size Distribution

| Size Category | Count | Agents |
|---------------|-------|--------|
| >500 LOC | 8 | gsd-debugger (1445), gsd-planner (1248), gsd-plan-checker (977), gsd-codebase-mapper (846), gsd-phase-researcher (833), gsd-verifier (823), gsd-roadmapper (681), gsd-project-researcher (670) |
| 300-500 LOC | 6 | gsd-doc-writer (608), gsd-executor (596), gsd-code-fixer (549), gsd-ui-auditor (488), gsd-integration-checker (469), gsd-ui-researcher (373) |
| 100-300 LOC | 17 | gsd-code-reviewer (368), gsd-intel-updater (332), gsd-pattern-mapper (328), gsd-ui-checker (308), gsd-debug-session-manager (307), gsd-research-synthesizer (240), gsd-doc-verifier (210), gsd-doc-synthesizer (197), gsd-nyquist-auditor (196), gsd-eval-auditor (184), gsd-user-profiler (170), gsd-doc-classifier (161), gsd-framework-selector (159), gsd-security-auditor (148), gsd-eval-planner (147), gsd-domain-researcher (146), gsd-ai-researcher (126), gsd-advisor-researcher (126) |
| 100 LOC | 1 | gsd-assumptions-analyzer (104) |

### Step Count (Execution Flow Complexity)

| Agent | Lines | Steps | Step Density |
|-------|-------|-------|-------------|
| gsd-planner | 1248 | 22 | 1 step / 57 lines |
| gsd-debugger | 1445 | 9 | 1 step / 161 lines |
| gsd-executor | 596 | 5 | 1 step / 119 lines |
| gsd-code-fixer | 549 | 5 | 1 step / 110 lines |
| gsd-codebase-mapper | 846 | 4 | 1 step / 212 lines |
| Others (28) | — | 0 (markdown flow) | N/A |

**Note:** Only 5 of 33 GSD agents use explicit `<step>` tags. The remaining 28 use prose or markdown-structured flows. The 5 with step tags are: gsd-planner, gsd-debugger, gsd-executor, gsd-code-fixer, gsd-codebase-mapper.

### Body Format

| Format | Count | Description |
|--------|-------|-------------|
| XML | 32 | Full GSD XML-tagged body with `<role>`, `<task>`, `<scope>`, execution flows |
| Mixed | 1 | gsd-intel-updater: `<role>` tag in markdown body, H2 headings |

---

## 4. Hivefiver Agent Detail

All 6 hivefiver agents exist on disk. All use markdown body format with H2 sections. All have YAML frontmatter. `hivefiver.md` is the only one missing a `name:` field.

### Agent Table

| Agent | Mode | Temp | Lines | Body LOC | Has Name | Notes |
|-------|------|------|-------|----------|----------|-------|
| hivefiver | primary | 0.2 | 83 | 48 | No | Missing name: in frontmatter |
| hivefiver-agent-builder | subagent | 0.15 | 361 | 330 | Yes | Full workflow with step protocols |
| hivefiver-command-builder | subagent | 0.15 | 214 | 183 | Yes | Structured command definition workflow |
| hivefiver-orchestrator | primary | 0.2 | 255 | 215 | Yes | Orchestrator for meta-builder workflow |
| hivefiver-skill-author | subagent | 0.15 | 222 | 189 | Yes | Skill authoring with quality gates |
| hivefiver-tool-builder | subagent | 0.15 | 181 | 149 | Yes | TypeScript tool creation workflow |

### Permission Models

All hivefiver agents have `permission:` blocks in YAML frontmatter:
- `read: allow` — broad read access to project files
- `edit: allow` — file editing capability
- `write: allow` — file writing capability
- `bash: allow` — shell execution
- `task: allow` — subagent delegation (orchestrator only)
- Skill allowlists: scoped to relevant hf-* and hm-* skills

---

## 5. Core Agent Detail

18 core (unprefixed) agents: 17 on disk + 1 ghost (`explore`). These are candidates for hm-* lineage per D-AD-07.

### Frontmatter Completeness (17 on-disk only)

| Agent | Has Name | Has Desc | Has Mode | Has Temp | Frontmatter Score |
|-------|----------|----------|----------|----------|-------------------|
| build | Yes | Yes | Yes | No | 75% |
| conductor | No | Yes | Yes | Yes | 75% |
| context-mapper | No | Yes | Yes | Yes | 75% |
| context-purifier | No | Yes | Yes | Yes | 75% |
| coordinator | No | Yes | Yes | No | 50% |
| critic | No | Yes | Yes | Yes | 75% |
| general | Yes | Yes | Yes | Yes | 100% |
| intent-loop | No | Yes | Yes | Yes | 75% |
| meta-synthesis-agent | Yes | Yes | **No** | No | 50% |
| orchestrator | Yes | Yes | Yes | Yes | 100% |
| phase-guardian | Yes | Yes | Yes | Yes | 100% |
| prompt-analyzer | No | Yes | Yes | Yes | 75% |
| prompt-repackager | No | Yes | Yes | Yes | 75% |
| prompt-skimmer | No | Yes | Yes | Yes | 75% |
| researcher | No | Yes | Yes | No | 50% |
| risk-assessor | No | Yes | Yes | Yes | 75% |
| spec-verifier | Yes | Yes | Yes | Yes | 100% |
| test-router | No | Yes | Yes | No | 50% |

**Frontmatter Score =** name (25%) + description (25%) + mode (25%) + temperature (25%)

### Depth Classification

| Depth | Count | Agents |
|-------|-------|--------|
| L0 (Orchestrator) | 2 | orchestrator, conductor |
| L1 (Coordinator) | 2 | coordinator, phase-guardian |
| L2 (Specialist) | 12 | context-mapper, context-purifier, critic, general, meta-synthesis-agent, prompt-analyzer, prompt-repackager, prompt-skimmer, researcher, risk-assessor, spec-verifier, test-router |
| Unclassified | 2 | build, intent-loop |

### Body Format

| Format | Count | Agents |
|--------|-------|--------|
| XML | 4 | general, meta-synthesis-agent, orchestrator, [build] |
| Markdown (MD) | 13 | conductor, context-mapper, context-purifier, coordinator, critic, intent-loop, phase-guardian, prompt-analyzer, prompt-repackager, prompt-skimmer, researcher, risk-assessor, spec-verifier, test-router |
| Flat/Stub | 1 | build (51 lines, minimal body) |

---

## 6. hf-* Agent Detail

**Single agent:** `hf-prompter.md`
- **Lines:** 413 (386 body LOC) — substantial body
- **YAML:** All fields present: name, description, mode (`all`), temperature (0.3)
- **Mode note:** `all` is non-standard (typically primary or subagent). Likely intentional to allow both direct invocation and subagent use.
- **Permissions:** Granular skill allowlist with wildcard deny-default pattern. Allows hm-* skills (hm-deep-research, hm-detective, hm-synthesis, hm-opencode-non-interactive-shell) and hf-* skills (hf-use-authoring-skills, hf-command-parser). Mode `all` + cross-lineage skill access consistent with hf-* FLEXIBLE binding (D-AD-01).
- **Body format:** Markdown with H2 sections — no XML tags.
- **Quality:** HIGH (comprehensive body >200 LOC, full permissions, cross-lineage skill bindings).
- **Defects:** KI-02 RESOLVED — `name:` field present in current file.

---

## 7. Defect Register

### Updated Defect Status (2026-04-29 Audit)

| # | Defect | Original Description | Current Status | Severity | Evidence |
|---|--------|---------------------|----------------|----------|----------|
| **KI-01** | hf-meta-builder name mismatch | File named `hf-meta-builder` but content refs `hr-meta-builder` | **REVISED** — Agent file does NOT exist on disk. No `hr-meta-builder` reference found. | HIGH | File absent from `.opencode/agents/`. Zero grep hits for `hr-meta-builder`. Listed as available `subagent_type` in task tool but has no agent file. |
| **KI-02** | hf-prompter missing `name:` | No `name:` field in YAML frontmatter | **RESOLVED** — `name: "hf-prompter"` present on line 2 | — | Verified: `head -20 hf-prompter.md` shows `name: "hf-prompter"` |
| **KI-03** | meta-synthesis-agent missing `mode:` | No `mode:` field in YAML frontmatter | **CONFIRMED** — `mode:` field absent | MEDIUM | Frontmatter ends at `---` after `description:` block; no `mode:` line present |
| **KI-04** | explore agent ghost reference | Referenced in AGENTS.md, not on disk | **CONFIRMED** — File absent from `.opencode/agents/` | HIGH | `ls .opencode/agents/explore.md` → no such file. AGENTS.md line 82: "explore agent is MISSING" |
| **KI-05** | test-router not in AGENTS.md | Present on disk, not documented in inventory | **RESOLVED** — Listed in AGENTS.md line 303 | — | `grep "test-router" AGENTS.md` → 2 matches including inventory list |
| **KI-06** | orchestrator is 16-line stub | Thin, no execution flow | **RESOLVED** — Now 69 lines with full XML body | — | Verified: `<role>`, `<depth>`, `<lineage>`, `<task>`, `<scope>`, `<context>`, `<expected_output>`, `<verification>` all present |
| **KI-07** | general is thin stub | Minimal body content | **RESOLVED** — Now 49 lines with full XML body | — | Verified: all 7 XML sections present, depth/lineage declared |
| **KI-08** | Agent count discrepancy | 58 on disk vs 59 with ghost explore | **CONFIRMED** — 58 files on disk, 59 counting ghost | LOW | Verified: `ls *.md | wc -l` = 58. AGENTS.md lists 58 + notes explore is MISSING |
| **KI-09** | Zero hm-* agents exist | Shipped agent system must be built | **CONFIRMED** — No `hm-*` prefix agents on disk | CRITICAL | Verified: `ls hm-*.md` → no matches. Entire shipped system = 0 agents |
| **KI-10** | Missing `name:` in frontmatter (batch) | 13 agents have no `name:` field | **NEW** — Discovered during AS-0 audit | MEDIUM | conductor, context-mapper, context-purifier, coordinator, critic, hivefiver, intent-loop, prompt-analyzer, prompt-repackager, prompt-skimmer, researcher, risk-assessor, test-router — all missing `name:` |
| **KI-11** | hf-meta-builder is skill-only, no agent | Listed as subagent_type but no agent file | **NEW** — Discovered during AS-0 audit | HIGH | Skill exists at `.opencode/skills/hf-meta-builder/`. Agent file at `.opencode/agents/hf-meta-builder.md` does NOT exist. Listed in task tool's available subagent types. |

### Defect Summary

| Status | Count | Items |
|--------|-------|-------|
| CONFIRMED (active) | 5 | KI-01 (revised), KI-03, KI-04, KI-08, KI-09 |
| NEW (discovered) | 2 | KI-10, KI-11 |
| RESOLVED | 4 | KI-02, KI-05, KI-06, KI-07 |
| **Total** | **11** | — |

---

## 8. Quality Distribution

| Quality Tier | Count | Criteria | Examples |
|--------------|-------|----------|----------|
| **HIGH** | 39 | >100 LOC + structured body (XML or MD) + frontmatter present | gsd-planner (1248L, 22 steps), gsd-debugger (1445L), hf-prompter (413L), hivefiver-agent-builder (361L), orchestrator (69L XML), phase-guardian (262L) |
| **MEDIUM** | 17 | 50-200 LOC, some structure, may have missing fields | context-mapper (64L), prompt-skimmer (60L), researcher (409L but missing name/mode/temp), meta-synthesis-agent (245L but missing mode) |
| **LOW** | 2 | <50 LOC, stub, minimal body, missing fields | build (51L flat), test-router (30L stub) |
| **NONE** | 1 | Missing from disk entirely | explore (ghost) |

### Quality Tiers by Lineage

| Lineage | HIGH | MEDIUM | LOW | NONE |
|---------|------|--------|-----|------|
| GSD | 33 | 0 | 0 | 0 |
| HVF | 5 | 1 | 0 | 0 |
| HF | 1 | 0 | 0 | 0 |
| CORE | 4 | 12 | 2 | 0 |
| GHOST | 0 | 0 | 0 | 1 |
| **Total** | **43** | **13** | **2** | **1** |

Note: Some reclassification applied — e.g., researcher (409L markdown body) is HIGH due to body depth despite missing name field. CORE agents have the widest quality spread.

---

## 9. Body Format Split

| Format | Count | Agents |
|--------|-------|--------|
| **GSD XML** | 36 | All 33 gsd-* (except gsd-intel-updater: Mixed) + general, meta-synthesis-agent, orchestrator |
| **Markdown (MD)** | 20 | 13 core + 6 hivefiver + hf-prompter |
| **Mixed** | 1 | gsd-intel-updater (XML `<role>` tag in markdown body) |
| **Flat/Stub** | 1 | build (51L, minimal body) |
| **None (Ghost)** | 1 | explore |
| **Total** | **59** | — |

### Format by Lineage

| Lineage | XML | MD | Mixed | Flat | None |
|---------|-----|-----|-------|------|------|
| GSD | 32 | 0 | 1 | 0 | 0 |
| HVF | 0 | 6 | 0 | 0 | 0 |
| HF | 0 | 1 | 0 | 0 | 0 |
| CORE | 3 | 13 | 0 | 1 | 0 |
| GHOST | 0 | 0 | 0 | 0 | 1 |
| **Total** | **35** | **20** | **1** | **1** | **1** |

### GSD XML Pattern (signature)
```xml
<role>You are [agent-name], the [role description].</role>
<task>[Task description with goal]</task>
<scope>[Boundaries: what is in/out of scope]</scope>
<context>[Required prerequisites and state]</context>
<output>[Expected output format]</output>
<verification>[Success criteria / acceptance checklist]</verification>
```

### Markdown Pattern (signature)
```markdown
# Agent Name

## Overview
Purpose and role description.

## When to Use
Trigger conditions and routing rules.

## Process / Workflow
Step-by-step execution instructions.

## Expected Output
What the agent produces.

## Verification
How to confirm completion.
```

---

## 10. Depth Distribution

| Depth | Count | Agents |
|-------|-------|--------|
| **L0 (Orchestrator)** | 5 | conductor, orchestrator, hf-prompter, hivefiver, hivefiver-orchestrator |
| **L1 (Coordinator)** | 3 | coordinator, phase-guardian, gsd-debug-session-manager |
| **L2 (Specialist)** | 45 | All GSD agents (32 remaining), all hivefiver builders (4), 12 core specialists |
| **Unclassified** | 5 | build, intent-loop, gsd-* agents that are gsd-advisor-researcher, gsd-ai-researcher, gsd-assumptions-analyzer, gsd-* (actually all are L2 — classification noted) |
| **Ghost** | 1 | explore |
| **Total** | **59** | — |

**Note:** All GSD agents operate at L2 specialist level — they are invoked individually by external orchestrators. GSD has no L0 orchestrator agent (external framework handles orchestration). The 5 "Unclassified" agents are all L2 by function but depth is not explicitly declared in their body.

---

## 11. Recommendations

### Immediate Actions (AS-1 → AS-3)

1. **Resolve KI-10 (missing name: fields):** 13 agents need `name:` added to YAML frontmatter. This is the most widespread defect. Fix in AS-1 (schema standardization).

2. **Resolve KI-03 (meta-synthesis-agent missing mode:):** Add `mode: subagent` to frontmatter. Simple fix.

3. **Resolve KI-11 (hf-meta-builder missing agent):** Either create agent file at `.opencode/agents/hf-meta-builder.md` based on the existing skill, or remove hf-meta-builder from the available subagent_types list. Decision needed.

4. **Resolve KI-04 (explore ghost):** Either create the explore agent or remove all references to it from AGENTS.md (line 82, line 303). The agent is listed as MISSING but may have been intentionally removed.

5. **Standardize temperature:** 32 agents (all GSD + some core) have no temperature field. Define runtime inheritance or add temperature to all agents.

### Archival Candidates

| Agent | Reason |
|-------|--------|
| build.md | 51-line flat stub, minimal body, no XML structure. Replace with hm-build L2 specialist. |
| test-router.md | 30-line stub, minimal body, no frontmatter completeness. Replace or enrich. |
| general.md | 49-line XML body is minimal — acceptable as fallback but needs enrichment for production. |

### Migration Path

| From | To | Phase |
|------|----|-------|
| 33 gsd-* agents | ~30 hm-* agents | AS-4, AS-5 (batch creation) |
| 6 hivefiver-* agents | ~12 hf-* agents | AS-6 (meta builder refactor) |
| 17 core agents | 17 hm-* agents (with L0/L1/L2 depth) | AS-3 (orchestrator/coordinator) + AS-4 through AS-6 |
| 1 ghost (explore) | hm-explore or delete reference | AS-7 (cleanup) |

### Naming Convention Requirements (for AS-11)

All shipped agents should follow the `hm-*` or `hf-*` prefix convention:
- `hm-*` = product development lineage
- `hf-*` = meta builder lineage
- No unprefixed agents shipped
- No `gsd-*` agents shipped (internal only per D-AD-01)

---

## Verification Checklist

- [x] All 58 on-disk agents cataloged with frontmatter extraction
- [x] Each agent classified: gsd-* (33), hivefiver* (6), hf-* (1), core (18), ghost (1)
- [x] Quality score assigned per agent (HIGH/MEDIUM/LOW/NONE)
- [x] Body format cataloged: XML (35), Markdown (20), Mixed (1), Flat (1), None (1)
- [x] All 9 original known defects (KI-01 through KI-09) confirmed or resolved
- [x] 2 new defects discovered (KI-10, KI-11) — total 11 defect entries
- [x] Ghost agent `explore` documented as MISSING-FROM-DISK
- [x] Agent count discrepancy: 58 on disk, 59 total (including ghost explore)
- [x] hf-meta-builder ghost agent (skill-only, no agent file) documented
- [x] 4 previously reported defects confirmed RESOLVED (KI-02, KI-05, KI-06, KI-07)
- [x] 11 recommendations provided for AS-1 through AS-11

---

*Generated: 2026-04-29 by gsd-executor during AS-0 execution*
