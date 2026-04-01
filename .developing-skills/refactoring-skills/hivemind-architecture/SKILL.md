---
name: hivemind-architecture
description: Architecture decision guidance — ADR templates, pattern selection, NFR checklists, and clean architecture rules for structural decisions.
---

# hivemind-architecture

Architecture decision guidance for the HiveMind ecosystem. This skill provides structured frameworks for making, documenting, and verifying architectural decisions.

## Table of Contents

1. [When You Need This](#when-you-need-this)
2. [Do Not Use This For](#do-not-use-this-for)
3. [Architecture Decision Records](#architecture-decision-records)
4. [Pattern Selection Decision Tree](#pattern-selection-decision-tree)
5. [NFR Checklist](#nfr-checklist)
6. [Clean Architecture Quick Reference](#clean-architecture-quick-reference)
7. [Dependency Analysis](#dependency-analysis)
8. [Conditional Loading](#conditional-loading)
9. [Anti-Patterns](#anti-patterns)
10. [Sibling Skills](#sibling-skills)
11. [Bundled Resources](#bundled-resources)


**Path Parameters** (adapt to your framework):
- `{runtime_state_dir}` — Root runtime state directory (e.g., `.hivemind/`, `.claude/`, `.cursor/`)
- `{runtime_activity_dir}` — Activity artifacts directory (e.g., `.hivemind/activity/`, `.claude/activity/`)
- `{pathing_config}` — Pathing configuration file (e.g., `.hivemind/pathing/active-paths.json`)

## When You Need This

This skill activates when any of the following signals appear:

1. **Choosing between monolith and microservice** — A structural decomposition decision affects team boundaries, deployment, and data ownership.
2. **Documenting a significant architectural decision** — A decision has been made that impacts more than one module, crosses layer boundaries, or constrains future choices. An ADR is required.
3. **Reviewing system boundaries** — Evaluate whether existing module boundaries, interface contracts, or dependency directions are correct.
4. **Evaluating database or storage technologies** — Requires a persistence decision. Choose based on data model, query patterns, consistency requirements, and scale projections.
5. **Planning for scale** — Increased load requires assessment. Assess horizontal scaling, statelessness, caching, and partitioning strategies.
6. **Verifying clean architecture compliance** — Check new code or a proposed design against dependency rules, layer boundaries, and the entity-use case-adapter-framework hierarchy.
7. **Analyzing dependency health** — The codebase shows signs of coupling issues. Classify dependencies as stable or volatile, then identify inversion opportunities.

## Do Not Use This For

This skill does NOT cover the following concerns. Route them to the correct skill instead:

1. **Code refactoring** — Use `hivemind-refactor` for surgical code changes that preserve behavior.
2. **Test design** — Use `use-hivemind-tdd` or `hivemind-spec-driven` for test strategy and TDD workflows.
3. **Delegation planning** — Use `use-hivemind-delegation` for task decomposition and agent coordination.
4. **Debug workflows** — Use `hivemind-system-debug` for reproduction, narrowing, and containment loops.
5. **Skill authoring** — Use `use-hivemind-skill-authoring` for creating or reviewing skills.

## Architecture Decision Records

Architecture Decision Records (ADRs) capture the context, decision, and consequences of significant structural choices. They are the primary artifact this skill produces.

### When to Write an ADR

Write an ADR when:
- A decision affects two or more modules or layers
- A technology choice constrains future options
- A structural pattern is adopted or rejected
- A database, messaging, or infrastructure technology is selected
- A team boundary or service boundary is established or changed

### ADR Lifecycle

| Status | Meaning |
|--------|---------|
| Proposed | Under discussion, not yet ratified |
| Accepted | Ratified and in effect |
| Deprecated | No longer recommended, still valid historically |
| Superseded | Replaced by a newer ADR (link required) |

### Quick Format

```markdown
# ADR-{number}: {title}
**Status:** {Proposed|Accepted|Deprecated|Superseded}
**Date:** {YYYY-MM-DD}
**Deciders:** {list}
## Context / Decision / Consequences / Alternatives
```

For the full template and an example ADR, see `references/architecture-decision-record.md` and `templates/architecture-decision.md`.

## Pattern Selection Decision Tree

Structural pattern selection depends on team size, domain complexity, deployment cadence, and data consistency needs. The quick decision tree below narrows options before loading the detailed matrix.

### Quick Decision Tree

```
Is the domain bounded and well-understood?
├─ YES → Is the team smaller than 8?
│        ├─ YES → Monolith or Modular Monolith
│        └─ NO  → Modular Monolith (strict module boundaries)
└─ NO  → Can subdomains be independently deployed?
         ├─ YES → Microservices (one per subdomain)
         └─ NO  → Modular Monolith with future extraction plan
```

### Reference Table

| Domain Characteristic | Load Reference |
|-----------------------|---------------|
| Choosing structural pattern | `references/pattern-selection-matrix.md` |
| Evaluating persistence layer | `references/database-selection-matrix.md` |
| Checking architecture rules | `references/clean-architecture-rules.md` |

Load the specific reference for the decision at hand. Do not load all references at once.

## NFR Checklist

Non-functional requirements must be quantified. The table below provides target ranges. For the full checklist with measurement techniques, load `references/nfr-checklist.md`.

### Quick Targets

| NFR Category | Target | Threshold |
|-------------|--------|-----------|
| **Response Time** | p50 < 100ms, p99 < 500ms | Alert at p99 > 1s |
| **Throughput** | > 1,000 req/s per instance | Scale-out trigger |
| **Availability** | 99.9% uptime (8.76h downtime/year) | Circuit breaker at 5xx > 5% |
| **Security** | OWASP Top 10 compliance | Zero high/critical findings |
| **Scalability** | Horizontal scaling, stateless compute | No session affinity |
| **Maintainability** | < 300 LOC per file, < 10 public methods per class | Architecture fitness functions |

### HiveMind-Specific NFRs

| Constraint | Target |
|-----------|--------|
| Tool LOC | < 300 lines per tool file |
| Hook execution | < 50ms per hook invocation |
| Schema validation | Zero `any` types in tool args |
| CQRS boundary | Tools write, hooks read — no exceptions |

## Clean Architecture Quick Reference

Four dependency rules govern all structural decisions in the HiveMind ecosystem:

1. **Entities know nothing.** Domain entities have zero dependencies on frameworks, databases, or external services. They encode business rules and nothing else.
2. **Use cases orchestrate.** Use cases depend on entities and interface abstractions. They never depend on concrete adapters or frameworks.
3. **Adapters convert.** Adapters implement interfaces defined by use cases. They translate between external formats (HTTP, SQL, CLI) and domain formats.
4. **Frameworks are details.** Frameworks, drivers, and UI are outermost. They depend inward. Nothing depends on them.

```
┌─────────────────────────┐
│ Frameworks & Drivers    │  ← outermost, depends inward
│  ┌───────────────────┐  │
│  │ Adapters          │  │
│  │  ┌─────────────┐  │  │
│  │  │ Use Cases   │  │  │
│  │  │  ┌───────┐  │  │  │
│  │  │  │Entity │  │  │  │  ← innermost, knows nothing
│  │  │  └───────┘  │  │  │
│  │  └─────────────┘  │  │
│  └───────────────────┘  │
└─────────────────────────┘
```

For the full 42-rule catalog organized by layer, load `references/clean-architecture-rules.md`.

## Dependency Analysis

Dependencies must be classified before structural decisions can be validated. Incorrect dependency direction is the most common architecture violation.

### Quick Classification

| Category | Direction | Examples |
|----------|-----------|---------|
| **Stable** | Safe to depend on | Standard library, mature SDK, interfaces |
| **Volatile** | Dangerous to depend on | Third-party APIs, frameworks, databases |
| **Domain** | Core value | Entities, use cases, business rules |
| **Infrastructure** | Outer shell | HTTP clients, DB drivers, file system |

### Dependency Inversion Principle

When a use case needs infrastructure (database, API, file system), define an interface in the use case layer. The adapter implements that interface. The use case never imports the adapter directly.

For the full taxonomy and analysis techniques, load `references/dependency-categories.md`.

## Conditional Loading

This skill uses **Pattern 3 (Conditional Details)**. Load only the reference needed for the current decision. Do not load all references at once.

| Condition | Load Reference |
|-----------|---------------|
| Documenting a decision | `references/architecture-decision-record.md` |
| Selecting architecture pattern | `references/pattern-selection-matrix.md` |
| Evaluating databases | `references/database-selection-matrix.md` |
| Checking NFR compliance | `references/nfr-checklist.md` |
| Reviewing architecture rules | `references/clean-architecture-rules.md` |
| Analyzing dependencies | `references/dependency-categories.md` |
| Writing an ADR | `templates/architecture-decision.md` |
| Drafting a system blueprint | `templates/blueprint-template.md` |

**Loading rule:** Load exactly one reference per decision. If multiple decisions are in flight, handle them sequentially, loading and unloading references between decisions.

## Anti-Patterns

The following architectural anti-patterns must be avoided. When detected during a review, flag them and propose the correct pattern.

### 1. Architecture Astronaut

**Description:** Over-engineering a solution with unnecessary layers of abstraction. The design targets hypothetical scale or flexibility that the system will never need.

**Detection:** More than 3 abstraction layers between the caller and the implementation. Interfaces with only one implementation and no foreseeable second.

**Correction:** Apply YAGNI. Remove abstraction layers until the simplest correct architecture remains. Add abstraction when the second use case arrives.

### 2. Resume-Driven Development

**Description:** Choosing technologies, patterns, or architectures based on what is interesting to learn or impressive on a resume, rather than what the problem requires.

**Detection:** Technology choices that cannot be justified by domain requirements. Using a distributed system where a single-process solution would suffice.

**Correction:** Map every technology choice to a specific requirement. If no requirement drives the choice, remove it.

### 3. Not Invented Here (NIH)

**Description:** Rejecting proven, well-maintained solutions in favor of building custom implementations. Common in teams that overestimate the cost of learning a library relative to the cost of maintaining a custom one.

**Detection:** Custom implementations of well-known patterns (event bus, ORM, state machine) when mature libraries exist.

**Correction:** Use the SDK-first principle. Before building custom, verify the SDK or a mature library does not already provide it.

### 4. Big Ball of Mud

**Description:** No discernible architecture. Modules depend on each other in tangled ways. Changes ripple unpredictably. No clear layer boundaries exist.

**Detection:** Circular dependencies. Files that import from every layer. Business logic mixed with I/O. Tests that require full system setup.

**Correction:** Introduce seams incrementally. Extract interfaces at layer boundaries. Move toward clean architecture one module at a time. Do not attempt a full rewrite.

### 5. Distributed Monolith

**Description:** Deploying as microservices but maintaining monolith-level coupling. Services share databases, require synchronized deploys, or call each other in chains that create tight temporal coupling.

**Detection:** Services that cannot be deployed independently. Shared database tables across service boundaries. Deploy coordination required.

**Correction:** Establish clear service boundaries with owned data. Use events for cross-service communication. Apply the bounded context pattern from domain-driven design.

### 6. Golden Hammer

**Description:** Applying a familiar pattern or technology to every problem regardless of fit. "We use React for everything" or "Everything is a microservice."

**Detection:** One pattern used exclusively across all modules, regardless of varying complexity or requirements.

**Correction:** Use the pattern selection matrix. Match each module's characteristics to the appropriate pattern.

## OpenCode Tool Matrix

| Decision Task | Preferred Tool | Why | Fallback |
| --- | --- | --- | --- |
| inspect a concrete module boundary | `read` | exact source truth | `glob` then `read` |
| find existing architecture mentions | `grep` | cross-file evidence | `git log -- <path>` |
| trace an interface owner | `lsp.goToDefinition` | semantic navigation | `grep` |
| validate library or framework claims | `context7_query-docs` | current docs | `webfetch` |
| inspect public repo examples | `deepwiki_ask_question` | repo-grounded summary | `gitmcp_search_github_com_code` |

## Concrete Bash Examples

```bash
# Review recent changes in key directories (e.g., git log --oneline -- docs/ src/)
# Run type checking (e.g., npx tsc --noEmit for TypeScript, mypy for Python)
# Run the test suite (e.g., npm test, pytest, cargo test)
```

## ADR Workflow

1. Read the affected source paths first.
2. Load `references/pattern-selection-decision-tree.md` to select the smallest fitting architecture pattern.
3. Use `references/adr-tool-reference.md` to capture code, command, and external evidence.
4. Draft the decision in `templates/adr-template-advanced.md`.
5. Verify the decision against type, test, and build evidence before marking it accepted.

## Reference-Backed Pattern Routing

- Use **Clean Architecture** when the core problem is dependency direction and layer discipline.
- Use **Hexagonal Architecture** when the main risk is adapter sprawl around a stable domain core.
- Use **DDD** when aggregates, invariants, and bounded contexts dominate the change surface.

## Sibling Skills

| Skill | Relationship |
|-------|-------------|
| `use-hivemind` | Entry router — triggers this skill based on architecture detection |
| `hivemind-patterns` | Pattern catalog — architecture patterns complement design patterns |
| `hivemind-refactor` | Refactoring — guided by architectural principles and layer rules |
| `use-hivemind-planning` | Planning — architecture informs planning decomposition and task slicing |
| `hivemind-spec-driven` | Specification — architecture decisions produce specs with acceptance criteria |
| `hivemind-gatekeeping` | Gatekeeping — architecture fitness functions feed into loop control |
| `use-hivemind-tdd` | TDD — architecture rules are validated through tests |

## Bundled Resources

| Resource | Path | Purpose |
|----------|------|---------|
| Architecture Decision Record | `references/architecture-decision-record.md` | ADR structure, lifecycle, and example |
| Clean Architecture Rules | `references/clean-architecture-rules.md` | 42-rule catalog organized by layer |
| NFR Checklist | `references/nfr-checklist.md` | Quantified non-functional requirement targets |
| Pattern Selection Matrix | `references/pattern-selection-matrix.md` | Monolith vs modular vs microservice selection |
| Database Selection Matrix | `references/database-selection-matrix.md` | SQL vs NoSQL vs graph by use case |
| Dependency Categories | `references/dependency-categories.md` | Stable vs volatile dependency taxonomy |
| Architecture Decision Template | `templates/architecture-decision.md` | ADR markdown template with all fields |
| Blueprint Template | `templates/blueprint-template.md` | System blueprint with layers, data flow, scaling |

## Activity Output

All artifacts produced by this skill follow the Activity Folder Protocol.

**Pathing:** See `{pathing_config}` for resolved output paths.
**Naming:** `{category}-{semantic-id}-{YYYY-MM-DD}.{ext}`
**Meta:** All JSON includes `_meta.created_at`, `_meta.updated_at`, `_meta.producer`.
**Validation:** Run `bash use-hivemind-delegation/scripts/hm-artifact-validate.sh {path}` to confirm compliance.
