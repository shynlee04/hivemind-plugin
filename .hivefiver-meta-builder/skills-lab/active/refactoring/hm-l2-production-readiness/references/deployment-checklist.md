# Comprehensive Pre-Deployment Checklist

## Checklist Purpose

Verify every operational dimension before deployment. Run this checklist for every production deployment, regardless of size. Small changes can cause big outages — no deployment is "too simple" to skip verification.

## How to Use

Work through each section in order. Mark items as one of:
- **✅ PASS** — Verified and satisfied
- **❌ FAIL** — Not satisfied; must fix before deployment
- **⚠️ N/A** — Not applicable to this deployment or target
- **🔶 WAIVED** — Consciously skipped with documented risk acceptance

At the top of each section, a "gate" indicates the minimum passing status to proceed:
- **GATE: ALL** — every item must pass (no waivers)
- **GATE: NO FAIL** — waivers allowed but no failures
- **GATE: NO CRITICAL FAIL** — marked critical items must pass

## 1. Configuration Changes

**GATE: ALL**

- [ ] All new environment variables are documented with descriptions and default values
- [ ] All changed environment variables have been updated in production config (not just staging)
- [ ] Secrets (API keys, tokens, passwords) are NOT in code or version control
- [ ] Secrets are rotated if any were exposed (even in development)
- [ ] Feature flags have defined owners and expiration dates
- [ ] Feature flags default to OFF in production (safe default)
- [ ] Config changes are backward compatible (old config values still work, deprecated with warnings)
- [ ] Config validation catches malformed values (graceful defaults, not crashes)

**Adapter notes:**
- **npm packages:** Verify `package.json` version bump, `engines` field accurate, `exports` map correct.
- **Serverless:** Verify function environment variables match between deployment stages (dev/staging/prod).
- **CLI tools:** Verify `--help` output reflects new config options; default behavior unchanged.

## 2. Infrastructure Readiness

**GATE: NO FAIL** (waivers allowed for targets that don't need specific items)

- [ ] DNS records are correct and propagated (use `dig` or `nslookup` to verify)
- [ ] SSL/TLS certificates are valid and not expiring within 30 days
- [ ] TLS configuration meets current best practices (TLS 1.2+, strong cipher suites)
- [ ] Load balancer is configured and health checks pass
- [ ] CDN is configured (if applicable) and cache invalidation strategy is defined
- [ ] Auto-scaling limits are appropriate for expected traffic
- [ ] Resource limits (CPU, memory, disk) are configured and have headroom
- [ ] Network policies/firewall rules allow required traffic and block everything else
- [ ] Dependencies (databases, caches, message queues) are responsive and healthy

**Adapter notes:**
- **npm packages:** N/A for most items. Verify package publish access token is fresh.
- **Serverless functions:** Verify function concurrency limits, timeout settings, memory allocation.
- **On-prem:** Verify all servers are reachable, disk space adequate, network routes correct.

## 3. Database Readiness

**GATE: NO CRITICAL FAIL**

- [ ] 🔴 **CRITICAL:** Database backup taken before migration execution
- [ ] 🔴 **CRITICAL:** All pending migrations applied to staging and verified — do NOT skip staging
- [ ] 🔴 **CRITICAL:** Each migration has a tested DOWN (revert) path
- [ ] Migration plan accounts for table locks, long-running queries, and downtime window
- [ ] Connection pool limits accommodate migration connection overhead
- [ ] Database credentials in production are correct (tested against staging clone)
- [ ] Read replica lag is acceptable (if using read replicas)
- [ ] Indexes exist for new query patterns introduced by the change
- [ ] No N+1 queries introduced in new code paths (verify with query profiling)

**Adapter notes:**
- **npm packages / CLI tools:** N/A for most items. If the tool has a local data store, verify upgrade migration.
- **Serverless (with DB):** Verify connection pool respects serverless connection limits. Cold starts don't exhaust pool.

## 4. Security Verification

**GATE: ALL**

- [ ] No secrets, API keys, or credentials in code or version control
- [ ] `npm audit` / `pip audit` / dependency audit shows no critical or high vulnerabilities
- [ ] Input validation on all new/changed user-facing endpoints
- [ ] Authentication and authorization checks in place for new endpoints
- [ ] Rate limiting configured for authentication and public endpoints
- [ ] CORS configured to specific origins (not wildcard `*`)
- [ ] Security headers configured (Content-Security-Policy, HSTS, X-Content-Type-Options)
- [ ] No debug endpoints or verbose error messages exposed in production
- [ ] Third-party dependencies reviewed for supply chain risks

**Adapter notes:**
- **npm packages:** Verify `package.json` `files` field excludes dev-only artifacts. Check `npm publish --dry-run`.
- **CLI tools:** Verify no shell injection vectors in user-provided arguments.

## 5. Monitoring and Observability

**GATE: NO FAIL**

- [ ] Key metrics instrumented: error rate, latency (p50/p95/p99), request volume, success rate
- [ ] Business metrics instrumented: conversion rate, feature adoption, user count
- [ ] Alerts configured with defined thresholds (not "alert on everything")
- [ ] Alert thresholds validated — not too tight (false positives), not too loose (miss issues)
- [ ] Dashboards exist showing feature health at a glance
- [ ] Structured logging with correlation IDs on critical paths
- [ ] Error reporting configured and verified working (Sentry, DataDog, CloudWatch, etc.)
- [ ] Health check endpoint exists (returns 200 when all dependencies are healthy)
- [ ] Health check includes dependency status (DB, cache, message queue) — not just "ok"

**Adapter notes:**
- **npm packages:** Verify package size within budget. Verify download stats tracking if applicable. Verify telemetry opt-out respected.
- **CLI tools:** Verify `--version` and `--help` work. Verify error exit codes are consistent.

## 6. Documentation Readiness

**GATE: NO FAIL**

- [ ] CHANGELOG.md updated with all user-facing changes
- [ ] Breaking changes called out explicitly in changelog
- [ ] API documentation updated for new/changed endpoints
- [ ] README updated with any new setup requirements
- [ ] Runbooks updated for new operational procedures (restart, backup, restore)
- [ ] Architecture Decision Records (ADRs) written for significant decisions
- [ ] User-facing documentation updated (help center, docs site, release notes)
- [ ] Migration guide written if users need to take action (e.g., breaking API changes)

**Adapter notes:**
- **npm packages:** Verify README installation instructions are current. Verify API docs reflect new exports.
- **CLI tools:** Verify `--help` output is accurate for all commands.

## 7. Communication Readiness

**GATE: NO FAIL**

- [ ] Team notified of deployment schedule and expected impact
- [ ] Stakeholders informed of the release (product, support, sales)
- [ ] Support team briefed on new features and known issues
- [ ] Incident response plan is current (who is on call, how to escalate)
- [ ] Rollback communication plan defined (who to notify, what channel)
- [ ] Post-deployment monitoring responsibility assigned (who watches for the first hour)

## 8. Rollback Readiness

**GATE: ALL**

- [ ] Rollback plan exists in documented, executable form (see `rollback-plan-template.md`)
- [ ] Rollback trigger conditions are defined with specific thresholds
- [ ] Rollback has been tested in staging (actual rollback, not just "revert commit")
- [ ] Rollback time is estimated and within acceptable downtime window
- [ ] Rollback does not depend on infrastructure it might break
- [ ] Database rollback tested (DOWN migration, then UP re-applied)

## Completion

Before signing off, re-verify:
- [ ] All FAIL items are resolved or have documented risk acceptance
- [ ] All CRITICAL items are PASS
- [ ] Evidence is collected for gate-evidence-truth (see `evidence-collection-guide.md`)
- [ ] Checklist results are attached to the deployment request
