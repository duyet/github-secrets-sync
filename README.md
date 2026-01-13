# GitHub Secrets Sync

[![Run Sync](https://img.shields.io/badge/🚀-Run_Sync-blue?logo=github)](https://github.com/duyet/github-secrets-sync/actions/workflows/sync-secrets.yml)

Sync secrets across GitHub repositories safely. Whitelist-based, scheduled or manual.

## How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│  1. Trigger: Schedule (daily) or Manual (click 🚀 badge)        │
│                          ↓                                      │
│  2. Load sync-config.yaml (whitelist of secrets + targets)      │
│                          ↓                                      │
│  3. Read secret values from GitHub Actions env vars             │
│                          ↓                                      │
│  4. For each secret → For each target → gh secret set          │
│                          ↓                                      │
│  5. Update README with sync status (names only, no values)     │
└─────────────────────────────────────────────────────────────────┘
```

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
