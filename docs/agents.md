# Kiro Agents Reference

Custom agents are defined in `.kiro/agents/` and used by GitHub Actions workflows. Each agent follows least-privilege: it only has the tools required for its task.

## Agent Summary

| Agent | File | Tools | Use Case |
|-------|------|-------|----------|
| `code-reviewer` | `code-reviewer.json` | Read, grep | PR code review (read-only) |
| `doc-generator` | `doc-generator.json` | Read, write, grep | Generate/update documentation |
| `dependency-auditor` | `dependency-auditor.json` | Read, grep, shell | Run audit commands and report |

## `code-reviewer`

**File**: `.kiro/agents/code-reviewer.json`

- **Trusted tools**: `read`, `grep`
- **Workflow**: `kiro-code-review.yml`
- **Behavior**: Analyzes changed files in a PR and posts findings as a comment. Cannot modify files.

## `doc-generator`

**File**: `.kiro/agents/doc-generator.json`

- **Trusted tools**: `read`, `write`, `grep`
- **Workflow**: `kiro-doc-gen.yml`
- **Behavior**: Scans the codebase and creates/updates documentation files. Cannot run shell commands.

## `dependency-auditor`

**File**: `.kiro/agents/dependency-auditor.json`

- **Trusted tools**: `read`, `grep`, `shell`
- **Workflow**: `kiro-dependency-audit.yml`
- **Behavior**: Runs `npm audit`, checks for outdated packages and license issues. Cannot write files.

## Creating a New Agent

1. Create a JSON file in `.kiro/agents/`:

```json
{
  "name": "my-agent",
  "description": "What this agent does",
  "prompt": "Detailed instructions for the agent's task",
  "tools": {
    "trust": ["read", "grep"]
  }
}
```

2. Reference it in a workflow:

```yaml
- name: Run Kiro agent
  run: |
    kiro-cli chat \
      --agent my-agent \
      --trust-tools=read,grep \
      "Your prompt here"
  env:
    KIRO_API_KEY: ${{ secrets.KIRO_API_KEY }}
```

Available tool categories: `read`, `write`, `grep`, `shell`.
