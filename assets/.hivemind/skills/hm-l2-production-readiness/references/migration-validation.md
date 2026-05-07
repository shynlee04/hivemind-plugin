# Migration Script Validation

## Validation Purpose

Verify that every database or data migration is safe, reversible, and tested across realistic scenarios. A migration that passes locally on an empty database is NOT production-ready.

## Core Principles

1. **Every UP has a DOWN** — if you can't reverse it, you can't deploy it (without explicit risk acceptance)
2. **Test on populated state** — empty-database tests hide data-related failures
3. **Idempotent or locked** — concurrent runs must not corrupt data
4. **Staging before production** — staging is the last line of defense

## Validation Protocol

### STEP A: Verify Reversibility

For every migration script, verify:

- [ ] UP path applies the intended schema/data change
- [ ] DOWN path reverses the UP path cleanly (should return to the exact state before UP)
- [ ] DOWN path does NOT depend on data that the UP path removed
- [ ] DOWN path handles the case where UP was only partially applied (defensive reversibility)
- [ ] If a migration is genuinely irreversible (DROP COLUMN, DELETE FROM), document the risk explicitly

**Test reversibility by running:**
```bash
# Apply migration
<run-migration-up>
# Verify state changed
<query-to-verify-change>
# Reverse migration
<run-migration-down>
# Verify state restored
<query-to-verify-restoration>
# Re-apply migration (should still work after rollback)
<run-migration-up>
```

**For irreversible migrations (CRITICAL — requires human approval):**
- [ ] Document WHY it is irreversible
- [ ] Document what data is being destroyed
- [ ] Document the backup strategy for destroyed data
- [ ] Document who approved the irreversible change
- [ ] Attach the irreversible flag to `gate-evidence-truth` evidence as a WAIVER, not a PASS

### STEP B: Test Edge Cases

Run migration against these scenarios:

| Scenario | What to Test | Expected Behavior |
|----------|-------------|-------------------|
| **Empty state** | No existing data | Migration completes cleanly, no errors |
| **Populated state** | Realistic data volume (not 5 rows — production-typical) | Migration completes within time window, no data loss |
| **Large data** | 10x typical volume if possible | Migration completes (may take longer), no timeout |
| **NULL values** | Columns with NULLs if adding NOT NULL constraint | Migration handles gracefully with default values or explicit error |
| **Duplicate data** | Rows that would violate new unique constraints | Migration handles with data cleanup step or explicit error |
| **Concurrent runs** | Two migration processes running simultaneously | First wins, second skips (idempotent) or first locks, second waits (locking) |
| **Partial failure** | Migration fails mid-way | System is recoverable (transactional or can be manually cleaned up) |
| **Foreign key constraints** | New constraints against existing data | Data satisfies constraints, or migration adds cleanup step |

### STEP C: Framework-Specific Validation

**Migration frameworks and their reversibility support:**

| Framework | Reversible by Default? | DOWN generation | Notes |
|-----------|----------------------|-----------------|-------|
| Prisma | Manual | Write reverse SQL | `prisma migrate diff` can generate reverse |
| TypeORM | Manual | Write reverse SQL | Check `synchronize: false` in production |
| Sequelize | Manual | Write reverse SQL | Use transactions where possible |
| Knex.js | Manual | Write reverse SQL | `.up()` and `.down()` functions |
| Alembic (Python) | Auto for simple ops | `alembic downgrade -1` | Complex ops need manual DOWN |
| Flyway | Manual | Write reverse SQL | Convention: V<version>__desc.sql for up, U<version>__desc.sql for down |
| Rails ActiveRecord | Auto for most ops | `rails db:rollback` | Some operations are irreversible by nature |
| Django | Auto for simple ops | `python manage.py migrate <app> <prev>` | Complex data migrations need manual reverse |
| Liquibase | Auto for most ops | `<rollback>` block in changeset | Complex changes need explicit rollback block |

**Adapter notes for non-database deployments:**
- **npm packages:** No DB migrations. Verify `package.json` version semantics: MAJOR = breaking, MINOR = additive, PATCH = fix. Verify `exports` map backward compatibility.
- **Serverless:** Verify infrastructure-as-code (CDK, Terraform, Pulumi, Serverless Framework) has rollback states defined. CloudFormation stack rollback triggers on failure.
- **CLI tools:** Verify config file format migration. If config format changes, old format is still readable and auto-converts.
- **File-based data stores:** Verify data file format migration. Old version files are readable and upgrade gracefully.

### STEP D: Staging Verification

- [ ] All migrations applied to staging environment BEFORE production
- [ ] Staging database is a recent production clone (not a stripped-down version)
- [ ] Migration timing measured — if it takes 30 minutes on staging, budget 30+ minutes for production
- [ ] Application functions correctly after migration (smoke tests pass, health check returns 200)
- [ ] Rollback tested: DOWN migration applied in staging, then UP re-applied, then smoke tests pass
- [ ] Continuity record captured from staging run (session ID, migration output, timestamps) → L2 evidence

## Evidence Collection for gate-evidence-truth

| Test Type | Evidence Level | What to Capture |
|-----------|---------------|-----------------|
| Unit test (migration logic) | L4 | Test file + passing output |
| Integration test (staging DB) | L3 | CI log showing migration applied and rolled back against staging |
| Staging execution with continuity record | L2 | Session journal with migration output captured |
| Production-equivalent execution | L1 | Live run in production-like env with manual verification |

## Common Failure Patterns

| Failure | Symptom | Root Cause | Fix |
|---------|---------|------------|-----|
| **DOWN fails** | Rollback errors out | DOWN script never tested | Write and test DOWN script; validate on staging |
| **Timeouts on prod** | Migration runs 10x longer than staging | Staging DB is tiny slice of production | Test against production-sized data sample |
| **Lock contention** | Migration blocks production traffic | Migration acquires exclusive lock on large table | Use batched migration, online schema change (pt-online-schema-change, gh-ost), or run during maintenance window |
| **Data corruption** | Migration succeeds but data is wrong | UP script has logical error not caught by schema validation | Add data integrity checks before/after migration: row counts, checksums, sample data verification |
| **Partial application** | System in inconsistent state | Migration not wrapped in transaction | Wrap migration in transaction (where DB supports DDL transactions); add checkpoint markers |
| **Foreign key violation** | Migration fails on constraint | New constraint not satisfied by existing data | Add data cleanup step BEFORE constraint creation; migrate data to satisfy constraint |
