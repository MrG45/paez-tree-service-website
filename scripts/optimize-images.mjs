/**
 * Build responsive image encodings from the checked-in originals.
 * Run with `node scripts/optimize-images.mjs` after `npm ci`.
 * Original files and crop/aspect ratio remain unchanged. Dimensions in output
 * names are actual image widths, including when an original is smaller.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const assets = path.join(root, 'public', 'assets');
const outputRoot = path.join(assets, 'optimized');
const jobs = [
  ['generated/paez-trimming-v2.png', [640, 960]],
  ['generated/paez-removal-v3.png', [640, 960]],
  ['generated/paez-stump-v3.png', [640, 960]],
  ['generated/paez-palm-v2.png', [640, 960]],
  ['generated/paez-hoa-v2.png', [640, 960]],
  ['generated/paez-commercial-v3.png', [640, 960]],
  ['generated/paez-team-v2.png', [640, 1040]],
  ['site/hero-climber.webp', [800, 1280, 1600]],
  ['site/svc-trimming.webp', [640, 960]],
  ['site/hero-bg.jpg', [640, 960, 1600]],
  ['site/svc-stump.webp', [640, 960]],
  ['site/svc-palm.webp', [640, 960]],
  ['site/svc-hoa.webp', [640]],
  ['site/svc-commercial.webp', [640, 960]],
  ['site/svc-removal.jpg', [640, 960]],
  ['site/logo.gif', [280]],
  ['yelp-logo.png', [192]],
  ['yelp-logo-white.png', [192]],
  ['before-after/ba-02-backyard-large-tree-removal-before.jpg', [640, 1000]],
  ['before-after/ba-02-backyard-large-tree-removal-after.jpg', [640, 1000]],
  ['gallery/paez-01-climber-cutting-trunk.jpg', [640]],
  ['gallery/paez-02-crane-palm-removal-apartment.jpg', [640]],
  ['gallery/paez-03-stump-grinder-operator.jpg', [640]],
  ['gallery/paez-05-large-tree-removal-over-pool.jpg', [640]],
  ['gallery/paez-06-trimmed-trees-modern-building.jpg', [640]],
  ['gallery/paez-07-bucket-truck-and-chipper-on-site.jpg', [640]],
];

const manifest = { encoder: `sharp ${sharp.versions.sharp}`, images: [] };
for (const [source, requestedWidths] of jobs) {
  const original = path.join(assets, source);
  const metadata = await sharp(original, { animated: true }).metadata();
  if ((metadata.pages || 1) !== 1) {
    throw new Error(`Refusing to flatten animated image: ${source}`);
  }
  const entry = {
    source: `/assets/${source}`,
    width: metadata.width,
    height: metadata.height,
    originalBytes: (await fs.stat(original)).size,
    frames: metadata.pages || 1,
    variants: [],
  };
  const widths = [...new Set(requestedWidths.map(width => Math.min(width, metadata.width)))];
  const isBrandMark = source.includes('logo');
  const formats = isBrandMark ? ['webp'] : ['avif', 'webp'];
  for (const width of widths) {
    for (const format of formats) {
      const filename = `${source.replace(/\.[^.]+$/, '')}-${width}.${format}`;
      const destination = path.join(outputRoot, filename);
      await fs.mkdir(path.dirname(destination), { recursive: true });
      const pipeline = sharp(original).resize({ width, withoutEnlargement: true });
      if (format === 'avif') pipeline.avif({ quality: 55, effort: 5 });
      else if (isBrandMark) pipeline.webp({ lossless: true, effort: 6 });
      else pipeline.webp({ quality: 78, effort: 6 });
      const result = await pipeline.toFile(destination);
      entry.variants.push({
        src: `/assets/optimized/${filename}`,
        width: result.width,
        height: result.height,
        format,
        bytes: result.size,
      });
    }
  }
  manifest.images.push(entry);
  console.log(`${source}: ${entry.originalBytes} B → ${entry.variants.map(v => `${v.width}w ${v.format} ${v.bytes} B`).join(', ')}`);
}
const manifestPath = path.join(outputRoot, 'manifest.json');
const pendingManifestPath = `${manifestPath}.tmp`;
await fs.writeFile(pendingManifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
await fs.rename(pendingManifestPath, manifestPath);
