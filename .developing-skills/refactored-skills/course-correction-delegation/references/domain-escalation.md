# Domain-Specific Escalation

## Purpose

Handle transitions between domain-specific delegation modes when one domain discovers it needs another.

## Escalation Patterns

### Debug → Refactor

**Trigger:** Debug reveals the bug is a structural problem, not a logic error.

**Protocol:**
1. Debug child returns `status: "blocked"` with `escalation_target: "refactor"`
2. Debug findings become refactor assessment input
3. Refactor delegation starts from `assess` phase
4. Debug evidence is preserved in refactor packet

### Audit → Refactor

**Trigger:** Audit identifies actionable structural issues.

**Protocol:**
1. Audit child completes `recommend` phase
2. Each recommendation becomes a refactor task
3. Refactor delegation starts from `plan` phase
4. Audit evidence is referenced in refactor packet

### Refactor → Debug

**Trigger:** Refactor breaks existing behavior.

**Protocol:**
1. Refactor child stops at `execute` phase failure
2. Test output identifies what broke
3. Debug delegation starts from `reproduce` phase
4. Fix the break before resuming refactor

### Any → Research

**Trigger:** Domain needs external pattern references or documentation.

**Protocol:**
1. Current domain child returns with `escalation_target: "research"`
2. Research delegation collects required evidence
3. Research findings feed back into the domain's next phase

### Any → User

**Trigger:** Domain escalation fails or requires business decision.

**Protocol:**
1. Domain child returns with evidence and unclear resolution path
2. Orchestrator presents evidence to user
3. Await user decision before proceeding

## Evidence Preservation

Domain transitions must NOT discard prior evidence. The new domain packet includes:
- Summary of prior domain findings
- Output paths to detailed evidence
- Specific context the new domain needs
