#!/usr/bin/env python3
"""
Session Catchup Script for planning-with-files

Analyzes the previous session to find unsynced context after the last
planning file update. Designed to run on SessionStart or after /clear.

Usage: python3 session-catchup.py [project-path]

Outputs a report of:
- Git changes since last plan update
- Unsynced planning file modifications
- Recommended reconciliation actions
"""

import os
import subprocess
import sys
from datetime import datetime
from pathlib import Path

PLANNING_FILES = ["task_plan.md", "progress.md", "findings.md"]


def get_project_dir(project_path: str) -> Path:
    """Resolve project path to absolute Path."""
    p = Path(project_path).resolve()
    if not p.exists():
        print(f"[planning-with-files] Error: Path '{project_path}' does not exist.", file=sys.stderr)
        sys.exit(1)
    return p


def find_last_plan_update(project_dir: Path) -> str | None:
    """Find the most recent modification time of any planning file."""
    latest = None
    for fname in PLANNING_FILES:
        fpath = project_dir / fname
        if fpath.exists():
            mtime = fpath.stat().st_mtime
            if latest is None or mtime > latest:
                latest = mtime
    if latest is not None:
        return datetime.fromtimestamp(latest).isoformat()
    return None


def get_git_changes_since(project_dir: Path, since: str | None) -> list[str]:
    """Get git diff stat for changes since the given timestamp."""
    try:
        if since:
            result = subprocess.run(
                ["git", "diff", "--stat", f"--since={since}"],
                cwd=project_dir,
                capture_output=True,
                text=True,
                timeout=10,
            )
        else:
            result = subprocess.run(
                ["git", "diff", "--stat"],
                cwd=project_dir,
                capture_output=True,
                text=True,
                timeout=10,
            )
        if result.returncode == 0 and result.stdout.strip():
            return result.stdout.strip().split("\n")
    except (subprocess.TimeoutExpired, FileNotFoundError):
        pass
    return []


def get_recent_commits(project_dir: Path, count: int = 5) -> list[str]:
    """Get the most recent git commits."""
    try:
        result = subprocess.run(
            ["git", "log", "--oneline", f"-{count}"],
            cwd=project_dir,
            capture_output=True,
            text=True,
            timeout=10,
        )
        if result.returncode == 0 and result.stdout.strip():
            return result.stdout.strip().split("\n")
    except (subprocess.TimeoutExpired, FileNotFoundError):
        pass
    return []


def check_planning_files(project_dir: Path) -> dict:
    """Check which planning files exist and their sizes."""
    status = {}
    for fname in PLANNING_FILES:
        fpath = project_dir / fname
        if fpath.exists():
            status[fname] = {
                "exists": True,
                "size": fpath.stat().st_size,
                "modified": datetime.fromtimestamp(fpath.stat().st_mtime).isoformat(),
            }
        else:
            status[fname] = {"exists": False}
    return status


def read_plan_status(project_dir: Path) -> dict:
    """Extract current phase and status from task_plan.md."""
    plan_path = project_dir / "task_plan.md"
    if not plan_path.exists():
        return {}

    content = plan_path.read_text()
    status = {}

    # Extract goal
    found_goal = False
    for line in content.split("\n"):
        if line.startswith("## Goal"):
            found_goal = True
            continue
        if found_goal:
            if line.strip() and not line.startswith("##"):
                status["goal"] = line.strip()
                break
            elif line.startswith("##"):
                break

    # Extract current phase
    found_phase = False
    for line in content.split("\n"):
        if line.startswith("## Current Phase"):
            found_phase = True
            continue
        if found_phase:
            if line.strip() and not line.startswith("##"):
                status["current_phase"] = line.strip()
                break
            elif line.startswith("##"):
                break

    # Count phases by status
    status["complete"] = content.count("**Status:** complete")
    status["in_progress"] = content.count("**Status:** in_progress")
    status["pending"] = content.count("**Status:** pending")

    return status


def main():
    project_path = sys.argv[1] if len(sys.argv) > 1 else os.getcwd()
    project_dir = get_project_dir(project_path)

    # Check planning files
    file_status = check_planning_files(project_dir)
    has_planning = any(f["exists"] for f in file_status.values())

    if not has_planning:
        print("[planning-with-files] No planning files found — no active session to recover.")
        return

    # Get plan status
    plan_status = read_plan_status(project_dir)

    # Get last update time
    last_update = find_last_plan_update(project_dir)

    # Get git changes
    git_changes = get_git_changes_since(project_dir, last_update)
    recent_commits = get_recent_commits(project_dir)

    # Output catchup report
    print("=" * 60)
    print("[planning-with-files] Session Catchup Report")
    print("=" * 60)

    print(f"\nProject: {project_dir}")
    print(f"Last plan update: {last_update or 'unknown'}")

    print("\n--- Planning Files ---")
    for fname, info in file_status.items():
        if info["exists"]:
            print(f"  {fname}: {info['size']} bytes (modified: {info['modified']})")
        else:
            print(f"  {fname}: NOT FOUND")

    if plan_status:
        print("\n--- Plan Status ---")
        if "goal" in plan_status:
            print(f"  Goal: {plan_status['goal']}")
        if "current_phase" in plan_status:
            print(f"  Current Phase: {plan_status['current_phase']}")
        print(f"  Complete: {plan_status.get('complete', 0)}")
        print(f"  In Progress: {plan_status.get('in_progress', 0)}")
        print(f"  Pending: {plan_status.get('pending', 0)}")

    if git_changes:
        print(f"\n--- Git Changes Since Last Plan Update ({len(git_changes)} files) ---")
        for line in git_changes[:20]:
            print(f"  {line}")
        if len(git_changes) > 20:
            print(f"  ... and {len(git_changes) - 20} more files")
    else:
        print("\n--- Git Changes ---")
        print("  No uncommitted changes detected.")

    if recent_commits:
        print(f"\n--- Recent Commits ---")
        for line in recent_commits:
            print(f"  {line}")

    # Reconciliation recommendations
    print("\n--- Recommended Actions ---")
    if git_changes and not plan_status.get("complete", 0):
        print("  1. Review git changes and update progress.md with what was done.")
        print("  2. If phases were completed, update task_plan.md status fields.")
        print("  3. Re-read task_plan.md before continuing work.")
    elif not git_changes:
        print("  1. No code changes detected since last plan update.")
        print("  2. Re-read task_plan.md and continue from current phase.")
    else:
        print("  1. All phases marked complete.")
        print("  2. Run check-complete.sh to verify.")
        print("  3. Ask user if additional work is needed.")

    print("=" * 60)


if __name__ == "__main__":
    main()
