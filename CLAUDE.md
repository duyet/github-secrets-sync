# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GitHub Secrets Sync is a Bun/TypeScript tool that synchronizes secrets across multiple GitHub repositories using a whitelist-based security model. It uses the GitHub CLI (`gh`) as the interface to GitHub's API.

**Key Security Principle**: Secret values are NEVER logged or persisted. Only secret names and sync status are tracked.

## Commands

### Development
```bash
# Install dependencies
bun install

# Type checking
bun run typecheck

# Dry run (test without making changes)
bun run dry-run

# Verbose dry run
bun run src/index.ts --dry-run --verbose

# Run sync (requires GH_SYNC_PAT env var + secret values)
GH_SYNC_PAT=your_token SECRET_NAME=your_value bun run src/index.ts
```

### Configuration File
- `sync-config.yaml`: Defines which secrets to sync and which target repositories
- Config is loaded via `src/config.ts` which includes a custom YAML parser (no external YAML dependency)

## Architecture

### Module Structure

```
src/
├── types.ts      # TypeScript interfaces for config, results, CLI options
├── config.ts     # YAML parser and config loader with validation
├── github.ts     # gh CLI wrapper functions for secret operations
└── index.ts      # Main entry point: CLI parsing, sync orchestration, README update
```

### Data Flow

1. **Config Loading**: `sync-config.yaml` → `loadConfig()` → validated `SyncConfig`
2. **Secret Source**: Environment variables (NOT from GitHub API - security feature)
3. **Sync Process**: For each secret → for each target → `gh secret set`
4. **Status Update**: README.md gets updated with sync results table

### Key Design Decisions

**Why GitHub CLI (`gh`) instead of direct REST API calls?**
- Simplified authentication (single `GH_TOKEN` env var)
- Built-in error handling and retries
- Reduces code complexity and external dependencies

**Why custom YAML parser in `config.ts` instead of a library?**
- Zero dependency approach for a simple config format
- Only needs to handle: key-value pairs, arrays, and objects in arrays
- Keeps bundle size minimal

**Why environment variables for secret values?**
- GitHub API does NOT allow reading secret values (security feature)
- In GitHub Actions, repository secrets are automatically available as env vars

### Critical Security Constraints

1. **Whitelist-only**: Only secrets explicitly listed in `sync-config.yaml` are synced
2. **Value isolation**: Secret values never appear in logs or persisted state
3. **PAT requirement**: The default `GITHUB_TOKEN` in Actions cannot access other repos; must use `GH_SYNC_PAT` with `repo` scope
4. **README updates**: Only the sync status table is modified; timestamps and status only (no values)

### README Update Mechanism

The sync process automatically updates `README.md` with a status table between markers:
```
<!-- SYNC_STATUS_START -->
...
<!-- SYNC_STATUS_END -->
```

This happens after every successful sync (not in dry-run mode).
