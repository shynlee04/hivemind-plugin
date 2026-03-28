# Session Inspection Export

- ses_id: `ses_2da8adf3fffe34nWZQnsxWOd7Y`
- prepared_at: `2026-03-25T14:45:52.658Z`

## Assistant Output

## Codebase Investigation Report

**Scope:** Full file read of `src/shared/opencode-skill-registry.ts`
**Question:** Return complete file content for skill discovery analysis

### Complete File Content

**File:** `/Users/apple/hivemind-plugin/.worktrees/product-detox/src/shared/opencode-skill-registry.ts` (137 lines)

The complete file was returned above. Here's the structural breakdown:

---

### 1. Skill Discovery Logic (lines 87–111)

The `discoverSkills()` function at **line 87** scans `{packageRoot}/skills/`:

| Step | Detail | Line |
|------|--------|------|
| Root path | `join(packageRoot, 'skills')` | 88 |
| Directory listing | `readdirSync(skillsRoot, { withFileTypes: true })` | 93 |
| Filter: isDirectory | Only directories are considered | 95 |
| Filter: underscore prefix | Directories starting with `_` are skipped | 95 |
| Filter: exclusion set | `excludedSkillIds` passed in are skipped | 95 |
| SKILL.md validation | `statSync(join(skillDir, 'SKILL.md'))` — directory must contain `SKILL.md` | 97–103 |
| Output | `{ skillDir, skillId: entry.name }` | 100 |

The `skillId` is derived from the **directory name**, not from frontmatter.

---

### 2. SKILL_DISCOVERY_PATH Pattern

There is **no exported constant named `SKILL_DISCOVERY_PATH`** in this file. The discovery path is hardcoded at **line 88**:

```typescript
const skillsRoot = join(packageRoot, 'skills')
```

It resolves to `{packageRoot}/skills/{skillDirName}/SKILL.md`. The path is a relative join — the `packageRoot` parameter must be provided by the caller.

---

### 3. Exported Functions and Signatures

| Export | Signature | Line |
|--------|-----------|------|
| `SkillFrontmatter` (interface) | `{ name: string; description: string; [key: string]: unknown }` | 6–10 |
| `OpencodeSkillRegistryEntry` (interface) | `{ id, sourcePath, frontmatter, body, runtimeMarkdown, referenceFiles, templateFiles, testFiles }` | 12–21 |
| `createOpencodeSkillRegistry` (function) | `(packageRoot: string, excludedSkillIds?: string[]) => OpencodeSkillRegistryEntry[]` | 131–136 |

Only one function is exported: `createOpencodeSkillRegistry` at **line 131**. All other functions (`splitFrontmatter`, `projectRuntimeFrontmatter`, `renderRuntimeMarkdown`, `readMarkdownFiles`, `discoverSkills`, `buildRegistryEntry`) are internal.

---

### 4. Injection Pipeline Connection Points

The `buildRegistryEntry()` function at **line 113** produces entries with:

| Field | Source | Injection Relevance |
|-------|--------|---------------------|
| `id` | Directory name | Skill identifier for registration |
| `sourcePath` | `{skillDir}/SKILL.md` | Absolute path to canonical skill definition |
| `frontmatter` | Parsed YAML `{ name, description, ... }` | Original frontmatter with all keys |
| `body` | Markdown after `---` block | Skill instruction body |
| `runtimeMarkdown` | Re-projected YAML + body (line 124) | Stripped-down frontmatter (only `name`/`description`) suitable for runtime injection |
| `referenceFiles` | `references/*.md` (line 125) | Supplementary reference material |
| `templateFiles` | `templates/*.md` (line 126) | Template files |
| `testFiles` | `tests/*.md` (line 127) | Test specification files |

The `renderRuntimeMarkdown()` function at **line 59** produces a clean `---\nname: ...\ndescription: ...\n---\n\n{body}` format that strips unknown frontmatter keys, making it suitable for injection into system prompts or agent context without leaking internal metadata.

To connect to an injection pipeline, a caller would:
1. Call `createOpencodeSkillRegistry(packageRoot)` to get all discovered entries
2. Access `.runtimeMarkdown` for the injectable content
3. Access `.referenceFiles` / `.templateFiles` / `.testFiles` for ancillary material
4. Use `.id` for registration/lookup

### Gaps

- No `SKILL_DISCOVERY_PATH` constant exists — the path is inline at line 88
- No exported `discoverSkills` — it's internal only
- No connection to any existing injection pipeline was found in this file; the caller must wire it

### Git Context

Working tree: `/Users/apple/hivemind-plugin/.worktrees/product-detox` (detox worktree)