he Architecture of Agency: Stateful Orchestration, Contextual Engineering, and Steering Mechanics in Large Language Model Systems
The evolution of Large Language Models (LLMs) from sophisticated text completion engines into autonomous agents represents a paradigm shift in the structural design of intelligent systems. This transition is not merely a change in application logic but a fundamental reimagining of the interface between reasoning, state management, and environment interaction. While early implementations of agentic behavior were often characterized as simple "harnesses" or "wrappers," contemporary engineering has diverged into two distinct philosophical lineages: the "Hard Architecture" of stateful, graph-based SDK libraries and the "Light Meta-Concepts" of stateless handoffs, hooks, and event-driven protocols.[1, 2] Understanding the nuance between these approaches requires a deep dive into the mechanics of how agents receive, process, and act upon user prompts within the constraints of finite context windows and the complexities of multi-turn steering.[1, 3]
Architectural Taxonomies: Hard SDKs versus Light Meta-Concepts
The classification of agentic frameworks is primarily defined by how they manage the authority of the "reasoning core" relative to the "orchestration layer." In hard architectures, the framework acts as a rigorous runtime environment that intervenes deeply in the stateful multi-delegation of tasks.[4, 5] Frameworks like LangGraph, Microsoft’s Semantic Kernel, and the Microsoft Agent Framework (MAF) treat the agentic process as a formal system of records where state persistence, observability, and deterministic control flow are paramount.[4, 6] These systems are designed for enterprise-grade reliability, where every decision path must be auditable and every failure mode recoverable.[5, 7]
Conversely, light meta-concepts prioritize the fluidity of interaction and the simplicity of implementation.[2, 8] This lineage, exemplified by OpenAI’s Swarm and various "agentic SDKs" emphasizing handoffs and tools, treats orchestration as a client-side concern.[2] Here, the LLM is not just a component but the primary driver of the workflow's topology, using function calls and agent configurations to dynamically delegate authority.[2, 8] This approach reduces the overhead of state management by keeping the server-side stateless, relying instead on the "handoff" as the primary unit of collaboration.[2, 8]
Comparative Framework Classification
Feature
Hard Architecture (SDK-First)
Light Meta-Concepts (Protocol-First)
State Management
Durable, persistent, and centralized.
Ephemeral, stateless at server, or client-managed.
Control Flow
Explicitly defined via Graphs/State Machines.
Emergent via Handoffs and Tool Calls.
Orchestration
Centralized Supervisor or Graph Logic.
Decentralized, peer-to-peer delegation.
Persistence
Mandatory checkpointers and state stores.
Optional; often relies on session-based memory.
Developer Model
Code-first, structured, and often verbose.
Prompt-first, iterative, and lightweight.
Error Recovery
State-aware retries and "time-travel" debugging.
Dialogue-driven correction and retries.
[2, 4, 5, 7, 9]
The divergence between these philosophies is most visible in how they handle "multi-delegation." In a hard architecture, a request is decomposed into a structured execution plan by a planning unit, which assigns specific tasks to worker agents while a policy unit enforces governance constraints.[10] In a light meta-concept system, the transition between agents is handled via "progressive disclosure" of capabilities, where an agent loads specialized prompts and tools on-demand or transfers the thread to another specialist when its own expertise is exhausted.[8]
The Anatomy of a Turn: Receive, Reason, and React
At the core of every agentic interaction is the "turn"—a single cycle of input, processing, and output. However, in an agentic tooling context, a single "user turn" may trigger dozens of internal "model turns" and "tool rounds".[1, 11] This cycle begins when the system receives a prompt and compiles the "Working Context" for the LLM. This compilation is not a simple concatenation of text but a sophisticated process of "Context Engineering".[3, 12, 13]
The Compiled Working Context
Modern agentic frameworks move away from treating the context window as a monolithic buffer and instead view it as a compiled view of the session state.[3] This compiled view typically consists of several logical zones:
Stable Prefixes: These include the system instructions, agent identity, and long-lived summaries. To minimize latency, production systems use prefix caching at the hardware level to ensure these static elements remain ready for reuse across multiple invocations.[3]
Memory Fabric: This incorporates relevant fragments of long-term memory (retrieved via RAG) and a compressed history of the current session.[1, 14]
Variable Suffixes: These contain the most recent user turn, the latest tool outputs, and the model's own internal reasoning traces (Chain-of-Thought).[3]
Artifact References: Instead of flooding the context window with raw data (such as large JSON files or CSVs), the system injects lightweight handles or summaries. The full content is only loaded into the "Working Context" via specific tools (e.g., LoadArtifactTool) when the model explicitly identifies a need for it, and it is "pruned" or offloaded immediately after the specific task is complete.[3]
Context Engineering and the Lifecycle of a Session
A "Session" in a production-grade framework like the Google Agent Development Kit (ADK) or Microsoft Agent Framework is defined as the durable log and "ground truth" of the interaction.[3, 11] It is implemented as a stream of strongly-typed "Events"—user messages, agent replies, tool calls, tool results, and control signals.[3] This event-driven approach allows for decoupled storage, meaning the history can be analyzed, rewound, or summarized without parsing opaque text strings.[3]
Session Component
Technical Implementation
Functional Role
Event Log
Chronological list of typed Event objects.
Ground truth; enables time-travel debugging.
Scratchpad
KV-store for metadata and state variables.
Tracking IDs, application state, and transient flags.
Checkpointer
Snapshot of the graph/workflow state.
Enables interruption and resumption of long tasks.
History Pruner
Logic for removing irrelevant dialogue turns.
Maintains signal-to-noise ratio in context window.
[3, 9, 11]
As the session progresses, the "context window trap" becomes a significant threat.[2] Every additional turn adds tokens, increasing inference costs and increasing the likelihood of the model losing track of the original instruction—a phenomenon known as "lost in the middle".[3, 12] To combat this, frameworks implement active management strategies known as compaction and pruning.[3, 12]
The Mechanics of Pruning: From Chronology to Semantics
Context pruning is the strategic removal of less relevant, redundant, or conflicting information before it enters the model's context window.[12, 15] This process is critical for maintaining an agent's focus on high-value content.[12] Pruning methods range from simple rule-based filters to complex semantic analysis.[12]
Pruning Methodologies
Chronological Pruning: This is the most basic form, where the oldest messages or tool outputs are discarded once a token threshold is reached.[12] While easy to implement, it risks removing critical early instructions or context.[12]
Priority-Based Pruning: System instructions and core task parameters are assigned high importance scores, while confirmations (e.g., "Okay, I'll do that"), casual conversation, and "finished task" notifications are assigned lower scores.[12] The system automatically removes low-priority content first as the window approaches capacity (typically 80-95%).[12]
Semantic Pruning: This sophisticated approach involves analyzing the content of each message or tool result to identify information that is semantically redundant or has already been incorporated into higher-level summaries.[12] This often utilizes semantic search to determine which specific passages are most relevant to the current query.[12]
Observation Masking: Often used in coding agents, this technique replaces older observations (e.g., the output of a file read command from ten turns ago) with a placeholder indicating "details omitted for brevity".[16] This keeps the agent's reasoning chain intact while freeing up significant token space.[16]
The Compaction Cycle
Compaction is often paired with pruning to prevent information loss. In a rolling summarization pattern, an auxiliary LLM is used to summarize older turns.[3, 12, 16] The resulting summary is written back into the Session as a "compaction" event, and the raw messages it represents are then pruned from the active context.[3] This creates an "infinite context" capability, where the agent maintains a high-resolution view of recent turns and a low-resolution (summarized) view of the distant past.[3, 16]
Management Technique
Operational Trigger
Data Outcome
Filtering
Static rules (e.g., drop confirmations).
Irreversible removal of specific event types.
Compaction
Threshold-based (e.g., every 5 turns).
Compression of history into semantic summaries.
Pruning
Token-limit based (e.g., at 90% capacity).
Systematic removal of the least relevant content.
Offloading
Task-completion based (e.g., close artifact).
Immediate removal of large data chunks.
[3, 12]
Steering Mechanics: Mid-Turn Async and Injection Strategies
A defining feature of advanced agentic engineering is the ability to intervene in the "thought loop" of an agent without restarting the entire session. This is known as "Steering".[11] As agents transition from single-step completions to multi-step autonomous reasoning—often involving dozens of tool calls—the need for real-time redirection becomes critical.[11]
Injection Steering and the Steering Queue
Injection steering is the process of programmatically inserting new instructions or context into an active agentic loop.[11] This is handled through a "steering queue"—a buffer that stores messages received while the agent is busy "thinking" or "executing tools".[11]
Technically, when a host application (such as an IDE or CLI) calls a steering function (e.g., session.steer("stop searching, look in the /tests folder")), the message is not immediately sent to the model.[11] Instead, it is recorded as a SteeringTurn in the session history.[11] At the start of the next LLM request, the system "drains" the steering queue, appending these messages to the context as standard user-role messages.[11] This ensures the model perceives the steered content as a high-priority direct instruction, allowing it to adjust its plan on the fly.[11]
Mid-Turn Async Steering
Mid-turn async steering takes this a step further by allowing redirections to occur between tool rounds within a single "thought" process.[11] In complex tasks, an agent might decide to:
Read a file.
Parse the file.
Search for a definition.
Update the code.
Each of these is a discrete step. In an async-steerable architecture, the host application maintains a "hostcall-lane" that allows it to monitor events in real-time and inject messages between steps 2 and 3.[11, 17] This is particularly useful for "emergency controls" where a security engine or human operator detects that the agent is about to perform a dangerous action (like a recursive delete) and must force it to "fail-open" or change its trajectory immediately.[17, 18]
Interrupts and Commands: Human-in-the-Loop Patterns
Hard architectures like LangGraph formalize this steering through "Interrupts" and "Commands".[19, 20] An interrupt pauses the graph's execution at a specific node—either before it executes, after it completes, or dynamically based on code logic—and saves the state to a persistent checkpointer.[19, 21] The system then waits for a human to review the current state and provide a "Command" to resume.[19, 20]
Steering Mechanism
Persistence
Timing
Injection Steering
Added to session history as a Turn.
Next available LLM call.
Async Mid-Turn
Buffered in a Steering Queue.
Between discrete tool rounds.
Interrupts
Persistent checkpoint saved to DB.
Pauses indefinitely until resumption.
Commands
Updates state and defines next node.
Upon resumption of an interrupt.
[11, 19, 21]
Workflow Focus: Linear, Cyclic, and Hierarchical Patterns
The "Workflow Focus" of an agent defines the structural constraints of its reasoning path.[22] While autonomous agents are often portrayed as "free-thinking," production systems typically enforce a specific workflow pattern to ensure interpretability and reliability.[23]
Linear and Sequential Pipelines
Sequential orchestration chains agents or steps in a predefined order.[24] Each stage processes the output from the previous one, resembling a "Pipes and Filters" design pattern.[24] This is ideal for data transformation pipelines or document processing where each step adds value that the next depends on.[24] In this model, the "next step" is deterministic and not a choice given to the agent.[24]
Cyclic and Iterative Loops
Cyclic patterns are the hallmark of advanced reasoning, allowing agents to revisit previous steps, refine their answers, or retry failed tool calls.[6, 9] LangGraph is specifically designed to support these cycles, enabling patterns like "Evaluator-Optimizer" where one agent generates a draft and another provides critique, looping until a quality threshold is met.[9, 25]
Hierarchical Multi-Delegation
In complex environments, agents are organized into layers, mirroring organizational structures.[26, 27]
Orchestrator-Worker: A central manager decomposes the task and assigns it to stateless specialists who handle domain-specific work and return results to the manager.[9, 27, 28]
Hierarchical Teams: Strategic control is held by a high-level "Executive" agent, while mid-level "Coordinators" manage tactical groups of "Executors".[22, 26, 27]
Blackboard Systems: Multiple agents monitor a shared "blackboard" (state store) and propose contributions based on their expertise, allowing for emergent collaboration without a single central orchestrator.[7, 29]
The Evolution of Delegation Patterns
Pattern
Coordination Type
Best Use Case
Sequential
Chained/Linear
Data processing; document drafting.
Concurrent
Parallel/Fan-out
Brainstorming; ensemble reasoning.
Orchestrator
Centralized
Complex multi-domain tasks.
Hierarchical
Tiered/Multi-level
Strategic enterprise operations.
Swarm/Handoff
Decentralized/Peer
Dynamic, exploratory research.
[7, 8, 24, 26, 27, 28, 29]
The Security of Agency: Indirect Prompt Injection and AARTS
As agents gain more autonomy and tool access, they become vulnerable to new classes of security threats, primarily "Indirect Prompt Injection" (IPI).[30] This occurs when an agent retrieves untrusted data (e.g., from a website or a search result) that contains hidden instructions designed to hijack the agent's control flow.[30]
The AARTS Standard and Task Alignment
To address these vulnerabilities, the industry is moving toward standards like AARTS (AI Agent Runtime Safety).[18] This standard defines a multi-layered detection framework:
PreToolUse Hooks: Every tool call is intercepted by a security engine that inspects the arguments and the context that led to the call.[18] If a tool call appears non-aligned with the original user intent (e.g., an agent trying to exfiltrate data after reading a "help" file), the call is blocked.[18]
Task Shielding: An auxiliary LLM identifies the original "user task set" and constantly evaluates whether the agent's current reasoning and tool usage remain "aligned" with that set.[30]
Framing Injection Defense: This targets "perception control," where attackers attempt to steer an agent into making wrong decisions by manipulating the "how" of the information presented (e.g., inflated reviews or biased framing).[31, 32]
Resilience and Robustness in Production
Production agentic systems must also account for the inherent "brittleness" of LLMs.[33] This is addressed through:
Circuit Breakers: If a specific agent or tool fails repeatedly (e.g., 5 failures in 2 minutes), the system automatically redirects traffic to a fallback specialist or a simpler rule-based agent.[28]
Idempotency Guards: Since agents may retry tool calls after a timeout, tools must be idempotent (e.g., charging a customer twice must be prevented at the API level).[28]
Fallbacks: If a high-tier reasoning model (e.g., GPT-4.5) fails or hits a rate limit, the system should gracefully degrade to a faster, cheaper model (e.g., GPT-4.5 Turbo) or a human escalation queue.[28]
The Future of the Agentic Stack
The convergence of hard architectures and light meta-concepts suggests a future where "Agentic Workflows" are treated as the "operating system" of AI.[4, 5] This stack is increasingly protocol-driven, prioritizing interoperability between agents running in different environments.[4]
The move toward "Robust Agent-Agnostic Processes" (RAAPs) indicates a shift in focus from the identity of the agent to the structure of the process.[34] In this view, the value emerges from the "production web"—a self-contained, interconnected network of specialized agents, memory fabrics, and tool registries that collaborate through standardized communication protocols like MCP and A2A.[4, 10, 34]
Ultimately, the architecture of agency is a discipline of balancing the infinite possibilities of LLM reasoning with the finite realities of context windows, stateful persistence, and the critical need for deterministic oversight in autonomous systems.[3, 10] As the stack matures, the "invisible discipline" of context engineering and the "occult art" of steering will become as fundamental to software engineering as memory management and process scheduling are today.[12, 31]
--------------------------------------------------------------------------------
LLM Agents Explained: Architecture, Frameworks, and Use Cases - DataCamp, https://www.datacamp.com/blog/llm-agents
Multi-Agent Systems: The Architecture Shift from Monolithic LLMs to Collaborative Intelligence - Comet, https://www.comet.com/site/blog/multi-agent-systems/
Architecting efficient context-aware multi-agent framework for ..., https://developers.googleblog.com/architecting-efficient-context-aware-multi-agent-framework-for-production/
Microsoft Agent Framework: The Next Evolution Beyond Semantic ..., https://medium.com/@howtodoml/microsoft-agent-framework-the-next-evolution-beyond-semantic-kernel-and-autogen-2919e9345b29
Best AI Orchestration Frameworks (2025): LangGraph vs Semantic Kernel vs CrewAI vs LlamaIndex - Services Ground, https://servicesground.com/blog/ai-orchestration-frameworks-comparison/
A Detailed Comparison of Top 6 AI Agent Frameworks in 2026 - Turing, https://www.turing.com/resources/ai-agent-frameworks
Top 8 AI agent orchestration platforms compared - Redis, https://redis.io/blog/ai-agent-orchestration-platforms/
Choosing the Right Multi-Agent Architecture - LangChain Blog, https://blog.langchain.com/choosing-the-right-multi-agent-architecture/
Understanding LLM Agents: Concepts, Patterns & Frameworks | by ..., https://pub.towardsai.net/understanding-llm-agents-concepts-patterns-frameworks-8c57661f3ff1
The Orchestration of Multi-Agent Systems: Architectures, Protocols, and Enterprise Adoption, https://arxiv.org/html/2601.13671v1
attractor/coding-agent-loop-spec.md at main · strongdm/attractor ..., https://github.com/strongdm/attractor/blob/main/coding-agent-loop-spec.md
Context Engineering: The Invisible Discipline Keeping AI Agents ..., https://medium.com/@juanc.olamendy/context-engineering-the-invisible-discipline-keeping-ai-agents-from-drowning-in-their-own-memory-c0283ca6a954
Context Engineering: An Introduction to the Information Environment for LLMs, https://www.dailydoseofds.com/llmops-crash-course-part-7/
Personalizing Dialogue Agents: I have a dog, do you have pets too? - ResearchGate, https://www.researchgate.net/publication/322653035_Personalizing_Dialogue_Agents_I_have_a_dog_do_you_have_pets_too
LLM Context Pruning: A Developer's Guide to Better RAG and Agentic AI Results - Milvus, https://milvus.io/blog/llm-context-pruning-a-developers-guide-to-better-rag-and-agentic-ai-results.md
Cutting Through the Noise: Smarter Context Management for LLM-Powered Agents, https://blog.jetbrains.com/research/2025/12/efficient-context-management/
Dicklesworthstone/pi_agent_rust: High-performance AI coding agent CLI written in Rust with zero unsafe code - GitHub, https://github.com/Dicklesworthstone/pi_agent_rust
Gen Blogs | Introducing AARTS: An Open Standard for AI Agent ..., https://www.gendigital.com/blog/news/company-news/ai-agent-runtime-security
Interrupts - Docs by LangChain, https://docs.langchain.com/oss/python/langgraph/interrupts
Interrupts and Commands in LangGraph: Building Human-in-the-Loop Workflows, https://dev.to/jamesbmour/interrupts-and-commands-in-langgraph-building-human-in-the-loop-workflows-4ngl
Interrupts - Docs by LangChain, https://docs.langchain.com/oss/javascript/langgraph/interrupts
What is AI Agent Orchestration? Complete Guide - Articsledge, https://www.articsledge.com/post/ai-agent-orchestration
METAFLOW:AMETA APPROACH OF TRAINING LLMS INTO GENERALIZABLE WORKFLOW GENERATORS - OpenReview, https://openreview.net/pdf?id=KjxdIG4z84
AI Agent Orchestration Patterns - Azure Architecture Center - Microsoft Learn, https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns
Comparing Open-Source AI Agent Frameworks - Langfuse Blog, https://langfuse.com/blog/2025-03-19-ai-agent-comparison
Multi-Agent System Patterns: A Unified Guide to Designing Agentic Architectures - Medium, https://medium.com/@mjgmario/multi-agent-system-patterns-a-unified-guide-to-designing-agentic-architectures-04bb31ab9c41
Four Design Patterns for Event-Driven, Multi-Agent Systems - Confluent, https://www.confluent.io/blog/event-driven-multi-agent-systems/
Multi-Agent Orchestration: How to Coordinate AI Agents at Scale - GuruSup, https://gurusup.com/blog/multi-agent-orchestration-guide
AI Agent Orchestration: Multi-Agent Workflow Guide, https://www.digitalapplied.com/blog/ai-agent-orchestration-workflows-guide
The Task Shield: Enforcing Task Alignment to Defend Against Indirect Prompt Injection in LLM Agents | Request PDF - ResearchGate, https://www.researchgate.net/publication/394270800_The_Task_Shield_Enforcing_Task_Alignment_to_Defend_Against_Indirect_Prompt_Injection_in_LLM_Agents
Frame Injection: The Occult Art of Perception Control | by Paul Miil | Medium, https://medium.com/@PaulMiil/frame-injection-the-occult-art-of-perception-control-4615329ab76e
Agentic payments and the new fraud landscape for retailers | Hogan Lovells - JDSupra, https://www.jdsupra.com/legalnews/agentic-payments-and-the-new-fraud-2918576/
LLM Agents in Production: Architectures, Challenges, and Best Practices - ZenML Blog, https://www.zenml.io/blog/llm-agents-in-production-architectures-challenges-and-best-practices
What Multipolar Failure Looks Like, and Robust Agent-Agnostic Processes (RAAPs) - LessWrong, https://www.lesswrong.com/posts/LpM3EAakwYdS6aRKf/what-multipolar-failure-looks-like-and-robust-agent-agnostic
Chat
🤖
Architecting Agentic Systems: Context, Frameworks, and Autonomous Workflows
61 sources
These sources examine the technological shift from basic chatbots to autonomous AI agents capable of reasoning, planning, and executing complex tasks. Modern agentic architectures rely on a "brain" powered by large language models, supported by specialized memory tiers, planning logic, and external tools to achieve specific goals. Multi-agent orchestration is emphasized as a superior method for scaling AI, using frameworks like LangGraph and CrewAI to coordinate collaborative workflows across distributed systems. The texts also highlight emerging risks, such as sophisticated fraud in automated payment ecosystems and the loss of human oversight in retail transactions. To manage these systems reliably, developers use context engineering and standardized communication protocols like the Model Context Protocol to ensure security and interoperability. Finally, the collection compares various enterprise platforms and infrastructure tools, such as Redis, which provide the high-speed data processing necessary for real-time agent coordination.

How do different multi-agent architectures compare for complex workflows?
What are the new fraud risks created by agentic payments?
Teach me how agents use planning, memory, and tools.
Today • 5:36 AM
As I need to build a meta builder that can utilize the best of combination of opencode meta from commands, agents, configuration, permissions, tools, custom tools, skills,  to the plugins (but not yet SDK and API) but to understand deeply how to combine the very specific techniques to intecept the workflows redirect, and as meta builder it also needs to know how to get intent from the users and gather the best set so please give the high-level outlook to such meta builder module

To build a meta-builder module in OpenCode that gathers user intent, coordinates specialized workflows, and intercepts execution without relying on external SDK/API scripting, you must orchestrate OpenCode’s declarative primitives (Commands, Skills, Agents) and runtime interception points (Plugins, Permissions).
Here is the high-level architecture and outlook for constructing such a meta-builder.
Phase 1: Intent Gathering & Workflow Entry (Commands & Tools)
To initiate the workflow and gather the "best set" of user intents, your meta-builder should rely on structured entry points rather than open-ended chat.
Custom Commands (.opencode/commands/*.md): Define structured entry points like /build-meta. Commands can automatically include project state via shell execution (e.g., !git log) and file references (e.g., @architecture.md) directly in the prompt
.
Forced Subtask Isolation: By setting subtask: true in the command's YAML frontmatter, you force the command to execute in a clean, isolated child session rather than polluting the user's primary conversational context
.
The question Tool: Equip the orchestrator agent with the question tool. If the initial command lacks constraints, the meta-builder can dynamically pause execution to ask the user for explicit preferences, architectural choices, or clarifications via the UI before proceeding
.
Phase 2: Domain Knowledge & Context Preservation (Skills)
Your meta-builder needs deep, specialized knowledge on how to build components without overwhelming the context window.
Machine-Readable Skills (SKILL.md): Package your meta-builder's domain expertise into OpenCode Skills. Format the skill's body as structured XML (e.g., <contract>, <workflow_rules>).
Prune-Protection: When the meta-builder calls a skill tool, the injected <skill_content> block is explicitly protected from context pruning
. This ensures that your complex orchestration rules and API contracts survive long-haul agentic runs and auto-compactions.
Phase 3: Workflow Interception & Redirection (Plugins)
To deeply understand and redirect workflows at runtime, your meta-builder relies on the Plugin System's hook architecture to intercept the agent loop
.
Pre-Execution Redirection (tool.execute.before): Intercept tool calls before they run. For example, if a subagent tries to write to a protected file, your plugin can intercept the write tool, validate the payload against a schema, and either modify the arguments or block the execution, forcing the agent to rethink
.
Contextual Redirection (experimental.chat.messages.transform): Intercept the full message history before it hits the LLM. You can silently inject synthetic parts or warnings (e.g., "Dependency missing, redirect focus to X") to guide the agent without the user seeing the internal steering
.
State Recovery (experimental.session.compacting): When token limits are reached, OpenCode auto-compacts the session. Your meta-builder plugin can intercept this to inject critical "Source of Truth" (SOT) files back into the new context, ensuring the agent doesn't lose track of the master plan
.
Phase 4: Swarm Orchestration & Delegation (Agents)
The core of the meta-builder is its ability to route tasks to the right specialists.
The Primary Orchestrator Agent: Define your meta-builder agent in .opencode/agents/ with mode: primary
. Give it an iteration limit using the steps budget parameter (e.g., steps: 5) to prevent endless loops and force human check-ins
.
The task Tool Engine: The orchestrator uses the task tool to spawn parallel swarms of subagent-mode workers (e.g., explore agents for codebase recon, general agents for design). The task tool spawns these in isolated child sessions
.
Stateful Resumption (task_id): When a subagent finishes, the orchestrator receives a summarized output and a task_id. If the meta-builder evaluates the output and finds it lacking, it can pass that task_id back into the task tool to resume the exact same subagent session for iterative refinement
.
Phase 5: Quality Gates & Governance (Permissions)
To ensure the meta-builder gathers the "best set" of changes without compromising the codebase, it must govern its subagents strictly.
Last-Match-Wins Rulesets: Configure granular permissions per agent. OpenCode merges global, agent, and session permissions. Place catch-all blocks first ("*": "ask") and specific exceptions after ("git status": "allow") to build deterministic quality gates
.
Subagent Containment: By default, child sessions spawned by the meta-builder automatically deny todowrite, todoread, and recursive task spawning. This contains the subagents strictly to execution and forces all architectural planning back up to the primary meta-builder
.
Doom Loop Prevention: Rely on the doom_loop: "ask" guardrail. If a subagent gets stuck repeating the exact same tool call three times, the system will automatically halt execution and ask for human intervention
.
Summary Workflow: The user invokes /build-meta. The command triggers the Primary Orchestrator Agent, which uses the Question Tool to refine intent. The orchestrator loads a Skill for the specific domain architecture, then uses the Task Tool to dispatch Subagents in isolated sessions. Plugins silently monitor tool.execute.before to enforce schema validation and redirect bad tool calls, while Permissions act as a hard quality gate requiring human approval for destructive actions.
Would you like to dive deeper into how to structure the specific Zod schemas for the plugin hooks to intercept and validate the write tool dynamically?
and the stop when conditioned to workflows or to regulate the granularity of main-facing session and sub-sessions and most importantly utilizing planning, todo tasks and other tools for hierarchy, and know what and when to stop and keep the context integrity or creating new sessions with handoff. Also these runtime granularity can strike the conflicts, and context confusions easily if not match very well

To successfully regulate granularity, hierarchy, and context integrity across main sessions and sub-sessions, you must decouple workflow state from conversation history. When agents share flat context across different levels of abstraction, it inevitably leads to context confusion, token bloat, and conflicting actions.
Here is how you can architect your meta-builder to manage stops, hierarchy, and handoffs deterministically:
1. Enforcing Hierarchy via Todos and Tool Isolation
To prevent sub-sessions from conflicting with the main-facing session, you must establish strict boundaries between the "Orchestrator" (Main Session) and the "Workers" (Sub-sessions).
The Todo State Graph: The primary orchestrator agent should use the todowrite and todoread tools to maintain a persistent, database-backed task list. This acts as a lightweight "context graph" for the overarching workflow, tracking what has been planned and completed
.
Subagent Containment: When the orchestrator uses the task tool to spawn a swarm of subagents, these child sessions must be isolated. OpenCode automatically enforces this by denying todowrite, todoread, and recursive task spawning in child sessions
. This guarantees that subagents cannot rewrite the master plan, strictly limiting their granularity to execution.
2. Knowing What and When to Stop
To prevent runaway agents and regulate when a session should pause for human oversight or phase transitions, you must implement strict budgets and gates.
The steps Budget: Set a steps budget (e.g., steps: 5) on your orchestrator agent. After this number of agentic tool iterations, the loop forces the agent to stop and emit a text-only response to the user. This acts as a hard drift-prevention budget
.
Deterministic Phase Gates: Use tools like plan_exit as hard stops for workflow phases. For example, in a 5-phase workflow, the orchestrator cannot proceed from the planning phase to the build phase until it calls the plan_exit tool, which acts as a deterministic handoff gate requiring user alignment
.
Dynamic Interrupts: If you are integrating with graph-based architectures like LangGraph, you can utilize dynamic interrupt() functions inside your tool nodes. This suspends graph execution, saves the state to a checkpointer, and waits indefinitely for human validation or editing before a Command(resume=...) is issued to continue
.
3. Context Integrity During Handoffs and New Sessions
A major cause of context confusion is passing the entire, noisy message history into a new session.
Packet-Based Handoffs: Child sessions spawned by the task tool do not inherit the parent's message history
. Instead, the orchestrator must synthesize a concise instruction packet and pass it via the prompt parameter of the task tool
. The subagent executes in its own isolated database row, and only returns its final text output back to the orchestrator
.
Stateful Resumption: If a subtask requires multiple iterations, the task tool returns a task_id. The orchestrator can pass this task_id back into a new tool call to resume that exact same child session, preserving the subagent's local continuity without polluting the main session
.
The Compaction Handoff Protocol: For long-running main sessions that exceed token limits, the system triggers auto-compaction
. The compaction agent synthesizes the history into a strict handoff protocol: Goal → Instructions → Discoveries → Accomplished → Relevant files
.
4. Preventing Context Rot and Identity Confusion
When handoffs occur, the system must prevent the new agent (or the resumed agent post-compaction) from hallucinating its role based on past messages.
Narrative Casting: When transferring control between specialized agents, you must translate the context. If Agent B simply sees a stream of "Assistant" messages generated by Agent A, it will hallucinate that it performed those actions. You must use "narrative casting" (e.g., tagging past actions as [For context]: Agent A said...) to ensure the new agent acts on the results of the previous phase without confusing its identity
.
Source of Truth (SOT) Anchoring: To prevent context rot during session compaction, use the experimental.session.compacting plugin hook. This allows you to automatically read your core architectural SOT files (e.g., schema.json, RESEARCH.md) and forcefully inject them into the new continuation prompt. This ensures that no matter how many times the session compacts or hands off, the foundational constraints are never lost
.
Would you like to explore how to implement the experimental.session.compacting plugin hook to automatically inject your SOT files during these session transitions?
I want to learn about these sources using Learning Guide

I can certainly help you navigate these materials! We have a wealth of information here covering general multi-agent orchestration patterns (like LangGraph, CrewAI, and Microsoft's frameworks), OpenCode's specific architecture (SDK, plugins, permissions), and advanced context engineering.
To make sure I tailor our conversation perfectly to you, what is your current familiarity with multi-agent systems, and what is your specific goal today? (For instance, are you a seasoned developer actively coding this OpenCode meta-builder, or are you newer to this and researching high-level architectures?)
Depending on your experience, I propose we break this down into three logical steps:
Core multi-agent orchestration patterns (e.g., Orchestrator-Worker, Handoffs).
OpenCode's specific interception hooks and delegation mechanics.
Advanced context engineering and memory management.
How does that plan sound, and what is your current experience level with these frameworks?
ok greate

Here is a concise example of how to build a plugin that intercepts the built-in write tool and uses a Zod schema to validate the payload before allowing it to execute
:
import { z } from "zod";
import type { Plugin } from "@opencode-ai/plugin";

// 1. Define your strict architectural constraints
const ValidatedWriteSchema = z.object({
  filePath: z.string().endsWith(".json", "Strict constraint: You may only write to .json configuration files in this phase."),
  content: z.string().min(10, "Content must be substantial.")
});

export const SchemaEnforcementPlugin: Plugin = async (ctx) => {
  return {
    "tool.execute.before": async (input, output) => {
      
      // 2. Intercept only the 'write' tool
      if (input.tool === "write") {
        
        // 3. Validate the arguments the agent is trying to pass
        const result = ValidatedWriteSchema.safeParse(output.args);

        if (!result.success) {
          // 4. Throwing an error blocks execution. 
          // The agent sees this specific error message and can self-correct.
          throw new Error(`Schema validation failed: ${result.error.message}`);
        }
        
        // If validation passes, the tool executes normally.
      }
    }
  };
};
By throwing an error upon a failed safeParse, the plugin acts as a hard quality gate
. The execution is blocked, and the agent receives your exact validation error in its next turn, forcing it to rethink and fix its payload
.
Since we have covered how to tightly control and gate agent tool usage, are you ready to explore the final step of our learning plan: advanced context engineering and preventing memory rot during session handoffs?
How do I implement the experimental.session.compacting plugin hook?
Explain how to use the task tool for isolated sub-sessions.
How can I prevent session rot using the drift_score metric?
Discuss Context Engineering Strategies.

Context engineering treats the LLM's context window as a carefully managed "compiled view" rather than a dumping ground for raw text
. To prevent context rot and token bloat, you can use these core strategies:
Progressive Injection: Only load context when it becomes relevant. For example, OpenCode dynamically injects AGENTS.md instructions only when an agent actively navigates into that specific directory
.
Context Compaction: When approaching token limits, pause the workflow and use a dedicated agent to summarize the conversation history (e.g., Goal, Discoveries, Next Steps). This summary acts as a clean handoff for the next session
.
Pruning Stale Data: Systematically erase the bulky outputs of old tool calls from the active history once they exceed a certain threshold, while keeping the actual tool call record intact
.
Artifact Offloading: Instead of pasting large files directly into the prompt, provide the agent with a reference and a specific tool to load the data temporarily only when it actively needs to read it
.
Would you like to look closer at how to configure the auto-compaction trigger in OpenCode, or is there another area you'd like to tackle next?
Show me a detailed planning hierarchy for the main session
How do I implement drift detection with the drift_score metric?
Explain how export_cycle prevents intelligence loss during session compaction
Discuss Agentic Runtime Safety.

Agentic Runtime Safety addresses the unique vulnerabilities created when LLMs are given the autonomy to use tools, read external data, and alter system states. Because agents piece together context dynamically, they are susceptible to attacks that traditional software defenses cannot catch.
Here are the core concepts and strategies for securing agentic runtimes:
1. The Threat Landscape
Indirect Prompt Injection (IPI): This is a primary threat where attacker-controlled context (like a malicious instruction hidden in a webpage or email) is retrieved by the agent and silently hijacks its execution flow
.
Supply Chain Attacks: Agents might download hallucinated packages preloaded with malware, or load poisoned skills and plugins
.
Agent Hijacking: Malicious inputs can induce "role confusion," tricking the agent into interpreting untrusted content as legitimate user instructions or tool outputs
.
2. The AARTS Standard The AI Agent Runtime Safety Standard (AARTS) is an open framework designed to standardize how agent platforms expose security events
. It decouples safety logic from the agent framework by dividing the system into three roles
:
Host: The environment running the agent.
Adapter: A translation layer mapping host-specific events to a common schema.
Security Engine: The evaluator that receives events and returns structured verdicts (allow, deny, or ask the user)
.
3. Critical Interception Hooks Runtime safety relies on evaluating agent behavior at specific, deterministic moments in its lifecycle
. Key "hook points" include:
PreLLMRequest: Inspects the prompt's integrity before it reaches the model to ensure safety instructions haven't been compacted away and untrusted content hasn't broken the instruction layering
.
PreToolUse: The most critical checkpoint. Before an agent executes a shell command, writes a file, or makes a network request, the security engine evaluates the action and its arguments
.
PreSkillLoad: Evaluates the provenance and integrity of a plugin or skill before it is loaded into the agent's context
.
4. Task Alignment and Shielding To defend against IPI, advanced systems employ "Task Shielding." This involves using auxiliary models or strict policies to continuously verify that a generated tool call strictly aligns with the user's original intent
. If an agent suddenly tries to exfiltrate data while executing a simple calendar lookup, the execution is blocked because it lacks task alignment
.
Would you like to explore how OpenCode specifically implements these runtime safety concepts, such as its two-stage exec enforcement and extension kill-switches?
How can the experimental.session.compacting hook prevent context rot?
Explain how to use the question tool for intent gathering.
What are the core differences between A2A and MCP protocols?
In one or two sentences, how can you help me use these sources?

I can guide you through these materials to architect, evaluate, and deploy advanced multi-agent systems using frameworks like LangGraph, CrewAI, and OpenCode
. By synthesizing these texts, I can provide concrete implementations for complex orchestration patterns, context engineering strategies, and security protocols tailored to your specific meta-builder requirements
.