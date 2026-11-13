import {
  dashboardIconsUrl,
  iconUrlForRef,
  simpleIconsUrl,
  type SiteIconRef,
} from './siteIcons';

export type CatalogIcon = {
  id: string;
  label: string;
  source: 'simple' | 'dashboard';
  /** Extra search terms (aliases, product family). */
  tags?: string[];
};

function d(
  id: string,
  label: string,
  tags: string[] = [],
): CatalogIcon {
  return { id, label, source: 'dashboard', tags };
}

function s(
  id: string,
  label: string,
  tags: string[] = [],
): CatalogIcon {
  return { id, label, source: 'simple', tags };
}

/**
 * Searchable icon catalog for the shortcut picker.
 * Heavy on self-hosted / local apps (Dashboard Icons) plus common brands (Simple Icons).
 */
export const ICON_CATALOG: CatalogIcon[] = [
  // Media / self-hosted
  d('jellyfin', 'Jellyfin', ['media', 'streaming', 'movies', 'tv']),
  d('plex', 'Plex', ['media', 'streaming']),
  d('emby', 'Emby', ['media', 'streaming']),
  d('kodi', 'Kodi', ['media']),
  d('navidrome', 'Navidrome', ['music', 'media']),
  d('audiobookshelf', 'Audiobookshelf', ['audiobooks', 'media']),
  d('immich', 'Immich', ['photos', 'gallery']),
  d('photoprism', 'PhotoPrism', ['photos']),
  d('librephotos', 'LibrePhotos', ['photos']),

  // *arr / download
  d('sonarr', 'Sonarr', ['tv', 'arr']),
  d('radarr', 'Radarr', ['movies', 'arr']),
  d('lidarr', 'Lidarr', ['music', 'arr']),
  d('readarr', 'Readarr', ['books', 'arr']),
  d('bazarr', 'Bazarr', ['subtitles', 'arr']),
  d('prowlarr', 'Prowlarr', ['indexer', 'arr']),
  d('jellyseerr', 'Jellyseerr', ['requests', 'jellyfin']),
  d('overseerr', 'Overseerr', ['requests', 'plex']),
  d('ombi', 'Ombi', ['requests']),
  d('tautulli', 'Tautulli', ['plex', 'stats']),
  d('qbittorrent', 'qBittorrent', ['torrent', 'download']),
  d('transmission', 'Transmission', ['torrent', 'download']),
  d('deluge', 'Deluge', ['torrent', 'download']),
  d('sabnzbd', 'SABnzbd', ['usenet', 'download']),
  d('nzbget', 'NZBGet', ['usenet', 'download']),

  // Infra / NAS / panels
  d('proxmox', 'Proxmox', ['vm', 'hypervisor']),
  d('portainer', 'Portainer', ['docker']),
  d('docker', 'Docker', ['containers']),
  d('kubernetes', 'Kubernetes', ['k8s']),
  d('home-assistant', 'Home Assistant', ['home', 'iot', 'ha']),
  d('nextcloud', 'Nextcloud', ['files', 'cloud']),
  d('synology', 'Synology', ['nas']),
  d('unraid', 'Unraid', ['nas']),
  d('truenas', 'TrueNAS', ['nas', 'freebsd']),
  d('openmediavault', 'OpenMediaVault', ['nas', 'omv']),
  d('authentik', 'Authentik', ['auth', 'sso', 'oidc']),
  d('authelia', 'Authelia', ['auth', 'sso']),
  d('keycloak', 'Keycloak', ['auth', 'sso']),
  d('traefik', 'Traefik', ['proxy', 'ingress']),
  d('nginx-proxy-manager', 'Nginx Proxy Manager', ['proxy', 'npm', 'nginx']),
  d('caddy', 'Caddy', ['proxy']),
  d('pi-hole', 'Pi-hole', ['dns', 'adblock']),
  d('adguard-home', 'AdGuard Home', ['dns', 'adblock']),
  d('wireguard', 'WireGuard', ['vpn']),
  d('tailscale', 'Tailscale', ['vpn', 'mesh']),
  d('cloudflare', 'Cloudflare', ['cdn', 'dns']),
  d('grafana', 'Grafana', ['metrics', 'monitoring']),
  d('prometheus', 'Prometheus', ['metrics', 'monitoring']),
  d('uptime-kuma', 'Uptime Kuma', ['monitoring', 'status']),
  d('netdata', 'Netdata', ['monitoring']),
  d('zabbix', 'Zabbix', ['monitoring']),

  // Productivity / self-hosted apps
  d('vaultwarden', 'Vaultwarden', ['passwords', 'bitwarden']),
  d('bitwarden', 'Bitwarden', ['passwords']),
  d('paperless-ngx', 'Paperless-ngx', ['documents', 'ocr']),
  d('freshrss', 'FreshRSS', ['rss', 'feed']),
  d('miniflux', 'Miniflux', ['rss', 'feed']),
  d('wallabag', 'Wallabag', ['read later']),
  d('linkding', 'Linkding', ['bookmarks']),
  d('bookmarks', 'Bookmarks', ['links']),
  d('homer', 'Homer', ['dashboard']),
  d('homarr', 'Homarr', ['dashboard']),
  d('dashy', 'Dashy', ['dashboard']),
  d('heimdall', 'Heimdall', ['dashboard']),
  d('organizr', 'Organizr', ['dashboard']),
  d('gitea', 'Gitea', ['git']),
  d('forgejo', 'Forgejo', ['git']),
  d('gitlab', 'GitLab', ['git']),
  d('jenkins', 'Jenkins', ['ci']),
  d('drone', 'Drone', ['ci']),
  d('code', 'VS Code / code-server', ['editor', 'vscode']),
  d('filebrowser', 'File Browser', ['files']),
  d('seafile', 'Seafile', ['files']),
  d('collabora', 'Collabora', ['office']),
  d('onlyoffice', 'OnlyOffice', ['office']),
  d('matrix', 'Matrix', ['chat']),
  d('element', 'Element', ['chat', 'matrix']),
  d('mattermost', 'Mattermost', ['chat']),
  d('rocketchat', 'Rocket.Chat', ['chat']),
  d('gotify', 'Gotify', ['notifications']),
  d('ntfy', 'ntfy', ['notifications']),
  d('mealie', 'Mealie', ['recipes']),
  d('tandoor', 'Tandoor', ['recipes']),
  d('homebox', 'Homebox', ['inventory']),
  d('actual', 'Actual Budget', ['finance', 'budget']),
  d('firefly-iii', 'Firefly III', ['finance']),
  d('invoice-ninja', 'Invoice Ninja', ['finance']),
  d('bookstack', 'BookStack', ['wiki', 'docs']),
  d('outline', 'Outline', ['wiki', 'docs']),
  d('wikijs', 'Wiki.js', ['wiki']),
  d('joplin', 'Joplin', ['notes']),
  d('standardnotes', 'Standard Notes', ['notes']),
  d('calibre-web', 'Calibre-Web', ['ebooks']),
  d('kavita', 'Kavita', ['ebooks', 'comics']),
  d('komga', 'Komga', ['comics']),
  d('stirling-pdf', 'Stirling PDF', ['pdf']),
  d('changedetection', 'Changedetection', ['monitor']),
  d('speedtest-tracker', 'Speedtest Tracker', ['network']),
  d('unifi', 'UniFi', ['network', 'ubiquiti']),
  d('opnsense', 'OPNsense', ['firewall']),
  d('pfsense', 'pfSense', ['firewall']),
  d('mikrotik', 'MikroTik', ['network']),
  d('frigate', 'Frigate', ['nvr', 'cameras']),
  d('scrypted', 'Scrypted', ['cameras', 'home']),
  d('zigbee2mqtt', 'Zigbee2MQTT', ['iot', 'zigbee']),
  d('zwavejs', 'Z-Wave JS', ['iot', 'zwave']),
  d('mosquitto', 'Mosquitto', ['mqtt']),
  d('node-red', 'Node-RED', ['automation']),
  d('n8n', 'n8n', ['automation', 'workflow']),
  d('activepieces', 'Activepieces', ['automation']),
  d('plausible', 'Plausible', ['analytics']),
  d('umami', 'Umami', ['analytics']),
  d('matomo', 'Matomo', ['analytics']),
  d('ghost', 'Ghost', ['blog', 'cms']),
  d('wordpress', 'WordPress', ['blog', 'cms']),
  d('directus', 'Directus', ['cms']),
  d('strapi', 'Strapi', ['cms']),
  d('postgres', 'PostgreSQL', ['database']),
  d('mysql', 'MySQL', ['database']),
  d('mariadb', 'MariaDB', ['database']),
  d('mongodb', 'MongoDB', ['database']),
  d('redis', 'Redis', ['database', 'cache']),
  d('elasticsearch', 'Elasticsearch', ['search']),
  d('meilisearch', 'Meilisearch', ['search']),
  d('rabbitmq', 'RabbitMQ', ['queue']),
  d('minio', 'MinIO', ['s3', 'storage']),

  // Popular brands (Simple Icons) — useful for public sites too
  s('google', 'Google'),
  s('youtube', 'YouTube'),
  s('github', 'GitHub'),
  s('gitlab', 'GitLab'),
  s('microsoft', 'Microsoft'),
  s('apple', 'Apple'),
  s('amazon', 'Amazon'),
  s('facebook', 'Facebook'),
  s('instagram', 'Instagram'),
  s('whatsapp', 'WhatsApp'),
  s('discord', 'Discord'),
  s('slack', 'Slack'),
  s('spotify', 'Spotify'),
  s('netflix', 'Netflix'),
  s('reddit', 'Reddit'),
  s('x', 'X / Twitter', ['twitter']),
  s('linkedin', 'LinkedIn'),
  s('notion', 'Notion'),
  s('figma', 'Figma'),
  s('dropbox', 'Dropbox'),
  s('cloudflare', 'Cloudflare'),
  s('docker', 'Docker'),
  s('kubernetes', 'Kubernetes'),
  s('openai', 'OpenAI / ChatGPT', ['chatgpt']),
  s('anthropic', 'Anthropic / Claude', ['claude']),
  s('bitwarden', 'Bitwarden'),
  s('1password', '1Password'),
  s('proton', 'Proton'),
  s('telegram', 'Telegram'),
  s('signal', 'Signal'),
  s('obsidian', 'Obsidian'),
  s('vercel', 'Vercel'),
  s('netlify', 'Netlify'),
  s('railway', 'Railway'),
  s('digitalocean', 'DigitalOcean'),
  s('amazonwebservices', 'AWS', ['aws']),
  s('googlecloud', 'Google Cloud', ['gcp']),
  s('microsoftazure', 'Azure'),
  s('visualstudiocode', 'VS Code', ['vscode', 'code']),
  s('firefox', 'Firefox'),
  s('googlechrome', 'Chrome'),
  s('safari', 'Safari'),
  s('duckduckgo', 'DuckDuckGo'),
  s('wikipedia', 'Wikipedia'),
  s('stackoverflow', 'Stack Overflow'),
  s('npm', 'npm'),
  s('nodedotjs', 'Node.js', ['node']),
  s('python', 'Python'),
  s('rust', 'Rust'),
  s('go', 'Go'),
  s('typescript', 'TypeScript'),
  s('react', 'React'),
  s('vuedotjs', 'Vue.js', ['vue']),
  s('angular', 'Angular'),
  s('svelte', 'Svelte'),
  s('tailwindcss', 'Tailwind CSS'),
  s('jira', 'Jira'),
  s('confluence', 'Confluence'),
  s('trello', 'Trello'),
  s('asana', 'Asana'),
  s('linear', 'Linear'),
  s('zoom', 'Zoom'),
  s('twitch', 'Twitch'),
  s('paypal', 'PayPal'),
  s('stripe', 'Stripe'),
];

/** Dedupe by source+id (keep first). */
function uniqueCatalog(entries: CatalogIcon[]): CatalogIcon[] {
  const seen = new Set<string>();
  const out: CatalogIcon[] = [];
  for (const e of entries) {
    const key = `${e.source}:${e.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(e);
  }
  return out;
}

const CATALOG = uniqueCatalog(ICON_CATALOG);

export function catalogIconUrl(entry: CatalogIcon): string {
  return iconUrlForRef({ source: entry.source, id: entry.id });
}

export function catalogEntryToRef(entry: CatalogIcon): SiteIconRef {
  return { source: entry.source, id: entry.id };
}

function normalizeQuery(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, ' ');
}

function slugifyQuery(q: string): string {
  return q
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Search catalog. Empty query returns popular self-hosted first (capped).
 * Non-empty also offers live Simple + Dashboard slug previews when the query
 * looks like an icon id.
 */
export function searchIconCatalog(
  query: string,
  limit = 48,
): CatalogIcon[] {
  const q = normalizeQuery(query);
  if (!q) {
    // Prefer self-hosted / dashboard icons when browsing empty.
    const dash = CATALOG.filter((e) => e.source === 'dashboard');
    const simple = CATALOG.filter((e) => e.source === 'simple');
    return [...dash, ...simple].slice(0, limit);
  }

  const scored: { entry: CatalogIcon; score: number }[] = [];
  for (const entry of CATALOG) {
    const id = entry.id.toLowerCase();
    const label = entry.label.toLowerCase();
    const tags = (entry.tags ?? []).map((t) => t.toLowerCase());
    let score = 0;
    if (id === q || label === q) score = 100;
    else if (id.startsWith(q) || label.startsWith(q)) score = 80;
    else if (id.includes(q) || label.includes(q)) score = 50;
    else if (tags.some((t) => t === q || t.startsWith(q) || t.includes(q))) {
      score = 40;
    }
    if (score > 0) scored.push({ entry, score });
  }
  scored.sort((a, b) => b.score - a.score || a.entry.label.localeCompare(b.entry.label));

  const results = scored.map((s) => s.entry);
  const slug = slugifyQuery(query);
  if (slug && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    const hasDash = results.some((e) => e.source === 'dashboard' && e.id === slug);
    const hasSimple = results.some((e) => e.source === 'simple' && e.id === slug);
    if (!hasDash) {
      results.unshift({
        id: slug,
        label: slug,
        source: 'dashboard',
        tags: ['slug'],
      });
    }
    if (!hasSimple) {
      results.unshift({
        id: slug,
        label: slug,
        source: 'simple',
        tags: ['slug'],
      });
    }
  }

  return uniqueCatalog(results).slice(0, limit);
}

export function guessCatalogFromTitleOrHost(
  title: string,
  hostname: string,
): CatalogIcon | undefined {
  const hay = `${title} ${hostname}`.toLowerCase();
  for (const entry of CATALOG) {
    if (hay.includes(entry.id.replace(/-/g, '')) || hay.includes(entry.id)) {
      return entry;
    }
    if (hay.includes(entry.label.toLowerCase())) return entry;
    for (const tag of entry.tags ?? []) {
      if (tag.length >= 4 && hay.includes(tag.toLowerCase())) return entry;
    }
  }
  return undefined;
}

export { simpleIconsUrl, dashboardIconsUrl };
