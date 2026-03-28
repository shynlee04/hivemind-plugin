# Activity Folder Protocol

## Purpose

This protocol defines the canonical structure, naming, attribution, and validation rules for runtime and workflow artifacts stored under `.hivemind/activity/`.

Use this document when creating:

- plans
- delegation packets
- handoff contracts
- review outputs
- verification reports
- research artifacts
- TDD evidence
- per-agent evidence bundles

This protocol is the authority for artifact naming and metadata.

## Naming Convention

All activity files MUST follow:

`{category}-{semantic-id}-{YYYY-MM-DD}.{ext}`

Examples:

- `plan-substantive-expansion-2026-03-29.md`
- `delegation-research-packet-2026-03-29.json`
- `verification-gate-batch1-2026-03-29.md`

## Naming Rules

1. `category` is the artifact class.
2. `semantic-id` is a human-readable identifier for the artifact purpose.
3. `YYYY-MM-DD` is the UTC file date.
4. `ext` matches the real file format.
5. Use lowercase kebab-case for `category` and `semantic-id`.
6. Do not embed spaces.
7. Do not use generic names such as `temp`, `notes`, or `misc`.
8. Do not omit the date stamp for dated workflow artifacts.

## Recommended Categories

| Category | Use For |
| --- | --- |
| `plan` | scoped plans |
| `delegation` | delegation packets and returns |
| `handoff` | handoff contracts |
| `verification` | verification evidence |
| `review` | review outputs |
| `research` | research results |
| `spec` | specifications |
| `synthesis` | synthesized findings |
| `audit` | audit reports |
| `tdd` | red/green/refactor evidence |
| `session` | continuity and resume records |
| `codescan` | scan outputs |

## Semantic ID Rules

Semantic IDs should describe intent, not chronology.

Good examples:

- `batch-5-activity-protocol`
- `context-rot-check`
- `phase-1-contract-audit`
- `red-failing-schema-test`

Bad examples:

- `file1`
- `new-doc`
- `latest`
- `stuff`

## Timestamps

- All timestamps: ISO 8601 format (YYYY-MM-DDTHH-mm-ssZ)
- Filename dates: YYYY-MM-DD
- JSON fields: ISO 8601 with timezone
- Runtime should emit UTC timestamps
- Prefer second-level precision for JSON metadata

Canonical JSON example:

`2026-03-29T12:34:56Z`

## _meta Schema (ALL JSON files)

```json
{
  "_meta": {
    "created_at": "ISO8601",
    "updated_at": "ISO8601",
    "producer": "{skill_or_agent_name}",
    "producer_version": "string (optional)",
    "parent_packet_id": "string (optional)"
  }
}
```

## _meta Field Rules

| Field | Required | Rule |
| --- | --- | --- |
| `_meta.created_at` | Yes | UTC creation time |
| `_meta.updated_at` | Yes | UTC last update time |
| `_meta.producer` | Yes | skill, agent, or packet identifier |
| `_meta.producer_version` | No | semantic version or bundle version |
| `_meta.parent_packet_id` | No | upstream packet or orchestration ID |

## JSON Artifact Requirements

Every JSON artifact MUST:

1. include a top-level `_meta` object
2. populate `created_at`
3. populate `updated_at`
4. populate `producer`
5. use valid JSON syntax
6. avoid placeholder text that implies unfinished work

## Hierarchy

```text
.hivemind/activity/
├── agents/{agent_name}/{pass_id}/     # Per-agent outputs
├── audit/                             # Audit reports
├── codescan/{pass_id}/                # Code scan outputs
├── delegation/                        # Delegation packets + returns
├── handoff/                           # Handoff contracts
├── planning/                          # Plan files
├── plans/                             # Master plans
├── research/{batch_id}/               # Research batches
├── review/                            # Review outputs
├── sessions/                          # Session continuity
├── specs/                             # Specifications
├── synthesis/                         # Synthesis outputs
├── tdd/{red|green|refactor}/          # TDD evidence
└── verification/                      # Verification reports
```

## Directory Rules

1. Write artifacts only into protocol-approved directories.
2. Create directories on demand.
3. Do not reference ghost directories that do not exist.
4. Do not invent alternative authority paths for the same artifact class.
5. Prefer resolved paths from `.hivemind/pathing/active-paths.json`.

## Producer Attribution

Every JSON artifact MUST include `_meta.producer` identifying which skill/agent created it.

Accepted producer forms:

- skill name: `use-hivemind-context`
- agent name: `hivemaker`
- packet name: `batch-5-activity-protocol`
- script name when acting as producer: `hm-artifact-create.sh`

## Producer Attribution Rules

1. Producers must be stable identifiers.
2. If a script writes on behalf of a skill, prefer the skill name.
3. If a batch or packet creates the artifact directly, use the packet ID.
4. Do not leave producer blank.

## Validation Expectations

Artifact validation should confirm:

- filename date stamp is present
- JSON metadata is complete
- producer attribution exists
- placeholder markers are absent
- directory placement matches artifact purpose

Use the shared validation helper where appropriate.

## Update Rules

When updating an existing JSON artifact:

1. preserve `created_at`
2. refresh `updated_at`
3. preserve `producer` unless ownership explicitly changes
4. preserve `parent_packet_id` unless the linkage changes

## Markdown Artifact Rules

Markdown artifacts should:

- use the naming convention when date-stamped workflow output
- explain scope and purpose in the opening section
- avoid ambiguous filenames
- prefer stable headings for later grep and review

## Shell Script Rules

Helper scripts under shared references should:

- be executable
- use defensive Bash patterns
- emit clear failure diagnostics
- exit non-zero on validation failures

## Cleanup Guidance

1. Archive stale artifacts instead of deleting authoritative evidence.
2. Keep latest active artifacts in the canonical directories.
3. Move superseded artifacts to clearly labeled archive paths when the workflow supports it.
4. Never overwrite evidence without updating metadata.

## Conflict Resolution

If this protocol conflicts with stale notes or ad hoc scripts:

1. trust this protocol
2. verify the path in `active-paths.json`
3. normalize the artifact to the canonical naming pattern

## Compliance Checklist

Before closing work, confirm:

- artifact path is canonical
- filename is date-stamped
- JSON metadata is complete
- producer attribution is present
- no placeholder markers remain
- validation has been run when applicable
