---
phase: 15
phase_name: "Security & Quality Remediation"
project: "opencode-harness"
generated: "2026-04-22"
counts:
  decisions: 9
  lessons: 7
  patterns: 7
  surprises: 5
missing_artifacts: [UAT files not created (YAML/markdown config phase — no runnable entry points)]
---

# Phase 15 Learnings: Security & Quality Remediation

Extracted from all plan, summary, verification, context, and discussion artifacts.

---

## Decisions

### D-15.1: Replace profanity with professional urgency markers
- **What was decided:** Replaced `MUST_FUCKING_READ_AND_OBEY` with `MANDATORY_COMPLIANCE_REQUIRED` in build.md rather than softer alternatives or keeping as-is.
- **Rationale:** Preserves enforcement urgency while removing reputational risk in shared contexts. User selected recommended option over "keep as dev culture" or "keep in tags only."
- **Source:** `15-DISCUSSION-LOG.md` (Profanity Handling table), `15-01-SUMMARY.md` (Decisions Made), `15-CONTEXT.md` (D-01, D-02)

### D-15.2: Single primary orchestrator + named specialists hierarchy
- **What was decided:** coordinator.md is THE sole primary orchestrator; conductor → delegation routing specialist, orchestrator → phase-gated workflow specialist, hivefiver → meta-concept workflow specialist.
- **Rationale:** Eliminates role overlap confusion where multiple agents claimed "primary orchestrator" role, causing ambiguous dispatch. Each specialist gets a non-overlapping scope with hierarchy comments.
- **Source:** `15-DISCUSSION-LOG.md` (Orchestrator Hierarchy table), `15-CONTEXT.md` (D-03, D-04, D-05), `15-01-SUMMARY.md` (key-decisions)

### D-15.3: Deny-by-default permissions for all agents
- **What was decided:** All agent permission blocks start with `"*": deny` for each tool category, then explicitly allow only what's needed.
- **Rationale:** Prevents privilege escalation from wildcard or blanket `allow` permissions. conductor.md went from `skill: allow` to deny-all with only 3 scoped skills.
- **Source:** `15-01-SUMMARY.md` (patterns-established), `15-01-PLAN.md` (Task 2), `15-VERIFICATION.md` (truth #3)

### D-15.4: Replace wildcard skill permissions with explicit allowlists
- **What was decided:** Removed `skill: "*": allow` from build.md and replaced with 6 explicit skill patterns (hm-*, gsd-*, coordinating-loop, planning-with-files, use-authoring-skills, harness-audit).
- **Rationale:** Wildcard permissions created privilege escalation risk — any skill could be loaded without review. Explicit allowlist ensures only vetted skills are accessible.
- **Source:** `15-01-SUMMARY.md` (key-decisions), `15-CONTEXT.md` (D-10), `15-VERIFICATION.md` (truth #2)

### D-15.5: Project-relative paths instead of $HOME or absolute paths
- **What was decided:** Replace all `$HOME/.claude/get-shit-done/` and `/Users/apple/...` paths with `.opencode/get-shit-done/` and other project-relative equivalents.
- **Rationale:** Hardcoded user-specific paths break portability across machines and environments. Project-relative paths work on any clone of the repo.
- **Source:** `15-DISCUSSION-LOG.md` (Path Portability table), `15-CONTEXT.md` (D-08, D-09), `15-01-SUMMARY.md` (key-decisions)

### D-15.6: Reference global skills instead of creating local stubs
- **What was decided:** skill-judge and skill-creator references in agent files point to global skills at `~/.agents/skills/` rather than creating local stubs in `.opencode/skills/`.
- **Rationale:** Global skills already exist and are installed. Creating local stubs would duplicate functionality and create maintenance burden.
- **Source:** `15-DISCUSSION-LOG.md` (Missing Skills Strategy table), `15-CONTEXT.md` (D-06, D-07), `15-02-SUMMARY.md` (key-decisions)

### D-15.7: files_to_read blocks must reference actually-existing files
- **What was decided:** Plan-suggested GSD reference files (wave-execution.md, audit-protocol.md, etc.) were replaced with real files from each skill's own `references/` and `scripts/` directories.
- **Rationale:** The plan listed nonexistent files; using `ls` to verify real files prevents broken file references at skill load time.
- **Source:** `15-02-SUMMARY.md` (key-decisions, Deviation #1), `15-02-PLAN.md` (Task 2 IMPORTANT note)

### D-15.8: Multi-word trigger phrases to prevent false-positive skill loading
- **What was decided:** Replaced single-word triggers like "research" and "explore" with multi-word patterns like "deep research on" and "comprehensive analysis of".
- **Rationale:** Single common words would false-positive match many conversations, causing unnecessary skill loads and context pollution.
- **Source:** `15-03-SUMMARY.md` (key-decisions), `15-03-PLAN.md` (Task 1), `15-VERIFICATION.md` (truths #12, #13)

### D-15.9: W-7 and W-8 deferred as src/ technical debt
- **What was decided:** AGENT_TOOLS documentation gap (W-7) and DelegateTaskInputSchema missing fields (W-8) were documented but not fixed because they require src/ code changes, which were out of scope.
- **Rationale:** Phase 15 explicitly scoped to .opencode/ soft meta-concepts only. src/ changes require a separate phase with different testing/validation constraints.
- **Source:** `15-03-SUMMARY.md` (key-decisions), `15-03-PLAN.md` (Task 2E/F), `15-VERIFICATION.md` (requirements W-7, W-8)

---

## Lessons

### L-15.1: Plan-suggested file paths may not exist — always verify on disk
- **What was learned:** The plan for Task 2 (files_to_read blocks) suggested paths like `.opencode/get-shit-done/references/wave-execution.md` and `audit-protocol.md` that don't exist on disk. The executor had to list actual directory contents to find real files.
- **Context:** When adding files_to_read blocks to 5 skills, the plan assumed GSD reference file names that don't match reality. Each skill's references/ and scripts/ directories had different actual file names.
- **Source:** `15-02-SUMMARY.md` (Deviation #1), `15-02-PLAN.md` (Task 2 IMPORTANT note)

### L-15.2: Git tracks files under different paths than .opencode/ due to symlinks
- **What was learned:** Git add fails on `.opencode/agents/` due to symlinks. The actual git-tracked paths are under `.hivefiver-meta-builder/agents-lab/active/refactoring/`. Files must be staged from the git-tracked path, not the symlink path.
- **Context:** During Task commits, `git add .opencode/agents/build.md` failed. Had to use the real path under `.hivefiver-meta-builder/`.
- **Source:** `15-01-SUMMARY.md` (Issues Encountered), `15-02-SUMMARY.md` (Issues Encountered)

### L-15.3: Cross-phase risk verification often discovers out-of-scope issues that block closure
- **What was learned:** XPR-3 verification (`grep -r '/Users/apple/' .opencode/commands/`) found 3 command files still containing hardcoded absolute paths that were "out of scope" for Plan 02 but blocked XPR-3 closure. The executor had to fix them to close the risk.
- **Context:** Plan 02 noted 3 command files (hf-create, hf-stack, hf-audit) as out of scope, but Plan 03's cross-phase verification sweep showed they prevented XPR-3 from passing.
- **Source:** `15-03-SUMMARY.md` (Deviation #1), `15-03-PLAN.md` (Task 2C)

### L-15.4: Grep patterns for verification need careful regex construction
- **What was learned:** `grep '"*": allow'` falsely matched `"hm-*": allow` because the `*` is treated as a glob, not a literal character. Verification checks need anchored or escaped patterns.
- **Context:** C-2 verification initially appeared to fail because the grep pattern was too broad. Required separate verification with an anchored pattern to confirm the fix was correct.
- **Source:** `15-01-SUMMARY.md` (Issues Encountered), `15-03-SUMMARY.md` (Issues Encountered)

### L-15.5: Scoping phases to specific file types (.opencode/ only) creates deliberate technical debt
- **What was learned:** Constraining Phase 15 to .opencode/ only (no src/ changes) meant 2 findings (W-7, W-8) could only be documented as debt, not resolved. This is a valid tradeoff — the phase delivers complete closure within its scope boundary.
- **Context:** AGENT_TOOLS is referenced in AGENTS.md but not implemented in src/plugin.ts. DelegateTaskInputSchema is missing fields. Both require src/ changes that are fundamentally different from YAML/markdown edits.
- **Source:** `15-03-SUMMARY.md` (Complete Audit Finding Accounting), `15-VERIFICATION.md` (Gaps Summary)

### L-15.6: Reference file paths (gsd-execution-patterns.md) may contain additional instances of the same bug
- **What was learned:** Plan 01 only mentioned fixing SKILL.md line 45 for the hardcoded path issue, but gsd-execution-patterns.md in the references/ directory had 6 additional `$HOME/.claude/` paths.
- **Context:** When fixing paths in harness-delegation-inspection, the executor discovered the reference documentation file had even more instances than the main SKILL.md.
- **Source:** `15-01-SUMMARY.md` (Deviation #1)

### L-15.7: coordinating-loop had files_to_read in one location but not in the git-tracked copy
- **What was learned:** .opencode/ and .hivefiver-meta-builder/ (git-tracked) copies of coordinating-loop/SKILL.md were out of sync — .opencode/ had files_to_read but git didn't track it.
- **Context:** When committing the files_to_read addition for coordinating-loop, the git-tracked version didn't have the change. Both copies needed to be synced.
- **Source:** `15-02-SUMMARY.md` (Deviation #2, key-decisions)

---

## Patterns

### P-15.1: Deny-by-default permissions with scoped overrides
- **Pattern:** Agent permission blocks start with deny-all (`"*": deny`) for each tool category, then explicitly list only the specific resources/actions that agent needs.
- **When to use:** Any new agent definition file. Also applicable to any system where least-privilege access control is needed.
- **Source:** `15-01-SUMMARY.md` (patterns-established), `15-01-PLAN.md` (Task 2A conductor.md replacement)

### P-15.2: Hierarchy comments in agent definitions
- **Pattern:** Every non-primary agent .md file includes an HTML comment after frontmatter declaring its role relative to the primary orchestrator: `<!-- Hierarchy: This agent is a [ROLE] SPECIALIST under coordinator.md -->`.
- **When to use:** When multiple agents have similar names or overlapping responsibilities. Prevents dispatch confusion.
- **Source:** `15-01-SUMMARY.md` (patterns-established), `15-VERIFICATION.md` (truth #4)

### P-15.3: Project-relative paths for portability
- **Pattern:** All file paths in skills, commands, and agent configs use project-root-relative paths (`.opencode/...`) instead of `$HOME/...` or absolute `/Users/...` paths.
- **When to use:** Any configuration file that references project resources. Ensures portability across machines and users.
- **Source:** `15-01-SUMMARY.md` (patterns-established), `15-03-SUMMARY.md` (patterns-established)

### P-15.4: files_to_read blocks for skill dependency declaration
- **Pattern:** Skills declare their file dependencies in a `<files_to_read>` XML block, listing all referenced scripts, reference docs, and configuration files.
- **When to use:** Any skill that references external files, scripts, or documentation during execution. Ensures the agent has the necessary context loaded before running.
- **Source:** `15-02-SUMMARY.md` (patterns-established), `15-VERIFICATION.md` (truth #9)

### P-15.5: Multi-word trigger phrases for skill discovery
- **Pattern:** Skill trigger descriptions use multi-word phrases ("deep research on", "comprehensive analysis of") instead of single common words ("research", "analyze") to reduce false-positive skill loading.
- **When to use:** Writing or updating skill description fields. Requires at least 2 words or a specific pattern.
- **Source:** `15-03-SUMMARY.md` (patterns-established), `15-03-PLAN.md` (Task 1)

### P-15.6: Cross-phase risk verification sweep
- **Pattern:** After multi-plan execution, run a comprehensive grep sweep that verifies ALL cross-phase risks are closed, not just the individual findings. Cross-phase risks are compound conditions where two separate findings combine to create a higher-severity issue.
- **When to use:** Multi-plan phases where findings in different plans interact. The verification sweep checks that compound risks are closed by the combination of fixes.
- **Source:** `15-03-PLAN.md` (Task 2), `15-VERIFICATION.md` (Cross-phase risks section)

### P-15.7: Explicit skill allowlists instead of wildcards
- **Pattern:** Agent skill permissions use explicit skill name patterns (`"hm-*": allow`, `"gsd-*": allow`, `"coordinating-loop": allow`) instead of wildcard `"*": allow`.
- **When to use:** All agent definitions. Wildcard skill permissions are a security anti-pattern that allows unrestricted skill loading.
- **Source:** `15-01-PLAN.md` (Task 1), `15-01-SUMMARY.md` (Accomplishments)

---

## Surprises

### S-15.1: Reference documentation file had 6× more hardcoded paths than the main file
- **What was surprising:** Plan 01 identified the hardcoded path issue in SKILL.md line 45 (1 occurrence), but the reference documentation file `gsd-execution-patterns.md` in the same skill directory had 6 additional `$HOME/.claude/` paths.
- **Impact:** Without the auto-fix deviation, the skill would still have 6 broken paths in its reference docs. The portability fix was much more extensive than initially scoped.
- **Source:** `15-01-SUMMARY.md` (Deviation #1)

### S-15.2: Plan-suggested file paths were entirely fabricated
- **What was surprising:** The plan for Task 2 listed specific GSD reference file paths (`.opencode/get-shit-done/references/wave-execution.md`, `audit-protocol.md`, `skill-patterns.md`, etc.) that simply don't exist on disk.
- **Impact:** Would have resulted in broken files_to_read blocks pointing to nonexistent files. The executor had to enumerate actual directory contents to find real files.
- **Source:** `15-02-SUMMARY.md` (Deviation #1)

### S-15.3: Git-tracked and working-copy paths are different due to symlink structure
- **What was surprising:** Files edited in `.opencode/` are actually tracked by git under `.hivefiver-meta-builder/` paths. Commits must stage from the git-tracked path, and the two copies can drift out of sync.
- **Impact:** Changes appear to be committed but may not be tracked by git if staged from the symlink path. Requires awareness of the dual-path structure.
- **Source:** `15-01-SUMMARY.md` (Issues Encountered), `15-02-SUMMARY.md` (Deviation #2, Issues Encountered)

### S-15.4: Out-of-scope items blocked cross-phase risk closure
- **What was surprising:** Three command files (hf-create, hf-stack, hf-audit) were explicitly marked "out of scope" in Plan 02, but their remaining absolute paths prevented XPR-3 (portability gap) from closing in Plan 03's verification sweep.
- **Impact:** Had to fix the out-of-scope items anyway to achieve full audit closure. Scope boundaries need to account for compound verification dependencies.
- **Source:** `15-03-SUMMARY.md` (Deviation #1), `15-02-SUMMARY.md` (Next Phase Readiness note)

### S-15.5: Verification grep patterns produced false failures
- **What was surprising:** `grep '"*": allow'` matched `"hm-*": allow` lines, making it look like the wildcard fix hadn't worked. The `*` character was treated as a glob, not a literal.
- **Impact:** Required re-verification with proper anchored patterns. Verification commands must use literal matching, not glob patterns.
- **Source:** `15-01-SUMMARY.md` (Issues Encountered), `15-03-SUMMARY.md` (Issues Encountered)

---

*Phase 15 Learnings extracted from 9 artifacts: 3 PLAN files, 3 SUMMARY files, 1 VERIFICATION file, 1 CONTEXT file, 1 DISCUSSION-LOG file.*
*Total findings addressed: 26 (18 fixed, 2 documented as src/ debt, 1 intentional, 5 info/acceptable)*
*Phase verification: PASSED (15/15 must-haves)*
