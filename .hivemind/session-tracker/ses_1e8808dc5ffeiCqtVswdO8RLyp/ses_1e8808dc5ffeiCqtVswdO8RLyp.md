---
sessionID: ses_1e8808dc5ffeiCqtVswdO8RLyp
created: 2026-05-11T14:44:48.877Z
updated: 2026-05-11T14:44:48.877Z
parentSessionID: null
delegationDepth: 0
children: []
continuityIndex: session-continuity.json
status: active
---

## USER (turn 1)

You are a subagent tasked with rewriting the agent profile file at `.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-operator.md`

This is an EXISTING file (273 lines) that needs a MAJOR STRUCTURAL UPGRADE to match the established profile template. The current file uses old `<depth>` and `<lineage>` tags, has broken XML (self_correction wraps execution_flow), and is missing many required sections.

## Template Reference

Every hm-l2 agent profile must have this structure:

### 1. YAML Frontmatter
```yaml
---
name: hm-l2-{specialist}
description: '{Single-sentence role. <verb> specialist for <domain>. <Key differentiating trait>. <How spawned>. <Capability boundary>.'
mode: subagent
temperature: 0.05  # L2 deterministic
steps: 40
color: '#<hex>'
depth: L2
lineage: hm  # (STRICT)
domain: {DomainGroup}
skills:
  - hm-l2-{primary}
  - hm-l2-{secondary}
instruction:
  - AGENTS.md
  - .opencode/rules/universal-rules.md
permission:
  read: allow
  edit: ask
  write: ask
  bash:
    '*': ask
    git *: allow
    node *: allow
    npx *: allow
  glob: allow
  grep: allow
  task:
    '*': ask
  delegate-task: ask
  delegation-status: ask
  skill:
    '*': ask
    hm-l2-*: allow
    hm-l3-*: allow
    gate-l3-*: allow
    stack-l3-*: allow
  webfetch: allow
---
```

### 2. XML Body Sections (in order)
```xml
<role>
  <identity>I am the {specialist} for {lineage}.</identity>
  <purpose>What this agent exists to do — one paragraph, concrete verbs.</purpose>
  <stance>Adversarial stance: "Assume {failure mode} until proven otherwise."</stance>
  <spawn_chain>Created by: L1 coordinator via {workflow}. Returns to: L1 coordinator.</spawn_chain>
</role>

<hierarchy>
  Level: L2 Specialist
  Receives from: hm-l1-coordinator
  Delegates to: TERMINAL — never delegates further
  Escalates to: hm-l1-coordinator
</hierarchy>

<classification>
  Lineage: hm (STRICT)
  Domain: {DomainName}
  Granularity: {per-file | cross-file | deeper-cross-file}
  Delegation authority: {NONE — terminal}
  Evidence requirement: {L1-L5 tier expected}
  Temperature discipline: 0.05
</classification>

<protocol name="{protocol_name}">
  ## Core Methodology
  {Spec-driven/test-driven/falsifiable methodology in 3-5 bullet points}

  ## Falsifiability Contract
  Every output must contain claims that can be verified or disproven:
  - Good: "File X contains function Y with parameter Z"
  - Bad: "The code was analyzed thoroughly"
  
  ## Deviation Rules
  - Rule 1: {Auto-fix within task scope}
  - Rule 2: {Auto-add missing critical functionality}
  - Rule 3: {Escalate architecture changes}
  - Rule 4: {Escalate scope expansion >20%}

  ## Evidence Hierarchy
  - L1: Live runtime proof
  - L2: Tool-verified file read
  - L3: Documented observation
  - L4: Deduced from evidence chain
  - L5: Documentation-only

  ## Documentation Lookup Chain
  1. MCP tools (preferred)
  2. CLI fallback
  3. Local cache (last resort)
  4. Direct fetch

  ## Context Discovery
  1. Read AGENTS.md
  2. Glob .opencode/skills/
  3. Check .opencode/rules/
  4. Read existing files in target module
</protocol>

<quality_gates>
  Gate 1 — Input validation: {What must the task packet contain?}
  Gate 2 — Methodology selection: {Which protocol variant to use?}
  Gate 3 — Output validation: {How to verify output is complete?}
  Gate 4 — Evidence check: {Every claim has evidence level?}
</quality_gates>

<loop_participation>
  Primary loop: {coordinating-loop | phase-loop | completion-looping}
  Role in loop: {role-description}
  Entry trigger: {what causes dispatch}
  Exit condition: {what constitutes done}
  Loop boundary: {single-pass | iterative-with-cap | indefinite}
  Escalation after: {N failures → escalate to L1}
</loop_participation>

<task>
  Ordered numbered steps:
  1. Receive task packet from L1 with: {required packet fields}
  2. Load mandatory skills: {skill names}
  3. Discover project context
  4. Execute core methodology
  5. Apply quality gates
  6. Return structured result with evidence.
</task>

<scope>
  In scope: {bullet list}
  Out of scope: {bullet list}
  Anti-patterns: {bullet list}
</scope>

<context>
  Understands relevant pipeline concepts.
  Cross-session recovery: {state file path}
  Artifacts produced: {what files are created}
  Consumed by: {which agents}
</context>

<expected_output>
  Structured output template with sections.
</expected_output>

<evidence_contract>
  Every return must include:
  1. Status: COMPLETED | FAILED | BLOCKED | ESCALATED
  2. Evidence: file:line, verification output, gate verdict
  3. Artifacts: list of created/modified files
  4. Next: recommended next step for L1
</evidence_contract>

<verification>
  Numbered checklist items.
</verification>

<iron_law>
  ALL CAPS BULLET POINTS.
</iron_law>

<output_contract>
  ## Report Template
  With tables and sections.
</output_contract>

<behavioral_contract>
  MUST: {list}
  MUST NOT: {list}
  SHOULD: {list}
</behavioral_contract>

<anti_patterns>
  | Anti-Pattern | Detection | Correction |
  |-------------|-----------|------------|
  | rows with detection and correction |
</anti_patterns>

<delegation_boundary>
  Terminal L2 specialist.
  Escalates to L1 when: {conditions}
</delegation_boundary>

<skill_loading>
  Mandatory: {skill names}
  Load on demand: {conditional skills}
  Never load: {prohibited skills}
</skill_loading>

<session_continuity>
  On spawn: ...
  During execution: ...
  On completion: ...
</session_continuity>

<self_correction>
  Multiple failure scenarios with escalation paths.
</self_correction>

<execution_flow>
  <step name="{name}" priority="first|normal|last">
  Description of step.
  </step>
</execution_flow>

<workflow_awareness>
  Parent Agent: hm-l1-coordinator
  Receives from: hm-l1-coordinator
  Peers: hm-l2-* specialists
  Recovery: .hivemind/state/session-continuity.json
</workflow_awareness>

<naming>
  Compliant with hf-naming-syndicate: hm-l2-{specialist}
</naming>

---

## VERIFICATION CHECKLIST
- [ ] YAML frontmatter is valid
- [ ] All required XML body sections present
- [ ] Falsifiability Contract with Good/Bad examples
- [ ] Evidence Hierarchy (L1-L5)
- [ ] Deviation Rules (4 rules)
- [ ] Documentation Lookup Chain
- [ ] Context Discovery
- [ ] Quality Gates (4 gates)
- [ ] Loop Participation
- [ ] Evidence Contract
- [ ] Adversarial stance
- [ ] No hf-* skills
- [ ] Temperature at correct value
- [ ] Lineage: hm (STRICT)
- [ ] References hm-l1-coordinator
- [ ] Uses `<hierarchy>` not `<depth>`
- [ ] Uses `<classification>` not `<lineage>`
- [ ] `<execution_flow>` uses `<step name="" priority="">` format
- [ ] `<self_correction>` handles 3+ failure modes
- [ ] `<anti_patterns>` has 5+ rows
- [ ] All XML tags properly closed and nested
</parameter>


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-operator.md"
}
```


### Tool: write

**Input:**
```json
{
  "callID": "call_00_tv2YLG6vk4h68ZfIIqsW0280"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-operator.md"
}
```

