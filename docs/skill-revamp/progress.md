# Skill Revamp — Progress Tracking

## Date: 2026-03-19
## Status: AUDIT IN PROGRESS — hivemind-skill-writer

---

## AUDIT: hivemind-skill-writer Investigation

### What Was Found

| File | Lines | Issue |
|------|-------|-------|
| SKILL.md | 218 | References broken (06-knowledge-delta.md missing) |
| references/01-skill-anatomy.md | 249 | P2 content in P1 skill |
| references/02-frontmatter-standard.md | 309 | P2 content |
| references/03-three-patterns.md | 281 | P2 content |
| references/04-tdd-workflow.md | 318 | P2 content |
| references/05-skill-quality-matrix.md | 339 | P2 content |
| references/index.md | 114 | P2 content |
| **TOTAL** | **1828** | **TOO MUCH for one turn** |

### Broken Reference

```
SKILL.md line 217 references:
- `references/06-knowledge-delta.md` — Expert vs Redundant vs Activation

BUT: 06-knowledge-delta.md DOES NOT EXIST
```

### Root Cause

1. **P1 skill with P2 depth**: hivemind-skill-writer is labeled P1 (routing) but has 6 full P2 references
2. **Too heavy**: 1828 lines cannot load in one turn
3. **No progressive disclosure**: All references load at once instead of on-demand
4. **Missing cross-skill paths**: Doesn't map to hivefiver's 7 use cases

---

## What Needs Fixing

### Option A: Fix hivemind-skill-writer as P1+P2 Hybrid (RECOMMENDED)

1. **Remove broken reference** to 06-knowledge-delta.md
2. **Reduce SKILL.md** to <100 lines (P1 routing only)
3. **Shrink references** to essential-only (anatomy + patterns)
4. **Add cross-skill paths** for hivefiver's 7 use cases
5. **Fix duplicate** - decide which skills/ directory is authoritative

### Option B: Keep as-is but mark deprecated

- Document that it's too heavy for production use
- Create lightweight hivemind-skill-writer-lite instead

---

## hivefiver Use Cases Not Addressed

Current hivemind-skill-writer does NOT properly route to:

| hivefiver Task | Current Routing | Problem |
|----------------|-----------------|---------|
| "create a command" | No route | Missing cross-skill |
| "design agent team" | No route | Missing cross-skill |
| "create a tool" | No route | Missing cross-skill |
| "audit skill" | No route | Only self-routing |
| "fix skill" | No route | Missing cross-skill |
| "investigation" | No route | Missing cross-skill |
| "write skill" | Self only | Should be Discover→Design→Implement→Validate |

---

## Next Steps (Pending User Decision)

1. **Decide**: Fix existing hivemind-skill-writer OR create lightweight version
2. **Audit**: Which directory is authoritative (skills/ vs .opencode/skills/)
3. **TDD**: Write failing test for cross-skill routing
4. **Implement**: P1 routing + essential references only
5. **Validate**: Stack ≤3, references on-demand

---

## Change Log

| Date | Action | Details |
|------|--------|---------|
| 2026-03-19 | AUDIT | Found 1828 lines, broken ref, P1/P2 mismatch |
| 2026-03-19 | INVESTIGATION | Missing 06-knowledge-delta.md |
| 2026-03-19 | DISCOVERY | No cross-skill paths for hivefiver |

---

**Awaiting user decision on how to fix hivemind-skill-writer.**
