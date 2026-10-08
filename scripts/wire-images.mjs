/**
 * מעתיק/ממיר תמונות מ-assets/ (כולל שמות שגויים) אל assets/images/
 * בשמות ובפורמטים שהאפליקציה מצפה להם.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Jimp from 'jimp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const imagesDir = path.join(root, 'assets', 'images');
const assetsDir = path.join(root, 'assets');

if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

/** מקורות אפשריים לפי סדר עדיפות → יעד ב-assets/images */
const COPIES = [
  {
    dest: 'bg-mist-sky.jpg',
    sources: ['bg-mist-sky.jpg.jpg', 'bg-mist-sky.jpg', 'bg-jerusalem.jpg'],
  },
  {
    dest: 'bg-completion.jpg',
    sources: ['bg-completion.jpg'],
  },
  {
    dest: 'bg-calendar.jpg',
    sources: ['bg-calendar.jpg'],
  },
  {
    // אין קובץ ייעודי — משתמשים בנוף הזריחה מסיום / גליל
    dest: 'bg-hero-sunrise.jpg',
    sources: ['bg-hero-sunrise.jpg', 'bg-completion.jpg', 'bg-galilee.jpg'],
  },
  {
    dest: 'home-hero-tree.jpg',
    sources: ['home-hero-tree.jpg'],
  },
  {
    dest: 'haftara-prophet.jpg',
    sources: ['haftara-prophet.jpg'],
  },
  {
    dest: 'family-child-rainbow.jpg',
    sources: ['family-child-rainbow.jpg'],
  },
  {
    dest: 'family-adult-study.jpg',
    sources: ['family-adult-study.jpg', 'family-study-jerusalem.jpg'],
  },
];

const PNG_CONVERTS = [
  { dest: 'logo-leaf.png', sources: ['logo-leaf.png', 'logo-leaf.jpg'] },
  { dest: 'trophy.png', sources: ['trophy.png', 'trophy.jpg'] },
  { dest: 'confetti-leaves.png', sources: ['confetti-leaves.png', 'confetti-leaves.jpg'] },
];

const SQUARE_1024 = [
  {
    dest: 'app-icon-1024.png',
    sources: ['app-icon-1024.png', 'app-icon-1024.jpg', 'icon.png'],
  },
  {
    dest: 'adaptive-icon-foreground.png',
    sources: [
      'adaptive-icon-foreground.png',
      'adaptive-icon-foreground.png.jpg',
      'adaptive-icon.png',
    ],
  },
];

function findSource(sources) {
  for (const s of sources) {
    const p = path.join(assetsDir, s);
    if (fs.existsSync(p)) return p;
    const inImages = path.join(imagesDir, s);
    if (fs.existsSync(inImages) && fs.statSync(inImages).size > 200) return inImages;
  }
  return null;
}

async function toSquare1024(srcPath, destPath) {
  const image = await Jimp.read(srcPath);
  const w = image.bitmap.width;
  const h = image.bitmap.height;
  const side = Math.min(w, h);
  const x = Math.floor((w - side) / 2);
  const y = Math.floor((h - side) / 2);
  image.crop(x, y, side, side).resize(1024, 1024);
  await image.writeAsync(destPath);
}

const log = [];

for (const { dest, sources } of COPIES) {
  const src = findSource(sources);
  const out = path.join(imagesDir, dest);
  if (!src) {
    log.push(`SKIP ${dest} (no source)`);
    continue;
  }
  fs.copyFileSync(src, out);
  log.push(`COPY ${path.relative(root, src)} → images/${dest}`);
}

for (const { dest, sources } of PNG_CONVERTS) {
  const src = findSource(sources);
  const out = path.join(imagesDir, dest);
  if (!src) {
    log.push(`SKIP ${dest} (no source)`);
    continue;
  }
  const image = await Jimp.read(src);
  // אל תשמור 4×4 placeholder כ"אמיתי"
  if (image.bitmap.width <= 4 && image.bitmap.height <= 4) {
    log.push(`SKIP ${dest} (source is 4×4 placeholder)`);
    continue;
  }
  await image.writeAsync(out);
  log.push(
    `PNG  ${path.relative(root, src)} → images/${dest} (${image.bitmap.width}×${image.bitmap.height})`
  );
}

for (const { dest, sources } of SQUARE_1024) {
  const src = findSource(sources);
  const out = path.join(imagesDir, dest);
  if (!src) {
    log.push(`SKIP ${dest} (no source)`);
    continue;
  }
  await toSquare1024(src, out);
  log.push(`ICON ${path.relative(root, src)} → images/${dest} (1024×1024)`);
}

// ניקוי כפילויות/שגיאות הקלדה ב-assets/ (לא נוגעים במה ש-tokens/SideMenu/מגילה צריכים)
const REMOVE_FROM_ASSETS = [
  'adaptive-icon-foreground.png.jpg',
  'bg-mist-sky.jpg.jpg',
  'logo-leaf.jpg',
  'trophy.jpg',
  'confetti-leaves.jpg',
  'app-icon-1024.jpg',
  // כפילויות אחרי שהועתקו ל-images/
  'bg-calendar.jpg',
  'bg-completion.jpg',
  'home-hero-tree.jpg',
  'haftara-prophet.jpg',
  'family-child-rainbow.jpg',
  'family-adult-study.jpg',
  // אייקונים ישנים שאינם בשימוש אחרי app.json החדש
  'icon.jpg',
  'favicon.jpg',
  'splash-icon.jpg',
  'adaptive-icon.jpg',
];

for (const name of REMOVE_FROM_ASSETS) {
  const p = path.join(assetsDir, name);
  if (fs.existsSync(p)) {
    fs.unlinkSync(p);
    log.push(`DEL  assets/${name}`);
  }
}

console.log(log.join('\n'));
