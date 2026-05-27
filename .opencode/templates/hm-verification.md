# Phase {{phase_id}} — Verification Report

**Checked:** {{date}}
**Verifier:** hm-verifier
**Verdict:** PASS | FAIL

## MUST-HAVES VERIFICATION

We evaluated the must-haves defined in all plan frontmatter:

### Truths
- [ ] Truth 1: Description of expected behavior
  - **Evidence:** Test log, console output, or screenshot reference
- [ ] Truth 2: Description of expected behavior
  - **Evidence:** Test log or console output

### Artifacts
- [ ] Artifact 1: `path/to/file.ext`
  - **Check:** File exists and is non-empty
  - **Evidence:** File size and LOC confirmation
- [ ] Artifact 2: `path/to/other.ext`
  - **Check:** Exports expected functions/variables
  - **Evidence:** Export analysis

### Key Links
- [ ] Link 1: Connection from `fileA` to `fileB`
  - **Check:** Pattern match `regex` in `fileA`
  - **Evidence:** Match confirmation

## AUTOMATED TEST RESULTS

```
Command executed: npm run test
Summary: X passed, 0 failed, Y total
```

## SECURITY REVIEW & COMPLIANCE

Verify STRIDE threat mitigations:

- **T-{{phase}}-01**: Mitigated by validation in `file.ts` (evidence: test passes)
- **T-{{phase}}-SC**: Mitigated by slopcheck audit (evidence: lockfile verification)
