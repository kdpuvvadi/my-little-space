import { loadSettings, saveSettings } from '../shared/storage';
import { applyTheme } from '../shared/theme';
import type { Settings, ThemeMode } from '../shared/types';
import '../newtab/styles.css';

function toAbsoluteUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

async function main(): Promise<void> {
  const app = document.getElementById('app');
  if (!app) return;

  let settings = await loadSettings();
  applyTheme(settings.theme);

  app.innerHTML = `
    <h1 class="popup-title">My Little Space</h1>
    <p class="popup-note">When a custom URL is active, open settings here — new tabs leave the extension page.</p>
    <div class="field">
      <label for="theme">Theme</label>
      <select id="theme">
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="system">System</option>
      </select>
    </div>
    <div class="field">
      <label for="mode">New tab mode</label>
      <select id="mode">
        <option value="builtin">Built-in page</option>
        <option value="customUrl">Custom URL</option>
      </select>
    </div>
    <div class="field" id="urlField">
      <label for="customUrl">Custom URL</label>
      <input type="url" id="customUrl" placeholder="https://example.com" />
    </div>
    <p class="panel-error" id="error"></p>
    <div class="panel-actions">
      <button type="button" class="btn primary" id="save">Save</button>
      <button type="button" class="btn" id="openOptions">Full settings</button>
    </div>
  `;

  const themeSelect = app.querySelector('#theme') as HTMLSelectElement;
  const modeSelect = app.querySelector('#mode') as HTMLSelectElement;
  const urlField = app.querySelector('#urlField') as HTMLElement;
  const urlInput = app.querySelector('#customUrl') as HTMLInputElement;
  const errorEl = app.querySelector('#error') as HTMLElement;

  function syncForm(s: Settings): void {
    themeSelect.value = s.theme;
    modeSelect.value = s.mode;
    urlInput.value = s.customUrl;
    urlField.classList.toggle('hidden', s.mode !== 'customUrl');
  }

  syncForm(settings);

  themeSelect.addEventListener('change', () => {
    applyTheme(themeSelect.value as ThemeMode);
  });

  modeSelect.addEventListener('change', () => {
    urlField.classList.toggle('hidden', modeSelect.value !== 'customUrl');
  });

  app.querySelector('#save')?.addEventListener('click', async () => {
    errorEl.textContent = '';
    const theme = themeSelect.value as ThemeMode;
    const mode = modeSelect.value as Settings['mode'];
    const customUrl = urlInput.value.trim();
    if (mode === 'customUrl' && !toAbsoluteUrl(customUrl)) {
      errorEl.textContent = 'Enter a custom URL.';
      return;
    }
    settings = {
      ...settings,
      theme,
      mode,
      customUrl,
    };
    applyTheme(theme);
    await saveSettings(settings);
    errorEl.textContent = '';
    const note = document.createElement('p');
    note.className = 'panel-note';
    note.textContent = 'Saved. Open a new tab to apply.';
    app.querySelector('.panel-actions')?.after(note);
    setTimeout(() => note.remove(), 2500);
  });

  app.querySelector('#openOptions')?.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
}

void main();
