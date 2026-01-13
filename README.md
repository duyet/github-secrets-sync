# GitHub Secrets Sync

[![Run Sync](https://img.shields.io/badge/🚀-Run_Sync-blue?logo=github)](https://github.com/duyet/github-secrets-sync/actions/workflows/sync-secrets.yml)

Sync secrets across GitHub repositories safely. Whitelist-based, scheduled or manual.

## Quick Setup

**[→ Detailed Setup Guide](docs/setup.md)**

### 1. Create PAT
Go to https://github.com/settings/tokens/new → generate token with `repo` scope → copy it

### 2. Add to GitHub Secrets
In your repo settings → Secrets and variables → Actions:
- `GH_SYNC_PAT` = your PAT
- Add each secret you want to sync (e.g., `API_TOKEN`, `DATABASE_URL`)

### 3. Configure
Edit `sync-config.yaml`:
```yaml
source_repository: my-org/source-repo  # reference only
secrets:
  - API_TOKEN
  - DATABASE_URL
targets:
  - repository: my-org/target-repo-1
  - repository: my-org/target-repo-2
```

### 4. Run
Click the 🚀 badge above, or it runs daily at midnight UTC

## Usage

```bash
# Local testing
bun run dry-run

# With custom config
bun run src/index.ts --config=path/to/config.yaml --verbose
```

## Security

**[→ Security Model Details](docs/security.md)**

| What | Where | Safe? |
|------|-------|-------|
| Secret names | `sync-config.yaml` | ✅ Public |
| Secret values | GitHub Actions Secrets only | ✅ Encrypted |
| Sync logs | GitHub Actions | ✅ No values logged |

## How It Works

```
Trigger (schedule/manual)
  → Load sync-config.yaml whitelist
  → Read secret values from GitHub Actions env
  → For each secret → For each target → gh secret set
  → Update README with sync status (names only)
```

## Troubleshooting

**[→ Full Troubleshooting Guide](docs/troubleshooting.md)**

| Error | Quick Fix |
|-------|-----------|
| `GH_SYNC_PAT required` | Add PAT to repo secrets |
| `Secret value not found` | Add secret to repo secrets (name must match) |
| Auth failed | Verify PAT has `repo` scope and hasn't expired |

## Sync Status

<!-- SYNC_STATUS_START -->
| Secret | Target Repo | Last Sync | Status |
|--------|-------------|-----------|--------|
<!-- SYNC_STATUS_END -->

_Last updated: Initial setup_
