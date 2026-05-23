# Debts & Gaps Register

**Maintained by:** Orchestrator agent (front-facing)
**Updated:** 2026-05-23
**Next review:** TBD

This file tracks **gaps, debts, conflicts, and hallucinations** found across hm-*/hf-* agents, commands, skills, and workflows. Each entry has a jump link to the exact defect location. When delegated tasks touch these areas, update this file with new findings.

---

## CRITICAL

### C-1: `delegate-task` vs `task` Proxy War

**Severity:** CRITICAL | **Type:** CONFLICT
**Files:**
- `file:///Users/apple/hivemind-plugin-private/.opencode/agents/hm-l0-orchestrator.md:598` — says "Never use `delegate-task` (custom tool, not production-ready)"
- `file:///Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-conductor.md:121` — says "NEVER use the built-in `task` tool for delegation. Use `delegate-task` every time."
- `file:///Users/apple/hivemind-plugin-private/.opencode/commands/start-work.md:14` — routes to conductor → follows conductor protocol
- `file:///Users/apple/hivemind-plugin-private/.opencode/agents/hm-l1-coordinator.md:21-23` — has `delegate-task: allow`

**Impact:** L0 says "deprecated", Conductor says "NEVER use task". Incompatible directives. Agent dispatched L0→L1→L2 gets contradictions. `start-work.md` → conductor → `delegate-task` which L0 says is broken.

**Fix:** Standardize on `task` tool as PREFERRED. Fix L0 to say "task preferred, delegate-task async only". Fix Conductor to match. Fix start-work.md to use task tool.

---

### C-2: Broken Agent Name Cross-References in hf-l1-coordinator

**Severity:** CRITICAL | **Type:** GAP
**Files:**
- `file:///Users/apple/hivemind-plugin-private/.opencode/agents/hf-l1-coordinator.md:99-103` — references `hf-agent-builder` (should be `hf-l2-agent-builder`)
- `file:///Users/apple/hivemind-plugin-private/.opencode/agents/hf-l1-coordinator.md:102` — references `hf-skill-author` (should be `hf-l2-skill-builder`)
- `file:///Users/apple/hivemind-plugin-private/.opencode/agents/hf-l1-coordinator.md:276-279` — references `hf-agent-builder`, `hf-skill-author`, `hf-command-builder`, `hf-tool-builder` (should be `hf-l2-*`)
- `file:///Users/apple/hivemind-plugin-private/.opencode/agents/hf-l1-coordinator.md:233` — references `hm-research-detective` (doesn't exist)

**Impact:** Agent dispatch will fail silently (agent not found) when hf-coordinator tries to delegate to non-existent agents.

**Fix:** Replace all bare names with correct `hf-l2-*` names.

---

### C-3: Hallucinated `websearch` Tool in Permissions

**Severity:** CRITICAL | **Type:** HALLUCINATION
**Files:**
- `file:///Users/apple/hivemind-plugin-private/.opencode/agents/hm-l0-orchestrator.md:39` — `websearch: allow`
- `file:///Users/apple/hivemind-plugin-private/.opencode/agents/hf-l0-orchestrator.md:44` — `websearch: allow`
- `file:///Users/apple/hivemind-plugin-private/.opencode/agents/hm-l1-coordinator.md:31` — `websearch: allow`

**Impact:** `websearch` is not an OpenCode tool. Will cause permission resolution errors at runtime. Should be `webfetch` if web access is needed.

**Fix:** Remove `websearch: allow` from all agents. Replace with `webfetch: allow` if needed.

---

### C-4: Q6 State Path Violation — Skills Write to `.opencode/state/`

**Severity:** CRITICAL | **Type:** DEBT
**Files:**
- `file:///Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-phase-execution/SKILL.md:50-53` — writes to `.opencode/state/opencode-harness/phase-execution/`
- `file:///Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-phase-loop/SKILL.md:65` — references `.opencode/state/` and `.planning/phases/.../STATE.md`
- `file:///Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-user-intent-interactive-loop/SKILL.md:140-145` — writes to `.opencode/state/intent.json` and `.opencode/state/question-count.json`
- `file:///Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-subagent-delegation-patterns/SKILL.md:235-238` — references `.planning/` for state

**Impact:** Q6 (locked 2026-04-25) mandates `.hivemind/` as canonical state root. `.opencode/state/` is legacy. State written to `.opencode/` violates Soft Meta-Concepts sector boundaries. These paths may not persist across plugin updates.

**Fix:** Migrate all state writes to `.hivemind/state/`. Update skill references.

---

### C-5: Document/Artifact Naming & Pathing Governance Collapse

**Severity:** CRITICAL | **Type:** SYSTEMIC DEBT
**Files:** Toàn bộ `.planning/phases/`, `.hivemind/research/`, `.hivemind/tracking/`, `.hivemind/planning/`

**Vấn đề:** Hivemind không có hệ thống naming convention, pathing, format, gatekeeping, và dependency validation cho documents và artifacts. Hậu quả:
- Documents tạo ra vô tội vại, không phân loại theo mục/sub
- Không có gatekeeping loops kiểm tra chất lượng document
- Không có integration/dependencies validation giữa các documents
- Regressions xảy ra vì không ai kiểm soát cross-session
- Multiple sessions tạo documents overlapping/conflicting
- Không có standardized artifact structure cho phases
- Ảnh hưởng tới: commands (reference sai path), workflows (đọc sai artifact), references (dead links), agent routing (load nhầm skill), skills (content overlap)

**Biểu hiện cụ thể:**
- `.hivemind/research/` có documents từ nhiều sessions khác nhau, không có phase mapping
- Phase artifacts format không đồng nhất: có chỗ dùng `23-SPEC.md`, có chỗ dùng `23-01-PLAN.md` với số thứ tự
- Naming convention không được enforce: lowercase vs uppercase lẫn lộn
- Gatekeeping: không có workflow nào verify rằng documents được tạo đúng format, đúng location, đúng naming
- Cross-session: Session A tạo research → Session B tạo research khác → không ai kiểm tra overlap/dependency
- debt tracking file mới tạo — chưa có process nào đảm bảo nó được update

**Fix:** 
1. Standardize naming convention: `{PHASE}-{TYPE}[-{SUBTYPE}][-{DATE}].md` với TYPE = uppercase
2. Standardize artifact structure per phase: SPEC.md, RESEARCH.md, PLAN.md, SUMMARY.md, VERIFICATION.md, SYNTHESIS.md
3. Phân loại documents theo mục: research/, specs/, plans/, syntheses/, audits/
4. Thêm gatekeeping: mỗi khi create document → validate naming, location, format
5. Thêm cross-session validation: trước khi tạo document mới → check existing documents cùng loại
6. Đưa `debt-register` vào workflow command mặc định

**Affects:**
- `file:///Users/apple/hivemind-plugin-private/.opencode/commands/` — commands reference sai paths
- `file:///Users/apple/hivemind-plugin-private/.opencode/agents/` — agents load sai skills do path errors
- `file:///Users/apple/hivemind-plugin-private/.opencode/skills/` — skills overlap do không có boundary validation
- `.planning/phases/*/` — artifact formats không đồng nhất
- `.hivemind/research/` — documents không có phase mapping
- `.hivemind/tracking/` — tracking file mới, chưa có enforcement

### H-1: Bash Permission Trailing Space in L0 Orchestrators

**Severity:** HIGH | **Type:** GAP
**Files:**
- `file:///Users/apple/hivemind-plugin-private/.opencode/agents/hm-l0-orchestrator.md:16` — `"node * ": allow` (trailing space)
- `file:///Users/apple/hivemind-plugin-private/.opencode/agents/hf-l0-orchestrator.md:19` — same trailing space

**Impact:** Bash commands like `node index.js` won't match `"node * "` due to trailing space. Will deny legitimate Node.js execution.

**Fix:** Remove trailing space: `"node *": allow`

---

### H-2: hm-l2-build Severely Underspecified

**Severity:** HIGH | **Type:** GAP
**File:** `file:///Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-build.md`

**Impact:** Only 86 lines. Default primary agent with "all tools enabled" but no execution flow, behavioral contract, anti-patterns, or verification guidance. Will produce unpredictable results.

**Fix:** Add task description, scope, context, behavioral contract, anti-patterns, verification protocol. Target ~300+ lines.

---

### H-3: hm-l2-phase-guardian Temperature Too High

**Severity:** HIGH | **Type:** DEBT
**File:** `file:///Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-phase-guardian.md:5` — `temperature: 0.25`

**Impact:** Guardrail enforcement and phase exit decisions should be deterministic (≤0.15). 0.25 allows too much creativity for a gatekeeping role.

**Fix:** Lower to 0.1.

---

### H-4: hf-create Command Broken Path Reference

**Severity:** HIGH | **Type:** GAP
**File:** `file:///Users/apple/hivemind-plugin-private/.opencode/commands/hf-create.md:14`

**Impact:** References `@.hivefiver-hm-meta-builder/workflows-lab/active/refactoring/create.md` but actual directory is `.hivefiver-meta-builder` (no `-hm-` infix). Path will fail.

**Fix:** Correct path to `.hivefiver-meta-builder/workflows-lab/active/refactoring/create.md`

---

### H-5: Skills Reference External Scripts — Not Verified

**Severity:** HIGH | **Type:** DEBT
**Files:**
- `file:///Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-coordinating-loop/SKILL.md` — references `scripts/register-skill.sh`, `scripts/check-gate.sh`, `scripts/validate-envelope.sh`, `scripts/run-ralph-loop.sh`, `scripts/coordination-check.sh`, `scripts/init-session.sh`
- `file:///Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-user-intent-interactive-loop/SKILL.md` — references `scripts/intent-verify.sh`, `scripts/verify-hierarchy.sh`, `scripts/register-skill.sh`

**Impact:** ~10 script references across 2 skills. These scripts must exist at `scripts/` or within skill directories. Not verified. If missing, gate enforcement fails silently.

**Fix:** Verify all scripts exist, or remove references. Use inline logic instead of script calls.

---

## MEDIUM

### M-1: hm-l0-orchestrator Exceeds Max Skills

**Severity:** MEDIUM | **Type:** CONFLICT
**File:** `file:///Users/apple/hivemind-plugin-private/.opencode/agents/hm-l0-orchestrator.md:108-117` vs `:684`

**Impact:** YAML declares 8 skills. Iron Law #10 says max 3. Internal contradiction.

**Fix:** Either reduce declared skills to 3, or remove "max 3" constraint.

---

### M-2: hf-l0-orchestrator Lists Default hm-* Skills

**Severity:** MEDIUM | **Type:** DEBT
**File:** `file:///Users/apple/hivemind-plugin-private/.opencode/agents/hf-l0-orchestrator.md:123-130`

**Impact:** Loads hm-* skills as default (not on-demand). Blurs lineage boundaries. Requires "justified" cross-lineage access per architecture.

**Fix:** Load hm-* skills on demand only, not as defaults.

---

### M-3: hm-l2-conductor Domain Mismatch

**Severity:** MEDIUM | **Type:** DEBT
**File:** `file:///Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-conductor.md:48` — `domain: Phase Lifecycle`

**Impact:** Domain "Phase Lifecycle" doesn't match role "Delegation routing specialist".

**Fix:** Change to `domain: Routing` or `domain: Coordination`.

---

### M-4: hm-l2-conductor References Legacy `.harness/` Path

**Severity:** MEDIUM | **Type:** DEBT
**File:** `file:///Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-conductor.md:99-105` — references `.harness/wisdom/`

**Impact:** Dead path. Wisdom system won't work as described. Legacy from old architecture.

**Fix:** Remove or replace with `.hivemind/` equivalent.

---

### M-5: hm-l2-build GSD Agent List Not Validated

**Severity:** MEDIUM | **Type:** DEBT
**File:** `file:///Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-build.md:39-75`

**Impact:** Lists 33 GSD agents from `.hivefiver-meta-builder/agents-lab/active/refactoring/`. Depends on meta-builder directory existing. References may be dead.

**Fix:** Verify directory exists. Validate file names match.

---

### M-6: `.coordination/` Unregistered State Directory

**Severity:** MEDIUM | **Type:** DEBT
**File:** `file:///Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-coordinating-loop/SKILL.md:21,52,55`

**Impact:** References `.coordination/` directory — not defined in `.hivemind/` state structure. New untracked persistence location.

**Fix:** Register under `.hivemind/` or remove. Must comply with Q6.

---

### M-7: hm-l2-context-mapper Underspecified

**Severity:** MEDIUM | **Type:** GAP
**File:** `file:///Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-context-mapper.md`

**Impact:** ~112 lines. Purpose stated but no execution flow or protocol.

**Fix:** Add execution flow, input/output contract, anti-patterns.

---

### M-8: start-work Routes to Conductor Despite L0 Contradiction

**Severity:** MEDIUM | **Type:** CONFLICT
**File:** `file:///Users/apple/hivemind-plugin-private/.opencode/commands/start-work.md:2-4`

**Impact:** Routes to conductor. Conductor says use delegate-task. L0 says delegate-task deprecated. Inconsistent behavior.

**Fix:** Align with resolution of C-1.

---

### M-9: harness-audit Cross-Lineage Routing

**Severity:** MEDIUM | **Type:** GAP
**File:** `file:///Users/apple/hivemind-plugin-private/.opencode/commands/harness-audit.md:3` — `agent: hf-l0-orchestrator`

**Impact:** Harness audit is product-dev task, not meta-concept. Should go to hm-l0-orchestrator. hf will just forward back.

**Fix:** Change to `agent: hm-l0-orchestrator`.

---

### M-10: hf- Commands Have Dead References

**Severity:** MEDIUM | **Type:** GAP
**Files:**
- `file:///Users/apple/hivemind-plugin-private/.opencode/commands/hf-create.md:14` — wrong path infix
- `file:///Users/apple/hivemind-plugin-private/.opencode/commands/harness-audit.md:40` — `hm-opencode-project-audit` should be `hm-l3-opencode-project-audit`

**Impact:** Dead references cause silent failures.

**Fix:** Correct all broken references.

---

### M-11: user-intent Skill Heavy Gate Dependencies

**Severity:** MEDIUM | **Type:** DEBT
**File:** `file:///Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-user-intent-interactive-loop/SKILL.md:27-96`

**Impact:** Defines 5 HARD GATES depending on external scripts + platform skills. In minimal OpenCode install, gates unenforceable.

**Fix:** Provide fallback mechanisms or reduce external dependencies.

---

### M-12: Skill Cross-References Missing Depth Suffix

**Severity:** MEDIUM | **Type:** DEBT
**File:** `file:///Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-coordinating-loop/SKILL.md:35`

**Impact:** References `hm-coordinating-loop` (missing `-l2-`). May cause broken links.

**Fix:** Use full prefix: `hm-l2-coordinating-loop`.

---

## LOW

### L-1: hm-l2-guardian / hm-l2-phase-guardian Possible Overlap

**Severity:** LOW | **Type:** DEBT
**Files:** `file:///Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-guardian.md`, `hm-l2-phase-guardian.md`

**Impact:** Both describe "phase loop" and "guardrail" responsibilities. Possible duplication.

**Fix:** Confirm scope boundary. Merge or differentiate.

---

### L-2: L2 Agents Exceed Temperature Range

**Severity:** LOW | **Type:** DEBT
**Files:**
- `hm-l2-general.md` — 0.2 (should be ≤0.15)
- `hm-l2-conductor.md` — 0.3 (should be ≤0.15)
- `hm-l2-phase-guardian.md` — 0.25 (should be ≤0.15)

**Impact:** Architecture mandates L2 temperature 0.0–0.15. These exceed spec.

**Fix:** Lower temps to ≤0.15.

---

### L-3: Agent Files Exceed 500-Line Limit

**Severity:** LOW | **Type:** DEBT
**Files:**
- `hm-l0-orchestrator.md` — 806 lines
- `hf-l0-orchestrator.md` — 659 lines
- `hm-l2-planner.md` — 526 lines

**Impact:** Max module size convention is 500 LOC. L0 orchestrators are inherently large.

**Fix:** Accept or refactor into multiple files.

---

## Tracking Update Protocol

When a delegated task touches any of the above files or areas:

1. Read this file first to understand existing debts
2. If new violations found: add new entries with jump links
3. If existing debts are fixed: mark as `FIXED` with commit hash
4. If debts were partially addressed: add note with `(PARTIAL)` tag

**Format for new entries:**

```
### ID: [Severity] Short Name

| Field | Value |
|-------|-------|
| Severity | CRITICAL/HIGH/MEDIUM/LOW |
| Type | CONFLICT/GAP/DEBT/HALLUCINATION/TBD |
| File | `file:///...` |
| Line | 123 |

**Description:** ...

**Fix:** ...
```
