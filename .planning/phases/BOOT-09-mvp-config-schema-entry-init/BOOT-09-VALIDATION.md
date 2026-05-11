# Phase BOOT-09: MVP Config Schema + Entry Init Verification — Validation Strategy

**Phase:** BOOT-09
**Created:** 2026-05-12
**Status:** Ready for execution

## Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (latest) |
| Config file | `vitest.config.ts` at project root |
| Quick run command | `npx vitest run tests/hooks/create-core-hooks.test.ts tests/hooks/create-tool-guard-hooks.test.ts tests/hooks/governance-block.test.ts tests/schema-kernel/` |
| Full suite command | `npx vitest run` |

## Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-01 | system.transform injects language block for main sessions | unit | `npx vitest run tests/hooks/create-core-hooks.test.ts` | ✅ Existing |
| REQ-01 | system.transform skips language block for child sessions | unit | `npx vitest run tests/hooks/create-core-hooks.test.ts` | ❌ Wave 0 |
| REQ-02 | Language instruction includes override behavior | unit | `npx vitest run tests/hooks/create-core-hooks.test.ts` | ❌ Wave 0 |
| REQ-03 | document_paths field in schema with default | unit | `npx vitest run tests/schema-kernel/hivemind-configs.test.ts` | ❌ Wave 0 |
| REQ-03 | tool.execute.before injects language reminder for Write/Edit at document paths | unit | `npx vitest run tests/hooks/create-tool-guard-hooks.test.ts` | ❌ Wave 0 |

## Sampling Rate

- **Per task commit:** `npx vitest run tests/hooks/ tests/schema-kernel/`
- **Per wave merge:** `npm run typecheck && npx vitest run tests/hooks/create-core-hooks.test.ts tests/hooks/create-tool-guard-hooks.test.ts tests/hooks/governance-block.test.ts`
- **Phase gate:** Full suite green before `/gsd-verify-work`

## Wave 0 Gaps

- [ ] `tests/hooks/create-core-hooks.test.ts` — Add tests for language governance block injection (main vs child sessions)
- [ ] `tests/hooks/create-tool-guard-hooks.test.ts` — Add tests for document language tool guard (Write/Edit path matching)
- [ ] `tests/schema-kernel/hivemind-configs.test.ts` — Add test for `document_paths` field with default and custom values
- [ ] Framework install: None needed — Vitest already configured
