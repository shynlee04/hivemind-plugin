# Entry State Matrix

## Session Lifecycle States

### NEW SESSION

**Definition:** First message of a fresh session, no prior context.

**Indicators:**
- No prior context in current conversation
- Fresh session ID
- No `.hivemind/` state for this session
- No conversation history

**Required Actions:**
1. Map project context
2. Identify authoritative surfaces (AGENTS.md, governance)
3. Note any pre-existing state
4. Establish baseline trust score
5. Detect platform directories

**Checklist:**
- [ ] Scan for AGENTS.md files
- [ ] Identify project type
- [ ] Check for .hivemind/ directory
- [ ] Verify git repository status
- [ ] Detect platform-specific directories

---

### RESUMED SESSION

**Definition:** Continuation after natural context window, prior state exists.

**Indicators:**
- Prior context exists but may be pruned
- Gap in conversation history
- Session ID continues
- Some artifacts from previous work

**Required Actions:**
1. Verify prior state markers
2. Check for gaps in trajectory
3. Re-establish continuity
4. Assess context completeness
5. Update trust score

**Checklist:**
- [ ] Review last saved state
- [ ] Identify what changed since last session
- [ ] Verify trajectory continuity
- [ ] Check for pruned context
- [ ] Confirm intent alignment

---

### DEGRADED SESSION

**Definition:** State where context integrity is compromised.

**Indicators:**
- Pruned context window
- Missing mid-session artifacts
- Unclear what preceded current state
- Contradictory signals
- Multiple turn gaps

**Required Actions:**
1. STOP assuming prior state is accurate
2. Rebuild context from authoritative sources
3. Verify key facts independently
4. Score trust level
5. Document recovery path

**Checklist:**
- [ ] Identify missing artifacts
- [ ] Rebuild from governance files
- [ ] Cross-reference with git history
- [ ] Assess what can be recovered
- [ ] Determine recovery strategy

---

### DELEGATED SESSION

**Definition:** Subagent or child session with inherited scope.

**Indicators:**
- Received delegated task
- Explicit scope declaration present
- Working within boundaries
- Parent context may be available

**Required Actions:**
1. Understand inherited vs. own scope
2. Verify delegation chain
3. Do NOT inherit parent session state
4. Stay within declared boundaries
5. Report progress to defined points

**Checklist:**
- [ ] Parse delegation scope declaration
- [ ] Identify boundaries (included/excluded)
- [ ] Verify delegation chain is valid
- [ ] Do NOT access parent's unrelated context
- [ ] Understand reporting requirements

**Inheritance Rules:**

| Element | Inherit? | Reason |
|---------|----------|--------|
| Task description | YES | Core mandate |
| Constraints | YES | Operating bounds |
| Success criteria | YES | Target definition |
| Parent session state | NO | Privacy, isolation |
| Unrelated context | NO | Scope containment |
| Authority to delegate | NO | Chain of command |

---

### INTERRUPTED SESSION

**Definition:** Resumed after cancellation or error during previous turn.

**Indicators:**
- Prior action was incomplete
- No clear outcome from previous turn
- State may be partially written
- Error or cancellation marker present

**Required Actions:**
1. Assess what completed vs. what didn't
2. Verify state integrity
3. Resume or restart as appropriate
4. Document any ambiguity
5. Confirm with user if uncertain

**Checklist:**
- [ ] Identify incomplete actions
- [ ] Check for partial state writes
- [ ] Verify file system consistency
- [ ] Determine if safe to resume
- [ ] Clean up partial artifacts if needed

---

### RECOVERED SESSION

**Definition:** After successful context repair.

**Indicators:**
- Context integrity restored
- Trust score returned to normal
- Prior issues documented
- Clear path forward

**Required Actions:**
1. Verify restoration completeness
2. Continue with confidence
3. Document recovery path
4. Update trust score
5. Proceed with planned work

**Checklist:**
- [ ] All required artifacts restored
- [ ] Trust score >= 0.7
- [ ] Governance files verified
- [ ] Intent clear and documented
- [ ] Ready to proceed

---

## State Transitions

```
NEW ───────────────────────────────────────────────────────► RESUMED
  │                                                            │
  │                                                            ▼
  │                                                      ┌──────────┐
  │                                                      │ DEGRADED │
  │                                                      └────┬─────┘
  │                                                           │
  │         ┌─────────────────────────────────────────────────┤
  │         │                                                 │
  │         ▼                                                 ▼
  │   ┌─────────────┐                                  ┌───────────┐
  │   │ INTERRUPTED │                                  │ RECOVERED │
  │   └─────────────┘                                  └───────────┘
  │         │                                                 ▲
  │         │                                                 │
  │         ▼                                                 │
  └──► DELEGATED ────────────────────────────────────────────┘
```

---

## Entry Protocol by State

| State | First Action | Second Action | Third Action |
|-------|--------------|---------------|--------------|
| NEW | Map context | Identify authorities | Establish baseline |
| RESUMED | Verify continuity | Check for gaps | Update intent |
| DEGRADED | STOP assuming | Rebuild from sources | Score trust |
| DELEGATED | Parse scope | Verify chain | Set boundaries |
| INTERRUPTED | Assess completion | Verify state | Decide resume/restart |
| RECOVERED | Verify restoration | Continue | Document path |