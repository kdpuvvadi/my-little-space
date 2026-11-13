import { normalizeHomeOrder, shortcutsInGroup } from '../../shared/groups';
import {
  iconCandidatesFor,
  markIconUrlFailed,
  resolveShortcutIconUrl,
} from '../../shared/siteIcons';
import { resolveShortcutTitle } from '../../shared/siteTitles';
import type { Settings, Shortcut, ShortcutGroup } from '../../shared/types';
import { closeSvg, plusSvg } from './icons';

const HOLD_MS = 180;
const MOVE_CANCEL_PX = 10;
const DROP_ON_GROUP_RATIO = 0.42;

export type ShortcutsGridApi = {
  root: HTMLElement;
  setSettings: (settings: Settings, editing: boolean) => void;
  setUpdateBusy: (busy: boolean) => void;
};

export function createShortcutsGrid(options: {
  onAdd: () => void;
  onAddGroup: () => void;
  onBeginEdit: () => void;
  onSaveEdit: () => void | Promise<void>;
  onCancelEdit: () => void;
  onUpdateMeta: () => void | Promise<void>;
  onEditShortcut: (shortcut: Shortcut) => void;
  onDeleteShortcut: (id: string) => void;
  onRenameGroup: (groupId: string, title: string) => void;
  onDeleteGroup: (groupId: string) => void;
  onReorderHome: (orderedIds: string[]) => void;
  onDropOnGroup: (groupId: string, shortcutId: string) => void;
  onRemoveFromGroup: (groupId: string, shortcutId: string) => void;
}): ShortcutsGridApi {
  let settings: Settings | null = null;
  let editing = false;
  let openGroupId: string | null = null;

  const root = document.createElement('section');
  root.className = 'shortcuts-section';
  root.innerHTML = `
    <div class="shortcuts-header">
      <h2 class="shortcuts-title"></h2>
      <div class="shortcuts-header-actions">
        <button type="button" class="edit-btn update-meta-btn hidden" title="Refresh names and icons for shortcuts older than 30 days">
          Update
        </button>
        <button type="button" class="edit-btn cancel-btn hidden">Cancel</button>
        <button type="button" class="edit-btn primary-btn"></button>
      </div>
    </div>
    <div class="shortcuts-grid"></div>
    <div class="group-overlay" id="group-overlay" hidden>
      <div class="group-overlay-backdrop" data-close="1"></div>
      <div class="group-sheet" role="dialog" aria-modal="true" aria-labelledby="group-sheet-title" tabindex="-1">
        <div class="group-sheet-header">
          <h3 id="group-sheet-title" class="group-sheet-title"></h3>
          <button type="button" class="icon-btn group-sheet-close" data-close="1" title="Close" aria-label="Close">
            ${closeSvg}
          </button>
        </div>
        <div class="group-sheet-grid"></div>
        <p class="group-sheet-empty hidden">No shortcuts in this group yet. Drag icons onto it while editing.</p>
      </div>
    </div>
  `;

  const titleEl = root.querySelector('.shortcuts-title') as HTMLHeadingElement;
  const primaryBtn = root.querySelector('.primary-btn') as HTMLButtonElement;
  const cancelBtn = root.querySelector('.cancel-btn') as HTMLButtonElement;
  const updateBtn = root.querySelector('.update-meta-btn') as HTMLButtonElement;
  const grid = root.querySelector('.shortcuts-grid') as HTMLDivElement;
  const overlay = root.querySelector('#group-overlay') as HTMLElement;
  const sheet = overlay.querySelector('.group-sheet') as HTMLElement;
  const sheetTitle = overlay.querySelector('#group-sheet-title') as HTMLElement;
  const sheetGrid = overlay.querySelector('.group-sheet-grid') as HTMLElement;
  const sheetEmpty = overlay.querySelector('.group-sheet-empty') as HTMLElement;

  primaryBtn.addEventListener('click', () => {
    if (editing) void options.onSaveEdit();
    else options.onBeginEdit();
  });
  cancelBtn.addEventListener('click', () => options.onCancelEdit());
  updateBtn.addEventListener('click', () => {
    if (updateBtn.disabled) return;
    void options.onUpdateMeta();
  });

  overlay.querySelectorAll('[data-close]').forEach((el) => {
    el.addEventListener('click', () => closeGroupSheet());
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && openGroupId) {
      e.preventDefault();
      closeGroupSheet();
    }
  });

  function shortcutById(id: string): Shortcut | undefined {
    return settings?.shortcuts.find((s) => s.id === id);
  }

  function groupById(id: string): ShortcutGroup | undefined {
    return settings?.groups.find((g) => g.id === id);
  }

  function iconSrc(sc: Shortcut): { primary: string; fallbacks: string[] } {
    const candidates = iconCandidatesFor(sc.url);
    const primary =
      sc.iconUrl.trim() || resolveShortcutIconUrl(sc.url, sc.iconUrl);
    const fallbacks = sc.iconCustom
      ? []
      : candidates.filter((u) => u !== primary);
    return { primary, fallbacks };
  }

  function shortcutTileInner(sc: Shortcut): string {
    const title = resolveShortcutTitle(sc.url, sc.title);
    const { primary, fallbacks } = iconSrc(sc);
    const fallbackAttr = fallbacks.length
      ? ` data-fallbacks="${fallbacks.map(escapeAttr).join('|')}"`
      : '';
    const letter = escapeAttr(title.slice(0, 1).toUpperCase());
    return `
      <span class="shortcut-letter" aria-hidden="true">${letter}</span>
      ${
        primary
          ? `<img src="${escapeAttr(primary)}"${fallbackAttr} alt="" decoding="async" referrerpolicy="no-referrer" draggable="false" />`
          : ''
      }`;
  }

  function groupPreviewHtml(group: ShortcutGroup): string {
    const kids = shortcutsInGroup(group, settings!.shortcuts).slice(0, 4);
    if (!kids.length) {
      return `<span class="group-preview-empty" aria-hidden="true"></span>`;
    }
    return kids
      .map((sc) => {
        const { primary } = iconSrc(sc);
        const letter = escapeAttr(
          resolveShortcutTitle(sc.url, sc.title).slice(0, 1).toUpperCase(),
        );
        if (primary) {
          return `<span class="group-preview-cell"><img src="${escapeAttr(primary)}" alt="" decoding="async" referrerpolicy="no-referrer" draggable="false" /><span class="group-preview-letter">${letter}</span></span>`;
        }
        return `<span class="group-preview-cell"><span class="group-preview-letter is-solo">${letter}</span></span>`;
      })
      .join('');
  }

  function wireIconFallbacks(scope: ParentNode): void {
    scope.querySelectorAll<HTMLImageElement>('.shortcut-tile img, .group-preview-cell img, .group-sheet-grid img').forEach((img) => {
      const reveal = () => {
        img.classList.add('is-ready');
        img.parentElement?.classList.add('has-image');
      };
      if (img.complete && img.naturalWidth > 0) reveal();
      else img.addEventListener('load', reveal, { once: true });

      img.addEventListener('error', () => {
        markIconUrlFailed(img.currentSrc || img.src);
        const rest = (img.dataset.fallbacks || '').split('|').filter(Boolean);
        if (!rest.length) {
          img.remove();
          return;
        }
        const [next, ...more] = rest;
        img.dataset.fallbacks = more.join('|');
        img.classList.remove('is-ready');
        img.src = next;
      });
    });
  }

  function renderShortcutItem(sc: Shortcut): string {
    const title = resolveShortcutTitle(sc.url, sc.title);
    return `
      <div class="shortcut-item ${editing ? 'editing' : ''}" data-id="${sc.id}" data-kind="shortcut">
        <a class="shortcut-tile" href="${escapeAttr(sc.url)}" ${editing ? 'tabindex="-1"' : ''}>
          ${shortcutTileInner(sc)}
        </a>
        <div class="shortcut-label" title="${escapeAttr(title)}">${escapeAttr(title)}</div>
        <div class="shortcut-actions">
          <button type="button" class="icon-btn edit" title="Edit" data-action="edit">✎</button>
          <button type="button" class="icon-btn danger" title="Delete" data-action="delete">×</button>
        </div>
      </div>`;
  }

  function renderGroupItem(group: ShortcutGroup): string {
    const count = shortcutsInGroup(group, settings!.shortcuts).length;
    return `
      <div class="shortcut-item group-item ${editing ? 'editing' : ''}" data-id="${group.id}" data-kind="group">
        <button type="button" class="shortcut-tile group-tile" aria-label="${escapeAttr(group.title)} group">
          <span class="group-preview">${groupPreviewHtml(group)}</span>
        </button>
        <div class="shortcut-label" title="${escapeAttr(group.title)}">${escapeAttr(group.title)}</div>
        <div class="shortcut-actions">
          <button type="button" class="icon-btn edit" title="Rename" data-action="rename-group">✎</button>
          <button type="button" class="icon-btn danger" title="Delete group" data-action="delete-group">×</button>
        </div>
        <span class="group-count ${count ? '' : 'hidden'}">${count}</span>
      </div>`;
  }

  function render(): void {
    if (!settings) return;
    const { branding, homeOrder, shortcuts, groups } = settings;
    titleEl.textContent = branding.shortcutsTitle;
    primaryBtn.textContent = editing ? 'Save' : branding.editLabel;
    primaryBtn.setAttribute('aria-pressed', String(editing));
    cancelBtn.classList.toggle('hidden', !editing);
    updateBtn.classList.toggle('hidden', !editing);
    grid.classList.toggle('is-editing', editing);

    const order = normalizeHomeOrder(homeOrder, shortcuts, groups);
    const parts: string[] = [];
    for (const id of order) {
      const group = groups.find((g) => g.id === id);
      if (group) {
        parts.push(renderGroupItem(group));
        continue;
      }
      const sc = shortcuts.find((s) => s.id === id);
      if (sc) parts.push(renderShortcutItem(sc));
    }

    const addTiles = editing
      ? `
      <div class="shortcut-item add-tile" data-add="1">
        <button type="button" class="shortcut-tile add-shortcut" aria-label="${branding.addShortcutLabel}">
          ${plusSvg}
        </button>
        <div class="shortcut-label">${branding.addShortcutLabel}</div>
      </div>
      <div class="shortcut-item add-tile" data-add-group="1">
        <button type="button" class="shortcut-tile add-group" aria-label="Add group">
          ${plusSvg}
          <span class="add-group-mark" aria-hidden="true"></span>
        </button>
        <div class="shortcut-label">Add group</div>
      </div>`
      : '';

    grid.innerHTML = parts.join('') + addTiles;
    wireIconFallbacks(grid);

    grid.querySelector('.add-shortcut')?.addEventListener('click', () => options.onAdd());
    grid.querySelector('.add-group')?.addEventListener('click', () => options.onAddGroup());

    grid.querySelectorAll<HTMLElement>('.shortcut-item[data-id]').forEach((item) => {
      const id = item.dataset.id!;
      const kind = item.dataset.kind;

      if (kind === 'group') {
        const group = groupById(id);
        if (!group) return;

        item.querySelector('[data-action="rename-group"]')?.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const next = window.prompt('Group name', group.title);
          if (next === null) return;
          const trimmed = next.trim();
          if (!trimmed || trimmed === group.title) return;
          options.onRenameGroup(id, trimmed);
        });
        item.querySelector('[data-action="delete-group"]')?.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!window.confirm(`Delete group “${group.title}”? Shortcuts return to the home grid.`)) {
            return;
          }
          if (openGroupId === id) closeGroupSheet(true);
          options.onDeleteGroup(id);
        });

        const tile = item.querySelector('.group-tile');
        tile?.addEventListener('click', (e) => {
          e.preventDefault();
          if (editing) {
            openGroupSheet(id);
            return;
          }
          openGroupSheet(id);
        });

        if (editing) bindLiftDrag(item);
        return;
      }

      const shortcut = shortcutById(id);
      if (!shortcut) return;

      item.querySelector('[data-action="edit"]')?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        options.onEditShortcut(shortcut);
      });
      item.querySelector('[data-action="delete"]')?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        options.onDeleteShortcut(id);
      });

      if (editing) {
        item.querySelector('.shortcut-tile')?.addEventListener('click', (e) => {
          e.preventDefault();
        });
        bindLiftDrag(item);
      }
    });

    if (openGroupId) {
      if (groupById(openGroupId)) fillGroupSheet(openGroupId);
      else closeGroupSheet(true);
    }
  }

  function fillGroupSheet(groupId: string): void {
    if (!settings) return;
    const group = groupById(groupId);
    if (!group) return;
    sheetTitle.textContent = group.title;
    const kids = shortcutsInGroup(group, settings.shortcuts);
    sheetEmpty.classList.toggle('hidden', kids.length > 0);
    sheetGrid.innerHTML = kids
      .map((sc) => {
        const title = resolveShortcutTitle(sc.url, sc.title);
        return `
        <div class="shortcut-item group-member ${editing ? 'editing' : ''}" data-id="${sc.id}">
          <a class="shortcut-tile" href="${escapeAttr(sc.url)}" ${editing ? 'tabindex="-1"' : ''}>
            ${shortcutTileInner(sc)}
          </a>
          <div class="shortcut-label" title="${escapeAttr(title)}">${escapeAttr(title)}</div>
          ${
            editing
              ? `<div class="shortcut-actions">
                  <button type="button" class="icon-btn edit" title="Edit" data-action="edit">✎</button>
                  <button type="button" class="icon-btn danger" title="Remove from group" data-action="ungroup">↗</button>
                </div>`
              : ''
          }
        </div>`;
      })
      .join('');
    wireIconFallbacks(sheetGrid);

    sheetGrid.querySelectorAll<HTMLElement>('.group-member').forEach((item) => {
      const sid = item.dataset.id!;
      const sc = shortcutById(sid);
      if (!sc) return;
      item.querySelector('[data-action="edit"]')?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        options.onEditShortcut(sc);
      });
      item.querySelector('[data-action="ungroup"]')?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        options.onRemoveFromGroup(groupId, sid);
      });
      if (editing) {
        item.querySelector('.shortcut-tile')?.addEventListener('click', (e) => {
          e.preventDefault();
        });
      }
    });
  }

  function openGroupSheet(groupId: string): void {
    openGroupId = groupId;
    fillGroupSheet(groupId);
    overlay.hidden = false;
    // Force reflow so CSS transitions run.
    void overlay.offsetWidth;
    overlay.classList.add('is-open');
    sheet.focus();
  }

  function closeGroupSheet(immediate = false): void {
    if (!openGroupId && overlay.hidden) return;
    const finish = () => {
      overlay.hidden = true;
      overlay.classList.remove('is-open', 'is-closing');
      sheetGrid.innerHTML = '';
      openGroupId = null;
    };

    if (immediate || !overlay.classList.contains('is-open')) {
      finish();
      return;
    }

    overlay.classList.add('is-closing');
    overlay.classList.remove('is-open');
    const onEnd = (e: TransitionEvent) => {
      if (e.target !== sheet || e.propertyName !== 'transform') return;
      sheet.removeEventListener('transitionend', onEnd);
      finish();
    };
    sheet.addEventListener('transitionend', onEnd);
    window.setTimeout(finish, 420);
  }

  function clearGroupDropHighlights(): void {
    grid.querySelectorAll('.is-drop-target').forEach((el) => {
      el.classList.remove('is-drop-target');
    });
  }

  function groupUnderPoint(
    clientX: number,
    clientY: number,
    excludeId: string,
  ): HTMLElement | null {
    const groups = [
      ...grid.querySelectorAll<HTMLElement>('.shortcut-item[data-kind="group"]'),
    ].filter((el) => el.dataset.id !== excludeId);

    let best: HTMLElement | null = null;
    let bestDist = Infinity;
    for (const el of groups) {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dist = Math.hypot(clientX - cx, clientY - cy);
      const hit =
        dist < Math.min(r.width, r.height) * DROP_ON_GROUP_RATIO ||
        (clientX >= r.left &&
          clientX <= r.right &&
          clientY >= r.top &&
          clientY <= r.bottom);
      if (hit && dist < bestDist) {
        bestDist = dist;
        best = el;
      }
    }
    return best;
  }

  function bindLiftDrag(item: HTMLElement): void {
    let holdTimer: ReturnType<typeof setTimeout> | null = null;
    let pointerId: number | null = null;
    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let lastY = 0;
    let offsetX = 0;
    let offsetY = 0;
    let ghost: HTMLElement | null = null;
    let lifted = false;
    let moved = false;
    let lastDropIndex = -1;
    let dropGroupEl: HTMLElement | null = null;
    let raf = 0;

    const kind = item.dataset.kind;
    const itemId = item.dataset.id!;

    const clearHold = () => {
      if (holdTimer) {
        clearTimeout(holdTimer);
        holdTimer = null;
      }
    };

    const onDocMove = (e: PointerEvent) => {
      if (pointerId !== e.pointerId) return;
      lastX = e.clientX;
      lastY = e.clientY;

      if (!lifted) {
        if (Math.hypot(lastX - startX, lastY - startY) > MOVE_CANCEL_PX) {
          clearHold();
          detachDocListeners();
          pointerId = null;
        }
        return;
      }

      e.preventDefault();
      if (!raf) {
        raf = requestAnimationFrame(() => {
          raf = 0;
          moveGhost(lastX, lastY);
          updateDropTarget(lastX, lastY);
        });
      }
    };

    const onDocUp = (e: PointerEvent) => {
      if (pointerId !== e.pointerId) return;
      const wasLifted = lifted;
      const targetGroupId = dropGroupEl?.dataset.id ?? null;
      cleanup();
      if (!wasLifted) return;

      if (kind === 'shortcut' && targetGroupId) {
        options.onDropOnGroup(targetGroupId, itemId);
        return;
      }
      persistOrderFromDom();
    };

    const detachDocListeners = () => {
      document.removeEventListener('pointermove', onDocMove);
      document.removeEventListener('pointerup', onDocUp);
      document.removeEventListener('pointercancel', onDocUp);
    };

    const cleanup = () => {
      clearHold();
      detachDocListeners();
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
      pointerId = null;
      if (ghost) {
        ghost.remove();
        ghost = null;
      }
      item.classList.remove('is-placeholder', 'is-lifting');
      grid.classList.remove('is-reordering');
      clearGroupDropHighlights();
      dropGroupEl = null;
      lifted = false;
      moved = false;
      lastDropIndex = -1;
    };

    const moveGhost = (clientX: number, clientY: number) => {
      if (!ghost) return;
      ghost.style.transform = `translate3d(${clientX - offsetX}px, ${clientY - offsetY}px, 0) scale(1.12)`;
    };

    const dropIndexForPoint = (clientX: number, clientY: number): number => {
      const slots = [
        ...grid.querySelectorAll<HTMLElement>(':scope > .shortcut-item[data-id]'),
      ].filter((el) => el !== item);
      if (!slots.length) return 0;

      let best = slots.length;
      let bestDist = Infinity;
      for (let i = 0; i < slots.length; i++) {
        const r = slots[i].getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dist = (clientX - cx) ** 2 + (clientY - cy) ** 2;
        if (dist < bestDist) {
          bestDist = dist;
          best =
            clientX < cx ||
            (Math.abs(clientX - cx) < r.width * 0.15 && clientY < cy)
              ? i
              : i + 1;
        }
      }
      return Math.max(0, Math.min(best, slots.length));
    };

    const movePlaceholderToPointer = (clientX: number, clientY: number) => {
      const index = dropIndexForPoint(clientX, clientY);
      if (index === lastDropIndex) return;
      lastDropIndex = index;

      const slots = [
        ...grid.querySelectorAll<HTMLElement>(':scope > .shortcut-item[data-id]'),
      ].filter((el) => el !== item);
      const ref = slots[index] ?? null;
      if (ref) grid.insertBefore(item, ref);
      else {
        const add = grid.querySelector('.add-tile');
        if (add) grid.insertBefore(item, add);
        else grid.append(item);
      }
    };

    const updateDropTarget = (clientX: number, clientY: number) => {
      clearGroupDropHighlights();
      dropGroupEl = null;

      if (kind === 'shortcut') {
        const over = groupUnderPoint(clientX, clientY, itemId);
        if (over) {
          dropGroupEl = over;
          over.classList.add('is-drop-target');
          return;
        }
      }
      movePlaceholderToPointer(clientX, clientY);
    };

    const lift = (clientX: number, clientY: number) => {
      if (lifted) return;
      lifted = true;
      moved = true;
      grid.classList.add('is-reordering');
      item.classList.add('is-placeholder', 'is-lifting');

      const rect = item.getBoundingClientRect();
      offsetX = clientX - rect.left;
      offsetY = clientY - rect.top;
      lastDropIndex = [
        ...grid.querySelectorAll<HTMLElement>(':scope > .shortcut-item[data-id]'),
      ].indexOf(item);

      ghost = item.cloneNode(true) as HTMLElement;
      ghost.classList.remove('is-placeholder', 'is-lifting', 'is-drop-target');
      ghost.classList.add('shortcut-ghost');
      ghost.removeAttribute('data-id');
      ghost.querySelectorAll('[data-action]').forEach((btn) => btn.remove());
      ghost.style.width = `${rect.width}px`;
      ghost.style.height = `${rect.height}px`;
      document.body.append(ghost);
      moveGhost(clientX, clientY);

      if (navigator.vibrate) {
        try {
          navigator.vibrate(12);
        } catch {
          // ignore
        }
      }
    };

    item.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest('.shortcut-actions')) return;

      e.preventDefault();
      pointerId = e.pointerId;
      startX = lastX = e.clientX;
      startY = lastY = e.clientY;
      lifted = false;
      moved = false;
      lastDropIndex = -1;
      dropGroupEl = null;

      document.addEventListener('pointermove', onDocMove, { passive: false });
      document.addEventListener('pointerup', onDocUp);
      document.addEventListener('pointercancel', onDocUp);

      holdTimer = setTimeout(() => {
        holdTimer = null;
        lift(lastX, lastY);
      }, HOLD_MS);
    });

    item.addEventListener(
      'click',
      (e) => {
        if (moved) {
          e.preventDefault();
          e.stopPropagation();
        }
      },
      true,
    );
  }

  function persistOrderFromDom(): void {
    const orderedIds = [
      ...grid.querySelectorAll<HTMLElement>(':scope > .shortcut-item[data-id]'),
    ]
      .map((el) => el.dataset.id)
      .filter((id): id is string => Boolean(id));
    if (!orderedIds.length || !settings) return;
    const current = settings.homeOrder;
    if (
      orderedIds.length === current.length &&
      orderedIds.every((id, i) => id === current[i])
    ) {
      return;
    }
    options.onReorderHome(orderedIds);
  }

  return {
    root,
    setSettings: (next, isEditing) => {
      settings = next;
      editing = isEditing;
      if (!editing && openGroupId) {
        // Keep sheet open in normal view if group still exists.
      }
      render();
    },
    setUpdateBusy: (busy) => {
      updateBtn.disabled = busy;
      updateBtn.textContent = busy ? 'Updating…' : 'Update';
    },
  };
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
