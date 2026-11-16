/** In-app modal dialogs — no browser confirm/alert. */

export type AppDialogChoice = {
  id: string;
  label: string;
  /** Full-width choice button in the body (not the footer). */
  kind?: 'choice' | 'footer';
  danger?: boolean;
  primary?: boolean;
};

export type AppDialogResult = string | null;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Show a modal. Resolves with the chosen action id, or null if dismissed/cancelled.
 * Pass `choices` for multi-option flows; otherwise uses Cancel + confirmLabel.
 */
export function showAppDialog(options: {
  title: string;
  body: string;
  choices?: AppDialogChoice[];
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}): Promise<AppDialogResult> {
  return new Promise((resolve) => {
    const root = document.createElement('div');
    root.className = 'modal-root open app-dialog-root';

    const choices = options.choices?.length
      ? options.choices
      : [
          {
            id: 'cancel',
            label: options.cancelLabel ?? 'Cancel',
            kind: 'footer' as const,
          },
          {
            id: 'confirm',
            label: options.confirmLabel ?? 'OK',
            kind: 'footer' as const,
            primary: !options.danger,
            danger: options.danger,
          },
        ];

    const bodyChoices = choices.filter((c) => (c.kind ?? 'choice') === 'choice');
    const footerChoices = choices.filter((c) => c.kind === 'footer');
    const footer =
      footerChoices.length > 0
        ? footerChoices
        : [{ id: 'cancel', label: options.cancelLabel ?? 'Cancel', kind: 'footer' as const }];

    const choiceButtons = bodyChoices
      .map((c) => {
        const cls = [
          'btn',
          'dialog-choice-btn',
          c.primary ? 'primary' : '',
          c.danger ? 'danger-btn' : '',
        ]
          .filter(Boolean)
          .join(' ');
        return `<button type="button" class="${cls}" data-choice="${escapeHtml(c.id)}">${escapeHtml(c.label)}</button>`;
      })
      .join('');

    const footerButtons = footer
      .map((c) => {
        const cls = [
          'btn',
          c.primary ? 'primary' : '',
          c.danger ? 'danger-btn' : '',
        ]
          .filter(Boolean)
          .join(' ');
        return `<button type="button" class="${cls}" data-choice="${escapeHtml(c.id)}">${escapeHtml(c.label)}</button>`;
      })
      .join('');

    root.innerHTML = `
      <div class="modal app-dialog" role="dialog" aria-modal="true" aria-labelledby="app-dialog-title">
        <h3 id="app-dialog-title">${escapeHtml(options.title)}</h3>
        <p class="panel-note app-dialog-body">${escapeHtml(options.body)}</p>
        ${bodyChoices.length ? `<div class="dialog-choices">${choiceButtons}</div>` : ''}
        <div class="modal-actions">${footerButtons}</div>
      </div>
    `;

    const finish = (value: AppDialogResult) => {
      root.remove();
      document.removeEventListener('keydown', onKey);
      resolve(value);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish(null);
    };

    root.addEventListener('click', (e) => {
      if (e.target === root) finish(null);
    });

    root.querySelectorAll<HTMLButtonElement>('[data-choice]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.choice ?? '';
        if (!id || id === 'cancel') finish(null);
        else finish(id);
      });
    });

    document.addEventListener('keydown', onKey);
    document.body.append(root);
  });
}
