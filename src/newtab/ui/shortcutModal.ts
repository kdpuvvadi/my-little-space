import {
  fetchPageMeta,
  guessPageMeta,
  newShortcut,
  normalizePageUrl,
} from '../../shared/shortcuts';
import type { Shortcut } from '../../shared/types';

export type ShortcutModalApi = {
  openCreate: () => void;
  openEdit: (shortcut: Shortcut) => void;
};

export function createShortcutModal(options: {
  onSave: (shortcut: Shortcut) => Promise<void> | void;
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
        <input type="url" id="sc-icon" placeholder="Favicon (editable)" />
      </div>
      <p class="panel-note" id="sc-status"></p>
      <p class="panel-error" id="sc-error"></p>
      <div class="modal-actions">
        <button type="button" class="btn" id="sc-cancel">Cancel</button>
        <button type="button" class="btn" id="sc-fetch" title="Fill name and icon from the URL (same as auto-fetch)">
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

  let editing: Shortcut | null = null;

  function close(): void {
    root.classList.remove('open');
    editing = null;
  }

  function open(mode: 'create' | 'edit', shortcut?: Shortcut): void {
    editing = mode === 'edit' && shortcut ? { ...shortcut } : null;
    titleEl.textContent = mode === 'edit' ? 'Edit shortcut' : 'Add shortcut';
    urlInput.value = shortcut?.url ?? '';
    titleInput.value = shortcut?.title ?? '';
    iconInput.value = shortcut?.iconUrl ?? '';
    statusEl.textContent = '';
    errorEl.textContent = '';
    root.classList.add('open');
    urlInput.focus();
  }

  /** Fill name/icon from hostname + favicon CDN — never prompts. */
  function applyGuess(overwrite: boolean): void {
    const url = normalizePageUrl(urlInput.value);
    if (!url) return;
    urlInput.value = url;
    const guess = guessPageMeta(url);
    if (overwrite || !titleInput.value.trim()) titleInput.value = guess.title;
    if (overwrite || !iconInput.value.trim()) iconInput.value = guess.iconUrl;
  }

  async function fetchInfo(): Promise<void> {
    errorEl.textContent = '';
    const url = normalizePageUrl(urlInput.value);
    if (!url) {
      errorEl.textContent = 'Enter a URL first.';
      return;
    }
    urlInput.value = url;

    // Same path as auto-fill: hostname + favicon CDN, never prompt.
    // If host access was already granted, upgrade to live page title/icon.
    applyGuess(true);
    statusEl.textContent = 'Fetching…';

    try {
      const meta = await fetchPageMeta(url, { allowPrompt: false });
      titleInput.value = meta.title;
      iconInput.value = meta.iconUrl;
      statusEl.textContent =
        meta.source === 'page'
          ? 'Loaded page title and icon. You can edit before saving.'
          : 'Filled from site name + favicon. You can edit before saving.';
    } catch {
      statusEl.textContent = 'Filled from site name + favicon. You can edit before saving.';
    }
  }

  root.querySelector('#sc-cancel')?.addEventListener('click', close);
  root.querySelector('#sc-fetch')?.addEventListener('click', () => void fetchInfo());
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

    // Fill blanks locally — never request permission on Save.
    const guess = guessPageMeta(url);
    const title = titleInput.value.trim() || guess.title;
    const iconUrl = iconInput.value.trim() || guess.iconUrl;

    const shortcut = editing
      ? { ...editing, url, title, iconUrl }
      : newShortcut({ url, title, iconUrl });

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
