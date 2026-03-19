# Deferred Items

## 2026-03-19

- Pre-existing `npx tsc --noEmit` failures remain in `src/tools/doc/tools.ts`, `src/tools/handoff/tools.ts`, `src/tools/task/tools.ts`, and `src/tools/trajectory/tools.ts` because `@opencode-ai/plugin` no longer exports `tool` and those files still use implicit `context` parameters. These files are outside Plan `11-02` and were not modified here.
