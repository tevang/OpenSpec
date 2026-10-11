# Design: add-multi-model-apply-workflow

## Context

`/openspec-autonomous-apply` proved a prompt-only skill template can drive a project-agnostic autonomous loop on any host that loads skills. Its limitation for multi-model work is intrinsic to the host session: every phase runs on the single active model. Independent review requires subagents whose model is pinned **per agent**, which OpenCode (`~/.config/opencode/agents/*.md` with `model:` frontmatter), Claude Code (`~/.claude/agents/`), and Codex support — but OpenSpec does not generate those files, and the user wants model selection without touching the skill.

## Decisions

1. **Separate skill, not an extension of `autonomous-apply`.** `openspec-autonomous-apply` remains the single-model, host-agnostic fallback. `openspec-multi-model-apply` adds role routing that only works on hosts with per-subagent model pinning; keeping both contracts apart keeps each prompt auditable.

2. **Model binding in host agent files only (single source of truth).** The skill references roles by naming convention (`*implementer*`, `*reviewer*` files). `openspec/config.yaml` deliberately carries no model keys (the parser would tolerate but not validate them, and two sources of truth would drift). Phase 0 discovers the implementer and the reviewer fleet, verifies each pinned model ID against the host model list, probes every selected role with a trivial call to catch billing failures before the run starts, and reports the resolved bindings to the user.

3. **Sequential multi-change run with a confirmed plan.** Phase 0 reads all pending changes, extracts spec-stated dependencies, proposes an order, and gets one confirmation; the per-change loop then runs without further questions except the merge gate and cap escalations. Run state in `multi-model-run.json` (plan, index, results, CI policy) makes interruptions resumable.

4. **CI gate generalizes the "skipped on PR" class of jobs.** Credential-protected jobs (e.g. online integration tests) commonly skip `pull_request` events. Rather than hardcoding any project, Phase 0 discovers such guards from `.github/workflows/*.yml` plus `AGENTS.md`/`openspec/config.yaml` guidance and records the merge policy; Phase 7 enforces it with `gh run list --branch ... --event push` evidence, `workflow_dispatch` as fallback, and a documented local command as last resort.

5. **Independence and cost controls are structural, not textual.** Reviewers are separate fresh-context subagents with read-only permissions and a steps cap; the orchestrator merges findings verbatim with only mechanical (file/line existence) checks; implementation/fixes/debugging are never issued to cloud models; reviewer prompts carry the diff inline. Test edits not traceable to the change's spec deltas are defined as blockers in the reviewer contract — this covers later changes intentionally evolving tests pinned by earlier changes in the same run.

## Risks / Trade-offs

- **Host agent files are one-time manual setup** (or documented copies); OpenSpec will not learn to generate them. Mitigation: Phase 0 prints exact templates when missing.
- **Hosts load agent files at session start** — model changes require a new session to take effect. Documented in the skill's assistant notes.
- **Reviewer ping-pong divergence** between two reviewers is bounded by the round cap (3) and surfaced to the user rather than looped forever.
