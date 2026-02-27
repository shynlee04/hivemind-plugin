---
name: "meta-builder-governance"
description: "Defines governance for framework-level asset evolution, compatibility windows, and parity enforcement."
triggers:
  - "When changing agents/commands/workflows/skills"
  - "When introducing compatibility deprecations"
version: "1.0.0"
---

# Meta-Builder Governance

## Objective
Keep Sector-2 maintainable while evolving contracts safely.

## Rules
1. Root is source of truth; .opencode is mirror.
2. Introduce deprecations with one compatibility cycle.
3. Enforce parity and contract checks before merge.
