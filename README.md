# GitHub Secrets Sync

[![Run Sync](https://img.shields.io/badge/🚀-Run_Sync-blue?logo=github)](https://github.com/duyet/github-secrets-sync/actions/workflows/sync-secrets.yml)

Sync secrets across GitHub repositories safely. Whitelist-based, scheduled or manual.

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
                    │ sync-config.yaml│  Whitelist: secrets + targets
                    │                 │  source_repo: auto-detected
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   SECRETS       │
                    │ GitHub Actions  │  Encrypted env vars (never in git)
                    │     Secrets     │  • GH_SYNC_PAT
                    └────────┬────────┘  • API_TOKEN
                             │             • DATABASE_URL
                             ▼
              ┌────────────────────────┐
              │     SYNC PROCESS       │
              │                        │
              │  For each secret:      │
              │    For each target:    │
              │      gh secret set     │
              └────────┬───────────────┘
                       │
                       ▼
                    ┌─────────────────┐
                    │   STATUS        │
                    │ Update README   │  Names only (no values)
                    └─────────────────┘
```

**Key Points:**
- 🔒 **Values never logged** - only secret names appear in status
- ✅ **Whitelist-only** - only secrets you explicitly list get synced
- 📁 **Local .env support** - read from local files for testing (`env_file: ~/project/repo/.env*`)
- 🤖 **Auto-detects source** - from GITHUB_REPOSITORY or git remote
- 📅 **Auto-runs daily** - or trigger manually anytime

## Documentation

| Topic | Link |
|-------|------|
| **Setup Guide** | [docs/setup.md](docs/setup.md) - PAT creation, configuration |
| **Security Model** | [docs/security.md](docs/security.md) - How secrets stay safe |
| **Troubleshooting** | [docs/troubleshooting.md](docs/troubleshooting.md) - Common issues |

## Quick Reference

```bash
# Local testing (dry run)
bun run dry-run

# With custom config
bun run src/index.ts --config=path/to/config.yaml --verbose
```

## Sync Status

<!-- SYNC_STATUS_START -->
| Secret | Target Repo | Last Sync | Status |
|--------|-------------|-----------|--------|
<!-- SYNC_STATUS_END -->

_Last updated: Initial setup_
