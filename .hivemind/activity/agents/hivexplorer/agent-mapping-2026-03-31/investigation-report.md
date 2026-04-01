---
created_at: "2026-03-31T00:00:00Z"
updated_at: "2026-03-31T00:00:00Z"
producer: hivexplorer
pass_id: agent-mapping-2026-03-31
investigation_scope: "Map all agent files in .opencode/agents/ to PROJECT.md skeleton"
---

# Agent Mapping Investigation Report

**Investigation Date:** 2026-03-31  
**Scope:** All agent files in `.opencode/agents/` (14 files)  
**Question:** Map actual agent files to the PROJECT.md skeleton structure for Agent Hierarchy, Actor-Consumer Model, and Agent Boundaries.

---

## Executive Summary

| Category | Count |
|----------|-------|
| Total Agents Found | 14 |
| Orchestrators | 1 |
| Specialists | 10 |
| Governance | 2 |
| Terminal (no delegation) | 5 |

---

## Agent Registry

### 1. Hiveminder — Primary Orchestrator

| Field | Value |
|-------|-------|
| **File Location** | `.opencode/agents/hiveminder.md:1-86` |
| **Role** | `orchestrator` |
| **Mode** | `primary` |
| **Line Reference** | Lines 1-86 |

**Responsibilities:**
- Accept user intent
- Plan execution
- Route bounded packets to specialist agents
- Verify delegated returns
- Cycle: INTAKE → PLAN → ROUTE → VERIFY → SYNTHESIZE → GATE → COMMIT

**CAN DO:**
- Task delegation to all specialist agents
- Read `.hivemind/**` artifacts
- Coordinate workflow between agents
- Web search for research

**MUST NOT DO:**
- Implement directly (line 61: "You do not plan, execute, implement, test, build, or read files")
- Write code in production files
- Plan directly (must route to hiveplanner)

**Delegates To:**
- `architect`, `code-skeptic`, `explore-small`, `explore`, `general`, `hitea`, `hivefiver`, `hivehealer`, `hivemaker`, `hiveminder`, `hiveplanner`, `hiveq`, `hiverd`, `hivexplorer`, `handoff`, `build`, `plan`

**Receives From:**
- All specialist agents (verification reports, research, implementation results)

---

### 2. Architect — System Design Authority

| Field | Value |
|-------|-------|
| **File Location** | `.opencode/agents/architect.md:1-435` |
| **Role** | `specialist` |
| **Mode** | `subagent` |
| **Line Reference** | Lines 1-435 |

**Responsibilities:**
- System design, technical decisions
- Pattern selection
- Interface definition
- Trade-off analysis
- Scalability planning

**CAN DO:**
- Create Architecture Decision Records (ADRs)
- Define TypeScript interfaces/contracts
- Select patterns (must check existing codebase first)
- Challenge design with code-skeptic
- Delegate to hivexplorer for codebase context
- Delegate to code-skeptic for assumption challenge
- Delegate to hiveq for design validation

**MUST NOT DO:**
- Implement code in production files (line 65: "NEVER implements code in production files")
- Make decisions without trade-off analysis
- Skip interface definition before implementation
- Verify implementation (that's hiveq's job)

**Delegates To:**
- `code-skeptic`, `hiveq`, `hivexplorer`

**Receives From:**
- `hiveminder` (design requests)

---

### 3. Hiveq — Verification Specialist

| Field | Value |
|-------|-------|
| **File Location** | `.opencode/agents/hiveq.md:1-451` |
| **Role** | `governance` |
| **Mode** | `subagent` |
| **Line Reference** | Lines 1-451 |

**Responsibilities:**
- Validates implementations against specifications
- Validates against requirements and success criteria
- Three-level verification: Existence → Substance → Wiring
- Strict PASS/FAIL verdicts
- Stub detection

**CAN DO:**
- Run verification commands (npx tsc --noEmit, npm test, npm run lint, npm run build)
- Verify observable truths
- Scan for anti-patterns (TODO/FIXME, empty implementations)
- Report gaps_found, passed, human_needed, blocked

**MUST NOT DO:**
- Make code changes (line 63: "NEVER makes code changes")
- Trust claims without evidence
- Assume existence = implementation
- Skip key link verification

**Delegates To:**
- `hivexplorer` (for verification context)

**Receives From:**
- `hivemaker` (implementation verification)
- `hivehealer` (fix verification)
- `hiveminder` (verification requests)

---

### 4. Code-Skeptic — Critical Analysis Specialist

| Field | Value |
|-------|-------|
| **File Location** | `.opencode/agents/code-skeptic.md:1-439` |
| **Role** | `governance` |
| **Mode** | `subagent` |
| **Line Reference** | Lines 1-439 |

**Responsibilities:**
- Challenge assumptions
- Expose hidden risks
- Demand evidence for every claim
- Anti-pattern detection
- Risk severity classification (Critical/High/Medium/Low)

**CAN DO:**
- Critique code quality
- Extract and challenge implicit assumptions
- Scan for anti-patterns (god functions, deep nesting, magic numbers, etc.)
- Classify issues by severity

**MUST NOT DO:**
- Make code changes (line 64: "NEVER makes code changes")
- Approve code (provides evidence for/against, not approval)
- Make architectural decisions
- Implement fixes

**Delegates To:**
- `hivexplorer` (deeper investigation)
- `hiveq` (validate findings)

**Receives From:**
- `hiveminder` (review requests)
- `architect` (design assumption challenges)

---

### 5. Hiveplanner — Planning Specialist

| Field | Value |
|-------|-------|
| **File Location** | `.opencode/agents/hiveplanner.md:1-428` |
| **Role** | `specialist` |
| **Mode** | `subagent` |
| **Line Reference** | Lines 1-428 |

**Responsibilities:**
- Task design and sequencing
- Dependency analysis
- Handoff artifact creation
- Roadmap design (not implementation)

**CAN DO:**
- Create multi-step plans with dependencies
- Analyze external dependencies
- Flag architect decisions needed
- Create delegation packets for each step
- Delegate to hivexplorer for codebase context
- Delegate to hiverd for external research

**MUST NOT DO:**
- Implement code (line 67: "NEVER implements code")
- Delegate to implementation agents
- Create plans without dependency analysis
- Omit success criteria

**Delegates To:**
- `hivexplorer`, `hiverd`

**Receives From:**
- `hiveminder` (planning requests)

---

### 6. Hivemaker — Implementation Specialist

| Field | Value |
|-------|-------|
| **File Location** | `.opencode/agents/hivemaker.md:1-425` |
| **Role** | `specialist` |
| **Mode** | `subagent` |
| **Line Reference** | Lines 1-425 |

**Responsibilities:**
- Execute scoped code changes
- File creation and modification
- Terminal executor (implements what architect designs)

**CAN DO:**
- Write and edit product code
- Follow TDD workflow when specified
- Self-verify (run tsc, tests, lint, build)
- 4-tier deviation rules (auto-fix bugs, auto-add missing, auto-fix blocking, ask about architecture)
- Delegate to hivexplorer for context
- Delegate to hiveq for self-verification

**MUST NOT DO:**
- Make architectural decisions (line 51: "NEVER makes architectural decisions")
- Delegate implementation work (terminal executor)
- Edit framework assets (AGENTS.md, agents/**, commands/**, workflows/**, skills/**)
- Hide verification failures
- Expand scope beyond delegated packet

**Delegates To:**
- `hivexplorer`, `hiveq`

**Receives From:**
- `hiveminder` (implementation requests)

---

### 7. Hivehealer — Remediation Specialist

| Field | Value |
|-------|-------|
| **File Location** | `.opencode/agents/hivehealer.md:1-414` |
| **Role** | `specialist` |
| **Mode** | `subagent` |
| **Line Reference** | Lines 1-414 |

**Responsibilities:**
- Debugging, recovery, hardening
- Diagnose breaks before fixing
- Apply smallest safe fix
- Prove recovery

**CAN DO:**
- Diagnose root causes
- Apply surgical fixes
- Run regression checks
- Binary search debugging
- Git bisect pattern
- Delegate to hivexplorer for context
- Delegate to hiveq for verification

**MUST NOT DO:**
- Delegate implementation work (terminal executor)
- Rewrite architecture for bug fixes
- Edit framework assets
- Apply fixes without diagnosis
- Claim recovery without verification

**Delegates To:**
- `hivexplorer`, `hiveq`

**Receives From:**
- `hiveminder` (remediation requests)

---

### 8. Hivexplorer — Terminal Repository Investigator

| Field | Value |
|-------|-------|
| **File Location** | `.opencode/agents/hivexplorer.md:1-381` |
| **Role** | `specialist` |
| **Mode** | `subagent` |
| **Line Reference** | Lines 1-381 |

**Responsibilities:**
- Read-only codebase investigation
- Evidence collection and synthesis
- Map codebase structure
- Find patterns and connections
- Report with exact file:line references

**CAN DO:**
- Read any file
- Grep/glob for patterns
- Git history analysis
- Pack and analyze with repomix
- Fetch external docs for library patterns

**MUST NOT DO:**
- Write, edit, create, or delete files (line 52: "Read-only")
- Make code changes
- Delegate to other agents (terminal)
- Recommend implementation approaches
- Make architectural decisions

**Delegates To:**
- None (terminal agent)

**Receives From:**
- All agents needing codebase context

---

### 9. Explore — Repository Investigator (with delegation)

| Field | Value |
|-------|-------|
| **File Location** | `.opencode/agents/explore.md:1-380` |
| **Role** | `specialist` |
| **Mode** | `subagent` |
| **Line Reference** | Lines 1-380 |

**Responsibilities:**
- Same as hivexplorer but can delegate to `explore-small` for large codebases

**CAN DO:**
- All hivexplorer capabilities
- Delegate to `explore-small` for large tasks

**MUST NOT DO:**
- Same as hivexplorer

**Delegates To:**
- `explore-small` (for large tasks)

**Receives From:**
- `hiveminder`

---

### 10. Explore-Small — Terminal Repository Investigator

| Field | Value |
|-------|-------|
| **File Location** | `.opencode/agents/explore-small.md:1-377` |
| **Role** | `specialist` |
| **Mode** | `subagent` |
| **Line Reference** | Lines 1-377 |

**Responsibilities:**
- Terminal read-only investigator
- No delegation (strict terminal)

**CAN DO:**
- All hivexplorer capabilities
- Skills: hivemind-codemap, use-hivemind-research, use-hivemind-git-memory

**MUST NOT DO:**
- Delegate to other agents (line 62: "NEVER delegates to other agents")

**Delegates To:**
- None (terminal)

**Receives From:**
- `explore`, `hivexplorer`

---

### 11. Hiverd — External Research Specialist

| Field | Value |
|-------|-------|
| **File Location** | `.opencode/agents/hiverd.md:1-343` |
| **Role** | `specialist` |
| **Mode** | `subagent` |
| **Line Reference** | Lines 1-343 |

**Responsibilities:**
- External ecosystem research
- Documentation lookup
- Market evidence gathering
- Source confidence grading (HIGH/MEDIUM/LOW/UNVERIFIED)

**CAN DO:**
- Web fetch, web search, code search
- Cross-reference sources
- Surface contradictions
- External API research

**MUST NOT DO:**
- Mutate local repository files (line 61: "No local mutations")
- Delegate to other agents (terminal)
- Make unsourced claims
- Smooth over contradictions

**Delegates To:**
- None (terminal)

**Receives From:**
- `hiveminder`, `hiveplanner`

---

### 12. Hitea — Testing Infrastructure Specialist

| Field | Value |
|-------|-------|
| **File Location** | `.opencode/agents/hitea.md:1-423` |
| **Role** | `specialist` |
| **Mode** | `subagent` |
| **Line Reference** | Lines 1-423 |

**Responsibilities:**
- Test infrastructure development
- Test harnesses and fuzzing
- Regression systems
- TDD enforcement

**CAN DO:**
- Write test files
- Build test infrastructure
- TDD RED phase (write failing tests first)
- Edge case coverage

**MUST NOT DO:**
- Delegate work (terminal executor)
- Author framework assets
- Implement features (only tests)
- Write tests that can't fail (tautological)

**Delegates To:**
- `hivexplorer`, `hiveq`

**Receives From:**
- `hiveminder`

---

### 13. Hivefiver — Framework-Writer / Meta-Builder

| Field | Value |
|-------|-------|
| **File Location** | `.opencode/agents/hivefiver.md:1-74` |
| **Role** | `specialist` |
| **Mode** | `all` |
| **Line Reference** | Lines 1-74 |

**Responsibilities:**
- Framework-asset editing (agents, commands, workflows, skills)
- Meta-building for HiveMind
- Bounded framework changes

**CAN DO:**
- Edit framework assets in `agents/`, `commands/`, `workflows/`, `skills/`
- Delegate support work to specialists
- Read/write/edit on permitted paths

**MUST NOT DO:**
- Edit `src/**` or `tests/**` (product code)
- Create user-local `.opencode/**` runtime projections

**Delegates To:**
- `hivexplorer`, `hiveplanner`, `hiverd`, `hiveq`, `build`, `general`, `plan`, `explore`

**Receives From:**
- `hiveminder`

---

### 14. General — Terminal Repository Investigator (with model spec)

| Field | Value |
|-------|-------|
| **File Location** | `.opencode/agents/general.md:1-351` |
| **Role** | `specialist` |
| **Mode** | `subagent` |
| **Model** | `minimax-coding-plan/MiniMax-M2.7` |
| **Line Reference** | Lines 1-351 |

**Responsibilities:**
- Read-only codebase investigation
- Model-specific variant of hivexplorer

**CAN DO:**
- All hivexplorer capabilities
- Todo read/write

**MUST NOT DO:**
- Delegate to other agents (terminal)
- Write/edit files

**Delegates To:**
- None (terminal)

**Receives From:**
- `hiveminder`

---

## Actor-Consumer Mapping

| Actor | Consumer | Relationship |
|-------|----------|--------------|
| `hiveminder` | `hiveplanner` | Requests plan creation |
| `hiveminder` | `architect` | Requests design decisions |
| `hiveminder` | `hivemaker` | Requests implementation |
| `hiveminder` | `hivehealer` | Requests remediation |
| `hiveminder` | `hiveq` | Requests verification |
| `hiveminder` | `code-skeptic` | Requests critique |
| `hiveminder` | `hiverd` | Requests external research |
| `hiveminder` | `hitea` | Requests test infrastructure |
| `hiveminder` | `hivefiver` | Requests framework changes |
| `hiveminder` | `hivexplorer` / `explore` / `explore-small` | Requests codebase investigation |
| `hiveminder` | `general` | Requests investigation |
| `architect` | `code-skeptic` | Challenges design assumptions |
| `architect` | `hiveq` | Validates design feasibility |
| `architect` | `hivexplorer` | Gets codebase context |
| `hiveplanner` | `hivexplorer` | Gets codebase context |
| `hiveplanner` | `hiverd` | Gets external research |
| `hivemaker` | `hivexplorer` | Gets implementation context |
| `hivemaker` | `hiveq` | Self-verification |
| `hivehealer` | `hivexplorer` | Gets diagnosis context |
| `hivehealer` | `hiveq` | Verifies fix |
| `code-skeptic` | `hivexplorer` | Gets deeper investigation |
| `code-skeptic` | `hiveq` | Validates findings |
| `hitea` | `hivexplorer` | Gets test context |
| `hitea` | `hiveq` | Verifies test coverage |
| `hiveq` | `hivexplorer` | Gets verification context |
| `hiverd` | (terminal) | No delegation |
| `hivexplorer` | (terminal) | No delegation |
| `explore` | `explore-small` | Large codebase delegation |
| `hivefiver` | `hivexplorer`, `hiveplanner`, `hiverd`, `hiveq` | Support work delegation |

---

## Hierarchy Gaps

### Gap 1: Missing Dedicated Handoff Agent
**Reference:** `.opencode/agents/hiveminder.md:32` lists `handoff` as an allowed task target, but NO `handoff.md` agent file exists.

**Impact:** The handoff concept exists in the workflow but has no dedicated agent to manage it. Handoffs are currently handled implicitly through agent-to-agent communication.

**Resolution Needed:** Either create a dedicated `handoff.md` agent or clarify that "handoff" is a concept handled by returning agents.

---

### Gap 2: Phantom Agent References
**Reference:** `.opencode/agents/hiveminder.md:33-36` lists `build`, `plan`, `general`, `explore` as allowed task targets.

| Agent | File Exists? | Notes |
|-------|--------------|-------|
| `build` | NO | Phantom reference |
| `plan` | NO | Phantom reference |
| `general` | YES | `.opencode/agents/general.md` |
| `explore` | YES | `.opencode/agents/explore.md` |

**Impact:** hiveminder can theoretically route to `build` and `plan` agents that don't exist as files.

---

### Gap 3: No Explicit "System Health" Governance Agent
The governance role is split between `hiveq` (verification) and `code-skeptic` (critical analysis), but there's no agent explicitly focused on system-wide health, context rot detection, or session continuity.

**Reference:** This exists as skills (`use-hivemind-context`, `hivemind-gatekeeping`) but not as a standalone agent.

---

## Chain-Breaking Risks

### Risk 1: Agent Scope Creep (HIGH)
**Location:** Multiple agent files contain "MUST NOT DO" rules that are not enforced technically.

**Examples:**
- `hivemaker.md:53` - "NEVER edits framework assets" but no technical enforcement
- `hivehealer.md:53` - "NEVER edits framework assets" but no technical enforcement
- `hitea.md:55` - "NEVER authors framework assets" but no technical enforcement

**Mitigation:** The permission system in YAML frontmatter provides some enforcement, but relies on agent self-discipline.

---

### Risk 2: Orchestrator Bypass (MEDIUM)
**Location:** `hiveminder.md:21-37` allows task delegation to ALL agents including `hivexplorer`, `hiverd`, etc.

**Issue:** hiveminder could theoretically bypass the specialist hierarchy and directly query agents without going through proper workflow.

**Current Design:** This appears intentional - hiveminder as primary orchestrator has broad routing authority.

---

### Risk 3: Terminal Agent Isolation Violation (MEDIUM)
**Location:** `explore.md:26` allows delegation to `explore-small`.

**Issue:** `explore` is defined as terminal but can delegate to `explore-small`, creating a potential loop.

**Mitigation:** `explore-small` is explicitly forbidden from further delegation (line 62: "NEVER delegates to other agents").

---

### Risk 4: Duplicate Agent Definitions (LOW)
**Location:** `agents/` at root vs `.opencode/agents/`

**Issue:** Both directories contain what appear to be identical agent files.

**Evidence:**
- `.opencode/agents/hivexplorer.md` vs `agents/hivexplorer.md`
- `.opencode/agents/hiverd.md` vs `agents/hiverd.md`
- etc.

**Impact:** Unknown which is authoritative. AGENTS.md (line 16) states "Dev projection: `.opencode/`", suggesting `.opencode/agents/` is authoritative.

---

## Summary Table

| Agent | Role | Terminal? | Delegates To | Receives From |
|-------|------|-----------|--------------|---------------|
| hiveminder | orchestrator | No | All 14+ agents | All specialists |
| architect | specialist | No | code-skeptic, hiveq, hivexplorer | hiveminder |
| hiveq | governance | No | hivexplorer | hivemaker, hivehealer, hiveminder |
| code-skeptic | governance | No | hivexplorer, hiveq | hiveminder, architect |
| hiveplanner | specialist | No | hivexplorer, hiverd | hiveminder |
| hivemaker | specialist | Yes (implementation) | hivexplorer, hiveq | hiveminder |
| hivehealer | specialist | Yes (remediation) | hivexplorer, hiveq | hiveminder |
| hivexplorer | specialist | YES | None | All agents |
| explore | specialist | Partial | explore-small | hiveminder |
| explore-small | specialist | YES | None | explore, hivexplorer |
| hiverd | specialist | YES | None | hiveminder, hiveplanner |
| hitea | specialist | Yes (testing) | hivexplorer, hiveq | hiveminder |
| hivefiver | specialist | No | 8 agents listed | hiveminder |
| general | specialist | YES | None | hiveminder |

---

## Files Verified

All 14 agent files exist at `.opencode/agents/`:
- `explore-small.md` (377 lines)
- `explore.md` (380 lines)
- `hiverd.md` (343 lines)
- `hivexplorer.md` (381 lines)
- `hiveminder.md` (86 lines)
- `architect.md` (435 lines)
- `general.md` (351 lines)
- `hiveq.md` (451 lines)
- `hiveplanner.md` (428 lines)
- `hivemaker.md` (425 lines)
- `hivehealer.md` (414 lines)
- `hivefiver.md` (74 lines)
- `hitea.md` (423 lines)
- `code-skeptic.md` (439 lines)

---

*Report generated: 2026-03-31*
*Producer: hivexplorer*
*Git commit at investigation: verify with `git log -1 --format='%H'`*
