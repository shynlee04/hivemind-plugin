# Spec vs Design vs Plan

A common confusion: what belongs in the SPEC.md vs the ADR (design) vs the
PLAN.md (execution). This skill owns the SPEC. The boundaries:

## SPEC.md — The WHAT and HOW-TO-VERIFY

| Belongs in spec | Example |
|---|---|
| Functional requirements (EARS) | "The system shall validate JWT within 200ms" |
| Non-functional requirements (EARS) | "The system shall respond within 200ms p99" |
| Acceptance criteria (BDD) | "Given expired JWT, When GET, Then 401" |
| Verification methods | "Run `npm test -- auth/`; expected exit 0" |
| Source provenance | "PRD-2026-04-12, Section 3" |
| Out-of-scope statement | "OAuth, SAML, and OIDC are out of scope for v1" |
| Open questions / risks | "What happens when the JWT signing key rotates?" |

## ADR (Architecture Decision Record) — The HOW (chosen option + why)

| Belongs in ADR | Example |
|---|---|
| High-level design choice | "Use JWT over server-side sessions" |
| Rejected alternatives + reasoning | "Considered session cookies; rejected because of CSRF complexity" |
| Trade-offs accepted | "JWTs are stateless, but revocation requires a blocklist" |
| Diagrams of the system | Sequence diagram, state diagram |
| Decision date + deciders | "2026-06-08, build + user" |

## PLAN.md — The WHEN and BY-WHO

| Belongs in plan | Example |
|---|---|
| Task breakdown | "T1: implement JWT validation, T2: implement rate limiting" |
| Task dependencies | "T2 depends on T1" |
| Owner + timeline | "T1: build, 1 day" |
| Test order | "T1 unit tests → T1 integration tests → T2..." |
| Atomic commit strategy | "1 commit per task" |

## Where Lines Get Blurred

| Scenario | Belongs in |
|---|---|
| "Use bcrypt with cost 10" | SPEC (specific measurable requirement) |
| "Use bcrypt instead of argon2" | ADR (design choice + rejected alternatives) |
| "Implement bcrypt in src/auth/hash.ts" | PLAN (task assignment) |
| "Hash passwords within 100ms" | SPEC (performance requirement) |
| "Use bcrypt-rs library" | ADR (library choice) |
| "Install bcrypt-rs via Cargo" | PLAN (build step) |
| "Allow password reset via email" | SPEC (functional requirement) |
| "Use SendGrid for email" | ADR (service choice) |
| "Set up SendGrid API key" | PLAN (env config) |

## Decision Rule

When in doubt, ask: **"If I changed the implementation, would this still be true?"**

- If YES → SPEC (it's a requirement of the system, not a design choice)
- If NO → it depends:
  - If the change is "how to verify" → still SPEC
  - If the change is "what to build" → SPEC
  - If the change is "what tech to use" → ADR
  - If the change is "what order to do tasks" → PLAN

## Handoff

After the SPEC is locked (all 5 gates PASS), the handoff packet goes to:
- **ADR author** (if design choices are still open) → `hm-arch-decision` (when created)
- **TDD executor** (always) → `hm-test-driven-execution` (when created)
- **Plan author** (always) → `hm-planner` (for the PLAN.md)

If the SPEC contains a clear "use library X" statement, that's an ADR
candidate. Flag it in the Handoff Packet: "Open question: confirm library
choice in ADR before TDD."
