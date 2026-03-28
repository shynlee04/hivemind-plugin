# Session Inspection Export

- ses_id: `ses_2cf462dddffe4t57EXifEJjpMw`
- prepared_at: `2026-03-27T19:21:36.812Z`

## Assistant Output

I now have all the evidence needed. Let me compile the full investigation report.

---

## Codebase Investigation Report

**Scope:** Cross-check all enhanced skills for consistency with orchestrator mandate
**Question:** Verify 8 consistency checks across 4 skill families

### Findings

#### Check 1: Cross-Reference Integrity — FAIL

| # | Finding | File | Line | Evidence |
|---|---------|------|------|----------|
| 1 | **`context-intelligence-entry` referenced as loadable skill** — this name exists only in `.archive/`, `_deprecated_hive/`, and `auditing-skills/`. Not a standalone skill in `refactored-skills/`. Consolidated into `use-hivemind-context`. | `use-hivemind/SKILL.md` | 231, 247, 329 | 3 references treat it as a standalone delegation target |
| 2 | Same stale reference | `use-hivemind/references/context-health-check.md` | 36, 98 | "Delegate a fresh `context-intelligence-entry` probe" |
| 3 | Same stale reference | `use-hivemind-delegation/SKILL.md` | 45, 92 | Listed in Sibling Skills table and orchestrator protection section |
| 4 | **`context-entry-verify` referenced as standalone skill** — also consolidated into `use-hivemind-context`, archived | `use-hivemind-context/SKILL.md` | 37-40, 80, 88, 241, 243 | 8 references to non-existent standalone skill |
| 5 | **`use-hivemind-context-integrity` alias in load template** — non-standard name used in comment | `use-hivemind/templates/load-template.md` | 87 | `Slot 2: use-hivemind-context (use-hivemind-context-integrity)` |
| 6 | **Dead references in artifacts** — `use-hivemind-detox-refactor`, `spec-distillation`, `git-continuity-memory` referenced as sibling skills | `use-hivemind-delegation/_artifacts/03-change-summary-2026-03-22.md` | 62 | These old names don't exist in `refactored-skills/` |
| 7 | **Test file references non-existent directory path** | `use-hivemind-context/tests/direct-invocation.md` | 5, 9 | Path `.developing-skills/refactored-skills/context-intelligence-entry/` does not exist |
| 8 | **`hivemind-system-debug` references non-existent file path** | `hivemind-system-debug/SKILL.md` | 39 | References `context-intelligence-entry/references/false-signal-detection.md` — file exists at `use-hivemind-context/references/false-signal-detection.md` instead |

**Root cause analysis:** `context-intelligence-entry` and `context-entry-verify` were pre-consolidation standalone skills. They were merged into `use-hivemind-context` but the consuming SKILL.md files still route to the old names. The `use-hivemind-context/SKILL.md` itself acknowledges consolidation (line 243) but its routing table (lines 34-40) and routing logic (lines 74, 80) still point to the old standalone names as if they exist separately.

#### Check 2: How-To-Process vs How-To-Implement — PASS

| File | Line | Section |
|------|------|---------|
| `use-hivemind/SKILL.md` | 47-58 | "The How-To-Process vs How-To-Implement Distinction" |
| `orchestrator-mandate.md` | 47-67 | "§4. How-To-Process vs How-To-Implement" |
| `orchestrator-delegation.md` | 91-99 | "§7. How-To-Process vs How-To-Implement" |
| `use-hivemind-delegation/SKILL.md` | 99-138 | "How-To-Process vs How-To-Implement in Packets" |

All four files use identical terminology. Correct/incorrect examples are consistent (same `authenticateUser` example across use-hivemind SKILL.md, orchestrator-mandate.md, orchestrator-delegation.md). The delegation SKILL.md uses a different correct example (`Investigate test failures in src/tools/trajectory/`) which is appropriate — different context, same principle.

#### Check 3: Multi-Wave Dispatch — PASS (minor discrepancy noted)

| File | Wave Structure |
|------|---------------|
| `use-hivemind/SKILL.md` (lines 82-113) | Wave 1 → Wave 2 → Checkpoint → Wave 3 → Wave 4 |
| `orchestrator-mandate.md` (lines 75-86) | Wave 1 → Wave 2 → Checkpoint → Wave 3 → Wave 4 |
| `multi-wave-dispatch.md` (lines 14-35) | Wave 1 → Wave 2 → Checkpoint → Wave 3 → Wave 4 |
| `orchestrator-delegation.md` (lines 53-61) | References `multi-wave-dispatch.md` for details |

**5 wave rules** are identical across all four files:
1. Wave 1 always starts with investigation ✓
2. Compressed carry-forward only (≤5 items) ✓
3. Waves are sequential ✓
4. Gates between waves ✓
5. Carry-forward ≤5 items ✓

**Minor note:** `multi-wave-dispatch.md` Dynamic Skill Assignment table (lines 123-129) shows Slot 2 as `use-hivemind-delegation` for all waves including Checkpoint, while `load-template.md` shows Checkpoint with `use-hivemind-planning` as Slot 2. This is a minor inconsistency — the delegation reference implies the orchestrator always uses delegation, while the load template shows the domain router changes per phase. Both are defensible interpretations, but they should be reconciled.

#### Check 4: Carry-Forward ≤5 Items — PASS

| File | Line | Statement |
|------|------|-----------|
| `use-hivemind/SKILL.md` | 121 | "Carry-forward is ≤5 items" |
| `orchestrator-mandate.md` | 92, 95, 134 | "≤5 findings, blocked routes, recommended next action, output paths" (3 occurrences) |
| `orchestrator-delegation.md` | 58, 61, 108 | "≤5 findings" (3 occurrences) |
| `multi-wave-dispatch.md` | 18, 22, 72-73, 103 | "≤5 items" (4 occurrences) |
| `hivemind-gatekeeping/SKILL.md` | 42, 50 | "≤5 items max" (2 occurrences) |
| `use-hivemind-delegation/SKILL.md` | 90, 249, 280 | "≤5 findings" (3 occurrences) |
| `use-hivemind-context/SKILL.md` | 180, 235 | "≤5 items" (2 occurrences) |

The constraint is stated consistently everywhere: "≤5 items" consisting of key findings, blocked routes, recommended next action, and output paths.

#### Check 5: HARD-GATE Blocks — PASS

| File | Count | Usage |
|------|-------|-------|
| `orchestrator-mandate.md` | 3 pairs | Reading >2 files, wave rules (5 rules in one gate), investigation self-check |
| `multi-wave-dispatch.md` | 5 pairs | One per wave rule (Rules 1-5) |
| `hivemind-gatekeeping/SKILL.md` | 3 pairs | Evidence-based gatekeeping, file-level gates, scope violations |
| `use-hivemind-delegation/SKILL.md` | 1 pair | Orchestrator deep-work prohibition |
| `use-hivemind-context/SKILL.md` | 3 pairs | Cross-team probes, code-over-docs, continuity checkpoints |

HARD-GATE is used consistently for non-negotiable rules across all files. All tags are properly opened and closed.

#### Check 6: Activity Paths — PASS

All activity folder references use domain-scoped paths:

| Domain | Path Used | Files |
|--------|-----------|-------|
| Delegation | `.hivemind/activity/delegation/` | use-hivemind SKILL.md, orchestrator-mandate.md, orchestrator-delegation.md, use-hivemind-delegation SKILL.md |
| Codescan | `.hivemind/activity/codescan/` | use-hivemind-context SKILL.md, use-hivemind-delegation SKILL.md |
| Sessions | `.hivemind/activity/sessions/` | use-hivemind-context SKILL.md |
| Context | `.hivemind/activity/context/` | use-hivemind-context SKILL.md |
| Agents | `.hivemind/activity/agents/` | multi-wave-dispatch.md |

No references to a monolithic `.hivemind/activity/hierarchy/` were found anywhere. All paths are domain-scoped.

#### Check 7: Bundled Resources Cross-Check — FAIL (1 missing)

**use-hivemind/SKILL.md** — All 6 resources EXIST ✓
**use-hivemind-delegation/SKILL.md** — 12 of 12 resources EXIST ✓ (note: `hivemind-gatekeeping` listed as external cross-reference, which is valid)
**use-hivemind-context/SKILL.md** — No Bundled Resources table (not required for this skill)
**hivemind-gatekeeping/SKILL.md** — 8 of 9 resources EXIST, **1 MISSING** ✗

| # | Missing Resource | File | Line |
|---|-----------------|------|------|
| 1 | `references/evidence-based-gatekeeping.md` | `hivemind-gatekeeping/SKILL.md` | 304 |

The file does not exist on disk. The evidence-based gatekeeping content appears to be **inlined** in the SKILL.md itself (lines 79-117), but the bundled resource reference claims a separate file exists.

#### Check 8: Line Count Compliance — PASS

| File | Lines | Limit | Status |
|------|-------|-------|--------|
| `use-hivemind/SKILL.md` | 351 | 450 | ✓ |
| `use-hivemind-delegation/SKILL.md` | 375 | 450 | ✓ |
| `hivemind-gatekeeping/SKILL.md` | 304 | 450 | ✓ |
| `use-hivemind-context/SKILL.md` | 265 | 450 | ✓ |

---

### Structure Map

```
developing-skills/refactored-skills/
├── use-hivemind/                          (entry router)
│   ├── SKILL.md                           351 lines
│   ├── references/
│   │   ├── orchestrator-mandate.md        267 lines
│   │   ├── orchestrator-delegation.md     142 lines
│   │   ├── context-health-check.md
│   │   ├── agent-roles.md
│   │   └── verification-before-completion.md
│   └── templates/
│       └── load-template.md               170 lines
│
├── use-hivemind-delegation/               (domain: delegation)
│   ├── SKILL.md                           375 lines
│   ├── references/
│   │   ├── multi-wave-dispatch.md         150 lines
│   │   └── [10 other reference files]
│   └── templates/ [7 templates]
│
├── hivemind-gatekeeping/                  (depth: loop control)
│   ├── SKILL.md                           304 lines
│   └── references/ [4 of 5 exist]
│
└── use-hivemind-context/                  (domain: context health)
    ├── SKILL.md                           265 lines
    ├── references/ [9 files]
    ├── scripts/ [2 scripts]
    └── schemas/ [1 schema]
```

### Patterns Found

1. **Consolidation debt** — `context-intelligence-entry` and `context-entry-verify` were merged into `use-hivemind-context`, but consuming skills still reference the old standalone names. The consolidation is acknowledged internally (use-hivemind-context SKILL.md line 243) but not propagated outward.

2. **Artifact pollution** — `_artifacts/` directories in use-hivemind-delegation contain dated change summaries that reference dead skill names (`spec-distillation`, `git-continuity-memory`, `use-hivemind-detox-refactor`). These are historical records, not active code, but they pollute grep searches.

3. **Inlined vs referenced content** — hivemind-gatekeeping inlines its evidence-based gatekeeping content (lines 79-117) but also lists it as a bundled resource file that doesn't exist.

### Gaps

| Gap | Impact |
|-----|--------|
| `context-intelligence-entry` routing targets non-existent standalone skill | Any agent following use-hivemind's step 3 or use-hivemind-context's routing table will attempt to load a skill that doesn't exist |
| `context-entry-verify` routing targets non-existent standalone skill | Same impact — routing will fail |
| `references/evidence-based-gatekeeping.md` missing from disk | Bundled Resources table claims file exists; any agent trying to read it will get a file-not-found |
| `multi-wave-dispatch.md` Slot 2 inconsistency with load-template.md at Checkpoint | Minor — agents may load `use-hivemind-delegation` when `use-hivemind-planning` was intended for checkpoint phase |

### Git Context

Investigation conducted at working tree: `/Users/apple/hivemind-plugin/.worktrees/product-detox`
Files exist and are current. No uncommitted changes affecting the investigated files were detected at time of reading.

---

### Summary

| Check | Status |
|-------|--------|
| 1. Cross-reference integrity | **FAIL** — 8 issues with old/renamed skill references |
| 2. How-to-process vs how-to-implement | **PASS** — consistent across all 4 files |
| 3. Multi-wave dispatch | **PASS** — minor Slot 2 discrepancy noted |
| 4. Carry-forward ≤5 items | **PASS** — consistent across all files |
| 5. HARD-GATE blocks | **PASS** — consistent usage |
| 6. Activity paths | **PASS** — all domain-scoped |
| 7. Bundled resources | **FAIL** — 1 missing file (`evidence-based-gatekeeping.md`) |
| 8. Line count compliance | **PASS** — all under 450 lines |

**Overall: NOT CLEAN.** 2 checks failed. The cross-reference integrity issue is systemic — the `context-intelligence-entry` / `context-entry-verify` consolidation into `use-hivemind-context` was not fully propagated across consuming skills. These old names appear in routing tables, delegation packets, and test files as if they are loadable standalone skills, but they only exist in archive directories.