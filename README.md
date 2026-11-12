# My Little Space

A calm, customizable new-tab extension for Chrome (and Safari via Web Extension conversion).

## Features

- Built-in new tab, or open a custom URL as a full page (iframes are blocked by many sites). Use the toolbar icon / options page to change settings while on a custom URL.
- Search with provider dropdown + bangs (`!g`, `!d`, …); edit bangs and add custom providers in Customize
- Shortcuts with auto icons (Simple Icons / Dashboard Icons → DuckDuckGo → Google favicon) and editable titles
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
   (`my-little-space-<version>.zip`)
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

Creating a GitHub Release (tag e.g. `v1.0.0`) runs the **Release** workflow, which builds and uploads the zip to that release.
## Safari (macOS)

Safari needs Apple’s converter and an Xcode wrapper (not produced on Windows):

1. Build this project (`npm run build`)
2. On a Mac with Xcode installed:

```bash
xcrun safari-web-extension-converter dist --app-name "My Little Space" --bundle-identifier com.example.mylittlespace
```

3. Open the generated Xcode project, sign with your team, and run
4. In Safari: **Settings → Extensions** → enable **My Little Space**
5. Allow the extension to override the new-tab / start page as prompted

Developer signing / App Store distribution are separate Safari steps.

## YAML backup

In **Customize → Backup**:

- **Export** downloads your full config as YAML (mode, providers, branding, shortcuts)
- **Import** replaces local settings from a YAML file after confirmation

Unknown fields or invalid YAML are rejected (no partial apply).

## Permissions

- `storage` — local settings
- Optional host access (`http://*/*`, `https://*/*`) — only used if already granted; shortcut add / **Fetch** use the hostname + Google’s favicon CDN by default and do not prompt.
