# Integration User Journey Verification Report

**Goal:** Verify the full lifecycle of the hivefiver system through end-to-end user journey test scenarios.
**Status:** `gaps_found`
**Score:** 4/6 journeys verified (with caveats)
**Generated:** 2026-03-26T17:53:26+07:00

---

## Journey 1: Greenfield Project Init

**Scenario:** New user installs HiveMind, runs hm-init for the first time.

### Steps Executed

| # | Step | Status | Evidence |
|---|------|--------|----------|
| 1 | `createHivemindHmInitTool('/fake/root')` returns a valid tool | ❌ BLOCKED | `@opencode-ai/plugin/tool` subpath not resolvable at runtime via `npx tsx`. Build passes (TypeScript resolves it), but runtime execution fails. |
| 2 | Execute with `{ mode: 'greenfield' }` | ❌ BLOCKED | Same import issue prevents runtime execution. |
| 3 | Response mentions what would be bootstrapped | ⚠️ CODE-ONLY | Source analysis (`src/tools/hivefiver-init/tools.ts:49-56`) shows greenfield mode returns 5 proposed changes: `.hivemind/`, `session.json`, `trajectory/`, `workflow/`, `activity/`. |
| 4 | Uses `context.ask()` before writing | ⚠️ PARTIAL | Source shows `authorizationRequired: true` in result, but no actual `context.ask()` call in the execute function. The tool is a placeholder that never writes. |

### Gap Detection

| Gap | File:Line | Severity |
|-----|-----------|----------|
| Tool does NOT reference schema types (UserPreferences, AgentTemplate) | `src/tools/hivefiver-init/tools.ts:1-78` | MEDIUM |
| Tool does NOT know about agent templates or skill injection | `src/tools/hivefiver-init/tools.ts:42-70` | MEDIUM |
| Tool is explicitly labeled as "placeholder implementation" | `src/tools/hivefiver-init/tools.ts:6` | LOW |
| `@opencode-ai/plugin/tool` import path fails at runtime | `src/tools/hivefiver-init/tools.ts:9` | HIGH |

### Verdict: PARTIAL — Code structure exists but is a placeholder with no real logic.

---

## Journey 2: Skill Injection at Session Start

**Scenario:** A hiveminder agent session starts. The messages.transform hook fires.

### Steps Executed

| # | Step | Status | Evidence |
|---|------|--------|----------|
| 1 | `loadSkillInjectionConfig(mockRoot)` — does it load? | ✅ PASS | Falls back to defaults when config missing. Warning logged. |
| 2 | `resolveSkillBundle('hiveminder', 'tdd', undefined, 'implementation')` — what skills come back? | ✅ PASS | Returns 6 skills: `use-hivemind-delegation`, `hivemind-gatekeeping-delegation`, `git-continuity-memory`, `hivemind-atomic-commit`, `clean-code`, `refactor`. |
| 3 | shared_skills + agent_bundle + purpose_conditional + tier2 rules are all merged | ✅ PASS | Verified: shared (1) + agent bundle (3) + purpose conditional (2) = 6 unique skills. |
| 4 | No duplicates | ✅ PASS | Deduplication works correctly via `seen` Set in `resolveTieredSkills()`. |
| 5 | Skills that don't exist on disk are warned about | ⚠️ PARTIAL | `validateSkillNames()` reports 21 missing skills, but this is due to registry path mismatch (see below). |

### Gap Detection

| Gap | File:Line | Severity |
|-----|-----------|----------|
| Skill registry scans `{packageRoot}/skills/` but skills are in `{packageRoot}/skills/skills/` | `src/shared/opencode-skill-registry.ts:88` | **CRITICAL** |
| 21 of 21 referenced skills reported as "not found" | `src/shared/skill-injection-loader.ts:179-219` | **CRITICAL** |
| Tier 1 skills (`use-hivemind`, `hivemind-spec-driven`) only injected when `phaseClassification === 'project-initiation'` | `src/shared/tiered-injection.ts:190-194` | MEDIUM |
| `phaseClassification` is always `undefined` in `resolveSkillBundle()` | `src/plugin/skill-exposure-map.ts:85` | MEDIUM |

### Conflict: Skill Registry Path Mismatch

The `opencode-skill-registry.ts` discovers skills from `{packageRoot}/skills/*/SKILL.md`, but the actual directory structure is `{packageRoot}/skills/skills/*/SKILL.md`. This means **zero skills are discovered** by the registry, making `validateSkillNames()` always report all skills as missing.

### Verdict: FUNCTIONAL but BROKEN VALIDATION — Core resolution works, but the validation layer is disconnected from reality.

---

## Journey 3: Settings Configuration Flow

**Scenario:** User wants to change governance from 'standard' to 'strict'.

### Steps Executed

| # | Step | Status | Evidence |
|---|------|--------|----------|
| 1 | `getConfigGroup('governance')` — returns current values | ✅ PASS | Returns `{ governance_level: 'standard' }` (schema defaults). |
| 2 | `validateConfigUpdate('governance', 'governance_level', 'strict')` — validates | ✅ PASS | Returns `{ status: 'success' }`. |
| 3 | `applyConfigUpdate('governance', 'governance_level', 'strict')` — returns new UserPreferences | ✅ PASS | Returns full UserPreferences with `governance_level: 'strict'`. |
| 4 | Invalid value rejected | ✅ PASS | `validateConfigUpdate('governance', 'governance_level', 'invalid')` returns error with valid values list. |

### Gap Detection

| Gap | File:Line | Severity |
|-----|-----------|----------|
| Config group keys match UserPreferences schema fields | `src/shared/config-groups.ts:52-74` vs `src/schema-kernel/config-records.ts:28-34` | ✅ VERIFIED |
| Tool imports from config-groups | `src/tools/hivefiver-setting/tools.ts:13-17` | ✅ VERIFIED |
| No `applyConfigUpdate` call in tool — tool only proposes, never applies | `src/tools/hivefiver-setting/tools.ts:89-114` | MEDIUM |
| No disk persistence — `applyConfigUpdate` returns object but doesn't write | `src/shared/config-groups.ts:160-183` | MEDIUM |

### Verdict: PASS — Config groups are properly wired to schema types, validation works correctly.

---

## Journey 4: Multi-Agent Skill Resolution

**Scenario:** Hiveminder delegates to hivemaker for a TDD task.

### Steps Executed

| # | Step | Status | Evidence |
|---|------|--------|----------|
| 1 | Resolve skills for hiveminder with purposeClass='tdd' | ✅ PASS | 6 skills: delegation, gatekeeping, git-continuity, atomic-commit, tdd-delegation, test-driven-development. |
| 2 | Resolve skills for hivemaker with purposeClass='tdd', taskClassification='tdd' | ✅ PASS | 7 skills: delegation, tdd-delegation, clean-code, refactor, test-driven-development, use-hivemind-tdd, verification-before-completion. |
| 3 | Different bundles per agent | ✅ PASS | hivemaker gets `clean-code`, `refactor`; hiveminder gets `hivemind-gatekeeping-delegation`, `git-continuity-memory`, `hivemind-atomic-commit`. |
| 4 | hivemaker gets tdd-related tier2 rules | ✅ PASS | `use-hivemind-tdd` injected via Tier 2 task-conditional rule. |
| 5 | hiveminder gets orchestrator skills + delegation | ✅ PASS | `hivemind-gatekeeping-delegation`, `git-continuity-memory`, `hivemind-atomic-commit` from agent bundle. |

### Gap Detection

| Gap | File:Line | Severity |
|-----|-----------|----------|
| Agent bundles are actually different per agent | `src/shared/skill-injection-loader.ts:42-88` | ✅ VERIFIED |
| Tier 2 rules correctly activate on taskClassification | `src/shared/tiered-injection.ts:207-218` | ✅ VERIFIED |

### Verdict: PASS — Agent bundles are distinct, Tier 2 injection works correctly.

---

## Journey 5: Config File Missing → Fallback

**Scenario:** No config/skill-injection.json exists (current reality).

### Steps Executed

| # | Step | Status | Evidence |
|---|------|--------|----------|
| 1 | `loadSkillInjectionConfig('/real/project/root')` — warns and returns defaults | ✅ PASS | Warning logged: "Config file not found... Using default skill injection config." |
| 2 | Defaults match schema expectations | ✅ PASS | Default config has all required fields: `_meta`, `shared_skills`, `agent_bundles`, `purpose_conditional`, `subsession_additions`, `excluded_skill_ids`, `default_agent`. |
| 3 | `resolveSkillBundle()` still works with defaults | ✅ PASS | Returns valid skill bundles for all tested agent/purpose combinations. |
| 4 | `messages-transform-adapter.ts` compiles | ✅ PASS | `npx tsc --noEmit` passes with zero errors. |

### Gap Detection

| Gap | File:Line | Severity |
|-----|-----------|----------|
| Default skill names don't exist on disk (registry path mismatch) | `src/shared/skill-injection-loader.ts:37-120` | **CRITICAL** |
| Fallback produces valid config structure but references non-existent skills | N/A | HIGH |

### Verdict: PASS — Fallback mechanism works correctly, but referenced skills don't resolve to disk.

---

## Journey 6: Doctor Diagnostic Scan

**Scenario:** User runs hm-doctor to check for issues.

### Steps Executed

| # | Step | Status | Evidence |
|---|------|--------|----------|
| 1 | Execute hm-doctor with `{ scope: 'skills' }` | ⚠️ CODE-ONLY | Checks if `.opencode/skills/` exists. No actual skill validation. |
| 2 | Execute with `{ scope: 'agents' }` | ⚠️ CODE-ONLY | Checks if `.opencode/agents/` exists. No agent config ref validation. |
| 3 | Execute with `{ scope: 'paths' }` | ⚠️ CODE-ONLY | Checks if `.hivemind/` exists. No paths.ts dead ref check. |
| 4 | Does it find lint:boundary violations? | ❌ NO | Doctor does NOT check for CQRS boundary violations. 5 violations exist in hooks/. |

### Gap Detection

| Gap | File:Line | Severity |
|-----|-----------|----------|
| Doctor is placeholder — only checks directory existence | `src/tools/hivefiver-doctor/tools.ts:29-82` | HIGH |
| No real validation functions referenced | `src/tools/hivefiver-doctor/tools.ts:1-109` | HIGH |
| Does NOT detect CQRS violations (hooks writing files) | N/A | MEDIUM |
| Does NOT validate skill names against registry | N/A | MEDIUM |
| Does NOT check paths.ts for dead references | N/A | MEDIUM |

### Existing Lint:Boundary Violations (Not Detected by Doctor)

| File | Line | Violation |
|------|------|-----------|
| `src/hooks/event-handler.ts` | 217 | `await writeFile(...)` — hooks must not write |
| `src/hooks/compaction-handler.ts` | 109 | `await mkdir(...)` — hooks must not write |
| `src/hooks/text-complete-handler.ts` | 172 | `await mkdir(...)` — hooks must not write |
| `src/hooks/chat-message-handler.ts` | 46 | `await mkdir(...)` — hooks must not write |
| `src/hooks/tool-execution-handler.ts` | 40 | `await mkdir(...)` — hooks must not write |

### Verdict: PARTIAL — Doctor exists but is a pure placeholder with no real diagnostic logic.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/tools/hivefiver-init/tools.ts` | 6 | "Placeholder implementation" comment | LOW | Tool is non-functional |
| `src/tools/hivefiver-doctor/tools.ts` | 6 | "Placeholder implementation" comment | LOW | Tool is non-functional |
| `src/plugin/skill-exposure-map.ts` | 85 | `phaseClassification` always undefined | MEDIUM | Tier 1 skills never injected |
| `src/shared/opencode-skill-registry.ts` | 88 | Wrong path: `skills/` vs `skills/skills/` | **CRITICAL** | Zero skills discovered |
| `src/hooks/event-handler.ts` | 217 | `writeFile` in hook (CQRS violation) | HIGH | Breaks write-side boundary |
| 4 other hook files | various | `mkdir` in hooks (CQRS violation) | HIGH | Breaks write-side boundary |

---

## Verification Commands

| Command | Result | Status |
|---------|--------|--------|
| `npx tsc --noEmit` | Zero errors | ✅ PASS |
| `npm run build` | Compiled successfully | ✅ PASS |
| `npm run lint:boundary` | 5 hook write violations | ❌ FAIL |
| `npm test` | Blocked by lint:boundary | ❌ FAIL |
| `resolveSkillBundle('hiveminder', 'tdd', undefined)` | Returns 6 skills | ✅ PASS |
| `loadSkillInjectionConfig('/fake/root')` | Falls back to defaults | ✅ PASS |
| `getConfigGroup('governance')` | Returns `{ governance_level: 'standard' }` | ✅ PASS |
| `validateConfigUpdate('governance', 'governance_level', 'strict')` | Returns success | ✅ PASS |
| `validateSkillNames(config, projectRoot)` | 21/21 skills "missing" | ❌ FAIL (registry path) |

---

## Gaps Summary

### Critical Gaps (Block Functionality)

1. **Skill Registry Path Mismatch** — `opencode-skill-registry.ts` scans `{packageRoot}/skills/` but skills live in `{packageRoot}/skills/skills/`. This breaks all skill validation and makes `validateSkillNames()` useless.

2. **Lint:Boundary Violations** — 5 hook files perform direct filesystem writes, violating the CQRS boundary (hooks must be read-only). This blocks `npm test` from running.

### High Gaps (Reduce Functionality)

3. **All Hivefiver Tools Are Placeholders** — `hm-init`, `hm-doctor`, and `hm-setting` are explicitly labeled as placeholder implementations. They return structured responses but perform no real work.

4. **Tier 1 Skills Never Injected** — `phaseClassification` is hardcoded to `undefined` in `resolveSkillBundle()`, so Tier 1 core init skills (`use-hivemind`, `hivemind-spec-driven`) are never injected.

5. **Doctor Has No Real Diagnostics** — The doctor tool only checks directory existence. It does not validate skill names, agent configs, path references, or CQRS boundaries.

### Medium Gaps (Reduce Quality)

6. **Config Groups Have No Persistence** — `applyConfigUpdate()` returns a new UserPreferences object but never writes to disk.

7. **hm-init Doesn't Reference Schema Types** — The init tool doesn't know about UserPreferences, AgentTemplate, or skill injection config.

---

## Conflicts Found

| Components | Conflict | Impact |
|------------|----------|--------|
| `opencode-skill-registry.ts` vs actual directory structure | Registry path `skills/` ≠ actual `skills/skills/` | Zero skills discoverable |
| `skill-injection-loader.ts` vs `opencode-skill-registry.ts` | Config references 21 skills, registry finds 0 | Validation always reports all missing |
| `hooks/*` vs CQRS boundary | Hooks perform filesystem writes | `npm test` fails on lint:boundary |
| `skill-exposure-map.ts` vs `tiered-injection.ts` | `phaseClassification` never set | Tier 1 injection is dead code |

---

## Recommended Fixes

1. **Fix skill registry path** — Change `opencode-skill-registry.ts:88` from `join(packageRoot, 'skills')` to `join(packageRoot, 'skills', 'skills')` or restructure the skills directory.

2. **Fix CQRS violations in hooks** — Move filesystem writes from hooks to tools or a dedicated write-side module.

3. **Set `phaseClassification` properly** — Derive it from `purposeClass` or session state instead of hardcoding `undefined`.

4. **Implement real doctor diagnostics** — Add actual validation logic for skill names, agent configs, and path references.

5. **Add persistence to config groups** — Write UserPreferences to a config file when `applyConfigUpdate` is called.

6. **Connect hm-init to schema types** — Reference UserPreferences and AgentTemplate in the init tool's proposed changes.
