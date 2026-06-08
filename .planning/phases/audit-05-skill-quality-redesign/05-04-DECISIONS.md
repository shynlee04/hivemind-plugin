# audit-05 Skill Quality Redesign — User Decisions

**Date:** 2026-06-08
**Source:** User Q&A on delivery plan §7

## Locked Decisions

| # | Decision | Rationale | Action |
|---|----------|-----------|--------|
| D1 | `marketing-market-research` → ARCHIVE (no replacement) | Vietnamese-only, F-grade, dead weight | Move to `assets/.archive/dev-tooling/skills/` |
| D2 | `user-intent-patterns` → ARCHIVE (router is `hm-coord-router`) | Overlaps with Pattern 2 Navigation skill | Move to archive |
| D3 | `subagent-delegation-patterns` → ARCHIVE (covered by `hm-coord-loop`) | Mostly redundant with Pattern 3 skill | Move to archive |
| D4 | `quality-gate-orchestration` → EVALUATE inlining | If the L1-L5 evidence hierarchy isn't integrated anywhere, the skill fails the integration test. Fold into another skill (likely `hm-gate-triad`) or archive | Decide during Phase 4 |
| D5 | `hm-test-driven` → ADD `## GSD Compatibility` section | It replaced `gsd-test-driven`; document the migration per the gsd-* hybrid rule | Add 1 section in Commit 7 |
| D6 | 22-category prefix taxonomy → APPLY RETROACTIVELY to all 35 skills | User directive: align names with 22-category taxonomy | Rename all 35 skill directories in Commit 0 (preliminary) |
| D7 | Commit planning artifacts NOW | L5 docs are safe to commit; mark as atomic `docs(audit-05)` | Atomic commit before rewrites |

## Net Effect

- **3 skills archived** (D1, D2, D3) → 32 shipped skills
- **1 skill under review** (D4) → 31-32 shipped after D4 decision
- **35 skills get retroactively renamed** (D6) per 22-category taxonomy
- **hm-test-driven gets GSD-Compat section** (D5)

## Active Skill Count After Audit
- Before: 35 shipped + 50 archived = 85 total
- After: 32-33 shipped + 53-54 archived = 85 total

## D4 Final (via hm-architect, 2026-06-08T23:35Z)

| # | Decision | Rationale | Action |
|---|----------|-----------|--------|
| D4 | `quality-gate-orchestration` → ARCHIVE | 0 active consumers in assets/, full scope duplication with `hm-gate-triad` (which has 3+ consumers: hf-coordinator, hm-verifier, hm-audit). L1-L5 evidence hierarchy is NOT orphaned — it lives in `hm-gate-triad/references/gate-3-evidence-hierarchy.md`. | Move to `assets/.archive/dev-tooling/skills/` |

## Final Active Skill Count
- **Before audit-05:** 35 shipped + 50 archived = 85 total
- **After audit-05 (decisions applied):** 31 shipped + 54 archived = 85 total
- **Net reduction:** 4 archived (marketing-market-research, user-intent-patterns, subagent-delegation-patterns, quality-gate-orchestration)

## Delivery Order (revised, 8 atomic commits)
1. **Commit A** (this): docs(audit-05-2): lock D4 disposition + final 8-commit plan — ✅ done above
2. **Commit B**: feat(audit-05): rewrite 3 critical D9 blockers (hf-meta-builder-core, hm-platform-references) + archive `marketing-market-research`
3. **Commit C**: feat(audit-05): archive `user-intent-patterns`, `subagent-delegation-patterns`, `quality-gate-orchestration`
4. **Commit D**: feat(audit-05): sweep l0/l1/l2/l3 from skill frontmatter `name` field (15 skills) + descriptions
5. **Commit E**: feat(audit-05): sweep l0/l1/l2/l3 from skill bodies (76 occurrences)
6. **Commit F**: feat(audit-05): fix orphan cross-refs (62 distinct tokens)
7. **Commit G**: feat(audit-05): trim 6 skills over 300 LOC
8. **Commit H**: feat(audit-05): apply 22-category prefix taxonomy retroactively to all 31 remaining skills + add `## GSD Compatibility` to hm-test-driven

Each commit is atomic; each passes `node assets/.hivemind-config/validate-name.sh`, `node scripts/sync-assets.js`, `npm run typecheck`, `npm test`.

## D8 — Per-Tool Permission Granularity (binding rule)

**Source:** User clarification on `REMOVED-TOOLS-MANIFEST-2026-06-08.md` (2026-06-08T23:50Z)

**Scope:** `assets/agents/*.md` frontmatter (manifest's binding scope)

**Rules:**

1. **No `tools:` field** in any agent frontmatter (the manifest rule). All tool access declared under `permission:` only.

2. **Per-tool granularity** — each tool name appears on its own line in the `permission:` block with explicit `allow` | `deny` | `ask`:
   ```yaml
   permission:
     read: allow
     edit: deny
     write: allow
     glob: allow
     grep: allow
     bash: allow
     task: allow
     delegate-task: allow
     delegation-status: allow
     hivemind-doc: allow
     # ... every tool named explicitly
   ```

3. **No top-level wildcards** at the root of the `permission:` map. The following are FORBIDDEN:
   ```yaml
   permission:
     "*": allow              # FORBIDDEN
     "hm-*": allow           # FORBIDDEN  
     "gate-*": allow         # FORBIDDEN
     "stack-*": allow        # FORBIDDEN
   ```

4. **Sub-patterns under a specific tool ARE allowed** — the tool is named, the sub-pattern scopes the sub-decision:
   ```yaml
   permission:
     task:
       "*": ask                          # unmapped subagent → ask
       hm-architect: allow               # explicit allow per agent
       hm-executor: allow
       # ... up to 30 explicit entries
     bash:
       "*": ask                          # unmapped command → ask
       git *: allow                      # scoped to git commands
       node *: allow                     # scoped to node commands
     skill:
       "*": ask
       hm-*: allow                       # explicit allow per skill namespace
   ```
   This is the pattern in 14 agents (hm-orchestrator, build, hf-*, hm-l0-orchestrator).

5. **No silent drops** — if a tool was in the original `tools:` list, it MUST appear in the new `permission:` block. Migration audit must verify the count matches.

**Verification method (for audit-05 commits B → H):**
```bash
# Count tools in old vs new for every agent
for f in assets/agents/*.md; do
  tools_count=$(grep -c "^- [a-z]" <(awk '/^---$/{f++; next} f==1 && f<2' "$f" | grep -A100 "^tools:") 2>/dev/null)
  perm_count=$(awk '/^---$/{f++; next} f==1' "$f" | grep -E "^  [a-z][a-z0-9_-]+:" | wc -l)
  # warn if perm_count << tools_count
done
```

**Status:** Existing migration in `ed12617f` + `fb002608` is compliant. 14 agents with `task: { ... }` sub-patterns are valid (tool is named, sub-patterns are scoped). No further fix needed.
