#!/usr/bin/env python3
"""
Session Catchup Script for planning-with-files

Analyzes git history and planning files to find unsynced context
after the last planning file update.

Usage:
    python3 session-catchup.py [project-path]
    python3 session-catchup.py [project-path] --json

Exit codes:
    0 = synced, no drift detected
    1 = drift detected, reconciliation needed
    2 = error (no planning files, not a git repo, etc.)
"""

import json
import os
import subprocess
import sys
from pathlib import Path
from datetime import datetime

PLANNING_FILES = ["task_plan.md", "progress.md", "findings.md"]


def normalize_path(project_path: str) -> str:
    """Normalize project path for cross-platform compatibility."""
    p = project_path
    if len(p) > 2 and p[0] == "/" and p[2] == "/":
        p = p[1].upper() + ":" + p[2:]
    return str(Path(p).resolve())


def run_git(args: list[str], project_dir: Path) -> str:
    """Run a git command and return stdout, or empty string on failure."""
    try:
        result = subprocess.run(
            ["git"] + args,
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


def find_last_plan_update(project_dir: Path) -> str | None:
    """Find the last commit that modified any planning file."""
    output = run_git(["log", "-1", "--format=%ci", "--"] + PLANNING_FILES, project_dir)
    return output if output else None


def get_uncommitted_changes(project_dir: Path) -> str:
    """Get uncommitted changes using git diff HEAD."""
    return run_git(["diff", "--stat", "HEAD"], project_dir)


def get_untracked_files(project_dir: Path) -> str:
    """Get list of untracked files."""
    return run_git(["ls-files", "--others", "--exclude-standard"], project_dir)


def get_recent_commits(project_dir: Path, count: int = 5) -> str:
    """Get recent commit log."""
    return run_git(["log", "--oneline", f"-{count}"], project_dir)


def check_planning_files(project_dir: Path) -> dict:
    """Check which planning files exist and their metadata."""
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


def analyze_plan_content(project_dir: Path) -> dict:
    """Analyze task_plan.md content for phase status and completeness."""
    plan_file = project_dir / "task_plan.md"
    if not plan_file.exists():
        return {"has_plan": False}

    content = plan_file.read_text()

    # Count phases
    total_phases = content.count("### Phase")
    complete_phases = content.count("**Status:** complete")
    in_progress = content.count("**Status:** in_progress")
    pending = content.count("**Status:** pending")

    # Check for placeholder text
    has_placeholder = "<One sentence" in content or "<Brief Description" in content

    # Check for error log entries
    error_entries = 0
    if "## Errors Encountered" in content:
        error_section = content.split("## Errors Encountered")[1]
        error_entries = error_section.count("|") - 2  # Subtract header rows

    return {
        "has_plan": True,
        "total_phases": total_phases,
        "complete_phases": complete_phases,
        "in_progress_phases": in_progress,
        "pending_phases": pending,
        "has_placeholder": has_placeholder,
        "error_entries": error_entries,
    }


def detect_drift(file_status: dict, plan_content: dict, uncommitted: str) -> list[str]:
    """Detect gaps between planning files and actual code state."""
    drift = []

    # Check 1: Uncommitted code changes exist but plan shows all complete
    if (
        uncommitted
        and plan_content.get("complete_phases", 0)
        == plan_content.get("total_phases", 0)
        and plan_content.get("total_phases", 0) > 0
    ):
        drift.append(
            "Code changes exist but all phases marked complete — plan may be stale"
        )

    # Check 2: Goal is still a placeholder
    if plan_content.get("has_placeholder"):
        drift.append(
            "Goal section still contains placeholder text — must be filled before execution"
        )

    # Check 3: No phases defined
    if plan_content.get("total_phases", 0) == 0 and plan_content.get("has_plan"):
        drift.append("Plan exists but has no phases — cannot execute")

    # Check 4: Files exist but are empty/tiny
    for fname, info in file_status.items():
        if info.get("exists") and info.get("size", 0) < 50:
            drift.append(
                f"{fname} exists but is suspiciously small ({info['size']} bytes)"
            )

    # Check 5: Untracked files not mentioned in plan
    if uncommitted:
        drift.append(
            "Uncommitted code changes detected — verify they match planned work"
        )

    return drift


def generate_recovery_actions(
    drift: list[str], plan_content: dict, uncommitted: str
) -> list[str]:
    """Generate actionable recovery steps based on detected drift."""
    actions = []

    if plan_content.get("has_placeholder"):
        actions.append(
            "1. Fill in the Goal section of task_plan.md with a concrete objective"
        )

    if plan_content.get("total_phases", 0) == 0 and plan_content.get("has_plan"):
        actions.append("2. Add at least 2 phases to task_plan.md before proceeding")

    if uncommitted and plan_content.get("complete_phases", 0) == plan_content.get(
        "total_phases", 0
    ):
        actions.append(
            "3. Review uncommitted changes — add new phases if work extends beyond plan"
        )

    if not actions:
        actions.append("1. No critical issues detected. Resume from current phase.")

    return actions


def main() -> None:
    use_json = "--json" in sys.argv
    project_path = (
        sys.argv[1] if len(sys.argv) > 1 and sys.argv[1] != "--json" else os.getcwd()
    )
    project_dir = Path(normalize_path(project_path))

    if not project_dir.is_dir():
        msg = {"error": f"'{project_dir}' is not a directory"}
        print(
            json.dumps(msg)
            if use_json
            else f"[planning-with-files] Error: '{project_dir}' is not a directory."
        )
        sys.exit(2)

    # Check planning files
    file_status = check_planning_files(project_dir)
    has_planning_files = any(f["exists"] for f in file_status.values())

    if not has_planning_files:
        msg = {
            "status": "no_planning_files",
            "message": "No planning files found. Run init-session.sh to create them.",
        }
        print(
            json.dumps(msg)
            if use_json
            else "[planning-with-files] No planning files found. Run init-session.sh to create them."
        )
        sys.exit(2)

    # Analyze plan content
    plan_content = analyze_plan_content(project_dir)

    # Git state
    last_update = find_last_plan_update(project_dir)
    uncommitted = get_uncommitted_changes(project_dir)
    untracked = get_untracked_files(project_dir)
    recent = get_recent_commits(project_dir)

    # Detect drift
    drift = detect_drift(file_status, plan_content, uncommitted)
    actions = generate_recovery_actions(drift, plan_content, uncommitted)

    # Build report
    report = {
        "status": "drift_detected" if drift else "synced",
        "planning_files": file_status,
        "plan_content": plan_content,
        "last_plan_commit": last_update,
        "uncommitted_changes": bool(uncommitted),
        "untracked_files": bool(untracked),
        "recent_commits": recent.split("\n") if recent else [],
        "drift": drift,
        "recommended_actions": actions,
    }

    if use_json:
        print(json.dumps(report, indent=2))
    else:
        print("=" * 60)
        print("[planning-with-files] Session Catchup Report")
        print("=" * 60)

        print(f"\n## Status: {'DRIFT DETECTED' if drift else 'IN SYNC'}")

        print("\n## Planning File Status")
        for fname, info in file_status.items():
            if info["exists"]:
                print(
                    f"  {fname}: exists ({info['size']} bytes, modified {info['mtime']})"
                )
            else:
                print(f"  {fname}: not found")

        if plan_content.get("has_plan"):
            print(f"\n## Plan Content Analysis")
            print(
                f"  Phases: {plan_content.get('total_phases', 0)} total, "
                f"{plan_content.get('complete_phases', 0)} complete, "
                f"{plan_content.get('in_progress_phases', 0)} in progress, "
                f"{plan_content.get('pending_phases', 0)} pending"
            )
            if plan_content.get("has_placeholder"):
                print(f"  ⚠ Goal section contains placeholder text")

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

        if drift:
            print(f"\n## Drift Detected ({len(drift)} issue(s)):")
            for i, d in enumerate(drift, 1):
                print(f"  {i}. {d}")

        print(f"\n## Recommended Actions")
        for action in actions:
            print(f"  {action}")

        print("=" * 60)

    # Exit code based on drift
    sys.exit(1 if drift else 0)


if __name__ == "__main__":
    main()
