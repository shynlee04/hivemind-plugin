# NFR Checklist

Non-functional requirements must be quantified and measurable. This checklist provides target values, measurement techniques, and alert thresholds for each NFR category.

## Performance

### Response Time

| Metric | Target | Alert Threshold | Measurement |
|--------|--------|-----------------|-------------|
| p50 latency | < 100ms | > 200ms | APM histogram |
| p95 latency | < 300ms | > 500ms | APM histogram |
| p99 latency | < 500ms | > 1,000ms | APM histogram |
| Tool execution | < 200ms | > 500ms | Tool timing middleware |
| Hook invocation | < 50ms | > 100ms | Hook timing middleware |

### Throughput

| Metric | Target | Scale-Out Trigger | Measurement |
|--------|--------|-------------------|-------------|
| Requests per second | > 1,000/s per instance | Sustained > 80% utilization | Load balancer metrics |
| Concurrent sessions | > 100 per instance | Session queue > 10 | Session tracker |
| Event processing | > 5,000 events/s | Queue depth > 1,000 | Queue monitoring |

### Resource Utilization

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| CPU usage | < 70% sustained | > 85% for 5 minutes |
| Memory usage | < 75% of allocation | > 90% for 2 minutes |
| GC pause time | < 50ms | > 100ms |
| Connection pool | < 80% utilized | > 95% utilized |

## Scalability

### Horizontal Scaling

| Check | Requirement | Verification |
|-------|-------------|-------------|
| Stateless compute | No session affinity required | Deploy 2+ instances, verify round-robin |
| Shared-nothing architecture | No in-process state shared between instances | Kill instance, verify no data loss |
| Auto-scale capable | Instance count adjusts to load | Trigger load test, verify scale-out |
| Partition tolerance | System operates during network partitions | Chaos test with network partitions |

### Data Scaling

| Check | Requirement | Verification |
|-------|-------------|-------------|
| Read replicas | Reads scale horizontally | Query through replica, verify data freshness |
| Write partitioning | Writes distribute across partitions | Load test with hot keys, verify distribution |
| Connection pooling | Connection count does not grow linearly with load | Monitor active connections during load test |
| Pagination | Large result sets paginated by default | Request unbounded query, verify pagination enforced |

### HiveMind-Specific Scale Targets

| Component | Scale Target |
|-----------|-------------|
| Tool execution | Stateless, scales horizontally |
| Hook chain | Per-session, no cross-session state |
| Schema validation | CPU-bound, scales with compute |
| Event log | Append-only, partitioned by session |

## Security

### Authentication & Authorization

| Check | Requirement | Verification |
|-------|-------------|-------------|
| Auth on all endpoints | Every endpoint requires valid credentials | Attempt unauthenticated request, verify rejection |
| Role-based access | Actions restricted by role | Test with insufficient role, verify denial |
| Token expiration | Tokens expire and require refresh | Wait for expiration, verify refresh required |
| Permission granularity | Permissions are fine-grained per action | Test with read-only permission, verify write denied |

### Data Protection

| Check | Requirement | Verification |
|-------|-------------|-------------|
| Encryption at rest | Sensitive data encrypted in storage | Inspect storage, verify encryption |
| Encryption in transit | TLS 1.2+ on all connections | Network scan for plaintext |
| PII handling | PII identified, classified, and protected | Audit PII fields, verify masking/tokenization |
| Secret management | No secrets in code or config files | Scan repo for secret patterns |

### OWASP Top 10 Compliance

| Risk | Mitigation | Verification |
|------|-----------|-------------|
| Injection | Parameterized queries, input validation | SQL injection test suite |
| Broken Authentication | MFA, secure session management | Auth bypass test suite |
| Sensitive Data Exposure | Encryption, minimal logging | Data leak scan |
| XXE | Disable external entity processing | XML payload test |
| Broken Access Control | RBAC with deny-by-default | Privilege escalation test |
| Misconfiguration | Hardened defaults, no debug in prod | Config audit |
| Cross-Site Scripting | Output encoding, CSP headers | XSS payload test |
| Insecure Deserialization | Type validation, schema enforcement | Deserialization exploit test |
| Known Vulnerabilities | Dependency scanning, patching cadence | `npm audit` + Snyk |
| Insufficient Logging | Structured audit log for all mutations | Log review |

## Availability

### Uptime Targets

| Tier | Target | Allowed Downtime/Year | Use Case |
|------|--------|----------------------|----------|
| Standard | 99.9% | 8.76 hours | Internal tools |
| High | 99.95% | 4.38 hours | Business-critical |
| Ultra | 99.99% | 52.6 minutes | Revenue-generating |

### Fault Tolerance

| Check | Requirement | Verification |
|-------|-------------|-------------|
| Circuit breaker | Failing dependencies isolated after threshold | Kill dependency, verify circuit opens |
| Retry with backoff | Transient failures retried with exponential backoff | Simulate transient failure, verify retry |
| Timeout enforcement | All external calls have timeouts | Remove dependency, verify timeout fires |
| Graceful degradation | Core functionality works with degraded dependencies | Kill non-critical dependency, verify core works |

### Disaster Recovery

| Check | Requirement | Verification |
|-------|-------------|-------------|
| Recovery Point Objective (RPO) | < 1 hour data loss | Backup frequency test |
| Recovery Time Objective (RTO) | < 4 hours to restore | DR drill with full restore |
| Backup verification | Backups tested monthly | Restore backup to staging |
| Runbook documented | Recovery steps written and reviewed | Runbook review cadence |

## Maintainability

### Code Quality

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| File LOC | < 300 per file | > 300 |
| Function LOC | < 50 per function | > 50 |
| Class public methods | < 10 per class | > 10 |
| Cyclomatic complexity | < 10 per function | > 15 |
| Duplication | < 3% code duplication | > 5% |

### Coupling

| Metric | Target | Verification |
|--------|--------|-------------|
| Afferent coupling (Ca) | High for stable modules | Dependency analysis tool |
| Efferent coupling (Ce) | Low for domain modules | Dependency analysis tool |
| Abstractness ratio | > 0.3 for framework layers | Structural analysis |
| Distance from main sequence | Close to (0.8, 0.2) line | Package metrics |

### Documentation

| Check | Requirement | Verification |
|-------|-------------|-------------|
| JSDoc on public APIs | All exported functions documented | JSDoc linter |
| Architecture decisions | ADRs for all significant choices | ADR directory audit |
| README per module | Setup, usage, and testing instructions | README existence check |
| Changelog maintained | Every release documented | Changelog freshness check |

### HiveMind-Specific Maintainability

| Constraint | Target |
|-----------|--------|
| Tool schema | Zero `any` types in tool args |
| CQRS boundary | Tools write, hooks read — verified by fitness function |
| SDK surface usage | No reimplementations of SDK-provided features |
| Import direction | Core never imports from tools, hooks, or plugin |

---

*This checklist is referenced by the SKILL.md NFR Checklist section. Load this file when evaluating system readiness or making performance-related architectural decisions.*
