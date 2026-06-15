# Meta-Builder Consolidation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate the meta-builder skill from a bloated 304-line governance framework into a lean ~120-line routing skill with compliant scripts, clean references, and passing evals.

**Architecture:** Single skill — not split. The meta-builder is a router/traffic cop. All three review plans (SKILL.md, scripts, infrastructure) address layers of the same skill. Deletions first, then rewrites, then compression, then eval fixes.

**Tech Stack:** Bash scripts, JSON state files, Markdown skill definitions, OpenCode skill system.

---

## Phase 1: Deletions (Immediate Safety)

### Task 1: Remove 4 Ghost Reference Files

**Files:**
- Delete: `.opencode/skills/meta-builder/references/01-routing-logic.md` (188 LOC — stale, duplicates SKILL.md routing table AND preflight.sh)
- Delete: `.opencode/skills/meta-builder/references/02-opencode-concepts.md` (190 LOC — stale, content better served by opencode-platform-reference skill)
- Delete: `.opencode/skills/meta-builder/references/03-stacking-rules.md` (153 LOC — superseded by 04-skills-chaining.md)
- Delete: `.opencode/skills/meta-builder/references/04-hivemind-compatibility.md` (55 LOC — generic notes, belongs in project docs)

- [ ] **Step 1: Verify ghost files are truly stale**
  - Read each file's first 10 lines to confirm they are from the prior version
  - Confirm none are referenced by the new reference files (01-05)
  - Expected: All 4 are legacy, none are referenced by new files

- [ ] **Step 2: Delete all 4 ghost files**
  Run: `rm .opencode/skills/meta-builder/references/01-routing-logic.md .opencode/skills/meta-builder/references/02-opencode-concepts.md .opencode/skills/meta-builder/references/03-stacking-rules.md .opencode/skills/meta-builder/references/04-hivemind-compatibility.md`
  Expected: All 4 deleted, no errors

- [ ] **Step 3: Verify deletion**
  Run: `ls .opencode/skills/meta-builder/references/`
  Expected: Only `01-mindsnetwork-graph.md`, `02-deterministic-control.md`, `03-long-horizon-persistence.md`, `04-skills-chaining.md`, `05-hivefiver-agent.md` remain

- [ ] **Step 4: Commit**
  Run: `git add -u && git commit -m "meta-builder: remove 4 ghost reference files — 586 LOC of stale content eliminated"`

### Task 2: Remove graph-schema.json (Duplicate of graph.json)

**Files:**
- Delete: `.opencode/skills/meta-builder/.meta-builder/graph-schema.json` (192 LOC — byte-for-byte identical to graph.json, confirmed by diff)

- [ ] **Step 1: Confirm duplication**
  Run: `diff .opencode/skills/meta-builder/.meta-builder/graph.json .opencode/skills/meta-builder/.meta-builder/graph-schema.json`
  Expected: No output (files are identical)

- [ ] **Step 2: Delete graph-schema.json**
  Run: `rm .opencode/skills/meta-builder/.meta-builder/graph-schema.json`
  Expected: File deleted

- [ ] **Step 3: Commit**
  Run: `git add -u && git commit -m "meta-builder: remove graph-schema.json — duplicate of graph.json"`

### Task 3: Remove 3 Legacy Governance Scripts

**Files:**
- Delete: `.opencode/skills/meta-builder/scripts/preflight.sh` (176 LOC — explicit "Mandatory gate" design, 6 exit 1 calls, hardcoded $HOME paths, intent classification in bash)
- Delete: `.opencode/skills/meta-builder/scripts/verify-hierarchy.sh` (295 LOC — 4 exit 1 calls, 88 LOC of hardcoded prerequisite tables, 5 hardcoded $HOME paths)
- Delete: `.opencode/skills/meta-builder/scripts/stack-validate.sh` (332 LOC — 5 exit 1 calls, 3.3x over complexity limit, trigger/cycle analysis in bash)

- [ ] **Step 1: Verify these scripts are the governance blockers**
  Run: `grep -n 'exit 1' .opencode/skills/meta-builder/scripts/preflight.sh .opencode/skills/meta-builder/scripts/verify-hierarchy.sh .opencode/skills/meta-builder/scripts/stack-validate.sh`
  Expected: 15+ exit 1 calls across 3 files

- [ ] **Step 2: Delete all 3 scripts**
  Run: `rm .opencode/skills/meta-builder/scripts/preflight.sh .opencode/skills/meta-builder/scripts/verify-hierarchy.sh .opencode/skills/meta-builder/scripts/stack-validate.sh`
  Expected: All 3 deleted

- [ ] **Step 3: Commit**
  Run: `git add -u && git commit -m "meta-builder: remove 3 governance scripts — 803 LOC of blocking code eliminated"`

---

## Phase 2: Script Rewrites (Read-Only Probes)

### Task 4: Rewrite graph-init.sh (34 → ~20 LOC)

**Files:**
- Modify: `.opencode/skills/meta-builder/scripts/graph-init.sh`

**Current purpose:** Creates directories, writes initial state JSON files (mkdir, echo >).
**New purpose:** Read-only probe that reports whether graph structure exists. Reports facts: which files exist, which are missing. Always exits 0.

- [ ] **Step 1: Rewrite graph-init.sh**
  Remove all write operations (mkdir, echo >). Replace with existence checks that report facts.
  Acceptance criteria:
  1. Zero write operations (no mkdir, no echo >, no cat >)
  2. Always exits 0
  3. Reports: graph dir exists (true/false), each state file exists (true/false)
  4. Under 30 LOC
  5. No hardcoded paths

- [ ] **Step 2: Verify script runs clean**
  Run: `bash .opencode/skills/meta-builder/scripts/graph-init.sh`
  Expected: Reports facts, exits 0

- [ ] **Step 3: Commit**
  Run: `git add .opencode/skills/meta-builder/scripts/graph-init.sh && git commit -m "meta-builder: rewrite graph-init.sh as read-only probe — no state mutation"`

### Task 5: Rewrite graph-traverse.sh (69 → ~35 LOC)

**Files:**
- Modify: `.opencode/skills/meta-builder/scripts/graph-traverse.sh`

**Current purpose:** Traverses graph with checkpoint/reset/cp actions. Exit 1 on missing files. Mutates state.
**New purpose:** Read-only probe that reports current graph traversal state. Reports active node, completed nodes, graph file contents. Always exits 0. No checkpoint/reset actions.

- [ ] **Step 1: Rewrite graph-traverse.sh**
  Remove all exit 1 calls (lines 16-17, 22-23). Remove checkpoint and reset actions (lines 47-58 — state mutation via cp and echo >). Keep only status and next as read-only probes.
  Acceptance criteria:
  1. Zero exit 1 calls
  2. Zero write operations (no cp, no echo >, no mkdir)
  3. Only status and next actions remain
  4. Reports facts even when files are missing (FINDING: prefix)
  5. Under 40 LOC

- [ ] **Step 2: Verify script runs clean**
  Run: `bash .opencode/skills/meta-builder/scripts/graph-traverse.sh status`
  Expected: Reports facts or FINDING, exits 0

- [ ] **Step 3: Commit**
  Run: `git add .opencode/skills/meta-builder/scripts/graph-traverse.sh && git commit -m "meta-builder: rewrite graph-traverse.sh — remove exit 1, remove state mutation"`

### Task 6: Rewrite state-persist.sh (76 → ~30 LOC)

**Files:**
- Modify: `.opencode/skills/meta-builder/scripts/state-persist.sh`

**Current purpose:** Save session snapshots (writes JSON files), restore from latest. Uses fragile `../../../../..` path traversal. Mutates state.
**New purpose:** Read-only probe that reports state directory contents and latest session metadata. Always exits 0.

- [ ] **Step 1: Rewrite state-persist.sh**
  Remove save action entirely (lines 17-45 — writes session JSON). Remove fragile path traversal (line 9). Remove mkdir (line 12). Convert restore to read-only "latest" action that reports (not restores) latest session path and contents.
  Acceptance criteria:
  1. Zero write operations
  2. Zero mkdir calls
  3. No path traversal deeper than script's parent directory
  4. Always exits 0
  5. Under 35 LOC

- [ ] **Step 2: Verify script runs clean**
  Run: `bash .opencode/skills/meta-builder/scripts/state-persist.sh status`
  Expected: Reports facts, exits 0

- [ ] **Step 3: Commit**
  Run: `git add .opencode/skills/meta-builder/scripts/state-persist.sh && git commit -m "meta-builder: rewrite state-persist.sh — remove save action, fix fragile path"`

### Task 7: Rewrite register-skill.sh (122 → ~25 LOC)

**Files:**
- Modify: `.opencode/skills/meta-builder/scripts/register-skill.sh`

**Current purpose:** Writes/updates loaded-skills.json with skill registration data. Exit 1 on missing root/argument. Heavy JSON manipulation (jq + sed fallback).
**New purpose:** Read-only probe that reports whether a skill appears in loaded-skills.json. Always exits 0.

- [ ] **Step 1: Rewrite register-skill.sh**
  Remove all write operations (mkdir, jq writes, sed writes). Remove exit 1 calls (lines 33-34, 43-44). Replace with read-only grep/jq query against existing file.
  Acceptance criteria:
  1. Zero write operations
  2. Zero exit 1 calls
  3. Zero mkdir calls
  4. Reports skill status from existing loaded-skills.json (read-only)
  5. Under 30 LOC
  6. No hardcoded $HOME paths

- [ ] **Step 2: Verify script runs clean**
  Run: `bash .opencode/skills/meta-builder/scripts/register-skill.sh`
  Expected: Reports facts or FINDING, exits 0

- [ ] **Step 3: Commit**
  Run: `git add .opencode/skills/meta-builder/scripts/register-skill.sh && git commit -m "meta-builder: rewrite register-skill.sh as read-only probe"`

### Task 8: Fix route-check.sh (180 → ~90 LOC)

**Files:**
- Modify: `.opencode/skills/meta-builder/scripts/route-check.sh`

- [ ] **Step 1: Fix route-check.sh**
  Remove exit 1 at lines 27-28 and 176 — replace with error accumulation and exit 0. Remove hardcoded $HOME paths (lines 56-58) — use script-relative paths only. Remove duplicate search path blocks (lines 61-63). Remove deduplication loop (lines 66-82). Remove frontmatter compliance check (lines 147-169). Remove group-skill compatibility check (lines 103-145).
  Acceptance criteria:
  1. Zero exit 1 calls
  2. Zero hardcoded $HOME paths
  3. Under 100 LOC
  4. Reports all findings as PASS/FAIL without blocking
  5. Always exits 0

- [ ] **Step 2: Verify script runs clean**
  Run: `bash .opencode/skills/meta-builder/scripts/route-check.sh`
  Expected: Reports facts, exits 0

- [ ] **Step 3: Commit**
  Run: `git add .opencode/skills/meta-builder/scripts/route-check.sh && git commit -m "meta-builder: fix route-check.sh — remove exit 1, hardcoded paths, shrink to <100 LOC"`

---

## Phase 3: SKILL.md Compression (304 → ~120 lines)

### Task 9: Compress SKILL.md

**Files:**
- Modify: `.opencode/skills/meta-builder/SKILL.md`

Apply all 12 fixes from the SKILL.md fix plan:

- [ ] **Step 1: Rewrite description (FIX-SM-001)**
  Lines 3: Remove jargon ("MINDNETWORK graph", "deterministic multi-agent orchestration"). Add missing trigger phrases: "edit skill", "improve skill", "fix skill trigger", "convert to skill". Remove "plan this workflow" (owned by planning-with-files). Remove "orchestrate agents" (owned by coordinating-loop). Target: <400 characters, third-person, trigger-only.

- [ ] **Step 2: Remove FIRST ACTION governance gate (FIX-SM-002)**
  Lines 19-51: Remove all mandatory bash script invocations. Replace with conditional: IF the task involves multi-node traversal THEN optionally run scripts as fact-probes. Remove the "Gate" line (51). Keep "read planning files" as conditional.

- [ ] **Step 3: Remove ASCII graph art (FIX-SM-003)**
  Lines 55-94: Remove 35-line ASCII diagram. Replace with 2-3 sentence pointer to references/01-mindsnetwork-graph.md. Keep edge types list only if needed for routing table comprehension.

- [ ] **Step 4: Remove execution control protocol (FIX-SM-004)**
  Lines 123-147: Remove NODE EXECUTION PROTOCOL box. Replace with single pointer: "For execution protocol details, load references/02-deterministic-control.md when traversing multi-node paths."

- [ ] **Step 5: Compress routing table (FIX-SM-005)**
  Lines 104-120: Remove rows owned by other skills ("plan this / break it down", "research this domain", "coordinate agents", "help me figure out what I want"). Add "not for me" exit path. Keep core domain only: skill/agent/command/tool creation and configuration.

- [ ] **Step 6: Deduplicate stacking recipes (FIX-SM-006)**
  Lines 171-206: Remove all 4 recipe blocks. Replace with single pointer to references/04-skills-chaining.md. Keep "Max 3 skills per stack" rule inline.

- [ ] **Step 7: Remove/compress worked example (FIX-SM-007)**
  Lines 209-247: Remove entire worked example OR compress to 5 lines showing routing decision only. Fix phantom validate-skill.sh reference → validate-graph.sh.

- [ ] **Step 8: Remove question-enforcement state tracking (FIX-SM-008)**
  Lines 250-255: Keep "Max 3 questions per session" rule. Remove all references to question-count.json. Remove file-based tracking mechanism.

- [ ] **Step 9: Deduplicate anti-patterns, add exit path (FIX-SM-009)**
  Lines 259-269: Remove rows that duplicate references/04-skills-chaining.md. Keep meta-specific anti-patterns only. Add: "The Universal Receiver — activating for requests owned by other skills."

- [ ] **Step 10: Compress long-horizon section (FIX-SM-011)**
  Lines 150-168: Remove state tracking table. Replace with pointer to references/03-long-horizon-persistence.md.

- [ ] **Step 11: Remove platform adaptation table (FIX-SM-012)**
  Lines 285-293: Remove entire table — generic knowledge.

- [ ] **Step 12: Update Reference Map (FIX-SM-010)**
  Lines 296-304: Update to list only the 5 remaining reference files (ghosts deleted in Phase 1).

- [ ] **Step 13: Verify final size**
  Run: `wc -l .opencode/skills/meta-builder/SKILL.md`
  Expected: <200 lines (target ~120)

- [ ] **Step 14: Commit**
  Run: `git add .opencode/skills/meta-builder/SKILL.md && git commit -m "meta-builder: compress SKILL.md from 304 to ~120 lines — remove governance, jargon, duplication"`

---

## Phase 4: Eval Fixes

### Task 10: Fix evals.json

**Files:**
- Modify: `.opencode/skills/meta-builder/evals/evals.json`

- [ ] **Step 1: Fix TC-005 (unpassable negative test)**
  TC-005 expects `should_trigger: false` but preflight.sh (deleted in Phase 1) had no code path for this. Since preflight.sh is gone, update TC-005 to test the new routing behaviour: the SKILL.md should have a "not for me" exit path. Update assertions to check that the skill correctly identifies non-meta-concept requests.

- [ ] **Step 2: Fix TC-007 (violates max 3 skills rule)**
  TC-007 expects 4 skills in stack: `["skill-creator", "coordinating-loop", "meta-builder"]` + primary. This violates the "max 3 skills per stack" rule. Fix: reduce stack_skills to max 2 complement skills + meta-builder = 3 total.

- [ ] **Step 3: Fix TC-008 (false positive — debugging query)**
  TC-008 expects GROUP_2 routing for "JWT validation is wrong, token refresh logic is broken" — this is a debugging request, not skill creation. Fix: update expected output to `should_trigger: false` or route to `systematic-debugging` instead.

- [ ] **Step 4: Add negative trigger tests**
  Add 5+ new test cases for requests that should NOT trigger meta-builder:
  - "explain this code"
  - "what does this function do"
  - "refactor the auth module"
  - "write tests for this"
  - "deploy to staging"

- [ ] **Step 5: Add coverage gap tests**
  Add tests for: multi-intent requests, ambiguous requests, scoring boundary cases, error paths.

- [ ] **Step 6: Commit**
  Run: `git add .opencode/skills/meta-builder/evals/evals.json && git commit -m "meta-builder: fix evals — TC-005, TC-007, TC-008, add negative trigger tests"`

### Task 11: Update Reference Map in SKILL.md

**Files:**
- Modify: `.opencode/skills/meta-builder/SKILL.md` (Reference Map section)

- [ ] **Step 1: Verify all 5 remaining references are listed**
  Confirm Reference Map includes: 01-mindsnetwork-graph.md, 02-deterministic-control.md, 03-long-horizon-persistence.md, 04-skills-chaining.md, 05-hivefiver-agent.md

- [ ] **Step 2: Remove references to deleted files**
  Ensure no mention of: 01-routing-logic.md, 02-opencode-concepts.md, 03-stacking-rules.md, 04-hivemind-compatibility.md

- [ ] **Step 3: Commit** (if not already committed with Task 9)

---

## Phase 5: Validation

### Task 12: Run All Validation Scripts

- [ ] **Step 1: Run validate-graph.sh**
  Run: `bash .opencode/skills/meta-builder/scripts/validate-graph.sh`
  Expected: VALID=true, no FINDING lines

- [ ] **Step 2: Run graph-init.sh**
  Run: `bash .opencode/skills/meta-builder/scripts/graph-init.sh`
  Expected: Reports facts, READY=true, exits 0

- [ ] **Step 3: Run graph-traverse.sh**
  Run: `bash .opencode/skills/meta-builder/scripts/graph-traverse.sh status`
  Expected: Reports facts, exits 0

- [ ] **Step 4: Run state-persist.sh**
  Run: `bash .opencode/skills/meta-builder/scripts/state-persist.sh status`
  Expected: Reports facts, exits 0

- [ ] **Step 5: Verify no exit 1 calls remain in any script**
  Run: `grep -rn 'exit 1' .opencode/skills/meta-builder/scripts/`
  Expected: No output

- [ ] **Step 6: Verify no hardcoded $HOME paths remain**
  Run: `grep -rn '\$HOME' .opencode/skills/meta-builder/scripts/`
  Expected: No output

- [ ] **Step 7: Verify no write operations remain in scripts**
  Run: `grep -rn 'mkdir\|echo.*>\|cat.*>' .opencode/skills/meta-builder/scripts/`
  Expected: No output (or only in comments)

- [ ] **Step 8: Verify SKILL.md size**
  Run: `wc -l .opencode/skills/meta-builder/SKILL.md`
  Expected: <200 lines

- [ ] **Step 9: Verify no ghost files remain**
  Run: `ls .opencode/skills/meta-builder/references/`
  Expected: Only 5 files (01-05)

- [ ] **Step 10: Final commit**
  Run: `git add -A && git commit -m "meta-builder: validation complete — all scripts exit 0, no hardcoded paths, SKILL.md <200 lines"`

---

## Summary

| Phase | Tasks | LOC Change | Key Outcome |
|-------|-------|-----------|-------------|
| 1: Deletions | 3 | -1,581 LOC | Ghost files, duplicate schema, governance scripts removed |
| 2: Script Rewrites | 5 | -1,000 → ~200 LOC | All scripts read-only, exit 0, no hardcoded paths |
| 3: SKILL.md Compression | 1 | 304 → ~120 LOC | Clean routing skill, no governance, no jargon |
| 4: Eval Fixes | 2 | +new tests | TC-005/007/008 fixed, negative triggers added |
| 5: Validation | 1 | 0 | All scripts validated, no violations remain |

**Net result:** From 2,132 lines of bloated governance framework to ~400 lines of lean routing skill with compliant helpers.
