# Install and Use OpenSpec in OpenCode

This guide installs the OpenSpec skill set — invoked as `/opsx:autonomous-apply` — into a project for use with [OpenCode](https://opencode.ai/).

## Prerequisites

- Node.js 18+ and `npx` available.
- OpenCode CLI installed (`opencode`).
- Your project initialized as a git repository.

## Install the Skills

From your project root:

```bash
npx openspec@latest init --tools opencode
```

This creates (at project root):

```
.opencode/
├── skills/
│   ├── openspec-autonomous-apply/SKILL.md   ← the skill this doc covers
│   ├── openspec-propose/SKILL.md
│   ├── openspec-apply-change/SKILL.md
│   ├── openspec-verify-change/SKILL.md
│   └── ... (13 skills total)
├── command/    ← opsx slash-command wrappers, if delivery includes commands
openspec/
├── config.yaml
└── specs/
└── changes/
```

OpenCode only picks up project `.opencode/skills/` when the directory is registered in `~/.config/opencode/opencode.json`. Ensure this entry exists (OpenSpec init normally adds it; verify if unsure):

```json
{
  "skills": {
    "paths": [".opencode/skills"]
  }
}
```

Restart OpenCode after editing `opencode.json`.

## Using `/opsx:autonomous-apply` in OpenCode

Invoke as:

```
/opsx:autonomous-apply
```

(or `/openhands:autonomous-apply` depending on OpenCode version; both aliases resolve to the same skill).

### Behavioral Differences vs Claude Code

- **Worktree isolation**: OpenCode does not have a built-in `Agent(isolation="worktree")` flag. The skill requires the implementation subagent to `cd` into `.claude/worktrees/openspec-<change-name>/` before any file operation; this is a documented contract, not a hard filesystem boundary. Always review the worktree diff before merging.
- **Concurrency cap**: OpenCode's subagent system does not have an external `Workflow` primitive. The skill chunks concurrent reviewer agents to 2 at a time by default (max 4). To configure, edit `openspec/config.yaml`:

  ```yaml
  agent:
    maxParallelRequests: 4
  ```

- **Review mode / merge strategy**: the skill uses sequential question prompts; you will be asked review-mode and then merge-strategy interactively, never as a batch.

## Making It Project-Local (Recommended)

Committing `.opencode/skills/`, `.opencode/command/`, and `openspec/` makes every contributor's environment identical. The `~/.config/opencode/opencode.json` entry is per-user (skills path registration is not shareable via git), so document the one-line addition above in your project's contributor guide.

## Uninstall / Reset

```bash
rm -rf .opencode/skills/openspec-* .opencode/command/opsx*
rm -rf openspec/changes/<your-change-name>
git worktree remove .claude/worktrees/openspec-<change-name>/ 2>/dev/null
```

Note: generated worktrees live under `.claude/worktrees/` even for OpenCode (path is consistent across assistants); they are plain directories plus a `.git` file.
