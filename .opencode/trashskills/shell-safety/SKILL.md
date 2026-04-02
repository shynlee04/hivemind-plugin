---
name: "shell-safety"
description: "Non-interactive shell strategy for headless agent execution. Prevents hangs, timeouts, and TTY-related failures by enforcing non-interactive flags, banning interactive commands, and using safe input patterns."
---

# Non-Interactive Shell Strategy

## Core Rule

**Agents run headless. Every command must complete without human input.**

## Banned Commands

These commands open interactive TUIs and will **hang forever**:

```
vim, vi, nano, less, more, man, top, htop, btop
python, python3, node, irb, pry, bc  (without args or script input)
ssh, telnet, mysql, psql  (without -c flag)
apt, apt-get  (without -y)
sudo  (without -n flag when possible)
```

If you need to edit a file, use the Edit/Write tool. If you need to read a file, use the Read tool.

## Package Manager Non-Interactive Flags

```bash
# npm
npm install --yes
npm config set fund false && npm config set audit false

# yarn
yarn install --non-interactive

# pnpm
pnpm install --reporter=default

# pip
pip install --no-input --no-cache-dir

# brew
brew install --quiet

# apt/dpkg
dpkg --configure -a
apt-get install -y -qq
DEBIAN_FRONTEND=noninteractive apt-get install -y
```

## Git Non-Interactive Patterns

```bash
GIT_TERMINAL_PROMPT=0 git clone <url>
git pull --no-edit
git merge --no-edit --no-ff
git commit -m "message"
git rebase --continue  # only if no conflicts
git push --porcelain  # machine-readable output
```

## Docker Non-Interactive Patterns

```bash
# NEVER use -it flags
docker run --rm alpine echo hello    # not: docker run -it
docker exec <container> ls /app      # not: docker exec -it
docker build --progress=plain .      # not: docker build (default can be interactive)
docker compose up -d                 # detached, not foreground
```

## Environment Variables

Set these at the start of any session that runs system commands:

```bash
export CI=true
export GIT_TERMINAL_PROMPT=0
export DEBIAN_FRONTEND=noninteractive
export npm_config_yes=true
export PIP_NO_INPUT=1
export HOMEBREW_NO_INTERACTIVE=1
```

## Safe Input Patterns

### The "yes" pipe (for commands that ask for confirmation)
```bash
yes | sudo apt-get install something
yes | ./install-script.sh
```

### Heredoc input (for multi-line stdin)
```bash
cat <<'EOF' > /tmp/config.yaml
key: value
another: entry
EOF
```

### Echo pipe (for single-line stdin)
```bashecho "password" | sudo -S command
echo "y" | some-command
```

## Timeout Safety Net

Always wrap risky commands with `timeout`:

```bash
timeout 30 npm install 2>&1
timeout 60 docker build . 2>&1
```

If a command hangs despite precautions, the timeout kills it gracefully.

## Quick Checklist

Before running ANY command, verify:
- [ ] Does it require TTY input? → Use non-interactive flag
- [ ] Does it wait for user confirmation? → Pipe `yes` or use `-y`
- [ ] Does it open a pager? → Redirect output: `| cat` or `> file`
- [ ] Does it prompt for credentials? → Use env vars or token auth
