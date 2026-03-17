# Technology Stack: HiveMind Context Governance

## Language and Runtime
- **TypeScript:** Primary language for type-safe development and building robust systems.
- **Node.js:** Core runtime environment (requires Node >=20.0.0).

## Core Frameworks
- **@opencode-ai/sdk:** Utilized for building out the control plane and external orchestration.
- **@opencode-ai/plugin:** Utilized for the execution plane, attaching runtime context, and interacting with agent loops.

## User Interface
- **Authoritative Contract:** The primary product contract is the OpenCode server/client SDK + plugin boundary.
- **Renderer Choice:** Terminal or dashboard renderers are adapter concerns. OpenTUI may be used only when it fits the authoritative boundary and packaging/runtime constraints.
- **Communication Protocol:** Any client surface communicates with the user's local OpenCode instance via official HTTP APIs, SDK calls, plugin surfaces, and direct streaming with SSE.

## Internal Contracts
- **Allowed:** HiveMind-owned internal schemas for user profiles, settings, planning metadata, display state, and delegation/read-model projections.
- **Not Allowed:** Parallel execution/session/workflow/event contracts that bypass or compete with the authoritative OpenCode boundary.
