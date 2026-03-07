---
name: "meta-builder-governance"
description: "Defines governance for framework-level asset evolution, compatibility windows, parity enforcement, and root-mirror authority rules. Meta-builders maintain the framework — never product features."
triggers:
  - "When changing agents/commands/workflows/skills"
  - "When introducing compatibility deprecations"
  - "When modifying root skills/ or .opencode/skills/ assets"
  - "When framework parity must be verified"
version: "2.0.0"
---

# Meta-Builder Governance

**Core principle:** Root is source of truth. Evolve contracts safely. Never break consumers without a compatibility window.

## Authority Hierarchy

```
skills/           ← SOURCE OF TRUTH (root)
  ↓ mirrors to
.opencode/skills/ ← PLATFORM MIRROR (overwritten on init)
  ↓ adapts to
.agent/skills/    ← ADAPTER SURFACE (Claude Code / Antigravity)
.agents/skills/   ← ADAPTER SURFACE (Codex)
```

### Rules

1. **Root authority**: Changes start in `skills/`. Mirrors and adapters follow.
2. **No phantom entries**: Every `registry.yaml` entry must have a corresponding `skills/{name}/SKILL.md`
3. **Mirror vulnerability**: `.opencode/skills/` is overwritten on `opencode init`. Critical logic must live in root.
4. **Adapter freedom**: `.agent/` and `.agents/` may contain platform-specific adaptations not in root.

## Compatibility Window Protocol

When deprecating or changing a contract:

| Phase | Duration | What Happens |
|-------|----------|--------------|
| **Announce** | Immediate | Add deprecation notice to the contract |
| **Dual support** | 1 full cycle | Old AND new contracts work simultaneously |
| **Migration** | During dual support | Consumers update to new contract |
| **Remove** | After cycle | Old contract removed, migration complete |

### What Counts as a Contract Change

- Skill name change (registry entry must update)
- Skill trigger modification (consumers may not match)
- Skill frontmatter schema change (loaders may break)
- Reference file rename or move (skill references break)
- Template field addition/removal (output format changes)

## Parity Enforcement

Before merging any framework change:

| Check | Command/Action | Expected |
|-------|---------------|----------|
| Registry ↔ directory | Check each registry entry has a SKILL.md | 0 orphans |
| Root ↔ mirror | Compare root skills/ with .opencode/skills/ | Root is superset |
| Skill loading | Run skill-resolver tests | All pass |
| No broken symlinks | Check .agent/skills/ and .agents/skills/ | 0 broken |
| Version consistency | Skill version in frontmatter matches changelog | Matches |

## Framework-Only Boundary

Meta-builders work on:
- ✅ Skills, agents, commands, workflows, governance docs
- ✅ Registry, schemas, test infrastructure
- ✅ Platform adapter configurations

Meta-builders NEVER work on:
- ❌ Product features (user-facing functionality)
- ❌ Product bug fixes (unless the bug is IN framework code)
- ❌ Product configuration (endpoints, API keys, UI)

## Anti-Patterns

| Pattern | Problem |
|---------|---------|
| **Change mirror first** | Gets overwritten on init — change root first |
| **Break without warning** | Consumers break silently — use compatibility window |
| **Phantom registry** | Registry claims skills that don't exist — parity check fails |
| **Framework as product** | Adding product features to framework code — boundary violation |
| **Skip parity check** | "It's a small change" — all changes need parity verification |
