# YAML Merge Operations

## Overview

The YAML frontmatter of `session-context-prompt.md` must be updated during each absorb session. All updates are MERGE operations — never overwrite existing values unless explicitly specified.

## Schema Compatibility Matrix

The session-context-prompt.md may contain fields from multiple sources. **All fields coexist.** Never delete unknown fields.

| Field | Source | Owner | Absorb behavior |
|-------|--------|-------|-----------------|
| `version` | absorb | absorb | INCREMENT on structural change |
| `created` | absorb | absorb | PRESERVE (set once) |
| `last_updated` | absorb | absorb | OVERWRITE with current timestamp |
| `dates_active` | absorb | absorb | APPEND today if absent |
| `sessions_count` | absorb | absorb | INCREMENT |
| `actors` | absorb | absorb | MERGE-APPEND |
| `domains` | absorb | absorb | APPEND if new |
| `complexity` | absorb | absorb | RECOMPUTE |
| `absorb_history` | absorb | absorb | APPEND entry |
| `phase` | session-context-manager | SCM | PRESERVE (do not touch) |
| `phase_index` | session-context-manager | SCM | PRESERVE |
| `checkpoint` | session-context-manager | SCM | PRESERVE |
| `session_id` | session-context-manager | SCM | PRESERVE |
| `started_at` | session-context-manager | SCM | PRESERVE |
| `pipeline` | hf-prompt-enhance | enhance | PRESERVE |
| `phases_completed` | hf-prompt-enhance | enhance | PRESERVE |
| `prompt_lineage` | hf-prompt-enhance | enhance | PRESERVE |
| `complexity_before/after` | hf-prompt-enhance | enhance | PRESERVE |
| `confidence` | hf-prompt-enhance | enhance | PRESERVE |
| Any other unknown field | any | — | PRESERVE (never delete) |

**Rule:** Absorb ONLY modifies fields it owns. All other fields pass through untouched.

## Field Catalog

### Fields Updated Every Absorb

| Field | Type | Operation | Example |
|-------|------|-----------|---------|
| `last_updated` | ISO8601 string | REPLACE | `"2026-04-09T14:30:00Z"` |
| `sessions_count` | integer | INCREMENT | `3` → `4` |
| `complexity` | integer (1-10) | RECOMPUTE | `max(existing, assessment)` |

### Fields Updated Conditionally (APPEND if new)

| Field | Type | Condition | Append Value |
|-------|------|-----------|--------------|
| `dates_active` | list of dates | Today not in list | `[..., "2026-04-09"]` |
| `actors` | list of objects | Actor name not found | `{name: "X", first_seen: "2026-04-09"}` |
| `domains` | list of strings | Domain not in list | `[..., "authentication"]` |

### Fields Updated Every Absorb (History)

| Field | Type | Operation |
|-------|------|-----------|
| `absorb_history` | list of objects | APPEND `{date, wave_count, sources_added, sections_added}` |

### Fields Updated on Structural Change

| Field | Type | Condition | Operation |
|-------|------|-----------|-----------|
| `version` | integer | Existing content modified (not just appended) | INCREMENT |

## Merge Procedure

### Step 1: Parse Existing YAML

```bash
# Extract YAML block between first two --- delimiters
awk '/^---$/{if(++f==2) exit; next} f==1' .hivemind/state/session-context-prompt.md
```

Parse into key-value pairs. Handle multi-line values (after `|` or `>` indicators).

### Step 2: Compute Updates

```
existing = parse(yaml_block)

updates = {
  last_updated: now_iso8601(),
  sessions_count: existing.sessions_count + 1,
  complexity: min(10, max(existing.complexity, assess_new_content())),
  dates_active: existing.dates_active + [today] IF today NOT IN existing.dates_active,
  actors: existing.actors + new_actors,
  domains: existing.domains + new_domains,
  absorb_history: existing.absorb_history + [{
    date: today,
    wave_count: 4,
    sources_added: count(new_sources),
    sections_added: count(new_sections)
  }],
  version: existing.version + 1 IF structural_change ELSE existing.version
}
```

### Step 3: Serialize Updated YAML

Write YAML block preserving original formatting style. Use `|` for multi-line values. Use `[item1, item2]` inline format for short lists. Use block format for long lists.

### Step 4: Validate Merge

```bash
# Check YAML still parses (delimiter balance)
awk 'BEGIN{c=0} /^---$/{c++} END{if(c%2!=0) print "FAIL"; else print "PASS"}' .hivemind/state/session-context-prompt.md

# Check sessions_count incremented
NEW_COUNT=$(awk '/^sessions_count:/{print $2}' .hivemind/state/session-context-prompt.md)
EXPECTED=$((OLD_COUNT + 1))
if [ "$NEW_COUNT" -ne "$EXPECTED" ]; then echo "FAIL: sessions_count mismatch"; fi

# Check last_updated is today
TODAY=$(date -u +%Y-%m-%d)
grep -q "last_updated:.*$TODAY" .hivemind/state/session-context-prompt.md || echo "FAIL: last_updated not today"
```

## Complexity Assessment

New content complexity is assessed on a 1-10 scale:

| Score | Criteria |
|-------|----------|
| 1-2 | Single source, no cross-references, linear narrative |
| 3-4 | Multiple sources, same domain, minor cross-references |
| 5-6 | Multiple domains, conflicting information, actor relationships |
| 7-8 | Cross-domain dependencies, temporal complexity, unresolved conflicts |
| 9-10 | Multi-system integration, high uncertainty, critical decision points |

The stored `complexity` is `max(existing_complexity, new_assessment)` capped at 10.

## Initialization (First Absorb)

When the target file exists but lacks absorb-specific fields, initialize them:

```yaml
# Add these fields to existing YAML frontmatter
dates_active: [2026-04-09]
actors: []
domains: []
sessions_count: 1
complexity: <assessed>
absorb_history:
  - date: 2026-04-09
    wave_count: 4
    sources_added: <count>
    sections_added: <count>
version: 1
```

Preserve ALL existing YAML fields. Only ADD new fields, never remove.

## Edge Cases

### Missing Fields

If `sessions_count` doesn't exist → assume 0, then increment to 1.
If `actors` doesn't exist → create empty list, then append.
If `absorb_history` doesn't exist → create list with first entry.
If `version` doesn't exist → set to 1.

### Corrupt YAML

If YAML parse fails:
1. Extract body content (everything after second `---`)
2. Reconstruct YAML from scratch using known fields
3. Log the reconstruction in absorb_history: `{note: "yaml_reconstructed"}`
4. Continue with Wave 4

### Concurrent Modification

If the file was modified between Wave 0 read and Wave 4 write:
1. Re-read the file
2. Re-apply merge operations against the new content
3. Append the absorb-session block
4. Retry up to 3 times
5. If still failing → escalate to user

## Complete Example

### Before (existing file):
```yaml
---
phase: execution
phase_index: 2
sessions_count: 2
complexity: 5
dates_active: [2026-04-07, 2026-04-08]
actors:
  - name: "Auth Service"
    first_seen: "2026-04-07"
domains: [authentication, api]
absorb_history:
  - date: 2026-04-08
    wave_count: 4
    sources_added: 3
    sections_added: 2
version: 2
last_updated: "2026-04-08T16:00:00Z"
---

# Existing Session Notes
Previous absorb covered auth module analysis.
```

### After (new absorb with 2 new URLs, 1 new actor, 1 new domain):
```yaml
---
phase: execution
phase_index: 2
sessions_count: 3
complexity: 7
dates_active: [2026-04-07, 2026-04-08, 2026-04-09]
actors:
  - name: "Auth Service"
    first_seen: "2026-04-07"
  - name: "Payment Gateway"
    first_seen: "2026-04-09"
domains: [authentication, api, payments]
absorb_history:
  - date: 2026-04-08
    wave_count: 4
    sources_added: 3
    sections_added: 2
  - date: 2026-04-09
    wave_count: 4
    sources_added: 2
    sections_added: 5
version: 2
last_updated: "2026-04-09T14:30:00Z"
---

# Existing Session Notes
Previous absorb covered auth module analysis.

<absorb-session date="2026-04-09" wave_count="4">
  <sources>
    <source type="url" path="https://docs.stripe.com/payments" extracted="true" />
    <source type="url" path="https://github.com/stripe/stripe-node" extracted="true" />
  </sources>
  <narrative>
    Payment integration follows Stripe's recommended flow with webhook verification.
    The Auth Service tokens are used for payment authorization headers.
  </narrative>
  <entities>
    <actor name="Payment Gateway" first_seen="2026-04-09" />
    <actor name="Auth Service" first_seen="2026-04-07" />
    <domain name="payments" />
  </entities>
  <timeline>
    <event date="2026-04-09" description="Payment Gateway integration requirements analyzed" />
  </timeline>
  <insights>
    Payment auth reuses existing JWT tokens from Auth Service.
    Webhook signature verification is critical for payment confirmation.
  </insights>
  <questions_open>
  </questions_open>
</absorb-session>
```

Note: `version` stayed at 2 because no structural change to existing content was needed — only appends occurred.
