/**
 * Target repository configuration
 */
export interface SyncTarget {
  /** Repository in format "owner/repo" */
  repository: string;
  /** Optional: Override which secrets to sync to this target (defaults to all) */
  secrets?: string[];
  /** Optional: Override which vars to sync to this target (defaults to all) */
  vars?: string[];
}

/**
 * Sync configuration from sync-config.yaml
 */
export interface SyncConfig {
  /** Source repository (auto-detected if not specified) */
  source_repository?: string;
  /** List of secret names to sync (sensitive, encrypted) */
  secrets: string[];
  /** List of var names to sync (non-sensitive, plain text) */
  vars?: string[];
  /** Target repositories to sync secrets/vars to */
  targets: SyncTarget[];
}

/**
 * Result of syncing a single secret/var to a target
 */
export interface SecretSyncResult {
  /** Secret or var name */
  secret: string;
  /** Target repository */
  target: string;
  /** Success status */
  success: boolean;
  /** Error message if failed */
  error?: string;
  /** Type: "secret" or "var" */
  type?: "secret" | "var";
}

/**
 * Overall sync operation result
 */
export interface SyncResult {
  /** Timestamp of sync operation */
  timestamp: string;
  /** Total secrets synced */
  total: number;
  /** Successful syncs */
  successful: number;
  /** Failed syncs */
  failed: number;
  /** Individual results */
  details: SecretSyncResult[];
}

/**
 * CLI options
 */
export interface CliOptions {
  /** Dry run mode - don't actually sync */
  dryRun: boolean;
  /** Verbose output */
  verbose: boolean;
  /** Custom config file path */
  config?: string;
}

/**
 * Sync status for README display
 */
export interface SyncStatusEntry {
  secret: string;
  target: string;
  lastSync: string;
  status: string;
}
