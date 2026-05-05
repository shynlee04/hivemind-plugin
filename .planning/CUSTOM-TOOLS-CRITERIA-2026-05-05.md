# Custom Tools Design Criteria

**Document Version:** 1.0.0
**Date:** 2026-05-05
**Author:** hf-l2-prompter (L2 Prompt Engineering Specialist)
**Status:** ACTIVE — Reference standard for all custom tool design, audit, and development
**Scope:** Hivemind V3 harness (`src/tools/`) and any future custom tool development

---

## Purpose

This document defines the **correct design criteria** for custom tools in the Hivemind harness ecosystem. It serves as:

1. **Design Standard** — What correct tool design looks like based on industry best practices
2. **Validation Metrics** — Measurable criteria for auditing existing tools
3. **Development Guide** — Practical guidance for building new tools
4. **Anti-Pattern Catalog** — What to avoid (based on industry standards, not legacy codebase patterns)

> **IMPORTANT:** The existing codebase tools may contain patterns that deviate from these criteria. This document defines the **target state**, not the current state. Use it to guide refactoring and new development.

---

## Table of Contents

1. [Tool Classification Matrix](#1-tool-classification-matrix)
2. [Criterion 1: Discoverability](#2-criterion-1-discoverability)
3. [Criterion 2: Deterministic Behavior](#3-criterion-2-deterministic-behavior)
4. [Criterion 3: Composability](#4-criterion-3-composability)
5. [Criterion 4: Granularity & Naming](#5-criterion-4-granularity--naming)
6. [Criterion 5: Schema Validation](#6-criterion-5-schema-validation)
7. [Criterion 6: Non-Conflict](#7-criterion-6-non-conflict)
8. [Criterion 7: Ergonomics](#8-criterion-7-ergonomics)
9. [Criterion 8: Purpose-Driven Design](#9-criterion-8-purpose-driven-design)
10. [Criterion 9: Ecosystem Integration](#10-criterion-9-ecosystem-integration)
11. [Criterion 10: Justified Existence](#11-criterion-10-justified-existence)
12. [Validation Checklist](#12-validation-checklist)
13. [References](#13-references)

---

## 1. Tool Classification Matrix

Custom tools MUST be classified into one of 8 categories. Classification determines naming conventions, scope boundaries, and integration patterns.

| Category | Purpose | Tool Prefix | Example Tools | Lineage |
|----------|---------|-------------|---------------|---------|
| **C1: Task Management & Coordination** | Delegation dispatch, status polling, hand-off, governance loops | `delegate-*`, `task-*` | `delegate-task`, `delegation-status` | hm-*, hf-* |
| **C2: Governance & State** | State updates, context governance, context purification, memory persistence | `state-*`, `context-*` | `session-patch`, `continuity-*` | hm-* |
| **C3: Inspection & Research** | Investigation, research-based analysis, knowledge synthesis | `inspect-*`, `research-*` | `prompt-skim`, `prompt-analyze`, `hivemind-doc` | hm-* |
| **C4: Code Intelligence** | AST analysis, signatures, symbols, type injections | `code-*`, `ast-*` | (future: `symbol-lookup`, `type-inject`) | hm-* |
| **C5: Planning & Artifacts** | Planning documents, doc-intelligence, hierarchical planning | `plan-*`, `doc-*` | `session-journal-export` | hm-* |
| **C6: Quality & Guardrails** | Audit, review, verification, compliance | `audit-*`, `verify-*` | `validate-restart` | hm-*, gate-* |
| **C7: Gate-Keeping & Integration** | Cross-domain evidence-based verification, integration checks | `gate-*`, `integrate-*` | (future: `evidence-check`, `integration-verify`) | gate-* |
| **C8: Lineage & Classification** | hm-*/hf-*/shared classification, routing | `lineage-*`, `classify-*` | (future: `lineage-classify`) | shared |

### Classification Rules

1. **Every tool MUST belong to exactly one category.** If a tool spans categories, split it into separate tools.
2. **Category determines prefix.** Tools MUST use the prefix约定 for their category.
3. **Lineage determines ownership.** hm-* tools serve product development; hf-* tools serve meta-builder workflows; gate-* tools serve quality assurance; shared tools serve all lineages.
4. **Cross-category tools are anti-patterns.** A tool that manages state AND delegates work violates single-responsibility.

---

## 2. Criterion 1: Discoverability

### Standard

Tools MUST be discoverable by agents without obfuscation in descriptions. An agent encountering a tool for the first time MUST understand its purpose, inputs, outputs, and side effects from the description alone.

### Success Metrics

| Metric | Target | Validation Method |
|--------|--------|-------------------|
| **Description clarity** | Agent can predict tool behavior from description alone | Blind test: give description to agent, ask what tool does |
| **Parameter documentation** | 100% of args have `.describe()` with clear purpose | Code review: grep for missing `.describe()` calls |
| **Side-effect disclosure** | Description mentions if tool mutates state | Manual review of description text |
| **Example availability** | Complex tools (>3 args) include usage examples in description | Code review: check description length and content |

### Guidelines

1. **Description MUST answer:** What does this tool do? When should I use it? What does it return?
2. **Description MUST NOT:** Be vague ("Handles tasks"), be overly technical ("Invokes SDK session.create with parentID resolution"), or omit side effects.
3. **Parameter descriptions MUST:** State the purpose, expected format, and constraints.
4. **Use imperative mood:** "Dispatch work to a specialist agent" not "This tool dispatches work..."

### Anti-Patterns

| Anti-Pattern | Why It's Wrong | Correct Approach |
|--------------|----------------|------------------|
| **Vague descriptions** ("Manages sessions") | Agent cannot determine when to use tool | "Create, retrieve, or abort OpenCode sessions by ID" |
| **Missing parameter docs** | Agent guesses at input format | Every arg gets `.describe("Purpose, format, constraints")` |
| **Hidden side effects** | Agent doesn't know tool mutates state | "Persists delegation record to `.hivemind/state/delegations.json`" |
| **Technical jargon in descriptions** | Agent may not understand implementation details | Use domain language, not implementation language |

---

## 3. Criterion 2: Deterministic Behavior

### Standard

Tools MUST be deterministic, condition-based, or event-driven. A tool with the same inputs MUST produce the same outputs (or predictable state transitions). Tools MUST be classified by their behavior model.

### Behavior Models

| Model | Description | Example | State Impact |
|-------|-------------|---------|--------------|
| **Deterministic** | Same input → same output, no side effects | `prompt-skim` (analyze text, return metrics) | None |
| **Condition-based** | Output depends on current state, but transitions are predictable | `delegation-status` (returns current state of delegation) | Read-only |
| **Event-driven** | Triggered by lifecycle events, produces side effects | `delegate-task` (creates session, persists record) | Mutation |
| **State-mutating** | Explicitly changes persistent state | `session-patch` (modifies session files) | Mutation |

### Success Metrics

| Metric | Target | Validation Method |
|--------|--------|-------------------|
| **Behavior classification** | Every tool has documented behavior model | Review tool metadata/frontmatter |
| **Idempotency (where applicable)** | Read-only tools return same result for same input | Unit test: call twice, compare outputs |
| **State transition documentation** | Mutation tools document before/after states | Review tool description and code |
| **Error determinism** | Same error conditions produce same error responses | Unit test: trigger error, verify response shape |

### Guidelines

1. **Document the behavior model** in tool description or frontmatter.
2. **Read-only tools MUST be idempotent.** Calling `delegation-status` twice with same args returns same result.
3. **Mutation tools MUST document state transitions.** "Before: delegation is `pending`. After: delegation is `dispatched`."
4. **Event-driven tools MUST document triggers.** "Fires on: `session.idle`, `session.error`."

### Anti-Patterns

| Anti-Pattern | Why It's Wrong | Correct Approach |
|--------------|----------------|------------------|
| **Undocumented side effects** | Agent doesn't know tool changes state | Document all state mutations in description |
| **Non-idempotent reads** | Calling read tool twice gives different results | Ensure read tools are pure functions of current state |
| **Hidden state dependencies** | Tool output depends on undocumented internal state | Document all state dependencies |
| **Race conditions** | Concurrent calls produce inconsistent results | Use keyed semaphore or document concurrency model |

---

## 4. Criterion 3: Composability

### Standard

Tools MUST support composition via sub-tools, `$ARGUMENTS`, and plugin integration. Tools SHOULD be designed as building blocks that can be chained together.

### Composition Patterns

| Pattern | Description | Example |
|---------|-------------|---------|
| **Sub-tool routing** | Single tool with action parameter routes to different behaviors | `run-background-command` with `action: "run" | "output" | "input" | "terminate"` |
| **Pipeline chaining** | Output of one tool feeds into next tool | `prompt-skim` → `prompt-analyze` → `session-patch` |
| **Plugin integration** | Tool can be extended or wrapped by plugins | Tool uses `ToolResponse<T>` envelope for uniform handling |
| **$ARGUMENTS support** | Tool accepts dynamic arguments from command parsing | Command invokes tool with parsed arguments |

### Success Metrics

| Metric | Target | Validation Method |
|--------|--------|-------------------|
| **Action routing (where applicable)** | Multi-purpose tools use action enum | Code review: check for action parameter |
| **Pipeline compatibility** | Tools return structured data that downstream tools can consume | Integration test: chain tools |
| **Plugin extensibility** | Tool behavior can be modified via plugin hooks | Verify `tool.execute.before`/`after` hooks work |
| **Response envelope consistency** | All tools return `ToolResponse<T>` | Code review: grep for return types |

### Guidelines

1. **Multi-purpose tools MUST use action routing.** Single tool with `action` enum is preferred over multiple similar tools.
2. **All tools MUST return `ToolResponse<T>` envelope.** This enables uniform error handling and pipeline chaining.
3. **Tools SHOULD accept structured input** that can be produced by other tools.
4. **Document composition patterns** in tool description: "Use after `prompt-skim` to analyze flagged issues."

### Anti-Patterns

| Anti-Pattern | Why It's Wrong | Correct Approach |
|--------------|----------------|------------------|
| **Monolithic tools** | Single tool does too many things | Split into composable sub-tools |
| **Inconsistent return types** | Tools return different shapes, breaking pipelines | Use `ToolResponse<T>` envelope |
| **No action routing** | Multiple similar tools when one with actions would suffice | Use action enum for multi-purpose tools |
| **Tight coupling** | Tool only works with specific other tools | Design tools to accept generic input |

---

## 5. Criterion 4: Granularity & Naming

### Standard

Tools MUST be granular with clear naming conventions. Tool names MUST be descriptive, follow kebab-case, and indicate the tool's category and purpose.

### Naming Convention

```
<category-prefix>-<action>-<object>
```

| Component | Description | Examples |
|-----------|-------------|----------|
| **category-prefix** | Matches tool classification (C1-C8) | `delegate-`, `state-`, `inspect-`, `audit-` |
| **action** | Verb describing what tool does | `create-`, `get-`, `update-`, `delete-`, `export-`, `validate-` |
| **object** | Noun describing what tool operates on | `-task`, `-session`, `-delegation`, `-journal` |

### Success Metrics

| Metric | Target | Validation Method |
|--------|--------|-------------------|
| **Kebab-case compliance** | 100% of tool names use kebab-case | Automated check: regex `^[a-z]+(-[a-z]+)*$` |
| **Category prefix compliance** | 100% of tools have correct category prefix | Manual review against classification matrix |
| **Name-action alignment** | Tool name accurately describes what it does | Blind test: read name, predict behavior |
| **LOC per tool** | ≤200 LOC per tool file (excluding tests) | Automated check: `wc -l` on tool files |

### Guidelines

1. **Tool name = filename.** OpenCode uses filename as tool name. Name the file correctly.
2. **Use kebab-case exclusively.** No camelCase, no snake_case, no PascalCase.
3. **Name MUST describe action + object.** `delegate-task` not `dt` or `delegationTool`.
4. **Keep tools small.** If a tool exceeds 200 LOC, consider splitting into sub-tools.
5. **Avoid generic names.** `manage-sessions` is too broad. `create-session`, `get-session`, `abort-session` are better.

### Anti-Patterns

| Anti-Pattern | Why It's Wrong | Correct Approach |
|--------------|----------------|------------------|
| **Generic names** ("manage", "handle", "process") | Doesn't indicate specific purpose | Use specific verbs: "create", "get", "update", "delete" |
| **Abbreviations** ("del-task", "dlg-stat") | Reduces discoverability | Use full words: "delegate-task", "delegation-status" |
| **Inconsistent naming** | Some tools use prefixes, others don't | Follow the naming convention consistently |
| **Oversized tools** (>500 LOC) | Hard to test, hard to understand | Split into smaller, focused tools |

---

## 6. Criterion 5: Schema Validation

### Standard

Tools MUST use Zod schemas for structured outputs and edge case handling. All tool arguments MUST be validated at the boundary. All tool responses MUST conform to documented schemas.

### Schema Requirements

| Component | Requirement | Example |
|-----------|-------------|---------|
| **Input schema** | All args defined with Zod types | `args: { query: tool.schema.string().describe("...") }` |
| **Output schema** | Return type documented via `ToolResponse<T>` | `ToolResponse<{ count: number }>` |
| **Validation** | Input validated at boundary, not deep in code | `DelegateTaskInputSchema.parse(args)` at tool entry |
| **Error handling** | Validation errors return structured error response | `error("Invalid input: " + zodError.message)` |

### Success Metrics

| Metric | Target | Validation Method |
|--------|--------|-------------------|
| **Zod schema coverage** | 100% of tool args have Zod schemas | Code review: check all `args` objects |
| **Boundary validation** | Validation happens at tool entry, not deep in code | Code review: check for `.parse()` calls |
| **Type safety** | No `any` types in tool signatures | TypeScript strict mode check |
| **Error response structure** | All errors return `ToolResponse` with kind: "error" | Code review: check error paths |

### Guidelines

1. **Define schemas at the boundary.** Validate input before any business logic.
2. **Use `tool.schema` (Zod) for all arguments.** Never accept raw `any` or untyped input.
3. **Return `ToolResponse<T>` for all outcomes.** Success, error, and pending states.
4. **Document schema in description.** Agent needs to know expected input shape.
5. **Use `.describe()` on every schema field.** This becomes the agent's documentation.

### Anti-Patterns

| Anti-Pattern | Why It's Wrong | Correct Approach |
|--------------|----------------|------------------|
| **No input validation** | Invalid input causes runtime errors | Validate with Zod at boundary |
| **Raw string returns** | Agent can't parse structured results | Return `ToolResponse<T>` with typed data |
| **Deep validation** | Validation happens in business logic, not at entry | Validate at tool entry point |
| **Missing `.describe()`** | Agent doesn't know what field expects | Every field gets `.describe()` |

---

## 7. Criterion 6: Non-Conflict

### Standard

Tools MUST NOT conflict with existing tools. Custom tools MUST NOT shadow built-in OpenCode tools unless explicitly intended and documented. Tool names MUST be unique within the harness.

### Conflict Types

| Type | Description | Detection |
|------|-------------|-----------|
| **Name collision** | Custom tool has same name as built-in tool | Check against OpenCode built-in tool list |
| **Behavior overlap** | Custom tool does same thing as existing tool | Review existing tools before creating new one |
| **Side-effect conflict** | Two tools mutate same state in incompatible ways | Review state mutation paths |
| **Permission conflict** | Tool requires permissions that conflict with agent restrictions | Check agent permission model |

### Success Metrics

| Metric | Target | Validation Method |
|--------|--------|-------------------|
| **Name uniqueness** | 0 name collisions with built-in tools | Automated check against tool registry |
| **Behavior uniqueness** | Each tool has distinct purpose | Manual review of tool descriptions |
| **State isolation** | Tools don't interfere with each other's state | Review state mutation paths |
| **Permission compliance** | Tools respect agent permission boundaries | Test with restricted agents |

### Guidelines

1. **Check existing tools before creating new ones.** Review `src/tools/` and OpenCode built-ins.
2. **Document intentional overrides.** If a tool intentionally shadows a built-in, document why.
3. **Use namespaced prefixes.** `hivemind-*` prefix for harness-specific tools.
4. **Avoid state conflicts.** Each tool should own its state domain.

### Anti-Patterns

| Anti-Pattern | Why It's Wrong | Correct Approach |
|--------------|----------------|------------------|
| **Shadowing built-ins without documentation** | Agent confusion about which tool is active | Document intentional overrides |
| **Duplicate functionality** | Two tools do the same thing | Consolidate into one tool |
| **Shared mutable state** | Tools interfere with each other | Use namespaced state or CQRS boundaries |
| **Permission escalation** | Tool bypasses agent restrictions | Respect permission model |

---

## 8. Criterion 7: Ergonomics

### Standard

Tools MUST be easy to use with minimal required fields. Tools MUST be accessible mid-run without requiring session restart. Tool invocation SHOULD require the fewest possible arguments.

### Ergonomic Principles

| Principle | Description | Example |
|-----------|-------------|---------|
| **Minimal required args** | Only essential fields are required; others have defaults | `delegate-task` requires `agent` and `prompt`; `title` is optional |
| **Sensible defaults** | Optional fields have reasonable defaults | `safetyCeilingMs` defaults to 300000 (5 min) |
| **Progressive disclosure** | Simple use case is simple; complex use case is possible | Basic: `delegate-task({ agent: "researcher", prompt: "..." })` |
| **Mid-run accessibility** | Tool can be invoked at any point in conversation | No session restart required |

### Success Metrics

| Metric | Target | Validation Method |
|--------|--------|-------------------|
| **Required args count** | ≤3 required arguments per tool | Code review: count required fields |
| **Default coverage** | All optional fields have defaults | Code review: check for `.default()` or fallback logic |
| **Invocation simplicity** | Common use case requires minimal args | Agent test: invoke tool for common case |
| **Mid-run availability** | Tool works at any conversation point | Integration test: invoke mid-session |

### Guidelines

1. **Minimize required arguments.** If a field can have a default, make it optional.
2. **Provide sensible defaults.** Defaults should work for the common case.
3. **Support progressive disclosure.** Simple invocation for simple cases.
4. **Document common patterns.** Show the simplest invocation first.

### Anti-Patterns

| Anti-Pattern | Why It's Wrong | Correct Approach |
|--------------|----------------|------------------|
| **Too many required fields** | Increases cognitive load | Make fields optional with defaults |
| **No defaults** | Agent must specify everything | Provide sensible defaults |
| **Complex invocation** | Simple task requires complex args | Design for the common case first |
| **Session-dependent** | Tool only works at specific session points | Design for mid-run accessibility |

---

## 9. Criterion 8: Purpose-Driven Design

### Standard

Tools MUST be well-designed for specific use cases with routing. Each tool MUST have a clear, singular purpose. Tools SHOULD route to appropriate handlers based on input.

### Design Patterns

| Pattern | Description | Example |
|---------|-------------|---------|
| **Single Responsibility** | Each tool does one thing well | `delegate-task` only dispatches; `delegation-status` only polls |
| **Action Routing** | Multi-purpose tool routes to handlers | `run-background-command` routes by `action` field |
| **Category Gates** | Tools enforce category-specific rules | Category gates in delegation manager |
| **Error Routing** | Errors route to appropriate handlers | Validation errors → structured error response |

### Success Metrics

| Metric | Target | Validation Method |
|--------|--------|-------------------|
| **Single responsibility** | Each tool has one clear purpose | Blind test: describe tool, get one-sentence purpose |
| **Action routing (where applicable)** | Multi-purpose tools use action enum | Code review: check for action parameter |
| **Error handling completeness** | All error paths return structured responses | Code review: check all throw/catch paths |
| **Purpose documentation** | Tool description states singular purpose | Review tool descriptions |

### Guidelines

1. **One tool, one purpose.** If you can't describe the tool's purpose in one sentence, split it.
2. **Use action routing for multi-purpose tools.** Single tool with action enum is better than multiple similar tools.
3. **Route errors appropriately.** Validation errors, runtime errors, and business errors should all be handled.
4. **Document the purpose clearly.** "This tool dispatches work to a specialist agent via SDK child-session."

### Anti-Patterns

| Anti-Pattern | Why It's Wrong | Correct Approach |
|--------------|----------------|------------------|
| **Kitchen sink tools** | Tool does too many things | Split into focused tools |
| **No error routing** | Errors are swallowed or generic | Route errors to appropriate handlers |
| **Unclear purpose** | Agent doesn't know when to use tool | Document singular purpose |
| **Mixed concerns** | Tool handles unrelated responsibilities | Separate concerns into different tools |

---

## 10. Criterion 9: Ecosystem Integration

### Standard

Tools MUST integrate and harmonize with the broader ecosystem. Tools MUST respect CQRS boundaries, agent hierarchies, and state management patterns. Tools SHOULD leverage existing infrastructure (continuity, concurrency, lifecycle).

### Integration Points

| Integration | Description | Requirement |
|-------------|-------------|-------------|
| **CQRS Boundaries** | Tools are write-side; hooks are read-side | Tools MAY mutate state; hooks MUST NOT |
| **Agent Hierarchy** | Tools respect front-facing vs. subagent boundaries | Tools document which agent types should use them |
| **State Management** | Tools use continuity.ts for persistence | Tools write to `.hivemind/state/` (Q6 canonical) |
| **Concurrency** | Tools use keyed semaphore for concurrent access | Tools document concurrency model |
| **Lifecycle** | Tools participate in session lifecycle | Tools document lifecycle hooks they use |

### Success Metrics

| Metric | Target | Validation Method |
|--------|--------|-------------------|
| **CQRS compliance** | Tools don't violate write-side boundary | Code review: check for hook-side mutations |
| **State root compliance** | Tools write to `.hivemind/state/` | Code review: check file paths |
| **Concurrency safety** | Tools handle concurrent access correctly | Stress test: concurrent invocations |
| **Lifecycle participation** | Tools document lifecycle hooks | Review tool documentation |

### Guidelines

1. **Respect CQRS boundaries.** Tools are the only write-side mutation surface.
2. **Use canonical state paths.** Write to `.hivemind/state/`, not `.opencode/state/`.
3. **Leverage existing infrastructure.** Use `continuity.ts` for persistence, `concurrency.ts` for queuing.
4. **Document integration points.** State which hooks, lifecycle events, and state modules the tool uses.

### Anti-Patterns

| Anti-Pattern | Why It's Wrong | Correct Approach |
|--------------|----------------|------------------|
| **CQRS violations** | Hooks writing state breaks architecture | Tools write, hooks read |
| **Wrong state paths** | Writing to `.opencode/state/` (legacy) | Use `.hivemind/state/` (Q6 canonical) |
| **Duplicated infrastructure** | Tool reimplements persistence or concurrency | Use existing `continuity.ts`, `concurrency.ts` |
| **Undocumented integration** | Agent doesn't know tool's ecosystem dependencies | Document all integration points |

---

## 11. Criterion 10: Justified Existence

### Standard

Custom tools MUST outperform innate/MCP tools to justify existence. A custom tool MUST provide clear value over using built-in tools or MCP servers. If a built-in tool or MCP server can do the job, don't create a custom tool.

### Justification Criteria

| Criterion | Description | Example |
|-----------|-------------|---------|
| **Domain specificity** | Tool handles domain-specific logic that built-ins can't | `delegate-task` handles WaiterModel delegation (not in built-ins) |
| **State integration** | Tool integrates with harness state management | `delegation-status` reads from continuity store |
| **Pipeline integration** | Tool participates in tool pipelines | `prompt-skim` → `prompt-analyze` → `session-patch` |
| **Performance** | Tool is faster than equivalent built-in/MCP approach | Direct function call vs. external process |
| **Security** | Tool enforces harness-specific security rules | `validate-restart` checks primitive discoverability |

### Success Metrics

| Metric | Target | Validation Method |
|--------|--------|-------------------|
| **Value justification** | Every custom tool has documented justification | Review tool documentation |
| **No built-in alternative** | No custom tool duplicates built-in functionality | Compare against OpenCode built-in tool list |
| **No MCP alternative** | No custom tool duplicates MCP server functionality | Compare against available MCP servers |
| **Performance parity** | Custom tool performs as well as or better than alternatives | Benchmark: custom vs. built-in/MCP |

### Guidelines

1. **Document why this tool exists.** "This tool exists because [built-in/MCP] cannot [specific capability]."
2. **Check built-ins first.** OpenCode provides `read`, `write`, `bash`, `glob`, `grep`, `edit`, `todowrite`, `skill`.
3. **Check MCP servers second.** MCP servers may provide the functionality you need.
4. **Only create custom tools for harness-specific logic.** Delegation, state management, lifecycle integration.

### Anti-Patterns

| Anti-Pattern | Why It's Wrong | Correct Approach |
|--------------|----------------|------------------|
| **Reimplementing built-ins** | Wasted effort, maintenance burden | Use built-in tools |
| **MCP duplication** | Custom tool does what MCP server already does | Use MCP server |
| **No justification** | Tool exists without clear value proposition | Document why tool exists |
| **Over-engineering** | Simple task gets complex custom tool | Use built-in tools for simple tasks |

---

## 12. Validation Checklist

Use this checklist to audit existing tools or validate new tool designs.

### Pre-Development Checklist

- [ ] **Classification:** Tool classified into one of 8 categories (C1-C8)
- [ ] **Justification:** Documented why built-in/MCP tools are insufficient
- [ ] **Naming:** Tool name follows `<category-prefix>-<action>-<object>` convention
- [ ] **Scope:** Tool has single, clear purpose
- [ ] **Conflicts:** No name or behavior conflicts with existing tools

### Design Checklist

- [ ] **Discoverability:** Description answers what, when, and what-it-returns
- [ ] **Behavior Model:** Documented as deterministic, condition-based, event-driven, or state-mutating
- [ ] **Schema:** All args have Zod schemas with `.describe()`
- [ ] **Defaults:** Optional fields have sensible defaults
- [ ] **Required Args:** ≤3 required arguments
- [ ] **Response Envelope:** Returns `ToolResponse<T>` for all outcomes
- [ ] **Composition:** Supports pipeline chaining or action routing

### Implementation Checklist

- [ ] **Boundary Validation:** Input validated at tool entry with Zod `.parse()`
- [ ] **Error Handling:** All error paths return structured `ToolResponse` errors
- [ ] **CQRS Compliance:** Tool respects write-side boundary
- [ ] **State Compliance:** Writes to `.hivemind/state/` (Q6 canonical)
- [ ] **Concurrency Safety:** Handles concurrent access correctly
- [ ] **LOC Compliance:** ≤200 LOC per tool file (excluding tests)
- [ ] **No `any` Types:** TypeScript strict mode compliance

### Documentation Checklist

- [ ] **Purpose:** One-sentence purpose statement
- [ ] **Behavior Model:** Documented behavior classification
- [ ] **Side Effects:** All state mutations documented
- [ ] **Integration Points:** Hooks, lifecycle events, state modules documented
- [ ] **Usage Examples:** Common invocation patterns documented
- [ ] **Error Cases:** Error conditions and responses documented

### Post-Implementation Checklist

- [ ] **Unit Tests:** All code paths tested
- [ ] **Integration Tests:** Tool works in pipeline with other tools
- [ ] **Agent Test:** Agent can discover and use tool correctly
- [ ] **Performance:** Tool performs within acceptable limits
- [ ] **Documentation:** All documentation checklist items complete

---

## 13. References

### On-Disk References

| Reference | Location | Purpose |
|-----------|----------|---------|
| Architecture | `.planning/codebase/ARCHITECTURE.md` | Project architecture overview |
| Session Context | `.hivemind/state/session-context-prompt.md` | Workflow state |
| Agent Hierarchy | `AGENTS.md` | Project rules and agent hierarchy |
| Tool Response | `src/shared/tool-response.ts` | Standard response envelope |
| Tool Implementations | `src/tools/` | Existing tool code |

### External References

| Reference | URL | Purpose |
|-----------|-----|---------|
| OpenCode Custom Tools | https://opencode.ai/docs/custom-tools | Platform tool creation guide |
| OpenCode Plugins | https://opencode.ai/docs/plugins/ | Plugin system documentation |
| Zod Documentation | https://zod.dev/ | Schema validation library |
| OpenCode SDK | https://opencode.ai/docs/sdk | SDK documentation |

### Architectural Decisions

| Decision | Description | Impact on Tools |
|----------|-------------|-----------------|
| **Q1** | Hybrid + Spec-Driven Automated Runtime Detection | Tools may integrate with runtime detection |
| **Q3** | Session Journal as Complement + Time-Machine | Tools should participate in journaling |
| **Q6** | `.hivemind/` is internal state root | Tools MUST write to `.hivemind/state/` |

---

## Appendix A: Tool Template

```typescript
import { tool } from "@opencode-ai/plugin"
import { z } from "zod"
import { success, error, type ToolResponse } from "../shared/tool-response"

/**
 * [Tool Name] — [One-sentence purpose]
 *
 * @category [C1-C8]
 * @behavior [deterministic | condition-based | event-driven | state-mutating]
 * @lineage [hm-* | hf-* | gate-* | shared]
 * @side-effects [None | Lists all state mutations]
 */
export default tool({
  description: [
    "[What this tool does]",
    "[When to use this tool]",
    "[What it returns]",
    "[Side effects, if any]",
  ].join("\n"),

  args: {
    requiredArg: tool.schema
      .string()
      .describe("[Purpose, format, constraints]"),

    optionalArg: tool.schema
      .number()
      .optional()
      .default(100)
      .describe("[Purpose, format, default value]"),

    action: tool.schema
      .enum(["create", "get", "update", "delete"])
      .describe("[Action to perform]"),
  },

  async execute(args, context): Promise<ToolResponse> {
    // 1. Validate input at boundary
    // 2. Execute business logic
    // 3. Return ToolResponse
    return success("Operation completed", { result: "..." })
  },
})
```

---

## Appendix B: Category-to-Tool Mapping (Existing Tools)

| Tool | Category | Behavior Model | Lineage |
|------|----------|----------------|---------|
| `delegate-task` | C1: Task Management | Event-driven | hm-* |
| `delegation-status` | C1: Task Management | Condition-based | hm-* |
| `run-background-command` | C1: Task Management | Event-driven | hm-* |
| `prompt-skim` | C3: Inspection | Deterministic | hm-* |
| `prompt-analyze` | C3: Inspection | Deterministic | hm-* |
| `session-patch` | C2: Governance | State-mutating | hm-* |
| `session-journal-export` | C5: Planning | Deterministic | hm-* |
| `configure-primitive` | C2: Governance | State-mutating | hf-* |
| `validate-restart` | C6: Quality | Deterministic | hf-* |
| `hivemind-doc` | C3: Inspection | Deterministic | hm-* |
| `hivemind-trajectory` | C5: Planning | Condition-based | hm-* |
| `hivemind-pressure` | C6: Quality | Condition-based | hm-* |
| `hivemind-sdk-supervisor` | C6: Quality | Condition-based | hm-* |
| `hivemind-command-engine` | C1: Task Management | Event-driven | hm-* |
| `hivemind-agent-work-create` | C1: Task Management | Event-driven | hm-* |
| `hivemind-agent-work-export` | C5: Planning | Deterministic | hm-* |

---

*Document generated: 2026-05-05 by hf-l2-prompter*
*Next review: When new tools are added or existing tools are refactored*
