# Executive Summary

The architectural landscape for AI coding agent skill and plugin distribution reveals a convergence of ideas from traditional software development and the unique needs of LLM-based systems. A comparison of systems like GSD (get-shit-done), OpenCode, and established npm ecosystems (Yeoman, Nx, Vite, ESLint) highlights distinct philosophies. GSD exemplifies a strong separation of concerns, featuring a stable, cross-platform Node.js CLI toolkit (`gsd-tools.cjs`) that provides core functionalities like state and git management, distinct from the LLM-facing prompt and skill artifacts. Its distribution relies on a versatile `npx` installer that targets multiple agent runtimes. In contrast, mature npm ecosystems like Nx and ESLint demonstrate the power of standardized packaging, with strict naming conventions (`@myorg/nx-plugin`, `eslint-plugin-*`), `package.json` keywords for discovery, and clear dependency management using `peerDependencies`. These systems prioritize developer experience with scaffolding tools and well-defined plugin contracts. Meanwhile, modern AI agent platforms such as OpenCode, Claude Code, and Cursor are converging on a multi-primitive plugin model. They define skills via declarative files (`SKILL.md`), support multiple installation scopes (project, global, managed), and bundle various capabilities like subagents, hooks, and external tools via protocols like MCP and LSP. OpenCode and the associated `vercel-labs/skills` CLI champion a git-first, registry-decoupled distribution model (`npx skills add owner/repo`), which offers flexibility. The optimal architecture synthesizes these approaches: it adopts the declarative, multi-primitive skill contract from agent platforms, the disciplined packaging and discovery patterns from the npm world for SDKs, and the clean separation of a stable tooling substrate from dynamic skills, as pioneered by GSD.

# Key Conclusions And Recommendations

Based on the analysis of existing systems, the following conclusions and recommendations are proposed for designing a robust and scalable skill ecosystem for AI coding agents:

*   **Adopt a Hierarchical 'Meta-Builder' Architecture:** Skills should be structured as composable, hierarchical packs. A 'Meta-skill' defines the overall capability by composing subordinate skills, agents, and commands through an include graph. This structure supports complexity and allows for high-level configuration.

*   **Implement a Dual Packaging Strategy:**
    *   **For Developers (Full SDK):** Publish a versioned, scoped npm package (`@org/skillpack-<domain>`) that includes the core SDK (for state, config, git operations), CLI tools, and TypeScript types. This provides a stable, programmatic API for headless operations and follows established patterns like using `peerDependencies` for host agent integration.
    *   **For End-Users (Individual Skills):** Distribute individual skills as source-controlled Git repositories. Users can install them on-demand using a universal skills CLI (e.g., `npx skills add owner/repo`), keeping them lightweight and decoupled from the npm registry.

*   **Standardize on a Declarative Skill Contract:** Use a single, portable declarative file, such as `SKILL.md` with YAML frontmatter, to define a skill's properties. This contract should include metadata (ID, name, description), dependencies (`requires`), commands, tool bindings, required permissions, and hooks. This ensures portability across different agent platforms like Claude Code, OpenCode, and Copilot.

*   **Utilize a Universal Skills CLI for Distribution:** A single CLI tool should handle the installation and management of skills across multiple host agents. It should support git-based URIs, selective installation of skills from a repository, global vs. local installation, and discovery via manifest files (`marketplace.json`).

*   **Enforce Clean Context Windows and Deterministic Evaluation:**
    *   Skill execution must occur in a minimal, fresh context window, loading only the specific skill, concise summaries of its dependencies, and relevant task snippets. This prevents context pollution from chat history or irrelevant project files.
    *   Develop an offline 'skill test harness' to run skills against mock fixtures (code, LSP diagnostics, tool responses) and assert expected outcomes (file changes, git deltas), enabling deterministic testing and performance measurement (e.g., token usage).

*   **Define Clear Integration Points:** Use explicit plugin hooks (e.g., `pre/post-command`), least-privilege permissions declared in the skill contract, and standardized protocols like MCP for external tools and LSP for code intelligence to ensure stable and secure integration with host agents.

# Gsd Project Architecture Analysis

## Cli Architecture

The GSD project's command-line interface is built on Node.js, centered around a core utility script located at `bin/gsd-tools.cjs`. This central script is supported by a library of modules in the `bin/lib/` directory, including `config.cjs`, `roadmap.cjs`, and `state.cjs`. These scripts provide essential functionalities such as state management (queries and mutations), Git integration, and configuration handling. The choice of Node.js is justified by its cross-platform compatibility (macOS, Windows, Linux) and its facility with JSON input/output, which is crucial for interoperability between Large Language Models (LLMs) and tooling.

## Packaging Model

The Node.js CLI tools within the GSD project are not packaged as a standalone, installable npm library. Instead, they are an integral part of the project's source layout, located in the `bin/` folder. These tools are designed to be called by workflows and agents, either from prompts or shell commands, to provide a stable execution substrate. The overall project, including these tools, is distributed to end-users via a single npx installer, which then places the necessary files in the appropriate runtime directories.

## Plugin System Approach

GSD's extension model is described as "skill-pack-first." Extensibility is achieved by adding new agents and skills as prompt and artifact units. New agents are defined in markdown files (e.g., `agents/gsd-your-agent.md`), which declare the tools and skills they require. These agents then invoke the core Node.js CLI utilities to perform actions. For certain runtimes like Codex, skills are explicitly distributed as `SKILL.md` packs (e.g., `skills/gsd-*/SKILL.md`), providing a more structured plugin-like surface for downstream agents to consume.

## Distribution Model

The GSD project is distributed to end-users via a single command: `npx get-shit-done-cc@latest`. This command triggers an interactive installer that allows the user to select one or more target runtimes, such as Claude Code, OpenCode, Gemini CLI, Codex, and others. The installer can place the necessary files either globally in user configuration directories (e.g., `~/.claude`, `~/.config/opencode`) or locally within the current project (e.g., `./.claude`). Additionally, GSD can install a separate SDK CLI (`gsd-sdk`) intended for headless workflow execution.


# Opencode Platform Architecture Analysis

## Skill System Details

OpenCode's skill system is designed for broad discovery. It loads skills defined in `SKILL.md` files by searching specific directory structures. Locally, it walks up the directory tree from the current working directory to the git worktree root, looking for skills in `.opencode/skills/*/SKILL.md`, `.claude/skills/*/SKILL.md`, and `.agents/skills/*/SKILL.md`. It also performs a global search in the user's home directory, checking `~/.config/opencode/skills/*/SKILL.md`, `~/.claude/skills/*/SKILL.md`, and `~/.agents/skills/*/SKILL.md`. This allows for project-specific, user-specific, and cross-agent skill definitions.

## Skill Installation Process

Skills are installed into the OpenCode ecosystem using a shared command-line interface from `vercel-labs/skills`, typically invoked via `npx skills add`. This tool supports installing skills from various sources, including shorthand for git repositories (e.g., `npx skills add vercel-labs/agent-skills`), full git URLs, and local file paths. The installer offers several options, such as targeting specific agents (`-a claude-code`), installing globally (`-g`), and running in non-interactive CI mode (`-y`). It can also discover skills by parsing manifest files like `.claude-plugin/marketplace.json` or `plugin.json` if they exist in the source repository.

## Ecosystem Components

The OpenCode ecosystem is composed of several key components that enable extensibility. The core primitive is the 'skill', but the broader architecture, drawing parallels with platforms like Claude Code, includes concepts such as Subagents, Plugins, Hooks, Memory, Permissions, and built-in Commands. These components work together to create a flexible environment where agents can be extended with new capabilities, governed by a permission model and triggered by various hooks.

## Protocol Integration

OpenCode enhances its capabilities by integrating with established industry protocols. It supports the Model Context Protocol (MCP), which allows the platform to connect to both local and remote MCP servers to add external tools to an agent's run. This makes a wide range of third-party functionalities available to the LLM. Additionally, OpenCode integrates with the Language Server Protocol (LSP) to access code diagnostics. This information is then provided as feedback to the LLM, improving its ability to understand and interact with the user's codebase.


# Npm Plugin Ecosystem Best Practices

## Project Name

Yeoman

## Discovery Mechanism

Yeoman discovers generators based on file system conventions. A generator must be a Node.js module in a folder named `generator-<name>`. For a generator to be indexed and discoverable by the wider community, its `package.json` file must contain the `yeoman-generator` keyword.

## Installation Method

The core Yeoman CLI (`yo`) is installed globally via `npm install -g yo`. Individual generators are also installed as npm packages, which the `yo` command then discovers and runs.

## Distribution Strategy

Generators are distributed as individual npm packages. The strict naming convention (`generator-name`) and keyword requirement (`yeoman-generator`) are central to their distribution and discovery within the Yeoman ecosystem.

## Project Name

Nx

## Discovery Mechanism

Nx plugins are discovered through project configuration. After being installed, they are added to the `nx.json` configuration file. Nx also provides its own plugin (`@nx/plugin`) with generators to scaffold new plugins, promoting a consistent structure.

## Installation Method

Plugins are standard npm packages and are installed using npm or yarn. They are then configured within the Nx workspace to be activated. Nx also provides a command `npx create-nx-plugin` to bootstrap new plugin development.

## Distribution Strategy

Plugins are published to the npm registry as scoped or unscoped packages (e.g., `@myorg/nx-plugin`). They package a well-defined set of features, including generators, executors, and migrations, providing a comprehensive way to integrate tools into an Nx workspace.

## Project Name

Vite

## Discovery Mechanism

Vite plugins are discovered through explicit programmatic registration. They must be included in the `plugins` array within the `vite.config.js` file. There is no automatic discovery based on naming conventions.

## Installation Method

Plugins are added to a project as `devDependencies` using a standard package manager like npm or yarn.

## Distribution Strategy

Plugins are distributed as npm packages. Vite's plugin API is designed to be compatible with many Rollup plugins, allowing it to leverage the existing Rollup ecosystem. Plugins can also be bundled into 'presets' for easier consumption.

## Project Name

ESLint

## Discovery Mechanism

ESLint uses a combination of a naming convention (`eslint-plugin-*`) and explicit configuration. Plugins are registered in a configuration file under the `plugins` key. By convention, the `eslint-plugin-` prefix is dropped when specifying the plugin's namespace in the config.

## Installation Method

Plugins are installed as `devDependencies` in the end-user's project via npm or yarn.

## Distribution Strategy

Plugins are distributed as npm packages. The ecosystem makes a clear distinction between 'plugins' (which provide custom rules) and 'shareable configs' (which bundle rulesets and plugin configurations). Shareable configs declare plugins as direct `dependencies` and specify ESLint itself as a `peerDependency`.

## Project Name

Prettier

## Discovery Mechanism

Prettier plugins are loaded explicitly. They can be specified via a command-line flag (`--plugin`), an API option (`plugins`), or in a configuration file. The string provided is passed to a dynamic `import()`, allowing plugins to be resolved by package name or file path.

## Installation Method

Plugins are typically installed as `devDependencies` via npm or yarn.

## Distribution Strategy

Plugins are distributed as npm packages that conform to Prettier's plugin contract. They must export specific objects, such as `languages`, `parsers`, and `printers`, to extend Prettier's formatting capabilities for new languages.


# Claude Code Skill System Analysis

The Claude Code skill ecosystem is designed with a multi-faceted and extensible architecture for managing agent capabilities. Skills are primarily structured within a '.claude/skills/' directory, which can exist at a project-specific level (within a repository) or a global user level ('~/.claude/skills/'). This file-based structure is recognized by other platforms like OpenCode, which also scans these directories for compatible skills. Distribution methods are varied to support different use cases: 'Project skills' are version-controlled directly with the codebase, 'Plugins' can bundle a set of skills as a single distributable unit, and 'Managed' skills can be deployed organization-wide by administrators. This ecosystem is not limited to skills alone; it is built upon a stack of related primitives including Subagents, Hooks, Memory management, a Permissions system, and Built-in commands, which together provide a rich framework for extending agent functionality. Installation and management are facilitated by tools like the 'vercel-labs/skills' CLI, which allows for targeted installation of skills to the Claude Code agent. Furthermore, the system supports discovery through manifest files such as '.claude-plugin/marketplace.json', enabling integration with broader plugin marketplaces.

# Cursor Rules And Plugin Architecture

Cursor's approach to extensibility is centered around a formal plugin architecture and a dedicated marketplace, representing a more structured model compared to purely file-based systems. A Cursor plugin acts as a comprehensive bundle that can contain multiple types of capabilities, including MCP (Model Context Protocol) servers for connecting to external tools, traditional skills and subagents for contextual knowledge, and hooks for custom functionality. A key differentiator in Cursor's architecture is the concept of 'Rules'. As described in the documentation, Rules provide system-level instructions to the agent, bundling prompts, scripts, and other elements to create shareable and manageable workflows. This multi-primitive plugin container allows for more complex and integrated extensions. The primary distribution channel is the Cursor Marketplace, which allows users to discover and install pre-built plugins from both curated sources and the community, streamlining the process of enhancing the IDE's agent capabilities.

# Codex And Copilot Agent Ecosystem

The skill ecosystems for Codex and GitHub Copilot demonstrate a flexible approach that combines local configuration with a formal plugin model, particularly within the VS Code environment. For Codex, the 'get-shit-done' project illustrates a distribution method where skills are packaged as 'SKILL.md' files within a specific directory structure ('skills/gsd-*/SKILL.md'), suggesting a pattern of distributing skill packs as collections of files. The GitHub Copilot agent skill system is more deeply integrated into the IDE. It allows skills to be defined locally and shared, with discovery managed through the 'chat.skillsLocations' setting in VS Code, which can point to any directory containing skill definitions. The system is also monorepo-aware, enabling it to discover skills located in parent repositories, which is highly practical for large projects. Furthermore, skills can be bundled within agent plugins and distributed through the marketplace. A key feature of the user experience is the 'Configure Skills' menu, which provides a centralized UI where users can discover and enable skills from all installed plugins and locally defined locations, offering a unified management interface.

# Cross Platform Agent Comparison

## Clean Context Windows

A critical differentiator between platforms is their approach to context isolation. The most robust architectural pattern, as suggested by the research, involves creating a fresh, minimal context window for each skill or subagent invocation. This means loading only the essential information: the specific SKILL.md file being executed, concise summaries of its immediate dependencies (not their full source), relevant code snippets identified via retrieval or LSP diagnostics, and specific slices of the current state or plan retrieved via an SDK. This prevents context bloat from entire project documents or long chat histories. An advanced approach includes an offline 'skill test harness' to run skills against fixtures, measure token usage, and assert context cleanliness. This contrasts with less sophisticated systems that may pollute the context window, leading to unpredictable and inefficient agent behavior. The ideal pattern uses phase-ordered orchestration (plan/execute/verify) with ephemeral memory, persisting structured artifacts like a STATE.md file rather than raw chat history to maintain an auditable and clean state.

## Practicality And Developer Experience

Practicality for developers hinges on standardization, good tooling, and clear contracts. The most effective ecosystems, drawing lessons from npm projects like Nx and Yeoman, provide strong CLI integration and scaffolding tools. A recommended pattern is a dual-packaging model: a full SDK with CLI tools, libraries, and types is published as a versioned npm package, while individual skills are lightweight, Git-native artifacts installable via a universal tool like 'npx skills add'. This separation provides stability for core logic (the SDK) and agility for skills. A single, declarative skill contract (e.g., SKILL.md with frontmatter) that is portable across platforms significantly improves the developer experience, as it allows them to write a skill once and deploy it to multiple agents. The inclusion of a test harness for offline validation and a Node.js sidecar for stable state and git operations (as seen in the GSD project) are key practical features.

## Consistency Of User Experience

Consistency for the end-user is best achieved by abstracting away the implementation details of different agent platforms. A universal installer CLI, such as 'npx skills add', provides a single, familiar command to add capabilities, regardless of whether the target is Claude Code, OpenCode, or another agent. This is further enhanced when the installer can target multiple agents simultaneously. On the discovery side, while marketplaces like Cursor's offer a curated experience, a consistent underlying skill contract (SKILL.md) and manifest format (marketplace.json) allow for skills to be presented predictably across different UIs. Centralized management interfaces, such as the 'Configure Skills' menu in VS Code for Copilot, are crucial for providing users with a single place to view, enable, and disable all their installed skills, creating a cohesive and less fragmented experience.

## Adherence To Architectural Patterns

Mature agent ecosystems move beyond ad-hoc scripts and adopt true, reusable architectural patterns. The research highlights several key patterns: 1) Hierarchical Skill Packs (a 'Meta-Builder' pattern), where skills are composable, have explicit dependencies, and can be bundled into larger, domain-specific packs. 2) Separation of Concerns, as exemplified by the GSD architecture, which isolates the stable, programmatic Node.js tool layer from the more dynamic, LLM-facing prompt artifacts. 3) Standardized Discovery Mechanisms, borrowing from ecosystems like ESLint and Yeoman, using a combination of naming conventions (e.g., 'skillpack-<name>'), package.json keywords, and well-defined file-based resolution rules. 4) Explicit Plugin Contracts, where the roles and capabilities of an extension are clearly defined in a manifest (SKILL.md frontmatter), similar to how Prettier defines languages and parsers. Platforms that adopt these patterns offer greater scalability, maintainability, and interoperability compared to those relying on inconsistent or proprietary solutions.


# Plugin Discovery And Installation Mechanisms

## File System Walking

This discovery mechanism involves searching predefined directory paths for skill or plugin definition files. The research shows this is a common pattern for AI agents. For instance, OpenCode discovers skills by looking for `SKILL.md` files in local project directories like `.opencode/skills/`, `.claude/skills/`, and `.agents/skills/`, walking up the file system from the current directory to the git worktree root. It also checks for global definitions in user configuration folders such as `~/.config/opencode/skills/`. Similarly, Claude Code skills reside in `.claude/skills` for project or global scope, and VS Code/Copilot can discover skills in local paths configured via the `chat.skillsLocations` setting and can also find them in parent repositories within a monorepo structure. This approach allows for project-specific, user-specific, and version-controlled skill sets that are co-located with the codebase.

## Package Naming Conventions

This discovery method relies on standardized naming prefixes or suffixes for npm packages, often combined with specific keywords in the `package.json` file, to allow a central tool to find compatible plugins. The research highlights several examples from mature JavaScript ecosystems. Yeoman discovers generators by looking for npm packages with names prefixed with `generator-` and containing the `yeoman-generator` keyword. Similarly, ESLint plugins conventionally use the `eslint-plugin-*` prefix, which the tool uses to resolve and namespace the plugin. The summary of the research recommends adopting this proven pattern for AI skills, suggesting names like `skillpack-<domain>` and including keywords like `agent-skill` or `opencode-skill` in `package.json` to improve discoverability on npm.

## Explicit Configuration Files

In this model, plugins are discovered and activated only when they are explicitly listed in a project's dedicated configuration file. This provides developers with clear, declarative control over which tools are active for a given project. The research points to several examples: Vite plugins are included in the `plugins` array within `vite.config.js`; Nx plugins are consumed via its configuration; ESLint flat configs use a `plugins` key to register plugin objects; and Prettier can load plugins specified in its configuration file. For AI agents, VS Code/Copilot employs a similar pattern, using the `chat.skillsLocations` setting to point to directories containing skills, making their inclusion an explicit configuration choice.

## Cli Installation Tools

This mechanism involves using a dedicated Command Line Interface (CLI) tool to manage the installation and setup of skills and plugins. This simplifies the process for end-users, abstracting away the details of where and how skills are stored. The `get-shit-done` project provides a single installer command, `npx get-shit-done-cc@latest`, which interactively handles installation for various target runtimes. A more generalized tool is the `vercel-labs/skills` CLI, which supports commands like `npx skills add <source>` to fetch skills from diverse sources including full Git URLs, repository paths (`owner/repo`), local file paths, and more. This tool can also target specific agents (`-a claude-code`), perform global installs (`-g`), and run in non-interactive CI modes, acting as a universal installer for a cross-platform skill ecosystem.


# Skill Packaging And Distribution Models

## Full Npm Packages

This distribution model involves packaging skills, tools, and an SDK as a complete, versioned npm package. This approach is well-suited for developers and for distributing complex, foundational capabilities. The research on tools like Nx shows that plugins are published as npm packages that bundle generators and executors. The analysis recommends this model for a 'Full SDK' package, which would include CLI executables (like GSD's `gsd-tools.cjs`), JavaScript modules for programmatic operations (e.g., state and config management), and TypeScript types for a better developer experience. This creates a stable, version-controlled foundation that other skills can be built upon, following patterns from ESLint's shareable configs which use `peerDependencies` to manage dependencies on the core engine.

## Lightweight Git Installs

This model focuses on the distribution of individual skills directly from a Git repository, typically managed by a dedicated CLI tool. It is designed for end-users who want to quickly add specific functionalities without the complexity of managing npm dependencies. The primary example from the research is the `vercel-labs/skills` CLI, which allows users to install skills with a command like `npx skills add owner/repo`. This fetches the skill directly from its source repository. The final recommendation strongly endorses this 'git-first' approach for individual skills, as it is decoupled from the npm registry and provides a direct, path-accurate way to acquire and update skills. This method offers flexibility and speed for users who are consuming, rather than developing, skills.

## Curated Marketplaces

This distribution model provides a centralized, user-friendly platform for discovering and installing plugins and skills. A marketplace typically offers a curated and vetted selection, which can increase user trust and simplify the discovery process. The research cites the Cursor Marketplace as a prime example, where users can browse and install prebuilt plugins that bundle various capabilities like MCP servers and skills. The analysis also notes that CLI-based installation can be integrated with marketplaces. The `vercel-labs/skills` CLI, for instance, can discover skills by reading manifest files like `.claude-plugin/marketplace.json` within a repository. This suggests a hybrid approach where a marketplace provides the discovery UI, while a CLI tool handles the underlying installation, offering a seamless user experience.


# Role Of Mcp And Lsp Integration

The analysis of platforms like OpenCode and Cursor reveals that the Model Context Protocol (MCP) and Language Server Protocol (LSP) are fundamental technologies for creating powerful and reliable AI agent skills. 

MCP serves as a standardized interface for exposing external tools to an AI agent. OpenCode uses MCP servers to allow agents to access both local and remote tools, effectively extending their capabilities beyond built-in functions. Similarly, Cursor plugins can bundle MCP servers to 'connect to external tools and learn new knowledge.' This protocol enables a secure and structured way to provide agents with new abilities, with the recommendation being to 'wrap external tools with clear schemas and auth policies.'

LSP integration provides the agent with a deep, real-time understanding of the codebase, mirroring the capabilities of a modern IDE. OpenCode integrates with LSP to 'surface diagnostics to the LLM and improve code interactions.' This means the agent doesn't just read code as plain text; it receives structured data about errors, warnings, and symbols. This allows for more intelligent and accurate code generation and modification. The research summary recommends exposing these 'LSP-derived diagnostics as structured inputs to skills' and even using mock LSP responses in a test harness to validate skill behavior. 

Together, MCP and LSP allow skills to be more robust and context-aware. They enable an agent to reason about code quality (via LSP) and execute complex, real-world actions (via MCP), moving beyond simple text manipulation.

# Optimal Hierarchical Skill Pack Architecture

## Pattern Name

Meta-Builder Pattern

## Core Concept

The fundamental concept is to structure skills as composable, hierarchical packs. A high-level 'Meta-skill' or 'Meta-Builder' defines complex agents, commands, and an inclusion graph of subordinate skills. Each skill is a self-contained unit with declared dependencies, allowing for the validation of dependency DAGs (Directed Acyclic Graphs) and the construction of sophisticated capabilities from smaller, reusable components.

## Natural Language Enablement

This architecture facilitates natural-language-driven configuration by allowing a high-level user request to be mapped to a corresponding 'Meta-skill'. This meta-skill then acts as a blueprint, automatically composing and configuring the required graph of subordinate skills, tools, and agents needed to fulfill the request. This abstracts the complexity of the underlying system, enabling users to configure an entire AI platform by describing the desired outcome in natural language.

## Architectural Components

The key components of this pattern include:
1.  **Declarative Skill Manifest (`SKILL.md`):** A file within each skill's directory containing YAML frontmatter that declares its name, ID, description, inputs, required permissions, hooks, tool bindings, and dependencies on other skills (`requires: [skill-ids]`).
2.  **Source-Controlled Directory Structure:** Skills are organized in a clear directory structure within a Git repository, such as `skills/<pack-name>/<skill-name>/SKILL.md`.
3.  **Dependency Graph:** Dependencies between skills are explicitly defined in the frontmatter, creating a graph that can be validated and traversed.
4.  **Generator Utilities:** A Node.js CLI tool is provided to help developers compose new skill packs, validate the dependency DAGs, and scaffold the necessary file structures.


# Recommended Skill Packaging Strategy

## Full Sdk For Developers

For developers building and integrating with the system, the recommended strategy is to package a full Software Development Kit (SDK) as a versioned, scoped npm module (e.g., `@org/skillpack-sdk`). This package is installed via `npm install`. It should contain stable programmatic APIs for core operations (state, config, git), CLI executables exposed via the `bin` field in `package.json`, and TypeScript type definitions for a better developer experience. This approach mirrors patterns from ESLint and Nx, using `peerDependencies` to declare dependencies on core agent hosts and `dependencies` for helper utilities.

## Individual Skills For Users

For end-users consuming skills, the recommended strategy is a lightweight, on-demand installation model. Individual skills are distributed as plain Git repositories or subfolders within repositories. Users can install them using a dedicated CLI command like `npx skills add owner/repo/tree/main/skills/<name>`. This approach, inspired by `vercel-labs/skills`, is git-first, decouples skill distribution from the npm registry, and allows for quick, path-accurate installation without requiring a full SDK dependency. For broader discovery, these skill repositories can optionally include manifest files like `.claude-plugin/marketplace.json`.


# Clean Context Window Patterns For Evaluation

## Evaluation Harness Design

A dedicated, offline 'skill test harness' should be created to run skills in a controlled and reproducible environment. This harness would be a CLI tool that executes a specific skill against a set of fixtures, such as a minimal repository slice, mock LSP diagnostics, and mock responses from MCP tools. It would then run assertions against the outputs, such as expected file edits, git deltas, CLI calls made, and logged decisions. This allows for automated testing, regression detection, and performance measurement (e.g., token usage per step) without live model calls.

## Context Isolation Techniques

To ensure a 'clean context window' for each skill execution, a fresh, minimal context must be established for every subagent invocation. This involves loading only the essential information required for the task: the `SKILL.md` of the invoking skill, concise capability summaries of its immediate dependencies (not their full bodies), relevant code snippets identified via retrieval or file globs, and specific slices of the current state or plan retrieved via the SDK. This strictly prevents context pollution from long chat histories or irrelevant project documentation.

## State Management And Reset

State management must be explicit and transactional to ensure consistency. All state mutations should be funneled through a dedicated SDK that makes operations idempotent and atomic, ideally by backing them with git commits or tags. For skill execution, subagents should be spawned with ephemeral memory that is discarded after the task is complete. Instead of relying on chat history for state, the system should persist key artifacts like `STATE.md` or decision logs, which can be selectively loaded into the context as needed. This ensures that each run starts from a predictable state.

## Defined Input Output Contracts

Stable integration and evaluation depend on clear, versioned contracts for skills. The primary contract is the declarative `SKILL.md` file, which defines the skill's inputs, outputs, and dependencies. An accompanying SDK should enforce these contracts at runtime, validating inputs and ensuring that any side effects (like file modifications or state changes) adhere to the skill's declared permissions and output schema. This prevents skills from having unintended side effects and ensures they can be reliably composed and tested.

