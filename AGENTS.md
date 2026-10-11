# AGENTS.md — OpenSpec (tevang fork)

Fork of [Fission-AI/OpenSpec](https://github.com/Fission-AI/OpenSpec). TypeScript, ESM, pnpm, Commander.js CLI. See `tevang_CUSTOMIZATION.md` for fork-specific behavior and new-machine setup.

## Build, test, regenerate

- `pnpm build` — bundles to `dist/` (required before `regen:parity-hashes`).
- `pnpm test` / `pnpm lint` — vitest, eslint (`src/`).
- `pnpm generate:skills` — regenerates committed `skills/*/SKILL.md` from templates (never edit those files by hand; `skillssh-parity.test.ts` guards drift).
- `pnpm regen:parity-hashes` — re-pins template SHA-256s in `test/core/templates/skill-templates-parity.test.ts` after intentional template edits. New skills must first be pinned in `EXPECTED_GENERATED_SKILL_CONTENT_HASHES`, `EXPECTED_FUNCTION_HASHES`, `GENERATED_SKILL_FACTORIES`, and the test's local `functionFactories` map.

## Fork additions (upstream has none of these)

- `schemas/concise-spec-driven/` — terse variant of upstream `spec-driven`, selected via `schema:` in a project's `openspec/config.yaml`.
- Workflow `autonomous-apply` → skill `openspec-autonomous-apply` — opt-in (custom profile only), skills-channel only (no `opsx` command is generated for it).
- Workflow `multi-model-apply` → skill `openspec-multi-model-apply` — opt-in, skills-only; sequential multi-change apply with free e-INFRA implementation + two or more user-selected independent reviewers (any provider mix); role→model binding lives in host agent files (OpenCode: `~/.config/opencode/agents/`), not in config.yaml.
- `agent.max_parallel_requests` in `openspec/config.yaml` (parsed in `src/core/project-config.ts`).

## Adding another workflow skill (the six registration points)

1. `src/core/templates/workflows/<id>.ts` — factory returning the SkillTemplate (mirror `autonomous-apply.ts`).
2. Re-export in `src/core/templates/skill-templates.ts`.
3. `getSkillTemplates()` entry in `src/core/shared/skill-generation.ts` (+ `getCommandTemplates()` if a slash command is wanted — note the `delivery: both|commands` drift-loop caveat for skills-only workflows in `profile-sync-drift.ts`).
4. `OPENSPEC_SKILL_NAMES` in `src/core/config.ts`.
5. `ALL_WORKFLOWS` in `src/core/profiles.ts` (add to `CORE_WORKFLOWS` only if default-on) + registry-count assertions in `test/core/profiles.test.ts`, `test/core/shared/skill-generation.test.ts`, `test/core/shared/tool-detection.test.ts`.
6. `WORKFLOW_TO_SKILL_DIR` in `src/core/profile-sync-drift.ts`; `WORKFLOW_PROMPT_META` in `src/commands/config.ts`.

Then `pnpm build && pnpm generate:skills && pnpm regen:parity-hashes && pnpm test && pnpm lint`.

## Known local test failures (environment, not regressions)

`test/core/version-check.test.ts` (2 tests) anchors on this machine's npm
global root and fails while the global `openspec` is dev-linked to this fork;
`artifact-workflow`/`config-profile` have EACCES failures in sandboxed
environments. Verify on a baseline (stash + rebuild) before assuming a change
caused them.
