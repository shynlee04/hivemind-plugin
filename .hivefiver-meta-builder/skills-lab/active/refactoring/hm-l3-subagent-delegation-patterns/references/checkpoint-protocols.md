# Checkpoint Protocols

Checkpoint types, return formats, and resume logic for subagent delegation.

## Checkpoint Types

| Type | Trigger | Action |
|------|---------|--------|
| `human-verify` | Output needs human confirmation | STOP, return checkpoint, await verification |
| `decision` | Multiple valid paths exist | STOP, return options, await selection |
| `human-action` | External action required (API key, auth, etc.) | STOP, list requirements, await action |
| `auto-resume` | Transient failure, safe to retry | Retry up to 3 times, then escalate |

## Checkpoint Return Format

When a checkpoint is reached, the subagent returns:

```markdown
## CHECKPOINT REACHED
**Type:** [human-verify | decision | human-action]
**Plan:** {phase}-{plan}
**Progress:** {completed}/{total} tasks

### Completed Tasks
| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1    | [name] | [hash] | [key files] |

### Current Task
**Task {N}:** [name]
**Status:** [blocked | awaiting verification | awaiting decision]
**Blocked by:** [specific blocker]

### Context Summary
[2-3 sentences summarizing what was done and what is needed to proceed]
```

## Resume Logic

### Detecting Resumable State

```bash
# Check for existing delegation
LAST_ID=$(cat .planning/phases/${PHASE}/.last-delegation-id 2>/dev/null)
if [ -n "$LAST_ID" ]; then
  # Verify the session is still valid
  # (Platform-specific: check task status, session existence)
  echo "Resuming task $LAST_ID"
else
  echo "No previous delegation found — starting fresh"
fi

# Check for incomplete checkpoints
grep -n "CHECKPOINT REACHED" .planning/phases/${PHASE}/SUMMARY.md 2>/dev/null
```

### Resume Decision Tree

```
Does a previous task_id exist?
├── NO → Start fresh delegation
├── YES → Is the task still running?
│   ├── YES → Poll for completion
│   └── NO → Did it complete successfully?
│       ├── YES → Absorb results, proceed
│       └── NO → Read error, decide: retry | new approach | escalate
```

## Auto-Fix Protocol

When a subagent hits an error (not a checkpoint):

1. **First failure** — Log error, retry same approach
2. **Second failure** — Log error, try alternative approach (different tool/library)
3. **Third failure** — STOP. Document in SUMMARY.md. Return DONE_WITH_CONCERNS or BLOCKED.

**Never silently retry more than 3 times.**

## Persistence Requirements

Every checkpoint MUST be persisted before the subagent returns:

```bash
# Write checkpoint to phase directory
cat << 'EOF' > .planning/phases/${PHASE}/checkpoints/${TASK_NUM}.md
## CHECKPOINT REACHED
**Type:** ${CHECKPOINT_TYPE}
**Task:** ${TASK_NAME}
**Status:** ${STATUS}
**Blocker:** ${BLOCKER}
EOF

# Update SUMMARY.md
echo "- Task ${TASK_NUM}: ${TASK_NAME} → ${STATUS}" >> .planning/phases/${PHASE}/SUMMARY.md
```

## Validation Checklist

- [ ] Checkpoint type is one of: human-verify, decision, human-action, auto-resume
- [ ] Progress fraction is accurate (completed / total)
- [ ] Completed tasks table includes commit hashes
- [ ] Blocker description is specific and actionable
- [ ] Context summary is under 3 sentences
- [ ] Checkpoint file is written before returning
