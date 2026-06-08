# Routing Map

## Overview

This reference documents the complete routing map used by `hm-lineage-router` to map task categories to skill loading bundles. Includes priority ordering, dependency chains, and multi-category resolution rules.

## Category Definitions

### Research

| Signal | Example |
|--------|---------|
| "investigate" | "Investigate why the auth module fails under load" |
| "research" | "Research the latest patterns for WebSocket reconnection" |
| "find out" | "Find out which version of Zod supports v4 schemas" |
| "analyze" | "Analyze the codebase for circular dependencies" |
| "look into" | "Look into the performance regression in the API layer" |
| "explore" | "Explore the plugin SDK surface for tool registration" |

**Bundle:** hm-tech-stack-ingest → hm-detective → hm-deep-research

**Dependency chain:** tech-stack-ingest (cache deps) → detective (scan codebase) → deep-research (multi-source evidence)

### Planning

| Signal | Example |
|--------|---------|
| "plan" | "Plan the implementation for phase 5" |
| "spec" | "Write the spec for the authentication feature" |
| "requirements" | "Gather requirements for the notification system" |
| "design" | "Design the interface between the auth and user modules" |
| "architect" | "Architect the session persistence layer" |

**Bundle:** hm-planning-persistence → hm-spec-driven-authoring

**Dependency chain:** planning-persistence (setup files) → spec-driven-authoring (produce locked spec)

### Execution

| Signal | Example |
|--------|---------|
| "implement" | "Implement the delegation persistence module" |
| "build" | "Build the completion detection pipeline" |
| "execute" | "Execute phase 3 plans" |
| "run the phase" | "Run the phase for the auth module" |
| "code" | "Code the session recovery feature" |

**Bundle:** hm-phase-execution → hm-cross-cutting-change (when touching multiple layers)

**Dependency chain:** phase-execution (wave dispatch) → cross-cutting-change (safety for multi-layer changes)

### Quality

| Signal | Example |
|--------|---------|
| "test" | "Test the delegation manager with TDD" |
| "verify" | "Verify the implementation matches the spec" |
| "quality" | "Quality check the phase output" |
| "validate" | "Validate the requirements are complete" |
| "TDD" | "Use TDD for the new feature" |
| "red-green-refactor" | "Follow red-green-refactor for the auth module" |

**Bundle:** hm-test-driven-execution → hm-gate-orchestrator

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

**Bundle:** hm-debug → hm-completion-looping

**Dependency chain:** hm-debug (investigate + fix) → hm-completion-looping (verify fix actually works)

### Review

| Signal | Example |
|--------|---------|
| "review" | "Review the phase output for production readiness" |
| "audit" | "Audit the skill ecosystem for quality" |
| "readiness" | "Check production readiness before shipping" |
| "deploy check" | "Run the deployment check" |
| "ship ready" | "Is this ready to ship?" |

**Bundle:** hm-production-readiness → hm-gate-orchestrator

**Dependency chain:** production-readiness (evidence collection) → gate-orchestrator (triad verification)

## Multi-Category Resolution

When a task spans 2 categories:

| Combination | Primary | Secondary Add | Total |
|-------------|---------|---------------|-------|
| Research + Planning | Research (3) | hm-spec-driven-authoring (1) | 4 |
| Research + Debug | Debug (2) | hm-detective (1) | 3 |
| Planning + Quality | Planning (2) | hm-test-driven-execution (1) | 3 |
| Execution + Quality | Execution (2) | hm-test-driven-execution (1) | 3 |
| Execution + Debug | Debug (2) | hm-phase-execution (1) | 3 |
| Quality + Review | Review (2) | hm-test-driven-execution (1) | 3 |

**Rule:** Primary category gets its full bundle. Secondary category contributes 1-2 skills. Total ≤ 5.

## Exclusion Rules

| Task Type | Route To | NOT This Router |
|-----------|---------|-----------------|
| Meta-builder (create/edit skills, agents, commands) | hf-meta-builder | hm-lineage-router |
| Simple file operations (read, write, edit) | No skill needed | hm-lineage-router |
| Git operations (commit, branch, merge) | No skill needed | hm-lineage-router |
| Conversational questions | No skill needed | hm-lineage-router |
