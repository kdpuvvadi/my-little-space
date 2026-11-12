import type { Branding, SearchProvider, Settings } from './types';

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

export function createDefaultSettings(): Settings {
  const providers = DEFAULT_PROVIDERS.map((p) => ({ ...p }));
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
    shortcuts: [],
    branding: { ...DEFAULT_BRANDING },
  };
}
