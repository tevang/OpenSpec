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

This installs the **core** workflow skills into `.agents/skills/` plus the project's `openspec/` scaffolding.

The autonomous-apply skill is **opt-in** — registered but excluded from the default core profile. To install it, select the `custom` profile with the full workflow list in `~/.config/openspec/config.json`:

```json
{
  "profile": "custom",
  "workflows": [
    "propose", "explore", "new", "continue", "apply", "update",
    "ff", "sync", "archive", "bulk-archive", "verify", "onboard",
    "autonomous-apply"
  ]
}
```

then re-run `npx openspec@latest init --tools codex` (or `openspec update`). Verify the generated file exists:

```bash
ls .agents/skills/openspec-autonomous-apply/SKILL.md
```

## Using `openspec-autonomous-apply` in Codex

Invoke it as a project skill:

> "Run the OpenSpec autonomous-apply skill for my change."

### Behavioral Differences vs Claude Code

- **Worktree isolation**: Codex has no built-in `Agent(isolation="worktree")` flag. The skill instructs each subagent to `cd` into the worktree at `.agents/worktrees/openspec-<change-name>/` before any file operation; this is a documented discipline, not a hard filesystem boundary. Review the worktree diff yourself before merging.
- **Concurrency cap**: Codex has no external `Workflow` primitive; the skill limits concurrency by chunking subagent mentions (2 at a time by default, hard max 4). To skip the interactive prompt, set in `openspec/config.yaml`:

  ```yaml
  agent:
    max_parallel_requests: 4
  ```

- **Review mode / merge strategy**: the skill uses sequential question prompts, identical to Claude Code — review mode first, then merge strategy.

## The `openspec-multi-model-apply` Skill (opt-in)

A sibling skill that runs a **sequence** of changes with split model roles: a free e-INFRA model implements everything, **two or more reviewers you select at launch** (any provider mix) review independently, and every change ends at an explicit user merge approval after PR review rounds and a CI gate that requires evidence for CI jobs skipped on pull requests.

It is opt-in like `autonomous-apply`: add `"multi-model-apply"` to the `workflows` list above and re-run `openspec update`.

### Required: role agents (the fleet)

Model binding lives **only** in Codex agent configuration: one agent per role with a pinned model, discovered by file-name convention (`*implementer*`, `*-reviewer*`). The skill never names a model itself. Reviewer agents are read-only: they produce findings and never edit.

- The **fleet is the menu**: offer another reviewer model by adding another `*-reviewer` agent; change a model in the agent configuration. The skill is never modified for model changes.
- At preflight the skill verifies the roles, probes each selected one, and asks which **2 or more reviewers** to use this run. The implementer is always e-INFRA.
- **Billing failures**: on an out-of-credit error the skill stops, names the failed agent and model, and asks for a replacement. It never substitutes silently.

Invoke it as a project skill:

> "Run the OpenSpec multi-model-apply skill for my changes."

Worktree discipline matches `autonomous-apply` in Codex: each subagent `cd`s into `.agents/worktrees/openspec-<change-name>/` before any file operation, and run state lives in `.agents/worktrees/multi-model-run.json`.

Full reference: [Commands](commands.md#openspec-multi-model-apply).

## Making It Project-Local (Recommended)

Committing `.agents/skills/` and `openspec/` means every Codex contributor gets identical skill behavior. The profile config (`~/.config/openspec/config.json`) is per-user; document the custom-profile snippet in your contributor guide if you want `autonomous-apply` for everyone.

## Uninstall / Reset

```bash
rm -rf .agents/skills/openspec-*
rm -rf openspec/changes/<your-change-name>
git worktree remove .agents/worktrees/openspec-<change-name>/ 2>/dev/null
```
