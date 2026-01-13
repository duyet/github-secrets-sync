# Configuration Reference

The `sync-config.yaml` file defines which secrets and vars to sync, and which target repositories to receive them.

## Structure

```yaml
# Source repository (optional, auto-detected)
# source_repository: duyet/github-secrets-sync

# =============================================================================
# Global Secrets (encrypted, hidden)
# =============================================================================
secrets:
  # Rename syntax: SOURCE:TARGET
  - DU_YETBOT_TOKEN:DUYETBOT_GITHUB_TOKEN  # Read from DU_YETBOT_TOKEN, write as DUYETBOT_GITHUB_TOKEN
  - OPENROUTER_API_KEY                       # Regular (no rename)

# =============================================================================
# Global Vars (non-sensitive, visible in UI)
# =============================================================================
vars:
  - NODE_ENV
  - ENVIRONMENT

# =============================================================================
# Target Repositories
# =============================================================================
targets:
  - repository: duyet/my-project
    secrets:          # Optional: override which secrets for this target
      - API_TOKEN
    vars:             # Optional: override which vars for this target
      - NODE_ENV
```

## Fields

### `source_repository` (optional)

The source repository where secrets/vars are stored. Auto-detected from:
- `GITHUB_REPOSITORY` environment variable (in GitHub Actions)
- Git remote URL (locally)

```yaml
# Explicitly set (optional)
source_repository: duyet/github-secrets-sync

# Or let it auto-detect
# source_repository: duyet/github-secrets-sync
```

### `secrets` (required)

List of secret names to sync. These are **encrypted** and **hidden** from the GitHub UI.

**Use for:**
- API keys
- Tokens
- Passwords
- Private keys
- Anything sensitive

```yaml
secrets:
  - OPENROUTER_API_KEY
  - DATABASE_PASSWORD
  - AUTH0_CLIENT_SECRET
```

### `vars` (optional)

List of variable names to sync. These are **plain text** and **visible** in the GitHub UI.

**Use for:**
- URLs (non-sensitive)
- Client IDs (public)
- Configuration values
- Environment names
- Feature flags

```yaml
vars:
  - NODE_ENV
  - API_URL
  - AUTH0_CLIENT_ID
```

### Rename Syntax

**Format:** `SOURCE:TARGET`

Reads from `SOURCE` environment variable, but writes to the target repository as `TARGET`.

**Use case:** Different naming conventions between local environment and target repositories.

```yaml
secrets:
  # Read from DU_YETBOT_TOKEN, write as DUYETBOT_GITHUB_TOKEN
  - DU_YETBOT_TOKEN:DUYETBOT_GITHUB_TOKEN

  # Regular (no rename)
  - OPENROUTER_API_KEY

vars:
  # Rename example
  - MY_APP_URL:API_URL
  - NODE_ENV  # No rename
```

**How it works:**
1. **Read value** from `DU_YETBOT_TOKEN` environment variable
2. **Write value** to target repository as `DUYETBOT_GITHUB_TOKEN`
3. The secret in the target repo will be named `DUYETBOT_GITHUB_TOKEN`
4. Useful when your local env uses different names than your target repos

### `targets` (required)

Array of target repositories to sync secrets/vars to.

#### Target Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `repository` | string | Yes | Format: `owner/repo` |
| `secrets` | string[] | No | Override which secrets for this target |
| `vars` | string[] | No | Override which vars for this target |

## Per-Target Overrides

Each target can override which secrets/vars it receives:

```yaml
# Global lists (apply to all targets)
secrets:
  - API_TOKEN
  - DATABASE_PASSWORD
  - SECRET_KEY

vars:
  - NODE_ENV
  - API_URL

targets:
  # Target 1: Uses all global secrets and vars
  - repository: duyet/project-1
    # No overrides = uses all global items

  # Target 2: Overrides secrets (subset only)
  - repository: duyet/project-2
    secrets:
      - API_TOKEN          # Only this one, not others
      # DATABASE_PASSWORD not synced
      # SECRET_KEY not synced

  # Target 3: Overrides vars
  - repository: duyet/project-3
    vars:
      - NODE_ENV           # Override with specific value
      - DEBUG_MODE         # Add var not in global list

  # Target 4: Both overrides
  - repository: duyet/project-4
    secrets:
      - API_TOKEN
    vars:
      - NODE_ENV
      - PROJECT_ID
```

## Complete Example

```yaml
# sync-config.yaml

# Source (auto-detected)
# source_repository: duyet/github-secrets-sync

# Global secrets (synced to ALL targets by default)
secrets:
  - DUYETBOT_GITHUB_TOKEN
  - OPENROUTER_API_KEY

# Global vars (synced to ALL targets by default)
vars:
  - NODE_ENV
  - ENVIRONMENT

targets:
  # ---------------------------------------------------------------------------
  # Monorepo with multiple apps
  # ---------------------------------------------------------------------------
  - repository: duyet/monorepo
    secrets:
      # Authentication
      - AUTH0_CLIENT_SECRET
      - AUTH_SECRET

      # Analytics
      - AXIOM_TOKEN
      - POSTHOG_API_KEY
      - WAKATIME_API_KEY

      # Database
      - POSTGRES_PASSWORD
      - CLICKHOUSE_PASSWORD

      # Cloudflare
      - CLOUDFLARE_API_KEY
      - CLOUDFLARE_API_TOKEN
      - KV_REST_API_TOKEN

    vars:
      # Authentication (public client IDs)
      - AUTH0_CLIENT_ID

      # Analytics (project IDs)
      - POSTHOG_PROJECT_ID

      # Database (connection info)
      - POSTGRES_URL
      - POSTGRES_HOST
      - CLICKHOUSE_HOST

      # Cloudflare (config)
      - CLOUDFLARE_EMAIL
      - CLOUDFLARE_ZONE_ID

  # ---------------------------------------------------------------------------
  # Monitoring dashboard (minimal secrets)
  # ---------------------------------------------------------------------------
  - repository: duyet/monitoring
    secrets:
      - CLICKHOUSE_PASSWORD
      - AUTH_SECRET

    vars:
      - CLICKHOUSE_HOST
      - CLICKHOUSE_USER
      - DATABASE_URL
```

## Naming Best Practices

**Secrets:**
- Use descriptive names: `API_TOKEN` not `TOKEN`
- Group by service: `AUTH0_CLIENT_SECRET`, `POSTGRES_PASSWORD`
- Avoid reserved prefixes: `GITHUB_*` is reserved

**Vars:**
- Mark public values: `NEXT_PUBLIC_*`, `PUBLIC_*`
- Use uppercase: `NODE_ENV`, `API_URL`
- Group by type: `*_URL`, `_*_HOST`, `_*_PORT`

## Validation Rules

The config loader validates:
1. ✅ `secrets` must have at least one item
2. ✅ `targets` must have at least one item
3. ✅ Each target must have a `repository` field
4. ✅ `source_repository` auto-detected if not specified

**Invalid config examples:**
```yaml
# ❌ Empty secrets list
secrets: []

# ❌ Empty targets list
targets: []

# ❌ Missing repository
targets:
  - secrets:
      - API_TOKEN
```
