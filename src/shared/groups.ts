import type { Shortcut, ShortcutGroup } from './types';

/** Distinct default accents so multiple groups are easy to tell apart. */
export const GROUP_ACCENT_PALETTE = [
  '#536a49', // sage
  '#3d6b8a', // steel blue
  '#8a5a3c', // terracotta
  '#6b4f8a', // plum
  '#2f6f62', // teal
  '#8a6b2f', // ochre
  '#6a3d4f', // wine
  '#4a6b3d', // olive
  '#3d5a8a', // indigo
  '#8a4a4a', // brick
] as const;

const HEX_COLOR = /^#([0-9a-f]{6}|[0-9a-f]{3})$/i;

export function isGroupAccentColor(value: string): boolean {
  return HEX_COLOR.test(value.trim());
}

export function normalizeGroupAccentColor(
  value: unknown,
  fallback: string = GROUP_ACCENT_PALETTE[0],
): string {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  if (!isGroupAccentColor(trimmed)) return fallback;
  if (trimmed.length === 4) {
    const [, r, g, b] = trimmed;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return trimmed.toLowerCase();
}

/** Next palette color that is least used among existing groups. */
export function nextGroupAccent(existing: ShortcutGroup[]): string {
  const counts = new Map<string, number>();
  for (const color of GROUP_ACCENT_PALETTE) counts.set(color, 0);
  for (const g of existing) {
    const c = normalizeGroupAccentColor(g.accentColor);
    counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  let best = GROUP_ACCENT_PALETTE[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const color of GROUP_ACCENT_PALETTE) {
    const n = counts.get(color) ?? 0;
    if (n < bestCount) {
      best = color;
      bestCount = n;
    }
  }
  return best;
}

export function createGroupId(): string {
  return `grp-${crypto.randomUUID()}`;
}

export function newGroup(
  title = 'New group',
  options: { accentColor?: string; existing?: ShortcutGroup[] } = {},
): ShortcutGroup {
  const existing = options.existing ?? [];
  return {
    id: createGroupId(),
    title: title.trim() || 'New group',
    shortcutIds: [],
    accentColor: normalizeGroupAccentColor(
      options.accentColor,
      nextGroupAccent(existing),
    ),
  };
}

/** Ids of shortcuts that belong to any group. */
export function groupedShortcutIds(groups: ShortcutGroup[]): Set<string> {
  const ids = new Set<string>();
  for (const g of groups) {
    for (const id of g.shortcutIds) ids.add(id);
  }
  return ids;
}

/** Build a valid home order: root shortcuts + groups; drop unknowns; append missing. */
export function normalizeHomeOrder(
  homeOrder: string[],
  shortcuts: Shortcut[],
  groups: ShortcutGroup[],
): string[] {
  const shortcutIds = new Set(shortcuts.map((s) => s.id));
  const groupIds = new Set(groups.map((g) => g.id));
  const inGroup = groupedShortcutIds(groups);

  const seen = new Set<string>();
  const order: string[] = [];
  for (const id of homeOrder) {
    if (seen.has(id)) continue;
    if (groupIds.has(id)) {
      order.push(id);
      seen.add(id);
    } else if (shortcutIds.has(id) && !inGroup.has(id)) {
      order.push(id);
      seen.add(id);
    }
  }

  for (const g of groups) {
    if (!seen.has(g.id)) {
      order.push(g.id);
      seen.add(g.id);
    }
  }
  for (const s of shortcuts) {
    if (!inGroup.has(s.id) && !seen.has(s.id)) {
      order.push(s.id);
      seen.add(s.id);
    }
  }
  return order;
}

export function shortcutsInGroup(
  group: ShortcutGroup,
  shortcuts: Shortcut[],
): Shortcut[] {
  const byId = new Map(shortcuts.map((s) => [s.id, s]));
  return group.shortcutIds
    .map((id) => byId.get(id))
    .filter((s): s is Shortcut => Boolean(s));
}

export function addShortcutToGroup(
  groups: ShortcutGroup[],
  homeOrder: string[],
  groupId: string,
  shortcutId: string,
): { groups: ShortcutGroup[]; homeOrder: string[] } {
  const nextGroups = groups.map((g) => {
    const without = g.shortcutIds.filter((id) => id !== shortcutId);
    if (g.id !== groupId) return { ...g, shortcutIds: without };
    return { ...g, shortcutIds: [...without, shortcutId] };
  });
  return {
    groups: nextGroups,
    homeOrder: homeOrder.filter((id) => id !== shortcutId),
  };
}

export function removeShortcutFromGroup(
  groups: ShortcutGroup[],
  homeOrder: string[],
  groupId: string,
  shortcutId: string,
): { groups: ShortcutGroup[]; homeOrder: string[] } {
  const nextGroups = groups.map((g) =>
    g.id === groupId
      ? { ...g, shortcutIds: g.shortcutIds.filter((id) => id !== shortcutId) }
      : g,
  );
  const order = homeOrder.includes(shortcutId)
    ? homeOrder
    : [...homeOrder, shortcutId];
  return { groups: nextGroups, homeOrder: order };
}

/** Delete group and return its shortcuts to the home grid (after the group’s slot). */
export function deleteGroup(
  groups: ShortcutGroup[],
  homeOrder: string[],
  groupId: string,
): { groups: ShortcutGroup[]; homeOrder: string[] } {
  const group = groups.find((g) => g.id === groupId);
  const nextGroups = groups.filter((g) => g.id !== groupId);
  if (!group) return { groups: nextGroups, homeOrder };

  const idx = homeOrder.indexOf(groupId);
  const without = homeOrder.filter((id) => id !== groupId);
  if (idx < 0) {
    return { groups: nextGroups, homeOrder: [...without, ...group.shortcutIds] };
  }
  const next = [...without];
  next.splice(idx, 0, ...group.shortcutIds);
  return { groups: nextGroups, homeOrder: next };
}
