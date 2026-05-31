---
sessionID: ses_182154c48fferRI5ZwyUifuhor
created: 2026-05-31T12:03:14.131Z
updated: 2026-05-31T12:05:00.427Z
parentSessionID: null
delegationDepth: 0
children: []
continuityIndex: session-continuity.json
status: completed
title: null
lastMessage: >-
  That's a critical insight — you're describing the **visibility gap** in
  current delegation. The orchestrator has context, but you as the human are
  flying blind. You can't see which subagent is stuck, which one is making
  progress, or which one you want to intervene in.


  So the Tmux vision is: **the human becomes a co-pilot, not just a passenger.**


  Let me sharpen this:


  **When you say "intercept" — what does that look like to you?**


  For example:

  - You see a subagent's Tmux pane outputting something wrong, and you want to
  **send it a new instruction** mid-execution?

  - You want to **pause** a session, inspect its state, then **resume** or
  **redirect** it?

  - Or you want to **kill** a stuck session and **reroute** its work to a
  different subagent?


  *(This matters because each of these implies different Tmux capabilities —
  sending keystrokes to a pane is different from capturing and replaying session
  state.)*
---

## USER (turn 1)

**source:** real-human

Route to the appropriate exploration / capture skill based on the user's intent.
`hm-note`, `hm-add-todo`, `hm-add-backlog`, and `hm-plant-seed` were folded
into `hm-capture` (with `--note`, default, `--backlog`, `--seed` modes) by
#2790. The capture target lists pending todos via `--list`.

| User wants | Invoke |
|---|---|
| Explore an idea or opportunity | hm-explore |
| Sketch out a rough design or plan | hm-sketch |
| Time-boxed technical spike | hm-spike |
| Write a spec for a phase | hm-spec-phase |
| Capture a thought (todo / note / backlog / seed) | hm-capture |

Invoke the matched skill directly using the Skill tool.

this is going to be an intensive research base on this @repo-for-learning-and-synthesis.md  the current coordination, delagation features, custom-dlegate task and to fulfil and integrate the very underdeveloped feature "background-command" "interactive bash command" and the very nowadays subagents, delegation and orchestration logics utilizing Tmux which you can find in nowadays famous Tmux utilization as found in OMO repo tmux, Hermes and OpenClaw (outside sources please research) - tell me what can we utilize Tmux into our Hivemind and the OpenCode runtime and development process in knowing of our @docs/philosophy/HIVEMIND-PHILOSOPHY.md and the effort we are trying to surpass OMO in terms of more collaborative, intelligent and self-sustained orchestration of mutiple persistant sub tasks with context utilizing the system of our hm-* agents, commands, skills, workflwos, governance, inheriting permissions, tools and custom tools, mcp server tools and others  of the OpenCode primitives - we used to plan for such but it is some past research that I am unable to find
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
Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/docs/philosophy/HIVEMIND-PHILOSOPHY.md"}
<path>/Users/apple/hivemind-plugin-private/docs/philosophy/HIVEMIND-PHILOSOPHY.md</path>
<type>file</type>
<content>
1: # HIVEMIND PHILOSOPHY: Agents' Intelligence = HIVE + MIND
2: 
3: **Document Version**: 1.0
4: **Date**: 2026-04-10
5: **Status**: Publication-Ready
6: **Audience**: Business stakeholders, senior engineers, technical product managers
7: 
8: ---
9: 
10: ## Executive Summary
11: 
12: HiveMind is a runtime composition engine that makes agents genuinely intelligent — not through more tokens, not through bigger models, but through **architecture**. Specifically, through the marriage of two forces: the **HIVE** and the **MIND**.
13: 
14: The HIVE is structure. It is the systematic file trees, the hierarchical dependencies, the domain boundaries, the delegation protocols, and the guardrails that keep agents from wandering off into hallucinated wildernesses. The HIVE is how multiple agents collaborate without colliding, how work flows up and down a chain of command without breaking, how every task decomposes into bite-sized pieces small enough to verify and small enough to trust.
15: 
16: The MIND is memory. It is the accumulated intelligence of every session, every decision, every successful experiment and every failed one. Where other agentic systems reset to zero every time a new session starts, HiveMind remembers. The MIND is not a dump of conversation history — it is a living, organized knowledge system where Micro-Electro-Mechanical knowledge Pieces (MEMS) are collected, organized, and retrieved as synthesized understanding when needed.
17: 
18: Together, HIVE + MIND = Intelligence that compounds over time.
19: 
20: HiveMind is not a framework you must conform to. It is not a rigid methodology demanding specific procedures or toolchains. It is an **open architecture** — a runtime composition engine that can host GSD-style phase-gated workflows, BMAD-style constraints, or OMO-style autonomous agents, depending on what your project needs. It meets you where you are and grows with you.
21: 
22: This philosophy document explains why HiveMind exists, what it believes, how it works, and — equally important — what it is not.
23: 
24: ---
25: 
26: ## 1. The Core Thesis: Intelligence Through Architecture
27: 
28: ### The Problem With Today's Agentic Systems
29: 
30: Modern AI coding assistants are powerful but **memoryless**. Each session starts from scratch. The model may have seen millions of codebases in training, but it has never worked with *your* codebase before. It does not know which architectural decisions your team made last quarter, which conventions you established, which patterns failed in production, or which decisions are sacred contracts that should not be broken.
31: 
32: This memorylessness creates a fundamental inefficiency: agents repeat mistakes. They miss context that humans spent weeks establishing. They propose solutions that conflict with earlier decisions because they cannot see those decisions. The result is agents that are individually brilliant but collectively naive.
33: 
34: ### The HiveMind Thesis
35: 
36: HiveMind's core thesis is that **agent intelligence is not a property of the model — it is a property of the architecture surrounding the model**.
37: 
38: A single agent, no matter how capable, cannot hold the full context of a complex project across sessions. But a **hierarchy of agents**, each with defined domain boundaries and shared access to accumulated memory, can build on previous work rather than starting over. Intelligence emerges from collaboration and continuity, not from any single agent's raw capability.
39: 
40: This is what we mean by **HIVE + MIND**:
41: 
42: - **The HIVE** is the structural architecture — the hierarchy, the domains, the delegation protocols, the guardrails. It ensures agents work on the right things, report to the right supervisors, and never step outside their authorized boundaries.
43: 
44: - **The MIND** is the accumulated intelligence — the memory of past sessions, the pattern library, the decision anchors. It ensures agents do not repeat mistakes, can retrieve relevant context from previous work, and grow more capable over time.
45: 
46: Intelligence, in this framework, is not an input to the system. It is an **output** of the architecture.
47: 
48: ### Why Hierarchy Matters
49: 
50: Hierarchy is not bureaucracy. Hierarchy is **safety through dependency ordering**.
51: 
52: Consider: in a correct dependency tree, a child module cannot exist before its parent. A feature cannot be implemented before its interface is defined. A test cannot pass before the code it tests exists. These are not arbitrary rules — they reflect the natural structure of complex systems.
53: 
54: HiveMind's **Hierarchical Superiority** pillar enforces this structure in agent workflows. Before an agent implements anything, it must verify that all dependencies are satisfied. Before a subagent can act, its parent agent must authorize the delegation. This creates a chain of custody and a chain of comprehension: every decision is made at the right level, by the right agent, with the right context.
55: 
56: For non-technical readers: imagine a construction project where every worker knew not just their own task, but why their task depends on the previous worker's task. The foundation must come before the walls. The walls before the roof. Agents operating in a hierarchy understand this instinctively — not because they were told to follow rules, but because the architecture makes correct behavior the path of least resistance.
57: 
58: For technical readers: HiveMind implements this through a CQRS pattern where tools are the write-side (state mutation) and hooks are the read-side (context injection). The plugin assembly wires them together with zero business logic, ensuring the architecture itself enforces boundaries rather than relying on agent goodwill.
59: 
60: ### Why Local-Side-Safe Infrastructure Matters
61: 
62: The most dangerous moment in an agentic workflow is when an agent operates without visibility into system state — when it makes assumptions about the environment that may no longer be true, or when it proposes changes that conflict with changes made by another agent in parallel.
63: 
64: HiveMind's infrastructure is designed to be **local-side-safe**: agents can inspect their own state, the state of their tasks, and the trajectory of their delegation chain at any time. They do not need to guess. They can verify.
65: 
66: This is implemented through a dual-layer continuity model: durable JSON persistence for long-term state (the MIND's memory) and in-memory Maps for session-specific state (the HIVE's working memory). When an agent resumes after an interruption, it reconstructs its context from the continuity store, not from fragile conversation history.
67: 
68: ---
69: 
70: ## 2. The Two Halves of HiveMind
71: 
72: HiveMind is architecturally divided into two halves that must never be confused, because they serve fundamentally different purposes.
73: 
74: ### Half 1: The Hard Harness (Runtime Composition Engine)
75: 
76: The Hard Harness is the **engine** — the npm package (`opencode-hivemind`) that provides the runtime primitives agents actually execute. It is distributed as a standard Node.js package, versioned, tested, and installed like any other dependency.
77: 
78: The Hard Harness contains:
79: 
80: **Tools (Write-Side, CQRS)**: Five core tools with Zod schemas that mutate state. These are the only mechanisms that can change system state — creating tasks, delegating work, recording trajectory, updating continuity. Every tool call is validated, typed, and logged. There is no implicit state mutation, no side-channel writes, no shadow state competing with the runtime truth.
81: 
82: **Hooks (Read-Side, CQRS)**: Event observers that inject context but never mutate state. These watch for session start, tool execution, delegation events, and task completion — and enrich the agent's context accordingly. Hooks are how the MIND becomes visible to agents: by observing events and recording them in the continuity store, hooks make past sessions retrievable by future sessions.
83: 
84: **Plugin (Assembly)**: A thin composition root (~57 LOC target, currently ~447 LOC) that wires tools and hooks into OpenCode. It contains zero business logic. Its only job is assembly — connecting the write-side tools to their handlers, the read-side hooks to their event sources, and the shared utilities to both.
85: 
86: **Shared (Leaf Module)**: Pure utilities with no dependencies. Types, helpers, concurrency primitives, error definitions. The leaf is where the buck stops — no circular imports, no upward dependencies, no mystery.
87: 
88: ### Half 2: The Soft Meta-Concepts (User-Configurable)
89: 
90: The Soft Meta-Concepts are the **mind** — the instructions, definitions, and behavioral patterns that tell agents how to use the Hard Harness. They live in the project's `.opencode/` directory and are version-controlled alongside the codebase, not in an external package.
91: 
92: The Soft Meta-Concepts include:
93: 
94: **Skills** (SKILL.md + scripts): Portable instruction packages that teach agents how to approach specific task types. Skills are the primary way users extend HiveMind's capabilities. A skill might teach an agent how to run a GSD-style phase loop, how to perform deep research using Tavily, or how to validate a spec against implementation. Skills are not code — they are knowledge transfer in document form.
95: 
96: **Agents**: OpenCode agent definitions with permission profiles. Each agent has a defined role (architect, planner, builder, debugger, reviewer), a temperature setting, tool access permissions, and a system prompt that encodes its responsibilities. Agents are not magic — they are configurations with names.
97: 
98: **Commands**: Reusable command bundles with YAML frontmatter. Commands are CLI-style entry points that invoke specific workflows — `start-work`, `deep-research`, `plan`, `ultrawork`. They encapsulate common task patterns so agents (and humans) do not have to reconstruct them from scratch each time.
99: 
100: **Rules**: Behavioral constraints that govern agent behavior. Rules are not suggestions — they are hard boundaries. A rule might specify that no module may exceed 500 LOC, or that every delegation must carry a return contract, or that tools may not mutate state outside their declared schema.
101: 
102: **Permissions**: Tool, skill, and command access control. Not every agent needs every tool. Permissions ensure that a junior builder agent cannot accidentally invoke administrative commands, and that a specialized debug agent has elevated access to diagnostic tools.
103: 
104: **Custom Tools**: User-authored tools with Zod schemas. When the five core tools are insufficient, users can define their own tools and register them with the plugin. Custom tools go through the same validation and safety checks as core tools.
105: 
106: ### Why This Separation Matters
107: 
108: The Hard Harness is stable. It is tested, versioned, and deployed like infrastructure. The Soft Meta-Concepts are flexible. They evolve with the project, get refined through use, and reflect the project's actual practices rather than generic defaults.
109: 
110: This separation is what makes HiveMind a **runtime composition engine** rather than a static framework. You do not fork the Hard Harness to customize behavior — you compose Soft Meta-Concepts on top of it. The engine stays constant; the mind adapts.
111: 
112: ---
113: 
114: ## 3. The 5 Pillars of HiveMind Practice
115: 
116: HiveMind's philosophy is implemented through five pillars — design principles that govern every architectural decision, every tool design, and every workflow pattern.
117: 
118: ### 3.1 Pillar 1: Hierarchical Superiority
119: 
120: **The Principle**: Everything — documents, workflows, synthesis, delegation — must be sorted into a systematic file tree where parent dependencies are satisfied before child actions are attempted.
121: 
122: **Why It Matters**: In complex systems, the most common source of failure is not bad implementation — it is ** premature implementation**. An agent implements a feature before its interface is finalized. A subagent changes an API that its sibling depends on. A test passes locally but fails in integration because it assumed a dependency that was not yet built.
123: 
124: Hierarchical Superiority prevents these failures by making dependency satisfaction a **structural requirement**, not a social convention.
125: 
126: **What It Looks Like in Practice**:
127: 
128: In the file system: HiveMind's architecture enforces a strict directory structure where `types.ts` is a leaf (no dependencies), `lifecycle-manager.ts` depends on most modules, and the `plugin.ts` composition root depends on everything. No circular imports. No mystery dependencies creeping in sideways.
129: 
130: In workflows: Before a builder agent implements a feature, it must receive authorization from the architect agent, which must have received the spec from the planner agent, which must have received the intent from the human operator. Each layer passes down not just the task, but the **chain of reasoning** that justifies the task.
131: 
132: In delegation: Every delegation carries a return contract — what the subagent must produce, in what format, by when. The parent agent cannot close a task until the return contract is satisfied. This is not micromanagement — it is **structured trust** that enables safe autonomy.
133: 
134: **The Safety Argument**: When everything has a defined place in a hierarchy, it becomes possible to verify correctness by inspection. You can ask: "Does this module have all its dependencies satisfied?" You can answer: "Yes, because the dependency graph says so." Without hierarchy, verification requires running everything and hoping for the best.
135: 
136: ### 3.2 Pillar 2: Collaborative Domains
137: 
138: **The Principle**: Every agent operates within a defined domain boundary. Delegation is controlled. Reports flow up and down the hierarchy. The team — human and agent alike — shares the same long-term knowledge.
139: 
140: **Why It Matters**: A single agent doing everything is not an agentic system — it is a very expensive autocomplete. Real agentic intelligence emerges when multiple specialized agents can collaborate without colliding, each doing what it does best while the system coordinates their efforts.
141: 
142: But collaboration without boundaries is chaos. An agent that can touch anything can break anything. An agent that cannot see its context cannot make informed decisions. An agent that never reports its findings cannot contribute to collective intelligence.
143: 
144: Collaborative Domains solves this through **bounded autonomy**: every agent has a domain, every domain has boundaries, and every cross-domain operation requires explicit authorization.
145: 
146: **What It Looks Like in Practice**:
147: 
148: Domain boundaries are enforced through permissions. The `hivehealer` (debug) agent has access to diagnostic tools and state inspection tools, but not to architectural refactoring tools or deployment tools. The `hivemaker` (builder) agent has access to code implementation tools, but not to agent configuration tools. This is not a limitation — it is **safety through scope reduction**.
149: 
150: Delegation flows through explicit channels. A coordinator agent does not simply hand off work to any available specialist — it delegates to an agent whose domain encompasses the task, with explicit constraints and a return contract. The delegation is logged in the trajectory store, visible to the supervisor chain.
151: 
152: Reporting is bidirectional. Agents report not just completion, but findings. If a builder agent discovers an architectural issue while implementing a feature, it does not silently work around it — it reports up the chain to the architect agent, who updates the spec. This is how the HIVE accumulates the MIND: through structured reporting that feeds the continuity store.
153: 
154: **The Growth Argument**: When agents and humans share the same long-term knowledge base, they grow together. The human learns what the agents are capable of. The agents learn what the human values. Over time, the collaboration becomes more efficient because both parties are working from the same context.
155: 
156: ### 3.3 Pillar 3: Strategically Measurable
157: 
158: **The Principle**: Every outcome must be measurable through both quantitative and qualitative metrics. Guardrails are incremental. Standards are proven, not assumed. Nothing is complete until it is verified.
159: 
160: **Why It Matters**: The most dangerous phrase in agentic development is "I think it's working." Confidence without measurement is guesswork. And guesswork compounds — a small error in session 1 becomes a large confusion in session 10 when subsequent sessions build on unverified assumptions.
161: 
162: Strategically Measurable requires that every task have **defined success criteria before it begins**, and that those criteria be verified **both automatically and through human review**.
163: 
164: **What It Looks Like in Practice**:
165: 
166: HiveMind uses a "2-End-Extreme Metrics" system. Every metric must satisfy two bounds:
167: 
168: - **Programmatic/E2E Testable**: Every metric has an automated verification mechanism. If a metric cannot be tested automatically, it must be explicitly flagged as requiring human judgment — and that judgment must be recorded.
169: 
170: - **Scale-Measurable**: Metrics can be quantified. "Better" is not a metric. "47% reduction in context-miss rate across 12 sessions" is a metric.
171: 
172: Additionally, every metric must be:
173: - **Scope-Aware**: Respects bounded context. Cross-boundary metrics require explicit mapping.
174: - **Responsibility-Centric**: Each agent owns specific metrics that map to its role in the hierarchy.
175: - **Integration-Aware**: Accounts for dependency chains. Sequential blocking is measured.
176: 
177: **The Guardrail Argument**: Incremental guardrails are safer than monolithic gates. Rather than one big verification at the end of a project (which will inevitably find problems that are expensive to fix), HiveMind implements small gates at each phase transition. A task cannot proceed from "planned" to "implemented" until its planning criteria are verified. It cannot proceed from "implemented" to "verified" until its implementation criteria are met.
178: 
179: This is **progressive trust-building**: each successful gate increases confidence incrementally, so by the time a feature reaches completion, the team has accumulated evidence rather than just hope.
180: 
181: ### 3.4 Pillar 4: Iteratively Granular
182: 
183: **The Principle**: Break everything down small enough to verify, small enough to trust, small enough to retry on failure. Loop until correct. Perfect is not a one-pass achievement — it is an iterative process.
184: 
185: **Why It Matters**: Large tasks fail in large ways. A 2,000-line module that fails testing requires debugging in a 2,000-line context. A 200-line module that fails testing requires debugging in a 200-line context. A 20-line function that fails testing is almost self-evident.
186: 
187: Granularity is not just about code. It is about **cognitive load management**. An agent (or a human) working on a large, undefined task will inevitably make decisions without full context, will miss edge cases, will build on shaky foundations. Breaking the task down forces clarity: if you cannot decompose a task into verifiable subtasks, you do not understand the task.
188: 
189: **What It Looks Like in Practice**:
190: 
191: HiveMind enforces strict granularity limits:
192: 
193: - Code LOC per file: ≤300
194: - Interface fields: ≤10
195: - Function complexity: Chain-breaking
196: 
197: These are not aesthetic preferences — they are **cognitive safety limits**. A 300-line file can be held in working memory. A 10-field interface can be reasoned about without a diagram. A chain-breaking function does not hide its complexity behind layers of indirection.
198: 
199: Task decomposition follows the same principle. A feature does not go from "intent" to "implemented" in one delegation. It goes through a chain: intent → spec → plan → implement → verify → integrate. Each step produces artifacts that the next step consumes. Each step's output is verified before the next step begins.
200: 
201: **The Iteration Argument**: Perfection is not achieved on the first pass. It is achieved through cycles of attempt, feedback, and refinement. Iteratively Granular enables this by making each cycle small enough to be safe. When a cycle fails, you know exactly where it failed, and you can retry just that cycle rather than the entire effort.
202: 
203: ### 3.5 Pillar 5: Growing MEMS-BRAIN
204: 
205: **The Principle**: The HIVE collects intelligence incrementally across all sessions, agents, and human explorations. The MIND shares this accumulated knowledge adaptively, retrieving synthesized understanding as a unified whole. Memory is selective retrieval, not dump mining.
206: 
207: **Why This Is the Most Important Pillar**: Every other pillar describes how to work correctly in a single session. This pillar describes how to **accumulate intelligence across sessions** — how to ensure that work done in Session 1 is visible and useful to Session 47.
208: 
209: Without this pillar, HiveMind would be an elaborate project management system with good intentions but no long-term memory. Every session would start from zero. Every mistake would be repeated. The "intelligence" would be an illusion — clever choreography without actual learning.
210: 
211: With this pillar, HiveMind becomes something different: a system that **compounds intelligence over time**.
212: 
213: ### The Problem With Most Agentic Systems
214: 
215: Most agentic systems have what we call **persistence without intelligence**. They save conversation history. They store tool outputs. They maintain state files. But this is not memory — it is a dump. The difference matters:
216: 
217: - **Dump mining** is when an agent retrieves a large chunk of past conversation and tries to make sense of it. This is expensive, slow, and unreliable. The agent must re-parse and re-contextualize raw data every time.
218: 
219: - **Selective retrieval** is when an agent can ask a question and receive a precise, synthesized answer from a memory system that understood what was important. "What was the decision we made about the authentication module in session 12?" should return a concise answer, not a 400-line transcript.
220: 
221: HiveMind's MEMS-BRAIN is built for selective retrieval.
222: 
223: ### The MEMS Analogy
224: 
225: MEMS stands for **Micro-Electro-Mechanical Systems** — tiny machines that work together to achieve effects far beyond their individual size. A smartphone contains billions of MEMS: accelerometers, gyroscopes, microphones, pressure sensors. Each is small, specialized, and limited. Together, they give the phone rich awareness of its physical context.
226: 
227: HiveMind's memory works the same way. Knowledge is not stored as monolithic documents — it is decomposed into **MEMS-BRAIN pieces**: small, discrete, specialized knowledge fragments that can be retrieved, synthesized, and composed as needed.
228: 
229: A MEMS-BRAIN piece might be:
230: - A decision record (why we chose PostgreSQL over MongoDB)
231: - A pattern definition (our standard for error handling)
232: - A lesson learned (never deploy on Fridays — three incidents in Q1)
233: - A dependency fact (module X depends on Y, and this dependency is version-locked)
234: - A metric snapshot (average session recovery time is 23 seconds)
235: 
236: When an agent needs context, it does not download the entire project history. It retrieves the specific MEMS pieces relevant to its current task, and synthesizes them into working context.
237: 
238: ### The 5-Layer Memory Architecture
239: 
240: HiveMind's memory is organized in five layers, from fastest to most durable:
241: 
242: **Layer 1 — Hot RAM (Session State)**: The in-memory state of the current session. Task statuses, delegation chains, tool call counters. This is the working memory of the HIVE — fast, volatile, reset on session close. Persisted via SESSION-STATE.md and WAL (Write-Ahead Log) for crash recovery.
243: 
244: **Layer 2 — Warm (LanceDB Vectors)**: Semantic search layer. Embeddings of decisions, patterns, and lessons stored in a vector database. Enables natural-language queries like "find similar decisions to this one" or "what errors have we seen in the authentication flow?"
245: 
246: **Layer 3 — Cold (Git-Notes Knowledge Graph)**: Structured knowledge stored in git notes. Each commit that makes a significant decision gets a note with metadata: what was decided, why, what alternatives were considered, who approved it. Git notes survive repository cloning and fork — they travel with the code.
247: 
248: **Layer 4 — Archive**: Deprecated decisions, old patterns, lessons that may no longer be relevant. Kept for historical reference but not surfaced in normal queries. Accessible if explicitly requested.
249: 
250: **Layer 5 — Cloud**: Cross-repository intelligence. When multiple projects use HiveMind and opt into shared learning, their MEMS-BRAIN pieces can be shared (with appropriate privacy controls) to enable organization-wide pattern recognition.
251: 
252: ### The Core Principle: Immutable Anchors vs Searchable Memories
253: 
254: HiveMind distinguishes between two types of memory:
255: 
256: **Immutable Decision Anchors**: These are commits. When a decision is made and implemented, it is recorded in git with a message that follows a strict format: `decision: [what] — [why it matters]`. This record cannot be changed. It is an anchor that future sessions can tie to. If Session 47 disagrees with a decision from Session 12, it does not delete Session 12's record — it creates a new record explaining why the decision was reconsidered.
257: 
258: **Searchable Memories**: These are the MEMS pieces that agents retrieve during work. They are derived from commits, from tool outputs, from human feedback, but they are not the raw data — they are synthesized summaries optimized for retrieval. A human should be able to read a MEMS piece in 30 seconds and understand its relevance.
259: 
260: The distinction matters because **raw data is not knowledge**. A 5,000-line conversation dump is not context — it is context noise. A 5-sentence decision record that captures the essential reasoning is context.
261: 
262: ### The Problem Solved: Sessions No Longer Start From Zero
263: 
264: The practical impact of the MEMS-BRAIN architecture is profound:
265: 
266: Without it: Session 1 spends 2 hours establishing architectural context. Session 2 has no memory of Session 1's decisions. Session 3 spends 45 minutes re-reading old transcripts trying to find the decision that was made. Sessions 4 through 20 each repeat fragments of previous mistakes.
267: 
268: With it: Session 1 establishes architectural context, and those decisions are stored as MEMS pieces. Session 2 retrieves "relevant decisions from previous sessions" as part of its initialization. Session 3 asks "what did we decide about the authentication module?" and receives a concise answer. Sessions 4 through 20 build on verified decisions, not guesswork.
269: 
270: This is why the metaphor of the brain is apt. The HIVE is the network of specialized regions — each agent, each module, each tool. The MIND is the connective tissue that lets them share what they learn.
271: 
272: ---
273: 
274: ## 4. The MEMS-BRAIN in Practice
275: 
276: ### The Dual-Layer Continuity Model
277: 
278: HiveMind's continuity system has two layers that work together:
279: 
280: **Durable JSON Store (continuity.ts)**: The source of truth for long-term state. Every task, every delegation, every significant event is written to a JSON file that survives session boundaries. When a session resumes, it reads from this store to reconstruct context.
281: 
282: **In-Memory Maps (state.ts)**: The working state for the current session. Fast read/write access to task statuses, agent states, and tool call counts. Changes are flushed to the durable store at defined checkpoints, not on every mutation (which would be expensive).
283: 
284: This is not caching — it is ** CQRS applied to memory**: the write-side (tools) mutates the durable store; the read-side (hooks) observes events and updates the in-memory state; agents read from the in-memory state for speed but the durable store is the authority for recovery.
285: 
286: ### How Memory Is Organized: The Shelf Metaphor
287: 
288: Imagine a library where every book is a MEMS piece. The shelves are organized by domain:
289: 
290: - **Authentication shelf**: All decisions, patterns, and lessons related to auth.
291: - **Database shelf**: All decisions about data storage, migration, and queries.
292: - **API design shelf**: All contracts, versioning decisions, and error conventions.
293: - **Deployment shelf**: All rollout strategies, incident learnings, and environment configs.
294: 
295: An agent that needs to understand the auth context does not read every book in the library — it goes to the authentication shelf and retrieves the most recent, most relevant entries.
296: 
297: The shelves are maintained automatically through metadata. Every MEMS piece has tags (domain, session number, decision type, confidence level). When new pieces are added, they are tagged and shelved. When an agent queries, the system searches shelves, not full text.
298: 
299: ### Immutable Anchors in Practice: Commit as Decision Record
300: 
301: HiveMind's git workflow treats commits as **decision records**, not just change logs.
302: 
303: A commit message follows the format:
304: 
305: ```
306: [scope]: [what changed] — [why it matters]
307: 
308: [optional: alternatives considered, dependencies, related decisions]
309: ```
310: 
311: This is not a formatting convention — it is an **intentional knowledge capture act**. The commit message is the MEMS piece for this decision. It is written to be retrievable, not just readable.
312: 
313: Over time, git log becomes a **decision archive** that any future session can query. "Why did we remove the caching layer in Session 8?" becomes a `git log` query away, not an archaeological dig through Slack messages and meeting notes.
314: 
315: ### Concrete Examples of Memory Operations
316: 
317: **Example 1: Session Recovery**
318: 
319: Agent resumes after an interruption. The continuity store contains:
320: 
321: ```json
322: {
323:   "sessionId": "sess_47",
324:   "lastCheckpoint": "2026-04-10T14:23:00Z",
325:   "activeTasks": [
326:     {
327:       "taskId": "task_812",
328:       "status": "in_progress",
329:       "agent": "hivemaker",
330:       "delegatedBy": "coordinator",
331:       "returnContract": { "format": "diff", "by": "2026-04-10T15:00:00Z" },
332:       "lastToolCall": "hivemind_tool_write at 14:22:58",
333:       "checkpointNotes": "Implementing auth middleware — waiting for spec confirmation from architect"
334:     }
335:   ],
336:   "memsPieces": [
337:     { "id": "mems_201", "type": "decision", "domain": "auth", "session": "sess_12", "summary": "JWT chosen over sessions for stateless auth" },
338:     { "id": "mems_203", "type": "pattern", "domain": "auth", "session": "sess_31", "summary": "Standard middleware chain: validate → enrich → authorize" }
339:   ]
340: }
341: ```
342: 
343: The agent knows exactly where it was, what it was waiting for, and what relevant memory pieces exist. It does not need to re-read the full spec — it has a pointer to the specific decision it was waiting for.
344: 
345: **Example 2: Cross-Session Pattern Retrieval**
346: 
347: Agent encounters an authentication issue. Before proposing a fix, it queries the MEMS store:
348: 
349: ```
350: Query: "authentication errors patterns"
351: Returns:
352: - mems_156: "Session 23 — OAuth callback race condition, fixed by adding state parameter validation"
353: - mems_089: "Session 15 — JWT expiry edge case, handled by silent refresh with retry queue"
354: - mems_201: "Session 12 — Decision: JWT chosen over sessions"
355: ```
356: 
357: The agent's proposed fix now accounts for three previous incidents and one foundational decision. It does not repeat the race condition fix, it does not contradict the JWT decision, and it has context for the error it is fixing.
358: 
359: ---
360: 
361: ## 5. What HiveMind Is NOT
362: 
363: HiveMind occupies a specific position in the landscape of agentic development approaches. Understanding what it is not is as important as understanding what it is.
364: 
365: ### Not a Corporate-Spec-Driven Framework
366: 
367: Frameworks like GSD (Get Shit Done) and BMAD impose structured procedures that must be followed in sequence. They are designed for teams that need compliance — where managers need to verify that every step was followed, every gate was passed, every artifact was produced.
368: 
369: HiveMind does not impose these procedures. It provides the **infrastructure** for any procedure, including GSD or BMAD if that is what your team needs. But it does not mandate them.
370: 
371: If your team needs phase gates, you can implement them with HiveMind's hooks and tools. If your team needs to skip phases for rapid prototyping, you can do that too. HiveMind is a **platform for composing agentic workflows**, not a workflow in a box.
372: 
373: **Why This Matters for Practitioners**: If you are evaluating HiveMind and you need a framework that tells you exactly what to do at every step, you should look at GSD or BMAD. If you want infrastructure that can be configured to support your workflow — whatever your workflow is — HiveMind is designed for you.
374: 
375: ### Not the All-In-SOTA Harness
376: 
377: Oh-My-OpenAgents (OMO) is an ambitious project that aims to provide a fully autonomous agentic coding system — one that can handle entire features from intent to deployment with minimal human intervention. It represents the "maximum autonomy" end of the spectrum.
378: 
379: HiveMind is not that. HiveMind is **collaborative** by default. It assumes that humans and agents work together, that humans provide intent and verify outcomes, and that agents provide execution and pattern recognition. Full autonomy is available as an option (through the task queuing and auto-loop features), but it is not the default mode.
380: 
381: **Why This Matters for Practitioners**: If you want agents that operate fully autonomously while you sleep, OMO may be a better fit. If you want agents that work alongside you, challenge your assumptions, suggest alternatives, and learn from your feedback, HiveMind is designed for you.
382: 
383: ### Not a Framework for Nerds
384: 
385: This is perhaps the most important distinction. HiveMind does not require deep expertise in agentic systems, prompt engineering, or any specific technology stack to get value from it. It is designed to be ** approachable** — to meet users at their current level of expertise and help them grow.
386: 
387: The "bite-sized, systematic guidance" mentioned in the brief is not marketing copy. It describes a deliberate design philosophy: every task, no matter how complex, can be decomposed into steps small enough for a non-expert to understand and verify. The human does not need to know how the agent works internally — they need to know whether the output is what they asked for.
388: 
389: **Why This Matters for Practitioners**: If you are an experienced developer who wants fine-grained control over every agent behavior, HiveMind gives you that — but it does not require it. If you are a product manager who wants to use agents to explore technical feasibility without becoming a systems architect, HiveMind supports that too.
390: 
391: ---
392: 
393: ## 6. The Human-Agent Collaboration Model
394: 
395: ### The Cognitive Layers Concept
396: 
397: HiveMind's collaboration model is built on the idea of **cognitive layers** — different levels of awareness and responsibility that humans and agents occupy.
398: 
399: **Human Layer**: Intent, judgment, verification. Humans define what they want. Humans decide whether what was delivered matches what was asked. Humans provide the "why" that agents cannot infer.
400: 
401: **Agent Layer**: Execution, pattern recognition, context retrieval. Agents do the work. Agents notice patterns in code and suggest improvements. Agents maintain the MEMS-BRAIN and surface relevant memories at the right time.
402: 
403: **Shared Layer**: The HIVE's file tree, the MIND's memory store, the delegation chain. Both humans and agents can read from this layer. Both can write to it (with appropriate permissions). This is the collaboration surface.
404: 
405: The magic of HiveMind is in the **Shared Layer**. When an agent retrieves a MEMS piece from Session 12 and synthesizes it into its context, the human who made that decision in Session 12 is collaborating across time. When a human reviews an agent's proposed implementation and provides feedback, they are collaborating across the cognitive layers.
406: 
407: ### The "Wanders-of-Curiosity" Philosophy
408: 
409: HiveMind is designed for people who **explore**. Not just people who have clear requirements and want them implemented — but people who want to understand a domain, who want to experiment with different approaches, who want to follow a thread of curiosity wherever it leads.
410: 
411: The brief mentions "the most wanders-of-curiosity individuals" and this is not an accident. HiveMind is built for people who find the journey as valuable as the destination. Who want to understand *why* the architecture is the way it is, not just *that* it is. Who are willing to try things that fail so they can learn why they failed.
412: 
413: This is in contrast to agentic systems that optimize for throughput — maximizing the number of tasks completed per hour. HiveMind optimizes for **compounded learning** — ensuring that every experiment, success or failure, makes future work better.
414: 
415: ### How Agents Adapt and Grow
416: 
417: Agents in HiveMind grow through three mechanisms:
418: 
419: **Experience Accumulation**: Every task completed, every delegation handled, every error encountered is recorded as a MEMS piece. Over time, agents operating in a HiveMind ecosystem benefit from the accumulated experience of all previous agents.
420: 
421: **Feedback Integration**: When a human corrects an agent's work, that correction is stored as a MEMS piece. Future agents retrieve it: "Human corrected my predecessor on this pattern because..."
422: 
423: **Pattern Recognition**: Over multiple sessions, agents begin to recognize patterns in the project's evolution. "This team tends to revisit authentication decisions after 3 months — I should flag this as a candidate for early architectural review."
424: 
425: This is not science fiction. It is the natural output of an architecture that takes memory seriously.
426: 
427: ---
428: 
429: ## 7. Key Architectural Principles
430: 
431: ### The CQRS Pattern: Tools = Write-Side, Hooks = Read-Side
432: 
433: HiveMind's architecture enforces a strict separation between **state mutation** and **state observation**:
434: 
435: - **Tools** are the only mechanism that can mutate state. Every tool call is validated, logged, and recorded in the trajectory store. If it is not a tool call, it cannot change system state.
436: 
437: - **Hooks** observe events and enrich context. They watch for task creation, delegation, completion, and error — and inject relevant context into the agent's view. They cannot mutate state.
438: 
439: This is not a convenience pattern — it is a **safety guarantee**. When you know that only five tools can change state, you can audit every state change by reading five tool implementations. When any component can mutate state, auditing becomes impossible.
440: 
441: ### The Plugin as Zero-Logic Assembly
442: 
443: The plugin (`plugin.ts`) is the composition root that wires tools and hooks into OpenCode. Its implementation target is **under 100 LOC** — not because of arbitrary size limits, but because the composition logic should be trivial. If the plugin is complex, the complexity belongs in the tools and hooks, not in the assembly.
444: 
445: This is the **single responsibility principle applied to architecture**: the plugin's job is wiring, not business logic. Business logic lives in tools (which are focused on their specific mutations) and hooks (which are focused on their specific observations).
446: 
447: ### Why These Matter for Reliability and Composability
448: 
449: The CQRS separation and the zero-logic plugin are not academic preferences. They have practical implications for reliability:
450: 
451: **Auditability**: When something goes wrong, you can trace every state change to a specific tool call. You do not need to wonder "how did the task status get corrupted?" — you read the trajectory store and see the sequence of tool calls that led to the corruption.
452: 
453: **Testability**: Tools can be tested in isolation because they have clear inputs and outputs. Hooks can be tested by firing synthetic events and verifying context enrichment. The plugin can be tested by composing test tools and hooks and verifying they connect correctly.
454: 
455: **Composability**: Because the plugin has no business logic, you can swap tools in and out without changing the plugin. Want to add a new tool? Write the tool, register it with the plugin. The rest of the system does not care.
456: 
457: ---
458: 
459: ## 8. Conclusion
460: 
461: HiveMind's philosophy — **Agents' Intelligence = HIVE + MIND** — is a statement about where intelligence comes from.
462: 
463: Not from bigger models. Not from more tokens. Not from cleverer prompts.
464: 
465: Intelligence comes from **architecture**. From the HIVE's structure that keeps agents working on the right things, in the right order, within the right boundaries. From the MIND's memory that ensures every lesson learned survives session boundaries and becomes available to future sessions.
466: 
467: The five pillars are not independent principles — they are interlocking constraints that reinforce each other:
468: 
469: - **Hierarchical Superiority** ensures that dependencies are satisfied before work begins.
470: - **Collaborative Domains** ensure that agents operate within clear boundaries and report up the chain.
471: - **Strategically Measurable** ensures that success is defined before work starts and verified after it completes.
472: - **Iteratively Granular** ensures that work is broken down small enough to be safe and correctable.
473: - **Growing MEMS-BRAIN** ensures that intelligence accumulates across sessions rather than resetting.
474: 
475: Together, these pillars create a system where agents do not just execute tasks — they **build on each other's work**. Where mistakes from Session 3 are visible to Session 47. Where the team's collective knowledge — architectural decisions, pattern preferences, incident learnings — is not trapped in the heads of individuals but stored in an accessible, retrievable form.
476: 
477: **What HiveMind Enables**:
478: 
479: For **developers**: A system that remembers your project's context, that does not require you to re-explain your codebase to every new session, that catches conflicts before they become bugs.
480: 
481: For **technical leads**: A system that enforces architectural discipline without micromanagement, that provides visibility into agent workflows, that makes delegation safe through structured contracts.
482: 
483: For **product managers**: A system that breaks complex work into verifiable chunks, that involves humans at the right gates, that delivers not just completion but evidence of quality.
484: 
485: For **organizations**: A system that compounds intelligence over time, where every project contributes to a growing knowledge base, where agentic best practices can be shared across teams without violating project isolation.
486: 
487: HiveMind is not a framework you must conform to. It is an architecture you can adopt — in full, or in part. You can start with the Hard Harness and the basic delegation protocol. You can add skills as you need them. You can implement the MEMS-BRAIN on day one or grow into it over time.
488: 
489: The HIVE and the MIND are not destinations — they are directions. Every decision about where to place a boundary, how to tag a MEMS piece, when to enforce a guardrail, is a step toward a system that is genuinely intelligent: not because it contains a powerful model, but because it has the architecture to support and amplify that model's capabilities.
490: 
491: Welcome to HiveMind.
492: 
493: ---
494: 
495: **Document Information**
496: 
497: - **Word Count**: ~3,800 words
498: - **Last Updated**: 2026-04-10
499: - **Status**: Publication-ready
500: - **Next Review**: Upon significant architectural changes

(End of file - total 500 lines)
</content>
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
Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/docs/philosophy/HIVEMIND-PHILOSOPHY.md"}
<path>/Users/apple/hivemind-plugin-private/docs/philosophy/HIVEMIND-PHILOSOPHY.md</path>
<type>file</type>
<content>
1: # HIVEMIND PHILOSOPHY: Agents' Intelligence = HIVE + MIND
2: 
3: **Document Version**: 1.0
4: **Date**: 2026-04-10
5: **Status**: Publication-Ready
6: **Audience**: Business stakeholders, senior engineers, technical product managers
7: 
8: ---
9: 
10: ## Executive Summary
11: 
12: HiveMind is a runtime composition engine that makes agents genuinely intelligent — not through more tokens, not through bigger models, but through **architecture**. Specifically, through the marriage of two forces: the **HIVE** and the **MIND**.
13: 
14: The HIVE is structure. It is the systematic file trees, the hierarchical dependencies, the domain boundaries, the delegation protocols, and the guardrails that keep agents from wandering off into hallucinated wildernesses. The HIVE is how multiple agents collaborate without colliding, how work flows up and down a chain of command without breaking, how every task decomposes into bite-sized pieces small enough to verify and small enough to trust.
15: 
16: The MIND is memory. It is the accumulated intelligence of every session, every decision, every successful experiment and every failed one. Where other agentic systems reset to zero every time a new session starts, HiveMind remembers. The MIND is not a dump of conversation history — it is a living, organized knowledge system where Micro-Electro-Mechanical knowledge Pieces (MEMS) are collected, organized, and retrieved as synthesized understanding when needed.
17: 
18: Together, HIVE + MIND = Intelligence that compounds over time.
19: 
20: HiveMind is not a framework you must conform to. It is not a rigid methodology demanding specific procedures or toolchains. It is an **open architecture** — a runtime composition engine that can host GSD-style phase-gated workflows, BMAD-style constraints, or OMO-style autonomous agents, depending on what your project needs. It meets you where you are and grows with you.
21: 
22: This philosophy document explains why HiveMind exists, what it believes, how it works, and — equally important — what it is not.
23: 
24: ---
25: 
26: ## 1. The Core Thesis: Intelligence Through Architecture
27: 
28: ### The Problem With Today's Agentic Systems
29: 
30: Modern AI coding assistants are powerful but **memoryless**. Each session starts from scratch. The model may have seen millions of codebases in training, but it has never worked with *your* codebase before. It does not know which architectural decisions your team made last quarter, which conventions you established, which patterns failed in production, or which decisions are sacred contracts that should not be broken.
31: 
32: This memorylessness creates a fundamental inefficiency: agents repeat mistakes. They miss context that humans spent weeks establishing. They propose solutions that conflict with earlier decisions because they cannot see those decisions. The result is agents that are individually brilliant but collectively naive.
33: 
34: ### The HiveMind Thesis
35: 
36: HiveMind's core thesis is that **agent intelligence is not a property of the model — it is a property of the architecture surrounding the model**.
37: 
38: A single agent, no matter how capable, cannot hold the full context of a complex project across sessions. But a **hierarchy of agents**, each with defined domain boundaries and shared access to accumulated memory, can build on previous work rather than starting over. Intelligence emerges from collaboration and continuity, not from any single agent's raw capability.
39: 
40: This is what we mean by **HIVE + MIND**:
41: 
42: - **The HIVE** is the structural architecture — the hierarchy, the domains, the delegation protocols, the guardrails. It ensures agents work on the right things, report to the right supervisors, and never step outside their authorized boundaries.
43: 
44: - **The MIND** is the accumulated intelligence — the memory of past sessions, the pattern library, the decision anchors. It ensures agents do not repeat mistakes, can retrieve relevant context from previous work, and grow more capable over time.
45: 
46: Intelligence, in this framework, is not an input to the system. It is an **output** of the architecture.
47: 
48: ### Why Hierarchy Matters
49: 
50: Hierarchy is not bureaucracy. Hierarchy is **safety through dependency ordering**.
51: 
52: Consider: in a correct dependency tree, a child module cannot exist before its parent. A feature cannot be implemented before its interface is defined. A test cannot pass before the code it tests exists. These are not arbitrary rules — they reflect the natural structure of complex systems.
53: 
54: HiveMind's **Hierarchical Superiority** pillar enforces this structure in agent workflows. Before an agent implements anything, it must verify that all dependencies are satisfied. Before a subagent can act, its parent agent must authorize the delegation. This creates a chain of custody and a chain of comprehension: every decision is made at the right level, by the right agent, with the right context.
55: 
56: For non-technical readers: imagine a construction project where every worker knew not just their own task, but why their task depends on the previous worker's task. The foundation must come before the walls. The walls before the roof. Agents operating in a hierarchy understand this instinctively — not because they were told to follow rules, but because the architecture makes correct behavior the path of least resistance.
57: 
58: For technical readers: HiveMind implements this through a CQRS pattern where tools are the write-side (state mutation) and hooks are the read-side (context injection). The plugin assembly wires them together with zero business logic, ensuring the architecture itself enforces boundaries rather than relying on agent goodwill.
59: 
60: ### Why Local-Side-Safe Infrastructure Matters
61: 
62: The most dangerous moment in an agentic workflow is when an agent operates without visibility into system state — when it makes assumptions about the environment that may no longer be true, or when it proposes changes that conflict with changes made by another agent in parallel.
63: 
64: HiveMind's infrastructure is designed to be **local-side-safe**: agents can inspect their own state, the state of their tasks, and the trajectory of their delegation chain at any time. They do not need to guess. They can verify.
65: 
66: This is implemented through a dual-layer continuity model: durable JSON persistence for long-term state (the MIND's memory) and in-memory Maps for session-specific state (the HIVE's working memory). When an agent resumes after an interruption, it reconstructs its context from the continuity store, not from fragile conversation history.
67: 
68: ---
69: 
70: ## 2. The Two Halves of HiveMind
71: 
72: HiveMind is architecturally divided into two halves that must never be confused, because they serve fundamentally different purposes.
73: 
74: ### Half 1: The Hard Harness (Runtime Composition Engine)
75: 
76: The Hard Harness is the **engine** — the npm package (`opencode-hivemind`) that provides the runtime primitives agents actually execute. It is distributed as a standard Node.js package, versioned, tested, and installed like any other dependency.
77: 
78: The Hard Harness contains:
79: 
80: **Tools (Write-Side, CQRS)**: Five core tools with Zod schemas that mutate state. These are the only mechanisms that can change system state — creating tasks, delegating work, recording trajectory, updating continuity. Every tool call is validated, typed, and logged. There is no implicit state mutation, no side-channel writes, no shadow state competing with the runtime truth.
81: 
82: **Hooks (Read-Side, CQRS)**: Event observers that inject context but never mutate state. These watch for session start, tool execution, delegation events, and task completion — and enrich the agent's context accordingly. Hooks are how the MIND becomes visible to agents: by observing events and recording them in the continuity store, hooks make past sessions retrievable by future sessions.
83: 
84: **Plugin (Assembly)**: A thin composition root (~57 LOC target, currently ~447 LOC) that wires tools and hooks into OpenCode. It contains zero business logic. Its only job is assembly — connecting the write-side tools to their handlers, the read-side hooks to their event sources, and the shared utilities to both.
85: 
86: **Shared (Leaf Module)**: Pure utilities with no dependencies. Types, helpers, concurrency primitives, error definitions. The leaf is where the buck stops — no circular imports, no upward dependencies, no mystery.
87: 
88: ### Half 2: The Soft Meta-Concepts (User-Configurable)
89: 
90: The Soft Meta-Concepts are the **mind** — the instructions, definitions, and behavioral patterns that tell agents how to use the Hard Harness. They live in the project's `.opencode/` directory and are version-controlled alongside the codebase, not in an external package.
91: 
92: The Soft Meta-Concepts include:
93: 
94: **Skills** (SKILL.md + scripts): Portable instruction packages that teach agents how to approach specific task types. Skills are the primary way users extend HiveMind's capabilities. A skill might teach an agent how to run a GSD-style phase loop, how to perform deep research using Tavily, or how to validate a spec against implementation. Skills are not code — they are knowledge transfer in document form.
95: 
96: **Agents**: OpenCode agent definitions with permission profiles. Each agent has a defined role (architect, planner, builder, debugger, reviewer), a temperature setting, tool access permissions, and a system prompt that encodes its responsibilities. Agents are not magic — they are configurations with names.
97: 
98: **Commands**: Reusable command bundles with YAML frontmatter. Commands are CLI-style entry points that invoke specific workflows — `start-work`, `deep-research`, `plan`, `ultrawork`. They encapsulate common task patterns so agents (and humans) do not have to reconstruct them from scratch each time.
99: 
100: **Rules**: Behavioral constraints that govern agent behavior. Rules are not suggestions — they are hard boundaries. A rule might specify that no module may exceed 500 LOC, or that every delegation must carry a return contract, or that tools may not mutate state outside their declared schema.
101: 
102: **Permissions**: Tool, skill, and command access control. Not every agent needs every tool. Permissions ensure that a junior builder agent cannot accidentally invoke administrative commands, and that a specialized debug agent has elevated access to diagnostic tools.
103: 
104: **Custom Tools**: User-authored tools with Zod schemas. When the five core tools are insufficient, users can define their own tools and register them with the plugin. Custom tools go through the same validation and safety checks as core tools.
105: 
106: ### Why This Separation Matters
107: 
108: The Hard Harness is stable. It is tested, versioned, and deployed like infrastructure. The Soft Meta-Concepts are flexible. They evolve with the project, get refined through use, and reflect the project's actual practices rather than generic defaults.
109: 
110: This separation is what makes HiveMind a **runtime composition engine** rather than a static framework. You do not fork the Hard Harness to customize behavior — you compose Soft Meta-Concepts on top of it. The engine stays constant; the mind adapts.
111: 
112: ---
113: 
114: ## 3. The 5 Pillars of HiveMind Practice
115: 
116: HiveMind's philosophy is implemented through five pillars — design principles that govern every architectural decision, every tool design, and every workflow pattern.
117: 
118: ### 3.1 Pillar 1: Hierarchical Superiority
119: 
120: **The Principle**: Everything — documents, workflows, synthesis, delegation — must be sorted into a systematic file tree where parent dependencies are satisfied before child actions are attempted.
121: 
122: **Why It Matters**: In complex systems, the most common source of failure is not bad implementation — it is ** premature implementation**. An agent implements a feature before its interface is finalized. A subagent changes an API that its sibling depends on. A test passes locally but fails in integration because it assumed a dependency that was not yet built.
123: 
124: Hierarchical Superiority prevents these failures by making dependency satisfaction a **structural requirement**, not a social convention.
125: 
126: **What It Looks Like in Practice**:
127: 
128: In the file system: HiveMind's architecture enforces a strict directory structure where `types.ts` is a leaf (no dependencies), `lifecycle-manager.ts` depends on most modules, and the `plugin.ts` composition root depends on everything. No circular imports. No mystery dependencies creeping in sideways.
129: 
130: In workflows: Before a builder agent implements a feature, it must receive authorization from the architect agent, which must have received the spec from the planner agent, which must have received the intent from the human operator. Each layer passes down not just the task, but the **chain of reasoning** that justifies the task.
131: 
132: In delegation: Every delegation carries a return contract — what the subagent must produce, in what format, by when. The parent agent cannot close a task until the return contract is satisfied. This is not micromanagement — it is **structured trust** that enables safe autonomy.
133: 
134: **The Safety Argument**: When everything has a defined place in a hierarchy, it becomes possible to verify correctness by inspection. You can ask: "Does this module have all its dependencies satisfied?" You can answer: "Yes, because the dependency graph says so." Without hierarchy, verification requires running everything and hoping for the best.
135: 
136: ### 3.2 Pillar 2: Collaborative Domains
137: 
138: **The Principle**: Every agent operates within a defined domain boundary. Delegation is controlled. Reports flow up and down the hierarchy. The team — human and agent alike — shares the same long-term knowledge.
139: 
140: **Why It Matters**: A single agent doing everything is not an agentic system — it is a very expensive autocomplete. Real agentic intelligence emerges when multiple specialized agents can collaborate without colliding, each doing what it does best while the system coordinates their efforts.
141: 
142: But collaboration without boundaries is chaos. An agent that can touch anything can break anything. An agent that cannot see its context cannot make informed decisions. An agent that never reports its findings cannot contribute to collective intelligence.
143: 
144: Collaborative Domains solves this through **bounded autonomy**: every agent has a domain, every domain has boundaries, and every cross-domain operation requires explicit authorization.
145: 
146: **What It Looks Like in Practice**:
147: 
148: Domain boundaries are enforced through permissions. The `hivehealer` (debug) agent has access to diagnostic tools and state inspection tools, but not to architectural refactoring tools or deployment tools. The `hivemaker` (builder) agent has access to code implementation tools, but not to agent configuration tools. This is not a limitation — it is **safety through scope reduction**.
149: 
150: Delegation flows through explicit channels. A coordinator agent does not simply hand off work to any available specialist — it delegates to an agent whose domain encompasses the task, with explicit constraints and a return contract. The delegation is logged in the trajectory store, visible to the supervisor chain.
151: 
152: Reporting is bidirectional. Agents report not just completion, but findings. If a builder agent discovers an architectural issue while implementing a feature, it does not silently work around it — it reports up the chain to the architect agent, who updates the spec. This is how the HIVE accumulates the MIND: through structured reporting that feeds the continuity store.
153: 
154: **The Growth Argument**: When agents and humans share the same long-term knowledge base, they grow together. The human learns what the agents are capable of. The agents learn what the human values. Over time, the collaboration becomes more efficient because both parties are working from the same context.
155: 
156: ### 3.3 Pillar 3: Strategically Measurable
157: 
158: **The Principle**: Every outcome must be measurable through both quantitative and qualitative metrics. Guardrails are incremental. Standards are proven, not assumed. Nothing is complete until it is verified.
159: 
160: **Why It Matters**: The most dangerous phrase in agentic development is "I think it's working." Confidence without measurement is guesswork. And guesswork compounds — a small error in session 1 becomes a large confusion in session 10 when subsequent sessions build on unverified assumptions.
161: 
162: Strategically Measurable requires that every task have **defined success criteria before it begins**, and that those criteria be verified **both automatically and through human review**.
163: 
164: **What It Looks Like in Practice**:
165: 
166: HiveMind uses a "2-End-Extreme Metrics" system. Every metric must satisfy two bounds:
167: 
168: - **Programmatic/E2E Testable**: Every metric has an automated verification mechanism. If a metric cannot be tested automatically, it must be explicitly flagged as requiring human judgment — and that judgment must be recorded.
169: 
170: - **Scale-Measurable**: Metrics can be quantified. "Better" is not a metric. "47% reduction in context-miss rate across 12 sessions" is a metric.
171: 
172: Additionally, every metric must be:
173: - **Scope-Aware**: Respects bounded context. Cross-boundary metrics require explicit mapping.
174: - **Responsibility-Centric**: Each agent owns specific metrics that map to its role in the hierarchy.
175: - **Integration-Aware**: Accounts for dependency chains. Sequential blocking is measured.
176: 
177: **The Guardrail Argument**: Incremental guardrails are safer than monolithic gates. Rather than one big verification at the end of a project (which will inevitably find problems that are expensive to fix), HiveMind implements small gates at each phase transition. A task cannot proceed from "planned" to "implemented" until its planning criteria are verified. It cannot proceed from "implemented" to "verified" until its implementation criteria are met.
178: 
179: This is **progressive trust-building**: each successful gate increases confidence incrementally, so by the time a feature reaches completion, the team has accumulated evidence rather than just hope.
180: 
181: ### 3.4 Pillar 4: Iteratively Granular
182: 
183: **The Principle**: Break everything down small enough to verify, small enough to trust, small enough to retry on failure. Loop until correct. Perfect is not a one-pass achievement — it is an iterative process.
184: 
185: **Why It Matters**: Large tasks fail in large ways. A 2,000-line module that fails testing requires debugging in a 2,000-line context. A 200-line module that fails testing requires debugging in a 200-line context. A 20-line function that fails testing is almost self-evident.
186: 
187: Granularity is not just about code. It is about **cognitive load management**. An agent (or a human) working on a large, undefined task will inevitably make decisions without full context, will miss edge cases, will build on shaky foundations. Breaking the task down forces clarity: if you cannot decompose a task into verifiable subtasks, you do not understand the task.
188: 
189: **What It Looks Like in Practice**:
190: 
191: HiveMind enforces strict granularity limits:
192: 
193: - Code LOC per file: ≤300
194: - Interface fields: ≤10
195: - Function complexity: Chain-breaking
196: 
197: These are not aesthetic preferences — they are **cognitive safety limits**. A 300-line file can be held in working memory. A 10-field interface can be reasoned about without a diagram. A chain-breaking function does not hide its complexity behind layers of indirection.
198: 
199: Task decomposition follows the same principle. A feature does not go from "intent" to "implemented" in one delegation. It goes through a chain: intent → spec → plan → implement → verify → integrate. Each step produces artifacts that the next step consumes. Each step's output is verified before the next step begins.
200: 
201: **The Iteration Argument**: Perfection is not achieved on the first pass. It is achieved through cycles of attempt, feedback, and refinement. Iteratively Granular enables this by making each cycle small enough to be safe. When a cycle fails, you know exactly where it failed, and you can retry just that cycle rather than the entire effort.
202: 
203: ### 3.5 Pillar 5: Growing MEMS-BRAIN
204: 
205: **The Principle**: The HIVE collects intelligence incrementally across all sessions, agents, and human explorations. The MIND shares this accumulated knowledge adaptively, retrieving synthesized understanding as a unified whole. Memory is selective retrieval, not dump mining.
206: 
207: **Why This Is the Most Important Pillar**: Every other pillar describes how to work correctly in a single session. This pillar describes how to **accumulate intelligence across sessions** — how to ensure that work done in Session 1 is visible and useful to Session 47.
208: 
209: Without this pillar, HiveMind would be an elaborate project management system with good intentions but no long-term memory. Every session would start from zero. Every mistake would be repeated. The "intelligence" would be an illusion — clever choreography without actual learning.
210: 
211: With this pillar, HiveMind becomes something different: a system that **compounds intelligence over time**.
212: 
213: ### The Problem With Most Agentic Systems
214: 
215: Most agentic systems have what we call **persistence without intelligence**. They save conversation history. They store tool outputs. They maintain state files. But this is not memory — it is a dump. The difference matters:
216: 
217: - **Dump mining** is when an agent retrieves a large chunk of past conversation and tries to make sense of it. This is expensive, slow, and unreliable. The agent must re-parse and re-contextualize raw data every time.
218: 
219: - **Selective retrieval** is when an agent can ask a question and receive a precise, synthesized answer from a memory system that understood what was important. "What was the decision we made about the authentication module in session 12?" should return a concise answer, not a 400-line transcript.
220: 
221: HiveMind's MEMS-BRAIN is built for selective retrieval.
222: 
223: ### The MEMS Analogy
224: 
225: MEMS stands for **Micro-Electro-Mechanical Systems** — tiny machines that work together to achieve effects far beyond their individual size. A smartphone contains billions of MEMS: accelerometers, gyroscopes, microphones, pressure sensors. Each is small, specialized, and limited. Together, they give the phone rich awareness of its physical context.
226: 
227: HiveMind's memory works the same way. Knowledge is not stored as monolithic documents — it is decomposed into **MEMS-BRAIN pieces**: small, discrete, specialized knowledge fragments that can be retrieved, synthesized, and composed as needed.
228: 
229: A MEMS-BRAIN piece might be:
230: - A decision record (why we chose PostgreSQL over MongoDB)
231: - A pattern definition (our standard for error handling)
232: - A lesson learned (never deploy on Fridays — three incidents in Q1)
233: - A dependency fact (module X depends on Y, and this dependency is version-locked)
234: - A metric snapshot (average session recovery time is 23 seconds)
235: 
236: When an agent needs context, it does not download the entire project history. It retrieves the specific MEMS pieces relevant to its current task, and synthesizes them into working context.
237: 
238: ### The 5-Layer Memory Architecture
239: 
240: HiveMind's memory is organized in five layers, from fastest to most durable:
241: 
242: **Layer 1 — Hot RAM (Session State)**: The in-memory state of the current session. Task statuses, delegation chains, tool call counters. This is the working memory of the HIVE — fast, volatile, reset on session close. Persisted via SESSION-STATE.md and WAL (Write-Ahead Log) for crash recovery.
243: 
244: **Layer 2 — Warm (LanceDB Vectors)**: Semantic search layer. Embeddings of decisions, patterns, and lessons stored in a vector database. Enables natural-language queries like "find similar decisions to this one" or "what errors have we seen in the authentication flow?"
245: 
246: **Layer 3 — Cold (Git-Notes Knowledge Graph)**: Structured knowledge stored in git notes. Each commit that makes a significant decision gets a note with metadata: what was decided, why, what alternatives were considered, who approved it. Git notes survive repository cloning and fork — they travel with the code.
247: 
248: **Layer 4 — Archive**: Deprecated decisions, old patterns, lessons that may no longer be relevant. Kept for historical reference but not surfaced in normal queries. Accessible if explicitly requested.
249: 
250: **Layer 5 — Cloud**: Cross-repository intelligence. When multiple projects use HiveMind and opt into shared learning, their MEMS-BRAIN pieces can be shared (with appropriate privacy controls) to enable organization-wide pattern recognition.
251: 
252: ### The Core Principle: Immutable Anchors vs Searchable Memories
253: 
254: HiveMind distinguishes between two types of memory:
255: 
256: **Immutable Decision Anchors**: These are commits. When a decision is made and implemented, it is recorded in git with a message that follows a strict format: `decision: [what] — [why it matters]`. This record cannot be changed. It is an anchor that future sessions can tie to. If Session 47 disagrees with a decision from Session 12, it does not delete Session 12's record — it creates a new record explaining why the decision was reconsidered.
257: 
258: **Searchable Memories**: These are the MEMS pieces that agents retrieve during work. They are derived from commits, from tool outputs, from human feedback, but they are not the raw data — they are synthesized summaries optimized for retrieval. A human should be able to read a MEMS piece in 30 seconds and understand its relevance.
259: 
260: The distinction matters because **raw data is not knowledge**. A 5,000-line conversation dump is not context — it is context noise. A 5-sentence decision record that captures the essential reasoning is context.
261: 
262: ### The Problem Solved: Sessions No Longer Start From Zero
263: 
264: The practical impact of the MEMS-BRAIN architecture is profound:
265: 
266: Without it: Session 1 spends 2 hours establishing architectural context. Session 2 has no memory of Session 1's decisions. Session 3 spends 45 minutes re-reading old transcripts trying to find the decision that was made. Sessions 4 through 20 each repeat fragments of previous mistakes.
267: 
268: With it: Session 1 establishes architectural context, and those decisions are stored as MEMS pieces. Session 2 retrieves "relevant decisions from previous sessions" as part of its initialization. Session 3 asks "what did we decide about the authentication module?" and receives a concise answer. Sessions 4 through 20 build on verified decisions, not guesswork.
269: 
270: This is why the metaphor of the brain is apt. The HIVE is the network of specialized regions — each agent, each module, each tool. The MIND is the connective tissue that lets them share what they learn.
271: 
272: ---
273: 
274: ## 4. The MEMS-BRAIN in Practice
275: 
276: ### The Dual-Layer Continuity Model
277: 
278: HiveMind's continuity system has two layers that work together:
279: 
280: **Durable JSON Store (continuity.ts)**: The source of truth for long-term state. Every task, every delegation, every significant event is written to a JSON file that survives session boundaries. When a session resumes, it reads from this store to reconstruct context.
281: 
282: **In-Memory Maps (state.ts)**: The working state for the current session. Fast read/write access to task statuses, agent states, and tool call counts. Changes are flushed to the durable store at defined checkpoints, not on every mutation (which would be expensive).
283: 
284: This is not caching — it is ** CQRS applied to memory**: the write-side (tools) mutates the durable store; the read-side (hooks) observes events and updates the in-memory state; agents read from the in-memory state for speed but the durable store is the authority for recovery.
285: 
286: ### How Memory Is Organized: The Shelf Metaphor
287: 
288: Imagine a library where every book is a MEMS piece. The shelves are organized by domain:
289: 
290: - **Authentication shelf**: All decisions, patterns, and lessons related to auth.
291: - **Database shelf**: All decisions about data storage, migration, and queries.
292: - **API design shelf**: All contracts, versioning decisions, and error conventions.
293: - **Deployment shelf**: All rollout strategies, incident learnings, and environment configs.
294: 
295: An agent that needs to understand the auth context does not read every book in the library — it goes to the authentication shelf and retrieves the most recent, most relevant entries.
296: 
297: The shelves are maintained automatically through metadata. Every MEMS piece has tags (domain, session number, decision type, confidence level). When new pieces are added, they are tagged and shelved. When an agent queries, the system searches shelves, not full text.
298: 
299: ### Immutable Anchors in Practice: Commit as Decision Record
300: 
301: HiveMind's git workflow treats commits as **decision records**, not just change logs.
302: 
303: A commit message follows the format:
304: 
305: ```
306: [scope]: [what changed] — [why it matters]
307: 
308: [optional: alternatives considered, dependencies, related decisions]
309: ```
310: 
311: This is not a formatting convention — it is an **intentional knowledge capture act**. The commit message is the MEMS piece for this decision. It is written to be retrievable, not just readable.
312: 
313: Over time, git log becomes a **decision archive** that any future session can query. "Why did we remove the caching layer in Session 8?" becomes a `git log` query away, not an archaeological dig through Slack messages and meeting notes.
314: 
315: ### Concrete Examples of Memory Operations
316: 
317: **Example 1: Session Recovery**
318: 
319: Agent resumes after an interruption. The continuity store contains:
320: 
321: ```json
322: {
323:   "sessionId": "sess_47",
324:   "lastCheckpoint": "2026-04-10T14:23:00Z",
325:   "activeTasks": [
326:     {
327:       "taskId": "task_812",
328:       "status": "in_progress",
329:       "agent": "hivemaker",
330:       "delegatedBy": "coordinator",
331:       "returnContract": { "format": "diff", "by": "2026-04-10T15:00:00Z" },
332:       "lastToolCall": "hivemind_tool_write at 14:22:58",
333:       "checkpointNotes": "Implementing auth middleware — waiting for spec confirmation from architect"
334:     }
335:   ],
336:   "memsPieces": [
337:     { "id": "mems_201", "type": "decision", "domain": "auth", "session": "sess_12", "summary": "JWT chosen over sessions for stateless auth" },
338:     { "id": "mems_203", "type": "pattern", "domain": "auth", "session": "sess_31", "summary": "Standard middleware chain: validate → enrich → authorize" }
339:   ]
340: }
341: ```
342: 
343: The agent knows exactly where it was, what it was waiting for, and what relevant memory pieces exist. It does not need to re-read the full spec — it has a pointer to the specific decision it was waiting for.
344: 
345: **Example 2: Cross-Session Pattern Retrieval**
346: 
347: Agent encounters an authentication issue. Before proposing a fix, it queries the MEMS store:
348: 
349: ```
350: Query: "authentication errors patterns"
351: Returns:
352: - mems_156: "Session 23 — OAuth callback race condition, fixed by adding state parameter validation"
353: - mems_089: "Session 15 — JWT expiry edge case, handled by silent refresh with retry queue"
354: - mems_201: "Session 12 — Decision: JWT chosen over sessions"
355: ```
356: 
357: The agent's proposed fix now accounts for three previous incidents and one foundational decision. It does not repeat the race condition fix, it does not contradict the JWT decision, and it has context for the error it is fixing.
358: 
359: ---
360: 
361: ## 5. What HiveMind Is NOT
362: 
363: HiveMind occupies a specific position in the landscape of agentic development approaches. Understanding what it is not is as important as understanding what it is.
364: 
365: ### Not a Corporate-Spec-Driven Framework
366: 
367: Frameworks like GSD (Get Shit Done) and BMAD impose structured procedures that must be followed in sequence. They are designed for teams that need compliance — where managers need to verify that every step was followed, every gate was passed, every artifact was produced.
368: 
369: HiveMind does not impose these procedures. It provides the **infrastructure** for any procedure, including GSD or BMAD if that is what your team needs. But it does not mandate them.
370: 
371: If your team needs phase gates, you can implement them with HiveMind's hooks and tools. If your team needs to skip phases for rapid prototyping, you can do that too. HiveMind is a **platform for composing agentic workflows**, not a workflow in a box.
372: 
373: **Why This Matters for Practitioners**: If you are evaluating HiveMind and you need a framework that tells you exactly what to do at every step, you should look at GSD or BMAD. If you want infrastructure that can be configured to support your workflow — whatever your workflow is — HiveMind is designed for you.
374: 
375: ### Not the All-In-SOTA Harness
376: 
377: Oh-My-OpenAgents (OMO) is an ambitious project that aims to provide a fully autonomous agentic coding system — one that can handle entire features from intent to deployment with minimal human intervention. It represents the "maximum autonomy" end of the spectrum.
378: 
379: HiveMind is not that. HiveMind is **collaborative** by default. It assumes that humans and agents work together, that humans provide intent and verify outcomes, and that agents provide execution and pattern recognition. Full autonomy is available as an option (through the task queuing and auto-loop features), but it is not the default mode.
380: 
381: **Why This Matters for Practitioners**: If you want agents that operate fully autonomously while you sleep, OMO may be a better fit. If you want agents that work alongside you, challenge your assumptions, suggest alternatives, and learn from your feedback, HiveMind is designed for you.
382: 
383: ### Not a Framework for Nerds
384: 
385: This is perhaps the most important distinction. HiveMind does not require deep expertise in agentic systems, prompt engineering, or any specific technology stack to get value from it. It is designed to be ** approachable** — to meet users at their current level of expertise and help them grow.
386: 
387: The "bite-sized, systematic guidance" mentioned in the brief is not marketing copy. It describes a deliberate design philosophy: every task, no matter how complex, can be decomposed into steps small enough for a non-expert to understand and verify. The human does not need to know how the agent works internally — they need to know whether the output is what they asked for.
388: 
389: **Why This Matters for Practitioners**: If you are an experienced developer who wants fine-grained control over every agent behavior, HiveMind gives you that — but it does not require it. If you are a product manager who wants to use agents to explore technical feasibility without becoming a systems architect, HiveMind supports that too.
390: 
391: ---
392: 
393: ## 6. The Human-Agent Collaboration Model
394: 
395: ### The Cognitive Layers Concept
396: 
397: HiveMind's collaboration model is built on the idea of **cognitive layers** — different levels of awareness and responsibility that humans and agents occupy.
398: 
399: **Human Layer**: Intent, judgment, verification. Humans define what they want. Humans decide whether what was delivered matches what was asked. Humans provide the "why" that agents cannot infer.
400: 
401: **Agent Layer**: Execution, pattern recognition, context retrieval. Agents do the work. Agents notice patterns in code and suggest improvements. Agents maintain the MEMS-BRAIN and surface relevant memories at the right time.
402: 
403: **Shared Layer**: The HIVE's file tree, the MIND's memory store, the delegation chain. Both humans and agents can read from this layer. Both can write to it (with appropriate permissions). This is the collaboration surface.
404: 
405: The magic of HiveMind is in the **Shared Layer**. When an agent retrieves a MEMS piece from Session 12 and synthesizes it into its context, the human who made that decision in Session 12 is collaborating across time. When a human reviews an agent's proposed implementation and provides feedback, they are collaborating across the cognitive layers.
406: 
407: ### The "Wanders-of-Curiosity" Philosophy
408: 
409: HiveMind is designed for people who **explore**. Not just people who have clear requirements and want them implemented — but people who want to understand a domain, who want to experiment with different approaches, who want to follow a thread of curiosity wherever it leads.
410: 
411: The brief mentions "the most wanders-of-curiosity individuals" and this is not an accident. HiveMind is built for people who find the journey as valuable as the destination. Who want to understand *why* the architecture is the way it is, not just *that* it is. Who are willing to try things that fail so they can learn why they failed.
412: 
413: This is in contrast to agentic systems that optimize for throughput — maximizing the number of tasks completed per hour. HiveMind optimizes for **compounded learning** — ensuring that every experiment, success or failure, makes future work better.
414: 
415: ### How Agents Adapt and Grow
416: 
417: Agents in HiveMind grow through three mechanisms:
418: 
419: **Experience Accumulation**: Every task completed, every delegation handled, every error encountered is recorded as a MEMS piece. Over time, agents operating in a HiveMind ecosystem benefit from the accumulated experience of all previous agents.
420: 
421: **Feedback Integration**: When a human corrects an agent's work, that correction is stored as a MEMS piece. Future agents retrieve it: "Human corrected my predecessor on this pattern because..."
422: 
423: **Pattern Recognition**: Over multiple sessions, agents begin to recognize patterns in the project's evolution. "This team tends to revisit authentication decisions after 3 months — I should flag this as a candidate for early architectural review."
424: 
425: This is not science fiction. It is the natural output of an architecture that takes memory seriously.
426: 
427: ---
428: 
429: ## 7. Key Architectural Principles
430: 
431: ### The CQRS Pattern: Tools = Write-Side, Hooks = Read-Side
432: 
433: HiveMind's architecture enforces a strict separation between **state mutation** and **state observation**:
434: 
435: - **Tools** are the only mechanism that can mutate state. Every tool call is validated, logged, and recorded in the trajectory store. If it is not a tool call, it cannot change system state.
436: 
437: - **Hooks** observe events and enrich context. They watch for task creation, delegation, completion, and error — and inject relevant context into the agent's view. They cannot mutate state.
438: 
439: This is not a convenience pattern — it is a **safety guarantee**. When you know that only five tools can change state, you can audit every state change by reading five tool implementations. When any component can mutate state, auditing becomes impossible.
440: 
441: ### The Plugin as Zero-Logic Assembly
442: 
443: The plugin (`plugin.ts`) is the composition root that wires tools and hooks into OpenCode. Its implementation target is **under 100 LOC** — not because of arbitrary size limits, but because the composition logic should be trivial. If the plugin is complex, the complexity belongs in the tools and hooks, not in the assembly.
444: 
445: This is the **single responsibility principle applied to architecture**: the plugin's job is wiring, not business logic. Business logic lives in tools (which are focused on their specific mutations) and hooks (which are focused on their specific observations).
446: 
447: ### Why These Matter for Reliability and Composability
448: 
449: The CQRS separation and the zero-logic plugin are not academic preferences. They have practical implications for reliability:
450: 
451: **Auditability**: When something goes wrong, you can trace every state change to a specific tool call. You do not need to wonder "how did the task status get corrupted?" — you read the trajectory store and see the sequence of tool calls that led to the corruption.
452: 
453: **Testability**: Tools can be tested in isolation because they have clear inputs and outputs. Hooks can be tested by firing synthetic events and verifying context enrichment. The plugin can be tested by composing test tools and hooks and verifying they connect correctly.
454: 
455: **Composability**: Because the plugin has no business logic, you can swap tools in and out without changing the plugin. Want to add a new tool? Write the tool, register it with the plugin. The rest of the system does not care.
456: 
457: ---
458: 
459: ## 8. Conclusion
460: 
461: HiveMind's philosophy — **Agents' Intelligence = HIVE + MIND** — is a statement about where intelligence comes from.
462: 
463: Not from bigger models. Not from more tokens. Not from cleverer prompts.
464: 
465: Intelligence comes from **architecture**. From the HIVE's structure that keeps agents working on the right things, in the right order, within the right boundaries. From the MIND's memory that ensures every lesson learned survives session boundaries and becomes available to future sessions.
466: 
467: The five pillars are not independent principles — they are interlocking constraints that reinforce each other:
468: 
469: - **Hierarchical Superiority** ensures that dependencies are satisfied before work begins.
470: - **Collaborative Domains** ensure that agents operate within clear boundaries and report up the chain.
471: - **Strategically Measurable** ensures that success is defined before work starts and verified after it completes.
472: - **Iteratively Granular** ensures that work is broken down small enough to be safe and correctable.
473: - **Growing MEMS-BRAIN** ensures that intelligence accumulates across sessions rather than resetting.
474: 
475: Together, these pillars create a system where agents do not just execute tasks — they **build on each other's work**. Where mistakes from Session 3 are visible to Session 47. Where the team's collective knowledge — architectural decisions, pattern preferences, incident learnings — is not trapped in the heads of individuals but stored in an accessible, retrievable form.
476: 
477: **What HiveMind Enables**:
478: 
479: For **developers**: A system that remembers your project's context, that does not require you to re-explain your codebase to every new session, that catches conflicts before they become bugs.
480: 
481: For **technical leads**: A system that enforces architectural discipline without micromanagement, that provides visibility into agent workflows, that makes delegation safe through structured contracts.
482: 
483: For **product managers**: A system that breaks complex work into verifiable chunks, that involves humans at the right gates, that delivers not just completion but evidence of quality.
484: 
485: For **organizations**: A system that compounds intelligence over time, where every project contributes to a growing knowledge base, where agentic best practices can be shared across teams without violating project isolation.
486: 
487: HiveMind is not a framework you must conform to. It is an architecture you can adopt — in full, or in part. You can start with the Hard Harness and the basic delegation protocol. You can add skills as you need them. You can implement the MEMS-BRAIN on day one or grow into it over time.
488: 
489: The HIVE and the MIND are not destinations — they are directions. Every decision about where to place a boundary, how to tag a MEMS piece, when to enforce a guardrail, is a step toward a system that is genuinely intelligent: not because it contains a powerful model, but because it has the architecture to support and amplify that model's capabilities.
490: 
491: Welcome to HiveMind.
492: 
493: ---
494: 
495: **Document Information**
496: 
497: - **Word Count**: ~3,800 words
498: - **Last Updated**: 2026-04-10
499: - **Status**: Publication-ready
500: - **Next Review**: Upon significant architectural changes

(End of file - total 500 lines)
</content>

## USER (turn 2)

**source:** real-human

Route to the appropriate exploration / capture skill based on the user's intent.
`hm-note`, `hm-add-todo`, `hm-add-backlog`, and `hm-plant-seed` were folded
into `hm-capture` (with `--note`, default, `--backlog`, `--seed` modes) by
#2790. The capture target lists pending todos via `--list`.

| User wants | Invoke |
|---|---|
| Explore an idea or opportunity | hm-explore |
| Sketch out a rough design or plan | hm-sketch |
| Time-boxed technical spike | hm-spike |
| Write a spec for a phase | hm-spec-phase |
| Capture a thought (todo / note / backlog / seed) | hm-capture |

Invoke the matched skill directly using the Skill tool.

this is going to be an intensive research base on this @repo-for-learning-and-synthesis.md  the current coordination, delagation features, custom-dlegate task and to fulfil and integrate the very underdeveloped feature "background-command" "interactive bash command" and the very nowadays subagents, delegation and orchestration logics utilizing Tmux which you can find in nowadays famous Tmux utilization as found in OMO repo tmux, Hermes and OpenClaw (outside sources please research) - tell me what can we utilize Tmux into our Hivemind and the OpenCode runtime and development process in knowing of our @docs/philosophy/HIVEMIND-PHILOSOPHY.md and the effort we are trying to surpass OMO in terms of more collaborative, intelligent and self-sustained orchestration of mutiple persistant sub tasks with context utilizing the system of our hm-* agents, commands, skills, workflwos, governance, inheriting permissions, tools and custom tools, mcp server tools and others  of the OpenCode primitives - we used to plan for such but it is some past research that I am unable to find 
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
Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/docs/philosophy/HIVEMIND-PHILOSOPHY.md"}
<path>/Users/apple/hivemind-plugin-private/docs/philosophy/HIVEMIND-PHILOSOPHY.md</path>
<type>file</type>
<content>
1: # HIVEMIND PHILOSOPHY: Agents' Intelligence = HIVE + MIND
2: 
3: **Document Version**: 1.0
4: **Date**: 2026-04-10
5: **Status**: Publication-Ready
6: **Audience**: Business stakeholders, senior engineers, technical product managers
7: 
8: ---
9: 
10: ## Executive Summary
11: 
12: HiveMind is a runtime composition engine that makes agents genuinely intelligent — not through more tokens, not through bigger models, but through **architecture**. Specifically, through the marriage of two forces: the **HIVE** and the **MIND**.
13: 
14: The HIVE is structure. It is the systematic file trees, the hierarchical dependencies, the domain boundaries, the delegation protocols, and the guardrails that keep agents from wandering off into hallucinated wildernesses. The HIVE is how multiple agents collaborate without colliding, how work flows up and down a chain of command without breaking, how every task decomposes into bite-sized pieces small enough to verify and small enough to trust.
15: 
16: The MIND is memory. It is the accumulated intelligence of every session, every decision, every successful experiment and every failed one. Where other agentic systems reset to zero every time a new session starts, HiveMind remembers. The MIND is not a dump of conversation history — it is a living, organized knowledge system where Micro-Electro-Mechanical knowledge Pieces (MEMS) are collected, organized, and retrieved as synthesized understanding when needed.
17: 
18: Together, HIVE + MIND = Intelligence that compounds over time.
19: 
20: HiveMind is not a framework you must conform to. It is not a rigid methodology demanding specific procedures or toolchains. It is an **open architecture** — a runtime composition engine that can host GSD-style phase-gated workflows, BMAD-style constraints, or OMO-style autonomous agents, depending on what your project needs. It meets you where you are and grows with you.
21: 
22: This philosophy document explains why HiveMind exists, what it believes, how it works, and — equally important — what it is not.
23: 
24: ---
25: 
26: ## 1. The Core Thesis: Intelligence Through Architecture
27: 
28: ### The Problem With Today's Agentic Systems
29: 
30: Modern AI coding assistants are powerful but **memoryless**. Each session starts from scratch. The model may have seen millions of codebases in training, but it has never worked with *your* codebase before. It does not know which architectural decisions your team made last quarter, which conventions you established, which patterns failed in production, or which decisions are sacred contracts that should not be broken.
31: 
32: This memorylessness creates a fundamental inefficiency: agents repeat mistakes. They miss context that humans spent weeks establishing. They propose solutions that conflict with earlier decisions because they cannot see those decisions. The result is agents that are individually brilliant but collectively naive.
33: 
34: ### The HiveMind Thesis
35: 
36: HiveMind's core thesis is that **agent intelligence is not a property of the model — it is a property of the architecture surrounding the model**.
37: 
38: A single agent, no matter how capable, cannot hold the full context of a complex project across sessions. But a **hierarchy of agents**, each with defined domain boundaries and shared access to accumulated memory, can build on previous work rather than starting over. Intelligence emerges from collaboration and continuity, not from any single agent's raw capability.
39: 
40: This is what we mean by **HIVE + MIND**:
41: 
42: - **The HIVE** is the structural architecture — the hierarchy, the domains, the delegation protocols, the guardrails. It ensures agents work on the right things, report to the right supervisors, and never step outside their authorized boundaries.
43: 
44: - **The MIND** is the accumulated intelligence — the memory of past sessions, the pattern library, the decision anchors. It ensures agents do not repeat mistakes, can retrieve relevant context from previous work, and grow more capable over time.
45: 
46: Intelligence, in this framework, is not an input to the system. It is an **output** of the architecture.
47: 
48: ### Why Hierarchy Matters
49: 
50: Hierarchy is not bureaucracy. Hierarchy is **safety through dependency ordering**.
51: 
52: Consider: in a correct dependency tree, a child module cannot exist before its parent. A feature cannot be implemented before its interface is defined. A test cannot pass before the code it tests exists. These are not arbitrary rules — they reflect the natural structure of complex systems.
53: 
54: HiveMind's **Hierarchical Superiority** pillar enforces this structure in agent workflows. Before an agent implements anything, it must verify that all dependencies are satisfied. Before a subagent can act, its parent agent must authorize the delegation. This creates a chain of custody and a chain of comprehension: every decision is made at the right level, by the right agent, with the right context.
55: 
56: For non-technical readers: imagine a construction project where every worker knew not just their own task, but why their task depends on the previous worker's task. The foundation must come before the walls. The walls before the roof. Agents operating in a hierarchy understand this instinctively — not because they were told to follow rules, but because the architecture makes correct behavior the path of least resistance.
57: 
58: For technical readers: HiveMind implements this through a CQRS pattern where tools are the write-side (state mutation) and hooks are the read-side (context injection). The plugin assembly wires them together with zero business logic, ensuring the architecture itself enforces boundaries rather than relying on agent goodwill.
59: 
60: ### Why Local-Side-Safe Infrastructure Matters
61: 
62: The most dangerous moment in an agentic workflow is when an agent operates without visibility into system state — when it makes assumptions about the environment that may no longer be true, or when it proposes changes that conflict with changes made by another agent in parallel.
63: 
64: HiveMind's infrastructure is designed to be **local-side-safe**: agents can inspect their own state, the state of their tasks, and the trajectory of their delegation chain at any time. They do not need to guess. They can verify.
65: 
66: This is implemented through a dual-layer continuity model: durable JSON persistence for long-term state (the MIND's memory) and in-memory Maps for session-specific state (the HIVE's working memory). When an agent resumes after an interruption, it reconstructs its context from the continuity store, not from fragile conversation history.
67: 
68: ---
69: 
70: ## 2. The Two Halves of HiveMind
71: 
72: HiveMind is architecturally divided into two halves that must never be confused, because they serve fundamentally different purposes.
73: 
74: ### Half 1: The Hard Harness (Runtime Composition Engine)
75: 
76: The Hard Harness is the **engine** — the npm package (`opencode-hivemind`) that provides the runtime primitives agents actually execute. It is distributed as a standard Node.js package, versioned, tested, and installed like any other dependency.
77: 
78: The Hard Harness contains:
79: 
80: **Tools (Write-Side, CQRS)**: Five core tools with Zod schemas that mutate state. These are the only mechanisms that can change system state — creating tasks, delegating work, recording trajectory, updating continuity. Every tool call is validated, typed, and logged. There is no implicit state mutation, no side-channel writes, no shadow state competing with the runtime truth.
81: 
82: **Hooks (Read-Side, CQRS)**: Event observers that inject context but never mutate state. These watch for session start, tool execution, delegation events, and task completion — and enrich the agent's context accordingly. Hooks are how the MIND becomes visible to agents: by observing events and recording them in the continuity store, hooks make past sessions retrievable by future sessions.
83: 
84: **Plugin (Assembly)**: A thin composition root (~57 LOC target, currently ~447 LOC) that wires tools and hooks into OpenCode. It contains zero business logic. Its only job is assembly — connecting the write-side tools to their handlers, the read-side hooks to their event sources, and the shared utilities to both.
85: 
86: **Shared (Leaf Module)**: Pure utilities with no dependencies. Types, helpers, concurrency primitives, error definitions. The leaf is where the buck stops — no circular imports, no upward dependencies, no mystery.
87: 
88: ### Half 2: The Soft Meta-Concepts (User-Configurable)
89: 
90: The Soft Meta-Concepts are the **mind** — the instructions, definitions, and behavioral patterns that tell agents how to use the Hard Harness. They live in the project's `.opencode/` directory and are version-controlled alongside the codebase, not in an external package.
91: 
92: The Soft Meta-Concepts include:
93: 
94: **Skills** (SKILL.md + scripts): Portable instruction packages that teach agents how to approach specific task types. Skills are the primary way users extend HiveMind's capabilities. A skill might teach an agent how to run a GSD-style phase loop, how to perform deep research using Tavily, or how to validate a spec against implementation. Skills are not code — they are knowledge transfer in document form.
95: 
96: **Agents**: OpenCode agent definitions with permission profiles. Each agent has a defined role (architect, planner, builder, debugger, reviewer), a temperature setting, tool access permissions, and a system prompt that encodes its responsibilities. Agents are not magic — they are configurations with names.
97: 
98: **Commands**: Reusable command bundles with YAML frontmatter. Commands are CLI-style entry points that invoke specific workflows — `start-work`, `deep-research`, `plan`, `ultrawork`. They encapsulate common task patterns so agents (and humans) do not have to reconstruct them from scratch each time.
99: 
100: **Rules**: Behavioral constraints that govern agent behavior. Rules are not suggestions — they are hard boundaries. A rule might specify that no module may exceed 500 LOC, or that every delegation must carry a return contract, or that tools may not mutate state outside their declared schema.
101: 
102: **Permissions**: Tool, skill, and command access control. Not every agent needs every tool. Permissions ensure that a junior builder agent cannot accidentally invoke administrative commands, and that a specialized debug agent has elevated access to diagnostic tools.
103: 
104: **Custom Tools**: User-authored tools with Zod schemas. When the five core tools are insufficient, users can define their own tools and register them with the plugin. Custom tools go through the same validation and safety checks as core tools.
105: 
106: ### Why This Separation Matters
107: 
108: The Hard Harness is stable. It is tested, versioned, and deployed like infrastructure. The Soft Meta-Concepts are flexible. They evolve with the project, get refined through use, and reflect the project's actual practices rather than generic defaults.
109: 
110: This separation is what makes HiveMind a **runtime composition engine** rather than a static framework. You do not fork the Hard Harness to customize behavior — you compose Soft Meta-Concepts on top of it. The engine stays constant; the mind adapts.
111: 
112: ---
113: 
114: ## 3. The 5 Pillars of HiveMind Practice
115: 
116: HiveMind's philosophy is implemented through five pillars — design principles that govern every architectural decision, every tool design, and every workflow pattern.
117: 
118: ### 3.1 Pillar 1: Hierarchical Superiority
119: 
120: **The Principle**: Everything — documents, workflows, synthesis, delegation — must be sorted into a systematic file tree where parent dependencies are satisfied before child actions are attempted.
121: 
122: **Why It Matters**: In complex systems, the most common source of failure is not bad implementation — it is ** premature implementation**. An agent implements a feature before its interface is finalized. A subagent changes an API that its sibling depends on. A test passes locally but fails in integration because it assumed a dependency that was not yet built.
123: 
124: Hierarchical Superiority prevents these failures by making dependency satisfaction a **structural requirement**, not a social convention.
125: 
126: **What It Looks Like in Practice**:
127: 
128: In the file system: HiveMind's architecture enforces a strict directory structure where `types.ts` is a leaf (no dependencies), `lifecycle-manager.ts` depends on most modules, and the `plugin.ts` composition root depends on everything. No circular imports. No mystery dependencies creeping in sideways.
129: 
130: In workflows: Before a builder agent implements a feature, it must receive authorization from the architect agent, which must have received the spec from the planner agent, which must have received the intent from the human operator. Each layer passes down not just the task, but the **chain of reasoning** that justifies the task.
131: 
132: In delegation: Every delegation carries a return contract — what the subagent must produce, in what format, by when. The parent agent cannot close a task until the return contract is satisfied. This is not micromanagement — it is **structured trust** that enables safe autonomy.
133: 
134: **The Safety Argument**: When everything has a defined place in a hierarchy, it becomes possible to verify correctness by inspection. You can ask: "Does this module have all its dependencies satisfied?" You can answer: "Yes, because the dependency graph says so." Without hierarchy, verification requires running everything and hoping for the best.
135: 
136: ### 3.2 Pillar 2: Collaborative Domains
137: 
138: **The Principle**: Every agent operates within a defined domain boundary. Delegation is controlled. Reports flow up and down the hierarchy. The team — human and agent alike — shares the same long-term knowledge.
139: 
140: **Why It Matters**: A single agent doing everything is not an agentic system — it is a very expensive autocomplete. Real agentic intelligence emerges when multiple specialized agents can collaborate without colliding, each doing what it does best while the system coordinates their efforts.
141: 
142: But collaboration without boundaries is chaos. An agent that can touch anything can break anything. An agent that cannot see its context cannot make informed decisions. An agent that never reports its findings cannot contribute to collective intelligence.
143: 
144: Collaborative Domains solves this through **bounded autonomy**: every agent has a domain, every domain has boundaries, and every cross-domain operation requires explicit authorization.
145: 
146: **What It Looks Like in Practice**:
147: 
148: Domain boundaries are enforced through permissions. The `hivehealer` (debug) agent has access to diagnostic tools and state inspection tools, but not to architectural refactoring tools or deployment tools. The `hivemaker` (builder) agent has access to code implementation tools, but not to agent configuration tools. This is not a limitation — it is **safety through scope reduction**.
149: 
150: Delegation flows through explicit channels. A coordinator agent does not simply hand off work to any available specialist — it delegates to an agent whose domain encompasses the task, with explicit constraints and a return contract. The delegation is logged in the trajectory store, visible to the supervisor chain.
151: 
152: Reporting is bidirectional. Agents report not just completion, but findings. If a builder agent discovers an architectural issue while implementing a feature, it does not silently work around it — it reports up the chain to the architect agent, who updates the spec. This is how the HIVE accumulates the MIND: through structured reporting that feeds the continuity store.
153: 
154: **The Growth Argument**: When agents and humans share the same long-term knowledge base, they grow together. The human learns what the agents are capable of. The agents learn what the human values. Over time, the collaboration becomes more efficient because both parties are working from the same context.
155: 
156: ### 3.3 Pillar 3: Strategically Measurable
157: 
158: **The Principle**: Every outcome must be measurable through both quantitative and qualitative metrics. Guardrails are incremental. Standards are proven, not assumed. Nothing is complete until it is verified.
159: 
160: **Why It Matters**: The most dangerous phrase in agentic development is "I think it's working." Confidence without measurement is guesswork. And guesswork compounds — a small error in session 1 becomes a large confusion in session 10 when subsequent sessions build on unverified assumptions.
161: 
162: Strategically Measurable requires that every task have **defined success criteria before it begins**, and that those criteria be verified **both automatically and through human review**.
163: 
164: **What It Looks Like in Practice**:
165: 
166: HiveMind uses a "2-End-Extreme Metrics" system. Every metric must satisfy two bounds:
167: 
168: - **Programmatic/E2E Testable**: Every metric has an automated verification mechanism. If a metric cannot be tested automatically, it must be explicitly flagged as requiring human judgment — and that judgment must be recorded.
169: 
170: - **Scale-Measurable**: Metrics can be quantified. "Better" is not a metric. "47% reduction in context-miss rate across 12 sessions" is a metric.
171: 
172: Additionally, every metric must be:
173: - **Scope-Aware**: Respects bounded context. Cross-boundary metrics require explicit mapping.
174: - **Responsibility-Centric**: Each agent owns specific metrics that map to its role in the hierarchy.
175: - **Integration-Aware**: Accounts for dependency chains. Sequential blocking is measured.
176: 
177: **The Guardrail Argument**: Incremental guardrails are safer than monolithic gates. Rather than one big verification at the end of a project (which will inevitably find problems that are expensive to fix), HiveMind implements small gates at each phase transition. A task cannot proceed from "planned" to "implemented" until its planning criteria are verified. It cannot proceed from "implemented" to "verified" until its implementation criteria are met.
178: 
179: This is **progressive trust-building**: each successful gate increases confidence incrementally, so by the time a feature reaches completion, the team has accumulated evidence rather than just hope.
180: 
181: ### 3.4 Pillar 4: Iteratively Granular
182: 
183: **The Principle**: Break everything down small enough to verify, small enough to trust, small enough to retry on failure. Loop until correct. Perfect is not a one-pass achievement — it is an iterative process.
184: 
185: **Why It Matters**: Large tasks fail in large ways. A 2,000-line module that fails testing requires debugging in a 2,000-line context. A 200-line module that fails testing requires debugging in a 200-line context. A 20-line function that fails testing is almost self-evident.
186: 
187: Granularity is not just about code. It is about **cognitive load management**. An agent (or a human) working on a large, undefined task will inevitably make decisions without full context, will miss edge cases, will build on shaky foundations. Breaking the task down forces clarity: if you cannot decompose a task into verifiable subtasks, you do not understand the task.
188: 
189: **What It Looks Like in Practice**:
190: 
191: HiveMind enforces strict granularity limits:
192: 
193: - Code LOC per file: ≤300
194: - Interface fields: ≤10
195: - Function complexity: Chain-breaking
196: 
197: These are not aesthetic preferences — they are **cognitive safety limits**. A 300-line file can be held in working memory. A 10-field interface can be reasoned about without a diagram. A chain-breaking function does not hide its complexity behind layers of indirection.
198: 
199: Task decomposition follows the same principle. A feature does not go from "intent" to "implemented" in one delegation. It goes through a chain: intent → spec → plan → implement → verify → integrate. Each step produces artifacts that the next step consumes. Each step's output is verified before the next step begins.
200: 
201: **The Iteration Argument**: Perfection is not achieved on the first pass. It is achieved through cycles of attempt, feedback, and refinement. Iteratively Granular enables this by making each cycle small enough to be safe. When a cycle fails, you know exactly where it failed, and you can retry just that cycle rather than the entire effort.
202: 
203: ### 3.5 Pillar 5: Growing MEMS-BRAIN
204: 
205: **The Principle**: The HIVE collects intelligence incrementally across all sessions, agents, and human explorations. The MIND shares this accumulated knowledge adaptively, retrieving synthesized understanding as a unified whole. Memory is selective retrieval, not dump mining.
206: 
207: **Why This Is the Most Important Pillar**: Every other pillar describes how to work correctly in a single session. This pillar describes how to **accumulate intelligence across sessions** — how to ensure that work done in Session 1 is visible and useful to Session 47.
208: 
209: Without this pillar, HiveMind would be an elaborate project management system with good intentions but no long-term memory. Every session would start from zero. Every mistake would be repeated. The "intelligence" would be an illusion — clever choreography without actual learning.
210: 
211: With this pillar, HiveMind becomes something different: a system that **compounds intelligence over time**.
212: 
213: ### The Problem With Most Agentic Systems
214: 
215: Most agentic systems have what we call **persistence without intelligence**. They save conversation history. They store tool outputs. They maintain state files. But this is not memory — it is a dump. The difference matters:
216: 
217: - **Dump mining** is when an agent retrieves a large chunk of past conversation and tries to make sense of it. This is expensive, slow, and unreliable. The agent must re-parse and re-contextualize raw data every time.
218: 
219: - **Selective retrieval** is when an agent can ask a question and receive a precise, synthesized answer from a memory system that understood what was important. "What was the decision we made about the authentication module in session 12?" should return a concise answer, not a 400-line transcript.
220: 
221: HiveMind's MEMS-BRAIN is built for selective retrieval.
222: 
223: ### The MEMS Analogy
224: 
225: MEMS stands for **Micro-Electro-Mechanical Systems** — tiny machines that work together to achieve effects far beyond their individual size. A smartphone contains billions of MEMS: accelerometers, gyroscopes, microphones, pressure sensors. Each is small, specialized, and limited. Together, they give the phone rich awareness of its physical context.
226: 
227: HiveMind's memory works the same way. Knowledge is not stored as monolithic documents — it is decomposed into **MEMS-BRAIN pieces**: small, discrete, specialized knowledge fragments that can be retrieved, synthesized, and composed as needed.
228: 
229: A MEMS-BRAIN piece might be:
230: - A decision record (why we chose PostgreSQL over MongoDB)
231: - A pattern definition (our standard for error handling)
232: - A lesson learned (never deploy on Fridays — three incidents in Q1)
233: - A dependency fact (module X depends on Y, and this dependency is version-locked)
234: - A metric snapshot (average session recovery time is 23 seconds)
235: 
236: When an agent needs context, it does not download the entire project history. It retrieves the specific MEMS pieces relevant to its current task, and synthesizes them into working context.
237: 
238: ### The 5-Layer Memory Architecture
239: 
240: HiveMind's memory is organized in five layers, from fastest to most durable:
241: 
242: **Layer 1 — Hot RAM (Session State)**: The in-memory state of the current session. Task statuses, delegation chains, tool call counters. This is the working memory of the HIVE — fast, volatile, reset on session close. Persisted via SESSION-STATE.md and WAL (Write-Ahead Log) for crash recovery.
243: 
244: **Layer 2 — Warm (LanceDB Vectors)**: Semantic search layer. Embeddings of decisions, patterns, and lessons stored in a vector database. Enables natural-language queries like "find similar decisions to this one" or "what errors have we seen in the authentication flow?"
245: 
246: **Layer 3 — Cold (Git-Notes Knowledge Graph)**: Structured knowledge stored in git notes. Each commit that makes a significant decision gets a note with metadata: what was decided, why, what alternatives were considered, who approved it. Git notes survive repository cloning and fork — they travel with the code.
247: 
248: **Layer 4 — Archive**: Deprecated decisions, old patterns, lessons that may no longer be relevant. Kept for historical reference but not surfaced in normal queries. Accessible if explicitly requested.
249: 
250: **Layer 5 — Cloud**: Cross-repository intelligence. When multiple projects use HiveMind and opt into shared learning, their MEMS-BRAIN pieces can be shared (with appropriate privacy controls) to enable organization-wide pattern recognition.
251: 
252: ### The Core Principle: Immutable Anchors vs Searchable Memories
253: 
254: HiveMind distinguishes between two types of memory:
255: 
256: **Immutable Decision Anchors**: These are commits. When a decision is made and implemented, it is recorded in git with a message that follows a strict format: `decision: [what] — [why it matters]`. This record cannot be changed. It is an anchor that future sessions can tie to. If Session 47 disagrees with a decision from Session 12, it does not delete Session 12's record — it creates a new record explaining why the decision was reconsidered.
257: 
258: **Searchable Memories**: These are the MEMS pieces that agents retrieve during work. They are derived from commits, from tool outputs, from human feedback, but they are not the raw data — they are synthesized summaries optimized for retrieval. A human should be able to read a MEMS piece in 30 seconds and understand its relevance.
259: 
260: The distinction matters because **raw data is not knowledge**. A 5,000-line conversation dump is not context — it is context noise. A 5-sentence decision record that captures the essential reasoning is context.
261: 
262: ### The Problem Solved: Sessions No Longer Start From Zero
263: 
264: The practical impact of the MEMS-BRAIN architecture is profound:
265: 
266: Without it: Session 1 spends 2 hours establishing architectural context. Session 2 has no memory of Session 1's decisions. Session 3 spends 45 minutes re-reading old transcripts trying to find the decision that was made. Sessions 4 through 20 each repeat fragments of previous mistakes.
267: 
268: With it: Session 1 establishes architectural context, and those decisions are stored as MEMS pieces. Session 2 retrieves "relevant decisions from previous sessions" as part of its initialization. Session 3 asks "what did we decide about the authentication module?" and receives a concise answer. Sessions 4 through 20 build on verified decisions, not guesswork.
269: 
270: This is why the metaphor of the brain is apt. The HIVE is the network of specialized regions — each agent, each module, each tool. The MIND is the connective tissue that lets them share what they learn.
271: 
272: ---
273: 
274: ## 4. The MEMS-BRAIN in Practice
275: 
276: ### The Dual-Layer Continuity Model
277: 
278: HiveMind's continuity system has two layers that work together:
279: 
280: **Durable JSON Store (continuity.ts)**: The source of truth for long-term state. Every task, every delegation, every significant event is written to a JSON file that survives session boundaries. When a session resumes, it reads from this store to reconstruct context.
281: 
282: **In-Memory Maps (state.ts)**: The working state for the current session. Fast read/write access to task statuses, agent states, and tool call counts. Changes are flushed to the durable store at defined checkpoints, not on every mutation (which would be expensive).
283: 
284: This is not caching — it is ** CQRS applied to memory**: the write-side (tools) mutates the durable store; the read-side (hooks) observes events and updates the in-memory state; agents read from the in-memory state for speed but the durable store is the authority for recovery.
285: 
286: ### How Memory Is Organized: The Shelf Metaphor
287: 
288: Imagine a library where every book is a MEMS piece. The shelves are organized by domain:
289: 
290: - **Authentication shelf**: All decisions, patterns, and lessons related to auth.
291: - **Database shelf**: All decisions about data storage, migration, and queries.
292: - **API design shelf**: All contracts, versioning decisions, and error conventions.
293: - **Deployment shelf**: All rollout strategies, incident learnings, and environment configs.
294: 
295: An agent that needs to understand the auth context does not read every book in the library — it goes to the authentication shelf and retrieves the most recent, most relevant entries.
296: 
297: The shelves are maintained automatically through metadata. Every MEMS piece has tags (domain, session number, decision type, confidence level). When new pieces are added, they are tagged and shelved. When an agent queries, the system searches shelves, not full text.
298: 
299: ### Immutable Anchors in Practice: Commit as Decision Record
300: 
301: HiveMind's git workflow treats commits as **decision records**, not just change logs.
302: 
303: A commit message follows the format:
304: 
305: ```
306: [scope]: [what changed] — [why it matters]
307: 
308: [optional: alternatives considered, dependencies, related decisions]
309: ```
310: 
311: This is not a formatting convention — it is an **intentional knowledge capture act**. The commit message is the MEMS piece for this decision. It is written to be retrievable, not just readable.
312: 
313: Over time, git log becomes a **decision archive** that any future session can query. "Why did we remove the caching layer in Session 8?" becomes a `git log` query away, not an archaeological dig through Slack messages and meeting notes.
314: 
315: ### Concrete Examples of Memory Operations
316: 
317: **Example 1: Session Recovery**
318: 
319: Agent resumes after an interruption. The continuity store contains:
320: 
321: ```json
322: {
323:   "sessionId": "sess_47",
324:   "lastCheckpoint": "2026-04-10T14:23:00Z",
325:   "activeTasks": [
326:     {
327:       "taskId": "task_812",
328:       "status": "in_progress",
329:       "agent": "hivemaker",
330:       "delegatedBy": "coordinator",
331:       "returnContract": { "format": "diff", "by": "2026-04-10T15:00:00Z" },
332:       "lastToolCall": "hivemind_tool_write at 14:22:58",
333:       "checkpointNotes": "Implementing auth middleware — waiting for spec confirmation from architect"
334:     }
335:   ],
336:   "memsPieces": [
337:     { "id": "mems_201", "type": "decision", "domain": "auth", "session": "sess_12", "summary": "JWT chosen over sessions for stateless auth" },
338:     { "id": "mems_203", "type": "pattern", "domain": "auth", "session": "sess_31", "summary": "Standard middleware chain: validate → enrich → authorize" }
339:   ]
340: }
341: ```
342: 
343: The agent knows exactly where it was, what it was waiting for, and what relevant memory pieces exist. It does not need to re-read the full spec — it has a pointer to the specific decision it was waiting for.
344: 
345: **Example 2: Cross-Session Pattern Retrieval**
346: 
347: Agent encounters an authentication issue. Before proposing a fix, it queries the MEMS store:
348: 
349: ```
350: Query: "authentication errors patterns"
351: Returns:
352: - mems_156: "Session 23 — OAuth callback race condition, fixed by adding state parameter validation"
353: - mems_089: "Session 15 — JWT expiry edge case, handled by silent refresh with retry queue"
354: - mems_201: "Session 12 — Decision: JWT chosen over sessions"
355: ```
356: 
357: The agent's proposed fix now accounts for three previous incidents and one foundational decision. It does not repeat the race condition fix, it does not contradict the JWT decision, and it has context for the error it is fixing.
358: 
359: ---
360: 
361: ## 5. What HiveMind Is NOT
362: 
363: HiveMind occupies a specific position in the landscape of agentic development approaches. Understanding what it is not is as important as understanding what it is.
364: 
365: ### Not a Corporate-Spec-Driven Framework
366: 
367: Frameworks like GSD (Get Shit Done) and BMAD impose structured procedures that must be followed in sequence. They are designed for teams that need compliance — where managers need to verify that every step was followed, every gate was passed, every artifact was produced.
368: 
369: HiveMind does not impose these procedures. It provides the **infrastructure** for any procedure, including GSD or BMAD if that is what your team needs. But it does not mandate them.
370: 
371: If your team needs phase gates, you can implement them with HiveMind's hooks and tools. If your team needs to skip phases for rapid prototyping, you can do that too. HiveMind is a **platform for composing agentic workflows**, not a workflow in a box.
372: 
373: **Why This Matters for Practitioners**: If you are evaluating HiveMind and you need a framework that tells you exactly what to do at every step, you should look at GSD or BMAD. If you want infrastructure that can be configured to support your workflow — whatever your workflow is — HiveMind is designed for you.
374: 
375: ### Not the All-In-SOTA Harness
376: 
377: Oh-My-OpenAgents (OMO) is an ambitious project that aims to provide a fully autonomous agentic coding system — one that can handle entire features from intent to deployment with minimal human intervention. It represents the "maximum autonomy" end of the spectrum.
378: 
379: HiveMind is not that. HiveMind is **collaborative** by default. It assumes that humans and agents work together, that humans provide intent and verify outcomes, and that agents provide execution and pattern recognition. Full autonomy is available as an option (through the task queuing and auto-loop features), but it is not the default mode.
380: 
381: **Why This Matters for Practitioners**: If you want agents that operate fully autonomously while you sleep, OMO may be a better fit. If you want agents that work alongside you, challenge your assumptions, suggest alternatives, and learn from your feedback, HiveMind is designed for you.
382: 
383: ### Not a Framework for Nerds
384: 
385: This is perhaps the most important distinction. HiveMind does not require deep expertise in agentic systems, prompt engineering, or any specific technology stack to get value from it. It is designed to be ** approachable** — to meet users at their current level of expertise and help them grow.
386: 
387: The "bite-sized, systematic guidance" mentioned in the brief is not marketing copy. It describes a deliberate design philosophy: every task, no matter how complex, can be decomposed into steps small enough for a non-expert to understand and verify. The human does not need to know how the agent works internally — they need to know whether the output is what they asked for.
388: 
389: **Why This Matters for Practitioners**: If you are an experienced developer who wants fine-grained control over every agent behavior, HiveMind gives you that — but it does not require it. If you are a product manager who wants to use agents to explore technical feasibility without becoming a systems architect, HiveMind supports that too.
390: 
391: ---
392: 
393: ## 6. The Human-Agent Collaboration Model
394: 
395: ### The Cognitive Layers Concept
396: 
397: HiveMind's collaboration model is built on the idea of **cognitive layers** — different levels of awareness and responsibility that humans and agents occupy.
398: 
399: **Human Layer**: Intent, judgment, verification. Humans define what they want. Humans decide whether what was delivered matches what was asked. Humans provide the "why" that agents cannot infer.
400: 
401: **Agent Layer**: Execution, pattern recognition, context retrieval. Agents do the work. Agents notice patterns in code and suggest improvements. Agents maintain the MEMS-BRAIN and surface relevant memories at the right time.
402: 
403: **Shared Layer**: The HIVE's file tree, the MIND's memory store, the delegation chain. Both humans and agents can read from this layer. Both can write to it (with appropriate permissions). This is the collaboration surface.
404: 
405: The magic of HiveMind is in the **Shared Layer**. When an agent retrieves a MEMS piece from Session 12 and synthesizes it into its context, the human who made that decision in Session 12 is collaborating across time. When a human reviews an agent's proposed implementation and provides feedback, they are collaborating across the cognitive layers.
406: 
407: ### The "Wanders-of-Curiosity" Philosophy
408: 
409: HiveMind is designed for people who **explore**. Not just people who have clear requirements and want them implemented — but people who want to understand a domain, who want to experiment with different approaches, who want to follow a thread of curiosity wherever it leads.
410: 
411: The brief mentions "the most wanders-of-curiosity individuals" and this is not an accident. HiveMind is built for people who find the journey as valuable as the destination. Who want to understand *why* the architecture is the way it is, not just *that* it is. Who are willing to try things that fail so they can learn why they failed.
412: 
413: This is in contrast to agentic systems that optimize for throughput — maximizing the number of tasks completed per hour. HiveMind optimizes for **compounded learning** — ensuring that every experiment, success or failure, makes future work better.
414: 
415: ### How Agents Adapt and Grow
416: 
417: Agents in HiveMind grow through three mechanisms:
418: 
419: **Experience Accumulation**: Every task completed, every delegation handled, every error encountered is recorded as a MEMS piece. Over time, agents operating in a HiveMind ecosystem benefit from the accumulated experience of all previous agents.
420: 
421: **Feedback Integration**: When a human corrects an agent's work, that correction is stored as a MEMS piece. Future agents retrieve it: "Human corrected my predecessor on this pattern because..."
422: 
423: **Pattern Recognition**: Over multiple sessions, agents begin to recognize patterns in the project's evolution. "This team tends to revisit authentication decisions after 3 months — I should flag this as a candidate for early architectural review."
424: 
425: This is not science fiction. It is the natural output of an architecture that takes memory seriously.
426: 
427: ---
428: 
429: ## 7. Key Architectural Principles
430: 
431: ### The CQRS Pattern: Tools = Write-Side, Hooks = Read-Side
432: 
433: HiveMind's architecture enforces a strict separation between **state mutation** and **state observation**:
434: 
435: - **Tools** are the only mechanism that can mutate state. Every tool call is validated, logged, and recorded in the trajectory store. If it is not a tool call, it cannot change system state.
436: 
437: - **Hooks** observe events and enrich context. They watch for task creation, delegation, completion, and error — and inject relevant context into the agent's view. They cannot mutate state.
438: 
439: This is not a convenience pattern — it is a **safety guarantee**. When you know that only five tools can change state, you can audit every state change by reading five tool implementations. When any component can mutate state, auditing becomes impossible.
440: 
441: ### The Plugin as Zero-Logic Assembly
442: 
443: The plugin (`plugin.ts`) is the composition root that wires tools and hooks into OpenCode. Its implementation target is **under 100 LOC** — not because of arbitrary size limits, but because the composition logic should be trivial. If the plugin is complex, the complexity belongs in the tools and hooks, not in the assembly.
444: 
445: This is the **single responsibility principle applied to architecture**: the plugin's job is wiring, not business logic. Business logic lives in tools (which are focused on their specific mutations) and hooks (which are focused on their specific observations).
446: 
447: ### Why These Matter for Reliability and Composability
448: 
449: The CQRS separation and the zero-logic plugin are not academic preferences. They have practical implications for reliability:
450: 
451: **Auditability**: When something goes wrong, you can trace every state change to a specific tool call. You do not need to wonder "how did the task status get corrupted?" — you read the trajectory store and see the sequence of tool calls that led to the corruption.
452: 
453: **Testability**: Tools can be tested in isolation because they have clear inputs and outputs. Hooks can be tested by firing synthetic events and verifying context enrichment. The plugin can be tested by composing test tools and hooks and verifying they connect correctly.
454: 
455: **Composability**: Because the plugin has no business logic, you can swap tools in and out without changing the plugin. Want to add a new tool? Write the tool, register it with the plugin. The rest of the system does not care.
456: 
457: ---
458: 
459: ## 8. Conclusion
460: 
461: HiveMind's philosophy — **Agents' Intelligence = HIVE + MIND** — is a statement about where intelligence comes from.
462: 
463: Not from bigger models. Not from more tokens. Not from cleverer prompts.
464: 
465: Intelligence comes from **architecture**. From the HIVE's structure that keeps agents working on the right things, in the right order, within the right boundaries. From the MIND's memory that ensures every lesson learned survives session boundaries and becomes available to future sessions.
466: 
467: The five pillars are not independent principles — they are interlocking constraints that reinforce each other:
468: 
469: - **Hierarchical Superiority** ensures that dependencies are satisfied before work begins.
470: - **Collaborative Domains** ensure that agents operate within clear boundaries and report up the chain.
471: - **Strategically Measurable** ensures that success is defined before work starts and verified after it completes.
472: - **Iteratively Granular** ensures that work is broken down small enough to be safe and correctable.
473: - **Growing MEMS-BRAIN** ensures that intelligence accumulates across sessions rather than resetting.
474: 
475: Together, these pillars create a system where agents do not just execute tasks — they **build on each other's work**. Where mistakes from Session 3 are visible to Session 47. Where the team's collective knowledge — architectural decisions, pattern preferences, incident learnings — is not trapped in the heads of individuals but stored in an accessible, retrievable form.
476: 
477: **What HiveMind Enables**:
478: 
479: For **developers**: A system that remembers your project's context, that does not require you to re-explain your codebase to every new session, that catches conflicts before they become bugs.
480: 
481: For **technical leads**: A system that enforces architectural discipline without micromanagement, that provides visibility into agent workflows, that makes delegation safe through structured contracts.
482: 
483: For **product managers**: A system that breaks complex work into verifiable chunks, that involves humans at the right gates, that delivers not just completion but evidence of quality.
484: 
485: For **organizations**: A system that compounds intelligence over time, where every project contributes to a growing knowledge base, where agentic best practices can be shared across teams without violating project isolation.
486: 
487: HiveMind is not a framework you must conform to. It is an architecture you can adopt — in full, or in part. You can start with the Hard Harness and the basic delegation protocol. You can add skills as you need them. You can implement the MEMS-BRAIN on day one or grow into it over time.
488: 
489: The HIVE and the MIND are not destinations — they are directions. Every decision about where to place a boundary, how to tag a MEMS piece, when to enforce a guardrail, is a step toward a system that is genuinely intelligent: not because it contains a powerful model, but because it has the architecture to support and amplify that model's capabilities.
490: 
491: Welcome to HiveMind.
492: 
493: ---
494: 
495: **Document Information**
496: 
497: - **Word Count**: ~3,800 words
498: - **Last Updated**: 2026-04-10
499: - **Status**: Publication-ready
500: - **Next Review**: Upon significant architectural changes

(End of file - total 500 lines)
</content>

### Tool: glob

**Input:**
```json
{
  "callID": "call_7974fd9b1f6f406daf53135e"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_f3a796a4615e4502a9d847cb"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_9f4f9e8db81a4f99819823f5"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/commands/hm-explore.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/commands/hm-capture.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/workflows/hm-explore.md"
}
```


## ASSISTANT (turn 1)

Routed to `hm-explore` (Socratic ideation + research routing). Executing:

## USER (turn 1)

**source:** real-human

<objective>
Open-ended Socratic ideation session. Guides the developer through exploring an idea via
probing questions, optionally spawns research, then routes outputs to the appropriate Hivemind
artifacts (notes, todos, seeds, research questions, requirements, or new phases).

Accepts an optional topic argument: `/hm-explore authentication strategy`
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/workflows/hm-explore.md
</execution_context>

<process>
Execute end-to-end.
</process>

Tmux integration into Hivemind and OpenCode runtime for persistent subagent sessions, background command execution, and collaborative orchestration. Research on OMO tmux patterns, Hermes, OpenClaw, and current Hivemind delegation/coordination features to determine how Tmux can enable multi-persistent subtasks with context.
Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/workflows/hm-explore.md"}
<path>/Users/apple/hivemind-plugin-private/.opencode/workflows/hm-explore.md</path>
<type>file</type>
<content>
1: <purpose>
2: Socratic ideation workflow. Guides the developer through exploring an idea via probing questions,
3: offers mid-conversation research when useful, then routes crystallized outputs to Hivemind artifacts.
4: </purpose>
5: 
6: <required_reading>
7: Read all files referenced by the invoking prompt's execution_context before starting.
8: 
9: @/Users/apple/hivemind-plugin-private/.opencode/references/hm-questioning.md
10: @/Users/apple/hivemind-plugin-private/.opencode/references/hm-domain-probes.md
11: </required_reading>
12: 
13: <available_agent_types>
14: Valid Hivemind subagent types (use exact names — do not fall back to 'general-purpose'):
15: - hm-phase-researcher — Researches specific questions and returns concise findings
16: </available_agent_types>
17: 
18: <process>
19: 
20: ## Step 1: Open the conversation
21: 
22: If a topic was provided, acknowledge it and begin exploring:
23: ```
24: ## Explore: {topic}
25: 
26: Let's think through this together. I'll ask questions to help clarify the idea
27: before we commit to any artifacts.
28: ```
29: 
30: If no topic, ask:
31: ```
32: ## Explore
33: 
34: What's on your mind? This could be a feature idea, an architectural question,
35: a problem you're trying to solve, or something you're not sure about yet.
36: ```
37: 
38: ## Step 2: Socratic conversation (2-5 exchanges)
39: 
40: Guide the conversation using principles from `questioning.md` and `domain-probes.md`:
41: 
42: - Ask **one question at a time** (never a list of questions)
43: - Questions should probe: constraints, tradeoffs, users, scope, dependencies, risks
44: - Use domain-specific probes contextually when the topic touches a known domain
45: - Listen for signals: "or" / "versus" / "tradeoff" indicate competing priorities worth exploring
46: - Reflect back what you hear to confirm understanding before moving forward
47: 
48: **Conversation should feel natural, not formulaic.** Avoid rigid sequences. Follow the developer's energy — if they're excited about one aspect, go deeper there.
49: 
50: ## Step 3: Mid-conversation research offer (after 2-3 exchanges)
51: 
52: If the conversation surfaces factual questions, technology comparisons, or unknowns that research could resolve, offer:
53: 
54: ```
55: This touches on [specific question]. Want me to do a quick research pass before we continue?
56: This would take ~30 seconds and might surface useful context.
57: 
58: [Yes, research this] / [No, let's keep exploring]
59: ```
60: 
61: If yes, spawn a research agent:
62: ```
63: Agent(
64:   prompt="Quick research: {specific_question}. Return 3-5 key findings, no more than 200 words.",
65:   subagent_type="hm-phase-researcher"
66: )
67: ```
68: 
69: > **ORCHESTRATOR RULE — CODEX RUNTIME**: After calling Agent() above, stop working on this task immediately. Do not read more files, edit code, or run tests related to this task while the subagent is active. Wait for the subagent to return its result. This prevents duplicate work, conflicting edits, and wasted context. Only resume when the subagent result is available.
70: 
71: Share findings and continue the conversation.
72: 
73: If the topic doesn't warrant research, skip this step entirely. **Don't force it.**
74: 
75: ## Step 4: Crystallize outputs (after 3-6 exchanges)
76: 
77: When the conversation reaches natural conclusions or the developer signals readiness, propose outputs. Analyze the conversation to identify what was discussed and suggest **up to 4 outputs** from:
78: 
79: | Type | Destination | When to suggest |
80: |------|-------------|-----------------|
81: | Note | `.planning/notes/{slug}.md` | Observations, context, decisions worth remembering |
82: | Todo | `.planning/todos/pending/{slug}.md` | Concrete actionable tasks identified |
83: | Seed | `.planning/seeds/{slug}.md` | Forward-looking ideas with trigger conditions |
84: | Research question | `.planning/research/questions.md` (append) | Open questions that need deeper investigation |
85: | Requirement | `REQUIREMENTS.md` (append) | Clear requirements that emerged from discussion |
86: | New phase | `ROADMAP.md` (append) | Scope large enough to warrant its own phase |
87: | Spike | `/hm-spike` (invoke) | Feasibility uncertainty surfaced — "will this API work?", "can we do X?" |
88: | Sketch | `/hm-sketch` (invoke) | Design direction unclear — "what should this look like?", "how should this feel?" |
89: 
90: Present suggestions:
91: ```
92: Based on our conversation, I'd suggest capturing:
93: 
94: 1. **Note:** "Authentication strategy decisions" — your reasoning about JWT vs sessions
95: 2. **Todo:** "Evaluate Passport.js vs custom middleware" — the comparison you want to do
96: 3. **Seed:** "OAuth2 provider support" — trigger: when user management phase starts
97: 
98: Create these? You can select specific ones or modify them.
99: 
100: [Create all] / [Let me pick] / [Skip — just exploring]
101: ```
102: 
103: **Never write artifacts without explicit user selection.**
104: 
105: ## Step 5: Write selected outputs
106: 
107: For each selected output, write the file:
108: 
109: - **Notes:** Create `.planning/notes/{slug}.md` with frontmatter (title, date, context)
110: - **Todos:** Create `.planning/todos/pending/{slug}.md` with frontmatter (title, date, priority)
111: - **Seeds:** Create `.planning/seeds/{slug}.md` with frontmatter (title, trigger_condition, planted_date)
112: - **Research questions:** Append to `.planning/research/questions.md`
113: - **Requirements:** Append to `.planning/REQUIREMENTS.md` with next available REQ ID
114: - **Phases:** Use existing `/hm-add-phase` command via skill
115: 
116: Commit if `commit_docs` is enabled:
117: ```bash
118: # SDK resolution: prefer local hm-tools.cjs, fall back to global hm-sdk (#3668)
119: Hivemind_TOOLS="${RUNTIME_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}/hivemind/bin/hm-tools.cjs"
120: if [ -f "$Hivemind_TOOLS" ]; then
121:   Hivemind_SDK="node $Hivemind_TOOLS"
122: elif command -v hm-sdk >/dev/null 2>&1; then
123:   Hivemind_SDK="hm-sdk"
124: else
125:   echo "ERROR: hm-sdk not found on PATH and $Hivemind_TOOLS does not exist." >&2
126:   echo "Run: npx hivemind-cc@latest --claude --local" >&2
127:   exit 1
128: fi
129: $Hivemind_SDK query commit "docs: capture exploration — {topic_slug}" --files {file_list}
130: ```
131: 
132: ## Step 6: Close
133: 
134: ```
135: ## Exploration Complete
136: 
137: **Topic:** {topic}
138: **Outputs:** {count} artifact(s) created
139: {list of created files}
140: 
141: Continue exploring with `/hm-explore` or start working with `/hm-progress --next`.
142: ```
143: 
144: </process>
145: 
146: <success_criteria>
147: - [ ] Socratic conversation follows questioning.md principles
148: - [ ] Questions asked one at a time, not in batches
149: - [ ] Research offered contextually (not forced)
150: - [ ] Up to 4 outputs proposed from conversation
151: - [ ] User explicitly selects which outputs to create
152: - [ ] Files written to correct destinations
153: - [ ] Commit respects commit_docs config
154: </success_criteria>

(End of file - total 154 lines)
</content>

### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/references/hm-questioning.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/references/hm-domain-probes.md"
}
```


## ASSISTANT (turn 1)

## Explore: Tmux Integration into Hivemind & OpenCode Runtime

Let's think through this together. I'll ask questions to help clarify the idea before we commit to any artifacts.

---

You mentioned wanting to integrate Tmux for persistent subagent sessions, background command execution, and collaborative orchestration. Before we dive into the "how," I want to understand the "why" more deeply.

**What's the pain point you're experiencing today with the current delegation model?**

Is it that subagent sessions die when the parent session ends? That background commands can't be monitored or interacted with? Or something else entirely — maybe the coordination overhead between multiple parallel tasks?

*(This will help me understand whether Tmux is solving a persistence problem, an interaction problem, or a coordination problem — or all three.)*

## ASSISTANT (turn 1)

Tools: glob, glob, glob

### Tool: execute-slash-command

**Input:**
```json
{
  "callID": "call_b687adad56834b1686f9c817"
}
```


## ASSISTANT (turn 3)

Tools: read

## ASSISTANT (turn 4)

Routed to `hm-explore` (Socratic ideation + research routing). Executing:

## ASSISTANT (turn 5)

Tools: read, read

## ASSISTANT (turn 6)

## Explore: Tmux Integration into Hivemind & OpenCode Runtime

Let's think through this together. I'll ask questions to help clarify the idea before we commit to any artifacts.

---

You mentioned wanting to integrate Tmux for persistent subagent sessions, background command execution, and collaborative orchestration. Before we dive into the "how," I want to understand the "why" more deeply.

**What's the pain point you're experiencing today with the current delegation model?**

Is it that subagent sessions die when the parent session ends? That background commands can't be monitored or interacted with? Or something else entirely — maybe the coordination overhead between multiple parallel tasks?

*(This will help me understand whether Tmux is solving a persistence problem, an interaction problem, or a coordination problem — or all three.)*

## ASSISTANT (turn 7)

## Explore: Tmux Integration into Hivemind & OpenCode Runtime

Let's think through this together. I'll ask questions to help clarify the idea before we commit to any artifacts.

---

You mentioned wanting to integrate Tmux for persistent subagent sessions, background command execution, and collaborative orchestration. Before we dive into the "how," I want to understand the "why" more deeply.

**What's the pain point you're experiencing today with the current delegation model?**

Is it that subagent sessions die when the parent session ends? That background commands can't be monitored or interacted with? Or something else entirely — maybe the coordination overhead between multiple parallel tasks?

*(This will help me understand whether Tmux is solving a persistence problem, an interaction problem, or a coordination problem — or all three.)*

## ASSISTANT (turn 1)

Tools: glob, glob, glob

## ASSISTANT (turn 2)

Tools: read, read

## ASSISTANT (turn 3)

Tools: read

## ASSISTANT (turn 4)

Routed to `hm-explore` (Socratic ideation + research routing). Executing:

## ASSISTANT (turn 5)

Tools: read, read

## ASSISTANT (turn 6)

## Explore: Tmux Integration into Hivemind & OpenCode Runtime

Let's think through this together. I'll ask questions to help clarify the idea before we commit to any artifacts.

---

You mentioned wanting to integrate Tmux for persistent subagent sessions, background command execution, and collaborative orchestration. Before we dive into the "how," I want to understand the "why" more deeply.

**What's the pain point you're experiencing today with the current delegation model?**

Is it that subagent sessions die when the parent session ends? That background commands can't be monitored or interacted with? Or something else entirely — maybe the coordination overhead between multiple parallel tasks?

*(This will help me understand whether Tmux is solving a persistence problem, an interaction problem, or a coordination problem — or all three.)*

## ASSISTANT (turn 7)

## Explore: Tmux Integration into Hivemind & OpenCode Runtime

Let's think through this together. I'll ask questions to help clarify the idea before we commit to any artifacts.

---

You mentioned wanting to integrate Tmux for persistent subagent sessions, background command execution, and collaborative orchestration. Before we dive into the "how," I want to understand the "why" more deeply.

**What's the pain point you're experiencing today with the current delegation model?**

Is it that subagent sessions die when the parent session ends? That background commands can't be monitored or interacted with? Or something else entirely — maybe the coordination overhead between multiple parallel tasks?

*(This will help me understand whether Tmux is solving a persistence problem, an interaction problem, or a coordination problem — or all three.)*

## USER (turn 3)

**source:** real-human

all of the above since the Tmux offer the interactive and persistant sessions allowing multple visual run of the session with tmux panels offering more visual-realistic and real time view of the sessions to human users. Plus as for orchestrator agent, I think it can offer the orchestartor with more advanced capabilities of planning delegation  in graphical dependencies and checkpoints, concepting the loop until success for requirements and benefiting the clearer and more controllable tmux sessions to resume, reroute, modified with persistant context on disks. That is what I thought but I am unsure whether the tech sustains what I am expecting

## ASSISTANT (turn 2)

That's a rich answer — you're describing three distinct capabilities that Tmux might unlock:

1. **Persistence** — sessions survive parent death
2. **Visual orchestration** — real-time panels showing parallel work
3. **Control plane** — resume, reroute, modify with disk-persistent context

I want to dig into the visual piece because it sounds like you're imagining something beyond what most agentic systems do today.

**When you say "graphical dependencies and checkpoints" for the orchestrator — are you thinking of something like:**

- A Tmux split-pane layout where each pane represents a subagent's live output (like watching multiple terminal sessions simultaneously)?
- Or something more like a dependency graph visualization that the orchestrator can "see" and reason about?
- Or both — the orchestrator uses Tmux to manage sessions, AND a human can watch the progress visually?

*(This matters because Tmux is great at the first one, but the second one would require additional tooling on top.)*

## ASSISTANT (turn 8)

Tools: glob, glob, glob

## ASSISTANT (turn 9)

Tools: read, read

## ASSISTANT (turn 10)

Tools: read

## ASSISTANT (turn 11)

Routed to `hm-explore` (Socratic ideation + research routing). Executing:

## ASSISTANT (turn 12)

Tools: read, read

## ASSISTANT (turn 13)

## Explore: Tmux Integration into Hivemind & OpenCode Runtime

Let's think through this together. I'll ask questions to help clarify the idea before we commit to any artifacts.

---

You mentioned wanting to integrate Tmux for persistent subagent sessions, background command execution, and collaborative orchestration. Before we dive into the "how," I want to understand the "why" more deeply.

**What's the pain point you're experiencing today with the current delegation model?**

Is it that subagent sessions die when the parent session ends? That background commands can't be monitored or interacted with? Or something else entirely — maybe the coordination overhead between multiple parallel tasks?

*(This will help me understand whether Tmux is solving a persistence problem, an interaction problem, or a coordination problem — or all three.)*

## ASSISTANT (turn 14)

That's a rich answer — you're describing three distinct capabilities that Tmux might unlock:

1. **Persistence** — sessions survive parent death
2. **Visual orchestration** — real-time panels showing parallel work
3. **Control plane** — resume, reroute, modify with disk-persistent context

I want to dig into the visual piece because it sounds like you're imagining something beyond what most agentic systems do today.

**When you say "graphical dependencies and checkpoints" for the orchestrator — are you thinking of something like:**

- A Tmux split-pane layout where each pane represents a subagent's live output (like watching multiple terminal sessions simultaneously)?
- Or something more like a dependency graph visualization that the orchestrator can "see" and reason about?
- Or both — the orchestrator uses Tmux to manage sessions, AND a human can watch the progress visually?

*(This matters because Tmux is great at the first one, but the second one would require additional tooling on top.)*

## ASSISTANT (turn 15)

That's a rich answer — you're describing three distinct capabilities that Tmux might unlock:

1. **Persistence** — sessions survive parent death
2. **Visual orchestration** — real-time panels showing parallel work
3. **Control plane** — resume, reroute, modify with disk-persistent context

I want to dig into the visual piece because it sounds like you're imagining something beyond what most agentic systems do today.

**When you say "graphical dependencies and checkpoints" for the orchestrator — are you thinking of something like:**

- A Tmux split-pane layout where each pane represents a subagent's live output (like watching multiple terminal sessions simultaneously)?
- Or something more like a dependency graph visualization that the orchestrator can "see" and reason about?
- Or both — the orchestrator uses Tmux to manage sessions, AND a human can watch the progress visually?

*(This matters because Tmux is great at the first one, but the second one would require additional tooling on top.)*

## USER (turn 4)

**source:** real-human

I meant both because for delegate-task currently offer the very limited context to only orchestrator meanwhile I am as the users unable to see what is going on or having the clear graph in visual to prompt orchestrator into which session to intercept for example

## ASSISTANT (turn 3)

That's a critical insight — you're describing the **visibility gap** in current delegation. The orchestrator has context, but you as the human are flying blind. You can't see which subagent is stuck, which one is making progress, or which one you want to intervene in.

So the Tmux vision is: **the human becomes a co-pilot, not just a passenger.**

Let me sharpen this:

**When you say "intercept" — what does that look like to you?**

For example:
- You see a subagent's Tmux pane outputting something wrong, and you want to **send it a new instruction** mid-execution?
- You want to **pause** a session, inspect its state, then **resume** or **redirect** it?
- Or you want to **kill** a stuck session and **reroute** its work to a different subagent?

*(This matters because each of these implies different Tmux capabilities — sending keystrokes to a pane is different from capturing and replaying session state.)*

## ASSISTANT (turn 16)

Tools: glob, glob, glob

## ASSISTANT (turn 17)

Tools: read, read

## ASSISTANT (turn 18)

Tools: read

## ASSISTANT (turn 19)

Routed to `hm-explore` (Socratic ideation + research routing). Executing:

## ASSISTANT (turn 20)

Tools: read, read

## ASSISTANT (turn 21)

## Explore: Tmux Integration into Hivemind & OpenCode Runtime

Let's think through this together. I'll ask questions to help clarify the idea before we commit to any artifacts.

---

You mentioned wanting to integrate Tmux for persistent subagent sessions, background command execution, and collaborative orchestration. Before we dive into the "how," I want to understand the "why" more deeply.

**What's the pain point you're experiencing today with the current delegation model?**

Is it that subagent sessions die when the parent session ends? That background commands can't be monitored or interacted with? Or something else entirely — maybe the coordination overhead between multiple parallel tasks?

*(This will help me understand whether Tmux is solving a persistence problem, an interaction problem, or a coordination problem — or all three.)*

## ASSISTANT (turn 22)

That's a rich answer — you're describing three distinct capabilities that Tmux might unlock:

1. **Persistence** — sessions survive parent death
2. **Visual orchestration** — real-time panels showing parallel work
3. **Control plane** — resume, reroute, modify with disk-persistent context

I want to dig into the visual piece because it sounds like you're imagining something beyond what most agentic systems do today.

**When you say "graphical dependencies and checkpoints" for the orchestrator — are you thinking of something like:**

- A Tmux split-pane layout where each pane represents a subagent's live output (like watching multiple terminal sessions simultaneously)?
- Or something more like a dependency graph visualization that the orchestrator can "see" and reason about?
- Or both — the orchestrator uses Tmux to manage sessions, AND a human can watch the progress visually?

*(This matters because Tmux is great at the first one, but the second one would require additional tooling on top.)*

## ASSISTANT (turn 23)

That's a critical insight — you're describing the **visibility gap** in current delegation. The orchestrator has context, but you as the human are flying blind. You can't see which subagent is stuck, which one is making progress, or which one you want to intervene in.

So the Tmux vision is: **the human becomes a co-pilot, not just a passenger.**

Let me sharpen this:

**When you say "intercept" — what does that look like to you?**

For example:
- You see a subagent's Tmux pane outputting something wrong, and you want to **send it a new instruction** mid-execution?
- You want to **pause** a session, inspect its state, then **resume** or **redirect** it?
- Or you want to **kill** a stuck session and **reroute** its work to a different subagent?

*(This matters because each of these implies different Tmux capabilities — sending keystrokes to a pane is different from capturing and replaying session state.)*

## ASSISTANT (turn 24)

That's a critical insight — you're describing the **visibility gap** in current delegation. The orchestrator has context, but you as the human are flying blind. You can't see which subagent is stuck, which one is making progress, or which one you want to intervene in.

So the Tmux vision is: **the human becomes a co-pilot, not just a passenger.**

Let me sharpen this:

**When you say "intercept" — what does that look like to you?**

For example:
- You see a subagent's Tmux pane outputting something wrong, and you want to **send it a new instruction** mid-execution?
- You want to **pause** a session, inspect its state, then **resume** or **redirect** it?
- Or you want to **kill** a stuck session and **reroute** its work to a different subagent?

*(This matters because each of these implies different Tmux capabilities — sending keystrokes to a pane is different from capturing and replaying session state.)*
