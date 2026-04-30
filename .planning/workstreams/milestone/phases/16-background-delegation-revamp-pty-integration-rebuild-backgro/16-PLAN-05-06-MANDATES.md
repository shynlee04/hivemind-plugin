You are tasked with conducting a comprehensive architectural review and gap analysis for Phase 16 of the hivemind-plugin harness-experiment worktree, focusing on background delegation and PTY management systems. This is a critical juncture requiring deep technical analysis to prevent architectural fragmentation and ensure the system achieves superiority over the oh-my-openagent (OMO) reference implementation.

CURRENT CODEBASE STRUCTURE TO ANALYZE:

lib/ directory (23 files):
- Core managers: delegation-manager.ts, delegation-persistence.ts, lifecycle-manager.ts, notification-handler.ts
- Runtime components: runtime.ts, runtime-policy.ts, session-api.ts, state.ts, task-status.ts
- Utilities: completion-detector.ts, concurrency.ts, continuity.ts, helpers.ts, types.ts
- PTY subsystem: pty/pty-buffer.ts, pty/pty-manager.ts, pty/pty-types.ts
- Spawner subsystem: spawner/concurrency-key.ts, spawner/parent-directory.ts, spawner/pty-setup.ts, spawner/session-creator.ts, spawner/spawner-types.ts
- Documentation: AGENTS.md

tools/ directory (11 files across 4 subdirectories):
- delegate-task.ts, delegation-status.ts
- prompt-analyze/: index.ts, tools.ts, types.ts
- prompt-skim/: index.ts, tools.ts, types.ts
- session-patch/: index.ts, tools.ts, types.ts

hooks/ directory (5 files):
- create-core-hooks.ts, create-session-hooks.ts, create-tool-guard-hooks.ts
- messages-transform.ts, types.ts

shared/ directory (2 files):
- tool-helpers.ts, tool-response.ts

CRITICAL CONCERNS TO ADDRESS:

1. ARCHITECTURAL FRAGMENTATION: The current file structure shows potential naming inconsistencies and scattered responsibilities. Conduct a thorough analysis of whether the separation between lib/, tools/, hooks/, and shared/ creates artificial boundaries that fragment what should be cohesive subsystems.

2. PTY SYSTEM SCOPE MISUNDERSTANDING: The PTY background process system is being treated too narrowly as merely a component of background delegation. PTY management has broader applications including CLI command execution, interactive command handling, long-running process management, and terminal session orchestration. Analyze how the current pty/ subdirectory architecture limits or enables these broader use cases.

3. BACKGROUND DELEGATION COMPLEXITY: Reference the design document at docs/draft/prompt-2026-04-21.md to understand the full scope of background delegation, which encompasses:
- Background task execution and lifecycle management
- Background agent coordination and communication
- Custom tool integration for delegation workflows
- Background notification and event handling systems
- Multi-instance task orchestration with network-like dependency graphs

4. OMO REFERENCE ANALYSIS: Study how oh-my-openagent (https://github.com/code-yeongyu/oh-my-openagent) implements background delegation and task orchestration. Identify specific architectural patterns, API designs, and integration approaches that make OMO robust, then design solutions that surpass OMO's capabilities while avoiding its limitations.

5. PHASE 14 RETROSPECTIVE: Thoroughly review all implementations from Phase 14 to identify:
- What architectural decisions were made and why
- Which components were created and how they interact
- What gaps or technical debt were introduced
- How the current Phase 16 state evolved from Phase 14

MANDATORY DESIGN REQUIREMENTS:

ORCHESTRATOR INTEGRATION:
- Design how the orchestrator can utilize background-delegation both in main sessions and through the builtin task tool
- Enable delegation to specialized agents that manage and coordinate multiple background task instances
- Support network-and-branch-like comprehensive task structures with checkpoints and dependencies
- Ensure background-delegation and task tool are complementary, not redundant, with clear use-case distinctions for READ, WRITE, EDIT operations once dependencies are resolved

TOOL DESIGN PRINCIPLES:
- Background delegation must be convenient, safe, and distinct from the task tool
- Bundle all necessary features and tools to make delegation self-contained and functional
- Design for implicit natural language invocation—agents should use tools based on context without users explicitly naming tools
- Ensure robust error handling, fallback mechanisms, and conflict-free tool calling
- Eliminate confusing tool interactions that could trouble agents during execution

ZERO HARD-CODING MANDATE (HIGHEST PRIORITY):
- NO hard-coded agent names, model specifications, or OpenCode primitive settings
- ALL configuration must support automatic registration at both project-based and global scopes
- Design adaptive systems with configurable approaches for future extensibility
- Implement dynamic discovery and registration mechanisms for agents, models, and tools
- Create metadata-driven architectures that allow runtime configuration without code changes

DELIVERABLES REQUIRED:

1. COMPREHENSIVE GAP ANALYSIS: Identify every architectural gap, missing component, inconsistent naming pattern, and fragmented responsibility in the current codebase structure across lib/, tools/, hooks/, and shared/.

2. UNIFIED ARCHITECTURE PROPOSAL: Design a cohesive architecture that:
- Properly scopes PTY management for all its use cases beyond delegation
- Integrates background delegation as a first-class orchestration primitive
- Eliminates fragmentation through clear subsystem boundaries and responsibilities
- Establishes naming conventions and organizational patterns that scale

3. BACKGROUND DELEGATION SYSTEM DESIGN: Specify the complete background delegation system including:
- Task lifecycle management (creation, execution, monitoring, completion, cancellation)
- Agent coordination protocols and communication channels
- Dependency resolution and prerequisite checking mechanisms
- Network-like task graph structures with branching and checkpoints
- Integration points with the task tool and orchestrator
- Notification and event handling for background state changes

4. PTY SUBSYSTEM EXPANSION: Design the expanded PTY subsystem covering:
- CLI command execution (one-shot and interactive)
- Long-running process management and monitoring
- Terminal session lifecycle and state management
- Buffer management and output streaming
- Integration with delegation, task execution, and direct orchestrator use

5. DYNAMIC CONFIGURATION ARCHITECTURE: Specify the zero-hard-coding configuration system including:
- Agent registration mechanisms (discovery, metadata, capabilities)
- Model configuration and selection strategies
- Tool registration and capability advertisement
- Project-based vs global configuration hierarchy and precedence
- Runtime configuration updates and hot-reloading

6. TOOL INTEGRATION SPECIFICATION: Design the complete tool ecosystem including:
- Natural language implicit invocation patterns
- Tool guard mechanisms and safety checks
- Error handling and fallback strategies
- Tool composition and chaining patterns
- Conflict detection and resolution for overlapping tool capabilities

7. IMPLEMENTATION ROADMAP: Provide a phased implementation plan that:
- Addresses critical gaps first to prevent further fragmentation
- Establishes foundational architecture before building features
- Defines clear milestones with validation criteria
- Identifies refactoring needs for existing Phase 14 code
- Sequences work to maintain system stability throughout implementation

Conduct this analysis with meticulous reasoning, considering every interaction between subsystems, every potential failure mode, and every future extensibility requirement. The goal is to create an architecture that is demonstrably superior to OMO while remaining flexible, maintainable, and free from hard-coded limitations.