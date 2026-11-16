/** Local-only recovery key — never included in mlsSettings / YAML / vault payload. */

export const VAULT_KEY_STORAGE = 'mlsVaultKey';

export async function loadVaultKey(): Promise<string | null> {
  try {
    const result = await chrome.storage.local.get(VAULT_KEY_STORAGE);
    const key = result[VAULT_KEY_STORAGE];
    return typeof key === 'string' && key.trim() ? key.trim() : null;
  } catch {
    return null;
  }
}

export async function saveVaultKey(key: string): Promise<void> {
  await chrome.storage.local.set({ [VAULT_KEY_STORAGE]: key.trim() });
}

export async function clearVaultKey(): Promise<void> {
  await chrome.storage.local.remove(VAULT_KEY_STORAGE);
}
