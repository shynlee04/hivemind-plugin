---
sessionID: ses_1c317120affef8b53lWWFbDU67
created: 2026-05-18T21:05:58.843Z
updated: 2026-05-19T14:54:37.930Z
parentSessionID: null
delegationDepth: 0
children: []
continuityIndex: session-continuity.json
status: idle
---

## USER (turn 1)

**source:** real-human

<objective>
Execute all plans in a phase using wave-based parallel execution.

Orchestrator stays lean: discover plans, analyze dependencies, group into waves, spawn subagents, collect results. Each subagent loads the full execute-plan context and handles its own plan.

Optional wave filter:
- `--wave N` executes only Wave `N` for pacing, quota management, or staged rollout
- phase verification/completion still only happens when no incomplete plans remain after the selected wave finishes

Flag handling rule:
- The optional flags documented below are available behaviors, not implied active behaviors
- A flag is active only when its literal token appears in `14 <dựa vào các thông tin sau đã được chuẩn bị sẵn để execute các plan này ```/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/.gitkeep
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-01-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-02-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-03-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-04-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-CONTEXT.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-PATTERNS.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-RESEARCH.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-SPEC.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-VALIDATION.md ``` - delegate task tool cho gsd plan checker trước khi execute>`
- If a documented flag is absent from `14 <dựa vào các thông tin sau đã được chuẩn bị sẵn để execute các plan này ```/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/.gitkeep
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-01-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-02-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-03-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-04-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-CONTEXT.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-PATTERNS.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-RESEARCH.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-SPEC.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-VALIDATION.md ``` - delegate task tool cho gsd plan checker trước khi execute>`, treat it as inactive

Context budget: ~15% orchestrator, 100% fresh per subagent.
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-phase.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/ui-brand.md
</execution_context>

<runtime_note>
**Copilot (VS Code):** Use `vscode_askquestions` wherever this workflow calls `question`. They are equivalent — `vscode_askquestions` is the VS Code Copilot implementation of the same interactive question API.
</runtime_note>

<context>
Phase: 14 <dựa vào các thông tin sau đã được chuẩn bị sẵn để execute các plan này ```/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/.gitkeep
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-01-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-02-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-03-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-04-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-CONTEXT.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-PATTERNS.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-RESEARCH.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-SPEC.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-VALIDATION.md ``` - delegate task tool cho gsd plan checker trước khi execute>

**Available optional flags (documentation only — not automatically active):**
- `--wave N` — Execute only Wave `N` in the phase. Use when you want to pace execution or stay inside usage limits.
- `--gaps-only` — Execute only gap closure plans (plans with `gap_closure: true` in frontmatter). Use after verify-work creates fix plans.
- `--interactive` — Execute plans sequentially inline (no subagents) with user checkpoints between tasks. Lower token usage, pair-programming style. Best for small phases, bug fixes, and verification gaps.

**Active flags must be derived from `14 <dựa vào các thông tin sau đã được chuẩn bị sẵn để execute các plan này ```/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/.gitkeep
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-01-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-02-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-03-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-04-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-CONTEXT.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-PATTERNS.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-RESEARCH.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-SPEC.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-VALIDATION.md ``` - delegate task tool cho gsd plan checker trước khi execute>`:**
- `--wave N` is active only if the literal `--wave` token is present in `14 <dựa vào các thông tin sau đã được chuẩn bị sẵn để execute các plan này ```/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/.gitkeep
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-01-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-02-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-03-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-04-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-CONTEXT.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-PATTERNS.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-RESEARCH.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-SPEC.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-VALIDATION.md ``` - delegate task tool cho gsd plan checker trước khi execute>`
- `--gaps-only` is active only if the literal `--gaps-only` token is present in `14 <dựa vào các thông tin sau đã được chuẩn bị sẵn để execute các plan này ```/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/.gitkeep
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-01-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-02-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-03-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-04-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-CONTEXT.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-PATTERNS.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-RESEARCH.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-SPEC.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-VALIDATION.md ``` - delegate task tool cho gsd plan checker trước khi execute>`
- `--interactive` is active only if the literal `--interactive` token is present in `14 <dựa vào các thông tin sau đã được chuẩn bị sẵn để execute các plan này ```/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/.gitkeep
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-01-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-02-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-03-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-04-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-CONTEXT.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-PATTERNS.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-RESEARCH.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-SPEC.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-VALIDATION.md ``` - delegate task tool cho gsd plan checker trước khi execute>`
- If none of these tokens appear, run the standard full-phase execution flow with no flag-specific filtering
- Do not infer that a flag is active just because it is documented in this prompt

Context files are resolved inside the workflow via `gsd-sdk query init.execute-phase` and per-subagent `<files_to_read>` blocks.
</context>

<process>
Execute end-to-end.
Preserve all workflow gates (wave execution, checkpoint handling, verification, state updates, routing).
</process>
Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-phase.md"}
<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-phase.md</path>
<type>file</type>
<content>
1: <purpose>
2: Execute all plans in a phase using wave-based parallel execution. Orchestrator stays lean — delegates plan execution to subagents.
3: </purpose>
4: 
5: <core_principle>
6: Orchestrator coordinates, not executes. Each subagent loads the full execute-plan context. Orchestrator: discover plans → analyze deps → group waves → spawn agents → handle checkpoints → collect results.
7: </core_principle>
8: 
9: <runtime_compatibility>
10: **Subagent spawning is runtime-specific:**
11: - **Claude Code:** Uses `Agent(subagent_type="gsd-executor", ...)` — blocks until complete, returns result
12: - **Copilot:** Subagent spawning does not reliably return completion signals. **Default to
13:   sequential inline execution**: read and follow execute-plan.md directly for each plan
14:   instead of spawning parallel agents. Only attempt parallel spawning if the user
15:   explicitly requests it — and in that case, rely on the spot-check fallback in step 3
16:   to detect completion.
17: - **Other runtimes:** If `Agent`/`agent` tool is unavailable, use sequential inline execution as the
18:   fallback. Check for tool availability at runtime rather than assuming based on runtime name.
19: 
20: **Fallback rule:** If a spawned agent completes its work (commits visible, SUMMARY.md exists) but
21: the orchestrator never receives the completion signal, treat it as successful based on spot-checks
22: and continue to the next wave/plan. Never block indefinitely waiting for a signal — always verify
23: via filesystem and git state.
24: </runtime_compatibility>
25: 
26: <required_reading>
27: Read STATE.md before any operation to load project context.
28: @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/agent-contracts.md
29: @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/context-budget.md
30: @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/gates.md
31: </required_reading>
32: 
33: <available_agent_types>
34: These are the valid GSD subagent types registered in .claude/agents/ (or equivalent for your runtime).
35: Always use the exact name from this list — do not fall back to 'general-purpose' or other built-in types:
36: 
37: - gsd-executor — Executes plan tasks, commits, creates SUMMARY.md
38: - gsd-verifier — Verifies phase completion, checks quality gates
39: - gsd-planner — Creates detailed plans from phase scope
40: - gsd-phase-researcher — Researches technical approaches for a phase
41: - gsd-plan-checker — Reviews plan quality before execution
42: - gsd-debugger — Diagnoses and fixes issues
43: - gsd-codebase-mapper — Maps project structure and dependencies
44: - gsd-integration-checker — Checks cross-phase integration
45: - gsd-nyquist-auditor — Validates verification coverage
46: - gsd-ui-researcher — Researches UI/UX approaches
47: - gsd-ui-checker — Reviews UI implementation quality
48: - gsd-ui-auditor — Audits UI against design requirements
49: </available_agent_types>
50: 
51: <process>
52: 
53: <step name="parse_args" priority="first">
54: Parse `$ARGUMENTS` before loading any context:
55: 
56: - First positional token → `PHASE_ARG`
57: - Optional `--wave N` → `WAVE_FILTER`
58: - Optional `--gaps-only` keeps its current meaning
59: - Optional `--cross-ai` → `CROSS_AI_FORCE=true` (force all plans through cross-AI execution)
60: - Optional `--no-cross-ai` → `CROSS_AI_DISABLED=true` (disable cross-AI for this run, overrides config and frontmatter)
61: 
62: If `--wave` is absent, preserve the current behavior of executing all incomplete waves in the phase.
63: </step>
64: 
65: <step name="initialize" priority="first">
66: Load all context in one call:
67: 
68: ```bash
69: INIT=$(gsd-sdk query init.execute-phase "${PHASE_ARG}")
70: if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
71: AGENT_SKILLS=$(gsd-sdk query agent-skills gsd-executor)
72: ```
73: 
74: Parse JSON for: `executor_model`, `verifier_model`, `commit_docs`, `parallelization`, `branching_strategy`, `branch_name`, `phase_found`, `phase_dir`, `phase_number`, `phase_name`, `phase_slug`, `plans`, `incomplete_plans`, `plan_count`, `incomplete_count`, `state_exists`, `roadmap_exists`, `phase_req_ids`, `response_language`.
75: 
76: **Model resolution:** If `executor_model` is `"inherit"`, omit the `model=` parameter from all `Agent()` calls — do NOT pass `model="inherit"` to Agent. Omitting the `model=` parameter causes Claude Code to inherit the current orchestrator model automatically. Only set `model=` when `executor_model` is an explicit model name (e.g., `"claude-sonnet-4-6"`, `"claude-opus-4-7"`).
77: 
78: **If `response_language` is set:** Include `response_language: {value}` in all spawned subagent prompts so any user-facing output stays in the configured language.
79: 
80: Read worktree config:
81: 
82: ```bash
83: USE_WORKTREES=$(gsd-sdk query config-get workflow.use_worktrees 2>/dev/null || echo "true")
84: ```
85: 
86: If the project uses git submodules, worktree isolation is unsafe **only when a plan touches a submodule path** — the executor commit protocol cannot correctly handle submodule commits inside isolated worktrees. The previous behavior unconditionally disabled worktree isolation whenever `.gitmodules` existed, which penalised every plan in a submodule project even when the plan was nowhere near a submodule. Compute submodule paths once and intersect them per-plan with the plan's declared `files_modified` frontmatter.
87: 
88: ```bash
89: # Parse submodule paths from .gitmodules once (empty if no .gitmodules).
90: # SUBMODULE_PATHS is a newline-separated list of repo-relative paths.
91: if [ -f .gitmodules ]; then
92:   SUBMODULE_PATHS=$(git config --file .gitmodules --get-regexp '^submodule\..*\.path$' 2>/dev/null | awk '{print $2}')
93: else
94:   SUBMODULE_PATHS=""
95: fi
96: ```
97: 
98: `SUBMODULE_PATHS` is exported to the `execute_waves` step, where the per-plan decision actually happens (see "Per-plan worktree decision" sub-step inside `execute_waves`). The decision is per-plan because different plans in the same wave can touch different files — only plans whose paths intersect a submodule must drop worktree isolation; plans nowhere near a submodule keep parallel isolation.
99: 
100: When `USE_WORKTREES` (project-level) is `false`, all executor agents run without `isolation="worktree"` — they execute sequentially on the main working tree instead of in parallel worktrees. The per-plan decision below has no effect when worktrees are project-disabled.
101: 
102: Read context window size for adaptive prompt enrichment:
103: 
104: ```bash
105: CONTEXT_WINDOW=$(gsd-sdk query config-get context_window 2>/dev/null || echo "200000")
106: ```
107: 
108: When `CONTEXT_WINDOW >= 500000` (1M-class models), subagent prompts include richer context:
109: - Executor agents receive prior wave SUMMARY.md files and the phase CONTEXT.md/RESEARCH.md
110: - Verifier agents receive all PLAN.md, SUMMARY.md, CONTEXT.md files plus REQUIREMENTS.md
111: - This enables cross-phase awareness and history-aware verification
112: 
113: When `CONTEXT_WINDOW < 200000` (sub-200K models), subagent prompts are thinned to reduce static overhead:
114: - Executor agents omit extended deviation rule examples and checkpoint examples from inline prompt — load on-demand via @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/executor-examples.md
115: - Planner agents omit extended anti-pattern lists and specificity examples from inline prompt — load on-demand via @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/planner-antipatterns.md
116: - Core rules and decision logic remain inline; only verbose examples and edge-case lists are extracted
117: - This reduces executor static overhead by ~40% while preserving behavioral correctness
118: 
119: **If `phase_found` is false:** Error — phase directory not found.
120: **If `plan_count` is 0:** Error — no plans found in phase.
121: **If `state_exists` is false but `.planning/` exists:** Offer reconstruct or continue.
122: 
123: When `parallelization` is false, plans within a wave execute sequentially.
124: 
125: **Runtime detection for Copilot:**
126: Check if the current runtime is Copilot by testing for the `@gsd-executor` agent pattern
127: or absence of the `Agent()` subagent API. If running under Copilot, force sequential inline
128: execution regardless of the `parallelization` setting — Copilot's subagent completion
129: signals are unreliable (see `<runtime_compatibility>`). Set `COPILOT_SEQUENTIAL=true`
130: internally and skip the `execute_waves` step in favor of `check_interactive_mode`'s
131: inline path for each plan.
132: 
133: **REQUIRED — Sync chain flag with intent.** If user invoked manually (no `--auto`), clear the ephemeral chain flag from any previous interrupted `--auto` chain. This prevents stale `_auto_chain_active: true` from causing unwanted auto-advance. This does NOT touch `workflow.auto_advance` (the user's persistent settings preference). You MUST execute this bash block before any config reads:
134: ```bash
135: # REQUIRED: prevents stale auto-chain from previous --auto runs
136: if [[ ! "$ARGUMENTS" =~ --auto ]]; then
137:   gsd-sdk query config-set workflow._auto_chain_active false || true
138: fi
139: ```
140: 
141: Resolve `MVP_MODE` once via the centralized `phase.mvp-mode` query verb (precedence chain: CLI flag → ROADMAP `**Mode:** mvp` → `workflow.mvp_mode` config → false):
142: ```bash
143: MVP_FLAG_ARG=""
144: if [[ "$ARGUMENTS" =~ (^|[[:space:]])--mvp([[:space:]]|$) ]]; then MVP_FLAG_ARG="--cli-flag"; fi
145: MVP_MODE=$(gsd-sdk query phase.mvp-mode "${PHASE_NUMBER}" $MVP_FLAG_ARG --pick active)
146: TDD_MODE=$(gsd-sdk query config-get workflow.tdd_mode 2>/dev/null || echo "false")
147: ```
148: 
149: **MVP+TDD gate.** Task-scoped enforcement runs inside plan execution (immediately before each implementation step), where `TASK_FILE`, `PLAN_ID`, and `TASK_ID` are defined. Keep the same predicate and RED-commit contract:
150: ```bash
151: if [ "$MVP_MODE" = "true" ] && [ "$TDD_MODE" = "true" ]; then
152:   IS_BEHAVIOR_ADDING=$(gsd-sdk query task.is-behavior-adding "$TASK_FILE" --pick is_behavior_adding)
153:   if [ "$IS_BEHAVIOR_ADDING" = "true" ]; then
154:     RED_COMMIT=$(git log --oneline --grep="^test(${PHASE_NUMBER}-${PLAN_ID}):" -- "**/*.test.*" "**/*.spec.*" "tests/" | head -1)
155:     if [ -z "$RED_COMMIT" ]; then
156:       gsd-sdk query state.update last_gate_trip "${PLAN_ID}/${TASK_ID}" || true
157:       echo "MVP+TDD GATE TRIPPED: missing RED commit for ${PLAN_ID}/${TASK_ID}"
158:       exit 1
159:     fi
160:   fi
161: fi
162: ```
163: Pure doc-only / config-only / test-only tasks return `is_behavior_adding=false` and are exempt. See `execute-mvp-tdd.md` for the halt report format.
164: </step>
165: 
166: <step name="check_blocking_antipatterns" priority="first">
167: **MANDATORY — Check for blocking anti-patterns before any other work.**
168: 
169: Look for a `.continue-here.md` in the current phase directory:
170: 
171: ```bash
172: ls ${phase_dir}/.continue-here.md 2>/dev/null || true
173: ```
174: 
175: If `.continue-here.md` exists, parse its "Critical Anti-Patterns" table for rows with `severity` = `blocking`.
176: 
177: **If one or more `blocking` anti-patterns are found:**
178: 
179: This step cannot be skipped. Before proceeding to `check_interactive_mode` or any other step, the agent must demonstrate understanding of each blocking anti-pattern by answering all three questions for each one:
180: 
181: 1. **What is this anti-pattern?** — Describe it in your own words, not by quoting the handoff.
182: 2. **How did it manifest?** — Explain the specific failure that caused it to be recorded.
183: 3. **What structural mechanism (not acknowledgment) prevents it?** — Name the concrete step, checklist item, or enforcement mechanism that stops recurrence.
184: 
185: Write these answers inline before continuing. If a blocking anti-pattern cannot be answered from the context in `.continue-here.md`, stop and ask the user for clarification.
186: 
187: **If no `.continue-here.md` exists, or no `blocking` rows are found:** Proceed directly to `check_interactive_mode`.
188: </step>
189: 
190: <step name="check_interactive_mode">
191: **Parse `--interactive` flag from $ARGUMENTS.**
192: 
193: **If `--interactive` flag present:** Switch to interactive execution mode.
194: 
195: Interactive mode executes plans sequentially **inline** (no subagent spawning) with user
196: checkpoints between tasks. The user can review, modify, or redirect work at any point.
197: 
198: **Interactive execution flow:**
199: 
200: 1. Load plan inventory as normal (discover_and_group_plans)
201: 2. For each plan (sequentially, ignoring wave grouping):
202: 
203:    a. **Present the plan to the user:**
204:       ```
205:       ## Plan {plan_id}: {plan_name}
206: 
207:       Objective: {from plan file}
208:       Tasks: {task_count}
209: 
210:       Options:
211:       - Execute (proceed with all tasks)
212:       - Review first (show task breakdown before starting)
213:       - Skip (move to next plan)
214:       - Stop (end execution, save progress)
215:       ```
216: 
217:    b. **If "Review first":** Read and display the full plan file. Ask again: Execute, Modify, Skip.
218: 
219:    c. **If "Execute":** Read and follow `/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-plan.md` **inline**
220:       (do NOT spawn a subagent). Execute tasks one at a time.
221: 
222:    d. **After each task:** Pause briefly. If the user intervenes (types anything), stop and address
223:       their feedback before continuing. Otherwise proceed to next task.
224: 
225:    e. **After plan complete:** Show results, commit, create SUMMARY.md, then present next plan.
226: 
227: 3. After all plans: proceed to verification (same as normal mode).
228: 
229: **Benefits of interactive mode:**
230: - No subagent overhead — dramatically lower token usage
231: - User catches mistakes early — saves costly verification cycles
232: - Maintains GSD's planning/tracking structure
233: - Best for: small phases, bug fixes, verification gaps, learning GSD
234: 
235: **Skip to handle_branching step** (interactive plans execute inline after grouping).
236: </step>
237: 
238: <step name="handle_branching">
239: Check `branching_strategy` from init:
240: 
241: **"none":** Skip, continue on current branch.
242: 
243: **"phase" or "milestone":** Use pre-computed `branch_name` from init.
244: 
245: Fork the new phase branch off `origin/HEAD` (the project's default branch), not the current HEAD — otherwise consecutive phases compound and stay unpushed (#2916). If `$BRANCH_NAME` already exists locally, reuse it as-is.
246: 
247: ```bash
248: DEFAULT_BRANCH=$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null | sed 's|^origin/||')
249: DEFAULT_BRANCH=${DEFAULT_BRANCH:-main}
250: 
251: if git show-ref --verify --quiet "refs/heads/$BRANCH_NAME"; then
252:   git switch "$BRANCH_NAME" || { echo "ERROR: Could not switch to existing branch '$BRANCH_NAME'." >&2; exit 1; }
253: else
254:   if ! git fetch --quiet origin "$DEFAULT_BRANCH"; then  # #2916
255:     git show-ref --verify --quiet "refs/remotes/origin/$DEFAULT_BRANCH" \
256:       || { echo "ERROR: fetch origin/$DEFAULT_BRANCH failed and no local copy exists. Refusing to create '$BRANCH_NAME' off current HEAD (#2916)." >&2; exit 1; }
257:     echo "WARNING: fetch origin/$DEFAULT_BRANCH failed; using local copy as base." >&2
258:   fi
259:   if [ -n "$(git status --porcelain)" ]; then
260:     echo "WARNING: Uncommitted changes will be carried onto '$BRANCH_NAME' (branched off origin/$DEFAULT_BRANCH, not previous HEAD)."
261:   else
262:     git switch --quiet "$DEFAULT_BRANCH" 2>/dev/null && git merge --ff-only --quiet "origin/$DEFAULT_BRANCH" 2>/dev/null || true
263:   fi
264:   # Pinned base + fail-fast: on success HEAD is exactly at origin/$DEFAULT_BRANCH,
265:   # so a post-creation merge-base or "ahead-of" guard would be unreachable. The
266:   # explicit base argument here is the single source of correctness for #2916.
267:   git checkout -b "$BRANCH_NAME" "origin/$DEFAULT_BRANCH" \
268:     || { echo "ERROR: Could not create '$BRANCH_NAME' from origin/$DEFAULT_BRANCH (#2916)." >&2; exit 1; }
269: fi
270: ```
271: 
272: All subsequent commits go to this branch. User handles merging.
273: </step>
274: 
275: <step name="validate_phase">
276: From init JSON: `phase_dir`, `plan_count`, `incomplete_count`.
277: 
278: Report: "Found {plan_count} plans in {phase_dir} ({incomplete_count} incomplete)"
279: 
280: **Update STATE.md for phase start:**
281: ```bash
282: gsd-sdk query state.begin-phase --phase "${PHASE_NUMBER}" --name "${PHASE_NAME}" --plans "${PLAN_COUNT}"
283: ```
284: This updates Status, Last Activity, Current focus, Current Position, and plan counts in STATE.md so frontmatter and body text reflect the active phase immediately.
285: </step>
286: 
287: <step name="discover_and_group_plans">
288: Load plan inventory with wave grouping in one call:
289: 
290: ```bash
291: PLAN_INDEX=$(gsd-sdk query phase-plan-index "${PHASE_NUMBER}")
292: ```
293: 
294: Parse JSON for: `phase`, `plans[]` (each with `id`, `wave`, `autonomous`, `objective`, `files_modified`, `task_count`, `has_summary`), `waves` (map of wave number → plan IDs), `incomplete`, `has_checkpoints`.
295: 
296: **Filtering:** Skip plans where `has_summary: true`. If `--gaps-only`: also skip non-gap_closure plans. If `WAVE_FILTER` is set: also skip plans whose `wave` does not equal `WAVE_FILTER`.
297: 
298: **Wave safety check:** If `WAVE_FILTER` is set and there are still incomplete plans in any lower wave that match the current execution mode, STOP and tell the user to finish earlier waves first. Do not let Wave 2+ execute while prerequisite earlier-wave plans remain incomplete.
299: 
300: If all filtered: "No matching incomplete plans" → exit.
301: 
302: Report:
303: ```
304: ## Execution Plan
305: 
306: **Phase {X}: {Name}** — {total_plans} matching plans across {wave_count} wave(s)
307: 
308: {If WAVE_FILTER is set: `Wave filter active: executing only Wave {WAVE_FILTER}`.}
309: 
310: | Wave | Plans | What it builds |
311: |------|-------|----------------|
312: | 1 | 01-01, 01-02 | {from plan objectives, 3-8 words} |
313: | 2 | 01-03 | ... |
314: ```
315: </step>
316: 
317: <step name="cross_ai_delegation">
318: **Optional step 2.5 — Delegate plans to an external AI runtime.**
319: 
320: This step runs after plan discovery and before normal wave execution. It identifies plans
321: that should be delegated to an external AI command and executes them via stdin-based prompt
322: delivery. Plans handled here are removed from the execute_waves plan list so the normal
323: executor skips them.
324: 
325: **Activation logic:**
326: 
327: 1. If `CROSS_AI_DISABLED` is true (`--no-cross-ai` flag): skip this step entirely.
328: 2. If `CROSS_AI_FORCE` is true (`--cross-ai` flag): mark ALL incomplete plans for cross-AI execution.
329: 3. Otherwise: check each plan's frontmatter for `cross_ai: true` AND verify config
330:    `workflow.cross_ai_execution` is `true`. Plans matching both conditions are marked for cross-AI.
331: 
332: ```bash
333: CROSS_AI_ENABLED=$(gsd-sdk query config-get workflow.cross_ai_execution 2>/dev/null || echo "false")
334: CROSS_AI_CMD=$(gsd-sdk query config-get workflow.cross_ai_command 2>/dev/null || echo "")
335: CROSS_AI_TIMEOUT=$(gsd-sdk query config-get workflow.cross_ai_timeout 2>/dev/null || echo "300")
336: ```
337: 
338: **If no plans are marked for cross-AI:** Skip to execute_waves.
339: 
340: **If plans are marked but `cross_ai_command` is empty:** Error — tell user to set
341: `workflow.cross_ai_command` via `gsd-sdk query config-set workflow.cross_ai_command "<command>"`.
342: 
343: **For each cross-AI plan (sequentially):**
344: 
345: 1. **Construct the task prompt** from the plan file:
346:    - Extract `<objective>` and `<tasks>` sections from the PLAN.md
347:    - Append PROJECT.md context (project name, description, tech stack)
348:    - Format as a self-contained execution prompt
349: 
350: 2. **Check for dirty working tree before execution:**
351:    ```bash
352:    if ! git diff --quiet HEAD 2>/dev/null; then
353:      echo "WARNING: dirty working tree detected — the external AI command may produce uncommitted changes that conflict with existing modifications"
354:    fi
355:    ```
356: 
357: 3. **Run the external command** from the project root, writing the prompt to stdin.
358:    Never shell-interpolate the prompt — always pipe via stdin to prevent injection:
359:    ```bash
360:    echo "$TASK_PROMPT" | timeout "${CROSS_AI_TIMEOUT}s" ${CROSS_AI_CMD} > "$CANDIDATE_SUMMARY" 2>"$ERROR_LOG"
361:    EXIT_CODE=$?
362:    ```
363: 
364: 4. **Evaluate the result:**
365: 
366:    **Success (exit 0 + valid summary):**
367:    - Read `$CANDIDATE_SUMMARY` and validate it contains meaningful content
368:      (not empty, has at least a heading and description — a valid SUMMARY.md structure)
369:    - Write it as the plan's SUMMARY.md file
370:    - Update STATE.md plan status to complete
371:    - Update ROADMAP.md progress
372:    - Mark plan as handled — skip it in execute_waves
373: 
374:    **Failure (non-zero exit or invalid summary):**
375:    - Display the error output and exit code
376:    - Warn: "The external command may have left uncommitted changes or partial edits
377:      in the working tree. Review `git status` and `git diff` before proceeding."
378:    - Offer three choices:
379:      - **retry** — run the same plan through cross-AI again
380:      - **skip** — fall back to normal executor for this plan (re-add to execute_waves list)
381:      - **abort** — stop execution entirely, preserve state for resume
382: 
383: 5. **After all cross-AI plans processed:** Remove successfully handled plans from the
384:    incomplete plan list so execute_waves skips them. Any skipped-to-fallback plans remain
385:    in the list for normal executor processing.
386: </step>
387: 
388: <step name="execute_waves">
389: Execute each selected wave in sequence. Within a wave: parallel if `PARALLELIZATION=true`, sequential if `false`.
390: 
391: **Stream-idle-timeout prevention — checkpoint heartbeats (#2410):**
392: 
393: Multi-plan phases can accumulate enough subagent context that the the agent API
394: SSE layer terminates with `Stream idle timeout - partial response received`
395: between a large tool_result and the next assistant turn (seen on Claude Code
396: + Opus 4.7 at ~200K+ cache_read). To keep the stream warm, emit short
397: assistant-text heartbeats — **no tool call, just a literal line** — at every
398: wave and plan boundary. Each heartbeat MUST start with `[checkpoint]` so
399: tooling and `/gsd-manager`'s background-completion handler can grep partial
400: transcripts. `{P}/{Q}` is the phase-wide completed/total plans counter and
401: increases monotonically across waves. `{status}` is `complete` (success),
402: `failed` (executor error), or `checkpoint` (human-gate returned).
403: 
404: ```
405: [checkpoint] phase {PHASE_NUMBER} wave {N}/{M} starting, {wave_plan_count} plan(s), {P}/{Q} plans done
406: [checkpoint] phase {PHASE_NUMBER} wave {N}/{M} plan {plan_id} starting ({P}/{Q} plans done)
407: [checkpoint] phase {PHASE_NUMBER} wave {N}/{M} plan {plan_id} {status} ({P}/{Q} plans done)
408: [checkpoint] phase {PHASE_NUMBER} wave {N}/{M} complete, {P}/{Q} plans done ({wave_success}/{wave_plan_count} ok)
409: ```
410: 
411: **For each wave:**
412: 
413: 1. **Intra-wave files_modified overlap check (BEFORE spawning):**
414: 
415:    Before spawning any agents for this wave, inspect the `files_modified` list of all plans
416:    in the wave. Check every pair of plans in the wave — if any two plans share even one file
417:    in their `files_modified` lists, those plans have an implicit dependency and MUST NOT run
418:    in parallel.
419: 
420:    **Detection algorithm (pseudocode):**
421:    ```
422:    seen_files = {}
423:    overlapping_plans = []
424:    for each plan in wave_plans:
425:      for each file in plan.files_modified:
426:        if file in seen_files:
427:          overlapping_plans.add(plan, seen_files[file])  # both plans overlap on this file
428:        else:
429:          seen_files[file] = plan
430:    ```
431: 
432:    **If overlap is detected:**
433:    - Warn the user:
434:      ```
435:      ⚠ Intra-wave files_modified overlap detected in Wave {N}:
436:        Plan {A} and Plan {B} both modify {file}
437:        Running these plans sequentially to avoid parallel worktree conflicts.
438:      ```
439:    - Override `PARALLELIZATION` to `false` for this wave only — run all plans in the wave
440:      sequentially regardless of the global parallelization setting.
441:    - This is a safety net for plans that were incorrectly assigned to the same wave.
442:      The planner should have caught this; flag it as a planning defect so the user can
443:      replan the phase if desired.
444: 
445:    **If no overlap:** proceed normally (parallel if `PARALLELIZATION=true`).
446: 
447: 2. **Describe what's being built (BEFORE spawning):**
448: 
449:    **First, emit the wave-start checkpoint heartbeat as a literal assistant-text
450:    line — no tool call (#2410). Do NOT skip this even for single-plan waves; it
451:    is required before any further reasoning or spawning:**
452: 
453:    ```
454:    [checkpoint] phase {PHASE_NUMBER} wave {N}/{M} starting, {wave_plan_count} plan(s), {P}/{Q} plans done
455:    ```
456: 
457:    Then read each plan's `<objective>`. Extract what's being built and why.
458: 
459:    ```
460:    ---
461:    ## Wave {N}
462: 
463:    **{Plan ID}: {Plan Name}**
464:    {2-3 sentences: what this builds, technical approach, why it matters}
465: 
466:    Spawning {count} agent(s)...
467:    ---
468:    ```
469: 
470:    - Bad: "Executing terrain generation plan"
471:    - Good: "Procedural terrain generator using Perlin noise — creates height maps, biome zones, and collision meshes. Required before vehicle physics can interact with ground."
472: 
473: 2.5. **Per-plan worktree decision (run for each plan in this wave BEFORE its dispatch):**
474: 
475:    Read and execute `get-shit-done/workflows/execute-phase/steps/per-plan-worktree-gate.md` for each plan. It extracts `PLAN_FILES` from the plan's JSON, intersects against `SUBMODULE_PATHS` (with normalization, bidirectional matching, and glob-prefix handling), and sets `USE_WORKTREES_FOR_PLAN` to `false` when the plan touches a submodule path. Append `plan_id` to a `WAVE_WORKTREE_PLANS` accumulator when `USE_WORKTREES_FOR_PLAN != false`.
476: 
477:    The dispatch branches in step 3 below MUST gate on `USE_WORKTREES_FOR_PLAN` for the current plan, not on the project-level `USE_WORKTREES`.
478: 
479: 3. **Spawn executor agents:**
480: 
481:    **Emit a plan-start heartbeat (literal line, no tool call) immediately before
482:    each `Agent()` dispatch (#2410):**
483: 
484:    ```
485:    [checkpoint] phase {PHASE_NUMBER} wave {N}/{M} plan {plan_id} starting ({P}/{Q} plans done)
486:    ```
487: 
488:    Pass paths only — executors read files themselves with their fresh context window.
489:    For 200k models, this keeps orchestrator context lean (~10-15%).
490:    For 1M+ models (Opus 4.6, Sonnet 4.6), richer context can be passed directly.
491: 
492:    **Worktree mode** (`USE_WORKTREES_FOR_PLAN` is not `false` — evaluated per-plan in step 2.5):
493: 
494:    Before spawning, capture the current HEAD:
495:    ```bash
496:    EXPECTED_BASE=$(git rev-parse HEAD)
497:    ```
498: 
499:    **Sequential dispatch for parallel execution (waves with 2+ agents):**
500:    When spawning multiple agents in a wave, dispatch each `Agent()` call **one at a time
501:    with `run_in_background: true`** — do NOT send all Agent calls in a single message.
502:    `git worktree add` acquires an exclusive lock on `.git/config.lock`, so simultaneous
503:    calls race for this lock and fail. Sequential dispatch ensures each worktree finishes
504:    creation before the next begins (the round-trip latency of each tool call provides
505:    natural spacing), while all agents still **run in parallel** once created.
506: 
507:    ```text
508:    # CORRECT: dispatch one Agent() per message, each with run_in_background: true
509:    # → worktrees created sequentially, agents execute in parallel
510:    #
511:    # WRONG: multiple Agent() calls in a single message
512:    # → simultaneous git worktree add → .git/config.lock contention → failures
513:    ```
514: 
515:    ```text
516:    Agent(
517:      subagent_type="gsd-executor",
518:      description="Execute plan {plan_number} of phase {phase_number}",
519:      # Only include model= when executor_model is an explicit model name.
520:      # When executor_model is "inherit", omit this parameter entirely so
521:      # Claude Code inherits the orchestrator model automatically.
522:      model="{executor_model}",  # omit this line when executor_model == "inherit"
523:      isolation="worktree",
524:      prompt="
525:        <objective>
526:        Execute plan {plan_number} of phase {phase_number}-{phase_name}.
527:        Commit each task atomically. Create SUMMARY.md.
528:        Do NOT update STATE.md or ROADMAP.md — the orchestrator owns those writes after all worktree agents in the wave complete.
529:        </objective>
530: 
531:        <worktree_branch_check>
532:        FIRST ACTION: HEAD assertion MUST run before any reset/checkout. Worktrees
533:        spawned by Claude Code's `isolation="worktree"` use the `worktree-agent-<id>`
534:        namespace. If HEAD is on a protected ref (main/master/develop/trunk/release/*)
535:        or detached, HALT — do NOT self-recover by force-rewinding via `git update-ref`,
536:        that destroys concurrent commits in multi-active scenarios (#2924). Only after
537:        Step 1 passes is `git reset --hard` safe (#2015 — affects all platforms).
538:        ```bash
539:        HEAD_REF=$(git symbolic-ref --quiet HEAD || echo "DETACHED")
540:        ACTUAL_BRANCH=$(git rev-parse --abbrev-ref HEAD)
541:        if [ "$HEAD_REF" = "DETACHED" ] || echo "$ACTUAL_BRANCH" | grep -Eq '^(main|master|develop|trunk|release/.*)$'; then
542:          echo "FATAL: worktree HEAD on '$ACTUAL_BRANCH' (expected worktree-agent-*); refusing to self-recover via 'git update-ref' (#2924)." >&2
543:          exit 1
544:        fi
545:        if ! echo "$ACTUAL_BRANCH" | grep -Eq '^worktree-agent-[A-Za-z0-9._/-]+$'; then
546:          echo "FATAL: worktree HEAD '$ACTUAL_BRANCH' is not in the worktree-agent-* namespace; refusing to commit (#2924)." >&2
547:          exit 1
548:        fi
549:        ACTUAL_BASE=$(git merge-base HEAD {EXPECTED_BASE})
550:        if [ "$ACTUAL_BASE" != "{EXPECTED_BASE}" ]; then
551:          git reset --hard {EXPECTED_BASE}
552:          [ "$(git rev-parse HEAD)" != "{EXPECTED_BASE}" ] && { echo "ERROR: could not correct worktree base"; exit 1; }
553:        fi
554:        ```
555:        Per-commit HEAD/cwd-drift/path-guard: `agents/gsd-executor.md` steps 0/0a/0b + `references/worktree-path-safety.md` (in <execution_context>).
556:        </worktree_branch_check>
557: 
558:        <parallel_execution>
559:        You are running as a PARALLEL executor agent in a git worktree. Worktree path safety (cwd-drift, absolute-path guards) is in `worktree-path-safety.md` (loaded below).
560:        Run `git commit` normally — hooks run by default. Do NOT pass `--no-verify`
561:        unless the orchestrator surfaces `workflow.worktree_skip_hooks=true` in this
562:        prompt; silent bypass violates project AGENTS.md guidance (#2924).
563: 
564:        IMPORTANT: Do NOT modify STATE.md or ROADMAP.md. execute-plan.md
565:        auto-detects worktree mode (`.git` is a file, not a directory) and skips
566:        shared file updates automatically. The orchestrator updates them centrally
567:        after merge.
568: 
569:        REQUIRED: SUMMARY.md MUST be committed before you return. In worktree mode the
570:        git_commit_metadata step in execute-plan.md commits SUMMARY.md and REQUIREMENTS.md
571:        only (STATE.md and ROADMAP.md are excluded automatically). Do NOT skip or defer
572:        this commit — the orchestrator force-removes the worktree after you return, and
573:        any uncommitted SUMMARY.md will be permanently lost (#2070).
574:        REQUIRED ORDER: Write SUMMARY.md → commit → only then any narration. No text between Write and commit (truncation risk; #2070 rescue is not primary defense).
575:        </parallel_execution>
576: 
577:        <execution_context>
578:        @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-plan.md
579:        @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/summary.md
580:        @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/checkpoints.md
581:        @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/tdd.md
582:        @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/worktree-path-safety.md
583:        ${CONTEXT_WINDOW < 200000 ? '' : '@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/executor-examples.md'}
584:        </execution_context>
585: 
586:        <files_to_read>
587:        Read these files at execution start using the Read tool:
588:        - {phase_dir}/{plan_file} (Plan)
589:        - .planning/PROJECT.md (Project context — core value, requirements, evolution rules)
590:        - .planning/STATE.md (State)
591:        - .planning/config.json (Config, if exists)
592:        ${CONTEXT_WINDOW >= 500000 ? `
593:        - ${phase_dir}/*-CONTEXT.md (User decisions from discuss-phase — honors locked choices)
594:        - ${phase_dir}/*-RESEARCH.md (Technical research — pitfalls and patterns to follow)
595:        - ${prior_wave_summaries} (SUMMARY.md files from earlier waves in this phase — what was already built)
596:        ` : ''}
597:        - ./AGENTS.md (Project instructions, if exists — follow project-specific guidelines and coding conventions)
598:        - .claude/skills/ or .agents/skills/ (Project skills, if either exists — list skills, read SKILL.md for each, follow relevant rules during implementation)
599:        </files_to_read>
600: 
601:        ${AGENT_SKILLS}
602: 
603:        <mcp_tools>
604:        If AGENTS.md or project instructions reference MCP tools (e.g. jCodeMunch, context7,
605:        or other MCP servers), prefer those tools over Grep/Glob for code navigation when available.
606:        MCP tools often save significant tokens by providing structured code indexes.
607:        Check tool availability first — if MCP tools are not accessible, fall back to Grep/Glob.
608:        </mcp_tools>
609: 
610:        <success_criteria>
611:        - [ ] All tasks executed
612:        - [ ] Each task committed individually
613:        - [ ] SUMMARY.md created in plan directory
614:        - [ ] No modifications to shared orchestrator artifacts (the orchestrator handles all post-wave shared-file writes)
615:        </success_criteria>
616:      "
617:    )
618:    ```
619: 
620:    > **ORCHESTRATOR RULE — CODEX RUNTIME**: After calling Agent() above to spawn executor agent(s), stop working on this task immediately. Do not read more files, edit code, or run tests related to this task while the subagent is active. Wait for the subagent to return its result. This prevents duplicate work, conflicting edits, and wasted context. Only resume when the subagent result is available.
621: 
622:    **Sequential mode** (`USE_WORKTREES_FOR_PLAN` is `false` — either project-level `USE_WORKTREES=false`, or per-plan submodule intersection forced it false in step 2.5):
623: 
624:    Omit `isolation="worktree"` from the Agent call. Replace the `<parallel_execution>` block with:
625: 
626:    ```
627:        <sequential_execution>
628:        You are running as a SEQUENTIAL executor agent on the main working tree.
629:        Use normal git commits (with hooks). Do NOT use --no-verify.
630:        REQUIRED ORDER: Write SUMMARY.md → commit → only then any narration. No text between Write and commit (truncation risk; #2070 rescue is not primary defense).
631:        </sequential_execution>
632:    ```
633: 
634:    The sequential mode Agent prompt uses the same structure as worktree mode but with these differences in success_criteria — since there is only one agent writing at a time, there are no shared-file conflicts:
635: 
636:    ```
637:        <success_criteria>
638:        - [ ] All tasks executed
639:        - [ ] Each task committed individually
640:        - [ ] SUMMARY.md created in plan directory
641:        - [ ] STATE.md updated with position and decisions
642:        - [ ] ROADMAP.md updated with plan progress (via `roadmap update-plan-progress`)
643:        </success_criteria>
644:    ```
645: 
646:    When worktrees are disabled for a plan (per-plan or project-level), that plan's executor runs on the main working tree. If **any** plan in the current wave dropped to sequential mode, execute the affected plan(s) **one at a time** to avoid concurrent writes to the main working tree — plans in the same wave that retained worktree isolation can still run in parallel alongside the sequential ones, but two non-worktree plans in the same wave must serialize. When the project-level `USE_WORKTREES=false`, all plans in the wave serialize regardless of the `PARALLELIZATION` setting.
647: 
648: 4. **Wait for all agents in wave to complete.**
649: 
650:    **Plan-complete heartbeat (#2410):** as each executor returns (or is verified
651:    via spot-check below), emit one line — `complete` advances `{P}`, `failed`
652:    and `checkpoint` do not but still warm the stream:
653: 
654:    ```
655:    [checkpoint] phase {PHASE_NUMBER} wave {N}/{M} plan {plan_id} complete ({P}/{Q} plans done)
656:    [checkpoint] phase {PHASE_NUMBER} wave {N}/{M} plan {plan_id} failed ({P}/{Q} plans done)
657:    [checkpoint] phase {PHASE_NUMBER} wave {N}/{M} plan {plan_id} checkpoint ({P}/{Q} plans done)
658:    ```
659: 
660:    **Completion signal fallback (Copilot and runtimes where Agent() may not return):**
661: 
662:    If a spawned agent does not return a completion signal but appears to have finished
663:    its work, do NOT block indefinitely. Instead, verify completion via spot-checks:
664: 
665:    ```bash
666:    # For each plan in this wave, check if the executor finished:
667:    SUMMARY_EXISTS=$(test -f "{phase_dir}/{plan_number}-{plan_padded}-SUMMARY.md" && echo "true" || echo "false")
668:    COMMITS_FOUND=$(git log --oneline --all --grep="{phase_number}-{plan_padded}" --since="1 hour ago" | head -1)
669:    ```
670: 
671:    **If SUMMARY.md exists AND commits are found:** The agent completed successfully —
672:    treat as done and proceed to step 5. Log: `"✓ {Plan ID} completed (verified via spot-check — completion signal not received)"`
673: 
674:    **If SUMMARY.md does NOT exist after a reasonable wait:** The agent may still be
675:    running or may have failed silently. Check `git log --oneline -5` for recent
676:    activity. If commits are still appearing, wait longer. If no activity, report
677:    the plan as failed and route to the failure handler in step 6.
678: 
679:    **This fallback applies automatically to all runtimes.** Claude Code's Agent() normally
680:    returns synchronously, but the fallback ensures resilience if it doesn't.
681: 
682: 5. **Post-wave hook validation (parallel mode only):** Hooks run on every executor commit by default (#2924); this post-wave run only fires when `workflow.worktree_skip_hooks=true` opted out of per-commit hooks:
683:    ```bash
684:    SKIP_HOOKS=$(gsd-sdk query config-get workflow.worktree_skip_hooks 2>/dev/null || echo "false")
685:    if [ "$SKIP_HOOKS" = "true" ]; then
686:      # Stash uncommitted changes under a named ref so we always pop (bare `git stash` strands them on hook/script failure).
687:      STASHED=false
688:      if (! git diff --quiet || ! git diff --cached --quiet) && git stash push -u -m "gsd-post-wave-hook-$$" >/dev/null 2>&1; then STASHED=true; fi
689:      git hook run pre-commit 2>&1 || echo "⚠ Pre-commit hooks failed — review before continuing"
690:      [ "$STASHED" = "true" ] && (git stash pop >/dev/null 2>&1 || echo "⚠ Could not pop gsd-post-wave-hook stash — recover manually")
691:    fi
692:    ```
693:    If hooks fail: report the failure and ask "Fix hook issues now?" or "Continue to next wave?"
694: 
695: 5.5. **Worktree cleanup (when `isolation="worktree"` was used):**
696: 
697:    **Standard wave contract:** Each wave's worktrees merge to main via the templated path below before the next wave's worktrees fork. The cleanup loop runs once per wave at the end of the wave lifecycle. Worktrees created in wave N must be fully removed before wave N+1 forks new ones.
698: 
699:    **Cross-wave dependency deviation (supported execution mode):** When the orchestrator legitimately deviates from the standard wave model — for example, a phase with cross-wave plan dependencies that requires custom inter-worktree base-update merges (e.g., `merge: bring 09-01 + 09-02 into 09-03 base`) — the cleanup loop below is NOT automatically re-entered for those custom merges. The deviation path produces correct final history but bypasses this loop, leaving `worktree-agent-*` directories in place. Use the **cleanup-tail snippet** below to remove any residual worktrees after such a deviation.
700: 
701:    When executor agents ran in worktree isolation, their commits land on temporary branches in separate working trees. After the wave completes, merge these changes back and clean up:
702: 
703:    ```bash
704:    # List worktrees created by this wave's agents.
705:    # Inclusion-based filter (#2774): match ONLY agent-spawned worktrees under
706:    # `.claude/worktrees/agent-` (the namespace Claude Code's `isolation="worktree"`
707:    # uses). The previous exclusion filter (`grep -v "$(pwd)$"`) destroyed the parent
708:    # workspace's `.git` whenever the workspace itself was a worktree (multi-workspace
709:    # setups, and the cross-drive Windows case where `git worktree list` reports the
710:    # registry path on a different drive than `$(pwd)`).
711:    # Read line-by-line so worktree paths containing whitespace are preserved (#2774).
712:    while IFS= read -r WT; do
713:      [ -z "$WT" ] && continue
714:      # Get the branch name for this worktree
715:      WT_BRANCH=$(git -C "$WT" rev-parse --abbrev-ref HEAD 2>/dev/null)
716:      if [ -n "$WT_BRANCH" ] && [ "$WT_BRANCH" != "HEAD" ]; then
717:        CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
718: 
719:        # --- Orchestrator file protection (#1756) ---
720:        # Snapshot orchestrator-owned files BEFORE merge. If the worktree
721:        # branch outlived a milestone transition, its versions of STATE.md
722:        # and ROADMAP.md are stale. Main always wins for these files.
723:        STATE_BACKUP=$(mktemp)
724:        ROADMAP_BACKUP=$(mktemp)
725:        [ -f .planning/STATE.md ] && cp .planning/STATE.md "$STATE_BACKUP" || true
726:        [ -f .planning/ROADMAP.md ] && cp .planning/ROADMAP.md "$ROADMAP_BACKUP" || true
727: 
728:        # Snapshot list of files on main BEFORE merge to detect resurrections
729:        PRE_MERGE_FILES=$(git ls-files .planning/)
730: 
731:        # Pre-merge deletion check: warn if the worktree branch deletes tracked files
732:        DELETIONS=$(git diff --diff-filter=D --name-only HEAD..."$WT_BRANCH" 2>/dev/null || true)
733:        if [ -n "$DELETIONS" ]; then
734:          echo "BLOCKED: Worktree branch $WT_BRANCH contains file deletions: $DELETIONS"
735:          echo "Review these deletions before merging. If intentional, remove this guard and re-run."
736:          rm -f "$STATE_BACKUP" "$ROADMAP_BACKUP"
737:          continue
738:        fi
739: 
740:        # Merge the worktree branch into the current branch (--no-ff ensures a merge commit so HEAD~1 is reliable)
741:        git merge "$WT_BRANCH" --no-ff --no-edit -m "chore: merge executor worktree ($WT_BRANCH)" 2>&1 || {
742:          echo "⚠ Merge conflict from worktree $WT_BRANCH — resolve manually"
743:          echo "  STATE.md backup:   $STATE_BACKUP"
744:          echo "  ROADMAP.md backup: $ROADMAP_BACKUP"
745:          echo "  Restore with: cp \$STATE_BACKUP .planning/STATE.md && cp \$ROADMAP_BACKUP .planning/ROADMAP.md"
746:          break
747:        }
748: 
749:        # Post-merge deletion audit: detect bulk file deletions in merge commit (#2384)
750:        # --diff-filter=D HEAD~1 HEAD shows files deleted by the merge commit itself.
751:        # Exclude .planning/ — orchestrator-owned deletions there are expected (resurrections
752:        # are handled below). Require ALLOW_BULK_DELETE=1 to bypass for intentional large refactors.
753:        MERGE_DEL_COUNT=$(git diff --diff-filter=D --name-only HEAD~1 HEAD 2>/dev/null | grep -vc '^\.planning/' || true)
754:        if [ "$MERGE_DEL_COUNT" -gt 5 ] && [ "${ALLOW_BULK_DELETE:-0}" != "1" ]; then
755:          MERGE_DELETIONS=$(git diff --diff-filter=D --name-only HEAD~1 HEAD 2>/dev/null | grep -v '^\.planning/' || true)
756:          echo "⚠ BLOCKED: Merge of $WT_BRANCH deleted $MERGE_DEL_COUNT files outside .planning/ — reverting to protect repository integrity (#2384)"
757:          echo "$MERGE_DELETIONS"
758:          echo "  If these deletions are intentional, re-run with ALLOW_BULK_DELETE=1"
759:          git reset --hard HEAD~1 2>/dev/null || true
760:          rm -f "$STATE_BACKUP" "$ROADMAP_BACKUP"
761:          continue
762:        fi
763: 
764:        # Restore orchestrator-owned files (main always wins)
765:        if [ -s "$STATE_BACKUP" ]; then
766:          cp "$STATE_BACKUP" .planning/STATE.md
767:        fi
768:        if [ -s "$ROADMAP_BACKUP" ]; then
769:          cp "$ROADMAP_BACKUP" .planning/ROADMAP.md
770:        fi
771:        rm -f "$STATE_BACKUP" "$ROADMAP_BACKUP"
772: 
773:        # Detect files deleted on main but re-added by worktree merge
774:        # (e.g., archived phase directories that were intentionally removed)
775:        # A "resurrected" file must have a deletion event in main's ancestry —
776:        # brand-new files (e.g. SUMMARY.md just created by the executor) have no
777:        # such history and must NOT be removed (#2501).
778:        DELETED_FILES=$(git diff --diff-filter=A --name-only HEAD~1 -- .planning/ 2>/dev/null || true)
779:        for RESURRECTED in $DELETED_FILES; do
780:          # Only delete if this file was previously tracked on main and then
781:          # deliberately removed (has a deletion event in git history).
782:          WAS_DELETED=$(git log --follow --diff-filter=D --name-only --format="" HEAD~1 -- "$RESURRECTED" 2>/dev/null | grep -c . || true)
783:          if [ "${WAS_DELETED:-0}" -gt 0 ]; then
784:            git rm -f "$RESURRECTED" 2>/dev/null || true
785:          fi
786:        done
787: 
788:        # Amend merge commit with restored files if any changed
789:        if ! git diff --quiet .planning/STATE.md .planning/ROADMAP.md 2>/dev/null || \
790:           [ -n "$DELETED_FILES" ]; then
791:          # Only amend the commit with .planning/ files if commit_docs is enabled (#1783)
792:          COMMIT_DOCS=$(gsd-sdk query config-get commit_docs 2>/dev/null || echo "true")
793:          if [ "$COMMIT_DOCS" != "false" ]; then
794:            git add .planning/STATE.md .planning/ROADMAP.md 2>/dev/null || true
795:            git commit --amend --no-edit 2>/dev/null || true
796:          fi
797:        fi
798: 
799:        # Safety net: rescue uncommitted SUMMARY.md before worktree removal (#2070, #2838).
800:        # Filesystem-level (find + cp) bypasses git's --exclude-standard filter, which silently
801:        # drops .planning/SUMMARY.md when projects gitignore .planning/ — the rescue's prior
802:        # `git ls-files --exclude-standard` form returned empty in that case and the SUMMARY
803:        # was lost on `git worktree remove --force`.
804:        while IFS= read -r SUMMARY; do
805:          [ -z "$SUMMARY" ] && continue
806:          REL_PATH="${SUMMARY#$WT/}"
807:          if [ ! -f "$REL_PATH" ] || ! cmp -s "$SUMMARY" "$REL_PATH"; then
808:            mkdir -p "$(dirname "$REL_PATH")"
809:            cp "$SUMMARY" "$REL_PATH"
810:            echo "⚠ Rescued $REL_PATH from worktree before removal"
811:          fi
812:        done < <(find "$WT/.planning" -name "*SUMMARY.md" 2>/dev/null)
813: 
814:        # Remove the worktree
815:        if ! git worktree remove "$WT" --force; then
816:          WT_NAME=$(basename "$WT")
817:          if [ -f ".git/worktrees/${WT_NAME}/locked" ]; then
818:            echo "⚠ Worktree $WT is locked — attempting to unlock and retry"
819:            git worktree unlock "$WT" 2>/dev/null || true
820:            if ! git worktree remove "$WT" --force; then
821:              echo "⚠ Residual worktree at $WT — manual cleanup required after session exits:"
822:              echo "    git worktree unlock \"$WT\" && git worktree remove \"$WT\" --force && git branch -D \"$WT_BRANCH\""
823:            fi
824:          else
825:            echo "⚠ Residual worktree at $WT (remove failed) — investigate manually"
826:          fi
827:        fi
828: 
829:        # Delete the temporary branch
830:        git branch -D "$WT_BRANCH" 2>/dev/null || true
831:      fi
832:    done < <(git worktree list --porcelain | grep "^worktree " | grep "\.claude/worktrees/agent-" | sed 's/^worktree //')
833:    ```
834: 
835:    **Cleanup-tail snippet (use after any wave whose merges did not flow through the templated path above):**
836: 
837:    If the orchestrator deviated from the standard wave merge path (e.g., custom inter-worktree base-update merges with `merge: bring …` style messages), run this snippet after the custom merges are complete. It discovers and removes any residual `worktree-agent-*` worktrees. Safe to run when no residuals exist — it is a no-op in that case.
838: 
839:    ```bash
840:    # Cleanup-tail: remove residual agent worktrees after a cross-wave-dependency deviation.
841:    # Inclusion-based filter (#2774): match ONLY agent-spawned worktrees under
842:    # `.claude/worktrees/agent-`. Do NOT use exclusion filters (grep -v "$(pwd)$") —
843:    # they destroy the parent workspace's .git in multi-workspace or cross-drive setups.
844:    # Read line-by-line so worktree paths containing whitespace are preserved (#2774).
845:    while IFS= read -r WT; do
846:      [ -z "$WT" ] && continue
847:      WT_BRANCH=$(git -C "$WT" rev-parse --abbrev-ref HEAD 2>/dev/null)
848:      [ -z "$WT_BRANCH" ] || [ "$WT_BRANCH" = "HEAD" ] && continue
849:      echo "Cleaning up residual worktree: $WT (branch: $WT_BRANCH)"
850:      git worktree unlock "$WT" 2>/dev/null || true
851:      if ! git worktree remove "$WT" --force; then
852:        WT_NAME=$(basename "$WT")
853:        if [ -f ".git/worktrees/${WT_NAME}/locked" ]; then
854:          echo "⚠ Worktree $WT is locked — unlock failed; manual cleanup required:"
855:          echo "    git worktree unlock \"$WT\" && git worktree remove \"$WT\" --force && git branch -D \"$WT_BRANCH\""
856:        else
857:          echo "⚠ Residual worktree at $WT — remove failed; manual cleanup required"
858:        fi
859:      else
860:        git branch -D "$WT_BRANCH" 2>/dev/null || true
861:      fi
862:    done < <(git worktree list --porcelain | grep "^worktree " | grep "\.claude/worktrees/agent-" | sed 's/^worktree //')
863:    git worktree prune
864:    ```
865: 
866:    **When to skip step 5.5:**
867: 
868:    **If no plan in this wave used worktree isolation** (project-level `USE_WORKTREES=false` OR every plan in the wave had `USE_WORKTREES_FOR_PLAN=false` — i.e. `WAVE_WORKTREE_PLANS` from step 2.5 is empty): all agents ran on the main working tree — skip this step entirely.
869: 
870:    **If the orchestrator merged via custom messages (cross-wave-dependency deviation):** the templated cleanup loop above was not triggered for those merges. Run the cleanup-tail snippet above instead. After the snippet completes, proceed to step 5.6.
871: 
872:    **If at least one plan used worktrees but others did not:** still run this cleanup — it iterates over actual `git worktree list` output and only merges back the worktrees that were created, leaving sequential plans' commits on the main tree untouched.
873: 
874:    **If no worktrees found at runtime:** Skip silently — agents may have been spawned without worktree isolation, or the orchestrator already cleaned them up.
875: 
876: 5.6. **Post-merge build & test gate:**
877: 
878:    After merging all worktrees in a wave (parallel mode), or after the last plan completes
879:    (serial mode), run a build and then the project's test suite to catch cross-plan
880:    integration issues that individual worktree self-checks cannot detect (e.g., conflicting
881:    type definitions, removed exports, import changes, link errors).
882: 
883:    This addresses the Generator self-evaluation blind spot identified in Anthropic's
884:    harness engineering research: agents reliably report Self-Check: PASSED even when
885:    merging their work creates failures.
886: 
887:    Read and execute `get-shit-done/workflows/execute-phase/steps/post-merge-gate.md`.
888: 
889: 5.7. **Post-wave shared artifact update (when at least one plan used worktrees, skip if tests failed):**
890: 
891:    When **any** executor agent in this wave ran with `isolation="worktree"`, that agent skipped STATE.md and ROADMAP.md updates to avoid last-merge-wins overwrites. The orchestrator is the single writer for these files. After worktrees are merged back, update shared artifacts once for every completed plan in the wave (worktree-mode plans **and** sequential plans that ran on the main tree but deferred to the orchestrator for tracking writes).
892: 
893:    **Only update tracking when tests passed (TEST_EXIT=0).**
894:    If tests failed or timed out, skip the tracking update — plans should
895:    not be marked as complete when integration tests are failing or inconclusive.
896: 
897:    ```bash
898:    # Guard: only update tracking if post-merge tests passed
899:    # Timeout (124) is treated as inconclusive — do NOT mark plans complete
900:    if [ "${TEST_EXIT}" -eq 0 ]; then
901:      # Update ROADMAP plan progress for each completed plan in this wave
902:      for plan_id in {completed_plan_ids}; do
903:        gsd-sdk query roadmap.update-plan-progress "${PHASE_NUMBER}" "${plan_id}" "complete"
904:      done
905: 
906:      # Only commit tracking files if they actually changed
907:      if ! git diff --quiet .planning/ROADMAP.md .planning/STATE.md 2>/dev/null; then
908:        gsd-sdk query commit "docs(phase-${PHASE_NUMBER}): update tracking after wave ${N}" --files .planning/ROADMAP.md .planning/STATE.md
909:      fi
910:    elif [ "${TEST_EXIT}" -eq 124 ]; then

(Output capped at 50 KB. Showing lines 1-910. Use offset=911 to continue.)
</content>

<system-reminder>
Instructions from: /Users/apple/hivemind-plugin-private/.opencode/AGENTS.md
# Soft Meta-Concept Sector Guidance


## NON-NEGOTIABLE RULES

- all tech, stack, SDK implementation, audit, gatekeeping  must follow deep investigation - stack research ;skills are for references not for interfaces validation; "interfaces, patterns, methods, api, signatures of specs etc" must validate against the correct versions at package.json - **MUST VALIDATE AGAINST ONLINE RESOURCES AS FOR MCP SERVER TOOLS ACTUAL FETCH** - valid and evidences with Context7, Deepwiki, Gitmcp, Github repo, Exa **AND Repomix for accurate specific patterns** etc, official - loading references from skills of stacks are outdated, as so reading code in the codebase can be polluted as many implementations are not functioning and broken. DO NOT MAKE ASSUMPTIONS OF THE STACK REPO LINKs - **EXTREMELY IMPORNTANT:** Uses of Context7, Deepwiki, Gitmcp, Github, Exa, Repomix are enforced when researching, planning, and implementing - these MUST Comply with all the **Github and Npm links that up-to-date with versiosn and NOT A PRODUCT OF MAKING UP LINKS** >  glob, list this to check these links `.hivemind/STACKS-REFERENCES.md`

- any thing under .opencode/ are not shipped-with, they are symlinks or project toolings 

- all orchestrator, coordinator, conductor agents belonging to l0, and l1 classifications MUST FOCUS ON THE DELEGATIONS - NEVER Implement the tasks yourself - when delegating DO NOT SHOW THE SPECIALIST WHAT AND HOW TO IMPLEMENT - Show HOW TO PROCESS, WHAT TO EXPECT AS RESULTS, SETTING CONSTRAINTS AND BOUNDARIES, INDICATION OF CLEAR SUCCESS METRICS

- design patterns and must be obeyed strictly according to the architecture of the project.

- atomic git commit for context preservation.

- context git commit for both code implementation, docs, planning, researching, gatekeeping, verification artifacts - do not ask if commit needed

- AGENTS.md must be routinely updated - after each cycle, each batch of implementation.

- AGENTS.md are nested under dirs and subdirs, beware when maintaining them.

- files creation and structure must be registered and keep track - we love our codetree systematically structured and we **DO Registered** folders and subfolders with `.gitkeep` 

- folders must be created in a way that is easy to navigate and understand, following the best practice of this harness. Folders must be registered with gitkeep files to ensure they are tracked by git. 

- code file must JSDOC (Run JSDOC skill) documented with clear descriptions, parameters, return values, and examples. All functions and classes must be documented.

- The front facing agents must process high-level workflows, validate dependencies of tasks across sessions through faces

- The front facing agents must delegate to suagents of specialist; front facing agents are not allowed to execute any tasks

- The front facing agents are ones converse with USERS and must know the high-level tasks flow, following strict validations, gatekeeping, and coordination of the partificating frameworks

- When delegating to agents these are the list of agents that must learn and delegate to the correct ones. When delegate to subagents make sure setting up strict guardrails, boundaries, success metrics, making sure they are awared that they are subagents and fulfill the tasked within boundaries and without any deviation ans seriously go through gatekeeping.

<!-- NOTE: explore agent is MISSING from the filesystem -->

- For effective session-resume delegation (when user disconnected and there were previous aborted delegation tasks). Do not start new delegation, start the same start with **THE EXACT SESSION ID** to resume.

- The front facing agents must keep track, monitor, make sure not a single validation, verification, review steps are skips, planning , audit and verification must following format of the participated framework with honest verification and prevention of regressions. 

- **all agents** at every turn (after PER USER's prompt, **even mid-session**, after each turn), entries, shift of workflows there should be matching SKILLS that you must load, load and reload of suitable skills for the task, select ones with framework consistencies. Do not miss loading SKILLS. SKILLS are extremely important


- - **all agents** : do not confuse between the project as the harness which you are building so that users can run it with OpenCode under their projects VS. your environment of works -> meaning there are assumptions that ARE NOT ALLOWED to interprete as this sole environment but must be as wider scopes, in terms of how different projects' states, tasks types, langues, frameworks and use cases.
---
**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

Source architecture: `.planning/architecture/hivemind-source-plane-architecture-2026-05-07.md` — `.opencode/` is the Soft Meta-Concepts sector: OpenCode primitives (agents, commands, skills, rules, permissions) ONLY. No runtime state. No development implementation.

## 1. Sector purpose and lifecycle role

`.opencode/` is the Soft Meta-Concept sector: OpenCode primitives, rules, plugin loader wrappers, commands, skills, agents, permissions, and project configuration that compose runtime behavior from outside the npm package source. Source evidence: `.planning/codebase/ARCHITECTURE.md:209-245`, `.planning/codebase/STRUCTURE.md:124-129`.

Source evidence: `.planning/architecture/hivemind-runtime-identity-taxonomy-2026-05-07.md` — hm/hf/gate/stack/gsd lineages, L0-L3 hierarchy contract. `.planning/codebase/ARCHITECTURE.md:209-245` — Soft Meta-Concept layer.

## 2. Allowed mutation authority

- Agents, skills, commands, rules, permissions, and OpenCode config may be created or updated here when explicitly authorized by a meta-concept workflow.
- `.opencode/plugins/` may contain thin plugin loader wrappers that point OpenCode at built harness plugin entrypoints. Evidence: `.planning/codebase/STRUCTURE.md:157-164`.
- Primitive/config changes must preserve hm/hf/gate/stack lineage conventions and the L0→L3 delegation hierarchy. Evidence: `.planning/codebase/ARCHITECTURE.md:217-245`, `.planning/codebase/STRUCTURE.md:197-216`.
- Closest-sector deviation: no `src/config/` folder is created for primitive/config boundary guidance; this sector owns soft primitive/config placement while runtime config consumers remain in `src/`.

## 3. Forbidden mutations / explicit no-go boundaries

- `.opencode/` SHALL NOT store internal runtime state; `.hivemind/` is canonical state root. Evidence: `.planning/codebase/ARCHITECTURE.md:247-255`, `.planning/codebase/STRUCTURE.md:124-134`.
- `.opencode/` SHALL NOT be treated as development implementation, source code, or build output. It is exclusively for OpenCode primitives (agents, commands, skills, rules, permissions) that configure runtime behavior.
- `.opencode/` SHALL NOT contain business logic, state persistence, compiled code, or npm package source — those belong in `src/` (Hard Harness) and `.hivemind/` (Internal State).
- `.opencode/state/` is legacy migration-only and must not receive new internal state ownership. Evidence: `.planning/codebase/STRUCTURE.md:295-299`.
- Do not blur hm/hf/gate/stack lineages or ship gsd-* internal developer tooling as product primitives. Evidence: `.planning/codebase/ARCHITECTURE.md:217-233`, `.planning/codebase/STRUCTURE.md:209-216`.
- Do not edit runtime TypeScript implementation here; runtime source authority remains in `src/`.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| OpenCode runtime | Discovers project config, plugin loader, commands, agents, skills, and rules | Runtime state still belongs in `.hivemind/` |
| hm-* lineage agents/skills | Product-dev workflows and specialists | STRICT lineage; no hf-* skill loading by hm-* unless explicitly routed |
| hf-* lineage agents/skills | Meta-concept authoring/building | May modify primitives only under meta-builder authorization |
| gate-* skills | Internal quality gate triad | Project-only quality gates, not shipped as generic product claims |
| stack-* skills | Framework/reference knowledge | Reference only, not implementation authority |
| `src/` Hard Harness tools | Configured through `.opencode/` primitives (agents call tools, commands route to agents) | Never imports from `.opencode/` — reads only through OpenCode SDK |

## 5. Naming and placement conventions

- Agent files use `hm-*`, `hf-*`, or `gsd-*` prefixes according to lineage; skills use `hm-*`, `hf-*`, `gate-*`, `stack-*`, or `gsd-*` prefixes. Evidence: `.planning/codebase/STRUCTURE.md:197-216`.
- Runtime skill location is `.opencode/skills/`; meta-builder source-of-truth is `.hivefiver-meta-builder/skills-lab/` and reflected to `.opencode/skills/`. Evidence: `.planning/codebase/ARCHITECTURE.md:209-215`.
- New agents, skills, and commands should originate from the meta-builder source areas before reflection to `.opencode/`. Evidence: `.planning/codebase/STRUCTURE.md:241-254`.
- Commands use OpenCode command files under `.opencode/commands/`; do not invent parallel command roots.

## 6. Quality gates and evidence expectations

- Primitive changes require discoverability validation, lineage validation, and restart/compile checks when applicable; docs-only edits here are not runtime proof.
- Do not claim permission enforcement, registry completeness, or runtime routing readiness when requirements still mark them missing/partial. Evidence: `.planning/REQUIREMENTS.md:42-56`, `.planning/PROJECT.md:29-42`.
- O3 docs-only guidance remains L5 evidence and cannot change runtime readiness. Evidence: `.planning/ROADMAP.md:47-49`.

## 7. Cross-sector alignment

- **Hard Harness (`src/`):** Runtime implementation. Compiles to dist/. Calls OpenCode SDK. Does not depend on `.opencode/` at build time.
- **Internal State (`.hivemind/`):** Durable persistence. Owned by `src/` modules through tool/hook CQRS boundaries. Canonical per Q6.
- **Meta-Authoring (`.hivefiver-meta-builder/`):** Source-of-truth for primitive authoring. Reflected to `.opencode/` via symlink or sync.
- **Governance (`.planning/`):** Documents architecture, provides phase authorization. Does not mutate `.opencode/`.
- **OMO Adaptation:** Per `.planning/research/omo-adaptation-architecture-2026-05-07.md`, OMO folder roots (`.sisyphus`, `.omx`) are REJECTED; `.opencode/` remains primitives-only.

</system-reminder>
Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/ui-brand.md"}
<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/ui-brand.md</path>
<type>file</type>
<content>
1: <ui_patterns>
2: 
3: Visual patterns for user-facing GSD output. Orchestrators @-reference this file.
4: 
5: ## Stage Banners
6: 
7: Use for major workflow transitions.
8: 
9: ```
10: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
11:  GSD ► {STAGE NAME}
12: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
13: ```
14: 
15: **Stage names (uppercase):**
16: - `QUESTIONING`
17: - `RESEARCHING`
18: - `DEFINING REQUIREMENTS`
19: - `CREATING ROADMAP`
20: - `PLANNING PHASE {N}`
21: - `EXECUTING WAVE {N}`
22: - `VERIFYING`
23: - `PHASE {N} COMPLETE ✓`
24: - `MILESTONE COMPLETE 🎉`
25: 
26: ---
27: 
28: ## Checkpoint Boxes
29: 
30: User action required. 62-character width.
31: 
32: ```
33: ╔══════════════════════════════════════════════════════════════╗
34: ║  CHECKPOINT: {Type}                                          ║
35: ╚══════════════════════════════════════════════════════════════╝
36: 
37: {Content}
38: 
39: ──────────────────────────────────────────────────────────────
40: → {ACTION PROMPT}
41: ──────────────────────────────────────────────────────────────
42: ```
43: 
44: **Types:**
45: - `CHECKPOINT: Verification Required` → `→ Type "approved" or describe issues`
46: - `CHECKPOINT: Decision Required` → `→ Select: option-a / option-b`
47: - `CHECKPOINT: Action Required` → `→ Type "done" when complete`
48: 
49: ---
50: 
51: ## Status Symbols
52: 
53: ```
54: ✓  Complete / Passed / Verified
55: ✗  Failed / Missing / Blocked
56: ◆  In Progress
57: ○  Pending
58: ⚡ Auto-approved
59: ⚠  Warning
60: 🎉 Milestone complete (only in banner)
61: ```
62: 
63: ---
64: 
65: ## Progress Display
66: 
67: **Phase/milestone level:**
68: ```
69: Progress: ████████░░ 80%
70: ```
71: 
72: **Task level:**
73: ```
74: Tasks: 2/4 complete
75: ```
76: 
77: **Plan level:**
78: ```
79: Plans: 3/5 complete
80: ```
81: 
82: ---
83: 
84: ## Spawning Indicators
85: 
86: ```
87: ◆ Spawning researcher...
88: 
89: ◆ Spawning 4 researchers in parallel...
90:   → Stack research
91:   → Features research
92:   → Architecture research
93:   → Pitfalls research
94: 
95: ✓ Researcher complete: STACK.md written
96: ```
97: 
98: ---
99: 
100: ## Next Up Block
101: 
102: Always at end of major completions.
103: 
104: ```
105: ───────────────────────────────────────────────────────────────
106: 
107: ## ▶ Next Up
108: 
109: **{Identifier}: {Name}** — {one-line description}
110: 
111: `/clear` then:
112: 
113: `{copy-paste command}`
114: 
115: ───────────────────────────────────────────────────────────────
116: 
117: **Also available:**
118: - `/gsd-alternative-1` — description
119: - `/gsd-alternative-2` — description
120: 
121: ───────────────────────────────────────────────────────────────
122: ```
123: 
124: ---
125: 
126: ## Error Box
127: 
128: ```
129: ╔══════════════════════════════════════════════════════════════╗
130: ║  ERROR                                                       ║
131: ╚══════════════════════════════════════════════════════════════╝
132: 
133: {Error description}
134: 
135: **To fix:** {Resolution steps}
136: ```
137: 
138: ---
139: 
140: ## Tables
141: 
142: ```
143: | Phase | Status | Plans | Progress |
144: |-------|--------|-------|----------|
145: | 1     | ✓      | 3/3   | 100%     |
146: | 2     | ◆      | 1/4   | 25%      |
147: | 3     | ○      | 0/2   | 0%       |
148: ```
149: 
150: ---
151: 
152: ## Anti-Patterns
153: 
154: - Varying box/banner widths
155: - Mixing banner styles (`===`, `---`, `***`)
156: - Skipping `GSD ►` prefix in banners
157: - Random emoji (`🚀`, `✨`, `💫`)
158: - Missing Next Up block after completions
159: 
160: </ui_patterns>

(End of file - total 160 lines)
</content>

### Tool: skill

**Input:**
```json
{
  "name": "gsd-execute-phase"
}
```

**Output:** (pruned)
```
# Skill: gsd-execute-phase
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-02-PLAN.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-03-PLAN.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-04-PLAN.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-01-PLAN.md"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "toolu_28d86e62a19a47548734a2d5"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "toolu_966f214bd1b34af4898e69b1"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "toolu_63fffa0956cc49d5b2ec216a"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "toolu_f47dd46c83624a29b13256ce"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "toolu_43ceaa27cbbd4fd883f05e6a"
}
```


## USER (turn 2)

**source:** real-human

check plans  @gsd-plan-checker 
 Use the above message and context to generate a prompt and call the task tool with subagent: gsd-plan-checker

### Tool: task

**Input:**
```json
{
  "description": "Check Phase 14 plan quality before execution",
  "subagent_type": "gsd-plan-checker",
  "task_id": "ses_1c314d4bcffenMSCYwo45Zk52m"
}
```

**Output:** (pruned)
```
task_id: ses_1c314d4bcffenMSCYwo45Zk52m
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-RESEARCH.md"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "toolu_90f5f4f64fc04b92b4c74896"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "toolu_67cd2a4087ca49ef89c53afa"
}
```


### Tool: task

**Input:**
```json
{
  "description": "Execute Phase 14 Plan 01 - TDD dispatch wiring",
  "subagent_type": "gsd-executor",
  "task_id": "ses_1c3112991ffe8Iucr25MKJbttz"
}
```

**Output:** (pruned)
```
task_id: ses_1c3112991ffe8Iucr25MKJbttz
```


### Tool: task

**Input:**
```json
{
  "description": "Execute Phase 14 Plan 01 - TDD dispatch wiring (sequential)",
  "subagent_type": "gsd-executor",
  "task_id": "ses_1c310665effeXbluoQ0NSm5ZiA"
}
```

**Output:** (pruned)
```
task_id: ses_1c310665effeXbluoQ0NSm5ZiA
```


### Tool: bash

**Input:**
```json
{
  "callID": "toolu_fe4b30b8ea354ca3a7a9612b"
}
```


### Tool: task

**Input:**
```json
{
  "description": "Execute Phase 14 Plan 02 - Monitor/notification behavior",
  "subagent_type": "gsd-executor",
  "task_id": "ses_1c307b9e0ffesj9UyHYbiFZvy3"
}
```

**Output:** (pruned)
```
task_id: ses_1c307b9e0ffesj9UyHYbiFZvy3
```


### Tool: bash

**Input:**
```json
{
  "callID": "toolu_7830e069da0840dea295fe3a"
}
```


### Tool: task

**Input:**
```json
{
  "description": "Fix Phase 14 full test failures",
  "subagent_type": "gsd-code-fixer",
  "task_id": "ses_1bff11717ffegM0c0TJKSumPdA"
}
```

**Output:** (pruned)
```
task_id: ses_1bff11717ffegM0c0TJKSumPdA
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_RKVjijZPPBjsiWsMiVhspk2a"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_pXsxRe8RdG68zJoMIsBWrou9"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_n66S6jvsFmKAUPOYMvRqQuKD"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_mrOtyQqt9W9Q53mkJM11VNwe"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_MOnQjL6aT18Bu0IDOd0CPucS"
}
```


### Tool: skill

**Input:**
```json
{
  "name": "gate-l3-evidence-truth"
}
```

**Output:** (pruned)
```
# Skill: gate-l3-evidence-truth
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_gtaZ8ZTt6T98Rv2AjnhKBux3"
}
```


## USER (turn 3)

**source:** real-human

tôi đã thử và đã xảy ra lỗi trầm trọng xuất hiện heavy spam cho system_reminder vừa sai mục đích (chỉ xuất hiện khi task hoàn thành hoặc phát hiện task lỗi) vừa sai tần xuất và cách xuất hiện (đối với 60s - 90s - 120s - 180s và 300s này là dạng ịnjection vào context trực tiếp không require responses chứ không phải dạng append vào tui - dạng append vào tui chỉ khi task thật sự fail và/hoặc task hoàn thành  '/Users/apple/hivemind-plugin-private/session-ses_1bfe.md' 

## USER (turn 4)

**source:** real-human

tôi đã thử và đã xảy ra lỗi trầm trọng xuất hiện heavy spam cho system_reminder vừa sai mục đích (chỉ xuất hiện khi task hoàn thành hoặc phát hiện task lỗi) vừa sai tần xuất và cách xuất hiện (đối với 60s - 90s - 120s - 180s và 300s này là dạng ịnjection vào context trực tiếp không require responses chứ không phải dạng append vào tui - dạng append vào tui chỉ khi task thật sự fail và/hoặc task hoàn thành  '/Users/apple/hivemind-plugin-private/session-ses_1bfe.md' 

## USER (turn 5)

**source:** real-human

tôi đã thử và đã xảy ra lỗi trầm trọng xuất hiện heavy spam cho system_reminder vừa sai mục đích (chỉ xuất hiện khi task hoàn thành hoặc phát hiện task lỗi) vừa sai tần xuất và cách xuất hiện (đối với 60s - 90s - 120s - 180s và 300s này là dạng ịnjection vào context trực tiếp không require responses chứ không phải dạng append vào tui - dạng append vào tui chỉ khi task thật sự fail và/hoặc task hoàn thành  '/Users/apple/hivemind-plugin-private/session-ses_1bfe.md' 

### Tool: skill

**Input:**
```json
{
  "name": "systematic-debugging"
}
```

**Output:** (pruned)
```
# Skill: systematic-debugging
```


### Tool: skill

**Input:**
```json
{
  "name": "hivemind-power-on"
}
```

**Output:** (pruned)
```
# Skill: hivemind-power-on
```


### Tool: skill

**Input:**
```json
{
  "name": "hm-l2-debug"
}
```

**Output:** (pruned)
```
# Skill: hm-l2-debug
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_ZLrIdaBpmeOePhQVvqAYIfyq"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_S3JGnW0ToccAu6VIbfQAEW3U"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_5ljuXULTcx3wqGTYEmUANFx2"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_fWW8cEfw5zvE3r9UH7Yppy0f"
}
```


### Tool: task

**Input:**
```json
{
  "description": "Diagnose system_reminder spam",
  "subagent_type": "gsd-debugger",
  "task_id": "ses_1bfd7f337ffeIcrrBCqE6aqD7J"
}
```

**Output:** (pruned)
```
task_id: ses_1bfd7f337ffeIcrrBCqE6aqD7J
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_4NU0Nu2prEER1tYZLiwrbdYF"
}
```


### Tool: task

**Input:**
```json
{
  "description": "Fix terminal-only notifications",
  "subagent_type": "gsd-code-fixer",
  "task_id": "ses_1bfd4668affevjCGYVt0ISHrdB"
}
```

**Output:** (pruned)
```
task_id: ses_1bfd4668affevjCGYVt0ISHrdB
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/plugin.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/coordination/delegation/coordinator.ts"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_976O46O5ipjmnWSLBtw86lkx"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_YFHe6oihye4he1tDQqtVg7aw"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/plugin.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/coordination/delegation/notification-router.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/tests/lib/coordination/delegation/notification-router.test.ts"
}
```


### Tool: apply_patch

**Input:**
```json
{
  "callID": "call_BX39Yty2w7yzogImluA7lUOW"
}
```


### Tool: apply_patch

**Input:**
```json
{
  "callID": "call_12nMmP5xWlVKIQTOBDSpPG3P"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_4nkdVYCRChVYtIzPwSPHPGTn"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_zDwyiTIZmze9UPjI2QEd8yJp"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-REVIEW-FIX-2026-05-19.md"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_zBjL6HEWSbOouCQZZnHv6ORU"
}
```


### Tool: apply_patch

**Input:**
```json
{
  "callID": "call_MXWPIFRkt82XfIuMROkmtJ93"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_eHDlW3BJE9gTenCLfqivi7UU"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_jZyeIhcdawIDaH5wjEWVeAIF"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_XvsapqHGitftF1kfeOUoxY2o"
}
```


## USER (turn 6)

**source:** real-human

commit mandate - Atomic commits are mandatory. You must follow the atomic commit rule: **One logical change = One commit**. Do not bundle multiple unrelated changes into a single commit. If a change is large, break it down into smaller, atomic commits with meaningful messages. Every commit must pass validation (typecheck, tests, gatekeeping) and be atomic, preventing any partial build or test failure states. Commit even the documents changes 

## USER (turn 7)

**source:** real-human

commit mandate - Atomic commits are mandatory. You must follow the atomic commit rule: **One logical change = One commit**. Do not bundle multiple unrelated changes into a single commit. If a change is large, break it down into smaller, atomic commits with meaningful messages. Every commit must pass validation (typecheck, tests, gatekeeping) and be atomic, preventing any partial build or test failure states. Commit even the documents changes 

## USER (turn 8)

**source:** real-human

hãy xem là các phần sửa trên bao gồm toàn bộ các code đã implemented cho phase 14 này ```/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/.gitkeep
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-01-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-01-SUMMARY.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-02-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-02-SUMMARY.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-03-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-03-SUMMARY.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-04-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-04-SUMMARY.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-CONTEXT.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-DEPRECATED-DELEGATION-CLEANUP-AUDIT.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-DIRTY-WORKTREE-SNAPSHOT.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-LIVE-UAT-CHECKLIST.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-PATTERNS.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-RESEARCH.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-REVIEW-FIX-2026-05-19.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-SPEC.md
/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-VALIDATION.md ``` so với yêu cầu ban đầu của tôi cho toàn phase này ```nhưng hệ thống đã có các cơ chế như xác định đã executed thành công ?

( qua việc agents được delegated trả về first tool calls bao gồm innate tools, bash, commands, skills etc , child sessions ID được ghi nhận  và trong vòng một giới hạn thời gian cho phép là 60s các  tín hiệu trên không ghi nhận được tức là session delegated đã fail và phải delegate lại) và các logics build theo sau nó qua tools dành cho agent sử dụng delegate-task bao gồm như

- khi xác nhận pha là delegate-task đã chạy thì bộ hẹn giờ và polling phải là theo pha và chủ động (30s - 45s -60s - 90s - 120s - 180s ) các bộ đếm này sẽ ghi lại một thin line session id và delegated agent  với status và bộ đếm tools, bash, skill, actions -nhằm đưa thông tin kịp thời một cách tinh gọn và minimal nhất có thể thông báo cho main agents biết là các sessions vẫn đang chạy → là các injection vào context của session đang diễn ra để nhắc delegator agent poll status và kiểm tra kết quả thật một cách deterministically  → từ đó delegator main agents vẫn có thể rảnh tay để làm các tác vụ khác mà không phải bận tập đưa ra hẹn giờ check lại. Điểm chính của delegate-task là thực hiện async delegation có kiểm soát trong khi vẫn điều phối được luồng hoạt động chính với users và dùng OpenCode innate task tool delegation khi muốn các delegation có hệ thống và kiểm soát trình tự hơn
    - thêm vào đó các kiến thức từ việc xây dựng session-tracker có thể đưa áp dụng  vào đây cho việc tracking chính xác
    - ở logic về thời gian ở mức 60s là mức fallback và ghi nhận failure nếu không có action nào xảy ra → tiếp tục ở mức 120s là mức failure thứ 2 nếu so với mức 1 không có action mới nào được ghi nhận → tương tự như vậy ở 180s là hard failure lần 3 nếu so với mức 2 không có action nào mới được ghi nhận → 300s là hard failure lần 4 và là lần cuối cùng (5 phút) sau lần này thì khôg tiếp tục ịnjection thông tin vào context của main session để thông báo cho main agent nữa - tức là nếu tools vẫn ghi nhận và vẫn chạy thì tiếp theo sẽ dựa vào hệ thống ghi nhận kết quả tự động bên dưới
    - Cơ chế thông báo và gi nhận kết quả delegation: đây cũng là một cơ chế chủ động với 3 logics
        - session sẽ ghi nhận hoàn thành chỉ khi đủ các điều kiện sau đây
            - có tools ghi nhận chạy ở phía trên và chạy được trên 1 phút
            - agents last message output (còn gọi là assistant last message) đây là tổng kết và report thông tin mà agent dùng tools và các công cụ sau phiên delegation được giao, nó tổng hợp lại các kết qả
            - cuối cùng là phần tuỳ thuộc - tức là đối với các task đòi hỏi tạo file, modify, hay move, mutate files, hay artifact documents gì đó thì phải ghi nhận file changes ra sao
        - khi thành công thì sẽ đưa một thông báo tóm tăt - ghi nhận là block thông báo kết quả của phiên delegation … task …. tóm tắt ….result… path…. được đọc tại… timestamp - file changes:…. - đây là một message sẽ append trực tiếp vào TUI message và tuỳ vào trạng thái của session lúc đó nếu main session còn live nó sẽ append trực tiếp không qua xếp hàng (nó phải có header thông báo đây là hệ thống nhắc của delegate-task tự động từ system) - còn nếu session đã end stream nó sẽ gởi message đi và resume session
        - session sẽ ghi nhận status failure với các trường hợp sau
            - các ngưỡng 4 lần phía trên fail
            - sau pass ngưỡng 4 tức 300s mà vẫn đang chay và chờ thêm 300s nữa (tức 10 phút) mà vẫn không có trả về kết quả cuối cùng tức ghi nhận assistant last message thì sẽ ghi nhận là fail nhưng với 2 cấp khác nhau
        - Session fail sẽ ghi nhận theo 2 cấp là đã executed - running và fail vs. fail từ ngưỡng một phần thông báo này sẽ là thông tin để mà agents lựa chọn sử dụng các tools phù hợp phía dưới
        - delegate-task có thể delegate cùng một lúc cho phép tới 10 phiên - 10 slots này quản lý theo từng main session và khi trả thông báo về nó cũng phải ghi nhận thông báo append TUI message vào đúng session đó để tránh trường hợp users đang vận hành một main session song song không liên quan mà các phiên này lại đi lạc vào
    - Cần phải nghĩ nhiều hơn nữa về tools các tools thuộc nhóm này phải bao gồm cả các tools hoặc arguments để có thể làm các việc sau
        - abort/cancel và restart và điều chỉnh prompt, thay đổi agents
        - đồng thời như trên đối với các session đã có tools ghi nhận chạy rồi và chạy đúng với OpenCode SDK thì không việc gì phải delegate lại một phiên hoàn toàn mới thay vào đó việc resume lại một phiên (miễn là có session id) là hoàn toàn khả thi và với một knowledge là một khi đã xác nhận mức 1 thành công tức session đã chạy → thì mặc định delegator có thể resume với prompt đơn giản và thâm chí thay đổi agent name nhưng các context phía trên nó đều được bảo tồn (điều này delegator agent không nhận biết được nhưng tool cần thiết kế ra cho mục đích như vậy nó ghi nhận session và hướng dẫn delegator agent resume với prompt đơn giản mà không phải lặp lại trừ khi muốn thay đổi điều hướng khác đi
        - chức năng phía trên cũng có thể mở rộng ra cho việc quản lý delegation tasks - cụ thể hơn là completed delegated tasks - orchestrator, coordinator (tức nhóm l0 và l1, cũng như agent mặc định build)  và delegator hoàn toàn có thể chủ động tạo một task mới nối tiếp các completed task b ằng cách sử dụng lại session id cũ → việc này giúp nhiệm vụ mới có được context của nhiệm vụ cũ mà main agents l0 và l1 không phải diễn dãi ra hoặc hallucinate đưa một thông tin không liên quan tới những gì mà task trước đó tìm kiếm

Để làm được điều trên nghiên cứu thật kỹ các methods, client-server architecture của OpenCode API và SDK (nhất là phần liên quan tới messages, sessions, paths, projects, tools, commands, instances, files etc) và các hooks ứng dụng của OpenCode Plugins SDK đồng thời là source-code cuả OpenCode platform để hiểu được architecture của nó vận hành ra sao cho các nhóm primitives, tools, custom tools, commands, agent skills, mcp server tools agents vs subagents mode: all, primary, subagent - đồng thời permissions khi regex cho granularity control và sự thừa hưởng permissions giữa main và sub agents và ; các functions để detect what agents that users have in store (vì agents được chứa ở rất nhiều nơi từ opencode.json, cho tới .opencode/agent(s) (ở đây lấy cả số ít và số nhiều và có thêm việc các primitives này ngoài tồn tại ở project còn tồn tại ở gloabal) - xử lý các edge casés như compacts survival khi mà delegation context windows bị tràn 

---

Dựa trên dữ liệu thật thử nghiệm tại đây (/Users/apple/hivemind-plugin-private/session-ses_1c50.md - hãy đọc toàn bộ grep và glob theo meta delegate vì đây là session dài và chi tiết phải đọc và hiểu kỹ để thấy được gáps và flaws trong thiết kế - ở đây cuối cùng research article vẫn được tạo nhưng sau khi main agent đã endstream và ngay cả như thế theo logic đã ghi phía trên sẽ phải có một system message prompt dạng thông báo append vào TUI và send tới main session để tiếp tục stream)  dọn dẹp các logics, các code files liên quan (và cả test) đã deprecated và gây confusions cục bộ  (kiểm tra cả khu vự tools, share, features lẫn coordination, delegation, task mà có liên quan tới feature delegate-task cần xác định rõ nhiệm vụ của delegate-task là gì để không chồng chéo và nhầm lẫn với OpenCode native task tool delegation và các background command  hoặc các liên quan tới PTY interactive command nhắc lại delegate-task là sử dụng hoàn toàn OpenCode SDK và các interfaces để orchestrate tasks với toàn bộ quyền permissions, tools, và các primitives của OpenCode integrated một cách toàn diện - nói như thế ưu điểm của delegate-task vs. native task tool là việc cho phép agents delegate tasks nhưng được trang bị bộ nhắc tự động và chủ động như đã nêu ở trên, giúp cho agent ở foreground hoàn toàn chủ động thực hiện các tác vụ tiếp theo  → đánh giá specs yêu cầu phái trên  kiểm tra xem các điều sau đây có thật sự là khả thi

- tạo task với child session với id và thừa hưởng đúng các quyền của agent delegated và trả đúng thông báo về session mẹ
- các injections và các ngưỡng fail, ghi nhận tools và executions thật cụ thể như phía trên đã thực hiện được hay chưa → bổ sung để đảm bảo các ịnjection này hoạt động hãy thêm vào TUI toast thông báo (in English) khi các injection nãy được thực hiện và ghi ra n ó đã inject nội dung thế nào
- các thiết kế tools có đúng như tôi đã miêu tả ở phía trên
- các logics và ngưỡng fail cũng như thiết kế chặt chẽ theo SDK có đúng như phía trên yêu cầu?

Hãy tiếp tục khắc phục bằng cách tạo gaps plannings với các nghiên cứu mới, specs bổ sung, context bổ sung route GSD để khắc phục đày đủ và đúng như những gì tôi yêu cầu ``` >>>> đã đúng specs, không conflict, có gaps hay flaws nào không phân tích kỹ để bước tiếp theo tôi sẽ thực hiện live-testing và tôi không muốn những lỗi sai cơ bản về logics hay có sự chồng chéo về các chức năng liên quan đến task tool (là native delegation của OpenCode) với delegate-task và các tools phụ trợ cho nó cũng như các mục khác như background-command; interactive-command, pty-command hay slash-command đây đều là những chức năng riêng biệt lẫn nhau không thể nhầm lẫn và chồng chéo

### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-SPEC.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-CONTEXT.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-VALIDATION.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/coordination/delegation/monitor.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/coordination/delegation/notification-router.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/coordination/delegation/manager.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/coordination/delegation/completion-detector.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/coordination/delegation/escalation-timer.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/coordination/delegation/coordinator.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/coordination/delegation/manager-runtime.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/coordination/delegation/types.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/tools/delegation/delegate-task.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/session-ses_1c50.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/plugin.ts"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_02_5qCBhCQCENJiwyGnc3QO7391"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/plugin.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/tools/delegation/delegation-status.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/coordination/delegation/notification-formatter.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/coordination/delegation/slot-manager.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/coordination/delegation/dispatcher.ts"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_02_t8CP6uZ0wWOXD00hHWHo1544"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/session-ses_1c50.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/session-ses_1c50.md"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_1H2h9PTEUjlCpIuMBUT43942"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_brl0mQM4UiCr0kbxKcLA3583"
}
```


### Tool: write

**Input:**
```json
{
  "callID": "call_00_R5xZ0ngmvbhtJA0mINaG1608"
}
```


## USER (turn 9)

**source:** real-human

hãy tự dùng execute-slash-command để thêm vào phase 15 theo gsd, rồi sau đó tạo gsd-spec-phase cho phase này, tiếp theo là context rồi sau đó là research

### Tool: hivemind-command-engine

**Input:**
```json
{
  "callID": "call_00_05FUZxUOedk7uWR4TAXr0934"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_00_kUImlqdFSOqXu8qHH3pV9220"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_00_xQfnBn79uogq6rCWZmHE6988"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/commands"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/command"
}
```


### Tool: execute-slash-command

**Input:**
```json
{
  "callID": "call_00_wrajaV9t2f1eFRgYjwsT5922"
}
```


## USER (turn 10)

**source:** real-human

<objective>
Manage phases in ROADMAP.md with a single consolidated command.

Mode routing:
- **default** (no flag): Add a new integer phase to the end of the current milestone → add-phase workflow
- **--insert**: Insert urgent work as a decimal phase (e.g., 72.1) between existing phases → insert-phase workflow
- **--remove**: Remove a future phase and renumber subsequent phases → remove-phase workflow
- **--edit**: Edit any field of an existing phase in place → edit-phase workflow
</objective>

<routing>

| Flag | Action | Workflow |
|------|--------|----------|
| (none) | Add new integer phase at end of milestone | add-phase |
| --insert | Insert decimal phase (e.g., 72.1) after specified phase | insert-phase |
| --remove | Remove future phase, renumber subsequent | remove-phase |
| --edit | Edit fields of existing phase in place | edit-phase |

</routing>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/add-phase.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/insert-phase.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/remove-phase.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/edit-phase.md
</execution_context>

<context>
Arguments: add "Phase 15: Delegate-Task Gap Remediation — Resume, Delivery, Rich Notifications"

Parse the first token of add "Phase 15: Delegate-Task Gap Remediation — Resume, Delivery, Rich Notifications":
- If it is `--insert`: strip the flag, pass remainder (format: <after-phase-number> <description>) to insert-phase workflow
- If it is `--remove`: strip the flag, pass remainder (phase number) to remove-phase workflow
- If it is `--edit`: strip the flag, pass remainder (phase-number [--force]) to edit-phase workflow
- Otherwise: pass all of add "Phase 15: Delegate-Task Gap Remediation — Resume, Delivery, Rich Notifications" (phase description) to add-phase workflow

Roadmap and state are resolved in-workflow via `init phase-op` and targeted reads.
</context>

<process>
1. Parse the leading flag (if any) from add "Phase 15: Delegate-Task Gap Remediation — Resume, Delivery, Rich Notifications".
2. Load and execute the appropriate workflow end-to-end based on the routing table above.
3. Preserve all validation gates from the target workflow.
</process>
Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/add-phase.md"}
<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/add-phase.md</path>
<type>file</type>
<content>
1: <purpose>
2: Add a new integer phase to the end of the current milestone in the roadmap. Automatically calculates next phase number, creates phase directory, and updates roadmap structure.
3: </purpose>
4: 
5: <required_reading>
6: Read all files referenced by the invoking prompt's execution_context before starting.
7: </required_reading>
8: 
9: <process>
10: 
11: <step name="parse_arguments">
12: Parse the command arguments:
13: - All arguments become the phase description
14: - Example: `/gsd-add-phase Add authentication` → description = "Add authentication"
15: - Example: `/gsd-add-phase Fix critical performance issues` → description = "Fix critical performance issues"
16: 
17: If no arguments provided:
18: 
19: ```
20: ERROR: Phase description required
21: Usage: /gsd-add-phase <description>
22: Example: /gsd-add-phase Add authentication system
23: ```
24: 
25: Exit.
26: </step>
27: 
28: <step name="init_context">
29: Load phase operation context:
30: 
31: ```bash
32: INIT=$(gsd-sdk query init.phase-op "0")
33: if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
34: ```
35: 
36: Check `roadmap_exists` from init JSON. If false:
37: ```
38: ERROR: No roadmap found (.planning/ROADMAP.md)
39: Run /gsd-new-project to initialize.
40: ```
41: Exit.
42: </step>
43: 
44: <step name="add_phase">
45: **Delegate the phase addition to `gsd-sdk query phase.add`:**
46: 
47: ```bash
48: RESULT=$(gsd-sdk query phase.add "${description}")
49: ```
50: 
51: The CLI handles:
52: - Finding the highest existing integer phase number
53: - Calculating next phase number (max + 1)
54: - Generating slug from description
55: - Creating the phase directory (`.planning/phases/{NN}-{slug}/`)
56: - Inserting the phase entry into ROADMAP.md with Goal, Depends on, and Plans sections
57: 
58: Extract from result: `phase_number`, `padded`, `name`, `slug`, `directory`.
59: </step>
60: 
61: <step name="update_project_state">
62: Update STATE.md to reflect the new phase:
63: 
64: 1. Read `.planning/STATE.md`
65: 2. Under "## Accumulated Context" → "### Roadmap Evolution" add entry:
66:    ```
67:    - Phase {N} added: {description}
68:    ```
69: 
70: If "Roadmap Evolution" section doesn't exist, create it.
71: </step>
72: 
73: <step name="completion">
74: Present completion summary:
75: 
76: ```
77: Phase {N} added to current milestone:
78: - Description: {description}
79: - Directory: .planning/phases/{phase-num}-{slug}/
80: - Status: Not planned yet
81: 
82: Roadmap updated: .planning/ROADMAP.md
83: 
84: ---
85: 
86: ## ▶ Next Up — [${PROJECT_CODE}] ${PROJECT_TITLE}
87: 
88: **Phase {N}: {description}**
89: 
90: `/clear` then:
91: 
92: `/gsd-plan-phase {N}`
93: 
94: ---
95: 
96: **Also available:**
97: - `/gsd-add-phase <description>` — add another phase
98: - Review roadmap
99: 
100: ---
101: ```
102: </step>
103: 
104: </process>
105: 
106: <success_criteria>
107: - [ ] `gsd-sdk query phase.add` executed successfully
108: - [ ] Phase directory created
109: - [ ] Roadmap updated with new phase entry
110: - [ ] STATE.md updated with roadmap evolution note
111: - [ ] User informed of next steps
112: </success_criteria>

(End of file - total 112 lines)
</content>

<system-reminder>
Instructions from: /Users/apple/hivemind-plugin-private/.opencode/AGENTS.md
# Soft Meta-Concept Sector Guidance


## NON-NEGOTIABLE RULES

- all tech, stack, SDK implementation, audit, gatekeeping  must follow deep investigation - stack research ;skills are for references not for interfaces validation; "interfaces, patterns, methods, api, signatures of specs etc" must validate against the correct versions at package.json - **MUST VALIDATE AGAINST ONLINE RESOURCES AS FOR MCP SERVER TOOLS ACTUAL FETCH** - valid and evidences with Context7, Deepwiki, Gitmcp, Github repo, Exa **AND Repomix for accurate specific patterns** etc, official - loading references from skills of stacks are outdated, as so reading code in the codebase can be polluted as many implementations are not functioning and broken. DO NOT MAKE ASSUMPTIONS OF THE STACK REPO LINKs - **EXTREMELY IMPORNTANT:** Uses of Context7, Deepwiki, Gitmcp, Github, Exa, Repomix are enforced when researching, planning, and implementing - these MUST Comply with all the **Github and Npm links that up-to-date with versiosn and NOT A PRODUCT OF MAKING UP LINKS** >  glob, list this to check these links `.hivemind/STACKS-REFERENCES.md`

- any thing under .opencode/ are not shipped-with, they are symlinks or project toolings 

- all orchestrator, coordinator, conductor agents belonging to l0, and l1 classifications MUST FOCUS ON THE DELEGATIONS - NEVER Implement the tasks yourself - when delegating DO NOT SHOW THE SPECIALIST WHAT AND HOW TO IMPLEMENT - Show HOW TO PROCESS, WHAT TO EXPECT AS RESULTS, SETTING CONSTRAINTS AND BOUNDARIES, INDICATION OF CLEAR SUCCESS METRICS

- design patterns and must be obeyed strictly according to the architecture of the project.

- atomic git commit for context preservation.

- context git commit for both code implementation, docs, planning, researching, gatekeeping, verification artifacts - do not ask if commit needed

- AGENTS.md must be routinely updated - after each cycle, each batch of implementation.

- AGENTS.md are nested under dirs and subdirs, beware when maintaining them.

- files creation and structure must be registered and keep track - we love our codetree systematically structured and we **DO Registered** folders and subfolders with `.gitkeep` 

- folders must be created in a way that is easy to navigate and understand, following the best practice of this harness. Folders must be registered with gitkeep files to ensure they are tracked by git. 

- code file must JSDOC (Run JSDOC skill) documented with clear descriptions, parameters, return values, and examples. All functions and classes must be documented.

- The front facing agents must process high-level workflows, validate dependencies of tasks across sessions through faces

- The front facing agents must delegate to suagents of specialist; front facing agents are not allowed to execute any tasks

- The front facing agents are ones converse with USERS and must know the high-level tasks flow, following strict validations, gatekeeping, and coordination of the partificating frameworks

- When delegating to agents these are the list of agents that must learn and delegate to the correct ones. When delegate to subagents make sure setting up strict guardrails, boundaries, success metrics, making sure they are awared that they are subagents and fulfill the tasked within boundaries and without any deviation ans seriously go through gatekeeping.

<!-- NOTE: explore agent is MISSING from the filesystem -->

- For effective session-resume delegation (when user disconnected and there were previous aborted delegation tasks). Do not start new delegation, start the same start with **THE EXACT SESSION ID** to resume.

- The front facing agents must keep track, monitor, make sure not a single validation, verification, review steps are skips, planning , audit and verification must following format of the participated framework with honest verification and prevention of regressions. 

- **all agents** at every turn (after PER USER's prompt, **even mid-session**, after each turn), entries, shift of workflows there should be matching SKILLS that you must load, load and reload of suitable skills for the task, select ones with framework consistencies. Do not miss loading SKILLS. SKILLS are extremely important


- - **all agents** : do not confuse between the project as the harness which you are building so that users can run it with OpenCode under their projects VS. your environment of works -> meaning there are assumptions that ARE NOT ALLOWED to interprete as this sole environment but must be as wider scopes, in terms of how different projects' states, tasks types, langues, frameworks and use cases.
---
**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

Source architecture: `.planning/architecture/hivemind-source-plane-architecture-2026-05-07.md` — `.opencode/` is the Soft Meta-Concepts sector: OpenCode primitives (agents, commands, skills, rules, permissions) ONLY. No runtime state. No development implementation.

## 1. Sector purpose and lifecycle role

`.opencode/` is the Soft Meta-Concept sector: OpenCode primitives, rules, plugin loader wrappers, commands, skills, agents, permissions, and project configuration that compose runtime behavior from outside the npm package source. Source evidence: `.planning/codebase/ARCHITECTURE.md:209-245`, `.planning/codebase/STRUCTURE.md:124-129`.

Source evidence: `.planning/architecture/hivemind-runtime-identity-taxonomy-2026-05-07.md` — hm/hf/gate/stack/gsd lineages, L0-L3 hierarchy contract. `.planning/codebase/ARCHITECTURE.md:209-245` — Soft Meta-Concept layer.

## 2. Allowed mutation authority

- Agents, skills, commands, rules, permissions, and OpenCode config may be created or updated here when explicitly authorized by a meta-concept workflow.
- `.opencode/plugins/` may contain thin plugin loader wrappers that point OpenCode at built harness plugin entrypoints. Evidence: `.planning/codebase/STRUCTURE.md:157-164`.
- Primitive/config changes must preserve hm/hf/gate/stack lineage conventions and the L0→L3 delegation hierarchy. Evidence: `.planning/codebase/ARCHITECTURE.md:217-245`, `.planning/codebase/STRUCTURE.md:197-216`.
- Closest-sector deviation: no `src/config/` folder is created for primitive/config boundary guidance; this sector owns soft primitive/config placement while runtime config consumers remain in `src/`.

## 3. Forbidden mutations / explicit no-go boundaries

- `.opencode/` SHALL NOT store internal runtime state; `.hivemind/` is canonical state root. Evidence: `.planning/codebase/ARCHITECTURE.md:247-255`, `.planning/codebase/STRUCTURE.md:124-134`.
- `.opencode/` SHALL NOT be treated as development implementation, source code, or build output. It is exclusively for OpenCode primitives (agents, commands, skills, rules, permissions) that configure runtime behavior.
- `.opencode/` SHALL NOT contain business logic, state persistence, compiled code, or npm package source — those belong in `src/` (Hard Harness) and `.hivemind/` (Internal State).
- `.opencode/state/` is legacy migration-only and must not receive new internal state ownership. Evidence: `.planning/codebase/STRUCTURE.md:295-299`.
- Do not blur hm/hf/gate/stack lineages or ship gsd-* internal developer tooling as product primitives. Evidence: `.planning/codebase/ARCHITECTURE.md:217-233`, `.planning/codebase/STRUCTURE.md:209-216`.
- Do not edit runtime TypeScript implementation here; runtime source authority remains in `src/`.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| OpenCode runtime | Discovers project config, plugin loader, commands, agents, skills, and rules | Runtime state still belongs in `.hivemind/` |
| hm-* lineage agents/skills | Product-dev workflows and specialists | STRICT lineage; no hf-* skill loading by hm-* unless explicitly routed |
| hf-* lineage agents/skills | Meta-concept authoring/building | May modify primitives only under meta-builder authorization |
| gate-* skills | Internal quality gate triad | Project-only quality gates, not shipped as generic product claims |
| stack-* skills | Framework/reference knowledge | Reference only, not implementation authority |
| `src/` Hard Harness tools | Configured through `.opencode/` primitives (agents call tools, commands route to agents) | Never imports from `.opencode/` — reads only through OpenCode SDK |

## 5. Naming and placement conventions

- Agent files use `hm-*`, `hf-*`, or `gsd-*` prefixes according to lineage; skills use `hm-*`, `hf-*`, `gate-*`, `stack-*`, or `gsd-*` prefixes. Evidence: `.planning/codebase/STRUCTURE.md:197-216`.
- Runtime skill location is `.opencode/skills/`; meta-builder source-of-truth is `.hivefiver-meta-builder/skills-lab/` and reflected to `.opencode/skills/`. Evidence: `.planning/codebase/ARCHITECTURE.md:209-215`.
- New agents, skills, and commands should originate from the meta-builder source areas before reflection to `.opencode/`. Evidence: `.planning/codebase/STRUCTURE.md:241-254`.
- Commands use OpenCode command files under `.opencode/commands/`; do not invent parallel command roots.

## 6. Quality gates and evidence expectations

- Primitive changes require discoverability validation, lineage validation, and restart/compile checks when applicable; docs-only edits here are not runtime proof.
- Do not claim permission enforcement, registry completeness, or runtime routing readiness when requirements still mark them missing/partial. Evidence: `.planning/REQUIREMENTS.md:42-56`, `.planning/PROJECT.md:29-42`.
- O3 docs-only guidance remains L5 evidence and cannot change runtime readiness. Evidence: `.planning/ROADMAP.md:47-49`.

## 7. Cross-sector alignment

- **Hard Harness (`src/`):** Runtime implementation. Compiles to dist/. Calls OpenCode SDK. Does not depend on `.opencode/` at build time.
- **Internal State (`.hivemind/`):** Durable persistence. Owned by `src/` modules through tool/hook CQRS boundaries. Canonical per Q6.
- **Meta-Authoring (`.hivefiver-meta-builder/`):** Source-of-truth for primitive authoring. Reflected to `.opencode/` via symlink or sync.
- **Governance (`.planning/`):** Documents architecture, provides phase authorization. Does not mutate `.opencode/`.
- **OMO Adaptation:** Per `.planning/research/omo-adaptation-architecture-2026-05-07.md`, OMO folder roots (`.sisyphus`, `.omx`) are REJECTED; `.opencode/` remains primitives-only.

</system-reminder>
Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/insert-phase.md"}
<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/insert-phase.md</path>
<type>file</type>
<content>
1: <purpose>
2: Insert a decimal phase for urgent work discovered mid-milestone between existing integer phases. Uses decimal numbering (72.1, 72.2, etc.) to preserve the logical sequence of planned phases while accommodating urgent insertions without renumbering the entire roadmap.
3: </purpose>
4: 
5: <required_reading>
6: Read all files referenced by the invoking prompt's execution_context before starting.
7: </required_reading>
8: 
9: <process>
10: 
11: <step name="parse_arguments">
12: Parse the command arguments:
13: - First argument: integer phase number to insert after
14: - Remaining arguments: phase description
15: 
16: Example: `/gsd-insert-phase 72 Fix critical auth bug`
17: -> after = 72
18: -> description = "Fix critical auth bug"
19: 
20: If arguments missing:
21: 
22: ```
23: ERROR: Both phase number and description required
24: Usage: /gsd-insert-phase <after> <description>
25: Example: /gsd-insert-phase 72 Fix critical auth bug
26: ```
27: 
28: Exit.
29: 
30: Validate first argument is an integer.
31: </step>
32: 
33: <step name="init_context">
34: Load phase operation context:
35: 
36: ```bash
37: INIT=$(gsd-sdk query init.phase-op "${after_phase}")
38: if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
39: ```
40: 
41: Check `roadmap_exists` from init JSON. If false:
42: ```
43: ERROR: No roadmap found (.planning/ROADMAP.md)
44: ```
45: Exit.
46: </step>
47: 
48: <step name="insert_phase">
49: **Delegate the phase insertion to `gsd-sdk query phase.insert`:**
50: 
51: ```bash
52: RESULT=$(gsd-sdk query phase.insert "${after_phase}" "${description}")
53: ```
54: 
55: The CLI handles:
56: - Verifying target phase exists in ROADMAP.md
57: - Calculating next decimal phase number (checking existing decimals on disk)
58: - Generating slug from description
59: - Creating the phase directory (`.planning/phases/{N.M}-{slug}/`)
60: - Inserting the phase entry into ROADMAP.md after the target phase with (INSERTED) marker
61: 
62: Extract from result: `phase_number`, `after_phase`, `name`, `slug`, `directory`.
63: </step>
64: 
65: <step name="update_project_state">
66: Update STATE.md to reflect the inserted phase via SDK handlers (never raw
67: `Edit`/`Write` — projects may ship a `protect-files.sh` PreToolUse hook that
68: blocks direct STATE.md writes):
69: 
70: 1. Update STATE.md's next-phase pointer(s) to the newly inserted phase
71:    `{decimal_phase}`:
72: 
73:    ```bash
74:    gsd-sdk query state.patch '{"Current Phase":"{decimal_phase}","Next recommended run":"/gsd-plan-phase {decimal_phase}"}'
75:    ```
76: 
77:    (Adjust field names to whatever pointers STATE.md exposes — the handler
78:    reports which fields it matched.)
79: 
80: 2. Append a Roadmap Evolution entry via the dedicated handler. It creates the
81:    `### Roadmap Evolution` subsection under `## Accumulated Context` if missing
82:    and dedupes identical entries:
83: 
84:    ```bash
85:    gsd-sdk query state.add-roadmap-evolution \
86:      --phase {decimal_phase} \
87:      --action inserted \
88:      --after {after_phase} \
89:      --note "{description}" \
90:      --urgent
91:    ```
92: 
93:    Expected response shape: `{ added: true, entry: "- Phase ... (URGENT)" }`
94:    (or `{ added: false, reason: "duplicate", entry: ... }` on replay).
95: </step>
96: 
97: <step name="completion">
98: Present completion summary:
99: 
100: ```
101: Phase {decimal_phase} inserted after Phase {after_phase}:
102: - Description: {description}
103: - Directory: .planning/phases/{decimal-phase}-{slug}/
104: - Status: Not planned yet
105: - Marker: (INSERTED) - indicates urgent work
106: 
107: Roadmap updated: .planning/ROADMAP.md
108: Project state updated: .planning/STATE.md
109: 
110: ---
111: 
112: ## Next Up
113: 
114: **Phase {decimal_phase}: {description}** -- urgent insertion
115: 
116: `/clear` then:
117: 
118: `/gsd-plan-phase {decimal_phase}`
119: 
120: ---
121: 
122: **Also available:**
123: - Review insertion impact: Check if Phase {next_integer} dependencies still make sense
124: - Review roadmap
125: 
126: ---
127: ```
128: </step>
129: 
130: </process>
131: 
132: <anti_patterns>
133: 
134: - Don't use this for planned work at end of milestone (use /gsd-add-phase)
135: - Don't insert before Phase 1 (decimal 0.1 makes no sense)
136: - Don't renumber existing phases
137: - Don't modify the target phase content
138: - Don't create plans yet (that's /gsd-plan-phase)
139: - Don't commit changes (user decides when to commit)
140: </anti_patterns>
141: 
142: <success_criteria>
143: Phase insertion is complete when:
144: 
145: - [ ] `gsd-sdk query phase.insert` executed successfully
146: - [ ] Phase directory created
147: - [ ] Roadmap updated with new phase entry (includes "(INSERTED)" marker)
148: - [ ] `gsd-sdk query state.add-roadmap-evolution ...` returned `{ added: true }` or `{ added: false, reason: "duplicate" }`
149: - [ ] `gsd-sdk query state.patch` returned matched next-phase pointer field(s)
150: - [ ] User informed of next steps and dependency implications
151: </success_criteria>

(End of file - total 151 lines)
</content>
Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/remove-phase.md"}
<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/remove-phase.md</path>
<type>file</type>
<content>
1: <purpose>
2: Remove an unstarted future phase from the project roadmap, delete its directory, renumber all subsequent phases to maintain a clean linear sequence, and commit the change. The git commit serves as the historical record of removal.
3: </purpose>
4: 
5: <required_reading>
6: Read all files referenced by the invoking prompt's execution_context before starting.
7: </required_reading>
8: 
9: <process>
10: 
11: <step name="parse_arguments">
12: Parse the command arguments:
13: - Argument is the phase number to remove (integer or decimal)
14: - Example: `/gsd-remove-phase 17` → phase = 17
15: - Example: `/gsd-remove-phase 16.1` → phase = 16.1
16: 
17: If no argument provided:
18: 
19: ```
20: ERROR: Phase number required
21: Usage: /gsd-remove-phase <phase-number>
22: Example: /gsd-remove-phase 17
23: ```
24: 
25: Exit.
26: </step>
27: 
28: <step name="init_context">
29: Load phase operation context:
30: 
31: ```bash
32: INIT=$(gsd-sdk query init.phase-op "${target}")
33: if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
34: ```
35: 
36: Extract: `phase_found`, `phase_dir`, `phase_number`, `commit_docs`, `roadmap_exists`.
37: 
38: Also read STATE.md and ROADMAP.md content for parsing current position.
39: </step>
40: 
41: <step name="validate_future_phase">
42: Verify the phase is a future phase (not started):
43: 
44: 1. Compare target phase to current phase from STATE.md
45: 2. Target must be > current phase number
46: 
47: If target <= current phase:
48: 
49: ```
50: ERROR: Cannot remove Phase {target}
51: 
52: Only future phases can be removed:
53: - Current phase: {current}
54: - Phase {target} is current or completed
55: 
56: To abandon current work, use /gsd-pause-work instead.
57: ```
58: 
59: Exit.
60: </step>
61: 
62: <step name="confirm_removal">
63: Present removal summary and confirm:
64: 
65: ```
66: Removing Phase {target}: {Name}
67: 
68: This will:
69: - Delete: .planning/phases/{target}-{slug}/
70: - Renumber all subsequent phases
71: - Update: ROADMAP.md, STATE.md
72: 
73: Proceed? (y/n)
74: ```
75: 
76: Wait for confirmation.
77: </step>
78: 
79: <step name="execute_removal">
80: **Delegate the entire removal operation to `gsd-sdk query phase.remove`:**
81: 
82: ```bash
83: RESULT=$(gsd-sdk query phase.remove "${target}")
84: ```
85: 
86: If the phase has executed plans (SUMMARY.md files), the CLI will error. Use `--force` only if the user confirms:
87: 
88: ```bash
89: RESULT=$(gsd-sdk query phase.remove "${target}" --force)
90: ```
91: 
92: The CLI handles:
93: - Deleting the phase directory
94: - Renumbering all subsequent directories (in reverse order to avoid conflicts)
95: - Renaming all files inside renumbered directories (PLAN.md, SUMMARY.md, etc.)
96: - Updating ROADMAP.md (removing section, renumbering all phase references, updating dependencies)
97: - Updating STATE.md (decrementing phase count)
98: 
99: Extract from result: `removed`, `directory_deleted`, `renamed_directories`, `renamed_files`, `roadmap_updated`, `state_updated`.
100: </step>
101: 
102: <step name="commit">
103: Stage and commit the removal:
104: 
105: ```bash
106: gsd-sdk query commit "chore: remove phase {target} ({original-phase-name})" --files .planning/
107: ```
108: 
109: The commit message preserves the historical record of what was removed.
110: </step>
111: 
112: <step name="completion">
113: Present completion summary:
114: 
115: ```
116: Phase {target} ({original-name}) removed.
117: 
118: Changes:
119: - Deleted: .planning/phases/{target}-{slug}/
120: - Renumbered: {N} directories and {M} files
121: - Updated: ROADMAP.md, STATE.md
122: - Committed: chore: remove phase {target} ({original-name})
123: 
124: ---
125: 
126: ## What's Next
127: 
128: Would you like to:
129: - `/gsd-progress` — see updated roadmap status
130: - Continue with current phase
131: - Review roadmap
132: 
133: ---
134: ```
135: </step>
136: 
137: </process>
138: 
139: <anti_patterns>
140: 
141: - Don't remove completed phases (have SUMMARY.md files) without --force
142: - Don't remove current or past phases
143: - Don't manually renumber — use `gsd-sdk query phase.remove` which handles all renumbering
144: - Don't add "removed phase" notes to STATE.md — git commit is the record
145: - Don't modify completed phase directories
146: </anti_patterns>
147: 
148: <success_criteria>
149: Phase removal is complete when:
150: 
151: - [ ] Target phase validated as future/unstarted
152: - [ ] `gsd-sdk query phase.remove` executed successfully
153: - [ ] Changes committed with descriptive message
154: - [ ] User informed of changes
155: </success_criteria>

(End of file - total 155 lines)
</content>
Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/edit-phase.md"}
<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/edit-phase.md</path>
<type>file</type>
<content>
1: <purpose>
2: Edit any field of an existing phase in ROADMAP.md in place. The phase number and position are always preserved. Guarded against in-progress and completed phases unless --force is passed. Validates depends_on references before writing. Shows a diff and requests confirmation before writing.
3: </purpose>
4: 
5: <required_reading>
6: Read all files referenced by the invoking prompt's execution_context before starting.
7: </required_reading>
8: 
9: <process>
10: 
11: <step name="parse_arguments">
12: Parse the command arguments:
13: - First argument: phase number to edit (integer or decimal)
14: - Optional flag: --force (allow editing in_progress/completed phases)
15: 
16: Examples:
17:   `/gsd-edit-phase 5`       → phase = 5, force = false
18:   `/gsd-edit-phase 5 --force` → phase = 5, force = true
19:   `/gsd-edit-phase 12.1`    → phase = 12.1, force = false
20: 
21: If no argument provided:
22: 
23: ```
24: ERROR: Phase number required
25: Usage: /gsd-edit-phase <phase-number> [--force]
26: Example: /gsd-edit-phase 5
27: Example: /gsd-edit-phase 5 --force
28: ```
29: 
30: Exit.
31: </step>
32: 
33: <step name="init_context">
34: Load phase operation context:
35: 
36: ```bash
37: INIT=$(gsd-sdk query init.phase-op "${target}")
38: if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
39: ```
40: 
41: Check `roadmap_exists` from init JSON. If false:
42: ```
43: ERROR: No roadmap found (.planning/ROADMAP.md)
44: Run /gsd-new-project to initialize.
45: ```
46: Exit.
47: </step>
48: 
49: <step name="load_phase">
50: Read the current phase section from ROADMAP.md:
51: 
52: ```bash
53: PHASE_DATA=$(gsd-sdk query roadmap get-phase "${target}")
54: ```
55: 
56: Parse the JSON result. If `found` is false:
57: 
58: ```
59: ERROR: Phase {target} not found in ROADMAP.md
60: 
61: Available phases can be seen with /gsd-progress.
62: ```
63: 
64: Exit.
65: 
66: Extract from the result:
67: - `phase_name` — the phase title
68: - `goal` — the phase goal/description
69: - `success_criteria` — array of criteria
70: - `section` — full raw section text (preserves depends_on, requirements, plans, etc.)
71: 
72: Also parse the full section text to extract additional fields not in the SDK result:
73: - `depends_on` — from `**Depends on:** ...` or `**Depends on**: ...` line
74: - `requirements` — from `**Requirements:** ...` block if present
75: </step>
76: 
77: <step name="check_phase_status">
78: Determine the phase status from disk. Compare against STATE.md current phase:
79: 
80: ```bash
81: ANALYZE=$(gsd-sdk query roadmap analyze)
82: ```
83: 
84: Find the phase entry in the `phases` array. Extract `disk_status`.
85: 
86: Map disk_status to a user-friendly status:
87: - `complete` → status = `completed`
88: - `planned` or `partial` → status = `in_progress`
89: - `empty`, `no_directory`, `discussed`, `researched` → status = `future`
90: 
91: If status is `in_progress` or `completed` AND `--force` was NOT passed:
92: 
93: ```
94: ERROR: Cannot edit Phase {target} — status is {status}
95: 
96: Editing an in-progress or completed phase may invalidate executed plans.
97: 
98: To edit anyway, run:
99:   /gsd-edit-phase {target} --force
100: ```
101: 
102: Exit.
103: 
104: If `--force` was passed and status is `in_progress` or `completed`, continue with a warning printed to the user:
105: 
106: ```
107: WARNING: Editing Phase {target} which is {status}. Proceeding due to --force.
108: ```
109: </step>
110: 
111: <step name="present_current_values">
112: Display the current phase fields clearly:
113: 
114: ```
115: Current values for Phase {target}: {phase_name}
116: 
117: Title:            {phase_name}
118: Goal:             {goal}
119: Depends on:       {depends_on or "(none)"}
120: Requirements:     {requirements or "(none)"}
121: Success Criteria:
122:   1. {criterion_1}
123:   2. {criterion_2}
124:   ...
125: ```
126: 
127: Then ask the user what they want to change:
128: 
129: ```
130: What would you like to do?
131: 
132:   [1] Edit specific fields (title, goal, depends_on, requirements, success_criteria)
133:   [2] Regenerate all fields from a clarified intent
134:   [3] Cancel
135: 
136: Enter choice (1, 2, or 3):
137: ```
138: 
139: Wait for user input.
140: </step>
141: 
142: <step name="collect_edits">
143: 
144: **If user chose [3] Cancel:** Exit cleanly.
145: 
146: **If user chose [1] Edit specific fields:**
147: 
148: Ask which fields to edit. For each field the user wants to change, prompt for the new value. Only fields the user explicitly answers become updates; empty answers preserve the existing value.
149: 
150: ```
151: Which fields do you want to update? (comma-separated or "all")
152: Options: title, goal, depends_on, requirements, success_criteria
153: ```
154: 
155: For each selected field, ask:
156: 
157: ```
158: New value for {field} [current: {current_value}]:
159: ```
160: 
161: Build an `updates` map of {field → new_value} for non-empty answers.
162: 
163: **If user chose [2] Regenerate all from clarified intent:**
164: 
165: Ask the user:
166: 
167: ```
168: Describe the revised intent for Phase {target} (replace the current description):
169: ```
170: 
171: Wait for user input. Use the clarified intent to rewrite all fields:
172: - Generate a clear, concise `title` from the intent
173: - Write a complete `goal` statement
174: - Produce updated `requirements` if the original had them
175: - Generate `success_criteria` (3-5 measurable criteria)
176: - Preserve `depends_on` unless the user explicitly mentioned changing it
177: </step>
178: 
179: <step name="validate_depends_on">
180: If `depends_on` is being updated (or preserved as non-empty), validate that every referenced phase number exists in ROADMAP.md:
181: 
182: ```bash
183: ALL_PHASES=$(gsd-sdk query roadmap analyze)
184: ```
185: 
186: Parse the `phases` array to get all valid phase numbers.
187: 
188: For each phase number referenced in `depends_on`:
189: - Normalize it (strip whitespace, "Phase" prefix if present)
190: - Check it is in the valid phase numbers set
191: - It must not reference itself (phase {target})
192: 
193: If any reference is invalid:
194: 
195: ```
196: ERROR: depends_on references invalid phase(s): {bad_refs}
197: 
198: Valid phase numbers: {valid_list}
199: 
200: Fix the depends_on field and try again.
201: ```
202: 
203: Exit (do not write).
204: </step>
205: 
206: <step name="show_diff_and_confirm">
207: Build the updated phase section by applying the changes to the original `section` text:
208: 
209: - For `title`: replace the heading text after `Phase {N}:`
210: - For `goal`: replace the `**Goal:**` line value
211: - For `depends_on`: replace or add the `**Depends on:**` line
212: - For `requirements`: replace or add the requirements block
213: - For `success_criteria`: replace the numbered list under `**Success Criteria**:`
214: - For full regeneration: rebuild the entire section from the new field values
215: 
216: Show a unified-style diff of old vs. new:
217: 
218: ```
219: Proposed changes to Phase {target}:
220: 
221: --- current
222: +++ updated
223: @@ ...
224: - **Goal:** {old_goal}
225: + **Goal:** {new_goal}
226: ...
227: 
228: Apply these changes? (y/n):
229: ```
230: 
231: Wait for confirmation. If the user says `n`, exit without writing.
232: </step>
233: 
234: <step name="write_updated_phase">
235: Write the updated phase back in place in ROADMAP.md.
236: 
237: Read the full ROADMAP.md content, locate the phase section by its header (`## Phase {N}:` or `### Phase {N}:`), and replace exactly the old section text with the new section text. All content before and after the section (including other phases, milestone headers, and the summary checklist) must be left unchanged.
238: 
239: After writing ROADMAP.md, update STATE.md Roadmap Evolution:
240: 
241: ```bash
242: gsd-sdk query state.add-roadmap-evolution \
243:   --phase {target} \
244:   --action edited \
245:   --note "edited fields: {changed_field_list}"
246: ```
247: </step>
248: 
249: <step name="completion">
250: Present completion summary:
251: 
252: ```
253: Phase {target} updated in ROADMAP.md.
254: 
255: Fields changed: {changed_field_list}
256: 
257: ---
258: 
259: ## What's Next
260: 
261: - `/gsd-progress` — view updated roadmap
262: - `/gsd-plan-phase {target}` — re-plan this phase (if needed)
263: - `/gsd-discuss-phase {target}` — discuss implementation approach
264: 
265: ---
266: ```
267: </step>
268: 
269: </process>
270: 
271: <anti_patterns>
272: - Don't renumber the phase — number and position must be preserved exactly
273: - Don't modify other phases when editing one
274: - Don't skip depends_on validation (invalid references block writes)
275: - Don't write without showing a diff and getting confirmation
276: - Don't edit in_progress/completed phases without --force
277: - Don't use raw Write on ROADMAP.md without reading it first; always replace section in place
278: - Don't modify the phase directory structure — only ROADMAP.md changes
279: - Don't commit the change — that's the user's decision
280: </anti_patterns>
281: 
282: <success_criteria>
283: Edit-phase is complete when:
284: 
285: - [ ] Phase {target} found and loaded from ROADMAP.md
286: - [ ] Status check performed; in_progress/completed blocked without --force
287: - [ ] Current values presented to user
288: - [ ] User chose edit mode (specific fields or full regeneration)
289: - [ ] depends_on references validated; invalid references blocked
290: - [ ] Diff shown and confirmed by user
291: - [ ] Updated phase written back in place; number, position, and status preserved
292: - [ ] STATE.md Roadmap Evolution updated
293: - [ ] User informed of next steps
294: </success_criteria>

(End of file - total 294 lines)
</content>

### Tool: bash

**Input:**
```json
{
  "callID": "call_00_DeDOVWRtBPvDtf7xaPMU4979"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_4RsBMe3F0COOlCWHfbiS1394"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_zTmsG46UdSLrWPmY0f8f0289"
}
```


### Tool: skill

**Input:**
```json
{
  "name": "gsd-spec-phase"
}
```

**Output:** (pruned)
```
# Skill: gsd-spec-phase
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/spec-phase.md"
}
```


### Tool: execute-slash-command

**Input:**
```json
{
  "callID": "call_00_fYcyobG9KC96cU3e1H3F6342"
}
```


## USER (turn 11)

**source:** real-human

<objective>
Clarify phase requirements through structured Socratic questioning with quantitative ambiguity scoring.

**Position in workflow:** `spec-phase → discuss-phase → plan-phase → execute-phase → verify`

**How it works:**
1. Load phase context (PROJECT.md, REQUIREMENTS.md, ROADMAP.md, STATE.md)
2. Scout the codebase — understand current state before asking questions
3. Run Socratic interview loop (up to 6 rounds, rotating perspectives)
4. Score ambiguity across 4 weighted dimensions after each round
5. Gate: ambiguity ≤ 0.20 AND all dimensions meet minimums → write SPEC.md
6. Commit SPEC.md — discuss-phase picks it up automatically on next run

**Output:** `{phase_dir}/{padded_phase}-SPEC.md` — falsifiable requirements that lock "what/why" before discuss-phase handles "how"
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/spec-phase.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/spec.md
</execution_context>

<runtime_note>
**Copilot (VS Code):** Use `vscode_askquestions` wherever this workflow calls `question`. They are equivalent.
</runtime_note>

<context>
Phase number: 15 --auto (required)

**Flags:**
- `--auto` — Skip interactive questions; the agent selects recommended defaults and writes SPEC.md
- `--text` — Use plain-text numbered lists instead of TUI menus (required for `/rc` remote sessions)

Context files are resolved in-workflow using `init phase-op`.
</context>

<process>
Execute end-to-end.

**MANDATORY:** Read the workflow file BEFORE taking any action. The workflow contains the complete step-by-step process including the Socratic interview loop, ambiguity scoring gate, and SPEC.md generation. Do not improvise from the objective summary above.
</process>

<success_criteria>
- Codebase scouted for current state before questioning begins
- All 4 ambiguity dimensions scored after each interview round
- Gate passed: ambiguity ≤ 0.20 AND all dimension minimums met
- SPEC.md written with falsifiable requirements, explicit boundaries, and acceptance criteria
- SPEC.md committed atomically
- User knows they can now run /gsd-discuss-phase which will load SPEC.md automatically
</success_criteria>
Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/spec-phase.md"}
<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/spec-phase.md</path>
<type>file</type>
<content>
1: <purpose>
2: Clarify WHAT a phase delivers through a Socratic interview loop with quantitative ambiguity scoring.
3: Produces a SPEC.md with falsifiable requirements that discuss-phase treats as locked decisions.
4: 
5: This workflow handles "what" and "why" — discuss-phase handles "how".
6: </purpose>
7: 
8: <ambiguity_model>
9: Score each dimension 0.0 (completely unclear) to 1.0 (crystal clear):
10: 
11: | Dimension         | Weight | Minimum | What it measures                                  |
12: |-------------------|--------|---------|---------------------------------------------------|
13: | Goal Clarity      | 35%    | 0.75    | Is the outcome specific and measurable?           |
14: | Boundary Clarity  | 25%    | 0.70    | What's in scope vs out of scope?                  |
15: | Constraint Clarity| 20%    | 0.65    | Performance, compatibility, data requirements?    |
16: | Acceptance Criteria| 20%   | 0.70    | How do we know it's done?                         |
17: 
18: **Ambiguity score** = 1.0 − (0.35×goal + 0.25×boundary + 0.20×constraint + 0.20×acceptance)
19: 
20: **Gate:** ambiguity ≤ 0.20 AND all dimensions ≥ their minimums → ready to write SPEC.md.
21: 
22: A score of 0.20 means 80% weighted clarity — enough precision that the planner won't silently make wrong assumptions.
23: </ambiguity_model>
24: 
25: <interview_perspectives>
26: Rotate through these perspectives — each naturally surfaces different blindspots:
27: 
28: **Researcher (rounds 1–2):** Ground the discussion in current reality.
29: - "What exists in the codebase today related to this phase?"
30: - "What's the delta between today and the target state?"
31: - "What triggers this work — what's broken or missing?"
32: 
33: **Simplifier (round 2):** Surface minimum viable scope.
34: - "What's the simplest version that solves the core problem?"
35: - "If you had to cut 50%, what's the irreducible core?"
36: - "What would make this phase a success even without the nice-to-haves?"
37: 
38: **Boundary Keeper (round 3):** Lock the perimeter.
39: - "What explicitly will NOT be done in this phase?"
40: - "What adjacent problems is it tempting to solve but shouldn't?"
41: - "What does 'done' look like — what's the final deliverable?"
42: 
43: **Failure Analyst (round 4):** Find the edge cases that invalidate requirements.
44: - "What's the worst thing that could go wrong if we get the requirements wrong?"
45: - "What does a broken version of this look like?"
46: - "What would cause a verifier to reject the output?"
47: 
48: **Seed Closer (rounds 5–6):** Lock remaining undecided territory.
49: - "We have [dimension] at [score] — what would make it completely clear?"
50: - "The remaining ambiguity is in [area] — can we make a decision now?"
51: - "Is there anything you'd regret not specifying before planning starts?"
52: </interview_perspectives>
53: 
54: <process>
55: 
56: ## Step 1: Initialize
57: 
58: ```bash
59: INIT=$(node "/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/gsd-tools.cjs" init phase-op "${PHASE}")
60: if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
61: ```
62: 
63: Parse JSON for: `phase_found`, `phase_dir`, `phase_number`, `phase_name`, `phase_slug`, `padded_phase`, `state_path`, `requirements_path`, `roadmap_path`, `planning_path`, `response_language`, `commit_docs`.
64: 
65: **If `response_language` is set:** All user-facing text in this workflow MUST be in `{response_language}`. Technical terms, code, and file paths stay in English.
66: 
67: **If `phase_found` is false:**
68: ```
69: Phase [X] not found in roadmap.
70: Use /gsd-progress to see available phases.
71: ```
72: Exit.
73: 
74: **Check for existing SPEC.md:**
75: ```bash
76: ls ${phase_dir}/*-SPEC.md 2>/dev/null | grep -v AI-SPEC | head -1 || true
77: ```
78: 
79: If SPEC.md already exists:
80: 
81: **If `--auto`:** Auto-select "Update it". Log: `[auto] SPEC.md exists — updating.`
82: 
83: **Otherwise:** Use question:
84: - header: "Spec"
85: - question: "Phase [X] already has a SPEC.md. What do you want to do?"
86: - options:
87:   - "Update it" — Revise and re-score
88:   - "View it" — Show current spec
89:   - "Skip" — Exit (use existing spec as-is)
90: 
91: If "View": Display SPEC.md, then offer Update/Skip.
92: If "Skip": Exit with message: "Existing SPEC.md unchanged. Run /gsd-discuss-phase [X] to continue."
93: If "Update": Load existing SPEC.md, continue to Step 3.
94: 
95: ## Step 2: Scout Codebase
96: 
97: **Read these files before any questions:**
98: - `{requirements_path}` — Project requirements
99: - `{state_path}` — Decisions already made, current phase, blockers
100: - ROADMAP.md phase entry — Phase description, goals, canonical refs
101: 
102: **Grep the codebase** for code/files relevant to this phase goal. Look for:
103: - Existing implementations of similar functionality
104: - Integration points where new code will connect
105: - Test coverage gaps relevant to the phase
106: - Prior phase artifacts (SUMMARY.md, VERIFICATION.md) that inform current state
107: 
108: **Synthesize current state** — the grounded baseline for the interview:
109: - What exists today related to this phase
110: - The gap between current state and the phase goal
111: - The primary deliverable: what file/behavior/capability does NOT exist yet?
112: 
113: Confirm your current state synthesis internally. Do not present it to the user yet — you'll use it to ask precise, grounded questions.
114: 
115: ## Step 3: First Ambiguity Assessment
116: 
117: Before questioning begins, score the phase's current ambiguity based only on what ROADMAP.md and REQUIREMENTS.md say:
118: 
119: ```
120: Goal Clarity:       [score 0.0–1.0]
121: Boundary Clarity:   [score 0.0–1.0]
122: Constraint Clarity: [score 0.0–1.0]
123: Acceptance Criteria:[score 0.0–1.0]
124: 
125: Ambiguity: [score] ([calculate])
126: ```
127: 
128: **If `--auto` and initial ambiguity already ≤ 0.20 with all minimums met:** Skip interview — derive SPEC.md directly from roadmap + requirements. Log: `[auto] Phase requirements are already sufficiently clear — generating SPEC.md from existing context.` Jump to Step 6.
129: 
130: **Otherwise:** Continue to Step 4.
131: 
132: ## Step 4: Socratic Interview Loop
133: 
134: **Max 6 rounds.** Each round: 2–3 questions max. End round after user responds.
135: 
136: **Round selection by perspective:**
137: - Round 1: Researcher
138: - Round 2: Researcher + Simplifier
139: - Round 3: Boundary Keeper
140: - Round 4: Failure Analyst
141: - Rounds 5–6: Seed Closer (focus on lowest-scoring dimensions)
142: 
143: **After each round:**
144: 1. Update all 4 dimension scores from the user's answers
145: 2. Calculate new ambiguity score
146: 3. Display the updated scoring:
147: 
148: ```
149: After round [N]:
150:   Goal Clarity:       [score] (min 0.75) [✓ or ↑ needed]
151:   Boundary Clarity:   [score] (min 0.70) [✓ or ↑ needed]
152:   Constraint Clarity: [score] (min 0.65) [✓ or ↑ needed]
153:   Acceptance Criteria:[score] (min 0.70) [✓ or ↑ needed]
154:   Ambiguity: [score] (gate: ≤ 0.20)
155: ```
156: 
157: **Gate check after each round:**
158: 
159: If gate passes (ambiguity ≤ 0.20 AND all minimums met):
160: 
161: **If `--auto`:** Jump to Step 6.
162: 
163: **Otherwise:** question:
164: - header: "Spec Gate Passed"
165: - question: "Ambiguity is [score] — requirements are clear enough to write SPEC.md. Proceed?"
166: - options:
167:   - "Yes — write SPEC.md" → Jump to Step 6
168:   - "One more round" → Continue interview
169:   - "Done talking — write it" → Jump to Step 6
170: 
171: **If max rounds reached (6) and gate not passed:**
172: 
173: **If `--auto`:** Write SPEC.md anyway — flag unresolved dimensions. Log: `[auto] Max rounds reached. Writing SPEC.md with [N] dimensions below minimum. Planner will need to treat these as assumptions.`
174: 
175: **Otherwise:** question:
176: - header: "Max Rounds"
177: - question: "After 6 rounds, ambiguity is [score]. [List dimensions still below minimum.] What would you like to do?"
178: - options:
179:   - "Write SPEC.md anyway — flag gaps" → Write SPEC.md, mark unresolved dimensions in Ambiguity Report
180:   - "Keep talking" → Continue (no round limit from here)
181:   - "Abandon" → Exit without writing
182: 
183: **If `--auto` mode throughout:** Replace all question calls above with the agent's recommended choice. Log decisions inline. Apply the same logic as `--auto` in discuss-phase.
184: 
185: **Text mode (`workflow.text_mode: true` or `--text` flag):** Use plain-text numbered lists instead of question TUI menus.
186: 
187: ## Step 5: (covered inline — ambiguity scoring is per-round)
188: 
189: ## Step 6: Generate SPEC.md
190: 
191: Use the SPEC.md template from @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/spec.md.
192: 
193: **Requirements for every requirement entry:**
194: - One specific, testable statement
195: - Current state (what exists now)
196: - Target state (what it should become)
197: - Acceptance criterion (how to verify it was met)
198: 
199: **Vague requirements are rejected:**
200: - ✗ "The system should be fast"
201: - ✗ "Improve user experience"
202: - ✓ "API endpoint responds in < 200ms at p95 under 100 concurrent requests"
203: - ✓ "CLI command exits with code 1 and prints to stderr on invalid input"
204: 
205: **Count requirements.** The display in discuss-phase reads: "Found SPEC.md — {N} requirements locked."
206: 
207: **Boundaries must be explicit lists:**
208: - "In scope" — what this phase produces
209: - "Out of scope" — what it explicitly does NOT do (with brief reasoning)
210: 
211: **Acceptance criteria must be pass/fail checkboxes** — no "should feel good" or "looks reasonable."
212: 
213: **If any dimensions are below minimum**, mark them in the Ambiguity Report with: `⚠ Below minimum — planner must treat as assumption`.
214: 
215: Write to: `{phase_dir}/{padded_phase}-SPEC.md`
216: 
217: ## Step 7: Commit
218: 
219: ```bash
220: git add "${phase_dir}/${padded_phase}-SPEC.md"
221: git commit -m "spec(phase-${phase_number}): add SPEC.md for ${phase_name} — ${requirement_count} requirements (#2213)"
222: ```
223: 
224: If `commit_docs` is false: Skip commit. Note that SPEC.md was written but not committed.
225: 
226: ## Step 8: Wrap Up
227: 
228: Display:
229: 
230: ```
231: SPEC.md written — {N} requirements locked.
232: 
233:   Phase {X}: {name}
234:   Ambiguity: {final_score} (gate: ≤ 0.20)
235: 
236: Next: /gsd-discuss-phase {X}
237:   discuss-phase will detect SPEC.md and focus on implementation decisions only.
238: ```
239: 
240: </process>
241: 
242: <critical_rules>
243: - Every requirement MUST have current state, target state, and acceptance criterion
244: - Boundaries section is MANDATORY — cannot be empty
245: - "In scope" and "Out of scope" must be explicit lists, not narrative prose
246: - Acceptance criteria must be pass/fail — no subjective criteria
247: - SPEC.md is NEVER written if the user selects "Abandon"
248: - Do NOT ask about HOW to implement — that is discuss-phase territory
249: - Scout the codebase BEFORE the first question — grounded questions only
250: - Max 2–3 questions per round — do not frontload all questions at once
251: </critical_rules>
252: 
253: <success_criteria>
254: - Codebase scouted and current state understood before questioning
255: - All 4 dimensions scored after every round
256: - Gate passed OR user explicitly chose to write despite gaps
257: - SPEC.md contains only falsifiable requirements
258: - Boundaries are explicit (in scope / out of scope with reasoning)
259: - Acceptance criteria are pass/fail checkboxes
260: - SPEC.md committed atomically (when commit_docs is true)
261: - User directed to /gsd-discuss-phase as next step
262: </success_criteria>

(End of file - total 262 lines)
</content>

<system-reminder>
Instructions from: /Users/apple/hivemind-plugin-private/.opencode/AGENTS.md
# Soft Meta-Concept Sector Guidance


## NON-NEGOTIABLE RULES

- all tech, stack, SDK implementation, audit, gatekeeping  must follow deep investigation - stack research ;skills are for references not for interfaces validation; "interfaces, patterns, methods, api, signatures of specs etc" must validate against the correct versions at package.json - **MUST VALIDATE AGAINST ONLINE RESOURCES AS FOR MCP SERVER TOOLS ACTUAL FETCH** - valid and evidences with Context7, Deepwiki, Gitmcp, Github repo, Exa **AND Repomix for accurate specific patterns** etc, official - loading references from skills of stacks are outdated, as so reading code in the codebase can be polluted as many implementations are not functioning and broken. DO NOT MAKE ASSUMPTIONS OF THE STACK REPO LINKs - **EXTREMELY IMPORNTANT:** Uses of Context7, Deepwiki, Gitmcp, Github, Exa, Repomix are enforced when researching, planning, and implementing - these MUST Comply with all the **Github and Npm links that up-to-date with versiosn and NOT A PRODUCT OF MAKING UP LINKS** >  glob, list this to check these links `.hivemind/STACKS-REFERENCES.md`

- any thing under .opencode/ are not shipped-with, they are symlinks or project toolings 

- all orchestrator, coordinator, conductor agents belonging to l0, and l1 classifications MUST FOCUS ON THE DELEGATIONS - NEVER Implement the tasks yourself - when delegating DO NOT SHOW THE SPECIALIST WHAT AND HOW TO IMPLEMENT - Show HOW TO PROCESS, WHAT TO EXPECT AS RESULTS, SETTING CONSTRAINTS AND BOUNDARIES, INDICATION OF CLEAR SUCCESS METRICS

- design patterns and must be obeyed strictly according to the architecture of the project.

- atomic git commit for context preservation.

- context git commit for both code implementation, docs, planning, researching, gatekeeping, verification artifacts - do not ask if commit needed

- AGENTS.md must be routinely updated - after each cycle, each batch of implementation.

- AGENTS.md are nested under dirs and subdirs, beware when maintaining them.

- files creation and structure must be registered and keep track - we love our codetree systematically structured and we **DO Registered** folders and subfolders with `.gitkeep` 

- folders must be created in a way that is easy to navigate and understand, following the best practice of this harness. Folders must be registered with gitkeep files to ensure they are tracked by git. 

- code file must JSDOC (Run JSDOC skill) documented with clear descriptions, parameters, return values, and examples. All functions and classes must be documented.

- The front facing agents must process high-level workflows, validate dependencies of tasks across sessions through faces

- The front facing agents must delegate to suagents of specialist; front facing agents are not allowed to execute any tasks

- The front facing agents are ones converse with USERS and must know the high-level tasks flow, following strict validations, gatekeeping, and coordination of the partificating frameworks

- When delegating to agents these are the list of agents that must learn and delegate to the correct ones. When delegate to subagents make sure setting up strict guardrails, boundaries, success metrics, making sure they are awared that they are subagents and fulfill the tasked within boundaries and without any deviation ans seriously go through gatekeeping.

<!-- NOTE: explore agent is MISSING from the filesystem -->

- For effective session-resume delegation (when user disconnected and there were previous aborted delegation tasks). Do not start new delegation, start the same start with **THE EXACT SESSION ID** to resume.

- The front facing agents must keep track, monitor, make sure not a single validation, verification, review steps are skips, planning , audit and verification must following format of the participated framework with honest verification and prevention of regressions. 

- **all agents** at every turn (after PER USER's prompt, **even mid-session**, after each turn), entries, shift of workflows there should be matching SKILLS that you must load, load and reload of suitable skills for the task, select ones with framework consistencies. Do not miss loading SKILLS. SKILLS are extremely important


- - **all agents** : do not confuse between the project as the harness which you are building so that users can run it with OpenCode under their projects VS. your environment of works -> meaning there are assumptions that ARE NOT ALLOWED to interprete as this sole environment but must be as wider scopes, in terms of how different projects' states, tasks types, langues, frameworks and use cases.
---
**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

Source architecture: `.planning/architecture/hivemind-source-plane-architecture-2026-05-07.md` — `.opencode/` is the Soft Meta-Concepts sector: OpenCode primitives (agents, commands, skills, rules, permissions) ONLY. No runtime state. No development implementation.

## 1. Sector purpose and lifecycle role

`.opencode/` is the Soft Meta-Concept sector: OpenCode primitives, rules, plugin loader wrappers, commands, skills, agents, permissions, and project configuration that compose runtime behavior from outside the npm package source. Source evidence: `.planning/codebase/ARCHITECTURE.md:209-245`, `.planning/codebase/STRUCTURE.md:124-129`.

Source evidence: `.planning/architecture/hivemind-runtime-identity-taxonomy-2026-05-07.md` — hm/hf/gate/stack/gsd lineages, L0-L3 hierarchy contract. `.planning/codebase/ARCHITECTURE.md:209-245` — Soft Meta-Concept layer.

## 2. Allowed mutation authority

- Agents, skills, commands, rules, permissions, and OpenCode config may be created or updated here when explicitly authorized by a meta-concept workflow.
- `.opencode/plugins/` may contain thin plugin loader wrappers that point OpenCode at built harness plugin entrypoints. Evidence: `.planning/codebase/STRUCTURE.md:157-164`.
- Primitive/config changes must preserve hm/hf/gate/stack lineage conventions and the L0→L3 delegation hierarchy. Evidence: `.planning/codebase/ARCHITECTURE.md:217-245`, `.planning/codebase/STRUCTURE.md:197-216`.
- Closest-sector deviation: no `src/config/` folder is created for primitive/config boundary guidance; this sector owns soft primitive/config placement while runtime config consumers remain in `src/`.

## 3. Forbidden mutations / explicit no-go boundaries

- `.opencode/` SHALL NOT store internal runtime state; `.hivemind/` is canonical state root. Evidence: `.planning/codebase/ARCHITECTURE.md:247-255`, `.planning/codebase/STRUCTURE.md:124-134`.
- `.opencode/` SHALL NOT be treated as development implementation, source code, or build output. It is exclusively for OpenCode primitives (agents, commands, skills, rules, permissions) that configure runtime behavior.
- `.opencode/` SHALL NOT contain business logic, state persistence, compiled code, or npm package source — those belong in `src/` (Hard Harness) and `.hivemind/` (Internal State).
- `.opencode/state/` is legacy migration-only and must not receive new internal state ownership. Evidence: `.planning/codebase/STRUCTURE.md:295-299`.
- Do not blur hm/hf/gate/stack lineages or ship gsd-* internal developer tooling as product primitives. Evidence: `.planning/codebase/ARCHITECTURE.md:217-233`, `.planning/codebase/STRUCTURE.md:209-216`.
- Do not edit runtime TypeScript implementation here; runtime source authority remains in `src/`.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| OpenCode runtime | Discovers project config, plugin loader, commands, agents, skills, and rules | Runtime state still belongs in `.hivemind/` |
| hm-* lineage agents/skills | Product-dev workflows and specialists | STRICT lineage; no hf-* skill loading by hm-* unless explicitly routed |
| hf-* lineage agents/skills | Meta-concept authoring/building | May modify primitives only under meta-builder authorization |
| gate-* skills | Internal quality gate triad | Project-only quality gates, not shipped as generic product claims |
| stack-* skills | Framework/reference knowledge | Reference only, not implementation authority |
| `src/` Hard Harness tools | Configured through `.opencode/` primitives (agents call tools, commands route to agents) | Never imports from `.opencode/` — reads only through OpenCode SDK |

## 5. Naming and placement conventions

- Agent files use `hm-*`, `hf-*`, or `gsd-*` prefixes according to lineage; skills use `hm-*`, `hf-*`, `gate-*`, `stack-*`, or `gsd-*` prefixes. Evidence: `.planning/codebase/STRUCTURE.md:197-216`.
- Runtime skill location is `.opencode/skills/`; meta-builder source-of-truth is `.hivefiver-meta-builder/skills-lab/` and reflected to `.opencode/skills/`. Evidence: `.planning/codebase/ARCHITECTURE.md:209-215`.
- New agents, skills, and commands should originate from the meta-builder source areas before reflection to `.opencode/`. Evidence: `.planning/codebase/STRUCTURE.md:241-254`.
- Commands use OpenCode command files under `.opencode/commands/`; do not invent parallel command roots.

## 6. Quality gates and evidence expectations

- Primitive changes require discoverability validation, lineage validation, and restart/compile checks when applicable; docs-only edits here are not runtime proof.
- Do not claim permission enforcement, registry completeness, or runtime routing readiness when requirements still mark them missing/partial. Evidence: `.planning/REQUIREMENTS.md:42-56`, `.planning/PROJECT.md:29-42`.
- O3 docs-only guidance remains L5 evidence and cannot change runtime readiness. Evidence: `.planning/ROADMAP.md:47-49`.

## 7. Cross-sector alignment

- **Hard Harness (`src/`):** Runtime implementation. Compiles to dist/. Calls OpenCode SDK. Does not depend on `.opencode/` at build time.
- **Internal State (`.hivemind/`):** Durable persistence. Owned by `src/` modules through tool/hook CQRS boundaries. Canonical per Q6.
- **Meta-Authoring (`.hivefiver-meta-builder/`):** Source-of-truth for primitive authoring. Reflected to `.opencode/` via symlink or sync.
- **Governance (`.planning/`):** Documents architecture, provides phase authorization. Does not mutate `.opencode/`.
- **OMO Adaptation:** Per `.planning/research/omo-adaptation-architecture-2026-05-07.md`, OMO folder roots (`.sisyphus`, `.omx`) are REJECTED; `.opencode/` remains primitives-only.

</system-reminder>
Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/spec.md"}
<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/spec.md</path>
<type>file</type>
<content>
1: # Phase Spec Template
2: 
3: Template for `.planning/phases/XX-name/{phase_num}-SPEC.md` — locks requirements before discuss-phase.
4: 
5: **Purpose:** Capture WHAT a phase delivers and WHY, with enough precision that requirements are falsifiable. discuss-phase reads this file and focuses on HOW to implement (skipping "what/why" questions already answered here).
6: 
7: **Key principle:** Every requirement must be falsifiable — you can write a test or check that proves it was met or not. Vague requirements like "improve performance" are not allowed.
8: 
9: **Downstream consumers:**
10: - `discuss-phase` — reads SPEC.md at startup; treats Requirements, Boundaries, and Acceptance Criteria as locked; skips "what/why" questions
11: - `gsd-planner` — reads locked requirements to constrain plan scope
12: - `gsd-verifier` — uses acceptance criteria as explicit pass/fail checks
13: 
14: ---
15: 
16: ## File Template
17: 
18: ```markdown
19: # Phase [X]: [Name] — Specification
20: 
21: **Created:** [date]
22: **Ambiguity score:** [score] (gate: ≤ 0.20)
23: **Requirements:** [N] locked
24: 
25: ## Goal
26: 
27: [One precise sentence — specific and measurable. NOT "improve X" — instead "X changes from A to B".]
28: 
29: ## Background
30: 
31: [Current state from codebase — what exists today, what's broken or missing, what triggers this work. Grounded in code reality, not abstract description.]
32: 
33: ## Requirements
34: 
35: 1. **[Short label]**: [Specific, testable statement.]
36:    - Current: [what exists or does NOT exist today]
37:    - Target: [what it should become after this phase]
38:    - Acceptance: [concrete pass/fail check — how a verifier confirms this was met]
39: 
40: 2. **[Short label]**: [Specific, testable statement.]
41:    - Current: [what exists or does NOT exist today]
42:    - Target: [what it should become after this phase]
43:    - Acceptance: [concrete pass/fail check]
44: 
45: [Continue for all requirements. Each must have Current/Target/Acceptance.]
46: 
47: ## Boundaries
48: 
49: **In scope:**
50: - [Explicit list of what this phase produces]
51: - [Each item is a concrete deliverable or behavior]
52: 
53: **Out of scope:**
54: - [Explicit list of what this phase does NOT do] — [brief reason why it's excluded]
55: - [Adjacent problems excluded from this phase] — [brief reason]
56: 
57: ## Constraints
58: 
59: [Performance, compatibility, data volume, dependency, or platform constraints.
60: If none: "No additional constraints beyond standard project conventions."]
61: 
62: ## Acceptance Criteria
63: 
64: - [ ] [Pass/fail criterion — unambiguous, verifiable]
65: - [ ] [Pass/fail criterion]
66: - [ ] [Pass/fail criterion]
67: 
68: [Every acceptance criterion must be a checkbox that resolves to PASS or FAIL.
69: No "should feel good", "looks reasonable", or "generally works" — those are not checkboxes.]
70: 
71: ## Ambiguity Report
72: 
73: | Dimension          | Score | Min  | Status | Notes                              |
74: |--------------------|-------|------|--------|------------------------------------|
75: | Goal Clarity       |       | 0.75 |        |                                    |
76: | Boundary Clarity   |       | 0.70 |        |                                    |
77: | Constraint Clarity |       | 0.65 |        |                                    |
78: | Acceptance Criteria|       | 0.70 |        |                                    |
79: | **Ambiguity**      |       | ≤0.20|        |                                    |
80: 
81: Status: ✓ = met minimum, ⚠ = below minimum (planner treats as assumption)
82: 
83: ## Interview Log
84: 
85: [Key decisions made during the Socratic interview. Format: round → question → answer → decision locked.]
86: 
87: | Round | Perspective    | Question summary         | Decision locked                    |
88: |-------|----------------|-------------------------|------------------------------------|
89: | 1     | Researcher     | [what was asked]        | [what was decided]                 |
90: | 2     | Simplifier     | [what was asked]        | [what was decided]                 |
91: | 3     | Boundary Keeper| [what was asked]        | [what was decided]                 |
92: 
93: [If --auto mode: note "auto-selected" decisions with the reasoning the agent used.]
94: 
95: ---
96: 
97: *Phase: [XX-name]*
98: *Spec created: [date]*
99: *Next step: /gsd-discuss-phase [X] — implementation decisions (how to build what's specified above)*
100: ```
101: 
102: <good_examples>
103: 
104: **Example 1: Feature addition (Post Feed)**
105: 
106: ```markdown
107: # Phase 3: Post Feed — Specification
108: 
109: **Created:** 2025-01-20
110: **Ambiguity score:** 0.12
111: **Requirements:** 4 locked
112: 
113: ## Goal
114: 
115: Users can scroll through posts from accounts they follow, with new posts available after pull-to-refresh.
116: 
117: ## Background
118: 
119: The database has a `posts` table and `follows` table. No feed query or feed UI exists today. The home screen shows a placeholder "Your feed will appear here." This phase builds the feed query, API endpoint, and the feed list component.
120: 
121: ## Requirements
122: 
123: 1. **Feed query**: Returns posts from followed accounts ordered by creation time, descending.
124:    - Current: No feed query exists — `posts` table is queried directly only from profile pages
125:    - Target: `GET /api/feed` returns paginated posts from followed accounts, newest first, max 20 per page
126:    - Acceptance: Query returns correct posts for a user who follows 3 accounts with known post counts; cursor-based pagination advances correctly
127: 
128: 2. **Feed display**: Posts display in a scrollable card list.
129:    - Current: Home screen shows static placeholder text
130:    - Target: Home screen renders feed cards with author, timestamp, post content, and reaction count
131:    - Acceptance: Feed renders without error for 0 posts (empty state shown), 1 post, and 20+ posts
132: 
133: 3. **Pull-to-refresh**: User can refresh the feed manually.
134:    - Current: No refresh mechanism exists
135:    - Target: Pull-down gesture triggers refetch; new posts appear at top of list
136:    - Acceptance: After a new post is created in test, pull-to-refresh shows the new post without full app restart
137: 
138: 4. **New posts indicator**: When new posts arrive, a banner appears instead of auto-scrolling.
139:    - Current: No such mechanism
140:    - Target: "3 new posts" banner appears when refetch returns posts newer than the oldest visible post; tapping banner scrolls to top and shows new posts
141:    - Acceptance: Banner appears for ≥1 new post, does not appear when no new posts, tap navigates to top
142: 
143: ## Boundaries
144: 
145: **In scope:**
146: - Feed query (backend) — posts from followed accounts, paginated
147: - Feed list UI (frontend) — post cards with author, timestamp, content, reaction counts
148: - Pull-to-refresh gesture
149: - New posts indicator banner
150: - Empty state when user follows no one or no posts exist
151: 
152: **Out of scope:**
153: - Creating posts — that is Phase 4
154: - Reacting to posts — that is Phase 5
155: - Following/unfollowing accounts — that is Phase 2 (already done)
156: - Push notifications for new posts — separate backlog item
157: 
158: ## Constraints
159: 
160: - Feed query must use cursor-based pagination (not offset) — the database has 500K+ posts and offset pagination is unacceptably slow beyond page 3
161: - The feed card component must reuse the existing `<AvatarImage>` component from Phase 2
162: 
163: ## Acceptance Criteria
164: 
165: - [ ] `GET /api/feed` returns posts only from followed accounts (not all posts)
166: - [ ] `GET /api/feed` supports `cursor` parameter for pagination
167: - [ ] Feed renders correctly at 0, 1, and 20+ posts
168: - [ ] Pull-to-refresh triggers refetch
169: - [ ] New posts indicator appears when posts newer than current view exist
170: - [ ] Empty state renders when user follows no one
171: 
172: ## Ambiguity Report
173: 
174: | Dimension          | Score | Min  | Status | Notes                            |
175: |--------------------|-------|------|--------|----------------------------------|
176: | Goal Clarity       | 0.92  | 0.75 | ✓      |                                  |
177: | Boundary Clarity   | 0.95  | 0.70 | ✓      | Explicit out-of-scope list       |
178: | Constraint Clarity | 0.80  | 0.65 | ✓      | Cursor pagination required       |
179: | Acceptance Criteria| 0.85  | 0.70 | ✓      | 6 pass/fail criteria             |
180: | **Ambiguity**      | 0.12  | ≤0.20| ✓      |                                  |
181: 
182: ## Interview Log
183: 
184: | Round | Perspective     | Question summary              | Decision locked                         |
185: |-------|-----------------|------------------------------|-----------------------------------------|
186: | 1     | Researcher      | What exists in posts today?  | posts + follows tables exist, no feed  |
187: | 2     | Simplifier      | Minimum viable feed?         | Cards + pull-refresh, no auto-scroll   |
188: | 3     | Boundary Keeper | What's NOT this phase?       | Creating posts, reactions out of scope |
189: | 3     | Boundary Keeper | What does done look like?    | Scrollable feed with 4 card fields     |
190: 
191: ---
192: 
193: *Phase: 03-post-feed*
194: *Spec created: 2025-01-20*
195: *Next step: /gsd-discuss-phase 3 — implementation decisions (card layout, loading skeleton, etc.)*
196: ```
197: 
198: **Example 2: CLI tool (Database backup)**
199: 
200: ```markdown
201: # Phase 2: Backup Command — Specification
202: 
203: **Created:** 2025-01-20
204: **Ambiguity score:** 0.15
205: **Requirements:** 3 locked
206: 
207: ## Goal
208: 
209: A `gsd backup` CLI command creates a reproducible database snapshot that can be restored by `gsd restore` (a separate phase).
210: 
211: ## Background
212: 
213: No backup tooling exists. The project uses PostgreSQL. Developers currently use `pg_dump` manually — there is no standardized process, no output naming convention, and no CI integration. Three incidents in the last quarter involved restoring from wrong or corrupt dumps.
214: 
215: ## Requirements
216: 
217: 1. **Backup creation**: CLI command executes a full database backup.
218:    - Current: No `backup` subcommand exists in the CLI
219:    - Target: `gsd backup` connects to the database (via `DATABASE_URL` env or `--db` flag), runs pg_dump, writes output to `./backups/YYYY-MM-DD_HH-MM-SS.dump`
220:    - Acceptance: Running `gsd backup` on a test database creates a `.dump` file; running `pg_restore` on that file recreates the database without error
221: 
222: 2. **Network retry**: Transient network failures are retried automatically.
223:    - Current: pg_dump fails immediately on network error
224:    - Target: Backup retries up to 3 times with 5-second delay; 4th failure exits with code 1 and a message to stderr
225:    - Acceptance: Simulating 2 sequential network failures causes 2 retries then success; simulating 4 failures causes exit code 1 and stderr message
226: 
227: 3. **Partial cleanup**: Failed backups do not leave corrupt files.
228:    - Current: Manual pg_dump leaves partial files on failure
229:    - Target: If backup fails after starting, the partial `.dump` file is deleted before exit
230:    - Acceptance: After a simulated failure mid-dump, no `.dump` file exists in `./backups/`
231: 
232: ## Boundaries
233: 
234: **In scope:**
235: - `gsd backup` subcommand (full dump only)
236: - Output to `./backups/` directory (created if missing)
237: - Network retry (3 attempts)
238: - Partial file cleanup on failure
239: 
240: **Out of scope:**
241: - `gsd restore` — that is Phase 3
242: - Incremental backups — separate backlog item (full dump only for now)
243: - S3 or remote storage — separate backlog item
244: - Encryption — separate backlog item
245: - Scheduled/cron backups — separate backlog item
246: 
247: ## Constraints
248: 
249: - Must use `pg_dump` (not a custom query) — ensures compatibility with standard `pg_restore`
250: - `--no-retry` flag must be available for CI use (fail fast, no retries)
251: 
252: ## Acceptance Criteria
253: 
254: - [ ] `gsd backup` creates a `.dump` file in `./backups/YYYY-MM-DD_HH-MM-SS.dump` format
255: - [ ] `gsd backup` uses `DATABASE_URL` env var or `--db` flag for connection
256: - [ ] 3 retries on network failure, then exit code 1 with stderr message
257: - [ ] `--no-retry` flag skips retries and fails immediately on first error
258: - [ ] No partial `.dump` file left after a failed backup
259: 
260: ## Ambiguity Report
261: 
262: | Dimension          | Score | Min  | Status | Notes                          |
263: |--------------------|-------|------|--------|--------------------------------|
264: | Goal Clarity       | 0.90  | 0.75 | ✓      |                                |
265: | Boundary Clarity   | 0.95  | 0.70 | ✓      | Explicit out-of-scope list     |
266: | Constraint Clarity | 0.75  | 0.65 | ✓      | pg_dump required               |
267: | Acceptance Criteria| 0.80  | 0.70 | ✓      | 5 pass/fail criteria           |
268: | **Ambiguity**      | 0.15  | ≤0.20| ✓      |                                |
269: 
270: ## Interview Log
271: 
272: | Round | Perspective     | Question summary              | Decision locked                         |
273: |-------|-----------------|------------------------------|-----------------------------------------|
274: | 1     | Researcher      | What backup tooling exists?  | None — pg_dump manual only             |
275: | 2     | Simplifier      | Minimum viable backup?       | Full dump only, local only             |
276: | 3     | Boundary Keeper | What's NOT this phase?       | Restore, S3, encryption excluded       |
277: | 4     | Failure Analyst | What goes wrong on failure?  | Partial files, CI fail-fast needed     |
278: 
279: ---
280: 
281: *Phase: 02-backup-command*
282: *Spec created: 2025-01-20*
283: *Next step: /gsd-discuss-phase 2 — implementation decisions (progress reporting, flag design, etc.)*
284: ```
285: 
286: </good_examples>
287: 
288: <guidelines>
289: **Every requirement needs all three fields:**
290: - Current: grounds the requirement in reality — what exists today?
291: - Target: the concrete change — not "improve X" but "X becomes Y"
292: - Acceptance: the falsifiable check — how does a verifier confirm this?
293: 
294: **Ambiguity Report must reflect the actual interview.** If a dimension is below minimum, mark it ⚠ — the planner knows to treat it as an assumption rather than a locked requirement.
295: 
296: **Interview Log is evidence of rigor.** Don't skip it. It shows that requirements came from discovery, not assumption.
297: 
298: **Boundaries protect the phase from scope creep.** The out-of-scope list with reasoning is as important as the in-scope list. Future phases that touch adjacent areas can point to this SPEC.md to understand what was intentionally excluded.
299: 
300: **SPEC.md is a one-way door for requirements.** discuss-phase will treat these as locked. If requirements change after SPEC.md is written, the user should update SPEC.md first, then re-run discuss-phase.
301: 
302: **SPEC.md does NOT replace CONTEXT.md.** They serve different purposes:
303: - SPEC.md: what the phase delivers (requirements, boundaries, acceptance criteria)
304: - CONTEXT.md: how the phase will be implemented (decisions, patterns, tradeoffs)
305: 
306: discuss-phase generates CONTEXT.md after reading SPEC.md.
307: </guidelines>

(End of file - total 307 lines)
</content>

<system-reminder>
Instructions from: /Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/CONTEXT.md
# Phase Context Template

Template for `.planning/phases/XX-name/{phase_num}-CONTEXT.md` - captures implementation decisions for a phase.

**Purpose:** Document decisions that downstream agents need. Researcher uses this to know WHAT to investigate. Planner uses this to know WHAT choices are locked vs flexible.

**Key principle:** Categories are NOT predefined. They emerge from what was actually discussed for THIS phase. A CLI phase has CLI-relevant sections, a UI phase has UI-relevant sections.

**Downstream consumers:**
- `gsd-phase-researcher` — Reads decisions to focus research (e.g., "card layout" → research card component patterns)
- `gsd-planner` — Reads decisions to create specific tasks (e.g., "infinite scroll" → task includes virtualization)

---

## File Template

```markdown
# Phase [X]: [Name] - Context

**Gathered:** [date]
**Status:** Ready for planning

<domain>
## Phase Boundary

[Clear statement of what this phase delivers — the scope anchor. This comes from ROADMAP.md and is fixed. Discussion clarifies implementation within this boundary.]

</domain>

<decisions>
## Implementation Decisions

### [Area 1 that was discussed]
- **D-01:** [Specific decision made]
- **D-02:** [Another decision if applicable]

### [Area 2 that was discussed]
- **D-03:** [Specific decision made]

### [Area 3 that was discussed]
- **D-04:** [Specific decision made]

### the agent's Discretion
[Areas where user explicitly said "you decide" — the agent has flexibility here during planning/implementation]

</decisions>

<specifics>
## Specific Ideas

[Any particular references, examples, or "I want it like X" moments from discussion. Product references, specific behaviors, interaction patterns.]

[If none: "No specific requirements — open to standard approaches"]

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

[List every spec, ADR, feature doc, or design doc that defines requirements or constraints for this phase. Use full relative paths so agents can read them directly. Group by topic area when the phase has multiple concerns.]

### [Topic area 1]
- `path/to/spec-or-adr.md` — [What this doc decides/defines that's relevant]
- `path/to/doc.md` §N — [Specific section and what it covers]

### [Topic area 2]
- `path/to/feature-doc.md` — [What capability this defines]

[If the project has no external specs: "No external specs — requirements are fully captured in decisions above"]

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- [Component/hook/utility]: [How it could be used in this phase]

### Established Patterns
- [Pattern]: [How it constrains/enables this phase]

### Integration Points
- [Where new code connects to existing system]

</code_context>

<deferred>
## Deferred Ideas

[Ideas that came up during discussion but belong in other phases. Captured here so they're not lost, but explicitly out of scope for this phase.]

[If none: "None — discussion stayed within phase scope"]

</deferred>

---

*Phase: XX-name*
*Context gathered: [date]*
```

<good_examples>

**Example 1: Visual feature (Post Feed)**

```markdown
# Phase 3: Post Feed - Context

**Gathered:** 2025-01-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Display posts from followed users in a scrollable feed. Users can view posts and see engagement counts. Creating posts and interactions are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Layout style
- Card-based layout, not timeline or list
- Each card shows: author avatar, name, timestamp, full post content, reaction counts
- Cards have subtle shadows, rounded corners — modern feel

### Loading behavior
- Infinite scroll, not pagination
- Pull-to-refresh on mobile
- New posts indicator at top ("3 new posts") rather than auto-inserting

### Empty state
- Friendly illustration + "Follow people to see posts here"
- Suggest 3-5 accounts to follow based on interests

### the agent's Discretion
- Loading skeleton design
- Exact spacing and typography
- Error state handling

</decisions>

<canonical_refs>
## Canonical References

### Feed display
- `docs/features/social-feed.md` — Feed requirements, post card fields, engagement display rules
- `docs/decisions/adr-012-infinite-scroll.md` — Scroll strategy decision, virtualization requirements

### Empty states
- `docs/design/empty-states.md` — Empty state patterns, illustration guidelines

</canonical_refs>

<specifics>
## Specific Ideas

- "I like how Twitter shows the new posts indicator without disrupting your scroll position"
- Cards should feel like Linear's issue cards — clean, not cluttered

</specifics>

<deferred>
## Deferred Ideas

- Commenting on posts — Phase 5
- Bookmarking posts — add to backlog

</deferred>

---

*Phase: 03-post-feed*
*Context gathered: 2025-01-20*
```

**Example 2: CLI tool (Database backup)**

```markdown
# Phase 2: Backup Command - Context

**Gathered:** 2025-01-20
**Status:** Ready for planning

<domain>
## Phase Boundary

CLI command to backup database to local file or S3. Supports full and incremental backups. Restore command is a separate phase.

</domain>

<decisions>
## Implementation Decisions

### Output format
- JSON for programmatic use, table format for humans
- Default to table, --json flag for JSON
- Verbose mode (-v) shows progress, silent by default

### Flag design
- Short flags for common options: -o (output), -v (verbose), -f (force)
- Long flags for clarity: --incremental, --compress, --encrypt
- Required: database connection string (positional or --db)

### Error recovery
- Retry 3 times on network failure, then fail with clear message
- --no-retry flag to fail fast
- Partial backups are deleted on failure (no corrupt files)

### the agent's Discretion
- Exact progress bar implementation
- Compression algorithm choice
- Temp file handling

</decisions>

<canonical_refs>
## Canonical References

### Backup CLI
- `docs/features/backup-restore.md` — Backup requirements, supported backends, encryption spec
- `docs/decisions/adr-007-cli-conventions.md` — Flag naming, exit codes, output format standards

</canonical_refs>

<specifics>
## Specific Ideas

- "I want it to feel like pg_dump — familiar to database people"
- Should work in CI pipelines (exit codes, no interactive prompts)

</specifics>

<deferred>
## Deferred Ideas

- Scheduled backups — separate phase
- Backup rotation/retention — add to backlog

</deferred>

---

*Phase: 02-backup-command*
*Context gathered: 2025-01-20*
```

**Example 3: Organization task (Photo library)**

```markdown
# Phase 1: Photo Organization - Context

**Gathered:** 2025-01-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Organize existing photo library into structured folders. Handle duplicates and apply consistent naming. Tagging and search are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Grouping criteria
- Primary grouping by year, then by month
- Events detected by time clustering (photos within 2 hours = same event)
- Event folders named by date + location if available

### Duplicate handling
- Keep highest resolution version
- Move duplicates to _duplicates folder (don't delete)
- Log all duplicate decisions for review

### Naming convention
- Format: YYYY-MM-DD_HH-MM-SS_originalname.ext
- Preserve original filename as suffix for searchability
- Handle name collisions with incrementing suffix

### the agent's Discretion
- Exact clustering algorithm
- How to handle photos with no EXIF data
- Folder emoji usage

</decisions>

<canonical_refs>
## Canonical References

### Organization rules
- `docs/features/photo-organization.md` — Grouping rules, duplicate policy, naming spec
- `docs/decisions/adr-003-exif-handling.md` — EXIF extraction strategy, fallback for missing metadata

</canonical_refs>

<specifics>
## Specific Ideas

- "I want to be able to find photos by roughly when they were taken"
- Don't delete anything — worst case, move to a review folder

</specifics>

<deferred>
## Deferred Ideas

- Face detection grouping — future phase
- Cloud sync — out of scope for now

</deferred>

---

*Phase: 01-photo-organization*
*Context gathered: 2025-01-20*
```

</good_examples>

<guidelines>
**This template captures DECISIONS for downstream agents.**

The output should answer: "What does the researcher need to investigate? What choices are locked for the planner?"

**Good content (concrete decisions):**
- "Card-based layout, not timeline"
- "Retry 3 times on network failure, then fail"
- "Group by year, then by month"
- "JSON for programmatic use, table for humans"

**Bad content (too vague):**
- "Should feel modern and clean"
- "Good user experience"
- "Fast and responsive"
- "Easy to use"

**After creation:**
- File lives in phase directory: `.planning/phases/XX-name/{phase_num}-CONTEXT.md`
- `gsd-phase-researcher` uses decisions to focus investigation AND reads canonical_refs to know WHAT docs to study
- `gsd-planner` uses decisions + research to create executable tasks AND reads canonical_refs to verify alignment
- Downstream agents should NOT need to ask the user again about captured decisions

**CRITICAL — Canonical references:**
- The `<canonical_refs>` section is MANDATORY. Every CONTEXT.md must have one.
- If your project has external specs, ADRs, or design docs, list them with full relative paths grouped by topic
- If ROADMAP.md lists `Canonical refs:` per phase, extract and expand those
- Inline mentions like "see ADR-019" scattered in decisions are useless to downstream agents — they need full paths and section references in a dedicated section they can find
- If no external specs exist, say so explicitly — don't silently omit the section
</guidelines>

</system-reminder>

### Tool: bash

**Input:**
```json
{
  "callID": "call_00_IEOuvQJyLoGJx1jrI9d72779"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_5PmtwZfQl4d8ukAgZtMh0975"
}
```


### Tool: write

**Input:**
```json
{
  "callID": "call_00_qbdzJCCuJnNDScVRhPbv8668"
}
```


### Tool: write

**Input:**
```json
{
  "callID": "call_00_AMSiSdARNM6TflL6zpjS2913"
}
```


### Tool: write

**Input:**
```json
{
  "callID": "call_01_L8169wyePvr9x97wNUEB2552"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_peZqtp98NuhmUSHJPz1A0251"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_4VZZtT5sLluDLrSK6V474433"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_IvVdXtZkO9OqYAhB13ex2653"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_RE8vvkn6GK7GMjqMjS1U7591"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/ROADMAP.md"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_00_ET_N1dCmg4CD00iKPYFnUgy0530"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_pMLbO1iAzpAw9cxp49yL6698"
}
```


## USER (turn 12)

**source:** real-human

delegate gsd- agent research đúng quy trình của GSD tương tự như vậy với SPEC tôi không chấp nhận việc làm foreground không chính xác này

### Tool: bash

**Input:**
```json
{
  "callID": "call_00_fsb7EkOPXuSY9Z4ScrKB8162"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_xgwSiv7NbrEZ64QLwy4R3647"
}
```


## USER (turn 13)

**source:** real-human

yêu cầu sử dụng đúng gsd agents

### Tool: task

**Input:**
```json
{
  "description": "Run GSD spec-phase for Phase 15",
  "subagent_type": "general",
  "task_id": "ses_1bf39fb36ffeqphcNa9mMRpRkl"
}
```

**Output:** (pruned)
```
task_id: ses_1bf39fb36ffeqphcNa9mMRpRkl
```


## USER (turn 14)

**source:** real-human

không dùng general

### Tool: bash

**Input:**
```json
{
  "callID": "call_00_wW7AOZYDCGDfKnySQTVy3379"
}
```


## USER (turn 15)

**source:** real-human

tôi không thấy nghiên cứu sử dụng context7, deepwiki hay repomix để xác nhận đúng interfaces và methods thực hiện lại research và spec đồng thời xây dựng thêm PATTERNS.md

### Tool: task

**Input:**
```json
{
  "description": "Research Phase 15 implementation approach",
  "subagent_type": "gsd-phase-researcher",
  "task_id": "ses_1bf35819fffebNQHziOkqeHIYh"
}
```

**Output:** (pruned)
```
task_id: ses_1bf35819fffebNQHziOkqeHIYh
```


### Tool: context7_resolve-library-id

**Input:**
```json
{
  "callID": "call_00_xTY9Hd53o3X9lyGnOftB7780"
}
```


### Tool: deepwiki_read_wiki_structure

**Input:**
```json
{
  "callID": "call_01_S1gsWq9uJfPgxWDPWG8d2243"
}
```


### Tool: deepwiki_read_wiki_contents

**Input:**
```json
{
  "callID": "call_01_hHcu5cYZUwB7RgxCQQoF3698"
}
```


### Tool: context7_query-docs

**Input:**
```json
{
  "callID": "call_00_79XvVRrFRP7YQp0r9t1B2894"
}
```


### Tool: deepwiki_read_wiki_structure

**Input:**
```json
{
  "callID": "call_00_BIqEsF2zGE2Tg8nMwnrQ6836"
}
```


### Tool: context7_query-docs

**Input:**
```json
{
  "callID": "call_01_AOat7QVh2FTI8XmUi4SS3208"
}
```


### Tool: deepwiki_read_wiki_contents

**Input:**
```json
{
  "callID": "call_00_BQ5GBdls3Cy5Oe7lYk4m0733"
}
```


### Tool: context7_query-docs

**Input:**
```json
{
  "callID": "call_01_qow57WyVYKgvqxuwTncJ9980"
}
```


### Tool: task

**Input:**
```json
{
  "description": "GSD research Phase 15 with SDK validation",
  "subagent_type": "gsd-phase-researcher",
  "task_id": "ses_1bf2f1b3bffeTsuQE7q6BFEyYR"
}
```

**Output:** (pruned)
```
task_id: ses_1bf2f1b3bffeTsuQE7q6BFEyYR
```


## USER (turn 16)

**source:** real-human

bây giờ hãy tiếp tục gới gsd-planner agent tự động route command gsd planning phase để thực hiện việc planning sau đó hãy verify lại các plans này

### Tool: task

**Input:**
```json
{
  "description": "Map Phase 15 code patterns",
  "subagent_type": "gsd-pattern-mapper",
  "task_id": "ses_1bf29d458ffe04FRFuUpvmnYnc"
}
```

**Output:** (pruned)
```
task_id: ses_1bf29d458ffe04FRFuUpvmnYnc
```


## USER (turn 18)

**source:** real-human

bây giờ hãy tiếp tục gới gsd-planner agent tự động route command gsd planning phase để thực hiện việc planning sau đó hãy verify lại các plans này - đảm bảo chúng nó đúng context, research và cover đầy đủ specs và patterns

### Tool: task

**Input:**
```json
{
  "description": "GSD planner Phase 15 plans",
  "subagent_type": "gsd-planner",
  "task_id": "ses_1bf2691cbffeDB8PisaVQx2mja"
}
```

**Output:** (pruned)
```
task_id: ses_1bf2691cbffeDB8PisaVQx2mja
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_SLNu3C1HG8IsnIoqsYZY3270"
}
```


## USER (turn 19)

**source:** real-human

hãy chạy verify plan đã nếu xảy ra blockers khắc phục nó sau đó mới chạy gsd-execute-phase

### Tool: task

**Input:**
```json
{
  "description": "GSD verify Phase 15 plans",
  "subagent_type": "gsd-plan-checker",
  "task_id": "ses_1bf1f4a27ffen39W2CIFs0whrf"
}
```

**Output:** (pruned)
```
task_id: ses_1bf1f4a27ffen39W2CIFs0whrf
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/15-phase-15-delegate-task-gap-remediation-resume-delivery-rich-/15-PLAN-VERIFICATION.md"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_01_hifHFJEFoKV9AdT0R4568030"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_02_KEfaJFNlD3M3FIOyckqi7174"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_wL4vgYxZsCd8R2Dvb2Xn2080"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/coordination/delegation/lifecycle.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/15-phase-15-delegate-task-gap-remediation-resume-delivery-rich-/15-01-PLAN.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/15-phase-15-delegate-task-gap-remediation-resume-delivery-rich-/15-05-PLAN.md"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_00_v17zNDAyNz39rQSw6NZX9400"
}
```


### Tool: write

**Input:**
```json
{
  "callID": "call_00_8leBR0S8IOYSwkkFmBeJ6561"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_00_UGU6mU61LMrITHspBjD90214"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/15-phase-15-delegate-task-gap-remediation-resume-delivery-rich-/15-PLAN-VERIFICATION.md"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_00_4mHkWMzgZl35R2jX2tlS3699"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_RvtuQFFBTv6d75YTr3ne3923"
}
```


### Tool: task

**Input:**
```json
{
  "description": "Execute Phase 15 all 5 plans",
  "subagent_type": "gsd-executor",
  "task_id": "ses_1bf19e937ffe2jhqzG61oQMYn8"
}
```

**Output:** (pruned)
```
task_id: ses_1bf19e937ffe2jhqzG61oQMYn8
```


## USER (turn 20)

**source:** real-human

không delegate như vậy lần lượt từng plan với atomic commit, gatekêeping và integration validation cho từng plan lần lượt

## USER (turn 21)

**source:** real-human

không delegate như vậy lần lượt từng plan với atomic commit, gatekêeping và integration validation cho từng plan lần lượt delegation to gsd-executor

### Tool: task

**Input:**
```json
{
  "description": "Execute Plan 15-01: resume/chain",
  "subagent_type": "gsd-executor",
  "task_id": "ses_1bf17e2daffe73iU6cLPznGh2F"
}
```

**Output:** (pruned)
```
task_id: ses_1bf17e2daffe73iU6cLPznGh2F
```

