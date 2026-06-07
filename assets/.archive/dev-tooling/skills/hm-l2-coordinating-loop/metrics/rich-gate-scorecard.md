# RICH Gate Scorecard: hm-coordinating-loop

**Date:** 2026-04-29 | **Auditor:** gsd-executor (SE-8) | **Version:** 1.0.0

## RICH Classification: RICH
Coordinator skill — central hub for multi-agent workflows with script-enforced gates, handoff protocols, and ralph-loop validation.

## D1-D8 Quality Scores

| Dimension | Score | Max | Notes |
|-----------|-------|-----|-------|
| D1: Knowledge Delta | 17 | 20 | Phase 30 hardening: deterministic workflow agent, per-edge guardrails, handoff metadata, trace/evidence span. Deep reference set with 5 references. Script-enforced gates. Significant coordination knowledge. |
| D2: Mindset + Procedures | 14 | 15 | Strong procedural loop (ASSESS→DECIDE→DISPATCH→MONITOR→INTEGRATE→VERIFY). Scripts enforce gates, not tables. Fixed flowchart for execution mode. Pre-dispatch checklist. |
| D3: Anti-Pattern Quality | 14 | 15 | Eight anti-patterns with detection+correction: Broadcast, Fire-and-Forget, False Parallel, Orphan Loop, Context Leak, Silent Failure, Coordinator Executor, Infinite Retry. Excellent coverage. |
| D4: Spec Compliance | 13 | 15 | Valid frontmatter. Multi-agent dispatch triggers. Clear "NOT for single-agent execution" boundary. Min-tasks: 2 metadata field. |
| D5: Progressive Disclosure | 13 | 15 | 435 lines with 6 references, 5 scripts, worked example, and platform adaptation. Gate enforcement table in main body. Details deferred to references. |
| D6: Freedom Calibration | 12 | 15 | Strong workflow structure with gates and scripts. Platform adaptation section shows flexibility (OpenCode/Claude.ai/Codex/Cowork). Could be overly rigid for simple coordination. |
| D7: Pattern Recognition | 9 | 10 | Multi-agent coordination pattern with 6-step loop and 5 enforcement gates. Well-structured handoff protocol with worked example. |
| D8: Practical Usability | 13 | 15 | Task envelope template immediately usable. Handoff protocol with worked examples. Platform adaptation covers 4 environments. Script paths depend on skill directory. |
| **D1-D8 Total** | **105/120 (88%)** | | **Grade: A** |

## RICH Gate Evidence

| Gate | Score | Evidence |
|------|-------|----------|
| RICH-1 | PASS | Phase 30 hardening: deterministic workflow agent pattern adapted, per-edge guardrails from OpenAI tracing, handoff metadata from AutoGen/SDK patterns. |
| RICH-2 | PASS | Sequential vs parallel decision flowchart. Reassessment rule for shared state. |
| RICH-3 | PASS | Cross-refs to dispatching-parallel-agents, hm-planning-persistence, hm-subagent-delegation-patterns, agents-and-subagents-dev, user-intent-interactive-loop. |
| RICH-4 | PASS | 5 enforcement gates (G1-G5) with scripts that block progression. Fixed flowchart for execution mode decisions. |
| RICH-5 | PASS | 5 references (handoff-protocols, sequential-vs-parallel, parent-child-cycles, ralph-loop-integration, edge-guardrails) + 5 scripts. |
| RICH-6 | PASS | Platform adaptation covers 4 environments with specific guidance. Task envelope is platform-agnostic. |
| RICH-7 | PASS | Explicit routing: when to use parallel vs sequential, reassessment triggers, integration agent dispatch for conflicts. |
| RICH-8 | PASS | This scorecard. Evals/ with evals.json + trigger-queries.json. Self-correction with 4 failure modes + 3 edge cases. |

## Exit Decision: PASS
**RICH-8 Score:** 8/8 ✅

All RICH gates pass. D1-D8 score: 105/120 (A). Strong coordination skill with script-enforced gates and rich handoff lineage.
