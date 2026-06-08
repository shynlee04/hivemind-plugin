# Reference Loading Workflow

The 4-step protocol for loading a platform reference.

## Step 1: Frame the Question

What am I trying to find out? Frame it as a single sentence.

Examples:
- "How does the Hivemind engine work?"
- "Where is the state for sessions stored?"
- "What tools can the agent use?"

## Step 2: Pick the Reference

Use the decision tree in `references/loading-decision-tree.md` OR
run `scripts/pick-reference.sh "<question>"`.

The 15 reference skills cover:
- `hm-research-deep` — multi-source research
- `hm-detective` — codebase investigation
- `hm-engine-contracts` — engine internals
- `hm-state-reference` — state root
- `hm-integration-contracts` — skill/agent bindings
- `hm-omo-reference` — oh-my-openagent architecture
- `hm-platform-opencode` — OpenCode SDK
- `hm-project-audit` — project boundaries
- `hm-research-chain` — orchestrated research
- `hm-subagent-patterns` — delegation
- `hm-synthesis` — compression
- `hm-tech-compliance` — tech-stack compat
- `hm-tech-ingest` — third-party SDK
- `hm-tooling-capability` — tool matrix
- `hm-non-interactive-shell` — shell scripts

## Step 3: Load

Load ONLY the chosen skill. Not this router, not all 15.

## Step 4: Use + Cite

Use the loaded content. Cite the file:line in your answer.

## Anti-Pattern

Loading this skill PLUS all 15 references. Each loads ~5KB. Total =
75KB wasted context. Load ONE at a time.
