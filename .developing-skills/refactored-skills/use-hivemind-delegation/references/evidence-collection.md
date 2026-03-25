# Evidence Collection Delegation

## Purpose

Delegate evidence collection to subagents with explicit source requirements and evidence contracts.

## Collection Rules

1. Decompose the research question into sub-questions before delegating
2. Each sub-question is a separate delegation packet
3. One question per child — do not combine questions
4. Child returns evidence items with source, confidence, and grading
5. Contradictions are flagged, not resolved

## Sub-Question Decomposition

Before delegating:
1. Break the main research question into atomic sub-questions
2. Identify which sub-questions are independent (can run in parallel)
3. Identify which sub-questions depend on others (must be sequential)
4. Assign source strategy per sub-question

## Evidence Item Format

Every evidence item must include:

```json
{
  "claim": "The SDK provides tool.schema as a Zod re-export",
  "source": "src/plugin/opencode-plugin.ts:42",
  "source_type": "code | docs | blog | forum | uncited",
  "confidence": "high | medium | low",
  "freshness": "current | recent | stale | unknown",
  "corroborated": true,
  "contradictions": [],
  "context": "Used in tool definitions throughout the codebase"
}
```

## Return Contract

Child returns:

```json
{
  "sub_question": "What hooks does the SDK provide?",
  "evidence_items": [],
  "evidence_count": 5,
  "sources_checked": ["src/plugin/opencode-plugin.ts", "docs/sdk.md"],
  "coverage": "partial | complete",
  "gaps": ["chat.params hook not found in codebase"]
}
```
