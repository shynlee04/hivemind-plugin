# Verification Report — Skill Registry Path Discrepancy

**Slice ID:** cross-verify-skill-registry-path
**Mode:** verification
**Date:** 2026-03-26
**Verdict:** CLAIM **CONFIRMED** — with additional nuance

---

## 1. Registry Code — Exact Path Construction

**File:** `src/shared/opencode-skill-registry.ts`

**Line 88** — the critical path:
```typescript
const skillsRoot = join(packageRoot, 'skills')
```

The `discoverSkills` function (lines 87–111):
- Takes `packageRoot` as input
- Scans `{packageRoot}/skills/` for immediate subdirectories
- For each subdirectory, checks if `{subdirectory}/SKILL.md` exists
- Does NOT recurse into nested `skills/skills/` — single-level scan only

**Line 131–136** — entry point:
```typescript
export function createOpencodeSkillRegistry(
  packageRoot: string,
  excludedSkillIds: string[] = [],
): OpencodeSkillRegistryEntry[] {
  const skills = discoverSkills(packageRoot, excludedSkillIds)
  return skills.map((skill) => buildRegistryEntry(skill))
}
```

The `packageRoot` parameter is passed by the caller. The registry itself does NOT hardcode `.opencode/` or any other specific root. It scans `join(packageRoot, 'skills')`.

**Evidence:** `src/shared/opencode-skill-registry.ts:88`

---

## 2. OpenCode Official Discovery Paths

From https://opencode.ai/docs/skills/ (verified via web search):

> OpenCode searches these locations:
> - **Project config:** `.opencode/skills/<name>/SKILL.md`
> - **Global config:** `~/.config/opencode/skills/<name>/SKILL.md`
> - **Project Claude-compatible:** `.claude/skills/<name>/SKILL.md`
> - **Global Claude-compatible:** `~/.claude/skills/<name>/SKILL.md`
> - **Project agent-compatible:** `.agents/skills/<name>/SKILL.md`
> - **Global agent-compatible:** `~/.agents/skills/<name>/SKILL.md`

**Discovery behavior:**
> For project-local paths, OpenCode walks up from your current working directory until it reaches the git worktree. It loads any matching `skills/*/SKILL.md` in `.opencode/`.

**Source:** https://opencode.ai/docs/skills/

---

## 3. Actual Directory Contents on Disk

### 3a. `skills/` at project root

```
skills/
├── _deprecated_hive/          (skipped by registry due to _ prefix)
├── registry-internal.yaml     (file, not a directory)
└── skills/                    (subdirectory — contains actual skills)
    ├── context-entry-verify/
    ├── context-intelligence-entry/
    ├── course-correction-delegation/
    ├── git-continuity-memory/
    ├── hivemind-atomic-commit/
    ├── hivemind-codemap/
    ├── hivemind-gatekeeping-delegation/
    ├── hivemind-research/
    ├── hivemind-research-framework/
    ├── hivemind-research-tools/
    ├── hivemind-skill-doctor/
    ├── hivemind-skill-write/
    ├── hivemind-system-debug/
    ├── research-delegation/
    ├── spec-distillation/
    ├── tdd-delegation/
    ├── use-hivemind-delegation/
    ├── use-hivemind-detox-refactor/
    └── use-hivemind-skill-writer/
```

**Critical observation:** The actual SKILL.md files are at `skills/skills/{skillName}/SKILL.md` — two levels deep. The registry scans `skills/{dir}/SKILL.md` — one level deep. This means even if the registry is pointed at `skills/` as its root, it would only find `skills/skills/SKILL.md` (which does NOT exist). It would NOT find any of the actual skills because they are nested inside `skills/skills/`.

### 3b. `.opencode/skills/` — exists and contains skills

```
.opencode/skills/
├── use-hivemind/
├── use-hivemind-planning/
├── use-hivemind-git-memory/
├── use-hivemind-delegation/
├── hivemind-atomic-commit/
├── hivemind-patterns/
├── hivemind-gatekeeping/
└── ... (additional skills)
```

This IS the path OpenCode discovers from at runtime.

### 3c. `~/.config/opencode/skills/` — exists

```
~/.config/opencode/skills/
├── context-integrity/
├── delegation-intelligence/
├── evidence-discipline/
├── hivemind-governance/
├── opencode-tool-architect/
├── session-lifecycle/
├── superpowers -> /Users/apple/.config/opencode/superpowers/skills  (symlink)
└── tool-architect-loop/
```

This is also a valid OpenCode global discovery path.

### 3d. Discovery Report File

`.hivemind/activity/agents/hivexplorer/discovery-opencode-paths/report.md` — **DOES NOT EXIST on disk.**

---

## 4. Discrepancy Analysis

| Dimension | Registry Code | OpenCode Runtime |
|-----------|--------------|-----------------|
| **Scans** | `join(packageRoot, 'skills')` | `.opencode/skills/` |
| **Global** | Not handled | `~/.config/opencode/skills/` |
| **Claude-compat** | Not handled | `.claude/skills/`, `~/.claude/skills/` |
| **Agent-compat** | Not handled | `.agents/skills/`, `~/.agents/skills/` |
| **Recursion** | Single-level only | Walks up from cwd to worktree |
| **Nested** | Does NOT handle `skills/skills/` | N/A (different path entirely) |

### The core discrepancy:

1. **The registry scans `{packageRoot}/skills/`.** If `packageRoot` = project root, it scans `./skills/`. OpenCode runtime discovers from `./.opencode/skills/`. These are **different directories**.

2. **Even within `./skills/`, the actual skill files are doubly nested** at `./skills/skills/{name}/SKILL.md`. The registry's single-level scan at `./skills/{name}/SKILL.md` would find nothing useful — only `./skills/skills/` as a directory (which has no SKILL.md at its root).

3. **The registry does NOT handle any of the 6 OpenCode discovery paths** (`.opencode/skills/`, `~/.config/opencode/skills/`, `.claude/skills/`, `~/.claude/skills/`, `.agents/skills/`, `~/.agents/skills/`).

4. **The registry is missing 5 of 6 discovery paths entirely** and its single scanned path doesn't match the actual file layout on disk.

---

## 5. Claim Assessment

**Discovery agent's claim:** "opencode-skill-registry.ts scans `{packageRoot}/skills/` but OpenCode runtime discovers from `.opencode/skills/`."

**Verdict: CONFIRMED — and the situation is WORSE than claimed.**

The claim is accurate. The registry scans `join(packageRoot, 'skills')` (line 88), while OpenCode discovers from `.opencode/skills/`. But the additional problems are:

- The registry also ignores `~/.config/opencode/skills/` (global skills)
- The registry ignores `.claude/skills/` and `.agents/skills/` compatibility paths
- Even the path it does scan (`skills/`) has its actual content doubly nested in `skills/skills/`, which the single-level scan cannot discover
- The discovery report file referenced by the claim does NOT exist on disk

---

## Evidence Summary

| Evidence | File:Line | Status |
|----------|-----------|--------|
| Registry builds path as `join(packageRoot, 'skills')` | `src/shared/opencode-skill-registry.ts:88` | VERIFIED |
| Registry single-level scan (no recursion) | `src/shared/opencode-skill-registry.ts:93-103` | VERIFIED |
| OpenCode discovers from `.opencode/skills/` | https://opencode.ai/docs/skills/ | VERIFIED |
| OpenCode global: `~/.config/opencode/skills/` | https://opencode.ai/docs/skills/ | VERIFIED |
| Actual skills at `skills/skills/{name}/SKILL.md` | `skills/skills/` directory listing | VERIFIED |
| `.opencode/skills/` exists with skills | `.opencode/skills/` directory listing | VERIFIED |
| `~/.config/opencode/skills/` exists | `ls ~/.config/opencode/skills/` | VERIFIED |
| Discovery report does NOT exist | `.hivemind/activity/agents/hivexplorer/discovery-opencode-paths/report.md` | CONFIRMED MISSING |
