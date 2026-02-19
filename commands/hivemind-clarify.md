---
name: "hivemind-clarify"
description: "Context Clarification Command - For low-confidence scenarios (<80% confidence). Loads relevant skills, gathers context, and presents structured clarification questions."
---

# HiveMind Context Clarification Command

**Use this command when the agent is unsure about your intent or lacks sufficient context.**

---

## When to Use

Run `/hivemind-clarify` when:

| Scenario | Confidence | Command |
|----------|------------|---------|
| Agent is unsure about your intent | < 80% | ✅ Use `/hivemind-clarify` |
| Agent needs more context | 80-95% | Consider `/hivemind-clarify` |
| Agent is confident | 95%+ | Proceed normally |

---

## What It Does

1. **Loads relevant skills** automatically (e.g., requirements-clarity)
2. **Gathers context** from your last session
3. **Presents structured clarification questions** in yes/no format
4. **Saves clarified context** to memory for future sessions

---

## Example Usage

### Scenario 1: Unclear Intent

**User**: "Fix the bug"

**Agent**: (confidence < 80%) → "I'm unsure which bug you're referring to. Run `/hivemind-clarify` for structured clarification."

**After `/hivemind-clarify`**:
```
## Clarification Questions

1. Is this about the authentication bug or the UI bug?
   - [ ] Authentication bug
   - [ ] UI bug
   - [ ] Not sure, describe it

2. Which file or component is affected?
   - [ ] src/auth.ts
   - [ ] src/components/Login.tsx
   - [ ] Other (describe)

3. What is the expected behavior?
   - [ ] Login should succeed
   - [ ] Login should fail with error
   - [ ] Other (describe)
```

### Scenario 2: Missing Context

**User**: "Update the dashboard"

**Agent**: (confidence 75%) → "I need more context about the dashboard. Run `/hivemind-clarify`."

**After `/hivemind-clarify`**:
```
## Context Retrieval

Last session trajectory: "Dashboard UI improvements"
Active tasks: 2 pending

## Clarification Questions

1. Is this about the same dashboard as last session?
   - [ ] Yes
   - [ ] No, different dashboard
   - [ ] Not sure

2. What specific changes do you want?
   - [ ] Add new metrics
   - [ ] Fix layout issues
   - [ ] Other (describe)
```

---

## Integration with Confidence Scoring

The command is automatically triggered when:

1. **First-turn detection** + low confidence (< 80%)
2. **Context incompleteness** detected (missing trajectory, tasks, mems)
3. **User message clarity** issues detected (short message, unclear intent)

---

## Configuration

The command can be customized via `.hivemind/config.json`:

```json
{
  "clarification": {
    "enabled": true,
    "max_questions": 5,
    "auto_load_skills": true,
    "save_to_memory": true
  }
}
```

---

## Related Commands

| Command | Purpose |
|---------|---------|
| `/hivemind-context` | Display current context state |
| `/hivemind-pre-stop` | Validate context before stopping |
| `/hivemind-scan` | Scan hierarchy and detect drift |

---

## Technical Details

**Hook Integration**:  
- `calculateContextConfidence()` → confidence score  
- `getContextAction()` → "clarify" action  
- `session.command()` → load skills  
- `session.shell()` → gather context  

**Files Modified**:  
- `.hivemind/knowledgebase/clarification-records.jsonl` - Log of clarification sessions

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Command not found | Run `skills add https://github.com/softaworks/agent-toolkit --skill requirements-clarity` |
| Low confidence persists | Provide more specific instructions |
| Questions repeat | Use `map_context` to update hierarchy |

---

*Created: 2026-02-16 | Version: 1.0.0*
