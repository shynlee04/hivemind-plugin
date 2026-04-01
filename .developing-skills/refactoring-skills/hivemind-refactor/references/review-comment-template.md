# Review Comment Template

Structured format for code review comments. Use consistently across all review dimensions.

## Template Structure

Every review comment must have these four parts:

### 1. Observation

What you see. Objective. Factual. No opinion.

> "This function takes 7 parameters, 4 of which are optional."

### 2. Evidence

File:line reference. Code snippet if needed.

> `src/api/users.ts:145` — `createUser(name, email, role, org, team, manager, permissions)`

### 3. Impact

Why it matters. Tie to a dimension (correctness, security, performance, readability, maintainability).

> "Callers must remember parameter order. Adding a 8th parameter will break every call site."

### 4. Suggestion

How to fix it. Concrete. Actionable. Not vague.

> "Extract a `CreateUserParams` object: `createUser({ name, email, role, ...options })`"

## Full Example

```
**Observation:** This function has no error handling for the async fetch call.

**Evidence:** `src/services/data.ts:23` — `const res = await fetch(url)`

**Impact:** If the network request fails, the promise rejection is unhandled. This will
crash the calling component with no user-facing error message.

**Suggestion:** Wrap in try/catch or add `.catch()` with a fallback:
```typescript
try {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
} catch (err) {
  logger.error('Failed to fetch data', { url, err });
  throw new FetchError('Data unavailable', { cause: err });
}
```
```

## Good vs Bad Comments

### Good Comment

```
**Observation:** The `processOrders` function is 85 lines with 6 levels of nesting.

**Evidence:** `src/orders.ts:120-205`

**Impact:** Readability. Takes >2 minutes to trace the control flow. Error paths
are buried 4 levels deep.

**Suggestion:** Extract the inner validation logic (lines 145-170) into
`validateOrderItem(item)`. Extract the price calculation (lines 172-190) into
`calculateItemPrice(item, discount)`. Each extraction reduces nesting by 1 level.
```

### Bad Comment — Vague

```
This function is too long. Should be refactored.
```

No evidence. No specific impact. No actionable suggestion. Rejected.

### Bad Comment — Opinion-Based

```
I don't like how this is structured. Feels wrong.
```

Subjective. No evidence. No impact analysis. Rejected.

### Bad Comment — Fix-Authoring

```
Here, let me rewrite this for you: [40 lines of replacement code]
```

Overstepping. The reviewer identifies problems; the author fixes them.
Exception: one-line fixes for obvious typos.

## Comment Categories

Tag each comment with its category:

| Tag | Meaning |
|-----|---------|
| `[must-fix]` | P0/P1 finding, blocks merge |
| `[should-fix]` | P2 finding, track in sprint |
| `[nit]` | P3 finding, optional improvement |
| `[question]` | Asking for clarification, not a finding |
| `[praise]` | Positive observation (use sparingly) |

## Usage Rules

1. **One finding per comment.** Don't bundle 3 issues in one comment.
2. **Evidence before opinion.** If you can't cite file:line, it's not a finding.
3. **Suggestion is optional for [question] and [praise].** Required for [must-fix], [should-fix], [nit].
4. **No performative language.** No "great catch!", "absolutely!", "love this!" — technical content only.
