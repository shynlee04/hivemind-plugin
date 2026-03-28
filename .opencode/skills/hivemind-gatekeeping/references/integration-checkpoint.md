# Integration Checkpoints

## Purpose

Integration checkpoints verify that parallel work products compose correctly after a batch completes. While synthesis gates verify iteration quality and review gates verify phase transitions, integration checkpoints verify that multiple parallel results fit together without conflicts.

## When to Use

| Situation | Checkpoint? |
|-----------|------------|
| After parallel batch completion | Yes |
| Before cross-skill consistency checks | Yes |
| After re-delegating a failed slice | Yes |
| Before committing batch results | Yes |
| After a single sequential task | No — use review gates |
| During iteration loops | No — use synthesis gates |

## Integration Checks

### Cross-Reference Resolution

Every reference in every output file must point to an existing target.

| Check | Method | Failure Action |
|-------|--------|---------------|
| File references exist | Verify each `path` in output matches a real file | Flag missing file, re-delegate slice that references it |
| Skill references exist | Verify each `skill_name` matches a registered skill | Flag orphan reference |
| Template references exist | Verify each template file exists in `templates/` | Flag missing template |
| Test references exist | Verify each test file exists in `tests/` | Flag missing test |

### Bundled Resources Completeness

Every file in `references/`, `templates/`, and `tests/` must be listed in the Bundled Resources table.

1. Scan all files in `references/`, `templates/`, `tests/`
2. Scan all entries in the Bundled Resources table in SKILL.md
3. Every file must have a table entry
4. Every table entry must point to a real file
5. Mismatches in either direction fail the check

### TOC Accuracy

Every section heading must have a TOC entry. Every TOC entry must point to an existing section.

1. Extract all `##` headings from SKILL.md
2. Extract all TOC entries (lines starting with `- [` in the Table of Contents)
3. Verify bidirectional coverage
4. Verify anchor format matches heading text (lowercased, hyphenated)

### YAML Validity

The YAML frontmatter in SKILL.md must have required fields:

| Field | Required | Validation |
|-------|----------|------------|
| `name` | Yes | Matches skill directory name |
| `description` | Yes | Non-empty string, under 200 characters |
| `parent` | Yes | Matches a registered parent skill |

### Line Count Compliance

| File Type | Maximum Lines |
|-----------|--------------|
| SKILL.md | 500 |
| Reference files (`references/`) | 200 |
| Template files (`templates/`) | 100 |
| Test files (`tests/`) | 200 |

Exceeding any limit fails the check. No exceptions.

## Batch Integration Protocol

When verifying a batch of skill changes:

1. **Collect all outputs** — gather every modified and created file across all slices
2. **Run cross-reference check** — verify all references resolve across the entire batch
3. **Run completeness check** — verify Bundled Resources and TOC accuracy
4. **Run YAML check** — verify frontmatter is valid for every modified SKILL.md
5. **Run line count check** — verify no file exceeds its limit
6. **Record results** — write checkpoint result JSON

### Failure Isolation

When the checkpoint fails, identify which specific change caused it:

1. Check each slice's output independently first
2. If a slice passes alone but fails in the batch, the conflict is between slices
3. Identify the two conflicting slices by binary search if needed
4. Re-delegate only the conflicting slice — do not re-delegate the entire batch
5. Record the failure isolation in the checkpoint result for traceability

## Checkpoint Result Format

```json
{
  "checkpoint_id": "batch-3-integration",
  "timestamp": "2026-03-28T12:00:00Z",
  "batch_id": "orchestration-gatekeeping-batch",
  "slices_included": ["review-gate", "integration-checkpoint"],
  "checks": {
    "cross_references": {
      "status": "pass",
      "total_refs": 12,
      "resolved": 12,
      "broken": []
    },
    "bundled_resources": {
      "status": "pass",
      "files_found": 11,
      "table_entries": 11,
      "missing_from_table": [],
      "missing_from_disk": []
    },
    "toc_accuracy": {
      "status": "pass",
      "headings": 14,
      "toc_entries": 14,
      "orphans": []
    },
    "yaml_validity": {
      "status": "pass",
      "fields_present": ["name", "description", "parent"]
    },
    "line_counts": {
      "status": "pass",
      "files_checked": [
        { "path": "SKILL.md", "lines": 356, "limit": 500 },
        { "path": "references/review-gate.md", "lines": 130, "limit": 200 }
      ]
    }
  },
  "checkpoint_result": "pass",
  "failures_isolated_to": []
}
```

## HiveMind Conventions

Integration checkpoints enforce batch-level consistency at the skill surface.

- **Parallel slice verification:** See `references/integration-verification.md` for the full parallel integration protocol
- **Evidence discipline:** Checkpoint results are evidence records. Every check must include concrete counts and paths, not claims
- **Failure isolation pattern:** Follow the binary search protocol in integration-verification.md when a batch-level failure has no obvious single-slice cause

## Storage

Integration checkpoint results are stored at:
- `{activity}/delegation/{batch_id}-integration-checkpoint.json`

## Anti-Patterns

**Re-delegating the entire batch on one failure.** Isolate the conflicting slice first. Re-delegating everything wastes completed work and delays the batch.

**Skipping completeness checks.** A file added to `references/` but not listed in Bundled Resources is invisible to the skill consumer. The table is the contract.

**Ignoring TOC drift.** A section without a TOC entry is unreachable. A TOC entry without a section is misleading. Both erode skill usability.

**Trusting line counts without verification.** "It should be under 500" is not evidence. Run `wc -l` and record the output.
