# Prompt-Enhance Workflow

## Objective
Enhance a prompt through a layered pipeline using the Task tool to isolate each phase in separate subagent sessions. Keep your own context lean.

## Session State Contract

- Session file: `.hivemind/state/session-context-prompt.md`
- Patch directory: `.hivemind/state/.patches/`
- Read the session file at the start of each phase via bash (`cat`)
- Pass session content as context to subagents that need it
- Use builder subagents via Task tool for session-patch calls

## Phase 0: Skim

### Step 1: Read Session State
```bash
# Pre-flight: create if missing
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

# Read current state
cat .hivemind/state/session-context-prompt.md
```
Store the output as SESSION_CONTEXT.

### Step 2: Run Skim Analysis via Task tool
```
Task tool:
  description: "Phase 0: Skim the user's prompt"
  prompt: "Analyze the following user prompt and return a skim summary.\n\nUser prompt: $USER_PROMPT\n\nReturn as JSON-like structure:\n- intent: One sentence\n- complexity_score: 1-10\n- key_entities: List of files, components, commands, workflows mentioned\n- ambiguity_flags: List of unclear areas\n- recommended_lanes: Suggested lanes based on complexity"
```

Store the result as SKIM_RESULT.

### Step 3: Run Context Budget via Task tool
```
Task tool:
  description: "Phase 0: Check context budget"
  prompt: "Read the context-budget tool output for the session file at .hivemind/state/session-context-prompt.md. Return the budget percentage."
```

Store the result as BUDGET_RESULT.

### Step 4: Patch Skim Summary via Task tool (builder)
```
Task tool:
  description: "Patch skim summary to session file"
  prompt: "Run the session-patch tool to update the session file.\n- sessionFilePath: absolute path to .hivemind/state/session-context-prompt.md\n- section: '## What Happened So Far'\n- newContent: $SKIM_RESULT\nReturn the tool output."
```

## Bridge

Read SKIM_RESULT's complexity_score. Choose lanes:

| complexity_score | Lanes |
|---|---|
| <= 3 | prompt-analyzer, prompt-repackager |
| 4-6 | prompt-analyzer, context-mapper, prompt-repackager |
| >= 7 | prompt-analyzer, context-mapper, risk-assessor, context-purifier, prompt-repackager |

If BUDGET_RESULT's budget_pct < 50, skip optional deepening.

## Investigation Lanes

### prompt-analyzer Lane
```
Task tool:
  description: "Lane: Deep prompt analysis"
  prompt: "Analyze this prompt for contradictions, vagueness, missing scope, and clarity issues.\n\nOriginal prompt: $USER_PROMPT\nSkim result: $SKIM_RESULT\n\nReturn findings with line references, severity, and suggestions."
```

Also run prompt-analyze tool:
```
Task tool:
  description: "Lane: Run prompt-analyze tool"
  prompt: "Run the prompt-analyze tool on the user prompt and return the tool output verbatim.\n\nUser prompt: $USER_PROMPT"
```

Store results as ANALYSIS_RESULT.

### context-mapper Lane
```
Task tool:
  description: "Lane: Context mapping"
  prompt: "Verify all file, component, and symbol references in this prompt against the current repository.\n\nOriginal prompt: $USER_PROMPT\nSkim result: $SKIM_RESULT\n\nReturn verified references, dead references, stale assumptions."
```

Store results as MAP_RESULT.

### risk-assessor Lane
```
Task tool:
  description: "Lane: Risk assessment"
  prompt: "Identify destructive, security, and scope-creep risks in this prompt.\n\nOriginal prompt: $USER_PROMPT\n\nReturn risks with severity and mitigation."
```

Store results as RISK_RESULT.

### context-purifier Lane (complexity >= 7 only)
```
Task tool:
  description: "Lane: Context purification"
  prompt: "Distill this prompt to its essential elements without changing intent.\n\nOriginal prompt: $USER_PROMPT\n\nReturn reduced prompt candidate plus preserved constraints."
```

Store results as PURIFIER_RESULT.

## Clarification Gate

Build the clarification list from:
- ANALYSIS_RESULT findings
- Lane agent findings

**Interactive mode:**
- Ask only unresolved, execution-blocking questions
- After each answer, patch via Task tool:
```
Task tool:
  description: "Patch clarification log"
  prompt: "Run the session-patch tool.\n- sessionFilePath: absolute path\n- section: '## Clarification Log'\n- newContent: [question + answer]"
```

**CI-safe fallback:**
- If `CI=true` or no interactive flow, skip questions
- Patch `## Deferred Items` with `unverified — review recommended`

## Final Assembly

### Step 1: Repackage via Task tool (builder)
```
Task tool:
  description: "Final assembly: Repackage enhanced prompt"
  prompt: "Synthesize all inputs into the enhanced prompt payload.\n\nOriginal: $USER_PROMPT\nSkim: $SKIM_RESULT\nAnalysis: $ANALYSIS_RESULT\nLanes: $LANE_RESULTS\nClarifications: $CLARIFICATIONS\n\nRequired output format:\n---\nenhanced_prompt_version: 1\nsource_mode: auto|enhance|repack|audit\nlanes_executed: []\nclarifications_resolved: 0\nconfidence_score: 0.0\ncontext_budget_at_start: 100\ncontext_budget_at_end: 100\n---\n\n<enhanced_prompt>Rewrite with clearer scope, verified references, preserved intent.</enhanced_prompt>\n\n<what_happened_so_far>Summary of phases ran.</what_happened_so_far>\n\n<identified_risks>Confirmed risks and mitigations.</identified_risks>\n\n<task_list>Active tasks in execution order.</task_list>\n\n<deferred_items>Unresolved or deferred items.</deferred_items>"
```

Store results as REPACKAGE_RESULT.

### Step 2: Patch Final Sections via Task tool (builder)

For each section (`## Final Output`, `## Identified Risks`, `## Task List`, `## Deferred Items`):

```
Task tool:
  description: "Patch final section: [section name]"
  prompt: "Run the session-patch tool.\n- sessionFilePath: absolute path to .hivemind/state/session-context-prompt.md\n- section: '[section heading]'\n- newContent: [content from repackager]"
```

## Report

Return to user:
```markdown
## HIVEFIVER COMPLETE

**Request:** prompt-enhance
**Status:** DONE
**Session file:** .hivemind/state/session-context-prompt.md

### Enhanced Prompt
[content from REPACKAGE_RESULT]

### Next Steps
[how to use the enhanced prompt]
```
