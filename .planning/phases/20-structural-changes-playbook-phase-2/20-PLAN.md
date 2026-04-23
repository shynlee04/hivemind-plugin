# Phase 20 — Structural Changes Plan

**Phase:** 20
**Playbook Phase:** 2
**Date:** 2026-04-23

---

## Wave 1: Merge session-context-manager → hm-planning-with-files

**Tasks:**
1. Read session-context-manager SKILL.md and references
2. Identify content that belongs in hm-planning-with-files (session-level context schema, checkpoint patterns, context propagation)
3. Append or integrate into hm-planning-with-files references/
4. Update hm-planning-with-files SKILL.md to mention session-context capabilities
5. Move session-context-manager to retired/ or mark as merged

## Wave 2: Split harness-delegation-inspection

**Tasks:**
1. Read harness-delegation-inspection SKILL.md and references
2. Create `hm-subagent-delegation-patterns` with delegation envelope templates, status protocols, dispatch patterns
3. Create `hm-opencode-project-inspection` with project audit patterns, ecosystem structure, inspection workflows
4. Update call-sites (agents, commands, playbook)

## Wave 3: Create G-A Skills

**Tasks:**
1. `hm-completion-looping` — non-regression guardrail + subagent dispatch + self-verification envelope
2. `hm-subagent-delegation-patterns` — from split (Wave 2)

## Wave 4: Create G-B Skills

**Tasks:**
1. `hm-spec-driven-authoring` — SPEC → falsifiable REQ-* + acceptance tests
2. `hm-test-driven-execution` — red-green-refactor integrated with planning + phase-loop

## Wave 5: Create G-C + G-D Skills

**Tasks:**
1. `hm-research-chain` — canonical chain: detective → deep-research → synthesis → artifact
2. `hm-debug` — systematic debugging with persistent state
3. `hm-refactor` — surgical vs. structural refactor taxonomy
4. `hm-phase-execution` — wave-based execution loop

## Commit Discipline
- One commit per wave
- Message format: `phase: 20-wave-N — <what changed>`
