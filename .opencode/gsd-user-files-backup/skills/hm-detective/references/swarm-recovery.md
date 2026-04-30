# Swarm Recovery

5-agent parallel protocol for context recovery after session loss, context compaction, or interruption.

---

## When to Use Swarm Recovery

| Trigger | Action |
|---------|--------|
| Context compaction occurred | Run full 5-agent swarm |
| Session resumed after interruption | Run full 5-agent swarm |
| Agent reports "context is full" | Run full 5-agent swarm |
| You don't know what was done in prior turns | Run full 5-agent swarm |
| Minor context loss (< 20%) | Read .tech-registry.json + git log only |

---

## The 5-Agent Swarm

Dispatch all 5 agents in parallel. Each returns max 100 lines.

### Agent 1: TOC Agent

**Task**: Read heading structures → section map with line ranges.

**Prompt Envelope**:
```
You are the TOC Agent. Your task: Build a section map of the codebase.

## Scope
- Search for heading patterns: ## headings in .md files, export statements in .ts files
- Focus on: src/ directory and all .md planning files

## Expected Output
A table with columns: File | Section | Line Range | Purpose
Max 100 lines total.

## Verification
grep -c "^## " on each .md file → count matches your sections
```

### Agent 2: Metadata Agent

**Task**: Read all frontmatter → status, key_files, commits.

**Prompt Envelope**:
```
You are the Metadata Agent. Your task: Extract frontmatter from all planning documents.

## Scope
- All .md files in .planning/, .opencode/, and root level
- Read only between --- markers (offset=1, limit=15 per file)

## Expected Output
A table with columns: File | name | status | key_files | last_commit
Max 100 lines total.

## Verification
Count files processed matches glob "**/*.md" in scope directories
```

### Agent 3: Git Agent

**Task**: git log --oneline -20, git diff --stat HEAD~5 → timeline.

**Prompt Envelope**:
```
You are the Git Agent. Your task: Build a timeline of recent changes.

## Commands to Run
1. git log --oneline -20
2. git diff --stat HEAD~5
3. git status --short

## Expected Output
1. Last 20 commits (hash + message)
2. Files changed in last 5 commits with line counts
3. Current working tree status (modified, untracked, staged)
Max 100 lines total.

## Verification
git log --oneline -20 | wc -l → should be 20 (or fewer if repo is new)
```

### Agent 4: Diff Agent

**Task**: Read diffs for changed files only → what changed.

**Prompt Envelope**:
```
You are the Diff Agent. Your task: Summarize what changed in recent commits.

## Commands to Run
1. git diff HEAD~5 --name-only → list changed files
2. For each changed file: git diff HEAD~5 -- <file> | head -50

## Expected Output
Per changed file: File path | Lines added/removed | Summary of change
Max 100 lines total. Focus on src/ files only.

## Verification
Count of files matches git diff HEAD~5 --name-only | wc -l
```

### Agent 5: Registry Agent

**Task**: Read .tech-registry.json → known tech stack.

**Prompt Envelope**:
```
You are the Registry Agent. Your task: Read and report the tech registry.

## Scope
- Read .tech-registry.json if it exists
- If it does NOT exist, run: ls src/ and identify language/framework from file extensions

## Expected Output
If registry exists: Full contents (it should be < 100 lines)
If registry missing: Inferred stack from file structure (language, framework, key modules)
Max 100 lines total.

## Verification
If registry exists: Validate JSON structure has "project", "stack", "modules" keys
```

---

## Merge Procedure

After all 5 agents return:

### Step 1: Collect Results

```
TOC Agent → toc-brief.md
Metadata Agent → metadata-brief.md
Git Agent → git-brief.md
Diff Agent → diff-brief.md
Registry Agent → registry-brief.md
```

### Step 2: Merge into Recovery Brief

Create a single `.scratch/recovery-brief-YYYY-MM-DD.md` with this structure:

```markdown
# Recovery Brief — YYYY-MM-DD

## Project State
[From Registry Agent: tech stack, known modules]

## Recent Changes
[From Git Agent + Diff Agent: timeline + what changed]

## Document Map
[From TOC Agent + Metadata Agent: section map + status of planning docs]

## What Was In Progress
[Infer from git status + metadata status fields]

## Gaps
[What the swarm could not determine]

## Next Actions
[Recommended next steps based on recovery state]
```

### Step 3: Validate Recovery

- [ ] All 5 agents returned results (or documented why they couldn't)
- [ ] Recovery brief is under 500 lines
- [ ] Gaps are explicitly documented
- [ ] Next actions are specific and actionable

### Step 4: Update Tech Registry

If the swarm discovered new information, append to `.tech-registry.json` (see tech-registry.md for schema).

---

## Case Study: Recovery After Context Compaction

**Scenario**: Agent was investigating a bug in lifecycle-manager.ts. Context was compacted at 70%. Agent lost all conversation history.

**Without Swarm**: Agent re-reads everything from scratch. Cost: ~2000 tokens × 5 files = 10,000 tokens. Still doesn't know what was already tried.

**With Swarm**:
1. TOC Agent: Maps src/lib/ structure → 12 files, identifies lifecycle-manager.ts as largest
2. Metadata Agent: Finds .planning/phase-3/PLAN.md with status "in-progress"
3. Git Agent: Shows 3 recent commits touching lifecycle-manager.ts
4. Diff Agent: Summarizes the 3 commits — added retry logic, fixed state transition
5. Registry Agent: Reads .tech-registry.json → confirms TypeScript, Node 20, vitest

**Cost**: 5 × 100 lines = 500 lines total. Full context restored at 5% of the naive cost.
