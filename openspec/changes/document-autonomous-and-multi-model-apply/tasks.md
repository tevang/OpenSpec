# Tasks: document-autonomous-and-multi-model-apply

## 1. Command reference (docs/commands.md)

- [x] 1.1 Add the "Opt-in Heavyweight Workflows (skills only)" quick-reference table: both skill names, purpose, and the custom-profile enablement sentence.
- [x] 1.2 Add the `openspec-autonomous-apply` reference section: per-tool invocation table, arguments (including the no-qualifying-change failure behavior), behavior bullets, gates and outcome, `agent.max_parallel_requests` configuration, tips with links.
- [x] 1.3 Add the `openspec-multi-model-apply` reference section: per-tool invocation table, role-agent-file prerequisite with per-host locations, behavior bullets, merge-gate statement, configuration note, tips with links.
- [x] 1.4 Add a note in "Command Syntax by AI Tool" that both skills generate no command file in any tool.

## 2. Workflow guide (docs/workflows.md)

- [x] 2.1 Add the "Autonomous and Multi-Model Apply (opt-in)" section: three-way comparison table (`/opsx:apply` vs both skills), choosing list, concurrency-config note, link to the reference.
- [x] 2.2 Add both skills to the bottom Command Quick Reference table; point the expanded-workflow section at the new section.

## 3. Config references (docs/opsx.md, docs/customization.md)

- [x] 3.1 `opsx.md`: add the `agent.max_parallel_requests` row to the Config Fields table (integer 1-4, default 2, invalid values ignored with a warning) and both skills to the Commands table; mention the opt-in skills in Setup.
- [x] 3.2 `customization.md`: add the `agent` block to the Quick Setup example and a "Cap apply concurrency" bullet to the intro list.

## 4. Install guides

- [x] 4.1 `install-claude-code.md`: add the `openspec-multi-model-apply` section (opt-in enablement, role agent files in `~/.claude/agents/`, fleet mechanics, billing-failure handling, run-state path, `/help` verification).
- [x] 4.2 `install-codex.md`: add the `openspec-multi-model-apply` section (opt-in enablement, Codex agent configuration with pinned models, worktree discipline, run-state path).
- [x] 4.3 `installation.md` and `README.md`: name both skills in the assistant-guide listings and the opt-in paragraph; extend the when-to-use note with the multi-model case.

## 5. Inventories (docs/supported-tools.md)

- [x] 5.1 Add `autonomous-apply` and `multi-model-apply` to the "Custom selection: any subset of all workflow IDs" list, marked opt-in skills-only.
- [x] 5.2 Add `openspec-autonomous-apply` and `openspec-multi-model-apply` to "Generated Skill Names", marked (opt-in).

## 6. Verification and review

- [x] 6.1 Verify every factual claim against source (`autonomous-apply.ts`, `multi-model-apply.ts`, `profiles.ts`, `skill-generation.ts`, `project-config.ts`); confirm no `/opsx:` command exists for either skill.
- [x] 6.2 Check style compliance with `.agents/skills/write-openspec-docs/writing.md` (no em dashes in drafted text, lists within the ~5-item cap, facts on scan anchors, skills terminology) and table/anchor integrity (column counts, GitHub slug anchors resolve).
- [x] 6.3 Two independent reviewer passes (deepseek, glm) over the full diff; fix all actionable findings and re-verify.

## 7. Merge

- [ ] 7.1 Commit the change folder alongside the docs edits on `docs/autonomous-and-multi-model-apply` and push.
- [ ] 7.2 Open the pull request; wait for CI to pass.
- [ ] 7.3 Merge to `main`, update the local main, check off this task.
- [ ] 7.4 Archive this change (`openspec archive document-autonomous-and-multi-model-apply`) and commit the archive on `main`.
