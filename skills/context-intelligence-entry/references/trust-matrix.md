# Trust Matrix

## Signal Trust Weights

| Signal | Trust Score | Weight | Reasoning |
|--------|-------------|--------|-----------|
| Live SDK/plugin behavior | 100% | 1.0 | Directly observed, not interpreted |
| User confirmation | 100% | 1.0 | Highest authority - user intent |
| Git-verified file | 95% | 0.9 | Cryptographically verified, audit trail |
| Type-checked code | 90% | 0.8 | Machine-verified correctness |
| Local file read | 80% | 0.7 | Current state, but may be stale |
| Documentation | 50% | 0.5 | May be outdated, requires verification |
| Inherited context | 40% | 0.4 | Second-hand, may be incomplete |
| Unverified claims | 10% | 0.1 | Unsupported assertions |
| Contradictory signals | 0% | 0.0 | Cannot trust conflicting information |

---

## Trust Score Calculation

### Formula

```
Effective Trust = Σ(Signal × Weight) / Σ(Weight)
```

### Example Calculations

**Scenario A: Clean Context**
- Git-verified file: 0.95 × 0.9 = 0.855
- Type-checked code: 0.90 × 0.8 = 0.720
- Documentation: 0.50 × 0.5 = 0.250
- **Total:** (0.855 + 0.720 + 0.250) / (0.9 + 0.8 + 0.5) = 1.825 / 2.2 = **0.83**

**Scenario B: Mixed Signals**
- Git-verified file: 0.95 × 0.9 = 0.855
- Documentation: 0.50 × 0.5 = 0.250
- Unverified claim: 0.10 × 0.1 = 0.010
- **Total:** (0.855 + 0.250 + 0.010) / (0.9 + 0.5 + 0.1) = 1.115 / 1.5 = **0.74**

**Scenario C: Contradictory Signals**
- Git-verified file: 0.95 × 0.9 = 0.855
- Documentation: 0.50 × 0.5 = 0.250
- Contradictory signal: 0.00 × 0.0 = 0.000
- Weight adjustment: Contradiction invalidates trust
- **Total:** **0.00** (automatic zero on contradiction)

---

## Trust Thresholds

| Threshold | Level | Actions Permitted |
|-----------|-------|-------------------|
| ≥ 0.8 | HIGH | Full autonomy, no confirmation needed |
| 0.6 - 0.79 | MEDIUM | Proceed with caution, verify at checkpoints |
| 0.4 - 0.59 | LOW | User confirmation for most actions |
| < 0.4 | CRITICAL | Stop and rebuild before proceeding |

---

## Action Gate Thresholds

| Action | Minimum Trust | User Confirmation |
|--------|---------------|-------------------|
| Read files | 0.4 | Never |
| Write files | 0.6 | If trust < 0.7 |
| Delete files | 0.8 | Always |
| Execute commands | 0.7 | If trust < 0.8 |
| Delegate to subagent | 0.6 | Explicit scope required |
| Claim task complete | 0.8 | Evidence required |
| Modify governance | 0.9 | Always + user explicit |
| Create/delete skills | 0.9 | Always + user explicit |

---

## Signal Verification Methods

### Git-Verified Files

**Method:** Compare file hash with git index
**Command:** `git status --porcelain && git diff-files`
**Confidence:** High if clean
**Caveat:** Local changes may not be committed

### Type-Checked Code

**Method:** Run TypeScript/compiler
**Command:** `npx tsc --noEmit`
**Confidence:** High if passes
**Caveat:** Only validates types, not logic

### Documentation Freshness

**Method:** Compare timestamp with git log
**Command:** `git log -1 --format="%ci" -- <file>`
**Confidence:** Medium
**Caveat:** May be maintained manually (stale)

### Inherited Context

**Method:** Trace delegation chain
**Confidence:** Low - always verify
**Caveat:** Must check chain integrity

---

## Trust Recovery

### After Trust Drop

| Trust Level | Recovery Action |
|-------------|-----------------|
| MEDIUM | Verify one high-trust signal, then continue |
| LOW | Rebuild from authoritative sources, then verify |
| CRITICAL | Full rebuild + user confirmation before proceeding |

### Rebuilding Trust

1. **Identify authoritative sources**
   - Git-committed files (high)
   - Type-checked code (high)
   - User-confirmed facts (highest)

2. **Discard low-trust signals**
   - Unverified claims (discard)
   - Outdated documentation (flag)
   - Inherited context (re-verify)

3. **Re-verify critical facts**
   - Check governance files
   - Verify code structure
   - Confirm with git history

4. **Re-calculate trust score**
   - Use only verified signals
   - Apply weights
   - Document recovery path

---

## Trust Score Output Schema

```json
{
  "timestamp": "2026-03-19T10:00:00Z",
  "trustScore": 0.74,
  "trustLevel": "MEDIUM",
  "signals": [
    {
      "type": "GIT_VERIFIED",
      "score": 0.95,
      "weight": 0.9,
      "contribution": 0.855,
      "source": "git status clean"
    },
    {
      "type": "DOCUMENTATION",
      "score": 0.50,
      "weight": 0.5,
      "contribution": 0.250,
      "source": "AGENTS.md exists, timestamp matches"
    }
  ],
  "recommendations": [
    {
      "priority": "LOW",
      "action": "Proceed with checkpoint verification",
      "reason": "Trust score within acceptable range"
    }
  ]
}
```