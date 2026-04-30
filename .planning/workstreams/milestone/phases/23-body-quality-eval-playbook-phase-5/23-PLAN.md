# Phase 23: Body Quality + Eval — Playbook Phase 5

**Status:** PARTIAL — some eval files expanded, but incomplete

**Goal:** Final body quality pass and eval framework expansion for all 9 target skills.

**Requirements from Playbook Phase 5:**
- Body quality pass: ensure all 9 target skills have high-quality body content
- Eval expansion: add trigger queries and stacked scenarios to all skills
- Each skill must have complete eval bundle (`evals/evals.json`, `evals/trigger-queries.json`)
- Run eval framework and verify coverage

**Reality Check (from audit 2026-04-23):**
- Commit `07918c41` expanded eval files for 7 skills
- Only `hm-completion-looping/evals/` has a `stacked_scenario`
- `hm-opencode-project-inspection` and `hm-subagent-delegation-patterns` still have no eval bundles
- Some created skills have no `evals/` directory at all

**Deliverables:**
1. All 9 target skills have complete eval bundles
2. Stacked scenarios added to all skills
3. Trigger queries optimized for accuracy
4. Eval framework run with coverage report

**Plans:** 1 plan

Plans:
- [ ] 23-01-PLAN.md — Complete eval bundles for all 9 skills, add stacked scenarios, verify trigger queries, run eval framework
