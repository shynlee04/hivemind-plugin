# Findings — HiveMind V3 Platform Harness

## Requirements (from user, locked)

1. Transform harness-experiment from skill-pack-only to full platform harness
2. Runtime build-on-demand (agents compose prompts dynamically, NOT static .md definitions)
3. CLI substrate modeled after GSD's bin/gsd-tools.cjs pattern
4. Dual packaging (npm SDK + npx git installs)
5. Synthesize oh-my-openagent runtime features (background agents, auto-loop, delegation chains, task queuing, categories, session recovery)
6. Superior to both GSD and oh-my-openagent

## Research Findings (Phase 1 Deep Research — LOCKED)

### GSD Architecture
- Central Node.js CLI: bin/gsd-tools.cjs (19 domain modules in bin/lib/)
- Machine-readable output: --raw (JSON), --cwd (sandboxed), --pick (jq-less field extraction)
- Distribution: npx get-shit-done-cc@latest (multi-runtime installer: Claude Code, OpenCode, Gemini CLI, Codex)
- State: STATE.md + .planning/ directory
- 15+ domain modules: core, state, phase, roadmap, config, verify, template, frontmatter, init, milestone, commands, model-profiles, uat, profile-output, profile-pipeline

### oh-my-openagent Features (SYNTHESIS TARGET for Phase 3)
- 11 specialized agents with model fallback chains
- **Category system**: 8 domain presets (visual-engineering, ultrabrain, deep, artistry, quick, unspecified-low/high, writing) — determines model, temperature, prompt mindset
- **Background agents**: run in background, continue working, retrieve results when ready, tmux pane visualization
- **Session recovery**: Automatic reconstruction from missing tool results, thinking block violations, empty messages, context overflow, JSON parse errors
- **Ralph-loop**: Self-referential dev loop until `<promise>DONE</promise>` detected, configurable max iterations
- **Skills**: SKILL.md with frontmatter + MCP server declarations, loaded from multiple locations with priority ordering
- **Category + Skill combos**: e.g., visual-engineering + frontend-ui-ux + playwright = The Designer
- **Task prompt guide**: 7 elements (TASK, EXPECTED OUTCOME, REQUIRED SKILLS, REQUIRED TOOLS, MUST DO, MUST NOT DO, CONTEXT)
- **Sisyphus-Junior**: Category-spawned executor that CANNOT re-delegate (prevents infinite loops)

### npm Plugin Best Practices
- Yeoman: generator-* naming + yeoman-generator keyword
- ESLint: eslint-plugin-* prefix + shareable configs with peerDependencies
- Nx: scoped packages (@myorg/nx-plugin) + scaffolding generators
- Vite: explicit programmatic registration in config
- Prettier: dynamic import() for plugin resolution

### Cross-Platform Skill Comparison
- OpenCode: .opencode/skills/*/SKILL.md, file-system walking, npx skills add
- Claude Code: .claude/skills/*/SKILL.md, project+global scope, marketplace.json
- Cursor: .cursor/rules/, plugin marketplace, rules+bundles
- Codex: .agents/skills/*/SKILL.md, chat.skillsLocations setting

## Technical Decisions (LOCKED)

| Choice | Rationale | Evidence |
|--------|-----------|----------|
| Node.js CLI over bash | Cross-platform, JSON output, modular | GSD's 19-module architecture |
| Runtime build-on-demand | Static .md agents violate clean architecture | User governance rule |
| Dual packaging | npm for SDK stability, git for skill agility | Deep research recommendation |
| Category system | Domain-optimized agents > single generalist | OMO's 8 categories |
| Background agents | Parallel execution > sequential | OMO + user requirement |
| Planning triplet at root | Same level as AGENTS.md, visible | User directive |
| Separate spec-repair from code-gap work | Mixed them creates validation churn | Failed session evidence |

## Phase 2 Context Decisions (2026-04-06)

- Background workers should prefer visible pane/session execution when supported, with clean headless fallback otherwise.
- Runtime policy for Phase 2 is soft-policy: warn/escalate preferred over pervasive hard blocking.
- Injection/routing remain conditional and configurable, but narrower than a maximal policy engine in this phase.
- Circuit breaker and tool budgets keep the current warning→hard-stop model, with per-session configurability added.

## Rogue Agent Incident Findings (2026-04-04)
- Agent interpreted "What This Project is NOT — Static .md files acting as agent definitions" as "delete all .md from user project dirs"
- Correct reading: This is a development direction for the harness ENGINE, not filesystem policy
- `.opencode/` and `.kilo/` are USER SPACE — agents cannot modify without explicit user intent
- SKILL.md is the OpenCode skill contract format — valid, refactoring target, not deletion target
- Resolution: `git reset --hard 54d2300b`, rogue work in `rogue-agent-backup` branch

## Hivefiver Skill Audit Findings (2026-04-07)

### Audit Results
| Artifact | Verdict | Defects | Usability |
|----------|---------|---------|-----------|
| session-context-manager | NEEDS_FIX | 2 | 4/10 |
| phase-loop | NEEDS_FIX | 4 | 4/10 |
| command-parser | NEEDS_REWRITE | 4 | 3/10 |
| agent-authorization | NEEDS_FIX | 4 | 4/10 |
| intent-loop agent | CLEAN | 0 | 8/10 |
| spec-verifier agent | CLEAN | 0 | 8/10 |
| phase-guardian agent | CLEAN | 0 | 8/10 |
| HIVEFIVER-PLAYBOOK | NEEDS_FIX | 3 critical | N/A |

### Key Defect Classes
- **DC-1: YAML frontmatter** — `allowed-tools` as space-separated string instead of proper YAML list (3/4 skills)
- **DC-2: Hardcoded paths** — `.hivemind/state/` without workspace root parameterization (session-context-manager)
- **DC-3: TS/JS pseudo-code** — Skills contain executable code instead of prose instructions (phase-loop, command-parser)
- **DC-4: GSD CLI contamination** — References to `gsd-tools`, `get-shit-done` external toolchain (command-parser)
- **DC-5: Invalid flags** — `--constraint` flags that don't exist in OpenCode (session-context-manager)
- **DC-6: Missing read pattern** — No `<files_to_read>` mandatory initial read block (phase-loop, command-parser)
- **DC-7: Generic roles** — "producer", "checker" instead of specialist types (phase-loop)

### Integration Findings
- **System verdict: FRAGMENTED**
- 2 orphaned skills (phase-loop, command-parser — no agent references them)
- 3 broken cross-references (meta-builder agent missing, phase-history.json missing, state path split)
- State layer split: `.hivemind/state/` vs `.opencode/` — no bridge

### Technical Decisions
| Choice | Rationale |
|--------|-----------|
| Bash IS allowed in skills | OpenCode supports `!command` for shell output injection |
| Non-interactive shell required | No TTY-dependent commands (no vim, nano, less, man, git add -p) |
| Fix .opencode/ versions only | These are the live installed versions; lab copies are mirrors |
| No new artifacts | Audit + fix only, no creation tasks |

## Hivefiver Skill Audit Findings (2026-04-07)

### Audit Results
| Artifact | Verdict | Defects | Usability |
|----------|---------|---------|-----------|
| session-context-manager | NEEDS_FIX | 2 | 4/10 |
| phase-loop | NEEDS_FIX | 4 | 4/10 |
| command-parser | NEEDS_REWRITE | 4 | 3/10 |
| agent-authorization | NEEDS_FIX | 4 | 4/10 |
| intent-loop agent | CLEAN | 0 | 8/10 |
| spec-verifier agent | CLEAN | 0 | 8/10 |
| phase-guardian agent | CLEAN | 0 | 8/10 |
| HIVEFIVER-PLAYBOOK | NEEDS_FIX | 3 critical | N/A |

### Key Defect Classes
- **DC-1: YAML frontmatter** — `allowed-tools` as space-separated string instead of proper YAML list (3/4 skills)
- **DC-2: Hardcoded paths** — `.hivemind/state/` without workspace root parameterization (session-context-manager)
- **DC-3: TS/JS pseudo-code** — Skills contain executable code instead of prose instructions (phase-loop, command-parser)
- **DC-4: GSD CLI contamination** — References to `gsd-tools`, `get-shit-done` external toolchain (command-parser)
- **DC-5: Invalid flags** — `--constraint` flags that don't exist in OpenCode (session-context-manager)
- **DC-6: Missing read pattern** — No `<files_to_read>` mandatory initial read block (phase-loop, command-parser)
- **DC-7: Generic roles** — "producer", "checker" instead of specialist types (phase-loop)

### Integration Findings
- **System verdict: FRAGMENTED**
- 2 orphaned skills (phase-loop, command-parser — no agent references them)
- 3 broken cross-references (meta-builder agent missing, phase-history.json missing, state path split)
- State layer split: `.hivemind/state/` vs `.opencode/` — no bridge

### Technical Decisions
| Choice | Rationale |
|--------|-----------|
| Bash IS allowed in skills | OpenCode supports `!command` for shell output injection |
| Non-interactive shell required | No TTY-dependent commands (no vim, nano, less, man, git add -p) |
| Fix .opencode/ versions only | These are the live installed versions; lab copies are mirrors |
| No new artifacts | Audit + fix only, no creation tasks |

## Resources

- Deep research output: .skills-lab/research-output.md (272 lines)
- GSD CLI reference: github.com/gsd-build/get-shit-done
- OMO features: github.com/code-yeongyu/oh-my-openagent/blob/dev/docs/reference/features.md
- Master PRD: docs/02_PRD/PRD-01_meta-builder-ecosystem/PRD-01_meta-builder-ecosystem.md (278 lines)
- Audit plan: plans/skill-ecosystem-audit-and-hivemind-v3-readiness/plan.md
- Migration strategy: docs/plans/refactor/migration-strategy-reference.md (160 lines)
- Clean architecture blueprint: docs/plans/refactor/clean-architecture-blueprint-2026-04-03.md
- Meta-builder plans: .hivefiver-meta-builder/plans/the-meta-builder.md + skills-to-build-meta.md
- OMO features reference (packed): .skills-lab/refactoring-skills/users-prompting-workspace-resources/oh-my-openagent/
- HIVEFIVER-PLAYBOOK: .hivefiver-meta-builder/references-lab/active/refactoring/HIVEFIVER-PLAYBOOK.md (536 lines)
- Non-interactive shell reference: .hivefiver-meta-builder/skills-lab/active/refactoring/command-dev/references/non-interactive-shell.md
- OpenCode commands reference: .hivefiver-meta-builder/skills-lab/active/refactoring/opencode-platform-reference/references/opencode-commands.md
- HIVEFIVER-PLAYBOOK: .hivefiver-meta-builder/references-lab/active/refactoring/HIVEFIVER-PLAYBOOK.md (536 lines)
- Non-interactive shell reference: .hivefiver-meta-builder/skills-lab/active/refactoring/command-dev/references/non-interactive-shell.md
- OpenCode commands reference: .hivefiver-meta-builder/skills-lab/active/refactoring/opencode-platform-reference/references/opencode-commands.md
