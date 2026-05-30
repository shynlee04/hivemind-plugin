# Source Evaluation Template

Use this template after source discovery and before synthesis. One row per source.

| Source | Type | Authority | Freshness | Evidence reviewed | Bias / limitation | Use decision |
|---|---|---|---|---|---|---|
| [URL or repo path] | official docs / source / registry / article / example | high / medium / low | date, version, or commit | SKILL.md, references, examples, scripts, code, docs | [known caveat] | adopt / adapt / reject / defer |

## Authority Rules

1. Prefer official docs, source code, release notes, and maintained package repositories over summaries.
2. Treat registry pages as discovery evidence only until the underlying package contents are reviewed.
3. Mark inaccessible packages as `BLOCKED`; do not infer quality from install count or snippets.
4. For version-sensitive APIs, record the version or commit that was inspected.

## Output Requirement

Copy the completed table into the final research artifact or link to the persisted file.
