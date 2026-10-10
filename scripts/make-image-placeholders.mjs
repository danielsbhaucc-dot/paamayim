import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Jimp from 'jimp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const imagesDir = path.join(root, 'assets', 'images');

const copies = [
  ['assets/images/bg-hero-sunrise.jpg', 'assets/bg-galilee.jpg'],
  ['assets/images/bg-mist-sky.jpg', 'assets/bg-jerusalem.jpg'],
  ['assets/images/bg-completion.jpg', 'assets/bg-galilee.jpg'],
  ['assets/images/bg-calendar.jpg', 'assets/bg-galilee.jpg'],
  ['assets/images/home-hero-tree.jpg', 'assets/bg-galilee.jpg'],
  ['assets/images/haftara-prophet.jpg', 'assets/bg-jerusalem.jpg'],
  ['assets/images/family-child-rainbow.jpg', 'assets/family-child-galilee.jpg'],
  ['assets/images/family-adult-study.jpg', 'assets/family-study-jerusalem.jpg'],
];

const transparentPngs = [
  'assets/images/logo-mark.png',
  'assets/images/trophy.png',
  'assets/images/confetti-leaves.png',
];

const created = [];
const existed = [];

if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
  console.log(`Created directory: assets/images/`);
}

for (const [destRel, srcRel] of copies) {
  const dest = path.join(root, destRel);
  const src = path.join(root, srcRel);
  if (fs.existsSync(dest)) {
    existed.push(destRel);
    continue;
  }
  if (!fs.existsSync(src)) {
    console.error(`Source missing: ${srcRel}`);
    process.exit(1);
  }
  fs.copyFileSync(src, dest);
  created.push(destRel);
}

for (const rel of transparentPngs) {
  const dest = path.join(root, rel);
  if (fs.existsSync(dest)) {
    existed.push(rel);
    continue;
  }
  const image = new Jimp(4, 4, 0x00000000);
  await image.writeAsync(dest);
  created.push(rel);
}

console.log('\nCreated:');
if (created.length === 0) console.log('  (none)');
else created.forEach((f) => console.log(`  + ${f}`));

console.log('\nAlready existed:');
if (existed.length === 0) console.log('  (none)');
else existed.forEach((f) => console.log(`  = ${f}`));
