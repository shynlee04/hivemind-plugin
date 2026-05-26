# Interface Contract Design

## Overview

When two features owned by different teams (or different agents) have an Interface (I) dependency, they need a formal contract. Without a contract, feature A builds against assumptions about feature B's API, and when B changes, A breaks with no warning.

## Contract Components

Every interface contract must define:

### 1. Parties
Who owns each side of the contract:

```markdown
**Provider:** `analytics` (owned by Data Team)
**Consumer:** `dashboard` (owned by Frontend Team)
```

### 2. Version
Semantic versioning for the contract itself:

```
Contract Version: 1.0.0
- MAJOR: breaking changes to the contract (consumer MUST update)
- MINOR: new functionality added (consumer MAY adopt)
- PATCH: clarifications, bug fixes in the contract document itself
```

### 3. Provider API Surface
The exact interface the provider MUST expose:

```markdown
### Endpoint: GET /api/v1/metrics
**Purpose:** Returns aggregated metrics for dashboard display

**Request:**
- `orgId: string` (required) — organization identifier
- `dateRange: { start: ISO8601, end: ISO8601 }` (required) — query window
- `metrics: string[]` (optional) — specific metric names; default: all
- `granularity: "hour" | "day" | "week"` (optional) — default: "day"

**Response (200):**
```json
{
  "metrics": [
    {
      "name": "revenue",
      "values": [
        { "timestamp": "2026-01-01T00:00:00Z", "value": 15000.50 }
      ]
    }
  ],
  "metadata": {
    "orgId": "org-123",
    "generatedAt": "2026-01-01T12:00:00Z"
  }
}
```

**Error Responses:**
- `400` — invalid parameters (missing orgId, invalid dateRange)
- `403` — org not authorized
- `429` — rate limit exceeded
- `500` — internal error (retryable)

**Performance SLA:**
- p50: < 100ms
- p95: < 200ms
- p99: < 500ms
- Availability: 99.9% monthly
```

### 4. Consumer Usage Pattern
How the consumer will call this API:

```markdown
**Call Frequency:** Dashboard calls `getMetrics` on page load and every 60s refresh
**Expected Volume:** ~100 requests/minute at peak
**Error Handling:**
- On 429: exponential backoff (1s, 2s, 4s, 8s, max 30s)
- On 500: retry 3 times with 1s interval, then show "Metrics unavailable" banner
- On 403: redirect to access-denied page
**Degradation Mode:** If analytics is unavailable, dashboard shows cached data (last 24h) with stale indicator
```

### 5. Change Protocol
How the contract can be modified:

```markdown
**Non-Breaking Changes (MINOR version bump):**
- Adding new endpoints
- Adding optional parameters to existing endpoints
- Adding new fields to response objects
→ Provider may deploy without consumer review. Consumer notified for awareness.

**Breaking Changes (MAJOR version bump):**
- Removing or renaming endpoints
- Removing or changing type of required parameters
- Removing or changing type of response fields
→ Provider proposes change with migration plan.
→ Consumer has 48 business hours to review and object.
→ If no objection, provider implements with N+1 deprecation window (old version stays for one release cycle).
→ Consumer must migrate within the deprecation window.

**Emergency Changes:**
- Security vulnerability fix: provider may deploy immediately, consumer notified within 4h
- Critical bug fix: provider may deploy with 24h notice, consumer must validate within 48h
```

### 6. Testing Contract
How both sides verify the contract:

```markdown
**Provider Tests:**
- Contract test suite runs against every provider deployment
- Verifies all endpoints, request/response schemas, error codes, SLA compliance

**Consumer Tests:**
- Consumer's integration tests run against provider's contract test stub
- Stub must match the contract exactly (no divergence)

**Contract Validation:**
- Both sides run a shared contract validation suite
- Located at: `.planning/contracts/analytics-dashboard/validation/`
- Run in CI for both provider and consumer repositories
```

## Contract Template

Use this template for every cross-team interface contract:

```markdown
# Interface Contract: {consumer} ↔ {provider}
**Version:** {semver}
**Date:** YYYY-MM-DD
**Status:** DRAFT | PROPOSED | LOCKED | DEPRECATED

## Parties
- **Provider:** {feature-name} (owned by {team/agent})
- **Consumer:** {feature-name} (owned by {team/agent})

## Provider API

### {endpoint-name}
**Purpose:** {1-sentence description}

**Request:**
- `{param}: {type}` ({required|optional}) — {description}

**Response:**
- `{status}` — {description}
- Body: {schema description}

## Consumer Usage

**Call Pattern:** {frequency, triggers, volume}
**Error Handling:** {how consumer handles each error code}
**Degradation Mode:** {what happens when provider is unavailable}

## Change Protocol

**Non-Breaking:** {process for MINOR changes}
**Breaking:** {process for MAJOR changes}
**Emergency:** {process for urgent changes}

## Testing

**Provider Contract Tests:** {location, run frequency}
**Consumer Integration Tests:** {location, run frequency}
**Shared Validation Suite:** {location, run frequency}

## Signatures

**Provider Owner:** {name} — {date}
**Consumer Owner:** {name} — {date}
```

## Contract Storage

Write contracts to:
```
.planning/contracts/<provider>-<consumer>-v<major>.md
```

Example: `.planning/contracts/analytics-dashboard-v1.md`

When a contract reaches MAJOR version 2, create a new file: `analytics-dashboard-v2.md`. Reference the old version in the new contract's migration notes.

## Contract Lifecycle

```
DRAFT → PROPOSED → LOCKED → DEPRECATED
  │         │          │
  │         │          └──→ Only via change protocol
  │         │
  │         └──→ Under review by both parties (48h window)
  │
  └──→ Initial draft, no commitment yet
```

### State Transitions

| From | To | Trigger |
|------|----|---------|
| DRAFT | PROPOSED | Provider submits for consumer review |
| PROPOSED | LOCKED | Consumer approves (or 48h passes without objection) |
| PROPOSED | DRAFT | Consumer objects with specific issues |
| LOCKED | DEPRECATED | New MAJOR version is LOCKED and deprecation window begins |
| DEPRECATED | (archived) | Deprecation window ends; old contract no longer valid |

## Multi-Consumer Contracts

When a provider serves multiple consumers:

1. **One contract per consumer** — each consumer may have different requirements
2. **Provider must satisfy the union** of all consumer contracts
3. **Changing a provider API** requires notifying ALL consumers
4. **New consumers** must review existing contracts to see if their needs are already met

```markdown
### Provider: `user-authentication`

| Consumer | Contract | Version | Status |
|----------|----------|---------|--------|
| `checkout` | `checkout-auth-v1` | 1.0.0 | LOCKED |
| `dashboard` | `dashboard-auth-v1` | 1.2.0 | LOCKED |
| `admin-panel` | `admin-auth-v2` | 2.0.0 | PROPOSED |
```

## Contract Negotiation

When parties disagree on an interface:

1. **Provider says "too expensive":** Consumer proposes degradation mode. Can the consumer accept a simpler interface?
2. **Consumer says "not sufficient":** Provider proposes workaround. Can the provider add fields without breaking other consumers?
3. **Both sides deadlocked:** Escalate to ecosystem-level redesign. Maybe the dependency shouldn't be Interface (I) at all — could it be Data (D) instead? Or could a new intermediary feature be inserted?

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **Verbal contract** | No written contract file exists | Write the contract. "We agreed in the meeting" is not traceable. |
| **Consumer-designed API** | Consumer writes the provider's API in isolation | Provider must sign off on the API it commits to delivering. |
| **One-sided SLA** | SLA only covers provider's responsibilities | Include consumer responsibilities: call frequency, error handling, degradation mode. |
| **No versioning** | Contract file has no version number | Always version contracts. "The contract" without a version is ambiguous. |
| **No deprecation window** | Breaking change deployed immediately | Always provide N+1 deprecation. Minimum 1 release cycle. |
| **Stale contract** | LOCKED contract doesn't match actual implementation | Re-validate contracts at each release boundary. Deprecate and replace if needed. |
