---
sessionID: ses_1e903ee6effet2MD0kFjZUNzug
created: 2026-05-11T12:21:18.877Z
updated: 2026-05-11T12:21:18.877Z
parentSessionID: null
delegationDepth: 0
children: []
continuityIndex: session-continuity.json
status: active
---

## USER (turn 1)

You are the subagent hf-l1-coordinator. You are being delegated a skill creation task from hf-l0-orchestrator. You must route this to hf-l2-skill-builder for creation with progressive disclosure references.

## TASK: Draft the `hivemind-power-on` core governance skill

This is the mandatory project-level governance skill that ALL L0 and L1 agents (both hm-* and hf-* lineages) must load at session start. It governs the complete Hivemind runtime lifecycle and workflow routing under OpenCode.

### What to Load (do NOT load all these — load in order):
1. First, load `hf-l2-use-authoring-skills` to get skill authoring methodology
2. Load `hf-l2-skill-router` to understand skill bundle routing patterns (for reference design)
3. Load `hm-l3-hivemind-state-reference` for understanding .hivemind/ state structure

### WHAT TO PRODUCE
Create a draft SKILL.md for the `hivemind-power-on` skill at `.hivefiver-meta-builder/skills-lab/hivemind-power-on/SKILL.md` with this structure:

The skill must implement a 3-pattern routing architecture:
- **Pattern 1**: High-level lineage routing (classify as hm-* or hf-* task)
- **Pattern 2**: Domain-specific routing (map to L1 coordinator + specialist skills)
- **Pattern 3**: Conditional branching (session start vs resume vs longhaul compact survival)

## CORE MANDATORY SECTIONS (must be precise, concise, non-negotiable):

### 1. SKILL.md Body (concise, <300 lines)
The body must contain:
- **Role statement**: "Must-load governance skill. Route, coordinate, and ensure continuity for the Hivemind agentic workforce under OpenCode."
- **When to load**: At ALL session starts (new, resume after disconnect, after compact/purge), loaded by hm-l0-orchestrator, hf-l0-orchestrator, hm-l1-coordinator, hf-l1-coordinator at minimum
- **Loading priority**: FIRST skill loaded, before any domain-specific skills

### 2. Lineage Classification Rules (Pattern 1)
Rigid rules for classifying user intent:
- Meta-concept work (agents, skills, commands, tools creation/audit/repair) → hf-* lineage
- Product development (features, bugs, architecture, implementation) → hm-* lineage
- Routing commands to detect: /hf-create, /hf-audit, /hf-stack → hf-* 
- Implementation commands: /plan, /deep-init, /ultrawork → hm-*

### 3. Session Lifecycle Protocol (Pattern 3 — MOST CRITICAL)
This is the user's #1 pain point. Agents currently do NOT know how to resume aborted sessions.

**FRESH START:**
- Check `project-continuity.json` for any active sessions
- If no active/aborted sessions → proceed as normal session

**RESUME AFTER DISCONNECT:**
Step-by-step protocol:
```
1. Read .hivemind/session-tracker/project-continuity.json
2. Find sessions with status "active" (sorted by updated descending)
3. For each active session, read its session-continuity.json
4. Find children with status "active" (these are aborted delegations)
5. Identify the DEEPEST aborted delegation (highest delegation_depth)
6. Use session-tracker tool: { action: "export-session", sessionId: "<root-session-id>" }
   to retrieve the .md context file
7. Use line-aware reading: grep for "## USER (turn" to find last user message
8. Use session-tracker tool with search action to find aborted/cancelled status markers
9. Determine the EXACT task_id of the aborted delegation
10. Resume by dispatching with SAME task_id: 
    task(description="resume", subagent_type="<SAME-AGENT>", task_id="<EXACT-ID>")
11. CRITICAL: Do NOT repeat the prompt. Context is preserved in the session.
12. CRITICAL: Do NOT start a NEW session ID. Use the EXACT aborted session ID.
```

**L0 → L1 propagation:** When L0 resumes, it must include these instructions for L1 to follow down-level:
```
"If you are resuming a L1 session: 
1. Check your own session-continuity.json for aborted L2 children
2. Resume them with EXACT task_id. DO NOT start new. DO NOT repeat prompt.
3. Report back the resumed delegation chain."
```

**LONGHAUL COMPACT SURVIVAL:**
When context is compacted/pruned:
```
1. Immediately export current session via session-tracker
2. Read project-continuity.json → find current session
3. Load session-continuity.json → identify active delegation tree
4. Read the most recent ## USER turn from .md file
5. Reconstruct minimum working context: last user intent + active delegations
6. Revalidate that all pending delegations still have valid task_ids
```

### 4. Session-Tracker Tool Usage (precise commands)
Document exact tool invocations:
- Find all sessions: `session-tracker(action: "list-sessions")`
- Export a session: `session-tracker(action: "export-session", sessionId: "ses_xxx")`
- Search for aborts: `session-tracker(action: "search-sessions", query: "aborted|cancelled")`
- Navigate hierarchy: Read `session-continuity.json` for children structure
- Line-aware reading: `grep(pattern: "## USER (turn")` on .md files, then `read(filePath, offset=N, limit=M)`

### 5. Delegation Chain Protocol
When delegating, L0 must:
- Always include session ID tracking
- Record delegation in memory (task_id → agent → status)
- After disconnect: ONLY resume, never restart
- Track delegation depth (max 3 levels: L0→L1→L2)
- NEVER dispatch directly to L2 — always through L1

### 6. Quality Gate Integration
- Every completed delegation must pass: lifecycle → spec → evidence
- Use `gate-l3-lifecycle-integration`, `gate-l3-spec-compliance`, `gate-l3-evidence-truth`
- FAIL → return to coordinator with specific gaps (max 3 retries)

### 7. Context Optimization Rules
- NEVER read full AGENTS.md — read frontmatter/summary only
- NEVER read full .md session files — use grep + offset
- NEVER load more than 3 skills at once
- After 70% context, export via session-tracker and checkpoint
- Use `prompt-skim` for large prompts before deep analysis

### 8. Cross-Lineage Bridges
- hf-* skills have FLEXIBLE binding — may load hm-* for codebase investigation
- hm-* skills have STRICT binding — NO hf-* skills unless explicitly routed
- Document all cross-lineage access in output report

## REFERENCES TO CREATE (progressive disclosure):

### references/01-session-tracker-anatomy.md
Explain the .hivemind/session-tracker/ directory structure:
```
.hivemind/session-tracker/
├── project-continuity.json     ← Cross-session index (ALL main sessions)
└── {session_id}/               ← One subdir per main session
    ├── {session_id}.md          ← Main capture file (YAML frontmatter + MD)
    ├── {child_id}.json          ← Child delegation sessions
    └── session-continuity.json  ← Hierarchy index for this session
```
- How to navigate: start at project-continuity.json → find main session → read session-continuity.json → find children
- How to filter for aborted: grep "active" status, then check children for "active"
- How to read context efficiently: use grep for headings, then offset/limit

### references/02-task-tool-resume-spec.md
Document the OpenCode `task` tool parameters critical for session resume:
```json
{
  "description": "Resume aborted task",
  "subagent_type": "hm-l2-investigator",
  "task_id": "ses_1ed9c5c20ffePWOXce5JQpS5Yk"
}
```
- `task_id` IS the session ID — when resuming, pass the SAME id
- `prompt` — do NOT repeat when resuming; context is preserved
- `subagent_type` — must match the original agent type
- How session-tracker captures task output (task_id in tool.output → child .json)

### references/03-lineage-routing-decision-tree.md
Decision tree for hm vs hf classification:
- Is the task about creating/auditing/repairing OpenCode primitives? → hf-*
- Is the task about implementing features/fixing bugs? → hm-*
- Is the task about routing/coordination? → check command prefix
- Cross-lineage tasks: hf → hm for investigation only (document justification)

### references/04-project-phase-routing.md
Map project phases to correct workflows:
- Planning phase → hm-l2-planner, hm-l2-spec-driven-authoring
- Implementation phase → hm-l2-executor, hm-l2-test-driven-execution
- Audit phase → hm-l2-auditor, hm-l2-reviewer
- Meta-builder phase → hf-l2-skill-builder, hf-l2-agent-builder

### references/05-continuity-index-navigation.md
How to efficiently navigate the session-tracker JSON indices:
- project-continuity.json schema and field meanings
- session-continuity.json hierarchy interpretation
- How to traverse the parent→child→grandchild tree
- Status field semantics: active, idle, completed, error, aborted, cancelled

### references/06-delegation-depth-recovery.md
Recovery protocol for multi-level delegation trees:
- L0 delegates to L1 → L1 delegates to L2 → L2 may delegate to L3
- If L2 aborted: L1 must resume L2 with exact task_id
- If L1 aborted: L0 must resume L1, then L1 resumes L2
- The recovery cascade: always resume from the deepest surviving parent

## SKILL FRONTMATTER (for SKILL.md):
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

## NON-NEGOTIABLE IRON LAWS (must be in SKILL.md body):
1. NEVER start a new session when an aborted one exists. Use EXACT task_id.
2. NEVER repeat the prompt when resuming. Context is preserved.
3. NEVER dispatch directly to L2. Always L0→L1→L2.
4. NEVER skip the quality gate triad. Lifecycle → spec → evidence, in order.
5. NEVER load more than 3 skills at once. Context budget is shared.
6. NEVER read full files when frontmatter or grep is sufficient.
7. ALWAYS use session-tracker tool to find aborted sessions before starting fresh.

## OUTPUT FORMAT
Return:
1. The complete SKILL.md content
2. The content for each references/*.md file
3. A todo list showing what was created
4. The skill file path where it was written

## PROCESS
1. First investigate any existing skill patterns by reading existing skills like `hf-l2-skill-router/SKILL.md`, `hm-l2-lineage-router/SKILL.md`, `hm-l2-user-intent-interactive-loop/SKILL.md` for structural patterns
2. Read the session-tracker tool source at `src/tools/hivemind/session-tracker.ts` and the session-tracker schema at `src/schema-kernel/session-tracker.schema.ts` to understand the exact API
3. Read the CP-ST-01 SPEC at `.planning/phases/CP-ST-01-session-tracker-revamp/01-SPEC.md` (sections 4-6) for the file formats
4. Write the skill with progressive disclosure references
5. Validate against hf-l2-naming-syndicate conventions
6. Return the complete draft

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
  "name": "hf-l2-skill-router"
}
```

**Output:** (pruned)
```
# Skill: hf-l2-skill-router
```


### Tool: skill

**Input:**
```json
{
  "name": "hm-l3-hivemind-state-reference"
}
```

**Output:** (pruned)
```
# Skill: hm-l3-hivemind-state-reference
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


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-user-intent-interactive-loop/SKILL.md"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_03_WaTgD4uryl3TPY5hA9Ff9375"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_04_2DNBxkSpux5znHpMFFG80985"
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

(Showing lines 1-100 of 538. Use offset=101 to continue.)
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
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/CP-ST-01-session-tracker-revamp/01-SPEC.md"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/.planning/phases/CP-ST-01-session-tracker-revamp/01-SPEC.md</path>
<type>file</type>
<content>
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
111: 
112: ## main_l0_agent
113: 
114: **name:** Hm-L0-Orchestrator
115: **model:** DeepSeek V4 Pro
116: **thinking_duration:** 19.7s
117: 
118: ### Tool: skill
119: 
120: **Input:**
121: ```json
122: { "name": "hm-l2-coordinating-loop" }
123: ```
124: 
125: **Output:** (pruned — first line only)
126: ```
127: # Skill: hm-l2-coordinating-loop
128: ```
129: 
130: ### Tool: read
131: 
132: **Input:**
133: ```json
134: { "filePath": "/Users/apple/hivemind-plugin-private/.hivemind/state/session-continuity.json" }
135: ```
136: 
137: **Error:** File not found
138: 
139: ### Tool: read
140: 
141: **Input:**
142: ```json
143: { "filePath": "/Users/apple/hivemind-plugin-private/.hivemind/state/delegations.json" }
144: ```
145: 
146: **Output:** (success — path only)
147: ```
148: /Users/apple/hivemind-plugin-private/.hivemind/state/delegations.json
149: ```
150: 
151: ### Tool: task
152: 
153: **Input:**
154: ```json
155: { "description": "Investigate event tracker bugs", "subagent_type": "hm-l2-investigator" }
156: ```
157: 
158: **Output:**
159: ```
160: task_id: ses_1ed9c5c20ffePWOXce5JQpS5Yk
161: ```
162: 
163: ## USER (turn 2)
164: 
165: Continue if you have next steps...
166: ```
167: 
168: ### Capture Rules
169: | Element | Capture | Skip |
170: |---------|---------|------|
171: | User message (`##USER`) | Full text, turn counter | — |
172: | Assistant block | Transform to `main_l0_agent` with name, model, thinking_duration | Thinking blocks |
173: | Tool: skill | Input `{name}`, first line of output only | Full skill content |
174: | Tool: read | Input `{filePath}`, error if any | File content on success |
175: | Tool: task | Input `{description, subagent_type}`, output `task_id` | Full delegation prompt |
176: | Other tools | Input metadata only | Verbose output |
177: 
178: ### 5.2 Child Session File (`.json`)
179: 
180: ```json
181: {
182:   "session_id": "ses_1ed9c5c20ffePWOXce5JQpS5Yk",
183:   "parent_session_id": "ses_1ed9df1adffe2hbJudz3sK60y3",
184:   "delegation_depth": 1,
185:   "delegated_by": {
186:     "agent_name": "Hm-L0-Orchestrator",
187:     "tool": "task",
188:     "description": "Investigate event tracker bugs",
189:     "subagent_type": "hm-l2-investigator"
190:   },
191:   "created": "2026-05-10T21:56:44Z",
192:   "updated": "2026-05-10T22:04:47Z",
193:   "status": "completed",
194:   "main_agent": {
195:     "name": "Hm-L2-Investigator",
196:     "model": "DeepSeek V4 Pro"
197:   },
198:   "turns": [
199:     {
200:       "turn": 1,
201:       "actor": "main_l0_agent",
202:       "actor_transformed_from": "user",
203:       "content": "You are the subagent hm-l2-investigator...",
204:       "tools": [
205:         {
206:           "tool": "skill",
207:           "input": { "name": "hm-l3-detective" },
208:           "output_pruned": "# Skill: hm-l3-detective"
209:         },
210:         {
211:           "tool": "read",
212:           "input": { "filePath": "/path/to/file.ts" },
213:           "status": "success"
214:         }
215:       ]
216:     }
217:   ],
218:   "children": []
219: }
220: ```
221: 
222: **Critical transformation:** In child sessions, the `##USER` block is NOT a human user — it's the parent agent delegating. The session tracker must recognize this (by checking `session.parentID` via SDK) and transform `##USER` into `main_l0_agent` with the parent's agent name and model.
223: 
224: ### 5.3 Session-Local Continuity Index (`{session-dir}/session-continuity.json`)
225: 
226: Lives INSIDE each main session subdir. Tracks the parent-child hierarchy within that specific session.
227: 
228: ```json
229: {
230:   "version": "2.0",
231:   "session_id": "ses_1ed9df1adffe2hbJudz3sK60y3",
232:   "last_updated": "2026-05-10T22:08:04Z",
233:   "hierarchy": {
234:     "root": "ses_1ed9df1adffe2hbJudz3sK60y3",
235:     "children": {
236:       "ses_1ed9c5c20ffePWOXce5JQpS5Yk": {
237:         "file": "ses_1ed9c5c20ffePWOXce5JQpS5Yk.json",
238:         "depth": 1,
239:         "status": "completed",
240:         "delegated_by": "main_l0_agent",
241:         "children": {}
242:       },
243:       "ses_1ed9bffbcffesN10Er8Pd91tW7": {
244:         "file": "ses_1ed9bffbcffesN10Er8Pd91tW7.json",
245:         "depth": 1,
246:         "status": "completed",
247:         "delegated_by": "main_l0_agent",
248:         "children": {}
249:       }
250:     }
251:   },
252:   "turn_count": 2,
253:   "tool_summary": {
254:     "skill": 3,
255:     "read": 12,
256:     "task": 2
257:   }
258: }
259: ```
260: 
261: ### 5.4 Project-Level Continuity Index (`project-continuity.json`)
262: 
263: Lives at the top level of `session-tracker/`. Connects ALL main sessions across the project. Supports cross-session navigation and chronological ordering.
264: 
265: ```json
266: {
267:   "version": "2.0",
268:   "project_root": "/Users/apple/hivemind-plugin-private",
269:   "last_updated": "2026-05-10T22:08:04Z",
270:   "sessions": {
271:     "ses_1ed9df1adffe2hbJudz3sK60y3": {
272:       "dir": "ses_1ed9df1adffe2hbJudz3sK60y3/",
273:       "main_file": "ses_1ed9df1adffe2hbJudz3sK60y3.md",
274:       "continuity_index": "ses_1ed9df1adffe2hbJudz3sK60y3/session-continuity.json",
275:       "created": "2026-05-10T21:54:36Z",
276:       "updated": "2026-05-10T22:08:04Z",
277:       "status": "active",
278:       "child_count": 2,
279:       "total_delegation_depth": 1
280:     },
281:     "ses_1ed8a1b2cffeXyZ789AbCdEf01": {
282:       "dir": "ses_1ed8a1b2cffeXyZ789AbCdEf01/",
283:       "main_file": "ses_1ed8a1b2cffeXyZ789AbCdEf01.md",
284:       "continuity_index": "ses_1ed8a1b2cffeXyZ789AbCdEf01/session-continuity.json",
285:       "created": "2026-05-10T19:30:00Z",
286:       "updated": "2026-05-10T20:15:00Z",
287:       "status": "completed",
288:       "child_count": 5,
289:       "total_delegation_depth": 3
290:     }
291:   },
292:   "chronological_order": [
293:     "ses_1ed8a1b2cffeXyZ789AbCdEf01",
294:     "ses_1ed9df1adffe2hbJudz3sK60y3"
295:   ]
296: }
297: ```
298: 
299: **Purpose separation:**

(Showing lines 100-299 of 538. Use offset=300 to continue.)
</content>
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivemind/state/session-continuity.json"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/.hivemind/state/session-continuity.json</path>
<type>file</type>
<content>
1: {
2:   "version": 1,
3:   "updatedAt": 1778446132343,
4:   "sessions": {
5:     "ses-parent-tool": {
6:       "sessionID": "ses-parent-tool",
7:       "promptParams": {},
8:       "metadata": {
9:         "status": "running",
10:         "description": "Recovered parent session notification queue",
11:         "delegation": null,
12:         "constraints": [],
13:         "pendingNotifications": [
14:           {
15:             "sessionID": "pty:pty-delete-on-terminate",
16:             "description": "Delegation: command-runner",
17:             "agent": "command-runner",
18:             "status": "failed",
19:             "error": "[Harness] PTY delegation is non-resumable-after-restart: PTY OS processes do not survive harness restarts",
20:             "resultPreview": "[Harness] PTY delegation is non-resumable-after-restart: PTY OS processes do not survive harness restarts",
21:             "briefSummary": "Delegated work finished with terminal state non-resumable-after-restart after 29ms. Summary preview: [Harness] PTY delegation is non-resumable-after-restart: PTY OS processes do not survive harness restarts",
22:             "outputLink": "session://pty:pty-delete-on-terminate",
23:             "duration": 29,
24:             "metadata": {
25:               "delegationId": "90632060-2283-4880-8b6c-fec96f7cc923",
26:               "terminalState": "error",
27:               "recoveryGuarantee": "best-effort",
28:               "summaryPreview": "[Harness] PTY delegation is non-resumable-after-restart: PTY OS processes do not survive harness restarts"
29:             },
30:             "createdAt": 1778446132342,
31:             "delivered": false
32:           }
33:         ],
34:         "updatedAt": 1778446132342
35:       }
36:     }
37:   },
38:   "governance": {
39:     "rules": [],
40:     "violations": [],
41:     "updatedAt": 1778446132303
42:   }
43: }

(End of file - total 43 lines)
</content>

<system-reminder>
Instructions from: /Users/apple/hivemind-plugin-private/.hivemind/AGENTS.md
# Internal State Sector Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`.hivemind/` is the Internal State sector and canonical Q6 state root for Hivemind runtime persistence: session continuity, delegation records, config workflow state, event tracker artifacts, session journals, execution lineage, and recovery artifacts. Source evidence: `.planning/codebase/ARCHITECTURE.md:247-255`, `.planning/codebase/ARCHITECTURE.md:405-411`, `.planning/codebase/STRUCTURE.md:130-134`.

## 2. Allowed mutation authority

- Typed runtime owners in `src/task-management/`, `src/coordination/`, and `src/features/` may write their assigned state files through approved persistence modules. Evidence: `.planning/codebase/ARCHITECTURE.md:311-315`, `.planning/codebase/ARCHITECTURE.md:405-411`.
- Tools may trigger state mutations through library owners when the tool contract permits mutation. Evidence: `.planning/codebase/ARCHITECTURE.md:339-353`.
- Event tracker artifacts may be best-effort hook-driven outputs only when routed through library/event-tracker owners; they must not block canonical handling. Evidence: `.planning/codebase/ARCHITECTURE.md:302-315`, `.planning/codebase/ARCHITECTURE.md:388-392`.

## 3. Forbidden mutations / explicit no-go boundaries

- Hooks SHALL NOT directly write durable state into `.hivemind/`; hook effects must stay observation/response-shaping/guard-decision. Evidence: `.planning/codebase/ARCHITECTURE.md:339-353`.
- `.hivemind/` state SHALL NOT be moved back into `.opencode/`; `.opencode/state/` is legacy migration-only. Evidence: `.planning/codebase/ARCHITECTURE.md:351-353`, `.planning/codebase/STRUCTURE.md:295-299`.
- Do not fabricate missing state subdirectories or ownership modules from documentation-only work; bootstrap/state ownership remains an active gap. Evidence: `.planning/PROJECT.md:29-42`, `.planning/REQUIREMENTS.md:46-56`.
- Do not edit runtime state artifacts manually unless a recovery workflow explicitly authorizes it.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| `src/task-management/continuity/` | Owns session continuity JSON persistence | Must deep-clone/normalize/quarantine through code owners |
| `src/task-management/continuity/delegation-persistence.ts` | Owns delegation record I/O | Tools/managers call the owner, not raw edits |
| Event tracker/session journal/lineage modules | Produce audit and timeline artifacts | Best-effort artifacts are not completion proof by themselves |
| Sidecar/planning readers | May read canonical artifacts | Read-only consumers must not mutate state |
| Recovery workflows | Assess and repair state under authorization | Must preserve evidence and avoid manual drift |

## 5. Naming and placement conventions

- Current known state folders include `.hivemind/state/`, `.hivemind/event-tracker/`, and `.hivemind/poor-prompts/`. Evidence: `.planning/codebase/STRUCTURE.md:40-43`, `.planning/codebase/STRUCTURE.md:130-134`.
- State files should be owned by typed modules before being treated as runtime-contract surfaces. Evidence: `.planning/PROJECT.md:29-42`, `.planning/REQUIREMENTS.md:46-56`.
- Do not use `.opencode/` for new internal state naming or placement. Evidence: `.planning/codebase/ARCHITECTURE.md:247-255`.

## 6. Quality gates and evidence expectations

- State-sector changes require proof of the owning module, migration behavior, and recovery/quarantine behavior when applicable.
- Unit tests alone do not prove restart recovery; runtime recovery claims need integration or live restart evidence.
- Docs-only edits remain L5 evidence and must not unblock CA-04 bootstrap/state ownership readiness. Evidence: `.planning/ROADMAP.md:29-49`.

</system-reminder>
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_cC7ixrPusnuVqwJu7C0u2429"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_KdX9fO6bgZX10Heg6sPr1274"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_9pbT5XG2TFebgYxQBsdp8171"
}
```


### Tool: task

**Input:**
```json
{
  "description": "Create hivemind-power-on skill",
  "subagent_type": "hf-l2-skill-builder",
  "task_id": "ses_1e9003236ffev3y1EYxe3AdHM7"
}
```

**Output:** (pruned)
```
task_id: ses_1e9003236ffev3y1EYxe3AdHM7
```

