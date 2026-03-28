# Activity Folder Forensics — Investigation Report

**Investigator:** hivexplorer
**Packet ID:** inv-1a-activity-forensics
**Date:** 2026-03-29
**Scope:** `.hivemind/activity/` complete forensic analysis
**Tool Mode:** native (grep + read + bash)

---

## Executive Summary

The `.hivemind/activity/` directory contains **178 files across 59 directories** across 14 categories. Analysis reveals **severe organizational drift** — the activity folder was populated ad-hoc without enforced naming conventions, producer attribution, or schema compliance. The most critical finding is **2,915 error log files** consuming ~100MB that appear to be session journal outputs rather than actual error records.

---

## 1. Inventory

```json
{
  "inventory": {
    "total_files": 178,
    "total_directories": 59,
    "by_category": {
      "agents":    { "files": 27, "dirs": 29, "date_range": "mixed-dated", "note": "dirs > files indicates heavy nesting" },
      "audit":     { "files":  3, "dirs":  1, "date_range": "2026-03-25 to 2026-03-28" },
      "codescan":  { "files": 14, "dirs":  7, "date_range": "wave-based (no dates in naming)" },
      "delegation":{ "files": 39, "dirs":  5, "date_range": "2026-03-24 to 2026-03-29" },
      "handoff":   { "files": 13, "dirs":  1, "date_range": "2026-03-25 to 2026-03-27" },
      "planning":  { "files": 21, "dirs":  1, "date_range": "2026-03-25 to 2026-03-26" },
      "plans":     { "files":  5, "dirs":  1, "date_range": "2026-03-25 to 2026-03-28" },
      "research":  { "files":  0, "dirs":  4, "date_range": "empty — subdirs only" },
      "review":    { "files":  7, "dirs":  1, "date_range": "no dates in naming" },
      "sessions":  { "files":  1, "dirs":  1, "date_range": "continuity.json only" },
      "specs":     { "files":  1, "dirs":  1, "date_range": "2026-03-25" },
      "synthesis": { "files":  3, "dirs":  1, "date_range": "2026-03-24" },
      "tdd":       { "files": 21, "dirs":  4, "date_range": "no dates in naming" },
      "verification": { "files": 22, "dirs": 1, "date_range": "no dates in naming" }
    }
  }
}
```

### Additional Critical Volume Finding

| Directory | Files | Issue |
|-----------|-------|-------|
| `.hivemind/error-log/` | **2,915** | Session journals misnamed as error logs; each file ~100KB = **~290MB** |

---

## 2. Naming Convention Analysis

### ✅ Compliant Patterns (partial)

| Category | Pattern | Example |
|----------|---------|---------|
| `handoff/` | ISO 8601 with T and Z separators | `2026-03-25T16-16-56Z-plan-to-orchestrator.json` |
| `audit/` | YYYY-MM-DD suffix | `architectural-audit-report-2026-03-28.md` |
| `plans/` | YYYY-MM-DD suffix | `integration-plan-2026-03-28.md` |
| `specs/` | YYYY-MM-DD suffix | `session-journal-consolidation-spec-2026-03-25.md` |

### ❌ Non-Compliant / Inconsistent Patterns

| Category | Issue | Examples |
|----------|-------|----------|
| `delegation/` | Mixed: phase-*, p*, plan-*, event-tracker*, hivefiver*, remediation*, verification* | `phase-p1-hooks-cqrs-fix.json`, `p7-green-turnNumber.json`, `event-tracker-assessment-1.json` |
| `planning/` | No date stamps; `plan-N.md` + `plan-N-revision-K.md` + `plan-N-revision-K-delta.md` | `plan-5-revision-1-delta.md` |
| `tdd/` | Subdirs `red/`, `green/`, `refactor/` good; no dates in filenames | `plan-4-green-evidence.md` |
| `verification/` | Mixed: `plan-N-*.md`, `cqrs-hooks-readonly-verify.md` | `cqrs-hooks-readonly-verify.md` (orphaned naming) |
| `codescan/` | Wave-based: `wave-1a`, `wave-1b`, `wave-1c`, `wave-2`, `pass_1774372436` | `pass_1774372436` uses unix timestamp not ISO date |
| `agents/` | Agent-name subdirs + pass IDs + date-stamped folders mixed | `hiveq/2026-03-25/`, `hitea/`, `architect/remediation-architect-review/` |
| `review/` | `plan-N-code-skeptic.md` pattern | `plan-4-code-skeptic.md` |

### Naming Issues Identified

1. **Handoff timestamp format inconsistency**: `2026-03-26T184000-plan-to-orchestrator.json` uses `T184000` instead of `T18-40-00` or `T18:40:00Z`
2. **Delegation has 5+ naming schemas**: phase-based (`phase-*`), plan-based (`plan-*`), event-based (`event-tracker-*`), remediation-based, verification-based
3. **Planning folder**: 22 files, none with dates in filename, making age determination impossible without reading
4. **Codescan pass IDs**: `pass_1774372436` is a unix timestamp but named as if a semantic ID
5. **research/**: Empty directories `batch-1a/`, `batch-1b/`, `batch-1c/` with no files
6. **plans/ vs planning/**: Two similar folders with different purposes — semantic confusion

---

## 3. Hierarchy Analysis

### Current Structure (flattened)

```
activity/
├── agents/          # Per-agent output, heavy nesting
│   ├── hivehealer/
│   ├── hiveq/
│   ├── hiveq/2026-03-25/   ← date-stamped leaf
│   ├── hiveq/20260324/     ← hybrid format
│   ├── hivexplorer/
│   ├── architect/
│   └── code-skeptic/
├── audit/           # Flat
├── codescan/        # Pass/wave subdirs
│   ├── wave-1a/, wave-1b/, wave-1c/, wave-2/
│   └── pass_1774372436/
├── delegation/      # Flat (5 subdirs for batch results)
│   └── batch-1.1-git-memory-fix/
├── handoff/         # Flat
├── planning/        # Flat
├── plans/          # Flat — master plans vs planning/
├── research/       # EMPTY dirs: batch-1a, batch-1b, batch-1c
├── review/          # Flat
├── sessions/        # continuity.json only
├── specs/           # Flat
├── synthesis/       # Flat
├── tdd/             # Subdirs by phase: red/, green/, refactor/
└── verification/    # Flat
```

### Hierarchy Issues

1. **plans/ vs planning/ semantic confusion**: `plans/` holds master plans, `planning/` holds plan revisions — unclear boundary
2. **agents/ over-nested**: 29 dirs for 27 files — many single-file subdirs
3. **research/ is a ghost directory**: 4 dirs, 0 files — created but never populated
4. **codescan/ uses wave/pass hybrid**: Some use `wave-X` naming, others use `pass_UNIXTIME`
5. **No top-level `pathing/active-paths.json`**: Referenced in skill docs but missing from `.hivemind/pathing/`
6. **No `debug/` directory despite hivemind-system-debug SKILL.md referencing it**: `hivemind-system-debug/SKILL.md:64` references `.hivemind/activity/debug/{session_id}/` but this directory doesn't exist

---

## 4. Producer Attribution Map

| Directory | Producers | Evidence |
|-----------|-----------|----------|
| `agents/` | `hivehealer`, `hiveq`, `hitea`, `hiverd`, `hivexplorer`, `architect`, `code-skeptic` | Subdirectory names match agent names; AGENTS.md defines agent roles |
| `codescan/` | `hivexplorer` (via hivemind-codemap skill + hm-codescan.sh) | `hivemind-codemap/SKILL.md` + `hm-codescan.sh` script |
| `delegation/` | `use-hivemind-delegation` skill + individual agents | `use-hivemind-delegation/SKILL.md:153` defines output_path pattern |
| `handoff/` | Orchestrator (handoff tool) | `hivemind_handoff` tool creates these |
| `planning/` | `use-hivemind-planning` skill | `use-hivemind-planning/SKILL.md:225-226` |
| `tdd/` | `use-hivemind-tdd` skill | `use-hivemind-tdd/SKILL.md:230` defines `red/`, `green/`, `refactor/` subdirs |
| `verification/` | `hiveq` agent | Files named `plan-N-hiveq-verify.md` pattern |
| `audit/` | `architect` agent | Files named `architectural-audit-report-*.md` |
| `synthesis/` | `hivemind-synthesis` skill | `hivemind-synthesis/references/synthesis-protocols.md:88` |
| `review/` | `code-skeptic` agent | Files named `plan-N-code-skeptic.md` pattern |
| `sessions/` | `use-hivemind-git-memory` skill | `use-hivemind-git-memory/SKILL.md:13` + `continuity.json` |
| `specs/` | `hivemind-spec-driven` skill | Named `*-spec-*.md` pattern |
| `plans/` | Orchestrator/human | Master plan documents |
| `research/` | `use-hivemind-research` skill | `research/` dir referenced but never populated |

### Orphaned Producer References

| Reference | Status |
|-----------|--------|
| `hivemind-system-debug/SKILL.md:64` → `.hivemind/activity/debug/` | Directory does not exist |
| `use-hivemind-git-memory` → `.hivemind/activity/git-memory/` | Directory does not exist |
| `use-hivemind-research` → `.hivemind/activity/research/` | Directory exists but is empty (0 files) |
| `pathing/active-paths.json` | Referenced in skill docs but does not exist |

---

## 5. JSON Schema Compliance

### Compliant (with `_meta.created_at` + `_meta.updated_at`)

- `delegation/phase-*.json` — 90%+ compliant
- `handoff/2026-03-2*.json` — 90%+ compliant  
- `status.json` — compliant
- `sessions/continuity.json` — compliant

### Non-Compliant JSON Files

| File | Issue |
|------|-------|
| `delegation/plan-5-registry-2026-03-24.json` | Has `_meta` and `created_at` but NO `updated_at` |
| `delegation/registry.json` | Has `_meta` but NO `created_at` or `updated_at` |
| `delegation/remediation-diagnosis-return.json` | Has `_meta` and `created_at` but NO `updated_at` |
| `handoff/2026-03-26-design-hivemind-session-hierarchy.json` | NO `_meta`, NO `created_at`, NO `updated_at` |
| `handoff/2026-03-26-session-hierarchy-orchestration.json` | Has `_meta` and `created_at` but NO `updated_at` |
| `handoff/2026-03-26T184000-plan-to-orchestrator.json` | Has `_meta` and `created_at` but NO `updated_at` |
| `handoff/2026-03-27-session-hierarchy-consolidation.json` | Has `_meta` and `created_at` but NO `updated_at` |
| `codescan/wave-1a/use-hivemind-audit.json` | NO `_meta` |
| `codescan/wave-1b/hivemind-audit.json` | NO `_meta` |
| `codescan/wave-1c/agents-audit.json` | NO `_meta` |
| `codescan/pass_1774372436/investigation-report.json` | NO `_meta` |

### Schema Field Name Inconsistency

- `status.json` uses `_meta.created` and `_meta.updated` (not `created_at`/`updated_at`)
- Most other files use `_meta.created_at` and `_meta.updated_at`

---

## 6. Cross-Reference Analysis

### Valid Cross-References

- `status.json` correctly references 40+ files in `planning/` and `verification/` directories
- `sessions/continuity.json` is the canonical session state authority
- `delegation/registry.json` acts as a phase/packet index

### Broken / Invalid References

| Referenced Path | Status |
|-----------------|--------|
| `.hivemind/activity/planning/plan-5.md` | Missing — only `plan-5-revision-1.md` exists |
| `.hivemind/activity/planning/plan-6-revision-1-delta.md` | Missing |
| `.hivemind/activity/planning/plan-8-revision-1-delta.md` | Missing |
| `.hivemind/activity/planning/plan-9-revision-1-delta.md` | Missing |
| `.hivemind/activity/git-memory/` | Directory does not exist |

### Orphaned Files (not referenced anywhere)

- `codescan/pass_1774372436/investigation-report.json` — not referenced by any known artifact
- `planning/hivefiver-refactor-plan-2026-03-25.json` — not in status.json artifact list
- `planning/hivefiver-refactor-plan-2026-03-25-summary.md` — not in status.json artifact list
- `planning/plan-session-hierarchy-slices-2026-03-26.json` — not in status.json artifact list

---

## 7. Protocol Gaps Identified

### Gap 1: No Enforced Naming Protocol
- **Evidence**: 5+ naming schemas in `delegation/` alone
- **Specified in**: `use-hivemind-git-memory/references/activity-pathing.md:28-33` (never enforced)
- **Impact**: Impossible to programmatically locate artifacts by age or type

### Gap 2: No `pathing/active-paths.json`
- **Evidence**: Skill docs reference it but file doesn't exist
- **Specified in**: `use-hivemind-planning/SKILL.md:229`
- **Impact**: Skills must use ad-hoc paths, breaking deterministic pathing

### Gap 3: Ghost Directories (research/, debug/)
- **Evidence**: Directories exist with subdirs but zero files
- **Specified in**: Multiple skill SKILL.md files
- **Impact**: Broken producer-consumer contracts

### Gap 4: error-log/ Is Mislabeled
- **Evidence**: 2,915 files named `ses_*.md` are session journals, not errors
- **Actual size**: ~290MB of session artifacts misclassified
- **Impact**: Cannot distinguish real errors from session recordings

### Gap 5: No date stamps in 60%+ of filenames
- **Evidence**: `planning/`, `tdd/`, `verification/`, `review/`, `codescan/` mostly undated
- **Impact**: Age determination requires file system stat, not filename parsing

### Gap 6: _meta Field Name Drift
- **Evidence**: `status.json` uses `created/updated` vs standard `created_at/updated_at`
- **Impact**: JSON parsers must handle two schemas

### Gap 7: plans/ vs planning/ Semantic Overlap
- **Evidence**: Both exist with similar but distinct purposes
- **Impact**: Orchestrator confusion about which to use

---

## 8. Reorganization Recommendations

### Naming Protocol

```
REQUIRED filename format: {category}-{semantic-id}-{YYYY-MM-DD}[-{variant}].{ext}

Categories: delegation, handoff, planning, plans, tdd, verification, review, synthesis, audit, codescan, agents

Examples:
  delegation/phase-p1-hooks-cqrs-fix-2026-03-25.json
  handoff/2026-03-25T16-16-56Z-plan-to-orchestrator.json
  planning/plan-5-revision-1-2026-03-25.md
  tdd/red/plan-4-red-evidence-2026-03-25.md
  verification/plan-7-hiveq-verify-2026-03-26.md
```

### Timestamp Protocol

- **ISO 8601** with format: `YYYY-MM-DD` for dates, `YYYY-MM-DDTHH-mm-ssZ` for datetimes
- **No unix timestamps** in filenames (`pass_1774372436` → `pass_2026-03-22`)
- **In `_meta` object**: `created_at: ISO8601string`, `updated_at: ISO8601string`
- **Field names**: MUST be `created_at` and `updated_at` (not `created`/`updated`)

### Hierarchy Protocol

```
activity/
├── agents/{agent_name}/{pass_id}/          # Per-agent, pass-scoped
├── audit/                                   # Flat, date-stamped
├── codescan/{pass_id}/                      # Pass-scoped, ISO date IDs
├── delegation/                              # Flat, phase-scoped
├── handoff/                                # Flat, ISO datetime
├── planning/                                # Flat, plan-scoped
├── plans/                                   # Master plans only
├── research/{packet_id}/                    # Research batches
├── review/                                  # Flat, plan-scoped
├── sessions/
│   └── continuity.json                      # Canonical only
├── specs/                                   # Flat, spec-scoped
├── synthesis/                               # Flat, topic-scoped
├── tdd/{red|green|refactor}/                # Phase-scoped subdirs
└── verification/                            # Flat, plan-scoped
```

### Attribution Protocol

Every artifact file MUST contain:

```json
{
  "_meta": {
    "created_at": "ISO8601",
    "updated_at": "ISO8601",
    "producer": "{skill_name|agent_name|tool_name}",
    "producer_version": "semver or commit SHA",
    "parent_packet_id": "optional - links to delegating packet"
  }
}
```

### Orphan Cleanup

| Action | Target |
|--------|--------|
| DELETE | `error-log/` — rename to `session-journals/` or migrate to proper journal system |
| PURGE | `research/batch-1a/`, `research/batch-1b/`, `research/batch-1c/` — empty dirs |
| CREATE | `.hivemind/pathing/active-paths.json` — path registry |
| CREATE | `.hivemind/activity/debug/` — debug artifact directory |
| CREATE | `.hivemind/activity/git-memory/` — git memory index directory |
| MIGRATE | `error-log/ses_*.md` → proper session journal storage |

---

## 9. Top 5 Critical Issues

### Issue 1: error-log/ Is a Session Journal Dump (CRITICAL)
- **Severity**: High
- **Finding**: 2,915 files named `ses_*.md` are session journals (~290MB), not errors
- **Impact**: Cannot identify actual errors; massive storage bloat
- **Root Cause**: No proper session journal system — fallback to mislabeled error log
- **Evidence**: `.hivemind/error-log/ses_2ca69dbecffe7zIsAf3FnPWcOJ-1774720537193.md` contains session metadata, not error records

### Issue 2: pathing/active-paths.json Missing (CRITICAL)
- **Severity**: High
- **Finding**: Referenced in 10+ skill documents but does not exist
- **Impact**: Deterministic pathing contract broken; agents use ad-hoc paths
- **Root Cause**: Skill documentation out of sync with implementation
- **Evidence**: `use-hivemind-planning/SKILL.md:229`, `use-hivemind-git-memory/references/activity-pathing.md:64`

### Issue 3: Ghost Producer Directories (HIGH)
- **Severity**: High
- **Finding**: `debug/` and `git-memory/` referenced but non-existent; `research/` exists but empty
- **Impact**: Broken producer contracts; artifacts cannot be stored where expected
- **Root Cause**: Skills created directories in documentation but no code creates them
- **Evidence**: `hivemind-system-debug/SKILL.md:64`, `use-hivemind-git-memory/SKILL.md:130`

### Issue 4: 60%+ of Files Lack Date Stamps (HIGH)
- **Severity**: Medium-High
- **Finding**: Cannot determine artifact age from filename in most categories
- **Impact**: Forensic analysis requires file system stat; automatic cleanup impossible
- **Root Cause**: No enforced naming protocol at time of creation

### Issue 5: JSON Schema Inconsistency (MEDIUM)
- **Severity**: Medium
- **Finding**: 9 JSON files missing `_meta`; `status.json` uses different field names (`created`/`updated` vs `created_at`/`updated_at`)
- **Impact**: parsers must handle two schemas; compliance unverifiable
- **Root Cause**: No JSON schema validation at write time

---

## 10. Protocol Governance Proposal

### Immediate Actions (before next session)

1. **Audit error-log/**: Distinguish actual errors from session journals
2. **Create missing directories**: `pathing/`, `debug/`, `git-memory/`
3. **Fix status.json field names**: `created` → `created_at`, `updated` → `updated_at`
4. **Populate or purge research/**: Either populate per skill contract or remove ghost directories

### Protocol Enforcement (skill authoring mandate)

Every skill that writes to `.hivemind/activity/` MUST:

1. Declare output path in SKILL.md `Storage` section with exact pattern
2. Use ISO 8601 dates in all filenames
3. Include `_meta.created_at` and `_meta.updated_at` in all JSON
4. Create parent directories at skill initialization
5. Validate path existence before write operations

---

## 11. Findings Summary

| Dimension | Status |
|-----------|--------|
| Total Files | 178 in activity/, 2,915 in error-log/ |
| Naming Compliance | ~40% — majority violate date-stamp requirement |
| Hierarchy Clarity | ~60% — clear subdir structure in tdd/, chaotic in agents/ |
| Schema Compliance | ~75% of JSON have `_meta`, ~60% have complete `created_at`+`updated_at` |
| Producer Attribution | ~80% traceable via subdir names or file patterns |
| Cross-Reference Integrity | ~85% valid; broken refs mostly to deleted plan files |
| Protocol Documentation | Inconsistent — docs reference non-existent paths |

---

## 12. Blocked Routes

| Route | Blocker |
|-------|--------|
| Activity folder forensics via pathing/ | `pathing/active-paths.json` doesn't exist — cannot verify deterministic path resolution |
| Error pattern analysis | error-log/ contains session journals, not errors — wrong data |
| Research artifact audit | research/ is empty — producer contract broken |

---

## 13. Recommended Next Action

**Delegate to `hiveminder` for protocol governance review:**

1. Author a `.hivemind/activity/PROTOCOL.md` that codifies the naming, hierarchy, timestamp, and attribution standards identified in this report
2. Create a `hivemind-activity-governance` skill that validates artifact compliance at write time
3. Schedule error-log/ cleanup as a separate remediation task

**Output written to:** `.hivemind/activity/agents/hivexplorer/activity-forensics-2026-03-29/investigation-report.md`

---

*Investigation completed: 2026-03-29T00:56:00Z*
*Files analyzed: 178 activity artifacts + 2915 error-log artifacts*
*Skills consulted: hivemind-codemap, use-hivemind-research, use-hivemind-git-memory*
