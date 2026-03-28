# Session Inspection Export

- ses_id: `ses_2daccf341ffeF0jTTFwIdkmoQJ`
- prepared_at: `2026-03-25T13:36:04.803Z`

## Assistant Output

Now I have comprehensive data. Here is the complete investigation report.

---

## Codebase Investigation Report

**Scope:** All `.hivemind/activity/` rigid folder structure references in `.developing-skills/refactored-skills/`
**Question:** Which SKILL.md and reference files hardcode the monolithic `.hivemind/activity/` folder structure?

### Findings — Grouped by File

---

#### FILE 1: `use-hivemind-context/SKILL.md`

| # | Finding | Line | Subfolder Path | Evidence |
|---|---------|------|----------------|----------|
| 1 | Session continuity check | 105 | `activity/sessions/` | `Check \`.hivemind/activity/sessions/continuity.json\` exists and has a recent \`updated_at\`` |
| 2 | State cache path | 128 | `activity/state/` | `.hivemind/activity/state/context-check.json    ← runtime cache (not official boundary)` |
| 3 | Codescan path | 129 | `activity/codescan/` | `.hivemind/activity/codescan/                   ← scan outputs per pass` |
| 4 | Session continuity path | 130 | `activity/sessions/` | `.hivemind/activity/sessions/continuity.json    ← session continuity state` |
| 5 | Dual folder storage instruction | 140 | `activity/sessions/` + `activity/state/` | `Store it in \`{project}/.hivemind/activity/sessions/\` or \`{project}/.hivemind/activity/state/\`` |
| 6 | Pathing reference | 133 | `pathing/active-paths.json` | `Paths are relative to project root. Resolve via \`pathing/active-paths.json\`.` |

---

#### FILE 2: `use-hivemind-delegation/SKILL.md`

| # | Finding | Line | Subfolder Path | Evidence |
|---|---------|------|----------------|----------|
| 1 | Delegation storage instruction | 271 | `activity/delegation/` | `Delegation artifacts are stored in \`{project}/.hivemind/activity/delegation/\` at runtime.` |

---

#### FILE 3: `use-hivemind-delegation/_artifacts/02-audit-2026-03-22.md`

| # | Finding | Line | Subfolder Path | Evidence |
|---|---------|------|----------------|----------|
| 1 | Audit confirmation of activity structure | 80 | `activity/delegation/` | `The skill stores artifacts in \`{project}/.hivemind/activity/delegation/\` which matches the pack-level \`activity/\` convention.` |
| 2 | Pack-level integration statement | 141 | `activity/delegation/` | `The activity folder path (\`{project}/.hivemind/activity/delegation/\`)... all align with the pack-level AGENTS.md convention.` |

---

#### FILE 4: `use-hivemind-delegation/references/codescan-delegation.md`

| # | Finding | Line | Subfolder Path | Evidence |
|---|---------|------|----------------|----------|
| 1 | Codescan synthesis path | 54 | `activity/codescan/` | `".hivemind/activity/codescan/pass_high_level/synthesis.json"` |
| 2 | Codescan synthesis path (dup) | 57 | `activity/codescan/` | `".hivemind/activity/codescan/pass_high_level/synthesis.json"` |
| 3 | Codescan batch output path | 71 | `activity/codescan/` | `"Write batch output to .hivemind/activity/codescan/pass_src_tools/batch_1.json"` |

---

#### FILE 5: `use-hivemind-planning/SKILL.md`

| # | Finding | Line | Subfolder Path | Evidence |
|---|---------|------|----------------|----------|
| 1 | Planning folder declaration | 206 | `activity/planning/` | `.hivemind/activity/planning/       ← plan records, phase state` |
| 2 | Delegation folder declaration | 207 | `activity/delegation/` | `.hivemind/activity/delegation/     ← slice definitions, packets` |
| 3 | Plan storage + pathing instruction | 210 | `activity/planning/` + `pathing/active-paths.json` | `Plan records are stored at \`{project}/.hivemind/activity/planning/\` at runtime. Resolve via \`pathing/active-paths.json\`, not ad-hoc paths.` |

---

#### FILE 6: `use-hivemind-planning/references/re-decomposition-protocol.md`

| # | Finding | Line | Subfolder Path | Evidence |
|---|---------|------|----------------|----------|
| 1 | Packet collection instruction | 11 | `activity/delegation/` | `Collect both return packets from \`{project}/.hivemind/activity/delegation/\`` |
| 2 | Re-decomposition file path | 47 | `activity/delegation/` | `{project}/.hivemind/activity/delegation/{original_slice_id}-re-decomposition.json` |

---

#### FILE 7: `use-hivemind-tdd/SKILL.md`

| # | Finding | Line | Subfolder Path | Evidence |
|---|---------|------|----------------|----------|
| 1 | TDD checkpoint path | 209 | `activity/delegation/` | `{project}/.hivemind/activity/delegation/phase-tdd-{plan_id}-checkpoint.json` |
| 2 | Checkpoint storage instruction | 318 | `activity/delegation/` | `Checkpoints stored in \`{project}/.hivemind/activity/delegation/\` at runtime` |

---

#### FILE 8: `use-hivemind-skill-authoring/SKILL.md`

| # | Finding | Line | Subfolder Path | Evidence |
|---|---------|------|----------------|----------|
| 1 | Skill review evidence path | 208 | `activity/codescan/` | `| Skill review evidence | \`.hivemind/activity/codescan/\` |` |
| 2 | Conflict reports path | 209 | `activity/delegation/` | `| Conflict reports | \`.hivemind/activity/delegation/\` |` |

---

#### FILE 9: `hivemind-system-debug/SKILL.md`

| # | Finding | Line | Subfolder Path | Evidence |
|---|---------|------|----------------|----------|
| 1 | Debug artifact storage | 45 | `activity/agents/` | `Debug artifacts are stored in \`{project}/.hivemind/activity/agents/{agent_name}/{pass_id}/\`` |

---

#### FILE 10: `hivemind-refactor/SKILL.md`

| # | Finding | Line | Subfolder Path | Evidence |
|---|---------|------|----------------|----------|
| 1 | Refactor artifact storage | 274 | `activity/agents/` | `Refactor artifacts are stored in \`{project}/.hivemind/activity/agents/{agent_name}/{pass_id}/\`` |

---

#### FILE 11: `hivemind-codemap/SKILL.md`

| # | Finding | Line | Subfolder Path | Evidence |
|---|---------|------|----------------|----------|
| 1 | Scan output storage | 124 | `activity/codescan/` | `Scan outputs are stored in \`{project}/.hivemind/activity/codescan/\` with this structure:` |

---

#### FILE 12: `hivemind-atomic-commit/SKILL.md`

| # | Finding | Line | Subfolder Path | Evidence |
|---|---------|------|----------------|----------|
| 1 | Activity records storage | 164 | `activity/commits/` | `Activity records are stored in \`{project}/.hivemind/activity/commits/\` at runtime.` |
| 2 | Commit records path | 172 | `activity/commits/` | `Commit records are stored in \`.hivemind/activity/commits/\`` |

---

#### FILE 13: `hivemind-gatekeeping/references/iterative-loop-control.md`

| # | Finding | Line | Subfolder Path | Evidence |
|---|---------|------|----------------|----------|
| 1 | Pass 1 synthesis output | 32 | `activity/codescan/` | `"output_path": ".hivemind/activity/codescan/pass_1/synthesis.json"` |
| 2 | Pass 2 synthesis output | 42 | `activity/codescan/` | `"output_path": ".hivemind/activity/codescan/pass_2/synthesis.json"` |

---

#### FILE 14: `hivemind-gatekeeping/references/loop-control.md`

| # | Finding | Line | Subfolder Path | Evidence |
|---|---------|------|----------------|----------|
| 1 | Checkpoint initialization | 6 | `activity/delegation/` | `Initialize checkpoint at \`.hivemind/activity/delegation/{loop_id}-checkpoint.json\`` |

---

#### FILE 15: `use-hivemind-git-memory/references/activity-pathing.md` ⚠️ **CENTRAL PATH REGISTRY — MOST CRITICAL**

| # | Finding | Line | Subfolder Path | Evidence |
|---|---------|------|----------------|----------|
| 1 | Master activity declaration | 5 | ALL | `All activity artifacts (handoff records, delegation JSON, scan outputs, agent iterations, hierarchy tracking, continuity state) are stored in a single deterministic folder structure under the project's \`.hivemind/activity/\` directory.` |
| 2 | Base path template | 12 | ALL | `{project}/.hivemind/activity/` |
| 3 | Directory tree definition | 13-38 | ALL subfolders | Full tree: `handoff/`, `delegation/`, `hierarchy/`, `sessions/`, `codescan/`, `agents/`, `longhaul/`, `pathing/`, `state/`, `memory-index/` |
| 4 | Path resolution base | 44 | ALL | `base = {project}/.hivemind/activity/` |
| 5 | Pathing resolution instruction | 41 | `pathing/active-paths.json` | `All skills MUST resolve paths from the base convention and then from \`pathing/active-paths.json\`` |
| 6 | Active-paths registry definition | 57 | `pathing/active-paths.json` | `pathing/active-paths.json is the machine-readable registry:` |
| 7 | JSON registry — handoff | 67 | `activity/handoff/` | `"handoff": ".hivemind/activity/handoff"` |
| 8 | JSON registry — delegation | 68 | `activity/delegation/` | `"delegation": ".hivemind/activity/delegation"` |
| 9 | JSON registry — hierarchy | 69 | `activity/hierarchy/` | `"hierarchy": ".hivemind/activity/hierarchy"` |
| 10 | JSON registry — sessions | 70 | `activity/sessions/` | `"sessions": ".hivemind/activity/sessions"` |
| 11 | JSON registry — codescan | 71 | `activity/codescan/` | `"codescan": ".hivemind/activity/codescan"` |
| 12 | JSON registry — agents | 72 | `activity/agents/` | `"agents": ".hivemind/activity/agents"` |
| 13 | JSON registry — longhaul | 73 | `activity/longhaul/` | `"longhaul": ".hivemind/activity/longhaul"` |
| 14 | JSON registry — pathing | 74 | `activity/pathing/` | `"pathing": ".hivemind/activity/pathing"` |
| 15 | JSON registry — state | 75 | `activity/state/` | `"state": ".hivemind/activity/state"` |
| 16 | Metadata template for all records | 84 | ALL | `Persistent records under \`.hivemind/activity/\` should include:` |

---

#### FILE 16: `use-hivemind-git-memory/references/session-continuity.md`

| # | Finding | Line | Subfolder Path | Evidence |
|---|---------|------|----------------|----------|
| 1 | Continuity.json path | 21 | `activity/sessions/` | `Stored at \`{project}/.hivemind/activity/sessions/continuity.json\`` |
| 2 | Codescan output path | 65 | `activity/codescan/` | `"output_path": ".hivemind/activity/codescan/pass_1/batch_1.json"` |
| 3 | Task state path | 103 | `activity/longhaul/` | `Stored at \`{project}/.hivemind/activity/longhaul/task-state.json\`` |

---

#### FILE 17: `use-hivemind-git-memory/references/retrieval-methodology.md`

| # | Finding | Line | Subfolder Path | Evidence |
|---|---------|------|----------------|----------|
| 1 | Memory index existence check | 20 | `activity/memory-index/` | `When \`.hivemind/activity/memory-index/index.json\` exists:` |
| 2 | By tag lookup | 24 | `activity/memory-index/` | `grep -r "git-memory" .hivemind/activity/memory-index/` |
| 3 | By packet lookup | 25 | `activity/memory-index/` | `jq '.by_packet["batch_007"]' .hivemind/activity/memory-index/index.json` |
| 4 | By decision lookup | 26 | `activity/memory-index/` | `jq '.by_decision["decision_X"]' .hivemind/activity/memory-index/index.json` |
| 5 | By phase lookup | 27 | `activity/memory-index/` | `jq '.by_phase["implementation"]' .hivemind/activity/memory-index/index.json` |
| 6 | By agent lookup | 28 | `activity/memory-index/` | `jq '.by_agent["hivemaker"]' .hivemind/activity/memory-index/index.json` |
| 7 | Full record read | 29 | `activity/memory-index/` | `cat .hivemind/activity/memory-index/{sha}.json` |
| 8 | Index rebuild | 63 | `activity/memory-index/` | `.hivemind/activity/memory-index/index.json` |
| 9 | Hierarchy lookup | 45 | `activity/hierarchy/` | `cat .hivemind/activity/hierarchy/${DECISION}.json` |
| 10 | Delegation lookup | 48 | `activity/delegation/` | `cat .hivemind/activity/delegation/${PACKET}.json` |
| 11 | Session state read | 82 | `activity/sessions/` | `Read \`{project}/.hivemind/activity/sessions/continuity.json\` for session state` |
| 12 | Delegation date search | 94 | `activity/delegation/` | `Search \`.hivemind/activity/delegation/\` for matching packets by date range` |

---

#### FILE 18: `use-hivemind-git-memory/references/index-registration.md`

| # | Finding | Line | Subfolder Path | Evidence |
|---|---------|------|----------------|----------|
| 1 | Index directory path | 33 | `activity/memory-index/` | `{project}/.hivemind/activity/memory-index/` |
| 2 | Record write path | 105 | `activity/memory-index/` | `Write record to .hivemind/activity/memory-index/{sha}.json` |
| 3 | Iteration path | 136 | `activity/memory-index/` | `for sha in .hivemind/activity/memory-index/*.json; do` |

---

#### FILE 19: `use-hivemind-git-memory/references/knowledge-network.md`

| # | Finding | Line | Subfolder Path | Evidence |
|---|---------|------|----------------|----------|
| 1 | Index query | 42 | `activity/memory-index/` | `' .hivemind/activity/memory-index/index.json` |
| 2 | Decision read | 67 | `activity/hierarchy/` | `Read decision from .hivemind/activity/hierarchy/{decision_id}.json` |
| 3 | Packet read | 69 | `activity/delegation/` | `Read packet from .hivemind/activity/delegation/{packet_id}.json` |

---

#### FILE 20: `use-hivemind-git-memory/references/packet-linkage.md`

| # | Finding | Line | Subfolder Path | Evidence |
|---|---------|------|----------------|----------|
| 1 | Packet lookup | 49 | `activity/delegation/` | `find the correct \`packet_id\` from \`.hivemind/activity/delegation/\`` |

---

#### FILE 21: `use-hivemind-git-memory/tests/git-memory-enforce-direct-invocation.md`

| # | Finding | Line | Subfolder Path | Evidence |
|---|---------|------|----------------|----------|
| 1 | Index creation check | 14 | `activity/memory-index/` | `Index registration creates \`.hivemind/activity/memory-index/{sha}.json\`` |
| 2 | File existence test | 26 | `activity/memory-index/` | `test -f ".hivemind/activity/memory-index/${SHA}.json"` |
| 3 | Index membership check | 29 | `activity/memory-index/` | `jq -e '.by_packet["batch_007"] | index("'"$SHA"'")' .hivemind/activity/memory-index/index.json` |
| 4 | Packet length query | 73 | `activity/memory-index/` | `jq -r '.by_packet["batch_007"] | length' .hivemind/activity/memory-index/index.json` |
| 5 | Hierarchy lookup instruction | 85 | `activity/hierarchy/` | `Look up decision in \`.hivemind/activity/hierarchy/\`` |
| 6 | Delegation lookup instruction | 87 | `activity/delegation/` | `Look up packet in \`.hivemind/activity/delegation/\`` |
| 7 | Session packet read | 119 | `activity/sessions/` | `jq -r '.last_packet_id' .hivemind/activity/sessions/continuity.json` |
| 8 | Packet SHA lookup | 120 | `activity/memory-index/` | `jq -r '.by_packet["'"$PACKET"'"][]' .hivemind/activity/memory-index/index.json` |

---

#### FILE 22: `use-hivemind/references/context-health-check.md`

| # | Finding | Line | Subfolder Path | Evidence |
|---|---------|------|----------------|----------|
| 1 | Session continuity reference | 26 | `activity/sessions/` | `Session continuity state in \`.hivemind/activity/sessions/continuity.json\` is reliable only if git-anchored.` |

---

#### FILE 23: `use-hivemind/references/agent-roles.md`

| # | Finding | Line | Subfolder Path | Evidence |
|---|---------|------|----------------|----------|
| 1 | State management reference | 100 | `activity/sessions/` | `JSON checkpoints in \`.hivemind/activity/sessions/continuity.json\`.` |

---

#### FILE 24: `use-hivemind-context/tests/direct-invocation.md`

| # | Finding | Line | Subfolder Path | Evidence |
|---|---------|------|----------------|----------|
| 1 | Runtime cache check | 41 | (general `.hivemind/`) | `no bundled runtime cache file under \`scripts/.hivemind/\`` |

---

#### FILE 25: `use-hivemind-context/references/entry-state-matrix.md`

| # | Finding | Line | Subfolder Path | Evidence |
|---|---------|------|----------------|----------|
| 1 | No state check | 12 | (general `.hivemind/`) | `No \`.hivemind/\` state for this session` |
| 2 | Directory existence check | 25 | (general `.hivemind/`) | `Check for .hivemind/ directory` |

---

#### FILE 26: `hivemind-atomic-commit/references/surface-ownership.md`

| # | Finding | Line | Subfolder Path | Evidence |
|---|---------|------|----------------|----------|
| 1 | Runtime ownership | 18 | (general `.hivemind/`) | `| \`.hivemind/\`, \`dist/\` |` |
| 2 | Ownership override file | 56 | (general `.hivemind/`) | `Override ownership via \`.hivemind-ownership.json\`` |
| 3 | Runtime output declaration | 83 | (general `.hivemind/`) | `| \`.hivemind/\` | Runtime output — generated by tools, never hand-written |` |

---

#### FILE 27: `hivemind-atomic-commit/references/git-gate.md`

| # | Finding | Line | Subfolder Path | Evidence |
|---|---------|------|----------------|----------|
| 1 | Secret allow override | 54 | (general `.hivemind/`) | `Override: \`.hivemind-secret-allow\` file lists regex patterns to ignore` |

---

#### FILE 28: `hivemind-atomic-commit/references/activity-classifier.md`

| # | Finding | Line | Subfolder Path | Evidence |
|---|---------|------|----------------|----------|
| 1 | Runtime classification | 10 | (general `.hivemind/`) | `| \`runtime\` | Generated runtime state, activity logs | Path matches \`.hivemind/**\`` |
| 2 | Classification rule | 36 | (general `.hivemind/`) | `.hivemind/** → runtime` |
| 3 | Override file | 71 | (general `.hivemind/`) | `Explicit overrides are supported via a \`.hivemind-classify.json\` file` |

---

#### FILE 29: `use-hivemind-git-memory/SKILL.md`

| # | Finding | Line | Subfolder Path | Evidence |
|---|---------|------|----------------|----------|
| 1 | Runtime dir requirement | 33 | (general `.hivemind/`) | `\`.hivemind/\` runtime directory present (for path resolution)` |

---

### Structure Map — Hardcoded Subfolder Paths Found

```
.hivemind/activity/
├── handoff/           ← FILE 15 (activity-pathing.md:67)
├── delegation/        ← FILES 2,3,4,5,6,7,8,10,14,15,17,19,20,21
├── hierarchy/         ← FILES 15,17,19,21
├── sessions/          ← FILES 1,15,16,17,21,22,23
├── codescan/          ← FILES 1,4,8,11,12,13,15,16
├── agents/            ← FILES 9,10,15
├── longhaul/          ← FILES 15,16
├── pathing/           ← FILE 15
├── state/             ← FILES 1,15
├── memory-index/      ← FILES 15,17,18,19,21
└── commits/           ← FILE 12
```

### Patterns Found

1. **Central Path Registry**: `use-hivemind-git-memory/references/activity-pathing.md` (FILE 15) is the canonical definition of the entire rigid folder structure. It defines 10 subfolders and the `pathing/active-paths.json` registry. All other files reference this structure.

2. **Dual-path convention**: Files use both bare `.hivemind/activity/...` and `{project}/.hivemind/activity/...` templated forms. The `{project}` prefix appears in SKILL.md "Storage" sections; bare paths appear in code examples and reference docs.

3. **`pathing/active-paths.json` coupling**: 4 files (use-hivemind-context/SKILL.md:133, use-hivemind-planning/SKILL.md:210, activity-pathing.md:41,57) mandate that all skills resolve paths through this registry, locking in the monolithic structure.

4. **Highest-density offenders** (files with most hardcoded paths):
   - `use-hivemind-git-memory/references/activity-pathing.md` — 16 matches (master definition)
   - `use-hivemind-git-memory/references/retrieval-methodology.md` — 12 matches
   - `use-hivemind-git-memory/tests/git-memory-enforce-direct-invocation.md` — 8 matches
   - `use-hivemind-context/SKILL.md` — 6 matches
   - `use-hivemind-git-memory/references/index-registration.md` — 3 matches

### Gaps

| Subfolder Requested | Matches Found | Status |
|---------------------|---------------|--------|
| `activity/delegation/` | 15 matches across 12 files | HEAVILY HARDCODED |
| `activity/codescan/` | 10 matches across 7 files | HEAVILY HARDCODED |
| `activity/sessions/` | 8 matches across 6 files | HEAVILY HARDCODED |
| `activity/memory-index/` | 17 matches across 5 files | HEAVILY HARDCODED |
| `activity/agents/` | 3 matches across 3 files | HARDCODED |
| `activity/hierarchy/` | 4 matches across 3 files | HARDCODED |
| `activity/planning/` | 3 matches across 2 files | HARDCODED |
| `activity/state/` | 2 matches across 1 file | HARDCODED |
| `activity/longhaul/` | 2 matches across 2 files | HARDCODED |
| `activity/commits/` | 2 matches across 1 file | HARDCODED |
| `activity/handoff/` | 1 match across 1 file | HARDCODED |
| `activity/pathing/` | 1 match across 1 file | HARDCODED |
| `activity/tdd/` | 0 matches | NOT HARDCODED (TDD uses `activity/delegation/` instead) |
| `activity/verification/` | 0 matches | NOT PRESENT |
| `activity/handoff/` (dedicated) | 1 match only in registry | MINIMAL |
| `activity/synthesis/` | 0 matches | NOT PRESENT |
| `activity/review/` | 0 matches | NOT PRESENT |
| `activity/audit/` | 0 matches | NOT PRESENT |
| `activity/specs/` | 0 matches | NOT PRESENT |
| `activity/plans/` | 0 matches | NOT PRESENT |

### Summary

**29 files** across the refactored-skills tree contain hardcoded `.hivemind/` references. Of these, **23 files** specifically hardcode subfolder paths within `.hivemind/activity/`. The single most critical file is `use-hivemind-git-memory/references/activity-pathing.md` — it is the master definition of the rigid structure that all other files inherit from. The `pathing/active-paths.json` registry pattern, referenced in 4 files, creates a coupling mechanism that forces all skills to conform to this monolithic layout.