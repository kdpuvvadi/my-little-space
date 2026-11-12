const CLIENT_ID_KEY = 'mlsClientId';

/** Stable anonymous id for site-meta helper stats (no PII). */
export async function getClientId(): Promise<string> {
  try {
    const result = await chrome.storage.local.get(CLIENT_ID_KEY);
    const existing = result[CLIENT_ID_KEY];
    if (typeof existing === 'string' && existing.trim()) return existing.trim();

    const id = crypto.randomUUID();
    await chrome.storage.local.set({ [CLIENT_ID_KEY]: id });
    return id;
  } catch {
    return crypto.randomUUID();
  }
}
