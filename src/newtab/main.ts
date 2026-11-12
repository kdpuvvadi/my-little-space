import { resolveMetaServiceUrl } from '../shared/buildConfig';
import { fetchCatFact } from '../shared/catFact';
import { fetchSiteMeta, isMetaExpired } from '../shared/siteMetaClient';
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
  /** Working copy while editing — persisted only on Save; discarded on Cancel. */
  let draftShortcuts: Shortcut[] | null = null;
  const shell = renderShell(app);

  const cloneShortcuts = (list: Shortcut[]): Shortcut[] =>
    list.map((s) => ({ ...s }));

  const activeShortcuts = (): Shortcut[] =>
    editingShortcuts && draftShortcuts ? draftShortcuts : settings.shortcuts;

  const viewSettings = (): Settings =>
    editingShortcuts && draftShortcuts
      ? { ...settings, shortcuts: draftShortcuts }
      : settings;

  const paintShortcuts = () => {
    shortcutsGrid.setSettings(viewSettings(), editingShortcuts);
  };

  const setDraft = (next: Shortcut[]) => {
    draftShortcuts = next;
    paintShortcuts();
  };

  const searchBar = createSearchBar(settings, async (providerId) => {
    settings = await updateSettings({
      selectedProviderId: providerId,
    });
    searchBar.setSettings(settings);
  });

  const shortcutsGrid = createShortcutsGrid({
    onAdd: () => shortcutModal.openCreate(),
    onBeginEdit: () => {
      draftShortcuts = cloneShortcuts(settings.shortcuts);
      editingShortcuts = true;
      paintShortcuts();
    },
    onSaveEdit: async () => {
      if (!draftShortcuts) return;
      settings = await updateSettings({ shortcuts: cloneShortcuts(draftShortcuts) });
      draftShortcuts = null;
      editingShortcuts = false;
      paintShortcuts();
      settingsPanel.setSettings(settings);
    },
    onCancelEdit: () => {
      draftShortcuts = null;
      editingShortcuts = false;
      paintShortcuts();
    },
    onUpdateMeta: async () => {
      shortcutsGrid.setUpdateBusy(true);
      try {
        const serviceUrl = resolveMetaServiceUrl(settings.metaServiceUrl);
        const now = Date.now();
        const source = activeShortcuts();
        const next: Shortcut[] = [];
        for (const sc of source) {
          if (sc.iconCustom || !isMetaExpired(sc.metaFetchedAt, now)) {
            next.push(sc);
            continue;
          }
          const meta = await fetchSiteMeta(sc.url, serviceUrl);
          next.push({
            ...sc,
            title: meta.title,
            iconUrl: meta.icon,
            metaFetchedAt: Date.now(),
            iconCustom: false,
          });
        }
        if (editingShortcuts) {
          setDraft(next);
        } else {
          settings = await updateSettings({ shortcuts: next });
          paintShortcuts();
          settingsPanel.setSettings(settings);
        }
      } finally {
        shortcutsGrid.setUpdateBusy(false);
      }
    },
    onEditShortcut: (shortcut) => shortcutModal.openEdit(shortcut),
    onDeleteShortcut: (id) => {
      setDraft(activeShortcuts().filter((s) => s.id !== id));
    },
    onReorder: (orderedIds) => {
      const byId = new Map(activeShortcuts().map((s) => [s.id, s]));
      const reordered = orderedIds
        .map((id) => byId.get(id))
        .filter((s): s is Shortcut => Boolean(s));
      for (const s of activeShortcuts()) {
        if (!orderedIds.includes(s.id)) reordered.push(s);
      }
      setDraft(reordered);
    },
  });

  const shortcutModal = createShortcutModal({
    getMetaServiceUrl: () => resolveMetaServiceUrl(settings.metaServiceUrl),
    onSave: async (shortcut: Shortcut) => {
      const list = activeShortcuts();
      const existing = list.findIndex((s) => s.id === shortcut.id);
      const shortcuts =
        existing >= 0
          ? list.map((s) => (s.id === shortcut.id ? shortcut : s))
          : [...list, shortcut];

      if (editingShortcuts) {
        // Stay in edit mode — only commit when Save is pressed.
        setDraft(shortcuts);
        return;
      }

      settings = await updateSettings({ shortcuts });
      paintShortcuts();
      settingsPanel.setSettings(settings);
    },
  });

  const refreshUi = (next: Settings) => {
    settings = next;
    // Drop any in-progress edit session if settings reload from elsewhere.
    editingShortcuts = false;
    draftShortcuts = null;
    applyTheme(settings.theme);
    stopThemeWatch();
    stopThemeWatch = watchSystemTheme(settings.theme, () => applyTheme(settings.theme));
    if (maybeGoCustomUrl(settings)) return;
    applyBranding(shell, settings);
    searchBar.setSettings(settings);
    paintShortcuts();
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
