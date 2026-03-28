# Session Inspection Export

- ses_id: `ses_2da8ae69fffefNSi7xfKM19VkJ`
- prepared_at: `2026-03-25T14:45:50.088Z`

## Assistant Output

The complete file has been read. Here is a summary of every key element with exact line references:

## File: `/Users/apple/hivemind-plugin/.worktrees/product-detox/src/plugin/skill-exposure-map.ts` (255 lines)

### 1. `SHARED_SKILLS` (lines 22–27)
Always-on skills across all agents:
- `use-hivemind-delegation`

### 2. `MAX_SKILLS` (line 30)
```typescript
const MAX_SKILLS = 7
```

### 3. `AGENT_BUNDLES` (lines 38–94)
9 agent entries keyed by registered agent ID:

| Agent | Skills (by name) | Lines |
|-------|-------------------|-------|
| `hiveminder` | `hivemind-gatekeeping-delegation`, `git-continuity-memory`, `hivemind-atomic-commit` | 39–43 |
| `hivefiver` | `hivemind-gatekeeping-delegation`, `git-continuity-memory`, `hivemind-atomic-commit` | 45–49 |
| `hiveq` | `tdd-delegation`, `verification-before-completion`, `test-driven-development` | 51–55 |
| `hivemaker` | `tdd-delegation`, `clean-code`, `refactor`, `test-driven-development` | 57–62 |
| `hiveplanner` | `writing-plans`, `breakdown-plan`, `spec-distillation` | 64–68 |
| `hivexplorer` | `research-delegation`, `context-map`, `hivemind-codemap`, `hivemind-research` | 70–75 |
| `hiverd` | `research-delegation`, `deep-research`, `hivemind-research` | 77–81 |
| `hivehealer` | `course-correction-delegation`, `systematic-debugging`, `hivemind-system-debug` | 83–87 |
| `hitea` | `tdd-delegation`, `qa-test-planner`, `test-driven-development` | 89–93 |

### 4. `PURPOSE_CONDITIONAL` (lines 97–122)
6 purpose classes:

| Purpose | Skills |
|---------|--------|
| `tdd` | `tdd-delegation`, `test-driven-development` |
| `research` | `research-delegation`, `deep-research` |
| `planning` | `writing-plans`, `breakdown-plan` |
| `implementation` | `clean-code`, `refactor` |
| `course-correction` | `course-correction-delegation`, `systematic-debugging` |
| `gatekeeping` | `hivemind-gatekeeping-delegation`, `verification-before-completion` |

### 5. `SUBSESSION_ADDITIONS` (lines 125–127)
- `git-continuity-memory`

### 6. `resolveSkillBundle` function (lines 137–188)
Resolution order:
1. Shared skills (always-on)
2. Agent-specific bundle (falls back to `hivefiver` for unknown agents)
3. Purpose-conditional skills (if `purposeClass` matches)
4. Sub-session additions (if `sessionState === 'sub-session'`)
5. Deduplicates via `seen` Set, caps at `MAX_SKILLS` (7)

### 7. `resolveSessionRole` function (lines 212–240)
Returns `SessionRole` (`orchestrate` | `specialist` | `standalone`):
- `hiveminder`/`hivefiver` → `orchestrate`
- `sub-session` state → `specialist`
- Specialist agents (`hiveq`, `hivemaker`, `hivehealer`, `hitea`) → `specialist`
- Standalone agents (`hivexplorer`, `hiverd`, `hiveplanner`) → `standalone`
- Default: `sub-session` → `specialist`, else `orchestrate`

### 8. `renderSessionRoleDirective` function (lines 246–255)
Returns natural-language directive strings for each `SessionRole`.

### Complete list of all unique skill name strings in the file:
1. `use-hivemind-delegation`
2. `hivemind-gatekeeping-delegation`
3. `git-continuity-memory`
4. `hivemind-atomic-commit`
5. `tdd-delegation`
6. `verification-before-completion`
7. `test-driven-development`
8. `clean-code`
9. `refactor`
10. `writing-plans`
11. `breakdown-plan`
12. `spec-distillation`
13. `research-delegation`
14. `context-map`
15. `hivemind-codemap`
16. `hivemind-research`
17. `deep-research`
18. `course-correction-delegation`
19. `systematic-debugging`
20. `hivemind-system-debug`
21. `qa-test-planner`