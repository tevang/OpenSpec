# Spec Deltas: multi-model-apply

## ADDED Requirements

### Requirement: Multi-Model Apply Skill Exposed

The system SHALL expose a skill named `openspec-multi-model-apply` through the standard OpenSpec skill-generation pipeline (`pnpm generate:skills`) and the `openspec init` / `openspec update` workflows.

#### Scenario: Skills-only, opt-in distribution
The skill SHALL be registered in `getSkillTemplates()`, `OPENSPEC_SKILL_NAMES`, `ALL_WORKFLOWS` (opt-in, not in the core profile), `WORKFLOW_TO_SKILL_DIR`, and `WORKFLOW_PROMPT_META`, and SHALL be absent from `getCommandTemplates()` (skills channel only, same pattern as `openspec-autonomous-apply`).

#### Scenario: Generated artifact
Given `pnpm build && pnpm generate:skills`, `skills/openspec-multi-model-apply/SKILL.md` SHALL exist, and the template parity tests SHALL pass with hashes pinned for the new skill.

### Requirement: Role-Based Execution With External Model Binding

The skill SHALL define model roles — an implementation role restricted to free e-INFRA models, and **at least two reviewer roles selected by the user at run preflight** from the available `*-reviewer` agent fleet (any provider mix: e-INFRA, Anthropic, OpenAI) — and SHALL bind roles to concrete models exclusively through per-host subagent files (e.g. `~/.config/opencode/agents/<role>.md` with `model:` frontmatter), never through the skill text or `openspec/config.yaml`.

#### Scenario: Model change without skill modification
When a user edits only the `model:` line in a host agent file, the workflow SHALL run with the new binding and the skill SHALL require no modification.

#### Scenario: Implementation restricted to e-INFRA
The skill SHALL instruct that all implementation, fixing, and debugging is delegated to the implementation role and SHALL prohibit cloud models and the orchestrating session from writing code.

#### Scenario: Missing role wiring
When no implementer agent or fewer than two reviewer agents are available, the skill SHALL stop in run preflight and print the required file template. A reviewer pinning the exact model ID of the implementer SHALL trigger a warning and a request to pick a different reviewer.

#### Scenario: No silent role substitution
When a role agent fails on billing/credits, the skill SHALL stop the affected phase, name the failed agent and model, and ask the user for a replacement (suggesting the latest free e-INFRA `glm`); a reviewer MAY be dropped only if at least two reviewers remain, and any binding change SHALL require confirmation and a new host session (agents load at session start).

### Requirement: Independent Read-Only Review

Each review round SHALL spawn each reviewer in a separate fresh context with identical review input; reviewers SHALL be read-only (no edits, no shell writes) and produce structured findings only; the orchestrator SHALL merge findings verbatim with only mechanical (file/line existence) checks.

#### Scenario: Test edits must trace to spec deltas
Reviewers SHALL be instructed to report, as blockers, any test expectation change not mandated by the change's spec deltas — including edits to tests pinned by earlier changes in the same run.

#### Scenario: Round cap escalation
Review rounds SHALL be capped (3 per review phase); on exhaustion the workflow SHALL stop and present open findings verbatim for a user decision rather than looping indefinitely.

### Requirement: Sequential Multi-Change Run With Merge Gates

The skill SHALL propose a dependency-ordered plan over all changes with unfinished tasks, obtain one up-front user confirmation, and execute the plan per change; each change SHALL end at an explicit user merge-approval gate after push, PR review rounds, and a CI gate that requires evidence of passing runs for jobs skipped on pull requests (push/schedule/dispatch run on the branch, or a documented local equivalent).

#### Scenario: Any number of changes, any project
Sequencing, offline check command, and CI-skip policy SHALL be discovered per project at run preflight (openspec list, workflow YAML, project docs) rather than hardcoded.

#### Scenario: Resumable interruption
Run state SHALL be persisted (`multi-model-run.json`) so an interrupted run can resume from the next unmerged change; a user stop SHALL be honored immediately, mid-phase.
