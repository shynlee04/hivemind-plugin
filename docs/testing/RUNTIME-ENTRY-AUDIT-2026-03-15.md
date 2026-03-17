# Runtime Entry Audit

Date: 2026-03-15
Scope: `s/ecosystem-revamp`
Companion to: `docs/testing/STRESS-TEST-MATRIX-2026-03-14.md`

## Findings

- The worktree had a real internal runtime bridge, but OpenCode could not load it from the worktree because `.opencode/plugins/` was missing.
- `opencode.json` still loaded the npm plugin entry, which drifted away from the current revamp source tree.
- The CLI contract pointed at `dist/cli.js`, but the repo had no stable entry surface proving that the emitted CLI, the runtime plugin, and the local `.opencode` mirror were aligned.
- The `.opencode/commands/` mirror still exposed the legacy pack and did not include the `hm-*` runtime-attachment command set.

## Attachment Actions

- Restored a real CLI entry at `src/cli.ts` so `dist/cli.js` can be emitted by TypeScript.
- Added a real OpenCode plugin entry at `src/plugin/opencode-plugin.ts`.
- Added a tracked local plugin bridge at `.opencode/plugins/hivemind-context-governance.ts`.
- Switched package plugin consumption to the explicit `hivemind-context-governance/plugin` export.
- Removed the worktree npm plugin config entry from `opencode.json` so the local `.opencode/plugins/` surface becomes the active path during worktree validation.

## Remaining Follow-Through

- Keep `.opencode/commands/` aligned with the `hm-*` runtime bundle set.
- Prove the load path with `npx tsc --noEmit`, `npm run build`, and targeted runtime tests.
- Continue reducing mutation-boundary drift so runtime writes are explicit and traceable.
