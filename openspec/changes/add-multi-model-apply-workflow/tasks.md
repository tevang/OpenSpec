# Tasks: add-multi-model-apply-workflow

## 1. Skill template infrastructure

- [x] 1.1 Create `src/core/templates/workflows/multi-model-apply.ts` implementing `getMultiModelApplySkillTemplate()` returning the `openspec-multi-model-apply` SkillTemplate (name, description, instructions). Verify: `pnpm build` passes; template import resolves.
- [x] 1.2 Register the workflow in all six places mirroring `autonomous-apply`: re-export in `src/core/templates/skill-templates.ts`; `getSkillTemplates()` entry (`dirName: 'openspec-multi-model-apply'`, `workflowId: 'multi-model-apply'`) in `src/core/shared/skill-generation.ts`; `OPENSPEC_SKILL_NAMES` in `src/core/config.ts`; `ALL_WORKFLOWS` (opt-in, after `autonomous-apply`) in `src/core/profiles.ts`; `WORKFLOW_TO_SKILL_DIR` in `src/core/profile-sync-drift.ts`; `WORKFLOW_PROMPT_META` in `src/commands/config.ts`. Verify: `pnpm build` passes.

## 2. Skill content (the reusable workflow contract)

- [x] 2.1 Write Purpose + Model Roles sections: absolute role separation (free e-INFRA implements; orchestrator coordinates only), reviewer fleet convention (`*implementer*` / `*-reviewer` agent files), launch-time selection of at least two reviewers with any provider mix, model binding delegated to host agent files, same-model-as-implementer warning, invocation restricted to hosts with per-subagent model pinning.
- [x] 2.2 Write Host Agent Wiring section with concrete file formats for OpenCode (`~/.config/opencode/agents/<role>.md`), Claude Code (`~/.claude/agents/`), Codex, including reviewer read-only permissions and steps cap.
- [x] 2.3 Write Non-Negotiables table: role separation, review independence (fresh context, no herding), no silent role substitution (billing failures surface with substitution prompt, latest free e-INFRA glm as standing suggestion, new-session caveat), test-gaming-is-a-blocker, human merge gate, containment, round cap 3, cost minimization, concurrency cap, detached-run discipline, out-of-scope input data.
- [x] 2.4 Write Phase 0 run preflight: role discovery (`*implementer*` / `*-reviewer` fleets) + model ID verification against the host model list, launch-time role selection (≥2 reviewers), trivial-call role probes to catch billing failures up front, binding report, dependency-aware change-sequence proposal with user confirmation, repo hygiene, generic CI discovery (PR-skipped jobs, workflow_dispatch, AGENTS.md/config.yaml test commands), `multi-model-run.json` run-state with resume support, final "start run" gate.
- [x] 2.5 Write per-change Phases 1–3: name sanity check, artifacts read, worktree from fresh base, implementation via implementation-role subagent only, stuck escalation.
- [x] 2.6 Write Phase 4 optional reference-run loop delegated to the implementation role.
- [x] 2.7 Write Phase 5 local review rounds (cap 3): diff packet inline, identical input to each reviewer in separate contexts, verbatim verbatim merge with mechanical checks only, implementer addresses or rebuts each finding, escalation on cap.
- [x] 2.8 Write Phase 7 push/PR/PR-review/CI gate: PR-diff review rounds, all checks green, skipped-PR-job evidence on the branch (`gh run list --event push`, `workflow_dispatch` fallback, documented local fallback), single merge-approval question.
- [x] 2.9 Write Phase 8 merge/archive/advance with run-state updates and per-change + run-level summaries.
- [x] 2.10 Write Guardrails, Assistant-Specific Notes (OpenCode role invocation via `task` + new-session requirement after editing agent files, Claude Code, Codex), and Configuration section (`agent.max_parallel_requests` only; no model config in config.yaml).

## 3. Generation and distribution

- [x] 3.1 Run `pnpm build` then `pnpm generate:skills`; verify `skills/openspec-multi-model-apply/SKILL.md` is created (14 skills generated). Pin new hashes via `pnpm regen:parity-hashes` after adding entries to the parity test. Verify: `pnpm vitest run test/core/templates/skill-templates-parity.test.ts` passes.
- [x] 3.2 Update registry-encoding tests: `test/core/profiles.test.ts` (14 workflows), `test/core/shared/skill-generation.test.ts` (14 templates), `test/core/shared/tool-detection.test.ts` (14 skill names). Verify: all three files pass.

## 4. Documentation

- [x] 4.1 Update `docs/install-opencode.md`: document `openspec-multi-model-apply` — opt-in profile entry, required role agent files, model switching, session-reload caveat.
- [x] 4.2 Update `tevang_CUSTOMIZATION.md`: list the two fork-added opt-in workflow skills.
- [x] 4.3 Populate the previously empty root `AGENTS.md` with repository orientation including both fork-added workflows.

## Verification

- [x] `pnpm build`, `pnpm lint` clean.
- [x] `pnpm test`: full suite green except 4 pre-existing environment failures verified identical on the pre-change baseline (version-check npm-anchor ×2, artifact-workflow Cursor EACCES, config-profile in-process update); 4228 passed.
