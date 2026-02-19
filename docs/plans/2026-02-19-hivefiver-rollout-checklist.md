# HiveFiver Rollout Checklist

## Pre-Release
- [ ] Root assets fully synchronized to `.opencode/`
- [ ] HiveFiver commands visible and callable
- [ ] Skill folders pass structure checks
- [ ] Workflow YAML files parse cleanly
- [ ] MCP playbooks reviewed for API setup clarity

## Quality Gates
- [ ] `npm test` passes
- [ ] `npx tsc --noEmit` passes
- [ ] `sync-assets` dry run passes

## Acceptance
- [ ] Vibecoder journey validated end-to-end
- [ ] Enterprise journey validated end-to-end
- [ ] Non-dev domain packs (marketing/finance/office) validated
- [ ] Partial MCP path produces confidence downgrade + TODOs
- [ ] Tavily API key remediation prompts validated
- [ ] DeepWiki QA transform guidance reflected in command outputs
- [ ] GSD and Ralph bridge artifacts generated and validated
