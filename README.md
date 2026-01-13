# GitHub Secrets & Vars Sync

[![Run Sync](https://img.shields.io/badge/🚀-Run_Sync-blue?logo=github)](https://github.com/duyet/github-secrets-sync/actions/workflows/sync-secrets.yml)

Sync secrets (encrypted) and vars (plain text) across GitHub repositories. Whitelist-based, scheduled or manual.

## How It Works

```
                    ┌─────────────────┐
                    │   TRIGGER       │
                    │ • Schedule      │  Daily at midnight UTC
                    │ • Manual        │  Click 🚀 badge in README
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   CONFIG        │
                    │ sync-config.yaml│  Whitelist: secrets + vars + targets
                    │                 │  • Per-target overrides supported
                    └────────┬────────┘
                             │
                ┌────────────┴────────────┐
                ▼                         ▼
    ┌───────────────────┐      ┌───────────────────┐
    │   SECRETS (🔒)    │      │    VARS (📝)       │
    │ Encrypted values  │      │ Plain text config  │
    │ • API tokens      │      │ • URLs             │
    │ • Passwords       │      │ • Client IDs       │
    │ • Private keys    │      │ • Environment vars │
    └────────┬──────────┘      └────────┬──────────┘
             │                          │
             └──────────┬───────────────┘
                        ▼
              ┌────────────────────────┐
              │     SYNC PROCESS       │
              │                        │
              │  For each secret/var:  │
              │    For each target:    │
              │      gh secret/variable set
              └────────┬───────────────┘
                       │
                       ▼
                    ┌─────────────────┐
                    │   STATUS        │
                    │ Update README   │  Names only (no values)
                    └─────────────────┘
```

**Key Points:**
- 🔒 **Secrets encrypted** - sensitive values (tokens, passwords) never visible in UI
- 📝 **Vars plain text** - non-sensitive config (URLs, IDs) visible for debugging
- ✅ **Whitelist-only** - only items you explicitly list get synced
- 🤖 **Auto-detects source** - from GITHUB_REPOSITORY or git remote
- 📅 **Auto-runs daily** - or trigger manually anytime

## Three-Tier Workflow

This tool uses a **central hub pattern**:

```
┌─────────────────────────────────────────────────────────────────────┐
│                         WORKFLOW TIERS                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. LOCAL → SOURCE                                                 │
│     bun run push-env                                               │
│     Reads .env.local → Pushes to github-secrets-sync repo          │
│     (🔒 secrets + 📝 vars)                                         │
│                                                                     │
│  2. LOCAL SYNC (Optional)                                          │
│     bun run sync                                                   │
│     Syncs from local .env.local → Target repositories              │
│     (For testing before committing)                                │
│                                                                     │
│  3. WORKFLOW SYNC (Automation)                                    │
│     GitHub Actions / Manual trigger                                │
│     Syncs from github-secrets-sync → Target repositories           │
│     (🚀 Click badge in README to trigger)                          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Usage Examples

```bash
# Tier 1: Push local .env to this repo (source of truth)
bun run push-env

# Tier 2: Test sync locally (optional)
bun run sync:dry     # Dry run
bun run sync         # Live sync

# Tier 3: GitHub Actions (automatic or manual)
# Automatic: Runs daily at midnight UTC
# Manual: Click 🚀 badge in README
```

## Documentation

| Topic | Link |
|-------|------|
| **Setup Guide** | [docs/setup.md](docs/setup.md) - PAT creation, configuration |
| **Security Model** | [docs/security.md](docs/security.md) - How secrets stay safe |
| **Troubleshooting** | [docs/troubleshooting.md](docs/troubleshooting.md) - Common issues |

## Configuration Reference

**`sync-config.yaml`** structure:

```yaml
# Source repository (auto-detected)
# source_repository: duyet/github-secrets-sync

# Sensitive values (encrypted, hidden)
secrets:
  - API_TOKEN
  - DATABASE_PASSWORD

# Non-sensitive values (plain text, visible)
vars:
  - NODE_ENV
  - API_URL

# Target repositories
targets:
  - repository: duyet/my-project
    secrets:          # Optional: override secrets for this target
      - API_TOKEN
    vars:             # Optional: override vars for this target
      - NODE_ENV
```

## Quick Reference

```bash
# Push .env.local to this repo
bun run push-env

# Local sync (from .env.local to targets)
bun run sync
bun run sync:dry        # Dry run
bun run sync:verbose    # With debug output

# Direct index.ts usage
bun run start            # Sync using current env vars
bun run dry-run          # Preview without changes
bun run dry-run-verbose  # Preview with details
```

## Sync Status

<!-- SYNC_STATUS_START -->
| Secret | Target Repo | Type | Last Sync | Status |
|--------|-------------|------|-----------|--------|
<!-- SYNC_STATUS_END -->

_Last updated: Initial setup_
