---
name: npm-publish-audit
description: Audit JavaScript/TypeScript apps and CLIs before npm publishing. Use when Codex is asked to prepare, review, harden, or publish any future npm package, especially when checking package.json config, bin/exports/files fields, Node versus Bun runtime boundaries, dependency classification, lockfile/package-manager consistency, pack contents, npm audit results, and production smoke-test readiness.
---

# npm Publish Audit

Use this skill as a checklist before publishing any npm package. Focus on concrete package behavior and production risks, not generic release prose. Do not add licenses, READMEs, changelogs, badges, or marketing copy unless the user explicitly asks.

## Workflow

1. Inspect the package shape:
   - Read `package.json`, lockfiles, tsconfig/build config, entrypoints, and any existing publish docs.
   - Identify whether the package is a CLI, library, app template, or mixed package.
   - Confirm the intended runtime: Node, Bun, browser, edge, or a documented handoff between them.

2. Audit package config:
   - Verify `name`, `version`, `type`, `engines`, `packageManager`, scripts, and publish access are coherent.
   - For CLIs, verify every `bin` target exists after build, has an executable shebang, and can launch from a packed install.
   - For libraries, verify `exports`, `main`, `module`, `types`, and generated `.d.ts` files agree.
   - Prefer an explicit `files` allowlist over relying on `.npmignore`.
   - Ensure generated runtime files are included and source, fixtures, local agent notes, test artifacts, caches, screenshots, and private docs are excluded unless intentionally shipped.

3. Audit runtime and dependency boundaries:
   - Classify each package as `dependencies`, `devDependencies`, `peerDependencies`, or optional runtime dependency based on what the published artifact imports.
   - Check compiled output for runtime imports that package.json does not ship.
   - Resolve Node/Bun conflicts explicitly: `bun:*` imports cannot run under Node; Node wrappers that re-exec Bun must document and enforce the Bun requirement.
   - Do not assume a package works with `npx`/`npm exec` unless the runtime dependency path has been tested from the packed tarball.
   - Confirm native, FFI, postinstall, or platform-specific dependencies have clear failure behavior.

4. Run publish validation:
   - Run the normal build and typecheck scripts.
   - Run `npm pack --dry-run --json` with a writable cache if needed, for example `env npm_config_cache=/tmp/<pkg>-npm-cache npm pack --dry-run --json`.
   - Inspect the pack file list, unpacked size, entry count, and executable entrypoints.
   - Run `npm audit --omit=dev` when the package has production dependencies. Treat audit output as a release risk report, not an automatic fix request.
   - If the package is a CLI, create or use the packed tarball and smoke-test the installed command from outside the repo.

5. Report or fix:
   - Lead with blockers that would make the published package fail for users.
   - Separate production blockers from polish.
   - If implementing, keep edits to config, build/publish scripts, dependency placement, entrypoint launch checks, and minimal smoke-test support.
   - If only auditing, return a checklist with pass/fail/needs-decision status and exact file references.

## Common Blockers

- `npm pack` includes repo-private files because `files` is missing.
- `bin` points to `src` instead of built output, or built output lacks a shebang.
- `prepack`/`prepare` does not build the files that `files`, `bin`, or `exports` reference.
- A production import is listed only in `devDependencies`.
- A dev-only tool is shipped as a production dependency.
- The package claims Node support but compiled code imports `bun:*`, uses Bun APIs, or requires Bun-only transitive behavior.
- `engines` and `packageManager` imply different runtimes than the actual entrypoint.
- `exports` omits type declarations or blocks deep imports the package itself documents.
- Lockfile and package manager disagree, causing reproducibility drift.
- Smoke tests run from the repo but fail from a packed install.

## Output Shape

For an audit, use this compact format:

```markdown
**Blockers**
- [fail/pass] Issue with file reference and observed evidence.

**Config Checklist**
- package identity:
- runtime boundary:
- bin/exports:
- dependencies:
- pack contents:
- production audit:
- packed smoke test:

**Next Edits**
- Minimal concrete changes needed before publish.
```

For implementation, make the smallest config and script edits needed, then rerun the validation commands and summarize the final publish status.
