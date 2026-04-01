# Reviewer Dimensions

How to split code review across multiple reviewers or agents by dimension. Ensures no overlap, clear ownership, and efficient parallel review.

## Why Dimension-Based Review

Single-reviewer review misses issues because one person cannot be expert in all dimensions. Splitting by dimension:

- Each reviewer focuses on what they know best
- No duplicate findings across reviewers
- Faster total review time via parallelization
- Clearer accountability for finding quality

## Dimension Ownership

Each review dimension has exactly one owner. No overlaps. No shared ownership.

| Dimension | Responsibility | Selection Criteria |
|-----------|---------------|-------------------|
| **Correctness** | Logic, edge cases, error handling, state management | Agent with domain context, reads and runs tests |
| **Security** | Auth, input validation, secrets, injection, OWASP top 10 | Agent with security expertise or CVE scanning access |
| **Performance** | Complexity, memory, network, rendering, database queries | Agent with profiling context or benchmark access |
| **Readability** | Naming, style, comments, structure, cognitive load | Agent familiar with codebase conventions and style guide |
| **Architecture** | Layers, dependencies, interfaces, coupling, cohesion | Agent that read the full codebase and understands boundaries |
| **Testing** | Coverage, quality, isolation, regression, mock discipline | Agent that runs the test suite and reads test code |

## Ownership Rules

1. **One dimension, one owner.** If two agents review correctness, they produce conflicting findings and waste cycles on deduplication.
2. **No overlaps.** If agent A owns security, agent B must not flag injection issues. Transfer the finding to A and move on.
3. **Ownership transfers explicitly.** "I found a security issue" → hand it to the security owner with the finding, then continue your dimension.
4. **Owner makes the final call.** Within their dimension, the owner decides severity and whether the finding blocks merge. Other reviewers can suggest, but the owner decides.
5. **Cross-dimension findings go to the owner.** If a performance reviewer spots a security issue, it goes to the security owner. Don't grade outside your lane.

## Conflict Resolution

When reviewers disagree on a finding:

### Resolution Hierarchy

1. **Evidence first.** Both sides cite code, test output, or profiling data — not opinion.
2. **Run the test.** If the dispute is about correctness behavior, the test suite is the arbiter. If both agree the test passes, the behavior is preserved.
3. **Escalate if deadlocked.** If evidence is insufficient and disagreement persists, escalate to the orchestrator with both arguments clearly stated.

### Specific Scenarios

| Scenario | Resolution |
|----------|-----------|
| Disagree on severity within dimension | Owner decides — they have the context |
| Disagree across dimensions | Orchestrator arbitrates with both arguments |
| Finding spans two dimensions | Owner with stronger evidence takes it; other defers and moves on |
| Both claim ownership of a finding | Orchestrator assigns based on who has better evidence/context |
| Reviewer finds issue outside their dimension | Transfer to dimension owner; don't grade outside your lane |
| No clear owner for finding | Orchestrator assigns; if recurring, create new dimension |

## Multi-Agent Dispatch

### Dispatch Configuration

```
Orchestrator (synthesis)
  ├── Agent A → Correctness + Testing
  ├── Agent B → Security + Performance
  └── Agent C → Readability + Architecture
```

### Dispatch Rules

1. **Max 3 agents per review.** More than 3 introduces coordination overhead that exceeds review value. Time spent coordinating > time saved by specialization.
2. **Pair dimensions by evidence type.** Correctness pairs with testing (both need test output). Security pairs with performance (both need profiling/audit context). Readability pairs with architecture (both need code reading).
3. **Each agent runs independently.** No shared state. No cross-talk during review. Each agent reads the code, runs its checks, and returns findings.
4. **Synthesis is the orchestrator's job.** After all agents return, the orchestrator collects findings, deduplicates across dimensions, calibrates severity, and produces the final review report.
5. **Sequential if dependencies exist.** If correctness findings might change architecture assessment, run correctness first, then architecture with the correctness context.

### Agent Selection Criteria

When dispatching agents, match capability to dimension requirements:

| Need | Agent Trait |
|------|------------|
| Test-based validation | Agent that can run `npm test`, read test output |
| Security scanning | Agent with dependency audit, CVE context |
| Performance profiling | Agent with profiling tool or benchmark access |
| Architecture judgment | Agent that has read the full codebase, not just the diff |
| Style enforcement | Agent with linter config and convention context |
| Test quality review | Agent that reads test code, not just runs it |

### Dispatch Packet

Each dispatched agent receives:

```markdown
## Review Dispatch

**Dimension:** {correctness | security | performance | readability | architecture | testing}
**Scope:** {files and functions to review}
**Context:** {what was refactored and why}
**Contract Tests:** {tests that must stay green}

**Expected Return:**
- findings: [{location, severity, observation, suggestion, evidence}]
- summary: one-sentence assessment
- status: pass | fail | needs-escalation
```

### Return Contract

Each review agent returns structured findings:

```json
{
  "dimension": "security",
  "findings": [
    {
      "location": "src/api/users.ts:42",
      "severity": "P1",
      "observation": "User input passed directly to SQL query without parameterization",
      "suggestion": "Use parameterized query: db.query('SELECT * FROM users WHERE id = $1', [userId])",
      "evidence": "const result = await db.query(`SELECT * FROM users WHERE id = ${userId}`)"
    }
  ],
  "summary": "One SQL injection vulnerability found in user lookup",
  "status": "fail"
}
```

## Synthesis Process

After all agents return, the orchestrator:

1. **Collects** all findings from all agents
2. **Deduplicates** — same finding reported by multiple agents (shouldn't happen with strict ownership, but verify)
3. **Calibrates** — uses `severity-calibration.md` to set final severity
4. **Formats** — uses `review-comment-template.md` for structured output
5. **Reports** — single consolidated review with findings grouped by severity

## Anti-Patterns

| Anti-Pattern | Why It Fails |
|-------------|-------------|
| **All agents reviewing everything** | 3× the noise, 0× the depth. Conflicting findings everywhere. |
| **Agents arguing across dimensions** | Each agent owns their lane. Stay in it. Transfer findings, don't debate. |
| **Skipping synthesis** | Individual findings without deduplication produce conflicting reports to the author. |
| **Uneven dimension coverage** | 2 agents on readability + 0 on security = critical blind spot. |
| **Reviewer becoming author** | Reviewer identifies problems. Author fixes them. One-line typo fixes are the exception. |
| **Dimension ownership as silos** | Transfer findings across dimensions. Don't ignore issues because "it's not my dimension." |
