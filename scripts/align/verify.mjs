// אחרי היצירה: מוסיף heText/arText לכל ביטוי (לסקירה באדמין) ובודק שוב מול הטקסט.
import fs from 'node:fs';
for (const pid of process.argv.slice(2)) {
  const f = `content/alignment/${pid}.json`;
  const doc = JSON.parse(fs.readFileSync(f, 'utf8'));
  const rows = Object.fromEntries(JSON.parse(fs.readFileSync(`.cache/align-${pid}.json`, 'utf8')).map((r) => [r.id, r]));
  const c = { draft: 0, uncertain: 0, literal: 0, reverence: 0, expansion: 0, reorder: 0, verses: 0 };
  for (const [id, pairs] of Object.entries(doc.verses)) {
    c.verses++;
    for (const p of pairs) {
      p.heText = rows[id].he.slice(p.he[0], p.he[1] + 1).join(' ');
      p.arText = rows[id].ar.slice(p.ar[0], p.ar[1] + 1).join(' ');
      c[p.status]++;
      if (p.status === 'draft') c[p.type]++;
    }
  }
  fs.writeFileSync(f, JSON.stringify(doc, null, 1) + '\n');
  console.log(pid, JSON.stringify(c));
}
