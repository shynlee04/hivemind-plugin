# Hivemind Configs Field Reference

**Living document** — mirrors schema, updated together. Production asset (git-versioned, no date-stamp).

---

## Quick Reference

| Group | Fields | Description |
|-------|--------|-------------|
| Root | 13 | Core settings: language, mode, expertise, delegation toggles, commits |
| Delegation Systems | 3 | Toggle native_task, delegate_task, background_delegation |
| Workflow | 16 | Feature gates: research, verifier, UI phases, intent lock, worktrees |
| Governance | 3 top-level | Rules engine, default action, write denylist, hardcoded gates |
| Governance Rules | 9 per rule | Tool-call governance: conditions, actions, escalation |
| Governance Naming Standards | 4 | Framework prefixes, classifications, format, title limits |
| Governance Agent Configs | 4 per agent | Per-agent descriptions, commands, tools, temperature |
| Governance Command Mappings | 3 per cmd | Command→agent routing, workflow, description |
| Governance Templates | 2 per tpl | Reusable prompt templates with interpolation |
| Governance Tool Registry | 3 per tool | Tool metadata and permission categories |
| Behavioral | 7 | Structured overrides: guardrails, delegation, communication, expertise |
| Language | 2 | Structured language overrides (conversation, documents) |
| Runtime | 3 | Fine-grained runtime style/speed/expertise overrides |

---

## 1. Root Fields

### 1.1 `$schema`

- **What it controls:** Path to the JSON Schema file for IDE autocompletion and validation.
- **Why it matters:** Enables your IDE to validate `configs.json` against the schema and provide autocompletion for all fields. Without it, you lose type safety and discoverability.
- **Allowed values:** String path (relative to `configs.json` location).
- **Default:** `./configs.schema.json`
- **When to change:** Never — auto-set by `hivemind init`.
- **Project profiles:** All.
- **Examples:**

```json
"$schema": "./configs.schema.json"
```

### 1.2 `conversation_language`

- **What it controls:** Language for agent conversations and responses.
- **Why it matters:** Affects all text output from the agent — prompts, responses, error messages, and interactive dialogue. This is the primary language setting.
- **Allowed values:** `en`, `vi`, `zh`, `fr`, `ja`, `ko`, `de`, `es`, `th`, `id`.
- **Default:** `en`
- **When to change:** When you prefer a different communication language. Set this once and the agent will respond in that language consistently.
- **Project profiles:** All, especially multilang teams.
- **Language notes:**
  - `en` — English. Default. Use for international teams.
  - `vi` — Vietnamese. Full support for Vietnamese agent interactions.
  - `zh` — Simplified Chinese (zh-CN). Use for Chinese-speaking teams.
  - `fr` — French. Supported for Francophone teams.
  - `ja` — Japanese. Supported for Japanese-speaking teams.
  - `ko` — Korean. Supported for Korean-speaking teams.
  - `de` — German. Supported for German-speaking teams.
  - `es` — Spanish. Supported for Spanish-speaking teams.
  - `th` — Thai. Supported for Thai-speaking teams.
  - `id` — Indonesian. Supported for Indonesian-speaking teams.
- **Examples:**

```json
"conversation_language": "vi"
```

### 1.3 `documents_and_artifacts_language`

- **What it controls:** Language for generated documents, summaries, and artifacts.
- **Why it matters:** Separate from conversation language so you can converse in one language while producing documentation in another. For example, conversation in Vietnamese, docs in English.
- **Allowed values:** `en`, `vi`, `zh`, `fr`, `ja`, `ko`, `de`, `es`, `th`, `id`.
- **Default:** `en`
- **When to change:** When you want documentation in a different language than conversation. Useful for multilingual teams where internal discussion is in one language but deliverables must be in another.
- **Project profiles:** All, especially multilang teams, team-mid.
- **Language notes:** Same 10 languages as `conversation_language`. See section 1.2 for full language list.
- **Examples:**

```json
"documents_and_artifacts_language": "en"
```

### 1.4 `document_paths`

- **What it controls:** Directory prefixes where planning artifacts live.
- **Why it matters:** The doc-intelligence engine uses these paths to determine which files to scan for language enforcement and governance. Files outside these paths are not scanned.
- **Allowed values:** Array of strings (directory paths).
- **Default:** `[".planning/"]`
- **When to change:** When you have planning artifacts in additional directories (e.g., `docs/`). Add paths here so governance scans them.
- **Project profiles:** Team-mid, enterprise-architect.
- **Examples:**

```json
"document_paths": [".planning/"]
```

```json
"document_paths": [".planning/", "docs/"]
```

### 1.5 `mode`

- **What it controls:** Operation mode controlling guardrail intensity and agent autonomy.
- **Why it matters:** Determines which workflow paths are active. `expert-advisor` uses TDD/spec-driven workflows, `hivemind-powered` adds hierarchical tracking, `free-style` disables most guardrails.
- **Allowed values:** `expert-advisor`, `hivemind-powered`, `free-style`.
- **Default:** `expert-advisor`
- **When to change:** Choose based on your governance needs. `expert-advisor` for most projects, `hivemind-powered` when you need session tracking, `free-style` for quick experiments.
- **Project profiles:** All.
- **Examples:**

```json
"mode": "hivemind-powered"
```

### 1.6 `user_expert_level`

- **What it controls:** User proficiency level affecting agent output style and elaboration depth.
- **Why it matters:** Higher levels produce more concise, jargon-rich responses. Lower levels include more explanation and context. The agent adapts its communication to match your expertise.
- **Allowed values:** `clumsy-vibecoder`, `beginner-friendly`, `intermediate-high-level`, `architecture-driven`, `absolute-expert`.
- **Default:** `intermediate-high-level`
- **When to change:** Adjust to match your team's experience level. Beginners benefit from `beginner-friendly`, experts from `absolute-expert`.
- **Project profiles:** All.
- **Examples:**

```json
"user_expert_level": "architecture-driven"
```

### 1.7 `parallelization`

- **What it controls:** Allow wave-based parallel task execution when multiple independent tasks exist.
- **Why it matters:** When enabled, the agent can dispatch independent tasks in parallel waves, significantly speeding up multi-task phases. Disable for sequential-only workflows or when debugging concurrency issues.
- **Allowed values:** `true`, `false`.
- **Default:** `true`
- **When to change:** Disable if you experience concurrency issues or need deterministic sequential execution. Keep enabled for most production workflows.
- **Project profiles:** Team-mid, enterprise-architect, fast-iteration.
- **Examples:**

```json
"parallelization": true
```

### 1.8 `atomic_commit`

- **What it controls:** Require atomic commits after each task completion during phase execution.
- **Why it matters:** Ensures each logical change is independently revertable. If a task introduces a bug, you can revert just that commit without affecting other changes.
- **Allowed values:** `true`, `false`.
- **Default:** `true`
- **When to change:** Disable for bulk operations where many small commits add noise. Keep enabled for production workflows with strict git hygiene.
- **Project profiles:** Team-mid, enterprise-architect.
- **Examples:**

```json
"atomic_commit": true
```

### 1.9 `commit_docs`

- **What it controls:** Include documentation and planning artifacts in phase execution commits.
- **Why it matters:** When true, code and docs are committed together, keeping them in sync. When false, only code changes are committed — docs are managed separately.
- **Allowed values:** `true`, `false`.
- **Default:** `true`
- **When to change:** Disable when docs are managed separately from code (e.g., docs published to a separate site). Keep enabled for most projects.
- **Project profiles:** Team-mid, enterprise-architect.
- **Examples:**

```json
"commit_docs": true
```

### 1.10 `guardrail_level` (legacy)

- **What it controls:** Root-level guardrail override (legacy). Controls how strictly the agent follows rules.
- **Why it matters:** `strict` blocks more actions, `permissive` allows more. Resolution order: `behavioral.guardrail_level` > this field > static profile default.
- **Allowed values:** `strict`, `moderate`, `permissive`.
- **Default:** *(none — falls back to static profile)*
- **When to change:** Prefer `behavioral.guardrail_level` instead. Use this only for quick overrides without restructuring the behavioral block.
- **Project profiles:** All.
- **Examples:**

```json
"guardrail_level": "moderate"
```

### 1.11 `delegation_mode` (legacy)

- **What it controls:** Root-level delegation override (legacy). Controls how subagents are dispatched.
- **Why it matters:** `waiter` blocks until subagent completes, `direct` is fire-and-forget, `autonomous` gives full self-direction. Resolution order: `behavioral.delegation_mode` > this field > static profile default.
- **Allowed values:** `waiter`, `direct`, `autonomous`.
- **Default:** *(none — falls back to static profile)*
- **When to change:** Prefer `behavioral.delegation_mode` instead. Use this only for quick overrides.
- **Project profiles:** All.
- **Examples:**

```json
"delegation_mode": "waiter"
```

### 1.12 `tool_access_pattern` (legacy)

- **What it controls:** Root-level tool access override (legacy). Controls which tools are surfaced to agents.
- **Why it matters:** `restricted` shows minimal tools, `standard` shows normal set, `full` shows everything. Resolution order: `behavioral.tool_access_pattern` > this field > static profile default.
- **Allowed values:** `restricted`, `standard`, `full`.
- **Default:** *(none — falls back to static profile)*
- **When to change:** Prefer `behavioral.tool_access_pattern` instead. Use this only for quick overrides.
- **Project profiles:** All.
- **Examples:**

```json
"tool_access_pattern": "standard"
```

### 1.13 `skill_filter` (legacy)

- **What it controls:** Root-level skill filter override (legacy). Controls which skills are loaded.
- **Why it matters:** `curated` loads essential skills only, `domain` loads project-relevant skills, `full` loads all available skills. Resolution order: `behavioral.skill_filter` > this field > static profile default.
- **Allowed values:** `curated`, `domain`, `full`.
- **Default:** *(none — falls back to static profile)*
- **When to change:** Prefer `behavioral.skill_filter` instead. Use this only for quick overrides.
- **Project profiles:** All.
- **Examples:**

```json
"skill_filter": "curated"
```

---

## 2. Delegation Systems

### 2.1 `delegation_systems`

- **What it controls:** Toggle which delegation mechanisms are available.
- **Why it matters:** Different delegation mechanisms have different capabilities. `native_task` is simple, `delegate_task` adds session stacking and trajectory tracking, `background_delegation` enables async execution.
- **Allowed values:** Object with boolean children.
- **Default:** `{ "native_task": true, "delegate_task": true, "background_delegation": true }`
- **When to change:** Adjust individual toggles based on your workflow needs. Most projects keep all three enabled.
- **Project profiles:** All.
- **Examples:**

```json
"delegation_systems": {
  "native_task": true,
  "delegate_task": true,
  "background_delegation": true
}
```

### 2.2 `delegation_systems.native_task`

- **What it controls:** Enable OpenCode's built-in task tool for simple subagent dispatch.
- **Why it matters:** Always available but limited to basic delegation. Disable only if you exclusively use `delegate_task` for harness-controlled delegation.
- **Allowed values:** `true`, `false`.
- **Default:** `true`
- **When to change:** Disable if you want to force all delegation through the harness-controlled path. Keep enabled for most workflows.
- **Project profiles:** Solo-vibecoder, team-mid.
- **Examples:**

```json
"native_task": true
```

### 2.3 `delegation_systems.delegate_task`

- **What it controls:** Enable harness-controlled delegation via the `delegate-task` tool.
- **Why it matters:** Provides session stacking, context preservation, and trajectory tracking. This is the recommended delegation mechanism for multi-agent workflows.
- **Allowed values:** `true`, `false`.
- **Default:** `true`
- **When to change:** Disable if you don't need session stacking or trajectory tracking. Enable for most production workflows.
- **Project profiles:** Team-mid, enterprise-architect.
- **Examples:**

```json
"delegate_task": true
```

### 2.4 `delegation_systems.background_delegation`

- **What it controls:** Enable background/async delegation for long-running tasks.
- **Why it matters:** Tasks execute without blocking the parent session. Useful for research, compilation, or other long-running operations.
- **Allowed values:** `true`, `false`.
- **Default:** `true`
- **When to change:** Disable if you need all work synchronous. Keep enabled for most production workflows.
- **Project profiles:** Enterprise-architect, research-heavy.
- **Examples:**

```json
"background_delegation": true
```

---

## 3. Workflow

### 3.1 `workflow`

- **What it controls:** Feature toggles controlling runtime behaviors — research, verification, UI phases, intent lock, and more.
- **Why it matters:** Each toggle maps to a specific OpenCode primitive or engine. Disabling unused features reduces overhead and simplifies the agent's decision space.
- **Allowed values:** Object with boolean children and nested objects.
- **Default:** See individual field defaults below.
- **When to change:** Adjust individual toggles based on your project needs. The defaults are safe for most projects.
- **Project profiles:** All.
- **Examples:**

```json
"workflow": {
  "research": true,
  "plan_check": true,
  "verifier": true,
  "discuss_mode": "sufficient-phase-discussion"
}
```

### 3.2 `workflow.research`

- **What it controls:** Enable the research-before-planning workflow.
- **Why it matters:** When enabled, the agent conducts domain and codebase research before creating phase plans. This produces better-informed plans but adds overhead.
- **Allowed values:** `true`, `false`.
- **Default:** `true`
- **When to change:** Disable for trivial tasks where research overhead isn't justified. Keep enabled for most production workflows.
- **Project profiles:** Research-heavy, team-mid, enterprise-architect.
- **Examples:**

```json
"research": true
```

### 3.3 `workflow.cross_session_tasks_dependencies_validation`

- **What it controls:** Validate task dependencies across session boundaries.
- **Why it matters:** Ensures tasks completed in prior sessions are verified before dependent tasks start. Adds reliability but increases overhead.
- **Allowed values:** `true`, `false`.
- **Default:** `false`
- **When to change:** Enable for high-reliability workflows where cross-session dependency correctness is critical.
- **Project profiles:** Enterprise-architect.
- **Examples:**

```json
"cross_session_tasks_dependencies_validation": false
```

### 3.4 `workflow.trajectory_control`

- **What it controls:** Enable trajectory ledger tracking for session execution.
- **Why it matters:** Records every phase transition and decision point for audit trails. Essential for compliance-heavy projects but adds overhead.
- **Allowed values:** `true`, `false`.
- **Default:** `false`
- **When to change:** Enable for compliance-heavy projects that need full audit trails. Disable for most development workflows.
- **Project profiles:** Enterprise-architect, research-heavy.
- **Examples:**

```json
"trajectory_control": false
```

### 3.5 `workflow.advanced_continuity_validation`

- **What it controls:** Enable deep continuity checks across session compaction.
- **Why it matters:** Validates that restored session state matches the last known good state. Prevents silent state corruption but adds overhead.
- **Allowed values:** `true`, `false`.
- **Default:** `false`
- **When to change:** Enable when context windows are frequently compacted or when session state integrity is critical.
- **Project profiles:** Enterprise-architect.
- **Examples:**

```json
"advanced_continuity_validation": false
```

### 3.6 `workflow.task_plus_enabled`

- **What it controls:** Enable extended task status tracking with sub-task breakdown and progress percentages.
- **Why it matters:** Adds richer progress visibility but introduces overhead. Useful for complex multi-step tasks.
- **Allowed values:** `true`, `false`.
- **Default:** `false`
- **When to change:** Enable when you need fine-grained progress tracking for complex phases.
- **Project profiles:** Team-mid, enterprise-architect.
- **Examples:**

```json
"task_plus_enabled": false
```

### 3.7 `workflow.plan_check`

- **What it controls:** Enable plan validation before execution.
- **Why it matters:** The `hm-plan-checker` agent verifies goal coverage, dependency completeness, and task granularity before execution starts. Catches plan issues early.
- **Allowed values:** `true`, `false`.
- **Default:** `true`
- **When to change:** Disable for quick experiments where plan validation overhead isn't justified. Keep enabled for most production workflows.
- **Project profiles:** Team-mid, enterprise-architect.
- **Examples:**

```json
"plan_check": true
```

### 3.8 `workflow.verifier`

- **What it controls:** Enable verification agent after phase execution.
- **Why it matters:** The `hm-verifier` agent validates implementation against plan must-haves and acceptance criteria. Catches implementation gaps early.
- **Allowed values:** `true`, `false`.
- **Default:** `true`
- **When to change:** Disable for quick experiments. Keep enabled for most production workflows.
- **Project profiles:** Team-mid, enterprise-architect.
- **Examples:**

```json
"verifier": true
```

### 3.9 `workflow.ui_phase`

- **What it controls:** Enable the UI design contract phase for frontend work.
- **Why it matters:** When enabled, generates `UI-SPEC.md` before implementation. Ensures UI design decisions are locked before coding begins.
- **Allowed values:** `true`, `false`.
- **Default:** `false`
- **When to change:** Enable when building user interfaces. Disable for backend-only projects.
- **Project profiles:** Team-mid.
- **Examples:**

```json
"ui_phase": false
```

### 3.10 `workflow.ui_safety_gate`

- **What it controls:** Enable UI safety gate that validates accessibility and visual correctness before shipping.
- **Why it matters:** Requires `ui_phase` to be enabled. Adds an extra validation layer for UI quality. Disable if not building user interfaces.
- **Allowed values:** `true`, `false`.
- **Default:** `false`
- **When to change:** Enable when `ui_phase` is enabled and you want accessibility validation.
- **Project profiles:** Team-mid.
- **Examples:**

```json
"ui_safety_gate": false
```

### 3.11 `workflow.ai_integration_phase`

- **What it controls:** Enable the AI integration design contract phase.
- **Why it matters:** When enabled, generates `AI-SPEC.md` for phases involving LLM or ML components. Ensures AI integration decisions are locked before implementation.
- **Allowed values:** `true`, `false`.
- **Default:** `false`
- **When to change:** Enable when building AI-powered features. Disable for non-AI projects.
- **Project profiles:** Research-heavy, enterprise-architect.
- **Examples:**

```json
"ai_integration_phase": false
```

### 3.12 `workflow.research_before_questions`

- **What it controls:** Require research before asking clarifying questions.
- **Why it matters:** When enabled, the agent first investigates the codebase, then asks only what cannot be inferred. Reduces unnecessary questions but may delay clarifications.
- **Allowed values:** `true`, `false`.
- **Default:** `true`
- **When to change:** Disable if you prefer upfront questions before any investigation. Keep enabled for most workflows.
- **Project profiles:** Research-heavy, team-mid.
- **Examples:**

```json
"research_before_questions": true
```

### 3.13 `workflow.discuss_mode`

- **What it controls:** Phase discussion intensity.
- **Why it matters:** Controls how much discussion happens before planning. `sufficient` gathers enough context, `intensive` does deep exploration, `skip` goes directly to planning.
- **Allowed values:** `sufficient-phase-discussion`, `intensive-phase-discussion`, `skip-phase-discussion`.
- **Default:** `sufficient-phase-discussion`
- **When to change:** Use `intensive` for complex features requiring deep analysis. Use `skip` for trivial tasks. Keep `sufficient` for most workflows.
- **Project profiles:** Solo-vibecoder, team-mid, enterprise-architect.
- **Examples:**

```json
"discuss_mode": "sufficient-phase-discussion"
```

### 3.14 `workflow.use_worktrees`

- **What it controls:** Use git worktrees for isolated task execution.
- **Why it matters:** Each wave of parallel tasks gets its own worktree, enabling concurrent work without branch switching. Requires git worktree support.
- **Allowed values:** `true`, `false`.
- **Default:** `false`
- **When to change:** Enable for concurrent work without branch switching. Disable if your git setup doesn't support worktrees.
- **Project profiles:** Enterprise-architect, fast-iteration.
- **Examples:**

```json
"use_worktrees": false
```

### 3.15 `workflow.intent_lock`

- **What it controls:** 4-step governance gate for root sessions.
- **Why it matters:** When enabled, sessions must pass intent-lock → trajectory → roadmap → phase-manifest before file-mutation tools are unlocked. Provides strong governance but adds overhead.
- **Allowed values:** Object with `enabled` boolean.
- **Default:** `{ "enabled": false }`
- **When to change:** Enable for enterprise workflows requiring strict governance. Disable for most development workflows.
- **Project profiles:** Enterprise-architect.
- **Examples:**

```json
"intent_lock": { "enabled": false }
```

### 3.16 `workflow.intent_lock.enabled`

- **What it controls:** Enable/disable the 4-step governance gate.
- **Why it matters:** When true, the intent-lock gate enforces a 4-step process before file mutation tools are unlocked. This is a strong governance mechanism.
- **Allowed values:** `true`, `false`.
- **Default:** `false`
- **When to change:** Enable for enterprise workflows requiring strict governance.
- **Project profiles:** Enterprise-architect.
- **Examples:**

```json
"intent_lock": { "enabled": true }
```

---

## 4. Governance

### 4.1 `governance`

- **What it controls:** Governance rules, agent configs, command mappings, naming standards, and tool registry.
- **Why it matters:** Controls what tools are allowed, how agents behave, and which commands route where. This is the central governance configuration.
- **Allowed values:** Object with sub-fields.
- **Default:** Empty rules with allow-all fallback.
- **When to change:** Adjust sub-fields based on your governance needs. The defaults are safe for most projects.
- **Project profiles:** Team-mid, enterprise-architect.
- **Examples:**

```json
"governance": {
  "rules": [],
  "default_action": "allow",
  "hardcoded_gates": { "manual_state_writes": "warn" }
}
```

### 4.2 `governance.default_action`

- **What it controls:** Fallback action when no governance rule matches a tool call.
- **Why it matters:** Determines what happens when no specific rule applies. `allow` permits all unmatched calls, `block` blocks them, `escalate` requires human approval.
- **Allowed values:** `allow`, `warn`, `block`, `escalate`, `needs_jit_grant`.
- **Default:** `allow`
- **When to change:** Use `warn` to log all unmatched calls. Use `block` for deny-by-default security. Use `escalate` for human-in-the-loop governance.
- **Project profiles:** Team-mid, enterprise-architect.
- **Examples:**

```json
"default_action": "allow"
```

### 4.3 `governance.write_denylist_override`

- **What it controls:** Override the governance write denylist for doc-intelligence operations.
- **Why it matters:** Controls which files the governance engine refuses to write. `disabled` bypasses the denylist entirely. An array of glob patterns replaces the built-in denylist.
- **Allowed values:** `"disabled"` or array of glob pattern strings.
- **Default:** *(none — built-in denylist applies)*
- **When to change:** Use `"disabled"` to bypass all write restrictions. Use a custom array to replace the built-in denylist with your own patterns.
- **Project profiles:** Enterprise-architect.
- **Examples:**

```json
"write_denylist_override": "disabled"
```

```json
"write_denylist_override": [".env*", "*.key"]
```

### 4.4 `governance.hardcoded_gates`

- **What it controls:** Hardcoded governance gates that cannot be overridden by rules.
- **Why it matters:** These are safety boundaries enforced regardless of rule configuration. They protect critical state files from accidental modification.
- **Allowed values:** Object with sub-fields.
- **Default:** `{ "manual_state_writes": "warn" }`
- **When to change:** Adjust `manual_state_writes` to control the state-write guard.
- **Project profiles:** Enterprise-architect.
- **Examples:**

```json
"hardcoded_gates": { "manual_state_writes": "warn" }
```

### 4.5 `governance.hardcoded_gates.manual_state_writes`

- **What it controls:** Gate for manual writes to `.hivemind/` state files.
- **Why it matters:** `allow` permits without logging, `warn` permits with warning, `block` hard-blocks. Protects runtime state from accidental corruption.
- **Allowed values:** `allow`, `warn`, `block`.
- **Default:** `warn`
- **When to change:** Use `block` for strict state protection. Use `allow` when you need to manually edit state files (not recommended).
- **Project profiles:** Enterprise-architect.
- **Examples:**

```json
"manual_state_writes": "warn"
```

---

## 5. Governance Rules

### 5.1 `governance.rules`

- **What it controls:** Array of governance rules evaluated in order for every tool call.
- **Why it matters:** First matching rule wins. Empty array means no custom rules — all calls use `default_action`. Rules enable fine-grained control over tool access.
- **Allowed values:** Array of rule objects.
- **Default:** `[]`
- **When to change:** Add rules when you need to restrict, warn on, or escalate specific tool calls.
- **Project profiles:** Team-mid, enterprise-architect.
- **Examples:**

```json
"rules": []
```

```json
"rules": [
  {
    "id": "gov-delegate-task-subagent-only",
    "condition": { "toolNames": ["delegate-task"] },
    "action": { "type": "allow" },
    "enabled": true
  }
]
```

### 5.2 `governance.rules[].id`

- **What it controls:** Unique identifier for a governance rule.
- **Why it matters:** Used for debugging and rule lookup. Makes it easy to identify which rule fired in logs.
- **Allowed values:** String (kebab-case recommended).
- **Default:** *(none — required)*
- **When to change:** Choose descriptive IDs that indicate the rule's purpose.
- **Project profiles:** Team-mid, enterprise-architect.
- **Examples:**

```json
"id": "gov-delegate-task-subagent-only"
```

### 5.3 `governance.rules[].condition`

- **What it controls:** Condition that triggers this rule.
- **Why it matters:** All specified fields must match (AND logic). Empty condition matches all calls. Conditions can match on tool names, session IDs, and delegation depth.
- **Allowed values:** Object with optional sub-fields.
- **Default:** *(none — empty matches all)*
- **When to change:** Add conditions to restrict when a rule applies.
- **Project profiles:** Team-mid, enterprise-architect.
- **Examples:**

```json
"condition": { "toolNames": ["bash"] }
```

```json
"condition": { "depth": { "min": 1 } }
```

### 5.4 `governance.rules[].condition.toolNames`

- **What it controls:** Match when any of these tool names are called.
- **Why it matters:** Tool names are case-sensitive and match the registered tool name exactly. Multiple names mean OR logic (any match triggers).
- **Allowed values:** Array of strings.
- **Default:** *(none)*
- **When to change:** Add tool names to restrict a rule to specific tools.
- **Project profiles:** Team-mid, enterprise-architect.
- **Examples:**

```json
"toolNames": ["bash"]
```

```json
"toolNames": ["delegate-task", "task"]
```

### 5.5 `governance.rules[].condition.sessionIDs`

- **What it controls:** Match when the call originates from any of these session IDs.
- **Why it matters:** Use for session-specific governance. Rarely used in practice — most rules target tool names or depth.
- **Allowed values:** Array of strings.
- **Default:** *(none)*
- **When to change:** Add session IDs when you need session-specific rules.
- **Project profiles:** Enterprise-architect.
- **Examples:**

```json
"sessionIDs": ["ses_abc123"]
```

### 5.6 `governance.rules[].condition.depth`

- **What it controls:** Match when delegation depth falls within the min/max range.
- **Why it matters:** Depth 0 = root session. Use to restrict rules to deeper subagents or shallow sessions.
- **Allowed values:** Object with `min` and/or `max` numbers.
- **Default:** *(none)*
- **When to change:** Add depth conditions to restrict rules to specific delegation levels.
- **Project profiles:** Enterprise-architect.
- **Examples:**

```json
"depth": { "min": 1 }
```

```json
"depth": { "min": 0, "max": 2 }
```

### 5.7 `governance.rules[].action`

- **What it controls:** Action to take when this rule matches and all conditions are met.
- **Why it matters:** Determines what happens when the rule fires. `allow` permits, `warn` permits with logging, `block` blocks, `escalate` requires human approval.
- **Allowed values:** Object with `type` and optional sub-fields.
- **Default:** *(none — required)*
- **When to change:** Set the action type and optional message/escalation context.
- **Project profiles:** Team-mid, enterprise-architect.
- **Examples:**

```json
"action": { "type": "allow" }
```

```json
"action": { "type": "block", "message": "Tool not permitted in this context" }
```

### 5.8 `governance.rules[].action.type`

- **What it controls:** Action to take when this rule matches.
- **Why it matters:** `allow` = permit, `warn` = permit + log, `block` = hard-block, `escalate` = human-in-the-loop, `needs_jit_grant` = require explicit grant.
- **Allowed values:** `allow`, `warn`, `block`, `escalate`, `needs_jit_grant`.
- **Default:** *(none — required)*
- **When to change:** Choose based on your governance needs.
- **Project profiles:** Team-mid, enterprise-architect.
- **Examples:**

```json
"type": "warn"
```

### 5.9 `governance.rules[].action.message`

- **What it controls:** Human-readable message to display when this rule fires.
- **Why it matters:** Used in warn/block/escalate actions to explain why the action was taken. Helps users understand governance decisions.
- **Allowed values:** String.
- **Default:** *(none)*
- **When to change:** Add messages to explain governance decisions to users.
- **Project profiles:** Team-mid, enterprise-architect.
- **Examples:**

```json
"message": "Bash tool restricted to root session only"
```

### 5.10 `governance.rules[].action.escalation`

- **What it controls:** Additional context for escalate/needs_jit_grant actions.
- **Why it matters:** Passed to the escalation handler for routing. Contains key-value pairs that help the escalation system route the request.
- **Allowed values:** Object with dynamic string keys.
- **Default:** *(none)*
- **When to change:** Add escalation context when using escalate or needs_jit_grant actions.
- **Project profiles:** Enterprise-architect.
- **Examples:**

```json
"escalation": { "channel": "slack", "team": "platform" }
```

### 5.11 `governance.rules[].enabled`

- **What it controls:** Whether this rule is active.
- **Why it matters:** Disabled rules are skipped during evaluation. Use to temporarily disable rules without removing them.
- **Allowed values:** `true`, `false`.
- **Default:** `true`
- **When to change:** Set to `false` to temporarily disable a rule without removing it from the config.
- **Project profiles:** Team-mid, enterprise-architect.
- **Examples:**

```json
"enabled": true
```

---

## 6. Governance Naming Standards

### 6.1 `governance.naming_standards`

- **What it controls:** Naming convention rules for agents, skills, tools, and commands.
- **Why it matters:** Controls allowed prefixes, classifications, format patterns, and title length limits. Ensures consistent naming across the project.
- **Allowed values:** Object with sub-fields.
- **Default:** *(none — no naming enforcement)*
- **When to change:** Add naming standards when you want to enforce consistent naming conventions.
- **Project profiles:** Team-mid, enterprise-architect.
- **Examples:**

```json
"naming_standards": {
  "allowed_frameworks": ["hm", "hf", "gate", "stack"],
  "naming_format": "{framework}-{purpose}"
}
```

### 6.2 `governance.naming_standards.allowed_frameworks`

- **What it controls:** Permitted framework prefixes for agent/skill/tool naming.
- **Why it matters:** Agents using other prefixes will be flagged during audits. Enforces the Hivemind naming taxonomy.
- **Allowed values:** Array of strings.
- **Default:** *(none)*
- **When to change:** Add or remove framework prefixes based on your naming needs.
- **Project profiles:** Team-mid, enterprise-architect.
- **Examples:**

```json
"allowed_frameworks": ["hm", "hf", "gate", "stack"]
```

### 6.3 `governance.naming_standards.allowed_classifications`

- **What it controls:** Permitted classification tiers in the naming taxonomy.
- **Why it matters:** Controls agent hierarchy naming. Ensures agents follow the Hivemind classification system.
- **Allowed values:** Array of strings.
- **Default:** *(none)*
- **When to change:** Add or remove classifications based on your hierarchy needs.
- **Project profiles:** Team-mid, enterprise-architect.
- **Examples:**

```json
"allowed_classifications": ["root", "child", "grandchild", "fork"]
```

### 6.4 `governance.naming_standards.naming_format`

- **What it controls:** Expected naming template pattern.
- **Why it matters:** Used for validation and auto-generation. Defines the structure of agent/skill/tool names.
- **Allowed values:** String with template variables.
- **Default:** *(none)*
- **When to change:** Set a naming format when you want to enforce a specific name structure.
- **Project profiles:** Enterprise-architect.
- **Examples:**

```json
"naming_format": "{framework}/{workflow}/{classification}/{agent}/{purpose}@{depth}"
```

```json
"naming_format": "{framework}-{purpose}"
```

### 6.5 `governance.naming_standards.max_title_length`

- **What it controls:** Maximum character length for agent/skill titles.
- **Why it matters:** Longer titles are flagged during audits. Helps keep names concise and manageable.
- **Allowed values:** Number (positive integer).
- **Default:** *(none — no limit)*
- **When to change:** Set a limit when you want to enforce concise naming.
- **Project profiles:** Enterprise-architect.
- **Examples:**

```json
"max_title_length": 80
```

---

## 7. Governance Agent Configs

### 7.1 `governance.agent_configs`

- **What it controls:** Per-agent configuration overrides. Keyed by agent name.
- **Why it matters:** Controls description, allowed commands, tools, and temperature for each agent. Enables fine-grained agent customization.
- **Allowed values:** Object with dynamic keys (agent names).
- **Default:** *(none — no agent-specific overrides)*
- **When to change:** Add agent configs when you want to customize specific agents.
- **Project profiles:** Team-mid, enterprise-architect.
- **Examples:**

```json
"agent_configs": {
  "hm-executor": {
    "description": "Executes PLAN.md tasks atomically"
  }
}
```

### 7.2 `governance.agent_configs.<name>.description`

- **What it controls:** Human-readable description of this agent's purpose and capabilities.
- **Why it matters:** Used in agent discovery and routing. Helps the system understand what each agent does.
- **Allowed values:** String.
- **Default:** *(none)*
- **When to change:** Add descriptions for all agents you configure.
- **Project profiles:** Team-mid, enterprise-architect.
- **Examples:**

```json
"description": "Executes PLAN.md tasks atomically"
```

### 7.3 `governance.agent_configs.<name>.allowedCommands`

- **What it controls:** List of slash commands this agent is permitted to execute.
- **Why it matters:** Empty array means no commands allowed. Restricts which commands an agent can use.
- **Allowed values:** Array of strings.
- **Default:** *(none — all commands allowed)*
- **When to change:** Add command restrictions when you want to limit an agent's capabilities.
- **Project profiles:** Team-mid, enterprise-architect.
- **Examples:**

```json
"allowedCommands": ["/hm-execute-phase", "/hm-verify-work"]
```

### 7.4 `governance.agent_configs.<name>.tools`

- **What it controls:** List of tool names this agent can access.
- **Why it matters:** Empty array means no tools allowed. Omit for default tool set. Restricts which tools an agent can use.
- **Allowed values:** Array of strings.
- **Default:** *(none — default tool set)*
- **When to change:** Add tool restrictions when you want to limit an agent's capabilities.
- **Project profiles:** Team-mid, enterprise-architect.
- **Examples:**

```json
"tools": ["read", "write", "edit"]
```

### 7.5 `governance.agent_configs.<name>.temperature`

- **What it controls:** Model temperature override for this agent.
- **Why it matters:** Higher values produce more creative/random output. Lower values produce more deterministic output. Omit for default.
- **Allowed values:** Number (0.0–2.0).
- **Default:** *(none — model default)*
- **When to change:** Adjust temperature when you want specific agents to be more creative or more deterministic.
- **Project profiles:** Team-mid, enterprise-architect.
- **Examples:**

```json
"temperature": 0.7
```

---

## 8. Governance Command Mappings

### 8.1 `governance.command_agent_mappings`

- **What it controls:** Command-to-agent routing table. Keyed by command name.
- **Why it matters:** Maps slash commands to the agent that handles them and optional workflow identifiers. Controls command routing.
- **Allowed values:** Object with dynamic keys (command names).
- **Default:** *(none — no custom routing)*
- **When to change:** Add mappings when you want to route specific commands to specific agents.
- **Project profiles:** Team-mid, enterprise-architect.
- **Examples:**

```json
"command_agent_mappings": {
  "hm-execute": {
    "agent": "hm-executor",
    "description": "Execute phase plans"
  }
}
```

### 8.2 `governance.command_agent_mappings.<name>.agent`

- **What it controls:** Agent name that handles this command.
- **Why it matters:** Empty string means no agent routing (inline execution). Maps commands to agents.
- **Allowed values:** String.
- **Default:** *(none)*
- **When to change:** Set agent names for commands you want routed to specific agents.
- **Project profiles:** Team-mid, enterprise-architect.
- **Examples:**

```json
"agent": "hm-executor"
```

### 8.3 `governance.command_agent_mappings.<name>.workflow`

- **What it controls:** Workflow identifier to execute when this command is invoked.
- **Why it matters:** Maps to a registered workflow definition. Enables command-specific workflows.
- **Allowed values:** String.
- **Default:** *(none)*
- **When to change:** Set workflow IDs when you want commands to trigger specific workflows.
- **Project profiles:** Team-mid, enterprise-architect.
- **Examples:**

```json
"workflow": "gsd-execute-phase"
```

### 8.4 `governance.command_agent_mappings.<name>.description`

- **What it controls:** Human-readable description of what this command does.
- **Why it matters:** Used in command discovery and help text. Helps users understand command purpose.
- **Allowed values:** String.
- **Default:** *(none)*
- **When to change:** Add descriptions for all commands you configure.
- **Project profiles:** Team-mid, enterprise-architect.
- **Examples:**

```json
"description": "Execute phase plans"
```

---

## 9. Governance Templates

### 9.1 `governance.templates`

- **What it controls:** Reusable prompt templates. Keyed by template name.
- **Why it matters:** Support mustache-style `{{variable}}` interpolation for dynamic content. Enables consistent prompt patterns.
- **Allowed values:** Object with dynamic keys (template names).
- **Default:** *(none)*
- **When to change:** Add templates when you want reusable prompt patterns.
- **Project profiles:** Team-mid, enterprise-architect.
- **Examples:**

```json
"templates": {
  "audit-brief": {
    "content": "Audit the following: {{brief}}"
  }
}
```

### 9.2 `governance.templates.<name>.description`

- **What it controls:** Human-readable description of when and how to use this template.
- **Why it matters:** Helps users understand when to use each template.
- **Allowed values:** String.
- **Default:** *(none)*
- **When to change:** Add descriptions for all templates you create.
- **Project profiles:** Team-mid, enterprise-architect.
- **Examples:**

```json
"description": "Template for audit briefings"
```

### 9.3 `governance.templates.<name>.content`

- **What it controls:** Template body content.
- **Why it matters:** Supports mustache-style `{{variable}}` interpolation. The actual prompt template text.
- **Allowed values:** String.
- **Default:** *(none)*
- **When to change:** Write template content with `{{variable}}` placeholders for dynamic content.
- **Project profiles:** Team-mid, enterprise-architect.
- **Examples:**

```json
"content": "Audit the following: {{brief}}"
```

---

## 10. Governance Tool Registry

### 10.1 `governance.tool_registry`

- **What it controls:** Tool registration catalog. Keyed by tool name.
- **Why it matters:** Defines tool descriptions and permission categories for governance evaluation. Currently schema-only (no entries in configs.json).
- **Allowed values:** Object with dynamic keys (tool names).
- **Default:** *(none — empty)*
- **When to change:** Add tool registrations when you want to define custom tool metadata for governance.
- **Project profiles:** Team-mid, enterprise-architect.
- **Examples:**

```json
"tool_registry": {
  "delegate-task": {
    "name": "delegate-task",
    "description": "Delegate work to specialist agents",
    "permissions": ["delegate"]
  }
}
```

### 10.2 `governance.tool_registry.<name>.name`

- **What it controls:** Registered tool name identifier.
- **Why it matters:** Must match the tool's registered name exactly. Used for tool lookup.
- **Allowed values:** String.
- **Default:** *(none)*
- **When to change:** Set the tool name to match the actual tool name.
- **Project profiles:** Team-mid, enterprise-architect.
- **Examples:**

```json
"name": "delegate-task"
```

### 10.3 `governance.tool_registry.<name>.description`

- **What it controls:** Human-readable description of what this tool does.
- **Why it matters:** Used in tool discovery and governance evaluation.
- **Allowed values:** String.
- **Default:** *(none)*
- **When to change:** Add descriptions for all tools you register.
- **Project profiles:** Team-mid, enterprise-architect.
- **Examples:**

```json
"description": "Delegate work to specialist agents"
```

### 10.4 `governance.tool_registry.<name>.permissions`

- **What it controls:** Permission categories this tool requires.
- **Why it matters:** Used for governance evaluation. Defines what the tool is allowed to do.
- **Allowed values:** Array of strings (permission categories).
- **Default:** *(none)*
- **When to change:** Add permission categories for each tool you register.
- **Project profiles:** Team-mid, enterprise-architect.
- **Examples:**

```json
"permissions": ["delegate"]
```

```json
"permissions": ["read", "write"]
```

---

## 11. Behavioral

### 11.1 `behavioral`

- **What it controls:** Structured behavioral profile overrides.
- **Why it matters:** Resolution order: `behavioral.*` > root-level overrides > static profile default. Use this instead of root-level overrides for cleaner config.
- **Allowed values:** Object with sub-fields.
- **Default:** *(none — falls back to root-level or static profile)*
- **When to change:** Use this block instead of root-level overrides for cleaner configuration.
- **Project profiles:** All.
- **Examples:**

```json
"behavioral": {
  "guardrail_level": "moderate",
  "delegation_mode": "waiter",
  "communication_style": "mixed"
}
```

### 11.2 `behavioral.guardrail_level`

- **What it controls:** Guardrail intensity: `strict` = block-by-default, `moderate` = balanced, `permissive` = allow-by-default.
- **Why it matters:** Overrides static profile lookup. Controls how strictly the agent follows rules.
- **Allowed values:** `strict`, `moderate`, `permissive`.
- **Default:** *(none — falls back to root-level or static profile)*
- **When to change:** Use `strict` for enterprise governance, `moderate` for most projects, `permissive` for quick experiments.
- **Project profiles:** All.
- **Examples:**

```json
"guardrail_level": "moderate"
```

### 11.3 `behavioral.delegation_mode`

- **What it controls:** Delegation dispatch style: `waiter` = synchronous-block, `direct` = fire-and-forget, `autonomous` = self-directed delegation.
- **Why it matters:** Overrides static profile lookup. Controls how subagents are dispatched.
- **Allowed values:** `waiter`, `direct`, `autonomous`.
- **Default:** *(none — falls back to root-level or static profile)*
- **When to change:** Use `waiter` for most workflows, `direct` for quick tasks, `autonomous` for self-directed delegation.
- **Project profiles:** All.
- **Examples:**

```json
"delegation_mode": "waiter"
```

### 11.4 `behavioral.tool_access_pattern`

- **What it controls:** Tool visibility: `restricted` = essential-only, `standard` = normal-set, `full` = everything-exposed.
- **Why it matters:** Overrides static profile lookup. Controls which tools are surfaced to agents.
- **Allowed values:** `restricted`, `standard`, `full`.
- **Default:** *(none — falls back to root-level or static profile)*
- **When to change:** Use `restricted` for strict governance, `standard` for most projects, `full` for maximum flexibility.
- **Project profiles:** All.
- **Examples:**

```json
"tool_access_pattern": "standard"
```

### 11.5 `behavioral.skill_filter`

- **What it controls:** Skill loading filter: `curated` = essential-only, `domain` = project-relevant, `full` = all-available.
- **Why it matters:** Overrides static profile lookup. Controls which skills are loaded.
- **Allowed values:** `curated`, `domain`, `full`.
- **Default:** *(none — falls back to root-level or static profile)*
- **When to change:** Use `curated` for most projects, `domain` for project-specific skills, `full` for maximum capability.
- **Project profiles:** All.
- **Examples:**

```json
"skill_filter": "curated"
```

### 11.6 `behavioral.communication_style`

- **What it controls:** Agent response verbosity: `concise` = short-answers, `detailed` = full-explanations, `mixed` = context-dependent.
- **Why it matters:** Overrides `runtime.communication_style`. Controls how verbose agent responses are.
- **Allowed values:** `concise`, `detailed`, `mixed`.
- **Default:** *(none — falls back to runtime or static profile)*
- **When to change:** Use `concise` for experienced teams, `detailed` for beginners, `mixed` for most projects.
- **Project profiles:** Solo-vibecoder, team-mid.
- **Examples:**

```json
"communication_style": "mixed"
```

### 11.7 `behavioral.decision_speed`

- **What it controls:** Decision-making pace: `fast` = quick-execution, `deliberate` = thorough-analysis.
- **Why it matters:** Overrides `runtime.decision_speed`. Controls how quickly the agent makes decisions.
- **Allowed values:** `fast`, `deliberate`.
- **Default:** *(none — falls back to runtime or static profile)*
- **When to change:** Use `fast` for experienced teams, `deliberate` for complex projects.
- **Project profiles:** Solo-vibecoder, fast-iteration.
- **Examples:**

```json
"decision_speed": "fast"
```

### 11.8 `behavioral.expertise`

- **What it controls:** Agent self-model expertise level: `junior` = asks-more-questions, `mid` = balanced, `senior` = executes-confidently.
- **Why it matters:** Overrides `runtime.expertise`. Controls how confidently the agent executes.
- **Allowed values:** `junior`, `mid`, `senior`.
- **Default:** *(none — falls back to runtime or static profile)*
- **When to change:** Use `junior` for beginners, `mid` for most projects, `senior` for experienced teams.
- **Project profiles:** Solo-vibecoder, team-mid.
- **Examples:**

```json
"expertise": "mid"
```

---

## 12. Language

### 12.1 `language`

- **What it controls:** Structured language overrides.
- **Why it matters:** Resolution order: `language.*` > root-level fields. Use this when you want a structured config instead of separate root-level language fields.
- **Allowed values:** Object with sub-fields.
- **Default:** *(none — falls back to root-level fields)*
- **When to change:** Use this block instead of root-level language fields for cleaner configuration.
- **Project profiles:** Multilang-vi, multilang-en, team-mid.
- **Examples:**

```json
"language": {
  "conversation": "vi",
  "documents": "en"
}
```

### 12.2 `language.conversation`

- **What it controls:** Override conversation language.
- **Why it matters:** Takes precedence over root-level `conversation_language` when set.
- **Allowed values:** `en`, `vi`, `zh`, `fr`, `ja`, `ko`, `de`, `es`, `th`, `id`.
- **Default:** *(none — falls back to root-level)*
- **When to change:** Use this instead of `conversation_language` for structured config.
- **Project profiles:** Multilang-vi, multilang-en.
- **Examples:**

```json
"conversation": "vi"
```

### 12.3 `language.documents`

- **What it controls:** Override documents language.
- **Why it matters:** Takes precedence over root-level `documents_and_artifacts_language` when set.
- **Allowed values:** `en`, `vi`, `zh`, `fr`, `ja`, `ko`, `de`, `es`, `th`, `id`.
- **Default:** *(none — falls back to root-level)*
- **When to change:** Use this instead of `documents_and_artifacts_language` for structured config.
- **Project profiles:** Multilang-vi, multilang-en.
- **Examples:**

```json
"documents": "en"
```

---

## 13. Runtime

### 13.1 `runtime`

- **What it controls:** Runtime profile overrides.
- **Why it matters:** Resolution order: `runtime.*` > `behavioral.*` > root-level > static profile default. Use this for fine-grained runtime control.
- **Allowed values:** Object with sub-fields.
- **Default:** *(none — falls back to behavioral or root-level)*
- **When to change:** Use this block for fine-grained runtime control beyond behavioral overrides.
- **Project profiles:** All.
- **Examples:**

```json
"runtime": {
  "communication_style": "mixed",
  "decision_speed": "fast",
  "expertise": "mid"
}
```

### 13.2 `runtime.communication_style`

- **What it controls:** Runtime communication style override.
- **Why it matters:** Takes precedence over `behavioral.communication_style` when set.
- **Allowed values:** `concise`, `detailed`, `mixed`.
- **Default:** *(none — falls back to behavioral)*
- **When to change:** Use this for runtime-specific communication style overrides.
- **Project profiles:** Solo-vibecoder, team-mid.
- **Examples:**

```json
"communication_style": "mixed"
```

### 13.3 `runtime.decision_speed`

- **What it controls:** Runtime decision speed override.
- **Why it matters:** Takes precedence over `behavioral.decision_speed` when set.
- **Allowed values:** `fast`, `deliberate`.
- **Default:** *(none — falls back to behavioral)*
- **When to change:** Use this for runtime-specific decision speed overrides.
- **Project profiles:** Solo-vibecoder, fast-iteration.
- **Examples:**

```json
"decision_speed": "fast"
```

### 13.4 `runtime.expertise`

- **What it controls:** Runtime expertise override.
- **Why it matters:** Takes precedence over `behavioral.expertise` when set.
- **Allowed values:** `junior`, `mid`, `senior`.
- **Default:** *(none — falls back to behavioral)*
- **When to change:** Use this for runtime-specific expertise overrides.
- **Project profiles:** Solo-vibecoder, team-mid.
- **Examples:**

```json
"expertise": "mid"
```

---

## Project Profile Recommendations

### Solo Vibecoder

Recommended settings for solo developers working quickly.

```json
{
  "conversation_language": "en",
  "documents_and_artifacts_language": "en",
  "mode": "expert-advisor",
  "user_expert_level": "intermediate-high-level",
  "parallelization": true,
  "atomic_commit": true,
  "guardrail_level": "moderate",
  "delegation_mode": "waiter",
  "tool_access_pattern": "standard",
  "skill_filter": "curated",
  "delegation_systems": {
    "native_task": true,
    "delegate_task": true,
    "background_delegation": true
  },
  "workflow": {
    "research": true,
    "plan_check": true,
    "verifier": true,
    "discuss_mode": "sufficient-phase-discussion"
  },
  "behavioral": {
    "guardrail_level": "moderate",
    "delegation_mode": "waiter",
    "communication_style": "mixed",
    "decision_speed": "fast",
    "expertise": "mid"
  }
}
```

### Team Mid-Level

Recommended settings for small teams with mixed experience.

```json
{
  "conversation_language": "en",
  "documents_and_artifacts_language": "en",
  "document_paths": [".planning/"],
  "mode": "hivemind-powered",
  "user_expert_level": "intermediate-high-level",
  "parallelization": true,
  "atomic_commit": true,
  "commit_docs": true,
  "guardrail_level": "moderate",
  "delegation_mode": "waiter",
  "tool_access_pattern": "standard",
  "skill_filter": "curated",
  "delegation_systems": {
    "native_task": true,
    "delegate_task": true,
    "background_delegation": true
  },
  "workflow": {
    "research": true,
    "plan_check": true,
    "verifier": true,
    "task_plus_enabled": true,
    "discuss_mode": "sufficient-phase-discussion"
  },
  "governance": {
    "default_action": "allow",
    "naming_standards": {
      "allowed_frameworks": ["hm", "hf", "gate", "stack"],
      "allowed_classifications": ["root", "child", "grandchild", "fork"]
    }
  },
  "behavioral": {
    "guardrail_level": "moderate",
    "delegation_mode": "waiter",
    "communication_style": "mixed",
    "decision_speed": "fast",
    "expertise": "mid"
  }
}
```

### Enterprise Architect

Recommended settings for large teams with strict governance.

```json
{
  "conversation_language": "en",
  "documents_and_artifacts_language": "en",
  "document_paths": [".planning/", "docs/"],
  "mode": "hivemind-powered",
  "user_expert_level": "architecture-driven",
  "parallelization": true,
  "atomic_commit": true,
  "commit_docs": true,
  "guardrail_level": "strict",
  "delegation_mode": "waiter",
  "tool_access_pattern": "restricted",
  "skill_filter": "curated",
  "delegation_systems": {
    "native_task": true,
    "delegate_task": true,
    "background_delegation": true
  },
  "workflow": {
    "research": true,
    "cross_session_tasks_dependencies_validation": true,
    "trajectory_control": true,
    "advanced_continuity_validation": true,
    "task_plus_enabled": true,
    "plan_check": true,
    "verifier": true,
    "ai_integration_phase": true,
    "research_before_questions": true,
    "discuss_mode": "intensive-phase-discussion",
    "use_worktrees": true,
    "intent_lock": { "enabled": true }
  },
  "governance": {
    "default_action": "warn",
    "write_denylist_override": "disabled",
    "hardcoded_gates": { "manual_state_writes": "block" },
    "naming_standards": {
      "allowed_frameworks": ["hm", "hf", "gate", "stack"],
      "allowed_classifications": ["root", "child", "grandchild", "fork"],
      "naming_format": "{framework}/{workflow}/{classification}/{agent}/{purpose}@{depth}",
      "max_title_length": 80
    }
  },
  "behavioral": {
    "guardrail_level": "strict",
    "delegation_mode": "waiter",
    "tool_access_pattern": "restricted",
    "skill_filter": "curated",
    "communication_style": "detailed",
    "decision_speed": "deliberate",
    "expertise": "senior"
  }
}
```

### Research Heavy

Recommended settings for research-focused projects.

```json
{
  "conversation_language": "en",
  "documents_and_artifacts_language": "en",
  "mode": "expert-advisor",
  "user_expert_level": "architecture-driven",
  "parallelization": true,
  "atomic_commit": true,
  "commit_docs": true,
  "guardrail_level": "moderate",
  "delegation_mode": "waiter",
  "tool_access_pattern": "full",
  "skill_filter": "domain",
  "delegation_systems": {
    "native_task": true,
    "delegate_task": true,
    "background_delegation": true
  },
  "workflow": {
    "research": true,
    "trajectory_control": true,
    "plan_check": true,
    "verifier": true,
    "ai_integration_phase": true,
    "research_before_questions": true,
    "discuss_mode": "intensive-phase-discussion"
  },
  "behavioral": {
    "guardrail_level": "moderate",
    "delegation_mode": "waiter",
    "tool_access_pattern": "full",
    "skill_filter": "domain",
    "communication_style": "detailed",
    "decision_speed": "deliberate",
    "expertise": "senior"
  }
}
```

### Fast Iteration

Recommended settings for rapid prototyping.

```json
{
  "conversation_language": "en",
  "documents_and_artifacts_language": "en",
  "mode": "free-style",
  "user_expert_level": "intermediate-high-level",
  "parallelization": true,
  "atomic_commit": false,
  "commit_docs": false,
  "guardrail_level": "permissive",
  "delegation_mode": "direct",
  "tool_access_pattern": "full",
  "skill_filter": "full",
  "delegation_systems": {
    "native_task": true,
    "delegate_task": true,
    "background_delegation": true
  },
  "workflow": {
    "research": false,
    "plan_check": false,
    "verifier": false,
    "discuss_mode": "skip-phase-discussion",
    "use_worktrees": true
  },
  "behavioral": {
    "guardrail_level": "permissive",
    "delegation_mode": "direct",
    "tool_access_pattern": "full",
    "skill_filter": "full",
    "communication_style": "concise",
    "decision_speed": "fast",
    "expertise": "mid"
  }
}
```

### Multilang Vietnamese

Recommended settings for Vietnamese-speaking teams.

```json
{
  "conversation_language": "vi",
  "documents_and_artifacts_language": "vi",
  "mode": "hivemind-powered",
  "user_expert_level": "intermediate-high-level",
  "parallelization": true,
  "atomic_commit": true,
  "commit_docs": true,
  "guardrail_level": "moderate",
  "delegation_mode": "waiter",
  "tool_access_pattern": "standard",
  "skill_filter": "curated",
  "delegation_systems": {
    "native_task": true,
    "delegate_task": true,
    "background_delegation": true
  },
  "workflow": {
    "research": true,
    "plan_check": true,
    "verifier": true,
    "discuss_mode": "sufficient-phase-discussion"
  },
  "behavioral": {
    "guardrail_level": "moderate",
    "delegation_mode": "waiter",
    "communication_style": "mixed",
    "decision_speed": "fast",
    "expertise": "mid"
  },
  "language": {
    "conversation": "vi",
    "documents": "vi"
  }
}
```

### Multilang English

Recommended settings for English-speaking teams.

```json
{
  "conversation_language": "en",
  "documents_and_artifacts_language": "en",
  "mode": "hivemind-powered",
  "user_expert_level": "intermediate-high-level",
  "parallelization": true,
  "atomic_commit": true,
  "commit_docs": true,
  "guardrail_level": "moderate",
  "delegation_mode": "waiter",
  "tool_access_pattern": "standard",
  "skill_filter": "curated",
  "delegation_systems": {
    "native_task": true,
    "delegate_task": true,
    "background_delegation": true
  },
  "workflow": {
    "research": true,
    "plan_check": true,
    "verifier": true,
    "discuss_mode": "sufficient-phase-discussion"
  },
  "behavioral": {
    "guardrail_level": "moderate",
    "delegation_mode": "waiter",
    "communication_style": "mixed",
    "decision_speed": "fast",
    "expertise": "mid"
  },
  "language": {
    "conversation": "en",
    "documents": "en"
  }
}
```

---

## Resolution Order Summary

When the same setting exists at multiple levels, the resolution order is:

| Setting | Resolution Order |
|---------|-----------------|
| Guardrail level | `behavioral.guardrail_level` > root `guardrail_level` > static profile |
| Delegation mode | `behavioral.delegation_mode` > root `delegation_mode` > static profile |
| Tool access | `behavioral.tool_access_pattern` > root `tool_access_pattern` > static profile |
| Skill filter | `behavioral.skill_filter` > root `skill_filter` > static profile |
| Communication style | `runtime.communication_style` > `behavioral.communication_style` > static profile |
| Decision speed | `runtime.decision_speed` > `behavioral.decision_speed` > static profile |
| Expertise | `runtime.expertise` > `behavioral.expertise` > static profile |
| Conversation language | `language.conversation` > root `conversation_language` > default |
| Documents language | `language.documents` > root `documents_and_artifacts_language` > default |

---

*Generated by hm-doc-writer · Production asset (git-versioned, no date-stamp)*
