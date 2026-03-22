# Platform Surface

## Supported Platforms

| Platform | Directory | Config File | Skill Directory |
|----------|-----------|-------------|------------------|
| OpenCode | `.opencode/` | `opencode.json` | `.opencode/skills/` |
| Claude Code | `.claude/` | `CLAUDE.md` | `.claude/skills/` |
| Codex | `.codex/` | `CODEX.md` | `.codex/skills/` |
| Qwen | `.qwen/` | `QWEN.md` | `.qwen/skills/` |
| Roo | `.roo/` | `ROO.md` | `.roo/skills/` |
| Cursor | `.cursor/` | `cursor.json` | `.cursor/skills/` |
| GitHub Copilot | `.github/` | `.github/copilot` | `.github/skills/` |
| Agent | `.agent/` | `AGENT.md` | `.agent/skills/` |

---

## Platform Detection

### Primary Indicators

```bash
# Check for platform directories
ls -la | grep -E "^\.|d" | grep -E "opencode|claude|codex|qwen|roo|cursor|github|agent"
```

### Governance File Priority

| Priority | File | Platform |
|----------|------|----------|
| 1 | `AGENTS.md` (root) | Universal |
| 2 | `.opencode/AGENTS.md` | OpenCode |
| 3 | `CLAUDE.md` | Claude Code |
| 4 | `CODEX.md` | Codex |
| 5 | `README.md` | Fallback |

### Detection Algorithm

```javascript
function detectPlatform() {
  const platforms = {
    opencode: ['.opencode/opencode.json', '.opencode/AGENTS.md'],
    claude: ['CLAUDE.md', '.claude/CLAUDE.md'],
    codex: ['CODEX.md', '.codex/CODEX.md'],
    qwen: ['QWEN.md', '.qwen/QWEN.md'],
    roo: ['ROO.md', '.roo/ROO.md'],
    cursor: ['cursor.json', '.cursor/rules'],
    github: ['.github/copilot', '.github/skills/'],
    agent: ['AGENT.md', '.agent/skills/']
  };

  for (const [platform, indicators] of Object.entries(platforms)) {
    for (const indicator of indicators) {
      if (fs.existsSync(path.join(process.cwd(), indicator))) {
        return platform;
      }
    }
  }
  
  return 'unknown';
}
```

---

## Skill Loading Paths

### Platform-Specific Skill Directories

| Platform | Skills Path | Priority |
|----------|-------------|----------|
| OpenCode | `.opencode/skills/` | 1 |
| Claude Code | `.claude/skills/` | 1 |
| Codex | `.codex/skills/` | 1 |
| Universal | `skills/` | 2 |

### Skill Loading Order

1. **Platform-specific skills** (`.{platform}/skills/`)
2. **Root skills** (`skills/`)
3. **Deprecated skills** (`skills/_deprecated_*`) - *Should be skipped*

### Symlink Resolution

Some platforms may use symlinks:

```bash
# Check if directory is symlink
ls -la .opencode/skills/ | grep "^l"

# Resolve symlink
readlink -f .opencode/skills/
```

---

## Cross-Platform Considerations

### Common Governance Files

| File | Purpose | All Platforms |
|------|---------|---------------|
| `AGENTS.md` | Agent instructions | Yes |
| `README.md` | Project documentation | Yes |
| `package.json` | Dependencies | Yes |
| `.gitignore` | Git ignores | Yes |

### Platform-Specific Governance

| File | Platform | Purpose |
|------|----------|---------|
| `opencode.json` | OpenCode | Config + permissions |
| `CLAUDE.md` | Claude Code | Agent context |
| `CODEX.md` | Codex | Agent context |

---

## Path Patterns

### Safe Path Patterns

```javascript
// Use patterns, not hardcoded paths
const patterns = {
  governance: ['AGENTS.md', '*/AGENTS.md', '.*/AGENTS.md'],
  skills: ['skills/**/SKILL.md', '.*/skills/**/SKILL.md'],
  config: ['*.json', '.*.json', '*.md', '.*.md']
};
```

### Antipatterns to Avoid

```javascript
// DON'T: Hardcode paths
const bad = '/Users/apple/hivemind-plugin/skills/...';

// DO: Use patterns
const good = 'skills/**/SKILL.md';
```

---

## Platform Detection Script

```bash
#!/bin/bash
# detect-platform.sh

PLATFORM="unknown"

# Check for OpenCode
if [ -f "opencode.json" ] || [ -f ".opencode/opencode.json" ]; then
  PLATFORM="opencode"
# Check for Claude Code
elif [ -f "CLAUDE.md" ] || [ -d ".claude" ]; then
  PLATFORM="claude"
# Check for Codex
elif [ -f "CODEX.md" ] || [ -d ".codex" ]; then
  PLATFORM="codex"
# Check for Qwen
elif [ -f "QWEN.md" ] || [ -d ".qwen" ]; then
  PLATFORM="qwen"
# Check for Roo
elif [ -f "ROO.md" ] || [ -d ".roo" ]; then
  PLATFORM="roo"
# Check for Cursor
elif [ -f "cursor.json" ] || [ -d ".cursor" ]; then
  PLATFORM="cursor"
# Check for GitHub Copilot
elif [ -d ".github/copilot" ] || [ -d ".github/skills" ]; then
  PLATFORM="github"
# Check for Agent
elif [ -f "AGENT.md" ] || [ -d ".agent" ]; then
  PLATFORM="agent"
fi

echo "{ \"platform\": \"$PLATFORM\", \"timestamp\": \"$(date -Iseconds)\" }"
```

---

## Symlink Best Practices

### For Skill Portability

If a skill should be available across multiple platforms:

```bash
# Create skill once
mkdir -p skills/context-intelligence-entry

# Symlink to platforms
ln -s ../../skills/context-intelligence-entry .opencode/skills/context-intelligence-entry
ln -s ../../skills/context-intelligence-entry .claude/skills/context-intelligence-entry
ln -s ../../skills/context-intelligence-entry .codex/skills/context-intelligence-entry
```

### Verification

```bash
# Verify symlinks
find . -type l -name "context-intelligence-entry" 2>/dev/null

# Check symlink targets
ls -la .opencode/skills/context-intelligence-entry
```

---

## Platform Mismatch Detection

### Symptoms

- Skill exists in `.opencode/skills/` but project uses `.claude/`
- Governance file references platform-specific features
- Config files for wrong platform present

### Resolution

1. Detect primary platform first
2. Use platform-specific paths
3. Fall back to universal paths
4. Never assume platform