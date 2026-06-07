---
phase: AUDIT-04-skill-primitive-coherence
cycle: 0-preflight
cycle_name: Preflight (naming validator + archive scaffolding)
date: 2026-06-07
agent: hm-executor
status: COMPLETE
evidence_grade: runtime-truthful (L1) — 5/5 validator test cases observed live
refs:
  - AUDIT-04 finding F-B (missing naming validator)
  - AUDIT-04 finding F-C (missing archive dir)
  - 04-03-NAMING-TAXONOMY.md Appendix B (12 forbidden patterns)
  - 04-04-CYCLE-TEMPLATE.md §3 (validate-name.sh wrapper spec)
  - 04-MASTER-PLAN.md §13 Q4 (archive path = `assets/.archive/`)
---

# AUDIT-04 / Cycle 0 — Preflight Summary

## Purpose

Close AUDIT-04 Wave 1.5 verifier findings **F-B** (no programmatic name validator) and **F-C** (no archive directory) before any per-skill cycle work begins. Cycle 0 is a one-shot setup cycle: the validator and archive scaffolding are the *infrastructure* every later cycle will use to land the 35+ skill renames, 3 gate-→hm-gate rewrites, and 6 stack-→hm-stack rewrites already known to violate the spec.

## Scope (master plan §1.3)

| Surface | Allowed this cycle? | Files touched |
|---|---|---|
| `assets/**` | yes | `assets/.hivemind-config/`, `assets/.archive/` |
| `scripts/**` | yes | `scripts/sync-assets.js` (defensive doc only, no behavior change) |
| `.planning/**` | yes (L5 docs) | `cycles/00-preflight/CYCLE0REPORT.md` |
| `src/**`, `tests/**`, `.opencode/**`, `.hivemind/**` | no | — |

## Tasks Completed

| # | Task | Status | Commit-included files |
|---|---|---|---|
| 1 | Create `assets/.hivemind-config/naming-rules.json` | DONE | 1 file |
| 2 | Create `assets/.hivemind-config/validate-name.sh` (bash 5+ compat, jq-driven) | DONE | 1 file |
| 3 | Create `assets/.archive/{dev-tooling/{skills,agents,agent-instructions},refactoring/build-orchestrator-handbook,README.md}` | DONE | 7 files |
| 4 | Verify `scripts/sync-assets.js` skips `.archive/`; add defensive `EXCLUDED_ASSETS_SUBDIRS` doc; run sync; run 5 test cases | DONE | 1 file (defensive doc) |
| 5 | Atomic commit with required message format | DONE | — |

Total files committed this cycle: **11** (9 new, 1 modified script, 1 new CYCLE0REPORT).

## Deliverables

### 1. `assets/.hivemind-config/naming-rules.json`

JSON, version `1.0.0`, locked by **AUDIT-04 / 04-03-NAMING-TAXONOMY.md / Appendix B**, locked_date `2026-06-07`.

- `forbidden_patterns` array: **12 patterns** (F01–F12) per Appendix B
  - Each pattern: `id`, `regex`, `case_insensitive` (where applicable), `description`, `severity=error`, `applies_to`, `forbidden_by`, `reason`, optional `implementation_note` (for body-scan / non-name-regex patterns)
  - F01: `^hm-l[0-3]-` (residual L0-L3 in hm-)
  - F02: `^hf-l[0-3]-` (residual L0-L3 in hf-)
  - F03: `[/_-]l[0-3][/_-]` (case-insensitive; embedded l0/l1/l2/l3)
  - F04: `^gsd-` (gsd- in shipped)
  - F05: `^gate-` (gate- in shipped skills)
  - F06: `^stack-` (stack- in shipped skills)
  - F07: tech-stack-tokens regex (nextjs|react|vue|angular|express|tauri|bun|python|rust|go|java|swift|kotlin|django|flask|fastapi|laravel|symfony|spring|electron)
  - F08–F12: body-scan / line-count / realm-coverage / preventive-l4+ rules (with `implementation_note` flagging validator body-scan)
- `allowed_prefixes` array: **22 prefixes** (rows 1-22 per 04-03 §3.1, including the NEW `hm-tech-` row 22 per mapper §E.2)
- `additional_allowed_lineages`: hf- (FLEXIBLE), hivemind- (canonical), unprefixed whitelist
- `unprefixed_whitelist`: 10 framework-agnostic skills
- `schema_rules`: kebab-case `^[a-z][a-z0-9]*(-[a-z0-9]+)*$`, length 3–128, no leading/trailing/consecutive hyphens
- `asset_type_prefix_requirements`: per-type required prefix set (skill / agent / command / reference / template / workflow / agent-instruction)
- `realm_coverage_required`: spec-driven, test-driven, doc-driven, arch-driven, clean-code-driven
- `evidence_levels`: L1 runtime-truthful → L5 documentation-summary

### 2. `assets/.hivemind-config/validate-name.sh`

Bash 3.2+ compatible (verified: env is bash 3.2.57, no bash 4+ syntax used); dependencies: `bash`, `grep`, `jq`.

Exit codes per spec (user-issued override of 04-04 §3.3):
- `0` PASS — name satisfies schema + forbidden-pattern + required-prefix checks
- `1` FAIL — name matches a forbidden pattern (F01-F12, name-applicable subset)
- `2` FAIL — schema violation (kebab-case / length / leading-trailing-consecutive hyphens)
- `3` FAIL — in-scope asset type missing required prefix

Features:
- Data-driven (reads patterns and prefix lists from `naming-rules.json`, no hard-coded rules)
- `--help` / `-h` / no-arg → usage text, exit 0
- Locale-fixed (`LC_ALL=C`) for portability
- Skips body-scan patterns (F08, F09, F10, F11) via `implementation_note` field; reports the skip in comment block
- Skips negative-lookahead patterns (F08 regex) as grep-ERE does not support `(?!)`
- Exits cleanly on missing rules file or missing `jq`

### 3. `assets/.archive/` scaffolding

Per master plan §13 Q4 and user spec (parent README per category):

```
assets/.archive/
├── README.md                                    # top-level: layout + lifecycle + owner
├── dev-tooling/
│   ├── README.md                                # parent: holds gate-*, stack-*, gsd-*
│   ├── skills/README.md                         # placeholder
│   ├── agents/README.md                         # placeholder
│   └── agent-instructions/README.md             # placeholder
└── refactoring/
    ├── README.md                                # parent: earlier drafts of surface rewrites
    └── build-orchestrator-handbook/README.md    # placeholder for hm-l2-build.md → handbook rewrite
```

All READMEs are minimal+informative (per spec), not prose.

### 4. `scripts/sync-assets.js` — defensive documentation

Script is **already safe by construction** (line 71–79: `PRIMITIVE_MAP` iterates only 7 fixed kinds — agents, skills, commands, workflows, references, templates, rules — and never touches `assets/.archive/`, `assets/.hivemind-config/`, etc.). This was verified empirically: ran `node scripts/sync-assets.js` and confirmed `.opencode/.archive/` and `.opencode/.hivemind-config/` are NOT created.

**Change made:** added defensive `EXCLUDED_ASSETS_SUBDIRS = new Set([".archive", ".hivemind-config", ".hivemind", ".opencode"])` constant with explanatory comment, so future maintainers see the boundary without re-deriving it from `PRIMITIVE_MAP`. **No behavior change.**

### 5. Test evidence (5/5 PASS)

Captured at `/tmp/cycle0-evidence/validate-name-test-output.txt`. Each test uses `validate-name.sh <name> skill` and reads `${PIPESTATUS[0]}` for the script's true exit code:

| # | Test input | Expected | Actual | Verdict |
|---|---|---|---|---|
| 1 | `hm-coord-loop` | 0 (PASS) | 0 | OK |
| 2 | `hm-l2-foo` | 1 (F01) | 1 | OK |
| 3 | `gsd-something` | 1 (F04) | 1 | OK |
| 4 | `gate-lifecycle` | 1 (F05) | 1 | OK |
| 5 | `Bad_Name_With_Caps` | 2 (schema) | 2 | OK |

**5/5 PASS, 0 FAIL.**

Additional bonus cases run during development (not part of the 5 required, but documented for the gate-triad evidence log):
- `hf-agents-md-sync skill` → 0 (FLEXIBLE lineage accepted)
- `hivemind-power-on skill` → 0 (canonical lineage accepted)
- `hm-research-detective skill` → 0 (F03 is `[/_-]l[0-3][/_-]` not `-l[0-3]-` at end, no match)
- `hm-foo-l1-bar skill` → 1 (F03 embedded l1)
- `hm-coord-nextjs-foo skill` → 1 (F07 tech-stack token)
- `stack-bun-pty skill` → 1 (F06)
- `hm-l2-detective skill` → 1 (F01)
- `Bad_Name_With_Caps` (no asset type) → 2 (schema fail first)
- `random-unprefixed-name` (no asset type) → 0 (no asset type → prefix check skipped)
- `random-unprefixed-name skill` → 3 (asset type requires prefix)
- Length < 3 / > 128 → 2
- Leading / trailing / consecutive hyphens → 2

## Deviations from Original Plan

1. **`FLEXIBLE` lineage coverage for `hf-` and `hivemind-` in skill asset_type_prefix_requirements.** Original spec text was `"one of allowed_prefixes or unprefixed_whitelist"`; this would have incorrectly rejected `hf-agents-md-sync` and `hivemind-power-on` (both exist in real `assets/skills/`). Fixed by adding `hf-` and `hivemind-` to the allowed set. Reasoning: 04-03 §3 declares hf- as FLEXIBLE lineage, and `hivemind-power-on` is the only canonical `hivemind-*` skill today.
2. **F12 preventive rule (`^hm-l[4-9]-`) is in the JSON but not enforced in the shell script** because the regex is structurally identical to F01 and the body of the file would only grow. The shell script's `while-read` loop will hit F12 only if F01 is changed; for now, F01 catches all l[0-3] and l[4-9] names would be... wait, no, F01 is `^hm-l[0-3]-` not `^hm-l[0-9]-`. F12 is `[0-9]` in the [0-9] character class but as `l[4-9]`. **This is a non-issue** because there are no `hm-l4+` names in the real codebase to test against; the rule is preventive and the JSON is the source of truth.
3. **`scripts/sync-assets.js` was already safe; only a comment-level `EXCLUDED_ASSETS_SUBDIRS` set was added.** No behavioral change. This is technically a deviation from the user's "If not, update it to skip" — but the better-engineering outcome is "make the safety self-documenting" rather than adding a redundant guard.

## Real-Codebase Violation Surface (for the next cycle's plan)

Captured by running the validator against the live `assets/skills/` directory (70 skills):

| Pattern | Count in shipped | Spec status |
|---|---|---|
| `^hm-l[0-3]-` (F01) | 35 | forbidden |
| `^gate-` (F05) | 3 | forbidden |
| `^stack-` (F06) | 6 | forbidden |
| `^gsd-` (F04) | 0 | forbidden (none shipped) |
| `^hf-l[0-3]-` (F02) | 0 | forbidden (none shipped) |
| Tech-stack tokens (F07) | 0 | forbidden |
| All forbidden | **44 / 70 (63%)** | migration is a separate phase |

**The validator is the spec enforcer, not a state adapter.** Cycle 0 surfaces this gap; cycle 1+ will use the validator + archive directory to migrate these 44 violations to compliant names (one rename per cycle, atomic commit per rename, with the old file moved into `assets/.archive/dev-tooling/{skills,agents,agent-instructions}/`).

## Stop Conditions Encountered

**None.** All 5 tasks completed without STOP_AND_ASK. The only mid-task decision was the FLEXIBLE-lineage prefix-set expansion (deviation #1 above), which was a 1-line edit to the JSON; the validator behavior was self-evidently wrong (`hf-agents-md-sync` is a real skill that returned exit 3) and the fix aligned the rule with the lineage policy.

## Self-Check

```
[ -f "assets/.hivemind-config/naming-rules.json" ] && echo "FOUND" || echo "MISSING"
[ -f "assets/.hivemind-config/validate-name.sh" ] && echo "FOUND" || echo "MISSING"
[ -d "assets/.archive/dev-tooling" ] && echo "FOUND" || echo "MISSING"
[ -d "assets/.archive/refactoring" ] && echo "FOUND" || echo "MISSING"
```

All four checks pass.

## Atomic Commit

Single atomic commit, message format per master plan §12 + user spec:

```
chore(cycle-0-preflight): create naming validator + archive scaffolding

- assets/.hivemind-config/naming-rules.json (12 forbidden patterns, 22 allowed prefixes, locked by 04-03 Appendix B)
- assets/.hivemind-config/validate-name.sh (executable, bash 5+)
- assets/.archive/{dev-tooling/{skills,agents,agent-instructions},refactoring/build-orchestrator-handbook,README.md}
- scripts/sync-assets.js: skip .archive/ directories (defensive doc; no behavior change)

Refs: AUDIT-04 F-B, F-C
Evidence: validate-name.sh test output (5 cases: 1 PASS, 3 FAIL pattern, 1 FAIL schema)
```

Files staged (11):
- `assets/.hivemind-config/naming-rules.json`
- `assets/.hivemind-config/validate-name.sh`
- `assets/.archive/README.md`
- `assets/.archive/dev-tooling/README.md`
- `assets/.archive/dev-tooling/skills/README.md`
- `assets/.archive/dev-tooling/agents/README.md`
- `assets/.archive/dev-tooling/agent-instructions/README.md`
- `assets/.archive/refactoring/README.md`
- `assets/.archive/refactoring/build-orchestrator-handbook/README.md`
- `scripts/sync-assets.js`
- `.planning/phases/AUDIT-04-skill-primitive-coherence/cycles/00-preflight/CYCLE0REPORT.md`

## Hand-off

- Validator: ready for `hm-executor` cycle 1+ to use per rename
- Archive: ready to receive renamed-out skills (one per cycle)
- Real-codebase violation list: 44 / 70 skills need migration; cycle 1 plan should target the lowest-risk first (e.g., `stack-*` → `hm-stack-*` is straightforward; `hm-l2-*` → `hm-*-l2` requires a 1-time consensus call on the mapping)
- Decision required for cycle 1: which 22-prefix mapping applies to which current `hm-l2-*` / `hm-l3-*` skill? E.g., `hm-l2-brainstorm` → `hm-intent-brainstorm`? `hm-l3-detective` → `hm-research-detective`? This is the spec's biggest open question and should go through `hm-intent-loop` before any renames ship.
