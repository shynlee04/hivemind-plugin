# Results Format

Structured output specification for HiveMind research findings. All research agents must produce results in this format for downstream consumption and aggregation.

## Required Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `source` | string | Yes | Origin of the finding (repo name, doc URL, commit SHA) |
| `finding` | string | Yes | The discovered fact or conclusion |
| `confidence` | enum | Yes | `confirmed` / `inferred` / `unverified` |
| `evidence_path` | string | Yes | Relative path to supporting artifact |
| `timestamp` | ISO 8601 | Yes | When the finding was captured |

### Confidence Levels

| Level | Meaning | Survives Rollback? |
|-------|---------|-------------------|
| `confirmed` | Verified against authoritative source | Yes |
| `inferred` | Logical conclusion from confirmed data | Conditionally |
| `unverified` | Single-source or untested claim | No |

## TSV Template

Tab-separated format for flat result lists. Best for batch processing and tool integration.

```tsv
source	finding	confidence	evidence_path	timestamp
https://github.com/org/repo/blob/main/README.md	Library X supports feature Y since v2.0	confirmed	evidence/library-x-features.md	2026-03-28T10:00:00Z
https://docs.example.com/api/v2	API endpoint returns 429 on rate limit	inferred	evidence/api-rate-limits.md	2026-03-28T10:05:00Z
commit:abc123	Function Z is deprecated in favor of W	confirmed	evidence/deprecation-notes.md	2026-03-28T10:10:00Z
```

**Rules:** Header row required. Tab-delimited, no tabs in values. Single-line findings only. All fields mandatory.

## JSON Template

Structured format for rich result sets. Best for multi-agent aggregation.

```json
{
  "meta": {
    "thread_id": "thread-2026-03-28-001",
    "research_type": "comparison",
    "agent": "hiverd",
    "created_at": "2026-03-28T09:00:00Z"
  },
  "findings": [
    {
      "source": "https://github.com/org/repo/blob/main/README.md",
      "finding": "Library X supports feature Y since v2.0",
      "confidence": "confirmed",
      "evidence_path": "evidence/library-x-features.md",
      "timestamp": "2026-03-28T10:00:00Z"
    }
  ]
}
```

**Rules:** `meta` block required. `findings` array must have at least one entry. Flat list only — no nested finding arrays.

## Aggregation Rules

When combining results from parallel research agents:

1. **Merge by finding, not by file.** Aggregate by comparing `finding` content across agent outputs.
2. **Highest confidence wins.** Same finding at different confidence levels → keep highest (`confirmed` > `inferred` > `unverified`).
3. **Union sources.** Same fact from different sources → single finding with both sources listed.
4. **Preserve thread attribution.** Each finding retains its `thread_id` after aggregation.

Example: Agent A finds "useEffect cleanup runs on unmount" at `confirmed` from `docs.react.dev`. Agent B finds the same at `inferred` from `blog.example.com`. Result: single finding, confidence `confirmed`, source `docs.react.dev, blog.example.com`.

## Deduplication Rules

| Scenario | Rule |
|----------|------|
| Exact match on `finding` text | Merge into one entry, union sources |
| Semantic match (same fact, different wording) | Keep the more precise wording, union sources |
| Contradictory findings | Keep both, flag contradiction, lower confidence to `unverified` |
| Same source, different timestamps | Keep the most recent |

### Dedup Algorithm

1. Normalize `finding` text (lowercase, strip punctuation).
2. Group findings by normalized text.
3. Select entry with highest confidence per group.
4. Merge `source` fields from all group entries.
5. Use earliest `timestamp` from the group.
