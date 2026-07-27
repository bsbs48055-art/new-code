import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, '../public/icons');
mkdirSync(outDir, { recursive: true });

/** Minimal PNG encoder for solid rounded-ish brand icons (no external deps). */
function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i += 1) {
    c ^= buf[i];
    for (let k = 0; k < 8; k += 1) c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : c >>> 1;
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crcBuf = Buffer.alloc(4);
  const crc = crc32(Buffer.concat([typeBuf, data]));
  crcBuf.writeUInt32BE(crc);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function createPng(size, rgb = [0, 113, 227]) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = size * 3 + 1;
  const raw = Buffer.alloc(stride * size);
  const r = size / 2;
  for (let y = 0; y < size; y += 1) {
    raw[y * stride] = 0;
    for (let x = 0; x < size; x += 1) {
      const dx = x + 0.5 - r;
      const dy = y + 0.5 - r;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const inside = dist < r * 0.92;
      const ring = dist > r * 0.55 && dist < r * 0.78;
      const i = y * stride + 1 + x * 3;
      if (!inside) {
        raw[i] = 0;
        raw[i + 1] = 0;
        raw[i + 2] = 0;
        // transparent-ish dark for extension toolbar; keep opaque navy bg
        raw[i] = 11;
        raw[i + 1] = 18;
        raw[i + 2] = 32;
      } else if (ring) {
        raw[i] = 255;
        raw[i + 1] = 255;
        raw[i + 2] = 255;
      } else {
        raw[i] = rgb[0];
        raw[i + 1] = rgb[1];
        raw[i + 2] = rgb[2];
      }
    }
  }

  const compressed = deflateSync(raw);
  return Buffer.concat([signature, chunk('IHDR', ihdr), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))]);
}

for (const size of [16, 32, 48, 128]) {
  const file = resolve(outDir, `icon${size}.png`);
  writeFileSync(file, createPng(size));
  console.log('Wrote', file);
}
