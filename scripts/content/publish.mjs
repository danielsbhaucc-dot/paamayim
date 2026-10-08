#!/usr/bin/env node
/**
 * פרסום טיוטות משורת הפקודה (עד שאפליקציית הניהול זמינה, או לפרסום מרוכז).
 * עדיף: כפתור ״פרסום״ באדמין (npm run admin). הסקריפט נשאר לאוטומציה.
 *   npm run content:publish -- <slug...|--all> [--fields lifeLessons.adult,whyThisHaftara.adult,v.onkelosExplanation] [--dry]
 * בלי --fields: כל הטיוטות בפרשה. "v.<key>" = שדה פסוק (בכל הפסוקים).
 * אחרי פרסום: npm run content:build (או build:web) כדי שהאפליקציה תקבל את התוכן.
 */
import fs from 'node:fs';
import path from 'node:path';
import { publishEntry } from './lib.mjs';

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const all = args.includes('--all');
const fi = args.indexOf('--fields');
const fields = fi >= 0 ? new Set(String(args[fi + 1] ?? '').split(',').filter(Boolean)) : null;
const slugs = args.filter((a, i) => !a.startsWith('--') && !(fi >= 0 && i === fi + 1));
const dir = path.resolve('content/parashot');
if (!all && !slugs.length) {
  console.error('שימוש: npm run content:publish -- <slug...|--all> [--fields a,b,v.key] [--dry]');
  process.exit(1);
}
const files = all ? fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)) : slugs;
let total = 0;
for (const slug of files) {
  const file = path.join(dir, `${slug}.json`);
  if (!fs.existsSync(file)) {
    console.error(`לא נמצא: ${slug}`);
    continue;
  }
  const doc = JSON.parse(fs.readFileSync(file, 'utf8'));
  let n = 0;
  for (const [key, entry] of Object.entries(doc.fields ?? {})) {
    if (entry?.draft === undefined || (fields && !fields.has(key))) continue;
    doc.fields[key] = publishEntry(entry);
    n++;
  }
  for (const v of Object.values(doc.verses ?? {})) {
    for (const [key, entry] of Object.entries(v)) {
      if (entry?.draft === undefined || (fields && !fields.has(`v.${key}`))) continue;
      v[key] = publishEntry(entry);
      n++;
    }
  }
  total += n;
  if (n && !dry) fs.writeFileSync(file, JSON.stringify(doc, null, 2) + '\n');
  if (n) console.log(`${slug}: ${n} שדות פורסמו`);
}
console.log(`${dry ? '[ניסיון] ' : ''}סה״כ ${total} שדות פורסמו`);
