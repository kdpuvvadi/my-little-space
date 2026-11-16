import { resolveMetaServiceUrl } from '../shared/buildConfig';
import { fetchCatFact } from '../shared/catFact';
import {
  addShortcutToGroup,
  deleteGroup,
  newGroup,
  normalizeHomeFlags,
  normalizeHomeOrder,
  orderedHomeIds,
  removeShortcutFromGroup,
} from '../shared/groups';
import { fetchSiteMeta, isMetaExpired } from '../shared/siteMetaClient';
import { loadSettings, saveSettings, updateSettings } from '../shared/storage';
import { applyTheme, watchSystemTheme } from '../shared/theme';
import type { Settings, Shortcut, ShortcutGroup, ThemeMode } from '../shared/types';
import { formatVaultSyncBadge, maybeStaleVaultSync } from '../shared/vaultSync';
import { logoSvg, moonSvg, slidersSvg, sunSvg, systemSvg } from './ui/icons';
import { createQuickNote } from './ui/quickNote';
import { createSearchBar } from './ui/searchBar';
import { createSettingsPanel } from './ui/settingsPanel';
import { createShortcutModal } from './ui/shortcutModal';
import { createShortcutsGrid } from './ui/shortcutsGrid';
import './styles.css';

type ShortcutsDraft = {
  shortcuts: Shortcut[];
  groups: ShortcutGroup[];
  homeOrder: string[];
  pinnedHomeIds: string[];
  hiddenHomeIds: string[];
};

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
  vaultBadgeEl: HTMLElement;
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
        <div class="footer-start">
          <div class="footer-tagline"></div>
          <p class="vault-sync-badge hidden" aria-live="polite"></p>
        </div>
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
    vaultBadgeEl: app.querySelector('.vault-sync-badge') as HTMLElement,
    customizeBtn: app.querySelector('.customize-btn') as HTMLButtonElement,
    mainColumn: app.querySelector('.main-column') as HTMLElement,
  };
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  return Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));
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

  if (settings.vaultEnabled) {
    els.vaultBadgeEl.textContent = formatVaultSyncBadge(settings.vaultUpdatedAt);
    els.vaultBadgeEl.classList.remove('hidden');
    els.vaultBadgeEl.title = settings.vaultUpdatedAt
      ? new Date(settings.vaultUpdatedAt).toLocaleString()
      : 'Safe backup is on — not synced yet';
  } else {
    els.vaultBadgeEl.textContent = '';
    els.vaultBadgeEl.classList.add('hidden');
    els.vaultBadgeEl.removeAttribute('title');
  }
}

function cloneDraft(from: {
  shortcuts: Shortcut[];
  groups: ShortcutGroup[];
  homeOrder: string[];
  pinnedHomeIds: string[];
  hiddenHomeIds: string[];
}): ShortcutsDraft {
  const homeOrder = [...from.homeOrder];
  return {
    shortcuts: from.shortcuts.map((s) => ({ ...s })),
    groups: from.groups.map((g) => ({
      ...g,
      shortcutIds: [...g.shortcutIds],
    })),
    homeOrder,
    pinnedHomeIds: [...from.pinnedHomeIds],
    hiddenHomeIds: [...from.hiddenHomeIds],
  };
}

function toggleId(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
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
  let draft: ShortcutsDraft | null = null;
  const shell = renderShell(app);

  const activeDraft = (): ShortcutsDraft =>
    editingShortcuts && draft
      ? draft
      : {
          shortcuts: settings.shortcuts,
          groups: settings.groups,
          homeOrder: settings.homeOrder,
          pinnedHomeIds: settings.pinnedHomeIds,
          hiddenHomeIds: settings.hiddenHomeIds,
        };

  const viewSettings = (): Settings => {
    const d = activeDraft();
    const homeOrder = normalizeHomeOrder(d.homeOrder, d.shortcuts, d.groups);
    return {
      ...settings,
      shortcuts: d.shortcuts,
      groups: d.groups,
      homeOrder,
      pinnedHomeIds: normalizeHomeFlags(d.pinnedHomeIds, homeOrder),
      hiddenHomeIds: normalizeHomeFlags(d.hiddenHomeIds, homeOrder),
    };
  };

  const paintShortcuts = () => {
    shortcutsGrid.setSettings(viewSettings(), editingShortcuts);
  };

  const setDraft = (next: ShortcutsDraft) => {
    const homeOrder = normalizeHomeOrder(next.homeOrder, next.shortcuts, next.groups);
    draft = {
      shortcuts: next.shortcuts,
      groups: next.groups,
      homeOrder,
      pinnedHomeIds: normalizeHomeFlags(next.pinnedHomeIds, homeOrder),
      hiddenHomeIds: normalizeHomeFlags(next.hiddenHomeIds, homeOrder),
    };
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
    onAddGroup: (title, accentColor) => {
      const d = activeDraft();
      const group = newGroup(title, { accentColor, existing: d.groups });
      setDraft({
        ...d,
        groups: [...d.groups, group],
        homeOrder: [...d.homeOrder, group.id],
      });
    },
    onBeginEdit: () => {
      draft = cloneDraft(settings);
      editingShortcuts = true;
      paintShortcuts();
    },
    onSaveEdit: async () => {
      if (!draft) return;
      const normalized = cloneDraft(draft);
      normalized.homeOrder = normalizeHomeOrder(
        normalized.homeOrder,
        normalized.shortcuts,
        normalized.groups,
      );
      normalized.pinnedHomeIds = normalizeHomeFlags(
        normalized.pinnedHomeIds,
        normalized.homeOrder,
      );
      normalized.hiddenHomeIds = normalizeHomeFlags(
        normalized.hiddenHomeIds,
        normalized.homeOrder,
      );
      settings = await updateSettings({
        shortcuts: normalized.shortcuts,
        groups: normalized.groups,
        homeOrder: normalized.homeOrder,
        pinnedHomeIds: normalized.pinnedHomeIds,
        hiddenHomeIds: normalized.hiddenHomeIds,
      });
      draft = null;
      editingShortcuts = false;
      paintShortcuts();
      settingsPanel.setSettings(settings);
    },
    onCancelEdit: () => {
      draft = null;
      editingShortcuts = false;
      paintShortcuts();
    },
    onUpdateMeta: async () => {
      shortcutsGrid.setUpdateBusy(true);
      try {
        const serviceUrl = resolveMetaServiceUrl(settings.metaServiceUrl);
        const now = Date.now();
        const d = activeDraft();
        const nextShortcuts: Shortcut[] = [];
        for (const sc of d.shortcuts) {
          if (sc.iconCustom || !isMetaExpired(sc.metaFetchedAt, now)) {
            nextShortcuts.push(sc);
            continue;
          }
          const meta = await fetchSiteMeta(sc.url, serviceUrl);
          nextShortcuts.push({
            ...sc,
            title: meta.title,
            iconUrl: meta.icon,
            metaFetchedAt: Date.now(),
            iconCustom: false,
          });
        }
        if (editingShortcuts) {
          setDraft({ ...d, shortcuts: nextShortcuts });
        } else {
          settings = await updateSettings({ shortcuts: nextShortcuts });
          paintShortcuts();
          settingsPanel.setSettings(settings);
        }
      } finally {
        shortcutsGrid.setUpdateBusy(false);
      }
    },
    onEditShortcut: (shortcut) => shortcutModal.openEdit(shortcut),
    onDeleteShortcut: (id) => {
      const d = activeDraft();
      const groups = d.groups.map((g) => ({
        ...g,
        shortcutIds: g.shortcutIds.filter((sid) => sid !== id),
      }));
      setDraft({
        shortcuts: d.shortcuts.filter((s) => s.id !== id),
        groups,
        homeOrder: d.homeOrder.filter((hid) => hid !== id),
        pinnedHomeIds: d.pinnedHomeIds.filter((hid) => hid !== id),
        hiddenHomeIds: d.hiddenHomeIds.filter((hid) => hid !== id),
      });
    },
    onRenameGroup: (groupId, title) => {
      const d = activeDraft();
      setDraft({
        ...d,
        groups: d.groups.map((g) => (g.id === groupId ? { ...g, title } : g)),
      });
    },
    onSetGroupAccent: (groupId, accentColor) => {
      const d = activeDraft();
      const groups = d.groups.map((g) =>
        g.id === groupId ? { ...g, accentColor } : g,
      );
      if (editingShortcuts) {
        setDraft({ ...d, groups });
        return;
      }
      void updateSettings({ groups }).then((next) => {
        settings = next;
        paintShortcuts();
        settingsPanel.setSettings(settings);
      });
    },
    onDeleteGroup: (groupId) => {
      const d = activeDraft();
      const next = deleteGroup(d.groups, d.homeOrder, groupId);
      setDraft({
        shortcuts: d.shortcuts,
        groups: next.groups,
        homeOrder: next.homeOrder,
        pinnedHomeIds: d.pinnedHomeIds.filter((id) => id !== groupId),
        hiddenHomeIds: d.hiddenHomeIds.filter((id) => id !== groupId),
      });
    },
    onReorderHome: (orderedIds) => {
      const d = activeDraft();
      setDraft({ ...d, homeOrder: orderedIds });
    },
    onDropOnGroup: (groupId, shortcutId) => {
      const d = activeDraft();
      const next = addShortcutToGroup(d.groups, d.homeOrder, groupId, shortcutId);
      setDraft({
        ...d,
        groups: next.groups,
        homeOrder: next.homeOrder,
        pinnedHomeIds: d.pinnedHomeIds.filter((id) => id !== shortcutId),
        hiddenHomeIds: d.hiddenHomeIds.filter((id) => id !== shortcutId),
      });
    },
    onRemoveFromGroup: (groupId, shortcutId) => {
      const d = activeDraft();
      const next = removeShortcutFromGroup(d.groups, d.homeOrder, groupId, shortcutId);
      setDraft({
        ...d,
        groups: next.groups,
        homeOrder: next.homeOrder,
      });
    },
    onTogglePin: (id) => {
      const d = activeDraft();
      setDraft({ ...d, pinnedHomeIds: toggleId(d.pinnedHomeIds, id) });
    },
    onToggleHide: (id) => {
      const d = activeDraft();
      const hiddenHomeIds = toggleId(d.hiddenHomeIds, id);
      const pinnedHomeIds = hiddenHomeIds.includes(id)
        ? d.pinnedHomeIds.filter((x) => x !== id)
        : d.pinnedHomeIds;
      setDraft({ ...d, hiddenHomeIds, pinnedHomeIds });
    },
  });

  const shortcutModal = createShortcutModal({
    getMetaServiceUrl: () => resolveMetaServiceUrl(settings.metaServiceUrl),
    onSave: async (shortcut: Shortcut) => {
      const d = activeDraft();
      const existing = d.shortcuts.findIndex((s) => s.id === shortcut.id);
      const shortcuts =
        existing >= 0
          ? d.shortcuts.map((s) => (s.id === shortcut.id ? shortcut : s))
          : [...d.shortcuts, shortcut];
      const homeOrder =
        existing >= 0
          ? d.homeOrder
          : d.homeOrder.includes(shortcut.id)
            ? d.homeOrder
            : [...d.homeOrder, shortcut.id];

      if (editingShortcuts) {
        setDraft({ ...d, shortcuts, homeOrder });
        return;
      }

      settings = await updateSettings({ shortcuts, homeOrder });
      paintShortcuts();
      settingsPanel.setSettings(settings);
    },
  });

  const quickNote = createQuickNote({
    onChange: (value) => {
      void updateSettings({ quickNote: value }).then((next) => {
        settings = next;
        settingsPanel.setSettings(settings);
      });
    },
  });

  const refreshUi = (next: Settings) => {
    settings = next;
    editingShortcuts = false;
    draft = null;
    applyTheme(settings.theme);
    stopThemeWatch();
    stopThemeWatch = watchSystemTheme(settings.theme, () => applyTheme(settings.theme));
    if (maybeGoCustomUrl(settings)) return;
    applyBranding(shell, settings);
    searchBar.setSettings(settings);
    quickNote.setValue(settings.quickNote);
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
  app.append(quickNote.root);
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
  quickNote.setValue(settings.quickNote);
  shortcutsGrid.setSettings(settings, editingShortcuts);
  settingsPanel.setSettings(settings);

  let groupChordTimer = 0;
  let awaitingGroupLetter = false;

  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      searchBar.focus();
      return;
    }

    if (isTypingTarget(e.target) || editingShortcuts) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (document.querySelector('.modal-root.open, .group-overlay.is-active')) return;
    if (document.querySelector('.panel.open:not(.panel-page)')) return;

    if (awaitingGroupLetter) {
      awaitingGroupLetter = false;
      window.clearTimeout(groupChordTimer);
      const letter = e.key.toLowerCase();
      if (/^[a-z0-9]$/.test(letter)) {
        e.preventDefault();
        const group = settings.groups.find((g) =>
          g.title.trim().toLowerCase().startsWith(letter),
        );
        if (group) shortcutsGrid.openGroup(group.id);
      }
      return;
    }

    if (e.key === 'g' || e.key === 'G') {
      e.preventDefault();
      awaitingGroupLetter = true;
      window.clearTimeout(groupChordTimer);
      groupChordTimer = window.setTimeout(() => {
        awaitingGroupLetter = false;
      }, 1200);
      return;
    }

    if (/^[1-9]$/.test(e.key)) {
      e.preventDefault();
      const index = Number(e.key) - 1;
      const order = orderedHomeIds(
        normalizeHomeOrder(settings.homeOrder, settings.shortcuts, settings.groups),
        settings.pinnedHomeIds,
        settings.hiddenHomeIds,
      );
      const id = order[index];
      if (!id) return;
      const group = settings.groups.find((g) => g.id === id);
      if (group) {
        shortcutsGrid.openGroup(group.id);
        return;
      }
      const shortcut = settings.shortcuts.find((s) => s.id === id);
      if (shortcut?.url) window.location.assign(shortcut.url);
    }
  });

  // Quiet background sync if last vault upload is stale (>15 min).
  void maybeStaleVaultSync().then((outcome) => {
    if (outcome?.ok) {
      void loadSettings().then((next) => {
        settings = next;
        settingsPanel.setSettings(next);
        applyBranding(shell, next);
      });
    }
  });
}

void main();
