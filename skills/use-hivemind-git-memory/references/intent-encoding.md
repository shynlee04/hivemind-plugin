# Intent Encoding

## What is Intent Encoding?
Intent encoding transforms a decision or rationale into a structured git commit that can be retrieved semantically later.

## Encoding Format
```
intent: <concise description>

Session: <session-id>
Type: semantic-anchor
Timestamp: <ISO-8601>
```

## Key Principles
1. **Atomic**: One decision per commit
2. **Semantic**: Subject line contains the intent, not just the change
3. **Retrievable**: Include searchable keywords in commit message
4. **Linked**: Include session ID for traceability

## Good Intent Messages
- `intent: defer auth to later because current scope is data processing`
- `intent: use zustand because context API overhead is too high`
- `intent: split into two packages to avoid circular dependency`

## Bad Intent Messages
- `fix bug` - no intent
- `update config` - no rationale
- `wip` - meaningless
