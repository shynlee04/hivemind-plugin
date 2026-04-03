# Findings — HiveMind V3 Platform Harness

## Requirements (from user)

1. Transform harness-experiment from skill-pack-only to full platform harness
2. Runtime build-on-demand (agents compose prompts, NOT static .md)
3. CLI substrate modeled after GSD's bin/gsd-tools.cjs pattern
4. Dual packaging (npm SDK + npx git installs)
5. Synthesize oh-my-openagent runtime features (background agents, auto-loop, delegation chains, task queuing, categories, session recovery)
6. Superior to both GSD and oh-my-openagent

## Research Findings

### GSD Architecture (From deep research)
- Central Node.js CLI: bin/gsd-tools.cjs (19 domain modules in bin/lib/)
- Machine-readable output: --raw (JSON), --cwd (sandboxed), --pick (jq-less field extraction)
- 15 domain modules: core, state, phase, roadmap, config, verify, template, frontmatter, init, milestone, commands, model-profiles, uat, profile-output, profile-pipeline
- Distribution: npx get-shit-done-cc@latest (interactive multi-runtime installer)
- State: STATE.md + .planning/ directory

### oh-my-openagent Features (From GitHub)
- 11 specialized agents with model fallback chains
- Category system: agent presets optimized for domains (visual-engineering, deep, quick, ultrabrain, etc.)
- Background agents: run in background, continue working, retrieve results when ready
- Session recovery: automatic state reconstruction from tool failures
- Ralph-loop: self-referential dev loop until completion
- Skills: SKILL.md with frontmatter, load from multiple locations, category+skill combos
- Task prompt guide: 7 elements (TASK, EXPECTED OUTCOME, REQUIRED SKILLS, REQUIRED TOOLS, MUST DO, MUST NOT DO, CONTEXT)

### npm Plugin Best Practices (From deep research)
- Yeoman: generator-* naming + yeoman-generator keyword
- ESLint: eslint-plugin-* prefix + shareable configs
- Nx: scoped packages (@myorg/nx-plugin) + peerDependencies
- Vite: explicit programmatic registration in config
- Prettier: dynamic import() for plugin resolution

### Cross-Platform Skill Comparison
- OpenCode: .opencode/skills/*/SKILL.md, file-system walking, npx skills add
- Claude Code: .claude/skills/*/SKILL.md, project+global scope, marketplace.json
- Cursor: .cursor/rules/, plugin marketplace, rules+bundles
- Codex: .agents/skills/*/SKILL.md, chat.skillsLocations setting

## Technical Decisions

| Choice | Rationale | Evidence |
|--------|-----------|----------|
| Node.js CLI over bash | Cross-platform, JSON output, modular | GSD's 19-module architecture |
| Runtime build-on-demand | Static .md agents violate clean architecture principle | User governance rule |
| Dual packaging | npm for SDK stability, git for skill agility | Deep research recommendation |
| Category system | Domain-optimized agents > single generalist | oh-my-openagent's 8 categories |
| Background agents | Parallel execution > sequential | oh-my-openagent + user requirement |
| Planning triplet in .skills-lab/ | Existing location, team familiarity | Current convention |

## Resources

- Deep research output: .skills-lab/research-output.md
- GSD CLI reference: github.com/gsd-build/get-shit-done/docs/CLI-TOOLS.md
- OMO features: github.com/code-yeongyu/oh-my-openagent/docs/reference/features.md
- Existing PRD: docs/02_PRD/PRD-01_meta-builder-ecosystem/PRD-01_meta-builder-ecosystem.md
- Existing audit plan: plans/skill-ecosystem-audit-and-hivemind-v3-readiness/plan.md
- Clean architecture blueprint: docs/plans/refactor/clean-architecture-blueprint-2026-04-03.md
- Migration strategy: docs/plans/refactor/migration-strategy-2026-04-03.md
