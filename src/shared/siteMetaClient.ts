import { getClientId } from './clientId';
import { guessPageMeta, normalizePageUrl } from './shortcuts';

export const META_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export type SiteMetaResult = {
  title: string;
  icon: string;
  source: 'service' | 'local';
};

export function isMetaExpired(metaFetchedAt: number, now = Date.now()): boolean {
  return !metaFetchedAt || now - metaFetchedAt > META_TTL_MS;
}

function trimBase(serviceUrl: string): string {
  return serviceUrl.trim().replace(/\/+$/, '');
}

/**
 * Remote site-meta helper with timeout. Does not fall back locally —
 * callers use fetchSiteMeta for helper-then-local.
 */
export async function fetchSiteMetaRemote(
  pageUrl: string,
  serviceUrl: string,
  options: { timeoutMs?: number } = {},
): Promise<SiteMetaResult | null> {
  const base = trimBase(serviceUrl);
  if (!base) return null;

  const url = normalizePageUrl(pageUrl);
  if (!url) return null;

  const timeoutMs = options.timeoutMs ?? 3000;
  const clientId = await getClientId();
  const endpoint = `${base}/v1/site?url=${encodeURIComponent(url)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: { 'X-Client-Id': clientId },
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const data = (await response.json()) as {
      title?: unknown;
      icon?: unknown;
    };
    const title = typeof data.title === 'string' ? data.title.trim() : '';
    const icon = typeof data.icon === 'string' ? data.icon.trim() : '';
    if (!title && !icon) return null;
    return {
      title: title || guessPageMeta(url).title,
      icon: icon || guessPageMeta(url).iconUrl,
      source: 'service',
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Helper first; on failure or empty service URL, local curated/favicon guess. */
export async function fetchSiteMeta(
  pageUrl: string,
  serviceUrl: string,
  options: { timeoutMs?: number } = {},
): Promise<SiteMetaResult> {
  const url = normalizePageUrl(pageUrl);
  const remote = await fetchSiteMetaRemote(url, serviceUrl, options);
  if (remote) return remote;

  const local = guessPageMeta(url);
  return {
    title: local.title,
    icon: local.iconUrl,
    source: 'local',
  };
}
