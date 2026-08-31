# Install and Use OpenSpec in Claude Code

This guide installs the OpenSpec skill set — including `/openspec-autonomous-apply` — into a project for use with [Claude Code](https://claude.com/claude-code).

## Prerequisites

- Node.js 18+ and `npx` available.
- Claude Code CLI installed and working in your terminal (`claude`).
- Your project initialized as a git repository (OpenSpec relies on git for branches, worktrees, and PRs).

## Install the Skills

From your project root:

```bash
npx openspec@latest init --tools claude-code
```

This creates (at project root):

```
.claude/
├── skills/
│   ├── openspec-autonomous-apply/SKILL.md   ← the skill this doc covers
│   ├── openspec-propose/SKILL.md
│   ├── openspec-apply-change/SKILL.md
│   ├── openspec-verify-change/SKILL.md
│   └── ... (13 skills total)
└── commands/    ← if delivery includes slash commands
openspec/
├── config.yaml
└── specs/
└── changes/
```

Verify by running inside Claude Code:

```
/help
```

You should see `/openspec-autonomous-apply` in the skill list. You can also check the generated file exists:

```bash
ls .claude/skills/openspec-autonomous-apply/SKILL.md
```

## Using `/openspec-autonomous-apply`

Typical full workflow:

```
/opsx:propose add-user-authentication
  → (review plan, answer 2-gate prompts)
/openspec-autonomous-apply
```

Behavior you will see:

1. **Sandboxing**: implementation runs in `.claude/worktrees/openspec-<change-name>/`; your main checkout stays read-only.
2. **Concurrency cap**: parallel reviewer/implementation agents are limited to 2 concurrent LLM calls by default (max 4). You will be asked once whether to raise to 4; answer 2 or 4. To skip the prompt in future runs, add to `openspec/config.yaml`:

   ```yaml
   agent:
     maxParallelRequests: 4
   ```

3. **Review mode**: after verification you will be prompted to choose local agentic reviewers (Workflow fan-out + `/code-review`), built-in `code-review` only, an existing GitHub PR reviewer, or manual review.
4. **Merge strategy**: you will be prompted to choose "Create PR and wait for my approval", "Create PR and auto-merge if all CI green", or "push branch only, I will merge manually".
5. **Archive**: after merge, the change is archived and the worktree removed.

## Making It Project-Local (Recommended)

Committing `.claude/skills/`, `.claude/commands/`, and `openspec/` into version control means every contributor gets identical OpenSpec behavior. The default `openspec init` does not add anything outside your project root, so no global Claude Code configuration change is needed.

## Uninstall / Reset

```bash
rm -rf .claude/skills/openspec-* .claude/commands/opsx/*
rm -rf openspec/changes/<your-change-name>   # per change
git worktree remove .claude/worktrees/openspec-<change-name>/ 2>/dev/null
```

Skills are inert markdown files; deleting them leaves no runtime side effects in Claude Code.
