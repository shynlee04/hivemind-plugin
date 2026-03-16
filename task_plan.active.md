# Task Plan Active

## Goal
Advance the long-haul schema-first harness work by fixing the current red gate without regressing the entry/runtime architecture:
- repo-time validation must stop assuming `.opencode/**` is present
- first-run runtime flows must own projection creation
- framework agent contracts must match the intended role boundaries again
- SOT/governance paths must stay stable and non-date-stamped, with compatibility via symlink rather than parallel prose

## Current Phase
- [complete] Validate current implementation and identify the live failure gate
- [complete] Confirm the user correction about `.opencode/**` ownership
- [complete] Write/update failing tests for first-run projection ownership and framework-agent boundary truth
- [complete] Implement the minimal framework/code changes to pass those tests
- [complete] Re-run verification, update rolling artifacts, enforce stable SOT path rules, and prepare the atomic commit
- [in_progress] Enforce schema-validated OpenCode agent projection and deterministic slash-command agent binding

## Bounded Slice
1. Update the root rolling artifacts with the corrected runtime-projection rule.
2. Red phase:
   - make boundary tests stop treating `.opencode/**` as repo truth
   - add or tighten tests so `hm-init`/auto-init own user-side projection creation
   - add or tighten tests so `harness` does not write `.opencode/**` implicitly
   - align framework-agent contract tests with current authority rules
3. Green phase:
   - move runtime projection writes into `runInit()` and recovery flows as needed
   - remove repo-time parity requirement from boundary script
   - repair framework agent markdown contracts
   - move install-guide authority to a stable non-date-stamped path
   - convert compatibility governance surfaces to symlinks where appropriate
4. Verification phase:
   - targeted tests
   - typecheck
   - full `npm test`
   - build

## Risks
- Changing repo-time parity rules can mask genuine drift if projection ownership is not simultaneously tested through first-run execution.
- Agent contract edits can drift from `opencode.json` or command metadata if the slice grows too wide.
- `harness` currently mixes diagnostics and mutation; removing writes there may expose hidden assumptions elsewhere.

## Out Of Scope For This Slice
- Full lineage/taxonomy schema expansion across trajectory, SOT, and delegation families
- Full OpenCode session API migration
- Command-surface cleanup outside the current first-run/runtime-projection boundary
- Deep `.opencode/**` command content review beyond removing source-authority assumptions

## Success Criteria
- Repo-time boundary checks no longer require `.opencode/**` in the worktree.
- Runtime/project init paths create `.opencode/**` on the user side when bootstrap actually runs.
- `harness` can inspect state without implicitly creating runtime projection surfaces.
- Framework agent markdown contracts are internally consistent for the touched agents.
- Stable install/governance SOT paths are non-date-stamped, with symlinked compatibility entries where required.

## Slice Result
- Success criteria met for the bounded slice.
- Full suite is green after the correction.
- Stable-path governance rules are now encoded in README, AGENTS, tests, and compatibility symlinks.
- Next slice should target the broader lifecycle/schema constitution work rather than more `.opencode/**` ownership cleanup.

## Active Red-Green Slice
1. Red:
   - prove canonical `agents/**` cannot be mirrored raw into `.opencode/agents/**`
   - prove every slash-command bundle resolves to a registered projected agent
2. Green:
   - add shared OpenCode-safe agent projection registry
   - switch runtime agent sync to projection output
   - fail fast during bundle preview/execution when an agent binding is missing
   - make repo parity checks compare against generated projection, not raw source files
3. Verification:
   - `npx tsx --test tests/opencode-agent-projection.test.ts`
   - `npx tsx --test tests/plugin-runtime.test.ts tests/runtime-turn-output.test.ts tests/agent-boundary-policy.test.ts`
   - `bash scripts/check-agent-registry-parity.sh`
   - `npx tsc --noEmit`
   - `npm test`
   - `npm run build`

## Next Verification Commands
- `bash scripts/check-agent-registry-parity.sh`
- `npx tsx --test tests/agent-boundary-policy.test.ts`
- `npx tsx --test tests/control-plane-runtime-tools.test.ts tests/harness-command.test.ts tests/slash-command-stack.test.ts tests/runtime-entry-attachment.test.ts`
- `npx tsc --noEmit`
- `npm test`
- `npm run build`
