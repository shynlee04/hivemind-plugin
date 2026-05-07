# BOOT-08: Agent + Skill Integration — Plan

**Mode:** docs-only (L5 evidence)
**Date:** 2026-05-08

---

## Plan 1: Agent Integration Constitution

**Goal:** Document the binding rules for how agents participate in the Hivemind runtime.

**Tasks:**
1. Document agent lineage classification (hm-*, hf-*, gate-*, stack-*, gsd-* exclusions)
2. Document agent permission model (tool access, delegation authority, CQRS boundaries)
3. Document delegation hierarchy contracts (L0→L1→L2→L3 depth rules)
4. Document agent discovery and validation requirements

**Output:** `.planning/phases/BOOT-08-agent-skill-integration/BOOT-08-AGENT-CONSTITUTION.md`

---

## Plan 2: Skill Integration Constitution

**Goal:** Document the binding rules for how skills participate in the Hivemind runtime.

**Tasks:**
1. Document skill lineage classification (hm-*, hf-*, gate-*, stack-* prefixes)
2. Document skill trigger conventions and quality gates
3. Document skill discoverability requirements (frontmatter, location, naming)
4. Document skill-agent binding contracts

**Output:** `.planning/phases/BOOT-08-agent-skill-integration/BOOT-08-SKILL-CONSTITUTION.md`

---

## Plan 3: Routing Contracts

**Goal:** Document how agents and skills are discovered, loaded, and validated at runtime.

**Tasks:**
1. Document agent discovery pipeline (`.opencode/agents/` → runtime loading)
2. Document skill discovery pipeline (`.opencode/skills/` → runtime loading)
3. Document config-plane integration (configs.json meta-concept fields)
4. Document doctor validation requirements (count checks, integrity checks)

**Output:** `.planning/phases/BOOT-08-agent-skill-integration/BOOT-08-ROUTING-CONTRACTS.md`

---

## Verification

All 3 documents must exist and be committed. Each must reference Phase 0 governance artifacts and Q6 state root separation.
