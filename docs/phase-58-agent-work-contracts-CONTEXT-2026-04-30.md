# Phase 58 Context: Agent Work Contracts
**Date:** 2026-04-30
**Workstream:** milestone
**Phase:** 58 — Agent Work Contracts
**Status:** research-locked / pre-planning
**Reader:** researcher, planner, verifier, or human reviewer preparing Phase 58 as a product-detox concept migration phase.
**Post-read action:** derive bounded implementation scope and evidence-first planning for migrating agent work contracts from product-detox into harness-experiment.

## Intent
Port the agent work contract system from product-detox. Work contracts define scope, evidence requirements, and compaction preservation — capturing briefing, summary, and anchor packet extraction from agent sessions, then re-injecting after context compaction. This closes the Agent Synthesis AS-8 gap (body enrichment needs contract preservation) and provides the foundation for honest completion evidence across delegation boundaries.

## Scope
- `lib/agent-work-contract/contract-store.ts` — persistent store for work contract definitions
- `lib/agent-work-contract/compaction-preservation.ts` — briefing, summary, and anchor packet extraction with post-compaction re-injection
- `lib/agent-work-contract/engine.ts` — work contract lifecycle engine (create, update, complete, verify)
- `lib/agent-work-contract/hooks.ts` — lifecycle hooks for compaction-time preservation and session-start re-injection
- `lib/agent-work-contract/schema.ts` — Zod schemas for work contract definitions
- `tools: hivemind_agent_work_create` — create a new work contract with scope, evidence requirements, and verification criteria
- `tools: hivemind_agent_work_export` — export work contract evidence for cross-session handoff
- Integration with Phase 57 pressure contracts (pressure contracts gate work contract enforcement)

## Non-Goals
- Do not implement Agent Synthesis AS-8 fully — Phase 58 is the contract system, not the synthesis pipeline
- Do not replace existing delegation envelope metadata (complementary, not replacement)
- Do not modify the existing compaction pipeline (hooks add preservation, don't change compaction)
- Do not create general-purpose session management tools (work contracts are specific to agent work definition)

## Evidence Sources
- product-detox: agent work contract system — contract store, compaction preservation, engine, hooks, schema
- product-detox: `hivemind_agent_work_create` and `hivemind_agent_work_export` tool contracts
- `.planning/workstreams/agent-synthesis/CONTEXT.md` — Agent Synthesis AS-8 body enrichment needs
- `.planning/workstreams/milestone/ROADMAP.md` — Phase 57 → Phase 58 dependency chain
- `src/lib/delegation-manager.ts` — existing delegation dispatch and completion
- `src/lib/completion-detector.ts` — existing completion detection
- `src/plugin.ts` — hook composition (where contract preservation hooks would wire)
- `.planning/codebase/ARCHITECTURE.md` — hook observation flow, CQRS boundaries

## Assumptions
- Work contracts are a structured complement to existing delegation envelope metadata
- Compaction preservation hooks can be added without breaking existing hook composition (Phase 43)
- The contract system is read/write but bounded to agent work scope (not general session state)
- Pressure contracts (Phase 57) will provide gate decisions for work contract enforcement

## Success Criteria
1. A planner can define a work contract with scope, evidence requirements, and verification criteria
2. Compaction preservation (briefing, summary, anchor packet extraction and re-injection) is documented with hook integration points
3. The two tools (`hivemind_agent_work_create` and `hivemind_agent_work_export`) are contract-defined
4. The dependency on Phase 57 pressure contracts is explicitly stated
5. The downstream connection to Agent Synthesis AS-8 (body enrichment) is documented

## Downstream Research Questions
1. How does briefing/summary/anchor packet extraction work at compaction time — what hooks are available and what is the payload shape?
2. What is the exact schema for work contract evidence that survives compaction and re-injects correctly?
3. How should work contract enforcement interact with existing delegation completion detection?
4. What is the minimum viable contract scope versus the full product-detox contract system?
5. How does contract verification differ from existing delegation completion signals (dual-signal, stability polling)?

## Reader-Test Note
- A planner should see work contracts as structured evidence preservation, not as a replacement for delegation envelopes
- A verifier should trace each scope item to a product-detox concept and the Agent Synthesis AS-8 gap it helps close
- The dependency (Phase 57 → Phase 58 → AS-8) should be clear from Intent and Scope
