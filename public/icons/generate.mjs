import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : c >>> 1;
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function roundedRect(x, y, w, h, r, px, py) {
  const ix = clamp(px, x, x + w);
  const iy = clamp(py, y, y + h);
  if (ix !== px || iy !== py) return false;
  const left = x + r;
  const right = x + w - r;
  const top = y + r;
  const bottom = y + h - r;
  if (px >= left && px <= right) return true;
  if (py >= top && py <= bottom) return true;
  const corners = [
    [left, top],
    [right, top],
    [left, bottom],
    [right, bottom],
  ];
  return corners.some(([cx, cy]) => {
    const dx = px - cx;
    const dy = py - cy;
    return dx * dx + dy * dy <= r * r;
  });
}

function createPng(size) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const s = size;
  const pad = Math.round(s * 0.12);
  const winX = pad;
  const winY = pad;
  const winW = s - pad * 2;
  const winH = s - pad * 2;
  const radius = Math.max(2, Math.round(s * 0.1));
  const titleH = Math.max(3, Math.round(s * 0.22));
  const stroke = Math.max(1, Math.round(s * 0.045));
  const contentPad = Math.max(2, Math.round(s * 0.1));
  const barY = winY + titleH + stroke;
  const contentX = winX + contentPad;
  const contentY = barY + contentPad;
  const contentW = winW - contentPad * 2;
  const contentH = winY + winH - contentPad - contentY;
  const dotR = Math.max(1, Math.round(s * 0.045));
  const dotY = winY + Math.round(titleH / 2);
  const dotStart = winX + Math.round(winW * 0.16);
  const dotGap = Math.max(3, Math.round(s * 0.12));

  const bg = [247, 246, 242];
  const frame = [83, 106, 73];
  const title = [233, 238, 226];
  const content = [255, 255, 255];
  const accent = [143, 173, 125];

  const stride = 1 + size * 3;
  const raw = Buffer.alloc(stride * size);

  for (let y = 0; y < size; y++) {
    const row = y * stride;
    raw[row] = 0;
    for (let x = 0; x < size; x++) {
      const i = row + 1 + x * 3;
      let c = bg;

      const inWindow = roundedRect(winX, winY, winW, winH, radius, x, y);
      if (inWindow) {
        c = content;
        if (y < winY + titleH) c = title;
        if (y >= barY && y < barY + stroke) c = frame;

        // window outline (inner edge)
        const nearEdge =
          x < winX + stroke ||
          x > winX + winW - stroke - 1 ||
          y < winY + stroke ||
          y > winY + winH - stroke - 1;
        if (nearEdge) c = frame;

        // content pane
        if (
          x >= contentX &&
          x < contentX + contentW &&
          y >= contentY &&
          y < contentY + contentH
        ) {
          c = content;
          // soft accent bar suggesting a page hero
          const accentTop = contentY + Math.round(contentH * 0.28);
          const accentH = Math.max(2, Math.round(contentH * 0.12));
          if (y >= accentTop && y < accentTop + accentH) c = accent;
        }

        // traffic-light dots
        for (let d = 0; d < 3; d++) {
          const cx = dotStart + d * dotGap;
          const dx = x - cx;
          const dy = y - dotY;
          if (dx * dx + dy * dy <= dotR * dotR) c = frame;
        }
      }

      raw[i] = c[0];
      raw[i + 1] = c[1];
      raw[i + 2] = c[2];
    }
  }

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

for (const size of [16, 32, 48, 128]) {
  writeFileSync(join(__dirname, `icon${size}.png`), createPng(size));
}

console.log('browser-window icons generated');
