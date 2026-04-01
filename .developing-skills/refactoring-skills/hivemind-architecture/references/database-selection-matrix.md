# Database Selection Matrix

Decision framework for choosing persistence technologies based on data model, query patterns, consistency needs, and scale requirements.

## Technology Comparison

| Criterion | SQL (PostgreSQL) | Document (MongoDB) | Key-Value (Redis) | Graph (Neo4j) | Time-Series (InfluxDB) |
|-----------|------------------|--------------------|--------------------|----------------|-----------------------|
| **Data Model** | Relational tables | JSON documents | Key → Value pairs | Nodes + Edges | Time-stamped measurements |
| **Schema** | Fixed, enforced | Flexible, optional | None (blob) | Flexible | Fixed per series |
| **Query Flexibility** | High (SQL, joins) | Medium (field queries) | Low (key lookup) | High (traversal) | Medium (time-bounded) |
| **Consistency** | Strong (ACID) | Configurable | Eventual | Configurable | Eventual |
| **Horizontal Scale** | Hard (sharding) | Easy (auto-sharding) | Easy (partitioning) | Hard | Easy (partitioning) |
| **Best For** | Complex relations, transactions | Evolving schemas, documents | Caching, sessions | Relationships, graphs | Metrics, monitoring |
| **Worst For** | Unstructured data, rapid schema change | Complex transactions, joins | Complex queries | Simple CRUD | Relationship traversal |

## Selection Decision Tree

```
1. What is the primary data model?
   ├─ Structured with relationships → SQL
   ├─ Semi-structured, evolving → Document
   ├─ Simple lookup by key → Key-Value
   ├─ Dense relationship graph → Graph
   └─ Time-ordered measurements → Time-Series

2. What consistency is required?
   ├─ Strong (ACID) → SQL or Document with transactions
   └─ Eventual → Any, choose based on other criteria

3. What is the query pattern?
   ├─ Complex joins → SQL
   ├─ Field-level filtering → Document
   ├─ Traversal (depth > 2) → Graph
   ├─ Key-only lookup → Key-Value
   └─ Time-range aggregation → Time-Series

4. What is the scale requirement?
   ├─ Low volume, single instance → SQL or Document
   ├─ High volume, horizontal scale → Document, Key-Value, or Time-Series
   └─ Relationship-heavy at scale → Graph with careful sharding
```

## Detailed Selection by Use Case

### Use Case: Session State

**Recommendation:** Key-Value (Redis)

**Rationale:** Session state is accessed by key, has short TTL, and requires sub-millisecond reads. No complex queries needed.

**HiveMind context:** OpenCode manages sessions natively via `client.session.*`. Do not create a parallel session store.

### Use Case: Event Log

**Recommendation:** SQL (PostgreSQL) or Document (MongoDB)

**Rationale:** Events are append-only but need temporal queries, filtering by type, and aggregation. SQL provides strong ordering guarantees. Document stores handle schema evolution well.

**HiveMind context:** Trajectory events are managed by the runtime tools. The event log is a key architecture artifact in the CQRS boundary.

### Use Case: Configuration & Settings

**Recommendation:** SQL or Document

**Rationale:** Configuration is read-heavy, write-rare, and structured. SQL provides validation through schema. Document stores allow flexible config shapes.

**HiveMind context:** `opencode.json` is the configuration source. Do not create a database for config that belongs in the file system.

### Use Case: Audit Trail

**Recommendation:** SQL (append-only table) or Time-Series

**Rationale:** Audit events are immutable, time-ordered, and need to be queryable by entity, action, and time range. Append-only SQL tables are simple and reliable.

### Use Case: Task & Workflow State

**Recommendation:** SQL (PostgreSQL)

**Rationale:** Tasks have complex state machines, relational dependencies (parent/child tasks), and require transactional consistency for state transitions.

**HiveMind context:** Task state is managed by `hivemind_task` tool. The workflow/task hierarchy has relational structure suited to SQL thinking.

### Use Case: Full-Text Search

**Recommendation:** Dedicated search engine (Elasticsearch, Meilisearch) or SQL with full-text extension

**Rationale:** Full-text search requires inverted indexes, stemming, and relevance ranking. SQL FTS extensions work for moderate volumes. Dedicated engines for large corpora.

### Use Case: Relationship-Heavy Data

**Recommendation:** Graph (Neo4j) or SQL with adjacency lists

**Rationale:** When queries involve traversing relationships at depth > 2 (e.g., "find all tasks downstream of this workflow in any hierarchy"), graph databases excel.

**HiveMind context:** Trajectory traversal could benefit from graph thinking, but current scale does not warrant a graph database. Use in-memory traversal.

## Polyglot Persistence Guidance

When a system needs multiple database types:

1. **One primary database** for transactional data (usually SQL)
2. **Caches** for read-heavy, short-lived data (Key-Value)
3. **Search indexes** for full-text queries (Elasticsearch)
4. **Analytics stores** for reporting (Columnar or Time-Series)

### Anti-Pattern: Database per Microservice by Default

Do NOT automatically assign a separate database per service. Shared databases are acceptable when:
- Services are within the same bounded context
- Data ownership is clear (one service owns the data, others read via API)
- The operational cost of separate databases outweighs the coupling risk

## HiveMind Ecosystem Guidance

Within the HiveMind ecosystem:

| Storage Need | Recommended Approach | Reason |
|-------------|---------------------|--------|
| Plugin configuration | `opencode.json` (file) | SDK-native |
| Session state | `client.session.*` | SDK-native |
| Event log | `.hivemind/` JSON files | File-based, append-friendly |
| Task state | `.hivemind/activity/` JSON | File-based, structured |
| Trajectory | `.hivemind/trajectory/` JSON | File-based, sequential |
| Tool schema | `tool.schema` (Zod) | In-process validation |
| Temporary state | In-memory | No persistence needed |

**Key principle:** HiveMind is a single-process plugin. Do not introduce database dependencies. Use the file system and SDK-provided state management.

---

*This matrix is referenced by the SKILL.md Pattern Selection Decision Tree section. Load this file when making persistence technology decisions.*
