# Design: document-autonomous-and-multi-model-apply

## Context

The fork added two opt-in, skills-only workflows: `autonomous-apply` and `multi-model-apply`. Both are registered in `getSkillTemplates()` and `ALL_WORKFLOWS`; neither is in `getCommandTemplates()` (no `/opsx:` command) nor in `CORE_WORKFLOWS` (not in the default profile). Existing docs partially covered them: the three install guides and `installation.md` mention `autonomous-apply`, and `install-opencode.md` covers both. The command reference, workflow guide, config references, and the Claude Code / Codex install guides did not.

## Goals / Non-Goals

- **Goals**: every page that enumerates workflows or describes apply-style work names both skills and is accurate against source; each fact keeps one canonical home; the style rules in `.agents/skills/write-openspec-docs/writing.md` hold for all drafted text.
- **Non-Goals**: no new docs pages; no sweep of pre-existing style issues (e.g., legacy em dashes on untouched lines); no edits to the core-vs-expanded profile descriptions in `faq.md`, `glossary.md`, `how-commands-work.md` (they describe the profile distinction only and do not mislead a reader).

## Decisions

### D1. Extend the existing reference pages; add no new page
*Rationale*: `commands.md` is the canonical home for "what each skill does"; `workflows.md` owns "when to use which." A standalone page would create a second home for facts these pages already own, and a reader looking up a workflow name scans the reference, not a new link.

*Mechanism*: `commands.md` gets two reference sections (per-tool invocation table, arguments, behavior, gates, configuration, tips) plus a third quick-reference table. `workflows.md` gets one comparison section with a three-way table and a choosing list.

### D2. Facts trace to source, not to other docs
*Rationale*: the behavioral contract lives in the two skill templates, and the concurrency cap lives in `project-config.ts` (integer 1-4, default 2, invalid values warn and fall back to 2). Docs restate only what source asserts. Host-specific details (agent-file paths, worktree roots, invocation forms) come from the templates' assistant-specific notes and the pre-existing install guides.

### D3. One canonical home per fact
*Rationale*: the style guide's rule against duplicated facts. The reference section in `commands.md` carries the behavioral contract; `workflows.md` carries the choice judgment; the install guides carry per-host setup; the inventories (`supported-tools.md`, `opsx.md`, `customization.md`) carry names and config fields. Pages that do not own the fact link to the one that does.

### D4. Two independent review passes before merge
*Rationale*: a reference's value is that its claims are true. Two independent reviewers (deepseek, glm) checked the full diff against the five source files plus the style guide. Actionable findings fixed: list-length caps, em-dash rule on drafted lines, cross-page wording consistency, `supported-tools.md` inventories.

## Risks

- **Staleness**: the skill templates can change and the docs restate their behavior. Mitigation: the restated content is the contract level (phases, gates, caps, paths), which changes rarely; the install guides already set this precedent.
- **Invocation forms drift per tool**: the per-tool tables mirror the pre-existing install guides; if a tool changes its skill invocation, the install guide and the table update together.
