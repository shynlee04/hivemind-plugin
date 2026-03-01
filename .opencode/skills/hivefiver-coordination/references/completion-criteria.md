# Completion Criteria Reference

> Per-stage completion checklists for HiveFiver V2.

## Stage: start

### Entry Criteria
- [ ] User intent captured
- [ ] Scope defined (in-scope / out-of-scope paths)

### Exit Criteria
- [ ] Persona lane determined (vibecoder | floppy_engineer | enterprise_architect)
- [ ] Initial SOT written to hierarchy.json
- [ ] First action created in hierarchy

### Evidence Required
- Hierarchy updated with trajectory
- Persona cached for session

---

## Stage: intake

### Entry Criteria
- [ ] User input received
- [ ] Initial scope validated

### Exit Criteria
- [ ] All requirements gathered
- [ ] Ambiguities identified
- [ ] Clarification questions resolved (if any)

### Evidence Required
- Requirements documented
- Ambiguity map created (if needed)

---

## Stage: spec

### Entry Criteria
- [ ] Requirements complete
- [ ] Scope boundaries clear

### Exit Criteria
- [ ] SPEC created or updated
- [ ] Acceptance criteria defined
- [ ] Verification conditions declared
- [ ] Ambiguity map complete

### Evidence Required
- SPEC file in docs/plans/
- Acceptance criteria listed
- Verification evidence requirements documented

---

## Stage: architect

### Entry Criteria
- [ ] SPEC approved
- [ ] Acceptance criteria accepted

### Exit Criteria
- [ ] Architecture design complete
- [ ] Asset contracts defined
- [ ] Dependencies mapped
- [ ] Workflows designed

### Evidence Required
- Architecture document
- Contract schemas validated
- Dependency graph produced

---

## Stage: build

### Entry Criteria
- [ ] Architecture approved
- [ ] Contracts defined

### Exit Criteria
- [ ] All assets created (agents, commands, workflows, skills)
- [ ] Frontmatter valid on all assets
- [ ] Parity sync verified (.opencode/ → root)

### Evidence Required
- All asset files created
- `grep -c "mf-"` returns 0 on agent profile
- Diff between .opencode/ and root returns zero

---

## Stage: audit

### Entry Criteria
- [ ] Build complete
- [ ] All assets present

### Exit Criteria
- [ ] All contracts validated
- [ ] No anti-patterns detected (G-01 through G-10)
- [ ] Quality gate checks pass

### Evidence Required
- quality-check.sh output
- Contract validation results
- Anti-pattern scan results

---

## Stage: doctor

### Entry Criteria
- [ ] Audit issues identified
- [ ] Issues prioritized

### Exit Criteria
- [ ] All critical issues resolved
- [ ] Quality restored
- [ ] Regression tests pass

### Evidence Required
- Issue resolution evidence
- Test results
- Verification commands output

---

## Universal Exit Requirements

For any stage claiming completion:

1. **Scope audit**: Edits stayed in `.opencode/**` or `.hivemind/**`
2. **Contract check**: All touched assets have valid frontmatter
3. **Routing check**: Commands/workflows have deterministic paths
4. **Evidence**: Fresh verification output supporting claim
5. **Handoff**: Next agent, next command, blocking conditions emitted
