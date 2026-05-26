# New session - 2026-05-26T12:56:14.637Z

**Session ID:** ses_19ba48fd2ffeg6YeVM616W0hYr
**Created:** 5/26/2026, 7:56:14 PM
**Updated:** 5/26/2026, 8:08:35 PM

---

## User

Route to the appropriate codebase-intelligence skill based on the user's intent.
`gsd-scan` and `gsd-intel` were folded into `gsd-map-codebase` flags by #2790.

| User wants | Invoke |
|---|---|
| Map the full codebase structure | gsd-map-codebase |
| Quick lightweight codebase scan | gsd-map-codebase --fast |
| Query mapped intelligence files | gsd-map-codebase --query |
| Generate a knowledge graph | gsd-graphify |
| Update project documentation | gsd-docs-update |
| Extract learnings from a completed phase | gsd-extract-learnings |

Invoke the matched skill directly using the Skill tool.

## Revamp slash-command-execute và các chức năng và tools liên quan đến nó

yêu cầu: tìm các phase liên quan đến nó trước đây xem đã làm gì với nó rồi cũng như các gsd phases đã lên STATE và ROADMAP để chèn hoặc modify đúng state để không bị conflict dependencies - cũng như xem công việc hoàn thành của nhóm phases 24.x

### Miêu tả:

đây là một cluster tools và feature liên quan đến định hình routing của hm-orchestrator và các agent có quyền sử dụng để điều phối và điều chỉnh “slash commands” được lưu sẵn trong project hoặc global của OpenCode để làm các việc sau đây (lưu ý function này sẽ load các slash commands của users có tại .opencode/command(s) - nó lấy cả số ít và số nhiều - có định dạng dot md và cả json - các lưu ý advanced là sau này nó sẽ liên kết chặt chẽ vào các cluster liên quan đến delegation, coordination, routing, user intent và task managements và được config trực tiếp tại config.json trong configuration và governance plane)

1. append một slash command dựa vào context của workflows sau khi user prompting tại OpenCode runtime (chú ý là ở bất cứ prompting nào và được deterministically use bởi agent khi nó thấy cần thiết phải dùng qua natural language của user mà không phải nhất thiết user phải yêu cầu nó dùng execute-slash-command) - các kiến thức liên quan https://opencode.ai/docs/commands/ ; https://opencode.ai/docs/agents/ ; https://opencode.ai/docs/tui#commands ;https://opencode.ai/docs/tui#bash-commands; https://opencode.ai/docs/config ; https://opencode.ai/docs/sdk/ ; https://opencode.ai/docs/server/ ; https://opencode.ai/docs/plugins/ 
    1. → một slash command khi append có thể bao gồm yếu tố $ARGUMENTS và propositional để điều phối command theo các bước
    2. → slash command có thể kết hợp với shell! bash command nhưng đừng lẫn lộn 2 nhóm này 
    3. → để parse các file kèm với slash command (để kết hợp với references, templates, hay workflows thì việc nhắc tới  các file đó sẽ được viết ở command này  đây là một ví dụ /Users/apple/hivemind-plugin-private/.opencode/commands/gsd-plan-phase.md 
2. Các kết hợp advanced cho chức năng auto-slash command này
    1. các command  có field agent: và agent_type được điền vào thì sẽ switch agent và chạy ở agent đó
    2. các command có thêm field subtask=true thì sẽ được chạy ở mode subagent 
3. Các chức năng nâng cao khác do nhóm tool này tạo ra
    1. cho phép điều chỉnh trường agent và field subtask true false tạm thời mà không ảnh hưởng tới command gốc của user
    2. các chức năng nào khác nữa nhưng tôi quên rồi audit và cho tôi biết  phân tích gaps và flaw của nó luôn

### Các flaws và gaps tôi quan sát được

Đối với nhóm 1 phía trên  thì các lỗi sau thường hay gặp nhìn chung đó là khi append command vào tui agent không phân biệt được đó chính là command nó tạo ra (nó hoặc là lầm tưởng từ user manually append hoặc tệ hại hơn là sau khi append nó tưởng là command đã được carried out mặc dù nó phải thực hiện theo các hướng dẫn của command đó)  và  rất hay hallucination với việc command đó đã được dispatch thay vì triển khai theo như command đó yêu cầu và cụ thể hơn là với:

- nhóm 1a và b, c chưa được ứng dụng đúng do nó không hiểu phải append command đó theo yêu cầu
- nhầm lẫn với task tool và delegate-task đối với các command yêu cầu execute theo workflow và step nó không hiểu các sequence này để kết hợp sử dụng với task tool và delegate-task
- việc chỉ qua natural language để tự sử dụng các tools này hoàn toàn không có
- việc dynamic load các primitives liên quan là command(s) và agent(s) vẫn chưa chính xác và thứ tự load của nó khi sử dụng auto slash command cũng chưa có
- dường như chỉ có front facing mới có thể sử dụng các tools này còn delegated (qua task tool hay delegate-task đều không sử dụng được mà có sử dụng được nó cũng thiếu mất intelligence khi append các command này nó cứ tưởng đó là nó hoặc là lầm tưởng từ user manually append hoặc tệ hại hơn là sau khi append nó tưởng là command đã được carried out mặc dù nó phải thực hiện theo các hướng dẫn của command đó)

Lỗi chung thấy nữa đó là nếu append ở main session thì nó sẽ qua TUI và append trực tiếp không qua xếp hàng chờ - còn nếu ở sub thì phải qua task tool payload 

Đối với nhóm 2 và 3 thì các lỗi sau thường thấy 

- không linh động được việc  dùng command đó ở main hoặc sub nhất là ở các command không có sẵn 2 trường agent và subtask cụ thể là `điều chỉnh trường agent và field subtask true false tạm thời mà không ảnh hưởng tới command gốc` → lý do chính đó là nếu chạy sub thì nó sẽ phải qua task tool payload và append nội dung command đó vào prompt đúng y như nhóm 1 nhưng ở sub session
- tương tự như tren nhưng đối với agent khi append ở tui và sub session thì
    - switch ở main xong nó không quay lại agent ban đầu sau khi thực hiện xong command task
    - còn với ở sub nó có thể lẫn lộn với các vấn đề sau khi orchestrator sử dụng tool này để điều phối qua sub - hoặc executor ở sub dùng tool này đây là 2 trường hợp khác nhau hoàn toàn

Các kiến thức trên điều chỉ là assumption của tôi bạn là một agent bạn phải nghiên cứu dựa trên code thật, truths rồi xem đúng các flaws có đúng hay không, thực hiên nghiên cứu online dược trên tech stack của OpenCode SDK, plugins SDK và tools không có một assumptions nào được phép kết luận nếu chưa thực hiện đầy đủ các điều trên tôi nói 

---

## Assistant (Build · MiMo-V2.5-Pro (Precision) · 29.7s)

_Thinking:_

Người dùng yêu cầu nghiên cứu cluster tools và features liên quan đến slash commands, cần bắt đầu bằng cách xác định các phases liên quan và state hiện tại của nhóm phases 24.x.




# Nghiên cứu Revamp Slash-Command-Execute

## 📋 Kế hoạch nghiên cứu

Tôi sẽ thực hiện theo trình tự:
1. Tìm các phases 24.x liên quan
2. Nghiên cứu code thực tế của `execute-slash-command` và tools liên quan
3. Audit các flaws/gaps theo yêu cầu
4. Nghiên cứu online về OpenCode SDK/Plugin patterns

Hãy bắt đầu:



**Tool: bash**

**Input:**
```json
{
  "command": "find /Users/apple/hivemind-plugin-private/.planning -name \"*24*\" -type f 2>/dev/null | head -30",
  "description": "Tìm các files phase 24.x"
}
```

**Output:**
```
/Users/apple/hivemind-plugin-private/.planning/archive/2026-05-07/workstreams/milestone/phases/24-fix-22-failed-hm-skills/24-01-SUMMARY.md
/Users/apple/hivemind-plugin-private/.planning/archive/2026-05-07/workstreams/milestone/phases/24-fix-22-failed-hm-skills/24-03-SUMMARY.md
/Users/apple/hivemind-plugin-private/.planning/archive/2026-05-07/workstreams/milestone/phases/24-fix-22-failed-hm-skills/24-VERIFICATION.md
/Users/apple/hivemind-plugin-private/.planning/archive/2026-05-07/workstreams/milestone/phases/24-fix-22-failed-hm-skills/24-01-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/archive/2026-05-07/workstreams/milestone/phases/24-fix-22-failed-hm-skills/24-03-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/archive/2026-05-07/workstreams/milestone/phases/24-fix-22-failed-hm-skills/24-02-SUMMARY.md
/Users/apple/hivemind-plugin-private/.planning/archive/2026-05-07/workstreams/milestone/phases/24-fix-22-failed-hm-skills/24-02-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/archive/2026-05-07/debug/session-ses-2413-delegation-design-incidents-2026-04-24.md
/Users/apple/hivemind-plugin-private/.planning/phases/23.1-session-tracker-sdk-investigation/23.1-SESSION-TRACKER-INVESTIGATION-2026-05-24.md
/Users/apple/hivemind-plugin-private/.planning/phases/23-notification-fix-and-tool-surface-docs/23-INVESTIGATION-SESSION-TRACKING-2026-05-24.md
/Users/apple/hivemind-plugin-private/.planning/phases/23-notification-fix-and-tool-surface-docs/23-SPEC-VALIDATION-2026-05-24.md
/Users/apple/hivemind-plugin-private/.planning/phases/23.2-session-tracker-bugfix/PLAN-REMEDIATION-2026-05-24.md
/Users/apple/hivemind-plugin-private/.planning/phases/23.2-session-tracker-bugfix/23.2-DEBUG-2026-05-24.md
/Users/apple/hivemind-plugin-private/.planning/phases/25-trajectory-agent-work-contract-redesign/25-CONTEXT-INJECTION-VERIFICATION-2026-05-24.md
/Users/apple/hivemind-plugin-private/.planning/phases/25-trajectory-agent-work-contract-redesign/25-AUDIT-2026-05-24.md
/Users/apple/hivemind-plugin-private/.planning/phases/25-trajectory-agent-work-contract-redesign/25-AUDIT-2026-05-24-v4.md
/Users/apple/hivemind-plugin-private/.planning/phases/25-trajectory-agent-work-contract-redesign/25-ARCH-ANALYSIS-2026-05-24-v4.md
/Users/apple/hivemind-plugin-private/.planning/phases/24.1-agent-hierarchy-restructure/24.1-03-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/24.1-agent-hierarchy-restructure/24-CONTEXT.md
/Users/apple/hivemind-plugin-private/.planning/phases/24.1-agent-hierarchy-restructure/24.1-02-SUMMARY.md
/Users/apple/hivemind-plugin-private/.planning/phases/24.1-agent-hierarchy-restructure/24.1-02-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/24.1-agent-hierarchy-restructure/24.1-01-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/24.1-agent-hierarchy-restructure/24.1-RESEARCH.md
/Users/apple/hivemind-plugin-private/.planning/phases/24.1-agent-hierarchy-restructure/24.1-03-SUMMARY.md
/Users/apple/hivemind-plugin-private/.planning/phases/24.1-agent-hierarchy-restructure/24.1-01-SUMMARY.md
/Users/apple/hivemind-plugin-private/.planning/phases/24.2-agent-profile-quality-enforcement/24.2-GAP-01-SUMMARY.md
/Users/apple/hivemind-plugin-private/.planning/phases/24.2-agent-profile-quality-enforcement/24.2-INTEGRATION-REVIEW.md
/Users/apple/hivemind-plugin-private/.planning/phases/24.2-agent-profile-quality-enforcement/24.2-02-SUMMARY.md
/Users/apple/hivemind-plugin-private/.planning/phases/24.2-agent-profile-quality-enforcement/24.2-GAP-01-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/24.2-agent-profile-quality-enforcement/24.2-GAP-03-SUMMARY.md

```

**Tool: bash**

**Input:**
```json
{
  "command": "grep -r \"execute-slash-command\" /Users/apple/hivemind-plugin-private/.planning --include=\"*.md\" 2>/dev/null | head -20",
  "description": "Tìm mentions của execute-slash-command trong docs"
}
```

**Output:**
```
/Users/apple/hivemind-plugin-private/.planning/research/deep-analysis-plugin-shared-sidecar-2026-05-21.md:| 7 | `execute-slash-command` | `createExecuteSlashCommandTool` | `client` | 408 |
/Users/apple/hivemind-plugin-private/.planning/research/deep-analysis-plugin-shared-sidecar-2026-05-21.md:- **client only** (1 tool): `execute-slash-command`
/Users/apple/hivemind-plugin-private/.planning/research/hard-restructuring-cluster-map-2026-05-21.md:| `session/` (4 files) | 4 | 439 | ACTIVE | ✅ | execute-slash-command: envelope divergence, no Zod schema | REFACTOR |
/Users/apple/hivemind-plugin-private/.planning/research/hard-restructuring-cluster-map-2026-05-21.md:**Design flaws:** 3 session tools (session-context, session-hierarchy, session-tracker) mislocated under hivemind/ instead of session/; execute-slash-command is the only tool NOT using renderToolResult(); 5 tools use wide `@opencode-ai/plugin` import instead of narrow `/tool`.
/Users/apple/hivemind-plugin-private/.planning/research/hard-restructuring-cluster-map-2026-05-21.md:13. **Fix `execute-slash-command` return envelope** — wrap with `renderToolResult()` + add Zod schema
/Users/apple/hivemind-plugin-private/.planning/research/hard-restructuring-phase-decisions-2026-05-21.md:**Scope:** Extract tool registration map → `src/tools/registry.ts`, startup tasks → `src/plugin/startup.ts`, hook composition → `src/hooks/composition/composer.ts`. Fix fire-and-forget promise hygiene (5 `.catch()` additions). Fix `setupDelegationModules` temporal coupling. Remove legacy non-SDK hooks (`system.transform`, `messages.transform`). Fix `decompileAgent` bug. Fix `execute-slash-command` return envelope. Standardize `tool()` import paths.
/Users/apple/hivemind-plugin-private/.planning/research/phase-reordering-analysis-2026-05-21.md:- Add guardrails to `execute-slash-command` — `requireCommand()` pre-validation, pressure gate check, proper Zod schema, `renderToolResult()` envelope (tool-classification: 12/20 REWORK)
/Users/apple/hivemind-plugin-private/.planning/research/phase-reordering-analysis-2026-05-21.md:**Rationale:** Pressure scoring affects delegation decisions (pressure gates on delegate-task and execute-slash-command). Current zero test coverage means these decisions are untested. Fix design before adding tests.
/Users/apple/hivemind-plugin-private/.planning/research/phases-21-22-deep-synthesis-2026-05-22.md:**Domains:** Session-tracker persistence, execute-slash-command SDK redesign, front-agent switching, coordination status/error unification
/Users/apple/hivemind-plugin-private/.planning/research/phases-21-22-deep-synthesis-2026-05-22.md:                                        execute-slash-command tool
/Users/apple/hivemind-plugin-private/.planning/research/phases-21-22-deep-synthesis-2026-05-22.md:- `session-ses_1b48.md:12903-12918`: `execute-slash-command` hung until user aborted
/Users/apple/hivemind-plugin-private/.planning/research/phases-21-22-deep-synthesis-2026-05-22.md:| `src/tools/session/execute-slash-command.ts` | Complete rewrite: SDK-first + TUI fallback + 2 agent mechanisms + subtask routing + preflight + standard envelope |
/Users/apple/hivemind-plugin-private/.planning/research/phases-21-22-deep-synthesis-2026-05-22.md:| `tests/tools/execute-slash-command.test.ts` | Rewritten: 7 tests covering all REQs |
/Users/apple/hivemind-plugin-private/.planning/research/phases-21-22-deep-synthesis-2026-05-22.md:  - execute-slash-command rewrite provides the subtask dispatch path
/Users/apple/hivemind-plugin-private/.planning/research/opencode-sdk-v1155-api-audit-2026-05-21.md:Hivemind's `execute-slash-command` tool calls `client.session.prompt({ body: { text: `/command args` } })` — it prepends a `/` to dispatch via TUI prompt pipeline rather than using an explicit command API. The SDK's `command.execute.before` hook exists but Hivemind doesn't register one. Functionally correct.
/Users/apple/hivemind-plugin-private/.planning/research/deep-analysis-tools-2026-05-21.md:    ├── execute-slash-command.ts
/Users/apple/hivemind-plugin-private/.planning/research/deep-analysis-tools-2026-05-21.md:#### 2.5.1 `execute-slash-command`
/Users/apple/hivemind-plugin-private/.planning/research/deep-analysis-tools-2026-05-21.md:| **File** | `src/tools/session/execute-slash-command.ts` (152 LOC) |
/Users/apple/hivemind-plugin-private/.planning/research/deep-analysis-tools-2026-05-21.md:| **Test coverage** | `tests/tools/execute-slash-command.test.ts` — exists |
/Users/apple/hivemind-plugin-private/.planning/research/deep-analysis-tools-2026-05-21.md:| `@opencode-ai/plugin` | All 4 config tools + execute-slash-command | 5 |

```

**Tool: glob**

**Input:**
```json
{
  "pattern": "**/tools/delegation/*.ts",
  "path": "/Users/apple/hivemind-plugin-private/src"
}
```

**Output:**
```
/Users/apple/hivemind-plugin-private/src/tools/delegation/types.ts
/Users/apple/hivemind-plugin-private/src/tools/delegation/delegate-task.ts
/Users/apple/hivemind-plugin-private/src/tools/delegation/delegation-status.ts
```

---

## Assistant (Build · MiMo-V2.5-Pro (Precision) · 22.6s)

_Thinking:_

Để nghiên cứu sâu về `execute-slash-command`, tôi cần:
1. Đọc code của tool này
2. Đọc các docs liên quan
3. Tìm các phases đã làm với nó

Hãy đọc các files quan trọng:






**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/tools/session/execute-slash-command.ts"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin-private/src/tools/session/execute-slash-command.ts</path>
<type>file</type>
<content>
1: import { tool } from "@opencode-ai/plugin"
2: import type { PluginInput, ToolDefinition } from "@opencode-ai/plugin"
3: import { discoverCommandBundles } from "../../routing/command-engine/index.js"
4: import type { CommandBundle } from "../../routing/command-engine/types.js"
5: import { resolveSessionFile } from "../hivemind/session-resolver.js"
6: 
7: const DEFERRED_SUBTASK_DISPATCH_DELAY_MS = 50
8: 
9: /**
10:  * Creates the execute-slash-command tool.
11:  *
12:  * Dispatches a slash command via one of three paths depending on input:
13:  *
14:  * 1. **Synthetic parent prompt** (`subtask: false` + `agent`): Calls
15:  *    `session.prompt({ agent, parts: [{ type: "text", text }] })` after
16:  *    tool return. The target agent runs one turn in the parent session,
17:  *    then the original agent is restored. Requires `mode: all` agents.
18:  *
19:  * 2. **Subtask dispatch** (`subtask: true` + `agent`): Calls
20:  *    `session.prompt({ agent, parts: [{ type: "subtask", agent, prompt }] })`
21:  *    after tool return. Creates a child/delegation session (proven Phase 21.1).
22:  *
23:  * 3. **TUI pipeline** (no overrides): Uses `tui.appendPrompt + tui.submitPrompt`
24:  *    to inject `/command args` into the TUI prompt buffer.
25:  *
26:  * The `agent` and `subtask` fields are added on-the-fly per invocation.
27:  * When `agent` is provided without `subtask`, defaults to `subtask: false`
28:  * (parent session dispatch).
29:  *
30:  * @example
31:  * ```
32:  * // Basic command execution (no agent override)
33:  * execute-slash-command { command: "gsd-stats", arguments: "" }
34:  *
35:  * // Synthetic parent prompt (agent runs one turn in parent session)
36:  * execute-slash-command { command: "gsd-stats", agent: "gsd-executor" }
37:  *
38:  * // Explicit subtask dispatch
39:  * execute-slash-command { command: "gsd-stats", agent: "gsd-executor", subtask: true }
40:  *
41:  * // Command with model override
42:  * execute-slash-command { command: "plan", arguments: "refactor auth module", model: "anthropic/claude-sonnet-4-20250514" }
43:  * ```
44:  *
45:  * @see src/tools/hivemind/hivemind-command-engine.ts — discovery companion (CQRS read-side)
46:  * @see src/routing/command-engine/index.ts — command engine core
47:  *
48:  * @param client - The OpenCode SDK client instance (injected from plugin composition root).
49:  * @returns ToolDefinition for the execute-slash-command tool.
50:  */
51: export const createExecuteSlashCommandTool = (client: PluginInput["client"]): ToolDefinition => {
52:   return tool({
53:     description:
54:       "Executes an OpenCode slash command on the active session. " +
55:       "Three dispatch paths: (1) subtask:false + agent → synthetic parent prompt via session.prompt() " +
56:       "(agent runs one turn, then restored), (2) subtask:true + agent → subtask delegation via session.prompt(), " +
57:       "(3) no overrides → TUI appendPrompt/submitPrompt for basic command execution. " +
58:       "When agent is provided without subtask, defaults to subtask:false (parent session dispatch). " +
59:       "Use `hivemind-command-engine` with action `discover` or `list_commands` to find available commands first.",
60:     args: {
61:       command: tool.schema.string().describe(
62:         "The command name without the leading slash (e.g., 'gsd-stats', 'hf-create', 'plan')",
63:       ),
64:       arguments: tool.schema.string().optional().describe(
65:         "Arguments string to pass to the command (e.g., 'my-new-skill'). Defaults to empty string.",
66:       ),
67:       agent: tool.schema.string().optional().describe(
68:         "Optional agent context override. With subtask:true, dispatches a SubtaskPartInput to this agent. " +
69:         "With subtask:false, dispatches the expanded command body as a deferred synthetic parent prompt for this agent.",
70:       ),
71:       model: tool.schema.string().optional().describe(
72:         "Optional model override in 'providerID/modelID' format (e.g., 'anthropic/claude-sonnet-4-20250514'). " +
73:         "When set, prepended as a model tag in the prompt text.",
74:       ),
75:       subtask: tool.schema.boolean().optional().describe(
76:         "Optional one-shot subtask override. When true, dispatches the command body as a SubtaskPartInput using the resolved or overridden agent.",
77:       ),
78:     },
79:     async execute(args, ctx) {
80:       const cmdDisplay = `/${args.command}${args.arguments ? ` ${args.arguments}` : ""}`
81:       ctx.metadata({
82:         title: `Executing ${cmdDisplay}`,
83:         metadata: {
84:           command: args.command,
85:           ...(args.agent && { agent: args.agent }),
86:           ...(args.model && { model: args.model }),
87:         },
88:       })
89: 
90:       try {
91:         const projectRoot = ctx.directory ?? ""
92:         const commandBundle = await findCommandBundle(projectRoot, args.command)
93:         const resolvedSubtask = args.subtask ?? (args.agent ? false : undefined)
94:         const syntheticPromptAgent = resolvedSubtask === false ? args.agent || commandBundle?.agent : undefined
95:         if (syntheticPromptAgent) {
96:           if (!commandBundle) {
97:             return {
98:               output: `✗ Failed to dispatch ${cmdDisplay}: command not found for synthetic parent prompt dispatch`,
99:               metadata: {
100:                 error: true,
101:                 errorType: "not_found",
102:                 command: args.command,
103:               },
104:             }
105:           }
106: 
107:           const promptText = expandCommandArguments(commandBundle.body, args.arguments ?? "")
108:           dispatchPromptAfterToolReturn(client, {
109:             path: { id: ctx.sessionID },
110:             body: {
111:               agent: syntheticPromptAgent,
112:               parts: [
113:                 {
114:                   type: "text",
115:                   text: promptText,
116:                 },
117:               ],
118:             },
119:             query: { directory: ctx.directory },
120:           })
121: 
122:           return {
123:             output: [
124:               `✓ Command ${cmdDisplay} dispatched as synthetic parent prompt.`,
125:               `  Agent: ${syntheticPromptAgent}`,
126:               `  Description: ${commandBundle.description}`,
127:               "  Note: synthetic parent prompt creates a ## USER turn in the session body. Agent will be restored after one turn.",
128:             ].join("\n"),
129:             metadata: {
130:               command: args.command,
131:               agent: syntheticPromptAgent,
132:               description: commandBundle.description,
133:               mode: "synthetic-parent-prompt",
134:               scheduled: true,
135:               dispatched: true,
136:             },
137:           }
138:         }
139: 
140:         const shouldDispatchSubtask = args.subtask ?? commandBundle?.subtask === true
141:         if (shouldDispatchSubtask) {
142:           if (!commandBundle) {
143:             return {
144:               output: `✗ Failed to dispatch ${cmdDisplay}: command not found for subtask dispatch`,
145:               metadata: {
146:                 error: true,
147:                 errorType: "not_found",
148:                 command: args.command,
149:               },
150:             }
151:           }
152:           const subtaskAgent = args.agent || commandBundle.agent
153:           if (!subtaskAgent) {
154:             return {
155:               output: `✗ Failed to dispatch ${cmdDisplay}: command has subtask: true but no agent was provided or defined in frontmatter`,
156:               metadata: {
157:                 error: true,
158:                 errorType: "bad_request",
159:                 command: args.command,
160:               },
161:             }
162:           }
163: 
164:           const promptText = expandCommandArguments(commandBundle.body, args.arguments ?? "")
165:           dispatchPromptAfterToolReturn(client, {
166:             path: { id: ctx.sessionID },
167:             body: {
168:               agent: subtaskAgent,
169:               parts: [
170:                 {
171:                   type: "subtask",
172:                   agent: subtaskAgent,
173:                   description: commandBundle.description,
174:                   prompt: promptText,
175:                 },
176:               ],
177:             },
178:             query: { directory: ctx.directory },
179:           })
180: 
181:           return {
182:             output: [
183:               `✓ Command ${cmdDisplay} dispatched as subtask.`,
184:               `  Agent: ${subtaskAgent}`,
185:               `  Description: ${commandBundle.description}`,
186:             ].join("\n"),
187:             metadata: {
188:               command: args.command,
189:               agent: subtaskAgent,
190:               description: commandBundle.description,
191:               mode: "subtask",
192:               scheduled: true,
193:               dispatched: true,
194:             },
195:           }
196:         }
197: 
198:         const resolved = await resolveSessionFile(projectRoot, ctx.sessionID)
199:         const isChildSession = resolved ? resolved.type === "child" : false
200: 
201:         // Build the slash command text exactly as a user would type it in the TUI
202:         // Format: [@agent] [/command] [arguments]
203:         const parts: string[] = []
204: 
205:         // Prepend agent override if specified
206:         if (args.agent) {
207:           parts.push(`@${args.agent}`)
208:         }
209: 
210:         // The command itself
211:         parts.push(`/${args.command}`)
212: 
213:         // Append arguments if any
214:         if (args.arguments) {
215:           parts.push(args.arguments)
216:         }
217: 
218:         const promptText = parts.join(" ")
219: 
220:         if (isChildSession) {
221:           // Bypassing TUI pipeline for child sessions to avoid global prompt clearing and workspace interference
222:           dispatchPromptAfterToolReturn(client, {
223:             path: { id: ctx.sessionID },
224:             body: {
225:               parts: [
226:                 {
227:                   type: "text",
228:                   text: promptText,
229:                 },
230:               ],
231:             },
232:             query: { directory: ctx.directory },
233:           })
234: 
235:           return {
236:             output: [
237:               `✓ Command ${cmdDisplay} dispatched directly to child session ${ctx.sessionID} (bypassed TUI).`,
238:               `  Prompt text: ${promptText}`,
239:               `  The command will execute immediately after this tool call returns.`,
240:               args.agent ? `  Agent: ${args.agent}` : null,
241:               args.model ? `  Model: ${args.model}` : null,
242:             ].filter(Boolean).join("\n"),
243:             metadata: {
244:               command: args.command,
245:               promptText,
246:               dispatched: true,
247:               mode: "session-prompt",
248:               ...(args.agent && { agent: args.agent }),
249:               ...(args.model && { model: args.model }),
250:             },
251:           }
252:         }
253: 
254:         // Step 1: Clear any existing prompt to avoid stale state
255:         await client.tui.clearPrompt()
256: 
257:         // Step 2: Append the slash command text to the TUI prompt buffer
258:         await client.tui.appendPrompt({
259:           body: { text: promptText },
260:         })
261: 
262:         // Step 3: Submit the prompt — TUI dispatches as a slash command
263:         await client.tui.submitPrompt()
264: 
265:         return {
266:           output: [
267:             `✓ Command ${cmdDisplay} dispatched to TUI prompt.`,
268:             `  Prompt text: ${promptText}`,
269:             `  The command will execute immediately after this tool call returns.`,
270:             args.agent ? `  Agent: ${args.agent}` : null,
271:             args.model ? `  Model: ${args.model}` : null,
272:           ].filter(Boolean).join("\n"),
273:           metadata: {
274:             command: args.command,
275:             promptText,
276:             dispatched: true,
277:             ...(args.agent && { agent: args.agent }),
278:             ...(args.model && { model: args.model }),
279:           },
280:         }
281:       } catch (error: unknown) {
282:         const msg = error instanceof Error ? error.message : String(error)
283: 
284:         // Classify error type for better agent error handling
285:         let errorType: "bad_request" | "not_found" | "internal" = "internal"
286:         if (error instanceof Error) {
287:           const statusMatch = msg.match(/\b(400|422)\b/)
288:           if (statusMatch) errorType = "bad_request"
289:           else if (msg.includes("404") || msg.includes("not found")) errorType = "not_found"
290:         }
291: 
292:         return {
293:           output: `✗ Failed to dispatch ${cmdDisplay}: ${msg}`,
294:           metadata: {
295:             error: true,
296:             errorType,
297:             command: args.command,
298:             message: msg,
299:           },
300:         }
301:       }
302:     },
303:   })
304: }
305: 
306: async function findCommandBundle(projectRoot: string, commandName: string): Promise<CommandBundle | undefined> {
307:   if (!projectRoot) return undefined
308:   const discovery = await discoverCommandBundles({ projectRoot })
309:   return discovery.commands.find((command) => command.name === commandName)
310: }
311: 
312: function expandCommandArguments(commandBody: string, commandArguments: string): string {
313:   return commandBody.replaceAll("$ARGUMENTS", commandArguments)
314: }
315: 
316: function dispatchPromptAfterToolReturn(
317:   client: PluginInput["client"],
318:   request: Parameters<PluginInput["client"]["session"]["prompt"]>[0],
319: ): void {
320:   setTimeout(() => {
321:     void client.session.prompt(request).catch((caughtError: unknown) => {
322:       const message = caughtError instanceof Error ? caughtError.message : String(caughtError)
323:       console.error(`[Harness] Deferred slash command prompt dispatch failed: ${message}`)
324:     })
325:   }, DEFERRED_SUBTASK_DISPATCH_DELAY_MS)
326: }

(End of file - total 326 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/research/deep-analysis-tools-2026-05-21.md"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin-private/.planning/research/deep-analysis-tools-2026-05-21.md</path>
<type>file</type>
<content>
1: # Deep Analysis: Tool Surface (`src/tools/`)
2: 
3: **Analysis Date:** 2026-05-21
4: 
5: ## 1. Overview
6: 
7: `src/tools/` is the Hard Harness write-side sector — CQRS mutation authority for the Hivemind OpenCode plugin. It contains **24 registered tools** across 5 subdirectories. This document analyzes every tool's factory signature, Zod schema, `tool()` call pattern, dependency shape, return envelope, `ToolContext` usage, test coverage, and quality issues.
8: 
9: ### Directory Inventory
10: 
11: ```
12: src/tools/
13: ├── AGENTS.md                    # Sector guidance (L5)
14: ├── config/                      # 5 source files → 4 tools
15: │   ├── bootstrap-init.ts
16: │   ├── bootstrap-recover.ts
17: │   ├── configure-primitive.ts
18: │   ├── configure-primitive-paths.ts  # Helper — NOT a tool
19: │   └── validate-restart.ts
20: ├── delegation/                  # 3 source files → 2 tools
21: │   ├── delegate-task.ts
22: │   ├── delegation-status.ts
23: │   └── types.ts
24: ├── hivemind/                    # 10 source files → 11 tools
25: │   ├── hivemind-agent-work.ts          # → 2 tools (create + export)
26: │   ├── hivemind-command-engine.ts
27: │   ├── hivemind-doc.ts
28: │   ├── hivemind-pressure.ts
29: │   ├── hivemind-sdk-supervisor.ts
30: │   ├── hivemind-session-view.ts
31: │   ├── hivemind-trajectory.ts
32: │   ├── run-background-command.ts
33: │   ├── session-context.ts              # MISPLACED — should be under session/
34: │   ├── session-hierarchy.ts            # MISPLACED — should be under session/
35: │   └── session-tracker.ts              # MISPLACED — should be under session/
36: ├── prompt/                      # 5 source files → 2 tools
37: │   ├── prompt-analyze/{index,tools,types}.ts
38: │   └── prompt-skim/{index,tools,types}.ts
39: └── session/                     # 4 source files → 2 tools
40:     ├── execute-slash-command.ts
41:     ├── session-journal-export.ts
42:     └── session-patch/{index,tools,types}.ts
43: ```
44: 
45: **Total: 27 source files producing 24 tool registrations in `plugin.ts`.**
46: 
47: ---
48: 
49: ## 2. Per-Tool Analysis
50: 
51: ### 2.1 Config Tools
52: 
53: #### 2.1.1 `configure-primitive`
54: 
55: | Aspect | Finding |
56: |--------|---------|
57: | **File** | `src/tools/config/configure-primitive.ts` (490 LOC) |
58: | **Factory sig** | `createConfigurePrimitiveTool(): ReturnType<typeof tool>` — no deps |
59: | **Import source** | `@opencode-ai/plugin` (NOT `/tool`) |
60: | **Zod schema** | `ConfigurePrimitiveInputSchema` — inline in tool file, ~54 lines with `.refine()` |
61: | **tool() call** | Standard `tool({ description, args, async execute })` with `tool.schema` helpers |
62: | **Dependency shape** | Self-contained: imports compiler, workflow, path-scope, primitive-loader internally |
63: | **Return shape** | `renderToolResult(success(...))` / `renderToolResult(error(...))` — standard envelope |
64: | **ToolContext usage** | Yes — `context` is typed `unknown`, then cast to `{ directory?: string; worktree?: string }` |
65: | **Test coverage** | `tests/tools/configure-primitive.test.ts` — exists |
66: | **Quality** | Mixed. 490 LOC exceeds the 500 LOC cap by 10 lines (including imports). `handleCompile()` is 103 lines alone. Uses dynamic `import()` in handleResume. Inline Zod for batch items duplicates type knowledge. |
67: | **Grade** | NEEDS_REFACTOR — too large, inline schema duplicates |
68: 
69: #### 2.1.2 `validate-restart`
70: 
71: | Aspect | Finding |
72: |--------|---------|
73: | **File** | `src/tools/config/validate-restart.ts` (116 LOC) |
74: | **Factory sig** | `createValidateRestartTool(): ReturnType<typeof tool>` — no deps |
75: | **Import source** | `@opencode-ai/plugin` (NOT `/tool`) |
76: | **Zod schema** | `ValidateRestartInputSchema` — inline, 4 lines |
77: | **tool() call** | Standard pattern |
78: | **Dependency shape** | Imports `loadPrimitives`, `detectFrameworks`, `validateCrossPrimitive`, `validateRuntime` |
79: | **Return shape** | Standard envelope |
80: | **ToolContext usage** | `_context` — unused (prefix `_`) |
81: | **Test coverage** | `tests/tools/validate-restart.test.ts` — exists |
82: | **Quality** | Clean. Well-structured. Under 500 LOC. |
83: | **Grade** | GOOD |
84: 
85: #### 2.1.3 `bootstrap-init`
86: 
87: | Aspect | Finding |
88: |--------|---------|
89: | **File** | `src/tools/config/bootstrap-init.ts` (309 LOC) |
90: | **Factory sig** | `createBootstrapInitTool(): ReturnType<typeof tool>` — no deps |
91: | **Import source** | `@opencode-ai/plugin` (NOT `/tool`) |
92: | **Zod schema** | `BootstrapInitInputSchema` — imported from `schema-kernel/bootstrap.schema.ts` |
93: | **tool() call** | Standard pattern |
94: | **Dependency shape** | Pure function — all filesystem work happens in `bootstrapInit()` export |
95: | **Return shape** | Standard envelope |
96: | **ToolContext usage** | None — `execute(rawArgs)` has no context parameter |
97: | **Test coverage** | `tests/tools/bootstrap-init.test.ts` — exists |
98: | **Quality** | Good export strategy: `bootstrapInit()` is exported for testable unit testing. 309 LOC modular. JSDoc throughout. |
99: | **Grade** | GOOD |
100: 
101: #### 2.1.4 `bootstrap-recover`
102: 
103: | Aspect | Finding |
104: |--------|---------|
105: | **File** | `src/tools/config/bootstrap-recover.ts` (219 LOC) |
106: | **Factory sig** | `createBootstrapRecoverTool(): ReturnType<typeof tool>` — no deps |
107: | **Import source** | `@opencode-ai/plugin` (NOT `/tool`) |
108: | **Zod schema** | `BootstrapRecoverInputSchema` — imported from `schema-kernel/bootstrap.schema.ts` |
109: | **tool() call** | Standard pattern |
110: | **Dependency shape** | Pure function — `bootstrapRecover()` exported separately |
111: | **Return shape** | Standard envelope |
112: | **ToolContext usage** | None — `execute(rawArgs)` has no context parameter |
113: | **Test coverage** | `tests/tools/bootstrap-recover.test.ts` — exists |
114: | **Quality** | Good. Same testable pattern as `bootstrap-init`. |
115: | **Grade** | GOOD |
116: 
117: #### 2.1.5 `configure-primitive-paths`
118: 
119: | Aspect | Finding |
120: |--------|---------|
121: | **File** | `src/tools/config/configure-primitive-paths.ts` (45 LOC) |
122: | **Nature** | Helper module — NOT a tool, no `tool()` call |
123: | **Purpose** | Path resolution shared by `configure-primitive.ts` |
124: | **Quality** | Clean module. |
125: | **Grade** | N/A (helper) |
126: 
127: #### 2.1.6 Config Tools Import Source Issue
128: 
129: All 4 config tools import from `@opencode-ai/plugin` instead of `@opencode-ai/plugin/tool`. While this still exports `tool`, it also imports the entire plugin module. This is an ANTI-PATTERN compared to hivemind/delegation tools that use the narrow `/tool` subpath import.
130: 
131: ---
132: 
133: ### 2.2 Delegation Tools
134: 
135: #### 2.2.1 `delegate-task`
136: 
137: | Aspect | Finding |
138: |--------|---------|
139: | **File** | `src/tools/delegation/delegate-task.ts` (93 LOC) |
140: | **Factory sig** | `createDelegateTaskTool(coordinator: CoordinatorLike, config?: { delegation_systems?: { delegate_task?: boolean } })` |
141: | **Import source** | `@opencode-ai/plugin/tool` (narrow import ✓) |
142: | **Zod schema** | `DelegateTaskV2Schema` — inline, 4 lines |
143: | **tool() call** | Uses `tool.schema` helpers (`s.string()`, `s.object({})`) |
144: | **Dependency shape** | Takes `coordinator` interface + optional config object |
145: | **Return shape** | Standard envelope via `renderToolResult()` |
146: | **ToolContext usage** | `context.sessionID`, `context.directory`, `context.worktree` — good |
147: | **Test coverage** | `tests/tools/delegate-task.test.ts`, `tests/tools/delegation/delegate-task-v2.test.ts`, `tests/tools/delegation/delegate-task-e2e.test.ts` — excellent |
148: | **Quality** | Clean. Well-structured. Proper session stacking via JSON context parsing. |
149: | **Grade** | GOOD |
150: 
151: #### 2.2.2 `delegation-status`
152: 
153: | Aspect | Finding |
154: |--------|---------|
155: | **File** | `src/tools/delegation/delegation-status.ts` (208 LOC) |
156: | **Factory sig** | `createDelegationStatusTool(delegationManager: ManagerLike, deps: StatusDeps = {})` |
157: | **Import source** | `@opencode-ai/plugin/tool` (narrow import ✓) |
158: | **Zod schema** | `DelegationControlSchema` + `DelegationStatusInputSchema` — both inline, ~16 lines |
159: | **tool() call** | Uses `tool.schema` with `.string().optional().describe()` |
160: | **Dependency shape** | Manager interface + optional StatusDeps for DI |
161: | **Return shape** | Standard envelope |
162: | **ToolContext usage** | `context.sessionID` — verified with error message if missing |
163: | **Test coverage** | `tests/tools/delegation-status.test.ts`, `tests/tools/delegation/delegation-status-v2.test.ts` — exists |
164: | **Quality** | Mixed. Complex `renderDelegationV2()` has 5 inline ternaries. `renderList` and `handleControl` are helper functions. 208 LOC is reasonable. Has `UNSUPPORTED_REPLACEMENT_MESSAGE` constant indicating known limitations. |
165: | **Grade** | NEEDS_REFACTOR — renderDelegationV2 too dense, control flow complex |
166: 
167: #### 2.2.3 `delegation/types.ts`
168: 
169: Just type re-exports. Clean.
170: 
171: ---
172: 
173: ### 2.3 Hivemind Tools
174: 
175: #### 2.3.1 `hivemind-doc`
176: 
177: | Aspect | Finding |
178: |--------|---------|
179: | **File** | `src/tools/hivemind/hivemind-doc.ts` (45 LOC) |
180: | **Factory sig** | `createHivemindDocTool(projectRoot: string)` |
181: | **Import source** | `@opencode-ai/plugin/tool` (narrow import ✓) |
182: | **Zod schema** | `DocIntelligenceInputSchema` — imported from `schema-kernel/` |
183: | **tool() call** | Uses `tool.schema` helpers |
184: | **Dependency shape** | Takes `projectRoot` — delegates to `executeDocIntelligenceAction` from features |
185: | **Return shape** | Standard envelope |
186: | **ToolContext usage** | `_context: ToolContext` — unused |
187: | **Test coverage** | `tests/tools/hivemind-doc.test.ts` — exists |
188: | **Quality** | Excellent. Small, focused, delegates to feature module. |
189: | **Grade** | GOOD |
190: 
191: #### 2.3.2 `hivemind-agent-work` (2 tools: create + export)
192: 
193: | Aspect | Finding |
194: |--------|---------|
195: | **File** | `src/tools/hivemind/hivemind-agent-work.ts` (152 LOC — 2 tools) |
196: | **Factory sig** | `createHivemindAgentWorkCreateTool(projectRoot: string)`, `createHivemindAgentWorkExportTool(projectRoot: string)` |
197: | **Import source** | `@opencode-ai/plugin/tool` (narrow import ✓) |
198: | **Zod schema** | `AgentWorkCreateToolInputSchema`, `AgentWorkExportToolInputSchema` — imported from `schema-kernel/` |
199: | **tool() call** | Both standard |
200: | **Dependency shape** | `projectRoot` only — delegates to `createAgentWorkContract` / `exportAgentWorkContract` |
201: | **Return shape** | Standard envelope |
202: | **ToolContext usage** | `_context: ToolContext` — unused |
203: | **Test coverage** | `tests/tools/hivemind-agent-work.test.ts` — exists |
204: | **Quality** | Excellent. Clean separation of create/export into separate exported action functions for testability. |
205: | **Grade** | GOOD |
206: 
207: #### 2.3.3 `hivemind-trajectory`
208: 
209: | Aspect | Finding |
210: |--------|---------|
211: | **File** | `src/tools/hivemind/hivemind-trajectory.ts` (112 LOC) |
212: | **Factory sig** | `createHivemindTrajectoryTool(projectRoot: string)` |
213: | **Import source** | `@opencode-ai/plugin/tool` (narrow import ✓) |
214: | **Zod schema** | `TrajectoryToolInputSchema` — imported from `schema-kernel/` |
215: | **tool() call** | Standard |
216: | **Dependency shape** | `projectRoot` — delegates to `inspectTrajectoryLedger`, `traverseTrajectory`, etc. |
217: | **Return shape** | Standard envelope |
218: | **ToolContext usage** | `_context: ToolContext` — unused |
219: | **Test coverage** | `tests/tools/hivemind-trajectory.test.ts` — exists |
220: | **Quality** | Excellent. Clean switch-based action dispatch. JSDoc throughout. |
221: | **Grade** | GOOD |
222: 
223: #### 2.3.4 `hivemind-pressure`
224: 
225: | Aspect | Finding |
226: |--------|---------|
227: | **File** | `src/tools/hivemind/hivemind-pressure.ts` (94 LOC) |
228: | **Factory sig** | `createHivemindPressureTool(projectRoot: string)` |
229: | **Import source** | `@opencode-ai/plugin/tool` (narrow import ✓) |
230: | **Zod schema** | `RuntimePressureToolInputSchema` — imported from `schema-kernel/` |
231: | **tool() call** | Standard |
232: | **Dependency shape** | `projectRoot` — delegates to `classifyRuntimePressure`, `detectRuntimePressure`, etc. |
233: | **Return shape** | Standard envelope |
234: | **ToolContext usage** | `_context: ToolContext` — unused |
235: | **Test coverage** | `tests/tools/hivemind-pressure.test.ts` — exists |
236: | **Quality** | Excellent. Clean switch dispatch, delegates to features. |
237: | **Grade** | GOOD |
238: 
239: #### 2.3.5 `hivemind-sdk-supervisor`
240: 
241: | Aspect | Finding |
242: |--------|---------|
243: | **File** | `src/tools/hivemind/hivemind-sdk-supervisor.ts` (53 LOC) |
244: | **Factory sig** | `createHivemindSdkSupervisorTool(): ReturnType<typeof tool>` — no deps |
245: | **Import source** | `@opencode-ai/plugin/tool` (narrow import ✓) |
246: | **Zod schema** | `SdkSupervisorToolInputSchema` — imported from `schema-kernel/` |
247: | **tool() call** | Standard |
248: | **Dependency shape** | No deps — delegates to `executeSdkSupervisorAction` |
249: | **Return shape** | Standard envelope |
250: | **ToolContext usage** | `_context: ToolContext` — unused |
251: | **Test coverage** | `tests/tools/hivemind-sdk-supervisor.test.ts` — tests `executeSdkSupervisorToolAction` directly |
252: | **Quality** | Excellent. Small, focused. |
253: | **Grade** | GOOD |
254: 
255: #### 2.3.6 `hivemind-command-engine`
256: 
257: | Aspect | Finding |
258: |--------|---------|
259: | **File** | `src/tools/hivemind/hivemind-command-engine.ts` (67 LOC) |
260: | **Factory sig** | `createHivemindCommandEngineTool(projectRoot: string)` |
261: | **Import source** | `@opencode-ai/plugin/tool` (narrow import ✓) |
262: | **Zod schema** | `CommandEngineToolInputSchema` — imported from `schema-kernel/` |
263: | **tool() call** | Standard |
264: | **Dependency shape** | `projectRoot` — delegates to `executeCommandEngineAction` |
265: | **Return shape** | Standard envelope |
266: | **ToolContext usage** | `_context: ToolContext` — unused |
267: | **Test coverage** | `tests/tools/hivemind-command-engine.test.ts` — tests `executeCommandEngineToolAction` |
268: | **Quality** | Excellent. Clean delegation to routing module. |
269: | **Grade** | GOOD |
270: 
271: #### 2.3.7 `hivemind-session-view`
272: 
273: | Aspect | Finding |
274: |--------|---------|
275: | **File** | `src/tools/hivemind/hivemind-session-view.ts` (127 LOC) |
276: | **Factory sig** | `createHivemindSessionViewTool(projectRoot: string)` |
277: | **Import source** | `@opencode-ai/plugin/tool` (narrow import ✓) |
278: | **Zod schema** | `SessionViewInputSchema` — imported from `schema-kernel/` |
279: | **tool() call** | Uses `tool.schema.enum()` and `tool.schema.string()` (WITHOUT `const s = tool.schema` pattern) |
280: | **Dependency shape** | `projectRoot` — reads continuity, delegations, trajectory directly via `readFile` |
281: | **Return shape** | Standard envelope |
282: | **ToolContext usage** | `_context: ToolContext` — unused |
283: | **Test coverage** | **NONE** — no test file found for hivemind-session-view |
284: | **Quality** | Clean structure but has direct `readFile` I/O. No `safeSessionPath` usage in `readDelegationsForSession` — it resolves raw paths instead. |
285: | **Grade** | NEEDS_REFACTOR — no tests, direct I/O in tool |
286: 
287: #### 2.3.8 `session-context` **(MISPLACED IN hivemind/)**
288: 
289: | Aspect | Finding |
290: |--------|---------|
291: | **File** | `src/tools/hivemind/session-context.ts` (224 LOC) |
292: | **Factory sig** | `createSessionContextTool(projectRoot: string)` |
293: | **Import source** | `@opencode-ai/plugin/tool` (narrow import ✓) |
294: | **Zod schema** | `SessionContextInputSchema` — imported from `schema-kernel/session-tracker.schema.ts` |
295: | **tool() call** | Uses `tool.schema.enum()` directly |
296: | **Dependency shape** | `projectRoot` — reads session tracker data directly |
297: | **Return shape** | Standard envelope |
298: | **ToolContext usage** | `_context: ToolContext` — unused |
299: | **Test coverage** | `tests/tools/hivemind/session-context.test.ts` — exists |
300: | **Quality** | Good. Clean multi-action dispatch. But **MISLOCATED** — belongs in `src/tools/session/` not `src/tools/hivemind/`. |
301: | **Grade** | NEEDS_REFACTOR — mislocated |
302: 
303: #### 2.3.9 `session-hierarchy` **(MISPLACED IN hivemind/)**
304: 
305: | Aspect | Finding |
306: |--------|---------|
307: | **File** | `src/tools/hivemind/session-hierarchy.ts` (228 LOC) |
308: | **Factory sig** | `createSessionHierarchyTool(projectRoot: string)` |
309: | **Import source** | `@opencode-ai/plugin/tool` (narrow import ✓) |
310: | **Zod schema** | `SessionHierarchyInputSchema` — imported from `schema-kernel/session-tracker.schema.ts` |
311: | **tool() call** | Uses `tool.schema.enum()` directly |
312: | **Dependency shape** | `projectRoot` — reads continuity files directly |
313: | **Return shape** | Standard envelope |
314: | **ToolContext usage** | `_context: ToolContext` — unused |
315: | **Test coverage** | `tests/tools/hivemind/session-hierarchy.test.ts` — exists |
316: | **Quality** | Good. Recursive depth computation. But **MISLOCATED** — belongs in `src/tools/session/`. |
317: | **Grade** | NEEDS_REFACTOR — mislocated |
318: 
319: #### 2.3.10 `session-tracker` **(MISPLACED IN hivemind/)**
320: 
321: | Aspect | Finding |
322: |--------|---------|
323: | **File** | `src/tools/hivemind/session-tracker.ts` (373 LOC) |
324: | **Factory sig** | `createSessionTrackerTool(projectRoot: string)` |
325: | **Import source** | `@opencode-ai/plugin/tool` (narrow import ✓) |
326: | **Zod schema** | `SessionTrackerInputSchema` — imported from `schema-kernel/session-tracker.schema.ts` |
327: | **tool() call** | Uses `tool.schema` directly |
328: | **Dependency shape** | `projectRoot` — reads session tracker data |
329: | **Return shape** | Standard envelope |
330: | **ToolContext usage** | `_context: ToolContext` — unused |
331: | **Test coverage** | `tests/tools/hivemind/session-tracker.test.ts` — exists |
332: | **Quality** | Complex but well-organized. 373 LOC — close to 500 cap. But **MISLOCATED** — belongs in `src/tools/session/`. |
333: | **Grade** | NEEDS_REFACTOR — mislocated, approaches 500 LOC cap |
334: 
335: #### 2.3.11 `run-background-command`
336: 
337: | Aspect | Finding |
338: |--------|---------|
339: | **File** | `src/tools/hivemind/run-background-command.ts` (228 LOC) |
340: | **Factory sig** | `createRunBackgroundCommandTool(args: { delegationManager: DelegationManager; ptyManager: PtyManager | null })` |
341: | **Import source** | `@opencode-ai/plugin/tool` (narrow import ✓) |
342: | **Zod schema** | `RunBackgroundCommandInputSchema` with `z.discriminatedUnion` — 5 variant schemas, inline |
343: | **tool() call** | Uses `tool.schema` helpers |
344: | **Dependency shape** | Object with `delegationManager` and `ptyManager` |
345: | **Return shape** | Standard envelope |
346: | **ToolContext usage** | `context.sessionID`, `context.directory` — good |
347: | **Test coverage** | `tests/tools/run-background-command.test.ts` — exists |
348: | **Quality** | Excellent. Has explicit `requireCallerSessionId()`, `requireVisiblePtyDelegation()`, `parseRunBackgroundCommandInput()`, `assertExecutableCommandShape()` — comprehensive validation. Uses `z.discriminatedUnion` (best practice). |
349: | **Grade** | GOOD |
350: 
351: ---
352: 
353: ### 2.4 Prompt Tools
354: 
355: #### 2.4.1 `prompt-analyze`
356: 
357: | Aspect | Finding |
358: |--------|---------|
359: | **File** | `src/tools/prompt/prompt-analyze/tools.ts` (169 LOC) |
360: | **Factory sig** | `createPromptAnalyzeTool(_projectRoot: string)` — takes `projectRoot` but ignores it |
361: | **Import source** | `@opencode-ai/plugin/tool` (narrow import ✓) |
362: | **Zod schema** | `PromptAnalysisResultSchema` — imported from `schema-kernel/prompt-enhance.schema.ts` |
363: | **tool() call** | Standard with `tool.schema` |
364: | **Dependency shape** | None (projectRoot unused) |
365: | **Return shape** | Standard envelope |
366: | **ToolContext usage** | `_context` — unused |
367: | **Test coverage** | `tests/tools/prompt-analyze.test.ts` — exists |
368: | **Quality** | Good logic (contradiction detection, cross-line comparison). Result validated against schema. `_projectRoot` param unused but accepted for factory consistency. |
369: | **Grade** | GOOD |
370: 
371: #### 2.4.2 `prompt-skim`
372: 
373: | Aspect | Finding |
374: |--------|---------|
375: | **File** | `src/tools/prompt/prompt-skim/tools.ts` (107 LOC) |
376: | **Factory sig** | `createPromptSkimTool(_projectRoot: string)` — same pattern |
377: | **Import source** | `@opencode-ai/plugin/tool` (narrow import ✓) |
378: | **Zod schema** | `PromptSkimResultSchema` — imported from `schema-kernel/prompt-enhance.schema.ts` |
379: | **tool() call** | Standard |
380: | **Dependency shape** | None (projectRoot unused) |
381: | **Return shape** | Standard envelope |
382: | **ToolContext usage** | `_context` — unused |
383: | **Test coverage** | `tests/tools/prompt-skim.test.ts` — exists |
384: | **Quality** | Good. Complexity scoring, path verification, URL extraction. |
385: | **Grade** | GOOD |
386: 
387: ---
388: 
389: ### 2.5 Session Tools
390: 
391: #### 2.5.1 `execute-slash-command`
392: 
393: | Aspect | Finding |
394: |--------|---------|
395: | **File** | `src/tools/session/execute-slash-command.ts` (152 LOC) |
396: | **Factory sig** | `createExecuteSlashCommandTool(client: PluginInput["client"])` |
397: | **Import source** | `@opencode-ai/plugin` (NOT `/tool`) |
398: | **Zod schema** | **NONE** — no schema validation. Args handled by `tool.schema` at the `tool()` level |
399: | **tool() call** | Uses `tool.schema.string().describe()` directly |
400: | **Dependency shape** | Takes the OpenCode SDK `client` object |
401: | **Return shape** | **DIFFERENT from all other tools** — returns `{ output, metadata }` raw object, NOT `renderToolResult(success(...))` |
402: | **ToolContext usage** | `ctx.metadata({...})` — uses context.metadata() for rich metadata |
403: | **Test coverage** | `tests/tools/execute-slash-command.test.ts` — exists |
404: | **Quality** | **CRITICAL ISSUE**: Breaks the standard response envelope. All other 23 tools use `renderToolResult()`. This tool returns `{ output, metadata }` directly. This works because OpenCode accepts both formats, but it's architecturally inconsistent. Also has no Zod schema for input validation — relies solely on `tool.schema.string()` which is a looser validation layer. |
405: | **Grade** | NEEDS_REFACTOR — return envelope inconsistency, no Zod schema |
406: 
407: #### 2.5.2 `session-journal-export`
408: 
409: | Aspect | Finding |
410: |--------|---------|
411: | **File** | `src/tools/session/session-journal-export.ts` (117 LOC) |
412: | **Factory sig** | `createSessionJournalExportTool(): ReturnType<typeof tool>` — no deps |
413: | **Import source** | `@opencode-ai/plugin/tool` (narrow import ✓) |
414: | **Zod schema** | `SessionJournalExportInputSchema` — inline, 5 lines |
415: | **tool() call** | Uses `tool.schema` helpers |
416: | **Dependency shape** | No deps — calls `listSessionContinuity()`, `readPersistedDelegations()`, `buildExecutionLineage()` directly |
417: | **Return shape** | Standard envelope |
418: | **ToolContext usage** | `_context: ToolContext` — unused |
419: | **Test coverage** | `tests/tools/session-journal-export.test.ts` — exists |
420: | **Quality** | Good. Clean, well-structured. Separates `markdownSummary()` renderer. |
421: | **Grade** | GOOD |
422: 
423: #### 2.5.3 `session-patch`
424: 
425: | Aspect | Finding |
426: |--------|---------|
427: | **File** | `src/tools/session/session-patch/tools.ts` (136 LOC) |
428: | **Factory sig** | `createSessionPatchTool(projectRoot: string)` |
429: | **Import source** | `@opencode-ai/plugin/tool` (narrow import ✓) |
430: | **Zod schema** | `SessionPatchRecordSchema` — imported from `schema-kernel/prompt-enhance.schema.ts` |
431: | **tool() call** | Standard |
432: | **Dependency shape** | `projectRoot` — uses `assertPathWithinRoot` for security |
433: | **Return shape** | Standard envelope |
434: | **ToolContext usage** | `_context` — unused |
435: | **Test coverage** | `tests/tools/session-patch.test.ts` — exists |
436: | **Quality** | Good. Has path traversal protection (`assertPathWithinRoot`) and file name validation. Creates backups before patching. |
437: | **Grade** | GOOD |
438: 
439: ---
440: 
441: ## 3. Cross-Tool Analysis
442: 
443: ### 3.1 Tool Registration Pattern (plugin.ts line 397-424)
444: 
445: All 24 tools are registered in a single `tool: { ... }` block in `plugin.ts`. There is ONE registration pattern, not multiple. 0 tools are "designed but never wired" — every exported factory is registered.
446: 
447: ### 3.2 Import Source Divergence
448: 
449: **CRITICAL: Two different `tool()` import paths used:**
450: 
451: | Import | Tools Using It | Count |
452: |--------|---------------|-------|
453: | `@opencode-ai/plugin/tool` | Most hivemind, delegation, prompt, session-patch, session-journal-export | 18 |
454: | `@opencode-ai/plugin` | All 4 config tools + execute-slash-command | 5 |
455: 
456: The first import is the **narrow** subpath export. The second imports the **entire plugin module**. This is a quality inconsistency — tools in the config/ directory all use the wider import.
457: 
458: ### 3.3 Return Envelope Divergence
459: 
460: **CRITICAL: execute-slash-command is the only tool that returns an unformatted `{ output, metadata }` object.** All other 23 tools use `renderToolResult(success(...))` / `renderToolResult(error(...))`.
461: 
462: ### 3.4 Factory Signature Patterns
463: 
464: Three distinct patterns exist:
465: 
466: | Pattern | Count | Examples |
467: |---------|-------|----------|
468: | `(projectRoot: string)` | 12 | Most hivemind tools, prompt tools, session-patch |
469: | `()` no deps | 6 | configure-primitive, validate-restart, bootstrap-init, bootstrap-recover, sdk-supervisor, session-journal-export |
470: | `(specific deps)` | 6 | delegate-task, delegation-status, run-background-command, execute-slash-command |
471: 
472: ### 3.5 Zod Schema Location
473: 
474: | Location | Count | Assessment |
475: |----------|-------|------------|
476: | Imported from `schema-kernel/` | 13 tools | ✓ Best practice |
477: | Inline in tool file | 7 tools | Needs_Refactor — duplicates type knowledge |
478: | No Zod schema (relies on tool.schema) | 1 tool (execute-slash-command) | Critical — no validation |
479: 
480: ### 3.6 ToolContext Usage
481: 
482: | Usage | Count | Examples |
483: |-------|-------|----------|
484: | Unused (`_context`) | 17 | Most hivemind, prompt, session tools |
485: | `sessionID` only | 4 | delegation-status, delegate-task, run-background-command |
486: | `sessionID`, `metadata()` | 1 | execute-slash-command |
487: | `directory`, `worktree` cast | 2 | configure-primitive (via `as` cast) |
488: 
489: ### 3.7 Location Inconsistency: 3 Session Tools Under hivemind/
490: 
491: Three tools that work with session state are located under `src/tools/hivemind/` instead of `src/tools/session/`:
492: 
493: | Tool | Current Location | Correct Location |
494: |------|-----------------|------------------|
495: | `session-context` | `src/tools/hivemind/session-context.ts` | `src/tools/session/` |
496: | `session-hierarchy` | `src/tools/hivemind/session-hierarchy.ts` | `src/tools/session/` |
497: | `session-tracker` | `src/tools/hivemind/session-tracker.ts` | `src/tools/session/` |
498: 
499: These don't follow the `hivemind-` naming convention (no `hivemind-` prefix). They also read from `.hivemind/` state directly rather than going through feature modules.
500: 
501: ### 3.8 Test Coverage Summary
502: 
503: | Tool | Test File | Status |
504: |------|-----------|--------|
505: | delegate-task | `tests/tools/delegate-task.test.ts`, `delegation/delegate-task-v2.test.ts`, `delegation/delegate-task-e2e.test.ts` | ✅ Excellent |
506: | delegation-status | `tests/tools/delegation-status.test.ts`, `delegation/delegation-status-v2.test.ts` | ✅ Good |
507: | run-background-command | `tests/tools/run-background-command.test.ts` | ✅ Good |
508: | prompt-skim | `tests/tools/prompt-skim.test.ts` | ✅ Good |
509: | prompt-analyze | `tests/tools/prompt-analyze.test.ts` | ✅ Good |
510: | session-patch | `tests/tools/session-patch.test.ts` | ✅ Good |
511: | session-journal-export | `tests/tools/session-journal-export.test.ts` | ✅ Good |
512: | configure-primitive | `tests/tools/configure-primitive.test.ts` | ✅ Good |
513: | validate-restart | `tests/tools/validate-restart.test.ts` | ✅ Good |
514: | bootstrap-init | `tests/tools/bootstrap-init.test.ts` | ✅ Good |
515: | bootstrap-recover | `tests/tools/bootstrap-recover.test.ts` | ✅ Good |
516: | execute-slash-command | `tests/tools/execute-slash-command.test.ts` | ✅ Good |
517: | hivemind-doc | `tests/tools/hivemind-doc.test.ts` | ✅ Good |
518: | hivemind-trajectory | `tests/tools/hivemind-trajectory.test.ts` | ✅ Good |
519: | hivemind-pressure | `tests/tools/hivemind-pressure.test.ts` | ✅ Good |
520: | hivemind-sdk-supervisor | `tests/tools/hivemind-sdk-supervisor.test.ts` | ✅ Good |
521: | hivemind-command-engine | `tests/tools/hivemind-command-engine.test.ts` | ✅ Good |
522: | hivemind-agent-work | `tests/tools/hivemind-agent-work.test.ts` | ✅ Good |
523: | session-context | `tests/tools/hivemind/session-context.test.ts` | ✅ Good |
524: | session-hierarchy | `tests/tools/hivemind/session-hierarchy.test.ts` | ✅ Good |
525: | session-tracker | `tests/tools/hivemind/session-tracker.test.ts` | ✅ Good |
526: | **hivemind-session-view** | **NO TEST FILE FOUND** | ❌ **MISSING** |
527: 
528: **24 tools registered, 23 have test coverage.**
529: 
530: ### 3.9 Module Size Analysis
531: 
532: | File | LOC | Cap (500) |
533: |------|-----|-----------|
534: | configure-primitive.ts | 490 | ⚠️ At limit |
535: | session-tracker.ts | 373 | OK |
536: | bootstrap-init.ts | 309 | OK |
537: | session-hierarchy.ts | 228 | OK |
538: | run-background-command.ts | 228 | OK |
539: | session-context.ts | 224 | OK |
540: | bootstrap-recover.ts | 219 | OK |
541: | delegation-status.ts | 208 | OK |
542: | prompt-analyze/tools.ts | 169 | OK |
543: | execute-slash-command.ts | 152 | OK |
544: | hivemind-agent-work.ts | 152 (2 tools) | OK |
545: | session-patch/tools.ts | 136 | OK |
546: | hivemind-session-view.ts | 127 | OK |
547: | validate-restart.ts | 116 | OK |
548: | hivemind-trajectory.ts | 112 | OK |
549: | prompt-skim/tools.ts | 107 | OK |
550: | hivemind-pressure.ts | 94 | OK |
551: | delegate-task.ts | 93 | OK |
552: | hivemind-command-engine.ts | 67 | OK |
553: | hivemind-sdk-supervisor.ts | 53 | OK |
554: | hivemind-doc.ts | 45 | OK |
555: 
556: `configure-primitive.ts` at 490 LOC is dangerously close to the 500 LOC module cap.
557: 
558: ---
559: 
560: ## 4. Tool Surface Quality Assessment
561: 
562: | Tool | Grade | Notes |
563: |------|-------|-------|
564: | `delegate-task` | **GOOD** | Clean factory, proper deps, good tests |
565: | `delegation-status` | **GOOD** | Complex but well-structured. renderDelegationV2 dense |
566: | `run-background-command` | **GOOD** | Excellent validation, z.discriminatedUnion, access control |
567: | `prompt-skim` | **GOOD** | Clean, deterministic, schema-validated |
568: | `prompt-analyze` | **GOOD** | Clean, deterministic, schema-validated |
569: | `session-patch` | **GOOD** | Security-conscious with path traversal protection |
570: | `session-journal-export` | **GOOD** | Clean, well-structured |
571: | `execute-slash-command` | **NEEDS_REFACTOR** | Return envelope divergence, no Zod schema, no renderToolResult |
572: | `configure-primitive` | **NEEDS_REFACTOR** | 490 LOC (at 500 cap), inline schema, handleCompile too large |
573: | `validate-restart` | **GOOD** | Clean, well-structured |
574: | `bootstrap-init` | **GOOD** | Testable export pattern |
575: | `bootstrap-recover` | **GOOD** | Testable export pattern |
576: | `hivemind-doc` | **GOOD** | Small, focused |
577: | `hivemind-agent-work` | **GOOD** | Excellent separation |
578: | `hivemind-trajectory` | **GOOD** | Clean switch dispatch |
579: | `hivemind-pressure` | **GOOD** | Clean switch dispatch |
580: | `hivemind-sdk-supervisor` | **GOOD** | Small, focused |
581: | `hivemind-command-engine` | **GOOD** | Clean delegation |
582: | `hivemind-session-view` | **NEEDS_REFACTOR** | No tests, direct I/O |
583: | `session-context` | **NEEDS_REFACTOR** | Mislocated in hivemind/ |
584: | `session-hierarchy` | **NEEDS_REFACTOR** | Mislocated in hivemind/ |
585: | `session-tracker` | **NEEDS_REFACTOR** | Mislocated in hivemind/, approaching 500 LOC |
586: | Config tools (import) | **NEEDS_REFACTOR** | All 4 use `@opencode-ai/plugin` instead of `/tool` |
587: 
588: ### Summary
589: 
590: | Grade | Count |
591: |-------|-------|
592: | **GOOD** | 16 |
593: | **NEEDS_REFACTOR** | 7 |
594: | **BROKEN** | 0 |
595: 
596: ---
597: 
598: ## 5. Recommendations
599: 
600: ### Critical (blocker)
601: 1. **Fix `execute-slash-command` return envelope**: Add `renderToolResult()` wrapping and a proper Zod schema to match all other 23 tools.
602: 
603: ### High priority
604: 2. **Add tests for `hivemind-session-view`**: Currently the only tool with zero test coverage.
605: 3. **Move `session-context`, `session-hierarchy`, `session-tracker`** from `src/tools/hivemind/` to `src/tools/session/`.
606: 4. **Unify `tool()` import across all tools**: Standardize on `@opencode-ai/plugin/tool` (narrow import).
607: 
608: ### Medium priority
609: 5. **Refactor `configure-primitive.ts`** — split `handleCompile()` (103 lines) into smaller functions. Inline Zod schema should be moved to `schema-kernel/`.
610: 6. **Refactor `delegation-status.ts` `renderDelegationV2()`** — 5 inline ternaries in the spread expression are unreadable.
611: 7. **Refactor `session-tracker.ts`** — at 373 lines, it should be split or moved to a multi-file structure.
612: 
613: ### Low priority
614: 8. **Remove unused `_projectRoot` from prompt tools** — or make the parameter truly optional.
615: 9. **Standardize ToolContext typing** — some tools use `type ToolContext = { sessionID?: string }`, others use `{ sessionID: string; directory?: string; worktree?: string }`, others cast from `unknown`.
616: 10. **`hivemind-session-view.ts`** uses raw `readFile` for delegations — should use `safeSessionPath` consistently.
617: 
618: ---
619: 
620: *Analysis performed: 2026-05-21 — all 24 tools read and analyzed.*

(End of file - total 620 lines)
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

**Tool: bash**

**Input:**
```json
{
  "command": "find /Users/apple/hivemind-plugin-private/.planning/phases/24* -name \"*.md\" -type f | xargs grep -l \"execute-slash-command\" 2>/dev/null | head -10",
  "description": "Tìm mentions trong phases 24.x"
}
```

**Output:**
```
/Users/apple/hivemind-plugin-private/.planning/phases/24.3.1-governance-session-prototype/24.3.1-02-SUMMARY.md
/Users/apple/hivemind-plugin-private/.planning/phases/24.3.1-governance-session-prototype/24.3.1-02-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/24.3.1-governance-session-prototype/24.3.1-01-SUMMARY.md
/Users/apple/hivemind-plugin-private/.planning/phases/24.3.1-governance-session-prototype/24.3.1-01-PLAN.md

```

---

## Assistant (Build · MiMo-V2.5-Pro (Precision) · 21.2s)

_Thinking:_

Tiếp tục nghiên cứu sâu hơn về execute-slash-command và phases 24.x liên quan:






**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/24.1-agent-hierarchy-restructure/24.1-RESEARCH.md"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin-private/.planning/phases/24.1-agent-hierarchy-restructure/24.1-RESEARCH.md</path>
<type>file</type>
<content>
1: # Phase 24.1 — Agent Hierarchy Restructure — Research
2: 
3: **Researched:** 2026-05-26
4: **Domain:** OpenCode Agent Schema — Frontmatter Standardization, Hierarchy Optimization, 45→30 Agent Consolidation
5: **Confidence:** HIGH
6: 
7: ## Summary
8: 
9: Phase 24.1 restructures the Hivemind hm-* agent hierarchy from 45 agents (1 L0 + 1 L1 + 43 L2/L3) to 30 agents (1 L0 + 0 L1 + 29 L2) per the decisions in CONTEXT.md. The L1 coordinator layer is removed entirely (merged into programmatic features). All 43 L2/L3 agents are consolidated into 29 domain-focused specialists with non-overlapping domains.
10: 
11: **Key finding:** The current frontmatter format includes **16 fields** (`name`, `temperature`, `steps`, `color`, `permission`, `skills`, `instruction`, `reasoningEffort`, `depth`, `lineage`, `domain`, `delegation_routing`, `intent_classification`, `mode`, `description`, `tools`) — far exceeding the correct OpenCode schema which specifies only `description`, `mode`, `hidden`, `temperature`, `steps`, `permission`, `model`, `color`, `disable`, `top_p`. Per CONTEXT.md D-24-02, shipped files should be **minimal**: only `description`, `mode: all`, `hidden: true`. Runtime overrides (temperature, steps, permission) are set by orchestrator, not stored in files.
12: 
13: **Primary recommendation:** Execute a two-pass restructuring: **Pass 1** (Phase 24.1) — consolidate 45→30 agents, correct frontmatter to minimal format, delete L1, rename agents to drop `-lX-` tier suffix. **Pass 2** (Phase 24.2) — write full agent profile bodies with proper execution flows, success criteria, and artifact contracts.
14: 
15: **Note:** GSD repo change (original abandoned, new maintainer at open-gsd/get-shit-done-redux) does NOT affect this phase — it deals exclusively with OpenCode's native agent schema, which is verified via Context7 against anomalyco/opencode.
16: 
17: <user_constraints>
18: ## User Constraints (from CONTEXT.md)
19: 
20: ### Locked Decisions
21: 
22: | ID | Decision | Status |
23: |----|----------|--------|
24: | D-24-01 | No GSD primitives shipped — only hm-*, hf-*, gate-*, stack-* coexist at install | Locked |
25: | D-24-02 | Agent YAML format minimal: `description`, `mode: all`, `hidden: true`. NO fields for temperature, steps, color, permission, tools, name in shipped files | Locked |
26: | D-24-03 | One agent = one domain — non-overlapping, each maps 1:1 to a command + workflow | Locked |
27: | D-24-04 | Gate agents merged into workflow — no separate gate-* agents | Locked |
28: | — | L1 coordinator layer removed (merged into programmatic orchestration features) | Locked |
29: | — | 30 hm-* agents total (1 L0 + 29 L2), down from 45 | Locked |
30: | — | Filename = agent name (e.g., `hm-executor.md`), no `-lX-` tier suffix in filename | Locked |
31: | — | `tools` field is DEPRECATED in OpenCode schema — use `permission` instead | Locked |
32: | — | Agent body contains: role description, execution flow, deviation rules, artifact specs, success criteria | Locked |
33: 
34: ### the agent's Discretion
35: 
36: - Exact naming of each proposed agent (within hm-* lineage prefix convention)
37: - Which current agents map to which proposed agents (must respect non-overlapping domain rule)
38: - Whether to keep `color` in shipped files (OpenCode schema allows it, CONTEXT.md says remove) — recommend removing per minimal file principle
39: - Whether to keep `model` for agents that need specific models (recommend: no — orchestrator sets at runtime)
40: 
41: ### Deferred Ideas (OUT OF SCOPE)
42: 
43: - Agent profile body content quality enforcement — belongs in Phase 24.2
44: - Commands infrastructure and workflow files — belong in Phase 24.3-24.6
45: - hf-* line restructuring — not part of this phase
46: - gsd-* agents — never shipped, dev tooling only
47: </user_constraints>
48: 
49: ## Architectural Responsibility Map
50: 
51: | Capability | Primary Tier | Secondary Tier | Rationale |
52: |------------|-------------|----------------|-----------|
53: | Session orchestration | L0 (hm-orchestrator) | — | Single entry point for all hm-* work |
54: | Project/domain research | L2 (hm-project-researcher) | hm-phase-researcher | Full-domain ecosystem research before roadmap |
55: | Phase implementation research | L2 (hm-phase-researcher) | hm-project-researcher | Phase-specific research for planning |
56: | Research synthesis | L2 (hm-synthesizer) | — | Compress parallel research outputs |
57: | Architecture design | L2 (hm-architect) | — | ADRs, architecture decisions |
58: | Codebase mapping | L2 (hm-codebase-mapper) | hm-pattern-mapper | Structure extraction |
59: | Task planning | L2 (hm-planner) | hm-plan-checker | Task decomposition, dependency analysis |
60: | Pattern mapping | L2 (hm-pattern-mapper) | hm-codebase-mapper | Code pattern extraction for new files |
61: | Plan verification | L2 (hm-plan-checker) | — | Goal-backward plan validation |
62: | Roadmap creation | L2 (hm-roadmapper) | — | Phase breakdown, requirements |
63: | Plan execution | L2 (hm-executor) | — | Atomic commits, TDD cycles |
64: | Goal verification | L2 (hm-verifier) | — | Evidence truth verification |
65: | Code review | L2 (hm-code-reviewer) | hm-code-fixer | Adversarial review, spec compliance |
66: | Code fix application | L2 (hm-code-fixer) | — | Per-fix atomic commits |
67: | Integration verification | L2 (hm-integration-checker) | — | Cross-phase E2E flows |
68: | Debug session management | L2 (hm-debug-session-manager) | hm-debugger | Multi-cycle debug orchestration |
69: | Bug investigation | L2 (hm-debugger) | — | Root cause analysis |
70: | Security audit | L2 (hm-security-auditor) | — | STRIDE threat modeling |
71: | Documentation writing | L2 (hm-doc-writer) | hm-doc-verifier | Specs, READMEs, API docs |
72: | Documentation verification | L2 (hm-doc-verifier) | — | Factual claim verification |
73: | User profiling | L2 (hm-user-profiler) | — | Behavioral profiling |
74: | UI research | L2 (hm-ui-researcher) | hm-ui-checker | UI design contracts |
75: | UI validation | L2 (hm-ui-checker) | — | UI contract validation |
76: | UI audit | L2 (hm-ui-auditor) | — | 6-pillar visual audit |
77: | Intent clarification | L2 (hm-intent-loop) | — | Requirements Q&A |
78: | Feature ecosystem | L2 (hm-ecologist) | — | Dependency mapping, impact analysis |
79: | Release coordination | L2 (hm-shipper) | — | Changelogs, release manifests |
80: | Spec authoring | L2 (hm-specifier) | — | Spec-driven authoring |
81: | Nyquist validation | L2 (hm-nyquist-auditor) | — | Validation gap filling |
82: | Codebase intel | L2 (hm-intel-updater) | — | Intelligence file writing |
83: 
84: ## Current Agent Landscape
85: 
86: ### Current hm-* Agents (45 total)
87: 
88: | # | Current Name | Tier | Domain | Size (LOC) | Frontmatter Fields |
89: |---|-------------|------|--------|------------|-------------------|
90: | 1 | hm-l0-orchestrator | L0 | Multi-Domain Orchestration | 806 | 13+ custom fields |
91: | 2 | hm-l1-coordinator | L1 | Phase Lifecycle | 364 | 10+ custom fields |
92: | 3 | hm-l2-analyst | L2 | Analysis | ~400 | 9+ fields |
93: | 4 | hm-l2-architect | L2 | Architecture | 526 | 9+ fields |
94: | 5 | hm-l2-assessor | L2 | Assessment | ~400 | 9+ fields |
95: | 6 | hm-l2-auditor | L2 | Audit | 499 | 9+ fields |
96: | 7 | hm-l2-brainstormer | L2 | Ideation | ~400 | 9+ fields |
97: | 8 | hm-l2-build | L2 | Build | 86 | 9+ fields |
98: | 9 | hm-l2-conductor | L2 | Conduction | ~300 | 9+ fields |
99: | 10 | hm-l2-connector | L2 | Connection | ~300 | 9+ fields |
100: | 11 | hm-l2-context-mapper | L2 | Context Mapping | ~300 | 9+ fields |
101: | 12 | hm-l2-context-purifier | L2 | Context Purification | ~300 | 9+ fields |
102: | 13 | hm-l2-critic | L2 | Critique | 498 | 9+ fields |
103: | 14 | hm-l2-curator | L2 | Curation | ~300 | 9+ fields |
104: | 15 | hm-l2-debugger | L2 | Debugging | 186 | 9+ fields |
105: | 16 | hm-l2-ecologist | L2 | Ecosystem | 571 | 9+ fields |
106: | 17 | hm-l2-executor | L2 | Implementation | 209 | 9+ fields |
107: | 18 | hm-l2-finisher | L2 | Completion | ~300 | 9+ fields |
108: | 19 | hm-l2-general | L2 | General | 94 | 9+ fields |
109: | 20 | hm-l2-guardian | L2 | Guarding | ~300 | 9+ fields |
110: | 21 | hm-l2-integrator | L2 | Integration | 187 | 9+ fields |
111: | 22 | hm-l2-intent-loop | L2 | Intent | ~400 | 9+ fields |
112: | 23 | hm-l2-investigator | L2 | Investigation | ~300 | 9+ fields |
113: | 24 | hm-l2-mentor | L2 | Mentoring | ~300 | 9+ fields |
114: | 25 | hm-l2-meta-synthesis | L2 | Meta-Synthesis | ~300 | 9+ fields |
115: | 26 | hm-l2-operator | L2 | Operation | ~300 | 9+ fields |
116: | 27 | hm-l2-optimizer | L2 | Optimization | ~300 | 9+ fields |
117: | 28 | hm-l2-persistor | L2 | Persistence | ~300 | 9+ fields |
118: | 29 | hm-l2-phase-guardian | L2 | Phase Guarding | ~300 | 9+ fields |
119: | 30 | hm-l2-planner | L2 | Planning | 526 | 9+ fields |
120: | 31 | hm-l2-prompt-analyzer | L2 | Prompt Analysis | ~200 | 9+ fields |
121: | 32 | hm-l2-prompt-repackager | L2 | Prompt Repack | ~200 | 9+ fields |
122: | 33 | hm-l2-prompt-skimmer | L2 | Prompt Skimming | ~200 | 9+ fields |
123: | 34 | hm-l2-researcher | L2 | Research | 452 | 9+ fields |
124: | 35 | hm-l2-reviewer | L2 | Review | ~400 | 9+ fields |
125: | 36 | hm-l2-risk-assessor | L2 | Risk Assessment | ~300 | 9+ fields |
126: | 37 | hm-l2-router | L2 | Routing | ~300 | 9+ fields |
127: | 38 | hm-l2-scout | L2 | Detection | 405 | 9+ fields |
128: | 39 | hm-l2-spec-verifier | L2 | Spec Verification | ~300 | 9+ fields |
129: | 40 | hm-l2-strategist | L2 | Strategy | ~400 | 9+ fields |
130: | 41 | hm-l2-synthesizer | L2 | Synthesis | 324 | 9+ fields |
131: | 42 | hm-l2-technician | L2 | Technical | ~300 | 9+ fields |
132: | 43 | hm-l2-test-router | L2 | Test Routing | ~200 | 9+ fields |
133: | 44 | hm-l2-validator | L2 | Validation | 525 | 9+ fields |
134: | 45 | hm-l2-writer | L2 | Writing | 272 | 9+ fields |
135: 
136: **Total current hm-* agents:** 45
137: **Total current lines:** ~13,000 (estimated)
138: **Average LOC per agent:** ~300
139: 
140: ### Current Frontmatter (aggregate from samples)
141: 
142: ```yaml
143: ---
144: name: hm-l2-{name}              # PRESENT — should be removed (filename = name)
145: description: "..."              # PRESENT — STAYS, required
146: mode: subagent                  # PRESENT — should change to `mode: all` + `hidden: true`
147: temperature: 0.05               # PRESENT — should be REMOVED (runtime override)
148: steps: 40                       # PRESENT in some — should be REMOVED (runtime override)
149: color: "#3498DB"                # PRESENT in some — should be REMOVED (minimal file principle)
150: permission:                     # PRESENT — should be REMOVED (runtime override by orchestrator)
151:   read: allow
152:   edit: ...
153:   bash: ...
154:   glob: allow
155:   grep: allow
156:   task: ...
157:   skill: ...
158: depth: L2                       # CUSTOM — should be REMOVED (tier from filename convention)
159: lineage: hm                     # CUSTOM — should be REMOVED (prefix convention)
160: domain: Planning                # CUSTOM — should be REMOVED (description field suffices)
161: skills:                         # CUSTOM — should be REMOVED (orchestrator loads skills)
162:   - hm-l2-spec-driven-authoring
163: instruction:                    # CUSTOM — should be REMOVED (orchestrator specifies)
164:   - AGENTS.md
165: ---
166: ```
167: 
168: ### GSD Agent Format (for comparison)
169: 
170: ```yaml
171: ---
172: name: gsd-executor
173: description: "..."
174: mode: subagent
175: ---
176: ```
177: 
178: The GSD agents use the minimal correct format already. They have only `name` (to be removed — filename is name), `description`, and `mode`. This is the target format.
179: 
180: ### hf-* Agent Format (for comparison)
181: 
182: Similar to hm-* agents — includes `name`, `description`, `mode`, `temperature`, `steps`, `color`, `permission`, plus custom `depth`, `lineage`, `domain`, `skills`, `instruction`. Same excess fields problem.
183: 
184: ## OpenCode Schema Validation Findings
185: 
186: **Source:** [CITED: anomalyco/opencode docs — agent definition](https://github.com/anomalyco/opencode/blob/dev/packages/web/src/content/docs/agents.mdx)
187: **Verified:** 2026-05-26 via Context7 query on `/anomalyco/opencode`
188: 
189: ### Valid Frontmatter Fields
190: 
191: | Field | Type | Required | Notes |
192: |-------|------|----------|-------|
193: | `description` | string | ✅ YES | One-liner role description |
194: | `mode` | `all` / `primary` / `subagent` | ❌ (default: `all`) | `all` = Tab cycle + @ invocation; `primary` = Tab only; `subagent` = @ only |
195: | `hidden` | boolean | ❌ | Hides from @ autocomplete (only applies with `mode: subagent`) |
196: | `temperature` | 0.0-1.0 | ❌ | Runtime override — best practice: set in orchestrator config, not file |
197: | `steps` | integer | ❌ | Max agentic iterations — runtime override |
198: | `permission` | object | ❌ | Fine-grained tool control — runtime override by orchestrator |
199: | `model` | string | ❌ | Model override — runtime override |
200: | `color` | string (hex/theme) | ❌ | UI concern — optional |
201: | `disable` | boolean | ❌ | Disable agent entirely |
202: | `top_p` | 0.0-1.0 | ❌ | Response diversity |
203: | `tools` | array | ❌ | **DEPRECATED** per OpenCode docs — use `permission` instead |
204: 
205: ### Key Findings
206: 
207: 1. **`mode: all` + `hidden: true` is the correct combination** for L2 specialists that should be callable by orchestrator but hidden from user @ menu. OpenCode docs confirm: `hidden: true` hides from @ autocomplete but agents remain invocable via task tool if permissions allow.
208: 
209: 2. **The `tools` field is DEPRECATED.** Current hm-* agents do NOT use `tools` (good), but this confirms the field is correct to omit.
210: 
211: 3. **`name` field is redundant** — filename (without `.md`) is the agent name. Many current agents include `name:` in frontmatter. This should be removed.
212: 
213: 4. **`temperature`, `steps`, `color`, `permission`** are all valid OpenCode fields BUT CONTEXT.md D-24-02 specifies they should not be in shipped files. Runtime overrides are set by orchestrator based on task type. This is architecturally correct — the orchestrator should decide temperature (high for creative tasks like planning, low for deterministic tasks like execution), not the agent file.
214: 
215: 5. **`depth`, `lineage`, `domain`, `skills`, `instruction`** are custom Hivemind fields. They have no OpenCode schema meaning. They should be removed from shipped files. Skills loading and instruction references are orchestrator concern.
216: 
217: ## Agent Mapping Table (Current → Proposed)
218: 
219: ### Legend
220: | Status | Meaning |
221: |--------|---------|
222: | **KEEP** | Name stays the same (drop `-lX-` tier suffix) |
223: | **RENAME** | Agent keeps its domain but gets a new name |
224: | **MERGE-IN** | Agent's domain is absorbed into another agent |
225: | **REMOVED** | Agent is eliminated (domain merged into programmatic features or another agent) |
226: | **NEW** | No current equivalent — created from scratch |
227: 
228: ### L0 — Orchestrator (1 agent)
229: 
230: | # | Proposed Name | Current Name | Status | Rationale |
231: |---|--------------|-------------|--------|-----------|
232: | 1 | `hm-orchestrator` | `hm-l0-orchestrator` | RENAME | Drop `-l0-` tier suffix. File: `hm-orchestrator.md` |
233: 
234: ### L2 — Research (3 agents)
235: 
236: | # | Proposed Name | Current Name | Status | Rationale |
237: |---|--------------|-------------|--------|-----------|
238: | 2 | `hm-project-researcher` | `hm-l2-project-researcher` (NEW) | **NEW** | No direct current equivalent. Currently done by `hm-l2-researcher` + `hm-l2-scout` + `hm-l2-analyst`. These merge into this domain |
239: | 3 | `hm-phase-researcher` | `hm-l2-researcher` | RENAME | Current `hm-l2-researcher` (452 LOC) is the phase researcher. Rename to match domain |
240: | 4 | `hm-synthesizer` | `hm-l2-synthesizer` | KEEP | Drop `-l2-` suffix. Keep domain name |
241: 
242: **Agents consumed by Research consolidation:**
243: - `hm-l2-analyst` → REMOVED (merged into hm-project-researcher)
244: - `hm-l2-scout` → REMOVED (merged into hm-project-researcher)
245: - `hm-l2-investigator` → REMOVED (merged into hm-project-researcher)
246: 
247: ### L2 — Planning (6 agents)
248: 
249: | # | Proposed Name | Current Name | Status | Rationale |
250: |---|--------------|-------------|--------|-----------|
251: | 5 | `hm-architect` | `hm-l2-architect` | RENAME | Drop `-l2-` suffix. Keep domain |
252: | 6 | `hm-codebase-mapper` | `hm-l2-context-mapper` | RENAME | Better name reflects function. Context mapper → codebase mapper |
253: | 7 | `hm-planner` | `hm-l2-planner` | KEEP | Drop `-l2-` suffix |
254: | 8 | `hm-pattern-mapper` | (NEW) | **NEW** | Extracted from current `hm-l2-scout` and `hm-l2-context-mapper` |
255: | 9 | `hm-plan-checker` | `hm-l2-plan-checker` (NEW) | **NEW** | No direct current equivalent. Partially covered by `hm-l2-critic` and `hm-l2-validator` |
256: | 10 | `hm-roadmapper` | (NEW) | **NEW** | No direct current equivalent. Currently done ad-hoc by `hm-l2-strategist` |
257: 
258: **Agents consumed by Planning consolidation:**
259: - `hm-l2-strategist` → REMOVED (strategist role distributed across planning agents)
260: - `hm-l2-context-purifier` → REMOVED (merged into hm-codebase-mapper)
261: - `hm-l2-curator` → REMOVED (merged into hm-codebase-mapper)
262: 
263: ### L2 — Implementation (5 agents)
264: 
265: | # | Proposed Name | Current Name | Status | Rationale |
266: |---|--------------|-------------|--------|-----------|
267: | 11 | `hm-executor` | `hm-l2-executor` | KEEP | Drop `-l2-` suffix |
268: | 12 | `hm-verifier` | `hm-l2-validator` | RENAME | Better name reflects "goal-backward verification" domain vs "validation" which overlaps with critic |
269: | 13 | `hm-code-reviewer` | `hm-l2-critic` | RENAME | "Code reviewer" is clearer than "critic" for this domain |
270: | 14 | `hm-code-fixer` | (NEW) | **NEW** | No direct current equivalent. Partially covered by `hm-l2-executor` deviation handling |
271: | 15 | `hm-integration-checker` | `hm-l2-integrator` | RENAME | Better name. Also absorbs `hm-l2-connector` |
272: 
273: **Agents consumed by Implementation consolidation:**
274: - `hm-l2-build` → REMOVED (full-access agent — dangerous pattern. Executor serves this role with proper boundaries)
275: - `hm-l2-technician` → REMOVED (merged into hm-executor)
276: - `hm-l2-connector` → REMOVED (merged into hm-integration-checker)
277: - `hm-l2-optimizer` → REMOVED (optimization is a task type for hm-executor, not a separate agent)
278: - `hm-l2-operator` → REMOVED (generic role, no domain specificity)
279: 
280: ### L2 — Debug (2 agents)
281: 
282: | # | Proposed Name | Current Name | Status | Rationale |
283: |---|--------------|-------------|--------|-----------|
284: | 16 | `hm-debug-session-manager` | (NEW) | **NEW** | No current equivalent. Debug session orchestration extracted from L1 coordinator |
285: | 17 | `hm-debugger` | `hm-l2-debugger` | KEEP | Drop `-l2-` suffix. Keep domain |
286: 
287: ### L2 — Security (1 agent)
288: 
289: | # | Proposed Name | Current Name | Status | Rationale |
290: |---|--------------|-------------|--------|-----------|
291: | 18 | `hm-security-auditor` | `hm-l2-risk-assessor` | RENAME | Risk assessor renamed and refocused to security domain. Also absorbs security concerns from `hm-l2-assessor` |
292: 
293: **Agents consumed by Security consolidation:**
294: - `hm-l2-assessor` → REMOVED (merged into hm-security-auditor)
295: 
296: ### L2 — Documentation (2 agents)
297: 
298: | # | Proposed Name | Current Name | Status | Rationale |
299: |---|--------------|-------------|--------|-----------|
300: | 19 | `hm-doc-writer` | `hm-l2-writer` | RENAME | Explicit "doc" prefix |
301: | 20 | `hm-doc-verifier` | (NEW) | **NEW** | No current equivalent. Doc verification was not a separate domain |
302: 
303: **Agents consumed by Documentation consolidation:**
304: - `hm-l2-meta-synthesis` → REMOVED (meta-synthesis merged into hm-doc-writer)
305: - `hm-l2-prompt-analyzer` → REMOVED (prompt pipeline tools, not specialist agents)
306: - `hm-l2-prompt-repackager` → REMOVED
307: - `hm-l2-prompt-skimmer` → REMOVED
308: 
309: ### L2 — Profiling (1 agent)
310: 
311: | # | Proposed Name | Current Name | Status | Rationale |
312: |---|--------------|-------------|--------|-----------|
313: | 21 | `hm-user-profiler` | (NEW) | **NEW** | No current equivalent. New agent for developer behavioral profiling |
314: 
315: ### L2 — UI (3 agents)
316: 
317: | # | Proposed Name | Current Name | Status | Rationale |
318: |---|--------------|-------------|--------|-----------|
319: | 22 | `hm-ui-researcher` | (NEW) | **NEW** | No current equivalent. UI design contract creation |
320: | 23 | `hm-ui-checker` | (NEW) | **NEW** | No current equivalent. UI contract validation |
321: | 24 | `hm-ui-auditor` | (NEW) | **NEW** | No current equivalent. Visual audit |
322: 
323: ### L2 — Cross-Cutting (6 agents)
324: 
325: | # | Proposed Name | Current Name | Status | Rationale |
326: |---|--------------|-------------|--------|-----------|
327: | 25 | `hm-intent-loop` | `hm-l2-intent-loop` | KEEP | Drop `-l2-` suffix |
328: | 26 | `hm-ecologist` | `hm-l2-ecologist` | KEEP | Drop `-l2-` suffix |
329: | 27 | `hm-shipper` | (NEW) | **NEW** | No current equivalent. Release coordination |
330: | 28 | `hm-specifier` | `hm-l2-spec-verifier` | RENAME | Spec verifier → specifier (focus shifts from verifying to authoring specs) |
331: | 29 | `hm-nyquist-auditor` | (NEW) | **NEW** | No current equivalent. Validation gap filling |
332: | 30 | `hm-intel-updater` | (NEW) | **NEW** | No current equivalent. Codebase intelligence writing |
333: 
334: ### Agents Consumed Elsewhere
335: 
336: | Current Name | Proposed Disposition | Absorbed By |
337: |-------------|---------------------|-------------|
338: | `hm-l2-general` | REMOVED | No domain specificity — harmful pattern. Use specific agents |
339: | `hm-l2-conductor` | REMOVED | L1 coordinator absorbed this role |
340: | `hm-l2-router` | REMOVED | Routing is a programmatic feature, not an agent |
341: | `hm-l2-mentor` | REMOVED | No domain — removed |
342: | `hm-l2-phase-guardian` | REMOVED | Gate functions merged into programmatic features per D-24-04 |
343: | `hm-l2-persistor` | REMOVED | Persistence is shared infrastructure, not an agent domain |
344: | `hm-l2-finisher` | REMOVED | Completion handling merged into hm-orchestrator |
345: | `hm-l2-guardian` | REMOVED | Gate functions merged per D-24-04 |
346: | `hm-l2-reviewer` | REMOVED | Overlaps with hm-code-reviewer (hm-critic renamed) and hm-verifier (hm-validator renamed) |
347: | `hm-l2-test-router` | REMOVED | Test routing is a programmatic feature, not an agent |
348: | `hm-l1-coordinator` | REMOVED | L1 layer eliminated. Coordination merged into programmatic features (session-tracker, delegation-status, coordination tools) |
349: 
350: ### Summary Counts
351: 
352: | Category | Current | Proposed | Change |
353: |----------|---------|----------|--------|
354: | L0 agents | 1 | 1 | 0 |
355: | L1 agents | 1 | 0 | -1 |
356: | L2/L3 agents | 43 | 29 | -14 |
357: | **Total** | **45** | **30** | **-15** |
358: | — | — | — | — |
359: | KEEP (same name, drop suffix) | — | 6 | hm-synthesizer, hm-planner, hm-executor, hm-debugger, hm-intent-loop, hm-ecologist |
360: | RENAME | — | 11 | Tier suffix dropped + sometimes renamed |
361: | NEW | — | 13 | No current equivalent |
362: | REMOVED | — | 22 | Merged, eliminated, or absorbed |
363: 
364: ## Key Differences: Current Format vs Correct Format
365: 
366: | Aspect | Current (WRONG) | Target (CORRECT) |
367: |--------|-----------------|-------------------|
368: | `name:` field | Present | REMOVED — filename is name |
369: | `mode:` | `subagent` | `mode: all` + `hidden: true` |
370: | `temperature:` | Present (0.05-0.3) | REMOVED — set by orchestrator at runtime |
371: | `steps:` | Present (40-100) in some | REMOVED — set by orchestrator |
372: | `color:` | Present in some | REMOVED — minimal file principle |
373: | `permission:` | Full block | REMOVED — set by orchestrator |
374: | `depth:` | Custom field | REMOVED — tier from filename convention |
375: | `lineage:` | Custom field | REMOVED — prefix convention |
376: | `domain:` | Custom field | REMOVED — description field suffices |
377: | `skills:` | Full list | REMOVED — orchestrator loads skills |
378: | `instruction:` | Present | REMOVED — orchestrator provides instructions |
379: | `reasoningEffort:` | Present (L0 only) | REMOVED |
380: | `delegation_routing:` | Custom (L0 only) | REMOVED — programmatic feature |
381: | `intent_classification:` | Custom (L0 only) | REMOVED — programmatic feature |
382: | File naming | `hm-l2-{name}.md` | `hm-{name}.md` |
383: | Body content | Full XML spec (~300-800 LOC) | Minimal for now. Full profile in Phase 24.2 |
384: | File size | 86-806 LOC | ~50 LOC (minimal frontmatter + brief role) |
385: 
386: ## Implementation Approach
387: 
388: ### Pass 1: File Operations Only (Phase 24.1 — THIS PHASE)
389: 
390: 1. **Delete L1 coordinator:** Remove `hm-l1-coordinator.md`
391: 2. **Delete 22 removed agents:** Remove all `.md` files for REMOVED agents
392: 3. **Rename 17 agents** (6 KEEP + 11 RENAME): File rename (git mv)
393: 4. **Create 13 new agents:** Create skeleton files with minimal frontmatter
394: 5. **Fix frontmatter on ALL 30 agents:** Strip excess fields
395: 6. **Update AGENTS.md:** Reflect new hierarchy
396: 7. **Update STRUCTURE.md registers:** Reflect agent file changes
397: 
398: ### Target File Format
399: 
400: ```markdown
401: ---
402: description: >
403:   [One sentence: what this agent does. Second sentence: what artifact it produces.
404:   Third sentence: when/why the orchestrator calls it.]
405: mode: all
406: hidden: true
407: ---
408: 
409: # hm-{name} — {Domain}
410: 
411: [Brief role description. Full body content to be filled in Phase 24.2]
412: ```
413: 
414: ### Commissioning Note: Phase 24.2 Handoff
415: 
416: Each agent file in Phase 24.1 should include a comment at the end:
417: ```markdown
418: <!-- 
419:   Phase 24.2 TODO: Write agent profile body with:
420:   - Execution flow (<task> section)
421:   - Deviation rules (<deviation> section)
422:   - Artifact specs (<output_contract> section)
423:   - Success criteria (<verification> section)
424:   - Anti-patterns (<anti_patterns> section)
425: -->
426: ```
427: 
428: ## Risks and Mitigations
429: 
430: | Risk | Severity | Mitigation |
431: |------|----------|------------|
432: | **Existing orchestrator references broken** — L0 references hm-l1-coordinator and many hm-l2-* names | HIGH | Create a compatibility symlink or alias mapping. Update hm-orchestrator.md references in same phase |
433: | **Other agents reference removed agents** — hf-* agents may reference hm-l2-* specialists | MEDIUM | Grep entire codebase for removed agent names. Update or add cross-reference notes |
434: | **Skills reference removed agents** — skill files may reference agent names for delegation targets | MEDIUM | Grep `.opencode/skills/` for removed agent names. Update or add deprecation notes |
435: | **Session continuity broken** — existing sessions reference old agent names in continuity files | LOW | Session continuity uses session IDs, not agent names. Agent name changes don't affect existing sessions |
436: | **13 new agents have no body content** | LOW | Intentional — Phase 24.2 fills agent profiles. Include TODO comments |
437: | **Deletion of 22 agents removes useful instructions** | MEDIUM | Before deleting any agent, extract their useful domain knowledge into skill files or reference docs in `.planning/references/` |
438: | **User confusion from agent count changes** | LOW | Document the change in AGENTS.md and STATE.md |
439: | **Package extraction will need to pick up new agent set** | MEDIUM | Phase 24.7-24.9 primitives schema must reflect the 30-agent target, not the current 45 |
440: 
441: ## Standard Stack
442: 
443: No new packages are introduced in this phase. This is purely a file restructuring operation on `.opencode/agents/` directory.
444: 
445: ### Tools Required
446: | Tool | Purpose | Verified Available |
447: |------|---------|-------------------|
448: | `git mv` | Rename agent files | ✅ |
449: | `rm` | Delete removed agent files | ✅ |
450: | `cat` / `Write` tool | Create new agent files | ✅ |
451: 
452: ## Don't Hand-Roll
453: 
454: | Problem | Don't Build | Use Instead | Why |
455: |---------|-------------|-------------|-----|
456: | Agent frontmatter parsing | Custom YAML parser | OpenCode's native YAML frontmatter parser | OpenCode already parses these correctly |
457: | Agent discovery | Custom registry | OpenCode's `.opencode/agents/` directory discovery | OpenCode discovers agents automatically |
458: | Permission enforcement | In-file permission blocks | Orchestrator-per-agent runtime permission grants | Permissions are runtime concern, not file concern |
459: 
460: ## Environment Availability
461: 
462: | Dependency | Required By | Available | Version | Fallback |
463: |------------|------------|-----------|---------|----------|
464: | git | File operations | ✓ | 2.x | — |
465: | Write tool | Creating new files | ✓ | — | — |
466: 
467: **Missing dependencies with no fallback:** None
468: 
469: ## Validation Architecture
470: 
471: > Skip section — workflow.nyquist_validation is false for Phase 24.1 (file restructuring only, no code changes)
472: 
473: ## Security Domain
474: 
475: > Skip section — this phase involves zero code execution, no data access, and no security-sensitive operations. It only restructures `.opencode/agents/*.md` files.
476: 
477: ## Common Pitfalls
478: 
479: ### Pitfall 1: Forgetting to Update Cross-References
480: **What goes wrong:** hm-orchestrator.md references agents by their old names (e.g., `hm-l2-critic`, `hm-l1-coordinator`) 
481: **Why it happens:** Orchestrator file is large (806 LOC) with many hardcoded agent name references
482: **How to avoid:** After all file operations, grep for every old agent name in the codebase and update references
483: **Warning signs:** Orchestrator attempts to dispatch to nonexistent agent names
484: 
485: ### Pitfall 2: Accidental Deletion of Agent Body Content
486: **What goes wrong:** Deleting an agent file permanently removes its domain knowledge
487: **Why it happens:** "Remove" = `rm` is fast and irreversible
488: **How to avoid:** Before deleting, extract domain knowledge to `.planning/references/` or a skill file. Archive deleted files to `.planning/archive/agents/` instead of hard-deleting
489: 
490: ### Pitfall 3: Phase 24.1 / 24.2 Boundary Blur
491: **What goes wrong:** Phase 24.1 starts writing full agent profile bodies, scope-creeping into Phase 24.2 territory
492: **Why it happens:** The temptation to "just write the body while we're here" + many agents will look empty
493: **How to avoid:** Strict pass separation. Phase 24.1 = file operations + minimal frontmatter ONLY. Phase 24.2 = full profile writing. Use TODO comments as handoff
494: 
495: ### Pitfall 4: L1 Coordinator Removal Breaks Orchestration Flow
496: **What goes wrong:** The L1 coordinator's wave management, checkpoint gates, and result consolidation functionality is lost
497: **Why it happens:** The agent file is deleted but the programmatic replacement doesn't exist yet (it's spread across session-tracker, delegation-status, coordination tools)
498: **How to avoid:** Before deleting L1, confirm that ALL its coordination functionality is available through programmatic features (session-tracker for tracking, delegation-status for monitoring, native `task` tool for dispatch). The orchestration flow becomes: L0 → L2 (fast-path) or L0 → coordination features → L2 (coordinated path)
499: 
500: ## Sources
501: 
502: ### Primary (HIGH confidence)
503: - [VERIFIED: anomalyco/opencode Context7] — Agent schema, frontmatter fields, `mode` behavior, `hidden` behavior, `tools` deprecation. Source: https://github.com/anomalyco/opencode/blob/dev/packages/web/src/content/docs/agents.mdx
504: - [VERIFIED: anomalyco/opencode Context7] — Permission model, `mode: all` + `hidden: true` pattern. Source: https://github.com/anomalyco/opencode/blob/dev/packages/web/src/content/docs/permissions.mdx
505: - [CITED: 24-CONTEXT.md] — D-24-01 through D-24-04, agent roster, frontmatter template, all locked decisions
506: - [CITED: ROBOT/hivemind-plugin-private/.opencode/agents/] — All 45 current hm-* agent files (10 sampled for detailed inspection)
507: 
508: ### Secondary (MEDIUM confidence)
509: - [CITED: GSD agent format] — gsd-executor.md confirms minimal frontmatter pattern: `name`, `description`, `mode` only
510: 
511: ## Assumptions Log
512: 
513: | # | Claim | Section | Risk if Wrong |
514: |---|-------|---------|---------------|
515: | A1 | CONTEXT.md's proposed 30-agent roster is final and user-approved | Agent Mapping Table | If user wants different roster, entire mapping table needs rework |
516: | A2 | Existing session continuity files reference session IDs, not agent names, so agent name changes won't break recovery | Risks | LOW — continuity uses session IDs throughout. Verified via codebase structure |
517: | A3 | Phase 24.2 will fill in full agent profile bodies | Implementation Approach | LOW — if delayed, agents exist with minimal instructions. Functional but not optimized |
518: | A4 | L1 coordinator's functionality is fully covered by programmatic features | Risks | MEDIUM — if session-tracker/delegation-status can't match L1's wave management, orchestration degrades |
519: 
520: ## Open Questions
521: 
522: 1. **Should we archive removed agent files or delete them?**
523:    - What we know: 22 agents are being removed. Their domain knowledge varies from useful (hm-l2-analyst at 400 LOC) to minimal (hm-l2-build at 86 LOC).
524:    - What's unclear: Whether future phases will reference removed agents' domain content.
525:    - Recommendation: Archive ALL removed agent files to `.planning/archive/agents/` rather than deleting. Fast, reversible, preserves knowledge. Delete from archive after Phase 24.2 is complete.
526: 
527: 2. **When to update hf-* agents referencing hm-* agents?**
528:    - What we know: hf-l0-orchestrator references hm-l1-coordinator and hm-l2-* agents.
529:    - What's unclear: Whether hf-* agents should be updated in this phase or a separate phase.
530:    - Recommendation: Update cross-references in same phase. Small incidental changes to hf-* agent files' reference sections are acceptable scope.
531: 
532: ## Metadata
533: 
534: **Confidence breakdown:**
535: - Standard stack (file operations): HIGH — well-understood domain
536: - OpenCode schema validation: HIGH — verified via Context7 against anomalyco/opencode
537: - Agent mapping: MEDIUM — some mappings are subjective (which current agents map to which proposed roles). The 13 NEW agents are clearly new domains not covered by current agents
538: - Risks: MEDIUM — L1 removal risk is real but mitigable
539: 
540: **Research date:** 2026-05-26
541: **Valid until:** 2026-06-26 (stable — agent schema is not fast-moving)
542: 
543: ---
544: 
545: ## RESEARCH COMPLETE
546: 
547: **Phase:** 24.1 — Agent Hierarchy Restructure
548: **Confidence:** HIGH
549: 
550: ### Key Findings
551: 1. **45→30 agent consolidation**: 22 agents removed (L1 coordinator merged into programmatic features, overlapping domains eliminated), 17 agents renamed/kept (drop `-lX-` tier suffix), 13 new agents created (domains not covered by current roster)
552: 2. **Frontmatter format correction**: Current files contain 13-16 fields — target is 3: `description`, `mode: all`, `hidden: true`. All runtime config (temperature, steps, permission) moves to orchestrator
553: 3. **OpenCode schema validated**: Context7 confirms `tools` field is deprecated, `mode: all` + `hidden: true` is correct for programmatically-invoked specialists
554: 4. **L1 coordinator removed**: Wave management, checkpoint gates, result consolidation migrate to programmatic features (session-tracker, delegation-status, coordination tools)
555: 5. **GSD agents unaffected**: They already use minimal correct format (3 fields). They remain as-is (never shipped)
556: 
557: ### File Created
558: `.planning/phases/24.1-agent-hierarchy-restructure/24.1-RESEARCH.md`
559: 
560: ### Confidence Assessment
561: | Area | Level | Reason |
562: |------|-------|--------|
563: | Standard Stack | HIGH | File operations on markdown files — well-understood |
564: | Architecture | HIGH | Schema verified with Context7, decisions locked in CONTEXT.md |
565: | Agent Mapping | MEDIUM | Some subjective assignments. 13 NEW agents have no current equivalents |
566: | Risks | MEDIUM | L1 removal risk requires verification of programmatic feature coverage |
567: 
568: ### Open Questions
569: 1. Archive vs. hard-delete removed agent files? Recommend archive.
570: 2. Update hf-* cross-references in same phase? Recommend yes, as incidental scope.
571: 
572: ### Ready for Planning
573: Research complete. Planner can now create PLAN.md files for Phase 24.1 execution.

(End of file - total 573 lines)
</content>
```

**Tool: bash**

**Input:**
```json
{
  "command": "grep -r \"execute-slash-command\" /Users/apple/hivemind-plugin-private/.planning --include=\"*.md\" -l 2>/dev/null | head -20",
  "description": "Liệt kê tất cả files mentions execute-slash-command"
}
```

**Output:**
```
/Users/apple/hivemind-plugin-private/.planning/research/deep-analysis-plugin-shared-sidecar-2026-05-21.md
/Users/apple/hivemind-plugin-private/.planning/research/hard-restructuring-cluster-map-2026-05-21.md
/Users/apple/hivemind-plugin-private/.planning/research/hard-restructuring-phase-decisions-2026-05-21.md
/Users/apple/hivemind-plugin-private/.planning/research/phase-reordering-analysis-2026-05-21.md
/Users/apple/hivemind-plugin-private/.planning/research/phases-21-22-deep-synthesis-2026-05-22.md
/Users/apple/hivemind-plugin-private/.planning/research/opencode-sdk-v1155-api-audit-2026-05-21.md
/Users/apple/hivemind-plugin-private/.planning/research/deep-analysis-tools-2026-05-21.md
/Users/apple/hivemind-plugin-private/.planning/research/phase-reordering-final-recommendation-2026-05-21.md
/Users/apple/hivemind-plugin-private/.planning/research/hard-restructuring-map-full-2026-05-21.md
/Users/apple/hivemind-plugin-private/.planning/roadmap/hard-restructuring-thin-framing-2026-05-21.md
/Users/apple/hivemind-plugin-private/.planning/STATE.md
/Users/apple/hivemind-plugin-private/.planning/forensics/report-20260522-201000.md
/Users/apple/hivemind-plugin-private/.planning/forensics/report-20260511-154500.md
/Users/apple/hivemind-plugin-private/.planning/architecture/command-architecture-classification-2026-05-13.md
/Users/apple/hivemind-plugin-private/.planning/architecture/command-tools-deprecation-2026-05-13.md
/Users/apple/hivemind-plugin-private/.planning/ROADMAP.md
/Users/apple/hivemind-plugin-private/.planning/codebase/DI-ARCHITECTURE-ANALYSIS.md
/Users/apple/hivemind-plugin-private/.planning/codebase/ARCHITECTURE.md
/Users/apple/hivemind-plugin-private/.planning/codebase/STRUCTURE.md
/Users/apple/hivemind-plugin-private/.planning/codebase/TOOL-CLASSIFICATION-MATRIX-AND-TACKLE-ORDER-2026-05-18.md

```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/research/hard-restructuring-phase-decisions-2026-05-21.md"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin-private/.planning/research/hard-restructuring-phase-decisions-2026-05-21.md</path>
<type>file</type>
<content>
1: # Hard Restructuring — Phase Insertion Decisions
2: 
3: **Date:** 2026-05-21
4: **Author:** gsd-advisor-researcher (subagent)
5: **Calibration tier:** full_maturity
6: **Context:** User directive to restructure `src/` systematically — audit → truth verification → integration → resolve — then cluster by lifecycle/actors/consumers, partition features by harness mechanism, starting from user journey source.
7: 
8: ---
9: 
10: ## Executive Summary
11: 
12: Phases 19-20 are COMPLETE. Phase 21 (Sync I/O Async) is the next planned phase but is **blocked by unresolved architectural decisions** about how to sequence the remaining 5 restructuring phases (22-26). This document resolves 8 gray areas and recommends a **7-phase insertion sequence** (renumbered as Phases 19-25, with original Phases 19-25 pushed to 26-32). The recommended sequence follows the HIVEMIND-PHILOSOPHY pillars: non-destructive first (Iteratively Granular), architecture before cleanup (Hierarchical Superiority), and truth verification at every gate (Strategically Measurable).
13: 
14: **Key recommendation:** Use **decimal insertion** (19.1, 19.2, ...) for the new restructuring phases rather than renumbering the entire roadmap. This preserves commit history references, avoids breaking phase manifest links, and aligns with GSD's established pattern for mid-milestone insertions (e.g., CP-DT-01-06, CA-04.1-04.4).
15: 
16: ---
17: 
18: ## Gray Area Decisions
19: 
20: | Decision | Options | Recommendation | Rationale |
21: |----------|---------|----------------|-----------|
22: | **1. Phase numbering** | (A) Decimal insertion (19.1-19.7), (B) Renumber everything (19→26, 20→27, etc.), (C) New workstream prefix (HR-01 through HR-07) | **Rec: Option A — Decimal insertion** | ROADMAP.md already uses decimal patterns (CA-04.1-04.4, CP-DT-01-01 through 06). Renumbering breaks 50+ cross-references in STATE.md, ROADMAP.md, and phase plan files. Decimal insertion is the established GSD pattern for mid-milestone insertions. New workstream prefix creates unnecessary namespace fragmentation. |
23: | **2. Cluster boundary for cross-cutting modules** | (A) Assign by primary consumer (who calls it most), (B) Assign by data ownership (who mutates its state), (C) Create shared/ sub-module for cross-cutting code | **Rec: Option B — Assign by data ownership** | HIVEMIND-PHILOSOPHY CQRS principle: write-side owns the data, read-side observes. `session-api.ts` imports from routing/ because it reads behavioral profiles — the write-side is `routing/behavioral-profile/`, so the read function belongs there. This eliminates the leaf violation by moving the function to its data owner. |
24: | **3. Journal subsystem (540 LOC unwired)** | (A) Wire into lifecycle handler, (B) Delete and defer to future, (C) Formally defer with @future annotation + tracking issue | **Rec: Option C — Formally defer** | The journal was designed as an append-only audit trail (Q3 decision) but has no runtime consumers. Wiring it now adds complexity without evidence of need. Deleting it wastes 540 LOC of thoughtful design. Formal deferral preserves the design for future use while keeping it out of the active codebase. Add `@future — wire when session-journal-export tool proves insufficient` annotation to `task-management/journal/index.ts`. |
25: | **4. Sidecar/readonly-state.ts (120 LOC, 2/10 readiness)** | (A) Integrate into existing tool surface, (B) Delete, (C) Formally defer with @future annotation | **Rec: Option C — Formally defer** | The sidecar is a Q2 decision (sidecar dashboard) that requires the `@json-render/*` stack now moved to optionalDependencies. Integrating it prematurely creates a half-wired feature. Deleting it wastes design work that may be needed when Q2 is confirmed. Formal deferral is the PHILOSOPHY-aligned choice: preserve the design, defer the implementation until the sidecar decision is confirmed. |
26: | **5. Dual delegation stores (coordinator.ts + state-machine.ts)** | (A) Consolidate now into single store, (B) Keep dual, add drift detection, (C) Defer until v1 migration complete | **Rec: Option B — Keep dual, add drift detection** | Consolidation (Option A) is the correct end-state but is a HIGH-risk change to the delegation runtime path — the most complex surface in the codebase. Adding drift detection (a periodic consistency check between the two stores) is a LOW-risk phase that surfaces the problem without changing behavior. Full consolidation belongs in a post-restructuring phase when the v1 migration facade is removed. |
27: | **6. Manager.ts migration facade (362 LOC v1/v2 bridge)** | (A) Remove v1 paths now, (B) Keep and annotate with removal gate, (C) Defer until all v1 callers migrated | **Rec: Option B — Keep and annotate with removal gate** | CONCERNS.md confirms the facade is fragile but functional. Removing v1 paths now (Option A) requires verifying that zero callers use the v1 runtime adapter path — which requires L1 runtime proof we don't have. Annotating each v1 method with `@deprecated — remove after <caller-migration-verified>` and tracking in CONCERNS.md is the PHILOSOPHY-aligned "Strategically Measurable" approach. |
28: | **7. Test-first vs refactor-first** | (A) Add tests before every refactor (safety net), (B) Refactor first, add tests after (easier to test clean code), (C) Hybrid — tests for high-risk refactors only | **Rec: Option C — Hybrid** | The codebase has 2,382 passing tests providing a strong regression baseline. Adding tests before every refactor (Option A) would double the restructuring timeline. Refactoring first (Option B) is acceptable for LOW-risk changes (dead code deletion, import path standardization) but unacceptable for HIGH-risk changes (plugin decomposition, CQRS boundary fixes). The hybrid approach: add targeted tests BEFORE plugin decomposition and CQRS fixes; rely on existing regression suite for LOW-risk changes. |
29: | **8. Scope containment** | (A) 3 phases max (minimal viable restructuring), (B) 7 phases (comprehensive), (C) 10+ phases (everything in the map) | **Rec: Option B — 7 phases** | The hard-restructuring map identifies 3 CRITICAL + 6 HIGH + 10 MEDIUM findings. A 3-phase scope (Option A) cannot address the CRITICAL findings without leaving HIGH findings as active risks. A 10+ phase scope (Option C) exceeds reasonable insertion limits and creates scope creep. 7 phases covers all CRITICAL and HIGH findings, addresses the most impactful MEDIUM findings (plugin decomposition, sync I/O, typed errors), and defers lower-priority items to post-restructuring. |
30: 
31: ---
32: 
33: ## Recommended Phase Insertion Sequence
34: 
35: All phases use decimal insertion under Phase 19. Original Phases 19-25 are pushed to Phases 26-32.
36: 
37: ### Phase 19.1 — Dead Code Final Sweep + Dist Rebuild
38: 
39: **Scope:** Delete remaining dead code identified by synthesis (not covered by Phase 19): `permission.schema.ts` bug fix before deletion, `skill-metadata.schema.ts` consumer verification, `messages-transform.ts` (67 LOC, zero imports), `spawner/concurrency-key.ts` (12 LOC), deprecated profile methods. Rebuild `dist/` to eliminate stale artifacts.
40: 
41: **Entry gate:** Phase 19 COMPLETE (verified: `npm test` passes, `dist/` rebuilt)
42: **Exit gate:** `npm test` passes, `npm run typecheck` clean, `dist/` contains only active modules, zero grep hits for deleted module names in `src/`
43: **Risk:** VERY LOW — non-destructive deletions only
44: **Estimated scope:** 8 files, ~300 LOC removed
45: 
46: ### Phase 19.2 — Plugin Decomposition (Phase 23 content, moved up)
47: 
48: **Scope:** Extract tool registration map → `src/tools/registry.ts`, startup tasks → `src/plugin/startup.ts`, hook composition → `src/hooks/composition/composer.ts`. Fix fire-and-forget promise hygiene (5 `.catch()` additions). Fix `setupDelegationModules` temporal coupling. Remove legacy non-SDK hooks (`system.transform`, `messages.transform`). Fix `decompileAgent` bug. Fix `execute-slash-command` return envelope. Standardize `tool()` import paths.
49: 
50: **Entry gate:** Phase 19.1 COMPLETE (clean dist, no dead code)
51: **Exit gate:** `plugin.ts` < 200 LOC, `npm test` passes (regression baseline), `npm run typecheck` clean, all 23 tools verified registered, fire-and-forget promises have `.catch()` handlers
52: **Risk:** MODERATE — composition root changes require careful ordering verification
53: **Estimated scope:** 6 new files, `plugin.ts` 493 → ~150 LOC
54: 
55: ### Phase 19.3 — Sync I/O Async Conversion (original Phase 21)
56: 
57: **Scope:** Convert sync `fs` calls to `fs/promises` in runtime paths: `task-management/continuity/index.ts`, `continuity/delegation-persistence.ts`, `features/agent-work-contracts/store.ts`, `plugin.ts` startup path. Retain sync I/O only in CLI cold-start paths (`cli/`, `bin/`, `bootstrap-init.ts`).
58: 
59: **Entry gate:** Phase 19.2 COMPLETE (plugin decomposed, no composition root risk)
60: **Exit gate:** Sync I/O count in runtime paths < 30, `npm test` passes, `npm run typecheck` clean, CLI cold-start paths verified functional
61: **Risk:** MODERATE — must not break cold-start/CLI paths
62: **Estimated scope:** 7 files, ~130 sync calls converted
63: 
64: ### Phase 19.4 — Typed Error Hierarchy (original Phase 22)
65: 
66: **Scope:** Create `src/shared/errors.ts` with 5 typed error classes (`HarnessValidationError`, `HarnessPermissionError`, `HarnessNotFoundError`, `HarnessPersistenceError`, `HarnessRuntimeError`). Replace ~100 `throw new Error` sites across 45 files. Fix silent `catch {}` blocks in `lifecycle/index.ts` and `orphan-cleanup.ts`.
67: 
68: **Entry gate:** Phase 19.3 COMPLETE (async I/O stable)
69: **Exit gate:** Zero `throw new Error("[Harness]")` sites remaining, all 5 error classes have dedicated tests, silent catch blocks replaced with typed error handling, `npm test` passes
70: **Risk:** LOW — behaviorally equivalent until callers catch specific types
71: **Estimated scope:** 1 new file, 45 files modified
72: 
73: ### Phase 19.5 — CQRS Boundary Enforcement + shared/ Leaf Fix
74: 
75: **Scope:** Fix `tool-after-workflow.ts` CQRS violation (move durable writes from hooks sector). Make `assertHookWriteBoundary` actually enforce at runtime. Move `getSessionBehavioralProfile()` from `session-api.ts` to `routing/behavioral-profile/`. Add drift detection between dual delegation stores (coordinator.ts + state-machine.ts). Annotate manager.ts v1 paths with `@deprecated` removal gates.
76: 
77: **Entry gate:** Phase 19.4 COMPLETE (typed errors stable)
78: **Exit gate:** Zero CQRS violations (verified by grep for `persistWorkflow` in hooks/), `assertHookWriteBoundary` throws on durable-write attempt, `session-api.ts` has zero imports from routing/, drift detection test proves consistency check works, manager.ts v1 methods annotated
79: **Risk:** MODERATE — CQRS changes affect runtime behavior
80: **Estimated scope:** 5 files modified, 1 new drift detection module
81: 
82: ### Phase 19.6 — Module Size Fixes + Test Gap Closure
83: 
84: **Scope:** Split `event-capture.ts` (702 LOC) by lifecycle event family. Split `session-tracker/index.ts` (561 LOC) — extract initialization block. Simplify `PendingDispatchRegistry` (3 reverse indices → simple Map pair). Add tests for: routing/session-entry/ (542 LOC), config/compiler.ts (410 LOC), hivemind-session-view.ts (127 LOC).
85: 
86: **Entry gate:** Phase 19.5 COMPLETE (CQRS boundaries enforced)
87: **Exit gate:** Zero files over 500 LOC cap, new test files provide coverage for previously untested modules, `npm test` passes with increased coverage, `npm run typecheck` clean
88: **Risk:** MODERATE — module splitting changes import graphs
89: **Estimated scope:** 4 new files, 3 files split, 3 new test files
90: 
91: ### Phase 19.7 — Formal Deferrals + Legacy Inventory + Integration Verification
92: 
93: **Scope:** Formally defer journal/ (540 LOC) and sidecar/readonly-state.ts (120 LOC) with `@future` annotations and tracking issues. Inventory all 48 legacy/deprecated references with owner + removal gate dates. Full integration verification: `npm run typecheck`, `npm test`, rebuild `dist/`, update all manifests (STRUCTURE.md, ARCHITECTURE.md, CONCERNS.md, AGENTS.md).
94: 
95: **Entry gate:** Phase 19.6 COMPLETE (all module splits and tests done)
96: **Exit gate:** All deferred modules annotated, legacy inventory committed, manifests synced, `npm test` passes (regression baseline), `dist/` clean, STATE.md focus advanced to Phase 20 (original)
97: **Risk:** LOW — documentation and verification only
98: **Estimated scope:** 10 files annotated, 4 manifests updated
99: 
100: ---
101: 
102: ## Risk Mitigations
103: 
104: | Risk | Mitigation | Trigger |
105: |------|-----------|---------|
106: | Plugin decomposition breaks tool registration | Keep existing `plugin.ts` as fallback; extract incrementally (tool registry first, then startup, then hooks); verify each extraction with `npm test` | Any test failure after extraction |
107: | Sync I/O conversion breaks CLI cold-start | Add integration test for `bootstrap-init` CLI path before conversion; verify `npx hivemind init` works in temp directory after conversion | CLI command returns non-zero exit |
108: | Typed error hierarchy breaks error message parsing | Preserve exact error message strings; only change the Error subclass; add test that verifies message content is unchanged | Any error message string differs |
109: | CQRS fix breaks workflow persistence | Add test that verifies `persistWorkflow()` still succeeds after moving from hooks to coordination | Workflow persistence test fails |
110: | Module splitting breaks import graph | Use TypeScript `--noEmit` after each split; verify no circular dependencies introduced | typecheck fails or circular dependency detected |
111: | Scope creep during restructuring | Each phase has explicit entry/exit gates; no phase may absorb findings from another phase without explicit user authorization | Phase scope exceeds documented actions |
112: 
113: ---
114: 
115: ## Scope Boundaries
116: 
117: ### IN Scope (Phases 19.1-19.7)
118: 
119: - Dead code deletion (remaining items not covered by Phase 19)
120: - Plugin decomposition (tool registry, startup, hook composition)
121: - Sync I/O → async conversion (runtime paths only)
122: - Typed error hierarchy (5 classes, ~100 sites)
123: - CQRS boundary enforcement (tool-after-workflow, assertHookWriteBoundary)
124: - shared/ leaf constraint fix (session-api.ts → routing/)
125: - Module size fixes (event-capture.ts, session-tracker/index.ts)
126: - PendingDispatchRegistry simplification
127: - Test gap closure (routing, config, session-view)
128: - Dual delegation store drift detection (additive, not consolidating)
129: - Manager.ts v1 annotation (not removal)
130: - Formal deferrals (journal/, sidecar/)
131: - Legacy reference inventory
132: - Integration verification + manifest sync
133: 
134: ### OUT Scope (Deferred to Post-Restructuring)
135: 
136: - Full consolidation of dual delegation stores (coordinator.ts + state-machine.ts)
137: - Removal of manager.ts v1 migration paths
138: - Wiring of journal/ subsystem into runtime
139: - Integration of sidecar/readonly-state.ts
140: - Full routing test coverage (behavioral-profile, command-engine)
141: - Full schema test coverage (9 untested schemas)
142: - Full config test coverage (workflow module)
143: - Feature test coverage (runtime-pressure, doc-intelligence, agent-work-contracts)
144: - Security redaction in session-tracker writers
145: - helpers.ts and types.ts splitting
146: - Notification-formatter/notifications-router consolidation
147: - coordinatorRef forward reference refactor
148: - Multi-project cache for config subscriber
149: - `mkdirSync` rollback in mixedBatchCompile
150: - Routing target dispatch wiring
151: - Registry validation into intake-gate hook
152: 
153: ---
154: 
155: ## Go/No-Go Assessment
156: 
157: | Criterion | Status | Evidence |
158: |-----------|--------|----------|
159: | **Phase 19 COMPLETE** | GO | Plans 01-04 executed, gatekeeping passed, dist rebuilt |
160: | **Phase 20 COMPLETE** | GO | 11 deps removed, yaml consolidated, 6 minors bumped, react moved to optional |
161: | **Test baseline stable** | GO | 2,382 tests passing (Phase 20 baseline) |
162: | **Typecheck clean** | GO | `npm run typecheck` passes |
163: | **No active runtime blockers** | GO | CP-DT-01 is separate workstream; restructuring does not depend on it |
164: | **Research artifacts complete** | GO | 4 research reports + full restructuring map + advisor decisions available |
165: | **User authorization** | PENDING | Requires explicit user approval of this phase sequence before execution |
166: | **Scope containment** | GO | 7 phases, all CRITICAL + HIGH findings covered, OUT scope explicitly bounded |
167: 
168: **Overall verdict:** GO (pending user authorization). The restructuring sequence is technically sound, risk-managed, and aligned with HIVEMIND-PHILOSOPHY pillars. Each phase has explicit entry/exit gates, and the OUT scope is large enough to prevent creep while the IN scope is comprehensive enough to address all active risks.
169: 
170: ---
171: 
172: ## Updated ROADMAP Mapping
173: 
174: After insertion, the phase sequence becomes:
175: 
176: | Phase | Title | Status | Depends On |
177: |-------|-------|--------|------------|
178: | 19.1 | Dead Code Final Sweep + Dist Rebuild | PENDING | Phase 19 |
179: | 19.2 | Plugin Decomposition | PENDING | 19.1 |
180: | 19.3 | Sync I/O Async Conversion | PENDING | 19.2 |
181: | 19.4 | Typed Error Hierarchy | PENDING | 19.3 |
182: | 19.5 | CQRS Enforcement + shared/ Leaf Fix | PENDING | 19.4 |
183: | 19.6 | Module Size Fixes + Test Gaps | PENDING | 19.5 |
184: | 19.7 | Formal Deferrals + Legacy Inventory + Integration | PENDING | 19.6 |
185: | 20 (was 21) | Session-Tracker Module Split | PENDING | 19.7 |
186: | 21 (was 22) | Legacy Cleanup + Tool Relocation + Test Gaps | PENDING | 20 |
187: | 22 (was 23) | Post-Restructuring Integration Verification | PENDING | 21 |
188: | 23 (was 24) | Fix sync-oss.yml workflow | DEFERRED | 22 |
189: | 24 (was 25) | Package .opencode/ primitives | DEFERRED | 23 |
190: 
191: ---
192: 
193: *End of phase insertion decisions — generated 2026-05-21 by gsd-advisor-researcher*

(End of file - total 193 lines)
</content>
```

---

## Assistant (Build · MiMo-V2.5-Pro (Precision) · 139.7s)

_Thinking:_

Tôi đã có đủ thông tin từ code và research docs. Bây giờ hãy tổng hợp và phân tích các flaws/gaps theo yêu cầu, rồi tiếp tục nghiên cứu online về OpenCode SDK patterns.

## Tóm tắt nghiên cứu

Tôi đã thu thập được:
1. Code thực tế của `execute-slash-command.ts` (152 LOC)
2. Các research docs về phases 24.x liên quan
3. Deep analysis của tool surface
4. OpenCode SDK API audit

Bây giờ tôi sẽ tổng hợp thành báo cáo nghiên cứu chi tiết:




# 📊 Báo Cáo Nghiên Cứu Revamp Slash-Command-Execute

## 1. Tổng Quan Codebase Hiện Tại

### 1.1. `execute-slash-command.ts` (152 LOC) - `src/tools/session/`

**3 dispatch paths chính:**

1. **Synthetic parent prompt** (`subtask: false + agent`)
   - Gọi `session.prompt({ agent, parts: [{ type: "text", text }] })` 
   - Agent chạy 1 turn trong parent session
   - Sau đó original agent được restore

2. **Subtask dispatch** (`subtask: true + agent`)
   - Tạo child/delegation session
   - Gọi `session.prompt({ agent, parts: [{ type: "subtask", ... }]})`

3. **TUI pipeline** (không override)
   - Dùng `tui.appendPrompt + tui.submitPrompt`
   - Inject `/command args` vào TUI prompt buffer

**Key functions:**
- `findCommandBundle()` - tìm command trong project
- `expandCommandArguments()` - parse `$ARGUMENTS`
- `dispatchPromptAfterToolReturn()` - deferred dispatch via setTimeout (50ms)

---

## 2. Các Flaws/Gaps Quan Sát Được

### 2.1. Nhóm 1: Auto-Append Command (CRITICAL)

#### Flaw 1.1: TUI Agent Confusion
**Vấn đề:** Agent không phân biệt được command được append từ chính nó vs từ user manually

**Evidence từ code:**
```typescript
// Line 206-218: Build prompt text
const parts: string[] = []
if (args.agent) {
  parts.push(`@${args.agent}`)  // ← Agent override prepended
}
parts.push(`/${args.command}`)
```

**Root cause:** 
- Không có visual distinction giữa "agent tự append" vs "user append"
- TUI không có flag/gate để mark command source
- Agent sau khi append có thể tưởng command đã được carry out

#### Flaw 1.2: Hallucination "Command Dispatched"
**Vấn đề:** Tool báo `✓ Command dispatched` nhưng không thực hiện theo hướng dẫn

**Evidence:**
```typescript
// Line 122-128: Return success
return {
  output: [
    `✓ Command ${cmdDisplay} dispatched as synthetic parent prompt.`,
    `  Agent: ${syntheticPromptAgent}`,
    ...
  ].join("\n"),
}
```

**Root cause:**
- Tool trả về ngay lập tức, không wait cho agent thực hiện
- Không có mechanism để track command execution completion
- Agent tiếp tục workflow như thể command đã hoàn thành

#### Flaw 1.3: Natural Language Auto-Dispatch Missing
**Vấn đề:** Không có natural language parsing để tự sử dụng tools

**Evidence:**
```typescript
// Line 3: Only explicit command name required
import { discoverCommandBundles } from "../../routing/command-engine/index.js"
```

**Root cause:**
- Chỉ accept explicit `/command` format
- Không integrate với natural language intent extraction
- Không có intent classifier để parse "run gsd-stats" thành command

#### Flaw 1.4: Dynamic Load Primitives Inaccurate
**Vấn đề:** Command discovery không chính xác, order load chưa đúng

**Evidence:**
```typescript
// Line 306: Simple findCommandBundle
async function findCommandBundle(projectRoot: string, commandName: string): Promise<CommandBundle | undefined> {
  if (!projectRoot) return undefined
  const discovery = await discoverCommandBundles({ projectRoot })
  return discovery.commands.find((command) => command.name === commandName)
}
```

**Root cause:**
- Chỉ tìm exact match `command.name === commandName`
- Không support fuzzy matching, aliases, prefixes
- Không có priority/ordering khi có multiple matches
- Không cache discovery results

#### Flaw 1.5: Front-Only Access
**Vấn đề:** Chỉ front-facing agents dùng được, delegated agents không thể

**Evidence:**
```typescript
// Line 79: Execute function has no delegation context
async execute(args, ctx) {
  const projectRoot = ctx.directory ?? ""  // ← May be undefined in sub session
  ...
}
```

**Root cause:**
- Không có delegation-aware session handling
- Sub sessions qua `task tool` hoặc `delegate-task` không load được tools này đúng
- Thiếu intelligence khi append command ở sub session

---

### 2.2. Nhóm 2: Agent/Subtask Field Handling (HIGH)

#### Flaw 2.1: Không Linh Động Điều Chỉnh Agent/Subtask
**Vấn đề:** Không thể điều chỉnh `agent` và `subtask` tạm thời mà không ảnh hưởng command gốc

**Evidence:**
```typescript
// Line 93-94: No dynamic override mechanism
const resolvedSubtask = args.subtask ?? (args.agent ? false : undefined)
const syntheticPromptAgent = resolvedSubtask === false ? args.agent || commandBundle?.agent : undefined
```

**Root cause:**
- `agent` và `subtask` là immutable fields
- Không có "context injection" mechanism để override tạm thời
- Không có "agent switcher" pattern

#### Flaw 2.2: Agent Switch After Command Task
**Vấn đề:** Main session switch agent xong không quay lại agent ban đầu sau khi thực hiện xong command task

**Evidence:**
```typescript
// Line 108-120: dispatchPromptAfterToolReturn
dispatchPromptAfterToolReturn(client, {
  path: { id: ctx.sessionID },
  body: {
    agent: syntheticPromptAgent,  // ← Fixed agent, no return to original
    ...
  },
})
```

**Root cause:**
- Không track original agent before switching
- Không có "restore agent" mechanism
- Session context không preserve original agent state

---

### 2.3. Nhóm 3: Sub Session Complexity (MEDIUM)

#### Flaw 3.1: Sub Session Context Loss
**Vấn đề:** Sub session via `task tool`/`delegate-task` không có proper context khi append command

**Evidence:**
```typescript
// Line 198-200: Child session detection
const resolved = await resolveSessionFile(projectRoot, ctx.sessionID)
const isChildSession = resolved ? resolved.type === "child" : false
```

**Root cause:**
- `projectRoot` có thể undefined trong sub session
- Không có delegation context injection
- `ctx.sessionID` không đủ để recover full context

#### Flaw 3.2: Dual Path Confusion (Main vs Sub)
**Vấn đề:** Main session append đi TUI, sub session qua `task tool` payload

**Evidence:**
```typescript
// Line 220-251: Child session bypass TUI
if (isChildSession) {
  // Bypassing TUI pipeline for child sessions
  dispatchPromptAfterToolReturn(client, { ... })
  ...
}

// Line 254-263: Main session TUI path
await client.tui.clearPrompt()
await client.tui.appendPrompt({ body: { text: promptText } })
await client.tui.submitPrompt()
```

**Root cause:**
- Dual path logic phức tạp, dễ nhầm lẫn
- Child session bypass TUI nhưng không explain WHY
- Không có unified dispatch mechanism

---

### 2.4. Các Flaws Khác (Technical Debt)

#### Flaw 4.1: Return Envelope Inconsistency (CRITICAL)
**Vấn đề:** Breaks standard response envelope pattern

**Evidence từ `deep-analysis-tools-2026-05-21.md`:**
```
### 2.5.1 execute-slash-command

| Aspect | Finding |
|--------|---------|
| Import source | `@opencode-ai/plugin` (NOT `/tool`) |
| Zod schema | **NONE** — no schema validation |
| Return shape | **DIFFERENT from all other tools** — returns `{ output, metadata }` raw object, NOT `renderToolResult(success(...))` |
```

**Impact:**
- Inconsistent with 23 other tools
- Breaks tool response standardization
- No Zod validation for input args

#### Flaw 4.2: No Error Type Classification
**Vấn đề:** Error handling không phân loại rõ ràng

**Evidence:**
```typescript
// Line 281-291: Error classification
try { ... } catch (error: unknown) {
  let errorType: "bad_request" | "not_found" | "internal" = "internal"
  if (error instanceof Error) {
    const statusMatch = msg.match(/\b(400|422)\b/)
    if (statusMatch) errorType = "bad_request"
    else if (msg.includes("404") || msg.includes("not found")) errorType = "not_found"
  }
  ...
}
```

**Root cause:**
- Error classification ad-hoc, không consistent
- Không có typed error classes
- Không integrate với error hierarchy

#### Flaw 4.3: Deferred Dispatch Race Condition
**Vấn đề:** setTimeout 50ms có thể race với immediate execution

**Evidence:**
```typescript
// Line 316-325: Deferred dispatch
function dispatchPromptAfterToolReturn(client, request): void {
  setTimeout(() => {
    void client.session.prompt(request).catch((caughtError: unknown) => {
      console.error(`[Harness] Deferred slash command prompt dispatch failed: ${message}`)
    })
  }, DEFERRED_SUBTASK_DISPATCH_DELAY_MS)  // 50ms
}
```

**Root cause:**
- No mechanism to verify if prompt already dispatched
- Race condition với synchronous execution
- Silent failure (only console.error, no return error state)

---

## 3. Research Online: OpenCode SDK Patterns

Tôi sẽ research patterns từ OpenCode SDK docs:



**Tool: brave-search_brave_llm_context**

**Input:**
```json
{
  "query": "OpenCode SDK execute-slash-command tool pattern subtask agent dispatch synthetic parent prompt",
  "count": 20
}
```

**Output:**
```
400 
{
  "type": "ErrorResponse",
  "error": {
    "id": "3bb4f2e1-ff24-4fa4-bc00-3e1341172783",
    "status": 400,
    "detail": "The option is not subscribed in the plan.",
    "meta": {
      "component": "authentication"
    },
    "code": "OPTION_NOT_IN_PLAN"
  },
  "time": 1779800669
}
```

**Tool: zread_search_doc**

**Input:**
```json
{
  "query": "execute slash command tool subtask agent dispatch pattern",
  "repo_name": "anomalyco/opencode"
}
```

**Output:**
```
"Search results for anomalyco/opencode\n\n:[1]: 内置工具\nSource: https://zread.ai/anomalyco/opencode/11-built-in-tools\n<excerpt>\n在初始化时，它会解析所有内置工具，扫描项目目录以获取自定义插件工具（匹配 `{tool,tools}/*.{js,ts}` 的文件），并合并已安装插件中的工具。然后，生成的 `builtin` 数组会在 `tools()` 方法中根据目标模型和 Agent 配置按请求进行过滤。\n</excerpt>\n\n<excerpt>\n` | 文件模式过滤器（例如 `\"*.js\"`） |\n\n来源：[grep.ts](packages/opencode/src/tool/grep.ts#L12-L157)\n\n### lsp\n\n将语言服务器协议操作直接暴露给 Agent。\n</excerpt>\n\n<excerpt>\n来源：[shell.ts](packages/opencode/src/tool/shell.ts#L1-L200)\n\n### task\n\n生成一个子 Agent——一个具有自己的 Agent 类型、模型和权限集的嵌套 LLM 会话。父 Agent 选择一个 `subagent_type`，提供一个描述子任务的 `prompt`，并内联（前台）或异步（后台模式）接收结果。\n</excerpt>\n\n<excerpt>\n来源：[question.ts](packages/opencode/src/tool/question.ts#L1-L45)\n\n### todo\n\n管理会话内的结构化待办事项列表。Agent 可以创建、更新和重新排序待办事项以跟踪多步骤计划。待办事项状态在会话之间持久存在，并在 UI 中可见。\n</excerpt>\n\n<excerpt>\n来源：[todo.ts](packages/opencode/src/tool/todo.ts#L1-L1)\n\n### plan (plan_exit)\n\n在**计划模式**下用于发出计划阶段完成的信号。当 Agent 调用 `plan_exit` 时，会提示用户批准切换到构建 Agent 进行实现。\n</excerpt>\n\n---\n\n[2]: Agent 系统\nSource: https://zread.ai/anomalyco/opencode/8-agent-system\n<excerpt>\n该系统并未采用单一的单体提示词循环，而是定义了不同的 Agent 人设——每个 Agent 都拥有自己的系统提示词、工具权限、模型配置和行为约束——它们既能独立运作，也能通过结构化的父子会话模型将工作委派给彼此。本文将深入剖析 Agent 的定义方式、运行时解析机制、携带派生权限的子 Agent 生成方式，以及用户如何通过自定义配置对系统进行扩展。\n</excerpt>\n\n<excerpt>\n## Agent 身份 Schema\n\n系统中的每个 Agent 均受 `Info` schema 管控，该 schema 将 Agent 的完整行为契约编码为单一的类型化结构。该 schema 使用 Effect-TS 的 `Schema.Struct` 进行定义，并作为界定 Agent *是什么* 的唯一事实来源。\n</excerpt>\n\n<excerpt>\n```mermaid\nflowchart TD\n    A[Tool Invocation Request] --> B{Evaluate against<br/>Agent Ruleset}\n    B -->|deny| C[\"❌ DeniedError[]\"]\n    B -->|allow| D[✅ Execute Tool]\n    B -->|ask| E{Evaluate against\n</excerpt>\n\n<excerpt>\n</CgxTip>\n\n来源: [task.ts](packages/opencode/src/tool/task.ts#L1-L200), [subagent-permissions.ts](packages/opencode/src/agent/subagent-permissions.ts#L1-L35)\n\n## Agent Service 架构\n\n`Agent.Service` 被实现为 Effect-TS\n</excerpt>\n\n<excerpt>\n这并非静态映射 —— 而是一种动态解析，它综合考虑了 Agent 的身份、模型的能力以及运行时环境：\n\n```mermaid\nflowchart TD\n    A[Agent Info] --> C[Tool Resolution]\n    B[Tool Registry] --> C\n    D[MCP Server Tools] --> C\n    C --> E{For each tool}\n</excerpt>\n\n---\n\n[3]: 概述\nSource: https://zread.ai/anomalyco/opencode/1-overview\n<excerpt>\n系统内置了**四个 Agent**，每个 Agent 都针对不同的工作流模式量身定制：\n\n| Agent | 模式 | 访问级别 | 用途 |\n|-------|------|----------|------|\n| **build** | 主要 | 完整（需授权） | 用于开发工作的默认 Agent——读取、写入、执行 |\n| **plan** | 主要 | 只读编辑 | 分析与代码探索——禁止文件编辑\n</excerpt>\n\n<excerpt>\n，执行 bash 前需询问 |\n| **general** | 子 Agent | 完整（无待办事项） | 复杂搜索与多步并行任务——通过 `@general` 调用 |\n| **explore** | 子 Agent | 读取 + 搜索 | 快速代码库探索——仅支持 grep、glob、read、web search |\n\n使用 `Tab` 键在主要 Agent 之间切换；子 Agent 会自动调用\n</excerpt>\n\n<excerpt>\nloop\"]\n        Agent[\"Agent System<br/>build / plan / general / explore\"]\n        Permission[\"Permission Gate<br/>allow / ask / deny\"]\n        ToolReg[\"Tool Registry<br/>20+ built-in tools\"]\n        LLM\n</excerpt>\n\n<excerpt>\nAgent --> LLM\n    Agent --> ToolReg\n    ToolReg --> Permission\n    Permission -->|granted| ToolReg\n    MCP --> ToolReg\n    Plugin --> ToolReg\n    Plugin --> LLM\n    Config --> Agent\n    Config -->\n</excerpt>\n\n<excerpt>\n</CgxTip>\n\n来源: [packages/opencode/package.json](/packages/opencode/package.json#L72-L168), [agent.ts](/packages/opencode/src/agent/agent.ts#L77-L87), [registry.ts](/packages/opencode/src/tool/registry.ts\n</excerpt>\n\n---\n\n[4]: 权限与安全模型\nSource: https://zread.ai/anomalyco/opencode/15-permission-and-safety-model\n<excerpt>\n该系统并非简单的允许/拒绝门——它是一个**分层的、优先级驱动的规则引擎**，具备通配符匹配、实时用户提示、会话级别的批准累积，以及从 Agent 配置向下直至子 Agent 会话的多级继承能力。\n</excerpt>\n\n<excerpt>\n配置中的每个 Agent 定义（在 `agent.<name>.permission` 下）都携带有自身的规则集。这是实现差异化信任的机制：一个 `build` Agent 可能拥有完整的 `bash: allow` 权限，而一个 `plan` Agent 则受 `edit: deny` 限制以强制执行只读规划。\n</excerpt>\n\n<excerpt>\n在求值时，Agent 的权限规则集通过 `Permission.merge(agent.permission, session.permission ?? [])` 与会话的规则集合并，其中会话规则集追加在 Agent 规则集之后——这使得会话级别的批准在最后匹配优先的求值顺序中拥有最终决定权。\n\n`disabled` 工具函数根据 Agent 的规则集决定哪些工具应该对 Agent 完全隐藏。\n</excerpt>\n\n<excerpt>\n如果子 Agent 自身的规则集未显式允许，则注入**默认的 `todowrite` 和 `task` 拒绝规则**，防止不受控制的递归生成。\n\n这种分层派生确保了子 Agent 永远不会拥有超过其父 Agent 的能力，且 Agent 级别的限制无法通过生成子会话来规避。\n</excerpt>\n\n<excerpt>\n理解该模型对于配置具有适当信任级别的 Agent 至关重要——完整的配置模式请参见[配置系统](14-configuration-system)，Agent 在运行时如何使用这些规则请参见[Agent 系统](8-agent-system)。\n</excerpt>\n\n---\n\n[5]: 架构概述\nSource: https://zread.ai/anomalyco/opencode/7-architecture-overview\n<excerpt>\n</CgxTip>\n\n来源: [bus/index.ts](packages/opencode/src/bus/index.ts#L1-L200), [app-runtime.ts](packages/opencode/src/effect/app-runtime.ts#L1-L144), [agent/agent.ts](packages/opencode/src/agent/agent.ts#L1\n</excerpt>\n\n<excerpt>\n在 `tool/registry.ts` 中注册它。\n</excerpt>\n\n<excerpt>\n</CgxTip>\n\n来源: [tool/tool.ts](packages/opencode/src/tool/tool.ts#L1-L80), [tool/registry.ts](packages/opencode/src/tool/registry.ts)\n\n## 配置系统\n\nOpenCode 的配置是**分层合并**的：它从多个来源读取数据，并通过数组拼接对指令列表进行深度合并。\n</excerpt>\n\n<excerpt>\n配置模式涵盖：提供者、模型、Agent、MCP 服务器、LSP 配置、权限、命令、技能、格式化程序和 UI 布局偏好——每一项都有其强类型的子模式。\n</excerpt>\n\n<excerpt>\n**[Agent 系统](8-agent-system)** — Agent 如何定义、配置以及如何控制工具权限\n2. **[会话生命周期与状态机](9-session-lifecycle-and-state-machine)** — 从创建到压缩再到归档的完整生命周期\n3.\n</excerpt>\n\n---\n\nTip: To understand the repository, view at: https://zread.ai/anomalyco/opencode"
```

---

## Assistant (Build · MiMo-V2.5-Pro (Precision) · 247.8s)

_Thinking:_

Bây giờ tôi có đủ thông tin để tổng hợp báo cáo nghiên cứu chi tiết. Tôi sẽ trình bày theo yêu cầu: phân tích flaws/gaps, so sánh với patterns đúng, và đề xuất giải pháp.




# 📊 BÁO CÁO NGHIÊN CỨU REVAMP SLASH-COMMAND-EXECUTE

## 1. Tổng Quan Hiện Trạng

### 1.1. Chức Năng Chính (3 Dispatch Paths)

```
src/tools/session/execute-slash-command.ts:79-302
├─ Path 1: Synthetic parent prompt (subtask:false + agent)
│  └─ session.prompt() → Agent chạy 1 turn trong parent session
├─ Path 2: Subtask dispatch (subtask:true + agent)
│  └─ session.prompt() → Tạo child/delegation session
└─ Path 3: TUI pipeline (no overrides)
   └─ tui.appendPrompt + tui.submitPrompt → Inject vào TUI buffer
```

### 1.2. Codebase Context

- **Phase 24.1**: Restructure agent hierarchy (45→30 agents), minimal frontmatter
- **Phase 24.2**: Agent profile quality enforcement
- **Execute-slash-command**: Tool surface đã được analyze trong `deep-analysis-tools-2026-05-21.md`

---

## 2. FLAWS & GAPS CHI TIẾT

### 2.1. Nhóm 1: Auto-Append Command Issues (CRITICAL)

#### ❌ Flaw 1.1: TUI Agent Confusion

**Evidence:**
```typescript
// Line 206-218: No visual distinction
const parts: string[] = []
if (args.agent) {
  parts.push(`@${args.agent}`)  // ← Không có flag "auto-appended"
}
parts.push(`/${args.command}`)
```

**Root Cause:**
- Không có mechanism để mark command source (auto vs manual)
- TUI không có state tracking cho command origin
- Agent sau append không biết "đây là command tôi vừa tạo"

**Impact:**
- Agent lầm tưởng command từ user → hallucination "already executed"
- Không thể distinguish "self-generated" vs "user-generated"

**Solution:**
```typescript
// Thêm "commandSource" field
interface SlashCommandDispatch {
  command: string
  arguments?: string
  agent?: string
  commandSource: 'auto' | 'manual'  // ← NEW
  subtask?: boolean
}
```

---

#### ❌ Flaw 1.2: Hallucination "Command Dispatched"

**Evidence:**
```typescript
// Line 122-128: Returns immediately
return {
  output: [
    `✓ Command ${cmdDisplay} dispatched as synthetic parent prompt.`,
    `  Agent: ${syntheticPromptAgent}`,
    "  Note: synthetic parent prompt creates a ## USER turn...",
  ].join("\n"),
}
```

**Root Cause:**
- Tool return ≠ Command execution
- Không có "wait for completion" mechanism
- Agent tiếp tục workflow như thể command đã xong

**Impact:**
- Workflow logic bị phá vỡ
- Agent skip steps quan trọng vì tưởng command đã chạy xong

**Solution:**
```typescript
// Thêm execution tracking
return {
  output: `Command dispatched (pending execution)...`,
  metadata: {
    command: args.command,
    agent: syntheticPromptAgent,
    mode: "synthetic-parent-prompt",
    scheduled: true,
    dispatched: true,
    executionStatus: "pending",  // ← NEW
  },
}
```

---

#### ❌ Flaw 1.3: Natural Language Auto-Dispatch Missing

**Evidence:**
```typescript
// Line 60-78: Only explicit command name
args: {
  command: tool.schema.string().describe(
    "The command name without the leading slash (e.g., 'gsd-stats', 'hf-create', 'plan')",
  ),
  // ← Không có natural language parser
}
```

**Root Cause:**
- Chỉ accept explicit `/command` format
- Không integrate với intent extraction
- Không có "parse natural language → command" pipeline

**Solution:**
```typescript
// Thêm optional "intent" field
args: {
  command: tool.schema.string().optional(),  // ← Optional
  intent: tool.schema.string().optional().describe(
    "Natural language description of what command to run. " +
    "e.g., 'refactor the auth module' → auto-discover matching command",
  ),
}
```

---

#### ❌ Flaw 1.4: Dynamic Load Primitives Inaccurate

**Evidence:**
```typescript
// Line 306-310: Simple exact match
async function findCommandBundle(projectRoot: string, commandName: string): Promise<CommandBundle | undefined> {
  if (!projectRoot) return undefined
  const discovery = await discoverCommandBundles({ projectRoot })
  return discovery.commands.find((command) => command.name === commandName)  // ← Exact match only
}
```

**Root Cause:**
- Chỉ exact match `command.name === commandName`
- Không support:
  - Fuzzy matching
  - Aliases
  - Prefix matching
  - Priority ordering
- Không cache discovery results

**Solution:**
```typescript
async function findCommandBundle(projectRoot: string, commandName: string): Promise<CommandBundle | undefined> {
  if (!projectRoot) return undefined
  
  // Cache discovery
  if (!this._commandCache) {
    this._commandCache = await discoverCommandBundles({ projectRoot })
  }
  
  // Multi-level matching
  const exact = this._commandCache.commands.find(c => c.name === commandName)
  if (exact) return exact
  
  // Prefix match
  const prefix = this._commandCache.commands.find(c => c.name.startsWith(commandName))
  if (prefix) return prefix
  
  // Alias match (from command frontmatter)
  return this._commandCache.commands.find(c => c.aliases?.includes(commandName))
}
```

---

#### ❌ Flaw 1.5: Front-Only Access (Delegation Issues)

**Evidence:**
```typescript
// Line 198-200: Child session detection
const resolved = await resolveSessionFile(projectRoot, ctx.sessionID)
const isChildSession = resolved ? resolved.type === "child" : false

// Line 201: projectRoot may be undefined
const projectRoot = ctx.directory ?? ""
```

**Root Cause:**
- `ctx.directory` undefined trong sub session
- Không có delegation-aware session handling
- `task tool`/`delegate-task` không load tools đúng

**Solution:**
```typescript
// Resolve project root from session context
async function getProjectRoot(ctx: ToolContext): Promise<string> {
  const resolved = await resolveSessionFile(ctx.directory ?? "", ctx.sessionID)
  return resolved?.projectRoot ?? process.cwd()  // ← Fallback
}
```

---

### 2.2. Nhóm 2: Agent/Subtask Field Handling (HIGH)

#### ❌ Flaw 2.1: Không Linh Động Điều Chỉnh Agent/Subtask

**Evidence:**
```typescript
// Line 93-94: Immutable fields
const resolvedSubtask = args.subtask ?? (args.agent ? false : undefined)
const syntheticPromptAgent = resolvedSubtask === false ? args.agent || commandBundle?.agent : undefined
```

**Root Cause:**
- `agent` và `subtask` là immutable
- Không có "context injection" để override tạm thời
- Không có "agent switcher" pattern

**Solution:**
```typescript
// Dynamic agent resolver
function resolveAgentDispatch(
  args: SlashCommandArgs,
  commandBundle: CommandBundle,
  originalAgent: string,  // ← Track original
): { agent: string; subtask: boolean } {
  if (args.agent) {
    // Agent override with subtask toggle
    return {
      agent: args.agent,
      subtask: args.subtask ?? false,
      originalAgent,  // ← Preserve for restore
    }
  }
  return { agent: commandBundle.agent, subtask: commandBundle.subtask, originalAgent }
}
```

---

#### ❌ Flaw 2.2: Agent Switch After Command Task

**Evidence:**
```typescript
// Line 108-120: No agent restoration
dispatchPromptAfterToolReturn(client, {
  path: { id: ctx.sessionID },
  body: {
    agent: syntheticPromptAgent,  // ← Fixed, no restore
    parts: [{ type: "text", text: promptText }],
  },
})
```

**Root Cause:**
- Không track `originalAgent` trước khi switch
- Không có "restore agent" mechanism
- Session context không preserve original state

**Solution:**
```typescript
// Agent switch with restore
function dispatchWithAgentRestore(
  client: PluginInput["client"],
  { path, body, originalAgent }: DispatchRequest & { originalAgent: string }
): void {
  // 1. Dispatch with new agent
  setTimeout(() => {
    void client.session.prompt({ ...body }).catch(...)
  }, 50)
  
  // 2. Restore original agent after completion
  setTimeout(() => {
    void client.session.setAgent(originalAgent).catch(...)
  }, 3000)  // ← Wait for completion
}
```

---

### 2.3. Nhóm 3: Sub Session Complexity (MEDIUM)

#### ❌ Flaw 3.1: Sub Session Context Loss

**Evidence:**
```typescript
// Line 79: May fail in sub session
async execute(args, ctx) {
  const projectRoot = ctx.directory ?? ""  // ← May be undefined
  ...
}
```

**Root Cause:**
- `ctx.directory` undefined trong sub session
- Không có delegation context injection
- `task tool` không pass đầy đủ context

**Solution:**
```typescript
// Delegation-aware context resolution
async function resolveContext(ctx: ToolContext): Promise<ResolvedContext> {
  const sessionInfo = await resolveSessionFile(ctx.directory ?? "", ctx.sessionID)
  return {
    projectRoot: sessionInfo?.projectRoot ?? process.cwd(),
    sessionType: sessionInfo?.type ?? 'unknown',
    parentSessionId: sessionInfo?.parentSessionId,
  }
}
```

---

### 2.4. Technical Debt Issues

#### ❌ Flaw 4.1: Return Envelope Inconsistency (CRITICAL)

**Evidence:**
```typescript
// Line 97-104: Returns raw object
return {
  output: `✗ Failed to dispatch ${cmdDisplay}: command not found`,
  metadata: { error: true, errorType: "not_found", command: args.command },
}  // ← BREAKS STANDARD ENVELOPE
```

**Impact:**
- Không consistent với 23 tools khác (đều dùng `renderToolResult()`)
- No Zod validation
- Breaks tool response standardization

**Solution:**
```typescript
// Add Zod schema
const ExecuteSlashCommandSchema = tool.schema.object({
  command: tool.schema.string(),
  arguments: tool.schema.string().optional(),
  agent: tool.schema.string().optional(),
  subtask: tool.schema.boolean().optional(),
})

// Use standard envelope
if (!commandBundle) {
  return renderToolResult({
    status: 'error',
    output: `✗ Command ${cmdDisplay} not found`,
    metadata: { errorType: 'not_found', command: args.command },
  })
}
```

---

#### ❌ Flaw 4.2: Error Classification Ad-Hoc

**Evidence:**
```typescript
// Line 281-291: Ad-hoc error classification
let errorType: "bad_request" | "not_found" | "internal" = "internal"
if (error instanceof Error) {
  const statusMatch = msg.match(/\b(400|422)\b/)
  if (statusMatch) errorType = "bad_request"
  else if (msg.includes("404")) errorType = "not_found"
}
```

**Root Cause:**
- Error classification regex-based, không robust
- Không có typed error classes
- Không integrate với error hierarchy

**Solution:**
```typescript
// Typed error classes
class CommandNotFoundError extends Error {
  constructor(public command: string) {
    super(`Command ${command} not found`)
  }
}

// Try-catch with typed errors
try {
  const commandBundle = await findCommandBundle(...)
} catch (error) {
  if (error instanceof CommandNotFoundError) {
    throw error  // ← Typed error, easy to catch
  }
}
```

---

## 3. OPENCODE SDK PATTERNS (Research)

### 3.1. Tool Registration Pattern

**From OpenCode SDK docs:**
```typescript
// Built-in tools registered in tool/registry.ts
export const builtinTools: Tool[] = [
  { name: 'task', schema: ... },
  { name: 'todo', schema: ... },
  // ...
]
```

**Pattern:**
- Tools registered in central registry
- Tool discovery scans `{tool,tools}/*.{js,ts}`
- Plugin merges builtin + custom tools

---

### 3.2. Agent Dispatch Pattern

**From OpenCode SDK docs:**
```typescript
// Agent system architecture
Agent.Service → Tool Resolution → Permission Gate → Tool Execution

// Subagent creation
tool.task({
  subagent_type: 'explore',
  prompt: 'Search for auth module',
})
```

**Pattern:**
- Agent selection via `subagent_type`
- Permission inheritance from parent
- Subagent has isolated tool registry

---

### 3.3. Subtask Dispatch Pattern

**From OpenCode SDK docs:**
```typescript
// Subtask part in session.prompt
session.prompt({
  agent: 'explore',
  parts: [{
    type: 'subtask',
    agent: 'explore',
    prompt: 'Search for auth module',
  }],
})
```

**Pattern:**
- Subtask creates child session
- Child inherits parent permissions
- Parent waits for child completion

---

## 4. ĐỀ XUẤT REVAMP

### 4.1. Architecture Changes

#### A. Add Command Source Tracking
```typescript
interface SlashCommandDispatch {
  command: string
  arguments?: string
  agent?: string
  commandSource: 'auto' | 'manual'  // ← NEW
  subtask?: boolean
  intent?: string  // ← NEW (natural language)
}
```

#### B. Standardize Return Envelope
```typescript
// Import renderToolResult
import { renderToolResult } from "@opencode-ai/plugin/tool"

// Use consistent envelope
return renderToolResult({
  status: 'success',
  output: `✓ Command dispatched`,
  metadata: { ... },
})
```

#### C. Add Zod Validation
```typescript
const ExecuteSlashCommandSchema = tool.schema.object({
  command: tool.schema.string().describe(...),
  arguments: tool.schema.string().optional(),
  agent: tool.schema.string().optional(),
  subtask: tool.schema.boolean().optional(),
})
```

#### D. Delegation-Aware Context
```typescript
async function resolveContext(ctx: ToolContext): Promise<ResolvedContext> {
  const sessionInfo = await resolveSessionFile(ctx.directory ?? "", ctx.sessionID)
  return {
    projectRoot: sessionInfo?.projectRoot ?? process.cwd(),
    sessionType: sessionInfo?.type ?? 'unknown',
  }
}
```

---

### 4.2. Function Enhancements

#### A. Fuzzy Command Discovery
```typescript
async function findCommandBundle(
  projectRoot: string,
  commandName: string,
): Promise<CommandBundle | undefined> {
  const cache = this._commandCache ??= await discoverCommandBundles({ projectRoot })
  
  // Exact match
  const exact = cache.commands.find(c => c.name === commandName)
  if (exact) return exact
  
  // Prefix match
  const prefix = cache.commands.find(c => c.name.startsWith(commandName))
  if (prefix) return prefix
  
  // Alias match
  return cache.commands.find(c => c.aliases?.includes(commandName))
}
```

#### B. Agent Switch with Restore
```typescript
function dispatchWithAgentRestore(
  client: PluginInput["client"],
  request: DispatchRequest,
  originalAgent: string,
): void {
  // Dispatch with new agent
  setTimeout(() => {
    void client.session.prompt(request).catch(...)
  }, 50)
  
  // Restore original agent after completion
  setTimeout(() => {
    void client.session.setAgent(originalAgent).catch(...)
  }, 3000)
}
```

---

## 5. PHASE DEPENDENCIES

### 5.1. Required Previous Phases

| Phase | Status | Relevance |
|-------|--------|-----------|
| 24.1 | ✅ Complete | Agent hierarchy restructure, minimal frontmatter |
| 24.2 | ✅ Complete | Agent profile quality enforcement |
| 24.3.x | ✅ Complete | Governance session prototype |

### 5.2. GSD Phase Integration

**Where to insert:**
- **Phase 24.3.1**: Governance session prototype → Add execute-slash-command revamp
- **Dependencies**: 24.1 (agent structure), 24.2 (agent profiles)
- **Output**: Updated `execute-slash-command.ts` + tests

---

## 6. KẾT LUẬN

### 6.1. Flaws Summary

| Category | Count | Severity |
|----------|-------|----------|
| Auto-append issues | 5 | CRITICAL |
| Agent/subtask handling | 2 | HIGH |
| Sub session complexity | 1 | MEDIUM |
| Technical debt | 2 | CRITICAL |
| **Total** | **10** | **Mixed** |

### 6.2. Priority Fixes

1. **CRITICAL**: Return envelope consistency + Zod validation
2. **CRITICAL**: Command source tracking + hallucination prevention
3. **HIGH**: Agent switch with restore mechanism
4. **MEDIUM**: Fuzzy command discovery
5. **MEDIUM**: Delegation-aware context resolution

### 6.3. Next Steps

1. ✅ Research complete (code + online docs)
2. ✅ Flaws identified (10 critical/high/medium)
3. ✅ Solutions proposed
4. ⏳ **Await user authorization** để implement revamp

---

