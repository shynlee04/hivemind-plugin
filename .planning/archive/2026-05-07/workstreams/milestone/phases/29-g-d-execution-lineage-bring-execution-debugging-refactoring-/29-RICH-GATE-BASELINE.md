# Phase 29 Rich Gate Baseline

| Skill | Package resources observed | RICH status | Blocker |
|-------|----------------------------|-------------|---------|
| `hm-debug` | evals/references/scripts present | BLOCKED | Needs third-party crawl and Pattern 1/2/3 adoption record. |
| `hm-refactor` | evals/references/scripts present | BLOCKED | Needs third-party crawl and Pattern 1/2/3 adoption record. |
| `hm-phase-execution` | evals/references/scripts present | BLOCKED | Needs third-party crawl and Pattern 1/2/3 adoption record. |
| `hm-planning-with-files` | references only | BLOCKED | Needs evals/scripts/assets/workflows or documented reason after source review. |
| `hm-command-parser` | references only | BLOCKED | Needs evals/scripts/assets/workflows or documented reason after source review. |
| `hm-agent-composition` | assets/evals/examples/references/scripts present | BLOCKED | Strong local bundle, but lacks third-party crawl/adoption evidence. |
| `hm-agents-md-sync` | SKILL.md only | BLOCKED | Lacks local bundled evidence and third-party evidence. |
| `hm-opencode-project-audit` | assets/references/scripts present | BLOCKED | Needs third-party crawl/adoption evidence. |
| `hm-opencode-project-inspection` | references/scripts present | BLOCKED | Needs third-party crawl/adoption evidence. |
| `hm-opencode-non-interactive-shell` | references only | BLOCKED | Needs third-party crawl/adoption evidence and eval/resource expansion decision. |
| `hm-opencode-platform-reference` | references present | BLOCKED | Needs independence/resource audit for reference-heavy status. |

## Discovery Evidence Captured

- `npx --yes skills find "debugging refactoring execution planning agent skill"` returned `github/awesome-copilot@refactor-plan`, `dimillian/skills@orchestrate-batch-refactor`, `first-fluke/oh-my-ag@debug-agent`.
- `npx --yes skills find "opencode command agent skill"` returned `s-hiraoku/synapse-a2a@opencode-expert`, `sundial-org/awesome-openclaw-skills@opencode-controller`, `smithery.ai@opencode-expert`.

This is discovery evidence only.
