/** משיכת טקסט מ-Sefaria (פסוק, אונקלוס, הפטרה) — רק לכתובת הקבועה, רק לפי הפניה תקינה. */
const REF_RE = /^(?:Onkelos )?(?:I{1,2} )?[A-Z][a-z]+(?: [A-Z][a-z]+)? \d{1,3}:\d{1,3}(?:-(?:\d{1,3}:)?\d{1,3})?$/;
const cache = new Map<string, { at: number; text: string[] }>();

function strip(s: string) {
  return s
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function flatten(t: unknown): string[] {
  if (typeof t === 'string') return [strip(t)];
  if (Array.isArray(t)) return t.flatMap(flatten);
  return [];
}

export function validRef(ref: string) {
  return typeof ref === 'string' && ref.length < 60 && REF_RE.test(ref.trim());
}

export async function sefariaText(ref: string, opts: { version?: 'hebrew' | 'source'; fetchImpl?: typeof fetch } = {}): Promise<string[]> {
  if (!validRef(ref)) throw new Error('הפניה לא תקינה');
  const key = `${ref}|${opts.version ?? ''}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < 24 * 3600 * 1000) return hit.text;
  const apiRef = ref.trim().replace(/ (\d)/, '.$1').replace(/:/g, '.');
  const url = new URL(`https://www.sefaria.org/api/v3/texts/${encodeURIComponent(apiRef)}`);
  if (opts.version === 'hebrew') url.searchParams.set('version', 'hebrew|Tanach with Nikkud');
  const res = await (opts.fetchImpl ?? fetch)(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`Sefaria ${res.status}`);
  const d = (await res.json()) as any;
  const v = (d.versions ?? []).find((x: any) => x.language === 'he') ?? d.versions?.[0];
  const text = flatten(v?.text).filter(Boolean);
  if (!text.length) throw new Error('Sefaria: לא נמצא טקסט');
  cache.set(key, { at: Date.now(), text });
  if (cache.size > 500) cache.delete(cache.keys().next().value as string);
  return text;
}
