# Skill Inventory — Synthesis Summary

**Date:** 2026-04-09  
**Source:** Full read of 22 SKILL.md files in `.hivefiver-meta-builder/skills-lab/active/refactoring/`

---

## Bottom Line

| Metric | Value |
|--------|-------|
| **Total Skills** | 22 |
| **PASS** | 11 (50%) |
| **FLAG** (refactor needed) | 7 (32%) |
| **BLOCK** (remove/rewrite) | 1 (5%) |
| **PASS with description fix** | 3 (14%) |

## The 3 Must-Do Actions (P0)

1. **Delete `oh-my-openagent-reference`** — not a skill, just a file index
2. **Merge `agent-authorization` → `agents-and-subagents-dev`** — 70% overlap, same domain
3. **Merge or clearly differentiate `command-parser` ↔ `command-dev`** — parser is a subset of command dev

## The Systemic Fix (P2 — one pass fixes all)

Add standardized frontmatter to ALL skills:
```yaml
metadata:
  lineage: "meta-builder" | "project-specific"
  hierarchy: "coordinator" | "sub-session"
  orientation: "how-to-process" | "how-to-implement"
```

## Description Rewrites Needed (8 skills)

These skills have generic/AI-written descriptions that will cause runtime picking failures:
- `agent-authorization`
- `agents-and-subagents-dev` (too broad)
- `harness-delegation-inspection` (two skills in one)
- `phase-loop`
- `session-context-manager`
- Plus 3 more with minor issues

## Overlap Hotspots

| Hotspot | Skills Involved | Fix |
|---------|:---:|------|
| Agent creation + permissions | 2 | Merge |
| Command anatomy + $ARGUMENTS parsing + shell safety | 3 | Merge into 1 or differentiate |
| Session state persistence | 2 | Merge or differentiate |
| Multi-agent orchestration | 2 | Clarify boundary (already has cross-refs) |

## Full Report

See `skill-inventory-diagnosis.md` for per-skill analysis, anatomy checks, hierarchy alignment, Group 1/2 classification, body quality assessment, and refactoring priority list.
