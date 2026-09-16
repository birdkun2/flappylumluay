import sharp from 'sharp';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { ASSETS, CHARACTER_FRAMES, OBSTACLE_ART, BACKGROUND_FRAME } from '../src/game/config.js';

// Build-only: original PNGs and original crop coordinates remain editable.
// Copy RGBA rows directly so even nearly transparent edge pixels stay exact.
const output = new URL('../.generated/public/assets/', import.meta.url);
await mkdir(output, { recursive: true });
const crops = {
  character: CHARACTER_FRAMES, obstacle: OBSTACLE_ART.frames,
  background: { landscape: BACKGROUND_FRAME },
  shaftPattern: { [OBSTACLE_ART.shaftPattern.frame]: OBSTACLE_ART.shaftPattern.crop },
};
const manifest = {};
let originalBytes = 0;
let optimizedBytes = 0;
for (const [key, filename] of Object.entries(ASSETS)) {
  const original = await readFile(new URL(`../public/assets/${filename}`, import.meta.url));
  originalBytes += original.length;
  const { data, info } = await sharp(original).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const frames = crops[key] ?? { __BASE: [0, 0, info.width, info.height] };
  // Keep original coordinates and sheet dimensions: Canvas nearest-neighbor
  // sampling can change when a crop is moved inside a differently sized atlas.
  // Unused pixels become transparent and compress to almost nothing.
  const { width, height } = info;
  const pixels = Buffer.alloc(width * height * 4);
  const packed = {};
  for (const [name, [x, y, w, h]] of Object.entries(frames)) {
    if (x < 0 || y < 0 || x + w > info.width || y + h > info.height) throw Error(`Invalid crop: ${key}.${name}`);
    // Preserve a small sampling gutter for browser Canvas downscaling kernels.
    const left = Math.max(0, x - 8), right = Math.min(width, x + w + 8);
    const top = Math.max(0, y - 8), bottom = Math.min(height, y + h + 8);
    for (let row = top; row < bottom; row++) {
      const start = (row * info.width + left) * 4;
      data.copy(pixels, (row * width + left) * 4, start, start + (right - left) * 4);
    }
    if (name !== '__BASE') packed[name] = [x, y, w, h];
  }
  const encoded = await sharp(pixels, { raw: { width, height, channels: 4 } })
    .webp({ lossless: true, quality: 100, effort: 6, exact: true }).toBuffer();
  const decoded = await sharp(encoded).ensureAlpha().raw().toBuffer();
  if (!pixels.equals(decoded)) throw Error(`Lossless pixel verification failed: ${key}`);
  await writeFile(new URL(`${key}.webp`, output), encoded);
  manifest[key] = { file: `${key}.webp`, frames: packed };
  optimizedBytes += encoded.length;
  console.log(`${key}: ${original.length.toLocaleString()} -> ${encoded.length.toLocaleString()} bytes; RGBA identical`);
}
await writeFile(new URL('frames.json', output), JSON.stringify(manifest));
console.log(`Images: ${originalBytes.toLocaleString()} -> ${optimizedBytes.toLocaleString()} bytes (${(100 * (1 - optimizedBytes / originalBytes)).toFixed(1)}% smaller).`);
