# Phase 44 Security Verification — Tool Write-Surface & Secret Hardening

**Phase:** 44 — Tool Write-Surface & Secret Hardening  
**Verified:** 2026-04-27  
**Baseline:** after commit `d89994e0`  
**ASVS Level:** 1  
**Threats Closed:** 4/4  

## Threat Verification

| Threat ID | Category | Disposition | Status | Evidence |
|-----------|----------|-------------|--------|----------|
| P44-T1 | Arbitrary absolute path writes via `session-patch` | mitigate | CLOSED | `src/tools/session-patch/tools.ts:40-47` validates before file access; `src/tools/session-patch/tools.ts:122-139` restricts existing `session*.md` artifacts to the real active project root; `tests/tools/session-patch.test.ts:107-128` covers outside-root rejection. |
| P44-T2 | Primitive path traversal through read/inspect names | mitigate | CLOSED | `src/tools/configure-primitive.ts:304-307` and `src/tools/configure-primitive.ts:361-366` route path resolution errors into tool errors; `src/tools/configure-primitive.ts:439-470` rejects primitive names containing traversal/unsupported characters; `tests/tools/configure-primitive.test.ts:339-348` covers `../config` rejection. |
| P44-T3 | Silent primitive write failures | mitigate | CLOSED | `src/tools/configure-primitive.ts:204-214` awaits `fs.writeFile` and returns structured failure on write errors. |
| P44-T4 | MCP secret placeholder exposure / literal Tavily key | mitigate | CLOSED | `mcp.json:127-129` uses `tavilyApiKey=$TAVILY_API_KEY`; grep found no literal Tavily key pattern in JSON, only the placeholder. |

## Threat Flags

No `## Threat Flags` section was present in `44-SUMMARY-2026-04-27.md`.

## Warning Follow-up Verification

| Warning ID | Status | Evidence |
|------------|--------|----------|
| WR-01 | CLOSED | `src/tools/configure-primitive.ts:121-169` resolves `projectRoot` from tool context and forwards `basePath: resolveScopeBasePath(args.scope, projectRoot)` into compile options; `src/tools/configure-primitive-paths.ts:21-25` maps project scope to `<projectRoot>/.opencode`; `tests/tools/configure-primitive.test.ts:247-264` proves writes are rooted in explicit tool context instead of ambient process CWD. |
| WR-02 | CLOSED | `src/tools/configure-primitive.ts:225-230` validates each batch primitive name before parsing/compilation; `tests/tools/configure-primitive.test.ts:450-463` rejects `bad/name` in batch mode before compilation. |
| WR-03 | CLOSED | `src/tools/session-patch/tools.ts:130-135` rejects outside-root paths before the nonexistent-target early return; `tests/tools/session-patch.test.ts:130-142` covers nonexistent outside-root session artifacts. |

## Test Evidence

- `npx vitest run tests/tools/session-patch.test.ts tests/tools/configure-primitive.test.ts tests/lib/session-api.test.ts tests/lib/spawner/session-creator.test.ts tests/lib/delegation-manager.test.ts` — **PASS**, 5 files / 182 tests.
- `npx vitest run tests/lib/session-api.test.ts tests/lib/spawner/session-creator.test.ts tests/lib/spawner/spawn-request-builder.test.ts tests/lib/delegation-manager.test.ts tests/tools/configure-primitive.test.ts tests/tools/session-patch.test.ts` — **PASS**, 6 files / 188 tests (fresh post-Phase 45 re-verification).
- `npm run typecheck` — **PASS**.

## Residual Risks

- None for WR-01/WR-02/WR-03 after commit `566ffd56`; the previously logged residual warning paths now have source and regression-test coverage.

## Accepted Risks

None.
