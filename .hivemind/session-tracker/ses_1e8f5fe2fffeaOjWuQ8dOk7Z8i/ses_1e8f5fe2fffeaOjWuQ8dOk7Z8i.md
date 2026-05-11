---
sessionID: ses_1e8f5fe2fffeaOjWuQ8dOk7Z8i
created: 2026-05-11T12:36:32.351Z
updated: 2026-05-11T12:36:32.351Z
parentSessionID: null
delegationDepth: 0
children: []
continuityIndex: session-continuity.json
status: active
---

## USER (turn 1)

You are the subagent hf-l2-skill-builder. You are being delegated directly by hf-l0-orchestrator to create the `hivemind-power-on` core governance skill. You must follow this prompt exactly, knowing you are a subagent fulfilling a bounded task.

## TASK: Draft the complete `hivemind-power-on` governance SKILL.md and references

This is the MANDATORY project-level governance skill that ALL Hivemind L0 and L1 agents (hm-* and hf-* lineages) MUST load at session start. It governs session lifecycle, lineage routing, delegation chains, and context optimization.

## 1. INVESTIGATE FIRST (read these files):

Read these for structural patterns:
- `.opencode/skills/hf-l2-skill-router/SKILL.md`
- `.opencode/skills/hm-l2-lineage-router/SKILL.md`
- `.opencode/skills/hm-l2-user-intent-interactive-loop/SKILL.md`
- `.opencode/skills/hm-l2-coordinating-loop/SKILL.md`

Read these for session-tracker understanding:
- `src/tools/hivemind/session-tracker.ts` (full file — understand the tool API)
- `src/schema-kernel/session-tracker.schema.ts` (understand the schema)
- `.planning/phases/CP-ST-01-session-tracker-revamp/01-SPEC.md` (lines 1-110, sections 1-5 for file format specs)
- `.hivemind/session-tracker/project-continuity.json` (understand structure)
- `.hivemind/session-tracker/ses_1ebe832c5ffeeYuFbS1kqleZnD/session-continuity.json` (understand hierarchy)
- `.hivemind/session-tracker/ses_1e9a6ecf5ffev5trgNwpy4CjOf/session-continuity.json` (understand multi-child hierarchy)

## 2. WHAT TO CREATE

Write the complete skill at `.hivefiver-meta-builder/skills-lab/hivemind-power-on/SKILL.md` with these references as separate files under `references/`:

### SKILL.md — Body must be concise (<300 lines), structured as:

```yaml
---
name: hivemind-power-on
description: >-
  MUST-LOAD governance skill for ALL Hivemind L0 and L1 agents. Routes workflows 
  across hm-* and hf-* lineages, manages session lifecycle (start/resume/compact-survival), 
  orchestrates delegation chains, enforces quality gates, and optimizes context usage. 
  Load FIRST before any domain-specific skills. Triggers on session start, resume, 
  disconnect recovery, context compaction, or when lineage/workflow routing is needed.
version: 1.0.0
lineage: hivemind
load_priority: 1
---
```

**Section 1: Role & When To Load**
- Must load at: session start (new), session resume (disconnect), context compact/purge survival
- Loaded by: hm-l0-orchestrator, hf-l0-orchestrator, hm-l1-coordinator, hf-l1-coordinator (minimum)
- Also loaded by: L2/L3 agents on conditional need
- Loading priority: FIRST skill loaded, before any domain skills

**Section 2: Lineage Classification (Pattern 1 — High-Level)**
Rigid decision tree:
- Meta-concept work (create/audit/repair agents, skills, commands, tools) → hf-* lineage
- Product development (features, bugs, architecture, implementation) → hm-* lineage
- Command-prefix detection: /hf-* → hf-lineage, /plan → hm-lineage

**Section 3: Session Lifecycle Protocol (Pattern 3 — CRITICAL)**

**FRESH START protocol:**
1. Read `.hivemind/session-tracker/project-continuity.json`
2. If no active sessions → normal start
3. If active sessions exist → follow RESUME protocol below

**RESUME AFTER DISCONNECT protocol (EXACT steps — this is the #1 fix):**
```
Step 1: Read project-continuity.json → find sessions with status "active" (sorted by updated desc)
Step 2: For each active session, read its session-continuity.json → find children with status "active"  
Step 3: Identify DEEPEST aborted delegation (highest delegation_depth with active children)
Step 4: Use session-tracker tool: { action: "export-session", sessionId: "<root-id>" }
Step 5: grep the .md for "## USER (turn" to find last user intent
Step 6: Find EXACT task_id of aborted delegation from step 2-3
Step 7: Resume with EXACT task_id: task(description="resume", subagent_type="<SAME>", task_id="<EXACT-ID>")
Step 8: NEVER start a new session ID. NEVER repeat the prompt. Context is preserved.

L0→L1 CASCADE: When L0 resumes, instruct L1:
  "You are resuming a L1 session. Check your session-continuity.json for aborted L2 children.
   Resume them with EXACT task_id. DO NOT start new. DO NOT repeat prompt."
```

**COMPACT/PURGE SURVIVAL protocol:**
```
1. Export current session: session-tracker(action: "export-session", sessionId: current)
2. Read project-continuity.json → find current session
3. Load session-continuity.json → active delegation tree
4. Read most recent ## USER turn from .md (grep + offset)
5. Reconstruct: last user intent + active delegations + task_ids
```

**Section 4: Session-Tracker Tool Cheat Sheet**
Precise tool invocations without fluff:
```
Find all sessions:     session-tracker(action: "list-sessions")
Export session:        session-tracker(action: "export-session", sessionId: "ses_xxx")
Search for aborts:     session-tracker(action: "search-sessions", query: "aborted|cancelled")
Read hierarchy:        read(".../<session_id>/session-continuity.json")
Line-aware grep:       grep(pattern: "## USER \\(turn", include: "*.md")
Line-aware read:       read(filePath, offset=N, limit=M)
```

**Section 5: Delegation Chain Protocol**
L0 delegates L1 delegates L2 (max 3 levels).
Record: task_id → agent → status.
NEVER dispatch directly to L2 (L0→L1→L2 only, except when user explicitly overrides).
After disconnect: ONLY resume, never restart.

**Section 6: Quality Gate Integration**
Every delegation: lifecycle → spec → evidence.
Load: gate-l3-lifecycle-integration, gate-l3-spec-compliance, gate-l3-evidence-truth.
FAIL → return with gaps (max 3 retries). FAIL 3x → escalate to user.

**Section 7: Context Optimization**
- NEVER read full AGENTS.md — use frontmatter/grep
- NEVER read full .md session files — use grep + offset
- NEVER load >3 skills at once
- At 70% context: export via session-tracker, checkpoint
- Use prompt-skim for large prompts before analysis

**Section 8: Cross-Lineage Bridges**
- hf-*: FLEXIBLE — may load hm-* for codebase investigation (document reason)
- hm-*: STRICT — no hf-* unless explicitly routed by hf-orchestrator
- Document all cross-lineage access

**IRON LAWS (must be prominent):**
1. NEVER start new session when aborted exists. Use EXACT task_id.
2. NEVER repeat prompt when resuming. Context is preserved.
3. NEVER dispatch directly to L2 (L0→L1→L2 always).
4. NEVER skip quality gate triad.
5. NEVER load >3 skills at once.
6. NEVER read full files when grep/offset works.
7. ALWAYS use session-tracker to find aborted sessions before starting fresh.

### REFERENCES (separate files):

**references/01-session-tracker-anatomy.md** — Directory structure, how to navigate, filter for aborted, read efficiently. Document exact JSON schemas from project-continuity and session-continuity. Explain status fields (active/idle/completed/error).

**references/02-task-tool-resume.md** — OpenCode task tool parameters for resume. Explain task_id IS session ID. Show exact JSON input format. Explain that prompt should be omitted or minimal when resuming (context preserved). Show how session-tracker captures task_id from tool.execute.after.

**references/03-lineage-routing-tree.md** — Complete decision tree for hm-vs-hf classification with examples. Command prefix routing. Cross-lineage rules.

**references/04-project-phase-routing.md** — Map project phases to correct hm-* specialist workflows. Planning→planner, Implementation→executor, Audit→auditor, Meta-builder→hf-builder.

**references/05-continuity-navigation.md** — How to traverse project-continuity.json and session-continuity.json. Explain field meanings. Show how to find deepest active delegation. Show how to trace parent→child chains.

**references/06-delegation-depth-recovery.md** — Multi-level recovery cascade. L0 resumes L1, L1 resumes L2, etc. Show worked examples with real session IDs from the tracker.

## 3. KEY CONSTRAINTS

- The SKILL.md body must be thin and actionable — agents load this at startup, every word costs context
- References provide depth on demand
- Use EXACT tool invocations — no hand-waving
- All protocols must be falsifiable (agent can verify if they followed correctly)
- The RESUME protocol is the #1 deliverable — it must be so precise that an agent cannot get it wrong
- Match the structural patterns of existing skills (hf-l2-skill-router, hm-l2-user-intent-interactive-loop)

## 4. VALIDATION

Before returning:
1. Verify naming follows hf-l2-naming-syndicate conventions
2. Verify all tool names and parameters match the actual API (check against session-tracker.ts source)
3. Verify all JSON field names match the actual schema (check against session-continuity.json files)
4. Verify the RESUME protocol would work with the real session-tracker data you see on disk

## 5. OUTPUT

Return:
1. The complete SKILL.md content
2. The content for each references/*.md file  
3. File path where SKILL.md was written
4. Confirmation that all tool references match actual APIs

### Tool: skill

**Input:**
```json
{
  "name": "hf-l2-use-authoring-skills"
}
```

**Output:** (pruned)
```
# Skill: hf-l2-use-authoring-skills
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/skills/hf-l2-skill-router/SKILL.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-lineage-router/SKILL.md"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-lineage-router/SKILL.md</path>
<type>file</type>
<content>
1: ---
2: name: hm-l2-lineage-router
3: description: >
4:   Route tasks to correct hm-* skills based on intent classification. Maps task categories to skill
5:   loading bundles. Use when an agent needs to determine which hm-* skills to load for a given task.
6:   Triggers: "route task", "classify intent", "which skill to load", "task routing", "lineage routing",
7:   "skill bundle for task", "load skills for", "what skills do I need", "skill loading order",
8:   "determine skill lineage", "map task to skills", "skill selection for workflow".
9:   NOT for executing skills — only for determining which skills to load. Max 5 skills per bundle.
10: metadata:
11:   layer: "2"
12:   role: "domain-execution"
13:   pattern: P2
14:   version: "1.0.0"
15:   lineage: "hm-*"
16:   task-group: "how-to-implement"
17:   routes-to: ["hm-*"]
18:   input-from: ["hm-*"]
19:   consumed-by: ["hm-coordinating-loop", "hm-phase-execution", "hm-phase-loop", "hm-subagent-delegation-patterns"]
20: allowed-tools:
21:   - Read
22:   - Glob
23:   - Grep
24: ---
25: 
26: ## The Iron Law
27: 
28: ```
29: Every task has a lineage. Route to the bundle that matches the task's category. Max 5 skills per bundle.
30: ```
31: 
32: # Lineage Router
33: 
34: ## Overview
35: 
36: Given a task intent, determine which hm-* skills should be loaded. This skill maps task categories to skill loading bundles. It does NOT execute skills — it only determines which skills to load and in what order.
37: 
38: **Six task categories, six skill bundles:**
39: 
40: | Category | Skills | Max |
41: |----------|--------|-----|
42: | Research | hm-detective + hm-deep-research + hm-tech-stack-ingest | 3 |
43: | Planning | hm-spec-driven-authoring + hm-planning-persistence | 2 |
44: | Execution | hm-phase-execution + hm-cross-cutting-change | 2 |
45: | Quality | hm-test-driven-execution + hm-gate-orchestrator | 2 |
46: | Debug | hm-debug + hm-completion-looping | 2 |
47: | Review | hm-production-readiness + hm-gate-orchestrator | 2 |
48: 
49: ## On Load
50: 
51: 1. Read `references/routing-map.md` — the complete routing map with priority ordering and dependency chains
52: 2. Identify the task intent from the current context
53: 3. Classify the task into one of the six categories
54: 
55: ## Trigger Phrases
56: 
57: - "route task" / "route this task"
58: - "classify intent" / "classify task intent"
59: - "which skill to load" / "what skills do I need"
60: - "task routing" / "lineage routing"
61: - "skill bundle for task" / "load skills for"
62: - "skill loading order" / "determine skill lineage"
63: - "map task to skills" / "skill selection for workflow"
64: 
65: ## Routing Map
66: 
67: ### Category 1: Research Tasks
68: 
69: **Intent signals:** "investigate", "research", "find out", "analyze", "look into", "explore"
70: 
71: | Priority | Skill | Role |
72: |----------|-------|------|
73: | 1 | `hm-detective` | Codebase investigation (SCAN/READ/DEEP modes) |
74: | 2 | `hm-deep-research` | Version-matched deep research with citations |
75: | 3 | `hm-tech-stack-ingest` | Cache third-party docs for offline reference |
76: 
77: **Loading order:** hm-tech-stack-ingest (if stack cache needed) → hm-detective → hm-deep-research
78: 
79: ### Category 2: Planning Tasks
80: 
81: **Intent signals:** "plan", "spec", "requirements", "design", "architect"
82: 
83: | Priority | Skill | Role |
84: |----------|-------|------|
85: | 1 | `hm-spec-driven-authoring` | Falsifiable requirements + acceptance criteria |
86: | 2 | `hm-planning-persistence` | 3-file external memory for multi-session planning |
87: 
88: **Loading order:** hm-planning-persistence (setup) → hm-spec-driven-authoring (content)
89: 
90: ### Category 3: Execution Tasks
91: 
92: **Intent signals:** "implement", "build", "execute", "run the phase", "code"
93: 
94: | Priority | Skill | Role |
95: |----------|-------|------|
96: | 1 | `hm-phase-execution` | Wave-based parallelization + checkpoint recovery |
97: | 2 | `hm-cross-cutting-change` | Cross-pane modification safety for breaking changes |
98: 
99: **Loading order:** hm-phase-execution (primary) → hm-cross-cutting-change (when touching multiple layers)
100: 
101: ### Category 4: Quality Tasks
102: 
103: **Intent signals:** "test", "verify", "quality", "validate", "TDD", "red-green-refactor"
104: 
105: | Priority | Skill | Role |
106: |----------|-------|------|
107: | 1 | `hm-test-driven-execution` | RED/GREEN/REFACTOR cycles with runtime truth |
108: | 2 | `hm-gate-orchestrator` | Quality gate triad pipeline (lifecycle → spec → evidence) |
109: 
110: **Loading order:** hm-test-driven-execution (implementation) → hm-gate-orchestrator (validation)
111: 
112: ### Category 5: Debug Tasks
113: 
114: **Intent signals:** "debug", "fix", "broken", "failing", "error", "investigate issue"
115: 
116: | Priority | Skill | Role |
117: |----------|-------|------|
118: | 1 | `hm-debug` | Systematic debugging with persistent state |
119: | 2 | `hm-completion-looping` | Guardrail against premature completion claims |
120: 
121: **Loading order:** hm-debug (investigation) → hm-completion-looping (verification)
122: 
123: ### Category 6: Review Tasks
124: 
125: **Intent signals:** "review", "audit", "readiness", "deploy check", "ship ready"
126: 
127: | Priority | Skill | Role |
128: |----------|-------|------|
129: | 1 | `hm-production-readiness` | Deployment safety verification (8 dimensions) |
130: | 2 | `hm-gate-orchestrator` | Quality gate triad for final approval |
131: 
132: **Loading order:** hm-production-readiness (evidence collection) → hm-gate-orchestrator (gate verification)
133: 
134: ## Loading Rules
135: 
136: 1. **Max 5 skills per bundle.** If a task needs more than 5, split the task.
137: 2. **Load in priority order.** Lower-numbered skills load first.
138: 3. **Respect dependencies.** If Skill B depends on Skill A's output, load A first.
139: 4. **Classify before loading.** Determine the category before loading any skills.
140: 5. **Multi-category tasks.** If a task spans 2 categories, load the primary category's bundle first, then add 1-2 skills from the secondary category (staying within the 5-skill limit).
141: 
142: ### Multi-Category Decision Tree
143: 
144: ```
145: Task spans 2 categories?
146:   → YES: Primary category gets full bundle (2-3 skills)
147:          Secondary category gets 1-2 skills from its bundle
148:          Total must be ≤ 5
149:   → NO:  Load single bundle (2-3 skills)
150: 
151: Task spans 3+ categories?
152:   → SPLIT THE TASK. No single task should span 3+ categories.
153: ```
154: 
155: ## Self-Correction
156: 
157: ### Anti-Pattern 1: Overloading
158: 
159: **Detection:** More than 5 skills being loaded for a single task.
160: **Correction:** Split the task into subtasks. Each subtask gets its own bundle. Signal: "Task too broad — split into [A] and [B], then route each independently."
161: 
162: ### Anti-Pattern 2: Wrong Lineage
163: 
164: **Detection:** Loading hf-* skills for an hm-* task, or vice versa.
165: **Correction:** This router handles hm-* lineage only. If the task is a meta-builder task (creating skills, agents, commands), route to hf-meta-builder instead. If the task is a product-dev task, use this router.
166: 
167: ### Anti-Pattern 3: Missing Input
168: 
169: **Detection:** Task intent cannot be classified into any of the 6 categories.
170: **Correction:** If the task is genuinely new (e.g., "monitor production"), route to the closest category and flag: "No exact match. Routed to [closest category]. Verify the bundle covers the task's needs."
171: 
172: ### Anti-Pattern 4: Stale Bundles
173: 
174: **Detection:** A loaded skill references another skill not in the current bundle, and the referenced skill is critical for the task.
175: **Correction:** Add the missing skill to the bundle if the total stays ≤ 5. If adding would exceed 5, remove the lowest-priority skill from the current bundle and document the trade-off.
176: 
177: ## Quality Contract (HMQUAL Compliance)
178: 
179: | HMQUAL | Compliance | Evidence |
180: |--------|-----------|----------|
181: | HMQUAL-01 | Trigger phrases ≥7 in description | 12 trigger phrases in description |
182: | HMQUAL-02 | Self-correction with 4 anti-patterns | Overloading, Wrong Lineage, Missing Input, Stale Bundles |
183: | HMQUAL-03 | Cross-references to sibling skills | 13 skill references across 6 bundles + 4 consumer skills |
184: | HMQUAL-04 | Progressive disclosure | SKILL.md (routing map) + references/routing-map.md (detailed routing) |
185: | HMQUAL-05 | Evals with 3 scenarios | evals/evals.json — 3 trigger scenarios |
186: | HMQUAL-06 | Metrics scorecard | metrics/rich-gate-scorecard.md |
187: | HMQUAL-07 | Iron law enforcement | "Max 5 skills per bundle." |
188: | HMQUAL-08 | Honest RICH scoring | Scored in metrics/rich-gate-scorecard.md |
189: 
190: ## Cross-References
191: 
192: | Related Skill | Boundary |
193: |---------------|----------|
194: | `hm-coordinating-loop` | Consumer — uses this router to determine skill bundles for delegated tasks |
195: | `hm-phase-execution` | Consumer — uses this router to determine execution-time skill loading |
196: | `hm-phase-loop` | Consumer — uses this router for iterative phase skill selection |
197: | `hm-subagent-delegation-patterns` | Consumer — uses this router to attach skill bundles to delegation packets |
198: | `hm-gate-orchestrator` | Referenced in Quality and Review bundles — the gate triad orchestrator |

(End of file - total 198 lines)
</content>
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-user-intent-interactive-loop/SKILL.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-coordinating-loop/SKILL.md"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-coordinating-loop/SKILL.md</path>
<type>file</type>
<content>
1: ---
2: name: hm-l2-coordinating-loop
3: description: Coordinate multi-agent dispatch with validation gates and handoff protocols. Use when delegating to subagents, managing parallel tasks, routing specialist work, or sequencing agent waves. NOT for single-agent execution or simple file edits.
4: metadata:
5:   layer: "3"
6:   role: "coordinator"
7:   min-tasks: 2
8: allowed-tools: Bash Read Write Edit Glob Grep todowrite skill
9: ---
10: 
11: ## Overview
12: 
13: Coordinate multi-agent dispatch with validation gates and handoff protocols. Use when delegating to subagents, managing parallel tasks, routing specialist work, or sequencing agent waves. Produces validated multi-agent dispatch with error recovery and progress tracking.
14: 
15: ## Planning Context — Check Available
16: 
17: This skill coordinates multi-agent workflows. Before beginning:
18: 
19: 1. **Check for planning state:**
20:    - If `hm-planning-persistence` is loaded: Read `.hivemind/state/planning/<session-id>/task_plan.md` for task inventory.
21:    - If `hm-planning-persistence` is not loaded: Build task inventory in-memory. Write to `.coordination/<session>/task_plan.md` for durability.
22:    - **DO NOT BLOCK** — proceed with whatever planning context is available.
23: 
24: 2. **Register this skill as loaded:**
25:    ```bash
26:    bash scripts/register-skill.sh coordinating-loop
27:    ```
28:    (Non-blocking — continues on failure)
29: 
30: 3. **State availability:**
31:    - Preferred: `hm-planning-persistence` provides structured task_plan.md, findings.md, progress.md in `.hivemind/state/planning/<session-id>/`
32:    - Fallback: In-memory task tracking with `.coordination/<session>/` directory
33: 
34: <files_to_read>
35: .opencode/skills/hm-coordinating-loop/references/01-handoff-protocols.md
36: .opencode/skills/hm-coordinating-loop/references/02-sequential-vs-parallel.md
37: .opencode/skills/hm-coordinating-loop/references/03-parent-child-cycles.md
38: .opencode/skills/hm-coordinating-loop/references/04-ralph-loop-integration.md
39: .opencode/skills/hm-coordinating-loop/references/05-edge-guardrails.md
40: .opencode/get-shit-done/references/thinking-models-execution.md
41: </files_to_read>
42: 
43: # coordinating-loop
44: 
45: Central coordination hub for multi-agent workflows. Manages hand-offs, execution mode decisions, parent-child cycles, and ralph-loop integration. **Scripts enforce gates — not tables.**
46: 
47: ---
48: 
49: ## When This Skill Loads — Do This First
50: 
51: 1. **Count the tasks.** If only one task, do NOT load this skill. Execute directly.
52: 2. **Check for `.coordination/` directory.** If missing, run `scripts/init-session.sh <session-name>`.
53: 3. **Check for available planning state:** `hm-planning-persistence` (preferred, `.hivemind/state/planning/<session-id>/`) or in-memory fallback.
54: 4. **Limit tool calls to 3 before first decision.** No deep exploration.
55: 5. **Write task inventory to disk:** `.coordination/<session>/task_plan.md`.
56: 6. **Run pre-dispatch validation:** `bash scripts/coordination-check.sh <session> --pre-dispatch`. **Must exit 0 before any child is dispatched.**
57: 
58: ---
59: 
60: ## Core Coordination Loop — Procedural Steps
61: 
62: ```
63: ASSESS → DECIDE MODE → DISPATCH → MONITOR → INTEGRATE → VERIFY → (loop or exit)
64: ```
65: 
66: ## Rich Coordination Guardrails
67: 
68: Phase 30 hardening treats each coordination step as a deterministic workflow edge with traceable guardrails:
69: 
70: | Pattern | Local adaptation |
71: |---------|------------------|
72: | Deterministic workflow agent | The coordinator owns the state machine and max loop count; child agents do not decide global completion. |
73: | Per-edge guardrails | Run checks at parent→child, child→tool, child→parent, and integration boundaries, not only final VERIFY. |
74: | Handoff metadata | Every envelope includes source, target, handoff reason, allowed destinations, history policy, expected return, and resume pointer. |
75: | Trace/evidence span | Every accepted or rejected child return is written to findings/progress with command/file evidence. |
76: 
77: Use `references/05-edge-guardrails.md` when coordinating delegated work with more than one agent/tool boundary.
78: 
79: ### Step 1: ASSESS — Build the Task Inventory
80: 
81: 1. List every unit of work. Write to `.coordination/<session>/task_plan.md`:
82:    ```
83:    - [ ] TASK-N: <description> | files: <paths> | domain: <category>
84:    ```
85: 2. Group tasks by **file overlap** and **domain**.
86: 3. **Gate G1 enforcement:** Run `bash scripts/check-gate.sh <session> G1`. **Blocks if no tasks written.**
87: 
88: ### Step 2: DECIDE MODE — Use the Fixed Flowchart
89: 
90: ```
91: Multiple tasks?
92:   ├─ No  → Execute directly. Exit this skill.
93:   └─ Yes
94:         │
95:         ▼
96:    Any tasks share files or mutable state?
97:    ├─ Yes → Sequential. Go to DISPATCH.
98:    └─ No
99:         │
100:         ▼
101:    3+ independent task groups?
102:    ├─ Yes → Parallel dispatch. Go to DISPATCH.
103:    └─ No (1-2 groups)
104:         │
105:         ▼
106:    Are tasks exploratory (root cause unknown)?
107:    ├─ Yes → Sequential. Investigate first, reassess.
108:    └─ No  → Sequential (overhead exceeds benefit).
109: ```
110: 
111: **Reassessment rule:** If parallel agents discover shared state, HALT remaining agents, collect results, switch to sequential. Write to `progress.md`.
112: 
113: ### Step 3: DISPATCH — Task Envelopes with Validation
114: 
115: Every child Agent receives a **Task Envelope** with exactly 5 required sections:
116: 
117: | Section | Required Content |
118: |---------|-----------------|
119: | **Task** | One-sentence description of what to do |
120: | **Scope** | Include/exclude file lists — concrete paths |
121: | **Context** | Only what is needed — error messages, relevant snippets (max 50 lines), patterns to follow |
122: | **Expected Output** | Concrete deliverables with format and acceptance criteria |
123: | **Verification** | Exact command or check the child must run and report |
124: 
125: Add the Phase 30 handoff metadata block to each envelope:
126: 
127: ```yaml
128: source_agent: "<coordinator>"
129: target_agent: "<child>"
130: handoff_reason: "<domain/file boundary>"
131: allowed_destinations: []
132: history_policy: "<what context is included/filtered>"
133: expected_return: "DONE/DONE_WITH_CONCERNS/NEEDS_CONTEXT/BLOCKED + artifacts + evidence"
134: resume_pointer: "<where to continue after interruption>"
135: ```
136: 
137: **Before dispatching each child:**
138: 1. Write the envelope to `.coordination/<session>/children/<child-id>/envelope.md`
139: 2. Run `bash scripts/validate-envelope.sh <session> <child-id>` — **blocks if any of 5 sections missing**
140: 3. **Gate G2 enforcement:** Run `bash scripts/check-gate.sh <session> G2`. **Blocks if any envelope fails validation.**
141: 
142: **Pre-dispatch checklist (run before ANY child is dispatched):**
143: ```bash
144: bash scripts/coordination-check.sh <session> --pre-dispatch
145: # Must exit 0. If it exits 1, fix the reported issues before dispatching.
146: ```
147: 
148: ### Step 4: MONITOR — Check at Gates, Not Continuously
149: 
150: 1. After each child returns — verify output matches expected format.
151: 2. Run edge guardrails before accepting the child result: scope, output shape, verification evidence, unauthorized delegation/tool use.
152: 3. **Ralph-loop integration:** After each child returns:
153:    ```bash
154:    bash scripts/run-ralph-loop.sh <session> <child-id>
155:    ```
156:    - If validator passes → child accepted
157:    - If validator fails → fix issues → re-dispatch child → loop (max 3 cycles)
158:    - If 3 cycles fail → escalate to user with summary
159: 4. **Gate G3 enforcement:** Run `bash scripts/check-gate.sh <session> G3`. **Blocks if any child orphaned.**
160: 
161: ### Step 5: INTEGRATE — Merge Results
162: 
163: 1. Read each child's output file.
164: 2. Check for overlapping file modifications. Resolve conflicts or dispatch integration Agent.
165: 3. Run full validation suite (tests, builds).
166: 4. **Write integration report:** Generate `.coordination/<session>/findings.md` with:
167:    - Summary of each child's output
168:    - File conflict analysis
169:    - Validation results
170:    - Remaining issues
171: 5. **Gate G4 enforcement:** Run `bash scripts/check-gate.sh <session> G4`. **Blocks if conflicts unresolved or validation fails.**
172: 
173: ### Step 6: VERIFY — Gate Check
174: 
175: 1. Run `bash scripts/check-gate.sh <session> G5`. **Blocks if acceptance criteria unmet.**
176: 2. If all gates pass → loop exits.
177: 3. If any gate fails → loop back to originating phase.
178: 4. **Maximum 3 full loop cycles** through G1→G5. On 3rd failure, escalate to user.
179: 
180: ---
181: 
182: ## Gate Enforcement — Scripts That Block
183: 
184: Every gate has a script that runs and **exits non-zero to block progression**:
185: 
186: | Gate | Phase | Script | Blocks If |
187: |------|-------|--------|-----------|
188: | G1 | ASSESS | `bash scripts/check-gate.sh <session> G1` | No tasks in task_plan.md |
189: | G2 | DISPATCH | `bash scripts/check-gate.sh <session> G2` | Any envelope missing required sections |
190: | G3 | MONITOR | `bash scripts/check-gate.sh <session> G3` | Any child orphaned (no result) |
191: | G4 | INTEGRATE | `bash scripts/check-gate.sh <session> G4` | File conflicts or validation fails |
192: | G5 | VERIFY | `bash scripts/check-gate.sh <session> G5` | Acceptance criteria unmet |
193: 
194: **Usage:** `bash scripts/check-gate.sh <session-name> <G1|G2|G3|G4|G5>`
195: - Exit 0 = gate passed, proceed
196: - Exit 1 = gate failed, **do not proceed** — fix the reported issue
197: 
198: ---
199: 
200: ## Ralph-Loop Integration — Validate → Fix → Re-dispatch
201: 
202: After each child returns, the ralph-loop validator runs:
203: 
204: ```
205: Child returns
206:     │
207:     ▼
208: Run: bash scripts/run-ralph-loop.sh <session> <child-id>
209:     │
210:     ├── PASS → Accept child output, continue
211:     │
212:     └── FAIL → Read validation report
213:          │
214:          ├── Cycle < 3 → Fix issues, re-dispatch child, loop
215:          │
216:          └── Cycle = 3 → Escalate to user with summary
217: ```
218: 
219: **The validator checks:**
220: 1. Output file exists at expected path
221: 2. Output matches expected format from envelope
222: 3. Verification command from envelope was run and passed
223: 4. No files modified outside scope boundaries
224: 5. Child returned a summary (even on failure)
225: 
226: ---
227: 
228: ## Worked Example: Coordinating 3 Subagents Through Skill Creation
229: 
230: **Scenario:** User says "Create a skill for deep-research that uses repomix to analyze codebases."
231: 
232: ### Phase 1: ASSESS
233: 
234: ```
235: - [ ] TASK-1: Write SKILL.md frontmatter and trigger phrases | files: .opencode/skills/deep-research/SKILL.md | domain: skill-structure
236: - [ ] TASK-2: Create reference documents for repomix integration | files: .opencode/skills/deep-research/references/*.md | domain: documentation
237: - [ ] TASK-3: Write validation script for the skill pack | files: deep-research/scripts dir | domain: tooling
238: ```
239: 
240: No file overlap. 3 independent groups → **parallel dispatch**.
241: 
242: **Gate G1:** `bash scripts/check-gate.sh deep-research G1` → exits 0 ✓
243: 
244: ### Phase 2: DISPATCH — Filled-In Task Envelopes
245: 
246: **Envelope for Child Agent 1 (SKILL.md author):**
247: ```markdown
248: ## Task
249: Write the SKILL.md file for a new "deep-research" skill at .opencode/skills/deep-research/SKILL.md
250: 
251: ## Scope
252: - Work on: .opencode/skills/deep-research/SKILL.md only
253: - Do NOT touch: Any other files in the repository
254: 
255: ## Context
256: The skill should trigger on: "deep research", "comprehensive analysis", "research report".
257: It must use YAML frontmatter with name, description, and metadata fields.
258: The skill body should contain procedural guidance for conducting research using repomix.
259: Reference existing skill patterns in .opencode/skills/use-authoring-skills/SKILL.md for structure.
260: 
261: ## Expected Output
262: - A complete SKILL.md file (300+ lines) with frontmatter, procedural steps, and cross-references
263: - The file must pass validation via the use-authoring-skills validate-skill.sh script
264: 
265: ## Verification
266: - Run: bash -n on any embedded scripts
267: - Run: head -5 .opencode/skills/deep-research/SKILL.md to confirm frontmatter
268: ```
269: 
270: **Before dispatch:** `bash scripts/validate-envelope.sh deep-research child-1` → exits 0 ✓
271: 
272: *(Envelopes for Child 2 and 3 follow same pattern — see full example in references/01-handoff-protocols.md)*
273: 
274: **Pre-dispatch validation:** `bash scripts/coordination-check.sh deep-research --pre-dispatch` → exits 0 ✓
275: 
276: **Gate G2:** `bash scripts/check-gate.sh deep-research G2` → exits 0 ✓
277: 
278: ### Phase 3: MONITOR with Ralph-Loop
279: 
280: Each child returns. Parent runs ralph-loop validator:
281: ```bash
282: bash scripts/run-ralph-loop.sh deep-research child-1  # PASS
283: bash scripts/run-ralph-loop.sh deep-research child-2  # PASS
284: bash scripts/run-ralph-loop.sh deep-research child-3  # PASS
285: ```
286: 
287: **Gate G3:** `bash scripts/check-gate.sh deep-research G3` → exits 0 ✓
288: 
289: ### Phase 4: INTEGRATE
290: 
291: Parent reads all outputs, confirms no file overlap, runs full validation.
292: 
293: **Write findings:** Integration report written to `.coordination/deep-research/findings.md`
294: 
295: **Gate G4:** `bash scripts/check-gate.sh deep-research G4` → exits 0 ✓
296: 
297: ### Phase 5: VERIFY
298: 
299: **Gate G5:** `bash scripts/check-gate.sh deep-research G5` → exits 0 ✓
300: 
301: All gates pass. Loop exits. Parent reports success to user.
302: 
303: ---
304: 
305: ## Hand-off Protocol — Minimum Viable
306: 
307: ```markdown
308: ## Task
309: Fix the 3 failing tests in tests/lib/session-api.ts
310: 
311: ## Scope
312: - Include: tests/lib/session-api.ts, src/lib/session-api.ts
313: - Exclude: All other test files, all production code outside session-api.ts
314: 
315: ## Context
316: Error: "TypeError: client.waitForSession is not a function"
317: The SDK call pattern changed. Multi-path fallback at src/lib/session-api.ts:142-168 needs updating.
318: 
319: ## Expected Output
320: - Summary of root cause
321: - List of changes made (file:line format)
322: - Confirmation that all 3 tests pass
323: 
324: ## Verification
325: Run: npm test -- tests/lib/session-api.ts — all must pass
326: ```
327: 
328: **Child receipt confirmation:**
329: ```markdown
330: ## Confirmation
331: - Task understood: Fix 3 failing tests in session-api.ts
332: - Scope boundaries: Only session-api.ts (test and source)
333: - Verification step: npm test -- tests/lib/session-api.ts
334: - Any ambiguities: None — proceeding
335: ```
336: 
337: ---
338: 
339: ## Anti-Patterns — Detection and Correction
340: 
341: | Anti-Pattern | Detection | Correction |
342: |-------------|-----------|------------|
343: | **The Broadcast** — Full session history to every child | Child prompt >500 chars of context | Include only file paths, errors, expected output |
344: | **The Fire-and-Forget** — Dispatch with no monitoring | No verification step in envelope | Write verification step before dispatching |
345: | **The False Parallel** — Parallel for tasks sharing state | Independence criteria fails | Switch to sequential |
346: | **The Orphan Loop** — Ralph-loop with no exit | Cannot fill "Loop exits when: ___" | Define acceptance criteria first |
347: | **The Context Leak** — Child modifies out-of-scope files | `git diff --name-only` vs envelope scope | Revert, re-dispatch with clearer boundaries |
348: | **The Silent Failure** — Child fails undetected | Child didn't run verification step | Require receipt confirmation |
349: | **The Coordinator Executor** — Parent does child's work | Parent modified files assigned to child | Stop. Delegate. Only integrate. |
350: | **The Infinite Retry** — Retry without changing approach | Retry count > 1 per task | Escalate to user |
351: 
352: ---
353: 
354: ## Self-Correction
355: 
356: ### When the Task Keeps Failing
357: 
358: If a child agent repeatedly returns failing results, first check whether the files referenced in its envelope actually exist on disk — plans sometimes reference paths that were never created. Next, verify the agent name in your dispatch matches a real `.opencode/agents/` file; typos in agent names cause silent dispatch failures on some platforms. If both check out, simplify the task decomposition: reduce the number of parallel agents, merge overlapping tasks, and re-dispatch with narrower scopes. If the same task fails 3 times with the same error, stop retrying and escalate to the user with the exact error output and your diagnosis.
359: 
360: ### When Unsure About the Next Step
361: 
362: Default to sequential dispatch instead of parallel — sequential is safer and easier to debug. Log the decision point by writing to `.coordination/<session>/progress.md` with what you know, what you're uncertain about, and which option you're proceeding with. If you cannot determine whether tasks share mutable state, treat them as shared and serialize. The safest default is always: one agent at a time, verify each result before dispatching the next.
363: 
364: ### When the User Contradicts Skill Guidance
365: 
366: If the user requests a different dispatch strategy than what this skill recommends (e.g., wants parallel when the flowchart says sequential), use the user's choice but explicitly note in `progress.md` that this deviates from the recommended coordination pattern and may affect file conflict safety. If the user wants a different agent than recommended, dispatch their preferred agent but include a note about the potential mismatch in the task envelope. The user's explicit instruction always overrides skill guidance — document the deviation and proceed.
367: 
368: ### When an Edge Case Is Encountered
369: 
370: If two agents need to write to the same output file, serialize their execution instead of dispatching in parallel — file conflicts are the most common parallel dispatch failure. If a child agent returns results that modify files outside its declared scope, do not accept the results — revert the out-of-scope changes, re-dispatch with clearer scope boundaries, and add the file to the exclude list. If the coordination directory (`.coordination/`) is corrupted or missing mid-session, re-initialize with `scripts/init-session.sh` and rebuild state from completed child outputs on disk.
371: 
372: ---
373: 
374: ## Platform Adaptation
375: 
376: ### OpenCode (Full Access)
377: - Use all scripts as written. Dispatch via `@general` or `@<custom-agent>`.
378: - Write state to `.coordination/`. Run gate scripts before each phase transition.
379: 
380: ### Claude.ai (No Subagents, No Bash)
381: - Execute tasks sequentially. Perform gate checks manually:
382:   - G1: Count tasks, write list as markdown
383:   - G2: Verify each task has all 5 envelope sections
384:   - G3: Confirm each task's verification step passed
385:   - G4: Review all changes for conflicts
386:   - G5: Check all acceptance criteria met
387: - Use conversation as state. Write progress as numbered sections.
388: 
389: ### Cowork (Subagents, No Bash)
390: - Dispatch subagents. Perform gate checks manually (same as Claude.ai).
391: - Write state to files if platform allows.
392: 
393: ### No-Subagent Fallback
394: 1. Execute sequentially, one task at a time.
395: 2. Write state to disk after each task.
396: 3. Use same gate system — verify manually.
397: 4. Treat each task as separate Agent with boundaries.
398: 
399: ---
400: 
401: ## Cross-References
402: 
403: | Skill | Relationship |
404: |-------|-------------|
405: | `dispatching-parallel-agents` | Builds ON TOP of it for parallel dispatch patterns |
406: | `user-intent-interactive-loop` | Captures user intent before coordination begins |
407: | `hm-planning-persistence` | Maintains task_plan.md, findings.md, progress.md in `.hivemind/state/planning/` |
408: | `phase-loop` | Provides iteration semantics for coordinated revision loops |
409: 
410: ## Cross-References (Boundary Clarification)
411: 
412: | Related Skill | Boundary |
413: |---------------|----------|
414: | `agents-and-subagents-dev` | agents-and-subagents-dev owns agent definitions and delegation protocol. This skill owns dispatch mechanics and coordination between multiple agents. |
415: | `hm-subagent-delegation-patterns` | hm-subagent-delegation-patterns owns GSD-specific execution patterns (checkpoint resume, session ID tracking). This skill owns general multi-agent orchestration. |
416: | `user-intent-interactive-loop` | user-intent-interactive-loop owns intent clarification before work begins. This skill owns execution coordination after intent is clear. |
417: | `hm-planning-persistence` | hm-planning-persistence owns task-level persistent memory in `.hivemind/state/planning/<session-id>/`. This skill reads/writes those files as part of coordination but doesn't own them. |
418: 
419: ---
420: 
421: ## Kit Bundle Contents
422: 
423: | Component | Purpose |
424: |-----------|---------|
425: | `SKILL.md` | Entry point with enforcement procedures and worked example |
426: | `references/01-handoff-protocols.md` | Context transfer patterns with filled-in examples |
427: | `references/02-sequential-vs-parallel.md` | Execution mode decision framework |
428: | `references/03-parent-child-cycles.md` | Nested agent lifecycle with prompt templates |
429: | `references/04-ralph-loop-integration.md` | Skill-authoring workflow mapping |
430: | `scripts/init-session.sh` | Creates `.coordination/` directory structure |
431: | `scripts/coordination-check.sh` | Pre-dispatch validation and session health check |
432: | `scripts/check-gate.sh` | Per-gate enforcement — exits non-zero to block |
433: | `scripts/validate-envelope.sh` | Validates task envelope has all 5 required sections |
434: | `scripts/run-ralph-loop.sh` | Ralph-loop validator: validate → fix → re-dispatch cycle |
435: | `scripts/loop-status.sh` | Reports current loop phase and progress |

(End of file - total 435 lines)
</content>
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/tools/hivemind/session-tracker.ts"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/src/tools/hivemind/session-tracker.ts</path>
<type>file</type>
<content>
1: /**
2:  * Session-tracker tool — read-only query/export tool for session knowledge files.
3:  *
4:  * Provides agents with query access to persisted session tracker data under
5:  * `.hivemind/session-tracker/`. Designed for extensibility (D-02) with
6:  * action-based routing.
7:  *
8:  * Actions:
9:  * - `export-session` — returns the full content of a session's .md capture file
10:  * - `list-sessions` — returns all known sessions from project-continuity.json
11:  * - `search-sessions` — scans session files for a query string
12:  *
13:  * All operations are read-only (CQRS read-side). No mutation authority.
14:  *
15:  * @module tools/hivemind/session-tracker
16:  */
17: 
18: import { tool } from "@opencode-ai/plugin/tool"
19: import { readFile, readdir } from "node:fs/promises"
20: import { resolve } from "node:path"
21: import { statSync, existsSync } from "node:fs"
22: 
23: import {
24:   SessionTrackerInputSchema,
25:   type SessionTrackerInput,
26: } from "../../schema-kernel/session-tracker.schema.js"
27: import { sessionTrackerRoot } from "../../features/session-tracker/persistence/atomic-write.js"
28: import { renderToolResult } from "../../shared/tool-helpers.js"
29: import { success, error } from "../../shared/tool-response.js"
30: 
31: // ---------------------------------------------------------------------------
32: // Constants
33: // ---------------------------------------------------------------------------
34: 
35: const MAX_SEARCH_CHUNK_BYTES = 50000 // Per-file read limit for search
36: 
37: // ---------------------------------------------------------------------------
38: // Tool factory
39: // ---------------------------------------------------------------------------
40: 
41: type ToolContext = { sessionID?: string }
42: 
43: /**
44:  * Creates the session-tracker tool instance.
45:  *
46:  * @param projectRoot - Absolute path to the project root.
47:  * @returns An OpenCode tool definition for session query/export operations.
48:  *
49:  * @example
50:  * ```typescript
51:  * const sessionTrackerTool = createSessionTrackerTool(process.cwd())
52:  * ```
53:  */
54: export function createSessionTrackerTool(projectRoot: string): ReturnType<typeof tool> {
55:   const s = tool.schema
56: 
57:   return tool({
58:     description:
59:       "Query and export session tracker data. Actions: export-session (get full session capture), list-sessions (list all sessions), search-sessions (search session content).",
60:     args: {
61:       action: s.string().describe("Action: export-session, list-sessions, or search-sessions"),
62:       sessionId: s.string().optional().describe("Session ID (required for export-session)"),
63:       query: s.string().optional().describe("Search query (required for search-sessions)"),
64:       limit: s.number().optional().describe("Maximum results (default 20, max 100)"),
65:     },
66:     async execute(rawArgs: unknown, _context: ToolContext): Promise<string> {
67:       try {
68:         const input = SessionTrackerInputSchema.parse(rawArgs) as SessionTrackerInput
69: 
70:         switch (input.action) {
71:           case "export-session":
72:             return await handleExportSession(projectRoot, input)
73:           case "list-sessions":
74:             return await handleListSessions(projectRoot, input)
75:           case "search-sessions":
76:             return await handleSearchSessions(projectRoot, input)
77:           default:
78:             return renderToolResult(error(`Unknown action: ${(input as { action: string }).action}`))
79:         }
80:       } catch (caughtError) {
81:         const message = caughtError instanceof Error ? caughtError.message : String(caughtError)
82:         return renderToolResult(error(message))
83:       }
84:     },
85:   })
86: }
87: 
88: // ---------------------------------------------------------------------------
89: // Action handlers
90: // ---------------------------------------------------------------------------
91: 
92: /**
93:  * Exports the full content of a session's .md capture file.
94:  *
95:  * @param projectRoot - Absolute project root path.
96:  * @param input - Tool input (must include sessionId).
97:  * @returns Rendered tool response with file content.
98:  */
99: async function handleExportSession(
100:   projectRoot: string,
101:   input: SessionTrackerInput,
102: ): Promise<string> {
103:   if (!input.sessionId) {
104:     return renderToolResult(error("sessionId is required for export-session action"))
105:   }
106: 
107:   const trackerRoot = sessionTrackerRoot(projectRoot)
108:   const filePath = resolve(trackerRoot, input.sessionId, `${input.sessionId}.md`)
109: 
110:   try {
111:     const content = await readFile(filePath, "utf-8")
112:     return renderToolResult(
113:       success(`Session export: ${input.sessionId}`, {
114:         sessionId: input.sessionId,
115:         content,
116:         filePath,
117:       }),
118:     )
119:   } catch {
120:     return renderToolResult(error(`Session not found: ${input.sessionId}`))
121:   }
122: }
123: 
124: /**
125:  * Lists all known sessions from the project-continuity.json index.
126:  *
127:  * @param projectRoot - Absolute project root path.
128:  * @param input - Tool input (limit controls max results).
129:  * @returns Rendered tool response with session list.
130:  */
131: async function handleListSessions(
132:   projectRoot: string,
133:   input: SessionTrackerInput,
134: ): Promise<string> {
135:   const trackerRoot = sessionTrackerRoot(projectRoot)
136:   const indexPath = resolve(trackerRoot, "project-continuity.json")
137: 
138:   try {
139:     const raw = await readFile(indexPath, "utf-8")
140:     const index = JSON.parse(raw) as {
141:       sessions?: Record<string, unknown>
142:       chronologicalOrder?: string[]
143:     }
144: 
145:     const allSessions = index.chronologicalOrder ?? Object.keys(index.sessions ?? {})
146:     const limit = input.limit ?? 20
147:     const sessions = allSessions.slice(0, limit)
148: 
149:     const sessionDetails: Array<{ sessionId: string; metadata?: unknown }> = []
150:     for (const sessionId of sessions) {
151:       sessionDetails.push({
152:         sessionId,
153:         metadata: index.sessions?.[sessionId] ?? null,
154:       })
155:     }
156: 
157:     return renderToolResult(
158:       success(`Found ${sessions.length} sessions`, {
159:         total: allSessions.length,
160:         sessions: sessionDetails,
161:         hasMore: allSessions.length > limit,
162:         indexLastUpdated: (index as { lastUpdated?: string }).lastUpdated ?? null,
163:       }),
164:     )
165:   } catch {
166:     return renderToolResult(error("No session index found. Session tracking may not be running."))
167:   }
168: }
169: 
170: /**
171:  * Searches session .md files for a query string.
172:  *
173:  * @param projectRoot - Absolute project root path.
174:  * @param input - Tool input (must include query string).
175:  * @returns Rendered tool response with matching sessions.
176:  */
177: async function handleSearchSessions(
178:   projectRoot: string,
179:   input: SessionTrackerInput,
180: ): Promise<string> {
181:   if (!input.query || input.query.trim().length === 0) {
182:     return renderToolResult(error("query is required for search-sessions action"))
183:   }
184: 
185:   const trackerRoot = sessionTrackerRoot(projectRoot)
186:   const matches: Array<{ sessionId: string; file: string; snippet: string; matchLine: number }> = []
187: 
188:   try {
189:     const entries = await readdir(trackerRoot, { withFileTypes: true })
190: 
191:     for (const entry of entries) {
192:       if (!entry.isDirectory()) continue
193:       if (!entry.name.startsWith("ses_")) continue
194: 
195:       const sessionId = entry.name
196:       const mdPath = resolve(trackerRoot, sessionId, `${sessionId}.md`)
197: 
198:       if (!existsSync(mdPath)) continue
199: 
200:       try {
201:         const fileStat = statSync(mdPath)
202:         if (fileStat.size > MAX_SEARCH_CHUNK_BYTES) continue
203: 
204:         const content = await readFile(mdPath, "utf-8")
205:         const lines = content.split("\n")
206:         const queryLower = input.query.toLowerCase()
207: 
208:         for (let i = 0; i < lines.length; i++) {
209:           if (lines[i].toLowerCase().includes(queryLower)) {
210:             // Get surrounding context (2 lines before, 2 after)
211:             const start = Math.max(0, i - 2)
212:             const end = Math.min(lines.length, i + 3)
213:             const snippet = lines.slice(start, end).join("\n").trim()
214: 
215:             matches.push({
216:               sessionId,
217:               file: `${sessionId}/${sessionId}.md`,
218:               snippet,
219:               matchLine: i + 1,
220:             })
221:             break // One match per session
222:           }
223:         }
224:       } catch {
225:         // Skip unreadable files
226:       }
227:     }
228:   } catch {
229:     return renderToolResult(error("Unable to scan session directory."))
230:   }
231: 
232:   const limit = input.limit ?? 20
233:   const paginated = matches.slice(0, limit)
234: 
235:   return renderToolResult(
236:     success(`Found ${matches.length} matches across sessions`, {
237:       totalMatches: matches.length,
238:       sessions: paginated,
239:       hasMore: matches.length > limit,
240:     }),
241:   )
242: }

(End of file - total 242 lines)
</content>

<system-reminder>
Instructions from: /Users/apple/hivemind-plugin-private/src/tools/hivemind/AGENTS.md
# Hivemind Tools Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/tools/hivemind/` owns runtime control-plane and evidence-query tool entrypoints. Tools include: `hivemind-doc.ts` (document intelligence queries), `hivemind-agent-work.ts` (durable work contract create/export), `hivemind-trajectory.ts` (trajectory ledger inspection), `hivemind-pressure.ts` (pressure classification and evidence), `hivemind-sdk-supervisor.ts` (SDK wrapper health checks), `hivemind-command-engine.ts` (command discovery and routing preview), and `run-background-command.ts` (background PTY/headless command execution). Source evidence: `.planning/codebase/ARCHITECTURE.md:87-113`, `.planning/codebase/STRUCTURE.md:104-108`.

Architecture: `.planning/codebase/ARCHITECTURE.md:87-113` — CQRS write-side tools calling feature modules. Classification: Hard Harness. These tools consume `.opencode/` Soft Meta-Concepts as inputs but never store logic in `.opencode/`. Internal state persists to `.hivemind/`.

## 2. Allowed mutation authority

- Tools may parse input via Zod schemas and render standardized responses with `src/shared/`.
- Tools may call feature modules (runtime-pressure, sdk-supervisor, agent-work-contracts, doc-intelligence, background-command) and task-management modules.
- Tools may write through approved `.hivemind/` state owners when the contract requires it. Source evidence: `.planning/codebase/ARCHITECTURE.md:339-353`.

## 3. Forbidden mutations / explicit no-go boundaries

- Tools SHALL NOT bypass schema validation for agent-provided input.
- Tools SHALL NOT write internal runtime state into `.opencode/`. Source evidence: `.planning/codebase/ARCHITECTURE.md:247-255`.
- Tools SHALL NOT register themselves; `src/plugin.ts` owns registration. Source evidence: `.planning/codebase/STRUCTURE.md:221-224`.
- Tools SHALL NOT duplicate deep logic that belongs in feature modules.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| Agents and commands | Invoke hivemind tools during workflows | Must pass schema-valid inputs |
| `src/features/` | Owns runtime feature logic | Tools call features; tools do not duplicate logic |
| `src/task-management/` | Owns trajectory and state persistence | Tools call task-management; tools do not own state |
| `src/shared/` | Provides response envelope rendering | Shared stays leaf |
| Tests | Validate tool contracts and side effects | Integration claims require integration evidence |

## 5. Naming and placement conventions

- Tool files use `kebab-case.ts` with `hivemind-` prefix: `hivemind-doc.ts`, `hivemind-trajectory.ts`, etc. Source evidence: `.planning/codebase/STRUCTURE.md:221-224`.
- `run-background-command.ts` is the exception (no prefix).
- Schemas belong in `src/schema-kernel/` when validation is needed.
- Tests live under `tests/tools/hivemind/`. Source evidence: `.planning/codebase/TESTING.md:52-64`.

## 6. Quality gates and evidence expectations

- Code changes require `npm run typecheck` and scoped tool tests. Source evidence: `.planning/codebase/TESTING.md:41-48`.
- Mutation claims require evidence of the intended state surface.
- Docs-only edits remain L5 evidence. Source evidence: `.planning/ROADMAP.md:47-49`.


Instructions from: /Users/apple/hivemind-plugin-private/src/tools/AGENTS.md
# Tools Sector Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/tools/` is the Hard Harness write-side sector. Tool implementations expose validated OpenCode tool commands for delegation, status polling, background commands, prompt enhancement, primitive configuration, trajectory, pressure, SDK supervision, command engine, and agent work contracts. Source evidence: `.planning/codebase/ARCHITECTURE.md:87-113`, `.planning/codebase/STRUCTURE.md:104-108`.

Source architecture: `.planning/codebase/ARCHITECTURE.md:87-113` — CQRS write-side mutation authority. Tools call `src/task-management/`, `src/coordination/`, `src/features/` for durable operations. Soft Meta-Concepts (`.opencode/`) configure tool behavior via agent/command/skill primitives; `.opencode/` NEVER owns tool business logic or runtime state.

## 2. Allowed mutation authority

- Tools are the CQRS mutation authority for runtime operations and may write through approved library state owners. Evidence: `.planning/codebase/ARCHITECTURE.md:72-80`, `.planning/codebase/ARCHITECTURE.md:339-353`.
- Tools may parse input via Zod schemas and render standardized responses with `src/shared/`. Evidence: `.planning/codebase/ARCHITECTURE.md:87-113`, `.planning/codebase/ARCHITECTURE.md:295-300`.
- Tools may call OpenCode SDK wrappers, delegation managers, state owners, config workflow, and schema validators when the tool contract explicitly requires it. Evidence: `.planning/codebase/ARCHITECTURE.md:273-285`.

## 3. Forbidden mutations / explicit no-go boundaries

- Tools SHALL NOT bypass schema validation for external or agent-provided input.
- Tools SHALL NOT write internal runtime state into `.opencode/`; state writes go through `.hivemind/` owners. Evidence: `.planning/codebase/ARCHITECTURE.md:247-255`, `.planning/codebase/ARCHITECTURE.md:351-353`.
- Tools SHALL NOT register themselves directly in arbitrary files; `src/plugin.ts` owns registration. Evidence: `.planning/codebase/STRUCTURE.md:221-224`.
- Tools SHALL NOT claim completion, integration, or runtime readiness from mocked/unit-only proof when the claim is about OpenCode integration.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| Agents and commands | Invoke tool contracts during workflows | Must pass schema-valid inputs |
| `src/plugin.ts` | Registers tool definitions with OpenCode | Does not embed tool business logic |
| `src/task-management/`, `src/coordination/`, `src/features/` owners | Perform durable state, lifecycle, SDK, and orchestration logic | Tools call them; tools do not duplicate deep logic |
| `src/shared/` | Provides response envelope rendering | Shared stays leaf |
| Tests/gates | Verify validation, outputs, and side effects | Integration claims require integration evidence |

## 5. Naming and placement conventions

- Single-file tools live at `src/tools/{tool-name}.ts`; multi-file tools live at `src/tools/{tool-name}/index.ts`. Evidence: `.planning/codebase/STRUCTURE.md:221-224`.
- Add or update schemas in `src/schema-kernel/{tool-name}.schema.ts` when validation is needed. Evidence: `.planning/codebase/STRUCTURE.md:221-224`, `.planning/codebase/STRUCTURE.md:237-240`.
- Tool tests live under `tests/tools/{tool-name}.test.ts` and mirror the source contract. Evidence: `.planning/codebase/STRUCTURE.md:221-224`, `.planning/codebase/TESTING.md:52-64`.
- Tool output must use the shared envelope rather than bespoke response shapes. Evidence: `.planning/codebase/ARCHITECTURE.md:334-337`.

## 6. Quality gates and evidence expectations

- Code changes require `npm run typecheck` and scoped tool tests; run broader `npm test` when touching shared contracts or state owners. Evidence: `.planning/codebase/TESTING.md:41-48`.
- Mutation claims require evidence of the intended state surface and proof that `.opencode/` was not used for internal state.
- Docs-only edits to this file are L5 evidence and must not be used to claim runtime readiness. Evidence: `.planning/ROADMAP.md:47-49`.


Instructions from: /Users/apple/hivemind-plugin-private/src/AGENTS.md
# Hard Harness Sector Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/` is the Hard Harness npm package source for the OpenCode runtime composition engine: `src/plugin.ts` assembles dependencies, tools expose write-side commands, hooks observe read-side events, `src/task-management/`, `src/coordination/`, `src/features/`, `src/config/`, `src/routing/` own runtime logic, `src/schema-kernel/` owns validation contracts, and `src/shared/` owns leaf tool utilities. Source evidence: `.planning/codebase/ARCHITECTURE.md:38-45`, `.planning/codebase/ARCHITECTURE.md:48-68`, `.planning/codebase/STRUCTURE.md:88-118`. Source-plane ownership model: `.planning/architecture/hivemind-source-plane-architecture-2026-05-07.md` — defines the split between Hard Harness (`src/`), Soft Meta-Concepts (`.opencode/`), and Internal State (`.hivemind/`).

## 2. Allowed mutation authority

- `src/plugin.ts` may wire runtime dependencies, instantiate hooks, register tools, and load runtime policy; keep business logic in `src/task-management/`, `src/coordination/`, `src/features/`, `src/config/`, `src/routing/`, tools, hooks, or schemas. Evidence: `.planning/codebase/ARCHITECTURE.md:48-50`, `.planning/codebase/ARCHITECTURE.md:70-82`.
- `src/tools/` owns write-side tool entrypoints and may call `src/task-management/`, `src/coordination/`, `src/features/`, `src/schema-kernel/`, and `src/shared/` to perform validated mutations. Evidence: `.planning/codebase/ARCHITECTURE.md:87-113`.
- `src/hooks/` owns read-side observers, response shaping, and guard decisions, subject to the CQRS hook boundary. Evidence: `.planning/codebase/ARCHITECTURE.md:115-134`, `.planning/codebase/ARCHITECTURE.md:339-353`.
- `src/task-management/` owns continuity, journal, event tracker, recovery, trajectory, and lifecycle modules.
- `src/coordination/` owns delegation, completion, concurrency, SDK/command delegation, and spawner modules.
- `src/features/` owns standalone runtime features: bootstrap, PTY/background command, doc intelligence, prompt packets, pressure, SDK supervisor, and work contracts.
- `src/config/` owns config subscriber, compiler, and workflow modules.
- `src/routing/` owns session entry, behavioral profile, and command engine modules.
Evidence: `.planning/codebase/ARCHITECTURE.md:136-183`.
- `src/schema-kernel/` owns Zod validation schemas; `src/shared/` owns leaf utility surfaces used by tools. Evidence: `.planning/codebase/ARCHITECTURE.md:188-200`.

## 3. Forbidden mutations / explicit no-go boundaries

- Do not store internal runtime state in `.opencode/`; `.hivemind/` is canonical state root. Evidence: `.planning/codebase/ARCHITECTURE.md:247-255`, `.planning/codebase/ARCHITECTURE.md:351-353`.
- Do not authorize hooks to perform durable writes; only tools have CQRS mutation authority. Evidence: `.planning/codebase/ARCHITECTURE.md:339-353`.
- Do not move business logic into `src/plugin.ts`; it is a thin composition root. Evidence: `.planning/codebase/ARCHITECTURE.md:70-82`.
- Do not create `src/plugin/`, `src/config/`, or broad `src/features/` folders without a separate, source-backed architecture decision. `src/config/` and `src/features/` are authorized by `.planning/architecture/sr-remediation-architecture-decision-2026-05-08.md`; `src/plugin.ts` remains the plugin authority and `src/plugin/` is still not authorized.
- Do not exceed the 500 LOC module cap or introduce circular imports. Evidence: `.planning/codebase/ARCHITECTURE.md:345-353`, `.planning/codebase/CONVENTIONS.md:19-28`.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| OpenCode runtime | Loads the plugin, tools, hooks, and SDK-facing wrappers | Must consume compiled/package entrypoints, not planning artifacts |
| Harness tools | Execute mutation commands through validated inputs | Must use schemas and shared response envelopes |
| Harness hooks | Observe events and shape/guard responses | Must not perform durable writes |
| Tests and gates | Verify runtime behavior, type safety, and integration boundaries | Docs-only changes remain L5 evidence |
| `.opencode/` primitives | Configure agents/commands/skills that call harness tools | Must not become internal state owners |

## 5. Naming and placement conventions

- TypeScript source files use `kebab-case.ts`; schemas use `kebab-case.schema.ts`; tests mirror source with `.test.ts`. Evidence: `.planning/codebase/STRUCTURE.md:186-195`.
- Tool implementations live in `src/tools/{tool-name}.ts` or `src/tools/{tool-name}/index.ts`; schemas live in `src/schema-kernel/{tool-name}.schema.ts`; tests live under `tests/`. Evidence: `.planning/codebase/STRUCTURE.md:218-261`.
- Empty reserved folders must be registered with `.gitkeep`; do not create unregistered broad folders. Evidence: `.planning/codebase/STRUCTURE.md:268-278`.
- TypeScript remains strict ESM with `.js` import extensions and `import type` for type-only imports. Evidence: `.planning/codebase/CONVENTIONS.md:5-18`, `.planning/codebase/CONVENTIONS.md:80-98`.

## 6. Quality gates and evidence expectations

- For runtime code changes, minimum local evidence is `npm run typecheck`, relevant `npx vitest run ...`, and `npm test` or scoped justification; docs-only changes may use diff/path inspection only. Evidence: `.planning/codebase/TESTING.md:41-48`.
- Integration readiness cannot be claimed from unit tests or docs-only evidence; O3 docs artifacts are L5 until authorized runtime proof exists. Evidence: `.planning/ROADMAP.md:29-49`, `.planning/architecture/sector-agents-docs-implementation-plan-2026-05-07.md:1-8`.
- Completion claims must preserve CQRS, state-root, lineage, naming, and module-size constraints. Evidence: `.planning/codebase/ARCHITECTURE.md:339-353`, `.planning/codebase/CONVENTIONS.md:19-28`.

## 7. Cross-sector alignment

`.opencode/` is the Soft Meta-Concepts sector — NEVER treated as development assets or implementation source. Skills, agents, and commands in `.opencode/` CONFIGURE runtime behavior from outside the npm package. They contain no business logic, no state persistence, and no compiled code.

- **OMO Adaptation:** Per `.planning/research/omo-adaptation-architecture-2026-05-07.md`, factory injection patterns, CQRS boundaries, and staged initialization are ADAPTED from OMO where they align with Hivemind surfaces. OMO folder roots (`.sisyphus`, `.omx`) are REJECTED.
- **State root:** `.hivemind/` is the canonical deep module persistence root per `.planning/architecture/hivemind-runtime-identity-taxonomy-2026-05-07.md`. No internal runtime state may be stored in `.opencode/` or `src/` without going through `.hivemind/` authority surfaces.
- **Hard Harness = `src/`:** This sector contains compiled TypeScript that ships in the npm package. Soft Meta-Concepts = `.opencode/`: user-configurable primitives. Internal State = `.hivemind/`: runtime journals, delegation records, event tracker, lineage.

</system-reminder>
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_01_e1atYsRTBFjtDal3tQ8h8978"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/CP-ST-01-session-tracker-revamp/01-SPEC.md"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/.planning/phases/CP-ST-01-session-tracker-revamp/01-SPEC.md</path>
<type>file</type>
<content>
1: # CP-ST-01: Session Tracker Revamp — Formal Specification
2: 
3: **Date:** 2026-05-11
4: **Status:** SPEC-LOCKED
5: **Supersedes:** `.hivemind/planning/cp-st-session-tracker-2026-05-10/SPEC.md` (draft baseline)
6: **Depends on:** WS-SR (COMPLETE), Flaw Register (`.hivemind/audit/flaw-register-2026-05-10.json`)
7: **Architecture refs:** `.planning/codebase/ARCHITECTURE.md`, Q1-Q6 decisions
8: 
9: ---
10: 
11: ## 1. Problem Statement
12: 
13: The current event tracker (`src/task-management/journal/event-tracker/`) produces broken, noisy output with 12 documented flaws (F1-F12). It cross-contaminates session files, never populates semantic fields, contains dead code (classifier, dual-persistence), never executed the Q6 migration, and is gated by a `commit_docs` toggle. The session tracker revamp replaces this with a clean, structured, hook-driven capture system that produces hierarchical, searchable, agent-reconsumable session knowledge files.
14: 
15: ### Source Evidence
16: - Flaw register: `.hivemind/audit/flaw-register-2026-05-10.json` (12 flaws with file:line evidence)
17: - State audit: `.hivemind/audit/state-persistence-audit-2026-05-10.md`
18: - Reference export: `session-ses_1ed9.md` (7321 lines showing expected capture format)
19: - User spec: `.hivemind/planning/debug/sessions/session-continuity-event-tracker-journal-2026-05-10.md`
20: 
21: ---
22: 
23: ## 2. Scope
24: 
25: ### In Scope
26: - New session tracker module under `src/features/session-tracker/` (owning typed module)
27: - Hook integration via existing `createCoreHooks()` observer pipeline
28: - File structure: `.hivemind/session-tracker/{main-session-id}/` with MD + JSON outputs
29: - Project-level index: `.hivemind/session-tracker/project-continuity.json` (cross-session connections)
30: - Session-local index: `.hivemind/session-tracker/{main-session-id}/session-continuity.json` (parent-child hierarchy within session)
31: - Recovery/reconsumption via OpenCode SDK REST API (`client.session.*`)
32: - Up to 3 levels of delegation depth, up to 6 concurrent sessions
33: - Conservative cleanup of contaminated `.hivemind/event-tracker/` state files
34: 
35: ### Out of Scope
36: - Sidecar dashboard integration (Q2, separate project)
37: - SSE-based real-time streaming (plugin receives events directly via hooks)
38: - Changes to delegation manager, concurrency queue, or completion detector
39: - Changes to `.opencode/` primitives
40: - Removal of old event-tracker module code (kept as safety net)
41: 
42: ---
43: 
44: ## 3. Architecture Decision: Hybrid Hooks + REST Recovery
45: 
46: ### Data Collection Strategy
47: 
48: | Mechanism | Role | When Used |
49: |-----------|------|-----------|
50: | **Plugin hooks** (primary) | Real-time event capture | `event`, `chat.message`, `tool.execute.after` fire as events happen |
51: | **REST API** (recovery) | Reconsumption after disconnection | `client.session.get()`, `client.session.messages()`, `client.session.children()` |
52: | **SSE** (not used) | — | Plugin runs inside runtime; receives events directly, not via HTTP |
53: 
54: ### Rationale
55: The harness plugin runs INSIDE the OpenCode runtime. It receives events directly through hooks, not through SSE (which is for external clients). Hooks provide zero-latency capture. REST API provides reconsumption when agents disconnect and need to rebuild context from persisted tracker files.
56: 
57: ### Hook Mapping
58: 
59: | Hook | SDK Signature | Captures | Persistence Target |
60: |------|--------------|----------|-------------------|
61: | `event` | `hook("event", { eventType, sessionID, event })` | Session lifecycle: created, updated, idle, deleted, error, status, compacted | Main session .md frontmatter updates |
62: | `chat.message` | `hook("chat.message", { sessionID, agent?, model?, messageID?, variant? }) => { message, parts }` | User prompts (##USER), assistant metadata (agent name, model, duration), message parts | Main session .md content sections |
63: | `tool.execute.after` | `hook("tool.execute.after", { tool, sessionID, callID, args }) => { title, output, metadata }` | Tool metadata: skill names, read paths, task delegations, tool errors | Main session .md tool blocks + child session spawn |
64: 
65: ---
66: 
67: ## 4. Target Directory Structure
68: 
69: ```
70: .hivemind/
71: ├── session-tracker/                              # NEW root
72: │   ├── project-continuity.json                    # Cross-session index (connects ALL main sessions)
73: │   └── ses_1ed9df1adffe2hbJudz3sK60y3/           # One subdir per main session
74: │       ├── ses_1ed9df1adffe2hbJudz3sK60y3.md     # Primary knowledge capture (YAML + MD)
75: │       ├── ses_1ed9c5c20ffePWOXce5JQpS5Yk.json   # Child session (delegation level 1)
76: │       ├── ses_1ed9bffbcffesN10Er8Pd91tW7.json   # Child session (delegation level 1)
77: │       └── session-continuity.json                # Session-local index (hierarchy within THIS session)
78: ├── state/
79: │   ├── session-continuity.json                    # EXISTING — harness delegation state
80: │   └── delegations.json                           # EXISTING — delegation records
81: └── event-tracker/                                 # LEGACY — kept as safety net, state files cleaned
82: ```
83: 
84: **Key rule:** Subdirectories are created ONLY when a user starts a new main session (not before). Child session files are written under the parent's subdir. The `session-continuity.json` lives INSIDE each session subdir (not at the top level). The top-level `project-continuity.json` connects all main sessions across the project.
85: 
86: ---
87: 
88: ## 5. File Format Specifications
89: 
90: ### 5.1 Main Session File (`.md` with YAML frontmatter)
91: 
92: ```yaml
93: ---
94: session_id: "ses_1ed9df1adffe2hbJudz3sK60y3"
95: created: "2026-05-10T21:54:36Z"
96: updated: "2026-05-10T22:08:04Z"
97: parent_session_id: null                    # null for root sessions
98: delegation_depth: 0                        # 0 = root, 1 = child, 2 = grandchild
99: children:
100:   - session_id: "ses_1ed9c5c20ffePWOXce5JQpS5Yk"
101:     child_file: "ses_1ed9c5c20ffePWOXce5JQpS5Yk.json"
102:   - session_id: "ses_1ed9bffbcffesN10Er8Pd91tW7"
103:     child_file: "ses_1ed9bffbcffesN10Er8Pd91tW7.json"
104: continuity_index: "session-continuity.json"
105: status: "active"                           # active | idle | completed | error
106: ---
107: 
108: ## USER (turn 1)
109: 
110: Map source architecture for state modules (@hm-l2-architect subagent)...

(Showing lines 1-110 of 538. Use offset=111 to continue.)
</content>

<system-reminder>
Instructions from: /Users/apple/hivemind-plugin-private/.planning/AGENTS.md
# Planning and Governance Sector Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`.planning/` is the Planning/Governance sector for source-backed requirements, roadmaps, architecture maps, audits, research, lifecycle notes, and phase authorization artifacts. It explains and gates work; it does not implement runtime behavior. Source evidence: `.planning/ROADMAP.md:29-49`, `.planning/architecture/sector-agents-docs-implementation-plan-2026-05-07.md:12-15`, `.planning/codebase/STRUCTURE.md:73-79`.

## 2. Allowed mutation authority

- Planning artifacts may document requirements, acceptance matrices, target architecture, audits, roadmaps, and source-backed decisions.
- Planning artifacts may authorize future work only when they explicitly state scope, dependencies, evidence requirements, and gate conditions. Evidence: `.planning/ROADMAP.md:29-49`.
- Date-stamped artifacts are expected for generated plans, reports, and architecture documents when creating new governance outputs.

## 3. Forbidden mutations / explicit no-go boundaries

- Planning docs SHALL NOT claim runtime readiness from docs-only evidence. Evidence: `.planning/ROADMAP.md:47-49`, `.planning/architecture/sector-agents-docs-implementation-plan-2026-05-07.md:1-8`.
- Planning docs SHALL NOT authorize runtime code, `.opencode/**` primitive, or `.hivemind/**` state mutation unless the current phase/user authorization explicitly allows it. Evidence: `.planning/architecture/sector-agents-docs-implementation-plan-2026-05-07.md:12-15`.
- Do not blindly copy OMO or adopt OMO roots; sector mapping must preserve Hivemind surfaces. Evidence: `.planning/architecture/hivemind-sector-agents-target-2026-05-07.md:28-37`.
- Do not treat archived planning artifacts as current authority without a fresh date/status check.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| Coordinators and specialists | Source contracts, acceptance criteria, gate status, and phase boundaries | Must not infer implementation authorization from drafts |
| Quality gates | Trace requirements to evidence and readiness claims | Docs-only artifacts are L5 unless runtime proof is attached |
| Runtime/source sectors | Consume approved requirements and architecture constraints | Implementation occurs outside `.planning/` |
| Human reviewers | Decide authorization and priority | Planning can recommend but not self-approve runtime readiness |

## 5. Naming and placement conventions

- Generated artifacts should be grouped by purpose (`architecture/`, `research/`, `audits/`, `checklists/`, `roadmap/`, `lifecycle/`) and date-stamped with `name-YYYY-MM-DD` where applicable.
- Current codebase intelligence lives under `.planning/codebase/`; active roadmap/requirements/project state live at `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md`, `.planning/PROJECT.md`, and `.planning/STATE.md`. Evidence: `.planning/codebase/STRUCTURE.md:73-79`.
- Archived artifacts under `.planning/archive/` require current validation before use as authority.

## 6. Quality gates and evidence expectations

- Planning requirements should be falsifiable, source-backed, and mapped to acceptance/verification methods.
- Completion claims must state evidence level; O3 and docs-only artifacts are L5 and keep runtime readiness blocked. Evidence: `.planning/ROADMAP.md:47-49`.
- Before a planning artifact authorizes work, it must identify allowed surfaces, forbidden surfaces, actors/consumers, verification commands or inspection methods, and stop conditions.

## 7. Current CP-PTY runway note

- `CP-PTY-00-shell-pty-control-plane-spike` is a docs/spec-only phase. It may update `.planning/**` but must not mutate `src/**`, `tests/**`, `.opencode/**`, or `.hivemind/**`.
- `CP-PTY-01-background-shell-control-plane-mvp` is READY (BOOT-07 complete). Covers command-process delegation (PTY/headless).
- `CP-PTY-02-sdk-session-delegation-integration` covers OpenCode SDK child-session delegation, async/sync dispatch, context injection.
- `CP-PTY-03-agent-subagent-background-task-coordination` covers wave dispatch, completion-looping, queue dedup, lifecycle cascade.
- `CP-PTY-04-cross-cutting-shell-integration` wires everything to session/task/journal/hooks/permissions.
- `SC-PTY-01-read-only-terminal-projection` remains DEFERRED until CP-PTY-01 and Q2 sidecar confirmation.
- Any routing or sidecar plan that invokes background command, PTY, headless shell, or terminal projection behavior must depend on the CP-PTY artifacts and preserve read-only projection boundaries unless a later phase changes them.

</system-reminder>
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/schema-kernel/session-tracker.schema.ts"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/src/schema-kernel/session-tracker.schema.ts</path>
<type>file</type>
<content>
1: /**
2:  * Zod schema for the session-tracker tool.
3:  *
4:  * Defines the input contract for agent-initiated session tracker queries.
5:  * Actions: export-session, list-sessions, search-sessions.
6:  * All operations are read-only (CQRS read-side).
7:  *
8:  * @module schema-kernel/session-tracker-schema
9:  */
10: 
11: import { z } from "zod"
12: 
13: /**
14:  * Valid actions for the session-tracker tool.
15:  */
16: export const SessionTrackerActionSchema = z.enum([
17:   "export-session",
18:   "list-sessions",
19:   "search-sessions",
20: ])
21: 
22: /**
23:  * Input schema for the session-tracker tool.
24:  *
25:  * @example
26:  * ```typescript
27:  * // Export a session
28:  * SessionTrackerInputSchema.parse({
29:  *   action: "export-session",
30:  *   sessionId: "ses_abc123",
31:  * })
32:  *
33:  * // List all sessions
34:  * SessionTrackerInputSchema.parse({
35:  *   action: "list-sessions",
36:  *   limit: 20,
37:  * })
38:  *
39:  * // Search sessions
40:  * SessionTrackerInputSchema.parse({
41:  *   action: "search-sessions",
42:  *   query: "investigator",
43:  * })
44:  * ```
45:  */
46: export const SessionTrackerInputSchema = z.object({
47:   /** The action to perform. */
48:   action: SessionTrackerActionSchema,
49:   /** Session ID (required for export-session). */
50:   sessionId: z.string().optional(),
51:   /** Search query string (required for search-sessions). */
52:   query: z.string().optional(),
53:   /** Maximum number of results (default: 20, max: 100). */
54:   limit: z.number().min(1).max(100).default(20).optional(),
55: })
56: 
57: /** Inferred type for session-tracker tool input. */
58: export type SessionTrackerInput = z.infer<typeof SessionTrackerInputSchema>

(End of file - total 58 lines)
</content>

<system-reminder>
Instructions from: /Users/apple/hivemind-plugin-private/src/schema-kernel/AGENTS.md
# Schema Kernel Sector Guidance

**Parent sector:** `src/AGENTS.md` | **Architecture:** `.planning/codebase/ARCHITECTURE.md` | **Classification:** Hard Harness — validation-leaf (Zod v4 contracts, no durable writes)

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/schema-kernel/` is the Hard Harness validation-contract sector. It owns Zod v4 schemas for OpenCode meta-concepts, permissions, MCP servers, prompt enhancement, config precedence, agent work contracts, runtime pressure, SDK supervision, command engine, doc intelligence, and trajectory surfaces. Source evidence: `.planning/codebase/ARCHITECTURE.md:195-200`, `.planning/codebase/STRUCTURE.md:114-118`.

## 2. Allowed mutation authority

- Schema files may define and export validation contracts, typed parse results, fallback validation helpers, and barrel exports.
- Schema changes may support tools, config workflow, validation/restart checks, and primitive configuration when paired with consumers. Evidence: `.planning/codebase/ARCHITECTURE.md:195-200`, `.planning/REQUIREMENTS.md:42-56`.
- Schema changes may reject, strip, or warn on invalid structures according to the owning tool or config workflow contract. Evidence: `.planning/codebase/ARCHITECTURE.md:397-401`.

## 3. Forbidden mutations / explicit no-go boundaries

- Schemas SHALL NOT perform durable writes, SDK calls, filesystem state mutation, or command execution.
- Schemas SHALL NOT become hidden runtime feature implementations; they define contracts consumed by tools/lib modules.
- Schemas SHALL NOT introduce `any` on new code or bypass TypeScript strictness. Evidence: `.planning/codebase/CONVENTIONS.md:70-75`.
- Schemas SHALL NOT claim registry/config completeness when consumers are partial or missing. Evidence: `.planning/REQUIREMENTS.md:42-56`.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| `src/tools/configure-primitive.ts` and `validate-restart` | Validate primitive and restart contracts | Must handle schema errors through tool responses |
| Config workflow and runtime policy modules | Parse and validate workspace/config contracts | Must own side effects outside the schema |
| Tests | Validate accepted/rejected shapes | Schema tests do not prove runtime integration |
| `.opencode/` primitives | Are validated by schemas where supported | Schema existence is not registry enforcement by itself |

## 5. Naming and placement conventions

- Schema files use `kebab-case.schema.ts`; barrel exports live in `src/schema-kernel/index.ts`. Evidence: `.planning/codebase/STRUCTURE.md:186-195`, `.planning/codebase/STRUCTURE.md:237-240`.
- Tests live under `tests/schema-kernel/` and validate real Zod behavior. Evidence: `.planning/codebase/TESTING.md:52-64`, `.planning/codebase/TESTING.md:208-213`.
- Use named exports and ESM `.js` import conventions where imports are needed. Evidence: `.planning/codebase/CONVENTIONS.md:80-98`, `.planning/codebase/CONVENTIONS.md:169-181`.

## 6. Quality gates and evidence expectations

- Schema changes require `npm run typecheck` and scoped `npx vitest run tests/schema-kernel/...` evidence.
- If a schema change claims runtime enforcement, provide consumer evidence from the owning tool/lib module; schema-only proof is insufficient.
- Docs-only edits remain L5 evidence and must not alter readiness status. Evidence: `.planning/ROADMAP.md:47-49`.

</system-reminder>
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/project-continuity.json"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_02_RY9nV0dNvlOEuJKul9O12546"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1ebe832c5ffeeYuFbS1kqleZnD/session-continuity.json"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e9a6ecf5ffev5trgNwpy4CjOf/session-continuity.json"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e97a18f0ffe4tz4GJcaLAfmC3/session-continuity.json"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e903ee6effet2MD0kFjZUNzug/session-continuity.json"
}
```


### Tool: skill

**Input:**
```json
{
  "name": "hf-l2-naming-syndicate"
}
```

**Output:** (pruned)
```
# Skill: hf-l2-naming-syndicate
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_xMDpl7AUOTdwBBEyZlSA4116"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/skills-lab/active"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_fJK9YYMH4J6WeNGjv8lK3270"
}
```


### Tool: write

**Input:**
```json
{
  "callID": "call_00_J0mIokqXh8W6xZvLuhuB3505"
}
```


### Tool: write

**Input:**
```json
{
  "callID": "call_00_ClydzXCGHSGc9TajU08E2984"
}
```


### Tool: write

**Input:**
```json
{
  "callID": "call_01_YJTcoWOs2MkQ8jaU204I4662"
}
```


### Tool: write

**Input:**
```json
{
  "callID": "call_00_Qd7RDFacFOATe17E2vCQ5455"
}
```


### Tool: write

**Input:**
```json
{
  "callID": "call_01_nANpLPZzQyOoAOyOUGTw4613"
}
```


### Tool: write

**Input:**
```json
{
  "callID": "call_02_kRRPHy6nx8BF1uEEDGSt9502"
}
```


### Tool: write

**Input:**
```json
{
  "callID": "call_03_sDurObBvPNRFGyIsYVa89373"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_HGZhmofsXCDRC5vJua9Y3158"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_xibYzDbqywRptoPhrW3A6130"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_02_Qabr8WaLigHun8sTDgS47924"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_00_0g6AIxp05Kd0UZrFTVQu9714"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_01_Ipbqw3uDyvOSr9YUn5Lo1269"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_tXTf6FhjEcHCBQ7HTcfc6956"
}
```

