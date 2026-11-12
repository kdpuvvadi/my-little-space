import { createDefaultSettings, DEFAULT_PROVIDERS } from '../../shared/defaults';
import { newCustomProvider, normalizeBang } from '../../shared/providers';
import type { Branding, SearchProvider, Settings, ThemeMode } from '../../shared/types';
import { applyTheme } from '../../shared/theme';
import { downloadYaml, settingsToYaml, yamlToSettings } from '../../shared/yamlConfig';
import { closeSvg, pencilSvg } from './icons';

export type SettingsPanelApi = {
  open: () => void;
  close: () => void;
  setSettings: (settings: Settings) => void;
};

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function createSettingsPanel(options: {
  onChange: (settings: Settings) => Promise<void> | void;
  onImport: (settings: Settings) => Promise<void> | void;
  /** drawer = slide-over on new tab; page = always-open options UI */
  variant?: 'drawer' | 'page';
  mount?: HTMLElement;
}): SettingsPanelApi {
  let settings: Settings | null = null;
  const variant = options.variant ?? 'drawer';
  const mount = options.mount ?? document.body;

  const overlay = document.createElement('div');
  overlay.className = 'overlay';

  const panel = document.createElement('aside');
  panel.className = variant === 'page' ? 'panel panel-page open' : 'panel';
  panel.setAttribute('aria-label', 'Customize');
  panel.innerHTML = `
    <div class="panel-header">
      <h2>Customize</h2>
      <button type="button" class="icon-btn close-panel" aria-label="Close">${closeSvg}</button>
    </div>
    <div class="panel-body"></div>
  `;

  if (variant === 'page') {
    mount.append(panel);
    panel.querySelector('.close-panel')?.classList.add('hidden');
  } else {
    mount.append(overlay, panel);
  }

  const body = panel.querySelector('.panel-body') as HTMLDivElement;
  const closeBtn = panel.querySelector('.close-panel') as HTMLButtonElement;

  function close(): void {
    if (variant === 'page') return;
    overlay.classList.remove('open');
    panel.classList.remove('open');
  }

  function open(): void {
    render();
    if (variant === 'page') return;
    overlay.classList.add('open');
    panel.classList.add('open');
  }

  if (variant === 'drawer') {
    overlay.addEventListener('click', close);
    closeBtn.addEventListener('click', close);
  }

  async function patchBranding(partial: Partial<Branding>): Promise<void> {
    if (!settings) return;
    const next = {
      ...settings,
      branding: { ...settings.branding, ...partial },
    };
    settings = next;
    await options.onChange(next);
  }

  async function patchSettings(partial: Partial<Settings>): Promise<void> {
    if (!settings) return;
    const next = { ...settings, ...partial };
    settings = next;
    await options.onChange(next);
    render();
  }

  function render(): void {
    if (!settings) return;
    const s = settings;
    const b = s.branding;

    body.innerHTML = `
      <div class="field-group">
        <h3>Branding & copy</h3>
        <div class="field-row">
          <label for="showLogo">Show logo</label>
          <input type="checkbox" id="showLogo" ${b.showLogo ? 'checked' : ''} />
        </div>
        <div class="field">
          <label for="logoUrl">Logo URL</label>
          <input type="url" id="logoUrl" value="${escapeAttr(b.logoUrl.startsWith('data:') ? '' : b.logoUrl)}" placeholder="https://… or upload below" />
        </div>
        <div class="field">
          <label for="logoFile">Upload logo</label>
          <input type="file" id="logoFile" accept="image/*" />
          <p class="panel-note">${b.logoUrl.startsWith('data:') ? 'Custom uploaded logo is set.' : 'Optional — stored locally as a data URL.'}</p>
        </div>
        ${textField('brandName', 'Brand name', b.brandName)}
        ${textField('eyebrow', 'Eyebrow', b.eyebrow)}
        ${textField('headline', 'Headline', b.headline)}
        ${textField('searchPlaceholder', 'Search placeholder', b.searchPlaceholder)}
        ${textField('shortcutsTitle', 'Shortcuts title', b.shortcutsTitle)}
        ${textField('editLabel', 'Edit label', b.editLabel)}
        ${textField('addShortcutLabel', 'Add shortcut label', b.addShortcutLabel)}
        ${textField('footerTagline', 'Footer tagline', b.footerTagline)}
        ${textField('customizeLabel', 'Customize button label', b.customizeLabel)}
        <div class="field-row">
          <label for="showDate">Show date</label>
          <input type="checkbox" id="showDate" ${b.showDate ? 'checked' : ''} />
        </div>
      </div>

      <div class="field-group">
        <h3>Appearance</h3>
        <div class="field">
          <label for="theme">Theme</label>
          <select id="theme">
            <option value="light" ${s.theme === 'light' ? 'selected' : ''}>Light</option>
            <option value="dark" ${s.theme === 'dark' ? 'selected' : ''}>Dark</option>
            <option value="system" ${s.theme === 'system' ? 'selected' : ''}>System</option>
          </select>
        </div>
      </div>

      <div class="field-group">
        <h3>New tab mode</h3>
        <div class="field">
          <label for="mode">Mode</label>
          <select id="mode">
            <option value="builtin" ${s.mode === 'builtin' ? 'selected' : ''}>Built-in page</option>
            <option value="customUrl" ${s.mode === 'customUrl' ? 'selected' : ''}>Custom URL</option>
          </select>
        </div>
        <div class="field ${s.mode === 'customUrl' ? '' : 'hidden'}" id="customUrlField">
          <label for="customUrl">Custom URL</label>
          <input type="url" id="customUrl" value="${escapeAttr(s.customUrl)}" placeholder="https://example.com" />
          <p class="panel-note">Opens as a full page (sites often block iframes). Use the extension toolbar icon anytime to change settings or switch back to the built-in page.</p>
        </div>
        <div class="field">
          <label for="metaServiceUrl">Site meta helper URL</label>
          <input type="url" id="metaServiceUrl" value="${escapeAttr(s.metaServiceUrl)}" placeholder="https://meta.example.com" />
          <p class="panel-note">Optional. Used when adding or updating shortcuts. Leave empty to resolve names and icons locally.</p>
        </div>
      </div>

      <div class="field-group">
        <h3>Search</h3>
        <div class="field">
          <label for="defaultProvider">Default provider</label>
          <select id="defaultProvider">
            ${s.providers
              .filter((p) => s.enabledProviderIds.includes(p.id))
              .map(
                (p) =>
                  `<option value="${p.id}" ${s.defaultProviderId === p.id ? 'selected' : ''}>${escapeAttr(p.name)} (${escapeAttr(p.bang)})</option>`,
              )
              .join('')}
          </select>
        </div>
        <div class="field">
          <div class="field-label-row">
            <label>Search providers</label>
            <button type="button" class="text-btn" id="resetAllProviders">Reset</button>
          </div>
          <div class="provider-list">
            ${s.providers.map((p) => providerRow(p, s.enabledProviderIds.includes(p.id))).join('')}
          </div>
        </div>
        <div class="panel-actions">
          <button type="button" class="btn primary" id="addProvider">Add provider</button>
        </div>
        <p class="panel-error" id="providerError"></p>
      </div>

      <div class="field-group">
        <h3>Backup</h3>
        <div class="panel-actions">
          <button type="button" class="btn primary" id="exportYaml">Export</button>
          <button type="button" class="btn" id="importYaml">Import</button>
          <button type="button" class="text-btn" id="resetAll">Reset to default</button>
          <input type="file" id="importFile" accept=".yaml,.yml,text/yaml,text/plain" class="hidden" />
        </div>
        <p class="panel-error" id="yamlError"></p>
        <p class="panel-note" id="yamlNote"></p>
      </div>
    `;

    bindBrandingFields();
    bindAppearanceFields();
    bindModeFields();
    bindSearchFields();
    bindBackup();
  }

  function textField(id: string, label: string, value: string): string {
    return `
      <div class="field">
        <label for="${id}">${label}</label>
        <input type="text" id="${id}" value="${escapeAttr(value)}" />
      </div>`;
  }

  function providerRow(p: SearchProvider, enabled: boolean): string {
    return `
      <div class="provider-row" data-provider-id="${escapeAttr(p.id)}">
        <label class="provider-enabled" title="Enabled in search dropdown">
          <input type="checkbox" data-provider-enabled ${enabled ? 'checked' : ''} />
        </label>
        <span class="provider-name">${escapeAttr(p.name)}</span>
        <span class="provider-bang">${escapeAttr(p.bang)}</span>
        <button type="button" class="icon-btn" data-provider-edit title="Edit" aria-label="Edit ${escapeAttr(p.name)}">
          ${pencilSvg}
        </button>
      </div>`;
  }

  function openProviderEditor(provider: SearchProvider | null): void {
    const isNew = !provider;
    const draft = provider
      ? { ...provider }
      : settings
        ? newCustomProvider(settings.providers)
        : newCustomProvider();

    const root = document.createElement('div');
    root.className = 'modal-root open';
    root.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="provider-modal-title">
        <h3 id="provider-modal-title">${isNew ? 'Add provider' : 'Edit provider'}</h3>
        <div class="field">
          <label for="pv-name">Name</label>
          <input type="text" id="pv-name" value="${escapeAttr(draft.name)}" />
        </div>
        <div class="field">
          <label for="pv-bang">Bang</label>
          <input type="text" id="pv-bang" value="${escapeAttr(draft.bang)}" placeholder="!d" />
        </div>
        <div class="field">
          <label for="pv-url">Search URL</label>
          <input type="text" id="pv-url" value="${escapeAttr(draft.searchUrl)}" placeholder="https://…?q={q}" />
          <p class="panel-note">Include <code>{q}</code> where the query should go.</p>
        </div>
        <p class="panel-error" id="pv-error"></p>
        <div class="modal-actions">
          ${
            isNew
              ? ''
              : '<button type="button" class="btn" id="pv-delete">Delete</button>'
          }
          <button type="button" class="btn" id="pv-cancel">Cancel</button>
          <button type="button" class="btn primary" id="pv-save">Save</button>
        </div>
      </div>
    `;
    document.body.append(root);

    const nameInput = root.querySelector('#pv-name') as HTMLInputElement;
    const bangInput = root.querySelector('#pv-bang') as HTMLInputElement;
    const urlInput = root.querySelector('#pv-url') as HTMLInputElement;
    const errorEl = root.querySelector('#pv-error') as HTMLElement;

    const dismiss = () => root.remove();

    root.addEventListener('click', (e) => {
      if (e.target === root) dismiss();
    });
    root.querySelector('#pv-cancel')?.addEventListener('click', dismiss);

    root.querySelector('#pv-delete')?.addEventListener('click', async () => {
      if (!settings) return;
      if (settings.providers.length <= 1) {
        errorEl.textContent = 'Keep at least one provider.';
        return;
      }
      if (!confirm(`Delete ${draft.name}?`)) return;
      const providers = settings.providers.filter((p) => p.id !== draft.id);
      await commitProviders(providers);
      dismiss();
      render();
    });

    root.querySelector('#pv-save')?.addEventListener('click', async () => {
      if (!settings) return;
      errorEl.textContent = '';

      const name = nameInput.value.trim();
      const bang = normalizeBang(bangInput.value);
      const searchUrl = urlInput.value.trim();

      if (!name) {
        errorEl.textContent = 'Name is required.';
        return;
      }
      if (!bang) {
        errorEl.textContent = 'Bang must include letters or numbers (e.g. !d).';
        return;
      }
      if (!searchUrl.includes('{q}')) {
        errorEl.textContent = 'Search URL must include {q} for the query.';
        return;
      }
      const clash = settings.providers.find(
        (p) => p.id !== draft.id && p.bang.toLowerCase() === bang.toLowerCase(),
      );
      if (clash) {
        errorEl.textContent = `Bang ${bang} is already used by ${clash.name}.`;
        return;
      }

      bangInput.value = bang;
      const nextProvider: SearchProvider = { ...draft, name, bang, searchUrl };

      if (isNew) {
        await commitProviders([...settings.providers, nextProvider], {
          enabledProviderIds: [...settings.enabledProviderIds, nextProvider.id],
        });
      } else {
        await commitProviders(
          settings.providers.map((p) => (p.id === draft.id ? nextProvider : p)),
        );
      }
      dismiss();
      render();
    });

    nameInput.focus();
  }

  async function commitProviders(
    providers: SearchProvider[],
    extra: Partial<Settings> = {},
  ): Promise<void> {
    if (!settings) return;
    const ids = new Set(providers.map((p) => p.id));
    let enabled = (extra.enabledProviderIds ?? settings.enabledProviderIds).filter((id) =>
      ids.has(id),
    );
    if (!enabled.length) enabled = providers.map((p) => p.id);

    let defaultProviderId = extra.defaultProviderId ?? settings.defaultProviderId;
    if (!enabled.includes(defaultProviderId)) defaultProviderId = enabled[0];

    let selectedProviderId = extra.selectedProviderId ?? settings.selectedProviderId;
    if (!enabled.includes(selectedProviderId)) selectedProviderId = defaultProviderId;

    const next: Settings = {
      ...settings,
      ...extra,
      providers,
      enabledProviderIds: enabled,
      defaultProviderId,
      selectedProviderId,
    };
    settings = next;
    await options.onChange(next);
  }

  async function resetSearchProviders(): Promise<void> {
    if (!confirm('Reset search providers and bangs to defaults?')) return;
    const providers = DEFAULT_PROVIDERS.map((p) => ({ ...p }));
    await commitProviders(providers, {
      enabledProviderIds: providers.map((p) => p.id),
      defaultProviderId: 'google',
      selectedProviderId: 'google',
    });
    render();
  }

  async function resetToDefaults(): Promise<void> {
    if (!confirm('Reset all settings, branding, providers, and shortcuts to defaults?')) {
      return;
    }
    const next = createDefaultSettings();
    applyTheme(next.theme);
    settings = next;
    await options.onChange(next);
    render();
  }

  function bindBrandingFields(): void {
    const map: Array<[string, keyof Branding]> = [
      ['brandName', 'brandName'],
      ['eyebrow', 'eyebrow'],
      ['headline', 'headline'],
      ['searchPlaceholder', 'searchPlaceholder'],
      ['shortcutsTitle', 'shortcutsTitle'],
      ['editLabel', 'editLabel'],
      ['addShortcutLabel', 'addShortcutLabel'],
      ['footerTagline', 'footerTagline'],
      ['customizeLabel', 'customizeLabel'],
      ['logoUrl', 'logoUrl'],
    ];

    for (const [id, key] of map) {
      const el = body.querySelector(`#${id}`);
      const apply = async (e: Event) => {
        const value = (e.target as HTMLInputElement).value;
        if (key === 'logoUrl' && value.trim()) {
          await patchBranding({ logoUrl: value.trim() });
        } else if (key !== 'logoUrl') {
          await patchBranding({ [key]: value } as Partial<Branding>);
        } else if (!value.trim() && settings && !settings.branding.logoUrl.startsWith('data:')) {
          await patchBranding({ logoUrl: '' });
        }
      };
      el?.addEventListener('input', (e) => void apply(e));
      el?.addEventListener('change', (e) => void apply(e));
    }

    body.querySelector('#showLogo')?.addEventListener('change', async (e) => {
      await patchBranding({ showLogo: (e.target as HTMLInputElement).checked });
    });
    body.querySelector('#showDate')?.addEventListener('change', async (e) => {
      await patchBranding({ showDate: (e.target as HTMLInputElement).checked });
    });

    body.querySelector('#logoFile')?.addEventListener('change', async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      if (file.size > 400_000) {
        const err = body.querySelector('#yamlError') as HTMLElement;
        err.textContent = 'Logo file is too large (max ~400KB).';
        return;
      }
      const dataUrl = await fileToDataUrl(file);
      await patchBranding({ logoUrl: dataUrl, showLogo: true });
      render();
    });
  }

  function bindAppearanceFields(): void {
    body.querySelector('#theme')?.addEventListener('change', async (e) => {
      const theme = (e.target as HTMLSelectElement).value as ThemeMode;
      applyTheme(theme);
      await patchSettings({ theme });
    });
  }

  function bindModeFields(): void {
    body.querySelector('#mode')?.addEventListener('change', async (e) => {
      const mode = (e.target as HTMLSelectElement).value as Settings['mode'];
      await patchSettings({ mode });
    });
    body.querySelector('#customUrl')?.addEventListener('change', async (e) => {
      await patchSettings({ customUrl: (e.target as HTMLInputElement).value.trim() });
    });
    body.querySelector('#metaServiceUrl')?.addEventListener('change', async (e) => {
      await patchSettings({
        metaServiceUrl: (e.target as HTMLInputElement).value.trim(),
      });
    });
  }

  function bindSearchFields(): void {
    const errorEl = () => body.querySelector('#providerError') as HTMLElement | null;

    body.querySelector('#defaultProvider')?.addEventListener('change', async (e) => {
      const id = (e.target as HTMLSelectElement).value;
      if (!settings) return;
      const enabled = settings.enabledProviderIds.includes(id)
        ? settings.enabledProviderIds
        : [...settings.enabledProviderIds, id];
      await commitProviders(settings.providers, {
        defaultProviderId: id,
        selectedProviderId: id,
        enabledProviderIds: enabled,
      });
      render();
    });

    body.querySelectorAll<HTMLElement>('.provider-row').forEach((row) => {
      const id = row.dataset.providerId;
      if (!id || !settings) return;

      row.querySelector('[data-provider-enabled]')?.addEventListener('change', async (e) => {
        if (!settings) return;
        const checked = (e.target as HTMLInputElement).checked;
        let enabled = settings.enabledProviderIds.filter((x) => x !== id);
        if (checked) enabled = [...enabled, id];
        if (!enabled.length) {
          (e.target as HTMLInputElement).checked = true;
          const err = errorEl();
          if (err) err.textContent = 'Keep at least one provider enabled.';
          return;
        }
        await commitProviders(settings.providers, { enabledProviderIds: enabled });
        render();
      });

      row.querySelector('[data-provider-edit]')?.addEventListener('click', () => {
        const provider = settings?.providers.find((p) => p.id === id);
        if (provider) openProviderEditor(provider);
      });
    });

    body.querySelector('#addProvider')?.addEventListener('click', () => {
      openProviderEditor(null);
    });

    body.querySelector('#resetAllProviders')?.addEventListener('click', () => {
      void resetSearchProviders();
    });
  }

  function bindBackup(): void {
    const errorEl = body.querySelector('#yamlError') as HTMLElement;
    const noteEl = body.querySelector('#yamlNote') as HTMLElement;
    errorEl.textContent = '';
    noteEl.textContent = '';

    body.querySelector('#exportYaml')?.addEventListener('click', () => {
      if (!settings) return;
      downloadYaml('my-little-space.yaml', settingsToYaml(settings));
      noteEl.textContent = 'Exported current settings.';
    });

    const fileInput = body.querySelector('#importFile') as HTMLInputElement;
    body.querySelector('#importYaml')?.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', async () => {
      const file = fileInput.files?.[0];
      fileInput.value = '';
      if (!file) return;
      const text = await file.text();
      const result = yamlToSettings(text);
      if (!result.ok) {
        errorEl.textContent = result.error;
        noteEl.textContent = '';
        return;
      }
      if (!confirm('Replace all current settings and shortcuts with this YAML?')) return;
      await options.onImport(result.settings);
      settings = result.settings;
      applyTheme(result.settings.theme);
      errorEl.textContent = '';
      noteEl.textContent = result.warnings.length
        ? result.warnings.join(' ')
        : 'Import successful.';
      render();
    });

    body.querySelector('#resetAll')?.addEventListener('click', () => {
      void resetToDefaults();
    });
  }

  return {
    open,
    close,
    setSettings: (next) => {
      // Update cache only — avoid re-render (would steal focus while typing).
      settings = next;
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
