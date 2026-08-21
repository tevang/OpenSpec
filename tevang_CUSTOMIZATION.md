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
