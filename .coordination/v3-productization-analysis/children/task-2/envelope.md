## Task
Inspect current runtime code and tests to map actual implemented capabilities into potential user-facing configurable surfaces, plus identify schema, validation, and test seams for generated config.

## Scope
- Include: src/plugin.ts; src/hooks/**; src/lib/**; src/schema-kernel/**; src/tools/**; tests/**
- Exclude: .hivefiver-meta-builder/** except when code directly depends on it

## Context
The user wants design/productization analysis, not implementation. We need to know what truly exists in the V3 runtime today: lifecycle, continuity, categories, background tasks, delegation packets, hooks, schema kernel, prompt-enhance patterns, and how tests verify these surfaces.

## Expected Output
- Status: DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED
- Mapping from implemented runtime features to candidate config knobs or user-facing setup decisions
- Notes on which code areas are plugin-specific vs reusable SDK/foundation surfaces
- Recommended schema/test-validation hooks, with file references

## Verification
- Inspect both implementation and corresponding tests where they exist
- Cite concrete files for every claimed capability or validation seam
