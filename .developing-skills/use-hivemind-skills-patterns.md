---
name: use-hivemind-skills-patterns
description: |
  Master index for the use-hivemind-* delegation skill family. Use when: determining which delegation skills to load, resolving load priority conflicts, understanding dependency order between delegation skills, or routing delegation work to the correct domain skill. Governs the 6-skill delegation ecosystem.
---

# use-hivemind-* Skill Family — Master Index

Load priority, dependency graph, and routing rules for the use-hivemind-* delegation ecosystem.

## Skill Registry

| Skill | Trigger Summary | Load Priority |
|-------|----------------|---------------|
| `use-hivemind-delegation` | Universal delegation mechanics — decision rules, packets, role boundaries, failure recovery | 1 (always first) |
| `hivemind-gatekeeping-delegation` | Iterative loops, synthesis gates, carry-forward compression, cascading failure | 2 (when loops or multi-pass) |
| `tdd-delegation` | TDD loop delegation, test gates, build-verify cycles | 3 (when TDD work) |
| `course-correction-delegation` | Debug/refactor/audit delegation, course correction patterns | 3 (when course correction) |
| `research-delegation` | Evidence collection, source validation, multi-source synthesis | 3 (when research) |

## Dependency Graph

```
use-hivemind-delegation (CORE — always loaded)
├── hivemind-gatekeeping-delegation (extends core with loops)
├── tdd-delegation (extends core with TDD pattern)
├── course-correction-delegation (extends core with domain patterns)
└── research-delegation (extends core with research pattern)
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
