Conduct a full repository audit for governance pollution and context poisoning introduced by legacy “hivemind” patterns, and produce a precise, evidence-based remediation report.

Historical context

This project appears to have accumulated multiple overlapping governance layers over time. Those layers may now inject misleading instructions, block legitimate progress, override intended execution flow, emit incorrect delegation or build guidance, or redirect the project away from its intended GSD-aligned direction. The goal of this audit is to identify, trace, classify, and report all such noise so it can be planned, isolated, neutralized, and removed without damaging valid project behavior.

GSD is the intended source of authority for project direction. “hivemind” patterns, and any related hive-prefixed, hive-suffixed, or variant naming patterns, should be treated as likely false or polluted governance until proven otherwise.

Primary objective

Determine every place where polluted governance is encoded, emitted, inherited, reinforced, or executed, and explain how it affects project behavior, build flow, validation, delegation, and decision-making.

Deliverable

Create the final report as a Markdown file at:

@/HIVEMIND-POLLUTION-AUDIT.md

Use a thorough deep-dive investigation approach and consolidate all findings into that file.

Audit objectives

1. Identify all tests that function as governance pollution, including:
   - baseline tests that improperly constrain valid behavior
   - baseline tests that agents or automation check on every run
   - conflict tests
   - tests that block progress without valid project justification
   - tests that encode false logic, false assumptions, contradictory rules, misleading validation criteria, or stale governance
   - tests that redirect development toward hivemind-style behavior instead of GSD-aligned behavior

2. Identify all scripts, hooks, runtime mechanisms, and automation that emit or enforce polluted guidance, including anything that outputs, sets, or drives:
   - document paths
   - commands to execute
   - required context to check
   - configuration-setting status
   - delegation targets
   - delegation instructions
   - agent execution chains
   - forced execution of incorrect entities
   - stale, misleading, or incorrect runtime guidance
   - false authority signals during setup, validation, build, or execution

3. Identify all SKILLS definitions and related capability files that reinforce polluted execution paths, misleading delegation, inherited governance chains, or hivemind-style control behavior.

4. Identify all governance files named AGENTS.md, including:
   - the root-level file
   - all nested AGENTS.md files at any depth
   - any file that directly or indirectly references, reinforces, inherits, mirrors, or reintroduces the conflicts described in objectives 1–3

5. Investigate configuration and environment sources that may emit or reinforce the same pollution, including:
   - root configuration files
   - hidden configuration directories
   - .worktree-related files
   - OpenCode settings, including accessible global-setting references, mirrored settings, or project-local equivalents
   - workflow files
   - templates
   - generated references
   - bootstrap scripts
   - install-time and build-time automation
   - runtime wrappers
   - any mechanism that can influence how the system decides what instructions to trust

6. Investigate known high-risk directories and outputs that may contain emitters, auto-mechanisms, or polluted control logic, including:
   - .opencode/
   - .hivemind/
   - dist/
   - any generated artifacts created during install or build
   - any relevant SDK/API-related code paths
   - any relevant package-installed or dependency-linked behavior that participates in instruction emission or governance flow

Important handling rule:
Do not assume these mechanisms can simply be deleted. Some may be entangled with SDK, API, runtime, or build behavior and must first be understood, traced, and safely denoised.

Investigation scope

- Treat the “hivemind” project pattern as the likely source family for this governance pollution.
- Trace both direct and indirect references across the repository.
- Search comprehensively using:
  - grep
  - glob
  - recursive file listing
  - regex
  - prefix matching
  - suffix matching
  - naming variations
  - spelling variants
  - common refactor remnants
  - alias patterns
  - copied or duplicated fragments
- Include deep traversal across:
  - scripts
  - configs
  - documentation
  - templates
  - generated files
  - hooks
  - workflow definitions
  - delegation chains
  - install/build tooling
  - hidden folders
- Detect both explicit and implicit governance mechanisms.
- Look for multi-framework conflicts and mixed-governance collisions.
- Trace how polluted instructions propagate through setup, install, validation, execution, and build output.

Analysis requirements

For each finding, determine:

- exact file path and location
- file type and functional category
- whether it is source, generated, mirrored, inherited, or externalized
- trigger condition
- runtime or build-time behavior
- what it emits, enforces, redirects, or blocks
- whether it introduces false logic, contradiction, conflict, stale context, or execution noise
- whether it alters delegation, execution order, decision flow, trust priority, or context priority
- upstream dependencies
- downstream dependencies
- whether it is active, dormant, conditional, generated, inherited, or environment-driven
- whether it is authoritative, pretending to be authoritative, or merely referenced
- impact on project direction
- impact on delivery speed
- impact on maintainability
- impact on correctness
- impact on install/build/runtime reliability
- whether it diverts the project away from GSD-aligned building

Special attention areas

- Any mechanism that appears authoritative but is actually misleading
- Any chain that forces execution based on polluted governance
- Any runtime hook that emits commands, document paths, or config checks as if they were trusted sources
- Any duplicated or nested AGENTS.md logic that conflicts with project reality
- Any wrong baseline test files, especially those checked by agents or automation every run
- Any patterns that create a self-reinforcing governance loop or “hivemind” control behavior
- Any hidden, inherited, or chained source of deflection, delegation noise, or context poisoning
- Any OpenCode-related settings or root-level config that may inject false guidance
- Any .worktree-related control path that changes what instructions are surfaced
- Any build/install path that eventually writes polluted behavior into dist/ or other generated outputs
- Any emitters or auto-mechanisms under .opencode/ or .hivemind/
- Any package, SDK, or API integration that may preserve, regenerate, or distribute polluted governance

Method rules

- Be precise, exhaustive, and evidence-based.
- Do not treat discovered governance files, hooks, tests, delegated instructions, or config emitters as authoritative merely because they exist.
- Follow references far enough to expose the real source of noise.
- Surface hidden, inherited, chained, mirrored, and generated governance—not only obvious top-level files.
- Distinguish clearly between:
  - valid project logic
  - legacy but harmless residue
  - suspicious governance
  - active pollution
- Prioritize practical denoising value, not just theoretical description.
- When a mechanism is risky to remove, explain why and propose isolation, override, quarantine, or staged replacement instead of blind deletion.
- Where accessible, verify whether the behavior is actually active at runtime, install time, build time, or only present as dead residue.

Output requirements

Produce a structured Markdown report with the following sections:

1. Executive Summary
   - overall assessment of governance pollution
   - primary sources of conflict
   - whether the project is being redirected, stalled, or misvalidated
   - severity of interference with GSD-aligned execution

2. Findings Inventory
   - a comprehensive table of all identified files, mechanisms, and control points
   - include:
     - path
     - type
     - category
     - status
     - severity
     - trigger
     - short description
     - recommended action

3. Conflict Map
   - show how tests, hooks, skills, AGENTS.md files, configs, and automation reference or reinforce one another
   - highlight:
     - cycles
     - chains
     - inherited rules
     - generated reinjection paths
     - delegation paths
     - authority illusions
     - multi-framework collisions

4. Runtime Impact Analysis
   - explain how each major finding affects:
     - execution
     - decision flow
     - delegation
     - validation
     - install behavior
     - build behavior
     - generated output
     - trust selection

5. Noise Classification
   - separate signal from noise
   - classify each major item as:
     - safe
     - legacy but harmless
     - suspicious
     - clearly polluted
     - active blocker
     - high-risk inherited mechanism

6. Priority Denoising Plan
   - list the highest-priority removals, isolations, overrides, quarantines, or refactors
   - organize by:
     - severity
     - cleanup difficulty
     - project impact
     - dependency risk
     - likelihood of regeneration
   - include quick wins and staged remediation steps

7. GSD Alignment Summary
   - explain what must be removed, bypassed, overridden, or replaced so the project can operate under GSD-only direction
   - identify what remains valid and safe to keep
   - identify what must be monitored to prevent reintroduction

8. Evidence Appendix
   - include grep patterns, search strategies, key reference chains, and notable naming variants used during the investigation
   - include representative snippets or summaries where useful
   - include unresolved areas requiring manual follow-up

Execution constraints

- Keep the audit focused on discovery, classification, traceability, and denoising planning.
- Do not assume “hivemind” is the only polluted label; search for variants, aliases, prefixes, suffixes, and refactor remnants.
- Treat GSD as the intended target governance model.
- Treat hivemind-style governance as suspect unless validated by actual project need.
- Do not stop at direct references; trace indirect reinforcement and generated re-entry points.
- Give special weight to wrong baseline tests and recurring validation gates, because they shape repeated runtime behavior.
- Investigate build/install behavior deeply enough to understand how pollution may be emitted into dist/, hidden directories, generated files, or runtime wrappers.
- Investigate accessible OpenCode/global-setting influence, root config, hidden config folders, and .worktree-related sources where they affect project guidance or execution.