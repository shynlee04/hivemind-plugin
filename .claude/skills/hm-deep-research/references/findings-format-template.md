# Findings Format Template

Stage 2 and Stage 3 output. One file per stage or per subagent. Copy this template and fill with actual findings.

---

```markdown
# Findings: [Stage/Agent Name]

Research Question: [from research-plan.md]
Date: [YYYY-MM-DD]
Context Budget Used: [approximate tokens or percentage]

---

## Finding 1: [Title]

**Hypothesis**: [which hypothesis this addresses]
**Status**: [Confirmed | Partially Confirmed | Refuted | Deferred]
**Confidence**: [High | Medium | Low]

[2-5 sentence description of what was found]

**Claim**: [specific factual claim]
**Evidence**: [Direct | Correlational | Testimonial | Absence]
**Source**: [URL or file path]
**Confidence**: [High | Medium | Low]

[Optional: additional claims with evidence blocks]

**Gap**: [what's still unknown, or "None"]
**Contradicts**: [Finding N or "None"]

---

## Finding 2: [Title]

**Hypothesis**: [which hypothesis this addresses]
**Status**: [Confirmed | Partially Confirmed | Refuted | Deferred]
**Confidence**: [High | Medium | Low]

[2-5 sentence description]

**Claim**: [specific factual claim]
**Evidence**: [Direct | Correlational | Testimonial | Absence]
**Source**: [URL or file path]
**Confidence**: [High | Medium | Low]

**Gap**: [what's still unknown, or "None"]
**Contradicts**: [Finding N or "None"]

---

## Finding 3: [Title]

[Continue pattern for each hypothesis]

---

## Unresolved Hypotheses

| Hypothesis | Status | Reason |
|-----------|--------|--------|
| [hypothesis text] | Deferred | [reason: budget, tool limit, source unavailable] |

---

## Queries Attempted

| # | Tool | Query | Result |
|---|------|-------|--------|
| 1 | tavily-search | "..." | 3 relevant, 2 irrelevant |
| 2 | Context7 | "..." | Direct docs found |
| 3 | grep | "..." | 5 matches in 3 files |
```
