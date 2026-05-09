---
feature: agent-steering-engine
status: draft
created: 2026-05-09
updated: 2026-05-09
confirmation: none-everything-is-reference-only
locked: false
sources:
  - .hivemind/planning/ideating/agent-role-mode-steering-2026-05-09.md
  - .hivemind/planning/team-b-references/session-ses_1f2e-another-team-work-toward-agent-role-steering-reccomendation.md
---

# Agent Steering Engine — Requirements

## Intent Summary

Agents in the Hivemind harness lose alignment to their role, hierarchy,
delegation context, and workflow constraints over long sessions. Subagents
don't know they're subagents. After context compaction, agents drift from
their workflows. Agents skip governance steps because no system reminds
them. Investigation, audit, and research outputs are lost because agents
don't persist artifacts to disk.

**Target users:** Developers using Hivemind-powered OpenCode projects (npm package).

**Success looks like:**
- Subagents aware they are subagents from turn 1
- After compaction, agents recover role + workflow + TODO state
- Agents persist investigation/research outputs to disk without manual user saves
- Steering messages are conditional, non-noisy, non-hallucination-inducing
- System is configurable via schemas, not hardcoded agent lists

---

## P0 — Must Have (MVP)

### REQ-01: Steering Policy Engine

A conditional evaluator that decides WHEN to inject steering content and
WHAT to inject. Not every turn — only when conditions warrant.

**Conditions assessed:**
- Hierarchy (front-facing vs subagent)
- Depth (L0/L1/L2/L3)
- Lineage (hm-*/hf-*)
- Turns since last reminder
- Phase/workflow state change
- Compaction event flag
- Task boundary shift

**Verification:** Unit tests with mocked session state prove conditional
dispatch fires only when expected conditions met; no injection otherwise.

### REQ-02: messages.transform Reactivation

Primary injection surface. Currently a no-op pass-through at
`src/hooks/lifecycle/core-hooks.ts:143-150`. Reactivate as the
conditional steering carrier.

**Injects:** Lightweight `<system_reminder>` block containing role,
hierarchy, delegation depth, and boundary constraints — only when
the policy engine decides injection is warranted.

**Must NOT:**
- Inject on every turn
- Compete with governance block
- Mutate existing messages

**Verification:** Integration test proves conditional injection fires
on correct triggers and passes through unchanged otherwise.

### REQ-03: session.compacting Extension

Post-compact full context recovery. Extend the existing
`experimental.session.compacting` hook at
`src/hooks/lifecycle/session-hooks.ts:222-338`.

**Injects:** Full context packet: role + hierarchy + TODO state +
plan refs + delegation chain + workflow phase + active skills.

**Verification:** Integration test proves post-compaction recovery
restores role and workflow context.

### REQ-04: system.transform Minimal Marker

Extend `src/hooks/lifecycle/core-hooks.ts:69-133` to add a single-line
persistent role identifier to the system prompt.

**Injects:** `[role: {hierarchy}-{depth} | lineage: {hm|hf} | depth: {n}/{max}]`

**Must NOT:** Replace or conflict with existing governance block,
intake context, or behavioral profile injection.

**Verification:** Unit test proves marker appears in system prompt
output without disrupting existing blocks.

### REQ-05: Subagent Delegation Awareness

Delegated subagents must know from turn 1 that they are subagents.
Current gap: subagents only learn delegation context from `_harness`
metadata AFTER their first tool call.

**Resolution:** Inject delegation-awareness steering at session start
via the policy engine + system.transform marker.

**Verification:** E2E test dispatches a delegation and verifies the
child session receives role marker in system prompt.

### REQ-06: Dynamic Primitive Registration

OpenCode primitives (agents, skills, commands, tools, plugins — both
singular and plural subdir names) under `.opencode/` (project or global)
are `.md` files with YAML frontmatter. The steering engine must
dynamically register these at runtime.

**MVP scope:** Dynamically register Hivemind's shipped primitives.
**Post-MVP:** Include arbitrary project/global paths; connect to
CLI init flow when user first installs Hivemind.

**Constraints:**
- No hardcoded agent lists, paths, or lineage enumerations
- Schema-driven: registration reads YAML frontmatter, not file names
- Must handle plural and singular subdir names (agents/ and agent/)

**Verification:** Unit test proves dynamic scanning of `.opencode/`
subdirs yields correct primitive inventory from YAML frontmatter.

---

## P1 — Should Have (Post-MVP Extensions)

### REQ-07: Workflow Phase Awareness

Add awareness of current workflow phase (research → plan → execute →
verify) to steering content so agents don't skip phases.

**Verification:** Integration test proves steering injection adapts
content based on detected workflow phase.

### REQ-08: Boundary Constraint Injection

Explicit "you may NOT" rules (no direct user communication for
subagents, no code editing for researchers, no skipping gates).

**Verification:** E2E test proves subagent receives boundary
constraints relevant to its specialist role.

### REQ-09: Artifact Persistence Steering

Reminders that drive agents to save investigation, audit, and research
outputs to disk. Addresses the observed pitfall: agents don't persist
their work.

**Verification:** E2E test proves steering reminder fires when agent
has produced investigation output without writing to disk.

### REQ-10: Phase Checkpoint & Reassessment

Phase-based progression with checkpoints. Each phase must reassess
with fresh context, investigation, and research before proceeding.

**Verification:** Integration test proves checkpoint gate blocks
progression until reassessment conditions met.

---

## P2 — Nice to Have (Future)

### REQ-11: Drift Detection

Pattern matching on agent responses to detect when agent has drifted
from its role (e.g., subagent addressing user directly, orchestrator
implementing code).

### REQ-12: Skill/Command Routing Suggestions

Steering content includes recommendations for which skills to load
and commands to use based on current phase and agent role.

### REQ-13: Cross-Lineage Bridge Awareness

Steering for cross-lineage handoffs (hm → hf and vice versa) so
agents route correctly instead of attempting cross-lineage execution.

### REQ-14: CLI Init Integration

Connect dynamic primitive registration to the Hivemind CLI
initialization flow when user first installs the package.

---

## Hard Constraints

| ID | Constraint | Source |
|----|-----------|--------|
| C1 | ALL code in `src/` (hard harness npm package) — zero in `.opencode/` | User directive |
| C2 | Schematic + dynamic + user-configurable — NOT hard-coded | User directive |
| C3 | Only hm-*/hf-* primitives referenced — gsd-* is dev tooling only | User directive |
| C4 | CQRS boundary: hooks are observation + response-shaping only | Architecture (cqrs-boundary.ts) |
| C5 | No injection fatigue: conditional dispatch, not every-turn | Ideation doc + user directive |
| C6 | Must not conflict with existing system.transform, tool.execute.after, or session.compacting hooks | Architecture |
| C7 | OpenCode primitives are `.md` files with YAML frontmatter under `.opencode/` subdirs (project or global, singular or plural names) | User directive |
| C8 | Nothing is final confirmation — all requirements are references subject to checkpoint reassessment | User directive |
| C9 | Each phase produces CONTEXT.md, RESEARCH.md, SPEC.md, PATTERNS.md before atomic plans | User directive |

---

## Validated Assumptions

| ID | Assumption | Status |
|----|-----------|--------|
| A1 | Steering policies are runtime-configurable schemas, not hardcoded agent lists | Validated |
| A2 | All steering code lives in `src/`, NOT in `.opencode/` | Validated |
| A3 | gsd-* agents/skills are developer tooling only, never shipped | Validated |
| A4 | Artifact persistence pitfall is a first-class requirement | Validated — high priority |
| A5 | Phase-based progression with checkpoints is mandatory | Validated |
| A6 | `messages.transform` is the primary injection surface | Validated — architecture decision |
| A7 | Progressive enrichment, not big-bang | Validated |
| A8 | Steering system extends existing hooks, does not replace them | Validated |
| A9 | CQRS boundaries apply — hooks cannot perform durable writes | Architecture constraint |

---

## Open Questions

| ID | Question | Resolution Path |
|----|----------|----------------|
| O1 | What is the optimal injection cadence (turns-per-reminder)? | Research in Phase 01 |
| O2 | How should the steering policy schema be versioned? | Design in Phase 02 |
| O3 | How to detect "drift" without false positives? | Research in Phase 01 |
| O4 | What schema format for dynamic primitive registration? | Design in Phase 02 |
| O5 | How to handle primitives from plugins the user installs? | Post-MVP (REQ-14) |

---

## Research Notes

- Team-b research session: `ses_1f2e0b3f0ffeweqtbz5Fa9r9fM`
- Architecture investigation: `ses_1f2dbac74ffewrAPECW2Fyf9CX`
- Key files: `src/hooks/lifecycle/core-hooks.ts`, `src/hooks/lifecycle/session-hooks.ts`, `src/hooks/guards/tool-guard-hooks.ts`, `src/routing/behavioral-profile/`, `src/coordination/delegation/`
- SDK reference: `.opencode/skills/stack-l3-opencode/references/`
