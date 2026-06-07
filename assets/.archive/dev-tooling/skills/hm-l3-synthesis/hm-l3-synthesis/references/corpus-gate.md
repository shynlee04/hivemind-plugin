# Corpus Gate

Corpus assembly procedures, quality scoring thresholds, and anti-patterns for pattern classification. The corpus gate prevents classification with insufficient evidence.

---

## Minimum Corpus Requirements

| Requirement | Threshold | Rationale |
|-------------|-----------|-----------|
| Repos analyzed | ≥ 3 | Eliminates single-project bias |
| Artifacts extracted | ≥ 10 | Ensures pattern diversity |
| Organizations covered | ≥ 2 | Avoids org-specific conventions |
| Languages represented | ≥ 1 | Minimum viable (ideally 2+) |
| Framework diversity | ≥ 2 styles | Monolith, microservices, serverless, CLI, library |

### Why These Thresholds

Single-repo analysis produces **project conventions**, not **patterns**. A pattern must appear independently in at least 2 unrelated codebases. Three repos provides triangulation; two orgs eliminates corporate style guides from the signal.

---

## Quality Scoring Thresholds

Absorbed from skill-synthesis quality-matrix. Apply these thresholds to each artifact in the corpus before admitting it.

### Artifact Quality Scale

| Score | Rating | Definition |
|-------|--------|------------|
| 5 | Excellent | Complete, well-structured, representative |
| 4 | Good | Minor gaps, still representative |
| 3 | Acceptable | Meets minimum requirements |
| 2 | Needs Work | Significant gaps, weak signal |
| 1 | Poor | Incomplete or misleading |

### Admission Gate

| Metric | Threshold | Action if Below |
|--------|-----------|-----------------|
| Mean artifact quality | ≥ 3.5 | Reject corpus. Expand search. |
| Minimum artifact quality | ≥ 2 | Remove low-quality artifacts. Replace. |
| Pattern uniqueness | ≥ 70% non-overlapping | Deduplicate. Add more repos. |
| Recency | ≤ 2 years old | Exclude stale artifacts. Add fresh repos. |

---

## Corpus Assembly Procedure

### Step 1: Define Search Scope

Identify the target domain and constraints:

```
Domain: [e.g., "TypeScript plugin systems"]
Language: [e.g., "TypeScript, Python"]
Scale: [e.g., "10-500 LOC modules"]
Context: [e.g., "CLI tools, build systems"]
```

### Step 2: Discover Candidate Repos

```bash
# GitHub search for repos with SKILL.md or skill-like structures
websearch "site:github.com <domain> <language> SKILL.md"

# Trending repos in target language
websearch "github trending <language> <domain>"

# Organization repos for diversity
websearch "site:github.com <org-name>/<project> <domain>"
```

### Step 3: Pack and Extract

```bash
# Pack each candidate repo
repomix --remote <owner/repo> \
  --include "**/*.md,**/*.ts,**/package.json" \
  --output /tmp/corpus-<repo-slug>.xml

# Extract artifacts from packed output
grep -n "export\|module\|class\|interface" /tmp/corpus-<repo-slug>.xml \
  > /tmp/artifacts-<repo-slug>.txt
```

### Step 4: Score and Admit

For each extracted artifact:

1. Count lines of code (LOC)
2. Count import dependencies
3. Verify module boundary clarity
4. Score against quality scale (1-5)
5. Accept if score ≥ 3, reject if below

### Step 5: Validate Corpus

Run the gate:

| Check | Command | Pass Condition |
|-------|---------|----------------|
| Repo count | `ls /tmp/corpus-*.xml \| wc -l` | ≥ 3 |
| Artifact count | `cat /tmp/artifacts-*.txt \| wc -l` | ≥ 10 |
| Org diversity | `grep -h "owner" /tmp/corpus-*.xml \| sort -u \| wc -l` | ≥ 2 |
| Mean quality | Manual scoring | ≥ 3.5 |

---

## Auto-Discovery Heuristics

### GitHub Search Strategies

| Strategy | Query Pattern | Yield |
|----------|--------------|-------|
| **Topic search** | `topic:<domain> language:<lang>` | Targeted, moderate |
| **Dependency graph** | Repos depending on `<framework>` | High relevance |
| **Fork analysis** | Popular forks of popular repos | Variant patterns |
| **Org enumeration** | Known orgs in domain → list repos | High quality, low diversity |
| **Trending scan** | GitHub trending + language filter | Fresh, varied quality |

### Deduplication Rules

After discovery, remove duplicates before assembly:

| Signal | Dedup Rule |
|--------|------------|
| Same org, same module structure | Keep one, note as org variant |
| Fork with no structural changes | Discard fork |
| Same pattern, different language | Keep both for language diversity |
| Same pattern, different scale | Keep both for scale diversity |

---

## Diversity Matrix

Track diversity across these axes. Fill every row before declaring corpus complete.

| Axis | Minimum | Ideal | Current |
|------|---------|-------|---------|
| **Language** | 1 | 3+ | ___ |
| **Framework** | 2 styles | 4 styles | ___ |
| **Org size** | 2 tiers (indie, enterprise) | 3 tiers | ___ |
| **Architecture** | 2 patterns | 4 patterns | ___ |
| **Module size** | 2 bands (<200 LOC, >200 LOC) | 3 bands | ___ |
| **Dependency depth** | 2 levels (leaf, mid) | 3 levels | ___ |

### Architecture Styles to Cover

| Style | Detection Pattern | Example |
|-------|-------------------|---------|
| **Monolith** | Single deployable, internal imports only | Express.js app |
| **Microservices** | Multiple deployables, API boundaries | gRPC services |
| **Plugin** | Extension points, hook registration | Webpack plugin, OpenCode plugin |
| **Library** | Public API surface, no runtime entry | npm package |
| **CLI** | Command parser, stdin/stdout | Commander.js app |
| **Serverless** | Function handlers, event triggers | AWS Lambda |

---

## Validation Failure Triage

When the corpus gate fails, triage by failure type:

| Failure | Detection | Resolution |
|---------|-----------|------------|
| **Insufficient repos** | Repo count < 3 | Expand search: add GitHub trending, related orgs, language-specific repos. Use auto-discovery heuristics above. |
| **Insufficient artifacts** | Artifact count < 10 | Widen scope: include test files, config patterns, build scripts. Lower the minimum LOC threshold. |
| **Single-org bias** | All repos from one org | Add repos from different organizations or community projects. Search `awesome-<domain>` lists. |
| **Low quality artifacts** | Mean quality < 3.5 | Remove artifacts scoring ≤ 2. Replace with higher-quality repos. Prioritize well-documented projects. |
| **Pattern exhaustion** | No new patterns after 20 artifacts | Stop classification. Document what you have. Flag for manual review. |
| **Stale corpus** | Newest artifact > 2 years old | Search for actively maintained repos. Filter by recent commit activity. |

### Triage Escalation Path

```
Gate fails
  |
  +-- Single failure → Apply specific resolution → Re-validate
  |
  +-- Multiple failures → Address in order: repos → orgs → artifacts → quality
  |
  +-- Persistent failure after 2 attempts → Stop. Produce gap report.
```

---

## Gap Report Template

When the corpus gate cannot pass after triage, produce this report:

```markdown
# Corpus Gap Report

**Date:** YYYY-MM-DD
**Domain:** [target domain]
**Status:** INSUFFICIENT

## Current Corpus
| Metric | Required | Actual | Gap |
|--------|----------|--------|-----|
| Repos | ≥ 3 | X | ±Y |
| Artifacts | ≥ 10 | X | ±Y |
| Orgs | ≥ 2 | X | ±Y |
| Mean Quality | ≥ 3.5 | X.X | ±Y |

## Attempted Remediation
1. [What was tried]
2. [What was tried]

## Blocking Issue
[Why corpus cannot reach threshold]

## Recommendation
- [ ] Expand search to related domains
- [ ] Lower quality threshold (with justification)
- [ ] Manual artifact selection
- [ ] Abort classification, proceed with documentation-only output
```

---

## Anti-Patterns

| Anti-Pattern | Detection | Fix |
|-------------|-----------|-----|
| **Cherry-picking** | Only high-quality repos selected, no variation | Include moderate-quality repos for realism |
| **Confirmation bias** | All repos confirm the same pattern | Add repos from different architecture styles |
| **Stale corpus** | Artifacts from abandoned repos | Verify recent commit activity (`git log -1 --format="%cs"`) |
| **Scope creep** | Corpus grows past domain boundaries | Define domain boundary upfront, reject out-of-scope repos |
| **Force classification** | Proceeding despite gate failure | Produce gap report. Never classify with thin evidence. |
| **One-language tunnel vision** | All repos in same language when domain is language-agnostic | Deliberately add repos in a second language |
