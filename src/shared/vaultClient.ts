import { ensureMetaHostPermission } from './siteMetaClient';
import {
  decryptSettings,
  encryptSettings,
  isVaultEnvelope,
  type VaultEnvelope,
} from './vaultCrypto';
import type { Settings } from './types';

function trimBase(serviceUrl: string): string {
  return serviceUrl.trim().replace(/\/+$/, '');
}

function vaultUrl(serviceUrl: string, syncId: string): string {
  return `${trimBase(serviceUrl)}/v1/vault/${encodeURIComponent(syncId)}`;
}

export type VaultPutResult = {
  ok: true;
  syncId: string;
  updatedAt: number;
  bytes: number;
};

export async function putVault(
  serviceUrl: string,
  syncId: string,
  envelope: VaultEnvelope,
  options: { timeoutMs?: number } = {},
): Promise<VaultPutResult> {
  const base = trimBase(serviceUrl);
  if (!base) throw new Error('Meta service URL is not configured');

  const allowed = await ensureMetaHostPermission(base);
  if (!allowed) throw new Error('Host permission denied for meta service');

  const timeoutMs = options.timeoutMs ?? 15_000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(vaultUrl(base, syncId), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(envelope),
      signal: controller.signal,
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(text || `Vault upload failed (${response.status})`);
    }
    const data = (await response.json()) as Partial<VaultPutResult>;
    return {
      ok: true,
      syncId: typeof data.syncId === 'string' ? data.syncId : syncId,
      updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : envelope.updatedAt,
      bytes: typeof data.bytes === 'number' ? data.bytes : 0,
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function getVault(
  serviceUrl: string,
  syncId: string,
  options: { timeoutMs?: number } = {},
): Promise<VaultEnvelope> {
  const base = trimBase(serviceUrl);
  if (!base) throw new Error('Meta service URL is not configured');

  const allowed = await ensureMetaHostPermission(base);
  if (!allowed) throw new Error('Host permission denied for meta service');

  const timeoutMs = options.timeoutMs ?? 15_000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(vaultUrl(base, syncId), {
      method: 'GET',
      signal: controller.signal,
    });
    if (response.status === 404) throw new Error('No backup found for this key');
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(text || `Vault download failed (${response.status})`);
    }
    const data: unknown = await response.json();
    if (!isVaultEnvelope(data)) throw new Error('Invalid vault envelope from server');
    return data;
  } finally {
    clearTimeout(timer);
  }
}

export async function deleteVault(
  serviceUrl: string,
  syncId: string,
  options: { timeoutMs?: number } = {},
): Promise<void> {
  const base = trimBase(serviceUrl);
  if (!base) throw new Error('Meta service URL is not configured');

  const allowed = await ensureMetaHostPermission(base);
  if (!allowed) throw new Error('Host permission denied for meta service');

  const timeoutMs = options.timeoutMs ?? 15_000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(vaultUrl(base, syncId), {
      method: 'DELETE',
      signal: controller.signal,
    });
    if (response.status === 404) return;
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(text || `Vault delete failed (${response.status})`);
    }
  } finally {
    clearTimeout(timer);
  }
}

/** Encrypt settings and PUT to the helper. */
export async function uploadEncryptedSettings(
  serviceUrl: string,
  syncId: string,
  recoveryKey: string,
  settings: Settings,
): Promise<VaultPutResult> {
  const envelope = await encryptSettings(settings, recoveryKey);
  return putVault(serviceUrl, syncId, envelope);
}

/** GET + decrypt settings from the helper. */
export async function downloadDecryptedSettings(
  serviceUrl: string,
  syncId: string,
  recoveryKey: string,
): Promise<Settings> {
  const envelope = await getVault(serviceUrl, syncId);
  return decryptSettings<Settings>(envelope, recoveryKey);
}
