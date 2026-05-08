# BOOT-08: Skill Integration Constitution

**Type:** L5 Governance Evidence
**Date:** 2026-05-08
**Authority:** Phase 0 Governance Gate (P0-01 through P0-06, all PASSED)

---

## 1. Lineage Classification

| Prefix | Domain | Ship Eligibility | Notes |
|--------|--------|-------------------|-------|
| `hm-*` | Hivemind product-development skills | Shipped primitives | Strict lineage. Brainstorm, spec-driven-authoring, test-driven-execution, debug, research, synthesis, production-readiness, etc. |
| `hf-*` | HiveFiver meta-authoring skills | Shipped primitives | Flexible lineage. Agent composition, skill synthesis, command dev, context absorb, meta-builder. |
| `gate-*` | Quality gate skills | Internal only (unless productized) | Quality triad: lifecycle-integration, spec-compliance, evidence-truth. Blocks readiness claims. |
| `stack-*` | Reference skills | Reference-only | bun-pty, json-render, nextjs, opencode, vitest, zod. Framework knowledge support. |
| `gsd-*` | GSD workflow skills | **NEVER shipped** | Internal dev tooling. 65+ skills for planning, execution, review. Excluded from product primitive counts. |

### Rules

- Every skill directory MUST have a lineage prefix matching one of the above.
- `gsd-*` skills exist in `.opencode/skills/` for developer workflow but are excluded from Hivemind product primitives.
- MCM doctor MUST classify each skill as shipped, dev-only, or internal before migration.
- Unprefixed skills (e.g., `opencode-config-workflow`) are evaluated case-by-case.

---

## 2. Trigger Conventions

### Frontmatter Requirements

Every `SKILL.md` must include:

```yaml
---
name: <skill-name>
description: <trigger description with natural language activation phrases>
---
```

### Trigger Phrases

- Skills activate via natural language matching in the `description` field.
- Descriptions MUST include explicit trigger phrases: "Use when...", "Triggers on...", "NOT for...".
- The `NOT for...` clause prevents false activation — every skill MUST declare its boundaries.

### Activation Priority

When multiple skills match a user request:
1. Process skills first (brainstorming, debugging) — determine HOW to approach
2. Implementation skills second (frontend-design, mcp-builder) — guide execution
3. Reference skills last (stack-*) — provide context

---

## 3. Quality Gates

### Minimum Quality Bar

Skills must meet these requirements before shipping:

- **SKILL.md exists** in the skill directory with valid frontmatter
- **Trigger accuracy** — description matches intended use cases, not overly broad
- **Progressive disclosure** — instructions are structured, not one massive block
- **Boundary declaration** — "NOT for..." clause prevents scope creep
- **Agent binding** — at least one agent type declares this skill in its loading contract

### Quality Measurement

- RICH-8 scoring (8 dimensions, 0-8 scale) is the internal quality metric.
- Gate skills (`gate-l3-*`) enforce quality triad: lifecycle → spec → evidence.
- Skills below threshold are flagged by doctor, not auto-removed.

---

## 4. Discoverability Requirements

### Location

- Canonical location: `.opencode/skills/`
- Each skill is a directory containing `SKILL.md` and optional reference files.
- Symlinks from `.hivefiver-meta-builder/skills-lab/` to `.opencode/skills/` are the migration path (BOOT-04).

### Runtime Discovery

1. `.opencode/skills/` is scanned by OpenCode runtime at startup.
2. Each directory with `SKILL.md` is registered as a skill.
3. Frontmatter `name` and `description` are indexed for activation matching.
4. Skills without `SKILL.md` or with invalid frontmatter are silently ignored.

### Validation

- MCM doctor MUST verify: skill exists in `.opencode/skills/`, has valid SKILL.md, trigger phrases are present, lineage prefix is correct.
- Doctor MUST report: total skill count, shipped vs dev-only breakdown, broken references, orphan skills (no agent binding).

---

## 5. Skill-Agent Binding Contracts

### Declaration

- Every agent declares which skills it loads in its frontmatter or description.
- Every skill declares which agent types should load it (via `description` field or integration contracts).
- Binding is bidirectional: agents know their skills, skills know their agents.

### Enforcement

- Orphan skills (no agent binding) are flagged by doctor as warnings, not errors.
- Cross-lineage bridges (hm↔hf) are permitted when validation requires it.
- `gsd-*` skills may NOT bind to shipped `hm-*`/`hf-*` agents — they are dev-only.

---

## References

- Phase 0: `.planning/architecture/hivemind-runtime-identity-taxonomy-2026-05-07.md`
- Phase 0: `.planning/architecture/hivefiver-meta-authoring-architecture-2026-05-07.md`
- Q6 State Root: `.hivemind/` canonical, `.opencode/` primitives-only
