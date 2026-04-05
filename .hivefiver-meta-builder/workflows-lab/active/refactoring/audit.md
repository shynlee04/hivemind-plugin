# Audit Workflow — Meta-Concept Quality Check

## Objective
Scan existing meta-concepts (skills, agents, commands) for quality issues, overlaps, dead references, and trigger phrase coverage. Produce findings report.

## Execution Flow

### Step 1: Load Project State
```bash
# Check existing meta-concepts
ls .opencode/agents/ 2>/dev/null
ls .opencode/commands/ 2>/dev/null
ls .opencode/skills/ 2>/dev/null

# Check git state
git status --short
git log --oneline -3
```

### Step 2: Determine Scope
- If user specified specific meta-concepts → audit only those
- If user said "all" or didn't specify → scan everything

### Step 3: Run Validators
For each meta-concept type:

**Skills:**
```bash
# Check for trigger phrases in descriptions
grep -l "use when\|triggers on" .opencode/skills/*/SKILL.md 2>/dev/null

# Check for dead references
for skill in .opencode/skills/*/; do
  grep -o "references/[^ ]*" "$skill/SKILL.md" 2>/dev/null | while read ref; do
    [ -f "$skill/$ref" ] || echo "DEAD REF: $skill/$ref"
  done
done

# Check for stub scripts
grep -l "exit 0" .opencode/skills/*/scripts/*.sh 2>/dev/null
```

**Agents:**
```bash
# Check for execution flows
grep -l "Execution Flow\|Workflow\|Steps" .opencode/agents/*.md 2>/dev/null

# Check for permission leaks
grep '"\*": allow' .opencode/agents/*.md 2>/dev/null

# Check for output contracts
grep -l "Output Contract" .opencode/agents/*.md 2>/dev/null
```

**Commands:**
```bash
# Check for banned commands
grep -il "vim\|nano\|less\|more" .opencode/commands/*.md 2>/dev/null

# Check for $ARGUMENTS usage
grep -L '\$ARGUMENTS' .opencode/commands/*.md 2>/dev/null

# Check for agent references
for cmd in .opencode/commands/*.md; do
  agent=$(grep "^agent:" "$cmd" | awk '{print $2}')
  [ -f ".opencode/agents/$agent.md" ] || echo "MISSING AGENT: $agent in $cmd"
done
```

### Step 4: Detect Overlaps
```bash
# Check for near-identical content
for f1 in .opencode/agents/*.md; do
  for f2 in .opencode/agents/*.md; do
    [ "$f1" \< "$f2" ] || continue
    sim=$(diff "$f1" "$f2" | grep -c "^<" 2>/dev/null)
    total=$(wc -l < "$f1")
    if [ "$sim" -lt $((total / 5)) ]; then
      echo "NEAR-IDENTICAL: $f1 and $f2"
    fi
  done
done
```

### Step 5: Generate Report
```markdown
## AUDIT REPORT

### Skills
- Total: N
- With trigger phrases: N/N
- With dead references: N
- With stub scripts: N

### Agents
- Total: N
- With execution flows: N/N
- With permission leaks: N
- With output contracts: N/N

### Commands
- Total: N
- With banned commands: N
- Missing $ARGUMENTS: N
- Missing agent references: N

### Overlaps Detected
- [list of near-identical files]

### Recommendations
- [prioritized list of fixes]
```

### Step 6: Return Structured Result
Return the audit report to the orchestrator.
