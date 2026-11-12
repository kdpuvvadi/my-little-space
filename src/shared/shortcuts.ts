import { iconCandidatesFor, iconUrlToPersist } from './siteIcons';
import { displayTitleFor, preferPageTitle } from './siteTitles';
import type { Shortcut } from './types';

const ALL_HOSTS = ['http://*/*', 'https://*/*'] as const;

export function createShortcutId(): string {
  return `sc-${crypto.randomUUID()}`;
}

/** Best icon URL: Simple Icons / Dashboard Icons → DDG → Google → origin. */
export function faviconUrlFor(pageUrl: string): string {
  return iconCandidatesFor(pageUrl)[0] ?? '';
}

export function originFavicon(pageUrl: string): string {
  try {
    const origin = new URL(pageUrl).origin;
    return `${origin}/favicon.ico`;
  } catch {
    return '';
  }
}

export function normalizePageUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

/** @deprecated Prefer displayTitleFor — kept for callers expecting a sync name. */
export function titleFromUrl(pageUrl: string): string {
  return displayTitleFor(pageUrl);
}

/** Instant defaults — curated/pretty name + favicon CDN, no permission prompt. */
export function guessPageMeta(pageUrl: string): { title: string; iconUrl: string } {
  const url = normalizePageUrl(pageUrl);
  return {
    title: displayTitleFor(url),
    iconUrl: faviconUrlFor(url) || originFavicon(url),
  };
}

export async function hasBrowsePermission(): Promise<boolean> {
  try {
    if (!chrome.permissions?.contains) return false;
    return await chrome.permissions.contains({ origins: [...ALL_HOSTS] });
  } catch {
    return false;
  }
}

/** One-time prompt for all sites (matches optional_host_permissions). */
export async function requestBrowsePermission(): Promise<boolean> {
  try {
    if (!chrome.permissions?.request) return true;
    if (await hasBrowsePermission()) return true;
    return await chrome.permissions.request({ origins: [...ALL_HOSTS] });
  } catch {
    return false;
  }
}

/**
 * Prefer live HTML title when browse permission is already granted.
 * Prefer curated icons over scraped favicons for known sites.
 */
export async function fetchPageMeta(
  pageUrl: string,
  options: { allowPrompt?: boolean } = {},
): Promise<{ title: string; iconUrl: string; source: 'page' | 'guess' }> {
  const url = normalizePageUrl(pageUrl);
  const guess = guessPageMeta(url);

  let allowed = await hasBrowsePermission();
  if (!allowed && options.allowPrompt) {
    allowed = await requestBrowsePermission();
  }

  if (!allowed) {
    return { ...guess, source: 'guess' };
  }

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'FETCH_PAGE_META',
      url,
    });
    if (response?.ok) {
      const scraped =
        typeof response.title === 'string' ? response.title.trim() : '';
      const title = preferPageTitle(url, scraped);
      // Keep curated / CDN icon when we have one; scraped favicons are often worse.
      const iconUrl = guess.iconUrl ||
        (typeof response.iconUrl === 'string' && response.iconUrl
          ? response.iconUrl
          : '');
      return { title, iconUrl: iconUrl || guess.iconUrl, source: 'page' };
    }
  } catch {
    // fall through
  }

  return { ...guess, source: 'guess' };
}

export function newShortcut(partial: {
  url: string;
  title?: string;
  iconUrl?: string;
}): Shortcut {
  const url = normalizePageUrl(partial.url);
  const guess = guessPageMeta(url);
  return {
    id: createShortcutId(),
    url,
    title: partial.title?.trim() || guess.title,
    // Empty = auto; only a user custom URL is stored.
    iconUrl: iconUrlToPersist(url, partial.iconUrl ?? ''),
  };
}
