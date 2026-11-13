import type { Shortcut, ShortcutGroup } from './types';

export function createGroupId(): string {
  return `grp-${crypto.randomUUID()}`;
}

export function newGroup(title = 'New group'): ShortcutGroup {
  return {
    id: createGroupId(),
    title: title.trim() || 'New group',
    shortcutIds: [],
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
