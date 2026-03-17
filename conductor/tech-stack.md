# Technology Stack: HiveMind Context Governance

## Language and Runtime
- **TypeScript:** Primary language for type-safe development and building robust systems.
- **Node.js:** Core runtime environment (requires Node >=20.0.0).

## Core Frameworks
- **@opencode-ai/sdk:** Utilized for building out the control plane and external orchestration.
- **@opencode-ai/plugin:** Utilized for the execution plane, attaching runtime context, and interacting with agent loops.

## User Interface
- **OpenTUI:** Used for building the ongoing interactive client interface (replacing any legacy Ink implementations).
- **Communication Protocol:** The OpenTUI client communicates with the user's local OpenCode instance (acting as the server) via HTTP APIs and direct streaming with SSE.