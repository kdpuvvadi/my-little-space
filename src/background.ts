import { loadSettings } from './shared/storage';
import { faviconUrlFor, originFavicon } from './shared/shortcuts';

function extractTitle(html: string): string {
  const og = html.match(
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
  ) || html.match(
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i,
  );
  if (og?.[1]) return decodeHtml(og[1].trim());

  const title = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return title?.[1] ? decodeHtml(title[1].trim()) : '';
}

function extractIcon(html: string, pageUrl: string): string {
  const iconMatch =
    html.match(
      /<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["']/i,
    ) ||
    html.match(
      /<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:shortcut )?icon["']/i,
    );
  if (iconMatch?.[1]) {
    try {
      return new URL(iconMatch[1], pageUrl).href;
    } catch {
      // ignore
    }
  }
  return faviconUrlFor(pageUrl) || originFavicon(pageUrl);
}

function decodeHtml(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'FETCH_PAGE_META' && typeof message.url === 'string') {
    void (async () => {
      try {
        const response = await fetch(message.url, {
          redirect: 'follow',
          credentials: 'omit',
        });
        const html = await response.text();
        const title = extractTitle(html);
        const iconUrl = extractIcon(html, message.url);
        sendResponse({ ok: true, title, iconUrl });
      } catch (err) {
        sendResponse({
          ok: false,
          error: err instanceof Error ? err.message : 'Fetch failed',
          iconUrl: faviconUrlFor(message.url),
        });
      }
    })();
    return true;
  }
  return false;
});

chrome.runtime.onInstalled.addListener(() => {
  void loadSettings();
});
