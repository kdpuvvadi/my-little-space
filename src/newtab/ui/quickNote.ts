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
        <button type="button" class="quick-note-collapse" id="mls-quick-note-collapse" title="Collapse" aria-label="Collapse note">
          <span aria-hidden="true">‹</span>
        </button>
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
  let closing = false;

  const onDocPointerDown = (e: Event) => {
    if (!root.classList.contains('is-expanded') || closing) return;
    const target = e.target as Node | null;
    if (target && root.contains(target)) return;
    setExpanded(false);
  };

  const finishClose = () => {
    closing = false;
    panel.classList.remove('is-closing');
    panel.hidden = true;
    root.classList.remove('is-expanded');
    tab.setAttribute('aria-expanded', 'false');
  };

  const setExpanded = (open: boolean) => {
    try {
      sessionStorage.setItem(EXPAND_KEY, open ? '1' : '0');
    } catch {
      // ignore
    }
    document.removeEventListener('pointerdown', onDocPointerDown, true);

    if (open) {
      closing = false;
      panel.classList.remove('is-closing');
      panel.hidden = false;
      root.classList.add('is-expanded');
      tab.setAttribute('aria-expanded', 'true');
      // Restart slide-in if re-opened quickly.
      panel.classList.remove('is-opening');
      void panel.offsetWidth;
      panel.classList.add('is-opening');
      // Defer so the opening click doesn't immediately collapse.
      requestAnimationFrame(() => {
        document.addEventListener('pointerdown', onDocPointerDown, true);
        input.focus();
      });
      return;
    }

    if (panel.hidden || closing) return;
    if (timer) clearTimeout(timer);
    emit();
    closing = true;
    tab.setAttribute('aria-expanded', 'false');
    panel.classList.remove('is-opening');
    panel.classList.add('is-closing');
    const onEnd = (e: AnimationEvent) => {
      if (e.target !== panel || e.animationName !== 'quick-note-slide-out') return;
      panel.removeEventListener('animationend', onEnd);
      finishClose();
    };
    panel.addEventListener('animationend', onEnd);
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
