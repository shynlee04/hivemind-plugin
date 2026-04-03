#!/usr/bin/env python3
"""
Session Catchup Script for planning-with-files

Analyzes git history and planning files to find unsynced context
after the last planning file update.

Usage: python3 session-catchup.py [project-path]
"""

import os
import subprocess
import sys
from pathlib import Path
from datetime import datetime

PLANNING_FILES = ["task_plan.md", "progress.md", "findings.md"]


def normalize_path(project_path: str) -> str:
    """Normalize project path for cross-platform compatibility."""
    p = project_path
    # Git Bash / MSYS2: /c/Users/... -> C:/Users/...
    if len(p) > 2 and p[0] == "/" and p[2] == "/":
        p = p[1].upper() + ":" + p[2:]
    return str(Path(p).resolve())


def find_last_plan_update(project_dir: Path) -> str | None:
    """
    Find the last commit that modified any planning file.
    Returns the commit timestamp as ISO string, or None if no commits found.

    FIX: Uses git log --format=%ci on planning files directly,
    not git diff --which compares commit dates not file mtimes.
    """
    try:
        result = subprocess.run(
            ["git", "log", "-1", "--format=%ci", "--"] + PLANNING_FILES,
            cwd=project_dir,
            capture_output=True,
            text=True,
            check=False,
        )
        if result.returncode == 0 and result.stdout.strip():
            return result.stdout.strip()
    except (FileNotFoundError, OSError):
        pass
    return None


def get_uncommitted_changes(project_dir: Path) -> str:
    """
    Get uncommitted changes using git diff HEAD.
    This captures ALL uncommitted changes regardless of timestamps.

    FIX: Uses 'git diff HEAD' instead of 'git diff --since=<timestamp>'
    which incorrectly filters by commit date rather than file mtime.
    """
    try:
        result = subprocess.run(
            ["git", "diff", "--stat", "HEAD"],
            cwd=project_dir,
            capture_output=True,
            text=True,
            check=False,
        )
        if result.returncode == 0 and result.stdout.strip():
            return result.stdout.strip()
    except (FileNotFoundError, OSError):
        pass
    return ""


def get_untracked_files(project_dir: Path) -> str:
    """Get list of untracked files."""
    try:
        result = subprocess.run(
            ["git", "ls-files", "--others", "--exclude-standard"],
            cwd=project_dir,
            capture_output=True,
            text=True,
            check=False,
        )
        if result.returncode == 0 and result.stdout.strip():
            return result.stdout.strip()
    except (FileNotFoundError, OSError):
        pass
    return ""


def get_recent_commits(project_dir: Path, count: int = 5) -> str:
    """Get recent commit log."""
    try:
        result = subprocess.run(
            ["git", "log", "--oneline", f"-{count}"],
            cwd=project_dir,
            capture_output=True,
            text=True,
            check=False,
        )
        if result.returncode == 0 and result.stdout.strip():
            return result.stdout.strip()
    except (FileNotFoundError, OSError):
        pass
    return ""


def check_planning_files(project_dir: Path) -> dict:
    """Check which planning files exist and their last modified time."""
    status = {}
    for fname in PLANNING_FILES:
        fpath = project_dir / fname
        if fpath.exists():
            mtime = datetime.fromtimestamp(fpath.stat().st_mtime)
            status[fname] = {
                "exists": True,
                "mtime": mtime.isoformat(),
                "size": fpath.stat().st_size,
            }
        else:
            status[fname] = {"exists": False}
    return status


def main() -> None:
    project_path = sys.argv[1] if len(sys.argv) > 1 else os.getcwd()
    project_dir = Path(normalize_path(project_path))

    if not project_dir.is_dir():
        print(f"[planning-with-files] Error: '{project_dir}' is not a directory.")
        sys.exit(1)

    # Check if planning files exist
    file_status = check_planning_files(project_dir)
    has_planning_files = any(f["exists"] for f in file_status.values())

    if not has_planning_files:
        print("[planning-with-files] No planning files found. No catchup needed.")
        sys.exit(0)

    # Find last planning file update from git
    last_update = find_last_plan_update(project_dir)

    # Get uncommitted changes (FIXED: uses git diff HEAD, not --since)
    uncommitted = get_uncommitted_changes(project_dir)

    # Get untracked files
    untracked = get_untracked_files(project_dir)

    # Get recent commits
    recent = get_recent_commits(project_dir)

    # Output catchup report
    print("=" * 60)
    print("[planning-with-files] Session Catchup Report")
    print("=" * 60)

    print("\n## Planning File Status")
    for fname, info in file_status.items():
        if info["exists"]:
            print(f"  {fname}: exists ({info['size']} bytes, modified {info['mtime']})")
        else:
            print(f"  {fname}: not found")

    if last_update:
        print(f"\n## Last Planning File Commit: {last_update}")
    else:
        print("\n## Last Planning File Commit: never committed")

    if uncommitted:
        print(f"\n## Uncommitted Changes:\n{uncommitted}")
    else:
        print("\n## Uncommitted Changes: none")

    if untracked:
        print(f"\n## Untracked Files:\n{untracked}")
    else:
        print("\n## Untracked Files: none")

    if recent:
        print(f"\n## Recent Commits:\n{recent}")

    # Recommended actions
    print("\n## Recommended Actions")
    if uncommitted and not last_update:
        print("  1. Planning files were never committed but code changes exist")
        print("  2. Review uncommitted changes and update planning files to match")
    elif uncommitted and last_update:
        print("  1. Code changes exist since last planning file update")
        print("  2. Check if these changes are reflected in task_plan.md phases")
        print("  3. Update phase status if work is complete")
    else:
        print("  1. No uncommitted changes detected")
        print("  2. Planning files appear to be in sync with git state")

    print("=" * 60)


if __name__ == "__main__":
    main()
