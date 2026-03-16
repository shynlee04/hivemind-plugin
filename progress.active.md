# Progress Active

## 2026-03-17

### Current Gate
- The repo-level entry/runtime corrections remain in place and verified.
- Fresh validation showed `npx tsc --noEmit` passes.
- Fresh validation showed `npm test` passes end-to-end with the new governance-path guard.
- Fresh validation showed `npm run build` passes.

### User Correction Locked
- `.opencode/**` is not a source-authority surface.
- `.opencode/**` is user-local runtime projection created on first run at the consumer side.
- Repo-time validation must not require `.opencode/**` to exist in the framework worktree.
- First-run runtime flows (`hm-init`, auto-init, and repair flows where applicable) must own projection creation.
- SOT and governance paths must stay stable and non-date-stamped.
- Compatibility entry files should prefer symlinks back to the stable authority surface instead of carrying parallel governance text.

### Evidence
- `tests/runtime-surface-governance.test.ts` now guards:
  - stable `docs/guide/installation.md` as the install SOT path
  - no legacy planning-file leakage in shipped `hivemind-*.md` command assets
  - real runtime registry statements in `AGENTS.md`
  - symlinked compatibility surfaces for `CLAUDE.md` and the dated install alias
  - `syncRuntimeSurface()` remaining limited to first-run and repair flows
- `CLAUDE.md` now resolves to `AGENTS.md` as a compatibility symlink.
- `docs/guide/installation-2026-03-17.md` now resolves to `docs/guide/installation.md` as a compatibility symlink.

### External Validation
- OpenCode official docs keep plugins and custom tools on the native `@opencode-ai/plugin` + `tool.schema` path.
- JSON Schema direction should stay Draft 2020-12 with explicit validation gates if/when HiveMind exports schemas.
- Oh My OpenAgent is a useful comparative reference for strict schema validation, but not an authority over HiveMind runtime ownership rules.

### Active Slice
- Restore the rolling root artifacts.
- Move `.opencode/**` generation responsibility to first-run/repair execution paths rather than repo-time assumptions.
- Remove repo-time tests and boundary scripts that read `.opencode/**` as if it were canonical source.
- Reconcile framework agent contracts that drifted during previous edits, starting with `hivefiver`, `hivemaker`, `hivehealer`, and `hiveplanner`.
- Enforce stable non-date-stamped SOT/governance paths for install and compatibility entry surfaces.

### Completed Slice
- `hivemind_runtime_command` auto-init now creates user-side `.opencode/**` through the init authority path instead of leaving that responsibility to harness or repo-time assumptions.
- `hm-doctor` now re-syncs runtime surfaces when recovery reaches a healthy state.
- `harness` no longer writes `.opencode/**` implicitly during inspection.
- Repo-time parity checks now skip missing `.opencode/agents/**` because that surface is runtime-side, not source authority.
- Touched framework-agent contracts now match their intended execution/delegation posture for this slice.
- `docs/guide/installation.md` is now the stable install SOT path.
- `docs/guide/installation-2026-03-17.md` is now a compatibility symlink, not the authority file.
- `CLAUDE.md` is now a compatibility symlink back to `AGENTS.md`.

### Verification Evidence
- `npx tsx --test tests/runtime-surface-governance.test.ts` -> pass
- `npx tsc --noEmit` -> pass
- `bash scripts/check-agent-registry-parity.sh` -> pass with runtime-projection skip message
- `npm test` -> pass (`131` tests passed, `0` failed)
- `npm run build` -> pass
- Prior bounded-slice gates still remain green:
- `npx tsx --test tests/agent-boundary-policy.test.ts tests/control-plane-runtime-tools.test.ts tests/harness-command.test.ts` -> pass
- `bash scripts/check-agent-registry-parity.sh` -> pass with runtime-projection skip message
- `npx tsx --test tests/slash-command-stack.test.ts tests/runtime-entry-attachment.test.ts` -> pass

### Remaining Drift Outside This Slice
- The worktree still shows deleted `.opencode/**` and `.hivemind/**` files from the local workspace state. Those were intentionally treated as evidence of the user-local/runtime distinction and were not restored.
- `MASTER.active.md` still points at broader cycle work that has not yet been implemented, especially the larger lifecycle/schema-family expansion.

### New Active Rule Correction
- `docs/guide/installation.md` should be the stable SOT install path.
- `docs/guide/installation-2026-03-17.md` should survive only as a compatibility symlink, not as the authority file.
- `CLAUDE.md` should collapse to an `AGENTS.md` symlink instead of carrying its own governance prose.

### Reminder
- Keep `MASTER.active.md`, `task_plan.active.md`, and `progress.active.md` rolling every bounded slice.
- No completion claims without fresh verification evidence.
- Treat `.opencode/**` and `.hivemind/**` as runtime-side projections, never repo-side authoring truth.
