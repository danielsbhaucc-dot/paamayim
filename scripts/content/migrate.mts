/**
 * מיגרציה חד-פעמית (כבר הורצה): src/data → content/parashot/*.json
 * כל מה שהאפליקציה הציגה עד היום נכנס כ״מפורסם״, כך ששום דבר לא אובד ושום דבר במסכים לא משתנה.
 *
 * הרצה חוזרת (בטוחה — ממזגת רק שדות חסרים), משורש הריפו:
 *   npx esbuild scripts/content/migrate.mts --bundle --platform=node --format=esm --outfile=.migrate.mjs && node .migrate.mjs && del .migrate.mjs
 */
import { getLeyningForParsha, type Aliyah as LeyningAliyah } from '@hebcal/leyning';
import { parshiot } from '@hebcal/core';
import fs from 'node:fs';
import path from 'node:path';
import { HAFTARA_STORIES } from '../../src/data/haftaraStories';
import { stripNikud } from '../../src/data/hebrew';
import { HAND_NOTES } from '../../src/data/notes';
import { PARASHOT, parashaId } from '../../src/data/parashot';
import { STORIES } from '../../src/data/stories';
// @ts-ignore — מודול JS עם הגדרות ב-lib.d.mts
import { emptyDoc, isUsefulEntry } from './lib.mjs';

const ROOT = process.cwd(); // להריץ משורש הריפו
const OUT = path.join(ROOT, 'content/parashot');
const SOURCE = 'migrated:src/data';
const now = new Date().toISOString();

const pub = (value: unknown) => ({ published: value, publishedAt: now, updatedAt: now, source: SOURCE });

function ref(a: LeyningAliyah) {
  return `${a.k} ${a.b}-${a.e}`;
}
function refs(h: LeyningAliyah | LeyningAliyah[] | undefined) {
  if (!h) return undefined;
  return (Array.isArray(h) ? h : [h]).map(ref).join('; ');
}

fs.mkdirSync(OUT, { recursive: true });
let created = 0;
let merged = 0;

for (const name of parshiot) {
  const slug = parashaId([name]);
  const parasha = PARASHOT[slug];
  const reading = getLeyningForParsha(name);
  const aliyot = Array.from({ length: 7 }, (_, i) => reading.fullkriyah[String(i + 1)]).filter(Boolean);
  const first = aliyot[0];
  const last = aliyot[aliyot.length - 1];
  const meta = {
    slug,
    name: stripNikud(reading.name.he),
    nameEn: name,
    book: first.k,
    bookHe: parasha.verses[0]?.book,
    range: `${first.k} ${first.b}-${last.e}`,
    rangeHe: parasha.rangeLabel,
    verseCount: parasha.verses.length,
    aliyot: aliyot.map((a, i) => ({ n: i + 1, ref: ref(a) })),
    haftara: {
      ashkenazi: { ref: refs(reading.haft), refHe: parasha.haftara.sourceIsrael },
      sephardi: reading.seph ? { ref: refs(reading.seph) } : undefined,
    },
  };

  const file = path.join(OUT, `${slug}.json`);
  const exists = fs.existsSync(file);
  const doc = exists ? JSON.parse(fs.readFileSync(file, 'utf8')) : emptyDoc(slug, meta);
  doc.meta = { ...meta, ...(doc.meta ?? {}) };
  doc.fields ??= {};
  doc.verses ??= {};

  const put = (key: string, value: unknown) => {
    if (value == null || (typeof value === 'string' && !value.trim()) || (Array.isArray(value) && !value.length)) return;
    if (!isUsefulEntry(doc.fields[key])) doc.fields[key] = pub(value);
  };

  const story = STORIES[name];
  if (story) {
    put('storyTitle', story.title);
    put('story.adult', story.adult);
    put('story.child', story.child);
    put('whyThisHaftara.adult', story.why);
    put('haftaraConnections', story.connections);
    put('storyAnchors', story.anchors.map(([c, v]) => `${c}:${v}`));
  }
  const haft = HAFTARA_STORIES[name];
  if (haft) {
    put('haftaraStory.adult', haft.adult);
    put('haftaraStory.child', haft.child);
  }
  for (const verse of parasha.verses) {
    const note = HAND_NOTES[verse.id];
    if (!note) continue;
    doc.verses[verse.id] ??= {};
    if (!isUsefulEntry(doc.verses[verse.id].onkelosNote)) doc.verses[verse.id].onkelosNote = pub({ ...note });
  }

  fs.writeFileSync(file, JSON.stringify(doc, null, 2) + '\n');
  if (exists) merged++;
  else created++;
}

console.log(`מיגרציה: ${created} קבצים חדשים, ${merged} מוזגו → ${path.relative(ROOT, OUT)}`);
