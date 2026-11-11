import { parse, stringify } from 'yaml';
import { normalizeSettings } from './storage';
import type { Settings } from './types';

const KNOWN_TOP_KEYS = new Set([
  'mode',
  'customUrl',
  'theme',
  'providers',
  'defaultProviderId',
  'enabledProviderIds',
  'selectedProviderId',
  'shortcuts',
  'branding',
]);

const KNOWN_BRANDING_KEYS = new Set([
  'logoUrl',
  'showLogo',
  'brandName',
  'eyebrow',
  'headline',
  'searchPlaceholder',
  'shortcutsTitle',
  'editLabel',
  'addShortcutLabel',
  'footerTagline',
  'customizeLabel',
  'showDate',
]);

const KNOWN_SHORTCUT_KEYS = new Set(['id', 'url', 'title', 'iconUrl']);
const KNOWN_PROVIDER_KEYS = new Set(['id', 'name', 'bang', 'searchUrl']);

export type YamlImportResult =
  | { ok: true; settings: Settings; warnings: string[] }
  | { ok: false; error: string };

function collectUnknownKeys(
  obj: Record<string, unknown>,
  known: Set<string>,
  path: string,
): string[] {
  return Object.keys(obj)
    .filter((key) => !known.has(key))
    .map((key) => (path ? `${path}.${key}` : key));
}

export function settingsToYaml(settings: Settings): string {
  const payload = {
    mode: settings.mode,
    customUrl: settings.customUrl,
    theme: settings.theme,
    defaultProviderId: settings.defaultProviderId,
    enabledProviderIds: settings.enabledProviderIds,
    selectedProviderId: settings.selectedProviderId,
    providers: settings.providers.map(({ id, name, bang, searchUrl }) => ({
      id,
      name,
      bang,
      searchUrl,
    })),
    branding: settings.branding,
    shortcuts: settings.shortcuts.map(({ id, url, title, iconUrl }) => ({
      id,
      url,
      title,
      iconUrl,
    })),
  };
  return stringify(payload, { lineWidth: 0 });
}

export function yamlToSettings(text: string): YamlImportResult {
  let parsed: unknown;
  try {
    parsed = parse(text);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Invalid YAML',
    };
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { ok: false, error: 'YAML root must be a mapping/object' };
  }

  const root = parsed as Record<string, unknown>;
  const unknown = collectUnknownKeys(root, KNOWN_TOP_KEYS, '');

  if (root.branding && typeof root.branding === 'object' && !Array.isArray(root.branding)) {
    unknown.push(
      ...collectUnknownKeys(
        root.branding as Record<string, unknown>,
        KNOWN_BRANDING_KEYS,
        'branding',
      ),
    );
  }

  if (Array.isArray(root.shortcuts)) {
    root.shortcuts.forEach((item, index) => {
      if (item && typeof item === 'object' && !Array.isArray(item)) {
        unknown.push(
          ...collectUnknownKeys(
            item as Record<string, unknown>,
            KNOWN_SHORTCUT_KEYS,
            `shortcuts[${index}]`,
          ),
        );
      }
    });
  }

  if (Array.isArray(root.providers)) {
    root.providers.forEach((item, index) => {
      if (item && typeof item === 'object' && !Array.isArray(item)) {
        unknown.push(
          ...collectUnknownKeys(
            item as Record<string, unknown>,
            KNOWN_PROVIDER_KEYS,
            `providers[${index}]`,
          ),
        );
      }
    });
  }

  if (unknown.length) {
    return {
      ok: false,
      error: `Unknown fields: ${unknown.join(', ')}`,
    };
  }

  if (root.mode !== undefined && root.mode !== 'builtin' && root.mode !== 'customUrl') {
    return { ok: false, error: 'mode must be "builtin" or "customUrl"' };
  }

  if (
    root.theme !== undefined &&
    root.theme !== 'light' &&
    root.theme !== 'dark' &&
    root.theme !== 'system'
  ) {
    return { ok: false, error: 'theme must be "light", "dark", or "system"' };
  }

  const settings = normalizeSettings(root);

  if (
    root.defaultProviderId !== undefined &&
    typeof root.defaultProviderId === 'string' &&
    !settings.providers.some((p) => p.id === root.defaultProviderId)
  ) {
    return { ok: false, error: 'defaultProviderId does not match any provider' };
  }

  const warnings: string[] = [];
  if (settings.branding.logoUrl.startsWith('data:') && settings.branding.logoUrl.length > 200_000) {
    warnings.push('Logo data URL is very large; storage quota may be exceeded.');
  }

  return { ok: true, settings, warnings };
}

export function downloadYaml(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/yaml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
