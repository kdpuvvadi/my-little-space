import { guessPageMeta } from './shortcuts';
import type { Branding, SearchProvider, Settings, Shortcut } from './types';

export const DEFAULT_PROVIDERS: SearchProvider[] = [
  {
    id: 'google',
    name: 'Google',
    bang: '!g',
    searchUrl: 'https://www.google.com/search?q={q}',
  },
  {
    id: 'duckduckgo',
    name: 'DuckDuckGo',
    bang: '!d',
    searchUrl: 'https://duckduckgo.com/?q={q}',
  },
  {
    id: 'bing',
    name: 'Bing',
    bang: '!b',
    searchUrl: 'https://www.bing.com/search?q={q}',
  },
  {
    id: 'wikipedia',
    name: 'Wikipedia',
    bang: '!w',
    searchUrl: 'https://en.wikipedia.org/wiki/Special:Search?search={q}',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    bang: '!yt',
    searchUrl: 'https://www.youtube.com/results?search_query={q}',
  },
];

export const DEFAULT_BRANDING: Branding = {
  logoUrl: '',
  showLogo: true,
  brandName: 'My Little Space',
  eyebrow: 'MAKE ROOM FOR A GOOD DAY',
  headline: 'Where to today?',
  searchPlaceholder: 'Search the web or enter a URL',
  shortcutsTitle: 'YOUR SHORTCUTS',
  editLabel: 'Edit',
  addShortcutLabel: 'Add shortcut',
  footerTagline: 'Less noise. More possibility.',
  customizeLabel: 'Customize',
  showDate: true,
};

/** Popular sites shown on first install and after Reset to default. */
const DEFAULT_SHORTCUT_SEEDS: ReadonlyArray<{ id: string; url: string }> = [
  { id: 'sc-default-youtube', url: 'https://www.youtube.com' },
  { id: 'sc-default-gmail', url: 'https://mail.google.com' },
  { id: 'sc-default-github', url: 'https://github.com' },
  { id: 'sc-default-reddit', url: 'https://www.reddit.com' },
  { id: 'sc-default-wikipedia', url: 'https://en.wikipedia.org' },
  { id: 'sc-default-chatgpt', url: 'https://chatgpt.com' },
  { id: 'sc-default-x', url: 'https://x.com' },
];

export function createDefaultShortcuts(): Shortcut[] {
  return DEFAULT_SHORTCUT_SEEDS.map(({ id, url }) => {
    const meta = guessPageMeta(url);
    return {
      id,
      url,
      title: meta.title,
      iconUrl: meta.iconUrl,
      metaFetchedAt: 0,
      iconCustom: false,
    };
  });
}

export function createDefaultSettings(): Settings {
  const providers = DEFAULT_PROVIDERS.map((p) => ({ ...p }));
  const shortcuts = createDefaultShortcuts();
  return {
    mode: 'builtin',
    customUrl: '',
    theme: 'light',
    // Empty means “use BUILD_META_SERVICE_URL”; set a value to override.
    metaServiceUrl: '',
    providers,
    defaultProviderId: 'google',
    enabledProviderIds: providers.map((p) => p.id),
    selectedProviderId: 'google',
    shortcuts,
    groups: [],
    homeOrder: shortcuts.map((s) => s.id),
    branding: { ...DEFAULT_BRANDING },
    vaultEnabled: false,
    vaultSyncId: '',
    vaultUpdatedAt: 0,
    vaultKeySaved: false,
  };
}
