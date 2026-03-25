---
name: use-hivemind-skills-patterns
description: |
  Master index for the use-hivemind-* delegation skill family. Use when: determining which delegation skills to load, resolving load priority conflicts, understanding dependency order between delegation skills, or routing delegation work to the correct domain skill. Governs the 30+ skill ecosystem.
---

# use-hivemind-* Skill Family — Master Index

Load priority, dependency graph, and routing rules for the use-hivemind-* delegation ecosystem.

## Skill Registry

| Skill | Trigger Summary | Load Priority |
|-------|----------------|---------------|
| `use-hivemind` | Master session entry — lineage detection, context gate, routing | 0 (always first) |
| `use-hivemind-delegation` | Universal delegation mechanics — decision rules, packets, role boundaries, failure recovery | 1 (entry router) |
| `use-hivemind-git-memory` | Entry for git memory operations — routes to continuity, commit, enforce, retrace | 1 (entry router) |
| `use-hivemind-research` | Entry for research work — routes to framework and tools | 1 (entry router) |
| `hivemind-gatekeeping-delegation` | Iterative loops, synthesis gates, carry-forward compression, cascading failure | 2 (when loops or multi-pass) |
| `tdd-delegation` | TDD loop delegation, test gates, build-verify cycles | 3 (when TDD work) |
| `course-correction-delegation` | Debug/refactor/audit delegation, course correction patterns | 3 (when course correction) |
| `research-delegation` | Evidence collection, source validation, multi-source synthesis | 3 (when research) |
| `plan-engineering` | Plan lifecycle: validation → decomposition → tracking → retraceability | 3 (when planning) |
| `plan-breakdown` | Task decomposition methodology — authority, concern, file-cluster steps | 3 (when decomposing) |
| `tdd-phase-execution` | Phase-granular TDD — per-phase red-green-refactor with transition gates | 3 (when phase TDD) |
| `test-gatekeeping-flow` | Test-first enforcement methodology — 5 gates from RED to completion | 3 (when test gating) |
| `hierarchy-retrace` | Decision tree traversal and retraceability — epic to commit chain | 3 (when auditing) |
| `git-memory-enforce` | Memory-first commit discipline — commits carry decision context | 3 (when committing) |
| `skill-universal-design` | Universal skill design — platform-agnostic patterns | 3 (when designing skills) |
| `skill-conflict-detect` | Skill conflict detection — overlap, contradiction, boundary violations | 3 (when auditing skills) |
| `agent-role-boundary` | Diamond role separation — 6 roles, permission matrix | 3 (depth) |

## Dependency Graph

```
use-hivemind (SESSION ENTRY — always loaded first)
├── use-hivemind-delegation (entry router for delegation)
│   ├── hivemind-gatekeeping-delegation (loop control)
│   ├── tdd-delegation (TDD pattern)
│   │   ├── tdd-phase-execution (phase granularity)
│   │   └── test-gatekeeping-flow (test enforcement)
│   ├── course-correction-delegation (debug/refactor)
│   ├── research-delegation (evidence collection)
│   ├── plan-engineering (plan lifecycle)
│   │   └── plan-breakdown (decomposition)
│   ├── hierarchy-retrace (decision indexing)
│   ├── git-memory-enforce (memory discipline)
│   ├── skill-universal-design (universal patterns)
│   │   └── skill-conflict-detect (conflict detection)
│   └── agent-role-boundary (role enforcement)
├── use-hivemind-git-memory (entry for git memory)
│   ├── git-continuity-memory (continuity)
│   ├── hivemind-atomic-commit (commit discipline)
│   ├── git-memory-enforce (enforcement)
│   └── hierarchy-retrace (indexing)
├── use-hivemind-research (entry for research)
│   ├── hivemind-research-framework (methodology)
│   └── hivemind-research-tools (MCP protocols)
├── use-hivemind-skill-writer (entry for skill authoring)
│   ├── hivemind-skill-write (creation)
│   └── hivemind-skill-doctor (auditing)
└── use-hivemind-detox-refactor (entry for multi-stage refactor)
    ├── hivemind-codemap (scanning)
    ├── hivemind-system-debug (debugging)
    └── spec-distillation (requirements)
```

Domain skills are independent of each other. All depend only on core. Gatekeeping can compose with any domain skill.

## Load Priority Matrix

| Scenario | Load Order |
|----------|-----------|
| Simple delegation (single pass) | `use-hivemind-delegation` only |
| Iterative delegation (multi-pass) | `use-hivemind-delegation` → `hivemind-gatekeeping-delegation` |
| TDD work | `use-hivemind-delegation` → `tdd-delegation` |
| Debug work | `use-hivemind-delegation` → `course-correction-delegation` |
| Refactor work | `use-hivemind-delegation` → `course-correction-delegation` |
| Architecture audit | `use-hivemind-delegation` → `course-correction-delegation` |
| Research work | `use-hivemind-delegation` → `research-delegation` |
| TDD + iterative | `use-hivemind-delegation` → `hivemind-gatekeeping-delegation` → `tdd-delegation` |
| Debug + iterative | `use-hivemind-delegation` → `hivemind-gatekeeping-delegation` → `course-correction-delegation` |
| Research + iterative | `use-hivemind-delegation` → `hivemind-gatekeeping-delegation` → `research-delegation` |
| Plan creation | `use-hivemind-delegation` → `plan-engineering` |
| Plan with decomposition | `use-hivemind-delegation` → `plan-engineering` → `plan-breakdown` |
| Phase TDD | `use-hivemind-delegation` → `tdd-delegation` → `tdd-phase-execution` |
| Test gating | `use-hivemind-delegation` → `tdd-delegation` → `test-gatekeeping-flow` |
| Decision audit | `use-hivemind-delegation` → `hierarchy-retrace` |
| Memory commits | `use-hivemind-delegation` → `git-memory-enforce` |
| Skill authoring | `use-hivemind-delegation` → `skill-universal-design` → `skill-conflict-detect` |
| Full TDD + planning | `use-hivemind-delegation` → `hivemind-gatekeeping-delegation` → `plan-engineering` → `tdd-phase-execution` |

## Load-3 Constraint

At any entry point, exactly 3 skills load:
- Slot 1: Entry router (`use-hivemind-*` or `use-hivemind`)
- Slot 2: Domain skill (loop control, TDD, debug, etc.)
- Slot 3: Depth skill (specialist methodology)

No exceptions. Loading >3 skills causes context bloat and routing errors.

## Routing Rules

1. **IF A SKILL APPLIES TO YOUR TASK, YOU MUST USE IT.** No choosing to skip.
2. **Instruction priority:** User instructions > Skills > Default system prompt
3. **Process skills first** (delegation, gatekeeping), then domain skills (TDD, course-correction, research)
4. **Load core always.** `use-hivemind-delegation` is required for any delegation work.

## Skill Flow

```
User request → Delegation needed?
  NO → Execute inline
  YES ↓
Load use-hivemind-delegation (always)
  ↓
Multi-pass/iterative? → Load hivemind-gatekeeping-delegation
  ↓
Domain?
    TDD → Load tdd-delegation
    Debug/Refactor/Audit → Load course-correction-delegation
    Research → Load research-delegation
    None → Core only
```

## Cross-Skill Contracts

- All skills share the same **Shared Return Contract** from `use-hivemind-delegation`
- Domain skills **EXTEND** the return contract (add fields), never replace it
- All skills use the same `delegation-packet.md` base template
- Domain skills add domain-specific fields to the packet

## Edge Cases

| Situation | Action |
|-----------|--------|
| Multiple domain skills needed | Load core + gatekeeping + all needed domain skills |
| Unsure which domain skill | Load core only, use `mode: research` for initial exploration |
| Domain skill loaded but not needed | No harm — extra context, unused sections ignored |
| Gatekeeping + domain both needed | Load core → gatekeeping → domain (3 skills) |

## Sibling Skills (Not Delegation)

These skills are referenced by delegation skills but are NOT part of the delegation family:

| Skill | Referenced By | Purpose |
|-------|--------------|---------|
| `hivemind-codemap` | `use-hivemind-delegation` (codescan) | Codebase scanning mechanics |
| `hivemind-system-debug` | `course-correction-delegation` (debug) | Debug mechanics |
| `hivemind-research-framework` | `research-delegation` | Research methodology |
| `hivemind-research-tools` | `research-delegation` | MCP tool protocols |
| `use-hivemind-detox-refactor` | `course-correction-delegation` (refactor) | Refactor stages |
| `spec-distillation` | `use-hivemind-delegation` (planning) | Requirements extraction |
| `context-intelligence-entry` | `use-hivemind-delegation` (stale session) | Session state probe |
| `git-continuity-memory` | `use-hivemind-delegation` (resume) | Git-aware continuity |
| `plan-engineering` | `use-hivemind-delegation` (planning) | Plan lifecycle management |
| `plan-breakdown` | `plan-engineering` (decomposition) | Task decomposition methodology |
| `tdd-phase-execution` | `tdd-delegation` (phase TDD) | Phase-granular TDD enforcement |
| `test-gatekeeping-flow` | `tdd-delegation` (test gates) | Test-first enforcement methodology |
| `hierarchy-retrace` | `git-continuity-memory` (indexing) | Decision tree traversal |
| `git-memory-enforce` | `hivemind-atomic-commit` (memory) | Memory-first commit discipline |
| `skill-universal-design` | `hivemind-skill-write` (design) | Universal skill patterns |
| `skill-conflict-detect` | `hivemind-skill-doctor` (detection) | Skill conflict detection |
