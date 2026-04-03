# Task Plan: Convert Command File to Skill

## Goal
Convert a markdown command file with CLI instructions into a proper skill pack with SKILL.md, references/, and scripts/

## Phases

### Phase 1: Parse input command file
**Status:** complete
- [x] Read source markdown file
- [x] Extract CLI commands and descriptions
- [x] Identify skill name and purpose

### Phase 2: Generate skill frontmatter
**Status:** in_progress
- [ ] Write SKILL.md with proper frontmatter
- [ ] Map CLI commands to skill patterns
- [ ] Define trigger phrases

### Phase 3: Create reference files
**Status:** pending
- [ ] Write references/01-command-reference.md
- [ ] Write references/02-usage-examples.md
- [ ] Write references/03-troubleshooting.md

### Phase 4: Build validation scripts
**Status:** pending
- [ ] Write scripts/validate-skill.sh
- [ ] Write scripts/check-overlaps.sh
- [ ] Create evals.json with test cases
