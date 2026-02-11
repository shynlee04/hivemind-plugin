# Phase 7: Stress Test Survivor — Master Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to execute tasks.

**Goal:** Fix all audit defects, then design and implement a "stress test survivor" system including an "I am retard — lead me" governance mode that makes HiveMind resilient to chaotic, contradictory, high-pressure agent usage.

**Architecture:** Three sequential phases with hierarchy gates between each. Phase 1 cleans the house. Phase 2 designs the stress system. Phase 3 implements it.

**Tech Stack:** TypeScript, Node.js test runner, OpenCode Plugin SDK

---

## Trajectory: Phase 7 — Stress Test Survivor

### Phase 7.1: Audit Defect Cleanup

**Tactic:** Fix all 7 issues found in full-tree audit before any new feature work.

| Task | Severity | What |
|------|----------|------|
| 7.1.1 | HIGH | Add `mems.ts` to `src/lib/index.ts` barrel export |
| 7.1.2 | HIGH | Fix `skills/session-lifecycle/SKILL.md` — replace `.opencode/planning/` with `.hivemind/` paths |
| 7.1.3 | MEDIUM | Fix `example-opencode.json` — remove JS comment, make valid JSON |
| 7.1.4 | MEDIUM | Delete `.plan/` directory (deprecated) |
| 7.1.5 | LOW | Delete `.qoder/agents/` and `.qoder/skills/` empty directories |
| 7.1.6 | LOW | Add `skills/` to `.npmignore` so stale skill doesn't ship |
| 7.1.7 | LOW | Add `.qoder/` and `.plan/` to `.npmignore` |

**Gate:** `npm test` passes, `npm run typecheck` passes, `git status` clean after commit.

---

### Phase 7.2: Stress Test Architecture Design

**Tactic:** Design document for the full stress test + "I am retard" mode. NO code — just the design, validated through brainstorming.

**Deliverable:** `docs/plans/2026-02-11-stress-test-design.md`

**Design must answer:**

1. **CLI Init expansion** — What new options? What languages? What "automation" levels?
   - Current: `--mode` (permissive/assisted/strict), `--lang` (en/vi)
   - Proposed: `--mode` adds "retard", `--automation` (manual/guided/full/retard), `--lang` expanded
   
2. **Fail-safe mechanisms** — How does state survive 10+ compactions?
   - Anchors already survive compaction
   - What new fail-safes? Checksum? Git hash pinning? Redundant state?
   
3. **Evidence-based argumentation** — How does the system "argue back"?
   - What triggers pushback?
   - What constitutes "evidence"? (git hash + timestamp + hierarchy snapshot)
   - How is this injected into system prompt?
   
4. **Relationship integrity** — When hierarchy breaks, what alerts fire?
   - Current: chain-analysis detects breaks
   - What's missing? Cross-reference validation? Serial numbering?
   
5. **Anti-happy-path enforcement** — The skill/hook that forces "WHY NOT?"
   - Where does this live? Hook? Skill? System prompt section?
   - How does it detect "You are right" / sycophancy patterns?
   
6. **Session traceability** — "At which point in time, what session, what plan..."
   - Current: anchors, mems, archives
   - What's missing? Timeline query tool? Git-hash-linked evidence?
   
7. **Stress test scenarios** — The actual test suite
   - Greenfield vs brownfield
   - Small/medium/large projects
   - Debug/implement/refactor workflows
   - Mind-changing user sequences
   - 10+ compaction survival
   - "I want all features" scope explosion

**Gate:** Design document written, reviewed, committed.

---

### Phase 7.3: Stress Test Implementation

**Tactic:** Implement the design from 7.2 in sub-phases.

This phase is NOT planned yet — it depends entirely on what 7.2 produces. Will be planned after 7.2 design is validated.

**Expected sub-phases (tentative):**
- 7.3.1: CLI init expansion + config schema changes
- 7.3.2: Fail-safe + evidence tracing mechanisms
- 7.3.3: Anti-happy-path skill/hook
- 7.3.4: Stress test suite
- 7.3.5: Integration validation

**Gate:** All tests pass including new stress tests. `npm run typecheck` clean.

---

## Execution Protocol

1. **Phase 7.1** → Subagent-driven, single implementer for all 7 fixes (they're trivial)
2. **Phase 7.2** → Brainstorming in main conversation (requires user input on design decisions)  
3. **Phase 7.3** → Subagent-driven, one task per subagent with review cycles

## Success Criteria

- All 82+ files traced and accounted for
- Zero stale references in shipped files
- Stress test can take a "100% passing" codebase and expose gaps
- "Retard mode" survives 10+ compactions with evidence chain intact
- One bash command can always tell the truth about system state
