# Install and Use OpenSpec in Claude Code

This guide installs the OpenSpec skill set — including `/openspec-autonomous-apply` — into a project for use with [Claude Code](https://claude.com/claude-code).

## Prerequisites

- Node.js 18+ and `npx` available.
- Claude Code CLI installed and working in your terminal (`claude`).
- Your project initialized as a git repository (OpenSpec relies on git for branches, worktrees, and PRs).

## Install the Skills

From your project root:

```bash
npx openspec@latest init --tools claude
```

This installs the **core** workflow skills (propose, explore, apply, update, sync, archive) into `.claude/skills/` plus the project's `openspec/` scaffolding.

The autonomous-apply skill is **opt-in** — it is registered but excluded from the default core profile, because the autonomous loop (long-running reference commands, multi-agent review fan-out) is intentionally heavyweight and not everyone wants it present. To install it, select the `custom` profile with the full workflow list:

```bash
# ~/.config/openspec/config.json — global profile config
{
  "profile": "custom",
  "workflows": [
    "propose", "explore", "new", "continue", "apply", "update",
    "ff", "sync", "archive", "bulk-archive", "verify", "onboard",
    "autonomous-apply"
  ]
}
```

then re-run `npx openspec@latest init --tools claude` (or `openspec update` if you already initialized). You will then have 13 skills, including:

```
.claude/skills/openspec-autonomous-apply/SKILL.md
```

Verify it is visible to Claude Code with `/help` — `/openspec-autonomous-apply` should appear.

## Using `/openspec-autonomous-apply`

Typical full workflow:

```
/openspec-propose add-user-authentication
  → (review plan, answer the two-gate prompts)
/openspec-autonomous-apply
```

Behavior you will see:

1. **Sandboxing**: implementation runs in `.claude/worktrees/openspec-<change-name>/`; your main checkout stays read-only.
2. **Concurrency cap**: parallel reviewer/implementation agents are limited to 2 concurrent LLM calls by default (hard max 4). You will be asked once whether to raise to 4. To skip that prompt, set in `openspec/config.yaml` (project-level, next to `schema:`):

   ```yaml
   agent:
     max_parallel_requests: 4
   ```

3. **Review mode**: after validation passes you will be prompted to choose local agentic reviewers (Workflow fan-out + `/code-review`), built-in `code-review` only, an existing GitHub PR reviewer, or manual review.
4. **Merge strategy**: you will then be prompted to choose "Create PR and wait for my approval", "Create PR and auto-merge if all CI green", or "push branch only, I will merge manually".
5. **Archive**: after merge, the change is archived and the worktree removed.

## The `openspec-multi-model-apply` Skill (opt-in)

A sibling skill that runs a **sequence** of changes with split model roles: a free e-INFRA model implements everything, **two or more reviewers you select at launch** (any provider mix: e-INFRA, Anthropic, OpenAI) review independently and read-only, and every change ends at an explicit user merge approval after PR review rounds and a CI gate that requires evidence for CI jobs skipped on pull requests.

It is opt-in like `autonomous-apply`: add `"multi-model-apply"` to the `workflows` list above and re-run `openspec update`.

### Required: role agent files (the fleet)

Model binding lives **only** in Claude Code agent files. The skill discovers roles by file-name convention (`*implementer*`, `*-reviewer*`) and never names a model itself. One file per role in `~/.claude/agents/` (global) or `.claude/agents/` (project), with `model:` frontmatter:

```markdown
---
description: ...implementer          # convention: name ends in -implementer
model: <provider>/<model-id>        # any free e-INFRA model the host accepts
---
```

Reviewer files use the same shape with a read-only tool restriction, so reviewers produce findings only and never edit.

- The **fleet is the menu**: offer another reviewer model by adding another `*-reviewer` file; change a model with one frontmatter line. The skill is never modified for model changes.
- At preflight the skill lists the verified fleet and asks which **2 or more reviewers** to use this run. The implementer is always e-INFRA.
- **Billing failures**: preflight probes each selected role; on an out-of-credit error the skill stops, names the failed agent/model, and asks for a replacement. It never substitutes silently.
- The implementer role runs via `Agent(isolation: "worktree", subagent_type: "<role>")`.

Invoke it as a skill:

```
/openspec-multi-model-apply
```

Verify it is visible to Claude Code with `/help`; `/openspec-multi-model-apply` should appear.

At preflight the skill verifies the role files, reports the resolved model bindings, proposes a dependency-ordered plan over all pending changes, discovers the repo's CI-skip policy, and asks for one confirmation. It then works the plan: per change, worktree, implementer-role apply, bounded review rounds, `openspec validate`, push and PR, PR review rounds, CI gate, your explicit merge approval, archive, next change. Run state lives in `.claude/worktrees/multi-model-run.json`, so an interrupted run can resume.

Full reference: [Commands](commands.md#openspec-multi-model-apply).

## Making It Project-Local (Recommended)

Committing `.claude/skills/` and `openspec/` into version control means every contributor gets identical OpenSpec behavior. The profile selection lives in your *user-level* `~/.config/openspec/config.json` (not version-controlled); document the custom-profile snippet above in your project's contributor guide if you want everyone to have `autonomous-apply`.

## Uninstall / Reset

```bash
rm -rf .claude/skills/openspec-*
rm -rf openspec/changes/<your-change-name>                       # per change
git worktree remove .claude/worktrees/openspec-<change-name>/    # per abandoned run
```
