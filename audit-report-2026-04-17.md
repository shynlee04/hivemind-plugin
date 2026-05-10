# HiveMind Harness Audit Report

**Date:** 2026-04-17
**Auditor:** harness-synthesis-auditor (Phase 7)
**Phase:** 7 (Synthesis)
**Phases Audited:** 1, 2, 3, 4, 5, 6

---

## Executive Summary

| Metric | Count |
|--------|-------|
| Total Issues | 26 |
| Critical Issues | 3 |
| Warnings | 12 |
| Phases Passed | 1/6 (Phase 3 only) |

### Overall Health Assessment

The HiveMind harness codebase has **significant security and structural issues** requiring immediate attention. Phase 3 (Tools) passed cleanly with all Zod schemas valid. However, Phase 5 (Agents) revealed **critical privilege escalation risks** in `build.md` (wildcard permissions) and `conductor.md` (excessive allowances). Phase 1 (Skills) found **hardcoded user paths** that break portability. Phase 2 (Commands) has **missing frontmatter** in 2 commands. The permission system (Phase 4) is well-structured with intentional security hardening. Tool restriction allowlists (Phase 6) are documented but **not implemented in code**.

---

## Critical Issues

> Issues requiring immediate remediation before proceeding.

| ID | Issue | Phase | Evidence | Impact |
|----|-------|-------|---------|--------|
| C-1 | **Hardcoded $HOME path** - `harness-delegation-inspection` uses `$HOME/.claude/get-shit-done/` which is user-specific and will break on any system besides the developer's | 1 | `harness-delegation-inspection/SKILL.md:45`, `references/gsd-execution-patterns.md:15,25,26,76,124,130` | Portability failure - skill completely broken on other systems |
| C-2 | **Wildcard skill permission + profanity** - `build.md` grants `skill: *: allow` (full admin) AND contains vulgar language violating professional standards | 5 | `build.md:1-11,13-16` | Privilege escalation + reputational risk |
| C-3 | **Excessive permissions without scoping** - `conductor.md` grants read/edit/write/bash/task/skill all as `allow` with no restrictions | 5 | `conductor.md` permission block | Violates least-privilege security principle |

---

## Warnings

> Issues with potential for negative impact if not addressed.

| ID | Issue | Phase | Evidence | Likelihood |
|----|-------|-------|---------|------------|
| W-1 | **Missing frontmatter** - `deep-init.md` and `deep-research-synthesis-repomix.md` missing required frontmatter delimiters | 2 | Both files start with content directly, no `---` | High - parsing will fail |
| W-2 | **Unquoted $ARGUMENTS** - 4 commands use bare `$ARGUMENTS` without quotes | 2 | `hf-absorb.md:9`, `hf-prompt-enhance.md:22`, `ultrawork.md:31`, `hf-prompt-enhance-to-plan.md:226` | Medium - special characters will break parsing |
| W-3 | **Missing files_to_read blocks** - 5 skills reference scripts but don't declare them in files_to_read | 1 | `coordinating-loop`, `user-intent-interactive-loop`, `use-authoring-skills`, `harness-audit`, `agent-authorization` | High - scripts may not load before execution |
| W-4 | **Dangling skill references** - `skill-creator` and `skill-judge` referenced by agents but don't exist in `.opencode/skills/` | 5 | `conductor.md`, `hivefiver-agent-builder.md` | High - agent will fail when triggering |
| W-5 | **Non-standard agent schema** - `orchestrator.md` uses `textVerbosity` and nested `skill` instead of standard `permission` record | 5 | `orchestrator.md:1-9` | Medium - automated auditing may misread |
| W-6 | **Role overlap** - `coordinator` and `conductor` both labeled "primary orchestrator" with near-identical descriptions | 5 | `coordinator.md`, `conductor.md` | Medium - unclear delegation routing |
| W-7 | **Tool allowlists not implemented** - `AGENT_TOOLS` constant referenced in docs but no corresponding code in `plugin.ts` | 6 | `src/lib/AGENTS.md:51` vs `plugin.ts` | High - governance stripped, no per-role restrictions |
| W-8 | **Task config schema gaps** - `DelegateTaskInputSchema` missing `priority`, `constraints`, `category` fields despite runtime support | 6 | `delegate-task.ts:8-14` | Medium - incomplete tool interface |
| W-9 | **Hardcoded absolute paths** - `hf-prompt-enhance-to-plan.md` uses `@/Users/apple/hivemind-plugin/...` absolute path | 2 | `hf-prompt-enhance-to-plan.md:226` | High - non-portable |
| W-10 | **Generic trigger phrases** - `hm-deep-research` and `hm-detective` use overly broad single-word triggers | 1 | `hm-deep-research:3`, `hm-detective:3` | Medium - false positive risk |
| W-11 | **Orchestrator hierarchy confusion** - 4 agents (`coordinator`, `conductor`, `hivefiver`, `orchestrator`) serve as primary orchestrator | 5 | Multiple agent files | High - unclear responsibility chain |
| W-12 | **Intentional trigger overlaps** - `meta-builder` routes to specialist skills creating dual-trigger risk | 1 | `meta-builder` vs `use-authoring-skills`, `command-dev`, etc. | Low - intentional routing pattern |

---

## Per-Phase Findings

### Phase 1: Skills Audit

**Status:** WARNING (8 issues, 1 critical)

**Findings:**
- 21 skills scanned in `.opencode/skills/` (symlinked from `.hivefiver-meta-builder/skills-lab/active/refactoring/`)
- 1 CRITICAL: Hardcoded `$HOME/.claude/get-shit-done/` path in `harness-delegation-inspection`
- 5 HIGH: Missing `<files_to_read>` blocks in `coordinating-loop`, `user-intent-interactive-loop`, `use-authoring-skills`, `harness-audit`, `agent-authorization`
- 2 MEDIUM: Generic trigger phrases in `hm-deep-research` and `hm-detective`
- 5 MEDIUM: Intentional trigger overlaps between router skills and specialists

**Evidence:**
```json
{
  "total_skills_scanned": 21,
  "findings_by_severity": {"critical": 1, "high": 5, "medium": 7, "low": 0},
  "skills_passed": 16,
  "skills_failed": 5
}
```

---

### Phase 2: Commands Audit

**Status:** WARNING (6 issues, 2 errors)

**Findings:**
- 14 commands audited in `.opencode/commands/`
- 2 ERROR: `deep-init.md` and `deep-research-synthesis-repomix.md` missing frontmatter
- 4 WARNING: Unquoted `$ARGUMENTS` in `hf-absorb.md`, `hf-prompt-enhance.md`, `ultrawork.md`, `hf-prompt-enhance-to-plan.md`
- 1 WARNING: Hardcoded absolute path in `hf-prompt-enhance-to-plan.md`

**Evidence:**
```json
{
  "total_commands": 14,
  "findings_by_severity": {"error": 2, "warning": 4, "info": 0}
}
```

---

### Phase 3: Tools Audit

**Status:** PASSED

**Findings:**
- 14 built-in OpenCode tools catalogued
- 4 custom tools with valid Zod schemas (delegate-task, prompt-skim, prompt-analyze, session-patch)
- Plugin lifecycle hooks properly registered
- No gaps between declarations and implementations
- All Zod schemas structurally valid

**Evidence:**
```json
{
  "builtin_tools": {"total": 14, "catalogued": "yes"},
  "custom_tools": {"total": 4, "schema_valid": "yes"},
  "tool_declaration_gaps": {"declared_but_not_implemented": [], "implemented_but_not_declared": []},
  "status": "pass"
}
```

---

### Phase 4: Permissions Audit

**Status:** PASSED (2 medium intentional overrides, 5 low/info items)

**Findings:**
- Permission structure well-formed in `opencode.json`
- Coordinator's read/edit restrictions are intentional security hardening (least privilege)
- Researcher and critic appropriately have `task: ask` (leaf nodes shouldn't delegate)
- Permission cascading correct, no conflicts detected
- 2 medium issues are intentional patterns, not bugs

**Evidence:**
```json
{
  "severity_counts": {"critical": 0, "high": 0, "medium": 2, "low": 5, "info": 4},
  "permission_chain_valid": true,
  "conflicts_found": false
}
```

---

### Phase 5: Agents Audit

**Status:** FAILED (6 issues including 2 critical)

**Findings:**
- 49 agent `.md` files audited
- 2 CRITICAL: `build.md` wildcard permissions + profanity, `conductor.md` excessive permissions
- 2 dangling skill references: `skill-creator`, `skill-judge` don't exist
- Role overlap between coordinator/conductor and hivefiver/hivefiver-orchestrator
- Non-standard schema in `orchestrator.md`
- 6 primary orchestrator agents for single workspace (excessive)

**Evidence:**
```json
{
  "total_checks": 5,
  "passed": 0,
  "warnings": 3,
  "failures": 2,
  "critical_issues": ["build.md wildcard permissions", "conductor.md excessive permissions"]
}
```

---

### Phase 6: Subagents Audit

**Status:** WARNING (2 warnings, 0 critical)

**Findings:**
- Spawn patterns correct (MAX_DELEGATION_DEPTH=1 prevents cycles)
- Session inheritance properly implemented with deep-clone-on-read
- Tool allowlists (AGENT_TOOLS) documented but **not implemented in code**
- Governance engine stripped in v14-01 - evaluation is no-op
- Task config schema incomplete (missing priority/constraints/category fields)

**Evidence:**
```json
{
  "spawn_patterns": {"status": "pass"},
  "session_inheritance": {"status": "pass"},
  "parent_child_cycles": {"status": "pass"},
  "task_config": {"status": "warning", "issues": ["missing priority field", "missing constraints field", "missing category field"]},
  "tool_restrictions": {"status": "warning", "issues": ["AGENT_TOOLS not implemented", "governance stripped"]}
}
```

---

## Cross-Phase Risks

> Risks that span multiple phases and may have compound effects.

| ID | Risk | Phases Affected | Propagation Path | Severity |
|----|------|----------------|-----------------|----------|
| XPR-1 | **Governance stripped** - Phase 6 confirms AGENT_TOOLS allowlists were removed in v14-01. Combined with Phase 5's `build.md` wildcard permissions, any agent loading build.md gains full skill access. | 5, 6 | `build.md` skill:`*:allow` → agent with build.md loaded → full system access | Critical |
| XPR-2 | **Dangling skill refs cascade** - Phase 5 found `skill-creator` and `skill-judge` don't exist. Phase 1 found `use-authoring-skills` has missing files_to_read. Combined: agents referencing these will fail | 1, 5 | Agent references dangling skill → agent load fails → orchestration breaks | High |
| XPR-3 | **Portability gap** - Phase 1 found `$HOME` hardcoded, Phase 2 found absolute `/Users/apple/`. Skills and commands fail on any system except developer's | 1, 2 | Hardcoded paths → skill/command execution fails → harness unusable elsewhere | High |
| XPR-4 | **Intentional overlaps create ambiguity** - Phase 1's meta-builder routing overlap is intentional, but Phase 5's role overlap is not. Meta-builder routes correctly; coordinator/conductor confusion creates delegation ambiguity | 1, 5 | meta-builder routes to use-authoring-skills → but coordinator vs conductor unclear → wrong agent spawned | Medium |

---

## Recommendations

### Immediate (Critical Path)

1. **Remove or rewrite `build.md`** — Delete this file entirely or strip the wildcard permission and vulgar language. Wildcard `skill: *` grants admin-equivalent access.
2. **Fix `conductor.md` permissions** — Apply same ask-by-default pattern as `coordinator.md`: `read: { '*': 'ask', '*.json': 'allow', '*.md': 'allow' }`
3. **Replace hardcoded `$HOME` path** — In `harness-delegation-inspection`, replace `$HOME/.claude/get-shit-done/` with environment variable `${OPENCODE_HARNESS_BIN_DIR}` or similar

### Short-Term (Within Sprint)

1. **Add frontmatter to commands** — `deep-init.md` and `deep-research-synthesis-repomix.md` need proper `---` frontmatter delimiters with description/agent/subtask fields
2. **Quote all `$ARGUMENTS`** — Wrap bare `$ARGUMENTS` in double quotes in all 4 affected commands
3. **Add files_to_read blocks** — For 5 skills referencing scripts without declaring them
4. **Resolve dangling skill refs** — Either create `skill-creator.md` and `skill-judge.md` or remove references from `conductor.md` and `hivefiver-agent-builder.md`
5. **Implement tool allowlists** — Either restore `AGENT_TOOLS` in `plugin.ts` or document that tool restrictions are not enforced

### Long-Term (Technical Debt)

1. **Consolidate orchestrator hierarchy** — Clarify roles of coordinator vs conductor vs hivefiver vs orchestrator; reduce from 4 to 1-2 primary orchestrators
2. **Fix orchestrator.md schema** — Convert `textVerbosity` + nested `skill` to standard `permission` record
3. **Complete task config schema** — Add `priority`, `constraints`, `category` fields to `DelegateTaskInputSchema` to match runtime support
4. **Specialize generic triggers** — Make `hm-deep-research` and `hm-detective` triggers more specific (e.g., "conduct deep research on" vs "research")

---

## Appendix: Finding Distribution

```
Phase 1  ████████████ 13 issues (1 critical, 5 high, 7 medium)
Phase 2  ██████░░░░░░ 6 issues (2 errors, 4 warnings)
Phase 3  ░░░░░░░░░░░░░ 0 issues (PASSED)
Phase 4  ████████░░░░ 7 issues (2 medium intentional, 5 low/info)
Phase 5  ████████████ 9 issues (2 critical, 3 warnings, 4 failures)
Phase 6  ████░░░░░░░░░ 4 issues (2 warnings, 0 critical)
```

---

## Summary by Severity

| Severity | Count | Status |
|----------|-------|--------|
| Critical | 3 | Must fix immediately |
| High | 8 | Should fix within sprint |
| Medium | 7 | Fix when convenient |
| Low/Info | 9 | Improvements only |

**Overall: 3 critical issues require immediate action before proceeding with development.**

---

*Report generated by harness-synthesis-auditor (Phase 7)*
*For internal use only — do not distribute without authorization*
