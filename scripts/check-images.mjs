import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Jimp from 'jimp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const imagesDir = path.resolve(__dirname, '..', 'assets', 'images');

const FILES = [
  'bg-hero-sunrise.jpg',
  'bg-mist-sky.jpg',
  'bg-completion.jpg',
  'bg-calendar.jpg',
  'home-hero-tree.jpg',
  'haftara-prophet.jpg',
  'family-child-rainbow.jpg',
  'family-adult-study.jpg',
  'logo-mark.png',
  'trophy.png',
  'confetti-leaves.png',
  'app-icon-1024.png',
  'adaptive-icon-foreground.png',
];

const rows = [];

for (const name of FILES) {
  const full = path.join(imagesDir, name);
  if (!fs.existsSync(full)) {
    rows.push({ name, exists: false, size: '—', status: 'חסר' });
    continue;
  }
  try {
    const image = await Jimp.read(full);
    const w = image.bitmap.width;
    const h = image.bitmap.height;
    const dim = `${w}×${h}`;
    const bytes = fs.statSync(full).size;
    // placeholder שקוף 4×4, או העתק זמני קטן מאוד (< 2KB)
    let status = 'אמיתי';
    if (w <= 4 && h <= 4) status = 'placeholder';
    else if (bytes < 2048) status = 'placeholder';
    rows.push({ name, exists: true, size: dim, status });
  } catch (err) {
    rows.push({ name, exists: true, size: '?', status: `שגיאה: ${err.message}` });
  }
}

const nameW = Math.max(...rows.map((r) => r.name.length), 4);
const sizeW = Math.max(...rows.map((r) => r.size.length), 9);
const statusW = Math.max(...rows.map((r) => r.status.length), 6);

const line = (name, exists, size, status) =>
  `${name.padEnd(nameW)} | ${exists.padEnd(6)} | ${size.padEnd(sizeW)} | ${status.padEnd(statusW)}`;

console.log(line('שם', 'קיים?', 'רוחב×גובה', 'סטטוס'));
console.log('-'.repeat(nameW + sizeW + statusW + 18));
for (const r of rows) {
  console.log(line(r.name, r.exists ? 'כן' : 'לא', r.size, r.status));
}

// Machine-readable summary for follow-up
console.log('\n---JSON---');
console.log(JSON.stringify(rows, null, 2));
