# Quality Model — ISO 25010 for HiveMind

Adapted from ISO/IEC 25010 (Systems and software Quality Requirements and Evaluation). Each characteristic maps to HiveMind-specific targets.

## Functional Suitability

**Definition:** Does the software do what it should? Complete, correct, appropriate.

| Sub-characteristic | HiveMind Target |
|-------------------|-----------------|
| Functional completeness | All delegated features implemented, no stubs claiming done |
| Functional correctness | Tool output matches schema contract, no data corruption |
| Functional appropriateness | No unnecessary steps, single responsibility per tool |

**How to test:** Verify tool output against Zod schema. Verify hook behavior against documented contract. Verify no dead code paths.

## Performance Efficiency

**Definition:** Response time, throughput, resource utilization relative to workload.

| Sub-characteristic | HiveMind Target |
|-------------------|-----------------|
| Time behavior | Tool execution < 5s for non-network ops, < 30s for network |
| Resource utilization | No memory leaks across session compaction cycles |
| Capacity | Handles 100+ messages per session without degradation |

**How to test:** Benchmark tool execution time. Monitor memory across repeated invocations. Test with large payloads.

## Compatibility

**Definition:** Co-existence with other products, interchange of information.

| Sub-characteristic | HiveMind Target |
|-------------------|-----------------|
| Co-existence | Works alongside other OpenCode plugins without conflict |
| Interoperability | Correct use of `@opencode-ai/plugin` SDK surfaces |

**How to test:** Verify no global state pollution. Verify SDK API usage against official interfaces. Test with multiple plugins loaded.

## Usability

**Definition:** Can users achieve goals effectively, efficiently, satisfactorily.

| Sub-characteristic | HiveMind Target |
|-------------------|-----------------|
| Appropriateness recognizability | Tool descriptions match actual behavior |
| Learnability | Error messages include fix suggestions |
| User error protection | Invalid args caught by Zod before execution |

**How to test:** Verify tool descriptions are accurate. Verify error messages are actionable. Verify Zod catches invalid inputs at definition time.

## Reliability

**Definition:** Maturity, availability, fault tolerance, recoverability.

| Sub-characteristic | HiveMind Target |
|-------------------|-----------------|
| Maturity | No crashes on unexpected input, no unhandled promise rejections |
| Availability | Plugin loads on first try, no race conditions in initialization |
| Fault tolerance | Graceful degradation when external services fail |
| Recoverability | Session state recovers after compaction |

**How to test:** Fuzz tool args. Test with network failures. Verify session state persistence across compaction. Test plugin load order independence.

## Security

**Definition:** Confidentiality, integrity, non-repudiation, accountability, authenticity.

| Sub-characteristic | HiveMind Target |
|-------------------|-----------------|
| Confidentiality | No API keys or secrets in tool output or logs |
| Integrity | Input validation via Zod, no injection vectors |
| Accountability | Audit trail in trajectory events |

**How to test:** Grep output for secrets. Verify Zod schemas reject malformed input. Verify trajectory events capture mutations.

## Maintainability

**Definition:** Modularity, reusability, analyzability, modifiability, testability.

| Sub-characteristic | HiveMind Target |
|-------------------|-----------------|
| Modularity | Each file < 300 LOC, single responsibility |
| Reusability | Shared helpers in `shared/`, no cross-file duplication |
| Analyzability | Clear error messages, structured logging |
| Modifiability | Changes localized to one module, no cascade edits |
| Testability | Functions accept dependency injection, mockable interfaces |

**How to test:** LOC audit per file. Duplicate function detection. Verify changes don't require multi-file edits. Verify test isolation.

## Portability

**Definition:** Adaptability, installability, co-existence in different environments.

| Sub-characteristic | HiveMind Target |
|-------------------|-----------------|
| Adaptability | Works across OpenCode versions, graceful SDK version handling |
| Installability | Single npm install, no manual setup steps |
| Co-existence | No hardcoded paths, platform-agnostic file operations |

**How to test:** Test on different OS (macOS, Linux, Windows). Verify no hardcoded paths. Test with different Node versions.

## Quality Score Card

Use this checklist before claiming completion:

```
[ ] Functional: All features work as documented
[ ] Performance: No timeouts, no memory leaks
[ ] Compatibility: Works with current SDK version
[ ] Usability: Error messages are clear and actionable
[ ] Reliability: Handles failures gracefully
[ ] Security: No secrets in output, input validated
[ ] Maintainability: Files < 300 LOC, no duplication
[ ] Portability: Cross-platform, no hardcoded paths
```

Each unchecked item is a **completion blocker**.
