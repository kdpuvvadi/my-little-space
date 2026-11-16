export const SERVICE_NAME = 'My Little Space';
export const SERVICE_URL = 'https://mls.puvvadi.net';
export const REPO_URL = 'https://github.com/kdpuvvadi/my-little-space';
export const LATEST_RELEASE_URL =
  'https://github.com/kdpuvvadi/my-little-space/releases/latest';
export const SCHEMA_URL = `${SERVICE_URL}/v1/`;

export function serviceRootInfo() {
  return {
    name: SERVICE_NAME,
    repo: REPO_URL,
    latestRelease: LATEST_RELEASE_URL,
    service: SERVICE_URL,
    schema: SCHEMA_URL,
  };
}

/** Public API schema for /v1/ */
export function apiSchema() {
  return {
    version: '1',
    service: SERVICE_URL,
    base: `${SERVICE_URL}/v1`,
    endpoints: [
      {
        method: 'GET',
        path: '/v1/site/{host}',
        description: 'Resolve title and icon for a hostname.',
        example: `${SERVICE_URL}/v1/site/google.com`,
        response: {
          site: 'string',
          title: 'string',
          icon: 'string (URL)',
        },
      },
      {
        method: 'GET',
        path: '/v1/site',
        query: {
          url: 'Full page URL (path-aware for apps like Google Docs/Sheets).',
        },
        description: 'Resolve title and icon for a full URL.',
        example: `${SERVICE_URL}/v1/site?url=https%3A%2F%2Fmail.google.com`,
        response: {
          site: 'string',
          title: 'string',
          icon: 'string (URL)',
        },
        headers: {
          'X-Client-Id': 'Optional anonymous client id for unique-user stats.',
        },
      },
      {
        method: 'PUT',
        path: '/v1/vault/{syncId}',
        description:
          'Upsert an encrypted settings vault blob. syncId is SHA-256 hex of the recovery key material. Server stores opaque ciphertext only.',
        example: `${SERVICE_URL}/v1/vault/0123…abcd`,
        body: {
          v: 1,
          alg: 'AES-GCM',
          kdf: 'PBKDF2',
          iterations: 310000,
          salt: 'base64',
          iv: 'base64',
          ciphertext: 'base64',
          updatedAt: 'number',
        },
        response: { ok: true, syncId: 'string', updatedAt: 'number', bytes: 'number' },
      },
      {
        method: 'GET',
        path: '/v1/vault/{syncId}',
        description: 'Fetch an encrypted vault envelope by sync id.',
        example: `${SERVICE_URL}/v1/vault/0123…abcd`,
        response: { v: 1, ciphertext: 'base64', '…': 'envelope fields' },
      },
      {
        method: 'DELETE',
        path: '/v1/vault/{syncId}',
        description: 'Delete a vault blob.',
        example: `${SERVICE_URL}/v1/vault/0123…abcd`,
        response: { ok: true },
      },
      {
        method: 'GET',
        path: '/health',
        description: 'Liveness check.',
        example: `${SERVICE_URL}/health`,
        response: { ok: true },
      },
    ],
  };
}
