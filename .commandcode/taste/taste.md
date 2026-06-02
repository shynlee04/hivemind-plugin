# Technology Stack
- Use Command Code (CMD) as the coding agent for this project. Confidence: 0.60

# Synthesis
- When synthesizing from external frameworks (e.g., gsd-*), transform all naming prefixes, suffixes, configs, and designs to align with HIVEMIND conventions—never ingest external naming directly into shipped artifacts. Confidence: 0.80

# Workflow
- Conduct thorough audits before proposing fixes or implementation plans; never attempt fixes without first completing sufficient investigation and validation. Confidence: 0.75
- When modifying code, trace the full data flow and wire changes end-to-end into all consuming systems (hooks, lifecycle, prompt injection) — never make surface-level data structure changes without integrating them into the runtime pipeline. Confidence: 0.75

# Asset Management
- Client-side installed assets under `.opencode/` must never be modified—manage only source `assets/` (hm-*); any gsd-* installed in user space is the user's choice and must remain untouched. Confidence: 0.75
