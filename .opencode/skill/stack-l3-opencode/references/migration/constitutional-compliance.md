# Migration Guide: Constitutional Compliance

> **Applies to:** `stack-l3-opencode` skill package | **Date:** 2026-05-10 | **Status:** ACTIVE

## Why the Authority Model Changed

The original `stack-l3-opencode` skill treated its bundled 22,771-line source pack as ground truth. This created a constitutional violation: **bundled assets are frozen at ingest time and cannot reflect post-ingest SDK changes.**

OpenCode SDK updates frequently. A bundled reference verified against v1.14.44 becomes misleading — not wrong, but potentially outdated — the moment `@opencode-ai/plugin` or `@opencode-ai/sdk` ships a new version. Key behavioral claims (like `context.ask()` returning Effect, `tool()` being an identity function, or the Zod reliability matrix) are version-sensitive and cannot be trusted without live verification.

### The Problem

| Issue | Impact |
|-------|--------|
| Bundled source treated as ground truth | Code written against stale patterns breaks at runtime |
| No staleness detection | Consumers unknowingly use outdated API signatures |
| No version drift detection | Bundled v1.14.44 references used against v1.15+ runtime |
| No live verification mandate | Production code shipped without checking current behavior |

### The Solution: Two-Tier Trust

The new model separates **orientation** (bundled) from **verification** (live):

- **Reference Tier** (bundled): Use for understanding architecture, patterns, and historical context. Fast, always available.
- **Validation Tier** (live): Use for confirming API signatures, behavioral claims, and version-sensitive details. Requires MCP tools.

## How to Use Bundled References

### ✅ Safe Uses (No Live Verification Needed)

- Understanding the overall architecture of OpenCode plugin system
- Learning how hooks compose with each other conceptually
- Reading about session lifecycle states for orientation
- Reviewing the Zod reliability matrix to understand *why* certain types fail (but not trusting it for *which* types currently fail)
- Navigating the codebase structure for exploration

### ❌ Unsafe Uses (Live Verification REQUIRED)

- Using an API signature from bundled docs in production code
- Trusting a behavioral claim (e.g., "tool() is an identity function") without checking current version
- Implementing a hook based on the documented output shape
- Using the Zod reliability matrix to decide which types to use in a tool schema
- Making architectural decisions based on bundled patterns

## How to Validate Against Live Sources

### Step 1: Check Version Drift

```bash
# Compare bundled version against installed
npm list @opencode-ai/plugin @opencode-ai/sdk
```

If the output version differs from `metadata.json` `version` field → **live verification mandatory**.

### Step 2: Check Staleness

Read `metadata.json` `ingest_date`. Calculate days since ingest:

| Days Since Ingest | Severity | Required Action |
|-------------------|----------|-----------------|
| ≤ 1 | Fresh | Bundled references reasonably current; live verification recommended but not critical |
| 2–7 | Warning | Live verification recommended before production use |
| 8–30 | HIGH | MUST live-verify before any production decision |
| > 30 | CRITICAL | Treat all bundled claims as potentially outdated |

### Step 3: Live Verification via MCP Tools

| What You Need to Verify | Tool Chain |
|--------------------------|------------|
| API signature (function type, params) | `context7_resolve_library_id` → `context7_query_docs` |
| Architecture pattern or design decision | `deepwiki_ask_question` on `anomalyco/opencode` |
| Specific source code behavior | `gitmcp_search_github_com_code` or `github_get_file_contents` |
| Full repo at specific version | `repomix_pack_remote_repository` with branch/tag |

### Step 4: Record Verification

After live verification, note in your findings:
- Which tool was used
- What version was verified against
- Whether the bundled claim was confirmed or outdated

## Version Drift Detection Protocol

```
1. Read metadata.json → version field (e.g., "1.14.44")
2. Read metadata.json → ingest_date field (e.g., "2026-05-10")
3. Run: npm list @opencode-ai/plugin @opencode-ai/sdk
4. Compare:
   - If versions MATCH and staleness ≤ 7 days → bundled references valid for orientation
   - If versions DIFFER → WARN consumer, require live verification
   - If staleness > 7 days → treat as HIGH severity regardless of version match
5. Before production use → always run at least one live verification check
```

## Migration Checklist for Consumers

- [ ] Update any code that treated bundled references as terminal authority
- [ ] Add version drift checks before using stack-opencode patterns in production
- [ ] Replace "grep the bundled source" with "verify via live MCP tool" in workflows
- [ ] Update any quality gates that relied solely on bundled reference accuracy
- [ ] Configure MCP tool access (Context7, DeepWiki, GitHub) for live verification
- [ ] Review the new Self-Correction section in SKILL.md for updated procedures

## Summary

**Before:** Bundled = truth, live = optional
**After:** Bundled = orientation, live = truth

The bundled source pack remains valuable for understanding *why* things work the way they do. But *whether* they still work that way in your installed version requires live verification. This is not a limitation — it's a safety protocol.
