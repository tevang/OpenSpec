# Install and Use OpenSpec in OpenCode

This guide installs the OpenSpec skill set — invoked as `openspec-autonomous-apply` — into a project for use with [OpenCode](https://opencode.ai/).

## Prerequisites

- Node.js 18+ and `npx` available.
- OpenCode CLI installed (`opencode`).
- Your project initialized as a git repository.

## Install the Skills

From your project root:

```bash
npx openspec@latest init --tools opencode
```

This installs the **core** workflow skills into `.opencode/skills/` plus the project's `openspec/` scaffolding.

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

then re-run `npx openspec@latest init --tools opencode` (or `openspec update`).

OpenCode only picks up project `.opencode/skills/` when the directory is registered in `~/.config/opencode/opencode.json`. Ensure this entry exists (OpenSpec init normally configures it; verify if unsure):

```json
{
  "skills": {
    "paths": [".opencode/skills"]
  }
}
```

Restart OpenCode after editing `opencode.json`.

## Using `openspec-autonomous-apply` in OpenCode

OpenCode reads `.opencode/skills/*/SKILL.md` files as invocable skills by their `name:` frontmatter:

```
/skill openspec-autonomous-apply
```

(or mention it: "use the openspec-autonomous-apply skill").

### Behavioral Differences vs Claude Code

- **Worktree isolation**: OpenCode has no built-in agent-isolation flag. The skill requires the implementation subagent to `cd` into `.opencode/worktrees/openspec-<change-name>/` before any file operation; this is a documented contract, not a hard filesystem boundary. Always review the worktree diff before merging.
- **Concurrency cap**: the skill chunks concurrent reviewer agents to 2 at a time by default (hard max 4). To skip the interactive prompt, set in `openspec/config.yaml`:

  ```yaml
  agent:
    max_parallel_requests: 4
  ```

- **Review mode / merge strategy**: the skill uses sequential question prompts: review mode first, then merge strategy, never batched.

## The `openspec-multi-model-apply` Skill (opt-in, OpenCode-heavyweight)

A sibling skill that runs a **sequence** of changes with **split model roles**: a free e-INFRA model implements everything; **two or more reviewers you select at launch** (any provider mix — e-INFRA, Anthropic, OpenAI) review independently, read-only; every change ends at an explicit user merge approval after PR review rounds and a CI gate that requires evidence for CI jobs skipped on pull requests.

It is opt-in like `autonomous-apply`: add `"multi-model-apply"` to the `workflows` list above and re-run `openspec update`.

### Required: role agent files (the fleet)

Model binding lives **only** in OpenCode agent files — the skill discovers roles by file-name convention (`*implementer*`, `*-reviewer*`) and never names a model itself. One file per role in `~/.config/opencode/agents/` (global) or `.opencode/agents/` (project):

```markdown
---
description: ...implementer          # convention: name ends in -implementer
mode: subagent
model: litellm/kimi-k3        # any free e-INFRA model from `opencode models`
---
```

```markdown
---
description: ...reviewer             # convention: name ends in -reviewer
mode: subagent
model: anthropic/claude-opus-5-5     # or litellm/glm-5.2, openai/gpt-5.3-codex, ...
permission:
  edit: deny
  bash: deny
steps: 25
---
```

- The **fleet is the menu**: offer another reviewer model by dropping in another `*-reviewer.md` file; change a model with one frontmatter line — the skill is never modified for model changes.
- At preflight the skill lists the verified fleet and asks which **≥2 reviewers** to use this run (two e-INFRA models, one e-INFRA + one Anthropic, Anthropic + OpenAI, or any larger mix; the implementer is always e-INFRA).
- **Billing failures**: preflight probes each selected role; on an out-of-credit error the skill stops, names the failed agent/model, and asks for a replacement (standing suggestion: latest free e-INFRA `glm`). Binding edits take effect in a **new session** (OpenCode loads agents at session start) — the run-state file makes resume cheap.
- Verify each pinned model ID appears in `opencode models`.

Invoke as a skill:

```
/skill openspec-multi-model-apply
```

At preflight the skill verifies the role files, reports the resolved model bindings, proposes a dependency-ordered plan over all pending changes, discovers the repo's CI-skip policy (jobs guarded with `if: github.event_name != 'pull_request'`, `workflow_dispatch:` support, documented local test commands from `AGENTS.md`), and asks for one confirmation. It then works the plan: per change, worktree → implementation-role apply → bounded review rounds → `openspec validate` → push + PR → PR review rounds → CI gate → your explicit merge approval → archive → next change. Run state lives in `.opencode/worktrees/multi-model-run.json`, so an interrupted run can resume.

## Making It Project-Local (Recommended)

Committing `.opencode/skills/` and `openspec/` makes every contributor's environment identical. The `~/.config/opencode/opencode.json` entry and the OpenSpec profile config are per-user, so document both snippets above in your contributor guide if the whole team should have `autonomous-apply`.

## Uninstall / Reset

```bash
rm -rf .opencode/skills/openspec-*
rm -rf openspec/changes/<your-change-name>
git worktree remove .opencode/worktrees/openspec-<change-name>/ 2>/dev/null
```
