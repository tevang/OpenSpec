# Document the two opt-in apply workflows

## Why

`openspec-autonomous-apply` and `openspec-multi-model-apply` ship in the fork, but the command reference and most of the docs tree never named them. A reader searching `docs/` for either workflow found nothing, and the "all workflow IDs" inventory in `supported-tools.md` was silently incomplete.

## What Changes

- `docs/commands.md` gains a quick-reference table and a full reference section for each skill: invocation per tool, arguments, behavior, gates, configuration, failure behavior. The per-tool syntax section notes that both generate no command file.
- `docs/workflows.md` gains a when-to-use section comparing `/opsx:apply`, `openspec-autonomous-apply`, and `openspec-multi-model-apply`, plus quick-reference rows.
- `docs/opsx.md` and `docs/customization.md` document the `agent.max_parallel_requests` project-config field that both skills read.
- `docs/install-claude-code.md` and `docs/install-codex.md` gain `openspec-multi-model-apply` sections (role agent files, fleet mechanics, billing-failure handling), matching the section `docs/install-opencode.md` already has.
- `docs/installation.md`, `docs/README.md`, and `docs/supported-tools.md` name both skills in the guide listings, the opt-in paragraph, and the workflow-ID / generated-skill-name inventories.

No product behavior changes: this is a docs-only change.

## Capabilities

- **New Capabilities**: none.
- **Modified Capabilities**: none. No spec-level behavior changes (pure docs), so the change sets `skip_specs: true`.

## Impact

- Affected: 9 files under `docs/`. No source, schema, or generated-skill changes.
- Every claim is checked against source: `src/core/templates/workflows/autonomous-apply.ts`, `src/core/templates/workflows/multi-model-apply.ts`, `src/core/profiles.ts`, `src/core/shared/skill-generation.ts`, `src/core/project-config.ts`.
