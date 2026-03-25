# Session Inspection Export

- ses_id: `ses_2dfa847b8ffejhW5bXE6x8d8ph`
- prepared_at: `2026-03-24T14:58:02.467Z`

## Assistant Output

Here is the complete investigation report.

---

## Codebase Investigation Report

**Scope:** Hivemind skill ecosystem — directory structure, batch planning, installed skills, taxonomy docs, handoff patterns, and batch-3 references.

---

### 1. `.developing-skills/refactored-skills/` — Full Directory Listing

**Path:** `/Users/apple/hivemind-plugin/.worktrees/product-detox/.developing-skills/refactored-skills/`

| Type | Name | Notes |
|------|------|-------|
| **dir** | `agent-role-boundary/` | Diamond role separation |
| **dir** | `context-entry-verify/` | Deterministic project state verification |
| **dir** | `context-intelligence-entry/` | Session context-health probe |
| **dir** | `course-correction-delegation/` | Debug/refactor/audit delegation |
| **dir** | `git-continuity-memory/` | Git continuity and memory |
| **dir** | `git-memory-enforce/` | Memory-first commit discipline |
| **dir** | `hierarchy-retrace/` | Decision tree traversal |
| **dir** | `hivemind-atomic-commit/` | Git integration and file CRUD |
| **dir** | `hivemind-codemap/` | Whole-codebase structural mapping |
| **dir** | `hivemind-gatekeeping-delegation/` | Iterative loop control |
| **dir** | `hivemind-research-framework/` | Research methodology |
| **dir** | `hivemind-research-tools/` | MCP tool protocols |
| **dir** | `hivemind-skill-doctor/` | Skill auditing |
| **dir** | `hivemind-skill-write/` | Skill creation |
| **dir** | `hivemind-system-debug/` | Failure reproduction and debugging |
| **dir** | `plan-breakdown/` | Task decomposition |
| **dir** | `plan-engineering/` | Plan lifecycle management |
| **dir** | `research-delegation/` | Evidence collection delegation |
| **dir** | `skill-conflict-detect/` | Skill overlap detection |
| **dir** | `skill-universal-design/` | Cross-platform skill patterns |
| **dir** | `spec-distillation/` | Requirements extraction |
| **dir** | `tdd-delegation/` | TDD loop delegation |
| **dir** | `tdd-phase-execution/` | Phase-granular TDD |
| **dir** | `test-gatekeeping-flow/` | Test-first enforcement |
| **dir** | `use-hivemind/` | Session entry router |
| **dir** | `use-hivemind-delegation/` | Core delegation mechanics |
| **dir** | `use-hivemind-detox-refactor/` | 11-stage detox router |
| **dir** | `use-hivemind-git-memory/` | Git memory entry router |
| **dir** | `use-hivemind-research/` | Research entry router |
| **dir** | `use-hivemind-skill-writer/` | Skill authoring entry |
| **file** | `AGENTS.md` | Operational rules |
| **file** | `README.md` | Refactored skills overview |
| **file** | `batch-context-integrity.md` | Batch definition: 6 context skills |
| **file** | `batch-hivemind-context.md` | Batch definition: 10 delegation/orchestration skills |
| **file** | `batch-skill-judge.md` | Batch definition: 5 TDD/judgment skills |
| **file** | `batch-skill-review.md` | Batch definition: 6 git memory/review skills |
| **file** | `batch-writing-skill.md` | Batch definition: 5 planning/design skills |
| **file** | `use-cases-audit.md` | Use cases audit |

**Total: 30 skill directories + 7 files (including 5 batch definition files)**

---

### 2. `use-hivemind` Skill (Installed)

**Path:** `.opencode/skills/use-hivemind/SKILL.md`

- **File size:** 7,971 bytes
- **Role:** Master session entry point — lineage detection (hivefiver vs hiveminder), context health gate, and routing to specialist skills
- **Key mechanism:** Detects platform, checks context health, identifies lineage, routes to either `hivemind-skill-write` (framework) or domain skills (project)
- **35 activation triggers** covering session start, framework reference, platform detection, skill routing, and explicit activation
- **Stack budget:** Max 3 active skills at any time
- **Terminal state:** Lineage identified, specialist skill loaded, context healthy

---

### 3. Batch-3 Planning Artifacts

**Finding:** No formal batch-3 planning documents exist in `.developing-skills/` or `.hivemind/plans/`. However, a batch-3 **intent** was recorded in session inspection data:

**Path:** `.hivemind/session-inspection/ses_2e0b9d6d6ffeP1CMjaBmdTsLjU/assistant-output.md`

Key excerpt identifying 5 fundamental flaws that batch-3 should address:
1. `use-hivemind is wrong` — routing table vs HOW-TO-PROCESS gatekeeping
2. `No handoff observability` — no disk-stored references, templates, scripts
3. `Writing is mechanical` — not human-like adversarial
4. `No planning hierarchy` — no SOT → phase → atomic flow
5. `No cross-skill assessment` — skills exist in isolation

**Current batch definitions exist for batches 1-2:**
- `batch-context-integrity.md` — Context verification batch (6 skills)
- `batch-hivemind-context.md` — Delegation/orchestration batch (10 skills)
- `batch-skill-judge.md` — TDD/judgment batch (5 skills)
- `batch-skill-review.md` — Git memory/review batch (6 skills)
- `batch-writing-skill.md` — Planning/design batch (5 skills)

---

### 4. Consolidation Notes & Skill Taxonomy Docs

**Taxonomy files found:**

| File | Content |
|------|---------|
| `.developing-skills/refactored-skills/spec-distillation/references/ambiguity-taxonomy.md` | 4 categories: Scope, Delivery, Technical/Integration, Governance ambiguity types |
| `.developing-skills/refactored-skills/context-intelligence-entry/references/context-rot-taxonomy.md` | 5 severity levels (CLEAN→POISONED), 5 detection dimensions (Governance, Temporal, Delegation, Workflow, Platform), rot scoring formula, 4 recovery protocols |
| `.developing-skills/auditing-skills/root-skill-packages-2026-03-22/*/references/*.md` | Copies of the same taxonomies in the auditing archive |

**Master reference docs:**

| File | Summary |
|------|---------|
| `.developing-skills/use-hivemind-skills-patterns.md` (163 lines) | Master skill index — registry of 17 skills, full dependency tree, load priority matrix, load-3 constraint, routing rules, cross-skill contracts, sibling skills table |
| `.developing-skills/HIVEMIND-AGENT-ECOSYSTEM-MASTER.md` | Agent inventory (11 agents), interaction matrix, delegation loops (main impl loop, verification loop, research loop, debug loop), checkpoint definitions |
| `.developing-skills/auditing-skills/` | Historical audit artifacts dated 2026-03-21/22 — codemap scans, context maps, transfer indexes, emergence maps |

---

### 5. Installed Skills under `.opencode/skills/`

**Path:** `.opencode/skills/`

**30 skill directories installed:**

| Skill | Files |
|-------|-------|
| `agent-role-boundary` | SKILL.md, references/role-platform-mapping.md, templates/role-declaration.md |
| `context-entry-verify` | SKILL.md, references/*, scripts/hm-verify.cjs, tests/* |
| `context-intelligence-entry` | SKILL.md, references/* (6 files), schemas/output.schema.ts, scripts/context-harness-init.cjs, tests/* |
| `course-correction-delegation` | SKILL.md, references/* (4 files), templates/* (3 packets), tests/* |
| `git-continuity-memory` | SKILL.md, references/* (5 files), templates/* (3), tests/* |
| `hivemind-atomic-commit` | SKILL.md, references/* (5 files), scripts/* (3 scripts), templates/* (4), tests/* |
| `hivemind-codemap` | SKILL.md, references/* (6 files), scripts/hm-codescan.sh, templates/* (5), tests/* |
| `hivemind-gatekeeping-delegation` | SKILL.md, references/* (4 files), templates/* (2), tests/* (2) |
| `hivemind-research` | SKILL.md (standalone) |
| `hivemind-research-framework` | SKILL.md, references/* (3 files), scripts/score-confidence.sh, templates/* (2) |
| `hivemind-research-tools` | SKILL.md, references/* (5 files), scripts/check-mcp-readiness.mjs, templates/* |
| `hivemind-skill-doctor` | SKILL.md, references/* (4 files) |
| `hivemind-skill-write` | SKILL.md, references/* (4 files) |
| `hivemind-system-debug` | SKILL.md, references/debug-loop.md, tests/* |
| `research-delegation` | SKILL.md, references/* (3 files), templates/* (2), tests/* |
| `spec-distillation` | SKILL.md, references/ambiguity-taxonomy.md, scripts/extract-requirements.sh, templates/*, tests/* |
| `tdd-delegation` | SKILL.md, references/* (3 files), templates/* (2), tests/* |
| `use-hivemind` | SKILL.md |
| `use-hivemind-context-integrity` | SKILL.md, references/rot-taxonomy.md, schemas/health-result.schema.ts, scripts/health-check.cjs, templates/health-result.json |
| `use-hivemind-delegation` | SKILL.md, references/* (5 files), templates/* (3), tests/* (3), _artifacts/* (3 dated 2026-03-22) |
| `use-hivemind-detox-refactor` | SKILL.md, AGENTS.md, references/* (9 files), templates/* (8), tests/* |
| `use-hivemind-git-memory` | SKILL.md, references/intent-encoding.md, schemas/memory-result.schema.ts, scripts/* (2), templates/* |
| `use-hivemind-hierarchy` | SKILL.md, references/diamond-model.md, schemas/authority-envelope.schema.ts, scripts/role-validator.cjs, templates/* |
| `use-hivemind-skill-writer` | SKILL.md |

**Note:** Some skills in `refactored-skills/` (e.g., `plan-engineering`, `plan-breakdown`, `tdd-phase-execution`, `test-gatekeeping-flow`, `hierarchy-retrace`, `git-memory-enforce`, `skill-conflict-detect`, `skill-universal-design`, `agent-role-boundary`) do NOT appear in `.opencode/skills/` — they exist only in the refactored-skills staging area.

---

### 6. Handoff-Related Files with Disk-Path References

| File | Path References |
|------|-----------------|
| `.opencode/skills/use-hivemind-delegation/templates/handoff-brief.md` | References `src/tools/runtime/`, `tests/tools/runtime-tools.test.ts`, branch/worktree paths, delegation packet ID format |
| `.opencode/skills/use-hivemind-detox-refactor/templates/verification-handoff.md` | Generic template with `<restored slice>` placeholder — no hardcoded paths |
| `.developing-skills/auditing-skills/root-skill-packages-2026-03-22/use-hivemind-delegation/schemas/handoff-packet.schema.ts` | Schema definition for handoff packets |
| `.developing-skills/auditing-skills/root-skill-packages-2026-03-22/use-hivemind-delegation/scripts/handoff-packet-builder.cjs` | Script for building handoff packets |
| `.developing-skills/auditing-skills/root-skill-packages-2026-03-22/use-hivemind-delegation/templates/handoff-packet.json` | JSON template for handoff packets |
| `.developing-skills/refactored-skills/use-hivemind-delegation/templates/handoff-brief.md` | Duplicate of installed version |
| `.developing-skills/refactored-skills/use-hivemind-detox-refactor/templates/verification-handoff.md` | Duplicate of installed version |

**Disk-stored path convention:** The `handoff-brief.md` template uses `{project}/.hivemind/activity/` as the persistent store, with subdirectories: `handoff/`, `delegation/`, `hierarchy/`, `sessions/`, `codescan/`, `agents/`, `longhaul/`, `pathing/`, `state/`. The `pathing/active-paths.json` file is the deterministic path registry that all agents resolve output locations from.

---

### Summary of Gaps

1. **Batch-3 has no formal planning documents** — only a session-inspection artifact recording the intent to address 5 fundamental flaws
2. **7 skills from `refactored-skills/` are NOT installed** to `.opencode/skills/`: `plan-engineering`, `plan-breakdown`, `tdd-phase-execution`, `test-gatekeeping-flow`, `hierarchy-retrace`, `git-memory-enforce`, `skill-conflict-detect`, `skill-universal-design`
3. **No `.hivemind/plans/` directory exists** — the `.hivemind/` tree contains `activity/planning/` and `project/planning/` instead
4. **Handoff observability is minimal** — only 2 template files exist for handoff; the session inspection noted this as a fundamental gap