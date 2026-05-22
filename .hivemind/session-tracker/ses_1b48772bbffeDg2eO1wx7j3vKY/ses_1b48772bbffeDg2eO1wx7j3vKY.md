---
sessionID: ses_1b48772bbffeDg2eO1wx7j3vKY
created: 2026-05-21T16:57:32.309Z
updated: 2026-05-22T09:13:40.691Z
parentSessionID: null
delegationDepth: 0
children: []
continuityIndex: session-continuity.json
status: idle
---

## USER (turn 1)

**source:** real-human

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

<tìm lại các implementation liên quan tới execute-slash-command để thật sự nâng cấp nó vì nó làm chưa thật sự đúng lắm khi thiếu một số chức năng như sau - không thể điều chỉnh thay đổi front-facing agent qua TUI trước khi append slash commands, agents còn lẫn lộn khi sử dụng nó vì khi chạy @agent- + với slash thì sẽ chẳng execute gì được cả  --- thay vào đó nó phải có lựa chọn cả 2 cơ chế sau đây sử dụng chính OpenCode SDK là switch to intended agent trước rồi mới append slash command lúc này front facing sẽ thay đổi ngay trên TUI của user - và cơ chế chạy slash command với agent định trước đó rồi sau khi hoàn thành lượt sẽ quay lại về agent mà user lựa chọn. Ngoài ra sự thiếu hiểu biết của chức năng này về các primitives của OpenCode cách nó bố trí tại .opencode/command(s) ; agent(s) , cho cả số ít và số nhiều, cho project và global cũng như các primitives này stack với nhau như thế nào qua $ARGUMENTS qua field agent và subtask: true/false etc khiến các chức năng liên đới và chính nó bị thiết kế với rất nhiều gaps và lỗi mà cần nghiên cứu sâu để hiểu rõ thêm vì nó có liên đới chặt chẽ với task tool để delegate - ví dụ khi sử dụng execute-slash-command agent phải load được hệ thống agents đang có (các lựa chọn cấp bậc, mode như all, primary và subagent) các commands và fields để khi đưa tool vào nó có thể điều chỉnh nhanh và stack hợp lý vì có những command trước khi chạy có thể điều chỉnh thành subtask: true và thêm agent: vàod dó thì có thể biến thành một slash commands chạy bằng task tool delegation thay vì append foreground. Thêm nữa là đối với các slash commands có chứa flags và thêm parsing number hay fields như gsd và parse các references, templates, hay tài liệu khác kèm theo thì hệ thống này vẫn chưa có thể làm được nghiên cứu thêm cách của GSD đang làm khi chạy gsd-plan-phase 11 --skip reseach chẳng hạn nó chỉ xuất phát từ gsd-plan-phase nhưng nó parse các context dạng text dot md theo sau và tự động parse những gì của phase 11 và lựa chọn bỏ qua research chẳng hạn.  Đề nghị route gsd để investigate, research, running advisor và deep research từ cả @.hivemind/STACKS-REFERENCES.md và các gợi ý từ @repo-for-learning-and-synthesis.md  trước khi đưa ra phân tích hay đề xuất gì, tất cả đều thực hiện qua task tool delegation và route gsd>>
Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.hivemind/STACKS-REFERENCES.md"}
<path>/Users/apple/hivemind-plugin-private/.hivemind/STACKS-REFERENCES.md</path>
<type>file</type>
<content>
1: ## HiveMind `package.json` — Complete Stack Reference
2: 
3: **Audit date: 2026-05-10 | Source: npm registry live + GitHub API verification | All repos confirmed active (not archived)**
4: 
5: ### CRITICAL: OpenCode Packages
6: 
7: These publish **no repository metadata to npm** (`repository: {}`). The legacy `opencode-ai/opencode` GitHub is **archived**. The actual active repo:
8: 
9: | Package | pkg.json | npm Latest | Source (NOT on npm) | npm |
10: |---------|----------|------------|---------------------|-----|
11: | `@opencode-ai/sdk` | `^1.14.41` | `1.14.44` | [anomalyco/opencode](https://github.com/anomalyco/opencode) | [npm](https://www.npmjs.com/package/@opencode-ai/sdk) |
12: | `@opencode-ai/plugin` | `^1.14.41` (peer+dev) | `1.14.44` | [anomalyco/opencode](https://github.com/anomalyco/opencode) | [npm](https://www.npmjs.com/package/@opencode-ai/plugin) |
13: 
14: > **WARNING:** `opencode-ai/opencode` is archived legacy. Active development: [`anomalyco/opencode`](https://github.com/anomalyco/opencode) by [Anomaly](https://anoma.ly). Website: [opencode.ai](https://opencode.ai), Docs: [opencode.ai/docs](https://opencode.ai/docs)
15: 
16: ---
17: 
18: ### Dependencies (27 packages)
19: 
20: | # | Package | pkg.json Ver | npm Latest | GitHub | npm |
21: |---|---------|-------------|------------|--------|-----|
22: | 1 | `@opencode-ai/sdk` | `^1.14.41` | `1.14.44` | [anomalyco/opencode](https://github.com/anomalyco/opencode) | [npm](https://www.npmjs.com/package/@opencode-ai/sdk) |
23: | 2 | `@ast-grep/cli` | `^0.42.1` | `0.42.1` | [ast-grep/ast-grep](https://github.com/ast-grep/ast-grep) | [npm](https://www.npmjs.com/package/@ast-grep/cli) |
24: | 3 | `@ast-grep/napi` | `^0.42.1` | `0.42.1` | [ast-grep/ast-grep](https://github.com/ast-grep/ast-grep) | [npm](https://www.npmjs.com/package/@ast-grep/napi) |
25: | 4 | `@clack/prompts` | `^1.3.0` | `1.3.0` | [bombshell-dev/clack](https://github.com/bombshell-dev/clack) | [npm](https://www.npmjs.com/package/@clack/prompts) |
26: | 5 | `@json-render/core` | `^0.18.0` | `0.19.0` | [vercel-labs/json-render](https://github.com/vercel-labs/json-render) | [npm](https://www.npmjs.com/package/@json-render/core) |
27: | 6 | `@json-render/ink` | `^0.18.0` | `0.19.0` | [vercel-labs/json-render](https://github.com/vercel-labs/json-render) | [npm](https://www.npmjs.com/package/@json-render/ink) |
28: | 7 | `@json-render/next` | `^0.18.0` | `0.19.0` | [vercel-labs/json-render](https://github.com/vercel-labs/json-render) | [npm](https://www.npmjs.com/package/@json-render/next) |
29: | 8 | `@json-render/react` | `^0.18.0` | `0.19.0` | [vercel-labs/json-render](https://github.com/vercel-labs/json-render) | [npm](https://www.npmjs.com/package/@json-render/react) |
30: | 9 | `@json-render/react-pdf` | `^0.18.0` | `0.19.0` | [vercel-labs/json-render](https://github.com/vercel-labs/json-render) | [npm](https://www.npmjs.com/package/@json-render/react-pdf) |
31: | 10 | `@modelcontextprotocol/sdk` | `^1.29.0` | `1.29.0` | [modelcontextprotocol/typescript-sdk](https://github.com/modelcontextprotocol/typescript-sdk) | [npm](https://www.npmjs.com/package/@modelcontextprotocol/sdk) |
32: | 11 | `bun-pty` | `^0.4.8` | `0.4.8` | [sursaone/bun-pty](https://github.com/sursaone/bun-pty) | [npm](https://www.npmjs.com/package/bun-pty) |
33: | 12 | `bun-types` | `^1.3.13` | `1.3.13` | [oven-sh/bun](https://github.com/oven-sh/bun) | [npm](https://www.npmjs.com/package/bun-types) |
34: | 13 | `commander` | `^14.0.3` | `14.0.3` | [tj/commander.js](https://github.com/tj/commander.js) | [npm](https://www.npmjs.com/package/commander) |
35: | 14 | `diff` | `^9.0.0` | `9.0.0` | [kpdecker/jsdiff](https://github.com/kpdecker/jsdiff) | [npm](https://www.npmjs.com/package/diff) |
36: | 15 | `fast-glob` | `^3.3.3` | `3.3.3` | [mrmlnc/fast-glob](https://github.com/mrmlnc/fast-glob) | [npm](https://www.npmjs.com/package/fast-glob) |
37: | 16 | `fast-xml-parser` | `^5.7.3` | `5.7.3` | [NaturalIntelligence/fast-xml-parser](https://github.com/NaturalIntelligence/fast-xml-parser) | [npm](https://www.npmjs.com/package/fast-xml-parser) |
38: | 17 | `gray-matter` | `^4.0.3` | `4.0.3` | [jonschlinkert/gray-matter](https://github.com/jonschlinkert/gray-matter) | [npm](https://www.npmjs.com/package/gray-matter) |
39: | 18 | `ink` | `^6.8.0` | `7.0.2` | [vadimdemedes/ink](https://github.com/vadimdemedes/ink) | [npm](https://www.npmjs.com/package/ink) |
40: | 19 | `js-yaml` | `^4.1.1` | `4.1.1` | [nodeca/js-yaml](https://github.com/nodeca/js-yaml) | [npm](https://www.npmjs.com/package/js-yaml) |
41: | 20 | `jsonc-parser` | `^3.3.1` | `3.3.1` | [microsoft/node-jsonc-parser](https://github.com/microsoft/node-jsonc-parser) | [npm](https://www.npmjs.com/package/jsonc-parser) |
42: | 21 | `node-pty` | `^1.1.0` | `1.1.0` | [microsoft/node-pty](https://github.com/microsoft/node-pty) | [npm](https://www.npmjs.com/package/node-pty) |
43: | 22 | `react` | `^19.2.6` | `19.2.6` | [facebook/react](https://github.com/facebook/react) | [npm](https://www.npmjs.com/package/react) |
44: | 23 | `tree-sitter-javascript` | `^0.25.0` | `0.25.0` | [tree-sitter/tree-sitter-javascript](https://github.com/tree-sitter/tree-sitter-javascript) | [npm](https://www.npmjs.com/package/tree-sitter-javascript) |
45: | 24 | `vscode-jsonrpc` | `^8.2.1` | `8.2.1` | [microsoft/vscode-languageserver-node](https://github.com/microsoft/vscode-languageserver-node) | [npm](https://www.npmjs.com/package/vscode-jsonrpc) |
46: | 25 | `web-tree-sitter` | `^0.26.8` | `0.26.8` | [tree-sitter/tree-sitter](https://github.com/tree-sitter/tree-sitter) | [npm](https://www.npmjs.com/package/web-tree-sitter) |
47: | 26 | `yaml` | `^2.8.3` | `2.8.4` | [eemeli/yaml](https://github.com/eemeli/yaml) | [npm](https://www.npmjs.com/package/yaml) |
48: | 27 | `zod` | `^4.3.6` | `4.4.3` | [colinhacks/zod](https://github.com/colinhacks/zod) | [npm](https://www.npmjs.com/package/zod) |
49: 
50: ### Peer Dependencies (1)
51: 
52: | # | Package | pkg.json Ver | npm Latest | GitHub | npm |
53: |---|---------|-------------|------------|--------|-----|
54: | 28 | `@opencode-ai/plugin` | `^1.14.41` | `1.14.44` | [anomalyco/opencode](https://github.com/anomalyco/opencode) | [npm](https://www.npmjs.com/package/@opencode-ai/plugin) |
55: 
56: ### Dev Dependencies (5)
57: 
58: | # | Package | pkg.json Ver | npm Latest | GitHub | npm |
59: |---|---------|-------------|------------|--------|-----|
60: | 29 | `@opencode-ai/plugin` | `^1.14.41` | `1.14.44` | [anomalyco/opencode](https://github.com/anomalyco/opencode) | [npm](https://www.npmjs.com/package/@opencode-ai/plugin) |
61: | 30 | `@types/bun` | `^1.3.8` | `1.3.13` | [DefinitelyTyped/DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped) | [npm](https://www.npmjs.com/package/@types/bun) |
62: | 31 | `@types/node` | `^20.0.0` | `25.6.2` | [DefinitelyTyped/DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped) | [npm](https://www.npmjs.com/package/@types/node) |
63: | 32 | `@vitest/coverage-v8` | `^4.1.5` | `4.1.5` | [vitest-dev/vitest](https://github.com/vitest-dev/vitest) | [npm](https://www.npmjs.com/package/@vitest/coverage-v8) |
64: | 33 | `typescript` | `^5.0.0` | `6.0.3` | [microsoft/TypeScript](https://github.com/microsoft/TypeScript) | [npm](https://www.npmjs.com/package/typescript) |
65: | 34 | `vitest` | `^4.1.5` | `4.1.5` | [vitest-dev/vitest](https://github.com/vitest-dev/vitest) | [npm](https://www.npmjs.com/package/vitest) |
66: 
67: ---
68: 
69: ### Monorepo Deduplication (unique GitHub repos)
70: 
71: | GitHub Repo | Packages |
72: |-------------|----------|
73: | [anomalyco/opencode](https://github.com/anomalyco/opencode) | `@opencode-ai/sdk`, `@opencode-ai/plugin` |
74: | [ast-grep/ast-grep](https://github.com/ast-grep/ast-grep) | `@ast-grep/cli`, `@ast-grep/napi` |
75: | [vercel-labs/json-render](https://github.com/vercel-labs/json-render) | `@json-render/core`, `ink`, `next`, `react`, `react-pdf` (5 packages) |
76: | [tree-sitter/tree-sitter](https://github.com/tree-sitter/tree-sitter) | `web-tree-sitter` |
77: | [tree-sitter/tree-sitter-javascript](https://github.com/tree-sitter/tree-sitter-javascript) | `tree-sitter-javascript` |
78: | [oven-sh/bun](https://github.com/oven-sh/bun) | `bun-types` |
79: | [DefinitelyTyped/DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped) | `@types/bun`, `@types/node` |
80: | [vitest-dev/vitest](https://github.com/vitest-dev/vitest) | `vitest`, `@vitest/coverage-v8` |
81: 
82: **Unique repos: 22** | **Total package entries: 34** | **All 22 repos GitHub-verified active**
83: 
84: ### Key Corrections from Previous Audit
85: 
86: | Package | WRONG (before) | CORRECT (now) | Evidence |
87: |---------|---------------|---------------|----------|
88: | `@opencode-ai/sdk` | `opencode-ai/opencode` (archived) | **[`anomalyco/opencode`](https://github.com/anomalyco/opencode)** | npm `repository: {}` empty; `gh api` confirms active, 150K stars |
89: | `@opencode-ai/plugin` | `opencode-ai/opencode` (archived) | **[`anomalyco/opencode`](https://github.com/anomalyco/opencode)** | Same — no repo metadata published to npm at all |
90: | `@clack/prompts` | `natemoo-re/clack` | **[`bombshell-dev/clack`](https://github.com/bombshell-dev/clack)`** | npm registry `repository.url` points to `bombshell-dev/clack` |

(End of file - total 90 lines)
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
Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/repo-for-learning-and-synthesis.md"}
<path>/Users/apple/hivemind-plugin-private/repo-for-learning-and-synthesis.md</path>
<type>file</type>
<content>
1: **IMPORTANT HEAD-UP!**: 
2: 
3: - For any “other frameworks/projects synthesis” - such as gsd-* https://github.com/gsd-build/get-shit-done or OMO https://github.com/code-yeongyu/oh-my-openagent → DO NOT SIMPLY INGEST everything and throw-in without deeply synthesize towards the HIVEMIND philosophies, concepts and visions
4: - And as above all those editions of primitives - config, naming, prefixes, suffixes, designs as for workflows and harness features must completely be transformed, adapt, and integrate coherently toward `the Hivemind`  under OpenCode (with specs compliance, harness lifecycles validation, ecosystem validation) - also, the gsd-* (or any keyword as prefixes or suffixes in skills, agents, commands, workflows, custom tools, etc are not expected to ship with the project and they are there just because I am using GSD framework to develop this - and if any “synthesis” that the units are expected to ship-with → they must follow the above rules and mindsets
5: - other  repos of OpenCode projects and plugins utilizing OpenCode SDK, plugins , client-server API - can be found here with these note-worthy repos vs. harness features categories
6:     1. Context-managements categories:
7:         1. https://github.com/Opencode-DCP/opencode-dynamic-context-pruning
8:     2. Harness features addressing  OpenCode innate shortcomings - the task, command and delegation feature class
9:         1. https://github.com/shekohex/opencode-ptyhttps://github.com/shekohex/opencode-pty#features  → resolve non-interactive commands, background runnings and multiple sessions - with OMO synthesis of background tasks, background agent, polling system to address this repo’s known limitations https://github.com/shekohex/opencode-pty#permissions
10:         2. related to the above is the background-agent repo https://github.com/kdcokenny/opencode-background-agents 
11:     3. A  **HUGE LIST OF CURATED OPENCODE ECOSYSTEM PROJECTS and PLUGINS -**  https://github.com/awesome-opencode/awesome-opencode - check this directory very often as you need to synthesize for feature-development, learn patterns, ideating and knowledge ingestion - I have also made a local copy of this under this path `/Users/apple/Documents/coding-projects/hivemind-plugin-1/.planning/research/OPENCODE-ECOSYSTEM-REPO-DIRECTORIES.md`

(End of file - total 11 lines)
</content>

### Tool: skill

**Input:**
```json
{
  "name": "gsd-map-codebase"
}
```

**Output:** (pruned)
```
# Skill: gsd-map-codebase
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_AgA5g5PmVfhkRASZAhbXUGXi"
}
```


### Tool: task

**Input:**
```json
{
  "description": "Scan slash command code",
  "subagent_type": "gsd-codebase-mapper",
  "task_id": "ses_1b4869be7ffeuKzbfhxku4hK10"
}
```

**Output:** (pruned)
```
task_id: ses_1b4869be7ffeuKzbfhxku4hK10
```


### Tool: task

**Input:**
```json
{
  "description": "Research OpenCode command primitives",
  "subagent_type": "gsd-phase-researcher",
  "task_id": "ses_1b4869b74ffe5G395s5zjraSIO"
}
```

**Output:** (pruned)
```
task_id: ses_1b4869b74ffe5G395s5zjraSIO
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_YWLYgbgSC5oLYUyNcxvCIJyC"
}
```


### Tool: task

**Input:**
```json
{
  "description": "Advise slash command options",
  "subagent_type": "gsd-advisor-researcher",
  "task_id": "ses_1b47d0a9fffeWAlFFOVt5b2qRc"
}
```

**Output:** (pruned)
```
task_id: ses_1b47d0a9fffeWAlFFOVt5b2qRc
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_ljjugcGsmz3kwyHAKeJ7zRkS"
}
```


## USER (turn 2)

**source:** real-human

ok route gsd các bước tiếp theo đi rồi tiếp tục một cách đầy đủ insert phases cho rồi route gsd-spec-phase để tạo spec rồi @gsd-assumptions-analyzer để tạo contexxt và @gsd-phase-researcher để research cho phase trước khi route @gsd-planner 
 Use the above message and context to generate a prompt and call the task tool with subagent: gsd-assumptions-analyzer
 Use the above message and context to generate a prompt and call the task tool with subagent: gsd-phase-researcher
 Use the above message and context to generate a prompt and call the task tool with subagent: gsd-planner

### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/ROADMAP.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/ROADMAP.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/ROADMAP.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/ROADMAP.md"
}
```


### Tool: execute-slash-command

**Input:**
```json
{
  "callID": "call_00_wzjShnxV1sBawKKO97vd5160"
}
```


## USER (turn 3)

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
Arguments: insert

Parse the first token of insert:
- If it is `--insert`: strip the flag, pass remainder (format: <after-phase-number> <description>) to insert-phase workflow
- If it is `--remove`: strip the flag, pass remainder (phase number) to remove-phase workflow
- If it is `--edit`: strip the flag, pass remainder (phase-number [--force]) to edit-phase workflow
- Otherwise: pass all of insert (phase description) to add-phase workflow

Roadmap and state are resolved in-workflow via `init phase-op` and targeted reads.
</context>

<process>
1. Parse the leading flag (if any) from insert.
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

- **DELEGATION STACKING — attach work onto ANY existing session:** Both `task` and `delegate-task` support attaching new work as a child of a completed main session — NOT just resuming aborted tasks. Pattern: pass the existing session ID directly.
  - **`task` tool:** set `task_id` parameter to any existing session ID (not just a previous task_id from task tool). The new subagent attaches as a child of that session.
  - **`delegate-task` tool:** pass `context` as JSON: `{"parentSessionId": "<session-id>"}`. The new delegation attaches as a child of that session.
  - Do NOT inject the session ID into the prompt text — that creates a new independent session. The correct approach is passing it as a parameter so OpenCode's hierarchy tracking properly chains the sessions.
  - **Prompt stays simple** — context from the target session is preserved through the session chain. No need to re-describe old work in the prompt. This is the same principle as `subagent_type`/`agent` parameter: you specify the agent name to select the handler, you specify `task_id`/`parentSessionId` to select the session to attach to.
  - This pattern covers BOTH use cases: **resume** (incomplete session) and **stack-on** (completed session to add new work as a child).

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
  "callID": "call_00_0DpycVy5XRp6kmvGgF8X4385"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_F2wWwdAv6zscrvCpSdGx1197"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_EP7BYiQmP5XOiFt00R539013"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_f7cV9k1irgy8hwuM8tpw0303"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_EzQrWg5lDeIv0VVQhQfc5961"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_3DfH4rOxewdJzHrV82rd8640"
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
  "callID": "call_00_8FKJKEoaiz7A8KyAvBrE7182"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_01_3FRH6ggzpYCrkSzIIzjF2409"
}
```


### Tool: execute-slash-command

**Input:**
```json
{
  "callID": "call_00_u36yMQWbVTdSXSNLVzyz1497"
}
```


## USER (turn 4)

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
Phase number: 21.1 (required)

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

- **DELEGATION STACKING — attach work onto ANY existing session:** Both `task` and `delegate-task` support attaching new work as a child of a completed main session — NOT just resuming aborted tasks. Pattern: pass the existing session ID directly.
  - **`task` tool:** set `task_id` parameter to any existing session ID (not just a previous task_id from task tool). The new subagent attaches as a child of that session.
  - **`delegate-task` tool:** pass `context` as JSON: `{"parentSessionId": "<session-id>"}`. The new delegation attaches as a child of that session.
  - Do NOT inject the session ID into the prompt text — that creates a new independent session. The correct approach is passing it as a parameter so OpenCode's hierarchy tracking properly chains the sessions.
  - **Prompt stays simple** — context from the target session is preserved through the session chain. No need to re-describe old work in the prompt. This is the same principle as `subagent_type`/`agent` parameter: you specify the agent name to select the handler, you specify `task_id`/`parentSessionId` to select the session to attach to.
  - This pattern covers BOTH use cases: **resume** (incomplete session) and **stack-on** (completed session to add new work as a child).

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
  "callID": "call_00_pQy18IjtGGYl3SNaSNTS9552"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_IvNLMdkRMXCVUDRteui31108"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_nVYzcmNTKfPpUIOYWUxQ1983"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_nzT39YDJsKw3YZdsqKIi9389"
}
```


### Tool: write

**Input:**
```json
{
  "callID": "call_00_jLSs6XFWnzdLAGQJV1hp3620"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_m8J9DBwyyOtkint0pq6C6413"
}
```


### Tool: task

**Input:**
```json
{
  "description": "Assumptions analysis for P21.1",
  "subagent_type": "gsd-assumptions-analyzer",
  "task_id": "ses_1b4761739ffeoLpgjmZwIVI5Yt"
}
```

**Output:** (pruned)
```
task_id: ses_1b4761739ffeoLpgjmZwIVI5Yt
```


### Tool: task

**Input:**
```json
{
  "description": "Deep research for P21.1",
  "subagent_type": "gsd-phase-researcher",
  "task_id": "ses_1b475feeaffemWGHBwAnU5NhCQ"
}
```

**Output:** (pruned)
```
task_id: ses_1b475feeaffemWGHBwAnU5NhCQ
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/21.1-execute-slash-command-sdk-redesign-agent-switching-native-sd/21.1-RESEARCH.md"
}
```


### Tool: write

**Input:**
```json
{
  "callID": "call_00_5ZbIWlXJ4Hd7vRxdcLT86149"
}
```


### Tool: task

**Input:**
```json
{
  "description": "Plan Phase 21.1 execution",
  "subagent_type": "gsd-planner",
  "task_id": "ses_1b4710bc9ffeDFoqmd67F40U3p"
}
```

**Output:** (pruned)
```
task_id: ses_1b4710bc9ffeDFoqmd67F40U3p
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_fjsCNfnpP4nPZWTiMOAR1531"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_oZEUNPutRHahbVHjDp8j9659"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_qTQEOlQjQP4IKxMM2bwu8859"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_QdHfMgTZ1VT22uo0iyku1351"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_hlG7vLx42eUKxVsbNHHZ8778"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_T1oajSPZi4mQ8CJDE2B01841"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_LMlT5IOlAVgUUPmutB8d3015"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_qm5pk48BuKJVHdmXJGDn9478"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_ET_b4X8PZxGj2XHp0KrQgXA1495"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_ErDcENEdl89PXGVbucf11944"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_8lAhAugRXQ0GiKtqsNqq6358"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_4iWdcIIX8LLYNRVHNdS61349"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_VBjxU0W6oeZ93wzCQnen6715"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_5FDvJU7DOVNzoCreDaM88765"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_6OMVptYA7FlDoEOPad9T7802"
}
```


## USER (turn 5)

**source:** real-human

<objective>
Execute all plans in a phase using wave-based parallel execution.

Orchestrator stays lean: discover plans, analyze dependencies, group into waves, spawn subagents, collect results. Each subagent loads the full execute-plan context and handles its own plan.

Optional wave filter:
- `--wave N` executes only Wave `N` for pacing, quota management, or staged rollout
- phase verification/completion still only happens when no incomplete plans remain after the selected wave finishes

Flag handling rule:
- The optional flags documented below are available behaviors, not implied active behaviors
- A flag is active only when its literal token appears in `21.1 `
- If a documented flag is absent from `21.1 `, treat it as inactive

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
Phase: 21.1 

**Available optional flags (documentation only — not automatically active):**
- `--wave N` — Execute only Wave `N` in the phase. Use when you want to pace execution or stay inside usage limits.
- `--gaps-only` — Execute only gap closure plans (plans with `gap_closure: true` in frontmatter). Use after verify-work creates fix plans.
- `--interactive` — Execute plans sequentially inline (no subagents) with user checkpoints between tasks. Lower token usage, pair-programming style. Best for small phases, bug fixes, and verification gaps.

**Active flags must be derived from `21.1 `:**
- `--wave N` is active only if the literal `--wave` token is present in `21.1 `
- `--gaps-only` is active only if the literal `--gaps-only` token is present in `21.1 `
- `--interactive` is active only if the literal `--interactive` token is present in `21.1 `
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

- **DELEGATION STACKING — attach work onto ANY existing session:** Both `task` and `delegate-task` support attaching new work as a child of a completed main session — NOT just resuming aborted tasks. Pattern: pass the existing session ID directly.
  - **`task` tool:** set `task_id` parameter to any existing session ID (not just a previous task_id from task tool). The new subagent attaches as a child of that session.
  - **`delegate-task` tool:** pass `context` as JSON: `{"parentSessionId": "<session-id>"}`. The new delegation attaches as a child of that session.
  - Do NOT inject the session ID into the prompt text — that creates a new independent session. The correct approach is passing it as a parameter so OpenCode's hierarchy tracking properly chains the sessions.
  - **Prompt stays simple** — context from the target session is preserved through the session chain. No need to re-describe old work in the prompt. This is the same principle as `subagent_type`/`agent` parameter: you specify the agent name to select the handler, you specify `task_id`/`parentSessionId` to select the session to attach to.
  - This pattern covers BOTH use cases: **resume** (incomplete session) and **stack-on** (completed session to add new work as a child).

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

### Tool: bash

**Input:**
```json
{
  "callID": "call_00_eXCzH4M8l5HIU6geXT325370"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_bqUidAPy5Dbv81IIdSoP3511"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_F6vCmpGFOuAmkIHAI66x8739"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_osFYC0jWzFVxWtS6mSt37087"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_uLQPgK2UtXqS7QZecnGo2935"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_HOHq94VPDT6pX8o7u6kx8354"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/21.1-execute-slash-command-sdk-redesign-agent-switching-native-sd/21.1-01-PLAN.md"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_mnlPNQOpeeZAHZhxcIdC9766"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/21.1-execute-slash-command-sdk-redesign-agent-switching-native-sd/21.1-01-PLAN.md"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_6vIjqujkF0o72qDEzHmB2926"
}
```


### Tool: task

**Input:**
```json
{
  "description": "Execute Plan 21.1-01 Wave 1",
  "subagent_type": "gsd-executor",
  "task_id": "ses_1b4698b19ffexmI4i6Ja4PR8x9"
}
```

**Output:** (pruned)
```
task_id: ses_1b4698b19ffexmI4i6Ja4PR8x9
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_6JNhendZoXxQYhdZK0OW7726"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_yYO2NSqn4NXPWWf3bpqd2015"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_zy7uSQm5r5lEwTqEEfls0527"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_jfMbSMiSOBMfIqoFVfTx7203"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_CGX3ANDzXJ8aVeKIeMTY9858"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_sRhz6E7AxlHuzAlt1FFu7128"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_4RPBoDcahZPdi1ViWKIm7644"
}
```


### Tool: write

**Input:**
```json
{
  "callID": "call_00_lfGxmrvwRfRR6aJqRBVa6639"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_rGd0HSYosxskEYF7iUDd3791"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_gwpTedxzij0m0xVA5iQb9408"
}
```


### Tool: invalid

**Input:**
```json
{
  "callID": "call_00_ZU5ZTNLlJ1lyzsb0W7Ds5725"
}
```


## USER (turn 6)

**source:** real-human

please do not self create your styling everything delegate

### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/21.1-execute-slash-command-sdk-redesign-agent-switching-native-sd/21.1-02-PLAN.md"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_fM8u5rsO7OUDrKMiyE2T5680"
}
```


## USER (turn 7)

**source:** real-human

for the next wave just delegate stack on the previous with new prompt so the continuity of contexxt is preserved

## USER (turn 8)

**source:** real-human

finally please check these slash commands are executable without being stuck with queuing and appendable to TUI this ís the flaw of some previous implementations

## USER (turn 9)

**source:** real-human

subtask field is true false not description

### Tool: task

**Input:**
```json
{
  "description": "Execute Plan 21.1-02 Wave 2",
  "subagent_type": "gsd-executor",
  "task_id": "ses_1b4654780ffejKrzx9jn5a4iQ5"
}
```

**Output:** (pruned)
```
task_id: ses_1b4654780ffejKrzx9jn5a4iQ5
```


## USER (turn 10)

**source:** real-human

there are multiple flaws to the implementation check very carefully

### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/tools/session/execute-slash-command.ts"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_01_z4cgfNAQwkCZPe4bHDgX5629"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_00_deKLzfKm3WP85uyfUIRq0339"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_01_4fspo5nQ0vVRmFsOVB3c6301"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/node_modules/@opencode-ai/sdk/dist/gen/types.gen.d.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/node_modules/@opencode-ai/sdk/dist/gen/types.gen.d.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/node_modules/@opencode-ai/sdk/dist/gen/types.gen.d.ts"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_00_GbIa6fUzn9O4PlxWVYht9370"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_01_iw8ptSpFfnmjfqzththd0086"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/node_modules/@opencode-ai/sdk/dist/gen/types.gen.d.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/node_modules/@opencode-ai/sdk/dist/gen/types.gen.d.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/node_modules/@opencode-ai/sdk/dist/gen/types.gen.d.ts"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_00_UEy2T8clQ7PnhFwnOlcp3412"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_01_jiMO8YSgCwGqnnUn4Vxx0090"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_00_IGocJEPHg39ABge3cWzG4791"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_DR8oif20MtHWyBo943uQ1344"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/node_modules/@opencode-ai/sdk/dist/gen/client/types.gen.d.ts"
}
```


### Tool: task

**Input:**
```json
{
  "description": "Execute Plan 21.1-03 Wave 3",
  "subagent_type": "gsd-executor",
  "task_id": "ses_1b4654780ffejKrzx9jn5a4iQ5"
}
```

**Output:** (pruned)
```
task_id: ses_1b4654780ffejKrzx9jn5a4iQ5
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_aX1dAB4bA7N3sfRRxuGY4000"
}
```


### Tool: write

**Input:**
```json
{
  "callID": "call_00_6izLCcyiKUihpsgXKO4H0853"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_r6zScCFwzGQ103PZc1UU0438"
}
```


### Tool: write

**Input:**
```json
{
  "callID": "call_00_kzchNGQLaYkrMJRUcnTc2814"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_2haLeVg3MHFnDoNYcT4m3503"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_OwNTg1iOYHfgiv4boeLI5881"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_Ani0YU9OyvROPUwtlwRm1047"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_DLnYFOkSHvWhEk18ZWWF5463"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_1O03x5D9IFEDWyy3nn5Y5501"
}
```


## USER (turn 11)

**source:** real-human

thực hiện các test giả định phức tạp và ứng dụng thực tế các thứ vừa tạo và với bộ commands tôi đã lưu sẵn cho gsd-* thử ác ccách khác nhau live tests không phải chạy unit test tôi đã build lại nên bạn cứ thế mà chạy thử xem implementation của mình đúng hay chưa, đây là runtime OpenCode và bạn có toàn quyền sử dụng các tools mới tạo vừa rồi

### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/tools/session/execute-slash-command.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/routing/command-engine/types.ts"
}
```


### Tool: execute-slash-command

**Input:**
```json
{
  "callID": "call_00_3GPl7TWg1wYaFLIN7FxF2432"
}
```


## USER (turn 12)

**source:** real-human

<objective>
Display comprehensive project statistics including phase progress, plan execution metrics, requirements completion, git history stats, and project timeline.
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/stats.md
</execution_context>

<process>
Execute end-to-end.
</process>
Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/stats.md"}
<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/stats.md</path>
<type>file</type>
<content>
1: <purpose>
2: Display comprehensive project statistics including phases, plans, requirements, git metrics, and timeline.
3: </purpose>
4: 
5: <required_reading>
6: Read all files referenced by the invoking prompt's execution_context before starting.
7: </required_reading>
8: 
9: <process>
10: 
11: <step name="gather_stats">
12: Gather project statistics:
13: 
14: ```bash
15: STATS=$(gsd-sdk query stats.json)
16: if [[ "$STATS" == @file:* ]]; then STATS=$(cat "${STATS#@file:}"); fi
17: ```
18: 
19: Extract fields from JSON: `milestone_version`, `milestone_name`, `phases`, `phases_completed`, `phases_total`, `total_plans`, `total_summaries`, `percent`, `plan_percent`, `requirements_total`, `requirements_complete`, `git_commits`, `git_first_commit_date`, `last_activity`.
20: </step>
21: 
22: <step name="present_stats">
23: Present to the user with this format:
24: 
25: ```
26: # 📊 Project Statistics — {milestone_version} {milestone_name}
27: 
28: ## Progress
29: [████████░░] X/Y phases (Z%)
30: 
31: ## Plans
32: X/Y plans complete (Z%)
33: 
34: ## Phases
35: | Phase | Name | Plans | Completed | Status |
36: |-------|------|-------|-----------|--------|
37: | ...   | ...  | ...   | ...       | ...    |
38: 
39: ## Requirements
40: ✅ X/Y requirements complete
41: 
42: ## Git
43: - **Commits:** N
44: - **Started:** YYYY-MM-DD
45: - **Last activity:** YYYY-MM-DD
46: 
47: ## Timeline
48: - **Project age:** N days
49: ```
50: 
51: If no `.planning/` directory exists, inform the user to run `/gsd-new-project` first.
52: </step>
53: 
54: <step name="mvp_summary">
55: **MVP phase summary.** Read all phases via `gsd-sdk query roadmap.analyze` (Phase 1's `cmdRoadmapAnalyze` surfaces a `mode` field per phase). Count phases by mode:
56: 
57: ```bash
58: ANALYZE=$(gsd-sdk query roadmap.analyze)
59: if [[ "$ANALYZE" == @file:* ]]; then ANALYZE=$(cat "${ANALYZE#@file:}"); fi
60: MVP_COUNT=$(echo "$ANALYZE" | jq '[.phases[] | select(.mode == "mvp")] | length')
61: TOTAL_COUNT=$(echo "$ANALYZE" | jq '.phases | length')
62: ```
63: 
64: Emit a summary line in the stats output:
65: 
66: ```
67: Phases: ${TOTAL_COUNT} total | ${MVP_COUNT} MVP | $((TOTAL_COUNT - MVP_COUNT)) standard
68: ```
69: 
70: If `MVP_COUNT == 0`, the project has no MVP-mode phases — omit the line (no clutter for non-MVP projects).
71: </step>
72: 
73: </process>
74: 
75: <success_criteria>
76: - [ ] Statistics gathered from project state
77: - [ ] Results formatted clearly
78: - [ ] Displayed to user
79: </success_criteria>

(End of file - total 79 lines)
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

- **DELEGATION STACKING — attach work onto ANY existing session:** Both `task` and `delegate-task` support attaching new work as a child of a completed main session — NOT just resuming aborted tasks. Pattern: pass the existing session ID directly.
  - **`task` tool:** set `task_id` parameter to any existing session ID (not just a previous task_id from task tool). The new subagent attaches as a child of that session.
  - **`delegate-task` tool:** pass `context` as JSON: `{"parentSessionId": "<session-id>"}`. The new delegation attaches as a child of that session.
  - Do NOT inject the session ID into the prompt text — that creates a new independent session. The correct approach is passing it as a parameter so OpenCode's hierarchy tracking properly chains the sessions.
  - **Prompt stays simple** — context from the target session is preserved through the session chain. No need to re-describe old work in the prompt. This is the same principle as `subagent_type`/`agent` parameter: you specify the agent name to select the handler, you specify `task_id`/`parentSessionId` to select the session to attach to.
  - This pattern covers BOTH use cases: **resume** (incomplete session) and **stack-on** (completed session to add new work as a child).

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

### Tool: execute-slash-command

**Input:**
```json
{
  "callID": "call_00_WGhiI2JusiqpxzdX4JXR7710"
}
```


## USER (turn 13)

**source:** real-human

<objective>
Display the complete GSD command reference.

Output ONLY the reference content below. Do NOT add:
- Project-specific analysis
- Git status or file context
- Next-step suggestions
- Any commentary beyond the reference
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/help.md
</execution_context>

<process>
Execute end-to-end.
Display the reference content directly — no additions or modifications.
</process>
Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/help.md"}
<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/help.md</path>
<type>file</type>
<content>
1: <purpose>
2: Display the complete GSD command reference. Output ONLY the reference content. Do NOT add project-specific analysis, git status, next-step suggestions, or any commentary beyond the reference.
3: </purpose>
4: 
5: <reference>
6: # GSD Command Reference
7: 
8: **GSD** (Get Shit Done) creates hierarchical project plans optimized for solo agentic development with Claude Code.
9: 
10: ## Quick Start
11: 
12: 1. `/gsd-new-project` - Initialize project (includes research, requirements, roadmap)
13: 2. `/gsd-plan-phase 1` - Create detailed plan for first phase
14: 3. `/gsd-execute-phase 1` - Execute the phase
15: 
16: ## Staying Updated
17: 
18: GSD evolves fast. Update periodically:
19: 
20: ```bash
21: npx get-shit-done-cc@latest
22: ```
23: 
24: ## Core Workflow
25: 
26: ```
27: /gsd-new-project → /gsd-plan-phase → /gsd-execute-phase → repeat
28: ```
29: 
30: ### Project Initialization
31: 
32: **`/gsd-new-project`**
33: Initialize new project through unified flow.
34: 
35: One command takes you from idea to ready-for-planning:
36: - Deep questioning to understand what you're building
37: - Optional domain research (spawns 4 parallel researcher agents)
38: - Requirements definition with v1/v2/out-of-scope scoping
39: - Roadmap creation with phase breakdown and success criteria
40: 
41: Creates all `.planning/` artifacts:
42: - `PROJECT.md` — vision and requirements
43: - `config.json` — workflow mode (interactive/yolo)
44: - `research/` — domain research (if selected)
45: - `REQUIREMENTS.md` — scoped requirements with REQ-IDs
46: - `ROADMAP.md` — phases mapped to requirements
47: - `STATE.md` — project memory
48: 
49: Usage: `/gsd-new-project`
50: 
51: **`/gsd-map-codebase [--fast] [--focus <area>] [--query <term>]`**
52: Map an existing codebase for brownfield projects.
53: 
54: - `--fast` — rapid lightweight assessment (replaces the former `gsd-scan`)
55: - `--focus <area>` — scope the map to a specific area
56: - `--query <term>` — query the codebase intelligence index in `.planning/intel/` (replaces the former `gsd-intel`)
57: 
58: - Analyzes codebase with parallel Explore agents
59: - Creates `.planning/codebase/` with 7 focused documents
60: - Covers stack, architecture, structure, conventions, testing, integrations, concerns
61: - Use before `/gsd-new-project` on existing codebases
62: 
63: Usage: `/gsd-map-codebase`
64: 
65: ### Phase Planning
66: 
67: **`/gsd-discuss-phase <number> [--chain | --analyze | --power | --assumptions] [--batch[=N]]`**
68: Help articulate your vision for a phase before planning.
69: 
70: - `--chain` — chained-prompt discuss flow
71: - `--analyze` — deep assumption analysis pass
72: - `--power` — power-user mode with extended question set
73: - `--assumptions` — surface the agent's implementation assumptions about the phase without an interactive session
74: 
75: - Captures how you imagine this phase working
76: - Creates CONTEXT.md with your vision, essentials, and boundaries
77: - Use when you have ideas about how something should look/feel
78: - Optional `--batch` asks 2-5 related questions at a time instead of one-by-one
79: 
80: Usage: `/gsd-discuss-phase 2`
81: Usage: `/gsd-discuss-phase 2 --batch`
82: Usage: `/gsd-discuss-phase 2 --batch=3`
83: 
84: **`/gsd-mvp-phase <number> [--force]`**
85: Plan a phase as a vertical MVP slice — three structured user-story prompts (`As a / I want to / So that`), SPIDR splitting if the story is too large, then delegates to `/gsd-plan-phase` with MVP mode active.
86: 
87: - Mutates the phase's ROADMAP entry: writes `**Mode:** mvp` + replaces `**Goal:**` with the assembled user story
88: - Validates the story via `gsd-sdk query user-story.validate` (canonical regex `/^As a .+, I want to .+, so that .+\.$/`)
89: - `--force` overrides the status guard (required if the phase is already `in_progress` or `completed`)
90: - Pairs with the new-project mode prompt (Vertical MVP vs Horizontal Layers)
91: 
92: Usage: `/gsd-mvp-phase 1`
93: Usage: `/gsd-mvp-phase 2 --force`
94: 
95: **`/gsd-plan-phase <number> [--research] [--skip-research] [--research-phase <N>] [--view] [--gaps] [--skip-verify] [--tdd] [--mvp]`**
96: Create detailed execution plan for a specific phase.
97: 
98: - `--skip-research` — bypass the research subagent
99: - `--research-phase <N>` — research-only mode. Spawns the research agent for phase `<N>`, writes `RESEARCH.md`, then exits before the planner runs. Useful for cross-phase research, doc review before committing to a planning approach, and correction-without-replanning loops. Replaces the deleted `gsd-research-phase` standalone command (#3042).
100:   - Modifiers: `--research` forces refresh (re-spawn researcher, no prompt). `--view` prints existing `RESEARCH.md` to stdout without spawning. With neither, prompts `update / view / skip` if `RESEARCH.md` already exists.
101: - `--gaps` — focus only on closing gaps from a prior plan-check
102: - `--skip-verify` — skip the post-plan verifier loop
103: - `--tdd` — plan in test-driven order (tests before code)
104: - `--mvp` — vertical-slice MVP planning mode
105: 
106: - Generates `.planning/phases/XX-phase-name/XX-YY-PLAN.md`
107: - Breaks phase into concrete, actionable tasks
108: - Includes verification criteria and success measures
109: - Multiple plans per phase supported (XX-01, XX-02, etc.)
110: 
111: Usage: `/gsd-plan-phase 1`
112: Usage: `/gsd-plan-phase --research-phase 2` — research only on phase 2 (prompts if `RESEARCH.md` exists)
113: Usage: `/gsd-plan-phase --research-phase 2 --view` — print existing `RESEARCH.md`, no spawn
114: Usage: `/gsd-plan-phase --research-phase 2 --research` — force-refresh, no prompt
115: Result: Creates `.planning/phases/01-foundation/01-01-PLAN.md`
116: 
117: **PRD Express Path:** Pass `--prd path/to/requirements.md` to skip discuss-phase entirely. Your PRD becomes locked decisions in CONTEXT.md. Useful when you already have clear acceptance criteria.
118: 
119: ### Execution
120: 
121: **`/gsd-execute-phase <phase-number> [--wave N] [--gaps-only] [--tdd]`**
122: Execute all plans in a phase, or run a specific wave.
123: 
124: - `--wave N` — execute only wave N (see *Plans within each wave* below)
125: - `--gaps-only` — re-run only plans flagged as gaps by a prior verifier
126: - `--tdd` — enforce test-driven order during execution
127: 
128: - Groups plans by wave (from frontmatter), executes waves sequentially
129: - Plans within each wave run in parallel via Task tool
130: - Optional `--wave N` flag executes only Wave `N` and stops unless the phase is now fully complete
131: - Verifies phase goal after all plans complete
132: - Updates REQUIREMENTS.md, ROADMAP.md, STATE.md
133: 
134: Usage: `/gsd-execute-phase 5`
135: Usage: `/gsd-execute-phase 5 --wave 2`
136: 
137: ### Smart Router
138: 
139: **`/gsd-progress --do "<description>"`**
140: Route freeform text to the right GSD command automatically.
141: 
142: - Analyzes natural language input to find the best matching GSD command
143: - Acts as a dispatcher — never does the work itself
144: - Resolves ambiguity by asking you to pick between top matches
145: - Use when you know what you want but don't know which `/gsd-*` command to run
146: 
147: Usage: `/gsd-progress --do "fix the login button"`
148: Usage: `/gsd-progress --do "refactor the auth system"`
149: Usage: `/gsd-progress --do "I want to start a new milestone"`
150: 
151: ### Quick Mode
152: 
153: **`/gsd-quick [--full] [--validate] [--discuss] [--research]`**
154: Execute small, ad-hoc tasks with GSD guarantees but skip optional agents.
155: 
156: Quick mode uses the same system with a shorter path:
157: - Spawns planner + executor (skips researcher, checker, verifier by default)
158: - Quick tasks live in `.planning/quick/` separate from planned phases
159: - Updates STATE.md tracking (not ROADMAP.md)
160: 
161: Flags enable additional quality steps:
162: - `--full` — Complete quality pipeline: discussion + research + plan-checking + verification
163: - `--validate` — Plan-checking (max 2 iterations) and post-execution verification only
164: - `--discuss` — Lightweight discussion to surface gray areas before planning
165: - `--research` — Focused research agent investigates approaches before planning
166: 
167: Granular flags are composable: `--discuss --research --validate` gives the same as `--full`.
168: 
169: Usage: `/gsd-quick`
170: Usage: `/gsd-quick --full`
171: Usage: `/gsd-quick --research --validate`
172: Result: Creates `.planning/quick/NNN-slug/PLAN.md`, `.planning/quick/NNN-slug/NNN-slug-SUMMARY.md`
173: 
174: ---
175: 
176: **`/gsd-fast [description]`**
177: Execute a trivial task inline — no subagents, no planning files, no overhead.
178: 
179: For tasks too small to justify planning: typo fixes, config changes, forgotten commits, simple additions. Runs in the current context, makes the change, commits, and logs to STATE.md.
180: 
181: - No PLAN.md or SUMMARY.md created
182: - No subagent spawned (runs inline)
183: - ≤ 3 file edits — redirects to `/gsd-quick` if task is non-trivial
184: - Atomic commit with conventional message
185: 
186: Usage: `/gsd-fast "fix the typo in README"`
187: Usage: `/gsd-fast "add .env to gitignore"`
188: 
189: ### Roadmap Management
190: 
191: **`/gsd-phase <description>`**
192: Add new phase to end of current milestone.
193: 
194: - Appends to ROADMAP.md
195: - Uses next sequential number
196: - Updates phase directory structure
197: 
198: Usage: `/gsd-phase "Add admin dashboard"`
199: 
200: **`/gsd-phase --insert <after> <description>`**
201: Insert urgent work as decimal phase between existing phases.
202: 
203: - Creates intermediate phase (e.g., 7.1 between 7 and 8)
204: - Useful for discovered work that must happen mid-milestone
205: - Maintains phase ordering
206: 
207: Usage: `/gsd-phase --insert 7 "Fix critical auth bug"`
208: Result: Creates Phase 7.1
209: 
210: **`/gsd-phase --remove <number>`**
211: Remove a future phase and renumber subsequent phases.
212: 
213: - Deletes phase directory and all references
214: - Renumbers all subsequent phases to close the gap
215: - Only works on future (unstarted) phases
216: - Git commit preserves historical record
217: 
218: Usage: `/gsd-phase --remove 17`
219: Result: Phase 17 deleted, phases 18-20 become 17-19
220: 
221: **`/gsd-phase --edit <number> [--force]`**
222: Edit any field of an existing roadmap phase in place, preserving number and position.
223: 
224: - Updates title, description, requirements, dependencies in `ROADMAP.md`
225: - `--force` allows editing already-started phases (use with caution)
226: 
227: ### Milestone Management
228: 
229: **`/gsd-new-milestone <name>`**
230: Start a new milestone through unified flow.
231: 
232: - Deep questioning to understand what you're building next
233: - Optional domain research (spawns 4 parallel researcher agents)
234: - Requirements definition with scoping
235: - Roadmap creation with phase breakdown
236: - Optional `--reset-phase-numbers` flag restarts numbering at Phase 1 and archives old phase dirs first for safety
237: 
238: Mirrors `/gsd-new-project` flow for brownfield projects (existing PROJECT.md).
239: 
240: Usage: `/gsd-new-milestone "v2.0 Features"`
241: Usage: `/gsd-new-milestone --reset-phase-numbers "v2.0 Features"`
242: 
243: **`/gsd-complete-milestone <version>`**
244: Archive completed milestone and prepare for next version.
245: 
246: - Creates MILESTONES.md entry with stats
247: - Archives full details to milestones/ directory
248: - Creates git tag for the release
249: - Prepares workspace for next version
250: 
251: Usage: `/gsd-complete-milestone 1.0.0`
252: 
253: ### Progress Tracking
254: 
255: **`/gsd-progress [--next | --forensic | --do "<description>"]`**
256: Check project status and intelligently route to next action.
257: 
258: - Shows visual progress bar and completion percentage
259: - Summarizes recent work from SUMMARY files
260: - Displays current position and what's next
261: - Lists key decisions and open issues
262: - Offers to execute next plan or create it if missing
263: - Detects 100% milestone completion
264: 
265: Modes:
266: - **default** — progress report + intelligent routing
267: - **`--next`** — auto-advance to the next logical step (use `--next --force` to bypass safety gates)
268: - **`--forensic`** — append a 6-check integrity audit after the progress report
269: - **`--do "<text>"`** — smart router: dispatch freeform intent to the matching `/gsd-*` command (see *Smart Router* above)
270: 
271: Usage: `/gsd-progress`
272: Usage: `/gsd-progress --next`
273: Usage: `/gsd-progress --forensic`
274: 
275: ### Session Management
276: 
277: **`/gsd-resume-work`**
278: Resume work from previous session with full context restoration.
279: 
280: - Reads STATE.md for project context
281: - Shows current position and recent progress
282: - Offers next actions based on project state
283: 
284: Usage: `/gsd-resume-work`
285: 
286: **`/gsd-pause-work [--report]`**
287: Create context handoff when pausing work mid-phase.
288: 
289: - `--report` — generate a post-session summary in `.planning/reports/` capturing commits, file changes, and phase progress
290: - Creates .continue-here file with current state
291: - Updates STATE.md session continuity section
292: - Captures in-progress work context
293: 
294: Usage: `/gsd-pause-work`
295: 
296: ### Debugging
297: 
298: **`/gsd-debug [issue description] [--diagnose]`**
299: Systematic debugging with persistent state across context resets.
300: 
301: - `--diagnose` — run a one-shot diagnostic pass without opening a persistent debug session
302: 
303: - Gathers symptoms through adaptive questioning
304: - Creates `.planning/debug/[slug].md` to track investigation
305: - Investigates using scientific method (evidence → hypothesis → test)
306: - Survives `/clear` — run `/gsd-debug` with no args to resume
307: - Archives resolved issues to `.planning/debug/resolved/`
308: 
309: Usage: `/gsd-debug "login button doesn't work"`
310: Usage: `/gsd-debug` (resume active session)
311: 
312: ### Spiking & Sketching
313: 
314: **`/gsd-spike [idea] [--quick]`**
315: Rapidly spike an idea with throwaway experiments to validate feasibility.
316: 
317: - Decomposes idea into 2-5 focused experiments (risk-ordered)
318: - Each spike answers one specific Given/When/Then question
319: - Builds minimum code, runs it, captures verdict (VALIDATED/INVALIDATED/PARTIAL)
320: - Saves to `.planning/spikes/` with MANIFEST.md tracking
321: - Does not require `/gsd-new-project` — works in any repo
322: - `--quick` skips decomposition, builds immediately
323: 
324: Usage: `/gsd-spike "can we stream LLM output over WebSockets?"`
325: Usage: `/gsd-spike --quick "test if pdfjs extracts tables"`
326: 
327: **`/gsd-sketch [idea] [--quick]`**
328: Rapidly sketch UI/design ideas using throwaway HTML mockups with multi-variant exploration.
329: 
330: - Conversational mood/direction intake before building
331: - Each sketch produces 2-3 variants as tabbed HTML pages
332: - User compares variants, cherry-picks elements, iterates
333: - Shared CSS theme system compounds across sketches
334: - Saves to `.planning/sketches/` with MANIFEST.md tracking
335: - Does not require `/gsd-new-project` — works in any repo
336: - `--quick` skips mood intake, jumps to building
337: 
338: Usage: `/gsd-sketch "dashboard layout for the admin panel"`
339: Usage: `/gsd-sketch --quick "form card grouping"`
340: 
341: **`/gsd-spike --wrap-up`**
342: Package spike findings into a persistent project skill.
343: 
344: - Curates each spike one-at-a-time (include/exclude/partial/UAT)
345: - Groups findings by feature area
346: - Generates `./.opencode/skills/spike-findings-[project]/` with references and sources
347: - Writes summary to `.planning/spikes/WRAP-UP-SUMMARY.md`
348: - Adds auto-load routing line to project AGENTS.md
349: 
350: Usage: `/gsd-spike --wrap-up`
351: 
352: **`/gsd-sketch --wrap-up`**
353: Package sketch design findings into a persistent project skill.
354: 
355: - Curates each sketch one-at-a-time (include/exclude/partial/revisit)
356: - Groups findings by design area
357: - Generates `./.opencode/skills/sketch-findings-[project]/` with design decisions, CSS patterns, HTML structures
358: - Writes summary to `.planning/sketches/WRAP-UP-SUMMARY.md`
359: - Adds auto-load routing line to project AGENTS.md
360: 
361: Usage: `/gsd-sketch --wrap-up`
362: 
363: ### Capturing Ideas, Notes, and Todos
364: 
365: **`/gsd-capture [description]`**
366: Capture an idea or task as a structured todo from current conversation.
367: 
368: - Extracts context from conversation (or uses provided description)
369: - Creates structured todo file in `.planning/todos/pending/`
370: - Infers area from file paths for grouping
371: - Checks for duplicates before creating
372: - Updates STATE.md todo count
373: 
374: Usage: `/gsd-capture` (infers from conversation)
375: Usage: `/gsd-capture Add auth token refresh`
376: 
377: **`/gsd-capture --note <text>`**
378: Zero-friction note capture — one command, instant save, no questions.
379: 
380: - Saves timestamped note to `.planning/notes/` (or `/Users/apple/hivemind-plugin-private/.opencode/notes/` globally)
381: - Three subcommands: append (default), list, promote
382: - Promote converts a note into a structured todo
383: - Works without a project (falls back to global scope)
384: 
385: Usage: `/gsd-capture --note refactor the hook system`
386: Usage: `/gsd-capture --note list`
387: Usage: `/gsd-capture --note promote 3`
388: Usage: `/gsd-capture --note --global cross-project idea`
389: 
390: **`/gsd-capture --list [area]`**
391: List pending todos and select one to work on.
392: 
393: - Lists all pending todos with title, area, age
394: - Optional area filter (e.g., `/gsd-capture --list api`)
395: - Loads full context for selected todo
396: - Routes to appropriate action (work now, add to phase, brainstorm)
397: - Moves todo to done/ when work begins
398: 
399: Usage: `/gsd-capture --list`
400: Usage: `/gsd-capture --list api`
401: 
402: ### User Acceptance Testing
403: 
404: **`/gsd-verify-work [phase]`**
405: Validate built features through conversational UAT.
406: 
407: - Extracts testable deliverables from SUMMARY.md files
408: - Presents tests one at a time (yes/no responses)
409: - Automatically diagnoses failures and creates fix plans
410: - Ready for re-execution if issues found
411: 
412: Usage: `/gsd-verify-work 3`
413: 
414: ### Ship Work
415: 
416: **`/gsd-ship [phase]`**
417: Create a PR from completed phase work with an auto-generated body.
418: 
419: - Pushes branch to remote
420: - Creates PR with summary from SUMMARY.md, VERIFICATION.md, REQUIREMENTS.md
421: - Optionally requests code review
422: - Updates STATE.md with shipping status
423: 
424: Prerequisites: Phase verified, `gh` CLI installed and authenticated.
425: 
426: Usage: `/gsd-ship 4` or `/gsd-ship 4 --draft`
427: 
428: ---
429: 
430: **`/gsd-review --phase N [--gemini] [--claude] [--codex] [--coderabbit] [--opencode] [--qwen] [--cursor] [--all]`**
431: Cross-AI peer review — invoke external AI CLIs to independently review phase plans.
432: 
433: - Detects available CLIs (gemini, claude, codex, coderabbit)
434: - Each CLI reviews plans independently with the same structured prompt
435: - CodeRabbit reviews the current git diff (not a prompt) — may take up to 5 minutes
436: - Produces REVIEWS.md with per-reviewer feedback and consensus summary
437: - Feed reviews back into planning: `/gsd-plan-phase N --reviews`
438: 
439: Usage: `/gsd-review --phase 3 --all`
440: 
441: ---
442: 
443: **`/gsd-pr-branch [target]`**
444: Create a clean branch for pull requests by filtering out .planning/ commits.
445: 
446: - Classifies commits: code-only (include), planning-only (exclude), mixed (include sans .planning/)
447: - Cherry-picks code commits onto a clean branch
448: - Reviewers see only code changes, no GSD artifacts
449: 
450: Usage: `/gsd-pr-branch` or `/gsd-pr-branch main`
451: 
452: ---
453: 
454: **`/gsd-capture --seed [idea]`**
455: Capture a forward-looking idea with trigger conditions for automatic surfacing.
456: 
457: - Seeds preserve WHY, WHEN to surface, and breadcrumbs to related code
458: - Auto-surfaces during `/gsd-new-milestone` when trigger conditions match
459: - Better than deferred items — triggers are checked, not forgotten
460: 
461: Usage: `/gsd-capture --seed "add real-time notifications when we build the events system"`
462: 
463: **`/gsd-capture --backlog [description]`**
464: Add an idea to the backlog parking lot for future milestones.
465: 
466: - Creates a backlog item under 999.x numbering in ROADMAP.md
467: - Reserves ideas without committing to the current milestone
468: - Surface and promote later via `/gsd-review-backlog`
469: 
470: Usage: `/gsd-capture --backlog "real-time notifications when events ship"`
471: 
472: ---
473: 
474: **`/gsd-audit-uat`**
475: Cross-phase audit of all outstanding UAT and verification items.
476: - Scans every phase for pending, skipped, blocked, and human_needed items
477: - Cross-references against codebase to detect stale documentation
478: - Produces prioritized human test plan grouped by testability
479: - Use before starting a new milestone to clear verification debt
480: 
481: Usage: `/gsd-audit-uat`
482: 
483: ### Milestone Auditing
484: 
485: **`/gsd-audit-milestone [version]`**
486: Audit milestone completion against original intent.
487: 
488: - Reads all phase VERIFICATION.md files
489: - Checks requirements coverage
490: - Spawns integration checker for cross-phase wiring
491: - Creates MILESTONE-AUDIT.md with gaps and tech debt
492: 
493: Usage: `/gsd-audit-milestone`
494: 
495: ### Configuration
496: 
497: **`/gsd-settings`**
498: Configure workflow toggles and model profile interactively.
499: 
500: - Toggle researcher, plan checker, verifier agents
501: - Select model profile (quality/balanced/budget/inherit)
502: - Updates `.planning/config.json`
503: 
504: Usage: `/gsd-settings`
505: 
506: **`/gsd-config [--profile <profile> | --advanced | --integrations]`**
507: Configure GSD beyond the basic settings: model profile, advanced tuning, and third-party integrations.
508: 
509: - `--profile <profile>` — quick switch model profile (`quality | balanced | budget | inherit`)
510: - `--advanced` — power-user tuning: plan bounce, timeouts, branch templates, cross-AI execution (replaces the former `gsd-settings-advanced`)
511: - `--integrations` — third-party API keys, code-review CLI routing, agent-skill injection (replaces the former `gsd-settings-integrations`)
512: 
513: - `quality` — Opus everywhere except verification
514: - `balanced` — Opus for planning, Sonnet for execution (default)
515: - `budget` — Sonnet for writing, Haiku for research/verification
516: - `inherit` — Use current session model for all agents (OpenCode `/model`)
517: 
518: Usage: `/gsd-config --profile budget`
519: 
520: ### Utility Commands
521: 
522: **`/gsd-cleanup`**
523: Archive accumulated phase directories from completed milestones.
524: 
525: - Identifies phases from completed milestones still in `.planning/phases/`
526: - Shows dry-run summary before moving anything
527: - Moves phase dirs to `.planning/milestones/v{X.Y}-phases/`
528: - Use after multiple milestones to reduce `.planning/phases/` clutter
529: 
530: Usage: `/gsd-cleanup`
531: 
532: **`/gsd-help`**
533: Show this command reference.
534: 
535: **`/gsd-update [--sync] [--reapply]`**
536: Update GSD to latest version with changelog preview.
537: 
538: - `--sync` — sync managed GSD skills across runtime roots (replaces the former `gsd-sync-skills`)
539: - `--reapply` — reapply local modifications after an update (replaces the former `gsd-reapply-patches`)
540: 
541: - Shows installed vs latest version comparison
542: - Displays changelog entries for versions you've missed
543: - Highlights breaking changes
544: - Confirms before running install
545: - Better than raw `npx get-shit-done-cc`
546: 
547: Usage: `/gsd-update`
548: 
549: ## Additional Commands
550: 
551: The commands above cover the most common day-to-day flows. Every command listed here is also a live `/gsd-*` slash command and is grouped by purpose.
552: 
553: ### Discovery & Specification
554: 
555: - **`/gsd-explore`** — Socratic ideation and idea routing. Think through ideas before committing to plans.
556: - **`/gsd-spec-phase <phase> [--auto] [--text]`** — Clarify WHAT a phase delivers with ambiguity scoring; produces a SPEC.md before discuss-phase.
557: - **`/gsd-ai-integration-phase [phase]`** — Generate an AI-SPEC.md design contract for phases that involve building AI systems.
558: - **`/gsd-ui-phase [phase]`** — Generate UI design contract (UI-SPEC.md) for frontend phases.
559: - **`/gsd-import --from <filepath> | --from-gsd2`** — Ingest external plans with conflict detection, or reverse-migrate a GSD-2 (`.gsd/`) project back to GSD v1 (`.planning/`) format.
560: - **`/gsd-ingest-docs [path] [--mode new|merge] [--manifest <file>] [--resolve auto|interactive]`** — Bootstrap or merge a `.planning/` setup from existing ADRs, PRDs, SPECs, and docs in a repo.
561: 
562: ### Planning & Execution
563: 
564: - **`/gsd-ultraplan-phase [phase]`** — [BETA] Offload plan phase to Claude Code's ultraplan cloud; review in browser and import back.
565: - **`/gsd-plan-review-convergence <phase> [--codex] [--gemini] [--claude] [--opencode] [--ollama] [--lm-studio] [--llama-cpp] [--all] [--text] [--ws <name>] [--max-cycles N]`** — Cross-AI plan convergence loop — replan with review feedback until no HIGH concerns remain. Supports both cloud reviewers (Codex/Gemini/the agent/OpenCode) and local model runtimes (Ollama, LM Studio, llama.cpp).
566: - **`/gsd-autonomous [--from N] [--to N] [--only N] [--interactive]`** — Run all remaining phases autonomously: discuss → plan → execute per phase.
567: 
568: ### Quality, Review & Verification
569: 
570: - **`/gsd-code-review <phase> [--depth=quick|standard|deep] [--files file1,file2,...] [--fix [--all] [--auto]]`** — Review source files changed during a phase for bugs, security issues, and code quality problems.
571: - **`/gsd-secure-phase [phase]`** — Retroactively verify threat mitigations for a completed phase.
572: - **`/gsd-validate-phase [phase]`** — Retroactively audit and fill Nyquist validation gaps for a completed phase.
573: - **`/gsd-ui-review [phase]`** — Retroactive 6-pillar visual audit of implemented frontend code.
574: - **`/gsd-eval-review [phase]`** — Audit an executed AI phase's evaluation coverage and produce an EVAL-REVIEW.md remediation plan.
575: - **`/gsd-audit-fix --source <audit-uat> [--severity medium|high|all] [--max N] [--dry-run]`** — Autonomous audit-to-fix pipeline: find issues, classify, fix, test, commit.
576: - **`/gsd-add-tests <phase> [additional instructions]`** — Generate tests for a completed phase based on UAT criteria and implementation.
577: 
578: ### Diagnostics & Maintenance
579: 
580: - **`/gsd-health [--repair] [--context]`** — Diagnose planning directory health and optionally repair issues.
581: - **`/gsd-forensics [problem description]`** — Post-mortem investigation for failed GSD workflows; diagnoses what went wrong.
582: - **`/gsd-undo --last N | --phase NN | --plan NN-MM`** — Safe git revert. Roll back phase or plan commits using the phase manifest with dependency checks.
583: - **`/gsd-docs-update [--force] [--verify-only]`** — Generate or update project documentation verified against the codebase.
584: - **`/gsd-extract-learnings <phase>`** — Extract decisions, lessons, patterns, and surprises from completed phase artifacts.
585: 
586: ### Knowledge & Context
587: 
588: - **`/gsd-graphify [build|query <term>|status|diff]`** — Build, query, and inspect the project knowledge graph in `.planning/graphs/`.
589: - **`/gsd-thread [list [--open|--resolved] | close <slug> | status <slug> | name | description]`** — Manage persistent context threads for cross-session work.
590: - **`/gsd-profile-user [--questionnaire] [--refresh]`** — Generate developer behavioral profile and create Claude-discoverable artifacts.
591: - **`/gsd-stats`** — Display project statistics: phases, plans, requirements, git metrics, and timeline.
592: 
593: ### Workflow & Orchestration
594: 
595: - **`/gsd-manager [--analyze-deps]`** — Interactive command center for managing multiple phases from one terminal. `--analyze-deps` scans ROADMAP phases for dependency relationships before parallel execution.
596: - **`/gsd-workspace [--new | --list | --remove] [name]`** — Manage GSD workspaces: create, list, or remove isolated workspace environments.
597: - **`/gsd-workstreams`** — Manage parallel workstreams: list, create, switch, status, progress, complete, and resume.
598: - **`/gsd-review-backlog`** — Review and promote backlog items to active milestone.
599: - **`/gsd-milestone-summary [version]`** — Generate a comprehensive project summary from milestone artifacts for team onboarding and review.
600: 
601: ### Repository Integration
602: 
603: - **`/gsd-inbox [--issues] [--prs] [--label] [--close-incomplete] [--repo owner/repo]`** — Triage and review open GitHub issues and PRs against project templates and contribution guidelines.
604: 
605: ### Namespace Routers (model-facing meta-skills)
606: 
607: These six skills exist primarily for the model to perform two-stage hierarchical routing across 60+ skills. You can invoke them directly when you want to browse a category interactively.
608: 
609: - **`/gsd-context`** — Codebase intelligence routing (map, graphify, docs, learnings).
610: - **`/gsd-ideate`** — Exploration / capture routing (explore, sketch, spike, spec, capture).
611: - **`/gsd-manage`** — Configuration and workspace routing (workstreams, thread, update, ship, inbox).
612: - **`/gsd-project`** — Project-lifecycle routing (milestones, audits, summary).
613: - **`/gsd-review`** — Quality-gate routing (code review, debug, audit, security, eval, ui).
614: - **`/gsd-workflow`** — Phase-pipeline routing (discuss, plan, execute, verify, phase, progress).
615: 
616: ## Files & Structure
617: 
618: ```
619: .planning/
620: ├── PROJECT.md            # Project vision
621: ├── ROADMAP.md            # Current phase breakdown
622: ├── STATE.md              # Project memory & context
623: ├── RETROSPECTIVE.md      # Living retrospective (updated per milestone)
624: ├── config.json           # Workflow mode & gates
625: ├── todos/                # Captured ideas and tasks
626: │   ├── pending/          # Todos waiting to be worked on
627: │   └── done/             # Completed todos
628: ├── spikes/               # Spike experiments (/gsd-spike)
629: │   ├── MANIFEST.md       # Spike inventory and verdicts
630: │   └── NNN-name/         # Individual spike directories
631: ├── sketches/             # Design sketches (/gsd-sketch)
632: │   ├── MANIFEST.md       # Sketch inventory and winners
633: │   ├── themes/           # Shared CSS theme files
634: │   └── NNN-name/         # Individual sketch directories (HTML + README)
635: ├── debug/                # Active debug sessions
636: │   └── resolved/         # Archived resolved issues
637: ├── milestones/
638: │   ├── v1.0-ROADMAP.md       # Archived roadmap snapshot
639: │   ├── v1.0-REQUIREMENTS.md  # Archived requirements
640: │   └── v1.0-phases/          # Archived phase dirs (via /gsd-cleanup or --archive-phases)
641: │       ├── 01-foundation/
642: │       └── 02-core-features/
643: ├── codebase/             # Codebase map (brownfield projects)
644: │   ├── STACK.md          # Languages, frameworks, dependencies
645: │   ├── ARCHITECTURE.md   # Patterns, layers, data flow
646: │   ├── STRUCTURE.md      # Directory layout, key files
647: │   ├── CONVENTIONS.md    # Coding standards, naming
648: │   ├── TESTING.md        # Test setup, patterns
649: │   ├── INTEGRATIONS.md   # External services, APIs
650: │   └── CONCERNS.md       # Tech debt, known issues
651: └── phases/
652:     ├── 01-foundation/
653:     │   ├── 01-01-PLAN.md
654:     │   └── 01-01-SUMMARY.md
655:     └── 02-core-features/
656:         ├── 02-01-PLAN.md
657:         └── 02-01-SUMMARY.md
658: ```
659: 
660: ## Workflow Modes
661: 
662: Set during `/gsd-new-project`:
663: 
664: **Interactive Mode**
665: 
666: - Confirms each major decision
667: - Pauses at checkpoints for approval
668: - More guidance throughout
669: 
670: **YOLO Mode**
671: 
672: - Auto-approves most decisions
673: - Executes plans without confirmation
674: - Only stops for critical checkpoints
675: 
676: Change anytime by editing `.planning/config.json`
677: 
678: ## Planning Configuration
679: 
680: Configure how planning artifacts are managed in `.planning/config.json`:
681: 
682: **`planning.commit_docs`** (default: `true`)
683: - `true`: Planning artifacts committed to git (standard workflow)
684: - `false`: Planning artifacts kept local-only, not committed
685: 
686: When `commit_docs: false`:
687: - Add `.planning/` to your `.gitignore`
688: - Useful for OSS contributions, client projects, or keeping planning private
689: - All planning files still work normally, just not tracked in git
690: 
691: **`planning.search_gitignored`** (default: `false`)
692: - `true`: Add `--no-ignore` to broad ripgrep searches
693: - Only needed when `.planning/` is gitignored and you want project-wide searches to include it
694: 
695: Example config:
696: ```json
697: {
698:   "planning": {
699:     "commit_docs": false,
700:     "search_gitignored": true
701:   }
702: }
703: ```
704: 
705: ## Common Workflows
706: 
707: **Starting a new project:**
708: 
709: ```
710: /gsd-new-project        # Unified flow: questioning → research → requirements → roadmap
711: /clear
712: /gsd-plan-phase 1       # Create plans for first phase
713: /clear
714: /gsd-execute-phase 1    # Execute all plans in phase
715: ```
716: 
717: **Resuming work after a break:**
718: 
719: ```
720: /gsd-progress  # See where you left off and continue
721: ```
722: 
723: **Adding urgent mid-milestone work:**
724: 
725: ```
726: /gsd-phase --insert 5 "Critical security fix"
727: /gsd-plan-phase 5.1
728: /gsd-execute-phase 5.1
729: ```
730: 
731: **Completing a milestone:**
732: 
733: ```
734: /gsd-complete-milestone 1.0.0
735: /clear
736: /gsd-new-milestone  # Start next milestone (questioning → research → requirements → roadmap)
737: ```
738: 
739: **Capturing ideas during work:**
740: 
741: ```
742: /gsd-capture                                  # Capture from conversation context
743: /gsd-capture Fix modal z-index                # Capture with explicit description
744: /gsd-capture --note refactor auth system      # Quick friction-free note
745: /gsd-capture --seed "real-time notifications" # Forward-looking idea with triggers
746: /gsd-capture --list                           # Review and work on todos
747: /gsd-capture --list api                       # Filter by area
748: ```
749: 
750: **Debugging an issue:**
751: 
752: ```
753: /gsd-debug "form submission fails silently"  # Start debug session
754: # ... investigation happens, context fills up ...
755: /clear
756: /gsd-debug                                    # Resume from where you left off
757: ```
758: 
759: ## Getting Help
760: 
761: - Read `.planning/PROJECT.md` for project vision
762: - Read `.planning/STATE.md` for current context
763: - Check `.planning/ROADMAP.md` for phase status
764: - Run `/gsd-progress` to check where you're up to
765: </reference>

(End of file - total 765 lines)
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

- **DELEGATION STACKING — attach work onto ANY existing session:** Both `task` and `delegate-task` support attaching new work as a child of a completed main session — NOT just resuming aborted tasks. Pattern: pass the existing session ID directly.
  - **`task` tool:** set `task_id` parameter to any existing session ID (not just a previous task_id from task tool). The new subagent attaches as a child of that session.
  - **`delegate-task` tool:** pass `context` as JSON: `{"parentSessionId": "<session-id>"}`. The new delegation attaches as a child of that session.
  - Do NOT inject the session ID into the prompt text — that creates a new independent session. The correct approach is passing it as a parameter so OpenCode's hierarchy tracking properly chains the sessions.
  - **Prompt stays simple** — context from the target session is preserved through the session chain. No need to re-describe old work in the prompt. This is the same principle as `subagent_type`/`agent` parameter: you specify the agent name to select the handler, you specify `task_id`/`parentSessionId` to select the session to attach to.
  - This pattern covers BOTH use cases: **resume** (incomplete session) and **stack-on** (completed session to add new work as a child).

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

### Tool: execute-slash-command

**Input:**
```json
{
  "callID": "call_01_0BaJ6rnGUh6EYNH180yX9640"
}
```


## USER (turn 14)

**source:** real-human

/nonexistent-command

### Tool: execute-slash-command

**Input:**
```json
{
  "callID": "call_02_7VoSxm53VTMi49Kh5lmA9885"
}
```


## USER (turn 15)

**source:** real-human

@gsd-advisor-researcher /gsd-stats

### Tool: hivemind-command-engine

**Input:**
```json
{
  "callID": "call_03_2mHpZ6Kz3tsPI1YlyN4E6827"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_KjlCAYx05WYt1bONcZyT9270"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_01_ND5GOplvWE01HXPctm5j6163"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_00_TC2nRzs8FxDPWjkkqmwX1168"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/node_modules/@opencode-ai/sdk/dist/gen/types.gen.d.ts"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_01_Ms8D6JDFAFVn7s0ym2zq5882"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/node_modules/@opencode-ai/sdk/dist/gen/types.gen.d.ts"
}
```


## USER (turn 16)

**source:** real-human

4 và 5 đều fail không switch được agent, command cũng không chạy, không delegate được về sub fail toàn tập không có gì phát triển so với implementation cũ TOTALLY FAILURE

### Tool: question

**Input:**
```json
{
  "callID": "call_00_enSsgPZG2mulWy2Xa7sY6182"
}
```


### Tool: task

**Input:**
```json
{
  "description": "Surgical fix execute-slash-command",
  "subagent_type": "gsd-executor",
  "task_id": "ses_1b4563fc9ffewprtaU1mfWnS8j"
}
```

**Output:** (pruned)
```
task_id: ses_1b4563fc9ffewprtaU1mfWnS8j
```


## USER (turn 17)

**source:** real-human

KHÔNG PHẢI ĐƠN THUẦN LÀ BỎ TÌM GIẢI PHÁP ĐỂ SPECS HOÀN THÀNH VÌ B Ỏ LÀ KO COVER ĐƯỢC FEATURES YÊU CẦU

### Tool: grep

**Input:**
```json
{
  "callID": "call_00_3xEHsOphCNQmum8J1pky3353"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_00_j7d7dZc5PrRQFdDxPLQq8066"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/node_modules/@opencode-ai/sdk/dist/gen/types.gen.d.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/node_modules/@opencode-ai/sdk/dist/gen/types.gen.d.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/node_modules/@opencode-ai/sdk/dist/gen/types.gen.d.ts"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_00_2uGGqhD9rR5dKkgcEkHZ7689"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/node_modules/@opencode-ai/sdk/dist/gen/types.gen.d.ts"
}
```


## USER (turn 18)

**source:** real-human

NHƯNG PROMPT THÌ KHÔNG EXECUTE ĐƯỢC SLASH COMMANDS

## USER (turn 19)

**source:** real-human

này nhé chỉ qua TUI thì mới append và execute được slash commands, và slash command có field agents và subtask true/false thì phải có thể dideefu chỉnh được on-the-fly thì mới giải quyết được append sub task - đó là chưa kể switch agents foreground vẫn chưa làm được 

## USER (turn 20)

**source:** real-human

đừng đề xuất research chứng minh được thì làm tôi có thể sai - tôi chỉ cần kết quả 

### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_4CZ0eN3kYadv8qXQ6oMb1114"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/routing/command-engine/index.ts"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_00_qdUzlqExH1CN1RcvbuK20080"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/node_modules/@opencode-ai/sdk/dist/gen/types.gen.d.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/tools/session/execute-slash-command.ts"
}
```


### Tool: write

**Input:**
```json
{
  "callID": "call_00_7hPGVLXDiqxS5AJvJaS82410"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_7cZMQhJQyQeuh5efRDCl5464"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_uC1jO6NkELfzG3sCov5w1674"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_35Xoqfn1WXZLl3laSezc3701"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_irVEpTzvU6PkSCiasU6X9462"
}
```


### Tool: execute-slash-command

**Input:**
```json
{
  "callID": "call_00_1PNWq1FdiEnS8te2RPE94836"
}
```


## USER (turn 21)

**source:** real-human

/nonexistent-command

### Tool: bash

**Input:**
```json
{
  "callID": "call_00_RZHTP4Y6J38g43qTQKU00227"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_4bkcJr2QAqVgynULcRq13083"
}
```


### Tool: execute-slash-command

**Input:**
```json
{
  "callID": "call_00_Ne96kUz1uNuqwH1gyOfL5543"
}
```


## USER (turn 22)

**source:** real-human

/nonexistent-command

## USER (turn 23)

**source:** real-human

đã restarted và đã rebuild nhưng tôi không cần non-existent đâu tôi cần commands đã có sẵn và các biến thể kìa nó có chạy được các biến thể như tôi yêu cầu hay không

### Tool: execute-slash-command

**Input:**
```json
{
  "callID": "call_00_yMtWdQrCc8IBObPqo7SF5369"
}
```


## USER (turn 24)

**source:** real-human

<objective>
Display the complete GSD command reference.

Output ONLY the reference content below. Do NOT add:
- Project-specific analysis
- Git status or file context
- Next-step suggestions
- Any commentary beyond the reference
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/help.md
</execution_context>

<process>
Execute end-to-end.
Display the reference content directly — no additions or modifications.
</process>
Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/help.md"}
<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/help.md</path>
<type>file</type>
<content>
1: <purpose>
2: Display the complete GSD command reference. Output ONLY the reference content. Do NOT add project-specific analysis, git status, next-step suggestions, or any commentary beyond the reference.
3: </purpose>
4: 
5: <reference>
6: # GSD Command Reference
7: 
8: **GSD** (Get Shit Done) creates hierarchical project plans optimized for solo agentic development with Claude Code.
9: 
10: ## Quick Start
11: 
12: 1. `/gsd-new-project` - Initialize project (includes research, requirements, roadmap)
13: 2. `/gsd-plan-phase 1` - Create detailed plan for first phase
14: 3. `/gsd-execute-phase 1` - Execute the phase
15: 
16: ## Staying Updated
17: 
18: GSD evolves fast. Update periodically:
19: 
20: ```bash
21: npx get-shit-done-cc@latest
22: ```
23: 
24: ## Core Workflow
25: 
26: ```
27: /gsd-new-project → /gsd-plan-phase → /gsd-execute-phase → repeat
28: ```
29: 
30: ### Project Initialization
31: 
32: **`/gsd-new-project`**
33: Initialize new project through unified flow.
34: 
35: One command takes you from idea to ready-for-planning:
36: - Deep questioning to understand what you're building
37: - Optional domain research (spawns 4 parallel researcher agents)
38: - Requirements definition with v1/v2/out-of-scope scoping
39: - Roadmap creation with phase breakdown and success criteria
40: 
41: Creates all `.planning/` artifacts:
42: - `PROJECT.md` — vision and requirements
43: - `config.json` — workflow mode (interactive/yolo)
44: - `research/` — domain research (if selected)
45: - `REQUIREMENTS.md` — scoped requirements with REQ-IDs
46: - `ROADMAP.md` — phases mapped to requirements
47: - `STATE.md` — project memory
48: 
49: Usage: `/gsd-new-project`
50: 
51: **`/gsd-map-codebase [--fast] [--focus <area>] [--query <term>]`**
52: Map an existing codebase for brownfield projects.
53: 
54: - `--fast` — rapid lightweight assessment (replaces the former `gsd-scan`)
55: - `--focus <area>` — scope the map to a specific area
56: - `--query <term>` — query the codebase intelligence index in `.planning/intel/` (replaces the former `gsd-intel`)
57: 
58: - Analyzes codebase with parallel Explore agents
59: - Creates `.planning/codebase/` with 7 focused documents
60: - Covers stack, architecture, structure, conventions, testing, integrations, concerns
61: - Use before `/gsd-new-project` on existing codebases
62: 
63: Usage: `/gsd-map-codebase`
64: 
65: ### Phase Planning
66: 
67: **`/gsd-discuss-phase <number> [--chain | --analyze | --power | --assumptions] [--batch[=N]]`**
68: Help articulate your vision for a phase before planning.
69: 
70: - `--chain` — chained-prompt discuss flow
71: - `--analyze` — deep assumption analysis pass
72: - `--power` — power-user mode with extended question set
73: - `--assumptions` — surface the agent's implementation assumptions about the phase without an interactive session
74: 
75: - Captures how you imagine this phase working
76: - Creates CONTEXT.md with your vision, essentials, and boundaries
77: - Use when you have ideas about how something should look/feel
78: - Optional `--batch` asks 2-5 related questions at a time instead of one-by-one
79: 
80: Usage: `/gsd-discuss-phase 2`
81: Usage: `/gsd-discuss-phase 2 --batch`
82: Usage: `/gsd-discuss-phase 2 --batch=3`
83: 
84: **`/gsd-mvp-phase <number> [--force]`**
85: Plan a phase as a vertical MVP slice — three structured user-story prompts (`As a / I want to / So that`), SPIDR splitting if the story is too large, then delegates to `/gsd-plan-phase` with MVP mode active.
86: 
87: - Mutates the phase's ROADMAP entry: writes `**Mode:** mvp` + replaces `**Goal:**` with the assembled user story
88: - Validates the story via `gsd-sdk query user-story.validate` (canonical regex `/^As a .+, I want to .+, so that .+\.$/`)
89: - `--force` overrides the status guard (required if the phase is already `in_progress` or `completed`)
90: - Pairs with the new-project mode prompt (Vertical MVP vs Horizontal Layers)
91: 
92: Usage: `/gsd-mvp-phase 1`
93: Usage: `/gsd-mvp-phase 2 --force`
94: 
95: **`/gsd-plan-phase <number> [--research] [--skip-research] [--research-phase <N>] [--view] [--gaps] [--skip-verify] [--tdd] [--mvp]`**
96: Create detailed execution plan for a specific phase.
97: 
98: - `--skip-research` — bypass the research subagent
99: - `--research-phase <N>` — research-only mode. Spawns the research agent for phase `<N>`, writes `RESEARCH.md`, then exits before the planner runs. Useful for cross-phase research, doc review before committing to a planning approach, and correction-without-replanning loops. Replaces the deleted `gsd-research-phase` standalone command (#3042).
100:   - Modifiers: `--research` forces refresh (re-spawn researcher, no prompt). `--view` prints existing `RESEARCH.md` to stdout without spawning. With neither, prompts `update / view / skip` if `RESEARCH.md` already exists.
101: - `--gaps` — focus only on closing gaps from a prior plan-check
102: - `--skip-verify` — skip the post-plan verifier loop
103: - `--tdd` — plan in test-driven order (tests before code)
104: - `--mvp` — vertical-slice MVP planning mode
105: 
106: - Generates `.planning/phases/XX-phase-name/XX-YY-PLAN.md`
107: - Breaks phase into concrete, actionable tasks
108: - Includes verification criteria and success measures
109: - Multiple plans per phase supported (XX-01, XX-02, etc.)
110: 
111: Usage: `/gsd-plan-phase 1`
112: Usage: `/gsd-plan-phase --research-phase 2` — research only on phase 2 (prompts if `RESEARCH.md` exists)
113: Usage: `/gsd-plan-phase --research-phase 2 --view` — print existing `RESEARCH.md`, no spawn
114: Usage: `/gsd-plan-phase --research-phase 2 --research` — force-refresh, no prompt
115: Result: Creates `.planning/phases/01-foundation/01-01-PLAN.md`
116: 
117: **PRD Express Path:** Pass `--prd path/to/requirements.md` to skip discuss-phase entirely. Your PRD becomes locked decisions in CONTEXT.md. Useful when you already have clear acceptance criteria.
118: 
119: ### Execution
120: 
121: **`/gsd-execute-phase <phase-number> [--wave N] [--gaps-only] [--tdd]`**
122: Execute all plans in a phase, or run a specific wave.
123: 
124: - `--wave N` — execute only wave N (see *Plans within each wave* below)
125: - `--gaps-only` — re-run only plans flagged as gaps by a prior verifier
126: - `--tdd` — enforce test-driven order during execution
127: 
128: - Groups plans by wave (from frontmatter), executes waves sequentially
129: - Plans within each wave run in parallel via Task tool
130: - Optional `--wave N` flag executes only Wave `N` and stops unless the phase is now fully complete
131: - Verifies phase goal after all plans complete
132: - Updates REQUIREMENTS.md, ROADMAP.md, STATE.md
133: 
134: Usage: `/gsd-execute-phase 5`
135: Usage: `/gsd-execute-phase 5 --wave 2`
136: 
137: ### Smart Router
138: 
139: **`/gsd-progress --do "<description>"`**
140: Route freeform text to the right GSD command automatically.
141: 
142: - Analyzes natural language input to find the best matching GSD command
143: - Acts as a dispatcher — never does the work itself
144: - Resolves ambiguity by asking you to pick between top matches
145: - Use when you know what you want but don't know which `/gsd-*` command to run
146: 
147: Usage: `/gsd-progress --do "fix the login button"`
148: Usage: `/gsd-progress --do "refactor the auth system"`
149: Usage: `/gsd-progress --do "I want to start a new milestone"`
150: 
151: ### Quick Mode
152: 
153: **`/gsd-quick [--full] [--validate] [--discuss] [--research]`**
154: Execute small, ad-hoc tasks with GSD guarantees but skip optional agents.
155: 
156: Quick mode uses the same system with a shorter path:
157: - Spawns planner + executor (skips researcher, checker, verifier by default)
158: - Quick tasks live in `.planning/quick/` separate from planned phases
159: - Updates STATE.md tracking (not ROADMAP.md)
160: 
161: Flags enable additional quality steps:
162: - `--full` — Complete quality pipeline: discussion + research + plan-checking + verification
163: - `--validate` — Plan-checking (max 2 iterations) and post-execution verification only
164: - `--discuss` — Lightweight discussion to surface gray areas before planning
165: - `--research` — Focused research agent investigates approaches before planning
166: 
167: Granular flags are composable: `--discuss --research --validate` gives the same as `--full`.
168: 
169: Usage: `/gsd-quick`
170: Usage: `/gsd-quick --full`
171: Usage: `/gsd-quick --research --validate`
172: Result: Creates `.planning/quick/NNN-slug/PLAN.md`, `.planning/quick/NNN-slug/NNN-slug-SUMMARY.md`
173: 
174: ---
175: 
176: **`/gsd-fast [description]`**
177: Execute a trivial task inline — no subagents, no planning files, no overhead.
178: 
179: For tasks too small to justify planning: typo fixes, config changes, forgotten commits, simple additions. Runs in the current context, makes the change, commits, and logs to STATE.md.
180: 
181: - No PLAN.md or SUMMARY.md created
182: - No subagent spawned (runs inline)
183: - ≤ 3 file edits — redirects to `/gsd-quick` if task is non-trivial
184: - Atomic commit with conventional message
185: 
186: Usage: `/gsd-fast "fix the typo in README"`
187: Usage: `/gsd-fast "add .env to gitignore"`
188: 
189: ### Roadmap Management
190: 
191: **`/gsd-phase <description>`**
192: Add new phase to end of current milestone.
193: 
194: - Appends to ROADMAP.md
195: - Uses next sequential number
196: - Updates phase directory structure
197: 
198: Usage: `/gsd-phase "Add admin dashboard"`
199: 
200: **`/gsd-phase --insert <after> <description>`**
201: Insert urgent work as decimal phase between existing phases.
202: 
203: - Creates intermediate phase (e.g., 7.1 between 7 and 8)
204: - Useful for discovered work that must happen mid-milestone
205: - Maintains phase ordering
206: 
207: Usage: `/gsd-phase --insert 7 "Fix critical auth bug"`
208: Result: Creates Phase 7.1
209: 
210: **`/gsd-phase --remove <number>`**
211: Remove a future phase and renumber subsequent phases.
212: 
213: - Deletes phase directory and all references
214: - Renumbers all subsequent phases to close the gap
215: - Only works on future (unstarted) phases
216: - Git commit preserves historical record
217: 
218: Usage: `/gsd-phase --remove 17`
219: Result: Phase 17 deleted, phases 18-20 become 17-19
220: 
221: **`/gsd-phase --edit <number> [--force]`**
222: Edit any field of an existing roadmap phase in place, preserving number and position.
223: 
224: - Updates title, description, requirements, dependencies in `ROADMAP.md`
225: - `--force` allows editing already-started phases (use with caution)
226: 
227: ### Milestone Management
228: 
229: **`/gsd-new-milestone <name>`**
230: Start a new milestone through unified flow.
231: 
232: - Deep questioning to understand what you're building next
233: - Optional domain research (spawns 4 parallel researcher agents)
234: - Requirements definition with scoping
235: - Roadmap creation with phase breakdown
236: - Optional `--reset-phase-numbers` flag restarts numbering at Phase 1 and archives old phase dirs first for safety
237: 
238: Mirrors `/gsd-new-project` flow for brownfield projects (existing PROJECT.md).
239: 
240: Usage: `/gsd-new-milestone "v2.0 Features"`
241: Usage: `/gsd-new-milestone --reset-phase-numbers "v2.0 Features"`
242: 
243: **`/gsd-complete-milestone <version>`**
244: Archive completed milestone and prepare for next version.
245: 
246: - Creates MILESTONES.md entry with stats
247: - Archives full details to milestones/ directory
248: - Creates git tag for the release
249: - Prepares workspace for next version
250: 
251: Usage: `/gsd-complete-milestone 1.0.0`
252: 
253: ### Progress Tracking
254: 
255: **`/gsd-progress [--next | --forensic | --do "<description>"]`**
256: Check project status and intelligently route to next action.
257: 
258: - Shows visual progress bar and completion percentage
259: - Summarizes recent work from SUMMARY files
260: - Displays current position and what's next
261: - Lists key decisions and open issues
262: - Offers to execute next plan or create it if missing
263: - Detects 100% milestone completion
264: 
265: Modes:
266: - **default** — progress report + intelligent routing
267: - **`--next`** — auto-advance to the next logical step (use `--next --force` to bypass safety gates)
268: - **`--forensic`** — append a 6-check integrity audit after the progress report
269: - **`--do "<text>"`** — smart router: dispatch freeform intent to the matching `/gsd-*` command (see *Smart Router* above)
270: 
271: Usage: `/gsd-progress`
272: Usage: `/gsd-progress --next`
273: Usage: `/gsd-progress --forensic`
274: 
275: ### Session Management
276: 
277: **`/gsd-resume-work`**
278: Resume work from previous session with full context restoration.
279: 
280: - Reads STATE.md for project context
281: - Shows current position and recent progress
282: - Offers next actions based on project state
283: 
284: Usage: `/gsd-resume-work`
285: 
286: **`/gsd-pause-work [--report]`**
287: Create context handoff when pausing work mid-phase.
288: 
289: - `--report` — generate a post-session summary in `.planning/reports/` capturing commits, file changes, and phase progress
290: - Creates .continue-here file with current state
291: - Updates STATE.md session continuity section
292: - Captures in-progress work context
293: 
294: Usage: `/gsd-pause-work`
295: 
296: ### Debugging
297: 
298: **`/gsd-debug [issue description] [--diagnose]`**
299: Systematic debugging with persistent state across context resets.
300: 
301: - `--diagnose` — run a one-shot diagnostic pass without opening a persistent debug session
302: 
303: - Gathers symptoms through adaptive questioning
304: - Creates `.planning/debug/[slug].md` to track investigation
305: - Investigates using scientific method (evidence → hypothesis → test)
306: - Survives `/clear` — run `/gsd-debug` with no args to resume
307: - Archives resolved issues to `.planning/debug/resolved/`
308: 
309: Usage: `/gsd-debug "login button doesn't work"`
310: Usage: `/gsd-debug` (resume active session)
311: 
312: ### Spiking & Sketching
313: 
314: **`/gsd-spike [idea] [--quick]`**
315: Rapidly spike an idea with throwaway experiments to validate feasibility.
316: 
317: - Decomposes idea into 2-5 focused experiments (risk-ordered)
318: - Each spike answers one specific Given/When/Then question
319: - Builds minimum code, runs it, captures verdict (VALIDATED/INVALIDATED/PARTIAL)
320: - Saves to `.planning/spikes/` with MANIFEST.md tracking
321: - Does not require `/gsd-new-project` — works in any repo
322: - `--quick` skips decomposition, builds immediately
323: 
324: Usage: `/gsd-spike "can we stream LLM output over WebSockets?"`
325: Usage: `/gsd-spike --quick "test if pdfjs extracts tables"`
326: 
327: **`/gsd-sketch [idea] [--quick]`**
328: Rapidly sketch UI/design ideas using throwaway HTML mockups with multi-variant exploration.
329: 
330: - Conversational mood/direction intake before building
331: - Each sketch produces 2-3 variants as tabbed HTML pages
332: - User compares variants, cherry-picks elements, iterates
333: - Shared CSS theme system compounds across sketches
334: - Saves to `.planning/sketches/` with MANIFEST.md tracking
335: - Does not require `/gsd-new-project` — works in any repo
336: - `--quick` skips mood intake, jumps to building
337: 
338: Usage: `/gsd-sketch "dashboard layout for the admin panel"`
339: Usage: `/gsd-sketch --quick "form card grouping"`
340: 
341: **`/gsd-spike --wrap-up`**
342: Package spike findings into a persistent project skill.
343: 
344: - Curates each spike one-at-a-time (include/exclude/partial/UAT)
345: - Groups findings by feature area
346: - Generates `./.opencode/skills/spike-findings-[project]/` with references and sources
347: - Writes summary to `.planning/spikes/WRAP-UP-SUMMARY.md`
348: - Adds auto-load routing line to project AGENTS.md
349: 
350: Usage: `/gsd-spike --wrap-up`
351: 
352: **`/gsd-sketch --wrap-up`**
353: Package sketch design findings into a persistent project skill.
354: 
355: - Curates each sketch one-at-a-time (include/exclude/partial/revisit)
356: - Groups findings by design area
357: - Generates `./.opencode/skills/sketch-findings-[project]/` with design decisions, CSS patterns, HTML structures
358: - Writes summary to `.planning/sketches/WRAP-UP-SUMMARY.md`
359: - Adds auto-load routing line to project AGENTS.md
360: 
361: Usage: `/gsd-sketch --wrap-up`
362: 
363: ### Capturing Ideas, Notes, and Todos
364: 
365: **`/gsd-capture [description]`**
366: Capture an idea or task as a structured todo from current conversation.
367: 
368: - Extracts context from conversation (or uses provided description)
369: - Creates structured todo file in `.planning/todos/pending/`
370: - Infers area from file paths for grouping
371: - Checks for duplicates before creating
372: - Updates STATE.md todo count
373: 
374: Usage: `/gsd-capture` (infers from conversation)
375: Usage: `/gsd-capture Add auth token refresh`
376: 
377: **`/gsd-capture --note <text>`**
378: Zero-friction note capture — one command, instant save, no questions.
379: 
380: - Saves timestamped note to `.planning/notes/` (or `/Users/apple/hivemind-plugin-private/.opencode/notes/` globally)
381: - Three subcommands: append (default), list, promote
382: - Promote converts a note into a structured todo
383: - Works without a project (falls back to global scope)
384: 
385: Usage: `/gsd-capture --note refactor the hook system`
386: Usage: `/gsd-capture --note list`
387: Usage: `/gsd-capture --note promote 3`
388: Usage: `/gsd-capture --note --global cross-project idea`
389: 
390: **`/gsd-capture --list [area]`**
391: List pending todos and select one to work on.
392: 
393: - Lists all pending todos with title, area, age
394: - Optional area filter (e.g., `/gsd-capture --list api`)
395: - Loads full context for selected todo
396: - Routes to appropriate action (work now, add to phase, brainstorm)
397: - Moves todo to done/ when work begins
398: 
399: Usage: `/gsd-capture --list`
400: Usage: `/gsd-capture --list api`
401: 
402: ### User Acceptance Testing
403: 
404: **`/gsd-verify-work [phase]`**
405: Validate built features through conversational UAT.
406: 
407: - Extracts testable deliverables from SUMMARY.md files
408: - Presents tests one at a time (yes/no responses)
409: - Automatically diagnoses failures and creates fix plans
410: - Ready for re-execution if issues found
411: 
412: Usage: `/gsd-verify-work 3`
413: 
414: ### Ship Work
415: 
416: **`/gsd-ship [phase]`**
417: Create a PR from completed phase work with an auto-generated body.
418: 
419: - Pushes branch to remote
420: - Creates PR with summary from SUMMARY.md, VERIFICATION.md, REQUIREMENTS.md
421: - Optionally requests code review
422: - Updates STATE.md with shipping status
423: 
424: Prerequisites: Phase verified, `gh` CLI installed and authenticated.
425: 
426: Usage: `/gsd-ship 4` or `/gsd-ship 4 --draft`
427: 
428: ---
429: 
430: **`/gsd-review --phase N [--gemini] [--claude] [--codex] [--coderabbit] [--opencode] [--qwen] [--cursor] [--all]`**
431: Cross-AI peer review — invoke external AI CLIs to independently review phase plans.
432: 
433: - Detects available CLIs (gemini, claude, codex, coderabbit)
434: - Each CLI reviews plans independently with the same structured prompt
435: - CodeRabbit reviews the current git diff (not a prompt) — may take up to 5 minutes
436: - Produces REVIEWS.md with per-reviewer feedback and consensus summary
437: - Feed reviews back into planning: `/gsd-plan-phase N --reviews`
438: 
439: Usage: `/gsd-review --phase 3 --all`
440: 
441: ---
442: 
443: **`/gsd-pr-branch [target]`**
444: Create a clean branch for pull requests by filtering out .planning/ commits.
445: 
446: - Classifies commits: code-only (include), planning-only (exclude), mixed (include sans .planning/)
447: - Cherry-picks code commits onto a clean branch
448: - Reviewers see only code changes, no GSD artifacts
449: 
450: Usage: `/gsd-pr-branch` or `/gsd-pr-branch main`
451: 
452: ---
453: 
454: **`/gsd-capture --seed [idea]`**
455: Capture a forward-looking idea with trigger conditions for automatic surfacing.
456: 
457: - Seeds preserve WHY, WHEN to surface, and breadcrumbs to related code
458: - Auto-surfaces during `/gsd-new-milestone` when trigger conditions match
459: - Better than deferred items — triggers are checked, not forgotten
460: 
461: Usage: `/gsd-capture --seed "add real-time notifications when we build the events system"`
462: 
463: **`/gsd-capture --backlog [description]`**
464: Add an idea to the backlog parking lot for future milestones.
465: 
466: - Creates a backlog item under 999.x numbering in ROADMAP.md
467: - Reserves ideas without committing to the current milestone
468: - Surface and promote later via `/gsd-review-backlog`
469: 
470: Usage: `/gsd-capture --backlog "real-time notifications when events ship"`
471: 
472: ---
473: 
474: **`/gsd-audit-uat`**
475: Cross-phase audit of all outstanding UAT and verification items.
476: - Scans every phase for pending, skipped, blocked, and human_needed items
477: - Cross-references against codebase to detect stale documentation
478: - Produces prioritized human test plan grouped by testability
479: - Use before starting a new milestone to clear verification debt
480: 
481: Usage: `/gsd-audit-uat`
482: 
483: ### Milestone Auditing
484: 
485: **`/gsd-audit-milestone [version]`**
486: Audit milestone completion against original intent.
487: 
488: - Reads all phase VERIFICATION.md files
489: - Checks requirements coverage
490: - Spawns integration checker for cross-phase wiring
491: - Creates MILESTONE-AUDIT.md with gaps and tech debt
492: 
493: Usage: `/gsd-audit-milestone`
494: 
495: ### Configuration
496: 
497: **`/gsd-settings`**
498: Configure workflow toggles and model profile interactively.
499: 
500: - Toggle researcher, plan checker, verifier agents
501: - Select model profile (quality/balanced/budget/inherit)
502: - Updates `.planning/config.json`
503: 
504: Usage: `/gsd-settings`
505: 
506: **`/gsd-config [--profile <profile> | --advanced | --integrations]`**
507: Configure GSD beyond the basic settings: model profile, advanced tuning, and third-party integrations.
508: 
509: - `--profile <profile>` — quick switch model profile (`quality | balanced | budget | inherit`)
510: - `--advanced` — power-user tuning: plan bounce, timeouts, branch templates, cross-AI execution (replaces the former `gsd-settings-advanced`)
511: - `--integrations` — third-party API keys, code-review CLI routing, agent-skill injection (replaces the former `gsd-settings-integrations`)
512: 
513: - `quality` — Opus everywhere except verification
514: - `balanced` — Opus for planning, Sonnet for execution (default)
515: - `budget` — Sonnet for writing, Haiku for research/verification
516: - `inherit` — Use current session model for all agents (OpenCode `/model`)
517: 
518: Usage: `/gsd-config --profile budget`
519: 
520: ### Utility Commands
521: 
522: **`/gsd-cleanup`**
523: Archive accumulated phase directories from completed milestones.
524: 
525: - Identifies phases from completed milestones still in `.planning/phases/`
526: - Shows dry-run summary before moving anything
527: - Moves phase dirs to `.planning/milestones/v{X.Y}-phases/`
528: - Use after multiple milestones to reduce `.planning/phases/` clutter
529: 
530: Usage: `/gsd-cleanup`
531: 
532: **`/gsd-help`**
533: Show this command reference.
534: 
535: **`/gsd-update [--sync] [--reapply]`**
536: Update GSD to latest version with changelog preview.
537: 
538: - `--sync` — sync managed GSD skills across runtime roots (replaces the former `gsd-sync-skills`)
539: - `--reapply` — reapply local modifications after an update (replaces the former `gsd-reapply-patches`)
540: 
541: - Shows installed vs latest version comparison
542: - Displays changelog entries for versions you've missed
543: - Highlights breaking changes
544: - Confirms before running install
545: - Better than raw `npx get-shit-done-cc`
546: 
547: Usage: `/gsd-update`
548: 
549: ## Additional Commands
550: 
551: The commands above cover the most common day-to-day flows. Every command listed here is also a live `/gsd-*` slash command and is grouped by purpose.
552: 
553: ### Discovery & Specification
554: 
555: - **`/gsd-explore`** — Socratic ideation and idea routing. Think through ideas before committing to plans.
556: - **`/gsd-spec-phase <phase> [--auto] [--text]`** — Clarify WHAT a phase delivers with ambiguity scoring; produces a SPEC.md before discuss-phase.
557: - **`/gsd-ai-integration-phase [phase]`** — Generate an AI-SPEC.md design contract for phases that involve building AI systems.
558: - **`/gsd-ui-phase [phase]`** — Generate UI design contract (UI-SPEC.md) for frontend phases.
559: - **`/gsd-import --from <filepath> | --from-gsd2`** — Ingest external plans with conflict detection, or reverse-migrate a GSD-2 (`.gsd/`) project back to GSD v1 (`.planning/`) format.
560: - **`/gsd-ingest-docs [path] [--mode new|merge] [--manifest <file>] [--resolve auto|interactive]`** — Bootstrap or merge a `.planning/` setup from existing ADRs, PRDs, SPECs, and docs in a repo.
561: 
562: ### Planning & Execution
563: 
564: - **`/gsd-ultraplan-phase [phase]`** — [BETA] Offload plan phase to Claude Code's ultraplan cloud; review in browser and import back.
565: - **`/gsd-plan-review-convergence <phase> [--codex] [--gemini] [--claude] [--opencode] [--ollama] [--lm-studio] [--llama-cpp] [--all] [--text] [--ws <name>] [--max-cycles N]`** — Cross-AI plan convergence loop — replan with review feedback until no HIGH concerns remain. Supports both cloud reviewers (Codex/Gemini/the agent/OpenCode) and local model runtimes (Ollama, LM Studio, llama.cpp).
566: - **`/gsd-autonomous [--from N] [--to N] [--only N] [--interactive]`** — Run all remaining phases autonomously: discuss → plan → execute per phase.
567: 
568: ### Quality, Review & Verification
569: 
570: - **`/gsd-code-review <phase> [--depth=quick|standard|deep] [--files file1,file2,...] [--fix [--all] [--auto]]`** — Review source files changed during a phase for bugs, security issues, and code quality problems.
571: - **`/gsd-secure-phase [phase]`** — Retroactively verify threat mitigations for a completed phase.
572: - **`/gsd-validate-phase [phase]`** — Retroactively audit and fill Nyquist validation gaps for a completed phase.
573: - **`/gsd-ui-review [phase]`** — Retroactive 6-pillar visual audit of implemented frontend code.
574: - **`/gsd-eval-review [phase]`** — Audit an executed AI phase's evaluation coverage and produce an EVAL-REVIEW.md remediation plan.
575: - **`/gsd-audit-fix --source <audit-uat> [--severity medium|high|all] [--max N] [--dry-run]`** — Autonomous audit-to-fix pipeline: find issues, classify, fix, test, commit.
576: - **`/gsd-add-tests <phase> [additional instructions]`** — Generate tests for a completed phase based on UAT criteria and implementation.
577: 
578: ### Diagnostics & Maintenance
579: 
580: - **`/gsd-health [--repair] [--context]`** — Diagnose planning directory health and optionally repair issues.
581: - **`/gsd-forensics [problem description]`** — Post-mortem investigation for failed GSD workflows; diagnoses what went wrong.
582: - **`/gsd-undo --last N | --phase NN | --plan NN-MM`** — Safe git revert. Roll back phase or plan commits using the phase manifest with dependency checks.
583: - **`/gsd-docs-update [--force] [--verify-only]`** — Generate or update project documentation verified against the codebase.
584: - **`/gsd-extract-learnings <phase>`** — Extract decisions, lessons, patterns, and surprises from completed phase artifacts.
585: 
586: ### Knowledge & Context
587: 
588: - **`/gsd-graphify [build|query <term>|status|diff]`** — Build, query, and inspect the project knowledge graph in `.planning/graphs/`.
589: - **`/gsd-thread [list [--open|--resolved] | close <slug> | status <slug> | name | description]`** — Manage persistent context threads for cross-session work.
590: - **`/gsd-profile-user [--questionnaire] [--refresh]`** — Generate developer behavioral profile and create Claude-discoverable artifacts.
591: - **`/gsd-stats`** — Display project statistics: phases, plans, requirements, git metrics, and timeline.
592: 
593: ### Workflow & Orchestration
594: 
595: - **`/gsd-manager [--analyze-deps]`** — Interactive command center for managing multiple phases from one terminal. `--analyze-deps` scans ROADMAP phases for dependency relationships before parallel execution.
596: - **`/gsd-workspace [--new | --list | --remove] [name]`** — Manage GSD workspaces: create, list, or remove isolated workspace environments.
597: - **`/gsd-workstreams`** — Manage parallel workstreams: list, create, switch, status, progress, complete, and resume.
598: - **`/gsd-review-backlog`** — Review and promote backlog items to active milestone.
599: - **`/gsd-milestone-summary [version]`** — Generate a comprehensive project summary from milestone artifacts for team onboarding and review.
600: 
601: ### Repository Integration
602: 
603: - **`/gsd-inbox [--issues] [--prs] [--label] [--close-incomplete] [--repo owner/repo]`** — Triage and review open GitHub issues and PRs against project templates and contribution guidelines.
604: 
605: ### Namespace Routers (model-facing meta-skills)
606: 
607: These six skills exist primarily for the model to perform two-stage hierarchical routing across 60+ skills. You can invoke them directly when you want to browse a category interactively.
608: 
609: - **`/gsd-context`** — Codebase intelligence routing (map, graphify, docs, learnings).
610: - **`/gsd-ideate`** — Exploration / capture routing (explore, sketch, spike, spec, capture).
611: - **`/gsd-manage`** — Configuration and workspace routing (workstreams, thread, update, ship, inbox).
612: - **`/gsd-project`** — Project-lifecycle routing (milestones, audits, summary).
613: - **`/gsd-review`** — Quality-gate routing (code review, debug, audit, security, eval, ui).
614: - **`/gsd-workflow`** — Phase-pipeline routing (discuss, plan, execute, verify, phase, progress).
615: 
616: ## Files & Structure
617: 
618: ```
619: .planning/
620: ├── PROJECT.md            # Project vision
621: ├── ROADMAP.md            # Current phase breakdown
622: ├── STATE.md              # Project memory & context
623: ├── RETROSPECTIVE.md      # Living retrospective (updated per milestone)
624: ├── config.json           # Workflow mode & gates
625: ├── todos/                # Captured ideas and tasks
626: │   ├── pending/          # Todos waiting to be worked on
627: │   └── done/             # Completed todos
628: ├── spikes/               # Spike experiments (/gsd-spike)
629: │   ├── MANIFEST.md       # Spike inventory and verdicts
630: │   └── NNN-name/         # Individual spike directories
631: ├── sketches/             # Design sketches (/gsd-sketch)
632: │   ├── MANIFEST.md       # Sketch inventory and winners
633: │   ├── themes/           # Shared CSS theme files
634: │   └── NNN-name/         # Individual sketch directories (HTML + README)
635: ├── debug/                # Active debug sessions
636: │   └── resolved/         # Archived resolved issues
637: ├── milestones/
638: │   ├── v1.0-ROADMAP.md       # Archived roadmap snapshot
639: │   ├── v1.0-REQUIREMENTS.md  # Archived requirements
640: │   └── v1.0-phases/          # Archived phase dirs (via /gsd-cleanup or --archive-phases)
641: │       ├── 01-foundation/
642: │       └── 02-core-features/
643: ├── codebase/             # Codebase map (brownfield projects)
644: │   ├── STACK.md          # Languages, frameworks, dependencies
645: │   ├── ARCHITECTURE.md   # Patterns, layers, data flow
646: │   ├── STRUCTURE.md      # Directory layout, key files
647: │   ├── CONVENTIONS.md    # Coding standards, naming
648: │   ├── TESTING.md        # Test setup, patterns
649: │   ├── INTEGRATIONS.md   # External services, APIs
650: │   └── CONCERNS.md       # Tech debt, known issues
651: └── phases/
652:     ├── 01-foundation/
653:     │   ├── 01-01-PLAN.md
654:     │   └── 01-01-SUMMARY.md
655:     └── 02-core-features/
656:         ├── 02-01-PLAN.md
657:         └── 02-01-SUMMARY.md
658: ```
659: 
660: ## Workflow Modes
661: 
662: Set during `/gsd-new-project`:
663: 
664: **Interactive Mode**
665: 
666: - Confirms each major decision
667: - Pauses at checkpoints for approval
668: - More guidance throughout
669: 
670: **YOLO Mode**
671: 
672: - Auto-approves most decisions
673: - Executes plans without confirmation
674: - Only stops for critical checkpoints
675: 
676: Change anytime by editing `.planning/config.json`
677: 
678: ## Planning Configuration
679: 
680: Configure how planning artifacts are managed in `.planning/config.json`:
681: 
682: **`planning.commit_docs`** (default: `true`)
683: - `true`: Planning artifacts committed to git (standard workflow)
684: - `false`: Planning artifacts kept local-only, not committed
685: 
686: When `commit_docs: false`:
687: - Add `.planning/` to your `.gitignore`
688: - Useful for OSS contributions, client projects, or keeping planning private
689: - All planning files still work normally, just not tracked in git
690: 
691: **`planning.search_gitignored`** (default: `false`)
692: - `true`: Add `--no-ignore` to broad ripgrep searches
693: - Only needed when `.planning/` is gitignored and you want project-wide searches to include it
694: 
695: Example config:
696: ```json
697: {
698:   "planning": {
699:     "commit_docs": false,
700:     "search_gitignored": true
701:   }
702: }
703: ```
704: 
705: ## Common Workflows
706: 
707: **Starting a new project:**
708: 
709: ```
710: /gsd-new-project        # Unified flow: questioning → research → requirements → roadmap
711: /clear
712: /gsd-plan-phase 1       # Create plans for first phase
713: /clear
714: /gsd-execute-phase 1    # Execute all plans in phase
715: ```
716: 
717: **Resuming work after a break:**
718: 
719: ```
720: /gsd-progress  # See where you left off and continue
721: ```
722: 
723: **Adding urgent mid-milestone work:**
724: 
725: ```
726: /gsd-phase --insert 5 "Critical security fix"
727: /gsd-plan-phase 5.1
728: /gsd-execute-phase 5.1
729: ```
730: 
731: **Completing a milestone:**
732: 
733: ```
734: /gsd-complete-milestone 1.0.0
735: /clear
736: /gsd-new-milestone  # Start next milestone (questioning → research → requirements → roadmap)
737: ```
738: 
739: **Capturing ideas during work:**
740: 
741: ```
742: /gsd-capture                                  # Capture from conversation context
743: /gsd-capture Fix modal z-index                # Capture with explicit description
744: /gsd-capture --note refactor auth system      # Quick friction-free note
745: /gsd-capture --seed "real-time notifications" # Forward-looking idea with triggers
746: /gsd-capture --list                           # Review and work on todos
747: /gsd-capture --list api                       # Filter by area
748: ```
749: 
750: **Debugging an issue:**
751: 
752: ```
753: /gsd-debug "form submission fails silently"  # Start debug session
754: # ... investigation happens, context fills up ...
755: /clear
756: /gsd-debug                                    # Resume from where you left off
757: ```
758: 
759: ## Getting Help
760: 
761: - Read `.planning/PROJECT.md` for project vision
762: - Read `.planning/STATE.md` for current context
763: - Check `.planning/ROADMAP.md` for phase status
764: - Run `/gsd-progress` to check where you're up to
765: </reference>

(End of file - total 765 lines)
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

- **DELEGATION STACKING — attach work onto ANY existing session:** Both `task` and `delegate-task` support attaching new work as a child of a completed main session — NOT just resuming aborted tasks. Pattern: pass the existing session ID directly.
  - **`task` tool:** set `task_id` parameter to any existing session ID (not just a previous task_id from task tool). The new subagent attaches as a child of that session.
  - **`delegate-task` tool:** pass `context` as JSON: `{"parentSessionId": "<session-id>"}`. The new delegation attaches as a child of that session.
  - Do NOT inject the session ID into the prompt text — that creates a new independent session. The correct approach is passing it as a parameter so OpenCode's hierarchy tracking properly chains the sessions.
  - **Prompt stays simple** — context from the target session is preserved through the session chain. No need to re-describe old work in the prompt. This is the same principle as `subagent_type`/`agent` parameter: you specify the agent name to select the handler, you specify `task_id`/`parentSessionId` to select the session to attach to.
  - This pattern covers BOTH use cases: **resume** (incomplete session) and **stack-on** (completed session to add new work as a child).

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

### Tool: execute-slash-command

**Input:**
```json
{
  "callID": "call_01_HdEnjq407EvNxNMuPK070260"
}
```


## USER (turn 25)

**source:** real-human

@gsd-advisor-researcher /gsd-stats

## USER (turn 26)

**source:** real-human



### Tool: execute-slash-command

**Input:**
```json
{
  "callID": "call_02_jJJeg1K6OOQ7aoBRqWCf6996"
}
```


## USER (turn 27)

**source:** real-human

@hm-l2-researcher /gsd-help

## USER (turn 28)

**source:** real-human

sao mà gọi là thành công được con chó ngu si 2 các cuối là fail nhìn đi agents có được swtich ko, commands cũng không append ra nếu append ra nó phải parse và appended vào context hoặc tạo ngay một delegated session

### Tool: write

**Input:**
```json
{
  "callID": "call_00_wjufTVDV5WN8Nx1nIKKH3049"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_Rtw9C0wBs5riYrNyTPO15822"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_00_65kyZOzZGwIE5P8dVVGP3401"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_dlvDCRxC0dRSoelVKfBd7909"
}
```


### Tool: execute-slash-command

**Input:**
```json
{
  "callID": "call_00_LtdlPcgFADQcNHwlEIQu5194"
}
```


## USER (turn 29)

**source:** real-human

<objective>
Display the complete GSD command reference.

Output ONLY the reference content below. Do NOT add:
- Project-specific analysis
- Git status or file context
- Next-step suggestions
- Any commentary beyond the reference
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/help.md
</execution_context>

<process>
Execute end-to-end.
Display the reference content directly — no additions or modifications.
</process>
Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/help.md"}
<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/help.md</path>
<type>file</type>
<content>
1: <purpose>
2: Display the complete GSD command reference. Output ONLY the reference content. Do NOT add project-specific analysis, git status, next-step suggestions, or any commentary beyond the reference.
3: </purpose>
4: 
5: <reference>
6: # GSD Command Reference
7: 
8: **GSD** (Get Shit Done) creates hierarchical project plans optimized for solo agentic development with Claude Code.
9: 
10: ## Quick Start
11: 
12: 1. `/gsd-new-project` - Initialize project (includes research, requirements, roadmap)
13: 2. `/gsd-plan-phase 1` - Create detailed plan for first phase
14: 3. `/gsd-execute-phase 1` - Execute the phase
15: 
16: ## Staying Updated
17: 
18: GSD evolves fast. Update periodically:
19: 
20: ```bash
21: npx get-shit-done-cc@latest
22: ```
23: 
24: ## Core Workflow
25: 
26: ```
27: /gsd-new-project → /gsd-plan-phase → /gsd-execute-phase → repeat
28: ```
29: 
30: ### Project Initialization
31: 
32: **`/gsd-new-project`**
33: Initialize new project through unified flow.
34: 
35: One command takes you from idea to ready-for-planning:
36: - Deep questioning to understand what you're building
37: - Optional domain research (spawns 4 parallel researcher agents)
38: - Requirements definition with v1/v2/out-of-scope scoping
39: - Roadmap creation with phase breakdown and success criteria
40: 
41: Creates all `.planning/` artifacts:
42: - `PROJECT.md` — vision and requirements
43: - `config.json` — workflow mode (interactive/yolo)
44: - `research/` — domain research (if selected)
45: - `REQUIREMENTS.md` — scoped requirements with REQ-IDs
46: - `ROADMAP.md` — phases mapped to requirements
47: - `STATE.md` — project memory
48: 
49: Usage: `/gsd-new-project`
50: 
51: **`/gsd-map-codebase [--fast] [--focus <area>] [--query <term>]`**
52: Map an existing codebase for brownfield projects.
53: 
54: - `--fast` — rapid lightweight assessment (replaces the former `gsd-scan`)
55: - `--focus <area>` — scope the map to a specific area
56: - `--query <term>` — query the codebase intelligence index in `.planning/intel/` (replaces the former `gsd-intel`)
57: 
58: - Analyzes codebase with parallel Explore agents
59: - Creates `.planning/codebase/` with 7 focused documents
60: - Covers stack, architecture, structure, conventions, testing, integrations, concerns
61: - Use before `/gsd-new-project` on existing codebases
62: 
63: Usage: `/gsd-map-codebase`
64: 
65: ### Phase Planning
66: 
67: **`/gsd-discuss-phase <number> [--chain | --analyze | --power | --assumptions] [--batch[=N]]`**
68: Help articulate your vision for a phase before planning.
69: 
70: - `--chain` — chained-prompt discuss flow
71: - `--analyze` — deep assumption analysis pass
72: - `--power` — power-user mode with extended question set
73: - `--assumptions` — surface the agent's implementation assumptions about the phase without an interactive session
74: 
75: - Captures how you imagine this phase working
76: - Creates CONTEXT.md with your vision, essentials, and boundaries
77: - Use when you have ideas about how something should look/feel
78: - Optional `--batch` asks 2-5 related questions at a time instead of one-by-one
79: 
80: Usage: `/gsd-discuss-phase 2`
81: Usage: `/gsd-discuss-phase 2 --batch`
82: Usage: `/gsd-discuss-phase 2 --batch=3`
83: 
84: **`/gsd-mvp-phase <number> [--force]`**
85: Plan a phase as a vertical MVP slice — three structured user-story prompts (`As a / I want to / So that`), SPIDR splitting if the story is too large, then delegates to `/gsd-plan-phase` with MVP mode active.
86: 
87: - Mutates the phase's ROADMAP entry: writes `**Mode:** mvp` + replaces `**Goal:**` with the assembled user story
88: - Validates the story via `gsd-sdk query user-story.validate` (canonical regex `/^As a .+, I want to .+, so that .+\.$/`)
89: - `--force` overrides the status guard (required if the phase is already `in_progress` or `completed`)
90: - Pairs with the new-project mode prompt (Vertical MVP vs Horizontal Layers)
91: 
92: Usage: `/gsd-mvp-phase 1`
93: Usage: `/gsd-mvp-phase 2 --force`
94: 
95: **`/gsd-plan-phase <number> [--research] [--skip-research] [--research-phase <N>] [--view] [--gaps] [--skip-verify] [--tdd] [--mvp]`**
96: Create detailed execution plan for a specific phase.
97: 
98: - `--skip-research` — bypass the research subagent
99: - `--research-phase <N>` — research-only mode. Spawns the research agent for phase `<N>`, writes `RESEARCH.md`, then exits before the planner runs. Useful for cross-phase research, doc review before committing to a planning approach, and correction-without-replanning loops. Replaces the deleted `gsd-research-phase` standalone command (#3042).
100:   - Modifiers: `--research` forces refresh (re-spawn researcher, no prompt). `--view` prints existing `RESEARCH.md` to stdout without spawning. With neither, prompts `update / view / skip` if `RESEARCH.md` already exists.
101: - `--gaps` — focus only on closing gaps from a prior plan-check
102: - `--skip-verify` — skip the post-plan verifier loop
103: - `--tdd` — plan in test-driven order (tests before code)
104: - `--mvp` — vertical-slice MVP planning mode
105: 
106: - Generates `.planning/phases/XX-phase-name/XX-YY-PLAN.md`
107: - Breaks phase into concrete, actionable tasks
108: - Includes verification criteria and success measures
109: - Multiple plans per phase supported (XX-01, XX-02, etc.)
110: 
111: Usage: `/gsd-plan-phase 1`
112: Usage: `/gsd-plan-phase --research-phase 2` — research only on phase 2 (prompts if `RESEARCH.md` exists)
113: Usage: `/gsd-plan-phase --research-phase 2 --view` — print existing `RESEARCH.md`, no spawn
114: Usage: `/gsd-plan-phase --research-phase 2 --research` — force-refresh, no prompt
115: Result: Creates `.planning/phases/01-foundation/01-01-PLAN.md`
116: 
117: **PRD Express Path:** Pass `--prd path/to/requirements.md` to skip discuss-phase entirely. Your PRD becomes locked decisions in CONTEXT.md. Useful when you already have clear acceptance criteria.
118: 
119: ### Execution
120: 
121: **`/gsd-execute-phase <phase-number> [--wave N] [--gaps-only] [--tdd]`**
122: Execute all plans in a phase, or run a specific wave.
123: 
124: - `--wave N` — execute only wave N (see *Plans within each wave* below)
125: - `--gaps-only` — re-run only plans flagged as gaps by a prior verifier
126: - `--tdd` — enforce test-driven order during execution
127: 
128: - Groups plans by wave (from frontmatter), executes waves sequentially
129: - Plans within each wave run in parallel via Task tool
130: - Optional `--wave N` flag executes only Wave `N` and stops unless the phase is now fully complete
131: - Verifies phase goal after all plans complete
132: - Updates REQUIREMENTS.md, ROADMAP.md, STATE.md
133: 
134: Usage: `/gsd-execute-phase 5`
135: Usage: `/gsd-execute-phase 5 --wave 2`
136: 
137: ### Smart Router
138: 
139: **`/gsd-progress --do "<description>"`**
140: Route freeform text to the right GSD command automatically.
141: 
142: - Analyzes natural language input to find the best matching GSD command
143: - Acts as a dispatcher — never does the work itself
144: - Resolves ambiguity by asking you to pick between top matches
145: - Use when you know what you want but don't know which `/gsd-*` command to run
146: 
147: Usage: `/gsd-progress --do "fix the login button"`
148: Usage: `/gsd-progress --do "refactor the auth system"`
149: Usage: `/gsd-progress --do "I want to start a new milestone"`
150: 
151: ### Quick Mode
152: 
153: **`/gsd-quick [--full] [--validate] [--discuss] [--research]`**
154: Execute small, ad-hoc tasks with GSD guarantees but skip optional agents.
155: 
156: Quick mode uses the same system with a shorter path:
157: - Spawns planner + executor (skips researcher, checker, verifier by default)
158: - Quick tasks live in `.planning/quick/` separate from planned phases
159: - Updates STATE.md tracking (not ROADMAP.md)
160: 
161: Flags enable additional quality steps:
162: - `--full` — Complete quality pipeline: discussion + research + plan-checking + verification
163: - `--validate` — Plan-checking (max 2 iterations) and post-execution verification only
164: - `--discuss` — Lightweight discussion to surface gray areas before planning
165: - `--research` — Focused research agent investigates approaches before planning
166: 
167: Granular flags are composable: `--discuss --research --validate` gives the same as `--full`.
168: 
169: Usage: `/gsd-quick`
170: Usage: `/gsd-quick --full`
171: Usage: `/gsd-quick --research --validate`
172: Result: Creates `.planning/quick/NNN-slug/PLAN.md`, `.planning/quick/NNN-slug/NNN-slug-SUMMARY.md`
173: 
174: ---
175: 
176: **`/gsd-fast [description]`**
177: Execute a trivial task inline — no subagents, no planning files, no overhead.
178: 
179: For tasks too small to justify planning: typo fixes, config changes, forgotten commits, simple additions. Runs in the current context, makes the change, commits, and logs to STATE.md.
180: 
181: - No PLAN.md or SUMMARY.md created
182: - No subagent spawned (runs inline)
183: - ≤ 3 file edits — redirects to `/gsd-quick` if task is non-trivial
184: - Atomic commit with conventional message
185: 
186: Usage: `/gsd-fast "fix the typo in README"`
187: Usage: `/gsd-fast "add .env to gitignore"`
188: 
189: ### Roadmap Management
190: 
191: **`/gsd-phase <description>`**
192: Add new phase to end of current milestone.
193: 
194: - Appends to ROADMAP.md
195: - Uses next sequential number
196: - Updates phase directory structure
197: 
198: Usage: `/gsd-phase "Add admin dashboard"`
199: 
200: **`/gsd-phase --insert <after> <description>`**
201: Insert urgent work as decimal phase between existing phases.
202: 
203: - Creates intermediate phase (e.g., 7.1 between 7 and 8)
204: - Useful for discovered work that must happen mid-milestone
205: - Maintains phase ordering
206: 
207: Usage: `/gsd-phase --insert 7 "Fix critical auth bug"`
208: Result: Creates Phase 7.1
209: 
210: **`/gsd-phase --remove <number>`**
211: Remove a future phase and renumber subsequent phases.
212: 
213: - Deletes phase directory and all references
214: - Renumbers all subsequent phases to close the gap
215: - Only works on future (unstarted) phases
216: - Git commit preserves historical record
217: 
218: Usage: `/gsd-phase --remove 17`
219: Result: Phase 17 deleted, phases 18-20 become 17-19
220: 
221: **`/gsd-phase --edit <number> [--force]`**
222: Edit any field of an existing roadmap phase in place, preserving number and position.
223: 
224: - Updates title, description, requirements, dependencies in `ROADMAP.md`
225: - `--force` allows editing already-started phases (use with caution)
226: 
227: ### Milestone Management
228: 
229: **`/gsd-new-milestone <name>`**
230: Start a new milestone through unified flow.
231: 
232: - Deep questioning to understand what you're building next
233: - Optional domain research (spawns 4 parallel researcher agents)
234: - Requirements definition with scoping
235: - Roadmap creation with phase breakdown
236: - Optional `--reset-phase-numbers` flag restarts numbering at Phase 1 and archives old phase dirs first for safety
237: 
238: Mirrors `/gsd-new-project` flow for brownfield projects (existing PROJECT.md).
239: 
240: Usage: `/gsd-new-milestone "v2.0 Features"`
241: Usage: `/gsd-new-milestone --reset-phase-numbers "v2.0 Features"`
242: 
243: **`/gsd-complete-milestone <version>`**
244: Archive completed milestone and prepare for next version.
245: 
246: - Creates MILESTONES.md entry with stats
247: - Archives full details to milestones/ directory
248: - Creates git tag for the release
249: - Prepares workspace for next version
250: 
251: Usage: `/gsd-complete-milestone 1.0.0`
252: 
253: ### Progress Tracking
254: 
255: **`/gsd-progress [--next | --forensic | --do "<description>"]`**
256: Check project status and intelligently route to next action.
257: 
258: - Shows visual progress bar and completion percentage
259: - Summarizes recent work from SUMMARY files
260: - Displays current position and what's next
261: - Lists key decisions and open issues
262: - Offers to execute next plan or create it if missing
263: - Detects 100% milestone completion
264: 
265: Modes:
266: - **default** — progress report + intelligent routing
267: - **`--next`** — auto-advance to the next logical step (use `--next --force` to bypass safety gates)
268: - **`--forensic`** — append a 6-check integrity audit after the progress report
269: - **`--do "<text>"`** — smart router: dispatch freeform intent to the matching `/gsd-*` command (see *Smart Router* above)
270: 
271: Usage: `/gsd-progress`
272: Usage: `/gsd-progress --next`
273: Usage: `/gsd-progress --forensic`
274: 
275: ### Session Management
276: 
277: **`/gsd-resume-work`**
278: Resume work from previous session with full context restoration.
279: 
280: - Reads STATE.md for project context
281: - Shows current position and recent progress
282: - Offers next actions based on project state
283: 
284: Usage: `/gsd-resume-work`
285: 
286: **`/gsd-pause-work [--report]`**
287: Create context handoff when pausing work mid-phase.
288: 
289: - `--report` — generate a post-session summary in `.planning/reports/` capturing commits, file changes, and phase progress
290: - Creates .continue-here file with current state
291: - Updates STATE.md session continuity section
292: - Captures in-progress work context
293: 
294: Usage: `/gsd-pause-work`
295: 
296: ### Debugging
297: 
298: **`/gsd-debug [issue description] [--diagnose]`**
299: Systematic debugging with persistent state across context resets.
300: 
301: - `--diagnose` — run a one-shot diagnostic pass without opening a persistent debug session
302: 
303: - Gathers symptoms through adaptive questioning
304: - Creates `.planning/debug/[slug].md` to track investigation
305: - Investigates using scientific method (evidence → hypothesis → test)
306: - Survives `/clear` — run `/gsd-debug` with no args to resume
307: - Archives resolved issues to `.planning/debug/resolved/`
308: 
309: Usage: `/gsd-debug "login button doesn't work"`
310: Usage: `/gsd-debug` (resume active session)
311: 
312: ### Spiking & Sketching
313: 
314: **`/gsd-spike [idea] [--quick]`**
315: Rapidly spike an idea with throwaway experiments to validate feasibility.
316: 
317: - Decomposes idea into 2-5 focused experiments (risk-ordered)
318: - Each spike answers one specific Given/When/Then question
319: - Builds minimum code, runs it, captures verdict (VALIDATED/INVALIDATED/PARTIAL)
320: - Saves to `.planning/spikes/` with MANIFEST.md tracking
321: - Does not require `/gsd-new-project` — works in any repo
322: - `--quick` skips decomposition, builds immediately
323: 
324: Usage: `/gsd-spike "can we stream LLM output over WebSockets?"`
325: Usage: `/gsd-spike --quick "test if pdfjs extracts tables"`
326: 
327: **`/gsd-sketch [idea] [--quick]`**
328: Rapidly sketch UI/design ideas using throwaway HTML mockups with multi-variant exploration.
329: 
330: - Conversational mood/direction intake before building
331: - Each sketch produces 2-3 variants as tabbed HTML pages
332: - User compares variants, cherry-picks elements, iterates
333: - Shared CSS theme system compounds across sketches
334: - Saves to `.planning/sketches/` with MANIFEST.md tracking
335: - Does not require `/gsd-new-project` — works in any repo
336: - `--quick` skips mood intake, jumps to building
337: 
338: Usage: `/gsd-sketch "dashboard layout for the admin panel"`
339: Usage: `/gsd-sketch --quick "form card grouping"`
340: 
341: **`/gsd-spike --wrap-up`**
342: Package spike findings into a persistent project skill.
343: 
344: - Curates each spike one-at-a-time (include/exclude/partial/UAT)
345: - Groups findings by feature area
346: - Generates `./.opencode/skills/spike-findings-[project]/` with references and sources
347: - Writes summary to `.planning/spikes/WRAP-UP-SUMMARY.md`
348: - Adds auto-load routing line to project AGENTS.md
349: 
350: Usage: `/gsd-spike --wrap-up`
351: 
352: **`/gsd-sketch --wrap-up`**
353: Package sketch design findings into a persistent project skill.
354: 
355: - Curates each sketch one-at-a-time (include/exclude/partial/revisit)
356: - Groups findings by design area
357: - Generates `./.opencode/skills/sketch-findings-[project]/` with design decisions, CSS patterns, HTML structures
358: - Writes summary to `.planning/sketches/WRAP-UP-SUMMARY.md`
359: - Adds auto-load routing line to project AGENTS.md
360: 
361: Usage: `/gsd-sketch --wrap-up`
362: 
363: ### Capturing Ideas, Notes, and Todos
364: 
365: **`/gsd-capture [description]`**
366: Capture an idea or task as a structured todo from current conversation.
367: 
368: - Extracts context from conversation (or uses provided description)
369: - Creates structured todo file in `.planning/todos/pending/`
370: - Infers area from file paths for grouping
371: - Checks for duplicates before creating
372: - Updates STATE.md todo count
373: 
374: Usage: `/gsd-capture` (infers from conversation)
375: Usage: `/gsd-capture Add auth token refresh`
376: 
377: **`/gsd-capture --note <text>`**
378: Zero-friction note capture — one command, instant save, no questions.
379: 
380: - Saves timestamped note to `.planning/notes/` (or `/Users/apple/hivemind-plugin-private/.opencode/notes/` globally)
381: - Three subcommands: append (default), list, promote
382: - Promote converts a note into a structured todo
383: - Works without a project (falls back to global scope)
384: 
385: Usage: `/gsd-capture --note refactor the hook system`
386: Usage: `/gsd-capture --note list`
387: Usage: `/gsd-capture --note promote 3`
388: Usage: `/gsd-capture --note --global cross-project idea`
389: 
390: **`/gsd-capture --list [area]`**
391: List pending todos and select one to work on.
392: 
393: - Lists all pending todos with title, area, age
394: - Optional area filter (e.g., `/gsd-capture --list api`)
395: - Loads full context for selected todo
396: - Routes to appropriate action (work now, add to phase, brainstorm)
397: - Moves todo to done/ when work begins
398: 
399: Usage: `/gsd-capture --list`
400: Usage: `/gsd-capture --list api`
401: 
402: ### User Acceptance Testing
403: 
404: **`/gsd-verify-work [phase]`**
405: Validate built features through conversational UAT.
406: 
407: - Extracts testable deliverables from SUMMARY.md files
408: - Presents tests one at a time (yes/no responses)
409: - Automatically diagnoses failures and creates fix plans
410: - Ready for re-execution if issues found
411: 
412: Usage: `/gsd-verify-work 3`
413: 
414: ### Ship Work
415: 
416: **`/gsd-ship [phase]`**
417: Create a PR from completed phase work with an auto-generated body.
418: 
419: - Pushes branch to remote
420: - Creates PR with summary from SUMMARY.md, VERIFICATION.md, REQUIREMENTS.md
421: - Optionally requests code review
422: - Updates STATE.md with shipping status
423: 
424: Prerequisites: Phase verified, `gh` CLI installed and authenticated.
425: 
426: Usage: `/gsd-ship 4` or `/gsd-ship 4 --draft`
427: 
428: ---
429: 
430: **`/gsd-review --phase N [--gemini] [--claude] [--codex] [--coderabbit] [--opencode] [--qwen] [--cursor] [--all]`**
431: Cross-AI peer review — invoke external AI CLIs to independently review phase plans.
432: 
433: - Detects available CLIs (gemini, claude, codex, coderabbit)
434: - Each CLI reviews plans independently with the same structured prompt
435: - CodeRabbit reviews the current git diff (not a prompt) — may take up to 5 minutes
436: - Produces REVIEWS.md with per-reviewer feedback and consensus summary
437: - Feed reviews back into planning: `/gsd-plan-phase N --reviews`
438: 
439: Usage: `/gsd-review --phase 3 --all`
440: 
441: ---
442: 
443: **`/gsd-pr-branch [target]`**
444: Create a clean branch for pull requests by filtering out .planning/ commits.
445: 
446: - Classifies commits: code-only (include), planning-only (exclude), mixed (include sans .planning/)
447: - Cherry-picks code commits onto a clean branch
448: - Reviewers see only code changes, no GSD artifacts
449: 
450: Usage: `/gsd-pr-branch` or `/gsd-pr-branch main`
451: 
452: ---
453: 
454: **`/gsd-capture --seed [idea]`**
455: Capture a forward-looking idea with trigger conditions for automatic surfacing.
456: 
457: - Seeds preserve WHY, WHEN to surface, and breadcrumbs to related code
458: - Auto-surfaces during `/gsd-new-milestone` when trigger conditions match
459: - Better than deferred items — triggers are checked, not forgotten
460: 
461: Usage: `/gsd-capture --seed "add real-time notifications when we build the events system"`
462: 
463: **`/gsd-capture --backlog [description]`**
464: Add an idea to the backlog parking lot for future milestones.
465: 
466: - Creates a backlog item under 999.x numbering in ROADMAP.md
467: - Reserves ideas without committing to the current milestone
468: - Surface and promote later via `/gsd-review-backlog`
469: 
470: Usage: `/gsd-capture --backlog "real-time notifications when events ship"`
471: 
472: ---
473: 
474: **`/gsd-audit-uat`**
475: Cross-phase audit of all outstanding UAT and verification items.
476: - Scans every phase for pending, skipped, blocked, and human_needed items
477: - Cross-references against codebase to detect stale documentation
478: - Produces prioritized human test plan grouped by testability
479: - Use before starting a new milestone to clear verification debt
480: 
481: Usage: `/gsd-audit-uat`
482: 
483: ### Milestone Auditing
484: 
485: **`/gsd-audit-milestone [version]`**
486: Audit milestone completion against original intent.
487: 
488: - Reads all phase VERIFICATION.md files
489: - Checks requirements coverage
490: - Spawns integration checker for cross-phase wiring
491: - Creates MILESTONE-AUDIT.md with gaps and tech debt
492: 
493: Usage: `/gsd-audit-milestone`
494: 
495: ### Configuration
496: 
497: **`/gsd-settings`**
498: Configure workflow toggles and model profile interactively.
499: 
500: - Toggle researcher, plan checker, verifier agents
501: - Select model profile (quality/balanced/budget/inherit)
502: - Updates `.planning/config.json`
503: 
504: Usage: `/gsd-settings`
505: 
506: **`/gsd-config [--profile <profile> | --advanced | --integrations]`**
507: Configure GSD beyond the basic settings: model profile, advanced tuning, and third-party integrations.
508: 
509: - `--profile <profile>` — quick switch model profile (`quality | balanced | budget | inherit`)
510: - `--advanced` — power-user tuning: plan bounce, timeouts, branch templates, cross-AI execution (replaces the former `gsd-settings-advanced`)
511: - `--integrations` — third-party API keys, code-review CLI routing, agent-skill injection (replaces the former `gsd-settings-integrations`)
512: 
513: - `quality` — Opus everywhere except verification
514: - `balanced` — Opus for planning, Sonnet for execution (default)
515: - `budget` — Sonnet for writing, Haiku for research/verification
516: - `inherit` — Use current session model for all agents (OpenCode `/model`)
517: 
518: Usage: `/gsd-config --profile budget`
519: 
520: ### Utility Commands
521: 
522: **`/gsd-cleanup`**
523: Archive accumulated phase directories from completed milestones.
524: 
525: - Identifies phases from completed milestones still in `.planning/phases/`
526: - Shows dry-run summary before moving anything
527: - Moves phase dirs to `.planning/milestones/v{X.Y}-phases/`
528: - Use after multiple milestones to reduce `.planning/phases/` clutter
529: 
530: Usage: `/gsd-cleanup`
531: 
532: **`/gsd-help`**
533: Show this command reference.
534: 
535: **`/gsd-update [--sync] [--reapply]`**
536: Update GSD to latest version with changelog preview.
537: 
538: - `--sync` — sync managed GSD skills across runtime roots (replaces the former `gsd-sync-skills`)
539: - `--reapply` — reapply local modifications after an update (replaces the former `gsd-reapply-patches`)
540: 
541: - Shows installed vs latest version comparison
542: - Displays changelog entries for versions you've missed
543: - Highlights breaking changes
544: - Confirms before running install
545: - Better than raw `npx get-shit-done-cc`
546: 
547: Usage: `/gsd-update`
548: 
549: ## Additional Commands
550: 
551: The commands above cover the most common day-to-day flows. Every command listed here is also a live `/gsd-*` slash command and is grouped by purpose.
552: 
553: ### Discovery & Specification
554: 
555: - **`/gsd-explore`** — Socratic ideation and idea routing. Think through ideas before committing to plans.
556: - **`/gsd-spec-phase <phase> [--auto] [--text]`** — Clarify WHAT a phase delivers with ambiguity scoring; produces a SPEC.md before discuss-phase.
557: - **`/gsd-ai-integration-phase [phase]`** — Generate an AI-SPEC.md design contract for phases that involve building AI systems.
558: - **`/gsd-ui-phase [phase]`** — Generate UI design contract (UI-SPEC.md) for frontend phases.
559: - **`/gsd-import --from <filepath> | --from-gsd2`** — Ingest external plans with conflict detection, or reverse-migrate a GSD-2 (`.gsd/`) project back to GSD v1 (`.planning/`) format.
560: - **`/gsd-ingest-docs [path] [--mode new|merge] [--manifest <file>] [--resolve auto|interactive]`** — Bootstrap or merge a `.planning/` setup from existing ADRs, PRDs, SPECs, and docs in a repo.
561: 
562: ### Planning & Execution
563: 
564: - **`/gsd-ultraplan-phase [phase]`** — [BETA] Offload plan phase to Claude Code's ultraplan cloud; review in browser and import back.
565: - **`/gsd-plan-review-convergence <phase> [--codex] [--gemini] [--claude] [--opencode] [--ollama] [--lm-studio] [--llama-cpp] [--all] [--text] [--ws <name>] [--max-cycles N]`** — Cross-AI plan convergence loop — replan with review feedback until no HIGH concerns remain. Supports both cloud reviewers (Codex/Gemini/the agent/OpenCode) and local model runtimes (Ollama, LM Studio, llama.cpp).
566: - **`/gsd-autonomous [--from N] [--to N] [--only N] [--interactive]`** — Run all remaining phases autonomously: discuss → plan → execute per phase.
567: 
568: ### Quality, Review & Verification
569: 
570: - **`/gsd-code-review <phase> [--depth=quick|standard|deep] [--files file1,file2,...] [--fix [--all] [--auto]]`** — Review source files changed during a phase for bugs, security issues, and code quality problems.
571: - **`/gsd-secure-phase [phase]`** — Retroactively verify threat mitigations for a completed phase.
572: - **`/gsd-validate-phase [phase]`** — Retroactively audit and fill Nyquist validation gaps for a completed phase.
573: - **`/gsd-ui-review [phase]`** — Retroactive 6-pillar visual audit of implemented frontend code.
574: - **`/gsd-eval-review [phase]`** — Audit an executed AI phase's evaluation coverage and produce an EVAL-REVIEW.md remediation plan.
575: - **`/gsd-audit-fix --source <audit-uat> [--severity medium|high|all] [--max N] [--dry-run]`** — Autonomous audit-to-fix pipeline: find issues, classify, fix, test, commit.
576: - **`/gsd-add-tests <phase> [additional instructions]`** — Generate tests for a completed phase based on UAT criteria and implementation.
577: 
578: ### Diagnostics & Maintenance
579: 
580: - **`/gsd-health [--repair] [--context]`** — Diagnose planning directory health and optionally repair issues.
581: - **`/gsd-forensics [problem description]`** — Post-mortem investigation for failed GSD workflows; diagnoses what went wrong.
582: - **`/gsd-undo --last N | --phase NN | --plan NN-MM`** — Safe git revert. Roll back phase or plan commits using the phase manifest with dependency checks.
583: - **`/gsd-docs-update [--force] [--verify-only]`** — Generate or update project documentation verified against the codebase.
584: - **`/gsd-extract-learnings <phase>`** — Extract decisions, lessons, patterns, and surprises from completed phase artifacts.
585: 
586: ### Knowledge & Context
587: 
588: - **`/gsd-graphify [build|query <term>|status|diff]`** — Build, query, and inspect the project knowledge graph in `.planning/graphs/`.
589: - **`/gsd-thread [list [--open|--resolved] | close <slug> | status <slug> | name | description]`** — Manage persistent context threads for cross-session work.
590: - **`/gsd-profile-user [--questionnaire] [--refresh]`** — Generate developer behavioral profile and create Claude-discoverable artifacts.
591: - **`/gsd-stats`** — Display project statistics: phases, plans, requirements, git metrics, and timeline.
592: 
593: ### Workflow & Orchestration
594: 
595: - **`/gsd-manager [--analyze-deps]`** — Interactive command center for managing multiple phases from one terminal. `--analyze-deps` scans ROADMAP phases for dependency relationships before parallel execution.
596: - **`/gsd-workspace [--new | --list | --remove] [name]`** — Manage GSD workspaces: create, list, or remove isolated workspace environments.
597: - **`/gsd-workstreams`** — Manage parallel workstreams: list, create, switch, status, progress, complete, and resume.
598: - **`/gsd-review-backlog`** — Review and promote backlog items to active milestone.
599: - **`/gsd-milestone-summary [version]`** — Generate a comprehensive project summary from milestone artifacts for team onboarding and review.
600: 
601: ### Repository Integration
602: 
603: - **`/gsd-inbox [--issues] [--prs] [--label] [--close-incomplete] [--repo owner/repo]`** — Triage and review open GitHub issues and PRs against project templates and contribution guidelines.
604: 
605: ### Namespace Routers (model-facing meta-skills)
606: 
607: These six skills exist primarily for the model to perform two-stage hierarchical routing across 60+ skills. You can invoke them directly when you want to browse a category interactively.
608: 
609: - **`/gsd-context`** — Codebase intelligence routing (map, graphify, docs, learnings).
610: - **`/gsd-ideate`** — Exploration / capture routing (explore, sketch, spike, spec, capture).
611: - **`/gsd-manage`** — Configuration and workspace routing (workstreams, thread, update, ship, inbox).
612: - **`/gsd-project`** — Project-lifecycle routing (milestones, audits, summary).
613: - **`/gsd-review`** — Quality-gate routing (code review, debug, audit, security, eval, ui).
614: - **`/gsd-workflow`** — Phase-pipeline routing (discuss, plan, execute, verify, phase, progress).
615: 
616: ## Files & Structure
617: 
618: ```
619: .planning/
620: ├── PROJECT.md            # Project vision
621: ├── ROADMAP.md            # Current phase breakdown
622: ├── STATE.md              # Project memory & context
623: ├── RETROSPECTIVE.md      # Living retrospective (updated per milestone)
624: ├── config.json           # Workflow mode & gates
625: ├── todos/                # Captured ideas and tasks
626: │   ├── pending/          # Todos waiting to be worked on
627: │   └── done/             # Completed todos
628: ├── spikes/               # Spike experiments (/gsd-spike)
629: │   ├── MANIFEST.md       # Spike inventory and verdicts
630: │   └── NNN-name/         # Individual spike directories
631: ├── sketches/             # Design sketches (/gsd-sketch)
632: │   ├── MANIFEST.md       # Sketch inventory and winners
633: │   ├── themes/           # Shared CSS theme files
634: │   └── NNN-name/         # Individual sketch directories (HTML + README)
635: ├── debug/                # Active debug sessions
636: │   └── resolved/         # Archived resolved issues
637: ├── milestones/
638: │   ├── v1.0-ROADMAP.md       # Archived roadmap snapshot
639: │   ├── v1.0-REQUIREMENTS.md  # Archived requirements
640: │   └── v1.0-phases/          # Archived phase dirs (via /gsd-cleanup or --archive-phases)
641: │       ├── 01-foundation/
642: │       └── 02-core-features/
643: ├── codebase/             # Codebase map (brownfield projects)
644: │   ├── STACK.md          # Languages, frameworks, dependencies
645: │   ├── ARCHITECTURE.md   # Patterns, layers, data flow
646: │   ├── STRUCTURE.md      # Directory layout, key files
647: │   ├── CONVENTIONS.md    # Coding standards, naming
648: │   ├── TESTING.md        # Test setup, patterns
649: │   ├── INTEGRATIONS.md   # External services, APIs
650: │   └── CONCERNS.md       # Tech debt, known issues
651: └── phases/
652:     ├── 01-foundation/
653:     │   ├── 01-01-PLAN.md
654:     │   └── 01-01-SUMMARY.md
655:     └── 02-core-features/
656:         ├── 02-01-PLAN.md
657:         └── 02-01-SUMMARY.md
658: ```
659: 
660: ## Workflow Modes
661: 
662: Set during `/gsd-new-project`:
663: 
664: **Interactive Mode**
665: 
666: - Confirms each major decision
667: - Pauses at checkpoints for approval
668: - More guidance throughout
669: 
670: **YOLO Mode**
671: 
672: - Auto-approves most decisions
673: - Executes plans without confirmation
674: - Only stops for critical checkpoints
675: 
676: Change anytime by editing `.planning/config.json`
677: 
678: ## Planning Configuration
679: 
680: Configure how planning artifacts are managed in `.planning/config.json`:
681: 
682: **`planning.commit_docs`** (default: `true`)
683: - `true`: Planning artifacts committed to git (standard workflow)
684: - `false`: Planning artifacts kept local-only, not committed
685: 
686: When `commit_docs: false`:
687: - Add `.planning/` to your `.gitignore`
688: - Useful for OSS contributions, client projects, or keeping planning private
689: - All planning files still work normally, just not tracked in git
690: 
691: **`planning.search_gitignored`** (default: `false`)
692: - `true`: Add `--no-ignore` to broad ripgrep searches
693: - Only needed when `.planning/` is gitignored and you want project-wide searches to include it
694: 
695: Example config:
696: ```json
697: {
698:   "planning": {
699:     "commit_docs": false,
700:     "search_gitignored": true
701:   }
702: }
703: ```
704: 
705: ## Common Workflows
706: 
707: **Starting a new project:**
708: 
709: ```
710: /gsd-new-project        # Unified flow: questioning → research → requirements → roadmap
711: /clear
712: /gsd-plan-phase 1       # Create plans for first phase
713: /clear
714: /gsd-execute-phase 1    # Execute all plans in phase
715: ```
716: 
717: **Resuming work after a break:**
718: 
719: ```
720: /gsd-progress  # See where you left off and continue
721: ```
722: 
723: **Adding urgent mid-milestone work:**
724: 
725: ```
726: /gsd-phase --insert 5 "Critical security fix"
727: /gsd-plan-phase 5.1
728: /gsd-execute-phase 5.1
729: ```
730: 
731: **Completing a milestone:**
732: 
733: ```
734: /gsd-complete-milestone 1.0.0
735: /clear
736: /gsd-new-milestone  # Start next milestone (questioning → research → requirements → roadmap)
737: ```
738: 
739: **Capturing ideas during work:**
740: 
741: ```
742: /gsd-capture                                  # Capture from conversation context
743: /gsd-capture Fix modal z-index                # Capture with explicit description
744: /gsd-capture --note refactor auth system      # Quick friction-free note
745: /gsd-capture --seed "real-time notifications" # Forward-looking idea with triggers
746: /gsd-capture --list                           # Review and work on todos
747: /gsd-capture --list api                       # Filter by area
748: ```
749: 
750: **Debugging an issue:**
751: 
752: ```
753: /gsd-debug "form submission fails silently"  # Start debug session
754: # ... investigation happens, context fills up ...
755: /clear
756: /gsd-debug                                    # Resume from where you left off
757: ```
758: 
759: ## Getting Help
760: 
761: - Read `.planning/PROJECT.md` for project vision
762: - Read `.planning/STATE.md` for current context
763: - Check `.planning/ROADMAP.md` for phase status
764: - Run `/gsd-progress` to check where you're up to
765: </reference>

(End of file - total 765 lines)
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

- **DELEGATION STACKING — attach work onto ANY existing session:** Both `task` and `delegate-task` support attaching new work as a child of a completed main session — NOT just resuming aborted tasks. Pattern: pass the existing session ID directly.
  - **`task` tool:** set `task_id` parameter to any existing session ID (not just a previous task_id from task tool). The new subagent attaches as a child of that session.
  - **`delegate-task` tool:** pass `context` as JSON: `{"parentSessionId": "<session-id>"}`. The new delegation attaches as a child of that session.
  - Do NOT inject the session ID into the prompt text — that creates a new independent session. The correct approach is passing it as a parameter so OpenCode's hierarchy tracking properly chains the sessions.
  - **Prompt stays simple** — context from the target session is preserved through the session chain. No need to re-describe old work in the prompt. This is the same principle as `subagent_type`/`agent` parameter: you specify the agent name to select the handler, you specify `task_id`/`parentSessionId` to select the session to attach to.
  - This pattern covers BOTH use cases: **resume** (incomplete session) and **stack-on** (completed session to add new work as a child).

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

### Tool: execute-slash-command

**Input:**
```json
{
  "callID": "call_01_SFPzbBNqemteF5qpzTi08356"
}
```


## USER (turn 30)

**source:** real-human

@gsd-advisor-researcher /gsd-stats --format json

### Tool: execute-slash-command

**Input:**
```json
{
  "callID": "call_02_8KfKJNCleSxV0JAS1Q1k9556"
}
```


## USER (turn 31)

**source:** real-human

chạy my ass con chó ngu chạy đâu mà chạy mày đừng cố may rủi nữa

## USER (turn 32)

**source:** real-human

mày đnag hallucination rất nặng tìm hiểu architecture opencode cho slash commands đừng tự động làm gì trển đây nữa

### Tool: deepwiki_read_wiki_structure

**Input:**
```json
{
  "callID": "call_00_sckjWMAncLdeIKQ2vHY83209"
}
```


### Tool: context7_resolve-library-id

**Input:**
```json
{
  "callID": "call_01_piWGO7SpxRSW5wCGsWjO2144"
}
```


### Tool: deepwiki_ask_question

**Input:**
```json
{
  "callID": "call_01_jZ0c4gdP9urPf2LttQX50457"
}
```


### Tool: deepwiki_ask_question

**Input:**
```json
{
  "callID": "call_00_5Ij5IxHUYfrypOy9Gu2v2485"
}
```


## USER (turn 33)

**source:** real-human

tools không thì ko gải quyết được phải dùng tới sdk

### Tool: deepwiki_read_wiki_contents

**Input:**
```json
{
  "callID": "call_01_ocr3qcpzWPocp7MMNQED6204"
}
```


## USER (turn 34)

**source:** real-human

thử chạy command này mày sẽ hiểu tao muốn gì .opencode/commands/hf-prompt-enhance.md 

### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/commands/hf-prompt-enhance.md"
}
```


### Tool: execute-slash-command

**Input:**
```json
{
  "callID": "call_00_rXPDioS1M5Y8g0WxoBbT6117"
}
```


## USER (turn 35)

**source:** real-human

chạy đi chạy ngay TUI trên đây

## USER (turn 36)

**source:** real-human

chạy đi chạy ngay TUI trên đây

### Tool: skill

**Input:**
```json
{
  "name": "hm-l3-subagent-delegation-patterns"
}
```

**Output:** (pruned)
```
# Skill: hm-l3-subagent-delegation-patterns
```


### Tool: task

**Input:**
```json
{
  "description": "Run prompt enhance command",
  "subagent_type": "hm-l1-coordinator",
  "task_id": "ses_1b4401fe6ffe8z7cKzUP2rx4zQ"
}
```

**Output:** (pruned)
```
task_id: ses_1b4401fe6ffe8z7cKzUP2rx4zQ
```


## USER (turn 37)

**source:** real-human

ko appen trực tiếp nó ngay trên đây qua execute-slash-command

### Tool: execute-slash-command

**Input:**
```json
{
  "callID": "call_zDxeasd3tK9oQ1csBbNDmQFf"
}
```


## USER (turn 38)

**source:** real-human

vậy trả nó về nguyên thuỷ đi cái mà append trực tiếp trên tui đó rồi execute command đó

### Tool: skill

**Input:**
```json
{
  "name": "customize-opencode"
}
```

**Output:** (pruned)
```
# Skill: customize-opencode
```


### Tool: skill

**Input:**
```json
{
  "name": "clean-code"
}
```

**Output:** (pruned)
```
# Skill: clean-code
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_VORavFAqYNcPzFtcSyuqEXJO"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/tests/tools/execute-slash-command.test.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/tools/session/execute-slash-command.ts"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_qZbVlxBWF15CdUYWGfRra0jj"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/tests/tools/execute-slash-command.test.ts"
}
```


## USER (turn 39)

**source:** real-human

trả tất cả implementation của phase 21.1 này trước khi nó implemented rồi build lại

### Tool: skill

**Input:**
```json
{
  "name": "gsd-undo"
}
```

**Output:** (pruned)
```
# Skill: gsd-undo
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_pBRCZFXDKgdVwmLSRzkOwHCc"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_bhjYHBujmzTLNgS5Jph0Ards"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_pwMdfF1GBzVue5QzMsdRkPnM"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_H4CZLi4ThSAbaNE4YH5wwRc3"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_6ZUMmAjwadfIS5dkbRkfvrKw"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_KEAn7rAGlyNXS6JwBlJfnwZw"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_lk9rY7CwUQgoqSljP4f240TQ"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_vgbXIoPCwcNPcS0lh0uF8Hli"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_f2lJvGfNGTZteYnmKQKkDart"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/tools/session/execute-slash-command.ts"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_6AK21B0RxnNYBlpxawtVjXxi"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_YhKSlShQGh8hGnKp6j8xv1Lf"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_NJIVN3gYrsG2QKkiVADjCoEG"
}
```


### Tool: skill

**Input:**
```json
{
  "name": "verify-before-complete"
}
```

**Output:** (pruned)
```
# Skill: verify-before-complete
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_5N0cGQfh2inJFvGgKCfpNGNS"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_jqyDGCujgzPXOKxKT1Gs4CYv"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_XXh2PiLig9TT7HbCovaOmOEu"
}
```


## USER (turn 40)

**source:** real-human

rồi sau khi build rồi thì chạy slash command execution qua tui rồi chạy hf-prompt-enhance qua foreground này đi các field đã được định sẵn rồi cứ thế mà chạy thôi để coi behaviour của nó

### Tool: execute-slash-command

**Input:**
```json
{
  "callID": "call_JlGHuvHdw0KMxtmOYmM77j0L"
}
```


## USER (turn 41)

**source:** real-human



## USER (turn 42)

**source:** real-human

đây là ví dụ khi manual đây và khi implementation thì 2 field này phải được điều chỉnh on the fly cho bất kỳ command nào để làm được đeiefu tương tự - tôi đã xuất file '/Users/apple/hivemind-plugin-private/session-ses_1b48.md' xem từ dòng 10622 đây là cơ chế của nó khi tôi manually chạy slash command này tại TUI 

### Tool: skill

**Input:**
```json
{
  "name": "hf-l2-command-dev"
}
```

**Output:** (pruned)
```
# Skill: hf-l2-command-dev
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/session-ses_1b48.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/commands/hf-prompt-enhance.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/tools/session/execute-slash-command.ts"
}
```


## USER (turn 43)

**source:** real-human

ok sửa theo đúng vậy đi 

### Tool: skill

**Input:**
```json
{
  "name": "tdd"
}
```

**Output:** (pruned)
```
# Skill: tdd
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/routing/command-engine/index.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/routing/command-engine/types.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/tests/tools/execute-slash-command.test.ts"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_mlJIL6wrWxGlVSdE7Hl1qHz8"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/features/bootstrap/primitive-loader.ts"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_jCM6RPFVJp1UyPEtI4J4qxjx"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/schema-kernel/command-frontmatter.schema.ts"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_BjV2W95FOZxtT9xmMCNolKNu"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/node_modules/@opencode-ai/sdk/dist/gen/types.gen.d.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/node_modules/@opencode-ai/sdk/dist/gen/types.gen.d.ts"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_Pzu5hyFm9pmvxTo9NqAWUrFB"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/tests/tools/execute-slash-command.test.ts"
}
```


### Tool: apply_patch

**Input:**
```json
{
  "callID": "call_LHAKld9DQdlgVjFrXrJWPljj"
}
```


### Tool: apply_patch

**Input:**
```json
{
  "callID": "call_Igilseu3WZ4KVrQbkvfaqO5a"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_xjPwane5TTA996HHKJ07yRX3"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_hvGbsNTqQEBFV4gtc3rcZWtU"
}
```


### Tool: apply_patch

**Input:**
```json
{
  "callID": "call_whOPb2JswOYnNySnVzL5nCHy"
}
```


### Tool: apply_patch

**Input:**
```json
{
  "callID": "call_IKNHSYnFyrHAKemzUeeKEIsG"
}
```


### Tool: apply_patch

**Input:**
```json
{
  "callID": "call_k2wnnETZInFnOIukUxcEAjoQ"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_G6js3sJYHZ22KyjeeKVWPmCL"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_oXuvXMNKvdqPDzPV4MepSQsO"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_VR1NjBDv3HmkgG8InLW02M3x"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_yupF5LhErBRTMgctRMBQV7Dt"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_UcSczDiiABgQnOzmUCvyRlvy"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_a1Wh7LBgoEtD8kiOCOxlfILq"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_Qu0k6XjqAuzElH9TRVpXkHHc"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_EFEHTmlPRmpIJKLQy58C5Hk1"
}
```


## USER (turn 44)

**source:** real-human

à điều chỉnh nữa là command(s) take luôn cả số ít và số nhiều và mày phải include luôn cả global lẫn project path - rồi có cách nào điều chỉnh on the fly cho 2 trường này một cách tức thời và chỉ riêng cho một lần do agent quyết định không, ví dụ đi là tao có command đã dựng sẵn nhưng không có sẵn 2 trường agent và subtask này - nhưng qua user prompt intent (ví dụ tao kêu chạy command - through natural language đi rồi agent tự tìm command ứng với nó nhưng trong prompt tao yêu cầu là tao muốn nó chạy ở sub với agent (miêu tả bằng natural language luôn) thì lúc này trước khi chạy command đó thì agent sẽ tự thêm vào 2 trường đó theo deterministic rationale của nó rồi mới chạy thì có thể làm được không)

### Tool: skill

**Input:**
```json
{
  "name": "hf-l2-command-dev"
}
```

**Output:** (pruned)
```
# Skill: hf-l2-command-dev
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_wrW26Syiyfp9FeBY1ZdTEMdP"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_O7pbbHMVIA3BOLEzbCZGKsKC"
}
```


### Tool: apply_patch

**Input:**
```json
{
  "callID": "call_ka5n4tSLx1P8YyfK5wI3tj2T"
}
```


### Tool: apply_patch

**Input:**
```json
{
  "callID": "call_GvIiOQp3bHq3Dr9PVnJCkROL"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/tools/session/execute-slash-command.ts"
}
```


### Tool: apply_patch

**Input:**
```json
{
  "callID": "call_MSdPiOga8S72OKU1nkWyFWHN"
}
```


### Tool: apply_patch

**Input:**
```json
{
  "callID": "call_DzfLVFMcTYGg1p2cd1m6et9X"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_kkesON3mW8nxxpv1E3kMvOor"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_80IKqHyIkhvtRLNGl5e1P5QD"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_l8N42Vv3CcVw1KTMKDYnPC6g"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_BOLtjgm815G3eV4E76il0CM7"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_iU7D3Ne4GwhMo3KNuHdYvA8Z"
}
```


### Tool: skill

**Input:**
```json
{
  "name": "verify-before-complete"
}
```

**Output:** (pruned)
```
# Skill: verify-before-complete
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_W8nYHe4wI8uUSkIEmvOKzSKP"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_bR9LfHBwHlIKoZZ2b83wyOqB"
}
```


## USER (turn 45)

**source:** real-human

tôi đã run build và restart lại giờ thì run intense UAT live test cho cácc use cases đi rồi sau đó hoàn chỉnh và chỉnh sửa lại các documents và artifacts governance của GSD cho đúng với các thiết kế mới này route GSD

## USER (turn 50)

**source:** real-human

tôi đã run build và restart lại giờ thì run intense UAT live test cho cácc use cases đi rồi sau đó hoàn chỉnh và chỉnh sửa lại các documents và artifacts governance của GSD cho đúng với các thiết kế mới này route GSD. thử với command nào không có 2 fields trên để rồi có thể tu điều chỉnh 2 fields này on the fly đừng thử với command hf-prompt-enhance nữa

### Tool: glob

**Input:**
```json
{
  "callID": "call_00_TR0quUv8faZ7NGAkrfEH2143"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/commands/test-echo.md"
}
```


## USER (turn 51)

**source:** real-human



## USER (turn 52)

**source:** real-human

thua rồi vẫn không hoạt động được nó stuck hanging trừ khi tao cancel nó mới chạy đc

### Tool: execute-slash-command

**Input:**
```json
{
  "callID": "call_00_eyypOk7fVb3qOkJbjTHt4040"
}
```


## USER (turn 53)

**source:** real-human

thua rồi vẫn không hoạt động được nó stuck hanging trừ khi tao cancel nó mới chạy đc

## USER (turn 54)

**source:** real-human

thua rồi vẫn không hoạt động được nó stuck hanging trừ khi tao cancel rồi mồi lại nó mới chạy đc xem '/Users/apple/hivemind-plugin-private/session-ses_1b48.md' ở các dòng cuối sẽ thấy

## USER (turn 55)

**source:** real-human

thua rồi vẫn không hoạt động được nó stuck hanging trừ khi tao cancel rồi mồi lại nó mới chạy đc xem '/Users/apple/hivemind-plugin-private/session-ses_1b48.md' ở các dòng cuối sẽ thấy

### Tool: skill

**Input:**
```json
{
  "name": "gsd-debug"
}
```

**Output:** (pruned)
```
# Skill: gsd-debug
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_6pyjy8kgCdRqZrEsjsVTLU5G"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_RlHOJkal6M2pm5aKBmOl7LZ3"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/session-ses_1b48.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/session-ses_1b48.md"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_vXCkUl7kyhIizEcUK4qzXwyJ"
}
```


### Tool: apply_patch

**Input:**
```json
{
  "callID": "call_QCq0ttGUfVCyqVNeepaeEZYe"
}
```


### Tool: apply_patch

**Input:**
```json
{
  "callID": "call_ynF6888TpYwAGaWCgVoH3crJ"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_g60MeRGaRmOtEhEuCdyqgyQk"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_c708NP6jILKJcRxIActrDTvt"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_UdGLwk29yA7jIoyr1jmn7w3r"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_k5HP7aNgn8IgVnOc30WUSd4y"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/21.1-execute-slash-command-sdk-redesign-agent-switching-native-sd/21.1-SPEC.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/21.1-execute-slash-command-sdk-redesign-agent-switching-native-sd/21.1-03-SUMMARY.md"
}
```


### Tool: apply_patch

**Input:**
```json
{
  "callID": "call_4Sfrq5xP4dkcNeIZcp1t58cm"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_HFlnEFKGw415zpvuq3gVnX5q"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_UiqpfkEcx9AVgLVitzhubL7l"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_vBXghTAnuSJuvjpRO1ijywQa"
}
```


### Tool: apply_patch

**Input:**
```json
{
  "callID": "call_AzU3R0yoh5zorxcT54SvDIal"
}
```


### Tool: apply_patch

**Input:**
```json
{
  "callID": "call_oO5qNcHTsb2wwcYy8CVGuXFr"
}
```


### Tool: apply_patch

**Input:**
```json
{
  "callID": "call_wwAB3Pj5442bZUalLjgjZrkX"
}
```


### Tool: apply_patch

**Input:**
```json
{
  "callID": "call_A6lvXqzXtqiD5sNDDNXuqUQB"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_XLqTilHnWDZGbuNznXBPpPeb"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_SQCKc0z9c2sPeQZlsTCkWbKI"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_3wAASvMOM7AZtqsDFLLJ2FTn"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_GeIZDqGqRgFIcj2gydd0mG15"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_ooxHNB7GtYajZarxGNeOlrhC"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_cje9lTiwP8EHXYWqNzWjjCHu"
}
```


## USER (turn 52)

**source:** real-human

đã được restart lại và hãy test UAT lại thử nhưng hãy test các command nào đó phức tạp hơn như của gsd chẳng hạn và điều chỉnh agent để chạy ở sub

### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/commands/gsd-stats.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/commands/gsd-capture.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/commands/gsd-help.md"
}
```


### Tool: execute-slash-command

**Input:**
```json
{
  "callID": "call_00_OHefpITBxuvIij3gINjE1761"
}
```


## USER (turn 53)

**source:** real-human



### Tool: task

**Input:**
```json
{
  "description": "Display project statistics — phases, plans, requirements, git metrics, and timeline",
  "subagent_type": "hm-l2-general",
  "task_id": "ses_1b10970cfffen8bzXZxekVAaqQ"
}
```

**Output:** (pruned)
```
task_id: ses_1b10970cfffen8bzXZxekVAaqQ
```


## USER (turn 54)

**source:** real-human

đây là một nhóm test một command nào đó phứct tạp và thay đôỉ agent là agent research nhưng cho nó chạy ở front-facing thay vì sub xem front agent thay đổi được không

### Tool: execute-slash-command

**Input:**
```json
{
  "callID": "call_00_QALckNFpD8u8uLwt65tK2338"
}
```


## USER (turn 55)

**source:** real-human

@hm-l2-researcher /gsd-debug --diagnose execute-slash-command

## USER (turn 56)

**source:** real-human

vậy bây giờ thêm chức năng để nó có thể switch được đi switch này không dùng @agent được mà phải trả tạm thời vào payload của command để nó chạy một lần giống cách làm trước đó của subtask và agent field trên đây "Đã sửa theo yêu cầu.
Có thể làm “on-the-fly một lần” bằng cách truyền override vào tool call, không sửa command file gốc:
{
  "command": "plain-command",
  "arguments": "natural language intent",
  "agent": "hm-l2-researcher",
  "subtask": true
}
Khi đó tool sẽ:
- Tìm command ở project .opencode/commands và .opencode/command.
- Tìm command ở global ~/.config/opencode/commands và ~/.config/opencode/command.
- Nếu subtask: true, expand $ARGUMENTS trong command body.
- Dispatch bằng SDK session.prompt() với SubtaskPartInput.
- Dùng agent override một-lần nếu command file không có agent.
Files đã sửa:
- src/routing/command-engine/index.ts
- src/routing/command-engine/types.ts
- src/tools/session/execute-slash-command.ts
- tests/tools/execute-slash-command.test.ts " nhưng lúc này subtask false, agent phải có mode là all hoặc primary thì sẽ switch được

### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-researcher.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l1-coordinator.md"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_00_A2nyK2mneodCNwXKPQri9794"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_01_ClakYTxIju8A5PhvhQUq7553"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_90vtf1yDECnsUgR6CsBS5865"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/tools/session/execute-slash-command.ts"
}
```


## USER (turn 57)

**source:** real-human

khoan vậy có cách nào để tạm thời cho agent thành all (chỉ dùng một lần như cách đã làm với command không - cái này cần build kỹ hơn với plan 

## USER (turn 58)

**source:** real-human

tạo phase 21.2 đi nghiên cứu xem cách làm có được khôgn nhé quy trình vẫn là phải fetch được agent hiện có take cả số ít lẫn số nhiều agent(s) trong .opencode/ và cả project lẫn global. SAu đó dựng bản build tạm field này của agent thành all (nếu agent mode đang sub) điều này giống như command(s) nó sẽ lập một payload chạy tạm thời cho instance đó nhưng không thay đổi gì cả command lẫn agent configuration. Tình huống phức tạp nhất để cho ví dụ là nếu tao muốn agent chạy execute-slash-command '/Users/apple/hivemind-plugin-private/.opencode/commands/gsd-progress.md' nhưng với cả 2 trường hợp là chạy ở sub với gsd-executor agent và chạy ở main bằng cách switch qua agent gsd-executor rồi append trực tiếp command tại main - cái này phải nghiên cứu kỹ nha vì tao không chắc nó sẽ làm được đâu đây chỉ là giả thuyết và mong muốn của tao nhưng chuyện nó làm được hay không cần nghiên cứu và có bằng chứng dựa trên SDK của OpenCode và kiến trúc của nó

## USER (turn 59)

**source:** real-human

tạo phase 21.2 đi nghiên cứu xem cách làm có được khôgn nhé quy trình vẫn là phải fetch được agent hiện có take cả số ít lẫn số nhiều agent(s) trong .opencode/ và cả project lẫn global. SAu đó dựng bản build tạm field này của agent thành all (nếu agent mode đang sub) điều này giống như command(s) nó sẽ lập một payload chạy tạm thời cho instance đó nhưng không thay đổi gì cả command lẫn agent configuration. Tình huống phức tạp nhất để cho ví dụ là nếu tao muốn agent chạy execute-slash-command '/Users/apple/hivemind-plugin-private/.opencode/commands/gsd-progress.md' nhưng với cả 2 trường hợp là chạy ở sub với gsd-executor agent và chạy ở main bằng cách switch qua agent gsd-executor rồi append trực tiếp command tại main - cái này phải nghiên cứu kỹ nha vì tao không chắc nó sẽ làm được đâu đây chỉ là giả thuyết và mong muốn của tao nhưng chuyện nó làm được hay không cần nghiên cứu và có bằng chứng dựa trên SDK của OpenCode và kiến trúc của nó

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


### Tool: skill

**Input:**
```json
{
  "name": "hm-l3-opencode-platform-reference"
}
```

**Output:** (pruned)
```
# Skill: hm-l3-opencode-platform-reference
```


### Tool: skill

**Input:**
```json
{
  "name": "hm-l3-research-chain"
}
```

**Output:** (pruned)
```
# Skill: hm-l3-research-chain
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_3Vi5ltgbv0JTBtUU8ET5FRgC"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/ROADMAP.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/package.json"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivemind/STACKS-REFERENCES.md"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_cJZNCi2ECwwoYd8AQyHTGO6E"
}
```


### Tool: context7_resolve-library-id

**Input:**
```json
{
  "callID": "call_gjOLLNdsilkgGQRvqL7OcFzq"
}
```


### Tool: deepwiki_ask_question

**Input:**
```json
{
  "callID": "call_gAYRV3mwKyZ18YuUv73XHhKM"
}
```


### Tool: context7_query-docs

**Input:**
```json
{
  "callID": "call_764sbUtW8loa20N7KN94oysF"
}
```


### Tool: zread_search_doc

**Input:**
```json
{
  "callID": "call_uVPFT74lb5TqVn8qxocOBUwn"
}
```


### Tool: context7_query-docs

**Input:**
```json
{
  "callID": "call_uVUiH0U14E08O7PudElig6kd"
}
```


### Tool: zread_read_file

**Input:**
```json
{
  "callID": "call_k4OhqRsE4QJ8blp6ac3ggFIZ"
}
```


### Tool: zread_read_file

**Input:**
```json
{
  "callID": "call_f1A2bN8puR2Ft9GBNX7jYThu"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_I4U8BBgM9h5O81sN07mnKySp"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_RYLsl3josYTVbHHUdXaFtUwd"
}
```


### Tool: fetch_fetch

**Input:**
```json
{
  "callID": "call_IcyAcaVgmwB0qRRuQWpzgYxJ"
}
```


### Tool: fetch_fetch

**Input:**
```json
{
  "callID": "call_nPIVnllrynO1WLpdQzSycpDk"
}
```


### Tool: fetch_fetch

**Input:**
```json
{
  "callID": "call_u6Ctr8eabRw2Q2FhmGWPDgze"
}
```


### Tool: task

**Input:**
```json
{
  "description": "Research 21.2 feasibility",
  "subagent_type": "gsd-phase-researcher",
  "task_id": "ses_1b0f660b5ffe5mzCW3YQrvpw4C"
}
```

**Output:** (pruned)
```
task_id: ses_1b0f660b5ffe5mzCW3YQrvpw4C
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_HMJKOQIHDp11SJgZIxG0R3pm"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_s7REpBrD49ahIWi8yAhav1VQ"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_6NXxLCxTfZTotIXHz3MPNBaJ"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/STATE.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/ROADMAP.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/commands/gsd-progress.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-executor.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/tools/session/execute-slash-command.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/routing/command-engine/index.ts"
}
```


### Tool: apply_patch

**Input:**
```json
{
  "callID": "call_9OGv5QAj2EbVxYav7CIuW6Op"
}
```


### Tool: apply_patch

**Input:**
```json
{
  "callID": "call_Hnd1GMyJMQhU7utxlzrJq5MD"
}
```


### Tool: apply_patch

**Input:**
```json
{
  "callID": "call_8Cn0oLVHO6gMEF4DOFbKW20v"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/21.2-front-agent-switch-one-shot-agent-override/21.2-research-2026-05-22.md"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_nO7ZckSYVPgN06wclVAf0YXd"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_3tYb5LVeMD5jOHsfjCGTRLH4"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_sYBTO8ZY5OfvBA7Llb3PNmfB"
}
```


## COMPACTED (2026-05-22T09:44:12.994Z)

**raw_event:**

```json
{
  "id": "evt_e4f1231b50014xwaOoa9Ar3dmj",
  "type": "session.compacted",
  "properties": {
    "sessionID": "ses_1b48772bbffeDg2eO1wx7j3vKY"
  }
}
```

**Continuity index:** See `session-continuity.json` for active delegations and pending work at time of compaction.

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
  "name": "hm-l2-test-driven-execution"
}
```

**Output:** (pruned)
```
# Skill: hm-l2-test-driven-execution
```


### Tool: skill

**Input:**
```json
{
  "name": "verify-before-complete"
}
```

**Output:** (pruned)
```
# Skill: verify-before-complete
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_kvWu3Ccu3YEWw0lKXZnd9k3C"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/package.json"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivemind/STACKS-REFERENCES.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/tools/session/execute-slash-command.ts"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_c4YHWTcOTKFYVGHwgouhmTvb"
}
```


### Tool: context7_resolve-library-id

**Input:**
```json
{
  "callID": "call_stq9xiPoK2c161Nae2wCHAHJ"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/routing/command-engine/index.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/routing/command-engine/types.ts"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_YMO9MJ7LK3xyL1zRZgThtRnP"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_D5hT7A6xLb4b5PDkU9mVth98"
}
```


### Tool: context7_query-docs

**Input:**
```json
{
  "callID": "call_pGkE486Yj1pktOsKnmrBScix"
}
```


### Tool: deepwiki_ask_question

**Input:**
```json
{
  "callID": "call_rMT5iR12ddsGFAmGbtB9C1rO"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/node_modules/@opencode-ai/sdk/dist/gen/types.gen.d.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/node_modules/@opencode-ai/sdk/dist/gen/types.gen.d.ts"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_lbGnBjybHurrAgb6QaN3GBiG"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/node_modules/@opencode-ai/sdk/dist/v2/gen/types.gen.d.ts"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_mdeJcvZMyVnI4orkvdS1bWxJ"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_UntCxZAW286M4tTEXesgfrHJ"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/node_modules/@opencode-ai/sdk/dist/gen/types.gen.d.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/node_modules/@opencode-ai/sdk/dist/gen/types.gen.d.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/node_modules/@opencode-ai/sdk/dist/gen/types.gen.d.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/21.2-front-agent-switch-one-shot-agent-override/21.2-spec-2026-05-22.md"
}
```


### Tool: apply_patch

**Input:**
```json
{
  "callID": "call_OSHs4i4NargSgELKCn9E37ov"
}
```


### Tool: apply_patch

**Input:**
```json
{
  "callID": "call_I7WshFaQkQT0xj6ZjUpbfNYr"
}
```


### Tool: apply_patch

**Input:**
```json
{
  "callID": "call_CjS24JBin7hpOALyVmKhTIoG"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_O8TdfWZEWihkwTRw7YdBvGpe"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_41gLL2KksszVvcXdMlU0JtWE"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_GK43qu9kUKmPmDDVegU8jQk0"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_pVRUJgOKacntWUq3X7UVAEV5"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_d0HZkHwU1qlPBve4SyAwWauh"
}
```


### Tool: apply_patch

**Input:**
```json
{
  "callID": "call_SnrtDdpTDg1ag0XCaKj8kCBG"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_xjCgrIE3CB7fzXahbZbAmiFC"
}
```


### Tool: apply_patch

**Input:**
```json
{
  "callID": "call_agKn372f37N1jDQVbkPsBlGO"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_pPGrZNvB8rD3VlcccKCc9f1u"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_4gut0uU9OMq0yPydItXTKSZW"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_SL1vm2PtbzzTrchWmL3EKOTz"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_ze2N5ryPh6FvdQiUpPkeVEKK"
}
```


### Tool: apply_patch

**Input:**
```json
{
  "callID": "call_ynz6CGoM5km2tD31UW7Gq0bh"
}
```


### Tool: apply_patch

**Input:**
```json
{
  "callID": "call_rvuVpYsPa4IctzrIOoFLeEZj"
}
```


### Tool: apply_patch

**Input:**
```json
{
  "callID": "call_gJ3twIqwIJXT6lRR8tG4yFB4"
}
```


### Tool: apply_patch

**Input:**
```json
{
  "callID": "call_68dBPe2YlNnj4N9ZzfChjzE6"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_gJoTOlGPjOPt0WqIt2VPXwOI"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_KVmNGC0EOqJsctGN1i8pxNHC"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_rCSciTrB8E789Cl2QVyJrUE6"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/tests/tools/execute-slash-command.test.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/AGENTS.md"
}
```


### Tool: apply_patch

**Input:**
```json
{
  "callID": "call_FZOUJ4rh7qzJSapmLnvAuV46"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_T2tugNpEw1WFHQalofCVl4QI"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_3ZXQ1quI4FMbV94LrNBuIEXq"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_savhsm5TvMRiqBVFyAYryfSh"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_63N2WDQjDG9liZRqxBmxVd85"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_Zc47qQXI8jJiafu9OyElGXjD"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_3Q0W5lReyRIjXdUPfmf4cXHu"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_vZdcfaSCHhONFK5TTgUFBNy1"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_SUwMQK1UNL4HSo3JJgPFvQDS"
}
```


## USER (turn 60)

**source:** real-human

route GSD /Users/apple/hivemind-plugin-private/.planning/phases/21.2-front-agent-switch-one-shot-agent-override
/Users/apple/hivemind-plugin-private/.planning/phases/21.2-front-agent-switch-one-shot-agent-override/.gitkeep
/Users/apple/hivemind-plugin-private/.planning/phases/21.2-front-agent-switch-one-shot-agent-override/21.2-context-2026-05-22.md
/Users/apple/hivemind-plugin-private/.planning/phases/21.2-front-agent-switch-one-shot-agent-override/21.2-prototype-implementation-evidence-2026-05-22.md
/Users/apple/hivemind-plugin-private/.planning/phases/21.2-front-agent-switch-one-shot-agent-override/21.2-prototype-plan-2026-05-22.md
/Users/apple/hivemind-plugin-private/.planning/phases/21.2-front-agent-switch-one-shot-agent-override/21.2-research-2026-05-22.md
/Users/apple/hivemind-plugin-private/.planning/phases/21.2-front-agent-switch-one-shot-agent-override/21.2-spec-2026-05-22.md  rồi tự động hoá từ SPEC, CONTEXT, planning và execution cho phase này

### Tool: execute-slash-command

**Input:**
```json
{
  "callID": "call_00_rm1gYO46on9cJWDwWG3C5244"
}
```


## USER (turn 61)

**source:** real-human

<objective>
Check project progress, summarize recent work and what's ahead, then intelligently route to the next action.

Three modes:
- **default**: Show progress report + intelligently route to the next action (execute or plan). Provides situational awareness before continuing work.
- **--next**: Automatically advance to the next logical step without manual route selection. Reads STATE.md, ROADMAP.md, and phase directories. Supports `--force` to bypass safety gates.
- **--do "task description"**: Analyze freeform natural language and dispatch to the most appropriate GSD command. Never does the work itself — matches intent, confirms, hands off.
- **--forensic**: Append a 6-check integrity audit after the standard progress report.
</objective>

<flags>
- **--next**: Detect current project state and automatically invoke the next logical GSD workflow step. Scans all prior phases for incomplete work before routing. `--next --force` bypasses safety gates.
- **--do "..."**: Smart dispatcher — match freeform intent to the best GSD command using routing rules, confirm the match, then hand off.
- **--forensic**: Run 6-check integrity audit after the standard progress report.
- **(no flag)**: Standard progress check + intelligent routing (Routes A through F).
</flags>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/progress.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/next.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/do.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/ui-brand.md
</execution_context>

<process>
Parse the first token of check 21.2:
- If it is `--next`: strip the flag, execute the next workflow (passing remaining args e.g. --force).
- If it is `--do`: strip the flag, pass remainder as freeform intent to the do workflow.
- Otherwise: execute the progress workflow end-to-end (pass --forensic through if present).

Preserve all routing logic from the target workflow.
</process>
Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/progress.md"}
<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/progress.md</path>
<type>file</type>
<content>
1: <purpose>
2: Check project progress, summarize recent work and what's ahead, then intelligently route to the next action — either executing an existing plan or creating the next one. Provides situational awareness before continuing work.
3: </purpose>
4: 
5: <required_reading>
6: Read all files referenced by the invoking prompt's execution_context before starting.
7: </required_reading>
8: 
9: <process>
10: 
11: <step name="init_context">
12: **Load progress context (paths only):**
13: 
14: ```bash
15: INIT=$(gsd-sdk query init.progress)
16: if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
17: ```
18: 
19: Extract from init JSON: `project_exists`, `roadmap_exists`, `state_exists`, `phases`, `current_phase`, `next_phase`, `milestone_version`, `completed_count`, `phase_count`, `paused_at`, `state_path`, `roadmap_path`, `project_path`, `config_path`.
20: 
21: ```bash
22: DISCUSS_MODE=$(gsd-sdk query config-get workflow.discuss_mode 2>/dev/null || echo "discuss")
23: ```
24: 
25: If `project_exists` is false (no `.planning/` directory):
26: 
27: ```
28: No planning structure found.
29: 
30: Run /gsd-new-project to start a new project.
31: ```
32: 
33: Exit.
34: 
35: If missing STATE.md: suggest `/gsd-new-project`.
36: 
37: **If ROADMAP.md missing but PROJECT.md exists:**
38: 
39: This means a milestone was completed and archived. Go to **Route F** (between milestones).
40: 
41: If missing both ROADMAP.md and PROJECT.md: suggest `/gsd-new-project`.
42: </step>
43: 
44: <step name="load">
45: **Use structured extraction from `gsd-sdk query` (or legacy gsd-tools.cjs):**
46: 
47: Instead of reading full files, use targeted tools to get only the data needed for the report:
48: - `ROADMAP=$(gsd-sdk query roadmap.analyze)`
49: - `STATE=$(gsd-sdk query state-snapshot)`
50: 
51: This minimizes orchestrator context usage.
52: </step>
53: 
54: <step name="analyze_roadmap">
55: **Get comprehensive roadmap analysis (replaces manual parsing):**
56: 
57: ```bash
58: ROADMAP=$(gsd-sdk query roadmap.analyze)
59: ```
60: 
61: This returns structured JSON with:
62: - All phases with disk status (complete/partial/planned/empty/no_directory)
63: - Goal and dependencies per phase
64: - Plan and summary counts per phase
65: - Aggregated stats: total plans, summaries, progress percent
66: - Current and next phase identification
67: 
68: Use this instead of manually reading/parsing ROADMAP.md.
69: </step>
70: 
71: <step name="recent">
72: **Gather recent work context:**
73: 
74: - Find the 2-3 most recent SUMMARY.md files
75: - Use `summary-extract` for efficient parsing:
76:   ```bash
77:   gsd-sdk query summary-extract <path> --fields one_liner
78:   ```
79: - This shows "what we've been working on"
80:   </step>
81: 
82: <step name="position">
83: **Parse current position from init context and roadmap analysis:**
84: 
85: - Use `current_phase` and `next_phase` from `$ROADMAP`
86: - Note `paused_at` if work was paused (from `$STATE`)
87: - Count pending todos: use `init todos` or `list-todos`
88: - Check for active debug sessions: `(ls .planning/debug/*.md 2>/dev/null || true) | grep -v resolved | wc -l`
89:   </step>
90: 
91: <step name="report">
92: > ⚠️ Context authority: PROJECT.md, STATE.md, and ROADMAP.md are the authoritative sources
93: > for project name, milestone, current phase, and next-step routing. AGENTS.md ## Project
94: > blocks are a secondary config aid that may be significantly stale — do NOT use the
95: > AGENTS.md project description as a source for any progress report field.
96: 
97: **Generate progress bar from `gsd-sdk query progress` / `progress.json`, then present rich status report:**
98: 
99: ```bash
100: # Get formatted progress bar
101: PROGRESS_BAR=$(gsd-sdk query progress.bar --raw)
102: ```
103: 
104: Present:
105: 
106: ```
107: # [Project Name]
108: 
109: **Progress:** {PROGRESS_BAR}
110: **Profile:** [quality/balanced/budget/inherit]
111: **Discuss mode:** {DISCUSS_MODE}
112: 
113: ## Recent Work
114: - [Phase X, Plan Y]: [what was accomplished - 1 line from summary-extract]
115: - [Phase X, Plan Z]: [what was accomplished - 1 line from summary-extract]
116: 
117: ## Current Position
118: Phase [N] of [total]: [phase-name]
119: Plan [M] of [phase-total]: [status]
120: CONTEXT: [✓ if has_context | - if not]
121: 
122: ## Key Decisions Made
123: - [extract from $STATE.decisions[]]
124: - [e.g. jq -r '.decisions[].decision' from state-snapshot]
125: 
126: ## Blockers/Concerns
127: - [extract from $STATE.blockers[]]
128: - [e.g. jq -r '.blockers[].text' from state-snapshot]
129: 
130: ## Pending Todos
131: - [count] pending — /gsd-capture --list to review
132: 
133: ## Active Debug Sessions
134: - [count] active — /gsd-debug to continue
135: (Only show this section if count > 0)
136: 
137: ## What's Next
138: [Next phase/plan objective from roadmap analyze]
139: ```
140: 
141: </step>
142: 
143: <step name="mvp_display">
144: **MVP-mode display (when phase has `**Mode:** mvp` in ROADMAP.md).**
145: 
146: Resolve `MVP_MODE` per phase via the centralized resolver. progress has no `--mvp` CLI flag (mode is inherited from the planned phase), so we omit `--cli-flag`:
147: 
148: ```bash
149: MVP_MODE=$(gsd-sdk query phase.mvp-mode "${PHASE_NUMBER}" --pick active)
150: ```
151: 
152: When `MVP_MODE=true`, the per-phase progress block adds a **user-flow status** sub-block sourced from the phase's PLAN.md task names. Each task whose name reads like a user-visible capability (e.g., "Register flow", "Login flow", "Password reset") is rendered as a status line:
153: 
154: ```
155: Phase 1 — User Auth MVP
156:   ✅ Walking Skeleton complete           ← from SKELETON.md existence
157:   ✅ Register flow working               ← from PLAN.md task with summary
158:   ✅ Login flow working                  ← from PLAN.md task with summary
159:   🔄 Password reset (in progress)        ← from PLAN.md task without summary
160:   ⬜ Email verification                  ← from PLAN.md task not yet started
161: ```
162: 
163: **User-flow filter:** Tasks whose names are technical-sounding ("Wire DB schema", "Create migration", "Bump deps") are NOT rendered as user-flow status lines. Heuristic: a task name is user-flow-shaped if it ends in "flow", "page", "screen", or starts with a verb the user would recognize ("Register", "Login", "Upload", "View"). Tasks that fail the heuristic still count toward the standard task progress total but don't appear in the user-flow sub-block.
164: 
165: When `MVP_MODE=false` (mode is null, absent, or the phase has no `**Mode:**` line), fall back to the standard display path — no behavioral change.
166: </step>
167: 
168: <step name="route">
169: **Determine next action based on verified counts.**
170: 
171: **Step 1: Count plans, summaries, and issues in current phase**
172: 
173: List files in the current phase directory:
174: 
175: ```bash
176: (ls -1 .planning/phases/[current-phase-dir]/*-PLAN.md 2>/dev/null || true) | wc -l
177: (ls -1 .planning/phases/[current-phase-dir]/*-SUMMARY.md 2>/dev/null || true) | wc -l
178: (ls -1 .planning/phases/[current-phase-dir]/*-UAT.md 2>/dev/null || true) | wc -l
179: ```
180: 
181: State: "This phase has {X} plans, {Y} summaries."
182: 
183: **Step 1.5: Check for unaddressed UAT gaps**
184: 
185: Check for UAT.md files with status "diagnosed" (has gaps needing fixes).
186: 
187: ```bash
188: # Check for diagnosed UAT with gaps or partial (incomplete) testing
189: grep -l "status: diagnosed\|status: partial" .planning/phases/[current-phase-dir]/*-UAT.md 2>/dev/null || true
190: ```
191: 
192: Track:
193: - `uat_with_gaps`: UAT.md files with status "diagnosed" (gaps need fixing)
194: - `uat_partial`: UAT.md files with status "partial" (incomplete testing)
195: 
196: **Step 1.6: Cross-phase health check**
197: 
198: Scan ALL phases in the current milestone for outstanding verification debt using the CLI (which respects milestone boundaries via `getMilestonePhaseFilter`):
199: 
200: ```bash
201: DEBT=$(gsd-sdk query audit-uat --raw 2>/dev/null)
202: ```
203: 
204: Parse JSON for `summary.total_items` and `summary.total_files`.
205: 
206: Track: `outstanding_debt` — `summary.total_items` from the audit.
207: 
208: **If outstanding_debt > 0:** Add a warning section to the progress report output (in the `report` step), placed between "## What's Next" and the route suggestion:
209: 
210: ```markdown
211: ## Verification Debt ({N} files across prior phases)
212: 
213: | Phase | File | Issue |
214: |-------|------|-------|
215: | {phase} | {filename} | {pending_count} pending, {skipped_count} skipped, {blocked_count} blocked |
216: | {phase} | {filename} | human_needed — {count} items |
217: 
218: Review: `/gsd-audit-uat ${GSD_WS}` — full cross-phase audit
219: Resume testing: `/gsd-verify-work {phase} ${GSD_WS}` — retest specific phase
220: ```
221: 
222: This is a WARNING, not a blocker — routing proceeds normally. The debt is visible so the user can make an informed choice.
223: 
224: **Step 2: Route based on counts**
225: 
226: | Condition | Meaning | Action |
227: |-----------|---------|--------|
228: | uat_partial > 0 | UAT testing incomplete | Go to **Route E.2** |
229: | uat_with_gaps > 0 | UAT gaps need fix plans | Go to **Route E** |
230: | summaries < plans | Unexecuted plans exist | Go to **Route A** |
231: | summaries = plans AND plans > 0 | Phase complete | Go to Step 3 |
232: | plans = 0 | Phase not yet planned | Go to **Route B** |
233: 
234: ---
235: 
236: **Route A: Unexecuted plan exists**
237: 
238: Find the first PLAN.md without matching SUMMARY.md.
239: Read its `<objective>` section.
240: 
241: ```
242: ---
243: 
244: ## ▶ Next Up — [${PROJECT_CODE}] ${PROJECT_TITLE}
245: 
246: **{phase}-{plan}: [Plan Name]** — [objective summary from PLAN.md]
247: 
248: `/clear` then:
249: 
250: `/gsd-execute-phase {phase} ${GSD_WS}`
251: 
252: ---
253: ```
254: 
255: ---
256: 
257: **Route B: Phase needs planning**
258: 
259: Check if `{phase_num}-CONTEXT.md` exists in phase directory.
260: 
261: Check if current phase has UI indicators:
262: 
263: ```bash
264: PHASE_SECTION=$(gsd-sdk query roadmap.get-phase "${CURRENT_PHASE}" 2>/dev/null)
265: PHASE_HAS_UI=$(echo "$PHASE_SECTION" | grep -qi "UI hint.*yes" && echo "true" || echo "false")
266: ```
267: 
268: **If CONTEXT.md exists:**
269: 
270: ```
271: ---
272: 
273: ## ▶ Next Up — [${PROJECT_CODE}] ${PROJECT_TITLE}
274: 
275: **Phase {N}: {Name}** — {Goal from ROADMAP.md}
276: <sub>✓ Context gathered, ready to plan</sub>
277: 
278: `/clear` then:
279: 
280: `/gsd-plan-phase {phase-number} ${GSD_WS}`
281: 
282: ---
283: ```
284: 
285: **If CONTEXT.md does NOT exist AND phase has UI (`PHASE_HAS_UI` is `true`):**
286: 
287: ```
288: ---
289: 
290: ## ▶ Next Up — [${PROJECT_CODE}] ${PROJECT_TITLE}
291: 
292: **Phase {N}: {Name}** — {Goal from ROADMAP.md}
293: 
294: `/clear` then:
295: 
296: `/gsd-discuss-phase {phase}` — gather context and clarify approach
297: 
298: ---
299: 
300: **Also available:**
301: - `/gsd-ui-phase {phase}` — generate UI design contract (recommended for frontend phases)
302: - `/gsd-plan-phase {phase}` — skip discussion, plan directly
303: - `/gsd-discuss-phase {phase}` — include assumptions check before planning
304: 
305: ---
306: ```
307: 
308: **If CONTEXT.md does NOT exist AND phase has no UI:**
309: 
310: ```
311: ---
312: 
313: ## ▶ Next Up — [${PROJECT_CODE}] ${PROJECT_TITLE}
314: 
315: **Phase {N}: {Name}** — {Goal from ROADMAP.md}
316: 
317: `/clear` then:
318: 
319: `/gsd-discuss-phase {phase} ${GSD_WS}` — gather context and clarify approach
320: 
321: ---
322: 
323: **Also available:**
324: - `/gsd-plan-phase {phase} ${GSD_WS}` — skip discussion, plan directly
325: - `/gsd-discuss-phase {phase} ${GSD_WS}` — include assumptions check before planning
326: 
327: ---
328: ```
329: 
330: ---
331: 
332: **Route E: UAT gaps need fix plans**
333: 
334: UAT.md exists with gaps (diagnosed issues). User needs to plan fixes.
335: 
336: ```
337: ---
338: 
339: ## ⚠ UAT Gaps Found
340: 
341: **{phase_num}-UAT.md** has {N} gaps requiring fixes.
342: 
343: `/clear` then:
344: 
345: `/gsd-plan-phase {phase} --gaps ${GSD_WS}`
346: 
347: ---
348: 
349: **Also available:**
350: - `/gsd-execute-phase {phase} ${GSD_WS}` — execute phase plans
351: - `/gsd-verify-work {phase} ${GSD_WS}` — run more UAT testing
352: 
353: ---
354: ```
355: 
356: ---
357: 
358: **Route E.2: UAT testing incomplete (partial)**
359: 
360: UAT.md exists with `status: partial` — testing session ended before all items resolved.
361: 
362: ```
363: ---
364: 
365: ## Incomplete UAT Testing
366: 
367: **{phase_num}-UAT.md** has {N} unresolved tests (pending, blocked, or skipped).
368: 
369: `/clear` then:
370: 
371: `/gsd-verify-work {phase} ${GSD_WS}` — resume testing from where you left off
372: 
373: ---
374: 
375: **Also available:**
376: - `/gsd-audit-uat ${GSD_WS}` — full cross-phase UAT audit
377: - `/gsd-execute-phase {phase} ${GSD_WS}` — execute phase plans
378: 
379: ---
380: ```
381: 
382: ---
383: 
384: **Step 3: Check milestone status (only when phase complete)**
385: 
386: Read ROADMAP.md and identify:
387: 1. Current phase number
388: 2. All phase numbers in the current milestone section
389: 
390: Count total phases and identify the highest phase number.
391: 
392: State: "Current phase is {X}. Milestone has {N} phases (highest: {Y})."
393: 
394: **Route based on milestone status:**
395: 
396: | Condition | Meaning | Action |
397: |-----------|---------|--------|
398: | current phase < highest phase | More phases remain | Go to **Route C** |
399: | current phase = highest phase | Milestone complete | Go to **Route D** |
400: 
401: ---
402: 
403: **Route C: Phase complete, more phases remain**
404: 
405: Read ROADMAP.md to get the next phase's name and goal.
406: 
407: Check if next phase has UI indicators:
408: 
409: ```bash
410: NEXT_PHASE_SECTION=$(gsd-sdk query roadmap.get-phase "$((Z+1))" 2>/dev/null)
411: NEXT_HAS_UI=$(echo "$NEXT_PHASE_SECTION" | grep -qi "UI hint.*yes" && echo "true" || echo "false")
412: ```
413: 
414: **If next phase has UI (`NEXT_HAS_UI` is `true`):**
415: 
416: ```
417: ---
418: 
419: ## ✓ Phase {Z} Complete
420: 
421: ## ▶ Next Up — [${PROJECT_CODE}] ${PROJECT_TITLE}
422: 
423: **Phase {Z+1}: {Name}** — {Goal from ROADMAP.md}
424: 
425: `/clear` then:
426: 
427: `/gsd-discuss-phase {Z+1}` — gather context and clarify approach
428: 
429: ---
430: 
431: **Also available:**
432: - `/gsd-ui-phase {Z+1}` — generate UI design contract (recommended for frontend phases)
433: - `/gsd-plan-phase {Z+1}` — skip discussion, plan directly
434: - `/gsd-verify-work {Z}` — user acceptance test before continuing
435: 
436: ---
437: ```
438: 
439: **If next phase has no UI:**
440: 
441: ```
442: ---
443: 
444: ## ✓ Phase {Z} Complete
445: 
446: ## ▶ Next Up — [${PROJECT_CODE}] ${PROJECT_TITLE}
447: 
448: **Phase {Z+1}: {Name}** — {Goal from ROADMAP.md}
449: 
450: `/clear` then:
451: 
452: `/gsd-discuss-phase {Z+1} ${GSD_WS}` — gather context and clarify approach
453: 
454: ---
455: 
456: **Also available:**
457: - `/gsd-plan-phase {Z+1} ${GSD_WS}` — skip discussion, plan directly
458: - `/gsd-verify-work {Z} ${GSD_WS}` — user acceptance test before continuing
459: 
460: ---
461: ```
462: 
463: ---
464: 
465: **Route D: Milestone complete**
466: 
467: ```
468: ---
469: 
470: ## 🎉 Milestone Complete
471: 
472: All {N} phases finished!
473: 
474: ## ▶ Next Up — [${PROJECT_CODE}] ${PROJECT_TITLE}
475: 
476: **Complete Milestone** — archive and prepare for next
477: 
478: `/clear` then:
479: 
480: `/gsd-complete-milestone ${GSD_WS}`
481: 
482: ---
483: 
484: **Also available:**
485: - `/gsd-verify-work ${GSD_WS}` — user acceptance test before completing milestone
486: 
487: ---
488: ```
489: 
490: ---
491: 
492: **Route F: Between milestones (ROADMAP.md missing, PROJECT.md exists)**
493: 
494: A milestone was completed and archived. Ready to start the next milestone cycle.
495: 
496: Read MILESTONES.md to find the last completed milestone version.
497: 
498: ```
499: ---
500: 
501: ## ✓ Milestone v{X.Y} Complete
502: 
503: Ready to plan the next milestone.
504: 
505: ## ▶ Next Up — [${PROJECT_CODE}] ${PROJECT_TITLE}
506: 
507: **Start Next Milestone** — questioning → research → requirements → roadmap
508: 
509: `/clear` then:
510: 
511: `/gsd-new-milestone ${GSD_WS}`
512: 
513: ---
514: ```
515: 
516: </step>
517: 
518: <step name="edge_cases">
519: **Handle edge cases:**
520: 
521: - Phase complete but next phase not planned → offer `/gsd-plan-phase [next] ${GSD_WS}`
522: - All work complete → offer milestone completion
523: - Blockers present → highlight before offering to continue
524: - Handoff file exists → mention it, offer `/gsd-resume-work ${GSD_WS}`
525: </step>
526: 
527: <step name="forensic_audit">
528: **Forensic Integrity Audit** — only runs when `--forensic` is present in ARGUMENTS.
529: 
530: If `--forensic` is NOT present in ARGUMENTS: skip this step entirely. Default progress behavior (standard report + routing) is unchanged.
531: 
532: If `--forensic` IS present: after the standard report and routing suggestion have been displayed, append the following audit section.
533: 
534: ---
535: 
536: ## Forensic Integrity Audit
537: 
538: Running 6 deep checks against project state...
539: 
540: Run each check in order. For each check, emit ✓ (pass) or ⚠ (warning) with concrete evidence when a problem is found.
541: 
542: **Check 1 — STATE vs artifact consistency**
543: 
544: Read STATE.md `status` / `stopped_at` fields (from the STATE snapshot already loaded). Compare against the artifact count from the roadmap analysis. If STATE.md claims the current phase is pending/mid-flight but the artifact count shows it as complete (all PLAN.md files have matching SUMMARY.md files), flag inconsistency. Emit:
545: - ✓ `STATE.md consistent with artifact count` — if both agree
546: - ⚠ `STATE.md claims [status] but artifact count shows phase complete` — with the specific values
547: 
548: **Check 2 — Orphaned handoff files**
549: 
550: Check for existence of:
551: ```bash
552: ls .planning/HANDOFF.json .planning/phases/*/.continue-here.md .planning/phases/*/*HANDOFF*.md 2>/dev/null || true
553: ```
554: Also check `.planning/continue-here.md`.
555: 
556: Emit:
557: - ✓ `No orphaned handoff files` — if none found
558: - ⚠ `Orphaned handoff files found` — list each file path, add: `→ Work was paused mid-flight. Read the handoff before continuing.`
559: 
560: **Check 3 — Deferred scope drift**
561: 
562: Search phase artifacts (CONTEXT.md, DISCUSSION-LOG.md, BUG-BRIEF.md, VERIFICATION.md, SUMMARY.md, HANDOFF.md files under `.planning/phases/`) for patterns:
563: ```bash
564: grep -rl "defer to Phase\|future phase\|out of scope Phase\|deferred to Phase" .planning/phases/ 2>/dev/null || true
565: ```
566: 
567: For each match, extract the referenced phase number. Cross-reference against ROADMAP.md phase list. If the referenced phase number is NOT in ROADMAP.md, flag as deferred scope not captured.
568: 
569: Emit:
570: - ✓ `All deferred scope captured in ROADMAP` — if no mismatches
571: - ⚠ `Deferred scope references phase(s) not in ROADMAP` — list: file, reference text, missing phase number
572: 
573: **Check 4 — Memory-flagged pending work**
574: 
575: Check if `.planning/MEMORY.md` or `.planning/memory/` exists:
576: ```bash
577: ls .planning/MEMORY.md .planning/memory/*.md 2>/dev/null || true
578: ```
579: 
580: If found, grep for entries containing: `pending`, `status`, `deferred`, `not yet run`, `backfill`, `blocking`.
581: 
582: Emit:
583: - ✓ `No memory entries flagging pending work` — if none found or no MEMORY.md
584: - ⚠ `Memory entries flag pending/deferred work` — list the matching lines (max 5, truncated at 80 chars)
585: 
586: **Check 5 — Blocking operational todos**
587: 
588: Check for pending todos:
589: ```bash
590: ls .planning/todos/pending/*.md 2>/dev/null || true
591: ```
592: 
593: For files found, scan for keywords indicating operational blockers: `script`, `credential`, `API key`, `manual`, `verification`, `setup`, `configure`, `run `.
594: 
595: Emit:
596: - ✓ `No blocking operational todos` — if no pending todos or none match operational keywords
597: - ⚠ `Blocking operational todos found` — list the file names and matching keywords (max 5)
598: 
599: **Check 6 — Uncommitted code**
600: 
601: ```bash
602: git status --porcelain 2>/dev/null | grep -v "^??" | grep -v "^.planning\/" | grep -v "^\.\." | head -10
603: ```
604: 
605: If output is non-empty (modified/staged files outside `.planning/`), flag as uncommitted code.
606: 
607: Emit:
608: - ✓ `Working tree clean` — if no modified files outside `.planning/`
609: - ⚠ `Uncommitted changes in source files` — list up to 10 file paths
610: 
611: ---
612: 
613: After all 6 checks, display the verdict:
614: 
615: **If all 6 checks passed:**
616: ```
617: ### Verdict: CLEAN
618: 
619: The standard progress report is trustworthy — proceed with the routing suggestion above.
620: ```
621: 
622: **If 1 or more checks failed:**
623: ```
624: ### Verdict: N INTEGRITY ISSUE(S) FOUND
625: 
626: The standard progress report may not reflect true project state.
627: Review the flagged items above before acting on the routing suggestion.
628: ```
629: 
630: Then for each failed check, add a concrete next action:
631: - Check 2 (orphaned handoff): `Read the handoff file(s) and resume from where work was paused: /gsd-resume-work ${GSD_WS}`
632: - Check 3 (deferred scope): `Add the missing phases to ROADMAP.md or update the deferred references`
633: - Check 4 (memory pending): `Review the flagged memory entries and resolve or clear them`
634: - Check 5 (blocking todos): `Complete the operational steps in .planning/todos/pending/ before continuing`
635: - Check 6 (uncommitted code): `Commit or stash the uncommitted changes before advancing`
636: - Check 1 (STATE inconsistency): `Run /gsd-verify-work ${PHASE} ${GSD_WS} to reconcile state`
637: </step>
638: 
639: </process>
640: 
641: <success_criteria>
642: 
643: - [ ] Rich context provided (recent work, decisions, issues)
644: - [ ] Current position clear with visual progress
645: - [ ] What's next clearly explained
646: - [ ] Smart routing: /gsd-execute-phase if plans exist, /gsd-plan-phase if not
647: - [ ] User confirms before any action
648: - [ ] Seamless handoff to appropriate gsd command
649:       </success_criteria>

(End of file - total 649 lines)
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

- **DELEGATION STACKING — attach work onto ANY existing session:** Both `task` and `delegate-task` support attaching new work as a child of a completed main session — NOT just resuming aborted tasks. Pattern: pass the existing session ID directly.
  - **`task` tool:** set `task_id` parameter to any existing session ID (not just a previous task_id from task tool). The new subagent attaches as a child of that session.
  - **`delegate-task` tool:** pass `context` as JSON: `{"parentSessionId": "<session-id>"}`. The new delegation attaches as a child of that session.
  - Do NOT inject the session ID into the prompt text — that creates a new independent session. The correct approach is passing it as a parameter so OpenCode's hierarchy tracking properly chains the sessions.
  - **Prompt stays simple** — context from the target session is preserved through the session chain. No need to re-describe old work in the prompt. This is the same principle as `subagent_type`/`agent` parameter: you specify the agent name to select the handler, you specify `task_id`/`parentSessionId` to select the session to attach to.
  - This pattern covers BOTH use cases: **resume** (incomplete session) and **stack-on** (completed session to add new work as a child).

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
Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/next.md"}
<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/next.md</path>
<type>file</type>
<content>
1: <purpose>
2: Detect current project state and automatically advance to the next logical GSD workflow step.
3: Reads project state to determine: discuss → plan → execute → verify → complete progression.
4: </purpose>
5: 
6: <required_reading>
7: Read all files referenced by the invoking prompt's execution_context before starting.
8: </required_reading>
9: 
10: <process>
11: 
12: <step name="detect_state">
13: Read project state to determine current position:
14: 
15: ```bash
16: # Get state snapshot
17: gsd-sdk query state.json 2>/dev/null || echo "{}"
18: ```
19: 
20: Also read:
21: - `.planning/STATE.md` — current phase, progress, plan counts
22: - `.planning/ROADMAP.md` — milestone structure and phase list
23: 
24: Extract:
25: - `current_phase` — which phase is active
26: - `plan_of` / `plans_total` — plan execution progress
27: - `progress` — overall percentage
28: - `status` — active, paused, etc.
29: 
30: If no `.planning/` directory exists:
31: ```
32: No GSD project detected. Run `/gsd-new-project` to get started.
33: ```
34: Exit.
35: </step>
36: 
37: <step name="safety_gates">
38: Run hard-stop checks before routing. Exit on first hit unless `--force` was passed.
39: 
40: If `--force` flag was passed, skip all gates and the consecutive guard.
41: Print a one-line warning: `⚠ --force: skipping safety gates`
42: Then proceed directly to `determine_next_action`.
43: 
44: **Gate 1: Unresolved checkpoint**
45: Check if `.planning/.continue-here.md` exists:
46: ```bash
47: [ -f .planning/.continue-here.md ]
48: ```
49: If found:
50: ```
51: ⛔ Hard stop: Unresolved checkpoint
52: 
53: `.planning/.continue-here.md` exists — a previous session left
54: unfinished work that needs manual review before advancing.
55: 
56: Read the file, resolve the issue, then delete it to continue.
57: Use `--force` to bypass this check.
58: ```
59: Exit (do not route).
60: 
61: **Gate 2: Error state**
62: Check if STATE.md contains `status: error` or `status: failed`:
63: If found:
64: ```
65: ⛔ Hard stop: Project in error state
66: 
67: STATE.md shows status: {status}. Resolve the error before advancing.
68: Run `/gsd-health` to diagnose, or manually fix STATE.md.
69: Use `--force` to bypass this check.
70: ```
71: Exit.
72: 
73: **Gate 3: Unchecked verification**
74: Check if the current phase has a VERIFICATION.md with any `FAIL` items that don't have overrides:
75: If found:
76: ```
77: ⛔ Hard stop: Unchecked verification failures
78: 
79: VERIFICATION.md for phase {N} has {count} unresolved FAIL items.
80: Address the failures or add overrides before advancing to the next phase.
81: Use `--force` to bypass this check.
82: ```
83: Exit.
84: 
85: **Prior-phase completeness scan:**
86: After passing all three hard-stop gates, scan all phases that precede the current phase in ROADMAP.md order for incomplete work. For each prior phase number `N`, use `gsd-sdk query find-phase <N>` JSON (plans, summaries, incomplete_plans, etc.) to inspect that phase.
87: 
88: Detect three categories of incomplete work:
89: 1. **Plans without summaries** — a PLAN.md exists in a prior phase directory but no matching SUMMARY.md exists (execution started but not completed).
90: 2. **Verification failures not overridden** — a prior phase has a VERIFICATION.md with `FAIL` items that have no override annotation.
91: 3. **CONTEXT.md without plans** — a prior phase directory has a CONTEXT.md but no PLAN.md files (discussion happened, planning never ran).
92: 
93: If no incomplete prior work is found, continue to `determine_next_action` silently with no interruption.
94: 
95: If incomplete prior work is found, show a structured completeness report:
96: ```
97: ⚠ Prior phase has incomplete work
98: 
99: Phase {N} — "{name}" has unresolved items:
100:   • Plan {N}-{M} ({slug}): executed but no SUMMARY.md
101:   [... additional items ...]
102: 
103: Advancing before resolving these may cause:
104:   • Verification gaps — future phase verification won't have visibility into what prior phases shipped
105:   • Context loss — plans that ran without summaries leave no record for future agents
106: 
107: Options:
108:   [C] Continue and defer these items to backlog
109:   [S] Stop and resolve manually (recommended)
110:   [F] Force advance without recording deferral
111: 
112: Choice [S]:
113: ```
114: 
115: **If the user chooses "Stop" (S or Enter/default):** Exit without routing.
116: 
117: **If the user chooses "Continue and defer" (C):**
118: 1. For each incomplete item, create a backlog entry in `ROADMAP.md` under `## Backlog` using the existing `999.x` numbering scheme:
119: ```markdown
120: ### Phase 999.{N}: Follow-up — Phase {src} incomplete plans (BACKLOG)
121: 
122: **Goal:** Resolve plans that ran without producing summaries during Phase {src} execution
123: **Source phase:** {src}
124: **Deferred at:** {date} during /gsd-progress --next advancement to Phase {dest}
125: **Plans:**
126: - [ ] {N}-{M}: {slug} (ran, no SUMMARY.md)
127: ```
128: 2. Commit the deferral record:
129: ```bash
130: gsd-sdk query commit "docs: defer incomplete Phase {src} items to backlog"
131: ```
132: 3. Continue routing to `determine_next_action` immediately — no second prompt.
133: 
134: **If the user chooses "Force" (F):** Continue to `determine_next_action` without recording deferral.
135: </step>
136: 
137: <step name="spike_sketch_notice">
138: Check for pending spike/sketch work and surface a notice (does not change routing):
139: 
140: ```bash
141: # Check for pending spikes (verdict: PENDING in any README)
142: PENDING_SPIKES=$(grep -rl 'verdict: PENDING' .planning/spikes/*/README.md 2>/dev/null | wc -l | tr -d ' ')
143: 
144: # Check for pending sketches (winner: null in any README)
145: PENDING_SKETCHES=$(grep -rl 'winner: null' .planning/sketches/*/README.md 2>/dev/null | wc -l | tr -d ' ')
146: ```
147: 
148: If either count is > 0, display before routing:
149: ```
150: ⚠ Pending exploratory work:
151:   {PENDING_SPIKES} spike(s) with unresolved verdicts in .planning/spikes/
152:   {PENDING_SKETCHES} sketch(es) without a winning variant in .planning/sketches/
153: 
154:   Resume with `/gsd-spike` or `/gsd-sketch`, or continue with phase work below.
155: ```
156: 
157: Only show lines for non-zero counts. If both are 0, skip this notice entirely.
158: </step>
159: 
160: <step name="determine_next_action">
161: Apply routing rules based on state:
162: 
163: **Route 1: No phases exist yet → discuss**
164: If ROADMAP has phases but no phase directories exist on disk:
165: → Next action: `/gsd-discuss-phase <first-phase>`
166: 
167: **Route 2: Phase exists but has no CONTEXT.md or RESEARCH.md → discuss**
168: If the current phase directory exists but has neither CONTEXT.md nor RESEARCH.md:
169: → Next action: `/gsd-discuss-phase <current-phase>`
170: 
171: **Route 3: Phase has context but no plans → plan**
172: If the current phase has CONTEXT.md (or RESEARCH.md) but no PLAN.md files:
173: → Next action: `/gsd-plan-phase <current-phase>`
174: 
175: **Route 4: Phase has plans but incomplete summaries → execute**
176: If plans exist but not all have matching summaries:
177: → Next action: `/gsd-execute-phase <current-phase>`
178: 
179: **Route 5: All plans have summaries → verify and complete**
180: If all plans in the current phase have summaries:
181: → Next action: `/gsd-verify-work`
182: 
183: **Route 6: Phase complete, next phase exists → advance**
184: If the current phase is complete and the next phase exists in ROADMAP:
185: → Next action: `/gsd-discuss-phase <next-phase>`
186: 
187: **Route 7: All phases complete → complete milestone**
188: If all phases are complete:
189: → Next action: `/gsd-complete-milestone`
190: 
191: **Route 8: Paused → resume**
192: If STATE.md shows paused_at:
193: → Next action: `/gsd-resume-work`
194: </step>
195: 
196: <step name="show_and_execute">
197: Display the determination:
198: 
199: ```
200: ## GSD Next
201: 
202: **Current:** Phase [N] — [name] | [progress]%
203: **Status:** [status description]
204: 
205: ▶ **Next step:** `/gsd-[command] [args]`
206:   [One-line explanation of why this is the next step]
207: ```
208: 
209: Then immediately invoke the determined command via skill.
210: Do not ask for confirmation — the whole point of `/gsd-progress --next` is zero-friction advancement.
211: </step>
212: 
213: </process>
214: 
215: <success_criteria>
216: - [ ] Project state correctly detected
217: - [ ] Next action correctly determined from routing rules
218: - [ ] Command invoked immediately without user confirmation
219: - [ ] Clear status shown before invoking
220: </success_criteria>

(End of file - total 220 lines)
</content>
Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/do.md"}
<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/do.md</path>
<type>file</type>
<content>
1: <purpose>
2: Analyze freeform text from the user and route to the most appropriate GSD command. This is a dispatcher — it never does the work itself. Match user intent to the best command, confirm the routing, and hand off.
3: </purpose>
4: 
5: <required_reading>
6: Read all files referenced by the invoking prompt's execution_context before starting.
7: </required_reading>
8: 
9: <process>
10: 
11: <step name="validate">
12: **Check for input.**
13: 
14: 
15: **Text mode (`workflow.text_mode: true` in config or `--text` flag):** Set `TEXT_MODE=true` if `--text` is present in `$ARGUMENTS` OR `text_mode` from init JSON is `true`. When TEXT_MODE is active, replace every `question` call with a plain-text numbered list and ask the user to type their choice number. This is required for non-the agent runtimes (OpenAI Codex, Gemini CLI, etc.) where `question` is not available.
16: If `$ARGUMENTS` is empty, ask via question:
17: 
18: ```
19: What would you like to do? Describe the task, bug, or idea and I'll route it to the right GSD command.
20: ```
21: 
22: Wait for response before continuing.
23: </step>
24: 
25: <step name="check_project">
26: **Check if project exists.**
27: 
28: ```bash
29: INIT=$(gsd-sdk query state.load 2>/dev/null)
30: ```
31: 
32: Track whether `.planning/` exists — some routes require it, others don't.
33: </step>
34: 
35: <step name="route">
36: **Match intent to command.**
37: 
38: Evaluate `$ARGUMENTS` against these routing rules. Apply the **first matching** rule:
39: 
40: | If the text describes... | Route to | Why |
41: |--------------------------|----------|-----|
42: | Starting a new project, "set up", "initialize" | `/gsd-new-project` | Needs full project initialization |
43: | Mapping or analyzing an existing codebase | `/gsd-map-codebase` | Codebase discovery |
44: | A bug, error, crash, failure, or something broken | `/gsd-debug` | Needs systematic investigation |
45: | Spiking, "test if", "will this work", "experiment", "prove this out", validate feasibility | `/gsd-spike` | Throwaway experiment to validate feasibility |
46: | Sketching, "mockup", "what would this look like", "prototype the UI", "design this", explore visual direction | `/gsd-sketch` | Throwaway HTML mockups to explore design |
47: | Wrapping up spikes, "package the spikes", "consolidate spike findings" | `/gsd-spike --wrap-up` | Package spike findings into reusable skill |
48: | Wrapping up sketches, "package the designs", "consolidate sketch findings" | `/gsd-sketch --wrap-up` | Package sketch findings into reusable skill |
49: | Exploring, researching, comparing, or "how does X work" | `/gsd-explore` | Socratic ideation and idea routing |
50: | Discussing vision, "how should X look", brainstorming | `/gsd-discuss-phase` | Needs context gathering |
51: | A complex task: refactoring, migration, multi-file architecture, system redesign | `/gsd-phase` | Needs a full phase with plan/build cycle |
52: | Planning a specific phase or "plan phase N" | `/gsd-plan-phase` | Direct planning request |
53: | Executing a phase or "build phase N", "run phase N" | `/gsd-execute-phase` | Direct execution request |
54: | Running all remaining phases automatically | `/gsd-autonomous` | Full autonomous execution |
55: | A review or quality concern about existing work | `/gsd-verify-work` | Needs verification |
56: | Checking progress, status, "where am I" | `/gsd-progress` | Status check |
57: | Resuming work, "pick up where I left off" | `/gsd-resume-work` | Session restoration |
58: | A note, idea, or "remember to..." | `/gsd-capture` | Capture for later |
59: | Adding tests, "write tests", "test coverage" | `/gsd-add-tests` | Test generation |
60: | Completing a milestone, shipping, releasing | `/gsd-complete-milestone` | Milestone lifecycle |
61: | A specific, actionable, small task (add feature, fix typo, update config) | `/gsd-quick` | Self-contained, single executor |
62: 
63: **Requires `.planning/` directory:** All routes except `/gsd-new-project`, `/gsd-map-codebase`, `/gsd-spike`, `/gsd-sketch`, and `/gsd-help`. If the project doesn't exist and the route requires it, suggest `/gsd-new-project` first.
64: 
65: **Ambiguity handling:** If the text could reasonably match multiple routes, ask the user via question with the top 2-3 options. For example:
66: 
67: ```
68: "Refactor the authentication system" could be:
69: 1. /gsd-phase — Full planning cycle (recommended for multi-file refactors)
70: 2. /gsd-quick — Quick execution (if scope is small and clear)
71: 
72: Which approach fits better?
73: ```
74: </step>
75: 
76: <step name="display">
77: **Show the routing decision.**
78: 
79: ```
80: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
81:  GSD ► ROUTING
82: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
83: 
84: **Input:** {first 80 chars of $ARGUMENTS}
85: **Routing to:** {chosen command}
86: **Reason:** {one-line explanation}
87: ```
88: </step>
89: 
90: <step name="dispatch">
91: **Invoke the chosen command.**
92: 
93: Run the selected `/gsd-*` command, passing `$ARGUMENTS` as args.
94: 
95: If the chosen command expects a phase number and one wasn't provided in the text, extract it from context or ask via question.
96: 
97: After invoking the command, stop. The dispatched command handles everything from here.
98: </step>
99: 
100: </process>
101: 
102: <success_criteria>
103: - [ ] Input validated (not empty)
104: - [ ] Intent matched to exactly one GSD command
105: - [ ] Ambiguity resolved via user question (if needed)
106: - [ ] Project existence checked for routes that require it
107: - [ ] Routing decision displayed before dispatch
108: - [ ] Command invoked with appropriate arguments
109: - [ ] No work done directly — dispatcher only
110: </success_criteria>

(End of file - total 110 lines)
</content>
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

### Tool: execute-slash-command

**Input:**
```json
{
  "callID": "call_00_m3SbhmxTxSpBU1oEMchF7128"
}
```


## USER (turn 62)

**source:** real-human



### Tool: task

**Input:**
```json
{
  "description": "Create detailed phase plan (PLAN.md) with verification loop",
  "subagent_type": "gsd-planner",
  "task_id": "ses_1b0e330e6ffepk2iiIn3KqIZi3"
}
```

**Output:** (pruned)
```
task_id: ses_1b0e330e6ffepk2iiIn3KqIZi3
```


## USER (turn 63)

**source:** real-human

<objective>
Execute all plans in a phase using wave-based parallel execution.

Orchestrator stays lean: discover plans, analyze dependencies, group into waves, spawn subagents, collect results. Each subagent loads the full execute-plan context and handles its own plan.

Optional wave filter:
- `--wave N` executes only Wave `N` for pacing, quota management, or staged rollout
- phase verification/completion still only happens when no incomplete plans remain after the selected wave finishes

Flag handling rule:
- The optional flags documented below are available behaviors, not implied active behaviors
- A flag is active only when its literal token appears in `21.2`
- If a documented flag is absent from `21.2`, treat it as inactive

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
Phase: 21.2

**Available optional flags (documentation only — not automatically active):**
- `--wave N` — Execute only Wave `N` in the phase. Use when you want to pace execution or stay inside usage limits.
- `--gaps-only` — Execute only gap closure plans (plans with `gap_closure: true` in frontmatter). Use after verify-work creates fix plans.
- `--interactive` — Execute plans sequentially inline (no subagents) with user checkpoints between tasks. Lower token usage, pair-programming style. Best for small phases, bug fixes, and verification gaps.

**Active flags must be derived from `21.2`:**
- `--wave N` is active only if the literal `--wave` token is present in `21.2`
- `--gaps-only` is active only if the literal `--gaps-only` token is present in `21.2`
- `--interactive` is active only if the literal `--interactive` token is present in `21.2`
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

- **DELEGATION STACKING — attach work onto ANY existing session:** Both `task` and `delegate-task` support attaching new work as a child of a completed main session — NOT just resuming aborted tasks. Pattern: pass the existing session ID directly.
  - **`task` tool:** set `task_id` parameter to any existing session ID (not just a previous task_id from task tool). The new subagent attaches as a child of that session.
  - **`delegate-task` tool:** pass `context` as JSON: `{"parentSessionId": "<session-id>"}`. The new delegation attaches as a child of that session.
  - Do NOT inject the session ID into the prompt text — that creates a new independent session. The correct approach is passing it as a parameter so OpenCode's hierarchy tracking properly chains the sessions.
  - **Prompt stays simple** — context from the target session is preserved through the session chain. No need to re-describe old work in the prompt. This is the same principle as `subagent_type`/`agent` parameter: you specify the agent name to select the handler, you specify `task_id`/`parentSessionId` to select the session to attach to.
  - This pattern covers BOTH use cases: **resume** (incomplete session) and **stack-on** (completed session to add new work as a child).

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

### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/21.2-front-agent-switch-one-shot-agent-override"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/21.2-front-agent-switch-one-shot-agent-override/21.2-01-PLAN.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/21.2-front-agent-switch-one-shot-agent-override/21.2-02-PLAN.md"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_bOLkwk8Wms7RMtDSfHEK6977"
}
```

