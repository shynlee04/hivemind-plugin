# Prompt Handling Patterns

## The "Yes" Pipe
```bash
yes | ./install_script.sh
```

## Heredoc Input
```bash
./configure.sh <<EOF
option1
option2
EOF
```

## Echo Pipe
```bash
echo "password" | sudo -S command
```

## Timeout Wrapper (last resort)
```bash
timeout 30 ./potentially_hanging_script.sh || echo "Timed out"
```

## Best Practices

1. **Always test commands** mentally for interactive prompts before running
2. **Check man pages** (via web search) for `-y`, `--yes`, `--non-interactive`, `-f`, `--force` flags
3. **Use `--help`** to discover non-interactive options: `cmd --help | grep -i "non-interactive\|force\|yes"`
4. **Prefer OpenCode tools** over shell commands for file operations
5. **Set timeout** for any command that might unexpectedly prompt
