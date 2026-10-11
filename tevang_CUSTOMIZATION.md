# tevang OpenSpec Customization

## Purpose

`concise-spec-driven` is a personal variant of OpenSpec's standard `spec-driven`
workflow (`proposal -> specs -> design -> tasks`). It favors high-level,
executive-summary proposals, less repetition, less unnecessary prose, concise
decision-oriented design, complete behavioral specs, and concise but complete
task lists.

The schema introduces no arbitrary limits on words, paragraphs, sentences,
bullets, requirements, scenarios, or tasks. Concision comes from removing
repetition, misplaced implementation detail, and unnecessary explanation;
completeness takes priority.

## Fork-added workflow skills

This fork also ships two **opt-in** workflows that upstream does not have
(both registered in `ALL_WORKFLOWS` but excluded from the `core` profile, so
they install only when explicitly listed in a custom profile):

- `autonomous-apply` (`openspec-autonomous-apply`) — fully autonomous
  propose→apply→review→merge loop with worktree containment, bounded
  concurrency, and a human merge gate.
- `multi-model-apply` (`openspec-multi-model-apply`) — sequential multi-change
  apply with split model roles: a free e-INFRA model implements everything;
  two or more user-selected reviewers (any provider mix: e-INFRA, Anthropic,
  OpenAI) review independently, read-only; PR review rounds, a CI gate
  covering PR-skipped jobs, and per-change user merge approval. Model binding
  lives in per-host role agent files (`~/.config/opencode/agents/*implementer*.md`,
  `*-reviewer.md`); billing failures surface a substitution prompt, never a
  silent swap. See `docs/install-opencode.md`.

Both have their generated copies committed under `skills/`; regenerate with
`pnpm build && pnpm generate:skills && pnpm regen:parity-hashes` after
template edits.


## Usage

In a project's `openspec/config.yaml`, select the workflow by default:

```yaml
schema: concise-spec-driven
```

The CLI also supports an explicit schema override on workflow commands, for
example:

```bash
openspec new change my-change --schema concise-spec-driven
openspec instructions proposal --change my-change --schema concise-spec-driven
```

Use `openspec schemas` to list available schemas and
`openspec schema which concise-spec-driven` to inspect where this schema
resolves from. Project-local schemas take precedence over user and package
schemas.

## New-computer setup

For development or to install this fork directly from GitHub:

```bash
git clone https://github.com/tevang/OpenSpec.git
cd OpenSpec
pnpm install
pnpm build
pnpm add -g .
openspec --version
```

The repository requires Node.js 20.19.0 or newer and declares pnpm 9.15.9.
For ordinary published-package installation, use the package-manager commands
in `docs/installation.md`; installing this fork directly is useful when the
custom schema must be included before a published release.

## Upstream synchronization

Keep the remotes conventionally configured:

```text
origin   = https://github.com/tevang/OpenSpec.git
upstream = https://github.com/Fission-AI/OpenSpec.git
```

To bring future upstream changes into the fork without overwriting unrelated
work:

```bash
git fetch upstream main
git switch main
git merge upstream/main
# resolve and test any conflicts, preserving concise-spec-driven/
pnpm install
pnpm test
pnpm lint
pnpm build
git push origin main
```

Do not force-push. Review upstream changes to `schemas/spec-driven/` and merge
relevant improvements into `schemas/concise-spec-driven/` deliberately so the
custom schema remains a close, maintainable fork rather than replacing either
workflow.
