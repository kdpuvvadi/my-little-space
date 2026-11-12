import {
  iconCandidatesFor,
  markIconUrlFailed,
  resolveShortcutIconUrl,
} from '../../shared/siteIcons';
import { resolveShortcutTitle } from '../../shared/siteTitles';
import type { Settings, Shortcut } from '../../shared/types';
import { plusSvg } from './icons';

const HOLD_MS = 180;
const MOVE_CANCEL_PX = 10;

export type ShortcutsGridApi = {
  root: HTMLElement;
  setSettings: (settings: Settings, editing: boolean) => void;
  setUpdateBusy: (busy: boolean) => void;
};

export function createShortcutsGrid(options: {
  onAdd: () => void;
  /** Enter edit mode (when not editing). */
  onBeginEdit: () => void;
  /** Persist draft and leave edit mode. */
  onSaveEdit: () => void | Promise<void>;
  /** Discard draft and leave edit mode. */
  onCancelEdit: () => void;
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
        <button type="button" class="edit-btn cancel-btn hidden">Cancel</button>
        <button type="button" class="edit-btn primary-btn"></button>
      </div>
    </div>
    <div class="shortcuts-grid"></div>
  `;

  const titleEl = root.querySelector('.shortcuts-title') as HTMLHeadingElement;
  const primaryBtn = root.querySelector('.primary-btn') as HTMLButtonElement;
  const cancelBtn = root.querySelector('.cancel-btn') as HTMLButtonElement;
  const updateBtn = root.querySelector('.update-meta-btn') as HTMLButtonElement;
  const grid = root.querySelector('.shortcuts-grid') as HTMLDivElement;

  primaryBtn.addEventListener('click', () => {
    if (editing) void options.onSaveEdit();
    else options.onBeginEdit();
  });
  cancelBtn.addEventListener('click', () => options.onCancelEdit());
  updateBtn.addEventListener('click', () => {
    if (updateBtn.disabled) return;
    void options.onUpdateMeta();
  });

  function render(): void {
    if (!settings) return;
    const { branding, shortcuts } = settings;
    titleEl.textContent = branding.shortcutsTitle;
    primaryBtn.textContent = editing ? 'Save' : branding.editLabel;
    primaryBtn.setAttribute('aria-pressed', String(editing));
    cancelBtn.classList.toggle('hidden', !editing);
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
    let lastDropIndex = -1;
    let raf = 0;

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
          movePlaceholderToPointer(lastX, lastY);
        });
      }
    };

    const onDocUp = (e: PointerEvent) => {
      if (pointerId !== e.pointerId) return;
      const wasLifted = lifted;
      cleanup();
      if (wasLifted) persistOrderFromDom();
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
      lifted = false;
      moved = false;
      lastDropIndex = -1;
    };

    const moveGhost = (clientX: number, clientY: number) => {
      if (!ghost) return;
      ghost.style.transform = `translate3d(${clientX - offsetX}px, ${clientY - offsetY}px, 0) scale(1.12)`;
    };

    /** Index among grid children excluding the dragged item. */
    const dropIndexForPoint = (clientX: number, clientY: number): number => {
      const slots = [
        ...grid.querySelectorAll<HTMLElement>(':scope > .shortcut-item'),
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
          // Place before this slot if pointer is left/above its center.
          best = clientX < cx || (Math.abs(clientX - cx) < r.width * 0.15 && clientY < cy)
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
        ...grid.querySelectorAll<HTMLElement>(':scope > .shortcut-item'),
      ].filter((el) => el !== item);
      const ref = slots[index] ?? null;
      if (ref) grid.insertBefore(item, ref);
      else grid.append(item);
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
        ...grid.querySelectorAll<HTMLElement>(':scope > .shortcut-item'),
      ].indexOf(item);

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
      lastDropIndex = -1;

      document.addEventListener('pointermove', onDocMove, { passive: false });
      document.addEventListener('pointerup', onDocUp);
      document.addEventListener('pointercancel', onDocUp);

      holdTimer = setTimeout(() => {
        holdTimer = null;
        lift(lastX, lastY);
      }, HOLD_MS);
    });

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
