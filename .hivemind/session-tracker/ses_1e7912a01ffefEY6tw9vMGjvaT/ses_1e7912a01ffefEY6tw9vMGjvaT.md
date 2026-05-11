---
sessionID: ses_1e7912a01ffefEY6tw9vMGjvaT
created: 2026-05-11T19:06:17.591Z
updated: 2026-05-11T19:06:17.591Z
parentSessionID: null
delegationDepth: 0
children: []
continuityIndex: session-continuity.json
status: active
---

## USER (turn 1)

You are **hm-l2-executor**, a subagent delegated by hm-l0-orchestrator for the Hivemind project (self-hosting).

## The Problem

The current `.opencode/tools/execute-command.ts` calls `client.session.command()` on the **same** session the agent is running in. This queues the command because the session is busy processing the tool. Result: stuck at "queued".

## The Solution

Never dispatch to the busy parent session. Instead:
1. **Create a child session** (linked via `parentID`)
2. **Dispatch the command/prompt to the CHILD session** (which is idle, so it runs immediately)
3. For async: use `promptAsync()` with `noReply: true` — returns 204 immediately
4. For sync: use `command()` on the child session — child is idle, so it runs

Support **two modes**:
- `dispatch` (sync): run command on child session, return result to parent
- `fire-and-forget` (async): send prompt to child session, return immediately

## Verified API Schemas (from anomalyco/opencode v1.14.44 source code)

These are the EXACT types from the source. Use them to build the tool:

```typescript
// Create child session
SessionCreateData: {
  body?: { parentID?: string, title?: string }
  url: "/session"  // POST
}
// Returns: Session { id, parentID, title, ... }

// List agents dynamically
AppAgentsData: { query?: { directory?: string } }
url: "/agent"  // GET
// Returns: Agent[]
Agent = { name, description, mode: "subagent"|"primary", builtIn: boolean, model?, tools, ... }

// Sync command dispatch to child session (child is idle, so this works)
SessionCommandData: {
  body: { command: string, arguments: string, agent?: string, model?: string, messageID?: string }
  path: { id: string }
  url: "/session/{id}/command"
}
// Returns: 200 { info: AssistantMessage, parts: Part[] }

// Async fire-and-forget dispatch
SessionPromptAsyncData: {
  body: {
    agent?: string,
    model?: { providerID, modelID },
    noReply?: boolean,
    system?: string,
    tools?: { [key: string]: boolean },
    parts: Array<TextPartInput | FilePartInput | AgentPartInput | SubtaskPartInput>
  }
  path: { id: string }
  url: "/session/{id}/prompt_async"
}
// Returns: 204 void (immediately!)

// Check on child sessions from the parent
SessionChildrenData: { path: { id: string } }
url: "/session/{id}/children"  // GET
// Returns: Array<Session>
```

## Commands to Run

```bash
# Check that .opencode/package.json has @opencode-ai/sdk
# No need to add — already present from previous spike
```

## Scope

- **Modify ONLY**: `.opencode/tools/execute-command.ts` (overwrite existing spike implementation)
- **Keep existing**: `.opencode/package.json` (deps already installed)
- **Do NOT modify**: Any other files

## Tool Design Specifications

The tool must support these arguments:

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `mode` | `"dispatch" \| "fire-and-forget"` | No, default `"dispatch"` | sync vs async dispatch |
| `command` | `string` | No* | Slash command name (e.g. "plan") |
| `arguments` | `string` | No, default `""` | Command arguments |
| `prompt` | `string` | No* | Text prompt (alternative to command for fire-and-forget) |
| `agent` | `string` | No | Target agent name. If omitted, list agents for selection |
| `title` | `string` | No | Title for the child session |

*At least one of `command` or `prompt` must be provided

### Mode: `dispatch` (default)
1. Create child session with `parentID: context.sessionID`
2. Call `client.session.command()` on the **child** session with the specified `agent`
3. Return `{ success, childSessionId, result }`

### Mode: `fire-and-forget`
1. If `command` provided, convert to text part: `"/{command} {arguments}"`
2. If `prompt` provided, use as text part directly
3. Create child session with `parentID: context.sessionID`
4. Call `client.session.promptAsync()` on the child session
5. Return `{ success, childSessionId, status: "dispatched" }` — returns immediately

### Agent selection (when `agent` is omitted)
When the agent is omitted, the tool should:
1. Call `client.app.agents()` to list all available agents
2. Return the agent list in the response so the user/agent can choose
3. Example response: `{ success: false, needsAgentSelection: true, agents: [{ name, description, mode }] }`

## Error Handling
- Wrap all API calls in try/catch
- Return structured JSON `{ success: boolean, error?: string, ... }` on failure
- Handle session creation failure, command dispatch failure, etc.

## Success Metrics
- Tool compiles without errors (`bun build --target=node` on `.opencode/tools/execute-command.ts`)
- TypeScript typechecks pass (`tsc --noEmit --skipLibCheck`)
- The tool creates child sessions via SDK (not direct fetch)
- Agent listing works dynamically at runtime
- Both `dispatch` and `fire-and-forget` modes are implemented

## Return Format
Return the complete final code of the tool, any issues encountered, and build verification results.


### Tool: skill

**Input:**
```json
{
  "name": "hf-l2-custom-tools-dev"
}
```

**Output:** (pruned)
```
# Skill: hf-l2-custom-tools-dev
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/tools/execute-command.ts"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/.opencode/tools/execute-command.ts</path>
<type>file</type>
<content>
1: import { tool } from "@opencode-ai/plugin"
2: import { createOpencodeClient } from "@opencode-ai/sdk"
3: 
4: /**
5:  * Custom tool for executing OpenCode slash commands on the current session.
6:  *
7:  * Uses the OpenCode SDK to send a command (e.g., /plan, /gsd, /hf-create) to the
8:  * agent's own session, enabling programmatic command dispatch from within tools.
9:  */
10: export default tool({
11:   description:
12:     "Execute an OpenCode slash command on the current session. " +
13:     "Use this to run commands like /plan, /gsd, /hf-create, /hf-audit, etc. programmatically. " +
14:     "Returns the full response including message info and content parts.",
15:   args: {
16:     command: tool.schema
17:       .string()
18:       .describe(
19:         "The command name to execute (e.g., 'plan', 'gsd', 'hf-create', 'hf-audit'). Do not include the leading slash.",
20:       ),
21:     arguments: tool.schema
22:       .string()
23:       .optional()
24:       .default("")
25:       .describe("Optional arguments to pass to the command (e.g., '--help' or 'build-feature-x')."),
26:   },
27:   async execute(
28:     args: { command: string; arguments?: string },
29:     context: { sessionID: string; messageID: string; agent: string; directory: string; worktree: string },
30:   ): Promise<string> {
31:     try {
32:       // Create a client connected to the local OpenCode server
33:       const client = createOpencodeClient()
34: 
35:       // Execute the command on the current session via the SDK
36:       const result = await client.session.command({
37:         path: { id: context.sessionID },
38:         body: {
39:           command: args.command,
40:           arguments: args.arguments ?? "",
41:         },
42:       })
43: 
44:       return JSON.stringify({
45:         success: true,
46:         command: args.command,
47:         arguments: args.arguments ?? "",
48:         result,
49:       })
50:     } catch (error) {
51:       return JSON.stringify({
52:         success: false,
53:         command: args.command,
54:         arguments: args.arguments ?? "",
55:         error: error instanceof Error ? error.message : String(error),
56:       })
57:     }
58:   },
59: })

(End of file - total 59 lines)
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
- Canonical runtime skill location is `.opencode/skills/`; meta-builder source may be reflected from `.hivefiver-meta-builder/`. Evidence: `.planning/codebase/ARCHITECTURE.md:209-215`.
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
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/package.json"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/tools"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/tools/nl-route.ts"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/.opencode/tools/nl-route.ts</path>
<type>file</type>
<content>
1: import { tool } from "@opencode-ai/plugin"
2: 
3: const ROUTES = [
4:   {
5:     keywords: ["echo", "say", "repeat", "back", "tell me"],
6:     command: "test-echo",
7:     description: "Echo back a message",
8:   },
9:   {
10:     keywords: ["list", "files", "directory", "ls", "show files", "what files"],
11:     command: "test-list",
12:     description: "List files in directory",
13:   },
14:   {
15:     keywords: ["git", "status", "changes", "diff", "what changed", "commit"],
16:     command: "test-status",
17:     description: "Show git status",
18:   },
19: ]
20: 
21: export default tool({
22:   description:
23:     "Route a natural language request to one of three test commands: test-echo, test-list, or test-status. Returns the matching command name and any extracted arguments. Always call this tool FIRST before deciding which command to run.",
24:   args: {
25:     query: tool.schema.string().describe("The user's natural language request"),
26:   },
27:   async execute(args) {
28:     const lower = args.query.toLowerCase()
29:     let best: { command: string; args: string; confidence: number; reason: string } | null = null
30:     let bestScore = 0
31: 
32:     for (const route of ROUTES) {
33:       let score = 0
34:       const matchedKeywords: string[] = []
35: 
36:       for (const kw of route.keywords) {
37:         if (lower.includes(kw.toLowerCase())) {
38:           score += kw.split(/\s+/).length
39:           matchedKeywords.push(kw)
40:         }
41:       }
42: 
43:       let extractedArgs = ""
44:       if (matchedKeywords.length > 0) {
45:         const firstMatch = matchedKeywords[0]
46:         const idx = lower.indexOf(firstMatch.toLowerCase())
47:         if (idx >= 0) {
48:           extractedArgs = args.query.slice(idx + firstMatch.length).trim()
49:           extractedArgs = extractedArgs.replace(/^[\s:,-]+/, "")
50:         }
51:       }
52: 
53:       if (score > bestScore) {
54:         bestScore = score
55:         best = {
56:           command: route.command,
57:           args: extractedArgs,
58:           confidence: Math.min(score / 3, 1),
59:           reason: `Matched keywords: ${matchedKeywords.join(", ")}`,
60:         }
61:       }
62:     }
63: 
64:     if (!best || best.confidence < 0.3) {
65:       return JSON.stringify({
66:         success: false,
67:         error: `No matching command found for: "${args.query}"`,
68:       })
69:     }
70: 
71:     const cmdStr = best.args ? `/${best.command} ${best.args}` : `/${best.command}`
72: 
73:     return JSON.stringify({
74:       success: true,
75:       command: best.command,
76:       args: best.args,
77:       fullCommand: cmdStr,
78:       confidence: best.confidence,
79:       reason: best.reason,
80:     })
81:   },
82: })

(End of file - total 82 lines)
</content>
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_ho4J6aOd7pDEdIv9IeKB8828"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/node_modules/@opencode-ai/sdk/dist/index.d.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/node_modules/@opencode-ai/sdk/dist/client.d.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/node_modules/@opencode-ai/sdk/dist/gen/sdk.gen.d.ts"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/node_modules/@opencode-ai/sdk/dist/gen/sdk.gen.d.ts</path>
<type>file</type>
<content>
1: import type { Options as ClientOptions, TDataShape, Client } from "./client/index.js";
2: import type { GlobalEventData, GlobalEventResponses, ProjectListData, ProjectListResponses, ProjectCurrentData, ProjectCurrentResponses, PtyListData, PtyListResponses, PtyCreateData, PtyCreateResponses, PtyCreateErrors, PtyRemoveData, PtyRemoveResponses, PtyRemoveErrors, PtyGetData, PtyGetResponses, PtyGetErrors, PtyUpdateData, PtyUpdateResponses, PtyUpdateErrors, PtyConnectData, PtyConnectResponses, PtyConnectErrors, ConfigGetData, ConfigGetResponses, ConfigUpdateData, ConfigUpdateResponses, ConfigUpdateErrors, ToolIdsData, ToolIdsResponses, ToolIdsErrors, ToolListData, ToolListResponses, ToolListErrors, InstanceDisposeData, InstanceDisposeResponses, PathGetData, PathGetResponses, VcsGetData, VcsGetResponses, SessionListData, SessionListResponses, SessionCreateData, SessionCreateResponses, SessionCreateErrors, SessionStatusData, SessionStatusResponses, SessionStatusErrors, SessionDeleteData, SessionDeleteResponses, SessionDeleteErrors, SessionGetData, SessionGetResponses, SessionGetErrors, SessionUpdateData, SessionUpdateResponses, SessionUpdateErrors, SessionChildrenData, SessionChildrenResponses, SessionChildrenErrors, SessionTodoData, SessionTodoResponses, SessionTodoErrors, SessionInitData, SessionInitResponses, SessionInitErrors, SessionForkData, SessionForkResponses, SessionAbortData, SessionAbortResponses, SessionAbortErrors, SessionUnshareData, SessionUnshareResponses, SessionUnshareErrors, SessionShareData, SessionShareResponses, SessionShareErrors, SessionDiffData, SessionDiffResponses, SessionDiffErrors, SessionSummarizeData, SessionSummarizeResponses, SessionSummarizeErrors, SessionMessagesData, SessionMessagesResponses, SessionMessagesErrors, SessionPromptData, SessionPromptResponses, SessionPromptErrors, SessionMessageData, SessionMessageResponses, SessionMessageErrors, SessionPromptAsyncData, SessionPromptAsyncResponses, SessionPromptAsyncErrors, SessionCommandData, SessionCommandResponses, SessionCommandErrors, SessionShellData, SessionShellResponse... (line truncated to 2000 chars)
3: export type Options<TData extends TDataShape = TDataShape, ThrowOnError extends boolean = boolean> = ClientOptions<TData, ThrowOnError> & {
4:     /**
5:      * You can provide a client instance returned by `createClient()` instead of
6:      * individual options. This might be also useful if you want to implement a
7:      * custom client.
8:      */
9:     client?: Client;
10:     /**
11:      * You can pass arbitrary values through the `meta` object. This can be
12:      * used to access values that aren't defined as part of the SDK function.
13:      */
14:     meta?: Record<string, unknown>;
15: };
16: declare class _HeyApiClient {
17:     protected _client: Client;
18:     constructor(args?: {
19:         client?: Client;
20:     });
21: }
22: declare class Global extends _HeyApiClient {
23:     /**
24:      * Get events
25:      */
26:     event<ThrowOnError extends boolean = false>(options?: Options<GlobalEventData, ThrowOnError>): Promise<import("./core/serverSentEvents.gen.js").ServerSentEventsResult<GlobalEventResponses, unknown>>;
27: }
28: declare class Project extends _HeyApiClient {
29:     /**
30:      * List all projects
31:      */
32:     list<ThrowOnError extends boolean = false>(options?: Options<ProjectListData, ThrowOnError>): import("./client/types.gen.js").RequestResult<ProjectListResponses, unknown, ThrowOnError, "fields">;
33:     /**
34:      * Get the current project
35:      */
36:     current<ThrowOnError extends boolean = false>(options?: Options<ProjectCurrentData, ThrowOnError>): import("./client/types.gen.js").RequestResult<ProjectCurrentResponses, unknown, ThrowOnError, "fields">;
37: }
38: declare class Pty extends _HeyApiClient {
39:     /**
40:      * List all PTY sessions
41:      */
42:     list<ThrowOnError extends boolean = false>(options?: Options<PtyListData, ThrowOnError>): import("./client/types.gen.js").RequestResult<PtyListResponses, unknown, ThrowOnError, "fields">;
43:     /**
44:      * Create a new PTY session
45:      */
46:     create<ThrowOnError extends boolean = false>(options?: Options<PtyCreateData, ThrowOnError>): import("./client/types.gen.js").RequestResult<PtyCreateResponses, PtyCreateErrors, ThrowOnError, "fields">;
47:     /**
48:      * Remove a PTY session
49:      */
50:     remove<ThrowOnError extends boolean = false>(options: Options<PtyRemoveData, ThrowOnError>): import("./client/types.gen.js").RequestResult<PtyRemoveResponses, PtyRemoveErrors, ThrowOnError, "fields">;
51:     /**
52:      * Get PTY session info
53:      */
54:     get<ThrowOnError extends boolean = false>(options: Options<PtyGetData, ThrowOnError>): import("./client/types.gen.js").RequestResult<PtyGetResponses, PtyGetErrors, ThrowOnError, "fields">;
55:     /**
56:      * Update PTY session
57:      */
58:     update<ThrowOnError extends boolean = false>(options: Options<PtyUpdateData, ThrowOnError>): import("./client/types.gen.js").RequestResult<PtyUpdateResponses, PtyUpdateErrors, ThrowOnError, "fields">;
59:     /**
60:      * Connect to a PTY session
61:      */
62:     connect<ThrowOnError extends boolean = false>(options: Options<PtyConnectData, ThrowOnError>): import("./client/types.gen.js").RequestResult<PtyConnectResponses, PtyConnectErrors, ThrowOnError, "fields">;
63: }
64: declare class Config extends _HeyApiClient {
65:     /**
66:      * Get config info
67:      */
68:     get<ThrowOnError extends boolean = false>(options?: Options<ConfigGetData, ThrowOnError>): import("./client/types.gen.js").RequestResult<ConfigGetResponses, unknown, ThrowOnError, "fields">;
69:     /**
70:      * Update config
71:      */
72:     update<ThrowOnError extends boolean = false>(options?: Options<ConfigUpdateData, ThrowOnError>): import("./client/types.gen.js").RequestResult<ConfigUpdateResponses, ConfigUpdateErrors, ThrowOnError, "fields">;
73:     /**
74:      * List all providers
75:      */
76:     providers<ThrowOnError extends boolean = false>(options?: Options<ConfigProvidersData, ThrowOnError>): import("./client/types.gen.js").RequestResult<ConfigProvidersResponses, unknown, ThrowOnError, "fields">;
77: }
78: declare class Tool extends _HeyApiClient {
79:     /**
80:      * List all tool IDs (including built-in and dynamically registered)
81:      */
82:     ids<ThrowOnError extends boolean = false>(options?: Options<ToolIdsData, ThrowOnError>): import("./client/types.gen.js").RequestResult<ToolIdsResponses, ToolIdsErrors, ThrowOnError, "fields">;
83:     /**
84:      * List tools with JSON schema parameters for a provider/model
85:      */
86:     list<ThrowOnError extends boolean = false>(options: Options<ToolListData, ThrowOnError>): import("./client/types.gen.js").RequestResult<ToolListResponses, ToolListErrors, ThrowOnError, "fields">;
87: }
88: declare class Instance extends _HeyApiClient {
89:     /**
90:      * Dispose the current instance
91:      */
92:     dispose<ThrowOnError extends boolean = false>(options?: Options<InstanceDisposeData, ThrowOnError>): import("./client/types.gen.js").RequestResult<InstanceDisposeResponses, unknown, ThrowOnError, "fields">;
93: }
94: declare class Path extends _HeyApiClient {
95:     /**
96:      * Get the current path
97:      */
98:     get<ThrowOnError extends boolean = false>(options?: Options<PathGetData, ThrowOnError>): import("./client/types.gen.js").RequestResult<PathGetResponses, unknown, ThrowOnError, "fields">;
99: }
100: declare class Vcs extends _HeyApiClient {
101:     /**
102:      * Get VCS info for the current instance
103:      */
104:     get<ThrowOnError extends boolean = false>(options?: Options<VcsGetData, ThrowOnError>): import("./client/types.gen.js").RequestResult<VcsGetResponses, unknown, ThrowOnError, "fields">;
105: }
106: declare class Session extends _HeyApiClient {
107:     /**
108:      * List all sessions
109:      */
110:     list<ThrowOnError extends boolean = false>(options?: Options<SessionListData, ThrowOnError>): import("./client/types.gen.js").RequestResult<SessionListResponses, unknown, ThrowOnError, "fields">;
111:     /**
112:      * Create a new session
113:      */
114:     create<ThrowOnError extends boolean = false>(options?: Options<SessionCreateData, ThrowOnError>): import("./client/types.gen.js").RequestResult<SessionCreateResponses, SessionCreateErrors, ThrowOnError, "fields">;
115:     /**
116:      * Get session status
117:      */
118:     status<ThrowOnError extends boolean = false>(options?: Options<SessionStatusData, ThrowOnError>): import("./client/types.gen.js").RequestResult<SessionStatusResponses, SessionStatusErrors, ThrowOnError, "fields">;
119:     /**
120:      * Delete a session and all its data
121:      */
122:     delete<ThrowOnError extends boolean = false>(options: Options<SessionDeleteData, ThrowOnError>): import("./client/types.gen.js").RequestResult<SessionDeleteResponses, SessionDeleteErrors, ThrowOnError, "fields">;
123:     /**
124:      * Get session
125:      */
126:     get<ThrowOnError extends boolean = false>(options: Options<SessionGetData, ThrowOnError>): import("./client/types.gen.js").RequestResult<SessionGetResponses, SessionGetErrors, ThrowOnError, "fields">;
127:     /**
128:      * Update session properties
129:      */
130:     update<ThrowOnError extends boolean = false>(options: Options<SessionUpdateData, ThrowOnError>): import("./client/types.gen.js").RequestResult<SessionUpdateResponses, SessionUpdateErrors, ThrowOnError, "fields">;
131:     /**
132:      * Get a session's children
133:      */
134:     children<ThrowOnError extends boolean = false>(options: Options<SessionChildrenData, ThrowOnError>): import("./client/types.gen.js").RequestResult<SessionChildrenResponses, SessionChildrenErrors, ThrowOnError, "fields">;
135:     /**
136:      * Get the todo list for a session
137:      */
138:     todo<ThrowOnError extends boolean = false>(options: Options<SessionTodoData, ThrowOnError>): import("./client/types.gen.js").RequestResult<SessionTodoResponses, SessionTodoErrors, ThrowOnError, "fields">;
139:     /**
140:      * Analyze the app and create an AGENTS.md file
141:      */
142:     init<ThrowOnError extends boolean = false>(options: Options<SessionInitData, ThrowOnError>): import("./client/types.gen.js").RequestResult<SessionInitResponses, SessionInitErrors, ThrowOnError, "fields">;
143:     /**
144:      * Fork an existing session at a specific message
145:      */
146:     fork<ThrowOnError extends boolean = false>(options: Options<SessionForkData, ThrowOnError>): import("./client/types.gen.js").RequestResult<SessionForkResponses, unknown, ThrowOnError, "fields">;
147:     /**
148:      * Abort a session
149:      */
150:     abort<ThrowOnError extends boolean = false>(options: Options<SessionAbortData, ThrowOnError>): import("./client/types.gen.js").RequestResult<SessionAbortResponses, SessionAbortErrors, ThrowOnError, "fields">;
151:     /**
152:      * Unshare the session
153:      */
154:     unshare<ThrowOnError extends boolean = false>(options: Options<SessionUnshareData, ThrowOnError>): import("./client/types.gen.js").RequestResult<SessionUnshareResponses, SessionUnshareErrors, ThrowOnError, "fields">;
155:     /**
156:      * Share a session
157:      */
158:     share<ThrowOnError extends boolean = false>(options: Options<SessionShareData, ThrowOnError>): import("./client/types.gen.js").RequestResult<SessionShareResponses, SessionShareErrors, ThrowOnError, "fields">;
159:     /**
160:      * Get the diff for this session
161:      */
162:     diff<ThrowOnError extends boolean = false>(options: Options<SessionDiffData, ThrowOnError>): import("./client/types.gen.js").RequestResult<SessionDiffResponses, SessionDiffErrors, ThrowOnError, "fields">;
163:     /**
164:      * Summarize the session
165:      */
166:     summarize<ThrowOnError extends boolean = false>(options: Options<SessionSummarizeData, ThrowOnError>): import("./client/types.gen.js").RequestResult<SessionSummarizeResponses, SessionSummarizeErrors, ThrowOnError, "fields">;
167:     /**
168:      * List messages for a session
169:      */
170:     messages<ThrowOnError extends boolean = false>(options: Options<SessionMessagesData, ThrowOnError>): import("./client/types.gen.js").RequestResult<SessionMessagesResponses, SessionMessagesErrors, ThrowOnError, "fields">;
171:     /**
172:      * Create and send a new message to a session
173:      */
174:     prompt<ThrowOnError extends boolean = false>(options: Options<SessionPromptData, ThrowOnError>): import("./client/types.gen.js").RequestResult<SessionPromptResponses, SessionPromptErrors, ThrowOnError, "fields">;
175:     /**
176:      * Get a message from a session
177:      */
178:     message<ThrowOnError extends boolean = false>(options: Options<SessionMessageData, ThrowOnError>): import("./client/types.gen.js").RequestResult<SessionMessageResponses, SessionMessageErrors, ThrowOnError, "fields">;
179:     /**
180:      * Create and send a new message to a session, start if needed and return immediately
181:      */
182:     promptAsync<ThrowOnError extends boolean = false>(options: Options<SessionPromptAsyncData, ThrowOnError>): import("./client/types.gen.js").RequestResult<SessionPromptAsyncResponses, SessionPromptAsyncErrors, ThrowOnError, "fields">;
183:     /**
184:      * Send a new command to a session
185:      */
186:     command<ThrowOnError extends boolean = false>(options: Options<SessionCommandData, ThrowOnError>): import("./client/types.gen.js").RequestResult<SessionCommandResponses, SessionCommandErrors, ThrowOnError, "fields">;
187:     /**
188:      * Run a shell command
189:      */
190:     shell<ThrowOnError extends boolean = false>(options: Options<SessionShellData, ThrowOnError>): import("./client/types.gen.js").RequestResult<SessionShellResponses, SessionShellErrors, ThrowOnError, "fields">;
191:     /**
192:      * Revert a message
193:      */
194:     revert<ThrowOnError extends boolean = false>(options: Options<SessionRevertData, ThrowOnError>): import("./client/types.gen.js").RequestResult<SessionRevertResponses, SessionRevertErrors, ThrowOnError, "fields">;
195:     /**
196:      * Restore all reverted messages
197:      */
198:     unrevert<ThrowOnError extends boolean = false>(options: Options<SessionUnrevertData, ThrowOnError>): import("./client/types.gen.js").RequestResult<SessionUnrevertResponses, SessionUnrevertErrors, ThrowOnError, "fields">;
199: }
200: declare class Command extends _HeyApiClient {
201:     /**
202:      * List all commands
203:      */
204:     list<ThrowOnError extends boolean = false>(options?: Options<CommandListData, ThrowOnError>): import("./client/types.gen.js").RequestResult<CommandListResponses, unknown, ThrowOnError, "fields">;
205: }
206: declare class Oauth extends _HeyApiClient {
207:     /**
208:      * Authorize a provider using OAuth
209:      */
210:     authorize<ThrowOnError extends boolean = false>(options: Options<ProviderOauthAuthorizeData, ThrowOnError>): import("./client/types.gen.js").RequestResult<ProviderOauthAuthorizeResponses, ProviderOauthAuthorizeErrors, ThrowOnError, "fields">;
211:     /**
212:      * Handle OAuth callback for a provider
213:      */
214:     callback<ThrowOnError extends boolean = false>(options: Options<ProviderOauthCallbackData, ThrowOnError>): import("./client/types.gen.js").RequestResult<ProviderOauthCallbackResponses, ProviderOauthCallbackErrors, ThrowOnError, "fields">;
215: }
216: declare class Provider extends _HeyApiClient {
217:     /**
218:      * List all providers
219:      */
220:     list<ThrowOnError extends boolean = false>(options?: Options<ProviderListData, ThrowOnError>): import("./client/types.gen.js").RequestResult<ProviderListResponses, unknown, ThrowOnError, "fields">;
221:     /**
222:      * Get provider authentication methods
223:      */
224:     auth<ThrowOnError extends boolean = false>(options?: Options<ProviderAuthData, ThrowOnError>): import("./client/types.gen.js").RequestResult<ProviderAuthResponses, unknown, ThrowOnError, "fields">;
225:     oauth: Oauth;
226: }
227: declare class Find extends _HeyApiClient {
228:     /**
229:      * Find text in files
230:      */
231:     text<ThrowOnError extends boolean = false>(options: Options<FindTextData, ThrowOnError>): import("./client/types.gen.js").RequestResult<FindTextResponses, unknown, ThrowOnError, "fields">;
232:     /**
233:      * Find files
234:      */
235:     files<ThrowOnError extends boolean = false>(options: Options<FindFilesData, ThrowOnError>): import("./client/types.gen.js").RequestResult<FindFilesResponses, unknown, ThrowOnError, "fields">;
236:     /**
237:      * Find workspace symbols
238:      */
239:     symbols<ThrowOnError extends boolean = false>(options: Options<FindSymbolsData, ThrowOnError>): import("./client/types.gen.js").RequestResult<FindSymbolsResponses, unknown, ThrowOnError, "fields">;
240: }
241: declare class File extends _HeyApiClient {
242:     /**
243:      * List files and directories
244:      */
245:     list<ThrowOnError extends boolean = false>(options: Options<FileListData, ThrowOnError>): import("./client/types.gen.js").RequestResult<FileListResponses, unknown, ThrowOnError, "fields">;
246:     /**
247:      * Read a file
248:      */
249:     read<ThrowOnError extends boolean = false>(options: Options<FileReadData, ThrowOnError>): import("./client/types.gen.js").RequestResult<FileReadResponses, unknown, ThrowOnError, "fields">;
250:     /**
251:      * Get file status
252:      */
253:     status<ThrowOnError extends boolean = false>(options?: Options<FileStatusData, ThrowOnError>): import("./client/types.gen.js").RequestResult<FileStatusResponses, unknown, ThrowOnError, "fields">;
254: }
255: declare class App extends _HeyApiClient {
256:     /**
257:      * Write a log entry to the server logs
258:      */
259:     log<ThrowOnError extends boolean = false>(options?: Options<AppLogData, ThrowOnError>): import("./client/types.gen.js").RequestResult<AppLogResponses, AppLogErrors, ThrowOnError, "fields">;
260:     /**
261:      * List all agents
262:      */
263:     agents<ThrowOnError extends boolean = false>(options?: Options<AppAgentsData, ThrowOnError>): import("./client/types.gen.js").RequestResult<AppAgentsResponses, unknown, ThrowOnError, "fields">;
264: }
265: declare class Auth extends _HeyApiClient {
266:     /**
267:      * Remove OAuth credentials for an MCP server
268:      */
269:     remove<ThrowOnError extends boolean = false>(options: Options<McpAuthRemoveData, ThrowOnError>): import("./client/types.gen.js").RequestResult<McpAuthRemoveResponses, McpAuthRemoveErrors, ThrowOnError, "fields">;
270:     /**
271:      * Start OAuth authentication flow for an MCP server
272:      */
273:     start<ThrowOnError extends boolean = false>(options: Options<McpAuthStartData, ThrowOnError>): import("./client/types.gen.js").RequestResult<McpAuthStartResponses, McpAuthStartErrors, ThrowOnError, "fields">;
274:     /**
275:      * Complete OAuth authentication with authorization code
276:      */
277:     callback<ThrowOnError extends boolean = false>(options: Options<McpAuthCallbackData, ThrowOnError>): import("./client/types.gen.js").RequestResult<McpAuthCallbackResponses, McpAuthCallbackErrors, ThrowOnError, "fields">;
278:     /**
279:      * Start OAuth flow and wait for callback (opens browser)
280:      */
281:     authenticate<ThrowOnError extends boolean = false>(options: Options<McpAuthAuthenticateData, ThrowOnError>): import("./client/types.gen.js").RequestResult<McpAuthAuthenticateResponses, McpAuthAuthenticateErrors, ThrowOnError, "fields">;
282:     /**
283:      * Set authentication credentials
284:      */
285:     set<ThrowOnError extends boolean = false>(options: Options<AuthSetData, ThrowOnError>): import("./client/types.gen.js").RequestResult<AuthSetResponses, AuthSetErrors, ThrowOnError, "fields">;
286: }
287: declare class Mcp extends _HeyApiClient {
288:     /**
289:      * Get MCP server status
290:      */
291:     status<ThrowOnError extends boolean = false>(options?: Options<McpStatusData, ThrowOnError>): import("./client/types.gen.js").RequestResult<McpStatusResponses, unknown, ThrowOnError, "fields">;
292:     /**
293:      * Add MCP server dynamically
294:      */
295:     add<ThrowOnError extends boolean = false>(options?: Options<McpAddData, ThrowOnError>): import("./client/types.gen.js").RequestResult<McpAddResponses, McpAddErrors, ThrowOnError, "fields">;
296:     /**
297:      * Connect an MCP server
298:      */
299:     connect<ThrowOnError extends boolean = false>(options: Options<McpConnectData, ThrowOnError>): import("./client/types.gen.js").RequestResult<McpConnectResponses, unknown, ThrowOnError, "fields">;
300:     /**
301:      * Disconnect an MCP server
302:      */
303:     disconnect<ThrowOnError extends boolean = false>(options: Options<McpDisconnectData, ThrowOnError>): import("./client/types.gen.js").RequestResult<McpDisconnectResponses, unknown, ThrowOnError, "fields">;
304:     auth: Auth;
305: }
306: declare class Lsp extends _HeyApiClient {
307:     /**
308:      * Get LSP server status
309:      */
310:     status<ThrowOnError extends boolean = false>(options?: Options<LspStatusData, ThrowOnError>): import("./client/types.gen.js").RequestResult<LspStatusResponses, unknown, ThrowOnError, "fields">;
311: }
312: declare class Formatter extends _HeyApiClient {
313:     /**
314:      * Get formatter status
315:      */
316:     status<ThrowOnError extends boolean = false>(options?: Options<FormatterStatusData, ThrowOnError>): import("./client/types.gen.js").RequestResult<FormatterStatusResponses, unknown, ThrowOnError, "fields">;
317: }
318: declare class Control extends _HeyApiClient {
319:     /**
320:      * Get the next TUI request from the queue
321:      */
322:     next<ThrowOnError extends boolean = false>(options?: Options<TuiControlNextData, ThrowOnError>): import("./client/types.gen.js").RequestResult<TuiControlNextResponses, unknown, ThrowOnError, "fields">;
323:     /**
324:      * Submit a response to the TUI request queue
325:      */
326:     response<ThrowOnError extends boolean = false>(options?: Options<TuiControlResponseData, ThrowOnError>): import("./client/types.gen.js").RequestResult<TuiControlResponseResponses, unknown, ThrowOnError, "fields">;
327: }
328: declare class Tui extends _HeyApiClient {
329:     /**
330:      * Append prompt to the TUI
331:      */
332:     appendPrompt<ThrowOnError extends boolean = false>(options?: Options<TuiAppendPromptData, ThrowOnError>): import("./client/types.gen.js").RequestResult<TuiAppendPromptResponses, TuiAppendPromptErrors, ThrowOnError, "fields">;
333:     /**
334:      * Open the help dialog
335:      */
336:     openHelp<ThrowOnError extends boolean = false>(options?: Options<TuiOpenHelpData, ThrowOnError>): import("./client/types.gen.js").RequestResult<TuiOpenHelpResponses, unknown, ThrowOnError, "fields">;
337:     /**
338:      * Open the session dialog
339:      */
340:     openSessions<ThrowOnError extends boolean = false>(options?: Options<TuiOpenSessionsData, ThrowOnError>): import("./client/types.gen.js").RequestResult<TuiOpenSessionsResponses, unknown, ThrowOnError, "fields">;
341:     /**
342:      * Open the theme dialog
343:      */
344:     openThemes<ThrowOnError extends boolean = false>(options?: Options<TuiOpenThemesData, ThrowOnError>): import("./client/types.gen.js").RequestResult<TuiOpenThemesResponses, unknown, ThrowOnError, "fields">;
345:     /**
346:      * Open the model dialog
347:      */
348:     openModels<ThrowOnError extends boolean = false>(options?: Options<TuiOpenModelsData, ThrowOnError>): import("./client/types.gen.js").RequestResult<TuiOpenModelsResponses, unknown, ThrowOnError, "fields">;
349:     /**
350:      * Submit the prompt
351:      */
352:     submitPrompt<ThrowOnError extends boolean = false>(options?: Options<TuiSubmitPromptData, ThrowOnError>): import("./client/types.gen.js").RequestResult<TuiSubmitPromptResponses, unknown, ThrowOnError, "fields">;
353:     /**
354:      * Clear the prompt
355:      */
356:     clearPrompt<ThrowOnError extends boolean = false>(options?: Options<TuiClearPromptData, ThrowOnError>): import("./client/types.gen.js").RequestResult<TuiClearPromptResponses, unknown, ThrowOnError, "fields">;
357:     /**
358:      * Execute a TUI command (e.g. agent_cycle)
359:      */
360:     executeCommand<ThrowOnError extends boolean = false>(options?: Options<TuiExecuteCommandData, ThrowOnError>): import("./client/types.gen.js").RequestResult<TuiExecuteCommandResponses, TuiExecuteCommandErrors, ThrowOnError, "fields">;
361:     /**
362:      * Show a toast notification in the TUI
363:      */
364:     showToast<ThrowOnError extends boolean = false>(options?: Options<TuiShowToastData, ThrowOnError>): import("./client/types.gen.js").RequestResult<TuiShowToastResponses, unknown, ThrowOnError, "fields">;
365:     /**
366:      * Publish a TUI event
367:      */
368:     publish<ThrowOnError extends boolean = false>(options?: Options<TuiPublishData, ThrowOnError>): import("./client/types.gen.js").RequestResult<TuiPublishResponses, TuiPublishErrors, ThrowOnError, "fields">;
369:     control: Control;
370: }
371: declare class Event extends _HeyApiClient {
372:     /**
373:      * Get events
374:      */
375:     subscribe<ThrowOnError extends boolean = false>(options?: Options<EventSubscribeData, ThrowOnError>): Promise<import("./core/serverSentEvents.gen.js").ServerSentEventsResult<EventSubscribeResponses, unknown>>;
376: }
377: export declare class OpencodeClient extends _HeyApiClient {
378:     /**
379:      * Respond to a permission request
380:      */
381:     postSessionIdPermissionsPermissionId<ThrowOnError extends boolean = false>(options: Options<PostSessionIdPermissionsPermissionIdData, ThrowOnError>): import("./client/types.gen.js").RequestResult<PostSessionIdPermissionsPermissionIdResponses, PostSessionIdPermissionsPermissionIdErrors, ThrowOnError, "fields">;
382:     global: Global;
383:     project: Project;
384:     pty: Pty;
385:     config: Config;
386:     tool: Tool;
387:     instance: Instance;
388:     path: Path;
389:     vcs: Vcs;
390:     session: Session;
391:     command: Command;
392:     provider: Provider;
393:     find: Find;
394:     file: File;
395:     app: App;
396:     mcp: Mcp;
397:     lsp: Lsp;
398:     formatter: Formatter;
399:     tui: Tui;
400:     auth: Auth;
401:     event: Event;
402: }
403: export {};

(End of file - total 403 lines)
</content>
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/node_modules/@opencode-ai/sdk/dist/gen/types.gen.d.ts"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/node_modules/@opencode-ai/sdk/dist/gen/types.gen.d.ts</path>
<type>file</type>
<content>
1: export type EventServerInstanceDisposed = {
2:     type: "server.instance.disposed";
3:     properties: {
4:         directory: string;
5:     };
6: };
7: export type EventInstallationUpdated = {
8:     type: "installation.updated";
9:     properties: {
10:         version: string;
11:     };
12: };
13: export type EventInstallationUpdateAvailable = {
14:     type: "installation.update-available";
15:     properties: {
16:         version: string;
17:     };
18: };
19: export type EventLspClientDiagnostics = {
20:     type: "lsp.client.diagnostics";
21:     properties: {
22:         serverID: string;
23:         path: string;
24:     };
25: };
26: export type EventLspUpdated = {
27:     type: "lsp.updated";
28:     properties: {
29:         [key: string]: unknown;
30:     };
31: };
32: export type FileDiff = {
33:     file: string;
34:     before: string;
35:     after: string;
36:     additions: number;
37:     deletions: number;
38: };
39: export type UserMessage = {
40:     id: string;
41:     sessionID: string;
42:     role: "user";
43:     time: {
44:         created: number;
45:     };
46:     summary?: {
47:         title?: string;
48:         body?: string;
49:         diffs: Array<FileDiff>;
50:     };
51:     agent: string;
52:     model: {
53:         providerID: string;
54:         modelID: string;
55:     };
56:     system?: string;
57:     tools?: {
58:         [key: string]: boolean;
59:     };
60: };
61: export type ProviderAuthError = {
62:     name: "ProviderAuthError";
63:     data: {
64:         providerID: string;
65:         message: string;
66:     };
67: };
68: export type UnknownError = {
69:     name: "UnknownError";
70:     data: {
71:         message: string;
72:     };
73: };
74: export type MessageOutputLengthError = {
75:     name: "MessageOutputLengthError";
76:     data: {
77:         [key: string]: unknown;
78:     };
79: };
80: export type MessageAbortedError = {
81:     name: "MessageAbortedError";
82:     data: {
83:         message: string;
84:     };
85: };
86: export type ApiError = {
87:     name: "APIError";
88:     data: {
89:         message: string;
90:         statusCode?: number;
91:         isRetryable: boolean;
92:         responseHeaders?: {
93:             [key: string]: string;
94:         };
95:         responseBody?: string;
96:     };
97: };
98: export type AssistantMessage = {
99:     id: string;
100:     sessionID: string;
101:     role: "assistant";
102:     time: {
103:         created: number;
104:         completed?: number;
105:     };
106:     error?: ProviderAuthError | UnknownError | MessageOutputLengthError | MessageAbortedError | ApiError;
107:     parentID: string;
108:     modelID: string;
109:     providerID: string;
110:     mode: string;
111:     path: {
112:         cwd: string;
113:         root: string;
114:     };
115:     summary?: boolean;
116:     cost: number;
117:     tokens: {
118:         input: number;
119:         output: number;
120:         reasoning: number;
121:         cache: {
122:             read: number;
123:             write: number;
124:         };
125:     };
126:     finish?: string;
127: };
128: export type Message = UserMessage | AssistantMessage;
129: export type EventMessageUpdated = {
130:     type: "message.updated";
131:     properties: {
132:         info: Message;
133:     };
134: };
135: export type EventMessageRemoved = {
136:     type: "message.removed";
137:     properties: {
138:         sessionID: string;
139:         messageID: string;
140:     };
141: };
142: export type TextPart = {
143:     id: string;
144:     sessionID: string;
145:     messageID: string;
146:     type: "text";
147:     text: string;
148:     synthetic?: boolean;
149:     ignored?: boolean;
150:     time?: {
151:         start: number;
152:         end?: number;
153:     };
154:     metadata?: {
155:         [key: string]: unknown;
156:     };
157: };
158: export type ReasoningPart = {
159:     id: string;
160:     sessionID: string;
161:     messageID: string;
162:     type: "reasoning";
163:     text: string;
164:     metadata?: {
165:         [key: string]: unknown;
166:     };
167:     time: {
168:         start: number;
169:         end?: number;
170:     };
171: };
172: export type FilePartSourceText = {
173:     value: string;
174:     start: number;
175:     end: number;
176: };
177: export type FileSource = {
178:     text: FilePartSourceText;
179:     type: "file";
180:     path: string;
181: };
182: export type Range = {
183:     start: {
184:         line: number;
185:         character: number;
186:     };
187:     end: {
188:         line: number;
189:         character: number;
190:     };
191: };
192: export type SymbolSource = {
193:     text: FilePartSourceText;
194:     type: "symbol";
195:     path: string;
196:     range: Range;
197:     name: string;
198:     kind: number;
199: };
200: export type FilePartSource = FileSource | SymbolSource;
201: export type FilePart = {
202:     id: string;
203:     sessionID: string;
204:     messageID: string;
205:     type: "file";
206:     mime: string;
207:     filename?: string;
208:     url: string;
209:     source?: FilePartSource;
210: };
211: export type ToolStatePending = {
212:     status: "pending";
213:     input: {
214:         [key: string]: unknown;
215:     };
216:     raw: string;
217: };
218: export type ToolStateRunning = {
219:     status: "running";
220:     input: {
221:         [key: string]: unknown;
222:     };
223:     title?: string;
224:     metadata?: {
225:         [key: string]: unknown;
226:     };
227:     time: {
228:         start: number;
229:     };
230: };
231: export type ToolStateCompleted = {
232:     status: "completed";
233:     input: {
234:         [key: string]: unknown;
235:     };
236:     output: string;
237:     title: string;
238:     metadata: {
239:         [key: string]: unknown;
240:     };
241:     time: {
242:         start: number;
243:         end: number;
244:         compacted?: number;
245:     };
246:     attachments?: Array<FilePart>;
247: };
248: export type ToolStateError = {
249:     status: "error";
250:     input: {
251:         [key: string]: unknown;
252:     };
253:     error: string;
254:     metadata?: {
255:         [key: string]: unknown;
256:     };
257:     time: {
258:         start: number;
259:         end: number;
260:     };
261: };
262: export type ToolState = ToolStatePending | ToolStateRunning | ToolStateCompleted | ToolStateError;
263: export type ToolPart = {
264:     id: string;
265:     sessionID: string;
266:     messageID: string;
267:     type: "tool";
268:     callID: string;
269:     tool: string;
270:     state: ToolState;
271:     metadata?: {
272:         [key: string]: unknown;
273:     };
274: };
275: export type StepStartPart = {
276:     id: string;
277:     sessionID: string;
278:     messageID: string;
279:     type: "step-start";
280:     snapshot?: string;
281: };
282: export type StepFinishPart = {
283:     id: string;
284:     sessionID: string;
285:     messageID: string;
286:     type: "step-finish";
287:     reason: string;
288:     snapshot?: string;
289:     cost: number;
290:     tokens: {
291:         input: number;
292:         output: number;
293:         reasoning: number;
294:         cache: {
295:             read: number;
296:             write: number;
297:         };
298:     };
299: };
300: export type SnapshotPart = {
301:     id: string;
302:     sessionID: string;
303:     messageID: string;
304:     type: "snapshot";
305:     snapshot: string;
306: };
307: export type PatchPart = {
308:     id: string;
309:     sessionID: string;
310:     messageID: string;
311:     type: "patch";
312:     hash: string;
313:     files: Array<string>;
314: };
315: export type AgentPart = {
316:     id: string;
317:     sessionID: string;
318:     messageID: string;
319:     type: "agent";
320:     name: string;
321:     source?: {
322:         value: string;
323:         start: number;
324:         end: number;
325:     };
326: };
327: export type RetryPart = {
328:     id: string;
329:     sessionID: string;
330:     messageID: string;
331:     type: "retry";
332:     attempt: number;
333:     error: ApiError;
334:     time: {
335:         created: number;
336:     };
337: };
338: export type CompactionPart = {
339:     id: string;
340:     sessionID: string;
341:     messageID: string;
342:     type: "compaction";
343:     auto: boolean;
344: };
345: export type Part = TextPart | {
346:     id: string;
347:     sessionID: string;
348:     messageID: string;
349:     type: "subtask";
350:     prompt: string;
351:     description: string;
352:     agent: string;
353: } | ReasoningPart | FilePart | ToolPart | StepStartPart | StepFinishPart | SnapshotPart | PatchPart | AgentPart | RetryPart | CompactionPart;
354: export type EventMessagePartUpdated = {
355:     type: "message.part.updated";
356:     properties: {
357:         part: Part;
358:         delta?: string;
359:     };
360: };
361: export type EventMessagePartRemoved = {
362:     type: "message.part.removed";
363:     properties: {
364:         sessionID: string;
365:         messageID: string;
366:         partID: string;
367:     };
368: };
369: export type Permission = {
370:     id: string;
371:     type: string;
372:     pattern?: string | Array<string>;
373:     sessionID: string;
374:     messageID: string;
375:     callID?: string;
376:     title: string;
377:     metadata: {
378:         [key: string]: unknown;
379:     };
380:     time: {
381:         created: number;
382:     };
383: };
384: export type EventPermissionUpdated = {
385:     type: "permission.updated";
386:     properties: Permission;
387: };
388: export type EventPermissionReplied = {
389:     type: "permission.replied";
390:     properties: {
391:         sessionID: string;
392:         permissionID: string;
393:         response: string;
394:     };
395: };
396: export type SessionStatus = {
397:     type: "idle";
398: } | {
399:     type: "retry";
400:     attempt: number;
401:     message: string;
402:     next: number;
403: } | {
404:     type: "busy";
405: };
406: export type EventSessionStatus = {
407:     type: "session.status";
408:     properties: {
409:         sessionID: string;
410:         status: SessionStatus;
411:     };
412: };
413: export type EventSessionIdle = {
414:     type: "session.idle";
415:     properties: {
416:         sessionID: string;
417:     };
418: };
419: export type EventSessionCompacted = {
420:     type: "session.compacted";
421:     properties: {
422:         sessionID: string;
423:     };
424: };
425: export type EventFileEdited = {
426:     type: "file.edited";
427:     properties: {
428:         file: string;
429:     };
430: };
431: export type Todo = {
432:     /**
433:      * Brief description of the task
434:      */
435:     content: string;
436:     /**
437:      * Current status of the task: pending, in_progress, completed, cancelled
438:      */
439:     status: string;
440:     /**
441:      * Priority level of the task: high, medium, low
442:      */
443:     priority: string;
444:     /**
445:      * Unique identifier for the todo item
446:      */
447:     id: string;
448: };
449: export type EventTodoUpdated = {
450:     type: "todo.updated";
451:     properties: {
452:         sessionID: string;
453:         todos: Array<Todo>;
454:     };
455: };
456: export type EventCommandExecuted = {
457:     type: "command.executed";
458:     properties: {
459:         name: string;
460:         sessionID: string;
461:         arguments: string;
462:         messageID: string;
463:     };
464: };
465: export type Session = {
466:     id: string;
467:     projectID: string;
468:     directory: string;
469:     parentID?: string;
470:     summary?: {
471:         additions: number;
472:         deletions: number;
473:         files: number;
474:         diffs?: Array<FileDiff>;
475:     };
476:     share?: {
477:         url: string;
478:     };
479:     title: string;
480:     version: string;
481:     time: {
482:         created: number;
483:         updated: number;
484:         compacting?: number;
485:     };
486:     revert?: {
487:         messageID: string;
488:         partID?: string;
489:         snapshot?: string;
490:         diff?: string;
491:     };
492: };
493: export type EventSessionCreated = {
494:     type: "session.created";
495:     properties: {
496:         info: Session;
497:     };
498: };
499: export type EventSessionUpdated = {
500:     type: "session.updated";
501:     properties: {
502:         info: Session;
503:     };
504: };
505: export type EventSessionDeleted = {
506:     type: "session.deleted";
507:     properties: {
508:         info: Session;
509:     };
510: };
511: export type EventSessionDiff = {
512:     type: "session.diff";
513:     properties: {
514:         sessionID: string;
515:         diff: Array<FileDiff>;
516:     };
517: };
518: export type EventSessionError = {
519:     type: "session.error";
520:     properties: {
521:         sessionID?: string;
522:         error?: ProviderAuthError | UnknownError | MessageOutputLengthError | MessageAbortedError | ApiError;
523:     };
524: };
525: export type EventFileWatcherUpdated = {
526:     type: "file.watcher.updated";
527:     properties: {
528:         file: string;
529:         event: "add" | "change" | "unlink";
530:     };
531: };
532: export type EventVcsBranchUpdated = {
533:     type: "vcs.branch.updated";
534:     properties: {
535:         branch?: string;
536:     };
537: };
538: export type EventTuiPromptAppend = {
539:     type: "tui.prompt.append";
540:     properties: {
541:         text: string;
542:     };
543: };
544: export type EventTuiCommandExecute = {
545:     type: "tui.command.execute";
546:     properties: {
547:         command: ("session.list" | "session.new" | "session.share" | "session.interrupt" | "session.compact" | "session.page.up" | "session.page.down" | "session.half.page.up" | "session.half.page.down" | "session.first" | "session.last" | "prompt.clear" | "prompt.submit" | "agent.cycle") | string;
548:     };
549: };
550: export type EventTuiToastShow = {
551:     type: "tui.toast.show";
552:     properties: {
553:         title?: string;
554:         message: string;
555:         variant: "info" | "success" | "warning" | "error";
556:         /**
557:          * Duration in milliseconds
558:          */
559:         duration?: number;
560:     };
561: };
562: export type Pty = {
563:     id: string;
564:     title: string;
565:     command: string;
566:     args: Array<string>;
567:     cwd: string;
568:     status: "running" | "exited";
569:     pid: number;
570: };
571: export type EventPtyCreated = {
572:     type: "pty.created";
573:     properties: {
574:         info: Pty;
575:     };
576: };
577: export type EventPtyUpdated = {
578:     type: "pty.updated";
579:     properties: {
580:         info: Pty;
581:     };
582: };
583: export type EventPtyExited = {
584:     type: "pty.exited";
585:     properties: {
586:         id: string;
587:         exitCode: number;
588:     };
589: };
590: export type EventPtyDeleted = {
591:     type: "pty.deleted";
592:     properties: {
593:         id: string;
594:     };
595: };
596: export type EventServerConnected = {
597:     type: "server.connected";
598:     properties: {
599:         [key: string]: unknown;
600:     };
601: };
602: export type Event = EventServerInstanceDisposed | EventInstallationUpdated | EventInstallationUpdateAvailable | EventLspClientDiagnostics | EventLspUpdated | EventMessageUpdated | EventMessageRemoved | EventMessagePartUpdated | EventMessagePartRemoved | EventPermissionUpdated | EventPermissionReplied | EventSessionStatus | EventSessionIdle | EventSessionCompacted | EventFileEdited | EventTodoUpdated | EventCommandExecuted | EventSessionCreated | EventSessionUpdated | EventSessionDeleted | EventSessionDiff | EventSessionError | EventFileWatcherUpdated | EventVcsBranchUpdated | EventTuiPromptAppend | EventTuiCommandExecute | EventTuiToastShow | EventPtyCreated | EventPtyUpdated | EventPtyExited | EventPtyDeleted | EventServerConnected;
603: export type GlobalEvent = {
604:     directory: string;
605:     payload: Event;
606: };
607: export type Project = {
608:     id: string;
609:     worktree: string;
610:     vcsDir?: string;
611:     vcs?: "git";
612:     time: {
613:         created: number;
614:         initialized?: number;
615:     };
616: };
617: export type BadRequestError = {
618:     name: "BadRequest";
619:     data: {
620:         message: string;
621:         kind?: "Params" | "Headers" | "Query" | "Body" | "Payload";
622:     };
623: };
624: export type NotFoundError = {
625:     name: "NotFoundError";
626:     data: {
627:         message: string;
628:     };
629: };
630: /**
631:  * Custom keybind configurations
632:  */
633: export type KeybindsConfig = {
634:     /**
635:      * Leader key for keybind combinations
636:      */
637:     leader?: string;
638:     /**
639:      * Exit the application
640:      */
641:     app_exit?: string;
642:     /**
643:      * Open external editor
644:      */
645:     editor_open?: string;
646:     /**
647:      * List available themes
648:      */
649:     theme_list?: string;
650:     /**
651:      * Toggle sidebar
652:      */
653:     sidebar_toggle?: string;
654:     /**
655:      * Toggle session scrollbar
656:      */
657:     scrollbar_toggle?: string;
658:     /**
659:      * Toggle username visibility
660:      */
661:     username_toggle?: string;
662:     /**
663:      * View status
664:      */
665:     status_view?: string;
666:     /**
667:      * Export session to editor
668:      */
669:     session_export?: string;
670:     /**
671:      * Create a new session
672:      */
673:     session_new?: string;
674:     /**
675:      * List all sessions
676:      */
677:     session_list?: string;
678:     /**
679:      * Show session timeline
680:      */
681:     session_timeline?: string;
682:     /**
683:      * Share current session
684:      */
685:     session_share?: string;
686:     /**
687:      * Unshare current session
688:      */
689:     session_unshare?: string;
690:     /**
691:      * Interrupt current session
692:      */
693:     session_interrupt?: string;
694:     /**
695:      * Compact the session
696:      */
697:     session_compact?: string;
698:     /**
699:      * Scroll messages up by one page
700:      */
701:     messages_page_up?: string;
702:     /**
703:      * Scroll messages down by one page
704:      */
705:     messages_page_down?: string;
706:     /**
707:      * Scroll messages up by one line
708:      */
709:     messages_line_up?: string;
710:     /**
711:      * Scroll messages down by one line
712:      */
713:     messages_line_down?: string;
714:     /**
715:      * Scroll messages up by half page
716:      */
717:     messages_half_page_up?: string;
718:     /**
719:      * Scroll messages down by half page
720:      */
721:     messages_half_page_down?: string;
722:     /**
723:      * Navigate to first message
724:      */
725:     messages_first?: string;
726:     /**
727:      * Navigate to last message
728:      */
729:     messages_last?: string;
730:     /**
731:      * Navigate to next message
732:      */
733:     messages_next?: string;
734:     /**
735:      * Navigate to previous message
736:      */
737:     messages_previous?: string;
738:     /**
739:      * Navigate to last user message
740:      */
741:     messages_last_user?: string;
742:     /**
743:      * Copy message
744:      */
745:     messages_copy?: string;
746:     /**
747:      * Undo message
748:      */
749:     messages_undo?: string;
750:     /**
751:      * Redo message
752:      */
753:     messages_redo?: string;
754:     /**
755:      * Toggle code block concealment in messages
756:      */
757:     messages_toggle_conceal?: string;
758:     /**
759:      * Toggle tool details visibility
760:      */
761:     tool_details?: string;
762:     /**
763:      * List available models
764:      */
765:     model_list?: string;
766:     /**
767:      * Next recently used model
768:      */
769:     model_cycle_recent?: string;
770:     /**
771:      * Previous recently used model
772:      */
773:     model_cycle_recent_reverse?: string;
774:     /**
775:      * List available commands
776:      */
777:     command_list?: string;
778:     /**
779:      * List agents
780:      */
781:     agent_list?: string;
782:     /**
783:      * Next agent
784:      */
785:     agent_cycle?: string;
786:     /**
787:      * Previous agent
788:      */
789:     agent_cycle_reverse?: string;
790:     /**
791:      * Clear input field
792:      */
793:     input_clear?: string;
794:     /**
795:      * Forward delete
796:      */
797:     input_forward_delete?: string;
798:     /**
799:      * Paste from clipboard
800:      */
801:     input_paste?: string;
802:     /**
803:      * Submit input
804:      */
805:     input_submit?: string;
806:     /**
807:      * Insert newline in input
808:      */
809:     input_newline?: string;
810:     /**
811:      * Previous history item
812:      */
813:     history_previous?: string;
814:     /**
815:      * Next history item
816:      */
817:     history_next?: string;
818:     /**
819:      * Next child session
820:      */
821:     session_child_cycle?: string;
822:     /**
823:      * Previous child session
824:      */
825:     session_child_cycle_reverse?: string;
826:     /**
827:      * Suspend terminal
828:      */
829:     terminal_suspend?: string;
830:     /**
831:      * Toggle terminal title
832:      */
833:     terminal_title_toggle?: string;
834: };
835: export type AgentConfig = {
836:     model?: string;
837:     temperature?: number;
838:     top_p?: number;
839:     prompt?: string;
840:     tools?: {
841:         [key: string]: boolean;
842:     };
843:     disable?: boolean;
844:     /**
845:      * Description of when to use the agent
846:      */
847:     description?: string;
848:     mode?: "subagent" | "primary" | "all";
849:     /**
850:      * Hex color code for the agent (e.g., #FF5733)
851:      */
852:     color?: string;
853:     /**
854:      * Maximum number of agentic iterations before forcing text-only response
855:      */
856:     maxSteps?: number;
857:     permission?: {
858:         edit?: "ask" | "allow" | "deny";
859:         bash?: ("ask" | "allow" | "deny") | {
860:             [key: string]: "ask" | "allow" | "deny";
861:         };
862:         webfetch?: "ask" | "allow" | "deny";
863:         doom_loop?: "ask" | "allow" | "deny";
864:         external_directory?: "ask" | "allow" | "deny";
865:     };
866:     [key: string]: unknown | string | number | {
867:         [key: string]: boolean;
868:     } | boolean | ("subagent" | "primary" | "all") | number | {
869:         edit?: "ask" | "allow" | "deny";
870:         bash?: ("ask" | "allow" | "deny") | {
871:             [key: string]: "ask" | "allow" | "deny";
872:         };
873:         webfetch?: "ask" | "allow" | "deny";
874:         doom_loop?: "ask" | "allow" | "deny";
875:         external_directory?: "ask" | "allow" | "deny";
876:     } | undefined;
877: };
878: export type ProviderConfig = {
879:     api?: string;
880:     name?: string;
881:     env?: Array<string>;
882:     id?: string;
883:     npm?: string;
884:     models?: {
885:         [key: string]: {
886:             id?: string;
887:             name?: string;
888:             release_date?: string;
889:             attachment?: boolean;
890:             reasoning?: boolean;
891:             temperature?: boolean;
892:             tool_call?: boolean;
893:             cost?: {
894:                 input: number;
895:                 output: number;
896:                 cache_read?: number;
897:                 cache_write?: number;
898:                 context_over_200k?: {
899:                     input: number;
900:                     output: number;
901:                     cache_read?: number;
902:                     cache_write?: number;
903:                 };
904:             };
905:             limit?: {
906:                 context: number;
907:                 output: number;
908:             };
909:             modalities?: {
910:                 input: Array<"text" | "audio" | "image" | "video" | "pdf">;
911:                 output: Array<"text" | "audio" | "image" | "video" | "pdf">;
912:             };
913:             experimental?: boolean;
914:             status?: "alpha" | "beta" | "deprecated" | "active";
915:             options?: {
916:                 [key: string]: unknown;
917:             };
918:             headers?: {
919:                 [key: string]: string;
920:             };
921:             provider?: {
922:                 npm: string;
923:             };
924:         };
925:     };
926:     whitelist?: Array<string>;
927:     blacklist?: Array<string>;
928:     options?: {
929:         apiKey?: string;
930:         baseURL?: string;
931:         /**
932:          * GitHub Enterprise URL for copilot authentication
933:          */
934:         enterpriseUrl?: string;
935:         /**
936:          * Enable promptCacheKey for this provider (default false)
937:          */
938:         setCacheKey?: boolean;
939:         /**
940:          * Timeout in milliseconds for requests to this provider. Default is 300000 (5 minutes). Set to false to disable timeout.
941:          */
942:         timeout?: number | false;
943:         [key: string]: unknown | string | boolean | (number | false) | undefined;
944:     };
945: };
946: export type McpLocalConfig = {
947:     /**
948:      * Type of MCP server connection
949:      */
950:     type: "local";
951:     /**
952:      * Command and arguments to run the MCP server
953:      */
954:     command: Array<string>;
955:     /**
956:      * Environment variables to set when running the MCP server
957:      */
958:     environment?: {
959:         [key: string]: string;
960:     };
961:     /**
962:      * Enable or disable the MCP server on startup
963:      */
964:     enabled?: boolean;
965:     /**
966:      * Timeout in ms for fetching tools from the MCP server. Defaults to 5000 (5 seconds) if not specified.
967:      */
968:     timeout?: number;
969: };
970: export type McpOAuthConfig = {
971:     /**
972:      * OAuth client ID. If not provided, dynamic client registration (RFC 7591) will be attempted.
973:      */
974:     clientId?: string;
975:     /**
976:      * OAuth client secret (if required by the authorization server)
977:      */
978:     clientSecret?: string;
979:     /**
980:      * OAuth scopes to request during authorization
981:      */
982:     scope?: string;
983: };
984: export type McpRemoteConfig = {
985:     /**
986:      * Type of MCP server connection
987:      */
988:     type: "remote";
989:     /**
990:      * URL of the remote MCP server
991:      */
992:     url: string;
993:     /**
994:      * Enable or disable the MCP server on startup
995:      */
996:     enabled?: boolean;
997:     /**
998:      * Headers to send with the request
999:      */
1000:     headers?: {
1001:         [key: string]: string;
1002:     };
1003:     /**
1004:      * OAuth authentication configuration for the MCP server. Set to false to disable OAuth auto-detection.
1005:      */
1006:     oauth?: McpOAuthConfig | false;
1007:     /**
1008:      * Timeout in ms for fetching tools from the MCP server. Defaults to 5000 (5 seconds) if not specified.
1009:      */
1010:     timeout?: number;
1011: };
1012: /**
1013:  * @deprecated Always uses stretch layout.
1014:  */
1015: export type LayoutConfig = "auto" | "stretch";
1016: export type Config = {
1017:     /**
1018:      * JSON schema reference for configuration validation
1019:      */
1020:     $schema?: string;
1021:     /**
1022:      * Theme name to use for the interface
1023:      */
1024:     theme?: string;
1025:     keybinds?: KeybindsConfig;
1026:     /**
1027:      * Log level
1028:      */
1029:     logLevel?: "DEBUG" | "INFO" | "WARN" | "ERROR";
1030:     /**
1031:      * TUI specific settings
1032:      */
1033:     tui?: {
1034:         /**
1035:          * TUI scroll speed
1036:          */
1037:         scroll_speed?: number;
1038:         /**
1039:          * Scroll acceleration settings
1040:          */
1041:         scroll_acceleration?: {
1042:             /**
1043:              * Enable scroll acceleration
1044:              */
1045:             enabled: boolean;
1046:         };
1047:         /**
1048:          * Control diff rendering style: 'auto' adapts to terminal width, 'stacked' always shows single column
1049:          */
1050:         diff_style?: "auto" | "stacked";
1051:     };
1052:     /**
1053:      * Command configuration, see https://opencode.ai/docs/commands
1054:      */
1055:     command?: {
1056:         [key: string]: {
1057:             template: string;
1058:             description?: string;
1059:             agent?: string;
1060:             model?: string;
1061:             subtask?: boolean;
1062:         };
1063:     };
1064:     watcher?: {
1065:         ignore?: Array<string>;
1066:     };
1067:     plugin?: Array<string>;
1068:     snapshot?: boolean;
1069:     /**
1070:      * Control sharing behavior:'manual' allows manual sharing via commands, 'auto' enables automatic sharing, 'disabled' disables all sharing
1071:      */
1072:     share?: "manual" | "auto" | "disabled";
1073:     /**
1074:      * @deprecated Use 'share' field instead. Share newly created sessions automatically
1075:      */
1076:     autoshare?: boolean;
1077:     /**
1078:      * Automatically update to the latest version. Set to true to auto-update, false to disable, or 'notify' to show update notifications
1079:      */
1080:     autoupdate?: boolean | "notify";
1081:     /**
1082:      * Disable providers that are loaded automatically
1083:      */
1084:     disabled_providers?: Array<string>;
1085:     /**
1086:      * When set, ONLY these providers will be enabled. All other providers will be ignored
1087:      */
1088:     enabled_providers?: Array<string>;
1089:     /**
1090:      * Model to use in the format of provider/model, eg anthropic/claude-2
1091:      */
1092:     model?: string;
1093:     /**
1094:      * Small model to use for tasks like title generation in the format of provider/model
1095:      */
1096:     small_model?: string;
1097:     /**
1098:      * Custom username to display in conversations instead of system username
1099:      */
1100:     username?: string;
1101:     /**
1102:      * @deprecated Use `agent` field instead.
1103:      */
1104:     mode?: {
1105:         build?: AgentConfig;
1106:         plan?: AgentConfig;
1107:         [key: string]: AgentConfig | undefined;
1108:     };
1109:     /**
1110:      * Agent configuration, see https://opencode.ai/docs/agent
1111:      */
1112:     agent?: {
1113:         plan?: AgentConfig;
1114:         build?: AgentConfig;
1115:         general?: AgentConfig;
1116:         explore?: AgentConfig;
1117:         [key: string]: AgentConfig | undefined;
1118:     };
1119:     /**
1120:      * Custom provider configurations and model overrides
1121:      */
1122:     provider?: {
1123:         [key: string]: ProviderConfig;
1124:     };
1125:     /**
1126:      * MCP (Model Context Protocol) server configurations
1127:      */
1128:     mcp?: {
1129:         [key: string]: McpLocalConfig | McpRemoteConfig;
1130:     };
1131:     formatter?: false | {
1132:         [key: string]: {
1133:             disabled?: boolean;
1134:             command?: Array<string>;
1135:             environment?: {
1136:                 [key: string]: string;
1137:             };
1138:             extensions?: Array<string>;
1139:         };
1140:     };
1141:     lsp?: false | {
1142:         [key: string]: {
1143:             disabled: true;
1144:         } | {
1145:             command: Array<string>;
1146:             extensions?: Array<string>;
1147:             disabled?: boolean;
1148:             env?: {
1149:                 [key: string]: string;
1150:             };
1151:             initialization?: {
1152:                 [key: string]: unknown;
1153:             };
1154:         };
1155:     };
1156:     /**
1157:      * Additional instruction files or patterns to include
1158:      */
1159:     instructions?: Array<string>;
1160:     layout?: LayoutConfig;
1161:     permission?: {
1162:         edit?: "ask" | "allow" | "deny";
1163:         bash?: ("ask" | "allow" | "deny") | {
1164:             [key: string]: "ask" | "allow" | "deny";
1165:         };
1166:         webfetch?: "ask" | "allow" | "deny";
1167:         doom_loop?: "ask" | "allow" | "deny";
1168:         external_directory?: "ask" | "allow" | "deny";
1169:     };
1170:     tools?: {
1171:         [key: string]: boolean;
1172:     };
1173:     enterprise?: {
1174:         /**
1175:          * Enterprise URL
1176:          */
1177:         url?: string;
1178:     };
1179:     experimental?: {
1180:         hook?: {
1181:             file_edited?: {
1182:                 [key: string]: Array<{
1183:                     command: Array<string>;
1184:                     environment?: {
1185:                         [key: string]: string;
1186:                     };
1187:                 }>;
1188:             };
1189:             session_completed?: Array<{
1190:                 command: Array<string>;
1191:                 environment?: {
1192:                     [key: string]: string;
1193:                 };
1194:             }>;
1195:         };
1196:         /**
1197:          * Number of retries for chat completions on failure
1198:          */
1199:         chatMaxRetries?: number;
1200:         disable_paste_summary?: boolean;
1201:         /**
1202:          * Enable the batch tool
1203:          */
1204:         batch_tool?: boolean;
1205:         /**
1206:          * Enable OpenTelemetry spans for AI SDK calls (using the 'experimental_telemetry' flag)
1207:          */
1208:         openTelemetry?: boolean;
1209:         /**
1210:          * Tools that should only be available to primary agents.
1211:          */
1212:         primary_tools?: Array<string>;
1213:     };
1214: };
1215: export type ToolIds = Array<string>;
1216: export type ToolListItem = {
1217:     id: string;
1218:     description: string;
1219:     parameters: unknown;
1220: };
1221: export type ToolList = Array<ToolListItem>;
1222: export type Path = {
1223:     state: string;
1224:     config: string;
1225:     worktree: string;
1226:     directory: string;
1227: };
1228: export type VcsInfo = {
1229:     branch: string;
1230: };
1231: export type TextPartInput = {
1232:     id?: string;
1233:     type: "text";
1234:     text: string;
1235:     synthetic?: boolean;
1236:     ignored?: boolean;
1237:     time?: {
1238:         start: number;
1239:         end?: number;
1240:     };
1241:     metadata?: {
1242:         [key: string]: unknown;
1243:     };
1244: };
1245: export type FilePartInput = {
1246:     id?: string;
1247:     type: "file";
1248:     mime: string;
1249:     filename?: string;
1250:     url: string;
1251:     source?: FilePartSource;
1252: };
1253: export type AgentPartInput = {
1254:     id?: string;
1255:     type: "agent";
1256:     name: string;
1257:     source?: {
1258:         value: string;
1259:         start: number;
1260:         end: number;
1261:     };
1262: };
1263: export type SubtaskPartInput = {
1264:     id?: string;
1265:     type: "subtask";
1266:     prompt: string;
1267:     description: string;
1268:     agent: string;
1269: };
1270: export type Command = {
1271:     name: string;
1272:     description?: string;
1273:     agent?: string;
1274:     model?: string;
1275:     template: string;
1276:     subtask?: boolean;
1277: };
1278: export type Model = {
1279:     id: string;
1280:     providerID: string;
1281:     api: {
1282:         id: string;
1283:         url: string;
1284:         npm: string;
1285:     };
1286:     name: string;
1287:     capabilities: {
1288:         temperature: boolean;
1289:         reasoning: boolean;
1290:         attachment: boolean;
1291:         toolcall: boolean;
1292:         input: {
1293:             text: boolean;
1294:             audio: boolean;
1295:             image: boolean;
1296:             video: boolean;
1297:             pdf: boolean;
1298:         };
1299:         output: {
1300:             text: boolean;
1301:             audio: boolean;
1302:             image: boolean;
1303:             video: boolean;
1304:             pdf: boolean;
1305:         };
1306:     };
1307:     cost: {
1308:         input: number;
1309:         output: number;
1310:         cache: {
1311:             read: number;
1312:             write: number;
1313:         };
1314:         experimentalOver200K?: {
1315:             input: number;
1316:             output: number;
1317:             cache: {
1318:                 read: number;
1319:                 write: number;
1320:             };
1321:         };
1322:     };
1323:     limit: {
1324:         context: number;
1325:         output: number;
1326:     };
1327:     status: "alpha" | "beta" | "deprecated" | "active";
1328:     options: {
1329:         [key: string]: unknown;
1330:     };
1331:     headers: {
1332:         [key: string]: string;
1333:     };
1334: };
1335: export type Provider = {
1336:     id: string;
1337:     name: string;
1338:     source: "env" | "config" | "custom" | "api";
1339:     env: Array<string>;
1340:     key?: string;
1341:     options: {
1342:         [key: string]: unknown;
1343:     };
1344:     models: {
1345:         [key: string]: Model;
1346:     };
1347: };
1348: export type ProviderAuthMethod = {
1349:     type: "oauth" | "api";
1350:     label: string;
1351: };
1352: export type ProviderAuthAuthorization = {
1353:     url: string;
1354:     method: "auto" | "code";
1355:     instructions: string;
1356: };
1357: export type Symbol = {
1358:     name: string;
1359:     kind: number;
1360:     location: {
1361:         uri: string;
1362:         range: Range;
1363:     };
1364: };
1365: export type FileNode = {
1366:     name: string;
1367:     path: string;
1368:     absolute: string;
1369:     type: "file" | "directory";
1370:     ignored: boolean;
1371: };
1372: export type FileContent = {
1373:     type: "text" | "binary";
1374:     content: string;
1375:     diff?: string;
1376:     patch?: {
1377:         oldFileName: string;
1378:         newFileName: string;
1379:         oldHeader?: string;
1380:         newHeader?: string;
1381:         hunks: Array<{
1382:             oldStart: number;
1383:             oldLines: number;
1384:             newStart: number;
1385:             newLines: number;
1386:             lines: Array<string>;
1387:         }>;
1388:         index?: string;
1389:     };
1390:     encoding?: "base64";
1391:     mimeType?: string;
1392: };
1393: export type File = {
1394:     path: string;
1395:     added: number;
1396:     removed: number;
1397:     status: "added" | "deleted" | "modified";
1398: };
1399: export type Agent = {
1400:     name: string;
1401:     description?: string;
1402:     mode: "subagent" | "primary" | "all";
1403:     builtIn: boolean;
1404:     topP?: number;
1405:     temperature?: number;
1406:     color?: string;
1407:     permission: {
1408:         edit: "ask" | "allow" | "deny";
1409:         bash: {
1410:             [key: string]: "ask" | "allow" | "deny";
1411:         };
1412:         webfetch?: "ask" | "allow" | "deny";
1413:         doom_loop?: "ask" | "allow" | "deny";
1414:         external_directory?: "ask" | "allow" | "deny";
1415:     };
1416:     model?: {
1417:         modelID: string;
1418:         providerID: string;
1419:     };
1420:     prompt?: string;
1421:     tools: {
1422:         [key: string]: boolean;
1423:     };
1424:     options: {
1425:         [key: string]: unknown;
1426:     };
1427:     maxSteps?: number;
1428: };
1429: export type McpStatusConnected = {
1430:     status: "connected";
1431: };
1432: export type McpStatusDisabled = {
1433:     status: "disabled";
1434: };
1435: export type McpStatusFailed = {
1436:     status: "failed";
1437:     error: string;
1438: };
1439: export type McpStatusNeedsAuth = {
1440:     status: "needs_auth";
1441: };
1442: export type McpStatusNeedsClientRegistration = {
1443:     status: "needs_client_registration";
1444:     error: string;
1445: };
1446: export type McpStatus = McpStatusConnected | McpStatusDisabled | McpStatusFailed | McpStatusNeedsAuth | McpStatusNeedsClientRegistration;
1447: export type LspStatus = {
1448:     id: string;
1449:     name: string;
1450:     root: string;
1451:     status: "connected" | "error";
1452: };
1453: export type FormatterStatus = {
1454:     name: string;
1455:     extensions: Array<string>;
1456:     enabled: boolean;
1457: };
1458: export type OAuth = {
1459:     type: "oauth";
1460:     refresh: string;
1461:     access: string;
1462:     expires: number;
1463:     enterpriseUrl?: string;
1464: };
1465: export type ApiAuth = {
1466:     type: "api";
1467:     key: string;
1468: };
1469: export type WellKnownAuth = {
1470:     type: "wellknown";
1471:     key: string;
1472:     token: string;
1473: };
1474: export type Auth = OAuth | ApiAuth | WellKnownAuth;
1475: export type GlobalEventData = {
1476:     body?: never;
1477:     path?: never;
1478:     query?: never;
1479:     url: "/global/event";
1480: };
1481: export type GlobalEventResponses = {
1482:     /**
1483:      * Event stream
1484:      */
1485:     200: GlobalEvent;
1486: };
1487: export type GlobalEventResponse = GlobalEventResponses[keyof GlobalEventResponses];
1488: export type ProjectListData = {
1489:     body?: never;
1490:     path?: never;
1491:     query?: {
1492:         directory?: string;
1493:     };
1494:     url: "/project";
1495: };
1496: export type ProjectListResponses = {
1497:     /**
1498:      * List of projects
1499:      */
1500:     200: Array<Project>;
1501: };
1502: export type ProjectListResponse = ProjectListResponses[keyof ProjectListResponses];
1503: export type ProjectCurrentData = {
1504:     body?: never;
1505:     path?: never;
1506:     query?: {
1507:         directory?: string;
1508:     };
1509:     url: "/project/current";
1510: };
1511: export type ProjectCurrentResponses = {
1512:     /**
1513:      * Current project
1514:      */
1515:     200: Project;
1516: };
1517: export type ProjectCurrentResponse = ProjectCurrentResponses[keyof ProjectCurrentResponses];
1518: export type PtyListData = {
1519:     body?: never;
1520:     path?: never;
1521:     query?: {
1522:         directory?: string;
1523:     };
1524:     url: "/pty";
1525: };
1526: export type PtyListResponses = {
1527:     /**
1528:      * List of sessions
1529:      */
1530:     200: Array<Pty>;
1531: };
1532: export type PtyListResponse = PtyListResponses[keyof PtyListResponses];
1533: export type PtyCreateData = {
1534:     body?: {
1535:         command?: string;
1536:         args?: Array<string>;
1537:         cwd?: string;
1538:         title?: string;
1539:         env?: {
1540:             [key: string]: string;
1541:         };
1542:     };
1543:     path?: never;
1544:     query?: {
1545:         directory?: string;
1546:     };
1547:     url: "/pty";
1548: };
1549: export type PtyCreateErrors = {
1550:     /**
1551:      * Bad request
1552:      */
1553:     400: BadRequestError;
1554: };
1555: export type PtyCreateError = PtyCreateErrors[keyof PtyCreateErrors];
1556: export type PtyCreateResponses = {
1557:     /**
1558:      * Created session
1559:      */
1560:     200: Pty;
1561: };
1562: export type PtyCreateResponse = PtyCreateResponses[keyof PtyCreateResponses];
1563: export type PtyRemoveData = {
1564:     body?: never;
1565:     path: {
1566:         id: string;
1567:     };
1568:     query?: {
1569:         directory?: string;
1570:     };
1571:     url: "/pty/{id}";
1572: };
1573: export type PtyRemoveErrors = {
1574:     /**
1575:      * Not found
1576:      */
1577:     404: NotFoundError;
1578: };
1579: export type PtyRemoveError = PtyRemoveErrors[keyof PtyRemoveErrors];
1580: export type PtyRemoveResponses = {
1581:     /**
1582:      * Session removed
1583:      */
1584:     200: boolean;
1585: };
1586: export type PtyRemoveResponse = PtyRemoveResponses[keyof PtyRemoveResponses];
1587: export type PtyGetData = {
1588:     body?: never;
1589:     path: {
1590:         id: string;
1591:     };
1592:     query?: {
1593:         directory?: string;
1594:     };
1595:     url: "/pty/{id}";
1596: };
1597: export type PtyGetErrors = {
1598:     /**
1599:      * Not found
1600:      */
1601:     404: NotFoundError;
1602: };
1603: export type PtyGetError = PtyGetErrors[keyof PtyGetErrors];
1604: export type PtyGetResponses = {
1605:     /**
1606:      * Session info
1607:      */
1608:     200: Pty;
1609: };
1610: export type PtyGetResponse = PtyGetResponses[keyof PtyGetResponses];
1611: export type PtyUpdateData = {
1612:     body?: {
1613:         title?: string;
1614:         size?: {
1615:             rows: number;
1616:             cols: number;
1617:         };
1618:     };
1619:     path: {
1620:         id: string;
1621:     };
1622:     query?: {
1623:         directory?: string;
1624:     };
1625:     url: "/pty/{id}";
1626: };
1627: export type PtyUpdateErrors = {
1628:     /**
1629:      * Bad request
1630:      */
1631:     400: BadRequestError;
1632: };
1633: export type PtyUpdateError = PtyUpdateErrors[keyof PtyUpdateErrors];
1634: export type PtyUpdateResponses = {
1635:     /**
1636:      * Updated session
1637:      */
1638:     200: Pty;
1639: };
1640: export type PtyUpdateResponse = PtyUpdateResponses[keyof PtyUpdateResponses];
1641: export type PtyConnectData = {
1642:     body?: never;
1643:     path: {
1644:         id: string;
1645:     };
1646:     query?: {
1647:         directory?: string;
1648:     };
1649:     url: "/pty/{id}/connect";
1650: };
1651: export type PtyConnectErrors = {
1652:     /**
1653:      * Not found
1654:      */
1655:     404: NotFoundError;
1656: };
1657: export type PtyConnectError = PtyConnectErrors[keyof PtyConnectErrors];
1658: export type PtyConnectResponses = {
1659:     /**
1660:      * Connected session
1661:      */
1662:     200: boolean;
1663: };
1664: export type PtyConnectResponse = PtyConnectResponses[keyof PtyConnectResponses];
1665: export type ConfigGetData = {
1666:     body?: never;
1667:     path?: never;
1668:     query?: {
1669:         directory?: string;
1670:     };
1671:     url: "/config";
1672: };
1673: export type ConfigGetResponses = {
1674:     /**
1675:      * Get config info
1676:      */
1677:     200: Config;
1678: };
1679: export type ConfigGetResponse = ConfigGetResponses[keyof ConfigGetResponses];
1680: export type ConfigUpdateData = {
1681:     body?: Config;
1682:     path?: never;
1683:     query?: {
1684:         directory?: string;
1685:     };
1686:     url: "/config";
1687: };
1688: export type ConfigUpdateErrors = {
1689:     /**
1690:      * Bad request
1691:      */
1692:     400: BadRequestError;
1693: };
1694: export type ConfigUpdateError = ConfigUpdateErrors[keyof ConfigUpdateErrors];
1695: export type ConfigUpdateResponses = {
1696:     /**
1697:      * Successfully updated config
1698:      */
1699:     200: Config;
1700: };
1701: export type ConfigUpdateResponse = ConfigUpdateResponses[keyof ConfigUpdateResponses];
1702: export type ToolIdsData = {
1703:     body?: never;
1704:     path?: never;
1705:     query?: {
1706:         directory?: string;
1707:     };
1708:     url: "/experimental/tool/ids";
1709: };
1710: export type ToolIdsErrors = {
1711:     /**
1712:      * Bad request
1713:      */
1714:     400: BadRequestError;
1715: };
1716: export type ToolIdsError = ToolIdsErrors[keyof ToolIdsErrors];
1717: export type ToolIdsResponses = {
1718:     /**
1719:      * Tool IDs
1720:      */
1721:     200: ToolIds;
1722: };
1723: export type ToolIdsResponse = ToolIdsResponses[keyof ToolIdsResponses];
1724: export type ToolListData = {
1725:     body?: never;
1726:     path?: never;
1727:     query: {
1728:         directory?: string;
1729:         provider: string;
1730:         model: string;
1731:     };
1732:     url: "/experimental/tool";
1733: };
1734: export type ToolListErrors = {
1735:     /**
1736:      * Bad request
1737:      */
1738:     400: BadRequestError;
1739: };
1740: export type ToolListError = ToolListErrors[keyof ToolListErrors];
1741: export type ToolListResponses = {
1742:     /**
1743:      * Tools
1744:      */
1745:     200: ToolList;
1746: };
1747: export type ToolListResponse = ToolListResponses[keyof ToolListResponses];
1748: export type InstanceDisposeData = {
1749:     body?: never;
1750:     path?: never;
1751:     query?: {
1752:         directory?: string;
1753:     };
1754:     url: "/instance/dispose";
1755: };
1756: export type InstanceDisposeResponses = {
1757:     /**
1758:      * Instance disposed
1759:      */
1760:     200: boolean;
1761: };
1762: export type InstanceDisposeResponse = InstanceDisposeResponses[keyof InstanceDisposeResponses];
1763: export type PathGetData = {
1764:     body?: never;
1765:     path?: never;
1766:     query?: {
1767:         directory?: string;
1768:     };
1769:     url: "/path";
1770: };
1771: export type PathGetResponses = {
1772:     /**
1773:      * Path
1774:      */
1775:     200: Path;
1776: };
1777: export type PathGetResponse = PathGetResponses[keyof PathGetResponses];
1778: export type VcsGetData = {
1779:     body?: never;
1780:     path?: never;
1781:     query?: {
1782:         directory?: string;
1783:     };
1784:     url: "/vcs";
1785: };
1786: export type VcsGetResponses = {
1787:     /**
1788:      * VCS info
1789:      */
1790:     200: VcsInfo;
1791: };
1792: export type VcsGetResponse = VcsGetResponses[keyof VcsGetResponses];
1793: export type SessionListData = {
1794:     body?: never;
1795:     path?: never;
1796:     query?: {
1797:         directory?: string;
1798:     };
1799:     url: "/session";
1800: };
1801: export type SessionListResponses = {
1802:     /**
1803:      * List of sessions
1804:      */
1805:     200: Array<Session>;
1806: };
1807: export type SessionListResponse = SessionListResponses[keyof SessionListResponses];
1808: export type SessionCreateData = {
1809:     body?: {
1810:         parentID?: string;
1811:         title?: string;
1812:     };
1813:     path?: never;
1814:     query?: {
1815:         directory?: string;
1816:     };
1817:     url: "/session";
1818: };
1819: export type SessionCreateErrors = {
1820:     /**
1821:      * Bad request
1822:      */
1823:     400: BadRequestError;
1824: };
1825: export type SessionCreateError = SessionCreateErrors[keyof SessionCreateErrors];
1826: export type SessionCreateResponses = {
1827:     /**
1828:      * Successfully created session
1829:      */
1830:     200: Session;
1831: };
1832: export type SessionCreateResponse = SessionCreateResponses[keyof SessionCreateResponses];
1833: export type SessionStatusData = {
1834:     body?: never;
1835:     path?: never;
1836:     query?: {
1837:         directory?: string;
1838:     };
1839:     url: "/session/status";
1840: };
1841: export type SessionStatusErrors = {
1842:     /**
1843:      * Bad request
1844:      */
1845:     400: BadRequestError;
1846: };
1847: export type SessionStatusError = SessionStatusErrors[keyof SessionStatusErrors];
1848: export type SessionStatusResponses = {
1849:     /**
1850:      * Get session status
1851:      */
1852:     200: {
1853:         [key: string]: SessionStatus;
1854:     };
1855: };
1856: export type SessionStatusResponse = SessionStatusResponses[keyof SessionStatusResponses];
1857: export type SessionDeleteData = {
1858:     body?: never;
1859:     path: {
1860:         id: string;
1861:     };
1862:     query?: {
1863:         directory?: string;
1864:     };
1865:     url: "/session/{id}";
1866: };
1867: export type SessionDeleteErrors = {
1868:     /**
1869:      * Bad request
1870:      */
1871:     400: BadRequestError;
1872:     /**
1873:      * Not found
1874:      */
1875:     404: NotFoundError;
1876: };
1877: export type SessionDeleteError = SessionDeleteErrors[keyof SessionDeleteErrors];
1878: export type SessionDeleteResponses = {
1879:     /**
1880:      * Successfully deleted session
1881:      */
1882:     200: boolean;
1883: };
1884: export type SessionDeleteResponse = SessionDeleteResponses[keyof SessionDeleteResponses];
1885: export type SessionGetData = {
1886:     body?: never;
1887:     path: {
1888:         id: string;
1889:     };
1890:     query?: {
1891:         directory?: string;
1892:     };
1893:     url: "/session/{id}";
1894: };
1895: export type SessionGetErrors = {
1896:     /**
1897:      * Bad request
1898:      */
1899:     400: BadRequestError;
1900:     /**
1901:      * Not found
1902:      */
1903:     404: NotFoundError;
1904: };
1905: export type SessionGetError = SessionGetErrors[keyof SessionGetErrors];
1906: export type SessionGetResponses = {
1907:     /**
1908:      * Get session
1909:      */
1910:     200: Session;
1911: };
1912: export type SessionGetResponse = SessionGetResponses[keyof SessionGetResponses];
1913: export type SessionUpdateData = {
1914:     body?: {
1915:         title?: string;
1916:     };
1917:     path: {
1918:         id: string;
1919:     };
1920:     query?: {
1921:         directory?: string;
1922:     };
1923:     url: "/session/{id}";
1924: };
1925: export type SessionUpdateErrors = {
1926:     /**
1927:      * Bad request
1928:      */
1929:     400: BadRequestError;
1930:     /**
1931:      * Not found
1932:      */
1933:     404: NotFoundError;
1934: };
1935: export type SessionUpdateError = SessionUpdateErrors[keyof SessionUpdateErrors];
1936: export type SessionUpdateResponses = {
1937:     /**
1938:      * Successfully updated session
1939:      */
1940:     200: Session;
1941: };
1942: export type SessionUpdateResponse = SessionUpdateResponses[keyof SessionUpdateResponses];
1943: export type SessionChildrenData = {
1944:     body?: never;
1945:     path: {
1946:         id: string;
1947:     };
1948:     query?: {
1949:         directory?: string;
1950:     };
1951:     url: "/session/{id}/children";
1952: };
1953: export type SessionChildrenErrors = {
1954:     /**
1955:      * Bad request
1956:      */
1957:     400: BadRequestError;
1958:     /**
1959:      * Not found
1960:      */
1961:     404: NotFoundError;
1962: };
1963: export type SessionChildrenError = SessionChildrenErrors[keyof SessionChildrenErrors];
1964: export type SessionChildrenResponses = {
1965:     /**
1966:      * List of children
1967:      */
1968:     200: Array<Session>;
1969: };
1970: export type SessionChildrenResponse = SessionChildrenResponses[keyof SessionChildrenResponses];
1971: export type SessionTodoData = {
1972:     body?: never;
1973:     path: {
1974:         /**
1975:          * Session ID
1976:          */
1977:         id: string;
1978:     };
1979:     query?: {
1980:         directory?: string;
1981:     };
1982:     url: "/session/{id}/todo";
1983: };
1984: export type SessionTodoErrors = {
1985:     /**
1986:      * Bad request
1987:      */
1988:     400: BadRequestError;
1989:     /**
1990:      * Not found
1991:      */
1992:     404: NotFoundError;
1993: };
1994: export type SessionTodoError = SessionTodoErrors[keyof SessionTodoErrors];
1995: export type SessionTodoResponses = {
1996:     /**
1997:      * Todo list
1998:      */
1999:     200: Array<Todo>;
2000: };

(Showing lines 1-2000 of 3380. Use offset=2001 to continue.)
</content>
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/node_modules/@opencode-ai/sdk/dist/gen/types.gen.d.ts"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/node_modules/@opencode-ai/sdk/dist/gen/types.gen.d.ts</path>
<type>file</type>
<content>
2001: export type SessionTodoResponse = SessionTodoResponses[keyof SessionTodoResponses];
2002: export type SessionInitData = {
2003:     body?: {
2004:         modelID: string;
2005:         providerID: string;
2006:         messageID: string;
2007:     };
2008:     path: {
2009:         /**
2010:          * Session ID
2011:          */
2012:         id: string;
2013:     };
2014:     query?: {
2015:         directory?: string;
2016:     };
2017:     url: "/session/{id}/init";
2018: };
2019: export type SessionInitErrors = {
2020:     /**
2021:      * Bad request
2022:      */
2023:     400: BadRequestError;
2024:     /**
2025:      * Not found
2026:      */
2027:     404: NotFoundError;
2028: };
2029: export type SessionInitError = SessionInitErrors[keyof SessionInitErrors];
2030: export type SessionInitResponses = {
2031:     /**
2032:      * 200
2033:      */
2034:     200: boolean;
2035: };
2036: export type SessionInitResponse = SessionInitResponses[keyof SessionInitResponses];
2037: export type SessionForkData = {
2038:     body?: {
2039:         messageID?: string;
2040:     };
2041:     path: {
2042:         id: string;
2043:     };
2044:     query?: {
2045:         directory?: string;
2046:     };
2047:     url: "/session/{id}/fork";
2048: };
2049: export type SessionForkResponses = {
2050:     /**
2051:      * 200
2052:      */
2053:     200: Session;
2054: };
2055: export type SessionForkResponse = SessionForkResponses[keyof SessionForkResponses];
2056: export type SessionAbortData = {
2057:     body?: never;
2058:     path: {
2059:         id: string;
2060:     };
2061:     query?: {
2062:         directory?: string;
2063:     };
2064:     url: "/session/{id}/abort";
2065: };
2066: export type SessionAbortErrors = {
2067:     /**
2068:      * Bad request
2069:      */
2070:     400: BadRequestError;
2071:     /**
2072:      * Not found
2073:      */
2074:     404: NotFoundError;
2075: };
2076: export type SessionAbortError = SessionAbortErrors[keyof SessionAbortErrors];
2077: export type SessionAbortResponses = {
2078:     /**
2079:      * Aborted session
2080:      */
2081:     200: boolean;
2082: };
2083: export type SessionAbortResponse = SessionAbortResponses[keyof SessionAbortResponses];
2084: export type SessionUnshareData = {
2085:     body?: never;
2086:     path: {
2087:         id: string;
2088:     };
2089:     query?: {
2090:         directory?: string;
2091:     };
2092:     url: "/session/{id}/share";
2093: };
2094: export type SessionUnshareErrors = {
2095:     /**
2096:      * Bad request
2097:      */
2098:     400: BadRequestError;
2099:     /**
2100:      * Not found
2101:      */
2102:     404: NotFoundError;
2103: };
2104: export type SessionUnshareError = SessionUnshareErrors[keyof SessionUnshareErrors];
2105: export type SessionUnshareResponses = {
2106:     /**
2107:      * Successfully unshared session
2108:      */
2109:     200: Session;
2110: };
2111: export type SessionUnshareResponse = SessionUnshareResponses[keyof SessionUnshareResponses];
2112: export type SessionShareData = {
2113:     body?: never;
2114:     path: {
2115:         id: string;
2116:     };
2117:     query?: {
2118:         directory?: string;
2119:     };
2120:     url: "/session/{id}/share";
2121: };
2122: export type SessionShareErrors = {
2123:     /**
2124:      * Bad request
2125:      */
2126:     400: BadRequestError;
2127:     /**
2128:      * Not found
2129:      */
2130:     404: NotFoundError;
2131: };
2132: export type SessionShareError = SessionShareErrors[keyof SessionShareErrors];
2133: export type SessionShareResponses = {
2134:     /**
2135:      * Successfully shared session
2136:      */
2137:     200: Session;
2138: };
2139: export type SessionShareResponse = SessionShareResponses[keyof SessionShareResponses];
2140: export type SessionDiffData = {
2141:     body?: never;
2142:     path: {
2143:         /**
2144:          * Session ID
2145:          */
2146:         id: string;
2147:     };
2148:     query?: {
2149:         directory?: string;
2150:         messageID?: string;
2151:     };
2152:     url: "/session/{id}/diff";
2153: };
2154: export type SessionDiffErrors = {
2155:     /**
2156:      * Bad request
2157:      */
2158:     400: BadRequestError;
2159:     /**
2160:      * Not found
2161:      */
2162:     404: NotFoundError;
2163: };
2164: export type SessionDiffError = SessionDiffErrors[keyof SessionDiffErrors];
2165: export type SessionDiffResponses = {
2166:     /**
2167:      * List of diffs
2168:      */
2169:     200: Array<FileDiff>;
2170: };
2171: export type SessionDiffResponse = SessionDiffResponses[keyof SessionDiffResponses];
2172: export type SessionSummarizeData = {
2173:     body?: {
2174:         providerID: string;
2175:         modelID: string;
2176:     };
2177:     path: {
2178:         /**
2179:          * Session ID
2180:          */
2181:         id: string;
2182:     };
2183:     query?: {
2184:         directory?: string;
2185:     };
2186:     url: "/session/{id}/summarize";
2187: };
2188: export type SessionSummarizeErrors = {
2189:     /**
2190:      * Bad request
2191:      */
2192:     400: BadRequestError;
2193:     /**
2194:      * Not found
2195:      */
2196:     404: NotFoundError;
2197: };
2198: export type SessionSummarizeError = SessionSummarizeErrors[keyof SessionSummarizeErrors];
2199: export type SessionSummarizeResponses = {
2200:     /**
2201:      * Summarized session
2202:      */
2203:     200: boolean;
2204: };
2205: export type SessionSummarizeResponse = SessionSummarizeResponses[keyof SessionSummarizeResponses];
2206: export type SessionMessagesData = {
2207:     body?: never;
2208:     path: {
2209:         /**
2210:          * Session ID
2211:          */
2212:         id: string;
2213:     };
2214:     query?: {
2215:         directory?: string;
2216:         limit?: number;
2217:     };
2218:     url: "/session/{id}/message";
2219: };
2220: export type SessionMessagesErrors = {
2221:     /**
2222:      * Bad request
2223:      */
2224:     400: BadRequestError;
2225:     /**
2226:      * Not found
2227:      */
2228:     404: NotFoundError;
2229: };
2230: export type SessionMessagesError = SessionMessagesErrors[keyof SessionMessagesErrors];
2231: export type SessionMessagesResponses = {
2232:     /**
2233:      * List of messages
2234:      */
2235:     200: Array<{
2236:         info: Message;
2237:         parts: Array<Part>;
2238:     }>;
2239: };
2240: export type SessionMessagesResponse = SessionMessagesResponses[keyof SessionMessagesResponses];
2241: export type SessionPromptData = {
2242:     body?: {
2243:         messageID?: string;
2244:         model?: {
2245:             providerID: string;
2246:             modelID: string;
2247:         };
2248:         agent?: string;
2249:         noReply?: boolean;
2250:         system?: string;
2251:         tools?: {
2252:             [key: string]: boolean;
2253:         };
2254:         parts: Array<TextPartInput | FilePartInput | AgentPartInput | SubtaskPartInput>;
2255:     };
2256:     path: {
2257:         /**
2258:          * Session ID
2259:          */
2260:         id: string;
2261:     };
2262:     query?: {
2263:         directory?: string;
2264:     };
2265:     url: "/session/{id}/message";
2266: };
2267: export type SessionPromptErrors = {
2268:     /**
2269:      * Bad request
2270:      */
2271:     400: BadRequestError;
2272:     /**
2273:      * Not found
2274:      */
2275:     404: NotFoundError;
2276: };
2277: export type SessionPromptError = SessionPromptErrors[keyof SessionPromptErrors];
2278: export type SessionPromptResponses = {
2279:     /**
2280:      * Created message
2281:      */
2282:     200: {
2283:         info: AssistantMessage;
2284:         parts: Array<Part>;
2285:     };
2286: };
2287: export type SessionPromptResponse = SessionPromptResponses[keyof SessionPromptResponses];
2288: export type SessionMessageData = {
2289:     body?: never;
2290:     path: {
2291:         /**
2292:          * Session ID
2293:          */
2294:         id: string;
2295:         /**
2296:          * Message ID
2297:          */
2298:         messageID: string;
2299:     };
2300:     query?: {
2301:         directory?: string;
2302:     };
2303:     url: "/session/{id}/message/{messageID}";
2304: };
2305: export type SessionMessageErrors = {
2306:     /**
2307:      * Bad request
2308:      */
2309:     400: BadRequestError;
2310:     /**
2311:      * Not found
2312:      */
2313:     404: NotFoundError;
2314: };
2315: export type SessionMessageError = SessionMessageErrors[keyof SessionMessageErrors];
2316: export type SessionMessageResponses = {
2317:     /**
2318:      * Message
2319:      */
2320:     200: {
2321:         info: Message;
2322:         parts: Array<Part>;
2323:     };
2324: };
2325: export type SessionMessageResponse = SessionMessageResponses[keyof SessionMessageResponses];
2326: export type SessionPromptAsyncData = {
2327:     body?: {
2328:         messageID?: string;
2329:         model?: {
2330:             providerID: string;
2331:             modelID: string;
2332:         };
2333:         agent?: string;
2334:         noReply?: boolean;
2335:         system?: string;
2336:         tools?: {
2337:             [key: string]: boolean;
2338:         };
2339:         parts: Array<TextPartInput | FilePartInput | AgentPartInput | SubtaskPartInput>;
2340:     };
2341:     path: {
2342:         /**
2343:          * Session ID
2344:          */
2345:         id: string;
2346:     };
2347:     query?: {
2348:         directory?: string;
2349:     };
2350:     url: "/session/{id}/prompt_async";
2351: };
2352: export type SessionPromptAsyncErrors = {
2353:     /**
2354:      * Bad request
2355:      */
2356:     400: BadRequestError;
2357:     /**
2358:      * Not found
2359:      */
2360:     404: NotFoundError;
2361: };
2362: export type SessionPromptAsyncError = SessionPromptAsyncErrors[keyof SessionPromptAsyncErrors];
2363: export type SessionPromptAsyncResponses = {
2364:     /**
2365:      * Prompt accepted
2366:      */
2367:     204: void;
2368: };
2369: export type SessionPromptAsyncResponse = SessionPromptAsyncResponses[keyof SessionPromptAsyncResponses];
2370: export type SessionCommandData = {
2371:     body?: {
2372:         messageID?: string;
2373:         agent?: string;
2374:         model?: string;
2375:         arguments: string;
2376:         command: string;
2377:     };
2378:     path: {
2379:         /**
2380:          * Session ID
2381:          */
2382:         id: string;
2383:     };
2384:     query?: {
2385:         directory?: string;
2386:     };
2387:     url: "/session/{id}/command";
2388: };
2389: export type SessionCommandErrors = {
2390:     /**
2391:      * Bad request
2392:      */
2393:     400: BadRequestError;
2394:     /**
2395:      * Not found
2396:      */
2397:     404: NotFoundError;
2398: };
2399: export type SessionCommandError = SessionCommandErrors[keyof SessionCommandErrors];
2400: export type SessionCommandResponses = {
2401:     /**
2402:      * Created message
2403:      */
2404:     200: {
2405:         info: AssistantMessage;
2406:         parts: Array<Part>;
2407:     };
2408: };
2409: export type SessionCommandResponse = SessionCommandResponses[keyof SessionCommandResponses];
2410: export type SessionShellData = {
2411:     body?: {
2412:         agent: string;
2413:         model?: {
2414:             providerID: string;
2415:             modelID: string;
2416:         };
2417:         command: string;
2418:     };
2419:     path: {
2420:         /**
2421:          * Session ID
2422:          */
2423:         id: string;
2424:     };
2425:     query?: {
2426:         directory?: string;
2427:     };
2428:     url: "/session/{id}/shell";
2429: };
2430: export type SessionShellErrors = {
2431:     /**
2432:      * Bad request
2433:      */
2434:     400: BadRequestError;
2435:     /**
2436:      * Not found
2437:      */
2438:     404: NotFoundError;
2439: };
2440: export type SessionShellError = SessionShellErrors[keyof SessionShellErrors];
2441: export type SessionShellResponses = {
2442:     /**
2443:      * Created message
2444:      */
2445:     200: AssistantMessage;
2446: };
2447: export type SessionShellResponse = SessionShellResponses[keyof SessionShellResponses];
2448: export type SessionRevertData = {
2449:     body?: {
2450:         messageID: string;
2451:         partID?: string;
2452:     };
2453:     path: {
2454:         id: string;
2455:     };
2456:     query?: {
2457:         directory?: string;
2458:     };
2459:     url: "/session/{id}/revert";
2460: };
2461: export type SessionRevertErrors = {
2462:     /**
2463:      * Bad request
2464:      */
2465:     400: BadRequestError;
2466:     /**
2467:      * Not found
2468:      */
2469:     404: NotFoundError;
2470: };
2471: export type SessionRevertError = SessionRevertErrors[keyof SessionRevertErrors];
2472: export type SessionRevertResponses = {
2473:     /**
2474:      * Updated session
2475:      */
2476:     200: Session;
2477: };
2478: export type SessionRevertResponse = SessionRevertResponses[keyof SessionRevertResponses];
2479: export type SessionUnrevertData = {
2480:     body?: never;
2481:     path: {
2482:         id: string;
2483:     };
2484:     query?: {
2485:         directory?: string;
2486:     };
2487:     url: "/session/{id}/unrevert";
2488: };
2489: export type SessionUnrevertErrors = {
2490:     /**
2491:      * Bad request
2492:      */
2493:     400: BadRequestError;
2494:     /**
2495:      * Not found
2496:      */
2497:     404: NotFoundError;
2498: };
2499: export type SessionUnrevertError = SessionUnrevertErrors[keyof SessionUnrevertErrors];
2500: export type SessionUnrevertResponses = {
2501:     /**
2502:      * Updated session
2503:      */
2504:     200: Session;
2505: };
2506: export type SessionUnrevertResponse = SessionUnrevertResponses[keyof SessionUnrevertResponses];
2507: export type PostSessionIdPermissionsPermissionIdData = {
2508:     body?: {
2509:         response: "once" | "always" | "reject";
2510:     };
2511:     path: {
2512:         id: string;
2513:         permissionID: string;
2514:     };
2515:     query?: {
2516:         directory?: string;
2517:     };
2518:     url: "/session/{id}/permissions/{permissionID}";
2519: };
2520: export type PostSessionIdPermissionsPermissionIdErrors = {
2521:     /**
2522:      * Bad request
2523:      */
2524:     400: BadRequestError;
2525:     /**
2526:      * Not found
2527:      */
2528:     404: NotFoundError;
2529: };
2530: export type PostSessionIdPermissionsPermissionIdError = PostSessionIdPermissionsPermissionIdErrors[keyof PostSessionIdPermissionsPermissionIdErrors];
2531: export type PostSessionIdPermissionsPermissionIdResponses = {
2532:     /**
2533:      * Permission processed successfully
2534:      */
2535:     200: boolean;
2536: };
2537: export type PostSessionIdPermissionsPermissionIdResponse = PostSessionIdPermissionsPermissionIdResponses[keyof PostSessionIdPermissionsPermissionIdResponses];
2538: export type CommandListData = {
2539:     body?: never;
2540:     path?: never;
2541:     query?: {
2542:         directory?: string;
2543:     };
2544:     url: "/command";
2545: };
2546: export type CommandListResponses = {
2547:     /**
2548:      * List of commands
2549:      */
2550:     200: Array<Command>;
2551: };
2552: export type CommandListResponse = CommandListResponses[keyof CommandListResponses];
2553: export type ConfigProvidersData = {
2554:     body?: never;
2555:     path?: never;
2556:     query?: {
2557:         directory?: string;
2558:     };
2559:     url: "/config/providers";
2560: };
2561: export type ConfigProvidersResponses = {
2562:     /**
2563:      * List of providers
2564:      */
2565:     200: {
2566:         providers: Array<Provider>;
2567:         default: {
2568:             [key: string]: string;
2569:         };
2570:     };
2571: };
2572: export type ConfigProvidersResponse = ConfigProvidersResponses[keyof ConfigProvidersResponses];
2573: export type ProviderListData = {
2574:     body?: never;
2575:     path?: never;
2576:     query?: {
2577:         directory?: string;
2578:     };
2579:     url: "/provider";
2580: };
2581: export type ProviderListResponses = {
2582:     /**
2583:      * List of providers
2584:      */
2585:     200: {
2586:         all: Array<{
2587:             api?: string;
2588:             name: string;
2589:             env: Array<string>;
2590:             id: string;
2591:             npm?: string;
2592:             models: {
2593:                 [key: string]: {
2594:                     id: string;
2595:                     name: string;
2596:                     release_date: string;
2597:                     attachment: boolean;
2598:                     reasoning: boolean;
2599:                     temperature: boolean;
2600:                     tool_call: boolean;
2601:                     cost?: {
2602:                         input: number;
2603:                         output: number;
2604:                         cache_read?: number;
2605:                         cache_write?: number;
2606:                         context_over_200k?: {
2607:                             input: number;
2608:                             output: number;
2609:                             cache_read?: number;
2610:                             cache_write?: number;
2611:                         };
2612:                     };
2613:                     limit: {
2614:                         context: number;
2615:                         output: number;
2616:                     };
2617:                     modalities?: {
2618:                         input: Array<"text" | "audio" | "image" | "video" | "pdf">;
2619:                         output: Array<"text" | "audio" | "image" | "video" | "pdf">;
2620:                     };
2621:                     experimental?: boolean;
2622:                     status?: "alpha" | "beta" | "deprecated" | "active";
2623:                     options: {
2624:                         [key: string]: unknown;
2625:                     };
2626:                     headers?: {
2627:                         [key: string]: string;
2628:                     };
2629:                     provider?: {
2630:                         npm: string;
2631:                     };
2632:                 };
2633:             };
2634:         }>;
2635:         default: {
2636:             [key: string]: string;
2637:         };
2638:         connected: Array<string>;
2639:     };
2640: };
2641: export type ProviderListResponse = ProviderListResponses[keyof ProviderListResponses];
2642: export type ProviderAuthData = {
2643:     body?: never;
2644:     path?: never;
2645:     query?: {
2646:         directory?: string;
2647:     };
2648:     url: "/provider/auth";
2649: };
2650: export type ProviderAuthResponses = {
2651:     /**
2652:      * Provider auth methods
2653:      */
2654:     200: {
2655:         [key: string]: Array<ProviderAuthMethod>;
2656:     };
2657: };
2658: export type ProviderAuthResponse = ProviderAuthResponses[keyof ProviderAuthResponses];
2659: export type ProviderOauthAuthorizeData = {
2660:     body?: {
2661:         /**
2662:          * Auth method index
2663:          */
2664:         method: number;
2665:     };
2666:     path: {
2667:         /**
2668:          * Provider ID
2669:          */
2670:         id: string;
2671:     };
2672:     query?: {
2673:         directory?: string;
2674:     };
2675:     url: "/provider/{id}/oauth/authorize";
2676: };
2677: export type ProviderOauthAuthorizeErrors = {
2678:     /**
2679:      * Bad request
2680:      */
2681:     400: BadRequestError;
2682: };
2683: export type ProviderOauthAuthorizeError = ProviderOauthAuthorizeErrors[keyof ProviderOauthAuthorizeErrors];
2684: export type ProviderOauthAuthorizeResponses = {
2685:     /**
2686:      * Authorization URL and method
2687:      */
2688:     200: ProviderAuthAuthorization;
2689: };
2690: export type ProviderOauthAuthorizeResponse = ProviderOauthAuthorizeResponses[keyof ProviderOauthAuthorizeResponses];
2691: export type ProviderOauthCallbackData = {
2692:     body?: {
2693:         /**
2694:          * Auth method index
2695:          */
2696:         method: number;
2697:         /**
2698:          * OAuth authorization code
2699:          */
2700:         code?: string;
2701:     };
2702:     path: {
2703:         /**
2704:          * Provider ID
2705:          */
2706:         id: string;
2707:     };
2708:     query?: {
2709:         directory?: string;
2710:     };
2711:     url: "/provider/{id}/oauth/callback";
2712: };
2713: export type ProviderOauthCallbackErrors = {
2714:     /**
2715:      * Bad request
2716:      */
2717:     400: BadRequestError;
2718: };
2719: export type ProviderOauthCallbackError = ProviderOauthCallbackErrors[keyof ProviderOauthCallbackErrors];
2720: export type ProviderOauthCallbackResponses = {
2721:     /**
2722:      * OAuth callback processed successfully
2723:      */
2724:     200: boolean;
2725: };
2726: export type ProviderOauthCallbackResponse = ProviderOauthCallbackResponses[keyof ProviderOauthCallbackResponses];
2727: export type FindTextData = {
2728:     body?: never;
2729:     path?: never;
2730:     query: {
2731:         directory?: string;
2732:         pattern: string;
2733:     };
2734:     url: "/find";
2735: };
2736: export type FindTextResponses = {
2737:     /**
2738:      * Matches
2739:      */
2740:     200: Array<{
2741:         path: {
2742:             text: string;
2743:         };
2744:         lines: {
2745:             text: string;
2746:         };
2747:         line_number: number;
2748:         absolute_offset: number;
2749:         submatches: Array<{
2750:             match: {
2751:                 text: string;
2752:             };
2753:             start: number;
2754:             end: number;
2755:         }>;
2756:     }>;
2757: };
2758: export type FindTextResponse = FindTextResponses[keyof FindTextResponses];
2759: export type FindFilesData = {
2760:     body?: never;
2761:     path?: never;
2762:     query: {
2763:         directory?: string;
2764:         query: string;
2765:         dirs?: "true" | "false";
2766:     };
2767:     url: "/find/file";
2768: };
2769: export type FindFilesResponses = {
2770:     /**
2771:      * File paths
2772:      */
2773:     200: Array<string>;
2774: };
2775: export type FindFilesResponse = FindFilesResponses[keyof FindFilesResponses];
2776: export type FindSymbolsData = {
2777:     body?: never;
2778:     path?: never;
2779:     query: {
2780:         directory?: string;
2781:         query: string;
2782:     };
2783:     url: "/find/symbol";
2784: };
2785: export type FindSymbolsResponses = {
2786:     /**
2787:      * Symbols
2788:      */
2789:     200: Array<Symbol>;
2790: };
2791: export type FindSymbolsResponse = FindSymbolsResponses[keyof FindSymbolsResponses];
2792: export type FileListData = {
2793:     body?: never;
2794:     path?: never;
2795:     query: {
2796:         directory?: string;
2797:         path: string;
2798:     };
2799:     url: "/file";
2800: };
2801: export type FileListResponses = {
2802:     /**
2803:      * Files and directories
2804:      */
2805:     200: Array<FileNode>;
2806: };
2807: export type FileListResponse = FileListResponses[keyof FileListResponses];
2808: export type FileReadData = {
2809:     body?: never;
2810:     path?: never;
2811:     query: {
2812:         directory?: string;
2813:         path: string;
2814:     };
2815:     url: "/file/content";
2816: };
2817: export type FileReadResponses = {
2818:     /**
2819:      * File content
2820:      */
2821:     200: FileContent;
2822: };
2823: export type FileReadResponse = FileReadResponses[keyof FileReadResponses];
2824: export type FileStatusData = {
2825:     body?: never;
2826:     path?: never;
2827:     query?: {
2828:         directory?: string;
2829:     };
2830:     url: "/file/status";
2831: };
2832: export type FileStatusResponses = {
2833:     /**
2834:      * File status
2835:      */
2836:     200: Array<File>;
2837: };
2838: export type FileStatusResponse = FileStatusResponses[keyof FileStatusResponses];
2839: export type AppLogData = {
2840:     body?: {
2841:         /**
2842:          * Service name for the log entry
2843:          */
2844:         service: string;
2845:         /**
2846:          * Log level
2847:          */
2848:         level: "debug" | "info" | "error" | "warn";
2849:         /**
2850:          * Log message
2851:          */
2852:         message: string;
2853:         /**
2854:          * Additional metadata for the log entry
2855:          */
2856:         extra?: {
2857:             [key: string]: unknown;
2858:         };
2859:     };
2860:     path?: never;
2861:     query?: {
2862:         directory?: string;
2863:     };
2864:     url: "/log";
2865: };
2866: export type AppLogErrors = {
2867:     /**
2868:      * Bad request
2869:      */
2870:     400: BadRequestError;
2871: };
2872: export type AppLogError = AppLogErrors[keyof AppLogErrors];
2873: export type AppLogResponses = {
2874:     /**
2875:      * Log entry written successfully
2876:      */
2877:     200: boolean;
2878: };
2879: export type AppLogResponse = AppLogResponses[keyof AppLogResponses];
2880: export type AppAgentsData = {
2881:     body?: never;
2882:     path?: never;
2883:     query?: {
2884:         directory?: string;
2885:     };
2886:     url: "/agent";
2887: };
2888: export type AppAgentsResponses = {
2889:     /**
2890:      * List of agents
2891:      */
2892:     200: Array<Agent>;
2893: };
2894: export type AppAgentsResponse = AppAgentsResponses[keyof AppAgentsResponses];
2895: export type McpStatusData = {
2896:     body?: never;
2897:     path?: never;
2898:     query?: {
2899:         directory?: string;
2900:     };
2901:     url: "/mcp";
2902: };
2903: export type McpStatusResponses = {
2904:     /**
2905:      * MCP server status
2906:      */
2907:     200: {
2908:         [key: string]: McpStatus;
2909:     };
2910: };
2911: export type McpStatusResponse = McpStatusResponses[keyof McpStatusResponses];
2912: export type McpAddData = {
2913:     body?: {
2914:         name: string;
2915:         config: McpLocalConfig | McpRemoteConfig;
2916:     };
2917:     path?: never;
2918:     query?: {
2919:         directory?: string;
2920:     };
2921:     url: "/mcp";
2922: };
2923: export type McpAddErrors = {
2924:     /**
2925:      * Bad request
2926:      */
2927:     400: BadRequestError;
2928: };
2929: export type McpAddError = McpAddErrors[keyof McpAddErrors];
2930: export type McpAddResponses = {
2931:     /**
2932:      * MCP server added successfully
2933:      */
2934:     200: {
2935:         [key: string]: McpStatus;
2936:     };
2937: };
2938: export type McpAddResponse = McpAddResponses[keyof McpAddResponses];
2939: export type McpAuthRemoveData = {
2940:     body?: never;
2941:     path: {
2942:         name: string;
2943:     };
2944:     query?: {
2945:         directory?: string;
2946:     };
2947:     url: "/mcp/{name}/auth";
2948: };
2949: export type McpAuthRemoveErrors = {
2950:     /**
2951:      * Not found
2952:      */
2953:     404: NotFoundError;
2954: };
2955: export type McpAuthRemoveError = McpAuthRemoveErrors[keyof McpAuthRemoveErrors];
2956: export type McpAuthRemoveResponses = {
2957:     /**
2958:      * OAuth credentials removed
2959:      */
2960:     200: {
2961:         success: true;
2962:     };
2963: };
2964: export type McpAuthRemoveResponse = McpAuthRemoveResponses[keyof McpAuthRemoveResponses];
2965: export type McpAuthStartData = {
2966:     body?: never;
2967:     path: {
2968:         name: string;
2969:     };
2970:     query?: {
2971:         directory?: string;
2972:     };
2973:     url: "/mcp/{name}/auth";
2974: };
2975: export type McpAuthStartErrors = {
2976:     /**
2977:      * Bad request
2978:      */
2979:     400: BadRequestError;
2980:     /**
2981:      * Not found
2982:      */
2983:     404: NotFoundError;
2984: };
2985: export type McpAuthStartError = McpAuthStartErrors[keyof McpAuthStartErrors];
2986: export type McpAuthStartResponses = {
2987:     /**
2988:      * OAuth flow started
2989:      */
2990:     200: {
2991:         /**
2992:          * URL to open in browser for authorization
2993:          */
2994:         authorizationUrl: string;
2995:     };
2996: };
2997: export type McpAuthStartResponse = McpAuthStartResponses[keyof McpAuthStartResponses];
2998: export type McpAuthCallbackData = {
2999:     body?: {
3000:         /**
3001:          * Authorization code from OAuth callback
3002:          */
3003:         code: string;
3004:     };
3005:     path: {
3006:         name: string;
3007:     };
3008:     query?: {
3009:         directory?: string;
3010:     };
3011:     url: "/mcp/{name}/auth/callback";
3012: };
3013: export type McpAuthCallbackErrors = {
3014:     /**
3015:      * Bad request
3016:      */
3017:     400: BadRequestError;
3018:     /**
3019:      * Not found
3020:      */
3021:     404: NotFoundError;
3022: };
3023: export type McpAuthCallbackError = McpAuthCallbackErrors[keyof McpAuthCallbackErrors];
3024: export type McpAuthCallbackResponses = {
3025:     /**
3026:      * OAuth authentication completed
3027:      */
3028:     200: McpStatus;
3029: };
3030: export type McpAuthCallbackResponse = McpAuthCallbackResponses[keyof McpAuthCallbackResponses];
3031: export type McpAuthAuthenticateData = {
3032:     body?: never;
3033:     path: {
3034:         name: string;
3035:     };
3036:     query?: {
3037:         directory?: string;
3038:     };
3039:     url: "/mcp/{name}/auth/authenticate";
3040: };
3041: export type McpAuthAuthenticateErrors = {
3042:     /**
3043:      * Bad request
3044:      */
3045:     400: BadRequestError;
3046:     /**
3047:      * Not found
3048:      */
3049:     404: NotFoundError;
3050: };
3051: export type McpAuthAuthenticateError = McpAuthAuthenticateErrors[keyof McpAuthAuthenticateErrors];
3052: export type McpAuthAuthenticateResponses = {
3053:     /**
3054:      * OAuth authentication completed
3055:      */
3056:     200: McpStatus;
3057: };
3058: export type McpAuthAuthenticateResponse = McpAuthAuthenticateResponses[keyof McpAuthAuthenticateResponses];
3059: export type McpConnectData = {
3060:     body?: never;
3061:     path: {
3062:         name: string;
3063:     };
3064:     query?: {
3065:         directory?: string;
3066:     };
3067:     url: "/mcp/{name}/connect";
3068: };
3069: export type McpConnectResponses = {
3070:     /**
3071:      * MCP server connected successfully
3072:      */
3073:     200: boolean;
3074: };
3075: export type McpConnectResponse = McpConnectResponses[keyof McpConnectResponses];
3076: export type McpDisconnectData = {
3077:     body?: never;
3078:     path: {
3079:         name: string;
3080:     };
3081:     query?: {
3082:         directory?: string;
3083:     };
3084:     url: "/mcp/{name}/disconnect";
3085: };
3086: export type McpDisconnectResponses = {
3087:     /**
3088:      * MCP server disconnected successfully
3089:      */
3090:     200: boolean;
3091: };
3092: export type McpDisconnectResponse = McpDisconnectResponses[keyof McpDisconnectResponses];
3093: export type LspStatusData = {
3094:     body?: never;
3095:     path?: never;
3096:     query?: {
3097:         directory?: string;
3098:     };
3099:     url: "/lsp";
3100: };
3101: export type LspStatusResponses = {
3102:     /**
3103:      * LSP server status
3104:      */
3105:     200: Array<LspStatus>;
3106: };
3107: export type LspStatusResponse = LspStatusResponses[keyof LspStatusResponses];
3108: export type FormatterStatusData = {
3109:     body?: never;
3110:     path?: never;
3111:     query?: {
3112:         directory?: string;
3113:     };
3114:     url: "/formatter";
3115: };
3116: export type FormatterStatusResponses = {
3117:     /**
3118:      * Formatter status
3119:      */
3120:     200: Array<FormatterStatus>;
3121: };
3122: export type FormatterStatusResponse = FormatterStatusResponses[keyof FormatterStatusResponses];
3123: export type TuiAppendPromptData = {
3124:     body?: {
3125:         text: string;
3126:     };
3127:     path?: never;
3128:     query?: {
3129:         directory?: string;
3130:     };
3131:     url: "/tui/append-prompt";
3132: };
3133: export type TuiAppendPromptErrors = {
3134:     /**
3135:      * Bad request
3136:      */
3137:     400: BadRequestError;
3138: };
3139: export type TuiAppendPromptError = TuiAppendPromptErrors[keyof TuiAppendPromptErrors];
3140: export type TuiAppendPromptResponses = {
3141:     /**
3142:      * Prompt processed successfully
3143:      */
3144:     200: boolean;
3145: };
3146: export type TuiAppendPromptResponse = TuiAppendPromptResponses[keyof TuiAppendPromptResponses];
3147: export type TuiOpenHelpData = {
3148:     body?: never;
3149:     path?: never;
3150:     query?: {
3151:         directory?: string;
3152:     };
3153:     url: "/tui/open-help";
3154: };
3155: export type TuiOpenHelpResponses = {
3156:     /**
3157:      * Help dialog opened successfully
3158:      */
3159:     200: boolean;
3160: };
3161: export type TuiOpenHelpResponse = TuiOpenHelpResponses[keyof TuiOpenHelpResponses];
3162: export type TuiOpenSessionsData = {
3163:     body?: never;
3164:     path?: never;
3165:     query?: {
3166:         directory?: string;
3167:     };
3168:     url: "/tui/open-sessions";
3169: };
3170: export type TuiOpenSessionsResponses = {
3171:     /**
3172:      * Session dialog opened successfully
3173:      */
3174:     200: boolean;
3175: };
3176: export type TuiOpenSessionsResponse = TuiOpenSessionsResponses[keyof TuiOpenSessionsResponses];
3177: export type TuiOpenThemesData = {
3178:     body?: never;
3179:     path?: never;
3180:     query?: {
3181:         directory?: string;
3182:     };
3183:     url: "/tui/open-themes";
3184: };
3185: export type TuiOpenThemesResponses = {
3186:     /**
3187:      * Theme dialog opened successfully
3188:      */
3189:     200: boolean;
3190: };
3191: export type TuiOpenThemesResponse = TuiOpenThemesResponses[keyof TuiOpenThemesResponses];
3192: export type TuiOpenModelsData = {
3193:     body?: never;
3194:     path?: never;
3195:     query?: {
3196:         directory?: string;
3197:     };
3198:     url: "/tui/open-models";
3199: };
3200: export type TuiOpenModelsResponses = {
3201:     /**
3202:      * Model dialog opened successfully
3203:      */
3204:     200: boolean;
3205: };
3206: export type TuiOpenModelsResponse = TuiOpenModelsResponses[keyof TuiOpenModelsResponses];
3207: export type TuiSubmitPromptData = {
3208:     body?: never;
3209:     path?: never;
3210:     query?: {
3211:         directory?: string;
3212:     };
3213:     url: "/tui/submit-prompt";
3214: };
3215: export type TuiSubmitPromptResponses = {
3216:     /**
3217:      * Prompt submitted successfully
3218:      */
3219:     200: boolean;
3220: };
3221: export type TuiSubmitPromptResponse = TuiSubmitPromptResponses[keyof TuiSubmitPromptResponses];
3222: export type TuiClearPromptData = {
3223:     body?: never;
3224:     path?: never;
3225:     query?: {
3226:         directory?: string;
3227:     };
3228:     url: "/tui/clear-prompt";
3229: };
3230: export type TuiClearPromptResponses = {
3231:     /**
3232:      * Prompt cleared successfully
3233:      */
3234:     200: boolean;
3235: };
3236: export type TuiClearPromptResponse = TuiClearPromptResponses[keyof TuiClearPromptResponses];
3237: export type TuiExecuteCommandData = {
3238:     body?: {
3239:         command: string;
3240:     };
3241:     path?: never;
3242:     query?: {
3243:         directory?: string;
3244:     };
3245:     url: "/tui/execute-command";
3246: };
3247: export type TuiExecuteCommandErrors = {
3248:     /**
3249:      * Bad request
3250:      */
3251:     400: BadRequestError;
3252: };
3253: export type TuiExecuteCommandError = TuiExecuteCommandErrors[keyof TuiExecuteCommandErrors];
3254: export type TuiExecuteCommandResponses = {
3255:     /**
3256:      * Command executed successfully
3257:      */
3258:     200: boolean;
3259: };
3260: export type TuiExecuteCommandResponse = TuiExecuteCommandResponses[keyof TuiExecuteCommandResponses];
3261: export type TuiShowToastData = {
3262:     body?: {
3263:         title?: string;
3264:         message: string;
3265:         variant: "info" | "success" | "warning" | "error";
3266:         /**
3267:          * Duration in milliseconds
3268:          */
3269:         duration?: number;
3270:     };
3271:     path?: never;
3272:     query?: {
3273:         directory?: string;
3274:     };
3275:     url: "/tui/show-toast";
3276: };
3277: export type TuiShowToastResponses = {
3278:     /**
3279:      * Toast notification shown successfully
3280:      */
3281:     200: boolean;
3282: };
3283: export type TuiShowToastResponse = TuiShowToastResponses[keyof TuiShowToastResponses];
3284: export type TuiPublishData = {
3285:     body?: EventTuiPromptAppend | EventTuiCommandExecute | EventTuiToastShow;
3286:     path?: never;
3287:     query?: {
3288:         directory?: string;
3289:     };
3290:     url: "/tui/publish";
3291: };
3292: export type TuiPublishErrors = {
3293:     /**
3294:      * Bad request
3295:      */
3296:     400: BadRequestError;
3297: };
3298: export type TuiPublishError = TuiPublishErrors[keyof TuiPublishErrors];
3299: export type TuiPublishResponses = {
3300:     /**
3301:      * Event published successfully
3302:      */
3303:     200: boolean;
3304: };
3305: export type TuiPublishResponse = TuiPublishResponses[keyof TuiPublishResponses];
3306: export type TuiControlNextData = {
3307:     body?: never;
3308:     path?: never;
3309:     query?: {
3310:         directory?: string;
3311:     };
3312:     url: "/tui/control/next";
3313: };
3314: export type TuiControlNextResponses = {
3315:     /**
3316:      * Next TUI request
3317:      */
3318:     200: {
3319:         path: string;
3320:         body: unknown;
3321:     };
3322: };
3323: export type TuiControlNextResponse = TuiControlNextResponses[keyof TuiControlNextResponses];
3324: export type TuiControlResponseData = {
3325:     body?: unknown;
3326:     path?: never;
3327:     query?: {
3328:         directory?: string;
3329:     };
3330:     url: "/tui/control/response";
3331: };
3332: export type TuiControlResponseResponses = {
3333:     /**
3334:      * Response submitted successfully
3335:      */
3336:     200: boolean;
3337: };
3338: export type TuiControlResponseResponse = TuiControlResponseResponses[keyof TuiControlResponseResponses];
3339: export type AuthSetData = {
3340:     body?: Auth;
3341:     path: {
3342:         id: string;
3343:     };
3344:     query?: {
3345:         directory?: string;
3346:     };
3347:     url: "/auth/{id}";
3348: };
3349: export type AuthSetErrors = {
3350:     /**
3351:      * Bad request
3352:      */
3353:     400: BadRequestError;
3354: };
3355: export type AuthSetError = AuthSetErrors[keyof AuthSetErrors];
3356: export type AuthSetResponses = {
3357:     /**
3358:      * Successfully set authentication credentials
3359:      */
3360:     200: boolean;
3361: };
3362: export type AuthSetResponse = AuthSetResponses[keyof AuthSetResponses];
3363: export type EventSubscribeData = {
3364:     body?: never;
3365:     path?: never;
3366:     query?: {
3367:         directory?: string;
3368:     };
3369:     url: "/event";
3370: };
3371: export type EventSubscribeResponses = {
3372:     /**
3373:      * Event stream
3374:      */
3375:     200: Event;
3376: };
3377: export type EventSubscribeResponse = EventSubscribeResponses[keyof EventSubscribeResponses];
3378: export type ClientOptions = {
3379:     baseUrl: `${string}://${string}` | (string & {});
3380: };

(End of file - total 3380 lines)
</content>
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/node_modules/@opencode-ai/plugin/dist/index.d.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/node_modules/@opencode-ai/plugin/dist/tool.d.ts"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_sthkXbzr4cKRSPp5nxK78619"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_00_wMp0knogf0b8667mkoLW7446"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/node_modules/@opencode-ai/sdk/dist/gen/client/types.gen.d.ts"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/node_modules/@opencode-ai/sdk/dist/gen/client/types.gen.d.ts</path>
<type>file</type>
<content>
60:      * Security mechanism(s) to use for the request.
61:      */
62:     security?: ReadonlyArray<Auth>;
63:     url: Url;
64: }
65: export interface ResolvedRequestOptions<TResponseStyle extends ResponseStyle = "fields", ThrowOnError extends boolean = boolean, Url extends string = string> extends RequestOptions<unknown, TResponseStyle, ThrowOnError, Url> {
66:     serializedBody?: string;
67: }
68: export type RequestResult<TData = unknown, TError = unknown, ThrowOnError extends boolean = boolean, TResponseStyle extends ResponseStyle = "fields"> = ThrowOnError extends true ? Promise<TResponseStyle extends "data" ? TData extends Record<string, unknown> ? TData[keyof TData] : TData : {
69:     data: TData extends Record<string, unknown> ? TData[keyof TData] : TData;
70:     request: Request;
71:     response: Response;
72: }> : Promise<TResponseStyle extends "data" ? (TData extends Record<string, unknown> ? TData[keyof TData] : TData) | undefined : ({
73:     data: TData extends Record<string, unknown> ? TData[keyof TData] : TData;
74:     error: undefined;
75: } | {
76:     data: undefined;
77:     error: TError extends Record<string, unknown> ? TError[keyof TError] : TError;
78: }) & {
79:     request: Request;
80:     response: Response;
81: }>;
82: export interface ClientOptions {
83:     baseUrl?: string;
84:     responseStyle?: ResponseStyle;
85:     throwOnError?: boolean;
86: }
87: type MethodFnBase = <TData = unknown, TError = unknown, ThrowOnError extends boolean = false, TResponseStyle extends ResponseStyle = "fields">(options: Omit<RequestOptions<TData, TResponseStyle, ThrowOnError>, "method">) => RequestResult<TData, TError, ThrowOnError, TResponseStyle>;
88: type MethodFnServerSentEvents = <TData = unknown, TError = unknown, ThrowOnError extends boolean = false, TResponseStyle extends ResponseStyle = "fields">(options: Omit<RequestOptions<TData, TResponseStyle, ThrowOnError>, "method">) => Promise<ServerSentEventsResult<TData, TError>>;
89: type MethodFn = MethodFnBase & {
90:     sse: MethodFnServerSentEvents;
91: };
92: type RequestFn = <TData = unknown, TError = unknown, ThrowOnError extends boolean = false, TResponseStyle extends ResponseStyle = "fields">(options: Omit<RequestOptions<TData, TResponseStyle, ThrowOnError>, "method"> & Pick<Required<RequestOptions<TData, TResponseStyle, ThrowOnError>>, "method">) => RequestResult<TData, TError, ThrowOnError, TResponseStyle>;
93: type BuildUrlFn = <TData extends {
94:     body?: unknown;
95:     path?: Record<string, unknown>;
96:     query?: Record<string, unknown>;
97:     url: string;
98: }>(options: Pick<TData, "url"> & Options<TData>) => string;
99: export type Client = CoreClient<RequestFn, Config, MethodFn, BuildUrlFn> & {

(Showing lines 60-99 of 127. Use offset=100 to continue.)
</content>
```


### Tool: write

**Input:**
```json
{
  "callID": "call_00_vonPHPPeyc2OB3X0ENtl4625"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_AvuYIczjrM2zVgPJLDp87557"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_ET_7ivifGw7AO6F4YTMl79e6067"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_IBOk5Kh8IQsxyoWVTIQn5105"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_e8IQqyqCd7XaUMY5doFi0260"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/tools/execute-command.ts"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/.opencode/tools/execute-command.ts</path>
<type>file</type>
<content>
1: import { tool } from "@opencode-ai/plugin"
2: import { createOpencodeClient } from "@opencode-ai/sdk"
3: 
4: /**
5:  * Helper to unwrap SDK response objects handling both "fields" and "data" response styles.
6:  * The SDK default response style wraps data in { data: T, error, request, response }.
7:  * This extracts the inner data, or returns the value as-is if already unwrapped.
8:  */
9: function unwrapData<T>(response: unknown): T {
10:   if (
11:     response !== null &&
12:     typeof response === "object" &&
13:     "data" in response &&
14:     !("id" in response)
15:   ) {
16:     return (response as { data: T }).data
17:   }
18:   return response as T
19: }
20: 
21: /**
22:  * Custom tool for executing OpenCode commands and prompts on child sessions.
23:  *
24:  * The core problem this solves: calling `client.session.command()` on the **current**
25:  * (parent) session queues the command because the session is busy processing this tool.
26:  * This tool instead creates a CHILD session (linked via parentID), which is idle,
27:  * so dispatch runs immediately.
28:  *
29:  * Two modes:
30:  * - `dispatch` (default): Runs a command synchronously on a child session and returns
31:  *   the result. Requires `command` + optional `arguments`.
32:  * - `fire-and-forget`: Sends a prompt to a child session via `promptAsync` with
33:  *   `noReply: true` and returns immediately. Uses `prompt` or `command` + `arguments`.
34:  *
35:  * When `agent` is omitted, the tool lists all available agents for selection.
36:  */
37: export default tool({
38:   description:
39:     "Execute a command or prompt on a child session (not the current busy session). " +
40:     "Supports two modes: 'dispatch' (sync command execution on child session) and " +
41:     "'fire-and-forget' (async prompt dispatch to child session, returns immediately). " +
42:     "When no agent is specified, lists available agents for selection.",
43:   args: {
44:     mode: tool.schema
45:       .enum(["dispatch", "fire-and-forget"])
46:       .optional()
47:       .default("dispatch")
48:       .describe(
49:         "Execution mode: 'dispatch' runs a command synchronously on a child session, " +
50:           "'fire-and-forget' sends an async prompt and returns immediately",
51:       ),
52:     command: tool.schema
53:       .string()
54:       .optional()
55:       .describe(
56:         "The command name to execute (e.g., 'plan', 'gsd', 'hf-create'). " +
57:           "Do not include leading slash. Required for dispatch mode.",
58:       ),
59:     arguments: tool.schema
60:       .string()
61:       .optional()
62:       .default("")
63:       .describe("Optional arguments to pass to the command (e.g., '--help' or 'build-feature-x')."),
64:     prompt: tool.schema
65:       .string()
66:       .optional()
67:       .describe("Text prompt to send (alternative to command, preferred for fire-and-forget mode)."),
68:     agent: tool.schema
69:       .string()
70:       .optional()
71:       .describe(
72:         "Target agent name (e.g., 'hm-l2-executor', 'gsd-planner'). " +
73:           "If omitted, lists available agents for selection.",
74:       ),
75:     title: tool.schema
76:       .string()
77:       .optional()
78:       .describe("Optional title for the child session (auto-generated if omitted)."),
79:   },
80:   async execute(
81:     args: {
82:       mode: "dispatch" | "fire-and-forget"
83:       command?: string
84:       arguments?: string
85:       prompt?: string
86:       agent?: string
87:       title?: string
88:     },
89:     context: { sessionID: string; messageID: string; agent: string; directory: string; worktree: string },
90:   ): Promise<string> {
91:     try {
92:       // --- Validation ---
93:       if (!args.command && !args.prompt) {
94:         return JSON.stringify({
95:           success: false,
96:           error: "Either 'command' or 'prompt' must be provided",
97:         })
98:       }
99: 
100:       if (args.mode === "dispatch" && !args.command) {
101:         return JSON.stringify({
102:           success: false,
103:           error: "Command is required for dispatch mode. Use 'prompt' with fire-and-forget mode instead.",
104:         })
105:       }
106: 
107:       // Create SDK client connected to the local OpenCode server
108:       const client = createOpencodeClient()
109: 
110:       // --- Agent selection (when agent is omitted) ---
111:       if (!args.agent) {
112:         const response = await client.app.agents()
113:         const agents = unwrapData<Array<{ name: string; description?: string; mode: string }>>(response)
114: 
115:         if (!Array.isArray(agents)) {
116:           return JSON.stringify({
117:             success: false,
118:             error: "Failed to retrieve agent list",
119:           })
120:         }
121: 
122:         const agentList = agents.map((a) => ({
123:           name: a.name,
124:           description: a.description ?? null,
125:           mode: a.mode,
126:         }))
127: 
128:         return JSON.stringify({
129:           success: false,
130:           needsAgentSelection: true,
131:           agents: agentList,
132:         })
133:       }
134: 
135:       // --- Create child session ---
136:       const sessionResponse = await client.session.create({
137:         body: {
138:           parentID: context.sessionID,
139:           title:
140:             args.title ??
141:             `execute-${args.command ?? "prompt"}-${args.mode === "fire-and-forget" ? "async" : "sync"}`,
142:         },
143:       })
144: 
145:       const childSession = unwrapData<{ id: string }>(sessionResponse)
146:       const childSessionId = childSession?.id
147: 
148:       if (!childSessionId) {
149:         return JSON.stringify({
150:           success: false,
151:           error: "Failed to create child session — no session ID returned",
152:         })
153:       }
154: 
155:       // --- Fire-and-forget mode ---
156:       if (args.mode === "fire-and-forget") {
157:         const text =
158:           args.prompt ??
159:           `/${args.command ?? ""} ${args.arguments ?? ""}`.trim()
160: 
161:         await client.session.promptAsync({
162:           path: { id: childSessionId },
163:           body: {
164:             agent: args.agent,
165:             noReply: true,
166:             parts: [{ type: "text", text }],
167:           },
168:         })
169: 
170:         return JSON.stringify({
171:           success: true,
172:           mode: "fire-and-forget",
173:           childSessionId,
174:           status: "dispatched",
175:         })
176:       }
177: 
178:       // --- Dispatch mode (sync command) ---
179:       const commandResponse = await client.session.command({
180:         path: { id: childSessionId },
181:         body: {
182:           command: args.command!,
183:           arguments: args.arguments ?? "",
184:           agent: args.agent,
185:         },
186:       })
187: 
188:       const commandResult = unwrapData<{
189:         info: { id: string; role: string; modelID: string; providerID: string }
190:         parts: Array<unknown>
191:       }>(commandResponse)
192: 
193:       return JSON.stringify({
194:         success: true,
195:         mode: "dispatch",
196:         childSessionId,
197:         command: args.command,
198:         arguments: args.arguments ?? "",
199:         result: {
200:           info: commandResult?.info ?? null,
201:           partCount: Array.isArray(commandResult?.parts) ? commandResult.parts.length : 0,
202:         },
203:       })
204:     } catch (error) {
205:       return JSON.stringify({
206:         success: false,
207:         error: error instanceof Error ? error.message : String(error),
208:       })
209:     }
210:   },
211: })

(End of file - total 211 lines)
</content>
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_a3CSP3FHO2LYVEvD5yif5211"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_ET_TV04mYDrkLz9W71CWVRV9088"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_ssxJAKMTU8jKHhrzhDB53120"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_ET_dKRzlAAM4pCZ9HTRKkfr4842"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_ET_7zSRjxbLoG37oL0qmkI72612"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_Hz8nQ0lMSExHS07qY2KL3666"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_PfdTG0t9evmKgwYuPAmD1164"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_01_gEHcC8Qf8WKgFv7gAagA7337"
}
```

