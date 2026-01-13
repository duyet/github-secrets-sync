# Security Model

## Core Principles

### 1. Whitelist-Only Security
- Only secrets explicitly listed in `sync-config.yaml` are synced
- Only target repositories in the config are updated
- No wildcard or "all secrets" operations

### 2. Secret Value Isolation
- Secret values are **never logged**
- Secret values are **never persisted** in this repository
- Only secret **names** appear in sync status

### 3. Audit Trail
- Every sync creates a GitHub Actions log entry
- Timestamp and result recorded in README
- Failed syncs show error messages (no values)

## What Gets Stored Where

| Data | Location | Encrypted? | Public? |
|------|----------|------------|---------|
| Secret names | `sync-config.yaml` | N/A | ✅ Yes |
| Secret values | GitHub Actions Secrets | ✅ AES-256 | ❌ No |
| PAT token | GitHub Actions Secrets | ✅ AES-256 | ❌ No |
| Sync status | `README.md` | N/A | ✅ Yes (names only) |
| Sync logs | GitHub Actions | ✅ In transit | ❌ No (no values) |

## Public Repository Safety

This repository is designed to be safe for open-source use:

### What IS in the public repo (safe)
- ✅ Secret names: `API_TOKEN`, `DATABASE_URL`, etc.
- ✅ Repository names: `my-org/target-repo`
- ✅ Source code: TypeScript implementation
- ✅ Configuration structure

### What is NOT in the public repo (stays secure)
- ❌ Secret values
- ❌ PAT tokens
- ❌ Any sensitive data

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    SECURE DATA FLOW                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  GitHub Actions Secrets (Encrypted at rest)                  │
│       │                                                      │
│       │ 1. Loaded as environment variables                  │
│       ▼                                                      │
│  Runtime Memory (transient)                                  │
│       │                                                      │
│       │ 2. Passed to gh CLI via stdin                        │
│       ▼                                                      │
│  GitHub API (HTTPS, encrypted in transit)                    │
│       │                                                      │
│       │ 3. Stored encrypted in target repo                   │
│       ▼                                                      │
│  Target Repository Secrets (Encrypted at rest)               │
│                                                              │
│  ❌ Never written to disk                                   │
│  ❌ Never logged                                            │
│  ❌ Never included in git commits                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Best Practices

1. **Use separate PATs** for different environments/orgs
2. **Rotate PATs** regularly (90-day expiration recommended)
3. **Monitor Actions logs** for any suspicious activity
4. **Review sync-config.yaml** before committing to ensure no real values
5. **Enable branch protection** on main branch to prevent direct pushes

## Threat Model

### Protected Against
- ✅ Secret exposure in git history
- ✅ Secret exposure in logs
- ✅ Accidental syncing to wrong repos (whitelist enforcement)
- ✅ Unauthorized access (PAT-based auth with scope limits)

### Your Responsibilities
- Keep PAT secure (don't share, rotate regularly)
- Only grant `repo` scope (minimum required)
- Use GitHub's built-in secret scanning
- Review access logs periodically
