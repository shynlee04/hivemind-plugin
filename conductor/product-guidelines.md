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
- **OpenTUI Client Interface:** All ongoing user interaction occurs through a custom OpenTUI client (specifically OpenTUI by Anomalyco, distinctly avoiding Ink).
- **Client-Server Architecture:** The user's local OpenCode instance acts as the server. Our OpenTUI client communicates with this server via HTTP APIs and handles direct streaming using SSE (Server-Sent Events) to deliver a seamless, reactive experience.