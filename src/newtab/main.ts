import { fetchCatFact } from '../shared/catFact';
import { loadSettings, saveSettings, updateSettings } from '../shared/storage';
import { applyTheme, watchSystemTheme } from '../shared/theme';
import type { Settings, Shortcut, ThemeMode } from '../shared/types';
import { logoSvg, moonSvg, slidersSvg, sunSvg, systemSvg } from './ui/icons';
import { createSearchBar } from './ui/searchBar';
import { createSettingsPanel } from './ui/settingsPanel';
import { createShortcutModal } from './ui/shortcutModal';
import { createShortcutsGrid } from './ui/shortcutsGrid';
import './styles.css';

function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function toAbsoluteUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

/** Full navigation — required because most sites set X-Frame-Options. */
function maybeGoCustomUrl(settings: Settings): boolean {
  if (settings.mode !== 'customUrl') return false;
  const target = toAbsoluteUrl(settings.customUrl);
  if (!target) return false;
  window.location.replace(target);
  return true;
}

function renderShell(app: HTMLElement): {
  brandEl: HTMLElement;
  dateEl: HTMLElement;
  themeSwitch: HTMLElement;
  eyebrowEl: HTMLElement;
  headlineEl: HTMLElement;
  catFactBtn: HTMLButtonElement;
  catFactEl: HTMLElement;
  footerTaglineEl: HTMLElement;
  customizeBtn: HTMLButtonElement;
  mainColumn: HTMLElement;
} {
  app.innerHTML = `
    <div class="page">
      <header class="topbar">
        <div class="topbar-start">
          <div class="brand">
            <span class="brand-mark"></span>
            <span class="brand-name"></span>
          </div>
        </div>
        <div class="topbar-center">
          <button type="button" class="cat-fact-btn">cat fact</button>
        </div>
        <div class="topbar-end">
          <div class="date"></div>
          <div class="theme-switch" role="group" aria-label="Theme">
            <button type="button" class="theme-btn" data-theme="light" title="Light" aria-label="Light theme">
              ${sunSvg}
            </button>
            <button type="button" class="theme-btn" data-theme="dark" title="Dark" aria-label="Dark theme">
              ${moonSvg}
            </button>
            <button type="button" class="theme-btn" data-theme="system" title="System" aria-label="System theme">
              ${systemSvg}
            </button>
          </div>
        </div>
      </header>
      <div class="cat-fact-slot">
        <p class="cat-fact" role="status" aria-live="polite" hidden></p>
      </div>
      <div class="hero">
        <p class="eyebrow"></p>
        <h1 class="headline"></h1>
      </div>
      <div class="main-column"></div>
      <footer class="footer">
        <div class="footer-tagline"></div>
        <button type="button" class="customize-btn">
          ${slidersSvg}
          <span class="customize-label"></span>
        </button>
      </footer>
    </div>
  `;

  return {
    brandEl: app.querySelector('.brand') as HTMLElement,
    dateEl: app.querySelector('.date') as HTMLElement,
    themeSwitch: app.querySelector('.theme-switch') as HTMLElement,
    eyebrowEl: app.querySelector('.eyebrow') as HTMLElement,
    headlineEl: app.querySelector('.headline') as HTMLElement,
    catFactBtn: app.querySelector('.cat-fact-btn') as HTMLButtonElement,
    catFactEl: app.querySelector('.cat-fact') as HTMLElement,
    footerTaglineEl: app.querySelector('.footer-tagline') as HTMLElement,
    customizeBtn: app.querySelector('.customize-btn') as HTMLButtonElement,
    mainColumn: app.querySelector('.main-column') as HTMLElement,
  };
}

function wireCatFact(els: ReturnType<typeof renderShell>): void {
  let hideTimer = 0;
  let fadeTimer = 0;

  const hideFact = () => {
    els.catFactEl.classList.remove('visible');
    fadeTimer = window.setTimeout(() => {
      els.catFactEl.hidden = true;
      els.catFactEl.textContent = '';
      els.catFactEl.classList.remove('error');
    }, 280);
  };

  els.catFactBtn.addEventListener('click', async () => {
    window.clearTimeout(hideTimer);
    window.clearTimeout(fadeTimer);
    els.catFactBtn.disabled = true;
    els.catFactEl.classList.remove('error', 'visible');
    els.catFactEl.hidden = false;
    els.catFactEl.textContent = 'Fetching a cat fact…';
    requestAnimationFrame(() => els.catFactEl.classList.add('visible'));

    try {
      const fact = await fetchCatFact();
      els.catFactEl.textContent = fact;
      hideTimer = window.setTimeout(hideFact, 5500);
    } catch {
      els.catFactEl.classList.add('error');
      els.catFactEl.textContent = 'Could not fetch a cat fact. Try again.';
      hideTimer = window.setTimeout(hideFact, 3500);
    } finally {
      els.catFactBtn.disabled = false;
    }
  });
}

function syncThemeButtons(els: ReturnType<typeof renderShell>, theme: ThemeMode): void {
  els.themeSwitch.querySelectorAll<HTMLButtonElement>('.theme-btn').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(btn.dataset.theme === theme));
  });
}

function applyBranding(
  els: ReturnType<typeof renderShell>,
  settings: Settings,
): void {
  const { branding } = settings;
  const mark = els.brandEl.querySelector('.brand-mark') as HTMLElement;
  const name = els.brandEl.querySelector('.brand-name') as HTMLElement;
  name.textContent = branding.brandName;

  if (branding.showLogo) {
    if (branding.logoUrl) {
      mark.innerHTML = `<img class="brand-logo" src="${escapeHtml(branding.logoUrl)}" alt="" />`;
    } else {
      mark.innerHTML = logoSvg;
    }
    mark.classList.remove('hidden');
  } else {
    mark.innerHTML = '';
    mark.classList.add('hidden');
  }

  if (branding.showDate) {
    els.dateEl.textContent = formatDate(new Date());
    els.dateEl.classList.remove('hidden');
  } else {
    els.dateEl.textContent = '';
    els.dateEl.classList.add('hidden');
  }

  els.eyebrowEl.textContent = branding.eyebrow;
  els.headlineEl.textContent = branding.headline;
  els.footerTaglineEl.textContent = branding.footerTagline;
  const label = els.customizeBtn.querySelector('.customize-label') as HTMLElement;
  label.textContent = branding.customizeLabel;
  document.title = branding.brandName || 'New Tab';
  syncThemeButtons(els, settings.theme);
}

async function main(): Promise<void> {
  const app = document.getElementById('app');
  if (!app) return;

  let settings = await loadSettings();
  applyTheme(settings.theme);
  let stopThemeWatch = watchSystemTheme(settings.theme, () => applyTheme(settings.theme));
  if (maybeGoCustomUrl(settings)) return;

  let editingShortcuts = false;
  const shell = renderShell(app);

  const searchBar = createSearchBar(settings, async (providerId) => {
    settings = await updateSettings({
      selectedProviderId: providerId,
    });
    searchBar.setSettings(settings);
  });

  const shortcutsGrid = createShortcutsGrid({
    onAdd: () => shortcutModal.openCreate(),
    onEditToggle: () => {
      editingShortcuts = !editingShortcuts;
      shortcutsGrid.setSettings(settings, editingShortcuts);
    },
    onEditShortcut: (shortcut) => shortcutModal.openEdit(shortcut),
    onDeleteShortcut: async (id) => {
      settings = await updateSettings({
        shortcuts: settings.shortcuts.filter((s) => s.id !== id),
      });
      shortcutsGrid.setSettings(settings, editingShortcuts);
      settingsPanel.setSettings(settings);
    },
  });

  const shortcutModal = createShortcutModal({
    getMetaServiceUrl: () => settings.metaServiceUrl,
    onSave: async (shortcut: Shortcut) => {
      const existing = settings.shortcuts.findIndex((s) => s.id === shortcut.id);
      const shortcuts =
        existing >= 0
          ? settings.shortcuts.map((s) => (s.id === shortcut.id ? shortcut : s))
          : [...settings.shortcuts, shortcut];
      settings = await updateSettings({ shortcuts });
      shortcutsGrid.setSettings(settings, editingShortcuts);
      settingsPanel.setSettings(settings);
    },
  });

  const refreshUi = (next: Settings) => {
    settings = next;
    applyTheme(settings.theme);
    stopThemeWatch();
    stopThemeWatch = watchSystemTheme(settings.theme, () => applyTheme(settings.theme));
    if (maybeGoCustomUrl(settings)) return;
    applyBranding(shell, settings);
    searchBar.setSettings(settings);
    shortcutsGrid.setSettings(settings, editingShortcuts);
    settingsPanel.setSettings(settings);
  };

  const settingsPanel = createSettingsPanel({
    onChange: async (next) => {
      await saveSettings(next);
      refreshUi(next);
    },
    onImport: async (next) => {
      await saveSettings(next);
      refreshUi(next);
    },
  });

  shell.mainColumn.append(searchBar.root, shortcutsGrid.root);
  shell.customizeBtn.addEventListener('click', () => settingsPanel.open());
  wireCatFact(shell);

  shell.themeSwitch.addEventListener('click', async (e) => {
    const btn = (e.target as HTMLElement).closest('.theme-btn') as HTMLButtonElement | null;
    const theme = btn?.dataset.theme as ThemeMode | undefined;
    if (!theme || theme === settings.theme) return;
    settings = await updateSettings({ theme });
    refreshUi(settings);
  });

  applyBranding(shell, settings);
  searchBar.setSettings(settings);
  shortcutsGrid.setSettings(settings, editingShortcuts);
  settingsPanel.setSettings(settings);

  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      searchBar.focus();
    }
  });
}

void main();
