# Evidence Catalogue

> Reference for evidence types, collection strategies, and platform-specific tools.

## Evidence Types

| Type | Description | Strength | Common Pitfall |
|------|-------------|----------|----------------|
| **Command output** | stdout/stderr from test/build/lint | Strong | Reading only exit code, ignoring output body |
| **File existence** | Path check (`ls`, `stat`, `test -f`) | Medium | File exists but is empty/malformed |
| **Code pattern** | `grep`/`rg` for expected/unexpected patterns | Strong | Matching pattern exists but is dead code |
| **Metric** | Line count, file size, complexity score | Medium | Metric passes but semantic content is wrong |
| **VCS state** | `git diff`, `git log`, working tree status | Strong | Uncommitted changes masking true state |
| **Runtime behavior** | HTTP response, process output, browser state | Strongest | Testing happy path only |

## Collection Strategy by Claim Type

| Claim | Minimum Evidence |
|-------|-----------------|
| "Tests pass" | Full test suite output (not summary — the actual lines) |
| "Build succeeds" | Build command output with 0 errors, 0 warnings |
| "File was created" | `ls -la` showing file + non-zero size |
| "Pattern removed" | `grep -r` showing 0 matches in scope |
| "No regressions" | Full test suite + changed test list justified |
| "Subagent completed" | Independent verification (not just subagent's claim) |

## Platform-Specific Evidence Tools

| Platform | Run Command | Search | State Persistence |
|----------|------------|--------|-------------------|
| OpenCode | `bash` tool | `grep`/`rg` via bash | `save_mem`, `recall_mems` |
| Claude Code | `run_command` | `grep_search` | Artifacts, task files |
| Antigravity | `run_command` | `grep_search`, `find_by_name` | Artifacts, task_boundary |
| Cursor/Windsurf | Integrated terminal | IDE search | Manual via comments/TODO |
| Codex | Shell execution | Shell grep | Task-based state |

## Evidence Chain Validation

Before accepting evidence, verify the chain:

```
Claim → Command → Output → Interpretation → Verdict
         ↑                    ↑
    Was it actually run?  Does output ACTUALLY support claim?
```

**NEVER shortcut the chain:** "It should work because..." is not evidence.
