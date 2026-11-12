import { SITE_ICON_MAP, SITE_TITLE_MAP, type SiteIconRef } from './curated.js';

export type ResolvedSite = {
  key: string;
  site: string;
  title: string;
  icon: string;
  source: string;
};

function simpleIconsUrl(slug: string): string {
  return `https://cdn.simpleicons.org/${encodeURIComponent(slug)}`;
}

function dashboardIconsUrl(name: string): string {
  return `https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/${encodeURIComponent(name)}.png`;
}

function iconUrlForRef(ref: SiteIconRef): string {
  return ref.source === 'simple' ? simpleIconsUrl(ref.id) : dashboardIconsUrl(ref.id);
}

function duckDuckGoIconUrl(host: string): string {
  return `https://icons.duckduckgo.com/ip3/${encodeURIComponent(host)}.ico`;
}

function normalizeHost(hostname: string): string {
  return hostname.replace(/^www\./i, '').toLowerCase();
}

function titleCaseLabel(label: string): string {
  if (!label) return label;
  if (/^[a-z0-9]+$/i.test(label) && label.length <= 3) return label.toUpperCase();
  return label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();
}

function googleAppFromPath(pageUrl: string): { title: string; icon: SiteIconRef } | undefined {
  try {
    const u = new URL(pageUrl);
    const host = normalizeHost(u.hostname);
    const path = u.pathname.toLowerCase();

    const dash = (id: string): SiteIconRef => ({ source: 'dashboard', id });

    if (host === 'mail.google.com' || host === 'gmail.com') {
      return { title: 'Gmail', icon: dash('gmail') };
    }
    if (host === 'drive.google.com') return { title: 'Google Drive', icon: dash('google-drive') };
    if (host === 'calendar.google.com') {
      return { title: 'Google Calendar', icon: dash('google-calendar') };
    }
    if (host === 'meet.google.com') return { title: 'Google Meet', icon: dash('google-meet') };
    if (host === 'photos.google.com') {
      return { title: 'Google Photos', icon: dash('google-photos') };
    }
    if (host === 'keep.google.com') return { title: 'Google Keep', icon: dash('google-keep') };
    if (host === 'sheets.google.com') {
      return { title: 'Google Sheets', icon: dash('google-sheets') };
    }
    if (host === 'slides.google.com') {
      return { title: 'Google Slides', icon: dash('google-slides') };
    }
    if (host === 'forms.google.com') return { title: 'Google Forms', icon: dash('google-forms') };

    if (host === 'docs.google.com') {
      if (path.includes('/spreadsheets')) {
        return { title: 'Google Sheets', icon: dash('google-sheets') };
      }
      if (path.includes('/presentation')) {
        return { title: 'Google Slides', icon: dash('google-slides') };
      }
      if (path.includes('/forms')) {
        return { title: 'Google Forms', icon: dash('google-forms') };
      }
      return { title: 'Google Docs', icon: dash('google-docs') };
    }
  } catch {
    // ignore
  }
  return undefined;
}

function pathClass(pageUrl: string): string {
  try {
    const u = new URL(pageUrl);
    const host = normalizeHost(u.hostname);
    const path = u.pathname.toLowerCase();
    if (host !== 'docs.google.com') return '';
    if (path.includes('/spreadsheets')) return ':sheets';
    if (path.includes('/presentation')) return ':slides';
    if (path.includes('/forms')) return ':forms';
    return ':docs';
  } catch {
    return '';
  }
}

export function cacheKeyFor(pageUrlOrHost: string): { key: string; site: string; pageUrl: string } {
  const raw = pageUrlOrHost.trim();
  let pageUrl = raw;
  if (!/^https?:\/\//i.test(raw)) {
    pageUrl = `https://${raw.replace(/^\/+/, '')}`;
  }
  const host = normalizeHost(new URL(pageUrl).hostname);
  if (!host || !host.includes('.')) {
    throw new Error('Invalid host');
  }
  return { key: `${host}${pathClass(pageUrl)}`, site: host, pageUrl };
}

function lookupTitle(host: string): string | undefined {
  if (SITE_TITLE_MAP[host]) return SITE_TITLE_MAP[host];
  const parts = host.split('.');
  for (let i = 1; i < parts.length - 1; i++) {
    const parent = parts.slice(i).join('.');
    if (SITE_TITLE_MAP[parent]) return SITE_TITLE_MAP[parent];
  }
  return undefined;
}

function lookupIcon(host: string): SiteIconRef | undefined {
  if (SITE_ICON_MAP[host]) return SITE_ICON_MAP[host];
  return undefined;
}

function prettyTitle(host: string): string {
  const parts = host.split('.').filter(Boolean);
  const skip = new Set(['www', 'app', 'apps', 'web', 'm', 'mobile', 'www2']);
  const label = parts.find((p) => !skip.has(p)) || parts[0] || host;
  return titleCaseLabel(label);
}

/** Pure resolve — curated maps then DuckDuckGo favicon. No network. */
export function resolveSite(pageUrlOrHost: string): ResolvedSite {
  const { key, site, pageUrl } = cacheKeyFor(pageUrlOrHost);

  const google = googleAppFromPath(pageUrl);
  if (google) {
    return {
      key,
      site,
      title: google.title,
      icon: iconUrlForRef(google.icon),
      source: 'curated',
    };
  }

  const title = lookupTitle(site) || prettyTitle(site);
  const iconRef = lookupIcon(site);
  if (iconRef) {
    return {
      key,
      site,
      title,
      icon: iconUrlForRef(iconRef),
      source: 'curated',
    };
  }

  return {
    key,
    site,
    title,
    icon: duckDuckGoIconUrl(site),
    source: 'favicon',
  };
}
