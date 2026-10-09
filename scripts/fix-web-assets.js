/**
 * Cloudflare Pages לא מעלה תיקיות בשם node_modules.
 * expo export שם פונטים תחת dist/assets/node_modules/@expo-google-fonts/...
 * סקריפט זה מעביר אותם ל-dist/assets/vendor ומעדכן את כל ההפניות ב-JS/HTML/CSS.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const FROM_DIR = path.join(DIST, 'assets', 'node_modules');
const TO_DIR = path.join(DIST, 'assets', 'vendor');
const FROM_STR = '/assets/node_modules/';
const TO_STR = '/assets/vendor/';
const TEXT_EXT = new Set(['.js', '.html', '.css', '.json', '.map']);

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

function main() {
  if (!fs.existsSync(DIST)) {
    console.error('fix-web-assets: אין תיקיית dist — הריצו קודם expo export');
    process.exit(1);
  }

  if (fs.existsSync(FROM_DIR)) {
    if (fs.existsSync(TO_DIR)) {
      fs.rmSync(TO_DIR, { recursive: true, force: true });
    }
    fs.renameSync(FROM_DIR, TO_DIR);
    console.log('fix-web-assets: assets/node_modules → assets/vendor');
  } else if (fs.existsSync(TO_DIR)) {
    console.log('fix-web-assets: assets/vendor כבר קיים (אין node_modules)');
  } else {
    console.log('fix-web-assets: אין assets/node_modules — אין מה להעביר');
  }

  let patched = 0;
  for (const file of walk(DIST)) {
    const ext = path.extname(file).toLowerCase();
    if (!TEXT_EXT.has(ext)) continue;
    const raw = fs.readFileSync(file, 'utf8');
    if (!raw.includes(FROM_STR)) continue;
    fs.writeFileSync(file, raw.split(FROM_STR).join(TO_STR), 'utf8');
    patched += 1;
  }
  console.log(`fix-web-assets: עודכנו ${patched} קבצים`);

  // בדיקת שאריות
  const leftovers = walk(DIST).filter((f) => {
    const rel = path.relative(DIST, f).replace(/\\/g, '/');
    if (rel.includes('node_modules')) return true;
    const ext = path.extname(f).toLowerCase();
    if (!TEXT_EXT.has(ext)) return false;
    return fs.readFileSync(f, 'utf8').includes(FROM_STR) || fs.readFileSync(f, 'utf8').includes('assets/node_modules');
  });
  if (leftovers.length) {
    console.error('fix-web-assets: נשארו נתיבי node_modules:');
    for (const f of leftovers.slice(0, 20)) console.error('  ' + path.relative(DIST, f));
    process.exit(1);
  }
  console.log('fix-web-assets: אין שאריות node_modules ב-dist');
}

main();
