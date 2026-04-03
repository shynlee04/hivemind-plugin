# HIVEMIND Framework - Meta-Builder Skill System

## Core Purpose

Build a meta-builder skill system for OpenCode that enables users to create, modify, and orchestrate specialist features including tools, engines, runtime configurations, and multi-agent workflows for successful tech project development.

## System Architecture

### Runtime Control Layer

The runtime system governs agent behavior through:

- **Session Management**: Users can resume, fork from messages (creating new forked session ledgers), or undo/redo turns within sessions
- **Turn-Based Execution**: Each turn triggers a new API call to the LLM, affecting agent profile bodies that may get pruned over long conversations
- **Runtime Variables**: Commands, prompts (as workflows), rules, permissions, agents, subagents, and skills can refresh agent instruction sets
- **Session Types**: Main-facing user sessions and isolated subagent sessions for context delegation

### Soft Concepts Stack (Zero-Dependency)

The following OpenCode soft concepts can be modified by users through configuration files:

- **Commands**: Located in `.opencode/` folders with `.md` files and YAML frontmatter
- **Prompts (Workflows)**: Reusable workflow definitions
- **Rules**: Behavioral guidelines for agents
- **Permissions**: Control which tools, skills, and commands are available to agents and subagents
- **Agents vs Subagents**: Hierarchical agent relationships
- **Skills**: The most flexible concept, portable across platforms (Tier 3)

### Configuration Locations

Users modify soft concepts through:
- `opencode.json`
- `settings.json`
- `.opencode/*.md` (project-only config)
- `~/.config/opencode/*.json`
- `.opencode/` folder `.md` files with frontmatter

### Plugins vs Custom Tools

**Plugins**: Subscribe to events via internal hooks, add functions through installed npm libraries

**Custom Tools**: 
- Split by agent type, workflow, or classification
- Receive session context
- Use Zod for argument schema definition
- Can be written in Python or other languages

---

## Meta-Builder Skill Specifications

### Primary Role

Specialist in building advanced chaining of meta concepts using OpenCode's soft concepts, enabling users to modify, improve, and tailor workflows to fit their needs.

### Referenced Documentation Files

```
opencode-agents.md
opencode-built-in-tools.md
opencode-commands.md
opencode-configs.md
opencode-lsp-servers.md
opencode-mcp-servers.md
opencode-permissions.md
opencode-skills.md
opencode-custom-tools.md
opencode-rules.md
```

---

## Skill Group Architecture

### GROUP 1: Core Implementation Skills

#### 1. `user-intent-interactive-loop`
The iterative, hierarchical skill for:
- Eliciting user ideas and brainstorming
- Deep investigation and research
- Maintaining control across long-haul sessions
- Strategic delegation while updating users

#### 2. `coordinating-loop`
Handles:
- Agent hand-offs and dispatching
- Decision between sequential vs parallel execution
- Parent-child cycle iteration
- Phase management with scripting techniques
- Ralph-loop integration as bundle-ready kit

#### 3. `planning-with-files`
- Template-rich planning system
- Sample scripts and assets
- Reference implementations to prevent agent hallucination

#### 4. `tech-to-feature-synthesis`
- Converts technical capabilities into user-facing features
- Deep investigation and research capabilities
- Long-memory persistence through subagent spawning
- Progressive planning

#### 5. `deep-investigation` and `deep-research-loop`
- Domain research (technical or market/product analysis)
- Loop-based subagent spawning
- Memory sustainment across sessions
- Integration with meta-concept skills

#### 6. TDD and Spec-Driven Development
- Test-driven development patterns
- Specification-based workflows

### GROUP 2: Meta-Builder Exclusive Domain Skills

#### `use-authoring-skill` - Core Domain Skill

This skill bridges to all other skill packages as foundational knowledge:

**Implementation Standards**:
- Frame skeleton first, then iterate extremely
- Address with hierarchy and node-targeting
- Apply test-driven development approach
- Maintain consistency and edge-case awareness
- Use clear, measurable metrics
- Be concise and articulate
- Organize phases and steps clearly
- Prioritize organization over confusion
- Apply smart, deterministic estimation

#### Skill Authoring Cycle

```
Create → Audit → Evaluate → Doctor
```

**Cohesive Organization Requirements**:
- Domain-pattern and step-advanced pattern support
- Bundles for files, assets, references, examples, scripts, schemas, and models
- Cross-linkages between skills, agents, tools, commands, and workflows
- Real-life use case focus (including edge cases)

---

## Hivefiver Orchestrator Pattern

### Multi-Team Research Agents

The orchestrator delegates subagents using tools and chains soft concepts, governed by runtime concepts through iterative phases.

### Example Workflow (Multi-Team Market & Deep Tech Research)

**Request**: "Create custom multi-team market and deep tech research agents that can learn, synthesize API patterns, and support semi-automated building"

**Builder Process**:
1. Breakdown into phases
2. Build concepts as complete cycle
3. Self-testing phase
4. User validation phase
5. Repeat and research as needed
6. Iterative atomic commits

**Command Chaining**:
- Determine which agents/subagents execute commands
- Define expected behaviors and loop results
- Continue to next batch only when current batch passes
- Iterate on failures

### Natural Language Intent Detection

The meta-builder must:
- Detect user intent through natural language
- Stack concepts progressively
- Enable direct invocation or autonomous detection

---

## Success Criteria

The meta-builder skill system achieves success when:
- Users can configure and create custom workflows
- Multi-agent orchestration executes reliably
- Skills maintain hierarchy and cross-linkages
- Long-horizon sessions persist memory and context
- Edge cases are handled gracefully
- Clear measurable metrics define success
- Organization and clarity dominate over confusion