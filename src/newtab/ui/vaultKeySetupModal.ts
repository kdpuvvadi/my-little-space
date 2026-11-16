import { downloadRecoveryKeyFile } from '../../shared/yamlConfig';

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function parseRecoveryKeyInput(raw: string): string {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('My Little Space') && !l.startsWith('Keep this'));
  const keyLine = lines.find((l) => l.startsWith('mls_')) ?? lines[lines.length - 1] ?? '';
  return keyLine.trim();
}

type Step = 'save' | 'confirm' | 'ack';

/**
 * Modal key-setup flow. Blocks tab close via beforeunload until finished.
 * Resolves when the user completes “I've saved the key”.
 */
export function openVaultKeySetupModal(recoveryKey: string): Promise<void> {
  return new Promise((resolve) => {
    let step: Step = 'save';
    const root = document.createElement('div');
    root.className = 'modal-root open vault-key-modal-root';

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);

    const finish = () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      root.remove();
      resolve();
    };

    const setError = (msg: string) => {
      const err = root.querySelector('#vault-key-modal-error') as HTMLElement | null;
      if (err) err.textContent = msg;
    };

    const setNote = (msg: string) => {
      const note = root.querySelector('#vault-key-modal-note') as HTMLElement | null;
      if (note) note.textContent = msg;
    };

    const renderStep = () => {
      const modal = root.querySelector('.vault-key-modal') as HTMLElement;
      if (step === 'save') {
        modal.innerHTML = `
          <h3 id="vault-key-modal-title">Save your recovery key</h3>
          <p class="panel-note"><strong>Step 1 of 3</strong> — Download or copy this key and store it somewhere safe.</p>
          <div class="field">
            <label for="vaultRecoveryKeyDisplay">Recovery key</label>
            <input type="text" id="vaultRecoveryKeyDisplay" readonly value="${escapeAttr(recoveryKey)}" />
          </div>
          <p class="panel-error" id="vault-key-modal-error"></p>
          <p class="panel-note" id="vault-key-modal-note"></p>
          <div class="modal-actions vault-key-modal-actions">
            <button type="button" class="btn" id="vaultCopyKey">Copy key</button>
            <button type="button" class="btn primary" id="vaultDownloadKey">Download key file</button>
          </div>
          <div class="modal-actions vault-key-modal-actions">
            <button type="button" class="btn primary" id="vaultKeyContinue">Continue</button>
          </div>
        `;
      } else if (step === 'confirm') {
        modal.innerHTML = `
          <h3 id="vault-key-modal-title">Confirm your recovery key</h3>
          <p class="panel-note"><strong>Step 2 of 3</strong> — Enter the key you just saved. It is no longer shown here.</p>
          <div class="field">
            <label for="vaultKeyConfirmInput">Recovery key</label>
            <input type="text" id="vaultKeyConfirmInput" autocomplete="off" spellcheck="false" placeholder="Paste recovery key" />
          </div>
          <p class="panel-error" id="vault-key-modal-error"></p>
          <p class="panel-note" id="vault-key-modal-note"></p>
          <div class="modal-actions vault-key-modal-actions">
            <button type="button" class="btn" id="vaultKeyBackToSave">Back</button>
            <button type="button" class="btn primary" id="vaultKeyConfirm">Confirm key</button>
          </div>
        `;
      } else {
        modal.innerHTML = `
          <h3 id="vault-key-modal-title">Key confirmed</h3>
          <p class="panel-note"><strong>Step 3 of 3</strong> — Your recovery key matches. Confirm you have saved it; it will not be shown again.</p>
          <p class="panel-error" id="vault-key-modal-error"></p>
          <p class="panel-note" id="vault-key-modal-note"></p>
          <div class="modal-actions vault-key-modal-actions">
            <button type="button" class="btn primary" id="vaultKeySaved">I've saved the key</button>
          </div>
        `;
      }
      bindStep();
    };

    const bindStep = () => {
      root.querySelector('#vaultDownloadKey')?.addEventListener('click', () => {
        downloadRecoveryKeyFile(recoveryKey);
        setNote('Key file downloaded. Click Continue when you have saved it.');
        setError('');
      });

      root.querySelector('#vaultCopyKey')?.addEventListener('click', () => {
        void (async () => {
          try {
            await navigator.clipboard.writeText(recoveryKey);
            setNote('Key copied. Click Continue when you have saved it.');
            setError('');
          } catch {
            setError('Could not copy — select and copy manually.');
          }
        })();
      });

      root.querySelector('#vaultKeyContinue')?.addEventListener('click', () => {
        step = 'confirm';
        renderStep();
      });

      root.querySelector('#vaultKeyBackToSave')?.addEventListener('click', () => {
        step = 'save';
        renderStep();
      });

      root.querySelector('#vaultKeyConfirm')?.addEventListener('click', () => {
        const input = root.querySelector('#vaultKeyConfirmInput') as HTMLInputElement | null;
        const entered = parseRecoveryKeyInput(input?.value || '');
        if (!entered) {
          setError('Paste your recovery key to confirm.');
          return;
        }
        if (entered !== recoveryKey) {
          setError('That key does not match. Check your saved file and try again.');
          return;
        }
        step = 'ack';
        renderStep();
      });

      root.querySelector('#vaultKeyConfirmInput')?.addEventListener('keydown', (e) => {
        if ((e as KeyboardEvent).key === 'Enter') {
          e.preventDefault();
          (root.querySelector('#vaultKeyConfirm') as HTMLButtonElement | null)?.click();
        }
      });

      root.querySelector('#vaultKeySaved')?.addEventListener('click', () => {
        finish();
      });
    };

    root.innerHTML = `
      <div class="modal vault-key-modal" role="dialog" aria-modal="true" aria-labelledby="vault-key-modal-title"></div>
    `;
    // Do not dismiss on backdrop click — must finish the flow.
    document.body.append(root);
    renderStep();
  });
}
