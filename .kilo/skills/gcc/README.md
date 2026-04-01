# Git Context Controller (GCC) v2

[![Release](https://img.shields.io/github/v/release/faugustdev/git-context-controller)](https://github.com/faugustdev/git-context-controller/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Skills.sh](https://img.shields.io/badge/skills.sh-compatible-blue)](https://skills.sh)

**Lean, git-backed context management for LLM agents.**

GCC v2 stores **hash + intent + optional decision notes** instead of verbose markdown. Full context is reconstructed on demand via `git show`. Dual mode: git-backed or standalone.

> Based on the research paper: [Git Context Controller](https://arxiv.org/abs/2508.00031)

---

## Why GCC?

LLM agents lose context as conversations grow. GCC solves this by giving agents structured memory:

- **Lean storage** -- ~50 tokens per entry vs ~500 in v1
- **Git-backed truth** -- real commits, not narrative copies
- **Safe experimentation** -- branches via git worktrees for real isolation
- **Cross-session recovery** -- reconstruct context from hashes on demand
- **aiyoucli bridge** -- auto-feeds commit data to vector memory when available

## How It Works

### Git Mode (with repo)

```
.GCC/
├── index.yaml       # Single source of truth (~50 tokens/entry)
├── branches/        # Branch-specific notes
├── worktrees/       # Worktree tracking
└── .bridge-log      # Sync state with aiyoucli

index.yaml entry:
  - id: C001
    hash: 85c8539        ← pointer to git truth
    intent: "release prep" ← why
    note: "descartamos semantic-release por overhead" ← optional decision
    branch: main
    date: "2026-02-25T21:40:00Z"
```

### Standalone Mode (no repo)

Falls back to markdown files compatible with v1:

```
.GCC/
├── index.yaml       # Timeline
├── main.md          # Roadmap (v1 compat)
├── log.md           # OTA traces (v1 compat)
└── branches/
```

### Context Reconstruction

```
Agent needs context
       │
       ▼
  gcc_context.sh --summary     ← ~50 tokens, zero git calls
  gcc_context.sh --last 5      ← reconstructs via git show
  gcc_context.sh --decisions   ← only entries with notes
  gcc_context.sh --hash abc123 ← full diff for one commit
```

## Installation

### As a Claude Code Skill

```bash
# Via skills.sh
npx skills add faugustdev/git-context-controller

# Manual installation
cp -r gcc/ your-project/.claude/skills/gcc/
```

### Standalone

```bash
git clone https://github.com/faugustdev/git-context-controller.git

# Initialize GCC in your project
cd your-project
/path/to/scripts/gcc_init.sh
```

## Quick Start

Once installed, GCC activates automatically. Use commands or natural language:

| Action | Command | Natural Language |
|---|---|---|
| Save progress | `/gcc commit` | "save this milestone" |
| Try alternative | `/gcc branch experiment` | "branch to try a different approach" |
| Integrate results | `/gcc merge experiment` | "merge the experiment results" |
| Quick status | `/gcc context --summary` | "where were we?" |
| Recent work | `/gcc context --last 10` | "show recent activity" |
| View decisions | `/gcc context --decisions` | "what did we decide about X?" |
| Deep dive | `/gcc context --hash abc123` | "details on that commit" |
| Clean up | `/gcc cleanup` | "clean up old worktrees" |
| Sync memory | `/gcc bridge --sync` | "sync to aiyoucli" |

## Scripts

GCC v2 includes utility scripts for mechanical operations:

| Script | Purpose |
|---|---|
| `gcc_init.sh` | Initialize GCC (auto-detects git/standalone) |
| `gcc_commit.sh` | Real git commit + lean index entry |
| `gcc_context.sh` | Reconstruct context from hashes |
| `gcc_bridge.sh` | Feed commit data to aiyoucli vector memory |
| `gcc_cleanup.sh` | TTL-based worktree cleanup + index pruning |

### gcc_commit.sh

```bash
gcc_commit.sh "implement retry logic"
gcc_commit.sh "release prep" "descartamos semantic-release por overhead"
gcc_commit.sh --staged "hotfix: null check"
```

### gcc_context.sh

```bash
gcc_context.sh --summary          # one-line per entry (cheapest)
gcc_context.sh --last 5           # last 5 with git details
gcc_context.sh --hash abc123      # full diff for specific commit
gcc_context.sh --decisions        # only entries with notes
gcc_context.sh --full             # everything
```

### gcc_bridge.sh

```bash
gcc_bridge.sh --status            # check bridge connectivity
gcc_bridge.sh --sync              # sync all unsynced entries to aiyoucli
```

### gcc_cleanup.sh

```bash
gcc_cleanup.sh --dry-run          # show what would be cleaned
gcc_cleanup.sh --force            # clean without asking
gcc_cleanup.sh --prune-index 50   # keep last 50 timeline entries
```

## Commands Reference

### COMMIT

Persists a milestone. In git mode, executes a real commit.

```
/gcc commit <summary>
```

### BRANCH

Creates an isolated workspace. In git mode, uses real git worktrees.

```
/gcc branch <name>
```

### MERGE

Integrates a branch back. In git mode, real git merge + synthesis note.

```
/gcc merge <branch-name>
```

### CONTEXT

Retrieves historical memory reconstructed from git.

```
/gcc context [--summary | --last N | --hash HASH | --decisions | --full]
```

| Flag | Returns | Cost |
|---|---|---|
| `--summary` | One-line per entry | ~0 extra tokens |
| `--last N` | Last N entries with git details | ~200 tokens/entry |
| `--hash HASH` | Full diff for one commit | Variable |
| `--decisions` | Only entries with notes | Minimal |
| `--full` | Everything | All entries |

## Configuration

Controlled via `index.yaml`:

```yaml
config:
  proactive_commits: true     # Auto-suggest commits after milestones
  worktree_ttl: 24h           # Auto-cleanup expired worktrees
  bridge_to_aiyoucli: auto    # auto | off | manual
```

## Project Structure

```
git-context-controller/
├── SKILL.md              # Skill definition (v2)
├── README.md             # This file
├── LICENSE               # MIT License
├── CONTRIBUTING.md       # Contribution guidelines
├── .gitignore
├── scripts/
│   ├── gcc_init.sh       # Initialization (git detect + index.yaml)
│   ├── gcc_commit.sh     # Commit + lean entry
│   ├── gcc_context.sh    # Context reconstruction
│   ├── gcc_bridge.sh     # aiyoucli memory bridge
│   └── gcc_cleanup.sh    # Worktree TTL + index pruning
├── references/
│   └── file_formats.md   # Format specifications (v2)
└── examples/
    └── sample_session.md # Example session (v2)
```

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## References

- **Paper**: [Git Context Controller: Structured Context Management for LLM Agents](https://arxiv.org/abs/2508.00031)
- **Concept**: [Emergent Mind - GCC Topic](https://www.emergentmind.com/topics/git-context-controller-gcc)

## License

[MIT](LICENSE)
