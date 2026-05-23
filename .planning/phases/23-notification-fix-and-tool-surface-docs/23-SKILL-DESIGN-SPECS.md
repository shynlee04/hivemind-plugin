# Phase 23: Skill Design Specifications

**Date:** 2026-05-22
**Purpose:** Record WHAT each target skill should do, its constraints, patterns, and references. NOT for direct SKILL.md creation. Consumed by `.hivefiver-meta-builder/skills-lab/` for proper skill authoring.
**Status:** DESIGN RECORD — do not create SKILL.md files from this directly

---

## 0. Skill Creation Standards (Non-Negotiable)

### 0.1 Architecture Rules

| Rule | Description |
|------|-------------|
| **THIN but DEEP** | Skills must be compact (150-300 lines) but reference external files (references/, assets/, templates/) for depth. NO inline inflation. |
| **Conditional Loading** | Skill A MUST NOT load Skill B unless the current workflow step requires it. Declare conditional loading rules explicitly. |
| **Jump Link Verification** | ALL `<files_to_read>` and cross-skill links MUST be verified to exist at runtime. User report: jump links and progressive disclosure do NOT work in loaded skills — this MUST be tested before declaring any skill complete. |
| **Source of Truth** | Author in `.hivefiver-meta-builder/skills-lab/`, reflect to `.opencode/skills/`. NEVER author directly in `.opencode/skills/`. |
| **Lineage** | hm-* = product-dev (STRICT). hf-* = meta-builder (FLEXIBLE). gate-* = internal quality. stack-* = reference. gsd-* = dev tooling (NOT shipped). |
| **Context Budget** | Max 300 lines / ~2500 tokens per skill. If >300 lines, MUST split into references/. |
| **allowed-tools** | Every tool referenced in SKILL.md body MUST be declared in frontmatter `allowed-tools`. Verify against actual tool names. |
| **No Aspirational Patterns** | Every referenced tool, script, gate, or workflow MUST exist in the codebase. NO aspirational references. |
| **Progressive Disclosure** | If progressive disclosure links are used, they MUST be tested to WORK at runtime. If they don't work, use inline summaries instead. |
| **GSD/OMO Transformation** | Extract PHILOSOPHICAL principles from GSD/OMO patterns, transform to Hivemind conventions, NEVER copy-paste. |

### 0.2 Skill Template Classes

| Class | Template | Structure | allowed-tools |
|-------|----------|-----------|---------------|
| **ORCHESTRATION** | hm-l2-phase-execution | Iron Law + Protocol Steps + Anti-Patterns table + Self-Correction (4 modes) + Cross-References | Read, Write, Edit, Bash, Glob, Grep, Task, todowrite, skill, execute-slash-command, hivemind-command-engine |
| **REFERENCE** | hm-l3-hivemind-engine-contracts | IRON CLAW 5-step chain + contract tables + Self-Correction | Read, Grep, Glob, Bash. `context-bomb: true` |
| **WORKFLOW** | hm-l2-debug | Iron Law + Step-by-step protocol + Anti-Patterns + Self-Correction (4 modes) | Read, Write, Edit, Bash, Glob, Grep |

### 0.3 Required Sections (All Skills)

1. `<objective>` — single paragraph: what this skill does
2. `<execution_context>` — files to load (MUST verify existence)
3. **Iron Law** — 3-5 non-negotiable rules
4. **Protocol/Main Process** — step-by-step (REFERENCES template: IRON CLAW chain; WORKFLOW template: protocol steps; ORCHESTRATION: coordination steps)
5. **Anti-Patterns Table** — 5-10 rows max
6. **Self-Correction** (4 modes: deviation, failure, conflict, checkpoint)
7. **Cross-References** — links to related skills (MUST verify jump links work)

---

## 1. Wave 2: NEW Skills (2 skills)

### 1.1 hm-l3-tool-surface-documentation

**Type:** REFERENCE
**Priority:** HIGH
**Source:** Wave 2, Plan 23-02

**Purpose:** Definitive tool surface differentiation. Agent uses this to understand which tool to call for which purpose.

**Requirements:**
- Cover ALL 14+ Hivemind custom tools
- Each tool: description, actions table, when-to-use, limitations
- CRITICAL: Differentiation matrix (task vs delegate-task vs execute-slash-command)
- ALL information verified against actual source code in src/tools/
- Reference OpenCode ecosystem patterns (transformed)
- Pattern template: hm-l3-hivemind-engine-contracts

**Verification:**
- Cross-reference every tool against `src/tools/` directory listing
- Every action mentioned must exist in the actual tool source
- ALLOWED-TOOLS verified (skill needs Read, Grep, Glob, Bash for reference lookups)

**References needed:**
- `references/tool-surface-classification.md` — classification categories
- `references/surface-diffusion-matrix.md` — the differentiation matrix

### 1.2 hm-l3-injection-delivery-patterns

**Type:** REFERENCE
**Priority:** HIGH
**Source:** Wave 2, Plan 23-03

**Purpose:** Document 4 injection delivery patterns for Hivemind notification. Reference implementation is notification-handler.ts after P23-01 fix.

**Requirements (4 patterns):**
1. **Silent Injection** — `synthetic: true` + `noReply: true` → body context (non-terminal notifications)
2. **Urgent Notification** — `appendTuiPrompt()` + `synthetic: true` body (terminal states)
3. **Stream Reactivation** — empty `synthetic: true` prompt (wake idle sessions)
4. **Direct Session Injection** — `sendPrompt()` with full parts (complex payloads)

**Verification:**
- Every pattern MUST reference real code from notification-handler.ts (after P23-01 fix)
- ALLOWED-TOOLS: Read, Grep, Glob, Bash

**References needed:**
- `references/injection-patterns-catalog.md` — all 4 patterns with examples
- `references/delivery-mechanisms.md` — TUI vs session vs synthetic mechanisms

---

## 2. Wave 3A: ORCHESTRATION Skills (5 skills)

### 2.1 hm-l2-coordinating-loop (REWRITE)

**Type:** ORCHESTRATION
**Priority:** P0
**Current issues:**
- 6 broken `<files_to_read>` paths: uses `hm-coordinating-loop` instead of `hm-l2-coordinating-loop`
- allowed-tools missing: `delegate-task`, `execute-slash-command`, `hivemind-command-engine`
- 448 lines — too large. Must trim to <300 lines
- References `hm-planning-persistence` — verify it exists
- scripts/ directory: 9 bash scripts. Architectural impurity (GSD pattern). Document as exception or migrate.

**Fix list:** (P0 — implement FIRST)
1. Fix 6 `<files_to_read>` paths: `hm-coordinating-loop` → `hm-l2-coordinating-loop`
2. Add missing allowed-tools: `delegate-task`, `execute-slash-command`, `hivemind-command-engine`, session tools
3. Trim worked example (lines 242-314, ~70 lines) — move to references/
4. Remove or trim Platform Adaptation section (lines 388-410) — rarely used

**What must remain:**
- Iron Law: orchestrator coordinates, not executes
- Protocol: RECEIVE → ANALYZE → DECIDE MODE → DISPATCH → MONITOR → VERIFY → HANDOFF
- Decision matrix for dispatching mode
- Wave coordination rules
- checkpoint/gate protocol

### 2.2 hm-l2-gate-orchestrator (REWRITE)

**Type:** ORCHESTRATION
**Priority:** HIGH
**Current:** 221 lines, SMALL budget. Reference paths all exist.

**Rewrite to:**
- Remove all bash gate script references
- Replace with actual tool-based or hook-based gates
- Integrate with `gate-l3-*` triad (lifecycle → spec → evidence)
- Route through actual quality gate triad skills
- Decision matrix: when to run which gate
- Context budget: keep < 250 lines

**Key constraint:** This skill routes to 3 gate skills. Must declare conditional loading: "load `gate-l3-*` ONLY when running gate pass".

### 2.3 hm-l2-phase-execution (REWRITE)

**Type:** ORCHESTRATION
**Priority:** HIGH
**Current issue:** Legacy state paths reference `.opencode/state/` (deprecated) instead of `.hivemind/`.

**Rewrite:**
- Fix all state paths: `.opencode/state/` → `.hivemind/`
- Remove aspirational wave-based infrastructure references
- Real execution paths only
- Wave coordination with checkpoint protocol
- Parallel execution rules & conflict detection

### 2.4 hm-l2-phase-loop (REWRITE)

**Type:** ORCHESTRATION
**Priority:** HIGH
**Current:** Aspirational loop semantics

**Rewrite:**
- Thin orchestration skill
- Entry/exit gates
- Max iteration enforcement (max-3-loop pattern from GSD, transformed)
- Escalation protocol
- Loop termination conditions

### 2.5 hm-l2-completion-looping (REWRITE or DEPRECATE)

**Type:** ORCHESTRATION
**Priority:** HIGH
**Current:** Ralph-loop references ("totally nonsensical" per user)

**Rewrite:**
- Replace ralph-loop with practical verification patterns
- Durable cursor fields from RESEARCH.md section 4
- Self-verification gates
- Non-completion detection and automatic loop-back
- Options: deprecate if functionality overlaps with phase-loop

---

## 3. Wave 3B: FOUNDATION (1 skill)

### 3.1 hivemind-power-on (REWRITE)

**Type:** ORCHESTRATION (but FOUNDATION role)
**Priority:** P0
**Current:** 236 lines. Redundant Section 7 (Short Version) duplicates Section 2.

**Rewrite:**
- LOAD FIRST skill — session governance
- Trim from 236 → ~150 lines:
  - Remove Section 7 (Short Version) — full duplicate of Section 2
  - Remove Section 5.5 (Tool Catalog) — duplicate of tool-capability-matrix
  - Keep accurate tool catalog references (with verification)
- Use REAL tool capabilities only:
  - `session-tracker` for session discovery
  - `session-hierarchy` for parent-child navigation
  - `session-context` for cross-session synthesis
  - `hivemind-session-view` for unified views
- NO aspirational workflows
- Verify ALL tool references exist

---

## 4. Wave 3C: AUDIT/REFERENCE Skills (8 skills)

### 4.1 hm-l3-hivemind-engine-contracts (SYNC)

**Type:** REFERENCE
**Priority:** MEDIUM
**Action:** Sync with actual src/ surfaces
**Verify:** Every tool/hook/contract mentioned matches current source code

### 4.2 hm-l3-hivemind-state-reference (SYNC)

**Type:** REFERENCE
**Priority:** MEDIUM
**Action:** Sync with actual .hivemind/ structure
**Verify:** Every state path mentioned exists in .hivemind/ directory

### 4.3 hm-l3-integration-contracts (VALIDATE)

**Type:** REFERENCE
**Priority:** MEDIUM
**Action:** Validate agent-skill binding contracts
**Verify:** Every declared agent-skill binding matches actual .opencode/agents/ files

### 4.4 hm-l3-tool-capability-matrix (SYNC)

**Type:** REFERENCE
**Priority:** MEDIUM
**Action:** Sync with current tool catalog (23+ tools)
**Verify:** Every tool mentioned exists in src/tools/

### 4.5 hm-l2-subagent-delegation-patterns (CREATE — directory missing)

**Type:** WORKFLOW
**Priority:** MEDIUM
**Note:** This skill directory does NOT exist. Must be CREATED, not rewritten.
**Requirements:** Accurate tool surface descriptions for all delegation patterns

### 4.6 hm-l2-user-intent-interactive-loop (AUDIT + FIX)

**Type:** WORKFLOW
**Priority:** MEDIUM
**Action:** Audit for aspirational patterns. Fix any vague "ask user" patterns without concrete question format.

### 4.7 hm-l2-cross-cutting-change (AUDIT + FIX)

**Type:** WORKFLOW
**Priority:** MEDIUM
**Action:** Cross-pane references may be outdated. Verify all file/process references.

### 4.8 hm-l2-debug (AUDIT + FIX)

**Type:** WORKFLOW
**Priority:** MEDIUM
**Action:** Check for aspirational debug infrastructure references. Ensure scientific method protocol is correct.

---

## 5. Skill Execution Priority Order

```
P0: coordinating-loop (broken paths + allowed-tools) → hivemind-power-on (trim)
P1: 5 ORCHESTRATION skills (coordinating-loop full rewrite, gate-orchestrator, phase-execution, phase-loop, completion-looping)
P2: 2 NEW REFERENCE skills (tool-surface-documentation, injection-delivery-patterns)
P3: hivemind-power-on full rewrite
P4: 8 AUDIT skills (sync/validate/fix)
P5: subagent-delegation-patterns (CREATE — new directory)
```

---

## 6. Jump Link / Progressive Disclosure Verification Protocol

BEFORE declaring any skill complete, MUST test:

1. **Static verification:** Every `<files_to_read>` path points to an existing file
2. **Cross-skill links:** If Skill.md references `hm-l2-*.md` or `hm-l3-*.md`, verify the target file exists
3. **Runtime test:** Load the skill via `/skill` tool → verify the loaded content contains the expected references
4. **Report:** Document which links work and which don't. If progressive disclosure doesn't work, use inline summaries.

**Current known status (from GSD/OMO synthesis):**
- hm-l2-coordinating-loop: 5 of 6 reference paths BROKEN (wrong directory name)
- hivemind-power-on: all 6 references EXIST
- hm-l2-gate-orchestrator: all references EXIST
- hm-l2-completion-looping: all 3 references EXIST
- hm-l3-omo-reference: all references EXIST

---

## 7. Context Budget Optimization Rules

1. Skills MUST NOT exceed 300 lines. If content > 300 lines, split into references/
2. Anti-pattern tables: max 10 rows, compact format (3 columns)
3. Worked examples: max 15 lines inline, rest in references/
4. Self-Correction: max 2 lines per mode, 4 modes total
5. Cross-References: max 10 links, one-liner description each
6. Load `<files_to_read>` via path only — NO inline content from reference files
7. Use `context-bomb: true` only for REFERENCE skills that need exhaustive context

---

*End of Skill Design Specifications — Phase 23*
*Next: Wave 4 (assessment) + Wave 5 (gatekeeping)*
