# XML Body Schema

## Overview

Absorbed content is appended to the body of `session-context-prompt.md` using structured XML blocks. Each absorb session produces one `<absorb-session>` element containing structured sub-elements.

## Root Element

```xml
<absorb-session date="YYYY-MM-DD" wave_count="4">
  <!-- Child elements -->
</absorb-session>
```

### Attributes

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `date` | ISO date | Yes | Date of the absorb session (YYYY-MM-DD) |
| `wave_count` | integer | Yes | Number of waves completed (typically 4) |

## Child Elements

### `<sources>`

Container for all input sources processed during this absorb.

```xml
<sources>
  <source type="url" path="https://example.com/doc" extracted="true" />
  <source type="url" path="https://example.com/behind-paywall" extracted="false" failure_reason="403 Forbidden" />
  <source type="file" path="src/auth/login.ts" extracted="true" />
  <source type="file" path="docs/architecture.md" extracted="true" depth="SCAN" />
  <source type="text" path="inline:user-message-paragraph-3" extracted="true" />
</sources>
```

#### `<source>` Attributes

| Attribute | Type | Required | Values | Description |
|-----------|------|----------|--------|-------------|
| `type` | enum | Yes | `url`, `file`, `text` | Source type classification |
| `path` | string | Yes | URL, file path, or inline reference | Source identifier |
| `extracted` | boolean | Yes | `true`, `false` | Whether content was successfully extracted |
| `failure_reason` | string | Only if extracted=false | Any string | Why extraction failed |
| `depth` | enum | Only for type=file | `SKIM`, `SCAN`, `DEEP` | Reading depth used |

### `<narrative>`

Synthesized narrative from Wave 2B. Contains prose text organized into paragraphs.

```xml
<narrative>
  <main_story>Payment integration follows Stripe's recommended server-side flow.</main_story>

  <subplot name="webhook-integration">
    Webhook endpoints must verify Stripe signatures before processing events.
    The verification uses the STRIPE_WEBHOOK_SECRET environment variable.
  </subplot>

  <subplot name="auth-reuse">
    Existing JWT tokens from the Auth Service are reused for payment API authorization.
    No separate payment auth is needed.
  </subplot>
</narrative>
```

#### `<narrative>` Sub-elements

| Element | Required | Description |
|---------|----------|-------------|
| `<main_story>` | Yes | 1-3 sentence summary of the main narrative |
| `<subplot>` | No, repeatable | Named sub-plots with prose content. Has `name` attribute. |

### `<entities>`

Structured list of actors and domains discovered during this absorb.

```xml
<entities>
  <actor name="Payment Gateway" first_seen="2026-04-09" type="external-service" />
  <actor name="Auth Service" first_seen="2026-04-07" type="internal-module" />
  <actor name="John Developer" first_seen="2026-04-09" type="person" />
  <domain name="payments" />
  <domain name="webhooks" />
  <domain name="authentication" status="previously-known" />
</entities>
```

#### `<actor>` Attributes

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | Yes | Unique actor identifier |
| `first_seen` | date | Yes | ISO date when actor first appeared |
| `type` | enum | No | `person`, `team`, `internal-module`, `external-service`, `system`, `concept` |

#### `<domain>` Attributes

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | Yes | Domain/topic name |
| `status` | enum | No | `new`, `previously-known` (defaults to `new`) |

### `<timeline>`

Chronologically ordered events extracted from the input.

```xml
<timeline>
  <event date="2026-04-07" description="Auth module audit began" confidence="confirmed" />
  <event date="2026-04-08" description="JWT token flow documented" confidence="confirmed" />
  <event date="2026-04-09" description="Payment integration requirements gathered" confidence="confirmed" />
  <event date="2026-04-10" description="Webhook implementation expected" confidence="inferred" />
</timeline>
```

#### `<event>` Attributes

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `date` | date or date-range | Yes | When the event occurred or will occur |
| `description` | string | Yes | What happened |
| `confidence` | enum | Yes | `confirmed` (sourced), `inferred` (from context), `speculative` (best guess) |

### `<insights>`

Key findings, cross-references, and synthesis results.

```xml
<insights>
  <finding source="cross-ref" confidence="high">
    Payment auth reuses existing JWT tokens from Auth Service.
    Evidence: stripe-node docs show Bearer token pattern; login.ts exports token generator.
  </finding>

  <finding source="url-extraction" confidence="high">
    Webhook signature verification is critical for payment confirmation.
    Evidence: Stripe docs require signature verification on all webhook endpoints.
  </finding>

  <finding source="narrative-synthesis" confidence="medium">
    The payment flow appears to be in early planning stage based on the questions asked.
    Evidence: No implementation code found, only requirements documents.
  </finding>
</insights>
```

#### `<finding>` Attributes

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `source` | enum | Yes | `url-extraction`, `file-scan`, `cross-ref`, `narrative-synthesis`, `clarification` |
| `confidence` | enum | Yes | `high`, `medium`, `low` |

### `<questions_open>`

Unresolved ambiguities from Wave 3. May be empty.

```xml
<questions_open>
  <question id="q1" source="https://docs.stripe.com/webhooks" asked_user="false">
    Does the webhook endpoint need idempotency handling?
    Stripe docs mention it but the requirements don't specify.
  </question>

  <question id="q2" source="src/auth/login.ts" asked_user="true" answer="deferred">
    Should payment tokens have a shorter TTL than auth tokens?
    User deferred this decision.
  </question>
</questions_open>
```

#### `<question>` Attributes

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Unique question identifier within this absorb (q1, q2, ...) |
| `source` | string | Yes | URL or file path where ambiguity was found |
| `asked_user` | boolean | Yes | Whether this was asked in Wave 3 |
| `answer` | enum | No | `resolved`, `deferred`, `unanswerable` |

## Nesting Rules

1. `<absorb-session>` is always a top-level element in the body
2. Child elements MUST appear in this order: `sources`, `narrative`, `entities`, `timeline`, `insights`, `questions_open`
3. All child elements are optional EXCEPT `sources` and `narrative`
4. Multiple `<absorb-session>` blocks are separated by blank lines
5. No nested `<absorb-session>` elements

## Content Encoding Rules

1. Escape XML special characters in text content: `&` → `&amp;`, `<` → `&lt;`, `>` → `&gt;`
2. Do not use CDATA sections — use entity escaping instead
3. Code snippets go inside `<finding>` or `<narrative>` prose, wrapped in backtick-style markers
4. URLs in attribute values do NOT need escaping (they're quoted)
5. Long prose in elements: use multiple lines, no wrapping within XML tags

## Validation Checklist

After constructing the XML block:

```
[ ] <absorb-session> has date and wave_count attributes
[ ] <sources> present with at least one <source>
[ ] Every <source> has type, path, and extracted attributes
[ ] <narrative> present with <main_story>
[ ] <entities> lists all actors mentioned in <narrative>
[ ] <timeline> events are in chronological order
[ ] <insights> findings cite their source
[ ] <questions_open> present (may be empty)
[ ] No unescaped XML special characters in text content
[ ] Child elements in correct order
```
