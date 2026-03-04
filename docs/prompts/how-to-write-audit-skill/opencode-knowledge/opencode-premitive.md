Doc Sources (Always cite when relevant)

# Concept Primitives

**Download them all and packed with repomix to archive and symlinks**


- doc xml file to archive systematically for next cycle iterative synthesis into skills

-https://opencode.ai/docs/tools/

Skills: https://opencode.ai/docs/skills


Plugins: https://opencode.ai/docs/plugins/

MCP servers: https://opencode.ai/docs/mcp-servers/


Config (opencode.json, locations, precedence): https://opencode.ai/docs/config/

https://opencode.ai/docs/rules/

https://opencode.ai/docs/commands/

https://opencode.ai/docs/permissions/

https://opencode.ai/docs/custom-tools/ 

https://opencode.ai/docs/lsp/

https://opencode.ai/docs/plugins/


---
Skills
Skill files live in .opencode/skills/<name>/SKILL.md or global ~/.config/opencode/skills/<name>/SKILL.md.
Skills are discovered by walking up to the git worktree and loading any matching skills/*/SKILL.md in .opencode/ or .claude/skills/.
SKILL.md requires YAML frontmatter: name + description.
Name rules: lowercase alphanumeric with single hyphens (^[a-z0-9]+(-[a-z0-9]+)*$), length 1-64, must match directory name.
Description length: 1-1024 characters.
Access is governed by opencode.json permissions (permission.skill allow/deny/ask).
Plugins
Local plugins live in .opencode/plugins/ (project) or ~/.config/opencode/plugins/ (global).
npm plugins are listed in opencode.json under plugin and installed with Bun at startup.
Load order: global config, project config, global plugins dir, project plugins dir.
MCP Servers
MCP servers are defined in opencode.json under mcp with unique names.
Local servers use type: "local" + command array; remote servers use type: "remote" + url.
Servers can be enabled/disabled via enabled.
MCP tools are managed via tools in config, including glob patterns.
OAuth is handled automatically for remote servers; can be pre-registered or disabled.
Config (opencode.json)
Supports JSON and JSONC.
Precedence order: remote .well-known/opencode -> global ~/.config/opencode/opencode.json -> custom path -> project opencode.json -> .opencode/ directories -> inline env overrides.
.opencode subdirectories are plural by default (agents/, commands/, plugins/, skills/, tools/, themes/), with singular names supported for compatibility.
