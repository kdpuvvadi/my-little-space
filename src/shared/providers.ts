import { DEFAULT_PROVIDERS } from './defaults';
import type { SearchProvider } from './types';

export function normalizeBang(raw: string): string {
  const cleaned = raw.trim().toLowerCase().replace(/^!+/, '').replace(/[^a-z0-9]/g, '');
  return cleaned ? `!${cleaned}` : '';
}

export function createProviderId(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 24);
  return `p-${slug || 'custom'}-${crypto.randomUUID().slice(0, 8)}`;
}

export function normalizeProvider(raw: unknown, index: number): SearchProvider | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  const name = typeof obj.name === 'string' ? obj.name.trim() : '';
  const searchUrl = typeof obj.searchUrl === 'string' ? obj.searchUrl.trim() : '';
  if (!name || !searchUrl || !searchUrl.includes('{q}')) return null;

  const bang = normalizeBang(typeof obj.bang === 'string' ? obj.bang : '');
  if (!bang) return null;

  const id =
    typeof obj.id === 'string' && obj.id.trim()
      ? obj.id.trim()
      : `p-${index}-${Date.now().toString(36)}`;

  return { id, name, bang, searchUrl };
}

export function normalizeProviders(raw: unknown): SearchProvider[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return DEFAULT_PROVIDERS.map((p) => ({ ...p }));
  }

  const list = raw
    .map((item, i) => normalizeProvider(item, i))
    .filter((p): p is SearchProvider => p !== null);

  if (!list.length) return DEFAULT_PROVIDERS.map((p) => ({ ...p }));

  // Deduplicate bangs — keep first occurrence.
  const seenBangs = new Set<string>();
  const seenIds = new Set<string>();
  const unique: SearchProvider[] = [];
  for (const provider of list) {
    const bangKey = provider.bang.toLowerCase();
    if (seenBangs.has(bangKey) || seenIds.has(provider.id)) continue;
    seenBangs.add(bangKey);
    seenIds.add(provider.id);
    unique.push(provider);
  }
  return unique.length ? unique : DEFAULT_PROVIDERS.map((p) => ({ ...p }));
}

export function uniqueBang(existing: SearchProvider[], preferred = 'c'): string {
  const used = new Set(existing.map((p) => p.bang.toLowerCase()));
  if (!used.has(`!${preferred}`)) return `!${preferred}`;
  for (let i = 2; i < 100; i++) {
    const bang = `!${preferred}${i}`;
    if (!used.has(bang)) return bang;
  }
  return `!c${crypto.randomUUID().slice(0, 4)}`;
}

export function newCustomProvider(existing: SearchProvider[] = []): SearchProvider {
  return {
    id: createProviderId('custom'),
    name: 'Custom',
    bang: uniqueBang(existing, 'c'),
    searchUrl: 'https://example.com/search?q={q}',
  };
}
