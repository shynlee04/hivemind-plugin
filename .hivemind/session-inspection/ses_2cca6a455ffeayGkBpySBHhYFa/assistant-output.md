# Session Inspection Export

- ses_id: `ses_2cca6a455ffeayGkBpySBHhYFa`
- prepared_at: `2026-03-28T07:33:40.456Z`

## Assistant Output

I have all the data. Here is the complete investigation report.

---

## Codebase Investigation Report

**Scope:** Analysis of 5 external architecture-related skill repositories
**Question:** Structure, patterns, knowledge, and adaptability assessment for HiveMind skill development

---

## Skill 1: architecture-blueprint-generator

**Source:** `github/awesome-copilot` — [SKILL.md](https://github.com/github/awesome-copilot/blob/main/skills/architecture-blueprint-generator/SKILL.md)

### YAML Frontmatter
- **No frontmatter block** — this is a Copilot-style prompt generator, not a Claude/agent-style skill
- Title used: `architecture-blueprint-generator`
- Description inline in first paragraph: "Comprehensive project architecture blueprint generator that analyzes codebases to create detailed architectural documentation"

### Main Sections
| # | Section | Content |
|---|---------|---------|
| 1 | Configuration Variables | 8 user-configurable variables with type enums |
| 2 | Architecture Detection | Auto-detect or focus on specific stack |
| 3 | Architectural Overview | Principles, boundaries, hybrid patterns |
| 4 | Architecture Visualization | C4/UML/Flow/Component/None diagrams |
| 5 | Core Components | Purpose, structure, interaction, evolution |
| 6 | Layers and Dependencies | Layer mapping, dependency rules, DI patterns |
| 7 | Data Architecture | Domain models, entities, repositories, caching |
| 8 | Cross-Cutting Concerns | Auth, error handling, logging, validation, config |
| 9 | Service Communication | Boundaries, protocols, sync/async, resilience |
| 10 | Technology-Specific Patterns | .NET, Java, React, Angular, Python |
| 11 | Implementation Patterns | Interface, service, repository, controller, domain |
| 12 | Testing Architecture | Strategies, boundaries, test doubles |
| 13 | Deployment Architecture | Topology, environments, containers, cloud |
| 14 | Extension/Evolution Patterns | Feature addition, modification, integration |
| 15 | Code Examples | Optional extracted examples |
| 16 | Decision Records | Optional ADRs |
| 17 | Architecture Governance | Consistency checks, review processes |
| 18 | Blueprint for New Dev | Workflow, templates, pitfalls |

### Progressive Disclosure Pattern
**Pattern 3 — Configuration-Driven Template Expansion.** 8 `${VARIABLE="default|options"}` template variables control which sections expand. The entire skill is a single generated prompt — the "skill" IS the prompt template.

### Bundled Resources
- **None.** Single SKILL.md only. All knowledge is embedded inline.

### Unique Knowledge Delta (vs HiveMind)
- **Technology stack auto-detection** — analyzing project structure files, package deps, import statements, framework patterns
- **Cross-cutting concern documentation** — auth, error handling, logging, validation, configuration management patterns documented per-architecture
- **Deployment architecture documentation** — topology, containerization, cloud integration patterns
- **Blueprint for new development** — workflow templates, component creation sequence, common pitfalls by architecture type

### Anti-Patterns Identified
- **Prompt sprawl** — the SKILL.md is ~300 lines of generated prompt text with no structural breaks; it's a dump, not a skill
- **Configuration without validation** — no guardrails on conflicting options (e.g., selecting "Flutter" with "Microservices" pattern)
- **No code examples** — conditional on `INCLUDES_CODE_EXAMPLES` but the actual skill has zero embedded examples

### Templates/Assets Worth Adapting
- Configuration variable pattern for user-customizable skill behavior
- Cross-cutting concern documentation structure (auth/error/logging/validation/config)

---

## Skill 2: architecture-designer

**Source:** `Jeffallan/claude-skills` — [SKILL.md](https://github.com/Jeffallan/claude-skills/blob/main/skills/architecture-designer/SKILL.md)

### YAML Frontmatter
```yaml
name: architecture-designer
description: Use when designing new high-level system architecture...
license: MIT
metadata:
  author: https://github.com/Jeffallan
  version: "1.1.1"
  domain: api-architecture
  triggers: architecture, system design, design pattern, microservices, scalability, ADR, technical design, infrastructure
  role: expert
  scope: design
  output-format: document
  related-skills: fullstack-guardian, devops-engineer, secure-code-guardian, microservices-architect, code-reviewer
```

### Main Sections
| # | Section |
|---|---------|
| 1 | Role Definition |
| 2 | When to Use This Skill |
| 3 | Core Workflow (5 steps) |
| 4 | Reference Guide (5 reference files) |
| 5 | Constraints (MUST DO / MUST NOT DO) |
| 6 | Output Templates |
| 7 | Architecture Diagram (Mermaid example) |
| 8 | ADR Example |

### Progressive Disclosure Pattern
**Pattern 2 — Contextual Reference Loading.** SKILL.md is the compact entry point. 5 reference files are loaded conditionally based on context:

| Reference File | Load When |
|---------------|-----------|
| `references/architecture-patterns.md` | Choosing monolith vs microservices |
| `references/adr-template.md` | Documenting decisions |
| `references/system-design.md` | Full system design template |
| `references/database-selection.md` | Choosing database technology |
| `references/nfr-checklist.md` | Gathering non-functional requirements |

### Bundled Resources
| File | Content |
|------|---------|
| `references/architecture-patterns.md` | Pattern comparison table, monolith/microservices/event-driven/CQRS diagrams with ASCII art, decision matrix |
| `references/adr-template.md` | ADR format template, full example (PostgreSQL selection), naming convention, quick reference table |
| `references/system-design.md` | Full system design template with requirements, architecture diagram, component details, scaling strategy, failure modes |
| `references/database-selection.md` | Database type comparison (relational/document/KV/time-series/graph/search), decision matrix |
| `references/nfr-checklist.md` | NFR categories (scalability/performance/availability/security/reliability/maintainability/cost) with quantified targets |

### Unique Knowledge Delta (vs HiveMind)
- **ADR (Architecture Decision Record) template with examples** — HiveMind has no ADR template
- **Database selection decision matrix** — type-matching to requirements, specific product comparisons
- **NFR checklist with quantified targets** — p95 response times, SLA tiers, RPO/RTO targets, security compliance mapping
- **Mermaid diagram examples** — concrete diagram syntax for architecture visualization
- **Pattern comparison table** — monolith vs modular monolith vs microservices vs serverless vs event-driven with team size thresholds and trade-off analysis
- **Failure mode analysis table** — failure type, impact, mitigation pattern
- **Technology-specific architectural patterns** (referenced but in other skills)

### Anti-Patterns Identified
- **No Mermaid validation** — diagrams shown as examples but no tooling to verify correctness
- **Role claim without evidence** — "principal architect with 15+ years" is theatrical — no actual role differentiation in behavior
- **Constraints are prose-only** — MUST DO / MUST NOT DO stated as bullets, not enforced programmatically

### Templates/Assets Worth Adapting
- `references/adr-template.md` — Directly usable ADR format with example
- `references/nfr-checklist.md` — Quantified NFR targets table
- `references/architecture-patterns.md` — Pattern comparison matrix
- `references/system-design.md` — Full system design template
- `references/database-selection.md` — Database decision matrix

---

## Skill 3: clean-architecture

**Source:** `pproenca/dot-skills` — [SKILL.md](https://github.com/pproenca/dot-skills/blob/master/skills/.experimental/clean-architecture/SKILL.md)

### YAML Frontmatter
```yaml
name: clean-architecture
description: Clean Architecture principles and best practices from Robert C. Martin's book.
```

### Main Sections
| # | Section |
|---|---------|
| 1 | When to Apply |
| 2 | Rule Categories by Priority (8 categories, 42 rules) |
| 3 | Quick Reference — 8 category subsections |
| 4 | How to Use |
| 5 | Reference Files index |

### Rule Categories (42 rules, 8 categories)
| Priority | Category | Count | Prefix |
|----------|----------|-------|--------|
| 1 CRITICAL | Dependency Direction | 6 | `dep-` |
| 2 CRITICAL | Entity Design | 6 | `entity-` |
| 3 HIGH | Use Case Isolation | 6 | `usecase-` |
| 4 HIGH | Component Cohesion | 5 | `comp-` |
| 5 MEDIUM-HIGH | Boundary Definition | 6 | `bound-` |
| 6 MEDIUM | Interface Adapters | 5 | `adapt-` |
| 7 MEDIUM | Framework Isolation | 5 | `frame-` |
| 8 LOW-MEDIUM | Testing Architecture | 4 | `test-` |

### Progressive Disclosure Pattern
**Pattern 1 — Master Index with On-Demand Loading.** SKILL.md is the compact index with 42 rule links. Each rule lives in its own `references/{prefix}-{name}.md` file with detailed explanation and code examples.

### Bundled Resources
| Resource | Count | Content |
|----------|-------|---------|
| `references/` | 42 files | Individual rule files (e.g., `dep-inward-only.md`, `entity-pure-business-rules.md`) |
| `references/_sections.md` | 1 file | Category definitions, ordering, impact levels |
| `assets/templates/_template.md` | 1 file | Template for adding new rules (YAML frontmatter + Incorrect/Correct/Alternative code pattern) |
| `metadata.json` | 1 file | Version, organization, abstract, external references |

### Rule File Structure (from template)
Each rule file follows:
```yaml
---
title: Rule Title in Imperative Form
impact: CRITICAL|HIGH|MEDIUM-HIGH|MEDIUM|LOW-MEDIUM|LOW
impactDescription: quantified impact
tags: prefix, technique1, technique2, concept
---
```
Plus: Brief explanation, **Incorrect** code example, **Correct** code example, **Alternative** (when applicable), **When NOT to use**, **Benefits**, **Reference** link.

### Unique Knowledge Delta (vs HiveMind)
- **42 granular architecture rules** with prioritized impact levels — HiveMind has no equivalent rule catalog
- **Incorrect vs Correct code examples** for each rule — provides concrete "what not to do" patterns
- **Impact-level taxonomy** (CRITICAL → LOW-MEDIUM) — enables prioritized enforcement
- **Tagged rule system** — prefix-based categorization enables lookup by concern
- **Extensible template** — `assets/templates/_template.md` provides a pattern for adding new rules
- **Rich domain model rules** — entity design, value objects, rich vs anemic domain models
- **Framework isolation rules** — concrete rules for keeping frameworks out of domain layers
- **Testing architecture rules** — tests as architectural components, layer isolation testing

### Anti-Patterns Identified
- **Status: experimental** — located under `.experimental/` in the repo, not production-grade
- **No enforcement mechanism** — rules are reference material, not automated checks
- **No integration with tooling** — rules don't connect to linting, CI gates, or pre-commit hooks
- **Language-agnostic examples** — TypeScript examples exist but no language-specific variants

### Templates/Assets Worth Adapting
- `assets/templates/_template.md` — Rule definition template with YAML frontmatter + code examples
- `references/_sections.md` — Category taxonomy for organizing rules
- `metadata.json` — Skill versioning and external reference tracking
- The entire 42-rule catalog structure as a reference model

---

## Skill 4: improve-codebase-architecture

**Source:** `mattpocock/skills` — [SKILL.md](https://github.com/mattpocock/skills/blob/main/improve-codebase-architecture/SKILL.md)

### YAML Frontmatter
```yaml
name: improve-codebase-architecture
description: Explore a codebase to find opportunities for architectural improvement...
```

### Main Sections
| # | Section |
|---|---------|
| 1 | Core Concept: Deep Modules (Ousterhout reference) |
| 2 | Process — 7-step interactive workflow |
| 3 | Step 1: Explore codebase (organic friction detection) |
| 4 | Step 2: Present candidates |
| 5 | Step 3: User picks candidate |
| 6 | Step 4: Frame problem space |
| 7 | Step 5: Design multiple interfaces (3-4 parallel sub-agents) |
| 8 | Step 6: User picks interface |
| 9 | Step 7: Create GitHub issue RFC |

### Progressive Disclosure Pattern
**Pattern 2 — Procedural with Reference.** SKILL.md is the procedural workflow. `REFERENCE.md` provides supplemental material (dependency categories, testing strategy, issue template).

### Bundled Resources
| File | Content |
|------|---------|
| `REFERENCE.md` | 4 dependency categories, testing strategy, issue template |

### REFERENCE.md Key Content
**Dependency Categories:**
1. **In-process** — pure computation, no I/O; always deepenable
2. **Local-substitutable** — dependencies with local test stand-ins (PGLite for Postgres, in-memory FS)
3. **Remote but owned (Ports & Adapters)** — own services across network; define port interface
4. **True external (Mock)** — third-party services; mock at boundary

**Testing Strategy:** "Replace, don't layer" — delete old shallow-module tests, write boundary tests on deepened module interface.

**Issue Template:** Structured RFC with Problem, Proposed Interface, Dependency Strategy, Testing Strategy, Implementation Recommendations.

### Unique Knowledge Delta (vs HiveMind)
- **"Deep module" concept** (John Ousterhout, "A Philosophy of Software Design") — small interface hiding large implementation; more testable and AI-navigable
- **Organic friction detection** — the skill explores the codebase like an AI would, noting where it experiences friction as signal for architectural improvement
- **Multi-agent parallel design** — spawning 3-4 sub-agents with radically different design constraints (minimize interface, maximize flexibility, optimize for common caller, ports & adapters)
- **Dependency categorization** — in-process / local-substitutable / remote-owned / true-external taxonomy
- **"Replace, don't layer" testing philosophy** — old tests become waste after boundary tests exist
- **GitHub issue RFC workflow** — structured output as actionable RFC rather than just documentation
- **User-interactive multi-step process** — skill asks user to pick candidates and interfaces before proceeding

### Anti-Patterns Identified
- **Assumes Agent tool with `subagent_type=Explore`** — Claude-specific, not portable
- **No metrics for improvement** — purely qualitative "friction" detection without measurement
- **Creates issues without approval** — step 7 says "Do NOT ask the user to review before creating — just create it and share the URL" — aggressive automation
- **No validation loop** — if the design doesn't work in practice, no rollback path

### Templates/Assets Worth Adapting
- `REFERENCE.md` dependency categories taxonomy
- Issue template for architecture RFCs
- Multi-agent parallel design pattern (spawn N sub-agents with different constraints)
- "Replace, don't layer" testing philosophy

---

## Skill 5: autoresearch

**Source:** `github/awesome-copilot` — [SKILL.md](https://github.com/github/awesome-copilot/blob/main/skills/autoresearch/SKILL.md)

### YAML Frontmatter
```yaml
name: autoresearch
description: Autonomous iterative experimentation loop for any programming task...
license: MIT
compatibility: Requires git. The project must be a git repository. Requires terminal access to run commands.
metadata:
  author: luiscantero
  inspired-by: https://github.com/karpathy/autoresearch
```

### Main Sections
| # | Section |
|---|---------|
| 1 | Agent Behavior Rules (10 rules: DO and DO NOT) |
| 2 | Phase 1: Setup (Interactive) — 7 sub-phases |
| 3 | Phase 2: Branch & Baseline |
| 4 | Phase 3: Experiment Loop (8-step cycle) |
| 5 | Phase 4: Reporting |
| 6 | Quick Reference (Results TSV, Git Workflow, Key Principles) |

### Progressive Disclosure Pattern
**Pattern 3 — Self-Contained Process.** Single SKILL.md, no reference files. All knowledge embedded in a structured multi-phase workflow. The skill IS the process.

### Bundled Resources
- **None.** Single SKILL.md. Includes inline:
  - Results TSV format specification
  - Git workflow specification
  - Experiment strategy priority order
  - Constraint handling rules

### Unique Knowledge Delta (vs HiveMind)
- **Autonomous experimentation loop** — run experiments without pausing for user confirmation
- **Git-backed experiment safety** — commit before each experiment, revert failures with `git reset --hard`
- **Measurable metric framework** — METRIC_COMMAND, METRIC_EXTRACTION, METRIC_DIRECTION as structured fields
- **Results TSV logging** — experiment number, commit hash, metric value, status (keep/discard/crash), description
- **Simplicity policy** — "All else being equal, simpler is better" — weighs complexity cost against improvement magnitude
- **Experiment strategy hierarchy** — low-hanging fruit → informed by results → diversify → combine winners → simplification → radical
- **Autonomous operation** — "never pause to ask 'should I continue?'" — maximum agent autonomy within constraints
- **Scope/safety boundaries** — IN_SCOPE_FILES / OUT_OF_SCOPE_FILES, time budgets, dependency constraints

### Anti-Patterns Identified
- **Risk of unrecoverable state** — `git reset --hard HEAD~1` is destructive; no safety net if extraction fails
- **No peer review** — fully autonomous; could compound errors across many experiments
- **Metric extraction fragility** — regex-based metric extraction could silently extract wrong values
- **Results TSV not committed** — added to `.git/info/exclude`; experiment history could be lost

### Templates/Assets Worth Adapting
- 4-phase structure: Setup → Baseline → Loop → Reporting
- Results TSV format for tracking iterative improvements
- Git-backed experiment safety pattern (commit before run, revert failures)
- Experiment strategy hierarchy (6 levels)
- Simplicity policy framework

---

## SYNTHESIS

### Common Structural Patterns Across All 5 Skills

| Pattern | Skills Using It | Description |
|---------|----------------|-------------|
| YAML frontmatter | 4/5 (all except architecture-blueprint-generator) | name, description, metadata, triggers, version |
| Master index + references | 3/5 (architecture-designer, clean-architecture, improve-codebase-architecture) | SKILL.md as entry point, conditional loading of reference files |
| Code examples (correct vs incorrect) | 3/5 (clean-architecture, architecture-designer, architecture-blueprint-generator) | Show anti-pattern then correct pattern |
| Multi-phase workflow | 3/5 (autoresearch, improve-codebase-architecture, architecture-blueprint-generator) | Step-by-step process with user interaction gates |
| Constraints/rules lists | 3/5 (architecture-designer, autoresearch, clean-architecture) | MUST DO / MUST NOT DO / prohibited actions |
| Quick reference tables | 4/5 (all except improve-codebase-architecture) | Summary tables for fast lookup |
| ASCII/mermaid diagrams | 3/5 (architecture-designer, architecture-blueprint-generator, autoresearch) | Visual representation of patterns |
| Impact/priority taxonomy | 2/5 (clean-architecture, architecture-designer NFR) | Priority levels for rules/requirements |

### Unique Assets Worth Adapting for HiveMind

| Asset | Source Skill | Why It's Valuable |
|-------|-------------|-------------------|
| **ADR Template with example** | architecture-designer | HiveMind has no decision record format; ADR is industry standard |
| **42-rule clean architecture catalog** | clean-architecture | Provides granular, prioritized rules with code examples; extensible via template |
| **NFR checklist with quantified targets** | architecture-designer | Converts vague "it should be fast" to specific p95 targets |
| **Dependency categories taxonomy** | improve-codebase-architecture | In-process / local-substitutable / remote-owned / true-external — clarifies test strategy |
| **Database selection decision matrix** | architecture-designer | Requirements → database type mapping |
| **Results TSV format** | autoresearch | Lightweight experiment tracking without infrastructure |
| **Git-backed experiment safety** | autoresearch | Commit-before-run + revert pattern for safe iteration |
| **Rule definition template** | clean-architecture | YAML frontmatter + Incorrect/Correct/Alternative pattern for any rule type |
| **Multi-agent parallel design** | improve-codebase-architecture | Spawn 3+ sub-agents with different design constraints |
| **"Replace, don't layer" testing** | improve-codebase-architecture | Delete waste tests, write boundary tests |

### Knowledge Gaps These Skills Fill That `hivemind-skills-patterns` Currently Misses

1. **Architecture decision documentation** — `hivemind-skills-patterns` has no ADR template or decision record format
2. **Non-functional requirements framework** — no quantified NFR targets or checklist
3. **Architecture pattern selection** — no monolith vs microservices vs event-driven decision matrix
4. **Clean architecture rule enforcement** — HiveMind has CQRS rules in AGENTS.md but no granular rule catalog
5. **Database technology selection** — no decision matrix for storage choices
6. **System design template** — no structured template for full system design documents
7. **Autonomous experimentation** — `use-hivemind-research` covers research methodology but lacks the experiment-loop pattern
8. **Architecture improvement workflow** — no process for finding and proposing architectural improvements (the "deep module" concept)
9. **Testing architecture patterns** — HiveMind has TDD enforcement but no testing architecture rules (layer isolation, boundary verification)
10. **Dependency categorization for test strategy** — no taxonomy mapping dependency types to test approaches

### Assessment: What Should a New `hivemind-architecture` Skill Contain?

Based on these 5 external references, a `hivemind-architecture` skill should contain:

**Core Structure (Pattern 1 — Master Index):**
- Compact SKILL.md as entry point with role definition, when-to-use, constraints
- Conditional reference loading table mapping context to reference files

**Required Reference Files:**
1. `references/adr-template.md` — Architecture Decision Record template adapted from architecture-designer
2. `references/architecture-patterns.md` — Pattern selection matrix (monolith → microservices → event-driven) adapted from architecture-designer
3. `references/nfr-checklist.md` — Non-functional requirements with quantified targets adapted from architecture-designer
4. `references/database-selection.md` — Storage technology decision matrix adapted from architecture-designer
5. `references/clean-architecture-rules.md` — Curated subset of clean-architecture rules (prioritized, with HiveMind-specific CQRS rules added)
6. `references/system-design-template.md` — Full system design template adapted from architecture-designer

**Process Sections:**
- Architecture review workflow (adapted from improve-codebase-architecture's 7-step process)
- ADR authoring workflow
- Dependency analysis workflow using the 4-category taxonomy from improve-codebase-architecture

**Metadata:**
- Version tracking via metadata.json (from clean-architecture)
- Trigger keywords for auto-loading
- Related-skill links to existing HiveMind delegation skills

### Assessment: What Improvements Could Autoresearch Bring to `use-hivemind-research`?

**Current state of `use-hivemind-research`:**
- Covers research methodology (question formation → source identification → investigation → synthesis → verification)
- Covers MCP tool protocols (Context7, Deepwiki, Repomix, Tavily)
- Has fallback hierarchy and retry logic
- Knowledge-base structure with YAML frontmatter
- Sequential execution model

**Autoresearch adds these specific capabilities that `use-hivemind-research` lacks:**

| Autoresearch Feature | Gap in `use-hivemind-research` | Impact |
|---------------------|-------------------------------|--------|
| **Measurable metric framework** (METRIC_COMMAND, METRIC_EXTRACTION, METRIC_DIRECTION) | Research has no formal measurement — only "hard-proof evidence" | High — converts qualitative research to quantitative |
| **Git-backed experiment safety** (commit-before-run, revert failures) | Research has no rollback mechanism if investigation goes wrong | Medium — enables safe exploration |
| **Results TSV logging** | Research outputs are unstructured prose | Medium — enables tracking across iterations |
| **Autonomous operation loop** | Research requires verification gates that pause execution | Low — depends on use case; some gates are valuable |
| **Experiment strategy hierarchy** (6 levels from low-hanging to radical) | Research has no prioritized investigation strategy | High — structured exploration beats random probing |
| **Simplicity policy** | Research has no complexity budget | Medium — prevents over-investigation |

**Recommended integration pattern:**
Add an "experiment mode" to `use-hivemind-research` that:
1. Inherits autoresearch's Setup phase (define goal, metric, scope, constraints)
2. Uses autoresearch's git-backed safety (commit before experiment, revert failures)
3. Uses autoresearch's results TSV format for research output tracking
4. Adapts autoresearch's 6-level experiment strategy as investigation priority
5. Keeps `use-hivemind-research`'s existing verification gates (don't remove — autoresearch's "never pause" is too aggressive for HiveMind's delegation model)
6. Adds the simplicity policy as a complexity budget constraint

**Do NOT import:**
- Autonomous "never pause" behavior — conflicts with HiveMind's delegation gates
- Destructive `git reset --hard` without safety — HiveMind's atomic commit discipline is safer
- The single-metric-only model — research often needs multi-dimensional evidence

---

**Investigation conducted at:** `HEAD` of product-detox worktree, 2026-03-28
**Evidence sources:** All content fetched directly from GitHub raw URLs at commit HEAD of each repository