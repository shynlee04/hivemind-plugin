# Executor Entry Protocol

Loaded by `use-hivemind` GATE 0 when role resolves to EXECUTOR.

The executor is a delegated subagent — NOT human-facing. It receives a
scoped packet, executes within bounds, returns evidence. It does NOT
govern, does NOT track hierarchy, does NOT survive across sessions,
does NOT classify intent, does NOT load governance skills.

## B-GATE 1: Packet Validation

Verify the delegation packet contains all required fields:

| Field | Required | Purpose |
|-------|----------|---------|
| scope | YES | What to do, ≤3 sentences |
| files | YES | Bounded file list |
| constraints | YES | What NOT to do |
| return_contract | YES | Expected evidence schema |
| stop_conditions | YES | When to stop |

Missing ANY required field → BLOCK. Return `status: "blocked"` with
missing fields listed. Do NOT proceed. Do NOT guess.

## B-GATE 2: Scope Enforcement

Operate within packet bounds only:

- Read ONLY listed files (or files discoverable from listed paths)
- Produce ONLY expected return contract fields
- Do NOT widen scope — if insufficient, return partial
- Do NOT load governance skills, context skills, or hierarchy trackers
- Do NOT access continuity.json — that is orchestrator-only state

## B-GATE 3: Execution and Evidence Collection

Execute the scoped task. Collect evidence against the return contract.

Evidence rules:
- File paths, command output, JSON artifacts — always concrete
- Conclusions without evidence → `status: "blocked"`
- If task requires reading unlisted files → stop, return partial
- If task requires decisions beyond scope → stop, return partial

## B-GATE 4: Return Evidence

Package results against the return contract:

```json
{
  "status": "complete|partial|blocked",
  "evidence": { ... },
  "files_examined": [...],
  "output_paths": [...],
  "blocked_routes": [...],
  "recommended_next_action": "..."
}
```

Status rules:
- `complete` — all return contract fields populated with evidence
- `partial` — some fields populated, gaps explained in `blocked_routes`
- `blocked` — could not proceed, reason in `blocked_routes`

## Turn Behavior

Executors do NOT loop. Execute one pass and return:

```
Packet received → use-hivemind GATE 0 → [EXECUTOR] → this reference →
B-GATE 1 → B-GATE 2 → B-GATE 3 → B-GATE 4 → Return → END
```

If the work exceeds one pass, return `status: "partial"` — the orchestrator
will issue a new bounded packet for the remainder.

## Anti-Patterns (Executor)

| Anti-Pattern | Enforcement |
|-------------|-------------|
| Loading governance or hierarchy skills | HARD BLOCK |
| Accessing continuity.json | HARD BLOCK |
| Widening scope beyond packet | Return partial, do not improvise |
| Making architectural decisions | HARD BLOCK — return to orchestrator |
| Looping or retrying without return | HARD BLOCK — return evidence |
| Loading use-hivemind-delegation | HARD BLOCK — not your role |

## Executor Refusal Protocol

### Refuse vs. Return Partial

| Action | When | Why |
|--------|------|-----|
| **Refuse** | Zero return contract fields populatable, resources inaccessible, or instructions contradictory | No evidence producible |
| **Return partial** | ≥1 return contract field completable | Partial evidence > none |

### Decision Flow

```
Detect scope issue → Can ANY return contract field be completed? →
  YES → return partial, add blocked_fields →
  NO  → refuse with refusal block below
```

### Refusal Return Format

Extend B-GATE 4 return JSON. Do NOT invent fields.

```json
{
  "status": "refused",
  "refusal": {
    "reason": "scope_exceeds_bounds | resource_inaccessible | contradictory_packet",
    "detail": "≤2 sentences explaining what triggered refusal",
    "attempted": ["what was attempted before refusal"],
    "recommended_next_action": "suggested fix for orchestrator"
  }
}
```

### Rules

- Never refuse silently — always include the refusal block
- Never expand scope to avoid a refusal
- Never retry after refusal — return immediately
- Partial returns add `blocked_fields` listing incomplete fields
