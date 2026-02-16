# Kilo CLI Setup and Usage

This document describes how to use HiveMind Context Governance with the Kilo Code CLI.

## Prerequisites

1. **Kilo CLI installed**: `npm install -g @kilocode/cli`
2. **HiveMind plugin installed**: This project already includes the hivemind-context-governance plugin

## Configuration Files

### Global Configuration
Located at `/Users/apple/.kilocode/cli/global/settings/mcp_settings.json`

### Project Configuration
Located at `/Users/apple/hivemind-plugin/.kilocode/`

- `config.json`: Main Kilo CLI configuration (providers, agents, plugins)
- `mcp.json`: MCP server configurations (project-level)
- `commands/`: HiveMind custom commands

## MCP Servers

The following MCP servers are configured:

### Connected Servers
- **stitch**: Google Stitch search and code search
- **web-search-prime**: Z.ai web search service
- **web-reader**: Z.ai web content extraction
- **zread**: Z.ai specialized web reading
- **context7**: Context7 library documentation access
- **exa**: Exa code search engine
- **tavily**: Tavily search service
- **netlify**: Netlify integration
- **repomix**: RepoMix for repository analysis
- **sequential-thinking**: Sequential thinking processing

### Disabled/Failed Servers
- **desktop-commander**: Desktop automation (requires specific setup)
- **deepwiki**: DeepWiki access (currently disabled)
- **github**: GitHub integration (currently disabled)
- **mcp-playwright**: Browser automation (currently disabled)
- **memory**: Persistent memory (currently disabled)
- **fetch**: Web fetching (currently disabled)

## Available Commands

HiveMind commands available in Kilo CLI:
- `/hivemind-status`: Show current governance state
- `/hivemind-scan`: Run brownfield scan
- `/hivemind-compact`: Compact session
- `/hivemind-clarify`: Ask clarifying questions
- `/hivemind-context`: Manage context
- `/hivemind-delegate`: Delegate tasks
- `/hivemind-lint`: Lint governance rules
- `/hivemind-pre-stop`: Pre-stop checklist

## Usage Examples

### Start Kilo TUI
```bash
kilo
```

### List MCP Servers
```bash
kilo mcp list
```

### Run with Specific Model
```bash
kilo run "Your task description" --model "chutes-api/e51e818e-fa63-570d-9f68-49d7d1b4d12f"
```

### Continue Last Session
```bash
kilo --continue
```

### Use Custom Agent
```bash
kilo run "Your task" --agent "build"
```

## Verification

To verify the setup:

1. Check Kilo CLI version:
   ```bash
   kilo --version
   ```

2. List available MCP servers:
   ```bash
   kilo mcp list
   ```

3. Test HiveMind commands by running:
   ```bash
   kilo run "Show me the HiveMind status"
   ```

## Troubleshooting

If you encounter issues:

1. Check Kilo CLI status: `kilo debug`
2. Verify MCP server connections: `kilo mcp list`
3. Check log files for errors
4. Ensure all dependencies are installed

