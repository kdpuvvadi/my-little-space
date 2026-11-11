import type { ThemeMode } from './types';

function systemPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function resolveTheme(theme: ThemeMode): 'light' | 'dark' {
  if (theme === 'system') return systemPrefersDark() ? 'dark' : 'light';
  return theme;
}

export function applyTheme(theme: ThemeMode): void {
  const resolved = resolveTheme(theme);
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved;
}

export function watchSystemTheme(theme: ThemeMode, onChange: () => void): () => void {
  if (theme !== 'system') return () => undefined;
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = () => onChange();
  mq.addEventListener('change', handler);
  return () => mq.removeEventListener('change', handler);
}
