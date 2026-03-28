## Design Decision: Skill Discovery Mechanism Alignment

**Date:** 2026-03-26
**Status:** proposed
**Author:** Architect
**Context:** Slice `remediation-architect-review`

---

### Context

The `opencode-skill-registry.ts` discovery mechanism scans the wrong path. Line 88 uses `join(packageRoot, 'skills')` which resolves to a directory containing `_deprecated_hive/`, `registry-internal.yaml`, and a nested `skills/` subdirectory — zero SKILL.md files. This makes `validateSkillNames()` always return all skills as missing, breaking the validation pipeline.

Three skill surfaces exist in the codebase:

| Surface | Path | Count | Purpose |
|---------|------|-------|---------|
| Authoring | `skills/skills/{name}/SKILL.md` | 19 | Source of truth, old naming |
| Runtime (project) | `.opencode/skills/{name}/SKILL.md` | 15 | OpenCode discovers from here |
| Runtime (global) | `~/.config/opencode/skills/{name}/SKILL.md` | 0 | OpenCode discovers from here |

OpenCode natively discovers from 6 paths (confirmed via https://opencode.ai/docs/skills/):
1. `.opencode/skills/<name>/SKILL.md` (project)
2. `~/.config/opencode/skills/<name>/SKILL.md` (global)
3. `.claude/skills/<name>/SKILL.md` (compat)
4. `~/.claude/skills/<name>/SKILL.md` (compat)
5. `.agents/skills/<name>/SKILL.md` (compat)
6. `~/.agents/skills/<name>/SKILL.md` (compat)

---

### Design Decision

**Recommendation: Option A — Fix the registry to scan OpenCode's official discovery paths.**

Specifically, `discoverSkills()` should scan these paths in priority order:
1. `.opencode/skills/` (project-level, highest priority)
2. `~/.config/opencode/skills/` (global, fallback)
3. `skills/skills/` (authoring surface, validation-only)

**Not Option B.** The OpenCode SDK does NOT expose a `client.app.skills()` API. Verified:
- `client.app.log()` — exists
- `client.app.agents()` — exists
- `client.app.skills()` — does NOT exist

The SDK client API (from https://opencode.ai/docs/sdk/) has no skill enumeration method. Option B is architecturally ideal but technically impossible today.

**Not Option C.** Hybrid scanning for validation + trust for runtime is over-engineered. The registry's only consumer is `validateSkillNames()` in `skill-injection-loader.ts:183`. It needs accurate disk state, not runtime state. Scanning the correct paths is sufficient.

---

### Rationale

1. **SDK-First Alignment.** OpenCode discovers skills from specific filesystem paths. The registry should scan the same paths — not invent its own. This ensures validation matches what OpenCode actually loads.

2. **Single Consumer.** The registry has one consumer: `validateSkillNames()`. It compares config-defined skill names against what exists on disk. The validation is meaningless if the scan path doesn't match OpenCode's discovery path.

3. **Authoring Surface as Build-Time Validator.** The `skills/skills/` directory is the authoring surface — skills are authored here, then published/symlinked to `.opencode/skills/`. Including it in the scan (with lower priority) catches skills that haven't been published yet, which is useful for development workflow.

4. **No Duplication Risk.** Skills in `.opencode/skills/` take priority over `skills/skills/`. If a skill exists in both, the runtime version wins. This prevents the injection system from referencing skills that OpenCode can't actually load.

---

### Trade-offs

| What we gain | What we give up |
|---|---|
| Validation matches OpenCode's actual discovery | Simplicity of single-path scan |
| Global skills are discovered | Predictable behavior (multiple paths can diverge) |
| Authoring surface catch for unpublished skills | Performance (3 paths vs 1, but negligible — startup-only) |
| Alignment with SDK-First principle | Option B's "trust the runtime" elegance (blocked by missing SDK API) |

---

### Interface Contract

```typescript
/**
 * Paths OpenCode uses to discover skills, in priority order.
 * Project-local paths first, then global, then authoring surface.
 */
const SKILL_DISCOVERY_PATHS: readonly string[] = [
  '.opencode/skills',
  '.claude/skills',        // compat
  '.agents/skills',        // compat
] as const

const GLOBAL_SKILL_DISCOVERY_PATHS: readonly string[] = [
  join(homedir(), '.config/opencode/skills'),
  join(homedir(), '.claude/skills'),    // compat
  join(homedir(), '.agents/skills'),    // compat
] as const

const AUTHORING_SKILL_PATH = 'skills/skills'  // validation-only, lowest priority
```

**Modified function signature:**

```typescript
/**
 * Discover skills from OpenCode's official discovery paths.
 *
 * Scans project-local, global, and authoring paths.
 * Deduplicates by skill ID (directory name) — project-local wins.
 *
 * @param packageRoot - Absolute path to project root
 * @param excludedSkillIds - Skill IDs to skip
 * @returns Discovered skills with deduplication
 */
function discoverSkills(
  packageRoot: string,
  excludedSkillIds: string[] = [],
): DiscoveredSkill[]
```

**No signature change to `createOpencodeSkillRegistry`** — it already accepts `packageRoot` and `excludedSkillIds`. The fix is internal to `discoverSkills()`.

---

### Implementation Guidance for Hivemaker

1. **Extract discovery paths to constants** at the top of `opencode-skill-registry.ts`. Use `os.homedir()` for global paths.

2. **Rewrite `discoverSkills()`** to iterate over all discovery paths, collect skills, and deduplicate by `skillId`. Project-local paths should be scanned first and win on conflicts.

3. **Add authoring surface as fallback** — scan `skills/skills/` last. Skills found here but not in `.opencode/skills/` should be flagged (warning, not error) since they haven't been published.

4. **Update `validateSkillNames()` warning message** in `skill-injection-loader.ts:212` to reference the correct path (`{packageRoot}/.opencode/skills/` instead of `{packageRoot}/skills/`).

5. **Do NOT change `createOpencodeSkillRegistry` signature** — existing caller at `skill-injection-loader.ts:183` passes `packageRoot` only.

---

### Verification Criteria for Hiveq

1. `createOpencodeSkillRegistry(projectRoot)` returns entries from `.opencode/skills/` (should find 15 skills).
2. `validateSkillNames()` correctly identifies missing vs existing skills (zero false negatives for `.opencode/skills/` content).
3. `npx tsc --noEmit` passes clean.
4. Skills in both `.opencode/skills/` and `skills/skills/` appear once (deduplication works).
5. Global path scanning works when `~/.config/opencode/skills/` exists (manual test).

---

### Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| `os.homedir()` returns unexpected path in CI/test | Low | Mock in tests; CI environments have predictable HOME |
| Authoring surface has different naming than runtime (19 vs 15 skills) | Medium | Deduplicate by skillId; runtime path wins. Authoring-only skills emit warning. |
| Global path scan adds startup latency | Negligible | `readdirSync` on 1-6 directories at startup; path doesn't exist = ENOENT caught |
| Future SDK adds `client.app.skills()` | Opportunity | When available, migrate to SDK query. The filesystem scan becomes build-time-only. |

---

### Reversibility

**Easy to change.** The fix is internal to `discoverSkills()`. If a future SDK exposes `client.app.skills()`, the registry can be replaced entirely without changing the caller (`validateSkillNames()`). The interface contract (`createOpencodeSkillRegistry(packageRoot)`) stays stable.

---

### Alternatives Considered

**Option B: Trust OpenCode's native discovery, remove registry entirely.**
- Blocked: No `client.app.skills()` in SDK. Verified against https://opencode.ai/docs/sdk/ — `app` has `log()` and `agents()` only.
- Revisit when SDK adds skill enumeration.

**Option C: Hybrid — scan for validation, trust runtime for loading.**
- Over-engineered for the single consumer (`validateSkillNames()`). The validation IS a filesystem scan — there's no "runtime state" to trust. OpenCode's discovery happens inside the server process, not exposed to plugins.

**Option D: Scan only `skills/skills/` (fix the nesting).**
- Would work for current validation but misses the fundamental alignment problem. The registry should scan what OpenCode scans, not the authoring surface.

---

### Open Questions

1. **Should HiveMind's injection system be deprecated in favor of OpenCode's native `<available_skills>` block?** OpenCode already discovers skills and lists them in the `skill` tool description. HiveMind's separate injection pipeline duplicates this. However, the injection serves a different purpose (ambient skill instructions vs on-demand loading), so the two systems are complementary, not redundant. This is a future design question, not blocking the path fix.

2. **Should `skills/skills/` be renamed to `.opencode/skills/` to collapse authoring and runtime into one surface?** This would eliminate the dual-path concern but changes the project's authoring workflow. Deferred to a separate refactor.
