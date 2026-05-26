# RICH Gate Scorecard — hm-l3-hivemind-engine-contracts

| Gate | Status | Evidence |
|---|---|---|
| RICH-1 Cross-referenced sources | PASS | All contracts verifiable against `src/plugin.ts`, `src/lib/lifecycle-manager.ts`, `src/lib/completion-detector.ts`, `src/lib/concurrency.ts`, `src/lib/runtime-policy.ts`, `src/lib/session-api.ts`, `src/lib/task-status.ts`, `src/lib/types.ts`. Cross-references `hm-l3-hivemind-state-reference` for state structure. Constants match current codebase (verified 2026-04-30). |
| RICH-2 Pattern decision documented | PASS | P2 pattern (reference skill). Progressive disclosure via section hierarchy: Overview → Load Order → Tool Contracts → Hook Contracts → Lifecycle → Completion → Concurrency → Budget → API Wrappers → Transitions → Anti-Patterns → Self-Correction. Decision to separate engine contracts from state reference documented (contracts = how engines work, state = what engines produce). |
| RICH-3 Consistent with project conventions | PASS | hm-* prefix, L3 depth, context-bomb flag. Allowed-tools: Read, Grep, Glob, Bash (reference needs source code verification). Follows Q1-Q6 validation decisions. Cross-references state reference skill. |
| RICH-4 Self-correction mechanism | PASS | 6 correction modes: Tool Registration Failure, Lifecycle Rejection, Completion Hang, Concurrency Hang, Budget Exceeded, User Tool Addition. Each mode has [Detection] + [Recovery] with actionable steps. |
| RICH-5 Bundled executable resources | PASS | metrics/rich-gate-scorecard.md (this file), evals/evals.json (3 scenario evals), SKILL.md with source-code-verifiable contracts. |
| RICH-6 Framework-agnostic paths | PASS | All engine contracts reference `src/` paths (project-relative). Constants are framework-agnostic (timeouts, limits). No language or framework assumptions beyond TypeScript (project language). |
| RICH-7 Gap documentation | PASS | 6 anti-patterns with detection + correction pairs. Known limitation: tool registration is static (no dynamic tool loading). Hook mutation boundary documented (hooks are read-side only). Dual-signal race between delegation completion and session continuity acknowledged. |
| RICH-8 Quality scoring | PASS | D1-D8 scored at 99/120 (B+). Self-Correction: 6 modes. Metrics: scorecard on disk. Evals: 3 scenario evals with graded criteria. Cross-references: bidirectional with hm-l3-hivemind-state-reference. |

## D-Score Breakdown

| Dimension | Score (max 15) | Notes |
|-----------|---------------|-------|
| D1: Trigger phrase quality | 12 | Description covers engine integration, tool registration, lifecycle debugging, budget configuration. Specific trigger phrases for each contract domain. |
| D2: Frontmatter completeness | 15 | Full YAML with name, description, metadata (layer/role/pattern/version, requires Q1-Q6), allowed-tools. |
| D3: Progressive disclosure | 12 | Section hierarchy: Overview → Load Order → Tools → Hooks → Lifecycle → Completion → Concurrency → Budget → API → Transitions → Anti-Patterns → Correction. Tables for visual contracts. |
| D4: Self-correction depth | 12 | 6 modes covering all major failure domains: registration, lifecycle, completion, concurrency, budget, user modifications. Each actionable. |
| D5: Anti-pattern specificity | 15 | 6 anti-patterns, each with concrete detection + correction referencing specific files, functions, or constants. |
| D6: Metric traceability | 12 | RICH scorecard on disk, D1-D8 breakdown, each dimension scored with evidence from source code verification. |
| D7: Eval coverage | 9 | 3 scenario evals (basic coverage). Could expand to 5+. |
| D8: Cross-reference integrity | 12 | Bidirectional cross-reference with hm-l3-hivemind-state-reference. All constants and function signatures verifiable against source. |

**Total: 99/120 — B+ Grade**

Exit decision: **PASS (8/8 RICH gates)**. All gates met at ≥6/8 threshold. Eval coverage (D7) is minimum viable — could expand in future hardening.
