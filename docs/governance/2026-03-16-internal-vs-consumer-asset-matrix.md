# Internal vs Consumer Asset Matrix - 2026-03-16

This matrix makes the repo's self-hosting, contributor, package, and runtime surfaces explicit.
It treats `package.json` as the authority for npm shipping, `AGENTS.md` as the repo-level authority for surface classification, and `src/cli/runtime-assets.ts` plus `src/cli/init.ts` as the authority for what `hm-init` materializes into a target project.

## Evidence Basis

- Shipping and executable/package behavior come from `package.json:6`, `package.json:8`, `package.json:18`, and `package.json:26`.
- Repo-level surface ownership comes from `AGENTS.md:7`, `AGENTS.md:9`, `AGENTS.md:10`, `AGENTS.md:11`, `AGENTS.md:12`, `AGENTS.md:13`, `AGENTS.md:14`, `AGENTS.md:31`, `AGENTS.md:32`, and `AGENTS.md:33`.
- Runtime sync behavior comes from `src/cli/runtime-assets.ts:22`, `src/cli/runtime-assets.ts:42`, `src/cli/runtime-assets.ts:57`, `src/cli/runtime-assets.ts:82`, and `src/cli/runtime-assets.ts:96`.
- `hm-init` calling that sync path comes from `src/cli/init.ts:41` and `src/cli/init.ts:79`.

## Matrix

| Surface | Authority owner | Shipped to consumer | Internal/dev-only | Runtime-generated | Notes on sync or projection behavior |
|---|---|---|---|---|---|
| `agents/` | Root `agents/**` is the authoritative authoring surface for agent contracts. See `AGENTS.md:11` and `AGENTS.md:32`. | Yes. See `package.json:26` and `package.json:31`. | No. | No. | `syncRuntimeSurface()` copies root agent markdown into consumer-local `.opencode/agents/`; the copy is a mirror, not a second authority. See `AGENTS.md:12`, `AGENTS.md:33`, and `src/cli/runtime-assets.ts:57`. |
| `.opencode/` | No root authority lives here by default; in repo governance it is a local mirror or projection surface, not an independent source of truth. See `AGENTS.md:12` and `AGENTS.md:33`. | No. `.opencode/**` is not in `package.json:26`. | Yes. | No. | Operationally, runtime sync creates or updates `.opencode/commands/`, `.opencode/agents/`, and `.opencode/plugins/hivemind-context-governance.ts` in a target project. The self-hosting repo also contains extra checked-in `.opencode/**` content for local use, but that is still not the package authority surface. See `src/cli/runtime-assets.ts:42`, `src/cli/runtime-assets.ts:57`, and `src/cli/runtime-assets.ts:82`. |
| `commands/` | Root `commands/*.md` files are the shipped slash-command contracts. See `commands/AGENTS.md:4` and `src/commands/slash-command/AGENTS.md:15`. | Yes. See `package.json:26` and `package.json:30`. | No. | No. | Runtime sync mirrors discovered command bundles from root `commands/` into consumer-local `.opencode/commands/`. See `src/cli/runtime-assets.ts:42` and `src/commands/slash-command/command-discovery.ts:4`. |
| `skills/` | Root `skills/` plus `skills/registry.yaml` own skill registration and source-of-truth status. See `skills/registry.yaml:2`, `skills/registry.yaml:10`, and `skills/registry.yaml:12`. | Yes. See `package.json:26` and `package.json:29`. | No. | No. | The registry explicitly says mirror-only `.opencode/skills/` entries are not listed there, which keeps root `skills/` authoritative even if a local fallback mirror exists. See `skills/registry.yaml:12`. |
| `workflows/` | Root `workflows/` is the shipped workflow asset family because it is packaged from the root surface. See `package.json:26` and `package.json:32`. | Yes. | No. | No. | Current runtime sync does not mirror root `workflows/` into `.opencode/`; `src/cli/runtime-assets.ts` only copies commands and agents and writes a plugin stub. |
| `dist/` | Built package output compiled from `src/`; package entrypoints and exports resolve here. See `package.json:6`, `package.json:7`, `package.json:10`, `package.json:15`, and `src/AGENTS.md:3`. | Yes. See `package.json:26` and `package.json:27`. | No. | No. | This is the consumer-executed code surface for package import and CLI aliases. `package.json` points main, types, exports, and every alias binary to `dist/**`. See `package.json:6`, `package.json:7`, `package.json:10`, `package.json:15`, and `package.json:18`. |
| `bin/` | Repo-owned utility script surface shipped alongside the package. | Yes. See `package.json:26` and `package.json:28`. | No. | No. | Important distinction: the npm `bin` aliases do not point into `bin/`; they all point to `dist/cli.js`. So `bin/` ships, but the main executable entrypoint is still `dist/cli.js`. See `package.json:18` and `package.json:19`. |
| `src/` | Product implementation source. Root governance calls this the source code surface. See `AGENTS.md:10` and `src/AGENTS.md:1`. | No under current package payload, because `src/` is not listed in `package.json:26`. | Yes. | No. | `src/` drives the build and runtime behavior, but consumers receive compiled `dist/` artifacts instead of raw `src/` under the current package files list. This is one place where shipping truth must come from `package.json`, not shorthand prose alone. |
| `.hivemind/` | Runtime state and generated project output, not an authoring surface. See `AGENTS.md:13`, `AGENTS.md:114`, and `AGENTS.md:192`. | No. `.hivemind/**` is not in `package.json:26`. | No. | Yes. | `hm-init` and runtime tools create and use this surface as project-local state. `initProject()` runs runtime sync and then the `hm-init` bundle; path helpers and runtime tools both treat `.hivemind/` as generated state, not authored package content. See `src/cli/init.ts:47`, `src/cli/init.ts:79`, `src/shared/paths.ts:9`, and `src/tools/runtime/tools.ts:61`. |
| `AGENTS.md` | Repo-level governance authority for surface classes and ownership rules. See `AGENTS.md:7` through `AGENTS.md:14`. | No under the current package files list. | Yes. | No. | This file is the best authority for repo-local boundary intent, but not for final npm payload. Shipping still has to be checked against `package.json`. |
| `package.json` | Package authority for imports, CLI aliases, and published file selection. See `package.json:6`, `package.json:8`, `package.json:18`, and `package.json:26`. | Yes, as package metadata that defines the package surface. | No. | No. | Use this file when deciding what npm consumers actually get. It overrides shorthand prose when surface classification and publish payload differ. |
| `opencode.json` | Repo-local OpenCode configuration authority for this workspace. See `AGENTS.md:190` and `opencode.json:1`. | No. It is not in `package.json:26`. | Yes. | No. | Runtime sync edits a target project's `opencode.json` by removing package plugin entries before writing a local plugin stub into `.opencode/plugins/`. That behavior is local attachment logic, not published package payload. See `src/cli/runtime-assets.ts:22` and `src/cli/runtime-assets.ts:37`. |

## Most Important Distinctions

- `package.json` decides consumer shipping; repo presence alone does not.
- Root `agents/`, `commands/`, `skills/`, and `workflows/` are the shipped asset families; `.opencode/**` is not.
- `.opencode/**` is a local mirror or projection surface, and current runtime sync only materializes commands, agents, and a plugin stub there.
- `.hivemind/**` is runtime-generated project state, not a source-authoring or shipped package surface.
- `dist/` is what consumers execute; `src/` is the implementation source that produces it.
- `bin/` ships, but npm alias binaries still resolve to `dist/cli.js`, not to files under `bin/`.

## Qualification Notes

- `src/AGENTS.md:3` says everything under `src/` ships as the npm package, but the current publish payload in `package.json:26` does not include raw `src/`. For shipping questions, treat `package.json` as authoritative.
- The repo contains many checked-in `.opencode/**` files for self-hosting and local development, but `src/cli/runtime-assets.ts` shows that consumer-local runtime sync currently mirrors only commands, agents, and a plugin stub. Do not assume `.opencode/` is a full projection of every shipped root asset family.
