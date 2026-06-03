# Artifact Export Protocol
Persist findings across context compaction. Export before your window closes.

---

## The Problem

Context compaction destroys working memory. If you found it, export it — or lose it.

Three principles:
1. **Export early** — don't wait for "just one more thing"
2. **Export incrementally** — each finding gets its own entry
3. **Export with structure** — raw text is not an artifact

---

## Export Tiers

| Tier | What's Included | When to Use | Size Estimate |
|------|----------------|-------------|---------------|
| Minimal | Findings only (what was discovered) | Quick lookup, single-session | 50-200 lines |
| Standard | Findings + decisions (what was chosen + why) | Multi-session, handoff | 200-500 lines |
| Full | Findings + decisions + raw data (evidence) | Audit trail, compliance | 500-2000+ lines |

### Minimal Export

```markdown
# Export: [Topic] — [Date]

## Findings
- [F1] Finding one (source: file.ts:42)
- [F2] Finding two (source: module/README.md)
- [F3] Finding three (source: grep result, 15 matches)
```

### Standard Export

```markdown
# Export: [Topic] — [Date]

## Findings
- [F1] Finding one (source: file.ts:42)

## Decisions
- [D1] Chose X over Y because Z (evidence: F1, F2)
- [D2] Deferred W — insufficient data

## Open Questions
- What is the correct behavior for edge case E?
```

### Full Export

Standard export plus:
```markdown
## Raw Data
### grep: "pattern" in src/
[result lines]

### file: src/module/types.ts (full content)
[content]

### dependency-graph
[graph output]
```

---

## Patch-Based Updates

When updating an existing artifact after context compaction, use patches — don't rewrite.

### Patch Format

```
--- a/.planning/findings.md
+++ b/.planning/findings.md
@@ -15,6 +15,9 @@
 - [F3] Finding three
+- [F4] New finding from resumed session (source: new-file.ts:10)
+- [F5] Corroborates F2 with additional evidence (source: test/results.log)
```

### Patch Protocol

1. Read existing artifact
2. Identify insertion point (line number + context)
3. Append new findings — never delete existing ones
4. Mark superseded findings with `[SUPERSEDED by F4]`
5. Use Edit tool with exact old_str/new_str matching

---

## ADR Format (Architecture Decision Records)

For decisions that affect system structure:

```markdown
# ADR-[NNNN]: [Title]

## Status
Proposed | Accepted | Deprecated | Superseded by ADR-[NNNN]

## Context
[What is the issue that we're seeing that is motivating this decision]

## Decision
[What is the change that we're proposing/making]

## Consequences
[What becomes easier or harder because of this change]

## Evidence
- [F1] Finding one
- [F2] Finding two

## Alternatives Considered
| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| A | ... | ... | Chosen |
| B | ... | ... | Rejected because... |
```

### ADR Numbering
- Sequential: ADR-0001, ADR-0002, ...
- Store in `.planning/decisions/adr-NNNN-[slug].md`
- Cross-reference from findings: `[see ADR-0003]`

---

## Tech Registry Integration

When exporting artifact metadata, update the tech registry for cross-session persistence.

### .tech-registry.json Schema

> **Schema Migration (Phase 17):** This schema was unified with `hm-detective` to prevent cross-skill corruption. The previous `version`/`technologies`/`patterns` format is deprecated. Update any existing `.tech-registry.json` files to the new format.

```json
{
  "project": "project-name",
  "last_updated": "2026-04-08",
  "stack": {
    "language": "TypeScript",
    "runtime": "Node.js 20",
    "framework": "OpenCode Plugin SDK",
    "test_framework": "bun:test",
    "build_tool": "tsc"
  },
  "concerns": {
    "resolved": ["ADR-0001-circuit-breaker", "ADR-0003-state-machine"],
    "active": ["delegation-timeout", "session-recovery-race"]
  },
  "modules": {
    "src/plugin.ts": {
      "role": "entry",
      "loc": 245,
      "deps": ["src/lib/types.ts", "src/create-hooks.ts"]
    },
    "src/lib/types.ts": {
      "role": "types",
      "loc": 85,
      "deps": []
    }
  }
}
```

### Update Protocol

After each analysis session:

1. Read `.tech-registry.json` (create if missing)
2. Merge new findings into existing entries
3. Add new module entries discovered with `{ role, loc, deps }`
4. Push new concerns to `concerns.active` (or move resolved ones to `concerns.resolved`)
5. Update `last_updated` timestamp
6. Write back using full file replacement (not patch — JSON doesn't patch well)

```bash
# After analysis
node -e "
  const reg = require('./.tech-registry.json');
  reg.modules['src/new-module.ts'] = { role: 'leaf', loc: 45, deps: [] };
  reg.concerns.active.push('new-concern-id');
  reg.last_updated = new Date().toISOString().split('T')[0];
  require('fs').writeFileSync('.tech-registry.json', JSON.stringify(reg, null, 2));
"
```

---

## Export Checklist

Before context compaction hits (proactive):

- [ ] All findings exported to `.planning/findings.md` or `.research/`
- [ ] All decisions recorded as ADRs in `.planning/decisions/`
- [ ] Tech registry updated with new entries
- [ ] Open questions listed with evidence so far
- [ ] Partial work clearly marked as `[INCOMPLETE]`
- [ ] Next steps documented for resumption

After context compaction (reactive):

- [ ] Read existing artifacts before doing anything
- [ ] Check tech registry for previous analysis state
- [ ] Resume from last checkpoint — don't restart
- [ ] Patch new findings onto existing artifacts
- [ ] Mark completed items as `[DONE]`
