# Checkpoint Protocols

Checkpoints are pause/resume gates in agent execution. They let agents stop, report status, wait for human input, and be resumed by a fresh agent instance.

## Three Checkpoint Types

| Type | Frequency | When | User Action |
|------|-----------|------|-------------|
| `checkpoint:human-verify` | 90% | After automation completes | Visit URL, click UI, confirm behavior |
| `checkpoint:decision` | 9% | Implementation choice needed | Pick from options table |
| `checkpoint:human-action` | 1% | Truly unavoidable manual step | Provide secret, click email link, enter 2FA |

### Design Principle: Automation First

**Users NEVER run CLI commands.** Users ONLY visit URLs, click UI, evaluate visuals, provide secrets. The agent does ALL automation.

If a plan lacks server startup before a `checkpoint:human-verify`, the executor ADDS ONE as a deviation (Rule 3: fix blocking issue). The agent starts the dev server, then checkpoints for visual verification.

## Checkpoint Return Format

When an agent hits a checkpoint, it returns this structure:

```markdown
## CHECKPOINT REACHED

**Type:** [human-verify | decision | human-action]
**Plan:** {phase}-{plan}
**Progress:** {completed}/{total} tasks complete

### Completed Tasks
| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | [task name] | [hash] | [key files created/modified] |

### Current Task
**Task {N}:** [task name]
**Status:** [blocked | awaiting verification | awaiting decision]
**Blocked by:** [specific blocker]

### Checkpoint Details
[type-specific content]

### Awaiting
[what user needs to do/provide]
```

**Why the completed tasks table matters:** It gives the continuation agent full context without re-reading history. The commit hashes verify work was actually committed.

## Type-Specific Content

### checkpoint:human-verify

```markdown
### Checkpoint Details

**What was built:** [brief description]

**Verification steps:**
1. Visit `http://localhost:3000/dashboard`
2. Confirm user list displays with columns: Name, Email, Status
3. Click "Delete" on first user → confirm modal appears
4. Cancel modal → user still listed

### Awaiting
Visit the URL above and confirm the behavior matches expectations.
Reply "verified" or describe what looks wrong.
```

### checkpoint:decision

```markdown
### Checkpoint Details

**Decision:** Database ORM selection

**Options:**
| Option | Pros | Cons | Complexity |
|--------|------|------|------------|
| Prisma | Type-safe, migrations | Heavy runtime | Medium |
| Drizzle | Lightweight, SQL-like | Manual migrations | Low |
| Kysely | Type-safe queries | No schema gen | Medium |

**Recommendation:** Prisma (front-loaded by planner)

### Awaiting
Select an option. Reply with the option name or "use recommendation."
```

### checkpoint:human-action

```markdown
### Checkpoint Details

**Required action:** Email verification

The auth flow requires clicking a verification link sent to
test@example.com. No API workaround exists — the email service
blocks test mode.

### Awaiting
1. Check inbox for verification email
2. Click the verification link
3. Reply "done" when confirmed
```

## Auto-Mode Behavior

When `_auto_chain_active` or `workflow.auto_advance` is `"true"`:

| Checkpoint Type | Auto-Mode Behavior | Log Message |
|----------------|-------------------|-------------|
| `checkpoint:human-verify` | Auto-approve | `⚡ Auto-approved: [what was built]` |
| `checkpoint:decision` | Auto-select first option | `⚡ Auto-selected: [option name]` |
| `checkpoint:human-action` | **STOP** — cannot automate | Return checkpoint normally |

**Why human-action doesn't auto-approve:** Auth gates (email links, 2FA, OAuth) fundamentally require human action. No amount of automation bypasses them.

## Continuation Handling

When a fresh agent is spawned to continue after a checkpoint:

```xml
<continuation_handling>
If spawned as continuation agent (`<completed_tasks>` in prompt):

1. Verify previous commits exist: `git log --oneline -5`
2. DO NOT redo completed tasks
3. Start from resume point in prompt
4. Handle based on checkpoint type:
   - After human-action → verify it worked, continue
   - After human-verify → continue to next task
   - After decision → implement selected option
5. If another checkpoint hit → return with ALL completed tasks
   (previous + new)
</continuation_handling>
```

**Critical rule:** The continuation agent MUST verify previous commits exist before proceeding. This prevents continuation from a corrupted or rolled-back state.

## Authentication Gates

Auth errors during execution are **gates, not failures**:

**Indicators:** "Not authenticated", "Not logged in", "Unauthorized", "401", "403", "Please run {tool} login", "Set {ENV_VAR}"

**Protocol:**
1. Recognize it's an auth gate (not a bug)
2. STOP current task
3. Return checkpoint with type `human-action`
4. Provide exact auth steps (CLI commands, where to get keys)
5. Specify verification command

**In Summary:** Document auth gates as normal flow, not deviations.

## When to Include Checkpoint Protocols

| Agent Type | Needs Checkpoints? | Why |
|------------|-------------------|-----|
| Executor | Yes | Pauses for verification, decisions, auth |
| Planner | No | Fire-and-forget planning |
| Verifier | No | Full verification, no pauses |
| Nyquist Auditor | No | Runs tests, reports — no human input needed |
| Security Auditor | No | Checks code, writes report — no pauses |
| Doc Writer | No | Writes files, confirms — no pauses |

**Rule:** Only agents that execute implementation code need checkpoint protocols. Read-only and planning agents don't pause.
