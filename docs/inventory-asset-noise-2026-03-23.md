# Asset Inventory Report — 2026-03-23

## Executive Summary

Inspected 6 target locations. Found:
- **ACTIVE**: 3 locations with active assets
- **LEGACY/NOISE**: 3 locations with disconnected or noisy assets
- **33 noise command files** should be detached
- **22 noise workflow files** should be detached
- **3 unknown agents** need verification

---

## Location Inventory

### 1. Root `agents/` — LEGACY SOURCE (Still Active)

**Path**: `/Users/apple/hivemind-plugin/.worktrees/product-detox/agents/`

| Asset | Count | Status |
|-------|-------|--------|
| `*.deprecated.md` files | 9 | LEGACY SOURCE - still used by registry |

**Authority**: `opencode-agent-registry.ts` reads these files to generate runtime projections.

---

### 2. Root `commands/` — MOSTLY NOISE

**Path**: `/Users/apple/hivemind-plugin/.worktrees/product-detox/commands/`

| Category | Count | Status |
|----------|-------|--------|
| Registered commands | 10 | ACTIVE - backed by `command-bundles.ts` |
| Unregistered commands | 33 | NOISE - violate rules or non-existent |

**Registered (ACTIVE)**:
- hm-init, hm-doctor, hm-harness, hm-settings, hm-research, hm-plan, hm-implement, hm-verify, hm-tdd, hm-course-correct

**NOISE Commands (33)** — See `commands/AGENTS.md` for full list including:
- All hivefiver subcommands (11) — `hivefiver.md` violates rules with shell scripts
- All hiverd commands (6)
- All hiveq commands (6)
- All hivemind commands (11)

---

### 3. Root `workflows/` — ALL NOISE

**Path**: `/Users/apple/hivemind-plugin/.worktrees/product-detox/workflows/`

| Asset | Count | Status |
|-------|-------|--------|
| `*.yaml` files | 22 | ALL NOISE - reference non-existent tools/skills |

**See**: `workflows/AGENTS.md`

---

### 4. `.opencode/agents/` — ACTIVE with UNKNOWN

**Path**: `/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/agents/`

| Category | Count | Status |
|----------|-------|--------|
| Registered agents | 9 | ACTIVE - from `agents/*.deprecated.md` |
| Unknown agents | 3 | UNKNOWN - no canonical source |

**Unknown Agents**:
- `handoff.md` — NOT in `OPENCODE_AGENT_REGISTRY_IDS`
- `code-skeptic.md` — NOT in `OPENCODE_AGENT_REGISTRY_IDS`
- `architect.md` — NOT in `OPENCODE_AGENT_REGISTRY_IDS`

**See**: `.opencode/agents/AGENTS.md`

---

### 5. `src/schema-kernel/` — ACTIVE

**Path**: `/Users/apple/hivemind-plugin/.worktrees/product-detox/src/schema-kernel/`

| Asset | Status |
|-------|--------|
| `index.ts` | ACTIVE - forwarding layer |
| `AGENTS.md` | ACTIVE - sector boundary rules |
| `../archive/schema-kernel/` | ACTIVE - actual schema authority |

**Authority**: Phase 1 Contract Authority for persisted and cross-session records.

---

### 6. `.hivemind/` — RUNTIME OUTPUT ONLY

**Path**: `/Users/apple/hivemind-plugin/.worktrees/product-detox/.hivemind/`

| Asset | Status |
|-------|--------|
| `state/` | RUNTIME OUTPUT - not authority |
| `graph/` | RUNTIME OUTPUT - not authority |
| `context-check.json` | RUNTIME OUTPUT - not authority |
| `config/` | RUNTIME OUTPUT - not authority |
| `project/` | RUNTIME OUTPUT - not authority |

**Authority**: NONE — This is runtime-generated output, not a source of truth.

---

## Summary of Assets to Detach

### Commands to Remove (33)

```
commands/hivefiver.md  # VIOLATION: shell scripts as hidden engines
commands/hivefiver-*.md  # 10 files - not registered
commands/hiverd-*.md  # 6 files - not registered
commands/hiveq-*.md  # 6 files - not registered
commands/hivemind-*.md  # 11 files - not registered
```

### Workflows to Remove (22)

```
workflows/*.yaml  # All 22 files reference non-existent tools/skills
```

### Unknown Agents to Verify (3)

```
.opencode/agents/handoff.md
.opencode/agents/code-skeptic.md
.opencode/agents/architect.md
```

---

## AGENTS.md Files Created/Updated

| Location | Action |
|----------|--------|
| `agents/AGENTS.md` | CREATED |
| `commands/AGENTS.md` | UPDATED |
| `workflows/AGENTS.md` | CREATED |
| `.opencode/agents/AGENTS.md` | CREATED |

---

## Recommendations

1. **Remove all 33 noise commands** from `commands/`
2. **Remove all 22 noise workflows** from `workflows/`
3. **Verify the 3 unknown agents** (`handoff`, `code-skeptic`, `architect`) — either find canonical source or remove
4. **Keep** `commands/AGENTS.md` updated to prevent future noise accumulation
