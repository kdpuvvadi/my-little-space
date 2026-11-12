export type SearchProvider = {
  id: string;
  name: string;
  bang: string;
  searchUrl: string;
};

export type Shortcut = {
  id: string;
  url: string;
  title: string;
  iconUrl: string;
  /** Epoch ms when title/icon were last resolved from helper or local fallback. */
  metaFetchedAt: number;
  /** True when the user set a custom Icon URL — never auto-replaced. */
  iconCustom: boolean;
};

export type Branding = {
  logoUrl: string;
  showLogo: boolean;
  brandName: string;
  eyebrow: string;
  headline: string;
  searchPlaceholder: string;
  shortcutsTitle: string;
  editLabel: string;
  addShortcutLabel: string;
  footerTagline: string;
  customizeLabel: string;
  showDate: boolean;
};

export type NewTabMode = 'builtin' | 'customUrl';

export type ThemeMode = 'light' | 'dark' | 'system';

export type Settings = {
  mode: NewTabMode;
  customUrl: string;
  theme: ThemeMode;
  /** Site-meta helper base URL (empty = local resolve only). */
  metaServiceUrl: string;
  providers: SearchProvider[];
  defaultProviderId: string;
  enabledProviderIds: string[];
  selectedProviderId: string;
  shortcuts: Shortcut[];
  branding: Branding;
};
