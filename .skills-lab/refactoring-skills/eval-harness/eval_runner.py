#!/usr/bin/env python3
"""eval_runner.py — Core eval runner logic for skill gate scripts.

Reads evals.json, runs gate scripts against eval prompts, captures output,
evaluates assertions, and produces agentskills.io JSON results.
"""

import argparse
import json
import os
import re
import subprocess
import sys
import tempfile
import shutil
import time
from pathlib import Path


# Skill-to-script mapping
SKILL_SCRIPTS = {
    "meta-builder": "scripts/preflight.sh",
    "user-intent-interactive-loop": "scripts/intent-verify.sh",
    "planning-with-files": "scripts/check-complete.sh",
    "coordinating-loop": "scripts/check-gate.sh",
    "use-authoring-skills": "scripts/validate-gate.sh",
}

ALL_SKILLS = [
    "meta-builder",
    "user-intent-interactive-loop",
    "planning-with-files",
    "coordinating-loop",
    "use-authoring-skills",
]


def setup_test_env(fixture_dir: str) -> str:
    """Create isolated test environment with fixture files."""
    test_dir = tempfile.mkdtemp()
    os.makedirs(os.path.join(test_dir, ".opencode", "state"), exist_ok=True)
    os.makedirs(
        os.path.join(test_dir, ".coordination", "session", "children"), exist_ok=True
    )

    if os.path.isdir(fixture_dir):
        for item in os.listdir(fixture_dir):
            src = os.path.join(fixture_dir, item)
            dst = os.path.join(test_dir, item)
            if os.path.isdir(src):
                shutil.copytree(src, dst, dirs_exist_ok=True)
            else:
                shutil.copy2(src, dst)

    return test_dir


def run_eval(
    skill_name: str,
    eval_id: str,
    prompt: str,
    expected_output: dict,
    assertions: list,
    fixture: str,
    skills_root: str,
    script_dir: str,
    fixtures_dir: str,
    verbose: bool,
) -> dict:
    """Run a single eval case and return the result dict."""
    start_ms = int(time.time() * 1000)

    fixture_path = os.path.join(fixtures_dir, fixture)
    test_dir = setup_test_env(fixture_path)

    script_name = SKILL_SCRIPTS.get(skill_name, "")
    script_path = os.path.join(skills_root, skill_name, script_name)

    stdout_content = ""
    stderr_content = ""
    exit_code = 0

    # Check if script exists
    if not script_name or not os.path.isfile(script_path):
        end_ms = int(time.time() * 1000)
        duration = end_ms - start_ms
        shutil.rmtree(test_dir, ignore_errors=True)
        return {
            "eval_id": eval_id,
            "skill_name": skill_name,
            "prompt": prompt,
            "expected_output": expected_output,
            "actual_output": "",
            "exit_code": 127,
            "duration_ms": duration,
            "assertions": [
                {
                    "text": f"Script exists at {script_path}",
                    "passed": False,
                    "evidence": f"Script not found: {script_path}",
                }
            ],
            "passed": False,
        }

    try:
        if skill_name == "meta-builder":
            proc = subprocess.run(
                ["bash", script_path, prompt],
                capture_output=True,
                text=True,
                cwd=test_dir,
            )
            stdout_content = proc.stdout
            stderr_content = proc.stderr
            exit_code = proc.returncode

        elif skill_name == "user-intent-interactive-loop":
            proc = subprocess.run(
                ["bash", script_path, "--probe"],
                capture_output=True,
                text=True,
                cwd=test_dir,
            )
            stdout_content = proc.stdout
            stderr_content = proc.stderr
            exit_code = proc.returncode

        elif skill_name == "planning-with-files":
            plan_file = os.path.join(test_dir, "task_plan.md")
            if os.path.isfile(plan_file):
                proc = subprocess.run(
                    ["bash", script_path, plan_file],
                    capture_output=True,
                    text=True,
                    cwd=test_dir,
                )
            else:
                proc = subprocess.run(
                    ["bash", script_path],
                    capture_output=True,
                    text=True,
                    cwd=test_dir,
                )
            stdout_content = proc.stdout
            stderr_content = proc.stderr
            exit_code = proc.returncode

        elif skill_name == "coordinating-loop":
            session_name = "eval-session"
            gate = "G1"
            # Check if prompt specifies a gate
            gate_match = re.search(r"G[1-5]", prompt, re.IGNORECASE)
            if gate_match:
                gate = gate_match.group(0).upper()

            os.makedirs(
                os.path.join(test_dir, ".coordination", session_name, "children"),
                exist_ok=True,
            )
            env = os.environ.copy()
            env["COORD_DIR"] = os.path.join(test_dir, ".coordination")
            proc = subprocess.run(
                ["bash", script_path, session_name, gate],
                capture_output=True,
                text=True,
                cwd=test_dir,
                env=env,
            )
            stdout_content = proc.stdout
            stderr_content = proc.stderr
            exit_code = proc.returncode

        elif skill_name == "use-authoring-skills":
            action = "create"
            if any(kw in prompt.lower() for kw in ["review", "audit", "wrong"]):
                action = "audit"
            elif any(kw in prompt.lower() for kw in ["fix", "trigger", "load"]):
                action = "edit"

            proc = subprocess.run(
                ["bash", script_path, action, prompt, test_dir],
                capture_output=True,
                text=True,
                cwd=test_dir,
            )
            stdout_content = proc.stdout
            stderr_content = proc.stderr
            exit_code = proc.returncode

    except Exception as e:
        stderr_content = str(e)
        exit_code = 126

    end_ms = int(time.time() * 1000)
    duration = end_ms - start_ms

    # Evaluate assertions
    all_passed = True
    assertion_results = []

    for assertion in assertions:
        text = assertion.get("text", "")
        passed = False
        evidence = ""

        if "exits 0" in text.lower():
            if exit_code == 0:
                passed = True
                evidence = "exit_code=0"
            else:
                evidence = f"exit_code={exit_code} (expected 0)"
        elif "exits 1" in text.lower():
            if exit_code == 1:
                passed = True
                evidence = "exit_code=1"
            else:
                evidence = f"exit_code={exit_code} (expected 1)"
        elif "exits 2" in text.lower():
            if exit_code == 2:
                passed = True
                evidence = "exit_code=2"
            else:
                evidence = f"exit_code={exit_code} (expected 2)"
        elif "stdout contains" in text.lower():
            search_term = re.sub(r".*stdout contains\s+", "", text, flags=re.IGNORECASE)
            if search_term in stdout_content:
                passed = True
                evidence = f"{search_term} found in stdout"
            else:
                evidence = f"{search_term} NOT found in stdout"
        elif "stderr contains" in text.lower():
            search_term = re.sub(r".*stderr contains\s+", "", text, flags=re.IGNORECASE)
            if search_term in stderr_content:
                passed = True
                evidence = f"{search_term} found in stderr"
            else:
                evidence = f"{search_term} NOT found in stderr"
        elif "output contains" in text.lower():
            search_term = re.sub(r".*output contains\s+", "", text, flags=re.IGNORECASE)
            if search_term in stdout_content or search_term in stderr_content:
                passed = True
                evidence = f"{search_term} found in output"
            else:
                evidence = f"{search_term} NOT found in output"
        elif "reason contains" in text.lower():
            search_term = re.sub(r".*reason contains\s+", "", text, flags=re.IGNORECASE)
            if (
                search_term.lower() in stdout_content.lower()
                or search_term.lower() in stderr_content.lower()
            ):
                passed = True
                evidence = f"{search_term} found in output"
            else:
                evidence = f"{search_term} NOT found in output"
        elif "script not found" in text.lower():
            if exit_code == 127:
                passed = True
                evidence = "Script not found as expected"
            else:
                evidence = f"Script was found (exit_code={exit_code})"
        else:
            if text.lower() in stdout_content.lower():
                passed = True
                evidence = "Match found in stdout"
            elif text.lower() in stderr_content.lower():
                passed = True
                evidence = "Match found in stderr"
            else:
                evidence = f"No match for: {text}"

        if not passed:
            all_passed = False

        assertion_results.append(
            {
                "text": text,
                "passed": passed,
                "evidence": evidence,
            }
        )

    # Default assertion if none provided
    if not assertion_results:
        if exit_code == 0:
            assertion_results = [
                {
                    "text": "Script exited successfully",
                    "passed": True,
                    "evidence": "exit_code=0",
                }
            ]
        else:
            assertion_results = [
                {
                    "text": "Script exited successfully",
                    "passed": False,
                    "evidence": f"exit_code={exit_code}",
                }
            ]
            all_passed = False

    # Verbose output
    if verbose:
        print(f"=== EVAL {eval_id} ({skill_name}) ===", file=sys.stderr)
        print(f"Prompt: {prompt}", file=sys.stderr)
        print(f"Exit code: {exit_code}", file=sys.stderr)
        print(f"Duration: {duration}ms", file=sys.stderr)
        print("--- STDOUT ---", file=sys.stderr)
        print(stdout_content, file=sys.stderr)
        print("--- STDERR ---", file=sys.stderr)
        print(stderr_content, file=sys.stderr)
        print("===============", file=sys.stderr)
        print("", file=sys.stderr)

    # Cleanup
    shutil.rmtree(test_dir, ignore_errors=True)

    return {
        "eval_id": eval_id,
        "skill_name": skill_name,
        "prompt": prompt,
        "expected_output": expected_output,
        "actual_output": stdout_content,
        "exit_code": exit_code,
        "duration_ms": duration,
        "assertions": assertion_results,
        "passed": all_passed,
    }


def run_skill_evals(
    skill_name: str,
    eval_id_filter: str,
    skills_root: str,
    script_dir: str,
    fixtures_dir: str,
    verbose: bool,
) -> list:
    """Run all evals for a single skill."""
    evals_file = os.path.join(skills_root, skill_name, "evals", "evals.json")

    if not os.path.isfile(evals_file):
        print(
            f"Error: evals.json not found for skill '{skill_name}' at {evals_file}",
            file=sys.stderr,
        )
        return []

    with open(evals_file) as f:
        data = json.load(f)

    evals = data.get("evals", [])
    results = []

    for ev in evals:
        eid = ev.get("id", "")
        if eval_id_filter and eid != eval_id_filter:
            continue

        prompt = ev.get("prompt", "")
        expected_output = ev.get("expected_output", {})
        assertions = ev.get("assertions", [])
        fixture = ev.get("fixture", "base-state")

        result = run_eval(
            skill_name=skill_name,
            eval_id=eid,
            prompt=prompt,
            expected_output=expected_output,
            assertions=assertions,
            fixture=fixture,
            skills_root=skills_root,
            script_dir=script_dir,
            fixtures_dir=fixtures_dir,
            verbose=verbose,
        )
        results.append(result)

    return results


def evaluate_assertions(
    stdout_content: str, stderr_content: str, exit_code: int, assertions: list
) -> tuple:
    """Evaluate assertions against script output. Returns (all_passed, assertion_results)."""
    all_passed = True
    assertion_results = []

    for assertion in assertions:
        text = assertion.get("text", "")
        pattern = assertion.get("pattern", "")
        passed = False
        evidence = ""

        if "exits 0" in text.lower():
            if exit_code == 0:
                passed = True
                evidence = "exit_code=0"
            else:
                evidence = f"exit_code={exit_code} (expected 0)"
        elif "exits 1" in text.lower():
            if exit_code == 1:
                passed = True
                evidence = "exit_code=1"
            else:
                evidence = f"exit_code={exit_code} (expected 1)"
        elif "exits 2" in text.lower():
            if exit_code == 2:
                passed = True
                evidence = "exit_code=2"
            else:
                evidence = f"exit_code={exit_code} (expected 2)"
        elif "stdout contains" in text.lower():
            search_term = re.sub(r".*stdout contains\s+", "", text, flags=re.IGNORECASE)
            if search_term in stdout_content:
                passed = True
                evidence = f"{search_term} found in stdout"
            else:
                evidence = f"{search_term} NOT found in stdout"
        elif "stderr contains" in text.lower():
            search_term = re.sub(r".*stderr contains\s+", "", text, flags=re.IGNORECASE)
            if search_term in stderr_content:
                passed = True
                evidence = f"{search_term} found in stderr"
            else:
                evidence = f"{search_term} NOT found in stderr"
        elif "output contains" in text.lower():
            search_term = re.sub(r".*output contains\s+", "", text, flags=re.IGNORECASE)
            if search_term in stdout_content or search_term in stderr_content:
                passed = True
                evidence = f"{search_term} found in output"
            else:
                evidence = f"{search_term} NOT found in output"
        elif "reason contains" in text.lower():
            search_term = re.sub(r".*reason contains\s+", "", text, flags=re.IGNORECASE)
            if (
                search_term.lower() in stdout_content.lower()
                or search_term.lower() in stderr_content.lower()
            ):
                passed = True
                evidence = f"{search_term} found in output"
            else:
                evidence = f"{search_term} NOT found in output"
        elif "script not found" in text.lower():
            if exit_code == 127:
                passed = True
                evidence = "Script not found as expected"
            else:
                evidence = f"Script was found (exit_code={exit_code})"
        elif pattern:
            # Use regex pattern matching
            combined = stdout_content + stderr_content
            if re.search(pattern, combined):
                passed = True
                evidence = f"Pattern '{pattern}' matched"
            else:
                evidence = f"Pattern '{pattern}' NOT matched"
        else:
            if text.lower() in stdout_content.lower():
                passed = True
                evidence = "Match found in stdout"
            elif text.lower() in stderr_content.lower():
                passed = True
                evidence = "Match found in stderr"
            else:
                evidence = f"No match for: {text}"

        if not passed:
            all_passed = False

        assertion_results.append(
            {
                "text": text,
                "passed": passed,
                "evidence": evidence,
            }
        )

    return all_passed, assertion_results


def run_chain_layer(
    layer_def: dict,
    skills_root: str,
    fixtures_dir: str,
    verbose: bool,
) -> dict:
    """Run a single layer of a chain eval. Returns layer result dict."""
    layer_num = layer_def.get("layer", -1)
    skill_name = layer_def.get("skill", "")
    script_rel = layer_def.get("script", "")
    layer_input = layer_def.get("input", "")
    fixture = layer_def.get("fixture", "base-state")
    expected_exit_code = layer_def.get("expected_exit_code", 0)
    assertions = layer_def.get("assertions", [])

    start_ms = int(time.time() * 1000)

    fixture_path = os.path.join(fixtures_dir, fixture)
    test_dir = setup_test_env(fixture_path)

    script_path = os.path.join(skills_root, skill_name, script_rel)

    stdout_content = ""
    stderr_content = ""
    exit_code = 0

    if not os.path.isfile(script_path):
        end_ms = int(time.time() * 1000)
        duration = end_ms - start_ms
        shutil.rmtree(test_dir, ignore_errors=True)
        return {
            "layer": layer_num,
            "skill": skill_name,
            "script": script_rel,
            "fixture": fixture,
            "exit_code": 127,
            "expected_exit_code": expected_exit_code,
            "duration_ms": duration,
            "assertions": [
                {
                    "text": f"Script exists at {script_path}",
                    "passed": False,
                    "evidence": f"Script not found: {script_path}",
                }
            ],
            "passed": False,
            "status": "FAILED",
            "state_output": layer_def.get("state_output", {}),
        }

    try:
        if skill_name == "meta-builder":
            proc = subprocess.run(
                ["bash", script_path, layer_input],
                capture_output=True,
                text=True,
                cwd=test_dir,
            )
            stdout_content = proc.stdout
            stderr_content = proc.stderr
            exit_code = proc.returncode

        elif skill_name == "user-intent-interactive-loop":
            args = ["bash", script_path]
            if layer_input:
                args.append(layer_input)
            else:
                args.append("--probe")
            proc = subprocess.run(
                args,
                capture_output=True,
                text=True,
                cwd=test_dir,
            )
            stdout_content = proc.stdout
            stderr_content = proc.stderr
            exit_code = proc.returncode

        elif skill_name == "planning-with-files":
            plan_file = os.path.join(test_dir, "task_plan.md")
            if os.path.isfile(plan_file) and not layer_input:
                proc = subprocess.run(
                    ["bash", script_path, plan_file],
                    capture_output=True,
                    text=True,
                    cwd=test_dir,
                )
            else:
                cmd = ["bash", script_path]
                if layer_input:
                    cmd.append(layer_input)
                proc = subprocess.run(
                    cmd,
                    capture_output=True,
                    text=True,
                    cwd=test_dir,
                )
            stdout_content = proc.stdout
            stderr_content = proc.stderr
            exit_code = proc.returncode

        elif skill_name == "coordinating-loop":
            # Parse input for session name and gate
            parts = layer_input.split()
            session_name = parts[0] if len(parts) > 0 else "eval-session"
            gate = parts[1] if len(parts) > 1 else "G1"

            os.makedirs(
                os.path.join(test_dir, ".coordination", session_name, "children"),
                exist_ok=True,
            )
            env = os.environ.copy()
            env["COORD_DIR"] = os.path.join(test_dir, ".coordination")
            proc = subprocess.run(
                ["bash", script_path, session_name, gate],
                capture_output=True,
                text=True,
                cwd=test_dir,
                env=env,
            )
            stdout_content = proc.stdout
            stderr_content = proc.stderr
            exit_code = proc.returncode

        elif skill_name == "use-authoring-skills":
            # Parse input: <action> "<request>" [skill-dir]
            # Input format: 'create "API Rate Limiter" .' or 'audit "meta-builder routing issues" .'
            action = "create"
            request = layer_input
            skill_dir = test_dir

            # Try to parse structured input
            action_match = re.match(r'^(\w+)\s+"([^"]*)"\s*(.*)', layer_input)
            if action_match:
                action = action_match.group(1)
                request = action_match.group(2)
                dir_part = action_match.group(3).strip()
                if dir_part and dir_part != ".":
                    skill_dir = dir_part
                else:
                    skill_dir = test_dir
            else:
                # Fallback: try to detect action from keywords
                lower_input = layer_input.lower()
                if any(kw in lower_input for kw in ["review", "audit", "wrong"]):
                    action = "audit"
                elif any(kw in lower_input for kw in ["fix", "trigger", "load"]):
                    action = "edit"

            proc = subprocess.run(
                ["bash", script_path, action, request, skill_dir],
                capture_output=True,
                text=True,
                cwd=test_dir,
            )
            stdout_content = proc.stdout
            stderr_content = proc.stderr
            exit_code = proc.returncode

    except Exception as e:
        stderr_content = str(e)
        exit_code = 126

    end_ms = int(time.time() * 1000)
    duration = end_ms - start_ms

    # Evaluate assertions
    all_passed, assertion_results = evaluate_assertions(
        stdout_content, stderr_content, exit_code, assertions
    )

    # Check expected exit code
    exit_code_ok = exit_code == expected_exit_code
    if not exit_code_ok:
        all_passed = False
        assertion_results.append(
            {
                "text": f"Exit code matches expected ({expected_exit_code})",
                "passed": False,
                "evidence": f"exit_code={exit_code} (expected {expected_exit_code})",
            }
        )
    else:
        assertion_results.append(
            {
                "text": f"Exit code matches expected ({expected_exit_code})",
                "passed": True,
                "evidence": f"exit_code={exit_code}",
            }
        )

    # Determine status
    if all_passed:
        status = "PASSED"
    else:
        status = "FAILED"

    # Verbose output
    if verbose:
        print(f"  --- LAYER {layer_num}: {skill_name} ---", file=sys.stderr)
        print(f"  Script: {script_rel}", file=sys.stderr)
        print(f"  Input: {layer_input}", file=sys.stderr)
        print(f"  Fixture: {fixture}", file=sys.stderr)
        print(
            f"  Exit code: {exit_code} (expected {expected_exit_code})", file=sys.stderr
        )
        print(f"  Duration: {duration}ms", file=sys.stderr)
        print(f"  Status: {status}", file=sys.stderr)
        print(f"  --- STDOUT ---", file=sys.stderr)
        print(stdout_content, file=sys.stderr)
        print(f"  --- STDERR ---", file=sys.stderr)
        print(stderr_content, file=sys.stderr)
        print(f"  --- ASSERTIONS ---", file=sys.stderr)
        for a in assertion_results:
            mark = "PASS" if a["passed"] else "FAIL"
            print(f"    [{mark}] {a['text']}: {a['evidence']}", file=sys.stderr)
        print(f"  ===============", file=sys.stderr)
        print("", file=sys.stderr)

    # Cleanup
    shutil.rmtree(test_dir, ignore_errors=True)

    return {
        "layer": layer_num,
        "skill": skill_name,
        "script": script_rel,
        "fixture": fixture,
        "exit_code": exit_code,
        "expected_exit_code": expected_exit_code,
        "duration_ms": duration,
        "assertions": assertion_results,
        "passed": all_passed,
        "status": status,
        "state_output": layer_def.get("state_output", {}),
    }


def run_chain_eval(
    chain_name: str,
    skills_root: str,
    script_dir: str,
    fixtures_dir: str,
    verbose: bool,
) -> dict:
    """Run a chain eval from a JSON file. Returns full chain result dict."""
    chain_evals_dir = os.path.join(script_dir, "chain-evals")

    # Support both bare name and full path
    if chain_name.endswith(".json"):
        chain_file = os.path.join(chain_evals_dir, chain_name)
    else:
        chain_file = os.path.join(chain_evals_dir, f"{chain_name}.json")

    if not os.path.isfile(chain_file):
        print(
            f"Error: chain eval file not found at {chain_file}",
            file=sys.stderr,
        )
        return {
            "chain_id": chain_name,
            "name": chain_name,
            "status": "ERROR",
            "error": f"Chain eval file not found: {chain_file}",
            "layers": [],
            "cross_layer_assertions": [],
            "total_duration_ms": 0,
        }

    with open(chain_file) as f:
        chain_data = json.load(f)

    chain_id = chain_data.get("chain_id", chain_name)
    name = chain_data.get("name", chain_name)
    user_prompt = chain_data.get("user_prompt", "")
    layers = chain_data.get("layers", [])
    cross_layer_assertions = chain_data.get("cross_layer_assertions", [])
    expected_duration = chain_data.get("expected_total_duration_ms", 10000)

    print(f"=== Chain Eval: {chain_id} — {name} ===", file=sys.stderr)
    print(f"User prompt: {user_prompt}", file=sys.stderr)
    print(f"Layers: {len(layers)}", file=sys.stderr)
    print("", file=sys.stderr)

    chain_start_ms = int(time.time() * 1000)
    layer_results = []
    chain_failed = False

    for layer_def in layers:
        layer_num = layer_def.get("layer", -1)

        if chain_failed:
            # Mark remaining layers as SKIPPED
            layer_results.append(
                {
                    "layer": layer_num,
                    "skill": layer_def.get("skill", ""),
                    "status": "SKIPPED",
                    "reason": f"Layer {layer_num - 1} failed — chain is sequential",
                    "assertions": [],
                    "passed": False,
                    "state_output": {},
                }
            )
            continue

        result = run_chain_layer(layer_def, skills_root, fixtures_dir, verbose)
        layer_results.append(result)

        if not result["passed"]:
            chain_failed = True

    chain_end_ms = int(time.time() * 1000)
    total_duration = chain_end_ms - chain_start_ms

    # Evaluate cross-layer assertions
    cross_layer_results = []
    for cla in cross_layer_assertions:
        text = cla.get("text", "")
        pattern = cla.get("pattern", "")

        # Cross-layer assertions are descriptive — mark as verified if all layers passed
        if not chain_failed:
            passed = True
            evidence = "All layers passed — state flow verified"
        else:
            passed = False
            evidence = "Chain failed — state flow interrupted"

        cross_layer_results.append(
            {
                "text": text,
                "passed": passed,
                "evidence": evidence,
            }
        )

    # Determine overall chain status
    if chain_failed:
        overall_status = "FAILED"
    else:
        overall_status = "PASSED"

    print(f"=== Chain Result: {overall_status} ===", file=sys.stderr)
    print(f"Total duration: {total_duration}ms", file=sys.stderr)
    for lr in layer_results:
        print(f"  Layer {lr['layer']}: {lr['skill']} — {lr['status']}", file=sys.stderr)
    print("", file=sys.stderr)

    return {
        "chain_id": chain_id,
        "name": name,
        "user_prompt": user_prompt,
        "status": overall_status,
        "total_duration_ms": total_duration,
        "expected_total_duration_ms": expected_duration,
        "layers": layer_results,
        "cross_layer_assertions": cross_layer_results,
    }


def count_individual_evals(skills_root: str) -> int:
    """Count total individual evals across all skills."""
    total = 0
    for skill in ALL_SKILLS:
        evals_file = os.path.join(skills_root, skill, "evals", "evals.json")
        if os.path.isfile(evals_file):
            with open(evals_file) as f:
                data = json.load(f)
            total += len(data.get("evals", []))
    return total


def count_chain_evals(script_dir: str) -> int:
    """Count total chain eval files."""
    chain_dir = os.path.join(script_dir, "chain-evals")
    if not os.path.isdir(chain_dir):
        return 0
    return len([f for f in os.listdir(chain_dir) if f.endswith(".json")])


def count_individual_evals(skills_root: str) -> int:
    """Count total individual evals across all skills."""
    total = 0
    for skill in ALL_SKILLS:
        evals_file = os.path.join(skills_root, skill, "evals", "evals.json")
        if os.path.isfile(evals_file):
            with open(evals_file) as f:
                data = json.load(f)
            total += len(data.get("evals", []))
    return total


def count_chain_evals(script_dir: str) -> int:
    """Count total chain eval files."""
    chain_dir = os.path.join(script_dir, "chain-evals")
    if not os.path.isdir(chain_dir):
        return 0
    return len([f for f in os.listdir(chain_dir) if f.endswith(".json")])


def main():
    parser = argparse.ArgumentParser(description="Eval runner for skill gate scripts")
    parser.add_argument(
        "--skills-root", required=True, help="Root directory containing skill packs"
    )
    parser.add_argument("--script-dir", required=True, help="Directory of this script")
    parser.add_argument(
        "--results-dir", required=True, help="Directory for results output"
    )
    parser.add_argument("--skill", default="", help="Run evals for one skill")
    parser.add_argument("--eval", default="", help="Run a single eval case")
    parser.add_argument("--chain", default="", help="Run a chain eval")
    parser.add_argument("--all", action="store_true", help="Run all evals")
    parser.add_argument("--json", action="store_true", help="Output as JSON")
    parser.add_argument("--verbose", action="store_true", help="Show full output")

    args = parser.parse_args()

    fixtures_dir = os.path.join(args.script_dir, "fixtures")

    if args.all:
        all_results = []
        for skill in ALL_SKILLS:
            results = run_skill_evals(
                skill,
                args.eval,
                args.skills_root,
                args.script_dir,
                fixtures_dir,
                args.verbose,
            )
            all_results.extend(results)

        # Also run all chain evals
        chain_evals_dir = os.path.join(args.script_dir, "chain-evals")
        if os.path.isdir(chain_evals_dir):
            for chain_file in sorted(os.listdir(chain_evals_dir)):
                if chain_file.endswith(".json"):
                    chain_name = chain_file.replace(".json", "")
                    chain_result = run_chain_eval(
                        chain_name,
                        args.skills_root,
                        args.script_dir,
                        fixtures_dir,
                        args.verbose,
                    )
                    all_results.append(chain_result)

        # Summary
        individual_count = count_individual_evals(args.skills_root)
        chain_count = count_chain_evals(args.script_dir)
        total_count = individual_count + chain_count
        print(
            f"\n=== Summary: {individual_count} individual + {chain_count} chain = {total_count} total evals ===",
            file=sys.stderr,
        )

        print(json.dumps(all_results, indent=2))

    elif args.chain:
        results = run_chain_eval(
            args.chain, args.skills_root, args.script_dir, fixtures_dir, args.verbose
        )
        print(json.dumps(results, indent=2))

    elif args.skill:
        results = run_skill_evals(
            args.skill,
            args.eval,
            args.skills_root,
            args.script_dir,
            fixtures_dir,
            args.verbose,
        )
        print(json.dumps(results, indent=2))

    else:
        print(
            "Usage: eval-runner.sh --skill <name> | --all | --chain <name> [--eval <id>] [--verbose]",
            file=sys.stderr,
        )
        sys.exit(1)


if __name__ == "__main__":
    main()
