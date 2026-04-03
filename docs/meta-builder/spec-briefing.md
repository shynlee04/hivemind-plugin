Design and implement the **Meta-builder** skill for the HIVEMIND harness framework running on OpenCode. This skill serves as the orchestrator for building, chaining, and governing meta-concepts across the OpenCode platform—including soft concepts (commands, prompts/workflows, rules, permissions, agents, subagents, skills) and hard concepts (custom tools, plugins, SDK engines). The goal is to enable users to configure, refactor, create, and optimize these concepts for their specific project needs through natural language interaction.

## Core Requirements

### 1. Architecture Understanding

- OpenCode runtime operates through session-based turns where each user message triggers an API call to the LLM
- Session types: main-facing users and isolated subagent contexts
- Users can resume, fork, or undo/redo session turns
- Runtime factors that influence agent behavior: command injection, prompt workflows, rules, permissions, agent/subagent assignment, and skill loading
- Soft concepts can refresh agent instruction sets and deterministic tool selection
- Fine-grained control via plugins (event subscriptions, internal hooks) and custom tools (multi-file registration, context/argument handling, cross-language support)

### 2. Meta-builder Skill Specifications

### Primary Skills (GROUP 1) - Implementation Patterns

**a) `user-intent-interactive-loop`**

- Iterative, hierarchical user research and brainstorming
- Deep investigation and long-haul session persistence
- Question-based discovery tools
- Front agent maintains task control and delegation authority

**b) `coordinating-loop`**

- Subagent delegation and handoff protocols
- Sequential vs. parallel execution decision logic
- Parent-child cycle management across phases
- Scripted loop techniques (Ralph-loop patterns)

**c) `planning-with-files`**

- Template-driven project scaffolding
- Sample scripts, assets, and reference management
- Progressive planning that prevents front-agent hallucination

**d) `tech-to-feature-synthesis` and `deep-investigation`**

- Domain research (technical, market, product analysis)
- Subagent spawning and memory persistence
- Cross-stack pattern synthesis
- Long-memory sustained loops

### Domain-Parked Exclusive Skills (GROUP 2) - Skill Authoring Ecosystem

**a) `use-authoring-skill`** - Bridge skill connecting all authoring packages

- Hierarchical, same-level cross-linkages
- Agent, tools, commands, and workflows authoring patterns
- Test-driven development approach with skeleton-first framing
- Clear metrics, concise articulation, deterministic workflows

**b) Skill Creation Lifecycle**

- Creating new skills
- Auditing existing skills
- Evaluating skill effectiveness
- Doctoring (diagnosing and fixing) skill issues

### Skill Quality Standards

All skills must follow these principles:

- Skeleton-first approach with progressive iteration
- Hierarchy and node-targeting organization
- Test-driven development and edge-case awareness
- Clear, measurable success metrics
- Concise and articulate language optimized for LLMs
- Workflow phases and steps clearly defined
- Smart, deterministic execution time calculations

### 3. Orchestrator Agent: Hivefiver

Design the orchestrator agent that:

- Delegates subagents for isolated context execution
- Chains soft concepts in configurable combinations
- Governs runtime through iterative phases
- Validates each phase before proceeding to next
- Supports atomic commits with self-testing
- Handles complex requests like "custom multi-team market and deep tech research agents that can learn and synthesize API cross-stack patterns"

### 4. Integration Requirements

### OpenCode Soft Concepts (zero-dependency stacking)

- Commands (agent/subagent behavior scripts)
- Prompts as workflows
- Rules
- Permissions (tool/skill/command assignment)
- Agents vs. subagents
- Skills (most flexible, portable across platforms)

### Reference Files to Consider

- [opencode-agents.md](http://opencode-agents.md/)
- [opencode-built-in-tools.md](http://opencode-built-in-tools.md/)
- [opencode-commands.md](http://opencode-commands.md/)
- [opencode-configs.md](http://opencode-configs.md/)
- [opencode-lsp-servers.md](http://opencode-lsp-servers.md/)
- [opencode-mcp-servers.md](http://opencode-mcp-servers.md/)
- [opencode-permissions.md](http://opencode-permissions.md/)
- [opencode-skills.md](http://opencode-skills.md/)
- [opencode-custom-tools.md](http://opencode-custom-tools.md/)
- [opencode-rules.md](http://opencode-rules.md/)

### 5. Natural Language Intent Detection

The meta-builder must:

- Detect user intent through natural language input
- Route to appropriate skill combinations
- Support both direct user calls and autonomous agent invocation
- Stack concepts progressively based on detected intent

## Deliverables

Design the complete meta-builder skill package including:

1. Skill definitions with clear purpose, triggers, and workflows
2. Orchestrator agent (Hivefiver) architecture
3. Phase-based execution patterns for concept building
4. Integration guidelines for OpenCode soft and hard concepts
5. Quality assurance and testing protocols for skill creation