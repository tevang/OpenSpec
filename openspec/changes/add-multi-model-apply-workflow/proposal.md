# Change: add-multi-model-apply-workflow

## What

Add a new reusable workflow skill, **`/openspec-multi-model-apply`**, that takes a user-confirmed **sequence** of proposed OpenSpec changes from planning artifacts to merged, archived pull requests, splitting work across model roles:

1. **Implementation role — always a free e-INFRA model** (e.g. `litellm/kimi-k3`): every line of implementation, fixing, and debugging. Cloud models must never implement.
2. **Reviewer roles — at least two, user-selected at launch, any provider mix** (e-INFRA, Anthropic, OpenAI, e.g. `claude-reviewer` → `anthropic/claude-opus-5-5`, `glm-reviewer` → `litellm/glm-5.2`): independent, read-only code review. The skill discovers every `*-reviewer` agent file, reports its pinned model, and asks the user which reviewers to use for the run; reviewers never see each other's findings.
3. **No silent role substitution**: if a role fails on billing/credits, the workflow stops, names the failed agent and model, and asks the user for a replacement (standing suggestion: the latest free e-INFRA `glm`), dropping a reviewer only if at least two remain.

Model binding lives **outside** the skill, in per-host subagent files with pinned `model:` frontmatter (e.g. `~/.config/opencode/agents/einfra-implementer.md`), so users switch models with a one-line edit and the skill is never modified for model changes. The skill refers to roles by agent name only and enforces separation ("test-gaming" detection included) plus the same guarantees as `/openspec-autonomous-apply`: worktree containment, concurrency cap, detached-run discipline, and a human merge gate.

Each change flows: preflight → worktree → implementation role → bounded local review rounds (cap 3) → `openspec validate` → push + PR → PR review rounds (cap 3) → CI gate including evidence that PR-skipped jobs passed on the branch (push/schedule/dispatch run, or documented local equivalent) → **explicit user merge approval** → merge → archive → next change. Run state is tracked in `multi-model-run.json` so interrupted runs can resume.

## Why

- Different model families catch different defects. A free e-INFRA model implementing while two or more independently selected reviewer models (cloud or e-INFRA, mixed as the user wishes) review gives cross-family review at near-zero marginal cost; the expensive cloud models stay out of the implementation loop.
- `/openspec-autonomous-apply` executes every phase with the session's single active model; self-review by the model that wrote the code is systematically weaker.
- Multi-change projects need a confirmed sequence (spec-stated dependencies) executed hands-off between merge gates, plus a CI policy for jobs that skip pull_request events (e.g. credential-protected online integration tests), which no existing skill encodes.

## Non-Goals

- No new `openspec` CLI subcommand; skill-template only (same pattern as `openspec-autonomous-apply`).
- No model configuration in `openspec/config.yaml`; model selection stays in host agent files (single source of truth).
- No automatic merge; every change ends at an explicit user approval gate.
- No changes to existing skills' behavior.
- No OpenSpec-generated host agent files; the skill prints the required templates when they are missing and the host docs explain setup.

## Approach

A. **New skill template** `src/core/templates/workflows/multi-model-apply.ts` exposing `getMultiModelApplySkillTemplate()`, registered alongside `autonomous-apply` (skill-templates re-export, `getSkillTemplates()` entry, `OPENSPEC_SKILL_NAMES`, `ALL_WORKFLOWS` opt-in, `WORKFLOW_TO_SKILL_DIR`, `WORKFLOW_PROMPT_META`). Generated to `skills/openspec-multi-model-apply/SKILL.md` by `pnpm generate:skills`.

B. **Role-based orchestration inside the skill**: Phase 0 (role wiring check, binding report, change sequence proposal + confirmation, CI discovery, run-state file) and a per-change loop (Phases 1–8: worktree, implementation-role apply, optional reference run, local review rounds, validation, push/PR/PR-review/CI gate, user merge approval, archive/advance).

C. **Cost and independence guardrails**: reviewer prompts carry the diff inline; reviewers are read-only and steps-capped; separate fresh context per reviewer per round; findings merged verbatim without orchestrator content judgment; round caps with escalation.

## Alternatives Considered

- **Extend `/openspec-autonomous-apply` in place**: rejected — it stays the host-agnostic single-model fallback; multi-model requires per-host subagent wiring that not every host supports, and blending both contracts in one skill makes each harder to reason about.
- **Hardcoded reviewer set (one Anthropic + optional OpenAI)**: rejected — reviewer count and model mix must be user-selectable per launch (e-INFRA-only combinations allowed); a `*-reviewer` agent-file fleet discovered at preflight gives that without editing the skill.
- **Shell/CLI orchestration with `opencode run --model ...` per phase**: rejected — fragile session/state passing and interactive gates; one orchestrating session driving role subagents preserves the interactive approval gates and resumability.
- **Models block in `openspec/config.yaml`**: rejected — the OpenSpec CLI cannot generate host agent files, so a second source of truth would drift from the files that actually bind the models.
