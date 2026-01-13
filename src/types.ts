/**
 * Target repository configuration
 */
export interface SyncTarget {
  /** Repository in format "owner/repo" */
  repository: string;
}

/**
 * Sync configuration from sync-config.yaml
 */
export interface SyncConfig {
  /** Source repository (auto-detected if not specified) */
  source_repository?: string;
  /** List of secret names to sync */
  secrets: string[];
  /** Target repositories to sync secrets to */
  targets: SyncTarget[];
}

/**
 * Result of syncing a single secret to a target
 */
export interface SecretSyncResult {
  /** Secret name */
  secret: string;
  /** Target repository */
  target: string;
  /** Success status */
  success: boolean;
  /** Error message if failed */
  error?: string;
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
