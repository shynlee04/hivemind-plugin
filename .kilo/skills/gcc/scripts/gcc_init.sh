#!/bin/bash
# GCC v2 Initialization Script
# Detects git repo and creates appropriate structure (git mode or standalone)

set -e

GCC_DIR="${1:-.GCC}"
NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

if [ -d "$GCC_DIR" ]; then
  # Check if upgrading from v1
  if [ -f "$GCC_DIR/metadata.yaml" ] && ! [ -f "$GCC_DIR/index.yaml" ]; then
    echo "GCC v1 detected. Run with --upgrade to migrate to v2."
    if [ "$2" = "--upgrade" ]; then
      echo "Migrating to v2..."
      # Preserve v1 files as backup
      mkdir -p "$GCC_DIR/.v1-backup"
      cp "$GCC_DIR/metadata.yaml" "$GCC_DIR/.v1-backup/" 2>/dev/null || true
      cp "$GCC_DIR/commit.md" "$GCC_DIR/.v1-backup/" 2>/dev/null || true
      cp "$GCC_DIR/log.md" "$GCC_DIR/.v1-backup/" 2>/dev/null || true
      cp "$GCC_DIR/main.md" "$GCC_DIR/.v1-backup/" 2>/dev/null || true
    else
      exit 0
    fi
  elif [ -f "$GCC_DIR/index.yaml" ]; then
    echo "GCC v2 already initialized at $GCC_DIR"
    exit 0
  fi
fi

# Detect git
MODE="standalone"
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  MODE="git"
  BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")
  LAST_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "none")
fi

mkdir -p "$GCC_DIR/branches"
mkdir -p "$GCC_DIR/worktrees"

# Create index.yaml — the single source of truth for v2
if [ "$MODE" = "git" ]; then
  cat > "$GCC_DIR/index.yaml" << EOF
version: 2
mode: git
created: "$NOW"
config:
  proactive_commits: true
  worktree_ttl: 24h
  bridge_to_aiyoucli: auto

current_branch: $BRANCH

timeline:
  - id: INIT
    hash: $LAST_HASH
    intent: "gcc initialized"
    branch: $BRANCH
    date: "$NOW"

worktrees: []

decisions: []
EOF
else
  cat > "$GCC_DIR/index.yaml" << EOF
version: 2
mode: standalone
created: "$NOW"
config:
  proactive_commits: true

current_branch: main

timeline:
  - id: INIT
    hash: null
    intent: "gcc initialized (standalone mode)"
    branch: main
    date: "$NOW"

decisions: []
EOF

  # Standalone mode also creates markdown fallback files
  cat > "$GCC_DIR/main.md" << 'MAINEOF'
# Project Roadmap

## Objectives
- [ ] (Define project objectives here)

## Milestones
(Milestones will be populated as commits are made)

## Active Branches
(No active branches)
MAINEOF

  cat > "$GCC_DIR/log.md" << 'LOGEOF'
# OTA Execution Log

> Most recent entries at the bottom. Keep last 50 entries max.

---
LOGEOF
fi

echo "GCC v2 initialized at $GCC_DIR/"
echo "  Mode: $MODE"
echo "  Index: $GCC_DIR/index.yaml"
if [ "$MODE" = "git" ]; then
  echo "  Branch: $BRANCH"
  echo "  Last commit: $LAST_HASH"
fi
