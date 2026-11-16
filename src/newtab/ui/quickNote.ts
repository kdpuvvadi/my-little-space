export type QuickNoteApi = {
  root: HTMLElement;
  setValue: (value: string) => void;
};

/** Compact sticky note under search; persists via onChange (debounced by caller or here). */
export function createQuickNote(options: {
  onChange: (value: string) => void;
}): QuickNoteApi {
  const root = document.createElement('div');
  root.className = 'quick-note';
  root.innerHTML = `
    <label class="quick-note-label" for="mls-quick-note">Note</label>
    <textarea
      id="mls-quick-note"
      class="quick-note-input"
      rows="2"
      maxlength="2000"
      placeholder="Quick note…"
      spellcheck="true"
    ></textarea>
  `;

  const input = root.querySelector('#mls-quick-note') as HTMLTextAreaElement;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastEmitted = '';

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
    },
  };
}
