# Deferred Items

- Pre-existing `npx tsc --noEmit` failure in `src/tools/doc/tools.ts`, `src/tools/handoff/tools.ts`, `src/tools/task/tools.ts`, and `src/tools/trajectory/tools.ts`: `@opencode-ai/plugin` does not export `tool`, and the same files have implicit `any` `context` parameters.
- Pre-existing `npm test` boundary failure in fresh worktrees because `.opencode/agents/*.md` runtime mirrors are absent until runtime surface sync populates them.
