// יישור עברית–ארמית (טיוטה): מודל א׳ מציע, מודל ב׳ בודק, ובדיקה מכנית של האינדקסים והמילים.
// שימוש: OPENROUTER_API_KEY=... node scripts/align/generate.mjs bereshit noach
import fs from 'node:fs';
const KEY = process.env.OPENROUTER_API_KEY;
const GEN = process.env.ALIGN_MODEL || 'anthropic/claude-opus-5.5';
const REV = process.env.REVIEW_MODEL || 'openai/gpt-5.6-sol';
let usage = { in: 0, out: 0, cost: 0 };

async function call(model, system, user) {
  for (let a = 0; a < 3; a++) {
    try {
      const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(240000),
        body: JSON.stringify({ model, messages: [{ role: 'system', content: system }, { role: 'user', content: user }], temperature: 0, max_tokens: 16000, response_format: { type: 'json_object' }, usage: { include: true } }),
      });
      const j = await r.json();
      process.stderr.write(`· ${model} ${r.status}\n`);
      if (!j.choices) throw new Error(JSON.stringify(j).slice(0, 300));
      usage.in += j.usage?.prompt_tokens ?? 0; usage.out += j.usage?.completion_tokens ?? 0; usage.cost += j.usage?.cost ?? 0;
      const t = j.choices[0].message.content.replace(/^```json\s*|```\s*$/g, '');
      return JSON.parse(t);
    } catch (e) { console.error('retry', model, String(e).slice(0, 200)); }
  }
  throw new Error('failed');
}

const SYS = `You are an expert in Targum Onkelos and Biblical Hebrew. Align each Hebrew verse with Onkelos at PHRASE level.
Input: verses with numbered Hebrew tokens and numbered Aramaic tokens (0-based).
Output JSON: {"verses":[{"id":..., "pairs":[{"he":[start,end],"ar":[start,end],"heText":"exact tokens joined by single space","arText":"exact tokens joined by single space","type":"literal|reverence|expansion|reorder","note":"Hebrew, max 14 words, plain language, only for non-literal","confidence":0..1}]}]}
Rules:
- Segment each verse into short meaning phrases (1-4 Hebrew tokens), covering the whole verse in order where possible; ranges inclusive; no overlaps.
- type "reverence": Onkelos changes wording out of respect for God (e.g. וירא ה' → ואתגלי ה', anthropomorphism avoided, "before" יי, מימרא, יקרא, שכינתא; אלהים→יי is NOT reverence by itself, treat as literal name rendering).
- type "expansion": Onkelos adds interpretive content/explains a metaphor/changes meaning (e.g. נפש חיה → רוח ממללא).
- type "reorder": same content, notably different word order.
- Otherwise "literal" (including normal grammar, prefixes, ית, name renderings, synonyms).
- heText/arText must be EXACTLY the tokens at those indices. Be conservative: if unsure, give confidence < 0.8.
- Notes: concise Hebrew a layperson understands, e.g. "אונקלוס מוסיף: ׳רוח מדברת׳ — האדם ייחודי בדיבור". No note for literal.`;

const REVSYS = `You are a strict reviewer of Targum Onkelos alignments. For each candidate (non-literal phrase pair with Hebrew note), decide if the alignment (which Aramaic words correspond) AND the type AND the note are accurate and not misleading. Output JSON {"results":[{"key":..., "ok":true|false, "reason":"short"}]}. Reject anything doubtful.`;

function check(v, p) {
  const ok = (r, n) => Array.isArray(r) && r.length === 2 && Number.isInteger(r[0]) && Number.isInteger(r[1]) && r[0] >= 0 && r[1] >= r[0] && r[1] < n;
  if (!ok(p.he, v.he.length) || !ok(p.ar, v.ar.length)) return 'range';
  // השוואה לפי אותיות בלבד (המודל לפעמים משבש ניקוד בהעתקה; האינדקסים הם הקובעים)
  const bare = (t) => String(t ?? '').normalize('NFC').replace(/[\u0591-\u05C7]/g, '').replace(/[^\u05D0-\u05EA]/g, '');
  if (bare(v.he.slice(p.he[0], p.he[1] + 1).join(' ')) !== bare(p.heText)) return 'heText';
  if (bare(v.ar.slice(p.ar[0], p.ar[1] + 1).join(' ')) !== bare(p.arText)) return 'arText';
  if (!['literal', 'reverence', 'expansion', 'reorder'].includes(p.type)) return 'type';
  if (p.type !== 'literal' && !(p.note && p.note.length < 120)) return 'note';
  return null;
}

async function pool(items, n, fn) { const out = []; let i = 0; await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k], k); } })); return out; }

for (const pid of process.argv.slice(2)) {
  const t0 = Date.now();
  const rows = JSON.parse(fs.readFileSync(`.cache/align-${pid}.json`, 'utf8'));
  const batches = []; for (let i = 0; i < rows.length; i += 8) batches.push(rows.slice(i, i + 8));
  const res = await pool(batches, 5, async (b) => {
    const user = b.map((v) => `id: ${v.id}\nHE: ${v.he.map((w, i) => `${i}:${w}`).join(' ')}\nAR: ${v.ar.map((w, i) => `${i}:${w}`).join(' ')}`).join('\n\n');
    const r = (await call(GEN, SYS, user)).verses;
    fs.mkdirSync('.cache/align-raw', { recursive: true });
    fs.writeFileSync(`.cache/align-raw/${pid}-${b[0].id}.json`, JSON.stringify(r));
    return r;
  });
  const out = { parasha: pid, generatedBy: GEN, reviewedBy: REV, generatedAt: new Date().toISOString(), verses: {} };
  const stats = { pairs: 0, dropped: 0, uncertain: 0, deviations: 0 };
  const candidates = [];
  for (const v of res.flat()) {
    const row = rows.find((r) => r.id === v?.id); if (!row) continue;
    const pairs = [];
    let lastHe = -1, lastAr = -1;
    for (const p of v.pairs ?? []) {
      const err = check(row, p);
      if (err || p.he[0] <= lastHe) { stats.dropped++; (stats.why ??= {})[err ?? 'order'] = ((stats.why ?? {})[err ?? 'order'] ?? 0) + 1; continue; }
      lastHe = p.he[1];
      const q = { he: p.he, ar: p.ar, type: p.type, ...(p.note && p.type !== 'literal' ? { note: p.note } : {}), status: p.confidence >= 0.8 ? 'draft' : 'uncertain' };
      if (q.status === 'uncertain') stats.uncertain++;
      pairs.push(q); stats.pairs++;
      if (q.type !== 'literal' && q.status === 'draft') candidates.push({ key: `${row.id}#${pairs.length - 1}`, he: p.heText, ar: p.arText, type: p.type, note: p.note, verseHe: row.he.join(' '), verseAr: row.ar.join(' ') });
    }
    out.verses[row.id] = pairs;
  }
  // סקירה של מודל שני: רק הביטויים שאינם מילוליים (שם הסיכון)
  const rb = []; for (let i = 0; i < candidates.length; i += 15) rb.push(candidates.slice(i, i + 15));
  const verdicts = (await pool(rb, 4, async (b) => (await call(REV, REVSYS, JSON.stringify(b))).results ?? [])).flat();
  for (const c of candidates) {
    const v = verdicts.find((x) => x.key === c.key);
    const [id, idx] = c.key.split('#');
    const p = out.verses[id][Number(idx)];
    if (v?.ok) stats.deviations++;
    else { p.status = 'uncertain'; p.review = v?.reason ?? 'no verdict'; stats.uncertain++; }
  }
  out.stats = { ...stats, seconds: Math.round((Date.now() - t0) / 1000) };
  fs.writeFileSync(`content/alignment/${pid}.json`, JSON.stringify(out, null, 1) + '\n');
  console.log(pid, JSON.stringify(out.stats), JSON.stringify(usage));
}
console.log('TOTAL', JSON.stringify(usage));
