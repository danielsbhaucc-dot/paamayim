#!/usr/bin/env node
// @ts-check
/**
 * ייבוא תוכן מה״כותב״ (פורמט schemaVersion 1, קובץ לכל פרשה) אל content/parashot (schemaVersion 2).
 * כל ערך חדש נכנס כטיוטה (draft). ערך זהה למה שכבר מפורסם — מדולג. שום דבר לא מתפרסם אוטומטית.
 *
 *   npm run content:import -- <תיקייה-עם-parashot/*.json או קובץ בודד>
 *   npm run content:import -- ../writer-output --dry
 */
import fs from 'node:fs';
import path from 'node:path';
import { emptyDoc, entryStatus, fieldFor, normalizeValue, sameValue, setDraft } from './lib.mjs';

const ROOT = process.cwd();
const SCHEMA = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/schema.json'), 'utf8'));
const OUT = path.join(ROOT, 'content/parashot');
const SOURCE = 'import:content-writer';

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const input = args.find((a) => !a.startsWith('--'));
if (!input) {
  console.error('שימוש: npm run content:import -- <תיקייה או קובץ>');
  process.exit(1);
}

/** @param {string} p */
function listFiles(p) {
  const st = fs.statSync(p);
  if (st.isFile()) return [p];
  const dir = fs.existsSync(path.join(p, 'parashot')) ? path.join(p, 'parashot') : p;
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => path.join(dir, f));
}

/** "Genesis 1:3" → "1:3" */
const cv = (ref) => String(ref).replace(/^.*?(\d+:\d+)$/, '$1');

/**
 * ממפה קובץ כותב → רשימת [מפתח אחסון, ערך] לפרשה, ו-[verseId, מפתח, ערך] לפסוקים.
 * שדה עליון שלא מוכר כאן אבל קיים בסכמה בשם זהה — נקלט כמו שהוא (הרחבה עתידית).
 * @param {any} w
 */
function mapWriter(w) {
  /** @type {[string, any][]} */
  const fields = [];
  /** @type {[string, string, any][]} */
  const verses = [];
  const known = new Set(['schemaVersion', 'status', 'meta', 'verses']);
  const add = (k, v) => v != null && fields.push([k, v]);

  if (w.story) {
    known.add('story');
    add('storyTitle', w.story.title);
    add('story.adult', w.story.adult);
    add('story.child', w.story.child);
    if (Array.isArray(w.story.anchorRefs)) add('storyAnchors', w.story.anchorRefs.map(cv));
  }
  if (w.haftaraStory) {
    known.add('haftaraStory');
    add('haftaraStory.adult', w.haftaraStory.adult);
    add('haftaraStory.child', w.haftaraStory.child);
  }
  const pairs = {
    haftaraConnectionPoints: 'haftaraConnections',
    whyThisHaftara: 'whyThisHaftara.adult',
    whyThisHaftaraChild: 'whyThisHaftara.child',
    lifeLessons: 'lifeLessons.adult',
    lifeLessonsChild: 'lifeLessons.child',
    explanation: 'explanation.adult',
    explanationChild: 'explanation.child',
    chidushim: 'chidushim',
    kids: 'kids',
    kidsContent: 'kids',
  };
  for (const [from, to] of Object.entries(pairs)) {
    if (w[from] !== undefined) {
      known.add(from);
      add(to, w[from]);
    }
  }
  for (const [k, v] of Object.entries(w)) {
    if (known.has(k)) continue;
    if (fieldFor(SCHEMA, k)) add(k, v);
    else console.warn(`  ! שדה לא מוכר בסכמה, דולג: ${k}`);
  }
  for (const v of w.verses ?? []) {
    for (const [k, val] of Object.entries(v)) {
      if (['id', 'ref', 'chapter', 'verse', 'hebrew', 'onkelos'].includes(k)) continue;
      const f = SCHEMA.fields.find((x) => x.key === k && x.scope === 'verse');
      if (f) verses.push([v.id, k, val]);
      else console.warn(`  ! שדה פסוק לא מוכר, דולג: ${k}`);
    }
  }
  return { fields, verses };
}

let total = { files: 0, drafts: 0, same: 0, verseDrafts: 0 };
for (const file of listFiles(path.resolve(input))) {
  const w = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (w.schemaVersion !== 1 || !w.meta?.slug) {
    console.warn(`דילוג (לא פורמט כותב v1): ${path.basename(file)}`);
    continue;
  }
  const slug = w.meta.slug;
  const target = path.join(OUT, `${slug}.json`);
  const doc = fs.existsSync(target) ? JSON.parse(fs.readFileSync(target, 'utf8')) : emptyDoc(slug, {});
  // מטא: נתוני הכותב (הפניות הפטרה בעברית, מקורות) משלימים את הקיים
  doc.meta = { ...doc.meta, sources: w.meta.sources, haftara: { ...(doc.meta.haftara ?? {}), ...(w.meta.haftara ?? {}) } };
  if (w.meta.rangeHe) doc.meta.rangeHeWriter = w.meta.rangeHe;

  const { fields, verses } = mapWriter(w);
  let d = 0;
  let s = 0;
  let vd = 0;
  for (const [key, raw] of fields) {
    const field = fieldFor(SCHEMA, key);
    if (!field) continue;
    const value = normalizeValue(field, raw);
    const cur = doc.fields[key];
    if (sameValue(value, cur?.published) || sameValue(value, cur?.draft)) {
      s++;
      continue;
    }
    doc.fields[key] = setDraft(cur, value, SOURCE);
    d++;
  }
  for (const [id, key, raw] of verses) {
    const field = SCHEMA.fields.find((x) => x.key === key && x.scope === 'verse');
    const value = normalizeValue(field, raw);
    doc.verses[id] ??= {};
    const cur = doc.verses[id][key];
    if (sameValue(value, cur?.published) || sameValue(value, cur?.draft)) continue;
    doc.verses[id][key] = setDraft(cur, value, SOURCE);
    vd++;
  }
  total.files++;
  total.drafts += d;
  total.same += s;
  total.verseDrafts += vd;
  console.log(`${slug}: ${d} שדות טיוטה, ${vd} הסברי פסוקים, ${s} זהים לקיים`);
  if (!dry) fs.writeFileSync(target, JSON.stringify(doc, null, 2) + '\n');
}
console.log(
  `${dry ? '[ניסיון] ' : ''}סה״כ ${total.files} פרשות · ${total.drafts} שדות · ${total.verseDrafts} פסוקים (הכול כטיוטה)`
);
// סטטוס לדוגמה כדי לוודא שהסכמה תקינה
void entryStatus;
