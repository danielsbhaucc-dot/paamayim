#!/usr/bin/env node
// @ts-check
/**
 * בניית התוכן המפורסם לאפליקציה (רק ערכים שפורסמו — טיוטות לא יוצאות לעולם):
 *   public/content/index.json              גרסה + hash לכל פרשה (האפליקציה בודקת מה השתנה)
 *   public/content/parashot/<slug>.json    הקרנה מפורסמת לכל פרשה שיש בה תוכן
 *   public/content/images/...              תמונות שפורסמו
 *   src/content/bundled.json               אותו תוכן, ארוז בתוך האפליקציה (גיבוי אופליין)
 *
 * expo export מעתיק את public/ לשורש ה-build, כך שבאתר זה זמין בנתיב קבוע: <host>/content/...
 *   npm run content:build
 */
import fs from 'node:fs';
import path from 'node:path';
import { buildOutputs } from './lib.mjs';

const ROOT = process.cwd();
const SCHEMA = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/schema.json'), 'utf8'));
const SRC = path.join(ROOT, 'content/parashot');
const PUB = path.join(ROOT, 'public/content');
const BUNDLED = path.join(ROOT, 'src/content/bundled.json');

fs.rmSync(PUB, { recursive: true, force: true });
fs.mkdirSync(path.join(PUB, 'parashot'), { recursive: true });
fs.mkdirSync(path.dirname(BUNDLED), { recursive: true });

const docs = fs
  .readdirSync(SRC)
  .filter((f) => f.endsWith('.json'))
  .sort()
  .map((file) => JSON.parse(fs.readFileSync(path.join(SRC, file), 'utf8')));
const { index, projections, version, bundledJson: nextBundled, images: imageList } = buildOutputs(docs, SCHEMA);
let images = 0;
for (const [slug, p] of Object.entries(projections)) {
  fs.writeFileSync(path.join(PUB, 'parashot', `${slug}.json`), JSON.stringify(p));
}
for (const rel of imageList) {
  // רק נתיבים בתוך content/images (הגנה מנתיב זדוני בתוכן)
  if (!/^images\/[\w./-]+$/.test(rel) || rel.includes('..')) {
    console.warn(`  ! נתיב תמונה לא תקין: ${rel}`);
    continue;
  }
  const from = path.join(ROOT, 'content', rel);
  const to = path.join(PUB, rel);
  if (!fs.existsSync(from)) {
    console.warn(`  ! תמונה חסרה: content/${rel}`);
    continue;
  }
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
  images++;
}

const indexDoc = { schemaVersion: SCHEMA.schemaVersion, version, generatedAt: new Date().toISOString(), parashot: index };
fs.writeFileSync(path.join(PUB, 'index.json'), JSON.stringify(indexDoc));

const prev = fs.existsSync(BUNDLED) ? fs.readFileSync(BUNDLED, 'utf8') : '';
if (prev !== nextBundled) fs.writeFileSync(BUNDLED, nextBundled);

// טקסטים לברכות/סטטוס: מועתקים גם לאתר (לשימוש עתידי בזמן ריצה)
const STATUS = path.join(ROOT, 'content/greetings/status-lines.json');
if (fs.existsSync(STATUS)) {
  fs.mkdirSync(path.join(PUB, 'greetings'), { recursive: true });
  fs.copyFileSync(STATUS, path.join(PUB, 'greetings/status-lines.json'));
}

console.log(
  `תוכן מפורסם: ${Object.keys(index).length} פרשות · ${images} תמונות · גרסה ${version}` +
    (prev !== nextBundled ? ' · bundled.json עודכן' : '')
);
