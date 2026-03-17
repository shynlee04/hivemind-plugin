# Specification: OpenTUI Client Integration

## Overview
This track implements the OpenTUI client (replacing Ink) and establishes SSE streaming for HTTP API communication between the client and the OpenCode instance. This upgrades the platform to support advanced delegation, robust workflows, and rich collaborative UI features.

## Functional Requirements
- **SSE Streaming Interface:** Create real-time streaming connections via SSE from the local OpenCode server.
- **Interactive Planning Artifacts:** Implement rich TUI elements for interactive QA quizzes, multi-branch task planning, and hierarchical codebase wikis (codewiki/techstackwiki).
- **Human-Agent Collaboration UI:**
  - Multi-tab support.
  - Work pipeline status visualizations.
  - Live execution status indicators for agents.
  - Interactive mouse-click support to provide steering messages and inject context.
- **Delegation Management:** Clear UI representations for agent delegation and handoffs.

## Non-Functional Requirements
- Ensure TUI responsiveness and low latency.
- Graceful error handling for SSE disconnects.
- Compatibility with existing Dual-Plane architecture constraints.