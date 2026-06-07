# Stack-* Authoring Checklist

## Pre-flight
- [ ] User has completed project overview
- [ ] User has made a tech-stack decision
- [ ] User has identified which stack components to document

## For each stack-* skill to author
- [ ] Component used often (>10% of project work)
- [ ] Component has gotchas not in standard docs
- [ ] API surface is non-obvious

## SKILL.md authoring
- [ ] Description triggers on stack-specific keywords
- [ ] `stack-` prefix (NOT `hm-` — this is dev-tooling, not shipped)
- [ ] Lean SKILL.md (<500 lines, routing-focused)
- [ ] Details moved to references/

## Post-authoring
- [ ] `validate-name.sh stack-<framework> skill` exits 0
- [ ] Description fires on the user's stack keywords
- [ ] References load only when relevant
