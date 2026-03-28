# Session Inspection Export

- ses_id: `ses_2cca6a45cffeVxtJvYD3bMRFQ5`
- prepared_at: `2026-03-28T07:32:47.949Z`

## Assistant Output

Now I have all the data needed. Let me compile the comprehensive investigation report.

---

## Codebase Investigation Report

**Scope:** External skill repository analysis — 5 GitHub skills from 2 repositories
**Question:** Fetch, analyze, and synthesize SKILL.md files from awesome-copilot (github) and superpowers (obra) repos for HiveMind adaptation

---

### SKILL 1: breakdown-feature-implementation

| Field | Value |
|-------|-------|
| **Repository** | `github/awesome-copilot` |
| **Path** | `/skills/breakdown-feature-implementation/SKILL.md` |
| **URL** | https://github.com/github/awesome-copilot/tree/main/skills/breakdown-feature-implementation |

**YAML Frontmatter:**
```yaml
name: breakdown-feature-implementation
description: 'Prompt for creating detailed feature implementation plans, following Epoch monorepo structure.'
```

**Main Sections:**
1. Goal — Role priming as "industry-veteran software engineer"
2. Output Format — Markdown to `/docs/ways-of-work/plan/{epic-name}/{feature-name}/implementation-plan.md`
3. File System — Epoch monorepo structure (apps/, services/, packages/)
4. Implementation Plan subsections:
   - Goal (3-5 sentences)
   - Requirements (bulleted list)
   - Technical Considerations:
     - System Architecture Overview (Mermaid diagrams with 5 layers)
     - Database Schema Design (ERD, indexing, migrations)
     - API Design (endpoints, types, auth, error handling)
     - Frontend Architecture (Component Hierarchy, State Flow, shadcn/ui)
     - Security Performance
5. Context Template — Inputs Feature PRD

**Progressive Disclosure Pattern:** Pattern 1 (Monolithic) — entire skill in single SKILL.md, no progressive loading, all content inline.

**Bundled Resources:** SKILL.md only. No reference files, templates, or scripts.

**Unique Knowledge Delta:**
- **Mermaid diagram generation** for system architecture with 5 defined layers (Frontend, API, Business Logic, Data, Infrastructure)
- **Component hierarchy documentation** pattern using ASCII tree with shadcn/ui component annotations
- **State flow diagram** specification
- **Technology stack selection** with rationale documentation per layer
- Structured output path convention: `/docs/ways-of-work/plan/{epic}/{feature}/`

**Anti-patterns Identified:**
- Hardcodes Epoch monorepo structure (apps/, services/, packages/) — not portable
- Hardcodes tech stack (shadcn/ui, tRPC, Zustand, Stack Auth, Docker)
- "Do NOT write code" — output is plan-only, no implementation
- No role boundaries — single agent does everything from architecture to frontend

**Templates/Assets Worth Adapting:**
- 5-layer system architecture diagram template (Mermaid)
- Component hierarchy ASCII tree format
- Database schema design section structure
- API specification section template

---

### SKILL 2: executing-plans

| Field | Value |
|-------|-------|
| **Repository** | `obra/superpowers` |
| **Path** | `/skills/executing-plans/SKILL.md` |
| **URL** | https://github.com/obra/superpowers/tree/main/skills/executing-plans |

**YAML Frontmatter:**
```yaml
name: executing-plans
description: Use when you have a written implementation plan to execute in a separate session with review checkpoints
```

**Main Sections:**
1. Overview — Load plan, review critically, execute, report
2. The Process:
   - Step 1: Load and Review Plan (critical review, raise concerns)
   - Step 2: Execute Tasks (TodoWrite, follow steps, run verifications)
   - Step 3: Complete Development (uses finishing-a-development-branch sub-skill)
3. When to Stop and Ask for Help — 4 hard stop conditions
4. When to Revisit Earlier Steps
5. Integration — Required workflow skills list

**Progressive Disclosure Pattern:** Pattern 2 (Skill-Chain) — explicitly chains to 3 other skills:
- `superpowers:using-git-worktrees` (REQUIRED prerequisite)
- `superpowers:writing-plans` (creates the plan)
- `superpowers:finishing-a-development-branch` (post-execution)

**Bundled Resources:** SKILL.md only. References other skills by name but no bundled templates.

**Unique Knowledge Delta:**
- **Explicit human-in-the-loop checkpoints** — "Raise concerns with your human partner before starting"
- **Critical review before execution** — agent reviews the plan before blindly executing
- **Hard stop conditions** — 4 explicit conditions for when to STOP and ask for help
- **Subagent-driven development upgrade path** — recommends switching to subagent approach when available
- **Git worktree requirement** — enforced isolation before starting work
- **Never start on main/master** without explicit consent
- **Announcement protocol** — agent announces which skill it's using

**Anti-patterns Identified:**
- No scope bounding — assumes plan is already well-decomposed
- No verification gates beyond "run verifications as specified"
- No failure recovery beyond "stop and ask"
- Requires human availability for checkpoints — not autonomous

**Templates/Assets Worth Adapting:**
- "When to Stop" decision matrix (4 hard stop conditions)
- Critical review before execution pattern
- Announcement protocol for skill transparency

---

### SKILL 3: breakdown-plan

| Field | Value |
|-------|-------|
| **Repository** | `github/awesome-copilot` |
| **Path** | `/skills/breakdown-plan/SKILL.md` |
| **URL** | https://github.com/github/awesome-copilot/tree/main/skills/breakdown-plan |

**YAML Frontmatter:**
```yaml
name: breakdown-plan
description: 'Issue Planning and Automation prompt that generates comprehensive project plans with Epic > Feature > Story/Enabler > Test hierarchy, dependencies, priorities, and automated tracking.'
```

**Main Sections:**
1. Goal — Senior PM + DevOps role priming
2. GitHub Project Management Best Practices:
   - Agile Work Item Hierarchy (Epic → Feature → Story/Enabler → Test → Task)
   - INVEST Criteria
   - Definition of Ready / Definition of Done
   - Dependency Management
   - Value-Based Prioritization
3. Input Requirements — 4 core documents referenced
4. Output Format:
   - Project Plan (`project-plan.md`)
   - Issue Creation Checklist (`issues-checklist.md`)
5. 9 major sections:
   - Project Overview
   - Work Item Hierarchy (Mermaid)
   - GitHub Issues Breakdown (Epic, Feature, Story, Enabler templates)
   - Priority and Value Matrix (P0-P3)
   - Estimation Guidelines (Fibonacci + T-Shirt)
   - Dependency Management (Mermaid + 4 types)
   - Sprint Planning Template
   - GitHub Project Board Configuration (Kanban columns)
   - Automation and GitHub Actions (YAML workflows)
6. Success Metrics — KPIs for PM, Process, Delivery

**Progressive Disclosure Pattern:** Pattern 1 (Monolithic) — massive single SKILL.md (~450 lines). All templates inline.

**Bundled Resources:** SKILL.md only. Contains 4 complete issue templates inline (Epic, Feature, User Story, Technical Enabler).

**Unique Knowledge Delta:**
- **Complete Agile hierarchy** — Epic → Feature → Story → Enabler → Task with explicit relationships
- **INVEST criteria** for story quality validation
- **Definition of Ready / Definition of Done** checklists
- **Priority + Value matrix** (P0-P3 × High/Medium/Low)
- **Fibonacci estimation** (1, 2, 3, 5, 8, 13+) with hour/day mappings
- **T-shirt sizing** for epic/feature level
- **4 dependency types**: Blocks, Related, Prerequisite, Parallel
- **GitHub Actions automation** — automated issue creation and status update YAML
- **Kanban board configuration** — 6-column structure with custom fields
- **Critical path identification** in dependency graphs
- **Sprint capacity planning** with velocity, buffer (20%), and focus factor (70-80%)

**Anti-patterns Identified:**
- GitHub-specific (issues, project boards, Actions) — not portable to other PM systems
- Heavy process overhead — may be too heavyweight for small teams
- Assumes 4 input documents exist (PRD, tech breakdown, impl plan, project plan)
- No guidance on what to do when inputs are missing

**Templates/Assets Worth Adapting:**
- Epic/Feature/Story/Enabler issue templates
- Priority × Value matrix
- Fibonacci estimation scale with time mappings
- Sprint capacity planning template
- GitHub Actions for issue automation
- INVEST criteria checklist
- Definition of Ready / Definition of Done

---

### SKILL 4: breakdown-feature-prd

| Field | Value |
|-------|-------|
| **Repository** | `github/awesome-copilot` |
| **Path** | `/skills/breakdown-feature-prd/SKILL.md` |
| **URL** | https://github.com/github/awesome-copilot/tree/main/skills/breakdown-feature-prd |

**YAML Frontmatter:**
```yaml
name: breakdown-feature-prd
description: 'Prompt for creating Product Requirements Documents (PRDs) for new features, based on an Epic.'
```

**Main Sections:**
1. Goal — Expert PM role priming
2. Output Format — Markdown to `/docs/ways-of-work/plan/{epic-name}/{feature-name}/prd.md`
3. PRD Structure (8 sections):
   - Feature Name
   - Epic (link to parent)
   - Goal (Problem → Solution → Impact)
   - User Personas
   - User Stories (As a/I want/So that)
   - Requirements (Functional + Non-Functional)
   - Acceptance Criteria (Given/When/Then)
   - Out of Scope
4. Context Template — Epic link, Feature Idea, Target Users

**Progressive Disclosure Pattern:** Pattern 1 (Monolithic) — single SKILL.md, all content inline.

**Bundled Resources:** SKILL.md only.

**Unique Knowledge Delta:**
- **Problem/Solution/Impact triad** — structured goal decomposition
- **User Persona** definition as a first-class section
- **User Stories** with explicit "As a/I want/So that" format
- **Functional vs Non-Functional** requirement separation
- **Acceptance Criteria** using Given/When/Then format
- **Out of Scope** section — explicit scope boundary enforcement
- **Clarifying questions** — agent instructed to ask when info is insufficient

**Anti-patterns Identified:**
- No connection to technical architecture (deferred to implementation plan)
- No prioritization of requirements
- No success metrics / KPIs in the PRD itself (only "expected outcomes")
- Assumes parent Epic exists and is well-defined

**Templates/Assets Worth Adapting:**
- PRD template with 8-section structure
- Problem/Solution/Impact goal framework
- User Story format (As a/I want/So that)
- Given/When/Then acceptance criteria format
- Out of Scope boundary template

---

### SKILL 5: breakdown-test

| Field | Value |
|-------|-------|
| **Repository** | `github/awesome-copilot` |
| **Path** | `/skills/breakdown-test/SKILL.md` |
| **URL** | https://github.com/github/awesome-copilot/tree/main/skills/breakdown-test |

**YAML Frontmatter:**
```yaml
name: breakdown-test
description: 'Test Planning and Quality Assurance prompt that generates comprehensive test strategies, task breakdowns, and quality validation plans for GitHub projects.'
```

**Main Sections:**
1. Goal — Senior QA Engineer + Test Architect role priming
2. Quality Standards Framework:
   - ISTQB Framework (7 test process activities, design techniques, test types, risk-based testing)
   - ISO 25010 Quality Model (8 quality characteristics)
3. Input Requirements — 4 documents (PRD, tech breakdown, impl plan, project plan)
4. Output Format — 3 deliverables:
   - Test Strategy (`test-strategy.md`)
   - Test Issues Checklist (`test-issues-checklist.md`)
   - Quality Assurance Plan (`qa-plan.md`)
5. Test Strategy Structure:
   - ISTQB Framework Implementation (5 design techniques, 4 test types)
   - ISO 25010 Characteristics Assessment (8 characteristics with priority)
   - Test Environment and Data Strategy
6. Test Issues Checklist:
   - 8 test level issue types
   - Test types identification + prioritization
   - Test dependencies
   - Coverage targets (>80% line, >90% branch)
7. Task Level Breakdown:
   - Estimation guidelines (0.5-5 story points by type)
   - Task dependencies and sequencing
   - Assignment strategy (skill-based, capacity, knowledge transfer)
8. Quality Assurance Plan:
   - Quality gates (entry/exit criteria)
   - Labeling standards
   - Dependency validation
   - Estimation accuracy review
9. GitHub Issue Templates (3):
   - Test Strategy Issue
   - Playwright Test Implementation Issue
   - Quality Assurance Issue
10. Success Metrics — coverage, quality, process KPIs

**Progressive Disclosure Pattern:** Pattern 1 (Monolithic) — largest skill (~500 lines). Everything in one file.

**Bundled Resources:** SKILL.md only. Contains 3 inline issue templates.

**Unique Knowledge Delta:**
- **ISTQB framework** application — formal test design techniques (Equivalence Partitioning, Boundary Value Analysis, Decision Table, State Transition, Experience-Based)
- **ISO 25010** quality model — 8 characteristics with priority assessment
- **Risk-based testing** methodology
- **Test type taxonomy** — Functional, Non-Functional, Structural, Change-Related
- **Coverage targets** — >80% line, >90% branch for critical paths
- **Playwright-specific** test implementation template
- **Test estimation scale** — differentiated by test type (0.5-5 points)
- **Quality gates** with entry/exit criteria
- **Test dependency management** — implementation, environment, tool, cross-team deps
- **Task assignment strategy** — skill-based, capacity planning, knowledge transfer pairing

**Anti-patterns Identified:**
- Assumes Playwright — not portable to other test frameworks
- Heavy ISTQB/ISO 25010 terminology — may overwhelm non-enterprise teams
- Coverage targets (>80% line, >90% branch) are arbitrary without context
- 4 input documents required — pipeline dependency
- No integration with TDD workflow (separate from development)

**Templates/Assets Worth Adapting:**
- ISTQB test design technique selection matrix
- ISO 25010 quality characteristics assessment
- Test type coverage matrix (4 types)
- Quality gates with entry/exit criteria
- Test estimation differentiated by type
- Risk-based testing prioritization
- Playwright test implementation issue template

---

## SYNTHESIS

### Common Structural Patterns Across All 5 Skills

| Pattern | breakdown-feature-impl | executing-plans | breakdown-plan | breakdown-feature-prd | breakdown-test |
|---------|----------------------|-----------------|----------------|----------------------|----------------|
| **YAML Frontmatter** | name, description | name, description | name, description | name, description | name, description |
| **Role Priming** | "industry-veteran SE" | None (process-only) | "Senior PM + DevOps" | "Expert PM" | "Senior QA + Test Architect" |
| **Progressive Disclosure** | Pattern 1 (Mono) | Pattern 2 (Chain) | Pattern 1 (Mono) | Pattern 1 (Mono) | Pattern 1 (Mono) |
| **Bundled Resources** | None | None | None | None | None |
| **Output Path Convention** | `/docs/ways-of-work/plan/...` | None (reads plan) | `/docs/ways-of-work/plan/...` | `/docs/ways-of-work/plan/...` | `/docs/ways-of-work/plan/...` |
| **Context Template** | Yes | No | Yes (4 docs) | Yes (3 inputs) | Yes (4 docs) |
| **Anti-Patterns Section** | No | No | No | No | No |
| **Mermaid Diagrams** | Yes (arch, DB, state) | No | Yes (hierarchy, deps) | No | No |
| **Issue Templates** | No | No | 4 templates inline | No | 3 templates inline |

**Key commonalities:**
1. All use `name` + `description` YAML frontmatter (no `version`, `author`, `tags`, `dependencies`)
2. All are monolithic — single SKILL.md with zero external reference files
3. All assume a pipeline — they reference other skills/documents as inputs
4. All use role priming ("Act as a...") except executing-plans
5. All output to `/docs/ways-of-work/plan/` directory convention
6. None include explicit anti-patterns sections

### Unique Assets Worth Adapting for HiveMind

| Asset | Source Skill | HiveMind Adaptation Value |
|-------|-------------|--------------------------|
| **5-layer architecture diagram template** | breakdown-feature-implementation | HIGH — HiveMind's architecture documentation is informal |
| **Epic→Feature→Story→Enabler hierarchy** | breakdown-plan | HIGH — maps directly to HiveMind's phase/slice decomposition |
| **INVEST criteria** | breakdown-plan | MEDIUM — quality gate for slice decomposition |
| **Fibonacci estimation** | breakdown-plan | MEDIUM — HiveMind has no estimation framework |
| **Priority × Value matrix** | breakdown-plan | HIGH — HiveMind's planning lacks prioritization framework |
| **ISTQB test design techniques** | breakdown-test | HIGH — HiveMind TDD has gates but no test design methodology |
| **ISO 25010 quality model** | breakdown-test | MEDIUM — formal quality framework for non-functional requirements |
| **Quality gates with entry/exit** | breakdown-test | HIGH — maps to HiveMind's phase transition gates |
| **Problem/Solution/Impact triad** | breakdown-feature-prd | HIGH — HiveMind's spec distillation could use this |
| **Given/When/Then acceptance criteria** | breakdown-feature-prd | HIGH — complements HiveMind's evidence-based verification |
| **Out of Scope section** | breakdown-feature-prd | MEDIUM — explicit boundary enforcement |
| **Hard stop conditions** | executing-plans | HIGH — HiveMind has failure recovery but no explicit stop conditions |
| **Critical review before execution** | executing-plans | HIGH — HiveMind's planning could include a review checkpoint |
| **GitHub Actions automation** | breakdown-plan | LOW — GitHub-specific, not portable |
| **Component hierarchy ASCII tree** | breakdown-feature-implementation | MEDIUM — visual documentation pattern |

### Knowledge Gaps These Skills Fill

#### vs. use-hivemind-planning

| Gap | Filled By | Impact |
|-----|-----------|--------|
| No requirement classification taxonomy | breakdown-feature-prd (Functional/Non-Functional separation) + breakdown-plan (INVEST) | HIGH |
| No prioritization framework | breakdown-plan (P0-P3 × High/Med/Low matrix) | HIGH |
| No estimation framework | breakdown-plan (Fibonacci + T-shirt sizing) | MEDIUM |
| No acceptance criteria format | breakdown-feature-prd (Given/When/Then) | HIGH |
| No out-of-scope enforcement | breakdown-feature-prd (Out of Scope section) | MEDIUM |
| No dependency type taxonomy | breakdown-plan (Blocks/Related/Prerequisite/Parallel) | HIGH |
| No sprint/capacity planning | breakdown-plan (velocity, buffer, focus factor) | LOW |

#### vs. use-hivemind-tdd

| Gap | Filled By | Impact |
|-----|-----------|--------|
| No test design methodology | breakdown-test (ISTQB techniques: equivalence partitioning, BVA, decision tables, state transitions) | HIGH |
| No quality characteristic framework | breakdown-test (ISO 25010 — 8 characteristics) | MEDIUM |
| No test type taxonomy | breakdown-test (Functional/Non-Functional/Structural/Change-Related) | HIGH |
| No quality gates beyond RED/GREEN/REFACTOR | breakdown-test (entry/exit criteria per phase) | MEDIUM |
| No risk-based test prioritization | breakdown-test (risk-based testing) | HIGH |
| No test estimation framework | breakdown-test (0.5-5 points by test type) | LOW |

#### vs. use-hivemind-delegation

| Gap | Filled By | Impact |
|-----|-----------|--------|
| No plan review before execution | executing-plans (Step 1: critical review) | HIGH |
| No explicit stop conditions | executing-plans (4 hard stop conditions) | HIGH |
| No human-in-the-loop checkpoints | executing-plans (partner consultation protocol) | MEDIUM |
| No work-item hierarchy for decomposition | breakdown-plan (Epic→Feature→Story→Enabler→Task) | HIGH |
| No component-level decomposition guidance | breakdown-feature-implementation (component hierarchy tree) | MEDIUM |

### Assessment: Most Valuable Breakdown Approach

**Ranking by value to HiveMind framework:**

| Rank | Skill | Why |
|------|-------|-----|
| **1** | **breakdown-plan** | Most directly applicable. Provides the entire decomposition hierarchy (Epic→Feature→Story→Enabler), prioritization framework, estimation, dependency taxonomy, and automation patterns. Maps directly to HiveMind's phase/slice decomposition. The Priority × Value matrix and INVEST criteria would strengthen the planning skill immediately. |
| **2** | **breakdown-test** | Fills the largest knowledge gap in HiveMind's TDD skill. ISTQB test design techniques + ISO 25010 quality model provide formal methodology that HiveMind's RED/GREEN/REFACTOR gates currently lack. Risk-based testing adds a prioritization dimension to test planning. |
| **3** | **executing-plans** | Most architecturally compatible with HiveMind (skill chaining, subagent awareness). The critical review checkpoint, hard stop conditions, and human-in-the-loop protocol directly strengthen HiveMind's execution discipline. Small but high-impact additions. |
| **4** | **breakdown-feature-prd** | The Problem/Solution/Impact triad and Given/When/Then acceptance criteria are immediately useful. However, the PRD format is upstream of HiveMind's typical entry point — most valuable when HiveMind is used for greenfield feature development. |
| **5** | **breakdown-feature-implementation** | The architecture diagram templates and component hierarchy are useful, but heavily tied to the Epoch monorepo and specific tech stack (shadcn/ui, tRPC). Least portable. The Mermaid diagram patterns could be extracted and adapted independently. |

**Bottom line:** `breakdown-plan` is the highest-value single skill to adapt — it provides the structural decomposition, prioritization, and estimation frameworks that HiveMind's planning skill currently lacks. `breakdown-test` is second — ISTQB test design techniques would transform HiveMind's TDD from gate-only to methodologically rigorous. Both are monolithic and would need to be decomposed into HiveMind's skill-chain architecture to be truly integrated.