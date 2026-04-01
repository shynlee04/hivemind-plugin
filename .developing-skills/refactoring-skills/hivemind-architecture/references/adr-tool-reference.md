# ADR Tool Reference

## Use the Smallest Tool That Produces Hard Evidence

| Task | Preferred Tool | Why |
| --- | --- | --- |
| Inspect current boundaries | `read` | Exact source context |
| Search existing ADR mentions | `grep` | Fast cross-file evidence |
| Locate architecture files | `glob` | File discovery without content noise |
| Check runtime/build evidence | `bash` | Real command output |
| Trace symbol ownership | `lsp` | Semantic definitions and references |
| Fetch vendor docs | `webfetch` | Stable URL retrieval |
| Fetch library docs | `context7_query-docs` | Version-specific examples |

## ADR Workflow

1. Read the current architecture surface.
2. Grep for prior ADRs, plan files, and rejected approaches.
3. Capture command evidence (`tsc`, tests, build, perf probes) before claiming impact.
4. Draft the ADR with context, decision, consequences, and alternatives.
5. Link every important claim to either source code, command output, or external docs.

## Bash Evidence Examples

```bash
git log --oneline -- docs/ src/ | head -10
npx tsc --noEmit 2>&1 | head -10
npm test -- architecture 2>&1 | head -20
```

## Evidence Minimums

- One code reference
- One command or test reference
- One alternative considered
- One explicit consequence statement

## Common Mistakes

- Writing ADRs from memory instead of source reads
- Choosing a pattern without documenting the rejected alternative
- Claiming "future scalability" without measurable load or change-rate evidence
