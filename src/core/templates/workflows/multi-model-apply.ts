import type { SkillTemplate, CommandTemplate } from '../types.js';
import { STORE_SELECTION_GUIDANCE } from './store-selection.js';

/**
 * Returns the reusable multi-model-apply skill.
 * The `instructions` field is the entire runnable workflow contract.
 *
 * Model roles (implementation vs. review) are deliberately NOT bound to
 * model IDs here: binding lives in per-host subagent files so users can
 * change models and reviewer composition without touching this skill.
 */
export function getMultiModelApplySkillTemplate(): SkillTemplate {
  const skillName = 'openspec-multi-model-apply';
  const description =
    'Sequential multi-change implementation with split model roles: a free e-INFRA model implements everything, independently reviewed by two or more user-selected reviewer models (read-only, any provider mix), with PR review loop, CI gate, and explicit per-change user merge approval.';

  const instructions = `# Multi-Model Apply Workflow — /openspec-multi-model-apply

## Purpose

Take a **sequence** of proposed OpenSpec changes from planning artifacts to merged, archived pull requests, splitting work across model roles to combine free implementation with independent reviews: **implementation is always done by a free e-INFRA model; review is done by two or more independent reviewer models the user selects at launch — never by the implementing model itself.**

${STORE_SELECTION_GUIDANCE}

Behavioral guarantees:

1. **Role separation is absolute.** Only the implementation role writes or fixes code. Reviewers are read-only and produce findings only; they never edit.
2. **Reviews are independent.** Each reviewer runs in a fresh, isolated subagent context; reviewers never see each other's findings; the implementing model never reviews its own diff.
3. **Merges are never automatic.** Every change ends at an explicit user approval gate before merging.
4. **The change sequence, the reviewer set, and the run scope are user-confirmed up front.** Afterwards the run proceeds without re-asking, except at the gates explicitly defined below.

---

## Model Roles (bound OUTSIDE this skill — never hardcoded here)

| Role | Agent file convention | Model binding (user's choice, pinned in each file) | Rights |
|------|----------------------|-----------------------------------------------------|--------|
| Implementation | \`<name>-implementer\` (e.g. \`einfra-implementer\`) | Any **free e-INFRA** model reachable in this host (e.g. \`litellm/kimi-k3\`). MUST be e-INFRA — cloud models must never implement. | edit + run checks, inside the worktree only |
| Reviewer ×N (N ≥ 2, chosen at launch) | \`<name>-reviewer\` (e.g. \`claude-reviewer\`, \`openai-reviewer\`, \`glm-reviewer\`, \`deepseek-reviewer\`) | Any model the user wants — e-INFRA, Anthropic, OpenAI, or any mix. The reviewer set is selected at run preflight from the available reviewer files. | read-only, structured findings only |

- **Model selection lives ONLY in host agent files** (see Host Agent Wiring). This skill refers to roles by agent name and never enforces a model ID itself.
- **The agent fleet is the menu.** To offer another reviewer model, the user drops a new \`*-reviewer.md\` file into the agent directory. To change a model, the user edits one frontmatter line. This skill is never modified for model changes.
- **Launch-time selection (Phase 0):** the user picks the implementer (if several exist) and at least two reviewers from the verified fleet. Cloud models (Anthropic, OpenAI) are usual reviewer choices because they add a different model family at low volume, but the selection is the user's: two e-INFRA reviewers, one e-INFRA + one Anthropic, Anthropic + OpenAI, or any larger mix — the only constant is that the implementer is always e-INFRA.
- A reviewer pinning the SAME model ID as the implementer defeats independent review — warn the user if detected and ask to pick a different reviewer.
- The orchestrating session itself MUST NOT implement code or produce review verdicts. It coordinates: git, \`gh\`, \`openspec\` CLI, prompts, and gates.

---

## Host Agent Wiring

The skill requires subagents with pinned models. If a host cannot pin a model per subagent, this skill cannot run on that host — use \`/openspec-autonomous-apply\` instead. If role files are missing, stop in Phase 0 and print the templates below.

### OpenCode

One file per role in \`~/.config/opencode/agents/\` (global, works in every repo) or \`.opencode/agents/\` (project). Implementer example:

\`\`\`yaml
---
description: <role description ending in -implementer>
mode: subagent
model: <provider>/<model-id>        # e.g. litellm/kimi-k3
---
\`\`\`

Reviewer example — read-only and steps-capped:

\`\`\`yaml
---
description: <role description ending in -reviewer>
mode: subagent
model: <provider>/<model-id>        # e.g. anthropic/claude-opus-5-5
permission:
  edit: deny
  bash: deny
steps: 25                           # cost guardrail
---
\`\`\`

Verify each pinned model ID appears in \`opencode models\`.

### Claude Code

Equivalent files in \`~/.claude/agents/\` with \`model:\` frontmatter and read-only tool restriction for reviewers.

### Codex

Equivalent agents via Codex's agent configuration with a pinned model per role and read-only reviewers.

---

## Non-Negotiables (read first, enforce throughout)

| Rule | Enforcement |
|------|-------------|
| **Role separation** | Implementation: only via the implementation-role subagent. Reviews: only via the selected reviewer subagents. Orchestrator: coordination only — never writes code, never issues review verdicts. |
| **Review independence** | Separate fresh subagent per reviewer per round. Identical review input. Reviewers never see each other's findings. Orchestrator merges findings verbatim without judging content. |
| **No silent role substitution** | If any role agent fails on billing/credits (or stops responding), STOP that phase, tell the user exactly which agent and model failed, and ask which replacement to use — suggest the latest free e-INFRA \`glm\` or another free e-INFRA model when a cloud reviewer is down; dropping a reviewer is allowed only if at least two reviewers remain; changing a binding means editing the agent file and a new host session (hosts load agents at session start). Never swap models silently. |
| **Test-gaming is a blocker** | Every test edit must trace to a spec delta of the current change. Reviewers MUST flag expectation changes without a spec mandate (including edits to tests pinned by earlier changes in the run) as blockers. |
| **Human merge gate** | Never merge without an explicit per-change "yes". Pushing branches and creating PRs is pre-approved by the Phase 0 plan approval; merging is not. |
| **Containment** | Implementation edits only \`<worktree-root>/openspec-<change-name>\`. Main checkout and \$HOME read-only. |
| **Round cap** | Max 3 review rounds per review phase (Phase 5 and Phase 7 independently). Unresolved after the cap: stop, present open findings verbatim, user decides. |
| **Cost minimization** | Reviewer prompts carry the diff inline plus targeted context; reviewers are read-only and steps-capped; they must not tour the repo. Cloud models never implement, debug, or fix. Reviewer count stays at the user-approved set — no unsolicited extra reviewers. |
| **Concurrency cap** | Default 2, never more than 4 concurrent subagent calls (e-INFRA hard limit). Reviewer fan-out is chunked to the cap; sequential is the default. Read \`agent.max_parallel_requests\` from \`openspec/config.yaml\` if set. |
| **Detached run discipline** | Never run a long reference command in the foreground shell. \`setsid nohup <cmd> > run.log 2>&1 < /dev/null &\`, poll for exit. |
| **Out-of-scope input data** | Errors caused by the input dataset itself are recorded, never "fixed" by mutating input. |

---

## Phase 0 — Run Preflight (once, before any change)

1. **Role discovery + verification.** List implementer candidates (agent files whose name matches \`*implementer*\` at the host path) and reviewer candidates (\`*reviewer*\`). For each: file exists, frontmatter parses, \`model:\` present, and the pinned model ID appears in the host model list (OpenCode: \`opencode models\`). Missing or unparsable required files → stop and print the file template. Unknown model ID → ask user to fix frontmatter.
2. **Role selection.** If several implementers exist → ask which one (must pin an e-INFRA/free route; if unclear, confirm with the user). Present the reviewer fleet with each pinned model and ask: "Use which reviewers this run? (pick at least 2)". Default suggestion: all verified reviewers, or the user's standing preference if stated. Warn if any selected reviewer pins the implementer's exact model ID.
3. **Role probes (billing check).** Before anything else runs, probe each selected role with a trivial call ("reply with one word: online" — reviewers keep their read-only constraints). On a billing/credit failure: STOP, name the agent and model, and apply the **no silent substitution** rule — ask the user: substitute with the latest free e-INFRA \`glm\` (or another free e-INFRA model), pick a different existing reviewer, drop this reviewer (only if ≥2 remain), or abort. File edits take effect only in a NEW host session — if bindings changed, instruct the user to restart the session before continuing, and record the pending decision in run-state so resume picks it up.
4. **Report bindings.** Tell the user the resolved mapping (implementer → X; reviewers → Y, Z, ...) and restate the cost rule (implementation always e-INFRA; reviewers read-only). If \`agent.max_parallel_requests\` is unset, ask the concurrency question once here.
5. **Change sequence.** Run \`openspec list --json\`; select changes with unfinished tasks. Read each \`proposal.md\` (and spec deltas where cheap) to detect spec-stated dependencies ("Depends on", cross-change references). Propose an ordered run plan; ask the user to confirm or reorder. The confirmed order is binding for the run and works for any number of changes in any project.
6. **Repo hygiene.** \`git status --porcelain\` must be clean or contain only untracked OpenSpec planning files; otherwise stop. Identify base branch (usually \`main\`) and default remote.
7. **CI discovery (generic, per repo).** Read \`.github/workflows/*.yml\`: note jobs that skip \`pull_request\` events (e.g. \`if: github.event_name != 'pull_request'\`) and workflows with \`workflow_dispatch:\`. Read \`AGENTS.md\`/\`CLAUDE.md\` if present for test commands, and \`openspec/config.yaml\` \`operations\` guidance. Ask the user to confirm or gap-fill: the offline check command, and the merge policy for PR-skipped jobs (default: "every job skipped on PRs must show a passing run on this branch — push, schedule, or manual dispatch — or a documented local equivalent, before merge").
8. **Run-state file.** Create \`<worktree-root>/multi-model-run.json\`:
   \`\`\`json
   { "run_plan": ["<change-1>", "..."], "base_branch": "main", "remote": "origin",
     "implementer": "<agent-file-name>", "reviewers": ["<agent-file-name>", "..."],
     "offline_check_cmd": "...",
     "ci": { "pr_skipped_jobs": [], "dispatchable_workflows": [], "local_fallback_cmd": null },
     "merge_strategy": "repo-default", "started_at": "...", "current_index": null, "results": {} }
   \`\`\`
   On later invocations, if this file exists and is unfinished, offer to resume from \`current_index\` (re-running steps 1–3 to re-verify bindings, since models may have been re-pinned since).
9. **Final go.** Present run plan + role bindings + CI policy. Ask: "Start run? yes/no." Wait for explicit yes.

---

## Per-Change Loop (repeat for each change in run-plan order)

### Phase 1 — Change preflight

- Sanity-check the change name: \`^[a-z0-9][a-z0-9-]*[a-z0-9]?$\` (kebab-case, max 64) — it flows into paths and branch names.
- Read \`openspec/changes/<change-name>/\`: \`proposal.md\`, \`tasks.md\`, all \`specs/*/spec.md\`, \`design.md\` if present.
- Announce: "Change i/N: <name> — M tasks." No question (plan approved) unless artifacts are missing or broken.

### Phase 2 — Worktree

1. \`git fetch <remote>\`; base = remote tip of the base branch.
2. Create worktree: \`git worktree add <worktree-root>/openspec-<change-name>/ -b feat/<change-name> <base-ref>\`. Host-appropriate root: \`.claude/worktrees/\` on Claude Code, \`.agents/worktrees/\` on Codex, \`.opencode/worktrees/\` on OpenCode.
3. Record \`<worktree-root>/openspec-<change-name>/.openspec-autonomous.json\` and update the run-state entry for this change.
4. Worktree creation fails → document container fallback and stop unless user approves proceeding read-only.

### Phase 3 — Implementation (implementation role ONLY)

1. Spawn the selected implementer subagent with: the worktree path; instruction to read \`tasks.md\` top-to-bottom and implement each task minimally, ticking \`- [x]\` as it goes; the offline check command to run after each meaningful unit; explicit "never commit, never push, never leave the worktree".
2. The orchestrator never edits code here, not even "tiny fixes" — route them through the implementer.
3. On completion: all offline checks pass inside the worktree. Implementer stuck twice on the same task, or checks still failing after two fix attempts → stop the change, report, wait for the user.

### Phase 4 — Reference-Run Validation (optional)

If the proposal declares a **reference command** and dataset: run the autonomous loop from \`/openspec-autonomous-apply\` Phase 4 (detached launch, run → inspect → classify → fix-one → rerun, in-scope vs. out-of-scope classification, findings log inside the worktree) — executed by the implementation role, not the orchestrator and never a cloud model.

### Phase 5 — Local Independent Review (rounds, cap 3)

Per round:

1. Build the review packet: \`git diff <merge-base>...HEAD\` inside the worktree, changed-file list, and proposal + spec-delta excerpts. Diff too large for a prompt → deliver per-file diffs or name changed files and let reviewers read them from the worktree path.
2. Spawn **each selected reviewer** in its own fresh context with the identical packet. Chunked by the concurrency cap (default sequential).
3. Collect all reports verbatim. Orchestrator performs only mechanical checks (do the cited files/lines exist?) and deduplicates overlapping findings across reviewers. No content judgment.
4. All verdicts APPROVE and zero findings → Phase 6.
5. Otherwise: spawn the implementer with all findings verbatim and "address each, or rebut with file/line evidence, then rerun the offline checks."
6. A reviewer failing mid-phase (billing, persistent errors) → apply the **no silent substitution** rule: pause the run, record state, ask the user, resume after the decision (new session if bindings changed).
7. Round cap exhausted with open findings → stop: present open findings and every verdict verbatim; user decides: more rounds / proceed with documented exceptions / abort the change.

### Phase 6 — Spec Validation

\`\`\`bash
openspec validate <change-name>
\`\`\`
Must be clean. Failures go back to the implementer (counts as a review round).

### Phase 7 — Push, PR, PR Review Loop, CI Gate

1. \`git push -u <remote> feat/<change-name>\` from the worktree; create the PR: \`gh pr create --fill\` (title/body from the proposal's Why/What, referencing the change name).
2. **PR review rounds (cap 3):** \`gh pr diff <n>\` → same reviewer protocol as Phase 5 (fresh contexts, identical packet, verbatim findings) → implementer fixes → push (PR updates) → confirm CI reran for the new push → next round.
3. **CI gate** — ALL must hold before asking for merge approval:
   - \`gh pr checks <n>\`: no failures, nothing pending.
   - Each PR-skipped job (Phase 0.7): \`gh run list --branch feat/<change-name> --event push --limit 3\` shows it **passed on this branch**. If no passing non-PR run: dispatch \`gh workflow run "<name>" --ref feat/<change-name>\` where \`workflow_dispatch\` exists and watch it; else run the documented local fallback command (e.g. from \`AGENTS.md\`) in the worktree. Any failure → implementer fixes → push (counts against the round cap).
   - \`openspec validate <change-name>\` still clean.
4. **Merge approval gate (only question in the loop besides escalation):** present PR URL, the full checks table, passing-run evidence for PR-skipped jobs (workflow + run IDs), review summary (rounds, findings per reviewer, final verdicts), files changed. Ask: "Merge PR #n into <base>? yes / no". No → stop the run, record the user's note in run-state, leave branch and PR untouched.

### Phase 8 — Merge, Archive, Advance

1. On yes: merge (\`gh pr merge\` with the strategy recorded in run-state; default: repo default). Never merge without stage 7.4's yes.
2. In the main checkout: \`git pull\` on the base branch.
3. Archive the change via \`/opsx:archive <change-name>\` (or the host's archive skill).
4. Remove the worktree and local branch:
   \`\`\`bash
   git worktree remove <worktree-root>/openspec-<change-name>/
   git branch -d feat/<change-name>
   \`\`\`
5. Update run-state (result, PR URL, rounds used, findings counts), increment \`current_index\`.
6. Print the per-change summary (findings, fixes, out-of-scope notes, checks status) and advance to the next change. New worktrees are cut from freshly pulled base, so each change builds on the merged previous ones.
7. After the final change: print the full run report (change, PR, rounds, verdicts, checks) and finish.

---

## Guardrails

- **Never implement outside the implementation role; never review outside the selected reviewers; the orchestrator never writes or judges code.**
- **Never merge without the explicit gate answer.** No "checks are green so it merged" logic.
- **Never silently substitute a role's model.** Billing/credit failures always surface to the user with substitution choices (latest free e-INFRA \`glm\` is the standing suggestion for a downed cloud reviewer).
- **Never exceed the concurrency cap.** Sequential is always acceptable.
- **Zero herding between reviewers.** Separate contexts, identical inputs, no cross-attribution of findings.
- **Cloud-model cost containment.** Implementation, fixing, debugging, and reruns are never delegated to cloud models. Reviewer prompts carry the diff; reviewers are read-only and steps-capped.
- **Host sessions load agent files once, at start.** Any binding edit (substitution, model change) requires a new session; the run-state resume path makes this cheap.
- **Pre-existing lint/type/test debt** outside the changed lines: record as out-of-scope; fix only what the change touches.
- **User stops the run:** honor immediately, mid-phase, no arguing. Leave run-state resumable and offer to resume later.

---

## Assistant-Specific Notes

### OpenCode

- Role discovery: \`*implementer*\` and \`*reviewer*\` files under \`~/.config/opencode/agents/\` and \`.opencode/agents/\`. Invoke roles via the \`task\` tool with the agent name as \`subagent_type\`. Validate pinned models with \`opencode models\`.
- Custom agents are loaded at session start: after creating or editing role files, a NEW session is required before the roles resolve. Design pauses around this (probes + run-state resume).
- Worktree root \`.opencode/worktrees/\`; manual worktree discipline (no isolation flag).

### Claude Code

- Use \`Agent(isolation: "worktree", subagent_type: "<role>")\`; role files in \`~/.claude/agents/\` with \`model:\` frontmatter.

### Codex

- Role agents via Codex agent configuration with pinned models; instruct each subagent to \`cd\` into the worktree before any file operation.

---

## Configuration

Optional \`openspec/config.yaml\` block the skill reads (same as \`/openspec-autonomous-apply\`):

\`\`\`yaml
agent:
  # default 2; maximum 4 enforced by the workflow regardless of higher config values
  max_parallel_requests: 2
\`\`\`

This skill reads NO model configuration from \`openspec/config.yaml\`. Models live only in the host agent files, one role per file, so users switch models and reviewer composition without touching OpenSpec.

`;

  return {
    name: skillName,
    description,
    instructions,
    license: 'MIT',
    compatibility: 'Requires openspec CLI.',
    metadata: { author: 'openspec', version: '1.0' },
  };
}

export function getMultiModelApplyCommandTemplate(): CommandTemplate | null {
  // Reserved for future slash-command generation; no-op for now.
  return null;
}
