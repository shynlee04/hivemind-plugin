---
phase: SR-05
plan: 03
type: auto
wave: 2
depends_on:
  - SR-05-01
files_modified:
  - src/routing/behavioral-profile/resolve-behavioral-profile.ts
  - src/routing/behavioral-profile/types.ts
autonomous: true
requirements:
  - REQ-03
---

<objective>
Make the 4 security-relevant behavioral profile dimensions (`guardrailLevel`, `delegationMode`, `toolAccessPattern`, `skillFilter`) config-driven rather than static-only, allowing per-project customization via `.hivemind/configs.json`.

Purpose: Enable projects to override the default behavioral profile dimensions without changing source code. Config values take precedence over static profile lookup.
Output: Updated resolveBehavioralProfile() with config-first merge + types + tests.
</objective>

<context>
@.planning/phases/SR-05-config-governance-cluster-unification-2026-06-04/SR-05-SPEC.md
@.planning/phases/SR-05-config-governance-cluster-unification-2026-06-04/SR-05-CONTEXT.md
@.planning/phases/SR-05-config-governance-cluster-unification-2026-06-04/SR-05-RESEARCH.md
@.planning/phases/SR-05-config-governance-cluster-unification-2026-06-04/SR-05-01-PLAN.md
</context>

<tasks>
  <task id="01" type="auto">
    <name>Extend BehavioralProfile types with config override fields</name>
    <files>
      <modified>src/routing/behavioral-profile/types.ts</modified>
    </files>
    <read_first>
      - src/routing/behavioral-profile/types.ts (full file — current types at ~100 lines)
      - src/routing/behavioral-profile/profiles.ts (static BehavioralProfiles lookup)
      - SR-05-RESEARCH.md Pattern 2 (config-first merge pattern)
    </read_first>
    <action>
Extend `src/routing/behavioral-profile/types.ts` to support config overrides:

1. Add `BehavioralConfigOverrides` interface:
   ```typescript
   export interface BehavioralConfigOverrides {
     guardrail_level?: "strict" | "moderate" | "permissive"
     delegation_mode?: "waiter" | "direct" | "autonomous"
     tool_access_pattern?: "restricted" | "standard" | "full"
     skill_filter?: "curated" | "domain" | "full"
   }
   ```

2. Update `resolveBehavioralProfile()` function signature to accept optional config overrides:
   ```typescript
   export function resolveBehavioralProfile(
     _sessionId: string,
     projectRoot: string,
     sessionContext?: Record<string, unknown>,
     configOverrides?: BehavioralConfigOverrides,
   ): ResolvedBehavioralProfile
   ```

3. Export `BehavioralConfigOverrides` for use in config reader and tests.
    </action>
    <verify>
      - `grep -c "BehavioralConfigOverrides" src/routing/behavioral-profile/types.ts` returns >= 1
      - `npx tsc --noEmit` exits 0
    </verify>
    <done>
BehavioralProfile types extended with config override interface. Function signature updated to accept optional overrides.
    </done>
    <acceptance_criteria>
      - `src/routing/behavioral-profile/types.ts` exports `BehavioralConfigOverrides` interface
      - Interface has 4 optional fields: `guardrail_level`, `delegation_mode`, `tool_access_pattern`, `skill_filter`
      - Each field uses the correct enum type matching BehavioralProfile dimensions
      - `resolveBehavioralProfile()` signature includes optional `configOverrides` parameter
      - `npx tsc --noEmit` exits 0
    </acceptance_criteria>
  </task>

  <task id="02" type="auto">
    <name>Implement config-first merge in resolveBehavioralProfile()</name>
    <files>
      <modified>src/routing/behavioral-profile/resolve-behavioral-profile.ts</modified>
    </files>
    <read_first>
      - src/routing/behavioral-profile/resolve-behavioral-profile.ts (full file — current resolution logic at lines 64-86)
      - src/routing/behavioral-profile/profiles.ts (BehavioralProfiles static lookup)
      - src/schema-kernel/hivemind-configs.schema.ts (extended schema from SR-05-01 — guardrail_level, delegation_mode, etc.)
      - SR-05-RESEARCH.md Pattern 2 (config-first merge example)
      - SR-05-CONTEXT.md Decision 4 (snake_case in config, camelCase in interface)
    </read_first>
    <action>
Update `resolveBehavioralProfile()` at `src/routing/behavioral-profile/resolve-behavioral-profile.ts` to implement config-first merge:

1. Import `getFreshConfig` from config subscriber (already imported in this file).

2. Read config overrides from the config object:
   ```typescript
   const config = getFreshConfig(projectRoot)
   const configOverrides: BehavioralConfigOverrides = {
     guardrail_level: config.guardrail_level,
     delegation_mode: config.delegation_mode,
     tool_access_pattern: config.tool_access_pattern,
     skill_filter: config.skill_filter,
   }
   ```

3. Apply config-first merge (config values override static profile):
   ```typescript
   const mode = config.mode as keyof typeof BehavioralProfiles
   const staticProfile = BehavioralProfiles[mode]

   const behavioralProfile: BehavioralProfile = {
     guardrailLevel: configOverrides.guardrail_level ?? staticProfile.guardrailLevel,
     delegationMode: configOverrides.delegation_mode ?? staticProfile.delegationMode,
     toolAccessPattern: configOverrides.tool_access_pattern ?? staticProfile.toolAccessPattern,
     skillFilter: configOverrides.skill_filter ?? staticProfile.skillFilter,
   }
   ```

4. Preserve existing behavior: when config fields are undefined, return static profile values unchanged.

5. Note: snake_case (config) → camelCase (interface) conversion happens at the merge point (Decision 4).
    </action>
    <verify>
      - `grep -c "configOverrides" src/routing/behavioral-profile/resolve-behavioral-profile.ts` returns >= 1
      - `grep -c "guardrail_level" src/routing/behavioral-profile/resolve-behavioral-profile.ts` returns >= 1
      - `npx tsc --noEmit` exits 0
    </verify>
    <done>
resolveBehavioralProfile() implements config-first merge. Config values override static profile; undefined config fields fall back to static lookup. snake_case→camelCase conversion at merge point.
    </done>
    <acceptance_criteria>
      - `src/routing/behavioral-profile/resolve-behavioral-profile.ts` reads config overrides via `getFreshConfig()`
      - Config values (`guardrail_level`, `delegation_mode`, `tool_access_pattern`, `skill_filter`) override static profile dimensions
      - When config fields are undefined, static `BehavioralProfiles[mode]` values are used unchanged
      - snake_case config fields map to camelCase interface fields (e.g., `guardrail_level` → `guardrailLevel`)
      - `npx tsc --noEmit` exits 0
    </acceptance_criteria>
  </task>

  <task id="03" type="tdd">
    <name>Behavioral profile config override tests</name>
    <files>
      <modified>tests/lib/behavioral-profile/resolve-behavioral-profile.test.ts</modified>
    </files>
    <read_first>
      - tests/lib/behavioral-profile/resolve-behavioral-profile.test.ts (existing test patterns)
      - src/routing/behavioral-profile/resolve-behavioral-profile.ts (extended resolver from Task 02)
      - src/routing/behavioral-profile/profiles.ts (BehavioralProfiles static lookup for expected values)
      - SR-05-SPEC.md REQ-03 acceptance criteria
    </read_first>
    <action>
Extend `tests/lib/behavioral-profile/resolve-behavioral-profile.test.ts` with config override tests:

1. Test: With `guardrail_level: "strict"` in config, `resolveBehavioralProfile()` returns `guardrailLevel === "strict"` regardless of mode
2. Test: With `delegation_mode: "direct"` in config, returns `delegationMode === "direct"` regardless of mode
3. Test: With `tool_access_pattern: "full"` in config, returns `toolAccessPattern === "full"` regardless of mode
4. Test: With `skill_filter: "domain"` in config, returns `skillFilter === "domain"` regardless of mode
5. Test: With all 4 config fields undefined, returns static `BehavioralProfiles[mode]` values unchanged
6. Test: With partial config overrides (only `guardrail_level` set), other 3 dimensions use static values
7. Test: Config override works for each mode (discuss, auto, manual) — verify override takes precedence
8. Test: Invalid config values (not in enum) are rejected by schema — config parse fails

Mock `getFreshConfig()` to return controlled config objects for each test.
    </action>
    <verify>
      - `npx vitest run tests/lib/behavioral-profile/resolve-behavioral-profile.test.ts` exits 0
      - All new config override tests pass
      - Existing tests still pass (no regressions)
    </verify>
    <done>
Comprehensive config override tests for behavioral profile resolution. Covers full override, partial override, fallback to static, and per-mode precedence.
    </done>
    <acceptance_criteria>
      - `tests/lib/behavioral-profile/resolve-behavioral-profile.test.ts` contains at least 8 new test cases for config overrides
      - Tests mock `getFreshConfig()` to return controlled config objects
      - Tests verify config values override static profile dimensions
      - Tests verify undefined config fields fall back to static values
      - Tests verify partial overrides work (only some dimensions configured)
      - `npx vitest run tests/lib/behavioral-profile/resolve-behavioral-profile.test.ts` exits 0
    </acceptance_criteria>
  </task>
</tasks>

<verification>
1. `npx tsc --noEmit` — typecheck clean
2. `npx vitest run tests/lib/behavioral-profile/resolve-behavioral-profile.test.ts` — all tests pass
3. With `guardrail_level: "strict"` in configs.json, `resolveBehavioralProfile()` returns strict guardrail
4. With config fields undefined, returns static profile values unchanged
</verification>

<success_criteria>
- BehavioralConfigOverrides type exported from types.ts
- resolveBehavioralProfile() reads config overrides and merges with static profile
- Config values take precedence over static lookup (config-first merge)
- snake_case config fields correctly map to camelCase interface fields
- 8+ config override tests pass
- Existing behavioral profile tests still pass (no regressions)
</success_criteria>

<must_haves>
  <truths>
    - "BehavioralConfigOverrides has 4 optional fields matching the 4 security dimensions"
    - "resolveBehavioralProfile() reads config via getFreshConfig() for override values"
    - "Config values override static BehavioralProfiles[mode] when defined"
    - "Undefined config fields fall back to static profile values"
    - "snake_case config → camelCase interface conversion at merge point"
  </truths>
  <artifacts>
    - src/routing/behavioral-profile/types.ts (modified — BehavioralConfigOverrides)
    - src/routing/behavioral-profile/resolve-behavioral-profile.ts (modified — config-first merge)
    - tests/lib/behavioral-profile/resolve-behavioral-profile.test.ts (modified — config override tests)
  </artifacts>
</must_haves>
