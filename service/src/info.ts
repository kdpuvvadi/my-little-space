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
        method: 'GET',
        path: '/health',
        description: 'Liveness check.',
        example: `${SERVICE_URL}/health`,
        response: { ok: true },
      },
    ],
  };
}
