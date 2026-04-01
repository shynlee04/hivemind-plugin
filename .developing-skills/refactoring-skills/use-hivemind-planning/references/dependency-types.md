# Dependency Types

Classify every dependency edge in the plan graph. Type determines whether slices can run in parallel.

## Taxonomy

### Hard Dependency (Sequential)

| Attribute | Value |
|-----------|-------|
| **Definition** | Slice B cannot start until Slice A completes |
| **Parallelism** | None — must be sequential |
| **Edge type** | `depends-on` |

**Detection signals:**
- Slice B imports types or functions defined in Slice A
- Slice B's `in_scope` includes files that Slice A modifies
- Slice B's gate requires output artifacts from Slice A
- Slice B tests assert on behavior implemented in Slice A

**Resolution:**
- Order sequentially in the plan — A before B
- Mark A's `parallel_safe: false` dependents explicitly
- Critical path includes all hard dependency chains

**Example:**
```json
{ "from": "03-tool-migration", "to": "01-types", "type": "depends-on" }
```
Tool migration imports types defined in the foundation phase. Cannot start until types are committed.

### Soft Dependency (Partial Parallelism)

| Attribute | Value |
|-----------|-------|
| **Definition** | Slice B can start but cannot fully complete until Slice A finishes |
| **Parallelism** | Partial — B can begin with interfaces/stubs |
| **Edge type** | `soft-depends` |

**Detection signals:**
- Slice B uses an interface that Slice A implements, but can work against a stub
- Slice B and Slice A share a type file, but B only reads while A writes
- Slice B's gate doesn't require A's output — only the final integration does

**Resolution:**
- Allow parallel start — B works against contracts/interfaces
- B's gate may need a "final integration" step after A completes
- Document the stub or interface B expects in the slice `description`

**Example:**
```json
{ "from": "04-ui-components", "to": "02-api-contracts", "type": "soft-depends" }
```
UI components can start building against API contracts (interfaces/types) before the API implementation is complete.

### Resource Dependency (Shared Contention)

| Attribute | Value |
|-----------|-------|
| **Definition** | Two slices compete for the same resource — file, agent, or API |
| **Parallelism** | Serialized access — cannot modify the same resource concurrently |
| **Edge type** | `shares-resource` |

**Detection signals:**
- Two slices' `in_scope` lists overlap on the same file
- Two slices need the same agent (e.g., both dispatch to `hiveq`)
- Two slices call the same external API with rate limits
- Two slices modify the same configuration entry

**Resolution:**
- If one slice only reads → soft dependency (safe to parallel)
- If both write → serialize with hard dependency or merge into one slice
- If shared resource is an agent → batch into one wave, not parallel dispatch

**Example:**
```json
{ "from": "05-config-update", "to": "03-config-parsing", "type": "shares-resource", "resource": "opencode.json" }
```
Both slices modify `opencode.json`. They must run sequentially to avoid merge conflicts.

### Cross-Team Dependency (External Blocker)

| Attribute | Value |
|-----------|-------|
| **Definition** | Work depends on another team, agent, or external system completing first |
| **Parallelism** | Blocked until external dependency resolves |
| **Edge type** | `external-blocks` |

**Detection signals:**
- Slice requires a library update from npm
- Slice depends on an API endpoint that another team maintains
- Slice needs a configuration change from the user
- Slice requires an MCP server to be available

**Resolution:**
- Add a blocking slice that verifies the external dependency is ready
- Set `parallel_safe: false` and add to critical path
- If external dependency has no ETA, flag as `blocked` in plan status
- Document the external contact point or verification command in the slice

**Example:**
```json
{ "from": "06-auth-integration", "to": "external-oauth-provider", "type": "external-blocks" }
```
Auth integration requires the OAuth provider to be configured. User must provide credentials before this slice can dispatch.

## Dependency Graph Rules

### Building the Graph

1. List all slices
2. For each pair, check: shared files? shared types? output→input relationship?
3. Assign edge type based on taxonomy above
4. Topological sort for execution order
5. Critical path = longest sequential chain of hard dependencies
6. Parallel candidates = slices with zero in-degree (no incoming edges)

### Circular Dependency Prevention

Circular dependencies are always a decomposition error. They mean the slices should be merged.

**Detection:**
```
A → B → C → A  ← CIRCULAR — merge A, B, C into one slice or split shared interfaces
```

**Resolution:**
1. Find the shared interface causing the cycle
2. Extract it into a separate foundation slice (0-foundation pattern)
3. All three original slices depend on the foundation — cycle broken

### Parallel Dispatch Safety

Two slices can dispatch in parallel only if:
- No hard dependency between them (in either direction)
- No shared resource where both write
- No transitive hard dependency through intermediate slices

If any condition fails → sequential dispatch.

## Usage in Plan Records

Dependency edges appear in the plan record's `dependency_graph`:

```json
{
  "dependency_graph": {
    "critical_path": ["01", "03", "05"],
    "parallel_waves": [["01", "02"], ["03"]],
    "edges": [
      { "from": "03", "to": "01", "type": "depends-on" },
      { "from": "04", "to": "02", "type": "soft-depends" },
      { "from": "05", "to": "03", "type": "shares-resource", "resource": "config.json" },
      { "from": "06", "to": "external-api", "type": "external-blocks" }
    ]
  }
}
```
