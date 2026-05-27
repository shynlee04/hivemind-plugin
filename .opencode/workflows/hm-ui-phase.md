<purpose>
Generate a UI design contract (UI-SPEC.md) for frontend phases. Orchestrates hm-ui-researcher and hm-ui-checker with a revision loop. Inserts between discuss-phase and plan-phase in the lifecycle.

UI-SPEC.md locks spacing, typography, color, copywriting, and design system decisions before the planner creates tasks. This prevents design debt caused by ad-hoc styling decisions during execution.
</purpose>

<required_reading>
@/Users/apple/hivemind-plugin-private/.opencode/hivemind/references/ui-brand.md
</required_reading>

<available_agent_types>
Valid Hivemind subagent types (use exact names — do not fall back to 'general-purpose'):
- hm-ui-researcher — Researches UI/UX approaches
- hm-ui-checker — Reviews UI implementation quality
</available_agent_types>

<process>

## 1. Initialize

```bash
# SDK resolution: prefer local hivemind.cjs, fall back to global hivemind (#3668)
HIVEMIND_TOOLS="${RUNTIME_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}/hivemind/bin/hivemind.cjs"
if [ -f "$HIVEMIND_TOOLS" ]; then
  HIVEMIND_SDK="node $HIVEMIND_TOOLS"
elif command -v hivemind >/dev/null 2>&1; then
  HIVEMIND_SDK="hivemind"
else
  echo "ERROR: hivemind not found on PATH and $HIVEMIND_TOOLS does not exist." >&2
  echo "Run: npx hivemind-cc@latest --claude --local" >&2
  exit 1
fi
INIT=$($HIVEMIND_SDK query init.plan-phase "$PHASE")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
AGENT_SKILLS_UI=$($HIVEMIND_SDK query agent-skills hm-ui-researcher)
AGENT_SKILLS_UI_CHECKER=$($HIVEMIND_SDK query agent-skills hm-ui-checker)
```

Parse JSON for: `phase_dir`, `phase_number`, `phase_name`, `phase_slug`, `padded_phase`, `has_context`, `has_research`, `commit_docs`.

**File paths:** `state_path`, `roadmap_path`, `requirements_path`, `context_path`, `research_path`.

Detect sketch findings:
```bash
SKETCH_FINDINGS_PATH=$(ls ./.opencode/skills/sketch-findings-*/SKILL.md 2>/dev/null | head -1 || true)
```

Resolve UI agent models:

```bash
UI_RESEARCHER_MODEL=$($HIVEMIND_SDK query resolve-model hm-ui-researcher --raw)
UI_CHECKER_MODEL=$($HIVEMIND_SDK query resolve-model hm-ui-checker --raw)
```

Check config:

```bash
UI_ENABLED=$($HIVEMIND_SDK query config-get workflow.ui_phase 2>/dev/null || echo "true")
```

**If `UI_ENABLED` is `false`:**
```
UI phase is disabled in config. Enable via /hm-settings.
```
Exit workflow.

**If `planning_exists` is false:** Error — run `/hm-new-project` first.

## 2. Parse and Validate Phase

Extract phase number from $ARGUMENTS. If not provided, detect next unplanned phase.

```bash
PHASE_INFO=$($HIVEMIND_SDK query roadmap.get-phase "${PHASE}")
```

**If `found` is false:** Error with available phases.

## 3. Check Prerequisites

**If `has_context` is false:**
```
No CONTEXT.md found for Phase {N}.
Recommended: run /hm-discuss-phase {N} first to capture design preferences.
Continuing without user decisions — UI researcher will ask all questions.
```
Continue (non-blocking).

**If `has_research` is false:**
```
No RESEARCH.md found for Phase {N}.
Note: stack decisions (component library, styling approach) will be asked during UI research.
```
Continue (non-blocking).

**If `SKETCH_FINDINGS_PATH` is not empty:**
```
⚡ Sketch findings detected: {SKETCH_FINDINGS_PATH}
   Validated design decisions from /hm-sketch will be loaded into the UI researcher.
   Pre-validated decisions (layout, palette, typography, spacing) should be treated as locked — not re-asked.
```

## 4. Check Existing UI-SPEC

```bash
UI_SPEC_FILE=$(ls "${PHASE_DIR}"/*-UI-SPEC.md 2>/dev/null | head -1)
```


**Text mode (`workflow.text_mode: true` in config or `--text` flag):** Set `TEXT_MODE=true` if `--text` is present in `$ARGUMENTS` OR `text_mode` from init JSON is `true`. When TEXT_MODE is active, replace every `question` call with a plain-text numbered list and ask the user to type their choice number. This is required for non-the agent runtimes (OpenAI Codex, Gemini CLI, etc.) where `question` is not available.
**If exists:** Use question:
- header: "Existing UI-SPEC"
- question: "UI-SPEC.md already exists for Phase {N}. What would you like to do?"
- options:
  - "Update — re-run researcher with existing as baseline"
  - "View — display current UI-SPEC and exit"
  - "Skip — keep current UI-SPEC, proceed to verification"

If "View": display file contents, exit.
If "Skip": proceed to step 7 (checker).
If "Update": continue to step 5.

## 5. Spawn hm-ui-researcher

Display:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Hivemind ► UI DESIGN CONTRACT — PHASE {N}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ Spawning UI researcher...
```

Build prompt:

```markdown
Read /Users/apple/hivemind-plugin-private/.opencode/agents/hm-ui-researcher.md for instructions.

<objective>
Create UI design contract for Phase {phase_number}: {phase_name}
Answer: "What visual and interaction contracts does this phase need?"
</objective>

<files_to_read>
- {state_path} (Project State)
- {roadmap_path} (Roadmap)
- {requirements_path} (Requirements)
- {context_path} (USER DECISIONS from /hm-discuss-phase)
- {research_path} (Technical Research — stack decisions)
- {SKETCH_FINDINGS_PATH} (Sketch Findings — validated design decisions, CSS patterns, visual direction from /hm-sketch, if exists)
</files_to_read>

${AGENT_SKILLS_UI}

<output>
Write to: {phase_dir}/{padded_phase}-UI-SPEC.md
Template: /Users/apple/hivemind-plugin-private/.opencode/hivemind/templates/UI-SPEC.md
</output>

<config>
commit_docs: {commit_docs}
phase_dir: {phase_dir}
padded_phase: {padded_phase}
</config>
```

Omit null file paths from `<files_to_read>`.

```
Agent(
  prompt=ui_research_prompt,
  subagent_type="hm-ui-researcher",
  model="{UI_RESEARCHER_MODEL}",
  description="UI Design Contract Phase {N}"
)
```

> **ORCHESTRATOR RULE — CODEX RUNTIME**: After calling Agent() above, stop working on this task immediately. Do not read more files, edit code, or run tests related to this task while the subagent is active. Wait for the subagent to return its result. This prevents duplicate work, conflicting edits, and wasted context. Only resume when the subagent result is available.

## 6. Handle Researcher Return

**If `## UI-SPEC COMPLETE`:**
Display confirmation. Continue to step 7.

**If `## UI-SPEC BLOCKED`:**
Display blocker details and options. Exit workflow.

## 7. Spawn hm-ui-checker

Display:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Hivemind ► VERIFYING UI-SPEC
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ Spawning UI checker...
```

Build prompt:

```markdown
Read /Users/apple/hivemind-plugin-private/.opencode/agents/hm-ui-checker.md for instructions.

<objective>
Validate UI design contract for Phase {phase_number}: {phase_name}
Check all 6 dimensions. Return APPROVED or BLOCKED.
</objective>

<files_to_read>
- {phase_dir}/{padded_phase}-UI-SPEC.md (UI Design Contract — PRIMARY INPUT)
- {context_path} (USER DECISIONS — check compliance)
- {research_path} (Technical Research — check stack alignment)
</files_to_read>

${AGENT_SKILLS_UI_CHECKER}

<config>
ui_safety_gate: {ui_safety_gate config value}
</config>
```

```
Agent(
  prompt=ui_checker_prompt,
  subagent_type="hm-ui-checker",
  model="{UI_CHECKER_MODEL}",
  description="Verify UI-SPEC Phase {N}"
)
```

> **ORCHESTRATOR RULE — CODEX RUNTIME**: After calling Agent() above, stop working on this task immediately. Do not read more files, edit code, or run tests related to this task while the subagent is active. Wait for the subagent to return its result. This prevents duplicate work, conflicting edits, and wasted context. Only resume when the subagent result is available.

## 8. Handle Checker Return

**If `## UI-SPEC VERIFIED`:**
Display dimension results. Proceed to step 10.

**If `## ISSUES FOUND`:**
Display blocking issues. Proceed to step 9.

## 9. Revision Loop (Max 2 Iterations)

Track `revision_count` (starts at 0).

**If `revision_count` < 2:**
- Increment `revision_count`
- Re-spawn hm-ui-researcher with revision context:

```markdown
<revision>
The UI checker found issues with the current UI-SPEC.md.

### Issues to Fix
{paste blocking issues from checker return}

Read the existing UI-SPEC.md, fix ONLY the listed issues, re-write the file.
Do NOT re-ask the user questions that are already answered.
</revision>
```

- After researcher returns → re-spawn checker (step 7)

**If `revision_count` >= 2:**
```
Max revision iterations reached. Remaining issues:

{list remaining issues}

Options:
1. Force approve — proceed with current UI-SPEC (FLAGs become accepted)
2. Edit manually — open UI-SPEC.md in editor, re-run /hm-ui-phase
3. Abandon — exit without approving
```

Use question for the choice.

## 10. Present Final Status

Display:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Hivemind ► UI-SPEC READY ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Phase {N}: {Name}** — UI design contract approved

Dimensions: 6/6 passed
{If any FLAGs: "Recommendations: {N} (non-blocking)"}

───────────────────────────────────────────────────────────────

## ▶ Next Up — [${PROJECT_CODE}] ${PROJECT_TITLE}

{If CONTEXT.md exists for this phase:}
**Plan Phase {N}** — planner will use UI-SPEC.md as design context

`/clear` then: `/hm-plan-phase {N}`

{If CONTEXT.md does NOT exist:}
**Discuss Phase {N}** — gather implementation context before planning

`/clear` then: `/hm-discuss-phase {N}`

(or `/hm-plan-phase {N}` to skip discussion)

───────────────────────────────────────────────────────────────
```

## 11. Commit (if configured)

```bash
$HIVEMIND_SDK query commit "docs(${padded_phase}): UI design contract" --files "${PHASE_DIR}/${PADDED_PHASE}-UI-SPEC.md"
```

## 12. Update State

```bash
$HIVEMIND_SDK query state.record-session \
  --stopped-at "Phase ${PHASE} UI-SPEC approved" \
  --resume-file "${PHASE_DIR}/${PADDED_PHASE}-UI-SPEC.md"
```

</process>

<success_criteria>
- [ ] Config checked (exit if ui_phase disabled)
- [ ] Phase validated against roadmap
- [ ] Prerequisites checked (CONTEXT.md, RESEARCH.md — non-blocking warnings)
- [ ] Existing UI-SPEC handled (update/view/skip)
- [ ] hm-ui-researcher spawned with correct context and file paths
- [ ] UI-SPEC.md created in correct location
- [ ] hm-ui-checker spawned with UI-SPEC.md
- [ ] All 6 dimensions evaluated
- [ ] Revision loop if BLOCKED (max 2 iterations)
- [ ] Final status displayed with next steps
- [ ] UI-SPEC.md committed (if commit_docs enabled)
- [ ] State updated
</success_criteria>
