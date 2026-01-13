# GitHub Secrets & Vars Sync

[![Run Sync](https://img.shields.io/badge/🚀-Run_Sync-blue?logo=github)](https://github.com/duyet/github-secrets-sync/actions/workflows/sync-secrets.yml)

Sync secrets (🔒 encrypted) and vars (📝 plain text) across GitHub repositories. Whitelist-based, scheduled or manual.

## How It Works

```
                    ┌─────────────────┐
                    │   TRIGGER       │
                    │ • Schedule      │  Daily at midnight UTC
                    │ • Manual        │  Click 🚀 badge above
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
- 🔒 **Secrets encrypted** - sensitive values never visible in UI
- 📝 **Vars plain text** - non-sensitive config visible for debugging
- ✅ **Whitelist-only** - only items you explicitly list get synced
- 🤖 **Auto-detects source** - from GITHUB_REPOSITORY or git remote
- 📅 **Auto-runs daily** - or trigger manually anytime

## Quick Start

```bash
# 1. Push local .env to this repo
bun run push-env

# 2. Test sync locally (optional)
bun run sync:dry

# 3. Trigger GitHub Actions (auto or manual via 🚀 badge)
```

## Documentation

| Topic | Description |
|-------|-------------|
| **[Setup Guide](docs/setup.md)** | PAT creation, configuration, getting started |
| **[Workflow](docs/workflow.md)** | Three-tier workflow (push → sync → automate) |
| **[Security](docs/security.md)** | How secrets stay safe, best practices |
| **[Troubleshooting](docs/troubleshooting.md)** | Common issues and solutions |
| **[Configuration](docs/config.md)** | sync-config.yaml reference |

## Sync Status

<!-- SYNC_STATUS_START -->
| Secret | Target Repo | Type | Last Sync | Status |
|--------|-------------|------|-----------|--------|
<!-- SYNC_STATUS_END -->

_Last updated: Initial setup_
