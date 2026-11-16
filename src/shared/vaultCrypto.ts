/** Client-side vault crypto: recovery key → syncId + AES-GCM envelope. */

const SYNC_ID_PREFIX = 'mls-sync-id:';
const PBKDF2_ITERATIONS = 310_000;
const KEY_CHUNK_COUNT = 8;
const KEY_CHUNK_BYTES = 2;

export type VaultEnvelope = {
  v: 1;
  alg: 'AES-GCM';
  kdf: 'PBKDF2';
  iterations: number;
  salt: string;
  iv: string;
  ciphertext: string;
  updatedAt: number;
};

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

function asBufferSource(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
  if (bytes.buffer instanceof ArrayBuffer && bytes.byteOffset === 0 && bytes.byteLength === bytes.buffer.byteLength) {
    return bytes as Uint8Array<ArrayBuffer>;
  }
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy;
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Generate a recovery key like `mls_xxxx-xxxx-xxxx-…` (8 hex chunks). */
export function generateRecoveryKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(KEY_CHUNK_COUNT * KEY_CHUNK_BYTES));
  const chunks: string[] = [];
  for (let i = 0; i < KEY_CHUNK_COUNT; i++) {
    const slice = bytes.subarray(i * KEY_CHUNK_BYTES, (i + 1) * KEY_CHUNK_BYTES);
    chunks.push(toHex(slice));
  }
  return `mls_${chunks.join('-')}`;
}

export function normalizeRecoveryKey(key: string): string {
  return key.trim();
}

/** Public lookup id: SHA-256 hex of `mls-sync-id:` + recovery key. */
export async function syncIdFromKey(recoveryKey: string): Promise<string> {
  const key = normalizeRecoveryKey(recoveryKey);
  const data = new TextEncoder().encode(SYNC_ID_PREFIX + key);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return toHex(new Uint8Array(digest));
}

async function deriveAesKey(
  recoveryKey: string,
  salt: Uint8Array,
  iterations: number,
): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(normalizeRecoveryKey(recoveryKey)),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: asBufferSource(salt),
      iterations,
      hash: 'SHA-256',
    },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function encryptSettings(
  settings: unknown,
  recoveryKey: string,
): Promise<VaultEnvelope> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const aesKey = await deriveAesKey(recoveryKey, salt, PBKDF2_ITERATIONS);
  const plaintext = new TextEncoder().encode(JSON.stringify(settings));
  const cipherBuf = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: asBufferSource(iv) },
    aesKey,
    plaintext,
  );
  return {
    v: 1,
    alg: 'AES-GCM',
    kdf: 'PBKDF2',
    iterations: PBKDF2_ITERATIONS,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(cipherBuf)),
    updatedAt: Date.now(),
  };
}

export async function decryptSettings<T = unknown>(
  envelope: VaultEnvelope,
  recoveryKey: string,
): Promise<T> {
  if (envelope.v !== 1 || envelope.alg !== 'AES-GCM' || envelope.kdf !== 'PBKDF2') {
    throw new Error('Unsupported vault envelope');
  }
  const salt = base64ToBytes(envelope.salt);
  const iv = base64ToBytes(envelope.iv);
  const ciphertext = base64ToBytes(envelope.ciphertext);
  const aesKey = await deriveAesKey(
    recoveryKey,
    salt,
    envelope.iterations || PBKDF2_ITERATIONS,
  );
  let plainBuf: ArrayBuffer;
  try {
    plainBuf = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: asBufferSource(iv) },
      aesKey,
      asBufferSource(ciphertext),
    );
  } catch {
    throw new Error('Wrong recovery key or corrupt vault');
  }
  return JSON.parse(new TextDecoder().decode(plainBuf)) as T;
}

export function isVaultEnvelope(value: unknown): value is VaultEnvelope {
  if (!value || typeof value !== 'object') return false;
  const e = value as Record<string, unknown>;
  return (
    e.v === 1 &&
    e.alg === 'AES-GCM' &&
    e.kdf === 'PBKDF2' &&
    typeof e.iterations === 'number' &&
    typeof e.salt === 'string' &&
    typeof e.iv === 'string' &&
    typeof e.ciphertext === 'string'
  );
}
