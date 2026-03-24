# Repomix Ingestion — Complete Reference

Comprehensive guide to using Repomix for research: CLI commands, MCP tools, XML structure, grep patterns, SDK usage, and workflow patterns.

## Overview

Repomix packs repositories (local or remote) into structured output for AI analysis. It transforms entire codebases into a single, searchable artifact.

## CLI Reference

### Basic Commands

```bash
# Pack current directory
npx repomix

# Pack specific directory
npx repomix --dir /path/to/project

# Pack remote repository
npx repomix --remote user/repo

# Pack with file filtering
npx repomix --include "src/**/*.ts" --exclude "**/*.test.ts"

# Output formats
npx repomix --output output.xml    # XML (default)
npx repomix --output output.md     # Markdown
npx repomix --output output.txt    # Plain text
npx repomix --output output.json   # JSON

# Start MCP server
npx repomix --mcp
```

### CLI Flags

| Flag | Description | Default |
|---|---|---|
| `--remote <owner/repo>` | Pack a remote GitHub repository | — |
| `--dir <path>` | Directory to pack | `.` |
| `--output <file>` | Output file path | `repomix-output.xml` |
| `--include <pattern>` | Include files (glob) | — |
| `--exclude <pattern>` | Exclude files (glob) | — |
| `--style <format>` | Output format: xml, markdown, plain, json | `xml` |
| `--mcp` | Start as MCP server | — |
| `--compress` | Enable tree-sitter compression | false |

### Gitignore Respect

Repomix automatically respects `.gitignore`. Files matching gitignore patterns are excluded by default.

Additional exclusions via `--exclude`:
```bash
npx repomix --exclude "node_modules/**" --exclude ".git/**" --exclude "dist/**"
```

## MCP Tools

When running as MCP server (`npx repomix --mcp`), these tools are available:

### repomix_pack_codebase

Pack a local directory.

```json
{
  "directory": "/absolute/path/to/project",
  "includePatterns": "src/**/*.ts,docs/**/*.md",
  "ignorePatterns": "test/**,*.spec.ts",
  "compress": false
}
```

Returns: `{ outputId: "..." }`

### repomix_pack_remote_repository

Pack a remote GitHub repository.

```json
{
  "remote": "owner/repo",
  "includePatterns": "src/**",
  "ignorePatterns": "test/**",
  "compress": false
}
```

Returns: `{ outputId: "..." }`

### repomix_read_repomix_output

Read the full content of a packed output.

```json
{
  "outputId": "<from pack result>"
}
```

Returns: Full packed content (XML, Markdown, or Plain text).

### repomix_grep_repomix_output

Search packed output with regex patterns.

```json
{
  "outputId": "<from pack result>",
  "pattern": "export (class|interface|function)",
  "contextLines": 2,
  "ignoreCase": false
}
```

Returns: Matching lines with context.

### repomix_attach_packed_output

Attach an existing Repomix output file for analysis.

```json
{
  "path": "/path/to/repomix-output.xml"
}
```

Returns: `{ outputId: "..." }`

### repomix_file_system_read_file

Read a specific file from the packed repository.

```json
{
  "path": "/absolute/path/to/file.ts"
}
```

### repomix_file_system_read_directory

List directory contents.

```json
{
  "path": "/absolute/path/to/directory"
}
```

### repomix_generate_skill

Generate a Claude Agent Skill from a codebase.

```json
{
  "directory": "/path/to/project",
  "skillName": "my-project-reference"
}
```

## XML Structure

Repomix XML output follows this structure:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<repomix>
  <summary>
    <repository_info>
      <name>project-name</name>
      <file_count>42</file_count>
      <total_tokens>125000</total_tokens>
    </repository_info>
    <file_tree>
      ├── src/
      │   ├── index.ts
      │   ├── utils/
      │   │   └── helpers.ts
      │   └── types.ts
      ├── package.json
      └── tsconfig.json
    </file_tree>
  </summary>
  <files>
    <file path="src/index.ts">
      <content><![CDATA[
        // file contents here
      ]]></content>
    </file>
    <file path="src/utils/helpers.ts">
      <content><![CDATA[
        // file contents here
      ]]></content>
    </file>
  </files>
</repomix>
```

### XML Element Reference

| Element | Description |
|---|---|
| `<repomix>` | Root element |
| `<summary>` | Repository metadata and file tree |
| `<repository_info>` | Name, file count, token count |
| `<file_tree>` | ASCII directory tree |
| `<files>` | Container for all file contents |
| `<file path="...">` | Individual file with path attribute |
| `<content>` | CDATA-wrapped file content |

## Grep Patterns for Packed Output

Use `repomix_grep_repomix_output` with these patterns:

### Finding Exports

```javascript
// All exports
pattern: "export (default )?(class|interface|function|const|type|enum)"

// Named exports only
pattern: "export (const|let|var|function) \\w+"

// Default exports
pattern: "export default"
```

### Finding Classes and Interfaces

```javascript
// Class declarations
pattern: "(export )?(abstract )?class \\w+"

// Interface declarations
pattern: "(export )?interface \\w+"

// Type aliases
pattern: "(export )?type \\w+"
```

### Finding Functions

```javascript
// Function declarations
pattern: "(export )?(async )?function \\w+"

// Arrow function assignments
pattern: "(export )?const \\w+ = (async )?\\("

// Method definitions
pattern: "(async )?\\w+\\([^)]*\\).*{"
```

### Finding Imports

```javascript
// All imports
pattern: "^import .* from ['\"]"

// Specific module imports
pattern: "import .* from ['\"]@opencode-ai"

// Type-only imports
pattern: "import type .* from ['\"]"
```

### Finding Configuration

```javascript
// Package.json dependencies
pattern: "\"(dependencies|devDependencies)\":"

// TypeScript config
pattern: "\"(compilerOptions|include|exclude)\":"

// Environment variables
pattern: "process\\.env\\.[A-Z_]+"
```

## SDK Usage

Use the Repomix SDK for programmatic packing in research automation.

### Installation

```bash
npm install repomix
```

### Basic Usage

```javascript
import { pack } from 'repomix';

const result = await pack({
  directory: '/path/to/repo',
  include: ['src/**/*.ts'],
  exclude: ['**/*.test.ts'],
  output: {
    filePath: 'output.xml',
    style: 'xml'
  }
});

console.log(`Packed ${result.fileCount} files, ${result.totalTokens} tokens`);
```

### Options

```typescript
interface PackOptions {
  directory: string;
  include?: string[];
  exclude?: string[];
  output?: {
    filePath?: string;
    style?: 'xml' | 'markdown' | 'plain' | 'json';
  };
  compress?: boolean;
}
```

## Local Download Workflow

When MCP isn't available, download and analyze manually:

```bash
# Step 1: Clone or pack the repository
git clone --depth 1 https://github.com/owner/repo.git /tmp/repo-analysis
cd /tmp/repo-analysis

# Step 2: Pack with Repomix
npx repomix --output analysis.xml --include "src/**/*.ts"

# Step 3: Search the output
grep -n "export class" analysis.xml
grep -n "interface.*Props" analysis.xml

# Step 4: Clean up
rm -rf /tmp/repo-analysis
```

## Available Skills from Repomix

`repomix_generate_skill` creates skill packages with:

- `SKILL.md` — Entry point with usage guide
- `references/summary.md` — Project purpose and statistics
- `references/project-structure.md` — Directory tree with line counts
- `references/files.md` — All file contents
- `references/tech-stack.md` — Languages, frameworks, dependencies

## Performance Tips

| Tip | Impact |
|---|---|
| Use `--include` to scope files | Reduces tokens by 60-80% |
| Use `--compress` for large repos | Reduces tokens by ~70% |
| Pack remote repos (avoids clone) | Saves disk I/O and time |
| Cache packed outputs with `attach` | Avoids re-packing same repo |
| Use JSON output for programmatic | Easier to parse than XML |
