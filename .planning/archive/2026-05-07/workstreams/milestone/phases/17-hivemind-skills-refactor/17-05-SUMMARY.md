# 17-05 Summary: Unify .tech-registry.json Schema Across hm-* Skills

**Status:** Complete
**Date:** 2026-04-23

## What Was Done

Resolved schema drift between `hm-detective` (stack/modules/concerns) and `hm-synthesis` (version/technologies/patterns) by adopting the `hm-detective` schema as canonical, then integrated tech-stack synthesis capabilities across all three `hm-*` skills. This enables cross-skill consumption and persistent tech-stack memory across sessions.

## Tasks Completed

| # | Task | Status | Commit |
|---|------|--------|--------|
| 1 | Unify schema in hm-synthesis artifact-export.md | ✅ Done | 1e3bde8d |
| 2 | Add tech-stack detection to hm-synthesis SKILL.md | ✅ Done | 1e3bde8d |
| 3 | Integrate version-matched research into hm-deep-research + scan mode into hm-detective | ✅ Done | 1e3bde8d |

## Files Changed

- `hm-synthesis/references/artifact-export.md` — unified schema, migration note, updated Update Protocol
- `hm-synthesis/SKILL.md` — Tech-Stack Detection section added
- `hm-deep-research/SKILL.md` — Version-Matched Documentation Research section added
- `hm-deep-research/references/research-patterns.md` — Version-Matched Context7 Queries pattern added
- `hm-detective/SKILL.md` — SCAN (Tech Stack) added as 4th reading mode, decision tree updated
- `hm-detective/references/reading-modes.md` — full SCAN (Tech Stack) procedure, cost budget, cross-skill integration

## Schema Unification Details

**Canonical schema (hm-detective):**
```json
{
  "project": "string",
  "last_updated": "ISO date",
  "stack": { "language", "runtime", "framework", "test_framework", "build_tool" },
  "concerns": { "resolved": [...], "active": [...] },
  "modules": { "path.ts": { "role", "loc", "deps" } }
}
```

**Removed from hm-synthesis:** `"version": 1`, `"technologies"`, `"patterns"` (deprecated with migration note)

## Cross-Skill Integration

| Skill | New Capability | Consumes | Produces |
|-------|---------------|----------|----------|
| hm-detective | SCAN (Tech Stack) reading mode | repo files | `.tech-registry.json` with unified schema |
| hm-synthesis | Tech-Stack Detection section | lockfiles, config files | `.tech-registry.json` with unified schema, repomix `--include` patterns |
| hm-deep-research | Version-Matched Documentation Research | `.tech-registry.json` | version-specific Context7 queries, breaking change flags |

## Verification

- artifact-export.md contains hm-detective schema fields: stack, modules, concerns, last_updated
- artifact-export.md does NOT contain old schema: "version": 1
- hm-synthesis SKILL.md contains "Tech-Stack Detection" or "tech-stack detection"
- hm-synthesis SKILL.md contains package.json / go.mod / Cargo.toml references
- hm-synthesis SKILL.md contains Context7 references
- hm-deep-research SKILL.md contains "Version-Matched" or "version-matched"
- hm-detective SKILL.md contains "Tech Stack Scan" or "scan.*tech stack"
- hm-detective SKILL.md contains package.json / go.mod / Cargo.toml references
- All 3 skills reference `.tech-registry.json` or `tech-registry`

## Self-Check

- [x] All tasks executed
- [x] Each task committed atomically
- [x] SUMMARY.md created
- [x] No modifications to shared orchestrator artifacts
