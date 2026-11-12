/**
 * Human-readable shortcut names for known hosts.
 * Used when page fetch is unavailable or returns a hostname-like title.
 */

/** Host (no www.) → display name. */
export const SITE_TITLE_MAP: Record<string, string> = {
  // Google
  'google.com': 'Google',
  'mail.google.com': 'Gmail',
  'gmail.com': 'Gmail',
  'drive.google.com': 'Google Drive',
  'docs.google.com': 'Google Docs',
  'sheets.google.com': 'Google Sheets',
  'slides.google.com': 'Google Slides',
  'forms.google.com': 'Google Forms',
  'calendar.google.com': 'Google Calendar',
  'meet.google.com': 'Google Meet',
  'keep.google.com': 'Google Keep',
  'contacts.google.com': 'Google Contacts',
  'chat.google.com': 'Google Chat',
  'classroom.google.com': 'Google Classroom',
  'maps.google.com': 'Google Maps',
  'translate.google.com': 'Google Translate',
  'photos.google.com': 'Google Photos',
  'news.google.com': 'Google News',
  'play.google.com': 'Google Play',
  'firebase.google.com': 'Firebase',
  'youtube.com': 'YouTube',
  'youtu.be': 'YouTube',
  'music.youtube.com': 'YouTube Music',

  // Microsoft
  'microsoft.com': 'Microsoft',
  'office.com': 'Microsoft 365',
  'outlook.com': 'Outlook',
  'outlook.live.com': 'Outlook',
  'outlook.office.com': 'Outlook',
  'onedrive.live.com': 'OneDrive',
  'onedrive.com': 'OneDrive',
  'teams.microsoft.com': 'Microsoft Teams',
  'azure.com': 'Azure',
  'portal.azure.com': 'Azure',
  'linkedin.com': 'LinkedIn',
  'bing.com': 'Bing',
  'github.com': 'GitHub',
  'gist.github.com': 'GitHub Gist',
  'gitlab.com': 'GitLab',
  'bitbucket.org': 'Bitbucket',

  // Apple / Meta / Amazon
  'apple.com': 'Apple',
  'icloud.com': 'iCloud',
  'music.apple.com': 'Apple Music',
  'facebook.com': 'Facebook',
  'instagram.com': 'Instagram',
  'whatsapp.com': 'WhatsApp',
  'web.whatsapp.com': 'WhatsApp',
  'messenger.com': 'Messenger',
  'meta.com': 'Meta',
  'amazon.com': 'Amazon',
  'aws.amazon.com': 'AWS',
  'console.aws.amazon.com': 'AWS Console',

  // Dev / productivity
  'stackoverflow.com': 'Stack Overflow',
  'stackexchange.com': 'Stack Exchange',
  'npmjs.com': 'npm',
  'nodejs.org': 'Node.js',
  'rust-lang.org': 'Rust',
  'python.org': 'Python',
  'docker.com': 'Docker',
  'hub.docker.com': 'Docker Hub',
  'kubernetes.io': 'Kubernetes',
  'vercel.com': 'Vercel',
  'netlify.com': 'Netlify',
  'cloudflare.com': 'Cloudflare',
  'dash.cloudflare.com': 'Cloudflare',
  'digitalocean.com': 'DigitalOcean',
  'heroku.com': 'Heroku',
  'railway.app': 'Railway',
  'render.com': 'Render',
  'supabase.com': 'Supabase',
  'mongodb.com': 'MongoDB',
  'redis.io': 'Redis',
  'postgresql.org': 'PostgreSQL',
  'figma.com': 'Figma',
  'notion.so': 'Notion',
  'notion.com': 'Notion',
  'linear.app': 'Linear',
  'asana.com': 'Asana',
  'trello.com': 'Trello',
  'atlassian.com': 'Atlassian',
  'jira.atlassian.com': 'Jira',
  'confluence.atlassian.com': 'Confluence',
  'slack.com': 'Slack',
  'app.slack.com': 'Slack',
  'discord.com': 'Discord',
  'discord.gg': 'Discord',
  'zoom.us': 'Zoom',
  'dropbox.com': 'Dropbox',
  'box.com': 'Box',
  'evernote.com': 'Evernote',
  'todoist.com': 'Todoist',
  'ticktick.com': 'TickTick',
  'obsidian.md': 'Obsidian',
  'airtable.com': 'Airtable',
  'coda.io': 'Coda',
  'miro.com': 'Miro',
  'canva.com': 'Canva',
  'adobe.com': 'Adobe',
  'spotify.com': 'Spotify',
  'open.spotify.com': 'Spotify',
  'netflix.com': 'Netflix',
  'twitch.tv': 'Twitch',
  'reddit.com': 'Reddit',
  'x.com': 'X',
  'twitter.com': 'X',
  'wikipedia.org': 'Wikipedia',
  'medium.com': 'Medium',
  'dev.to': 'DEV',
  'hashnode.com': 'Hashnode',
  'codepen.io': 'CodePen',
  'codesandbox.io': 'CodeSandbox',
  'replit.com': 'Replit',
  'cursor.com': 'Cursor',
  'anthropic.com': 'Anthropic',
  'openai.com': 'OpenAI',
  'chatgpt.com': 'ChatGPT',
  'claude.ai': 'Claude',
  'gemini.google.com': 'Gemini',
};

/** Path-aware Google Workspace names (docs.google.com hosts several apps). */
export function googleAppTitleFromPath(pageUrl: string): string | undefined {
  try {
    const u = new URL(pageUrl);
    const host = u.hostname.replace(/^www\./i, '').toLowerCase();
    const path = u.pathname.toLowerCase();

    if (host === 'mail.google.com' || host === 'gmail.com') return 'Gmail';
    if (host === 'drive.google.com') return 'Google Drive';
    if (host === 'calendar.google.com') return 'Google Calendar';
    if (host === 'meet.google.com') return 'Google Meet';
    if (host === 'photos.google.com') return 'Google Photos';
    if (host === 'keep.google.com') return 'Google Keep';
    if (host === 'contacts.google.com') return 'Google Contacts';
    if (host === 'chat.google.com') return 'Google Chat';
    if (host === 'classroom.google.com') return 'Google Classroom';
    if (host === 'sheets.google.com') return 'Google Sheets';
    if (host === 'slides.google.com') return 'Google Slides';
    if (host === 'forms.google.com') return 'Google Forms';
    if (host === 'maps.google.com') return 'Google Maps';
    if (host === 'translate.google.com') return 'Google Translate';
    if (host === 'news.google.com') return 'Google News';
    if (host === 'play.google.com') return 'Google Play';
    if (host === 'gemini.google.com') return 'Gemini';

    if (host === 'docs.google.com') {
      if (path.includes('/spreadsheets')) return 'Google Sheets';
      if (path.includes('/presentation')) return 'Google Slides';
      if (path.includes('/forms')) return 'Google Forms';
      return 'Google Docs';
    }
  } catch {
    // ignore
  }
  return undefined;
}

function lookupMappedTitle(hostname: string): string | undefined {
  const host = hostname.replace(/^www\./i, '').toLowerCase();
  if (SITE_TITLE_MAP[host]) return SITE_TITLE_MAP[host];

  const parts = host.split('.');
  for (let i = 1; i < parts.length - 1; i++) {
    const parent = parts.slice(i).join('.');
    if (SITE_TITLE_MAP[parent]) return SITE_TITLE_MAP[parent];
  }
  return undefined;
}

/** Title-case a domain label: besocio → Besocio, github → Github (map overrides). */
function titleCaseLabel(label: string): string {
  if (!label) return label;
  if (/^[a-z0-9]+$/i.test(label) && label.length <= 3) return label.toUpperCase();
  return label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();
}

/**
 * Instant display name from URL — curated map, then first meaningful host label.
 * Never returns a bare hostname like `github.com`.
 */
export function displayTitleFor(pageUrl: string): string {
  try {
    const u = new URL(pageUrl);
    const host = u.hostname.replace(/^www\./i, '').toLowerCase();

    const google = googleAppTitleFromPath(pageUrl);
    if (google) return google;

    const mapped = lookupMappedTitle(host);
    if (mapped) return mapped;

    const parts = host.split('.').filter(Boolean);
    const skip = new Set(['www', 'app', 'apps', 'web', 'm', 'mobile', 'www2']);
    const label = parts.find((p) => !skip.has(p)) || parts[0] || host;
    return titleCaseLabel(label);
  } catch {
    return pageUrl;
  }
}

/** Raw hostname (legacy auto-title before curated names). */
export function hostnameTitle(pageUrl: string): string {
  try {
    return new URL(pageUrl).hostname.replace(/^www\./i, '');
  } catch {
    return pageUrl;
  }
}

/**
 * True when the stored title looks like an auto hostname fill
 * (so we can upgrade to a proper display name).
 */
export function isHostnameLikeTitle(pageUrl: string, title: string): boolean {
  const trimmed = title.trim();
  if (!trimmed) return true;
  const host = hostnameTitle(pageUrl);
  if (trimmed.toLowerCase() === host.toLowerCase()) return true;
  // Also treat bare host with scheme leftovers / trailing slash variants
  try {
    const u = new URL(pageUrl);
    if (trimmed.toLowerCase() === u.hostname.toLowerCase()) return true;
    if (trimmed.toLowerCase() === u.host.toLowerCase()) return true;
  } catch {
    // ignore
  }
  return false;
}

/** Title to show: keep user custom names; upgrade hostname leftovers. */
export function resolveShortcutTitle(pageUrl: string, storedTitle: string): string {
  if (!isHostnameLikeTitle(pageUrl, storedTitle)) return storedTitle.trim();
  return displayTitleFor(pageUrl);
}

/** Prefer a fetched page title when it is not hostname-like; else curated/pretty. */
export function preferPageTitle(pageUrl: string, pageTitle: string): string {
  const cleaned = cleanPageTitle(pageTitle);
  if (cleaned && !isHostnameLikeTitle(pageUrl, cleaned)) return cleaned;
  return displayTitleFor(pageUrl);
}

/** Strip common “Site Name - Brand” noise when the brand matches the host. */
export function cleanPageTitle(raw: string): string {
  let t = raw.replace(/\s+/g, ' ').trim();
  if (!t) return '';
  // Drop very long SPA junk
  if (t.length > 80) t = t.slice(0, 80).trim();
  return t;
}
