# Bounded-Slice Template

**Template Version:** 1.0
**Created:** 2026-03-21
**Phase:** 03-tui-e2e-server-connection
**Pattern:** Module completion slice template

---

## Slice Header

**Phase Context:** Phase 3 - Module-by-Module Completion Loop
**Module Name:** `{MODULE_NAME}`
**Bounded Scope Statement:** `{One sentence defining what this slice covers and what it explicitly excludes.}`

---

## Ownership Section

### Authoritative Owner

- **src/ directory:** `{e.g., src/tools/runtime/}`
- **Rationale:** `{Why this directory owns the module}`

### Thin Adapter Policy

The following **MUST NOT** appear in adapters:
- Direct Node.js `fs`, `path`, `process` imports (use SDK equivalents)
- Business logic or state management
- Direct runtime state mutations

### Integration Seam

**Upstream dependencies** (what this module depends on):
- `{list of src/ modules or external contracts}`

**Downstream consumers** (what depends on this module):
- `{list of src/ modules that import from this module}`

---

## Completion Criteria

### Source Ownership Clarity

| Criterion | Evidence Required |
|-----------|-------------------|
| All module code lives in authoritative src/ directory | File location audit |
| No cross-module direct imports (only through contracts) | Import path analysis |
| Thin adapter pattern enforced | Adapter content check |

### Integration Path

| Flow | Path | Validation |
|------|------|------------|
| Data IN | `{how data enters the module}` | `{proof method}` |
| Data OUT | `{how data exits the module}` | `{proof method}` |
| Control | `{how control flows}` | `{proof method}` |

### Validation Evidence

| Evidence Lane | Standard | Required Proof |
|---------------|----------|---------------|
| **Local diagnostics** | VER-01 | `{what local checks apply}` |
| **Integration checks** | VER-02 | `{what integration tests apply}` |
| **Live official-interface proof** | VER-03 | `{what live proof is required}` |

**Proof Standard:** `{Define which lanes are mandatory for this module}`

**Non-live labeling:** If live official-interface proof is not yet available, the completion claim MUST be labeled: `[non-live evidence]` with explicit justification.

---

## Evidence Lane Specification

### Mandatory Evidence Lane Selection

Every bounded slice MUST explicitly declare which evidence lanes apply:

| Evidence Lane | Standard | Required | Justification if Skipped |
|--------------|----------|----------|--------------------------|
| **Local diagnostics** | VER-01 | ALWAYS | N/A |
| **Integration checks** | VER-02 | Conditional | Module has no integration paths OR |
| **Live official-interface proof** | VER-03 | Conditional | Live proof unavailable because |

### Evidence Lane Selection Table (Module-Specific)

```
| Evidence Lane | Required | Justification if Skipped |
|--------------|----------|--------------------------|
| Local diagnostics (VER-01) | YES/NO | N/A or reason |
| Integration checks (VER-02) | YES/NO | Module has no integration paths OR |
| Live official-interface proof (VER-03) | YES/NO | Live proof unavailable because |
```

### Non-Live Evidence Labeling Rule

Any completion claim that cannot provide live official-interface proof MUST:
- Include the label `[non-live evidence]` in the completion artifact
- Provide explicit justification for why live proof is unavailable
- State what live proof would be required to upgrade to full evidence

### Evidence Upgrade Path

For each `[non-live evidence]` item, document:

| Item | Current Evidence | Why Blocked | What Would Enable Live Proof |
|------|-----------------|-------------|----------------------------|
| `{item}` | `{type}` | `{reason}` | `{required condition}` |

---

## Exit Gate

**The following must be TRUE before authorizing the next slice:**

1. [ ] Source ownership is unambiguous (files in correct directories, no mixed ownership)
2. [ ] Integration paths are documented and tested
3. [ ] Validation evidence meets the required proof standard
4. [ ] Runtime-facing claims have either:
   - Live official-interface proof, OR
   - Explicit `[non-live evidence]` labeling with justification
5. [ ] Adapter thinness verified (no business logic in adapters)
6. [ ] **Evidence Lane Specification is complete:**
   - [ ] Local diagnostics (VER-01) lane selected or explicitly not applicable
   - [ ] Integration checks (VER-02) lane selected or explicitly not applicable
   - [ ] Live official-interface proof (VER-03) lane selected with live proof OR labeled `[non-live evidence]`
7. [ ] **All `[non-live evidence]` items have:**
   - [ ] Explicit justification for why live proof is unavailable
   - [ ] Clear statement of what would enable live proof upgrade

---

## Worked Example: Runtime Entry Module Slice

### Slice Header

**Phase Context:** Phase 3 - Module-by-Module Completion Loop
**Module Name:** Runtime Entry Tools
**Bounded Scope Statement:** Covers the runtime entry tools in `src/tools/runtime/` that provide `hivemind_runtime_status` and `hivemind_runtime_command`. Does not include SDK supervisor observability or session state management.

---

### Ownership

**Authoritative Owner:** `src/tools/runtime/`

**Rationale:** This directory owns all runtime entry point tools following the tool pattern established in Phase 1 dual-plane architecture. The SDK control-plane provides the `client.session`, `client.tool`, and `client.app` surfaces; this module provides the runtime-facing entry points.

**Thin Adapter Policy:** Adapters in this module MUST NOT contain:
- Direct Node.js `fs` or `path` imports (use SDK `client.file` equivalents)
- Session state management (delegate to `src/core/` or `client.session`)
- Business logic beyond tool argument parsing and result formatting

**Integration Seam:**
- **Upstream:** `src/shared/` for shared types and contracts; `src/sdk-supervisor/` for runtime observability hooks
- **Downstream:** Workflow and tasking modules consume runtime entry tools

---

### Completion Criteria

#### Source Ownership Clarity

| Criterion | Evidence |
|-----------|----------|
| All runtime tools in `src/tools/runtime/` | File location audit |
| No session state in tools (delegated to SDK client) | Import path analysis |
| Thin adapters only (argument parsing + result formatting) | Adapter content check |

#### Integration Path

| Flow | Path | Validation |
|------|------|------------|
| Tool invocation | `client.tool.*` → tool execute | CLI invocation test |
| Runtime status | SSE connection via SDK | `hivemind_runtime_status` output |
| Command execution | `client.tool` with args | `hivemind_runtime_command` output |

#### Validation Evidence

| Lane | Standard | Required Proof |
|------|----------|----------------|
| Local diagnostics | VER-01 | Type check (`npx tsc --noEmit`), lint clean |
| Integration checks | VER-02 | Tool responds to CLI invocation with correct output |
| Live official-interface proof | VER-03 | SSE connection established to runtime |

#### Evidence Lane Selection (Runtime Entry Module)

| Evidence Lane | Required | Justification |
|--------------|----------|---------------|
| Local diagnostics (VER-01) | **YES** | Type check + lint always required |
| Integration checks (VER-02) | **YES** | Tool connects to sdk-supervisor and schema-kernel |
| Live official-interface proof (VER-03) | **YES** | Runtime status tool claims runtime attachment state |

#### [non-live evidence] Items (Runtime Entry Module)

| Item | Current Evidence | Why Blocked | What Would Enable Live Proof |
|------|-----------------|-------------|----------------------------|
| SDK supervisor health aggregation | Local test with mocked snapshots | SDK supervisor health aggregation requires live OpenCode runtime | Live OpenCode runtime with actual health snapshot export |

---

### Exit Gate (Runtime Entry Module)

Before the next module slice starts:

1. [ ] `src/tools/runtime/` tools are complete with thin adapters
2. [ ] Runtime entry proves live connection via SSE
3. [ ] Tool invocation produces expected output
4. [ ] SDK supervisor can observe runtime events
5. [ ] All evidence meets VER-01/VER-02/VER-03 standards
6. [ ] **Evidence Lane Specification is complete:**
   - [ ] Local diagnostics (VER-01) lane: **YES** — type check + lint
   - [ ] Integration checks (VER-02) lane: **YES** — sdk-supervisor/schema-kernel integration
   - [ ] Live official-interface proof (VER-03) lane: **YES** with SSE connection OR labeled `[non-live evidence]` for mocked SDK supervisor health
7. [ ] **All `[non-live evidence]` items have explicit justification:**
   - SDK supervisor health aggregation: `[non-live evidence]` — justification: "SDK supervisor health aggregation requires live OpenCode runtime; local test uses mocked snapshots"

---

## References

- **VER-01/VER-02/VER-03:** Evidence lane standards from project methodology
- **Dual-plane architecture:** Phase 1 SDK control-plane and plugin execution-plane split
- **ARCH-02:** Thin-adapter pattern (no business logic in adapters)
