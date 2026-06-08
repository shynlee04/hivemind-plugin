# RICH Gate Scorecard — hm-l3-hivemind-state-reference

| Gate | Status | Evidence |
|---|---|---|
| RICH-1 Cross-referenced sources | PASS | Cross-references `hm-l3-hivemind-engine-contracts` (engine contracts). Verifiable against `src/lib/types.ts`, `src/lib/continuity.ts`, `src/lib/delegation-persistence.ts`, `src/lib/delegation-manager.ts` source code. All file paths and constants match current codebase (verified 2026-04-30). |
| RICH-2 Pattern decision documented | PASS | P2 pattern (reference skill). Read-only consumption model for L3 agents. Progressive disclosure via section hierarchy: Overview → Directory Structure → File Contracts → Access Boundaries → Anti-Patterns → Self-Correction. |
| RICH-3 Consistent with project conventions | PASS | hm-* prefix, L3 depth, context-bomb flag for large reference content. Allowed-tools: Read, Grep, Glob, Bash (reference needs file system access for state inspection). Follows Q6 state root separation. Cross-references engine contracts skill. |
| RICH-4 Self-correction mechanism | PASS | 5 correction modes: Missing State Files, Stale State, Delegation/Session Conflict, Recovery Failure, User Contradiction. Each mode has [Detection] + [Recovery] structure. Max 3 implicit attempts before recommending state audit. |
| RICH-5 Bundled executable resources | PASS | metrics/rich-gate-scorecard.md (this file), evals/evals.json (3 scenario evals), SKILL.md with executable self-correction paths. |
| RICH-6 Framework-agnostic paths | PASS | `.hivemind/` is canonical per Q6 — no hardcoded project paths. All file references use relative paths from project root. No language or framework assumptions. |
| RICH-7 Gap documentation | PASS | 5 anti-patterns with detection + correction pairs. Known limitation documented: no auto-rehydration of in-memory state (requires plugin restart). Race condition between delegation completion and session continuity documented. |
| RICH-8 Quality scoring | PASS | D1-D8 scored at 96/120 (B+). Self-Correction: 5 modes. Metrics: scorecard on disk. Evals: 3 scenario evals with graded criteria. Cross-references: bidirectional with hm-l3-hivemind-engine-contracts. |

## D-Score Breakdown

| Dimension | Score (max 15) | Notes |
|-----------|---------------|-------|
| D1: Trigger phrase quality | 12 | Description covers `.hivemind/` navigation, state consumption, session recovery. Specific trigger phrases for each state file. |
| D2: Frontmatter completeness | 15 | Full YAML with name, description, metadata (layer/role/pattern/version), allowed-tools. |
| D3: Progressive disclosure | 12 | Section hierarchy: Overview → Structure → Contracts → Boundaries → Anti-Patterns → Correction. Schema types inline rather than split to references (acceptable for contract documentation). |
| D4: Self-correction depth | 12 | 5 modes, all with Detection+Recovery. Coverage: missing files, stale state, race condition, recovery failure, user override. |
| D5: Anti-pattern specificity | 12 | 5 anti-patterns, all with concrete detection and correction. Each references specific tools or paths. |
| D6: Metric traceability | 12 | RICH scorecard on disk, D1-D8 breakdown, each dimension scored with evidence. |
| D7: Eval coverage | 9 | 3 scenario evals (basic coverage). Could be expanded to 5+. |
| D8: Cross-reference integrity | 12 | Bidirectional cross-reference with hm-l3-hivemind-engine-contracts. Verifiable against source code. |

**Total: 96/120 — B+ Grade**

Exit decision: **PASS (8/8 RICH gates)**. All gates met at ≥6/8 threshold. Eval coverage (D7) is minimum viable — could expand in future hardening.
