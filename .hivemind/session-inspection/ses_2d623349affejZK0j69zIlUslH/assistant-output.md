# Session Inspection Export

- ses_id: `ses_2d623349affejZK0j69zIlUslH`
- prepared_at: `2026-03-26T11:23:43.143Z`

## Assistant Output

## Investigation Complete

**Status:** `completed`  
**Git Commit:** `7183335`  
**Output:** `.hivemind/activity/agents/hivexplorer/discovery-legacy-md/`

### Key Findings

| Category | Count | Classification | Evidence |
|----------|-------|---------------|----------|
| `agents/*.deprecated.md` | 9 | **CONVERT to .ts** | `opencode-agent-registry.ts:95` reads via `readFileSync` at runtime |
| `.opencode/agents/*.md` | 13 | 11 CONVERT, 2 KEEP (OpenCode built-ins) | Runtime agent definitions |
| `commands/hm-*.md` (registered) | 10 | **CONVERT to .ts** | `instruction-loader.ts:134` loads at runtime |
| `commands/{hiverd,hiveq,hivemind,hivefiver}-*.md` (noise) | 33 | **DEPRECATE** | Zero runtime consumers; not in `command-bundles.ts` |
| `.opencode/commands/*.md` | 10 | 7 SYMLINK, 3 DEPRECATE | Identical mirrors of root commands |
| `workflows/*.yaml` | 21 | **DEPRECATE** | No TypeScript consumer; references non-existent tools |
| `prompts/*.md` | 8 | **DEPRECATE or CONVERT** | Zero TypeScript consumers found |
| Skills `SKILL.md` | 20+ trees | **KEEP as .md** | OpenCode spec requires `.md`; loaded by `opencode-skill-registry.ts` |
| `skills/_deprecated_hive/` | 29 | **DEPRECATE** | Archived; underscore prefix excluded from loader |

### Total Inventory: ~188 files
- **Keep as .md:** ~45 (skills per OpenCode spec, documentation)
- **Convert to .ts:** ~43 (agent frontmatter, command frontmatter, prompts)
- **Deprecate/Delete:** ~93 (noise commands, dead workflows, archived skills)
- **Symlink:** ~7 (command mirrors)

### Migration Path
- **Phase 0:** Delete 93 dead files immediately (zero risk)
- **Phase 1:** Convert 10 registered command frontmatter to TypeScript
- **Phase 2:** Convert 9 `agents/*.deprecated.md` to TypeScript registry entries
- **Phase 3:** Convert 11 HiveMind `.opencode/agents/*.md` to TypeScript (keep 2 OpenCode built-ins as `.md`)