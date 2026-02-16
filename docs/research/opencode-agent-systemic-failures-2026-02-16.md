# Deep Research: OpenCode Agent Systemic Failures & Solutions

**Research Date:** 2026-02-16
**Researcher:** HiveMind Governance System
**Scope:** Fix delegation quality, build hallucinations, scanner/explore usage, .hivemind tracking, context-before-actions

---

## Executive Summary

After deep investigation using skills discovery, OpenCode configuration analysis, .hivemind state inspection, and sub-agent pattern research, I've identified **5 systemic failure categories** with **12 specific issues** and **research-backed solutions**.

### Critical Findings

| Failure Category | Issues Found | Root Cause | Solution Confidence |
|-----------------|--------------|------------|-------------------|
| **Delegation Quality** | 3 | Vague prompts, no verification, no export_cycle | HIGH |
| **Build Hallucinations** | 2 | No MCP tool access, wrong skill paths | HIGH |
| **Scanner/Explore Usage** | 3 | Never launched, poor tool configs, no context | HIGH |
| **.hivemind Tracking** | 2 | cycle_log exists but not read, no validation | MEDIUM |
| **Context-Before-Actions** | 2 | No mandatory read-first enforcement, no brownfield protocol | HIGH |

---

## 1. Delegation Quality Issues

### Issue 1.1: Vague Sub-Agent Prompts
**Evidence:** Previous build agent tasks had generic prompts like "Fix the agents"
**Impact:** Sub-agents guess context, return partial or incorrect results
**Research Finding:** [sub-agent-patterns skill] - "Specific task, file context, verification, return format required"

**Solution:**
```yaml
Required in EVERY Task dispatch:
1. Specific task - what exactly to do
2. File context - which files to read/modify (absolute paths)
3. Verification - test command, expected output
4. Return format - outcome + findings + files changed
```

### Issue 1.2: No export_cycle After Sub-Agent Returns
**Evidence:** brain.json cycle_log shows entries but no structured export
**Impact:** Intelligence lost on compaction, decisions re-made
**Research Finding:** [delegation-intelligence skill] - "After EVERY subagent returns — mandatory export_cycle"

**Solution:**
```typescript
// Mandatory after Task tool returns:
export_cycle({
  outcome: "success" | "partial" | "failure",
  findings: "What was learned (1-3 sentences)"
})
```

### Issue 1.3: No Verification of Sub-Agent Claims
**Evidence:** No verification commands run before accepting "done"
**Impact:** Build hallucinations accepted as truth
**Research Finding:** [evidence-discipline skill] - "Never claim, always prove"

**Solution:**
```bash
# Before claiming completion from sub-agent:
npx tsc --noEmit      # Type check
npm test               # Unit tests
git diff --name-only   # Verify files changed
```

---

## 2. Build Hallucination Issues

### Issue 2.1: Inconsistent MCP Tool Access
**Evidence:** scanner.md and explore.md had limited tools vs opencode.json
**Impact:** Agents can't research, use stale knowledge
**Research Finding:** [sub-agent-patterns] - "To access MCP tools, omit tools field entirely OR list ALL including MCP"

**Solution Applied:**
- scanner.md: Added 15 MCP tools (context7_*, exa_*, tavily_*, zread_*, web-search-prime)
- build.md: Already had comprehensive tools
- code-review.md: Added all MCP tools to frontmatter

### Issue 2.2: Wrong Skill Paths
**Evidence:** build.md referenced `~/.agents/skills/*` but project uses `.opencode/skills/*`
**Impact:** Skills not found, agents work without guidance
**Solution Applied:** Fixed all skill paths to `.opencode/skills/*`

---

## 3. Scanner/Explore Usage Issues

### Issue 3.1: Agents Never Actually Launched
**Evidence:** No Task() calls with scanner/explore in cycle_log
**Impact:** Deep investigation skipped, surface-level fixes only
**Root Cause:** Main agent tries to do everything itself

**Solution:**
```typescript
// BEFORE any implementation:
Task({
  subagent_type: "scanner",
  description: "Deep investigation",
  prompt: "Investigate [specific area]. Report: findings + files + recommendations"
})

// For quick exploration:
Task({
  subagent_type: "explore",
  description: "Quick codebase scan",
  prompt: "Find all files related to [topic]. Return file list + key locations"
})
```

### Issue 3.2: Poor Tool Configuration
**Evidence:** explore.md only had read/glob/grep/bash - no web research
**Impact:** Can't verify external documentation
**Solution Applied:** Added webfetch/websearch to explore agent

### Issue 3.3: No Context-Integrity Skill
**Evidence:** Agents missing context-integrity skill
**Impact:** Can't detect/repair context drift
**Solution Applied:** Added to all agent skill tables

---

## 4. .hivemind Tracking Issues

### Issue 4.1: cycle_log Exists But Not Read Back
**Evidence:** brain.json has cycle_log array with 3 entries, but hierarchy doesn't reflect outcomes
**Impact:** Decisions made without learning from past cycles
**Research Finding:** [delegation-intelligence] - "export_cycle builds persistent intelligence"

**Current State:**
```json
{
  "cycle_log": [
    {"timestamp": 1771211967292, "tool": "task", "output_excerpt": "...", "failure_detected": false},
    {"timestamp": 1771212004904, "tool": "task", "output_excerpt": "...", "failure_detected": false},
    {"timestamp": 1771212303105, "tool": "task", "output_excerpt": "...", "failure_detected": true}
  ]
}
```

**Problem:** Last entry shows `failure_detected: true` but no acknowledgment in hierarchy!

### Issue 4.2: No Validation Chain
**Evidence:** No `validate chain` commands in recent history
**Impact:** Inconsistent state not detected
**Solution:** Add to every agent's verification protocol

---

## 5. Context-Before-Actions Issues

### Issue 5.1: No Mandatory Read-First Enforcement
**Evidence:** Writes happen without reads (write_without_read_count: 0 is misleading)
**Impact:** Action without understanding, broken code
**Research Finding:** [sub-agent-patterns] - "Context Hygiene: Use agents for workflows you repeat"

**Solution:** Add to ALL agent prompts:
```markdown
## ⛔ CRITICAL: CONTEXT BEFORE ACTIONS

**You MUST read before writing:**
1. Read relevant files first (use read tool)
2. Understand existing patterns
3. Then make changes

**Violation:** Writing without reading causes broken code and rework.
```

### Issue 5.2: No Brownfield Protocol
**Evidence:** No hivemind-scan run before major changes
**Impact:** Context poisoning, stale files used
**Solution:** Enforce in ALL agents:
```markdown
## Brownfield Protocol (MANDATORY)

Before ANY changes:
1. Run: scan_hierarchy({ action: "analyze" })
2. Check for stale context signals
3. Run: recall_mems({ query: "[topic]" })
4. Only then proceed with changes
```

---

## Research-Based Best Practices (From sub-agent-patterns Skill)

### A. Context Hygiene Principle
**Key Insight:** "The primary value of sub-agents isn't specialization—it's keeping your main context clean."

**Math:**
- Without agent: 500+ lines per workflow in main context
- With agent: ~50 lines (summary only)
- Over 10 workflows: 5000 vs 500 lines = 90% savings

### B. Tool Access Patterns
| Agent Type | Recommended Tools | Notes |
|-----------|------------------|-------|
| Read-only reviewers | Read, Grep, Glob, LS | No write capability |
| File creators | Read, Write, Edit, Glob, Grep | ⚠️ No Bash - avoids approval spam |
| Script runners | Read, Write, Edit, Glob, Grep, Bash | Use when CLI execution needed |
| Research agents | Read, Grep, Glob, WebFetch, WebSearch | Read-only external access |
| Orchestrators | Read, Grep, Glob, Task | Minimal tools, delegates to specialists |

### C. Model Selection Strategy
**Quality-First Approach:**
- **Sonnet:** Default for most agents (quality matters)
- **Opus:** Creative work, complex reasoning
- **Haiku:** Only simple script execution

**Evidence:** Haiku produces wrong patterns, missing CSS, incorrect values. Sonnet is worth the cost.

### D. Avoiding Bash Approval Spam
**Root Cause:** Models default to bash for file ops (training bias)

**Solutions (in order):**
1. Remove Bash from tools list if not needed
2. Put critical instructions FIRST (right after frontmatter)
3. Remove contradictory instructions (don't say "use Write" then show bash examples)

### E. Prompt Template (5-Step Structure)
```markdown
For each [item]:
1. Read [source file/data]
2. Verify with [external check]
3. Check [authoritative source]
4. Evaluate/score
5. FIX issues found ← Critical: gives agent authority to act
```

### F. Batch Sizing
| Batch Size | Use When |
|-----------|----------|
| 3-5 items | Complex tasks (deep research, multi-step fixes) |
| 5-8 items | Standard tasks (audits, updates, validations) |
| 8-12 items | Simple tasks (version checks, format fixes) |

### G. Orchestration Patterns
```
orchestrator agent:
  ├─ Task(code-reviewer) → Reviews code quality
  ├─ Task(security-auditor) → Checks vulnerabilities
  ├─ Task(performance-analyzer) → Identifies bottlenecks
  └─ Synthesizes findings into actionable report
```

**Max depth:** 2 levels. Beyond that, context gets thin.

---

## Implementation Plan

### Phase 1: Fix Agent Configurations (COMPLETED ✓)
- [x] scanner.md - Added 15 MCP tools
- [x] build.md - Fixed skill paths, added context-integrity
- [x] code-review.md - Added model to frontmatter, MCP tools
- [x] explore.md - Enhanced tools (needs web research)

### Phase 2: Add Enforcement Mechanisms (NEXT)
- [ ] Add "Context Before Actions" to ALL agent prompts
- [ ] Add brownfield protocol enforcement
- [ ] Add verification requirements to build agent
- [ ] Add export_cycle templates

### Phase 3: Create Orchestrator Agent (FUTURE)
- [ ] Master orchestrator for complex workflows
- [ ] Automatic scanner/explore launching
- [ ] Results synthesis and validation

### Phase 4: Validation & Testing (ONGOING)
- [ ] Test each agent with specific tasks
- [ ] Verify export_cycle captures intelligence
- [ ] Confirm context-before-actions discipline

---

## Verification Commands

```bash
# Check agent configurations are valid
cat .opencode/agents/scanner.md | head -35
cat .opencode/agents/build.md | grep -A 20 "Key Skills"
cat .opencode/agents/code-review.md | head -35

# Verify .hivemind tracking
node bin/hivemind-tools.cjs state hierarchy
node bin/hivemind-tools.cjs validate chain
recall_mems({ shelf: "cycle-intel" })

# Test delegation quality
# Dispatch scanner with specific task, verify export_cycle called
```

---

## Open Questions

1. **Explore Agent Model:** Currently uses zai-coding-plan/glm-4.7 - is this optimal for exploration?
2. **Batch Size:** Should we default to 5-8 items per agent for this project's complexity?
3. **Orchestrator:** Do we need a dedicated orchestrator agent or improve main agent patterns?

---

## Sources

### Primary (HIGH confidence)
- **sub-agent-patterns skill** (jezweb/claude-skills) - Official patterns from 2026-02-02
- **delegation-intelligence skill** - Project-specific delegation guidance
- **evidence-discipline skill** - Verification protocols
- **opencode.json** - Actual configuration
- **.hivemind/state/** - Real tracking data

### Secondary (MEDIUM confidence)
- Agent markdown files in .opencode/agents/
- Session lifecycle hook implementation
- Brain.json cycle_log analysis

---

## Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Delegation patterns | HIGH | Based on sub-agent-patterns skill with 374 installs |
| Tool configurations | HIGH | Verified against opencode.json |
| MCP tool access | HIGH | Official OpenCode documentation |
| Context hygiene | HIGH | Claude Code official best practices |
| .hivemind tracking | MEDIUM | Partial implementation, needs more validation |

---

**Next Action:** Implement Phase 2 enforcement mechanisms across all agents
