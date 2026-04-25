# Spike Manifest

## Idea
Test whether OpenCode's existing command infrastructure (markdown command definitions with YAML frontmatter, JSON command config, and the Task tool) can support a natural language routing layer that maps user intent to slash commands without modifying OpenCode itself.

## Requirements

### Validated
- [x] Must be able to discover all available commands and their metadata from existing config files
- [x] Must not require changes to OpenCode core — only leverage existing plugin/tool/hook surfaces

### Active
- [ ] Must be able to match natural language input to command descriptions/triggers with reasonable accuracy (>80%)
  - **Status:** Keyword overlap achieves ~55% accuracy for non-trigger queries. LLM-based semantic matching is needed for production.
- [ ] Must be able to invoke the matched command programmatically via OpenCode's Task tool
  - **Status:** Supported by OpenCode per citation evidence, but not directly tested in this spike session.

### Discovered
- [ ] Command files need resilient YAML parsing — 2/96 files have malformed frontmatter that breaks strict parsers
- [ ] Trigger phrase coverage must expand from 6/96 commands to achieve high-accuracy routing without LLM calls
- [ ] Description quality varies enormously (20 chars to 380+ chars) — inconsistent signal strength for matching

## Spikes

| # | Name | Type | Validates | Risk | Status |
|---|------|------|-----------|------|--------|
| 001 | command-catalog-discovery | standard | Given `.opencode/command/*.md` and `.opencode/commands/*.md` exist with YAML frontmatter, when parsed with gray-matter, then all commands, descriptions, agents, and trigger phrases are extractable | High | **VALIDATED** |
| 002 | nl-command-mapping | standard | Given a structured command catalog with descriptions and trigger phrases, when natural language input is provided, then keyword + semantic matching produces the correct command match | Medium | **PARTIAL** |
