/** Password-manager save/autofill helpers for the vault recovery key. */

export const VAULT_PM_USERNAME = 'my-little-space-vault';

type PasswordCredentialCtor = {
  new (data: { id: string; password: string }): Credential;
  new (form: HTMLFormElement): Credential;
};

function getPasswordCredentialCtor(): PasswordCredentialCtor | null {
  return (
    (globalThis as unknown as { PasswordCredential?: PasswordCredentialCtor }).PasswordCredential ??
    null
  );
}

export type VaultPmSaveResult = 'stored' | 'dismissed' | 'unsupported';

/**
 * Trigger the browser password-manager save UI from a user gesture.
 * Prefer a visible form (username + password); hidden/clipped fields are ignored.
 */
export async function saveRecoveryKeyToPasswordManager(
  recoveryKey: string,
  form?: HTMLFormElement | null,
): Promise<VaultPmSaveResult> {
  const PasswordCredentialCtor = getPasswordCredentialCtor();
  if (!PasswordCredentialCtor || !navigator.credentials?.store) {
    return 'unsupported';
  }

  // Ensure form fields carry the current key before constructing the credential.
  if (form) {
    const user = form.querySelector<HTMLInputElement>(
      'input[autocomplete~="username"], input[name="username"]',
    );
    const pwd = form.querySelector<HTMLInputElement>(
      'input[type="password"], input[autocomplete~="new-password"]',
    );
    if (user) user.value = VAULT_PM_USERNAME;
    if (pwd) {
      pwd.value = recoveryKey;
      pwd.readOnly = false;
    }
  }

  try {
    let cred: Credential | null = null;
    if (form) {
      try {
        cred = new PasswordCredentialCtor(form);
      } catch {
        cred = null;
      }
    }
    if (!cred) {
      cred = new PasswordCredentialCtor({
        id: VAULT_PM_USERNAME,
        password: recoveryKey,
      });
    }

    // Typings vary (Credential | null | void). Treat a resolved call as prompted.
    const stored = (await navigator.credentials.store(cred)) as
      | Credential
      | null
      | void;
    if (stored === null) return 'dismissed';
    return 'stored';
  } catch {
    return 'unsupported';
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
