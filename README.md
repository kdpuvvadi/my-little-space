# My Little Space

A calm, customizable new-tab extension for Chrome (and Safari via Web Extension conversion).

## Features

- Built-in new tab, or open a custom URL as a full page (iframes are blocked by many sites). Use the toolbar icon / options page to change settings while on a custom URL.
- Search with provider dropdown + bangs (`!g`, `!d`, …); edit bangs and add custom providers in Customize
- Shortcuts with auto icons (curated map → search Simple Icons / Dashboard Icons by host → DuckDuckGo → Google) and editable titles
- Full branding/copy customization (logo, all visible text)
- Light / dark / system theme
- Local-only storage + YAML export/import (no account sync)

## Develop

```bash
npm install
npm run dev
```

```bash
npm run build
```

Output is in `dist/`.

## Install from GitHub Release

1. Download the latest zip from  
   **[Latest release](https://github.com/kdpuvvadi/my-little-space/releases/latest)**  
   (`my-little-space-chrome-<version>.zip`)
2. Unzip it somewhere permanent (Chrome loads from that folder)
3. Open `chrome://extensions` (or `edge://extensions`)
4. Enable **Developer mode**
5. **Load unpacked** → select the unzipped folder
6. Open a new tab

## Develop / load from source

```bash
npm install
npm run build
```

Then **Load unpacked** → `dist/`.

```bash
npm run dev    # watch mode
npm run pack   # build + zip locally (same shape as the release asset)
```

Creating a GitHub Release (tag e.g. `v1.0.0`) runs the **Release** workflow, which:

1. Builds shared `dist/` once (`build-dist`)
2. Packs Chrome / Edge and Safari in parallel from that artifact
3. Pushes the site-meta Docker image to GHCR

Release assets:

- `my-little-space-chrome-<version>.zip` — Chrome / Edge (load unpacked or from the zip)
- `my-little-space-safari-<version>.zip` — unsigned macOS Safari wrapper app (from a macOS runner)

## Safari (macOS)

### From a release (unsigned)

1. Download `my-little-space-safari-<version>.zip` from the release, unzip it
2. Move `My Little Space.app` somewhere permanent (e.g. `/Applications`) and open it once
3. In Safari: **Settings → Developer** → enable **Allow unsigned extensions** (resets when Safari quits)
4. **Settings → Extensions** → enable **My Little Space**
5. Allow the extension to override the new-tab / start page as prompted

### Local convert + Xcode

1. Build this project (`npm run build`)
2. On a Mac with Xcode installed:

```bash
xcrun safari-web-extension-converter dist --app-name "My Little Space" --bundle-identifier com.kdpuvvadi.mls --macos-only --no-prompt --no-open
```

3. Open the generated Xcode project, sign with your team, and run
4. In Safari: **Settings → Extensions** → enable **My Little Space**
5. Allow the extension to override the new-tab / start page as prompted

Developer ID / App Store signing is separate; the release Safari zip is unsigned for local testing.

## YAML backup

In **Customize → Backup**:

- **Export** downloads your full config as YAML (mode, providers, branding, shortcuts)
- **Import** replaces local settings from a YAML file after confirmation

Unknown fields or invalid YAML are rejected (no partial apply).

## Permissions

- `storage` — local settings
- Optional host access (`http://*/*`, `https://*/*`) — only used if already granted; shortcut add / **Fetch** use the hostname + Google’s favicon CDN by default and do not prompt.
