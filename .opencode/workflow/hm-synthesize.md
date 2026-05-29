---
description: "Synthesis workflow: collect research → cross-reference → confidence scoring → gap analysis → SUMMARY.md."
---

# hm-synthesize

## Goal
Combine outputs from parallel research agents into a single consolidated SUMMARY.md with cross-referenced findings, confidence assessments, and gap analysis.

## Agent Routing Table
| Role | Agent | Responsibility |
|------|-------|---------------|
| Synthesis | hm-synthesizer | Collects, cross-references, and consolidates research outputs |

## Execution Phases
1. **Collect Research**: Read all research artifact files from the specified directory (default: .planning/research/).
2. **Cross-Reference Findings**: Map related findings across different research documents. Identify contradictions or conflicts.
3. **Confidence Scoring**: Assign confidence level (HIGH/MEDIUM/LOW) per finding based on evidence quality, source reliability, and corroboration.
4. **Gap Analysis**: Identify topics with insufficient coverage or contradictory evidence. Note as gaps for further investigation.
5. **Write SUMMARY.md**: Produce consolidated summary with sections: Executive Summary, Key Findings (scored), Cross-References, Gaps & Risks, Recommendations.

## Exit Criteria
- SUMMARY.md written with all findings cross-referenced.
- Each finding has a confidence score.
- Gap analysis identifies areas needing further research.
- Recommendations prioritize next steps.
