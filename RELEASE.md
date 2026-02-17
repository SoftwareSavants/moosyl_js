# Releasing a New Version (CI/CD)

Publishing is automated via GitHub Actions.

## One-time setup

1. In npm package settings, configure **Trusted Publishing** for GitHub Actions:
   - Owner/Org: `SoftwareSavants`
   - Repository: `moosyl_js`
   - Workflow file: `.github/workflows/publish.yml`
2. Ensure workflows are enabled in the repository.

## Publish flow

1. Bump version in `package.json` (or run `npm version patch|minor|major`).
2. Commit and push to `main`.
3. Create a GitHub Release (published).
4. The `Publish to npm` workflow builds and publishes automatically.

## Workflows

- `CI` runs on pushes and pull requests, and validates the build.
- `Publish to npm` runs on release publish (and can be triggered manually via `workflow_dispatch`).

No `NPM_TOKEN` secret is required with Trusted Publishing.
