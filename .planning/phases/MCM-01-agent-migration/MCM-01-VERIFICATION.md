# MCM-01: Agent Migration to .opencode/ — Verification

**Date:** 2026-05-08
**Status:** passed

---

## Agent Inventory

| Lineage | Count | Ship Status | Notes |
|---------|-------|-------------|-------|
| `hm-*` | 45 | Shipped | Product-development agents (L0/L1/L2 hierarchy) |
| `hf-*` | 11 | Shipped | Meta-authoring agents (L0/L1/L2 hierarchy) |
| `gsd-*` | 33 | Dev-only | NEVER shipped — internal GSD workflow tooling |
| **Total** | **89** | 56 shipped, 33 dev-only | |

## Frontmatter Validation

| Check | Result |
|-------|--------|
| All shipped agents have `name:` | ✅ 56/56 |
| All shipped agents have `description:` | ✅ 56/56 |
| All shipped agents have `temperature:` | ⚠️ 53/56 (3 missing: hm-l2-build, hm-l2-meta-synthesis, hm-l2-test-router) |
| All shipped agents have `permission:` | ✅ 56/56 |
| No `gsd-*` agents in shipped set | ✅ 0 gsd-* classified as shipped |

## Lineage Compliance

| Rule | Status |
|------|--------|
| Every agent has a lineage prefix | ✅ |
| `gsd-*` excluded from shipped count | ✅ |
| hm-* agents follow L0/L1/L2 hierarchy | ✅ |
| hf-* agents follow L0/L1/L2 hierarchy | ✅ |
| No agents outside known lineages | ✅ |

## Discoverability

| Check | Result |
|-------|--------|
| `.opencode/agents/` exists | ✅ |
| All 89 agents present | ✅ |
| BOOT-04 symlinks operational | ✅ |
| Agents are regular files (accessible) | ✅ |

## Issues Found

| Issue | Severity | Action |
|-------|----------|--------|
| 3 hm-* agents missing `temperature` field | LOW | Default temperature will be used by runtime. Can be fixed in MCM-03 config integration. |

## Checklist

- [x] Agent lineage classification complete (45 hm-* + 11 hf-* shipped, 33 gsd-* dev-only)
- [x] Frontmatter validation for all shipped agents
- [x] All shipped agents discoverable in `.opencode/agents/`
- [x] No gsd-* agents in shipped set
- [x] BOOT-08 constitution rules verified against actual agents
- [x] BOOT-04 symlinks operational

## Verdict

MCM-01 verification passed. 56 shipped agents are classified and discoverable. 3 minor frontmatter gaps (missing temperature) are non-blocking — runtime defaults apply.
