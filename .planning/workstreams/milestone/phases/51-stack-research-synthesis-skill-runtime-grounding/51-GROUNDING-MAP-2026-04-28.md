# Phase 51 Grounding Map: Stack + Research/Synthesis Skills

## Loader Evidence

The rebuilt primitive loader successfully discovers all Phase 51 target skills:

| Skill | Runtime Use | Evidence Boundary |
|-------|-------------|-------------------|
| `stack-opencode` | OpenCode SDK/plugin tools, hooks, sessions, tool schema constraints | Local bundled reference + Phase 50 restart validation |
| `stack-bun-pty` | PTY command execution and `run-background-command` implementation guidance | Local stack skill + Phase 49 PTY contract tests |
| `stack-zod` | Tool input schemas and Zod-to-JSON-schema constraints | Local stack skill + schema-kernel tests |
| `stack-vitest` | Tool/hook/unit test patterns and mocking boundaries | Local stack skill + `npm test` evidence |
| `stack-nextjs` | Future sidecar/dashboard patterns reading `.hivemind/` and `.planning/` | Local stack skill; implementation deferred to sidecar phases |
| `stack-json-render` | Future generated UI/dashboard rendering patterns | Local stack skill; implementation deferred to sidecar phases |
| `hm-research-chain` | Detect → research → synthesize → artifact orchestration | Local skill + this grounding artifact |
| `hm-deep-research` | Version-matched source/doc evidence collection | Local skill; external MCP/web evidence only when invoked by future tasks |
| `hm-synthesis` | Evidence-backed artifact compression and handoff export | Local skill + this grounding artifact |

## Workflow Routing

| User Need | Load First | Then Load | Verification Gate |
|-----------|------------|-----------|-------------------|
| Build or review OpenCode plugin tool/hook code | `stack-opencode` | `stack-zod`, `stack-vitest` | `npm test`, `npm run typecheck`, `npm run build`, lifecycle gate if `src/` changes |
| Work on PTY/background command behavior | `stack-bun-pty` | `stack-opencode`, `stack-vitest` | Focused PTY tests + full suite |
| Produce stack-aware implementation guidance | `hm-research-chain` | `hm-deep-research`, `hm-synthesis`, relevant `stack-*` skill | Synthesis artifact with methodology/limitations |
| Future sidecar/dashboard workflow | `stack-nextjs` | `stack-json-render`, `stack-opencode` | Sidecar acceptance tests; not claimed in Phase 51 |
| Validate research output before implementation | `hm-synthesis` | `gate-evidence-truth` when runtime proof is claimed | Evidence hierarchy gate |

## Runtime Grounding Notes

- `.opencode/` remains soft meta-concepts only; internal runtime state belongs in `.hivemind/`.
- `stack-opencode` is the canonical versioned reference for OpenCode SDK/plugin behavior in this repo.
- `hm-research-chain` is an orchestration contract: detect, research, synthesize, then export a durable artifact.
- Phase 51 is local grounding evidence. It does not claim provider-backed live session completion; Phase 52 owns that acceptance proof.
