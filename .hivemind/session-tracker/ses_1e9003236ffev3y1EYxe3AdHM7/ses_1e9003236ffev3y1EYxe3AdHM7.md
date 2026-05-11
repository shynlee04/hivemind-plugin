---
sessionID: ses_1e9003236ffev3y1EYxe3AdHM7
created: 2026-05-11T12:25:23.669Z
updated: 2026-05-11T12:25:23.669Z
parentSessionID: null
delegationDepth: 0
children: []
continuityIndex: session-continuity.json
status: active
---

## USER (turn 1)

You are the subagent hf-l2-skill-builder. You are being delegated from hf-l1-coordinator to create a draft skill package. You must work within the boundaries and success metrics below.

## TASK
Create the `hivemind-power-on` governance skill at `.hivefiver-meta-builder/skills-lab/hivemind-power-on/SKILL.md` with progressive disclosure references.

## LOAD THESE SKILLS FIRST (in order):
1. Load `hf-l2-use-authoring-skills` for skill authoring methodology
2. Load `hf-l2-naming-syndicate` for naming convention validation

## WHAT TO PRODUCE
A draft SKILL.md (< 300 lines) plus 6 reference files in a `references/` subdirectory.

## CONSTRAINTS AND BOUNDARIES

### Skill Identity
- **Name**: `hivemind-power-on` (new cross-lineage governance prefix — `hivemind-*` for skills loaded by BOTH hm-* and hf-* L0/L1 agents)
- **Role**: MUST-LOAD governance skill. First skill loaded at ALL session starts. Routes workflows across hm-* and hf-* lineages, manages session lifecycle (start/resume/compact-survival), orchestrates delegation chains, enforces quality gates.
- **Loading rule**: Loaded by hm-l0-orchestrator, hf-l0-orchestrator, hm-l1-coordinator, hf-l1-coordinator at minimum. Always FIRST before any domain-specific skill.
- **Load priority**: 1 (highest)

### Critical Design Principles
1. **Procedures over declarations** — Teach HOW, not WHAT. Use imperative verbs, checklists.
2. **Progressive disclosure** — SKILL.md is <300 lines. Deep details go in references/.
3. **Iron Law** — Must have ONE binding rule at top that governs the entire skill.
4. **Session-lifecycle focus** — This is the user's #1 pain point. Agents currently do NOT know how to resume aborted sessions.

### SKILL.md Body Must Cover These Mandatory Sections (imprecise, concise):

1. **Role statement**: "Must-load governance skill. Route, coordinate, and ensure continuity for the Hivemind agentic workforce under OpenCode."
2. **When to load**: At ALL session starts (new, resume after disconnect, after compact/purge)
3. **Lineage Classification Rules (Pattern 1)**: Rigid rules for classifying user intent:
   - Meta-concept work (agents, skills, commands, tools creation/audit/repair) → hf-* lineage
   - Product development (features, bugs, architecture, implementation) → hm-* lineage
   - Routing commands: /hf-create, /hf-audit, /hf-stack → hf-* 
   - Implementation commands: /plan, /deep-init, /ultrawork → hm-*
4. **Session Lifecycle Protocol (Pattern 3 — MOST CRITICAL)**: Three sub-protocols:
   - FRESH START: Check for active sessions first
   - RESUME AFTER DISCONNECT: Step-by-step using session-tracker tool and EXACT task_id
   - LONGHAUL COMPACT SURVIVAL: Export, reconstruct, revalidate
5. **Session-Tracker Tool Usage**: Exact tool invocations for all 3 actions
6. **Delegation Chain Protocol**: Session ID tracking, depth limits, parent→child propagation
7. **Quality Gate Integration**: Lifecycle → spec → evidence triad
8. **Context Optimization Rules**: Frontmatter-only reads, grep offset, max 3 skills
9. **Cross-Lineage Bridges**: hf FLEXIBLE, hm STRICT, document all cross-lineage

## REAL API EVIDENCE (VALIDATED — USE THESE EXACT SIGNATURES)

### session-tracker tool (verified from src/tools/hivemind/session-tracker.ts + schema):
```typescript
// Three actions:
session-tracker(action: "list-sessions")              // Returns all sessions from project-continuity.json
session-tracker(action: "export-session", sessionId: "ses_xxx")  // Returns full .md content
session-tracker(action: "search-sessions", query: "aborted|cancelled")  // Searches .md files
// Optional: limit (default 20, max 100)
```

### File paths (verified from live directory + CP-ST-01 SPEC):
```
.hivemind/session-tracker/project-continuity.json     // Cross-session index
.hivemind/session-tracker/{session_id}/{session_id}.md // Main capture (YAML frontmatter + MD)
.hivemind/session-tracker/{session_id}/{child_id}.json // Child delegations
.hivemind/session-tracker/{session_id}/session-continuity.json // Local hierarchy
.hivemind/state/session-continuity.json               // Harness-level state
.hivemind/state/delegations.json                       // Delegation records
```

### project-continuity.json real schema (verified):
```json
{
  "version": "2.0",
  "projectRoot": "...",
  "lastUpdated": "...",
  "sessions": {
    "ses_xxx": {
      "dir": "ses_xxx/",
      "mainFile": "ses_xxx.md",
      "continuityIndex": "ses_xxx/session-continuity.json",
      "created": "ISO-8601",
      "updated": "ISO-8601",
      "status": "active|idle|completed|error",
      "childCount": N,
      "totalDelegationDepth": N
    }
  },
  "chronologicalOrder": ["ses_aaa", "ses_bbb"]
}
```

### session-continuity.json real schema (verified):
```json
{
  "version": "2.0",
  "sessionID": "ses_xxx",
  "lastUpdated": "ISO-8601",
  "hierarchy": {
    "root": "ses_xxx",
    "children": {
      "ses_child": {
        "file": "ses_child.json",
        "depth": 1,
        "status": "active|completed|error",
        "delegatedBy": "main_l0_agent",
        "children": {}
      }
    }
  },
  "turnCount": N,
  "toolSummary": { "skill": N, "read": N, "task": N }
}
```

### task tool resume (critical for session resume):
- `task_id` IS the session ID — when resuming, pass the SAME id
- `subagent_type` must match the original agent type
- `prompt` — do NOT repeat when resuming; context is preserved
- `delegate-task` tool in OpenCode: `agent`, `prompt`, `title`, `safetyCeilingMs`

### Session .md file format (verified from CP-ST-01 SPEC):
- YAML frontmatter with session_id, created, updated, parent_session_id, delegation_depth, children[], status
- `## USER (turn N)` sections
- `## main_l0_agent` sections with name, model, thinking_duration
- Tool blocks: `### Tool: skill`, `### Tool: read`, `### Tool: task`

## IRON LAWS (MUST be in SKILL.md body):
1. NEVER start a new session when an aborted one exists. Use EXACT task_id.
2. NEVER repeat the prompt when resuming. Context is preserved.
3. NEVER dispatch directly to L2. Always L0→L1→L2.
4. NEVER skip the quality gate triad. Lifecycle → spec → evidence, in order.
5. NEVER load more than 3 skills at once. Context budget is shared.
6. NEVER read full files when frontmatter or grep is sufficient.
7. ALWAYS use session-tracker tool to find aborted sessions before starting fresh.

## REFERENCES TO CREATE (6 files):

### references/01-session-tracker-anatomy.md
Explain `.hivemind/session-tracker/` directory: project-continuity.json (cross-session), session subdirs, .md captures, child .json, session-continuity.json (local). How to navigate, filter for aborted, read efficiently.

### references/02-task-tool-resume-spec.md
Document the `task` tool parameters for session resume: task_id = session ID, prompt NOT repeated, subagent_type must match. How session-tracker captures task output.

### references/03-lineage-routing-decision-tree.md
Decision tree for hm vs hf classification with specific rules for cross-lineage.

### references/04-project-phase-routing.md
Map project phases (planning, implementation, audit, meta-builder) to correct workflows and agents.

### references/05-continuity-index-navigation.md
Schema reference for project-continuity.json and session-continuity.json. Field semantics, status values, tree traversal.

### references/06-delegation-depth-recovery.md
Recovery protocol for multi-level delegation trees. The recovery cascade: always resume from deepest surviving parent.

## FRONTMATTER:
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
lineage: hivemind (cross-lineage governance — loaded by both hm-* and hf-* L0/L1 agents)
load_priority: 1
---
```

## SUCCESS METRICS
1. SKILL.md < 300 lines, uses imperative/procedural style
2. All 6 reference files created with real, accurate API signatures matching the evidence above
3. No dead references or phantom dependencies
4. Follows agentskills.io principles: procedures over declarations, checklists for 3+ step workflows
5. Naming follows hf-l2-naming-syndicate conventions
6. Session resume protocol is the most detailed section (pain point #1)
7. Iron Laws are clearly stated and non-negotiable

## PROCESS
1. Load the skills listed above
2. Read the existing skills for structural patterns: `.opencode/skills/hf-l2-skill-router/SKILL.md`, `.opencode/skills/hm-l2-lineage-router/SKILL.md`
3. Write SKILL.md at `.hivefiver-meta-builder/skills-lab/hivemind-power-on/SKILL.md`
4. Create `references/` directory and write all 6 files
5. Validate: no phantom references, API signatures match evidence, <300 lines for SKILL.md
6. Return the complete content of all created files + file paths

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
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_02_l32csI4QjBHR4xXHwOj70289"
}
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
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/skills-lab"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/skills-lab/active"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_01_TBSLD6sL2Vw5iHHrgiIx9980"
}
```

