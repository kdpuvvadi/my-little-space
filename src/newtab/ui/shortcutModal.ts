import {
  catalogIconUrl,
  probeSlugIcons,
  searchIconCatalog,
  type CatalogIcon,
} from '../../shared/iconCatalog';
import {
  guessPageMeta,
  newShortcut,
  normalizePageUrl,
} from '../../shared/shortcuts';
import {
  hostnameOf,
  isPrivateOrLocalHost,
  resolveShortcutIconUrl,
} from '../../shared/siteIcons';
import { fetchSiteMeta } from '../../shared/siteMetaClient';
import { resolveShortcutTitle } from '../../shared/siteTitles';
import type { Shortcut } from '../../shared/types';
import { pencilSvg } from './icons';

export type ShortcutModalApi = {
  openCreate: () => void;
  openEdit: (shortcut: Shortcut) => void;
};

export function createShortcutModal(options: {
  onSave: (shortcut: Shortcut) => Promise<void> | void;
  getMetaServiceUrl: () => string;
}): ShortcutModalApi {
  const root = document.createElement('div');
  root.className = 'modal-root';
  root.innerHTML = `
    <div class="modal shortcut-modal" role="dialog" aria-modal="true" aria-labelledby="shortcut-modal-title">
      <h3 id="shortcut-modal-title">Add shortcut</h3>
      <div class="field">
        <label for="sc-url">URL</label>
        <input type="url" id="sc-url" placeholder="https://example.com" />
      </div>
      <div class="field">
        <label for="sc-title">Name</label>
        <input type="text" id="sc-title" placeholder="Filled from the URL / page title" />
      </div>
      <div class="field">
        <span class="field-label-text">Icon</span>
        <div class="icon-picker-row">
          <div class="icon-preview" id="sc-icon-preview" aria-hidden="true">
            <span class="icon-preview-letter" id="sc-icon-letter">?</span>
            <img id="sc-icon-img" alt="" decoding="async" referrerpolicy="no-referrer" hidden />
          </div>
          <div class="icon-picker-meta">
            <span class="icon-picker-caption" id="sc-icon-caption">Auto</span>
            <button type="button" class="icon-btn" id="sc-icon-edit" title="Choose icon">
              ${pencilSvg}
            </button>
          </div>
        </div>
        <div class="icon-picker-panel hidden" id="sc-icon-panel">
          <input type="search" id="sc-icon-search" placeholder="Search Simple Icons &amp; Dashboard Icons…" autocomplete="off" />
          <div class="icon-picker-grid" id="sc-icon-grid" role="listbox" aria-label="Icon results"></div>
          <div class="icon-picker-footer">
            <button type="button" class="btn" id="sc-icon-auto">Use auto</button>
            <button type="button" class="btn" id="sc-icon-url-toggle">Paste URL</button>
          </div>
          <div class="field hidden" id="sc-icon-url-field">
            <label for="sc-icon">Custom icon URL</label>
            <input type="url" id="sc-icon" placeholder="https://…" />
          </div>
        </div>
      </div>
      <p class="panel-note" id="sc-status"></p>
      <p class="panel-error" id="sc-error"></p>
      <div class="modal-actions">
        <button type="button" class="btn" id="sc-cancel">Cancel</button>
        <button type="button" class="btn" id="sc-fetch" title="Fill name and icon from the site meta helper">
          Fetch
        </button>
        <button type="button" class="btn primary" id="sc-save">Save</button>
      </div>
    </div>
  `;
  document.body.append(root);

  const titleEl = root.querySelector('#shortcut-modal-title') as HTMLHeadingElement;
  const urlInput = root.querySelector('#sc-url') as HTMLInputElement;
  const titleInput = root.querySelector('#sc-title') as HTMLInputElement;
  const iconInput = root.querySelector('#sc-icon') as HTMLInputElement;
  const statusEl = root.querySelector('#sc-status') as HTMLElement;
  const errorEl = root.querySelector('#sc-error') as HTMLElement;
  const fetchBtn = root.querySelector('#sc-fetch') as HTMLButtonElement;
  const previewEl = root.querySelector('#sc-icon-preview') as HTMLElement;
  const letterEl = root.querySelector('#sc-icon-letter') as HTMLElement;
  const imgEl = root.querySelector('#sc-icon-img') as HTMLImageElement;
  const captionEl = root.querySelector('#sc-icon-caption') as HTMLElement;
  const editBtn = root.querySelector('#sc-icon-edit') as HTMLButtonElement;
  const panelEl = root.querySelector('#sc-icon-panel') as HTMLElement;
  const searchInput = root.querySelector('#sc-icon-search') as HTMLInputElement;
  const gridEl = root.querySelector('#sc-icon-grid') as HTMLElement;
  const autoBtn = root.querySelector('#sc-icon-auto') as HTMLButtonElement;
  const urlToggleBtn = root.querySelector('#sc-icon-url-toggle') as HTMLButtonElement;
  const urlField = root.querySelector('#sc-icon-url-field') as HTMLElement;

  let editing: Shortcut | null = null;
  /** Last helper/local meta applied in this modal session (for iconCustom detection). */
  let lastFetchedIcon = '';
  let lastMetaFetchedAt = 0;
  /** User explicitly chose an icon (catalog or paste) this session. */
  let iconPicked = false;
  let pickerOpen = false;
  let searchTimer = 0;
  let probeToken = 0;

  function close(): void {
    root.classList.remove('open');
    editing = null;
    lastFetchedIcon = '';
    lastMetaFetchedAt = 0;
    iconPicked = false;
    setPickerOpen(false);
  }

  function previewLetter(): string {
    const title = titleInput.value.trim() || resolveShortcutTitle(urlInput.value, '');
    return (title.slice(0, 1) || '?').toUpperCase();
  }

  function syncPreview(): void {
    const url = iconInput.value.trim();
    letterEl.textContent = previewLetter();
    if (!url) {
      imgEl.hidden = true;
      imgEl.removeAttribute('src');
      previewEl.classList.remove('has-image');
      captionEl.textContent = 'Auto';
      return;
    }
    imgEl.hidden = false;
    imgEl.onload = () => {
      imgEl.classList.add('is-ready');
      previewEl.classList.add('has-image');
    };
    imgEl.onerror = () => {
      imgEl.classList.remove('is-ready');
      previewEl.classList.remove('has-image');
      imgEl.hidden = true;
    };
    imgEl.classList.remove('is-ready');
    previewEl.classList.remove('has-image');
    if (imgEl.src !== url) imgEl.src = url;

    if (iconPicked || editing?.iconCustom) {
      const fromCatalog = labelForIconUrl(url);
      captionEl.textContent = fromCatalog ?? 'Custom';
    } else {
      captionEl.textContent = 'Auto';
    }
  }

  function labelForIconUrl(url: string): string | undefined {
    const dash = /dashboard-icons\/(?:png|svg)\/([^/.]+)/i.exec(url);
    if (dash) return dash[1].replace(/-/g, ' ');
    const simple = /cdn\.simpleicons\.org\/([^/?#]+)/i.exec(url);
    if (simple) return decodeURIComponent(simple[1]);
    return undefined;
  }

  function setIconUrl(url: string, picked: boolean): void {
    iconInput.value = url;
    iconPicked = picked;
    syncPreview();
  }

  function setPickerOpen(open: boolean): void {
    pickerOpen = open;
    panelEl.classList.toggle('hidden', !open);
    editBtn.setAttribute('aria-expanded', String(open));
    if (open) {
      if (!searchInput.value.trim()) {
        const hint =
          titleInput.value.trim().split(/\s+/)[0] ||
          hostnameOf(normalizePageUrl(urlInput.value)).split('.')[0] ||
          '';
        if (hint && hint.length >= 3) searchInput.value = hint;
      }
      renderIconGrid(searchInput.value);
      searchInput.focus();
      searchInput.select();
    }
  }

  function bindIconItem(btn: HTMLButtonElement): void {
    const img = btn.querySelector('img');
    if (img) {
      img.addEventListener('error', () => {
        // Drop invalid CDN hits instead of leaving broken tiles.
        btn.remove();
      });
    }
    btn.addEventListener('click', () => {
      const u = btn.dataset.url ?? '';
      if (!u) return;
      setIconUrl(u, true);
      setPickerOpen(false);
      statusEl.textContent = `Icon set to ${btn.dataset.label ?? 'selection'}.`;
    });
  }

  function iconItemHtml(entry: CatalogIcon): string {
    const src = catalogIconUrl(entry);
    const pack = entry.source === 'simple' ? 'Simple' : 'Dashboard';
    return `
      <button type="button" class="icon-picker-item" role="option"
        data-url="${escapeAttr(src)}"
        data-label="${escapeAttr(entry.label)}"
        data-key="${escapeAttr(`${entry.source}:${entry.id}`)}"
        title="${escapeAttr(`${entry.label} (${pack})`)}">
        <img src="${escapeAttr(src)}" alt="" decoding="async" referrerpolicy="no-referrer" loading="lazy" />
        <span>${escapeAttr(entry.label)}</span>
      </button>`;
  }

  function renderIconGrid(query: string): void {
    const token = ++probeToken;
    const results = searchIconCatalog(query, 48);
    gridEl.innerHTML = results.map(iconItemHtml).join('');
    for (const btn of gridEl.querySelectorAll<HTMLButtonElement>('.icon-picker-item')) {
      bindIconItem(btn);
    }

    // Only append freeform slug tiles after CDN probe succeeds (no broken placeholders).
    void probeSlugIcons(query, results).then((extra) => {
      if (token !== probeToken || !extra.length) return;
      const existing = new Set(
        [...gridEl.querySelectorAll<HTMLElement>('[data-key]')].map((el) => el.dataset.key),
      );
      for (const entry of extra) {
        const key = `${entry.source}:${entry.id}`;
        if (existing.has(key)) continue;
        gridEl.insertAdjacentHTML('afterbegin', iconItemHtml(entry));
        const btn = gridEl.querySelector<HTMLButtonElement>(`[data-key="${CSS.escape(key)}"]`);
        if (btn) bindIconItem(btn);
      }
    });
  }

  function open(mode: 'create' | 'edit', shortcut?: Shortcut): void {
    editing = mode === 'edit' && shortcut ? { ...shortcut } : null;
    titleEl.textContent = mode === 'edit' ? 'Edit shortcut' : 'Add shortcut';
    urlInput.value = shortcut?.url ?? '';
    titleInput.value = shortcut
      ? resolveShortcutTitle(shortcut.url, shortcut.title)
      : '';
    const stored = shortcut?.iconUrl ?? '';
    const display =
      stored.trim() ||
      (shortcut ? resolveShortcutIconUrl(shortcut.url, stored) : '');
    iconInput.value = display;
    lastFetchedIcon = shortcut && !shortcut.iconCustom ? shortcut.iconUrl : '';
    lastMetaFetchedAt = shortcut?.metaFetchedAt ?? 0;
    iconPicked = shortcut?.iconCustom === true;
    statusEl.textContent = '';
    errorEl.textContent = '';
    urlField.classList.add('hidden');
    searchInput.value = '';
    fetchBtn.classList.toggle('hidden', mode === 'edit');
    setPickerOpen(false);
    syncPreview();
    root.classList.add('open');
    urlInput.focus();
  }

  function applyGuess(overwrite: boolean): void {
    const url = normalizePageUrl(urlInput.value);
    if (!url) return;
    urlInput.value = url;
    const guess = guessPageMeta(url);
    if (overwrite || !titleInput.value.trim()) titleInput.value = guess.title;
    if (!iconPicked && (overwrite || !iconInput.value.trim())) {
      setIconUrl(guess.iconUrl, false);
      lastFetchedIcon = guess.iconUrl;
    } else {
      syncPreview();
    }

    const host = hostnameOf(url);
    if (host && isPrivateOrLocalHost(host) && !iconPicked) {
      statusEl.textContent =
        'Local/internal URL — public favicons won’t work. Pick an icon with the pencil.';
    }
  }

  async function applySiteMeta(): Promise<boolean> {
    errorEl.textContent = '';
    const url = normalizePageUrl(urlInput.value);
    if (!url) {
      errorEl.textContent = 'Enter a URL first.';
      return false;
    }
    urlInput.value = url;

    const host = hostnameOf(url);
    if (host && isPrivateOrLocalHost(host)) {
      statusEl.textContent =
        'Local/internal URL — helper can’t reach it. Set a name and pick an icon.';
      applyGuess(false);
      return true;
    }

    statusEl.textContent = 'Fetching…';
    const meta = await fetchSiteMeta(url, options.getMetaServiceUrl());
    titleInput.value = meta.title;
    if (!iconPicked && !editing?.iconCustom) {
      setIconUrl(meta.icon, false);
      lastFetchedIcon = meta.icon;
    } else {
      syncPreview();
    }
    lastMetaFetchedAt = Date.now();
    statusEl.textContent =
      meta.source === 'service'
        ? 'Loaded from site meta helper. You can edit before saving.'
        : 'Filled locally (helper unavailable). You can edit before saving.';
    return true;
  }

  root.querySelector('#sc-cancel')?.addEventListener('click', close);
  fetchBtn.addEventListener('click', () => {
    void applySiteMeta();
  });
  root.addEventListener('click', (e) => {
    if (e.target === root) close();
  });

  editBtn.addEventListener('click', () => {
    setPickerOpen(!pickerOpen);
  });

  searchInput.addEventListener('input', () => {
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => {
      renderIconGrid(searchInput.value);
    }, 120);
  });

  autoBtn.addEventListener('click', () => {
    const url = normalizePageUrl(urlInput.value);
    const auto = url ? guessPageMeta(url).iconUrl : '';
    setIconUrl(auto, false);
    lastFetchedIcon = auto;
    iconPicked = false;
    setPickerOpen(false);
    statusEl.textContent = 'Using auto icon.';
  });

  urlToggleBtn.addEventListener('click', () => {
    urlField.classList.toggle('hidden');
    if (!urlField.classList.contains('hidden')) iconInput.focus();
  });

  iconInput.addEventListener('input', () => {
    iconPicked = Boolean(iconInput.value.trim());
    syncPreview();
  });

  titleInput.addEventListener('input', () => {
    letterEl.textContent = previewLetter();
  });

  root.querySelector('#sc-save')?.addEventListener('click', async () => {
    errorEl.textContent = '';
    const url = normalizePageUrl(urlInput.value);
    if (!url) {
      errorEl.textContent = 'URL is required.';
      return;
    }
    urlInput.value = url;

    const host = hostnameOf(url);
    const privateHost = host ? isPrivateOrLocalHost(host) : false;

    // New shortcuts: fetch meta once unless local (unreachable) or already fetched.
    if (!editing && !lastMetaFetchedAt && !privateHost) {
      await applySiteMeta();
    } else if (!editing && privateHost && !titleInput.value.trim()) {
      applyGuess(false);
    }

    const guess = guessPageMeta(url);
    const title = titleInput.value.trim() || guess.title;
    const iconUrl = iconInput.value.trim() || lastFetchedIcon || guess.iconUrl;
    const iconCustom =
      iconPicked ||
      (lastFetchedIcon ? iconUrl !== lastFetchedIcon : editing?.iconCustom === true);

    const metaFetchedAt = lastMetaFetchedAt || editing?.metaFetchedAt || Date.now();

    const shortcut = editing
      ? {
          ...editing,
          url,
          title,
          iconUrl,
          metaFetchedAt,
          iconCustom,
        }
      : newShortcut({
          url,
          title,
          iconUrl,
          metaFetchedAt,
          iconCustom,
        });

    await options.onSave(shortcut);
    close();
  });

  urlInput.addEventListener('change', () => {
    if (!urlInput.value.trim()) return;
    applyGuess(false);
  });

  return {
    openCreate: () => open('create'),
    openEdit: (shortcut) => open('edit', shortcut),
  };
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
