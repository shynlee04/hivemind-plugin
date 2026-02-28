# Requirements

> Derived from: Master Plan v2.1, SYSTEM-DIRECTIVES.md, CONCERNS.md, User Directives
> Priority: 3-RANK Problem Hierarchy

## Active Requirements

| ID | Description | RANK | Phase | Status |
|----|-------------|------|-------|--------|
| REQ-001 | Eliminate P0 checklist duplication across SYSTEM + USER channels | 1 | β.1 | pending |
| REQ-002 | Eliminate P0 first-turn confirmation duplication | 1 | β.1 | pending |
| REQ-003 | Eliminate P0 triple entity-checklist evaluation (3 hooks × 5+ file reads each) | 1 | β.1 | pending |
| REQ-004 | Remove P0 pollution: task block every turn, ignored counter noise, tool hint noise | 1 | β.2 | pending |
| REQ-005 | Conditionalize MT-03 auto-realign — fire only on intent confidence threshold failure | 1 | β.3 | pending |
| REQ-006 | Wire Wave α libs (event-consumers, planning-materializer, session-intent-classifier) into safe insertion points | 1 | β.4 | pending |
| REQ-007 | Implement cross-channel dedup (marker-based, no order coupling) | 1 | β.5 | pending |
| REQ-008 | Achieve steady-state injection < 1,200 tokens/turn | 1 | β | pending |
| REQ-009 | Convert packCognitiveState to async (19 readFileSync calls in hot path) | 1 | β | pending |
| REQ-010 | Audit event listeners for unintended context injection triggers | 2 | γ.1 | pending |
| REQ-011 | Audit .hivemind/ JSON for zombie/orphan patterns | 2 | γ.2 | pending |
| REQ-012 | Resolve framework-tool vs MCP-tool naming conflicts | 2 | γ.3 | pending |
| REQ-013 | Add deterministic export contracts before any write to .hivemind/ | 2 | γ.4 | pending |
| REQ-014 | Implement auto-new-session mechanism (SYSTEM-DIRECTIVES §3A) | 3 | δ.1 | pending |
| REQ-015 | Implement memory auto-classification (temporary → consolidated → purged) | 3 | δ.2 | pending |
| REQ-016 | Implement session-related memory sorting (discovery/research/planning/implementing/debug/test) | 3 | δ.3 | pending |
| REQ-017 | Wire planning-materializer into compact_session for auto STATE.md persistence | 3 | δ.4 | pending |
| REQ-018 | Implement TODO-Pending routing for off-track intentions (§4C) | 3 | δ.5 | pending |
| REQ-019 | Build skill-loader with L0-L3 progressive disclosure + token budgets | — | ε | pending |
| REQ-020 | Populate codemap/codewiki auto-scan and auto-generation | — | ζ | pending |
| REQ-021 | Add command→workflow→skill chain trace logging with session/task IDs | — | ζ | pending |
| REQ-022 | Add context-poisoning failure signature detection | — | ζ | pending |
| REQ-023 | Framework must automate its own brownfield mapping programmatically (meta-concern) | — | ζ | pending |

## Completed Requirements

| ID | Description | Phase | Completed |
|----|-------------|-------|-----------|
| REQ-C01 | 12/12 router commands with required_references + required_prompts | 1A | 2026-02-27 |
| REQ-C02 | Bootstrap .hivemind/project/planning/ with schemas and init wiring | 1B | 2026-02-27 |
| REQ-C03 | Smart merge sync preserving user-owned frontmatter | 1 | 2026-02-27 |
| REQ-C04 | Framework auditor skill pack (structural + anti-pattern detection) | 1 | 2026-02-28 |
| REQ-C05 | Wave 2-P0 audit blockers (S-01, D-07, D-12) | 2 | 2026-02-28 |
| REQ-C06 | Wave α libs bug-free (event-consumers, planning-materializer, session-intent-classifier) | α | 2026-02-28 |
| REQ-C07 | Config dead code removal (generateAgentBehaviorPrompt, explain_reasoning, be_skeptical) | α | 2026-02-28 |
| REQ-C08 | Brownfield codebase mapping (7 documents, 2944 lines) | 0 | 2026-02-28 |
