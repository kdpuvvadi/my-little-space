import {
  guessPageMeta,
  newShortcut,
  normalizePageUrl,
} from '../../shared/shortcuts';
import { fetchSiteMeta } from '../../shared/siteMetaClient';
import { resolveShortcutTitle } from '../../shared/siteTitles';
import type { Shortcut } from '../../shared/types';

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
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="shortcut-modal-title">
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
        <label for="sc-icon">Icon URL</label>
        <input type="url" id="sc-icon" placeholder="Auto (or paste a custom URL)" />
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

  let editing: Shortcut | null = null;
  /** Last helper/local meta applied in this modal session (for iconCustom detection). */
  let lastFetchedIcon = '';
  let lastMetaFetchedAt = 0;

  function close(): void {
    root.classList.remove('open');
    editing = null;
    lastFetchedIcon = '';
    lastMetaFetchedAt = 0;
  }

  function open(mode: 'create' | 'edit', shortcut?: Shortcut): void {
    editing = mode === 'edit' && shortcut ? { ...shortcut } : null;
    titleEl.textContent = mode === 'edit' ? 'Edit shortcut' : 'Add shortcut';
    urlInput.value = shortcut?.url ?? '';
    titleInput.value = shortcut
      ? resolveShortcutTitle(shortcut.url, shortcut.title)
      : '';
    iconInput.value = shortcut?.iconUrl ?? '';
    lastFetchedIcon = shortcut && !shortcut.iconCustom ? shortcut.iconUrl : '';
    lastMetaFetchedAt = shortcut?.metaFetchedAt ?? 0;
    statusEl.textContent = '';
    errorEl.textContent = '';
    // Bulk refresh lives next to Done; Fetch only when adding.
    fetchBtn.classList.toggle('hidden', mode === 'edit');
    root.classList.add('open');
    urlInput.focus();
  }

  function applyGuess(overwrite: boolean): void {
    const url = normalizePageUrl(urlInput.value);
    if (!url) return;
    urlInput.value = url;
    const guess = guessPageMeta(url);
    if (overwrite || !titleInput.value.trim()) titleInput.value = guess.title;
    if (overwrite || !iconInput.value.trim()) {
      iconInput.value = guess.iconUrl;
      lastFetchedIcon = guess.iconUrl;
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

    statusEl.textContent = 'Fetching…';
    const meta = await fetchSiteMeta(url, options.getMetaServiceUrl());
    titleInput.value = meta.title;
    if (!editing?.iconCustom) {
      iconInput.value = meta.icon;
      lastFetchedIcon = meta.icon;
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

  root.querySelector('#sc-save')?.addEventListener('click', async () => {
    errorEl.textContent = '';
    const url = normalizePageUrl(urlInput.value);
    if (!url) {
      errorEl.textContent = 'URL is required.';
      return;
    }
    urlInput.value = url;

    // New shortcuts always resolve meta once on save if not yet fetched this session.
    if (!editing && !lastMetaFetchedAt) {
      await applySiteMeta();
    }

    const guess = guessPageMeta(url);
    const title = titleInput.value.trim() || guess.title;
    const iconUrl = iconInput.value.trim() || lastFetchedIcon || guess.iconUrl;
    // Custom when the user diverged from the last auto-fetched icon.
    const iconCustom = lastFetchedIcon
      ? iconUrl !== lastFetchedIcon
      : editing?.iconCustom === true;

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
