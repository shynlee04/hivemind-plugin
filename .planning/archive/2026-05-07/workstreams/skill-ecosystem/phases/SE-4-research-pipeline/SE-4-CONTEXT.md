# Phase SE-4: Research Pipeline Enhancement — CONTEXT

**Workstream:** skill-ecosystem
**Phase:** SE-4
**Depends on:** SE-2 (artifact hierarchy for research artifacts)
**Status:** ✅ COMPLETE (2026-04-29)

## Authorized Decision
Create tech stack ingestion skill and fix the research chain's broken cross-references. No skill currently downloads and caches tech stacks as progressive-disclosure bundled assets.

## Scope (WHAT — locked)

### New Skill
| Skill | Purpose |
|-------|---------|
| hm-tech-stack-ingest | Downloads repos via repomix/deepwiki as bundled assets. Progressive disclosure: `references/tech-stacks/<name>/` with TOC, metadata, version tracking. |

### Cross-Reference Fixes
- hm-research-chain ↔ hm-detective (bidirectional)
- hm-research-chain ↔ hm-deep-research (bidirectional)
- hm-research-chain ↔ hm-synthesis (bidirectional)
- Add cross-architecture research routing to hm-deep-research

## Constraints
- hm-* prefix: shared/cross-over skill
- Progressive disclosure design — tech stack assets loaded on demand, not at skill load
- Must use skill-creator + skill-judge for quality verification

## NOT in Scope
- Modifying hm-detective, hm-deep-research, or hm-synthesis bodies (only cross-references)
- Creating new research skills beyond hm-tech-stack-ingest
