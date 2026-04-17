# GitHub Actions Workflows (`.github/workflows/`)

Four CI/CD workflows powered by Kiro CLI headless mode.

## Workflow Summary

| Workflow | File | Trigger | Timeout | Agent |
|----------|------|---------|---------|-------|
| Code Review | `kiro-code-review.yml` | PR opened/synced/reopened | 10 min | `code-reviewer` |
| PR Summary | `kiro-pr-summary.yml` | PR opened/synced | 8 min | default |
| Doc Generator | `kiro-doc-gen.yml` | Push to `main` (excl. docs/md/workflows) | 15 min | `doc-generator` |
| Dependency Audit | `kiro-dependency-audit.yml` | Weekly Monday 9:00 UTC + manual | 10 min | `dependency-auditor` |

## Workflow Details

### Code Review (`kiro-code-review.yml`)

**Trigger:** `pull_request` — opened, synchronize, reopened

**Permissions:** `contents: read`, `pull-requests: write`

**Concurrency:** Groups by PR number with `cancel-in-progress: true`

**Steps:**
1. Checkout with full history (`fetch-depth: 0`)
2. Fetch PR base branch
3. Generate diff (stat + full diff, truncated to 50KB)
4. Install Kiro CLI
5. Run `kiro-cli chat` with `code-reviewer` agent and `--trust-tools=read,grep`
6. Post or update a PR comment with findings (idempotent — finds existing Kiro comment by marker text)

### PR Summary (`kiro-pr-summary.yml`)

**Trigger:** `pull_request` — opened, synchronize

**Permissions:** `contents: read`, `pull-requests: write`

**Concurrency:** Groups by PR number with `cancel-in-progress: true`

**Steps:**
1. Checkout with full history
2. Collect PR metadata (commits, changed files, stat)
3. Install Kiro CLI
4. Run `kiro-cli chat` with default agent and `--trust-tools=read,grep`
5. Update PR description with AI summary between HTML comment markers (`<!-- kiro-summary-start -->` / `<!-- kiro-summary-end -->`)

### Doc Generator (`kiro-doc-gen.yml`)

**Trigger:** `push` to `main`, excluding `docs/**`, `*.md`, `.github/**`

**Permissions:** `contents: write`, `pull-requests: write`

**Steps:**
1. Checkout repository
2. Install Kiro CLI
3. Run `kiro-cli chat` with `doc-generator` agent and `--trust-tools=read,grep,write`
4. Check for file changes via `git diff`
5. If changes exist: create a timestamped branch (`docs/auto-update-YYYYMMDD-HHMMSS`), commit, push, and open a PR

### Dependency Audit (`kiro-dependency-audit.yml`)

**Trigger:** Cron schedule (`0 9 * * 1` — Mondays at 9:00 UTC) + `workflow_dispatch`

**Permissions:** `contents: read`, `issues: write`

**Steps:**
1. Checkout repository
2. Install Kiro CLI
3. Run `kiro-cli chat` with `dependency-auditor` agent and `--trust-tools=read,grep,shell`
4. Create or update a GitHub issue labeled `dependency-audit` with the audit report

## Required Secrets

| Secret | Used by |
|--------|---------|
| `KIRO_API_KEY` | All workflows |
| `GITHUB_TOKEN` | All workflows (auto-provided) |

## Kiro Agents

Agents are defined in `.kiro/agents/` and control the prompt and tool permissions for each workflow:

| Agent | Tools Allowed | Tools Denied |
|-------|--------------|--------------|
| `code-reviewer` | readFile, readMultipleFiles, readCode, grepSearch, fileSearch, listDirectory, getDiagnostics, executeBash | fsWrite, strReplace, deleteFile, smartRelocate, semanticRename |
| `doc-generator` | readFile, readMultipleFiles, readCode, grepSearch, fileSearch, listDirectory, fsWrite, strReplace | deleteFile, executeBash |
| `dependency-auditor` | readFile, readMultipleFiles, grepSearch, fileSearch, listDirectory, executeBash | fsWrite, strReplace, deleteFile |
