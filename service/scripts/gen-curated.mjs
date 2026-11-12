import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const icons = fs.readFileSync(path.join(root, 'src/shared/siteIcons.ts'), 'utf8');
const titles = fs.readFileSync(path.join(root, 'src/shared/siteTitles.ts'), 'utf8');

const iconType = `export type SiteIconRef =
  | { source: 'simple'; id: string }
  | { source: 'dashboard'; id: string };

`;

const iconMapStart = icons.indexOf('export const SITE_ICON_MAP');
const iconMapEnd = icons.indexOf('\n};\n', iconMapStart) + 3;
const iconMap = icons.slice(iconMapStart, iconMapEnd);

const titleMapStart = titles.indexOf('export const SITE_TITLE_MAP');
const titleMapEnd = titles.indexOf('\n};\n', titleMapStart) + 3;
const titleMap = titles.slice(titleMapStart, titleMapEnd);

const out = path.join(root, 'service/src/curated.ts');
fs.writeFileSync(out, `${iconType}${iconMap}\n\n${titleMap}\n`);
console.log('wrote', out);
