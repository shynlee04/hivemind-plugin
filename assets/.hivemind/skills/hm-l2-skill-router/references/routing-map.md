# Routing Map — hm-l2-skill-router

## Overview

This reference documents the complete routing map used by `hm-l2-skill-router` to map task domains to skill loading bundles. Includes priority ordering, dependency chains, multi-domain resolution rules, and exclusion rules.

## Domain Definitions

### Research

| Signal | Example |
|--------|---------|
| "investigate" | "Investigate why the auth module fails under load" |
| "research" | "Research the latest patterns for WebSocket reconnection" |
| "find out" | "Find out which version of Zod supports v4 schemas" |
| "analyze codebase" | "Analyze the codebase for circular dependencies" |
| "look into" | "Look into the performance regression in the API layer" |
| "explore" | "Explore the plugin SDK surface for tool registration" |
| "gather information" | "Gather information about the session lifecycle" |

**Bundle:** hm-l3-tech-stack-ingest → hm-l3-detective → hm-l3-deep-research

**Dependency chain:** tech-stack-ingest (cache deps) → detective (scan codebase) → deep-research (multi-source evidence)

### Planning

| Signal | Example |
|--------|---------|
| "plan" | "Plan the implementation for phase 5" |
| "spec" | "Write the spec for the authentication feature" |
| "write requirements" | "Write requirements for the notification system" |
| "design the interface" | "Design the interface between the auth and user modules" |
| "architect" | "Architect the session persistence layer" |
| "spec-driven" | "Do a spec-driven approach for the new feature" |

**Bundle:** hm-l2-planning-persistence → hm-l2-spec-driven-authoring

**Dependency chain:** planning-persistence (setup files) → spec-driven-authoring (produce locked spec)

### Implementation

| Signal | Example |
|--------|---------|
| "implement" | "Implement the delegation persistence module" |
| "build" | "Build the completion detection pipeline" |
| "execute" | "Execute phase 3 plans" |
| "run the phase" | "Run the phase for the auth module" |
| "code" | "Code the session recovery feature" |
| "write" | "Write the delegation dispatch tool" |

**Bundle:** hm-l2-phase-execution → hm-l2-cross-cutting-change (when touching multiple layers)

**Dependency chain:** phase-execution (wave dispatch) → cross-cutting-change (safety for multi-layer changes)

### Quality

| Signal | Example |
|--------|---------|
| "test" | "Test the delegation manager with TDD" |
| "verify" | "Verify the implementation matches the spec" |
| "validate quality" | "Validate the quality of the phase output" |
| "TDD" | "Use TDD for the new feature" |
| "red-green-refactor" | "Follow red-green-refactor for the auth module" |
| "check coverage" | "Check test coverage for the concurrency module" |

**Bundle:** hm-l2-test-driven-execution → hm-l2-gate-orchestrator

**Dependency chain:** test-driven-execution (RED/GREEN/REFACTOR) → gate-orchestrator (validate against triad)

### Debug

| Signal | Example |
|--------|---------|
| "debug" | "Debug the failing session recovery test" |
| "fix" | "Fix the race condition in the concurrency module" |
| "broken" | "The build is broken after the last commit" |
| "failing" | "Tests are failing in CI but pass locally" |
| "error" | "Getting a type error in the plugin initialization" |
| "investigate issue" | "Investigate the memory leak in the event handler" |
| "root cause" | "Find the root cause of the intermittent timeout" |

**Bundle:** hm-l2-debug → hm-l2-completion-looping

**Dependency chain:** hm-l2-debug (investigate + fix) → hm-l2-completion-looping (verify fix actually works)

### Review

| Signal | Example |
|--------|---------|
| "review" | "Review the phase output for production readiness" |
| "audit" | "Audit the skill ecosystem for quality" |
| "readiness" | "Check production readiness before shipping" |
| "deploy check" | "Run the deployment check" |
| "ship ready" | "Is this ready to ship?" |
| "pre-release" | "Pre-release verification pass" |
| "evidence check" | "Check the evidence gate before shipping" |

**Bundle:** hm-l2-production-readiness → gate-evidence-truth

**Dependency chain:** production-readiness (evidence collection) → evidence-truth (terminal gate with L1-L5 hierarchy)

### Architecture

| Signal | Example |
|--------|---------|
| "refactor" | "Refactor the concurrency module" |
| "clean up" | "Clean up the lifecycle manager" |
| "restructure" | "Restructure the module hierarchy" |
| "architecture review" | "Review the architecture for maintainability" |
| "technical debt" | "Address technical debt in the delegation system" |
| "code organization" | "Improve code organization in src/tools/" |

**Bundle:** hm-l2-refactor → hm-l2-roadmap-maintainability

**Dependency chain:** hm-l2-refactor (decide surgical vs structural) → hm-l2-roadmap-maintainability (evaluate long-term impact)

### Analysis

| Signal | Example |
|--------|---------|
| "analyze requirements" | "Analyze the requirements for the new feature" |
| "diagnose gaps" | "Diagnose gaps in the spec" |
| "validate requirements" | "Validate the requirements are complete" |
| "find contradictions" | "Find contradictions in the acceptance criteria" |
| "product validation" | "Validate the feature against user needs" |

**Bundle:** hm-l2-requirements-analysis → hm-l2-product-validation

**Dependency chain:** requirements-analysis (detect gaps) → product-validation (validate against users)

### Brainstorm

| Signal | Example |
|--------|---------|
| "brainstorm" | "Let's brainstorm the notification system" |
| "ideation" | "Run an ideation session for the dashboard" |
| "figure out what to build" | "Help me figure out what to build for the admin panel" |
| "explore ideas" | "Explore ideas for the onboarding flow" |
| "clarify requirements" | "Clarify what the user really needs" |
| "I have a vague idea" | "I have a vague idea about a feature" |

**Bundle:** hm-l2-brainstorm → hm-l2-user-intent-interactive-loop (if intent remains unclear)

**Dependency chain:** brainstorm (ideation) → user-intent-interactive-loop (probe if ambiguous)

### Ecosystem

| Signal | Example |
|--------|---------|
| "feature ecosystem" | "Map the feature ecosystem for the notification system" |
| "cross-dependency" | "Find cross-dependencies between features" |
| "feature ordering" | "Determine feature ordering for the roadmap" |
| "dependency graph" | "Build a dependency graph for the features" |
| "interdependent features" | "Analyze interdependent features for delivery order" |

**Bundle:** hm-l2-feature-ecosystem (single-skill bundle)

### Guardrail

| Signal | Example |
|--------|---------|
| "guardrail" | "Set up guardrails for the phase" |
| "phase loop" | "Run the phase loop until completion" |
| "loop until" | "Loop until the exit criteria are met" |
| "iterate phase" | "Iterate through the phase with checkpoints" |
| "exit criteria" | "Define exit criteria for the phase" |
| "entry gate" | "Check the entry gate before starting the phase" |
| "loop guard" | "Add loop guards to prevent infinite iteration" |

**Bundle:** hm-l2-phase-loop → hm-l2-completion-looping

**Dependency chain:** phase-loop (manage iterations) → completion-looping (verify each iteration)

### Research Chain

| Signal | Example |
|--------|---------|
| "research chain" | "Run the full research chain for the new integration" |
| "ingest stack" | "Ingest the tech stack docs first" |
| "detect codebase" | "Detect patterns in the codebase" |
| "synthesize findings" | "Synthesize findings into a report" |
| "multi-stage research" | "Do multi-stage research on the authentication patterns" |
| "compact findings" | "Compact the research findings into an artifact" |

**Bundle:** hm-l3-research-chain → hm-l3-synthesis

**Dependency chain:** research-chain (orchestrate pipeline) → synthesis (compress and deliver artifact)

## Multi-Domain Resolution

When a task spans 2 domains:

| Combination | Primary | Secondary Add | Total |
|-------------|---------|---------------|-------|
| Research + Debug | Debug (2) | hm-l3-detective (1) | 3 |
| Research + Planning | Research (3) | hm-l2-spec-driven-authoring (1) | 3 (cap) |
| Research + Architecture | Research (3) | None (cap hit) | 3 |
| Planning + Quality | Planning (2) | hm-l2-test-driven-execution (1) | 3 |
| Implementation + Quality | Implementation (2) | hm-l2-test-driven-execution (1) | 3 |
| Implementation + Debug | Debug (2) | hm-l2-phase-execution (1) | 3 |
| Quality + Review | Review (2) | hm-l2-test-driven-execution (1) | 3 |
| Debug + Review | Debug (2) | hm-l2-production-readiness (1) | 3 |
| Guardrail + Implementation | Implementation (2) | hm-l2-phase-loop (1) | 3 |

**Rule:** Primary domain gets its full bundle. Secondary domain contributes 1 skill. Total ≤ 3.

## Exclusion Rules

| Task Type | Route To | NOT This Router |
|-----------|---------|-----------------|
| Meta-builder (create/edit skills, agents, commands) | hf-skill-router | hm-l2-skill-router |
| Simple file operations (read, write, edit) | No skill needed | hm-l2-skill-router |
| Git operations (commit, branch, merge) | No skill needed | hm-l2-skill-router |
| Conversational questions | No skill needed | hm-l2-skill-router |

## Depth Qualification

All skill names in this router use `{lineage}-{depth}-{name}` format:
- `hm-*` — Layer 2 product-dev skills
- `hm-*` — Layer 3 specialized skills (detective, deep research, synthesis, research chain, tech stack)
- `gate-*` — Layer 3 internal gate skills (evidence-truth)
