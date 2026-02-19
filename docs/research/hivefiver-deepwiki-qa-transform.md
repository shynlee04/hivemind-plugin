# HiveFiver DeepWiki QA Transform Guide

Date: 2026-02-19

## Source Inputs
- `docs/opencode-sdk-QA-deepwiki.md`
- `docs/opencode-full-sdk-mechanism.md`
- DeepWiki query URL:
  - https://deepwiki.com/search/with-the-sdk-can-we-change-the_f4ff6e4f-52b5-4bf9-b275-b0ab47ce7e7b?mode=fast

## Actionable Translation for HiveFiver
1. Use message/system transform hooks to shape context while preserving output style.
2. Use silent context injection (`noReply` pattern) to add state between turns.
3. Treat TODO/task updates as first-class flow control for complex execution loops.
4. Keep reminder blocks explicit for stop/continue decisions on long workflows.
5. Carry compaction context for continuity across long sessions.

## HiveFiver Command Impact
- `hivefiver-specforge`: add clarification queue and ambiguity gate.
- `hivefiver-research`: enforce contradiction register + provider status matrix.
- `hivefiver-ralph-bridge`: map TODO/task nodes to export artifacts.
- `hivefiver-doctor`: verify MCP + governance + drift alignment.

## Limits
- No true mid-turn prompt rewrite hook; transformations occur before LLM call.
- Confidence cannot be promoted without corroborated evidence.
