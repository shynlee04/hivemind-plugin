# Rollback Plan Template

## Template Purpose

Structured template for creating and verifying a production rollback plan. Every deployment must have a rollback plan that is: documented, tested, and executable. "Revert the commit" is NOT a rollback plan — it's a prayer.

## Template

Copy this template and fill in every section. Delete sections marked N/A only after confirming they do not apply.

```markdown
## Rollback Plan: [Feature/Release Name]
**Date:** [YYYY-MM-DD]
**Deployment ID:** [pipeline run ID / commit SHA / version tag]
**Rollback Owner:** [name of person authorized to trigger rollback]
**Time to Execute Rollback:** [estimated minutes]
**Rollback Tested in Staging:** ✅ / ❌ (if ❌, STOP — test before deployment)

---

### 1. Rollback Trigger Conditions

Rollback is triggered when ANY of the following conditions are met:

| # | Condition | Threshold | Measurement Source |
|---|-----------|-----------|-------------------|
| 1 | Error rate exceeds baseline | > [N]% increase (e.g., >100% = 2x baseline) | [monitoring dashboard URL] |
| 2 | P95 latency exceeds threshold | > [N]ms (e.g., >500ms) | [monitoring dashboard URL] |
| 3 | User-reported issues spike | > [N] reports in [time window] | [support ticket system] |
| 4 | Business metric decline | > [N]% drop in [metric] | [analytics dashboard URL] |
| 5 | Data integrity issue detected | Any confirmed data corruption | [alert / manual check] |
| 6 | Security vulnerability discovered | Any confirmed vulnerability | [security scanner / report] |
| 7 | Health check fails for > [N] seconds | Health endpoint returns non-200 for > [N]s | [health check monitor URL] |

### 2. Rollback Steps

Execute these steps in order to roll back the deployment:

#### Step 1: Stop the Bleeding (immediate — <1 minute)
- [ ] **Feature flag disable** (if applicable): Set `FEATURE_[NAME]=false` in production config
- [ ] Verify: Feature is no longer accessible to users
- [ ] If no feature flag: Proceed to full rollback (Step 2)

#### Step 2: Full Rollback (target: <[N] minutes)
- [ ] **Notify team** (Slack `#incidents` / PagerDuty / on-call channel): "Rolling back [feature name] due to [trigger condition]. ETA: [N] minutes."
- [ ] **Revert deployment:**
  ```bash
  # Option A: Deploy previous version
  git checkout <previous-commit-sha> && deploy.sh
  
  # Option B: Use deployment tool rollback
  <platform-rollback-command>  # e.g., kubectl rollout undo, helm rollback, cdktf deploy --auto-approve
  
  # Option C: Switch traffic back to old version
  <load-balancer/traffic-shift-command>
  ```
- [ ] **Verify deployment rollback:** Health check returns 200, old version is serving traffic

#### Step 3: Database Rollback (target: <[N] minutes)
⚠️ **CRITICAL — only execute if migrations were part of the deployment:**
- [ ] **Run DOWN migrations:**
  ```bash
  <migration-rollback-command>  # e.g., prisma migrate down 1, alembic downgrade -1, rails db:rollback
  ```
- [ ] **Verify data integrity:** Run data integrity checks (row counts, checksums, sample queries)
- [ ] **If DOWN fails:** Execute manual recovery procedure (documented below)

#### Step 4: Config Reversion (target: <[N] minutes)
- [ ] **Revert environment variables:** Restore previous config values
- [ ] **Revert feature flags:** Set all new flags to previous state
- [ ] **Invalidate caches:** Clear any caches that may contain new data formats
  ```bash
  <cache-invalidation-command>  # e.g., redis-cli FLUSHALL (with caution), CDN purge
  ```

#### Step 5: Verify (target: <[N] minutes)
- [ ] **Health check:** `curl -s https://production.example.com/health | jq .` → 200 + all deps healthy
- [ ] **Smoke tests:** Run critical user flow tests against production
- [ ] **Error monitoring:** Error rate returned to baseline
- [ ] **Latency monitoring:** P95 latency returned to baseline
- [ ] **User reports:** No new reports related to the rollback

#### Step 6: Communicate
- [ ] **Notify team:** "Rollback complete. [Feature name] rolled back in [N] minutes. Root cause investigation starting."
- [ ] **Update status page:** If applicable, update public status to "Monitoring" or "Resolved"
- [ ] **Create incident postmortem ticket:** Link to deployment ID, trigger condition, timeline

### 3. Database Rollback Details

| Migration | UP Description | DOWN Description | Tested in Staging? | Risk Level |
|-----------|---------------|-----------------|---------------------|------------|
| [migration 1 name] | [what it does] | [how to reverse] | ✅ / ❌ | Low / Medium / High |
| [migration 2 name] | [what it does] | [how to reverse] | ✅ / ❌ | Low / Medium / High |

**Irreversible migrations (if any):**
| Migration | Why Irreversible | Data at Risk | Backup Location | Approval |
|-----------|-----------------|--------------|-----------------|----------|
| [migration name] | [reason] | [what data] | [backup path] | [who approved, date] |

### 4. Manual Recovery Procedures

If automated rollback fails, follow these manual procedures:

| Scenario | Recovery Steps | Expected Time | Risk |
|----------|---------------|---------------|------|
| Deployment tool fails | [manual deploy steps] | [N] minutes | Low |
| Database rollback fails | [manual SQL restore steps] | [N] minutes | High |
| Config reversion fails | [manual config edit steps] | [N] minutes | Low |
| Cache issues persist | [manual cache clear steps] | [N] minutes | Low |

### 5. Rollback Decision Authority

| Who Can Trigger Rollback | Authority Level | When to Contact |
|-------------------------|----------------|-----------------|
| [On-call engineer] | Immediate — no approval needed | Any trigger condition met |
| [Engineering manager] | Override — can cancel rollback | If trigger is false alarm |
| [VP Engineering / CTO] | Escalation — if rollback itself fails | Escalation path |

### 6. Post-Rollback
- [ ] Root cause analysis (RCA) scheduled within 24 hours
- [ ] Rollback procedure reviewed for improvements (what worked, what didn't)
- [ ] Monitoring alerts adjusted if thresholds were wrong
- [ ] Feature flag cleaned up (if rollback was flag-based)
- [ ] Rollback plan updated with lessons learned
```

## Verification Checklist

Before deployment, verify the rollback plan:
- [ ] All trigger conditions have specific, measurable thresholds (not "if something is wrong")
- [ ] Every trigger condition has a measurement source (dashboard URL, alert name)
- [ ] Every step has an estimated execution time
- [ ] Total rollback time is within the acceptable downtime window
- [ ] Rollback has been tested in staging (actual execution, not tabletop exercise)
- [ ] Database DOWN migrations have been tested (DOWN → UP sequence verified)
- [ ] Manual recovery procedures exist for every automated step
- [ ] Decision authority is clearly defined (who can pull the trigger)
- [ ] Communication plan covers all stakeholders (team, support, customers)
- [ ] Rollback does not depend on the infrastructure it's rolling back (e.g., don't use the failing DB to run a DB restore)

## Rollback Plan Anti-Patterns

| Anti-Pattern | Example | Correction |
|-------------|---------|------------|
| **Revert-and-pray** | "We'll just revert the commit" | Write step-by-step rollback with timing, triggers, and verification |
| **No thresholds** | "Roll back if something seems wrong" | Define specific, measurable trigger conditions |
| **Untested rollback** | Plan exists but never run in staging | Execute rollback in staging before production deployment |
| **No DB rollback** | Plan covers deployment but not migrations | Include database rollback steps with DOWN migration commands |
| **No manual recovery** | "If automated rollback fails, figure it out" | Document manual recovery procedures for each failure scenario |
| **Solo decision-maker** | Only one person can trigger rollback | Define escalation path and backup authorities |
| **Rollback depends on deployment** | Rollback script runs on the same infrastructure being rolled back | Run rollback from independent infrastructure or have offline procedures |
