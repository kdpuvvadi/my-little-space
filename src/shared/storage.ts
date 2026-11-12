import { createDefaultSettings, DEFAULT_BRANDING } from './defaults';
import { normalizeProviders } from './providers';
import { resolveShortcutTitle } from './siteTitles';
import type { Branding, Settings, Shortcut } from './types';

const STORAGE_KEY = 'mlsSettings';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function mergeBranding(raw: unknown): Branding {
  const base = { ...DEFAULT_BRANDING };
  if (!isObject(raw)) return base;
  return {
    logoUrl: typeof raw.logoUrl === 'string' ? raw.logoUrl : base.logoUrl,
    showLogo: typeof raw.showLogo === 'boolean' ? raw.showLogo : base.showLogo,
    brandName: typeof raw.brandName === 'string' ? raw.brandName : base.brandName,
    eyebrow: typeof raw.eyebrow === 'string' ? raw.eyebrow : base.eyebrow,
    headline: typeof raw.headline === 'string' ? raw.headline : base.headline,
    searchPlaceholder:
      typeof raw.searchPlaceholder === 'string' ? raw.searchPlaceholder : base.searchPlaceholder,
    shortcutsTitle:
      typeof raw.shortcutsTitle === 'string' ? raw.shortcutsTitle : base.shortcutsTitle,
    editLabel: typeof raw.editLabel === 'string' ? raw.editLabel : base.editLabel,
    addShortcutLabel:
      typeof raw.addShortcutLabel === 'string' ? raw.addShortcutLabel : base.addShortcutLabel,
    footerTagline:
      typeof raw.footerTagline === 'string' ? raw.footerTagline : base.footerTagline,
    customizeLabel:
      typeof raw.customizeLabel === 'string' ? raw.customizeLabel : base.customizeLabel,
    showDate: typeof raw.showDate === 'boolean' ? raw.showDate : base.showDate,
  };
}

function normalizeShortcut(raw: unknown, index: number): Shortcut | null {
  if (!isObject(raw)) return null;
  const url = typeof raw.url === 'string' ? raw.url.trim() : '';
  if (!url) return null;
  const storedIcon = typeof raw.iconUrl === 'string' ? raw.iconUrl : '';
  const storedTitle = typeof raw.title === 'string' ? raw.title.trim() : '';
  const metaFetchedAt =
    typeof raw.metaFetchedAt === 'number' && Number.isFinite(raw.metaFetchedAt)
      ? raw.metaFetchedAt
      : 0;
  const iconCustom = raw.iconCustom === true;
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : `sc-${index}-${Date.now()}`,
    url,
    // Upgrade legacy hostname titles (github.com → GitHub).
    title: resolveShortcutTitle(url, storedTitle || url),
    iconUrl: storedIcon,
    metaFetchedAt,
    iconCustom,
  };
}

export function normalizeSettings(raw: unknown): Settings {
  const defaults = createDefaultSettings();
  if (!isObject(raw)) return defaults;

  const providers = normalizeProviders(raw.providers);

  const providerIds = new Set(providers.map((p) => p.id));

  let enabled =
    Array.isArray(raw.enabledProviderIds) &&
    raw.enabledProviderIds.every((id) => typeof id === 'string')
      ? (raw.enabledProviderIds as string[]).filter((id) => providerIds.has(id))
      : defaults.enabledProviderIds.filter((id) => providerIds.has(id));

  if (!enabled.length) {
    enabled = providers.map((p) => p.id);
  }

  const defaultProviderId =
    typeof raw.defaultProviderId === 'string' && enabled.includes(raw.defaultProviderId)
      ? raw.defaultProviderId
      : enabled[0];

  const selectedProviderId =
    typeof raw.selectedProviderId === 'string' && enabled.includes(raw.selectedProviderId)
      ? raw.selectedProviderId
      : defaultProviderId;

  const shortcuts = Array.isArray(raw.shortcuts)
    ? raw.shortcuts
        .map((item, i) => normalizeShortcut(item, i))
        .filter((s): s is Shortcut => s !== null)
    : [];

  const theme =
    raw.theme === 'dark' || raw.theme === 'system' || raw.theme === 'light'
      ? raw.theme
      : defaults.theme;

  return {
    mode: raw.mode === 'customUrl' ? 'customUrl' : 'builtin',
    customUrl: typeof raw.customUrl === 'string' ? raw.customUrl : '',
    theme,
    // Empty / unset → use build default at resolve time; non-empty = custom override.
    metaServiceUrl:
      typeof raw.metaServiceUrl === 'string' ? raw.metaServiceUrl.trim() : '',
    providers,
    defaultProviderId,
    enabledProviderIds: enabled,
    selectedProviderId,
    shortcuts,
    branding: mergeBranding(raw.branding),
  };
}

export async function loadSettings(): Promise<Settings> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    return normalizeSettings(result[STORAGE_KEY]);
  } catch {
    return createDefaultSettings();
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  const normalized = normalizeSettings(settings);
  await chrome.storage.local.set({ [STORAGE_KEY]: normalized });
}

export async function updateSettings(
  patch: Partial<Settings> | ((current: Settings) => Settings),
): Promise<Settings> {
  const current = await loadSettings();
  const next =
    typeof patch === 'function' ? patch(current) : normalizeSettings({ ...current, ...patch });
  await saveSettings(next);
  return next;
}

export function onSettingsChanged(callback: (settings: Settings) => void): () => void {
  const listener = (
    changes: { [key: string]: chrome.storage.StorageChange },
    area: string,
  ) => {
    if (area !== 'local' || !changes[STORAGE_KEY]) return;
    callback(normalizeSettings(changes[STORAGE_KEY].newValue));
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
