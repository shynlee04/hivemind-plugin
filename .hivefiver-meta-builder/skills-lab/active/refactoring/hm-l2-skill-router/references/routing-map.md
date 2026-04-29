# Dispatch Map — HM Skill Router

## Overview

This reference documents the complete dispatch map used by `hm-skill-router` to map task domains to concrete hm-* skill bundles. Each domain entry includes intent signals, the skill bundle with priority ordering, and domain resolution guidelines.

## Domain Signal Tables

### Research

| Signal | Example |
|--------|---------|
| "investigate" | "Investigate why delegation persistence is failing" |
| "research" | "Research the latest patterns for circuit breaker design" |
| "find out" | "Find out which version of the AI SDK supports tool streaming" |
| "analyze" | "Analyze the codebase for memory leaks in the event loop" |
| "look into" | "Look into the performance regression in session recovery" |
| "explore" | "Explore the plugin SDK surface for hook registration" |
| "gather information" | "Gather information about the task queue architecture" |

**Bundle:** hm-detective (P1) → hm-deep-research (P2)
**Dependency chain:** detective scans the codebase first, deep-research collects external evidence after.

### Planning

| Signal | Example |
|--------|---------|
| "plan" | "Plan the implementation for the notification handler" |
| "spec" | "Write the spec for the circuit breaker module" |
| "write requirements" | "Write requirements for the session journal system" |
| "design the interface" | "Design the interface between continuity and persistence" |
| "architect" | "Architect the delegation manager's completion detection" |

**Bundle:** hm-planning-persistence (P1) → hm-spec-driven-authoring (P2)
**Dependency chain:** persistence sets up planning scaffold, spec-driven-authoring produces the locked spec.

### Implementation

| Signal | Example |
|--------|---------|
| "implement" | "Implement the dual-signal completion detector" |
| "build" | "Build the background task queuing system" |
| "execute" | "Execute phase 5 plans for the auth module" |
| "code" | "Code the session patch tool with Zod schemas" |
| "write" | "Write the delegation persistence helper" |
| "run the phase" | "Run the phase for notification handler" |

**Bundle:** hm-phase-execution (P1) → hm-cross-cutting-change (P2)
**Dependency chain:** phase-execution dispatches waves, cross-cutting-change activates when changes span multiple layers.

### Quality

| Signal | Example |
|--------|---------|
| "test" | "Test the concurrency module with vitest" |
| "verify" | "Verify the implementation matches the quality contract" |
| "validate quality" | "Validate quality gates for the delegation system" |
| "TDD" | "Use TDD for the new lifecycle manager" |
| "red-green-refactor" | "Follow red-green-refactor for session recovery" |
| "check coverage" | "Check test coverage for src/lib/" |

**Bundle:** hm-test-driven-execution (P1) → hm-gate-orchestrator (P2)
**Dependency chain:** TDD execution first, then gate validation against the triad.

### Debug

| Signal | Example |
|--------|---------|
| "debug" | "Debug the failing completion detection test" |
| "fix" | "Fix the race condition in concurrency manager" |
| "broken" | "The build is broken after the last refactor" |
| "failing" | "Tests are failing in CI but pass locally" |
| "error" | "Getting a TypeError in plugin initialization" |
| "investigate issue" | "Investigate the memory leak in event handlers" |
| "root cause" | "Find the root cause of session journal corruption" |

**Bundle:** hm-debug (P1) → hm-completion-looping (P2)
**Dependency chain:** debug investigates and fixes, completion-looping verifies the fix actually resolved the issue.

### Review

| Signal | Example |
|--------|---------|
| "review" | "Review the phase output for production readiness" |
| "audit" | "Audit the skill ecosystem for quality gaps" |
| "readiness" | "Check production readiness before shipping" |
| "deploy check" | "Run the deployment check before release" |
| "ship ready" | "Is this ready to ship to production?" |
| "pre-release" | "Pre-release verification of the harness plugin" |

**Bundle:** hm-production-readiness (P1 only)
**Note:** Single-skill bundle. Review tasks are focused on deployment safety verification across 8 dimensions.

### Architecture

| Signal | Example |
|--------|---------|
| "refactor" | "Refactor the delegation manager to reduce complexity" |
| "clean up" | "Clean up the continuity module — it's 650 LOC" |
| "restructure" | "Restructure the tools directory to group by domain" |
| "architecture review" | "Architecture review of the control plane" |
| "technical debt" | "Address technical debt in the lifecycle manager" |
| "code organization" | "Improve code organization in src/lib/" |

**Bundle:** hm-refactor (P1) → hm-roadmap-maintainability (P2)
**Dependency chain:** refactor decides scope and approach, roadmap-maintainability evaluates long-term maintainability impact.

### Analysis

| Signal | Example |
|--------|---------|
| "analyze requirements" | "Analyze requirements for the notification system" |
| "diagnose gaps" | "Diagnose gaps in the quality contract" |
| "validate requirements" | "Validate requirements against user needs" |
| "find contradictions" | "Find contradictions in the phase 5 spec" |
| "product validation" | "Product validation for the new delegation feature" |
| "requirements gap analysis" | "Requirements gap analysis for the session journal" |

**Bundle:** hm-requirements-analysis (P1) → hm-product-validation (P2)
**Dependency chain:** requirements-analysis detects gaps and contradictions, product-validation assesses against real user impact.

### Integration

| Signal | Example |
|--------|---------|
| "integrate" | "Integrate the notification handler with delegation" |
| "cross-phase verification" | "Cross-phase verification between SE-10 and SE-11" |
| "connect systems" | "Connect the session journal to the continuity store" |
| "E2E flow" | "Verify the end-to-end delegation flow" |
| "integration check" | "Integration check for the control plane wiring" |
| "cross-module" | "Cross-module verification for hooks and tools" |

**Bundle:** hm-cross-cutting-change (P1) → hm-production-readiness (P2)
**Dependency chain:** cross-cutting-change ensures safety across layers, production-readiness verifies deployment safety.

### Brainstorm

| Signal | Example |
|--------|---------|
| "brainstorm" | "Brainstorm ideas for the GUI sidecar dashboard" |
| "ideation" | "Ideation session for the memory system design" |
| "figure out what to build" | "Figure out what to build for phase 18" |
| "explore ideas" | "Explore ideas for the parallel agent scheduler" |
| "clarify requirements" | "Clarify requirements before planning phase 6" |
| "what should we build" | "What should we build for the next milestone?" |

**Bundle:** hm-brainstorm (P1 only)
**Note:** Single-skill bundle. Brainstorming bridges vague intent to structured requirements.

### Ecosystem

| Signal | Example |
|--------|---------|
| "feature ecosystem" | "Analyze the feature ecosystem for the HiveMind harness" |
| "cross-dependency" | "Cross-dependency check between skills and agents" |
| "feature ordering" | "Feature ordering for phase delivery" |
| "dependency graph" | "Build the dependency graph for the skill loading system" |
| "interdependent features" | "Resolve interdependent features in the routing layer" |
| "feature impact" | "Feature impact analysis for the delegation revamp" |

**Bundle:** hm-feature-ecosystem (P1 only)
**Note:** Single-skill bundle. Ecosystem analysis focuses on feature dependency graph validation.

### Closure

| Signal | Example |
|--------|---------|
| "complete" | "Mark the phase as complete and verify" |
| "finish" | "Finish the implementation and run final checks" |
| "wrap up" | "Wrap up the session and verify all tasks done" |
| "verify completion" | "Verify completion of the delegated task" |
| "final check" | "Final check before submitting the PR" |
| "done" | "Is the task done? Run completion verification" |

**Bundle:** hm-completion-looping (P1) → hm-test-driven-execution (P2)
**Dependency chain:** completion-looping verifies nothing is incomplete, TDD re-runs tests as final guardrail.

## Domain-Overlap Resolution Table

When task signals match multiple domains, use this resolution table:

| Primary Signal | Secondary Signal | Resolution |
|---------------|-----------------|------------|
| "analyze" + "requirements" | Analysis + Research | Analysis (key: "requirements" qualifies signal) |
| "analyze" + "codebase" | Research + Analysis | Research (key: "codebase" qualifies signal) |
| "investigate" + "failing" | Research + Debug | Debug (key: "failing" = primary action) |
| "review" + "architecture" | Review + Architecture | Architecture (key: "architecture" = domain specific) |
| "plan" + "integration" | Planning + Integration | Planning (key: "plan" precedes integration action) |
| "implement" + "test" | Implementation + Quality | Implementation (key: "implement" first, quality is secondary) |
| "fix" + "refactor" | Debug + Architecture | Debug (key: "fix" = immediate action, refactor is scope) |
| "verify" + "completion" | Quality + Closure | Closure (key: "completion" = end-of-workflow signal) |

**Rule:** The noun/qualifier after the verb determines the domain. The verb+noun combination is the primary signal.

## Bundle Size Limits

| Bundle Type | Max Skills | Exceeding Action |
|------------|-----------|-----------------|
| Standard domain | 2 | N/A (all domains have ≤2 skills) |
| Multi-domain (2 domains) | 3 | Split into subtasks if more needed |
| Multi-domain (3+ domains) | — | SPLIT immediately — no three-domain bundles |

**Why the 3-skill cap?** Agent context windows are finite. Loading more than 3 skills per task causes context bloat, where skill instructions compete for tokens with task data. Three skills provide deep coverage without overwhelming the context budget.
