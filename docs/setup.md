# Setup Guide

## Quick Setup

### 1. Create PAT
Go to https://github.com/settings/tokens/new → generate token with `repo` scope → copy it

### 2. Add to GitHub Secrets
In your repo settings → Secrets and variables → Actions:
- `GH_SYNC_PAT` = your PAT
- Add each secret you want to sync (e.g., `API_TOKEN`, `DATABASE_URL`)

### 3. Configure
Edit `sync-config.yaml`:
```yaml
# source_repository: auto-detected (omit for auto-detection)

# Global secrets list (default for all targets)
secrets:
  - API_TOKEN
  - DATABASE_URL
  - APP_SECRET_KEY

# Targets can override with their own subset
targets:
  # Gets all secrets from global list
  - repository: my-org/target-repo-1

  # Only gets specific secrets (per-target override)
  - repository: my-org/target-repo-2
    secrets:
      - API_TOKEN
      - DATABASE_URL

  # Monitoring gets only what it needs
  - repository: my-org/monitoring
    secrets:
      - API_TOKEN
      - MONITORING_KEY
```

**Note**: `source_repository` is optional. It auto-detects from:
- GitHub Actions: `GITHUB_REPOSITORY` environment variable
- Local: git remote URL

**Per-target secrets**: Each target can specify its own `secrets:` list to override the global list. If omitted, the target gets all global secrets.

### 4. Run
Click the 🚀 badge in the README, or it runs daily at midnight UTC

---

## Detailed Instructions

### Creating a Personal Access Token (PAT)

### Step-by-step

1. **Navigate to token settings**
   - Go to **Settings** (top right) → **Developer settings**
   - Or directly: https://github.com/settings/tokens/new

2. **Generate new token**
   - Click **Generate new token** → **Generate new token (classic)**

3. **Configure**
   - **Name**: "GitHub Secrets Sync PAT" (or any descriptive name)
   - **Expiration**: 90 days or 1 year
   - **Scopes**: Check only `repo` (full control of private repositories)

4. **Generate and copy**
   - Click **Generate token** at bottom
   - **Copy immediately** - you won't see it again!

### Why PAT is needed

GitHub's default `GITHUB_TOKEN` in Actions cannot access secrets in other repositories. A PAT with `repo` scope can:

- List secrets in any repository you have access to
- Create/update secrets in target repositories
- Authenticate the `gh` CLI for secret operations

### Security Notes

- ✅ Store PAT in GitHub Actions Secrets (encrypted at rest)
- ❌ Never commit PAT to git
- ❌ Never share in chats, emails, or issue trackers
- 🔁 Revoke immediately if accidentally exposed

## Adding Secrets to GitHub

### Repository Secrets Location

```
Your Repo → Settings → Secrets and variables → Actions
```

### Required Secrets

| Secret | Description |
|--------|-------------|
| `GH_SYNC_PAT` | Personal Access Token for authentication |

### Secret Values to Sync

For each secret in your `sync-config.yaml` `secrets:` list, add it as a repository secret with the exact same name.

Example: If `sync-config.yaml` has:
```yaml
secrets:
  - API_TOKEN
  - DATABASE_URL
```

Then add these repository secrets:
- `API_TOKEN` = your actual API token value
- `DATABASE_URL` = your actual database connection string

## Configuring sync-config.yaml

```yaml
# Source repository (optional - auto-detected if omitted)
# source_repository: my-org/source-repo

# Global secret names to sync (default for all targets)
secrets:
  - API_TOKEN
  - DATABASE_URL
  - APP_SECRET_KEY

# Target repositories (must be repos your PAT can write to)
targets:
  # Gets all global secrets
  - repository: my-org/target-repo-1

  # Per-target override: only gets specific secrets
  - repository: my-org/target-repo-2
    secrets:
      - API_TOKEN
      - DATABASE_URL
```

### Important Notes

- `source_repository` is **optional** and **for reference only** - secrets are read from GitHub Actions env vars
  - Auto-detects from `GITHUB_REPOSITORY` in GitHub Actions
  - Auto-detects from git remote URL when running locally
  - Explicitly set it if you want to override auto-detection
- **Per-target secrets**: Each target can optionally specify its own `secrets:` list
  - If specified: only those secrets are synced to that target
  - If omitted: all global secrets are synced to that target
- This allows different repos to receive different subsets of secrets
- Secret names must match exactly (case-sensitive)
- Target repos must exist and your PAT must have write access
