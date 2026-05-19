---
sessionID: ses_1be05c116ffeqIRmAKWcRUtdpO
created: 2026-05-19T20:42:59.772Z
updated: 2026-05-19T20:42:59.835Z
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

<Từ việc hoàn thành phase 14 và 15 cũng như context này như sau ```Như tiêu đề đã ghi thì phần session-manipulation-related-tools là các nhóm tools như (có thể tôi ghi không đủ, và vì tools còn kết nối với các chức năng engines và libs của nó nữa nên bạn hãy tìm hiểu bằng cách đọc các manifestations của nó tại .hivemind/** ; các code nằm rải rác trong tools, features, shared, coordination, delegation, session, task etc để truy vết đầy đủ các tools phân loại chúng và nhắm đến đúng mục tiêu - tham khảo tại skill `hivemind-power-on` skill  hiểu được cách từng tool phục vụ mục đích gì chúng có actions ra sao, arguments và paremeters thế nào được agents gọi ra vì mục đích gì và rồi đối chiếu với tình hình thực tại đề tìm ra bugs, flaws, gaps cũng như tính integration của chúng khi được dùng với nhau  ) dưới đây là list tham khảo nhưng tôi chú trọng về các mục có chứa "session", "context", "hierarchy", "delegation", "task", "coordination" làm trọng tâm (ngoài ra có một số tools trở nên vô nghĩa quá và không gắn kết gì thì cũng đưa vào list xem xét để tinh gọn consolidate hoặc defer thiết kế sau)


| Tool Name | What It Does | When To Use |
|-----------|-------------|-------------|
| `delegate-task` | Create a child session via SDK dispatch, tracked by DelegationManager | You need harness-tracked delegation with dual-signal completion, recovery, and notification routing |
| `delegation-status` | Poll delegation state: status, progress, abort, cancel, restart, resume, chain, adjust-prompt, change-agent | You need to check on or control a running delegation |
| `run-background-command` | Execute a shell command in a background/PTY session | You need a long-running shell command that shouldn't block the agent |
| `prompt-skim` | Fast skim of a prompt for structure and intent | You need a quick overview before deep analysis |
| `prompt-analyze` | Deep analysis of a prompt for contradictions, gaps, risks | You need to audit a prompt before sending it |
| `session-patch` | Modify session properties or metadata | You need to update session state |
| `execute-slash-command` | Run a registered OpenCode slash command | You need to invoke a command programmatically |
| `session-journal-export` | Export session journal to file | You need to persist session history for audit |
| `hivemind-doc` | Query Hivemind documentation | You need docs about harness features |
| `hivemind-trajectory` | Query execution trajectory / decision lineage | You need to trace what decisions led to current state |
| `hivemind-pressure` | Query runtime pressure / budget status | You need to check circuit-breaker or tool budget status |
| `hivemind-sdk-supervisor` | Inspect SDK client state and connection health | You need to debug SDK integration issues |
| `hivemind-command-engine` | Execute the Hivemind command engine | You need to run engine-level commands |
| `session-tracker` | List, search, and inspect session records | You need to find or resume a session |
| `session-hierarchy` | Get delegation depth and parent/child tree | You need to understand session lineage |
| `session-context` | Get session context from continuity | You need to recover context for a session |
| `hivemind-agent-work-create` | Create an agent work contract | You need to define a formal work agreement |
| `hivemind-agent-work-export` | Export agent work contract to file | You need to persist a work agreement |
| `configure-primitive` | Configure OpenCode primitives (agents, commands, skills) | You need to update config via tool |
| `validate-restart` | Validate restart safety before reconnecting | You need to check it's safe to restart |
| `bootstrap-init` | Initialize harness bootstrap state | First-time setup of a Hivemind project |
| `bootstrap-recover` | Recover from bootstrap failure | You need to recover a broken bootstrap |



---
Mục tiêu ở đây là 
1. Khi session-tracker đã được toàn diện hoá nhưng những tools phục vụ cho nó không hề khai thác được một chút gì thông tin mà nó đem lại (xem thêm bên dưới bạn hãy expand tất cả folder này đọc sample thật kỹ các file theo meta data, tính liên kết của nó, xem hierachy)

```

/Users/apple/hivemind-plugin-private/.hivemind/session-tracker
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/quarantine
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1be4b9809ffe1SHVk2WphOQU44
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1be5a8990ffeqZjxeUq54MIjWc
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1be5b3dbdffeJSfSy2BBcdecT3
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1be3597adffeTot1p4mwdclikw
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1bedf3484ffeWDnPqam61338uF
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1bee5bccaffekz53yNdwB0pXn1
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1bee7d5b4ffek8KOH9N1XrSgfc
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1bee909c9ffeiulJsRbBZ5DeJ3
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1beea3200ffeYUaF25xDQSKKn8
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1bf614136ffegsvg5lGfnax4Ja
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1bfc57e69ffe3qE7PJhelSEOic
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1bfe36dcaffe911nREAuCfZ4jU
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1c4c89803ffe1DexVzrLjkPjV0
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1c8e2b89fffed4QjLzznXTil6x
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1c8f865e7fferZ0iHrq3owlIfT
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1c51f9d38ffeni0hdp3q5JUHWN
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1c58bdf3fffe6H3sk7KOvAR95e
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1c442ab90ffeFWOHJJ63R4oKMR
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1c508e657ffeFlBGok0RYRKOcE
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1c571efb0ffeIloZPzsnqS0P0y
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1c857a177ffeYERktxuHRawNcX
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1c3554a4cffeTvtJqgrnVT7yTL
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1c5914b90ffeUIjdGIkNOPuAFZ
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1c8006e12ffeHA8IL88uvKj5jX
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1c80134adffecVUCm5kMVHIqsV
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1c317120affef8b53lWWFbDU67
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1c3333393ffe1zkj3M6dE0oSdB
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1c3416960ffefhUcHEXnz0uG3S
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1cd993f13ffeo1KE7DR7XeDDd1
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/project-continuity.json
```

>>>> từ đây ta có thể thấy là khi cần thiết agent dùng tools để phục vụ các mục đích sau đều fail

- xem lại context của  các session con (nay đều có meta `lastMessage` và `content` để search nhanh truy vết nhưng không hê tồn tại chức năng đó)

- xem theo phả hệ các query nhanh dạng hierarchy context - để agents biết cùng một session đã delegated những phiên nào rồi context ra sao để không phải delegate lại

- các query theo meta các post mortem chức năng đều không có trong khi context và session đều được ghi lại  mà agent toàn phải đọc toàn bộ hoặc lần mò trong sự thiếu hiểu biết nó không biết kết cấu các đối tượng liên quan ra sao không thể tận dụng các native tools như offset reading, hoặc ngay cả sử dụng doc-intelligence tools, hay grep, glob, regex search ngay cả LSP những thứ sẵn có của OpenCode cũng giúp cho việc truy xuất context này được thông minh và hiệu quả hơn miễn là có tools và tools có actions để agents làm việc đó 

- thêm nữa thông tin thời gian thực hoàn toàn mù tịt ví dụ khi người dùng bị rớt mạng mà phía trước đó có vài sub session đã được delegated và đã hình thành khá nhiều context trong đó agents đều mù tịt không thể nào dùng tools hay bất cứ thứ gì để biết context thực sự ra sao ở thời điểm bị rớt mạng - Và đơn giản hơn nó không hiểu được cơ chế là cho dù session trước đó có báo là aborted hay cancelled đi nữa thì OpenCode architecture mà qua bộ SDK thì các session này đã được preserve đơn giản chỉ cần có được session-id của các session bị rớt mạng đó và tên agent thì không cần lặp lại prompt hay tạo session mới mà chỉ cần dùng task tool để tạo một prompt resume cùng với task id chính xác là đã có thể resume lại

- ngoài ra các chức năng nghe có vẻ cao cấp như thay đổi agent, lấy context cũ và delegate tiếp tục cũng hoàn toàn và đơn giản thực hiện được chỉ với task tool, truy đúng được sub session id và context của nó thì dù hoàn thành hay chưa hay lưng chừng thì tạo cùng task session id sẽ giúp cho new task có được context cũ vì context một khi đã xác nhận delegated đều được preserve một cách tự động bởi OPENCODE SDK

>>>>>>>>> để mở rộng hơn thì `delegate-task`và `delegation-status` là thuộc nhóm custom delegation task nó không thay thế task tool nhưng đây là một dạng async task deleagtion mà nó cũng sử dụng các interfaces và bộ OpenCode SDK và plugins SDK hooks y như trên và vì thế nó cũng được ghi vào `session-tracker` bằng cách đưa nó vào chung một ecosytem và có những hướng dẫn, các functions và actions hỗ trợ trong tools phù hợp thì các agents được cấp phép sử dụng tools này sẽ có được context intelligence một cách chặt chẽ hơn ví dụ như dưới đây

- đồng thời như trên đối với các session đã có tools ghi nhận chạy rồi và chạy đúng với OpenCode SDK thì không việc gì phải delegate lại một phiên hoàn toàn mới thay vào đó việc resume lại một phiên (miễn là có session id) là hoàn toàn khả thi và với một knowledge là một khi đã xác nhận mức 1 thành công tức session đã chạy → thì mặc định delegator có thể resume với prompt đơn giản và thâm chí thay đổi agent name nhưng các context phía trên nó đều được bảo tồn (điều này delegator agent không nhận biết được nhưng tool cần thiết kế ra cho mục đích như vậy nó ghi nhận session và hướng dẫn delegator agent resume với prompt đơn giản mà không phải lặp lại trừ khi muốn thay đổi điều hướng khác đi
- chức năng phía trên cũng có thể mở rộng ra cho việc quản lý delegation tasks - cụ thể hơn là completed delegated tasks - orchestrator, coordinator (tức nhóm l0 và l1, cũng như agent mặc định build)  và delegator hoàn toàn có thể chủ động tạo một task mới nối tiếp các completed task b ằng cách sử dụng lại session id cũ → việc này giúp nhiệm vụ mới có được context của nhiệm vụ cũ mà main agents l0 và l1 không phải diễn dãi ra hoặc hallucinate đưa một thông tin không liên quan tới những gì mà task trước đó tìm kiếm



## Các tài liệu cần xem qua
1. Quy chuẩn thiết kế tools @/Users/apple/hivemind-plugin-private/.planning/archive/2026-05-07/CUSTOM-TOOLS-CRITERIA-2026-05-05.md

2. các nguồn nghiên cứu thêm
```
**IMPORTANT HEAD-UP!**: 

- For any “other frameworks/projects synthesis” - such as gsd-* https://github.com/gsd-build/get-shit-done or OMO https://github.com/code-yeongyu/oh-my-openagent → DO NOT SIMPLY INGEST everything and throw-in without deeply synthesize towards the HIVEMIND philosophies, concepts and visions
- And as above all those editions of primitives - config, naming, prefixes, suffixes, designs as for workflows and harness features must completely be transformed, adapt, and integrate coherently toward `the Hivemind`  under OpenCode (with specs compliance, harness lifecycles validation, ecosystem validation) - also, the gsd-* (or any keyword as prefixes or suffixes in skills, agents, commands, workflows, custom tools, etc are not expected to ship with the project and they are there just because I am using GSD framework to develop this - and if any “synthesis” that the units are expected to ship-with → they must follow the above rules and mindsets
- other  repos of OpenCode projects and plugins utilizing OpenCode SDK, plugins , client-server API - can be found here with these note-worthy repos vs. harness features categories
    1. Context-managements categories:
        1. https://github.com/Opencode-DCP/opencode-dynamic-context-pruning
    2. Harness features addressing  OpenCode innate shortcomings - the task, command and delegation feature class
        1. https://github.com/shekohex/opencode-ptyhttps://github.com/shekohex/opencode-pty#features  → resolve non-interactive commands, background runnings and multiple sessions - with OMO synthesis of background tasks, background agent, polling system to address this repo’s known limitations https://github.com/shekohex/opencode-pty#permissions
        2. related to the above is the background-agent repo https://github.com/kdcokenny/opencode-background-agents 
    3. A  **HUGE LIST OF CURATED OPENCODE ECOSYSTEM PROJECTS and PLUGINS -**  https://github.com/awesome-opencode/awesome-opencode - check this directory very often as you need to synthesize for feature-development, learn patterns, ideating and knowledge ingestion - I have also made a local copy of this under this path `/Users/apple/Documents/coding-projects/hivemind-plugin-1/.planning/research/OPENCODE-ECOSYSTEM-REPO-DIRECTORIES.md`
    ``` ``` hãy xem xét tạo một phase mới từ sau khi gain được intelligence và hiểu được context qua các commits gần đây>
Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.planning/archive/2026-05-07/CUSTOM-TOOLS-CRITERIA-2026-05-05.md"}
<path>/Users/apple/hivemind-plugin-private/.planning/archive/2026-05-07/CUSTOM-TOOLS-CRITERIA-2026-05-05.md</path>
<type>file</type>
<content>
1: # Custom Tools Design Criteria
2: 
3: **Document Version:** 1.0.0
4: **Date:** 2026-05-05
5: **Author:** hf-l2-prompter (L2 Prompt Engineering Specialist)
6: **Status:** ACTIVE — Reference standard for all custom tool design, audit, and development
7: **Scope:** Hivemind V3 harness (`src/tools/`) and any future custom tool development
8: 
9: ---
10: 
11: ## Purpose
12: 
13: This document defines the **correct design criteria** for custom tools in the Hivemind harness ecosystem. It serves as:
14: 
15: 1. **Design Standard** — What correct tool design looks like based on industry best practices
16: 2. **Validation Metrics** — Measurable criteria for auditing existing tools
17: 3. **Development Guide** — Practical guidance for building new tools
18: 4. **Anti-Pattern Catalog** — What to avoid (based on industry standards, not legacy codebase patterns)
19: 
20: > **IMPORTANT:** The existing codebase tools may contain patterns that deviate from these criteria. This document defines the **target state**, not the current state. Use it to guide refactoring and new development.
21: 
22: ---
23: 
24: ## Table of Contents
25: 
26: 1. [Tool Classification Matrix](#1-tool-classification-matrix)
27: 2. [Criterion 1: Discoverability](#2-criterion-1-discoverability)
28: 3. [Criterion 2: Deterministic Behavior](#3-criterion-2-deterministic-behavior)
29: 4. [Criterion 3: Composability](#4-criterion-3-composability)
30: 5. [Criterion 4: Granularity & Naming](#5-criterion-4-granularity--naming)
31: 6. [Criterion 5: Schema Validation](#6-criterion-5-schema-validation)
32: 7. [Criterion 6: Non-Conflict](#7-criterion-6-non-conflict)
33: 8. [Criterion 7: Ergonomics](#8-criterion-7-ergonomics)
34: 9. [Criterion 8: Purpose-Driven Design](#9-criterion-8-purpose-driven-design)
35: 10. [Criterion 9: Ecosystem Integration](#10-criterion-9-ecosystem-integration)
36: 11. [Criterion 10: Justified Existence](#11-criterion-10-justified-existence)
37: 12. [Validation Checklist](#12-validation-checklist)
38: 13. [References](#13-references)
39: 
40: ---
41: 
42: ## 1. Tool Classification Matrix
43: 
44: Custom tools MUST be classified into one of 8 categories. Classification determines naming conventions, scope boundaries, and integration patterns.
45: 
46: | Category | Purpose | Tool Prefix | Example Tools | Lineage |
47: |----------|---------|-------------|---------------|---------|
48: | **C1: Task Management & Coordination** | Delegation dispatch, status polling, hand-off, governance loops | `delegate-*`, `task-*` | `delegate-task`, `delegation-status` | hm-*, hf-* |
49: | **C2: Governance & State** | State updates, context governance, context purification, memory persistence | `state-*`, `context-*` | `session-patch`, `continuity-*` | hm-* |
50: | **C3: Inspection & Research** | Investigation, research-based analysis, knowledge synthesis | `inspect-*`, `research-*` | `prompt-skim`, `prompt-analyze`, `hivemind-doc` | hm-* |
51: | **C4: Code Intelligence** | AST analysis, signatures, symbols, type injections | `code-*`, `ast-*` | (future: `symbol-lookup`, `type-inject`) | hm-* |
52: | **C5: Planning & Artifacts** | Planning documents, doc-intelligence, hierarchical planning | `plan-*`, `doc-*` | `session-journal-export` | hm-* |
53: | **C6: Quality & Guardrails** | Audit, review, verification, compliance | `audit-*`, `verify-*` | `validate-restart` | hm-*, gate-* |
54: | **C7: Gate-Keeping & Integration** | Cross-domain evidence-based verification, integration checks | `gate-*`, `integrate-*` | (future: `evidence-check`, `integration-verify`) | gate-* |
55: | **C8: Lineage & Classification** | hm-*/hf-*/shared classification, routing | `lineage-*`, `classify-*` | (future: `lineage-classify`) | shared |
56: 
57: ### Classification Rules
58: 
59: 1. **Every tool MUST belong to exactly one category.** If a tool spans categories, split it into separate tools.
60: 2. **Category determines prefix.** Tools MUST use the prefix约定 for their category.
61: 3. **Lineage determines ownership.** hm-* tools serve product development; hf-* tools serve meta-builder workflows; gate-* tools serve quality assurance; shared tools serve all lineages.
62: 4. **Cross-category tools are anti-patterns.** A tool that manages state AND delegates work violates single-responsibility.
63: 
64: ---
65: 
66: ## 2. Criterion 1: Discoverability
67: 
68: ### Standard
69: 
70: Tools MUST be discoverable by agents without obfuscation in descriptions. An agent encountering a tool for the first time MUST understand its purpose, inputs, outputs, and side effects from the description alone.
71: 
72: ### Success Metrics
73: 
74: | Metric | Target | Validation Method |
75: |--------|--------|-------------------|
76: | **Description clarity** | Agent can predict tool behavior from description alone | Blind test: give description to agent, ask what tool does |
77: | **Parameter documentation** | 100% of args have `.describe()` with clear purpose | Code review: grep for missing `.describe()` calls |
78: | **Side-effect disclosure** | Description mentions if tool mutates state | Manual review of description text |
79: | **Example availability** | Complex tools (>3 args) include usage examples in description | Code review: check description length and content |
80: 
81: ### Guidelines
82: 
83: 1. **Description MUST answer:** What does this tool do? When should I use it? What does it return?
84: 2. **Description MUST NOT:** Be vague ("Handles tasks"), be overly technical ("Invokes SDK session.create with parentID resolution"), or omit side effects.
85: 3. **Parameter descriptions MUST:** State the purpose, expected format, and constraints.
86: 4. **Use imperative mood:** "Dispatch work to a specialist agent" not "This tool dispatches work..."
87: 
88: ### Anti-Patterns
89: 
90: | Anti-Pattern | Why It's Wrong | Correct Approach |
91: |--------------|----------------|------------------|
92: | **Vague descriptions** ("Manages sessions") | Agent cannot determine when to use tool | "Create, retrieve, or abort OpenCode sessions by ID" |
93: | **Missing parameter docs** | Agent guesses at input format | Every arg gets `.describe("Purpose, format, constraints")` |
94: | **Hidden side effects** | Agent doesn't know tool mutates state | "Persists delegation record to `.hivemind/state/delegations.json`" |
95: | **Technical jargon in descriptions** | Agent may not understand implementation details | Use domain language, not implementation language |
96: 
97: ---
98: 
99: ## 3. Criterion 2: Deterministic Behavior
100: 
101: ### Standard
102: 
103: Tools MUST be deterministic, condition-based, or event-driven. A tool with the same inputs MUST produce the same outputs (or predictable state transitions). Tools MUST be classified by their behavior model.
104: 
105: ### Behavior Models
106: 
107: | Model | Description | Example | State Impact |
108: |-------|-------------|---------|--------------|
109: | **Deterministic** | Same input → same output, no side effects | `prompt-skim` (analyze text, return metrics) | None |
110: | **Condition-based** | Output depends on current state, but transitions are predictable | `delegation-status` (returns current state of delegation) | Read-only |
111: | **Event-driven** | Triggered by lifecycle events, produces side effects | `delegate-task` (creates session, persists record) | Mutation |
112: | **State-mutating** | Explicitly changes persistent state | `session-patch` (modifies session files) | Mutation |
113: 
114: ### Success Metrics
115: 
116: | Metric | Target | Validation Method |
117: |--------|--------|-------------------|
118: | **Behavior classification** | Every tool has documented behavior model | Review tool metadata/frontmatter |
119: | **Idempotency (where applicable)** | Read-only tools return same result for same input | Unit test: call twice, compare outputs |
120: | **State transition documentation** | Mutation tools document before/after states | Review tool description and code |
121: | **Error determinism** | Same error conditions produce same error responses | Unit test: trigger error, verify response shape |
122: 
123: ### Guidelines
124: 
125: 1. **Document the behavior model** in tool description or frontmatter.
126: 2. **Read-only tools MUST be idempotent.** Calling `delegation-status` twice with same args returns same result.
127: 3. **Mutation tools MUST document state transitions.** "Before: delegation is `pending`. After: delegation is `dispatched`."
128: 4. **Event-driven tools MUST document triggers.** "Fires on: `session.idle`, `session.error`."
129: 
130: ### Anti-Patterns
131: 
132: | Anti-Pattern | Why It's Wrong | Correct Approach |
133: |--------------|----------------|------------------|
134: | **Undocumented side effects** | Agent doesn't know tool changes state | Document all state mutations in description |
135: | **Non-idempotent reads** | Calling read tool twice gives different results | Ensure read tools are pure functions of current state |
136: | **Hidden state dependencies** | Tool output depends on undocumented internal state | Document all state dependencies |
137: | **Race conditions** | Concurrent calls produce inconsistent results | Use keyed semaphore or document concurrency model |
138: 
139: ---
140: 
141: ## 4. Criterion 3: Composability
142: 
143: ### Standard
144: 
145: Tools MUST support composition via sub-tools, `$ARGUMENTS`, and plugin integration. Tools SHOULD be designed as building blocks that can be chained together.
146: 
147: ### Composition Patterns
148: 
149: | Pattern | Description | Example |
150: |---------|-------------|---------|
151: | **Sub-tool routing** | Single tool with action parameter routes to different behaviors | `run-background-command` with `action: "run" | "output" | "input" | "terminate"` |
152: | **Pipeline chaining** | Output of one tool feeds into next tool | `prompt-skim` → `prompt-analyze` → `session-patch` |
153: | **Plugin integration** | Tool can be extended or wrapped by plugins | Tool uses `ToolResponse<T>` envelope for uniform handling |
154: | **$ARGUMENTS support** | Tool accepts dynamic arguments from command parsing | Command invokes tool with parsed arguments |
155: 
156: ### Success Metrics
157: 
158: | Metric | Target | Validation Method |
159: |--------|--------|-------------------|
160: | **Action routing (where applicable)** | Multi-purpose tools use action enum | Code review: check for action parameter |
161: | **Pipeline compatibility** | Tools return structured data that downstream tools can consume | Integration test: chain tools |
162: | **Plugin extensibility** | Tool behavior can be modified via plugin hooks | Verify `tool.execute.before`/`after` hooks work |
163: | **Response envelope consistency** | All tools return `ToolResponse<T>` | Code review: grep for return types |
164: 
165: ### Guidelines
166: 
167: 1. **Multi-purpose tools MUST use action routing.** Single tool with `action` enum is preferred over multiple similar tools.
168: 2. **All tools MUST return `ToolResponse<T>` envelope.** This enables uniform error handling and pipeline chaining.
169: 3. **Tools SHOULD accept structured input** that can be produced by other tools.
170: 4. **Document composition patterns** in tool description: "Use after `prompt-skim` to analyze flagged issues."
171: 
172: ### Anti-Patterns
173: 
174: | Anti-Pattern | Why It's Wrong | Correct Approach |
175: |--------------|----------------|------------------|
176: | **Monolithic tools** | Single tool does too many things | Split into composable sub-tools |
177: | **Inconsistent return types** | Tools return different shapes, breaking pipelines | Use `ToolResponse<T>` envelope |
178: | **No action routing** | Multiple similar tools when one with actions would suffice | Use action enum for multi-purpose tools |
179: | **Tight coupling** | Tool only works with specific other tools | Design tools to accept generic input |
180: 
181: ---
182: 
183: ## 5. Criterion 4: Granularity & Naming
184: 
185: ### Standard
186: 
187: Tools MUST be granular with clear naming conventions. Tool names MUST be descriptive, follow kebab-case, and indicate the tool's category and purpose.
188: 
189: ### Naming Convention
190: 
191: ```
192: <category-prefix>-<action>-<object>
193: ```
194: 
195: | Component | Description | Examples |
196: |-----------|-------------|----------|
197: | **category-prefix** | Matches tool classification (C1-C8) | `delegate-`, `state-`, `inspect-`, `audit-` |
198: | **action** | Verb describing what tool does | `create-`, `get-`, `update-`, `delete-`, `export-`, `validate-` |
199: | **object** | Noun describing what tool operates on | `-task`, `-session`, `-delegation`, `-journal` |
200: 
201: ### Success Metrics
202: 
203: | Metric | Target | Validation Method |
204: |--------|--------|-------------------|
205: | **Kebab-case compliance** | 100% of tool names use kebab-case | Automated check: regex `^[a-z]+(-[a-z]+)*$` |
206: | **Category prefix compliance** | 100% of tools have correct category prefix | Manual review against classification matrix |
207: | **Name-action alignment** | Tool name accurately describes what it does | Blind test: read name, predict behavior |
208: | **LOC per tool** | ≤200 LOC per tool file (excluding tests) | Automated check: `wc -l` on tool files |
209: 
210: ### Guidelines
211: 
212: 1. **Tool name = filename.** OpenCode uses filename as tool name. Name the file correctly.
213: 2. **Use kebab-case exclusively.** No camelCase, no snake_case, no PascalCase.
214: 3. **Name MUST describe action + object.** `delegate-task` not `dt` or `delegationTool`.
215: 4. **Keep tools small.** If a tool exceeds 200 LOC, consider splitting into sub-tools.
216: 5. **Avoid generic names.** `manage-sessions` is too broad. `create-session`, `get-session`, `abort-session` are better.
217: 
218: ### Anti-Patterns
219: 
220: | Anti-Pattern | Why It's Wrong | Correct Approach |
221: |--------------|----------------|------------------|
222: | **Generic names** ("manage", "handle", "process") | Doesn't indicate specific purpose | Use specific verbs: "create", "get", "update", "delete" |
223: | **Abbreviations** ("del-task", "dlg-stat") | Reduces discoverability | Use full words: "delegate-task", "delegation-status" |
224: | **Inconsistent naming** | Some tools use prefixes, others don't | Follow the naming convention consistently |
225: | **Oversized tools** (>500 LOC) | Hard to test, hard to understand | Split into smaller, focused tools |
226: 
227: ---
228: 
229: ## 6. Criterion 5: Schema Validation
230: 
231: ### Standard
232: 
233: Tools MUST use Zod schemas for structured outputs and edge case handling. All tool arguments MUST be validated at the boundary. All tool responses MUST conform to documented schemas.
234: 
235: ### Schema Requirements
236: 
237: | Component | Requirement | Example |
238: |-----------|-------------|---------|
239: | **Input schema** | All args defined with Zod types | `args: { query: tool.schema.string().describe("...") }` |
240: | **Output schema** | Return type documented via `ToolResponse<T>` | `ToolResponse<{ count: number }>` |
241: | **Validation** | Input validated at boundary, not deep in code | `DelegateTaskInputSchema.parse(args)` at tool entry |
242: | **Error handling** | Validation errors return structured error response | `error("Invalid input: " + zodError.message)` |
243: 
244: ### Success Metrics
245: 
246: | Metric | Target | Validation Method |
247: |--------|--------|-------------------|
248: | **Zod schema coverage** | 100% of tool args have Zod schemas | Code review: check all `args` objects |
249: | **Boundary validation** | Validation happens at tool entry, not deep in code | Code review: check for `.parse()` calls |
250: | **Type safety** | No `any` types in tool signatures | TypeScript strict mode check |
251: | **Error response structure** | All errors return `ToolResponse` with kind: "error" | Code review: check error paths |
252: 
253: ### Guidelines
254: 
255: 1. **Define schemas at the boundary.** Validate input before any business logic.
256: 2. **Use `tool.schema` (Zod) for all arguments.** Never accept raw `any` or untyped input.
257: 3. **Return `ToolResponse<T>` for all outcomes.** Success, error, and pending states.
258: 4. **Document schema in description.** Agent needs to know expected input shape.
259: 5. **Use `.describe()` on every schema field.** This becomes the agent's documentation.
260: 
261: ### Anti-Patterns
262: 
263: | Anti-Pattern | Why It's Wrong | Correct Approach |
264: |--------------|----------------|------------------|
265: | **No input validation** | Invalid input causes runtime errors | Validate with Zod at boundary |
266: | **Raw string returns** | Agent can't parse structured results | Return `ToolResponse<T>` with typed data |
267: | **Deep validation** | Validation happens in business logic, not at entry | Validate at tool entry point |
268: | **Missing `.describe()`** | Agent doesn't know what field expects | Every field gets `.describe()` |
269: 
270: ---
271: 
272: ## 7. Criterion 6: Non-Conflict
273: 
274: ### Standard
275: 
276: Tools MUST NOT conflict with existing tools. Custom tools MUST NOT shadow built-in OpenCode tools unless explicitly intended and documented. Tool names MUST be unique within the harness.
277: 
278: ### Conflict Types
279: 
280: | Type | Description | Detection |
281: |------|-------------|-----------|
282: | **Name collision** | Custom tool has same name as built-in tool | Check against OpenCode built-in tool list |
283: | **Behavior overlap** | Custom tool does same thing as existing tool | Review existing tools before creating new one |
284: | **Side-effect conflict** | Two tools mutate same state in incompatible ways | Review state mutation paths |
285: | **Permission conflict** | Tool requires permissions that conflict with agent restrictions | Check agent permission model |
286: 
287: ### Success Metrics
288: 
289: | Metric | Target | Validation Method |
290: |--------|--------|-------------------|
291: | **Name uniqueness** | 0 name collisions with built-in tools | Automated check against tool registry |
292: | **Behavior uniqueness** | Each tool has distinct purpose | Manual review of tool descriptions |
293: | **State isolation** | Tools don't interfere with each other's state | Review state mutation paths |
294: | **Permission compliance** | Tools respect agent permission boundaries | Test with restricted agents |
295: 
296: ### Guidelines
297: 
298: 1. **Check existing tools before creating new ones.** Review `src/tools/` and OpenCode built-ins.
299: 2. **Document intentional overrides.** If a tool intentionally shadows a built-in, document why.
300: 3. **Use namespaced prefixes.** `hivemind-*` prefix for harness-specific tools.
301: 4. **Avoid state conflicts.** Each tool should own its state domain.
302: 
303: ### Anti-Patterns
304: 
305: | Anti-Pattern | Why It's Wrong | Correct Approach |
306: |--------------|----------------|------------------|
307: | **Shadowing built-ins without documentation** | Agent confusion about which tool is active | Document intentional overrides |
308: | **Duplicate functionality** | Two tools do the same thing | Consolidate into one tool |
309: | **Shared mutable state** | Tools interfere with each other | Use namespaced state or CQRS boundaries |
310: | **Permission escalation** | Tool bypasses agent restrictions | Respect permission model |
311: 
312: ---
313: 
314: ## 8. Criterion 7: Ergonomics
315: 
316: ### Standard
317: 
318: Tools MUST be easy to use with minimal required fields. Tools MUST be accessible mid-run without requiring session restart. Tool invocation SHOULD require the fewest possible arguments.
319: 
320: ### Ergonomic Principles
321: 
322: | Principle | Description | Example |
323: |-----------|-------------|---------|
324: | **Minimal required args** | Only essential fields are required; others have defaults | `delegate-task` requires `agent` and `prompt`; `title` is optional |
325: | **Sensible defaults** | Optional fields have reasonable defaults | `safetyCeilingMs` defaults to 300000 (5 min) |
326: | **Progressive disclosure** | Simple use case is simple; complex use case is possible | Basic: `delegate-task({ agent: "researcher", prompt: "..." })` |
327: | **Mid-run accessibility** | Tool can be invoked at any point in conversation | No session restart required |
328: 
329: ### Success Metrics
330: 
331: | Metric | Target | Validation Method |
332: |--------|--------|-------------------|
333: | **Required args count** | ≤3 required arguments per tool | Code review: count required fields |
334: | **Default coverage** | All optional fields have defaults | Code review: check for `.default()` or fallback logic |
335: | **Invocation simplicity** | Common use case requires minimal args | Agent test: invoke tool for common case |
336: | **Mid-run availability** | Tool works at any conversation point | Integration test: invoke mid-session |
337: 
338: ### Guidelines
339: 
340: 1. **Minimize required arguments.** If a field can have a default, make it optional.
341: 2. **Provide sensible defaults.** Defaults should work for the common case.
342: 3. **Support progressive disclosure.** Simple invocation for simple cases.
343: 4. **Document common patterns.** Show the simplest invocation first.
344: 
345: ### Anti-Patterns
346: 
347: | Anti-Pattern | Why It's Wrong | Correct Approach |
348: |--------------|----------------|------------------|
349: | **Too many required fields** | Increases cognitive load | Make fields optional with defaults |
350: | **No defaults** | Agent must specify everything | Provide sensible defaults |
351: | **Complex invocation** | Simple task requires complex args | Design for the common case first |
352: | **Session-dependent** | Tool only works at specific session points | Design for mid-run accessibility |
353: 
354: ---
355: 
356: ## 9. Criterion 8: Purpose-Driven Design
357: 
358: ### Standard
359: 
360: Tools MUST be well-designed for specific use cases with routing. Each tool MUST have a clear, singular purpose. Tools SHOULD route to appropriate handlers based on input.
361: 
362: ### Design Patterns
363: 
364: | Pattern | Description | Example |
365: |---------|-------------|---------|
366: | **Single Responsibility** | Each tool does one thing well | `delegate-task` only dispatches; `delegation-status` only polls |
367: | **Action Routing** | Multi-purpose tool routes to handlers | `run-background-command` routes by `action` field |
368: | **Category Gates** | Tools enforce category-specific rules | Category gates in delegation manager |
369: | **Error Routing** | Errors route to appropriate handlers | Validation errors → structured error response |
370: 
371: ### Success Metrics
372: 
373: | Metric | Target | Validation Method |
374: |--------|--------|-------------------|
375: | **Single responsibility** | Each tool has one clear purpose | Blind test: describe tool, get one-sentence purpose |
376: | **Action routing (where applicable)** | Multi-purpose tools use action enum | Code review: check for action parameter |
377: | **Error handling completeness** | All error paths return structured responses | Code review: check all throw/catch paths |
378: | **Purpose documentation** | Tool description states singular purpose | Review tool descriptions |
379: 
380: ### Guidelines
381: 
382: 1. **One tool, one purpose.** If you can't describe the tool's purpose in one sentence, split it.
383: 2. **Use action routing for multi-purpose tools.** Single tool with action enum is better than multiple similar tools.
384: 3. **Route errors appropriately.** Validation errors, runtime errors, and business errors should all be handled.
385: 4. **Document the purpose clearly.** "This tool dispatches work to a specialist agent via SDK child-session."
386: 
387: ### Anti-Patterns
388: 
389: | Anti-Pattern | Why It's Wrong | Correct Approach |
390: |--------------|----------------|------------------|
391: | **Kitchen sink tools** | Tool does too many things | Split into focused tools |
392: | **No error routing** | Errors are swallowed or generic | Route errors to appropriate handlers |
393: | **Unclear purpose** | Agent doesn't know when to use tool | Document singular purpose |
394: | **Mixed concerns** | Tool handles unrelated responsibilities | Separate concerns into different tools |
395: 
396: ---
397: 
398: ## 10. Criterion 9: Ecosystem Integration
399: 
400: ### Standard
401: 
402: Tools MUST integrate and harmonize with the broader ecosystem. Tools MUST respect CQRS boundaries, agent hierarchies, and state management patterns. Tools SHOULD leverage existing infrastructure (continuity, concurrency, lifecycle).
403: 
404: ### Integration Points
405: 
406: | Integration | Description | Requirement |
407: |-------------|-------------|-------------|
408: | **CQRS Boundaries** | Tools are write-side; hooks are read-side | Tools MAY mutate state; hooks MUST NOT |
409: | **Agent Hierarchy** | Tools respect front-facing vs. subagent boundaries | Tools document which agent types should use them |
410: | **State Management** | Tools use continuity.ts for persistence | Tools write to `.hivemind/state/` (Q6 canonical) |
411: | **Concurrency** | Tools use keyed semaphore for concurrent access | Tools document concurrency model |
412: | **Lifecycle** | Tools participate in session lifecycle | Tools document lifecycle hooks they use |
413: 
414: ### Success Metrics
415: 
416: | Metric | Target | Validation Method |
417: |--------|--------|-------------------|
418: | **CQRS compliance** | Tools don't violate write-side boundary | Code review: check for hook-side mutations |
419: | **State root compliance** | Tools write to `.hivemind/state/` | Code review: check file paths |
420: | **Concurrency safety** | Tools handle concurrent access correctly | Stress test: concurrent invocations |
421: | **Lifecycle participation** | Tools document lifecycle hooks | Review tool documentation |
422: 
423: ### Guidelines
424: 
425: 1. **Respect CQRS boundaries.** Tools are the only write-side mutation surface.
426: 2. **Use canonical state paths.** Write to `.hivemind/state/`, not `.opencode/state/`.
427: 3. **Leverage existing infrastructure.** Use `continuity.ts` for persistence, `concurrency.ts` for queuing.
428: 4. **Document integration points.** State which hooks, lifecycle events, and state modules the tool uses.
429: 
430: ### Anti-Patterns
431: 
432: | Anti-Pattern | Why It's Wrong | Correct Approach |
433: |--------------|----------------|------------------|
434: | **CQRS violations** | Hooks writing state breaks architecture | Tools write, hooks read |
435: | **Wrong state paths** | Writing to `.opencode/state/` (legacy) | Use `.hivemind/state/` (Q6 canonical) |
436: | **Duplicated infrastructure** | Tool reimplements persistence or concurrency | Use existing `continuity.ts`, `concurrency.ts` |
437: | **Undocumented integration** | Agent doesn't know tool's ecosystem dependencies | Document all integration points |
438: 
439: ---
440: 
441: ## 11. Criterion 10: Justified Existence
442: 
443: ### Standard
444: 
445: Custom tools MUST outperform innate/MCP tools to justify existence. A custom tool MUST provide clear value over using built-in tools or MCP servers. If a built-in tool or MCP server can do the job, don't create a custom tool.
446: 
447: ### Justification Criteria
448: 
449: | Criterion | Description | Example |
450: |-----------|-------------|---------|
451: | **Domain specificity** | Tool handles domain-specific logic that built-ins can't | `delegate-task` handles WaiterModel delegation (not in built-ins) |
452: | **State integration** | Tool integrates with harness state management | `delegation-status` reads from continuity store |
453: | **Pipeline integration** | Tool participates in tool pipelines | `prompt-skim` → `prompt-analyze` → `session-patch` |
454: | **Performance** | Tool is faster than equivalent built-in/MCP approach | Direct function call vs. external process |
455: | **Security** | Tool enforces harness-specific security rules | `validate-restart` checks primitive discoverability |
456: 
457: ### Success Metrics
458: 
459: | Metric | Target | Validation Method |
460: |--------|--------|-------------------|
461: | **Value justification** | Every custom tool has documented justification | Review tool documentation |
462: | **No built-in alternative** | No custom tool duplicates built-in functionality | Compare against OpenCode built-in tool list |
463: | **No MCP alternative** | No custom tool duplicates MCP server functionality | Compare against available MCP servers |
464: | **Performance parity** | Custom tool performs as well as or better than alternatives | Benchmark: custom vs. built-in/MCP |
465: 
466: ### Guidelines
467: 
468: 1. **Document why this tool exists.** "This tool exists because [built-in/MCP] cannot [specific capability]."
469: 2. **Check built-ins first.** OpenCode provides `read`, `write`, `bash`, `glob`, `grep`, `edit`, `todowrite`, `skill`.
470: 3. **Check MCP servers second.** MCP servers may provide the functionality you need.
471: 4. **Only create custom tools for harness-specific logic.** Delegation, state management, lifecycle integration.
472: 
473: ### Anti-Patterns
474: 
475: | Anti-Pattern | Why It's Wrong | Correct Approach |
476: |--------------|----------------|------------------|
477: | **Reimplementing built-ins** | Wasted effort, maintenance burden | Use built-in tools |
478: | **MCP duplication** | Custom tool does what MCP server already does | Use MCP server |
479: | **No justification** | Tool exists without clear value proposition | Document why tool exists |
480: | **Over-engineering** | Simple task gets complex custom tool | Use built-in tools for simple tasks |
481: 
482: ---
483: 
484: ## 12. Validation Checklist
485: 
486: Use this checklist to audit existing tools or validate new tool designs.
487: 
488: ### Pre-Development Checklist
489: 
490: - [ ] **Classification:** Tool classified into one of 8 categories (C1-C8)
491: - [ ] **Justification:** Documented why built-in/MCP tools are insufficient
492: - [ ] **Naming:** Tool name follows `<category-prefix>-<action>-<object>` convention
493: - [ ] **Scope:** Tool has single, clear purpose
494: - [ ] **Conflicts:** No name or behavior conflicts with existing tools
495: 
496: ### Design Checklist
497: 
498: - [ ] **Discoverability:** Description answers what, when, and what-it-returns
499: - [ ] **Behavior Model:** Documented as deterministic, condition-based, event-driven, or state-mutating
500: - [ ] **Schema:** All args have Zod schemas with `.describe()`
501: - [ ] **Defaults:** Optional fields have sensible defaults
502: - [ ] **Required Args:** ≤3 required arguments
503: - [ ] **Response Envelope:** Returns `ToolResponse<T>` for all outcomes
504: - [ ] **Composition:** Supports pipeline chaining or action routing
505: 
506: ### Implementation Checklist
507: 
508: - [ ] **Boundary Validation:** Input validated at tool entry with Zod `.parse()`
509: - [ ] **Error Handling:** All error paths return structured `ToolResponse` errors
510: - [ ] **CQRS Compliance:** Tool respects write-side boundary
511: - [ ] **State Compliance:** Writes to `.hivemind/state/` (Q6 canonical)
512: - [ ] **Concurrency Safety:** Handles concurrent access correctly
513: - [ ] **LOC Compliance:** ≤200 LOC per tool file (excluding tests)
514: - [ ] **No `any` Types:** TypeScript strict mode compliance
515: 
516: ### Documentation Checklist
517: 
518: - [ ] **Purpose:** One-sentence purpose statement
519: - [ ] **Behavior Model:** Documented behavior classification
520: - [ ] **Side Effects:** All state mutations documented
521: - [ ] **Integration Points:** Hooks, lifecycle events, state modules documented
522: - [ ] **Usage Examples:** Common invocation patterns documented
523: - [ ] **Error Cases:** Error conditions and responses documented
524: 
525: ### Post-Implementation Checklist
526: 
527: - [ ] **Unit Tests:** All code paths tested
528: - [ ] **Integration Tests:** Tool works in pipeline with other tools
529: - [ ] **Agent Test:** Agent can discover and use tool correctly
530: - [ ] **Performance:** Tool performs within acceptable limits
531: - [ ] **Documentation:** All documentation checklist items complete
532: 
533: ---
534: 
535: ## 13. References
536: 
537: ### On-Disk References
538: 
539: | Reference | Location | Purpose |
540: |-----------|----------|---------|
541: | Architecture | `.planning/codebase/ARCHITECTURE.md` | Project architecture overview |
542: | Session Context | `.hivemind/state/session-context-prompt.md` | Workflow state |
543: | Agent Hierarchy | `AGENTS.md` | Project rules and agent hierarchy |
544: | Tool Response | `src/shared/tool-response.ts` | Standard response envelope |
545: | Tool Implementations | `src/tools/` | Existing tool code |
546: 
547: ### External References
548: 
549: | Reference | URL | Purpose |
550: |-----------|-----|---------|
551: | OpenCode Custom Tools | https://opencode.ai/docs/custom-tools | Platform tool creation guide |
552: | OpenCode Plugins | https://opencode.ai/docs/plugins/ | Plugin system documentation |
553: | Zod Documentation | https://zod.dev/ | Schema validation library |
554: | OpenCode SDK | https://opencode.ai/docs/sdk | SDK documentation |
555: 
556: ### Architectural Decisions
557: 
558: | Decision | Description | Impact on Tools |
559: |----------|-------------|-----------------|
560: | **Q1** | Hybrid + Spec-Driven Automated Runtime Detection | Tools may integrate with runtime detection |
561: | **Q3** | Session Journal as Complement + Time-Machine | Tools should participate in journaling |
562: | **Q6** | `.hivemind/` is internal state root | Tools MUST write to `.hivemind/state/` |
563: 
564: ---
565: 
566: ## Appendix A: Tool Template
567: 
568: ```typescript
569: import { tool } from "@opencode-ai/plugin"
570: import { z } from "zod"
571: import { success, error, type ToolResponse } from "../shared/tool-response"
572: 
573: /**
574:  * [Tool Name] — [One-sentence purpose]
575:  *
576:  * @category [C1-C8]
577:  * @behavior [deterministic | condition-based | event-driven | state-mutating]
578:  * @lineage [hm-* | hf-* | gate-* | shared]
579:  * @side-effects [None | Lists all state mutations]
580:  */
581: export default tool({
582:   description: [
583:     "[What this tool does]",
584:     "[When to use this tool]",
585:     "[What it returns]",
586:     "[Side effects, if any]",
587:   ].join("\n"),
588: 
589:   args: {
590:     requiredArg: tool.schema
591:       .string()
592:       .describe("[Purpose, format, constraints]"),
593: 
594:     optionalArg: tool.schema
595:       .number()
596:       .optional()
597:       .default(100)
598:       .describe("[Purpose, format, default value]"),
599: 
600:     action: tool.schema
601:       .enum(["create", "get", "update", "delete"])
602:       .describe("[Action to perform]"),
603:   },
604: 
605:   async execute(args, context): Promise<ToolResponse> {
606:     // 1. Validate input at boundary
607:     // 2. Execute business logic
608:     // 3. Return ToolResponse
609:     return success("Operation completed", { result: "..." })
610:   },
611: })
612: ```
613: 
614: ---
615: 
616: ## Appendix B: Category-to-Tool Mapping (Existing Tools)
617: 
618: | Tool | Category | Behavior Model | Lineage |
619: |------|----------|----------------|---------|
620: | `delegate-task` | C1: Task Management | Event-driven | hm-* |
621: | `delegation-status` | C1: Task Management | Condition-based | hm-* |
622: | `run-background-command` | C1: Task Management | Event-driven | hm-* |
623: | `prompt-skim` | C3: Inspection | Deterministic | hm-* |
624: | `prompt-analyze` | C3: Inspection | Deterministic | hm-* |
625: | `session-patch` | C2: Governance | State-mutating | hm-* |
626: | `session-journal-export` | C5: Planning | Deterministic | hm-* |
627: | `configure-primitive` | C2: Governance | State-mutating | hf-* |
628: | `validate-restart` | C6: Quality | Deterministic | hf-* |
629: | `hivemind-doc` | C3: Inspection | Deterministic | hm-* |
630: | `hivemind-trajectory` | C5: Planning | Condition-based | hm-* |
631: | `hivemind-pressure` | C6: Quality | Condition-based | hm-* |
632: | `hivemind-sdk-supervisor` | C6: Quality | Condition-based | hm-* |
633: | `hivemind-command-engine` | C1: Task Management | Event-driven | hm-* |
634: | `hivemind-agent-work-create` | C1: Task Management | Event-driven | hm-* |
635: | `hivemind-agent-work-export` | C5: Planning | Deterministic | hm-* |
636: 
637: ---
638: 
639: *Document generated: 2026-05-05 by hf-l2-prompter*
640: *Next review: When new tools are added or existing tools are refactored*

(End of file - total 640 lines)
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


### Tool: task

**Input:**
```json
{
  "description": "Explore session-tracker structure",
  "subagent_type": "hm-l2-scout",
  "task_id": "ses_1be059a5fffeZ26SoACU7Rqo4j"
}
```

**Output:** (pruned)
```
task_id: ses_1be059a5fffeZ26SoACU7Rqo4j
```


### Tool: task

**Input:**
```json
{
  "description": "Investigate session-related tools",
  "subagent_type": "hm-l2-scout",
  "task_id": "ses_1be058dceffevsZVsKjXm4kMZ0"
}
```

**Output:** (pruned)
```
task_id: ses_1be058dceffevsZVsKjXm4kMZ0
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/ROADMAP.md"
}
```


## USER (turn 2)

**source:** real-human

skill hivemind-power-on references không đúng đâu

## USER (turn 3)

**source:** real-human

vì nó nó là thiết kế cũ và chứa thông tin hallucination

### Tool: task

**Input:**
```json
{
  "description": "Read hivemind-power-on references",
  "subagent_type": "hm-l2-scout",
  "task_id": "ses_1be041053ffe3OSX6HBlFgc1rR"
}
```

**Output:** (pruned)
```
task_id: ses_1be041053ffe3OSX6HBlFgc1rR
```


## USER (turn 4)

**source:** real-human

nó cũng là một đối tượng cần được viết lại

### Tool: task

**Input:**
```json
{
  "description": "Investigate session-tracker source code",
  "subagent_type": "hm-l2-scout",
  "task_id": "ses_1be040899fferujUr7cnb9n1VU"
}
```

**Output:** (pruned)
```
task_id: ses_1be040899fferujUr7cnb9n1VU
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
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/REQUIREMENTS.md"
}
```


### Tool: sequential-thinking_sequentialthinking

**Input:**
```json
{
  "callID": "call_00_eyE2wnIcQmuVZRYN0kkb3585"
}
```


### Tool: sequential-thinking_sequentialthinking

**Input:**
```json
{
  "callID": "call_00_K1807RKRyN0gPtjXrmmw1163"
}
```


### Tool: sequential-thinking_sequentialthinking

**Input:**
```json
{
  "callID": "call_00_lkyO0SviPtKKGVhcCn6C2063"
}
```


## USER (turn 5)

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
Arguments: hãy dùng GSD routing đẻ tạo phase - thêm vào đó các mục mà còn liên quan tới `event-tracker` (cả code part và full code filles nếu cần  thì remove do deprecated  còn tools thì chỉnh lại để dùng event-tracker và đưa tất cả phần trên vào STATE và ROADMAP) - sau slash command này hãy chạy execute-slash-command để tự route qua gsd-spec-phase và sử dụng @.opencode/command/gsd-spec-phase.md rồi sau đó mới tạo context tất cả đều task tool delegate tới gsd agents không sử dụng hm /Users/apple/hivemind-plugin-private/.opencode/agents/gsd-advisor-researcher.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-ai-researcher.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-assumptions-analyzer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-code-fixer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-code-reviewer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-codebase-mapper.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-debug-session-manager.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-debugger.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-doc-classifier.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-doc-synthesizer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-doc-verifier.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-doc-writer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-domain-researcher.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-eval-auditor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-eval-planner.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-executor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-framework-selector.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-integration-checker.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-intel-updater.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-nyquist-auditor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-pattern-mapper.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-phase-researcher.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-plan-checker.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-planner.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-project-researcher.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-research-synthesizer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-roadmapper.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-security-auditor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-ui-auditor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-ui-checker.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-ui-researcher.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-user-profiler.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-verifier.md 

Parse the first token of hãy dùng GSD routing đẻ tạo phase - thêm vào đó các mục mà còn liên quan tới `event-tracker` (cả code part và full code filles nếu cần  thì remove do deprecated  còn tools thì chỉnh lại để dùng event-tracker và đưa tất cả phần trên vào STATE và ROADMAP) - sau slash command này hãy chạy execute-slash-command để tự route qua gsd-spec-phase và sử dụng @.opencode/command/gsd-spec-phase.md rồi sau đó mới tạo context tất cả đều task tool delegate tới gsd agents không sử dụng hm /Users/apple/hivemind-plugin-private/.opencode/agents/gsd-advisor-researcher.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-ai-researcher.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-assumptions-analyzer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-code-fixer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-code-reviewer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-codebase-mapper.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-debug-session-manager.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-debugger.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-doc-classifier.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-doc-synthesizer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-doc-verifier.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-doc-writer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-domain-researcher.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-eval-auditor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-eval-planner.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-executor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-framework-selector.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-integration-checker.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-intel-updater.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-nyquist-auditor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-pattern-mapper.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-phase-researcher.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-plan-checker.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-planner.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-project-researcher.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-research-synthesizer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-roadmapper.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-security-auditor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-ui-auditor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-ui-checker.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-ui-researcher.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-user-profiler.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-verifier.md :
- If it is `--insert`: strip the flag, pass remainder (format: <after-phase-number> <description>) to insert-phase workflow
- If it is `--remove`: strip the flag, pass remainder (phase number) to remove-phase workflow
- If it is `--edit`: strip the flag, pass remainder (phase-number [--force]) to edit-phase workflow
- Otherwise: pass all of hãy dùng GSD routing đẻ tạo phase - thêm vào đó các mục mà còn liên quan tới `event-tracker` (cả code part và full code filles nếu cần  thì remove do deprecated  còn tools thì chỉnh lại để dùng event-tracker và đưa tất cả phần trên vào STATE và ROADMAP) - sau slash command này hãy chạy execute-slash-command để tự route qua gsd-spec-phase và sử dụng @.opencode/command/gsd-spec-phase.md rồi sau đó mới tạo context tất cả đều task tool delegate tới gsd agents không sử dụng hm /Users/apple/hivemind-plugin-private/.opencode/agents/gsd-advisor-researcher.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-ai-researcher.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-assumptions-analyzer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-code-fixer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-code-reviewer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-codebase-mapper.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-debug-session-manager.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-debugger.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-doc-classifier.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-doc-synthesizer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-doc-verifier.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-doc-writer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-domain-researcher.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-eval-auditor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-eval-planner.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-executor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-framework-selector.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-integration-checker.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-intel-updater.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-nyquist-auditor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-pattern-mapper.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-phase-researcher.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-plan-checker.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-planner.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-project-researcher.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-research-synthesizer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-roadmapper.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-security-auditor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-ui-auditor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-ui-checker.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-ui-researcher.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-user-profiler.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-verifier.md  (phase description) to add-phase workflow

Roadmap and state are resolved in-workflow via `init phase-op` and targeted reads.
</context>

<process>
1. Parse the leading flag (if any) from hãy dùng GSD routing đẻ tạo phase - thêm vào đó các mục mà còn liên quan tới `event-tracker` (cả code part và full code filles nếu cần  thì remove do deprecated  còn tools thì chỉnh lại để dùng event-tracker và đưa tất cả phần trên vào STATE và ROADMAP) - sau slash command này hãy chạy execute-slash-command để tự route qua gsd-spec-phase và sử dụng @.opencode/command/gsd-spec-phase.md rồi sau đó mới tạo context tất cả đều task tool delegate tới gsd agents không sử dụng hm /Users/apple/hivemind-plugin-private/.opencode/agents/gsd-advisor-researcher.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-ai-researcher.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-assumptions-analyzer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-code-fixer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-code-reviewer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-codebase-mapper.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-debug-session-manager.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-debugger.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-doc-classifier.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-doc-synthesizer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-doc-verifier.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-doc-writer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-domain-researcher.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-eval-auditor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-eval-planner.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-executor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-framework-selector.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-integration-checker.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-intel-updater.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-nyquist-auditor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-pattern-mapper.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-phase-researcher.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-plan-checker.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-planner.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-project-researcher.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-research-synthesizer.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-roadmapper.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-security-auditor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-ui-auditor.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-ui-checker.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-ui-researcher.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-user-profiler.md
/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-verifier.md .
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
Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/command/gsd-spec-phase.md"}
<path>/Users/apple/hivemind-plugin-private/.opencode/command/gsd-spec-phase.md</path>
<type>file</type>
<content>
1: ---
2: description: Clarify WHAT a phase delivers with ambiguity scoring; produces a SPEC.md before discuss-phase.
3: argument-hint: "<phase> [--auto] [--text]"
4: tools:
5:   read: true
6:   write: true
7:   bash: true
8:   glob: true
9:   grep: true
10:   question: true
11: ---
12: 
13: <objective>
14: Clarify phase requirements through structured Socratic questioning with quantitative ambiguity scoring.
15: 
16: **Position in workflow:** `spec-phase → discuss-phase → plan-phase → execute-phase → verify`
17: 
18: **How it works:**
19: 1. Load phase context (PROJECT.md, REQUIREMENTS.md, ROADMAP.md, STATE.md)
20: 2. Scout the codebase — understand current state before asking questions
21: 3. Run Socratic interview loop (up to 6 rounds, rotating perspectives)
22: 4. Score ambiguity across 4 weighted dimensions after each round
23: 5. Gate: ambiguity ≤ 0.20 AND all dimensions meet minimums → write SPEC.md
24: 6. Commit SPEC.md — discuss-phase picks it up automatically on next run
25: 
26: **Output:** `{phase_dir}/{padded_phase}-SPEC.md` — falsifiable requirements that lock "what/why" before discuss-phase handles "how"
27: </objective>
28: 
29: <execution_context>
30: @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/spec-phase.md
31: @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/spec.md
32: </execution_context>
33: 
34: <runtime_note>
35: **Copilot (VS Code):** Use `vscode_askquestions` wherever this workflow calls `question`. They are equivalent.
36: </runtime_note>
37: 
38: <context>
39: Phase number: $ARGUMENTS (required)
40: 
41: **Flags:**
42: - `--auto` — Skip interactive questions; the agent selects recommended defaults and writes SPEC.md
43: - `--text` — Use plain-text numbered lists instead of TUI menus (required for `/rc` remote sessions)
44: 
45: Context files are resolved in-workflow using `init phase-op`.
46: </context>
47: 
48: <process>
49: Execute end-to-end.
50: 
51: **MANDATORY:** Read the workflow file BEFORE taking any action. The workflow contains the complete step-by-step process including the Socratic interview loop, ambiguity scoring gate, and SPEC.md generation. Do not improvise from the objective summary above.
52: </process>
53: 
54: <success_criteria>
55: - Codebase scouted for current state before questioning begins
56: - All 4 ambiguity dimensions scored after each interview round
57: - Gate passed: ambiguity ≤ 0.20 AND all dimension minimums met
58: - SPEC.md written with falsifiable requirements, explicit boundaries, and acceptance criteria
59: - SPEC.md committed atomically
60: - User knows they can now run /gsd-discuss-phase which will load SPEC.md automatically
61: </success_criteria>

(End of file - total 61 lines)
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
Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/command/gsd-spec-phase.md"}
<path>/Users/apple/hivemind-plugin-private/.opencode/command/gsd-spec-phase.md</path>
<type>file</type>
<content>
1: ---
2: description: Clarify WHAT a phase delivers with ambiguity scoring; produces a SPEC.md before discuss-phase.
3: argument-hint: "<phase> [--auto] [--text]"
4: tools:
5:   read: true
6:   write: true
7:   bash: true
8:   glob: true
9:   grep: true
10:   question: true
11: ---
12: 
13: <objective>
14: Clarify phase requirements through structured Socratic questioning with quantitative ambiguity scoring.
15: 
16: **Position in workflow:** `spec-phase → discuss-phase → plan-phase → execute-phase → verify`
17: 
18: **How it works:**
19: 1. Load phase context (PROJECT.md, REQUIREMENTS.md, ROADMAP.md, STATE.md)
20: 2. Scout the codebase — understand current state before asking questions
21: 3. Run Socratic interview loop (up to 6 rounds, rotating perspectives)
22: 4. Score ambiguity across 4 weighted dimensions after each round
23: 5. Gate: ambiguity ≤ 0.20 AND all dimensions meet minimums → write SPEC.md
24: 6. Commit SPEC.md — discuss-phase picks it up automatically on next run
25: 
26: **Output:** `{phase_dir}/{padded_phase}-SPEC.md` — falsifiable requirements that lock "what/why" before discuss-phase handles "how"
27: </objective>
28: 
29: <execution_context>
30: @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/spec-phase.md
31: @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/spec.md
32: </execution_context>
33: 
34: <runtime_note>
35: **Copilot (VS Code):** Use `vscode_askquestions` wherever this workflow calls `question`. They are equivalent.
36: </runtime_note>
37: 
38: <context>
39: Phase number: $ARGUMENTS (required)
40: 
41: **Flags:**
42: - `--auto` — Skip interactive questions; the agent selects recommended defaults and writes SPEC.md
43: - `--text` — Use plain-text numbered lists instead of TUI menus (required for `/rc` remote sessions)
44: 
45: Context files are resolved in-workflow using `init phase-op`.
46: </context>
47: 
48: <process>
49: Execute end-to-end.
50: 
51: **MANDATORY:** Read the workflow file BEFORE taking any action. The workflow contains the complete step-by-step process including the Socratic interview loop, ambiguity scoring gate, and SPEC.md generation. Do not improvise from the objective summary above.
52: </process>
53: 
54: <success_criteria>
55: - Codebase scouted for current state before questioning begins
56: - All 4 ambiguity dimensions scored after each interview round
57: - Gate passed: ambiguity ≤ 0.20 AND all dimension minimums met
58: - SPEC.md written with falsifiable requirements, explicit boundaries, and acceptance criteria
59: - SPEC.md committed atomically
60: - User knows they can now run /gsd-discuss-phase which will load SPEC.md automatically
61: </success_criteria>

(End of file - total 61 lines)
</content>

### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_8jzhh3XAZiQr6UgR9gCd8449"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_xrPGFneL7vkaiiTFEAaI6387"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_Y3s1lNEFXSu005eQGr9g6139"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_AccNImkdaVrT4RUZ7e823091"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_WLuoyBC5PVhmXrVx5oOH4848"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_S2fMXz6Vyk7fsbcD2wK24949"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/spec-phase.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/spec.md"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_B1JQJklDpP7lHnIXLCoA6384"
}
```


### Tool: execute-slash-command

**Input:**
```json
{
  "callID": "call_01_IArlT1zdRBLVwW6H4pJl4283"
}
```


## USER (turn 6)

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
Phase number: 16 --auto (required)

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
  "callID": "call_00_JXwtj41XyWAIbvgkqDGp6336"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_PK4WWfwDOaVlmnKkIU3e7369"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_01_Ee0T77fJyyLbxu6RDbrN8335"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_oCPBEcaGy5LOgP9JUDcw0282"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_lBV6pCczNLcgk2yvyJHR2254"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/REQUIREMENTS.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/STATE.md"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_GgIr3pbtD2UEkXWHHvts0104"
}
```


### Tool: write

**Input:**
```json
{
  "callID": "call_00_04SwtR4cSVdH6PR7mvHO3449"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_iaHjGad7ZkcZ62n15f637260"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_6t01L6G0ue9UozOWXLjU6757"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_01_sMK5UxfPa8vBSebgU13U2546"
}
```


## USER (turn 7)

**source:** real-human

<objective>
Extract implementation decisions that downstream agents need — researcher and planner will use CONTEXT.md to know what to investigate and what choices are locked.

**How it works:**
1. Load prior context (PROJECT.md, REQUIREMENTS.md, STATE.md, prior CONTEXT.md files)
2. Scout codebase for reusable assets and patterns
3. Analyze phase — skip gray areas already decided in prior phases
4. Present remaining gray areas — user selects which to discuss
5. Deep-dive each selected area until satisfied
6. Create CONTEXT.md with decisions that guide research and planning

**Output:** `{phase_num}-CONTEXT.md` — decisions clear enough that downstream agents can act without asking the user again
</objective>

<execution_context>
Workflow files are loaded on-demand in the <process> section below — not upfront.
Do not pre-load any workflow files before reading the mode routing instructions.
</execution_context>

<runtime_note>
**Copilot (VS Code):** Use `vscode_askquestions` wherever this workflow calls `question`. They are equivalent — `vscode_askquestions` is the VS Code Copilot implementation of the same interactive question API.
</runtime_note>

<context>
Phase number: 16  (required)

Context files are resolved in-workflow using `init phase-op` and roadmap/state tool calls.
</context>

<process>
**Mode routing:**
```bash
DISCUSS_MODE=$(gsd-sdk query config-get workflow.discuss_mode 2>/dev/null || echo "discuss")
```

If `--assumptions` is in 16 :
Read and execute `/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/list-phase-assumptions.md` end-to-end.
Stop here.

Otherwise, if `DISCUSS_MODE` is `"assumptions"`:
Read and execute `/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase-assumptions.md` end-to-end.

Otherwise (`"discuss"` / unset / any other value):
Read and execute `/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase.md` end-to-end.

**MANDATORY:** Read the appropriate workflow file BEFORE taking any action. The objective and success_criteria sections in this command file are summaries — the workflow file contains the complete step-by-step process with all required behaviors, config checks, and interaction patterns. Do not improvise from the summary.

**Lazy loading:** `templates/context.md` is loaded inside the `write_context` step of the active workflow. `discuss-phase-power.md` is loaded inside `discuss-phase.md` when `--power` is detected. Do not load either here.
</process>

<success_criteria>
- Prior context loaded and applied (no re-asking decided questions)
- Gray areas identified through intelligent analysis
- User chose which areas to discuss
- Each selected area explored until satisfied
- Scope creep redirected to deferred ideas
- CONTEXT.md captures decisions, not vague vision
- User knows next steps
</success_criteria>

### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase.md"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_jA7CmaTjqcxY3tPREVGI2070"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_ZYbxhTtEstZTLlEynUgD3424"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_eTWOqrO2pdRvaNouUc4J1919"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/scout-codebase.md"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_LEG8UDndcbaPJgPy0vZP7819"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/16-session-tracker-tool-intelligence-event-tracker-deprecation-/16-SPEC.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/codebase/STACK.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/codebase/CONVENTIONS.md"
}
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_7h0qDKuuAb6G5fVCVOUR7418"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase/modes/default.md"
}
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_3xnQN3f2iMqAqrqWcCUB8859"
}
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_M0Gwbr2arB3Xqb1fSCnl0891"
}
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_Kba6UexzOjSHBlf5B6C88022"
}
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_1UEP7NirXQlj9yZCIVeD3762"
}
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_Zddbsi9pmBHtex3PRHLZ7272"
}
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_B3qtLXbF1fDeB7t504HK6688"
}
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_j37ewcw9tJTOQy8muDsz2925"
}
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_JxsspaZTtQlxMTO2xuAc3273"
}
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_vd5RIbGqFfFzt3QrJ2aH9603"
}
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_ncP0LzA2mnUyPhGASgn35729"
}
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_agfX8aLnh1H8tKAmoxy83740"
}
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_kZWd8iTfe08l0IQveWwR3545"
}
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_7fyoRdR2ZyEFCco5nYSH2564"
}
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_OzQN4sVepvCxYRAuRZ3X1024"
}
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_ET_dXcI5zeHE4cwfEXkBVE69476"
}
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_M2bLSGWJYTWIIKQUelvh2414"
}
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_4t87KyvB9GfPvQy9MROT3829"
}
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_qJv8SM6WLk84clM2IdEo6823"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_djp311OdrhPuRsIR3kGd3990"
}
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_Mu2suH7aCisxWpfOxCr71520"
}
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_n2mwrLhKXLMmeWBqPRif7430"
}
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_GMYDN2ks0JBTLY26Ih8j7832"
}
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_ydlKcZ2NHOqraEdGDuDv9654"
}
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_iPE6E7m1LX9getUhcci45219"
}
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_kSxEu2hukAKLmuPyoKJx9545"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase/templates/context.md"
}
```


### Tool: write

**Input:**
```json
{
  "callID": "call_00_609tDRF4IuDxq1lZajsH6717"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase/templates/discussion-log.md"
}
```


### Tool: write

**Input:**
```json
{
  "callID": "call_00_lEY9wPSMZMqwJYdHryGK4442"
}
```


## USER (turn 8)

**source:** real-human

sau đó bạn hãy route cho @gsd-phase-researcher để bắt đầu research bắt buộc dùng các mcp tools như context7, deepwiki, exa, repomix etc
 Use the above message and context to generate a prompt and call the task tool with subagent: gsd-phase-researcher

### Tool: bash

**Input:**
```json
{
  "callID": "call_00_GjV5xdnHqB9sgBF9XjkQ5628"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_2o6NSh2ogIjrJDZKtxGO4663"
}
```


### Tool: task

**Input:**
```json
{
  "description": "Research Phase 16 tools & patterns",
  "subagent_type": "gsd-phase-researcher",
  "task_id": "ses_1bde88b05ffemTW9e3KIQ16JlL"
}
```

**Output:** (pruned)
```
task_id: ses_1bde88b05ffemTW9e3KIQ16JlL
```

