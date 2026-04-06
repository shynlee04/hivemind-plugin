# Prompt-Enhance Workflow

## Objective
Enhance a prompt through a layered pipeline. All tool calls go through `delegate-task`. Session context is read and passed to every subagent.

## Session State Contract

- Session file: `.hivemind/state/session-context-prompt.md` (resolve as absolute path from workspace root)
- Patch directory: `.hivemind/state/.patches/`
- Session context injection: Read the session file at the start of each phase and pass its content as a constraint to every `delegate-task` call
- Sole writer: orchestrator via `delegate-task` to a builder agent that runs `session-patch`

## Phase 0: Skim

### Step 1: Read Session State
```bash
# Pre-flight: create session file if missing
if [ ! -f .hivemind/state/session-context-prompt.md ]; then
  mkdir -p .hivemind/state/.patches
  cat > .hivemind/state/session-context-prompt.md << 'EOF'
---
patch_count: 0
compaction_count: 0
context_budget_pct: 100
status: idle
---

## What Happened So Far
Session initialized.

## Identified Risks
None yet.

## Task List
None yet.

## Deferred Items
None yet.

## Clarification Log
None yet.

## Final Output
Pending.
EOF
fi

# Read current session state
cat .hivemind/state/session-context-prompt.md
```
Store the output as `SESSION_CONTEXT`.

### Step 2: Run Skim Analysis
```
Task tool (researcher):
  description: "Phase 0: Skim the user's prompt"
  prompt: |
    Run the prompt-skim tool on the following user prompt.
    Return the tool output verbatim.

    User prompt: $USER_PROMPT
  constraints:
    - "Session context: $SESSION_CONTEXT"
    - "Run prompt-skim tool and return its output"
  run_in_background: false
```

### Step 3: Run Context Budget
```
Task tool (researcher):
  description: "Phase 0: Check context budget"
  prompt: |
    Run the context-budget tool with sessionFilePath set to the absolute path of .hivemind/state/session-context-prompt.md.
    Return the tool output verbatim.
  constraints:
    - "Session context: $SESSION_CONTEXT"
    - "Run context-budget tool and return its output"
  run_in_background: false
```

### Step 4: Dispatch Skimmer Agent
```
Task tool (researcher):
  description: "Phase 0: Skim summary"
  prompt: |
    You are the prompt-skimmer agent. Analyze the prompt and return a skim summary only.

    Original prompt: $USER_PROMPT
    Skim tool result: $SKIM_RESULT
    Context budget: $BUDGET_RESULT
  constraints:
    - "Session context: $SESSION_CONTEXT"
    - "Return only: intent, complexity_score, key_entities, ambiguity_flags, recommended_lanes"
  run_in_background: false
```

### Step 5: Patch Skim Summary to Session File
```
Task tool (builder):
  description: "Patch skim summary to session file"
  prompt: |
    Run the session-patch tool with:
    - sessionFilePath: <absolute path to .hivemind/state/session-context-prompt.md>
    - section: "## What Happened So Far"
    - newContent: <skim summary from Step 4>
    Return the tool result.
  constraints:
    - "Session context: $SESSION_CONTEXT"
    - "Use session-patch tool, do not write files directly"
  run_in_background: false
```

## Bridge

Read the skim result's `complexity_score`. Choose lanes:

| complexity_score | Lanes |
|---|---|
| <= 3 | prompt-analyzer, prompt-repackager |
| 4-6 | prompt-analyzer, context-mapper, prompt-repackager |
| >= 7 | prompt-analyzer, context-mapper, risk-assessor, context-purifier, prompt-repackager |

If `budget_pct < 50` from context-budget result, skip optional deepening.

## Investigation Lanes

### prompt-analyzer Lane
```
Task tool (researcher):
  description: "Lane: Deep prompt analysis"
  prompt: |
    You are the prompt-analyzer agent. Analyze the prompt for contradictions, vagueness, missing scope, and clarity issues.

    Original prompt: $USER_PROMPT
    Skim result: $SKIM_RESULT
  constraints:
    - "Session context: $SESSION_CONTEXT"
    - "Return findings with line references, severity, and suggestions"
  run_in_background: false
```

Also run `prompt-analyze` tool directly:
```
Task tool (researcher):
  description: "Lane: Run prompt-analyze tool"
  prompt: |
    Run the prompt-analyze tool on the user prompt. Return the tool output verbatim.

    User prompt: $USER_PROMPT
  constraints:
    - "Session context: $SESSION_CONTEXT"
    - "Run prompt-analyze tool and return its output"
  run_in_background: false
```

### context-mapper Lane
```
Task tool (researcher):
  description: "Lane: Context mapping"
  prompt: |
    You are the context-mapper agent. Verify all file, component, and symbol references in the prompt against the current repository.

    Original prompt: $USER_PROMPT
    Skim result: $SKIM_RESULT
  constraints:
    - "Session context: $SESSION_CONTEXT"
    - "Return verified references, dead references, stale assumptions"
  run_in_background: false
```

### risk-assessor Lane
```
Task tool (researcher):
  description: "Lane: Risk assessment"
  prompt: |
    You are the risk-assessor agent. Identify destructive, security, and scope-creep risks in the prompt.

    Original prompt: $USER_PROMPT
  constraints:
    - "Session context: $SESSION_CONTEXT"
    - "Return risks with severity and mitigation"
  run_in_background: false
```

### context-purifier Lane (complexity >= 7 only)
```
Task tool (researcher):
  description: "Lane: Context purification"
  prompt: |
    You are the context-purifier agent. Distill the prompt to its essential elements without changing intent.

    Original prompt: $USER_PROMPT
  constraints:
    - "Session context: $SESSION_CONTEXT"
    - "Return reduced prompt candidate plus preserved constraints"
  run_in_background: false
```

## Clarification Gate

Build the clarification list from:
- `prompt-analyze` tool findings
- Lane agent findings

**Interactive mode:**
- Ask only unresolved, execution-blocking questions
- After each answer, patch `## Clarification Log` via:

```
Task tool (builder):
  description: "Patch clarification log"
  prompt: |
    Run the session-patch tool with:
    - sessionFilePath: <absolute path>
    - section: "## Clarification Log"
    - newContent: <question + answer>
  constraints:
    - "Session context: $SESSION_CONTEXT"
  run_in_background: false
```

**CI-safe fallback:**
- If `CI=true` or no interactive flow available, skip questions
- Patch `## Deferred Items` with `unverified — review recommended`

## Final Assembly

### Step 1: Dispatch Repackager
```
Task tool (builder):
  description: "Final assembly: Repackage enhanced prompt"
  prompt: |
    Synthesize all inputs into the enhanced prompt payload.

    Original prompt: $USER_PROMPT
    Skim output: $SKIM_RESULT
    Analysis findings: $ANALYSIS_RESULT
    Lane results: $LANE_RESULTS
    Clarification decisions: $CLARIFICATIONS

    Required output format:
    ---
    enhanced_prompt_version: 1
    source_mode: auto|enhance|repack|audit
    lanes_executed: []
    clarifications_resolved: 0
    confidence_score: 0.0
    context_budget_at_start: 100
    context_budget_at_end: 100
    ---

    <enhanced_prompt>
    Rewrite with clearer scope, verified references, and preserved intent.
    </enhanced_prompt>

    <what_happened_so_far>
    Phase 0 skim ran, bridge selected lanes, clarification decisions applied.
    </what_happened_so_far>

    <identified_risks>
    List confirmed risks and mitigations, or state none found.
    </identified_risks>

    <task_list>
    Active tasks in execution order.
    </task_list>

    <deferred_items>
    Unresolved clarifications or intentionally deferred items.
    </deferred_items>
  constraints:
    - "Session context: $SESSION_CONTEXT"
    - "Return the complete YAML frontmatter + XML sections payload"
  run_in_background: false
```

### Step 2: Patch Final Sections
For each section (`## Final Output`, `## Identified Risks`, `## Task List`, `## Deferred Items`):

```
Task tool (builder):
  description: "Patch final section: <section name>"
  prompt: |
    Run the session-patch tool with:
    - sessionFilePath: <absolute path to .hivemind/state/session-context-prompt.md>
    - section: "<section heading>"
    - newContent: <content from repackager>
  constraints:
    - "Session context: $SESSION_CONTEXT"
  run_in_background: false
```
