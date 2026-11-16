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

/** Folder of shortcuts on the home grid. */
export type ShortcutGroup = {
  id: string;
  title: string;
  /** Ordered shortcut ids contained in this group. */
  shortcutIds: string[];
  /** Hex accent used for the group border / sheet chrome. */
  accentColor: string;
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
  /** Folders that hold shortcuts (membership via shortcutIds). */
  groups: ShortcutGroup[];
  /**
   * Top-level grid order: shortcut ids and group ids.
   * Shortcuts listed in a group are omitted here.
   */
  homeOrder: string[];
  /** Home ids pinned to the front of the grid (subset of homeOrder). */
  pinnedHomeIds: string[];
  /** Home ids hidden from the grid (still kept; visible while editing). */
  hiddenHomeIds: string[];
  /** One sticky note on the new tab (synced with Safe backup). */
  quickNote: string;
  branding: Branding;
  /** Opt-in encrypted backup to the meta helper. */
  vaultEnabled: boolean;
  /** SHA-256 hex sync id derived from the recovery key (public). */
  vaultSyncId: string;
  /** Epoch ms of last successful vault upload from this device. */
  vaultUpdatedAt: number;
  /** True after the recovery key was downloaded/acknowledged — never show it again. */
  vaultKeySaved: boolean;
};
