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
import { hashString, project, projectedImages } from './lib.mjs';

const ROOT = process.cwd();
const SCHEMA = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/schema.json'), 'utf8'));
const SRC = path.join(ROOT, 'content/parashot');
const PUB = path.join(ROOT, 'public/content');
const BUNDLED = path.join(ROOT, 'src/content/bundled.json');

fs.rmSync(PUB, { recursive: true, force: true });
fs.mkdirSync(path.join(PUB, 'parashot'), { recursive: true });
fs.mkdirSync(path.dirname(BUNDLED), { recursive: true });

/** @type {Record<string, { hash: string; nameEn: string }>} */
const index = {};
/** @type {Record<string, any>} */
const bundled = {};
let images = 0;

for (const file of fs.readdirSync(SRC).filter((f) => f.endsWith('.json')).sort()) {
  const doc = JSON.parse(fs.readFileSync(path.join(SRC, file), 'utf8'));
  const p = project(doc, SCHEMA);
  if (!Object.keys(p.fields).length && !Object.keys(p.verses).length) continue;
  const json = JSON.stringify(p);
  const hash = hashString(json);
  index[p.slug] = { hash, nameEn: p.nameEn };
  bundled[p.slug] = p;
  fs.writeFileSync(path.join(PUB, 'parashot', `${p.slug}.json`), json);
  for (const rel of projectedImages(p, SCHEMA)) {
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
}

const version = hashString(JSON.stringify(index));
const indexDoc = { schemaVersion: SCHEMA.schemaVersion, version, generatedAt: new Date().toISOString(), parashot: index };
fs.writeFileSync(path.join(PUB, 'index.json'), JSON.stringify(indexDoc));

const nextBundled = JSON.stringify({ version, parashot: bundled }) + '\n';
const prev = fs.existsSync(BUNDLED) ? fs.readFileSync(BUNDLED, 'utf8') : '';
if (prev !== nextBundled) fs.writeFileSync(BUNDLED, nextBundled);

console.log(
  `תוכן מפורסם: ${Object.keys(index).length} פרשות · ${images} תמונות · גרסה ${version}` +
    (prev !== nextBundled ? ' · bundled.json עודכן' : '')
);
