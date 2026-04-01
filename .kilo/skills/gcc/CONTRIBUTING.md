# Contributing to Git Context Controller (GCC)

Thanks for your interest in contributing. This document covers how to get involved.

## Ways to Contribute

- **Bug reports**: Open an issue describing the problem, steps to reproduce, and expected behavior
- **Feature requests**: Open an issue with the proposed feature and its use case
- **Code contributions**: Submit a pull request (see workflow below)
- **Documentation**: Improve README, file format specs, or add examples
- **New agent integrations**: Adapt GCC for agents beyond Claude Code

## Development Setup

```bash
# Fork and clone the repository
git clone https://github.com/<your-username>/git-context-controller.git
cd git-context-controller

# Test the initialization script
./scripts/gcc_init.sh /tmp/test-gcc
```

## Pull Request Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-improvement`
3. Make your changes
4. Test with a real Claude Code session to verify the skill works correctly
5. Commit with a clear message describing *why*, not just *what*
6. Push and open a pull request against `main`

## PR Guidelines

- Keep PRs focused on a single change
- Update documentation if you change behavior
- Add examples for new features when possible
- Follow existing file format conventions

## Code Style

- Shell scripts: Use `set -e`, quote variables, POSIX-compatible where possible
- Markdown: ATX headings (`#`), fenced code blocks, reference-style links for repeated URLs
- YAML: 2-space indentation, quoted strings for values containing special characters

## File Format Changes

If you modify the GCC file formats (`commit.md`, `log.md`, `metadata.yaml`, `main.md`):

1. Update `references/file_formats.md` with the new format
2. Update `SKILL.md` if the change affects how the agent uses the format
3. Update `scripts/gcc_init.sh` if initialization output changes
4. Add a migration note if the change breaks backward compatibility

## Reporting Issues

When reporting bugs, include:

- What you were trying to do
- The agent platform (Claude Code, Cursor, etc.)
- The error or unexpected behavior
- Contents of relevant `.GCC/` files if applicable

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
