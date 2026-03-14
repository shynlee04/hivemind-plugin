# HiveFiver Deterministic Chain Completion — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make every HiveFiver journey produce identical, parseable outputs when run anywhere — all commands, workflows, templates, references, gates wired into a deterministic chain with a GSD-grade User Guide.

**Architecture:** Journey-first design. 7 journeys × N stages each = transitions. Every transition has: source output format → gate → target entry format. Templates enforce format. User Guide documents the full system.

**Tech Stack:** Markdown (frontmatter YAML), Bash scripts, JSON schemas

**Spec Reference:** `docs/SPEC-META-BUILDER-MODULE-2026-03-01.md`

---

## Current State (Verified 2026-03-01)

| Layer | Count | Status |
|-------|-------|--------|
| Commands | 10 | ✅ All have pre-turn, post-turn, output_contract |
| Workflows | 10 | ⚠️ Edited but NOT individually validated |
| Templates | 0 | ❌ No stage output templates exist |
| References | 10 | ✅ Complete |
| Scripts | 15 | ✅ All production-tested |

## Journeys to Wire

| # | Journey | Pipeline | Stages | Transitions |
|---|---------|----------|--------|-------------|
| J1 | build_new | full_build | start→discovery→intake→spec→architect→build→audit | 6 |
| J2 | extend | full_build | start→discovery→intake→spec→architect→build→audit | 6 |
| J3 | fix_broken | doctor_fix | start→doctor→audit | 2 |
| J4 | audit_health | audit_only | start→audit→doctor(optional) | 1-2 |
| J5 | improve | audit_then_build | start→audit→triage→intake→spec→architect→build | 6 |
| J6 | learn | guided_onboard | start→discovery→END | 1 |
| J7 | custom | adaptive | start→discovery→reclassify→route | 2 |

**Total unique stage nodes:** 10 (router, start, discovery, intake, spec, architect, build, audit, doctor, continue)
**Total unique transitions:** 18

---

## Task 1: Create Stage Output Template — `start`

**Files:**
- Create: `.opencode/templates/hivefiver/stage-output-start.md`

**Step 1: Write the template file**

Template must contain:
- Frontmatter (name, description, version, stage)
- JSON schema with EVERY field typed
- Field descriptions
- Example output
- Consumer reference (which stages consume this output)

**Step 2: Validate template independently**

Run:
```bash
# Check frontmatter valid
head -10 .opencode/templates/hivefiver/stage-output-start.md | grep -c "^---$"
# Expected: 2

# Check JSON schema parseable
grep -A 50 '```json' .opencode/templates/hivefiver/stage-output-start.md | grep -v '```' | python3 -c "import json,sys; json.load(sys.stdin); print('VALID JSON')"
# Expected: VALID JSON

# Check all required fields present
for field in stage status intent pipeline state_updates next_command gate_result; do
  grep -q "\"$field\"" .opencode/templates/hivefiver/stage-output-start.md && echo "$field: ✅" || echo "$field: ❌"
done
```

**Step 3: Verify workflow references template**

```bash
grep -q "stage-output-start" .opencode/workflows/hivefiver/start.md || echo "NEEDS: Add template reference to workflow"
```

---

## Task 2: Create Stage Output Template — `discovery`

**Files:**
- Create: `.opencode/templates/hivefiver/stage-output-discovery.md`

Same structure as Task 1 but with discovery-specific fields:
- discovery_summary (8 required answer fields)
- user_profile (language, maturity, input_band, guidance)
- unresolved_critical, unresolved_minor
- brainstorm_output
- promotion_allowed
- reclassified_intent (for custom journey)

**Validation:** Same pattern as Task 1 — frontmatter, JSON parseable, all fields present.

---

## Task 3: Create Stage Output Template — `intake`

**Files:**
- Create: `.opencode/templates/hivefiver/stage-output-intake.md`

Fields: asset_type, requirements, ambiguities, state_updates, next_command, gate_result

**Validation:** Same pattern.

---

## Task 4: Create Stage Output Template — `spec`

**Files:**
- Create: `.opencode/templates/hivefiver/stage-output-spec.md`

Fields: specification, acceptance_criteria, ambiguity_map, state_updates, next_command, gate_result

**Validation:** Same pattern.

---

## Task 5: Create Stage Output Template — `architect`

**Files:**
- Create: `.opencode/templates/hivefiver/stage-output-architect.md`

Fields: topology, contracts, dependencies, risk_assessment, state_updates, next_command, gate_result

**Validation:** Same pattern.

---

## Task 6: Create Stage Output Template — `build`

**Files:**
- Create: `.opencode/templates/hivefiver/stage-output-build.md`

Fields: assets_created, assets_modified, validations, state_updates, next_command, gate_result

**Validation:** Same pattern.

---

## Task 7: Create Stage Output Template — `audit`

**Files:**
- Create: `.opencode/templates/hivefiver/stage-output-audit.md`

Fields: summary, findings, anti_patterns, parity_status, triage, state_updates, next_command, gate_result

**Validation:** Same pattern.

---

## Task 8: Create Stage Output Template — `doctor`

**Files:**
- Create: `.opencode/templates/hivefiver/stage-output-doctor.md`

Fields: diagnostics, fixes_applied, regressions, state_updates, next_command, gate_result

**Validation:** Same pattern.

---

## Task 9: Create Stage Output Template — `continue`

**Files:**
- Create: `.opencode/templates/hivefiver/stage-output-continue.md`

Fields: pipeline_state, continuation_command, handoff_file, new_session_will_do

**Validation:** Same pattern.

---

## Task 10: Create Stage Output Template — `router`

**Files:**
- Create: `.opencode/templates/hivefiver/stage-output-router.md`

Fields: resolved_action, resolved_command, classification_method, confidence, pipeline_state

**Validation:** Same pattern.

---

## Task 11: Create Transition Contract Template

**Files:**
- Create: `.opencode/templates/hivefiver/transition-contract.md`

A single template that defines the HANDOFF format between any two stages:

```json
{
  "transition": {
    "from_stage": "...",
    "to_stage": "...",
    "journey": "...",
    "gate_name": "...",
    "gate_result": "passed | failed",
    "gate_evidence": "..."
  },
  "payload": {
    "source_output": "<stage-output-X format>",
    "target_expects": ["field1", "field2"]
  },
  "state_mutation": {
    "add_completed": "...",
    "set_stage": "...",
    "set_gate": "..."
  }
}
```

**Validation:**
```bash
# JSON parseable
# All 18 transitions can be expressed in this format
# Cross-reference with intent-pipeline-definitions.md
```

---

## Task 12: Validate ALL Workflows (Incremental, Isolated)

For EACH of the 10 workflows, run this validation battery:

```bash
for wf in .opencode/workflows/hivefiver/*.md; do
  name=$(basename "$wf" .md)
  echo "=== Validating: $name ==="
  
  # V1: Frontmatter valid (exactly 2 --- markers in first 10 lines)
  head -10 "$wf" | grep -c "^---$"  # Expected: 2
  
  # V2: Has all 5 required sections
  for section in "Entry Criteria" "Exit Criteria" "Offer Next" "Output Format" "Error Routing"; do
    grep -q "$section" "$wf" && echo "  $section: ✅" || echo "  $section: ❌"
  done
  
  # V3: Output Format has valid JSON
  grep -A 30 '```json' "$wf" | head -30 | grep -v '```' | python3 -c "import json,sys; json.load(sys.stdin); print('  JSON: ✅')" 2>/dev/null || echo "  JSON: ❌"
  
  # V4: Offer Next has correct command references (hyphenated, not spaced)
  grep -c 'hivefiver-' "$wf"  # Should be > 0
  grep -c '/hivefiver [a-z]' "$wf"  # Should be 0 (old format)
  
  # V5: Entry criteria references upstream stage
  grep -q "Upstream Transitions\|completed\|Entry Criteria" "$wf"
  
  echo ""
done
```

---

## Task 13: Create Comprehensive User Guide

**Files:**
- Create: `.opencode/references/hivefiver-user-guide.md`

Sections (matching GSD pattern):
1. Table of Contents
2. Workflow Diagrams (ASCII art for all 7 journeys)
3. Stage Coordination Diagram (runtime-gate enforcement)
4. Command Reference (all 10 commands in table format)
5. Configuration Reference (STATE.md Pipeline State fields)
6. Usage Examples (one per journey, step-by-step)
7. Troubleshooting (problems + solutions table)
8. Recovery Quick Reference (table)
9. Framework File Structure (tree diagram)

**Validation:**
```bash
# All 9 sections present
for section in "Workflow Diagrams" "Command Reference" "Configuration" "Usage Examples" "Troubleshooting" "Recovery" "File Structure"; do
  grep -q "$section" .opencode/references/hivefiver-user-guide.md && echo "$section: ✅" || echo "$section: ❌"
done

# All 10 commands mentioned
for cmd in start discovery intake spec architect build audit doctor continue hivefiver; do
  grep -q "hivefiver-$cmd\|/hivefiver $cmd" .opencode/references/hivefiver-user-guide.md && echo "$cmd: ✅" || echo "$cmd: ❌"
done

# All 7 journeys documented
for journey in build_new fix_broken audit_health improve learn custom extend; do
  grep -q "$journey" .opencode/references/hivefiver-user-guide.md && echo "$journey: ✅" || echo "$journey: ❌"
done
```

---

## Task 14: Validate Full Journey Chains (End-to-End)

Run the journey chain audit for all 7 journeys, verifying:
- Every transition has source.offer_next → target entry
- Every gate-check supports the transition
- Every output format template exists for the stage
- Every workflow references its template

```bash
# For each of the 18 transitions:
# 1. Source workflow .offer_next points to correct target command
# 2. Target workflow .entry_criteria references source completion
# 3. Output format of source matches target's expected input
# 4. gate-check.sh supports the stage transition
# 5. runtime-gate.sh runs at both ends
```

---

## Task 15: Sync Parity and Final Verification

**Files:**
- Modify: `commands/hivefiver*.md` (sync from .opencode)

```bash
# Sync all hivefiver commands to root
for f in .opencode/commands/hivefiver*.md; do cp "$f" "commands/$(basename "$f")"; done

# Verify parity
diff -rq .opencode/commands/ commands/ | grep hivefiver || echo "PARITY CLEAN"

# Verify all agents in parity
diff -rq .opencode/agents/ agents/ || echo "AGENTS CLEAN"

# Final inventory count
echo "Commands: $(ls .opencode/commands/hivefiver*.md | wc -l)"
echo "Workflows: $(ls .opencode/workflows/hivefiver/*.md | wc -l)"
echo "Templates: $(ls .opencode/templates/hivefiver/*.md | wc -l)"
echo "References: $(ls .opencode/skills/hivefiver-coordination/references/*.md .opencode/skills/hivefiver-mode/references/*.md | wc -l)"
echo "Scripts: $(ls .opencode/skills/hivefiver-coordination/scripts/*.sh .opencode/skills/hivefiver-mode/scripts/*.sh | wc -l)"
```

---

## Execution Order

| Phase | Tasks | Dependency |
|-------|-------|-----------|
| A: Templates | 1-10 | None (parallel-safe, each template is independent) |
| B: Transition Contract | 11 | After A (references template formats) |
| C: Workflow Validation | 12 | After A+B (validates against templates) |
| D: User Guide | 13 | After A+B+C (documents validated system) |
| E: Journey Chains | 14 | After C+D (end-to-end validation) |
| F: Parity + Final | 15 | After ALL (last step) |

**Isolation Rule:** Each task validates ONLY its own output. Never skip validation. Never claim done without evidence.
