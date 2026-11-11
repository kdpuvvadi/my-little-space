import { getEnabledProviders, resolveQuery } from '../../shared/search';
import type { Settings } from '../../shared/types';
import { chevronSvg } from './icons';

export type SearchBarApi = {
  root: HTMLElement;
  focus: () => void;
  setSettings: (settings: Settings) => void;
};

export function createSearchBar(
  initial: Settings,
  onProviderChange: (providerId: string) => void,
): SearchBarApi {
  let settings = initial;
  const root = document.createElement('div');
  root.className = 'search-wrap';

  root.innerHTML = `
    <form class="search-bar" autocomplete="off">
      <div class="provider-select">
        <button type="button" class="provider-btn" aria-haspopup="listbox" aria-expanded="false">
          <span class="provider-label"></span>
          ${chevronSvg}
        </button>
        <div class="provider-menu" role="listbox"></div>
      </div>
      <input class="search-input" type="text" name="q" spellcheck="false" />
      <span class="kbd-hint" aria-hidden="true"></span>
    </form>
  `;

  const form = root.querySelector('form') as HTMLFormElement;
  const input = root.querySelector('.search-input') as HTMLInputElement;
  const providerBtn = root.querySelector('.provider-btn') as HTMLButtonElement;
  const providerLabel = root.querySelector('.provider-label') as HTMLSpanElement;
  const menu = root.querySelector('.provider-menu') as HTMLDivElement;
  const kbd = root.querySelector('.kbd-hint') as HTMLSpanElement;

  kbd.textContent = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘ K' : 'Ctrl K';

  function selectedId(): string {
    const enabled = getEnabledProviders(settings);
    if (enabled.some((p) => p.id === settings.selectedProviderId)) {
      return settings.selectedProviderId;
    }
    return settings.defaultProviderId;
  }

  function renderProviders(): void {
    const enabled = getEnabledProviders(settings);
    const current = enabled.find((p) => p.id === selectedId()) ?? enabled[0];
    providerLabel.textContent = current?.name ?? 'Search';
    input.placeholder = settings.branding.searchPlaceholder;

    menu.innerHTML = enabled
      .map(
        (p) => `
      <button type="button" class="provider-option" role="option"
        data-id="${p.id}" aria-selected="${p.id === current?.id}">
        <span>${p.name}</span>
        <span class="bang">${p.bang}</span>
      </button>`,
      )
      .join('');
  }

  function closeMenu(): void {
    menu.classList.remove('open');
    providerBtn.setAttribute('aria-expanded', 'false');
  }

  providerBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = menu.classList.toggle('open');
    providerBtn.setAttribute('aria-expanded', String(open));
  });

  menu.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('.provider-option') as HTMLElement | null;
    if (!btn?.dataset.id) return;
    onProviderChange(btn.dataset.id);
    closeMenu();
  });

  document.addEventListener('click', (e) => {
    if (!root.contains(e.target as Node)) closeMenu();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const resolved = resolveQuery(input.value, settings, selectedId());
    if (!resolved.url) return;
    window.location.assign(resolved.url);
  });

  renderProviders();

  return {
    root,
    focus: () => input.focus(),
    setSettings: (next) => {
      settings = next;
      renderProviders();
    },
  };
}
