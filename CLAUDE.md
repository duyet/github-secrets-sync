# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GitHub Secrets & Vars Sync is a Bun/TypeScript tool that synchronizes **secrets** (encrypted, sensitive) and **vars** (plain text, non-sensitive) across multiple GitHub repositories using a whitelist-based security model. It uses the GitHub CLI (`gh`) as the interface to GitHub's API.

**Key Security Principle**: Secret values are NEVER logged or persisted. Only secret/var names and sync status are tracked.

## Three-Tier Workflow

This tool uses a **central hub pattern** where `github-secrets-sync` serves as the source of truth:

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

## Commands

### Development
```bash
# Install dependencies
bun install

# Type checking
bun run typecheck

# Push .env.local to this repo (Tier 1)
bun run push-env

# Local sync to targets (Tier 2)
bun run sync
bun run sync:dry        # Dry run
bun run sync:verbose    # With debug output

# Direct index.ts usage
bun run start            # Sync using current env vars
bun run dry-run          # Preview without changes
bun run dry-run-verbose  # Preview with details
```

### Configuration File
- `sync-config.yaml`: Defines which secrets/vars to sync and which target repositories
- Config is loaded via `src/config.ts` which includes a custom YAML parser (no external YAML dependency)
- Structure:
  ```yaml
  secrets:           # Global secrets (encrypted)
    - API_TOKEN
  vars:              # Global vars (plain text, visible)
    - NODE_ENV
  targets:
    - repository: owner/repo
      secrets:       # Optional: per-target override
        - API_TOKEN
      vars:          # Optional: per-target override
        - NODE_ENV
  ```

## Architecture

### Module Structure

```
src/
├── types.ts      # TypeScript interfaces for config, results, CLI options
├── config.ts     # YAML parser and config loader with validation
├── github.ts     # gh CLI wrapper for secret AND variable operations
└── index.ts      # Main entry point: CLI parsing, sync orchestration, README update

scripts/
├── push-env.ts   # Push .env.local to github-secrets-sync repo
└── sync.ts       # Sync from .env.local to target repositories
```

### Data Flow

**Tier 1: Push to Source**
1. Load `.env.local` → Parse and classify (secret vs var)
2. Use `gh secret set` for sensitive values (encrypted, hidden)
3. Use `gh variable set` for non-sensitive values (plain text, visible)

**Tier 2: Local Sync (optional)**
1. Load `.env.local` into environment
2. For each target in `sync-config.yaml`:
   - For each secret: `gh secret set`
   - For each var: `gh variable set`

**Tier 3: GitHub Actions**
1. Workflow triggers (scheduled or manual)
2. Fetch vars from repo using `gh variable list --json`
3. Secrets auto-available as env vars
4. Run sync process
5. Update README with status

### Key Design Decisions

**Why GitHub CLI (`gh`) instead of direct REST API calls?**
- Simplified authentication (single `GH_TOKEN` env var)
- Built-in error handling and retries
- Reduces code complexity and external dependencies
- Supports both secrets and variables uniformly

**Why custom YAML parser in `config.ts` instead of a library?**
- Zero dependency approach for a simple config format
- Only needs to handle: key-value pairs, arrays, and objects in arrays
- Keeps bundle size minimal

**Why environment variables for secret values?**
- GitHub API does NOT allow reading secret values (security feature)
- In GitHub Actions, repository secrets are automatically available as env vars

**Why separate secrets and vars?**
- Secrets (🔒): Encrypted, hidden from UI - for API keys, tokens, passwords
- Vars (📝): Plain text, visible in UI - for URLs, config values, client IDs
- Vars are easier to debug since they're visible in the GitHub UI

### Critical Security Constraints

1. **Whitelist-only**: Only secrets/vars explicitly listed in `sync-config.yaml` are synced
2. **Value isolation**: Secret values never appear in logs or persisted state
3. **PAT requirement**: The default `GITHUB_TOKEN` in Actions cannot access other repos; must use `GH_SYNC_PAT` with `repo` scope
4. **README updates**: Only the sync status table is modified; timestamps and status only (no values)
5. **Reserved prefixes**: GitHub reserves `GITHUB_*` prefix - use alternative names like `GH_SYNC_PAT`

### README Update Mechanism

The sync process automatically updates `README.md` with a status table between markers:
```
<!-- SYNC_STATUS_START -->
...
<!-- SYNC_STATUS_END -->
```

The table now includes a **Type** column showing:
- 🔒 secret - Encrypted, sensitive values
- 📝 var - Plain text, non-sensitive values

This happens after every successful sync (not in dry-run mode).

### Global Secrets

The following global secrets are synced to ALL target repositories:
- `DUYETBOT_GITHUB_TOKEN` - Bot token for GitHub operations
- `OPENROUTER_API_KEY` - For Claude/AI API access
