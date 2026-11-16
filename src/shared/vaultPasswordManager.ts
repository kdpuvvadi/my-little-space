/** Password-manager save/autofill helpers for the vault recovery key. */

export const VAULT_PM_USERNAME = 'my-little-space-vault';

type PasswordCredentialLike = {
  new (data: { id: string; password: string }): Credential;
};

/**
 * Best-effort: Credentials API (Chromium) plus a standard autocomplete form
 * submit so browsers can offer to store the recovery key.
 */
export async function saveRecoveryKeyToPasswordManager(
  recoveryKey: string,
  form?: HTMLFormElement | null,
): Promise<void> {
  const PasswordCredentialCtor = (
    globalThis as unknown as { PasswordCredential?: PasswordCredentialLike }
  ).PasswordCredential;

  if (PasswordCredentialCtor && navigator.credentials?.store) {
    try {
      const cred = new PasswordCredentialCtor({
        id: VAULT_PM_USERNAME,
        password: recoveryKey,
      });
      await navigator.credentials.store(cred);
    } catch {
      // Fall through to form-based save.
    }
  }

  if (form) {
    try {
      // Focus password field so managers that listen for submit/focus can offer save.
      const pwd = form.querySelector<HTMLInputElement>('input[type="password"]');
      pwd?.focus();
      form.requestSubmit?.();
    } catch {
      // ignore
    }
  }
}

export function formatVaultSyncedAt(updatedAt: number): string {
  if (!updatedAt) return 'Never synced';
  try {
    return `Last synced ${new Date(updatedAt).toLocaleString()}`;
  } catch {
    return 'Last synced recently';
  }
}
