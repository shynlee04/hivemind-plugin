# Phase 28 Rich Gate Baseline

| Skill | Package resources observed | RICH status | Blocker |
|-------|----------------------------|-------------|---------|
| `hm-deep-research` | `SKILL.md`, references; no evals/scripts/assets observed | BLOCKED | Needs top-3 third-party crawl and bundled-resource comparison. |
| `hm-detective` | `SKILL.md`, references; no evals/scripts/assets observed | BLOCKED | Needs top-3 third-party crawl and bundled-resource comparison. |
| `hm-synthesis` | `SKILL.md`, references; no evals/scripts/assets observed | BLOCKED | Needs top-3 third-party crawl and bundled-resource comparison. |
| `hm-research-chain` | `SKILL.md`, evals, references, scripts | BLOCKED | Has stronger local package shape, but still lacks third-party-source evidence and Pattern 1/2/3 adoption record. |

## Discovery Evidence Captured

`npx --yes skills find "deep research agent skill"` returned:

1. `parallel-web/parallel-agent-skills@parallel-deep-research` — 1.3K installs.
2. `skills.volces.com@deep-research` — 159 installs.
3. `qodex-ai/ai-agent-skills@deep-research-agent` — 142 installs.

This is not enough for PASS. It is only the starting list for the RICH-1 crawl.
