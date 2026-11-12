import {
  iconCandidatesFor,
  markIconUrlFailed,
  resolveShortcutIconUrl,
} from '../../shared/siteIcons';
import { resolveShortcutTitle } from '../../shared/siteTitles';
import type { Settings, Shortcut } from '../../shared/types';
import { plusSvg } from './icons';

const HOLD_MS = 220;
const MOVE_CANCEL_PX = 8;

export type ShortcutsGridApi = {
  root: HTMLElement;
  setSettings: (settings: Settings, editing: boolean) => void;
  setUpdateBusy: (busy: boolean) => void;
};

export function createShortcutsGrid(options: {
  onAdd: () => void;
  onEditToggle: () => void;
  onUpdateMeta: () => void | Promise<void>;
  onEditShortcut: (shortcut: Shortcut) => void;
  onDeleteShortcut: (id: string) => void;
  onReorder: (orderedIds: string[]) => void | Promise<void>;
}): ShortcutsGridApi {
  let settings: Settings | null = null;
  let editing = false;

  const root = document.createElement('section');
  root.className = 'shortcuts-section';
  root.innerHTML = `
    <div class="shortcuts-header">
      <h2 class="shortcuts-title"></h2>
      <div class="shortcuts-header-actions">
        <button type="button" class="edit-btn update-meta-btn hidden" title="Refresh names and icons for shortcuts older than 30 days">
          Update
        </button>
        <button type="button" class="edit-btn done-btn"></button>
      </div>
    </div>
    <div class="shortcuts-grid"></div>
  `;

  const titleEl = root.querySelector('.shortcuts-title') as HTMLHeadingElement;
  const editBtn = root.querySelector('.done-btn') as HTMLButtonElement;
  const updateBtn = root.querySelector('.update-meta-btn') as HTMLButtonElement;
  const grid = root.querySelector('.shortcuts-grid') as HTMLDivElement;

  editBtn.addEventListener('click', () => options.onEditToggle());
  updateBtn.addEventListener('click', () => {
    if (updateBtn.disabled) return;
    void options.onUpdateMeta();
  });

  function render(): void {
    if (!settings) return;
    const { branding, shortcuts } = settings;
    titleEl.textContent = branding.shortcutsTitle;
    editBtn.textContent = editing ? 'Done' : branding.editLabel;
    editBtn.setAttribute('aria-pressed', String(editing));
    updateBtn.classList.toggle('hidden', !editing);
    grid.classList.toggle('is-editing', editing);

    const items = shortcuts
      .map((sc) => {
        const title = resolveShortcutTitle(sc.url, sc.title);
        const candidates = iconCandidatesFor(sc.url);
        const primary =
          sc.iconUrl.trim() || resolveShortcutIconUrl(sc.url, sc.iconUrl);
        const fallbacks = sc.iconCustom
          ? []
          : candidates.filter((u) => u !== primary);
        const fallbackAttr = fallbacks.length
          ? ` data-fallbacks="${fallbacks.map(escapeAttr).join('|')}"`
          : '';
        const letter = escapeAttr(title.slice(0, 1).toUpperCase());
        return `
      <div class="shortcut-item ${editing ? 'editing' : ''}" data-id="${sc.id}">
        <a class="shortcut-tile" href="${sc.url}" ${editing ? 'tabindex="-1"' : ''}>
          <span class="shortcut-letter" aria-hidden="true">${letter}</span>
          ${
            primary
              ? `<img src="${escapeAttr(primary)}"${fallbackAttr} alt="" decoding="async" referrerpolicy="no-referrer" draggable="false" />`
              : ''
          }
        </a>
        <div class="shortcut-label" title="${escapeAttr(title)}">${escapeAttr(title)}</div>
        <div class="shortcut-actions">
          <button type="button" class="icon-btn edit" title="Edit" data-action="edit">✎</button>
          <button type="button" class="icon-btn danger" title="Delete" data-action="delete">×</button>
        </div>
      </div>`;
      })
      .join('');

    const addTile = editing
      ? `
      <div class="shortcut-item add-tile" data-add="1">
        <button type="button" class="shortcut-tile add-shortcut" aria-label="${branding.addShortcutLabel}">
          ${plusSvg}
        </button>
        <div class="shortcut-label">${branding.addShortcutLabel}</div>
      </div>`
      : '';

    grid.innerHTML = items + addTile;

    grid.querySelectorAll<HTMLImageElement>('.shortcut-tile img').forEach((img) => {
      const reveal = () => img.classList.add('is-ready');
      if (img.complete && img.naturalWidth > 0) {
        reveal();
      } else {
        img.addEventListener('load', reveal, { once: true });
      }

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

    grid.querySelector('.add-shortcut')?.addEventListener('click', () => options.onAdd());

    grid.querySelectorAll('.shortcut-item[data-id]').forEach((el) => {
      const item = el as HTMLElement;
      const id = item.dataset.id!;
      const shortcut = shortcuts.find((s) => s.id === id);
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

    const clearHold = () => {
      if (holdTimer) {
        clearTimeout(holdTimer);
        holdTimer = null;
      }
    };

    const cleanup = () => {
      clearHold();
      if (pointerId !== null) {
        try {
          item.releasePointerCapture(pointerId);
        } catch {
          // ignore
        }
      }
      pointerId = null;
      if (ghost) {
        ghost.remove();
        ghost = null;
      }
      item.classList.remove('is-placeholder', 'is-lifting');
      grid.classList.remove('is-reordering');
      lifted = false;
      moved = false;
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

      ghost = item.cloneNode(true) as HTMLElement;
      ghost.classList.remove('is-placeholder', 'is-lifting');
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

    const moveGhost = (clientX: number, clientY: number) => {
      if (!ghost) return;
      ghost.style.transform = `translate3d(${clientX - offsetX}px, ${clientY - offsetY}px, 0) scale(1.12)`;
    };

    const reorderUnderPointer = (clientX: number, clientY: number) => {
      const el = document.elementFromPoint(clientX, clientY);
      const over = el?.closest('.shortcut-item') as HTMLElement | null;
      if (!over || over === item) return;

      if (over.dataset.add === '1') {
        grid.insertBefore(item, over);
        return;
      }
      if (!over.dataset.id) return;

      const rect = over.getBoundingClientRect();
      const before = clientX < rect.left + rect.width / 2;
      if (before) grid.insertBefore(item, over);
      else grid.insertBefore(item, over.nextSibling);
    };

    item.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      const target = e.target as HTMLElement | null;
      // Only ignore edit/delete controls — the tile itself is an <a>, which must still lift.
      if (target?.closest('.shortcut-actions')) return;

      e.preventDefault();
      pointerId = e.pointerId;
      startX = lastX = e.clientX;
      startY = lastY = e.clientY;
      lifted = false;
      moved = false;
      item.setPointerCapture(e.pointerId);

      holdTimer = setTimeout(() => {
        holdTimer = null;
        lift(lastX, lastY);
      }, HOLD_MS);
    });

    item.addEventListener('pointermove', (e) => {
      if (pointerId !== e.pointerId) return;
      lastX = e.clientX;
      lastY = e.clientY;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      if (!lifted) {
        if (Math.hypot(dx, dy) > MOVE_CANCEL_PX) {
          // Moved before hold completed — cancel lift (treat as scroll/cancel).
          clearHold();
        }
        return;
      }

      e.preventDefault();
      moveGhost(e.clientX, e.clientY);
      reorderUnderPointer(e.clientX, e.clientY);
    });

    const endPointer = (e: PointerEvent) => {
      if (pointerId !== e.pointerId) return;
      const wasLifted = lifted;
      cleanup();
      if (wasLifted) persistOrderFromDom();
    };

    item.addEventListener('pointerup', endPointer);
    item.addEventListener('pointercancel', endPointer);

    // Prevent click-through after a lift.
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
    const orderedIds = [...grid.querySelectorAll<HTMLElement>('.shortcut-item[data-id]')]
      .map((el) => el.dataset.id)
      .filter((id): id is string => Boolean(id));
    if (!orderedIds.length || !settings) return;
    const current = settings.shortcuts.map((s) => s.id);
    if (
      orderedIds.length === current.length &&
      orderedIds.every((id, i) => id === current[i])
    ) {
      return;
    }
    void options.onReorder(orderedIds);
  }

  return {
    root,
    setSettings: (next, isEditing) => {
      settings = next;
      editing = isEditing;
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
