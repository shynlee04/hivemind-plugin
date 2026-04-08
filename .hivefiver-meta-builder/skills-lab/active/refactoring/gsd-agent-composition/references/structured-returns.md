# Structured Returns

Every GSD agent returns a deterministic format to its orchestrator. Free-form text is forbidden — the orchestrator parses these returns to decide next actions, present status to users, and chain to downstream agents.

## Why Structured Returns Matter

The orchestrator is a state machine. It reads the agent's return format to decide:
- **Did the agent succeed?** → Check status counts
- **Should I chain to another agent?** → Check for ESCALATE items
- **What do I show the user?** → Extract the formatted section
- **Can I auto-advance?** → Check if checkpoint or complete

Without structured returns, the orchestrator can't parse results. The agent might have done great work, but if it returns prose instead of the expected format, the chain breaks.

## Return Format Catalog

### SECURED / OPEN_THREATS / ESCALATE

**Used by:** gsd-security-auditor

**When to use each:**

| Format | Condition | Trigger |
|--------|-----------|---------|
| SECURED | All threats closed | `threats_closed == total` |
| OPEN_THREATS | Some threats remain | `0 < threats_closed < total` |
| ESCALATE | Zero threats closed | `threats_closed == 0` |

**SECURED template:**
```markdown
## SECURED

**Phase:** {N} — {name}
**Threats Closed:** {count}/{total}
**ASVS Level:** {1/2/3}

### Threat Verification
| Threat ID | Category | Disposition | Evidence |
|-----------|----------|-------------|----------|
| {id} | {category} | {mitigate/accept/transfer} | {file:line or doc reference} |

### Unregistered Flags
{none / list from SUMMARY.md ## Threat Flags with no threat mapping}

SECURITY.md: {path}
```

**OPEN_THREATS template:**
```markdown
## OPEN_THREATS

**Phase:** {N} — {name}
**Closed:** {M}/{total} | **Open:** {K}/{total}
**ASVS Level:** {1/2/3}

### Closed
| Threat ID | Category | Disposition | Evidence |
|-----------|----------|-------------|----------|
| {id} | {category} | {disposition} | {evidence} |

### Open
| Threat ID | Category | Mitigation Expected | Files Searched |
|-----------|----------|---------------------|----------------|
| {id} | {category} | {pattern not found} | {file paths} |

Next: Implement mitigations or document as accepted in SECURITY.md
accepted risks log, then re-run /gsd-secure-phase.

SECURITY.md: {path}
```

**Composition rule:** When designing an audit agent, use this 3-format pattern when the agent has a clear pass/fail metric with partial success possible.

---

### GAPS FILLED / PARTIAL / ESCALATE

**Used by:** gsd-nyquist-auditor

**When to use each:**

| Format | Condition | Trigger |
|--------|-----------|---------|
| GAPS FILLED | All gaps resolved | `resolved == total` |
| PARTIAL | Some gaps resolved, some escalated | `0 < resolved < total` |
| ESCALATE | All gaps escalated | `resolved == 0` |

**GAPS FILLED template:**
```markdown
## GAPS FILLED

**Phase:** {N} — {name}
**Resolved:** {count}/{count}

### Tests Created
| # | File | Type | Command |
|---|------|------|---------|
| 1 | {path} | {unit/integration/smoke} | `{cmd}` |

### Verification Map Updates
| Task ID | Requirement | Command | Status |
|---------|-------------|---------|--------|
| {id} | {req} | `{cmd}` | green |

### Files for Commit
{test file paths}
```

**Composition rule:** Use this pattern when the agent fills individual gaps (tests, missing items) and each gap can be independently resolved or escalated.

---

### CHECKPOINT REACHED

**Used by:** gsd-executor

**Sub-types:**

| Type | Percentage | When |
|------|------------|------|
| `checkpoint:human-verify` | 90% | Visual/functional verification after automation |
| `checkpoint:decision` | 9% | Implementation choice needed |
| `checkpoint:human-action` | 1% | Unavoidable manual step (email link, 2FA) |

**Template:**
```markdown
## CHECKPOINT REACHED

**Type:** [human-verify | decision | human-action]
**Plan:** {phase}-{plan}
**Progress:** {completed}/{total} tasks complete

### Completed Tasks
| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | [name] | [hash] | [files] |

### Current Task
**Task {N}:** [name]
**Status:** [blocked | awaiting verification | awaiting decision]
**Blocked by:** [specific blocker]

### Checkpoint Details
[type-specific content]

### Awaiting
[what user needs to do/provide]
```

**Composition rule:** Use this pattern for any agent that pauses mid-execution for human input. The completed tasks table is critical — it gives the continuation agent context without re-reading history.

---

### VERIFIED / FAILED / UNCERTAIN (Per-Truth Status)

**Used by:** gsd-verifier

**Not a single return format** — instead, each observable truth gets a status:

| Status | Meaning | Supporting Condition |
|--------|---------|---------------------|
| ✓ VERIFIED | All supporting artifacts pass all checks | Exists + Substantive + Wired + (optional) Flowing |
| ✗ FAILED | One or more artifacts missing/stub/unwired | Any check fails |
| ? UNCERTAIN | Can't verify programmatically | Needs human judgment |

**Output:** VERIFICATION.md with frontmatter + body:

```markdown
---
phase: {N}
goal: "{phase goal from ROADMAP.md}"
verified: {count}
failed: {count}
uncertain: {count}
gaps:
  - truth: "{failed truth}"
    level: {exists/substantive/wired/data-flows}
    reason: "{why it failed}"
---

# Phase {N} Verification

## Truth 1: {truth}
**Status:** ✓ VERIFIED
**Evidence:** {file paths, grep results}

## Truth 2: {truth}
**Status:** ✗ FAILED
**Gap:** {what's missing}
```

**Composition rule:** Use this pattern for verification agents that check multiple independent truths. Each truth is verified at up to 4 levels (exists, substantive, wired, data-flows).

---

## Designing a New Return Format

When creating a new agent type, follow this recipe:

1. **Identify the outcome states** — What are the possible results? (All done / Partially done / Blocked / Escalated)
2. **Name each state** — Use UPPERCASE for machine-parseable section headers
3. **Define the data shape** — What tables, counts, and paths does each state need?
4. **Keep it flat** — No nested sections beyond 2 levels. Orchestrators parse these with grep.
5. **Include file paths** — Every return should list the files produced or modified

### Anti-Patterns

| Anti-Pattern | Why It Breaks | Fix |
|-------------|--------------|-----|
| Prose summary instead of tables | Orchestrator can't parse counts | Use markdown tables with consistent columns |
| No file paths listed | Downstream agents can't find artifacts | Always include `{file}: {path}` lines |
| Mixed case headers | Grep patterns fail | Use UPPERCASE for section headers |
| Variable column counts | Table parsing breaks | Keep columns consistent across all states |
| No total count | Can't calculate completion % | Always include `{done}/{total}` format |

## Return Format Selection Guide

| Agent Purpose | Return Pattern | Why |
|--------------|----------------|-----|
| Audit/Verify | SECURED/OPEN/ESCALATE or GAPS FILLED/PARTIAL/ESCALATE | Binary outcome with partial success |
| Execute with pauses | CHECKPOINT REACHED | Needs human input mid-flow |
| Verify goals | VERIFIED/FAILED/UNCERTAIN per truth | Multiple independent checks |
| Research/Plan | Structured findings + recommendations | Informational, pass/fail doesn't apply |
| Document | Confirmation + file paths | Simple success with output location |
