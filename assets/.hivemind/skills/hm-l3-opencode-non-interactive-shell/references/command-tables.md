# Command Reference Tables

## Package Managers

| Tool | Interactive (BAD) | Non-Interactive (GOOD) |
|------|-------------------|------------------------|
| **NPM** | `npm init` | `npm init -y` |
| **NPM** | `npm install` | `npm install --yes` |
| **Yarn** | `yarn install` | `yarn install --non-interactive` |
| **PNPM** | `pnpm install` | `pnpm install --reporter=silent` |
| **Bun** | `bun init` | `bun init -y` |
| **APT** | `apt-get install pkg` | `apt-get install -y pkg` |
| **APT** | `apt-get upgrade` | `apt-get upgrade -y` |
| **PIP** | `pip install pkg` | `pip install --no-input pkg` |
| **Homebrew** | `brew install pkg` | `HOMEBREW_NO_AUTO_UPDATE=1 brew install pkg` |

## Git Operations

| Action | Interactive (BAD) | Non-Interactive (GOOD) |
|--------|-------------------|------------------------|
| **Commit** | `git commit` | `git commit -m "msg"` |
| **Merge** | `git merge branch` | `git merge --no-edit branch` |
| **Pull** | `git pull` | `git pull --no-edit` |
| **Rebase** | `git rebase -i` | `git rebase` (non-interactive) |
| **Add** | `git add -p` | `git add .` or `git add <file>` |
| **Stash** | `git stash pop` (conflicts) | `git stash pop` or handle manually |
| **Log** | `git log` (pager) | `git log --no-pager` or `git log -n 10` |
| **Diff** | `git diff` (pager) | `git diff --no-pager` or `git --no-pager diff` |

## System & Files

| Tool | Interactive (BAD) | Non-Interactive (GOOD) |
|------|-------------------|------------------------|
| **RM** | `rm file` (prompts) | `rm -f file` |
| **RM** | `rm -i file` | `rm -f file` |
| **CP** | `cp -i a b` | `cp -f a b` |
| **MV** | `mv -i a b` | `mv -f a b` |
| **Unzip** | `unzip file.zip` | `unzip -o file.zip` |
| **Tar** | `tar xf file.tar` | `tar xf file.tar` (usually safe) |
| **SSH** | `ssh host` | `ssh -o BatchMode=yes -o StrictHostKeyChecking=no host` |
| **SCP** | `scp file host:` | `scp -o BatchMode=yes file host:` |
| **Curl** | `curl url` | `curl -fsSL url` |
| **Wget** | `wget url` | `wget -q url` |

## Docker

| Action | Interactive (BAD) | Non-Interactive (GOOD) |
|--------|-------------------|------------------------|
| **Run** | `docker run -it image` | `docker run image` |
| **Exec** | `docker exec -it container bash` | `docker exec container cmd` |
| **Build** | `docker build .` | `docker build --progress=plain .` |
| **Compose** | `docker-compose up` | `docker-compose up -d` |

## Python/Node REPLs

| Tool | Interactive (BAD) | Non-Interactive (GOOD) |
|------|-------------------|------------------------|
| **Python** | `python` | `python -c "code"` or `python script.py` |
| **Node** | `node` | `node -e "code"` or `node script.js` |
| **IPython** | `ipython` | Never use - always `python -c` |

## Banned Commands (Will Always Hang)

These commands **will hang indefinitely** - never use them:

- **Editors**: `vim`, `vi`, `nano`, `emacs`, `pico`, `ed`
- **Pagers**: `less`, `more`, `most`, `pg`
- **Manual pages**: `man`
- **Interactive git**: `git add -p`, `git rebase -i`, `git commit` (without -m)
- **REPLs**: `python`, `node`, `irb`, `ghci` (without script/command)
- **Interactive shells**: `bash -i`, `zsh -i`
