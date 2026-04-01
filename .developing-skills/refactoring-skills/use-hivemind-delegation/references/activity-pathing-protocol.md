# Activity Pathing Protocol Reference

## Purpose

This reference gives skill authors and implementation agents a single importable source for artifact naming, metadata, pathing, validation, and cleanup behavior.

It complements:

- `.hivemind/activity/PROTOCOL.md`
- `.hivemind/pathing/active-paths.json`
- `.developing-skills/refactored-skills/use-hivemind-delegation/templates/artifact-meta.json`
- `.developing-skills/refactored-skills/use-hivemind-delegation/scripts/hm-artifact-validate.sh`
- `.developing-skills/refactored-skills/use-hivemind-delegation/scripts/hm-artifact-create.sh`

## Canonical Naming Pattern

All dated workflow artifacts follow:

`{category}-{semantic-id}-{YYYY-MM-DD}.{ext}`

### Field Definitions

| Part | Meaning | Rules |
| --- | --- | --- |
| `category` | artifact class | lowercase kebab-case |
| `semantic-id` | artifact intent | lowercase kebab-case, descriptive |
| `YYYY-MM-DD` | UTC date | required for dated artifacts |
| `ext` | real file type | `json`, `md`, `sh`, `txt`, etc. |

### Valid Examples

- `plan-substantive-expansion-2026-03-29.md`
- `delegation-research-packet-2026-03-29.json`
- `verification-gate-batch1-2026-03-29.md`
- `review-skill-pack-audit-2026-03-29.md`
- `tdd-red-schema-check-2026-03-29.md`
- `research-sdk-surface-2026-03-29.json`

### Invalid Examples

- `plan.md`
- `plan-substantive-expansion.md`
- `Plan-Substantive-Expansion-2026-03-29.md`
- `misc-stuff-2026-03-29.md`
- `verification_gate_batch1_2026_03_29.md`

## Category Guidance

| Category | Directory | Typical Producer |
| --- | --- | --- |
| `plan` | `.hivemind/activity/plans/` or `.hivemind/activity/planning/` | planning skills |
| `delegation` | `.hivemind/activity/delegation/` | delegation skills or orchestrators |
| `handoff` | `.hivemind/activity/handoff/` | handoff workflows |
| `audit` | `.hivemind/activity/audit/` | audit and review agents |
| `review` | `.hivemind/activity/review/` | review skills |
| `research` | `.hivemind/activity/research/{batch_id}/` | research skills |
| `spec` | `.hivemind/activity/specs/` | spec-driven skills |
| `synthesis` | `.hivemind/activity/synthesis/` | synthesis skills |
| `tdd` | `.hivemind/activity/tdd/{phase}/` | TDD skills |
| `verification` | `.hivemind/activity/verification/` | verification agents |
| `codescan` | `.hivemind/activity/codescan/{pass_id}/` | codemap or scan agents |
| `session` | `.hivemind/activity/sessions/` | continuity or git-memory skills |

## Timestamp Rules

- File date stamp: `YYYY-MM-DD`
- JSON timestamps: UTC ISO 8601 with timezone
- Preferred precision: seconds
- Example: `2026-03-29T12:34:56Z`

## _meta Schema

All JSON artifacts must include:

```json
{
  "_meta": {
    "created_at": "2026-03-29T12:34:56Z",
    "updated_at": "2026-03-29T12:34:56Z",
    "producer": "use-hivemind-context",
    "producer_version": "1.0.0",
    "parent_packet_id": "batch-5-activity-protocol"
  }
}
```

## _meta Field Descriptions

| Field | Required | Description |
| --- | --- | --- |
| `_meta.created_at` | Yes | first write time in UTC |
| `_meta.updated_at` | Yes | last modification time in UTC |
| `_meta.producer` | Yes | stable producer identifier |
| `_meta.producer_version` | No | version of the producing skill, tool, or script |
| `_meta.parent_packet_id` | No | upstream batch, delegation packet, or request ID |

## Producer Attribution Rules

1. Every JSON artifact must identify its producer.
2. The producer should be the skill or agent that logically owns the artifact.
3. If a generic helper script writes an artifact for a skill, the skill remains the preferred producer.
4. Packet IDs are valid when the packet itself is the primary unit of work.

## Producer Attribution Table

| Producer | Typical Artifact Types | Directory |
| --- | --- | --- |
| `use-hivemind` | session bootstrap notes, routing artifacts | `sessions/`, `delegation/` |
| `use-hivemind-context` | context health checks, trust reports | `audit/`, `verification/`, `sessions/` |
| `use-hivemind-delegation` | delegation packets, return contracts | `delegation/`, `handoff/` |
| `use-hivemind-planning` | master plans, decomposition outputs | `plans/`, `planning/` |
| `use-hivemind-tdd` | red/green/refactor evidence | `tdd/`, `verification/` |
| `use-hivemind-research` | research packets, evidence tables | `research/`, `synthesis/` |
| `use-hivemind-git-memory` | continuity snapshots, anchors | `sessions/` |
| `use-hivemind-skill-authoring` | skill audit notes, authoring records | `audit/`, `review/` |
| `hivemind-gatekeeping` | gate results, loop checkpoints | `verification/`, `synthesis/` |
| `hivemind-architecture` | ADRs, blueprint artifacts | `specs/`, `planning/` |
| `hivemind-execution` | execution evidence, dependency audits | `verification/`, `codescan/` |
| `hivemind-refactor` | refactor evidence, rollback notes | `review/`, `verification/` |
| `hivemind-spec-driven` | specs, traceability records | `specs/`, `verification/` |
| `hivemind-synthesis` | synthesis summaries, consolidated findings | `synthesis/` |
| `hivemind-patterns` | pattern review notes | `review/`, `specs/` |
| `hivemind-system-debug` | debug reports, remediation evidence | `audit/`, `verification/` |
| `hivemind-codemap` | code scans, seam inventories | `codescan/`, `synthesis/` |
| `hivemind-atomic-commit` | commit gate results, rollback plans | `verification/`, `handoff/` |
| `hivemaker` | implementation evidence | `agents/{agent_name}/{pass_id}/`, `verification/` |
| `hiveq` | verification summaries | `verification/`, `review/` |

## Path Resolution Rules

Use `.hivemind/pathing/active-paths.json` as the canonical lookup for shared path roots.

### Required Behavior

1. Read the path registry before hardcoding activity paths.
2. Use the registry path that matches the artifact class.
3. Create missing subdirectories only under canonical parents.
4. Do not invent new top-level activity roots.

## Ghost Directory Prevention Rules

Ghost directories are references to directories that do not exist and are not created by the producing code.

Skills must NOT:

- reference directories that are absent and unmanaged
- emit output paths that point to speculative folders
- claim artifacts were stored in paths never created
- split one artifact class across conflicting authority paths without explicit governance

Skills must:

1. resolve the parent path from `active-paths.json`
2. ensure the parent exists before writing
3. create only the minimal required child directory
4. record the real output path in any return contract

## JSON Validation Rules

Validate every JSON artifact for:

1. valid JSON syntax
2. top-level `_meta` object
3. `_meta.created_at`
4. `_meta.updated_at`
5. `_meta.producer`
6. absence of unfinished placeholder markers in the artifact body

### Quick Validation Procedure

1. run `bash .developing-skills/refactored-skills/use-hivemind-delegation/scripts/hm-artifact-validate.sh {path}`
2. if validation fails, inspect the diagnostic output
3. fix metadata, naming, or placeholder issues
4. rerun until exit code `0`

## Naming Validation Rules

A valid filename should:

- include a trailing `-YYYY-MM-DD`
- use lowercase kebab-case before the date
- end with the correct extension

Suggested regex:

```text
^[a-z0-9]+(?:-[a-z0-9]+)*-[0-9]{4}-[0-9]{2}-[0-9]{2}\.[a-z0-9]+$
```

## Update Semantics

When rewriting a JSON artifact:

1. do not reset `created_at`
2. always refresh `updated_at`
3. change `producer` only if ownership has clearly changed
4. preserve `parent_packet_id` where lineage still applies

## Cleanup Procedures

### Archiving Old Artifacts

1. keep current active artifacts in canonical directories
2. move superseded artifacts into an archive path only when the workflow explicitly supports archival
3. preserve filenames when archiving when possible
4. do not destroy evidence that may still be needed for verification

### Validating Naming During Cleanup

Before archiving or retaining artifacts:

1. confirm the filename remains protocol-compliant
2. confirm the file still belongs to the directory category
3. confirm JSON metadata remains intact after moves
4. update any indexes or path references if required

### Safe Cleanup Boundaries

Do not remove:

- latest active verification evidence
- current delegation packets still in flight
- current session continuity records
- most recent synthesis outputs for an active workflow

## Skill Author Checklist

Before a skill claims protocol compliance, confirm:

- output path resolves from `active-paths.json`
- filename follows the canonical pattern
- JSON artifacts include `_meta`
- `producer` is populated
- no ghost paths are referenced
- validation command succeeds

## Recommended Integration Pattern

1. resolve target directory
2. create directory if missing
3. generate protocol-compliant filename
4. seed `_meta` for JSON artifacts
5. write content
6. validate artifact
7. return the real path in the packet or report

## Shared Assets

| Asset | Path | Purpose |
| --- | --- | --- |
| protocol | `.hivemind/activity/PROTOCOL.md` | canonical activity rules |
| path registry | `.hivemind/pathing/active-paths.json` | resolved output roots |
| meta template | `.developing-skills/refactored-skills/use-hivemind-delegation/templates/artifact-meta.json` | reusable `_meta` seed |
| validator | `.developing-skills/refactored-skills/use-hivemind-delegation/scripts/hm-artifact-validate.sh` | artifact compliance check |
| creator | `.developing-skills/refactored-skills/use-hivemind-delegation/scripts/hm-artifact-create.sh` | artifact filename and metadata creation |

## Compliance Summary

If a skill or agent produces activity artifacts, it is compliant only when:

- naming is correct
- paths are canonical
- JSON metadata is complete
- producer attribution is explicit
- validation passes
