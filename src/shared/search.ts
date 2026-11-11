import type { SearchProvider, Settings } from './types';

const BANG_RE = /^!([a-z0-9]+)\s+(.*)$/i;

export function getProviders(settings: Settings): SearchProvider[] {
  return settings.providers?.length ? settings.providers : [];
}

export function getProviderById(
  settings: Settings,
  id: string,
): SearchProvider | undefined {
  return getProviders(settings).find((p) => p.id === id);
}

export function getEnabledProviders(settings: Settings): SearchProvider[] {
  const enabled = new Set(settings.enabledProviderIds);
  return getProviders(settings).filter((p) => enabled.has(p.id));
}

export function getProviderByBang(
  settings: Settings,
  bang: string,
): SearchProvider | undefined {
  const normalized = bang.startsWith('!') ? bang.toLowerCase() : `!${bang.toLowerCase()}`;
  return getProviders(settings).find((p) => p.bang.toLowerCase() === normalized);
}

export function looksLikeUrl(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed || /\s/.test(trimmed)) return false;
  if (/^(https?:\/\/)/i.test(trimmed)) return true;
  if (/^localhost(:\d+)?(\/.*)?$/i.test(trimmed)) return true;
  return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+\.?(\/.*)?$/i.test(
    trimmed,
  );
}

export function toNavigableUrl(input: string): string {
  const trimmed = input.trim();
  if (/^(https?:\/\/)/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export type ResolvedQuery = {
  url: string;
  provider: SearchProvider | null;
  query: string;
  usedBang: string | null;
};

function fallbackProvider(settings: Settings): SearchProvider {
  return (
    getProviderById(settings, settings.selectedProviderId) ??
    getProviderById(settings, settings.defaultProviderId) ??
    getEnabledProviders(settings)[0] ??
    getProviders(settings)[0]
  );
}

export function resolveQuery(
  input: string,
  settings: Settings,
  selectedProviderId?: string,
): ResolvedQuery {
  const trimmed = input.trim();
  if (!trimmed) {
    return { url: '', provider: fallbackProvider(settings), query: '', usedBang: null };
  }

  const bangMatch = trimmed.match(BANG_RE);
  if (bangMatch) {
    const bangToken = bangMatch[1];
    const rest = bangMatch[2].trim();
    const bangProvider = getProviderByBang(settings, `!${bangToken}`);
    if (bangProvider && rest) {
      if (looksLikeUrl(rest)) {
        return {
          url: toNavigableUrl(rest),
          provider: bangProvider,
          query: rest,
          usedBang: bangProvider.bang,
        };
      }
      return {
        url: bangProvider.searchUrl.replace('{q}', encodeURIComponent(rest)),
        provider: bangProvider,
        query: rest,
        usedBang: bangProvider.bang,
      };
    }
  }

  if (looksLikeUrl(trimmed)) {
    return {
      url: toNavigableUrl(trimmed),
      provider: null,
      query: trimmed,
      usedBang: null,
    };
  }

  const provider =
    getProviderById(settings, selectedProviderId ?? settings.selectedProviderId) ??
    fallbackProvider(settings);

  return {
    url: provider.searchUrl.replace('{q}', encodeURIComponent(trimmed)),
    provider,
    query: trimmed,
    usedBang: null,
  };
}
