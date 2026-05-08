# BOOT-08: Routing Contracts

**Type:** L5 Governance Evidence
**Date:** 2026-05-08
**Authority:** Phase 0 Governance Gate (P0-01 through P0-06, all PASSED)

---

## 1. Agent Discovery Pipeline

### Source → Runtime Flow

```
.hivefiver-meta-builder/agents-lab/active/refactoring/
    ↓ (BOOT-04 symlinks)
.opencode/agents/
    ↓ (OpenCode runtime scan)
Agent Registry (in-memory)
    ↓ (Plugin composition)
plugin.ts → @opencode-ai/plugin tool() + hook()
```

### Steps

1. **Source inventory:** `.hivefiver-meta-builder/agents-lab/active/refactoring/` contains 89 agent definitions.
2. **Symlink bridge:** BOOT-04 creates symlinks from `.opencode/agents/` to source lab.
3. **Runtime scan:** OpenCode reads `.opencode/agents/*.md` at startup.
4. **Frontmatter parse:** YAML frontmatter extracted: name, description, tools, temperature.
5. **Registry:** Valid agents are registered in the runtime agent registry.
6. **Plugin wiring:** `plugin.ts` uses `@opencode-ai/plugin` to wire agents into tool/hook lifecycle.

### Validation Chain

- **BOOT-06 doctor:** Verifies `.opencode/agents/` exists, symlinks are valid, agent count matches expected.
- **MCM-01 doctor:** Classifies shipped vs dev-only agents, verifies lineage prefixes, checks frontmatter validity.
- **Config plane:** `configs.json` meta-concept fields reference agent capabilities.

---

## 2. Skill Discovery Pipeline

### Source → Runtime Flow

```
.hivefiver-meta-builder/skills-lab/active/refactoring/
    ↓ (BOOT-04 symlinks)
.opencode/skills/
    ↓ (OpenCode runtime scan)
Skill Registry (in-memory)
    ↓ (Skill loading)
Skill() tool → injects instructions into agent context
```

### Steps

1. **Source inventory:** `.hivefiver-meta-builder/skills-lab/active/refactoring/` contains 123 skill directories.
2. **Symlink bridge:** BOOT-04 creates symlinks from `.opencode/skills/` to source lab.
3. **Runtime scan:** OpenCode reads `.opencode/skills/*/SKILL.md` at startup.
4. **Frontmatter parse:** YAML frontmatter extracted: name, description.
5. **Registry:** Valid skills are registered in the runtime skill registry.
6. **Activation:** Skills activate via natural language matching on `description` field.

### Validation Chain

- **BOOT-06 doctor:** Verifies `.opencode/skills/` exists, symlinks are valid, skill count matches expected.
- **MCM-02 doctor:** Classifies shipped vs dev-only skills, verifies lineage prefixes, checks SKILL.md validity.
- **Config plane:** `configs.json` meta-concept fields reference skill capabilities.

---

## 3. Config-Plane Integration

### configs.json Meta-Concept Fields

The config schema (`configs.json`, 29 fields) includes meta-concept awareness:

- **Agent registry fields:** Track shipped agent count, lineage breakdown, validation status.
- **Skill registry fields:** Track shipped skill count, lineage breakdown, validation status.
- **Config consumer wiring:** Every active config field must have a named consumer or explicit deferred/dead status (per Phase 0 config contract).

### Doctor Integration

`hivemind doctor` reports:

| Check | Source | Pass Condition |
|-------|--------|----------------|
| Agent count | `.opencode/agents/` scan | ≥ expected minimum |
| Skill count | `.opencode/skills/` scan | ≥ expected minimum |
| Symlink integrity | BOOT-04 symlinks | All valid |
| Config validity | `configs.json` schema | No validation errors |
| Lineage compliance | MCM doctor | All shipped primitives have correct prefixes |

---

## 4. Runtime Loading Contracts

### Agent Loading

- Agents are loaded on-demand when delegated to, not all at startup.
- The delegation manager (`src/lib/delegation-manager.ts`) resolves agent definitions from the registry.
- Agent tool permissions are enforced at the SDK level — undeclared tools are blocked.

### Skill Loading

- Skills are loaded on-demand via the `Skill()` tool invocation.
- The skill loader reads `SKILL.md` and injects instructions into the requesting agent's context.
- Skills with missing or invalid `SKILL.md` are silently skipped with a warning log.

### CQRS Boundary

- **Write-side:** Tools (delegate-task, session-patch, etc.) mutate `.hivemind/` state.
- **Read-side:** Hooks (system transform, messages transform, etc.) observe without mutation.
- Agents and skills participate in this boundary — they may use tools but cannot directly modify `.opencode/` definitions at runtime.

---

## References

- Phase 0: `.planning/config/hivemind-config-contract-2026-05-07.md`
- Phase 0: `.planning/architecture/hivemind-source-plane-architecture-2026-05-07.md`
- BOOT-04: Primitives Recovery (symlink bridge)
- BOOT-06: Validation + Health Check (doctor)
- Q6 State Root: `.hivemind/` canonical, `.opencode/` primitives-only
