# Skill Audit Protocol

**CONDITIONAL LOAD**: When meta-builder-governance is active AND task involves skill maintenance, coverage review, or staleness detection.

> Consolidated from the skill auditor capability. Lineage-agnostic — both hivefiver and hiveminder skill ecosystems should be audited.

## Audit Workflow

1. **Inventory**: List all skills in root `skills/` and mirror directories
2. **Classify**: Map each skill to its bundle and coverage lane
3. **Map**: Cross-reference skills to workflow phases and surfaces
4. **Detect**: Identify overlap, staleness, and missing coverage
5. **Recommend**: Produce remediation actions

## Coverage Lanes

Ensure skills cover ALL operational lanes, not just development:

| Lane | Examples | Coverage Check |
|------|----------|---------------|
| Dev engineering | Code, architecture, testing, deployment | Core — usually well-covered |
| Marketing workflows | Campaigns, content, SEO, growth | Often missing — check |
| Finance/reporting | Budgeting, forecasting, metrics | Often missing — check |
| Office/documentation | Docs, spreadsheets, presentations | Often missing — check |
| Web research/browsing | Discovery, analysis, comparison | Usually partial — check |

## Staleness Detection

| Signal | Staleness Level | Action |
|--------|----------------|--------|
| Last modified > 6 months ago | ⚠️ Aging | Review for relevance |
| References deprecated tools/APIs | 🔴 Stale | Update or retire |
| No triggers in any active workflow | 🔴 Orphaned | Retire or absorb |
| Contradicts current governance | 🔴 Conflicting | Update immediately |
| Version in frontmatter doesn't match content changes | ⚠️ Inconsistent | Update version |

## Overlap Detection

For each skill pair, check:
- Do they have overlapping triggers?
- Do they cover the same domain?
- Do they give contradictory guidance?

**Resolution**: Merge overlapping skills or clearly delineate boundary.

## Discovery Strategy

When gaps are found:

1. **First**: Check if the capability exists in a different bundle
2. **Second**: Check if a reference file could be added to an existing skill
3. **Third**: Use `find-skill` to search for external skills
4. **Fourth**: Use trusted catalogs (e.g., `skills.sh`) with trust review
5. **Last resort**: Create a new skill (via meta-builder governance)

## Audit Report Output

```yaml
skill_audit:
  total_skills: <count>
  by_bundle: { governance-core: N, verification-core: N, ... }
  coverage_gaps: [{ lane: "marketing", missing: [...] }]
  stale_skills: [{ name: "...", reason: "..." }]
  overlapping_pairs: [{ skills: ["a", "b"], overlap: "..." }]
  remediation_actions: [{ action: "merge|retire|update|create", target: "..." }]
```

## Anti-Patterns

| Pattern | Problem |
|---------|---------|
| Dev-only audit | Misses non-dev coverage gaps |
| Skipping staleness | Stale skills give outdated guidance |
| Adding without auditing | Accumulates overlap and bloat |
| Ignoring mirrors | .opencode/ and .agent/ may have drift |
