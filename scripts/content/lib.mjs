// @ts-check
/**
 * ליבת מערכת התוכן — משותפת לסקריפטי הבנייה/הייבוא ולשרת האדמין.
 * בלי תלויות חיצוניות. ראו content/schema.json ו-.cursor/rules/design.mdc (סעיף התוכן).
 *
 * מבנה קובץ פרשה (content/parashot/<slug>.json, schemaVersion 2):
 * {
 *   schemaVersion: 2, slug, meta: {...},
 *   fields: { "<key>" | "<key>.<variant>": Entry },
 *   verses: { "<verseId>": { "<key>": Entry } }
 * }
 * Entry = { published?: value, draft?: value, updatedAt?, publishedAt?, source? }
 *   published = מה שהאפליקציה מציגה. draft = גרסה ממתינה (קיימת רק כשהיא שונה מהמפורסמת).
 */

export const SCHEMA_VERSION = 2;

/** @param {any} v */
export function isEmptyValue(v) {
  if (v == null) return true;
  if (typeof v === 'string') return v.trim() === '';
  if (Array.isArray(v)) return v.length === 0 || v.every((x) => isEmptyValue(x));
  if (typeof v === 'object') return Object.values(v).every((x) => isEmptyValue(x));
  return false;
}

/** @param {any} a @param {any} b */
export function sameValue(a, b) {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

/**
 * @param {any} entry
 * @returns {'empty'|'draft'|'changed'|'published'}
 */
export function entryStatus(entry) {
  if (!entry) return 'empty';
  const hasPub = !isEmptyValue(entry.published);
  const hasDraft = entry.draft !== undefined && !isEmptyValue(entry.draft);
  if (hasPub && hasDraft && !sameValue(entry.draft, entry.published)) return 'changed';
  if (hasPub) return 'published';
  if (hasDraft) return 'draft';
  return 'empty';
}

/**
 * כל מפתחות האחסון שהסכמה מגדירה.
 * @param {any} schema
 * @param {'parasha'|'verse'} [scope]
 * @returns {{ storageKey: string, field: any, variant: string | null }[]}
 */
export function storageKeys(schema, scope) {
  const out = [];
  for (const field of schema.fields) {
    if (scope && (field.scope ?? 'parasha') !== scope) continue;
    const variants = field.variants && field.variants.length ? field.variants : [null];
    for (const variant of variants) {
      out.push({ storageKey: variant ? `${field.key}.${variant}` : field.key, field, variant });
    }
  }
  return out;
}

/** @param {any} schema @param {string} storageKey */
export function fieldFor(schema, storageKey) {
  const [key, variant] = storageKey.split('.');
  const field = schema.fields.find((f) => f.key === key);
  if (!field) return null;
  if (variant && !(field.variants ?? []).includes(variant)) return null;
  if (!variant && field.variants && field.variants.length) return null;
  return field;
}

/**
 * בדיקה וניקוי ערך לפי סוג השדה. זורק שגיאה בעברית אם לא תקין.
 * @param {any} field @param {any} value
 */
export function normalizeValue(field, value) {
  const t = field.type;
  if (value == null) return value;
  if (t === 'text' || t === 'longtext' || t === 'image') {
    if (typeof value !== 'string') throw new Error(`השדה ${field.label} צריך להיות טקסט`);
    return t === 'text' ? value.replace(/\s+/g, ' ').trim() : value.replace(/\r\n/g, '\n').trim();
  }
  if (t === 'stringList') {
    if (!Array.isArray(value)) throw new Error(`השדה ${field.label} צריך להיות רשימה`);
    return value.map((s) => String(s).trim()).filter(Boolean);
  }
  if (t === 'list') {
    if (!Array.isArray(value)) throw new Error(`השדה ${field.label} צריך להיות רשימה`);
    return value
      .map((item) => {
        const o = {};
        for (const sub of field.item) {
          const raw = item?.[sub.key];
          if (raw == null) continue;
          const s = String(raw).replace(/\r\n/g, '\n').trim();
          if (s) o[sub.key] = sub.type === 'text' ? s.replace(/\s+/g, ' ') : s;
        }
        return o;
      })
      .filter((o) => Object.keys(o).length > 0);
  }
  if (t === 'group') {
    if (typeof value !== 'object' || Array.isArray(value)) throw new Error(`השדה ${field.label} צריך להיות אובייקט`);
    const o = {};
    for (const sub of field.subfields) {
      const s = String(value[sub.key] ?? '').trim();
      if (s) o[sub.key] = s;
    }
    return o;
  }
  return value;
}

/** @param {any} entry @param {any} value @param {string} [source] */
export function setDraft(entry, value, source) {
  const e = { ...(entry ?? {}) };
  if (isEmptyValue(value) || sameValue(value, e.published)) delete e.draft;
  else e.draft = value;
  e.updatedAt = new Date().toISOString();
  if (source) e.source = source;
  return e;
}

/** @param {any} entry */
export function publishEntry(entry) {
  if (!entry) return entry;
  const e = { ...entry };
  if (e.draft !== undefined) {
    if (isEmptyValue(e.draft)) delete e.published;
    else e.published = e.draft;
    delete e.draft;
  }
  e.publishedAt = new Date().toISOString();
  return e;
}

/** ביטול פרסום: הערך המפורסם חוזר להיות טיוטה (אם אין טיוטה חדשה יותר). */
export function unpublishEntry(entry) {
  if (!entry) return entry;
  const e = { ...entry };
  if (e.published !== undefined) {
    if (e.draft === undefined) e.draft = e.published;
    delete e.published;
  }
  delete e.publishedAt;
  return e;
}

/** @param {any} entry */
export function isUsefulEntry(entry) {
  return entry && (!isEmptyValue(entry.published) || (entry.draft !== undefined && !isEmptyValue(entry.draft)));
}

/** @param {string} slug */
export function emptyDoc(slug, meta = {}) {
  return { schemaVersion: SCHEMA_VERSION, slug, meta, fields: {}, verses: {} };
}

/**
 * הקרנה למה שהאפליקציה רואה.
 * @param {any} doc @param {any} schema @param {{ drafts?: boolean }} [opts]  drafts=true לתצוגה מקדימה בלבד
 */
export function project(doc, schema, opts = {}) {
  /** @param {any} e */
  const pick = (e) => {
    if (!e) return undefined;
    if (opts.drafts && e.draft !== undefined && !isEmptyValue(e.draft)) return e.draft;
    return isEmptyValue(e.published) ? undefined : e.published;
  };
  /** @type {Record<string, any>} */
  const fields = {};
  for (const { storageKey } of storageKeys(schema, 'parasha')) {
    const v = pick(doc.fields?.[storageKey]);
    if (v !== undefined) fields[storageKey] = v;
  }
  /** @type {Record<string, Record<string, any>>} */
  const verses = {};
  const verseKeys = storageKeys(schema, 'verse').map((k) => k.storageKey);
  for (const [id, row] of Object.entries(doc.verses ?? {})) {
    /** @type {Record<string, any>} */
    const o = {};
    for (const k of verseKeys) {
      const v = pick(/** @type {any} */ (row)[k]);
      if (v !== undefined) o[k] = v;
    }
    if (Object.keys(o).length) verses[id] = o;
  }
  return { slug: doc.slug, nameEn: doc.meta?.nameEn ?? doc.slug, fields, verses };
}

/**
 * סטטיסטיקה לרשימת הפרשות באדמין.
 * @param {any} doc @param {any} schema @param {number} [verseCount]
 */
export function docStats(doc, schema, verseCount) {
  const counts = { empty: 0, draft: 0, changed: 0, published: 0 };
  const total = storageKeys(schema, 'parasha').filter((k) => !k.field.legacy);
  for (const { storageKey } of total) counts[entryStatus(doc.fields?.[storageKey])]++;
  const verse = { published: 0, draft: 0, changed: 0 };
  for (const row of Object.values(doc.verses ?? {})) {
    const st = entryStatus(/** @type {any} */ (row).onkelosExplanation);
    if (st !== 'empty') verse[st]++;
  }
  const n = verseCount ?? doc.meta?.verseCount ?? 0;
  const filled = counts.draft + counts.changed + counts.published;
  return {
    fields: counts,
    fieldTotal: total.length,
    verses: verse,
    verseTotal: n,
    pendingDrafts: counts.draft + counts.changed + verse.draft + verse.changed,
    progress: total.length + n === 0 ? 0 : (filled + verse.published + verse.draft + verse.changed) / (total.length + n),
    publishedRatio: total.length + n === 0 ? 0 : (counts.published + counts.changed + verse.published + verse.changed) / (total.length + n),
  };
}

/** hash קצר ויציב (FNV-1a) — לגרסאות תוכן */
export function hashString(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36);
}

/** מזהה פרשה כמו באפליקציה (parashaId ב-src/data/parashot.ts) */
export function slugFromName(name) {
  return name.toLowerCase().replace(/['’]/g, '').replace(/\s+/g, '-');
}

/** כל ערכי התמונות שפורסמו בהקרנה (לנתיבי העתקה) */
export function projectedImages(projection, schema) {
  const out = [];
  for (const { storageKey, field } of storageKeys(schema, 'parasha')) {
    if (field.type === 'image' && projection.fields[storageKey]) out.push(projection.fields[storageKey]);
  }
  return out;
}

/**
 * מה שהבנייה מייצרת מכל המסמכים — משותף ל-build.mjs ולכפתור ״פרסום״ באדמין.
 * @param {any[]} docs  מסמכי פרשה (סדר לא משנה)
 * @param {any} schema
 * @returns {{ index: Record<string, { hash: string; nameEn: string }>, projections: Record<string, any>, version: string, bundledJson: string, images: string[] }}
 */
export function buildOutputs(docs, schema) {
  /** @type {Record<string, { hash: string; nameEn: string }>} */
  const index = {};
  /** @type {Record<string, any>} */
  const projections = {};
  /** @type {string[]} */
  const images = [];
  for (const doc of [...docs].sort((a, b) => String(a.slug).localeCompare(String(b.slug)))) {
    const p = project(doc, schema);
    if (!Object.keys(p.fields).length && !Object.keys(p.verses).length) continue;
    index[p.slug] = { hash: hashString(JSON.stringify(p)), nameEn: p.nameEn };
    projections[p.slug] = p;
    images.push(...projectedImages(p, schema));
  }
  const version = hashString(JSON.stringify(index));
  return { index, projections, version, bundledJson: JSON.stringify({ version, parashot: projections }) + '\n', images };
}
