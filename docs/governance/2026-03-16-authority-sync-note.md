# Authority Sync Note - 2026-03-16

This note freezes the Cycle 1 authority surface for boundary decisions. It documents what is true in the repo now, what prose is stale, where consumer-facing and internal/runtime surfaces differ, and which source wins when files disagree.

## Scope And Method

- This note is documentation-only and evidence-led, per `docs/plans/2026-03-16-cycle-1-authority-boundary-truth-pass.md:15`, `docs/plans/2026-03-16-cycle-1-authority-boundary-truth-pass.md:17`, and `docs/plans/2026-03-16-cycle-1-authority-boundary-truth-pass.md:48`.
- Repo-level boundary claims start from `AGENTS.md:7`, `AGENTS.md:9`, `AGENTS.md:10`, `AGENTS.md:12`, `AGENTS.md:13`, and `AGENTS.md:14`, but shipping claims are checked against `package.json:6`, `package.json:8`, `package.json:18`, and `package.json:26` because npm payload is determined there.

## Current Truth Versus Stale Descriptors

| Topic | What is true now | Status of conflicting descriptors |
|---|---|---|
| Runtime tools location | `hivemind_runtime_status` and `hivemind_runtime_command` are imported from `src/tools/runtime/index.js` and registered from there, not defined inline in the plugin entry. Evidence: `src/plugin/opencode-plugin.ts:15`, `src/plugin/opencode-plugin.ts:16`, `src/plugin/opencode-plugin.ts:111`, `src/plugin/opencode-plugin.ts:112`, `src/tools/runtime/tools.ts:22`, `src/tools/runtime/tools.ts:57`. | `src/plugin/AGENTS.md:12`, `src/plugin/AGENTS.md:16`, `src/tools/AGENTS.md:59`, `src/tools/AGENTS.md:60`, and `AGENTS.md:143`-style claims are stale on this point because the extraction has already happened in source. |
| Tool schema adoption | Current tool implementations already use `tool.schema` in task, trajectory, handoff, and runtime tools. Evidence: `src/tools/task/tools.ts:25`, `src/tools/trajectory/tools.ts:24`, `src/tools/handoff/tools.ts:36`, `src/tools/runtime/tools.ts:63`, `src/tools/runtime/tools.ts:77`. | `src/tools/AGENTS.md:12` and `AGENTS.md:180` are stale as written because "zero Zod" is no longer true. The higher-level rule in `AGENTS.md:120` remains current. |
| SDK hook adoption | The live plugin registers `chat.message`, `permission.ask`, `tool.execute.before`, `command.execute.before`, `tool.execute.after`, `shell.env`, `experimental.chat.system.transform`, `experimental.chat.messages.transform`, and `experimental.session.compacting`. Evidence: `src/plugin/opencode-plugin.ts:107`, `src/plugin/opencode-plugin.ts:117`, `src/plugin/opencode-plugin.ts:151`, `src/plugin/opencode-plugin.ts:169`, `src/plugin/opencode-plugin.ts:175`, `src/plugin/opencode-plugin.ts:182`, `src/plugin/opencode-plugin.ts:204`, `src/plugin/opencode-plugin.ts:207`, `src/plugin/opencode-plugin.ts:236`, `src/plugin/opencode-plugin.ts:319`. | `src/plugin/AGENTS.md:46`, `src/plugin/AGENTS.md:48`, `src/plugin/AGENTS.md:49`, `src/plugin/AGENTS.md:60`, and `src/plugin/AGENTS.md:61` are stale because they still label several adopted hooks and client APIs as "adopt now" work. |
| Logging and toast integration | The SDK integrations claimed in the 2.9.5 changelog are present now: `client.app.log()` is used in `src/shared/logging.ts:24`, and `client.tui.showToast()` is used in `src/hooks/soft-governance.ts:36`. | `CHANGELOG.md:22` is current on these two points. `src/plugin/AGENTS.md:60` and `src/plugin/AGENTS.md:61` are stale because they still describe them as future adoption. |
| Removed modules | `src/core/session/`, `src/shared/event-bus.ts`, and `src/hooks/session-lifecycle.ts` are absent from the repo, matching the 2.9.5 removal claims. Evidence: `CHANGELOG.md:14`, `CHANGELOG.md:15`, `CHANGELOG.md:16`, plus the current repo inventory showing no matches for those paths. | `CHANGELOG.md:13`-`CHANGELOG.md:18` is current on the removals that were checked. `AGENTS.md:175` and `AGENTS.md:176` are also current on the removals. |
| Consumer-facing shipped surface | The npm/package surface is the payload in `package.json:26`: `dist`, `bin`, `skills`, `commands`, `agents`, `workflows`, `README.md`, `LICENSE`, and `CHANGELOG.md`. The executable entrypoints and plugin export are defined in `package.json:6`, `package.json:8`, and `package.json:18`. | `AGENTS.md:9` is directionally correct but incomplete for consumer shipping because it omits `README.md`, `LICENSE`, and `CHANGELOG.md`, and it should not be used alone to infer the publish payload. |
| Internal dev mirror | `.opencode/agents/**` exists in the repo as a local mirror surface, and root governance says it is not independent authority. Evidence: `AGENTS.md:12`, `AGENTS.md:33`, plus current `.opencode/**` inventory in the worktree. | This part of `AGENTS.md` is current. It needs no correction, only explicit separation from consumer shipping because `.opencode/**` is not listed in `package.json:26`. |
| Runtime-generated surface | `.hivemind/**` exists in the current worktree as generated state and planning output, while root governance says it is runtime output and not an authoring surface. Evidence: `AGENTS.md:13`, `AGENTS.md:192`, plus current `.hivemind/**` inventory in the worktree. | This part of `AGENTS.md` is current. It also needs explicit separation from consumer shipping because `.hivemind/**` is not listed in `package.json:26`. |

## Authoritative Versus Lagging Sources

### 1. Repo Governance And Surface Classification

- `AGENTS.md` is the current repo-level authority for classifying source, shipped product, dev mirror, runtime-generated output, and sector boundaries. Evidence: `AGENTS.md:7`, `AGENTS.md:9`, `AGENTS.md:10`, `AGENTS.md:12`, `AGENTS.md:13`, `AGENTS.md:14`.
- `src/plugin/AGENTS.md` and `src/tools/AGENTS.md` are lagging on multiple factual statements about current code state, so they should be treated as intent/boundary documents, not as source-of-truth for whether a migration is already complete. Evidence: `src/plugin/AGENTS.md:12`, `src/plugin/AGENTS.md:46`, `src/plugin/AGENTS.md:60`, `src/tools/AGENTS.md:12`, `src/tools/AGENTS.md:59`, compared with `src/plugin/opencode-plugin.ts:111`, `src/plugin/opencode-plugin.ts:151`, `src/tools/task/tools.ts:25`, and `src/tools/runtime/tools.ts:63`.

### 2. Shipping And Consumer Reality

- `package.json` is authoritative for what npm consumers actually receive and execute. Evidence: `package.json:6`, `package.json:8`, `package.json:18`, `package.json:26`.
- `CHANGELOG.md` is a release narrative, useful for dating changes, but it is not the final authority for current code layout or shipped payload when code or packaging says otherwise. Evidence: `CHANGELOG.md:24`, `CHANGELOG.md:33`, `CHANGELOG.md:36`, checked against `package.json:26`, `src/plugin/opencode-plugin.ts:111`, and `src/tools/runtime/tools.ts:57`.

### 3. Live Implementation Reality

- Current `src/**/*.ts` files are authoritative for whether an extraction, hook adoption, or integration is actually present now. Evidence: `src/plugin/opencode-plugin.ts:98`, `src/plugin/opencode-plugin.ts:111`, `src/plugin/opencode-plugin.ts:151`, `src/tools/runtime/tools.ts:57`, `src/shared/logging.ts:24`, `src/hooks/soft-governance.ts:36`.
- `docs/architecture/sdk-native-architecture.md` is partly current but partly lagging. Its high-level direction matches the repo on extracted runtime tools and removed custom event/session layers, but its hook-registration ownership table no longer matches the current file layout. Evidence supporting the current parts: `docs/architecture/sdk-native-architecture.md:40`, `docs/architecture/sdk-native-architecture.md:64`, `docs/architecture/sdk-native-architecture.md:65`, `package.json:53`, `src/plugin/opencode-plugin.ts:111`. Evidence on the lagging parts: `docs/architecture/sdk-native-architecture.md:54`, `docs/architecture/sdk-native-architecture.md:55`, contrasted with `src/plugin/opencode-plugin.ts:175`, `src/plugin/opencode-plugin.ts:207`, `src/plugin/opencode-plugin.ts:236`, and `src/plugin/opencode-plugin.ts:319`.

## Consumer, Internal, And Runtime Surface Separation

### Consumer-facing shipped surfaces

- Consumers receive the compiled/plugin-facing payload from `dist` and the CLI bins defined in `package.json:18`, plus the packaged asset families in `package.json:26`.
- Consumers do not receive repo-only governance authoring surfaces such as `docs/**`, `.opencode/**`, or `.hivemind/**` because those paths are not in `package.json:26`.

### Internal self-hosting and contributor surfaces

- Root `AGENTS.md` and sector `src/*/AGENTS.md` govern contributor behavior in this repository. Evidence: `AGENTS.md:7`, `AGENTS.md:14`.
- `.opencode/**` is an internal/local projection and mirror surface for self-hosting or local development, not the shipped authority surface. Evidence: `AGENTS.md:12`, `AGENTS.md:33`.

### Runtime-generated surfaces

- `.hivemind/**` is live runtime output after initialization and command execution, not a source-authoring surface. Evidence: `AGENTS.md:13`, `AGENTS.md:192`.
- The presence of `.hivemind/**` files in this worktree confirms runtime state exists locally, but that does not make it authoritative for governance prose or package contents.

## Unresolved Or Needs-Qualification Conflicts

- Plugin "assembly-only" is only partially verified. It is true that tool definitions are no longer inline, but `src/plugin/opencode-plugin.ts` still contains helper functions and hook bodies that do non-trivial work, including message shaping and trajectory-event recording. Evidence: `AGENTS.md:169`, `src/plugin/AGENTS.md:7`, `src/plugin/opencode-plugin.ts:36`, `src/plugin/opencode-plugin.ts:52`, `src/plugin/opencode-plugin.ts:70`, `src/plugin/opencode-plugin.ts:117`, `src/plugin/opencode-plugin.ts:236`. This note does not guess whether that remaining logic is acceptable assembly or drift; later packets should classify it explicitly.
- The repo-level CQRS rule says hooks are read-only and tools own writes, but the plugin's `tool.execute.before` and `tool.execute.after` paths call `recordTrajectoryEvent`, which appears to write trajectory state from hook execution. Evidence: `AGENTS.md:43`, `AGENTS.md:124`, `docs/architecture/sdk-native-architecture.md:43`, `src/hooks/AGENTS.md:3`, `src/hooks/AGENTS.md:35`, `src/plugin/opencode-plugin.ts:70`, `src/plugin/opencode-plugin.ts:76`, `src/plugin/opencode-plugin.ts:169`, `src/plugin/opencode-plugin.ts:172`, `src/plugin/opencode-plugin.ts:204`, `src/plugin/opencode-plugin.ts:205`. This is an unresolved conflict and should stay unresolved in Cycle 1 Packet 1.
- Hook naming is qualified, not fully contradictory. `src/plugin/AGENTS.md:76` says prose may use canonical short names while code keeps SDK `experimental.*` keys, and current code does exactly that for system/message/compaction transforms. Evidence: `src/plugin/AGENTS.md:76`, `src/plugin/opencode-plugin.ts:207`, `src/plugin/opencode-plugin.ts:236`, `src/plugin/opencode-plugin.ts:319`.

## Supersession Table For Cycle 1

| Decision area | Source that wins now | Why |
|---|---|---|
| What npm consumers actually receive | `package.json` | Packaging, exports, and bins are executable/package truth. See `package.json:6`, `package.json:8`, `package.json:18`, `package.json:26`. |
| Whether a migration is already complete in code | Current `src/**/*.ts` implementation | Live source overrides stale migration prose. See `src/plugin/opencode-plugin.ts:111`, `src/tools/runtime/tools.ts:57`, `src/shared/logging.ts:24`. |
| Repo-wide asset class and governance intent | `AGENTS.md` | Root governance defines source, mirror, runtime, and sector boundaries. See `AGENTS.md:7`, `AGENTS.md:9`, `AGENTS.md:12`, `AGENTS.md:13`, `AGENTS.md:14`. |
| Sector-local intended boundary | Sector `src/*/AGENTS.md` | Use these for local intent only after checking current code for drift. See `src/plugin/AGENTS.md:7`, `src/tools/AGENTS.md:5`. |
| Release history/date of a change | `CHANGELOG.md` | Useful for chronology, but subordinate to code and packaging for current-state disputes. See `CHANGELOG.md:10`. |

## Cycle 1 Freeze

- Treat extracted runtime tools, adopted SDK hooks, SDK logging, and SDK toast wiring as current facts.
- Treat package shipping as defined by `package.json`, not by shorthand prose lists.
- Treat `.opencode/**` as internal mirror-only and `.hivemind/**` as runtime-generated.
- Carry forward the plugin-boundary and CQRS-write contradictions as unresolved, not assumed resolved.
