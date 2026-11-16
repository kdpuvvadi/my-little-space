import { resolveMetaServiceUrl } from './buildConfig';
import { loadSettings, saveSettings } from './storage';
import { uploadEncryptedSettings } from './vaultClient';
import { loadVaultKey } from './vaultKeyStore';
import type { Settings } from './types';

export const VAULT_STALE_MS = 15 * 60 * 1000;
export const VAULT_SYNC_DEBOUNCE_MS = 2000;

export function formatVaultSyncedAt(updatedAt: number): string {
  if (!updatedAt) return 'Never synced';
  try {
    return `Last synced ${new Date(updatedAt).toLocaleString()}`;
  } catch {
    return 'Last synced recently';
  }
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let inFlight: Promise<VaultSyncOutcome> | null = null;

export type VaultSyncOutcome =
  | { ok: true; updatedAt: number }
  | { ok: false; error: string; skipped?: boolean };

async function performSync(settingsOverride?: Settings): Promise<VaultSyncOutcome> {
  const settings = settingsOverride ?? (await loadSettings());
  if (!settings.vaultEnabled || !settings.vaultSyncId) {
    return { ok: false, error: 'Safe backup is not enabled', skipped: true };
  }
  const key = await loadVaultKey();
  if (!key) {
    return {
      ok: false,
      error: 'Recovery key is not remembered on this device',
      skipped: true,
    };
  }
  const serviceUrl = resolveMetaServiceUrl(settings.metaServiceUrl);
  if (!serviceUrl) {
    return { ok: false, error: 'Meta service URL is not configured' };
  }
  try {
    const result = await uploadEncryptedSettings(
      serviceUrl,
      settings.vaultSyncId,
      key,
      settings,
    );
    await saveSettings(
      { ...settings, vaultUpdatedAt: result.updatedAt },
      { skipVaultSync: true },
    );
    return { ok: true, updatedAt: result.updatedAt };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Vault sync failed',
    };
  }
}

/** Immediate encrypted PUT when vault is enabled and key is remembered. */
export async function syncVaultNow(
  settingsOverride?: Settings,
): Promise<VaultSyncOutcome> {
  if (inFlight) return inFlight;
  inFlight = performSync(settingsOverride).finally(() => {
    inFlight = null;
  });
  return inFlight;
}

/** Debounced sync after local settings mutations. */
export function scheduleVaultSync(settings?: Settings): void {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    void syncVaultNow(settings);
  }, VAULT_SYNC_DEBOUNCE_MS);
}

/** On new-tab load: sync if last upload is older than 15 minutes. */
export async function maybeStaleVaultSync(): Promise<VaultSyncOutcome | null> {
  const settings = await loadSettings();
  if (!settings.vaultEnabled || !settings.vaultSyncId) return null;
  if (Date.now() - (settings.vaultUpdatedAt || 0) < VAULT_STALE_MS) return null;
  return syncVaultNow(settings);
}
