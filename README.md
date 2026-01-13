# GitHub Secrets Sync

A secure, automated GitHub secret synchronization solution using Bun/TypeScript. Sync secrets across multiple repositories using a whitelist-based approach with both scheduled and manual triggers.

## Features

- **Whitelist Security**: Only explicitly allowed secrets are synced to allowed repositories
- **Secret Value Isolation**: Values are never logged or persisted, only secret names are tracked
- **Scheduled & Manual Triggers**: Runs daily at midnight UTC (configurable) or on-demand via workflow dispatch
- **Auto-Updated Status**: README automatically updates with sync status after each run
- **Dry Run Mode**: Test syncs without making changes

## Setup

### 1. Create a Personal Access Token (PAT)

**⚠️ Important**: GitHub's default `GITHUB_TOKEN` cannot access secrets in other repositories. You must create a Personal Access Token.

1. Go to https://github.com/settings/tokens/new
2. Select scopes:
   - ✅ `repo` (Full control of private repositories)
3. Generate and copy the token

### 2. Configure Repository Secrets

In your GitHub repository settings, add the following secrets:

| Secret Name | Description |
|-------------|-------------|
| `GH_SYNC_PAT` | The Personal Access Token created above |

For each secret you want to sync (defined in `sync-config.yaml`), also add it as a repository secret.

### 3. Configure sync-config.yaml

Edit `sync-config.yaml` to define your sync rules:

```yaml
# Source repository (for reference only)
source_repository: my-org/source-repo

# List of secret names to sync
secrets:
  - API_TOKEN
  - DATABASE_URL
  - APP_SECRET_KEY

# Target repositories to sync secrets to
targets:
  - repository: my-org/target-repo-1
  - repository: my-org/target-repo-2
```

### 4. Add Secrets to GitHub

For each secret listed in `sync-config.yaml`, add it as a repository secret in your GitHub repository settings. The secret name must match exactly.

## Usage

### Manual Trigger

Go to **Actions → Sync Secrets → Run workflow** and:
- Leave "Dry run" unchecked to actually sync
- Check "Dry run" to test without making changes

### Local Testing

```bash
# Install dependencies
bun install

# Dry run (no changes)
bun run dry-run

# Verbose dry run
bun run src/index.ts --dry-run --verbose

# Run sync (requires GH_SYNC_PAT env var)
GH_SYNC_PAT=your_token API_TOKEN=your_value bun run src/index.ts
```

## Sync Status

<!-- SYNC_STATUS_START -->
| Secret | Target Repo | Last Sync | Status |
|--------|-------------|-----------|--------|
<!-- SYNC_STATUS_END -->

_Last updated: Initial setup via workflow_

## Security Model

```
┌─────────────────────────────────────────────────────────────┐
│                    SECURITY PRINCIPLES                       │
├─────────────────────────────────────────────────────────────┤
│ 1. EXPLICIT ALLOW ONLY                                      │
│    - Only secrets in whitelist are synced                   │
│    - Only target repositories in whitelist are updated      │
│                                                              │
│ 2. SECRET VALUE ISOLATION                                   │
│    - Values never logged or persisted                        │
│    - Only secret names are tracked in status                │
│                                                              │
│ 3. AUDIT TRAIL                                              │
│    - Every sync operation creates GitHub Actions log        │
│    - Timestamp and result recorded                          │
└─────────────────────────────────────────────────────────────┘
```

## How It Works

1. **Configuration**: `sync-config.yaml` defines which secrets to sync and where
2. **Secret Source**: Secret values are read from environment variables (set in GitHub Actions)
3. **Sync Process**: Uses `gh` CLI to update secrets in target repositories
4. **Status Update**: README is automatically committed with sync results

## Troubleshooting

### "GH_SYNC_PAT environment variable is required"
- Ensure you've added the `GH_SYNC_PAT` secret in your repository settings
- Verify the PAT has `repo` scope

### "Secret value not found for SECRET_NAME"
- Ensure the secret is added as a repository secret in GitHub
- The secret name must match exactly (case-sensitive)

### Sync fails with authentication error
- Verify your PAT has the `repo` scope
- Check that the PAT hasn't expired or been revoked

## License

MIT
