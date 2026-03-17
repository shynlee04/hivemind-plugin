# Product Guidelines: HiveMind Context Governance

## Documentation and Tone
The primary tone for documentation and user-facing messages adapts dynamically based on the user's technical expertise level (configured during initial setup). Agent output styles should support:
- **Explanatory:** Clear, educational responses for users seeking deep understanding.
- **Architecture-Oriented:** Focused on structural design, data flow, and systemic impact.
- **Expert-Guidance:** Highly strategic rationale; agents should not hesitate to politely correct users when their requests contradict established best practices or architectural integrity.

## Bilingual Strategy
- **English Primary:** All core APIs, codebase comments, internal specifications, and primary documentation must be in English.
- **Vietnamese Secondary:** Onboarding guides, user tutorials, and market-specific outreach will prioritize Vietnamese translations to support local team adoption.

## UX and Design Principles
- **One-Time CLI Setup:** The CLI tool is utilized exclusively for initial installation and bootstrap configuration.
- **Client-Server Authority:** The authoritative interaction boundary is the user's local OpenCode instance acting as the server, with client behavior flowing through official HTTP APIs, SDK surfaces, plugins, and SSE streams.
- **Renderer Is Secondary To The Boundary:** OpenTUI may be pursued as a future or experimental client renderer, but renderer choice must not override the server/client/plugin authority model or force a competing runtime contract.
- **Thin Client Rule:** New interface work should mirror and augment the verified OpenCode server boundary instead of inventing a second execution, session, workflow, tool, or event protocol.

## Safe New Surfaces
- **Allowed Internal Interfaces:** Internal-only schemas and settings such as user profile fields, dashboard preferences, planning artifact metadata, display filters, tab state, delegation projections, and similar HiveMind-owned read models are in-bounds.
- **Boundary Condition:** These internal surfaces must remain additive and repo-owned, and they must translate outward through existing OpenCode SDK/API/plugin/tool boundaries at the edge.
- **Not Allowed Yet:** New shadow APIs, parallel session models, custom workflow engines, custom event buses, or any interface that competes with OpenCode/runtime truth are out of bounds.
