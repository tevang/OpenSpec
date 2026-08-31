# Install and Use OpenSpec in Codex

This guide installs the OpenSpec skill set — including `openspec-autonomous-apply` — into a project for use with [OpenAI Codex](https://openai.com/index/introducing-codex/) (CLI or web).

## Prerequisites

- Node.js 18+ and `npx` available.
- Codex CLI installed (`codex` command available) or Codex web connected to the repository.
- Your project initialized as a git repository.

## Install the Skills

From your project root:

```bash
npx openspec@latest init --tools codex
```

This creates (at project root):

```
.agents/
├── skills/
│   ├── openspec-autonomous-apply/SKILL.md   ← the skill this doc covers
│   ├── openspec-propose/SKILL.md
│   ├── openspec-apply-change/SKILL.md
│   ├── openspec-verify-change/SKILL.md
│   └── ... (13 skills total)
openspec/
├── config.yaml
└── specs/
└── changes/
```

Codex CLI reads any `.agents/skills/*/SKILL.md` in the project as a project-local skill. Verify by asking Codex to list available skills or by checking the file exists:

```bash
ls .agents/skills/openspec-autonomous-apply/SKILL.md
```

## Using `openspec-autonomous-apply` in Codex

Invoke it the same way as any project skill:

```
openspec-autonomous-apply
```

or ask Codex:

> "Run the OpenSpec autonomous-apply skill for my change."

### Behavioral Differences vs Claude Code

- **Worktree isolation**: Codex does not have a built-in `Agent(isolation="worktree")` flag. The skill instructs each subagent to `cd` into the worktree before any file operation; this is a documented discipline, not a hard filesystem boundary. Review the `.claude/worktrees/openspec-<change-name>/` output yourself before merging.
- **Concurrency cap**: Codex does not have an external `Workflow` primitive. The skill limits concurrency by chunking subagent mentions (2 at a time by default, max 4). You will be asked once whether to raise to 4; to skip the prompt, set:

  ```yaml
  agent:
    maxParallelRequests: 4
  ```

  in `openspec/config.yaml`.
- **Review mode / merge strategy**: the skill uses sequential question prompts, identical to Claude Code; there is no `AskUserQuestion` tool but the skill's instructions enforce the same two-step gate.

## Making It Project-Local (Recommended)

Committing `.agents/skills/` and `openspec/` means every Codex contributor gets identical skill behavior. Codex's global configuration does not need to change for project-local skills.

## Uninstall / Reset

```bash
rm -rf .agents/skills/openspec-*
rm -rf openspec/changes/<your-change-name>
git worktree remove .claude/worktrees/openspec-<change-name>/ 2>/dev/null
```

Note: the generated worktrees live under `.claude/worktrees/` even for Codex (path is kept consistent across assistants); they are plain directories plus a `.git` file, removable as above.
