# Troubleshooting

## Common Errors

### "GH_SYNC_PAT environment variable is required"

**Cause**: The PAT is not configured as a GitHub Action secret.

**Solution**:
1. Go to your repo → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `GH_SYNC_PAT`
4. Value: paste your PAT

### "Secret value not found for SECRET_NAME"

**Cause**: The secret is not available as an environment variable.

**Solutions**:
- **In GitHub Actions**: Add the secret as a repository secret (name must match exactly)
- **Local testing**: Export as environment variable:
  ```bash
  export API_TOKEN=your_value
  bun run src/index.ts
  ```

### Sync fails with authentication error

**Possible causes**:
1. PAT has wrong scope
2. PAT expired or was revoked
3. PAT doesn't have access to target repository

**Solutions**:
- Verify PAT has `repo` scope at https://github.com/settings/tokens
- Check PAT expiration date
- Ensure PAT has write access to target repositories
- If target repos are in an org, ensure PAT has org access

### "gh: command not found"

**In GitHub Actions**: This shouldn't happen - `gh` is pre-installed.

**Local testing**: Install GitHub CLI:
```bash
# macOS
brew install gh

# Linux
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh
```

### Workflow runs but README not updated

**Possible causes**:
1. Dry-run mode was enabled
2. All syncs failed (README only updates on success)
3. Git push failed (check Actions logs)

**Solution**: Check the Actions log for the specific workflow run.

## Debugging

### Enable verbose output

```bash
# Local
bun run src/index.ts --verbose

# With dry run
bun run src/index.ts --dry-run --verbose
```

### Check Actions logs

1. Go to Actions tab
2. Click on the failed workflow run
3. Expand the "Sync secrets" step
4. Look for error messages in red

### Verify gh CLI authentication

```bash
# Local testing
gh auth status

# Should show:
# ✓ Logged in as <username>
# ✓ GitHub operations: gh repo (...)
```

### Test PAT manually

```bash
# Export PAT
export GH_TOKEN=your_pat_here

# Test secret listing
gh secret list -R owner/repo

# Test secret creation (dry)
echo "test" | gh secret set TEST_SECRET -R owner/repo --dry-run
```

## Getting Help

If you're still stuck:

1. Check [Issues](https://github.com/duyet/github-secrets-sync/issues) for similar problems
2. Create a new issue with:
   - Error message (full output)
   - Workflow run link (if applicable)
   - Redacted `sync-config.yaml`
   - Steps you've already tried
