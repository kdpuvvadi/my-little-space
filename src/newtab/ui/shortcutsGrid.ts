import {
  iconCandidatesFor,
  markIconUrlFailed,
  resolveShortcutIconUrl,
} from '../../shared/siteIcons';
import { resolveShortcutTitle } from '../../shared/siteTitles';
import type { Settings, Shortcut } from '../../shared/types';
import { plusSvg } from './icons';

export type ShortcutsGridApi = {
  root: HTMLElement;
  setSettings: (settings: Settings, editing: boolean) => void;
};

export function createShortcutsGrid(options: {
  onAdd: () => void;
  onEditToggle: () => void;
  onEditShortcut: (shortcut: Shortcut) => void;
  onDeleteShortcut: (id: string) => void;
}): ShortcutsGridApi {
  let settings: Settings | null = null;
  let editing = false;

  const root = document.createElement('section');
  root.className = 'shortcuts-section';
  root.innerHTML = `
    <div class="shortcuts-header">
      <h2 class="shortcuts-title"></h2>
      <button type="button" class="edit-btn"></button>
    </div>
    <div class="shortcuts-grid"></div>
  `;

  const titleEl = root.querySelector('.shortcuts-title') as HTMLHeadingElement;
  const editBtn = root.querySelector('.edit-btn') as HTMLButtonElement;
  const grid = root.querySelector('.shortcuts-grid') as HTMLDivElement;

  editBtn.addEventListener('click', () => options.onEditToggle());

  function render(): void {
    if (!settings) return;
    const { branding, shortcuts } = settings;
    titleEl.textContent = branding.shortcutsTitle;
    editBtn.textContent = editing ? 'Done' : branding.editLabel;
    editBtn.setAttribute('aria-pressed', String(editing));

    const items = shortcuts
      .map((sc) => {
        const title = resolveShortcutTitle(sc.url, sc.title);
        const candidates = iconCandidatesFor(sc.url);
        // Prefer stored icon (from helper or custom); fall back to local candidates.
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
              ? `<img src="${escapeAttr(primary)}"${fallbackAttr} alt="" decoding="async" referrerpolicy="no-referrer" />`
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
      <div class="shortcut-item">
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
      const id = (el as HTMLElement).dataset.id!;
      const shortcut = shortcuts.find((s) => s.id === id);
      if (!shortcut) return;

      el.querySelector('[data-action="edit"]')?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        options.onEditShortcut(shortcut);
      });
      el.querySelector('[data-action="delete"]')?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        options.onDeleteShortcut(id);
      });

      if (editing) {
        el.querySelector('.shortcut-tile')?.addEventListener('click', (e) => {
          e.preventDefault();
          options.onEditShortcut(shortcut);
        });
      }
    });
  }

  return {
    root,
    setSettings: (next, isEditing) => {
      settings = next;
      editing = isEditing;
      render();
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
