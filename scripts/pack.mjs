import { createWriteStream, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const dist = join(root, 'dist');
const require = createRequire(import.meta.url);
const version = require(join(root, 'package.json')).version;
const zipName = `my-little-space-${version}.zip`;
const zipPath = join(root, zipName);

if (!existsSync(dist)) {
  console.error('dist/ missing — run npm run build first');
  process.exit(1);
}

function listFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...listFiles(full));
    else out.push(full);
  }
  return out;
}

// Prefer system zip when available (GitHub Actions / macOS / Linux / Git Bash).
const zipBin = process.platform === 'win32' ? null : 'zip';
if (zipBin) {
  const result = spawnSync(zipBin, ['-r', zipPath, '.'], {
    cwd: dist,
    stdio: 'inherit',
  });
  if (result.status === 0) {
    console.log(`Wrote ${zipName}`);
    process.exit(0);
  }
}

// Windows fallback via PowerShell Compress-Archive.
if (process.platform === 'win32') {
  const ps = `
    if (Test-Path -LiteralPath '${zipPath.replace(/'/g, "''")}') {
      Remove-Item -LiteralPath '${zipPath.replace(/'/g, "''")}' -Force
    }
    Compress-Archive -Path '${join(dist, '*').replace(/'/g, "''")}' -DestinationPath '${zipPath.replace(/'/g, "''")}'
  `;
  const result = spawnSync(
    'powershell.exe',
    ['-NoProfile', '-Command', ps],
    { stdio: 'inherit' },
  );
  if (result.status === 0) {
    console.log(`Wrote ${zipName}`);
    process.exit(0);
  }
  console.error('Failed to create zip with PowerShell');
  process.exit(result.status ?? 1);
}

console.error('No zip tool available');
process.exit(1);
