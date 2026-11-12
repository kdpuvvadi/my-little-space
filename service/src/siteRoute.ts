import type { Context } from 'hono';
import { getSite, isSiteFresh, upsertSite } from './sites.js';
import { resolveSite, cacheKeyFor } from './resolve.js';

export function handleSiteLookup(c: Context): Response | Promise<Response> {
  const urlParam = c.req.query('url');
  const hostParam = c.req.param('host');
  const input = (urlParam || hostParam || '').trim();

  if (!input) {
    return c.json({ error: 'Missing host or url' }, 400);
  }

  let key: string;
  let site: string;
  let pageUrl: string;
  try {
    ({ key, site, pageUrl } = cacheKeyFor(input));
  } catch {
    return c.json({ error: 'Invalid host or url' }, 400);
  }

  const cached = getSite(key);
  if (cached && isSiteFresh(cached)) {
    return c.json({
      site: cached.site,
      title: cached.title,
      icon: cached.icon,
    });
  }

  const resolved = resolveSite(pageUrl);
  upsertSite({
    key: resolved.key,
    site: resolved.site,
    title: resolved.title,
    icon: resolved.icon,
    source: resolved.source,
  });

  return c.json({
    site: resolved.site || site,
    title: resolved.title,
    icon: resolved.icon,
  });
}
