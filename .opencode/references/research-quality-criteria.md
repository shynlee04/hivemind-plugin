# Research Quality Criteria

Standards for evidence quality, citation requirements, and confidence thresholds in HiveRD research outputs.

## Evidence Quality Tiers

### Tier 1: Primary Evidence
- Official documentation from project maintainers
- Source code analysis with file paths and line numbers
- Benchmark results from reproducible tests
- Published RFCs or specifications
- **Usage**: Direct citation with high confidence

### Tier 2: Secondary Evidence
- Technical blog posts from recognized experts
- Conference talks with published slides/recordings
- Well-maintained community wikis (>100 contributors)
- Stack Overflow answers with >50 upvotes and accepted status
- **Usage**: Supporting citation, cross-reference with Tier 1 when possible

### Tier 3: Tertiary Evidence
- Individual developer blog posts
- Forum discussions without accepted answers
- Tutorials without version pinning
- AI-generated content (even if accurate)
- **Usage**: Only when Tier 1/2 unavailable; always flag with confidence caveat

## Citation Requirements

1. **Every factual claim requires a citation** — no exceptions
2. **Citations include**: Source name, URL or file path, date accessed, reliability tier
3. **Multiple citations strengthen confidence**: 2+ Tier 1 sources = high confidence
4. **Contradicting citations must be surfaced**: Never hide disagreements

## Confidence Thresholds

| Level | Criteria | Label |
|-------|----------|-------|
| High | 2+ Tier 1 sources agree, or 1 Tier 1 + 2 Tier 2 corroborate | ✅ High confidence |
| Partial | 1 Tier 1 source, or 2+ Tier 2 sources agree | ⚠️ Partial confidence |
| Low | Only Tier 3 sources, or single unverified source | ❌ Low confidence |

## Research Completeness Checklist

- [ ] All research sub-questions addressed
- [ ] Source inventory with reliability tiers
- [ ] Confidence level assigned to every finding
- [ ] Contradictions documented and resolved (or flagged)
- [ ] Coverage gaps identified with suggested investigation paths
- [ ] Recommendations trace back to specific findings
- [ ] No unattributed factual claims

## Staleness Rules

- Sources > 6 months old: verify against current documentation
- Sources > 18 months old: flag as potentially stale, seek newer alternatives
- Sources > 36 months old: treat as historical context only, not current truth
