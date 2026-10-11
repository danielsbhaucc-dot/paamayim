/**
 * שירות התוכן: קריאה/כתיבה של מסמכי פרשה לפי הסכמה, טיוטה/פרסום לכל שדה,
 * פרסום (כולל עדכון src/content/bundled.json באותה כתיבה), ברכות/משפטי סטטוס ותיקוני נוסח אונקלוס.
 */
import {
  buildOutputs,
  docStats,
  entryStatus,
  fieldFor,
  isEmptyValue,
  sameValue,
  normalizeValue,
  publishEntry,
  setDraft,
  storageKeys,
  unpublishEntry,
  type ContentDoc,
  type Entry,
} from '../../scripts/content/lib.mjs';
import { gematria } from './hebrew';
import { BOOKS, PathError, VERSE_ID_RE, paths, type Book } from './paths';
import { readJson, type Change, type Storage } from './storage/types';

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

type Corpus = { he: string; chapters: { h: string; o: string }[][] };
export type VerseRow = { id: string; ref: string; chapter: number; verse: number; h: string; o: string; aliyah: number | null };

const json = (v: unknown) => JSON.stringify(v, null, 2) + '\n';

function parseRange(range: string): { book: Book; from: [number, number]; to: [number, number] } | null {
  const m = /^([A-Za-z]+) (\d+):(\d+)-(?:(\d+):)?(\d+)$/.exec(range?.trim() ?? '');
  if (!m) return null;
  const book = m[1].toLowerCase() as Book;
  if (!(BOOKS as readonly string[]).includes(book)) return null;
  const c1 = +m[2];
  const v1 = +m[3];
  const c2 = m[4] ? +m[4] : c1;
  const v2 = +m[5];
  return { book, from: [c1, v1], to: [c2, v2] };
}

export class ContentService {
  private chain: Promise<unknown> = Promise.resolve();
  private corpusCache = new Map<string, Corpus>();
  private schemaCache: any = null;
  /** מטמון קצר לרשימת הפרשות — מונע קריאה סדרתית של 54 קבצים בכל ניווט */
  private docsCache: { at: number; docs: ContentDoc[] } | null = null;
  private static DOCS_TTL_MS = 12_000;

  constructor(public storage: Storage) {}

  /** כל הכתיבות עוברות בתור אחד — אין דריסה בין עורך ל-AI שרץ ברקע */
  private serial<T>(fn: () => Promise<T>): Promise<T> {
    const next = this.chain.then(fn, fn);
    this.chain = next.catch(() => undefined);
    return next;
  }

  private invalidateDocs() {
    this.docsCache = null;
  }

  async schema() {
    if (!this.schemaCache) this.schemaCache = await readJson(this.storage, paths.schema());
    if (!this.schemaCache) throw new HttpError(500, 'content/schema.json חסר');
    return this.schemaCache;
  }

  async corpus(book: Book): Promise<Corpus> {
    const hit = this.corpusCache.get(book);
    if (hit) return hit;
    const c = await readJson<Corpus>(this.storage, paths.corpus(book));
    if (!c) throw new HttpError(500, `קורפוס חסר: ${book}`);
    this.corpusCache.set(book, c);
    return c;
  }

  async slugs(): Promise<string[]> {
    return (await this.storage.list(paths.parashotDir()))
      .filter((f) => f.endsWith('.json'))
      .map((f) => f.slice(0, -5))
      .filter((s) => /^[a-z0-9-]+$/.test(s));
  }

  async doc(slug: string): Promise<ContentDoc> {
    const d = await readJson<ContentDoc>(this.storage, paths.parasha(slug));
    if (!d) throw new HttpError(404, 'פרשה לא נמצאה');
    return d;
  }

  async allDocs(force = false): Promise<ContentDoc[]> {
    if (!force && this.docsCache && Date.now() - this.docsCache.at < ContentService.DOCS_TTL_MS) {
      return this.docsCache.docs;
    }
    const slugs = await this.slugs();
    const docs = await Promise.all(slugs.map((s) => this.doc(s)));
    this.docsCache = { at: Date.now(), docs };
    return docs;
  }

  private orderKey(d: ContentDoc) {
    const r = parseRange(d.meta?.range);
    if (!r) return 1e9;
    return BOOKS.indexOf(r.book) * 1e6 + r.from[0] * 1e3 + r.from[1];
  }

  async list() {
    const schema = await this.schema();
    const docs = (await this.allDocs()).slice().sort((a, b) => this.orderKey(a) - this.orderKey(b));
    return docs.map((d) => ({
      slug: d.slug,
      name: d.meta?.name ?? d.slug,
      nameEn: d.meta?.nameEn ?? d.slug,
      book: d.meta?.book ?? '',
      bookHe: d.meta?.bookHe ?? '',
      rangeHe: d.meta?.rangeHe ?? '',
      stats: docStats(d, schema),
    }));
  }

  async verses(doc: ContentDoc): Promise<VerseRow[]> {
    const r = parseRange(doc.meta?.range);
    if (!r) return [];
    const c = await this.corpus(r.book);
    const aliyot = (doc.meta?.aliyot ?? [])
      .map((a: any) => ({ n: a.n as number, r: parseRange(a.ref) }))
      .filter((a: any) => a.r);
    const out: VerseRow[] = [];
    for (let ch = r.from[0]; ch <= r.to[0]; ch++) {
      const verses = c.chapters[ch - 1] ?? [];
      const start = ch === r.from[0] ? r.from[1] : 1;
      const end = ch === r.to[0] ? r.to[1] : verses.length;
      for (let v = start; v <= end; v++) {
        const row = verses[v - 1];
        if (!row) continue;
        const key = ch * 1000 + v;
        const al = aliyot.find((a: any) => key >= a.r.from[0] * 1000 + a.r.from[1] && key <= a.r.to[0] * 1000 + a.r.to[1]);
        out.push({ id: `${r.book}-${ch}-${v}`, ref: `${c.he} ${gematria(ch)}, ${gematria(v)}`, chapter: ch, verse: v, h: row.h, o: row.o, aliyah: al?.n ?? null });
      }
    }
    return out;
  }

  async get(slug: string) {
    const schema = await this.schema();
    const [doc, ordered] = await Promise.all([this.doc(slug), this.allDocs()]);
    const list = ordered.slice().sort((a, b) => this.orderKey(a) - this.orderKey(b));
    const i = list.findIndex((p) => p.slug === slug);
    return {
      doc,
      stats: docStats(doc, schema),
      verses: await this.verses(doc),
      prev: i > 0 ? list[i - 1].slug : null,
      next: i >= 0 && i < list.length - 1 ? list[i + 1].slug : null,
    };
  }

  private async mutate(slug: string, message: string, fn: (doc: ContentDoc, schema: any) => void, opts: { publish?: boolean } = {}) {
    return this.serial(async () => {
      const schema = await this.schema();
      const doc = await this.doc(slug);
      fn(doc, schema);
      const changes: Change[] = [{ path: paths.parasha(slug), content: json(doc) }];
      if (opts.publish) changes.push(...(await this.bundledChange(doc)));
      const res = await this.storage.write(changes, message, { skipBuild: !opts.publish });
      this.invalidateDocs();
      return { doc, stats: docStats(doc, schema), commit: res.commit };
    });
  }

  /** bundled.json מחושב מחדש מכל המסמכים (עם המסמך המעודכן) */
  private async bundledChange(updated: ContentDoc): Promise<Change[]> {
    const schema = await this.schema();
    const docs = (await this.allDocs()).map((d) => (d.slug === updated.slug ? updated : d));
    const out = buildOutputs(docs, schema);
    const prev = (await this.storage.read(paths.bundled()))?.toString('utf8');
    return prev === out.bundledJson ? [] : [{ path: paths.bundled(), content: out.bundledJson }];
  }

  private verseRow(doc: ContentDoc, verseId: string) {
    if (!VERSE_ID_RE.test(verseId)) throw new PathError('מזהה פסוק לא תקין');
    doc.verses ??= {};
    return (doc.verses[verseId] ??= {});
  }

  private fieldOrThrow(schema: any, key: string, scope: 'parasha' | 'verse') {
    const f = fieldFor(schema, key);
    if (!f || (f.scope ?? 'parasha') !== scope) throw new HttpError(400, `שדה לא מוכר: ${key}`);
    return f;
  }

  private validateSize(value: unknown) {
    if (JSON.stringify(value ?? null).length > 60000) throw new HttpError(413, 'הערך ארוך מדי');
  }

  saveField(slug: string, key: string, value: unknown, source = 'admin') {
    this.validateSize(value);
    return this.mutate(slug, `טיוטה: ${slug} · ${key}`, (doc, schema) => {
      const field = this.fieldOrThrow(schema, key, 'parasha');
      const v = normalizeValue(field, value);
      if (field.type === 'image' && v && !/^images\/[a-z0-9-]+\/[a-z0-9][a-z0-9.-]{0,80}\.webp$/.test(v)) throw new HttpError(400, 'נתיב תמונה לא תקין');
      doc.fields[key] = setDraft(doc.fields[key], v, source);
    });
  }

  saveVerseField(slug: string, verseId: string, key: string, value: unknown, source = 'admin') {
    this.validateSize(value);
    return this.mutate(slug, `טיוטה: ${slug} · ${verseId} · ${key}`, (doc, schema) => {
      const field = this.fieldOrThrow(schema, key, 'verse');
      const row = this.verseRow(doc, verseId);
      row[key] = setDraft(row[key], normalizeValue(field, value), source);
    });
  }

  /** שמירת כמה טיוטות יחד (AI מרוכז) — כתיבה אחת */
  saveMany(slug: string, items: { key: string; verseId?: string; value: unknown }[], source: string) {
    return this.mutate(slug, `טיוטות AI: ${slug} (${items.length})`, (doc, schema) => {
      for (const it of items) {
        this.validateSize(it.value);
        if (it.verseId) {
          const field = this.fieldOrThrow(schema, it.key, 'verse');
          const row = this.verseRow(doc, it.verseId);
          row[it.key] = setDraft(row[it.key], normalizeValue(field, it.value), source);
        } else {
          const field = this.fieldOrThrow(schema, it.key, 'parasha');
          doc.fields[it.key] = setDraft(doc.fields[it.key], normalizeValue(field, it.value), source);
        }
      }
    });
  }

  /**
   * פרסום. targets: מפתחות שדה ("lifeLessons.adult"), שדה פסוק ("v:genesis-1-1:onkelosExplanation"),
   * או שדה פסוק בכל הפסוקים ("v:*:onkelosExplanation"). בלי targets — כל הטיוטות בפרשה.
   */
  publish(slug: string, targets?: string[]) {
    let count = 0;
    return this.mutate(
      slug,
      `פרסום: ${slug}`,
      (doc, schema) => {
        const want = (key: string, verseId?: string) =>
          !targets || targets.includes(verseId ? `v:${verseId}:${key}` : key) || (!!verseId && targets.includes(`v:*:${key}`));
        for (const { storageKey } of storageKeys(schema, 'parasha')) {
          const e = doc.fields[storageKey];
          if (e?.draft !== undefined && want(storageKey)) {
            doc.fields[storageKey] = publishEntry(e);
            count++;
          }
        }
        const verseKeys = storageKeys(schema, 'verse').map((k) => k.storageKey);
        for (const [id, row] of Object.entries(doc.verses ?? {})) {
          for (const k of verseKeys) {
            const e = row[k];
            if (e?.draft !== undefined && want(k, id)) {
              row[k] = publishEntry(e);
              count++;
            }
          }
        }
        if (!count) throw new HttpError(400, 'אין טיוטות לפרסום');
      },
      { publish: true }
    ).then((r) => ({ ...r, published: count }));
  }

  discard(slug: string, key: string, verseId?: string) {
    return this.mutate(slug, `ביטול טיוטה: ${slug} · ${key}`, (doc, schema) => {
      if (verseId) {
        this.fieldOrThrow(schema, key, 'verse');
        const row = this.verseRow(doc, verseId);
        if (row[key]) {
          const e: Entry = { ...row[key] };
          delete e.draft;
          row[key] = e;
        }
      } else {
        this.fieldOrThrow(schema, key, 'parasha');
        const e = doc.fields[key];
        if (e) {
          const n: Entry = { ...e };
          delete n.draft;
          doc.fields[key] = n;
        }
      }
    });
  }

  unpublish(slug: string, key: string, verseId?: string) {
    return this.mutate(
      slug,
      `הסרת פרסום: ${slug} · ${key}`,
      (doc, schema) => {
        if (verseId) {
          this.fieldOrThrow(schema, key, 'verse');
          const row = this.verseRow(doc, verseId);
          row[key] = unpublishEntry(row[key]);
        } else {
          this.fieldOrThrow(schema, key, 'parasha');
          doc.fields[key] = unpublishEntry(doc.fields[key]);
        }
      },
      { publish: true }
    );
  }

  async preview(slug: string, drafts: boolean) {
    const { project } = await import('../../scripts/content/lib.mjs');
    return project(await this.doc(slug), await this.schema(), { drafts });
  }

  /** סטטוס של שדה (לתצוגה) */
  status(entry: Entry | undefined) {
    return entryStatus(entry);
  }

  // ---------- תמונות ----------
  saveImage(slug: string, key: string, file: string, data: Buffer) {
    return this.serial(async () => {
      const schema = await this.schema();
      const field = this.fieldOrThrow(schema, key, 'parasha');
      if (field.type !== 'image') throw new HttpError(400, 'השדה אינו תמונה');
      const doc = await this.doc(slug);
      const value = `images/${slug}/${file}`;
      doc.fields[key] = setDraft(doc.fields[key], value, 'admin:upload');
      await this.storage.write(
        [
          { path: paths.image(slug, file), content: data },
          { path: paths.parasha(slug), content: json(doc) },
        ],
        `תמונה (טיוטה): ${slug} · ${key}`,
        { skipBuild: true }
      );
      return { doc, stats: docStats(doc, schema), value };
    });
  }

  // ---------- פרסום סלקטיבי ----------
  private async prodDoc(slug: string): Promise<ContentDoc | null> {
    if (!this.storage.readProd) return null;
    const b = await this.storage.readProd(paths.parasha(slug));
    return b ? (JSON.parse(b.toString('utf8')) as ContentDoc) : null;
  }

  /** ערך ״מה יתפרסם״ של רשומה בטיוטות: הטיוטה אם יש, אחרת המפורסם */
  private static target(e: Entry | undefined) {
    if (!e) return undefined;
    return e.draft !== undefined ? e.draft : e.published;
  }

  private static differs(a: unknown, b: unknown) {
    const ea = a === undefined || isEmptyValue(a);
    const eb = b === undefined || isEmptyValue(b);
    if (ea && eb) return false;
    return ea !== eb || !sameValue(a, b);
  }

  /**
   * כל מה שממתין לפרסום: ערך בטיוטות (content-drafts) ששונה ממה שב-master.
   * במצב מקומי (בלי master נפרד) — רק טיוטות פתוחות.
   */
  async pending() {
    const schema = await this.schema();
    const docs = (await this.allDocs(true)).slice().sort((a, b) => this.orderKey(a) - this.orderKey(b));
    const pKeys = storageKeys(schema, 'parasha');
    const vKeys = storageKeys(schema, 'verse');
    const label = (k: { field: any; variant: string | null }) =>
      `${k.field.label ?? k.field.key}${k.variant ? ` · ${k.variant === 'child' ? 'ילדים' : k.variant === 'adult' ? 'מבוגרים' : k.variant}` : ''}`;
    const out: any[] = [];
    for (const d of docs) {
      const prod = this.storage.readProd ? await this.prodDoc(d.slug) : null;
      const items: any[] = [];
      const consider = (e: Entry | undefined, pe: Entry | undefined, k: any, verseId?: string) => {
        if (!e) return;
        const after = ContentService.target(e);
        const before = this.storage.readProd ? pe?.published : e.published;
        const open = e.draft !== undefined;
        if (!open && !(this.storage.readProd && ContentService.differs(after, before))) return;
        if (!ContentService.differs(after, before) && !open) return;
        items.push({
          id: `${d.slug}|${k.storageKey}|${verseId ?? ''}`,
          key: k.storageKey,
          verseId: verseId ?? null,
          label: label(k),
          kind: open ? 'draft' : 'unpromoted',
          before: before ?? null,
          after: after ?? null,
          reviewed: !!(e as any).reviewedAt && (!e.updatedAt || (e as any).reviewedAt >= e.updatedAt),
          updatedAt: e.updatedAt ?? null,
        });
      };
      for (const k of pKeys) consider(d.fields?.[k.storageKey], prod?.fields?.[k.storageKey], k);
      for (const [vid, row] of Object.entries(d.verses ?? {}))
        for (const k of vKeys) consider((row as any)[k.storageKey], (prod?.verses?.[vid] as any)?.[k.storageKey], k, vid);
      if (items.length) out.push({ slug: d.slug, name: d.meta?.name ?? d.slug, items });
    }
    // קובצי יישור: שונה בטיוטות ממה שב-master
    if (this.storage.readProd) {
      const files: any[] = [];
      for (const f of await this.storage.list(paths.alignmentDir())) {
        if (!/^[a-z0-9-]+\.json$/.test(f)) continue;
        const rel = `${paths.alignmentDir()}/${f}`;
        const a = (await this.storage.read(rel))?.toString('utf8') ?? null;
        const b = (await this.storage.readProd(rel))?.toString('utf8') ?? null;
        if (a !== null && a !== b) files.push({ id: `file|${rel}|`, key: rel, verseId: null, label: `יישור עברית–ארמית · ${f.replace('.json', '')}`, kind: 'file', before: null, after: null, reviewed: false });
      }
      if (files.length) out.push({ slug: '__files', name: 'קבצים נוספים', items: files });
    }
    return { parashot: out, mode: this.storage.kind };
  }

  /** סימון ״נבדק״ לפריט (נשמר בטיוטות בלבד) */
  markReviewed(slug: string, key: string, verseId: string | undefined, reviewed: boolean) {
    return this.mutate(slug, `נבדק: ${slug} · ${key}`, (doc, schema) => {
      const e = verseId ? (this.fieldOrThrow(schema, key, 'verse'), this.verseRow(doc, verseId)[key]) : (this.fieldOrThrow(schema, key, 'parasha'), doc.fields[key]);
      if (!e) throw new HttpError(404, 'הפריט לא נמצא');
      if (reviewed) (e as any).reviewedAt = new Date().toISOString();
      else delete (e as any).reviewedAt;
    });
  }

  /**
   * פרסום רק של הפריטים שנבחרו: commit אחד ל-master עם מסמכי הפרשה (ערכי master + הנבחרים בלבד)
   * ו-bundled.json מחושב מ-master; בטיוטות — אותם פריטים מסומנים כמפורסמים (השאר נשאר טיוטה).
   */
  publishSelected(ids: string[]) {
    if (!Array.isArray(ids) || !ids.length || ids.length > 5000) throw new HttpError(400, 'לא נבחרו פריטים');
    return this.serial(async () => {
      const schema = await this.schema();
      const bySlug = new Map<string, { key: string; verseId?: string }[]>();
      const fileIds: string[] = [];
      for (const id of ids) {
        const [slug, key, verseId] = String(id).split('|');
        if (slug === 'file') {
          if (!/^content\/alignment\/[a-z0-9-]+\.json$/.test(key)) throw new HttpError(400, 'קובץ לא מותר');
          fileIds.push(key);
          continue;
        }
        if (!slug || !key) throw new HttpError(400, 'מזהה פריט לא תקין');
        if (!bySlug.has(slug)) bySlug.set(slug, []);
        bySlug.get(slug)!.push({ key, verseId: verseId || undefined });
      }
      const github = !!this.storage.publishSelected;
      const draftDocs = new Map<string, ContentDoc>();
      const prodDocs = new Map<string, ContentDoc>();
      const images = new Set<string>();
      let count = 0;
      for (const [slug, list] of bySlug) {
        const d = await this.doc(slug);
        const p = github ? ((await this.prodDoc(slug)) ?? { ...JSON.parse(JSON.stringify(d)), fields: {}, verses: {} }) : d;
        for (const it of list) {
          const fieldScope = it.verseId ? 'verse' : 'parasha';
          this.fieldOrThrow(schema, it.key, fieldScope);
          const src: Entry | undefined = it.verseId ? (d.verses?.[it.verseId] as any)?.[it.key] : d.fields?.[it.key];
          if (!src) throw new HttpError(400, `אין מה לפרסם: ${slug} · ${it.key}`);
          const pub: Entry = publishEntry(src);
          delete (pub as any).reviewedAt;
          const prodEntry: Entry = { ...pub };
          delete (prodEntry as any).draft;
          if (it.verseId) {
            this.verseRow(d, it.verseId)[it.key] = pub;
            p.verses ??= {};
            ((p.verses[it.verseId] ??= {}) as any)[it.key] = prodEntry;
          } else {
            d.fields[it.key] = pub;
            p.fields ??= {};
            p.fields[it.key] = prodEntry;
          }
          const v = pub.published;
          if (typeof v === 'string' && /^images\/[a-z0-9-]+\/[a-z0-9][a-z0-9.-]{0,80}\.webp$/.test(v)) images.add(v);
          count++;
        }
        draftDocs.set(slug, d);
        prodDocs.set(slug, p);
      }
      const fileChanges: Change[] = [];
      for (const rel of fileIds) {
        const buf = await this.storage.read(rel);
        if (buf) fileChanges.push({ path: rel, content: buf });
        count++;
      }
      const message = `פרסום נבחר: ${[...bySlug.keys(), ...fileIds.map((f) => f.split('/').pop())].join(', ')} (${count})`;
      const draftChanges: Change[] = [...draftDocs].map(([slug, d]) => ({ path: paths.parasha(slug), content: json(d) }));
      if (!github) {
        if (!bySlug.size) {
          this.invalidateDocs();
          return { published: count, commit: undefined };
        }
        const all = (await this.allDocs(true)).map((x) => draftDocs.get(x.slug) ?? x);
        const out = buildOutputs(all, schema);
        draftChanges.push({ path: paths.bundled(), content: out.bundledJson });
        const res = await this.storage.write(draftChanges, message);
        this.invalidateDocs();
        return { published: count, commit: res.commit };
      }
      // bundled.json מתוך master בלבד (עם הנבחרים) — בלי טיוטות של אף אחד
      const prodAll: ContentDoc[] = [];
      for (const slug of await this.slugs()) prodAll.push(prodDocs.get(slug) ?? (await this.prodDoc(slug)) ?? (await this.doc(slug)));
      const bundled = buildOutputs(prodAll, schema).bundledJson;
      const prodChanges: Change[] = [...prodDocs].map(([slug, p]) => ({ path: paths.parasha(slug), content: json(p) }));
      if (bySlug.size) {
        prodChanges.push({ path: paths.bundled(), content: bundled });
        draftChanges.push({ path: paths.bundled(), content: bundled });
      }
      prodChanges.push(...fileChanges);
      for (const rel of images) {
        const buf = await this.storage.read(`content/${rel}`);
        if (buf) prodChanges.push({ path: `content/${rel}`, content: buf });
      }
      const res = await this.storage.publishSelected!(prodChanges, draftChanges, message);
      this.invalidateDocs();
      return { published: count, commit: res.commit };
    });
  }

  /** ״פרסום הפרשה הזאת״ — כל מה שממתין בה */
  async publishParasha(slug: string) {
    const { parashot } = await this.pending();
    const p = parashot.find((x: any) => x.slug === slug);
    if (!p) throw new HttpError(400, 'אין מה לפרסם בפרשה הזו');
    return this.publishSelected(p.items.map((i: any) => i.id));
  }

  // ---------- יישור עברית–ארמית (פיילוט) ----------
  async alignment(slug: string) {
    return (await readJson(this.storage, paths.alignment(slug))) ?? null;
  }

  /** עדכון סטטוס/סוג/הערה של ביטויים (שמירה אחת לכל המקבץ). האינדקסים לא משתנים מכאן. */
  saveAlignment(slug: string, edits: unknown) {
    if (!Array.isArray(edits) || edits.length > 2000) throw new HttpError(400, 'עריכות לא תקינות');
    return this.serial(async () => {
      const doc = await readJson<any>(this.storage, paths.alignment(slug));
      if (!doc) throw new HttpError(404, 'אין קובץ יישור');
      for (const e of edits as any[]) {
        const p = doc.verses?.[e?.verseId]?.[e?.index];
        if (!p) throw new HttpError(400, 'ביטוי לא נמצא');
        if (e.status !== undefined) {
          if (!['approved', 'draft', 'uncertain', 'rejected'].includes(e.status)) throw new HttpError(400, 'סטטוס לא תקין');
          p.status = e.status;
        }
        if (e.type !== undefined) {
          if (!['literal', 'reverence', 'expansion', 'reorder'].includes(e.type)) throw new HttpError(400, 'סוג לא תקין');
          p.type = e.type;
        }
        if (e.note !== undefined) {
          if (typeof e.note !== 'string' || e.note.length > 160) throw new HttpError(400, 'הערה ארוכה מדי');
          if (e.note.trim()) p.note = e.note.trim();
          else delete p.note;
        }
      }
      await this.storage.write([{ path: paths.alignment(slug), content: json(doc) }], `יישור: ${slug} (${(edits as any[]).length} עדכונים)`, { skipBuild: this.storage.kind === 'github' });
      return doc;
    });
  }

  /** תוצאת AI: קובץ יישור חדש/מעודכן כטיוטה (ביטויים שאושרו בעבר נשמרים כמו שהם) */
  saveAlignmentDraft(slug: string, data: { verses: Record<string, any[]>; generatedBy: string; reviewedBy: string; stats: any }) {
    return this.serial(async () => {
      const prev = await readJson<any>(this.storage, paths.alignment(slug));
      const verses: Record<string, any[]> = { ...data.verses };
      // פסוק שכבר יש בו ביטויים מאושרים — לא דורסים
      for (const [vid, list] of Object.entries(prev?.verses ?? {})) {
        if ((list as any[]).some((p) => p.status === 'approved')) verses[vid] = list as any[];
      }
      const doc = { parasha: slug, generatedBy: data.generatedBy, reviewedBy: data.reviewedBy, generatedAt: new Date().toISOString(), stats: data.stats, verses };
      await this.storage.write([{ path: paths.alignment(slug), content: JSON.stringify(doc, null, 1) + '\n' }], `יישור AI (טיוטה): ${slug}`, { skipBuild: true });
      return doc;
    });
  }

  // ---------- ברכות ומשפטי סטטוס ----------
  async greetings() {
    const published = await readJson(this.storage, paths.statusLines());
    const draft = await readJson(this.storage, paths.statusLinesDraft());
    return { published, draft };
  }

  saveGreetingsDraft(data: unknown) {
    const clean = validateStatusLines(data);
    return this.serial(async () => {
      await this.storage.write([{ path: paths.statusLinesDraft(), content: json(clean) }], 'טיוטה: משפטי סטטוס', { skipBuild: true });
      return this.greetings();
    });
  }

  publishGreetings() {
    return this.serial(async () => {
      const draft = await readJson(this.storage, paths.statusLinesDraft());
      if (!draft) throw new HttpError(400, 'אין טיוטה לפרסום');
      const clean = validateStatusLines(draft);
      await this.storage.write(
        [
          { path: paths.statusLines(), content: json(clean) },
          { path: paths.statusLinesDraft(), content: null },
        ],
        'פרסום: משפטי סטטוס'
      );
      return this.greetings();
    });
  }

  discardGreetings() {
    return this.serial(async () => {
      await this.storage.write([{ path: paths.statusLinesDraft(), content: null }], 'ביטול טיוטה: משפטי סטטוס', { skipBuild: true });
      return this.greetings();
    });
  }

  // ---------- תיקון נוסח אונקלוס (בקורפוס) ----------
  setOnkelosText(verseId: string, text: string) {
    const m = VERSE_ID_RE.exec(verseId);
    if (!m) throw new PathError('מזהה פסוק לא תקין');
    const clean = String(text ?? '').replace(/\s+/g, ' ').trim();
    if (!clean || clean.length > 1200) throw new HttpError(400, 'נוסח ריק או ארוך מדי');
    // רק אותיות עבריות, ניקוד/טעמים, רווחים ופיסוק בסיסי
    if (!/^[\u0590-\u05FF\s.,:;׃־'"״׳()[\]-]+$/.test(clean)) throw new HttpError(400, 'הנוסח יכול להכיל רק אותיות עבריות, ניקוד ופיסוק');
    const book = m[1] as Book;
    const ch = +m[2];
    const v = +m[3];
    return this.serial(async () => {
      const raw = await this.storage.read(paths.corpus(book));
      if (!raw) throw new HttpError(500, 'קורפוס חסר');
      const corpus = JSON.parse(raw.toString('utf8')) as Corpus;
      const row = corpus.chapters[ch - 1]?.[v - 1];
      if (!row) throw new HttpError(404, 'פסוק לא נמצא');
      const before = row.o;
      row.o = clean;
      // שומרים על פורמט הקובץ המקורי (שורה אחת או מעוצב)
      const compact = !raw.toString('utf8').includes('\n  ');
      await this.storage.write([{ path: paths.corpus(book), content: compact ? JSON.stringify(corpus) : json(corpus) }], `תיקון נוסח אונקלוס: ${verseId}`);
      this.corpusCache.set(book, corpus);
      return { verseId, before, after: clean };
    });
  }
}

const CATEGORIES = ['notStarted', 'midway', 'almostDone', 'finished', 'returning', 'friday', 'holiday'] as const;
const PLACEHOLDERS = new Set(['name', 'parasha', 'aliyah', 'remaining', 'done', 'left', 'percent', 'lastAliyah', 'verse', 'when']);

function cleanText(v: unknown, where: string): string {
  if (typeof v !== 'string') throw new HttpError(400, `${where}: צריך טקסט`);
  const s = v.replace(/\s+/g, ' ').trim();
  if (!s || s.length > 300) throw new HttpError(400, `${where}: ריק או ארוך מדי`);
  for (const m of s.matchAll(/\{(\w+)\}/g)) if (!PLACEHOLDERS.has(m[1])) throw new HttpError(400, `${where}: מציין לא מוכר {${m[1]}}`);
  return s;
}

function cleanGendered(v: unknown, where: string) {
  if (typeof v === 'string') return cleanText(v, where);
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    const o = v as Record<string, unknown>;
    return { m: cleanText(o.m, `${where} (זכר)`), f: cleanText(o.f, `${where} (נקבה)`), p: cleanText(o.p, `${where} (רבים)`) };
  }
  throw new HttpError(400, `${where}: צריך טקסט או {m,f,p}`);
}

/** בדיקת מבנה קובץ משפטי הסטטוס — מה שהאפליקציה מצפה לו בדיוק */
export function validateStatusLines(data: any) {
  if (!data || typeof data !== 'object') throw new HttpError(400, 'מבנה לא תקין');
  const out: any = { $comment: typeof data.$comment === 'string' ? data.$comment : undefined, version: Number(data.version) || 1, rules: {}, ctas: {}, lines: {} };
  const rules = data.rules ?? {};
  // תאימות: קובץ ישן עם returningAfterDays → שעות
  if (rules.returningAfterHours == null && rules.returningAfterDays != null) rules.returningAfterHours = Number(rules.returningAfterDays) * 24;
  for (const k of ['returningAfterHours', 'almostDoneRemaining', 'almostDonePercent']) {
    const n = Number(rules[k]);
    if (!Number.isFinite(n) || n < 0 || n > 100) throw new HttpError(400, `כלל לא תקין: ${k}`);
    out.rules[k] = n;
  }
  for (const c of CATEGORIES) {
    const cta = data.ctas?.[c];
    if (!cta) throw new HttpError(400, `חסר כפתור לקטגוריה ${c}`);
    const route = String(cta.route ?? '');
    if (!/^\/[a-z-]*$/.test(route)) throw new HttpError(400, `נתיב לא תקין לכפתור ${c}`);
    out.ctas[c] = { label: cleanGendered(cta.label, `כפתור ${c}`), route };
    const lines = data.lines?.[c];
    if (!Array.isArray(lines) || lines.length < 1 || lines.length > 60) throw new HttpError(400, `קטגוריה ${c}: 1–60 משפטים`);
    out.lines[c] = lines.map((l: unknown, i: number) => cleanGendered(l, `${c} #${i + 1}`));
  }
  if (out.$comment === undefined) delete out.$comment;
  return out;
}
