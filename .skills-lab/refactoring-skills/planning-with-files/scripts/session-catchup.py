#!/usr/bin/env python3
"""
Session Catchup Script for planning-with-files

Analyzes git history and planning files to find unsynced context after
the last planning file update. Designed to run at session start.

Usage: python3 session-catchup.py [project-path]
"""

import os
import sys
import subprocess
from pathlib import Path
from datetime import datetime

PLANNING_FILES = ["task_plan.md", "progress.md", "findings.md"]


def get_project_dir(project_path: str) -> Path:
    """Resolve project path to absolute Path."""
    p = Path(project_path).resolve()
    if not p.exists():
        print(
            f"[planning-with-files] Error: Path '{project_path}' does not exist.",
            file=sys.stderr,
        )
        sys.exit(1)
    return p


def check_planning_files(project_dir: Path) -> dict:
    """Check which planning files exist and their last modification times."""
    status = {}
    for fname in PLANNING_FILES:
        fpath = project_dir / fname
        if fpath.exists():
            mtime = datetime.fromtimestamp(fpath.stat().st_mtime)
            status[fname] = {"exists": True, "mtime": mtime, "path": str(fpath)}
        else:
            status[fname] = {"exists": False}
    return status


def get_git_log(project_dir: Path, since: str = None, limit: int = 20) -> list:
    """Get recent git commits with file changes."""
    cmd = ["git", "log", "--oneline", f"--max-count={limit}"]
    if since:
        cmd.append(f"--since={since}")
    try:
        result = subprocess.run(
            cmd, cwd=str(project_dir), capture_output=True, text=True, timeout=10
        )
        if result.returncode == 0:
            return result.stdout.strip().split("\n") if result.stdout.strip() else []
    except (subprocess.TimeoutExpired, FileNotFoundError):
        pass
    return []


def get_git_diff_stat(project_dir: Path) -> str:
    """Get git diff --stat for uncommitted changes."""
    try:
        result = subprocess.run(
            ["git", "diff", "--stat"],
            cwd=str(project_dir),
            capture_output=True,
            text=True,
            timeout=10,
        )
        if result.returncode == 0 and result.stdout.strip():
            return result.stdout.strip()
    except (subprocess.TimeoutExpired, FileNotFoundError):
        pass
    return ""


def get_git_status(project_dir: Path) -> str:
    """Get git status --short for uncommitted changes."""
    try:
        result = subprocess.run(
            ["git", "status", "--short"],
            cwd=str(project_dir),
            capture_output=True,
            text=True,
            timeout=10,
        )
        if result.returncode == 0 and result.stdout.strip():
            return result.stdout.strip()
    except (subprocess.TimeoutExpired, FileNotFoundError):
        pass
    return ""


def read_file_tail(filepath: str, lines: int = 30) -> str:
    """Read the last N lines of a file."""
    try:
        with open(filepath, "r", encoding="utf-8", errors="replace") as f:
            all_lines = f.readlines()
            return "".join(all_lines[-lines:])
    except (IOError, OSError):
        return ""


def extract_current_phase(task_plan_content: str) -> str:
    """Extract the current phase from task_plan.md content."""
    for line in task_plan_content.split("\n"):
        if line.startswith("## Current Phase"):
            # Next non-empty line is the phase
            continue
        if "## Current Phase" in line:
            continue
        if line.strip() and not line.startswith("#"):
            return line.strip()
    return "Unknown"


def extract_phase_statuses(task_plan_content: str) -> dict:
    """Extract phase statuses from task_plan.md content."""
    statuses = {}
    current_phase = None
    for line in task_plan_content.split("\n"):
        if line.startswith("### Phase"):
            current_phase = line.strip()
        if current_phase and "**Status:**" in line:
            status = line.split("**Status:**")[1].strip()
            statuses[current_phase] = status
    return statuses


def main():
    project_path = sys.argv[1] if len(sys.argv) > 1 else os.getcwd()
    project_dir = get_project_dir(project_path)

    # Check if planning files exist
    file_status = check_planning_files(project_dir)
    has_planning_files = any(f["exists"] for f in file_status.values())

    if not has_planning_files:
        print("[planning-with-files] No planning files found in this project.")
        print(
            "[planning-with-files] Run init-session.sh to create them, or start a new task."
        )
        return

    # Print catchup report
    print("=" * 60)
    print("[planning-with-files] Session Catchup Report")
    print("=" * 60)
    print()

    # Planning file status
    print("## Planning Files")
    for fname, info in file_status.items():
        if info["exists"]:
            print(f"  ✓ {fname} (modified: {info['mtime'].strftime('%Y-%m-%d %H:%M')})")
        else:
            print(f"  ✗ {fname} (not found)")
    print()

    # Current phase
    task_plan_path = project_dir / "task_plan.md"
    if task_plan_path.exists():
        content = task_plan_path.read_text(encoding="utf-8", errors="replace")
        current_phase = extract_current_phase(content)
        statuses = extract_phase_statuses(content)

        print(f"## Current Phase: {current_phase}")
        print()
        print("## Phase Statuses")
        for phase, status in statuses.items():
            marker = (
                "✓"
                if status == "complete"
                else ("▶" if status == "in_progress" else "○")
            )
            print(f"  {marker} {phase}: {status}")
        print()

        # Show recent progress
        print("## Recent Progress (last 20 lines of progress.md)")
        progress_path = project_dir / "progress.md"
        if progress_path.exists():
            tail = read_file_tail(str(progress_path), 20)
            if tail.strip():
                print(tail)
            else:
                print("  (empty)")
        else:
            print("  progress.md not found")
        print()

    # Git status
    print("## Uncommitted Changes")
    git_status = get_git_status(project_dir)
    if git_status:
        print(git_status)
    else:
        print("  (no uncommitted changes)")
    print()

    # Recent commits
    print("## Recent Commits")
    git_log = get_git_log(project_dir)
    if git_log:
        for line in git_log[:10]:
            print(f"  {line}")
    else:
        print("  (no commits found or not a git repo)")
    print()

    # Uncommitted diff
    diff_stat = get_git_diff_stat(project_dir)
    if diff_stat:
        print("## Uncommitted Diff")
        print(diff_stat)
        print()

    # Recovery guidance
    print("## Recovery Guidance")
    print("1. Read task_plan.md to refresh the goal and current phase.")
    print("2. Read findings.md for research context.")
    print("3. Read progress.md for session history.")
    print("4. Cross-reference git status with progress.md entries.")
    print("5. Update planning files if gaps are found.")
    print("6. Resume from the current phase.")
    print()
    print("=" * 60)


if __name__ == "__main__":
    main()
