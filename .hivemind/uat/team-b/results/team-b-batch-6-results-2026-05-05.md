# UAT Team-B Batch 6 Results — Path 3: Governance/Configuration
**Date:** 2026-05-05
**Tester:** Team-B (blind end-user)
**Marker:** team-b

---

## Summary Table

| Test ID | Tool | Action(s) Tested | Result | Notes |
|---------|------|-----------------|--------|-------|
| 6a.1 | configure-primitive | read command (test-echo) | **PASS** | Frontmatter + body returned |
| 6a.2 | configure-primitive | inspect command (test-echo) | **PASS** | crossRefStatus=valid, warnings=[] |
| 6a.3 | configure-primitive | read agent (hm-l0-orchestrator) | **PASS** | Full frontmatter with permissions, body with all XML tags |
| 6a.4 | configure-primitive | list skills (dry-run) | **PASS** | 57 skills listed, 1 warning (hm-l2-planning-persistence) |
| 6b.1 | sdk-supervisor | heartbeat | **PASS** | ok=true, sequence=1 |
| 6b.2 | sdk-supervisor | diagnostics (max 5) | **PASS** | 0 diagnostics, not truncated |
| 6c.1 | nl-route | empty query | **PASS** | Returns error: "No matching command found" |
| 6c.2 | nl-route | multi-keyword query | **PASS** | Matches test-echo (keyword: echo), confidence=0.333 |
| 6c.3 | nl-route | no-match query | **PASS** | Returns error: "No matching command found" |
| 6d.1 | trajectory | attach (batch 6) | **PASS** | New trajectory alongside closed batch 4 |
| 6d.2 | pressure | detect (configure-primitive) | **PASS** | authority=write, stateSurface=opencode-primitive |

**Score: 11 PASS, 0 FAIL**

---

## Detailed Results

### 6a: configure-primitive Deep CRUD

**read (command=test-echo):**
- frontmatter: `{ description: "Echo back the user's message" }`
- body: `Echo back exactly what the user said: $ARGUMENTS`
- File path resolved correctly

**inspect (command=test-echo):**
- Same as read + crossRefStatus=valid, warnings=[]
- Validates cross-references to other primitives

**read (agent=hm-l0-orchestrator):**
- Full agent definition returned with complete frontmatter:
  - mode: primary, temperature: 0.25, color: #3B82F6, steps: 100
  - Permissions: read=allow, edit=ask, write=ask, bash=restricted, glob=allow, grep=allow
  - Task delegation: hm-l1-coordinator=allow, hm-l2-*=allow, all others=deny
  - Harness tools: delegate-task=allow, delegation-status=allow, session-journal-export=allow
  - Skill loading: hm-l2-*=allow, hm-l3-*=allow, gate-l3-*=allow, stack-l3-*=allow, all others=deny
- Complete body with all XML tags (role, depth, lineage, task, scope, context, etc.)

**list skills (dry-run=true):**
- 57 skills returned (matches expected count from AGENTS.md)
- Breakdown: 30 hm-*, 11 hf-*, 3 gate-*, 6 stack-*, 1 unprefixed, 6 others
- 1 warning: Invalid skill frontmatter in hm-l2-planning-persistence/SKILL.md (missing name+description)

### 6b: SDK Supervisor

**heartbeat:** ok=true, sequence=1, heartbeatAt=2026-05-04T17:59:22.533Z
**diagnostics(max 5):** totalDiagnostics=0, truncated=false — no issues detected

### 6c: nl-route Edge Cases

| Query | Result | Notes |
|-------|--------|-------|
| "" (empty) | error: "No matching command found" | Correct — empty input rejected |
| "echo hello world status list all tests" | test-echo, args="hello world status list all tests", confidence=0.333 | Matches first keyword "echo", rest becomes args |
| "random gibberish xyz123" | error: "No matching command found" | Correct — no keyword match |

**Observation:** nl-route matches first keyword only. Multi-keyword queries like "echo hello world status list" don't produce multi-match — they match "echo" keyword → test-echo command, everything else becomes args. Confidence=0.333 suggests only 1 of 3 keywords matched.

### 6d: Cross-Governance Chain

- Trajectory ledger correctly maintains both closed (batch 4) and active (batch 6) trajectories
- Pressure detection for configure-primitive: authority=write, mutatesState=true, stateSurface=opencode-primitive
- All governance tools operate at tier 0 steady

---

## Findings

### FINDING-6.1: nl-route Keyword Priority
**Severity:** LOW
**Impact:** Multi-keyword queries match only the first matching keyword
**Evidence:** "echo hello world status list" → test-echo (confidence=0.333) instead of suggesting both test-echo and test-list
**Note:** This is by design (keyword matching, not semantic routing) but may surprise users expecting multi-command suggestions

### FINDING-6.2: Invalid Skill Frontmatter Persistence
**Severity:** MEDIUM
**Impact:** hm-l2-planning-persistence/SKILL.md consistently warns in configure-primitive list and validate-restart
**Evidence:** "name: Invalid input: expected string, received undefined; description: Invalid input: expected string, received undefined"
**Note:** This skill is in a disabled directory (donotusethis-*) but still discovered by the registry

---

## Statistics

| Metric | Value |
|--------|-------|
| Tools tested | 4 (configure-primitive, sdk-supervisor, nl-route, trajectory + pressure) |
| Action variants | 11 |
| PASS | 11 |
| FAIL | 0 |
| Findings | 2 (1 low, 1 medium) |
| Skills listed | 57 |
| Commands listed | 18 (from batch 4) |
| Diagnostics | 0 (clean) |
