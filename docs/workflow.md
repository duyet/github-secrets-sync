# Three-Tier Workflow

This tool uses a **central hub pattern** where `github-secrets-sync` serves as the source of truth for distributing secrets and vars to target repositories.

## Overview

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

## Tier 1: Push to Source

**Command:** `bun run push-env`

This script:
1. Loads values from `.env.local` in your project
2. Classifies each variable as **secret** or **var**
3. Pushes them to the `github-secrets-sync` repository

**Classification Rules:**

| Vars (📝 Plain Text) | Secrets (🔒 Encrypted) |
|---------------------|------------------------|
| `NEXT_PUBLIC_*` | API keys |
| `PUBLIC_*` | Tokens |
| `NODE_ENV` | Passwords |
| URLs (non-sensitive) | Private keys |
| Client IDs | Database credentials |

**Example:**
```bash
# Create .env.local with your values
cat > .env.local << 'EOF'
OPENROUTER_API_KEY=sk-or-...
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
NODE_ENV=production
EOF

# Push to GitHub
bun run push-env
```

## Tier 2: Local Sync (Optional)

**Commands:**
```bash
bun run sync         # Live sync
bun run sync:dry     # Dry run (preview)
bun run sync:verbose # With debug output
```

This script:
1. Loads `.env.local` into the environment
2. Syncs secrets/vars to target repositories using `sync-config.yaml`
3. Useful for testing before committing changes

**When to use:**
- Test configuration changes before GitHub Actions runs
- Debug sync issues locally
- Immediate sync without waiting for scheduled run

## Tier 3: GitHub Actions (Automation)

**Triggers:**
- **Automatic**: Daily at midnight UTC
- **Manual**: Click the 🚀 badge in README

**What happens:**
1. Workflow checks out `github-secrets-sync` repository
2. Fetches all **vars** using `gh variable list`
3. **Secrets** are automatically available as environment variables
4. Runs sync process to push to all target repositories
5. Updates README with sync status

**Manual Trigger:**
1. Go to [Actions tab](https://github.com/duyet/github-secrets-sync/actions)
2. Select "Sync Secrets & Vars" workflow
3. Click "Run workflow"
4. Optionally enable dry-run mode

## Workflow Diagram

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│   .env.local │ ──▶ │ push-env script  │ ──▶ │  GitHub Hub  │
│  (local dev) │     │  (classify &     │     │   (source)   │
│              │     │   push to gh)    │     │              │
└──────────────┘     └──────────────────┘     └──────┬───────┘
                                                      │
                                                      ▼
                                    ┌────────────────────────────────┐
                                    │      github-secrets-sync       │
                                    │   🔒 secrets + 📝 vars stored  │
                                    └──────────────┬─────────────────┘
                                                   │
                              ┌────────────────────┼────────────────────┐
                              │                    │                    │
                              ▼                    ▼                    ▼
                        ┌──────────┐        ┌──────────┐        ┌──────────┐
                        │  sync:   │        │  GitHub  │        │ GitHub   │
                        │  local   │        │ Actions  │        │ Actions  │
                        │  test    │        │  (auto)  │        │ (manual) │
                        └─────┬────┘        └─────┬────┘        └─────┬────┘
                              │                   │                   │
                              └───────────────────┼───────────────────┘
                                                  ▼
                                    ┌────────────────────────────────┐
                                    │         Target Repos           │
                                    │  • duyet/monorepo              │
                                    │  • duyet/clickhouse-monitoring │
                                    └────────────────────────────────┘
```

## Best Practices

1. **Always use Tier 1 first** - Push changes to source repo before syncing
2. **Test with Tier 2** - Use dry-run to verify configuration
3. **Let Tier 3 automate** - Scheduled runs keep everything in sync
4. **Use manual trigger** - For urgent updates, don't wait for schedule

## Troubleshooting

**"Variable not found" error:**
- Ensure you ran `bun run push-env` first
- Check that the value exists in `.env.local`

**"gh not found" error:**
- Install GitHub CLI: `brew install gh` (macOS)
- Authenticate: `gh auth login`

**Workflow fails with 422 error:**
- Check for reserved prefixes like `GITHUB_*`
- Use alternative names like `GH_SYNC_PAT`
