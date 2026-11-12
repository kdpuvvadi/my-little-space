/**
 * Curated brand icons for popular sites.
 * - simple: https://cdn.simpleicons.org/{slug}
 * - dashboard: Homarr dashboard-icons via jsDelivr
 */

export type SiteIconRef =
  | { source: 'simple'; id: string }
  | { source: 'dashboard'; id: string };

/** Host (no www.) → preferred icon pack entry. */
export const SITE_ICON_MAP: Record<string, SiteIconRef> = {
  // Google — Dashboard Icons use names like `gmail`, `google-docs` (not `google-gmail`)
  'google.com': { source: 'simple', id: 'google' },
  'mail.google.com': { source: 'dashboard', id: 'gmail' },
  'gmail.com': { source: 'dashboard', id: 'gmail' },
  'drive.google.com': { source: 'dashboard', id: 'google-drive' },
  'docs.google.com': { source: 'dashboard', id: 'google-docs' },
  'sheets.google.com': { source: 'dashboard', id: 'google-sheets' },
  'slides.google.com': { source: 'dashboard', id: 'google-slides' },
  'forms.google.com': { source: 'dashboard', id: 'google-forms' },
  'calendar.google.com': { source: 'dashboard', id: 'google-calendar' },
  'meet.google.com': { source: 'dashboard', id: 'google-meet' },
  'keep.google.com': { source: 'dashboard', id: 'google-keep' },
  'contacts.google.com': { source: 'dashboard', id: 'google-contacts' },
  'chat.google.com': { source: 'dashboard', id: 'google-chat' },
  'classroom.google.com': { source: 'dashboard', id: 'google-classroom' },
  'maps.google.com': { source: 'dashboard', id: 'google-maps' },
  'translate.google.com': { source: 'dashboard', id: 'google-translate' },
  'photos.google.com': { source: 'dashboard', id: 'google-photos' },
  'news.google.com': { source: 'dashboard', id: 'google-news' },
  'play.google.com': { source: 'simple', id: 'googleplay' },
  'youtube.com': { source: 'simple', id: 'youtube' },
  'youtu.be': { source: 'simple', id: 'youtube' },
  'music.youtube.com': { source: 'simple', id: 'youtubemusic' },

  // Microsoft
  'microsoft.com': { source: 'simple', id: 'microsoft' },
  'office.com': { source: 'simple', id: 'microsoftoffice' },
  'outlook.com': { source: 'dashboard', id: 'outlook' },
  'outlook.live.com': { source: 'dashboard', id: 'outlook' },
  'outlook.office.com': { source: 'dashboard', id: 'outlook' },
  'onedrive.live.com': { source: 'dashboard', id: 'onedrive' },
  'onedrive.com': { source: 'dashboard', id: 'onedrive' },
  'teams.microsoft.com': { source: 'dashboard', id: 'microsoft-teams' },
  'github.com': { source: 'simple', id: 'github' },
  'gist.github.com': { source: 'simple', id: 'github' },
  'gitlab.com': { source: 'simple', id: 'gitlab' },
  'bitbucket.org': { source: 'simple', id: 'bitbucket' },
  'azure.com': { source: 'simple', id: 'microsoftazure' },
  'portal.azure.com': { source: 'simple', id: 'microsoftazure' },
  'linkedin.com': { source: 'simple', id: 'linkedin' },
  'bing.com': { source: 'simple', id: 'microsoftbing' },

  // Apple / Meta / Amazon
  'apple.com': { source: 'simple', id: 'apple' },
  'icloud.com': { source: 'simple', id: 'icloud' },
  'music.apple.com': { source: 'simple', id: 'applemusic' },
  'facebook.com': { source: 'simple', id: 'facebook' },
  'instagram.com': { source: 'simple', id: 'instagram' },
  'whatsapp.com': { source: 'simple', id: 'whatsapp' },
  'web.whatsapp.com': { source: 'simple', id: 'whatsapp' },
  'messenger.com': { source: 'simple', id: 'messenger' },
  'meta.com': { source: 'simple', id: 'meta' },
  'amazon.com': { source: 'simple', id: 'amazon' },
  'aws.amazon.com': { source: 'simple', id: 'amazonaws' },
  'console.aws.amazon.com': { source: 'simple', id: 'amazonaws' },

  // Dev / productivity
  'stackoverflow.com': { source: 'simple', id: 'stackoverflow' },
  'stackexchange.com': { source: 'simple', id: 'stackexchange' },
  'npmjs.com': { source: 'simple', id: 'npm' },
  'nodejs.org': { source: 'simple', id: 'nodedotjs' },
  'rust-lang.org': { source: 'simple', id: 'rust' },
  'python.org': { source: 'simple', id: 'python' },
  'docker.com': { source: 'simple', id: 'docker' },
  'hub.docker.com': { source: 'simple', id: 'docker' },
  'kubernetes.io': { source: 'simple', id: 'kubernetes' },
  'vercel.com': { source: 'simple', id: 'vercel' },
  'netlify.com': { source: 'simple', id: 'netlify' },
  'cloudflare.com': { source: 'simple', id: 'cloudflare' },
  'dash.cloudflare.com': { source: 'simple', id: 'cloudflare' },
  'digitalocean.com': { source: 'simple', id: 'digitalocean' },
  'heroku.com': { source: 'simple', id: 'heroku' },
  'railway.app': { source: 'simple', id: 'railway' },
  'render.com': { source: 'simple', id: 'render' },
  'supabase.com': { source: 'simple', id: 'supabase' },
  'firebase.google.com': { source: 'simple', id: 'firebase' },
  'mongodb.com': { source: 'simple', id: 'mongodb' },
  'redis.io': { source: 'simple', id: 'redis' },
  'postgresql.org': { source: 'simple', id: 'postgresql' },
  'figma.com': { source: 'simple', id: 'figma' },
  'notion.so': { source: 'simple', id: 'notion' },
  'notion.com': { source: 'simple', id: 'notion' },
  'linear.app': { source: 'simple', id: 'linear' },
  'asana.com': { source: 'simple', id: 'asana' },
  'trello.com': { source: 'simple', id: 'trello' },
  'atlassian.com': { source: 'simple', id: 'atlassian' },
  'jira.atlassian.com': { source: 'simple', id: 'jira' },
  'confluence.atlassian.com': { source: 'simple', id: 'confluence' },
  'slack.com': { source: 'simple', id: 'slack' },
  'app.slack.com': { source: 'simple', id: 'slack' },
  'discord.com': { source: 'simple', id: 'discord' },
  'discord.gg': { source: 'simple', id: 'discord' },
  'zoom.us': { source: 'simple', id: 'zoom' },
  'dropbox.com': { source: 'simple', id: 'dropbox' },
  'box.com': { source: 'simple', id: 'box' },
  'evernote.com': { source: 'simple', id: 'evernote' },
  'todoist.com': { source: 'simple', id: 'todoist' },
  'ticktick.com': { source: 'dashboard', id: 'ticktick' },
  'obsidian.md': { source: 'simple', id: 'obsidian' },
  'airtable.com': { source: 'simple', id: 'airtable' },
  'coda.io': { source: 'simple', id: 'coda' },
  'miro.com': { source: 'simple', id: 'miro' },
  'canva.com': { source: 'simple', id: 'canva' },
  'adobe.com': { source: 'simple', id: 'adobe' },
  'spotify.com': { source: 'simple', id: 'spotify' },
  'open.spotify.com': { source: 'simple', id: 'spotify' },
  'netflix.com': { source: 'simple', id: 'netflix' },
  'twitch.tv': { source: 'simple', id: 'twitch' },
  'reddit.com': { source: 'simple', id: 'reddit' },
  'old.reddit.com': { source: 'simple', id: 'reddit' },
  'x.com': { source: 'simple', id: 'x' },
  'twitter.com': { source: 'simple', id: 'x' },
  'tiktok.com': { source: 'simple', id: 'tiktok' },
  'pinterest.com': { source: 'simple', id: 'pinterest' },
  'tumblr.com': { source: 'simple', id: 'tumblr' },
  'medium.com': { source: 'simple', id: 'medium' },
  'substack.com': { source: 'simple', id: 'substack' },
  'wikipedia.org': { source: 'simple', id: 'wikipedia' },
  'en.wikipedia.org': { source: 'simple', id: 'wikipedia' },
  'archive.org': { source: 'simple', id: 'internetarchive' },
  'bbc.com': { source: 'simple', id: 'bbc' },
  'bbc.co.uk': { source: 'simple', id: 'bbc' },
  'nytimes.com': { source: 'simple', id: 'newyorktimes' },
  'cnn.com': { source: 'simple', id: 'cnn' },
  'theguardian.com': { source: 'simple', id: 'guardian' },
  'weather.com': { source: 'dashboard', id: 'accuweather' },
  'openstreetmap.org': { source: 'simple', id: 'openstreetmap' },
  'duckduckgo.com': { source: 'simple', id: 'duckduckgo' },
  'brave.com': { source: 'simple', id: 'brave' },
  'mozilla.org': { source: 'simple', id: 'mozilla' },
  'developer.mozilla.org': { source: 'simple', id: 'mdnwebdocs' },
  'chatgpt.com': { source: 'simple', id: 'openai' },
  'chat.openai.com': { source: 'simple', id: 'openai' },
  'openai.com': { source: 'simple', id: 'openai' },
  'claude.ai': { source: 'simple', id: 'anthropic' },
  'anthropic.com': { source: 'simple', id: 'anthropic' },
  'gemini.google.com': { source: 'simple', id: 'googlegemini' },
  'copilot.microsoft.com': { source: 'simple', id: 'microsoftcopilot' },
  'perplexity.ai': { source: 'simple', id: 'perplexity' },
  'cursor.com': { source: 'dashboard', id: 'cursor' },
  'www.cursor.com': { source: 'dashboard', id: 'cursor' },
  'code.visualstudio.com': { source: 'simple', id: 'visualstudiocode' },
  'paypal.com': { source: 'simple', id: 'paypal' },
  'stripe.com': { source: 'simple', id: 'stripe' },
  'shopify.com': { source: 'simple', id: 'shopify' },
  'ebay.com': { source: 'simple', id: 'ebay' },
  'walmart.com': { source: 'simple', id: 'walmart' },
  'target.com': { source: 'simple', id: 'target' },
  'craigslist.org': { source: 'dashboard', id: 'craigslist' },
  'imdb.com': { source: 'simple', id: 'imdb' },
  'rottentomatoes.com': { source: 'simple', id: 'rottentomatoes' },
  'letterboxd.com': { source: 'simple', id: 'letterboxd' },
  'goodreads.com': { source: 'simple', id: 'goodreads' },
  'yelp.com': { source: 'simple', id: 'yelp' },
  'tripadvisor.com': { source: 'simple', id: 'tripadvisor' },
  'booking.com': { source: 'simple', id: 'bookingdotcom' },
  'airbnb.com': { source: 'simple', id: 'airbnb' },
  'uber.com': { source: 'simple', id: 'uber' },
  'lyft.com': { source: 'simple', id: 'lyft' },
  'doordash.com': { source: 'simple', id: 'doordash' },
  'bankofamerica.com': { source: 'dashboard', id: 'bank-of-america' },
  'chase.com': { source: 'dashboard', id: 'chase' },
  'wellsfargo.com': { source: 'dashboard', id: 'wells-fargo' },
  'americanexpress.com': { source: 'simple', id: 'americanexpress' },
  'visa.com': { source: 'simple', id: 'visa' },
  'mastercard.com': { source: 'simple', id: 'mastercard' },
  'telegram.org': { source: 'simple', id: 'telegram' },
  'web.telegram.org': { source: 'simple', id: 'telegram' },
  'signal.org': { source: 'simple', id: 'signal' },
  'proton.me': { source: 'simple', id: 'proton' },
  'mail.proton.me': { source: 'dashboard', id: 'proton-mail' },
  'bitwarden.com': { source: 'simple', id: 'bitwarden' },
  'vault.bitwarden.com': { source: 'simple', id: 'bitwarden' },
  '1password.com': { source: 'simple', id: '1password' },
  'lastpass.com': { source: 'simple', id: 'lastpass' },
  'todo.microsoft.com': { source: 'dashboard', id: 'microsoft-todo' },
  'home.google.com': { source: 'dashboard', id: 'google-home' },
  'news.ycombinator.com': { source: 'simple', id: 'ycombinator' },
  'producthunt.com': { source: 'simple', id: 'producthunt' },
  'behance.net': { source: 'simple', id: 'behance' },
  'dribbble.com': { source: 'simple', id: 'dribbble' },
  'unsplash.com': { source: 'simple', id: 'unsplash' },
  'pexels.com': { source: 'simple', id: 'pexels' },
  'flickr.com': { source: 'simple', id: 'flickr' },
  'vimeo.com': { source: 'simple', id: 'vimeo' },
  'soundcloud.com': { source: 'simple', id: 'soundcloud' },
  'bandcamp.com': { source: 'simple', id: 'bandcamp' },
  'steamcommunity.com': { source: 'simple', id: 'steam' },
  'store.steampowered.com': { source: 'simple', id: 'steam' },
  'epicgames.com': { source: 'simple', id: 'epicgames' },
  'twilio.com': { source: 'simple', id: 'twilio' },
  'sendgrid.com': { source: 'simple', id: 'sendgrid' },
  'mailchimp.com': { source: 'simple', id: 'mailchimp' },
  'hubspot.com': { source: 'simple', id: 'hubspot' },
  'salesforce.com': { source: 'simple', id: 'salesforce' },
  'zendesk.com': { source: 'simple', id: 'zendesk' },
  'intercom.com': { source: 'simple', id: 'intercom' },
  'grammarly.com': { source: 'simple', id: 'grammarly' },
  'quillbot.com': { source: 'dashboard', id: 'quillbot' },
  'deepl.com': { source: 'simple', id: 'deepl' },
  'wolframalpha.com': { source: 'simple', id: 'wolfram' },
  'khanacademy.org': { source: 'simple', id: 'khanacademy' },
  'coursera.org': { source: 'simple', id: 'coursera' },
  'udemy.com': { source: 'simple', id: 'udemy' },
  'edx.org': { source: 'simple', id: 'edx' },
  'duolingo.com': { source: 'simple', id: 'duolingo' },
  'ankiweb.net': { source: 'dashboard', id: 'anki' },
  'replit.com': { source: 'simple', id: 'replit' },
  'codepen.io': { source: 'simple', id: 'codepen' },
  'jsfiddle.net': { source: 'simple', id: 'jsfiddle' },
  'codesandbox.io': { source: 'simple', id: 'codesandbox' },
  'stackoverflow.blog': { source: 'simple', id: 'stackoverflow' },
  'dev.to': { source: 'simple', id: 'devdotto' },
  'hashnode.com': { source: 'simple', id: 'hashnode' },
  'css-tricks.com': { source: 'dashboard', id: 'css-tricks' },
  'smashingmagazine.com': { source: 'simple', id: 'smashingmagazine' },
  'infoq.com': { source: 'dashboard', id: 'infoq' },
  'arxiv.org': { source: 'simple', id: 'arxiv' },
  'nature.com': { source: 'simple', id: 'springernature' },
  'sciencedirect.com': { source: 'dashboard', id: 'sciencedirect' },
  'pubmed.ncbi.nlm.nih.gov': { source: 'dashboard', id: 'pubmed' },
  'nih.gov': { source: 'dashboard', id: 'nih' },
  'nasa.gov': { source: 'simple', id: 'nasa' },
  'weather.gov': { source: 'dashboard', id: 'nws' },
  'irs.gov': { source: 'dashboard', id: 'irs' },
  'usa.gov': { source: 'dashboard', id: 'usa-gov' },
  'gov.uk': { source: 'simple', id: 'govuk' },
  'wikipedia.com': { source: 'simple', id: 'wikipedia' },
};

export function simpleIconsUrl(slug: string): string {
  return `https://cdn.simpleicons.org/${encodeURIComponent(slug)}`;
}

export function dashboardIconsUrl(name: string): string {
  return `https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/${encodeURIComponent(name)}.png`;
}

export function duckDuckGoIconUrl(host: string): string {
  return `https://icons.duckduckgo.com/ip3/${encodeURIComponent(host)}.ico`;
}

export function googleFaviconUrl(host: string, size = 64): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=${size}`;
}

export function iconUrlForRef(ref: SiteIconRef): string {
  return ref.source === 'simple' ? simpleIconsUrl(ref.id) : dashboardIconsUrl(ref.id);
}

/** Exact host only (no parent walk). */
export function lookupExactSiteIcon(hostname: string): SiteIconRef | undefined {
  const host = hostname.replace(/^www\./i, '').toLowerCase();
  return SITE_ICON_MAP[host];
}

/** Parent hosts such as google.com — used only as a late fallback. */
export function lookupParentSiteIcon(hostname: string): SiteIconRef | undefined {
  const host = hostname.replace(/^www\./i, '').toLowerCase();
  if (SITE_ICON_MAP[host]) return undefined;

  const parts = host.split('.');
  for (let i = 1; i < parts.length - 1; i++) {
    const parent = parts.slice(i).join('.');
    if (SITE_ICON_MAP[parent]) return SITE_ICON_MAP[parent];
  }
  return undefined;
}

export function lookupSiteIcon(hostname: string): SiteIconRef | undefined {
  return lookupExactSiteIcon(hostname) ?? lookupParentSiteIcon(hostname);
}

export function hostnameOf(pageUrl: string): string {
  try {
    return new URL(pageUrl).hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    return '';
  }
}

/** Google Docs/Sheets/Slides share docs.google.com — pick by path. */
export function googleAppIconFromPath(pageUrl: string): SiteIconRef | undefined {
  try {
    const u = new URL(pageUrl);
    const host = u.hostname.replace(/^www\./i, '').toLowerCase();
    const path = u.pathname.toLowerCase();

    if (host === 'mail.google.com' || host === 'gmail.com') {
      return { source: 'dashboard', id: 'gmail' };
    }
    if (host === 'drive.google.com') {
      return { source: 'dashboard', id: 'google-drive' };
    }
    if (host === 'calendar.google.com') {
      return { source: 'dashboard', id: 'google-calendar' };
    }
    if (host === 'meet.google.com') {
      return { source: 'dashboard', id: 'google-meet' };
    }
    if (host === 'photos.google.com') {
      return { source: 'dashboard', id: 'google-photos' };
    }
    if (host === 'keep.google.com') {
      return { source: 'dashboard', id: 'google-keep' };
    }
    if (host === 'contacts.google.com') {
      return { source: 'dashboard', id: 'google-contacts' };
    }
    if (host === 'chat.google.com') {
      return { source: 'dashboard', id: 'google-chat' };
    }
    if (host === 'classroom.google.com') {
      return { source: 'dashboard', id: 'google-classroom' };
    }
    if (host === 'sheets.google.com') {
      return { source: 'dashboard', id: 'google-sheets' };
    }
    if (host === 'slides.google.com') {
      return { source: 'dashboard', id: 'google-slides' };
    }
    if (host === 'forms.google.com') {
      return { source: 'dashboard', id: 'google-forms' };
    }

    if (host === 'docs.google.com') {
      if (path.includes('/spreadsheets')) {
        return { source: 'dashboard', id: 'google-sheets' };
      }
      if (path.includes('/presentation')) {
        return { source: 'dashboard', id: 'google-slides' };
      }
      if (path.includes('/forms')) {
        return { source: 'dashboard', id: 'google-forms' };
      }
      if (path.includes('/document') || path === '/' || path === '') {
        return { source: 'dashboard', id: 'google-docs' };
      }
      return { source: 'dashboard', id: 'google-docs' };
    }
  } catch {
    // ignore
  }
  return undefined;
}

const SKIP_LABELS = new Set([
  'www',
  'app',
  'apps',
  'web',
  'm',
  'mobile',
  'api',
  'cdn',
  'static',
  'dev',
  'staging',
  'login',
  'auth',
  'account',
  'accounts',
  'my',
  'open',
  'blog',
  'shop',
  'store',
  'support',
  'help',
  'status',
]);

/**
 * Guess icon ids from hostname. Specific product names before umbrella brand.
 * e.g. mail.google.com → gmail, google-mail, … then google
 */
export function guessIconIds(hostname: string): string[] {
  const host = hostname.replace(/^www\./i, '').toLowerCase();
  const labels = host.split('.').filter(Boolean);
  if (!labels.length) return [];

  const multiTld = new Set(['co', 'com', 'org', 'gov', 'ac', 'ne', 'or']);
  let brandLabels = labels.slice(0, -1);
  if (
    labels.length >= 3 &&
    multiTld.has(labels[labels.length - 2]) &&
    labels[labels.length - 1].length <= 3
  ) {
    brandLabels = labels.slice(0, -2);
  }
  if (!brandLabels.length) brandLabels = [labels[0]];

  const brand = brandLabels[brandLabels.length - 1];
  const subs = brandLabels.slice(0, -1).filter((l) => !SKIP_LABELS.has(l));

  const specific: string[] = [];
  const brandIds: string[] = [];
  const addSpecific = (id: string) => {
    const clean = id.toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (clean && !specific.includes(clean) && !brandIds.includes(clean)) {
      specific.push(clean);
    }
  };
  const addBrand = (id: string) => {
    const clean = id.toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (clean && !specific.includes(clean) && !brandIds.includes(clean)) {
      brandIds.push(clean);
    }
  };

  for (const sub of subs) {
    addSpecific(sub);
    addSpecific(`${brand}-${sub}`);
    addSpecific(`${sub}-${brand}`);
    addSpecific(`${brand}${sub}`);
    addSpecific(`${sub}${brand}`);
  }

  if (subs.includes('mail') || subs.includes('email') || host.startsWith('mail.')) {
    addSpecific('gmail');
    addSpecific('google-mail');
  }
  if (subs.includes('docs') || host.startsWith('docs.')) {
    addSpecific('google-docs');
    addSpecific('docs');
  }
  if (subs.includes('drive') || host.startsWith('drive.')) {
    addSpecific('google-drive');
    addSpecific('drive');
  }
  if (subs.includes('sheets') || host.startsWith('sheets.')) {
    addSpecific('google-sheets');
    addSpecific('sheets');
  }
  if (subs.includes('slides') || host.startsWith('slides.')) {
    addSpecific('google-slides');
    addSpecific('slides');
  }
  if (subs.includes('calendar') || host.startsWith('calendar.')) {
    addSpecific('google-calendar');
    addSpecific('calendar');
  }
  if (subs.includes('meet') || host.startsWith('meet.')) {
    addSpecific('google-meet');
    addSpecific('meet');
  }
  if (subs.includes('photos') || host.startsWith('photos.')) {
    addSpecific('google-photos');
    addSpecific('photos');
  }
  if (subs.includes('keep') || host.startsWith('keep.')) {
    addSpecific('google-keep');
    addSpecific('keep');
  }

  addBrand(brand);
  addBrand(brand.replace(/-/g, ''));

  return [...specific, ...brandIds];
}

/**
 * Ordered icon URLs:
 * path/exact curated → Dashboard guesses → Simple guesses → parent brand → DDG → Google → origin.
 */
export function iconCandidatesFor(pageUrl: string): string[] {
  const host = hostnameOf(pageUrl);
  const urls: string[] = [];
  const pushRef = (ref: SiteIconRef | undefined) => {
    if (ref) urls.push(iconUrlForRef(ref));
  };

  // Path-aware Google apps (docs/sheets/slides share docs.google.com)
  pushRef(googleAppIconFromPath(pageUrl));

  const exact = host ? lookupExactSiteIcon(host) : undefined;
  if (exact) pushRef(exact);

  if (host) {
    const guesses = guessIconIds(host);
    // Prefer Dashboard Icons for product apps, then Simple Icons
    for (const id of guesses) {
      urls.push(dashboardIconsUrl(id));
    }
    for (const id of guesses) {
      urls.push(simpleIconsUrl(id));
    }

    // Parent brand (e.g. google.com) only after product-specific Dashboard/Simple attempts
    pushRef(lookupParentSiteIcon(host));

    urls.push(duckDuckGoIconUrl(host));
    urls.push(googleFaviconUrl(host));
  }

  try {
    urls.push(`${new URL(pageUrl).origin}/favicon.ico`);
  } catch {
    // ignore
  }

  return [...new Set(urls.filter(Boolean))];
}
