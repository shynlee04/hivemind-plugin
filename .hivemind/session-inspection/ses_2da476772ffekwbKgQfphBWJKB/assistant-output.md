# Session Inspection Export

- ses_id: `ses_2da476772ffekwbKgQfphBWJKB`
- prepared_at: `2026-03-25T16:01:45.234Z`

## Assistant Output

## External Research Report

**Question:** Complete OpenCode configuration schema mapping for opencode.json
**Sources Checked:** 15 (10 doc URLs + 5 local files)
**Research Date:** 2026-03-25
**Freshness:** All sources accessed 2026-03-25 (current)

---

### Executive Summary

The OpenCode configuration schema is a JSON object with `$schema` reference to `https://opencode.ai/config.json`. The configuration supports multiple entity types: agents, commands, tools, permissions, MCP servers, plugins, LSP servers, formatters, skills, and more. Configuration is **merged across layers** (remote → global → project), not replaced.

---

## Complete Schema Mapping

### Top-Level Configuration Entity

```typescript
// Root Configuration Schema
interface OpenCodeConfig {
  "$schema"?: string;                    // JSON schema reference
  "logLevel"?: "DEBUG" | "INFO" | "WARN" | "ERROR";
  
  // Server Configuration
  "server"?: ServerConfig;
  
  // Agent Configuration  
  "agent"?: Record<string, AgentConfig>;
  "default_agent"?: string;
  
  // Command Configuration
  "command"?: Record<string, CommandConfig>;
  
  // Tools Configuration (deprecated, use permission)
  "tools"?: Record<string, boolean>;
  
  // Permission Configuration
  "permission"?: PermissionConfig;
  
  // Model Configuration
  "model"?: string;                      // Format: "provider/model-id"
  "small_model"?: string;
  
  // Provider Configuration
  "provider"?: Record<string, ProviderConfig>;
  "disabled_providers"?: string[];
  "enabled_providers"?: string[];
  
  // MCP Servers
  "mcp"?: Record<string, MCPConfig>;
  
  // Plugins
  "plugin"?: string[];
  
  // Formatters
  "formatter"?: FormatterConfig | false;
  
  // LSP Servers
  "lsp"?: LSPConfig | false;
  
  // Skills
  "skills"?: {
    "paths"?: string[];
    "urls"?: string[];
  };
  
  // Instructions/Rules
  "instructions"?: string[];
  
  // Other
  "snapshot"?: boolean;
  "share"?: "manual" | "auto" | "disabled";
  "autoupdate"?: boolean | "notify";
  "username"?: string;
  "watcher"?: { "ignore"?: string[] };
  "compaction"?: {
    "auto"?: boolean;
    "prune"?: boolean;
    "reserved"?: number;
  };
  "experimental"?: Record<string, unknown>;
}
```

---

### 1. AGENTS Schema

**Doc Source:** https://opencode.ai/docs/agents/
**Confidence:** HIGH | **Freshness:** Current (2026-03-25)

#### Agent Configuration Schema

```typescript
interface AgentConfig {
  // REQUIRED
  "description": string;                  // What agent does, when to use
  
  // OPTIONAL
  "mode"?: "primary" | "subagent" | "all";  // How agent can be used
  "model"?: string;                      // Override model, format: "provider/model-id"
  "prompt"?: string;                     // Path to custom prompt file "{file:./prompts/build.txt}"
  "temperature"?: number;                 // 0.0-1.0, randomness
  "top_p"?: number;                      // 0.0-1.0, diversity alternative to temperature
  "steps"?: number;                      // Max agentic iterations (replaces deprecated maxSteps)
  "maxSteps"?: number;                   // @deprecated, use steps
  "disable"?: boolean;                   // Disable the agent
  "hidden"?: boolean;                    // Hide from @ autocomplete (subagents only)
  "color"?: string;                     // Hex (e.g., "#FF5733") or theme color
  "tools"?: Record<string, boolean>;     // @deprecated, use permission
  "permission"?: PermissionConfig;       // Fine-grained permissions
  
  // Any additional properties passed to provider as model options
  [key: string]: unknown;
}
```

#### Agent Mode Values
| Mode | Description |
|------|-------------|
| `primary` | Main agent, interact directly, cycle with Tab |
| `subagent` | Invoke via @ mention or Task tool |
| `all` | Default, can be used both ways |

#### Built-in Agents
| Agent | Mode | Default Tools |
|-------|------|---------------|
| `build` | primary | All tools enabled |
| `plan` | primary | Read-only (edit/bash denied) |
| `general` | subagent | Full except todo |
| `explore` | subagent | Read-only |
| `compaction` | primary | Hidden, auto-system |
| `title` | primary | Hidden, auto-system |
| `summary` | primary | Hidden, auto-system |

#### Required vs Optional Fields
| Field | Required | Default |
|--------|----------|---------|
| `description` | **YES** | - |
| `mode` | No | `all` |
| `model` | No | Global model (primary) or parent model (subagent) |
| `prompt` | No | Built-in prompt |
| `temperature` | No | Model defaults (usually 0) |
| `top_p` | No | Model defaults |
| `steps` | No | Unlimited |
| `disable` | No | `false` |
| `hidden` | No | `false` |
| `color` | No | Theme default |
| `tools` | No | All true (deprecated) |
| `permission` | No | Global permissions |

#### opencode.json Examples

```json
{
  "$schema": "https://opencode.ai/config.json",
  "agent": {
    "build": {
      "mode": "primary",
      "model": "anthropic/claude-sonnet-4-20250514",
      "prompt": "{file:./prompts/build.txt}",
      "tools": {
        "write": true,
        "edit": true,
        "bash": true
      }
    },
    "plan": {
      "mode": "primary",
      "model": "anthropic/claude-haiku-4-20250514",
      "tools": {
        "write": false,
        "edit": false,
        "bash": false
      }
    },
    "code-reviewer": {
      "description": "Reviews code for best practices and potential issues",
      "mode": "subagent",
      "model": "anthropic/claude-sonnet-4-20250514",
      "prompt": "You are a code reviewer. Focus on security, performance, and maintainability.",
      "tools": {
        "write": false,
        "edit": false
      }
    }
  }
}
```

---

### 2. COMMANDS Schema

**Doc Source:** https://opencode.ai/docs/commands/
**Confidence:** HIGH | **Freshness:** Current (2026-03-25)

#### Command Configuration Schema

```typescript
interface CommandConfig {
  // REQUIRED
  "template": string;                    // Prompt sent to LLM when command executes
  
  // OPTIONAL
  "description"?: string;               // Shown in TUI
  "agent"?: string;                     // Agent to execute (subagent by default)
  "model"?: string;                      // Override default model
  "subtask"?: boolean;                  // Force subagent invocation
}
```

#### Placeholders in Template
| Placeholder | Description |
|-------------|-------------|
| `$ARGUMENTS` | All arguments passed to command |
| `$1`, `$2`, `$3` | Individual positional arguments |
| `!`command`` | Inject bash command output |
| `@filename` | Include file content |

#### Required vs Optional Fields
| Field | Required | Default |
|--------|----------|---------|
| `template` | **YES** | - |
| `description` | No | - |
| `agent` | No | Current agent |
| `model` | No | Current model |
| `subtask` | No | `false` |

#### opencode.json Examples

```json
{
  "command": {
    "test": {
      "template": "Run the full test suite with coverage report and show any failures.\nFocus on the failing tests and suggest fixes.",
      "description": "Run tests with coverage",
      "agent": "build",
      "model": "anthropic/claude-3-5-sonnet-20241022"
    },
    "component": {
      "template": "Create a new React component named $ARGUMENTS with TypeScript support.\nInclude proper typing and basic structure.",
      "description": "Create a new component"
    }
  }
}
```

#### Markdown Command Files
- Location: `.opencode/commands/` (project) or `~/.config/opencode/commands/` (global)
- Filename becomes command name
- Frontmatter defines options

---

### 3. PERMISSIONS Schema

**Doc Source:** https://opencode.ai/docs/permissions/
**Confidence:** HIGH | **Freshness:** Current (2026-03-25)

#### Permission Configuration Schema

```typescript
type PermissionAction = "allow" | "ask" | "deny";

interface PermissionConfig {
  "*"?: PermissionAction;              // Catch-all
  "read"?: PermissionRule;
  "edit"?: PermissionRule;              // Covers edit, write, patch, multiedit
  "glob"?: PermissionRule;
  "grep"?: PermissionRule;
  "list"?: PermissionRule;
  "bash"?: PermissionRule;
  "task"?: PermissionRule;              // Subagent invocation
  "skill"?: PermissionRule;
  "lsp"?: PermissionRule;
  "todoread"?: PermissionAction;
  "todowrite"?: PermissionAction;
  "webfetch"?: PermissionAction;
  "websearch"?: PermissionAction;
  "codesearch"?: PermissionAction;
  "external_directory"?: PermissionRule;
  "doom_loop"?: PermissionAction;
  [key: string]: PermissionRule | PermissionAction | unknown;
}

type PermissionRule = 
  | PermissionAction                    // Simple: "allow" | "ask" | "deny"
  | PermissionObject;                   // Granular: { "pattern": action, ... }

interface PermissionObject {
  [pattern: string]: PermissionAction;
}
```

#### Pattern Matching
- `*` - Matches zero or more of any character
- `?` - Matches exactly one character
- `~` or `$HOME` - Home directory expansion
- Last matching rule wins

#### Available Permission Keys
| Permission | Description | Default |
|------------|-------------|---------|
| `read` | Reading files | `allow` (`.env` denied) |
| `edit` | File modifications | `allow` |
| `glob` | File globbing | `allow` |
| `grep` | Content search | `allow` |
| `list` | Directory listing | `allow` |
| `bash` | Shell commands | `allow` |
| `task` | Subagent invocation | `allow` |
| `skill` | Skill loading | `allow` |
| `lsp` | LSP queries | `allow` |
| `todoread` | Reading todos | `allow` |
| `todowrite` | Writing todos | `allow` |
| `webfetch` | Fetching URLs | `allow` |
| `websearch` | Web search | `allow` |
| `codesearch` | Code search | `allow` |
| `external_directory` | Paths outside workspace | `ask` |
| `doom_loop` | Repeated identical tool calls | `ask` |

#### Required vs Optional Fields
| Field | Required | Default |
|--------|----------|---------|
| All permission keys | No | `allow` (most), `ask` (external_directory, doom_loop) |

#### opencode.json Examples

```json
{
  "permission": {
    "*": "ask",
    "bash": "allow",
    "edit": "deny",
    "webfetch": "allow",
    "bash": {
      "*": "ask",
      "git *": "allow",
      "npm *": "allow",
      "rm *": "deny",
      "grep *": "allow"
    },
    "edit": {
      "*": "deny",
      "packages/web/src/content/docs/*.mdx": "allow"
    }
  }
}
```

---

### 4. TOOLS Schema

**Doc Source:** https://opencode.ai/docs/tools/
**Confidence:** HIGH | **Freshness:** Current (2026-03-25)

#### Built-in Tools
| Tool | Description | Permission Key |
|------|-------------|----------------|
| `bash` | Execute shell commands | `bash` |
| `edit` | Modify existing files | `edit` |
| `write` | Create/overwrite files | `edit` |
| `read` | Read file contents | `read` |
| `grep` | Search with regex | `grep` |
| `glob` | Find files by pattern | `glob` |
| `list` | List directory contents | `list` |
| `lsp` | LSP interactions (experimental) | `lsp` |
| `patch` | Apply patches | `edit` |
| `skill` | Load skill files | `skill` |
| `todowrite` | Manage todos | `todowrite` |
| `todoread` | Read todos | `todoread` |
| `webfetch` | Fetch web content | `webfetch` |
| `websearch` | Search web (Exa) | `websearch` |
| `question` | Ask user questions | `question` |

#### Note
Tools are controlled via `permission` config, not `tools` boolean config (deprecated).

---

### 5. MCP SERVERS Schema

**Doc Source:** https://opencode.ai/docs/mcp-servers/
**Confidence:** HIGH | **Freshness:** Current (2026-03-25)

#### MCP Configuration Schema

```typescript
interface MCPConfig {
  // Common
  "type": "local" | "remote";          // REQUIRED
  "enabled"?: boolean;                  // Default: true
  "timeout"?: number;                   // ms, default: 5000
  
  // Local Only
  "command"?: string[];                  // REQUIRED for local
  "environment"?: Record<string, string>;
  
  // Remote Only
  "url"?: string;                       // REQUIRED for remote
  "headers"?: Record<string, string>;
  "oauth"?: OAuthConfig | false;
}

interface OAuthConfig {
  "clientId"?: string;
  "clientSecret"?: string;
  "scope"?: string;
}
```

#### Required vs Optional Fields
| Field | Required | Type | Default |
|--------|----------|-------|---------|
| `type` | **YES** | `"local"` \| `"remote"` | - |
| `command` | **YES** (local) | `string[]` | - |
| `url` | **YES** (remote) | `string` | - |
| `enabled` | No | `boolean` | `true` |
| `timeout` | No | `number` | `5000` |
| `environment` | No | `object` | - |
| `headers` | No | `object` | - |
| `oauth` | No | `object \| false` | Auto-detect |

#### opencode.json Examples

```json
{
  "mcp": {
    "sentry": {
      "type": "remote",
      "url": "https://mcp.sentry.dev/mcp",
      "oauth": {}
    },
    "context7": {
      "type": "remote",
      "url": "https://mcp.context7.com/mcp",
      "headers": {
        "CONTEXT7_API_KEY": "{env:CONTEXT7_API_KEY}"
      }
    },
    "repomix": {
      "type": "local",
      "command": ["npx", "-y", "repomix", "--mcp"],
      "enabled": false
    }
  }
}
```

---

### 6. PLUGINS Schema

**Doc Source:** https://opencode.ai/docs/plugins/
**Confidence:** HIGH | **Freshness:** Current (2026-03-25)

#### Plugin Configuration

```typescript
// Plugin is an array of plugin identifiers (npm package names or file paths)
type PluginConfig = string[];
```

#### Plugin Locations
| Location | Path |
|----------|------|
| Project | `.opencode/plugins/` |
| Global | `~/.config/opencode/plugins/` |
| npm | Package name in `plugin` array |

#### Plugin Context (available in plugin function)
```typescript
interface PluginContext {
  project: ProjectInfo;
  directory: string;                    // Current working directory
  worktree: string;                    // Git worktree root
  client: OpenCodeSDKClient;
  $: BunShellAPI;                      // Bun.$ for shell commands
}
```

#### Plugin Hooks Available
| Category | Hooks |
|----------|-------|
| Command | `command.executed` |
| File | `file.edited`, `file.watcher.updated` |
| Installation | `installation.updated` |
| LSP | `lsp.client.diagnostics`, `lsp.updated` |
| Message | `message.part.removed`, `message.part.updated`, `message.removed`, `message.updated` |
| Permission | `permission.asked`, `permission.replied` |
| Server | `server.connected` |
| Session | `session.created`, `session.compacted`, `session.deleted`, `session.diff`, `session.error`, `session.idle`, `session.status`, `session.updated` |
| Shell | `shell.env` |
| Tool | `tool.execute.after`, `tool.execute.before` |
| TUI | `tui.prompt.append`, `tui.command.execute`, `tui.toast.show` |

#### opencode.json Examples

```json
{
  "plugin": [
    "opencode-helicone-session",
    "opencode-wakatime",
    "@my-org/custom-plugin",
    ".opencode/plugins/hivemind-context-governance.ts"
  ]
}
```

---

### 7. LSP SERVERS Schema

**Doc Source:** https://opencode.ai/docs/lsp/
**Confidence:** HIGH | **Freshness:** Current (2026-03-25)

#### LSP Configuration Schema

```typescript
interface LSPConfig {
  [serverName: string]: LSPServerConfig | boolean;
}

interface LSPServerConfig {
  "disabled"?: boolean;                // Disable specific server
  "command"?: string[];                // Custom LSP command
  "extensions"?: string[];             // File extensions handled
  "env"?: Record<string, string>;      // Environment variables
  "initialization"?: object;           // Server-specific init options
}
```

#### Built-in LSP Servers
| Server | Extensions | Auto-install |
|--------|------------|--------------|
| astro | .astro | Yes |
| bash | .sh, .bash, .zsh, .ksh | Yes |
| clangd | .c, .cpp, .h, .hpp, etc. | Yes |
| csharp | .cs | .NET SDK |
| dart | .dart | dart command |
| deno | .ts, .tsx, .js, .jsx, .mjs | deno.json |
| eslint | .ts, .tsx, .js, .jsx, etc. | eslint dependency |
| gopls | .go | go command |
| pyright | .py, .pyi | pyright dependency |
| rust | .rs | rust-analyzer |
| typescript | .ts, .tsx, .js, .jsx, .mts, .cts | typescript dependency |
| And 25+ more... | | |

#### opencode.json Examples

```json
{
  "lsp": {
    "typescript": {
      "initialization": {
        "preferences": {
          "importModuleSpecifierPreference": "relative"
        }
      }
    },
    "rust": {
      "env": {
        "RUST_LOG": "debug"
      }
    },
    "custom-lsp": {
      "command": ["custom-lsp-server", "--stdio"],
      "extensions": [".custom"]
    }
  }
}
```

---

### 8. AGENT SKILLS Schema

**Doc Source:** https://opencode.ai/docs/skills/
**Confidence:** HIGH | **Freshness:** Current (2026-03-25)

#### Skill Discovery Locations
| Location | Path |
|----------|------|
| Project | `.opencode/skills/<name>/SKILL.md` |
| Global | `~/.config/opencode/skills/<name>/SKILL.md` |
| Claude-compatible (project) | `.claude/skills/<name>/SKILL.md` |
| Claude-compatible (global) | `~/.claude/skills/<name>/SKILL.md` |
| Agent-compatible (project) | `.agents/skills/<name>/SKILL.md` |
| Agent-compatible (global) | `~/.agents/skills/<name>/SKILL.md` |

#### SKILL.md Frontmatter Schema

```typescript
interface SkillFrontmatter {
  "name": string;                      // REQUIRED: 1-64 chars, lowercase hyphenated
  "description": string;               // REQUIRED: 1-1024 chars
  "license"?: string;
  "compatibility"?: string;
  "metadata"?: Record<string, string>;
}
```

#### Name Validation Regex
```
^[a-z0-9]+(-[a-z0-9]+)*$
```

#### Skill Permission Configuration
```json
{
  "permission": {
    "skill": {
      "*": "allow",
      "pr-review": "allow",
      "internal-*": "deny",
      "experimental-*": "ask"
    }
  }
}
```

---

### 9. RULES/INSTRUCTIONS Schema

**Doc Source:** https://opencode.ai/docs/rules/
**Confidence:** HIGH | **Freshness:** Current (2026-03-25)

#### Instruction File Locations
| Type | Path |
|------|------|
| Project | `AGENTS.md` or `CLAUDE.md` (fallback) |
| Global | `~/.config/opencode/AGENTS.md` |
| Claude-compatible (global) | `~/.claude/CLAUDE.md` |

#### Instructions Config
```typescript
// In opencode.json
interface InstructionsConfig {
  "instructions": string[];            // Paths/URLs to instruction files
}
```

#### Precedence
1. Local `AGENTS.md` / `CLAUDE.md` (first found, traversing up)
2. Global `~/.config/opencode/AGENTS.md`
3. Claude `~/.claude/CLAUDE.md`

#### opencode.json Examples

```json
{
  "instructions": [
    "CONTRIBUTING.md",
    "docs/guidelines.md",
    ".cursor/rules/*.md",
    "https://raw.githubusercontent.com/my-org/shared-rules/main/style.md"
  ]
}
```

---

### 10. CUSTOM TOOLS Schema

**Doc Source:** https://opencode.ai/docs/custom-tools/
**Confidence:** HIGH | **Freshness:** Current (2026-03-25)

#### Custom Tool Definition Schema

```typescript
// Using tool() helper from @opencode-ai/plugin
import { tool } from "@opencode-ai/plugin"

const myTool = tool({
  description: string;                  // Tool description for LLM
  args: {                               // Zod schema for arguments
    [key: string]: z.ZodType;
  };
  async execute(args, context) {        // Execution function
    // context.sessionID
    // context.agent
    // context.directory
    // context.worktree
    // context.abort
    // context.metadata()
    // context.ask()
    return JSON.stringify({ ... });
  }
});
```

#### Tool Locations
| Location | Path |
|----------|------|
| Project | `.opencode/tools/` |
| Global | `~/.config/opencode/tools/` |

#### Context Interface
```typescript
interface ToolContext {
  sessionID: string;
  agent: string;
  directory: string;                   // Session working directory
  worktree: string;                    // Git worktree root
  abort: AbortSignal;
  metadata(): void;
  ask(): Promise<UserResponse>;
}
```

---

### 11. FORMATTERS Schema

**Doc Source:** https://opencode.ai/docs/formatters/
**Confidence:** HIGH | **Freshness:** Current (2026-03-25)

#### Formatter Configuration Schema

```typescript
interface FormatterConfig {
  [formatterName: string]: FormatterSettings | boolean;
}

interface FormatterSettings {
  "disabled"?: boolean;
  "command"?: string[];                // Formatter command with $FILE placeholder
  "environment"?: Record<string, string>;
  "extensions"?: string[];             // File extensions handled
}
```

#### Built-in Formatters
| Formatter | Extensions | Requirement |
|-----------|------------|-------------|
| biome | .js, .jsx, .ts, .tsx, .html, .css, .md, .json, .yaml | biome.json config |
| prettier | Many | prettier dependency |
| eslint | .ts, .tsx, .js, .jsx, etc. | eslint config |
| ruff | .py, .pyi | ruff command |
| rustfmt | .rs | rustfmt command |
| gofmt | .go | gofmt command |
| And 20+ more... | | |

#### opencode.json Examples

```json
{
  "formatter": {
    "prettier": {
      "disabled": true
    },
    "custom-prettier": {
      "command": ["npx", "prettier", "--write", "$FILE"],
      "environment": {
        "NODE_ENV": "development"
      },
      "extensions": [".js", ".ts", ".jsx", ".tsx"]
    }
  }
}
```

---

### 12. SERVER Schema

**Doc Source:** https://opencode.ai/docs/config/
**Confidence:** HIGH | **Freshness:** Current (2026-03-25)

#### Server Configuration Schema

```typescript
interface ServerConfig {
  "port"?: number;                    // Port to listen on
  "hostname"?: string;                 // Hostname, defaults to "0.0.0.0" when mdns enabled
  "mdns"?: boolean;                   // Enable mDNS discovery
  "mdnsDomain"?: string;               // Custom mDNS domain, default: "opencode.local"
  "cors"?: string[];                  // Additional CORS origins
}
```

---

### 13. PROVIDER Schema

**Doc Source:** https://opencode.ai/docs/models/
**Confidence:** HIGH | **Freshness:** Current (2026-03-25)

#### Provider Configuration Schema

```typescript
interface ProviderConfig {
  "options"?: {
    "apiKey"?: string;                // "{env:VAR_NAME}" syntax
    "timeout"?: number;               // Request timeout in ms, default: 300000
    "chunkTimeout"?: number;          // Chunk timeout in ms
    "setCacheKey"?: boolean;
    "baseURL"?: string;               // Custom base URL
  };
  "models"?: {
    [modelName: string]: {
      "limit"?: { "context"?: number; "output"?: number; };
      "options"?: Record<string, unknown>;  // Provider-specific options
      "variants"?: {
        [variantName: string]: {
          // Variant-specific options
          [key: string]: unknown;
        };
      };
      "disabled"?: boolean;
    };
  };
}
```

#### Provider Options by Service
| Provider | Options |
|----------|---------|
| All | `timeout`, `chunkTimeout`, `setCacheKey`, `baseURL` |
| Amazon Bedrock | `region`, `profile`, `endpoint` |
| OpenAI | Provider-specific model options |
| Anthropic | `thinking` config |

---

### 14. Additional Configuration Keys

#### Compaction
```typescript
interface CompactionConfig {
  "auto"?: boolean;                   // Default: true
  "prune"?: boolean;                 // Default: true  
  "reserved"?: number;               // Token buffer
}
```

#### Watcher
```typescript
interface WatcherConfig {
  "ignore"?: string[];               // Glob patterns
}
```

---

## Current opencode.json Analysis

**File:** `/Users/apple/hivemind-plugin/.worktrees/product-detox/opencode.json`

```json
{
  "$schema": "https://opencode.ai/config.json",
  "model": "minimax-coding-plan/MiniMax-M2.7",
  "plugin": [
    ".opencode/plugins/hivemind-context-governance.ts"
  ],
  "provider": {
    "minimax": {
      "options": {
        "apiKey": "{env:MINIMAX_API_KEY}"
      }
    },
    "openai": {
      "models": {
        "gpt-5.4": {
          "limit": {
            "context": 200000,
            "output": 128000
          }
        }
      }
    }
  }
}
```

**Current Configuration Coverage:**

| Entity Type | Configured | Missing from Config |
|-------------|------------|---------------------|
| Model | ✅ | - |
| Plugin | ✅ | - |
| Provider | ✅ | - |
| Agent | ❌ | Not configured |
| Command | ❌ | Not configured |
| Permission | ❌ | Not configured |
| MCP | ❌ | Not configured |
| LSP | ❌ | Not configured |
| Formatter | ❌ | Not configured |
| Skills | ❌ | Not configured |
| Instructions | ❌ | Not configured |

---

## Existing TypeScript Types in Project

The project contains internal TypeScript interfaces for OpenCode entity handling:

### Agent Registry (`src/shared/opencode-agent-registry.ts`)
```typescript
interface CanonicalAgentFrontmatter {
  description?: string;
  mode?: string;
  tools?: Record<string, unknown>;
  permission?: Record<string, unknown>;
  [key: string]: unknown;
}

interface RuntimeAgentFrontmatter {
  description?: string;
  mode?: string;
  tools?: Record<string, unknown>;
  permission?: Record<string, unknown>;
}

interface OpencodeAgentRegistryEntry {
  id: string;
  sourcePath: string;
  canonicalFrontmatter: CanonicalAgentFrontmatter;
  runtimeFrontmatter: RuntimeAgentFrontmatter;
  body: string;
  runtimeMarkdown: string;
}
```

### Skill Registry (`src/shared/opencode-skill-registry.ts`)
```typescript
interface SkillFrontmatter {
  name: string;
  description: string;
  [key: string]: unknown;
}

interface OpencodeSkillRegistryEntry {
  id: string;
  sourcePath: string;
  frontmatter: SkillFrontmatter;
  body: string;
  runtimeMarkdown: string;
  referenceFiles: Map<string, string>;
  templateFiles: Map<string, string>;
  testFiles: Map<string, string>;
}
```

---

## No Existing OpenCode Schema File Found

**Search Results:**
- No `opencode-schema.ts` or similar found in project
- No `zod` schema definitions for OpenCode config
- The official JSON schema is at `https://opencode.ai/config.json` (fetched above)
- SDK reference file `.repo-sdk-packed/opencode-api-sdk.xml` does not exist in this project

---

## Summary: Configuration Precedence

From lowest to highest priority (later overrides earlier):

1. **Remote config** (`.well-known/opencode`) - Organizational defaults
2. **Global config** (`~/.config/opencode/opencode.json`)
3. **Custom config** (`OPENCODE_CONFIG` env var)
4. **Project config** (`opencode.json`)
5. **`.opencode/` directories** (agents/, commands/, plugins/, skills/, tools/)
6. **Inline config** (`OPENCODE_CONFIG_CONTENT` env var)

Configuration files are **merged**, not replaced. Later sources override conflicting keys while preserving non-conflicting settings.