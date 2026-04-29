---
phase: AS-5
workstream: agent-synthesis
status: NOT STARTED
depends_on:
  - AS-4
blocks:
  - AS-8
created: 2026-04-29
---

# AS-5: L2 hm-* Specialist Agent Authoring (Batch 2: 17 Agents) — Context

## Phase Goal
Create the second batch of 17 hm-* L2 specialist agents organized by domain cluster. These complete the hm-* specialist system, replacing the remaining 16 GSD specialists with Hivemind-native agents. Domain clusters: Domain (4), Documentation (4), Phase Lifecycle (3), Audit (4), Intelligence (3), Debug (2). Note: Adjusted count factors in overlap with batch 1.

## Starting State
- AS-4 completed: 17 hm-* L2 agents exist across Research, Planning, Implementation, Quality clusters
- 16 remaining GSD specialist agents are candidates for replacement (total: 33 GSD, 17 replaced in AS-4 = 16 remain)
- AS-2 schema and AS-3 patterns are established and proven through batch 1
- Relevant hm-* skills exist for most domains (some skills may still be in skill-ecosystem phases)

## Deliverables — 17 Agents Across 6 Clusters

### Domain Cluster (4 agents)
1. **`hm-domain-researcher.md`** — Business domain and real-world context research. Skills: hm-deep-research. Tools: Read, Tavily, Brave, WebFetch.
2. **`hm-product-validator.md`** — Product-lens validation (RICE scoring, user impact). Skills: hm-product-validation. Tools: Read, Write.
3. **`hm-roadmap-maintainer.md`** — Product roadmap planning with maintainability scoring. Skills: hm-roadmap-maintainability. Tools: Read, Write.
4. **`hm-tech-context-checker.md`** — Tech stack compatibility validation. Skills: hm-tech-context-compliance. Tools: Read, Glob, Grep, Context7.

### Documentation Cluster (4 agents)
5. **`hm-doc-writer.md`** — Project documentation authoring verified against codebase. Skills: (doc-authoring patterns). Tools: Read, Write, Glob, Grep.
6. **`hm-doc-verifier.md`** — Factual claim verification in docs against live codebase. Skills: (verification patterns). Tools: Read, Glob, Grep, Bash.
7. **`hm-doc-classifier.md`** — Classify planning documents (ADR/PRD/SPEC/DOC). Skills: (classification patterns). Tools: Read, Glob.
8. **`hm-doc-synthesizer.md`** — Synthesize classified docs into consolidated context. Skills: hm-synthesis. Tools: Read, Write.

### Phase Lifecycle Cluster (3 agents)
9. **`hm-phase-executor.md`** — Executes GSD-style phase plans with wave-based parallelization. Skills: hm-phase-execution, hm-phase-loop. Tools: Read, Write, Bash, delegate-task.
10. **`hm-phase-loop-manager.md`** — Iterative phase loop with entry/exit gates (L1, may overlap with AS-3). Skills: hm-phase-loop, hm-completion-looping. Tools: Read, Write, delegate-task, delegation-status.
11. **`hm-planning-persister.md`** — Cross-session state persistence via .hivemind/state/planning/. Skills: hm-planning-persistence. Tools: Read, Write.

### Audit Cluster (4 agents)
12. **`hm-milestone-auditor.md`** — Audit milestone completion against original intent. Skills: hm-production-readiness, gate-spec-compliance. Tools: Read, Glob, Grep.
13. **`hm-eval-auditor.md`** — Audit AI phase evaluation coverage. Skills: gate-evidence-truth. Tools: Read, Glob, Grep.
14. **`hm-nyquist-auditor.md`** — Fill Nyquist validation gaps with generated tests. Skills: hm-test-driven-execution. Tools: Read, Write, Bash.
15. **`hm-ui-auditor.md`** — 6-pillar visual audit of frontend code. Skills: (UI audit patterns). Tools: Read, Glob, Grep, (browser snapshot).

### Intelligence Cluster (3 agents)
16. **`hm-codebase-mapper.md`** — Parallel mapper agents producing .planning/codebase/ documents. Skills: hm-detective, hm-synthesis. Tools: Read, Glob, Grep, Repomix.
17. **`hm-pattern-mapper.md`** — Map new files to closest existing patterns. Skills: hm-detective. Tools: Read, Glob, Grep.
18. **`hm-intel-updater.md`** — Write structured intel files to .planning/intel/. Skills: hm-synthesis. Tools: Read, Write, Glob.

### Debug Cluster (2 agents) — Adjusted count
19. **`hm-debugger.md`** — Systematic debugging with hypothesis testing. Skills: hm-debug. Tools: Read, Glob, Grep, Bash.
20. **`hm-debug-session-manager.md`** — Multi-cycle debug checkpoint and continuation. Skills: hm-debug, hm-planning-persistence. Tools: Read, Write, Bash, delegate-task.

**Note:** Actual count may adjust to ~17 based on AS-4 overlap resolution (e.g., hm-feature-ecosystem-designer may be in batch 1 or 2, hm-phase-loop-manager may be L1 from AS-3).

## Acceptance Criteria
- [ ] ~17 agent files created with full XML-tagged bodies per AS-1 body format standard
- [ ] All agents follow AS-2 schema for YAML frontmatter
- [ ] No duplicate agents between AS-4 and AS-5 (cross-reference check)
- [ ] All hm-* agents from both batches (34 total) pass schema validation
- [ ] Debug cluster integrates with session continuity system (.hivemind/state/)
- [ ] Audit cluster agents reference gate-* skills correctly (gate-spec-compliance, gate-evidence-truth)
- [ ] Phase lifecycle agents declare delegation capabilities (L1 can delegate, L2 cannot)
- [ ] All 34 hm-* agents collectively cover all 11 domain categories

## Known Risks
- Batch 2 quality may suffer from batch fatigue — need to maintain same rigor as AS-4
- hm-phase-loop-manager may overlap with AS-3 if it was already created as L1 — need dedup check
- Audit cluster agents depend on gate-* skills which are internal-only (D-02) — must not ship to end users
- Intelligence cluster agents (codebase-mapper, pattern-mapper) need Repomix which may not be available in all environments
- Domain cluster agents need MCP tools that vary by deployment — must document required vs optional

## Skills/Agents Involved
- **Creates:** ~17 L2 hm-* agent files
- **Cross-references:** AS-4 agents (batch 1) for deduplication
- **Output feeds:** AS-8 (body enrichment for all 34 hm-* agents)
