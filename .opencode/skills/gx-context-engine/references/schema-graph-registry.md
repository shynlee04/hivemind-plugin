# Schema-Graph Registry — Management Protocol

> **SOT:** `docs/plans/SPEC-GX-PACK-CONTEXT-ENGINE-2026-03-02.md` § Mechanism 2+3

## Schematic Environment

The `.hivemind/state/` directory is the structured, machine-readable state layer:

| File | Owner | Purpose |
|------|-------|---------|
| `brain.json` | hivemind plugin | Session state (drift, turns, mode) |
| `hierarchy.json` | hivemind plugin | Trajectory → Tactic → Action tree |
| `todo.json` | hiveops_todo tool | Graph-linked TODO items |
| `gates.json` | hiveops_gate tool | Quality gate records |
| `enforcement.json` | hiveops-governance plugin | Delegation chain, scope violations |
| `runtime-profile.json` | gx-entry-guard.sh | Auto-constructed agent profile |
| `context-recovery.json` | gx-context-retrieve.sh | Recovery context from retrieval agent |
| `pre-purge-snapshot.json` | gx-auto-purge.sh | Snapshot before auto-purge |
| `schema-registry.json` | gx-schema-sync.sh | Schema version registry |
| `swarm-manifest.json` | gx-swarm-launch.sh | Active swarm agent manifest |
| `sot-index.json` | hiveops_sot tool | SOT artifact registry |

## Read/Write Protocol

### Write (any agent):
1. Agent calls hiveops_todo/gate/sot/export tool
2. Tool writes to `.hivemind/state/<file>.json`
3. Plugin event hook (`file.edited`) detects change
4. `gx-schema-sync.sh` runs validation
5. Schema version incremented in `schema-registry.json`

### Read (any agent):
1. `messages.transform` injects current schematic state summary
2. Agent sees: active TODO, hierarchy cursor, profile constraints
3. Agent's decisions are bounded by schematic state

## Schema Registry

```json
{
  "version": 42,
  "lastSync": 1709337600000,
  "files": {
    "todo.json": { "hash": "abc123", "version": 42, "lastModified": 1709337600000 },
    "hierarchy.json": { "hash": "def456", "version": 41, "lastModified": 1709337500000 }
  },
  "pendingSync": [],
  "conflicts": []
}
```

## Git Sync

When schema files change:
1. Validate JSON structure
2. Compute SHA-256 hash
3. Compare with registry
4. If changed: update registry, increment version
5. If conflict: write to `conflicts[]` and block
