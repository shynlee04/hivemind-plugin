# ADR-003: Live SDK Verification Authority - 2026-03-17

## Status

Accepted

## Context

HiveMind has accumulated green tests and harness checks that validate local
TypeScript handlers, local bundle execution, filesystem projections, and mocked
plugin contexts. Those checks are useful, but they do not prove the runtime
behavior that matters most for the product direction now taking shape:

- real OpenCode server lifecycle
- real OpenCode JavaScript SDK client behavior
- real OpenCode SSE/event flow
- real plugin loading and hook execution inside OpenCode
- real `/tui` and other server-driven control surfaces when used

The current gap is sharpest in the harness and runtime verification path:

- `src/cli/harness.ts` performs `/global/health` plus local bundle execution
- `tests/harness-command.test.ts` uses a tiny HTTP stub instead of a real
  OpenCode server
- `tests/helpers/mock-sdk.ts` and related tests rely on mocked `PluginInput`
- `tests/runtime-tools.test.ts` validates synthesized JSON payloads only

At the same time, the official OpenCode architecture is already server/client
first. The server exposes OpenAPI and SSE, the JavaScript SDK is generated from
that API, and the plugin system is the runtime interception layer.

## Decision

HiveMind adopts the following verification rule:

**Claims about runtime behavior, determinism, harness readiness, SDK
compatibility, plugin hook execution, or programmatic control must be proven
against live official OpenCode interfaces or explicit official documentation.**

Accepted proof surfaces include:

- `createOpencodeServer()`
- `createOpencodeClient()`
- `createOpencode()`
- `opencode serve`
- official REST endpoints such as `/global/health` and `/doc`
- official SSE endpoints such as `/event`
- real plugin loading inside OpenCode
- official `/tui/*` control APIs when relevant
- official OpenCode server, SDK, and plugin documentation

Mocked `PluginInput`, local bundle execution, filesystem-only state checks, and
synthetic runtime payloads are still allowed for local unit coverage, but they
must not be presented as proof of live runtime correctness.

## Rationale

1. **Matches the official platform contract**
   The product depends on OpenCode’s server, SDK, and plugin APIs, not only on
   local wrappers around them.
2. **Prevents false greens**
   Unit-level tests can remain green while real server/client/plugin behavior is
   still unproven.
3. **Improves architectural honesty**
   Diagnostics, unit coverage, and live contract validation become separate
   evidence lanes instead of being blurred together.
4. **Supports the selected direction**
   The repo is shifting toward full server/client SDK and plugin API instances,
   so verification must shift with it.

## Consequences

### Positive

- Runtime claims become traceable to official interfaces.
- Harness language can be more truthful.
- Future regressions in SDK, server, plugin loading, or SSE behavior are more
  likely to be caught where they actually happen.
- Governance documents can distinguish local proof from live proof cleanly.

### Negative

- Live verification is slower and more operationally complex than mocked tests.
- Some current green checks lose status as “completion evidence” and become
  supporting evidence only.
- Additional scripting or fixture work will be needed to exercise live OpenCode
  instances deterministically.

### Mitigations

- Keep mocked tests for narrow unit boundaries.
- Reclassify `hm-harness` as a readiness and diagnostic command until live
  contract probes exist.
- Add explicit live verification scripts and fixtures incrementally.

## Implementation Notes

- Update root and sector `AGENTS.md` files to encode the rule.
- Update active planning artifacts to record the verification gap truthfully.
- Keep legacy OpenTUI/Bun proposal material advisory until it is reconciled
  against the active authority and official OpenCode interfaces.

## Related Decisions

- `docs/adr/001-no-hook-adapter.md`
- `docs/adr/002-type-decomposition.md`

## References

- `ADVANCED-SDK.md`
- `docs/governance/live-sdk-verification-inventory-2026-03-17.md`
- OpenCode SDK docs: `https://opencode.ai/docs/sdk/`
- OpenCode server docs: `https://opencode.ai/docs/server/`
- OpenCode plugin docs: `https://opencode.ai/docs/plugins/`
