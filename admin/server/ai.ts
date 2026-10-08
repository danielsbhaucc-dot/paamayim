/**
 * AI: DeepSeek ישיר (ברירת מחדל) או OpenRouter (מודל זול עם עברית טובה).
 * כל פלט נשמר כטיוטה בלבד. לפני הרצה מרוכזת — הערכת עלות וטוקן אישור חתום.
 * המפתחות נקראים רק כאן, בצד השרת.
 */
import crypto from 'node:crypto';
import { entryStatus, fieldFor, type ContentDoc } from '../../scripts/content/lib.mjs';
import type { Config } from './config';
import { HttpError, type ContentService, type VerseRow } from './content';
import { SLUG_RE, VERSE_ID_RE } from './paths';
import { sefariaText } from './sefaria';

export type Provider = 'deepseek' | 'openrouter';
export type Price = { in: number; out: number; inPeak?: number; outPeak?: number };
export type ModelInfo = { id: string; name: string; price: Price; context?: number; recommended?: boolean; note?: string };

/** מחירי DeepSeek הרשמיים (USD למיליון טוקנים, cache miss). נבדק 2026-10-08 ב-api-docs.deepseek.com */
export const DEEPSEEK_MODELS: ModelInfo[] = [
  { id: 'deepseek-flash', name: 'DeepSeek V4.1 Flash', price: { in: 0.15, out: 0.6, inPeak: 0.3, outPeak: 1.2 }, context: 1_000_000, recommended: true, note: 'ברירת מחדל · זול מאוד' },
  { id: 'deepseek-v4-pro', name: 'DeepSeek V4 Pro', price: { in: 0.66, out: 1.98, inPeak: 1.32, outPeak: 3.96 }, context: 1_000_000 },
];

/** ברירות מחדל מומלצות ב-OpenRouter (עברית טובה, זול). המחיר החי נמשך מ-/api/v1/models */
export const OPENROUTER_RECOMMENDED: Record<string, string> = {
  'anthropic/claude-haiku-5.5': 'ברירת מחדל · עברית טבעית מאוד, זול',
  'google/gemini-3.1-flash-lite': 'זול, מהיר',
  'openai/gpt-5-mini': 'איכותי, יקר יותר בפלט',
  'deepseek/deepseek-v4.1-flash': 'DeepSeek דרך OpenRouter',
  'qwen/qwen3.8-flash': 'זול',
};
const OPENROUTER_FALLBACK: ModelInfo[] = [{ id: 'anthropic/claude-haiku-5.5', name: 'Anthropic: Claude Haiku 5.5', price: { in: 0.1, out: 0.5 }, recommended: true }];

/** שעות שיא של DeepSeek: א׳–ה׳ (UTC שני–שישי) 01–04 ו-06–10 UTC — המחיר כפול */
export function isDeepseekPeak(d = new Date()) {
  const day = d.getUTCDay();
  const h = d.getUTCHours();
  return day >= 1 && day <= 5 && ((h >= 1 && h < 4) || (h >= 6 && h < 10));
}

let orCache: { at: number; models: ModelInfo[] } | null = null;
export async function openrouterModels(fetchImpl: typeof fetch = fetch): Promise<ModelInfo[]> {
  if (orCache && Date.now() - orCache.at < 3600_000) return orCache.models;
  try {
    const res = await fetchImpl('https://openrouter.ai/api/v1/models', { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(String(res.status));
    const data = ((await res.json()) as any).data as any[];
    const models: ModelInfo[] = data
      .filter((m) => (m.architecture?.output_modalities ?? ['text']).includes('text') && !String(m.id).endsWith(':free'))
      .map((m) => ({
        id: m.id,
        name: m.name ?? m.id,
        price: { in: +(m.pricing?.prompt ?? 0) * 1e6, out: +(m.pricing?.completion ?? 0) * 1e6 },
        context: m.context_length,
        recommended: m.id in OPENROUTER_RECOMMENDED,
        note: OPENROUTER_RECOMMENDED[m.id],
      }))
      .filter((m) => m.price.in > 0 || m.price.out > 0);
    orCache = { at: Date.now(), models };
    return models;
  } catch {
    return orCache?.models ?? OPENROUTER_FALLBACK;
  }
}

export async function priceFor(provider: Provider, model: string, fetchImpl?: typeof fetch): Promise<{ price: Price; peak: boolean }> {
  if (provider === 'deepseek') {
    const m = DEEPSEEK_MODELS.find((x) => x.id === model);
    if (!m) throw new HttpError(400, 'מודל DeepSeek לא מוכר');
    const peak = isDeepseekPeak();
    return { price: peak ? { in: m.price.inPeak!, out: m.price.outPeak! } : m.price, peak };
  }
  const m = (await openrouterModels(fetchImpl)).find((x) => x.id === model);
  if (!m) throw new HttpError(400, 'מודל OpenRouter לא נמצא ברשימה החיה');
  return { price: m.price, peak: false };
}

// ---------------- פרומפטים ----------------

const SYSTEM = `את/ה כותב/ת תוכן לאפליקציית ״נהורא״ — לימוד פרשת השבוע בשיטת ״שניים מקרא ואחד תרגום״.
כללי כתיבה:
- עברית עכשווית, חמה, ברורה ומדויקת. משפטים קצרים. בלי מליצות ובלי סלנג.
- נאמנות לפשט הכתוב ולתרגום אונקלוס. אל תמציא/י מקורות, ציטוטים או מדרשים. אם לא בטוח — אל תכתוב/י.
- כבוד לכל קורא/ת, בלי הטפה, בלי פוליטיקה.
- שם ה׳ נכתב ״ה׳״. ציטוט מהפסוק — בגרשיים ״כך״.
- לגרסת ילדים: שפה פשוטה לגילאי 7–11, דימוי מוחשי אחד, בלי להקטין את הרעיון.
- אל תזכיר/י שאת/ה בינה מלאכותית.
- החזר/י JSON תקין בלבד, בלי טקסט מסביב.`;

export const PRESETS: Record<string, { label: string; instruction: string }> = {
  shorter: { label: 'לקצר', instruction: 'קצר/י בערך בחצי, בלי לאבד את הרעיון המרכזי.' },
  simpler: { label: 'לפשט', instruction: 'פשט/י את השפה: מילים יומיומיות, משפטים קצרים יותר.' },
  warmer: { label: 'חם ואישי יותר', instruction: 'הפוך/הפכי את הטון לחם ואישי יותר, בלי להוסיף תוכן חדש.' },
  child: { label: 'לגרסת ילדים', instruction: 'כתוב/כתבי מחדש לילדים בגילאי 7–11, עם דימוי מוחשי אחד.' },
  accurate: { label: 'קרוב יותר לפסוק', instruction: 'קרב/י את הניסוח לפשט הפסוק ולתרגום אונקלוס. הסר/י כל דבר שלא נובע מהטקסט.' },
  fixHebrew: { label: 'תיקון עברית', instruction: 'תקן/י רק דקדוק, כתיב, פיסוק וזרימה. אל תשנה/י תוכן.' },
  expand: { label: 'להרחיב מעט', instruction: 'הרחב/י מעט (משפט או שניים) בהסבר נוסף שנובע מהכתוב בלבד.' },
};

function storyOf(doc: ContentDoc, variant = 'adult') {
  const e = doc.fields?.[`story.${variant}`];
  return (e?.draft ?? e?.published ?? '') as string;
}

function haftaraRefs(doc: ContentDoc): string[] {
  const h = doc.meta?.haftara ?? {};
  const ref = (h.ashkenazi?.ref ?? h.sephardi?.ref ?? '') as string;
  if (!ref) return [];
  const book = ref.replace(/ \d.*$/, '');
  return ref.split(/,\s*/).map((seg) => (/^\d/.test(seg) ? `${book} ${seg}` : seg));
}

type Req = { slug: string; system: string; user: string; maxTokens: number; expectOutChars: number; apply: (out: any) => { key: string; verseId?: string; value: unknown }[] };

const T = (chars: number) => Math.ceil(chars / 2.2); // עברית (עם ניקוד) ≈ 2.2 תווים לטוקן — הערכה שמרנית

function explainRequests(doc: ContentDoc, verses: VerseRow[], mode: 'missing' | 'all'): Req[] {
  const todo = verses.filter((v) => mode === 'all' || entryStatus(doc.verses?.[v.id]?.onkelosExplanation) === 'empty');
  const out: Req[] = [];
  for (let i = 0; i < todo.length; i += 8) {
    const chunk = todo.slice(i, i + 8);
    const user = `פרשת ${doc.meta?.name}. לכל פסוק: הסבר של 1–3 משפטים פשוטים — מה אונקלוס עשה בתרגום (מילה ששינה, הוסיף, הבהיר) ולמה. אם התרגום מילולי, ציין/צייני דבר מעניין אחד בניסוח.
החזר/י {"items":[{"id":"…","text":"…"}]} לכל הפסוקים, באותו סדר.
${chunk.map((v) => `id: ${v.id}\nפסוק (${v.ref}): ${v.h}\nאונקלוס: ${v.o}`).join('\n\n')}`;
    out.push({
      slug: doc.slug,
      system: SYSTEM,
      user,
      maxTokens: 300 * chunk.length + 200,
      expectOutChars: 330 * chunk.length,
      apply: (o) =>
        (Array.isArray(o?.items) ? o.items : [])
          .filter((it: any) => chunk.some((v) => v.id === it?.id) && typeof it?.text === 'string' && it.text.trim())
          .map((it: any) => ({ key: 'onkelosExplanation', verseId: it.id, value: it.text })),
    });
  }
  return out;
}

async function whyHaftaraRequest(doc: ContentDoc, mode: 'missing' | 'all', haftaraText: string): Promise<Req[]> {
  const a = entryStatus(doc.fields?.['whyThisHaftara.adult']);
  const c = entryStatus(doc.fields?.['whyThisHaftara.child']);
  if (mode === 'missing' && a !== 'empty' && c !== 'empty') return [];
  const h = doc.meta?.haftara ?? {};
  const user = `פרשת ${doc.meta?.name} (${doc.meta?.rangeHe}). ההפטרה: ${h.ashkenazi?.refHe ?? ''}${h.sephardi?.refHe && h.sephardi?.refHe !== h.ashkenazi?.refHe ? ` (ספרדים: ${h.sephardi.refHe})` : ''}.
כתוב/כתבי ״למה קוראים דווקא את ההפטרה הזו?״ — הקשר בין ההפטרה לפרשה (נושא, מילה, דמות, מצב). מבוגרים: 3–5 משפטים. ילדים: 2–3 משפטים.
החזר/י {"adult":"…","child":"…"}.
${storyOf(doc) ? `תקציר הפרשה: ${storyOf(doc).slice(0, 1500)}\n` : ''}טקסט ההפטרה (ייתכן מקוצר): ${haftaraText.slice(0, 6000)}`;
  return [
    {
      slug: doc.slug,
      system: SYSTEM,
      user,
      maxTokens: 900,
      expectOutChars: 1000,
      apply: (o) => [
        ...(typeof o?.adult === 'string' && (mode === 'all' || a === 'empty') ? [{ key: 'whyThisHaftara.adult', value: o.adult }] : []),
        ...(typeof o?.child === 'string' && (mode === 'all' || c === 'empty') ? [{ key: 'whyThisHaftara.child', value: o.child }] : []),
      ],
    },
  ];
}

function lifeLessonsRequest(doc: ContentDoc, mode: 'missing' | 'all'): Req[] {
  const a = entryStatus(doc.fields?.['lifeLessons.adult']);
  const c = entryStatus(doc.fields?.['lifeLessons.child']);
  if (mode === 'missing' && a !== 'empty' && c !== 'empty') return [];
  const story = storyOf(doc);
  const user = `פרשת ${doc.meta?.name} (${doc.meta?.rangeHe}). כתוב/כתבי ״מה אפשר לקחת לחיים״: 3–4 לקחים למבוגרים ו-3 לילדים.
כל לקח: כותרת קצרה (2–5 מילים) וטקסט של 2–3 משפטים, מעוגן במה שקורה בפרשה (ציין/צייני את הרגע), ומעשי לשבוע הזה.
החזר/י {"adult":[{"title":"…","text":"…"}],"child":[{"title":"…","text":"…"}]}.
${story ? `תקציר הפרשה: ${story.slice(0, 2500)}` : ''}`;
  const clean = (arr: any) =>
    (Array.isArray(arr) ? arr : [])
      .filter((x: any) => typeof x?.title === 'string' && typeof x?.text === 'string')
      .slice(0, 4)
      .map((x: any) => ({ title: x.title, text: x.text }));
  return [
    {
      slug: doc.slug,
      system: SYSTEM,
      user,
      maxTokens: 1600,
      expectOutChars: 1800,
      apply: (o) => [
        ...(clean(o?.adult).length >= 3 && (mode === 'all' || a === 'empty') ? [{ key: 'lifeLessons.adult', value: clean(o.adult) }] : []),
        ...(clean(o?.child).length >= 2 && (mode === 'all' || c === 'empty') ? [{ key: 'lifeLessons.child', value: clean(o.child) }] : []),
      ],
    },
  ];
}

export type Task = 'explainVerses' | 'whyThisHaftara' | 'lifeLessons';
export const TASKS: Record<Task, string> = {
  explainVerses: 'הסבר אונקלוס לכל פסוק',
  whyThisHaftara: 'למה ההפטרה הזו (מבוגרים + ילדים)',
  lifeLessons: 'לקחים לחיים (מבוגרים + ילדים)',
};

// ---------------- קריאה למודל ----------------

type CallResult = { json: any; inTokens: number; outTokens: number };

function parseJson(text: string) {
  const t = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  try {
    return JSON.parse(t);
  } catch {
    const i = t.indexOf('{');
    const j = t.lastIndexOf('}');
    if (i >= 0 && j > i) return JSON.parse(t.slice(i, j + 1));
    throw new Error('המודל לא החזיר JSON תקין');
  }
}

function mockAnswer(user: string): any {
  const ids = [...user.matchAll(/^id: (\S+)$/gm)].map((m) => m[1]);
  if (ids.length) return { items: ids.map((id) => ({ id, text: `[טיוטת דמו] אונקלוס מבהיר כאן את הפסוק ${id.split('-').slice(1).join(':')} במילים פשוטות.` })) };
  if (user.includes('"adult":[')) {
    const l = (n: number, w: string) => Array.from({ length: n }, (_, i) => ({ title: `${w} ${i + 1}`, text: '[טיוטת דמו] לקח קצר שמעוגן ברגע מהפרשה, ומעשי לשבוע הזה.' }));
    return { adult: l(3, 'לקח'), child: l(3, 'רעיון') };
  }
  if (user.includes('"adult":"')) return { adult: '[טיוטת דמו] ההפטרה ממשיכה את הרעיון המרכזי של הפרשה ומחברת אותו לימי הנביא.', child: '[טיוטת דמו] גם בהפטרה מדברים על אותו רעיון — רק בזמן אחר.' };
  if (user.includes('"items":["')) return { items: ['[טיוטת דמו] נקודה ראשונה', '[טיוטת דמו] נקודה שנייה'] };
  if (user.includes('"items":[{')) return { items: [{ title: '[טיוטת דמו]', text: 'טקסט משוכתב.' }] };
  return { text: '[טיוטת דמו] ' + (/<<<([\s\S]*?)>>>/.exec(user)?.[1]?.trim().slice(0, 200) ?? 'טקסט משוכתב') };
}

export class AiService {
  constructor(
    private cfg: Config,
    private content: ContentService,
    private fetchImpl: typeof fetch = fetch
  ) {}

  providers() {
    return {
      deepseek: { configured: !!this.cfg.ai.deepseekKey || this.cfg.ai.mock, defaultModel: this.cfg.ai.deepseekModel },
      openrouter: { configured: !!this.cfg.ai.openrouterKey || this.cfg.ai.mock, defaultModel: this.cfg.ai.openrouterModel },
      defaultProvider: this.cfg.ai.defaultProvider,
      mock: this.cfg.ai.mock,
      maxJobUsd: this.cfg.ai.maxJobUsd,
      peakNow: isDeepseekPeak(),
    };
  }

  async models() {
    return { deepseek: DEEPSEEK_MODELS, openrouter: await openrouterModels(this.fetchImpl) };
  }

  private check(provider: Provider, model: string) {
    if (provider !== 'deepseek' && provider !== 'openrouter') throw new HttpError(400, 'ספק לא מוכר');
    if (typeof model !== 'string' || !/^[\w./:~-]{2,100}$/.test(model)) throw new HttpError(400, 'מודל לא תקין');
    if (!this.cfg.ai.mock && !(provider === 'deepseek' ? this.cfg.ai.deepseekKey : this.cfg.ai.openrouterKey))
      throw new HttpError(400, `אין מפתח ${provider === 'deepseek' ? 'DEEPSEEK_API_KEY' : 'OPENROUTER_API_KEY'} ב-admin/.env`);
  }

  async call(provider: Provider, model: string, system: string, user: string, maxTokens: number): Promise<CallResult> {
    if (this.cfg.ai.mock) {
      await new Promise((r) => setTimeout(r, 40));
      return { json: mockAnswer(user), inTokens: T(system.length + user.length), outTokens: 200 };
    }
    const url = provider === 'deepseek' ? 'https://api.deepseek.com/chat/completions' : 'https://openrouter.ai/api/v1/chat/completions';
    const key = provider === 'deepseek' ? this.cfg.ai.deepseekKey : this.cfg.ai.openrouterKey;
    const body: any = {
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.5,
      max_tokens: maxTokens,
      response_format: { type: 'json_object' },
    };
    if (provider === 'deepseek') body.thinking = { type: 'disabled' };
    const headers: Record<string, string> = { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` };
    if (provider === 'openrouter') {
      headers['HTTP-Referer'] = 'https://paamayim.pages.dev';
      headers['X-Title'] = 'Nahora Admin';
    }
    let lastErr: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await this.fetchImpl(url, { method: 'POST', headers, body: JSON.stringify(body), signal: AbortSignal.timeout(120000) });
        if (res.status === 400 && body.response_format) {
          delete body.response_format; // חלק מהמודלים לא תומכים — ננסה בלי
          continue;
        }
        if (res.status === 429 || res.status >= 500) throw Object.assign(new Error(`${provider} ${res.status}`), { retry: true });
        if (!res.ok) throw new Error(`${provider} ${res.status}: ${(await res.text()).slice(0, 160)}`);
        const d = (await res.json()) as any;
        const text = d.choices?.[0]?.message?.content ?? '';
        return { json: parseJson(text), inTokens: d.usage?.prompt_tokens ?? T(system.length + user.length), outTokens: d.usage?.completion_tokens ?? T(text.length) };
      } catch (e: any) {
        lastErr = e;
        if (!e?.retry && !(e?.name === 'TimeoutError')) break;
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
  }

  // ---------- הערכה ----------
  private async buildRequests(task: Task, slugs: string[], mode: 'missing' | 'all', withHaftaraText: boolean): Promise<Req[]> {
    const reqs: Req[] = [];
    for (const slug of slugs) {
      const doc = await this.content.doc(slug);
      if (task === 'explainVerses') reqs.push(...explainRequests(doc, await this.content.verses(doc), mode));
      else if (task === 'lifeLessons') reqs.push(...lifeLessonsRequest(doc, mode));
      else if (task === 'whyThisHaftara') {
        let text = 'x'.repeat(6000); // להערכה: הנחה של 6000 תווים
        if (withHaftaraText) {
          const parts: string[] = [];
          for (const ref of haftaraRefs(doc)) parts.push(...(await sefariaText(ref, { version: 'hebrew', fetchImpl: this.fetchImpl }).catch(() => [])));
          text = parts.join(' ');
        }
        reqs.push(...(await whyHaftaraRequest(doc, mode, text)));
      }
    }
    return reqs;
  }

  private validate(body: any) {
    const task = body?.task as Task;
    if (!(task in TASKS)) throw new HttpError(400, 'משימה לא מוכרת');
    const slugs: string[] = Array.isArray(body?.slugs) ? body.slugs : [];
    if (!slugs.length || slugs.length > 60 || !slugs.every((s) => typeof s === 'string' && SLUG_RE.test(s))) throw new HttpError(400, 'רשימת פרשות לא תקינה');
    const mode = body?.mode === 'all' ? 'all' : 'missing';
    const provider = body?.provider as Provider;
    const model = String(body?.model ?? '');
    this.check(provider, model);
    return { task, slugs: [...new Set(slugs)].sort(), mode: mode as 'missing' | 'all', provider, model };
  }

  private sign(payload: object) {
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    return `${body}.${crypto.createHmac('sha256', this.cfg.sessionSecret).update(`est:${body}`).digest('base64url')}`;
  }

  async estimate(body: any) {
    const p = this.validate(body);
    const reqs = await this.buildRequests(p.task, p.slugs, p.mode, false);
    const inTokens = reqs.reduce((s, r) => s + T(r.system.length + r.user.length), 0);
    const outTokens = reqs.reduce((s, r) => s + T(r.expectOutChars), 0);
    const { price, peak } = await priceFor(p.provider, p.model, this.fetchImpl);
    const usd = (inTokens * price.in + outTokens * price.out) / 1e6;
    const over = usd > this.cfg.ai.maxJobUsd;
    return {
      ...p,
      requests: reqs.length,
      inTokens,
      outTokens,
      usd: Math.round(usd * 10000) / 10000,
      price,
      peak,
      maxJobUsd: this.cfg.ai.maxJobUsd,
      over,
      token: over || !reqs.length ? null : this.sign({ ...p, exp: Date.now() + 15 * 60_000 }),
    };
  }

  // ---------- עבודות מרוכזות ----------
  private jobs = new Map<string, Job>();

  listJobs() {
    return [...this.jobs.values()].map(publicJob).reverse();
  }
  getJob(id: string) {
    const j = this.jobs.get(id);
    if (!j) throw new HttpError(404, 'עבודה לא נמצאה');
    return publicJob(j);
  }
  cancel(id: string) {
    const j = this.jobs.get(id);
    if (!j) throw new HttpError(404, 'עבודה לא נמצאה');
    j.cancelled = true;
    return publicJob(j);
  }

  start(body: any) {
    const token = String(body?.token ?? '');
    const dot = token.indexOf('.');
    const raw = token.slice(0, dot);
    const mac = crypto.createHmac('sha256', this.cfg.sessionSecret).update(`est:${raw}`).digest('base64url');
    if (dot < 1 || token.slice(dot + 1) !== mac) throw new HttpError(400, 'צריך קודם הערכת עלות');
    const p = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
    if (p.exp < Date.now()) throw new HttpError(400, 'הערכת העלות פגה — חשבו שוב');
    this.check(p.provider, p.model);
    if ([...this.jobs.values()].some((j) => j.status === 'running')) throw new HttpError(409, 'כבר רצה עבודה — חכו שתסתיים');
    const job: Job = {
      id: crypto.randomBytes(6).toString('hex'),
      task: p.task,
      label: TASKS[p.task as Task],
      provider: p.provider,
      model: p.model,
      slugs: p.slugs,
      status: 'running',
      total: 0,
      done: 0,
      saved: 0,
      usd: 0,
      errors: [],
      startedAt: new Date().toISOString(),
      cancelled: false,
    };
    this.jobs.set(job.id, job);
    if (this.jobs.size > 20) this.jobs.delete(this.jobs.keys().next().value as string);
    void this.run(job, p.mode).catch((e) => {
      job.status = 'failed';
      job.errors.push(String(e?.message ?? e));
    });
    return publicJob(job);
  }

  private async run(job: Job, mode: 'missing' | 'all') {
    const { price } = await priceFor(job.provider, job.model, this.fetchImpl);
    const reqs = await this.buildRequests(job.task as Task, job.slugs, mode, true);
    job.total = reqs.length;
    const bySlug = new Map<string, { key: string; verseId?: string; value: unknown }[]>();
    let i = 0;
    const worker = async () => {
      while (i < reqs.length && !job.cancelled) {
        const r = reqs[i++];
        try {
          const res = await this.call(job.provider, job.model, r.system, r.user, r.maxTokens);
          job.usd += (res.inTokens * price.in + res.outTokens * price.out) / 1e6;
          const items = r.apply(res.json);
          if (!items.length) job.errors.push(`${r.slug}: תשובה ריקה`);
          (bySlug.get(r.slug) ?? bySlug.set(r.slug, []).get(r.slug)!).push(...items);
        } catch (e: any) {
          job.errors.push(`${r.slug}: ${String(e?.message ?? e).slice(0, 160)}`);
        }
        job.done++;
      }
    };
    await Promise.all([worker(), worker(), worker()]);
    // שמירה: כתיבה אחת לכל פרשה (ב-GitHub = commit אחד לפרשה, בלי בנייה)
    for (const [slug, items] of bySlug) {
      if (!items.length) continue;
      try {
        await this.content.saveMany(slug, items, `ai:${job.provider}:${job.model}`);
        job.saved += items.length;
      } catch (e: any) {
        job.errors.push(`${slug}: שמירה נכשלה — ${String(e?.message ?? e).slice(0, 120)}`);
      }
    }
    job.usd = Math.round(job.usd * 10000) / 10000;
    job.status = job.cancelled ? 'cancelled' : 'done';
    job.finishedAt = new Date().toISOString();
  }

  // ---------- שכתוב שדה בודד ----------
  async rewrite(body: any) {
    const slug = String(body?.slug ?? '');
    const key = String(body?.key ?? '');
    const verseId = body?.verseId ? String(body.verseId) : undefined;
    const provider = body?.provider as Provider;
    const model = String(body?.model ?? '');
    if (!SLUG_RE.test(slug)) throw new HttpError(400, 'פרשה לא תקינה');
    if (verseId && !VERSE_ID_RE.test(verseId)) throw new HttpError(400, 'פסוק לא תקין');
    this.check(provider, model);
    const preset = body?.preset ? PRESETS[String(body.preset)] : null;
    const custom = typeof body?.instruction === 'string' ? body.instruction.trim().slice(0, 600) : '';
    if (!preset && !custom) throw new HttpError(400, 'בחרו פעולה או כתבו הוראה');
    const schema = await this.content.schema();
    const field = fieldFor(schema, key);
    if (!field || field.type === 'image') throw new HttpError(400, 'שדה לא נתמך');
    const doc = await this.content.doc(slug);
    const entry = verseId ? doc.verses?.[verseId]?.[key] : doc.fields?.[key];
    const current = entry?.draft ?? entry?.published;
    let context = `פרשת ${doc.meta?.name} (${doc.meta?.rangeHe}).`;
    if (verseId) {
      const v = (await this.content.verses(doc)).find((x) => x.id === verseId);
      if (v) context += `\nפסוק (${v.ref}): ${v.h}\nאונקלוס: ${v.o}`;
    }
    const shape =
      field.type === 'list'
        ? `{"items":[{${field.item.map((s: any) => `"${s.key}":"…"`).join(',')}}]}`
        : field.type === 'stringList'
          ? '{"items":["…"]}'
          : field.type === 'group'
            ? `{${field.subfields.map((s: any) => `"${s.key}":"…"`).join(',')}}`
            : '{"text":"…"}';
    const variant = key.split('.')[1];
    const user = `${context}
שדה: ״${field.label}״${variant ? ` (${variant === 'child' ? 'ילדים' : 'מבוגרים'})` : ''}.${field.help ? ` הנחיה לשדה: ${field.help}` : ''}
${current ? `הטקסט הנוכחי:\n<<<${typeof current === 'string' ? current : JSON.stringify(current)}>>>` : 'אין עדיין טקסט — כתוב/כתבי מאפס.'}
מה לעשות: ${[preset?.instruction, custom].filter(Boolean).join(' ')}
החזר/י ${shape}.`;
    const res = await this.call(provider, model, SYSTEM, user, 1800);
    const o = res.json;
    const value = field.type === 'list' || field.type === 'stringList' ? o?.items : field.type === 'group' ? o : o?.text;
    if (value == null || (typeof value === 'string' && !value.trim())) throw new HttpError(502, 'המודל החזיר תשובה ריקה');
    const { price } = await priceFor(provider, model, this.fetchImpl);
    const source = `ai:${provider}:${model}`;
    const saved = verseId ? await this.content.saveVerseField(slug, verseId, key, value, source) : await this.content.saveField(slug, key, value, source);
    return { ...saved, usd: Math.round(((res.inTokens * price.in + res.outTokens * price.out) / 1e6) * 10000) / 10000 };
  }
}

type Job = {
  id: string;
  task: string;
  label: string;
  provider: Provider;
  model: string;
  slugs: string[];
  status: 'running' | 'done' | 'failed' | 'cancelled';
  total: number;
  done: number;
  saved: number;
  usd: number;
  errors: string[];
  startedAt: string;
  finishedAt?: string;
  cancelled: boolean;
};

function publicJob(j: Job) {
  const { cancelled: _c, ...rest } = j;
  return { ...rest, errors: j.errors.slice(-20) };
}
