---
feature: agent-steering-engine
status: draft
created: 2026-05-09
updated: 2026-05-09
total-phases: 8
confirmation: none-everything-is-reference-only
locked: false
---

# Agent Steering Engine — Roadmap

> **NOTHING IS FINAL.** All phases are references subject to checkpoint
> reassessment. Each phase produces CONTEXT.md, RESEARCH.md, SPEC.md,
> PATTERNS.md before 3-4 atomic plans are built and implemented.

---

## Phase 01: Research And Architecture

**Goal:** Deep investigation of OpenCode SDK hook semantics, existing
harness injection patterns, and dynamic primitive scanning feasibility.

**Key questions:**
- Exact `messages.transform` hook input/output shape (verify team-b research)
- `experimental.session.compacting` context preservation capabilities
- OpenCode primitive YAML frontmatter schema (what fields exist?)
- How `.opencode/` subdirs are structured in real user projects
- Token budget impact of different injection content sizes

**Artifacts:** CONTEXT.md, RESEARCH.md
**Depends on:** Master plan artifacts (this file)
**Atomic plans:** 3-4 after research checkpoint

---

## Phase 02: Schema And Policy Design

**Goal:** Design the steering policy schema, primitive registration schema,
and injection content templates.

**Key questions:**
- Policy schema format (JSON Schema? Zod? YAML config?)
- How to represent hierarchy/lineage/depth as schema fields
- Content templates for each injection surface
- Versioning strategy for policy schemas
- How dynamic registration reads YAML frontmatter from `.md` files

**Artifacts:** SPEC.md, PATTERNS.md
**Depends on:** Phase 01 RESEARCH.md

---

## Phase 03: Core Engine Implementation

**Goal:** Build the SteeringPolicyEngine — the conditional evaluator
that decides when/what to inject.

**Scope:**
- Policy evaluator module in `src/`
- Condition matching logic (hierarchy, depth, lineage, turns, phase)
- Injection content builder (from templates)
- Turn counter and state tracking (through tools, respecting CQRS)

**Test-driven:** RED → GREEN → REFACTOR per atomic plan
**Depends on:** Phase 02 SPEC.md, PATTERNS.md

---

## Phase 04: Dynamic Primitive Registration

**Goal:** Build runtime scanning of `.opencode/` subdirs (agents, skills,
commands, tools, plugins — singular and plural) to register OpenCode
primitives from YAML frontmatter.

**MVP scope:** Hivemind's shipped primitives only.
**Post-MVP:** Arbitrary project/global paths, CLI init integration.

**Test-driven:** RED → GREEN → REFACTOR per atomic plan
**Depends on:** Phase 02 SPEC.md

---

## Phase 05: Injection Surfaces Wiring

**Goal:** Wire the policy engine to the three injection surfaces:
messages.transform (primary), session.compacting (recovery),
system.transform (minimal marker).

**Scope:**
- Reactivate `messages.transform` at `src/hooks/lifecycle/core-hooks.ts:143-150`
- Extend `experimental.session.compacting` at `src/hooks/lifecycle/session-hooks.ts:222-338`
- Add minimal role marker to `system.transform` at `src/hooks/lifecycle/core-hooks.ts:69-133`
- Ensure no conflicts with existing governance/intake/behavioral blocks

**Test-driven:** RED → GREEN → REFACTOR per atomic plan
**Integration tests:** Must prove coexistence with existing hooks
**Depends on:** Phase 03 (policy engine), Phase 04 (primitive registration)

---

## Phase 06: Artifact Persistence Steering

**Goal:** Add steering content that reminds agents to persist investigation,
audit, and research outputs to disk. Addresses the observed pitfall.

**Scope:**
- Detection heuristics for "agent produced output without writing to disk"
- Steering reminder injection when persistence gap detected
- Integration with existing tool metadata to track file write patterns

**Test-driven:** RED → GREEN → REFACTOR per atomic plan
**Depends on:** Phase 05 (injection surfaces wired)

---

## Phase 07: Integration And Validation

**Goal:** End-to-end validation across all surfaces with clean feature branch.

**Scope:**
- E2E test: delegation dispatch → child receives role marker
- E2E test: compaction → role recovery
- E2E test: N turns → conditional reminder fires
- E2E test: dynamic primitive scan → correct inventory
- Spec-driven validation against Phase 02 SPEC.md
- Live testing with real agent sessions

**Gate:** All integration tests pass on clean feature branch
**Depends on:** Phases 03-06

---

## Phase 08: Progressive Enrichment Layer

**Goal:** Layer on workflow phase awareness, boundary constraints,
and skill/command routing suggestions (REQ-07, REQ-08, REQ-12).

**Scope:**
- Workflow phase detection and injection
- Role-specific boundary constraint templates
- Skill/command routing suggestions in steering content
- Drift detection heuristics (REQ-11)

**Test-driven:** RED → GREEN → REFACTOR per atomic plan
**Depends on:** Phase 07 (validated MVP)

---

## Dependency Graph

```
01-Research ──→ 02-Schema ──→ 03-Core-Engine ──┐
                    │                              │
                    └──→ 04-Dynamic-Reg ─────────→┤
                                                   ↓
                                        05-Injection-Wiring
                                                   ↓
                                        06-Artifact-Steering
                                                   ↓
                                        07-Integration-Validation
                                                   ↓
                                        08-Progressive-Enrichment
```

## Phase Execution Rules

1. Each phase produces CONTEXT.md → RESEARCH.md → SPEC.md → PATTERNS.md
   BEFORE any atomic plans are built.
2. 3-4 atomic plans per phase, implemented gradually.
3. Test-driven (RED → GREEN → REFACTOR) for each plan.
4. Spec-driven validation at phase completion.
5. Live testing on clean feature branch before stacking complexity.
6. Checkpoint at each phase boundary: reassess with fresh context,
   investigation, and research before proceeding.
7. Nothing is final confirmation — phases may renumber, merge, or split
   based on checkpoint findings.
