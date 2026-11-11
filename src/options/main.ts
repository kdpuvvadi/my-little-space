import { loadSettings, saveSettings } from '../shared/storage';
import { applyTheme, watchSystemTheme } from '../shared/theme';
import { createSettingsPanel } from '../newtab/ui/settingsPanel';
import '../newtab/styles.css';

async function main(): Promise<void> {
  const app = document.getElementById('app');
  if (!app) return;

  document.body.classList.add('options-body');

  let settings = await loadSettings();
  applyTheme(settings.theme);
  let stopThemeWatch = watchSystemTheme(settings.theme, () => applyTheme(settings.theme));

  const panel = createSettingsPanel({
    variant: 'page',
    mount: app,
    onChange: async (next) => {
      settings = next;
      applyTheme(settings.theme);
      stopThemeWatch();
      stopThemeWatch = watchSystemTheme(settings.theme, () => applyTheme(settings.theme));
      await saveSettings(next);
      panel.setSettings(next);
    },
    onImport: async (next) => {
      settings = next;
      applyTheme(settings.theme);
      stopThemeWatch();
      stopThemeWatch = watchSystemTheme(settings.theme, () => applyTheme(settings.theme));
      await saveSettings(next);
      panel.setSettings(next);
      panel.open();
    },
  });

  panel.setSettings(settings);
  panel.open();
}

void main();
