const EXPAND_KEY = 'mlsQuickNoteExpanded';

export type QuickNoteApi = {
  root: HTMLElement;
  setValue: (value: string) => void;
};

/** Left-edge expandable note rail; persists via onChange. */
export function createQuickNote(options: {
  onChange: (value: string) => void;
}): QuickNoteApi {
  const root = document.createElement('aside');
  root.className = 'quick-note-rail';
  root.innerHTML = `
    <button type="button" class="quick-note-tab" id="mls-quick-note-tab" aria-expanded="false" aria-controls="mls-quick-note-panel" title="Quick note">
      <span class="quick-note-tab-label">Note</span>
    </button>
    <div class="quick-note-panel" id="mls-quick-note-panel" role="region" aria-label="Quick note" hidden>
      <div class="quick-note-panel-header">
        <span class="quick-note-panel-title">Note</span>
        <button type="button" class="icon-btn quick-note-collapse" id="mls-quick-note-collapse" title="Collapse" aria-label="Collapse note">‹</button>
      </div>
      <textarea
        id="mls-quick-note"
        class="quick-note-input"
        maxlength="2000"
        placeholder="Quick note…"
        spellcheck="true"
      ></textarea>
    </div>
  `;

  const tab = root.querySelector('#mls-quick-note-tab') as HTMLButtonElement;
  const panel = root.querySelector('#mls-quick-note-panel') as HTMLElement;
  const collapseBtn = root.querySelector('#mls-quick-note-collapse') as HTMLButtonElement;
  const input = root.querySelector('#mls-quick-note') as HTMLTextAreaElement;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastEmitted = '';

  const setExpanded = (open: boolean) => {
    root.classList.toggle('is-expanded', open);
    tab.setAttribute('aria-expanded', String(open));
    panel.hidden = !open;
    try {
      sessionStorage.setItem(EXPAND_KEY, open ? '1' : '0');
    } catch {
      // ignore
    }
    if (open) {
      requestAnimationFrame(() => input.focus());
    }
  };

  try {
    if (sessionStorage.getItem(EXPAND_KEY) === '1') setExpanded(true);
  } catch {
    // ignore
  }

  tab.addEventListener('click', () => {
    setExpanded(!root.classList.contains('is-expanded'));
  });
  collapseBtn.addEventListener('click', () => setExpanded(false));

  const emit = () => {
    const value = input.value;
    if (value === lastEmitted) return;
    lastEmitted = value;
    options.onChange(value);
  };

  input.addEventListener('input', () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(emit, 400);
  });

  input.addEventListener('blur', () => {
    if (timer) clearTimeout(timer);
    emit();
  });

  return {
    root,
    setValue: (value) => {
      if (document.activeElement === input) return;
      lastEmitted = value;
      input.value = value;
      root.classList.toggle('has-content', Boolean(value.trim()));
    },
  };
}
