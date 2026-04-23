# 17-02 Summary: Gitignore IDE Dirs + Canonical Location Docs

**Status:** Complete
**Date:** 2026-04-23

## What Was Done

Prevented accidental commits of IDE-managed skill sync artifacts by adding entries to `.gitignore` and documenting the canonical skill location in `AGENTS.md`. Closes C5.

## Tasks Completed

| # | Task | Status | Commit |
|---|------|--------|--------|
| 1 | Add 4 IDE skill directories to `.gitignore` | ✅ Done | 06c30332 |
| 2 | Document canonical location in `AGENTS.md` | ✅ Done | 06c30332 |

## Files Changed

- `.gitignore` — 4 new entries (`.trae/`, `.windsurf/`, `.codex/`, `.github/skills/`)
- `AGENTS.md` — new "Canonical Skill Location" subsection under OpenCode Integration

## Verification

- `grep` confirms all 4 IDE patterns present on individual lines in `.gitignore`
- `AGENTS.md` contains explicit statement that `.opencode/skills/` is canonical
- `AGENTS.md` states IDE directories are sync artifacts, not deliverables
- `AGENTS.md` notes `.claude/skills/` does not exist

## Self-Check

- [x] All tasks executed
- [x] Each task committed atomically
- [x] SUMMARY.md created
- [x] No modifications to shared orchestrator artifacts
