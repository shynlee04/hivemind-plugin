# Stack Workflow — Multi-Skill Composition

## Objective
Stack 2-3 skills together for a specific workflow. Validate compatibility, set loading order, produce stacked skill config.

## Execution Flow

### Step 1: Load Project State
```bash
# Check existing skills
ls .opencode/skills/ 2>/dev/null
ls .skills-lab/active/refactoring-skills/ 2>/dev/null

# Check git state
git status --short
git log --oneline -3
```

### Step 2: Parse the Stack Request
Extract from user request:
- **Which skills?** (names or descriptions)
- **For what purpose?** (the workflow they enable together)
- **Any constraints?** (loading order, exclusions)

### Step 3: Validate Compatibility
For each skill in the proposed stack:
- [ ] Skill exists (check .opencode/skills/ or .skills-lab/)
- [ ] Skill is standalone (doesn't require other skills to function)
- [ ] No circular dependencies
- [ ] Max 3 skills total

### Step 4: Determine Loading Order
Skills load in dependency order:
1. Background skills first (opencode-platform-reference, repomix-exploration-guide, opencode-non-interactive-shell)
2. Routing skills (meta-builder)
3. Intent skills (user-intent-interactive-loop)
4. Planning skills (planning-with-files)
5. Coordination skills (coordinating-loop)
6. Domain execution skills (use-authoring-skills, agents-and-subagents-dev, etc.)

### Step 5: Produce Stack Config
```markdown
## SKILL STACK

**Purpose:** <what this stack enables>

**Loading Order:**
1. <skill-1> — <why first>
2. <skill-2> — <why second>
3. <skill-3> — <why third>

**Why Each is Needed:**
- <skill-1>: <specific reason>
- <skill-2>: <specific reason>
- <skill-3>: <specific reason>

**Total Context Impact:** ~<estimate>% of context window
```

### Step 6: Return Structured Result
Return the stack config to the orchestrator.
