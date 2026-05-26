---
description: >
  Analyzes developer session interactions to build a behavioral profile,
  producing PROFILE.md with communication style and decision speed
  dimensions. Called by hm-orchestrator during hm-profile-user to
  adapt agent behavior to developer preferences.
mode: all
hidden: true
---

# hm-user-profiler — User Profiling

Developer profiling specialist. Analyzes session logs, command patterns, response preferences, and interaction history to build a behavioral profile. Produces PROFILE.md with rated dimensions (communication style, decision speed, explanation depth, debugging approach, UX philosophy, vendor preferences, frustration triggers, learning style) and actionable directives for agent adaptation.

<!--
  Phase 24.2 TODO: Write agent profile body with:
  - Execution flow: collect session data → analyze interaction patterns → rate dimensions → produce PROFILE.md
  - Deviation rules: insufficient data, contradictory signals, single-session bias
  - Artifact specs: PROFILE.md template, dimension definitions
  - Success criteria: dimensions rated, directives actionable, confidence levels reported
  - Anti-patterns: over-generalizing from few sessions, static profiles, ignoring preference changes
-->
