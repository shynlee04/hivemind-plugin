# Retrospective & Continuation Notes — 2026-04-04

**Session:** Post-Phase-1 recovery after rogue agent incident
**Checkpoint:** `54d2300b` (Phase 1 Foundation Reset)
**Branch:** `harness-experiment` worktree

---

## 1. Archived Violated Scripts

### What Was Archived
42 scripts moved to `.skills-lab/refactoring-skills/.archive/scripts-2026-04-04/` preserving directory structure.

| Category | Count | Scripts |
|----------|-------|---------|
| meta-builder | 5 | preflight.sh, register-skill.sh, route-check.sh, stack-validate.sh, verify-hierarchy.sh |
| user-intent-interactive-loop | 5 | first-action.sh, intent-verify.sh, register-skill.sh, session-checkpoint.sh, verify-hierarchy.sh |
| planning-with-files | 5 | check-complete.sh, init-session.sh, register-skill.sh, session-catchup.py, verify-hierarchy.sh |
| coordinating-loop | 8 | check-gate.sh, coordination-check.sh, init-session.sh, loop-status.sh, register-skill.sh, run-ralph-loop.sh, validate-envelope.sh, verify-hierarchy.sh |
| use-authoring-skills | 12 | check-complete.sh, check-overlaps.sh, gate-enforce.sh, init-session.sh, register-skill.sh, validate-gate.sh, validate-skill.sh, verify-hierarchy.sh + 3 hooks |
| eval-harness | 4 | eval_runner.py, eval-runner.sh, iterate.sh, run-all.sh |
| hivemind-synthesis | 1 | hm-synthesis-validate.sh |
| use-hivemind-research | 2 | hm-research-validate.sh, score-confidence.sh |
| workspace (shared) | 1 | verify-hierarchy.sh |

### Why They're Violated
These scripts were written for a **skill-pack-only** scope. The harness is now a **full platform** with:
- Real CLI substrate (`bin/hivemind-tools.cjs` — already exists in main repo with 14+ commands)
- Runtime build-on-demand (not static bash gates)
- Plugin hooks (TypeScript, not bash)
- SDK-driven state management

### Replacement References
| Old Script | Replacement Path | Notes |
|------------|-----------------|-------|
| `preflight.sh` | `bin/hivemind-tools.cjs` → future `skill validate` | Intent routing moves to CLI |
| `intent-verify.sh` | Runtime prompt injection via plugin hooks | No standalone script needed |
| `check-complete.sh` | `bin/hivemind-tools.cjs state load` + SDK validation | State moves to CLI |
| `check-gate.sh` | Plugin `tool.execute.before` hook | Gates become hooks |
| `validate-envelope.sh` | Plugin hook + SDK validation | Envelope = plugin context |
| `run-ralph-loop.sh` | Runtime composition engine (Phase 3) | Loop is runtime, not script |
| `eval-runner.sh` / `eval_runner.py` | `bin/hivemind-tools.cjs` → future `eval run` | Eval moves to CLI |
| `verify-hierarchy.sh` (×6 copies) | `bin/hivemind-tools.cjs validate chain` | Hierarchy validation in CLI |
| `register-skill.sh` (×5 copies) | Plugin auto-discovery | No manual registration needed |
| `session-catchup.py` | `bin/hivemind-tools.cjs state load` | State recovery via CLI |
| `first-action.sh` | Runtime skill loading order | Handled by harness engine |
| Hooks (pre/post/stop) | OpenCode plugin hooks (`tool.execute.before/after`, `event`) | Native plugin system |

---

## 2. Valid Practices Extracted

### From PRD-01 (docs/02_PRD/PRD-01_meta-builder-ecosystem/)
**KEEP — Feature Matrix (F01-F22):**
- F01-F16: Specialist authoring skills (agent, command, permission, skill, tool, hook, plugin, config, rule, MCP, LSP, migration, boundary, stacking, eval, TypeScript)
- F17: CLI Substrate — bin/hivemind-tools.cjs + bin/lib/ domain modules
- F18: Runtime Composition Engine — build-on-demand
- F19: Background Agent Execution
- F20: Category System
- F21: Session Recovery
- F22: Dual Packaging

**KEEP — User Personas:**
- Platform Engineer (primary), Skill Author, DevOps Engineer, Team Lead, New User

**KEEP — Success Metrics:**
- Skill trigger accuracy >95%, routing correctness 100%, chain success >90%, CLI coverage 100%, eval pass rate >95%, composition latency <500ms p95

**KEEP — Constraints:**
- Module LOC ≤500, plugin entry <100 LOC, skills per stack ≤3, SKILL.md ≤500 lines

### From Meta-Builder Plans (.hivefiver-meta-builder/plans/)
**KEEP — Runtime Control Layer:**
- Session management (resume, fork, undo/redo)
- Turn-based execution with profile pruning
- Runtime variables (commands, prompts, rules, permissions, agents, subagents, skills)
- Two session types: main-facing and isolated subagent

**KEEP — Soft Concepts Stack:**
- Commands, prompts/workflows, rules, permissions, agents vs subagents, skills
- Configuration locations: opencode.json, settings.json, .opencode/*.md, ~/.config/opencode/*.json

**KEEP — Skill Group Architecture:**
- GROUP 1: user-intent-interactive-loop, coordinating-loop, planning-with-files, tech-to-feature-synthesis, deep-investigation/research-loop, TDD/spec-driven
- GROUP 2: use-authoring-skill (core domain skill bridging to all others)

**KEEP — Hivefiver Orchestrator Pattern:**
- Phase breakdown → complete cycle → self-test → user validation → iterate → atomic commits
- Command chaining with conditional progression (next batch only when current passes)
- Natural language intent detection + progressive concept stacking

**KEEP — Skill Authoring Cycle:**
- Create → Audit → Evaluate → Doctor
- Domain-pattern support, bundles, cross-linkages, edge-case focus

### From Main Repo Architecture (discovered during this session)
**HiveMind's REAL architecture (NOT GSD copy):**
- `bin/hivemind-tools.cjs` — Already exists! 1400+ lines, 14+ commands (trace-paths, verify-install, migrate-check, inspect, validate, ecosystem-check, source-audit, filetree, state, session, config)
- `src/` — 23 subdirs: tools/, hooks/, lib/, schemas/, cli/, context/, control-plane/, delegation/, governance/, intelligence/, plugin/, recovery/, schema-kernel/, sdk-supervisor/, shared/, tui/, dashboard-v2/, features/, archive/, commands/, core/
- `modules/registry.yaml` — 8 agents (hiveminder, hivefiver, hivemaker, hivehealer, hivexplorer, hiveq, hiverd, hiveplanner) + 5 skills
- `conductor/` — Product definition, tech stack, workflow, tracks
- Dual-plane architecture: control plane (CLI/SDK) + execution plane (plugin hooks)

**This means:** The CLI substrate (Phase 2) is NOT starting from scratch. `bin/hivemind-tools.cjs` already exists with substantial functionality. Phase 2 is about **extending** it, not creating it.

---

## 3. Deleted PRD-02 Recovery Note

The PRD-02 I wrote (`docs/02_PRD/PRD-02_cli-substrate/prd-02-cli-substrate-2026-04-04.md`) was **GSD-copied** — wrong architecture, wrong module names, wrong approach. It was correctly deleted.

**Valuable elements to preserve for the real PRD-02:**
- User stories format (US-2.01 through US-2.08) — good structure, adapt to real HiveMind
- Functional/non-functional requirement separation — good pattern
- Acceptance criteria checklist format — good pattern
- Out of scope section — good pattern

---

## 4. Continuation Notes — What's Next

### In-Progress: Meta-Builder Plans
- `.hivefiver-meta-builder/plans/skills-to-build-meta.md` — 186 lines, defines GROUP 1 and GROUP 2 skills
- `.hivefiver-meta-builder/plans/the-meta-builder.md` — 15 lines, defines the Hivefiver orchestrator role
- These are **still in progress** and should NOT be overwritten

### Remaining Work (from user's exact orders):

**Phase 3: Runtime Harness Synthesis & Implementation**
- On-Demand Runtime Construction (agents call agents, dynamic prompts, background execution)
- Full Autonomy Features (auto-loop, delegation chain, task persistence, task queuing)
- Deep Synthesis & Reflection (analyze failed attempts, extract valid patterns)
- Implementation approach: review harness-experiment against runtime principles, identify gaps, synthesize OMO features, validate plugin layer <100 LOC

**Phase 4: Master Planning & Checkpoint Completion**
- Comprehensive master plan with file tracking
- Document synthesis learnings
- Validate runtime harness implementation
- Prepare clean harness-experiment as migration source (NOT product-detox)
- Commit checkpoint with detailed report

### Key Correction from This Session
**DO NOT copy GSD architecture.** HiveMind has its own architecture:
- `bin/hivemind-tools.cjs` already exists (1400+ lines, 14+ commands)
- `src/` has 23 subdirs with real TypeScript code
- `modules/registry.yaml` defines 8 agents + 5 skills
- Dual-plane: control plane (CLI/SDK) + execution plane (plugin hooks)
- The harness-experiment worktree is for **experimenting** with the V3 platform harness, NOT copying GSD

### Files to Write Next (on user approval):
1. PRD-02 (CLI Substrate) — based on REAL HiveMind architecture, not GSD
2. PRD-03 (Runtime Harness Synthesis) — Phase 3 requirements
3. Phase breakdown plan — referencing archived materials, NOT bringing them forward
4. Update planning triplet (task_plan.md, findings.md, progress.md)

---

## 5. Rogue Agent Incident Summary

| Item | Status |
|------|--------|
| Rogue agent deleted .kilo/skills/ and .opencode/ files | User reverted via `git reset --hard 54d2300b` |
| Rogue work preserved | Branch `rogue-agent-backup` |
| Root cause | Misread AGENTS.md "no static .md" as permission to nuke user dirs |
| Correction | AGENTS.md bans static .md as dev direction; SKILLS (.md) ARE valid; .opencode/ and .kilo/ are sacred user space |
| 42 scripts archived | `.skills-lab/refactoring-skills/.archive/scripts-2026-04-04/` |
| Planning triplet updated | task_plan.md, findings.md, progress.md |
