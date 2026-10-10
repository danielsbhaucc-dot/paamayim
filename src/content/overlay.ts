import { parshiot } from '@hebcal/core';
import { parashaId } from '../data/parashot';
import type { ContentItem, Parasha, Verse } from '../data/types';
import { contentUrl } from './config';
import type { ContentProjection } from './types';

const ALL_SLUGS = new Set(parshiot.map((n) => parashaId([n])));

/** מזהה פרשה (גם כפולה, למשל vayakhel-pekudei) → slugs של הקבצים */
export function slugsForParasha(id: string): string[] {
  if (ALL_SLUGS.has(id)) return [id];
  for (const a of ALL_SLUGS) {
    if (id.startsWith(`${a}-`) && ALL_SLUGS.has(id.slice(a.length + 1))) return [a, id.slice(a.length + 1)];
  }
  return [];
}

const str = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() ? v : undefined);
const list = (v: unknown): ContentItem[] | undefined =>
  Array.isArray(v) && v.length ? (v as ContentItem[]) : undefined;

/** ערך טקסט מכל החלקים — רק אם לכל החלקים יש אותו (אחרת נשארים עם הנתון המקורי) */
function joined(parts: ContentProjection[], key: string, sep: string): string | undefined {
  const values = parts.map((p) => str(p.fields[key]));
  return values.every(Boolean) ? values.join(sep) : undefined;
}
function concat(parts: ContentProjection[], key: string): ContentItem[] | undefined {
  const all = parts.flatMap((p) => list(p.fields[key]) ?? []);
  return all.length ? all : undefined;
}

/**
 * מלביש את התוכן המפורסם על הפרשה שנבנתה מ-src/data (hebcal + קורפוס).
 * מחזיר אובייקט חדש; בלי תוכן רלוונטי מחזיר את אותו אובייקט בדיוק.
 */
export function applyContent(base: Parasha, docs: Record<string, ContentProjection>): Parasha {
  const parts = slugsForParasha(base.id)
    .map((s) => docs[s])
    .filter((d): d is ContentProjection => Boolean(d));
  if (!parts.length) return base;

  const story = { ...base.story };
  const title = joined(parts, 'storyTitle', ' · ');
  const adult = joined(parts, 'story.adult', '\n\n');
  const child = joined(parts, 'story.child', '\n\n');
  if (title) story.title = title;
  if (adult) story.adult = adult;
  if (child) story.child = child;

  const haftara = { ...base.haftara, whyThisHaftara: { ...base.haftara.whyThisHaftara } };
  if (!haftara.specialReason) {
    // כמו בקוד המקורי: ההפטרה של פרשה כפולה היא של החלק האחרון
    const last = parts[parts.length - 1];
    const hAdult = str(last.fields['haftaraStory.adult']);
    const hChild = str(last.fields['haftaraStory.child']);
    if (hAdult) haftara.storyAdult = hAdult;
    if (hChild) haftara.storyChild = hChild;
    const why = joined(parts, 'whyThisHaftara.adult', '\n\n');
    if (why) haftara.whyThisHaftara = { israel: why, diaspora: why };
    const whyChild = joined(parts, 'whyThisHaftara.child', '\n\n');
    if (whyChild) haftara.whyThisHaftaraChild = whyChild;
    const conn = parts.flatMap((p) => (Array.isArray(p.fields.haftaraConnections) ? (p.fields.haftaraConnections as string[]) : []));
    if (conn.length) haftara.connectionPoints = [...new Set(conn)];
  }

  // חידושים: עם פסוק (פרק:פסוק) → מוצמדים לפסוק; כולם גם ברשימת הפרשה
  const chidushim = concat(parts, 'chidushim');
  const byCv = new Map<string, ContentItem[]>();
  for (const c of chidushim ?? []) {
    const m = String(c.verse ?? '').match(/(\d+)\s*[:,]\s*(\d+)/);
    if (!m) continue;
    const k = `${Number(m[1])}:${Number(m[2])}`;
    byCv.set(k, [...(byCv.get(k) ?? []), c]);
  }

  const verseRows: Record<string, Record<string, unknown>> = Object.assign({}, ...parts.map((p) => p.verses ?? {}));
  const verses: Verse[] = base.verses.map((v) => {
    const row = verseRows[v.id];
    const linked = byCv.get(`${v.chapter}:${v.verse}`);
    if (!row && !linked) return v;
    const next: Verse = { ...v };
    const exp = row ? str(row.onkelosExplanation) : undefined;
    if (exp) next.onkelosExplanation = exp;
    const note = row?.onkelosNote as Partial<Verse['onkelosNote']> | undefined;
    if (note?.plain && note.did && note.why) next.onkelosNote = { plain: note.plain, did: note.did, why: note.why };
    if (linked) next.chidushim = linked;
    return next;
  });

  const img = (key: string) => {
    const rel = parts.map((p) => str(p.fields[key])).find(Boolean);
    return rel ? contentUrl(rel) : undefined;
  };
  const extras = {
    explanation: { adult: joined(parts, 'explanation.adult', '\n\n'), child: joined(parts, 'explanation.child', '\n\n') },
    stories: { adult: concat(parts, 'stories.adult'), child: concat(parts, 'stories.child') },
    storyByAliyah: { adult: concat(parts, 'storyByAliyah.adult'), child: concat(parts, 'storyByAliyah.child') },
    lifeLessons: { adult: concat(parts, 'lifeLessons.adult'), child: concat(parts, 'lifeLessons.child') },
    chidushim,
    kids: concat(parts, 'kids'),
    images: { hero: img('heroImage'), storyAdult: img('storyImage.adult'), storyChild: img('storyImage.child'), haftara: img('haftaraImage') },
  };

  return { ...base, story, haftara, verses, extras };
}
